import { defineConfig } from '@playwright/test';
import path from 'node:path';
import { PROFILE_CONFIG } from './test/e2e/e2e-profile.js';
import { currentOutputDate } from './test/e2e/test-output-path.js';

const runId = process.env.E2E_RUN_ID || `local-${Date.now().toString(36)}-${process.pid}`;
const outputStage = process.env.PLAYWRIGHT_OUTPUT_STAGE || 'local';

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
    trace: PROFILE_CONFIG.trace
  }
});
