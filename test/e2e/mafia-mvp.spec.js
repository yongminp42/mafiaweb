import { expect, test } from '@playwright/test';

/*
 * MAFIAGAME MVP 다중 세션 E2E 초안
 *
 * 실행 예:
 *   npx playwright install chromium
 *   $env:PLAYER_COUNTS = '5,6'
 *   npx playwright test test/e2e/mafia-mvp.spec.js
 *
 * ONLINE_BASELINE을 지정하지 않으면 첫 테스트 세션이 로비에 연결된 뒤
 * 확인한 온라인 인원에서 테스트 세션 1명을 제외해 기준 인원을 자동 계산한다.
 * 외부 접속자 수가 고정된 환경에서는 $env:ONLINE_BASELINE = '1'처럼 직접 지정할 수 있다.
 *
 * 이 스크립트는 다중 브라우저의 방 입장·게임 시작·낮/투표/밤 페이즈·재접속을 검증한다.
 * 역할별 개인 큐, 밤 행동 권한, 승패·결과 세부 검증은 Java 서비스 테스트와
 * JavaScript 테스트에서 별도로 검증한다.
 */

const MIN_PLAYERS = 4;
const MAX_PLAYERS = 8;
const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:8080';
const PASSWORD = process.env.E2E_PASSWORD || 'MafiaTest2026!';
const RUN_ID = process.env.E2E_RUN_ID || Date.now().toString(36);
const configuredOnlineBaseline = process.env.ONLINE_BASELINE?.trim();
const ONLINE_BASELINE = configuredOnlineBaseline
  ? Number(configuredOnlineBaseline)
  : null;
const PLAYER_COUNTS = parsePlayerCounts(
  process.env.PLAYER_COUNTS || process.env.PLAYER_COUNT || '5,6'
);

if (ONLINE_BASELINE !== null
    && (!Number.isSafeInteger(ONLINE_BASELINE) || ONLINE_BASELINE < 0)) {
  throw new Error('ONLINE_BASELINE은 0 이상의 정수여야 합니다.');
}

test.use({ baseURL: BASE_URL });
test.describe.configure({ mode: 'serial' });

function parsePlayerCounts(value) {
  const values = String(value)
    .split(',')
    .map(item => item.trim());
  const counts = values.map(item => Number(item));

  if (values.length === 0
      || values.some(value => value === '')
    || counts.some(count => !Number.isInteger(count)
      || count < MIN_PLAYERS
      || count > MAX_PLAYERS)) {
    throw new Error(
      `PLAYER_COUNTS는 ${MIN_PLAYERS}~${MAX_PLAYERS} 범위의 숫자 목록이어야 합니다. 예: 5,6`
    );
  }
  return [...new Set(counts)];
}

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
    presenceStates: []
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
          } else if (destination.endsWith('/presence')) {
            trace.presenceStates.push(message);
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
  DOCTOR: '\uC758\uC0AC',
  POLICE: '\uACBD\uCC30',
  CITIZEN: '\uC2DC\uBBFC'
};

const PHASE_LABELS = {
  DAY: '\uB0AE',
  NOMINATION: '\uC9C0\uBAA9 \uD22C\uD45C',
  EXECUTION: '\uCC98\uD615 \uD22C\uD45C',
  NIGHT: '\uBC24',
  FINISHED: '\uAC8C\uC784 \uC885\uB8CC'
};

function expectedMafiaCount(playerCount) {
  return playerCount >= 6 ? 2 : 1;
}

function assertRoleAssignments(roleLabels, playerCount) {
  const expected = {
    MAFIA: expectedMafiaCount(playerCount),
    DOCTOR: 1,
    POLICE: 1,
    CITIZEN: playerCount - expectedMafiaCount(playerCount) - 2
  };
  const actual = Object.fromEntries(
    Object.entries(ROLE_LABELS).map(([role, label]) => [
      role,
      roleLabels.filter(value => value === label).length
    ])
  );

  expect(roleLabels).toHaveLength(playerCount);
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

async function submitNightActionForPage(page, targetId) {
  await expect(page.locator('#nightAction')).toBeVisible();
  await page.locator('#nightTarget').selectOption(String(targetId));
  await expect(page.locator('#submitNightAction')).toBeEnabled();
  await page.locator('#submitNightAction').click();
  await expect(page.locator('#submitNightAction')).toBeDisabled();
}

async function startReplayGame(pages, traces) {
  const nextDayOccurrence = traces[0].gameStates
    .filter(state => state.phase === 'DAY_DISCUSSION')
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

  const secondDayState = await waitForGameState(
    traces[0],
    'DAY_DISCUSSION',
    nextDayOccurrence,
    15_000
  );
  expect(secondDayState.phaseEndsAt - secondDayState.receivedAt)
    .toBeGreaterThan(55_000);

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
}

for (const playerCount of PLAYER_COUNTS) {
  test.describe.serial('MVP ' + playerCount + '인 핵심 게임 흐름', () => {
    test('인증부터 한 사이클까지 동기화 검증', async ({ browser }) => {
      test.setTimeout(8 * 60 * 1000);

      const scenarioId = playerCount + '-' + RUN_ID;
      const contexts = [];
      const pages = [];
      const traces = [];
      let lobbyPage;
      let detectedOnlineBaseline = null;

      try {
        for (let index = 0; index < playerCount; index += 1) {
          const context = await browser.newContext();
          const page = await context.newPage();
          contexts.push(context);
          pages.push(page);
          traces.push(attachGameTrace(page));
          await signUpAndLogin(page, index, scenarioId);

          if (index === 0 && ONLINE_BASELINE === null) {
            const firstPlayerOnlineCount = await waitForOnlinePlayerCount(traces[0]);
            detectedOnlineBaseline = firstPlayerOnlineCount - 1;
          }
        }

        const roomUrl = await createRoom(pages[0], playerCount, scenarioId);
        await waitForRoomParticipantCount(pages[0], 1);

        for (let index = 1; index < pages.length; index += 1) {
          await pages[index].goto(roomUrl);
          await waitForRoomParticipantCount(pages[index], index + 1);
        }
        await waitForRoomReady(pages, playerCount);

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

        const rolePages = {
          MAFIA: [],
          DOCTOR: [],
          POLICE: [],
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
          rolePages[role].push({ page: pages[index], userId: userIds[index] });
        }
        assertRoleAssignments(roleLabels, playerCount);
        expect(rolePages.MAFIA).toHaveLength(expectedMafiaCount(playerCount));
        for (const role of ['DOCTOR', 'POLICE']) {
          expect(rolePages[role]).toHaveLength(1);
        }

        const mafiaUserIds = rolePages.MAFIA.map(player => player.userId);
        const citizenUserIds = rolePages.CITIZEN.map(player => player.userId);

        await waitForPhase(pages, PHASE_LABELS.DAY, 15_000);
        await expect
          .poll(() => readTimerSeconds(pages[0]), { timeout: 5_000 })
          .toBeGreaterThanOrEqual(50);
        await assertTimersAreSynchronized(pages);
        const dayState = await waitForGameState(traces[0], 'DAY_DISCUSSION');
        expect(dayState.phaseEndsAt - dayState.receivedAt).toBeGreaterThan(55_000);

        await waitForPhase(pages, PHASE_LABELS.NOMINATION, 70_000);
        await assertTimersAreSynchronized(pages);
        await Promise.all(
          pages.map(page =>
            expect(page.locator('#nominationAction')).toBeVisible()
          )
        );

        const initialExecutionTargetId = rolePages.MAFIA.length === 2
          ? mafiaUserIds[0]
          : citizenUserIds[0];
        expect(initialExecutionTargetId).toBeTruthy();

        await submitNominationVotes(
          pages,
          userIds,
          initialExecutionTargetId,
          userIds
        );

        const nominationState = await waitForGameState(traces[0], 'NOMINATION_VOTE');
        await waitForPhase(pages, PHASE_LABELS.EXECUTION, 20_000);
        const executionState = await waitForGameState(traces[0], 'EXECUTION_VOTE');
        expect(executionState.nominatedUserId).toBe(initialExecutionTargetId);
        expect(executionState.phaseEndsAt - nominationState.phaseEndsAt)
          .toBeGreaterThanOrEqual(14_000);
        expect(executionState.phaseEndsAt - nominationState.phaseEndsAt)
          .toBeLessThanOrEqual(16_000);

        await Promise.all(pages.map(page =>
          expect(page.locator('#executionAction')).toBeVisible()
        ));
        await submitExecutionVotes(
          pages,
          userIds,
          initialExecutionTargetId,
          userIds
        );

        await waitForPhase(pages, PHASE_LABELS.NIGHT, 20_000);
        await assertTimersAreSynchronized(pages);
        const nightState = await waitForGameState(traces[0], 'NIGHT');
        expect(nightState.phaseEndsAt - executionState.phaseEndsAt)
          .toBeGreaterThanOrEqual(29_000);
        expect(nightState.phaseEndsAt - executionState.phaseEndsAt)
          .toBeLessThanOrEqual(31_000);
        await expect(pages[0].locator('#gameMessage')).toContainText('처형');

        const aliveAfterExecutionIds = nightState.players
          .filter(player => player.alive)
          .map(player => Number(player.userId));
        expect(aliveAfterExecutionIds).not.toContain(initialExecutionTargetId);

        const doctor = rolePages.DOCTOR[0];
        const police = rolePages.POLICE[0];
        const survivingMafia = rolePages.MAFIA
          .find(player => aliveAfterExecutionIds.includes(player.userId));
        expect(survivingMafia).toBeTruthy();
        expect(aliveAfterExecutionIds).toContain(doctor.userId);
        expect(aliveAfterExecutionIds).toContain(police.userId);

        const nightVictimId = citizenUserIds.find(userId =>
          aliveAfterExecutionIds.includes(userId)
        ) || police.userId;
        expect(nightVictimId).not.toBe(survivingMafia.userId);

        await Promise.all([
          submitNightActionForPage(survivingMafia.page, nightVictimId),
          submitNightActionForPage(doctor.page, nightVictimId),
          submitNightActionForPage(police.page, survivingMafia.userId)
        ]);

        await expect(police.page.locator('#nightResultPanel')).toBeVisible({
          timeout: 10_000
        });
        await expect(police.page.locator('#nightResultLabel')).toContainText(
          ROLE_LABELS.MAFIA
        );
        await Promise.all(
          pages
            .filter(page => page !== police.page)
            .map(page => expect(page.locator('#nightResultPanel')).toBeHidden())
        );

        const reconnectPage = pages[1];
        await expect
          .poll(() => readTimerSeconds(reconnectPage), { timeout: 5_000 })
          .toBeGreaterThanOrEqual(20);
        const phaseBeforeReload = (
          (await reconnectPage.locator('#gamePhaseTitle').textContent()) || ''
        ).trim();
        await reconnectPage.reload();
        await expect(reconnectPage.locator('#chatConnectionStatus')).toHaveText(
          '실시간',
          { timeout: 15_000 }
        );
        await expect(reconnectPage.locator('#gamePanel')).toBeVisible({
          timeout: 15_000
        });
        await expect(reconnectPage.locator('#gamePhaseTitle')).toHaveText(
          phaseBeforeReload,
          { timeout: 15_000 }
        );

        await waitForPhase(pages, PHASE_LABELS.DAY, 70_000);
        await assertTimersAreSynchronized(pages);
        await expect(pages[0].locator('#gameActions')).toBeHidden();
        const nextDayState = await waitForGameState(
          traces[0],
          'DAY_DISCUSSION',
          1
        );
        expect(nextDayState.phaseEndsAt - nightState.phaseEndsAt)
          .toBeGreaterThanOrEqual(59_000);
        expect(nextDayState.phaseEndsAt - nightState.phaseEndsAt)
          .toBeLessThanOrEqual(61_000);
        expect(nextDayState.message).toContain('의사의 보호');
        expect(
          nextDayState.players.find(
            player => Number(player.userId) === nightVictimId
          )?.alive
        ).toBe(true);

        const aliveAfterNightIds = nextDayState.players
          .filter(player => player.alive)
          .map(player => Number(player.userId));
        const finalMafiaUserId = mafiaUserIds.find(userId =>
          aliveAfterNightIds.includes(userId)
        );
        expect(finalMafiaUserId).toBeTruthy();

        await waitForPhase(pages, PHASE_LABELS.NOMINATION, 70_000);
        await submitNominationVotes(
          pages,
          userIds,
          finalMafiaUserId,
          aliveAfterNightIds
        );
        await waitForPhase(pages, PHASE_LABELS.EXECUTION, 20_000);
        const finalExecutionState = await waitForMatchingGameState(
          traces[0],
          'EXECUTION_VOTE',
          state => state.nominatedUserId === finalMafiaUserId
        );
        expect(finalExecutionState.nominatedUserId).toBe(finalMafiaUserId);
        await submitExecutionVotes(
          pages,
          userIds,
          finalMafiaUserId,
          aliveAfterNightIds
        );

        await waitForPhase(pages, PHASE_LABELS.FINISHED, 20_000);
        const finishedState = await waitForGameState(
          traces[0],
          'FINISHED',
          0,
          15_000
        );
        expect(finishedState.gameOver).toBe(true);
        expect(finishedState.winningFaction).toBe('CITIZEN');

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
              /생존|탈락/,
              { timeout: 15_000 }
            );
            await expect(page.locator('#roomStatus')).toHaveText('대기 중', {
              timeout: 15_000
            });
            await expect(page.locator('#ready')).toBeEnabled({ timeout: 15_000 });
          })
        );

        if (playerCount === 4) {
          await startReplayGame(pages, traces);
        }
      } finally {
        if (lobbyPage) {
          await lobbyPage.close().catch(() => {});
        }
        await Promise.all(contexts.map(context => context.close()));
      }
    });
  });
}
