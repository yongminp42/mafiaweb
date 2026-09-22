# MAFIAGAME 프로젝트 학습 가이드

> Java와 Spring을 처음 배우는 사람이 MAFIAGAME을 실행하고, 한 기능의 흐름을 따라가며, 작은 기능을 직접 추가할 수 있도록 만든 교육용 문서다.
>
> 설명 기준은 현재 `src/main`의 실제 구현이다. 게임 기획의 전체 범위와 검증 체크리스트는 [MAFIAGAME MVP 문서](./MAFIAGAME_MVP.md)를 함께 참고한다.

## 이 문서를 읽고 나면

- 프로젝트를 로컬에서 실행할 수 있다.
- Spring Boot, Thymeleaf, Spring Security, MyBatis, MariaDB, WebSocket/STOMP의 역할을 설명할 수 있다.
- 회원가입, 방 생성, 방 입장, 채팅, 게임 진행 요청이 어느 파일을 지나는지 추적할 수 있다.
- DB에 저장되는 상태와 서버 메모리에 잠시 존재하는 실시간 상태를 구분할 수 있다.
- 클라이언트 버튼을 숨기는 것과 서버에서 권한을 검증하는 것의 차이를 이해할 수 있다.
- 같은 패턴으로 새로운 기능을 설계하고 구현 순서를 세울 수 있다.

처음부터 모든 파일을 읽지 않는다. 먼저 전체 구조를 보고, 그다음 하나의 사용자 행동을 입구부터 결과까지 따라간다.

추천 학습 순서는 다음과 같다.

1. 1~4장으로 실행 환경과 구조를 파악한다.
2. 5장에서 회원가입 또는 방 생성을 끝까지 추적한다.
3. 6장에서 WebSocket/STOMP의 메시지 흐름을 확인한다.
4. 7장에서 실제 게임 상태 전이와 서버 검증을 읽는다.
5. 8~10장의 실습·디버깅·자가 점검으로 복습한다.

---

## 1. 프로젝트를 한 문장으로 이해하기

MAFIAGAME은 브라우저에서 4~8명이 게임방에 모여 실시간으로 대화하고, 역할별 행동과 투표를 거쳐 승패를 확인하는 웹 마피아 게임이다.

현재 사용자가 경험하는 전체 흐름은 다음과 같다.

```text
회원가입/로그인
  → 로비에서 방 확인
  → 방 생성 또는 입장
  → 참가자 확인·Ready
  → 방장이 게임 시작
  → 역할 확인
  → 낮 토론·지목·최종 변론·처형 투표·밤 행동
  → 승패와 개인 결과 확인
  → 같은 방이 다시 WAITING 상태가 되어 재플레이
```

현재 구현된 주요 기능은 다음과 같다.

- 회원가입, 로그인, 로그아웃
- BCrypt 기반 비밀번호 해시 저장
- 로비의 방 목록·상태·잠금 여부·실시간 인원 표시
- 4~8명 게임방 생성, 선택적 비밀번호 입장
- 실시간 참가자·방장·Ready 상태 동기화
- 공개 채팅, 생존 마피아 전용 채팅, 사망자 전용 수신 흐름
- 방장·최소 인원·전원 Ready 검증
- 역할 확인, 낮, 지목 투표, 최종 변론, 처형 투표, 밤의 서버 타이머
- 마피아·의사·경찰·시민 역할과 승패 판정
- 새로고침·재접속 시 현재 상태 복원
- 게임 종료 후 같은 방을 다시 대기방으로 초기화

게임 이력의 영구 저장, 랭킹, 음성 채팅, 다중 서버용 분산 상태 저장은 현재 핵심 범위가 아니다.

---

## 2. 10분 만에 실행하기

### 2.1 필요한 프로그램

| 도구 | 이 프로젝트에서 하는 일 |
| --- | --- |
| JDK 17 | Java와 Spring Boot 실행 |
| Gradle Wrapper | 빌드·테스트·서버 실행 |
| Node.js 18 이상과 npm | 브라우저 JavaScript 테스트 실행 |
| MariaDB | 회원·방과 같은 영속 데이터 저장 |
| 웹 브라우저 | Thymeleaf 화면과 WebSocket 클라이언트 실행 |

Java 버전과 라이브러리 버전은 [build.gradle](../build.gradle)에 정의되어 있다. Gradle을 따로 설치하지 않아도 프로젝트의 `gradlew.bat`을 사용하면 된다.

### 2.2 데이터베이스 준비

애플리케이션은 기본적으로 다음 MariaDB를 바라본다.

```text
주소: localhost:23306
데이터베이스: mafiaweb
계정: DB_USERNAME 환경 변수
비밀번호: DB_PASSWORD 환경 변수
```

프로젝트 루트의 `mafiasql.sql`을 MariaDB의 `mafiaweb` 데이터베이스에 먼저 실행한다. DB 계정과 비밀번호는 소스 파일에 적지 않고 환경 변수로 전달한다.

PowerShell 예시는 다음과 같다. 값은 자신의 로컬 환경에 맞게 바꾼다.

```powershell
$env:DB_USERNAME = "mafia_app"
$env:DB_PASSWORD = "로컬_DB_비밀번호"
```

설정 이름은 [application.properties](../src/main/resources/application.properties)에서 확인할 수 있다. 이 파일은 `jdbc:mariadb://localhost:23306/mafiaweb`와 MyBatis Mapper 위치, 빈 방 정리 시간을 정의한다.

### 2.3 의존성 설치와 실행

프로젝트 루트에서 실행한다.

```powershell
npm ci
.\gradlew.bat test
.\gradlew.bat bootRun
```

`bootRun`은 서버를 계속 실행하는 명령이므로 테스트와 별도 터미널에서 실행하는 것이 편하다. 서버가 시작되면 [http://localhost:8080/rooms](http://localhost:8080/rooms)을 연다.

### 2.4 첫 기능 확인 순서

1. `/signup`에서 계정을 만든다.
2. `/login`에서 로그인한다.
3. `/rooms/new`에서 방을 만든다.
4. 다른 브라우저나 시크릿 창으로 여러 계정을 로그인한다.
5. 같은 방에 입장하고 전원이 `준비 완료`를 누른다.
6. 최소 4명이 모이면 방장이 게임을 시작한다.
7. 역할 확인부터 게임 종료까지 서버가 보내는 단계와 화면을 비교한다.

브라우저 한 개에서 여러 탭을 열면 같은 사용자의 여러 세션 동작을 확인할 수 있지만, 게임 참가자는 사용자 ID 기준으로 중복되지 않는다.

---

## 3. 사용된 기술을 초보자 언어로 이해하기

| 구분 | 실제 기술 | 이 프로젝트에서의 역할 |
| --- | --- | --- |
| 언어 | Java 17 | 서버의 자료 구조, 규칙, 요청 처리를 작성 |
| 실행 프레임워크 | Spring Boot 3.5.16 | Java 웹 애플리케이션을 시작하고 객체를 연결 |
| 일반 웹 요청 | Spring MVC | URL과 HTTP 요청을 Controller 메서드에 연결 |
| 화면 | Thymeleaf | 서버 데이터를 HTML에 넣어 첫 화면을 생성 |
| 보안 | Spring Security | 로그인·세션·HTTP 접근 권한을 관리 |
| 비밀번호 | BCryptPasswordEncoder | 비밀번호 원문 대신 해시를 저장·비교 |
| DB 접근 | MyBatis 3.0.5 | Java Mapper 메서드와 XML SQL을 연결 |
| DB | MariaDB | 사용자·방·방 멤버 같은 오래 보존할 데이터 저장 |
| 실시간 통신 | Spring WebSocket + STOMP | 새로고침 없이 채팅·참가자·게임 상태 전달 |
| 브라우저 | HTML5, CSS3, Bootstrap 5.3.8 | 화면 구조와 기본 스타일 |
| 브라우저 동작 | Vanilla JavaScript ES6 | WebSocket 연결, 버튼, 상태 화면 제어 |
| 빌드 | Gradle Wrapper 8.14.5 | 의존성 설치, 컴파일, 테스트, 실행 |
| 테스트 | JUnit 5, Mockito, H2, Node test, jsdom, Playwright | Java 규칙·DB Mapper·JavaScript 흐름 검증 |

### 3.1 Spring Boot는 무엇을 대신해 주는가

일반 Java 프로그램은 필요한 객체를 직접 `new`하고 웹 서버도 직접 설정해야 한다. Spring Boot에서는 `@Controller`, `@Service`, `@Mapper` 같은 애노테이션으로 역할을 표시하면 Spring이 객체를 만들고 서로 연결한다.

[MafiagameApplication.java](../src/main/java/kr/or/oti/mafiagame/MafiagameApplication.java)의 `@SpringBootApplication`은 애플리케이션 시작점이고, `@MapperScan`은 MyBatis Mapper를 Spring Bean으로 등록한다.

### 3.2 Spring MVC와 WebSocket의 차이

- HTTP: 브라우저가 요청하면 서버가 한 번 응답한다. 로그인 화면, 방 목록, 방 생성에 적합하다.
- WebSocket: 연결을 오래 유지하고 서버와 브라우저가 서로 먼저 메시지를 보낼 수 있다. 채팅, 참가자 목록, 게임 단계에 적합하다.
- STOMP: WebSocket 위에서 `CONNECT`, `SUBSCRIBE`, `SEND`, `MESSAGE`를 약속하는 메시지 형식이다.

이 프로젝트의 방 상세 화면은 HTTP로 HTML을 먼저 받고, JavaScript가 WebSocket으로 실시간 상태를 이어받는다.

---

## 4. 전체 구조와 디렉터리 지도

### 4.1 한 장으로 보는 요청 흐름

```text
브라우저
 ├─ HTTP ────────────────────────┐
 │                               ▼
 │                         Controller
 │                               ▼
 │                            Service
 │                               ▼
 │                    Mapper interface → Mapper XML → MariaDB
 │
 └─ WebSocket/STOMP ─────────────┐
                                 ▼
                         Message Controller
                                 ▼
                    Presence / Chat / Game Service
                         ├─ 메모리 실시간 상태
                         └─ SimpMessagingTemplate → topic/queue
```

Controller는 요청의 입구이고, Service는 업무 규칙을 담당한다. Controller에 검증과 DB 호출을 모두 넣으면 기능이 커질수록 읽고 테스트하기 어려워지므로, 이 프로젝트는 중요한 판단을 Service에 둔다.

### 4.2 소스 구조

```text
src/main/
├── java/kr/or/oti/mafiagame/
│   ├── MafiagameApplication.java  애플리케이션 시작점
│   ├── config/                    Security·WebSocket 설정과 메시지 권한
│   ├── controller/                HTTP·WebSocket 요청의 입구
│   ├── dao/                       MyBatis Mapper 인터페이스
│   ├── domain/                    DB 행과 가까운 Java 객체
│   ├── dto/                       화면·메시지로 전달할 데이터와 enum
│   ├── exception/                 WebSocket 업무 오류
│   ├── security/                  로그인 사용자와 방 접근 보조
│   └── service/                   인증·방·참가자·채팅·게임 규칙
└── resources/
    ├── application.properties    DB·MyBatis·정리 시간 설정
    ├── mappers/                  Mapper와 연결되는 XML SQL
    ├── static/
    │   ├── css/app.css           공통 스타일
    │   └── js/                   STOMP·로비·방 화면 동작
    └── templates/                Thymeleaf HTML
        ├── auth/                 로그인·회원가입
        ├── fragments/            공통 사용자 메뉴
        ├── rooms/                로비·생성·입장·방 화면
        └── users/                프로필
```

### 4.3 핵심 파일 빠른 지도

| 알고 싶은 것 | 먼저 읽을 파일 |
| --- | --- |
| 서버는 어디서 시작하는가 | `MafiagameApplication.java` |
| HTTP 로그인과 URL 권한은 어디에 있는가 | `config/SecurityConfig.java`, `controller/AuthController.java` |
| WebSocket 주소와 heartbeat는 어디에 있는가 | `config/WebSocketConfig.java` |
| STOMP 구독·전송 권한은 어디에 있는가 | `config/WebSocketAuthorizationInterceptor.java` |
| 회원가입 규칙은 어디에 있는가 | `service/SignupService.java` |
| 방 생성·비밀번호 규칙은 어디에 있는가 | `service/RoomService.java` |
| DB SQL은 어디에 있는가 | `dao/*.java`, `resources/mappers/*.xml` |
| 현재 접속자·Ready·방장은 어디에 있는가 | `service/RoomPresenceService.java` |
| 게임 상태와 페이즈 전환은 어디에 있는가 | `service/RoomGameService.java`, `service/RoomGameRules.java` |
| 브라우저의 WebSocket 동작은 어디에 있는가 | `static/js/stomp-client.js`, `static/js/chat.js` |

---

## 5. 권장 개발 순서

이 순서는 새 프로젝트를 처음부터 만든다고 가정한 순서이면서, 현재 코드의 구조를 학습하기 좋은 순서다. 이미 모두 구현된 단계도 실제 파일을 열어 흐름을 확인한다.

| 단계 | 먼저 만들 것 | 학습 목표 | 현재 연결 파일 |
| --- | --- | --- | --- |
| 0. 규칙 정의 | 사용자 흐름·게임 규칙·완료 조건 | 무엇을 만들지 코드보다 먼저 고정 | `docs/MAFIAGAME_MVP.md` |
| 1. 실행 기반 | Spring Boot 시작점·Gradle·설정 | 서버를 켜고 로그를 읽기 | `MafiagameApplication.java`, `build.gradle` |
| 2. 데이터 기반 | 테이블·Domain·Mapper·XML | Java와 SQL의 연결 이해 | `domain/`, `dao/`, `mappers/` |
| 3. 일반 화면 | Controller·Thymeleaf | HTTP 요청과 HTML 렌더링 이해 | `AuthController`, `RoomController`, `templates/` |
| 4. 인증 | 회원가입·로그인·세션 | 사용자 식별과 비밀번호 보호 | `SignupService`, `SecurityConfig`, `security/` |
| 5. 방 관리 | 방 생성·잠금·입장 | 서버 검증과 트랜잭션 이해 | `RoomService`, `RoomAccess` |
| 6. 실시간 기반 | WebSocket·STOMP·presence | 연결·구독·방 상태 동기화 | `WebSocketConfig`, `RoomPresenceService` |
| 7. 채팅 | 공개·역할별 메시지 | 서버가 수신자를 결정하는 방법 | `ChatController`, `ChatService` |
| 8. 게임 엔진 | 상태·규칙·타이머·승패 | 클라이언트가 아닌 서버가 게임을 결정하는 구조 | `RoomGameService`, `RoomGameRules` |
| 9. 화면 연결 | JavaScript 상태 렌더링·재접속 | 서버 상태를 화면에 복원 | `chat.js`, `room-list.js` |
| 10. 검증 | 단위·통합·JavaScript·E2E | 변경 후에도 규칙이 유지되는지 확인 | `gradlew test`, `npm run test:js` |

### 5.1 기능을 추가할 때의 실제 작업 순서

새 기능은 다음 순서로 설계하면 초보자도 흐름을 놓치기 어렵다.

1. 사용자가 어떤 행동을 하는지 한 문장으로 쓴다.
2. 성공·실패 조건을 목록으로 만든다.
3. DB에 남아야 하는지, 현재 연결 중에만 필요한지 결정한다.
4. 필요한 DTO나 enum을 만든다.
5. Service에 서버 기준 규칙을 작성한다.
6. HTTP `@PostMapping` 또는 WebSocket `@MessageMapping`으로 입구를 연결한다.
7. 필요한 경우 Mapper 인터페이스와 XML SQL을 연결한다.
8. Thymeleaf·JavaScript 화면을 추가한다.
9. 정상·실패·권한 우회 시나리오를 테스트한다.

화면 버튼을 먼저 만들고 서버 검증을 나중에 붙이지 않는다. 화면은 사용성을 위한 안내이고, 최종 규칙은 항상 서버가 판단해야 한다.

---

## 6. 대표 기능을 파일 단위로 따라가기

### 6.1 회원가입과 로그인

회원가입의 흐름은 다음과 같다.

```text
templates/auth/signup.html
  → POST /signup
  → AuthController.signup()
  → SignupService.signup()
  → 입력 검증·이메일 중복 확인
  → BCryptPasswordEncoder로 비밀번호 해시
  → UserMapper.insert()
  → UserMapper.insertStats()
  → /login?signup으로 이동
```

여기서 중요한 점은 다음과 같다.

- 입력 검증은 HTML의 `required`만 믿지 않고 `SignupService`에서 다시 한다.
- 비밀번호는 평문이 아니라 BCrypt 해시로 저장한다.
- `UserMapper.java`의 메서드와 `UserMapper.xml`의 SQL이 이름으로 연결된다.
- 로그인 비밀번호 비교는 Controller가 직접 하지 않고 Spring Security가 담당한다.

로그인은 다음과 같이 흐른다.

```text
POST /login
  → Spring Security 필터
  → CustomUserDetailsService.loadUserByUsername(email)
  → UserMapper.findByEmail()
  → CustomUserDetails 생성
  → BCrypt 해시 비교
  → 세션에 인증 정보 저장
  → /rooms 이동
```

`CustomUserDetails`는 Spring Security의 기본 사용자 객체에 `userId`, `nickname`, `level`을 추가한다. 그래서 Controller의 `@AuthenticationPrincipal`과 Thymeleaf의 인증 사용자 정보에서 현재 사용자를 알 수 있다.

### 6.2 방 생성과 비밀번호 방 입장

방 생성 흐름은 다음과 같다.

```text
templates/rooms/create.html
  → POST /rooms
  → RoomController.createRoom()
  → RoomService.createRoom()
  → 제목·정원·비밀번호 검증
  → 방 비밀번호가 있으면 BCrypt 해시
  → RoomMapper.insert()
  → RoomMapper.insertMember()
  → 비밀번호 방이면 RoomAccess에 세션 권한 표시
  → /rooms/{roomId} 이동
```

현재 서버 규칙은 다음과 같다.

- 방 제목: 2~100자
- 정원: 4~8명
- 방 비밀번호: 사용한다면 4~20자
- 새 방 상태: `WAITING`
- 비밀번호: 원문이 아니라 해시로 저장

`RoomAccess`는 DB 권한 테이블이 아니다. 현재 HTTP 세션이 해당 방의 비밀번호를 통과했다는 표시다. 방 상세 요청은 방이 잠겨 있고 세션 권한이 없으면 `rooms/access.html`을 보여 준다.

### 6.3 로비와 방 상세 화면

`RoomController.roomList()`는 DB 방 목록과 메모리 실시간 인원 수를 합쳐 `RoomView`로 만든다.

```text
RoomMapper.findAll()
  → RoomService.getRooms()
  → RoomView 변환
  → RoomPresenceService.currentCounts()로 실시간 인원 덮어쓰기
  → templates/rooms/list.html 렌더링
```

DB의 `current_players`와 현재 WebSocket 참가자 수는 같은 의미가 아닐 수 있다. 그래서 로비에서 현재 접속자 수는 `RoomPresenceService`의 메모리 상태를 우선한다.

방 상세 화면은 처음에 `GET /rooms/{roomId}`로 HTML을 받은 뒤 `chat.js`가 `body`의 `data-room-id`, `data-user-id`, `data-capacity`를 읽어 WebSocket 연결을 만든다.

### 6.4 실시간 참가자와 Ready

```text
chat.js
  → WebSocket /ws 연결
  → STOMP CONNECT
  → /app/rooms/{roomId}/join 전송
  → RoomPresenceController.join()
  → RoomPresenceService.join()
  → /user/queue/room-joined로 입장 응답
  → /topic/rooms/{roomId}/presence로 전체 참가자 방송
```

Ready 버튼은 `/app/rooms/{roomId}/ready`로 전송되고 `RoomPresenceService.updateReady()`가 다음을 확인한다.

- 해당 세션이 정말 그 방에 참가했는가?
- 방이 아직 `WAITING`인가?
- 참가자 상태가 존재하는가?

Ready와 방장 표시의 기준은 `RoomPresenceService`다. 방장이 나가면 다른 참가자를 방장으로 DB와 메모리에 반영하고, 마지막 참가자가 나가면 설정된 유예 시간 뒤 빈 방을 정리한다.

### 6.5 채팅

공개 채팅의 흐름은 다음과 같다.

```text
chat.js 입력
  → /app/rooms/{roomId}/chat
  → ChatController.sendMessage()
  → ChatService.createMessage()
  → 로그인·방 참가·메시지 길이 검증
  → RoomGameService.validateChat()
  → /topic/rooms/{roomId}/chat 또는 개인 queue 전송
```

메시지는 공백을 제거하고 비어 있으면 거부하며, 유니코드 코드 포인트 기준 300자를 넘을 수 없다.

게임 중 채팅은 현재 상태에 따라 달라진다.

- `PUBLIC`: 생존 참가자의 공개 채팅
- `MAFIA`: 생존 마피아에게만 개인 전송
- 사망한 사용자의 공개 메시지: 생존자에게 방송하지 않고 사망자에게만 개인 전송
- `FINAL_DEFENSE`: 지목된 참가자만 공개 채팅 가능
- `NIGHT`: 공개 채팅을 막고 마피아 채널만 허용

드롭다운을 숨기거나 바꾸는 것만으로는 보안이 되지 않는다. `RoomGameService.validateChat()`가 서버의 실제 역할·생존 여부·현재 페이즈를 기준으로 다시 확인한다.

---

## 7. WebSocket과 STOMP를 읽는 법

### 7.1 연결과 메시지의 순서

방 화면의 `chat.js`는 대략 다음 순서로 동작한다.

```text
1. ws://현재호스트/ws 연결
2. STOMP CONNECT 전송
3. CONNECTED 수신
4. 오류 queue와 room-joined queue 구독
5. /app/rooms/{roomId}/join 전송
6. 입장 응답을 받은 뒤 방 토픽 구독
7. presence/game 상태 동기화 요청
8. 이후 버튼과 채팅 입력을 SEND로 전송
```

`stomp-client.js`는 외부 STOMP 라이브러리를 호출하는 대신 프레임 생성·파싱, heartbeat, 재연결 지연을 직접 구현한다. 초보자는 먼저 `createFrame()`이 `COMMAND + headers + body + null` 형태를 만드는 함수라는 점만 이해해도 충분하다.

### 7.2 서버 주소 규칙

`WebSocketConfig`의 접두사는 주소를 읽는 규칙을 만든다.

| 구분 | 접두사 | 의미 |
| --- | --- | --- |
| WebSocket 엔드포인트 | `/ws` | 브라우저가 연결하는 실제 주소 |
| 클라이언트가 서버로 보내는 애플리케이션 주소 | `/app` | `@MessageMapping` 메서드로 전달 |
| 여러 사용자에게 방송 | `/topic` | 방 참가자·공개 채팅·게임 공개 상태 |
| 한 사용자에게 전달 | `/user`, `/queue` | 역할·결과·오류·개인 채팅 |

서버는 `/topic`, `/queue`에 simple broker를 켜고 10초 heartbeat를 설정한다.

### 7.3 주요 SEND 주소

| 주소 | 처리 클래스 | 용도 |
| --- | --- | --- |
| `/app/rooms/{roomId}/join` | `RoomPresenceController` | 방 참가 |
| `/app/rooms/{roomId}/ready` | `RoomPresenceController` | Ready 변경 |
| `/app/rooms/{roomId}/start` | `RoomPresenceController` | 방장 게임 시작 |
| `/app/rooms/{roomId}/presence/sync` | `RoomPresenceController` | 참가자 상태 복원 |
| `/app/rooms/{roomId}/chat` | `ChatController` | 공개 채팅 |
| `/app/rooms/{roomId}/mafia-chat` | `ChatController` | 마피아 채팅 |
| `/app/rooms/{roomId}/game` | `RoomGameController` | 역할 확인·투표·밤 행동 |
| `/app/rooms/{roomId}/game/sync` | `RoomGameController` | 게임 상태·개인 정보 복원 |
| `/app/rooms/presence` | `RoomPresenceController` | 로비 인원 재방송 요청 |

### 7.4 주요 SUBSCRIBE 주소

| 주소 | 받는 데이터 |
| --- | --- |
| `/topic/rooms/{roomId}/presence` | 참가자·방장·Ready·방 상태 |
| `/topic/rooms/{roomId}/chat` | 생존자 공개 채팅 |
| `/topic/rooms/{roomId}/game` | 페이즈·타이머·공개 게임 상태 |
| `/topic/rooms/presence` | 로비 방별 인원과 전체 온라인 인원 |
| `/user/queue/room-joined` | 방 입장 성공 응답 |
| `/user/queue/presence-synced` | 참가자 상태 복원 응답 |
| `/user/queue/game-role` | 본인 역할 |
| `/user/queue/game-result` | 본인 역할·생존 여부·승리 진영 |
| `/user/queue/night-result` | 경찰 개인 조사 결과 |
| `/user/queue/mafia-chat` | 생존 마피아 개인 채팅 |
| `/user/queue/dead-chat` | 사망자끼리의 채팅 |
| `/user/queue/errors` | 현재 사용자에게만 보이는 업무 오류 |

---

## 8. 현재 게임 엔진 이해하기

### 8.1 어떤 상태를 어디에 저장하는가

이 프로젝트를 이해할 때 가장 중요한 구분이다.

| 상태 | 저장 위치 | 이유 |
| --- | --- | --- |
| 사용자·통계 | MariaDB | 서버가 다시 시작되어도 남아야 함 |
| 방 제목·정원·잠금·`WAITING/PLAYING` | MariaDB | 로비와 방의 기본 정보 |
| 방 멤버 DB 기록 | MariaDB | 방 생성·방장 변경·삭제 처리 |
| 현재 WebSocket 세션·참가자·Ready | `RoomPresenceService` 메모리 | 연결 중인 사용자 상태를 빠르게 갱신 |
| 게임 페이즈·투표·역할·생존 여부 | `RoomGameService` 메모리 | 진행 중인 한 판의 실시간 상태 |
| 브라우저 화면 상태 | `chat.js` 메모리/DOM | 서버 메시지를 화면에 표시 |

따라서 게임 진행 중 서버가 재시작되면 메모리의 한 판 상태는 유지되지 않는다. 현재 구조는 단일 서버에서 MVP 게임 루프를 검증하기 위한 구조이며, 분산 서버나 게임 이력 저장을 위해서는 별도 설계가 필요하다.

### 8.2 역할 배정

`RoomGameRules.createRoles()`는 참가자 수에 따라 아래의 고정 역할 목록을 만든다.

| 참가자 수 | 역할 구성 |
| --- | --- |
| 4명 | 마피아 1명, 경찰 1명, 의사 1명, 시민 1명 |
| 5명 | 마피아 1명, 스파이 1명, 경찰 1명, 의사 1명, 시민 1명 |
| 6명 | 마피아 1명, 스파이 1명, 경찰 1명, 의사 1명, 군인 1명, 시민 1명 |
| 7명 | 마피아 2명, 스파이 1명, 경찰 1명, 의사 1명, 군인 1명, 시민 1명 |
| 8명 | 마피아 2명, 스파이 1명, 경찰 1명, 의사 1명, 군인 1명, 영매사 1명, 시민 1명 |

스파이는 마피아팀에 속하지만 살해 행동은 할 수 없고, 마피아를 조사해 접선한 뒤에만 마피아 채널을 사용할 수 있다. 군인은 마피아의 공격을 한 번 방어하고 직업을 공개하며, 영매사는 생존 중 사망자 채널 사용과 사망자 직업 조사를 할 수 있다. 역할 목록을 만든 뒤 플레이어 ID 순서를 섞어 역할을 배정하고, 역할은 공개 게임 상태에 넣지 않고 `/user/queue/game-role`로 개인 전송한다.

### 8.3 페이즈와 시간

`dto/GamePhase.java`가 단계 이름과 시간을 정의한다.

| 페이즈 | 시간 | 의미 |
| --- | ---: | --- |
| `ROLE_ASSIGNMENT` | 10초 | 본인 역할 확인 |
| `DAY_DISCUSSION` | 60초 | 공개 토론 |
| `NOMINATION_VOTE` | 15초 | 처형 후보 지목 |
| `FINAL_DEFENSE` | 15초 | 지목된 후보자의 최종 변론 |
| `EXECUTION_VOTE` | 15초 | 후보자 처형 찬반 |
| `NIGHT` | 30초 | 마피아 제거·의사 보호·경찰 조사 |
| `FINISHED` | 0초 | 결과 표시와 재대기 준비 |

`RoomGameService`는 방별 `GameRoom`을 만들고, 각 방의 `ReentrantLock` 안에서 요청을 검증하고 상태를 변경한다. `GamePhaseScheduler`는 페이즈가 끝나는 시점에 `advancePhase()`를 호출한다. 브라우저의 카운트다운은 권한을 갖지 않고, 서버가 보내는 `phaseEndsAt`을 화면에 보여 주는 역할만 한다.

### 8.4 게임 진행 규칙

```text
WAITING
  → 방장 시작 + 4~8명 + 전원 Ready
ROLE_ASSIGNMENT
  → 전원 역할 확인 또는 10초 경과
DAY_DISCUSSION
  → 생존자 지목 투표
NOMINATION_VOTE
  → 단독 최다 득표면 FINAL_DEFENSE
  → 무효·무투표·동률이면 NIGHT
FINAL_DEFENSE
  → EXECUTION_VOTE
EXECUTION_VOTE
  → 찬성 > 반대면 후보자 처형
  → 승패 확인 후 NIGHT 또는 FINISHED
NIGHT
  → 마피아 공격·의사 보호·경찰 조사 해소
  → 승패 확인 후 DAY_DISCUSSION 또는 FINISHED
FINISHED
  → 개인 결과 전송 → 방을 WAITING으로 초기화
```

서버가 확인하는 대표 규칙은 다음과 같다.

- 역할 확인은 `ROLE_CONFIRM` 행동으로 한 번만 제출할 수 있다.
- 사망자는 투표와 밤 행동을 제출할 수 없다.
- 지목 투표는 생존자만 할 수 있고 자기 자신을 지목할 수 없다.
- 지목 최다 득표가 동률이면 처형 후보가 없다.
- 처형 후보자는 처형 찬반 투표에서 제외된다.
- 처형은 찬성표가 반대표보다 많을 때만 실행된다.
- 마피아·의사·경찰은 자신의 역할에 맞는 밤 행동만 한 번 제출할 수 있다.
- 마피아는 같은 마피아를 제거할 수 없다.
- 마피아 공격과 의사 보호는 밤 종료 시 함께 해소된다.
- 모든 마피아가 죽으면 시민 승리, 생존 마피아가 생존 시민 진영보다 많으면 마피아 승리다.

`RoomGameRules`는 역할 배정, 투표 집계, 밤 행동 해소, 승리 판정을 별도 순수 규칙 코드로 분리한다. WebSocket 전송이나 HTML을 모르는 규칙 코드를 따로 두면 규칙을 테스트하고 변경하기 쉽다.

---

## 9. 보안과 동시성: 초보자가 꼭 봐야 할 부분

### 9.1 HTTP 로그인과 WebSocket 권한은 별개다

`SecurityConfig`는 일반 HTTP URL을 보호한다.

- 누구나 접근: `/`, `/rooms`, `/login`, `/signup`, 정적 CSS·JS·WebJars
- WebSocket handshake: `/ws/**` 연결 자체는 허용
- 그 외 HTTP 요청: 인증 필요

WebSocket 연결이 허용되었다고 해서 모든 방 주소를 쓸 수 있는 것은 아니다. 이후 메시지는 `WebSocketAuthorizationInterceptor`가 다시 검사한다.

### 9.2 WebSocket 최소 권한 검사

인터셉터는 다음을 확인한다.

1. 허용된 `SUBSCRIBE` 또는 `SEND` 목적지인가?
2. 방 관련 요청이면 로그인한 사용자인가?
3. 방 토픽을 구독하거나 방 행동을 보내려면 현재 그 방 참가자인가?

그 뒤의 상세 규칙은 Service가 담당한다. 예를 들어 `start`는 방장인지, `game`은 현재 페이즈와 역할에 맞는지, 채팅은 생존·채널 조건에 맞는지를 각 Service에서 판단한다.

### 9.3 세션과 사용자 수는 같은 것이 아니다

한 사용자가 여러 탭을 열면 WebSocket 세션은 여러 개지만 게임 참가자는 한 명이어야 한다. `RoomPresenceService`는 사용자 ID를 참가자 키로 사용하고 세션 목록을 따로 관리한다.

- 같은 사용자의 여러 탭: 한 참가자로 계산
- 다른 방으로 이동: 이전 방 세션 정리
- 방장이 나감: 남은 참가자 중 한 명에게 방장 위임
- 게임 중 잠깐 끊김: 기본 10초 재접속 유예
- 방이 비어 있음: 기본 15초 뒤 DB 방 정리

이 자료 구조와 변경은 `ReentrantReadWriteLock`으로 보호된다. 메모리 상태를 읽는 작업은 read lock, 참가자 추가·삭제·Ready 변경은 write lock을 사용한다.

### 9.4 서버 검증이 진짜 규칙이다

다음은 모두 브라우저에서 조작할 수 있으므로 서버에서 다시 확인해야 한다.

- 버튼을 비활성화했는가
- 드롭다운에 특정 사용자만 보이는가
- 현재 페이즈가 끝났는가
- 내가 방장인가
- 내가 마피아·의사·경찰인가
- 내가 살아 있는가

이 프로젝트는 게임 행동을 `RoomGameService`의 방별 lock 안에서 검증하고 기록한다. 그래서 중복 클릭이나 타이머가 끝나는 순간에 들어온 요청이 서로 상태를 덮어쓰지 않도록 한다.

---

## 10. 초보자 실습 과제

### 실습 1: HTTP 화면 하나 추적하기

로비를 예로 다음 파일을 순서대로 연다.

1. `templates/rooms/list.html`
2. `RoomController.roomList()`
3. `RoomService.getRooms()`
4. `RoomMapper.findAll()`
5. `mappers/RoomMapper.xml`의 `findAll` SQL
6. 다시 `list.html`의 `th:each`, `th:text`

목표는 “DB 조회 결과가 HTML 카드로 바뀌는 과정”을 말로 설명하는 것이다.

### 실습 2: WebSocket 한 메시지 추적하기

Ready 버튼을 예로 다음을 찾는다.

1. `detail.html`의 `id="ready"`
2. `chat.js`의 Ready 클릭 이벤트
3. `/app/rooms/{roomId}/ready`
4. `RoomPresenceController.updateReady()`
5. `RoomPresenceService.updateReady()`
6. `/topic/rooms/{roomId}/presence`
7. `chat.js`의 `renderParticipants()`

목표는 “한 사용자의 버튼 클릭이 다른 브라우저에도 어떻게 보이는가”를 설명하는 것이다.

### 실습 3: 작은 화면 변경

`templates/rooms/list.html`에서 로비 안내 문구를 바꾸고 서버를 다시 시작한다. 이 과제에서는 Java 코드를 바꾸지 않고 Thymeleaf 템플릿이 서버 재시작 후 어떻게 반영되는지 확인한다.

### 실습 4: 규칙과 화면의 경계 찾기

게임 중 `chat.js`에서 채팅 채널을 강제로 바꿔 보내도 왜 서버가 거부할 수 있는지 다음 파일에서 확인한다.

- `ChatController.java`
- `ChatService.java`
- `RoomGameService.validateChat()`
- `WebSocketAuthorizationInterceptor.java`

목표는 “화면에서 숨김”과 “서버 권한 검사”를 구분하는 것이다.

### 실습 5: 새 기능 설계 연습

예를 들어 “방 설명을 추가한다”고 가정한다.

1. 방 설명이 DB에 남아야 하므로 테이블 컬럼이 필요한지 결정한다.
2. `Room`, `RoomSummary`, `RoomView` 중 어디에 값을 넣을지 정한다.
3. `RoomMapper.xml`의 INSERT·SELECT를 수정한다.
4. `RoomService`에서 길이 검증을 한다.
5. `RoomController`와 `create.html`을 연결한다.
6. `list.html`, `detail.html`에 표시한다.
7. 빈 값·너무 긴 값·HTML 입력을 확인한다.

---

## 11. 문제가 생겼을 때 확인할 순서

### 서버가 시작되지 않는다

1. JDK가 17인지 확인한다.
2. MariaDB가 실행 중이고 `mafiaweb`이 존재하는지 확인한다.
3. `DB_USERNAME`, `DB_PASSWORD`가 현재 터미널에 설정되어 있는지 확인한다.
4. `application.properties`의 포트와 URL이 실제 DB와 같은지 확인한다.
5. 콘솔의 가장 첫 번째 `Caused by` 원인을 읽는다.

### 로그인은 되는데 방 목록이 비어 있거나 오류가 난다

1. `RoomMapper.xml`이 가리키는 테이블이 생성되었는지 확인한다.
2. DB 계정에 `mafiaweb` 읽기 권한이 있는지 확인한다.
3. `RoomController.roomList()`가 호출되는지 확인한다.
4. `RoomService.getRooms()`의 Mapper 결과를 확인한다.

### 방 화면에서 “먼저 게임방에 입장해 주세요”가 나온다

1. 로그인 상태인지 확인한다.
2. 잠금 방이면 HTTP 세션에서 비밀번호를 먼저 통과했는지 확인한다.
3. `/ws` 연결이 성공했는지 브라우저 개발자 도구의 Network 탭에서 확인한다.
4. `CONNECTED` 이후 `/app/rooms/{roomId}/join`이 전송되는지 확인한다.
5. 입장 응답 후에 방 토픽을 구독하는지 확인한다.

### 채팅은 되는데 참가자 수가 이상하다

DB의 멤버 행과 현재 WebSocket 참가자 수를 섞어 보고 있는지 확인한다. 실시간 화면의 기준은 `RoomPresenceService`이며, 같은 사용자의 여러 탭은 한 명으로 계산된다.

### 게임 화면의 단계가 브라우저마다 다르다

1. 각 브라우저가 `/topic/rooms/{roomId}/game`을 구독했는지 확인한다.
2. `phaseEndsAt`을 기준으로 화면의 timer를 계산하는지 확인한다.
3. 새로고침 후 `/app/rooms/{roomId}/game/sync`가 전송되는지 확인한다.
4. 실제 전환은 `RoomGameService`와 `GamePhaseScheduler`가 수행한다는 점을 기억한다.

### 역할이 다른 사용자에게 보이면 안 된다

공개 게임 상태 `RoomGameState`에는 진행 중 역할을 넣지 않고, `GameRoleAssignment`는 `/user/queue/game-role`로 개인 전송해야 한다. 역할을 `/topic/rooms/{roomId}/game`에 넣는 방식은 사용하지 않는다.

---

## 12. 테스트와 검증 방법

문서만 읽고 “될 것 같다”고 판단하지 말고 실제 명령을 실행한다.

### 12.1 Java와 JavaScript 테스트

```powershell
# Java 테스트와 Gradle에 연결된 JavaScript 테스트
.\gradlew.bat test

# JavaScript 테스트만 실행
npm run test:js
```

`build.gradle`의 `test` 작업은 `jsTest` 작업에도 의존하므로, 전체 테스트는 Java와 브라우저 JavaScript 흐름을 함께 확인한다.

테스트를 읽을 때는 구현보다 먼저 테스트 이름과 `assert`를 본다.

- 어떤 입력을 준비했는가?
- 성공 결과를 무엇으로 판단하는가?
- 예외가 발생해야 하는 경우는 무엇인가?
- Mock으로 대체한 외부 계층은 무엇인가?

### 12.2 수동 검증 체크리스트

- [ ] 회원가입 후 비밀번호 원문이 DB에 저장되지 않는다.
- [ ] 잘못된 로그인은 실패하고 성공하면 `/rooms`로 이동한다.
- [ ] 방 제목·정원·비밀번호 길이 검증이 서버에서도 동작한다.
- [ ] 잠금 방은 비밀번호 없이는 WebSocket 참가가 되지 않는다.
- [ ] 두 브라우저의 참가자·Ready·방장 표시가 일치한다.
- [ ] 같은 사용자의 여러 탭이 인원을 중복 증가시키지 않는다.
- [ ] 4명 미만, 일부 미준비, 일반 사용자 게임 시작 요청이 거부된다.
- [ ] 역할은 본인에게만 보이고 공개 토픽에는 게임 중 역할이 없다.
- [ ] 타이머가 끝나면 서버 기준으로 다음 페이즈가 된다.
- [ ] 사망자·잘못된 역할·중복 투표·마감 후 행동이 거부된다.
- [ ] 게임 종료 후 결과가 보이고 방이 `WAITING`으로 돌아간다.

Playwright 기반 E2E는 로컬 서버와 브라우저를 준비한 별도 검증 단계로 사용한다. 기능을 처음 구현할 때는 Java·JavaScript 단위 테스트와 수동 4인 흐름부터 확인하고, 전체 E2E는 환경을 준비한 뒤 실행한다.

---

## 13. 자주 헷갈리는 용어

| 용어 | 뜻 |
| --- | --- |
| Controller | 요청을 처음 받는 입구. 업무 규칙을 모두 넣는 곳은 아님 |
| Service | 검증·상태 변경·업무 규칙을 담당하는 계층 |
| Mapper | Java 메서드와 SQL을 연결하는 MyBatis 인터페이스 |
| Mapper XML | 실제 `SELECT`, `INSERT`, `UPDATE`, `DELETE` SQL |
| Domain | DB 데이터와 가까운 객체 |
| DTO | 화면·메시지로 전달하는 데이터 모양 |
| Thymeleaf | 서버 값을 HTML에 넣는 템플릿 엔진 |
| Principal | 현재 로그인한 사용자를 나타내는 인증 주체 |
| Session | 로그인·방 비밀번호 통과 같은 연결 단위의 저장 공간 |
| Topic | 여러 구독자에게 보내는 메시지 주소 |
| User queue | 특정 사용자에게만 보내는 메시지 주소 |
| Presence | 현재 WebSocket으로 연결된 참가자 상태 |
| Phase | 게임의 현재 단계 |
| Snapshot | 현재 상태를 클라이언트에 전달하기 위해 만든 읽기용 복사본 |
| 서버 기준 상태 | 클라이언트가 임의로 바꿀 수 없는 최종 게임 상태 |

---

## 14. 최종 자가 점검

다음 질문에 파일 이름을 함께 말할 수 있으면 기본 학습을 마친 것이다.

1. `/rooms` 요청은 어떤 Controller 메서드가 받는가?
2. 방 목록 SQL은 어떤 Mapper XML에 있는가?
3. 비밀번호는 왜 `RoomAccess`와 BCrypt를 모두 사용하는가?
4. WebSocket `/ws` 연결이 허용되어도 왜 방 토픽을 아무나 구독할 수 없는가?
5. `RoomPresenceService`와 `RoomGameService`의 상태는 왜 DB와 별도로 메모리에 있는가?
6. 역할을 공개 topic이 아니라 user queue로 보내는 이유는 무엇인가?
7. 브라우저의 timer가 0이 되었다고 게임 단계가 바뀌는가?
8. 마피아 채팅에서 드롭다운을 바꾸는 것만으로 권한 우회가 가능한가?
9. 같은 사용자가 두 탭을 열었을 때 참가자 수가 한 명이어야 하는 이유는 무엇인가?
10. 새 기능을 만들 때 DTO·Service·Controller·화면·테스트를 어떤 순서로 연결할 것인가?

핵심은 클래스 이름을 외우는 것이 아니라, 다음 흐름을 반복해서 읽는 것이다.

```text
사용자 행동
  → 전송 방식(HTTP 또는 STOMP)
  → Controller
  → Service의 서버 규칙
  → DB 또는 메모리 상태 변경
  → HTML 응답 또는 topic/queue 메시지
  → 브라우저 화면 갱신
```

이 흐름을 한 기능에 대해 끝까지 설명할 수 있으면, MAFIAGAME의 다른 기능도 같은 방식으로 학습하고 확장할 수 있다.
