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
