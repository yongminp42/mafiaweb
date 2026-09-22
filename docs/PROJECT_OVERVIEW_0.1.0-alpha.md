# MAFIAGAME

Spring Boot와 Thymeleaf로 구현한 브라우저 기반 실시간 마피아 게임 프로젝트입니다. 별도의 프로그램 설치 없이 4~8명의 사용자가 웹 브라우저에서 방에 모여 대기방 준비, 방장 게임 시작, 개인 역할 확인, 서버 기준 페이즈 자동 전환(낮·지목 투표·처형 투표·밤), 역할별 밤 행동 및 승패 판정을 거쳐 결과를 확인하고 같은 게임방에서 다시 대기하여 반복 플레이할 수 있도록 구현되어 있습니다.

상세 요구사항과 전체 개발 체크리스트는 [MAFIAGAME_MVP.md](./MAFIAGAME_MVP.md)를 기준으로 합니다.

## 문서 안내

프로젝트 관련 문서는 이 문서가 위치한 `docs/` 폴더에서 관리합니다.

| 문서 | 용도 및 설명 |
| --- | --- |
| [MAFIAGAME_MVP.md](./MAFIAGAME_MVP.md) | MVP의 목표, 핵심 게임 규칙, 기능 범위, 게임 진행 흐름, 승리 조건, 완료 기준과 검증 체크리스트를 정의한 기획·개발 문서 |
| [PROJECT_LEARNING_GUIDE.md](./PROJECT_LEARNING_GUIDE.md) | 현재 프로젝트의 구조, 기술 스택, 주요 클래스와 코드 흐름을 학습 목적으로 설명하는 개발 가이드 |
| [LOGIN.md](./LOGIN.md) | 회원가입·로그인·로그아웃 동작, DB 준비 사항과 인증 관련 검증 방법을 설명하는 기능 문서 |
| [MAFIAGAME_QA_REPORT_CONSOLIDATED_2026-09-18.md](./QA_report/MAFIAGAME_QA_REPORT_CONSOLIDATED_2026-09-18.md) | 프로젝트 QA 및 E2E 테스트 결과를 종합 정리한 QA 보고서 |

## 핵심 게임 규칙 및 역할

### 1. 역할 (Roles)

| 역할 | 진영 | 주요 행동 및 규칙 |
| --- | --- | --- |
| **마피아** (`MAFIA`) | 마피아 | 밤마다 생존 플레이어 1명을 제거 대상으로 지목합니다. 마피아가 여러 명인 경우 최다 지목 대상(동률 시 무작위 1인)을 최종 제거합니다. |
| **경찰** (`POLICE`) | 시민 | 밤마다 생존 플레이어 1명을 조사하여 마피아(`MAFIA`)인지 시민 진영(`CITIZEN`)인지 판별합니다. 조사 결과는 경찰 본인에게만 비공개 전달됩니다. |
| **의사** (`DOCTOR`) | 시민 | 밤마다 생존 플레이어 1명을 선택하여 보호합니다. 마피아의 최종 제거 대상과 일치할 경우 해당 플레이어는 사망하지 않습니다. |
| **시민** (`CITIZEN`) | 시민 | 특수 밤 행동은 없으며, 낮 토론과 지목/처형 투표를 통해 마피아를 색출합니다. |

- **사망자 규칙**: 사망한 플레이어는 이후 투표 및 밤 행동에 참여할 수 없습니다.
- **역할 비공개 원칙**: 역할은 게임 시작 시 개인 큐(`/user/queue/game-role`)로만 전달되며 공개 브로드캐스트 토픽에는 노출되지 않습니다.

### 2. 게임 페이즈 및 진행 흐름

서버가 단일 게임 상태 모델과 타이머를 엄격하게 관리합니다.

```text
WAITING (대기방)
  → [방장 시작 + 4인 이상 + 전원 Ready]
  → DAY_DISCUSSION (낮 토론, 60초)
  → NOMINATION_VOTE (지목 투표, 15초)
  → EXECUTION_VOTE (처형 투표, 15초 / 최다 지목 동률 또는 무투표 시 처형 건너뛰고 NIGHT로 이동)
  → NIGHT (밤 행동, 30초: 마피아 제거 / 의사 보호 / 경찰 조사)
  → 승패 판정 후 DAY_DISCUSSION (다음 날 낮 순환) 또는 FINISHED (결과 확인 및 대기방 복귀)
```

### 3. 투표 규칙

- **지목 투표 (`NOMINATION_VOTE`)**:
  - 생존자만 투표할 수 있으며, 자기 자신은 지목할 수 없습니다.
  - 최다 득표자 1인이 단독일 경우 처형 후보(`nominatedUserId`)로 확정됩니다.
  - 최다 득표자가 동률이거나 투표가 없으면 처형 투표를 건너뛰고 즉시 밤(`NIGHT`)으로 전환됩니다.
- **처형 투표 (`EXECUTION_VOTE`)**:
  - 지목된 처형 후보자는 투표권이 없습니다.
  - 찬성 표가 반대 표보다 많을 때(`찬성 > 반대`) 처형이 집행되어 플레이어가 탈락(`alive: false`) 처리됩니다.
  - 동률이거나 반대가 많으면 처형되지 않고 생존합니다.

### 4. 승리 조건

투표 및 밤 행동 처리 직후 서버에서 승패를 즉시 판정합니다.

- **시민 진영 승리**: 모든 마피아가 사망한 경우 (`mafiaAlive == 0`)
- **마피아 진영 승리**: 생존 마피아 수가 생존 시민 진영 수보다 많아진 경우 (`mafiaAlive > citizenFactionAlive`)
- **결과 후 재대기**: 게임 종료(`FINISHED`) 시 승리 진영, 본인 역할, 생존 여부를 확인한 후 게임방 상태가 자동으로 `WAITING`으로 복귀하고 모든 참가자의 Ready가 초기화되어 같은 방에서 바로 재플레이할 수 있습니다.

## 현재 구현 범위

- **회원 인증 및 보안 접근 제어**
  - 회원가입, 로그인, 로그아웃 및 BCrypt 비밀번호 단방향 암호화
  - Spring Security 및 인터셉터 기반 보호 URL/WebSocket 목적지 인가
- **게임 로비 및 방 관리**
  - MariaDB/MyBatis 기반 영속 데이터 처리 (방 목록, 상태 필터, 제목 검색)
  - 4~8명 정원 및 선택적 비밀번호 방 생성/입장 검증
  - 실시간 로비 온라인 접속자 수의 중복 없는 집계 및 표시
- **실시간 대기방 동기화**
  - STOMP WebSocket 기반 참가자 목록, 준비(Ready) 상태, 방장 표시 동기화
  - 동일 사용자의 다중 탭/세션 중복 제거 및 타 방 이동 시 이전 세션 자동 정리
  - 방장 퇴장 시 자동 방장 위임 및 빈 방 자동 정리 (15초 유예 시간)
  - 대기방 실시간 공개 채팅
- **게임 시작 검증 및 서버 상태 전이**
  - 방장 전용 게임 시작 버튼 제어 및 최소 4명·전원 Ready 서버 검증
  - 조건 충족 시 `WAITING` → `PLAYING` 전환 및 참가자 전원 실시간 방송
- **서버 주도 페이즈 및 타이머**
  - 서버 기준 낮(60초) → 지목 투표(15초) → 처형 투표(15초) → 밤(30초) 자동 순환
  - 서버 종료 시각(`phaseEndsAt`) 전달을 통한 브라우저 간 타이머 2초 이내 동기화
  - 새로고침 및 재접속 시 현재 페이즈/남은 시간/본인 역할 즉시 복구
- **투표, 밤 행동 및 승패 루프**
  - 지목 투표 및 처형 투표 다수결/탈락 처리
  - 마피아 제거, 의사 보호(사망 면제), 경찰 조사 결과 개인 큐 통보
  - 승패 판정 후 결과 표시 및 동일 방 `WAITING` 리셋

## 후속 추가 기능 (Should Have / Won't Have)

- 마피아 전용 밤 비밀채팅
- 낮 건너뛰기 조기 투표
- 초대 URL / 초대 코드
- 게임 이력 저장 및 전적/랭킹
- 음성 채팅 및 관전자 모드 (MVP 제외 범위)

## 기술 스택

| 구분 | 기술 |
| --- | --- |
| Language | Java 17 |
| Framework | Spring Boot 3.5.16 |
| Web | Spring MVC, Thymeleaf |
| Security | Spring Security, BCrypt |
| Realtime | Spring WebSocket, STOMP |
| Data access | MyBatis Spring Boot Starter 3.0.5 |
| Database | MariaDB (로컬 23306), H2 In-Memory (테스트용) |
| Frontend | HTML5, CSS3, Bootstrap 5.3.8, Vanilla JavaScript (ES6) |
| Build | Gradle Wrapper 8.14.5 |
| Test | JUnit 5, Mockito, Node.js built-in test runner, jsdom, Playwright |

## 실행 방법

### 사전 요구사항

- JDK 17
- Node.js (v18+)와 npm
- MariaDB (포트 23306 또는 환경 설정 기준)

DB 접속 정보는 환경 변수로 설정할 수 있습니다.

```powershell
# 로컬 개발 예시: 애플리케이션 전용 DB 계정을 사용하세요.
$env:DB_USERNAME = "mafia_app"
$env:DB_PASSWORD = "replace-with-a-strong-local-password"
```

### Windows

의존성을 설치한 뒤 테스트 및 애플리케이션을 실행합니다.

```powershell
npm ci
.\gradlew.bat test
.\gradlew.bat bootRun
```

### macOS / Linux

```bash
npm ci
./gradlew test
./gradlew bootRun
```

실행 후 브라우저에서 [http://localhost:8080](http://localhost:8080)으로 접속할 수 있습니다.

## 환경 변수와 기본 설정

`src/main/resources/application.properties`의 기본 설정:

| 항목 | 기본값 |
| --- | --- |
| URL | `jdbc:mariadb://localhost:23306/mafiaweb` |
| 사용자명 | `DB_USERNAME` (로컬 개발용 애플리케이션 계정 권장) |
| 비밀번호 | `DB_PASSWORD` (강력한 비밀번호 사용) |
| 빈 방 정리 유예 시간 | `15s` (`mafiagame.room.empty-cleanup-delay`) |

## 주요 URL

| URL | 설명 |
| --- | --- |
| `/` 또는 `/rooms` | 게임 로비 (방 목록, 검색, 온라인 인원) |
| `/rooms/new` | 게임방 생성 |
| `/rooms/{roomId}` | 대기방 및 게임 진행 화면 |
| `/login` | 로그인 |
| `/signup` | 회원가입 |

## 프로젝트 구조

```text
docs/               # MVP 문서, 학습 가이드, 인증 문서 및 QA 보고서
src/main/java/kr/or/oti/mafiagame/
├── config/       # Spring Security, WebSocket 설정 및 인터셉터
├── controller/   # 인증, 로비, 방, 대기방 상태, 게임 진행, 채팅 컨트롤러
├── dao/          # MyBatis Mapper 인터페이스
├── domain/       # User, Room, UserStats 엔티티
├── dto/          # 게임 페이즈, 투표/행동 요청, 프레즌스 등 DTO
├── exception/    # WebSocket 및 게임 도메인 예외
├── security/     # CustomUserDetails, 권한 검증 및 세션 관리
└── service/      # 인증, 방 관리, 프레즌스(대기방), 게임 엔진(RoomGameService), 채팅 서비스

src/main/resources/
├── mappers/      # MyBatis XML 매퍼 파일
├── static/       # CSS 및 클라이언트 JS (chat.js, room-list.js, stomp-client.js)
└── templates/    # Thymeleaf 화면 템플릿

test/
├── java/         # Java 단위 및 슬라이스 테스트
├── js/           # JavaScript STOMP 클라이언트 및 렌더링 단위 테스트
└── e2e/          # Playwright 기반 4~8인 다중 세션 E2E 통합 테스트
```

## 검증 및 테스트 실행

### 1. 전체 단위 테스트 (Java + JS)

```powershell
npm ci
.\gradlew.bat test
```

### 2. JavaScript 단위 테스트

```powershell
npm run test:js
```

### 3. Playwright 다중 브라우저 E2E 테스트

로컬 서버(`http://127.0.0.1:8080`) 기동 상태에서 실행:

```powershell
npx playwright install chromium
$env:PLAYER_COUNTS = "4"
npm run test:e2e -- --workers=1
```
