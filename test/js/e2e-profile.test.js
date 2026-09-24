import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('E2E scopes and the DuckDNS-only QA profile are isolated', async () => {
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
  const duckDnsRunbookSection = runbook.match(
    /## DuckDNS-only profile([\s\S]*?)## Project Information/
  )?.[1];
  const duckDnsTestFile = 'test/js/duckdns.test.js';
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
  assert.ok(duckDnsRunbookSection, 'QA script must define a separate DuckDNS-only profile.');
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
  assert.match(runbook, /if \(\$e2eProfile -eq 'duckdns'\) \{\s+\$e2eEnabled = \$false/);
  assert.match(packageJson.scripts['test:js'], /--test-isolation=none/);
  assert.doesNotMatch(packageJson.scripts['test:js'], /duckdns\.test\.js/);
  assert.equal(
    packageJson.scripts['qa:duckdns'],
    'node --test --test-isolation=none ' + duckDnsTestFile
  );
  assert.match(jsRunbookSection, /node --test --test-isolation=none/);
  assert.doesNotMatch(jsRunbookSection, /duckdns\.test\.js|qa:duckdns/);
  assert.match(runbook, /'4' = 'duckdns'/);
  assert.match(duckDnsRunbookSection, /npm\.cmd run qa:duckdns/);
  const duckDnsExecutionBlock = duckDnsRunbookSection.match(/```powershell([\s\S]*?)```/)?.[1];
  assert.ok(duckDnsExecutionBlock, 'DuckDNS profile must have an executable PowerShell block.');
  assert.doesNotMatch(duckDnsExecutionBlock, /gradlew|Test-NetConnection|bootRun|test:e2e|deleteTestAccounts/);
  for (const file of javascriptTestFiles) {
    assert.ok(packageJson.scripts['test:js'].includes(file), `${file} must run from package.json.`);
    assert.ok(jsRunbookSection.includes(file), `${file} must run from the QA script.`);
  }
  assert.ok(duckDnsRunbookSection.includes(duckDnsTestFile));

  assert.match(coreSpec, /for \(const playerCount of PLAYER_COUNTS\)/);
  assert.match(coreSpec, /if \(shouldReplayPlayerCount\(playerCount\)\)/);
  assert.match(coreSpec, /if \(RUN_EXTENDED_SCENARIOS && PLAYER_COUNTS\.includes\(6\)\)/);
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
