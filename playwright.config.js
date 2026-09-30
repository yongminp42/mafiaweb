import { defineConfig } from '@playwright/test';
import path from 'node:path';
import { E2E_RUN_ID, PROFILE_CONFIG } from './test/e2e/e2e-profile.js';
import { currentOutputDate } from './test/e2e/test-output-path.js';

const runId = E2E_RUN_ID;
const outputStage = process.env.PLAYWRIGHT_OUTPUT_STAGE || 'local';
// Full scenarios save separate screenshots and video, so keep the trace without duplicate frames.
const trace = PROFILE_CONFIG.trace === 'on'
  ? { mode: 'on', snapshots: true, screenshots: false }
  : PROFILE_CONFIG.trace;

if (!['local', 'discovery', 'core', 'ui'].includes(outputStage)) {
  throw new Error('PLAYWRIGHT_OUTPUT_STAGE must be local, discovery, core, or ui.');
}

export default defineConfig({
  testDir: './test/e2e',
  outputDir: path.resolve(
    'output',
    'test_output',
    currentOutputDate(),
    `playwright-${runId}`,
    outputStage
  ),
  use: {
    trace
  }
});
