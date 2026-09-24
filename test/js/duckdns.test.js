import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const duckdnsDirectory = fileURLToPath(new URL('../../ops/duckdns/', import.meta.url));
const updaterPath = path.join(duckdnsDirectory, 'update-duckdns.sh');
const hasPosixBash = process.platform !== 'win32'
  && spawnSync('bash', ['--version'], { stdio: 'ignore' }).status === 0;

test('DuckDNS systemd timer and updater retain the expected security settings', async () => {
  const [timer, service, updater] = await Promise.all([
    readFile(path.join(duckdnsDirectory, 'mafiagame-duckdns.timer'), 'utf8'),
    readFile(path.join(duckdnsDirectory, 'mafiagame-duckdns.service'), 'utf8'),
    readFile(updaterPath, 'utf8')
  ]);

  assert.match(timer, /OnBootSec=30s/);
  assert.match(timer, /OnUnitActiveSec=5min/);
  assert.match(timer, /Persistent=true/);
  assert.match(service, /DynamicUser=yes/);
  assert.match(service, /EnvironmentFile=-\/etc\/mafiagame\/duckdns\.env/);
  assert.match(updater, /curl --config -/);
  assert.match(updater, /umask 077/);
  assert.match(updater, /last_attempt_at=%s/);
  assert.match(updater, /status=%s/);
});

test('DuckDNS updater hides its token and preserves last success on a rejected update', {
  skip: hasPosixBash ? false : 'Updater integration requires a POSIX shell.'
}, async () => {
  const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), 'mafiagame-duckdns-'));
  const mockBinDirectory = path.join(temporaryDirectory, 'bin');
  const stateDirectory = path.join(temporaryDirectory, 'state');
  const argumentsFile = path.join(temporaryDirectory, 'curl-arguments');
  const token = 'qa-token-never-log-this';
  const mockCurl = [
    '#!/bin/sh',
    'printf "%s\\n" "$@" > "$CURL_ARGUMENTS_FILE"',
    'cat >/dev/null',
    'printf "%s" "$CURL_RESPONSE"',
    ''
  ].join('\n');

  try {
    await mkdir(mockBinDirectory);
    await writeFile(path.join(mockBinDirectory, 'curl'), mockCurl, { mode: 0o755 });

    const runUpdater = response => spawnSync('bash', [updaterPath], {
      cwd: duckdnsDirectory,
      encoding: 'utf8',
      env: {
        ...process.env,
        PATH: `${mockBinDirectory}${path.delimiter}${process.env.PATH ?? ''}`,
        CURL_ARGUMENTS_FILE: argumentsFile,
        CURL_RESPONSE: response,
        DUCKDNS_DOMAIN: 'mafiagame-qa',
        DUCKDNS_STATE_DIR: stateDirectory,
        DUCKDNS_TOKEN: token
      }
    });

    const success = runUpdater('OK');
    assert.equal(success.status, 0, success.stderr);
    const successfulState = await readFile(path.join(stateDirectory, 'last-result'), 'utf8');
    const lastSuccessAt = successfulState.match(/^last_success_at=(.+)$/m)?.[1];
    const curlArguments = await readFile(argumentsFile, 'utf8');
    assert.ok(lastSuccessAt);
    assert.match(successfulState, /^status=OK$/m);
    assert.deepEqual(curlArguments.trim().split('\n').slice(0, 2), ['--config', '-']);
    assert.doesNotMatch(`${curlArguments}${success.stdout}${success.stderr}${successfulState}`, /qa-token-never-log-this/);

    const rejected = runUpdater('KO');
    assert.equal(rejected.status, 1);
    const rejectedState = await readFile(path.join(stateDirectory, 'last-result'), 'utf8');
    assert.match(rejectedState, /^status=KO$/m);
    assert.equal(rejectedState.match(/^last_success_at=(.+)$/m)?.[1], lastSuccessAt);
    assert.doesNotMatch(`${rejected.stdout}${rejected.stderr}${rejectedState}`, /qa-token-never-log-this/);
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
});
