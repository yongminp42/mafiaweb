# MAFIAGAME QA 보고서 — 2026-09-20

- 포함 보고서 수: 10
- 날짜 및 실행 시각 순서: 오래된 보고서부터

## 목차

1. `MAFIAGAME_DEBUG_TEST_REPORT_2026-09-20.md`
2. `MAFIAGAME_QA_REPORT_2026-09-20_qa-20260920-014701.md`
3. `MAFIAGAME_QA_REPORT_2026-09-20_qa-20260920-022915.md`
4. `MAFIAGAME_QA_REPORT_2026-09-20_qa-20260920-112243.md`
5. `MAFIAGAME_QA_REPORT_2026-09-20_qa-20260920-1202.md`
6. `MAFIAGAME_QA_REPORT_2026-09-20_qa-20260920-1302.md`
7. `MAFIAGAME_QA_REPORT_2026-09-20_qa-20260920-1401-full.md`
8. `MAFIAGAME_QA_REPORT_2026-09-20_qa-20260920-1440-full.md`
9. `MAFIAGAME_QA_REPORT_2026-09-20_qa-20260920-165300.md`
10. `MAFIAGAME_QA_REPORT_2026-09-20_qa-20260920-221345.md`

---

## 문서 1: `MAFIAGAME_DEBUG_TEST_REPORT_2026-09-20.md`

### MAFIAGAME 디버깅 및 재검증 보고서

- 작성일: 2026-09-20 (Asia/Seoul)
- 기준 보고서: `docs/QA_report/MAFIAGAME_QA_REPORT_2026-09-19_qa-20260919-224111.md`
- 대상 프로젝트: `C:\workspace\mafiaweb`

## 1. 초기 QA 실패 요약

| 항목 | 초기 결과 |
|---|---|
| Gradle Java 테스트 | 79개 중 1개 실패 |
| JavaScript 테스트 | 18개 통과 |
| Playwright 4명 | PASS |
| Playwright 5명 | PASS |
| Playwright 6명 | FAIL: `/rooms/14` 이동 중 `net::ERR_ABORTED` |
| Playwright 8명 | NOT RUN: 6명 시나리오 실패로 중단 |

## 2. 원인 분석

### 2.1 동률 승리 테스트 기대값 오류

`RoomGameServiceTest.declaresMafiaVictoryWhenMafiaAndCitizenFactionAreEven()`은 마피아 2명과 시민 진영 2명인 경우를 마피아 승리로 기대하고 있었습니다.

현재 게임 규칙은 생존 마피아가 시민 진영 생존자보다 **많을 때(`>`)** 마피아 승리입니다. 따라서 2 대 2에서는 게임이 종료되지 않고 다음 밤으로 진행되는 것이 올바릅니다.

### 2.2 6명 E2E의 `ERR_ABORTED`

서버 로그에서 `/rooms/14` 요청은 정상적으로 `200 OK`를 반환했습니다. 실패 원인은 서버 응답이 아니라 다음 브라우저 내비게이션 경쟁이었습니다.

1. 방 생성 후 로비의 새 방 목록에 아직 새 방 카드가 없음
2. `room-list.js`가 150ms 후 `window.location.reload()`를 예약함
3. 다른 테스트 브라우저가 동시에 `/rooms/14`로 이동함
4. 예약된 로비 새로고침이 방 이동을 중단해 `net::ERR_ABORTED` 발생

## 3. 적용한 수정

- 동률 테스트 이름과 기대값을 새 승리 규칙에 맞게 변경
  - 결과: `NIGHT`
  - `gameOver`: `false`
  - `winningFaction`: `null`
- `room-list.js`에 페이지 이동 상태를 추가
- `beforeunload` 시 예약된 로비 새로고침을 취소
- 이동 중인 페이지에서는 새로고침 예약 및 실행을 무시
- 예약 새로고침 취소에 대한 JavaScript 회귀 테스트 추가
- E2E 방 입장 단계에서 `domcontentloaded` 이후 실제 방 URL 도착 여부를 명시적으로 검증

## 4. 수정 후 검증 결과

| 검증 항목 | 결과 | 세부 내용 |
|---|---|---|
| Gradle 전체 테스트 | PASS | Java 79개, JavaScript 19개 |
| 독립 JavaScript 테스트 | PASS | 19/19 |
| 6명 Playwright 단독 재검증 | PASS | 1 passed, 테스트 약 3.7분 |
| 8명 Playwright 단독 재검증 | PASS | 1 passed, 테스트 약 3.8분 |
| 6명 입장 단계 재현 여부 | PASS | 기존 `ERR_ABORTED` 미재현 |
| 8명 실제 브라우저 흐름 | PASS | 역할·밤 행동·재플레이·타이머 포함 |

실행 명령:

```text
gradlew.bat test --no-daemon --rerun-tasks
npm.cmd run test:js
npm.cmd run test:e2e -- --workers=2 --reporter=list
```

E2E 재검증은 `PLAYER_COUNTS=6` 및 `PLAYER_COUNTS=8`로 각각 별도 실행했습니다.

## 5. 테스트 계정 정리

디버깅 재검증에서 생성된 계정은 실행 ID별로 삭제했습니다.

| 실행 ID | 발견 | 삭제 | 잔여 |
|---|---:|---:|---:|
| `debug-20260919-225942` | 6 | 6 | 0 |
| `debug-20260919-230547` | 8 | 8 | 0 |
| 합계 | 14 | 14 | 0 |

두 정리 작업 모두 DB 트랜잭션 `COMMIT`에 성공했습니다. 테스트 서버는 각 실행 후 종료했고 8080 포트도 닫힌 상태입니다.

## 6. 최종 판단

재현된 두 결함은 수정되었고, 관련 Java/JavaScript 테스트와 6명·8명 실제 브라우저 흐름은 통과했습니다.

다만 수정 후 `PLAYER_COUNTS=4,5,6,8` 전체를 한 번에 실행한 통합 Playwright 재실행은 아직 수행하지 않았습니다. 따라서 이번 디버깅 결과는 **결함 수정 확인 PASS, 전체 통합 회귀는 추가 실행 필요**로 판정합니다.

이번 테스트케이스 보강 이후에는 사용자의 요청에 따라 테스트를 재실행하지 않았습니다. 해당 변경의 검증 상태는 **NOT RUN**입니다.

---

---

---

## 문서 2: `MAFIAGAME_QA_REPORT_2026-09-20_qa-20260920-014701.md`

### MAFIAGAME QA 실행 보고서

- 실행일: 2026-09-20 (Asia/Seoul)
- 기준 스크립트: `docs/QA_scripts/MAFIAGAME_QA_TEST_EXECUTION_SCRIPT.md`
- 실행 ID: `qa-20260920-014701`
- 대상 인원수: 4, 5, 6, 8명
- 요청 워커 수: 2
- 실제 워커 수: 1 (`test.describe.serial` 구조)
- 소스 수정: 없음

## 종합 결과

**FAIL / CLEANUP BLOCKED**

Java와 JavaScript 테스트는 통과했지만, Playwright가 첫 회원가입 단계에서 데이터베이스 연결 실패로 중단되었습니다. 이에 따라 5·6·8명 시나리오는 실행되지 않았고, 데이터베이스가 꺼져 있어 테스트 계정 정리도 완료할 수 없었습니다.

## 실행 결과

| 영역 | 결과 | 근거 |
|---|---|---|
| Gradle 전체 테스트 | PASS | Java 테스트 통과, JavaScript 19개 통과 |
| 독립 `npm.cmd run test:js` | PASS | 19개 통과, 0개 실패 |
| 서버 헬스체크 | PASS | `/login` HTTP 200 |
| Playwright 4명 | FAIL | 회원가입 POST 후 `/signup`에 남고 HTTP 500 응답 |
| Playwright 5명 | NOT RUN | 4명 시나리오 실패로 serial 실행 중단 |
| Playwright 6명 | NOT RUN | 4명 시나리오 실패로 serial 실행 중단 |
| Playwright 8명 | NOT RUN | 4명 시나리오 실패로 serial 실행 중단 |
| 테스트 계정 정리 | BLOCKED | MariaDB `localhost:23306` 연결 거부 |

## Java 및 JavaScript 검증

실행 명령:

```text
gradlew.bat test --no-daemon --rerun-tasks
npm.cmd run test:js
```

Gradle 결과:

```text
BUILD SUCCESSFUL
JavaScript tests: 19 passed, 0 failed
```

독립 JavaScript 결과:

```text
tests 19
pass 19
fail 0
```

## Playwright 실패 상세

실패 테스트:

```text
MVP 4인 핵심 게임 흐름
test/e2e/mafia-mvp.spec.js:437
```

실패 지점:

```text
signUpAndLogin:221
expect(page).toHaveURL(/\/login(?:\?signup)?$/)
Expected: /login
Received: http://127.0.0.1:8080/signup
```

오류 페이지에는 다음 원인이 표시되었습니다.

```text
HTTP 500 Internal Server Error
CannotCreateTransactionException: Could not open JDBC Connection for transaction
SQLNonTransientConnectionException: Socket fail to connect to localhost:23306
Connection refused
```

오류 아티팩트:

`test-results/test-e2e-mafia-mvp-MVP-4인-핵심-게임-흐름-인증부터-한-사이클까지-동기화-검증/error-context.md`

서버 로그:

`test-results/qa-full-bootrun.stdout.log`

## 환경 상태

- 애플리케이션 서버: QA 실행 중 기동됨
- `/login`: HTTP 200
- MariaDB 포트 `23306`: LISTEN 상태 아님
- 애플리케이션 서버: QA 실행 후 종료됨
- 8080 포트: LISTEN 상태 아님

## 테스트 계정 정리

QA 스크립트 규칙에 따라 실행 ID `qa-20260920-014701`로 계정 정리를 시도했습니다.

정리 SQL 실행 시 MariaDB 연결 자체가 거부되어 계정 조회와 삭제를 수행하지 못했습니다.

- 발견 계정 수: 확인 불가
- 삭제 계정 수: 확인 불가
- 잔여 계정 수: 확인 불가
- 정리 결과: **BLOCKED**

DB가 다시 실행된 뒤 아래 실행 ID로 계정 잔여 여부를 확인하고 정리해야 합니다.

```text
qa-20260920-014701
```

## 최종 판정

- Java/JavaScript: PASS
- Playwright 전체 QA: FAIL
- 5·6·8명 브라우저 시나리오: NOT RUN
- 테스트 계정 정리: BLOCKED

MariaDB `localhost:23306`가 정상적으로 실행된 뒤 전체 QA(`PLAYER_COUNTS=4,5,6,8`)를 다시 수행해야 최종 PASS 여부를 판단할 수 있습니다.

---

---

---

## 문서 3: `MAFIAGAME_QA_REPORT_2026-09-20_qa-20260920-022915.md`

### MAFIAGAME QA 실행 리포트

- 실행 ID: `qa-20260920-022915`
- 실행일: 2026-09-20
- 기준 스크립트: `docs/QA_scripts/MAFIAGAME_QA_TEST_EXECUTION_SCRIPT.md`
- 대상 인원: `4,5,6,8`
- Playwright worker 설정: `2` (테스트 파일의 serial 설정으로 실제 1 worker 순차 실행)
- 소스 수정: 없음
- 패키지 설치: 없음

## 종합 결과

**PASS**

MariaDB가 이미 `localhost:23306`에서 실행 중인 상태를 확인한 뒤 테스트를 진행했다. 애플리케이션을 임시 실행하여 QA를 수행했고, 테스트 종료 후 애플리케이션은 종료했다. MariaDB는 사용자 요청에 따라 중지하거나 설치하지 않았다.

## 실행 결과

| 구분 | 결과 | 근거 |
|---|---|---|
| Gradle 통합 테스트 | PASS | Java 79개, JavaScript 19개, 실패 0개 |
| 독립 JavaScript 회귀 테스트 | PASS | `npm run test:js`, 19개 통과 |
| 애플리케이션 health check | PASS | `GET /login` HTTP 200 |
| Playwright 4명 | PASS | 3.7분 |
| Playwright 5명 | PASS | 3.7분 |
| Playwright 6명 | PASS | 3.7분 |
| Playwright 8명 | PASS | 3.7분 |
| Playwright 전체 | PASS | 4개 통과, 약 16.1분 |
| QA 계정 정리 | PASS | 현재 실행 계정 23개 삭제, 잔여 0개 |
| 이전 장애 실행 계정 정리 | PASS | `qa-20260920-014701` 일치 계정 0개, 잔여 0개 |

## 검증 범위

Playwright 기본 E2E 흐름에서 다음 항목을 4·5·6·8명 각각 실제 브라우저로 수행했다.

- 회원가입·로그인·방 생성 및 방 참가
- 지정 인원수 구성 및 방 URL 동기화
- 준비 완료와 게임 시작
- 역할 배정 및 인원별 마피아 수 검증
- 밤 행동과 낮 처형 투표
- 처형 이후 페이즈 전환 및 승리 종료
- 새로고침 후 상태 복원
- 게임 종료 후 재플레이 준비 및 재시작
- 실행 ID가 포함된 테스트 계정 생성 및 정리

단위·서비스·클라이언트 회귀 테스트에서는 채팅 채널, 역할별 밤 행동, 승리 조건, 중복·무효 요청, 재접속·탈주, 타이머 및 방 목록 갱신 관련 검증을 함께 확인했다.

## 정리 및 환경 상태

- 애플리케이션 포트 `8080`: 테스트 후 STOPPED
- MariaDB 포트 `23306`: 외부 실행 상태 유지
- 현재 실행 계정: `playwright.qa-20260920-022915.%@example.com` 일치 23개 → 0개
- 이전 장애 실행 계정: `playwright.qa-20260920-014701.%@example.com` 일치 0개 → 0개
- 기존 소스 변경은 이번 QA 실행 중 추가되지 않음

## 산출물

- Playwright 결과: `test-results/`
- 서버 표준 출력: `test-results/qa-full-bootrun.stdout.log`
- 서버 오류 출력: `test-results/qa-full-bootrun.stderr.log`


---

## 4. 2026-09-20 후속 QA 실행 기록

---

---

## 문서 4: `MAFIAGAME_QA_REPORT_2026-09-20_qa-20260920-112243.md`

# MAFIAGAME QA 실행 보고서

## 1. 실행 환경

- 실행일: 2026-09-20
- 프로젝트: `C:\workspace\mafiaweb`
- Base URL: `http://127.0.0.1:8080`
- MariaDB: `localhost:23306`
- MariaDB 연결 확인: `SELECT 1` 성공
- E2E: 활성화
- 요청 인원수: `4,5,6,8`
- 요청 Playwright worker: `2`
- 실제 Playwright worker: `1`
  - `test/e2e/mafia-mvp.spec.js`가 `serial` 모드라 Playwright 출력이 `Running 4 tests using 1 worker`로 확인됨
- `$deleteExistingData`: `false`
- `$deleteTestAccounts`: `true`
- `$sourceModificationAllowed`: `false`
- `E2E_RUN_ID`: `qa-20260920-112243`

MariaDB는 Windows의 `127.0.0.1:23306`에서 WSL relay를 통해 LISTEN 중이었으며, PID 5844는 `wslrelay.exe`였다. 이전 `Get-NetTCPConnection` 결과가 비어 보였지만 `netstat`와 JDBC 연결 결과로 실제 DB 작동을 확인했다.

## 2. 사전 점검 파일

- `AGENTS.md`
- `docs/MAFIAGAME_MVP.md`
- `docs/QA_scripts/MAFIAGAME_QA_TEST_EXECUTION_SCRIPT.md`
- `package.json`
- `build.gradle`
- `src/main/**`
- `src/test/**`
- `test/js/**`
- `test/e2e/**`

## 3. 실행 명령

```powershell
$env:GRADLE_USER_HOME='C:\workspace\mafiaweb\.gradle-test'
.\gradlew.bat test --no-daemon --rerun-tasks
```

```powershell
npm.cmd run test:js
```

```powershell
$env:PLAYER_COUNTS='4,5,6,8'
$env:E2E_RUN_ID='qa-20260920-112243'
$env:BASE_URL='http://127.0.0.1:8080'
npm.cmd run test:e2e -- --workers=2 --reporter=list
```

서버는 8080에 기존 리스너가 없어 QA 실행에서만 PID `28588`로 시작했다. 첫 번째 `Start-Process` 호출은 `cmd.exe`에서 `'.gradlew.bat'`를 찾지 못해 실패했으며, 원인을 확인한 뒤 `gradlew.bat bootRun --no-daemon`으로 다시 시작했다. 이는 애플리케이션 테스트 실패가 아닌 QA 실행 준비 명령의 인자 전달 오류다.

## 4. Java 및 Gradle 테스트 결과

결과: `PASS`

- Gradle 결과: `BUILD SUCCESSFUL in 34s`
- Java 테스트: 79개
- Java 실패: 0개
- Java 오류: 0개
- Gradle에 의해 함께 실행된 JavaScript 테스트: 19개 PASS
- Spring context/MyBatis 관련 테스트: 실패 없음
- MariaDB 실제 연결: `DB_QUERY_OK=1`

주요 콘솔 출력:

```text
> Task :test
BUILD SUCCESSFUL in 34s
6 actionable tasks: 6 executed
```

JUnit XML:

- `build/test-results/test/TEST-*.xml`
- 11개 XML 파일, `tests=79`, `failures=0`, `errors=0`

Gradle HTML:

- `build/reports/tests/test/index.html`

## 5. Standalone JavaScript 테스트 결과

결과: `PASS`

명령:

```text
npm.cmd run test:js
```

출력:

```text
tests 19
pass 19
fail 0
cancelled 0
```

검증된 범위:

- STOMP frame escape/parser/reconnect backoff
- 로비 인원 및 온라인 인원 동기화
- 방 목록 갱신과 빈 방 제거
- 방 이동 중 pending refresh 취소 단위 테스트
- 준비 상태 처리
- 게임 페이즈 UI
- 역할별 밤 행동 UI
- 지목·처형 투표 UI
- 경찰 조사 결과
- 게임 결과 및 승리 진영
- 재접속 상태 처리

## 6. 서버 시작 및 health check

결과: `PASS`

```text
health_attempt=1 status=200
HEALTH_PASS
```

- 서버 stdout: `test-results/bootRun.stdout.log`
- 서버 stderr: `test-results/bootRun.stderr.log`
- `/login` 응답: HTTP 200
- QA에서 시작한 서버는 최종 cleanup 단계에서 PID 트리 종료
- 종료 후 8080 LISTEN 없음
- MariaDB와 DBeaver 프로세스는 종료하지 않음

## 7. Playwright E2E 결과

최종 결과: `FAIL`

Playwright 출력:

```text
Running 4 tests using 1 worker
ok 1 test ... MVP 4인 핵심 게임 흐름 ... (3.7m)
x  2 test ... MVP 5인 핵심 게임 흐름 ... (7.6s)
-  3 test ... MVP 6인 핵심 게임 흐름
-  4 test ... MVP 8인 핵심 게임 흐름
1 failed
2 did not run
1 passed (5.0m)
```

### 인원수별 결과

| 시나리오 | 결과 | 근거 |
|---|---|---|
| 4명 | `PASS` | 실제 브라우저 인증·방 입장·준비·게임 시작·역할·채팅·60/15/15/30초 페이즈·밤 행동·승리·재플레이 완료 |
| 5명 | `FAIL` | `/rooms/22` 이동 중 다른 navigation `/rooms`가 발생하여 `page.goto` 중단 |
| 6명 | `NOT RUN` | 5명 실패 후 serial suite가 중단되어 실행되지 않음 |
| 8명 | `NOT RUN` | 5명 실패 후 serial suite가 중단되어 실행되지 않음 |

### 5명 실패 상세

- 파일: `test/e2e/mafia-mvp.spec.js:468`
- 실패 호출:

```javascript
await pages[index].goto(roomUrl, { waitUntil: 'domcontentloaded' });
```

- 오류:

```text
Error: page.goto: Navigation to "http://127.0.0.1:8080/rooms/22" is interrupted by another navigation to "http://127.0.0.1:8080/rooms"
```

- Playwright error context:
  - `test-results/test-e2e-mafia-mvp-MVP-5인-핵심-게임-흐름-인증부터-한-사이클까지-동기화-검증/error-context.md`
- Playwright 상태:
  - `test-results/.last-run.json`
- PNG/trace/zip artifact: 이번 실패에서는 생성되지 않음

### 실패 원인 분석

5명 계정이 로비에 연결된 뒤 방 22가 생성되면서 로비의 새 방 인원 이벤트가 전달됐다. `room-list.js`는 현재 카드에 없는 live room을 발견하면 150ms 후 `window.location.reload()`를 예약한다.

- `src/main/resources/static/js/room-list.js:36-45`: pending room-list refresh 예약 및 reload
- `src/main/resources/static/js/room-list.js:187-195`: `beforeunload`에서 예약 취소
- `test/e2e/mafia-mvp.spec.js:465-470`: 같은 페이지가 `/rooms/22`로 이동하는 구간

현재 단위 테스트는 `beforeunload`가 먼저 발생한 경우 timer가 취소되는 것만 검증한다. 실제 브라우저에서는 150ms reload가 `page.goto` 시작보다 먼저 실행될 수 있어 navigation race가 발생했다. 따라서 게임 규칙이나 DB 실패가 아니라, 로비 자동 갱신과 방 입장의 실제 브라우저 경합이 드러난 실패다.

분류: `APPLICATION/CLIENT NAVIGATION RACE`에 대한 E2E 재현 실패. 테스트 assertion 자체의 임의 실패로 분류하지 않는다.

## 8. MVP 검증 표

| 번호 | 검증 항목 | 결과 | 증거 |
|---:|---|---|---|
| 1 | 마피아·의사·경찰·시민 역할 배정 | `PASS` | Java `RoomGameServiceTest.assignsExactRoleCountsAtTheSupportedPlayerBoundaries`, 4명 E2E |
| 2 | 개인 역할 비공개 전달 | `PASS` | Java 역할 큐 테스트, 4명 E2E 개인 역할 패널 |
| 3 | 60초 낮 토론 | `PASS` | 4명 E2E 실제 `phaseEndsAt` 간격 |
| 4 | 15초 지목 투표 | `PASS` | 4명 E2E 실제 전환 시간 |
| 5 | 15초 처형 투표 | `PASS` | 4명 E2E 실제 전환 시간 |
| 6 | 30초 밤 | `PASS` | 4명 E2E 실제 전환 시간 |
| 7 | 중복 지목 투표 방지 | `PASS` | Java `acceptsOnlyTheFirstNominationVoteFromEachUser` |
| 8 | 자기 지목 방지 | `PASS` | Java 및 4명 E2E |
| 9 | 사망자 투표 방지 | `PASS` | 4명 E2E에서 사망자 버튼 비활성 확인 |
| 10 | 처형 대상의 처형 투표 방지 | `PASS` | Java 및 4명 E2E |
| 11 | 마피아 공격 | `PASS` | 4명 E2E `MAFIA_KILL`, Java 밤 행동 테스트 |
| 12 | 의사 보호 | `PASS` | 4명 E2E `DOCTOR_PROTECT`, 보호 대상 생존 확인 |
| 13 | 경찰 개인 조사 결과 | `PASS` | 4명 E2E `POLICE_INVESTIGATE` 및 개인 큐 |
| 14 | 역할별 밤 행동 검증 | `PASS` | 4명 E2E 및 Java 역할 검증 |
| 15 | 시민의 밤 행동 차단 | `PASS` | Java `validatesNightActionRoleTargetAndDuplicateSubmission` |
| 16 | 시민 승리 조건 | `PASS` | 4명 E2E 및 Java 마지막 마피아 처형 테스트 |
| 17 | 마피아 승리 조건 | `PASS` | Java `declaresMafiaVictoryImmediatelyWhenMafiaOutnumberTheCitizenFaction` |
| 18 | 투표·밤 처리 직후 서버 승리 판정 | `PASS` | Java 및 4명 E2E |
| 19 | 승리 직후 결과 표시 | `PASS` | 4명 E2E |
| 20 | 승리 진영 표시 | `PASS` | 4명 E2E 및 Java |
| 21 | 결과의 개인 역할 표시 | `PASS` | 4명 E2E |
| 22 | 생존·사망 상태 표시 | `PASS` | 4명 E2E |
| 23 | `PLAYING → WAITING` 전환 | `PASS` | 4명 E2E 및 Java Presence 테스트 |
| 24 | Ready 초기화 | `PASS` | 4명 E2E 및 Java `returnsFinishedRoomToWaitingAndClearsReadyState` |
| 25 | 같은 방 재플레이 | `PASS` | 4명 E2E |
| 26 | 새로고침·재접속 상태 복원 | `PASS` | 4명 E2E |
| 27 | 공개·마피아 채널 분리 | `PASS` | 4명 E2E 마피아 메시지 격리 |
| 28 | 밤 채팅·사망자 채널 전체 제한 | `NOT RUN` | 사망자 채널 격리는 4명 E2E에서 확인했으나, 밤의 생존 비마피아 채팅 차단 전체 흐름은 실행하지 않음 |
| 29 | 마피아·의사·경찰 무행동 | `NOT RUN` | 일부 의사 무행동은 Java에 있으나 세 역할 전체 조합은 실행하지 않음 |
| 30 | 의사 자기 보호·연속 자기 보호 | `NOT RUN` | 해당 E2E/Java 실행 증거 없음 |
| 31 | 사망 시 역할·조사 결과 비공개 | `NOT RUN` | 일반 역할 비공개는 확인했으나 사망 직후 두 조건 전체를 별도 실행하지 않음 |
| 32 | 게임 종료 후 전체 역할 공개 | `PASS` | 4명 E2E `FINISHED` 상태 역할 공개 |
| 33 | 서버 deadline 경쟁 및 중복 요청 idempotency | `NOT RUN` | 중복 요청은 Java/E2E에서 확인했으나 deadline 직전 동시 요청은 결정적으로 실행하지 않음 |

## 9. 확장 경계·복원력 검증

| 번호 | 검증 항목 | 결과 | 증거 |
|---:|---|---|---|
| 1 | 4/5/6/8명 정확한 역할 수 | `PASS` | Java 경계 테스트 4·5·6·8 |
| 2 | 시민 수 공식 및 6명 시민 2명 | `PASS` | Java 경계 테스트의 `playerCount - expectedMafiaCount - 2` assertion |
| 3 | 4명 미만·8명 초과 시작 제한 | `PASS` | `RoomPresenceServiceTest.rejectsStartingGameWithFewerThanFourPlayers`, `...MoreThanEightPlayers` |
| 4 | `aliveMafia > aliveCitizenFaction` 마피아 승리 | `PASS` | Java 서비스 테스트 |
| 5 | `aliveMafia == 0` 시민 승리 우선 | `PASS` | Java 마지막 마피아 처형 테스트 |
| 6 | 6명에서 마피아 1명 처형 후 계속, 둘째 처형 후 시민 승리 | `PASS` | Java 6명 양 마피아 처형 테스트; 브라우저 6명은 NOT RUN |
| 7 | 두 마피아 공격 대상 집계 | `PASS` | Java 서로 다른 대상·동일 대상 테스트 |
| 8 | 지목 동률 시 처형 대상 없음 | `PASS` | Java `skipsExecutionWhenNominationVotesAreTied` |
| 9 | 10초 재접속 유예 및 재접속 취소 | `PASS` | Java Presence reconnect grace 테스트 |
| 10 | 시작 직전 6→5명 변경 | `NOT RUN` | 해당 실제 브라우저 시나리오 없음 |
| 11 | deadline 직전·직후 서버 시간 요청 경쟁 | `NOT RUN` | 결정적 E2E 시나리오 미실행 |
| 12 | 밤 행동 제출 후 grace 기간 내/후 탈주 | `NOT RUN` | 해당 전체 흐름 미실행 |
| 13 | 공개·마피아·사망 채널 전체 격리 | `NOT RUN` | 일부 채널은 4명 E2E에서 확인했으나 전체 조건 미실행 |
| 14 | 4·5·6·8명 동일 방 재플레이 | `NOT RUN` | 4명 재플레이만 완료, 5명 이후 중단 |
| 15 | 60/15/15/30초 실측 | `PASS` | 4명 E2E에서 `phaseEndsAt` 간격 확인; 5/6/8명 반복 측정은 NOT RUN |

## 10. 실패·미실행 항목

### FAIL

- 5명 실제 브라우저 입장 흐름
- 전체 configured E2E run `4,5,6,8`

### NOT RUN

- 6명 실제 브라우저 흐름
- 8명 실제 브라우저 흐름
- 5·6·8명 브라우저 재플레이
- 밤의 생존 비마피아 채팅 차단 전체 흐름
- 세 역할 무행동 전체 조합
- 의사 자기 보호 및 연속 자기 보호
- 사망 직후 역할·조사 결과 비공개 전체 검증
- deadline 직전 동시 요청 및 서버 시간 무효표 검증
- 시작 직전 6→5명 탈주 역할 재계산 브라우저 검증
- grace 기간에 따른 제출 밤 행동 보존·삭제 전체 흐름

## 11. 재현 절차

1. MariaDB를 `localhost:23306`에서 실행한다.
2. 애플리케이션을 8080에서 기동한다.
3. 다음 환경 변수를 설정한다.

```powershell
$env:PLAYER_COUNTS='4,5,6,8'
$env:E2E_RUN_ID='qa-<unique-id>'
$env:BASE_URL='http://127.0.0.1:8080'
```

4. 다음 명령을 실행한다.

```powershell
npm.cmd run test:e2e -- --workers=2 --reporter=list
```

5. 계정들이 `/rooms`에 연결된 상태에서 방이 생성되면, 첫 참가자 페이지에서 방 URL을 얻은 뒤 다음 참가자 페이지가 150ms lobby refresh와 동시에 `/rooms/<id>`로 이동하도록 하면 재현 가능하다.

## 12. 구현 근거 및 관련 파일

- 역할 배정: `src/main/java/kr/or/oti/mafiagame/service/RoomGameRules.java:39`
- 승리 판정: `src/main/java/kr/or/oti/mafiagame/service/RoomGameRules.java:57`
- 승리 판정 호출 및 처형 후 처리: `src/main/java/kr/or/oti/mafiagame/service/RoomGameService.java:593-642`
- 서버 deadline 검사: `src/main/java/kr/or/oti/mafiagame/service/RoomGameService.java:192`, `538`
- 페이즈 시간 계산: `src/main/java/kr/or/oti/mafiagame/service/RoomGameService.java:647-650`
- 공개 상태 역할 비공개 및 종료 시 공개: `src/main/java/kr/or/oti/mafiagame/service/RoomGameService.java:682-714`
- 이탈 시 생존 상태·pending action 제거: `src/main/java/kr/or/oti/mafiagame/service/RoomGameService.java:397-430`
- 재접속 grace: `src/main/java/kr/or/oti/mafiagame/service/RoomPresenceService.java:756-810`
- 시작 인원 검증: `src/main/java/kr/or/oti/mafiagame/service/RoomPresenceService.java:394-423`
- lobby refresh 예약: `src/main/resources/static/js/room-list.js:36-45`
- beforeunload 취소: `src/main/resources/static/js/room-list.js:187-195`
- 실패한 실제 입장 이동: `test/e2e/mafia-mvp.spec.js:465-470`

QA 스크립트의 구현 계약에는 `RoomGameService.createRoles`와 `RoomGameService.determineWinner`가 적혀 있으나, 현재 구조개선 후 실제 구현 위치는 `RoomGameRules.createRoles`와 `RoomGameRules.determineWinner`다. 이는 QA 문서의 경로 설명 불일치이며 이번 실행에서는 소스와 QA 문서를 수정하지 않았다.

## 13. application defect와 test-code defect 구분

- Java/DB/게임 규칙: 이번 실행에서 실패 없음
- E2E 실패: 로비 자동 새로고침과 방 입장 navigation의 실제 브라우저 경합
- 단위 테스트 결함: `beforeunload` 선행 취소만 검증하고 timer firing과 `page.goto`의 동시 경합은 검증하지 않음
- 애플리케이션 측 개선 후보: 방 링크 클릭 또는 navigation 시작 시점에 `navigatingAway`와 pending refresh를 먼저 해제하도록 `room-list.js`의 navigation 경로를 보강
- 테스트 측 보강 후보: 방 입장 전 pending refresh 상태와 실제 URL 이동을 함께 검증하고, room URL navigation을 방 목록 자동 갱신과 경쟁시키는 전용 회귀 케이스 추가

이번 QA에서는 `$sourceModificationAllowed = false`이므로 위 개선을 적용하지 않았다.

## 14. 생성 artifact

- `test-results/bootRun.stdout.log`
- `test-results/bootRun.stderr.log`
- `test-results/.last-run.json`
- `test-results/test-e2e-mafia-mvp-MVP-5인-핵심-게임-흐름-인증부터-한-사이클까지-동기화-검증/error-context.md`
- `build/test-results/test/TEST-*.xml`
- `build/reports/tests/test/index.html`

실패 시 PNG/trace/zip은 생성되지 않았다.

## 15. 데이터 보존 및 테스트 계정 cleanup

- `$deleteExistingData=false`로 기존 데이터 삭제 작업은 수행하지 않았다.
- cleanup selector는 정확한 `E2E_RUN_ID=qa-20260920-112243`였다.
- 매칭 계정: 9개, user ID `104`~`112`
- 매칭 room: 0개
  - E2E 종료 후 빈 방 정리 유예 작업으로 이미 삭제된 상태였다.
- 매칭 room_members: 0개
- 삭제된 user_stats: 9개
- 삭제된 user: 9개
- cleanup 후 잔여 매칭 계정: 0개
- cleanup 결과: `PASS`
- MariaDB, DBeaver, 기존 외부 프로세스: 유지
- QA에서 시작한 애플리케이션 서버: 종료 완료

실제 cleanup 출력:

```text
CLEANUP_MATCH users=9 rooms=0 memberships=0
CLEANUP_DELETED memberships=0 rooms=0 user_stats=9 users=9
CLEANUP_REMAINING=0
CLEANUP_PASS
```

## 16. 최종 판정

`FAIL`

Java/JavaScript 및 4명 실제 브라우저 흐름은 통과했지만, QA 스크립트가 요구한 동일 실행의 5명 시나리오가 navigation race로 실패했고 6명·8명 시나리오는 실행되지 않았다. 따라서 전체 `4,5,6,8` E2E를 `PASS`로 볼 수 없다. 테스트 계정 cleanup과 기존 데이터 보존은 `PASS`다.


---

---

---

## 문서 5: `MAFIAGAME_QA_REPORT_2026-09-20_qa-20260920-1202.md`

# MAFIAGAME QA 실행 보고서

## 1. 실행 환경

- 실행일: 2026-09-20
- 프로젝트: `C:\workspace\mafiaweb`
- Base URL: `http://127.0.0.1:8080`
- MariaDB: `localhost:23306`
- E2E: `true`
- 요청 인원수: `4,5,6,8`
- 요청 Playwright worker: `2`
- 실제 Playwright worker: `1`
- `$sourceModificationAllowed`: `false`
- `$deleteExistingData`: `false`
- `$deleteTestAccounts`: `true`
- E2E 실행 ID: `qa-20260920-1202`
- 설치 작업: 없음

QA 시작 전 `127.0.0.1:23306` LISTEN 상태와 MariaDB JDBC 연결을 확인했다. 기존 애플리케이션 서버는 8080 포트에서 실행 중이지 않아 QA 실행에서만 서버를 시작했다.

실제 확인 출력:

```text
TCP    127.0.0.1:23306        0.0.0.0:0        LISTENING       5844
DB_QUERY_RESULT=1
health_attempt=1 status=200
```

PID 5844는 WSL relay이며 MariaDB 연결은 JDBC `SELECT 1`로 성공했다.

## 2. 사전 확인 파일 및 디렉터리

- `AGENTS.md`
- `docs/MAFIAGAME_MVP.md`
- `docs/QA_scripts/MAFIAGAME_QA_TEST_EXECUTION_SCRIPT.md`
- `package.json`
- `build.gradle`
- `src/main/**`
- `src/test/**`
- `test/js/**`
- `test/e2e/**`

현재 구현의 역할·승리 규칙은 QA 스크립트의 오래된 계약명인 `RoomGameService.createRoles`/`determineWinner`가 아니라 [RoomGameRules.java](C:/workspace/mafiaweb/src/main/java/kr/or/oti/mafiagame/service/RoomGameRules.java:30)에 분리되어 있다. 이 차이는 문서 계약명과 실제 구현 위치의 차이이며, 실행 결과에는 영향을 주지 않았다.

## 3. 실행 명령

```powershell
$env:GRADLE_USER_HOME='C:\workspace\mafiaweb\.gradle-test'
.gradlew.bat test --no-daemon --rerun-tasks

npm.cmd run test:js

$env:PLAYER_COUNTS='4,5,6,8'
$env:E2E_RUN_ID='qa-20260920-1202'
$env:BASE_URL='http://127.0.0.1:8080'
npm.cmd run test:e2e -- --workers=2 --reporter=list
```

QA 서버는 `gradlew.bat bootRun --no-daemon`으로 시작했고, Playwright 종료 후 현재 실행에서 시작한 서버만 정리했다. 테스트 계정 정리는 MariaDB JDBC 드라이버를 사용해 현재 `E2E_RUN_ID`와 일치하는 이메일만 대상으로 수행했다.

## 4. Java 및 Gradle 테스트 결과

Gradle 실행 결과:

```text
> Task :test
BUILD SUCCESSFUL in 20s
6 actionable tasks: 6 executed
```

JUnit XML을 집계한 결과:

| 항목 | 결과 |
|---|---:|
| XML 파일 | 11 |
| Java 테스트 | 79 |
| 실패 | 0 |
| 오류 | 0 |
| 건너뜀 | 0 |
| Gradle 연계 JavaScript 테스트 | 20 PASS |

주요 테스트 근거:

- `RoomGameServiceTest.assignsExactRoleCountsAtTheSupportedPlayerBoundaries`
- `RoomGameServiceTest.endsSixPlayerGameAfterBothMafiaAreExecutedByMajorityVotes`
- `RoomGameServiceTest.endsEightPlayerGameAfterBothMafiaAreExecutedByMajorityVotes`
- `RoomGameServiceTest.declaresMafiaVictoryImmediatelyWhenMafiaOutnumberTheCitizenFaction`
- `RoomGameServiceTest.continuesWhenMafiaAndCitizenFactionAreEven`
- `RoomGameServiceTest.declaresCitizenVictoryImmediatelyAfterTheLastMafiaIsExecuted`
- `RoomGameServiceTest.appliesMafiaKillAndDoctorProtectionDuringNight`
- `RoomGameServiceTest.sendsCitizenInvestigationResultOnlyToTheInvestigatingPolice`
- `RoomGameServiceTest.resolvesDifferentMafiaTargetsToOneOfTheSubmittedTargets`
- `RoomGameServiceTest.resolvesTheSharedTargetWhenBothMafiaSelectTheSamePlayer`
- `RoomGameServiceTest.acceptsOnlyTheFirstNominationVoteFromEachUser`
- `RoomGameServiceTest.acceptsOnlyTheFirstExecutionVoteFromEachUser`
- `RoomGameServiceTest.skipsExecutionWhenNominationVotesAreTied`
- `RoomPresenceServiceTest.rejectsStartingGameWithFewerThanFourPlayers`
- `RoomPresenceServiceTest.rejectsStartingGameWithMoreThanEightPlayers`
- `RoomPresenceServiceTest.cancelsGameDepartureWhenThePlayerReconnectsWithinTheGracePeriod`

관련 소스 및 테스트 위치:

- 역할 수·승리 조건: `src/main/java/kr/or/oti/mafiagame/service/RoomGameRules.java:30-75`
- 처형·밤 행동·승리 재평가: `src/main/java/kr/or/oti/mafiagame/service/RoomGameService.java:438-639`
- 서버 기준 phase deadline 및 phase duration: `src/main/java/kr/or/oti/mafiagame/service/RoomGameService.java:538-675`
- 공개 상태의 역할 비공개/종료 후 공개: `src/main/java/kr/or/oti/mafiagame/service/RoomGameService.java:682-715`
- 재접속 유예 및 탈주 처리: `src/main/java/kr/or/oti/mafiagame/service/RoomPresenceService.java:756-864`

JUnit XML:

- `C:\workspace\mafiaweb\build\test-results\test\TEST-*.xml`

Gradle HTML:

- `C:\workspace\mafiaweb\build\reports\tests\test\index.html`

## 5. standalone JavaScript 테스트 결과

명령:

```text
npm.cmd run test:js
```

실제 출력 요약:

```text
ℹ tests 20
ℹ pass 20
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
```

검증된 범위:

- STOMP 연결·프레임 파싱·재연결
- 로비 인원수 및 참가자 상태 동기화
- Ready 상태 및 게임 phase UI
- 개인 역할과 경찰 조사 결과 렌더링
- 지목·처형·밤 행동 UI
- 게임 결과 및 승리 진영 표시
- 방 입장 중 로비 자동 새로고침 취소

## 6. 서버 시작 및 health check

- 시작 전 8080 listener: 없음
- QA 서버 시작 PID: `30220`
- `GET http://127.0.0.1:8080/login`: HTTP 200, 첫 번째 시도에서 성공
- Playwright 종료 후 8080 listener: 0
- MariaDB listener: 유지

종료 시점에 wrapper PID는 이미 종료되어 `taskkill`이 `process not found`를 반환했지만, 최종적으로 8080 listener와 해당 서버 프로세스가 없음을 확인했다. 기존 MariaDB나 기존 사용자 프로세스는 종료하지 않았다.

## 7. Playwright E2E 결과

명령:

```text
npm.cmd run test:e2e -- --workers=2 --reporter=list
```

실제 Playwright 출력:

```text
Running 4 tests using 1 worker
ok 1 ... MVP 4인 핵심 게임 흐름 ... (3.7m)
ok 2 ... MVP 5인 핵심 게임 흐름 ... (3.7m)
ok 3 ... MVP 6인 핵심 게임 흐름 ... (3.7m)
ok 4 ... MVP 8인 핵심 게임 흐름 ... (3.7m)

Slow test file: test/e2e/mafia-mvp.spec.js (14.7m)
4 passed (14.8m)
```

| 시나리오 | 브라우저 흐름 | 역할·게임 흐름 | 결과 |
|---|---|---|---|
| 4명 | 실제 브라우저 4개, 방 입장·Ready·시작·재플레이 | 마피아 1, 경찰 1, 의사 1, 시민 1 | `PASS` |
| 5명 | 실제 브라우저 5개, 같은 방 재플레이 | 마피아 1, 경찰 1, 의사 1, 시민 2 | `PASS` |
| 6명 | 실제 브라우저 6개, 같은 방 재플레이 | 마피아 2, 경찰 1, 의사 1, 시민 2 | `PASS` |
| 8명 | 실제 브라우저 8개, 같은 방 재플레이 | 마피아 2, 경찰 1, 의사 1, 시민 4 | `PASS` |

E2E에서 확인된 항목:

- 고유 계정·고유 방 생성
- 모든 참가자의 실제 방 URL 도달 및 참가자 수 동기화
- Host만 시작 가능하고 전체 Ready 전에는 시작 불가
- 역할 수와 개인 역할 화면
- 마피아 채널 메시지가 마피아에게만 표시됨
- 60초 낮, 15초 지목, 15초 처형, 30초 밤의 서버 상태 deadline 검증
- 자기 지목·중복 투표·사망자 투표·처형 후보자 투표 제한
- 마피아 제거, 의사 보호, 경찰 조사 실제 제출
- 의사 보호 대상 생존 및 경찰 개인 조사 결과
- 사망자 채팅과 생존자 화면 격리
- 새로고침 후 게임 상태 복원
- 두 마피아 처형 후 시민 승리
- 종료 후 역할·생존 상태 공개
- `PLAYING -> WAITING`, Ready 초기화, 같은 방 재플레이

방 입장 단계는 [mafia-mvp.spec.js](C:/workspace/mafiaweb/test/e2e/mafia-mvp.spec.js:275)의 `joinRoomFromLobby`가 목록의 실제 입장 링크를 클릭하고 생성된 방 URL을 확인한다. 이전 보고서의 로비 자동 새로고침 경합도 이 실행에서 재발하지 않았다.

## 8. 인원수 경계 결과

역할 검증은 E2E의 `assertRoleAssignments`와 Java의 `assignsExactRoleCountsAtTheSupportedPlayerBoundaries`를 함께 근거로 했다.

| 시작 인원 | 기대 역할 | 실행 결과 |
|---:|---|---|
| 4 | 마피아 1, 경찰 1, 의사 1, 시민 1 | `PASS` |
| 5 | 마피아 1, 경찰 1, 의사 1, 시민 2 | `PASS` |
| 6 | 마피아 2, 경찰 1, 의사 1, 시민 2 | `PASS` |
| 8 | 마피아 2, 경찰 1, 의사 1, 시민 4 | `PASS` |

시민 수 공식 `전체 인원 - (마피아 + 경찰 + 의사)`도 위 네 경계값의 exact role count assertion에 포함되어 있으며, 6명은 `6 - (2 + 1 + 1) = 2`로 확인됐다.

## 9. MVP 검증 표

| # | 검증 항목 | 근거 | 상태 |
|---:|---|---|---|
| 1 | 마피아·의사·경찰·시민 역할 배정 | Java + Playwright | `PASS` |
| 2 | 개인 역할 비공개 전달 | Java + Playwright | `PASS` |
| 3 | 60초 낮 타이머 | Playwright 서버 `phaseEndsAt` | `PASS` |
| 4 | 15초 지목 타이머 | Playwright phase deadline | `PASS` |
| 5 | 15초 처형 타이머 | Playwright phase deadline | `PASS` |
| 6 | 30초 밤 타이머 | Playwright phase deadline | `PASS` |
| 7 | 중복 지목 투표 방지 | Java | `PASS` |
| 8 | 자기 지목 방지 | Java + Playwright | `PASS` |
| 9 | 사망자 투표 방지 | Java + Playwright | `PASS` |
| 10 | 처형 후보자 투표 방지 | Java + Playwright | `PASS` |
| 11 | 마피아 제거 | Java + Playwright | `PASS` |
| 12 | 의사 보호 | Java + Playwright | `PASS` |
| 13 | 경찰 개인 조사 결과 | Java + Playwright | `PASS` |
| 14 | 역할별 밤 행동 검증 | Java + Playwright | `PASS` |
| 15 | 시민 밤 행동 방지 | Java role validation | `PASS` |
| 16 | 시민 승리 조건 | Java + Playwright | `PASS` |
| 17 | 마피아 승리 조건 `aliveMafia > aliveCitizenFaction` | Java | `PASS` |
| 18 | 투표·밤 행동 직후 서버 승리 판정 | Java + Playwright | `PASS` |
| 19 | 승리 직후 결과 표시 | Playwright | `PASS` |
| 20 | 승리 진영 표시 | Playwright | `PASS` |
| 21 | 결과의 개인 역할 표시 | Playwright | `PASS` |
| 22 | 생존·사망 상태 표시 | Playwright | `PASS` |
| 23 | `PLAYING -> WAITING` | Playwright | `PASS` |
| 24 | Ready 초기화 | Playwright | `PASS` |
| 25 | 같은 방 재플레이 | Playwright 4·5·6·8 | `PASS` |
| 26 | 새로고침 후 상태 복원 | Playwright | `PASS` |
| 27 | Public/Mafia 채널 분리 | Playwright + source/server validation | `PASS` |
| 28 | 밤 채팅·사망자 채널 전체 제한 | 사망자 격리는 E2E 확인, 생존 비마피아 밤 전송은 별도 미실행 | `NOT RUN` |
| 29 | 마피아·의사·경찰 무행동 | 해당 조합의 전용 실행 없음 | `NOT RUN` |
| 30 | 의사 자기 보호 및 연속 자기 보호 | 해당 전용 실행 없음 | `NOT RUN` |
| 31 | 사망 시 역할·조사 결과 비공개 | 공개 역할 비공개는 확인했으나 사망 경찰 전용 흐름은 미실행 | `NOT RUN` |
| 32 | 게임 종료 후 전체 역할 공개 | Playwright | `PASS` |
| 33 | 서버 deadline 처리 및 중복 요청 idempotency | 중복 요청은 Java 확인, deadline 경합은 미실행 | `NOT RUN` |

`NOT RUN`은 실패를 의미하지 않지만, 해당 항목을 실행 근거로 `PASS` 처리하지 않았다.

## 10. 확장 경계·복원력 검증

| # | 항목 | 근거 | 상태 |
|---:|---|---|---|
| 1 | 4·5·6·8 역할 수 경계 | Java + Playwright | `PASS` |
| 2 | 시민 수 계산 공식 | exact role count | `PASS` |
| 3 | 4명 미만·8명 초과 시작 거부 | `RoomPresenceServiceTest` | `PASS` |
| 4 | 마피아 우세 승리 임계값 | `RoomGameServiceTest` | `PASS` |
| 5 | 마피아 0명 시민 승리 우선 | `RoomGameServiceTest` | `PASS` |
| 6 | 6명에서 마피아 1명 처형 후 계속, 2명째 처형 후 시민 승리 | Java + Playwright | `PASS` |
| 7 | 두 마피아 대상 집계·동일 대상 처리 | Java | `PASS` |
| 8 | 지목 동률 시 처형 대상 없음·밤 전환 | Java | `PASS` |
| 9 | 10초 재접속 유예 및 탈주 승리 재평가 | Java presence/game tests | `PASS` |
| 10 | 시작 직전 6명→5명 전환의 실제 역할 재배정 | 전용 E2E 미실행 | `NOT RUN` |
| 11 | deadline 직전·이후 요청의 서버시간 무효 처리 | 전용 동시성 실행 없음 | `NOT RUN` |
| 12 | 밤 행동 제출 후 유예 내 재접속/유예 만료 제거 | 전용 E2E 없음 | `NOT RUN` |
| 13 | Public/Mafia/Dead 채널의 모든 단계별 격리 | Mafia·Dead 일부는 E2E, 전체 조합 전용 실행 없음 | `NOT RUN` |
| 14 | 4·5·6·8 같은 방 재플레이 | Playwright 전체 실행 | `PASS` |
| 15 | 실제 60/15/15/30초 경과 | 서버 `phaseEndsAt` 차이 assertion | `PASS` |
| 16 | 모든 비호스트 브라우저의 생성 방 URL 도달 | `joinRoomFromLobby` + `toHaveURL` | `PASS` |
| 17 | 로비 자동 새로고침 취소 | JS regression + 브라우저 입장 흐름 | `PASS` |
| 18 | 마피아 수와 시민 진영 수가 같은 경우 계속 진행 | `RoomGameServiceTest.continuesWhenMafiaAndCitizenFactionAreEven` | `PASS` |

## 11. 실패·차단·미실행 항목

실행 중 발생한 테스트 실패와 환경 차단은 없다.

다음은 기능 결함으로 판정하지 않은 `NOT RUN` 범위다.

- 생존 비마피아의 밤 채팅 제출 거부를 별도 브라우저 요청으로 검증하는 흐름
- 마피아·의사·경찰 중 한 명 이상이 행동하지 않는 밤 결과 조합
- 의사의 자기 보호 및 연속 밤 자기 보호
- 사망 경찰의 조사 결과 미전달
- phase deadline 직전/이후 요청의 실제 동시성 경합
- 밤 행동 제출 후 10초 유예 내 재접속과 유예 만료 제거
- 시작 직전 6명에서 5명으로 줄어든 실제 브라우저 흐름

## 12. 재현 절차

이전 보고서의 로비 경합 재현 명령은 다음과 같다.

```powershell
$env:PLAYER_COUNTS='5'
$env:BASE_URL='http://127.0.0.1:8080'
npm.cmd run test:e2e -- --workers=1 --reporter=list
```

이번 수정 후에는 [mafia-mvp.spec.js](C:/workspace/mafiaweb/test/e2e/mafia-mvp.spec.js:275)의 `joinRoomFromLobby`가 로비에서 방 카드가 나타날 때까지 기다린 뒤 실제 `.join` 링크를 클릭한다. 해당 방식으로 5인 보충 E2E와 이번 전체 4·5·6·8인 E2E가 모두 통과했다.

## 13. 원인 및 구현 근거

이전 실패는 방 생성 직후 `room-list.js`가 신규 방을 발견해 `window.location.reload()`를 예약하고, E2E의 직접 `page.goto(roomUrl)`와 네비게이션이 경합한 문제였다. 현재는 로비 내부 링크의 `pointerdown/click`에서 갱신 타이머와 재연결을 먼저 취소하며, E2E도 실제 입장 링크를 클릭한다.

관련 구현:

- 로비 갱신 취소와 단일 DISCONNECT: `src/main/resources/static/js/room-list.js:49-82`
- 내부 링크 이동 감지: `src/main/resources/static/js/room-list.js:82-105`
- beforeunload 재사용: `src/main/resources/static/js/room-list.js:221-239`
- 로비 경합 회귀 테스트: `test/js/room-list.test.js:200-244`
- 실제 방 입장 E2E: `test/e2e/mafia-mvp.spec.js:275-285`, `474-480`

## 14. 애플리케이션 결함과 테스트 코드 결함 구분

- 이전 애플리케이션/클라이언트 결함: 로비 자동 새로고침이 사용자 이동 의도보다 먼저 실행될 수 있었음.
- 이전 테스트 코드 문제: 실제 사용자 입장 링크 대신 `page.goto(roomUrl)`로 직접 이동해 로비 타이머 경합을 재현했음.
- 현재 상태: 두 부분을 모두 보완했고 5인 보충 E2E 및 전체 4·5·6·8인 E2E에서 재발하지 않음.
- 현재 발견된 `NOT RUN` 항목은 실행 누락이며, 이번 실행에서 애플리케이션 실패로 판정하지 않음.

## 15. 변경 필요 파일 및 권고

이번 QA 실행에서는 소스 코드를 수정하지 않았다. 이전 디버깅에서 적용된 로비 이동 경합 수정은 유지되며, 이번 실행으로 회귀가 없음을 확인했다.

확장 QA를 완료하려면 다음 전용 테스트를 추가 실행해야 한다.

1. deadline 직전/이후 요청을 서버 `phaseEndsAt` 기준으로 검증하는 시간 경합 테스트
2. 0개 행동, 의사 자기 보호, 연속 자기 보호를 각각 검증하는 서비스/E2E 테스트
3. 10초 유예 내 재접속과 유예 만료 후 밤 행동 제거를 검증하는 브라우저 테스트
4. 시작 직전 6명→5명 이탈 및 5명 역할 재계산을 검증하는 멀티 브라우저 테스트
5. 생존 비마피아의 밤 채팅 거부와 사망 경찰 조사 결과 미전달을 검증하는 보안 테스트

## 16. 생성된 결과물

- JUnit XML: `C:\workspace\mafiaweb\build\test-results\test\TEST-*.xml`
- Gradle HTML: `C:\workspace\mafiaweb\build\reports\tests\test\index.html`
- Playwright 최종 상태: `C:\workspace\mafiaweb\test-results\.last-run.json`
- QA 서버 stdout: `C:\workspace\mafiaweb\test-results\qa-20260920-1202-bootRun.stdout.log`
- QA 서버 stderr: `C:\workspace\mafiaweb\test-results\qa-20260920-1202-bootRun.stderr.log`
- 실패 artifact: 없음 (`error-context.md`, screenshot, trace, zip 미생성)

Playwright 최종 상태 파일:

```json
{"status":"passed","failedTests":[]}
```

## 17. 기존 데이터 보존 및 테스트 계정 정리

- `$deleteExistingData=false`로 기존 사용자·방·기록 삭제 작업은 수행하지 않았다.
- 현재 실행 ID `qa-20260920-1202`와 정확히 일치하는 계정 23개를 먼저 조회했다.
- 조회된 이메일은 모두 `playwright.qa-20260920-1202...@example.com` 형식이었다.
- 테스트 방은 E2E 종료 후 애플리케이션의 빈 방 정리로 0개였다.
- `room_members` 삭제: 0
- `game_room` 삭제: 0
- `user_stats` 삭제: 23
- `user` 삭제: 23
- 잔여 테스트 계정: 0

실제 cleanup 출력:

```text
CLEANUP_MATCH users=23
CLEANUP_DELETED memberships=0 rooms=0 user_stats=23 users=23
CLEANUP_REMAINING=0
CLEANUP_PASS
```

MariaDB는 계속 실행 중이며, QA 애플리케이션 서버만 종료했다.

## 18. 최종 판정

`FAIL`

핵심 자동화 QA 결과는 Java 79건, JavaScript 20건, Playwright 4·5·6·8인 4건 모두 `PASS`다. 다만 QA 스크립트의 확장 검증 범위에 포함된 deadline 경합, 무행동 조합, 의사 자기 보호, 유예 중 밤 행동 보존/삭제, 시작 직전 이탈 등은 이번 실행에서 `NOT RUN`으로 남아 전체 QA 요구사항을 완전히 검증했다고 볼 수 없다. 따라서 실행된 자동화 제품 흐름은 `PASS`이나, 스크립트 전체 범위의 최종 판정은 `FAIL`로 기록한다.


---

---

---

## 문서 6: `MAFIAGAME_QA_REPORT_2026-09-20_qa-20260920-1302.md`

# MAFIAGAME QA 실행 보고서

- 실행일: 2026-09-20
- 실행 ID: `qa-20260920-1302`
- 프로젝트: `C:\workspace\mafiaweb`
- QA 스크립트: `docs/QA_scripts/MAFIAGAME_QA_TEST_EXECUTION_SCRIPT.md`
- 요청 인원수: `4,5,6,8`
- Playwright 요청 worker: `2`
- Playwright 실제 worker: `1` (`serial` describe 적용)
- 소스 수정: 없음
- 테스트 프로그램 설치: 없음

## 실행 결과

| 구분 | 결과 | 근거 |
|---|---|---|
| MariaDB 연결 | PASS | `127.0.0.1:23306` 연결 성공 |
| 서버 health check | PASS | `GET /login` HTTP 200 |
| Java/통합 테스트 | PASS | 87 tests, failures 0, errors 0, skipped 0 |
| standalone JavaScript | PASS | 20 passed, 0 failed |
| Playwright 4인 | PASS | 1 passed, 약 3.7분 |
| Playwright 5인 | PASS | 1 passed, 약 3.7분 |
| Playwright 6인 | PASS | 1 passed, 약 3.7분 |
| Playwright 8인 | PASS | 1 passed, 약 3.7분 |

Playwright 최종 출력:

```text
Running 4 tests using 1 worker
ok 1 ... MVP 4인 ... (3.7m)
ok 2 ... MVP 5인 ... (3.7m)
ok 3 ... MVP 6인 ... (3.7m)
ok 4 ... MVP 8인 ... (3.7m)
4 passed (14.8m)
```

## 검증된 범위

- 4·5·6·8명 실제 브라우저 입장 및 같은 방 재플레이
- 역할 수와 5→6명 마피아 수 경계값
- 시민 수 계산 및 역할별 개인 표시
- Ready 동기화, 호스트 시작 권한, 방 상태 복원
- 낮·지목·처형·밤 페이즈 전환과 타이머 동기화
- 두 마피아 처형 및 시민 승리
- 마피아 공격·의사 보호·경찰 조사 제출
- 경찰 조사 결과의 개인 표시 및 다른 사용자 비공개
- 새로고침 후 게임 상태 복원
- 사망자 채팅 격리와 마피아 채널 격리
- 처형 동률/무투표, 중복 투표, 자기 지목 제한
- 게임 종료 후 역할·승리 진영 공개 및 WAITING 복귀

Gradle 회귀 테스트에는 다음 서버 규칙도 포함되어 있다.

- 서버 `phaseEndsAt` 이후 요청 거부
- 마피아 무행동 및 의사 자기 보호·연속 자기 보호
- 경찰이 같은 밤 사망한 경우 조사 결과 미전달
- 사망자 채팅 라우팅
- 재접속 유예 후 이탈 시 제출한 밤 행동 제거
- 시작 직전 6명→5명 참가자 수 반영

## 테스트 계정 정리

- 정확한 selector: `playwright.qa-20260920-1302.%@example.com`
- 발견 계정: 23
- 삭제 계정: 23
- 삭제된 `user_stats`: 23
- 삭제된 `room_members`: 0
- 삭제된 `game_room`: 0
- 정리 후 잔여 계정: 0
- cleanup 결과: `PASS`

기존 데이터는 삭제하지 않았다.

## 서버 상태

QA 실행 중 `/login` health check는 HTTP 200이었다. 포트 8080에서 실행 중이던 기존 Java 서버는 QA 스크립트 규칙에 따라 종료하지 않았다. 최종 확인 시 8080 listener는 없었고 MariaDB `23306`은 계속 실행 중이었다.

## 미실행 범위

이번 전체 실행에서 직접 수행하지 않은 확장 검증은 `NOT RUN`으로 유지한다.

- 타이머 마감 직전 동시 요청의 실제 브라우저 경합
- 실제 브라우저 탭 종료와 10초 재접속 유예 전후의 밤 행동 보존·삭제
- 시작 직전 6명→5명 이탈의 실제 브라우저 흐름
- 모든 채팅 권한 조합의 실제 브라우저 전송 시나리오

따라서 구성된 핵심 QA 실행 결과는 `PASS`이며, 위 확장 항목까지 포함한 전체 요구사항 판정은 `NOT RUN` 범위를 포함한다.

## 산출물

- JUnit XML: `build/test-results/test/`
- Gradle HTML: `build/reports/tests/test/index.html`
- Playwright 결과 상태: `test-results/.last-run.json`
- 서버 로그: `test-results/bootRun.stdout.log`, `test-results/bootRun.stderr.log`


---

---

---

## 문서 7: `MAFIAGAME_QA_REPORT_2026-09-20_qa-20260920-1401-full.md`

# MAFIAGAME QA 실행 보고서

- 실행 ID: `qa-20260920-1401-full`
- 실행일: 2026-09-20
- 프로젝트: `C:\workspace\mafiaweb`
- 실행 범위: Java, JavaScript, Playwright 4·5·6·8인 및 6인 확장 시나리오
- 최종 판정: `FAIL`

## 1. 환경 및 사전 점검

- MariaDB `127.0.0.1:23306`: `PASS`
- 기존 서버 `127.0.0.1:8080`: 실행 중 확인, 종료하지 않음
- QA용 현재 소스 서버 `127.0.0.1:8081`: 기동 및 `/login` HTTP 200 확인 후 종료
- Node.js: `v24.19.0`
- npm: `11.17.0`
- jsdom, Playwright 의존성: 존재 확인
- Playwright discovery: `6 tests in 1 file`
- Playwright worker: 요청 1, 실제 1

Playwright는 샌드박스 기본 실행에서 `spawn EPERM`이 발생해 제한 해제 환경에서 재실행했습니다. 이는 테스트 실패가 아니라 실행 환경의 자식 프로세스 생성 제한입니다.

## 2. 실행 결과

### Java

실행 명령:

```powershell
$env:GRADLE_USER_HOME='C:\workspace\mafiaweb\.gradle-test'
.\gradlew.bat test --no-daemon --rerun-tasks -x jsTest
```

- 결과: `BUILD SUCCESSFUL`
- 테스트: 91
- 통과: 91
- 실패: 0
- 오류: 0
- JUnit XML: `build/test-results/test/`
- Gradle HTML: `build/reports/tests/test/index.html`

### JavaScript

실행 명령:

```powershell
node --test --test-isolation=none test/js/stomp-client.test.js test/js/room-list.test.js test/js/chat.test.js
```

- 테스트: 20
- 통과: 20
- 실패: 0
- 취소/보류: 0

STOMP, 로비·참가자 동기화, 준비 상태, 페이즈 UI, 역할·투표 UI, 경찰 결과, 게임 결과, 재접속 테스트가 모두 통과했습니다.

## 3. Playwright 결과

### 전체 실행

전체 명령은 6개를 직렬 실행했습니다. 첫 4인 테스트가 실패해 Playwright serial 모드가 나머지를 건너뛰었으므로, 실패 원인을 확인한 뒤 미실행 케이스만 개별 실행했습니다. 실패한 4인 테스트는 재시도하지 않았습니다.

| 시나리오 | 결과 | 근거 |
|---|---|---|
| 4인 핵심 흐름 | `FAIL` | `test/e2e/mafia-mvp.spec.js:739` 토스트 기대 불일치 |
| 5인 핵심 흐름 | `FAIL` | 동일한 토스트 기대 불일치 |
| 6인 핵심 흐름 | `FAIL` | 동일한 토스트 기대 불일치 |
| 8인 핵심 흐름 | `FAIL` | 동일한 토스트 기대 불일치 |
| 6→5명 시작 직전 이탈 | `PASS` | 1 test passed, 1.4분 |
| 마감·재접속·유예 만료 | `PASS` | 1 test passed, 3.2분 |

실패 메시지:

```text
Expected substring: "마피아 채팅"
Received string: "밤에는 마피아 채널만 사용할 수 있습니다."
```

실패 지점은 의사가 마피아 채널에 잘못된 메시지를 보낸 뒤 두 번째 오류 토스트를 기다리는 단계입니다. 네 인원수에서 같은 위치와 문구로 재현됐습니다. 서버 권한 검증 계약은 `RoomGameService.java:258`의 마피아 채널 역할 검증과 `RoomGameService.java:261`의 밤 공개 채널 검증에 있습니다. 현재 증거상 게임 진행·역할·타이머 단계보다 E2E의 비동기 토스트 대기 또는 오류 문구 기대가 먼저 실패한 것으로 분류합니다.

마지막 Playwright 결과 파일인 `test-results/.last-run.json`은 마지막으로 실행한 확장 테스트의 `passed` 상태만 기록하므로, 전체 결과 집계에는 사용하지 않았습니다.

## 4. 핵심 검증 판정

| 항목 | 판정 | 근거 |
|---|---|---|
| 4·5·6·8인 역할 경계 | `PASS` | Java 91건 통과 및 각 E2E가 역할·게임 진행 단계까지 도달 |
| 6인 마피아 2명 흐름 | `NOT RUN` | 기본 E2E가 채팅 검증 단계에서 중단됨 |
| 8인 실제 브라우저 흐름 | `NOT RUN` | 동일한 채팅 검증 단계에서 중단됨 |
| 6→5명 시작 직전 이탈 | `PASS` | Playwright 확장 시나리오 통과 |
| 마감 직전 요청 | `PASS` | 확장 시나리오에서 멈춤 없이 다음 단계 진행 |
| 서버 마감시각 이후 요청·중복 요청 | `PASS` | Java 서비스 테스트 근거 |
| 10초 이내 재접속 | `PASS` | Playwright 확장 시나리오 통과 |
| 10초 유예 만료 후 행동 제거 | `PASS` | Playwright 확장 시나리오 통과 |
| 역할별 밤 행동·보호·조사·승리 | `PASS` | Java 서비스 테스트 근거 |
| 실제 브라우저 채팅 전체 조합 | `NOT RUN` | 기본 E2E가 채팅 권한 토스트 단계에서 중단 |
| 테스트 계정 삭제 | `PASS` | 두 실행 ID 모두 잔여 계정 0 |

## 5. 계정 및 서버 정리

- 1차 실패 실행 ID `qa-20260920-1356-full`: 계정 4개 삭제, 잔여 0개
- 본 실행 ID `qa-20260920-1401-full`: 계정 35개 삭제, 잔여 0개
- 삭제 범위: 해당 실행 ID의 `user`, `user_stats`, `room_members`, 테스트 방
- 기존 서버 `8080`: 유지
- QA 서버 `8081`: 종료
- 기존 사용자·기존 서버는 삭제·종료하지 않음

## 6. 후속 조치

`test/e2e/mafia-mvp.spec.js:739`의 토스트 검증을 수정해야 합니다. 오류 토스트가 연속 요청에서 갱신되는 시점과 실제 서버 오류 문구를 안정적으로 기다리도록 테스트를 보완한 뒤, 4·5·6·8인 기본 흐름을 다시 실행해야 합니다. 현재 결과는 Java·JavaScript와 두 확장 브라우저 시나리오는 통과했지만, 기본 브라우저 흐름 4건이 실패했으므로 전체 QA는 `FAIL`입니다.


---

---

---

## 문서 8: `MAFIAGAME_QA_REPORT_2026-09-20_qa-20260920-1440-full.md`

# MAFIAGAME QA 실행 보고서

- 실행 ID: `qa-20260920-1440-full`
- 실행일: 2026-09-20
- 실행 범위: Java, JavaScript, Playwright 전체 QA 시나리오
- Playwright 인원수: `4,5,6,8`
- QA 서버: `http://127.0.0.1:8081` (현재 소스로 신규 기동 후 종료)
- 최종 결과: `PASS`

## 1. 사전 조건

- MariaDB `127.0.0.1:23306`: `PASS`
- QA 서버 `/login` 응답: `PASS`
- Node.js: `v24.19.0`
- npm: `11.17.0`
- Playwright discovery: `6 tests in 1 file`
- Playwright worker: `1`

## 2. 자동화 테스트 결과

### Java

```powershell
$env:GRADLE_USER_HOME='C:\workspace\mafiaweb\.gradle-test'
.\gradlew.bat test --no-daemon --rerun-tasks -x jsTest
```

- 결과: `BUILD SUCCESSFUL`
- 테스트: `93`
- 성공: `93`
- 실패: `0`
- 오류: `0`

### JavaScript

```powershell
node --test --test-isolation=none test/js/stomp-client.test.js test/js/room-list.test.js test/js/chat.test.js
```

- 테스트: `20`
- 성공: `20`
- 실패: `0`
- 취소/보류: `0`

### Playwright

실행 명령:

```powershell
$env:BASE_URL='http://127.0.0.1:8081'
$env:PLAYER_COUNTS='4,5,6,8'
$env:E2E_RUN_ID='qa-20260920-1440-full'
npm.cmd run test:e2e -- --workers=1 --retries=0 --reporter=list
```

| 시나리오 | 결과 | 실행 시간 |
|---|---:|---:|
| MVP 4인 핵심 게임 흐름 | `PASS` | 3.7분 |
| MVP 5인 핵심 게임 흐름 | `PASS` | 3.6분 |
| MVP 6인 핵심 게임 흐름 | `PASS` | 3.7분 |
| MVP 8인 핵심 게임 흐름 | `PASS` | 3.7분 |
| 대기방 6→5명 탭 이탈 및 역할 임계값 | `PASS` | 12.1초 |
| 브라우저 마감·재접속 유예·만료 밤 행동 | `PASS` | 2.0분 |

- 전체 결과: `6 passed (18.2m)`
- 4·5·6·8인 실제 브라우저 흐름: `PASS`
- 6인 경계값 마피아 2명 흐름: `PASS`
- 8인 실제 브라우저 흐름: `PASS`
- 재접속/마감 직전 및 만료 행동: `PASS`

## 3. 사후 정리

- 실행 ID로 생성된 테스트 계정: `35개`
- 삭제된 테스트 계정: `35개`
- 관련 `user_stats`: `35개`
- 정리 후 해당 실행 ID 계정 잔여: `0개`
- QA 서버 8081: 종료 및 포트 해제 확인
- 기존 서버가 있었다면 대상 외 서버는 종료하지 않음

## 4. 결과 판정

Java 93건, JavaScript 20건, Playwright 6개 시나리오가 모두 성공했습니다. QA 스크립트 기준 이번 실행에서 `FAIL` 또는 `NOT RUN` 항목은 없습니다.



---

---

---

## 문서 9: `MAFIAGAME_QA_REPORT_2026-09-20_qa-20260920-165300.md`

# MAFIAGAME QA 실행 보고서

## 1. 실행 환경

- 실행 일시: 2026-09-20 (Asia/Seoul)
- 프로젝트: `C:\workspace\mafiaweb`
- 실행 ID: `qa-20260920-165300`
- QA 설정: `PLAYER_COUNTS=4,5,6,8`, 요청 워커 1, 실제 워커 1, E2E 활성화
- 최종 QA 서버: `http://127.0.0.1:8083`
- MariaDB: `127.0.0.1:23306/mafiaweb`
- OS: Windows 11 amd64
- Java: 22.0.1
- Gradle: 8.14.5 (`.gradle-test` 사용)
- Node.js: v24.19.0
- npm: 11.17.0
- 소스 수정 허용: `false`
- 기존 데이터 삭제: `false`
- 테스트 계정 삭제: `true`

8081 포트가 QA 준비 중 사용 중인 상태가 되어, 기존 서버를 종료하거나 재사용하지 않고 사용 가능한 8083 포트에서 새 QA 서버를 시작했다.

## 2. MariaDB 사전 확인 및 의존성

사전 확인 결과:

```text
MariaDB 127.0.0.1:23306 = reachable
node = C:\Program Files\nodejs\node.exe (v24.19.0)
npm.cmd = C:\Program Files\nodejs\npm.cmd (11.17.0)
node_modules\jsdom = present
node_modules\@playwright\test = present
```

DB가 실행 중이었고 필요한 Node 의존성도 존재했으므로 설치 없이 진행했다. MariaDB 서비스를 새로 시작하거나 기존 데이터를 삭제하지 않았다.

## 3. 확인한 파일 및 디렉터리

- `AGENTS.md`
- `docs/MAFIAGAME_MVP.md`
- `docs/QA_scripts/MAFIAGAME_QA_TEST_EXECUTION_SCRIPT.md`
- `package.json`, `build.gradle`
- `src/main/**`
- `src/test/**`
- `test/js/**`
- `test/e2e/**`
- `src/main/resources/application.properties`

핵심 계약은 `RoomGameRules.java:30-75`, `GamePhase.java:4-9`, `RoomGameService.java:168-236,252-296,439-480,631-764`, `RoomPresenceService.java:45-97,373-443,740-780`, `chat.js:483-621,892-914`에서 확인했다.

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

Playwright 테스트 검색:

```powershell
$env:E2E_RUN_ID='qa-20260920-165300'
$env:PLAYER_COUNTS='4,5,6,8'
$env:BASE_URL='http://127.0.0.1:8083'
npm.cmd run test:e2e -- --list --workers=1
```

Playwright 전체 실행:

```powershell
npm.cmd run test:e2e -- --workers=1 --retries=0 --reporter=list
```

테스트 서버는 `SERVER_PORT=8083`과 현재 workspace의 `bootRun`으로 새로 시작했다. `/login` health check는 HTTP 200을 반환했다.

## 5. Java 테스트 결과

```text
BUILD SUCCESSFUL in 20s
JUnit XML suite: 11
Tests: 103
Failures: 0
Errors: 0
Skipped: 0
```

주요 결과:

- `RoomGameServiceTest`: 45개 통과
- `RoomPresenceServiceTest`: 23개 통과
- `WebSocketAuthorizationInterceptorTest`: 7개 통과
- `ControllerDelegationTest`: 4개 통과
- `RoomControllerTest`: 4개 통과
- `MapperIntegrationTest`: 2개 통과
- 애플리케이션·채팅·방·회원 서비스 테스트 전체 통과

역할 수 경계, `ROLE_CONFIRM` 중복 방지와 10초 timeout, `FINAL_DEFENSE` 권한과 15초 deadline, 투표 동률/무투표, server deadline, 승리 조건, 탈주, 밤 행동은 다음 테스트로 확인되었다.

- `assignsExactRoleCountsAtTheSupportedPlayerBoundaries`
- `confirmsRolesPrivatelyAndStartsDayWhenEveryLivingPlayerConfirms`
- `startsDayWhenTheRoleConfirmationTimerExpires`
- `usesTheMvpServerDurationsForEveryTimedPhase`
- `givesTheNomineeASeparateDefensePhaseBeforeExecutionVoting`
- `skipsExecutionWhenNominationVotesAreTied`
- `skipsExecutionWhenNoNominationVotesAreSubmitted`
- `countsOnlyOneOfTwoConcurrentVotesFromTheSamePlayer`
- `rejectsConcurrentRequestsAfterTheServerDeadline`
- `declaresCitizenVictoryImmediatelyAfterTheLastMafiaIsExecuted`
- `declaresMafiaVictoryImmediatelyWhenMafiaOutnumberTheCitizenFaction`
- `continuesWhenMafiaAndCitizenFactionAreEven`
- `appliesMafiaKillAndDoctorProtectionDuringNight`
- `leavesEveryoneAliveWhenNoMafiaSubmitsANightAction`
- `allowsDoctorToProtectThemselfOnConsecutiveNights`
- `rejectsDeadAndDepartedNightActionTargets`
- `resolvesDifferentMafiaTargetsToOneOfTheSubmittedTargets`
- `resolvesConcurrentNightActionsFromBothMafiaWithoutDroppingAnAction`
- `endsSixPlayerGameAfterBothMafiaAreExecutedByMajorityVotes`
- `endsEightPlayerGameAfterBothMafiaAreExecutedByMajorityVotes`

## 6. JavaScript 테스트 결과

```text
23 tests
23 passed
0 failed
```

확인 범위는 STOMP 프레임, 방/참가자·준비 상태 동기화, phase UI, `ROLE_ASSIGNMENT` 역할 확인 요청, `FINAL_DEFENSE` 후보자 채팅 권한, 개인 역할·투표·경찰 조사 결과·게임 결과 표시, 재접속 상태 처리다.

관련 테스트 파일은 `test/js/stomp-client.test.js`, `test/js/room-list.test.js`, `test/js/chat.test.js:153-287,337-446,549-747`이다.

## 7. 서버 시작 및 health check

- MariaDB 사전 확인: `PASS`
- 현재 workspace 기반 QA 서버 시작: `PASS`
- `GET http://127.0.0.1:8083/login`: HTTP 200, `PASS`
- 애플리케이션 stderr: 0 byte
- 실행 완료 후 8083 listener: 없음, 서버 정리 `PASS`

처음 sandbox 안에서 Playwright worker fork가 `spawn EPERM`으로 시작되지 않는 환경 제약이 확인되었다. 원인을 `child_process.fork()` 수준에서 확인한 뒤 동일한 QA 명령을 허용된 실행 환경에서 1회 수행했고, 그 최종 실행에서는 브라우저 케이스가 모두 실행되었다. 케이스 실패 후의 자동 재시도는 하지 않았다.

## 8. Playwright 검색 및 전체 E2E 결과

검색 결과:

```text
Total: 6 tests in 1 file
```

실제 실행 결과:

```text
6 passed (20.1m)
Slow test file: test/e2e/mafia-mvp.spec.js (18.9m)
Exit code: 0
```

요청 워커 수와 실제 워커 수 모두 `1`이다. retries는 `0`이다. 검색된 6개 시나리오가 모두 실행되었고 skipped 테스트는 없다.

## 9. 시나리오별 결과

| 시나리오 | 결과 | 실행 증거 |
|---|---|---|
| 4인 핵심 게임 흐름 | `PASS` | 역할 확인, 비공개 역할, 최종 변론, 처형, 밤 행동, 시민 승리, 결과 공개, 같은 방 재플레이 |
| 5인 핵심 게임 흐름 | `PASS` | 1마피아 경계값 역할 수와 전체 게임 흐름 |
| 6인 핵심 게임 흐름 | `PASS` | 2마피아 경계값, 두 마피아 처형, 의사 보호, 경찰 조사, 채널 격리, 시민 승리, 재플레이 |
| 8인 핵심 게임 흐름 | `PASS` | 최대 인원 실제 브라우저 흐름과 재플레이 |
| 대기방 6→5명 이탈 | `PASS` | 탭 종료 후 참가자 5명 반영, 5인 역할 배정 |
| browser deadline/reconnect/expired night action | `PASS` | 마감 직전 요청, 10초 이내 재접속 상태 복원, 유예 만료 후 탈주·행동 제거 |

정상 흐름은 `test/e2e/mafia-mvp.spec.js:519-998`, 6→5명 이탈은 `:1002-1039`, deadline/reconnect는 `:1042-1157`에 구현되어 있다.

## 10. MVP 검증 결과

| # | 검증 항목 | 근거 | 결과 |
|---:|---|---|---|
| 1 | 마피아·의사·경찰·시민 역할 배정 | Java `assignsExactRoleCountsAtTheSupportedPlayerBoundaries`, E2E 4/5/6/8 | `PASS` |
| 2 | 개인 역할 비공개 표시 | E2E `ROLE_ASSIGNMENT` public state role null, 개인 role panel | `PASS` |
| 3 | 60초 낮 토론 timer | E2E `mafia-mvp.spec.js:668-674` server `phaseEndsAt` | `PASS` |
| 4 | 15초 지목 투표 timer | E2E `:704-714` | `PASS` |
| 5 | 15초 최종 변론 timer | E2E `:732-740`, Java defense test | `PASS` |
| 6 | 15초 처형 투표 timer | E2E `:760-771` | `PASS` |
| 7 | 30초 밤 timer | E2E `:783-793` | `PASS` |
| 8 | 지목 투표 중복 방지 | Java `acceptsOnlyTheFirstNominationVoteFromEachUser` | `PASS` |
| 9 | 자기 지목 방지 | Java `rejectsSelfNominationAndUnknownPlayers` | `PASS` |
| 10 | 사망자 투표 방지 | Java `rejectsNominationVoteFromADeadPlayer` | `PASS` |
| 11 | 처형 후보자 투표 방지 | Java `rejectsExecutionVoteFromTheNominatedPlayer` | `PASS` |
| 12 | 마피아 공격 | Java `appliesMafiaKillWhenNoDoctorProtectionIsSubmitted`, E2E 밤 행동 | `PASS` |
| 13 | 의사 보호 | Java protection test, E2E 보호 대상 생존 확인 | `PASS` |
| 14 | 경찰 비공개 조사 결과 | Java police tests, E2E 경찰 화면에만 결과 표시 | `PASS` |
| 15 | 역할별 밤 행동 검증 | Java `validatesNightActionRoleTargetAndDuplicateSubmission` | `PASS` |
| 16 | 시민 밤 행동 방지 | Java role validation, E2E 권한 거부 | `PASS` |
| 17 | 시민 승리 조건 | 마지막 마피아 처형 후 E2E/Java `FINISHED` | `PASS` |
| 18 | 마피아 승리 조건 | Java `aliveMafia > aliveCitizenFaction` | `PASS` |
| 19 | 투표·밤 행동 직후 server 승리 판정 | Java winner tests와 `RoomGameService` resolution | `PASS` |
| 20 | 승리 직후 결과 표시 | E2E `gameResultPanel`, `gameWinnerLabel` | `PASS` |
| 21 | 승리 진영 표시 | E2E 시민 진영 표시 | `PASS` |
| 22 | 결과 화면 개인 역할 표시 | E2E `gameResultRoleLabel` | `PASS` |
| 23 | 생존/사망 상태 표시 | E2E `gameResultAliveLabel`, state player alive | `PASS` |
| 24 | `PLAYING → WAITING` 전환 | E2E 결과 후 `roomStatus` 대기 상태 | `PASS` |
| 25 | Ready 상태 초기화 | E2E 결과 후 ready 재활성화와 Java reset 검증 | `PASS` |
| 26 | 같은 방 재플레이 | E2E `startReplayGame`, 4/5/6/8 | `PASS` |
| 27 | refresh/reconnect 상태 복원 | E2E `pages[1].reload()` 후 phase 복원 | `PASS` |
| 28 | public/mafia 채널 분리 | E2E 생존 마피아 수신 및 시민 미수신 | `PASS` |
| 29 | 밤 채팅·사망 채널 격리 | E2E `:833-862`, dead message living 미수신 | `PASS` |
| 30 | 마피아·의사·경찰 무행동 | Java no-mafia/no-doctor 및 police 결과 테스트 | `PASS` |
| 31 | 의사 자기 보호·연속 자기 보호 | Java `allowsDoctorToProtectThemselfOnConsecutiveNights` | `PASS` |
| 32 | 사망 시 역할·조사 결과 비공개 | E2E public state role null, Java police death test | `PASS` |
| 33 | 종료 후 전체 역할 공개 | E2E `FINISHED` state roles 문자열 및 reveal panel | `PASS` |
| 34 | server deadline 및 중복 요청 idempotency | Java `rejectsConcurrentRequestsAfterTheServerDeadline`, duplicate tests | `PASS` |

## 10.1 확장 경계·복원력 검증

| # | 검증 항목 | 근거 | 결과 |
|---:|---|---|---|
| 1 | 4/5/6/8인 정확한 역할 수 | Java 경계 역할 테스트, E2E role labels | `PASS` |
| 2 | 시민 수 공식 및 6인 시민 2명 | `playerCount - mafia - 2` assertion | `PASS` |
| 3 | 4명 미만·8명 초과 시작 거부 | `RoomPresenceServiceTest`의 `rejectsStartingGameWithFewerThanFourPlayers`, `...MoreThanEightPlayers` | `PASS` |
| 4 | 마피아 생존자가 시민 진영보다 많을 때 승리 | `declaresMafiaVictoryImmediatelyWhenMafiaOutnumberTheCitizenFaction` | `PASS` |
| 5 | 동수는 계속, 마피아 0명은 시민 승리 우선 | `continuesWhenMafiaAndCitizenFactionAreEven`, citizen precedence tests | `PASS` |
| 6 | 6인에서 한 마피아 처형 후 계속, 두 번째 처형 후 시민 승리 | Java 6인 helper 및 E2E 6인 | `PASS` |
| 7 | 두 마피아의 서로 다른/동일 대상 집계 | Java `resolvesDifferentMafiaTargetsToOneOfTheSubmittedTargets`, `resolvesTheSharedTargetWhenBothMafiaSelectTheSamePlayer` | `PASS` |
| 8 | 지목 동률은 처형 후보 없이 밤으로 이동 | Java `skipsExecutionWhenNominationVotesAreTied` | `PASS` |
| 9 | 탈주 유예 후 alive 반영 및 승리 재평가 | Java presence/game tests, E2E grace expiry | `PASS` |
| 10 | 시작 직전 6→5명 역할 재계산 | E2E `closing a waiting-room tab...` | `PASS` |
| 11 | server `phaseEndsAt` 기준 마감 요청 처리 | Java deadline tests, E2E near-deadline request | `PASS` |
| 12 | 재접속 유예 중 행동 유지·만료 후 행동 제거 | E2E `browser deadline, reconnect grace, and expired night action` | `PASS` |
| 13 | public/mafia/dead 채널 서버 격리 | E2E 채널 차단 및 수신 대상 assertion | `PASS` |
| 14 | 4/5/6/8인 같은 방 재플레이 | 각 정상 E2E의 `startReplayGame` | `PASS` |
| 15 | 10/60/15/15/15/30초 server phase deadline | Java `usesTheMvpServerDurationsForEveryTimedPhase`, E2E 60/15/15/15/30 측정 | `PASS` |

`ROLE_ASSIGNMENT`는 모든 생존자의 확인이 끝나면 10초보다 일찍 `DAY_DISCUSSION`으로 전환되는 정상 동작도 확인했다. 자연 만료 경로는 Java `startsDayWhenTheRoleConfirmationTimerExpires`로, server deadline은 Java timestamp assertion으로 확인했다.

## 11. 실패 및 차단 항목

- 최종 QA 실행의 `FAIL`: 없음
- 최종 QA 실행의 `BLOCKED`: 없음
- `NOT RUN`: 없음
- skipped Playwright case: 없음

최초 sandbox 실행에서 Playwright worker 생성이 `Error: spawn EPERM`으로 차단되었으나, 이는 애플리케이션 또는 테스트 assertion 실패가 아닌 실행 환경의 child-process 제한이었다. 원인 확인 후 허용된 실행 환경에서 동일한 전체 명령을 수행했고 6개가 모두 실행·통과되었다.

## 12. 재현 절차

1. MariaDB를 `127.0.0.1:23306`에서 실행한다.
2. `GRADLE_USER_HOME=C:\workspace\mafiaweb\.gradle-test`를 사용한다.
3. 위 4절의 Java와 JavaScript 명령을 실행한다.
4. `SERVER_PORT=8083`으로 `bootRun`을 시작한다.
5. `/login` HTTP 200을 확인한다.
6. `E2E_RUN_ID=qa-20260920-165300`, `PLAYER_COUNTS=4,5,6,8`, `--workers=1 --retries=0`으로 Playwright를 실행한다.
7. 실행 후 동일 run ID 이메일 prefix만 조회해 테스트 계정을 삭제하고 잔여 수를 0으로 확인한다.

## 13. 원인 분석

이번 실행에서는 재현할 애플리케이션 결함이 없었다. 역할 임계값은 `RoomGameRules.java:25-55`, 승리 판정은 `:57-75`, phase deadline은 `RoomGameService.java:701-731`에서 server state로 관리되고 있었다. 채널 권한은 `RoomGameService.java:252-296`과 `ChatService.java:58-63`에서 서버 측 검증되었다.

## 14. 애플리케이션 결함과 테스트 코드 결함 분류

- 애플리케이션 결함: 확인되지 않음
- 테스트 코드 결함: 확인되지 않음
- 환경 이슈: sandbox의 Node worker `spawn EPERM`이 있었으나 허용된 실행 환경에서 해결됨
- 데이터 정리 이슈: 없음

## 15. 변경이 필요한 파일 및 라인

이번 QA 결과를 기준으로 필수 수정이 필요한 파일은 없다. 관련 계약과 검증 위치는 다음과 같다.

- 역할 수/승리 조건: `src/main/java/kr/or/oti/mafiagame/service/RoomGameRules.java:30-75`
- phase duration: `src/main/java/kr/or/oti/mafiagame/dto/GamePhase.java:4-9`
- 행동·deadline·변론·snapshot: `src/main/java/kr/or/oti/mafiagame/service/RoomGameService.java:168-236,252-296,631-764`
- 재접속/탈주: `src/main/java/kr/or/oti/mafiagame/service/RoomPresenceService.java:45-97,740-780`
- 브라우저 검증: `test/e2e/mafia-mvp.spec.js:519-1157`

## 16. 권장 사항

필수 수정은 없지만, CI나 제한된 Windows 환경에서 Playwright를 실행할 때는 QA 스크립트와 동일하게 `--workers=1`을 유지하고, Node test runner에는 `--test-isolation=none`을 유지하는 것이 안전하다. 실패 시에만 Playwright trace/screenshot을 보존하도록 설정하면 `test-results` 저장 공간도 줄일 수 있다.

## 17. 생성된 테스트 산출물

- Java JUnit XML: `C:\workspace\mafiaweb\build\test-results\test\`
- Gradle HTML: `C:\workspace\mafiaweb\build\reports\tests\test\index.html`
- Playwright 최종 상태: `C:\workspace\mafiaweb\test-results\.last-run.json`
- QA 서버 stdout: `C:\workspace\mafiaweb\test-results\bootRun.qa-20260920-165300.stdout.log`
- QA 서버 stderr: `C:\workspace\mafiaweb\test-results\bootRun.qa-20260920-165300.stderr.log` (0 byte)
- Playwright trace/screenshot: 모든 케이스 통과로 실패 artifact가 생성되지 않음
- 최종 보고서: `C:\workspace\mafiaweb\docs\QA_report\MAFIAGAME_QA_REPORT_2026-09-20_qa-20260920-165300.md`

## 18. 기존 데이터 보존 확인

`$deleteExistingData = $false`로 실행했고, 기존 사용자·방·통계 데이터는 broad pattern으로 삭제하지 않았다. QA 서버는 이번 실행에서 새로 시작한 8083 프로세스만 종료했으며, 기존 서버를 종료하지 않았다. 테스트 과정에서 이미 존재하던 worktree 변경도 되돌리지 않았다.

## 19. 테스트 계정 정리 결과

현재 실행 ID `qa-20260920-165300`에 해당하는 이메일만 exact prefix로 조회했다.

```text
MATCHED_ACCOUNTS=35
DELETED room_members=0 game_room=0 user_stats=35 user=35
REMAINING_TEST_ACCOUNTS=0
CLEANUP_COMMITTED=true
```

계정과 종속 레코드 삭제는 트랜잭션으로 수행했고, 검증 후 commit했다. 임시 JDBC 정리 helper는 실행 후 삭제했다.

## 20. 최종 판정

# `PASS`

Java 103개, JavaScript 23개, Playwright 6개가 모두 통과했고, QA 서버 health check와 current-run 테스트 계정 정리도 성공했다.


---

---

---

## 문서 10: `MAFIAGAME_QA_REPORT_2026-09-20_qa-20260920-221345.md`

# MAFIAGAME 최종 QA 실행 리포트

- 실행일: 2026-09-20 (Asia/Seoul)
- 실행 ID: `qa-20260920-221345`
- 기준 문서: `docs/QA_scripts/MAFIAGAME_QA_TEST_EXECUTION_SCRIPT.md`
- 최종 QA 서버: `http://127.0.0.1:8091` (이번 실행에서 새로 기동)
- E2E 설정: `PLAYER_COUNTS=4,5,6,8`, `workers=1`, `retries=0`
- DB: `127.0.0.1:23306` 연결 확인 후 진행

## 최종 판정

**PASS** — QA 스크립트의 필수 자동화 단계가 모두 실행됐고, Java 103건, JavaScript 23건, Playwright E2E 6건이 모두 통과했다.

## 실행 결과

| 영역 | 실행 명령/범위 | 결과 |
|---|---|---|
| MariaDB 사전 점검 | `127.0.0.1:23306` 연결 | PASS |
| Java/Gradle | `gradlew.bat test --no-daemon --rerun-tasks -x jsTest` | 103 passed, 0 failed, 0 error, 0 skipped |
| JavaScript | `node --test --test-isolation=none test/js/stomp-client.test.js test/js/room-list.test.js test/js/chat.test.js` | 23 passed, 0 failed |
| Playwright 테스트 목록 | QA 필수 6개 테스트 탐색 | PASS |
| Playwright E2E | `npm.cmd run test:e2e -- --workers=1 --retries=0 --reporter=list` | 6 passed, 총 20.1분 |

### Playwright 시나리오

| 시나리오 | 결과 | 실행 시간 |
|---|---:|---:|
| MVP 4인 핵심 게임 흐름 | PASS | 4.1분 |
| MVP 5인 핵심 게임 흐름 | PASS | 4.2분 |
| MVP 6인 핵심 게임 흐름 | PASS | 4.2분 |
| MVP 8인 핵심 게임 흐름 | PASS | 4.2분 |
| 대기방 탭 종료 후 6인→5인 임계값 전환 | PASS | 9.9초 |
| 브라우저 마감·재접속 유예·만료 밤 행동 | PASS | 1.9분 |

4·5·6·8인 실제 브라우저 흐름과 5→6명 역할 임계값, 8인 최대 시나리오를 모두 실행했다. 마지막 시나리오는 서버 마감 시각, 재접속 유예, 유예 만료 후 밤 행동 무효화를 포함한다.

## QA 이미지·동영상

전체 E2E 종료 직후 같은 8091 서버에서 실제 로그인 후 대기방을 생성해 캡처했다. 데스크톱과 모바일 캡처는 동일한 라이브 페이지의 반응형 결과이며, 동영상은 해당 흐름의 Playwright WebM 녹화다.

- [데스크톱 QA 이미지](</C:/workspace/mafiaweb/test-results/qa-20260920-221345-artifacts/qa-room-desktop.png>)
- [모바일 QA 이미지](</C:/workspace/mafiaweb/test-results/qa-20260920-221345-artifacts/qa-room-mobile.png>)
- [QA 실행 동영상(WebM)](</C:/workspace/mafiaweb/test-results/qa-20260920-221345-artifacts/video/page@0495d2e982f0b5189ef02c4034a3a0d3.webm>)

## 계정 및 서버 정리

- E2E 실행 계정: `qa-20260920-221345` 선택자에 일치한 35개 계정 삭제, 잔여 0개.
- 캡처 계정: `qa-20260920-221345-artifact` 선택자에 일치한 1개 계정 삭제, 잔여 0개.
- 이번 실행에서 기동한 8091 서버: 테스트·캡처 후 종료 확인.
- 기존 8081 서버: 종료하지 않았으며 정리 후에도 `/login` 응답 200 확인.

## 산출물

- [Playwright 실행 로그](</C:/workspace/mafiaweb/test-results/e2e.qa-20260920-221345.log>)
- [Gradle HTML 테스트 리포트](</C:/workspace/mafiaweb/build/reports/tests/test/index.html>)
- [QA 이미지·동영상 폴더](</C:/workspace/mafiaweb/test-results/qa-20260920-221345-artifacts>)

참고: 서버 stdout에는 QA 종료를 위해 프로세스를 중지한 뒤 Gradle `bootRun` 종료 코드가 기록될 수 있다. 이는 애플리케이션 테스트 실패가 아니라 실행 후 서버 정리 과정의 종료 결과이며, 애플리케이션 기동과 모든 QA 시나리오는 그 전에 정상 완료됐다.


---

---
