import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createDom, loadScript, readClientScript } from './test-helpers.js';

const stompSource = await readClientScript('stomp-client.js');

test('STOMP frame headers are escaped and parser handles split frames', () => {
  const dom = createDom('<!doctype html><html><body></body></html>');
  try {
    loadScript(dom, stompSource);
    const { createFrame, createFrameParser } = dom.window.MafiaStomp;
    const frame = createFrame('SEND', {
      'header:key': 'line\nvalue\\'
    }, 'payload');

    assert.equal(frame, 'SEND\nheader\\ckey:line\\nvalue\\\\\n\npayload\0');

    const received = [];
    const parse = createFrameParser(parsedFrame => received.push(parsedFrame));
    const secondFrame = createFrame('MESSAGE', { destination: '/topic/test' }, 'second');
    const combined = frame + secondFrame;
    parse(combined.slice(0, 8));
    assert.equal(received.length, 0);
    parse(combined.slice(8));

    assert.deepEqual(JSON.parse(JSON.stringify(received)), [
      {
        command: 'SEND',
        headers: { 'header:key': 'line\nvalue\\' },
        body: 'payload'
      },
      {
        command: 'MESSAGE',
        headers: { destination: '/topic/test' },
        body: 'second'
      }
    ]);
  } finally {
    dom.window.close();
  }
});

test('STOMP parser ignores heartbeat chunks until a complete frame arrives', () => {
  const dom = createDom('<!doctype html><html><body></body></html>');
  try {
    loadScript(dom, stompSource);
    const { createFrame, createFrameParser } = dom.window.MafiaStomp;
    const received = [];
    const parse = createFrameParser(parsedFrame => received.push(parsedFrame));

    parse('\n');
    assert.deepEqual(received, []);

    parse(createFrame('CONNECTED', { version: '1.2' }));
    assert.deepEqual(JSON.parse(JSON.stringify(received)), [{
      command: 'CONNECTED',
      headers: { version: '1.2' },
      body: ''
    }]);
  } finally {
    dom.window.close();
  }
});

test('reconnect delay uses bounded exponential backoff with jitter', () => {
  const dom = createDom('<!doctype html><html><body></body></html>');
  try {
    loadScript(dom, stompSource);
    const { getReconnectDelay } = dom.window.MafiaStomp;

    assert.ok(getReconnectDelay(0) >= 1000 && getReconnectDelay(0) < 1250);
    assert.ok(getReconnectDelay(3) >= 8000 && getReconnectDelay(3) < 8250);
    assert.ok(getReconnectDelay(99) >= 30000 && getReconnectDelay(99) < 30250);
  } finally {
    dom.window.close();
  }
});
