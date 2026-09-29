const PROFILE_DEFINITIONS = Object.freeze({
  smoke: Object.freeze({
    playerCounts: Object.freeze([4]),
    replayPlayerCounts: Object.freeze([]),
    runExtendedScenarios: false,
    uiCapacity: 5,
    chatMessageCount: 30,
    phaseProfile: 'short',
    roomLayoutMode: 'centered',
    maxRunIdLength: 22,
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
    roomLayoutMode: 'centered',
    maxRunIdLength: 22,
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
    roomLayoutMode: 'centered',
    maxRunIdLength: 22,
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

export const E2E_NICKNAME_MAX_LENGTH = 30;
export const E2E_RUN_ID_MAX_LENGTH = PROFILE_CONFIG.maxRunIdLength;
const DEFAULT_E2E_RUN_ID = `qa-${Date.now().toString(36)}-${process.pid.toString(36)}`;

export function resolveE2ERunId(value = process.env.E2E_RUN_ID) {
  const configuredValue = value == null || !String(value).trim()
    ? DEFAULT_E2E_RUN_ID
    : String(value).trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(configuredValue)) {
    throw new Error(
      'E2E_RUN_ID must start with a letter or digit and contain only letters, digits, underscores, or hyphens.'
    );
  }
  if (configuredValue.length > E2E_RUN_ID_MAX_LENGTH) {
    throw new Error(
      `E2E_RUN_ID must be at most ${E2E_RUN_ID_MAX_LENGTH} characters so generated signup nicknames stay within ${E2E_NICKNAME_MAX_LENGTH} characters.`
    );
  }
  return configuredValue;
}

export const E2E_RUN_ID = resolveE2ERunId();

export function assertE2ENickname(nickname) {
  const value = String(nickname ?? '');
  if (!value || value.length > E2E_NICKNAME_MAX_LENGTH) {
    throw new Error(
      `Generated E2E nickname must contain 1-${E2E_NICKNAME_MAX_LENGTH} characters; received ${value.length}.`
    );
  }
  return value;
}

const supportedRoomLayoutModes = Object.freeze(['centered']);
const configuredRoomLayoutMode = String(
  process.env.ROOM_LAYOUT_MODE || PROFILE_CONFIG.roomLayoutMode
).trim().toLowerCase();
if (!supportedRoomLayoutModes.includes(configuredRoomLayoutMode)) {
  throw new Error(
    `ROOM_LAYOUT_MODE must be one of: ${supportedRoomLayoutModes.join(', ')}.`
  );
}
if (configuredRoomLayoutMode !== PROFILE_CONFIG.roomLayoutMode) {
  throw new Error(
    `ROOM_LAYOUT_MODE=${configuredRoomLayoutMode} does not match the ${E2E_PROFILE} profile (${PROFILE_CONFIG.roomLayoutMode}).`
  );
}
export const ROOM_LAYOUT_MODE = configuredRoomLayoutMode;

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
  if (new Set(counts).size !== counts.length) {
    throw new Error('PLAYER_COUNTS must not contain duplicate player counts.');
  }
  return counts;
}

export function parseConfiguredUiCapacity(value = process.env.E2E_CAPACITY) {
  const configuredValue = value == null || !String(value).trim()
    ? PROFILE_CONFIG.uiCapacity
    : Number(String(value).trim());
  if (!Number.isInteger(configuredValue) || configuredValue < 4 || configuredValue > 8) {
    throw new Error('E2E_CAPACITY must be an integer from 4 through 8.');
  }
  return configuredValue;
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

export function usesCenteredRoomLayout() {
  return ROOM_LAYOUT_MODE === 'centered';
}
