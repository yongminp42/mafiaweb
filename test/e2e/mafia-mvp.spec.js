import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import {
  E2E_PROFILE,
  FULL_TIMING_ASSERTIONS,
  PROFILE_CONFIG,
  parseConfiguredPlayerCounts,
  representativeItems,
  shouldCaptureVideo,
  shouldCaptureScreenshots,
  shouldReplayPlayerCount
} from './e2e-profile.js';
import { resolveTestOutputDirectory } from './test-output-path.js';

/*
 * MAFIAGAME MVP 다중 세션 E2E 초안
 *
 * 실행 예:
 *   npx playwright install chromium
 *   $env:E2E_PROFILE = 'full'
 *   $env:PLAYER_COUNTS = '4,5,6,7,8'
 *   npx playwright test test/e2e/mafia-mvp.spec.js
 *
 * ONLINE_BASELINE을 지정하지 않으면 첫 테스트 세션이 로비에 연결된 뒤
 * 확인한 온라인 인원에서 테스트 세션 1명을 제외해 기준 인원을 자동 계산한다.
 * 외부 접속자 수가 고정된 환경에서는 $env:ONLINE_BASELINE = '1'처럼 직접 지정할 수 있다.
 *
 * 이 스크립트는 다중 브라우저의 방 입장·게임 시작·낮/투표/밤 페이즈·재접속·재플레이를 검증한다.
 * 실제 브라우저 세션에서 역할별 밤 행동과 채팅 채널 권한도 함께 확인한다.
 */

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:8080';
const PASSWORD = process.env.E2E_PASSWORD || 'MafiaTest2026!';
const RUN_ID = process.env.E2E_RUN_ID || Date.now().toString(36);
const ARTIFACT_ROOT = resolveTestOutputDirectory(`mafia-mvp-test-${E2E_PROFILE}`, RUN_ID);
const configuredOnlineBaseline = process.env.ONLINE_BASELINE?.trim();
const ONLINE_BASELINE = configuredOnlineBaseline
  ? Number(configuredOnlineBaseline)
  : null;
const PLAYER_COUNTS = parseConfiguredPlayerCounts(
  process.env.PLAYER_COUNTS || process.env.PLAYER_COUNT
);
const RUN_EXTENDED_SCENARIOS = PROFILE_CONFIG.runExtendedScenarios;
const PHASE_WAIT_TIMEOUT = FULL_TIMING_ASSERTIONS ? 75_000 : 15_000;

if (ONLINE_BASELINE !== null
    && (!Number.isSafeInteger(ONLINE_BASELINE) || ONLINE_BASELINE < 0)) {
  throw new Error('ONLINE_BASELINE은 0 이상의 정수여야 합니다.');
}

test.use({ baseURL: BASE_URL });

function delay(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

async function readTimerSeconds(page) {
  const value = (await page.locator('#gameTimer').textContent()) || '';
  const match = value.match(/\d+/);
  return match ? Number(match[0]) : -1;
}

function readOnlinePlayerCountFromTrace(trace) {
  const state = trace.presenceStates.find(message => {
    const count = Number(message?.onlinePlayers);
    return Number.isSafeInteger(count) && count >= 1;
  });
  return state ? Number(state.onlinePlayers) : null;
}

async function waitForOnlinePlayerCount(trace, timeout = 15_000) {
  return waitUntil(
    () => readOnlinePlayerCountFromTrace(trace),
    timeout,
    '로비 온라인 인원 수'
  );
}

async function assertTimersAreSynchronized(pages) {
  const values = await Promise.all(pages.map(readTimerSeconds));
  expect(values.every(value => value >= 0)).toBeTruthy();
  expect(Math.max(...values) - Math.min(...values)).toBeLessThanOrEqual(2);
}

async function waitForPhase(pages, phase, timeout = 20_000) {
  await Promise.all(
    pages.map(page =>
      expect(page.locator('#gamePhaseTitle')).toHaveText(phase, { timeout })
    )
  );
}

async function waitForOneOfPhases(pages, phases, timeout = 20_000) {
  const expectedPhases = new Set(phases);
  return waitUntil(
    async () => {
      const currentPhases = await Promise.all(
        pages.map(async page =>
          ((await page.locator('#gamePhaseTitle').textContent()) || '').trim()
        )
      );
      const currentPhase = currentPhases[0];
      return currentPhase
        && expectedPhases.has(currentPhase)
        && currentPhases.every(phase => phase === currentPhase)
        ? currentPhase
        : null;
    },
    timeout,
    '다음 게임 페이즈'
  );
}

async function dismissPatchNotes(page) {
  const modal = page.locator('#patchNotesModal');
  if (await modal.count() === 0) {
    return;
  }

  try {
    await expect(modal).toBeVisible({ timeout: 2_000 });
  } catch {
    return;
  }

  await modal.locator('[data-bs-dismiss="modal"]').click({ force: true });
  await expect(modal).toBeHidden({ timeout: 5_000 });
}

async function waitUntil(predicate, timeout, description) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const result = await predicate();
    if (result) {
      return result;
    }
    await delay(100);
  }
  throw new Error(description + ' 확인 시간이 초과되었습니다.');
}

function parseStompFrame(raw) {
  const frame = String(raw).replace(/^\n+/, '');
  if (!frame.trim()) {
    return null;
  }

  const separator = frame.indexOf('\n\n');
  const headerPart = separator >= 0 ? frame.slice(0, separator) : frame;
  const body = separator >= 0 ? frame.slice(separator + 2) : '';
  const lines = headerPart.split('\n');
  const command = lines.shift()?.trim();
  const headers = {};

  for (const line of lines) {
    const index = line.indexOf(':');
    if (index > 0) {
      headers[line.slice(0, index)] = line.slice(index + 1);
    }
  }

  return { command, headers, body };
}

function attachGameTrace(page) {
  const trace = {
    gameStates: [],
    presenceStates: [],
    systemMessages: [],
    errors: []
  };

  page.on('websocket', socket => {
    socket.on('framereceived', event => {
      const payload = event?.payload;
      const rawData =
        typeof payload === 'string'
          ? payload
          : Buffer.isBuffer(payload)
            ? payload.toString('utf8')
            : '';
      const chunks = rawData.split('\0');
      for (const chunk of chunks) {
        const frame = parseStompFrame(chunk);
        if (!frame || frame.command !== 'MESSAGE') {
          continue;
        }

        const destination = frame.headers.destination || '';
        try {
          const message = JSON.parse(frame.body.trim());
          if (destination.endsWith('/game')) {
            trace.gameStates.push({
              receivedAt: Date.now(),
              ...message
            });
          } else if ((destination.endsWith('/chat')
              || frame.headers.subscription === 'mafia-chat')
              && message.type === 'SYSTEM') {
            trace.systemMessages.push({
              receivedAt: Date.now(),
              ...message
            });
          } else if (destination.endsWith('/presence')) {
            trace.presenceStates.push(message);
          } else if (frame.headers.subscription === 'chat-errors'
              || message.type === 'ERROR') {
            trace.errors.push(message);
          }
        } catch {
          // 채팅·하트비트 등 JSON이 아닌 프레임은 이 추적 대상이 아니다.
        }
      }
    });
  });

  return trace;
}

function firstGameState(trace, phase, occurrence = 0) {
  return trace.gameStates.filter(state => state.phase === phase)[occurrence];
}

async function waitForGameState(trace, phase, occurrence = 0, timeout = 20_000) {
  return waitUntil(
    () => firstGameState(trace, phase, occurrence),
    timeout,
    phase + ' 게임 상태'
  );
}

async function signUpAndLogin(page, playerIndex, scenarioId) {
  const nickname = 'PW' + scenarioId + '-' + (playerIndex + 1);
  const email =
    'playwright.' + RUN_ID + '.' + scenarioId + '.' + (playerIndex + 1) + '@example.com';

  await page.goto('/signup');
  await page.locator('#nickname').fill(nickname);
  await page.locator('#signupEmail').fill(email);
  await page.locator('#signupPassword').fill(PASSWORD);
  await page.locator('#passwordConfirm').fill(PASSWORD);
  await page.locator('#agreement').check();
  await page.locator('#signupForm button[type="submit"]').click();
  await expect(page).toHaveURL(/\/login(?:\?signup)?$/);

  await page.locator('#email').fill(email);
  await page.locator('#password').fill(PASSWORD);
  await page.locator('form[action="/login"] button[type="submit"]').click();
  await expect(page).toHaveURL(/\/rooms(?:\?.*)?$/);

  return { nickname, email };
}

async function createRoom(page, playerCount, scenarioId) {
  await page.goto('/rooms/new');
  await page.locator('#title').fill('Playwright MVP ' + scenarioId + '-' + Date.now());
  const roomCapacity = playerCount;
  const capacityRadio = page.locator('#capacity-' + roomCapacity);
  await page.locator(`label[for="capacity-${roomCapacity}"]`).click();
  await expect(capacityRadio).toBeChecked();
  await page
    .locator('form')
    .filter({ has: page.locator('#title') })
    .locator('button[type="submit"]')
    .click();

  await expect(page).toHaveURL(/\/rooms\/\d+$/);
  return page.url();
}

async function readUserId(page) {
  const body = page.locator('body');
  await expect(body).toHaveAttribute('data-user-id', /\d+/, {
    timeout: 10_000
  });
  const value = await body.getAttribute('data-user-id');
  const userId = Number(value);
  if (!Number.isInteger(userId) || userId <= 0) {
    throw new Error('사용자 ID를 읽지 못했습니다: ' + value);
  }
  return userId;
}

async function readOwnProfileStats(roomPage) {
  const profilePage = await roomPage.context().newPage();
  try {
    await profilePage.goto('/rooms');
    await dismissPatchNotes(profilePage);
    await profilePage.locator('.user-menu-toggle').click();
    await profilePage.locator('.user-menu-dropdown a[href^="/users/"]').click();
    await expect(profilePage).toHaveURL(/\/users\/\d+$/);
    const stats = profilePage.locator('.app-profile-hero + section article');
    await expect(stats).toHaveCount(4);
    const [totalGames, wins, losses] = await Promise.all([0, 1, 2].map(async index =>
      Number((await stats.nth(index).locator('strong').textContent()).trim())
    ));
    const experienceText = (await stats.nth(3).locator('.d-flex > strong').textContent()).trim();
    const experience = Number(experienceText.replace(/\s*XP$/, ''));
    const levelText = (await stats.nth(3).locator('h2').textContent()).trim();
    const levelMatch = levelText.match(/^Lv\.\s*(\d+)$/);
    expect(Number.isFinite(experience)).toBeTruthy();
    expect(levelMatch).not.toBeNull();
    return { totalGames, wins, losses, experience, level: Number(levelMatch[1]) };
  } finally {
    await profilePage.close();
  }
}

async function waitForRoomParticipantCount(page, playerCount, timeout = 30_000) {
  await expect(page.locator('#chatConnectionStatus')).toHaveText('실시간', {
    timeout
  });
  await expect(page.locator('#ready')).toBeEnabled({ timeout });
  await expect(page.locator('#roomMemberCount')).toHaveText(String(playerCount), {
    timeout
  });
  await expect(page.locator('#memberGrid .member:not(.empty-seat)')).toHaveCount(
    playerCount,
    { timeout }
  );
}

async function expectRoomError(page, trace, previousCount, expectedMessage) {
  const error = await waitUntil(
    () => trace.errors.length > previousCount ? trace.errors.at(-1) : null,
    5_000,
    'private room error'
  );
  expect(error.message).toContain(expectedMessage);
  await expect(page.locator('#toast')).toContainText(expectedMessage);
}

async function createTrackedContext(browser, { videoDirectory } = {}) {
  const contextOptions = {
    baseURL: BASE_URL,
    viewport: { width: 1440, height: 1000 }
  };
  if (videoDirectory && shouldCaptureVideo()) {
    contextOptions.recordVideo = {
      dir: videoDirectory,
      size: { width: 1440, height: 1000 }
    };
  }

  const context = await browser.newContext(contextOptions);
  await context.addInitScript(() => {
    const NativeWebSocket = window.WebSocket;
    window.WebSocket = class extends NativeWebSocket {
      constructor(...args) {
        super(...args);
        window.__qaSocket = this;
      }
    };
  });
  return context;
}

async function captureScenarioScreenshot(page, artifactDirectory, name) {
  if (!shouldCaptureScreenshots() || !page || page.isClosed()) {
    return;
  }
  await page.screenshot({
    path: path.join(artifactDirectory, `${name}.png`),
    fullPage: true
  });
}

async function captureFinalScenarioScreenshot(page, artifactDirectory) {
  await captureScenarioScreenshot(page, artifactDirectory, 'final-state')
    .catch(() => {});
}

async function saveScenarioVideo(video, artifactDirectory, fileName) {
  if (!shouldCaptureVideo()) {
    return;
  }
  if (!video) {
    throw new Error('QA evidence video is not available for this scenario.');
  }
  await video.saveAs(path.join(artifactDirectory, fileName));
}

async function sendRawRoomMessage(page, roomUrl, channel, content) {
  await sendRawRoomFrame(page, roomUrl, channel, { content });
}

async function sendRawRoomFrame(page, roomUrl, channel, payload) {
  const roomId = new URL(roomUrl).pathname.split('/').filter(Boolean).pop();
  await page.evaluate(({ roomId, channel, payload }) => {
    const socket = window.__qaSocket;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      throw new Error('Room WebSocket is not connected');
    }
    socket.send(
      `SEND\ndestination:/app/rooms/${roomId}/${channel}\ncontent-type:application/json\n\n`
      + JSON.stringify(payload) + '\0'
    );
  }, { roomId, channel, payload });
}

async function joinRoomFromLobby(page, roomUrl, timeout = 30_000) {
  const roomId = new URL(roomUrl).pathname.split('/').filter(Boolean).pop();
  const joinButton = page.locator(`.room-card[data-room-id="${roomId}"] .join`);

  // 방 생성 직후 로비 WebSocket이 목록 갱신을 예약할 수 있으므로,
  // 목록에 실제 입장 링크가 나타난 뒤 클릭해 이동 경합을 피한다.
  await expect(joinButton).toBeVisible({ timeout });
  await dismissPatchNotes(page);
  await joinButton.click();
  await expect(page).toHaveURL(roomUrl, { timeout });
}

async function waitForRoomReady(pages, playerCount) {
  await Promise.all(
    pages.map(page => waitForRoomParticipantCount(page, playerCount))
  );
}

async function waitForMatchingGameState(trace, phase, predicate, timeout = 20_000) {
  return waitUntil(
    () => trace.gameStates.find(state =>
      state.phase === phase && predicate(state)
    ),
    timeout,
    phase + ' 조건부 게임 상태'
  );
}

const ROLE_LABELS = {
  MAFIA: '\uB9C8\uD53C\uC544',
  SPY: '\uC2A4\uD30C\uC774',
  DOCTOR: '\uC758\uC0AC',
  POLICE: '\uACBD\uCC30',
  SOLDIER: '\uAD70\uC778',
  MEDIUM: '\uC601\uB9E4\uC0AC',
  CITIZEN: '\uC2DC\uBBFC'
};

const FACTION_LABELS = {
  MAFIA: '마피아팀',
  CITIZEN: '시민팀'
};

const PHASE_LABELS = {
  ROLE: '역할 확인',
  DAY: '\uB0AE',
  NOMINATION: '\uC9C0\uBAA9 \uD22C\uD45C',
  DEFENSE: '최종 변론',
  EXECUTION: '\uCC98\uD615 \uD22C\uD45C',
  NIGHT: '\uBC24',
  FINISHED: '\uAC8C\uC784 \uC885\uB8CC'
};

function expectedMafiaCount(playerCount) {
  return playerCount >= 7 ? 2 : 1;
}

function expectedRoleCounts(playerCount) {
  return {
    4: { MAFIA: 1, SPY: 0, DOCTOR: 1, POLICE: 1, SOLDIER: 0, MEDIUM: 0, CITIZEN: 1 },
    5: { MAFIA: 1, SPY: 0, DOCTOR: 1, POLICE: 1, SOLDIER: 0, MEDIUM: 0, CITIZEN: 2 },
    6: { MAFIA: 1, SPY: 1, DOCTOR: 1, POLICE: 1, SOLDIER: 1, MEDIUM: 0, CITIZEN: 1 },
    7: { MAFIA: 2, SPY: 0, DOCTOR: 1, POLICE: 1, SOLDIER: 1, MEDIUM: 1, CITIZEN: 1 },
    8: { MAFIA: 2, SPY: 1, DOCTOR: 1, POLICE: 1, SOLDIER: 1, MEDIUM: 1, CITIZEN: 1 }
  }[playerCount];
}

function assertRoleAssignments(roleLabels, playerCount) {
  const expected = expectedRoleCounts(playerCount);
  const actual = Object.fromEntries(
    Object.entries(ROLE_LABELS).map(([role, label]) => [
      role,
      roleLabels.filter(value => value === label).length
    ])
  );

  expect(roleLabels).toHaveLength(playerCount);
  expect(expected).toBeTruthy();
  expect(actual).toEqual(expected);
}

async function submitNominationVotes(pages, userIds, targetId, aliveUserIds) {
  const alive = new Set(aliveUserIds);
  const alternativeTargetId = aliveUserIds.find(userId => userId !== targetId);
  expect(alternativeTargetId).toBeTruthy();

  for (let index = 0; index < pages.length; index += 1) {
    const page = pages[index];
    const userId = userIds[index];
    const submitButton = page.locator('#submitNomination');
    if (!alive.has(userId)) {
      await expect(submitButton).toBeDisabled();
      continue;
    }

    const select = page.locator('#nominationTarget');
    const selfOption = select.locator(`option[value="${userId}"]`);
    if (await selfOption.count() > 0) {
      await expect(selfOption).toBeDisabled();
    }

    const selectedTargetId = userId === targetId ? alternativeTargetId : targetId;
    await select.selectOption(String(selectedTargetId));
    await expect(submitButton).toBeEnabled();
    await submitButton.click();
    await expect(submitButton).toBeDisabled();
  }
}

async function submitExecutionVotes(pages, userIds, targetId, aliveUserIds) {
  const alive = new Set(aliveUserIds);

  for (let index = 0; index < pages.length; index += 1) {
    const page = pages[index];
    const userId = userIds[index];
    const executeButton = page.locator('#executePlayer');
    if (!alive.has(userId) || userId === targetId) {
      await expect(executeButton).toBeDisabled();
      continue;
    }

    await executeButton.click();
    await expect(executeButton).toBeDisabled();
  }
}

async function confirmRoleForPage(page) {
  const confirmButton = page.locator('#confirmGameRole');
  await expect(confirmButton).toBeEnabled({ timeout: 5_000 });
  await confirmButton.click();
  await expect(confirmButton).toHaveText('확인 완료', { timeout: 5_000 });
  await expect(confirmButton).toBeDisabled();
}

async function confirmAllRoles(pages) {
  await Promise.all(pages.map(page => confirmRoleForPage(page)));
}

async function submitNightActionForPage(page, targetId) {
  await expect(page.locator('#nightAction')).toBeVisible();
  await page.locator('#nightTarget').selectOption(String(targetId));
  await expect(page.locator('#submitNightAction')).toBeEnabled();
  await page.locator('#submitNightAction').click();
  await expect(page.locator('#submitNightAction')).toBeDisabled();
}

async function startReplayGame(pages, traces) {
  const nextRoleOccurrence = traces[0].gameStates
    .filter(state => state.phase === 'ROLE_ASSIGNMENT')
    .length;
  const nextDayOccurrence = traces[0].gameStates
    .filter(state => state.phase === 'DAY_DISCUSSION')
    .length;
  const nextNightOccurrence = traces[0].gameStates
    .filter(state => state.phase === 'NIGHT')
    .length;

  await Promise.all(
    pages.map(async page => {
      await expect(page.locator('#gameResultPanel')).toBeVisible();
      await expect(page.locator('#ready')).toBeEnabled();
      await expect(page.locator('#ready')).not.toHaveClass(/is-ready/);
    })
  );

  await Promise.all(
    pages.map(async page => {
      await page.locator('#ready').click();
      await expect(page.locator('#ready')).toHaveClass(/is-ready/);
    })
  );

  await expect(pages[0].locator('#startGame')).toBeEnabled({
    timeout: 10_000
  });
  await pages[0].locator('#startGame').click();

  await waitForPhase(pages, PHASE_LABELS.ROLE, 20_000);
  const secondRoleState = await waitForGameState(
    traces[0], 'ROLE_ASSIGNMENT', nextRoleOccurrence, 20_000
  );
  expect(secondRoleState.players.every(player => player.role == null)).toBeTruthy();
  await confirmAllRoles(pages);

  await waitForPhase(pages, PHASE_LABELS.NIGHT, 20_000);
  const secondNightState = await waitForGameState(
    traces[0], 'NIGHT', nextNightOccurrence, 25_000
  );
  await waitForSystemMessage(traces, '\uBC24 \uC548\uB0B4');
  await waitForPhase(pages, PHASE_LABELS.DAY, PHASE_WAIT_TIMEOUT);

  const secondDayState = await waitForGameState(
    traces[0],
    'DAY_DISCUSSION',
    nextDayOccurrence,
    25_000
  );
  expect(secondDayState.receivedAt).toBeGreaterThanOrEqual(secondNightState.phaseEndsAt - 1_000);
  if (FULL_TIMING_ASSERTIONS) {
    expect(secondDayState.phaseEndsAt - secondDayState.receivedAt)
      .toBeGreaterThan(55_000);
    expect(secondDayState.phaseEndsAt - secondDayState.receivedAt)
      .toBeLessThanOrEqual(65_000);
  }

  await Promise.all(
    pages.map(async page => {
      await expect(page.locator('#gamePanel')).toBeVisible({
        timeout: 15_000
      });
      await expect(page.locator('#ready')).toBeDisabled({ timeout: 15_000 });
      await expect(page.locator('#startGame')).toBeHidden({ timeout: 15_000 });
      await expect(page.locator('#gameResultPanel')).toBeHidden({
        timeout: 15_000
      });
      await expect(page.locator('#gameRolePanel')).toBeVisible({
        timeout: 15_000
      });
      await expect(page.locator('#gameRoleLabel')).toHaveText(/\S+/, {
        timeout: 15_000
      });
    })
  );

  const replayUserIds = await Promise.all(pages.map(readUserId));
  const replayRoleLabels = await Promise.all(pages.map(async page =>
    (await page.locator('#gameRoleLabel').textContent()).trim()
  ));
  const replayMafiaTeamUserIds = replayUserIds.filter((userId, index) =>
    replayRoleLabels[index] === ROLE_LABELS.MAFIA
      || replayRoleLabels[index] === ROLE_LABELS.SPY
  );
  const replayCitizenUserIds = replayUserIds.filter((userId, index) =>
    replayRoleLabels[index] === ROLE_LABELS.CITIZEN
  );

  let replayDayState = secondDayState;
  let replayFinishedState = null;
  while (!replayFinishedState) {
    const replayAliveUserIds = replayDayState.players
      .filter(player => player.alive)
      .map(player => Number(player.userId));
    const replayTargetId = replayMafiaTeamUserIds.find(userId =>
      replayAliveUserIds.includes(userId)
    );
    expect(replayTargetId).toBeTruthy();

    // Snapshot phase indexes before waits or votes can record the next transition.
    const replayNominationOccurrence = traces[0].gameStates
      .filter(state => state.phase === 'NOMINATION_VOTE')
      .length;
    const replayDefenseOccurrence = traces[0].gameStates
      .filter(state => state.phase === 'FINAL_DEFENSE')
      .length;
    const replayExecutionOccurrence = traces[0].gameStates
      .filter(state => state.phase === 'EXECUTION_VOTE')
      .length;
    await waitForPhase(pages, PHASE_LABELS.NOMINATION, PHASE_WAIT_TIMEOUT);
    await waitForGameState(
      traces[0], 'NOMINATION_VOTE', replayNominationOccurrence, 25_000
    );
    await submitNominationVotes(
      pages,
      replayUserIds,
      replayTargetId,
      replayAliveUserIds
    );

    await waitForPhase(pages, PHASE_LABELS.DEFENSE, 25_000);
    await waitForGameState(
      traces[0], 'FINAL_DEFENSE', replayDefenseOccurrence, 25_000
    );

    await waitForPhase(pages, PHASE_LABELS.EXECUTION, 25_000);
    await waitForGameState(
      traces[0], 'EXECUTION_VOTE', replayExecutionOccurrence, 25_000
    );

    // Capture both possible next states before execution votes trigger the transition.
    const replayNightOccurrence = traces[0].gameStates
      .filter(state => state.phase === 'NIGHT')
      .length;
    const replayNextDayOccurrence = traces[0].gameStates
      .filter(state => state.phase === 'DAY_DISCUSSION')
      .length;
    const replayFinishedOccurrence = traces[0].gameStates
      .filter(state => state.phase === 'FINISHED')
      .length;
    await submitExecutionVotes(
      pages,
      replayUserIds,
      replayTargetId,
      replayAliveUserIds
    );

    const nextReplayPhase = await waitForOneOfPhases(
      [pages[0]], [PHASE_LABELS.NIGHT, PHASE_LABELS.FINISHED], 25_000
    );
    if (nextReplayPhase === PHASE_LABELS.FINISHED) {
      replayFinishedState = await waitForGameState(
        traces[0], 'FINISHED', replayFinishedOccurrence, 25_000
      );
      break;
    }

    await waitForGameState(
      traces[0], 'NIGHT', replayNightOccurrence, 25_000
    );
    await waitForPhase(pages, PHASE_LABELS.DAY, PHASE_WAIT_TIMEOUT);
    replayDayState = await waitForGameState(
      traces[0], 'DAY_DISCUSSION', replayNextDayOccurrence, 25_000
    );
  }

  await waitForPhase(pages, PHASE_LABELS.FINISHED, 25_000);
  expect(replayFinishedState.gameOver).toBe(true);
  expect(replayFinishedState.winningFaction).toBe('CITIZEN');
  expect(replayFinishedState.players.every(player => typeof player.role === 'string'))
    .toBeTruthy();
  await Promise.all(
    pages.map(async page => {
      await expect(page.locator('#gameResultPanel')).toBeVisible({ timeout: 15_000 });
      await expect(page.locator('#gameWinnerLabel')).toHaveText('시민 진영');
      await expect(page.locator('#gameRoleRevealPanel')).toBeVisible();
      await expect(page.locator('#roomStatus')).toHaveText('대기 중');
      await expect(page.locator('#ready')).toBeEnabled();
    })
  );
}

function firstSystemMessage(trace, title, occurrence = 0) {
  return trace.systemMessages.filter(message =>
    typeof message.content === 'string' && message.content.includes(title)
  )[occurrence];
}

async function waitForSystemMessage(traces, title, timeout = 15_000) {
  await Promise.all(representativeItems(traces).map(trace =>
    waitUntil(
      () => firstSystemMessage(trace, title),
      timeout,
      title + ' system message'
    )
  ));
}

for (const playerCount of PLAYER_COUNTS) {
  test.describe.serial('MVP ' + playerCount + '인 핵심 게임 흐름', () => {
    test('인증부터 한 사이클까지 동기화 검증', async ({ browser }) => {
      // Replay and production-duration checks are enabled only for the selected profile.
      test.setTimeout(PROFILE_CONFIG.coreTimeoutMs);

      const scenarioId = playerCount + '-' + RUN_ID;
      const artifactDirectory = path.join(ARTIFACT_ROOT, `core-${playerCount}`);
      const contexts = [];
      const pages = [];
      const traces = [];
      let lobbyPage;
      let hostVideo;
      let detectedOnlineBaseline = null;

      await mkdir(artifactDirectory, { recursive: true });

      try {
        for (let index = 0; index < playerCount; index += 1) {
          const context = await createTrackedContext(browser, {
            videoDirectory: index === 0 ? artifactDirectory : undefined
          });
          const page = await context.newPage();
          contexts.push(context);
          pages.push(page);
          traces.push(attachGameTrace(page));
          if (index === 0) {
            hostVideo = page.video();
          }
        }
        // Detect the shared-server baseline while only the host session is online.
        // Measuring after all accounts sign in would count the scenario players as
        // part of the baseline and make the expected lobby count drift upward.
        await signUpAndLogin(pages[0], 0, scenarioId);
        if (ONLINE_BASELINE === null) {
          const firstPlayerOnlineCount = await waitForOnlinePlayerCount(traces[0]);
          detectedOnlineBaseline = firstPlayerOnlineCount - 1;
        }
        await Promise.all(pages.slice(1).map((page, index) =>
          signUpAndLogin(page, index + 1, scenarioId)
        ));

        const roomUrl = await createRoom(pages[0], playerCount, scenarioId);
        await waitForRoomParticipantCount(pages[0], 1);

        for (let index = 1; index < pages.length; index += 1) {
          // 로비 자동 새로고침과 방 입장이 서로 다른 내비게이션으로 끝나지 않았는지
          // 실제 방 URL과 방 화면 상태를 함께 확인한다.
          await joinRoomFromLobby(pages[index], roomUrl);
          await waitForRoomParticipantCount(pages[index], index + 1);
        }
        await waitForRoomReady(pages, playerCount);
        await captureScenarioScreenshot(pages[0], artifactDirectory, 'waiting-room');

        const userIds = [];
        for (const page of pages) {
          userIds.push(await readUserId(page));
        }

        lobbyPage = await contexts[0].newPage();
        await lobbyPage.goto('/rooms');
        const onlineBaseline = ONLINE_BASELINE ?? detectedOnlineBaseline ?? 0;
        await expect(lobbyPage.locator('#onlinePlayerCount')).toHaveText(
          String(onlineBaseline + playerCount),
          { timeout: 30_000 }
        );
        await lobbyPage.close();
        lobbyPage = undefined;

        const chatMessage = 'playwright-chat-' + scenarioId;
        await pages[0].locator('#chatForm input[name="content"]').fill(chatMessage);
        await pages[0].locator('#chatForm button[type="submit"]').click();
        await Promise.all(
          pages.map(page =>
            expect(page.locator('#messages')).toContainText(chatMessage, {
              timeout: 10_000
            })
          )
        );

        await expect(pages[0].locator('#startGame')).toBeVisible();
        await expect(pages[0].locator('#startGame')).toBeDisabled();
        await Promise.all(
          pages.slice(1).map(page =>
            expect(page.locator('#startGame')).toBeHidden()
          )
        );

        await pages[0].locator('#ready').click();
        await expect(pages[0].locator('#startGame')).toBeDisabled();
        await expect(pages[0].locator('#startGameNotice')).toContainText(
          '모든 참가자가 준비해야 합니다.'
        );

        await Promise.all(
          pages.slice(1).map(page => page.locator('#ready').click())
        );
        await expect(pages[0].locator('#startGame')).toBeEnabled({
          timeout: 10_000
        });

        await pages[0].locator('#startGame').click();
        await Promise.all(
          pages.map(page =>
            expect(page.locator('#roomStatus')).toHaveText('게임 중', {
              timeout: 15_000
            })
          )
        );
        await Promise.all(
          pages.map(page =>
            expect(page.locator('#gamePanel')).toBeVisible({
              timeout: 15_000
            })
          )
        );

        await waitForPhase(pages, PHASE_LABELS.ROLE, 20_000);
        await waitForSystemMessage(traces, '\uC5ED\uD560 \uD655\uC778');
        const roleState = await waitForGameState(traces[0], 'ROLE_ASSIGNMENT');
        expect(roleState.players.every(player => player.role == null)).toBeTruthy();

        await Promise.all(
          pages.map(async page => {
            await expect(page.locator('#gameRolePanel')).toBeVisible({
              timeout: 15_000
            });
            await expect(page.locator('#gameRoleLabel')).toHaveText(/\S+/, {
              timeout: 15_000
            });
          })
        );
        await captureScenarioScreenshot(pages[0], artifactDirectory, 'role-assignment');
        await confirmRoleForPage(pages[0]);
        const firstRoleErrors = traces[0].errors.length;
        await sendRawRoomFrame(pages[0], roomUrl, 'game', {
          action: 'ROLE_CONFIRM'
        });
        await expectRoomError(
          pages[0],
          traces[0],
          firstRoleErrors,
          '이미 역할을 확인했습니다.'
        );
        await confirmAllRoles(pages.slice(1));

        const rolePages = {
          MAFIA: [],
          SPY: [],
          DOCTOR: [],
          POLICE: [],
          SOLDIER: [],
          MEDIUM: [],
          CITIZEN: []
        };
        const roleLabels = [];
        for (let index = 0; index < pages.length; index += 1) {
          const roleLabel =
            ((await pages[index].locator('#gameRoleLabel').textContent()) || '').trim();
          roleLabels.push(roleLabel);
          const role = Object.entries(ROLE_LABELS)
            .find(([, label]) => roleLabel === label)?.[0];
          expect(role).toBeTruthy();
          rolePages[role].push({
            page: pages[index],
            userId: userIds[index],
            index,
            nickname: 'PW' + scenarioId + '-' + (index + 1)
          });
        }
        assertRoleAssignments(roleLabels, playerCount);
        expect(rolePages.MAFIA).toHaveLength(expectedMafiaCount(playerCount));
        const orderedMafiaPlayers = [...rolePages.MAFIA].sort((left, right) => left.index - right.index);
        for (let index = 0; index < pages.length; index += 1) {
          const page = pages[index];
          const role = Object.entries(ROLE_LABELS)
            .find(([, label]) => label === roleLabels[index])?.[0];
          const teammatesPanel = page.locator('#mafiaTeammatesPanel');
          if (role !== 'MAFIA') {
            await expect(teammatesPanel).toBeHidden();
            continue;
          }

          await expect(teammatesPanel).toBeVisible();
          const expectedTeammates = orderedMafiaPlayers
            .filter(player => player.index !== index)
            .map(player => player.nickname);
          if (expectedTeammates.length === 0) {
            await expect(page.locator('#mafiaTeammatesList')).toBeHidden();
            await expect(page.locator('#noMafiaTeammatesNotice'))
              .toHaveText('이번 게임에서 본인 외 다른 마피아는 없습니다.');
            await expect(page.locator('#noMafiaTeammatesNotice')).toBeVisible();
          } else {
            await expect(page.locator('#mafiaTeammatesList li'))
              .toHaveText(expectedTeammates);
            await expect(page.locator('#noMafiaTeammatesNotice')).toBeHidden();
          }
        }
        for (const role of ['DOCTOR', 'POLICE']) {
          expect(rolePages[role]).toHaveLength(1);
        }

        await waitForPhase(pages, PHASE_LABELS.NIGHT, 20_000);
        const firstNightState = await waitForGameState(traces[0], 'NIGHT');
        await waitForSystemMessage(traces, '\uBC24 \uC548\uB0B4');
        expect(firstNightState.receivedAt).toBeLessThan(roleState.phaseEndsAt);
        expect(firstNightState.receivedAt - roleState.receivedAt).toBeLessThan(8_000);
        await waitForPhase(pages, PHASE_LABELS.DAY, PHASE_WAIT_TIMEOUT);
        const dayState = await waitForGameState(traces[0], 'DAY_DISCUSSION');
        await waitForSystemMessage(traces, '\uB0AE \uD1A0\uB860');
        expect(dayState.receivedAt).toBeGreaterThanOrEqual(firstNightState.phaseEndsAt - 1_000);
        expect(dayState.players.every(player => player.alive)).toBeTruthy();
        expect(dayState.receivedAt - firstNightState.receivedAt).toBeGreaterThanOrEqual(2_000);
        if (FULL_TIMING_ASSERTIONS) {
          expect(firstNightState.phaseEndsAt - firstNightState.receivedAt)
            .toBeGreaterThanOrEqual(34_000);
          expect(firstNightState.phaseEndsAt - firstNightState.receivedAt)
            .toBeLessThanOrEqual(36_000);
          expect(dayState.phaseEndsAt - dayState.receivedAt).toBeGreaterThan(55_000);
          expect(dayState.phaseEndsAt - dayState.receivedAt).toBeLessThanOrEqual(65_000);
        }
        expect(dayState.players.every(player => player.role == null)).toBeTruthy();

        const mafiaUserIds = rolePages.MAFIA.map(player => player.userId);
        const mafiaTeamUserIds = [
          ...rolePages.MAFIA.map(player => player.userId),
          ...rolePages.SPY.map(player => player.userId)
        ];
        const citizenUserIds = rolePages.CITIZEN.map(player => player.userId);

        const mafiaChatMessage = 'mafia-chat-' + scenarioId;
        const mafiaPage = rolePages.MAFIA[0].page;
        await expect(mafiaPage.locator('#chatChannel option[value="MAFIA"]')).toBeAttached();
        await mafiaPage.locator('#chatChannel').selectOption('MAFIA');
        await mafiaPage.locator('#chatForm input[name="content"]').fill(mafiaChatMessage);
        await mafiaPage.locator('#chatForm button[type="submit"]').click();
        await Promise.all(
          rolePages.MAFIA.map(({ page }) =>
            expect(page.locator('#messages')).toContainText(mafiaChatMessage, {
              timeout: 10_000
            })
          )
        );
        await Promise.all(
          [
            ...rolePages.SPY,
            ...rolePages.CITIZEN,
            ...rolePages.DOCTOR,
            ...rolePages.POLICE,
            ...rolePages.SOLDIER,
            ...rolePages.MEDIUM
          ].map(({ page }) =>
            expect(page.locator('#messages')).not.toContainText(mafiaChatMessage, {
              timeout: 10_000
            })
          )
        );
        await mafiaPage.locator('#chatChannel').selectOption('PUBLIC');

        if (FULL_TIMING_ASSERTIONS) {
          await expect
            .poll(() => readTimerSeconds(pages[0]), { timeout: 5_000 })
            .toBeGreaterThanOrEqual(50);
        }
        await assertTimersAreSynchronized(pages);

        await waitForPhase(pages, PHASE_LABELS.NOMINATION, PHASE_WAIT_TIMEOUT);
        await assertTimersAreSynchronized(pages);
        const nominationState = await waitForGameState(traces[0], 'NOMINATION_VOTE');
        await waitForSystemMessage(traces, '\uC9C0\uBAA9 \uD22C\uD45C');
        if (FULL_TIMING_ASSERTIONS) {
          expect(nominationState.receivedAt - dayState.receivedAt).toBeGreaterThanOrEqual(55_000);
          expect(nominationState.phaseEndsAt - nominationState.receivedAt)
            .toBeGreaterThanOrEqual(19_000);
          expect(nominationState.phaseEndsAt - nominationState.receivedAt)
            .toBeLessThanOrEqual(21_000);
        }
        await Promise.all(
          pages.map(page =>
            expect(page.locator('#nominationAction')).toBeVisible()
          )
        );

        const initialExecutionTargetId = citizenUserIds[0];
        expect(initialExecutionTargetId).toBeTruthy();

        await submitNominationVotes(
          pages,
          userIds,
          initialExecutionTargetId,
          userIds
        );

        await waitForPhase(pages, PHASE_LABELS.DEFENSE, 25_000);
        const defenseState = await waitForGameState(traces[0], 'FINAL_DEFENSE');
        await waitForSystemMessage(traces, '\uCD5C\uC885 \uBCC0\uB860');
        expect(defenseState.nominatedUserId).toBe(initialExecutionTargetId);
        if (FULL_TIMING_ASSERTIONS) {
          expect(defenseState.phaseEndsAt - nominationState.phaseEndsAt)
            .toBeGreaterThanOrEqual(19_000);
          expect(defenseState.phaseEndsAt - nominationState.phaseEndsAt)
            .toBeLessThanOrEqual(21_000);
          expect(defenseState.phaseEndsAt - defenseState.receivedAt)
            .toBeGreaterThanOrEqual(19_000);
          expect(defenseState.phaseEndsAt - defenseState.receivedAt)
            .toBeLessThanOrEqual(21_000);
        }

        const defendantPage = pages[userIds.indexOf(initialExecutionTargetId)];
        await expect(defendantPage.locator('#finalDefenseNotice')).toContainText('전체 채널');
        const defenseMessage = 'defense-' + scenarioId;
        await defendantPage.locator('#chatChannel').selectOption('PUBLIC');
        await defendantPage.locator('#chatForm input[name="content"]').fill(defenseMessage);
        await defendantPage.locator('#chatForm button[type="submit"]').click();
        await Promise.all(pages.map(page =>
          expect(page.locator('#messages')).toContainText(defenseMessage, { timeout: 10_000 })
        ));
        const nonDefendantIndex = userIds.findIndex(id => id !== initialExecutionTargetId);
        const nonDefendantTrace = traces[nonDefendantIndex];
        const previousDefenseErrors = nonDefendantTrace.errors.length;
        await sendRawRoomMessage(pages[nonDefendantIndex], roomUrl, 'chat',
          'blocked-defense-' + scenarioId);
        await expectRoomError(pages[nonDefendantIndex], nonDefendantTrace,
          previousDefenseErrors, '최종 변론');

        await waitForPhase(pages, PHASE_LABELS.EXECUTION, 25_000);
        const executionState = await waitForGameState(traces[0], 'EXECUTION_VOTE');
        await waitForSystemMessage(traces, '\uCC98\uD615 \uD22C\uD45C');
        if (FULL_TIMING_ASSERTIONS) {
          expect(executionState.receivedAt - defenseState.receivedAt).toBeGreaterThanOrEqual(18_000);
        }
        expect(executionState.nominatedUserId).toBe(initialExecutionTargetId);
        if (FULL_TIMING_ASSERTIONS) {
          expect(executionState.phaseEndsAt - defenseState.phaseEndsAt)
            .toBeGreaterThanOrEqual(19_000);
          expect(executionState.phaseEndsAt - defenseState.phaseEndsAt)
            .toBeLessThanOrEqual(21_000);
          expect(executionState.phaseEndsAt - executionState.receivedAt)
            .toBeGreaterThanOrEqual(19_000);
          expect(executionState.phaseEndsAt - executionState.receivedAt)
            .toBeLessThanOrEqual(21_000);
        }

        await Promise.all(pages.map(page =>
          expect(page.locator('#executionAction')).toBeVisible()
        ));
        await submitExecutionVotes(
          pages,
          userIds,
          initialExecutionTargetId,
          userIds
        );

        await waitForPhase(pages, PHASE_LABELS.NIGHT, 25_000);
        await assertTimersAreSynchronized(pages);
        const nightState = await waitForGameState(traces[0], 'NIGHT', 1);
        await waitForSystemMessage(traces, '\uBC24 \uC548\uB0B4');
        if (FULL_TIMING_ASSERTIONS) {
          expect(nightState.receivedAt - executionState.receivedAt).toBeGreaterThanOrEqual(18_000);
          expect(nightState.phaseEndsAt - executionState.phaseEndsAt)
            .toBeGreaterThanOrEqual(34_000);
          expect(nightState.phaseEndsAt - executionState.phaseEndsAt)
            .toBeLessThanOrEqual(36_000);
          expect(nightState.phaseEndsAt - nightState.receivedAt)
            .toBeGreaterThanOrEqual(34_000);
          expect(nightState.phaseEndsAt - nightState.receivedAt)
            .toBeLessThanOrEqual(36_000);
        }
        await expect(pages[0].locator('#gameMessage')).toContainText('처형');
        await captureScenarioScreenshot(pages[0], artifactDirectory, 'night');

        const aliveAfterExecutionIds = nightState.players
          .filter(player => player.alive)
          .map(player => Number(player.userId));
        expect(aliveAfterExecutionIds).not.toContain(initialExecutionTargetId);

        const deadParticipantCard = pages[0].locator(
          `#memberGrid .member[data-user-id="${initialExecutionTargetId}"]`
        );
        await expect(deadParticipantCard).toHaveClass(/participant-dead/);
        await expect(deadParticipantCard.locator('small')).toHaveText('사망');
        const deadCardStyle = await deadParticipantCard.evaluate(element => {
          const cardStyle = getComputedStyle(element);
          const badgeStyle = getComputedStyle(element, '::after');
          return {
            backgroundImage: cardStyle.backgroundImage,
            borderTopColor: cardStyle.borderTopColor,
            badgeContent: badgeStyle.content
          };
        });
        expect(deadCardStyle.backgroundImage).toContain('linear-gradient');
        expect(deadCardStyle.borderTopColor).toBe('rgb(210, 122, 116)');
        expect(deadCardStyle.badgeContent).toContain('사망');
        const livingParticipantId = aliveAfterExecutionIds[0];
        if (livingParticipantId) {
          await expect(
            pages[0].locator(`#memberGrid .member[data-user-id="${livingParticipantId}"]`)
          ).not.toHaveClass(/participant-dead/);
        }

        const deadPage = pages[userIds.indexOf(initialExecutionTargetId)];
        const medium = rolePages.MEDIUM[0];
        const deadChannelRecipients = [
          deadPage,
          ...(medium ? [medium.page] : [])
        ];
        const deadChatMessage = 'dead-chat-' + scenarioId;
        await expect(deadPage.locator('#chatChannel')).toHaveValue('DEAD');
        await expect(
          deadPage.locator('#chatChannel option[value="DEAD"]')
        ).toHaveJSProperty('hidden', false);
        await expect(deadPage.locator('#chatForm button[type="submit"]')).toBeEnabled();
        await deadPage.locator('#chatForm input[name="content"]').fill(deadChatMessage);
        await deadPage.locator('#chatForm button[type="submit"]').click();
        await Promise.all(
          deadChannelRecipients.map(page =>
            expect(page.locator('#messages')).toContainText(deadChatMessage, {
              timeout: 10_000
            })
          )
        );
        await Promise.all(
          pages
            .filter(page => !deadChannelRecipients.includes(page))
            .map(page =>
              expect(page.locator('#messages')).not.toContainText(deadChatMessage, {
                timeout: 10_000
              })
            )
        );
        if (medium) {
          await captureScenarioScreenshot(medium.page, artifactDirectory, 'medium-dead-channel');
        }

        const doctor = rolePages.DOCTOR[0];
        const police = rolePages.POLICE[0];
        const spy = rolePages.SPY.find(player => aliveAfterExecutionIds.includes(player.userId));
        const survivingMafiaPlayers = rolePages.MAFIA
          .filter(player => aliveAfterExecutionIds.includes(player.userId));
        expect(survivingMafiaPlayers).toHaveLength(expectedMafiaCount(playerCount));
        const survivingMafia = survivingMafiaPlayers[0];
        expect(aliveAfterExecutionIds).toContain(doctor.userId);
        expect(aliveAfterExecutionIds).toContain(police.userId);
        if (spy) {
          expect(aliveAfterExecutionIds).toContain(spy.userId);
          await expect(spy.page.locator('#chatChannel option[value="MAFIA"]')).toBeDisabled();
          await captureScenarioScreenshot(spy.page, artifactDirectory, 'spy-channel-locked');
        }

        await expect(doctor.page.locator('#chatForm button[type="submit"]')).toBeDisabled();
        await expect(police.page.locator('#chatForm input[name="content"]')).toBeDisabled();
        await expect(doctor.page.locator('#chatChannel option[value="MAFIA"]')).toBeDisabled();
        await expect(survivingMafia.page.locator('#chatChannel')).toHaveValue('MAFIA');
        await expect(survivingMafia.page.locator('#chatChannel option[value="PUBLIC"]'))
          .toBeDisabled();

        const doctorTrace = traces[userIds.indexOf(doctor.userId)];
        const mafiaTrace = traces[userIds.indexOf(survivingMafia.userId)];
        const deadTrace = traces[userIds.indexOf(initialExecutionTargetId)];
        let previousErrors = doctorTrace.errors.length;
        await sendRawRoomMessage(doctor.page, roomUrl, 'chat', 'blocked-night-' + scenarioId);
        await expectRoomError(doctor.page, doctorTrace, previousErrors, '밤에는');
        previousErrors = doctorTrace.errors.length;
        await sendRawRoomMessage(doctor.page, roomUrl, 'mafia-chat', 'blocked-mafia-' + scenarioId);
        await expectRoomError(doctor.page, doctorTrace, previousErrors, '마피아 채팅');
        previousErrors = mafiaTrace.errors.length;
        await sendRawRoomMessage(survivingMafia.page, roomUrl, 'chat', 'blocked-public-' + scenarioId);
        await expectRoomError(survivingMafia.page, mafiaTrace, previousErrors, '밤에는');
        previousErrors = deadTrace.errors.length;
        await sendRawRoomMessage(deadPage, roomUrl, 'mafia-chat', 'blocked-dead-' + scenarioId);
        await expectRoomError(deadPage, deadTrace, previousErrors, '사망한 참가자');
        if (spy) {
          const spyTrace = traces[userIds.indexOf(spy.userId)];
          previousErrors = spyTrace.errors.length;
          await sendRawRoomMessage(spy.page, roomUrl, 'mafia-chat', 'blocked-spy-' + scenarioId);
          await expectRoomError(spy.page, spyTrace, previousErrors, '마피아 채팅');
        }

        const nightMafiaMessage = 'night-mafia-' + scenarioId;
        await survivingMafia.page.locator('#chatForm input[name="content"]').fill(nightMafiaMessage);
        await survivingMafia.page.locator('#chatForm button[type="submit"]').click();
        await expect(survivingMafia.page.locator('#messages')).toContainText(nightMafiaMessage);
        const survivingMafiaPages = survivingMafiaPlayers.map(player => player.page);
        await Promise.all(
          pages.filter(page => !survivingMafiaPages.includes(page))
            .map(page => expect(page.locator('#messages')).not.toContainText(nightMafiaMessage))
        );

        const nightVictimId = citizenUserIds.find(userId =>
          aliveAfterExecutionIds.includes(userId)
        ) || police.userId;
        expect(nightVictimId).not.toBe(survivingMafia.userId);

        const mafiaNightActions = survivingMafiaPlayers.map(player =>
          submitNightActionForPage(player.page, nightVictimId)
        );
        await Promise.all([
          ...mafiaNightActions,
          submitNightActionForPage(doctor.page, nightVictimId),
          submitNightActionForPage(police.page, survivingMafia.userId),
          ...(spy
            ? [submitNightActionForPage(spy.page, survivingMafia.userId)]
            : []),
          ...(medium
            ? [submitNightActionForPage(medium.page, initialExecutionTargetId)]
            : [])
        ]);

        const reconnectPage = pages[1];
        if (FULL_TIMING_ASSERTIONS) {
          await expect
            .poll(() => readTimerSeconds(reconnectPage), { timeout: 5_000 })
            .toBeGreaterThanOrEqual(20);
        }
        const phaseBeforeReload = FULL_TIMING_ASSERTIONS
          ? ((await reconnectPage.locator('#gamePhaseTitle').textContent()) || '').trim()
          : null;
        await reconnectPage.reload();
        await expect(reconnectPage.locator('#chatConnectionStatus')).toHaveText(
          '실시간',
          { timeout: 15_000 }
        );
        await expect(reconnectPage.locator('#gamePanel')).toBeVisible({
          timeout: 15_000
        });
        if (phaseBeforeReload) {
          await expect(reconnectPage.locator('#gamePhaseTitle')).toHaveText(
            phaseBeforeReload,
            { timeout: 15_000 }
          );
        }

        await waitForPhase(pages, PHASE_LABELS.DAY, PHASE_WAIT_TIMEOUT);
        await assertTimersAreSynchronized(pages);
        await expect(police.page.locator('#nightResultPanel')).toBeVisible({
          timeout: 10_000
        });
        await expect(police.page.locator('#nightResultFactionLabel')).toContainText(
          FACTION_LABELS.MAFIA
        );
        await Promise.all(
          pages
            .filter(page => page !== police.page && page !== spy?.page && page !== medium?.page)
            .map(page => expect(page.locator('#nightResultPanel')).toBeHidden())
        );
        if (spy) {
          const spyTrace = traces[userIds.indexOf(spy.userId)];
          const contactTraces = [
            spyTrace,
            ...survivingMafiaPlayers.map(player =>
              traces[userIds.indexOf(player.userId)]
            )
          ];
          await waitForSystemMessage(contactTraces, '접선');
          await expect(spy.page.locator('#nightResultPanel')).toBeVisible({
            timeout: 10_000
          });
          await expect(spy.page.locator('#nightResultTitle')).toHaveText('직업 조사 결과');
          await expect(spy.page.locator('#nightResultFactionLabel')).toContainText(
            FACTION_LABELS.MAFIA
          );
          await expect(spy.page.locator('#nightResultLabel')).toContainText(
            ROLE_LABELS.MAFIA
          );
          await expect(spy.page.locator('#nightResultMafiaList')).toContainText(
            '확인된 마피아'
          );
          await expect(spy.page.locator('#chatChannel option[value="MAFIA"]')).toBeEnabled();

          const spyContactMessage = 'spy-contact-' + scenarioId;
          await spy.page.locator('#chatChannel').selectOption('MAFIA');
          await spy.page.locator('#chatForm input[name="content"]').fill(spyContactMessage);
          await spy.page.locator('#chatForm button[type="submit"]').click();
          await Promise.all(
            [spy, ...survivingMafiaPlayers].map(({ page }) =>
              expect(page.locator('#messages')).toContainText(spyContactMessage, {
                timeout: 10_000
              })
            )
          );
          const contactedMafiaPages = [
            spy.page,
            ...survivingMafiaPlayers.map(player => player.page)
          ];
          await Promise.all(
            pages
              .filter(page => !contactedMafiaPages.includes(page))
              .map(page =>
                expect(page.locator('#messages')).not.toContainText(spyContactMessage, {
                  timeout: 10_000
                })
              )
          );
          await captureScenarioScreenshot(spy.page, artifactDirectory, 'spy-contact-unlocked');
        }
        if (medium) {
          await expect(medium.page.locator('#nightResultPanel')).toBeVisible({
            timeout: 10_000
          });
          await expect(medium.page.locator('#nightResultTitle')).toHaveText('직업 조사 결과');
          await expect(medium.page.locator('#nightResultFactionLabel')).toContainText(
            FACTION_LABELS.CITIZEN
          );
          await expect(medium.page.locator('#nightResultLabel')).toContainText(
            ROLE_LABELS.CITIZEN
          );
          await expect(medium.page.locator('#nightResultMafiaList')).toBeHidden();
          await captureScenarioScreenshot(medium.page, artifactDirectory, 'medium-investigation');
        }
        await expect(pages[0].locator('#gameActions')).toBeHidden();
        const nextDayState = await waitForGameState(
          traces[0],
          'DAY_DISCUSSION',
          1
        );
        if (FULL_TIMING_ASSERTIONS) {
          expect(nextDayState.phaseEndsAt - nightState.phaseEndsAt)
            .toBeGreaterThanOrEqual(59_000);
          expect(nextDayState.phaseEndsAt - nightState.phaseEndsAt)
            .toBeLessThanOrEqual(61_000);
          expect(nextDayState.receivedAt - nightState.receivedAt).toBeGreaterThanOrEqual(28_000);
        }
        expect(nextDayState.message).toContain('의사의 보호');
        expect(
          nextDayState.players.find(
            player => Number(player.userId) === nightVictimId
          )?.alive
        ).toBe(true);

        const aliveAfterNightIds = nextDayState.players
          .filter(player => player.alive)
          .map(player => Number(player.userId));
        let currentDayState = nextDayState;
        let finishedState = null;
        while (!finishedState) {
          const currentAliveIds = currentDayState.players
            .filter(player => player.alive)
            .map(player => Number(player.userId));
          const executionTargetId = mafiaTeamUserIds.find(userId =>
            currentAliveIds.includes(userId)
          );
          expect(executionTargetId).toBeTruthy();

          const nominationOccurrence = traces[0].gameStates
            .filter(state => state.phase === 'NOMINATION_VOTE')
            .length;
          await waitForPhase(pages, PHASE_LABELS.NOMINATION, PHASE_WAIT_TIMEOUT);
          await waitForGameState(traces[0], 'NOMINATION_VOTE', nominationOccurrence, 25_000);
          await submitNominationVotes(
            pages,
            userIds,
            executionTargetId,
            currentAliveIds
          );
          await waitForPhase(pages, PHASE_LABELS.DEFENSE, 25_000);
          await waitForPhase(pages, PHASE_LABELS.EXECUTION, 25_000);
          const finalExecutionState = await waitForMatchingGameState(
            traces[0],
            'EXECUTION_VOTE',
            state => state.nominatedUserId === executionTargetId
          );
          expect(finalExecutionState.nominatedUserId).toBe(executionTargetId);
          await submitExecutionVotes(
            pages,
            userIds,
            executionTargetId,
            currentAliveIds
          );

          const nextPhase = await waitForOneOfPhases(
            [pages[0]], [PHASE_LABELS.NIGHT, PHASE_LABELS.FINISHED], 25_000
          );
          if (nextPhase === PHASE_LABELS.FINISHED) {
            const finishedOccurrence = traces[0].gameStates
              .filter(state => state.phase === 'FINISHED').length;
            finishedState = await waitForGameState(
              traces[0], 'FINISHED', Math.max(0, finishedOccurrence - 1), 15_000
            );
            break;
          }

          const nextDayOccurrence = traces[0].gameStates
            .filter(state => state.phase === 'DAY_DISCUSSION').length;
          await waitForPhase(pages, PHASE_LABELS.NIGHT, 25_000);
          await waitForPhase(pages, PHASE_LABELS.DAY, PHASE_WAIT_TIMEOUT);
          currentDayState = await waitForGameState(
            traces[0], 'DAY_DISCUSSION', nextDayOccurrence, 25_000
          );
          expect(currentDayState.players.some(player =>
            Number(player.userId) === executionTargetId && !player.alive
          )).toBeTruthy();
        }

        await waitForPhase(pages, PHASE_LABELS.FINISHED, 20_000);
        await waitForSystemMessage(traces, '\uAC8C\uC784 \uC885\uB8CC');
        expect(finishedState.gameOver).toBe(true);
        expect(finishedState.winningFaction).toBe('CITIZEN');
        expect(finishedState.players.every(player => typeof player.role === 'string')).toBeTruthy();

        await Promise.all(
          pages.map(async page => {
            await expect(page.locator('#gameResultPanel')).toBeVisible({
              timeout: 15_000
            });
            await expect(page.locator('#gameWinnerLabel')).toHaveText(
              '\uC2DC\uBBFC \uC9C4\uC601',
              { timeout: 15_000 }
            );
            await expect(page.locator('#gameResultRoleLabel')).not.toHaveText('-', {
              timeout: 15_000
            });
            await expect(page.locator('#gameResultAliveLabel')).toHaveText(
              /생존|사망/,
              { timeout: 15_000 }
            );
            await expect(page.locator('#gameRoleRevealPanel')).toBeVisible({
              timeout: 15_000
            });
            await expect(page.locator('#roomStatus')).toHaveText('대기 중', {
              timeout: 15_000
            });
            await expect(page.locator('#ready')).toBeEnabled({ timeout: 15_000 });
            await expect(page.locator('#chatChannel')).toHaveValue('PUBLIC');
            await expect(page.locator('#chatChannel option[value="MAFIA"]')).toBeHidden();
            await expect(page.locator('#chatChannel option[value="MAFIA"]')).toBeDisabled();
            await expect(page.locator('#chatChannel option[value="DEAD"]')).toBeHidden();
            await expect(page.locator('#chatChannel option[value="DEAD"]')).toBeDisabled();
          })
        );
        await captureScenarioScreenshot(pages[0], artifactDirectory, 'finished');

        const firstCompletionStats = await Promise.all(pages.map(async (page, index) => {
          const stats = await readOwnProfileStats(page);
          const won = (finishedState.winningFaction === 'MAFIA')
            === mafiaTeamUserIds.includes(userIds[index]);
          expect(stats).toEqual({
            totalGames: 1,
            wins: won ? 1 : 0,
            losses: won ? 0 : 1,
            experience: 1000 + (won ? 500 : 100),
            level: 1
          });
          return stats;
        }));

        if (shouldReplayPlayerCount(playerCount)) {
          await startReplayGame(pages, traces);
          await Promise.all(pages.map(async (page, index) => {
            const previousStats = firstCompletionStats[index];
            const stats = await readOwnProfileStats(page);
            expect(stats.totalGames).toBe(previousStats.totalGames + 1);
            expect(stats.wins + stats.losses).toBe(stats.totalGames);
            expect(stats.experience).toBe(previousStats.experience
              + (stats.wins - previousStats.wins) * 500
              + (stats.losses - previousStats.losses) * 100);
            expect(stats.level).toBe(Math.max(1, Math.floor(stats.experience / 1000)));
          }));
        }
      } finally {
        if (lobbyPage) {
          await lobbyPage.close().catch(() => {});
        }
        await captureFinalScenarioScreenshot(pages[0], artifactDirectory);
        await Promise.all(contexts.map(context => context.close().catch(() => {})));
        await saveScenarioVideo(hostVideo, artifactDirectory, 'core-flow.webm');
      }
    });
  });
}

if (RUN_EXTENDED_SCENARIOS && PLAYER_COUNTS.includes(6)) {
  test('closing a waiting-room tab changes six players to the five-player role threshold', async ({ browser }) => {
    test.setTimeout(150_000);
    const scenarioId = 'th6-' + RUN_ID;
    const artifactDirectory = path.join(ARTIFACT_ROOT, 'six-to-five-threshold');
    const contexts = [];
    const pages = [];
    const traces = [];
    let hostVideo;

    await mkdir(artifactDirectory, { recursive: true });

    try {
      for (let index = 0; index < 6; index += 1) {
        const context = await createTrackedContext(browser, {
          videoDirectory: index === 0 ? artifactDirectory : undefined
        });
        const page = await context.newPage();
        contexts.push(context);
        pages.push(page);
        traces.push(attachGameTrace(page));
        if (index === 0) {
          hostVideo = page.video();
        }
      }
      await Promise.all(pages.map((page, index) =>
        signUpAndLogin(page, index, scenarioId)
      ));

      const roomUrl = await createRoom(pages[0], 6, scenarioId);
      await waitForRoomParticipantCount(pages[0], 1);
      for (let index = 1; index < pages.length; index += 1) {
        await joinRoomFromLobby(pages[index], roomUrl);
        await waitForRoomParticipantCount(pages[index], index + 1);
      }
      await waitForRoomReady(pages, 6);
      await captureScenarioScreenshot(pages[0], artifactDirectory, 'six-player-waiting-room');

      await pages[5].close();
      await waitForRoomReady(pages.slice(0, 5), 5);
      await Promise.all(pages.slice(0, 5).map(page => page.locator('#ready').click()));
      await expect(pages[0].locator('#startGame')).toBeEnabled();
      await pages[0].locator('#startGame').click();
      await waitForPhase(pages.slice(0, 5), PHASE_LABELS.ROLE, 20_000);
      await confirmAllRoles(pages.slice(0, 5));
      await waitForPhase(pages.slice(0, 5), PHASE_LABELS.NIGHT, 20_000);
      await waitForGameState(traces[0], 'NIGHT', 0, 25_000);
      await waitForPhase(pages.slice(0, 5), PHASE_LABELS.DAY, PHASE_WAIT_TIMEOUT);
      const roles = await Promise.all(pages.slice(0, 5).map(async page =>
        (await page.locator('#gameRoleLabel').textContent()).trim()
      ));
      assertRoleAssignments(roles, 5);
      await captureScenarioScreenshot(pages[0], artifactDirectory, 'five-player-role-threshold');
    } finally {
      await captureFinalScenarioScreenshot(pages[0], artifactDirectory);
      await Promise.all(contexts.map(context => context.close().catch(() => {})));
      await saveScenarioVideo(hostVideo, artifactDirectory, 'six-to-five-threshold.webm');
    }
  });

  test('browser deadline, reconnect grace, and expired night action', async ({ browser }) => {
    test.setTimeout(5 * 60 * 1000);
    const scenarioId = 'gr6-' + RUN_ID;
    const artifactDirectory = path.join(ARTIFACT_ROOT, 'deadline-reconnect');
    const contexts = [];
    const pages = [];
    const traces = [];
    let hostVideo;

    await mkdir(artifactDirectory, { recursive: true });

    try {
      for (let index = 0; index < 6; index += 1) {
        const context = await createTrackedContext(browser, {
          videoDirectory: index === 0 ? artifactDirectory : undefined
        });
        const page = await context.newPage();
        contexts.push(context);
        pages.push(page);
        traces.push(attachGameTrace(page));
        if (index === 0) {
          hostVideo = page.video();
        }
      }
      await Promise.all(pages.map((page, index) =>
        signUpAndLogin(page, index, scenarioId)
      ));

      const roomUrl = await createRoom(pages[0], 6, scenarioId);
      await waitForRoomParticipantCount(pages[0], 1);
      for (let index = 1; index < pages.length; index += 1) {
        await joinRoomFromLobby(pages[index], roomUrl);
        await waitForRoomParticipantCount(pages[index], index + 1);
      }
      await waitForRoomReady(pages, 6);
      await captureScenarioScreenshot(pages[0], artifactDirectory, 'six-player-waiting-room');
      const userIds = await Promise.all(pages.map(readUserId));
      await Promise.all(pages.map(page => page.locator('#ready').click()));
      await expect(pages[0].locator('#startGame')).toBeEnabled();
      await pages[0].locator('#startGame').click();
      await waitForPhase(pages, PHASE_LABELS.ROLE, 20_000);
      const roleState = await waitForGameState(traces[0], 'ROLE_ASSIGNMENT');
      expect(roleState.players.every(player => player.role == null)).toBeTruthy();
      await confirmAllRoles(pages);
      await waitForPhase(pages, PHASE_LABELS.NIGHT, 20_000);
      await waitForGameState(traces[0], 'NIGHT', 0, 25_000);
      await waitForPhase(pages, PHASE_LABELS.DAY, PHASE_WAIT_TIMEOUT);
      await waitForGameState(traces[0], 'DAY_DISCUSSION', 0, PHASE_WAIT_TIMEOUT);
      const roles = await Promise.all(pages.map(async page =>
        (await page.locator('#gameRoleLabel').textContent()).trim()
      ));
      assertRoleAssignments(roles, 6);
      await captureScenarioScreenshot(pages[0], artifactDirectory, 'six-player-role-assignment');

      const mafiaIndexes = roles.flatMap((role, index) =>
        role === ROLE_LABELS.MAFIA ? [index] : []
      );
      const spyIndexes = roles.flatMap((role, index) =>
        role === ROLE_LABELS.SPY ? [index] : []
      );
      const citizenIndexes = roles.flatMap((role, index) =>
        role === ROLE_LABELS.CITIZEN ? [index] : []
      );
      const observerIndex = roles.findIndex(role => role === ROLE_LABELS.DOCTOR);
      const observer = pages[observerIndex];
      const observerTrace = traces[observerIndex];
      expect(mafiaIndexes).toHaveLength(1);
      expect(spyIndexes).toHaveLength(1);
      expect(citizenIndexes).toHaveLength(1);

      await waitForPhase([observer], PHASE_LABELS.NOMINATION, 75_000);
      const nomination = await waitForGameState(observerTrace, 'NOMINATION_VOTE');
      await delay(Math.max(0, nomination.phaseEndsAt - Date.now() - 200));
      const sentAt = Date.now();
      await Promise.all(citizenIndexes.map((index, position) =>
        sendRawRoomFrame(pages[index], roomUrl, 'game', {
          targetUserId: userIds[mafiaIndexes[position]]
        })
      ));
      expect(sentAt).toBeGreaterThanOrEqual(nomination.phaseEndsAt - 1500);
      const phaseAfterNomination = await waitForOneOfPhases(
        [observer], [PHASE_LABELS.NIGHT, PHASE_LABELS.DEFENSE, PHASE_LABELS.EXECUTION], 20_000
      );
      if (phaseAfterNomination !== PHASE_LABELS.NIGHT) {
        await waitForPhase([observer], PHASE_LABELS.NIGHT, 55_000);
      }

      const night = await waitForGameState(observerTrace, 'NIGHT', 1);
      expect(night.phaseEndsAt - Date.now()).toBeGreaterThan(27_000);
      const returningMafia = mafiaIndexes[0];
      const departingSpy = spyIndexes[0];
      await submitNightActionForPage(pages[returningMafia], userIds[citizenIndexes[0]]);
      await pages[returningMafia].close();
      const earlyDisconnectAt = Date.now();
      const returnPage = await contexts[returningMafia].newPage();
      await returnPage.goto(roomUrl);
      await expect(returnPage.locator('#gamePanel')).toBeVisible({ timeout: 8_000 });
      await expect(returnPage.locator('#chatConnectionStatus')).toHaveText('실시간', {
        timeout: 8_000
      });
      expect(Date.now() - earlyDisconnectAt).toBeLessThan(30_000);
      expect(Date.now()).toBeLessThan(night.phaseEndsAt);

      await submitNightActionForPage(pages[departingSpy], userIds[citizenIndexes[0]]);
      await pages[departingSpy].close();
      const lateDisconnectAt = Date.now();
      await waitUntil(
        () => observerTrace.gameStates.find(state =>
          state.players.some(player =>
            Number(player.userId) === userIds[departingSpy] && !player.alive
          )
        ),
        40_000,
        'departed player removal after reconnect grace'
      );
      expect(Date.now() - lateDisconnectAt).toBeGreaterThanOrEqual(29_000);
      const spectatorPage = await contexts[departingSpy].newPage();
      await spectatorPage.goto(roomUrl);
      await expect(spectatorPage.locator('#gamePanel')).toBeVisible({ timeout: 8_000 });
      await expect(spectatorPage.locator('#chatConnectionStatus')).toHaveText('실시간', {
        timeout: 8_000
      });
      await expect(spectatorPage.locator('#submitNightAction')).toBeDisabled();

      const nextDay = await waitForGameState(observerTrace, 'DAY_DISCUSSION', 1, 45_000);
      const alive = userId => nextDay.players.find(player =>
        Number(player.userId) === userId
      )?.alive;
      expect(alive(userIds[returningMafia])).toBe(true);
      expect(alive(userIds[departingSpy])).toBe(false);
      expect(alive(userIds[citizenIndexes[0]])).toBe(false);
      expect(alive(userIds[observerIndex])).toBe(true);
      await captureScenarioScreenshot(pages[0], artifactDirectory, 'reconnect-grace-result');
    } finally {
      await captureFinalScenarioScreenshot(pages[0], artifactDirectory);
      await Promise.all(contexts.map(context => context.close().catch(() => {})));
      await saveScenarioVideo(hostVideo, artifactDirectory, 'deadline-reconnect.webm');
    }
  });
}
