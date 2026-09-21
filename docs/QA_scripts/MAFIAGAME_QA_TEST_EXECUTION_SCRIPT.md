# MAFIAGAME Reusable QA Test Execution Script

## Role

You are the QA engineer for the MAFIAGAME project.

Execute the project tests and validate the implementation against the MVP requirements. Produce a detailed QA report based only on actual test output, source code, and test evidence.

## Run Configuration

Change only the values in this section before each run. Keep the rest of this document unchanged so that it can be reused for future QA runs.

```powershell
$projectPath = 'C:\workspace-sts-5.3.0\mafiagame'
$e2eEnabled = $true
$playerCounts = '4,5,6,8'
$uiCapacity = 8
$workerCount = 1
$baseUrl = 'http://127.0.0.1:8080'
$serverPort = 8080
$dbHost = '127.0.0.1'
$dbPort = 23306
$mvpDocument = 'docs/MAFIAGAME_MVP.md'
$qaReportDirectory = 'docs/QA_report'
$sourceModificationAllowed = $false
$deleteExistingData = $false
$deleteTestAccounts = $true
```

Configuration rules:

- Set `$e2eEnabled` to `$true` or `$false` before execution.
- If `$e2eEnabled = $false`, skip all Playwright commands and report E2E as `NOT RUN`.
- For a complete run, `$playerCounts` must contain exactly `4,5,6,8`. The `6` entry is required because the two extended browser cases are conditionally registered only when six players are configured.
- Use the value of `$playerCounts` for `PLAYER_COUNTS` in the Playwright command. A targeted count is supplementary evidence only.
- Use `$uiCapacity = 8` for the dedicated UI regression suite so the role-card layout is checked at the maximum supported room size.
- Use a new `E2E_RUN_ID` for every execution.
- Use the same `E2E_RUN_ID` for the core and UI regression suites so their accounts and rooms can be cleaned up together.
- Keep `$workerCount = 1` for the complete run. The suite shares a server, database, and lobby online-player baseline; running workers in parallel can mix those states.
- Always report the requested and effective worker counts.
- Do not inspect or assert font sizes. Chat UI checks are limited to functionality, overflow/scroll behavior, and whether visible channel labels are clipped.
- The expected server phase order is `ROLE_ASSIGNMENT(15s) → DAY_DISCUSSION(60s) → NOMINATION_VOTE(20s) → FINAL_DEFENSE(20s, when a unique nominee exists) → EXECUTION_VOTE(20s) → NIGHT(35s)`. `ROLE_ASSIGNMENT` may end early when every living player confirms their role.
- Replace `$projectPath` and `$baseUrl` if the project is moved or the server configuration changes.
- Reserve `$serverPort` for a fresh QA server built from the current workspace. If that port is already occupied, choose another unused port and update `$baseUrl` before proceeding. Never assume an existing server contains the current source.
- Use `$dbHost` and `$dbPort` from the application datasource configuration. If MariaDB is not reachable, stop before starting the application and mark the run `BLOCKED`/`NOT RUN`; do not install or start a database service automatically.
- Save the final QA report under `$projectPath\$qaReportDirectory`.
- Use a unique report filename containing the execution date and `E2E_RUN_ID`.
- Do not modify source code unless `$sourceModificationAllowed = $true` in a separate request.

## Project Information

- Project path: use `$projectPath` from the run configuration.
- Report directory: use `$qaReportDirectory` from the run configuration.
- E2E test execution: use `$e2eEnabled` from the run configuration.
- E2E player counts: use `$playerCounts` from the run configuration.
- Source code modification: use `$sourceModificationAllowed` from the run configuration.
- Existing users, rooms, and database data: use `$deleteExistingData` from the run configuration.
- Test-account cleanup: use `$deleteTestAccounts` from the run configuration. This must remain `$true` for a normal QA run.

## Initial Inspection

Inspect the following files and directories before running tests:

- `AGENTS.md`
- `docs/MAFIAGAME_MVP.md`
- `package.json`
- `build.gradle`
- `src/main/**`
- `src/test/**`
- `test/js/**`
- `test/e2e/**`
- `src/main/resources/application.properties` (datasource host and port)

Record the relevant project structure, test scripts, test configuration, and MVP requirements.

## 0. Environment Preflight

Run this gate before any Java, JavaScript, or Playwright command:

```powershell
$databaseProbe = Test-NetConnection `
    -ComputerName $dbHost `
    -Port $dbPort `
    -InformationLevel Quiet `
    -WarningAction SilentlyContinue

if (-not $databaseProbe) {
    throw "MariaDB is not reachable at $dbHost`:$dbPort. Stop this QA run; all requested test cases are NOT RUN."
}

if ($e2eEnabled -and $playerCounts -ne '4,5,6,8') {
    throw "A complete QA run requires PLAYER_COUNTS=4,5,6,8; current value is $playerCounts."
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw 'Node.js is not available. Stop this QA run as BLOCKED; do not install dependencies automatically.'
}

if ($e2eEnabled -and -not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) {
    throw 'npm.cmd is not available. Stop the E2E portion as BLOCKED; do not install dependencies automatically.'
}

$requiredDependencyPaths = @(
    (Join-Path $projectPath 'node_modules\jsdom')
)
if ($e2eEnabled) {
    $requiredDependencyPaths += (Join-Path $projectPath 'node_modules\@playwright\test')
}
foreach ($dependencyPath in $requiredDependencyPaths) {
    if (-not (Test-Path $dependencyPath)) {
        throw "Required local Node dependency is missing: $dependencyPath. Stop this QA run as BLOCKED; do not install it during this QA run."
    }
}
```

The project currently uses `jdbc:mariadb://localhost:23306/mafiaweb`. A failed
database probe is an environment `BLOCKED` result, not an application `PASS`, and
the script must not start MariaDB or install a missing client/service.

## 1. Java Tests

Run:

```powershell
$env:GRADLE_USER_HOME="$projectPath\.gradle-test"
.\gradlew.bat test --no-daemon --rerun-tasks -x jsTest
```

`build.gradle` makes the Gradle `test` task depend on `jsTest`. The QA run executes
the Java and JavaScript suites separately so that the Java result is not hidden by a
second JavaScript invocation and so the JavaScript runner can use the environment-safe
test isolation setting below. Record the `-x jsTest` option in the report.

Collect and report:

- Java unit test results
- Spring integration test results
- MyBatis and database-related test results
- Total test count
- Passed, failed, and errored test counts
- Failed test class, method, file, and line number
- Role-confirmation and final-defense phase results, including timer and permission assertions
- Relevant console output
- JUnit XML and Gradle HTML report paths

## 2. JavaScript Tests

Run:

```powershell
node --test --test-isolation=none `
    test/js/stomp-client.test.js `
    test/js/room-list.test.js `
    test/js/chat.test.js
```

This is the same three-file test set declared by `package.json`'s `test:js` script.
`--test-isolation=none` keeps the Node test runner in one process, which is required
in restricted Windows environments where the default per-file child-process spawn can
return `EPERM`. Do not run `npm install` or download test browsers as part of QA.

Verify and report:

- Total JavaScript test count
- Passed and failed test counts
- STOMP communication
- Lobby and participant synchronization
- Ready state handling
- Game phase UI rendering
- Role-confirmation phase UI and confirmation request
- Final-defense phase UI and nominee-only public chat permission
- Private role rendering
- Voting UI
- Police investigation result rendering
- Game result rendering
- Participant death-state rendering: when a game state marks a player as `alive: false`, the matching card receives `.participant-dead`, shows `사망`, and living cards remain unchanged
- Reconnection handling

Report the standalone JavaScript result separately from the Gradle Java result. If the
direct Node command is unavailable, classify JavaScript as `BLOCKED`; do not silently
replace it with source inspection.

## 3. Playwright E2E Tests

Run E2E when `$e2eEnabled = $true`. When it is `$false`, skip every Playwright command and mark all E2E items `NOT RUN`.

### 3.1 Prepare the Test Environment

Use the existing project path and create a test result directory if necessary:

```powershell
$testResultPath = Join-Path $projectPath 'test-results'
New-Item -ItemType Directory -Force -Path $testResultPath | Out-Null
$env:E2E_RUN_ID = 'qa-' + (Get-Date -Format 'yyyyMMdd-HHmmss')

$existingServer = Get-NetTCPConnection `
    -LocalPort $serverPort `
    -State Listen `
    -ErrorAction SilentlyContinue

$startedServer = $false
$appProcess = $null
```

Start a fresh application instance built from the current workspace. Do not stop or
reuse the user's existing server:

```powershell
if ($existingServer) {
    throw "QA port $serverPort is already in use. Choose an unused serverPort and matching baseUrl."
}
$env:GRADLE_USER_HOME = "$projectPath\.gradle-test"
$env:SERVER_PORT = "$serverPort"

$appProcess = Start-Process `
    -FilePath 'cmd.exe' `
    -ArgumentList '/c .\gradlew.bat bootRun --no-daemon' `
    -WorkingDirectory $projectPath `
    -WindowStyle Hidden `
    -RedirectStandardOutput "$testResultPath\bootRun.$env:E2E_RUN_ID.stdout.log" `
    -RedirectStandardError "$testResultPath\bootRun.$env:E2E_RUN_ID.stderr.log" `
    -PassThru

$startedServer = $true
```

### 3.2 Server Health Check

Wait up to 60 seconds, checking every 5 seconds:

```powershell
$response = $null
$retryCount = 0

while ($retryCount -lt 12 -and $response -ne 200) {
    Start-Sleep -Seconds 5

    try {
        $response = (
            Invoke-WebRequest `
                -Uri "$baseUrl/login" `
                -UseBasicParsing `
                -TimeoutSec 3
        ).StatusCode
    } catch {
        $response = $null
    }

    $retryCount++
}

if ($response -ne 200) {
    throw 'The application did not become healthy within 60 seconds.'
}
```

Record the result:

- HTTP 200: `PASS`
- No response, timeout, or other status: `BLOCKED`

### 3.3 Run Playwright

Use a unique execution ID for all test accounts and room titles:

```powershell
$env:PLAYER_COUNTS = $playerCounts
$env:BASE_URL = $baseUrl
```

The suite uses one worker so scenarios run in order. Individual scenario failures
must not cause the remaining configured scenarios to be skipped. Keep retries disabled.

Before the real run, enumerate the core tests and verify that the complete six-test set is
present. This catches a missing conditional six-player scenario before accounts are
created. The UI regression suite is discovered separately because it uses a dedicated
maximum-capacity layout run:

```powershell
$e2eList = @(
    npm.cmd run test:e2e -- --list --workers=$workerCount 2>&1
)
if ($LASTEXITCODE -ne 0) {
    throw 'Playwright test discovery failed; do not start the full E2E run.'
}

$requiredE2EScenarios = @(
    'MVP 4인 핵심 게임 흐름',
    'MVP 5인 핵심 게임 흐름',
    'MVP 6인 핵심 게임 흐름',
    'MVP 8인 핵심 게임 흐름',
    'closing a waiting-room tab changes six players to the five-player role threshold',
    'browser deadline, reconnect grace, and expired night action'
)
foreach ($scenario in $requiredE2EScenarios) {
    if (-not ($e2eList -match [regex]::Escape($scenario))) {
        throw "Required Playwright scenario was not discovered: $scenario"
    }
}

$env:E2E_CAPACITY = [string]$uiCapacity
$uiE2eList = @(
    npm.cmd run test:e2e:ui -- --list --workers=$workerCount 2>&1
)
if ($LASTEXITCODE -ne 0) {
    throw 'Playwright UI regression discovery failed; do not start the full E2E run.'
}

$requiredUIScenarios = @(
    'role slot is visible before game and chat scrolls without growing the page',
    "waiting and started room layout ($uiCapacity players)"
)
foreach ($scenario in $requiredUIScenarios) {
    if (-not ($uiE2eList -match [regex]::Escape($scenario))) {
        throw "Required Playwright UI scenario was not discovered: $scenario"
    }
}
```

After discovery succeeds, run the core suite and then the UI regression suite once:

```powershell
npm.cmd run test:e2e -- --workers=$workerCount --retries=0 --reporter=list
$e2eExitCode = $LASTEXITCODE

npm.cmd run test:e2e:ui -- --workers=$workerCount --retries=0 --reporter=list
$uiE2eExitCode = $LASTEXITCODE
Remove-Item Env:E2E_CAPACITY -ErrorAction SilentlyContinue
```

Record each core case's actual result, `$e2eExitCode`, and `$uiE2eExitCode`. A failure in one case must not
be counted as a failure in a skipped case. If any case is skipped, report it as
`NOT RUN` and investigate the execution order before claiming a complete run.

The core inventory is four normal boundary cases plus two six-player resilience cases.
The UI inventory adds the chat-scroll case and the 8-player room-layout case. If
`$playerCounts` does not include `6`, the two core resilience cases are not registered;
the core run is incomplete and must be reported with the missing cases as `NOT RUN`.

If the test suite is later split into independent files, parallel workers may be
considered only after server, database, test-account, and online-player-baseline
isolation has been demonstrated.

Verify:

- MariaDB preflight passed before any application process was started
- Playwright core discovery listed all six required cases when `$playerCounts = '4,5,6,8'`
- Playwright UI discovery listed the chat-scroll case and the 8-player room-layout case
- `ROLE_ASSIGNMENT` is observed before the first `DAY_DISCUSSION`, and roles are not present in public game state
- Role confirmation is submitted once per living player; duplicate confirmations are rejected
- All confirmations cause early transition to `DAY_DISCUSSION`; otherwise the 15-second role timer advances the game
- A unique nomination enters `FINAL_DEFENSE` for 20 seconds before `EXECUTION_VOTE`
- Only the nominated player can send public chat during `FINAL_DEFENSE`; other living players are rejected by the server
- A nominee departure during `FINAL_DEFENSE` skips execution and advances to `NIGHT`
- Unique account creation
- Unique room creation
- 4-player minimum scenario
- 5-player scenario
- 6-player boundary scenario
- 8-player maximum scenario
- Real-time participant synchronization
- Ready synchronization
- Host-only game start permission
- Role assignment and private role display
- Exact role counts for 4, 5, 6, and 8 players (service test evidence)
- Boundary mafia count: 1 for 5 players and 2 for 6 players
- Citizen count formula: total players - mafia - police - doctor
- Start rejection or disabled start state for fewer than 4 players and more than 8 players
- Role assignment, day, nomination vote, final defense, execution vote, and night transitions
- Execution of both mafia players in the 6-player boundary scenario
- Actual `MAFIA_KILL`, `DOCTOR_PROTECT`, and `POLICE_INVESTIGATE` submissions
- Doctor protection keeps the mafia target alive and police sees the private faction result
- Citizen victory after the remaining mafia players are executed
- Server timer synchronization
- Self-vote prevention
- Duplicate vote prevention
- Execution candidate vote prevention
- Game result rendering
- Winning faction, role, and alive/dead status rendering
- Participant death-state rendering: after execution or a night-state update, the affected participant card has the grey/red visual treatment and visible `사망` status; living participant cards do not receive the death style
- `PLAYING` to `WAITING` transition
- Ready reset
- Same-room replay
- State restoration after refresh or reconnection
- 4-player minimum flow and 8-player maximum flow in real browser sessions
- Full role reveal only after `FINISHED`; no role reveal on death
- Private investigation result is hidden when the investigator dies
- Public/mafia channel selector and server-side mafia-channel isolation
- Night chat restriction: living mafia use only the mafia channel, living non-mafia cannot chat, and dead-player messages remain in the dead channel
- Mafia victory only when alive mafia count is greater than the alive citizen-faction count
- Equality between alive mafia and alive citizen-faction counts must continue the game
- Citizen victory immediately after the last mafia becomes dead
- Mafia target aggregation when two mafia submit night actions concurrently
- Nomination tie handling without selecting an execution target
- Final-defense access control and transition to execution voting
- Role-confirmation duplicate prevention and timeout fallback
- Last-session player departure/removal from alive counts after the reconnect grace period
- Departure removes the player's pending nomination, execution, and night actions
- Reconnection restores the current game state without reviving a departed player
- Player departure immediately before game start, with the current participant count used for role assignment
- Vote requests that race with the phase deadline
- Server-time deadline handling for requests received after `phaseEndsAt`
- Duplicate requests from the same user count only once
- No mafia action, no doctor action, and no police action behavior
- Doctor self-protection and consecutive-night self-protection
- Already-dead or post-departure targets are rejected
- A submitted night action survives disconnect only during the 10-second reconnect grace period
- A night action is removed when the player is absent after the 10-second grace period
- Same-room replay at 4, 5, 6, and 8 players after `WAITING` reset
- Actual elapsed 15/60/20/20/20/35 second phase durations for role assignment, day discussion, nomination, final defense, execution, and night; not only displayed timer values
- Every non-host browser reaches the exact created room URL before participant-state assertions
- A pending lobby refresh is cancelled when a browser starts navigating from `/rooms` to a room
- The equality case where alive mafia equals the alive citizen faction continues to the next phase
- The chat input is at least 40px high in the browser
- `마피아 채널` is fully visible without clipping in the selector
- 210 chat submissions retain only the latest 200 rendered messages, scroll internally, and do not increase the document height
- The waiting-room `GAME` placeholder is visible before start and the started role panel is visible after start
- The 8-player role panel reaches the lower game-card edge and the `역할 확인 완료` button remains at the role panel bottom

The Playwright inventory must map to the following executable cases:

| Case | Playwright test | Required result |
|---|---|---|
| 4 players | `MVP 4인 핵심 게임 흐름` | Role confirmation, one-mafia role set, final defense, complete game, replay |
| 5 players | `MVP 5인 핵심 게임 흐름` | Role confirmation, one-mafia boundary role set, final defense, complete game, replay |
| 6 players | `MVP 6인 핵심 게임 흐름` | Role confirmation, two-mafia role set, final defense, both mafia executions, night actions, victory, replay |
| 8 players | `MVP 8인 핵심 게임 흐름` | Role confirmation, maximum supported browser flow, final defense, replay |
| 6→5 before start | `closing a waiting-room tab changes six players to the five-player role threshold` | Closed tab is removed before start and five-player roles are assigned |
| Deadline/reconnect | `browser deadline, reconnect grace, and expired night action` | Near-deadline requests do not hang; reconnect within 10 seconds preserves state; expiry removes the pending action |

The UI regression inventory must also map to these executable cases:

| Case | Playwright test | Required result |
|---|---|---|
| Chat input and overflow | `role slot is visible before game and chat scrolls without growing the page` | Input height is at least 40px; 210 submissions render only the latest 200 messages; the message list scrolls internally; document height stays stable; screenshot and video are saved under the current `E2E_RUN_ID` |
| 8-player role layout | `waiting and started room layout (8 players)` | Eight participants render; host controls remain aligned; left/right columns have equal height; the role panel reaches the lower game-card edge; the role-confirmation status count is hidden; the `역할 확인 완료` button is at the panel bottom; screenshot is saved under the current `E2E_RUN_ID` |

The four normal cases are generated from `PLAYER_COUNTS`. The two extended cases are
generated only when `PLAYER_COUNTS` contains `6`, so omitting `6` makes the run
incomplete even if the remaining counts pass.

The room-entry E2E case must click the room in the lobby, then confirm both the
destination URL and the participant count. A participant count alone is insufficient:

```javascript
await joinRoomFromLobby(page, roomUrl);
await waitForRoomParticipantCount(page, expectedCount);
```

The lobby regression case must verify that a refresh scheduled for a newly discovered room is cancelled
when `beforeunload` starts. This protects the room-entry navigation from a competing `window.location.reload()`.

For a complete QA result, run all four configured core counts and both conditional
six-player cases in one execution (`4,5,6,8`), then run the UI regression suite with
`E2E_CAPACITY=8` using the same `E2E_RUN_ID`. A targeted rerun such as only `6` or `8`
may be recorded as supplementary evidence, but it does not replace the missing core
scenarios. Any core count, extended case, or UI regression case not executed in the
same QA run must remain `NOT RUN` in the final report.

Do not retry failed tests automatically. Investigate the failure first.

For failed Playwright tests, inspect:

- `test-results/**/error-context.md`
- `test-results/**/*.png`
- `test-results/**/*.zip`
- `test-results/.last-run.json`
- `test-results/bootRun.<E2E_RUN_ID>.stdout.log`
- `test-results/bootRun.<E2E_RUN_ID>.stderr.log`
- `output/chat-scroll-test-<E2E_RUN_ID>/**`
- `output/room-layout-test-<uiCapacity>-<E2E_RUN_ID>/**`

### 3.4 Clean Up Only the Test Server

Wrap the health check, discovery, E2E execution, account cleanup, and report-writing
bookkeeping in one outer `try/finally`. Account cleanup must run before the server
process is terminated, and it must run even when a Playwright case fails:

```powershell
try {
    # Health check, Playwright discovery, and Playwright execution
}
finally {
    # Run the section 3.5 account cleanup first when it is enabled.
    if ($startedServer -and $appProcess) {
        taskkill.exe /PID $appProcess.Id /T /F
    }
}
```

Do not terminate an existing server that was running before this QA run.

### 3.5 Delete Test Accounts After the Run

After Playwright completes, delete every account created by this QA run. Do this before writing the final report, and record the number of accounts found and deleted.

The E2E test account email format is:

```text
playwright.<E2E_RUN_ID>.<scenarioId>.<playerNumber>@example.com
```

Both `test:e2e` and `test:e2e:ui` use this namespace. The UI suite uses the
`chat-scroll` and `room-layout` scenario IDs, and its room titles start with
`Playwright MVP UI`, so the same cleanup transaction covers both suites.

Cleanup rules:

- Run cleanup only when `$deleteTestAccounts -eq $true`.
- Use the exact current `$env:E2E_RUN_ID` as the selector. Never delete by a broad `playwright.%` pattern.
- First select and record the matching `user_id` and `email` values. Confirm that every match belongs to the current run.
- Remove dependent `room_members` rows and test-created `game_room` rows before removing `user_stats` and `user` rows, because of foreign-key relationships.
- Do not delete pre-existing users, rooms, or records. Do not delete a room or account that is still being used by another active session.
- If the database cleanup cannot be executed or verification shows remaining matching accounts, report cleanup as `BLOCKED` and do not claim the QA run is fully complete.
- Leave every pre-existing server running; account cleanup must not terminate it.

Use the database client configured for the environment. The following SQL is a template; bind the exact generated email prefix from the current run rather than copying an untrusted value into the query:

```sql
START TRANSACTION;

CREATE TEMPORARY TABLE qa_test_users AS
SELECT user_id
FROM `user`
WHERE email LIKE CONCAT('playwright.', :e2e_run_id, '.%@example.com');

DELETE rm
FROM room_members rm
JOIN qa_test_users qtu ON qtu.user_id = rm.user_id;

DELETE gr
FROM game_room gr
JOIN qa_test_users qtu ON qtu.user_id = gr.host_user_id
WHERE gr.title LIKE CONCAT('Playwright MVP %', :e2e_run_id, '%');

DELETE us
FROM user_stats us
JOIN qa_test_users qtu ON qtu.user_id = us.user_id;

DELETE u
FROM `user` u
JOIN qa_test_users qtu ON qtu.user_id = u.user_id;

SELECT COUNT(*) AS remaining_test_accounts
FROM `user`
WHERE email LIKE CONCAT('playwright.', :e2e_run_id, '.%@example.com');

COMMIT;
```

Require `remaining_test_accounts = 0` for cleanup `PASS`. If the transaction fails, roll it back and report the cleanup result separately from the application test result.

## 4. MVP Validation Scope

Use `docs/MAFIAGAME_MVP.md`, section `5. 최소 게임 규칙`, as the validation baseline.

Exclude the additional feature in section `5.3 낮 건너뛰기 투표`.

Classify every item as exactly one of:

- `PASS`
- `FAIL`
- `BLOCKED`
- `NOT RUN`

Validate the following:

1. Mafia, doctor, police, and citizen role assignment
2. Private role visibility
3. 60-second day timer
4. 20-second nomination vote timer
5. 20-second final defense timer
6. 20-second execution vote timer
7. 35-second night timer
8. Duplicate nomination vote prevention
9. Self-nomination prevention
10. Dead-player vote prevention
11. Execution candidate vote prevention
12. Mafia kill
13. Doctor protection
14. Private police investigation result
15. Role-specific night action validation
16. Citizen night-action prevention
17. Citizen victory condition
18. Mafia victory condition
19. Server-side victory evaluation immediately after voting or night actions
20. Immediate result display after victory
21. Winning faction display
22. Personal role display in the result
23. Alive/dead status display, including the dead participant card's grey/red distinction and visible `사망` label
24. Return to `WAITING`
25. Ready state reset
26. Replay in the same room
27. State restoration after refresh or reconnection
28. Public and mafia chat channel separation
29. Night chat and dead-channel isolation restrictions
30. No-action behavior for mafia, doctor, and police
31. Doctor self-protection, including consecutive nights
32. No role/investigation disclosure on death
33. Full role reveal after game completion
34. Server-time deadline handling and duplicate-request idempotency

### 4.1 Extended Boundary and Resilience Checks

The following checks are required when the QA request includes boundary, disconnect, or concurrency coverage. They are separate from the normal 4/5/6/8-player E2E boundary run and must be reported individually:

1. Role-count boundaries: 4 players = 1 mafia, 1 police, 1 doctor, 1 citizen; 5 players = 1 mafia, 1 police, 1 doctor, 2 citizens; 6 players = 2 mafia, 1 police, 1 doctor, 2 citizens; 8 players = 2 mafia, 1 police, 1 doctor, 4 citizens.
2. Citizen-count formula: `citizens = totalPlayers - (mafia + police + doctor)`, including `6 - (2 + 1 + 1) = 2`.
3. Invalid start boundaries: fewer than 4 participants must keep start disabled or return a warning; more than 8 participants must be rejected by the server or prevented by room capacity.
4. Mafia victory threshold: after resolution, `aliveMafia > aliveCitizenFaction` must finish the game for the mafia; equality must continue the game.
5. Citizen victory precedence: `aliveMafia == 0` must finish the game for citizens even when the faction counts would otherwise be equal.
6. A 6-player game must continue after only one mafia is executed and finish for citizens only after the second mafia is dead.
7. If two mafia select different night targets, exactly one of the submitted highest-count targets is resolved; if they select the same target, that target is resolved unless protected.
8. Nomination ties must not select an execution candidate and must move to the night phase without hanging.
9. A last-session disconnect must remove that participant from alive counts after the configured 10-second reconnect grace period and re-evaluate victory; a reconnect within the grace period must restore the current state without marking the player dead.
10. A pre-start departure must be reflected in the participant count before roles are assigned; a 6-to-5 transition must use the one-mafia role set or prevent start until the state is stable.
11. Requests arriving at or immediately before a phase deadline must be serialized against server `phaseEndsAt`; requests received after it are invalid and cannot enter the next phase. Record this as `NOT RUN` when timing cannot be made deterministic.
12. A submitted night action survives a disconnect only while the player is within the 10-second reconnect grace period; after grace expiry it is removed before resolution.
13. Public chat is delivered only to the public channel; mafia chat is delivered only to living mafia users; dead users can use only the dead channel, and their messages must not be visible to living users.
14. The same room can be replayed after `FINISHED` at 4, 5, 6, and 8 players, with Ready reset and fresh role assignment.
15. The measured phase transitions must be approximately 15 seconds for role confirmation, 60 seconds for day discussion, 20 seconds for nomination, 20 seconds for final defense, 20 seconds for execution, and 35 seconds for night; a client-side countdown alone is insufficient evidence.

For each extended check, record the evidence source (`Java service test`, `Playwright E2E`, or `source inspection`) and classify it as `PASS`, `FAIL`, `BLOCKED`, or `NOT RUN`. Source inspection alone cannot be reported as an executed test `PASS`.

Use this evidence split when producing the report:

- The normal 4/5/6/8 flows, role displays and confirmation, final-defense nominee chat,
  actual browser chat, both-mafia execution flow, replay, and phase-duration assertions
  are `Playwright E2E` results.
- Role-rule edge cases, no-action behavior, self/consecutive doctor protection,
  post-departure target rejection, exact server-deadline rejection, duplicate request
  idempotency, and invalid participant-count starts are `Java service test` results.
- The six-player browser resilience test supplies `Playwright E2E` evidence for the
  pre-start 6→5 transition, reconnect within the 10-second grace period, grace expiry,
  pending night-action removal, and a near-deadline request attempt. The exact
  after-`phaseEndsAt` acceptance rule still requires the Java server-time test.
- A true simultaneous two-mafia network attack is not proven by sequential service
  submissions or by the nomination race. Keep that item `NOT RUN` unless the executed
  output contains a dedicated concurrent night-action test.

### 4.2 Implementation Contracts to Verify

When source inspection is used to explain a result, inspect these contracts directly and include the file and line number in the report:

- `RoomGameRules.createRoles`/`assignRoles`: mafia count is `1` for 4–5 players and `2` for 6–8 players; doctor and police remain one each; citizens fill the remainder.
- `GamePhase`: `ROLE_ASSIGNMENT` is 15 seconds and `FINAL_DEFENSE` is 20 seconds; both are part of the server phase enum.
- `RoomGameService.submitAction`: `ROLE_CONFIRM` is accepted only during `ROLE_ASSIGNMENT`, once per living player, and all confirmations can advance the room early to `DAY_DISCUSSION`.
- `RoomGameService.moveAfterNominationVote`/`validateChat`: a unique nominee enters `FINAL_DEFENSE`, and only that nominee may use public chat during the defense phase.
- `RoomGameRules.determineWinner`: citizen victory is checked first when `aliveMafia == 0`; mafia victory is checked only when `aliveMafia > aliveCitizenFaction`.
- `RoomGameService.handlePlayerDeparture`: after the reconnect grace period, a player whose last room session disconnects becomes non-alive, pending actions are removed, and victory is re-evaluated.
- `RoomPresenceService`: the last session retains a playing participant for 10 seconds, reconnect cancels the departure, expiry removes the participant and notifies the game service, a departed dead player may rejoin as a spectator without revival, and game start accepts only 4–8 current participants.
- `chat.js`: the host start button is disabled below four participants, and the current presence snapshot drives the displayed participant count and readiness state.
- `ChatService`/`RoomGameService`: public and mafia channel permissions are checked from the authoritative alive/role/phase state.
- `RoomGameService.snapshot`: roles are null before `FINISHED` and included for all players only after game completion.
- `test/e2e/mafia-mvp.spec.js`: the four count-driven cases verify role confirmation and final defense, and the two conditional six-player resilience cases are discovered before execution.

Do not infer a runtime result from these contracts. Use them only to identify implementation evidence, expected behavior, or the root cause of a failed or unexecuted test.

## 5. Analysis Rules

- Do not mark an unexecuted or unsupported item as `PASS`.
- Do not retry a failed test without first analyzing the cause.
- Separate application defects from test-code defects.
- Use console output, logs, source code, and test assertions as evidence.
- Provide file names and line numbers for all relevant findings.
- Do not modify source code during this QA run.
- Do not delete or revert existing user changes.
- Delete only the test accounts and dependent records created by the current QA run, as described in section 3.5. Preserve all pre-existing users, rooms, and database records.
- Treat the 5.3 daytime skip-vote feature as excluded, not as a failure.

## 6. Required Report Format

## 6.1 Automatic Report Saving

After all requested tests and MVP checks are complete, automatically save the final report as a Markdown file under the configured QA report directory.

The report must not be saved only in the chat response. It must be persisted to disk.

Use this naming convention:

```text
MAFIAGAME_QA_REPORT_<yyyy-MM-dd>_<E2E_RUN_ID>.md
```

Example:

```text
docs/QA_report/MAFIAGAME_QA_REPORT_2026-09-18_qa-20260918-173155.md
```

Before saving:

1. Create the report directory if it does not exist.
2. Do not overwrite an existing report with the same filename.
3. Include the actual execution ID, commands, console output, test results, MVP status, failures, root causes, and artifact paths.
4. If E2E is disabled, include `E2E: NOT RUN` and the reason in the report.
5. If a test is blocked or not executed, do not mark it as `PASS`.
6. Report the absolute saved file path in the final response.

The PowerShell setup for the report path is:

```powershell
$reportDirectoryPath = Join-Path $projectPath $qaReportDirectory
New-Item -ItemType Directory -Force -Path $reportDirectoryPath | Out-Null

$reportDate = Get-Date -Format 'yyyy-MM-dd'
$reportRunId = if ($env:E2E_RUN_ID) { $env:E2E_RUN_ID } else { 'no-e2e' }
$reportFileName = "MAFIAGAME_QA_REPORT_${reportDate}_${reportRunId}.md"
$reportFilePath = Join-Path $reportDirectoryPath $reportFileName

Write-Host "The final QA report must be saved to: $reportFilePath"
```

Use the file-writing mechanism supported by the execution environment to persist the completed Markdown report. Do not delete previous reports.

Write the report in the following order:

1. Execution environment
2. MariaDB preflight and dependency availability
3. Inspected files and directories
4. Commands executed
5. Java test summary and details
6. JavaScript test summary and details
7. Server startup and health-check result
8. Playwright discovery inventory, requested/effective workers, and E2E summary
9. Separate 4-player, 5-player, 6-player, 8-player, 6→5, and reconnect/deadline results
10. MVP validation table
11. Failed and blocked items
12. Reproduction steps
13. Root-cause analysis
14. Application defect versus test-code defect classification
15. Files and line numbers requiring changes
16. Recommended fixes, including code snippets where useful
17. Generated test artifact paths
18. Confirmation that existing data was preserved
19. Test-account cleanup result and remaining-account count
20. Final verdict: `PASS`, `FAIL`, or `BLOCKED`

The MVP validation table and the per-scenario results must explicitly report:

- `ROLE_ASSIGNMENT`: role delivery is private, the public game state does not reveal roles, each living player can confirm once, duplicate confirmation is rejected, and the phase advances on all confirmations or after 15 seconds.
- `FINAL_DEFENSE`: a unique nominee enters the 20-second phase, only the nominee can use public chat, non-nominees are rejected, and a nominee departure skips execution and advances to night.
- Measured server-side phase durations: approximately 15 seconds for role assignment, 60 seconds for day discussion, 20 seconds for nomination, 20 seconds for final defense, 20 seconds for execution, and 35 seconds for night.

For every result, include:

- Actual console output
- Error messages
- Test class and method names
- Related source files and line numbers
- JUnit XML paths
- Gradle HTML report path
- Playwright trace and screenshot paths
- Playwright core discovery output and the six required scenario names
- Playwright UI discovery output and the two required UI scenario names
- Requested worker count and effective worker count (`1` for the current suite)
- Application stdout and stderr log paths

Instructions and test commands: English
MVP requirements and final report: Korean
