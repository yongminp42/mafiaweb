# MAFIAGAME

Spring Boot와 Thymeleaf로 구현한 브라우저 기반 마피아 게임 프로젝트입니다. 현재 MVP는 회원 인증, 게임 로비, 대기방, 실시간 참가자 상태·준비 상태·채팅까지 구현되어 있으며, 실제 마피아 게임 진행은 다음 개발 범위입니다.

상세 요구사항과 전체 개발 체크리스트는 [MAFIAGAME_MVP.md](./MAFIAGAME_MVP.md)를 기준으로 합니다.

## 현재 구현 범위

- 회원가입, 로그인, 로그아웃 및 인증된 사용자 접근 제어
- MariaDB와 MyBatis를 이용한 사용자·게임방 데이터 처리
- 게임 로비의 방 목록, 상태 필터, 제목 검색, 방 생성
- 방 비밀번호와 정원(4~8명) 검증
- 잠긴 방의 비밀번호 입력 및 입장 처리
- 대기방의 실시간 참가자 목록과 준비 상태 동기화
- 동일 사용자의 여러 브라우저·탭 접속 지원
  - 같은 방: 기존 참가자 한 명으로 유지하고 같은 방 화면을 공유
  - 다른 방: 이전 방에서 강제 퇴장한 뒤 새 방으로 이동
- 빈 방 정리, 연결 종료·재연결 및 방장 변경의 기본 처리
- 인증된 사용자만 사용할 수 있는 WebSocket/STOMP 대기방 채팅
- 채팅 메시지 검증 및 클라이언트의 연결·재연결 처리

## 아직 구현할 MVP 기능

- 방장의 게임 시작 및 최소 인원·전체 준비 상태 검증
- 게임 시작 시 역할 배정과 역할별 비공개 메시지
- 서버 기준 게임 단계와 타이머 관리
- 낮 토론, 지목 투표, 최후 변론, 처형 투표, 밤 행동
- 마피아·시민 진영의 승리 조건 판정
- 게임 결과와 게임 이력 저장·조회

## 게임 진행 계획

실제 게임 진행은 서버가 상태와 시간을 관리하는 단일 게임 상태 모델로 구현합니다.

```text
WAITING
  -> ROLE_ASSIGNMENT
  -> DAY_DISCUSSION (90초)
  -> NOMINATION_VOTE (30초)
  -> FINAL_DEFENSE (20초)
  -> EXECUTION_VOTE (15초)
  -> NIGHT (30초)
  -> RESULT 또는 DAY_DISCUSSION
```

MVP 기본 역할은 `MAFIA`, `DOCTOR`, `POLICE`, `CITIZEN`입니다. 모든 마피아가 탈락하면 시민 진영이 승리하고, 생존 마피아 수가 생존 시민 진영 수 이상이면 마피아 진영이 승리합니다.

## 기술 스택

| 구분 | 기술 |
| --- | --- |
| Language | Java 17 |
| Framework | Spring Boot 3.5.16 |
| Web | Spring MVC, Thymeleaf |
| Security | Spring Security, BCrypt |
| Realtime | Spring WebSocket, STOMP, SockJS |
| Data access | MyBatis Spring Boot Starter 3.0.5 |
| Database | MariaDB |
| Frontend | HTML, CSS, JavaScript ES6 |
| Build | Gradle Wrapper 8.14.5 |
| JavaScript test | Node.js built-in test runner, jsdom |

## 실행 방법

### 사전 요구사항

- JDK 17
- Node.js와 npm: JavaScript 테스트 실행에 필요
- MariaDB: 사용자·방 데이터 기능에 필요

DB 접속 정보는 환경 변수로 설정할 수 있습니다.

```powershell
$env:DB_USERNAME = "mafiagame"
$env:DB_PASSWORD = "your-password"
```

### Windows

의존성을 설치한 뒤 테스트를 실행합니다.

```powershell
npm ci
.\gradlew.bat test
```

`gradlew test`는 Java 테스트와 JavaScript 테스트(`jsTest`)를 함께 실행합니다. 애플리케이션을 실행하려면 다음 명령을 사용합니다.

```powershell
.\gradlew.bat bootRun
```

### macOS / Linux

```bash
npm ci
./gradlew test
./gradlew bootRun
```

실행 후 [http://localhost:8080](http://localhost:8080)에서 접속할 수 있습니다.

## 환경 변수와 기본 설정

`src/main/resources/application.properties`의 기본 MariaDB 연결 설정은 다음과 같습니다.

| 항목 | 기본값 |
| --- | --- |
| URL | `jdbc:mariadb://localhost:23306/mafiaweb` |
| 사용자명 | `root` 또는 `DB_USERNAME` |
| 비밀번호 | 빈 값 또는 `DB_PASSWORD` |

운영 환경에서는 데이터베이스 비밀번호를 소스 코드에 기록하지 말고 환경 변수로 주입해야 합니다.

## 주요 URL

| URL | 설명 |
| --- | --- |
| `/` 또는 `/rooms` | 게임 로비 |
| `/rooms/{roomId}` | 게임방 대기 화면 |
| `/login` | 로그인 |
| `/signup` | 회원가입 |

## 프로젝트 구조

```text
src/main/java/kr/or/oti/mafiagame/
├── config/       # Spring Security, WebSocket 설정
├── controller/   # 인증, 로비, 방, 채팅 요청 처리
├── dao/          # MyBatis Mapper
├── domain/       # 데이터베이스 및 도메인 모델
├── dto/          # 화면·REST·WebSocket 전달 객체
├── exception/    # WebSocket 및 도메인 예외
├── security/     # 인증 사용자와 방 접근 검증
├── service/      # 인증, 방, 참가자 상태, 채팅 비즈니스 로직
└── MafiagameApplication.java

src/main/resources/
├── mappers/      # MyBatis XML Mapper
├── static/       # CSS, JavaScript, 이미지
└── templates/    # Thymeleaf 화면

test/
├── java/         # Java 단위·통합 테스트
└── js/           # JavaScript 단위 테스트
```

## 범위와 후순위 기능

현재 MVP에서는 다음 기능을 후순위로 둡니다.

- 초대 URL·초대 코드, 관전자, 강퇴, 재대결
- 친구, 신고, 랭킹 및 상세 전적
- 음성 채팅, 아이템·재화·상점
- 다중 서버 운영, Redis 기반 분산 게임 상태

현재 게임 상태는 단일 서버의 메모리 기반 관리가 전제입니다. 다중 서버 확장은 게임 상태 저장소와 이벤트 브로커를 별도로 도입하는 단계에서 검토합니다.

## 검증

기능을 변경한 뒤 다음 명령으로 Java와 JavaScript 테스트를 함께 확인합니다.

```powershell
npm ci
.\gradlew.bat test
```

JavaScript 테스트만 실행하려면 다음 명령을 사용합니다.

```powershell
npm run test:js
```
