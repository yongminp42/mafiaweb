import path from 'node:path';

export function currentOutputDate(date = new Date()) {
  const pad = value => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function resolveTestOutputDirectory(testName, runId, date = new Date()) {
  return path.resolve(
    'output',
    'test_output',
    currentOutputDate(date),
    `${testName}-${runId}`
  );
}
