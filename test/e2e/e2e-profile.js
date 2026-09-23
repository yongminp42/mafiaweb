const PROFILE_DEFINITIONS = Object.freeze({
  smoke: Object.freeze({
    playerCounts: Object.freeze([4]),
    replayPlayerCounts: Object.freeze([]),
    runExtendedScenarios: false,
    uiCapacity: 5,
    chatMessageCount: 30,
    phaseProfile: 'short',
    trace: 'retain-on-failure',
    captureScreenshots: false,
    captureVideo: false,
    runChatScroll: false,
    coreTimeoutMs: 5 * 60 * 1000
  }),
  regression: Object.freeze({
    playerCounts: Object.freeze([4, 6, 8]),
    replayPlayerCounts: Object.freeze([4]),
    runExtendedScenarios: false,
    uiCapacity: 5,
    chatMessageCount: 30,
    phaseProfile: 'short',
    trace: 'retain-on-failure',
    captureScreenshots: true,
    captureVideo: false,
    runChatScroll: true,
    coreTimeoutMs: 12 * 60 * 1000
  }),
  full: Object.freeze({
    playerCounts: Object.freeze([4, 5, 6, 7, 8]),
    replayPlayerCounts: Object.freeze([4, 5, 6, 7, 8]),
    runExtendedScenarios: true,
    uiCapacity: 8,
    chatMessageCount: 210,
    phaseProfile: 'production',
    trace: 'on',
    captureScreenshots: true,
    captureVideo: true,
    runChatScroll: true,
    coreTimeoutMs: 20 * 60 * 1000
  })
});

export function resolveE2EProfile(value = process.env.E2E_PROFILE) {
  const profile = String(value || '').trim().toLowerCase();
  if (!Object.hasOwn(PROFILE_DEFINITIONS, profile)) {
    throw new Error(
      `E2E_PROFILE must be selected explicitly: ${Object.keys(PROFILE_DEFINITIONS).join(', ')}.`
    );
  }
  return profile;
}

export const E2E_PROFILE = resolveE2EProfile();
export const PROFILE_CONFIG = PROFILE_DEFINITIONS[E2E_PROFILE];
export const FULL_TIMING_ASSERTIONS = E2E_PROFILE === 'full';

export function parseConfiguredPlayerCounts(value) {
  if (!value || !String(value).trim()) {
    return [...PROFILE_CONFIG.playerCounts];
  }

  const counts = String(value)
    .split(',')
    .map(item => Number(item.trim()));
  if (counts.some(count => !Number.isInteger(count) || count < 4 || count > 8)) {
    throw new Error('PLAYER_COUNTS must contain integers from 4 through 8.');
  }
  if (counts.some(count => !PROFILE_CONFIG.playerCounts.includes(count))) {
    throw new Error(`PLAYER_COUNTS must be a subset of the ${E2E_PROFILE} profile.`);
  }
  return [...new Set(counts)];
}

export function shouldReplayPlayerCount(playerCount) {
  return PROFILE_CONFIG.replayPlayerCounts.includes(playerCount);
}

export function representativeItems(items) {
  if (E2E_PROFILE === 'full') {
    return items;
  }
  return items.slice(0, Math.min(2, items.length));
}

export function shouldCaptureScreenshots() {
  return PROFILE_CONFIG.captureScreenshots;
}

export function shouldCaptureVideo() {
  return PROFILE_CONFIG.captureVideo;
}
