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
const chatSource = await readClientScript('chat.js');

function chatMarkup() {
  return `<!doctype html>
    <html><body data-room-id="7" data-nickname="alice" data-user-id="10" data-capacity="4">
      <form id="chatForm">
        <input name="content">
        <button type="submit">send</button>
      </form>
      <button id="ready">ready</button>
      <div id="memberGrid"></div>
      <span id="roomPlayerCount">0</span>
      <span id="roomMemberCount">0</span>
      <div id="messages"></div>
      <div id="chatNotice"></div>
      <div id="chatConnectionStatus"></div>
      <div id="chatStatusDot"></div>
      <div id="toast"></div>
    </body></html>`;
}

test('chat subscribes to room topics only after the room join acknowledgement', () => {
  const dom = createDom(chatMarkup());
  try {
    loadScript(dom, stompSource);
    loadScript(dom, chatSource);
    const socket = FakeWebSocket.instances[0];
    const { createFrame } = dom.window.MafiaStomp;

    socket.open();
    socket.receive(createFrame('CONNECTED', { 'heart-beat': '0,0' }));

    let sentFrames = socket.sent.map(parseSentFrame);
    assert.deepEqual(sentFrames.slice(1).map(frame => frame.command), ['SUBSCRIBE', 'SUBSCRIBE', 'SEND']);
    assert.equal(sentFrames[3].headers.destination, '/app/rooms/7/join');
    assert.equal(dom.window.document.querySelector('#chatForm button[type="submit"]').disabled, true);
    assert.equal(sentFrames.some(frame => frame.headers.destination === '/topic/rooms/7/chat'), false);
    assert.equal(sentFrames.some(frame => frame.headers.destination === '/topic/rooms/7/presence'), false);

    socket.receive(createFrame(
      'MESSAGE',
      { destination: '/queue/room-joined-user123', subscription: 'room-joined' },
      JSON.stringify({
        roomId: 7,
        participants: [
          { userId: 10, nickname: 'alice', host: true, ready: false },
          { userId: 11, nickname: 'bob', host: false, ready: true }
        ]
      })
    ));

    sentFrames = socket.sent.map(parseSentFrame);
    assert.equal(sentFrames.filter(frame => frame.headers.destination === '/topic/rooms/7/presence').length, 1);
    assert.equal(sentFrames.filter(frame => frame.headers.destination === '/topic/rooms/7/chat').length, 1);
    assert.equal(dom.window.document.querySelector('#roomPlayerCount').textContent, '2');
    assert.equal(dom.window.document.querySelector('#roomMemberCount').textContent, '2');
    assert.equal(dom.window.document.querySelectorAll('#memberGrid .member').length, 4);
    assert.equal(dom.window.document.querySelector('#ready').disabled, false);
  } finally {
    dom.window.close();
  }
});

test('chat sends trimmed messages and ready changes after joining', () => {
  const dom = createDom(chatMarkup());
  try {
    loadScript(dom, stompSource);
    loadScript(dom, chatSource);
    const socket = FakeWebSocket.instances[0];
    const { createFrame } = dom.window.MafiaStomp;
    socket.open();
    socket.receive(createFrame('CONNECTED', { 'heart-beat': '0,0' }));
    socket.receive(createFrame(
      'MESSAGE',
      { destination: '/user/queue/room-joined' },
      JSON.stringify({
        roomId: 7,
        participants: [{ userId: 10, nickname: 'alice', host: true, ready: false }]
      })
    ));

    const input = dom.window.document.querySelector('input[name="content"]');
    input.value = '  hello mafia  ';
    dom.window.document.querySelector('#chatForm').dispatchEvent(
      new dom.window.Event('submit', { bubbles: true, cancelable: true })
    );

    const chatFrame = parseSentFrame(socket.sent.at(-1));
    assert.equal(chatFrame.command, 'SEND');
    assert.equal(chatFrame.headers.destination, '/app/rooms/7/chat');
    assert.deepEqual(JSON.parse(chatFrame.body), { content: 'hello mafia' });
    assert.equal(input.value, '');

    dom.window.document.querySelector('#ready').click();
    const readyFrame = parseSentFrame(socket.sent.at(-1));
    assert.equal(readyFrame.headers.destination, '/app/rooms/7/ready');
    assert.deepEqual(JSON.parse(readyFrame.body), { ready: true });
  } finally {
    dom.window.close();
  }
});

test('chat renders incoming content as text instead of HTML', () => {
  const dom = createDom(chatMarkup());
  try {
    loadScript(dom, stompSource);
    loadScript(dom, chatSource);
    const socket = FakeWebSocket.instances[0];
    const { createFrame } = dom.window.MafiaStomp;
    socket.open();
    socket.receive(createFrame('CONNECTED', { 'heart-beat': '0,0' }));
    socket.receive(createFrame(
      'MESSAGE',
      { destination: '/user/queue/room-joined' },
      JSON.stringify({
        roomId: 7,
        participants: [{ userId: 10, nickname: 'alice', host: true, ready: false }]
      })
    ));
    socket.receive(createFrame(
      'MESSAGE',
      { destination: '/topic/rooms/7/chat' },
      JSON.stringify({
        type: 'CHAT',
        sender: 'bob',
        content: '<img src=x onerror=alert(1)>',
        sentAt: null
      })
    ));

    const bubble = dom.window.document.querySelector('.chat-message-bubble');
    assert.equal(bubble.textContent, '<img src=x onerror=alert(1)>');
    assert.equal(bubble.querySelector('img'), null);

    for (let index = 0; index < 205; index += 1) {
      socket.receive(createFrame(
        'MESSAGE',
        { destination: '/topic/rooms/7/chat' },
        JSON.stringify({ type: 'CHAT', sender: 'bob', content: `message-${index}`, sentAt: null })
      ));
    }
    assert.equal(dom.window.document.querySelectorAll('.chat-message').length, 200);
  } finally {
    dom.window.close();
  }
});

test('chat resets room admission while reconnecting and rejects a failed rejoin', () => {
  const dom = createDom(chatMarkup());
  const scheduledCallbacks = [];
  dom.window.setTimeout = callback => {
    scheduledCallbacks.push(callback);
    return scheduledCallbacks.length;
  };
  dom.window.clearTimeout = () => {};
  try {
    loadScript(dom, stompSource);
    loadScript(dom, chatSource);
    const { createFrame } = dom.window.MafiaStomp;
    const firstSocket = FakeWebSocket.instances[0];

    firstSocket.open();
    firstSocket.receive(createFrame('CONNECTED', { 'heart-beat': '0,0' }));
    firstSocket.receive(createFrame(
      'MESSAGE',
      { destination: '/queue/room-joined-user123', subscription: 'room-joined' },
      JSON.stringify({
        roomId: 7,
        participants: [{ userId: 10, nickname: 'alice', host: true, ready: false }]
      })
    ));
    assert.equal(dom.window.document.querySelector('#chatForm button[type="submit"]').disabled, false);

    firstSocket.close();
    assert.equal(scheduledCallbacks.length, 1);
    scheduledCallbacks.shift()();

    const secondSocket = FakeWebSocket.instances[1];
    secondSocket.open();
    secondSocket.receive(createFrame('CONNECTED', { 'heart-beat': '0,0' }));
    assert.equal(dom.window.document.querySelector('#chatForm button[type="submit"]').disabled, true);

    secondSocket.receive(createFrame(
      'MESSAGE',
      { destination: '/queue/errors-user123', subscription: 'chat-errors' },
      JSON.stringify({ type: 'ERROR', message: '입장할 수 없습니다.' })
    ));

    assert.equal(dom.window.document.querySelector('#chatConnectionStatus').textContent, '입장 불가');
  } finally {
    dom.window.close();
  }
});
