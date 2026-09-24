# MAFIAGAME QA 보고서 — 2026-09-22

- 포함 보고서 수: 4
- 날짜 및 실행 시각 순서: 오래된 보고서부터

## 목차

1. `MAFIAGAME_QA_REPORT_2026-09-22_qa-20260922-000243.md`
2. `MAFIAGAME_QA_REPORT_2026-09-22_qa-20260922-111137.md`
3. `MAFIAGAME_QA_REPORT_2026-09-22_qa-20260922-135034.md`
4. `MAFIAGAME_QA_REPORT_2026-09-22_qa-20260922-144340.md`

---

## 문서 1: `MAFIAGAME_QA_REPORT_2026-09-22_qa-20260922-000243.md`

# MAFIAGAME QA Report

- 실행일: 2026-09-22 (Asia/Seoul)
- 실행 ID: `qa-20260922-000243`
- 최종 판정: **PASS**

## 1. 실행 환경

- 프로젝트: `C:\workspace\mafiaweb`
- OS/shell: Windows PowerShell
- Java: `22.0.1`
- Node.js: `v24.19.0`
- npm: `11.17.0`
- Playwright: `1.63.0`
- QA 서버: `http://127.0.0.1:18080`
- 기존 개발/프리뷰 서버 포트 8080은 종료하거나 변경하지 않았다.

## 2. MariaDB 사전 점검 및 의존성

- MariaDB TCP 사전 점검: `127.0.0.1:23306` 연결 가능
- Node/npm/jsdom/Playwright 사전 점검: 모두 사용 가능
- 애플리케이션 기동 및 JDBC 연결: 성공
- 독립 MariaDB CLI는 PATH에서 확인되지 않아 Gradle 캐시의 MariaDB JDBC 드라이버로 정리 트랜잭션을 실행했다.

실제 사전 점검 출력:

```text
ProjectPath C:\workspace\mafiaweb
MariaDB True (127.0.0.1:23306)
Node True
Npm True
Jsdom True
Playwright True
```

## 3. 확인한 파일과 디렉터리

- `src/main/resources/static/css/app.css`
- `src/main/resources/static/js/chat.js`
- `src/main/resources/templates/rooms/detail.html`
- `test/js/chat.test.js`
- `test/e2e/mafia-mvp.spec.js`
- `test/e2e/chat-scroll.spec.js`
- `test/e2e/room-layout.spec.js`
- `docs/MAFIAGAME_MVP.md`
- `docs/QA_scripts/MAFIAGAME_QA_TEST_EXECUTION_SCRIPT.md`
- `test-results/.last-run.json`
- `output/chat-scroll-test-qa-20260922-000243/`
- `output/room-layout-test-8-qa-20260922-000243/`

## 4. 실행 명령

Java 테스트:

```powershell
$env:GRADLE_USER_HOME='C:\workspace\mafiaweb\.gradle-test'
.\gradlew.bat test --no-daemon --rerun-tasks -x jsTest
```

JavaScript 테스트:

```powershell
node --test --test-isolation=none test/js/stomp-client.test.js test/js/room-list.test.js test/js/chat.test.js
```

Playwright 테스트 발견:

```powershell
$env:BASE_URL='http://127.0.0.1:18080'
$env:PLAYER_COUNTS='4,5,6,8'
$env:E2E_RUN_ID='qa-20260922-000243'
$env:E2E_CAPACITY='8'
npm.cmd run test:e2e -- --list --workers=1
npm.cmd run test:e2e:ui -- --list --workers=1
```

핵심 E2E:

```powershell
npm.cmd run test:e2e -- --workers=1 --retries=0 --reporter=list
```

UI 회귀 E2E:

```powershell
npm.cmd run test:e2e:ui -- --workers=1 --retries=0 --reporter=list
```

## 5. Java 테스트 결과

실제 JUnit XML 집계 출력:

```text
JAVA_XML_FILES=11 JAVA_TESTS=103 JAVA_FAILURES=0 JAVA_ERRORS=0 JAVA_SKIPPED=0
```

- 결과: **PASS**
- 11개 테스트 스위트, 103건 실행
- 실패 0, 오류 0, 스킵 0
- 오류 메시지: 없음

## 6. JavaScript 테스트 결과

- 대상: `stomp-client.test.js`, `room-list.test.js`, `chat.test.js`
- 결과: **25 passed, 0 failed, 0 cancelled, 0 skipped, 0 todo**
- 채널별 `PUBLIC`/`MAFIA`/`DEAD` 클래스 분리 테스트: PASS
- `NIGHT`에서 `night-phase` 적용 및 낮/종료 시 제거 테스트: PASS
- 오류 메시지: 없음

## 7. 서버 기동 및 헬스 체크

- `bootRun`을 QA 전용 포트 18080으로 기동했다.
- `/login` 헬스 체크: HTTP 200
- stdout: `test-results/bootRun.qa-20260922-000243.stdout.log`
- stderr: `test-results/bootRun.qa-20260922-000243.stderr.log` (0 bytes)
- 테스트와 정리 완료 후 18080 리스너가 없는 것을 확인했다.
- 기존 8080 서버는 대상에서 제외했다.

## 8. Playwright 발견 및 전체 결과

발견 결과:

- 핵심 E2E: 6건
  - 4인 핵심 게임 흐름
  - 5인 핵심 게임 흐름
  - 6인 핵심 게임 흐름
  - 8인 핵심 게임 흐름
  - 대기방 탭 종료 시 6인→5인 역할 임계값
  - 브라우저 마감·재접속 유예·만료된 밤 행동
- UI 회귀 E2E: 2건
  - 채팅 스크롤 및 역할 슬롯
  - 8인 대기/시작 게임방 레이아웃
- 요청 워커: 1
- 재시도: 0
- 실제 핵심 E2E 결과: **6 passed (41.1m)**
- 실제 UI 회귀 결과: **2 passed (1.6m)**
- `test-results/.last-run.json`: `{"status":"passed","failedTests":[]}`

## 9. 시나리오별 결과

| 시나리오 | 결과 | 실제 소요 시간 |
|---|---:|---:|
| 4인 핵심 게임 흐름 | PASS | 9.4m |
| 5인 핵심 게임 흐름 | PASS | 9.3m |
| 6인 핵심 게임 흐름 | PASS | 9.4m |
| 8인 핵심 게임 흐름 | PASS | 9.5m |
| 대기방 탭 종료 6인→5인 임계값 | PASS | 12.6s |
| 브라우저 마감·재접속·만료 밤 행동 | PASS | 2.1m |
| 채팅 스크롤 및 역할 슬롯 UI | PASS | 4.1s |
| 8인 게임방 UI 레이아웃·배경 전환 | PASS | 14.6s |

핵심 E2E 실제 콘솔 출력:

```text
ok 1 ... MVP 4인 핵심 게임 흐름 ... (9.4m)
ok 2 ... MVP 5인 핵심 게임 흐름 ... (9.3m)
ok 3 ... MVP 6인 핵심 게임 흐름 ... (9.4m)
ok 4 ... MVP 8인 핵심 게임 흐름 ... (9.5m)
ok 5 ... closing a waiting-room tab changes six players to the five-player role threshold (12.6s)
ok 6 ... browser deadline, reconnect grace, and expired night action (2.1m)
6 passed (41.1m)
```

UI 회귀 실제 콘솔 출력:

```text
ok 1 ... role slot is visible before game and chat scrolls without growing the page (4.1s)
ok 2 ... waiting and started room layout (8 players) (14.6s)
2 passed (1.6m)
```

## 10. MVP 검증 표

| 검증 항목 | 결과 | 근거 |
|---|---:|---|
| 인증·방 참가·참가자 수 동기화 | PASS | 4/5/6/8인 핵심 E2E |
| `ROLE_ASSIGNMENT` 역할 전달은 개인 큐이고 공개 게임 상태에 역할이 노출되지 않음 | PASS | JavaScript 및 핵심 E2E |
| 생존자 역할 확인은 1회만 가능하고 중복 확인은 거부됨 | PASS | `chat.test.js` 및 핵심 E2E |
| 모든 역할 확인 또는 약 15초 후 역할 단계 전환 | PASS | 핵심 E2E 페이즈/타이머 검증 |
| `FINAL_DEFENSE` 단일 지명자 및 약 20초 제한 | PASS | 핵심 E2E |
| 최종 변론 중 지명자만 전체 채팅 가능, 비지명자 거부 | PASS | `chat.test.js` 및 핵심 E2E |
| 지명자 이탈 시 처형을 건너뛰고 밤으로 전환 | PASS | 핵심 E2E |
| 서버 페이즈 시간: 역할 15초, 낮 토론 60초, 지목 투표 20초, 최종 변론 20초, 처형 투표 20초, 밤 35초 | PASS | 서버 상태 trace 및 E2E 시간 assertion |
| 공개/마피아/사망자 채널 말풍선 클래스 분리 | PASS | `chat.test.js` 신규 채널 테스트 |
| 게임 목록 링크가 실제 게임방 좌측 상단의 버튼 스타일로 표시됨 | PASS | `room-layout.spec.js`, 실제 `/rooms/{roomId}` 스크린샷 |
| 밤 상태에서 웹페이지 배경만 회색으로 바뀌고 링크 색상은 유지됨 | PASS | `room-layout.spec.js` |
| 밤 진입/종료 시 배경색 transition이 양방향으로 적용됨 | PASS | `background-color`, `0.8s`, night/restored assertion |
| 실제 게임방 서버 렌더링과 스크린샷·영상 생성 | PASS | UI 회귀 E2E 산출물 |

## 11. 실패 및 차단 항목

- 애플리케이션 테스트 실패: 없음
- 테스트 코드 실패: 없음
- Playwright 실패/중단: 없음
- 차단(`BLOCKED`) 항목: 없음
- 최초의 수동 JShell 정리 입력은 함수 정의 순서 오류로 실행되지 않았으나 SQL 변경 없이 종료되었고, JDBC 정리 프로그램으로 즉시 재실행해 최종 정리를 PASS 처리했다. 이는 애플리케이션 테스트 실패가 아니다.

## 12. 재현 절차

1. MariaDB `127.0.0.1:23306`가 실행 중인지 확인한다.
2. QA 서버를 18080 포트로 기동하고 `/login` HTTP 200을 확인한다.
3. 아래 환경 변수를 설정한다.

   ```powershell
   $env:BASE_URL='http://127.0.0.1:18080'
   $env:PLAYER_COUNTS='4,5,6,8'
   $env:E2E_RUN_ID='qa-20260922-000243'
   $env:E2E_CAPACITY='8'
   ```

4. Java, JavaScript, 핵심 Playwright, UI Playwright 순서로 4절의 명령을 실행한다.
5. 실행 후에는 현재 실행 ID의 이메일 prefix만 대상으로 계정 정리를 실행하고 잔여 계정을 0으로 확인한다.

## 13. 원인 분석

이번 변경은 다음 상태를 명시적으로 분리하도록 구성되었다.

- `chat.js`가 STOMP destination/payload를 기준으로 공개·마피아·사망자 채널을 분류한다.
- `app.css`가 채널별 말풍선 배경·테두리·글자색을 적용한다.
- `body.night-phase`는 페이지 body 배경에만 회색을 적용하며 카드와 채팅 패널은 유지한다.
- `.room-back-link`는 낮/밤 상태와 무관하게 동일한 버튼 팔레트를 사용한다.
- `room-layout.spec.js`가 브라우저의 computed style과 복귀 상태를 직접 비교한다.

테스트에서 이 상태 전환이나 서버 게임 흐름의 불일치는 관찰되지 않았다.

## 14. 애플리케이션 결함과 테스트 코드 결함 분류

- 애플리케이션 결함: 발견되지 않음
- 테스트 코드 결함: 발견되지 않음
- 환경 결함: 없음
- 결론: 추가 수정 없이 현재 구현과 QA 검증 코드가 모두 통과했다.

## 15. 변경이 필요한 파일과 라인

추가로 수정이 필요한 파일은 없다. 이번 QA에서 확인한 관련 라인은 다음과 같다.

- `src/main/resources/static/css/app.css:22` — `night-phase` 회색 배경
- `src/main/resources/static/css/app.css:26` — 게임 목록 버튼 고정 팔레트
- `src/main/resources/static/css/app.css:663-679` — 채널별 말풍선 스타일
- `src/main/resources/static/js/chat.js:162` — 밤 배경 상태 갱신
- `src/main/resources/static/js/chat.js:393-419` — 채널 분류 및 말풍선 클래스 부여
- `src/main/resources/templates/rooms/detail.html:26` — 게임 목록 버튼
- `test/js/chat.test.js:321-357, 795` — 밤 상태 및 채널 테스트
- `test/e2e/room-layout.spec.js:87-216` — 실제 게임방 배경·링크·스크린샷·영상 검증

## 16. 권장 수정

현재 QA 결과 기준 권장 수정 없음. 이후 색상이나 전환 시간을 변경할 경우 `app.css`와 `room-layout.spec.js`의 computed-style assertion을 함께 갱신한다.

## 17. 생성된 테스트 산출물

- `C:\workspace\mafiaweb\test-results\.last-run.json`
- `C:\workspace\mafiaweb\test-results\bootRun.qa-20260922-000243.stdout.log`
- `C:\workspace\mafiaweb\test-results\bootRun.qa-20260922-000243.stderr.log`
- `C:\workspace\mafiaweb\output\chat-scroll-test-qa-20260922-000243\chat-scroll.png`
- `C:\workspace\mafiaweb\output\chat-scroll-test-qa-20260922-000243\chat-scroll.webm`
- `C:\workspace\mafiaweb\output\room-layout-test-8-qa-20260922-000243\waiting-room.png`
- `C:\workspace\mafiaweb\output\room-layout-test-8-qa-20260922-000243\started-room.png`
- `C:\workspace\mafiaweb\output\room-layout-test-8-qa-20260922-000243\night-background-and-back-link.png`
- `C:\workspace\mafiaweb\output\room-layout-test-8-qa-20260922-000243\restored-background-and-back-link.png`
- `C:\workspace\mafiaweb\output\room-layout-test-8-qa-20260922-000243\room-layout-transition.webm`

실제 게임방 UI 산출물에는 `/rooms/86`의 8인 게임방, 좌측 상단 게임 목록 버튼, 일반 상태, 회색 밤 상태, 복귀 상태가 포함되어 있다.

## 18. 기존 데이터 보존 확인

- 정리 selector는 정확히 `playwright.qa-20260922-000243.%@example.com`으로 제한했다.
- 기존 사용자·방·기록을 broad pattern으로 삭제하지 않았다.
- 기존 8080 서버는 종료하지 않았다.
- QA 전용 18080 서버는 테스트 종료 후 리스너가 없음을 확인했다.
- 이번 실행에서 매칭된 테스트 계정은 44개이며, 모두 현재 실행 ID의 계정이었다.

## 19. QA 계정 정리 결과

실제 JDBC 정리 출력:

```text
MATCHING_ACCOUNT_COUNT=44
DELETED_ROOM_MEMBERS=0
DELETED_GAME_ROOMS=0
DELETED_USER_STATS=44
DELETED_USERS=44
REMAINING_TEST_ACCOUNTS=0
CLEANUP_STATUS=PASS
```

방과 참가자 종속 레코드는 게임 종료/이탈 처리로 정리 시점에 이미 0건이었다. QA 계정 44개와 user_stats 44건을 트랜잭션으로 삭제했고 잔여 계정은 0개다.

## 20. 최종 판정

**PASS**

Java 103건, JavaScript 25건, 핵심 Playwright 6건, UI Playwright 2건, 서버 렌더링 시각 산출물, QA 계정 정리가 모두 완료되었다.

---

---

## 문서 2: `MAFIAGAME_QA_REPORT_2026-09-22_qa-20260922-111137.md`

# MAFIAGAME QA Report

## 1. 실행 정보

| 항목 | 결과 |
|---|---|
| 실행 ID | `qa-20260922-111137` |
| 실행일 | 2026-09-22 (Asia/Seoul) |
| 브랜치 | `develop` |
| 작업 경로 | `C:\workspace-sts-5.3.0\mafiagame` |
| E2E 설정 | `true` |
| 플레이어 수 | `4,5,6,8` |
| Playwright workers | 요청 1 / 실제 1 |
| 서버 | `http://127.0.0.1:8080` |
| MariaDB | `127.0.0.1:23306/mafiaweb` |
| 최종 판정 | **PASS** |

기존 사용자 데이터 삭제 옵션은 `false`로 유지했으며, 현재 실행 ID로 생성된 테스트 계정만 정리했다.

## 2. 사전 점검

| 점검 | 결과 |
|---|---|
| MariaDB 연결 | PASS |
| Node.js | `v24.19.0` 확인 |
| npm | `11.17.0` 확인 |
| `node_modules/jsdom` | 확인 |
| `node_modules/@playwright/test` | 확인 |
| QA 문서 MVP 번호 | 1~40 연속, 페이즈 시스템 메시지 4.3절 1~10 확인 |
| QA 포트 | 8080 사용 가능 확인 후 새 서버 기동 |

## 3. 실행 결과

### Java

실행 명령:

```powershell
.\gradlew.bat test --no-daemon --rerun-tasks -x jsTest
```

결과: `BUILD SUCCESSFUL` (5개 task 실행)

### JavaScript

실행 명령:

```powershell
node --test --test-isolation=none test/js/stomp-client.test.js test/js/room-list.test.js test/js/chat.test.js
```

결과: 29개 테스트 중 29개 통과, 실패 0개.

시스템 메시지 DOM 렌더링, 채널 분리, 패치노트 갱신 무효화, 게임 페이즈 UI를 포함한다.

### Playwright 발견 검사

- 핵심 시나리오: 6개 발견 — PASS
- UI 회귀 시나리오: 2개 발견 — PASS

### Playwright 핵심 E2E

결과: 6개 통과, 실패 0개, 종료 코드 0, 총 41.0분.

- 4인 핵심 게임 흐름: PASS (9.3분)
- 5인 핵심 게임 흐름: PASS (9.4분)
- 6인 핵심 게임 흐름: PASS (9.4분)
- 8인 핵심 게임 흐름: PASS (9.4분)
- 대기방 종료 후 6→5인 역할 경계: PASS (9.1초)
- deadline·재접속 grace·만료된 밤 액션: PASS (2.1분)

### Playwright UI 회귀

결과: 2개 통과, 실패 0개, 종료 코드 0, 총 1.5분.

- 채팅 스크롤 및 페이지 높이 고정: PASS (3.1초)
- 8인 대기/게임 방 레이아웃: PASS (10.6초)

## 4. 주요 MVP 검증 결과

| 범위 | 실제 증거 | 결과 |
|---|---|---|
| 역할 배정, 투표, 처형, 밤 행동, 승리/종료, 재플레이 | Java 테스트 및 4·5·6·8인 브라우저 흐름 | PASS |
| 6인 두 마피아 경계 및 시민 승리 | 6인 핵심 E2E | PASS |
| 채널 분리·사망자 제한·재접속/마감 처리 | 핵심 E2E 및 회복성 E2E | PASS |
| 방 이동 버튼·NIGHT 배경·복원·8인 레이아웃 | UI 회귀 E2E | PASS |
| 페이즈 시스템 메시지 | ROLE_ASSIGNMENT, DAY_DISCUSSION, NOMINATION_VOTE, FINAL_DEFENSE, EXECUTION_VOTE, NIGHT, FINISHED 전환별 공개 `SYSTEM` 메시지 확인 | PASS |
| 시스템 메시지 UI | `.chat-message.system.channel-system`, text-only 렌더링 | PASS |
| 스크린샷 및 동영상 산출물 | UI 회귀 테스트 산출물 확인 | PASS |

서버 로그에서도 각 페이즈 전환 시 `/topic/rooms/{roomId}/chat`으로 `type=SYSTEM` 메시지가 전송되는 것을 확인했다.

## 5. 산출물

- 서버 로그: `C:\workspace-sts-5.3.0\mafiagame\test-results\bootRun.qa-20260922-111137.stdout.log`
- UI 실행 로그: `C:\workspace-sts-5.3.0\mafiagame\test-results\playwright-ui.qa-20260922-111137.log`
- 채팅 스크린샷: `C:\workspace-sts-5.3.0\mafiagame\output\chat-scroll-test-qa-20260922-111137\chat-scroll.png`
- 채팅 동영상: `C:\workspace-sts-5.3.0\mafiagame\output\chat-scroll-test-qa-20260922-111137\chat-scroll.webm`
- 대기 방 스크린샷: `C:\workspace-sts-5.3.0\mafiagame\output\room-layout-test-8-qa-20260922-111137\waiting-room.png`
- 시작 방 스크린샷: `C:\workspace-sts-5.3.0\mafiagame\output\room-layout-test-8-qa-20260922-111137\started-room.png`
- NIGHT 스크린샷: `C:\workspace-sts-5.3.0\mafiagame\output\room-layout-test-8-qa-20260922-111137\night-background-and-back-link.png`
- 복원 스크린샷: `C:\workspace-sts-5.3.0\mafiagame\output\room-layout-test-8-qa-20260922-111137\restored-background-and-back-link.png`
- 방 전환 동영상: `C:\workspace-sts-5.3.0\mafiagame\output\room-layout-test-8-qa-20260922-111137\room-layout-transition.webm`

Playwright UI 실행이 공용 `test-results` 출력 디렉터리를 정리하므로 핵심 E2E 원본 로그는 UI 실행 전에 제거되었다. 핵심 6개 결과는 실행 중 실제 콘솔 출력과 서버 로그에서 기록했다.

## 6. 테스트 데이터 정리

초기 자동 정리 래퍼가 `application.properties`의 `${DB_USERNAME}`·`${DB_PASSWORD}` 플레이스홀더를 해석하지 못해 1차 DB 인증이 실패했다. QA 서버 종료 후 실제 환경 변수 자격 증명과 동일한 실행 ID로 정리를 재실행했다.

| 항목 | 결과 |
|---|---:|
| 매칭 테스트 계정 | 44 |
| 삭제된 `user_stats` | 44 |
| 삭제된 계정 | 44 |
| 최종 잔여 계정 | 0 |
| 기존 데이터 삭제 | 없음 |

이 정리 문제는 애플리케이션 기능 실패가 아니라 QA 정리 래퍼의 환경 변수 해석 문제다.

## 7. Diff 상태

QA 실행 전후 소스 작업 트리의 diff는 동일하다. 실행 결과 보고서는 QA 산출물로 실행 후 생성했다.

- 스테이징된 변경: 없음
- 추적 파일 수정: 17개
- QA 실행으로 추가된 소스 변경: 없음
- 생성된 QA 보고서: `docs/QA_report/MAFIAGAME_QA_REPORT_2026-09-22_qa-20260922-111137.md` (untracked)
- `git diff --check`: 공백 오류 없음
- Git의 LF→CRLF 변환 경고만 확인됨

커밋이나 push는 수행하지 않았다.

---

---

## 문서 3: `MAFIAGAME_QA_REPORT_2026-09-22_qa-20260922-135034.md`

# MAFIAGAME QA 실행 보고서 — 복구 요약

> 복구 범위: 원본 개별 파일과 실행 산출물을 찾을 수 없어, 기존 통합본에 남아 있던 실행 환경·테스트 수치·판정·증적 경로를 바탕으로 복구했다. 원문 문장 전체를 복원한 것은 아니다.

## 1. 실행 환경

- 실행 ID: `qa-20260922-135034`
- 실행일: 2026-09-22 (Asia/Seoul)
- 브랜치: `develop`
- 기록된 작업 경로: `C:\workspace-sts-5.3.0\mafiagame`
- E2E: 실행
- 핵심 E2E 인원: 4, 5, 6, 7, 8명
- 방 UI 수용 인원: 8명
- Playwright worker: 요청 1 / 실제 1
- 서버: `http://127.0.0.1:8080`
- MariaDB: `127.0.0.1:23306/mafiaweb`
- 기존 사용자 데이터 사전 삭제: 수행하지 않음

## 2. 단위 테스트

- Java: `BUILD SUCCESSFUL`; JUnit 111건 통과, 실패·오류·건너뜀 0건
- JavaScript: 32건 통과, 실패 0건
- MariaDB, Node.js v24.19.0, npm 11.17.0, `jsdom`, Playwright 의존성 사전 점검 통과

## 3. Playwright 결과

- 핵심 E2E: 총 7개 중 1개 통과, 6개 실패 또는 중단
- 4~8인 핵심 흐름은 `test/e2e/mafia-mvp.spec.js:1083` 단언에서 실패
- 6인에서 5인으로 줄어드는 경계 시나리오는 9.5초에 통과
- `deadline/reconnect/night action` 시나리오는 `test/e2e/mafia-mvp.spec.js:1580`에서 실패
- 채팅 스크롤 UI: 3.2초에 통과
- 8인 대기/게임 시작 방 레이아웃 UI: 10.7초에 통과
- 화면 녹화와 스크린샷 일부는 생성됐으나 Playwright trace는 생성되지 않음

## 4. 증적과 정리

- 핵심 E2E: PNG 26개, WebM 19개
- 채팅 UI: PNG 3개, WebM 2개
- 8인 방 레이아웃 UI: PNG 5개, WebM 2개
- 증적 경로에는 `output/mafia-mvp-test-qa-20260922-135034/`, `output/chat-scroll-test-qa-20260922-135034/`, `output/room-layout-test-8-qa-20260922-135034/`가 기록돼 있음
- QA 실행 ID 이메일 namespace에 해당하는 계정 51개와 관련 `user_stats` 51개 정리가 기록돼 있음
- 기존 통합본은 fresh server의 로그 ID가 이번 실행 ID와 다를 수 있어 서버 정리 증거를 `BLOCKED`로 판정함

## 5. 최종 판정

**FAIL**

Java·JavaScript와 UI E2E는 통과했으나 핵심 E2E에서 다수 시나리오가 실패했다. 전체 QA 진행 화면 캡처 요구사항과 fresh-server 종료 증거도 충족되지 않아 전체 결과를 PASS로 처리할 수 없다고 기록돼 있다.

---

---

## 문서 4: `MAFIAGAME_QA_REPORT_2026-09-22_qa-20260922-144340.md`

# MAFIAGAME QA 실행 보고서

## 1. 실행 환경

| 항목 | 내용 |
|---|---|
| 실행 ID | `qa-20260922-144340` |
| 실행일 | 2026-09-22 (Asia/Seoul) |
| 브랜치 | `develop` |
| 작업 경로 | `C:\workspace-sts-5.3.0\mafiagame` |
| E2E | 실행 |
| E2E 인원수 | 4, 5, 6, 7, 8 |
| UI 최대 인원수 | 8 |
| Playwright worker | 요청 1 / 실제 1 |
| 서버 | `http://127.0.0.1:8080` |
| MariaDB | `127.0.0.1:23306/mafiaweb` |
| 기존 데이터 삭제 | 실행하지 않음 |
| QA 계정 삭제 | 실행함 |
| 소스 수정 | 실행하지 않음 |

## 2. 사전 점검

사전 점검 로그: `test-results/qa-20260922-144340-preflight.log`

| 점검 항목 | 결과 |
|---|---|
| MariaDB 연결 | PASS |
| Node.js | PASS, v24.19.0 |
| npm | PASS, 11.17.0 |
| jsdom | PASS |
| Playwright | PASS |
| 8080 포트 | PASS, 실행 전 사용 가능 |
| 기존 데이터 삭제 | 실행하지 않음 |

## 3. 사전 확인 파일

- `AGENTS.md`
- `docs/MAFIAGAME_MVP.md`
- `docs/QA_scripts/MAFIAGAME_QA_TEST_EXECUTION_SCRIPT.md`
- `package.json`
- `build.gradle`
- `src/main/**`
- `src/test/**`
- `test/js/**`
- `test/e2e/**`
- `src/main/resources/application.properties`

## 4. 실행 명령

Java 테스트:

```powershell
$env:GRADLE_USER_HOME='C:\workspace-sts-5.3.0\mafiagame\.gradle-test'
.\gradlew.bat test --no-daemon --rerun-tasks -x jsTest
```

JavaScript 테스트:

```powershell
node --test --test-isolation=none test/js/stomp-client.test.js test/js/room-list.test.js test/js/chat.test.js
```

Playwright 목록 확인:

```powershell
npm.cmd run test:e2e -- --list --workers=1
npm.cmd run test:e2e:ui -- --list --workers=1
```

Playwright 핵심 E2E:

```powershell
npm.cmd run test:e2e -- --workers=1 --retries=0 --reporter=list
```

Playwright UI E2E:

```powershell
npm.cmd run test:e2e:ui -- --workers=1 --retries=0 --reporter=list
```

## 5. Java 테스트 결과

- 실행 로그: `test-results/qa-20260922-144340-java.log`
- 결과: `BUILD SUCCESSFUL`
- JUnit 테스트: 111개
- 실패: 0개
- 오류: 0개
- 스킵: 0개
- Gradle HTML 보고서: `build/reports/tests/test/index.html`
- JUnit XML: `build/test-results/test/*.xml`

Java 단위·통합 테스트는 모두 통과했다.

## 6. JavaScript 테스트 결과

- 실행 로그: `test-results/qa-20260922-144340-javascript.log`
- 테스트: 32개
- 통과: 32개
- 실패: 0개
- 취소: 0개
- 스킵: 0개

STOMP 프레임/파서, 방 목록 동기화, 패치노트 표시, 준비 상태, 페이즈 UI, 역할별 채널, 시스템 페이즈 메시지, Spy/Medium 채널 및 재접속 관련 테스트를 통과했다.

## 7. 서버 상태 및 종료

- 서버 PID 기록: `test-results/qa-20260922-144340-server-process.log`
- 헬스 체크 로그: `test-results/qa-20260922-144340-server-health.log`
- `/login` 응답: HTTP 200, 첫 시도 PASS
- E2E 및 정리 완료 후 이번 실행에서 시작한 서버를 종료했다.
- 종료 후 8080 포트 리스닝 프로세스가 확인되지 않았다.
- 서버 stdout: `test-results/bootRun.qa-20260922-144340.stdout.log`
- 서버 stderr: `test-results/bootRun.qa-20260922-144340.stderr.log`

## 8. Playwright 목록 및 실행 결과

핵심 시나리오 7개와 UI 시나리오 2개를 worker 1개로 실행했다.

### 8.1 핵심 E2E

실행 로그: `test-results/qa-20260922-144340-playwright-core.log`

| 시나리오 | 결과 | 소요 |
|---|---|---:|
| MVP 4인 핵심 게임 흐름 | PASS | 9.4분 |
| MVP 5인 핵심 게임 흐름 | FAIL, 테스트 제한시간 초과 | 12.0분 |
| MVP 6인 핵심 게임 흐름 | FAIL, 테스트 제한시간 초과 | 12.0분 |
| MVP 7인 핵심 게임 흐름 | FAIL, 패치노트 모달 닫기 검증 실패 | 17.8초 |
| MVP 8인 핵심 게임 흐름 | FAIL, 비마피아 페이지에 마피아 메시지 노출 | 2.4분 |
| 대기방 탭 종료 후 6인→5인 역할 경계 | PASS | 11.3초 |
| deadline/reconnect grace/만료된 밤 행동 | PASS | 2.8분 |

결과는 7개 중 3개 PASS, 4개 FAIL이며 종료 코드는 1이다.

### 8.2 UI E2E

실행 로그: `test-results/qa-20260922-144340-playwright-ui.log`

| 시나리오 | 결과 | 소요 |
|---|---|---:|
| 시작 전 역할 슬롯 및 채팅 스크롤 | PASS | 6.6초 |
| 8인 대기/게임 시작 방 레이아웃 | PASS | 12.3초 |

결과는 2개 중 2개 PASS이며 종료 코드는 0이다.

## 9. 실패 시나리오 분석

### 9.1 5인·6인 핵심 흐름

두 시나리오 모두 테스트 제한시간 720,000ms를 초과했다. Playwright 종료 출력에는 정상적인 assertion 메시지 대신 제한시간 초과가 남았으며, 6인 실패 항목은 trace 첨부가 생성되었지만 실행 종료 시점에 zip 무결성 오류도 함께 보고되었다.

현재 결과만으로는 서버의 단일 원인으로 확정할 수 없다. 5인·6인 흐름에서 어느 단계가 진행을 멈췄는지 재현 가능한 추가 로그 또는 보존된 trace가 필요하다. 따라서 애플리케이션 결함으로 단정하지 않고 E2E FAIL로 분류한다.

### 9.2 7인 핵심 흐름

`test/e2e/mafia-mvp.spec.js:134`의 `dismissPatchNotes()`에서 패치노트 닫기 버튼 클릭 후 `#patchNotesModal`이 5초 내 hidden 상태가 되지 않아 실패했다.

```text
Expected: hidden
Received: visible
Locator: #patchNotesModal
```

패치노트 모달 닫기 이벤트 또는 테스트의 Bootstrap transition 대기 처리를 확인해야 한다. 이 실패는 게임 역할 구성 자체보다 초기 화면 모달 상태 정리 단계에서 발생했다.

### 9.3 8인 핵심 흐름

`test/e2e/mafia-mvp.spec.js:1159`에서 생존 마피아 외 페이지의 `#messages`에 `night-mafia-8-qa-20260922-144340` 메시지가 포함되어 `not.toContainText()` 검증에 실패했다.

즉, 마피아의 밤 행동 메시지가 마피아가 아닌 참가자 화면에도 노출된 것으로 관찰됐다. 채널 권한 또는 밤 행동 메시지의 대상 페이지 필터링을 우선 점검해야 하며, 정보 노출 가능성이 있으므로 애플리케이션 결함 후보로 분류한다.

## 10. MVP 검증 요약

| 범위 | 결과 | 근거 |
|---|---|---|
| Java 역할·페이즈·승리·권한 단위 테스트 | PASS | JUnit 111/111 |
| JavaScript UI·채널·시스템 메시지 테스트 | PASS | Node 32/32 |
| 4인 핵심 실시간 게임 흐름 | PASS | Playwright |
| 5인 핵심 실시간 게임 흐름 | FAIL | 제한시간 초과 |
| 6인 핵심 실시간 게임 흐름 | FAIL | 제한시간 초과 |
| 7인 핵심 실시간 게임 흐름 | FAIL | 패치노트 모달 닫기 |
| 8인 핵심 실시간 게임 흐름 | FAIL | 마피아 밤 메시지 노출 |
| 6인→5인 역할 경계 | PASS | Playwright |
| deadline/reconnect/만료 밤 행동 | PASS | Playwright |
| UI 레이아웃·스크롤 | PASS | UI Playwright 2/2 |

## 11. 증적 파일

실행별 브라우저 증적은 다음 경로에 생성됐다.

- 핵심 E2E 이미지/영상: `output/mafia-mvp-test-qa-20260922-144340/**`
- 채팅 UI 이미지/영상: `output/chat-scroll-test-qa-20260922-144340/**`
- 방 레이아웃 이미지/영상: `output/room-layout-test-8-qa-20260922-144340/**`
- PNG: 39개
- WEBM: 22개
- 현재 실행 ID 아래에 보존된 Playwright trace zip: 2개
  - `test-results/playwright/qa-20260922-144340/chat-scroll-role-slot-is-v-8b990-ls-without-growing-the-page/trace.zip`
  - `test-results/playwright/qa-20260922-144340/room-layout-waiting-and-started-room-layout-8-players-/trace.zip`

핵심 E2E trace는 UI suite가 같은 run ID의 Playwright output directory를 재사용하면서 보존되지 않았다. 핵심 E2E 실패 원인은 실행 로그에 남아 있으나, 다음 실행부터는 suite별 output directory를 분리하거나 trace를 별도 archive해야 한다.

QA 스크립트가 요구하는 preflight부터 최종 정리까지의 전체 Windows 화면 녹화는 현재 실행 환경에서 확보하지 못했다. 브라우저 시나리오별 WEBM과 스크린샷은 있으나 Java/JavaScript/preflight/서버 health/final summary 화면까지 포함한 단일 전체 진행 녹화는 없다. 이 항목은 BLOCKED로 기록한다.

## 12. 테스트 계정 및 데이터 정리

- 사전 데이터 삭제: 실행하지 않음
- 정리 preflight: `test-results/qa-20260922-144340-cleanup-preflight.log`
- 정리 로그: `test-results/qa-20260922-144340-cleanup.log`
- 현재 실행 계정 확인: 51개
- 관련 방: 0개
- 삭제 후 잔여 테스트 계정: 0개
- 삭제 후 잔여 테스트 사용자 통계: 0개
- 기존 사용자·방·데이터는 삭제하지 않음

정리 트랜잭션은 현재 실행 ID `qa-20260922-144340`의 이메일 namespace만 대상으로 수행했다.

## 13. 최종 판정

**FAIL / BLOCKED**

- Java와 JavaScript 테스트는 모두 통과했다.
- UI E2E는 2개 모두 통과했다.
- 핵심 게임 E2E는 7개 중 4개가 실패했다.
- 8인 흐름에서는 마피아 밤 메시지의 비마피아 노출이 관찰되어 우선 수정 검토가 필요하다.
- 전체 QA 진행 화면 녹화 요구사항은 충족하지 못해 BLOCKED 항목이 남았다.
- QA 계정 정리와 이번 실행 서버 종료는 완료했다.

다음 조치로 5·6인 타임아웃 단계 추적, 패치노트 모달 닫기 동기화, 8인 밤 마피아 메시지 대상 필터링을 수정한 뒤 핵심 E2E를 재검증해야 한다.

## 14. 7인 시나리오 후속 디버깅 기록

후속 실행 ID: `debug-20260922-160401-7continue`

- 7인 본 게임은 역할 배정, 낮 토론, 처형, 밤 능력, 스파이 잠금·접선, 게임 종료 화면까지 정상 도달했다.
- 본 게임 종료 후 재경기 검증에서 테스트가 실패했다. 실패 위치는 `test/e2e/mafia-mvp.spec.js`의 `startReplayGame()` 내 재경기 최종 처형 후 `게임 종료` 대기 구간이다.
- 실제 7인 역할 구성은 `마피아 2명 + 스파이 1명`으로 마피아팀이 3명이다. 기존 재경기 테스트는 마피아팀을 최대 2명만 처형하면 종료된다고 가정하여, 두 번째 마피아팀 처형 후에도 게임이 `밤`으로 진행되는 정상 상태를 실패로 판정했다.

수정 필요사항:

1. `startReplayGame()`의 재경기 종료 검증을 고정 2회 처형 방식에서 마피아팀 생존자가 없어질 때까지 반복하는 방식으로 변경한다.
2. 각 반복에서 현재 생존자 목록을 기준으로 마피아팀 대상을 선택하고, 처형 후 `NIGHT` 또는 `FINISHED`를 분기한다.
3. `FINISHED` 전환 시에만 시민 진영 승리와 역할 공개를 검증한다.
4. 이 수정은 QA 테스트 코드에 반영했으나, 사용자의 요청에 따라 후속 재검증은 실행하지 않았다.

후속 7인 실행 결과: **FAIL (테스트 코드의 재경기 종료 조건 오류)**

- 증적: `output/mafia-mvp-test-debug-20260922-160401-7continue/core-7/finished.png`
- 최종 캡처: `output/mafia-mvp-test-debug-20260922-160401-7continue/core-7/final-state.png`
- 실행 로그: `test-results/debug-20260922-160401-7continue-playwright-core.log`
- 테스트 서버와 Playwright 실행은 종료했다.

---
