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
