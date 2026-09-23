import test from 'node:test';
import assert from 'node:assert/strict';

test('QA profile definitions match the executable scenario scope', async () => {
  const previousProfile = process.env.E2E_PROFILE;
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
