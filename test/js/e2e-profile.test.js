import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('E2E scopes and the three QA profiles are isolated', async () => {
  const previousProfile = process.env.E2E_PROFILE;
  const runbook = await readFile(
    new URL('../../docs/QA_scripts/MAFIAGAME_QA_TEST_EXECUTION_SCRIPT.md', import.meta.url),
    'utf8'
  );
  const packageJson = JSON.parse(await readFile(
    new URL('../../package.json', import.meta.url),
    'utf8'
  ));
  const coreSpec = await readFile(new URL('../e2e/mafia-mvp.spec.js', import.meta.url), 'utf8');
  const roomLayoutSpec = await readFile(new URL('../e2e/room-layout.spec.js', import.meta.url), 'utf8');
  const signupServiceTests = await readFile(
    new URL('../../src/test/java/kr/or/oti/mafiagame/service/SignupServiceTest.java', import.meta.url),
    'utf8'
  );
  const mapperIntegrationTests = await readFile(
    new URL('../../src/test/java/kr/or/oti/mafiagame/dao/MapperIntegrationTest.java', import.meta.url),
    'utf8'
  );
  const roomGameServiceTests = await readFile(
    new URL('../../src/test/java/kr/or/oti/mafiagame/service/RoomGameServiceTest.java', import.meta.url),
    'utf8'
  );
  const roomGameRulesTests = await readFile(
    new URL('../../src/test/java/kr/or/oti/mafiagame/service/RoomGameRulesTest.java', import.meta.url),
    'utf8'
  );
  const roomControllerTests = await readFile(
    new URL('../../src/test/java/kr/or/oti/mafiagame/controller/RoomControllerTest.java', import.meta.url),
    'utf8'
  );
  const chatClientTests = await readFile(new URL('./chat.test.js', import.meta.url), 'utf8');
  const chatScrollSpec = await readFile(new URL('../e2e/chat-scroll.spec.js', import.meta.url), 'utf8');
  const roomListTests = await readFile(new URL('./room-list.test.js', import.meta.url), 'utf8');
  const powershellDefaults = runbook.match(/\$profileDefaults = @\{([\s\S]*?)\n\}/)?.[1];
  const jsRunbookSection = runbook.match(
    /## 2\. JavaScript Tests([\s\S]*?)## 3\. Playwright E2E Tests/
  )?.[1];
  const preflightSection = runbook.match(
    /## 0\. Environment Preflight([\s\S]*?)## 1\. Java Tests/
  )?.[1];
  const e2eRunbookSection = runbook.match(
    /## 3\. Playwright E2E Tests([\s\S]*?)## 4\. MVP Validation Scope/
  )?.[1];
  const javascriptTestFiles = [
    'test/js/stomp-client.test.js',
    'test/js/room-list.test.js',
    'test/js/chat.test.js',
    'test/js/e2e-profile.test.js'
  ];

  assert.ok(powershellDefaults, 'QA script must define profile defaults.');
  assert.ok(jsRunbookSection, 'QA script must include the JavaScript test section.');
  assert.ok(preflightSection, 'QA script must define the shared environment preflight.');
  assert.ok(e2eRunbookSection, 'QA script must define the shared game E2E lifecycle.');
  assert.match(preflightSection, /SPRING_DATASOURCE_URL/);
  assert.match(preflightSection, /SELECT 1/);
  assert.match(preflightSection, /--skip-ssl/);
  assert.match(preflightSection, /MYSQL_PWD/);
  const profileDefaultsStart = runbook.indexOf('$profileDefaults = @{');
  const profileConfirmationIndex = runbook.indexOf("Read-Host 'Start this QA scenario now?");
  assert.notEqual(profileDefaultsStart, -1, 'QA script must define defaults for each profile.');
  assert.notEqual(profileConfirmationIndex, -1, 'QA script must confirm profile execution.');
  const profileConfiguration = runbook.slice(profileDefaultsStart, profileConfirmationIndex);
  assert.match(profileConfiguration, /PLAYER_COUNTS repeats/);
  assert.match(profileConfiguration, /outside the \$e2eProfile profile/);
  assert.match(profileConfiguration, /A complete Full QA run requires PLAYER_COUNTS/);
  assert.match(profileConfiguration, /E2E_CAPACITY must be an integer from 4 through 8/);
  assert.ok(profileDefaultsStart < profileConfirmationIndex,
    'Profile values must be validated before the user confirms the run.');
  assert.ok(profileConfirmationIndex < runbook.indexOf('## 0. Environment Preflight'),
    'Profile confirmation and validation must precede DB and test preflight.');
  assert.match(runbook, /same read-only probe in an authorized execution context/);
  assert.match(runbook, /netstat\.exe -ano/);
  assert.match(preflightSection, /child_process/);
  assert.match(preflightSection, /fork\(process\.argv\[1\]/);
  assert.match(preflightSection, /execArgv: \[\]/);
  assert.match(preflightSection, /\$playwrightWorkerAvailable = \$false/);
  assert.match(preflightSection, /\$playwrightBlockReason =/);
  assert.match(preflightSection, /`EPERM`/);
  assert.match(preflightSection, /`require_escalated`/);
  assert.match(preflightSection, /`--workers=1` still creates a worker process/);
  assert.match(preflightSection, /If permission[\s\S]*keep E2E `BLOCKED` and do not start the\s+server/);
  assert.ok(
    runbook.indexOf('## 0. Environment Preflight') < runbook.indexOf('## 1. Java Tests'),
    'The Playwright fork probe must run before any test command.'
  );
  assert.match(e2eRunbookSection, /Smoke, Regression, and Full all use this\s+shared gate/);
  assert.match(e2eRunbookSection, /both `\$e2eEnabled` and\s+`\$playwrightWorkerAvailable`/);
  assert.match(e2eRunbookSection, /overall E2E result `BLOCKED`/);
  assert.match(e2eRunbookSection, /do not create a QA server or\s+attempt Playwright discovery/);
  assert.match(packageJson.scripts['test:js'], /--test-isolation=none/);
  assert.match(jsRunbookSection, /node --test --test-isolation=none/);
  assert.match(jsRunbookSection, /optimized lobby room-card flow/i);
  assert.match(jsRunbookSection, /used by all three QA profiles/);
  for (const file of javascriptTestFiles) {
    assert.ok(packageJson.scripts['test:js'].includes(file), `${file} must run from package.json.`);
    assert.ok(jsRunbookSection.includes(file), `${file} must run from the QA script.`);
  }
  for (const optimizationTest of [
    'room list applies the active search and status filter to a newly inserted card',
    'room list discards a fetched card when its live count reaches zero first',
    'room list updates existing counts without rescanning cards and refreshes once for batched removals'
  ]) {
    assert.ok(roomListTests.includes(optimizationTest), `Missing optimization regression: ${optimizationTest}`);
  }
  for (const optimizationTest of [
    'RoomPresenceServiceTest.roomSnapshotsUseCachedSettingsWithoutFurtherDatabaseQueries',
    'RoomPresenceServiceTest.currentCountReturnsDistinctLiveParticipantsForTheRequestedRoom',
    'RoomPresenceServiceTest.databaseRoomLookupDoesNotHoldThePresenceWriteLock',
    'RoomPresenceServiceTest.staleRoomLookupCannotRejoinAfterEmptyRoomDeletionCompletes',
    'RoomPresenceServiceTest.emptyRoomDatabaseDeleteDoesNotHoldThePresenceWriteLock',
    'RoomPresenceServiceTest.lobbyCountBroadcastsOnlyWhenParticipantCountChanges',
    'RoomPresenceServiceTest.lobbySnapshotStillSynchronizesCurrentCountsAfterIncrementalBroadcasts',
    'RoomPresenceServiceTest.staleRoomCountBroadcastDoesNotOverwriteTheLatestPresenceCount',
    'RoomPresenceServiceTest.lobbySnapshotIsDeliveredBeforeAnyNewerIncrementalRoomCount',
    'RoomPresenceServiceTest.stalledLobbySnapshotDoesNotBlockPresenceWrites',
    'RoomPresenceServiceTest.lobbyCountWorkerContinuesWhileBothMaintenanceWorkersAreBlocked',
    'MapperIntegrationTest.roomMapperReturnsRoomMetadataWithoutCountingMembersAndStillListsTransfersAndDeletesRoom',
    'RoomControllerTest.roomCardReturnsOneFragmentWithTheLatestLiveCount',
    'RoomControllerTest.roomCardReturnsNotFoundWhenTheRoomWasDeletedBeforeItWasFetched'
  ]) {
    assert.ok(runbook.includes(optimizationTest), `QA runbook must map: ${optimizationTest}`);
  }
  assert.match(coreSpec, /for \(const playerCount of PLAYER_COUNTS\)/);
  assert.match(coreSpec, /if \(shouldReplayPlayerCount\(playerCount\)\)/);
  assert.match(coreSpec, /if \(RUN_EXTENDED_SCENARIOS && PLAYER_COUNTS\.includes\(6\)\)/);
  assert.match(coreSpec, /experience: 1000 \+ \(won \? 500 : 100\)/);
  assert.match(coreSpec, /stats\.experience\)\.toBe\(previousStats\.experience/);
  assert.ok(
    roomLayoutSpec.includes("await expect(profileStats).toHaveCount(4);"),
    'Room-layout E2E must account for the XP card in the profile.'
  );
  assert.ok(
    roomLayoutSpec.includes("await expect(profileStats.nth(3).locator('.d-flex > strong')).toHaveText('1000 XP');"),
    'Room-layout E2E must check the initial profile experience.'
  );
  assert.ok(
    roomLayoutSpec.includes("await expect(host.locator('#invite')).toHaveCount(0);"),
    'Room-layout E2E must reflect the removed friend-invite control.'
  );
  assert.match(roomLayoutSpec, /nickname-check@example\.com/);
  assert.match(roomLayoutSpec, /이미 사용 중인 닉네임입니다\./);
  assert.match(roomLayoutSpec, /expect\(nickname\.length\)\.toBeLessThanOrEqual\(30\)/);
  assert.match(roomLayoutSpec, /expectRoleComposition\(host, capacity\)/);
  assert.match(roomLayoutSpec, /expectRoleComposition\(host, updatedCapacity\)/);
  assert.match(coreSpec, /#mafiaTeammatesPanel/);
  assert.match(coreSpec, /#noMafiaTeammatesNotice/);
  assert.match(coreSpec, /dayState\.players\.every\(player => player\.role == null\)/);
  assert.match(chatClientTests, /chat renders a role received through the private role queue/);
  for (const requiredTest of [
    'rejectsInvalidInputsDuplicateEmailAndDuplicateNickname',
    'classifiesNicknameUniquenessRaceAsDuplicateNickname',
    'classifiesEmailUniquenessRaceAsDuplicateEmail'
  ]) {
    assert.ok(signupServiceTests.includes(requiredTest), `Signup tests must include ${requiredTest}.`);
  }
  assert.ok(mapperIntegrationTests.includes('nicknameLookupAndUniqueConstraintRejectDuplicateNicknames'));
  assert.ok(roomGameServiceTests.includes('privatelyShowsEachMafiaTheOtherMafiaAndKeepsPublicRolesHidden'));
  assert.ok(roomGameServiceTests.includes('containsExactlyInAnyOrderElementsOf(expectedRoles)'));
  assert.ok(roomGameRulesTests.includes('exposesTheExactRoleCompositionForEverySupportedRoomCapacity'));
  assert.ok(roomControllerTests.includes('gameRoleCompositions'));
  assert.match(runbook, /56\. A win adds 500 XP and a loss adds 100 XP/);
  assert.match(runbook, /shuffles player IDs before assigning the fixed composition/);
  assert.match(runbook, /57\. Signup rejects a nickname already in use/);
  assert.match(runbook, /58\. The room-help modal lists the exact role counts/);
  assert.match(runbook, /59\. Each Mafia receives the other Mafia nicknames only through their private role assignment/);
  assert.doesNotMatch(runbook, /rating-derived|friend-invite, help, and host-only room settings buttons appear in order/);
  assert.doesNotMatch(runbook, /does not execute game MVP items 1[–-]54/);
  assert.match(chatScrollSpec, /test\.skip\(!PROFILE_CONFIG\.runChatScroll/);
  assert.match(chatScrollSpec, /index <= PROFILE_CONFIG\.chatMessageCount/);
  assert.match(roomLayoutSpec, /parseConfiguredUiCapacity\(\)/);
  for (const scopeRow of [
    '| Smoke | 4 players; no replay; no resilience; confirms the solo-Mafia notice | room-layout/profile at 5 players; duplicate-nickname rejection; 5→6 capacity synchronization and role-help counts; 300px game panel and user stats/level',
    '| Regression | 4/6/8 players; replay only 4; 8-player case confirms private Mafia teammate names | chat-scroll at 30 messages and room-layout/profile at 5 players; duplicate-nickname rejection; 5→6 capacity synchronization and role-help counts; 300px game panel and user stats/level',
    '| Full | 4/5/6/7/8 players; replay every count; both six-player resilience cases; private teammate checks at 7/8 | chat-scroll at 210 messages and room-layout/profile at 8 players; duplicate-nickname rejection; maximum-capacity role-help counts; 300px game panel and user stats/level'
  ]) {
    assert.ok(runbook.includes(scopeRow), `QA profile scope must include: ${scopeRow}`);
  }

  const profiles = [
    {
      name: 'smoke', counts: [4], replay: [], capacity: 5,
      short: true, chatScroll: false, messages: 30,
      screenshots: false, video: false, extended: false,
      trace: 'retain-on-failure', coreTimeoutMs: 5 * 60 * 1000
    },
    {
      name: 'regression', counts: [4, 6, 8], replay: [4], capacity: 5,
      short: true, chatScroll: true, messages: 30,
      screenshots: true, video: false, extended: false,
      trace: 'retain-on-failure', coreTimeoutMs: 12 * 60 * 1000
    },
    {
      name: 'full', counts: [4, 5, 6, 7, 8], replay: [4, 5, 6, 7, 8], capacity: 8,
      short: false, chatScroll: true, messages: 210,
      screenshots: true, video: true, extended: true,
      trace: 'on', coreTimeoutMs: 20 * 60 * 1000
    }
  ];

  try {
    for (const expected of profiles) {
      const phaseProfile = expected.short ? 'short' : 'production';
      const defaultLine = `${expected.name} = @{ playerCounts = '${expected.counts.join(',')}'; uiCapacity = ${expected.capacity}; phaseProfile = '${phaseProfile}' }`;
      assert.ok(
        powershellDefaults.includes(defaultLine),
        `QA script defaults for ${expected.name} must match the E2E profile.`
      );

      process.env.E2E_PROFILE = expected.name;
      const profile = await import(`../e2e/e2e-profile.js?qa-profile=${expected.name}`);
      assert.equal(profile.E2E_PROFILE, expected.name);
      assert.deepEqual(profile.parseConfiguredPlayerCounts(), expected.counts);
      assert.deepEqual(profile.PROFILE_CONFIG.replayPlayerCounts, expected.replay);
      assert.equal(profile.PROFILE_CONFIG.uiCapacity, expected.capacity);
      assert.equal(profile.PROFILE_CONFIG.coreTimeoutMs, expected.coreTimeoutMs);
      assert.equal(profile.PROFILE_CONFIG.phaseProfile, expected.short ? 'short' : 'production');
      assert.equal(profile.FULL_TIMING_ASSERTIONS, !expected.short);
      assert.equal(profile.PROFILE_CONFIG.runChatScroll, expected.chatScroll);
      assert.equal(profile.PROFILE_CONFIG.chatMessageCount, expected.messages);
      assert.equal(profile.shouldCaptureScreenshots(), expected.screenshots);
      assert.equal(profile.shouldCaptureVideo(), expected.video);
      assert.equal(profile.PROFILE_CONFIG.runExtendedScenarios, expected.extended);
      assert.equal(profile.PROFILE_CONFIG.trace, expected.trace);
      assert.deepEqual(
        expected.counts.filter(count => profile.shouldReplayPlayerCount(count)),
        expected.replay
      );
      assert.deepEqual(profile.parseConfiguredPlayerCounts(String(expected.counts[0])),
        [expected.counts[0]]);
      assert.equal(profile.parseConfiguredUiCapacity(String(expected.capacity)), expected.capacity);
      assert.equal(profile.parseConfiguredUiCapacity(''), expected.capacity);
      assert.throws(() => profile.parseConfiguredUiCapacity('3'), /integer from 4 through 8/);
      assert.throws(() => profile.parseConfiguredUiCapacity('8.5'), /integer from 4 through 8/);
      assert.throws(() => profile.parseConfiguredUiCapacity('invalid'), /integer from 4 through 8/);
      assert.throws(() => profile.parseConfiguredPlayerCounts('9'), /integers from 4 through 8/);
      assert.throws(() => profile.parseConfiguredPlayerCounts(`${expected.counts[0]},${expected.counts[0]}`), /duplicate player counts/);
      const outsideCount = [4, 5, 6, 7, 8].find(count => !expected.counts.includes(count));
      if (outsideCount) {
        assert.throws(() => profile.parseConfiguredPlayerCounts(String(outsideCount)),
          /subset/);
      }
    }
    const profile = await import('../e2e/e2e-profile.js?qa-profile=invalid-check');
    assert.throws(() => profile.resolveE2EProfile(''), /selected explicitly/);
    assert.throws(() => profile.resolveE2EProfile('unknown'), /selected explicitly/);
  } finally {
    if (previousProfile === undefined) {
      delete process.env.E2E_PROFILE;
    } else {
      process.env.E2E_PROFILE = previousProfile;
    }
  }
});

test('game QA profiles share orphan-safe server startup and cleanup', async () => {
  const runbook = await readFile(
    new URL('../../docs/QA_scripts/MAFIAGAME_QA_TEST_EXECUTION_SCRIPT.md', import.meta.url),
    'utf8'
  );
  const lifecycleStart = runbook.indexOf('### 3.1 Prepare the Test Environment');
  const lifecycleEnd = runbook.indexOf('### 3.5 Delete Test Accounts After the Run');
  assert.notEqual(lifecycleStart, -1);
  assert.notEqual(lifecycleEnd, -1);
  const lifecycle = runbook.slice(lifecycleStart, lifecycleEnd);

  assert.match(lifecycle, /Smoke, Regression, and Full all use this same server lifecycle/);
  assert.match(lifecycle, /\| Smoke \|[^\n]*\| Shared sections 3\.1–3\.4 \|/);
  assert.match(lifecycle, /\| Regression \|[^\n]*\| Shared sections 3\.1–3\.4 \|/);
  assert.match(lifecycle, /\| Full \|[^\n]*\| Shared sections 3\.1–3\.4 \|/);
  assert.match(lifecycle, /Starting MafiagameApplication using \.\* with PID/);
  assert.match(lifecycle, /taskkill\.exe \/PID \$appProcess\.Id \/T \/F/);
  assert.match(lifecycle, /\$launcherTreeTerminationConfirmed = \$true/);
  assert.match(lifecycle, /Stop-Process -Id \$qaApplicationProcessId/);
  assert.match(lifecycle, /QA server cleanup PASS/);
  assert.match(lifecycle, /temporarily use `Continue`, capture the/);
  assert.match(lifecycle, /Judge[\s\S]*?by its exit code and Playwright result summary/);
  const coreStart = lifecycle.indexOf("$env:PLAYWRIGHT_OUTPUT_STAGE = 'core'");
  const uiStart = lifecycle.indexOf("$env:PLAYWRIGHT_OUTPUT_STAGE = 'ui'", coreStart + 1);
  const cleanupStart = lifecycle.indexOf('# Stop the QA-owned cmd/Gradle process tree too;');
  const cleanupWaitStart = lifecycle.indexOf('$cleanupDeadline = (Get-Date).AddSeconds(10)', cleanupStart);
  assert.ok(coreStart !== -1 && uiStart > coreStart, 'Core and UI invocations must be present separately.');
  assert.ok(cleanupStart !== -1 && cleanupWaitStart > cleanupStart, 'The launcher cleanup and final wait must be present.');

  const coreInvocation = lifecycle.slice(coreStart, uiStart);
  const uiInvocation = lifecycle.slice(uiStart, cleanupStart);
  const launcherCleanup = lifecycle.slice(cleanupStart, cleanupWaitStart);
  for (const [name, invocation, command] of [
    ['Core', coreInvocation, /npm\.cmd run test:e2e/],
    ['UI', uiInvocation, /npm\.cmd run test:e2e:ui/],
    ['launcher cleanup', launcherCleanup, /\$launcherTreeOutput = @\(& taskkill\.exe/]
  ]) {
    assert.match(invocation, /\$savedNativeErrorActionPreference = \$ErrorActionPreference/,
      `${name} must save the caller's native error policy.`);
    assert.match(invocation, /\$ErrorActionPreference = 'Continue'/,
      `${name} must allow native stderr without aborting cleanup.`);
    assert.match(invocation, command, `${name} native command must be present.`);
    assert.match(invocation, /\$LASTEXITCODE/,
      `${name} must capture the native exit code.`);
    assert.match(invocation, /finally\s*\{[\s\S]*?\$ErrorActionPreference = \$savedNativeErrorActionPreference/,
      `${name} must restore the caller's native error policy.`);
  }
});

test('Full QA startup prevents PowerShell policy and capture-gate silent skips', async () => {
  const runbook = await readFile(
    new URL('../../docs/QA_scripts/MAFIAGAME_QA_TEST_EXECUTION_SCRIPT.md', import.meta.url),
    'utf8'
  );
  const launcherStart = runbook.indexOf('#### PowerShell startup gate');
  const recorderStart = runbook.indexOf('### Full QA progress recording (required)');
  const environmentStart = runbook.indexOf('\n## 0. Environment Preflight');
  const javaStart = runbook.indexOf('## 1. Java Tests');
  const permissionGuideStart = runbook.indexOf('#### Permission boundary handling');
  assert.notEqual(launcherStart, -1, 'QA runbook must explain the PowerShell 5.1 launch gate.');
  assert.notEqual(permissionGuideStart, -1, 'QA runbook must explain sandbox permission recovery.');
  assert.ok(recorderStart < environmentStart, 'Full recording must start before environment preflight.');
  assert.ok(environmentStart < javaStart, 'Environment gates must precede Java tests.');

  const permissionGuide = runbook.slice(permissionGuideStart, launcherStart);
  assert.match(permissionGuide, /Node `child_process\.fork` returns `EPERM`/);
  assert.match(permissionGuide, /sandbox_permissions: "require_escalated"/);
  assert.match(permissionGuide, /Win32 error 5 \/ `Access is denied`/);
  assert.match(permissionGuide, /before the MariaDB probe or any test command/);
  assert.match(permissionGuide, /Do not change machine-level\s+desktop-capture permissions/);

  const startupGate = runbook.slice(launcherStart, environmentStart);
  const captureMarkerIndex = runbook.indexOf('[QA_PROGRESS] Recording started before preflight:');
  const databaseProbeIndex = runbook.indexOf("'SELECT 1;'");
  assert.notEqual(databaseProbeIndex, -1, 'The DB preflight must run an authenticated SELECT 1.');
  const javaCommandIndex = runbook.indexOf('.\\gradlew.bat test --no-daemon --rerun-tasks -x jsTest');
  const javaScriptCommandIndex = runbook.indexOf('node --test --test-isolation=none');
  const playwrightBranchIndex = runbook.indexOf('## 3. Playwright E2E Tests');
  assert.match(startupGate, /'-ExecutionPolicy', 'RemoteSigned'/);
  assert.match(startupGate, /'-NoProfile', '-NoExit', '-ExecutionPolicy', 'RemoteSigned'/,
    'The dedicated QA console must remain open so startup errors stay visible.');
  assert.match(startupGate, /-WindowStyle Maximized/);
  assert.match(startupGate, /MainWindowHandle -eq 0/);
  assert.match(startupGate, /Do not use `Set-ExecutionPolicy`/);
  assert.match(startupGate, /Do not call `Get-ExecutionPolicy` as a startup gate/);
  assert.match(startupGate, /`'-ExecutionPolicy',[\s\S]*'RemoteSigned'[\s\S]*before `'-File'`/);
  assert.match(startupGate, /Do not depend on `\$Host\.UI\.RawUI\.WindowState`/);
  assert.match(startupGate, /save that\s+file as UTF-8 with BOM/);
  assert.match(startupGate, /MainWindowTitle/);
  assert.match(startupGate, /Test-Path -LiteralPath \$progressVideoPath/);
  assert.match(startupGate, /Length -gt 0/);
  assert.match(startupGate, /\$ffmpegBin = \$env:FFMPEG_BIN/);
  assert.match(startupGate, /Join-Path \$ffmpegBin 'ffprobe\.exe'/);
  assert.match(startupGate, /PATH or FFMPEG_BIN/);
  assert.match(startupGate, /save the preflight-blocked\s+report and stop before DB checks or test commands/);
  const captureToolGateStart = runbook.indexOf('if (-not $ffmpegCommand -or -not $ffprobeCommand)');
  const recorderStartInfo = runbook.indexOf('$ffmpegStartInfo = [System.Diagnostics.ProcessStartInfo]::new()');
  assert.ok(captureToolGateStart !== -1 && captureToolGateStart < recorderStartInfo,
    'Full QA must resolve both recorder tools before attempting to start capture.');
  const blockedReportStart = startupGate.indexOf('function Save-QAProgressPreflightBlockedReport');
  assert.ok(blockedReportStart !== -1 && blockedReportStart < captureToolGateStart,
    'Full QA must define its preflight-blocked report before checking recorder tools.');
  const blockedReport = startupGate.slice(blockedReportStart, captureToolGateStart);
  const captureToolGate = runbook.slice(captureToolGateStart, recorderStartInfo);
  assert.match(captureToolGate, /\$qaFinalVerdict = 'BLOCKED'/);
  assert.match(captureToolGate, /Save-QAProgressPreflightBlockedReport -Reason/);
  assert.match(blockedReport, /Java 테스트: NOT RUN/);
  assert.match(blockedReport, /JavaScript 테스트: NOT RUN/);
  assert.match(blockedReport, /Playwright\/서버\/계정 정리: NOT RUN/);
  assert.match(captureToolGate, /throw 'Full QA progress recording is BLOCKED/);
  assert.ok(captureMarkerIndex !== -1 && captureMarkerIndex < databaseProbeIndex,
    'Full desktop recording must be confirmed before the MariaDB probe.');
  assert.ok(databaseProbeIndex < javaCommandIndex && databaseProbeIndex < javaScriptCommandIndex,
    'Database preflight must precede both Java and JavaScript suites.');
  assert.ok(captureMarkerIndex < javaCommandIndex && captureMarkerIndex < javaScriptCommandIndex,
    'Full recording must be active before Java and JavaScript commands.');
  assert.ok(javaScriptCommandIndex < playwrightBranchIndex,
    'JavaScript tests must finish before the Playwright/server lifecycle.');
});
