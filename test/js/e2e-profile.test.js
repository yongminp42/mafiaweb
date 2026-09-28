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
    'room list discards a fetched card when its live count reaches zero first'
  ]) {
    assert.ok(roomListTests.includes(optimizationTest), `Missing optimization regression: ${optimizationTest}`);
  }
  for (const optimizationTest of [
    'RoomPresenceServiceTest.roomSnapshotsUseCachedSettingsWithoutFurtherDatabaseQueries',
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
  assert.match(runbook, /56\. A win adds 500 XP and a loss adds 100 XP/);
  assert.doesNotMatch(runbook, /rating-derived|friend-invite, help, and host-only room settings buttons appear in order/);
  assert.doesNotMatch(runbook, /does not execute game MVP items 1[–-]54/);
  assert.match(chatScrollSpec, /test\.skip\(!PROFILE_CONFIG\.runChatScroll/);
  assert.match(chatScrollSpec, /index <= PROFILE_CONFIG\.chatMessageCount/);
  assert.match(roomLayoutSpec, /process\.env\.E2E_CAPACITY \|\| PROFILE_CONFIG\.uiCapacity/);
  for (const scopeRow of [
    '| Smoke | 4 players; no replay; no resilience | room-layout/profile at 5 players',
    '| Regression | 4/6/8 players; replay only 4 | chat-scroll at 30 messages and room-layout/profile at 5 players',
    '| Full | 4/5/6/7/8 players; replay every count; both six-player resilience cases | chat-scroll at 210 messages and room-layout/profile at 8 players'
  ]) {
    assert.ok(runbook.includes(scopeRow), `QA profile scope must include: ${scopeRow}`);
  }

  const profiles = [
    {
      name: 'smoke', counts: [4], replay: [], capacity: 5,
      short: true, chatScroll: false, messages: 30,
      screenshots: false, video: false, extended: false,
      trace: 'retain-on-failure'
    },
    {
      name: 'regression', counts: [4, 6, 8], replay: [4], capacity: 5,
      short: true, chatScroll: true, messages: 30,
      screenshots: true, video: false, extended: false,
      trace: 'retain-on-failure'
    },
    {
      name: 'full', counts: [4, 5, 6, 7, 8], replay: [4, 5, 6, 7, 8], capacity: 8,
      short: false, chatScroll: true, messages: 210,
      screenshots: true, video: true, extended: true,
      trace: 'on'
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
      assert.throws(() => profile.parseConfiguredPlayerCounts('9'), /integers from 4 through 8/);
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
  const databaseProbeIndex = runbook.indexOf('Test-NetConnection `');
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
