import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import {
  parseConfiguredUiCapacity,
  shouldCaptureScreenshots,
  shouldCaptureVideo
} from './e2e-profile.js';
import { resolveTestOutputDirectory } from './test-output-path.js';

const baseURL = process.env.BASE_URL || 'http://127.0.0.1:8080';
const password = process.env.E2E_PASSWORD || 'MafiaTest2026!';
const capacity = parseConfiguredUiCapacity();
const runId = process.env.E2E_RUN_ID || `local-${Date.now().toString(36)}-${process.pid}`;
const nicknameRunKey = runId.replace(/[^a-zA-Z0-9]/g, '').slice(-24) || 'qa';
const roomLayoutNickname = index => `L-${nicknameRunKey}-${index}`;
const artifactDirectory = resolveTestOutputDirectory(`room-layout-test-${capacity}`, runId);
const roleCompositionByCapacity = {
  4: [['마피아', 1], ['경찰', 1], ['의사', 1], ['시민', 1]],
  5: [['마피아', 1], ['경찰', 1], ['의사', 1], ['시민', 2]],
  6: [['마피아', 1], ['스파이', 1], ['경찰', 1], ['의사', 1], ['군인', 1], ['시민', 1]],
  7: [['마피아', 2], ['경찰', 1], ['의사', 1], ['군인', 1], ['영매사', 1], ['시민', 1]],
  8: [['마피아', 2], ['스파이', 1], ['경찰', 1], ['의사', 1], ['군인', 1], ['영매사', 1], ['시민', 1]]
};

async function expectRoleComposition(page, expectedCapacity) {
  await page.locator('#gameHelpButton').click();
  const modal = page.locator('#gameHelpModal');
  await expect(modal).toBeVisible();
  await expect(modal.locator('#gameHelpCompositionCapacity')).toHaveText(`${expectedCapacity}명`);
  const group = modal.locator(`#gameHelpRoleCompositionGroups [data-capacity="${expectedCapacity}"]`);
  await expect(group).toBeVisible();
  for (const [roleName, count] of roleCompositionByCapacity[expectedCapacity]) {
    const roleCard = group.locator('.col').filter({ hasText: roleName });
    await expect(roleCard).toContainText(`${count}명`);
  }
  await modal.getByRole('button', { name: '확인', exact: true }).click();
  await expect(modal).toBeHidden();
}

async function captureScreenshot(page, name, fullPage = true) {
  if (!shouldCaptureScreenshots()) {
    return;
  }
  await page.screenshot({
    path: path.join(artifactDirectory, `${name}.png`),
    fullPage
  });
}

async function closeFirstVisitPatchNotes(page) {
  const modal = page.locator('#patchNotesModal');
  await expect(modal).toBeVisible({ timeout: 5_000 });
  await modal.locator('.patch-notes-footer-actions button[data-bs-dismiss="modal"]').click();
  await expect(modal).toBeHidden({ timeout: 5_000 });
}

test(`waiting and started room layout (${capacity} players)`, async ({ browser }) => {
  test.setTimeout(120_000);
  await mkdir(artifactDirectory, { recursive: true });

  const contexts = [];
  const pages = [];
  let hostVideo;

  try {
    for (let index = 0; index < capacity; index += 1) {
      const contextOptions = {
        baseURL,
        viewport: { width: 1440, height: 1000 }
      };
      if (index === 0 && shouldCaptureVideo()) {
        contextOptions.recordVideo = {
          dir: artifactDirectory,
          size: { width: 1440, height: 1000 }
        };
      }
      const context = await browser.newContext(contextOptions);
      contexts.push(context);
      const page = await context.newPage();
      pages.push(page);
      if (index === 0) hostVideo = page.video();

      const email = `playwright.${runId}.room-layout.${index}@example.com`;
      await page.goto('/signup');
      const nickname = roomLayoutNickname(index);
      expect(nickname.length).toBeLessThanOrEqual(30);
      await page.locator('#nickname').fill(nickname);
      await page.locator('#signupEmail').fill(email);
      await page.locator('#signupPassword').fill(password);
      await page.locator('#passwordConfirm').fill(password);
      await page.locator('#agreement').check();
      await page.locator('#signupForm button[type="submit"]').click();
      await expect(page).toHaveURL(/\/login(?:\?signup)?$/);

      await page.locator('#email').fill(email);
      await page.locator('#password').fill(password);
      await page.locator('form[action="/login"] button[type="submit"]').click();
      await expect(page).toHaveURL(/\/rooms(?:\?.*)?$/);
      await expect(page.locator('.user-menu-toggle .user-menu-level')).toHaveText('Lv. 1');
    }

    const duplicateSignupContext = await browser.newContext({ baseURL });
    contexts.push(duplicateSignupContext);
    const duplicateSignupPage = await duplicateSignupContext.newPage();
    await duplicateSignupPage.goto('/signup');
    await duplicateSignupPage.locator('#nickname').fill(roomLayoutNickname(0));
    await duplicateSignupPage.locator('#signupEmail').fill(`playwright.${runId}.room-layout.nickname-check@example.com`);
    await duplicateSignupPage.locator('#signupPassword').fill(password);
    await duplicateSignupPage.locator('#passwordConfirm').fill(password);
    await duplicateSignupPage.locator('#agreement').check();
    await duplicateSignupPage.locator('#signupForm button[type="submit"]').click();
    await expect(duplicateSignupPage).toHaveURL(/\/signup$/);
    await expect(duplicateSignupPage.getByRole('alert'))
      .toHaveText('이미 사용 중인 닉네임입니다.');

    const host = pages[0];
    await closeFirstVisitPatchNotes(host);
    await host.locator('.user-menu-toggle').click();
    await host.locator('.user-menu-dropdown a[href^="/users/"]').click();
    await expect(host).toHaveURL(/\/users\/\d+$/);
    const profileStats = host.locator('.app-profile-hero + section article');
    await expect(profileStats).toHaveCount(4);
    await expect(profileStats.nth(0).locator('strong')).toHaveText('0');
    await expect(profileStats.nth(1).locator('strong')).toHaveText('0');
    await expect(profileStats.nth(2).locator('strong')).toHaveText('0');
    await expect(profileStats.nth(3).locator('h2')).toContainText('Lv. 1');
    await expect(profileStats.nth(3).locator('.d-flex > strong')).toHaveText('1000 XP');

    await host.goto('/rooms/new');
    await host.locator('#title').fill(`Playwright MVP UI room-layout ${runId}`);
    await host.locator(`label[for="capacity-${capacity}"]`).click();
    await host.locator('form').filter({ has: host.locator('#title') })
      .locator('button[type="submit"]').click();
    await expect(host).toHaveURL(/\/rooms\/\d+$/);
    const roomUrl = host.url();

    for (let index = 1; index < pages.length; index += 1) {
      const page = pages[index];
      await page.goto(roomUrl, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('#ready')).toBeEnabled({ timeout: 15_000 });
      await expect(host.locator('#roomMemberCount')).toHaveText(String(index + 1), {
        timeout: 15_000
      });
    }
    await expect(host.locator('#roomMemberCount')).toHaveText(String(capacity));
    await expect(host.locator('#memberGrid .member')).toHaveCount(capacity);
    await expect(host.locator('#gamePanelPlaceholder')).toBeVisible();
    await expect(host.locator('#gamePanelPlaceholder')).toHaveText('GAME');
    await expect(host.locator('.room-settings')).toHaveCount(0);
    await expect(host.locator('#gameRolePanel')).toBeHidden();

    await expect(host.locator('#invite')).toHaveCount(0);
    await expect(host.locator('#gameHelpButton')).toBeVisible();
    await expect(host.locator('#roomSettingsButton')).toBeVisible();
    await expect(pages[1].locator('#roomSettingsButton')).toHaveCount(0);
    expect(await host.locator('#gameHelpButton').evaluate(element => element.nextElementSibling?.id))
      .toBe('roomSettingsButton');
    await expectRoleComposition(host, capacity);

    await host.locator('#roomSettingsButton').click();
    await expect(host.locator('#roomSettingsModal')).toBeVisible();
    await expect(host.locator('#roomSettingsMaxPlayers option')).toHaveCount(5);

    if (capacity > 4) {
      await host.locator('#roomSettingsMaxPlayers').evaluate((select, invalidCapacity) => {
        select.value = invalidCapacity;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }, String(capacity - 1));
      await expect(host.locator('#roomSettingsCapacityWarning')).toBeVisible();
      await expect(host.locator('#roomSettingsCapacityWarning')).toContainText(String(capacity));
      await expect(host.locator('#roomSettingsSaveButton')).toBeDisabled();
    }

    await host.locator('#roomSettingsMaxPlayers').selectOption(String(capacity));
    await expect(host.locator('#roomSettingsCapacityWarning')).toBeHidden();
    await expect(host.locator('#roomSettingsSaveButton')).toBeEnabled();
    await host.locator('#roomSettingsPasswordEnabled').check();
    await host.locator('#roomSettingsPassword').fill(password);
    await host.locator('#roomSettingsSaveButton').click();
    await expect(host).toHaveURL(roomUrl);
    await expect(host.locator('#roomSettingsModal')).toBeVisible();
    await expect(host.locator('#roomSettingsModal .modal-footer [role="status"]'))
      .toHaveText('방 설정이 저장되었습니다.');
    await expect(host.locator('#roomLockIndicator')).toBeVisible();
    await expect(pages[1].locator('#roomLockIndicator')).toBeVisible({ timeout: 15_000 });

    await host.reload({ waitUntil: 'domcontentloaded' });
    await expect(host.locator('#roomSettingsButton')).toBeVisible({ timeout: 15_000 });
    await host.locator('#roomSettingsButton').click();
    await expect(host.locator('#roomSettingsModal')).toBeVisible();
    await expect(host.locator('#roomSettingsPasswordEnabled')).toBeChecked();
    await host.locator('#roomSettingsPassword').fill(`${password}-changed`);
    await host.locator('#roomSettingsSaveButton').click();
    await expect(host.locator('#roomSettingsModal')).toBeVisible();
    await expect(host.locator('#roomSettingsModal .modal-footer [role="status"]'))
      .toHaveText('방 설정이 저장되었습니다.');
    await expect(pages[1].locator('#roomLockIndicator')).toBeVisible({ timeout: 15_000 });

    await host.locator('#roomSettingsPasswordEnabled').uncheck();
    await host.locator('#roomSettingsSaveButton').click();
    await expect(host.locator('#roomSettingsModal')).toBeVisible();
    await expect(host.locator('#roomSettingsModal .modal-footer [role="status"]'))
      .toHaveText('방 설정이 저장되었습니다.');
    await expect(host.locator('#roomLockIndicator')).toBeHidden();
    await expect(pages[1].locator('#roomLockIndicator')).toBeHidden({ timeout: 15_000 });
    await host.locator('#roomSettingsModal button[data-bs-dismiss="modal"]').first().click();
    await expect(host.locator('#roomSettingsModal')).toBeHidden();

    if (capacity < 8) {
      const updatedCapacity = capacity + 1;
      await host.locator('#roomSettingsButton').click();
      await host.locator('#roomSettingsMaxPlayers').selectOption(String(updatedCapacity));
      await host.locator('#roomSettingsSaveButton').click();
      await expect(host.locator('#roomCapacity')).toHaveText(String(updatedCapacity), {
        timeout: 15_000
      });
      await expect(pages[1].locator('#roomCapacity')).toHaveText(String(updatedCapacity), {
        timeout: 15_000
      });
      await host.locator('#roomSettingsModal button[data-bs-dismiss="modal"]').first().click();
      await expectRoleComposition(host, updatedCapacity);
    }

    const backLink = host.locator('.room-back-link');
    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute('href', '/rooms');
    await expect(backLink).toContainText('게임 목록으로');
    const dayVisual = await host.evaluate(() => {
      const link = document.querySelector('.room-back-link');
      if (!link) throw new Error('The room back link is missing.');
      const linkStyle = getComputedStyle(link);
      const bodyStyle = getComputedStyle(document.body);
      return {
        link: {
          color: linkStyle.color,
          backgroundColor: linkStyle.backgroundColor,
          borderColor: linkStyle.borderTopColor
        },
        body: {
          backgroundColor: bodyStyle.backgroundColor,
          transitionProperty: bodyStyle.transitionProperty,
          transitionDuration: bodyStyle.transitionDuration
        }
      };
    });
    expect(dayVisual.body.transitionProperty).toContain('background-color');
    expect(dayVisual.body.transitionDuration).toContain('0.8s');

    await host.evaluate(() => document.body.classList.add('night-phase'));
    await host.waitForTimeout(900);
    const nightVisual = await host.evaluate(() => {
      const linkStyle = getComputedStyle(document.querySelector('.room-back-link'));
      return {
        link: {
          color: linkStyle.color,
          backgroundColor: linkStyle.backgroundColor,
          borderColor: linkStyle.borderTopColor
        },
        bodyBackgroundColor: getComputedStyle(document.body).backgroundColor
      };
    });
    expect(nightVisual.bodyBackgroundColor).not.toBe(dayVisual.body.backgroundColor);
    expect(nightVisual.link).toEqual(dayVisual.link);
    await captureScreenshot(host, 'night-background-and-back-link');

    await host.evaluate(() => document.body.classList.remove('night-phase'));
    await host.waitForTimeout(900);
    await expect.poll(
      () => host.evaluate(() => getComputedStyle(document.body).backgroundColor)
    ).toBe(dayVisual.body.backgroundColor);
    await captureScreenshot(host, 'restored-background-and-back-link');
    await expect(host.locator('#startGame')).toBeVisible();
    await expect(pages[1].locator('#startGame')).toBeHidden();
    const hostButtonPositions = await host.evaluate(() => {
      const ready = document.querySelector('#ready').getBoundingClientRect();
      const start = document.querySelector('#startGame').getBoundingClientRect();
      const participants = document.querySelector('.participant-panel').getBoundingClientRect();
      return {
        readyY: ready.y,
        startY: start.y,
        readyBottom: ready.bottom,
        participantsBottom: participants.bottom
      };
    });
    expect(hostButtonPositions.readyY).toBe(hostButtonPositions.startY);
    expect(hostButtonPositions.readyBottom).toBeLessThanOrEqual(hostButtonPositions.participantsBottom);
    const waitingPositions = await host.evaluate(() => {
      const participants = document.querySelector('.participant-panel').getBoundingClientRect();
      const placeholder = document.querySelector('#gamePanelPlaceholder').getBoundingClientRect();
      const left = document.querySelector('.room-left-column').getBoundingClientRect();
      const right = document.querySelector('.room-chat-column').getBoundingClientRect();
      return {
        participants: { x: participants.x, y: participants.y, width: participants.width, bottom: participants.bottom },
        placeholder: { x: placeholder.x, y: placeholder.y, width: placeholder.width, height: placeholder.height, bottom: placeholder.bottom },
        columns: { leftY: left.y, leftBottom: left.bottom, leftHeight: left.height, rightY: right.y, rightBottom: right.bottom, rightHeight: right.height }
      };
    });
    expect(waitingPositions.placeholder.x).toBe(waitingPositions.participants.x);
    expect(waitingPositions.placeholder.width).toBe(waitingPositions.participants.width);
    expect(waitingPositions.placeholder.y).toBeGreaterThan(waitingPositions.participants.bottom);
    expect(Math.abs(waitingPositions.placeholder.height - 300)).toBeLessThanOrEqual(1);
    expect(Math.abs(waitingPositions.placeholder.bottom - waitingPositions.columns.leftBottom))
      .toBeLessThanOrEqual(1);
    expect(Math.abs(waitingPositions.columns.leftY - waitingPositions.columns.rightY))
      .toBeLessThanOrEqual(1);
    expect(Math.abs(waitingPositions.columns.leftBottom - waitingPositions.columns.rightBottom))
      .toBeLessThanOrEqual(1);
    expect(waitingPositions.columns.leftHeight).toBe(waitingPositions.columns.rightHeight);
    await captureScreenshot(host, 'waiting-room');

    await host.setViewportSize({ width: 390, height: 844 });
    const mobilePositions = await host.evaluate(() => {
      const game = document.querySelector('#gamePanelPlaceholder').getBoundingClientRect();
      const left = document.querySelector('.room-left-column').getBoundingClientRect();
      const chat = document.querySelector('.room-chat-column').getBoundingClientRect();
      return { gameHeight: game.height, leftBottom: left.bottom, chatY: chat.y };
    });
    expect(mobilePositions.gameHeight).toBeGreaterThanOrEqual(300);
    expect(mobilePositions.chatY).toBeGreaterThanOrEqual(mobilePositions.leftBottom);
    await host.setViewportSize({ width: 1440, height: 1000 });

    await Promise.all(pages.map(async page => {
      await expect(page.locator('#ready')).toBeEnabled();
      await page.locator('#ready').click();
    }));
    await expect(host.locator('#startGame')).toBeEnabled();
    await host.locator('#startGame').click();
    await expect(host.locator('#gamePanel')).toBeVisible();
    await expect(host.locator('#gamePanelPlaceholder')).toBeHidden();
    await expect(host.locator('#gameRolePanel')).toBeVisible();
    await expect(host.locator('#gameRoleLabel')).not.toBeEmpty();
    await expect(host.locator('#gameActionStatus')).toBeHidden();
    await expect(host.locator('#confirmGameRole')).toBeVisible();
    await expect(host.locator('#confirmGameRole')).toBeEnabled();
    await expect(host.locator('#confirmGameRole')).toHaveText('역할 확인 완료');
    await captureScreenshot(host, 'started-room');

    const positions = await host.evaluate(() => {
      const rectangle = selector => {
        const { x, y, width, height } = document.querySelector(selector).getBoundingClientRect();
        return { x, y, width, height };
      };
      return {
        participants: rectangle('.participant-panel'),
        ready: rectangle('#ready'),
        role: rectangle('#gameRolePanel'),
        confirmRole: rectangle('#confirmGameRole'),
        game: rectangle('#gamePanel'),
        leftColumn: rectangle('.room-left-column'),
        rightColumn: rectangle('.room-chat-column')
      };
    });
    expect(positions.leftColumn.height).toBe(positions.rightColumn.height);
    expect(Math.abs(positions.leftColumn.y - positions.rightColumn.y)).toBeLessThanOrEqual(1);
    expect(Math.abs(
      positions.leftColumn.y + positions.leftColumn.height
      - positions.rightColumn.y - positions.rightColumn.height
    )).toBeLessThanOrEqual(1);
    expect(Math.abs(positions.game.height - 300)).toBeLessThanOrEqual(1);
    expect(Math.abs(positions.game.y + positions.game.height
      - (positions.rightColumn.y + positions.rightColumn.height))).toBeLessThanOrEqual(1);
    expect(positions.ready.y + positions.ready.height).toBeLessThanOrEqual(
      positions.participants.y + positions.participants.height
    );
    expect(positions.game.x).toBe(positions.participants.x);
    expect(positions.game.y).toBeGreaterThan(positions.participants.y + positions.participants.height);
    expect(positions.role.y).toBeGreaterThan(positions.game.y);
    expect(positions.role.y + positions.role.height).toBeGreaterThanOrEqual(
      positions.game.y + positions.game.height - 8
    );
    expect(positions.confirmRole.y + positions.confirmRole.height).toBeGreaterThanOrEqual(
      positions.role.y + positions.role.height - 24
    );
  } finally {
    if (pages[0]) {
      if (shouldCaptureScreenshots()) {
        await pages[0].screenshot({
          path: path.join(artifactDirectory, 'final-state.png'),
          fullPage: true
        }).catch(() => {});
      }
    }
    await Promise.all(contexts.map(context => context.close().catch(() => {})));
    if (shouldCaptureVideo()) {
      if (!hostVideo) {
        throw new Error('QA evidence video is not available for the room-layout scenario.');
      }
      await hostVideo.saveAs(path.join(artifactDirectory, 'room-layout-transition.webm'));
    }
  }
});
