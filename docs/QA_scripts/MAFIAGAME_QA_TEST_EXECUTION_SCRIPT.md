# MAFIAGAME Reusable QA Test Execution Script

## Role

You are the QA engineer for the MAFIAGAME project.

Execute the project tests and validate the implementation against the MVP requirements. Produce a detailed QA report based only on actual test output, source code, and test evidence.

## Run Configuration

Change only the values in this section before each run. Keep the rest of this document unchanged so that it can be reused for future QA runs.

```powershell
$projectPath = 'C:\workspace\mafiaweb'
$e2eEnabled = $true
$playerCounts = '4,5,6,8'
$workerCount = 2
$baseUrl = 'http://127.0.0.1:8080'
$serverPort = 8080
$mvpDocument = 'docs/MAFIAGAME_MVP.md'
$qaReportDirectory = 'docs/QA_report'
$sourceModificationAllowed = $false
$deleteExistingData = $false
$deleteTestAccounts = $true
```

Configuration rules:

- Set `$e2eEnabled` to `$true` or `$false` before execution.
- If `$e2eEnabled = $false`, skip all Playwright commands and report E2E as `NOT RUN`.
- Use the value of `$playerCounts` for `PLAYER_COUNTS` in the Playwright command.
- Use a new `E2E_RUN_ID` for every execution.
- Use `$workerCount` Playwright workers when the scenarios are isolated and the server/database can handle concurrent sessions.
- If the run shows server, database, online-player-baseline, or shared-room contention, reduce `$workerCount` to `1` and record the reason.
- Always report the requested and effective worker counts.
- Replace `$projectPath` and `$baseUrl` if the project is moved or the server configuration changes.
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

Record the relevant project structure, test scripts, test configuration, and MVP requirements.

## 1. Java Tests

Run:

```powershell
$env:GRADLE_USER_HOME="$projectPath\.gradle-test"
.\gradlew.bat test --no-daemon --rerun-tasks
```

Collect and report:

- Java unit test results
- Spring integration test results
- MyBatis and database-related test results
- Total test count
- Passed, failed, and errored test counts
- Failed test class, method, file, and line number
- Relevant console output
- JUnit XML and Gradle HTML report paths

## 2. JavaScript Tests

Run:

```powershell
npm.cmd run test:js
```

Verify and report:

- Total JavaScript test count
- Passed and failed test counts
- STOMP communication
- Lobby and participant synchronization
- Ready state handling
- Game phase UI rendering
- Private role rendering
- Voting UI
- Police investigation result rendering
- Game result rendering
- Reconnection handling

Note that the Gradle `test` task may also invoke the JavaScript test task through `build.gradle`. Report the standalone `npm.cmd run test:js` result separately from the Gradle result.

## 3. Playwright E2E Tests

E2E execution is required for this QA run.

### 3.1 Prepare the Test Environment

Use the existing project path and create a test result directory if necessary:

```powershell
$testResultPath = Join-Path $projectPath 'test-results'
New-Item -ItemType Directory -Force -Path $testResultPath | Out-Null

$existingServer = Get-NetTCPConnection `
    -LocalPort 8080 `
    -State Listen `
    -ErrorAction SilentlyContinue

$startedServer = $false
$appProcess = $null
```

If port 8080 is not already in use, start the application:

```powershell
if ($null -eq $existingServer) {
    $env:GRADLE_USER_HOME = "$projectPath\.gradle-test"

    $appProcess = Start-Process `
        -FilePath 'cmd.exe' `
        -ArgumentList '/c .\gradlew.bat bootRun --no-daemon' `
        -WorkingDirectory $projectPath `
        -RedirectStandardOutput "$testResultPath\bootRun.stdout.log" `
        -RedirectStandardError "$testResultPath\bootRun.stderr.log" `
        -PassThru

    $startedServer = $true
} else {
    Write-Host 'An existing server is listening on port 8080. Do not terminate it.'
}
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
$env:E2E_RUN_ID = 'qa-' + (Get-Date -Format 'yyyyMMdd-HHmmss')

npm.cmd run test:e2e -- --workers=$workerCount --reporter=list
```

The current project keeps the scenarios in one Playwright file and uses serial describe blocks. In that structure, Playwright may not be able to distribute every player-count scenario across multiple workers even when `$workerCount` is greater than `1`. Do not remove the serial setting or force parallel execution during QA; report the effective concurrency observed by Playwright.

If the test suite is later split into independent files, keep `$workerCount = 2` as the default and increase it only after confirming that the application server, database, test accounts, and lobby online-player baseline are isolated per worker.

Verify:

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
- Day, nomination vote, execution vote, and night transitions
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
- Actual elapsed 60/15/15/30 second phase durations, not only displayed timer values

Do not retry failed tests automatically. Investigate the failure first.

For failed Playwright tests, inspect:

- `test-results/**/error-context.md`
- `test-results/**/*.png`
- `test-results/**/*.zip`
- `test-results/.last-run.json`
- `test-results/bootRun.stdout.log`
- `test-results/bootRun.stderr.log`

### 3.4 Clean Up Only the Test Server

Always use a `finally` block. Terminate only the server started by this QA run:

```powershell
try {
    # Health check and Playwright execution
}
finally {
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

Cleanup rules:

- Run cleanup only when `$deleteTestAccounts -eq $true`.
- Use the exact current `$env:E2E_RUN_ID` as the selector. Never delete by a broad `playwright.%` pattern.
- First select and record the matching `user_id` and `email` values. Confirm that every match belongs to the current run.
- Remove dependent `room_members` rows and test-created `game_room` rows before removing `user_stats` and `user` rows, because of foreign-key relationships.
- Do not delete pre-existing users, rooms, or records. Do not delete a room or account that is still being used by another active session.
- If the database cleanup cannot be executed or verification shows remaining matching accounts, report cleanup as `BLOCKED` and do not claim the QA run is fully complete.
- If an existing server was used, leave that server running; account cleanup must not terminate it.

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
4. 15-second nomination vote timer
5. 15-second execution vote timer
6. 30-second night timer
7. Duplicate nomination vote prevention
8. Self-nomination prevention
9. Dead-player vote prevention
10. Execution candidate vote prevention
11. Mafia kill
12. Doctor protection
13. Private police investigation result
14. Role-specific night action validation
15. Citizen night-action prevention
16. Citizen victory condition
17. Mafia victory condition
18. Server-side victory evaluation immediately after voting or night actions
19. Immediate result display after victory
20. Winning faction display
21. Personal role display in the result
22. Alive/dead status display
23. Return to `WAITING`
24. Ready state reset
25. Replay in the same room
26. State restoration after refresh or reconnection
27. Public and mafia chat channel separation
28. Night chat and dead-channel isolation restrictions
29. No-action behavior for mafia, doctor, and police
30. Doctor self-protection, including consecutive nights
31. No role/investigation disclosure on death
32. Full role reveal after game completion
33. Server-time deadline handling and duplicate-request idempotency

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
15. The measured phase transitions must be approximately 60 seconds, 15 seconds, 15 seconds, and 30 seconds; a client-side countdown alone is insufficient evidence.

For each extended check, record the evidence source (`Java service test`, `Playwright E2E`, or `source inspection`) and classify it as `PASS`, `FAIL`, `BLOCKED`, or `NOT RUN`. Source inspection alone cannot be reported as an executed test `PASS`.

### 4.2 Implementation Contracts to Verify

When source inspection is used to explain a result, inspect these contracts directly and include the file and line number in the report:

- `RoomGameService.createRoles`: mafia count is `1` for 4–5 players and `2` for 6–8 players; doctor and police remain one each; citizens fill the remainder.
- `RoomGameService.determineWinner`: citizen victory is checked first when `aliveMafia == 0`; mafia victory is checked only when `aliveMafia > aliveCitizenFaction`.
- `RoomGameService.handlePlayerDeparture`: after the reconnect grace period, a player whose last room session disconnects becomes non-alive, pending actions are removed, and victory is re-evaluated.
- `RoomPresenceService`: the last session retains a playing participant for 10 seconds, reconnect cancels the departure, expiry removes the participant and notifies the game service, and game start accepts only 4–8 current participants.
- `chat.js`: the host start button is disabled below four participants, and the current presence snapshot drives the displayed participant count and readiness state.
- `ChatService`/`RoomGameService`: public and mafia channel permissions are checked from the authoritative alive/role/phase state.
- `RoomGameService.snapshot`: roles are null before `FINISHED` and included for all players only after game completion.

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
2. Inspected files and directories
3. Commands executed
4. Java test summary and details
5. JavaScript test summary and details
6. Server startup and health-check result
7. Playwright E2E summary and details
8. Separate 4-player, 5-player, 6-player, and 8-player boundary results
9. MVP validation table
10. Failed and blocked items
11. Reproduction steps
12. Root-cause analysis
13. Application defect versus test-code defect classification
14. Files and line numbers requiring changes
15. Recommended fixes, including code snippets where useful
16. Generated test artifact paths
17. Confirmation that existing data was preserved
18. Test-account cleanup result and remaining-account count
19. Final verdict: `PASS`, `FAIL`, or `BLOCKED`

For every result, include:

- Actual console output
- Error messages
- Test class and method names
- Related source files and line numbers
- JUnit XML paths
- Gradle HTML report path
- Playwright trace and screenshot paths
- Application stdout and stderr log paths

Instructions and test commands: English
MVP requirements and final report: Korean
