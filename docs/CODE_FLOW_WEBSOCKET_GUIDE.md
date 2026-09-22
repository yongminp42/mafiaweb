# MAFIAGAME 코드 흐름과 WebSocket/STOMP 개발 실습

> 기준: 이 저장소의 현재 `src/main/**` 소스. 아래 코드 블록은 설명에 필요한 **발췌**이며, 전체 소스는 각 파일 링크에서 확인한다. 기존의 전체 개발 순서·환경 준비는 [프로젝트 학습 가이드](PROJECT_LEARNING_GUIDE.md)를 먼저 읽는다. 이 문서는 *코드를 읽고 다음 실시간 기능을 직접 추가하는 방법*에 집중한다.

## 1. 먼저 실행 경로를 구분하자

이 프로젝트에는 두 종류의 요청이 있다.

| 구분 | 시작 | 서버 입구 | 결과 |
| --- | --- | --- | --- |
| HTTP | 주소 입력, 링크, 폼 제출 | `@GetMapping` / `@PostMapping` | HTML 렌더링 또는 리다이렉트 |
| WebSocket/STOMP | 페이지의 JavaScript | `/ws` 연결 후 `@MessageMapping` | 구독 중인 브라우저에 실시간 메시지 전달 |

브라우저에서 `GET /rooms/1`을 요청하면 화면 HTML이 한 번 만들어진다. 이후 방 참가자·채팅·게임 상태의 변경은 같은 페이지에서 WebSocket으로 받는다. `GET /rooms/1`과 STOMP `SEND /app/rooms/1/join`은 전혀 다른 요청이다.

```text
브라우저
  ├─ HTTP GET /rooms/1 ─→ Spring Security → RoomController
  │                                         → RoomService → RoomMapper → MariaDB
  │                                         → rooms/detail.html → 브라우저
  └─ WebSocket /ws ─────→ WebSocketConfig → STOMP CONNECT
                                             → SUBSCRIBE / SEND
                                             → WebSocketAuthorizationInterceptor
                                             → RoomPresenceController / ChatController / RoomGameController
                                             → Service → SimpMessagingTemplate → 구독 중인 브라우저
```

실제 엔트리포인트는 [MafiagameApplication.java](../src/main/java/kr/or/oti/mafiagame/MafiagameApplication.java), HTTP 접근 규칙은 [SecurityConfig.java](../src/main/java/kr/or/oti/mafiagame/config/SecurityConfig.java)에 있다.

## 2. 실제 HTTP 코드 따라 읽기: 방 목록에서 방 상세까지

### 2.1 방 목록

[RoomController.java](../src/main/java/kr/or/oti/mafiagame/controller/RoomController.java)의 핵심 부분:

```java
@GetMapping({"/", "/rooms"})
public String roomList(Model model) {
    Map<Long, Integer> liveCounts = roomPresenceService.currentCounts();
    List<RoomView> rooms = roomService.getRooms().stream()
            .map(room -> room.withPlayerCount(liveCounts.getOrDefault(room.roomId(), 0)))
            .toList();
    model.addAttribute("rooms", rooms);
    // 온라인 인원 계산 후
    return "rooms/list";
}
```

`RoomService.getRooms()`는 `RoomMapper.findAll()`을 호출한다. 실제 SQL은 [RoomMapper.xml](../src/main/resources/mappers/RoomMapper.xml)의 `<select id="findAll">`에 있고, 결과는 `RoomSummary`를 거쳐 `RoomView`로 바뀐다. 컨트롤러는 DB의 멤버 수 대신 `RoomPresenceService.currentCounts()`의 *현재 연결된 인원*으로 화면 숫자를 덮어쓴다. `return "rooms/list"`는 [rooms/list.html](../src/main/resources/templates/rooms/list.html)을 렌더링한다.

읽는 순서: `RoomController.roomList` → [RoomService.java](../src/main/java/kr/or/oti/mafiagame/service/RoomService.java)의 `getRooms` → [RoomMapper.java](../src/main/java/kr/or/oti/mafiagame/dao/RoomMapper.java)의 `findAll` → `RoomMapper.xml` → `rooms/list.html`.

### 2.2 방 생성과 상세 화면

`POST /rooms`는 폼 입력을 받아 `RoomService.createRoom`을 호출한다. 서비스는 제목·인원·비밀번호 길이를 검사하고 비밀번호를 해시한 다음, 방과 방장 멤버 행을 저장한다. 성공하면 `redirect:/rooms/{roomId}`로 이동한다. 상세 요청은 `RoomController.roomDetail`이 방 정보를 읽고, 잠금 방이라면 HTTP 세션의 `RoomAccess`를 확인한다. 입장이 허용된 경우 [rooms/detail.html](../src/main/resources/templates/rooms/detail.html)이 출력된다.

상세 HTML은 `stomp-client.js`를 먼저, `chat.js`를 나중에 로드한다. 따라서 `chat.js`는 `window.MafiaStomp`의 함수들을 사용할 수 있다. `body`의 `data-room-id` 등 화면 데이터는 JavaScript가 목적지 주소를 만들 때 사용한다. 이 값은 화면 편의를 위한 값일 뿐, 서버의 권한 검사를 대체하지 않는다.

### 2.3 인증 정보가 WebSocket에 이어지는 방법

로그인은 Spring Security의 HTTP 세션에 인증 정보를 남긴다. 브라우저가 같은 출처의 `/ws`로 연결하면 handshake 요청에 기존 쿠키가 실린다. [WebSocketConfig.java](../src/main/java/kr/or/oti/mafiagame/config/WebSocketConfig.java)의 `HttpSessionHandshakeInterceptor`는 HTTP 세션 속성을 WebSocket 세션에 복사한다. 잠금 방 입장 성공 시 `RoomAccess.grant(session, roomId)`가 저장한 값은 `RoomPresenceController.join`에서 `RoomAccess.isGranted(headers.getSessionAttributes(), roomId)`로 검사한다.

`SecurityConfig`의 `/ws/**.permitAll()`은 **handshake URL 접근**을 허용한다는 뜻이다. 특정 방 메시지의 전송·구독 권한은 별도 검사한다.

## 3. WebSocket과 STOMP를 처음부터 이해하기

WebSocket은 HTTP로 시작한 연결을 `Upgrade: websocket` handshake를 통해 오래 유지되는 양방향 연결로 바꾼다. 성공 응답은 `101 Switching Protocols`다. `GET /ws`만 보내는 일반 `curl` 요청이 `400`을 받는 것과 WebSocket 실패는 같지 않다.

STOMP는 이 연결 위에서 사용하는 메시지 형식이다. 이 프로젝트는 외부 STOMP 브라우저 라이브러리 대신 [stomp-client.js](../src/main/resources/static/js/stomp-client.js)에서 최소한의 프레임 생성·파싱·heartbeat·재연결을 직접 구현한다.

```javascript
function createFrame(command, headers = {}, body = '') {
  const headerLines = Object.entries(headers)
    .map(([key, value]) => `${escapeHeader(key)}:${escapeHeader(value)}`)
    .join('\n');
  const headerBlock = headerLines ? `${headerLines}\n` : '';
  return `${command}\n${headerBlock}\n${body}\0`;
}
```

`CONNECT`는 STOMP 세션 시작, `CONNECTED`는 서버 승인, `SUBSCRIBE`는 수신 주소 등록, `SEND`는 서버로 메시지 전달, `MESSAGE`는 서버가 보낸 데이터, `ERROR`는 프로토콜 오류다. 프레임은 명령·헤더·빈 줄·본문·널 문자(`\0`)로 구성된다. `createFrameParser`는 WebSocket 이벤트 한 번에 여러 프레임이 들어오거나 프레임이 나뉘어 올 수 있으므로 버퍼에 모아 `\0` 단위로 끊는다.

서버의 설정 발췌:

```java
registry.enableSimpleBroker("/topic", "/queue")
        .setTaskScheduler(webSocketTaskScheduler())
        .setHeartbeatValue(new long[] {10_000, 10_000});
registry.setApplicationDestinationPrefixes("/app");
registry.setUserDestinationPrefix("/user");

registry.addEndpoint("/ws")
        .addInterceptors(new HttpSessionHandshakeInterceptor())
        .setAllowedOriginPatterns("https://mafiaweb01.duckdns.org");
```

주소의 의미는 서로 다르다.

| 주소 | 의미 |
| --- | --- |
| `/ws` | 실제 WebSocket handshake URL. STOMP 메시지 목적지가 아니다. |
| `/app/...` | 클라이언트가 서버의 `@MessageMapping`으로 보내는 목적지. |
| `/topic/...` | 여러 구독자가 받는 공개 방송 목적지. |
| `/user/queue/...` | 현재 사용자에게 전달되는 개인 목적지. 실제 대상 사용자 결정은 서버가 한다. |

`/app` 접두사는 서버가 매핑할 때 제거된다. 즉 `SEND /app/rooms/1/chat` → `@MessageMapping("/rooms/{roomId}/chat")`이다. 반대로 `/topic`은 컨트롤러를 호출하지 않고 브로커 구독 대상으로 쓰인다.

현재 소스의 허용 Origin은 운영 도메인 하나로 설정되어 있다. 로컬의 다른 Origin에서 접속하는 실습은 별도 설정이 필요할 수 있다. 배포 도메인이 바뀌면 이 값과 프록시 설정을 함께 점검해야 한다. 허용 Origin을 무조건 `*`로 넓히지 않는다.

## 4. 방 페이지가 연결되는 실제 순서

[chat.js](../src/main/resources/static/js/chat.js)는 현재 페이지의 프로토콜로 `ws://` 또는 `wss://`를 선택한다.

```javascript
const socketUrl = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`;
const connection = new WebSocket(socketUrl);
connection.addEventListener('open', () => {
  connection.send(createFrame('CONNECT', {
    'accept-version': '1.2',
    host: location.host,
    'heart-beat': '10000,10000'
  }));
});
```

중요: 브라우저의 WebSocket `open`은 전송 연결이 열린 것이고, STOMP `CONNECTED`는 메시징 연결이 승인된 것이다. 이 둘은 같은 이벤트가 아니다.

```text
1. GET /rooms/{id} → HTML과 JS 로드
2. GET /ws + Upgrade → 101 WebSocket 연결
3. STOMP CONNECT → CONNECTED
4. SUBSCRIBE /user/queue/errors, /user/queue/room-joined
5. SEND /app/rooms/{id}/join
6. 서버가 입장·비밀번호·정원·게임 상태 검사
7. 현재 사용자에게 MESSAGE /user/queue/room-joined
8. 그제야 방의 /topic/rooms/{id}/presence, /chat, /game 및 개인 큐 구독
9. SEND /app/rooms/{id}/presence/sync, /game/sync → 재접속 시 상태 복원
```

5~8단계의 순서가 중요하다. 아직 참가자로 등록되지 않은 세션이 방 토픽을 구독하면 [WebSocketAuthorizationInterceptor.java](../src/main/java/kr/or/oti/mafiagame/config/WebSocketAuthorizationInterceptor.java)가 거부한다. `chat.js`는 `room-joined` 수신 뒤에 `subscribeRoomTopics()`를 호출한다. 새 기능을 만들 때도 “입장 확인 전 구독”을 끼워 넣지 않는다.

인터셉터는 STOMP 명령별로 검사한다. 아래는 방 토픽 구독 검사에서 핵심인 부분이다.

```java
requirePrincipal(message, accessor);
long roomId = Long.parseLong(matcher.group(1));
if (!roomPresenceService.isParticipant(roomId, accessor.getSessionId())) {
    throw denied(message, "먼저 게임방에 입장해 주세요.");
}
```

인증 사용자라는 사실만으로는 충분하지 않다. **그 WebSocket 세션이 바로 그 방에 참가했는지** 확인한다. `/user/...` 개인 큐도 인증 주체가 필요하다. `SEND` 검사에서는 `join`만 참가 전에 허용하고, 나머지 방 명령은 참가 후에만 허용한다.

로비는 [room-list.js](../src/main/resources/static/js/room-list.js)에서 같은 `/ws`에 연결하지만, `/topic/rooms/presence`를 구독하고 `/app/rooms/presence`에 초기 상태를 요청한다. 로비 연결과 특정 방 입장은 다른 개념이다.

## 5. 실제 메시지 흐름 세 가지

### 5.1 방 입장·Ready·퇴장

`RoomPresenceController.join`은 세션 ID, 인증 주체, 잠금 방 접근 여부를 `RoomPresenceService.join`에 전달한다. 서비스는 검증을 먼저 하고 메모리의 참가자/세션 관계를 갱신한다. 한 사람이 탭을 여러 개 열어도 사용자 한 명으로 세며, 연결 세션은 별도로 추적한다. `RoomPresenceState`를 반환하면 `@SendToUser("/queue/room-joined", broadcast = false)`가 해당 세션으로 입장 결과를 보낸다.

```java
@MessageMapping("/rooms/{roomId}/ready")
public void updateReady(
        @DestinationVariable("roomId") long roomId,
        RoomReadyRequest request,
        SimpMessageHeaderAccessor headers) {
    roomPresenceService.updateReady(roomId, headers.getSessionId(), request);
}
```

버튼 클릭 → `SEND /app/rooms/{id}/ready`와 `{"ready":true}` → 컨트롤러 → 서비스가 **같은 세션의 참가 여부와 WAITING 상태**를 검사 → 상태를 바꾸고 `/topic/rooms/{id}/presence`에 방송한다. 다른 사람의 화면도 바로 갱신된다. 클라이언트의 버튼 비활성화는 사용성 기능이며, 서버 검증이 실제 규칙이다.

`SessionDisconnectEvent`가 발생하면 서비스가 세션을 제거한다. 같은 사용자의 다른 탭이 남았으면 참가자를 유지한다. 게임 중 일시적인 새로고침과 실제 이탈을 구분하기 위한 유예도 있다. 관련 설정은 [application.properties](../src/main/resources/application.properties)의 `mafiagame.room.*` 값이다.

### 5.2 일반 채팅

```text
chat.js 폼 제출
  → STOMP SEND /app/rooms/{id}/chat {"content":"안녕하세요"}
  → WebSocketAuthorizationInterceptor: 인증 + 해당 세션의 방 참가 검사
  → ChatController.sendMessage
  → ChatService.createMessage: 로그인·참가·빈 문자열·300자 제한·게임 단계 검사
  → RoomGameService.broadcastPublicChat (게임 진행 규칙 반영)
  → /topic/rooms/{id}/chat 등 허용된 수신자에게 전달
  → chat.js handleFrame → appendMessage
```

[ChatMessageRequest.java](../src/main/java/kr/or/oti/mafiagame/dto/ChatMessageRequest.java)는 요청의 `content`만 받는다. [ChatService.java](../src/main/java/kr/or/oti/mafiagame/service/ChatService.java)는 서버의 인증 주체에서 발신자 이름을 만들고 [ChatMessage.java](../src/main/java/kr/or/oti/mafiagame/dto/ChatMessage.java)를 생성한다. **클라이언트가 보낸 `sender`를 신뢰하지 않는 것**이 핵심이다. 게임 단계에 따라 일반 채팅이 아닌 개인 큐로 전달될 수 있으므로, 단순히 “모든 메시지는 항상 공개 토픽으로 방송”한다고 가정하지 않는다.

마피아 채팅은 `/app/rooms/{id}/mafia-chat`로 따로 들어온다. [RoomGameService.java](../src/main/java/kr/or/oti/mafiagame/service/RoomGameService.java)는 현재 게임 역할·생존·단계를 확인한 뒤 허용 사용자에게만 개인 전달한다. 화면의 채널 선택만으로 권한을 판단하지 않는다.

```java
for (String principalName : recipients) {
    messagingTemplate.convertAndSendToUser(
            principalName,
            MAFIA_CHAT_DESTINATION,
            message);
}
```

여기서 `recipients`는 서버가 **현재 게임의 생존 마피아**로 골라낸 인증 사용자 이름 목록이다. 이전 게임에서 받은 메시지 구독이 브라우저에 남아 있어도, 서버가 현재 수신자를 다시 선택한다. 죽은 사용자의 일반 채팅 역시 공개 토픽이 아닌 별도 개인 큐로 라우팅한다.

### 5.3 게임 시작과 행동

`SEND /app/rooms/{id}/start` → `RoomPresenceController.startGame` → `RoomPresenceService.startGame`이 방장·4~8명·전원 Ready·DB 상태를 확인 → `RoomGameService.startGame`이 역할을 배정하고 첫 페이즈를 만든다. 공개 게임 상태는 `/topic/rooms/{id}/game`, 개인 역할은 `/user/queue/game-role`로 분리된다.

투표·밤 행동은 `SEND /app/rooms/{id}/game`에 [GameActionRequest.java](../src/main/java/kr/or/oti/mafiagame/dto/GameActionRequest.java)의 필드(`targetUserId`, `execute`, `action`)로 보낸다. `RoomGameService.submitAction`은 해당 방의 잠금 안에서 역할·생존·페이즈·마감시간·중복 제출을 검사한다. 타이머가 바뀌는 순간 두 요청이 동시에 와도 서버 상태를 기준으로 결정하려는 구조다. 규칙 계산은 [RoomGameRules.java](../src/main/java/kr/or/oti/mafiagame/service/RoomGameRules.java), 시간 예약은 [GamePhaseScheduler.java](../src/main/java/kr/or/oti/mafiagame/service/GamePhaseScheduler.java)에서 더 살펴볼 수 있다.

## 6. 목적지 주소표: 새 기능 추가 전에 대조하기

| 브라우저의 SEND | 서버 입구 | 대표 응답/방송 |
| --- | --- | --- |
| `/app/rooms/presence` | `RoomPresenceController.sendRoomCounts` | `/topic/rooms/presence` |
| `/app/rooms/{id}/join` | `RoomPresenceController.join` | `/user/queue/room-joined` |
| `/app/rooms/{id}/presence/sync` | `RoomPresenceController.syncPresence` | `/user/queue/presence-synced` |
| `/app/rooms/{id}/ready` | `RoomPresenceController.updateReady` | `/topic/rooms/{id}/presence` |
| `/app/rooms/{id}/start` | `RoomPresenceController.startGame` | `/topic/rooms/{id}/presence`, `/game`, 개인 역할 큐 |
| `/app/rooms/{id}/chat` | `ChatController.sendMessage` | `/topic/rooms/{id}/chat` 등 게임 규칙에 따른 수신자 |
| `/app/rooms/{id}/mafia-chat` | `ChatController.sendMafiaMessage` | 허용 사용자 개인 `/user/queue/mafia-chat` |
| `/app/rooms/{id}/game` | `RoomGameController.submitAction` | 공개 게임 상태 및 필요 시 개인 큐 |
| `/app/rooms/{id}/game/sync` | `RoomGameController.syncState` | 공개 게임 상태, 본인 역할/결과 복원 |

오류는 `RoomWebSocketException`을 컨트롤러의 `@MessageExceptionHandler`가 `ChatError`로 변환해 `/user/queue/errors`로 보낸다. 다만 interceptor 단계의 권한 거부는 컨트롤러 예외 처리와 경로가 다를 수 있으므로, 연결 자체가 닫혔는지와 개인 오류 메시지가 왔는지를 구분해 살핀다.

## 7. 다음 실시간 기능을 개발하는 순서

예시: “방장이 공지 문구를 보내면 그 방 참가자 화면에 실시간 표시” 기능을 **설계 연습**으로 생각해 보자. 아래는 기존 코드에 아직 없는 기능이며, 복사만 하면 완성되는 패치가 아니다.

1. **계약 정의**: 입력은 공지 텍스트, 출력은 방 ID·작성자·문구·시각을 담은 DTO로 정한다. 최대 길이와 빈 문자열 처리도 정한다.
2. **주소 선택**: 보내기는 `/app/rooms/{id}/notice`, 받기는 `/topic/rooms/{id}/notice`처럼 기존 규칙과 일치시킨다. 다른 사용자에게 보여서는 안 되는 값은 `/user/queue/...`를 쓴다.
3. **권한 확장**: `WebSocketAuthorizationInterceptor`의 `ROOM_SEND_PATTERN`과 `ROOM_TOPIC_PATTERN`을 함께 점검한다. 단순 정규식 허용 외에 *방장 여부*는 서버 서비스에서 검증해야 한다.
4. **DTO/컨트롤러 작성**: `@MessageMapping("/rooms/{roomId}/notice")`가 요청 DTO와 세션/Principal을 받아 서비스에 전달한다. 컨트롤러에 규칙·DB 처리 코드를 몰아넣지 않는다.
5. **서비스 검증과 방송**: 방 참가·방장·문구 길이를 확인하고 정상일 때만 `SimpMessagingTemplate.convertAndSend`로 보낸다. 오류는 해당 사용자에게만 알려준다.
6. **클라이언트 구독**: `chat.js`의 `subscribeRoomTopics`에 공지 토픽을 추가한다. 현재 구조처럼 입장 성공 이후에만 구독한다. `handleFrame`에 해당 메시지 렌더링 분기를 넣고, 화면 HTML에도 출력 위치를 둔다.
7. **재접속 설계**: 공지가 최근 상태여야 한다면 DB/서버 상태에 저장하고 별도 sync를 만든다. 방송만 하면 오프라인·새로고침 사용자는 과거 공지를 받을 수 없다.
8. **검증**: 정상 방장, 일반 참가자의 위조 SEND, 미참가자의 SUBSCRIBE, 다른 방 ID, 여러 탭, 새로고침, 재접속, 빈/긴 텍스트를 테스트한다.

이 프로젝트에서 기능 개발 시 보통 수정하는 묶음은 `dto` → `config/WebSocketAuthorizationInterceptor` → `controller` → `service` → `templates`/`static/js` → 테스트다. 주소 하나를 추가했다고 끝나지 않는다. 입력 규칙·구독 권한·재접속 후 상태를 한 기능으로 함께 설계한다.

## 8. 개발자가 직접 확인하는 방법

### 8.1 로컬 실행과 화면

프로젝트 설정의 MariaDB 주소는 `localhost:23306/mafiaweb`이고 계정은 `DB_USERNAME`, `DB_PASSWORD` 환경 변수로 받는다. 비밀번호를 소스나 문서에 넣지 않는다. 로컬에서 `/rooms`를 열었을 때 DB 오류가 나면, 먼저 현재 실행 프로세스에 이 변수와 DB 연결 권한이 있는지 확인한다. `GET /login`만 되는 것은 DB 조회가 필요한 `/rooms`의 정상 동작을 보증하지 않는다.

### 8.2 브라우저 개발자 도구

1. `F12` → Network → WS를 연 다음 방 페이지를 새로고침한다.
2. `/ws` 요청이 `101 Switching Protocols`인지 본다. `101`은 **전송 연결**만 증명한다.
3. Frames/Messages에서 `CONNECT` → `CONNECTED` → `SUBSCRIBE` → `SEND join` → `MESSAGE room-joined` 순서를 본다.
4. 채팅 한 건을 보내 `SEND /app/.../chat`과 수신 `MESSAGE`의 목적지·본문을 비교한다.
5. Console의 WebSocket 오류와 서버 로그를 **같은 시각**으로 맞춰 본다.

`101`인데 화면이 멈춘다면 STOMP `CONNECTED` 여부, `room-joined` 수신, 권한 거부, `handleFrame`의 분기를 봐야 한다. `403` handshake는 Origin/인증/보안 설정 가능성을 나누어 보고, 응답 헤더만으로 원인을 단정하지 않는다.

`chat.js`는 연결이 닫히면 화면 상태를 끊김으로 바꾸고 `createReconnectController(connect)`로 재시도한다. `stomp-client.js`의 재시도 간격은 대략 1초에서 최대 30초까지 지수적으로 증가하며 작은 무작위 지연을 더한다. 새 연결에서 `CONNECTED`를 받으면 재시도 횟수를 초기화하고, 다시 `join`한 뒤 구독과 sync를 수행한다. 재접속 시 “예전에 방에 있었으니 이번에도 참가했을 것”이라고 클라이언트가 추정하지 않는다.

참가자·게임 진행 중 상태는 현재 Java 프로세스의 메모리에 있다. 따라서 서버 재시작 시 현재 진행 중인 게임 상태가 자동 복구되는 구조는 아니다. 여러 EC2 인스턴스로 수평 확장하려면 공유 브로커와 상태 저장 설계를 별도로 해야 한다.

### 8.3 HTTPS 배포와 Nginx

이 프로젝트의 Spring Boot는 기본적으로 HTTP `8080`이며, Nginx가 TLS `443`을 받고 `/ws`를 프록시해야 한다. 브라우저는 HTTPS 페이지에서 `wss://도메인/ws`를 사용한다. Nginx의 해당 `listen 443 ssl` 서버 블록에는 WebSocket Upgrade 전달이 필요하다.

```nginx
location /ws {
    proxy_pass http://127.0.0.1:8080;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 3600s;
}
```

위 블록은 **학습용 예시**이며, 실제 서버 파일을 변경할 때는 기존 `server`/`location` 구조를 확인하고 `sudo nginx -t` 후 reload한다. `server.forward-headers-strategy=framework`는 프록시의 forwarded 정보를 애플리케이션이 해석하도록 하는 현재 설정이다.

### 8.4 서버에서 볼 곳

```bash
sudo systemctl status mafiagame --no-pager -l
sudo ss -lntp | grep ':8080'
sudo journalctl -u mafiagame -n 100 --no-pager
curl -i http://127.0.0.1:8080/rooms
```

`systemd` 서비스가 멈췄는데 `8080`이 응답하면 **다른 프로세스**가 포트를 쓰고 있을 수 있다. 먼저 PID와 실행 명령을 확인한다. `500`은 WebSocket 오류가 아니라 HTTP 애플리케이션 오류이며, 같은 시각의 예외 로그가 필요하다. 실행 중인 JAR를 같은 경로에 직접 덮어쓰지 말고 새 파일명으로 업로드한 뒤 서비스를 멈추고 교체·시작한다.

### 8.5 변경 후 검증

Java 또는 JavaScript를 수정했다면 실제 테스트/빌드를 실행하고 출력을 확인한다.

```text
Windows CMD: gradlew.bat test bootJar
Linux:       ./gradlew test bootJar
```

`test`에 JavaScript 테스트가 연결되어 있다. 성공/실패는 명령의 실제 종료 결과로 판단한다. 여러 사용자의 상호작용, 역할 정보 비공개, 재연결 등은 자동 테스트와 함께 수동으로도 확인한다. Playwright E2E는 요청받은 경우에만 실행한다.

## 9. 스스로 풀어보는 질문

1. `/rooms/{id}`가 200이어도 `/ws`가 실패할 수 있는 이유는 무엇인가?
2. `WebSocket.OPEN`과 STOMP `CONNECTED`는 어떻게 다른가?
3. 왜 `room-joined`보다 먼저 방 토픽을 구독하지 않는가?
4. 참가자 수가 DB의 `room_members` 숫자와 다를 수 있는 이유는 무엇인가?
5. 마피아 역할을 `/topic/rooms/{id}/game`에 방송하면 어떤 문제가 생기는가?
6. 클라이언트에서 버튼을 숨겨도 서버 서비스의 권한 검사가 필요한 이유는 무엇인가?
7. 새로고침 뒤 누락된 실시간 상태를 어떤 `sync` 요청으로 복구하는가?

각 답을 찾을 때는 위의 파일 링크에서 `@MessageMapping`, `convertAndSend`, `SUBSCRIBE`, `SEND`, `handleFrame`, `isParticipant`를 검색해 실제 호출 방향을 따라가면 된다.
