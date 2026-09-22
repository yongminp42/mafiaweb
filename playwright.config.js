import { defineConfig } from '@playwright/test';
import path from 'node:path';

const runId = process.env.E2E_RUN_ID || `local-${Date.now().toString(36)}-${process.pid}`;

export default defineConfig({
  testDir: './test/e2e',
  outputDir: path.resolve('test-results', 'playwright', runId),
  use: {
    trace: 'on'
  }
});
