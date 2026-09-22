import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const baseURL = process.env.BASE_URL || 'http://127.0.0.1:8080';
const password = process.env.E2E_PASSWORD || 'MafiaTest2026!';
const capacity = Number(process.env.E2E_CAPACITY || 4);
const runId = process.env.E2E_RUN_ID || `local-${Date.now().toString(36)}-${process.pid}`;
const artifactDirectory = path.resolve(`output/room-layout-test-${capacity}-${runId}`);

test(`waiting and started room layout (${capacity} players)`, async ({ browser }) => {
  test.setTimeout(90_000);
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
      if (index === 0) {
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
      await page.locator('#nickname').fill(`Layout-${runId}-${index}`);
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
    }

    const host = pages[0];
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
    await expect(host.locator('#gameRolePanel')).toBeHidden();
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
    await host.screenshot({
      path: path.join(artifactDirectory, 'night-background-and-back-link.png'),
      fullPage: true
    });

    await host.evaluate(() => document.body.classList.remove('night-phase'));
    await host.waitForTimeout(900);
    await expect.poll(
      () => host.evaluate(() => getComputedStyle(document.body).backgroundColor)
    ).toBe(dayVisual.body.backgroundColor);
    await host.screenshot({
      path: path.join(artifactDirectory, 'restored-background-and-back-link.png'),
      fullPage: true
    });
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
        placeholder: { x: placeholder.x, y: placeholder.y, width: placeholder.width },
        columns: { leftHeight: left.height, rightHeight: right.height }
      };
    });
    expect(waitingPositions.placeholder.x).toBe(waitingPositions.participants.x);
    expect(waitingPositions.placeholder.width).toBe(waitingPositions.participants.width);
    expect(waitingPositions.placeholder.y).toBeGreaterThan(waitingPositions.participants.bottom);
    expect(waitingPositions.columns.leftHeight).toBe(waitingPositions.columns.rightHeight);
    await host.screenshot({
      path: path.join(artifactDirectory, 'waiting-room.png'),
      fullPage: true
    });

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
    await host.screenshot({
      path: path.join(artifactDirectory, 'started-room.png'),
      fullPage: true
    });

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
      await pages[0].screenshot({
        path: path.join(artifactDirectory, 'final-state.png'),
        fullPage: true
      }).catch(() => {});
    }
    await Promise.all(contexts.map(context => context.close().catch(() => {})));
    if (!hostVideo) {
      throw new Error('QA evidence video is not available for the room-layout scenario.');
    }
    await hostVideo.saveAs(path.join(artifactDirectory, 'room-layout-transition.webm'));
  }
});
