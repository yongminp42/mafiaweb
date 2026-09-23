import { expect, test } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import {
  PROFILE_CONFIG,
  shouldCaptureScreenshots,
  shouldCaptureVideo
} from './e2e-profile.js';
import { resolveTestOutputDirectory } from './test-output-path.js';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:8080';
const PASSWORD = process.env.E2E_PASSWORD || 'MafiaTest2026!';
const RUN_ID = process.env.E2E_RUN_ID || `local-${Date.now().toString(36)}-${process.pid}`;

test('role slot is visible before game and chat scrolls without growing the page', async ({ browser }) => {
  test.skip(!PROFILE_CONFIG.runChatScroll, 'chat-scroll runs in Regression and Full QA only.');

  const artifactDirectory = resolveTestOutputDirectory('chat-scroll-test', RUN_ID);
  await mkdir(artifactDirectory, { recursive: true });

  const context = await browser.newContext({
    baseURL: BASE_URL,
    viewport: { width: 1440, height: 1000 },
    ...(shouldCaptureVideo()
      ? {
        recordVideo: {
          dir: artifactDirectory,
          size: { width: 1440, height: 1000 }
        }
      }
      : {})
  });
  const page = await context.newPage();
  const video = page.video();

  try {
    const nickname = `Scroll-${RUN_ID}`;
    const email = `playwright.${RUN_ID}.chat-scroll.0@example.com`;

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

    await page.goto('/rooms/new');
    await page.locator('#title').fill(`Playwright MVP UI chat-scroll ${RUN_ID}`);
    await page.locator('label[for="capacity-4"]').click();
    await page.locator('form').filter({ has: page.locator('#title') })
      .locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/\/rooms\/\d+$/);

    await expect(page.locator('#gamePanelPlaceholder')).toBeVisible();
    await expect(page.locator('#gamePanelPlaceholder')).toHaveText('GAME');
    await expect(page.locator('#gameRolePanel')).toBeHidden();
    await expect(page.locator('#gameRoleLabel')).toBeEmpty();
    const input = page.locator('#chatForm input[name="content"]');
    await expect(input).toBeEnabled({ timeout: 15_000 });
    const chatTypography = await page.evaluate(() => {
      const channel = document.querySelector('#chatChannel');
      const messageInput = document.querySelector('#chatForm input[name="content"]');
      const mafiaOption = channel?.querySelector('option[value="MAFIA"]');
      if (!channel || !messageInput || !mafiaOption) {
        throw new Error('Chat composer elements are missing');
      }

      const channelStyle = getComputedStyle(channel);
      const probe = document.createElement('span');
      probe.textContent = mafiaOption.textContent || '';
      probe.style.position = 'absolute';
      probe.style.visibility = 'hidden';
      probe.style.whiteSpace = 'nowrap';
      probe.style.fontFamily = channelStyle.fontFamily;
      probe.style.fontSize = channelStyle.fontSize;
      probe.style.fontWeight = channelStyle.fontWeight;
      probe.style.fontStyle = channelStyle.fontStyle;
      probe.style.letterSpacing = channelStyle.letterSpacing;
      document.body.append(probe);
      const textWidth = probe.getBoundingClientRect().width;
      const availableWidth = channel.clientWidth
        - parseFloat(channelStyle.paddingLeft)
        - parseFloat(channelStyle.paddingRight);
      probe.remove();

      return { textWidth, availableWidth };
    });
    expect(chatTypography.textWidth).toBeLessThanOrEqual(chatTypography.availableWidth);
    const inputBox = await input.boundingBox();
    expect(inputBox?.height).toBeGreaterThanOrEqual(40);
    if (shouldCaptureScreenshots()) {
      await page.screenshot({
        path: path.join(artifactDirectory, 'waiting-room.png'),
        fullPage: false
      });
    }

    const readMetrics = () => page.locator('#messages').evaluate(messages => ({
      clientHeight: messages.clientHeight,
      scrollHeight: messages.scrollHeight,
      scrollTop: messages.scrollTop,
      pageScrollHeight: document.documentElement.scrollHeight,
      messageCount: messages.querySelectorAll('.chat-message').length
    }));

    const before = await readMetrics();
    for (let index = 1; index <= PROFILE_CONFIG.chatMessageCount; index += 1) {
      await input.fill(`scroll-test-${index}`);
      await input.press('Enter');
    }

    const expectedMessageCount = Math.min(PROFILE_CONFIG.chatMessageCount, 200);
    await expect(page.locator('#messages .chat-message')).toHaveCount(expectedMessageCount, {
      timeout: 20_000
    });
    await expect.poll(
      async () => (await readMetrics()).scrollTop,
      { timeout: 10_000 }
    ).toBeGreaterThan(0);

    const after = await readMetrics();
    expect(after.scrollHeight).toBeGreaterThan(after.clientHeight);
    expect(after.scrollTop).toBeGreaterThan(0);
    expect(after.scrollTop + after.clientHeight).toBeGreaterThanOrEqual(after.scrollHeight - 1);
    expect(after.messageCount).toBe(expectedMessageCount);
    expect(Math.abs(after.pageScrollHeight - before.pageScrollHeight)).toBeLessThanOrEqual(1);

    if (shouldCaptureScreenshots()) {
      await page.screenshot({
        path: path.join(artifactDirectory, 'chat-scroll.png'),
        fullPage: false
      });
    }
  } finally {
    if (shouldCaptureScreenshots()) {
      await page.screenshot({
        path: path.join(artifactDirectory, 'final-state.png'),
        fullPage: false
      }).catch(() => {});
    }
    await context.close();
    if (shouldCaptureVideo()) {
      if (!video) {
        throw new Error('QA evidence video is not available for the chat-scroll scenario.');
      }
      await video.saveAs(path.join(artifactDirectory, 'chat-scroll.webm'));
    }
  }
});
