# MAFIAGAME Reusable QA Test Execution Script

## Role

You are the QA engineer for the MAFIAGAME project.

Execute the project tests and validate the implementation against the MVP requirements. Produce a detailed QA report based only on actual test output, source code, and test evidence.

## Run Configuration

Change only the values in this section before each run. Keep the rest of this document unchanged so that it can be reused for future QA runs.

```powershell
$projectPath = 'C:\workspace\mafiaweb'
$e2eEnabled = $true
$e2eProfile = $null
$playerCounts = $null
$uiCapacity = $null
$onlineBaseline = $null
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

### Interactive profile selection (required for every request that omits a profile)

Leave `$e2eProfile = $null` to make the QA run ask for a scenario before any
test, build, or server command is started. The prompt is intentionally blocking:
the script does not continue until a valid number is entered and confirmed. Run
the configuration block and this selection block in the same PowerShell session.

When a user asks to run QA without naming a profile, present these choices and
wait for an explicit selection every time. This rule still applies when a QA run
was completed, failed, blocked, or cancelled earlier in the same conversation or
when the previous run used the same profile. Do not reuse the previous profile,
assume Smoke, start preflight, build the application, start a server, or run any
test before the user selects a profile for the new run.
The times below are estimates for a warm local environment with one worker; a
database, Gradle cache, server startup, or browser delay can make a run longer.

```powershell
if ([string]::IsNullOrWhiteSpace($e2eProfile)) {
    Write-Host ''
    Write-Host 'Select the QA scenario to run:' -ForegroundColor Cyan
    Write-Host '  1) Smoke      - Java/JS tests, one 4-player core flow, and one room-layout/profile UI flow.'
    Write-Host '                    Checks the 300px game area, equal columns, user statistics, and rating-derived level.'
    Write-Host '                    Uses short server phases; skips replay, resilience, and chat-scroll.'
    Write-Host '                    Estimated time: about 5-10 minutes; best for a quick daily check.'
    Write-Host '  2) Regression - 4/6/8-player core flows, replay for 4 players, room-layout/profile, and chat-scroll.'
    Write-Host '                    Checks the 300px game area, equal columns, user statistics, and rating-derived level.'
    Write-Host '                    Uses short server phases and 30 browser messages; skips 6-player resilience.'
    Write-Host '                    Estimated time: about 15-25 minutes; recommended before a normal merge.'
    Write-Host '  3) Full       - 4/5/6/7/8-player flows, replay for every count, resilience/deadline cases,'
    Write-Host '                    room-layout/profile checks, 210-message chat-scroll, production timing, and all evidence.'
    Write-Host '                    Estimated time: 60 minutes or more; use for release or timing validation.'
    Write-Host '  4) DuckDNS    - systemd/updater contract checks and a mocked update; no database or game server.'
    Write-Host '                    Live DNS and external access are not part of this profile.'
    Write-Host '                    Estimated time: about 1 minute; updater runtime checks require POSIX Bash.'
    Write-Host ''
    Write-Host 'No default profile is selected. Enter 1, 2, 3, or 4 to continue.' -ForegroundColor Yellow

    do {
        $profileChoice = (Read-Host 'Enter 1, 2, 3, or 4').Trim()
    } while ($profileChoice -notin @('1', '2', '3', '4'))

    $e2eProfile = @{
        '1' = 'smoke'
        '2' = 'regression'
        '3' = 'full'
        '4' = 'duckdns'
    }[$profileChoice]
}

$profileDefaults = @{
    smoke = @{ playerCounts = '4'; uiCapacity = 5; phaseProfile = 'short' }
    regression = @{ playerCounts = '4,6,8'; uiCapacity = 5; phaseProfile = 'short' }
    full = @{ playerCounts = '4,5,6,7,8'; uiCapacity = 8; phaseProfile = 'production' }
}

if ($e2eProfile -eq 'duckdns') {
    $e2eEnabled = $false
    $playerCounts = $null
    $uiCapacity = $null
    $phaseProfile = $null
    Write-Host 'Selected QA profile: duckdns' -ForegroundColor Green
    Write-Host 'Scope: isolated DuckDNS tests only; no MariaDB, Gradle, game server, or Playwright.'
} else {
    if (-not $profileDefaults.ContainsKey($e2eProfile)) {
        throw "Unsupported QA profile: $e2eProfile. Use smoke, regression, full, or duckdns."
    }

    if ([string]::IsNullOrWhiteSpace($playerCounts)) {
        $playerCounts = $profileDefaults[$e2eProfile].playerCounts
    }
    if ($null -eq $uiCapacity) {
        $uiCapacity = $profileDefaults[$e2eProfile].uiCapacity
    }
    $phaseProfile = $profileDefaults[$e2eProfile].phaseProfile

    Write-Host "Selected QA profile: $e2eProfile" -ForegroundColor Green
    Write-Host "Player counts: $playerCounts; UI capacity: $uiCapacity; server phase profile: $phaseProfile"
}
if ((Read-Host 'Start this QA scenario now? Enter Y to continue') -notmatch '(?i)^y$') {
    throw 'QA run cancelled before execution.'
}
```

Configuration rules:

- Set `$e2eEnabled` to `$true` or `$false` before execution. Profile 4 sets it to `$false` automatically.
- If `$e2eEnabled = $false`, skip all Playwright commands and report E2E as `NOT RUN`.
- `$e2eProfile` is `smoke`, `regression`, or `full` for game QA; `duckdns` selects the standalone DuckDNS profile. Leaving it blank invokes the blocking selection prompt above.
- When `$e2eProfile` is `duckdns`, run only the DuckDNS-only section below. Do not run the shared MariaDB, Gradle, server, Playwright, or account-cleanup sections.
- The Playwright configuration also rejects a missing `E2E_PROFILE`; running Playwright directly is not a way to skip profile selection.
- Reset `$e2eProfile` to `$null` for every new QA request unless the user explicitly named the profile in that request; never carry a profile forward from an earlier QA run.
- A previous PASS, FAIL, BLOCKED, or cancelled QA result does not satisfy profile selection for the next request.
- Smoke runs `PLAYER_COUNTS=4`, skips replay and the two six-player resilience cases, and skips chat-scroll.
- Regression runs `PLAYER_COUNTS=4,6,8`, replays only the 4-player room, and runs chat-scroll with 30 messages.
- Full runs `PLAYER_COUNTS=4,5,6,7,8`, replays every room, includes both six-player resilience cases, and preserves production phase timing.
- Use the profile defaults for `$playerCounts` and `$uiCapacity` unless a narrower explicit override is required for a targeted investigation. `PLAYER_COUNTS` may contain only counts in the selected profile; a complete Full QA run requires all five counts.
- Leave `$onlineBaseline = $null` unless the existing online-user count is known and intentionally fixed. The first core scenario measures the baseline before its other test accounts sign in; set an explicit non-negative integer only when a shared-server count is externally verified.
- Smoke and Regression set `MAFIAGAME_PHASE_PROFILE=short` (3 seconds per non-terminal phase). Full sets `MAFIAGAME_PHASE_PROFILE=production` and is the only profile that judges 15/60/20/20/20/35-second timings.
- DuckDNS runs the isolated `npm.cmd run qa:duckdns` command. It verifies local systemd/updater contracts and runs a mocked updater integration only when POSIX Bash is available; it never performs a live DuckDNS update or DNS lookup.
- Playwright uses `trace: retain-on-failure` for Smoke/Regression and `trace: on` for Full. Core and UI invocations use separate `core/` and `ui/` output folders under `output/test_output/YYYY-MM-DD/playwright-<E2E_RUN_ID>/` so the UI run cannot erase core traces.
- Use a new `E2E_RUN_ID` for every execution.
- Use the same `E2E_RUN_ID` for the core and UI regression suites so their accounts and rooms can be cleaned up together.
- Keep `$workerCount = 1` for the complete run. The suite shares a server, database, and lobby online-player baseline; running workers in parallel can mix those states.
- Always report the requested and effective worker counts.
- Do not inspect or assert font sizes. Chat UI checks are limited to functionality, overflow/scroll behavior, and whether visible channel labels are clipped.
- Frontend design checks must use the actual game-room detail route `/rooms/{roomId}` and its server-rendered template. The lobby route `/rooms` is not sufficient evidence for room UI changes.
- For the current room UI, verify the fixed `게임 목록으로` button remains visible in both normal and `body.night-phase` backgrounds without switching its own colors by phase.
- Verify `PUBLIC`, `MAFIA`, and `DEAD` message bubbles have distinct channel classes and visible visual treatment. Verify that the page-only `NIGHT` background is gray, transitions through `background-color`, and returns to the normal light background after `DAY_DISCUSSION` or `FINISHED`.
- Verify the room host sees `방 설정` after the `친구 초대` and help buttons, while non-host participants do not see the control. Verify the settings modal exposes only 4–8 player capacities, password enable/change/remove controls, and preserves host access after a reload. After each successful save, the modal stays open and shows `방 설정이 저장되었습니다.` in its lower-left footer.
- Verify a capacity below the live participant count is disabled in the browser, shows the capacity warning, disables save, and is rejected again by the server if a stale or forged request is submitted. Verify a presence update that changes capacity or lock state reaches every participant screen.
- Verify `FINISHED` forces the selector to `PUBLIC`, hides and disables `MAFIA` and `DEAD`, and routes a public message sent by a dead participant to the public room topic.
- Verify police results render `마피아팀`/`시민팀` as the faction first, while Spy/Medium exact-role results render the role separately as `직업: <역할>`.
- Save actual game-room screenshots for normal, night, and restored states. Save a short browser video covering normal → night → normal; do not replace server-rendered evidence with an AI mockup or an isolated CSS/DOM preview.
- The expected opening phase order is `ROLE_ASSIGNMENT(15s) → NIGHT(35s) → DAY_DISCUSSION(60s)`. Role confirmation may end `ROLE_ASSIGNMENT` early. Subsequent cycles continue `DAY_DISCUSSION(60s) → NOMINATION_VOTE(20s) → FINAL_DEFENSE(20s, when a unique nominee exists) → EXECUTION_VOTE(20s) → NIGHT(35s) → DAY_DISCUSSION(60s)`.
- Replace `$projectPath` and `$baseUrl` if the project is moved or the server configuration changes.
- Reserve `$serverPort` for a fresh QA server built from the current workspace. If that port is already occupied, choose another unused port and update `$baseUrl` before proceeding. Never assume an existing server contains the current source.

### Evidence policy by profile

Smoke, Regression, and Full keep console output, assertions, JUnit/Gradle reports, and the dated
`output/test_output/YYYY-MM-DD/<test-name>/` layout. The expensive browser evidence
is profile-aware:

- Smoke keeps Playwright traces only on failure and does not record routine browser videos or screenshots.
- Regression keeps traces only on failure and captures screenshots for the UI/core regression cases, but does not record routine videos.
- Full keeps traces, screenshots, and videos for every executed browser scenario and is the required profile for release evidence and production timing.
- DuckDNS stores its Node test output and Korean report in its own run-specific directory; it creates no Playwright artifacts.
- If a required artifact for the selected profile is missing, report that affected item as `BLOCKED`; do not require Full-only video evidence from Smoke.
- Java/JavaScript console output and reports remain mandatory for Smoke, Regression, and Full. DuckDNS-only captures the isolated Node test output and report; it does not run Java, Gradle, or browser checks. A desktop recording is optional for Smoke/Regression and required only when the release QA process explicitly requests it.
- Store screenshots, videos, traces, logs, and other test evidence in `output/test_output/YYYY-MM-DD/<test-name>/`, using a run-specific test name keyed by `E2E_RUN_ID`; never overwrite evidence from an earlier run.
- Record the exact generated paths in the QA report. Screenshots and videos supplement, but never replace, console output, logs, JUnit XML, Gradle reports, Playwright traces, and assertions.
- Ensure credentials, tokens, personal data, and unrelated desktop content are not visible in captured evidence.
- Use `$dbHost` and `$dbPort` from the application datasource configuration. If MariaDB is not reachable, stop before starting the application and mark the run `BLOCKED`/`NOT RUN`; do not install or start a database service automatically.
- Save the final QA report under `$projectPath\$qaReportDirectory`.
- Use a unique report filename containing the execution date and `E2E_RUN_ID` for Smoke, Regression, and Full. DuckDNS profile 4 uses its qa-duckdns timestamp run identifier instead.
- Do not modify source code unless `$sourceModificationAllowed = $true` in a separate request.

## DuckDNS-only profile

Run this branch only when the selected profile is duckdns. It ends before the normal environment preflight. The qa:duckdns npm script invokes only test/js/duckdns.test.js to check the local DuckDNS timer/service/updater contract and mocked updater behavior. It does not need MariaDB, Gradle, a running MAFIAGAME server, test accounts, or Playwright, and it does not use a real DuckDNS token or send a live provider request.

Run this block instead of sections 0–3.5 and the game MVP checks:

```powershell
if ($e2eProfile -ne 'duckdns') {
    throw 'Select the DuckDNS-only QA profile before running this section.'
}

$duckdnsDate = Get-Date -Format 'yyyy-MM-dd'
$duckdnsRunId = 'qa-duckdns-' + (Get-Date -Format 'yyyyMMdd-HHmmss-fff')
$duckdnsArtifactDirectory = Join-Path $projectPath ("output\test_output\{0}\{1}" -f $duckdnsDate, $duckdnsRunId)
$duckdnsReportDirectory = Join-Path $projectPath $qaReportDirectory
$duckdnsLogPath = Join-Path $duckdnsArtifactDirectory 'duckdns-test.log'
$duckdnsReportPath = Join-Path $duckdnsReportDirectory ("MAFIAGAME_QA_REPORT_{0}_{1}.md" -f $duckdnsDate, $duckdnsRunId)

if ((Test-Path -LiteralPath $duckdnsArtifactDirectory) -or (Test-Path -LiteralPath $duckdnsReportPath)) {
    throw "DuckDNS QA output already exists; refusing to overwrite: $duckdnsRunId"
}
New-Item -ItemType Directory -Force -Path $duckdnsArtifactDirectory | Out-Null
New-Item -ItemType Directory -Force -Path $duckdnsReportDirectory | Out-Null

$duckdnsTestExitCode = $null
$duckdnsSkipRuntime = $false
$duckdnsTestOutput = ''
$duckdnsBlockReason = ''
$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
$npmCommand = Get-Command npm.cmd -ErrorAction SilentlyContinue
if (-not $nodeCommand -or -not $npmCommand) {
    $duckdnsBlockReason = 'Node.js 또는 npm.cmd를 찾을 수 없어 테스트를 실행하지 못했습니다.'
    Set-Content -LiteralPath $duckdnsLogPath -Encoding utf8 -Value $duckdnsBlockReason
} else {
    $outputLines = & npm.cmd run qa:duckdns 2>&1
    $duckdnsTestExitCode = $LASTEXITCODE
    $outputLines | Tee-Object -FilePath $duckdnsLogPath
    $duckdnsTestOutput = Get-Content -LiteralPath $duckdnsLogPath -Raw -Encoding utf8
    $duckdnsSkipRuntime = $duckdnsTestOutput -match 'Updater integration requires a POSIX shell'
}

if ($duckdnsBlockReason) {
    $duckdnsFinalStatus = 'BLOCKED'
    $duckdnsSuiteStatus = 'NOT RUN'
    $duckdnsRuntimeStatus = 'NOT RUN'
} elseif ($duckdnsTestExitCode -ne 0) {
    $duckdnsFinalStatus = 'FAIL'
    $duckdnsSuiteStatus = 'FAIL'
    $duckdnsRuntimeStatus = if ($duckdnsSkipRuntime) { 'BLOCKED' } else { 'FAIL' }
} elseif ($duckdnsSkipRuntime) {
    $duckdnsFinalStatus = 'BLOCKED'
    $duckdnsSuiteStatus = 'PASS'
    $duckdnsRuntimeStatus = 'BLOCKED'
    $duckdnsBlockReason = '이 환경에 POSIX Bash가 없어 모의 updater 실행이 건너뛰어졌습니다.'
} else {
    $duckdnsFinalStatus = 'PASS'
    $duckdnsSuiteStatus = 'PASS'
    $duckdnsRuntimeStatus = 'PASS'
}

$duckdnsReport = @"
# MAFIAGAME DuckDNS QA 보고서

- 실행 날짜: $duckdnsDate
- 실행 ID: $duckdnsRunId
- 프로필: DuckDNS-only
- 최종 판정: $duckdnsFinalStatus
- 실행 명령: npm.cmd run qa:duckdns
- 게임 서버/E2E 검사: NOT RUN (프로필 4는 DuckDNS 전용)
- 게임 MVP 항목 1–54: NOT RUN (DuckDNS-only 범위에 포함되지 않음)
- MVP 항목 55 DuckDNS 검증: $duckdnsFinalStatus
- DuckDNS 설정 및 updater 테스트 모음: $duckdnsSuiteStatus
- 모의 updater 성공·거부 응답 및 토큰 비노출 검사: $duckdnsRuntimeStatus
- 실제 DuckDNS 갱신, DNS A 레코드, 외부 접속 검사: NOT RUN
- 차단 또는 실패 사유: $(if ($duckdnsBlockReason) { $duckdnsBlockReason } else { '해당 없음' })
- 테스트 로그: $duckdnsLogPath

이 프로필은 로컬 설정과 모의 updater 동작만 확인합니다. 실제 DuckDNS 계정이나 운영 토큰을 읽거나 사용하지 않으며, MariaDB·Gradle·MAFIAGAME 서버·Playwright를 실행하지 않았습니다. 실제 DNS 및 외부 접속 확인은 별도의 격리된 QA 도메인과 외부 증거가 필요한 작업입니다.
"@
Set-Content -LiteralPath $duckdnsReportPath -Encoding utf8 -Value $duckdnsReport
$duckdnsColor = if ($duckdnsFinalStatus -eq 'PASS') { 'Green' } elseif ($duckdnsFinalStatus -eq 'FAIL') { 'Red' } else { 'Yellow' }
Write-Host "DuckDNS QA result: $duckdnsFinalStatus" -ForegroundColor $duckdnsColor
Write-Host "QA report: $duckdnsReportPath"
Write-Host "Test log: $duckdnsLogPath"

if ($duckdnsFinalStatus -ne 'PASS') {
    throw "DuckDNS QA finished with $duckdnsFinalStatus. Review the Korean QA report and test log."
}
```

If Node.js or npm.cmd is unavailable, record BLOCKED without installing dependencies. If the static contract test passes but the mocked updater subtest is skipped because POSIX Bash is unavailable, the overall profile is BLOCKED and the runtime result is not PASS. Live DNS and external access are always NOT RUN in this isolated profile.

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

if ($e2eEnabled -and $e2eProfile -eq 'full' -and $playerCounts -ne '4,5,6,7,8') {
    throw "A complete QA run requires PLAYER_COUNTS=4,5,6,7,8; current value is $playerCounts."
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

$playwrightWorkerAvailable = $false
$playwrightBlockReason = $null
if ($e2eEnabled) {
    $workerProbePath = Join-Path $env:TEMP ("mafiagame-qa-worker-probe-{0}.js" -f [guid]::NewGuid().ToString('N'))
    $workerProbeLauncher = @'
const { fork } = require('node:child_process');
try {
  const child = fork(process.argv[1], [], { silent: true, execArgv: [] });
  const timeout = setTimeout(() => {
    console.error('TIMEOUT: forked QA probe did not exit within 5 seconds.');
    child.kill();
    process.exit(25);
  }, 5000);
  child.once('error', error => {
    clearTimeout(timeout);
    console.error(`${error.code || 'ERROR'}: ${error.message}`);
    process.exit(error.code === 'EPERM' ? 23 : 24);
  });
  child.once('exit', code => {
    clearTimeout(timeout);
    process.exit(code === 0 ? 0 : 24);
  });
} catch (error) {
  console.error(`${error.code || 'ERROR'}: ${error.message}`);
  process.exit(error.code === 'EPERM' ? 23 : 24);
}
'@
    $workerProbeExitCode = $null
    $workerProbeOutput = @()
    try {
        Set-Content -LiteralPath $workerProbePath -Encoding ascii -Value 'process.exit(0);'
        $workerProbeOutput = & node -e $workerProbeLauncher $workerProbePath 2>&1
        $workerProbeExitCode = $LASTEXITCODE
    } catch {
        $workerProbeOutput = @($_.Exception.Message)
        $workerProbeExitCode = 24
    } finally {
        Remove-Item -LiteralPath $workerProbePath -Force -ErrorAction SilentlyContinue
    }

    if ($workerProbeExitCode -eq 0) {
        $playwrightWorkerAvailable = $true
    } else {
        $playwrightBlockReason = "Node child_process.fork preflight failed (exit $workerProbeExitCode): $($workerProbeOutput -join ' ')"
        Write-Warning "Playwright E2E will be BLOCKED before server startup. Java and JavaScript suites may continue. $playwrightBlockReason"
    }
}
```

### `EPERM` remediation

If the Node worker probe returns exit code `23` with `EPERM`, first check whether
the current execution boundary blocks Node from creating child processes. Rerun
the same probe in an execution context that permits Node child processes; in
Codex, use `require_escalated` for the QA command. Continue the selected E2E
lifecycle in that context only if the retry returns exit code `0`. If permission
is not granted or the retry still fails, keep E2E `BLOCKED` and do not start the
server. Record both probe results. Do not remove the gate or reduce the Playwright
worker count: `--workers=1` still creates a worker process and does not bypass
`EPERM`.

The project currently uses `jdbc:mariadb://localhost:23306/mafiaweb`. A failed
database probe is an environment `BLOCKED` result, not an application `PASS`, and
the script must not start MariaDB or install a missing client/service.

## 1. Java Tests

The same complete Gradle Java test suite runs for Smoke, Regression, and Full; the selected profile changes the Playwright E2E scope, timing, and evidence policy, not the Java test set. The restart recovery, Mafia parity, anonymous lobby throttling, and game-start ordering/rollback checks listed below are required in every profile. Do not mark them `NOT RUN` just because an E2E case is skipped by Smoke or Regression; if the Java suite cannot execute or complete, report the affected checks as `BLOCKED` or `NOT RUN` based on the actual output.

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
- Restart recovery: `MapperIntegrationTest.interruptedGameRecoveryResetsOnlyRoomsThatArePlaying` and `RoomPresenceServiceTest.resetsInterruptedPlayingRoomsWhenApplicationBecomesReady`; report that persisted `PLAYING` rooms reset while `WAITING` rooms remain unchanged
- Mafia parity termination: `RoomGameServiceTest.endsOneMafiaOneDoctorGameAtParityBeforeTheNightCanRepeat`
- Updated role table and opening phase: `RoomGameServiceTest.assignsExactRoleCountsAtTheSupportedPlayerBoundaries`, `RoomGameServiceTest.confirmsRolesPrivatelyAndStartsTheFirstNightWhenEveryLivingPlayerConfirms`, and `RoomGameServiceTest.startsTheFirstNightWhenTheRoleConfirmationTimerExpiresInRealTime`; the Playwright core case also observes `ROLE_ASSIGNMENT → NIGHT → DAY_DISCUSSION`.
- Spy parity: `RoomGameRulesTest.uncontactedLivingSpyDoesNotTurnMafiaMinorityIntoParityVictory`, `RoomGameRulesTest.contactedLivingSpyCountsTowardMafiaParityVictory`, and `RoomGameServiceTest.countsOnlyAContactedSpyTowardTheMafiaParityThreshold`.
- Settings-save feedback: `RoomControllerTest.savingRoomSettingsFlashesTheSuccessMessageForTheModal` and `test/e2e/room-layout.spec.js` verify modal feedback after password set, change, and removal.
- Reconnect grace: `RoomPresenceServiceTest.cancelsGameDepartureWhenThePlayerReconnectsWithinTheGracePeriod`, `RoomGameServiceTest.removesAQueuedNightActionWhenAPlayerLeavesAfterReconnectGrace`, and the Full-profile browser deadline/reconnect scenario cover reconnect, expiry, and pending-action handling.
- Completed-game statistics: `RoomGameServiceTest.recordsOneOutcomeForEveryParticipantWhenTheGameFinishes`, `RoomGameServiceTest.doesNotRecordStatisticsBeforeACompletedGame`, `MapperIntegrationTest.completedGameUpdatesEachAccountOnceEvenWhenTheResultIsReplayed`, and the profile E2E verify first completion and replay.
- Anonymous lobby access and bounded count broadcasts: `WebSocketAuthorizationInterceptorTest.allowsAnonymousLobbyPresenceRequests`, `RoomPresenceServiceTest.throttlesRepeatedLobbyCountRequestsFromOneSession`, and `RoomPresenceServiceTest.coalescesLobbyCountRequestsAcrossSessionsAtTheGlobalLimit`
- Game-start delegation, ordering, and rollback: `ControllerDelegationTest.presenceControllerDelegatesGameStartToPresenceService`, `RoomPresenceServiceTest.usesTheCurrentFivePlayersWhenTheSixthLeavesBeforeStart`, `RoomPresenceServiceTest.restoresWaitingStatusWhenCreatingTheGameInstanceFails`, and `RoomGameServiceTest.removesPartiallyStartedGameWhenPublishingTheInitialStateFails`
- Relevant console output
- JUnit XML and Gradle HTML report paths

## 2. JavaScript Tests

Run:

```powershell
node --test --test-isolation=none `
    test/js/stomp-client.test.js `
    test/js/room-list.test.js `
    test/js/chat.test.js `
    test/js/e2e-profile.test.js
```

This is the same four-file test set declared by `package.json`'s `test:js` script and used by Smoke, Regression, and Full. DuckDNS is excluded from these three profiles and runs only through the standalone DuckDNS profile 4.
`--test-isolation=none` keeps the Node test runner in one process, which is required
in restricted Windows environments where the default per-file child-process spawn can
return `EPERM`. Do not run `npm install` or download test browsers as part of QA.

Verify and report:

- Total JavaScript test count
- Passed and failed test counts
- QA profile defaults, scenario/replay scope, timing/evidence flags, and rejection of invalid or out-of-profile player counts
- STOMP communication
- Lobby and participant synchronization
- Room settings visibility, modal controls, capacity validation, password protection, host reconnect, and live capacity/lock synchronization
- Room-layout/profile UI: removed settings strip, friend-invite/help/room-settings ordering, 300px waiting and started game panels, equal desktop columns, mobile stacking, `user_stats` profile totals, and the default rating-derived `Lv. 1`
- Rating-derived level boundaries and default rating fallback in the shared Java test suite
- Patch-note modal opens on the first lobby visit and exposes the `오늘 하루 그만보기` checkbox and `닫기` button
- Patch-note modal exposes a `상세보기` button whose archive displays the README patch notes in descending version order: `0.3.0-alpha`, `0.2.0-alpha`, `0.1.1-alpha`, `0.1.0-alpha`
- Same-day patch-note suppression works only when the stored patch-note content is unchanged
- Updating the patch-note content invalidates the previous hide preference and requires a new checkbox selection
- Ready state handling
- Game phase UI rendering
- Role-confirmation phase UI and confirmation request
- Final-defense phase UI and nominee-only public chat permission
- Private role rendering
- Voting UI
- Police investigation result rendering
- Faction-first investigation rendering: `마피아팀`/`시민팀` labels and separate exact-role output for Spy/Medium
- Game result rendering
- Participant death-state rendering: when a game state marks a player as `alive: false`, the matching card receives `.participant-dead`, shows `사망`, and living cards remain unchanged
- Channel rendering: incoming public, mafia, and dead messages receive `.channel-public`, `.channel-mafia`, and `.channel-dead` respectively
- System message rendering: incoming `SYSTEM` messages receive `.system` and `.channel-system`, display the `게임 안내` sender, and remain text-only
- Phase guidance rendering: the room chat displays one public system message for role confirmation, day discussion, nomination, final defense, execution vote, night, and game completion
- Night background state: `NIGHT` adds `.night-phase`; `DAY_DISCUSSION` and `FINISHED` remove it
- Finished-game channel reset: only `PUBLIC` remains selectable and dead-player public messages stay on the public topic
- Reconnection handling

The active-game reload check is profile-aware: Full requires at least 20 seconds
remaining in `NIGHT` and verifies that reconnect restores the same phase. Smoke
and Regression use three-second phases, so they verify WebSocket/game-panel
restoration without requiring the phase to remain unchanged while the page
reloads. All profiles then verify the next day and its investigation results.

Report the standalone JavaScript result separately from the Gradle Java result. If the
direct Node command is unavailable, classify JavaScript as `BLOCKED`; do not silently
replace it with source inspection.

## 3. Playwright E2E Tests

The environment preflight above checks the same `child_process.fork` capability that
Playwright needs for its worker runner. Smoke, Regression, and Full all use this
shared gate. Run sections 3.1–3.5 only when both `$e2eEnabled` and
`$playwrightWorkerAvailable` are `$true`. When `$e2eEnabled` is `$false`, mark E2E
items `NOT RUN`. When forking is unavailable, mark the overall E2E result `BLOCKED`,
the selected core/UI cases `NOT RUN`, and server startup/account cleanup `NOT RUN`;
include `$playwrightBlockReason` in the report and do not create a QA server or
attempt Playwright discovery. Continue the Java and standard JavaScript suites.

Keep the entire shared server lifecycle inside the same conditional branch for all
three game profiles. The preflight must run before section 1, and its branch must be
checked before the `Start-Process` block in section 3.1.

### 3.1 Prepare the Test Environment

Use the existing project path and create a dated, run-specific test result directory if necessary:

```powershell
$env:E2E_RUN_ID = 'qa-' + (Get-Date -Format 'yyyyMMdd-HHmmss')
$testOutputDate = Get-Date -Format 'yyyy-MM-dd'
$testResultPath = Join-Path $projectPath (Join-Path 'output\test_output' (Join-Path $testOutputDate ('qa-run-' + $env:E2E_RUN_ID)))
New-Item -ItemType Directory -Force -Path $testResultPath | Out-Null

function Get-QAListeningProcessIds {
    param([Parameter(Mandatory)][int]$Port)

    $netstatOutput = & netstat.exe -ano -p tcp
    if ($LASTEXITCODE -ne 0) {
        throw "Could not inspect TCP listeners for QA port $Port."
    }

    $portPattern = '^\s*TCP\s+\S+:' + [regex]::Escape([string]$Port) + '\s+\S+\s+LISTENING\s+(\d+)\s*$'
    $processIds = foreach ($line in $netstatOutput) {
        if ($line -match $portPattern) {
            [int]$Matches[1]
        }
    }
    @($processIds | Sort-Object -Unique)
}

$existingServerProcessIds = @(Get-QAListeningProcessIds -Port $serverPort)

$startedServer = $false
$appProcess = $null
$launcherStartTime = $null
$serverLaunchTime = $null
$qaApplicationProcessId = $null
$qaServerProcessId = $null
$startupStdoutPath = Join-Path $testResultPath ("bootRun.$env:E2E_RUN_ID.stdout.log")
$startupStderrPath = Join-Path $testResultPath ("bootRun.$env:E2E_RUN_ID.stderr.log")

function Get-QAStartupLogText {
    $logParts = @()
    foreach ($logPath in @($startupStdoutPath, $startupStderrPath)) {
        if (Test-Path $logPath) {
            $logParts += Get-Content -Raw -Encoding utf8 $logPath
        }
    }
    $logParts -join "`n"
}

function Get-QAApplicationProcessIdFromLog {
    $startupText = Get-QAStartupLogText
    if ($startupText -match 'Starting MafiagameApplication using .* with PID (?<pid>\d+)') {
        return [int]$Matches['pid']
    }
    $null
}

function Test-QAApplicationProcessIdentity {
    param(
        [Parameter(Mandatory)][int]$ProcessId,
        [Parameter(Mandatory)][datetime]$LaunchTime
    )

    $process = Get-Process -Id $ProcessId -ErrorAction SilentlyContinue
    if ($null -eq $process -or $process.ProcessName -notin @('java', 'javaw')) {
        return $false
    }
    try {
        return $process.StartTime -ge $LaunchTime.AddSeconds(-2)
    } catch {
        return $false
    }
}
```

Smoke, Regression, and Full all use this same server lifecycle; profile-specific
branches may select test scope and phase timing only. Keep process startup, health
checking, account cleanup, and this finalizer in one outer `try/finally` for every
profile. In particular, the `try` must begin before `Start-Process`, and
`$startedServer` must be set immediately after it returns, before log inspection,
health checks, or any other operation that can throw.

| Profile | Profile-specific settings | Server startup/finalizer |
|---|---|---|
| Smoke | 4-player core, capacity 5, short phases | Shared sections 3.1–3.4 |
| Regression | 4/6/8-player core, capacity 5, short phases | Shared sections 3.1–3.4 |
| Full | 4/5/6/7/8-player core, capacity 8, production phases | Shared sections 3.1–3.4 |

Start a fresh application instance built from the current workspace. Do not stop or
reuse the user's existing server. This block is the first body of the shared outer
`try`; do not execute it outside the `try/finally` lifecycle:

```powershell
if ($existingServerProcessIds.Count -gt 0) {
    throw "QA port $serverPort is already in use by PID(s) $($existingServerProcessIds -join ', '). Choose an unused serverPort and matching baseUrl."
}
$env:GRADLE_USER_HOME = "$projectPath\.gradle-test"
$env:SERVER_PORT = "$serverPort"
$env:E2E_PROFILE = $e2eProfile
$env:MAFIAGAME_PHASE_PROFILE = $phaseProfile

$serverLaunchTime = Get-Date
$appProcess = Start-Process `
    -FilePath 'cmd.exe' `
    -ArgumentList '/c .\gradlew.bat bootRun --no-daemon' `
    -WorkingDirectory $projectPath `
    -WindowStyle Hidden `
    -RedirectStandardOutput $startupStdoutPath `
    -RedirectStandardError $startupStderrPath `
    -PassThru

$startedServer = $true
$launcherStartTime = $appProcess.StartTime
```

### 3.2 Server Health Check

Wait up to 60 seconds. The HTTP endpoint is checked only after the newly started
process reports that the current application finished starting. This prevents an
old process already serving the same port from being mistaken for this QA run.
Probe immediately after the startup marker, then retry once per second:

```powershell
$response = $null
$startupReady = $false
$deadline = (Get-Date).AddSeconds(60)

while ((Get-Date) -lt $deadline -and $response -ne 200) {
    $startupText = Get-QAStartupLogText

    if ($startupText -match 'APPLICATION FAILED TO START|Web server failed to start|Port .* was already in use') {
        throw "The QA application failed during startup. Inspect $startupStdoutPath and $startupStderrPath."
    }

    $loggedApplicationProcessId = Get-QAApplicationProcessIdFromLog
    if ($null -ne $loggedApplicationProcessId) {
        if ($null -ne $qaApplicationProcessId -and $qaApplicationProcessId -ne $loggedApplicationProcessId) {
            throw "The QA startup logs reported multiple application PIDs ($qaApplicationProcessId, $loggedApplicationProcessId)."
        }
        $qaApplicationProcessId = $loggedApplicationProcessId
        if (-not (Test-QAApplicationProcessIdentity -ProcessId $qaApplicationProcessId -LaunchTime $serverLaunchTime)) {
            throw "The logged QA Java process $qaApplicationProcessId is no longer present or its identity cannot be verified."
        }
    } elseif ($appProcess.HasExited) {
        throw "The Gradle launcher exited before logging the QA application PID. Inspect $startupStdoutPath and $startupStderrPath."
    }

    $startupReady = $startupText -match 'Started MafiagameApplication'

    if ($startupReady) {
        if ($null -eq $qaApplicationProcessId) {
            throw 'The application startup marker appeared without the earlier application PID marker.'
        }
        $listenerProcessIds = @(Get-QAListeningProcessIds -Port $serverPort)
        if ($listenerProcessIds.Count -gt 1) {
            throw "Could not uniquely identify the new QA server on port $serverPort; listener PIDs: $($listenerProcessIds -join ', ')."
        }
        if ($listenerProcessIds.Count -eq 1) {
            $qaServerProcessId = [int]$listenerProcessIds[0]
            if ($qaServerProcessId -ne $qaApplicationProcessId) {
                throw "Port $serverPort is owned by PID $qaServerProcessId, not the QA application PID $qaApplicationProcessId. Leave the unverified listener untouched."
            }
        }

        try {
            $response = (Invoke-WebRequest -Uri "$baseUrl/login" -UseBasicParsing -TimeoutSec 3).StatusCode
        } catch {
            $response = $null
        }
    }

    if ($response -ne 200) {
        Start-Sleep -Seconds 1
    }
}

if (-not $startupReady -or $response -ne 200 -or $null -eq $qaApplicationProcessId -or $null -eq $qaServerProcessId) {
    throw 'The newly started application did not report a healthy startup within 60 seconds.'
}
```

Record the result:

- HTTP 200: `PASS`
- Missing `Started MafiagameApplication`, an exited process, a startup error, no response, timeout, or other status: `BLOCKED`; do not run Playwright against any process that was already listening on the port.

### 3.3 Run Playwright

Use a unique execution ID for all test accounts and room titles:

```powershell
$env:PLAYER_COUNTS = $playerCounts
$env:BASE_URL = $baseUrl
$env:E2E_PROFILE = $e2eProfile
$env:E2E_CAPACITY = [string]$uiCapacity
if ($null -ne $onlineBaseline) {
    $env:ONLINE_BASELINE = [string]$onlineBaseline
} else {
    Remove-Item Env:ONLINE_BASELINE -ErrorAction SilentlyContinue
}
```

The suite uses one worker so scenarios run in order. Individual scenario failures
must not cause the remaining configured scenarios to be skipped. Keep retries disabled.

Smoke and Regression do not run a separate `--list` pass because the selected profile
already defines the exact scope and the extra discovery would repeat Playwright startup.
Full QA performs one combined discovery pass for core and UI files before creating
accounts. This keeps the release gate while avoiding two identical discovery launches:

```powershell
if ($e2eProfile -eq 'full') {
    $env:PLAYWRIGHT_OUTPUT_STAGE = 'discovery'
    $e2eList = @(
    npm.cmd exec -- playwright test `
        test/e2e/mafia-mvp.spec.js `
        test/e2e/chat-scroll.spec.js `
        test/e2e/room-layout.spec.js `
        --list --workers=$workerCount 2>&1
    )
if ($LASTEXITCODE -ne 0) {
    throw 'Playwright test discovery failed; do not start the full E2E run.'
}

$requiredScenarioFragments = @(
    'MVP 4', 'MVP 5', 'MVP 6', 'MVP 7', 'MVP 8',
    'closing a waiting-room tab changes six players to the five-player role threshold',
    'browser deadline, reconnect grace, and expired night action',
    'role slot is visible before game and chat scrolls without growing the page',
    "waiting and started room layout ($uiCapacity players)"
)
foreach ($scenario in $requiredScenarioFragments) {
    if (-not ($e2eList -match [regex]::Escape($scenario))) {
        throw "Required Playwright scenario was not discovered: $scenario"
    }
}

} else {
    Write-Host "Skipping redundant Playwright discovery for $e2eProfile profile."
}
```

After discovery succeeds, run the core suite and then the UI regression suite once:

```powershell
$env:PLAYWRIGHT_OUTPUT_STAGE = 'core'
npm.cmd run test:e2e -- --workers=$workerCount --retries=0 --reporter=list
$e2eExitCode = $LASTEXITCODE

$env:PLAYWRIGHT_OUTPUT_STAGE = 'ui'
if ($e2eProfile -eq 'smoke') {
    npm.cmd exec -- playwright test test/e2e/room-layout.spec.js `
        --workers=$workerCount --retries=0 --reporter=list
} else {
    npm.cmd run test:e2e:ui -- --workers=$workerCount --retries=0 --reporter=list
}
$uiE2eExitCode = $LASTEXITCODE
Remove-Item Env:E2E_CAPACITY -ErrorAction SilentlyContinue
Remove-Item Env:E2E_PROFILE -ErrorAction SilentlyContinue
Remove-Item Env:PLAYWRIGHT_OUTPUT_STAGE -ErrorAction SilentlyContinue
Remove-Item Env:MAFIAGAME_PHASE_PROFILE -ErrorAction SilentlyContinue
Remove-Item Env:ONLINE_BASELINE -ErrorAction SilentlyContinue
```

Record each core case's actual result, `$e2eExitCode`, and `$uiE2eExitCode`. A failure in one case must not
be counted as a failure in a skipped case. If any case is skipped, report it as
`NOT RUN` and investigate the execution order before claiming a complete run.

The effective inventory depends on the selected profile. Smoke has one core case and
one room-layout/profile UI case. Regression has 4/6/8 core cases, a 4-player replay,
chat-scroll, and room-layout/profile. Full has five core cases, two six-player resilience
cases, chat-scroll, and the 8-player room-layout/profile case. Each profile runs the same
300px panel, column-alignment, profile-stat, and default user-level assertions. A case outside the selected profile is intentionally
`NOT RUN`, not a failure.

If the test suite is later split into independent files, parallel workers may be
considered only after server, database, test-account, and online-player-baseline
isolation has been demonstrated.

Verify:

- MariaDB preflight passed before any application process was started
- Full: combined Playwright discovery listed five count-driven cases, both six-player resilience cases, chat-scroll, and the 8-player room-layout case
- Smoke/Regression: no redundant discovery pass was run; report the profile-derived inventory and actual executed cases
- Lobby patch-note modal appears after the lobby loads when no matching local preference exists
- The modal footer places `오늘 하루 그만보기` on the left and `닫기` on the right; closing without checking allows the modal to appear on the next visit
- Checking `오늘 하루 그만보기` suppresses the same patch-note content for the current local date
- Changing any visible patch-note text causes the modal to appear again and requires a new hide selection
- The first `NIGHT` is observed between `ROLE_ASSIGNMENT` and the first `DAY_DISCUSSION`; roles are not present in public game state
- Role confirmation is submitted once per living player; duplicate confirmations are rejected
- All confirmations cause early transition to the first `NIGHT`; otherwise the 15-second role timer advances to that night. The 35-second first night then advances to `DAY_DISCUSSION`.
- A unique nomination enters `FINAL_DEFENSE` for 20 seconds before `EXECUTION_VOTE`
- Only the nominated player can send public chat during `FINAL_DEFENSE`; other living players are rejected by the server
- A nominee departure during `FINAL_DEFENSE` skips execution and advances to `NIGHT`
- Unique account creation
- Unique room creation
- Host-only room settings button follows the friend-invite and help buttons; non-host browsers do not render it
- The room-layout UI case runs in Smoke, Regression, and Full. Verify the waiting-room settings strip is absent, the friend-invite/help/room-settings buttons appear in that order, the game-info panel is 300px tall, and the participant/game column and chat column have matching top and bottom edges. Verify the started game panel keeps the 300px height; on mobile, verify the game panel remains at least 300px tall and the chat stacks below it.
- Verify a newly registered account uses `user_stats.rating` to render `Lv. 1` in the user menu; the profile page renders `total_games`, `wins`, and `losses`. Java tests cover rating boundaries at 1,000/1,999 (level 1), 2,000/2,999 (level 2), and 3,000 (level 3), plus the default rating when a stats row is absent; the 2,000-rating case must produce level 2 even when `user.user_level` is 1. These checks run in every profile through the shared Java suite and room-layout UI case.
- Room settings modal exposes capacities 4–8 and password enable/change/remove controls; successful create/change/remove saves reopen the modal with the exact success message in its footer
- A capacity lower than the live participant count is disabled, shows a warning, and disables save; a forged/stale server request is rejected
- Room setting changes synchronize the participant count, capacity, lock indicator, and password-protected host reconnect across browsers
- 4-player minimum scenario
- 5-player second-citizen role-composition scenario
- 6-player Mafia+Spy+Soldier scenario
- 7-player two-Mafia+Soldier+Medium scenario without a Spy
- 8-player maximum scenario
- Real-time participant synchronization
- Ready synchronization
- Host-only game start permission
- Role assignment and private role display
- Exact role composition for 4, 5, 6, 7, and 8 players (service test evidence):
  `4 = MAFIA/POLICE/DOCTOR/CITIZEN`,
  `5 = MAFIA/POLICE/DOCTOR/CITIZEN/CITIZEN`,
  `6 = MAFIA/SPY/POLICE/DOCTOR/SOLDIER/CITIZEN`,
  `7 = MAFIA/MAFIA/POLICE/DOCTOR/SOLDIER/MEDIUM/CITIZEN`,
  `8 = MAFIA/MAFIA/SPY/POLICE/DOCTOR/SOLDIER/MEDIUM/CITIZEN`
- Mafia-team membership includes both `MAFIA` and `SPY`; the Spy does not submit `MAFIA_KILL`. For parity only, an uncontacted living Spy is excluded while a contacted living Spy is included.
- Spy night investigation returns the exact role privately; finding `MAFIA` reveals the Mafia roster, unlocks the Mafia channel, and sends a contact-success system message to the Spy and all living Mafia players
- Spy investigation of a non-Mafia role keeps the Mafia channel locked and never grants a kill action
- Soldier survives exactly one Mafia night attack, reveals `군인` through the public system message and game panel, then can be killed by a later Mafia attack
- Medium can use the private dead-player channel while alive and can investigate only dead targets at night; the exact role result is private
- Start rejection or disabled start state for fewer than 4 players and more than 8 players
- Role assignment, day, nomination vote, final defense, execution vote, and night transitions
- Actual `MAFIA_KILL`, `DOCTOR_PROTECT`, `POLICE_INVESTIGATE`, `SPY_INVESTIGATE`, and `MEDIUM_INVESTIGATE` submissions
- Doctor protection keeps the mafia target alive and police sees the private faction result
- Mafia parity victory with an uncontacted Spy excluded and a contacted Spy included; citizen victory after all Mafia-team roles are dead
- The first night occurs before the first day; an empty first night still resolves and publishes `DAY_DISCUSSION`
- Completed-game `total_games`, `wins`, and `losses` are persisted once per account, including after a same-room replay; incomplete games do not change totals
- Server timer synchronization
- Self-vote prevention
- Duplicate vote prevention
- Execution candidate vote prevention
- Game result rendering
- Winning faction, role, and alive/dead status rendering
- Participant death-state rendering: after execution or a night-state update, the affected participant card has the grey/red visual treatment and visible `사망` status; living participant cards do not receive the death style
- Actual game-room navigation control: `/rooms/{roomId}` shows a visible `.room-back-link` button with `/rooms` as its destination and `게임 목록으로` as its label
- Back-link contrast: the button's color, background, and border remain the same when `body.night-phase` is toggled, while the page background changes to gray and later restores to the normal light color
- Background transition: the game-room body exposes a `background-color` transition in both directions; capture normal, night, and restored screenshots and the requested transition video
- Channel bubble visual treatment: mafia bubbles use a dark gray background with a light gray border and light red text; dead bubbles combine light gray and light red background treatment with a red border
- Phase system-message flow: every actual phase transition publishes one `SYSTEM` message to the room topic; the message includes the transition result and the phase-specific Mafia-game instructions, without revealing private role or investigation data
- `PLAYING` to `WAITING` transition
- Ready reset
- Same-room replay
- State restoration after refresh or reconnection
- 4-player minimum flow and 8-player maximum flow in real browser sessions
- Full role reveal only after `FINISHED`; no role reveal on death
- `FINISHED` leaves only the public channel available, forces the selector back to `PUBLIC`, and keeps a dead participant's public message on the public topic
- Police investigation displays the faction as `마피아팀` or `시민팀`; Spy and Medium display the exact role separately as `직업: <역할>`
- Private investigation result is hidden when the investigator dies
- Public/mafia channel selector and server-side mafia-channel isolation
- Night chat restriction: living mafia use only the mafia channel, living non-mafia cannot chat, and dead-player messages remain in the dead channel
- After checking citizen victory when no Mafia-team role remains, Mafia victory uses `aliveMafiaTeamForParity >= aliveCitizenFaction`; an uncontacted living Spy is excluded from parity and a contacted living Spy is included
- A parity result must finish the game before another night cycle starts; tests cover both Spy contact states
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
- A submitted night action survives disconnect when the same player reconnects within 30 seconds
- A night action is removed when the player remains absent for 30 seconds, before a later night resolution when the test schedule permits
- Same-room replay at 4, 5, 6, 7, and 8 players after `WAITING` reset
- Actual elapsed 15/35/60/20/20/20/35 second opening/cycle durations for role assignment, first night, day discussion, nomination, final defense, execution, and night; not only displayed timer values
- Completed-game `total_games`, `wins`, and `losses` update once per participant; replay adds one more game and a repeated completion id does not double-count
- Every non-host browser reaches the exact created room URL before participant-state assertions
- A pending lobby refresh is cancelled when a browser starts navigating from `/rooms` to a room
- The parity case where alive Mafia equals the alive citizen faction ends in Mafia victory before the next night cycle
- The chat input is at least 40px high in the browser
- `마피아 채널` is fully visible without clipping in the selector
- Full chat-scroll: 210 submissions retain only the latest 200 rendered messages; Regression uses 30 submissions to verify the browser scroll path without the 210-message stress cost
- The waiting-room `GAME` placeholder is visible before start and the started role panel is visible after start
- The 8-player role panel reaches the lower game-card edge and the `역할 확인 완료` button remains at the role panel bottom

The selected profile maps to the following executable scope:

| Profile | Core E2E | UI E2E | Timing/evidence policy |
|---|---|---|---|
| Smoke | 4 players; no replay; no resilience | room-layout/profile at 5 players, including 300px game panel and user stats/level | short phases; retain trace on failure; no routine video/screenshots |
| Regression | 4/6/8 players; replay only 4 | chat-scroll at 30 messages and room-layout/profile at 5 players, including 300px game panel and user stats/level | short phases; retain trace on failure; screenshots enabled, video off |
| Full | 4/5/6/7/8 players; replay every count; both six-player resilience cases | chat-scroll at 210 messages and room-layout/profile at 8 players, including 300px game panel and user stats/level | production phases; full trace/video/screenshot evidence |

Full QA must map to the following executable cases:

| Case | Playwright test | Required result |
|---|---|---|
| 4 players | `MVP 4인 핵심 게임 흐름` | Role confirmation, one-mafia role set, final defense, complete game, replay |
| 5 players | `MVP 5인 핵심 게임 흐름` | Role confirmation, two citizen slots (`MAFIA/POLICE/DOCTOR/CITIZEN/CITIZEN`), final defense, complete game, replay |
| 6 players | `MVP 6인 핵심 게임 흐름` | Role confirmation, Mafia+Spy+Soldier role set, Spy investigation, Soldier one-hit shield, final defense, Mafia-team execution, night actions, victory, replay |
| 7 players | `MVP 7인 핵심 게임 흐름` | Role confirmation, two-Mafia+Soldier+Medium role set without Spy, concurrent Mafia-target aggregation, final defense, night actions, victory, replay |
| 8 players | `MVP 8인 핵심 게임 흐름` | Role confirmation, maximum supported browser flow, final defense, replay |
| 6→5 before start | `closing a waiting-room tab changes six players to the five-player role threshold` | Closed tab is removed before start; `SPY` and `SOLDIER` are removed, a second `CITIZEN` is added, and the exact five-player role set is assigned |
| Deadline/reconnect | `browser deadline, reconnect grace, and expired night action` | Near-deadline requests do not hang; reconnect within 30 seconds preserves state; expiry removes the departed player after 30 seconds |

Full QA's UI regression inventory must also map to these executable cases:

| Case | Playwright test | Required result |
|---|---|---|
| Chat input and overflow | `role slot is visible before game and chat scrolls without growing the page` | Input height is at least 40px; 210 submissions render only the latest 200 messages; the message list scrolls internally; document height stays stable; screenshot and video are saved under the current `E2E_RUN_ID` |
| 8-player room layout, profile stats/level, room settings, and room visual states | `waiting and started room layout (8 players)` | Eight participants render; new accounts show `Lv. 1` and zero initial totals; successful password set/change/remove saves keep the settings modal open with the success message in its footer; friend-invite, help, and host-only room settings buttons appear in order, while guests do not see settings; settings strip absent; waiting and started game panels are 300px tall; desktop participant/game and chat columns share top and bottom edges; mobile retains a 300px game panel with chat below; capacity and password controls stay functional; existing role-panel alignment and normal/night/restored backgrounds remain correct; normal/night/restored screenshots and transition video are saved under the current `E2E_RUN_ID` |

The normal cases are generated from `PLAYER_COUNTS`. The two extended cases are
registered only when both the Full profile and player count `6` are active. Their
absence in Smoke/Regression is intentional and must be reported as `NOT RUN` only
when a report lists the Full-only inventory.

The room-entry E2E case must click the room in the lobby, then confirm both the
destination URL and the participant count. A participant count alone is insufficient:

```javascript
await joinRoomFromLobby(page, roomUrl);
await waitForRoomParticipantCount(page, expectedCount);
```

The lobby regression case must verify that a refresh scheduled for a newly discovered room is cancelled
when `beforeunload` starts. This protects the room-entry navigation from a competing `window.location.reload()`.

For a complete Full QA result, run all five configured core counts and both conditional
six-player cases in one execution (`4,5,6,7,8`), then run the UI regression suite with
`E2E_CAPACITY=8` using the same `E2E_RUN_ID`. Smoke and Regression are complete only
against their selected profile scope; Full-only cases must remain `NOT RUN` in those
reports rather than being treated as failures.

Do not retry failed tests automatically. Investigate the failure first.

For failed Playwright tests, inspect:

- `output/test_output/<YYYY-MM-DD>/playwright-<E2E_RUN_ID>/<core|ui>/...`
- Full-profile discovery output, if any: `output/test_output/<YYYY-MM-DD>/playwright-<E2E_RUN_ID>/discovery/`
- `output/test_output/<YYYY-MM-DD>/qa-run-<E2E_RUN_ID>/bootRun.<E2E_RUN_ID>.stdout.log`
- `output/test_output/<YYYY-MM-DD>/qa-run-<E2E_RUN_ID>/bootRun.<E2E_RUN_ID>.stderr.log`
- `output/test_output/<YYYY-MM-DD>/chat-scroll-test-<E2E_RUN_ID>/**`
- `output/test_output/<YYYY-MM-DD>/room-layout-test-<uiCapacity>-<E2E_RUN_ID>/**`
- `output/test_output/<YYYY-MM-DD>/mafia-mvp-test-<e2eProfile>-<E2E_RUN_ID>/**`

### 3.4 Clean Up Only the Test Server

Use this same finalizer for Smoke, Regression, and Full; do not fork or bypass it in
profile-specific branches. The outer `try` begins before the server is launched and
contains health checks, discovery, all selected-profile E2E commands, account
cleanup, and report bookkeeping. Account cleanup must run before server termination,
including when startup, discovery, or a Playwright case fails. The application PID
is captured from Spring Boot's early `Starting MafiagameApplication ... with PID`
log line, not only from the later `Started` marker. This lets cleanup find the JVM
even if an exception interrupts the health-check loop before it records the port
listener.

```powershell
try {
    # Health check, Playwright discovery, and Playwright execution
}
finally {
    # Run the section 3.5 account cleanup first when it is enabled.
    Remove-Item Env:PLAYWRIGHT_OUTPUT_STAGE -ErrorAction SilentlyContinue
    if ($startedServer) {
        $cleanupProblems = [System.Collections.Generic.List[string]]::new()
        $launcherTreeTerminationConfirmed = $false

        # Recover the early Spring Boot PID even if startup/health-check code threw.
        if ($null -eq $qaApplicationProcessId) {
            $qaApplicationProcessId = Get-QAApplicationProcessIdFromLog
        }

        if ($null -ne $qaApplicationProcessId) {
            $applicationIdentityIsValid = Test-QAApplicationProcessIdentity `
                -ProcessId $qaApplicationProcessId `
                -LaunchTime $serverLaunchTime

            if ($applicationIdentityIsValid) {
                Stop-Process -Id $qaApplicationProcessId -Force -ErrorAction SilentlyContinue
                Wait-Process -Id $qaApplicationProcessId -Timeout 10 -ErrorAction SilentlyContinue
            } elseif (Get-Process -Id $qaApplicationProcessId -ErrorAction SilentlyContinue) {
                $cleanupProblems.Add("PID $qaApplicationProcessId exists but is not verifiably this run's Java process; it was left untouched.")
            }
        }

        # Stop the QA-owned cmd/Gradle process tree too; stopping only cmd.exe can
        # orphan bootRun's JVM when Gradle has detached its child process.
        if ($null -ne $appProcess) {
            $launcher = Get-Process -Id $appProcess.Id -ErrorAction SilentlyContinue
            if ($null -ne $launcher) {
                $launcherIsSameRun = $false
                try {
                    $launcherIsSameRun = $launcher.StartTime -eq $launcherStartTime
                } catch {
                    $launcherIsSameRun = $false
                }

                if ($launcherIsSameRun) {
                    $null = & taskkill.exe /PID $appProcess.Id /T /F 2>&1
                    $launcherTreeExitCode = $LASTEXITCODE
                    if (Get-Process -Id $appProcess.Id -ErrorAction SilentlyContinue) {
                        Stop-Process -Id $appProcess.Id -Force -ErrorAction SilentlyContinue
                    }
                    if ($launcherTreeExitCode -eq 0 -and -not (Get-Process -Id $appProcess.Id -ErrorAction SilentlyContinue)) {
                        $launcherTreeTerminationConfirmed = $true
                    }
                } else {
                    $cleanupProblems.Add("Launcher PID $($appProcess.Id) could not be verified as this run and was left untouched.")
                }
            }
        }

        $cleanupDeadline = (Get-Date).AddSeconds(10)
        do {
            Start-Sleep -Milliseconds 250
            $qaApplicationStillRunning = $false
            if ($null -ne $qaApplicationProcessId) {
                $qaApplicationStillRunning = Test-QAApplicationProcessIdentity `
                    -ProcessId $qaApplicationProcessId `
                    -LaunchTime $serverLaunchTime
            }
            $launcherStillRunning = $false
            if ($null -ne $appProcess) {
                $currentLauncher = Get-Process -Id $appProcess.Id -ErrorAction SilentlyContinue
                if ($null -ne $currentLauncher) {
                    try {
                        $launcherStillRunning = $currentLauncher.StartTime -eq $launcherStartTime
                    } catch {
                        $launcherStillRunning = $false
                    }
                }
            }
            $remainingListenerProcessIds = @(Get-QAListeningProcessIds -Port $serverPort)
        } while ((Get-Date) -lt $cleanupDeadline -and ($qaApplicationStillRunning -or $launcherStillRunning -or $remainingListenerProcessIds.Count -gt 0))

        if ($qaApplicationStillRunning) {
            $cleanupProblems.Add("QA application PID $qaApplicationProcessId is still running.")
        }
        if ($null -eq $qaApplicationProcessId -and -not $launcherTreeTerminationConfirmed) {
            $cleanupProblems.Add('The Spring Boot PID was not captured and launcher-tree termination was not confirmed; cleanup cannot be reported as PASS.')
        }
        if ($launcherStillRunning) {
            $cleanupProblems.Add("The QA Gradle launcher process $($appProcess.Id) is still running.")
        }
        if ($remainingListenerProcessIds.Count -gt 0) {
            $cleanupProblems.Add("Port $serverPort still has listener PID(s) $($remainingListenerProcessIds -join ', '); unverified listeners were not terminated.")
        }

        if ($cleanupProblems.Count -gt 0) {
            Write-Warning "QA server cleanup is BLOCKED: $($cleanupProblems -join ' ')"
        } else {
            Write-Host "QA server cleanup PASS: app PID $qaApplicationProcessId and its launcher tree were stopped; port $serverPort is free."
        }
    }
}
```

The preflight records any existing listener and stops before starting QA. During
cleanup, terminate only the Java PID identified by this run's unique startup log and
verified against its launch time, plus the exact launcher process tree returned by
`Start-Process`. Never stop a different listener PID. If the app PID, launcher, or
listener cannot be verified, leave the unverified process untouched and report
cleanup as `BLOCKED`; confirm both the QA process and port are clear before reporting
cleanup `PASS`.

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

This game MVP scope applies to Smoke, Regression, and Full. DuckDNS profile 4
does not execute game MVP items 1–54 and reports them as `NOT RUN`; its only MVP
feature item is 55.

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
30. No-action behavior for mafia, spy, doctor, police, and medium
31. Doctor self-protection, including consecutive nights
32. No role/investigation disclosure on death
33. Full role reveal after game completion
34. Server-time deadline handling and duplicate-request idempotency
35. Actual game-room `게임 목록으로` button visibility and `/rooms` navigation target
36. Fixed back-link contrast in both normal and `NIGHT` page backgrounds
37. Public, mafia, and dead bubble channel classes and visual distinction
38. System phase-message type, public delivery, one-message-per-transition behavior, and phase-specific guidance
39. Gray `NIGHT` page background, `background-color` transition, and restoration after `DAY_DISCUSSION` or `FINISHED`
40. Server-rendered game-room screenshots and a normal→night→normal browser video
41. Screenshot and video evidence covering the full QA progress from preflight through final result and cleanup
42. Host-only room settings UI after friend-invite and help, with 4–8 capacity choices and password set/change/remove behavior
43. Capacity reduction below the live participant count is blocked in the UI and rejected by the server; updated capacity and lock state synchronize to every participant
44. After `FINISHED`, only the public channel remains available and public messages from dead participants are delivered to the public topic
45. Investigation results show `마피아팀`/`시민팀` as the faction and show Spy/Medium exact roles separately as `직업: <역할>`

46. Application-ready recovery resets persisted `PLAYING` rooms to `WAITING` and leaves rooms already in `WAITING` unchanged
47. When the parity-eligible living Mafia team and the living citizen faction reach parity, the game ends in Mafia victory before another night cycle; an uncontacted living Spy is excluded, and zero living Mafia-team roles still takes precedence for citizen victory
48. Anonymous lobby presence requests remain allowed, while repeated requests from one session are throttled and requests across sessions are coalesced under the global broadcast limit
49. Game start is delegated with the WebSocket session ID, transitions the database room before in-memory game creation, restores `WAITING` if creation fails, and removes partial game state if initial publication fails
50. Role assignment uses the exact 4–8 player table: five players have two Citizens and no Spy; seven players have two Mafia, Soldier, and Medium, with no Spy
51. Role confirmations or the 15-second role timer advance to the first `NIGHT`; the first night lasts 35 seconds before `DAY_DISCUSSION`
52. Saving room settings reopens the settings modal and shows `방 설정이 저장되었습니다.` in its footer; password set, change, and removal each retain the feedback
53. An uncontacted living Spy is excluded from Mafia parity, while a successfully contacted Spy is included; contact also grants access to Mafia chat
54. The 30-second playing-game reconnect grace preserves state and pending night actions; expiry removes the departed player and re-evaluates victory
55. DuckDNS validation belongs only to QA profile 4: `npm.cmd run qa:duckdns` checks timer/service/updater settings and, when POSIX Bash is available, mocked success/rejection behavior and token non-disclosure. For Smoke, Regression, and Full, record this item as `NOT RUN` because those profiles do not execute DuckDNS tests. Real DNS A-record and external access checks are outside profile 4 and require separate isolated-domain evidence.
56. A completed game updates each participant's statistics once for its completion id; replay increments totals again, while an unfinished game leaves totals unchanged

### 4.1 Extended Boundary and Resilience Checks

The following checks are required when the QA request includes boundary, disconnect, or concurrency coverage. They are separate from the normal 4/5/6/7/8-player E2E boundary run and must be reported individually:

1. Role-count boundaries: 4 players = `MAFIA/POLICE/DOCTOR/CITIZEN`; 5 players = `MAFIA/POLICE/DOCTOR/CITIZEN/CITIZEN`; 6 players = `MAFIA/SPY/POLICE/DOCTOR/SOLDIER/CITIZEN`; 7 players = `MAFIA/MAFIA/POLICE/DOCTOR/SOLDIER/MEDIUM/CITIZEN`; 8 players = `MAFIA/MAFIA/SPY/POLICE/DOCTOR/SOLDIER/MEDIUM/CITIZEN`.
2. Mafia-team count includes `MAFIA` and `SPY`; the exact role table, rather than a citizen-count formula, determines all slots.
3. Invalid start boundaries: fewer than 4 participants must keep start disabled or return a warning; more than 8 participants must be rejected by the server or prevented by room capacity.
4. Mafia victory threshold: after checking citizen victory when no Mafia-team role remains, `aliveMafiaTeamForParity >= aliveCitizenFaction` must finish the game for the Mafia; an uncontacted living Spy is excluded from the parity count, while a contacted one is included.
5. Citizen victory precedence: zero living Mafia-team roles must finish the game for citizens even when faction counts would otherwise be equal.
6. A 6-player game must continue after the actual Mafia is executed while the Spy remains alive; citizen victory is allowed only after the Spy is also dead.
7. In a 7- or 8-player game, if two Mafia players select different night targets, exactly one of the submitted highest-count targets is resolved; if they select the same target, that target is resolved unless protected. The Spy cannot submit a kill action.
8. Nomination ties must not select an execution candidate and must move to the night phase without hanging.
9. A last-session disconnect must remove that participant from alive counts after the configured 30-second reconnect grace period and re-evaluate victory; a reconnect within the grace period must restore the current state and pending night action without marking the player dead.
10. A pre-start departure must be reflected in the participant count before roles are assigned; a 6-to-5 transition removes `SPY` and `SOLDIER`, adds a second `CITIZEN`, and assigns exactly `MAFIA/POLICE/DOCTOR/CITIZEN/CITIZEN`, or prevents start until the state is stable.
11. Requests arriving at or immediately before a phase deadline must be serialized against server `phaseEndsAt`; requests received after it are invalid and cannot enter the next phase. Record this as `NOT RUN` when timing cannot be made deterministic.
12. A submitted night action survives a disconnect only while the player is within the 30-second reconnect grace period; after grace expiry it is removed before a subsequent night resolution.
13. Public chat is delivered only to the public channel; mafia chat is delivered only to living Mafia users and a Spy after successful contact; dead users and the living Medium can use the private dead channel, and dead messages must not be visible to other living users.
14. The same room can be replayed after `FINISHED` at 4, 5, 6, 7, and 8 players, with Ready reset and fresh role assignment.
15. The measured opening order is approximately 15 seconds for role confirmation, 35 seconds for the first night, then 60 seconds for day discussion. Later cycles use 60/20/20/20/35 seconds for day, nomination, final defense, execution, and night; a client-side countdown alone is insufficient evidence.
16. A successful room-settings POST reopens the settings modal and displays `방 설정이 저장되었습니다.` in its lower-left footer; password set, change, and remove each preserve that behavior.
17. `GameResultStatsService` records every participant's win/loss and total once per completed game id; replay increments the totals again and an unfinished game does not update them.
18. DuckDNS updater runtime checks run only in QA profile 4. They verify that the token stays out of process arguments, output, and state, that `OK` is recorded, and that `KO` retains the previous success timestamp; the systemd timer runs after boot and every five minutes. If POSIX Bash is unavailable, report mocked runtime checks as `BLOCKED`/`NOT RUN`. Profiles 1–3 record this item as `NOT RUN`. DNS A-record/external access evidence is separate and requires an isolated QA domain or external probe.

For each extended check, record the evidence source (`Java service test`, `JavaScript test`, `Playwright E2E`, external verification, or `source inspection`) and classify it as `PASS`, `FAIL`, `BLOCKED`, or `NOT RUN`. Source inspection alone cannot be reported as an executed test `PASS`.

Use this evidence split when producing the report:

- The normal 4/5/6/7/8 flows, role displays and confirmation, the first `NIGHT` before
  `DAY_DISCUSSION`, final-defense nominee chat, actual browser chat, Mafia-team execution
  flow, replay, and phase-duration assertions are `Playwright E2E` results.
- Restart recovery, Mafia parity termination, anonymous lobby request access and count throttling,
  and coordinated game-start ordering/rollback are Java unit, mapper integration, and controller
  delegation test results. Keep the database-backed PLAYING-only reset result distinct from the
  service-level application-ready callback test.
- Role-rule edge cases, no-action behavior, self/consecutive doctor protection,
  post-departure target rejection, exact server-deadline rejection, duplicate request
  idempotency, and invalid participant-count starts are `Java service test` results.
- The six-player browser resilience test supplies `Playwright E2E` evidence for the
  pre-start 6→5 transition, reconnect within the 30-second grace period, 30-second
  departure expiry, and a near-deadline request attempt. `RoomGameServiceTest` supplies
  Java evidence that expiry removes a queued night action and re-evaluates victory. The
  exact after-`phaseEndsAt` acceptance rule still requires the Java server-time test.
- `test/js/duckdns.test.js` supplies JavaScript evidence only for standalone QA profile 4; it is not part of `test:js` or the Smoke/Regression/Full run. It verifies timer settings on every platform and mocked updater behavior when POSIX Bash is available. DNS propagation and public access require separate external evidence.
- A true simultaneous two-Mafia network attack is not proven by sequential service
  submissions or by the nomination race. Keep that item `NOT RUN` unless the executed
  output contains a dedicated concurrent night-action test; this applies only to the
  7- and 8-player role sets because the 6-player set has one Mafia and one Spy.

### 4.2 Implementation Contracts to Verify

When source inspection is used to explain a result, inspect these contracts directly and include the file and line number in the report:

- `RoomGameRules.createRoles`/`assignRoles`: the exact 4–8 player role table is applied; `SPY` first appears at 6 players and is part of the Mafia team, `SOLDIER` first appears at 6, and `MEDIUM` first appears at 7.
- `GamePhase`: `ROLE_ASSIGNMENT` is 15 seconds and `FINAL_DEFENSE` is 20 seconds; both are part of the server phase enum.
- `RoomGameService.submitAction`: `ROLE_CONFIRM` is accepted only during `ROLE_ASSIGNMENT`, once per living player, and all confirmations can advance the room early to the first `NIGHT`; the 15-second role timer has the same destination, and the first 35-second night advances to `DAY_DISCUSSION`.
- `RoomGameService.moveAfterNominationVote`/`validateChat`: a unique nominee enters `FINAL_DEFENSE`, and only that nominee may use public chat during the defense phase.
- `RoomGameRules.determineWinner`: citizen victory is checked first when no living Mafia-team role remains; Mafia parity compares the living citizen faction against the parity-eligible Mafia count, excluding an uncontacted Spy and including a contacted Spy.
- Restart recovery: `RoomPresenceService.resetInterruptedGamesAfterRestart` resets persisted `PLAYING` rooms when the application is ready; `RoomMapper.resetInterruptedGamesToWaiting` must leave already-`WAITING` rooms unchanged. Verify both the service test and `MapperIntegrationTest.interruptedGameRecoveryResetsOnlyRoomsThatArePlaying`.
- Anonymous lobby count requests: `WebSocketAuthorizationInterceptor` permits `/app/rooms/presence`; `RoomPresenceService.broadcastRoomCounts` limits each session to one accepted request per second and coalesces lobby broadcasts to at most one per 250 ms, with a trailing update for queued requests.
- Game startup: `RoomPresenceController.startGame` delegates with the WebSocket session ID to `RoomPresenceService.startGame`; the service transitions the room before creating the in-memory game, restores `WAITING` if creation fails, and `RoomGameService.startGame` removes a partially created game if its initial state publication fails.
- `RoomGameService.handlePlayerDeparture`: after the reconnect grace period, a player whose last room session disconnects becomes non-alive, pending actions are removed, and victory is re-evaluated.
- `RoomPresenceService`: the last session retains a playing participant for 30 seconds, reconnect cancels the departure, expiry removes the participant and notifies the game service, a departed dead player may rejoin as a spectator without revival, and game start accepts only 4–8 current participants.
- `RoomService.updateRoomSettings`/`RoomPresenceService.updateRoomSettings`: only a waiting-room host may update settings; capacities stay within 4–8 and cannot drop below live participants; password changes are normalized, encoded, removable, and broadcast with the updated capacity/lock state.
- `RoomController.updateRoomSettings` and `rooms/detail.html`: successful saves flash `방 설정이 저장되었습니다.`, reopen the modal after redirect, and render the message in the modal footer; the host bypasses the room password on reconnect, while non-host access requires the session password grant.
- `chat.js`: the host start button is disabled below four participants, and the current presence snapshot drives the displayed participant count and readiness state.
- `ChatService`/`RoomGameService`: public, Mafia, and dead-channel permissions are checked from the authoritative alive/role/phase state; a Spy is added to Mafia chat only after a successful Mafia investigation, a Medium may use dead chat while alive, and dead players cannot use Mafia chat.
- `RoomGameService.snapshot`: roles are null before `FINISHED` and included for all players only after game completion.
- `src/main/resources/templates/rooms/detail.html`: the game-room back control is a button-styled `.room-back-link` targeting `/rooms`.
- `src/main/resources/static/css/app.css`: `.room-back-link` uses a fixed high-contrast palette; `body.night-phase` changes only the page background and `body` transitions `background-color` in both directions.
- `RoomGameService.broadcastPhaseSystemMessage`/`phaseSystemMessage`: a real phase transition publishes one public `SYSTEM` chat message containing the transition result and role-appropriate instructions; state synchronization must not publish a duplicate.
- `ChatMessage.system`: phase system messages use the `SYSTEM` type, public channel, and `게임 안내` sender; the Spy contact system message uses the same `SYSTEM` type in the private Mafia channel.
- `src/main/resources/static/js/chat.js`: `getMessageChannel` and `appendMessage` assign the public, mafia, dead, and system channel classes; system messages render as text-only guidance; game-phase rendering toggles `.night-phase`.
- `src/main/resources/static/js/chat.js`: live presence updates revalidate the selected room capacity, disable invalid options, show the warning, disable save, synchronize the lock indicator, and force `FINISHED` users back to the public channel.
- `GameFaction.investigationLabel` and `RoomGameService.buildInvestigationDeliveries`: investigation payloads use `마피아팀`/`시민팀` for faction labels and keep exact Spy/Medium role labels separate.
- `src/main/resources/static/css/app.css`: `.channel-system` and `.chat-message.system` provide the distinct system-guidance visual treatment.
- `GameResultStatsService.recordCompletedGame`/`MapperIntegrationTest`: a unique game-completion id and account updates share one transaction; repeated completion ids do not double-count. The profile E2E checks one completed game and the second replay.
- `ops/duckdns`: `update-duckdns.sh` sends its token through curl's standard-input configuration, records only timestamps/status, and the systemd timer runs after boot and every five minutes. Only QA profile 4 runs `test/js/duckdns.test.js`. It checks timer settings on all platforms and token-free arguments/output/state by running a mocked updater when POSIX Bash is available. If that subtest is skipped, report runtime token handling as `NOT RUN` or `BLOCKED`. Profiles 1–3 do not run DuckDNS tests. Real DNS and external access checks require an isolated QA domain and provider-side public-IP evidence.
- `test/e2e/mafia-mvp.spec.js`: five count-driven cases verify the updated role compositions, the first `ROLE_ASSIGNMENT → NIGHT → DAY_DISCUSSION` sequence, final defense, result stats, and replay; the two conditional six-player resilience cases are discovered before execution.

Do not infer a runtime result from these contracts. Use them only to identify implementation evidence, expected behavior, or the root cause of a failed or unexecuted test.

### 4.3 Phase System Message Checks

Validate the phase guidance through the public room chat, not only through the game panel:

1. Starting a game publishes one `SYSTEM` message for `ROLE_ASSIGNMENT`. It instructs each player to check the private role and confirm it without revealing the role.
2. `DAY_DISCUSSION` publishes the night result when applicable and explains that living players should discuss and prepare for nomination.
3. `NOMINATION_VOTE` explains the single-target nomination rule and the tie-to-night behavior.
4. `FINAL_DEFENSE` identifies the defense phase and explains that only the nominee may speak in the public channel.
5. `EXECUTION_VOTE` explains the nominee exclusion and the yes-versus-no majority rule.
6. `NIGHT` explains the mafia kill, doctor protection, police investigation, and citizen wait behavior without naming private targets or results.
7. `FINISHED` announces completion and directs players to the public role/result reveal.
8. A state synchronization request, reconnect, duplicate action, or timer refresh does not publish a second system message for the same phase.
9. System messages are delivered through the public room topic to all subscribed room clients, including clients that are dead, while mafia chat and police investigation results remain private.
10. The browser renders system messages as `.chat-message.system.channel-system` with text content only; HTML-like content must not create DOM elements.

Automated evidence for these checks:

- `RoomGameServiceTest.broadcastsSystemGuidanceWhenAGamePhaseStarts` verifies server publication at game start and at a phase transition.
- `test/js/chat.test.js` verifies `SYSTEM` message routing and the distinct system-message DOM treatment.
- `test/e2e/mafia-mvp.spec.js` traces `SYSTEM` messages and waits for role, day, nomination, defense, execution, night, and finished guidance in the browser flow.

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

The report order below applies to Smoke, Regression, and Full. DuckDNS profile 4
uses the standalone Korean report generated in the DuckDNS-only section and records
its isolated test result, runtime skip state, artifacts, and all game-server/MVP
checks as `NOT RUN`.

The saved QA report must be written entirely in Korean for Smoke, Regression, and
Full. Write the executive summary, environment description, result explanations,
MVP assessments, failure/blocked-item analysis, reproduction steps, root cause,
recommended fixes, and final verdict explanation in Korean. Preserve commands,
paths, test/class/method names, status tokens (`PASS`/`FAIL`/`BLOCKED`/`NOT RUN`),
exception text, and console/log excerpts verbatim when exact evidence is important;
add Korean explanations around them. This language requirement applies to the
report file itself, not only the final chat response.

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
7. Include the run-specific progress screenshot and video paths; if either evidence type is missing, report the affected QA result as `BLOCKED`.

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
   Include the selected `$e2eProfile`, effective player counts, replay scope, UI scope,
   phase profile, and trace/video/screenshot policy.
9. Separate 4-player, 5-player, 6-player, 7-player, 8-player, 6→5, and reconnect/deadline results
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

- `ROLE_ASSIGNMENT`: role delivery is private, the public game state does not reveal roles, each living player can confirm once, duplicate confirmation is rejected, and the phase advances to the first `NIGHT` on all confirmations or after 15 seconds. The first `NIGHT` lasts 35 seconds before `DAY_DISCUSSION`.
- `FINAL_DEFENSE`: a unique nominee enters the 20-second phase, only the nominee can use public chat, non-nominees are rejected, and a nominee departure skips execution and advances to night.
- Measured server-side phase durations: approximately 15 seconds for role assignment, 60 seconds for day discussion, 20 seconds for nomination, 20 seconds for final defense, 20 seconds for execution, and 35 seconds for night.
- Restart recovery, Mafia parity, anonymous lobby throttling/coalescing, game-start ordering/rollback, and the F-18–F-24 feature checks: report validation items 46–56 with their Java, Playwright, JavaScript, or external evidence, and distinguish the `MapperIntegrationTest` database result from service and controller unit tests.

For every result, include:

- Actual console output
- Error messages
- Test class and method names
- Related source files and line numbers
- JUnit XML paths
- Gradle HTML report path
- Test-progress screenshot and video paths for the complete QA run
- Playwright trace, screenshot, and video paths
- Playwright core discovery output and the seven required scenario names
- Playwright UI discovery output and the two required UI scenario names
- Requested worker count and effective worker count (`1` for the current suite)
- Application stdout and stderr log paths

Runbook instructions and test commands: English
Saved QA report, including MVP results and analysis: Korean (preserve exact technical evidence verbatim where needed)
