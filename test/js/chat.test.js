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

function chatMarkup({ nickname = 'alice', userId = 10, isHost = false } = {}) {
  return `<!doctype html>
    <html><body data-room-id="7" data-nickname="${nickname}" data-user-id="${userId}" data-capacity="4" data-is-host="${isHost}">
      <form id="chatForm">
        <select id="chatChannel"><option value="PUBLIC">전체 채널</option><option value="MAFIA" hidden disabled>마피아 채널</option><option value="DEAD" hidden disabled>사망자 채널</option></select>
        <input name="content">
        <button type="submit">send</button>
      </form>
      <button id="ready">ready</button>
      <button id="startGame" hidden>start</button>
      <p id="startGameNotice" hidden></p>
      <button id="roomSettingsButton">settings</button>
      <form id="roomSettingsForm">
        <select id="roomSettingsMaxPlayers">
          <option value="4">4명</option>
          <option value="5">5명</option>
          <option value="6">6명</option>
          <option value="7">7명</option>
          <option value="8" selected>8명</option>
        </select>
        <div id="roomSettingsCapacityWarning" hidden>
          현재 참가자가 <strong id="roomSettingsCurrentPlayers">0</strong>명
        </div>
        <button id="roomSettingsSaveButton" type="submit">save settings</button>
      </form>
      <div id="memberGrid"></div>
      <span id="roomPlayerCount">0</span>
      <span id="roomMemberCount">0</span>
      <span id="roomCapacity">4</span>
      <span id="roomLockIndicator" class="d-none"></span>
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
        <div id="gameRolePanel" hidden>
          <span>내 역할</span><strong id="gameRoleLabel"></strong>
          <div id="mafiaTeammatesPanel" hidden>
            <ul id="mafiaTeammatesList" hidden></ul>
            <p id="noMafiaTeammatesNotice" hidden>이번 게임에서 본인 외 다른 마피아는 없습니다.</p>
          </div>
          <button id="confirmGameRole" hidden>역할 확인 완료</button>
        </div>
        <p id="finalDefenseNotice" hidden></p>
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
        <div id="nightResultPanel" hidden><strong id="nightResultTitle">경찰 조사 결과</strong><span id="nightResultFactionLabel"></span><span id="nightResultLabel" hidden></span><span id="nightResultMafiaList" hidden></span></div>
      </section>
      <div id="messages"></div>
      <div id="chatNotice"></div>
      <div id="chatConnectionStatus"></div>
      <div id="chatStatusDot"></div>
      <div id="toast"></div>
    </body></html>`;
}

test('chat applies room settings from presence updates and keeps host controls unavailable in game', () => {
  const dom = createDom(chatMarkup({ isHost: true }));
  try {
    loadScript(dom, stompSource);
    loadScript(dom, chatSource);
    const socket = FakeWebSocket.instances[0];
    const { createFrame } = dom.window.MafiaStomp;
    const participants = [{ userId: 10, nickname: 'alice', host: true, ready: false }];

    socket.open();
    socket.receive(createFrame('CONNECTED', { 'heart-beat': '0,0' }));
    socket.receive(createFrame(
      'MESSAGE',
      { destination: '/user/queue/room-joined' },
      JSON.stringify({ roomId: 7, participants, status: 'WAITING', capacity: 6, locked: true })
    ));

    assert.equal(dom.window.document.querySelector('#roomCapacity').textContent, '6');
    assert.equal(dom.window.document.querySelector('#roomLockIndicator').hidden, false);
    assert.equal(dom.window.document.querySelectorAll('#memberGrid .member').length, 6);
    assert.equal(dom.window.document.querySelector('#roomSettingsButton').hidden, false);

    socket.receive(createFrame(
      'MESSAGE',
      { destination: '/topic/rooms/7/presence' },
      JSON.stringify({ roomId: 7, participants, status: 'WAITING', capacity: 8, locked: false })
    ));
    assert.equal(dom.window.document.querySelector('#roomCapacity').textContent, '8');
    assert.equal(dom.window.document.querySelector('#roomLockIndicator').hidden, true);

    socket.receive(createFrame(
      'MESSAGE',
      { destination: '/topic/rooms/7/presence' },
      JSON.stringify({ roomId: 7, participants, status: 'PLAYING', capacity: 6, locked: true })
    ));

    assert.equal(dom.window.document.querySelector('#roomSettingsButton').hidden, true);
  } finally {
    dom.window.close();
  }
});

test('chat hides room settings from a non-host participant', () => {
  const dom = createDom(chatMarkup());
  try {
    loadScript(dom, stompSource);
    loadScript(dom, chatSource);
    const socket = FakeWebSocket.instances[0];
    const { createFrame } = dom.window.MafiaStomp;
    const participants = [
      { userId: 10, nickname: 'alice', host: false, ready: false },
      { userId: 11, nickname: 'bob', host: true, ready: false }
    ];

    socket.open();
    socket.receive(createFrame('CONNECTED', { 'heart-beat': '0,0' }));
    socket.receive(createFrame(
      'MESSAGE',
      { destination: '/user/queue/room-joined' },
      JSON.stringify({ roomId: 7, participants, status: 'WAITING', capacity: 8, locked: false })
    ));

    assert.equal(dom.window.document.querySelector('#roomSettingsButton').hidden, true);
  } finally {
    dom.window.close();
  }
});

test('chat warns and blocks room capacity below the live participant count', () => {
  const dom = createDom(chatMarkup({ isHost: true }));
  try {
    loadScript(dom, stompSource);
    loadScript(dom, chatSource);
    const socket = FakeWebSocket.instances[0];
    const { createFrame } = dom.window.MafiaStomp;
    const participants = [
      { userId: 10, nickname: 'alice', host: true, ready: false },
      { userId: 11, nickname: 'bob', host: false, ready: false },
      { userId: 12, nickname: 'cindy', host: false, ready: false },
      { userId: 13, nickname: 'dave', host: false, ready: false },
      { userId: 14, nickname: 'erin', host: false, ready: false }
    ];

    socket.open();
    socket.receive(createFrame('CONNECTED', { 'heart-beat': '0,0' }));
    socket.receive(createFrame(
      'MESSAGE',
      { destination: '/user/queue/room-joined' },
      JSON.stringify({ roomId: 7, participants, status: 'WAITING', capacity: 8, locked: false })
    ));

    const form = dom.window.document.querySelector('#roomSettingsForm');
    const maxPlayers = dom.window.document.querySelector('#roomSettingsMaxPlayers');
    const warning = dom.window.document.querySelector('#roomSettingsCapacityWarning');
    const saveButton = dom.window.document.querySelector('#roomSettingsSaveButton');

    assert.equal(maxPlayers.querySelector('option[value="4"]').disabled, true);
    assert.equal(maxPlayers.querySelector('option[value="5"]').disabled, false);

    maxPlayers.value = '5';
    maxPlayers.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
    assert.equal(warning.hidden, true);
    assert.equal(saveButton.disabled, false);

    const expandedParticipants = [...participants, { userId: 15, nickname: 'faye', host: false, ready: false }];
    socket.receive(createFrame(
      'MESSAGE',
      { destination: '/topic/rooms/7/presence' },
      JSON.stringify({ roomId: 7, participants: expandedParticipants, status: 'WAITING', capacity: 8, locked: false })
    ));

    assert.equal(maxPlayers.querySelector('option[value="5"]').disabled, true);
    assert.equal(warning.hidden, false);
    assert.match(warning.textContent, /6/);
    assert.equal(saveButton.disabled, true);
    const submitEvent = new dom.window.Event('submit', { bubbles: true, cancelable: true });
    form.dispatchEvent(submitEvent);
    assert.equal(submitEvent.defaultPrevented, true);

    maxPlayers.value = '6';
    maxPlayers.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
    assert.equal(warning.hidden, true);
    assert.equal(saveButton.disabled, false);
  } finally {
    dom.window.close();
  }
});

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

test('chat marks eliminated participants with a dead state after game updates', () => {
  const dom = createDom(chatMarkup());
  try {
    loadScript(dom, stompSource);
    loadScript(dom, chatSource);
    const socket = FakeWebSocket.instances[0];
    const { createFrame } = dom.window.MafiaStomp;
    const participants = [
      { userId: 10, nickname: 'alice', host: true, ready: true },
      { userId: 11, nickname: 'bob', host: false, ready: true }
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
        players: [
          { userId: 10, nickname: 'alice', alive: true },
          { userId: 11, nickname: 'bob', alive: false }
        ],
        message: '낮 토론이 시작되었습니다.'
      })
    ));

    const aliveCard = dom.window.document.querySelector('[data-user-id="10"]');
    const deadCard = dom.window.document.querySelector('[data-user-id="11"]');
    assert.equal(aliveCard.classList.contains('participant-dead'), false);
    assert.equal(deadCard.classList.contains('participant-dead'), true);
    assert.equal(deadCard.querySelector('small').textContent, '사망');
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
        phaseEndsAt: Date.now() + 20_000,
        remainingSeconds: 20,
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
        phase: 'FINAL_DEFENSE',
        phaseEndsAt: Date.now() + 20_000,
        remainingSeconds: 20,
        players: participants.map(({ userId, nickname }) => ({ userId, nickname, alive: true })),
        nominatedUserId: 11,
        submittedVotes: 0,
        eligibleVoters: 4,
        message: 'bob님의 최종 변론 시간입니다.'
      })
    ));
    assert.equal(dom.window.document.querySelector('#gamePhaseTitle').textContent, '최종 변론');
    assert.equal(dom.window.document.querySelector('#finalDefenseNotice').hidden, false);
    assert.equal(dom.window.document.querySelector('#chatForm input[name="content"]').disabled, true);
    assert.equal(dom.window.document.querySelector('#gameActions').hidden, true);

    socket.receive(createFrame(
      'MESSAGE',
      { destination: '/topic/rooms/7/game' },
      JSON.stringify({
        roomId: 7,
        phase: 'EXECUTION_VOTE',
        phaseEndsAt: Date.now() + 20_000,
        remainingSeconds: 20,
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
        phaseEndsAt: Date.now() + 35_000,
        remainingSeconds: 35,
        players: participants.map(({ userId, nickname }) => ({ userId, nickname, alive: true })),
        nominatedUserId: 11,
        submittedVotes: 0,
        eligibleVoters: 4,
        message: '밤이 시작되었습니다.'
      })
    ));
    assert.equal(dom.window.document.querySelector('#gamePhaseTitle').textContent, '밤');
    assert.equal(dom.window.document.querySelector('#gameActions').hidden, true);
    assert.equal(dom.window.document.body.classList.contains('night-phase'), true);

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
    assert.equal(dom.window.document.body.classList.contains('night-phase'), false);

    socket.receive(createFrame(
      'MESSAGE',
      { destination: '/topic/rooms/7/game' },
      JSON.stringify({
        roomId: 7,
        phase: 'FINISHED',
        phaseEndsAt: Date.now(),
        remainingSeconds: 0,
        players: participants.map(({ userId, nickname }) => ({ userId, nickname, alive: true })),
        nominatedUserId: null,
        submittedVotes: 0,
        eligibleVoters: 4,
        message: '게임이 종료되었습니다.',
        gameOver: true,
        winningFaction: 'CITIZEN'
      })
    ));
    assert.equal(dom.window.document.body.classList.contains('night-phase'), false);
    const channel = dom.window.document.querySelector('#chatChannel');
    const publicOption = channel.querySelector('option[value="PUBLIC"]');
    assert.equal(channel.value, 'PUBLIC');
    assert.equal(channel.disabled, false);
    assert.equal(publicOption.hidden, false);
    assert.equal(publicOption.disabled, false);
    assert.equal(channel.querySelector('option[value="MAFIA"]').hidden, true);
    assert.equal(channel.querySelector('option[value="MAFIA"]').disabled, true);
    assert.equal(channel.querySelector('option[value="DEAD"]').hidden, true);
    assert.equal(channel.querySelector('option[value="DEAD"]').disabled, true);
    assert.equal(dom.window.document.querySelector('#chatForm input[name="content"]').disabled, false);
  } finally {
    dom.window.close();
  }
});

test('chat limits an eliminated player to dead chat and returns everyone to public when the game finishes', () => {
  const dom = createDom(chatMarkup({ nickname: 'bob', userId: 11 }));
  try {
    loadScript(dom, stompSource);
    loadScript(dom, chatSource);
    const socket = FakeWebSocket.instances[0];
    const { createFrame } = dom.window.MafiaStomp;
    const participants = [
      { userId: 10, nickname: 'alice', host: true, ready: true },
      { userId: 11, nickname: 'bob', host: false, ready: true }
    ];

    socket.open();
    socket.receive(createFrame('CONNECTED', { 'heart-beat': '0,0' }));
    socket.receive(createFrame('MESSAGE', { destination: '/user/queue/room-joined' },
      JSON.stringify({ roomId: 7, participants, status: 'PLAYING' })));
    socket.receive(createFrame('MESSAGE', { subscription: 'game-role' },
      JSON.stringify({ roomId: 7, role: 'MEDIUM', roleLabel: 'medium' })));
    socket.receive(createFrame('MESSAGE', { destination: '/topic/rooms/7/game' },
      JSON.stringify({
        roomId: 7,
        phase: 'DAY_DISCUSSION',
        phaseEndsAt: Date.now() + 60_000,
        remainingSeconds: 60,
        players: [
          { userId: 10, nickname: 'alice', alive: true },
          { userId: 11, nickname: 'bob', alive: false }
        ]
      })));

    const channel = dom.window.document.querySelector('#chatChannel');
    const publicOption = channel.querySelector('option[value="PUBLIC"]');
    const mafiaOption = channel.querySelector('option[value="MAFIA"]');
    const deadOption = channel.querySelector('option[value="DEAD"]');
    assert.equal(channel.value, 'DEAD');
    assert.equal(channel.disabled, false);
    assert.equal(publicOption.hidden, true);
    assert.equal(publicOption.disabled, true);
    assert.equal(mafiaOption.hidden, true);
    assert.equal(mafiaOption.disabled, true);
    assert.equal(deadOption.hidden, false);
    assert.equal(deadOption.disabled, false);
    assert.equal(dom.window.document.querySelector('#chatForm input[name="content"]').disabled, false);

    const input = dom.window.document.querySelector('#chatForm input[name="content"]');
    input.value = '사망자 전용 메시지';
    dom.window.document.querySelector('#chatForm').dispatchEvent(
      new dom.window.Event('submit', { bubbles: true, cancelable: true })
    );
    const deadChatFrame = socket.sent.map(parseSentFrame)
      .filter(frame => frame.headers.destination === '/app/rooms/7/dead-chat')
      .at(-1);
    assert.equal(JSON.parse(deadChatFrame.body).content, '사망자 전용 메시지');

    socket.receive(createFrame('MESSAGE', { destination: '/topic/rooms/7/game' },
      JSON.stringify({
        roomId: 7,
        phase: 'FINISHED',
        phaseEndsAt: Date.now(),
        remainingSeconds: 0,
        players: [
          { userId: 10, nickname: 'alice', alive: false, role: 'MEDIUM' },
          { userId: 11, nickname: 'bob', alive: false, role: 'MAFIA' }
        ],
        gameOver: true,
        winningFaction: 'MAFIA'
      })));

    assert.equal(channel.value, 'PUBLIC');
    assert.equal(channel.disabled, false);
    assert.equal(publicOption.hidden, false);
    assert.equal(publicOption.disabled, false);
    assert.equal(channel.querySelector('option[value="MAFIA"]').hidden, true);
    assert.equal(channel.querySelector('option[value="MAFIA"]').disabled, true);
    assert.equal(channel.querySelector('option[value="DEAD"]').hidden, true);
    assert.equal(channel.querySelector('option[value="DEAD"]').disabled, true);
    assert.equal(dom.window.document.querySelector('#chatForm input[name="content"]').disabled, false);

    input.value = '게임 종료 후 전체 채널 메시지';
    dom.window.document.querySelector('#chatForm').dispatchEvent(
      new dom.window.Event('submit', { bubbles: true, cancelable: true })
    );
    const finishedChatFrame = socket.sent.map(parseSentFrame)
      .filter(frame => frame.headers.destination === '/app/rooms/7/chat')
      .at(-1);
    assert.equal(JSON.parse(finishedChatFrame.body).content, '게임 종료 후 전체 채널 메시지');

    socket.receive(createFrame(
      'MESSAGE',
      { destination: '/topic/rooms/7/chat' },
      JSON.stringify({
        type: 'CHAT',
        sender: 'bob',
        content: '게임 종료 후 공개 메시지',
        channel: 'PUBLIC'
      })
    ));
    const finishedPublicMessage = dom.window.document.querySelector('#messages .chat-message:last-child');
    assert.equal(finishedPublicMessage.dataset.channel, 'PUBLIC');
    assert.equal(finishedPublicMessage.classList.contains('channel-public'), true);
    assert.match(finishedPublicMessage.textContent, /게임 종료 후 공개 메시지/);
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
    assert.equal(dom.window.document.querySelector('#gameRoleLabel').textContent, '');

    socket.receive(createFrame(
      'MESSAGE',
      { destination: '/queue/game-role-user123', subscription: 'game-role' },
      JSON.stringify({ roomId: 7, role: 'MAFIA', roleLabel: '마피아', mafiaTeammates: ['bob'] })
    ));

    assert.equal(rolePanel.hidden, false);
    assert.equal(dom.window.document.querySelector('#gameRoleLabel').textContent, '마피아');
    assert.equal(dom.window.document.querySelector('#mafiaTeammatesPanel').hidden, false);
    assert.equal(dom.window.document.querySelector('#mafiaTeammatesList').hidden, false);
    assert.deepEqual(
      [...dom.window.document.querySelectorAll('#mafiaTeammatesList li')]
        .map(item => item.textContent),
      ['bob']
    );

    socket.receive(createFrame(
      'MESSAGE',
      { destination: '/queue/game-role-user123', subscription: 'game-role' },
      JSON.stringify({ roomId: 7, role: 'SPY', roleLabel: '스파이', mafiaTeammates: ['mafia'] })
    ));
    assert.equal(dom.window.document.querySelector('#mafiaTeammatesPanel').hidden, true);
    assert.equal(dom.window.document.querySelectorAll('#mafiaTeammatesList li').length, 0);

    socket.receive(createFrame(
      'MESSAGE',
      { destination: '/queue/game-role-user123', subscription: 'game-role' },
      JSON.stringify({ roomId: 7, role: 'MAFIA', roleLabel: '마피아', mafiaTeammates: [] })
    ));
    assert.equal(dom.window.document.querySelector('#mafiaTeammatesPanel').hidden, false);
    assert.equal(dom.window.document.querySelector('#mafiaTeammatesList').hidden, true);
    assert.equal(dom.window.document.querySelector('#noMafiaTeammatesNotice').hidden, false);
  } finally {
    dom.window.close();
  }
});

test('role confirmation is sent once and restored from the private role state', () => {
  const dom = createDom(chatMarkup());
  try {
    loadScript(dom, stompSource);
    loadScript(dom, chatSource);
    const socket = FakeWebSocket.instances[0];
    const { createFrame } = dom.window.MafiaStomp;
    const participants = [
      { userId: 10, nickname: 'alice', host: true, ready: true },
      { userId: 11, nickname: 'bob', host: false, ready: true }
    ];
    const publicPlayers = participants.map(({ userId, nickname }) => ({
      userId, nickname, alive: true, role: null
    }));

    socket.open();
    socket.receive(createFrame('CONNECTED', { 'heart-beat': '0,0' }));
    socket.receive(createFrame('MESSAGE', { destination: '/user/queue/room-joined' },
      JSON.stringify({ roomId: 7, participants, status: 'PLAYING' })));
    socket.receive(createFrame('MESSAGE', { destination: '/topic/rooms/7/game' },
      JSON.stringify({ roomId: 7, phase: 'ROLE_ASSIGNMENT',
        phaseEndsAt: Date.now() + 15_000, remainingSeconds: 15,
        players: publicPlayers, submittedVotes: 0, eligibleVoters: 2,
        message: '본인의 역할을 확인해 주세요.' })));
    socket.receive(createFrame('MESSAGE', { subscription: 'game-role' },
      JSON.stringify({ roomId: 7, role: 'MAFIA', roleLabel: '마피아', confirmed: false })));

    const confirm = dom.window.document.querySelector('#confirmGameRole');
    assert.equal(dom.window.document.querySelector('#gameActionStatus').textContent, '');
    assert.equal(dom.window.document.querySelector('#gameActionStatus').hidden, true);
    assert.equal(dom.window.document.querySelector('#gamePhaseTitle').textContent, '역할 확인');
    assert.equal(confirm.hidden, false);
    assert.equal(confirm.disabled, false);
    assert.equal(dom.window.document.querySelector('#chatForm input[name="content"]').disabled, true);
    confirm.click();
    const frame = parseSentFrame(socket.sent.at(-1));
    assert.equal(frame.headers.destination, '/app/rooms/7/game');
    assert.deepEqual(JSON.parse(frame.body), { action: 'ROLE_CONFIRM' });
    assert.equal(confirm.disabled, true);
    confirm.click();
    assert.equal(
      socket.sent.map(parseSentFrame)
        .filter(sentFrame => sentFrame.headers.destination === '/app/rooms/7/game')
        .length,
      1
    );

    socket.receive(createFrame('MESSAGE', { subscription: 'game-role' },
      JSON.stringify({ roomId: 7, role: 'MAFIA', roleLabel: '마피아', confirmed: true })));
    assert.equal(confirm.textContent, '확인 완료');
    assert.equal(confirm.disabled, true);
  } finally {
    dom.window.close();
  }
});

test('the nominated player can speak during final defense while others cannot', () => {
  const dom = createDom(chatMarkup());
  try {
    loadScript(dom, stompSource);
    loadScript(dom, chatSource);
    const socket = FakeWebSocket.instances[0];
    const { createFrame } = dom.window.MafiaStomp;
    const participants = [
      { userId: 10, nickname: 'alice', host: true, ready: true },
      { userId: 11, nickname: 'bob', host: false, ready: true }
    ];

    socket.open();
    socket.receive(createFrame('CONNECTED', { 'heart-beat': '0,0' }));
    socket.receive(createFrame('MESSAGE', { destination: '/user/queue/room-joined' },
      JSON.stringify({ roomId: 7, participants, status: 'PLAYING' })));
    socket.receive(createFrame('MESSAGE', { destination: '/topic/rooms/7/game' },
      JSON.stringify({ roomId: 7, phase: 'FINAL_DEFENSE',
        phaseEndsAt: Date.now() + 20_000, remainingSeconds: 20,
        players: participants.map(({ userId, nickname }) => ({ userId, nickname, alive: true })),
        nominatedUserId: 10, submittedVotes: 0, eligibleVoters: 2,
        message: 'alice님의 최종 변론 시간입니다.' })));

    assert.equal(dom.window.document.querySelector('#chatForm input[name="content"]').disabled, false);
    assert.match(dom.window.document.querySelector('#finalDefenseNotice').textContent, /전체 채널/);
    const chatInput = dom.window.document.querySelector('#chatForm input[name="content"]');
    chatInput.value = '제가 시민입니다';
    dom.window.document.querySelector('#chatForm').dispatchEvent(
      new dom.window.Event('submit', { bubbles: true, cancelable: true })
    );
    const frame = parseSentFrame(socket.sent.at(-1));
    assert.equal(frame.headers.destination, '/app/rooms/7/chat');
    assert.deepEqual(JSON.parse(frame.body), { content: '제가 시민입니다' });
  } finally {
    dom.window.close();
  }
});

test('a non-nominated player cannot use public chat during final defense', () => {
  const dom = createDom(chatMarkup({ nickname: 'bob', userId: 11 }));
  try {
    loadScript(dom, stompSource);
    loadScript(dom, chatSource);
    const socket = FakeWebSocket.instances[0];
    const { createFrame } = dom.window.MafiaStomp;
    const participants = [
      { userId: 10, nickname: 'alice', host: true, ready: true },
      { userId: 11, nickname: 'bob', host: false, ready: true }
    ];

    socket.open();
    socket.receive(createFrame('CONNECTED', { 'heart-beat': '0,0' }));
    socket.receive(createFrame('MESSAGE', { destination: '/user/queue/room-joined' },
      JSON.stringify({ roomId: 7, participants, status: 'PLAYING' })));
    socket.receive(createFrame('MESSAGE', { destination: '/topic/rooms/7/game' },
      JSON.stringify({ roomId: 7, phase: 'FINAL_DEFENSE',
        phaseEndsAt: Date.now() + 20_000, remainingSeconds: 20,
        players: participants.map(({ userId, nickname }) => ({ userId, nickname, alive: true })),
        nominatedUserId: 10, submittedVotes: 0, eligibleVoters: 2,
        message: 'alice님의 최종 변론 시간입니다.' })));

    assert.equal(dom.window.document.querySelector('#chatForm input[name="content"]').disabled, true);
    assert.equal(dom.window.document.querySelector('#chatForm button[type="submit"]').disabled, true);
    assert.match(dom.window.document.querySelector('#finalDefenseNotice').textContent, /지목된 참가자/);
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
        phaseEndsAt: Date.now() + 35_000,
        remainingSeconds: 35,
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

test('chat renders the spy investigation target and unlocks mafia chat after contact', () => {
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
    socket.receive(createFrame('MESSAGE', { destination: '/user/queue/room-joined' },
      JSON.stringify({ roomId: 7, participants, status: 'PLAYING' })));
    socket.receive(createFrame('MESSAGE', { subscription: 'game-role' },
      JSON.stringify({ roomId: 7, role: 'SPY', roleLabel: '스파이' })));
    socket.receive(createFrame('MESSAGE', { destination: '/topic/rooms/7/game' },
      JSON.stringify({
        roomId: 7,
        phase: 'NIGHT',
        phaseEndsAt: Date.now() + 35_000,
        remainingSeconds: 35,
        players: participants.map(({ userId, nickname }) => ({ userId, nickname, alive: true })),
        nominatedUserId: null,
        submittedVotes: 0,
        eligibleVoters: 4,
        message: '밤이 시작되었습니다.'
      })));

    const nightTarget = dom.window.document.querySelector('#nightTarget');
    assert.equal(nightTarget.options.length, 4);
    assert.equal([...nightTarget.options].some(option => option.value === '10'), false);
    const mafiaOption = dom.window.document.querySelector('#chatChannel option[value="MAFIA"]');
    assert.equal(mafiaOption.hidden, true);
    assert.equal(mafiaOption.disabled, true);
    nightTarget.value = '11';
    nightTarget.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
    assert.equal(nightTarget.value, '11');
    assert.equal(dom.window.document.querySelector('#submitNightAction').disabled, false);
    dom.window.document.querySelector('#submitNightAction').click();
    const spyGameFrame = socket.sent.map(parseSentFrame)
      .filter(frame => frame.headers.destination === '/app/rooms/7/game')
      .at(-1);
    assert.deepEqual(JSON.parse(spyGameFrame.body), {
      targetUserId: 11,
      action: 'SPY_INVESTIGATE'
    });

    socket.receive(createFrame(
      'MESSAGE',
      { destination: '/user/queue/mafia-chat-user123', subscription: 'mafia-chat' },
      JSON.stringify({
        roomId: 7,
        type: 'SYSTEM',
        sender: '게임 안내',
        content: '스파이가 마피아를 찾아 접선했습니다.',
        channel: 'MAFIA',
        sentAt: new Date().toISOString()
      })
    ));

    assert.equal(mafiaOption.hidden, false);
    assert.equal(mafiaOption.disabled, false);
    assert.equal(dom.window.document.querySelector('#chatChannel').value, 'MAFIA');
    assert.equal(dom.window.document.querySelector('#chatForm input[name="content"]').disabled, false);
  } finally {
    dom.window.close();
  }
});

test('chat lets the medium investigate only dead players and send dead-channel messages', () => {
  const dom = createDom(chatMarkup());
  try {
    loadScript(dom, stompSource);
    loadScript(dom, chatSource);
    const socket = FakeWebSocket.instances[0];
    const { createFrame } = dom.window.MafiaStomp;
    const participants = [
      { userId: 10, nickname: 'alice', host: true, ready: true },
      { userId: 11, nickname: 'bob', host: false, ready: true },
      { userId: 12, nickname: 'carol', host: false, ready: true }
    ];

    socket.open();
    socket.receive(createFrame('CONNECTED', { 'heart-beat': '0,0' }));
    socket.receive(createFrame('MESSAGE', { destination: '/user/queue/room-joined' },
      JSON.stringify({ roomId: 7, participants, status: 'PLAYING' })));
    socket.receive(createFrame('MESSAGE', { subscription: 'game-role' },
      JSON.stringify({ roomId: 7, role: 'MEDIUM', roleLabel: '영매사' })));
    socket.receive(createFrame('MESSAGE', { destination: '/topic/rooms/7/game' },
      JSON.stringify({
        roomId: 7,
        phase: 'NIGHT',
        phaseEndsAt: Date.now() + 35_000,
        remainingSeconds: 35,
        players: [
          { userId: 10, nickname: 'alice', alive: true },
          { userId: 11, nickname: 'bob', alive: false },
          { userId: 12, nickname: 'carol', alive: true }
        ],
        nominatedUserId: null,
        submittedVotes: 0,
        eligibleVoters: 3,
        message: '밤이 시작되었습니다.'
      })));

    const nightTarget = dom.window.document.querySelector('#nightTarget');
    assert.equal(nightTarget.options.length, 2);
    assert.equal(nightTarget.options[1].value, '11');
    assert.equal(dom.window.document.querySelector('#chatChannel').value, 'DEAD');
    const deadOption = dom.window.document.querySelector('#chatChannel option[value="DEAD"]');
    assert.equal(deadOption.hidden, false);
    assert.equal(deadOption.disabled, false);
    nightTarget.value = '11';
    nightTarget.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
    assert.equal(nightTarget.value, '11');
    assert.equal(dom.window.document.querySelector('#submitNightAction').disabled, false);
    dom.window.document.querySelector('#submitNightAction').click();
    const mediumGameFrame = socket.sent.map(parseSentFrame)
      .filter(frame => frame.headers.destination === '/app/rooms/7/game')
      .at(-1);
    assert.deepEqual(JSON.parse(mediumGameFrame.body), {
      targetUserId: 11,
      action: 'MEDIUM_INVESTIGATE'
    });

    socket.receive(createFrame(
      'MESSAGE',
      { subscription: 'night-result' },
      JSON.stringify({
        roomId: 7,
        targetUserId: 11,
        targetNickname: 'bob',
        faction: 'CITIZEN',
        factionLabel: '시민팀',
        role: 'CITIZEN',
        roleLabel: '시민'
      })
    ));
    assert.equal(
      dom.window.document.querySelector('#nightResultFactionLabel').textContent,
      'bob님의 진영: 시민팀'
    );
    assert.equal(
      dom.window.document.querySelector('#nightResultLabel').textContent,
      '직업: 시민'
    );

    const chatInput = dom.window.document.querySelector('#chatForm input[name="content"]');
    chatInput.value = '사망자 채널 메시지';
    dom.window.document.querySelector('#chatForm').dispatchEvent(
      new dom.window.Event('submit', { bubbles: true, cancelable: true })
    );
    assert.equal(parseSentFrame(socket.sent.at(-1)).headers.destination, '/app/rooms/7/dead-chat');
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
        phaseEndsAt: Date.now() + 20_000,
        remainingSeconds: 20,
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
        factionLabel: '마피아팀'
      })
    ));

    assert.equal(dom.window.document.querySelector('#nightResultPanel').hidden, false);
    assert.equal(
      dom.window.document.querySelector('#nightResultFactionLabel').textContent,
      'bob님의 진영: 마피아팀'
    );
    assert.equal(dom.window.document.querySelector('#nightResultLabel').hidden, true);
  } finally {
    dom.window.close();
  }
});

test('chat renders an exact-role investigation result for spy or medium', () => {
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
        factionLabel: '마피아팀',
        role: 'MAFIA',
        roleLabel: '마피아',
        mafiaPlayers: [{ userId: 11, nickname: 'bob', alive: true, role: 'MAFIA' }]
      })
    ));

    assert.equal(
      dom.window.document.querySelector('#nightResultTitle').textContent,
      '직업 조사 결과'
    );
    assert.equal(
      dom.window.document.querySelector('#nightResultFactionLabel').textContent,
      'bob님의 진영: 마피아팀'
    );
    assert.equal(
      dom.window.document.querySelector('#nightResultLabel').textContent,
      '직업: 마피아'
    );
    assert.equal(
      dom.window.document.querySelector('#nightResultMafiaList').textContent,
      '확인된 마피아: bob'
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
    assert.equal(dom.window.document.querySelector('#gameResultAliveLabel').textContent, '사망');

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

test('chat marks public, mafia, and dead messages with separate channel classes', () => {
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
      { destination: '/user/queue/room-joined', subscription: 'room-joined' },
      JSON.stringify({
        roomId: 7,
        participants: [{ userId: 10, nickname: 'alice', host: true, ready: false }]
      })
    ));

    socket.receive(createFrame(
      'MESSAGE',
      { destination: '/topic/rooms/7/chat', subscription: 'room-chat' },
      JSON.stringify({ type: 'CHAT', sender: 'bob', content: 'public', channel: 'PUBLIC' })
    ));
    socket.receive(createFrame(
      'MESSAGE',
      { destination: '/queue/mafia-chat-user123', subscription: 'mafia-chat' },
      JSON.stringify({ type: 'CHAT', sender: 'carol', content: 'mafia', channel: 'MAFIA' })
    ));
    socket.receive(createFrame(
      'MESSAGE',
      { destination: '/queue/dead-chat-user123', subscription: 'dead-chat' },
      JSON.stringify({ type: 'CHAT', sender: 'dave', content: 'dead', channel: 'PUBLIC' })
    ));

    const messages = [...dom.window.document.querySelectorAll('.chat-message')];
    assert.deepEqual(messages.map(message => message.dataset.channel), ['PUBLIC', 'MAFIA', 'DEAD']);
    assert.equal(messages[0].classList.contains('channel-public'), true);
    assert.equal(messages[1].classList.contains('channel-mafia'), true);
    assert.equal(messages[2].classList.contains('channel-dead'), true);
  } finally {
    dom.window.close();
  }
});

test('chat renders system phase guidance as a distinct message', () => {
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
      { destination: '/user/queue/room-joined', subscription: 'room-joined' },
      JSON.stringify({
        roomId: 7,
        participants: [{ userId: 10, nickname: 'alice', host: true, ready: false }]
      })
    ));

    socket.receive(createFrame(
      'MESSAGE',
      { destination: '/topic/rooms/7/chat', subscription: 'room-chat' },
      JSON.stringify({
        type: 'SYSTEM',
        sender: '게임 안내',
        content: '【낮 토론 안내】 낮이 시작되었습니다. 지목 투표를 준비하세요.'
      })
    ));

    const message = dom.window.document.querySelector('.chat-message');
    assert.equal(message.dataset.channel, 'SYSTEM');
    assert.equal(message.classList.contains('system'), true);
    assert.equal(message.classList.contains('channel-system'), true);
    assert.equal(message.querySelector('.chat-message-sender').textContent, '게임 안내');
    assert.equal(
      message.querySelector('.chat-message-bubble').textContent,
      '【낮 토론 안내】 낮이 시작되었습니다. 지목 투표를 준비하세요.'
    );
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
