# MAFIAGAME QA 보고서 — 2026-09-23

- 포함 보고서 수: 8
- 날짜 및 실행 시각 순서: 오래된 보고서부터

## 목차

1. `MAFIAGAME_QA_REPORT_2026-09-23_qa-20260923-113110.md`
2. `MAFIAGAME_QA_REPORT_2026-09-23_qa-20260923-115534.md`
3. `MAFIAGAME_QA_REPORT_2026-09-23_qa-20260923-120355.md`
4. `MAFIAGAME_QA_REPORT_2026-09-23_qa-20260923-123138-smoke.md`
5. `MAFIAGAME_QA_REPORT_2026-09-23_qa-20260923-1305-smoke.md`
6. `MAFIAGAME_QA_REPORT_2026-09-23_qa-20260923-131334-regression.md`
7. `MAFIAGAME_QA_REPORT_2026-09-23_qa-20260923-150416-smoke.md`
8. `MAFIAGAME_QA_REPORT_2026-09-23_qa-20260923-152338-smoke.md`

---

## 문서 1: `MAFIAGAME_QA_REPORT_2026-09-23_qa-20260923-113110.md`

# MAFIAGAME QA Report

- 실행 일시: 2026-09-23
- 실행 ID: `qa-20260923-113110`
- 프로필: `regression`
- 요청 프로필: Regression
- 유효 프로필: Regression
- PLAYER_COUNTS: `4,6,8`
- UI capacity: `5`
- Worker: 요청 1 / 유효 1
- Phase profile: `short`
- 최종 결과: **FAIL**

## 실행 범위

Regression 프로필에 따라 Java/JavaScript 테스트, 4·6·8인 핵심 E2E, 4인 리플레이 범위를 포함한 핵심 suite, 30개 메시지 채팅 스크롤, 5인 room-layout UI suite를 실행했다. 핵심 E2E는 실행 중 3개 시나리오가 모두 실패하여 리플레이 조건은 별도 성공 증거를 남기지 못했다.

## 사전 점검 및 서버

| 항목 | 결과 | 증거 |
|---|---|---|
| MariaDB `127.0.0.1:23306` | PASS | 실행 전 `Test-NetConnection` |
| Node/npm 및 로컬 의존성 | PASS | `node`, `npm.cmd`, `node_modules/jsdom`, `node_modules/@playwright/test` |
| QA 포트 8080 | PASS | 실행 전 비어 있음 |
| 애플리케이션 `/login` | PASS | HTTP 200 |
| QA 테스트 계정 정리 | PASS | 24개 발견·삭제, 잔여 0개 |

서버 로그:

- `output/test_output/2026-09-23/qa-run-qa-20260923-113110/bootRun.qa-20260923-113110.stdout.log`
- `output/test_output/2026-09-23/qa-run-qa-20260923-113110/bootRun.qa-20260923-113110.stderr.log`

## Java 테스트

명령:

```powershell
.\gradlew.bat test --no-daemon --rerun-tasks -x jsTest
```

결과: **PASS** — 총 118건, 실패 0건, 오류 0건, 건너뜀 0건.

- 콘솔: `output/test_output/2026-09-23/qa-run-qa-20260923-113110/java-tests.console.log`
- JUnit XML: `build/test-results/test/`
- Gradle HTML: `build/reports/tests/test/`

## JavaScript 테스트

명령:

```powershell
node --test --test-isolation=none test/js/stomp-client.test.js test/js/room-list.test.js test/js/chat.test.js
```

결과: **PASS** — 총 39건, 통과 39건, 실패 0건, 취소 0건.

- 콘솔: `output/test_output/2026-09-23/qa-run-qa-20260923-113110/javascript-tests.console.log`

## Playwright E2E

### 핵심 suite

명령: `npm.cmd run test:e2e -- --workers=1 --retries=0 --reporter=list`

결과: **FAIL** — 3건 실행, 0건 통과, 3건 실패.

1. 4인 핵심 흐름: `#gamePhaseTitle`가 `지목 투표`가 되어야 했으나 제한 시간 동안 `낮`으로 유지됨.
2. 6인 핵심 흐름: 온라인 인원 `6`을 기대했으나 `13`으로 관찰됨. `ONLINE_BASELINE=0`인 고립 QA 환경 조건과 실제 온라인 인원 상태가 일치하지 않음.
3. 8인 핵심 흐름: 온라인 인원 `8`을 기대했으나 `15`로 관찰됨. 2번과 동일한 baseline 불일치 증상.

콘솔: `output/test_output/2026-09-23/qa-run-qa-20260923-113110/playwright-core.console.log`

### UI suite

명령: `npm.cmd run test:e2e:ui -- --workers=1 --retries=0 --reporter=list`

결과: **FAIL** — 2건 실행, 1건 통과, 1건 실패.

- 채팅 입력·30개 메시지 스크롤: **PASS**
- 5인 room-layout: **FAIL** — 설정 저장 후 `#roomLockIndicator`가 5초 안에 표시되지 않음.

콘솔: `output/test_output/2026-09-23/qa-run-qa-20260923-113110/playwright-ui.console.log`

실패 증적:

- `output/test_output/2026-09-23/playwright-qa-20260923-113110/room-layout-waiting-and-started-room-layout-5-players-/error-context.md`
- `output/test_output/2026-09-23/playwright-qa-20260923-113110/room-layout-waiting-and-started-room-layout-5-players-/trace.zip`

## 정리

현재 실행 ID에 해당하는 Playwright 계정 24개를 정확한 이메일 prefix로 찾아 정리했고, `remaining_test_accounts=0`을 확인했다. QA 서버는 종료했고 8080 포트는 해제된 상태다.

## 판정

Java 및 JavaScript 자동화는 통과했지만, Regression 프로필의 핵심 E2E 3건과 room-layout UI 1건이 실패하여 전체 QA 결과는 **FAIL**이다. 핵심 E2E 실패는 페이즈 전환 지연 1건과 온라인 baseline 오염 2건으로 분리해 후속 확인해야 하며, room-layout 실패는 잠금 상태 동기화 또는 표시 조건을 별도로 조사해야 한다.

---

---

## 문서 2: `MAFIAGAME_QA_REPORT_2026-09-23_qa-20260923-115534.md`

# MAFIAGAME QA Report

- 실행 일시: 2026-09-23
- 실행 ID: `qa-20260923-115534`
- 프로필: `regression`
- PLAYER_COUNTS: `4,6,8`
- UI capacity: `5`
- ONLINE_BASELINE: `0`
- Worker: 요청 1 / 유효 1
- Phase profile: `short`
- 최종 결과: **FAIL**

## 실행 결과 요약

| 단계 | 결과 |
|---|---|
| MariaDB/Node/npm/의존성 사전 점검 | PASS |
| Java Gradle 테스트 | PASS — 118/118 |
| JavaScript 테스트 | PASS — 39/39 |
| 핵심 E2E 4·6·8인 | FAIL — 0/3 |
| UI E2E 채팅 스크롤·5인 room-layout | PASS — 2/2 |
| 테스트 계정 정리 | PASS — 24개 삭제, 잔여 0개 |
| QA 서버/8080 포트 정리 | PASS |

## 실행 명령 및 로그

Java:

```powershell
.\gradlew.bat test --no-daemon --rerun-tasks -x jsTest
```

- `output/test_output/2026-09-23/qa-run-qa-20260923-115534/java-tests.console.log`
- `build/test-results/test/`
- `build/reports/tests/test/`

JavaScript:

```powershell
node --test --test-isolation=none test/js/stomp-client.test.js test/js/room-list.test.js test/js/chat.test.js
```

- `output/test_output/2026-09-23/qa-run-qa-20260923-115534/javascript-tests.console.log`

Playwright:

- 핵심: `output/test_output/2026-09-23/qa-run-qa-20260923-115534/playwright-core.console.log`
- UI: `output/test_output/2026-09-23/qa-run-qa-20260923-115534/playwright-ui.console.log`
- 서버 stdout: `output/test_output/2026-09-23/qa-run-qa-20260923-115534/bootRun.qa-20260923-115534.stdout.log`
- 서버 stderr: `output/test_output/2026-09-23/qa-run-qa-20260923-115534/bootRun.qa-20260923-115534.stderr.log`

## 실패 상세

4·6·8인 핵심 흐름 모두 동일하게 `#gamePhaseTitle`가 `지목 투표`로 전환되지 않고 `낮`으로 남아 15초 제한을 초과했다. 이전 Regression 실행에서도 같은 증상이 재현되어, 단발성 실패가 아닌 반복 재현되는 페이즈 전환 문제로 분류한다.

이번 실행의 실패 증적:

- `output/test_output/2026-09-23/playwright-qa-20260923-115534/mafia-mvp-MVP-4인-핵심-게임-흐름-인증부터-한-사이클까지-동기화-검증/error-context.md`
- `output/test_output/2026-09-23/playwright-qa-20260923-115534/mafia-mvp-MVP-6인-핵심-게임-흐름-인증부터-한-사이클까지-동기화-검증/error-context.md`
- `output/test_output/2026-09-23/playwright-qa-20260923-115534/mafia-mvp-MVP-8인-핵심-게임-흐름-인증부터-한-사이클까지-동기화-검증/error-context.md`

UI suite는 채팅 스크롤과 5인 room-layout 모두 통과했다.

## 정리 및 판정

현재 실행 ID의 테스트 계정 24개를 정확한 이메일 prefix로 삭제했고 `remaining_test_accounts=0`을 확인했다. QA 서버를 종료했으며 8080 포트도 해제했다.

Java/JavaScript와 UI 회귀 검증은 통과했지만, 핵심 4·6·8인 게임 흐름이 동일한 페이즈 전환 오류로 실패했으므로 Regression QA 전체 결과는 **FAIL**이다.

---

---

## 문서 3: `MAFIAGAME_QA_REPORT_2026-09-23_qa-20260923-120355.md`

# MAFIAGAME QA Report

- 실행 일시: 2026-09-23
- 실행 ID: `qa-20260923-120355`
- 프로필: `smoke`
- PLAYER_COUNTS: `4`
- UI capacity: `5`
- ONLINE_BASELINE: `0`
- Worker: 요청 1 / 유효 1
- Phase profile: `short`
- 최종 결과: **FAIL**

## 실행 결과 요약

| 단계 | 결과 |
|---|---|
| MariaDB/Node/npm/의존성 사전 점검 | PASS |
| Java Gradle 테스트 | PASS — 118/118 |
| JavaScript 테스트 | PASS — 39/39 |
| 4인 핵심 E2E | FAIL — `지목 투표` 전환 실패 |
| 5인 room-layout UI | PASS |
| 테스트 계정 정리 | PASS — 9개 삭제, 잔여 0개 |
| QA 서버/8080 포트 정리 | PASS |

## 실행 로그

- Java: `output/test_output/2026-09-23/qa-run-qa-20260923-120355/java-tests.console.log`
- JavaScript: `output/test_output/2026-09-23/qa-run-qa-20260923-120355/javascript-tests.console.log`
- 핵심 E2E: `output/test_output/2026-09-23/qa-run-qa-20260923-120355/playwright-core.console.log`
- UI E2E: `output/test_output/2026-09-23/qa-run-qa-20260923-120355/playwright-ui.console.log`
- 서버 stdout: `output/test_output/2026-09-23/qa-run-qa-20260923-120355/bootRun.qa-20260923-120355.stdout.log`
- 서버 stderr: `output/test_output/2026-09-23/qa-run-qa-20260923-120355/bootRun.qa-20260923-120355.stderr.log`
- Gradle JUnit XML: `build/test-results/test/`
- Gradle HTML: `build/reports/tests/test/`

## 실패 상세

4인 핵심 게임 흐름에서 `#gamePhaseTitle`가 `지목 투표`로 전환되지 않고 `낮`으로 유지되어 15초 제한을 초과했다. 동일 증상이 Regression 프로필에서도 재현되어 반복 재현되는 페이즈 전환 문제로 분류한다.

실패 증적:

- `output/test_output/2026-09-23/playwright-qa-20260923-120355/mafia-mvp-MVP-4인-핵심-게임-흐름-인증부터-한-사이클까지-동기화-검증/error-context.md`
- `output/test_output/2026-09-23/playwright-qa-20260923-120355/mafia-mvp-MVP-4인-핵심-게임-흐름-인증부터-한-사이클까지-동기화-검증/trace.zip`

## 정리 및 판정

현재 실행 ID의 테스트 계정 9개를 정확한 이메일 prefix로 삭제했고 `remaining_test_accounts=0`을 확인했다. QA 서버를 종료했으며 8080 포트도 해제했다.

Java/JavaScript와 room-layout UI는 통과했지만 4인 핵심 게임 흐름이 반복되는 페이즈 전환 오류로 실패했으므로 Smoke QA 전체 결과는 **FAIL**이다.

---

---

## 문서 4: `MAFIAGAME_QA_REPORT_2026-09-23_qa-20260923-123138-smoke.md`

# MAFIAGAME QA Report — Smoke

## 1. 실행 환경

- 실행 ID: `qa-20260923-123138-smoke`
- 프로필: Smoke (`PLAYER_COUNTS=4`, UI 정원 5, 단축 페이즈, worker 1)
- 서버 URL: `http://127.0.0.1:8080`
- 결과: **FAIL** — Java·JavaScript 및 방 레이아웃 검증은 통과했으나 4인 핵심 E2E가 Smoke 페이즈 설정과 맞지 않는 시간 단정문에서 실패함.
- Full QA는 실행하지 않음.

## 2. 사전 점검

- 실행 전 8080 포트: 사용 중인 listener 없음.
- MariaDB `127.0.0.1:23306`: 연결 가능.
- Node.js, npm, `jsdom`, `@playwright/test`: 사용 가능.
- DB 클라이언트는 환경의 TLS 설정을 건너뛰는 `--skip-ssl` 옵션으로 연결됨. 계정·암호는 이 보고서에 기록하지 않음.

## 3. 실행 결과

| 단계 | 결과 | 상세 |
|---|---|---|
| Java/Gradle | PASS | 119 tests, 119 passed, 0 failed, 0 errors, 0 skipped. `jsTest`는 별도 실행을 위해 제외함. |
| JavaScript | PASS | 39 tests, 39 passed, 0 failed. |
| 서버 시작·상태 확인 | PASS | 이 실행의 앱 시작 로그 확인, `/login` HTTP 200. QA 서버 PID 9296 종료 후 8080 listener 없음 확인. |
| 4인 핵심 브라우저 흐름 | FAIL | 27.6초 후 [mafia-mvp.spec.js:1181](../../test/e2e/mafia-mvp.spec.js#L1181)에서 실패. 기대 잔여시간은 20초 이상이나 Smoke 서버 페이즈는 3초이고 실제 표시는 3초였음. |
| 방 레이아웃 브라우저 테스트 | PASS | 5인 레이아웃 테스트 1개 통과(8.8초). |
| 테스트 계정 정리 | PASS | 이번 실행 ID 계정 9개를 조회·삭제했고 잔여 계정 0개 확인. 기존 계정은 선택·삭제하지 않음. |
| QA 서버 정리 | PASS | 이번 실행 시작 로그와 포트 소유 PID를 대조해 QA 서버만 종료. 종료 뒤 8080 포트가 비었음을 확인. |

실행 명령:

- `.\gradlew.bat test --no-daemon --rerun-tasks -x jsTest --console=plain`
- `node --test --test-isolation=none test/js/stomp-client.test.js test/js/room-list.test.js test/js/chat.test.js`
- `.\gradlew.bat bootRun --no-daemon` (숨김 프로세스, `SERVER_PORT=8080`, Smoke/short 설정)
- `npm.cmd run test:e2e -- --workers=1 --retries=0 --reporter=list`
- `npm.cmd exec -- playwright test test/e2e/room-layout.spec.js --workers=1 --retries=0 --reporter=list`
- 이번 실행 ID에 한정한 MariaDB 계정 정리 및 잔여 계정 조회.

## 4. 실패 분석

Smoke 프로필은 `MAFIAGAME_PHASE_PROFILE=short`를 사용하며, 비종료 페이즈의 대기 시간을 짧게 설정한다. 하지만 4인 핵심 E2E의 재접속 검사는 짧은 프로필 여부와 관계없이 남은 시간이 `>= 20`초가 될 때까지 기다린다. 브라우저는 3초를 읽었고 5초 안에 조건을 만족할 수 없어 실패했다.

따라서 이 실패는 서버 시작이나 8080 포트 충돌이 아니라 **E2E 테스트의 고정 시간 기대와 Smoke 프로필 설정 불일치**다. 이 지점에서 테스트가 중단되어 새로고침 후 상태 복구, 밤 행동 결과, 다음 낮 진행, 게임 종료·결과, 동일 방 재플레이는 이 브라우저 실행에서 검증되지 않았다. Smoke 프로필은 재플레이를 포함하지 않는다.

서버 시작 명령을 감싼 PowerShell 상태 확인에 구문 오류가 한 차례 있었으나, 새 서버의 시작 로그와 PID, HTTP 200을 확인한 뒤 검증을 이어갔다. 실행 중 서버는 해당 PID 기준으로 종료했으며 포트 해제를 확인했다.

## 5. MVP 검증 상태

| 요구사항 | 상태 | 실행 근거 및 범위 |
|---|---|---|
| 1–2. 역할 배정과 비공개 역할 표시 | PASS | Java 역할 배정 테스트 및 E2E 역할 확인 화면/공개 상태 검사가 통과함. |
| 3–7. 낮·지목·변론·처형·밤의 운영 시간 | NOT RUN | Smoke는 단축 페이즈를 사용함. 재접속 시간 단정 실패도 3초 단축 페이즈에서 발생함. |
| 8–11. 중복·자기 지목·사망자·후보자 투표 제한 | PASS | `RoomGameServiceTest`의 해당 서버 검증 테스트 통과. |
| 12–16. 밤 공격·보호·조사와 역할/대상/중복 행동 검증 | PASS | Java 서비스 테스트 통과. E2E는 행동 제출까지 갔으나 첫 밤 결과 해소는 확인하지 못함. |
| 17–22. 승리 판정, 결과 전달, 승리 진영·개인 역할 표시 | PASS | Java 서비스 및 JavaScript 결과 표시 테스트 통과. 결과 화면 자체의 브라우저 검증은 실패 시점상 진행하지 못함. |
| 23. 생존/사망 표시 | PASS | E2E 실패 지점 전에 사망 참가자 카드와 `사망` 표식을 확인함. |
| 24–27. WAITING·Ready 초기화·재플레이·새로고침 복구 | NOT RUN | 완료/재접속 흐름까지 E2E가 도달하지 못함. 재플레이는 Smoke 범위에서 제외됨. |
| 28–29. 공개/마피아 채널 분리와 사망자 채널 권한 | PASS | E2E가 실패 지점 전까지 각 채널 가시성 및 권한 거부를 확인했고 Java/JS 테스트도 통과함. |
| 30. 마피아·Spy·의사·경찰·Medium의 무행동 처리 | NOT RUN | 네 명 Smoke 브라우저 흐름으로 Spy/Medium의 무행동 경계까지 검증하지 않음. |
| 31. 의사의 연속 밤 자기 보호 | PASS | Java 서비스 단위 테스트 통과. |
| 32. 사망 시 역할/조사 정보 비공개 | PASS | 게임 진행 중 공개 상태의 역할 비노출 검사와 관련 Java/JS 테스트 통과. |
| 33. 종료 후 전체 역할 공개 | NOT RUN | E2E가 게임 종료 화면까지 도달하지 못함. |
| 34. 서버 마감 시각 및 중복 요청 처리 | PASS | Java 서비스의 마감·동시 요청 테스트 통과. |
| 35–36. 방 복귀 링크와 일반/밤 배경 대비 | PASS | 실제 방 페이지에서 `/rooms` 링크 및 일반/밤 배경과 링크 스타일을 확인하는 UI E2E 통과. |
| 37. 채널별 말풍선의 클래스와 시각적 차이 | NOT RUN | JS 테스트에서 채널 클래스는 확인했으나 Smoke 정책상 시각 증거를 캡처하지 않음. |
| 38. 모든 단계의 안내 메시지와 중복 방지 | NOT RUN | E2E 실패 전 역할 확인부터 밤까지 일부 단계는 확인했지만 `FINISHED`까지 전체 흐름을 검증하지 못함. |
| 39. 서버 페이즈에 연동된 밤 배경 전환/복원 | NOT RUN | UI 테스트는 CSS 상태를 직접 전환해 확인했지만, 실제 게임의 밤→낮/종료 연동 E2E는 끝나지 않음. |
| 40–41. 전체 게임 및 QA 진행 스크린샷/비디오 | NOT RUN | Smoke 프로필은 정기 스크린샷·비디오 캡처를 생략함. 해당 증거는 Full 전용 정책임. |
| 42–43. 호스트 설정, 용량 제한, 잠금 동기화 | PASS | 5인 방 레이아웃 E2E와 JavaScript 테스트 통과. |
| 44. 종료 후 공개 채널 초기화와 사망자 공개 메시지 전달 | PASS | Java/JavaScript 테스트 통과. 종료 이후 브라우저 E2E는 확인하지 못함. |
| 45. 진영 조사 결과와 Spy/Medium 개별 직업 결과 | PASS | Java 조사 전달 및 JavaScript 결과 표시 테스트 통과. Spy/Medium은 4인 Smoke E2E 범위에 포함되지 않음. |

## 6. 산출물

- 실행 로그: `output/test_output/2026-09-23/qa-run-qa-20260923-123138-smoke/`
- JavaScript/Gradle 콘솔 로그: `javascript.log`, `gradle-java.log`
- Gradle 결과: `build/test-results/test/`, `build/reports/tests/test/index.html`
- 서버 로그: `bootRun.stdout.log`, `bootRun.stderr.log`
- E2E 로그: `playwright-core.log`, `playwright-ui.log`
- DB 정리 확인: `database-cleanup.log`
- 실패 E2E 증거: `output/test_output/2026-09-23/playwright-qa-20260923-123138-smoke/core/mafia-mvp-MVP-4인-핵심-게임-흐름-인증부터-한-사이클까지-동기화-검증/error-context.md` 및 `trace.zip`
- Smoke 프로필은 정상 브라우저 스크린샷·비디오를 캡처하지 않음.

---

---

## 문서 5: `MAFIAGAME_QA_REPORT_2026-09-23_qa-20260923-1305-smoke.md`

# MAFIAGAME QA Report — Smoke

## 1. 실행 환경

- 실행 ID: `qa-20260923-1305-smoke`
- 프로필: Smoke (`PLAYER_COUNTS=4`, UI 정원 5, 단축 페이즈, 요청/실제 worker 1/1)
- 서버 URL: `http://127.0.0.1:8080`
- 결과: **PASS** — 프로필에 포함된 Java, JavaScript, 4인 코어 E2E, 5인 방 레이아웃 E2E가 모두 통과함.
- Smoke 프로필에서 제외되는 재플레이, 6인 확장 시나리오, chat-scroll 및 Full 프로필은 실행하지 않음.

## 2. 사전 점검

- MariaDB `127.0.0.1:23306`: 연결 가능.
- 실행 전 8080 포트: listener 없음.
- Node.js, npm, `jsdom`, `@playwright/test`: 사용 가능.
- QA 서버는 현재 작업 트리로 실행했고 `/login` HTTP 200 및 시작 로그를 확인함.
- DB 접속 계정과 비밀번호는 보고서에 기록하지 않음.

## 3. 실행 결과

| 단계 | 결과 | 상세 |
|---|---|---|
| Java/Gradle | PASS | 119 tests, 119 passed, 0 failed, 0 errors, 0 skipped. JavaScript는 별도 실행하도록 `-x jsTest`를 사용함. |
| JavaScript | PASS | 40 tests, 40 passed, 0 failed. QA 프로필 설정 검증 테스트도 포함함. |
| 서버 시작·상태 확인 | PASS | 이번 실행의 시작 로그, listener PID 42964, `/login` HTTP 200 확인. |
| 4인 핵심 브라우저 흐름 | PASS | 전체 테스트 흐름이 37.2초에 통과. 역할 확인, 투표·밤 행동·조사 결과·재접속·게임 종료 assertions 포함. |
| 방 레이아웃 브라우저 테스트 | PASS | 5인 방 레이아웃 테스트 1개 통과(9.2초). |
| 테스트 데이터 정리 | PASS | 이번 실행 ID의 계정 9개를 대상으로 정리했고 잔여 계정 0개, 실행 ID 방 0개를 확인함. 기존 계정은 선택하지 않음. |
| QA 서버 정리 | PASS | 이번 실행의 listener PID만 종료하고 8080 포트가 비었음을 확인함. |

실행 명령:

- `.\gradlew.bat test --no-daemon --rerun-tasks -x jsTest`
- `node --test --test-isolation=none test/js/stomp-client.test.js test/js/room-list.test.js test/js/chat.test.js test/js/e2e-profile.test.js`
- `.\gradlew.bat bootRun --no-daemon` (`SERVER_PORT=8080`, `E2E_PROFILE=smoke`, `MAFIAGAME_PHASE_PROFILE=short`)
- `npm.cmd run test:e2e -- --workers=1 --retries=0 --reporter=list` (`PLAYER_COUNTS=4`)
- `npm.cmd exec -- playwright test test/e2e/room-layout.spec.js --workers=1 --retries=0 --reporter=list` (`E2E_CAPACITY=5`)

## 4. 검증 범위와 제한

Smoke의 4인 브라우저 테스트는 한 게임 흐름을 끝까지 진행했고 통과했다. 3초 단축 페이즈를 사용하므로 실제 운영 시간(15/60/20/20/20/35초)을 검증하지 않는다. 재플레이, 두 가지 6인 복원 시나리오, Regression의 6·8인 게임과 chat-scroll, Full의 추가 인원수·운영 시간 검증은 이 프로필 범위 밖이다.

UI E2E는 실제 서버가 렌더링한 5인 방 화면을 확인했다. Smoke 증거 정책에 따라 정상 실행의 스크린샷·비디오는 생성하지 않았다. Playwright trace는 실패 시 보존하도록 설정되어 있으며 이번 실행은 통과해 실패 trace가 없다.

## 5. 산출물

- 전체 실행 로그: `output/test_output/2026-09-23/qa-run-qa-20260923-1305-smoke/`
- Java 결과 로그: `gradle-test.log`
- JavaScript 결과 로그: `javascript-test.log`
- 서버 시작/오류 로그: `bootRun.stdout.log`, `bootRun.stderr.log`
- E2E 로그: `playwright-core.log`, `playwright-ui.log`
- Playwright 메타데이터: `output/test_output/2026-09-23/playwright-qa-20260923-1305-smoke/core/`, `.../ui/`
- 생성 테스트 시나리오 산출물 경로: `output/test_output/2026-09-23/mafia-mvp-test-smoke-qa-20260923-1305-smoke/`, `output/test_output/2026-09-23/room-layout-test-5-qa-20260923-1305-smoke/`
- Gradle JUnit XML: `build/test-results/test/`
- Gradle HTML 보고서: `build/reports/tests/test/index.html`

---

---

## 문서 6: `MAFIAGAME_QA_REPORT_2026-09-23_qa-20260923-131334-regression.md`

# MAFIAGAME QA Report — Regression

## 1. 실행 환경

- 실행 ID: `qa-20260923-131334-regression`
- 프로필: Regression (`PLAYER_COUNTS=4,6,8`, UI 정원 5, 단축 페이즈, 요청/실제 worker 1/1)
- 서버 URL: `http://127.0.0.1:8080`
- 결과: **PASS** — Java·JavaScript와 프로필에 지정된 코어/UI 브라우저 테스트가 모두 통과함.
- Full QA는 실행하지 않음.

## 2. 사전 점검

- MariaDB `127.0.0.1:23306`: 연결 가능.
- 실행 전 8080 포트: listener 없음.
- Node.js, npm, `jsdom`, `@playwright/test`: 사용 가능.
- 이번 QA 서버의 시작 로그, listener PID 34024, `/login` HTTP 200 확인.
- DB 접속 계정과 비밀번호는 보고서에 기록하지 않음.

## 3. 실행 결과

| 단계 | 결과 | 상세 |
|---|---|---|
| Java/Gradle | PASS | 119 tests, 119 passed, 0 failed, 0 errors, 0 skipped. JavaScript는 별도 실행하도록 `-x jsTest`를 사용함. |
| JavaScript | PASS | 40 tests, 40 passed, 0 failed. 프로필 설정 검증 테스트 포함. |
| 4인 코어 및 재플레이 | PASS | `MVP 4인 핵심 게임 흐름` 통과. Regression에서 지정한 동일 방 재플레이 포함. |
| 6인 코어 | PASS | `MVP 6인 핵심 게임 흐름` 통과. 마피아/Spy, Soldier 및 게임 진행 assertions 포함. |
| 8인 코어 | PASS | `MVP 8인 핵심 게임 흐름` 통과. 최대 인원 게임 흐름과 Medium 조사 assertions 포함. |
| UI chat-scroll | PASS | 30개 메시지 제출 후 내부 스크롤과 페이지 높이 유지 검증 통과. |
| UI 방 레이아웃 | PASS | 5인 방 레이아웃·설정·상태 검증 통과. |
| 테스트 데이터 정리 | PASS | 이번 실행 ID 계정 24개와 실행 방 1개를 대상으로 정리했고 잔여 계정·방 0개를 확인함. 기존 데이터는 선택하지 않음. |
| QA 서버 정리 | PASS | 이번 실행의 listener PID만 종료하고 8080 포트가 비었음을 확인함. |

실행 명령:

- ` .\gradlew.bat test --no-daemon --rerun-tasks -x jsTest`
- `node --test --test-isolation=none test/js/stomp-client.test.js test/js/room-list.test.js test/js/chat.test.js test/js/e2e-profile.test.js`
- ` .\gradlew.bat bootRun --no-daemon` (`SERVER_PORT=8080`, `E2E_PROFILE=regression`, `MAFIAGAME_PHASE_PROFILE=short`)
- `npm.cmd run test:e2e -- --workers=1 --retries=0 --reporter=list` (`PLAYER_COUNTS=4,6,8`)
- `npm.cmd run test:e2e:ui -- --workers=1 --retries=0 --reporter=list` (`E2E_CAPACITY=5`)

## 4. 검증 범위와 제한

4·6·8인 코어 시나리오와 4인 재플레이, 30개 메시지 chat-scroll, 5인 방 레이아웃을 실제 애플리케이션 서버에서 검증했다. Regression은 3초 단축 페이즈를 사용하므로 운영 페이즈 시간(15/60/20/20/20/35초)을 검증하지 않는다. Smoke 전용/Full 전용 범위인 4인 외 인원 구성, 6인 복원 확장 사례, 210개 메시지 stress, Full의 production timing과 전체 증거 수집은 실행하지 않았다.

이번 프로필은 스크린샷을 켜고 비디오는 끈다. 생성된 화면 증거와 로그 경로는 아래 산출물에 기록했다.

## 5. 산출물

- 전체 실행 로그: `output/test_output/2026-09-23/qa-run-qa-20260923-131334-regression/`
- Java 결과 로그: `gradle-test.log`
- JavaScript 결과 로그: `javascript-test.log`
- 서버 시작/오류 로그: `bootRun.stdout.log`, `bootRun.stderr.log`
- E2E 로그: `playwright-core.log`, `playwright-ui.log`
- 코어 스크린샷: `output/test_output/2026-09-23/mafia-mvp-test-regression-qa-20260923-131334-regression/`
- chat-scroll 스크린샷: `output/test_output/2026-09-23/chat-scroll-test-qa-20260923-131334-regression/`
- 방 레이아웃 스크린샷: `output/test_output/2026-09-23/room-layout-test-5-qa-20260923-131334-regression/`
- Playwright 메타데이터: `output/test_output/2026-09-23/playwright-qa-20260923-131334-regression/core/`, `.../ui/`
- Gradle JUnit XML: `build/test-results/test/`
- Gradle HTML 보고서: `build/reports/tests/test/index.html`

---

---

## 문서 7: `MAFIAGAME_QA_REPORT_2026-09-23_qa-20260923-150416-smoke.md`

# MAFIAGAME QA Report — Smoke

- Date: 2026-09-23
- Run ID: `qa-20260923-150416`
- Profile: `smoke` (4-player core E2E; room-layout/profile UI at capacity 5; short phases)
- Overall: **FAIL** — core and unit suites passed; room-layout/profile UI E2E failed.
- Full QA: **NOT RUN** (not part of profile 1 and explicitly excluded).

## Results

| Suite | Result | Actual result |
|---|---|---|
| Java / Spring / MyBatis | PASS | 121 tests; 0 failures, 0 errors, 0 skipped. Command: `./gradlew.bat test --no-daemon --rerun-tasks -x jsTest` (`BUILD SUCCESSFUL`). |
| Standalone JavaScript | PASS | 40 passed; 0 failed, skipped, or cancelled. Command: `node --test --test-isolation=none test/js/stomp-client.test.js test/js/room-list.test.js test/js/chat.test.js test/js/e2e-profile.test.js`. |
| Smoke core E2E | PASS | `MVP 4인 핵심 게임 흐름 › 인증부터 한 사이클까지 동기화 검증`; 1 passed in 37.6s, workers=1, retries=0. |
| Smoke room-layout/profile UI E2E | FAIL | `waiting and started room layout (5 players)` timed out after 90s. At `room-layout.spec.js:71`, clicking `.user-menu-toggle` was intercepted by the visible `#patchNotesModal` overlay. No retry was run. |
| Server lifecycle | PASS | Fresh app reported startup and `/login` returned HTTP 200. The QA-started server was stopped; port 8080 is free. |
| Test-account cleanup | PASS | Found 9 accounts for this exact run ID, deleted 9 users and 9 `user_stats` rows; 0 remaining. No room-member or game-room rows matched for deletion. |

## Environment and scope

MariaDB at `127.0.0.1:23306` was reachable before tests; Node.js, npm, `jsdom`, and Playwright dependencies were present. Port 8080 was free before startup. The E2E run used `PLAYER_COUNTS=4`, `E2E_PROFILE=smoke`, `E2E_CAPACITY=5`, `MAFIAGAME_PHASE_PROFILE=short`, one worker, and zero retries. No Full-only cases, replay, resilience, or chat-scroll cases were run; they are outside Smoke scope.

During startup preparation, an initial wrapper invocation hit a PowerShell syntax error after launching its QA app; its logged application PID was then stopped. A subsequent attempt detected that same QA-started process occupying port 8080 and stopped before E2E. The final run used a fresh foreground server, then completed cleanup and verified the port free. No unrelated server was stopped.

## Evidence

- Playwright output root: `output/test_output/2026-09-23/playwright-qa-20260923-150416/`
- UI failure context: `output/test_output/2026-09-23/playwright-qa-20260923-150416/ui/room-layout-waiting-and-started-room-layout-5-players-/error-context.md`
- Playwright trace: `output/test_output/2026-09-23/playwright-qa-20260923-150416/ui/room-layout-waiting-and-started-room-layout-5-players-/trace.zip`
- Java JUnit XML: `build/test-results/test/`
- Java HTML report: `build/reports/tests/test/index.html`
- Per-run startup logs: `output/test_output/2026-09-23/qa-run-qa-20260923-150416/` (final server was run in the foreground; its console output is recorded in the QA execution transcript).

The test failure is not marked as passing. The likely next investigation is to inspect patch-note modal dismissal/state in `test/e2e/room-layout.spec.js` around line 71 and the modal's first-visit behavior, then rerun the explicitly selected profile after any requested fix.

---

---

## 문서 8: `MAFIAGAME_QA_REPORT_2026-09-23_qa-20260923-152338-smoke.md`

# MAFIAGAME QA 보고서 — Smoke

## 1. 실행 환경

- 실행일: 2026-09-23
- 실행 ID: `qa-20260923-152338-smoke`
- 브랜치: `develop`
- 선택 프로필: Smoke (1번)
- 워커: 요청 1, 실제 1
- 테스트 범위: Java/JavaScript, 4인 핵심 게임 E2E, 5인 정원 방 레이아웃·프로필 UI
- 페이즈 설정: `short`
- Playwright 재시도: 0회
- 판정: **PASS** (Smoke 프로필에 포함된 모든 실행 항목 통과)
- Full QA: **NOT RUN** (요청 프로필 범위 밖)

## 2. DB 및 의존성 사전 점검

- MariaDB `127.0.0.1:23306`: 연결 가능
- QA 전용 계정 네임스페이스(`qa-20260923-152338-smoke`): 기존 계정 0개
- 8080 포트: 실행 전 사용 중인 서버 없음
- Node.js `v24.19.0`, npm `11.17.0`, Java 테스트 런타임 `21.0.12`
- `node_modules/jsdom`, `node_modules/@playwright/test`: 존재

## 3. 확인한 주요 파일

- `AGENTS.md`
- `docs/QA_scripts/MAFIAGAME_QA_TEST_EXECUTION_SCRIPT.md`
- `build.gradle`, `package.json`, `playwright.config.js`
- `src/main/**`, 관련 `src/test/**`, `test/js/**`, `test/e2e/**`
- 특히 `test/e2e/room-layout.spec.js`의 첫 방문 패치노트 모달 처리

## 4. 실행 명령

```powershell
.\gradlew.bat test --no-daemon --rerun-tasks -x jsTest
node --test --test-isolation=none test/js/stomp-client.test.js test/js/room-list.test.js test/js/chat.test.js test/js/e2e-profile.test.js
npm.cmd run test:e2e -- --workers=1 --retries=0 --reporter=list
npm.cmd exec -- playwright test test/e2e/room-layout.spec.js --workers=1 --retries=0 --reporter=list
```

서버는 현재 작업 트리에서 `SERVER_PORT=8080`, `E2E_PROFILE=smoke`, `MAFIAGAME_PHASE_PROFILE=short`로 새로 기동했습니다. 완료 후 현재 실행 ID 계정만 정리했습니다.

## 5. Java 테스트 결과

Gradle 명령 종료 코드 0, `BUILD SUCCESSFUL`.

| 테스트 클래스 | 테스트 수 | 실패/오류/건너뜀 |
|---|---:|---:|
| `WebSocketAuthorizationInterceptorTest` | 7 | 0 / 0 / 0 |
| `ControllerDelegationTest` | 4 | 0 / 0 / 0 |
| `RoomControllerTest` | 5 | 0 / 0 / 0 |
| `MapperIntegrationTest` | 2 | 0 / 0 / 0 |
| `MafiagameApplicationTest` | 1 | 0 / 0 / 0 |
| `ChatServiceTest` | 3 | 0 / 0 / 0 |
| `RoomGameServiceTest` | 54 | 0 / 0 / 0 |
| `RoomPresenceServiceTest` | 25 | 0 / 0 / 0 |
| `RoomServiceTest` | 10 | 0 / 0 / 0 |
| `SignupServiceTest` | 4 | 0 / 0 / 0 |
| `UserAccountServiceTest` | 6 | 0 / 0 / 0 |
| **합계** | **121** | **0 / 0 / 0** |

## 6. JavaScript 테스트 결과

독립 실행 결과: **41 통과, 0 실패, 0 건너뜀**. 프로필 구성, 패치노트 모달 표시·숨김, STOMP/채팅, 방 목록 동기화 및 모든 프로필 공통 서버 생명주기 문서 회귀 검사가 통과했습니다.

## 7. 서버 기동 및 종료

- Spring Boot 시작 완료: `PASS`
- `/login`: HTTP 200
- QA 앱/포트 리스너 PID: `26396`
- QA 앱 PID와 런처 프로세스 트리 정리: `PASS`
- 종료 후 8080 포트: 사용 가능

## 8. Playwright 실행 범위와 결과

- 프로필: `smoke`
- 핵심 플레이어 수: `4`; 다시하기·복원 시나리오: Smoke 범위에 없음
- UI 정원: `5`
- 페이즈: `short`
- 트레이스: 실패 시 보존 설정; 실패가 없어 생성된 실패 트레이스 없음
- 정기 스크린샷/동영상: Smoke 정책에 따라 수집하지 않음
- 별도 `--list` 탐색: Smoke 정책에 따라 실행하지 않음
- 핵심 E2E: **1/1 통과** — `MVP 4인 핵심 게임 흐름 › 인증부터 한 사이클까지 동기화 검증` (37.4초)
- UI E2E: **1/1 통과** — `waiting and started room layout (5 players)` (9.9초)

## 9. 플레이어 수·확장 시나리오별 판정

| 시나리오 | 결과 | 범위 설명 |
|---|---|---|
| 4인 핵심 게임 흐름 | PASS | 실제 브라우저에서 한 사이클 검증 |
| 5인 핵심 게임 흐름 | NOT RUN | Smoke 프로필의 핵심 게임 범위가 아님 |
| 5인 정원 방 레이아웃·프로필 UI | PASS | 5개 브라우저 참가 및 UI 검증 |
| 6·7·8인 핵심 흐름 | NOT RUN | Smoke 프로필 범위 밖 |
| 6→5 인원 변경 복원 | NOT RUN | Full 전용 확장 시나리오 |
| 재접속 유예·마감시간 경합 | NOT RUN | Full 전용 확장 시나리오 |
| 채팅 스크롤 부하 | NOT RUN | Smoke 프로필 범위 밖 |

## 10. MVP 검증 요약

| 항목 | 결과 및 근거 |
|---|---|
| 역할 배정·확인 | PASS — Java 서비스 테스트 및 4인 브라우저 게임 흐름 통과. 실제 프로덕션 페이즈 시간 측정은 Smoke 범위가 아님 |
| 최종 변론·투표·게임 종료 | PASS — Java 테스트와 4인 핵심 브라우저 시나리오 통과 |
| 사용자 프로필 통계·레벨 | PASS — 신규 사용자의 `Lv. 1`, 프로필 게임/승/패 합계 0 확인 |
| 방 레이아웃 | PASS — 300px 게임 패널, 데스크톱 열 정렬, 모바일 세로 배치 확인 |
| 호스트 전용 방 설정 | PASS — 호스트 버튼 순서와 비호스트 미노출 검증 통과 |
| 첫 방문 패치노트 모달 | PASS — 표시를 확인하고 닫은 뒤 사용자 메뉴 이동 성공 |
| 역할별 진영·조사 결과 및 채널 표시 | PASS — 관련 JavaScript 테스트 통과 |
| 15/60/20/20/20/35초 프로덕션 페이즈 시간 | NOT RUN — Full 전용 검증 |

## 11. 실패 및 차단 항목

이번 실행에서 실패하거나 차단된 항목은 없습니다. Full 전용 및 Smoke 범위 밖 시나리오는 위 표와 같이 `NOT RUN`입니다.

## 12. 재현 절차

1. MariaDB 연결과 8080 포트 비사용 상태를 확인합니다.
2. 위 Java 및 JavaScript 명령을 실행합니다.
3. 새 서버를 Smoke/short 설정으로 기동합니다.
4. 4인 핵심 E2E 후 5인 방 레이아웃 UI E2E를 각각 워커 1개, 재시도 0회로 실행합니다.
5. 실행 ID `qa-20260923-152338-smoke`에 한정된 테스트 계정만 정리하고 서버 종료 후 포트를 확인합니다.

## 13. 원인 분석

직전 QA 실패는 앱의 모달 동작 오류가 아니라 방 레이아웃 E2E 흐름의 누락이었습니다. 첫 방문에 표시된 패치노트 모달이 뒤쪽 UI 조작을 막는데 테스트가 이를 닫지 않고 사용자 메뉴를 클릭했습니다. 테스트에 모달 표시 확인·닫기·숨김 확인을 추가한 뒤 이번 실행에서 해당 시나리오가 통과했습니다.

## 14. 앱 결함과 테스트 결함 구분

- 앱 결함: 이번 실행에서 발견되지 않음
- 테스트 결함: 첫 방문 모달을 닫지 않던 E2E 절차 누락을 수정했고, 이번 Smoke UI 시나리오로 확인

## 15. 변경 파일

- `test/e2e/room-layout.spec.js:27` — 첫 방문 패치노트 모달 닫기 및 숨김 확인 함수
- `test/e2e/room-layout.spec.js:78` — 사용자 메뉴 클릭 전에 해당 함수 호출

## 16. 권고사항

현 수정 사항에 추가 조치는 필요하지 않습니다. 프로덕션 페이즈 시간 및 Full 전용 확장 경계는 별도의 명시적 Full QA 요청이 있을 때 검증합니다.

## 17. 산출물

- Java 콘솔 로그: `output/test_output/2026-09-23/qa-run-qa-20260923-152338-smoke/java-tests.log`
- JavaScript 콘솔 로그: `output/test_output/2026-09-23/qa-run-qa-20260923-152338-smoke/javascript-tests.log`
- 핵심 E2E 로그: `output/test_output/2026-09-23/qa-run-qa-20260923-152338-smoke/playwright-core.log`
- UI E2E 로그: `output/test_output/2026-09-23/qa-run-qa-20260923-152338-smoke/playwright-ui.log`
- 서버 표준 출력/오류: `output/test_output/2026-09-23/qa-run-qa-20260923-152338-smoke/bootRun.qa-20260923-152338-smoke.stdout.log`, `bootRun.qa-20260923-152338-smoke.stderr.log`
- 계정 정리 로그: `output/test_output/2026-09-23/qa-run-qa-20260923-152338-smoke/account-cleanup.log`
- Playwright 결과 디렉터리: `output/test_output/2026-09-23/playwright-qa-20260923-152338-smoke/{core,ui}/`
- 시나리오 산출물: `output/test_output/2026-09-23/mafia-mvp-test-smoke-qa-20260923-152338-smoke/`, `output/test_output/2026-09-23/room-layout-test-5-qa-20260923-152338-smoke/`
- Java JUnit XML: `build/test-results/test/`; HTML 보고서: `build/reports/tests/test/index.html`
- 스크린샷/동영상: Smoke 수집 정책에 따라 생성하지 않음

## 18. 기존 데이터 보존

사전 실행 ID 네임스페이스는 비어 있음을 확인했습니다. 삭제는 이번 실행 ID의 Playwright 계정 및 그 종속 데이터에만 한정했으며, 기존 사용자·방·데이터는 삭제하지 않았습니다.

## 19. 테스트 계정 정리

- 현재 실행에서 발견한 계정: 9개
- 삭제: 9개
- 잔여 계정: 0개
- 계정 정리: **PASS**

## 20. 최종 판정

**PASS** — Smoke 프로필에서 요청된 Java, JavaScript, 4인 핵심 E2E, 5인 방 레이아웃·프로필 UI가 모두 통과했고, QA 계정과 서버 정리도 확인했습니다. Full QA는 실행하지 않았습니다.

---
