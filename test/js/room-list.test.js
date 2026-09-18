import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  createDom,
  FakeWebSocket,
  loadScript,
  readClientScript,
  parseSentFrame
} from './test-helpers.js';

const stompSource = await readClientScript('stomp-client.js');
const roomListSource = await readClientScript('room-list.js');

function roomListMarkup() {
  return `<!doctype html>
    <html><body>
      <span id="onlinePlayerCount">0</span>
      <article class="room-card" data-room-id="1">
        <span data-room-player-count>5</span>
      </article>
      <article class="room-card" data-room-id="2">
        <span data-room-player-count>4</span>
      </article>
    </body></html>`;
}

test('room list subscribes to lobby presence and applies live counts', () => {
  const dom = createDom(roomListMarkup());
  try {
    loadScript(dom, stompSource);
    loadScript(dom, roomListSource);
    const socket = FakeWebSocket.instances[0];
    const { createFrame } = dom.window.MafiaStomp;

    socket.open();
    assert.equal(parseSentFrame(socket.sent[0]).command, 'CONNECT');

    socket.receive(createFrame('CONNECTED', { 'heart-beat': '0,0' }));
    const sentAfterConnect = socket.sent.slice(1).map(parseSentFrame);
    assert.deepEqual(sentAfterConnect.map(frame => frame.command), ['SUBSCRIBE', 'SEND']);
    assert.equal(sentAfterConnect[0].headers.destination, '/topic/rooms/presence');
    assert.equal(sentAfterConnect[1].headers.destination, '/app/rooms/presence');

    socket.receive(createFrame(
      'MESSAGE',
      { destination: '/topic/rooms/presence' },
      JSON.stringify([
        { roomId: 1, currentPlayers: 2 },
        { roomId: 2, currentPlayers: 1 }
      ])
    ));

    assert.equal(dom.window.document.querySelector('[data-room-id="1"] [data-room-player-count]').textContent, '2');
    assert.equal(dom.window.document.querySelector('[data-room-id="2"] [data-room-player-count]').textContent, '1');
    assert.equal(dom.window.document.querySelector('#onlinePlayerCount').textContent, '3');
  } finally {
    dom.window.close();
  }
});

test('room list applies the server online player count', () => {
  const dom = createDom(roomListMarkup());
  try {
    loadScript(dom, stompSource);
    loadScript(dom, roomListSource);
    const socket = FakeWebSocket.instances[0];
    const { createFrame } = dom.window.MafiaStomp;

    socket.open();
    socket.receive(createFrame('CONNECTED', { 'heart-beat': '0,0' }));
    socket.receive(createFrame(
      'MESSAGE',
      { destination: '/topic/rooms/presence' },
      JSON.stringify({ onlinePlayers: 1 })
    ));

    assert.equal(dom.window.document.querySelector('#onlinePlayerCount').textContent, '1');
  } finally {
    dom.window.close();
  }
});

test('room list removes a room when live count becomes zero', () => {
  const dom = createDom(roomListMarkup());
  try {
    loadScript(dom, stompSource);
    loadScript(dom, roomListSource);
    const socket = FakeWebSocket.instances[0];
    const { createFrame } = dom.window.MafiaStomp;
    let removedRoomId;
    dom.window.document.addEventListener('room:removed', event => {
      removedRoomId = event.detail.roomId;
    });

    socket.open();
    socket.receive(createFrame('CONNECTED', { 'heart-beat': '0,0' }));
    socket.receive(createFrame(
      'MESSAGE',
      { destination: '/topic/rooms/presence' },
      JSON.stringify([
        { roomId: 1, currentPlayers: 2 },
        { roomId: 2, currentPlayers: 1 }
      ])
    ));
    socket.receive(createFrame(
      'MESSAGE',
      { destination: '/topic/rooms/presence' },
      JSON.stringify({ roomId: 1, currentPlayers: 0 })
    ));

    assert.equal(dom.window.document.querySelector('[data-room-id="1"]'), null);
    assert.equal(dom.window.document.querySelector('#onlinePlayerCount').textContent, '1');
    assert.equal(removedRoomId, 1);
  } finally {
    dom.window.close();
  }
});

test('room list keeps its lobby connection when there are no room cards', () => {
  const dom = createDom(`<!doctype html>
    <html><body><span id="onlinePlayerCount">0</span></body></html>`);
  try {
    loadScript(dom, stompSource);
    loadScript(dom, roomListSource);
    const socket = FakeWebSocket.instances[0];
    const { createFrame } = dom.window.MafiaStomp;

    assert.ok(socket);
    socket.open();
    socket.receive(createFrame('CONNECTED', { 'heart-beat': '0,0' }));

    const sentFrames = socket.sent.map(parseSentFrame);
    assert.equal(sentFrames[1].headers.destination, '/topic/rooms/presence');
    assert.equal(sentFrames[2].headers.destination, '/app/rooms/presence');
  } finally {
    dom.window.close();
  }
});

test('room list schedules a refresh when a live room is not in the current cards', () => {
  const dom = createDom(roomListMarkup());
  const scheduledCallbacks = [];
  dom.window.setTimeout = callback => {
    scheduledCallbacks.push(callback);
    return scheduledCallbacks.length;
  };
  dom.window.clearTimeout = () => {};
  try {
    loadScript(dom, stompSource);
    loadScript(dom, roomListSource);
    const socket = FakeWebSocket.instances[0];
    const { createFrame } = dom.window.MafiaStomp;

    socket.open();
    socket.receive(createFrame('CONNECTED', { 'heart-beat': '0,0' }));
    socket.receive(createFrame(
      'MESSAGE',
      { destination: '/topic/rooms/presence' },
      JSON.stringify({ roomId: 99, currentPlayers: 1 })
    ));

    assert.equal(scheduledCallbacks.length, 1);
  } finally {
    dom.window.close();
  }
});
