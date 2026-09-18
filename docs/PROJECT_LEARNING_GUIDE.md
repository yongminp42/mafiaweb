# MAFIAGAME 프로젝트 학습 가이드

이 문서는 MAFIAGAME을 처음 보는 사람이 프로젝트를 실행하고, 파일의 역할을 이해하고, 사용자의 행동이 서버 코드로 어떻게 흘러가는지 따라갈 수 있도록 만든 입문용 강의 자료다.

설명 기준은 현재 `src/main`의 실제 소스 코드다. 아직 구현되지 않은 “진짜 마피아 게임 진행”과 현재 구현된 “회원·로비·대기방·실시간 채팅”을 구분해서 설명한다.

### 이 문서를 활용하는 방법

처음에는 모든 코드를 외우려고 하지 말고 요청 하나가 어느 파일을 지나가는지 추적한다.

1. **1회차: 전체 흐름 파악** — 1~5장을 읽고 서버·화면·DB·WebSocket의 관계를 설명해 본다.
2. **2회차: HTTP 기능 추적** — 회원가입이나 방 생성을 골라 Template → Controller → Service → Mapper 순서로 실제 코드를 연다.
3. **3회차: 실시간 기능 추적** — 방 참가를 골라 JavaScript → STOMP 주소 → Controller → Service → topic 응답을 따라간다.
4. **4회차: 테스트로 확인** — 테스트 이름을 먼저 읽고, 어떤 규칙을 보호하는지 예상한 뒤 테스트 본문을 확인한다.
5. **복습할 때** — 마지막 자가 점검 문제에 답한 뒤 막힌 항목의 장만 다시 읽는다.

학습 목표는 클래스 이름을 암기하는 것이 아니라 다음 질문에 답할 수 있게 되는 것이다.

- 사용자의 입력은 어디에서 검증되는가?
- DB 데이터와 현재 접속 상태는 어디에 각각 저장되는가?
- 화면 제어와 실제 서버 권한 검사는 어떻게 다른가?
- 같은 사용자가 여러 탭을 열었을 때 왜 참가자는 한 명으로 계산되는가?

---

## 1. 이 프로젝트는 무엇을 만드는가

MAFIAGAME은 웹 브라우저에서 여러 사용자가 게임방에 들어와 대기하고 채팅하는 마피아 게임 서비스다.

현재 소스에서 동작하는 범위는 다음과 같다.

- 회원가입과 로그인
- Spring Security 기반 인증과 로그아웃
- MariaDB에 저장된 게임방 목록 조회
- 게임방 생성과 방 비밀번호 설정
- 비밀번호 방 입장 인증
- 게임방 참가자 표시
- 참가자 준비 상태 실시간 변경
- 게임방 채팅
- 로비의 실시간 방별 인원 수 표시
- 접속 종료 시 참가자 제거와 방장 위임

아직 게임의 핵심 규칙인 역할 배정, 낮/밤, 투표, 승패 판정은 구현되어 있지 않다. 현재의 방은 “게임 시작 전 대기실”에 가깝다.

---

## 2. 가장 먼저 기억할 전체 구조

이 프로젝트는 다음 다섯 가지 기술을 조합한다.

| 역할 | 기술 | 쉽게 말하면 |
| --- | --- | --- |
| 서버 실행 | Spring Boot | Java 웹 서버를 쉽게 시작하는 틀 |
| 화면 요청 처리 | Spring MVC + Thymeleaf | URL을 받아 HTML을 만들어 보내는 방식 |
| 로그인 보안 | Spring Security | 로그인, 세션, 접근 제한을 담당 |
| DB 접근 | MyBatis + MariaDB | Java 메서드와 SQL을 연결 |
| 실시간 기능 | WebSocket + STOMP | 새로고침 없이 채팅·참가자 상태를 전달 |

일반적인 화면 요청은 아래처럼 흐른다.

```text
브라우저
  ↓ HTTP 요청
Controller
  ↓ 필요한 판단과 규칙을 Service에 위임
Service
  ↓ DB 조회·저장
Mapper 인터페이스 → Mapper XML의 SQL → MariaDB
  ↑
Service가 결과를 DTO로 정리
  ↑
Controller가 Model에 담음
  ↑
Thymeleaf HTML 템플릿이 화면으로 변환
```

실시간 요청은 흐름이 조금 다르다.

```text
브라우저의 WebSocket
  ↓ STOMP CONNECT / SEND / SUBSCRIBE
WebSocketAuthorizationInterceptor
  ↓ 주소와 로그인·방 참가 여부 검사
@MessageMapping Controller
  ↓
실시간 Service
  ↓
SimpMessagingTemplate.convertAndSend()
  ↓
같은 방을 구독한 브라우저들의 JavaScript
  ↓
화면 갱신
```

처음 공부할 때는 “Controller가 모든 일을 직접 하지 않는다”는 점을 가장 중요하게 기억하면 된다.

- Controller: HTTP 또는 WebSocket 요청의 입구
- Service: 실제 업무 규칙
- Mapper: DB와 통신하는 통로
- DTO: 화면이나 메시지로 주고받는 데이터 모양
- Domain: DB에 저장되는 객체 모양
- Template/JavaScript: 사용자에게 보이는 화면과 브라우저 동작

---

## 3. 실행 전에 알아야 할 것

### 3.1 개발 환경

- JDK 17
- Gradle Wrapper 8.14.5
- MariaDB
- 데이터베이스 `mafiaweb`
- 브라우저

Java 버전은 `build.gradle`의 toolchain에서 17로 고정되어 있다.

```groovy
java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(17)
    }
}
```

### 3.2 실행 명령

Windows에서는 프로젝트 루트에서 다음 명령을 실행한다.

```powershell
.\gradlew.bat bootRun
```

브라우저에서 [http://localhost:8080](http://localhost:8080)을 연다.

### 3.3 DB 연결 설정

`src/main/resources/application.properties`는 MariaDB를 다음 주소로 연결한다.

```properties
spring.datasource.url=jdbc:mariadb://localhost:23306/mafiaweb
spring.datasource.username=${DB_USERNAME:root}
spring.datasource.password=${DB_PASSWORD:}
```

`${DB_USERNAME:root}`의 뜻은 “환경 변수 `DB_USERNAME`이 있으면 사용하고, 없으면 `root`를 사용한다”는 뜻이다. 비밀번호도 같은 방식이다.

실행 전에 DB 스키마를 준비해야 한다. 테이블 이름은 Mapper SQL에서 확인할 수 있다.

- `user`
- `user_stats`
- `game_room`
- `room_members`

DB 비밀번호나 토큰은 소스 코드에 직접 적지 않는다.

---

## 4. 프로젝트 디렉터리 지도

```text
src/main/
├── java/kr/or/oti/mafiagame/
│   ├── MafiagameApplication.java        애플리케이션 시작점
│   ├── config/                          보안·WebSocket 설정
│   ├── controller/                      HTTP·WebSocket 요청 입구
│   ├── dao/                             MyBatis Mapper 인터페이스
│   ├── domain/                          DB 저장 모델
│   ├── dto/                             화면·메시지 전달 모델
│   ├── exception/                       WebSocket용 예외
│   ├── security/                        인증 사용자와 방 접근 보조 객체
│   └── service/                         업무 규칙
└── resources/
    ├── application.properties           DB·MyBatis·방 정리 설정
    ├── mappers/                          Mapper XML과 SQL
    ├── static/
    │   ├── css/app.css                  공통 스타일
    │   └── js/                           브라우저 동작과 STOMP 처리
    └── templates/                        Thymeleaf HTML
        ├── auth/                         로그인·회원가입
        ├── fragments/                    공통 사용자 메뉴
        ├── rooms/                        로비·방 생성·방 입장·대기실
        └── users/                        사용자 프로필
```

실제 패키지명은 `kr.or.oti.mafiagame`이다. Java에서 패키지는 폴더 구조와 거의 일치한다.

---

## 5. 애플리케이션 시작 과정

시작점은 [MafiagameApplication.java](src/main/java/kr/or/oti/mafiagame/MafiagameApplication.java)다.

```java
@SpringBootApplication
@MapperScan("kr.or.oti.mafiagame.dao")
public class MafiagameApplication {
    public static void main(String[] args) {
        SpringApplication.run(MafiagameApplication.class, args);
    }
}
```

### `@SpringBootApplication`

이 애노테이션은 여러 설정을 한 번에 활성화한다.

- 컴포넌트 스캔: `@Controller`, `@Service`, `@Component`를 찾아 객체로 등록
- 자동 설정: Spring MVC, Security, WebSocket 등의 기본 설정 준비
- 설정 클래스 인식

### `@MapperScan`

`dao` 패키지의 MyBatis Mapper 인터페이스를 찾아 Spring Bean으로 등록한다. 그래서 Service에서 다음처럼 Mapper를 생성하지 않고 주입받을 수 있다.

```java
public RoomService(RoomMapper roomMapper, PasswordEncoder passwordEncoder) {
    this.roomMapper = roomMapper;
    this.passwordEncoder = passwordEncoder;
}
```

이 프로젝트는 `new RoomMapper()`를 호출하지 않는다. MyBatis가 인터페이스 구현체를 만들어 준다.

---

## 6. HTTP 요청을 이해하는 기본 법칙

### 6.1 Controller의 URL 애노테이션

예를 들어 [AuthController.java](src/main/java/kr/or/oti/mafiagame/controller/AuthController.java)의 다음 코드를 보자.

```java
@GetMapping("/login")
public String login() {
    return "auth/login";
}
```

사용자가 `GET /login`을 요청하면 `auth/login.html`을 보여 준다는 뜻이다.

`return "auth/login"`에서 `.html`은 생략된다. Thymeleaf가 `templates/auth/login.html`을 찾는다.

반대로 다음은 폼 제출을 받는다.

```java
@PostMapping("/signup")
public String signup(...) { ... }
```

폼이 `POST /signup`으로 보낸 값을 Controller가 받고, 성공하면 `redirect:/login?signup`을 반환한다. Redirect는 서버가 새 HTML을 직접 그리는 대신 브라우저에게 “다시 이 URL로 이동하라”고 응답하는 방식이다.

### 6.2 `Model`

Controller가 HTML에 전달할 값을 `Model`에 넣는다.

```java
model.addAttribute("rooms", rooms);
```

템플릿에서는 다음처럼 꺼낸다.

```html
<article th:each="room : ${rooms}">
  <h3 th:text="${room.title}">방 제목</h3>
</article>
```

`th:text`는 값을 HTML 텍스트로 넣는다. 사용자 입력을 `innerHTML`처럼 HTML로 해석하지 않기 때문에 화면 출력 시 안전한 방식이다.

---

## 7. 회원가입과 로그인 전체 흐름

### 7.1 회원가입 화면 표시

1. 브라우저가 `GET /signup` 요청
2. `AuthController.signup()` 실행
3. `auth/signup.html` 반환
4. 브라우저가 입력 폼 표시

관련 파일:

- 입구: [AuthController.java](src/main/java/kr/or/oti/mafiagame/controller/AuthController.java)
- 규칙: [SignupService.java](src/main/java/kr/or/oti/mafiagame/service/SignupService.java)
- DB 통로: [UserMapper.java](src/main/java/kr/or/oti/mafiagame/dao/UserMapper.java)
- SQL: [UserMapper.xml](src/main/resources/mappers/UserMapper.xml)
- 화면: [signup.html](src/main/resources/templates/auth/signup.html)

### 7.2 회원가입 제출

사용자가 닉네임, 이메일, 비밀번호, 비밀번호 확인, 약관 동의를 입력하고 제출한다.

```text
signup.html form
  → POST /signup
  → AuthController.signup()
  → SignupService.signup()
  → 입력값 검증
  → PasswordEncoder로 비밀번호 해시
  → UserMapper.insert()
  → UserMapper.insertStats()
  → /login?signup으로 이동
```

`SignupService`가 하는 검증은 다음과 같다.

- 닉네임: 2~30자
- 이메일: 간단한 이메일 정규식과 255자 제한
- 비밀번호: 8자 이상, UTF-8 기준 72바이트 이하
- 비밀번호 확인 값 일치
- 약관 동의 여부
- 이메일 중복 여부

비밀번호는 평문으로 DB에 저장하지 않는다.

```java
password(passwordEncoder.encode(password))
```

여기서 `passwordEncoder`는 [SecurityConfig.java](src/main/java/kr/or/oti/mafiagame/config/SecurityConfig.java)가 등록한 `BCryptPasswordEncoder`다.

회원 저장 뒤 `insertStats()`를 호출해 사용자 통계 행도 초기화한다. 두 저장 과정은 `@Transactional` 안에 있으므로 중간에 실패하면 트랜잭션 관점에서 함께 처리된다.

### 7.3 로그인

로그인 화면은 `auth/login.html`에 있지만, 로그인 비밀번호 비교 자체는 직접 구현하지 않는다.

[SecurityConfig.java](src/main/java/kr/or/oti/mafiagame/config/SecurityConfig.java)가 다음을 설정한다.

```java
.formLogin(form -> form
    .loginPage("/login")
    .loginProcessingUrl("/login")
    .usernameParameter("email")
    .passwordParameter("password")
    .defaultSuccessUrl("/rooms", true))
```

즉, 폼의 `name="email"`, `name="password"` 값을 Spring Security가 읽는다.

사용자 조회 과정은 다음과 같다.

```text
POST /login
  → Spring Security 필터
  → CustomUserDetailsService.loadUserByUsername(email)
  → 이메일 공백 제거·소문자화
  → UserMapper.findByEmail()
  → CustomUserDetails 생성
  → BCrypt 해시 비교
  → 성공하면 세션에 인증 정보 저장
  → /rooms 이동
```

[CustomUserDetails.java](src/main/java/kr/or/oti/mafiagame/security/CustomUserDetails.java)는 Spring Security의 사용자 객체를 확장하면서 다음 값을 추가로 보관한다.

- `userId`
- `nickname`
- `level`

그래서 Thymeleaf에서 `#authentication.principal.nickname`처럼 닉네임을 출력할 수 있고, Controller에서는 `@AuthenticationPrincipal CustomUserDetails user`로 현재 사용자를 받을 수 있다.

### 7.4 로그인 보호

`SecurityConfig`의 접근 정책은 대략 다음과 같다.

- 누구나 접근: `/`, `/rooms`, `/login`, `/signup`, CSS, JS, WebJars, 오류 페이지
- WebSocket 연결 경로 `/ws/**`: 연결 자체는 허용
- 그 외: 로그인 필요

중요한 점은 WebSocket 엔드포인트의 HTTP 연결을 허용했다고 해서 모든 실시간 작업을 허용하는 것은 아니라는 점이다. 실제 STOMP 구독과 전송 권한은 별도의 인터셉터가 검사한다.

---

## 8. 로비 화면의 흐름

로비 URL은 `/`와 `/rooms` 두 개가 같은 메서드를 사용한다.

[RoomController.java](src/main/java/kr/or/oti/mafiagame/controller/RoomController.java)의 `roomList()`는 다음 순서로 실행된다.

1. `roomPresenceService.currentCounts()`로 현재 WebSocket 접속 인원을 읽는다.
2. `roomService.getRooms()`로 DB의 방 목록을 읽는다.
3. DB 결과를 `RoomView`로 바꾼다.
4. 실시간 인원 수를 `withPlayerCount()`로 덮어쓴다.
5. 전체 접속 인원을 계산한다.
6. `rooms/list.html`을 렌더링한다.

```java
List<RoomView> rooms = roomService.getRooms().stream()
    .map(room -> room.withPlayerCount(liveCounts.getOrDefault(room.roomId(), 0)))
    .toList();
```

여기서 `RoomSummary`와 `RoomView`를 나누는 이유는 다음과 같다.

- `RoomSummary`: MyBatis SQL 조회 결과에 가까운 모델
- `RoomView`: 화면에 보여 주기 좋게 정리한 모델

로비 화면의 검색과 상태 필터는 서버 재요청이 아니라 `list.html` 안의 JavaScript가 처리한다.

```javascript
const show = (filter.value === 'all' || card.dataset.status === filter.value)
  && card.dataset.title.toLowerCase().includes(query);
```

검색어가 바뀔 때 이미 렌더링된 카드의 `hidden` 속성만 바꾼다.

### 로비 실시간 인원 수

[room-list.js](src/main/resources/static/js/room-list.js)는 `/topic/rooms/presence`를 구독한다.

```text
로비 페이지 로드
  → WebSocket /ws 연결
  → STOMP CONNECT
  → /topic/rooms/presence 구독
  → /app/rooms/presence 전송
  → RoomPresenceController.sendRoomCounts()
  → RoomPresenceService.broadcastRoomCounts()
  → 로비에 방별 인원 배열 전송
  → room-list.js가 숫자 갱신
```

방 인원이 0이 되어 방이 삭제되면 JavaScript는 `room:removed` 이벤트를 발생시키고, `list.html`이 해당 카드를 제거한다.

---

## 9. 방 생성과 비밀번호 방 입장

### 9.1 방 생성 화면

`GET /rooms/new`는 `RoomController.roomCreateForm()`을 실행한다.

기본값으로 최대 인원 8명, 비밀번호 없음 상태를 Model에 담아 `rooms/create.html`을 보여 준다.

화면의 체크박스는 작은 inline JavaScript로 비밀번호 입력창을 켜고 끈다.

- 체크됨: 비밀번호 필드 표시, `required` 활성화
- 체크 해제: 비밀번호 필드 비활성화, 입력값 삭제

방 비밀번호 입력은 `type="password"`를 사용해 화면에서 값을 가리고, `autocomplete="new-password"`로 브라우저에 저장된 로그인 비밀번호를 자동으로 채우지 말라는 힌트를 준다. `autocomplete`는 브라우저 동작에 대한 힌트이지 보안 검증이 아니므로, 길이와 값 검증은 항상 서버의 `RoomService`에서도 수행한다.

### 9.2 방 생성 제출

```text
create.html
  → POST /rooms
  → RoomController.createRoom()
  → @AuthenticationPrincipal에서 방장 ID 획득
  → RoomService.createRoom()
  → 제목·인원·비밀번호 검증
  → 비밀번호가 있으면 BCrypt 해시
  → game_room INSERT
  → room_members에 방장 INSERT
  → 세션에 RoomAccess 권한 저장
  → /rooms/{roomId} redirect
```

`RoomService.createRoom()`의 핵심 규칙은 다음과 같다.

- 제목 2~100자
- 최대 인원 4~8명
- 비밀번호를 사용하면 4~20자
- 상태는 처음에 `WAITING`
- 비밀번호는 `roomPassword`에 해시로 저장

비밀번호가 있는 방의 생성자는 곧바로 들어갈 수 있어야 하므로 Controller가 비밀번호가 비어 있지 않을 때 다음을 수행한다.

```java
RoomAccess.grant(session, roomId);
```

비밀번호가 없는 방은 이 권한 표시가 필요 없다. `RoomAccess`는 DB 권한이 아니라 현재 HTTP 세션 안에 “이 세션은 이 방의 비밀번호를 통과했다”는 표시를 저장하는 도우미다.

### 9.3 비밀번호 방 입장

잠금 방에 접근했는데 세션에 권한이 없으면 `rooms/access.html`을 보여 준다.

사용자가 비밀번호를 제출하면:

1. `RoomService.getRoomView()`로 방이 존재하는지 확인
2. 잠금이 아니거나 `verifyRoomPassword()`가 성공하면
3. `RoomAccess.grant(session, roomId)` 실행
4. 방 상세 페이지로 redirect

비밀번호 확인은 저장된 해시와 입력값을 `passwordEncoder.matches()`로 비교한다. 해시를 다시 만들어 문자열을 직접 비교하지 않는 것이 BCrypt 사용법이다.

---

## 10. 방 상세 화면: HTTP와 WebSocket의 결합

방 상세 페이지는 `GET /rooms/{roomId}`로 처음 HTML을 받고, 이후 실시간 연결은 브라우저 JavaScript가 별도로 만든다.

### 10.1 첫 HTML 요청

`RoomController.roomDetail()`은 다음을 한다.

1. URL의 `roomId`를 받는다.
2. 현재 사용자 닉네임과 ID를 Model에 넣는다.
3. `RoomService.getRoomView()`로 방 기본 정보를 읽는다.
4. 잠금 방이면 세션의 `RoomAccess`를 검사한다.
5. 현재 메모리 참가 상태를 `RoomPresenceService.currentState()`로 읽는다.
6. `rooms/detail.html`에 방 정보와 참가자를 넣는다.

현재 WebSocket 상태가 있으면 그 참가자를 보여 주고, 없으면 실제 접속자를 확정할 수 없으므로 참가자 수를 0으로 표시한다. 이 판단은 연결이 끊긴 뒤 DB의 오래된 `room_members` 정보가 현재 접속자처럼 보이는 문제를 줄이기 위한 것이다.

### 10.2 HTML이 JavaScript에 넘기는 값

```html
<body th:attr="data-room-id=${roomId},data-nickname=${nickname},data-user-id=${userId},data-capacity=${room.capacity}">
```

`chat.js`는 이 `data-*` 속성을 읽어서 다음 정보를 얻는다.

- 방 ID
- 현재 사용자 닉네임
- 현재 사용자 ID
- 방 정원

---

## 11. WebSocket과 STOMP를 아주 쉽게 이해하기

HTTP는 보통 “요청하고 응답받고 끝나는” 방식이다. 채팅에는 서버가 새 메시지를 보낼 때마다 브라우저가 다시 요청해야 하는 불편함이 있다.

WebSocket은 연결을 오래 유지해서 서버와 브라우저가 언제든 데이터를 보낼 수 있게 한다.

STOMP는 WebSocket 위에서 사용하는 메시지 약속이다. 이 프로젝트에서는 다음 개념을 사용한다.

| STOMP 개념 | 의미 |
| --- | --- |
| `CONNECT` | STOMP 대화를 시작 |
| `CONNECTED` | 서버가 연결을 승인 |
| `SUBSCRIBE` | 특정 주소의 메시지를 받겠다고 등록 |
| `SEND` | 특정 애플리케이션 주소로 요청 |
| `/app/...` | 서버의 Controller로 들어가는 주소 |
| `/topic/...` | 여러 구독자에게 방송되는 주소 |
| `/user/...` | 특정 사용자에게만 보내는 주소 |

주소 예시는 다음과 같다.

| 주소 | 방향 | 용도 |
| --- | --- | --- |
| `/ws` | 브라우저 ↔ 서버 연결 | WebSocket 엔드포인트 |
| `/app/rooms/{id}/join` | 브라우저 → 서버 | 방 참가 요청 |
| `/app/rooms/{id}/ready` | 브라우저 → 서버 | 준비 상태 변경 |
| `/app/rooms/{id}/chat` | 브라우저 → 서버 | 채팅 전송 |
| `/app/rooms/presence` | 브라우저 → 서버 | 로비 인원 요청 |
| `/topic/rooms/{id}/presence` | 서버 → 방 전체 | 참가자 상태 |
| `/topic/rooms/{id}/chat` | 서버 → 방 전체 | 채팅 메시지 |
| `/topic/rooms/presence` | 서버 → 로비 전체 | 방별 인원 |
| `/user/queue/room-joined` | 서버 → 요청 사용자 | 방 참가 결과 |
| `/user/queue/errors` | 서버 → 요청 사용자 | 오류 메시지 |

### 11.1 직접 만든 STOMP 클라이언트

이 프로젝트는 외부 STOMP JavaScript 라이브러리 대신 [stomp-client.js](src/main/resources/static/js/stomp-client.js)를 직접 사용한다.

이 파일의 역할은 다음과 같다.

- `escapeHeader()`: STOMP 헤더의 특수문자 이스케이프
- `unescapeHeader()`: 이스케이프된 헤더 복원
- `createFrame()`: `CONNECT`, `SEND`, `SUBSCRIBE` 문자열 생성
- `parseFrame()`: 서버가 보낸 문자열을 명령·헤더·본문으로 분리
- `createFrameParser()`: WebSocket 한 번의 message에 여러 프레임이 오거나 프레임이 잘려 와도 버퍼링해서 처리
- `startHeartbeat()`: 연결이 살아 있는지 확인하는 줄바꿈 전송
- `getReconnectDelay()`: 재연결 간격을 점점 늘리는 지수 백오프 계산
- `createReconnectController()`: 재연결 타이머 생성·초기화·취소

초보자는 STOMP 프레임을 다음처럼 생각하면 된다.

```text
COMMAND
header:value

JSON body\0
```

### 11.2 WebSocket 기초: HTTP와 무엇이 다른가

HTTP는 브라우저가 요청을 보내면 서버가 응답하고 연결의 한 작업이 끝나는 구조다. 예를 들어 로그인 화면을 열 때는 다음처럼 동작한다.

```text
브라우저 -- GET /login --> 서버
브라우저 <-- HTML 응답 -- 서버
```

채팅처럼 서버가 먼저 알려야 하는 이벤트가 있는 경우에는 HTTP만으로 매번 요청을 보내야 한다. WebSocket은 이 문제를 해결하기 위해 처음에는 HTTP로 연결을 시작하지만, 연결을 계속 유지하는 양방향 통신 채널로 전환한다.

```text
1. 브라우저가 HTTP Upgrade 요청을 보낸다.
2. 서버가 연결 전환을 승인한다. 보통 101 Switching Protocols 응답이다.
3. 이후에는 같은 연결을 닫지 않고 브라우저와 서버가 모두 먼저 메시지를 보낼 수 있다.
4. 한쪽이 close하면 WebSocket 연결이 종료된다.
```

브라우저 코드에서는 `new WebSocket("ws://호스트/ws")`가 이 연결을 시작한다. HTTPS 사이트라면 `ws` 대신 `wss`를 사용해야 데이터도 암호화된다. 이 프로젝트의 [WebSocketConfig.java](src/main/java/kr/or/oti/mafiagame/config/WebSocketConfig.java)는 브라우저가 연결할 `/ws` endpoint를 등록한다.

중요한 점은 **WebSocket 연결 자체가 곧 게임방 입장은 아니라는 것**이다. 연결은 통신 선로를 여는 단계이고, 어느 방에 참가할지는 연결이 열린 뒤 STOMP `SEND` frame으로 별도로 요청한다.

### 11.3 STOMP는 WebSocket 위의 메시지 약속이다

WebSocket은 문자열이나 바이트를 운반할 뿐, 그 문자열이 채팅인지 방 입장인지 정해 주지 않는다. STOMP는 이 데이터를 `COMMAND`, `header`, `body` 구조로 나누는 약속이다.

```text
CONNECT
accept-version:1.2
host:localhost
heart-beat:10000,10000

\0
```

- 첫 줄 `CONNECT`: 어떤 종류의 frame인지 나타낸다.
- 중간 줄 `header:value`: 목적지, 구독 ID, 데이터 형식 같은 부가 정보다.
- 빈 줄 다음 부분 `body`: JSON 같은 실제 데이터다.
- 마지막 `\0`: frame의 끝을 나타내는 종료 문자다.

서버에서 보내는 응답도 같은 규칙을 사용한다.

```text
CONNECTED
version:1.2

\0
```

프로젝트의 `stomp-client.js`는 이 frame을 직접 만든다.

1. `createFrame()`이 명령·헤더·본문을 문자열로 조립한다.
2. WebSocket의 `send()`가 그 문자열을 서버로 보낸다.
3. `createFrameParser()`가 수신 문자열을 `parseFrame()`에 넘긴다.
4. `parseFrame()`이 `command`, `headers`, `body` 객체로 나눈다.
5. `chat.js`나 `room-list.js`의 `handleFrame()`이 command와 destination에 따라 화면 동작을 선택한다.

한 번의 WebSocket `message`에 STOMP frame이 여러 개 붙어 올 수도 있고, 반대로 frame 데이터가 나누어져 도착할 수도 있다. 그래서 parser는 바로 JSON으로 변환하지 않고 버퍼에 임시로 모은다. `\0`을 찾은 완전한 frame만 꺼내 처리하는 이유가 여기에 있다.

### 11.4 이 프로젝트의 주소를 읽는 방법

주소의 접두사는 메시지가 어느 계층으로 갈지 알려준다.

| 접두사 | 읽는 방법 | 이 프로젝트의 예시 |
| --- | --- | --- |
| `/ws` | WebSocket 연결을 여는 실제 endpoint | `new WebSocket(... + '/ws')` |
| `/app` | 서버 애플리케이션 Controller로 전달되는 요청 | `/app/rooms/7/chat` |
| `/topic` | 여러 구독자에게 방송되는 broker 주소 | `/topic/rooms/7/chat` |
| `/queue` | 한 사용자 또는 한 종류의 메시지를 전달하는 broker 주소 | `/queue/room-joined` |
| `/user` | Spring이 현재 로그인 사용자 세션에 맞춰 해석하는 주소 | `/user/queue/errors` |

서버 설정의

```java
registry.setApplicationDestinationPrefixes("/app");
registry.setUserDestinationPrefix("/user");
```

때문에 Controller의 `@MessageMapping("/rooms/{roomId}/chat")` 앞에 `/app`을 붙인 `/app/rooms/{roomId}/chat`이 실제 브라우저 전송 주소가 된다. 반대로 `SimpMessagingTemplate.convertAndSend("/topic/rooms/" + roomId + "/chat", message)`처럼 `/topic`으로 보내면 그 주소를 구독한 모든 브라우저가 받는다.

`@SendToUser(value = "/queue/room-joined", broadcast = false)`는 브라우저가 직접 `/user/queue/room-joined`를 구독하게 만든다. 같은 방의 다른 사람에게 참가 결과가 전달되면 안 되므로 방 전체 topic과 개인 queue를 구분한다.

### 11.5 실제 프로젝트 파일이 맡는 역할

WebSocket 코드는 한 파일에 모두 들어 있지 않고 다음처럼 역할이 나뉜다.

| 파일 | 초보자가 확인할 책임 |
| --- | --- |
| `WebSocketConfig` | `/ws` endpoint, `/app`·`/topic`·`/user` prefix, heartbeat 등록 |
| `WebSocketAuthorizationInterceptor` | Controller에 도착하기 전 SUBSCRIBE·SEND 주소와 인증·참가 권한 검사 |
| `stomp-client.js` | STOMP 문자열 생성, parser, heartbeat, 재연결 공통 기능 |
| `room-list.js` | 로비 topic을 구독하고 방별 실시간 인원 수를 카드에 반영 |
| `chat.js` | 방 연결, 입장 확인, presence·ready·채팅 구독, DOM 갱신 |
| `RoomPresenceController` | join·ready·로비 인원 요청의 WebSocket 진입점 |
| `RoomPresenceService` | 세션·사용자·방 참가 상태와 방장·빈 방 정리 규칙 관리 |
| `ChatController` | 채팅 요청을 받아 검증된 메시지를 방 topic에 방송 |
| `ChatService` | 로그인·참가 여부·메시지 길이와 내용을 검증 |

### 11.6 연결부터 방 화면까지의 전체 순서

방 상세 페이지를 처음 열었을 때는 다음 순서로 읽으면 된다.

```text
detail.html이 body의 data-room-id 등을 준비
  → chat.js가 new WebSocket('/ws') 실행
  → open 이벤트에서 CONNECT frame 전송
  → 서버가 CONNECTED frame 응답
  → 오류 queue·room-joined queue 구독
  → /app/rooms/{roomId}/join 전송
  → WebSocketAuthorizationInterceptor가 로그인·주소를 검사
  → RoomPresenceController.join()
  → RoomPresenceService.join()
  → /user/queue/room-joined로 현재 참가자 상태 응답
  → chat.js가 내 참가를 확인한 뒤 방 presence·chat topic 구독
```

여기서 `CONNECTED`는 “WebSocket/STOMP 통신 준비 완료”라는 뜻이고, `room-joined`는 “특정 게임방 참가 완료”라는 뜻이다. 두 응답을 같은 것으로 생각하면 입장 전에 방 topic을 구독하거나, 연결은 되었지만 채팅이 안 되는 문제를 이해하기 어렵다.

---

## 12. 방 참가·준비·채팅의 실제 흐름

### 12.0 브라우저와 서버의 역할을 나눠서 보기

WebSocket 기능을 공부할 때는 한 요청을 네 단계로 나누면 덜 헷갈린다.

```text
1. 브라우저 이벤트: 클릭·연결·수신 이벤트가 시작점이 된다.
2. STOMP frame: 브라우저가 목적지와 JSON body를 넣어 SEND한다.
3. 서버 처리: Interceptor가 권한을 검사하고 Controller → Service가 규칙을 실행한다.
4. 방송·화면 반영: 서버가 개인 queue 또는 topic으로 보내고 JavaScript가 DOM을 바꾼다.
```

따라서 버튼을 눌렀는데 화면이 바뀌지 않을 때는 “버튼 코드가 실행됐는가 → SEND 주소가 맞는가 → 서버 Controller까지 왔는가 → Service가 예외를 내지 않았는가 → 응답 topic을 구독했는가 → render 함수가 DOM을 바꿨는가” 순서로 확인한다.

### 12.1 방 참가

[chat.js](src/main/resources/static/js/chat.js)는 WebSocket 연결이 성공하면 다음 순서로 동작한다.

1. `CONNECTED` 프레임 수신
2. 오류 큐 `/user/queue/errors` 구독
3. 참가 결과 큐 `/user/queue/room-joined` 구독
4. `/app/rooms/{roomId}/join`으로 빈 JSON 전송

서버에서는 [RoomPresenceController.java](src/main/java/kr/or/oti/mafiagame/controller/RoomPresenceController.java)의 `join()`이 실행된다.

```java
return roomPresenceService.join(
    roomId,
    headers.getSessionId(),
    principal,
    RoomAccess.isGranted(headers.getSessionAttributes(), roomId));
```

여기서 HTTP 세션의 `RoomAccess` 속성이 WebSocket handshake 세션 속성으로 전달되기 때문에, 앞에서 통과한 방 비밀번호 권한을 WebSocket 참가 검사에서도 사용할 수 있다.

참가가 성공하면 서버는:

1. 메모리의 참가자 목록에 세션을 등록
2. 현재 방 상태를 만든다.
3. 요청 사용자에게 `/user/queue/room-joined`로 현재 상태를 보낸다.
4. 방 전체에 `/topic/rooms/{roomId}/presence`로 방송한다.
5. 로비 전체에 방별 인원 수를 방송한다.

브라우저가 참가 결과를 받으면 참가자 카드를 다시 만들고, 그 뒤에야 방 채팅과 방 presence topic을 구독한다.

### 12.2 준비 상태 변경

준비 버튼은 연결 전에는 비활성화되어 있다. 참가 결과에서 현재 사용자가 확인되어야 활성화된다.

버튼 클릭 흐름은 다음과 같다.

```text
준비 완료 버튼 클릭
  → 현재 ready의 반대값을 JSON으로 생성
  → SEND /app/rooms/{roomId}/ready
  → RoomPresenceController.updateReady()
  → RoomPresenceService.updateReady()
  → 메모리 참가자 객체의 ready 변경
  → 방 전체에 새 RoomPresenceState 방송
  → 각 브라우저의 renderParticipants()
```

서버는 세션 ID로 실제 방 참가자인지 다시 검사한다. 화면에서 버튼을 숨기거나 비활성화한 것만으로는 보안이 되지 않기 때문이다.

### 12.3 채팅

브라우저가 보내는 채팅은 다음 모양이다.

```json
{"content":"안녕하세요"}
```

서버 흐름:

```text
SEND /app/rooms/{roomId}/chat
  → ChatController.sendMessage()
  → ChatService.createMessage()
  → 로그인 여부 검사
  → 실제 방 참가 여부 검사
  → 공백 제거·빈 문자열 검사
  → 300자 제한
  → PrincipalIdentity에서 닉네임 획득
  → ChatMessage 생성
  → /topic/rooms/{roomId}/chat 방송
```

`chat.js`는 메시지를 표시할 때 `textContent`를 사용한다.

```javascript
content.textContent = message.content || '';
```

따라서 사용자가 입력한 `<script>` 같은 문자열을 HTML 태그로 실행하지 않고 글자로 보여 준다. 이것은 채팅 화면의 기본적인 XSS 방어 방식이다.

클라이언트는 화면에 최대 200개의 메시지만 남긴다. 서버가 채팅 기록을 DB에 저장하는 구조는 현재 없다.

### 12.4 준비 상태와 채팅이 같은 방을 공유하는 이유

준비 상태와 채팅은 모두 “현재 방 참가자만 사용할 수 있는 기능”이지만, 데이터의 목적이 다르다.

- 준비 상태: `RoomPresenceState`를 방 전체에 방송하고 모든 브라우저가 참가자 카드와 버튼을 다시 그린다.
- 채팅: `ChatMessage` 하나를 방 전체에 방송하고 각 브라우저가 메시지 목록에 한 줄을 추가한다.
- 오류: `ChatError`를 요청 사용자 개인 queue로 보내 요청한 브라우저만 안내를 표시한다.

이 세 가지를 같은 `/topic`에 섞지 않고 서로 다른 destination으로 나누면 JavaScript가 받은 데이터를 어떤 화면에 적용할지 명확해진다.

```text
presence  → /topic/rooms/{id}/presence → renderParticipants()
chat      → /topic/rooms/{id}/chat     → appendMessage()
error     → /user/queue/errors         → showToast() 또는 rejectRoomEntry()
```

`chat.js`의 `roomTopicsSubscribed` 값도 중요한 안전장치다. 재연결이 여러 번 일어나도 같은 topic을 중복 구독하지 않도록 한 번 구독했는지 기억한다. 연결이 새로 만들어지면 `roomTopicsSubscribed = false`로 초기화하여 새 WebSocket 연결에서는 다시 구독한다.

---

## 13. `RoomPresenceService`를 집중해서 이해하기

이 프로젝트에서 가장 복잡한 클래스는 [RoomPresenceService.java](src/main/java/kr/or/oti/mafiagame/service/RoomPresenceService.java)다. WebSocket으로 연결된 현재 상태를 메모리에서 관리하기 때문이다.

### 13.1 주요 메모리 자료구조

| 필드 | 역할 |
| --- | --- |
| `participantsByRoom` | 방 ID → 참가자 키 → 참가자 상태 |
| `roomBySession` | WebSocket 세션 ID → 방 ID |
| `participantKeyBySession` | 세션 ID → 사용자 참가자 키 |
| `sessionsByParticipant` | 사용자 키 → 여러 세션 ID |
| `hostUserByRoom` | 방 ID → 현재 방장 사용자 ID |
| `cleanupTasksByRoom` | 빈 방 삭제 예약 작업 |
| `emptyRoomsPendingCleanup` | 잠시 비어 있지만 삭제 유예 중인 방 |

왜 세션과 사용자를 따로 관리할까? 같은 사용자가 브라우저 탭을 두 개 열 수 있기 때문이다. 사용자 한 명이 여러 WebSocket 세션을 갖더라도 참가자는 한 명으로 세고, 모든 세션이 끊겼을 때만 참가자가 방을 나간 것으로 본다.

### 13.2 동시성 제어

여러 사용자가 동시에 입장하거나 나갈 수 있으므로 `ReentrantReadWriteLock`을 사용한다.

- 읽기 작업: `readLock`
- 참가자 추가·삭제·준비 변경: `writeLock`

화면 조회처럼 상태를 바꾸지 않는 작업은 읽기 잠금을 쓰고, 참가자 목록을 바꾸는 작업은 쓰기 잠금을 쓴다. 쓰기 잠금이 필요한 중간에 다른 요청이 동시에 상태를 바꾸지 못하게 해서 인원 초과나 유령 참가자 문제를 줄인다.

### 13.3 참가자 식별

`PrincipalIdentity.from(principal)`은 Spring Security 인증 정보에서 사용자 ID와 닉네임을 꺼낸다.

- `CustomUserDetails`이면 실제 `userId`와 닉네임 사용
- 그렇지 않으면 `principal.getName()`을 대체 식별자로 사용

참가자 키는 보통 `user:사용자ID` 형태다. 사용자 ID가 없으면 `principal:이름` 형태다.

### 13.4 다른 방에 들어가면 이전 방에서 나감

`join()`은 같은 사용자가 다른 방에 이미 있으면 기존 세션을 정리한다. 한 사용자가 여러 방에 동시에 참가자로 남지 않게 하기 위한 규칙이다.

이때 이전 방의 상태도 먼저 방송하고, 새 방의 상태를 방송한다.

### 13.5 방장이 나갔을 때

현재 방장이 마지막 세션을 닫고, 다른 참가자가 남아 있으면 첫 번째 남은 참가자를 후임 방장으로 선택한다.

```text
방장 접속 종료
  → DB game_room.host_user_id 변경
  → 메모리 hostUserByRoom 변경
  → 새 방장 정보가 포함된 상태 방송
```

DB 변경이 실패하면 메모리에서 먼저 참가자를 제거하지 않도록 순서를 조심해서 작성되어 있다.

### 13.6 빈 방 삭제 유예

모든 참가자가 나가면 즉시 DB 방을 지우지 않고 `mafiagame.room.empty-cleanup-delay`만큼 기다린다. 기본값은 15초다.

이유는 네트워크가 잠깐 끊겼다가 재접속할 수 있기 때문이다.

```text
마지막 참가자 퇴장
  → 빈 방으로 표시
  → 15초 후 삭제 예약
  → 그 사이 재입장하면 예약 취소
  → 계속 비어 있으면 room_members와 game_room 삭제
```

이 기능은 단일 서버의 메모리 상태를 전제로 한다. 서버를 여러 대로 늘리면 Redis 같은 공유 상태 저장소와 메시지 브로커가 필요하다.

---

## 14. WebSocket 보안 흐름

[WebSocketConfig.java](src/main/java/kr/or/oti/mafiagame/config/WebSocketConfig.java)는 WebSocket/STOMP 기본 규칙을 설정한다.

```java
registry.enableSimpleBroker("/topic", "/queue")
        .setHeartbeatValue(new long[] {10_000, 10_000});
registry.setApplicationDestinationPrefixes("/app");
registry.setUserDestinationPrefix("/user");
```

- `/app`: Controller의 `@MessageMapping`으로 전달
- `/topic`: 여러 사람에게 방송
- `/queue`: 개인 또는 큐 형태의 메시지
- heartbeat: 10초 주기의 연결 확인

[WebSocketAuthorizationInterceptor.java](src/main/java/kr/or/oti/mafiagame/config/WebSocketAuthorizationInterceptor.java)는 메시지가 Controller에 도달하기 전에 검사한다.

### 구독 검사

- 로비 presence topic은 허용
- `/user/` 주소는 로그인 사용자만 허용
- 방 topic은 로그인 사용자이면서 해당 방 참가자여야 허용
- 정의되지 않은 주소는 거부

### 전송 검사

- 로비 인원 요청은 허용
- 방의 `join`은 로그인 사용자면 서비스에서 방 비밀번호·정원 등을 최종 검사
- `ready`, `chat`은 이미 해당 방 참가자여야 허용

서버는 클라이언트가 어떤 주소를 직접 만들어 보내더라도 이 검사를 다시 수행한다. JavaScript의 버튼 제어는 사용성이고, 실제 보안은 서버 검사다.

예외는 `RoomWebSocketException`으로 표현한다. Controller의 `@MessageExceptionHandler`가 이를 `ChatError(type="ERROR", message=...)`로 바꿔 `/user/queue/errors`에 보낸다.

### 14.1 HTTP 로그인과 WebSocket 권한은 어떻게 이어지는가

이 프로젝트의 로그인과 WebSocket은 서로 완전히 별개의 인증을 하지 않는다. 브라우저가 HTTP 로그인에 성공하면 Spring Security가 인증 정보를 세션에 보관하고, 브라우저는 이후 `/ws` handshake에도 같은 세션 cookie를 보낸다.

```text
POST /login 성공
  → Spring Security가 인증 사용자와 JSESSIONID를 세션에 저장
  → 방 상세 페이지가 /ws로 WebSocket handshake
  → HttpSessionHandshakeInterceptor가 HTTP 세션 속성을 WebSocket 세션에 전달
  → STOMP frame의 Principal·sessionId로 사용자와 브라우저 탭을 식별
```

잠금 방은 한 단계가 더 있다.

1. `RoomController.accessRoom()`이 HTTP로 비밀번호를 검증한다.
2. 성공하면 `RoomAccess.grant(session, roomId)`가 세션에 방별 허가를 기록한다.
3. handshake에서 이 세션 속성이 WebSocket 세션 속성으로 전달된다.
4. `RoomPresenceController.join()`이 `RoomAccess.isGranted(...)`를 확인해 잠금 방 입장을 허용한다.

따라서 로그인 여부와 방 비밀번호 통과 여부는 서로 다른 조건이다. 로그인했더라도 잠금 방 비밀번호를 통과하지 않았다면 방에 참가할 수 없다.

### 14.2 SUBSCRIBE와 SEND를 따로 검사하는 이유

클라이언트는 메시지를 받기 위해 `SUBSCRIBE`를 보내고, 서버에 작업을 요청하기 위해 `SEND`를 보낸다. 둘 중 하나만 검사하면 우회가 가능하므로 `preSend()`는 command에 따라 다른 메서드를 호출한다.

| 요청 | 검사 내용 | 통과 후 결과 |
| --- | --- | --- |
| `SUBSCRIBE /topic/rooms/presence` | 공개 로비 topic인지 확인 | 로비 방 인원 수 수신 |
| `SUBSCRIBE /user/...` | 로그인 Principal 확인 | 개인 오류·입장 결과 수신 |
| `SUBSCRIBE /topic/rooms/{id}/...` | 로그인 + 해당 세션이 방 참가자인지 확인 | 방 presence·채팅 수신 |
| `SEND /app/rooms/presence` | 로비 인원 요청인지 확인 | 로비 인원 방송 요청 |
| `SEND /app/rooms/{id}/join` | 로그인 후 Service에서 잠금·정원 검사 | 방 참가 시도 |
| `SEND /app/rooms/{id}/ready` | 로그인 + 현재 방 참가 여부 확인 | 준비 상태 변경 |
| `SEND /app/rooms/{id}/chat` | 로그인 + 현재 방 참가 여부 확인 | 채팅 검증·방송 |

여기서 JavaScript가 버튼을 비활성화하는 것은 사용자 경험을 위한 방어이고, 실제 권한은 `WebSocketAuthorizationInterceptor`와 `RoomPresenceService`가 다시 검사한다. 개발자 도구에서 목적지를 직접 만들어 보내도 서버 검사를 통과하지 못하면 Controller에 도달하기 전에 거부된다.

### 14.3 재연결·heartbeat·퇴장 흐름

WebSocket은 네트워크 상태에 따라 끊길 수 있으므로 연결 성공만 구현해서는 충분하지 않다.

```text
WebSocket close/error
  → heartbeat 정리
  → 연결 상태를 “재연결 중”으로 표시
  → getReconnectDelay()로 대기 시간 계산
  → createReconnectController.schedule()
  → 새 WebSocket 연결
  → CONNECT → CONNECTED → join → topic 재구독
```

`WebSocketConfig`의 heartbeat 값은 `10,000ms` 송신·수신 간격을 의미한다. `stomp-client.js`의 `startHeartbeat()`는 연결이 살아 있는 동안 빈 줄을 보내고, 연결이 종료되면 반환된 정리 함수를 호출해 timer를 멈춘다. 연결이 다시 만들어질 때는 이전 연결의 timer를 먼저 정리해야 같은 작업이 여러 번 실행되지 않는다.

반대로 사용자가 페이지를 닫는 정상적인 퇴장은 재연결하면 안 된다.

```text
beforeunload
  → shouldReconnect = false
  → 재연결 timer 취소
  → heartbeat 정지
  → 열린 소켓이면 DISCONNECT 전송
```

이 구분이 없으면 페이지를 떠난 뒤에도 JavaScript가 계속 새 연결을 만들 수 있다.

### 14.4 문제가 생겼을 때 확인할 순서

- `open`은 발생하지만 `CONNECTED`가 없다면 `/ws` endpoint, handshake, STOMP `CONNECT` frame을 확인한다.
- `CONNECTED`는 받지만 `room-joined`가 없다면 `SUBSCRIBE /user/queue/room-joined`, interceptor 권한, 방 비밀번호·정원 검사를 확인한다.
- `room-joined`는 받지만 채팅이 안 되면 방 topic 구독 시점과 `/topic/rooms/{id}/chat` 주소를 확인한다.
- 메시지는 서버 log에 보이지만 화면이 안 바뀌면 `handleFrame()`의 destination 분기와 `appendMessage()` 또는 `renderParticipants()`를 확인한다.
- 같은 사용자의 다른 탭에서 기존 방이 종료된다면 `RoomPresenceService.join()`의 “다른 방 입장 시 이전 세션 정리” 규칙을 확인한다.

테스트에서는 이 흐름을 [WebSocketAuthorizationInterceptorTest.java](src/test/java/kr/or/oti/mafiagame/config/WebSocketAuthorizationInterceptorTest.java), [ControllerDelegationTest.java](src/test/java/kr/or/oti/mafiagame/controller/ControllerDelegationTest.java), [RoomPresenceServiceTest.java](src/test/java/kr/or/oti/mafiagame/service/RoomPresenceServiceTest.java), [ChatServiceTest.java](src/test/java/kr/or/oti/mafiagame/service/ChatServiceTest.java) 순서로 나누어 확인한다.

---

## 15. DB 접근: Mapper 인터페이스와 XML

### 15.1 Mapper 인터페이스

[RoomMapper.java](src/main/java/kr/or/oti/mafiagame/dao/RoomMapper.java)는 SQL을 직접 쓰지 않고 메서드 이름과 파라미터만 선언한다.

```java
RoomSummary findById(@Param("roomId") long roomId);
```

같은 이름의 `<select id="findById">`가 [RoomMapper.xml](src/main/resources/mappers/RoomMapper.xml)에 있다. MyBatis가 둘을 연결한다.

### 15.2 조회 결과

방 목록 SQL은 다음 정보를 조합한다.

- `game_room`: 방 기본 정보
- `user`: 방장 이름
- `room_members`: 등록된 참가자 수
- `CASE`: 비밀번호가 있으면 `locked = true`

`GROUP BY`와 `COUNT(rm.user_id)`가 있기 때문에 방별로 참가자 수를 계산한다.

### 15.3 생성과 자동 증가 ID

```xml
<insert id="insert" useGeneratedKeys="true" keyProperty="roomId">
```

DB가 생성한 방 ID를 `Room.roomId`에 다시 채워 준다. 그 다음 `insertMember(room.getRoomId(), hostUserId)`로 방장을 참가자로 등록한다.

### 15.4 User Mapper

`UserMapper.xml`은 `resultMap`으로 DB 컬럼과 Java 필드를 연결한다.

```xml
<id property="userId" column="user_id"/>
<result property="userName" column="user_name"/>
```

`mybatis.configuration.map-underscore-to-camel-case=true`도 설정되어 있지만, 사용자 모델처럼 이름이 완전히 일치하지 않는 필드는 `resultMap`으로 명시해 두었다.

---

## 16. Domain, DTO, View를 구분하는 법

### Domain

`domain/User`, `domain/Room`, `domain/UserStats`는 DB 데이터와 가까운 객체다.

- Lombok의 `@Getter`, `@Setter`, `@Builder` 등으로 반복 코드를 줄인다.
- `User`는 `@ToString(exclude = "password")`로 비밀번호가 로그에 노출되지 않게 한다.

### DAO와 Domain을 나누는 이유

두 패키지는 이름이 비슷해 보여도 책임이 다르다.

| 구분 | 현재 프로젝트의 예 | 책임 |
| --- | --- | --- |
| DAO/Mapper | `UserMapper`, `RoomMapper` | 어떤 SQL 작업을 호출할지 정의 |
| Domain | `User`, `Room`, `UserStats` | 애플리케이션과 DB가 다루는 데이터 표현 |
| DTO/View | `RoomSummary`, `RoomView`, `ChatMessage` | 특정 조회·화면·메시지에 필요한 데이터 전달 |

Mapper와 Domain을 한 클래스에 합치면 데이터 자체와 저장 방법이 결합되어 Service 테스트와 저장 방식 변경이 어려워진다. 반대로 현재 규모에서 `RoomEntity`와 `RoomDomain`처럼 거의 같은 객체를 추가로 복제할 필요도 없다. 지금은 패키지 책임만 분리하고, 실제 게임 규칙이 복잡해질 때 게임 상태 모델을 Domain에 추가하는 정도가 적절하다.

### DTO

`dto` 패키지는 전달 목적에 따라 작은 데이터 구조를 정의한다.

- `ChatMessageRequest`: 브라우저가 보내는 채팅 입력
- `ChatMessage`: 서버가 방송하는 완성된 채팅
- `ChatError`: 실시간 오류
- `RoomReadyRequest`: 준비 여부
- `RoomParticipant`: 현재 방 참가자 한 명
- `RoomPresenceState`: 한 방의 참가자 전체 상태
- `RoomPresenceCount`: 로비에 보내는 방별 인원
- `RoomSummary`: MyBatis 조회 결과
- `RoomView`: HTML 화면용 방 모델
- `UserProfile`: 사용자 프로필 화면용 모델
- `GameRecord`: 미래의 게임 이력 화면용 모델

Java `record`는 값을 담기 위한 불변 데이터 구조를 짧게 작성하는 문법이다.

### 계산 메서드가 있는 DTO

`UserProfile`은 화면에 필요한 승률을 계산한다.

```java
public int winRate() {
    return totalGames == 0 ? 0 : Math.round((float) wins / totalGames * 100);
}
```

게임을 한 번도 하지 않았을 때 0으로 나누지 않도록 보호한다.

현재 게임 이력 테이블이 없기 때문에 `UserService`는 `mafiaGames`, `mafiaWins`, `recentGames`를 실제 기록으로 채우지 않고 준비 중 상태로 둔다.

---

## 17. 프론트엔드 파일별 역할

### 템플릿

| 파일 | 역할 |
| --- | --- |
| `templates/auth/login.html` | 로그인 폼과 성공·실패 안내 |
| `templates/auth/signup.html` | 회원가입 폼과 서버 오류 출력 |
| `templates/fragments/user-menu.html` | 비로그인/로그인 사용자 메뉴 공통 조각 |
| `templates/rooms/list.html` | 로비, 검색, 상태 필터, 방 카드 |
| `templates/rooms/create.html` | 방 제목·정원·비밀번호 입력 |
| `templates/rooms/access.html` | 잠금 방 비밀번호 입력 |
| `templates/rooms/detail.html` | 참가자, 준비 버튼, 채팅 대기실 |
| `templates/users/detail.html` | 프로필, 통계, 게임 이력 자리 |

`fragments/user-menu.html`은 `th:fragment="userMenu"`로 조각을 정의하고 다른 템플릿이 다음처럼 삽입한다.

```html
<th:block th:replace="~{fragments/user-menu :: userMenu}"></th:block>
```

`sec:authorize`는 Spring Security 인증 상태에 따라 게스트 메뉴와 로그인 메뉴 중 하나를 보여 준다.

### JavaScript

| 파일 | 역할 |
| --- | --- |
| `static/js/stomp-client.js` | 공통 STOMP 프레임·heartbeat·재연결 도구 |
| `static/js/room-list.js` | 로비 WebSocket과 방별 인원 표시 |
| `static/js/chat.js` | 방 참가, presence, 준비 상태, 채팅, 재연결 |

`chat.js`는 DOM을 직접 만든다. 참가자 카드는 `createElement()`로 만들고, 메시지 내용은 `textContent`로 넣는다. 따라서 서버가 보낸 데이터라고 무조건 HTML로 삽입하지 않는다.

### CSS

[app.css](src/main/resources/static/css/app.css)는 애플리케이션 전체의 시각 표현을 담당한다.

주요 묶음은 다음과 같다.

- 브랜드·사용자 메뉴: `.brand`, `.user-menu-*`
- 색상·영웅 영역: `.text-coral`, `.btn-coral`, `.bg-mafia`, `.app-hero`
- 방·프로필 헤더: `.app-room-header`, `.app-profile-hero`
- 참가자 카드: `.member`, `.avatar`, `.empty-seat`, `.participant-ready`
- 채팅: `.chat-panel`, `.chat-message`, `.chat-avatar-*`, `.chat-message-bubble`
- 인증 화면: `.auth-art`, `.auth-card`
- 로비 카드·토스트: `.room-card`, `.toast`

CSS는 서버 업무 규칙을 결정하지 않는다. 예를 들어 준비 버튼이 빨갛게 보이는 것은 CSS의 역할이고, 실제 준비 상태 변경 가능 여부는 `RoomPresenceService`가 결정한다.

---

## 18. 전체 클래스 빠른 해설

### `config`

- `SecurityConfig`: BCrypt, URL 접근 권한, 로그인·로그아웃 설정
- `WebSocketConfig`: STOMP broker, `/ws`, heartbeat, interceptor 등록
- `WebSocketAuthorizationInterceptor`: WebSocket 구독·전송 권한 검사

### `controller`

- `AuthController`: 로그인·회원가입 화면과 회원가입 제출
- `RoomController`: 로비, 방 생성, 방 상세, 비밀번호 입장
- `RoomPresenceController`: WebSocket 방 참가, 준비 상태, 로비 인원 요청
- `ChatController`: WebSocket 채팅 전송과 채팅 오류 처리
- `UserController`: 사용자 프로필 화면

### `service`

- `SignupService`: 회원가입 검증·암호화·저장
- `CustomUserDetailsService`: 로그인 시 이메일로 사용자 조회
- `UserService`: 프로필과 통계 조합
- `RoomService`: 방 조회·생성·비밀번호 검증·방장 변경·방 삭제
- `RoomPresenceService`: 실시간 참가자 상태, 방장 위임, 빈 방 정리
- `ChatService`: 채팅 입력 검증과 메시지 생성

### `dao`

- `UserMapper`: 사용자와 통계 SQL 호출
- `RoomMapper`: 방, 방장, 방 참가자 SQL 호출

### `domain`

- `User`: 사용자 DB 행
- `UserStats`: 사용자 통계 DB 행
- `Room`: 방 생성·저장용 객체

### `security`

- `CustomUserDetails`: Spring Security 사용자와 앱 사용자 정보 연결
- `PrincipalIdentity`: WebSocket `Principal`에서 ID·닉네임 추출
- `RoomAccess`: HTTP 세션과 WebSocket 세션 사이의 방 비밀번호 통과 정보 공유

### `exception`

- `RoomWebSocketException`: WebSocket 업무 오류를 표현하는 RuntimeException

---

## 19. 현재 구현과 앞으로 구현할 부분

현재 소스를 읽을 때 다음 표를 기준으로 보면 혼란이 줄어든다.

| 영역 | 현재 상태 |
| --- | --- |
| 회원가입·로그인 | 실제 DB와 Spring Security 연결 완료 |
| 방 목록 | DB 조회 + 로비 실시간 인원 덮어쓰기 |
| 방 생성 | 실제 DB 저장, 비밀번호 BCrypt 해시 |
| 방 비밀번호 | HTTP 세션 권한과 WebSocket 입장 검사 연결 |
| 방 참가자 | WebSocket 연결 기준 메모리 관리 |
| 준비 상태 | 메모리에서 실시간 동기화 |
| 채팅 | 실시간 방송, DB 저장 없음 |
| 게임 역할 | 미구현 |
| 낮/밤 상태 전이 | 미구현 |
| 투표·승패 | 미구현 |
| 게임 이력 | 테이블과 저장 로직 미구현 |
| 친구·초대 | 화면 버튼과 안내만 있음 |

특히 화면에 보이는 “마피아 2명·경찰 1명·의사 1명”, 업적, 친구 추가, 전체 전적 보기 등은 현재 실제 게임 로직과 연결된 것이 아니라 화면 안내 또는 자리 표시자다.

---

## 20. 초보자 추천 학습 순서

한 번에 모든 파일을 읽지 말고 다음 순서로 따라가면 좋다.

### 1단계: Spring Boot 시작

다음 파일만 먼저 읽는다.

- `MafiagameApplication.java`
- `build.gradle`
- `application.properties`

목표는 “서버가 어떻게 시작되고 어떤 의존성을 쓰는가”를 이해하는 것이다.

### 2단계: 가장 단순한 화면 요청

- `AuthController.login()`
- `templates/auth/login.html`

`GET /login`이 어떻게 HTML 파일로 연결되는지 확인한다.

### 3단계: 회원가입의 계층 흐름

다음 순서로 읽는다.

1. `signup.html`
2. `AuthController`
3. `SignupService`
4. `UserMapper`
5. `UserMapper.xml`
6. `User` domain

입력값이 Controller에서 Service로 이동하고, SQL을 통해 DB에 저장되는 흐름을 연습할 수 있다.

### 4단계: Spring Security

- `SecurityConfig`
- `CustomUserDetailsService`
- `CustomUserDetails`
- `user-menu.html`

로그인 성공 후 세션의 인증 정보가 화면과 Controller에 어떻게 전달되는지 본다.

### 5단계: 방 목록과 방 생성

- `RoomController`
- `RoomService`
- `RoomMapper`
- `RoomMapper.xml`
- `list.html`
- `create.html`

여기서 MVC + Service + MyBatis를 한 번에 연습한다.

### 6단계: WebSocket/STOMP

먼저 `stomp-client.js`의 `createFrame()`과 `parseFrame()`을 이해한 뒤, 다음을 읽는다.

- `WebSocketConfig`
- `WebSocketAuthorizationInterceptor`
- `RoomPresenceController`
- `RoomPresenceService`
- `chat.js`

### 7단계: 상태와 동시성

마지막으로 `RoomPresenceService`의 다음 부분을 집중적으로 읽는다.

- 사용자와 세션의 차이
- read/write lock
- 방장 위임
- disconnect 이벤트
- 빈 방 삭제 예약

---

## 21. 직접 따라 해 볼 수 있는 디버깅 방법

### 로비 목록이 안 보일 때

1. MariaDB가 실행 중인지 확인
2. `application.properties`의 포트가 실제 DB 포트와 같은지 확인
3. `RoomController.roomList()`에 진입하는지 확인
4. `RoomMapper.xml`의 `findAll` SQL을 확인
5. `rooms/list.html`에서 `rooms`가 반복되는지 확인

### 로그인에 실패할 때

1. `<input name="email">`, `<input name="password">`가 맞는지 확인
2. `SecurityConfig`의 `usernameParameter`, `passwordParameter` 확인
3. `CustomUserDetailsService`가 소문자 이메일로 조회하는지 확인
4. DB 비밀번호가 BCrypt 해시인지 확인

### 방에 들어갔는데 채팅이 안 될 때

1. 브라우저 개발자 도구에서 `/ws` 연결 상태 확인
2. `chat.js`가 STOMP `CONNECTED`를 받았는지 확인
3. `/app/rooms/{roomId}/join`을 보냈는지 확인
4. `/user/queue/room-joined` 결과를 받았는지 확인
5. 참가 성공 후 방 topic을 구독했는지 확인
6. `WebSocketAuthorizationInterceptor`에서 방 참가자로 판정되는지 확인
7. 서버 로그에서 `RoomWebSocketException` 메시지 확인

### 재접속 중 상태가 반복될 때

- 브라우저와 서버의 heartbeat 주기를 확인
- 세션 쿠키가 유지되는지 확인
- WebSocket handshake가 같은 출처에서 이루어지는지 확인
- `roomTopicsSubscribed`가 연결마다 초기화되는지 확인
- 서버 메모리 참가 상태와 실제 연결 상태가 일치하는지 확인

---

## 22. 이 프로젝트에서 배울 수 있는 핵심 개념

이 프로젝트를 공부하면서 다음 개념을 실제 코드로 연습할 수 있다.

1. Spring Boot 애플리케이션 시작
2. 의존성 주입과 생성자 주입
3. Spring MVC Controller와 URL 매핑
4. Thymeleaf Model 바인딩
5. Service 계층과 업무 규칙 분리
6. MyBatis Mapper와 XML SQL
7. DB 조회 결과와 화면 DTO 분리
8. BCrypt 비밀번호 해시
9. Spring Security 세션 인증
10. WebSocket 연결과 STOMP 메시지
11. 구독·방송·개인 메시지
12. 서버 측 권한 검사
13. JavaScript DOM 조작
14. 재연결과 heartbeat
15. 멀티 세션 상태 관리
16. 읽기/쓰기 잠금을 이용한 동시성 제어
17. 예약 작업과 자원 정리

최종적으로 이 프로젝트를 한 문장으로 설명하면 다음과 같다.

> MAFIAGAME은 Spring Boot가 HTTP 화면과 인증을 처리하고, MyBatis가 MariaDB와 통신하며, WebSocket/STOMP와 메모리 상태가 대기방의 실시간 참가자·준비·채팅을 동기화하는 웹 애플리케이션이다.

---

## 23. 테스트 코드로 구조를 복습하는 방법

테스트는 단순히 오류를 찾는 도구가 아니라 “이 코드가 지켜야 하는 규칙”을 가장 짧게 보여 주는 학습 자료다. 테스트 메서드 이름을 먼저 읽고 예상 결과를 말한 뒤 구현을 확인하면 복습 효과가 좋다.

### Java 테스트 지도

| 테스트 | 확인하는 핵심 |
| --- | --- |
| `MafiagameApplicationTest` | Spring 애플리케이션 Context가 정상 생성되는지 |
| `SignupServiceTest` | 입력 정규화, 검증, BCrypt 저장, 중복 처리 |
| `UserAccountServiceTest` | 로그인 사용자 조회와 프로필 조합 |
| `RoomServiceTest` | 방 생성, 비밀번호, 입력 검증, 방장 변경 |
| `RoomPresenceServiceTest` | 다중 탭, 다른 방 이동, 정원, 동시 입장, 방장 위임, 빈 방 정리 |
| `ChatServiceTest` | 참가자 권한, 공백·길이 검증, 메시지 생성 |
| `RoomControllerTest` | DB 인원과 실시간 인원의 조합, 잠금 방 접근 |
| `ControllerDelegationTest` | WebSocket Controller가 Service 결과를 올바른 주소로 전달하는지 |
| `WebSocketAuthorizationInterceptorTest` | STOMP 전송·구독 주소별 인증과 참가 권한 |
| `MapperIntegrationTest` | MyBatis XML과 Mapper가 실제로 연결되는지 |

Service와 Controller 테스트는 주로 Mockito로 협력 객체를 대체해 해당 계층의 판단만 확인한다. `MapperIntegrationTest`는 테스트용 H2 DB를 MariaDB 호환 모드로 실행해 SQL 연결을 확인한다. H2 호환 모드는 실제 MariaDB와 완전히 같지는 않으므로, 배포 전에는 실제 MariaDB 스키마에서도 주요 SQL을 확인해야 한다.

테스트는 보통 다음 세 단계로 읽는다.

```text
Given: 테스트에 필요한 사용자·방·Mock 응답 준비
When:  검사할 메서드 실행
Then:  반환값, 예외, 상태 변화, 협력 객체 호출 검증
```

### 테스트 실행과 결과 읽기

```powershell
.\gradlew.bat test
```

전체 성공 시 Gradle 출력의 마지막에 `BUILD SUCCESSFUL`이 표시된다.

테스트가 실패하면 마지막 오류만 보지 말고 다음 순서로 읽는다.

1. 실패한 테스트 메서드 이름으로 깨진 규칙을 확인한다.
2. expected와 actual의 차이를 확인한다.
3. 테스트의 Given 데이터가 현재 구현과 맞는지 확인한다.
4. 구현을 고친 뒤 관련 테스트와 전체 테스트를 차례로 실행한다.

### 자동 테스트가 대신하지 못하는 검증

현재 테스트만으로 다음 항목을 완전히 보장할 수는 없다.

- 실제 브라우저 창 두 개에서 같은 사용자로 같은 방에 접속하는 흐름
- 같은 사용자가 다른 방으로 이동할 때 이전 창에 표시되는 퇴장 상태
- 실제 MariaDB 버전과 운영 스키마에서의 SQL 호환성
- 네트워크 지연·장시간 연결·브라우저 절전 후 WebSocket 재연결
- 모바일 화면의 레이아웃과 접근성

따라서 자동 테스트 통과 후에는 핵심 다중 창 시나리오를 브라우저에서 한 번 확인하는 것이 좋다.

---

## 24. 자주 헷갈리는 경계 다섯 가지

### DB 방과 실시간 방은 같은 상태가 아니다

`game_room`과 `room_members`는 영속 데이터이고, `RoomPresenceService`는 지금 연결된 WebSocket 세션을 나타낸다. 로비와 방 상세 화면은 현재 접속 인원이 중요하므로 DB의 오래된 참가자 수보다 메모리의 실시간 상태를 우선한다.

### HTTP 로그인과 STOMP 권한은 별도 단계다

Spring Security로 로그인했다고 모든 방 topic을 구독할 수 있는 것은 아니다. HTTP 인증 후에도 `WebSocketAuthorizationInterceptor`가 방 참가 여부와 목적지 주소를 다시 검사한다.

### 사용자 한 명과 WebSocket 세션 하나는 같은 뜻이 아니다

같은 사용자가 창이나 탭을 여러 개 열면 WebSocket 세션은 여러 개지만 참가자는 한 명이다. 같은 방의 세션들은 준비 상태를 공유하고, 마지막 세션이 끊겨야 참가자가 퇴장한다. 다른 방으로 접속하면 기존 방의 해당 사용자 세션들을 먼저 정리한다.

### 클라이언트 검증은 편의이고 서버 검증이 규칙이다

HTML의 `required`, `minlength`, 버튼 비활성화는 사용자 실수를 줄여 준다. 하지만 요청은 직접 만들 수 있으므로 제목·비밀번호·채팅 길이·방 정원·참가 권한은 Service와 Interceptor에서도 검사해야 한다.

### DAO와 Domain은 합칠 대상이 아니다

Domain은 데이터를 표현하고 DAO/Mapper는 저장·조회 방법을 정의한다. 둘은 함께 사용되지만 변경 이유가 다르므로 현재처럼 패키지를 나누는 것이 적절하다.

---

## 25. 복습용 자가 점검 문제

아래 질문에 코드를 보지 않고 답해 본다.

1. `GET /rooms` 요청은 어떤 계층과 파일을 거쳐 HTML이 되는가?
2. 회원가입 비밀번호를 Controller가 아니라 Service에서 검증해야 하는 이유는 무엇인가?
3. `Room`, `RoomMapper`, `RoomView`의 책임은 각각 무엇인가?
4. 잠금 방의 HTTP 비밀번호 인증 결과가 WebSocket 참가 요청까지 어떻게 전달되는가?
5. 같은 사용자가 같은 방을 두 창에서 열어도 참가자가 한 명인 이유는 무엇인가?
6. 같은 사용자가 다른 방에 들어갈 때 이전 방의 상태는 어떻게 정리되는가?
7. 로비에서 DB의 참가자 수 대신 실시간 인원 수를 덮어쓰는 이유는 무엇인가?
8. 채팅 내용을 `innerHTML`이 아니라 `textContent`로 출력하는 이유는 무엇인가?
9. `ReentrantReadWriteLock`에서 입장·퇴장이 쓰기 잠금을 사용해야 하는 이유는 무엇인가?
10. 단위 테스트, Mapper 통합 테스트, 실제 브라우저 검증이 각각 발견하기 좋은 문제는 무엇인가?

<details>
<summary>정답 핵심어 확인</summary>

1. `RoomController` → `RoomPresenceService`/`RoomService` → `RoomMapper` → Model → `rooms/list.html` 순서다.
2. 화면을 우회한 요청에도 같은 업무 규칙을 적용하고 재사용·테스트하기 위해서다.
3. `Room`은 저장 데이터, `RoomMapper`는 SQL 호출, `RoomView`는 화면 표시용 데이터다.
4. `RoomAccess`가 HTTP 세션에 표시를 저장하고 `HttpSessionHandshakeInterceptor`가 WebSocket 세션 속성으로 전달한다.
5. 사용자 키와 세션 집합을 따로 관리해 여러 세션을 하나의 참가자로 묶기 때문이다.
6. 새 방 입장 전에 해당 사용자의 이전 방 세션을 제거하고 이전 방 상태를 다시 방송한다.
7. `room_members`에는 종료된 연결의 정보가 남을 수 있지만 메모리 상태는 현재 WebSocket 연결을 나타내기 때문이다.
8. 사용자 입력을 HTML로 실행하지 않고 일반 문자열로 표시해 XSS 위험을 줄이기 위해서다.
9. 동시에 참가자 목록이 바뀌면 정원 초과, 잘못된 방장 위임, 유령 참가자가 발생할 수 있기 때문이다.
10. 단위 테스트는 계층별 규칙, Mapper 테스트는 SQL 연결, 브라우저 검증은 실제 세션·렌더링·네트워크 흐름에 적합하다.

</details>

### 복습 완료 체크리스트

- [ ] 회원가입 요청 흐름을 파일 순서대로 설명할 수 있다.
- [ ] 로그인 성공 후 사용자 정보가 Controller와 Thymeleaf에 전달되는 방식을 설명할 수 있다.
- [ ] 방 생성 트랜잭션에서 두 INSERT가 함께 성공해야 하는 이유를 설명할 수 있다.
- [ ] `/app`, `/topic`, `/user`의 차이를 설명할 수 있다.
- [ ] 같은 사용자·여러 세션을 별도로 관리하는 이유를 설명할 수 있다.
- [ ] DB 상태와 실시간 메모리 상태의 차이를 설명할 수 있다.
- [ ] DAO, Domain, DTO를 예시와 함께 구분할 수 있다.
- [ ] 테스트 실패 시 관련 계층부터 추적할 수 있다.

이 체크리스트에 막힘없이 답할 수 있다면 현재 구현 범위의 구조를 충분히 이해한 것이다. 이후 실제 게임 기능을 추가할 때는 `RoomGameState`, `GamePhase`, `Role` 같은 게임 Domain과 상태 전이 테스트를 같은 방식으로 확장하면 된다.

---

## 26. src 전체 소스코드와 파일별 학습 설명

이 부록은 요청 범위에 맞춰 `src/main`과 `src/test` 안의 텍스트 기반 소스·리소스·테스트를 파일별 설명과 함께 정리한다. 각 파일의 설명을 먼저 읽고 바로 아래 코드에서 설명한 흐름을 확인하면 된다.

### 이 부록의 읽는 법

- **코드 흐름**: 파일 안에서 무엇이 호출되고 다음에 어느 계층으로 넘어가는지 설명한다.
- **학습 포인트**: 처음 보는 사람이 변수·메서드·템플릿·SQL의 역할을 잡을 수 있는 질문이다.
- 아래 코드는 현재 시점의 `src` 스냅샷이다. `build/`, `node_modules/`, `output/`, `tmp/`, 루트 `test/js`, IDE 설정과 이미지 파일은 요청 범위 밖이므로 포함하지 않았다.
- `src/main/resources/application.properties`의 로컬 DB 접속값은 문서에 복제하지 않도록 환경 변수 표기로 치환했으며 실제 소스 파일은 변경하지 않았다.

### 먼저 따라갈 대표 흐름

1. **회원가입**: `signup.html` → `AuthController` → `SignupService` → `UserMapper` → `UserMapper.xml` → DB
2. **방 생성**: `create.html` → `RoomController` → `RoomService` → `RoomMapper` → `RoomMapper.xml` → DB
3. **대기방 입장**: `detail.html` → `stomp-client.js`·`chat.js` → `WebSocketAuthorizationInterceptor` → `RoomPresenceController` → `RoomPresenceService`
4. **채팅**: `chat.js` → `ChatController` → `ChatService` → STOMP Broker → 같은 방의 브라우저들
5. **검증**: 각 Java 테스트 → 구현 규칙, `src/test/resources` → H2 스키마·테스트 환경

### WebSocket 소스코드 읽기 순서

26번의 WebSocket 코드는 아래 순서로 읽으면 파일 사이의 연결이 자연스럽게 보인다.

1. **연결 규칙**: `WebSocketConfig`에서 `/ws`, `/app`, `/topic`, `/user`, heartbeat를 확인한다.
2. **공통 브라우저 통신**: `stomp-client.js`에서 `createFrame()`과 `createFrameParser()`를 확인한다.
3. **권한 경계**: `WebSocketAuthorizationInterceptor.preSend()`가 SUBSCRIBE·SEND를 어떻게 나누는지 본다.
4. **기능 진입점**: `RoomPresenceController`와 `ChatController`의 `@MessageMapping` 주소를 찾는다.
5. **업무 규칙**: `RoomPresenceService`와 `ChatService`에서 세션·참가자·메시지 검증 흐름을 따라간다.
6. **화면 반영**: `chat.js`의 `handleFrame()`, `renderParticipants()`, `appendMessage()`가 서버 결과를 DOM으로 바꾸는 지점을 확인한다.

즉, 브라우저 코드에서 주소를 발견하면 먼저 `WebSocketConfig`의 prefix를 확인하고, 그 다음 같은 주소의 `@MessageMapping`을 찾는다. Controller에서 메서드를 찾았다면 바로 다음 Service 호출을 따라가고, Service가 어느 destination으로 방송하는지 확인한 뒤 다시 JavaScript의 구독·처리 함수로 돌아오면 된다.

## Java 애플리케이션 코드

### `src/main/java/kr/or/oti/mafiagame/MafiagameApplication.java`

**코드 흐름:** Spring Boot의 시작점이다. `main`이 서버를 실행하고 `@SpringBootApplication`이 컴포넌트와 설정을 찾는다.

**학습 포인트:** 이 파일에서 시작해 Controller → Service → DAO로 내려가며 요청 흐름을 추적한다.

````java
// 코드 흐름: 파일의 선언과 실행 순서를 위에서 아래로 읽는다.
// 동작: 이 파일을 호출하는 곳과 결과를 사용하는 곳을 함께 찾는다.
// 읽는 순서: 필드(상태·의존성) → 생성자(준비) → public 메서드(외부에서 시작되는 흐름) 순서로 읽는다.
// 메서드 안에서는 입력 확인 → 핵심 처리 → 반환값 또는 예외 순서로 흐름을 따라가면 된다.
package kr.or.oti.mafiagame;


@SpringBootApplication
@MapperScan("kr.or.oti.mafiagame.dao")
public class MafiagameApplication {
    // Spring Boot 실행을 시작하고 DAO Mapper 검색 범위를 등록한다.

	// JVM이 가장 먼저 호출하는 시작점이다.
	public static void main(String[] args) {
		SpringApplication.run(MafiagameApplication.class, args);
	}

}
````

### `src/main/java/kr/or/oti/mafiagame/config/SecurityConfig.java`

**코드 흐름:** Spring Security의 필터 체인을 만든다. 공개 URL, 로그인 필요 URL, 로그인·로그아웃 이동 경로와 BCrypt PasswordEncoder를 설정한다.

**학습 포인트:** 화면의 버튼 제어와 달리 실제 접근 제한은 이 필터 체인에서 수행된다.

````java
// 코드 흐름: 애플리케이션 시작 시 Spring이 이 설정을 읽어 기능을 등록한다.
// 동작: 설정 메서드가 만든 Bean이나 Interceptor가 이후 요청 처리 흐름에 참여한다.
// 읽는 순서: 필드(상태·의존성) → 생성자(준비) → public 메서드(외부에서 시작되는 흐름) 순서로 읽는다.
// 메서드 안에서는 입력 확인 → 핵심 처리 → 반환값 또는 예외 순서로 흐름을 따라가면 된다.
package kr.or.oti.mafiagame.config;


@Configuration
public class SecurityConfig {
    // 애플리케이션 시작 시 Spring이 읽어 Web·보안·WebSocket 구성 요소를 등록한다.

    // 비밀번호를 평문으로 저장하지 않도록 BCrypt 방식의 PasswordEncoder Bean을 만든다.
    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // HTTP 경로별 공개·인증 필요 규칙과 로그인·로그아웃 후 이동 위치를 등록한다.
    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers("/", "/rooms", "/login", "/signup", "/css/**", "/js/**", "/webjars/**", "/error").permitAll()
                        .requestMatchers("/ws/**").permitAll()
                        .anyRequest().authenticated())
                .formLogin(form -> form
                        .loginPage("/login")
                        .loginProcessingUrl("/login")
                        .usernameParameter("email")
                        .passwordParameter("password")
                        .failureUrl("/login?error")
                        .defaultSuccessUrl("/rooms", true)
                        .permitAll())
                .logout(logout -> logout
                        .logoutUrl("/logout")
                        .logoutSuccessUrl("/login?logout")
                        .invalidateHttpSession(true)
                        .clearAuthentication(true)
                        .deleteCookies("JSESSIONID"))
                .build();
    }
}
````

### `src/main/java/kr/or/oti/mafiagame/config/WebSocketConfig.java`

**코드 흐름:** WebSocket endpoint, `/app` 요청 prefix, `/topic` Broker를 설정하고 인바운드 채널에 권한 Interceptor를 연결한다.

**학습 포인트:** 브라우저 연결 주소와 Controller의 `@MessageMapping` 주소가 어떻게 이어지는지 확인한다.

````java
// 코드 흐름: 애플리케이션 시작 시 Spring이 이 설정을 읽어 기능을 등록한다.
// 동작: 설정 메서드가 만든 Bean이나 Interceptor가 이후 요청 처리 흐름에 참여한다.
// 읽는 순서: 필드(상태·의존성) → 생성자(준비) → public 메서드(외부에서 시작되는 흐름) 순서로 읽는다.
// 메서드 안에서는 입력 확인 → 핵심 처리 → 반환값 또는 예외 순서로 흐름을 따라가면 된다.
package kr.or.oti.mafiagame.config;


@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    // 애플리케이션 시작 시 Spring이 읽어 Web·보안·WebSocket 구성 요소를 등록한다.
    private final WebSocketAuthorizationInterceptor authorizationInterceptor;

    // 생성자: Spring 또는 호출자가 넘긴 의존성과 초기 상태를 필드에 보관한다.
    public WebSocketConfig(WebSocketAuthorizationInterceptor authorizationInterceptor) {
        this.authorizationInterceptor = authorizationInterceptor;
    }

    // 클라이언트가 보낼 /app과 서버가 방송할 /topic·/queue 주소 규칙을 등록한다.
    @Override
    public void configureMessageBroker(@NonNull MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic", "/queue")
                .setTaskScheduler(webSocketTaskScheduler())
                .setHeartbeatValue(new long[] {10_000, 10_000});
        registry.setApplicationDestinationPrefixes("/app");
        registry.setUserDestinationPrefix("/user");
    }

    // STOMP heartbeat를 일정하게 보내 WebSocket 연결이 살아 있는지 확인할 스케줄러를 만든다.
    @Bean
    public ThreadPoolTaskScheduler webSocketTaskScheduler() {
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(1);
        scheduler.setThreadNamePrefix("websocket-heartbeat-");
        scheduler.setWaitForTasksToCompleteOnShutdown(true);
        scheduler.setAwaitTerminationSeconds(5);
        return scheduler;
    }

    // WebSocket으로 들어오는 inbound frame마다 권한 검사기가 실행되도록 연결한다.
    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(authorizationInterceptor);
    }

    // 브라우저가 연결할 /ws endpoint와 HTTP 세션 전달 방식을 설정한다.
    @Override
    public void registerStompEndpoints(@NonNull StompEndpointRegistry registry) {
        // The room page and WebSocket endpoint are served by the same origin.
        registry.addEndpoint("/ws")
                .addInterceptors(new HttpSessionHandshakeInterceptor());
    }
}
````

### `src/main/java/kr/or/oti/mafiagame/config/WebSocketAuthorizationInterceptor.java`

**코드 흐름:** STOMP 메시지가 도착할 때 `preSend`가 실행되어 목적지 패턴, 로그인 여부, 방 참가 여부를 검사한다.

**학습 포인트:** 통과한 메시지만 Controller로 보내므로 다른 방 topic 구독과 채팅을 서버에서 차단할 수 있다.

````java
// 코드 흐름: STOMP 메시지의 목적지와 사용자 인증 상태를 preSend에서 검사한다.
// 동작: 허용된 방 참가자만 subscribe·send를 통과하고 나머지는 예외로 거부한다.
// 읽는 순서: 필드(상태·의존성) → 생성자(준비) → public 메서드(외부에서 시작되는 흐름) 순서로 읽는다.
// 메서드 안에서는 입력 확인 → 핵심 처리 → 반환값 또는 예외 순서로 흐름을 따라가면 된다.
package kr.or.oti.mafiagame.config;




/**
 * STOMP 토픽과 애플리케이션 목적지에 대한 최소 권한 검사를 담당한다.
 */
@Component
public class WebSocketAuthorizationInterceptor implements ChannelInterceptor {
    // 애플리케이션 시작 시 Spring이 읽어 Web·보안·WebSocket 구성 요소를 등록한다.
    private static final Pattern ROOM_TOPIC_PATTERN = Pattern.compile("^/topic/rooms/(\\d+)/(chat|presence)$");
    private static final Pattern ROOM_SEND_PATTERN = Pattern.compile("^/app/rooms/(\\d+)/(join|ready|chat)$");
    private static final String LOBBY_TOPIC = "/topic/rooms/presence";
    private static final String LOBBY_SEND = "/app/rooms/presence";

    private final RoomPresenceService roomPresenceService;

    // 생성자: Spring 또는 호출자가 넘긴 의존성과 초기 상태를 필드에 보관한다.
    public WebSocketAuthorizationInterceptor(@Lazy RoomPresenceService roomPresenceService) {
        this.roomPresenceService = roomPresenceService;
    }

    // 모든 inbound STOMP frame을 command별 구독 검사 또는 SEND 검사로 분기한다.
    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null || accessor.getCommand() == null) {
            return message;
        }

        String destination = accessor.getDestination();
        if (accessor.getCommand() == StompCommand.SUBSCRIBE) {
            authorizeSubscription(message, accessor, destination);
        } else if (accessor.getCommand() == StompCommand.SEND) {
            authorizeSend(message, accessor, destination);
        }
        return message;
    }

    // 로비·개인 큐·방 topic을 구분하고 방 topic은 실제 참가자만 구독하게 한다.
    private void authorizeSubscription(
            Message<?> message,
            StompHeaderAccessor accessor,
            String destination) {
        if (LOBBY_TOPIC.equals(destination)) {
            return;
        }
        if (destination != null && destination.startsWith("/user/")) {
            requirePrincipal(message, accessor);
            return;
        }

        Matcher matcher = destination == null ? null : ROOM_TOPIC_PATTERN.matcher(destination);
        if (matcher == null || !matcher.matches()) {
            throw denied(message, "허용되지 않은 WebSocket 구독 주소입니다.");
        }

        requirePrincipal(message, accessor);
        long roomId = Long.parseLong(matcher.group(1));
        if (!roomPresenceService.isParticipant(roomId, accessor.getSessionId())) {
            throw denied(message, "먼저 게임방에 입장해 주세요.");
        }
    }

    // 목적지에서 roomId와 action을 꺼내 join 이외 요청은 방 참가자만 통과시킨다.
    private void authorizeSend(
            Message<?> message,
            StompHeaderAccessor accessor,
            String destination) {
        if (LOBBY_SEND.equals(destination)) {
            return;
        }

        Matcher matcher = destination == null ? null : ROOM_SEND_PATTERN.matcher(destination);
        if (matcher == null || !matcher.matches()) {
            throw denied(message, "허용되지 않은 WebSocket 요청 주소입니다.");
        }

        requirePrincipal(message, accessor);
        long roomId = Long.parseLong(matcher.group(1));
        String action = matcher.group(2);
        if (!"join".equals(action)
                && !roomPresenceService.isParticipant(roomId, accessor.getSessionId())) {
            throw denied(message, "먼저 게임방에 입장해 주세요.");
        }
    }

    // 로그인 Principal이 없는 메시지를 즉시 거부해 익명 WebSocket 작업을 막는다.
    private void requirePrincipal(Message<?> message, StompHeaderAccessor accessor) {
        Principal principal = accessor.getUser();
        if (principal == null) {
            throw denied(message, "로그인 후 이용해 주세요.");
        }
    }

    // 거부 사유를 MessageDeliveryException에 담아 STOMP 오류 흐름으로 넘긴다.
    private MessageDeliveryException denied(Message<?> message, String reason) {
        return new MessageDeliveryException(message, reason);
    }
}
````

### `src/main/java/kr/or/oti/mafiagame/security/CustomUserDetails.java`

**코드 흐름:** Domain `User`를 Spring Security의 `UserDetails`로 감싸는 Adapter다.

**학습 포인트:** 로그인 후 HTTP와 WebSocket Principal에서 같은 사용자 ID·닉네임을 얻는 출발점이다.

````java
// 코드 흐름: 로그인 Principal과 HTTP 세션 정보를 애플리케이션이 사용할 형태로 변환한다.
// 동작: 인증된 사용자 식별 정보가 Controller·WebSocket 권한 검사로 전달된다.
// 읽는 순서: 필드(상태·의존성) → 생성자(준비) → public 메서드(외부에서 시작되는 흐름) 순서로 읽는다.
// 메서드 안에서는 입력 확인 → 핵심 처리 → 반환값 또는 예외 순서로 흐름을 따라가면 된다.
package kr.or.oti.mafiagame.security;


public class CustomUserDetails extends org.springframework.security.core.userdetails.User {
    // 로그인 사용자 식별자와 방 접근 권한을 요청 흐름에 전달한다.
    private static final long serialVersionUID = 1L;
    private final long userId;
    private final String nickname;
    private final int level;

    // 생성자: Spring 또는 호출자가 넘긴 의존성과 초기 상태를 필드에 보관한다.
    public CustomUserDetails(User user) {
        super(user.getEmail(), user.getPassword(), List.of(new SimpleGrantedAuthority("ROLE_USER")));
        this.userId = user.getUserId();
        this.nickname = user.getUserName();
        this.level = user.getUser_level();
    }

    // 조회 흐름: 입력 식별자로 저장소 또는 메모리에서 값을 읽어 호출자에게 반환한다.
    public long getUserId() { return userId; }

    // 조회 흐름: 입력 식별자로 저장소 또는 메모리에서 값을 읽어 호출자에게 반환한다.
    public String getNickname() { return nickname; }

    // 조회 흐름: 입력 식별자로 저장소 또는 메모리에서 값을 읽어 호출자에게 반환한다.
    public int getLevel() { return level; }
}
````

### `src/main/java/kr/or/oti/mafiagame/security/PrincipalIdentity.java`

**코드 흐름:** Principal에서 사용자 식별 정보를 읽어 userId·nickname 의미를 한곳에서 정리한다.

**학습 포인트:** 각 Service가 Principal 문자열을 제각각 해석하지 않도록 하는 보조 값 객체다.

````java
// 코드 흐름: 로그인 Principal과 HTTP 세션 정보를 애플리케이션이 사용할 형태로 변환한다.
// 동작: 인증된 사용자 식별 정보가 Controller·WebSocket 권한 검사로 전달된다.
// 읽는 순서: 필드(상태·의존성) → 생성자(준비) → public 메서드(외부에서 시작되는 흐름) 순서로 읽는다.
// 메서드 안에서는 입력 확인 → 핵심 처리 → 반환값 또는 예외 순서로 흐름을 따라가면 된다.
package kr.or.oti.mafiagame.security;



/**
 * WebSocket 요청에서 애플리케이션 사용자 식별 정보를 추출한다.
 */
    // record는 생성자·접근 메서드·equals를 자동으로 제공하는 작은 데이터 묶음이다.
public record PrincipalIdentity(long userId, String nickname) {

    // Spring Principal에서 애플리케이션 userId·nickname을 추출하고, 정보가 부족하면 안전한 기본값을 만든다.
    public static PrincipalIdentity from(Principal principal) {
        if (principal instanceof Authentication authentication
                && authentication.getPrincipal() instanceof CustomUserDetails user) {
            return new PrincipalIdentity(user.getUserId(), user.getNickname());
        }
        return new PrincipalIdentity(-1L, principal.getName());
    }
}
````

### `src/main/java/kr/or/oti/mafiagame/security/RoomAccess.java`

**코드 흐름:** 잠금 방 비밀번호를 통과했다는 표시를 HTTP 세션에 저장하고 확인한다.

**학습 포인트:** 저장된 권한이 WebSocket handshake 세션 속성으로 넘어가 STOMP 입장 검사에 사용된다.

````java
// 코드 흐름: 로그인 Principal과 HTTP 세션 정보를 애플리케이션이 사용할 형태로 변환한다.
// 동작: 인증된 사용자 식별 정보가 Controller·WebSocket 권한 검사로 전달된다.
// 읽는 순서: 필드(상태·의존성) → 생성자(준비) → public 메서드(외부에서 시작되는 흐름) 순서로 읽는다.
// 메서드 안에서는 입력 확인 → 핵심 처리 → 반환값 또는 예외 순서로 흐름을 따라가면 된다.
package kr.or.oti.mafiagame.security;



/**
 * HTTP에서 확인한 잠금 방 접근 권한을 같은 세션의 WebSocket 연결과 공유한다.
 */
public final class RoomAccess {
    // 로그인 사용자 식별자와 방 접근 권한을 요청 흐름에 전달한다.
    private static final String ATTRIBUTE_PREFIX = RoomAccess.class.getName() + ".room.";

    // 생성자: Spring 또는 호출자가 넘긴 의존성과 초기 상태를 필드에 보관한다.
    private RoomAccess() {
    }

    // 잠금 방 비밀번호 확인 후 현재 HTTP 세션에 방별 접근 허가를 기록한다.
    public static void grant(HttpSession session, long roomId) {
        session.setAttribute(attributeName(roomId), Boolean.TRUE);
    }

    // 현재 세션 또는 세션 속성 Map에 해당 방의 접근 허가가 있는지 확인한다.
    public static boolean isGranted(HttpSession session, long roomId) {
        return session != null && Boolean.TRUE.equals(session.getAttribute(attributeName(roomId)));
    }

    // 현재 세션 또는 세션 속성 Map에 해당 방의 접근 허가가 있는지 확인한다.
    public static boolean isGranted(Map<String, Object> sessionAttributes, long roomId) {
        return sessionAttributes != null
                && Boolean.TRUE.equals(sessionAttributes.get(attributeName(roomId)));
    }

    // 방 ID가 섞이지 않도록 세션 속성 이름을 방별로 만든다.
    private static String attributeName(long roomId) {
        return ATTRIBUTE_PREFIX + roomId;
    }
}
````

### `src/main/java/kr/or/oti/mafiagame/controller/AuthController.java`

**코드 흐름:** 로그인·회원가입 화면을 보여주고 회원가입 POST를 받는다. POST는 `SignupService.signup`에 위임한 뒤 성공·실패 화면으로 이동한다.

**학습 포인트:** Controller는 입력을 받아 다음 계층으로 전달하고 DB 저장 규칙은 Service에 두는 구조를 익힌다.

````java
// 코드 흐름: 브라우저의 로그인·회원가입 요청이 이 Controller로 들어온다.
// 동작: GET은 화면을 반환하고 POST 회원가입은 SignupService 실행 후 redirect 또는 오류 화면으로 이어진다.
// 읽는 순서: 필드(상태·의존성) → 생성자(준비) → public 메서드(외부에서 시작되는 흐름) 순서로 읽는다.
// 메서드 안에서는 입력 확인 → 핵심 처리 → 반환값 또는 예외 순서로 흐름을 따라가면 된다.
package kr.or.oti.mafiagame.controller;



@Controller
public class AuthController {
    // 외부 요청을 받고 Service 결과를 화면 또는 WebSocket 응답으로 연결한다.
    private final SignupService signupService;

    // 생성자: Spring 또는 호출자가 넘긴 의존성과 초기 상태를 필드에 보관한다.
    public AuthController(SignupService signupService) {
        this.signupService = signupService;
    }

    // GET /login 요청에 로그인 템플릿 이름을 반환한다.
    @GetMapping("/login")
    public String login() {
        return "auth/login";
    }

    // GET은 회원가입 화면을 보여주고 POST는 SignupService 결과에 따라 로그인 redirect 또는 오류 화면을 반환한다.
    @GetMapping("/signup")
    public String signup() {
        return "auth/signup";
    }

    // GET은 회원가입 화면을 보여주고 POST는 SignupService 결과에 따라 로그인 redirect 또는 오류 화면을 반환한다.
    @PostMapping("/signup")
    public String signup(
            @RequestParam(name = "nickname", required = false) String nickname,
            @RequestParam(name = "email", required = false) String email,
            @RequestParam(name = "password", required = false) String password,
            @RequestParam(name = "passwordConfirm", required = false) String passwordConfirm,
            @RequestParam(name = "agreement", defaultValue = "false") boolean agreed,
            Model model) {
        try {
            signupService.signup(nickname, email, password, passwordConfirm, agreed);
            return "redirect:/login?signup";
        } catch (SignupException exception) {
            model.addAttribute("signupError", exception.getMessage());
            model.addAttribute("nickname", nickname);
            model.addAttribute("email", email);
            model.addAttribute("agreed", agreed);
            return "auth/signup";
        }
    }
}
````

### `src/main/java/kr/or/oti/mafiagame/controller/RoomController.java`

**코드 흐름:** 로비·방 생성·방 상세·잠금 방 접근 HTTP 요청을 처리한다. 방 업무는 `RoomService`에 위임하고 비밀번호 성공 시 `RoomAccess`에 세션 권한을 기록한다.

**학습 포인트:** HTTP 입장 권한이 뒤의 WebSocket 입장 검사로 이어지는 연결을 따라간다.

````java
// 코드 흐름: 로비·방 생성·방 상세·잠금 방 접근의 HTTP 요청을 순서대로 처리한다.
// 동작: Service에서 방 규칙을 검사하고 성공한 잠금 방은 세션 접근 권한을 저장한다.
// 읽는 순서: 필드(상태·의존성) → 생성자(준비) → public 메서드(외부에서 시작되는 흐름) 순서로 읽는다.
// 메서드 안에서는 입력 확인 → 핵심 처리 → 반환값 또는 예외 순서로 흐름을 따라가면 된다.
package kr.or.oti.mafiagame.controller;





@Controller
public class RoomController {
    // 외부 요청을 받고 Service 결과를 화면 또는 WebSocket 응답으로 연결한다.
    private final RoomService roomService;
    private final RoomPresenceService roomPresenceService;

    // 생성자: Spring 또는 호출자가 넘긴 의존성과 초기 상태를 필드에 보관한다.
    public RoomController(RoomService roomService, RoomPresenceService roomPresenceService) {
        this.roomService = roomService;
        this.roomPresenceService = roomPresenceService;
    }

    // DB 방 목록을 읽고 메모리 presence 인원 수를 덧씌운 뒤 rooms/list 모델로 전달한다.
    @GetMapping({"/", "/rooms"})
    public String roomList(Model model) {
        Map<Long, Integer> liveCounts = roomPresenceService.currentCounts();
        List<RoomView> rooms = roomService.getRooms().stream()
                .map(room -> room.withPlayerCount(liveCounts.getOrDefault(room.roomId(), 0)))
                .toList();
        model.addAttribute("rooms", rooms);
        model.addAttribute("onlinePlayerCount", liveCounts.values().stream()
                .mapToInt(Integer::intValue)
                .sum());
        return "rooms/list";
    }

    // 방 생성 화면이 사용할 기본 최대 인원과 비밀번호 체크 상태를 모델에 넣는다.
    @GetMapping("/rooms/new")
    public String roomCreateForm(Model model) {
        model.addAttribute("maxPlayers", 8);
        model.addAttribute("hasPassword", false);
        return "rooms/create";
    }

    // 입력값을 Service에 전달하고 성공 시 방 접근 권한을 세션에 기록한 뒤 상세로 이동한다.
    @PostMapping("/rooms")
    public String createRoom(
            @RequestParam(name = "title", required = false) String title,
            @RequestParam(name = "maxPlayers", required = false) Integer maxPlayers,
            @RequestParam(name = "password", required = false) String password,
            @AuthenticationPrincipal CustomUserDetails user,
            HttpSession session,
            Model model) {
        try {
            long roomId = roomService.createRoom(user.getUserId(), title, maxPlayers, password);
            if (password != null && !password.trim().isEmpty()) {
                RoomAccess.grant(session, roomId);
            }
            return "redirect:/rooms/" + roomId;
        } catch (RoomCreationException exception) {
            model.addAttribute("roomError", exception.getMessage());
            model.addAttribute("title", title);
            model.addAttribute("maxPlayers", maxPlayers == null ? 8 : maxPlayers);
            model.addAttribute("hasPassword", password != null && !password.trim().isEmpty());
            return "rooms/create";
        }
    }

    // 방 존재·잠금 권한을 먼저 확인하고, 통과하면 최신 참가자 상태를 상세 화면에 모델로 전달한다.
    @GetMapping("/rooms/{roomId}")
    public String roomDetail(
            @PathVariable("roomId") long roomId,
            @AuthenticationPrincipal CustomUserDetails user,
            HttpSession session,
            Model model) {
        model.addAttribute("roomId", roomId);
        model.addAttribute("nickname", user == null ? "" : user.getNickname());
        model.addAttribute("userId", user == null ? "" : user.getUserId());
        RoomView room = roomService.getRoomView(roomId);
        if (room == null) {
            return "redirect:/rooms";
        }
        if (room.locked() && !RoomAccess.isGranted(session, roomId)) {
            model.addAttribute("room", room);
            return "rooms/access";
        }

        RoomPresenceState livePresence = roomPresenceService.currentState(roomId);
        model.addAttribute("livePresence", livePresence);
        List<String> members;
        if (livePresence != null) {
            room = room.withPlayerCount(livePresence.participants().size());
            members = livePresence.participants().stream()
                    .map(participant -> participant.nickname())
                    .toList();
        } else {
            // room_members는 WebSocket 세션 종료 후 stale 상태가 될 수 있으므로
            // 현재 접속자가 확인되기 전에는 실제 참가자로 표시하지 않는다.
            room = room.withPlayerCount(0);
            members = List.of();
        }

        model.addAttribute("room", room);
        model.addAttribute("members", members);
        return "rooms/detail";
    }

    // 잠금 방의 비밀번호를 검증하고 성공한 세션에만 해당 방 접근 권한을 부여한다.
    @PostMapping("/rooms/{roomId}/access")
    public String accessRoom(
            @PathVariable("roomId") long roomId,
            @RequestParam(name = "password", required = false) String password,
            HttpSession session,
            Model model) {
        RoomView room = roomService.getRoomView(roomId);
        if (room == null) {
            return "redirect:/rooms";
        }
        if (!room.locked() || roomService.verifyRoomPassword(roomId, password)) {
            RoomAccess.grant(session, roomId);
            return "redirect:/rooms/" + roomId;
        }

        model.addAttribute("roomId", roomId);
        model.addAttribute("room", room);
        model.addAttribute("accessError", "방 비밀번호가 올바르지 않습니다.");
        return "rooms/access";
    }
}
````

### `src/main/java/kr/or/oti/mafiagame/controller/UserController.java`

**코드 흐름:** 프로필 요청을 받아 `UserService`에서 만든 `UserProfile`을 Model에 넣고 Thymeleaf 화면을 반환한다.

**학습 포인트:** 화면용 데이터 조합은 Service·DTO가 담당하고 템플릿은 표시만 담당한다.

````java
// 코드 흐름: 브라우저 HTTP 또는 WebSocket 요청이 이 Controller의 매핑 메서드로 들어온다.
// 동작: 입력값을 Service에 전달하고 화면·응답·방송 결과를 반환한다.
// 읽는 순서: 필드(상태·의존성) → 생성자(준비) → public 메서드(외부에서 시작되는 흐름) 순서로 읽는다.
// 메서드 안에서는 입력 확인 → 핵심 처리 → 반환값 또는 예외 순서로 흐름을 따라가면 된다.
package kr.or.oti.mafiagame.controller;



@Controller
public class UserController {
    // 외부 요청을 받고 Service 결과를 화면 또는 WebSocket 응답으로 연결한다.
    private final UserService userService;

    // 생성자: Spring 또는 호출자가 넘긴 의존성과 초기 상태를 필드에 보관한다.
    public UserController(UserService userService) {
        this.userService = userService;
    }

    // userId로 프로필을 조회해 존재하면 users/detail, 없으면 로비로 이동한다.
    @GetMapping("/users/{userId}")
    public String userDetail(@PathVariable("userId") long userId, Model model) {
        UserProfile profile = userService.getProfile(userId);
        if (profile == null) {
            return "redirect:/rooms";
        }

        model.addAttribute("user", profile);
        return "users/detail";
    }
}
````

### `src/main/java/kr/or/oti/mafiagame/controller/RoomPresenceController.java`

**코드 흐름:** 대기방 join·Ready·로비 인원 요청을 STOMP로 받고 `RoomPresenceService`에 전달한다. 업무 예외는 클라이언트용 오류 DTO로 변환한다.

**학습 포인트:** 실시간 Map을 Controller가 직접 만지지 않고 Service에 맡기는 이유를 확인한다.

````java
// 코드 흐름: join·ready·로비 인원 요청이 STOMP MessageMapping으로 들어온다.
// 동작: 실제 상태 변경은 RoomPresenceService가 하고 결과 상태를 브라우저에 방송한다.
// 읽는 순서: 필드(상태·의존성) → 생성자(준비) → public 메서드(외부에서 시작되는 흐름) 순서로 읽는다.
// 메서드 안에서는 입력 확인 → 핵심 처리 → 반환값 또는 예외 순서로 흐름을 따라가면 된다.
package kr.or.oti.mafiagame.controller;




@Controller
public class RoomPresenceController {
    // 외부 요청을 받고 Service 결과를 화면 또는 WebSocket 응답으로 연결한다.
    private final RoomPresenceService roomPresenceService;

    // 생성자: Spring 또는 호출자가 넘긴 의존성과 초기 상태를 필드에 보관한다.
    public RoomPresenceController(RoomPresenceService roomPresenceService) {
        this.roomPresenceService = roomPresenceService;
    }

    // WebSocket 세션과 로그인 사용자를 Service에 넘겨 방 입장을 처리하고 개인 응답을 반환한다.
    @MessageMapping("/rooms/{roomId}/join")
    @SendToUser(value = "/queue/room-joined", broadcast = false)
    public kr.or.oti.mafiagame.dto.RoomPresenceState join(
            @DestinationVariable("roomId") long roomId,
            SimpMessageHeaderAccessor headers,
            Principal principal) {
        return roomPresenceService.join(
                roomId,
                headers.getSessionId(),
                principal,
                RoomAccess.isGranted(headers.getSessionAttributes(), roomId));
    }

    // 현재 STOMP 세션의 준비 상태 변경을 Service에 위임한다.
    @MessageMapping("/rooms/{roomId}/ready")
    public void updateReady(
            @DestinationVariable("roomId") long roomId,
            RoomReadyRequest request,
            SimpMessageHeaderAccessor headers) {
        roomPresenceService.updateReady(roomId, headers.getSessionId(), request);
    }

    // 로비에서 방별 실시간 인원 수를 요청하면 Service가 방송하도록 한다.
    @MessageMapping("/rooms/presence")
    public void sendRoomCounts() {
        roomPresenceService.broadcastRoomCounts();
    }

    // presence 처리 예외를 ChatError DTO로 바꿔 개인 오류 큐에 보낸다.
    @MessageExceptionHandler(RoomWebSocketException.class)
    @SendToUser(value = "/queue/errors", broadcast = false)
    public ChatError handlePresenceException(RoomWebSocketException exception) {
        return ChatError.of(exception.getMessage());
    }
}
````

### `src/main/java/kr/or/oti/mafiagame/controller/ChatController.java`

**코드 흐름:** `/app/rooms/{roomId}/chat` STOMP 메시지를 받아 `ChatService`로 검증한 뒤 같은 방의 `/topic/.../chat`으로 방송한다.

**학습 포인트:** 입력 경로와 방송 경로가 다르고, Controller가 메시지 규칙을 직접 판단하지 않는 점을 본다.

````java
// 코드 흐름: 브라우저의 STOMP 채팅 요청이 MessageMapping 메서드로 들어온다.
// 동작: ChatService가 검증한 메시지만 같은 방 topic으로 방송된다.
// 읽는 순서: 필드(상태·의존성) → 생성자(준비) → public 메서드(외부에서 시작되는 흐름) 순서로 읽는다.
// 메서드 안에서는 입력 확인 → 핵심 처리 → 반환값 또는 예외 순서로 흐름을 따라가면 된다.
package kr.or.oti.mafiagame.controller;




@Controller
public class ChatController {
    // 외부 요청을 받고 Service 결과를 화면 또는 WebSocket 응답으로 연결한다.
    private final SimpMessagingTemplate messagingTemplate;
    private final ChatService chatService;

    // 생성자: Spring 또는 호출자가 넘긴 의존성과 초기 상태를 필드에 보관한다.
    public ChatController(SimpMessagingTemplate messagingTemplate, ChatService chatService) {
        this.messagingTemplate = messagingTemplate;
        this.chatService = chatService;
    }

    // 채팅 입력을 Service에서 검증·변환한 뒤 해당 방의 /chat topic으로 방송한다.
    @MessageMapping("/rooms/{roomId}/chat")
    public void sendMessage(
            @DestinationVariable("roomId") long roomId,
            ChatMessageRequest request,
            SimpMessageHeaderAccessor headers,
            Principal principal) {
        messagingTemplate.convertAndSend(
                "/topic/rooms/" + roomId + "/chat",
                chatService.createMessage(
                        roomId,
                        request,
                        principal,
                        headers == null ? null : headers.getSessionId()));
    }

    // 방 WebSocket 예외를 오류 DTO로 바꿔 요청 사용자에게 전달한다.
    @MessageExceptionHandler(RoomWebSocketException.class)
    @SendToUser(value = "/queue/errors", broadcast = false)
    public ChatError handleRoomWebSocketException(RoomWebSocketException exception) {
        return ChatError.of(exception.getMessage());
    }
}
````

### `src/main/java/kr/or/oti/mafiagame/service/SignupService.java`

**코드 흐름:** 회원가입 입력을 정규화하고 형식·약관·비밀번호 일치·이메일 중복을 검사한 뒤 BCrypt 비밀번호와 사용자·통계 행을 저장한다.

**학습 포인트:** 화면을 우회한 요청에도 같은 규칙이 적용되는 서버의 최종 검증 지점이다.

````java
// 코드 흐름: 회원가입 입력을 정규화하고 형식·약관·중복·비밀번호 규칙을 검사한다.
// 동작: 모든 검증을 통과하면 비밀번호를 암호화하고 사용자와 통계 행을 저장한다.
// 읽는 순서: 필드(상태·의존성) → 생성자(준비) → public 메서드(외부에서 시작되는 흐름) 순서로 읽는다.
// 메서드 안에서는 입력 확인 → 핵심 처리 → 반환값 또는 예외 순서로 흐름을 따라가면 된다.
package kr.or.oti.mafiagame.service;




@Service
public class SignupService {
    // 입력 검증과 업무 규칙을 수행하고 DAO·Domain·DTO 사이의 흐름을 조정한다.
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");

    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    // 생성자: Spring 또는 호출자가 넘긴 의존성과 초기 상태를 필드에 보관한다.
    public SignupService(UserMapper userMapper, PasswordEncoder passwordEncoder) {
        this.userMapper = userMapper;
        this.passwordEncoder = passwordEncoder;
    }

    // 입력 정규화 → 형식·약관·중복 검증 → 비밀번호 암호화 → 사용자·통계 저장 순서로 실행한다.
    @Transactional
    public void signup(String nickname, String email, String password, String passwordConfirm, boolean agreed) {
        String normalizedNickname = nickname == null ? "" : nickname.trim();
        String normalizedEmail = email == null ? "" : email.trim().toLowerCase(Locale.ROOT);

        if (normalizedNickname.length() < 2 || normalizedNickname.length() > 30) {
            throw new SignupException("닉네임은 2자 이상 30자 이하로 입력해 주세요.");
        }
        if (normalizedEmail.length() > 255 || !EMAIL_PATTERN.matcher(normalizedEmail).matches()) {
            throw new SignupException("올바른 이메일 주소를 입력해 주세요.");
        }
        if (password == null || password.length() < 8
                || password.getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new SignupException("비밀번호는 8자 이상, UTF-8 기준 72바이트 이하로 입력해 주세요.");
        }
        if (!password.equals(passwordConfirm)) {
            throw new SignupException("비밀번호가 서로 다릅니다.");
        }
        if (!agreed) {
            throw new SignupException("이용약관과 개인정보 처리방침에 동의해 주세요.");
        }
        if (userMapper.existsByEmail(normalizedEmail)) {
            throw new SignupException("이미 사용 중인 이메일입니다.");
        }

        try {
            User user = User.builder()
                    .userName(normalizedNickname)
                    .email(normalizedEmail)
                    .password(passwordEncoder.encode(password))
                    .user_level(1)
                    .build();
            if (userMapper.insert(user) != 1) {
                throw new SignupException("회원 정보를 저장하지 못했습니다.");
            }
            if (userMapper.insertStats(user.getUserId()) != 1) {
                throw new SignupException("회원 통계를 초기화하지 못했습니다.");
            }
        } catch (DataIntegrityViolationException exception) {
            throw new SignupException("이미 사용 중인 이메일입니다.");
        }
    }

    public static class SignupException extends RuntimeException {
    // 입력 검증과 업무 규칙을 수행하고 DAO·Domain·DTO 사이의 흐름을 조정한다.
        private static final long serialVersionUID = 1L;

        // 이 메서드는 클래스의 상태와 입력을 사용해 한 가지 책임을 수행한다.
        public SignupException(String message) {
            super(message);
        }
    }
}
````

### `src/main/java/kr/or/oti/mafiagame/service/CustomUserDetailsService.java`

**코드 흐름:** Spring Security가 이메일로 사용자를 조회하면 `UserMapper.findByEmail`을 호출한다.

**학습 포인트:** 사용자가 없으면 예외를 던지고, 있으면 `CustomUserDetails`로 감싸 인증 흐름에 넘긴다.

````java
// 코드 흐름: Controller 또는 Security가 이 Service를 호출해 업무 규칙을 실행한다.
// 동작: 검증과 상태 조합을 마친 뒤 DAO를 호출하거나 DTO를 반환한다.
// 읽는 순서: 필드(상태·의존성) → 생성자(준비) → public 메서드(외부에서 시작되는 흐름) 순서로 읽는다.
// 메서드 안에서는 입력 확인 → 핵심 처리 → 반환값 또는 예외 순서로 흐름을 따라가면 된다.
package kr.or.oti.mafiagame.service;



@Service
public class CustomUserDetailsService implements UserDetailsService {
    // 입력 검증과 업무 규칙을 수행하고 DAO·Domain·DTO 사이의 흐름을 조정한다.
    private final UserMapper userMapper;

    // 생성자: Spring 또는 호출자가 넘긴 의존성과 초기 상태를 필드에 보관한다.
    public CustomUserDetailsService(UserMapper userMapper) {
        this.userMapper = userMapper;
    }

    // 로그인 이메일을 정규화해 UserMapper로 조회하고 CustomUserDetails로 변환한다.
    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        String normalizedEmail = email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
        return userMapper.findByEmail(normalizedEmail)
                .map(CustomUserDetails::new)
                .orElseThrow(() -> new UsernameNotFoundException("Invalid credentials"));
    }
}
````

### `src/main/java/kr/or/oti/mafiagame/service/RoomService.java`

**코드 흐름:** 방 조회·생성·비밀번호 검증·방장 위임·삭제를 담당한다. 생성 시 입력을 검사하고 비밀번호를 BCrypt로 암호화한 뒤 방과 방장 멤버를 저장한다.

**학습 포인트:** Controller가 방 규칙을 직접 구현하지 않고 Service에 위임하는 이유를 확인한다.

````java
// 코드 흐름: Controller의 방 요청을 받아 조회·생성·비밀번호 검증을 수행한다.
// 동작: 생성 시 입력 검증과 BCrypt 암호화를 거친 뒤 Mapper를 통해 DB에 저장한다.
// 읽는 순서: 필드(상태·의존성) → 생성자(준비) → public 메서드(외부에서 시작되는 흐름) 순서로 읽는다.
// 메서드 안에서는 입력 확인 → 핵심 처리 → 반환값 또는 예외 순서로 흐름을 따라가면 된다.
package kr.or.oti.mafiagame.service;




@Service
public class RoomService {
    // 입력 검증과 업무 규칙을 수행하고 DAO·Domain·DTO 사이의 흐름을 조정한다.
    private final RoomMapper roomMapper;
    private final PasswordEncoder passwordEncoder;

    // 생성자: Spring 또는 호출자가 넘긴 의존성과 초기 상태를 필드에 보관한다.
    public RoomService(RoomMapper roomMapper, PasswordEncoder passwordEncoder) {
        this.roomMapper = roomMapper;
        this.passwordEncoder = passwordEncoder;
    }

    // Mapper 목록을 화면용 RoomView 목록으로 변환한다.
    @Transactional(readOnly = true)
    public List<RoomView> getRooms() {
        return roomMapper.findAll().stream()
                .map(RoomView::from)
                .toList();
    }

    // 조회 흐름: 입력 식별자로 저장소 또는 메모리에서 값을 읽어 호출자에게 반환한다.
    @Transactional(readOnly = true)
    public RoomSummary getRoom(long roomId) {
        return roomMapper.findById(roomId);
    }

    // 방 하나를 조회한 뒤 화면 모델 RoomView로 변환하거나 없으면 null을 반환한다.
    @Transactional(readOnly = true)
    public RoomView getRoomView(long roomId) {
        RoomSummary room = roomMapper.findById(roomId);
        return room == null ? null : RoomView.from(room);
    }

    // 조회 흐름: 입력 식별자로 저장소 또는 메모리에서 값을 읽어 호출자에게 반환한다.
    @Transactional(readOnly = true)
    public List<String> getMemberNames(long roomId) {
        return roomMapper.findMemberNames(roomId);
    }

    // 빈 입력을 먼저 거부하고 저장된 BCrypt hash와 정규화된 입력을 비교한다.
    @Transactional(readOnly = true)
    public boolean verifyRoomPassword(long roomId, String password) {
        String normalizedPassword = password == null ? "" : password.trim();
        if (normalizedPassword.isEmpty()) {
            return false;
        }

        String passwordHash = roomMapper.findPasswordHash(roomId);
        return passwordHash != null && passwordEncoder.matches(normalizedPassword, passwordHash);
    }

    // 방장 변경 결과가 정확히 한 행인지 확인한 뒤 실패하면 예외를 발생시킨다.
    @Transactional
    public void transferHost(long roomId, long hostUserId) {
        if (roomMapper.updateHostUserId(roomId, hostUserId) != 1) {
            throw new IllegalStateException("방장 정보를 변경하지 못했어요.");
        }
    }

    // 방 멤버를 먼저 지우고 방 본체를 삭제해 외래키 관계를 정리한다.
    @Transactional
    public void deleteRoom(long roomId) {
        roomMapper.deleteMembersByRoomId(roomId);
        roomMapper.deleteById(roomId);
    }

    // 방 입력을 검증하고 비밀번호를 hash한 뒤 방과 최초 방장 멤버를 한 흐름으로 저장한다.
    @Transactional
    public long createRoom(long hostUserId, String title, Integer maxPlayers, String password) {
        String normalizedTitle = title == null ? "" : title.trim();
        if (normalizedTitle.length() < 2 || normalizedTitle.length() > 100) {
            throw new RoomCreationException("방 제목은 2자 이상 100자 이하로 입력해 주세요.");
        }
        if (maxPlayers == null || maxPlayers < 4 || maxPlayers > 8) {
            throw new RoomCreationException("최대 인원은 4명에서 8명 사이로 선택해 주세요.");
        }

        String normalizedPassword = password == null ? "" : password.trim();
        if (!normalizedPassword.isEmpty()
                && (normalizedPassword.length() < 4 || normalizedPassword.length() > 20)) {
            throw new RoomCreationException("비밀번호는 4자 이상 20자 이하로 입력해 주세요.");
        }

        Room room = Room.builder()
                .hostUserId(hostUserId)
                .title(normalizedTitle)
                .roomPassword(normalizedPassword.isEmpty() ? null : passwordEncoder.encode(normalizedPassword))
                .maxPlayers(maxPlayers)
                .status("WAITING")
                .build();

        if (roomMapper.insert(room) != 1) {
            throw new RoomCreationException("방을 만들지 못했어요. 잠시 후 다시 시도해 주세요.");
        }
        if (roomMapper.insertMember(room.getRoomId(), hostUserId) != 1) {
            throw new RoomCreationException("방장을 등록하지 못했어요. 잠시 후 다시 시도해 주세요.");
        }
        return room.getRoomId();
    }

    public static class RoomCreationException extends RuntimeException {
    // 입력 검증과 업무 규칙을 수행하고 DAO·Domain·DTO 사이의 흐름을 조정한다.
        // 이 메서드는 클래스의 상태와 입력을 사용해 한 가지 책임을 수행한다.
        public RoomCreationException(String message) {
            super(message);
        }
    }
}
````

### `src/main/java/kr/or/oti/mafiagame/service/UserService.java`

**코드 흐름:** Mapper에서 사용자·통계를 조회해 `UserProfile`로 조합하고 소개·가입일을 화면 형식으로 정리한다.

**학습 포인트:** DB Domain과 화면 DTO 사이의 변환 흐름을 확인한다.

````java
// 코드 흐름: Controller 또는 Security가 이 Service를 호출해 업무 규칙을 실행한다.
// 동작: 검증과 상태 조합을 마친 뒤 DAO를 호출하거나 DTO를 반환한다.
// 읽는 순서: 필드(상태·의존성) → 생성자(준비) → public 메서드(외부에서 시작되는 흐름) 순서로 읽는다.
// 메서드 안에서는 입력 확인 → 핵심 처리 → 반환값 또는 예외 순서로 흐름을 따라가면 된다.
package kr.or.oti.mafiagame.service;




@Service
public class UserService {
    // 입력 검증과 업무 규칙을 수행하고 DAO·Domain·DTO 사이의 흐름을 조정한다.
    private static final DateTimeFormatter JOINED_AT_FORMAT = DateTimeFormatter.ofPattern("yyyy년 M월");

    private final UserMapper userMapper;

    // 생성자: Spring 또는 호출자가 넘긴 의존성과 초기 상태를 필드에 보관한다.
    public UserService(UserMapper userMapper) {
        this.userMapper = userMapper;
    }

    // 사용자와 통계를 조회해 화면용 UserProfile을 조합하고, 사용자가 없으면 null을 반환한다.
    @Transactional(readOnly = true)
    public UserProfile getProfile(long userId) {
        User user = userMapper.findById(userId).orElse(null);
        if (user == null) {
            return null;
        }

        UserStats stats = userMapper.findStatsByUserId(userId);
        if (stats == null) {
            stats = new UserStats();
        }

        UserProfile profile = new UserProfile(
                user.getUserId(),
                user.getUserName(),
                normalizeBio(user.getBio()),
                stats.getTotalGames(),
                stats.getWins(),
                null,
                null,
                formatJoinedAt(user.getCreatedAt()),
                List.of());

        // 현재 스키마에는 게임 종료 이력 테이블이 없으므로 임의의 기록을 만들지 않는다.
        return profile;
    }

    // 변환 흐름: 저장·표시 전에 입력값을 일관된 형식으로 정리한다.
    private String normalizeBio(String bio) {
        return bio == null || bio.isBlank() ? "아직 소개가 없습니다." : bio;
    }

    // 변환 흐름: 저장·표시 전에 입력값을 일관된 형식으로 정리한다.
    private String formatJoinedAt(LocalDateTime createdAt) {
        return createdAt == null ? "가입일 정보 없음" : JOINED_AT_FORMAT.format(createdAt) + " 가입";
    }
}
````

### `src/main/java/kr/or/oti/mafiagame/service/RoomPresenceService.java`

**코드 흐름:** 방별 참가자, 세션이 속한 방, 사용자별 여러 세션, 방장 정보를 메모리에 관리한다. `join`은 같은 사용자의 세션을 한 참가자로 묶고 다른 방의 기존 세션을 정리한다.

**학습 포인트:** `updateReady`, `leave`, `handleDisconnect`와 읽기·쓰기 잠금, 빈 방 정리 유예를 순서대로 읽으면 다중 창 문제의 해결 방식을 이해할 수 있다.

````java
// 코드 흐름: WebSocket 세션과 사용자 참가 상태를 메모리 Map으로 관리한다.
// 동작: 입장 시 이전 방 세션을 정리하고, 마지막 세션 종료 때 퇴장·방장 위임·빈 방 정리를 수행한다.
// 읽는 순서: 필드(상태·의존성) → 생성자(준비) → public 메서드(외부에서 시작되는 흐름) 순서로 읽는다.
// 메서드 안에서는 입력 확인 → 핵심 처리 → 반환값 또는 예외 순서로 흐름을 따라가면 된다.
package kr.or.oti.mafiagame.service;





@Service
public class RoomPresenceService {
    // 입력 검증과 업무 규칙을 수행하고 DAO·Domain·DTO 사이의 흐름을 조정한다.
    private static final Logger log = LoggerFactory.getLogger(RoomPresenceService.class);
    private static final String PRESENCE_DESTINATION = "/topic/rooms/%d/presence";
    private static final String LOBBY_PRESENCE_DESTINATION = "/topic/rooms/presence";

    private final SimpMessagingTemplate messagingTemplate;
    private final RoomService roomService;
    private final ReentrantReadWriteLock presenceLock = new ReentrantReadWriteLock();
    private final Lock readLock = presenceLock.readLock();
    private final Lock writeLock = presenceLock.writeLock();
    private final Duration emptyRoomCleanupDelay;
    private final ScheduledExecutorService cleanupExecutor;
    private final Map<Long, Map<String, ParticipantPresence>> participantsByRoom = new HashMap<>();
    private final Map<String, Long> roomBySession = new HashMap<>();
    private final Map<String, String> participantKeyBySession = new HashMap<>();
    private final Map<String, Set<String>> sessionsByParticipant = new HashMap<>();
    private final Map<Long, Long> hostUserByRoom = new HashMap<>();
    private final Map<Long, ScheduledFuture<?>> cleanupTasksByRoom = new HashMap<>();
    private final Set<Long> emptyRoomsPendingCleanup = new LinkedHashSet<>();

    // 생성자: Spring 또는 호출자가 넘긴 의존성과 초기 상태를 필드에 보관한다.
    public RoomPresenceService(
            SimpMessagingTemplate messagingTemplate,
            RoomService roomService,
            @Value("${mafiagame.room.empty-cleanup-delay:15s}") Duration emptyRoomCleanupDelay) {
        this.messagingTemplate = messagingTemplate;
        this.roomService = roomService;
        this.emptyRoomCleanupDelay = emptyRoomCleanupDelay.isNegative()
                ? Duration.ZERO
                : emptyRoomCleanupDelay;
        ThreadFactory threadFactory = runnable -> {
            Thread thread = new Thread(runnable, "room-presence-cleanup");
            thread.setDaemon(true);
            return thread;
        };
        this.cleanupExecutor = Executors.newSingleThreadScheduledExecutor(threadFactory);
    }

    // 세션의 기존 방을 정리한 후 대상 방 정원·잠금 권한을 확인하고 참가 상태를 기록한다.
    public RoomPresenceState join(long roomId, String sessionId, Principal principal) {
        return join(roomId, sessionId, principal, false);
    }

    // 세션의 기존 방을 정리한 후 대상 방 정원·잠금 권한을 확인하고 참가 상태를 기록한다.
    public RoomPresenceState join(long roomId, String sessionId, Principal principal, boolean roomAccessGranted) {
        if (sessionId == null || sessionId.isBlank() || principal == null) {
            throw new RoomWebSocketException("게임방 연결 정보를 확인할 수 없습니다.");
        }

        PrincipalIdentity identity = PrincipalIdentity.from(principal);
        String participantKey = participantKey(identity);
        RoomPresenceState currentState;
        Map<Long, RoomPresenceState> previousStates;

        writeLock.lock();
        try {
            RoomSummary room = requireRoom(roomId);
            if (room.isLocked() && !roomAccessGranted) {
                throw new RoomWebSocketException("게임방 비밀번호를 먼저 확인해 주세요.");
            }
            cancelRoomCleanup(roomId);

            Map<String, ParticipantPresence> targetParticipants = participantsByRoom.get(roomId);
            boolean alreadyJoined = targetParticipants != null && targetParticipants.containsKey(participantKey);
            if (!alreadyJoined && targetParticipants != null
                    && targetParticipants.size() >= room.getMaxPlayers()) {
                throw new RoomWebSocketException("게임방 정원이 가득 찼습니다.");
            }

            previousStates = new LinkedHashMap<>();
            Set<String> sessionsToLeave = new LinkedHashSet<>();
            Set<String> participantSessions = sessionsByParticipant.get(participantKey);
            if (participantSessions != null) {
                for (String existingSessionId : participantSessions) {
                    Long existingRoomId = roomBySession.get(existingSessionId);
                    if (existingRoomId != null && !Long.valueOf(roomId).equals(existingRoomId)) {
                        sessionsToLeave.add(existingSessionId);
                    }
                }
            }
            String currentParticipantKey = participantKeyBySession.get(sessionId);
            if (currentParticipantKey != null && !participantKey.equals(currentParticipantKey)) {
                sessionsToLeave.add(sessionId);
            }

            for (String sessionToLeave : sessionsToLeave) {
                Long previousRoomId = roomBySession.get(sessionToLeave);
                if (previousRoomId == null) {
                    continue;
                }
                RoomPresenceState previousState = removeSession(previousRoomId, sessionToLeave);
                if (previousState != null) {
                    previousStates.put(previousRoomId, previousState);
                }
            }

            Map<String, ParticipantPresence> participants = participantsByRoom
                    .computeIfAbsent(roomId, ignored -> new LinkedHashMap<>());
            hostUserByRoom.putIfAbsent(roomId, room.getHostUserId());

            ParticipantPresence participant = participants.computeIfAbsent(
                    participantKey,
                    ignored -> new ParticipantPresence(identity));
            participant.nickname = identity.nickname();
            participant.sessions.add(sessionId);
            roomBySession.put(sessionId, roomId);
            participantKeyBySession.put(sessionId, participantKey);
            sessionsByParticipant.computeIfAbsent(participantKey, ignored -> new LinkedHashSet<>())
                    .add(sessionId);

            currentState = snapshot(roomId);
        } finally {
            writeLock.unlock();
        }

        for (RoomPresenceState previousState : previousStates.values()) {
            broadcast(previousState);
        }
        broadcast(currentState);
        return currentState;
    }

    // 이 메서드는 클래스의 상태와 입력을 사용해 한 가지 책임을 수행한다.
    private String participantKey(PrincipalIdentity identity) {
        if (identity.userId() > 0) {
            return "user:" + identity.userId();
        }
        return "principal:" + identity.nickname();
    }

    // 읽기 잠금 안에서 현재 방의 참가자 snapshot을 만들어 브라우저에 보낼 상태로 반환한다.
    public RoomPresenceState currentState(long roomId) {
        readLock.lock();
        try {
            if (participantsByRoom.containsKey(roomId)) {
                return snapshot(roomId);
            }
            return emptyRoomsPendingCleanup.contains(roomId)
                    ? new RoomPresenceState(roomId, List.of())
                    : null;
        } finally {
            readLock.unlock();
        }
    }

    // 각 방의 서로 다른 참가자 수를 계산해 로비 인원 Map으로 반환한다.
    public Map<Long, Integer> currentCounts() {
        readLock.lock();
        try {
            Map<Long, Integer> counts = new HashMap<>();
            participantsByRoom.forEach((currentRoomId, participants) ->
                    counts.put(currentRoomId, participants.size()));
            emptyRoomsPendingCleanup.forEach(roomId -> counts.putIfAbsent(roomId, 0));
            return Map.copyOf(counts);
        } finally {
            readLock.unlock();
        }
    }

    // 현재 방별 인원 수를 로비 topic에 방송한다.
    public void broadcastRoomCounts() {
        List<RoomPresenceCount> counts;
        readLock.lock();
        try {
            Map<Long, Integer> currentCounts = new HashMap<>();
            participantsByRoom.forEach((roomId, participants) ->
                    currentCounts.put(roomId, participants.size()));
            emptyRoomsPendingCleanup.forEach(roomId -> currentCounts.putIfAbsent(roomId, 0));
            counts = currentCounts.entrySet().stream()
                    .map(entry -> new RoomPresenceCount(entry.getKey(), entry.getValue()))
                    .toList();
        } finally {
            readLock.unlock();
        }

        messagingTemplate.convertAndSend(LOBBY_PRESENCE_DESTINATION, counts);
    }

    // 세션이 속한 참가자를 찾아 ready 값을 바꾸고 방 전체에 새 상태를 방송한다.
    public void updateReady(long roomId, String sessionId, RoomReadyRequest request) {
        if (request == null) {
            throw new RoomWebSocketException("준비 상태를 확인할 수 없습니다.");
        }

        RoomPresenceState currentState;
        writeLock.lock();
        try {
            Long joinedRoomId = roomBySession.get(sessionId);
            String participantKey = participantKeyBySession.get(sessionId);
            if (!Long.valueOf(roomId).equals(joinedRoomId) || participantKey == null) {
                throw new RoomWebSocketException("먼저 게임방에 입장해 주세요.");
            }

            Map<String, ParticipantPresence> participants = participantsByRoom.get(roomId);
            ParticipantPresence participant = participants == null ? null : participants.get(participantKey);
            if (participant == null || !participant.sessions.contains(sessionId)) {
                throw new RoomWebSocketException("게임방 참가자 정보를 찾을 수 없습니다.");
            }

            participant.ready = request.ready();
            currentState = snapshot(roomId);
        } finally {
            writeLock.unlock();
        }

        broadcast(currentState);
    }

    // 세션이 특정 방의 참가자로 등록되어 있는지 권한 검사에 사용할 boolean을 반환한다.
    public boolean isParticipant(long roomId, String sessionId) {
        if (sessionId == null || sessionId.isBlank()) {
            return false;
        }

        readLock.lock();
        try {
            Long joinedRoomId = roomBySession.get(sessionId);
            String participantKey = participantKeyBySession.get(sessionId);
            Map<String, ParticipantPresence> participants = participantsByRoom.get(roomId);
            ParticipantPresence participant = participants == null ? null : participants.get(participantKey);
            return Long.valueOf(roomId).equals(joinedRoomId)
                    && participantKey != null
                    && participant != null
                    && participant.sessions.contains(sessionId);
        } finally {
            readLock.unlock();
        }
    }

    // WebSocket 연결 종료를 감지해 해당 세션을 leave 흐름으로 넘긴다.
    @EventListener
    public void handleDisconnect(SessionDisconnectEvent event) {
        leave(event.getSessionId());
    }

    // 한 세션을 제거하고 마지막 세션이면 참가자·방장·빈 방 정리까지 이어간다.
    public void leave(String sessionId) {
        if (sessionId == null) {
            return;
        }

        RoomPresenceState state;
        writeLock.lock();
        try {
            Long roomId = roomBySession.get(sessionId);
            if (roomId == null) {
                return;
            }
            state = removeSession(roomId, sessionId);
        } finally {
            writeLock.unlock();
        }

        if (state != null) {
            broadcast(state);
        }
    }

    // 검사 흐름: 조건을 확인하고 성공 또는 거부 결과를 반환한다.
    private RoomSummary requireRoom(long roomId) {
        RoomSummary room = roomService.getRoom(roomId);
        if (room == null) {
            throw new RoomWebSocketException("존재하지 않는 게임방입니다.");
        }
        return room;
    }

    // 세션 Map을 제거하고 같은 사용자의 다른 세션이 남아 있는지에 따라 참가자 상태를 유지하거나 삭제한다.
    private RoomPresenceState removeSession(long roomId, String sessionId) {
        if (!Long.valueOf(roomId).equals(roomBySession.get(sessionId))) {
            return null;
        }

        Map<String, ParticipantPresence> participants = participantsByRoom.get(roomId);
        if (participants == null) {
            return null;
        }

        String participantKey = participantKeyBySession.get(sessionId);
        ParticipantPresence participant = participantKey == null ? null : participants.get(participantKey);
        boolean participantLeaves = participant != null && participant.sessions.size() == 1;
        boolean hostLeaves = participantLeaves
                && Objects.equals(hostUserByRoom.get(roomId), participant.userId)
                && participants.size() > 1;
        ParticipantPresence successor = hostLeaves
                ? participants.values().stream()
                        .filter(candidate -> !candidate.equals(participant))
                        .findFirst()
                        .orElse(null)
                : null;

        // DB 방장 변경이 실패하면 메모리 상태도 그대로 유지할 수 있도록 먼저 수행한다.
        if (successor != null && successor.userId > 0) {
            roomService.transferHost(roomId, successor.userId);
        }

        roomBySession.remove(sessionId);
        participantKey = participantKeyBySession.remove(sessionId);
        if (participantKey != null) {
            Set<String> participantSessions = sessionsByParticipant.get(participantKey);
            if (participantSessions != null) {
                participantSessions.remove(sessionId);
                if (participantSessions.isEmpty()) {
                    sessionsByParticipant.remove(participantKey);
                }
            }
        }
        if (participant != null) {
            participant.sessions.remove(sessionId);
            if (participant.sessions.isEmpty()) {
                participants.remove(participantKey);
            }
        }

        if (participants.isEmpty()) {
            participantsByRoom.remove(roomId);
            hostUserByRoom.remove(roomId);
            emptyRoomsPendingCleanup.add(roomId);
            scheduleRoomCleanup(roomId);
            return new RoomPresenceState(roomId, List.of());
        }
        if (successor != null) {
            hostUserByRoom.put(roomId, successor.userId);
        }
        return snapshot(roomId);
    }

    // 이 메서드는 클래스의 상태와 입력을 사용해 한 가지 책임을 수행한다.
    private RoomPresenceState snapshot(long roomId) {
        Map<String, ParticipantPresence> currentParticipants = participantsByRoom.get(roomId);
        List<RoomParticipant> participants = new ArrayList<>(currentParticipants.size());
        for (ParticipantPresence participant : currentParticipants.values()) {
            participants.add(createParticipant(roomId, participant));
        }
        return new RoomPresenceState(roomId, List.copyOf(participants));
    }

    // 생성 흐름: 입력을 준비한 뒤 새 객체나 DB 행을 만든다.
    private RoomParticipant createParticipant(long roomId, ParticipantPresence participant) {
        return new RoomParticipant(
                participant.userId,
                participant.nickname,
                Objects.equals(hostUserByRoom.get(roomId), participant.userId),
                participant.ready);
    }

    // 참가자가 없는 방의 삭제를 유예 시간 뒤 실행하도록 예약한다.
    private void scheduleRoomCleanup(long roomId) {
        if (emptyRoomCleanupDelay.isZero()) {
            roomService.deleteRoom(roomId);
            emptyRoomsPendingCleanup.remove(roomId);
            return;
        }

        ScheduledFuture<?> previousTask = cleanupTasksByRoom.remove(roomId);
        if (previousTask != null) {
            previousTask.cancel(false);
        }
        cleanupTasksByRoom.put(roomId, cleanupExecutor.schedule(
                () -> cleanupRoomIfStillEmpty(roomId),
                emptyRoomCleanupDelay.toMillis(),
                TimeUnit.MILLISECONDS));
    }

    // 이 메서드는 클래스의 상태와 입력을 사용해 한 가지 책임을 수행한다.
    private void cancelRoomCleanup(long roomId) {
        emptyRoomsPendingCleanup.remove(roomId);
        ScheduledFuture<?> cleanupTask = cleanupTasksByRoom.remove(roomId);
        if (cleanupTask != null) {
            cleanupTask.cancel(false);
        }
    }

    // 예약 시점에도 방이 비어 있는지 다시 확인한 후 DB 방을 삭제한다.
    private void cleanupRoomIfStillEmpty(long roomId) {
        writeLock.lock();
        try {
            if (participantsByRoom.containsKey(roomId)) {
                emptyRoomsPendingCleanup.remove(roomId);
                cleanupTasksByRoom.remove(roomId);
                return;
            }

            try {
                roomService.deleteRoom(roomId);
                emptyRoomsPendingCleanup.remove(roomId);
                cleanupTasksByRoom.remove(roomId);
            } catch (RuntimeException exception) {
                log.warn("방 정리 작업에 실패했습니다. 재시도합니다. roomId={}", roomId, exception);
                cleanupTasksByRoom.put(roomId, cleanupExecutor.schedule(
                        () -> cleanupRoomIfStillEmpty(roomId),
                        Math.max(1L, emptyRoomCleanupDelay.toMillis()),
                        TimeUnit.MILLISECONDS));
            }
        } finally {
            writeLock.unlock();
        }
    }

    // 이 메서드는 클래스의 상태와 입력을 사용해 한 가지 책임을 수행한다.
    @PreDestroy
    void shutdownCleanupExecutor() {
        cleanupExecutor.shutdownNow();
    }

    // 계산된 최신 상태를 해당 topic 또는 로비 topic으로 방송한다.
    private void broadcast(RoomPresenceState state) {
        messagingTemplate.convertAndSend(
                PRESENCE_DESTINATION.formatted(state.roomId()),
                state);
        messagingTemplate.convertAndSend(
                LOBBY_PRESENCE_DESTINATION,
                new RoomPresenceCount(state.roomId(), state.participants().size()));
    }

    private static final class ParticipantPresence {
    // 입력 검증과 업무 규칙을 수행하고 DAO·Domain·DTO 사이의 흐름을 조정한다.
        private final long userId;
        private String nickname;
        private boolean ready;
        private final Set<String> sessions = new LinkedHashSet<>();

        // 이 메서드는 클래스의 상태와 입력을 사용해 한 가지 책임을 수행한다.
        private ParticipantPresence(PrincipalIdentity identity) {
            this.userId = identity.userId();
            this.nickname = identity.nickname();
        }
    }

}
````

### `src/main/java/kr/or/oti/mafiagame/service/ChatService.java`

**코드 흐름:** 채팅 내용을 trim하고 빈 값·최대 길이·방 참가 여부를 검사한 뒤 `ChatMessage`를 만든다.

**학습 포인트:** Controller는 전달과 방송, Service는 규칙과 검증을 담당하는 경계를 확인한다.

````java
// 코드 흐름: 채팅 요청을 받아 참가자 여부와 메시지 내용을 먼저 검사한다.
// 동작: 검증·정규화가 끝난 뒤 시간과 발신자를 포함한 ChatMessage를 반환한다.
// 읽는 순서: 필드(상태·의존성) → 생성자(준비) → public 메서드(외부에서 시작되는 흐름) 순서로 읽는다.
// 메서드 안에서는 입력 확인 → 핵심 처리 → 반환값 또는 예외 순서로 흐름을 따라가면 된다.
package kr.or.oti.mafiagame.service;




@Service
public class ChatService {
    // 입력 검증과 업무 규칙을 수행하고 DAO·Domain·DTO 사이의 흐름을 조정한다.
    private static final int MAX_MESSAGE_LENGTH = 300;
    private static final String CHAT_TYPE = "CHAT";

    private final RoomPresenceService roomPresenceService;

    // 생성자: Spring 또는 호출자가 넘긴 의존성과 초기 상태를 필드에 보관한다.
    public ChatService(RoomPresenceService roomPresenceService) {
        this.roomPresenceService = roomPresenceService;
    }

    // 로그인·방 참가·메시지 길이를 검증한 뒤 현재 시각과 발신자를 담은 ChatMessage를 만든다.
    public ChatMessage createMessage(
            long roomId,
            ChatMessageRequest request,
            Principal principal,
            String sessionId) {
        if (principal == null) {
            throw new RoomWebSocketException("로그인 후 채팅을 이용할 수 있습니다.");
        }

        if (!roomPresenceService.isParticipant(roomId, sessionId)) {
            throw new RoomWebSocketException("먼저 게임방에 입장해 주세요.");
        }

        String content = normalizeContent(request);
        return new ChatMessage(roomId, CHAT_TYPE, PrincipalIdentity.from(principal).nickname(), content, Instant.now());
    }

    // 채팅 앞뒤 공백을 제거하고 빈 값·Unicode 길이 초과를 거부한다.
    private String normalizeContent(ChatMessageRequest request) {
        String content = request == null || request.content() == null
                ? ""
                : request.content().strip();

        if (content.isBlank()) {
            throw new RoomWebSocketException("메시지를 입력해 주세요.");
        }
        if (content.codePointCount(0, content.length()) > MAX_MESSAGE_LENGTH) {
            throw new RoomWebSocketException("메시지는 300자 이하로 입력해 주세요.");
        }
        return content;
    }

}
````

### `src/main/java/kr/or/oti/mafiagame/dao/UserMapper.java`

**코드 흐름:** 사용자와 통계 조회·저장 메서드를 선언한다. 암호화는 Service가 하고 Mapper는 전달받은 값을 SQL에 연결한다.

**학습 포인트:** Java 메서드 이름과 XML의 SQL id가 어떻게 매칭되는지 확인한다.

````java
// 코드 흐름: Service가 이 Mapper 인터페이스의 메서드를 호출한다.
// 동작: 같은 이름의 XML SQL이 DB와 통신하고 조회 결과가 호출자에게 돌아온다.
// 읽는 순서: 필드(상태·의존성) → 생성자(준비) → public 메서드(외부에서 시작되는 흐름) 순서로 읽는다.
// 메서드 안에서는 입력 확인 → 핵심 처리 → 반환값 또는 예외 순서로 흐름을 따라가면 된다.
package kr.or.oti.mafiagame.dao;




@Mapper
public interface UserMapper {
    // Java Mapper 메서드를 MyBatis XML SQL과 연결해 데이터베이스 작업을 위임한다.
    // 생성 흐름: 입력을 준비한 뒤 새 객체나 DB 행을 만든다.
    int insert(User user);

    // 생성 흐름: 입력을 준비한 뒤 새 객체나 DB 행을 만든다.
    int insertStats(@Param("userId") long userId);

    // 조회 흐름: 입력 식별자로 저장소 또는 메모리에서 값을 읽어 호출자에게 반환한다.
    Optional<User> findById(@Param("userId") Long userId);

    // 조회 흐름: 입력 식별자로 저장소 또는 메모리에서 값을 읽어 호출자에게 반환한다.
    UserStats findStatsByUserId(@Param("userId") long userId);

    // 조회 흐름: 입력 식별자로 저장소 또는 메모리에서 값을 읽어 호출자에게 반환한다.
    Optional<User> findByEmail(@Param("email") String email);

    // Service가 호출하는 DB 작업 진입점이며 실제 SQL은 Mapper XML에서 실행된다.
    boolean existsByEmail(@Param("email") String email);

    // 변경 흐름: 현재 상태를 확인하고 필요한 값만 갱신한다.
    int updateNickname(
            @Param("userId") Long userId,
            @Param("nickname") String nickname
    );

    // 정리 흐름: 관련 메모리·DB 상태를 순서대로 제거한다.
    int deleteById(@Param("userId") Long userId);
}
````

### `src/main/java/kr/or/oti/mafiagame/dao/RoomMapper.java`

**코드 흐름:** 방·방 멤버 DB 조회와 저장 메서드를 선언한다. 각 메서드는 `RoomMapper.xml`의 같은 id SQL과 연결된다.

**학습 포인트:** Service → Mapper 인터페이스 → XML SQL → DB 순서를 따라 읽는다.

````java
// 코드 흐름: Service가 이 Mapper 인터페이스의 메서드를 호출한다.
// 동작: 같은 이름의 XML SQL이 DB와 통신하고 조회 결과가 호출자에게 돌아온다.
// 읽는 순서: 필드(상태·의존성) → 생성자(준비) → public 메서드(외부에서 시작되는 흐름) 순서로 읽는다.
// 메서드 안에서는 입력 확인 → 핵심 처리 → 반환값 또는 예외 순서로 흐름을 따라가면 된다.
package kr.or.oti.mafiagame.dao;




@Mapper
public interface RoomMapper {
    // Java Mapper 메서드를 MyBatis XML SQL과 연결해 데이터베이스 작업을 위임한다.
    // 조회 흐름: 입력 식별자로 저장소 또는 메모리에서 값을 읽어 호출자에게 반환한다.
    List<RoomSummary> findAll();

    // 조회 흐름: 입력 식별자로 저장소 또는 메모리에서 값을 읽어 호출자에게 반환한다.
    RoomSummary findById(@Param("roomId") long roomId);

    // 조회 흐름: 입력 식별자로 저장소 또는 메모리에서 값을 읽어 호출자에게 반환한다.
    String findPasswordHash(@Param("roomId") long roomId);

    // 조회 흐름: 입력 식별자로 저장소 또는 메모리에서 값을 읽어 호출자에게 반환한다.
    List<String> findMemberNames(@Param("roomId") long roomId);

    // 생성 흐름: 입력을 준비한 뒤 새 객체나 DB 행을 만든다.
    int insert(Room room);

    // 생성 흐름: 입력을 준비한 뒤 새 객체나 DB 행을 만든다.
    int insertMember(@Param("roomId") long roomId, @Param("userId") long userId);

    // 변경 흐름: 현재 상태를 확인하고 필요한 값만 갱신한다.
    int updateHostUserId(@Param("roomId") long roomId, @Param("hostUserId") long hostUserId);

    // 정리 흐름: 관련 메모리·DB 상태를 순서대로 제거한다.
    int deleteMembersByRoomId(@Param("roomId") long roomId);

    // 정리 흐름: 관련 메모리·DB 상태를 순서대로 제거한다.
    int deleteById(@Param("roomId") long roomId);
}
````

### `src/main/java/kr/or/oti/mafiagame/domain/User.java`

**코드 흐름:** 사용자 계정의 이메일·암호화 비밀번호·닉네임·소개를 표현한다.

**학습 포인트:** Spring Security가 로그인 사용자를 찾을 때 이 객체의 인증 정보를 사용한다.

````java
// 코드 흐름: DB 한 행을 Java 객체의 필드로 표현한다.
// 동작: Mapper가 채운 객체를 Service가 사용하고 화면에는 직접 노출하지 않는다.
// 읽는 순서: 필드(상태·의존성) → 생성자(준비) → public 메서드(외부에서 시작되는 흐름) 순서로 읽는다.
// 메서드 안에서는 입력 확인 → 핵심 처리 → 반환값 또는 예외 순서로 흐름을 따라가면 된다.
package kr.or.oti.mafiagame.domain;



@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = "password")
public class User {
    // DB 행이나 핵심 상태를 Java 객체로 보관한다.
    private long    userId;

    private String  userName;

    private String  email;

    private String  password;

    private int     user_level;

    private String  bio;

    private LocalDateTime createdAt;
}
````

### `src/main/java/kr/or/oti/mafiagame/domain/UserStats.java`

**코드 흐름:** 사용자의 누적 게임 수·승리·패배·레이팅을 표현한다.

**학습 포인트:** 회원가입 때 사용자 본체와 통계 행이 함께 생성되는 이유를 확인한다.

````java
// 코드 흐름: DB 한 행을 Java 객체의 필드로 표현한다.
// 동작: Mapper가 채운 객체를 Service가 사용하고 화면에는 직접 노출하지 않는다.
// 읽는 순서: 필드(상태·의존성) → 생성자(준비) → public 메서드(외부에서 시작되는 흐름) 순서로 읽는다.
// 메서드 안에서는 입력 확인 → 핵심 처리 → 반환값 또는 예외 순서로 흐름을 따라가면 된다.
package kr.or.oti.mafiagame.domain;


@Getter
@Setter
@NoArgsConstructor
public class UserStats {
    // DB 행이나 핵심 상태를 Java 객체로 보관한다.
    private int totalGames;
    private int wins;
}
````

### `src/main/java/kr/or/oti/mafiagame/domain/Room.java`

**코드 흐름:** `game_room` 한 행을 표현하며 방 ID·방장·제목·비밀번호·정원·상태를 가진다.

**학습 포인트:** DB 저장 모델과 화면 응답 모델을 섞지 않는 Domain의 역할을 익힌다.

````java
// 코드 흐름: DB 한 행을 Java 객체의 필드로 표현한다.
// 동작: Mapper가 채운 객체를 Service가 사용하고 화면에는 직접 노출하지 않는다.
// 읽는 순서: 필드(상태·의존성) → 생성자(준비) → public 메서드(외부에서 시작되는 흐름) 순서로 읽는다.
// 메서드 안에서는 입력 확인 → 핵심 처리 → 반환값 또는 예외 순서로 흐름을 따라가면 된다.
package kr.or.oti.mafiagame.domain;


@Getter
@Setter
@NoArgsConstructor
public class Room {
    // DB 행이나 핵심 상태를 Java 객체로 보관한다.
    private long roomId;
    private long hostUserId;
    private String title;
    private String roomPassword;
    private int maxPlayers;
    private String status;

    // 생성자: Spring 또는 호출자가 넘긴 의존성과 초기 상태를 필드에 보관한다.
    @Builder
    public Room(long roomId, long hostUserId, String title, String roomPassword,
                int maxPlayers, String status) {
        this.roomId = roomId;
        this.hostUserId = hostUserId;
        this.title = title;
        this.roomPassword = roomPassword;
        this.maxPlayers = maxPlayers;
        this.status = status;
    }
}
````

### `src/main/java/kr/or/oti/mafiagame/dto/UserProfile.java`

**코드 흐름:** 계정·통계·최근 기록을 프로필 화면용으로 묶고 승률 같은 표시용 계산을 제공한다.

**학습 포인트:** Controller가 계산식을 알지 않고 DTO 값을 템플릿에 전달하는 흐름을 본다.

````java
// 코드 흐름: Controller·Service 경계에서 주고받는 데이터 모양을 정의한다.
// 동작: 입력 DTO는 검증 대상으로, 응답 DTO는 HTML·WebSocket 표시 대상으로 사용된다.
// 읽는 순서: 필드(상태·의존성) → 생성자(준비) → public 메서드(외부에서 시작되는 흐름) 순서로 읽는다.
// 메서드 안에서는 입력 확인 → 핵심 처리 → 반환값 또는 예외 순서로 흐름을 따라가면 된다.
package kr.or.oti.mafiagame.dto;


/**
 * 사용자 프로필 화면에 전달하는 모델이다.
 */
    // record는 생성자·접근 메서드·equals를 자동으로 제공하는 작은 데이터 묶음이다.
public record UserProfile(
        long id,
        String nickname,
        String bio,
        int totalGames,
        int wins,
        Integer mafiaGames,
        Integer mafiaWins,
        String joinedAt,
        List<GameRecord> recentGames) {

    public UserProfile {
        recentGames = List.copyOf(recentGames);
    }

    // 전체 게임 수가 0이면 0을 반환하고, 아니면 승리 비율을 계산한다.
    public int winRate() {
        return totalGames == 0 ? 0 : Math.round((float) wins / totalGames * 100);
    }

    // 마피아 게임 모수가 없을 때를 처리한 뒤 마피아 승률을 계산한다.
    public int mafiaWinRate() {
        return mafiaGames == null || mafiaWins == null || mafiaGames == 0
                ? 0
                : Math.round((float) mafiaWins / mafiaGames * 100);
    }
}
````

### `src/main/java/kr/or/oti/mafiagame/dto/RoomSummary.java`

**코드 흐름:** DB 조회 결과를 로비와 방 상세에서 사용할 수 있게 요약한다.

**학습 포인트:** 조회 결과 필드와 계산된 잠금·인원 값을 읽으며 `RoomView`와의 차이를 비교한다.

````java
// 코드 흐름: Controller·Service 경계에서 주고받는 데이터 모양을 정의한다.
// 동작: 입력 DTO는 검증 대상으로, 응답 DTO는 HTML·WebSocket 표시 대상으로 사용된다.
// 읽는 순서: 필드(상태·의존성) → 생성자(준비) → public 메서드(외부에서 시작되는 흐름) 순서로 읽는다.
// 메서드 안에서는 입력 확인 → 핵심 처리 → 반환값 또는 예외 순서로 흐름을 따라가면 된다.
package kr.or.oti.mafiagame.dto;


/**
 * 게임방 목록/상세 조회를 위한 MyBatis 조회 결과다.
 * 영속 도메인인 {@code Room}과 화면 모델을 연결하는 읽기 전용 projection 역할을 한다.
 */
@Getter
@Setter
@NoArgsConstructor
public class RoomSummary {
    // 계층 사이에서 필요한 값만 안전하게 전달하는 데이터 구조다.
    private long roomId;
    private long hostUserId;
    private String title;
    private String hostName;
    private int currentPlayers;
    private int maxPlayers;
    private String status;
    private boolean locked;
}
````

### `src/main/java/kr/or/oti/mafiagame/dto/RoomView.java`

**코드 흐름:** 화면에 필요한 설명·방장 이름·인원·잠금 여부를 묶는다. `from`으로 만들고 `withPlayerCount`로 실시간 인원을 바꾼다.

**학습 포인트:** DB 방 정보와 WebSocket 현재 인원을 합치는 변환 지점이다.

````java
// 코드 흐름: Controller·Service 경계에서 주고받는 데이터 모양을 정의한다.
// 동작: 입력 DTO는 검증 대상으로, 응답 DTO는 HTML·WebSocket 표시 대상으로 사용된다.
// 읽는 순서: 필드(상태·의존성) → 생성자(준비) → public 메서드(외부에서 시작되는 흐름) 순서로 읽는다.
// 메서드 안에서는 입력 확인 → 핵심 처리 → 반환값 또는 예외 순서로 흐름을 따라가면 된다.
package kr.or.oti.mafiagame.dto;

/**
 * 게임방 목록과 상세 화면에 공통으로 전달하는 응답 모델이다.
 */
    // record는 생성자·접근 메서드·equals를 자동으로 제공하는 작은 데이터 묶음이다.
public record RoomView(
        long roomId,
        String title,
        String description,
        String hostName,
        int players,
        int capacity,
        String status,
        boolean locked) {

    // DB 조회용 RoomSummary를 화면에서 사용할 RoomView record로 변환한다.
    public static RoomView from(RoomSummary room) {
        return new RoomView(
                room.getRoomId(),
                room.getTitle(),
                room.getHostName() + "님이 만든 대기방 · 인원이 모이면 시작해요",
                room.getHostName(),
                room.getCurrentPlayers(),
                room.getMaxPlayers(),
                room.getStatus(),
                room.isLocked());
    }

    // 방의 다른 필드는 유지하면서 실시간 인원 수만 바꾼 새 View를 만든다.
    public RoomView withPlayerCount(int playerCount) {
        return new RoomView(
                roomId,
                title,
                description,
                hostName,
                playerCount,
                capacity,
                status,
                locked);
    }

    // 조회 흐름: 입력 식별자로 저장소 또는 메모리에서 값을 읽어 호출자에게 반환한다.
    public int currentPlayers() {
        return players;
    }

    // DTO의 계산/팩토리 메서드가 화면이나 메시지에 필요한 값을 만든다.
    public int maxPlayers() {
        return capacity;
    }
}
````

### `src/main/java/kr/or/oti/mafiagame/dto/RoomParticipant.java`

**코드 흐름:** 실시간 대기방에서 보여줄 사용자 ID·닉네임·방장·Ready 상태를 담는다.

**학습 포인트:** 여러 WebSocket 세션을 한 사용자 참가자로 합친 뒤 만들어지는 화면용 데이터다.

````java
// 코드 흐름: Controller·Service 경계에서 주고받는 데이터 모양을 정의한다.
// 동작: 입력 DTO는 검증 대상으로, 응답 DTO는 HTML·WebSocket 표시 대상으로 사용된다.
// 읽는 순서: 필드(상태·의존성) → 생성자(준비) → public 메서드(외부에서 시작되는 흐름) 순서로 읽는다.
// 메서드 안에서는 입력 확인 → 핵심 처리 → 반환값 또는 예외 순서로 흐름을 따라가면 된다.
package kr.or.oti.mafiagame.dto;

    // record는 생성자·접근 메서드·equals를 자동으로 제공하는 작은 데이터 묶음이다.
public record RoomParticipant(
        long userId,
        String nickname,
        boolean host,
        boolean ready) {
}
````

### `src/main/java/kr/or/oti/mafiagame/dto/RoomPresenceState.java`

**코드 흐름:** 특정 방 ID와 현재 참가자 목록을 묶어 방송한다.

**학습 포인트:** 입장·퇴장·Ready 변경마다 이 상태가 새로 만들어져 브라우저로 간다.

````java
// 코드 흐름: Controller·Service 경계에서 주고받는 데이터 모양을 정의한다.
// 동작: 입력 DTO는 검증 대상으로, 응답 DTO는 HTML·WebSocket 표시 대상으로 사용된다.
// 읽는 순서: 필드(상태·의존성) → 생성자(준비) → public 메서드(외부에서 시작되는 흐름) 순서로 읽는다.
// 메서드 안에서는 입력 확인 → 핵심 처리 → 반환값 또는 예외 순서로 흐름을 따라가면 된다.
package kr.or.oti.mafiagame.dto;


    // record는 생성자·접근 메서드·equals를 자동으로 제공하는 작은 데이터 묶음이다.
public record RoomPresenceState(
        long roomId,
        List<RoomParticipant> participants) {
}
````

### `src/main/java/kr/or/oti/mafiagame/dto/RoomPresenceCount.java`

**코드 흐름:** 로비에 방별 현재 접속 인원을 전달한다.

**학습 포인트:** DB 멤버 수가 아니라 실시간 메모리 상태가 계산한 인원이라는 점이 핵심이다.

````java
// 코드 흐름: Controller·Service 경계에서 주고받는 데이터 모양을 정의한다.
// 동작: 입력 DTO는 검증 대상으로, 응답 DTO는 HTML·WebSocket 표시 대상으로 사용된다.
// 읽는 순서: 필드(상태·의존성) → 생성자(준비) → public 메서드(외부에서 시작되는 흐름) 순서로 읽는다.
// 메서드 안에서는 입력 확인 → 핵심 처리 → 반환값 또는 예외 순서로 흐름을 따라가면 된다.
package kr.or.oti.mafiagame.dto;

    // record는 생성자·접근 메서드·equals를 자동으로 제공하는 작은 데이터 묶음이다.
public record RoomPresenceCount(
        long roomId,
        int currentPlayers) {
}
````

### `src/main/java/kr/or/oti/mafiagame/dto/RoomReadyRequest.java`

**코드 흐름:** Ready 버튼의 true·false 입력을 담는다.

**학습 포인트:** Controller가 받고 Service가 참가자 여부와 변경 가능성을 검사한다.

````java
// 코드 흐름: Controller·Service 경계에서 주고받는 데이터 모양을 정의한다.
// 동작: 입력 DTO는 검증 대상으로, 응답 DTO는 HTML·WebSocket 표시 대상으로 사용된다.
// 읽는 순서: 필드(상태·의존성) → 생성자(준비) → public 메서드(외부에서 시작되는 흐름) 순서로 읽는다.
// 메서드 안에서는 입력 확인 → 핵심 처리 → 반환값 또는 예외 순서로 흐름을 따라가면 된다.
package kr.or.oti.mafiagame.dto;

    // record는 생성자·접근 메서드·equals를 자동으로 제공하는 작은 데이터 묶음이다.
public record RoomReadyRequest(boolean ready) {
}
````

### `src/main/java/kr/or/oti/mafiagame/dto/ChatMessageRequest.java`

**코드 흐름:** 브라우저가 보내는 아직 검증되지 않은 채팅 입력을 담는다.

**학습 포인트:** Service가 이 값을 정리·검증한 뒤 `ChatMessage`를 만든다.

````java
// 코드 흐름: Controller·Service 경계에서 주고받는 데이터 모양을 정의한다.
// 동작: 입력 DTO는 검증 대상으로, 응답 DTO는 HTML·WebSocket 표시 대상으로 사용된다.
// 읽는 순서: 필드(상태·의존성) → 생성자(준비) → public 메서드(외부에서 시작되는 흐름) 순서로 읽는다.
// 메서드 안에서는 입력 확인 → 핵심 처리 → 반환값 또는 예외 순서로 흐름을 따라가면 된다.
package kr.or.oti.mafiagame.dto;

    // record는 생성자·접근 메서드·equals를 자동으로 제공하는 작은 데이터 묶음이다.
public record ChatMessageRequest(String content) {
}
````

### `src/main/java/kr/or/oti/mafiagame/dto/ChatMessage.java`

**코드 흐름:** 검증된 채팅의 방·보낸 사람·내용·전송 시각을 표현하고 topic 방송 JSON이 된다.

**학습 포인트:** 입력용 `ChatMessageRequest`와 응답용 DTO를 구분한다.

````java
// 코드 흐름: Controller·Service 경계에서 주고받는 데이터 모양을 정의한다.
// 동작: 입력 DTO는 검증 대상으로, 응답 DTO는 HTML·WebSocket 표시 대상으로 사용된다.
// 읽는 순서: 필드(상태·의존성) → 생성자(준비) → public 메서드(외부에서 시작되는 흐름) 순서로 읽는다.
// 메서드 안에서는 입력 확인 → 핵심 처리 → 반환값 또는 예외 순서로 흐름을 따라가면 된다.
package kr.or.oti.mafiagame.dto;


    // record는 생성자·접근 메서드·equals를 자동으로 제공하는 작은 데이터 묶음이다.
public record ChatMessage(
        long roomId,
        String type,
        String sender,
        String content,
        Instant sentAt) {
}
````

### `src/main/java/kr/or/oti/mafiagame/dto/ChatError.java`

**코드 흐름:** WebSocket 업무 오류를 종류와 메시지로 전달하는 응답 DTO다.

**학습 포인트:** 예외 객체를 그대로 노출하지 않고 화면이 처리할 최소 정보만 보낸다.

````java
// 코드 흐름: Controller·Service 경계에서 주고받는 데이터 모양을 정의한다.
// 동작: 입력 DTO는 검증 대상으로, 응답 DTO는 HTML·WebSocket 표시 대상으로 사용된다.
// 읽는 순서: 필드(상태·의존성) → 생성자(준비) → public 메서드(외부에서 시작되는 흐름) 순서로 읽는다.
// 메서드 안에서는 입력 확인 → 핵심 처리 → 반환값 또는 예외 순서로 흐름을 따라가면 된다.
package kr.or.oti.mafiagame.dto;

    // record는 생성자·접근 메서드·equals를 자동으로 제공하는 작은 데이터 묶음이다.
public record ChatError(String type, String message) {
    private static final String ERROR_TYPE = "ERROR";

    // 예외 메시지를 공통 ERROR 타입의 응답 DTO로 감싼다.
    public static ChatError of(String message) {
        return new ChatError(ERROR_TYPE, message);
    }
}
````

### `src/main/java/kr/or/oti/mafiagame/dto/GameRecord.java`

**코드 흐름:** 프로필이나 결과 화면에 표시할 게임 기록 한 건의 데이터 모양을 정의한다.

**학습 포인트:** 현재 대기방 기능보다 이후 게임 결과 흐름에서 사용될 화면 경계 객체로 읽는다.

````java
// 코드 흐름: Controller·Service 경계에서 주고받는 데이터 모양을 정의한다.
// 동작: 입력 DTO는 검증 대상으로, 응답 DTO는 HTML·WebSocket 표시 대상으로 사용된다.
// 읽는 순서: 필드(상태·의존성) → 생성자(준비) → public 메서드(외부에서 시작되는 흐름) 순서로 읽는다.
// 메서드 안에서는 입력 확인 → 핵심 처리 → 반환값 또는 예외 순서로 흐름을 따라가면 된다.
package kr.or.oti.mafiagame.dto;

/**
 * 사용자 최근 게임 이력 화면 모델이다.
 */
    // record는 생성자·접근 메서드·equals를 자동으로 제공하는 작은 데이터 묶음이다.
public record GameRecord(
        String roomTitle,
        String role,
        String result,
        String status,
        String playedAt) {
}
````

### `src/main/java/kr/or/oti/mafiagame/exception/RoomWebSocketException.java`

**코드 흐름:** 방 WebSocket 요청에서 발생한 업무 오류를 표현한다.

**학습 포인트:** Service가 던진 예외를 Controller 예외 처리기가 `ChatError`로 바꿔 브라우저에 보낸다.

````java
// 코드 흐름: 업무 처리 중 복구 가능한 오류를 예외 객체로 표현한다.
// 동작: Controller 예외 처리기가 이 오류를 사용자에게 보여줄 응답 DTO로 바꾼다.
// 읽는 순서: 필드(상태·의존성) → 생성자(준비) → public 메서드(외부에서 시작되는 흐름) 순서로 읽는다.
// 메서드 안에서는 입력 확인 → 핵심 처리 → 반환값 또는 예외 순서로 흐름을 따라가면 된다.
package kr.or.oti.mafiagame.exception;

public class RoomWebSocketException extends RuntimeException {
    // 처리 실패 사유를 호출자가 구분할 수 있는 예외 객체로 표현한다.
    private static final long serialVersionUID = 1L;

    // 생성자: Spring 또는 호출자가 넘긴 의존성과 초기 상태를 필드에 보관한다.
    public RoomWebSocketException(String message) {
        super(message);
    }
}
````

## 화면·SQL·정적 리소스

### `src/main/resources/application.properties`

**코드 흐름:** Spring Boot 이름, DB·MyBatis, 빈 방 정리 유예 시간을 설정한다.

**학습 포인트:** 문서에서는 로컬 DB 접속값을 환경 변수로 치환했으며 실제 파일의 설정 구조만 학습한다.

````properties
# 코드 흐름: 파일의 선언과 실행 순서를 위에서 아래로 읽는다.
# 동작: 이 파일을 호출하는 곳과 결과를 사용하는 곳을 함께 찾는다.
# 이 파일은 코드가 아니라 실행 환경의 기본값을 선언한다.
# ${...} 값은 실행 환경에서 주입되고, 나머지 항목은 Spring·MyBatis 동작을 조정한다.
spring.application.name=mafiagame

# MariaDB
spring.datasource.driver-class-name=org.mariadb.jdbc.Driver
# DB 주소와 계정은 환경 변수에서 읽어 소스에 비밀값을 넣지 않는다.
spring.datasource.url=${DB_URL}
spring.datasource.username=${DB_USERNAME}
spring.datasource.password=${DB_PASSWORD}

# MyBatis
# Java Mapper 인터페이스와 XML SQL 파일의 위치를 연결한다.
mybatis.mapper-locations=classpath:/mappers/**/*.xml
mybatis.configuration.map-underscore-to-camel-case=true
mybatis.configuration.jdbc-type-for-null=NULL

# 네트워크 재연결을 허용하기 위한 빈 방 정리 유예 시간
# 마지막 참가자가 나간 빈 방에 재접속할 수 있도록 삭제를 잠시 유예한다.
mafiagame.room.empty-cleanup-delay=15s
````

### `src/main/resources/mappers/UserMapper.xml`

**코드 흐름:** `UserMapper`와 연결된 사용자·통계 INSERT, 이메일 조회, 프로필 조회 SQL을 정의한다.

**학습 포인트:** 회원가입 Service 호출이 이 XML의 두 INSERT로 이어지는 흐름을 확인한다.

````xml
<?xml version="1.0" encoding="UTF-8"?>
<!-- 코드 흐름: UserMapper 메서드 id를 따라 사용자와 통계 SQL이 실행된다. -->
<!-- 동작: 회원가입·로그인 조회 결과가 Java 계층으로 전달된다. -->
<!-- 읽는 순서: namespace → resultMap → SQL statement id 순서로 보고, id가 Java Mapper 메서드와 연결되는 지점을 확인한다. -->
<!-- SQL 결과의 컬럼명과 result/property 매핑이 Java 객체의 필드로 변환되는 길이다. -->
<!DOCTYPE mapper
        PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "https://mybatis.org/dtd/mybatis-3-mapper.dtd">

<mapper namespace="kr.or.oti.mafiagame.dao.UserMapper">

<!-- resultMap: SQL column을 Java 객체 property로 바꾸는 매핑 규칙이다. -->
    <resultMap id="userResultMap" type="kr.or.oti.mafiagame.domain.User">
        <id property="userId" column="user_id"/>
        <result property="userName" column="user_name"/>
        <result property="email" column="email"/>
        <result property="password" column="password"/>
        <result property="user_level" column="user_level"/>
        <result property="bio" column="bio"/>
        <result property="createdAt" column="created_at"/>
    </resultMap>

<!-- insert: Java Mapper 호출이 이 INSERT SQL을 실행한다. -->
    <insert id="insert"
            parameterType="kr.or.oti.mafiagame.domain.User"
            useGeneratedKeys="true"
            keyProperty="userId">
        INSERT INTO `user` (
            email,
            password,
            user_name,
            user_level,
            bio
        )
        VALUES (
            #{email},
            #{password},
            #{userName},
            #{user_level},
            #{bio}
        )
    </insert>

<!-- insertStats: Java Mapper 호출이 이 INSERT SQL을 실행한다. -->
    <insert id="insertStats">
        INSERT INTO user_stats (user_id)
        VALUES (#{userId})
    </insert>

<!-- findById: Java Mapper 호출이 이 SELECT SQL을 실행한다. -->
    <select id="findById" resultMap="userResultMap">
        SELECT
            user_id,
            email,
            password,
            user_name,
            user_level,
            bio,
            created_at
        FROM `user`
        WHERE user_id = #{userId}
    </select>

<!-- findByEmail: Java Mapper 호출이 이 SELECT SQL을 실행한다. -->
    <select id="findByEmail" resultMap="userResultMap">
        SELECT
            user_id,
            email,
            password,
            user_name,
            user_level,
            bio,
            created_at
        FROM `user`
        WHERE email = #{email}
    </select>

<!-- findStatsByUserId: Java Mapper 호출이 이 SELECT SQL을 실행한다. -->
    <select id="findStatsByUserId" resultType="kr.or.oti.mafiagame.domain.UserStats">
        SELECT total_games, wins
        FROM user_stats
        WHERE user_id = #{userId}
    </select>

<!-- existsByEmail: Java Mapper 호출이 이 SELECT SQL을 실행한다. -->
    <select id="existsByEmail" resultType="boolean">
        SELECT EXISTS (
            SELECT 1
            FROM `user`
            WHERE email = #{email}
        )
    </select>

<!-- updateNickname: Java Mapper 호출이 이 UPDATE SQL을 실행한다. -->
    <update id="updateNickname">
        UPDATE `user`
        SET user_name = #{nickname}
        WHERE user_id = #{userId}
    </update>

<!-- deleteById: Java Mapper 호출이 이 DELETE SQL을 실행한다. -->
    <delete id="deleteById">
        DELETE FROM `user`
        WHERE user_id = #{userId}
    </delete>

</mapper>
````

### `src/main/resources/mappers/RoomMapper.xml`

**코드 흐름:** `RoomMapper` 메서드 id와 연결된 방 목록·상세·멤버·생성·삭제 SQL을 실행한다.

**학습 포인트:** 파라미터 바인딩과 조회 결과가 `RoomSummary`·`Room`으로 매핑되는 부분을 찾는다.

````xml
<?xml version="1.0" encoding="UTF-8"?>
<!-- 코드 흐름: RoomMapper 메서드 id를 따라 MyBatis SQL이 실행된다. -->
<!-- 동작: DB 결과가 RoomSummary·Room 같은 객체로 매핑되어 Service로 돌아간다. -->
<!-- 읽는 순서: namespace → resultMap → SQL statement id 순서로 보고, id가 Java Mapper 메서드와 연결되는 지점을 확인한다. -->
<!-- SQL 결과의 컬럼명과 result/property 매핑이 Java 객체의 필드로 변환되는 길이다. -->
<!DOCTYPE mapper
        PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
        "https://mybatis.org/dtd/mybatis-3-mapper.dtd">

<mapper namespace="kr.or.oti.mafiagame.dao.RoomMapper">
<!-- findAll: Java Mapper 호출이 이 SELECT SQL을 실행한다. -->
    <select id="findAll" resultType="kr.or.oti.mafiagame.dto.RoomSummary">
        SELECT
            gr.room_id AS room_id,
            gr.host_user_id AS host_user_id,
            gr.title AS title,
            host.user_name AS host_name,
            COUNT(rm.user_id) AS current_players,
            gr.max_players AS max_players,
            gr.status AS status,
            CASE
                WHEN gr.room_password IS NOT NULL AND gr.room_password != '' THEN TRUE
                ELSE FALSE
            END AS locked
        FROM game_room gr
        JOIN `user` host ON host.user_id = gr.host_user_id
        LEFT JOIN room_members rm ON rm.room_id = gr.room_id
        GROUP BY
            gr.room_id,
            gr.host_user_id,
            gr.title,
            host.user_name,
            gr.max_players,
            gr.status,
            gr.room_password,
            gr.created_time
        ORDER BY
            CASE WHEN gr.status = 'WAITING' THEN 0 ELSE 1 END,
            gr.created_time DESC
    </select>

<!-- findById: Java Mapper 호출이 이 SELECT SQL을 실행한다. -->
    <select id="findById" resultType="kr.or.oti.mafiagame.dto.RoomSummary">
        SELECT
            gr.room_id AS room_id,
            gr.host_user_id AS host_user_id,
            gr.title AS title,
            host.user_name AS host_name,
            COUNT(rm.user_id) AS current_players,
            gr.max_players AS max_players,
            gr.status AS status,
            CASE
                WHEN gr.room_password IS NOT NULL AND gr.room_password != '' THEN TRUE
                ELSE FALSE
            END AS locked
        FROM game_room gr
        JOIN `user` host ON host.user_id = gr.host_user_id
        LEFT JOIN room_members rm ON rm.room_id = gr.room_id
        WHERE gr.room_id = #{roomId}
        GROUP BY
            gr.room_id,
            gr.host_user_id,
            gr.title,
            host.user_name,
            gr.max_players,
            gr.status,
            gr.room_password
    </select>

<!-- findMemberNames: Java Mapper 호출이 이 SELECT SQL을 실행한다. -->
    <select id="findMemberNames" resultType="string">
        SELECT u.user_name
        FROM room_members rm
        JOIN `user` u ON u.user_id = rm.user_id
        WHERE rm.room_id = #{roomId}
        ORDER BY rm.joined_time, rm.user_id
    </select>

<!-- findPasswordHash: Java Mapper 호출이 이 SELECT SQL을 실행한다. -->
    <select id="findPasswordHash" resultType="string">
        SELECT room_password
        FROM game_room
        WHERE room_id = #{roomId}
    </select>

<!-- insert: Java Mapper 호출이 이 INSERT SQL을 실행한다. -->
    <insert id="insert" parameterType="kr.or.oti.mafiagame.domain.Room"
            useGeneratedKeys="true" keyProperty="roomId">
        INSERT INTO game_room (host_user_id, title, room_password, max_players, status)
        VALUES (#{hostUserId}, #{title}, #{roomPassword}, #{maxPlayers}, #{status})
    </insert>

<!-- insertMember: Java Mapper 호출이 이 INSERT SQL을 실행한다. -->
    <insert id="insertMember">
        INSERT INTO room_members (room_id, user_id, is_ready)
        VALUES (#{roomId}, #{userId}, FALSE)
    </insert>

<!-- updateHostUserId: Java Mapper 호출이 이 UPDATE SQL을 실행한다. -->
    <update id="updateHostUserId">
        UPDATE game_room
        SET host_user_id = #{hostUserId}
        WHERE room_id = #{roomId}
    </update>

<!-- deleteMembersByRoomId: Java Mapper 호출이 이 DELETE SQL을 실행한다. -->
    <delete id="deleteMembersByRoomId">
        DELETE FROM room_members
        WHERE room_id = #{roomId}
    </delete>

<!-- deleteById: Java Mapper 호출이 이 DELETE SQL을 실행한다. -->
    <delete id="deleteById">
        DELETE FROM game_room
        WHERE room_id = #{roomId}
    </delete>
</mapper>
````

### `src/main/resources/templates/auth/login.html`

**코드 흐름:** 로그인 폼을 Spring Security의 `/login` 처리 URL로 POST하고 오류·로그아웃 상태를 표시한다.

**학습 포인트:** HTML 입력 name이 `SecurityConfig`의 username·password parameter와 맞는지 확인한다.

````html
<!-- 코드 흐름: Controller가 Model과 함께 이 템플릿을 선택하면 Thymeleaf가 HTML을 만든다. -->
<!-- 동작: 폼·data 속성·DOM id가 다음 JavaScript와 HTTP/WebSocket 흐름의 시작점이 된다. -->
<!-- 읽는 순서: 화면 구조 → 서버가 넣는 th:* 값 → JavaScript가 찾는 id·class·data-* 순서로 확인한다. -->
<!-- form은 HTTP 전송의 시작점이고, data-* 속성은 서버 상태와 브라우저 스크립트를 연결한다. -->
<!doctype html>
<html lang="ko" xmlns:th="http://www.thymeleaf.org">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>로그인 | MAFIAGAME</title>
  <link rel="stylesheet" href="/webjars/bootstrap/5.3.8/dist/css/bootstrap.min.css">
  <link rel="stylesheet" th:href="@{/css/app.css}">
</head>
<body class="auth-page bg-white">
<!-- Controller가 반환한 auth/login 템플릿의 본문이며, 여기서 로그인 입력을 받는다. -->
<main class="container-fluid">
  <div class="row min-vh-100 g-0">
    <section class="col-lg-5 d-none d-lg-flex flex-column p-5 auth-art" aria-hidden="true">
      <a class="brand light d-inline-flex align-items-center gap-2" href="/rooms">
        <span class="brand-mark">M</span>
        <span>MAFIA<span class="brand-game">GAME</span></span>
      </a>
      <div class="art-copy">
        <p class="mb-0">TRUST NO ONE</p>
        <h1>밤이 오면,<br>진실은 사라진다.</h1>
        <span>♠</span>
      </div>
      <small class="position-absolute bottom-0 start-0 m-5 text-secondary">© 2026 MAFIAGAME</small>
    </section>

    <section class="col-lg-7 d-flex align-items-center justify-content-center p-4">
      <div class="auth-card">
        <a class="brand d-lg-none d-inline-flex align-items-center gap-2 mb-5" href="/rooms">
          <span class="brand-mark">M</span>
          <span>MAFIA<span class="brand-game">GAME</span></span>
        </a>
        <p class="eyebrow text-coral">WELCOME BACK</p>
        <h1 class="h2 fw-bold mb-2">다시 만나서 반가워요</h1>
        <p class="text-secondary mb-4">계정으로 로그인하고 게임에 참여하세요.</p>

        <div class="alert alert-danger py-2 small" role="alert" th:if="${param.error}">
          이메일 또는 비밀번호를 확인해 주세요.
        </div>
        <div class="alert alert-success py-2 small" role="alert" th:if="${param.logout}">
          성공적으로 로그아웃되었습니다.
        </div>
        <div class="alert alert-success py-2 small" role="alert" th:if="${param.signup}">
          회원가입이 완료되었습니다. 로그인해 주세요.
        </div>

<!-- POST /login은 SecurityConfig의 로그인 처리 URL과 연결된다. -->
        <form th:action="@{/login}" method="post" class="vstack gap-3">
          <div>
            <label class="form-label fw-semibold" for="email">이메일</label>
<!-- name="email"은 SecurityConfig의 usernameParameter와 맞아야 한다. -->
            <input class="form-control" id="email" type="email" name="email"
                   placeholder="name@example.com" autocomplete="username" required>
          </div>
          <div>
            <label class="form-label fw-semibold" for="password">비밀번호</label>
<!-- name="password"는 SecurityConfig의 passwordParameter와 연결된다. -->
            <input class="form-control" id="password" type="password" name="password"
                   placeholder="비밀번호를 입력하세요" autocomplete="current-password" required>
          </div>
          <button class="btn btn-coral w-100 py-2 fw-bold" type="submit">로그인</button>
        </form>

        <p class="text-center text-secondary small mt-4 mb-0">
          아직 계정이 없으신가요?
          <a class="text-coral fw-bold" href="/signup">회원가입</a>
        </p>
      </div>
    </section>
  </div>
</main>
<script src="/webjars/bootstrap/5.3.8/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
````

### `src/main/resources/templates/auth/signup.html`

**코드 흐름:** 회원가입 입력 폼을 만들고 `/signup`으로 제출한다.

**학습 포인트:** required 같은 브라우저 검사는 편의 기능이며 최종 검증은 `SignupService`가 담당한다.

````html
<!-- 코드 흐름: Controller가 Model과 함께 이 템플릿을 선택하면 Thymeleaf가 HTML을 만든다. -->
<!-- 동작: 폼·data 속성·DOM id가 다음 JavaScript와 HTTP/WebSocket 흐름의 시작점이 된다. -->
<!-- 읽는 순서: 화면 구조 → 서버가 넣는 th:* 값 → JavaScript가 찾는 id·class·data-* 순서로 확인한다. -->
<!-- form은 HTTP 전송의 시작점이고, data-* 속성은 서버 상태와 브라우저 스크립트를 연결한다. -->
<!doctype html>
<html lang="ko" xmlns:th="http://www.thymeleaf.org">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>회원가입 | MAFIAGAME</title>
  <link rel="stylesheet" href="/webjars/bootstrap/5.3.8/dist/css/bootstrap.min.css">
  <link rel="stylesheet" th:href="@{/css/app.css}">
</head>
<body class="auth-page bg-white">
<main class="container-fluid">
  <div class="row min-vh-100 g-0">
    <section class="col-lg-5 d-none d-lg-flex flex-column p-5 auth-art signup-art" aria-hidden="true">
      <a class="brand light d-inline-flex align-items-center gap-2" href="/rooms">
        <span class="brand-mark">M</span>
        <span>MAFIA<span class="brand-game">GAME</span></span>
      </a>
      <div class="art-copy">
        <p class="mb-0">JOIN THE GAME</p>
        <h1>당신의 추리가<br>게임을 바꿉니다.</h1>
        <span>♣</span>
      </div>
      <small class="position-absolute bottom-0 start-0 m-5 text-secondary">© 2026 MAFIAGAME</small>
    </section>

    <section class="col-lg-7 d-flex align-items-center justify-content-center p-4">
      <div class="auth-card">
        <a class="brand d-lg-none d-inline-flex align-items-center gap-2 mb-5" href="/rooms">
          <span class="brand-mark">M</span>
          <span>MAFIA<span class="brand-game">GAME</span></span>
        </a>
        <p class="eyebrow text-coral">CREATE ACCOUNT</p>
        <h1 class="h2 fw-bold mb-2">마피아 게임 시작하기</h1>
        <p class="text-secondary mb-4">몇 가지 정보만 입력하면 바로 참여할 수 있어요.</p>

        <div class="alert alert-danger py-2 small" role="alert"
             th:if="${signupError}" th:text="${signupError}">회원가입 정보를 확인해 주세요.</div>

<!-- 회원가입 POST는 AuthController를 거쳐 SignupService의 검증·저장 흐름으로 간다. -->
        <form id="signupForm" th:action="@{/signup}" method="post" class="vstack gap-3">
          <div>
            <label class="form-label fw-semibold" for="nickname">닉네임</label>
            <input class="form-control" id="nickname" type="text" name="nickname"
                   th:value="${nickname}" placeholder="게임에서 사용할 이름"
                   minlength="2" maxlength="30" autocomplete="nickname" required>
          </div>
          <div>
            <label class="form-label fw-semibold" for="signupEmail">이메일</label>
            <input class="form-control" id="signupEmail" type="email" name="email"
                   th:value="${email}" placeholder="name@example.com"
                   maxlength="255" autocomplete="email" required>
          </div>
          <div>
            <label class="form-label fw-semibold" for="signupPassword">비밀번호</label>
            <input class="form-control" id="signupPassword" type="password" name="password"
                   placeholder="8자 이상 입력하세요" minlength="8" maxlength="72"
                   autocomplete="new-password" required>
          </div>
          <div>
            <label class="form-label fw-semibold" for="passwordConfirm">비밀번호 확인</label>
<!-- 두 비밀번호 입력값은 SignupService에서 서로 같은지 비교된다. -->
            <input class="form-control" id="passwordConfirm" type="password" name="passwordConfirm"
                   placeholder="비밀번호를 한 번 더 입력하세요" minlength="8" maxlength="72"
                   autocomplete="new-password" required>
          </div>
          <div class="form-check small text-secondary">
<!-- 약관 체크 값은 서버의 agreed 인자로 전달되어 필수 동의 여부를 결정한다. -->
            <input class="form-check-input" id="agreement" type="checkbox" name="agreement"
                   value="true" th:checked="${agreed}" required>
            <label class="form-check-label" for="agreement">
              <a class="text-coral fw-semibold" href="#">이용약관</a> 및
              <a class="text-coral fw-semibold" href="#">개인정보 처리방침</a>에 동의합니다.
            </label>
          </div>
          <button class="btn btn-coral w-100 py-2 fw-bold" type="submit">회원가입</button>
        </form>

        <p class="text-center text-secondary small mt-4 mb-0">
          이미 계정이 있으신가요?
          <a class="text-coral fw-bold" href="/login">로그인</a>
        </p>
      </div>
    </section>
  </div>
</main>
<script src="/webjars/bootstrap/5.3.8/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
````

### `src/main/resources/templates/fragments/user-menu.html`

**코드 흐름:** 여러 화면에서 재사용하는 로그인 사용자 메뉴 fragment다.

**학습 포인트:** Thymeleaf 인증 상태에 따라 프로필·로그아웃 또는 로그인 링크가 달라지는 흐름을 본다.

````html
<!-- 코드 흐름: Controller가 Model과 함께 이 템플릿을 선택하면 Thymeleaf가 HTML을 만든다. -->
<!-- 동작: 폼·data 속성·DOM id가 다음 JavaScript와 HTTP/WebSocket 흐름의 시작점이 된다. -->
<!-- 읽는 순서: 화면 구조 → 서버가 넣는 th:* 값 → JavaScript가 찾는 id·class·data-* 순서로 확인한다. -->
<!-- form은 HTTP 전송의 시작점이고, data-* 속성은 서버 상태와 브라우저 스크립트를 연결한다. -->
<!doctype html>
<html lang="ko" xmlns:th="http://www.thymeleaf.org" xmlns:sec="http://www.thymeleaf.org/extras/spring-security">
<body>
<th:block th:fragment="userMenu">
<!-- 비로그인 분기: 로그인·회원가입 메뉴만 보여준다. -->
  <div sec:authorize="isAnonymous()" class="dropdown user-menu">
    <button class="user-menu-toggle btn btn-sm dropdown-toggle d-flex align-items-center gap-2 px-2 py-1"
            type="button" data-bs-toggle="dropdown" aria-expanded="false" aria-label="게스트 계정 메뉴">
      <span class="user-avatar-sm">G</span>
      <span class="d-none d-sm-block text-start">
        <span class="d-block user-menu-name">게스트 계정</span>
        <span class="d-block user-menu-level">GUEST</span>
      </span>
    </button>
    <ul class="dropdown-menu dropdown-menu-end user-menu-dropdown p-2">
      <li class="px-3 py-2">
        <span class="d-block text-secondary small">GUEST ACCOUNT</span>
        <strong class="d-block mt-1">게스트 계정</strong>
        <span class="user-menu-level">로그인이 필요합니다</span>
      </li>
      <li><hr class="dropdown-divider my-2"></li>
      <li>
        <a class="dropdown-item user-menu-item" th:href="@{/login}">
          <span class="user-menu-icon" aria-hidden="true">↪</span>로그인
        </a>
      </li>
      <li>
        <a class="dropdown-item user-menu-item" th:href="@{/signup}">
          <span class="user-menu-icon" aria-hidden="true">＋</span>회원가입
        </a>
      </li>
    </ul>
  </div>

<!-- 로그인 분기: Principal의 nickname·level과 프로필·로그아웃 메뉴를 보여준다. -->
  <div sec:authorize="isAuthenticated()" class="dropdown user-menu">
    <button class="user-menu-toggle btn btn-sm dropdown-toggle d-flex align-items-center gap-2 px-2 py-1"
            type="button" data-bs-toggle="dropdown" aria-expanded="false" aria-label="사용자 메뉴">
      <span class="user-avatar-sm" th:text="${#strings.substring(#authentication.principal.nickname, 0, 1)}">U</span>
      <span class="d-none d-sm-block text-start">
        <span class="d-block user-menu-name" sec:authentication="principal.nickname">사용자</span>
        <span class="d-block user-menu-level">Lv. <span sec:authentication="principal.level">1</span></span>
      </span>
    </button>
    <ul class="dropdown-menu dropdown-menu-end user-menu-dropdown p-2">
      <li class="px-3 py-2">
        <span class="d-block text-secondary small">PLAYER ACCOUNT</span>
        <strong class="d-block mt-1" sec:authentication="principal.nickname">사용자</strong>
        <span class="user-menu-level">Lv. <span sec:authentication="principal.level">1</span></span>
      </li>
      <li><hr class="dropdown-divider my-2"></li>
      <li>
        <a class="dropdown-item user-menu-item" th:href="@{/users/{userId}(userId=${#authentication.principal.userId})}">
          <span class="user-menu-icon" aria-hidden="true">◎</span>마이페이지
        </a>
      </li>
      <li>
<!-- 로그아웃도 POST와 CSRF hidden input을 사용한다. -->
        <form th:action="@{/logout}" method="post" class="m-0">
          <input type="hidden" th:name="${_csrf.parameterName}" th:value="${_csrf.token}">
          <button class="dropdown-item user-menu-item user-menu-logout" type="submit">
            <span class="user-menu-icon" aria-hidden="true">↪</span>로그아웃
          </button>
        </form>
      </li>
    </ul>
  </div>
</th:block>
</body>
</html>
````

### `src/main/resources/templates/rooms/list.html`

**코드 흐름:** 서버가 전달한 방 목록을 카드로 렌더링한다.

**학습 포인트:** 초기 화면 뒤 `room-list.js`가 실시간 인원으로 카드 숫자를 갱신한다.

````html
<!-- 코드 흐름: Controller가 Model과 함께 이 템플릿을 선택하면 Thymeleaf가 HTML을 만든다. -->
<!-- 동작: 폼·data 속성·DOM id가 다음 JavaScript와 HTTP/WebSocket 흐름의 시작점이 된다. -->
<!-- 읽는 순서: 화면 구조 → 서버가 넣는 th:* 값 → JavaScript가 찾는 id·class·data-* 순서로 확인한다. -->
<!-- form은 HTTP 전송의 시작점이고, data-* 속성은 서버 상태와 브라우저 스크립트를 연결한다. -->
<!doctype html>
<html lang="ko" xmlns:th="http://www.thymeleaf.org" xmlns:sec="http://www.thymeleaf.org/extras/spring-security">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>마피아 게임 | 게임 로비</title>
  <link rel="stylesheet" href="/webjars/bootstrap/5.3.8/dist/css/bootstrap.min.css">
  <link rel="stylesheet" th:href="@{/css/app.css}">
</head>
<body>
<main class="container-xl py-3 py-lg-4">
  <header>
    <nav class="navbar py-2" aria-label="주 메뉴">
      <a class="navbar-brand brand d-inline-flex align-items-center gap-2" href="/rooms" aria-label="마피아 게임 로비 홈">
        <span class="brand-mark">M</span>
        <span>MAFIA<span class="brand-game">GAME</span></span>
      </a>
      <div class="navbar-actions d-flex align-items-center gap-3 ms-auto">
        <span class="online-status d-flex align-items-center gap-1 small text-secondary" aria-label="현재 접속인원">
          <span class="online-status-dot" aria-hidden="true">●</span>
          <span class="online-status-prefix">현재 </span>
<!-- Controller의 초기 값은 HTML에 들어오고, room-list.js가 WebSocket 값으로 갱신한다. -->
          <strong class="text-dark" id="onlinePlayerCount" th:text="${onlinePlayerCount}">0</strong>
          <span class="online-status-suffix">명 접속 중</span>
        </span>
        <th:block th:replace="~{fragments/user-menu :: userMenu}"></th:block>
      </div>
    </nav>
  </header>

  <section class="app-hero bg-mafia rounded-4 p-4 p-lg-5 text-white d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-4">
    <div>
      <p class="eyebrow">GAME LOBBY</p>
      <h1 class="display-6 fw-bold mb-2">누구를 믿을 것인가.</h1>
      <p class="text-white-50 mb-0">방에 입장해 시민과 마피아의 치열한 심리전을 시작하세요.</p>
    </div>
    <a class="btn btn-coral fw-bold align-self-start align-self-md-center" id="createRoom" href="/rooms/new">
      <span class="fs-5 me-1">＋</span> 새 게임 만들기
    </a>
  </section>

  <section class="card border-0 shadow-sm rounded-4 mt-4 overflow-hidden" aria-labelledby="room-title">
    <div class="card-body p-4 pb-3">
      <div class="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
        <div>
          <h2 id="room-title" class="h5 mb-1">진행 중인 게임</h2>
          <p class="text-secondary small mb-0"><strong class="text-coral" id="roomCount" th:text="${#lists.size(rooms)}">6</strong>개의 방을 찾았어요</p>
        </div>
        <div class="d-flex gap-2">
          <div class="input-group input-group-sm">
            <span class="input-group-text bg-white">⌕</span>
<!-- 검색·상태 필터는 현재 카드 DOM을 숨기거나 보여주는 화면 보조 흐름이다. -->
            <input class="form-control" id="roomSearch" type="search" placeholder="방 제목 검색" aria-label="방 제목 검색">
          </div>
          <select class="form-select form-select-sm" id="roomFilter" aria-label="방 상태 필터">
            <option value="all">모든 게임</option>
            <option value="WAITING">대기 중</option>
            <option value="PLAYING">게임 중</option>
          </select>
        </div>
      </div>
    </div>

    <div class="list-group list-group-flush px-4" id="roomList">
      <!-- rooms 목록을 방 카드로 반복 렌더링하며 각 카드의 data-room-id가 실시간 이벤트 키가 된다. -->
      <article class="room-card list-group-item d-flex align-items-center gap-3 px-0 py-3"
               th:each="room, roomStat : ${rooms}"
               th:data-room-id="${room.roomId}" th:data-status="${room.status}" th:data-title="${room.title}">
        <div class="room-number" th:text="${'0' + (roomStat.index + 1)}">01</div>
        <div class="room-main flex-grow-1">
          <div class="d-flex align-items-center gap-2">
            <span class="lock" th:if="${room.locked}">▣</span>
            <h3 class="room-title h6 mb-0" th:text="${room.title}">달빛 아래의 마피아</h3>
            <span class="badge rounded-pill bg-success-subtle text-success-emphasis"
                  th:classappend="${room.status == 'PLAYING'} ? ' bg-secondary-subtle text-secondary-emphasis' : ''"
                  th:text="${room.status == 'PLAYING'} ? '게임 중' : '대기 중'">대기 중</span>
          </div>
          <p class="text-secondary small mb-0 mt-1"><span th:text="${room.hostName}">방장</span>님의 게임</p>
        </div>
        <div class="players text-secondary small text-nowrap">
          <span>♟</span> <strong class="text-dark" data-room-player-count th:text="${room.currentPlayers}">6</strong>
          <em class="fst-normal text-body-tertiary">/</em> <span th:text="${room.maxPlayers}">8</span>
        </div>
        <a class="join btn btn-sm btn-outline-secondary" th:href="@{/rooms/{id}(id=${room.roomId})}"
           th:text="${room.status == 'PLAYING'} ? '관전하기' : '입장하기'">입장하기</a>
      </article>
    </div>
    <p class="empty text-center text-secondary py-4 mb-0" id="emptyState"
       th:hidden="${!#lists.isEmpty(rooms)}">조건에 맞는 게임이 없습니다.</p>
  </section>
</main>

<div class="toast position-fixed bottom-0 start-50 translate-middle-x mb-4 text-bg-dark border-0" id="toast"
     role="status" aria-live="polite" aria-atomic="true"></div>

<script src="/webjars/bootstrap/5.3.8/dist/js/bootstrap.bundle.min.js"></script>
<script th:src="@{/js/stomp-client.js}"></script>
<script>
  const search = document.querySelector('#roomSearch');
  const filter = document.querySelector('#roomFilter');
  let cards = [...document.querySelectorAll('.room-card')];
  const empty = document.querySelector('#emptyState');
  const roomCount = document.querySelector('#roomCount');
  function updateRooms() {
    const query = search.value.trim().toLowerCase();
    let visible = 0;
    cards.forEach(card => {
      const show = (filter.value === 'all' || card.dataset.status === filter.value)
        && card.dataset.title.toLowerCase().includes(query);
      card.hidden = !show;
      if (show) visible++;
    });
    empty.hidden = visible !== 0;
  }
  search.addEventListener('input', updateRooms);
  filter.addEventListener('change', updateRooms);
  document.addEventListener('room:removed', event => {
    const roomId = Number(event.detail?.roomId);
    cards = cards.filter(card => Number(card.dataset.roomId) !== roomId);
    roomCount.textContent = cards.length;
    updateRooms();
  });
  const toast = document.querySelector('#toast');
  document.querySelectorAll('.join').forEach(button => button.addEventListener('click', () => {
    toast.textContent = '게임 입장을 준비하고 있어요.';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2200);
  }));
</script>
<!-- 공통 STOMP client를 먼저 로드한 뒤 로비 전용 room-list.js를 실행한다. -->
<script th:src="@{/js/room-list.js}"></script>
</body>
</html>
````

### `src/main/resources/templates/rooms/create.html`

**코드 흐름:** 방 제목·정원·비밀번호를 입력해 방 생성 POST를 보낸다.

**학습 포인트:** password 타입과 자동완성 제어는 입력 UX이고, 정원·비밀번호 규칙은 Service가 최종 판단한다.

````html
<!-- 코드 흐름: Controller가 Model과 함께 이 템플릿을 선택하면 Thymeleaf가 HTML을 만든다. -->
<!-- 동작: 폼·data 속성·DOM id가 다음 JavaScript와 HTTP/WebSocket 흐름의 시작점이 된다. -->
<!-- 읽는 순서: 화면 구조 → 서버가 넣는 th:* 값 → JavaScript가 찾는 id·class·data-* 순서로 확인한다. -->
<!-- form은 HTTP 전송의 시작점이고, data-* 속성은 서버 상태와 브라우저 스크립트를 연결한다. -->
<!doctype html>
<html lang="ko" xmlns:th="http://www.thymeleaf.org" xmlns:sec="http://www.thymeleaf.org/extras/spring-security">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>새 방 만들기 | MAFIAGAME</title>
  <link rel="stylesheet" href="/webjars/bootstrap/5.3.8/dist/css/bootstrap.min.css">
  <link rel="stylesheet" th:href="@{/css/app.css}">
</head>
<body>
<main class="container-xl py-3 py-lg-4">
  <header>
    <nav class="navbar py-2" aria-label="주 메뉴">
      <a class="navbar-brand brand d-inline-flex align-items-center gap-2" href="/rooms" aria-label="마피아 게임 로비 홈">
        <span class="brand-mark">M</span>
        <span>MAFIA<span class="brand-game">GAME</span></span>
      </a>
      <div class="navbar-actions d-flex align-items-center gap-3 ms-auto">
        <th:block th:replace="~{fragments/user-menu :: userMenu}"></th:block>
      </div>
    </nav>
  </header>

  <a class="btn btn-link text-secondary ps-0 mb-3" href="/rooms">← 게임 목록으로</a>

  <section class="row align-items-center g-4 mb-5">
    <div class="col-lg-5">
      <p class="eyebrow text-coral">CREATE ROOM</p>
      <h1 class="display-6 fw-bold mb-3">새로운 게임방을<br>만들어 보세요.</h1>
      <p class="text-secondary lh-lg mb-0">방을 만든 뒤 친구를 초대하고, 모두 준비되면 게임을 시작할 수 있어요.</p>
    </div>

    <div class="col-lg-7">
<!-- POST /rooms가 RoomController.createRoom으로 이어져 입력 검증과 방 저장을 시작한다. -->
      <form class="card border-0 shadow-sm rounded-4 p-4 p-lg-5" th:action="@{/rooms}" method="post"
            autocomplete="off">
        <input type="hidden" th:name="${_csrf.parameterName}" th:value="${_csrf.token}">
        <div class="alert alert-danger py-2 small" role="alert"
             th:if="${roomError}" th:text="${roomError}">입력값을 확인해 주세요.</div>

        <div class="mb-4">
          <input type="text" style="display:none" aria-hidden="true">
          <input type="password" style="display:none" aria-hidden="true">
          <label class="form-label fw-semibold" for="title">방 제목</label>
          <input class="form-control" id="title" type="text" name="title" th:value="${title}"
                 placeholder="예: 초보 환영 달빛 마피아" minlength="2" maxlength="100" required autofocus autocomplete="off">
        </div>

        <fieldset class="mb-4">
          <legend class="fs-6 fw-semibold mb-2">최대 인원</legend>
          <div class="btn-group w-100" role="group" aria-label="최대 인원 선택">
            <th:block th:each="capacity : ${#numbers.sequence(4, 8)}">
              <input class="btn-check" type="radio" name="maxPlayers"
                     th:id="${'capacity-' + capacity}" th:value="${capacity}"
                     th:checked="${maxPlayers == capacity}" autocomplete="off" required>
              <label class="btn btn-outline-secondary" th:for="${'capacity-' + capacity}"
                     th:text="${capacity + '명'}">8명</label>
            </th:block>
          </div>
          <div class="form-text">마피아 게임은 4~8명으로 진행할 수 있어요.</div>
        </fieldset>

        <div class="form-check mb-3">
<!-- 체크 상태가 passwordField 표시 여부와 hasPassword 모델 값에 영향을 준다. -->
          <input class="form-check-input" id="privateRoom" type="checkbox" th:checked="${hasPassword}">
          <label class="form-check-label" for="privateRoom">비밀번호로 방 보호하기</label>
        </div>

        <div id="passwordField" class="password-field mb-4" th:classappend="${hasPassword} ? '' : ' d-none'">
          <label class="form-label fw-semibold" for="password">방 비밀번호</label>
<!-- 비밀번호 input은 password 타입을 사용하되 autocomplete를 막아 브라우저 자동완성을 피한다. -->
          <input class="form-control" id="password" type="password" name="password"
                 minlength="4" maxlength="20" placeholder="4~20자" autocomplete="new-password"
                 th:disabled="${!hasPassword}">
        </div>

        <button class="btn btn-coral w-100 py-2 fw-bold" type="submit">방 만들기</button>
        <a class="btn btn-link text-secondary w-100 mt-2" href="/rooms">취소</a>
      </form>
    </div>
  </section>
</main>

<script src="/webjars/bootstrap/5.3.8/dist/js/bootstrap.bundle.min.js"></script>
<!-- 아래 스크립트는 공개/잠금 선택에 따라 passwordField를 즉시 토글한다. -->
<script>
  const privateRoom = document.querySelector('#privateRoom');
  const passwordField = document.querySelector('#passwordField');
  const password = document.querySelector('#password');
  function updatePasswordField() {
    const enabled = privateRoom.checked;
    passwordField.classList.toggle('d-none', !enabled);
    password.disabled = !enabled;
    password.required = enabled;
    if (!enabled) password.value = '';
  }
  privateRoom.addEventListener('change', updatePasswordField);
  updatePasswordField();
</script>
</body>
</html>
````

### `src/main/resources/templates/rooms/access.html`

**코드 흐름:** 잠금 방 비밀번호를 입력받아 `/rooms/{roomId}/access`로 제출한다.

**학습 포인트:** 성공 후 세션에 접근 표시가 저장되고 WebSocket 입장 검사로 이어진다.

````html
<!-- 코드 흐름: Controller가 Model과 함께 이 템플릿을 선택하면 Thymeleaf가 HTML을 만든다. -->
<!-- 동작: 폼·data 속성·DOM id가 다음 JavaScript와 HTTP/WebSocket 흐름의 시작점이 된다. -->
<!-- 읽는 순서: 화면 구조 → 서버가 넣는 th:* 값 → JavaScript가 찾는 id·class·data-* 순서로 확인한다. -->
<!-- form은 HTTP 전송의 시작점이고, data-* 속성은 서버 상태와 브라우저 스크립트를 연결한다. -->
<!doctype html>
<html lang="ko" xmlns:th="http://www.thymeleaf.org">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>잠금 방 입장 | MAFIAGAME</title>
  <link rel="stylesheet" href="/webjars/bootstrap/5.3.8/dist/css/bootstrap.min.css">
  <link rel="stylesheet" th:href="@{/css/app.css}">
</head>
<body class="bg-light">
<main class="container py-5">
  <section class="card border-0 shadow-sm rounded-4 p-4 p-lg-5 mx-auto" style="max-width: 32rem">
    <p class="eyebrow text-coral mb-2">LOCKED ROOM</p>
    <h1 class="h3 fw-bold" th:text="${room.title}">잠금 게임방</h1>
    <p class="text-secondary mb-4">이 게임방에 입장하려면 비밀번호를 입력해 주세요.</p>

<!-- 입력한 방 비밀번호를 POST /rooms/{roomId}/access로 보내 세션 접근 권한을 요청한다. -->
    <form th:action="@{/rooms/{roomId}/access(roomId=${room.roomId})}" method="post">
      <input type="hidden" th:name="${_csrf.parameterName}" th:value="${_csrf.token}">
      <div class="alert alert-danger py-2 small" role="alert"
           th:if="${accessError}" th:text="${accessError}">비밀번호를 확인해 주세요.</div>
      <label class="form-label fw-semibold" for="roomPassword">방 비밀번호</label>
<!-- 서버의 verifyRoomPassword가 이 값과 저장된 BCrypt hash를 비교한다. -->
      <input class="form-control" id="roomPassword" type="password" name="password"
             minlength="4" maxlength="20" autocomplete="current-password" required autofocus>
      <button class="btn btn-coral w-100 py-2 fw-bold mt-4" type="submit">입장하기</button>
      <a class="btn btn-link text-secondary w-100 mt-2" href="/rooms">게임 목록으로</a>
    </form>
  </section>
</main>
</body>
</html>
````

### `src/main/resources/templates/rooms/detail.html`

**코드 흐름:** 대기방 HTML과 함께 roomId·사용자·정원 data 속성을 JavaScript에 전달한다.

**학습 포인트:** 로드 후 `chat.js`가 이 값을 사용해 연결·입장·상태 표시를 시작한다.

````html
<!-- 코드 흐름: Controller가 Model과 함께 이 템플릿을 선택하면 Thymeleaf가 HTML을 만든다. -->
<!-- 동작: 폼·data 속성·DOM id가 다음 JavaScript와 HTTP/WebSocket 흐름의 시작점이 된다. -->
<!-- 읽는 순서: 화면 구조 → 서버가 넣는 th:* 값 → JavaScript가 찾는 id·class·data-* 순서로 확인한다. -->
<!-- form은 HTTP 전송의 시작점이고, data-* 속성은 서버 상태와 브라우저 스크립트를 연결한다. -->
<!doctype html>
<html lang="ko" xmlns:th="http://www.thymeleaf.org" xmlns:sec="http://www.thymeleaf.org/extras/spring-security">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>게임방 | MAFIAGAME</title>
  <link rel="stylesheet" href="/webjars/bootstrap/5.3.8/dist/css/bootstrap.min.css">
  <link rel="stylesheet" th:href="@{/css/app.css}">
</head>
<!-- data-room-id·data-nickname·data-user-id·data-capacity가 chat.js 초기 상태가 된다. -->
<body class="bg-light" th:attr="data-room-id=${roomId},data-nickname=${nickname},data-user-id=${userId},data-capacity=${room.capacity}">
<main class="container-xl py-3 py-lg-4">
  <header>
    <nav class="navbar py-2" aria-label="주 메뉴">
      <a class="navbar-brand brand d-inline-flex align-items-center gap-2" href="/rooms">
        <span class="brand-mark">M</span>
        <span>MAFIA<span class="brand-game">GAME</span></span>
      </a>
      <div class="navbar-actions d-flex align-items-center gap-3 ms-auto">
        <th:block th:replace="~{fragments/user-menu :: userMenu}"></th:block>
      </div>
    </nav>
  </header>

  <a class="btn btn-link text-secondary ps-0 mb-3" href="/rooms">← 게임 목록으로</a>

  <section class="app-room-header rounded-4 p-4 p-lg-5 d-flex align-items-center justify-content-between gap-4">
    <div>
      <p class="eyebrow mb-2">ROOM <span th:text="${roomId}">01</span></p>
      <div class="d-flex flex-wrap align-items-center gap-2">
        <span class="lock" th:if="${room.locked}">▣</span>
        <h1 class="h3 fw-bold mb-0" th:text="${room.title}">달빛 아래의 마피아</h1>
        <span class="badge rounded-pill bg-success-subtle text-success-emphasis"
              th:classappend="${room.status == 'PLAYING'} ? ' bg-secondary-subtle text-secondary-emphasis' : ''"
              th:text="${room.status == 'PLAYING'} ? '게임 중' : '대기 중'">대기 중</span>
      </div>
      <p class="text-white-50 mb-0 mt-2" th:text="${room.description}">초보 환영 · 빠른 진행</p>
    </div>
    <div class="text-end text-white-50 d-none d-sm-block">
      <div class="fs-4"><b id="roomPlayerCount" class="text-white" th:text="${room.players}">6</b> / <em class="fst-normal" th:text="${room.capacity}">8</em></div>
      <small>참가 중</small>
    </div>
  </section>

  <section class="row g-4 my-4">
    <section class="col-lg-8" aria-labelledby="players-title">
      <div class="card border-0 shadow-sm rounded-4 h-100">
        <div class="card-body p-4">
          <div class="d-flex align-items-center justify-content-between">
            <div>
              <p class="eyebrow text-coral mb-1">PLAYERS</p>
              <h2 id="players-title" class="h5 mb-0">참가자 <span id="roomMemberCount" class="text-coral" th:text="${room.players}">6</span>명</h2>
            </div>
            <button class="btn btn-sm btn-outline-secondary" id="invite" type="button">친구 초대</button>
          </div>

<!-- presence frame이 올 때 chat.js가 참가자 카드와 빈 자리를 이 영역에 다시 그린다. -->
          <div class="row row-cols-2 row-cols-md-4 g-3 my-3" id="memberGrid">
            <th:block th:if="${livePresence != null}">
              <article class="col member" th:each="participant : ${livePresence.participants}"
                       th:classappend="${participant.host} ? ' host' : ''">
                <div class="avatar" th:classappend="${participant.host} ? ' a1' : ''"
                     th:text="${#strings.substring(participant.nickname, 0, 1)}">민</div>
                <b th:text="${participant.nickname}">민수</b>
                <small th:text="${participant.host ? '방장' : (participant.ready ? '준비 완료' : '대기 중')}">방장</small>
              </article>
            </th:block>
            <th:block th:unless="${livePresence != null}">
              <article class="col member" th:each="member, stat : ${members}"
                       th:classappend="${stat.index == 0} ? ' host' : ''">
                <div class="avatar" th:classappend="${stat.index == 0} ? ' a1' : ''"
                     th:text="${#strings.substring(member, 0, 1)}">민</div>
                <b th:text="${member}">민수</b>
                <small th:if="${stat.index == 0}">방장</small>
              </article>
            </th:block>
            <article class="col member empty-seat" th:if="${room.players < room.capacity}"
                     th:each="slot : ${#numbers.sequence(room.players + 1, room.capacity)}">
              <div class="avatar">+</div><b>빈 자리</b>
            </article>
          </div>

          <div class="alert alert-light border small mb-3">
            <strong>기본 설정</strong>
            <span class="text-secondary ms-2">마피아 2명 · 경찰 1명 · 의사 1명 · 낮 90초 / 밤 45초</span>
          </div>
<!-- 클릭 시 /ready STOMP 요청을 보내 현재 사용자의 준비 상태를 바꾼다. -->
          <button class="ready btn btn-coral w-100 py-2 fw-bold" id="ready" type="button">준비 완료</button>
          <p class="ready-note text-center text-secondary small mt-2 mb-0">모든 참가자가 준비되면 게임이 시작됩니다.</p>
        </div>
      </div>
    </section>

    <aside class="col-lg-4" aria-label="대기방 채팅">
      <div class="chat-panel card border-0 shadow-sm rounded-4 h-100 overflow-hidden">
        <div class="card-header bg-white d-flex align-items-center gap-2 py-3">
          <i id="chatStatusDot"></i>
          <b>대기방 채팅</b>
          <small class="text-secondary ms-auto" id="chatConnectionStatus">연결 중</small>
        </div>
        <div class="messages card-body p-3" id="messages" aria-live="polite">
          <p class="notice alert alert-light text-center small" id="chatNotice">채팅 서버에 연결 중입니다.</p>
        </div>
<!-- submit 이벤트는 새로고침 없이 /chat destination으로 메시지를 보낸다. -->
        <form class="chat-input card-footer bg-white border-top p-3" id="chatForm">
          <div class="input-group input-group-sm">
            <input class="form-control" name="content" maxlength="300" placeholder="메시지 입력"
                   aria-label="채팅 메시지" autocomplete="off">
            <button class="btn btn-coral" type="submit" aria-label="메시지 보내기">➤</button>
          </div>
        </form>
      </div>
    </aside>
  </section>
</main>

<div class="toast position-fixed bottom-0 start-50 translate-middle-x mb-4 text-bg-dark border-0" id="toast"
     role="status" aria-live="polite" aria-atomic="true"></div>

<script src="/webjars/bootstrap/5.3.8/dist/js/bootstrap.bundle.min.js"></script>
<script th:src="@{/js/stomp-client.js}"></script>
<script>
  const toast = document.querySelector('#toast');
  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2200);
  }
  document.querySelector('#invite').addEventListener('click', () => showToast('초대 링크를 준비하고 있어요.'));
</script>
<!-- STOMP 공통 client 다음에 방 전용 chat.js를 로드해야 window.MafiaStomp를 사용할 수 있다. -->
<script th:src="@{/js/chat.js}"></script>
</body>
</html>
````

### `src/main/resources/templates/users/detail.html`

**코드 흐름:** Model의 `UserProfile`을 닉네임·소개·통계·기록으로 출력한다.

**학습 포인트:** 템플릿은 표시만 하고 조회·계산은 Service와 DTO가 담당한다.

````html
<!-- 코드 흐름: Controller가 Model과 함께 이 템플릿을 선택하면 Thymeleaf가 HTML을 만든다. -->
<!-- 동작: 폼·data 속성·DOM id가 다음 JavaScript와 HTTP/WebSocket 흐름의 시작점이 된다. -->
<!-- 읽는 순서: 화면 구조 → 서버가 넣는 th:* 값 → JavaScript가 찾는 id·class·data-* 순서로 확인한다. -->
<!-- form은 HTTP 전송의 시작점이고, data-* 속성은 서버 상태와 브라우저 스크립트를 연결한다. -->
<!doctype html>
<html lang="ko" xmlns:th="http://www.thymeleaf.org" xmlns:sec="http://www.thymeleaf.org/extras/spring-security">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title th:text="${user.nickname} + ' | MAFIAGAME'">유저 프로필 | MAFIAGAME</title>
  <link rel="stylesheet" href="/webjars/bootstrap/5.3.8/dist/css/bootstrap.min.css">
  <link rel="stylesheet" th:href="@{/css/app.css}">
</head>
<body>
<main class="container-xl py-3 py-lg-4">
  <header>
    <nav class="navbar py-2" aria-label="주 메뉴">
      <a class="navbar-brand brand d-inline-flex align-items-center gap-2" href="/rooms">
        <span class="brand-mark">M</span>
        <span>MAFIA<span class="brand-game">GAME</span></span>
      </a>
      <div class="navbar-actions d-flex align-items-center gap-3 ms-auto">
        <div class="d-flex align-items-center gap-3">
          <a class="text-secondary small" href="/rooms">게임 로비</a>
          <th:block th:replace="~{fragments/user-menu :: userMenu}"></th:block>
        </div>
      </div>
    </nav>
  </header>

  <a class="btn btn-link text-secondary ps-0 mb-3" href="/rooms">← 게임 로비로</a>

  <!-- UserController가 만든 UserProfile 값이 프로필 상단에 표시된다. -->
  <section class="app-profile-hero rounded-4 p-4 p-lg-5 d-flex flex-column flex-md-row align-items-md-center gap-4">
    <div class="avatar-large" th:text="${#strings.substring(user.nickname, 0, 1)}">유</div>
    <div class="flex-grow-1">
      <p class="eyebrow">PLAYER PROFILE</p>
      <div class="d-flex flex-wrap align-items-center gap-2">
        <h1 class="h2 fw-bold mb-0" th:text="${user.nickname}">유진</h1>
        <span class="online-badge badge rounded-pill"><i></i> 온라인</span>
      </div>
      <p class="text-white-50 mb-1 mt-2" th:text="${user.bio}">마을을 지키는 밤의 추리꾼</p>
      <small class="text-white-50" th:text="${user.joinedAt} + '부터 함께했어요'">2026년 9월 가입부터 함께했어요</small>
    </div>
    <button class="friend-button btn btn-outline-light" type="button" id="friendButton">＋ 친구 추가</button>
  </section>

  <section class="row g-3 my-4" aria-label="게임 통계">
    <article class="col-md-4">
      <div class="card border-0 shadow-sm rounded-4 h-100">
        <div class="card-body d-flex align-items-center gap-3 p-4">
          <span class="stat-icon coral">♠</span>
          <div><small class="d-block text-secondary">플레이한 게임</small><strong class="fs-4" th:text="${user.totalGames}">0</strong><em class="text-secondary small ms-1">판</em></div>
        </div>
      </div>
    </article>
    <article class="col-md-4">
      <div class="card border-0 shadow-sm rounded-4 h-100">
        <div class="card-body d-flex align-items-center gap-3 p-4">
          <span class="stat-icon mint">★</span>
          <div><small class="d-block text-secondary">전체 승률</small><strong class="fs-4" th:text="${user.winRate()} + '%'">0%</strong><em class="text-secondary small ms-1" th:text="${user.wins} + '승'">0승</em></div>
        </div>
      </div>
    </article>
    <article class="col-md-4">
      <div class="card border-0 shadow-sm rounded-4 h-100">
        <div class="card-body d-flex align-items-center gap-3 p-4">
          <span class="stat-icon purple">♟</span>
          <div><small class="d-block text-secondary">마피아 승률</small><strong class="fs-4" th:text="${user.mafiaGames == null ? '집계 준비 중' : user.mafiaWinRate() + '%'}">집계 준비 중</strong><em class="text-secondary small ms-1" th:text="${user.mafiaGames == null ? '게임 이력 없음' : user.mafiaWins + '승 / ' + user.mafiaGames + '판'}">게임 이력 없음</em></div>
        </div>
      </div>
    </article>
  </section>

  <section class="row g-4 mb-5">
    <div class="col-lg-8">
      <div class="card border-0 shadow-sm rounded-4 h-100">
        <div class="card-body p-4">
          <div class="d-flex align-items-center justify-content-between">
            <div><p class="eyebrow text-coral mb-1">GAME HISTORY</p><h2 class="h5 mb-0">최근 게임</h2></div>
            <a class="small text-secondary" href="#">전체 전적 보기 →</a>
          </div>
          <div class="game-list list-group list-group-flush mt-3">
            <p class="empty-history text-center text-secondary py-4 mb-0" th:if="${#lists.isEmpty(user.recentGames)}">아직 저장된 게임 기록이 없습니다.</p>
            <!-- 최근 게임 기록이 있으면 각 GameRecord를 반복해 행으로 보여준다. -->
            <article class="game-row list-group-item d-flex align-items-center gap-3 px-0 py-3" th:each="game : ${user.recentGames}">
              <span class="result-dot flex-shrink-0" th:classappend="${game.result == '승리'} ? ' win' : ' loss'"></span>
              <div class="game-info flex-grow-1">
                <h3 class="h6 mb-1" th:text="${game.roomTitle}">달빛 아래의 마피아</h3>
                <p class="text-secondary small mb-0"><span th:text="${game.role}">시민</span> · <span th:text="${game.status}">생존</span></p>
              </div>
              <strong class="px-2 py-1 rounded-2 small" th:classappend="${game.result == '승리'} ? ' win-text' : ' loss-text'" th:text="${game.result}">승리</strong>
              <time class="text-secondary small text-nowrap" th:text="${game.playedAt}">12분 전</time>
            </article>
          </div>
        </div>
      </div>
    </div>

    <aside class="col-lg-4">
      <div class="card border-0 shadow-sm rounded-4 h-100">
        <div class="card-body p-4">
          <p class="eyebrow text-coral mb-1">ACHIEVEMENTS</p>
          <h2 class="h5 mb-0">획득한 배지</h2>
          <div class="list-group list-group-flush gap-2 mt-3">
            <article class="list-group-item d-flex align-items-center gap-3 rounded-3 bg-light border-0 p-2">
              <span class="badge rounded-3 fs-5 p-2 bg-warning-subtle text-warning-emphasis">★</span>
              <span><b class="d-block small">첫 승리</b><small class="text-secondary">첫 게임 승리</small></span>
            </article>
            <article class="list-group-item d-flex align-items-center gap-3 rounded-3 bg-light border-0 p-2">
              <span class="badge rounded-3 fs-5 p-2 bg-warning-subtle text-warning-emphasis">♠</span>
              <span><b class="d-block small">밤의 지배자</b><small class="text-secondary">마피아 10회 승리</small></span>
            </article>
            <article class="list-group-item d-flex align-items-center gap-3 rounded-3 bg-light border-0 p-2 opacity-50">
              <span class="badge rounded-3 fs-5 p-2 bg-secondary-subtle text-secondary">?</span>
              <span><b class="d-block small">완벽한 추리</b><small class="text-secondary">경찰 5회 승리</small></span>
            </article>
          </div>
        </div>
      </div>
    </aside>
  </section>
</main>

<div class="toast position-fixed bottom-0 start-50 translate-middle-x mb-4 text-bg-dark border-0" id="toast"
     role="status" aria-live="polite" aria-atomic="true"></div>

<script src="/webjars/bootstrap/5.3.8/dist/js/bootstrap.bundle.min.js"></script>
<script>
  const friendButton = document.querySelector('#friendButton');
  const toast = document.querySelector('#toast');
  friendButton.addEventListener('click', () => {
    friendButton.classList.toggle('added');
    friendButton.textContent = friendButton.classList.contains('added') ? '✓ 친구 요청됨' : '＋ 친구 추가';
    toast.textContent = friendButton.classList.contains('added') ? '친구 요청을 보냈습니다.' : '친구 요청을 취소했습니다.';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2200);
  });
</script>
</body>
</html>
````

### `src/main/resources/static/js/stomp-client.js`

**코드 흐름:** 브라우저 WebSocket 위에서 STOMP frame 생성·파싱·구독·SEND·재접속을 공통 처리한다.

**학습 포인트:** 화면별 JavaScript가 저수준 WebSocket 코드를 반복하지 않고 이 모듈을 재사용하는 구조다.

````javascript
// 코드 흐름: WebSocket 연결에서 STOMP frame을 만들고 받은 frame을 파싱한다.
// 동작: 연결 종료 시 재접속하고 화면 코드는 이 공통 클라이언트의 connect·subscribe·send를 호출한다.
// 읽는 순서: 초기 상태를 만들고, 함수와 이벤트 핸들러가 서버·DOM 상태를 바꾸는 흐름을 따라간다.
// 서버에서 받은 데이터는 handleFrame, 사용자가 보낸 데이터는 createFrame과 send 호출을 중심으로 읽는다.
(() => {
// STOMP header에서 줄바꿈·역슬래시를 이스케이프해 frame 문법을 깨지 않게 한다.
  function escapeHeader(value) {
    return String(value)
      .replaceAll('\\', '\\\\')
      .replaceAll(':', '\\c')
      .replaceAll('\n', '\\n')
      .replaceAll('\r', '\\r');
  }

// 수신한 STOMP header의 이스케이프 문자열을 원래 값으로 복원한다.
  function unescapeHeader(value) {
    return value
      .replaceAll('\\r', '\r')
      .replaceAll('\\n', '\n')
      .replaceAll('\\c', ':')
      .replaceAll('\\\\', '\\');
  }

// command·headers·body를 STOMP frame 문자열로 조립해 WebSocket으로 보낼 수 있게 한다.
  function createFrame(command, headers = {}, body = '') {
    const headerLines = Object.entries(headers)
      .map(([key, value]) => `${escapeHeader(key)}:${escapeHeader(value)}`)
      .join('\n');
    const headerBlock = headerLines ? `${headerLines}\n` : '';
    return `${command}\n${headerBlock}\n${body}\0`;
  }

// 수신한 한 frame을 command·headers·body 객체로 분리한다.
  function parseFrame(rawFrame) {
    const frame = rawFrame.replace(/^\n+/, '');
    if (!frame.trim()) {
      return null;
    }

    const separator = frame.indexOf('\n\n');
    const headerPart = separator < 0 ? frame : frame.slice(0, separator);
    const body = separator < 0 ? '' : frame.slice(separator + 2);
    const lines = headerPart.split('\n');
    const command = lines.shift()?.trim();
    const headers = {};

    lines.forEach(line => {
      const index = line.indexOf(':');
      if (index > 0) {
        headers[unescapeHeader(line.slice(0, index))] = unescapeHeader(line.slice(index + 1));
      }
    });

    return { command, headers, body };
  }

// WebSocket chunk를 버퍼에 모아 NUL 종료 frame 단위로 잘라 callback에 전달한다.
  function createFrameParser(onFrame) {
    let frameBuffer = '';

    return chunk => {
      frameBuffer += chunk;
      let endIndex = frameBuffer.indexOf('\0');
      while (endIndex >= 0) {
        const rawFrame = frameBuffer.slice(0, endIndex);
        frameBuffer = frameBuffer.slice(endIndex + 1);
        onFrame(parseFrame(rawFrame));
        endIndex = frameBuffer.indexOf('\0');
      }
    };
  }

// 재연결 횟수에 따른 지연 시간을 계산해 반복 접속을 완화한다.
  function getReconnectDelay(attempt) {
    const normalizedAttempt = Number.isFinite(Number(attempt))
      ? Math.max(0, Number(attempt))
      : 0;
    const exponentialDelay = Math.min(30000, 1000 * (2 ** Math.min(normalizedAttempt, 5)));
    return exponentialDelay + Math.floor(Math.random() * 250);
  }

// 서버가 알려준 heartbeat 주기에 맞춰 빈 줄을 보내 연결을 유지하고 해제 함수를 반환한다.
  function startHeartbeat(connection, connectedFrame) {
    const heartbeat = String(connectedFrame.headers['heart-beat'] || '0,0')
      .split(',')
      .map(value => Number(value));
    const serverRequestedInterval = Number.isFinite(heartbeat[1]) ? heartbeat[1] : 0;
    const interval = serverRequestedInterval > 0
      ? Math.max(10000, serverRequestedInterval)
      : 0;
    if (interval <= 0) {
      return () => {};
    }

    const heartbeatTimer = window.setInterval(() => {
      if (connection.readyState === WebSocket.OPEN) {
        connection.send('\n');
      }
    }, interval);
    return () => window.clearInterval(heartbeatTimer);
  }

// 재연결 타이머를 예약·초기화·취소하는 작은 상태 객체를 만든다.
  function createReconnectController(connect) {
    let reconnectTimer;
    let reconnectAttempts = 0;

    return {
      schedule() {
        window.clearTimeout(reconnectTimer);
        reconnectTimer = window.setTimeout(() => {
          reconnectTimer = undefined;
          connect();
        }, getReconnectDelay(reconnectAttempts++));
      },
      reset() {
        reconnectAttempts = 0;
      },
      cancel() {
        window.clearTimeout(reconnectTimer);
        reconnectTimer = undefined;
      }
    };
  }

// 외부 공개 API: 화면별 스크립트가 아래 함수만 사용하도록 공개 목록을 고정한다.
  window.MafiaStomp = Object.freeze({
    createFrame,
    createFrameParser,
    getReconnectDelay,
    startHeartbeat,
    createReconnectController
  });
})();
````

### `src/main/resources/static/js/room-list.js`

**코드 흐름:** 로비 presence topic을 구독해 방 카드 인원과 전체 접속자 수를 갱신한다.

**학습 포인트:** 0명이 된 방은 제거하고 현재 카드에 없는 방은 목록을 다시 요청하는 보정 흐름을 확인한다.

````javascript
// 코드 흐름: 로비 WebSocket으로 방별 실시간 인원 수를 받는다.
// 동작: 받은 이벤트에 따라 카드 숫자를 바꾸고 빈 방을 제거하거나 목록을 갱신한다.
// 읽는 순서: 초기 상태를 만들고, 함수와 이벤트 핸들러가 서버·DOM 상태를 바꾸는 흐름을 따라간다.
// 서버에서 받은 데이터는 handleFrame, 사용자가 보낸 데이터는 createFrame과 send 호출을 중심으로 읽는다.
(() => {
  const cards = new Map(
    [...document.querySelectorAll('.room-card')]
      .map(card => [Number(card.dataset.roomId), card])
  );

  const socketUrl = (location.protocol === 'https:' ? 'wss' : 'ws') + '://' + location.host + '/ws';
  const lobbyDestination = '/topic/rooms/presence';
  const onlinePlayerCount = document.querySelector('#onlinePlayerCount');
  const { createFrame, createFrameParser, startHeartbeat, createReconnectController } = window.MafiaStomp;
  const liveCounts = new Map();
  let socket;
  let onlinePlayerTotal = 0;
  let refreshTimer;
  let shouldReconnect = true;
  let stopHeartbeat = () => {};
  const reconnectController = createReconnectController(connect);

// 로비 상단의 전체 접속자 숫자를 현재 계산값으로 바꾼다.
  function updateOnlinePlayerCount() {
    if (onlinePlayerCount) {
      onlinePlayerCount.textContent = String(onlinePlayerTotal);
    }
  }

// 새 방 카드가 필요할 때 중복 reload를 막고 한 번만 갱신한다.
  function scheduleRoomListRefresh() {
    if (refreshTimer !== undefined) {
      return;
    }
    refreshTimer = window.setTimeout(() => {
      refreshTimer = undefined;
      if (shouldReconnect) {
        window.location.reload();
      }
    }, 150);
  }

// 방별 이전 인원과 새 인원의 차이를 전체 접속자 합계에 반영한다.
  function replaceLiveCount(roomId, count) {
    const previousCount = liveCounts.get(roomId) || 0;
    if (count <= 0) {
      liveCounts.delete(roomId);
      onlinePlayerTotal = Math.max(0, onlinePlayerTotal - previousCount);
      return;
    }

    liveCounts.set(roomId, count);
    onlinePlayerTotal += count - previousCount;
  }

// 수신한 방 ID·인원을 검증하고 카드 숫자·빈 방·전체 합계를 갱신한다.
  function updateRoomCount(update, refreshTotal = true) {
    if (!update || !Number.isFinite(Number(update.roomId))) {
      return;
    }

    const roomId = Number(update.roomId);
    const count = Math.max(0, Number(update.currentPlayers));
    if (!Number.isFinite(count)) {
      return;
    }

    const card = cards.get(roomId);
    if (count <= 0) {
      replaceLiveCount(roomId, count);
      if (card) {
        card.remove();
        cards.delete(roomId);
        document.dispatchEvent(new CustomEvent('room:removed', {
          detail: { roomId }
        }));
      }
      if (refreshTotal) {
        updateOnlinePlayerCount();
      }
      return;
    }

    replaceLiveCount(roomId, count);

    const countElement = card?.querySelector('[data-room-player-count]');
    if (!countElement) {
      scheduleRoomListRefresh();
      if (refreshTotal) {
        updateOnlinePlayerCount();
      }
      return;
    }

    countElement.textContent = String(Math.max(0, count));
    if (refreshTotal) {
      updateOnlinePlayerCount();
    }
  }

// 배열 전체 방송과 단일 방 이벤트를 구분해 공통 갱신 함수로 보낸다.
  function updateRoomCounts(message) {
    if (Array.isArray(message)) {
      liveCounts.clear();
      onlinePlayerTotal = 0;
      message.forEach(update => updateRoomCount(update, false));
      updateOnlinePlayerCount();
      return;
    }
    updateRoomCount(message);
  }

// CONNECTED 뒤 로비를 구독하고 presence 요청을 보내며 MESSAGE를 화면 갱신으로 연결한다.
  function handleFrame(frame, connection) {
    if (!frame) {
      return;
    }

    if (frame.command === 'CONNECTED') {
      reconnectController.reset();
      stopHeartbeat();
      stopHeartbeat = startHeartbeat(connection, frame);
      connection.send(createFrame('SUBSCRIBE', {
        id: 'lobby-presence',
        destination: lobbyDestination,
        ack: 'auto'
      }));
      connection.send(createFrame('SEND', {
        destination: '/app/rooms/presence',
        'content-type': 'application/json'
      }, '{}'));
      return;
    }

    if (frame.command === 'MESSAGE'
        && frame.headers.destination === lobbyDestination) {
      try {
        updateRoomCounts(JSON.parse(frame.body));
      } catch (error) {
        console.error('Invalid room presence count', error);
      }
    }
  }

// WebSocket을 열고 STOMP CONNECT를 보내며 close 시 재연결을 예약한다.
  function connect() {
    if (!shouldReconnect || (socket && socket.readyState <= WebSocket.OPEN)) {
      return;
    }

    const connection = new WebSocket(socketUrl);
    const frameParser = createFrameParser(frame => handleFrame(frame, connection));
    socket = connection;
// 연결이 열리면 먼저 STOMP CONNECT frame을 보내 protocol handshake를 시작한다.
    connection.addEventListener('open', () => {
      if (socket !== connection) {
        return;
      }
      connection.send(createFrame('CONNECT', {
        'accept-version': '1.2',
        host: location.host,
        'heart-beat': '10000,10000'
      }));
    });
// 수신 frame은 parser를 거쳐 handleFrame으로 전달된다.
    connection.addEventListener('message', event => {
      if (socket === connection) {
        frameParser(event.data);
      }
    });
// 연결이 닫히면 heartbeat를 멈추고 조건에 따라 재연결을 예약한다.
    connection.addEventListener('close', () => {
      if (socket !== connection) {
        return;
      }
      stopHeartbeat();
      stopHeartbeat = () => {};
      if (shouldReconnect) {
        reconnectController.schedule();
      }
    });
  }

// 페이지를 떠날 때 재연결을 중단하고 열려 있는 WebSocket을 정리한다.
  window.addEventListener('beforeunload', () => {
    shouldReconnect = false;
    reconnectController.cancel();
    window.clearTimeout(refreshTimer);
    stopHeartbeat();
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(createFrame('DISCONNECT'));
    }
  });

  connect();
})();
````

### `src/main/resources/static/js/chat.js`

**코드 흐름:** HTML data 속성에서 방 정보를 읽고 STOMP 클라이언트를 연결한다. 서버의 입장 확인 뒤 presence·chat topic을 구독하고 참가자·Ready·메시지·재접속 상태를 DOM에 반영한다.

**학습 포인트:** 입장 확인 전에 채팅을 허용하지 않는 순서를 따라가면 서버 권한과 화면 상태가 연결된다.

````javascript
// 코드 흐름: 방 HTML의 data 속성을 읽어 WebSocket을 연결하고 서버 입장 확인을 기다린다.
// 동작: 입장 확인 뒤 topic을 구독하고 참가자·Ready·채팅을 DOM에 반영한다.
// 읽는 순서: 초기 상태를 만들고, 함수와 이벤트 핸들러가 서버·DOM 상태를 바꾸는 흐름을 따라간다.
// 서버에서 받은 데이터는 handleFrame, 사용자가 보낸 데이터는 createFrame과 send 호출을 중심으로 읽는다.
(() => {
  const roomId = document.body.dataset.roomId;
  const nickname = document.body.dataset.nickname || '';
  const userId = document.body.dataset.userId ? Number(document.body.dataset.userId) : null;
  const capacity = Number(document.body.dataset.capacity || 0);
  const socketUrl = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`;
  const {
    createFrame,
    createFrameParser,
    startHeartbeat,
    createReconnectController
  } = window.MafiaStomp;
  const form = document.querySelector('#chatForm');
  const input = form?.querySelector('input[name="content"]');
  const readyButton = document.querySelector('#ready');
  const memberGrid = document.querySelector('#memberGrid');
  const roomPlayerCount = document.querySelector('#roomPlayerCount');
  const roomMemberCount = document.querySelector('#roomMemberCount');
  const messages = document.querySelector('#messages');
  const notice = document.querySelector('#chatNotice');
  const connectionStatus = document.querySelector('#chatConnectionStatus');
  const statusDot = document.querySelector('#chatStatusDot');
  const submitButton = form?.querySelector('button[type="submit"]');
  const topicDestination = `/topic/rooms/${roomId}/chat`;
  const presenceDestination = `/topic/rooms/${roomId}/presence`;
  const errorDestination = '/user/queue/errors';
  const joinedDestination = '/user/queue/room-joined';
  const MAX_RENDERED_MESSAGES = 200;

  if (!roomId || !form || !input || !messages) {
    return;
  }

  let socket;
  let connected = false;
  let shouldReconnect = true;
  let currentReady = false;
  let presenceReady = false;
  let joinedRoom = false;
  let forcedLeave = false;
  let roomTopicsSubscribed = false;
  let stopHeartbeat = () => {};
  let renderedMessageCount = 0;
  const senderColorCache = new Map();
  const reconnectController = createReconnectController(connect);

  if (readyButton) {
    readyButton.disabled = true;
  }

// 안내·오류 문구를 toast DOM에 표시하고 일정 시간 뒤 숨긴다.
  function showToast(message) {
    const toast = document.querySelector('#toast');
    if (!toast) {
      return;
    }
    toast.textContent = message;
    toast.classList.add('show');
    window.setTimeout(() => toast.classList.remove('show'), 2200);
  }

// 연결 상태 문구와 점을 바꾸고 채팅·준비 버튼의 사용 가능 여부를 다시 계산한다.
  function setConnectionStatus(label, isOnline) {
    if (connectionStatus) {
      connectionStatus.textContent = label;
    }
    if (statusDot) {
      statusDot.classList.toggle('offline', !isOnline);
    }
    updateChatAvailability(isOnline);
    if (!isOnline) {
      presenceReady = false;
    }
    updateReadyAvailability(isOnline);
  }

// 채팅 패널의 안내 문구를 바꾼다.
  function setNotice(message) {
    if (notice) {
      notice.textContent = message;
    }
  }

// 다른 방 입장으로 현재 방을 종료하고 재연결을 멈춘 뒤 로비로 이동한다.
  function forceLeaveRoom() {
    if (forcedLeave) {
      return;
    }

    forcedLeave = true;
    shouldReconnect = false;
    connected = false;
    joinedRoom = false;
    presenceReady = false;
    reconnectController.cancel();
    stopHeartbeat();
    setConnectionStatus('퇴장됨', false);
    setNotice('다른 게임방에 입장하여 이 방에서 퇴장했습니다.');
    showToast('다른 게임방에 입장하여 이 방에서 퇴장했습니다.');

    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.close();
    }
    window.setTimeout(() => window.location.replace('/rooms'), 700);
  }

// 입장 확인 실패를 표시하고 소켓을 닫은 후 로비로 이동한다.
  function rejectRoomEntry(message) {
    if (forcedLeave) {
      return;
    }

    forcedLeave = true;
    shouldReconnect = false;
    connected = false;
    joinedRoom = false;
    presenceReady = false;
    reconnectController.cancel();
    stopHeartbeat();
    setConnectionStatus('입장 불가', false);
    setNotice(message);

    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.close();
    }
    window.setTimeout(() => window.location.replace('/rooms'), 1200);
  }

// 입장 확인 뒤 presence와 chat topic을 한 번씩 구독한다.
  function subscribeRoomTopics(connection) {
    if (roomTopicsSubscribed) {
      return;
    }
    roomTopicsSubscribed = true;
    connection.send(createFrame('SUBSCRIBE', {
      id: 'room-presence',
      destination: presenceDestination,
      ack: 'auto'
    }));
    connection.send(createFrame('SUBSCRIBE', {
      id: 'room-chat',
      destination: topicDestination,
      ack: 'auto'
    }));
  }

// CONNECTED·ERROR·입장 완료·presence·CHAT frame을 종류별 화면 동작으로 분기한다.
  function handleFrame(frame, connection) {
    if (!frame) {
      return;
    }

    if (frame.command === 'CONNECTED') {
      reconnectController.reset();
      connected = true;
      stopHeartbeat();
      stopHeartbeat = startHeartbeat(connection, frame);
      setConnectionStatus('실시간', true);
      setNotice('실시간 채팅에 연결되었습니다.');
      connection.send(createFrame('SUBSCRIBE', { id: 'chat-errors', destination: errorDestination, ack: 'auto' }));
      connection.send(createFrame('SUBSCRIBE', { id: 'room-joined', destination: joinedDestination, ack: 'auto' }));
      connection.send(createFrame('SEND', {
        destination: `/app/rooms/${roomId}/join`,
        'content-type': 'application/json'
      }, '{}'));
      return;
    }

    if (frame.command === 'MESSAGE') {
      try {
        const message = JSON.parse(frame.body);
        if (!message || typeof message !== 'object') {
          return;
        }
        const isErrorMessage = message.type === 'ERROR'
          || frame.headers.destination === errorDestination
          || frame.headers.subscription === 'chat-errors';
        if (isErrorMessage) {
          const errorMessage = message.message || '요청을 처리하지 못했습니다.';
          showToast(errorMessage);
          if (!joinedRoom) {
            rejectRoomEntry(errorMessage);
          }
          return;
        }
        const isJoinedMessage = frame.headers.destination === joinedDestination
          || frame.headers.subscription === 'room-joined';
        if (isJoinedMessage) {
          renderParticipants(message.participants);
          if (joinedRoom) {
            subscribeRoomTopics(connection);
          } else {
            rejectRoomEntry('게임방 입장 정보를 확인하지 못했습니다.');
          }
          return;
        }
        if (frame.headers.destination === presenceDestination || Array.isArray(message.participants)) {
          renderParticipants(message.participants);
          return;
        }
        if (message.type === 'CHAT') {
          appendMessage(message);
        }
      } catch (error) {
        console.error('Invalid chat message', error);
      }
      return;
    }

    if (frame.command === 'ERROR') {
      rejectRoomEntry(frame.body || '채팅 연결에 문제가 있습니다.');
    }
  }

// 채팅 데이터를 DOM 요소로 만들고 본인/상대방 스타일과 최대 보관 개수를 적용한다.
  function appendMessage(message) {
    const senderName = String(message.sender || '알 수 없음').trim() || '알 수 없음';
    const isOwnMessage = senderName === nickname;
    const item = document.createElement('article');
    item.className = `chat-message ${isOwnMessage ? 'own' : 'other'}`;
    item.dataset.sender = senderName;

    const avatar = document.createElement('div');
    avatar.className = `chat-avatar chat-avatar-${getSenderColor(senderName)}`;
    avatar.setAttribute('aria-hidden', 'true');
    avatar.textContent = getSenderInitial(senderName);

    const messageBody = document.createElement('div');
    messageBody.className = 'chat-message-body';

    const meta = document.createElement('div');
    meta.className = 'chat-message-meta';

    const sender = document.createElement('strong');
    sender.className = 'chat-message-sender';
    sender.textContent = isOwnMessage ? `나 · ${senderName}` : senderName;

    const time = document.createElement('time');
    time.textContent = message.sentAt
      ? new Date(message.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '';

    const content = document.createElement('div');
    content.className = 'chat-message-bubble';
    content.textContent = message.content || '';

    meta.append(sender, time);
    messageBody.append(meta, content);
    item.append(avatar, messageBody);
    messages.append(item);
    renderedMessageCount += 1;
    if (renderedMessageCount > MAX_RENDERED_MESSAGES) {
      messages.querySelector('.chat-message')?.remove();
      renderedMessageCount -= 1;
    }
    messages.scrollTop = messages.scrollHeight;
  }

// 닉네임의 첫 Unicode 문자를 아바타 글자로 뽑는다.
  function getSenderInitial(senderName) {
    return Array.from(senderName)[0] || '?';
  }

// 닉네임을 해시해 같은 사용자가 같은 아바타 색을 계속 사용하게 한다.
  function getSenderColor(senderName) {
    const cachedColor = senderColorCache.get(senderName);
    if (cachedColor !== undefined) {
      return cachedColor;
    }

    const color = Array.from(senderName).reduce(
      (hash, character) => (hash * 31 + character.codePointAt(0)) % 6,
      0
    );
    senderColorCache.set(senderName, color);
    return color;
  }

// 현재 준비 상태를 버튼 문구와 class에 반영한다.
  function renderReadyButton(isReady) {
    currentReady = Boolean(isReady);
    if (!readyButton) {
      return;
    }
    readyButton.classList.toggle('is-ready', currentReady);
    readyButton.textContent = currentReady ? '준비 취소' : '준비 완료';
  }

// 연결·presence 준비 여부에 따라 준비 버튼을 활성화하거나 잠근다.
  function updateReadyAvailability(isOnline = connected) {
    if (readyButton) {
      readyButton.disabled = !isOnline || !presenceReady;
    }
  }

// 연결·방 참가 여부에 따라 채팅 전송 버튼을 활성화하거나 잠근다.
  function updateChatAvailability(isOnline = connected) {
    if (submitButton) {
      submitButton.disabled = !isOnline || !joinedRoom;
    }
  }

// 참가자 배열로 카드와 빈 자리를 다시 만들고 현재 사용자의 상태를 계산한다.
  function renderParticipants(participants) {
    if (forcedLeave || !memberGrid || !Array.isArray(participants)) {
      return;
    }

    const fragment = document.createDocumentFragment();
    let currentParticipant = null;
    const wasJoined = joinedRoom;

    participants.forEach(participant => {
      const article = document.createElement('article');
      article.className = `col member${participant.host ? ' host' : ''}${participant.ready ? ' participant-ready' : ''}`;

      const avatar = document.createElement('div');
      avatar.className = `avatar${participant.host ? ' a1' : ''}`;
      avatar.textContent = getSenderInitial(participant.nickname || '?');

      const name = document.createElement('b');
      name.textContent = participant.nickname || '알 수 없음';

      const status = document.createElement('small');
      const labels = [];
      if (participant.host) {
        labels.push('방장');
      }
      labels.push(participant.ready ? '준비 완료' : '대기 중');
      status.textContent = labels.join(' · ');

      article.append(avatar, name, status);
      fragment.append(article);

      const isCurrentUser = userId !== null
        ? Number(participant.userId) === userId
        : participant.nickname === nickname;
      if (isCurrentUser) {
        currentParticipant = participant;
      }
    });

    const emptySeats = Math.max(capacity - participants.length, 0);
    for (let index = 0; index < emptySeats; index += 1) {
      const emptySeat = document.createElement('article');
      emptySeat.className = 'col member empty-seat';
      emptySeat.innerHTML = '<div class="avatar">+</div><b>빈 자리</b>';
      fragment.append(emptySeat);
    }

    memberGrid.replaceChildren(fragment);
    if (roomPlayerCount) {
      roomPlayerCount.textContent = participants.length;
    }
    if (roomMemberCount) {
      roomMemberCount.textContent = participants.length;
    }
    joinedRoom = currentParticipant !== null;
    presenceReady = currentParticipant !== null;
    renderReadyButton(currentParticipant?.ready || false);
    updateReadyAvailability();
    updateChatAvailability();

    if (wasJoined && currentParticipant === null) {
      forceLeaveRoom();
    }
  }

// WebSocket 이벤트를 연결하고 STOMP CONNECT를 전송하며 끊어지면 재연결한다.
  function connect() {
    if (!shouldReconnect || (socket && socket.readyState <= WebSocket.OPEN)) {
      return;
    }

    joinedRoom = false;
    presenceReady = false;
    currentReady = false;
    renderReadyButton(false);
    updateChatAvailability(false);
    setConnectionStatus('연결 중', false);
    const connection = new WebSocket(socketUrl);
    const frameParser = createFrameParser(frame => handleFrame(frame, connection));
    socket = connection;
    roomTopicsSubscribed = false;

// 연결 완료 후 STOMP CONNECT를 보내 서버의 CONNECTED 응답을 기다린다.
    connection.addEventListener('open', () => {
      if (socket !== connection) {
        return;
      }
      connection.send(createFrame('CONNECT', {
        'accept-version': '1.2',
        host: location.host,
        'heart-beat': '10000,10000'
      }));
    });

// 수신 frame을 입장·presence·채팅 흐름으로 분기한다.
    connection.addEventListener('message', event => {
      if (socket === connection) {
        frameParser(event.data);
      }
    });
    connection.addEventListener('error', () => {
      if (socket !== connection) {
        return;
      }
      setConnectionStatus('오류', false);
      setNotice('채팅 연결에 문제가 있습니다.');
    });
    connection.addEventListener('close', () => {
      if (socket !== connection) {
        return;
      }
      connected = false;
      stopHeartbeat();
      stopHeartbeat = () => {};
      if (forcedLeave) {
        return;
      }
      setConnectionStatus('재연결 중', false);
      setNotice('채팅 연결이 끊겼습니다. 다시 연결하는 중입니다.');
      if (shouldReconnect) {
        reconnectController.schedule();
      }
    });
  }

// 기본 submit을 막고 검증된 내용을 /chat destination으로 SEND한다.
  form.addEventListener('submit', event => {
    event.preventDefault();
    const content = input.value.trim();
    if (!content) {
      return;
    }
    if (!connected || !joinedRoom || !presenceReady || socket.readyState !== WebSocket.OPEN) {
      showToast('채팅 서버에 연결 중입니다.');
      return;
    }

    socket.send(createFrame('SEND', {
      destination: `/app/rooms/${roomId}/chat`,
      'content-type': 'application/json'
    }, JSON.stringify({ content })));
    input.value = '';
    input.focus();
  });

// 준비 버튼은 현재 ready 값의 반대 상태를 /ready로 보낸다.
  readyButton?.addEventListener('click', () => {
    if (!connected || !joinedRoom || !presenceReady || socket.readyState !== WebSocket.OPEN) {
      showToast('게임방 연결 중입니다.');
      return;
    }

    socket.send(createFrame('SEND', {
      destination: `/app/rooms/${roomId}/ready`,
      'content-type': 'application/json'
    }, JSON.stringify({ ready: !currentReady })));
  });

// 방을 떠날 때 자동 재연결·heartbeat·연결을 정리한다.
  window.addEventListener('beforeunload', () => {
    shouldReconnect = false;
    reconnectController.cancel();
    stopHeartbeat();
    if (connected && socket && socket.readyState === WebSocket.OPEN) {
      socket.send(createFrame('DISCONNECT'));
    }
  });

  connect();
})();
````

### `src/main/resources/static/css/app.css`

**코드 흐름:** 로그인·로비·대기방·채팅의 레이아웃과 상태별 디자인을 담당한다.

**학습 포인트:** JavaScript는 DOM 상태를 바꾸고 CSS는 그 상태를 시각화한다는 역할 분리를 본다.

````css
/* 코드 흐름: 브라우저가 HTML의 class와 selector를 기준으로 스타일을 적용한다. */
/* 동작: JavaScript가 바꾼 상태 클래스와 요소가 화면 모양으로 표현된다. */
/* 읽는 순서: 전역 변수 → 공통 컴포넌트 → 페이지별 컴포넌트 → 반응형(@media) 순서로 확인한다. */
/* HTML class가 selector를 선택하고, JavaScript가 class/text를 바꾸면 이 규칙이 화면에 반영된다. */

/* 전역 CSS 변수: 색상과 공통 값을 한 곳에서 관리해 화면 전체에서 재사용한다. */
:root {
  --mafia-ink: #1a1e28;
  --mafia-muted: #7b8290;
  --mafia-line: #e6e8ed;
  --mafia-coral: #f45d4d;
  --mafia-navy: #252b3c;
  --mafia-mint: #31b596;
  --mafia-purple: #8165b7;
}

/* 기본 body 규칙: 모든 페이지의 글꼴·배경·기본 여백을 통일한다. */
body {
  min-height: 100vh;
  color: var(--mafia-ink);
  background: #f6f7f9;
  font-family: 'Noto Sans KR', sans-serif;
}

a {
  text-decoration: none;
}

.brand {
  color: var(--mafia-ink);
  font: 700 17px 'DM Mono', monospace;
  letter-spacing: -1px;
}

.brand:hover {
  color: var(--mafia-ink);
}

.brand-game {
  color: var(--mafia-coral);
}

.brand-mark {
  display: inline-grid;
  place-items: center;
  width: 29px;
  height: 29px;
  border-radius: 8px;
  color: #fff;
  background: var(--mafia-coral);
  font-size: 16px;
}

/* 사용자 메뉴: 로그인 상태에 따라 보이는 계정 버튼과 드롭다운 모양을 정한다. */
.user-menu-toggle {
  flex-shrink: 0;
  border: 1px solid transparent;
  border-radius: 999px;
  color: var(--mafia-ink);
  text-align: left;
  white-space: nowrap;
  transition: border-color .15s ease, background-color .15s ease;
}

.user-menu-toggle:hover,
.user-menu-toggle:focus-visible,
.user-menu-toggle.show {
  border-color: var(--mafia-line);
  background: #fff;
  color: var(--mafia-ink);
}

.user-avatar-sm {
  display: grid;
  flex: 0 0 34px;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  color: #fff;
  background: var(--mafia-coral);
  font-size: 13px;
  font-weight: 800;
}

.user-menu-name {
  max-width: 120px;
  overflow: hidden;
  font-size: 12px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-menu-level {
  color: var(--mafia-coral);
  font: 10px 'DM Mono', monospace;
  letter-spacing: .4px;
}

.user-menu-dropdown {
  min-width: 220px;
  margin-top: .5rem !important;
  border: 1px solid var(--mafia-line);
  border-radius: 14px;
  box-shadow: 0 14px 35px rgba(26, 30, 40, .13);
}

.user-menu-item {
  display: flex;
  align-items: center;
  gap: .65rem;
  border-radius: 9px;
  color: var(--mafia-ink);
  font-size: 13px;
}

.user-menu-item:hover,
.user-menu-item:focus {
  color: var(--mafia-ink);
  background: #fff3f1;
}

.user-menu-icon {
  display: inline-grid;
  flex: 0 0 22px;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: 7px;
  color: var(--mafia-coral);
  background: #fff0ee;
  font-size: 12px;
  font-weight: 700;
}

.user-menu-logout {
  color: #9a4d45;
}

.user-menu-logout:hover,
.user-menu-logout:focus {
  color: #9a4d45;
  background: #fff0ee;
}

.user-menu {
  flex-shrink: 0;
}

.navbar-actions {
  flex-wrap: wrap;
  justify-content: flex-end;
  row-gap: .5rem;
}

.online-status {
  flex-shrink: 0;
  white-space: nowrap;
}

.online-status-dot {
  color: var(--mafia-mint);
  font-size: 9px;
}

/* 반응형 규칙: 작은 화면에서 navbar·카드·채팅 배치를 다시 조정한다. */
@media (max-width: 575.98px) {
  .navbar-actions {
    gap: .5rem !important;
  }

  .online-status {
    font-size: 11px !important;
  }

  .online-status-prefix {
    display: none;
  }

  .user-menu-toggle {
    justify-content: center;
    min-width: 40px;
    min-height: 40px;
    padding-inline: .3rem !important;
  }

  .user-menu-toggle::after {
    margin-left: 0;
  }

  .user-menu-dropdown {
    min-width: 205px;
  }
}

.brand.light,
.brand.light:hover {
  color: #fff;
}

.text-coral {
  color: var(--mafia-coral) !important;
}

.btn-coral {
  --bs-btn-color: #fff;
  --bs-btn-bg: var(--mafia-coral);
  --bs-btn-border-color: var(--mafia-coral);
  --bs-btn-hover-color: #fff;
  --bs-btn-hover-bg: #df4d40;
  --bs-btn-hover-border-color: #df4d40;
  --bs-btn-active-color: #fff;
  --bs-btn-active-bg: #cf4438;
  --bs-btn-active-border-color: #cf4438;
}

.bg-mafia {
  background: var(--mafia-navy);
}

/* 로비 hero: 방 목록 페이지의 제목과 주요 행동 영역을 꾸민다. */
.app-hero {
  position: relative;
  overflow: hidden;
}

.app-hero::after {
  position: absolute;
  top: -55px;
  right: 20%;
  color: #fff;
  content: '♠';
  font-size: 240px;
  opacity: .04;
}

.app-hero > * {
  position: relative;
  z-index: 1;
}

.eyebrow {
  margin-bottom: .5rem;
  color: #f98b7e;
  font: 11px 'DM Mono', monospace;
  letter-spacing: 1.5px;
}

.app-room-header,
.app-profile-hero {
  color: #fff;
  background: linear-gradient(120deg, #252b3c, #394159);
}

.app-room-header {
  min-height: 170px;
}

.app-profile-hero {
  position: relative;
  overflow: hidden;
}

.app-profile-hero::after {
  position: absolute;
  top: -90px;
  right: 45px;
  color: #fff;
  content: '♠';
  font-size: 280px;
  opacity: .04;
}

.app-profile-hero > * {
  position: relative;
  z-index: 1;
}

.avatar-large {
  display: grid;
  flex: 0 0 88px;
  place-items: center;
  width: 88px;
  height: 88px;
  border: 4px solid rgba(255, 255, 255, .3);
  border-radius: 50%;
  color: #a86348;
  background: #f4d7c9;
  font-size: 31px;
  font-weight: 800;
}

.online-badge {
  color: #a6e5d5;
  background: rgba(74, 204, 169, .14);
}

.online-badge i,
#chatStatusDot {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--mafia-mint);
}

#chatStatusDot.offline {
  background: #c5c8cf;
}

.stat-icon {
  display: grid;
  place-items: center;
  width: 39px;
  height: 39px;
  border-radius: 10px;
  font-size: 19px;
}

.stat-icon.coral {
  color: #df6255;
  background: #fff0ee;
}

.stat-icon.mint {
  color: #299d83;
  background: #e6f7f2;
}

.stat-icon.purple {
  color: #7356a6;
  background: #f0ecf8;
}

/* 참가자 카드: presence 데이터가 바뀔 때 표시되는 사용자 상태 영역이다. */
.member {
  display: flex;
  min-height: 112px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  border: 1px solid #e6e8ec;
  border-radius: 10px;
  background: #fff;
}

.member.host {
  border-color: #ffc9c2;
  background: #fffafa;
}

.member.participant-ready {
  border-color: #bce9dc;
  background: #f7fffc;
}

.avatar {
  display: grid;
  place-items: center;
  width: 39px;
  height: 39px;
  border-radius: 50%;
  color: #606875;
  background: #e7eaef;
  font-weight: 700;
}

.avatar.a1 {
  color: #a35e44;
  background: #f6d6c9;
}

.member small {
  color: var(--mafia-coral);
  font-size: 10px;
}

.member.participant-ready small {
  color: var(--mafia-mint);
}

.ready.is-ready {
  border-color: var(--mafia-mint);
  background: var(--mafia-mint);
}

.ready:disabled {
  cursor: not-allowed;
  opacity: .55;
}

.empty-seat {
  border-style: dashed;
  color: #a3a9b3;
}

.empty-seat .avatar {
  color: #8b929d;
  background: #f5f6f8;
  font-size: 20px;
  font-weight: 400;
}

/* 채팅 패널: 메시지 목록과 입력창을 함께 담는 영역이다. */
.chat-panel {
  min-height: 400px;
}

.messages {
  display: flex;
  flex-direction: column;
  gap: .75rem;
  min-height: 260px;
  max-height: 340px;
  overflow-y: auto;
}

.chat-message {
  display: flex;
  align-items: flex-end;
  gap: .5rem;
  max-width: 100%;
  margin: 0;
}

.chat-message.own {
  flex-direction: row-reverse;
  align-self: flex-end;
}

.chat-avatar {
  display: grid;
  flex: 0 0 30px;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  color: #fff;
  font-size: 12px;
  font-weight: 800;
}

.chat-avatar-0 {
  background: #6d5cae;
}

.chat-avatar-1 {
  background: #2e9e88;
}

.chat-avatar-2 {
  background: #e1785e;
}

.chat-avatar-3 {
  background: #4f7bb5;
}

.chat-avatar-4 {
  background: #b26b98;
}

.chat-avatar-5 {
  background: #8b8f4f;
}

.chat-message-body {
  display: flex;
  min-width: 0;
  max-width: calc(100% - 38px);
  flex-direction: column;
  align-items: flex-start;
}

.chat-message.own .chat-message-body {
  align-items: flex-end;
}

.chat-message-meta {
  display: flex;
  align-items: center;
  gap: .4rem;
  margin-bottom: .25rem;
  max-width: 100%;
}

.chat-message-sender {
  overflow: hidden;
  max-width: 150px;
  color: #4f5663;
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat-message.own .chat-message-sender {
  color: var(--mafia-coral);
}

.chat-message-bubble {
  max-width: 100%;
  padding: .55rem .7rem;
  border-radius: 1rem 1rem 1rem .3rem;
  background: #f0f2f5;
  color: #454c58;
  font-size: 13px;
  line-height: 1.45;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.chat-message time {
  flex: 0 0 auto;
  color: #a3a9b3;
  font-size: 10px;
}

.chat-message.own .chat-message-bubble {
  border-radius: 1rem 1rem .3rem 1rem;
  color: #fff;
  background: var(--mafia-coral);
}

#chatNotice {
  margin-bottom: 0;
}

.game-row {
  min-height: 73px;
}

.result-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #b7bdc6;
}

.result-dot.win {
  background: var(--mafia-mint);
}

.win-text {
  color: #168b70;
  background: #e5f7f1;
}

.loss-text {
  color: #777f8d;
  background: #f0f1f3;
}

.friend-button.added {
  color: #a6e6d5;
  border-color: #48c4a8;
}

/* 인증 화면 일러스트 영역: 로그인·회원가입 화면의 시각적 배경을 담당한다. */
.auth-art {
  position: relative;
  overflow: hidden;
  color: #fff;
  background: linear-gradient(145deg, #202536, #363d55);
}

.auth-art.signup-art {
  background: linear-gradient(145deg, #253344, #294958);
}

.auth-art::after {
  position: absolute;
  right: -270px;
  bottom: -250px;
  width: 580px;
  height: 580px;
  border: 1px solid rgba(255, 255, 255, .12);
  border-radius: 50%;
  box-shadow: 0 0 0 60px rgba(255, 255, 255, .025), 0 0 0 120px rgba(255, 255, 255, .02);
  content: '';
}

.art-copy {
  position: absolute;
  top: 50%;
  z-index: 1;
  transform: translateY(-47%);
}

.art-copy p {
  color: #fb8478;
  font: 12px 'DM Mono', monospace;
  letter-spacing: 1.8px;
}

.art-copy h1 {
  margin: 13px 0;
  font-size: clamp(30px, 3vw, 46px);
  line-height: 1.35;
  letter-spacing: -2px;
}

.art-copy span {
  display: block;
  margin-top: 26px;
  color: #fff;
  font-size: 118px;
  line-height: 1;
  opacity: .14;
}

.auth-card {
  width: min(390px, 100%);
}

.form-control:focus {
  border-color: #f37a6e;
  box-shadow: 0 0 0 3px #fff0ee;
}

/* 방 카드 hover: 사용자가 선택할 수 있는 카드라는 시각적 피드백이다. */
.room-card:hover {
  background: #fffafa;
}

.room-card .room-number {
  width: 28px;
  color: #a7acb5;
  font: 12px 'DM Mono', monospace;
}

.room-card .lock {
  color: #7f8793;
  font-size: 11px;
}

.room-card .room-main {
  min-width: 0;
}

.room-card .room-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.room-card .players {
  min-width: 61px;
}

.room-card .join {
  min-width: 78px;
}

.toast {
  z-index: 1080;
}

.password-field {
  transition: opacity .15s ease;
}

@media (max-width: 767.98px) {
  .avatar-large {
    flex-basis: 65px;
    width: 65px;
    height: 65px;
    font-size: 24px;
  }

  .room-card .room-number {
    display: none;
  }

  .room-card .players {
    min-width: 43px;
  }

  .room-card .join {
    min-width: 61px;
    padding-inline: .35rem;
    font-size: 11px;
  }

  .game-row time {
    display: none;
  }
}
````

## Java 테스트와 테스트 리소스

### `src/test/java/kr/or/oti/mafiagame/MafiagameApplicationTest.java`

**코드 흐름:** 구현 규칙을 Given → When → Then 순서로 자동 검증한다.

**학습 포인트:** 테스트 이름과 assert를 먼저 읽고 어떤 업무 규칙을 보호하는지 확인한다.

````java
// 코드 흐름: 테스트 준비 코드가 가짜 협력 객체와 입력을 만들고 실제 메서드를 실행한다.
// 동작: 마지막 assert와 verify가 기대한 결과와 호출 순서를 확인한다.
// 읽는 순서: 테스트 준비(@Mock·setUp) → @Test 실행 → assertThat/verify 검증 순서로 읽는다.
// Mock은 DB·WebSocket 같은 외부 계층을 대신하므로 테스트 대상의 판단과 호출을 집중해서 확인한다.
package kr.or.oti.mafiagame;


@SpringBootTest
class MafiagameApplicationTest {
    // 테스트 대상과 외부 협력 객체를 분리해 기능별 성공·실패 경로를 확인한다.
    // 테스트 시나리오: Spring Boot 설정과 Bean이 함께 올라오는지 확인한다.
    @Test
    void contextLoads() {
    }
}
````

### `src/test/java/kr/or/oti/mafiagame/config/WebSocketAuthorizationInterceptorTest.java`

**코드 흐름:** 구현 규칙을 Given → When → Then 순서로 자동 검증한다.

**학습 포인트:** 테스트 이름과 assert를 먼저 읽고 어떤 업무 규칙을 보호하는지 확인한다.

````java
// 코드 흐름: 애플리케이션 시작 시 Spring이 이 설정을 읽어 기능을 등록한다.
// 동작: 설정 메서드가 만든 Bean이나 Interceptor가 이후 요청 처리 흐름에 참여한다.
// 읽는 순서: 테스트 준비(@Mock·setUp) → @Test 실행 → assertThat/verify 검증 순서로 읽는다.
// Mock은 DB·WebSocket 같은 외부 계층을 대신하므로 테스트 대상의 판단과 호출을 집중해서 확인한다.
package kr.or.oti.mafiagame.config;





@ExtendWith(MockitoExtension.class)
class WebSocketAuthorizationInterceptorTest {
    // 테스트 대상과 외부 협력 객체를 분리해 기능별 성공·실패 경로를 확인한다.
    @Mock
    private RoomPresenceService roomPresenceService;

    private WebSocketAuthorizationInterceptor interceptor;

    // 테스트 준비: 각 테스트가 독립적으로 사용할 Mock과 테스트 대상을 새로 만든다.
    @BeforeEach
    void setUp() {
        interceptor = new WebSocketAuthorizationInterceptor(roomPresenceService);
    }

    // 테스트 시나리오: 로그인하지 않은 세션도 공개 로비 인원 토픽을 구독할 수 있는지 확인한다.
    @Test
    void allowsPublicLobbySubscriptionWithoutLogin() {
        Message<byte[]> message = message(StompCommand.SUBSCRIBE, "/topic/rooms/presence", null);

        assertThat(interceptor.preSend(message, null)).isSameAs(message);
    }

    // 테스트 시나리오: 방에 입장하지 않은 세션의 방 토픽 구독을 거부하는지 확인한다.
    @Test
    void deniesRoomTopicSubscriptionUntilSessionJoined() {
        Principal principal = () -> "player";
        when(roomPresenceService.isParticipant(7L, "session")).thenReturn(false);

        assertThatThrownBy(() -> interceptor.preSend(
                message(StompCommand.SUBSCRIBE, "/topic/rooms/7/chat", principal), null))
                .hasMessage("먼저 게임방에 입장해 주세요.");
    }

    // 테스트 시나리오: 방 참가자는 방 presence 구독과 채팅 SEND를 모두 통과하는지 확인한다.
    @Test
    void allowsJoinedParticipantToSubscribeAndSendRoomMessages() {
        Principal principal = () -> "player";
        when(roomPresenceService.isParticipant(7L, "session")).thenReturn(true);

        Message<byte[]> subscribe = message(StompCommand.SUBSCRIBE, "/topic/rooms/7/presence", principal);
        Message<byte[]> send = message(StompCommand.SEND, "/app/rooms/7/chat", principal);

        assertThat(interceptor.preSend(subscribe, null)).isSameAs(subscribe);
        assertThat(interceptor.preSend(send, null)).isSameAs(send);
    }

    // 테스트 시나리오: join은 허용하되 로그인하지 않은 방 작업은 거부하는지 확인한다.
    @Test
    void allowsJoinButRequiresLoginForRoomOperations() {
        Principal principal = () -> "player";
        Message<byte[]> join = message(StompCommand.SEND, "/app/rooms/7/join", principal);

        assertThat(interceptor.preSend(join, null)).isSameAs(join);
        assertThatThrownBy(() -> interceptor.preSend(
                message(StompCommand.SEND, "/app/rooms/7/join", null), null))
                .hasMessage("로그인 후 이용해 주세요.");
    }

    // 테스트 시나리오: 개인 큐 구독은 인증된 사용자에게만 허용되는지 확인한다.
    @Test
    void onlyAuthenticatedSessionsCanSubscribeToUserQueue() {
        assertThatThrownBy(() -> interceptor.preSend(
                message(StompCommand.SUBSCRIBE, "/user/queue/errors", null), null))
                .hasMessage("로그인 후 이용해 주세요.");
    }

    // 테스트 보조 흐름: 반복되는 입력 객체를 만들거나 기대한 결과와 호출을 검증한다.
    private static Message<byte[]> message(StompCommand command, String destination, Principal principal) {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(command);
        accessor.setDestination(destination);
        accessor.setSessionId("session");
        accessor.setUser(principal);
        return MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());
    }
}
````

### `src/test/java/kr/or/oti/mafiagame/service/SignupServiceTest.java`

**코드 흐름:** 구현 규칙을 Given → When → Then 순서로 자동 검증한다.

**학습 포인트:** 테스트 이름과 assert를 먼저 읽고 어떤 업무 규칙을 보호하는지 확인한다.

````java
// 코드 흐름: Controller 또는 Security가 이 Service를 호출해 업무 규칙을 실행한다.
// 동작: 검증과 상태 조합을 마친 뒤 DAO를 호출하거나 DTO를 반환한다.
// 읽는 순서: 테스트 준비(@Mock·setUp) → @Test 실행 → assertThat/verify 검증 순서로 읽는다.
// Mock은 DB·WebSocket 같은 외부 계층을 대신하므로 테스트 대상의 판단과 호출을 집중해서 확인한다.
package kr.or.oti.mafiagame.service;




@ExtendWith(MockitoExtension.class)
class SignupServiceTest {
    // 테스트 대상과 외부 협력 객체를 분리해 기능별 성공·실패 경로를 확인한다.
    @Mock
    private UserMapper userMapper;
    @Mock
    private PasswordEncoder passwordEncoder;

    private SignupService signupService;

    // 테스트 준비: 각 테스트가 독립적으로 사용할 Mock과 테스트 대상을 새로 만든다.
    @BeforeEach
    void setUp() {
        signupService = new SignupService(userMapper, passwordEncoder);
    }

    // 테스트 시나리오: 공백 제거·이메일 소문자 변환 후 암호화된 회원 정보가 저장되는지 확인한다.
    @Test
    void normalizesAndPersistsValidSignup() {
        when(userMapper.existsByEmail("user@example.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("encoded");
        when(userMapper.insert(any(User.class))).thenAnswer(invocation -> {
            invocation.<User>getArgument(0).setUserId(15L);
            return 1;
        });
        when(userMapper.insertStats(15L)).thenReturn(1);

        signupService.signup("  player  ", " USER@Example.COM ", "password123", "password123", true);

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userMapper).insert(userCaptor.capture());
        assertThat(userCaptor.getValue().getUserName()).isEqualTo("player");
        assertThat(userCaptor.getValue().getEmail()).isEqualTo("user@example.com");
        assertThat(userCaptor.getValue().getPassword()).isEqualTo("encoded");
        verify(userMapper).insertStats(15L);
    }

    // 테스트 시나리오: 닉네임·비밀번호·약관·중복 이메일 검증이 각각 실패하는지 확인한다.
    @Test
    void rejectsInvalidInputsAndDuplicateEmail() {
        assertThatThrownBy(() -> signupService.signup("x", "user@example.com", "password123", "password123", true))
                .isInstanceOf(SignupException.class);
        assertThatThrownBy(() -> signupService.signup("player", "invalid", "password123", "password123", true))
                .isInstanceOf(SignupException.class);
        assertThatThrownBy(() -> signupService.signup("player", "user@example.com", "short", "short", true))
                .isInstanceOf(SignupException.class);
        assertThatThrownBy(() -> signupService.signup("player", "user@example.com", "password123", "different", true))
                .isInstanceOf(SignupException.class);
        assertThatThrownBy(() -> signupService.signup("player", "user@example.com", "password123", "password123", false))
                .isInstanceOf(SignupException.class);

        when(userMapper.existsByEmail("user@example.com")).thenReturn(true);
        assertThatThrownBy(() -> signupService.signup("player", "user@example.com", "password123", "password123", true))
                .isInstanceOf(SignupException.class);
    }

    // 테스트 시나리오: DB의 중복 제약조건 오류를 화면용 회원가입 예외로 변환하는지 확인한다.
    @Test
    void convertsDatabaseDuplicateFailureToDomainException() {
        when(userMapper.existsByEmail("user@example.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("encoded");
        when(userMapper.insert(any(User.class))).thenThrow(new DataIntegrityViolationException("duplicate"));

        assertThatThrownBy(() -> signupService.signup(
                "player", "user@example.com", "password123", "password123", true))
                .isInstanceOf(SignupException.class);
    }

    // 테스트 시나리오: INSERT 결과가 1행이 아닐 때 저장 실패로 처리하는지 확인한다.
    @Test
    void rejectsUnexpectedInsertResult() {
        when(userMapper.existsByEmail("user@example.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("encoded");
        when(userMapper.insert(any(User.class))).thenReturn(0);

        assertThatThrownBy(() -> signupService.signup(
                "player", "user@example.com", "password123", "password123", true))
                .isInstanceOf(SignupException.class);
    }
}
````

### `src/test/java/kr/or/oti/mafiagame/service/UserAccountServiceTest.java`

**코드 흐름:** 구현 규칙을 Given → When → Then 순서로 자동 검증한다.

**학습 포인트:** 테스트 이름과 assert를 먼저 읽고 어떤 업무 규칙을 보호하는지 확인한다.

````java
// 코드 흐름: Controller 또는 Security가 이 Service를 호출해 업무 규칙을 실행한다.
// 동작: 검증과 상태 조합을 마친 뒤 DAO를 호출하거나 DTO를 반환한다.
// 읽는 순서: 테스트 준비(@Mock·setUp) → @Test 실행 → assertThat/verify 검증 순서로 읽는다.
// Mock은 DB·WebSocket 같은 외부 계층을 대신하므로 테스트 대상의 판단과 호출을 집중해서 확인한다.
package kr.or.oti.mafiagame.service;





@ExtendWith(MockitoExtension.class)
class UserAccountServiceTest {
    // 테스트 대상과 외부 협력 객체를 분리해 기능별 성공·실패 경로를 확인한다.
    @Mock
    private UserMapper userMapper;

    // 테스트 시나리오: 사용자와 통계 조회 결과가 프로필 DTO 하나로 조합되는지 확인한다.
    @Test
    void buildsProfileFromUserAndStats() {
        User user = user(5L, " Player@Example.com ", "player");
        user.setBio(" ");
        user.setCreatedAt(LocalDateTime.of(2026, 9, 1, 12, 0));
        UserStats stats = new UserStats();
        stats.setTotalGames(10);
        stats.setWins(6);
        when(userMapper.findById(5L)).thenReturn(Optional.of(user));
        when(userMapper.findStatsByUserId(5L)).thenReturn(stats);

        UserProfile profile = new UserService(userMapper).getProfile(5L);

        assertThat(profile.nickname()).isEqualTo("player");
        assertThat(profile.bio()).isEqualTo("아직 소개가 없습니다.");
        assertThat(profile.totalGames()).isEqualTo(10);
        assertThat(profile.winRate()).isEqualTo(60);
        assertThat(profile.joinedAt()).isEqualTo("2026년 9월 가입");
    }

    // 테스트 시나리오: 사용자가 없으면 null을 반환하고 통계 조회를 생략하는지 확인한다.
    @Test
    void missingUserReturnsNullWithoutStatsQuery() {
        when(userMapper.findById(404L)).thenReturn(Optional.empty());

        assertThat(new UserService(userMapper).getProfile(404L)).isNull();
        verify(userMapper, never()).findStatsByUserId(404L);
    }

    // 테스트 시나리오: 로그인 이메일을 정규화하고 CustomUserDetails로 변환하는지 확인한다.
    @Test
    void loginLookupNormalizesEmailAndBuildsUserDetails() {
        User user = user(5L, "player@example.com", "player");
        when(userMapper.findByEmail("player@example.com")).thenReturn(Optional.of(user));

        CustomUserDetails details = (CustomUserDetails) new CustomUserDetailsService(userMapper)
                .loadUserByUsername(" Player@Example.COM ");

        assertThat(details.getUserId()).isEqualTo(5L);
        assertThat(details.getNickname()).isEqualTo("player");
        verify(userMapper).findByEmail("player@example.com");
    }

    // 테스트 시나리오: 존재하지 않는 이메일을 UsernameNotFoundException으로 거부하는지 확인한다.
    @Test
    void loginLookupRejectsUnknownEmail() {
        when(userMapper.findByEmail("missing@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> new CustomUserDetailsService(userMapper)
                .loadUserByUsername("missing@example.com"))
                .isInstanceOf(UsernameNotFoundException.class);
    }

    // 테스트 보조 흐름: 반복되는 입력 객체를 만들거나 기대한 결과와 호출을 검증한다.
    private static User user(long userId, String email, String nickname) {
        return User.builder()
                .userId(userId)
                .email(email)
                .userName(nickname)
                .password("encoded")
                .user_level(1)
                .build();
    }
}
````

### `src/test/java/kr/or/oti/mafiagame/controller/RoomControllerTest.java`

**코드 흐름:** 구현 규칙을 Given → When → Then 순서로 자동 검증한다.

**학습 포인트:** 테스트 이름과 assert를 먼저 읽고 어떤 업무 규칙을 보호하는지 확인한다.

````java
// 코드 흐름: 브라우저 HTTP 또는 WebSocket 요청이 이 Controller의 매핑 메서드로 들어온다.
// 동작: 입력값을 Service에 전달하고 화면·응답·방송 결과를 반환한다.
// 읽는 순서: 테스트 준비(@Mock·setUp) → @Test 실행 → assertThat/verify 검증 순서로 읽는다.
// Mock은 DB·WebSocket 같은 외부 계층을 대신하므로 테스트 대상의 판단과 호출을 집중해서 확인한다.
package kr.or.oti.mafiagame.controller;





@ExtendWith(MockitoExtension.class)
class RoomControllerTest {
    // 테스트 대상과 외부 협력 객체를 분리해 기능별 성공·실패 경로를 확인한다.
    @Mock
    private RoomService roomService;
    @Mock
    private RoomPresenceService roomPresenceService;

    private RoomController controller;

    // 테스트 준비: 각 테스트가 독립적으로 사용할 Mock과 테스트 대상을 새로 만든다.
    @BeforeEach
    void setUp() {
        controller = new RoomController(roomService, roomPresenceService);
    }

    // 테스트 시나리오: 방 목록의 DB 인원 수가 실시간 presence 인원 수로 덮어써지는지 확인한다.
    @Test
    void roomListOverlaysDatabaseCountWithLivePresenceCount() {
        RoomView room = room(1L, 5);
        when(roomService.getRooms()).thenReturn(List.of(room));
        when(roomPresenceService.currentCounts()).thenReturn(Map.of(1L, 2));
        ExtendedModelMap model = new ExtendedModelMap();

        String view = controller.roomList(model);

        assertThat(view).isEqualTo("rooms/list");
        @SuppressWarnings("unchecked")
        List<RoomView> rooms = (List<RoomView>) model.get("rooms");
        assertThat(rooms).singleElement().extracting(RoomView::players).isEqualTo(2);
        assertThat(model.get("onlinePlayerCount")).isEqualTo(2);
    }

    // 테스트 시나리오: 방 상세 화면이 오래된 DB 멤버 대신 실시간 참가자를 사용하는지 확인한다.
    @Test
    void roomDetailUsesLiveParticipantsInsteadOfDatabaseMembers() {
        when(roomService.getRoomView(1L)).thenReturn(room(1L, 5));
        when(roomPresenceService.currentState(1L)).thenReturn(new RoomPresenceState(
                1L,
                List.of(
                        new RoomParticipant(10L, "one", true, false),
                        new RoomParticipant(11L, "two", false, true))));
        ExtendedModelMap model = new ExtendedModelMap();

        String view = controller.roomDetail(1L, null, new MockHttpSession(), model);

        assertThat(view).isEqualTo("rooms/detail");
        assertThat(model.get("members")).isEqualTo(List.of("one", "two"));
        assertThat(((RoomView) model.get("room")).players()).isEqualTo(2);
        verify(roomService, never()).getMemberNames(1L);
    }

    // 테스트 시나리오: 실시간 상태가 없을 때 stale 멤버를 보여주지 않고 없는 방은 로비로 보내는지 확인한다.
    @Test
    void roomDetailDoesNotRenderStaleDatabaseMembersAndRedirectsMissingRoom() {
        when(roomService.getRoomView(1L)).thenReturn(room(1L, 1));
        when(roomPresenceService.currentState(1L)).thenReturn(null);
        ExtendedModelMap model = new ExtendedModelMap();

        assertThat(controller.roomDetail(1L, null, new MockHttpSession(), model)).isEqualTo("rooms/detail");
        assertThat(model.get("members")).isEqualTo(List.of());
        assertThat(((RoomView) model.get("room")).players()).isZero();
        verify(roomService, never()).getMemberNames(1L);

        when(roomService.getRoomView(404L)).thenReturn(null);
        assertThat(controller.roomDetail(404L, null, new MockHttpSession(), new ExtendedModelMap()))
                .isEqualTo("redirect:/rooms");
    }

    // 테스트 시나리오: 잠금 방은 비밀번호를 확인한 뒤 세션에 접근 권한을 저장하는지 확인한다.
    @Test
    void lockedRoomRequiresPasswordAndGrantsSessionAccess() {
        RoomView lockedRoom = new RoomView(2L, "locked", "description", "host", 1, 8, "WAITING", true);
        when(roomService.getRoomView(2L)).thenReturn(lockedRoom);
        MockHttpSession session = new MockHttpSession();

        assertThat(controller.roomDetail(2L, null, session, new ExtendedModelMap()))
                .isEqualTo("rooms/access");

        when(roomService.verifyRoomPassword(2L, "secret")).thenReturn(true);
        assertThat(controller.accessRoom(2L, "secret", session, new ExtendedModelMap()))
                .isEqualTo("redirect:/rooms/2");

        when(roomPresenceService.currentState(2L)).thenReturn(null);
        assertThat(controller.roomDetail(2L, null, session, new ExtendedModelMap()))
                .isEqualTo("rooms/detail");
    }

    // 테스트 보조 흐름: 반복되는 입력 객체를 만들거나 기대한 결과와 호출을 검증한다.
    private static RoomView room(long roomId, int players) {
        return new RoomView(roomId, "room", "description", "host", players, 8, "WAITING", false);
    }
}
````

### `src/test/java/kr/or/oti/mafiagame/controller/ControllerDelegationTest.java`

**코드 흐름:** 구현 규칙을 Given → When → Then 순서로 자동 검증한다.

**학습 포인트:** 테스트 이름과 assert를 먼저 읽고 어떤 업무 규칙을 보호하는지 확인한다.

````java
// 코드 흐름: 브라우저 HTTP 또는 WebSocket 요청이 이 Controller의 매핑 메서드로 들어온다.
// 동작: 입력값을 Service에 전달하고 화면·응답·방송 결과를 반환한다.
// 읽는 순서: 테스트 준비(@Mock·setUp) → @Test 실행 → assertThat/verify 검증 순서로 읽는다.
// Mock은 DB·WebSocket 같은 외부 계층을 대신하므로 테스트 대상의 판단과 호출을 집중해서 확인한다.
package kr.or.oti.mafiagame.controller;





@ExtendWith(MockitoExtension.class)
class ControllerDelegationTest {
    // 테스트 대상과 외부 협력 객체를 분리해 기능별 성공·실패 경로를 확인한다.
    @Mock
    private SimpMessagingTemplate messagingTemplate;
    @Mock
    private ChatService chatService;
    @Mock
    private RoomPresenceService roomPresenceService;

    // 테스트 시나리오: 채팅 Controller가 Service 결과를 해당 방 topic으로 방송하는지 확인한다.
    @Test
    void chatControllerPublishesServiceResultToRoomTopic() {
        ChatController controller = new ChatController(messagingTemplate, chatService);
        ChatMessageRequest request = new ChatMessageRequest("hello");
        Principal principal = () -> "player";
        SimpMessageHeaderAccessor headers = SimpMessageHeaderAccessor.create();
        headers.setSessionId("session");
        ChatMessage message = new ChatMessage(4L, "CHAT", "player", "hello", null);
        when(chatService.createMessage(4L, request, principal, "session")).thenReturn(message);

        controller.sendMessage(4L, request, headers, principal);

        verify(messagingTemplate).convertAndSend("/topic/rooms/4/chat", message);
    }

    // 테스트 시나리오: presence Controller가 세션 ID를 포함해 입장·준비·인원 요청을 Service에 위임하는지 확인한다.
    @Test
    void presenceControllerDelegatesSessionAwareOperations() {
        RoomPresenceController controller = new RoomPresenceController(roomPresenceService);
        SimpMessageHeaderAccessor headers = SimpMessageHeaderAccessor.create();
        headers.setSessionId("session");
        Principal principal = () -> "player";
        RoomReadyRequest request = new RoomReadyRequest(true);
        RoomPresenceState joinedState = new RoomPresenceState(2L, List.of());
        when(roomPresenceService.join(2L, "session", principal, false)).thenReturn(joinedState);

        assertThat(controller.join(2L, headers, principal)).isEqualTo(joinedState);
        controller.updateReady(2L, request, headers);
        controller.sendRoomCounts();

        verify(roomPresenceService).join(2L, "session", principal, false);
        verify(roomPresenceService).updateReady(2L, "session", request);
        verify(roomPresenceService).broadcastRoomCounts();
    }

    // 테스트 시나리오: WebSocket 예외가 사용자 큐로 전달할 오류 DTO로 변환되는지 확인한다.
    @Test
    void websocketExceptionsAreConvertedToErrorPayloads() {
        ChatController chatController = new ChatController(messagingTemplate, chatService);
        RoomPresenceController presenceController = new RoomPresenceController(roomPresenceService);
        var exception = new kr.or.oti.mafiagame.exception.RoomWebSocketException("failed");

        assertThat(chatController.handleRoomWebSocketException(exception).message()).isEqualTo("failed");
        assertThat(presenceController.handlePresenceException(exception).message()).isEqualTo("failed");
    }
}
````

### `src/test/java/kr/or/oti/mafiagame/service/RoomServiceTest.java`

**코드 흐름:** 구현 규칙을 Given → When → Then 순서로 자동 검증한다.

**학습 포인트:** 테스트 이름과 assert를 먼저 읽고 어떤 업무 규칙을 보호하는지 확인한다.

````java
// 코드 흐름: Controller 또는 Security가 이 Service를 호출해 업무 규칙을 실행한다.
// 동작: 검증과 상태 조합을 마친 뒤 DAO를 호출하거나 DTO를 반환한다.
// 읽는 순서: 테스트 준비(@Mock·setUp) → @Test 실행 → assertThat/verify 검증 순서로 읽는다.
// Mock은 DB·WebSocket 같은 외부 계층을 대신하므로 테스트 대상의 판단과 호출을 집중해서 확인한다.
package kr.or.oti.mafiagame.service;




@ExtendWith(MockitoExtension.class)
class RoomServiceTest {
    // 테스트 대상과 외부 협력 객체를 분리해 기능별 성공·실패 경로를 확인한다.
    @Mock
    private RoomMapper roomMapper;
    @Mock
    private PasswordEncoder passwordEncoder;

    private RoomService roomService;

    // 테스트 준비: 각 테스트가 독립적으로 사용할 Mock과 테스트 대상을 새로 만든다.
    @BeforeEach
    void setUp() {
        roomService = new RoomService(roomMapper, passwordEncoder);
    }

    // 테스트 시나리오: 방 제목·비밀번호를 정리하고 비밀번호 hash와 방장 멤버를 저장하는지 확인한다.
    @Test
    void createsRoomWithNormalizedValuesAndEncodedPassword() {
        when(passwordEncoder.encode("secret")).thenReturn("encoded-secret");
        when(roomMapper.insert(any(Room.class))).thenAnswer(invocation -> {
            invocation.<Room>getArgument(0).setRoomId(7L);
            return 1;
        });
        when(roomMapper.insertMember(7L, 10L)).thenReturn(1);

        long roomId = roomService.createRoom(10L, "  test room  ", 6, " secret ");

        assertThat(roomId).isEqualTo(7L);
        ArgumentCaptor<Room> roomCaptor = ArgumentCaptor.forClass(Room.class);
        verify(roomMapper).insert(roomCaptor.capture());
        assertThat(roomCaptor.getValue().getTitle()).isEqualTo("test room");
        assertThat(roomCaptor.getValue().getRoomPassword()).isEqualTo("encoded-secret");
        assertThat(roomCaptor.getValue().getStatus()).isEqualTo("WAITING");
        verify(roomMapper).insertMember(7L, 10L);
    }

    // 테스트 시나리오: 비밀번호가 없는 방은 hash를 만들지 않고 공개 방으로 저장하는지 확인한다.
    @Test
    void createsUnlockedRoomWithoutEncodingEmptyPassword() {
        when(roomMapper.insert(any(Room.class))).thenAnswer(invocation -> {
            invocation.<Room>getArgument(0).setRoomId(8L);
            return 1;
        });
        when(roomMapper.insertMember(8L, 10L)).thenReturn(1);

        roomService.createRoom(10L, "room", 4, "  ");

        ArgumentCaptor<Room> roomCaptor = ArgumentCaptor.forClass(Room.class);
        verify(roomMapper).insert(roomCaptor.capture());
        assertThat(roomCaptor.getValue().getRoomPassword()).isNull();
    }

    // 테스트 시나리오: 방 입력 범위와 INSERT 결과를 검증해 잘못된 요청을 거부하는지 확인한다.
    @Test
    void validatesRoomInputAndMapperResults() {
        assertThatThrownBy(() -> roomService.createRoom(1L, "x", 4, null))
                .isInstanceOf(RoomCreationException.class);
        assertThatThrownBy(() -> roomService.createRoom(1L, "valid", 3, null))
                .isInstanceOf(RoomCreationException.class);
        assertThatThrownBy(() -> roomService.createRoom(1L, "valid", 4, "123"))
                .isInstanceOf(RoomCreationException.class);

        when(roomMapper.insert(any(Room.class))).thenReturn(0);
        assertThatThrownBy(() -> roomService.createRoom(1L, "valid", 4, null))
                .isInstanceOf(RoomCreationException.class);
    }

    // 테스트 시나리오: 방장 변경이 정확히 한 행을 수정했을 때만 성공으로 처리하는지 확인한다.
    @Test
    void transferHostRequiresExactlyOneUpdatedRoom() {
        when(roomMapper.updateHostUserId(1L, 2L)).thenReturn(0);

        assertThatThrownBy(() -> roomService.transferHost(1L, 2L))
                .isInstanceOf(IllegalStateException.class);
    }

    // 테스트 시나리오: 입력 비밀번호를 trim한 뒤 저장된 BCrypt hash와 비교하는지 확인한다.
    @Test
    void verifiesNormalizedRoomPasswordAgainstStoredHash() {
        when(roomMapper.findPasswordHash(1L)).thenReturn("encoded");
        when(passwordEncoder.matches("secret", "encoded")).thenReturn(true);

        assertThat(roomService.verifyRoomPassword(1L, " secret ")).isTrue();
        assertThat(roomService.verifyRoomPassword(1L, "   ")).isFalse();
        verify(passwordEncoder).matches("secret", "encoded");
    }
}
````

### `src/test/java/kr/or/oti/mafiagame/service/RoomPresenceServiceTest.java`

**코드 흐름:** 구현 규칙을 Given → When → Then 순서로 자동 검증한다.

**학습 포인트:** 테스트 이름과 assert를 먼저 읽고 어떤 업무 규칙을 보호하는지 확인한다.

````java
// 코드 흐름: Controller 또는 Security가 이 Service를 호출해 업무 규칙을 실행한다.
// 동작: 검증과 상태 조합을 마친 뒤 DAO를 호출하거나 DTO를 반환한다.
// 읽는 순서: 테스트 준비(@Mock·setUp) → @Test 실행 → assertThat/verify 검증 순서로 읽는다.
// Mock은 DB·WebSocket 같은 외부 계층을 대신하므로 테스트 대상의 판단과 호출을 집중해서 확인한다.
package kr.or.oti.mafiagame.service;





@ExtendWith(MockitoExtension.class)
class RoomPresenceServiceTest {
    // 테스트 대상과 외부 협력 객체를 분리해 기능별 성공·실패 경로를 확인한다.
    @Mock
    private SimpMessagingTemplate messagingTemplate;
    @Mock
    private RoomService roomService;

    private RoomPresenceService presenceService;

    // 테스트 준비: 각 테스트가 독립적으로 사용할 Mock과 테스트 대상을 새로 만든다.
    @BeforeEach
    void setUp() {
        presenceService = new RoomPresenceService(messagingTemplate, roomService, Duration.ZERO);
        when(roomService.getRoom(anyLong())).thenAnswer(invocation -> switch (invocation.<Long>getArgument(0).intValue()) {
            case 1 -> room(1L, 10L);
            case 2 -> room(2L, 20L);
            case 3 -> room(3L, 30L, 2);
            case 4 -> lockedRoom(4L, 40L);
            default -> null;
        });
    }

    // 테스트 시나리오: 같은 사용자의 여러 탭을 한 참가자로 세고 준비 상태를 공유하는지 확인한다.
    @Test
    void sameUserInMultipleSessionsCountsAsOneParticipantAndSharesReadyState() {
        Principal user = principal(10L, "host");

        presenceService.join(1L, "session-1", user);
        presenceService.join(1L, "session-2", user);
        presenceService.updateReady(1L, "session-2", new RoomReadyRequest(true));

        RoomPresenceState state = presenceService.currentState(1L);
        assertThat(state.participants()).hasSize(1);
        assertThat(state.participants().get(0).nickname()).isEqualTo("host");
        assertThat(state.participants().get(0).ready()).isTrue();
        assertThat(presenceService.currentCounts()).containsEntry(1L, 1);
        assertThat(presenceService.isParticipant(1L, "session-1")).isTrue();
        assertThat(presenceService.isParticipant(1L, "session-2")).isTrue();
    }

    // 테스트 시나리오: 한 탭이 닫혀도 마지막 세션이 남아 있으면 참가자를 유지하는지 확인한다.
    @Test
    void closingOneTabKeepsParticipantUntilLastSessionLeaves() {
        Principal user = principal(10L, "host");
        presenceService.join(1L, "session-1", user);
        presenceService.join(1L, "session-2", user);

        presenceService.leave("session-1");

        assertThat(presenceService.currentState(1L).participants()).hasSize(1);
        assertThat(presenceService.isParticipant(1L, "session-1")).isFalse();
        assertThat(presenceService.isParticipant(1L, "session-2")).isTrue();
        verify(roomService, never()).deleteRoom(1L);

        presenceService.leave("session-2");
        assertThat(presenceService.currentState(1L)).isNull();
        verify(roomService).deleteRoom(1L);
    }

    // 테스트 시나리오: 같은 사용자가 다른 방에 들어갈 때 이전 방의 모든 세션을 정리하는지 확인한다.
    @Test
    void joiningDifferentRoomRemovesEveryPreviousSession() {
        Principal user = principal(10L, "player");
        presenceService.join(1L, "old-1", user);
        presenceService.join(1L, "old-2", user);

        presenceService.join(2L, "new-1", user);

        assertThat(presenceService.currentState(1L)).isNull();
        assertThat(presenceService.currentState(2L).participants())
                .singleElement()
                .satisfies(participant -> assertThat(participant.userId()).isEqualTo(10L));
        assertThat(presenceService.isParticipant(1L, "old-1")).isFalse();
        assertThat(presenceService.isParticipant(1L, "old-2")).isFalse();
        assertThat(presenceService.isParticipant(2L, "new-1")).isTrue();
        verify(roomService).deleteRoom(1L);
    }

    // 테스트 시나리오: 방장이 나가면 남은 참가자에게 방장 권한을 넘기는지 확인한다.
    @Test
    void leavingHostTransfersHostToRemainingParticipant() {
        presenceService.join(1L, "host-session", principal(10L, "host"));
        presenceService.join(1L, "guest-session", principal(11L, "guest"));

        presenceService.leave("host-session");

        assertThat(presenceService.currentState(1L).participants())
                .singleElement()
                .satisfies(participant -> {
                    assertThat(participant.userId()).isEqualTo(11L);
                    assertThat(participant.host()).isTrue();
                });
        verify(roomService).transferHost(1L, 11L);
    }

    // 테스트 시나리오: 빈 방이 정리 유예 시간 동안은 목록에 남아 재접속 기회를 갖는지 확인한다.
    @Test
    void keepsEmptyRoomVisibleDuringCleanupGracePeriod() {
        RoomPresenceService delayedService = new RoomPresenceService(
                messagingTemplate, roomService, Duration.ofSeconds(1));
        try {
            delayedService.join(1L, "delayed-session", principal(10L, "host"));
            delayedService.leave("delayed-session");

            assertThat(delayedService.currentState(1L).participants()).isEmpty();
            assertThat(delayedService.currentCounts()).containsEntry(1L, 0);
            verify(roomService, never()).deleteRoom(1L);
        } finally {
            delayedService.shutdownCleanupExecutor();
        }
    }

    // 테스트 시나리오: 유예 시간이 끝난 빈 방을 DB와 메모리에서 삭제하는지 확인한다.
    @Test
    void deletesEmptyRoomAfterCleanupGracePeriodExpires() throws InterruptedException {
        RoomPresenceService delayedService = new RoomPresenceService(
                messagingTemplate, roomService, Duration.ofMillis(100));
        try {
            delayedService.join(1L, "delayed-session", principal(10L, "host"));
            delayedService.leave("delayed-session");

            verify(roomService, never()).deleteRoom(1L);
            await(Duration.ofSeconds(2), () -> verify(roomService).deleteRoom(1L));
            assertThat(delayedService.currentState(1L)).isNull();
        } finally {
            delayedService.shutdownCleanupExecutor();
        }
    }

    // 테스트 시나리오: 삭제 예약 중 재입장하면 예약을 취소하고 방을 보존하는지 확인한다.
    @Test
    void rejoiningDuringCleanupGracePeriodCancelsRoomDeletion() throws InterruptedException {
        RoomPresenceService delayedService = new RoomPresenceService(
                messagingTemplate, roomService, Duration.ofMillis(100));
        try {
            delayedService.join(1L, "first-session", principal(10L, "host"));
            delayedService.leave("first-session");
            delayedService.join(1L, "reconnected-session", principal(10L, "host"));

            Thread.sleep(300L);

            verify(roomService, never()).deleteRoom(1L);
            assertThat(delayedService.isParticipant(1L, "reconnected-session")).isTrue();
        } finally {
            delayedService.shutdownCleanupExecutor();
        }
    }

    // 테스트 시나리오: 빈 방 삭제 DB 호출이 실패하면 재시도하는지 확인한다.
    @Test
    void retriesEmptyRoomDeletionWhenDatabaseDeleteFails() throws InterruptedException {
        AtomicInteger deleteAttempts = new AtomicInteger();
        doAnswer(invocation -> {
            if (deleteAttempts.getAndIncrement() == 0) {
                throw new IllegalStateException("db unavailable");
            }
            return null;
        }).when(roomService).deleteRoom(1L);
        RoomPresenceService delayedService = new RoomPresenceService(
                messagingTemplate, roomService, Duration.ofMillis(50));
        try {
            delayedService.join(1L, "delayed-session", principal(10L, "host"));
            delayedService.leave("delayed-session");

            await(Duration.ofSeconds(2), () -> verify(roomService, atLeast(2)).deleteRoom(1L));
            assertThat(delayedService.currentState(1L)).isNull();
            assertThat(deleteAttempts.get()).isGreaterThanOrEqualTo(2);
        } finally {
            delayedService.shutdownCleanupExecutor();
        }
    }

    // 테스트 시나리오: 방장 변경 실패 시 메모리 참가자 상태를 변경하지 않는지 확인한다.
    @Test
    void failedHostTransferLeavesPresenceStateUntouched() {
        presenceService.join(1L, "host-session", principal(10L, "host"));
        presenceService.join(1L, "guest-session", principal(11L, "guest"));
        reset(roomService);
        doThrow(new IllegalStateException("db unavailable"))
                .when(roomService).transferHost(1L, 11L);

        assertThatThrownBy(() -> presenceService.leave("host-session"))
                .isInstanceOf(IllegalStateException.class);

        assertThat(presenceService.isParticipant(1L, "host-session")).isTrue();
        assertThat(presenceService.currentState(1L).participants()).hasSize(2);
    }

    // 테스트 시나리오: DB에 저장된 방장을 확인하기 전 게스트가 방장으로 잘못 지정되지 않는지 확인한다.
    @Test
    void guestJoiningBeforePersistedHostDoesNotTakeHostRole() {
        presenceService.join(1L, "guest-session", principal(11L, "guest"));

        assertThat(presenceService.currentState(1L).participants())
                .singleElement()
                .satisfies(participant -> assertThat(participant.host()).isFalse());
        verify(roomService, never()).transferHost(1L, 11L);

        presenceService.join(1L, "host-session", principal(10L, "host"));
        assertThat(presenceService.currentState(1L).participants())
                .filteredOn(participant -> participant.userId() == 10L)
                .singleElement()
                .satisfies(participant -> assertThat(participant.host()).isTrue());
    }

    // 테스트 시나리오: 가득 찬 대상 방 입장이 실패해도 현재 방에서는 나가지 않는지 확인한다.
    @Test
    void fullTargetRoomRejectsNewParticipantWithoutLeavingCurrentRoom() {
        Principal movingUser = principal(10L, "moving");
        presenceService.join(1L, "old-session", movingUser);
        presenceService.join(3L, "full-1", principal(30L, "one"));
        presenceService.join(3L, "full-2", principal(31L, "two"));

        assertThatThrownBy(() -> presenceService.join(3L, "new-session", movingUser))
                .isInstanceOf(RoomWebSocketException.class);

        assertThat(presenceService.isParticipant(1L, "old-session")).isTrue();
        assertThat(presenceService.currentState(3L).participants()).hasSize(2);
        assertThat(presenceService.isParticipant(3L, "new-session")).isFalse();
    }

    // 테스트 시나리오: 동시 입장 요청이 있어도 최대 정원을 넘지 않는지 확인한다.
    @Test
    void concurrentJoinsNeverExceedRoomCapacity() throws Exception {
        ExecutorService executor = Executors.newFixedThreadPool(8);
        CountDownLatch start = new CountDownLatch(1);
        List<Future<Boolean>> results = new ArrayList<>();
        try {
            for (int index = 0; index < 10; index++) {
                long userId = 100L + index;
                String sessionId = "concurrent-" + index;
                results.add(executor.submit(() -> {
                    start.await();
                    try {
                        presenceService.join(3L, sessionId, principal(userId, "user" + userId));
                        return true;
                    } catch (RoomWebSocketException exception) {
                        return false;
                    }
                }));
            }

            start.countDown();
            long successfulJoins = 0;
            for (Future<Boolean> result : results) {
                if (result.get()) {
                    successfulJoins++;
                }
            }

            assertThat(successfulJoins).isEqualTo(2);
            assertThat(presenceService.currentState(3L).participants()).hasSize(2);
        } finally {
            executor.shutdownNow();
        }
    }

    // 테스트 시나리오: 존재하지 않는 방·세션의 입장과 잘못된 준비 요청을 거부하는지 확인한다.
    @Test
    void rejectsInvalidJoinAndReadyRequests() {
        assertThatThrownBy(() -> presenceService.join(1L, "", principal(10L, "host")))
                .isInstanceOf(RoomWebSocketException.class);
        assertThatThrownBy(() -> presenceService.join(999L, "session", principal(10L, "host")))
                .isInstanceOf(RoomWebSocketException.class);
        assertThatThrownBy(() -> presenceService.updateReady(1L, "unknown", new RoomReadyRequest(true)))
                .isInstanceOf(RoomWebSocketException.class);
    }

    // 테스트 시나리오: 잠금 방 WebSocket 입장은 먼저 검증된 HTTP 세션 권한을 요구하는지 확인한다.
    @Test
    void lockedRoomRequiresVerifiedHttpSessionAccess() {
        Principal user = principal(40L, "host");

        assertThatThrownBy(() -> presenceService.join(4L, "locked-session", user, false))
                .isInstanceOf(RoomWebSocketException.class);

        presenceService.join(4L, "locked-session", user, true);
        assertThat(presenceService.isParticipant(4L, "locked-session")).isTrue();
    }

    // 테스트 보조 흐름: 반복되는 입력 객체를 만들거나 기대한 결과와 호출을 검증한다.
    private static RoomSummary room(long roomId, long hostUserId) {
        return room(roomId, hostUserId, 8);
    }

    // 테스트 보조 흐름: 반복되는 입력 객체를 만들거나 기대한 결과와 호출을 검증한다.
    private static RoomSummary room(long roomId, long hostUserId, int maxPlayers) {
        RoomSummary room = new RoomSummary();
        room.setRoomId(roomId);
        room.setHostUserId(hostUserId);
        room.setTitle("room-" + roomId);
        room.setHostName("host");
        room.setMaxPlayers(maxPlayers);
        room.setStatus("WAITING");
        return room;
    }

    // 테스트 보조 흐름: 반복되는 입력 객체를 만들거나 기대한 결과와 호출을 검증한다.
    private static RoomSummary lockedRoom(long roomId, long hostUserId) {
        RoomSummary room = room(roomId, hostUserId);
        room.setLocked(true);
        return room;
    }

    // 테스트 보조 흐름: 반복되는 입력 객체를 만들거나 기대한 결과와 호출을 검증한다.
    private static Principal principal(long userId, String nickname) {
        User user = User.builder()
                .userId(userId)
                .userName(nickname)
                .email(nickname + "@example.com")
                .password("encoded")
                .user_level(1)
                .build();
        CustomUserDetails details = new CustomUserDetails(user);
        return new UsernamePasswordAuthenticationToken(details, details.getPassword(), details.getAuthorities());
    }

    // 테스트 보조 흐름: 반복되는 입력 객체를 만들거나 기대한 결과와 호출을 검증한다.
    private static void await(Duration timeout, Runnable assertion) throws InterruptedException {
        long deadline = System.nanoTime() + timeout.toNanos();
        AssertionError lastFailure = null;
        while (System.nanoTime() < deadline) {
            try {
                assertion.run();
                return;
            } catch (AssertionError failure) {
                lastFailure = failure;
                Thread.sleep(10L);
            }
        }
        if (lastFailure != null) {
            throw lastFailure;
        }
        assertion.run();
    }
}
````

### `src/test/java/kr/or/oti/mafiagame/service/ChatServiceTest.java`

**코드 흐름:** 구현 규칙을 Given → When → Then 순서로 자동 검증한다.

**학습 포인트:** 테스트 이름과 assert를 먼저 읽고 어떤 업무 규칙을 보호하는지 확인한다.

````java
// 코드 흐름: Controller 또는 Security가 이 Service를 호출해 업무 규칙을 실행한다.
// 동작: 검증과 상태 조합을 마친 뒤 DAO를 호출하거나 DTO를 반환한다.
// 읽는 순서: 테스트 준비(@Mock·setUp) → @Test 실행 → assertThat/verify 검증 순서로 읽는다.
// Mock은 DB·WebSocket 같은 외부 계층을 대신하므로 테스트 대상의 판단과 호출을 집중해서 확인한다.
package kr.or.oti.mafiagame.service;





@ExtendWith(MockitoExtension.class)
class ChatServiceTest {
    // 테스트 대상과 외부 협력 객체를 분리해 기능별 성공·실패 경로를 확인한다.
    @Mock
    private RoomPresenceService roomPresenceService;

    private ChatService chatService;

    // 테스트 준비: 각 테스트가 독립적으로 사용할 Mock과 테스트 대상을 새로 만든다.
    @BeforeEach
    void setUp() {
        chatService = new ChatService(roomPresenceService);
    }

    // 테스트 시나리오: 참가자의 앞뒤 공백을 제거한 채팅 메시지를 만드는지 확인한다.
    @Test
    void createsTrimmedMessageForJoinedParticipant() {
        Principal principal = () -> "nickname";
        when(roomPresenceService.isParticipant(3L, "session")).thenReturn(true);

        ChatMessage message = chatService.createMessage(
                3L, new ChatMessageRequest("  hello  "), principal, "session");

        assertThat(message.roomId()).isEqualTo(3L);
        assertThat(message.type()).isEqualTo("CHAT");
        assertThat(message.sender()).isEqualTo("nickname");
        assertThat(message.content()).isEqualTo("hello");
        assertThat(message.sentAt()).isNotNull();
    }

    // 테스트 시나리오: 익명 사용자와 방에 없는 사용자의 채팅을 거부하는지 확인한다.
    @Test
    void rejectsAnonymousOrNonParticipant() {
        assertThatThrownBy(() -> chatService.createMessage(
                1L, new ChatMessageRequest("hello"), null, "session"))
                .isInstanceOf(RoomWebSocketException.class);

        Principal principal = () -> "nickname";
        when(roomPresenceService.isParticipant(1L, "session")).thenReturn(false);
        assertThatThrownBy(() -> chatService.createMessage(
                1L, new ChatMessageRequest("hello"), principal, "session"))
                .isInstanceOf(RoomWebSocketException.class);
    }

    // 테스트 시나리오: 빈 문자열과 Unicode 기준 300자를 초과한 메시지를 거부하는지 확인한다.
    @Test
    void rejectsBlankAndMoreThanThreeHundredUnicodeCodePoints() {
        Principal principal = () -> "nickname";
        when(roomPresenceService.isParticipant(1L, "session")).thenReturn(true);

        assertThatThrownBy(() -> chatService.createMessage(
                1L, new ChatMessageRequest("   "), principal, "session"))
                .isInstanceOf(RoomWebSocketException.class);
        assertThatThrownBy(() -> chatService.createMessage(
                1L, new ChatMessageRequest("😀".repeat(301)), principal, "session"))
                .isInstanceOf(RoomWebSocketException.class);
    }
}
````

### `src/test/java/kr/or/oti/mafiagame/dao/MapperIntegrationTest.java`

**코드 흐름:** 구현 규칙을 Given → When → Then 순서로 자동 검증한다.

**학습 포인트:** 테스트 이름과 assert를 먼저 읽고 어떤 업무 규칙을 보호하는지 확인한다.

````java
// 코드 흐름: Service가 이 Mapper 인터페이스의 메서드를 호출한다.
// 동작: 같은 이름의 XML SQL이 DB와 통신하고 조회 결과가 호출자에게 돌아온다.
// 읽는 순서: 테스트 준비(@Mock·setUp) → @Test 실행 → assertThat/verify 검증 순서로 읽는다.
// Mock은 DB·WebSocket 같은 외부 계층을 대신하므로 테스트 대상의 판단과 호출을 집중해서 확인한다.
package kr.or.oti.mafiagame.dao;




@MybatisTest
class MapperIntegrationTest {
    // 테스트 대상과 외부 협력 객체를 분리해 기능별 성공·실패 경로를 확인한다.
    @Autowired
    private UserMapper userMapper;
    @Autowired
    private RoomMapper roomMapper;

    // 테스트 시나리오: UserMapper가 사용자와 통계 행을 저장하고 다시 조회하는지 확인한다.
    @Test
    void userMapperPersistsAndQueriesUserAndStats() {
        User user = newUser("user@example.com", "player");

        assertThat(userMapper.insert(user)).isEqualTo(1);
        assertThat(user.getUserId()).isPositive();
        assertThat(userMapper.insertStats(user.getUserId())).isEqualTo(1);

        assertThat(userMapper.existsByEmail("user@example.com")).isTrue();
        assertThat(userMapper.findByEmail("user@example.com"))
                .hasValueSatisfying(found -> assertThat(found.getUserName()).isEqualTo("player"));
        assertThat(userMapper.findStatsByUserId(user.getUserId()).getTotalGames()).isZero();
    }

    // 테스트 시나리오: RoomMapper가 방·멤버를 저장하고 목록 조회·방장 변경·삭제를 수행하는지 확인한다.
    @Test
    void roomMapperPersistsListsTransfersAndDeletesRoom() {
        User host = insertUser("host@example.com", "host");
        User guest = insertUser("guest@example.com", "guest");
        Room room = Room.builder()
                .hostUserId(host.getUserId())
                .title("test room")
                .roomPassword("encoded-room-password")
                .maxPlayers(6)
                .status("WAITING")
                .build();

        assertThat(roomMapper.insert(room)).isEqualTo(1);
        assertThat(roomMapper.insertMember(room.getRoomId(), host.getUserId())).isEqualTo(1);
        assertThat(roomMapper.insertMember(room.getRoomId(), guest.getUserId())).isEqualTo(1);

        RoomSummary summary = roomMapper.findById(room.getRoomId());
        assertThat(summary.getTitle()).isEqualTo("test room");
        assertThat(summary.getCurrentPlayers()).isEqualTo(2);
        assertThat(roomMapper.findMemberNames(room.getRoomId())).containsExactly("host", "guest");
        assertThat(roomMapper.findAll()).extracting(RoomSummary::getRoomId).contains(room.getRoomId());

        assertThat(roomMapper.updateHostUserId(room.getRoomId(), guest.getUserId())).isEqualTo(1);
        assertThat(roomMapper.findById(room.getRoomId()).getHostUserId()).isEqualTo(guest.getUserId());
        assertThat(roomMapper.findPasswordHash(room.getRoomId())).isEqualTo("encoded-room-password");

        assertThat(roomMapper.deleteMembersByRoomId(room.getRoomId())).isEqualTo(2);
        assertThat(roomMapper.deleteById(room.getRoomId())).isEqualTo(1);
        assertThat(roomMapper.findById(room.getRoomId())).isNull();
    }

    // 테스트 보조 흐름: 반복되는 입력 객체를 만들거나 기대한 결과와 호출을 검증한다.
    private User insertUser(String email, String nickname) {
        User user = newUser(email, nickname);
        userMapper.insert(user);
        return user;
    }

    // 테스트 보조 흐름: 반복되는 입력 객체를 만들거나 기대한 결과와 호출을 검증한다.
    private static User newUser(String email, String nickname) {
        return User.builder()
                .email(email)
                .password("encoded")
                .userName(nickname)
                .user_level(1)
                .build();
    }
}
````

### `src/test/resources/application.properties`

**코드 흐름:** 테스트용 H2 메모리 DB와 MyBatis 설정을 지정한다.

**학습 포인트:** 운영 DB 없이도 같은 Mapper 흐름을 반복 실행할 수 있는 테스트 환경이다.

````properties
# 코드 흐름: 테스트 실행 전에 이 설정·스키마가 H2 환경을 준비한다.
# 동작: 테스트 코드가 운영 DB 없이 동일한 테이블과 Mapper 흐름을 재현한다.
# 이 파일은 코드가 아니라 실행 환경의 기본값을 선언한다.
# ${...} 값은 실행 환경에서 주입되고, 나머지 항목은 Spring·MyBatis 동작을 조정한다.
# 운영 DB 대신 테스트용 H2 메모리 DB를 사용한다.
spring.datasource.url=jdbc:h2:mem:mafiagame-${random.uuid};MODE=MariaDB;DB_CLOSE_DELAY=-1
spring.datasource.driver-class-name=org.h2.Driver
spring.datasource.username=sa
spring.datasource.password=
# 테스트 시작 시 schema.sql로 테이블을 자동 생성한다.
spring.sql.init.mode=always
# 통합 테스트도 운영과 같은 Mapper XML을 사용한다.
mybatis.mapper-locations=classpath:/mappers/**/*.xml
mybatis.configuration.map-underscore-to-camel-case=true
mafiagame.room.empty-cleanup-delay=0s
````

### `src/test/resources/schema.sql`

**코드 흐름:** H2에 사용자·통계·방·멤버 테이블을 만들어 통합 테스트의 시작 상태를 준비한다.

**학습 포인트:** 운영 스키마와 테스트 스키마의 컬럼 이름이 Mapper XML과 맞는지 확인한다.

````sql
-- 코드 흐름: 테스트 실행 전에 이 설정·스키마가 H2 환경을 준비한다.
-- 동작: 테스트 코드가 운영 DB 없이 동일한 테이블과 Mapper 흐름을 재현한다.
-- 각 CREATE TABLE은 테스트 DB의 한 테이블을 만들고, PRIMARY/FOREIGN KEY가 관계를 제한한다.
-- 위에서 아래로 테이블을 만들기 때문에 참조 대상 테이블을 먼저 선언한다.
-- user 테이블: 테스트에서 사용하는 사용자·방·멤버 관계를 생성한다.
CREATE TABLE `user` (
    user_id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    user_name VARCHAR(100) NOT NULL,
    user_level INTEGER NOT NULL,
    bio VARCHAR(1000),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- user_stats 테이블: 테스트에서 사용하는 사용자·방·멤버 관계를 생성한다.
CREATE TABLE user_stats (
    user_id BIGINT PRIMARY KEY,
    total_games INTEGER NOT NULL DEFAULT 0,
    wins INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES `user` (user_id)
);

-- game_room 테이블: 테스트에서 사용하는 사용자·방·멤버 관계를 생성한다.
CREATE TABLE game_room (
    room_id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    host_user_id BIGINT NOT NULL,
    title VARCHAR(100) NOT NULL,
    room_password VARCHAR(255),
    max_players TINYINT NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (host_user_id) REFERENCES `user` (user_id)
);

-- room_members 테이블: 테스트에서 사용하는 사용자·방·멤버 관계를 생성한다.
CREATE TABLE room_members (
    room_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    is_ready BOOLEAN NOT NULL DEFAULT FALSE,
    role VARCHAR(20),
    is_alive BOOLEAN NOT NULL DEFAULT TRUE,
    joined_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (room_id, user_id),
    FOREIGN KEY (room_id) REFERENCES game_room (room_id),
    FOREIGN KEY (user_id) REFERENCES `user` (user_id)
);
````
