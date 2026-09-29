# MAFIAGAME 최종 프로젝트 문서

## 1. 마감 전 긴급 검토 의견 (Issues & Action Items)

| 우선순위 | 검토 의견 | 제출 전 조치 | 상태 |
| --- | --- | --- | --- |
| 높음 | 게임방 도움말의 고정 문구가 실제 역할 구성·승리 조건·첫 밤 순서와 상충함. 5인 스파이·8인부터 영매사·마피아팀 인원 초과 승리 안내는 현재 [역할·승리 규칙](../src/main/java/kr/or/oti/mafiagame/service/RoomGameRules.java) 및 [페이즈 전환](../src/main/java/kr/or/oti/mafiagame/service/RoomGameService.java)과 다름. | [게임방 화면](../src/main/resources/templates/rooms/detail.html)의 고정 도움말을 실제 규칙 기준으로 정정함. | 완료 |
| 높음 | 회원가입 화면의 이용약관·개인정보 처리방침 링크가 `#`이고, 동의 체크박스에 제출용 `name`이 없음. 브라우저의 `required` 검사 외 서버 측 동의 확인이 없음. | 이용약관·개인정보 처리방침을 각각 상세 모달로 제공하고, 동의 여부를 회원가입 요청에서 서버 검증함. 동의 이력은 별도로 저장하지 않음. | 완료 |
| 높음 | [WebSocket 설정](../src/main/java/kr/or/oti/mafiagame/config/WebSocketConfig.java)은 `/ws`에 `https://mafiaweb01.duckdns.org` Origin만 허용함. [README](../README.md)의 `http://localhost:8080` 접속 안내만으로는 로컬 실시간 게임을 재현할 수 없음. | [확인 필요: 제출 시 사용할 웹 Origin과 로컬 개발용 Origin 정책]. 허용 Origin에서 WebSocket 연결 확인 필요. | 이번 범위 제외 |
| 중간 | 2026-09-21~23일 [MVP 문서](./MAFIAGAME_MVP.md)·[기능 구현 리스트](./FEATURE_IMPLEMENTATION_LIST.md)에 옛 페이즈 시간, 역할 확인 뒤 낮 시작, 전적 미구현 설명이 남아 있음. 현재 코드는 역할 확인 뒤 첫 밤, `15/60/20/20/20/35`초, 게임별 중복 방지 통계 갱신을 사용함. | 두 문서 상단의 작성 시점 안내와 제출 기준 안내를 확인함. 제출 기준은 이 문서와 현재 소스코드로 통일함. | 완료 |
| 중간 | README의 기존 `Node.js 18 이상` 안내는 [`package-lock.json`](../package-lock.json)의 `jsdom` 실행 요구(20계열은 20.19 이상, 22계열은 22.12 이상, 24 이상)와 상충함. | README의 사전 요구사항이 잠금 파일 기준과 일치하는지 확인함. | 완료 |
| 중간 | README의 기존 0.1.0 개요 링크와 MVP 문서의 옛 QA 통합 보고서 링크는 현재 작업 트리에서 대상 파일이 없음. | README와 MVP 문서의 최종 문서·QA 통합 보고서 링크 및 대상 파일을 확인함. | 완료 |
| 중간 | [기본 SQL](../mafiasql.sql)에는 주요 테이블이 있고 [Flyway 마이그레이션](../src/main/resources/db/migration/V1__create_game_completion.sql)이 있으나, 빈 MariaDB 스키마 생성·초기 SQL 적용·기존 데이터 이관의 단일 재현 절차는 확정되지 않음. | [확인 필요: 신규 DB 설치 순서와 기존 데이터의 중복 닉네임 정리 절차]. 특히 [V2 닉네임 유일 제약](../src/main/resources/db/migration/V2__unique_user_name.sql) 적용 전 기존 중복 확인 필요. | 이번 범위 제외 |
| 중간 | 이탈 유예 만료로 게임이 조기 종료될 때 남아 있는 페이즈 타이머가 종료 상태·개인 결과를 재전송할 가능성이 정적 검토에서 발견됨. 실행 재현 결과는 없음. | [확인 필요: 조기 종료와 원래 타이머 만료 시 WebSocket 결과 중복 여부]. 전적 중복 저장과 메시지 중복 전송을 구분해 확인할 것. [장애 기록](./TROUBLESHOOTING_HISTORY.md) 참조. | 이번 범위 제외 |
| 중간 | 최신 확인 가능한 [2026-09-28 Regression QA](./QA_report/MAFIAGAME_QA_REPORT_2026-09-28_qa-20260928-200203-833.md)는 통과했으나, 5·7인 전체 경기와 실제 페이즈 시간, Full 진행 녹화는 해당 실행 범위 밖임. | [확인 필요: 제출 평가 기준에 Full QA 증거가 필요한지]. 필요한 경우 프로필을 명시해 별도 실행할 것. | 이번 범위 제외 |

## 2. 프로젝트 최종 문서

### 2.1. 프로젝트 개요 (Overview)

| 항목 | 내용 |
| --- | --- |
| 프로젝트 | MAFIAGAME — 브라우저 기반 실시간 마피아 게임 |
| 기준 | 2026-09-29 작업 트리, Gradle 프로젝트 버전 `0.5.1-alpha` ([build.gradle](../build.gradle)) |
| 목적 | 별도 게임 클라이언트 설치 없이 4~8명이 같은 방에서 역할 배정, 토론, 투표, 밤 행동, 승패 확인, 재대결을 완료하도록 함. |
| 해결 문제 | 참가자별 비밀 정보와 공개 상태를 구분하고, 페이즈·행동 유효성·승리 판정을 서버에서 일관되게 관리함. 재접속과 이탈 시 방 상태 동기화도 제공함. |
| 구현 결과 | 계정 인증, 로비·방, 실시간 채팅, 4~8인 역할 구성, 서버 기준 게임 진행, 결과 표시, 같은 방 재대기, 완료 게임 중복 방지 통계 갱신 구현. |
| 검증 근거 | 2026-09-28 Regression 보고서에서 Java 153/153, JavaScript 45/45, Playwright 핵심 3/3·UI 2/2 통과. 이는 해당 날짜·프로필의 결과이며, 이 문서 작성 중 새 QA를 실행한 결과가 아님. |

핵심 구현과 검증의 상세 근거는 [요구사항 명세](./REQUIREMENTS_SPECIFICATION.md), [UI 명세](./UI_SPECIFICATION.md), [통합 문서](./MAFIAGAME_INTEGRATED_DOCUMENTATION.md), [Regression QA 보고서](./QA_report/MAFIAGAME_QA_REPORT_2026-09-28_qa-20260928-200203-833.md)에 기록함. 이용자 수·동시 접속 처리량·가용성 등 운영 성과 지표는 이 자료에서 확인되지 않음. [확인 필요: 제출 양식이 정량 성과를 요구하는 경우 측정 자료].

### 2.2. 주요 기능 및 스펙 (Key Features & Specifications)

| 영역 | 현재 동작 |
| --- | --- |
| 계정 | 닉네임·이메일·비밀번호 가입, 로그인·로그아웃, Spring Security 접근 제어. 비밀번호는 BCrypt로 저장함. |
| 로비·게임방 | 방 목록·검색·생성·입장, 4~8명 정원과 선택적 방 비밀번호, 방장 설정·시작 권한, 참가자·Ready·방장 상태 동기화. |
| 실시간 통신 | `/ws` STOMP 연결, `/app` 요청과 `/topic`·`/queue` 구독. 공개·마피아·사망자 채팅을 상태와 역할에 따라 분리함. |
| 게임 진행 | 방장이 최소 4명과 참가자 전원 Ready를 충족하면 시작. 역할을 개인 큐로 전달하고, 서버가 페이즈·투표·밤 행동·승패를 판정함. |
| 복귀·재대결 | 게임 중 마지막 연결 종료 뒤 기본 30초 이탈 유예. 종료 뒤 동일 게임방을 `WAITING`으로 돌리고 Ready를 초기화함. |
| 결과·계정 통계 | 승리 진영·역할·생존 결과 표시. `game_completion.game_id`로 완료 경기 중복 반영을 막고 `user_stats`에 총 경기·승·패·경험치 누계 반영. |

게임 시작 시 **실제 참가자 수**에 따른 역할 구성은 다음과 같음([`RoomGameRules`](../src/main/java/kr/or/oti/mafiagame/service/RoomGameRules.java)).

| 인원 | 역할 구성 |
| ---: | --- |
| 4명 | 마피아 1, 경찰 1, 의사 1, 시민 1 |
| 5명 | 마피아 1, 경찰 1, 의사 1, 시민 2 |
| 6명 | 마피아 1, 스파이 1, 경찰 1, 의사 1, 군인 1, 시민 1 |
| 7명 | 마피아 2, 경찰 1, 의사 1, 군인 1, 영매사 1, 시민 1 |
| 8명 | 마피아 2, 스파이 1, 경찰 1, 의사 1, 군인 1, 영매사 1, 시민 1 |

시민 진영은 생존 마피아팀이 0명이면 승리함. 그 외에는 생존 마피아와 **접선한** 생존 스파이의 수가 생존 시민 진영 수 이상이면 마피아 진영이 승리함. 접선하지 않은 스파이는 마피아팀 소속이지만 이 동수 판정 인원에서 제외함.

### 2.3. 시스템 구조 및 흐름 (Architecture & Workflow)

```text
브라우저(Thymeleaf가 렌더링한 HTML · JavaScript)
  ├─ HTTP ─> Spring MVC / Security ─> 서비스 ─> MyBatis ─> MariaDB
  └─ STOMP /ws ─> WebSocket 컨트롤러 ─> 방·게임 서비스
                                         ├─ 프로세스 메모리: 접속·Ready·게임·페이즈
                                         └─ Simple Broker: 공개 상태 / 개인 큐 전송
```

1. 로그인 후 방을 만들거나 입장함. 계정·방의 기본 정보는 MariaDB를 사용하고, 실시간 접속·Ready 상태는 [`RoomPresenceService`](../src/main/java/kr/or/oti/mafiagame/service/RoomPresenceService.java)가 관리함.
2. 참가자가 `/ws`로 연결하고 구독함. 방장이 시작 조건을 충족해 게임을 시작하면 [`RoomGameService`](../src/main/java/kr/or/oti/mafiagame/service/RoomGameService.java)가 역할과 게임 ID를 생성함. 개인 역할은 개인 큐로 전달하고 공개 상태에는 포함하지 않음.
3. 기본 페이즈 시간은 `ROLE_ASSIGNMENT`(15초 또는 전원 확인) → **첫 `NIGHT`**(35초) → `DAY_DISCUSSION`(60초) → `NOMINATION_VOTE`(20초) → 후보가 있을 때 `FINAL_DEFENSE`(20초)·`EXECUTION_VOTE`(20초) → `NIGHT`(35초) 순서임. 승리 조건이 성립하면 `FINISHED`로 종료함. QA용 `MAFIAGAME_PHASE_PROFILE=short`에서는 종료 외 페이즈가 3초임([`GamePhase`](../src/main/java/kr/or/oti/mafiagame/dto/GamePhase.java)).
4. 투표·밤 행동은 현재 게임, 페이즈, 종료 시각, 생존·역할, 대상 유효성 및 중복 제출을 서버에서 확인함. 결과는 공개 상태와 해당 개인 메시지로 전달함.
5. 완료 경기의 ID·방 ID·승리 진영·완료 시각을 `game_completion`에 저장하고, 참가자 누적 통계를 갱신함([`GameResultStatsService`](../src/main/java/kr/or/oti/mafiagame/service/GameResultStatsService.java)). 방은 삭제하지 않고 재대기 상태로 전환함.

게임 진행·접속 상태와 내장 Simple Broker는 한 서버 프로세스의 메모리에 의존함. DB에는 계정, 누적 통계, 방 기본 정보와 완료 경기 식별·승리 진영이 남지만 **개인별 경기 상세 이력**은 저장하지 않음. 프로세스 재시작 또는 다중 인스턴스 운영 시 진행 중 게임 상태를 공유·복구하는 구조는 확인되지 않음.

### 2.4. 실행 및 테스트 방법 (Setup & Verification)

| 준비 항목 | 현재 설정·근거 |
| --- | --- |
| 런타임 | JDK 17([build.gradle](../build.gradle)). JavaScript 테스트 도구는 Node.js 20.19 이상(20계열), 22.12 이상(22계열) 또는 24 이상 및 npm 필요([`package-lock.json`](../package-lock.json)의 `jsdom` 요구 버전). |
| DB | MariaDB. 기본 URL `jdbc:mariadb://localhost:23306/mafiaweb`; 인증은 `DB_USERNAME`, `DB_PASSWORD` 환경 변수 사용([application.properties](../src/main/resources/application.properties)). DB 포트 `23306`은 웹 서버 포트 `8080`과 구분함. |
| 스키마 | 주요 테이블은 [`mafiasql.sql`](../mafiasql.sql), 완료 경기·닉네임 유일 제약 변경은 [Flyway 마이그레이션](../src/main/resources/db/migration/V2__unique_user_name.sql)에 정의됨. [확인 필요: 신규·기존 DB별 적용 순서 및 실제 환경에서의 재현 결과]. |
| 화면 접속 | 기본 웹 주소 `http://localhost:8080`. 실시간 게임은 위 검토 의견의 WebSocket Origin 제약 확인 필요. |

Windows PowerShell에서 의존성을 설치하고 테스트·서버를 실행하는 기본 명령은 다음과 같음. DB 계정 환경 변수를 먼저 설정하되 실제 비밀번호를 문서·명령 로그에 남기지 말 것.

```powershell
npm ci
.\gradlew.bat test
.\gradlew.bat bootRun
```

`gradlew.bat test`는 Java 테스트와 `npm run test:js`를 함께 실행하도록 구성됨. macOS·Linux에서는 `./gradlew` 사용. 이 문서 작성 작업에서는 명령을 실행하지 않았으며, 현재 작업 트리의 PASS를 주장하지 않음.

브라우저 E2E를 포함한 QA 실행은 [QA 실행 절차](./QA_scripts/MAFIAGAME_QA_TEST_EXECUTION_SCRIPT.md)에 따라 **매 실행마다** 프로필을 명시해 진행함. Smoke는 약 5~10분, Regression은 약 15~25분, Full은 60분 이상이며 환경에 따라 더 걸릴 수 있음. 프로필 선택 전 DB 사전 점검·테스트·서버 기동을 시작하지 않음. Full에는 실제 페이즈 시간과 전용 화면 녹화 검증이 포함됨. 2026-09-28 Regression 결과는 위 표기된 범위에서만 유효하며 5·7인 전체 경기와 Full 검증을 대신하지 않음.

### 2.5. 한계점 및 향후 개선 사항 (Limitations & Known Issues)

| 현재 한계·이슈 | 영향 및 후속 과제 |
| --- | --- |
| 서버 프로세스 메모리의 게임·접속 상태 | 재시작 복구·다중 서버 공유가 구현되어 있지 않음. 운영 요구가 생기면 공유 상태 저장과 분산 메시징 설계 필요. |
| 경기별 상세 기록 부재 | `game_completion`은 완료 식별·승리 진영만 저장하고 개인 역할·행동·승패 상세 내역은 누적 통계로만 반영함. 상세 전적 화면은 별도 저장 모델 필요. |
| 개인정보 처리방침 운영정보 미확정 | 실제 보유기간, 탈퇴·삭제 요청 경로, 개인정보 보호책임자·문의처, 처리 위탁·제공 여부를 확정해 정식 방침에 반영해야 함. |
| 고정 WebSocket Origin | 제출·운영 주소와 로컬 개발 주소의 허용 정책 [확인 필요: 실제 배포 Origin]. |
| 조기 종료 시 종료 메시지 중복 가능성 | 정적 검토상 후보이며 장애 확정 아님. [확인 필요: 타이머 만료 전후 실행 재현 결과]. |
| 최신 인용 QA의 범위 | 2026-09-28 Regression은 통과했으나 5·7인 전체 경기는 `NOT RUN`, Full 전용 진행 녹화는 해당 프로필에서 `NOT REQUIRED`임. 제출 요구에 따른 추가 검증 필요. |
