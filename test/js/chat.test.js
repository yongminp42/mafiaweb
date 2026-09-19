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
      <button id="startGame" hidden>start</button>
      <p id="startGameNotice" hidden></p>
      <div id="memberGrid"></div>
      <span id="roomPlayerCount">0</span>
      <span id="roomMemberCount">0</span>
      <span id="roomStatus">대기 중</span>
      <section id="gamePanel" hidden>
        <h2 id="gamePhaseTitle"></h2>
        <strong id="gameTimer"></strong>
        <p id="gameMessage"></p>
        <div id="gameResultPanel" hidden>
          <strong id="gameWinnerLabel"></strong>
          <strong id="gameResultRoleLabel">-</strong>
          <strong id="gameResultAliveLabel">-</strong>
          <small id="gameResultNotice"></small>
        </div>
        <div id="gameRolePanel" hidden><strong id="gameRoleLabel"></strong></div>
        <div id="gameActions" hidden>
          <div id="nominationAction" hidden>
            <select id="nominationTarget"></select>
            <button id="submitNomination">nominate</button>
          </div>
          <div id="executionAction" hidden>
            <button id="executePlayer">execute</button>
            <button id="sparePlayer">spare</button>
          </div>
          <div id="nightAction" hidden>
            <label id="nightActionTitle" for="nightTarget"></label>
            <select id="nightTarget"><option value="">choose</option></select>
            <button id="submitNightAction">night action</button>
          </div>
        </div>
        <p id="gameActionStatus"></p>
        <div id="nightResultPanel" hidden><span id="nightResultLabel"></span></div>
      </section>
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
    assert.equal(sentFrames.filter(frame => frame.headers.destination === '/user/queue/presence-synced').length, 1);
    assert.equal(sentFrames.filter(frame => frame.headers.destination === '/topic/rooms/7/presence').length, 1);
    assert.equal(sentFrames.filter(frame => frame.headers.destination === '/topic/rooms/7/chat').length, 1);
    assert.equal(sentFrames.filter(frame => frame.headers.destination === '/user/queue/game-role').length, 1);
    assert.equal(sentFrames.filter(frame => frame.headers.destination === '/user/queue/game-result').length, 1);
    assert.equal(sentFrames.filter(frame => frame.headers.destination === '/app/rooms/7/presence/sync').length, 1);
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

test('chat renders game phases and sends nomination and execution votes', () => {
  const dom = createDom(chatMarkup());
  try {
    loadScript(dom, stompSource);
    loadScript(dom, chatSource);
    const socket = FakeWebSocket.instances[0];
    const { createFrame } = dom.window.MafiaStomp;
    const participants = [
      { userId: 10, nickname: 'alice', host: true, ready: true },
      { userId: 11, nickname: 'bob', host: false, ready: true },
      { userId: 12, nickname: 'carol', host: false, ready: true },
      { userId: 13, nickname: 'dave', host: false, ready: true }
    ];

    socket.open();
    socket.receive(createFrame('CONNECTED', { 'heart-beat': '0,0' }));
    socket.receive(createFrame(
      'MESSAGE',
      { destination: '/user/queue/room-joined' },
      JSON.stringify({ roomId: 7, participants, status: 'PLAYING' })
    ));
    socket.receive(createFrame(
      'MESSAGE',
      { destination: '/topic/rooms/7/game' },
      JSON.stringify({
        roomId: 7,
        phase: 'DAY_DISCUSSION',
        phaseEndsAt: Date.now() + 60_000,
        remainingSeconds: 60,
        players: participants.map(({ userId, nickname }) => ({ userId, nickname, alive: true })),
        nominatedUserId: null,
        submittedVotes: 0,
        eligibleVoters: 4,
        message: '낮 토론이 시작되었습니다.'
      })
    ));

    assert.equal(dom.window.document.querySelector('#gamePanel').hidden, false);
    assert.equal(dom.window.document.querySelector('#gamePhaseTitle').textContent, '낮');

    socket.receive(createFrame(
      'MESSAGE',
      { destination: '/topic/rooms/7/game' },
      JSON.stringify({
        roomId: 7,
        phase: 'NOMINATION_VOTE',
        phaseEndsAt: Date.now() + 15_000,
        remainingSeconds: 15,
        players: participants.map(({ userId, nickname }) => ({ userId, nickname, alive: true })),
        nominatedUserId: null,
        submittedVotes: 0,
        eligibleVoters: 4,
        message: '지목할 참가자를 선택해 주세요.'
      })
    ));

    const target = dom.window.document.querySelector('#nominationTarget');
    assert.equal(dom.window.document.querySelector('#gamePhaseTitle').textContent, '지목 투표');
    assert.equal(target.options.length, 4);
    target.value = '11';
    target.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
    dom.window.document.querySelector('#submitNomination').click();
    let gameFrame = parseSentFrame(socket.sent.at(-1));
    assert.equal(gameFrame.headers.destination, '/app/rooms/7/game');
    assert.deepEqual(JSON.parse(gameFrame.body), { targetUserId: 11 });

    socket.receive(createFrame(
      'MESSAGE',
      { destination: '/topic/rooms/7/game' },
      JSON.stringify({
        roomId: 7,
        phase: 'EXECUTION_VOTE',
        phaseEndsAt: Date.now() + 15_000,
        remainingSeconds: 15,
        players: participants.map(({ userId, nickname }) => ({ userId, nickname, alive: true })),
        nominatedUserId: 11,
        submittedVotes: 0,
        eligibleVoters: 4,
        message: 'bob님을 처형할지 투표해 주세요.'
      })
    ));
    assert.equal(dom.window.document.querySelector('#gamePhaseTitle').textContent, '처형 투표');
    dom.window.document.querySelector('#executePlayer').click();
    gameFrame = parseSentFrame(socket.sent.at(-1));
    assert.deepEqual(JSON.parse(gameFrame.body), { execute: true });

    socket.receive(createFrame(
      'MESSAGE',
      { destination: '/topic/rooms/7/game' },
      JSON.stringify({
        roomId: 7,
        phase: 'NIGHT',
        phaseEndsAt: Date.now() + 30_000,
        remainingSeconds: 30,
        players: participants.map(({ userId, nickname }) => ({ userId, nickname, alive: true })),
        nominatedUserId: 11,
        submittedVotes: 0,
        eligibleVoters: 4,
        message: '밤이 시작되었습니다.'
      })
    ));
    assert.equal(dom.window.document.querySelector('#gamePhaseTitle').textContent, '밤');
    assert.equal(dom.window.document.querySelector('#gameActions').hidden, true);
  } finally {
    dom.window.close();
  }
});

test('chat renders a role received through the private role queue', () => {
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
        participants: [{ userId: 10, nickname: 'alice', host: true, ready: true }],
        status: 'PLAYING'
      })
    ));

    const rolePanel = dom.window.document.querySelector('#gameRolePanel');
    assert.equal(rolePanel.hidden, true);

    socket.receive(createFrame(
      'MESSAGE',
      { destination: '/queue/game-role-user123', subscription: 'game-role' },
      JSON.stringify({ roomId: 7, role: 'MAFIA', roleLabel: '마피아' })
    ));

    assert.equal(rolePanel.hidden, false);
    assert.equal(dom.window.document.querySelector('#gameRoleLabel').textContent, '마피아');
  } finally {
    dom.window.close();
  }
});

test('chat renders the role-specific night action and sends its target', () => {
  const dom = createDom(chatMarkup());
  try {
    loadScript(dom, stompSource);
    loadScript(dom, chatSource);
    const socket = FakeWebSocket.instances[0];
    const { createFrame } = dom.window.MafiaStomp;
    const participants = [
      { userId: 10, nickname: 'alice', host: true, ready: true },
      { userId: 11, nickname: 'bob', host: false, ready: true },
      { userId: 12, nickname: 'carol', host: false, ready: true },
      { userId: 13, nickname: 'dave', host: false, ready: true }
    ];

    socket.open();
    socket.receive(createFrame('CONNECTED', { 'heart-beat': '0,0' }));
    socket.receive(createFrame(
      'MESSAGE',
      { destination: '/user/queue/room-joined' },
      JSON.stringify({ roomId: 7, participants, status: 'PLAYING' })
    ));
    socket.receive(createFrame(
      'MESSAGE',
      { destination: '/queue/game-role-user123', subscription: 'game-role' },
      JSON.stringify({ roomId: 7, role: 'MAFIA', roleLabel: '마피아' })
    ));
    socket.receive(createFrame(
      'MESSAGE',
      { destination: '/topic/rooms/7/game' },
      JSON.stringify({
        roomId: 7,
        phase: 'NIGHT',
        phaseEndsAt: Date.now() + 30_000,
        remainingSeconds: 30,
        players: participants.map(({ userId, nickname }) => ({ userId, nickname, alive: true })),
        nominatedUserId: null,
        submittedVotes: 0,
        eligibleVoters: 4,
        message: '밤이 시작되었습니다.'
      })
    ));

    const nightAction = dom.window.document.querySelector('#nightAction');
    const nightTarget = dom.window.document.querySelector('#nightTarget');
    assert.equal(nightAction.hidden, false);
    assert.equal(nightTarget.options.length, 5);
    nightTarget.value = '11';
    nightTarget.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
    dom.window.document.querySelector('#submitNightAction').click();

    const gameFrame = parseSentFrame(socket.sent.at(-1));
    assert.equal(gameFrame.headers.destination, '/app/rooms/7/game');
    assert.deepEqual(JSON.parse(gameFrame.body), {
      targetUserId: 11,
      action: 'MAFIA_KILL'
    });
  } finally {
    dom.window.close();
  }
});

test('chat disables execution voting for the nominated player', () => {
  const dom = createDom(chatMarkup());
  try {
    loadScript(dom, stompSource);
    loadScript(dom, chatSource);
    const socket = FakeWebSocket.instances[0];
    const { createFrame } = dom.window.MafiaStomp;
    const participants = [
      { userId: 10, nickname: 'alice', host: true, ready: true },
      { userId: 11, nickname: 'bob', host: false, ready: true },
      { userId: 12, nickname: 'carol', host: false, ready: true },
      { userId: 13, nickname: 'dave', host: false, ready: true }
    ];

    socket.open();
    socket.receive(createFrame('CONNECTED', { 'heart-beat': '0,0' }));
    socket.receive(createFrame(
      'MESSAGE',
      { destination: '/user/queue/room-joined' },
      JSON.stringify({ roomId: 7, participants, status: 'PLAYING' })
    ));
    socket.receive(createFrame(
      'MESSAGE',
      { destination: '/topic/rooms/7/game' },
      JSON.stringify({
        roomId: 7,
        phase: 'EXECUTION_VOTE',
        phaseEndsAt: Date.now() + 15_000,
        remainingSeconds: 15,
        players: participants.map(({ userId, nickname }) => ({ userId, nickname, alive: true })),
        nominatedUserId: 10,
        submittedVotes: 0,
        eligibleVoters: 3,
        message: 'alice님을 처형할지 투표해 주세요.'
      })
    ));

    assert.equal(dom.window.document.querySelector('#executePlayer').disabled, true);
    assert.equal(dom.window.document.querySelector('#sparePlayer').disabled, true);
    assert.equal(
      dom.window.document.querySelector('#gameActionStatus').textContent,
      '지목된 참가자는 처형 투표에 참여할 수 없습니다.'
    );
  } finally {
    dom.window.close();
  }
});

test('chat renders a police investigation result from the private night queue', () => {
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
        participants: [{ userId: 10, nickname: 'alice', host: true, ready: true }],
        status: 'PLAYING'
      })
    ));
    socket.receive(createFrame(
      'MESSAGE',
      { destination: '/queue/night-result-user123', subscription: 'night-result' },
      JSON.stringify({
        roomId: 7,
        targetUserId: 11,
        targetNickname: 'bob',
        faction: 'MAFIA',
        factionLabel: '마피아'
      })
    ));

    assert.equal(dom.window.document.querySelector('#nightResultPanel').hidden, false);
    assert.equal(
      dom.window.document.querySelector('#nightResultLabel').textContent,
      ' bob님은 마피아입니다.'
    );
  } finally {
    dom.window.close();
  }
});

test('chat renders the winning faction when the server finishes the game', () => {
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
        participants: [{ userId: 10, nickname: 'alice', host: true, ready: true }],
        status: 'PLAYING'
      })
    ));
    socket.receive(createFrame(
      'MESSAGE',
      { destination: '/topic/rooms/7/game' },
      JSON.stringify({
        roomId: 7,
        phase: 'FINISHED',
        phaseEndsAt: Date.now(),
        remainingSeconds: 0,
        players: [{ userId: 10, nickname: 'alice', alive: true }],
        nominatedUserId: null,
        submittedVotes: 0,
        eligibleVoters: 1,
        message: '시민 진영 승리!',
        gameOver: true,
        winningFaction: 'CITIZEN'
      })
    ));

    assert.equal(dom.window.document.querySelector('#gameResultPanel').hidden, false);
    assert.equal(
      dom.window.document.querySelector('#gameWinnerLabel').textContent,
      '시민 진영 승리'
    );
    assert.equal(dom.window.document.querySelector('#gameActions').hidden, true);

    socket.receive(createFrame(
      'MESSAGE',
      { destination: '/queue/game-result-user123', subscription: 'game-result' },
      JSON.stringify({
        roomId: 7,
        winningFaction: 'CITIZEN',
        winningFactionLabel: '시민 진영',
        role: 'POLICE',
        roleLabel: '경찰',
        alive: false
      })
    ));
    assert.equal(dom.window.document.querySelector('#gameResultRoleLabel').textContent, '경찰');
    assert.equal(dom.window.document.querySelector('#gameResultAliveLabel').textContent, '탈락');

    socket.receive(createFrame(
      'MESSAGE',
      { destination: '/topic/rooms/7/presence' },
      JSON.stringify({
        roomId: 7,
        participants: [{ userId: 10, nickname: 'alice', host: true, ready: false }],
        status: 'WAITING'
      })
    ));
    assert.equal(dom.window.document.querySelector('#roomStatus').textContent, '대기 중');
    assert.equal(dom.window.document.querySelector('#ready').disabled, false);
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
