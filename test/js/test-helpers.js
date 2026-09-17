import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { JSDOM } from 'jsdom';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export async function readClientScript(fileName) {
  return readFile(path.join(projectRoot, 'src/main/resources/static/js', fileName), 'utf8');
}

export class FakeWebSocket {
  static OPEN = 1;
  static CLOSED = 3;
  static instances = [];

  constructor(url) {
    this.url = url;
    this.readyState = 0;
    this.sent = [];
    this.listeners = new Map();
    FakeWebSocket.instances.push(this);
  }

  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) ?? [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  send(message) {
    if (this.readyState !== FakeWebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
    this.sent.push(message);
  }

  open() {
    this.readyState = FakeWebSocket.OPEN;
    this.dispatch('open');
  }

  receive(data) {
    this.dispatch('message', { data });
  }

  close() {
    this.readyState = FakeWebSocket.CLOSED;
    this.dispatch('close');
  }

  dispatch(type, event = {}) {
    for (const listener of this.listeners.get(type) ?? []) {
      listener(event);
    }
  }
}

export function createDom(html) {
  FakeWebSocket.instances = [];
  const dom = new JSDOM(html, {
    runScripts: 'outside-only',
    url: 'http://localhost/rooms/7'
  });
  dom.window.WebSocket = FakeWebSocket;
  dom.window.setInterval = () => 0;
  dom.window.clearInterval = () => {};
  return dom;
}

export function loadScript(dom, source) {
  dom.window.eval(source);
}

export function parseSentFrame(rawFrame) {
  const withoutTerminator = rawFrame.endsWith('\0')
    ? rawFrame.slice(0, -1)
    : rawFrame;
  const separator = withoutTerminator.indexOf('\n\n');
  const headerPart = separator < 0 ? withoutTerminator : withoutTerminator.slice(0, separator);
  const body = separator < 0 ? '' : withoutTerminator.slice(separator + 2);
  const lines = headerPart.split('\n');
  const command = lines.shift();
  const headers = Object.fromEntries(lines.map(line => {
    const index = line.indexOf(':');
    return [line.slice(0, index), line.slice(index + 1)];
  }));
  return { command, headers, body };
}
