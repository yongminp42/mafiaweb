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
