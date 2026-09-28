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
const PATCH_NOTES_STORAGE_KEY = 'mafiagame.patch-notes.preference';

function roomListMarkup() {
  return `<!doctype html>
    <html><body>
      <span id="onlinePlayerCount">0</span>
      <span id="roomCount">2</span>
      <input id="roomSearch" type="search">
      <select id="roomFilter">
        <option value="all" selected>모든 게임</option>
        <option value="WAITING">대기 중</option>
        <option value="PLAYING">게임 중</option>
      </select>
      <div id="roomList">
        <article class="room-card" data-room-id="1" data-status="WAITING" data-title="room one">
          <span class="room-number">01</span>
          <span data-room-player-count>5</span>
        </article>
        <article class="room-card" data-room-id="2" data-status="PLAYING" data-title="room two">
          <span class="room-number">02</span>
          <span data-room-player-count>4</span>
        </article>
      </div>
      <p id="emptyState" hidden>조건에 맞는 게임이 없습니다.</p>
    </body></html>`;
}

function roomCardFragment(roomId = 99) {
  return `<article class="room-card" data-room-id="${roomId}" data-status="WAITING" data-title="new room">
    <span class="room-number">--</span>
    <span data-room-player-count>0</span>
  </article>`;
}

function patchNotesMarkup(content, detailContent = '') {
  return `<!doctype html>
    <html><body>
      <span id="onlinePlayerCount">0</span>
      <div id="patchNotesModal">
        <div class="patch-notes-content">${content}</div>
        <input id="patchNotesHideToday" type="checkbox">
        <button id="patchNotesDetailButton" type="button">상세보기</button>
        <button type="button" data-bs-dismiss="modal">닫기</button>
      </div>
      <div id="patchNotesDetailModal">
        <div class="patch-notes-detail-content">${detailContent}</div>
      </div>
    </body></html>`;
}

function installPatchNotesModalStub(dom) {
  const instances = [];
  class FakePatchNotesModal {
    constructor(element) {
      this.element = element;
      this.showCount = 0;
      instances.push(this);
    }

    show() {
      this.showCount += 1;
      this.transitioning = true;
    }

    hide() {
      if (this.transitioning) {
        return;
      }
      this.hideCount = (this.hideCount || 0) + 1;
      this.element.dispatchEvent(new this.element.ownerDocument.defaultView.Event('hidden.bs.modal'));
    }

    finishShowTransition() {
      this.transitioning = false;
      this.element.dispatchEvent(new this.element.ownerDocument.defaultView.Event('shown.bs.modal'));
    }

    static getOrCreateInstance(element) {
      return new FakePatchNotesModal(element);
    }
  }

  dom.window.bootstrap = { Modal: FakePatchNotesModal };
  return instances;
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

test('room list updates existing counts without rescanning cards and refreshes once for batched removals', () => {
  const markup = roomListMarkup().replace(
    '      </div>\n      <p id="emptyState"',
    `        <article class="room-card" data-room-id="3" data-status="WAITING" data-title="room three">
          <span class="room-number">03</span>
          <span data-room-player-count>6</span>
        </article>
      </div>
      <p id="emptyState"`
  );
  const dom = createDom(markup);
  try {
    loadScript(dom, stompSource);
    loadScript(dom, roomListSource);
    const socket = FakeWebSocket.instances[0];
    const { createFrame } = dom.window.MafiaStomp;
    const roomList = dom.window.document.querySelector('#roomList');
    const originalQuerySelectorAll = roomList.querySelectorAll.bind(roomList);
    let cardListScans = 0;
    roomList.querySelectorAll = selector => {
      if (selector === '.room-card') cardListScans += 1;
      return originalQuerySelectorAll(selector);
    };

    socket.open();
    socket.receive(createFrame('CONNECTED', { 'heart-beat': '0,0' }));
    socket.receive(createFrame(
      'MESSAGE',
      { destination: '/topic/rooms/presence' },
      JSON.stringify([
        { roomId: 1, currentPlayers: 2 },
        { roomId: 2, currentPlayers: 3 },
        { roomId: 3, currentPlayers: 4 }
      ])
    ));

    assert.equal(cardListScans, 0, 'count-only snapshots should not rescan the room-card list');
    assert.equal(dom.window.document.querySelector('#onlinePlayerCount').textContent, '9');

    socket.receive(createFrame(
      'MESSAGE',
      { destination: '/topic/rooms/presence' },
      JSON.stringify([
        { roomId: 1, currentPlayers: 2 },
        { roomId: 2, currentPlayers: 0 },
        { roomId: 3, currentPlayers: 0 }
      ])
    ));

    assert.equal(cardListScans, 1, 'a snapshot that removes cards should refresh and renumber once');
    assert.equal(dom.window.document.querySelector('[data-room-id="2"]'), null);
    assert.equal(dom.window.document.querySelector('[data-room-id="3"]'), null);
    assert.equal(dom.window.document.querySelector('#onlinePlayerCount').textContent, '2');
    assert.equal(dom.window.document.querySelector('#roomCount').textContent, '1');
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

test('room list fetches and inserts a missing live room card without reloading the page', async () => {
  const dom = createDom(roomListMarkup());
  let requestedUrl;
  dom.window.fetch = async url => {
    requestedUrl = url;
    return { ok: true, text: async () => roomCardFragment() };
  };
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
    await new Promise(resolve => setTimeout(resolve, 0));

    const card = dom.window.document.querySelector('[data-room-id="99"]');
    assert.equal(requestedUrl, '/rooms/99/card');
    assert.ok(card);
    assert.equal(card.querySelector('[data-room-player-count]').textContent, '1');
    assert.equal(dom.window.document.querySelector('#roomCount').textContent, '3');
    assert.deepEqual(
      [...dom.window.document.querySelectorAll('#roomList .room-card')]
        .map(room => room.dataset.roomId),
      ['1', '99', '2']
    );
  } finally {
    dom.window.close();
  }
});

test('room list applies the active search and status filter to a newly inserted card', async () => {
  const dom = createDom(roomListMarkup());
  dom.window.fetch = async () => ({ ok: true, text: async () => roomCardFragment() });
  try {
    loadScript(dom, stompSource);
    loadScript(dom, roomListSource);
    const socket = FakeWebSocket.instances[0];
    const { createFrame } = dom.window.MafiaStomp;

    dom.window.document.querySelector('#roomSearch').value = 'new';
    dom.window.document.querySelector('#roomSearch').dispatchEvent(new dom.window.Event('input'));
    const filter = dom.window.document.querySelector('#roomFilter');
    filter.value = 'WAITING';
    filter.dispatchEvent(new dom.window.Event('change'));

    socket.open();
    socket.receive(createFrame('CONNECTED', { 'heart-beat': '0,0' }));
    socket.receive(createFrame(
      'MESSAGE',
      { destination: '/topic/rooms/presence' },
      JSON.stringify({ roomId: 99, currentPlayers: 1 })
    ));
    await new Promise(resolve => setTimeout(resolve, 0));

    const card = dom.window.document.querySelector('[data-room-id="99"]');
    assert.ok(card);
    assert.equal(card.hidden, false);
    assert.equal(dom.window.document.querySelector('[data-room-id="1"]').hidden, true);
    assert.equal(dom.window.document.querySelector('[data-room-id="2"]').hidden, true);
    assert.equal(dom.window.document.querySelector('#emptyState').hidden, true);
    assert.equal(card.querySelector('.room-number').textContent, '02');
    assert.equal(dom.window.document.querySelector('#roomCount').textContent, '3');
  } finally {
    dom.window.close();
  }
});

test('room list discards a fetched card when its live count reaches zero first', async () => {
  const dom = createDom(roomListMarkup());
  let resolveFetch;
  dom.window.fetch = () => new Promise(resolve => {
    resolveFetch = resolve;
  });
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
    socket.receive(createFrame(
      'MESSAGE',
      { destination: '/topic/rooms/presence' },
      JSON.stringify({ roomId: 99, currentPlayers: 0 })
    ));
    resolveFetch({ ok: true, text: async () => roomCardFragment() });
    await new Promise(resolve => setTimeout(resolve, 0));

    assert.equal(dom.window.document.querySelector('[data-room-id="99"]'), null);
    assert.equal(dom.window.document.querySelector('#roomCount').textContent, '2');
  } finally {
    dom.window.close();
  }
});

test('room list ignores a missing room response after navigation starts', async () => {
  const dom = createDom(roomListMarkup());
  let resolveFetch;
  dom.window.fetch = () => new Promise(resolve => {
    resolveFetch = resolve;
  });
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
    dom.window.dispatchEvent(new dom.window.Event('beforeunload'));
    resolveFetch({ ok: true, text: async () => roomCardFragment() });
    await new Promise(resolve => setTimeout(resolve, 0));

    assert.equal(dom.window.document.querySelector('[data-room-id="99"]'), null);
  } finally {
    dom.window.close();
  }
});

test('room list ignores a missing room response after an internal link starts navigation', async () => {
  const dom = createDom(roomListMarkup());
  let resolveFetch;
  dom.window.fetch = () => new Promise(resolve => {
    resolveFetch = resolve;
  });
  dom.window.document.body.insertAdjacentHTML(
    'beforeend',
    '<a class="join" href="/rooms/99">입장</a>'
  );
  // jsdom의 기본 링크 이동은 막고, 로비 스크립트의 capture 단계만 검증한다.
  dom.window.document.addEventListener('click', event => event.preventDefault());

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
    const link = dom.window.document.querySelector('a.join');
    link.dispatchEvent(new dom.window.MouseEvent('pointerdown', {
      bubbles: true,
      cancelable: true,
      button: 0
    }));
    resolveFetch({ ok: true, text: async () => roomCardFragment() });
    await new Promise(resolve => setTimeout(resolve, 0));

    assert.equal(dom.window.document.querySelector('[data-room-id="99"]'), null);
  } finally {
    dom.window.close();
  }
});

test('patch notes modal opens on the first lobby visit', () => {
  const dom = createDom(patchNotesMarkup('첫 번째 패치노트'));
  const scheduledCallbacks = [];
  const modalInstances = installPatchNotesModalStub(dom);
  dom.window.setTimeout = callback => {
    scheduledCallbacks.push(callback);
    return scheduledCallbacks.length;
  };

  try {
    loadScript(dom, stompSource);
    loadScript(dom, roomListSource);

    assert.equal(modalInstances.length, 1);
    assert.equal(modalInstances[0].showCount, 0);
    assert.equal(scheduledCallbacks.length, 1);
    assert.ok(dom.window.document.querySelector('#patchNotesHideToday'));
    assert.ok(dom.window.document.querySelector('[data-bs-dismiss="modal"]'));
    assert.ok(dom.window.document.querySelector('#patchNotesDetailButton'));
    assert.ok(dom.window.document.querySelector('#patchNotesDetailModal'));

    scheduledCallbacks[0]();
    assert.equal(modalInstances[0].showCount, 1);
  } finally {
    dom.window.close();
  }
});

test('patch notes hide preference suppresses the same note for the same day', () => {
  const content = '오늘의 패치노트';
  const firstDom = createDom(patchNotesMarkup(content));
  const firstModalInstances = installPatchNotesModalStub(firstDom);
  let preference;

  try {
    loadScript(firstDom, stompSource);
    loadScript(firstDom, roomListSource);

    const hideToday = firstDom.window.document.querySelector('#patchNotesHideToday');
    hideToday.checked = true;
    firstDom.window.document
      .querySelector('#patchNotesModal')
      .dispatchEvent(new firstDom.window.Event('hidden.bs.modal'));

    preference = JSON.parse(
      firstDom.window.localStorage.getItem(PATCH_NOTES_STORAGE_KEY)
    );
    assert.equal(preference.content, content);
    assert.match(preference.date, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(firstModalInstances.length, 1);
  } finally {
    firstDom.window.close();
  }

  const secondDom = createDom(patchNotesMarkup(content));
  const secondModalInstances = installPatchNotesModalStub(secondDom);
  const scheduledCallbacks = [];
  secondDom.window.setTimeout = callback => {
    scheduledCallbacks.push(callback);
    return scheduledCallbacks.length;
  };

  try {
    secondDom.window.localStorage.setItem(
      PATCH_NOTES_STORAGE_KEY,
      JSON.stringify(preference)
    );
    loadScript(secondDom, stompSource);
    loadScript(secondDom, roomListSource);

    assert.equal(secondModalInstances.length, 0);
    assert.equal(scheduledCallbacks.length, 0);
  } finally {
    secondDom.window.close();
  }
});

test('patch notes detail opens after the current modal finishes closing', () => {
  const dom = createDom(patchNotesMarkup('요약', '전체 버전 목록'));
  const modalInstances = installPatchNotesModalStub(dom);
  const scheduledCallbacks = [];
  dom.window.setTimeout = callback => {
    scheduledCallbacks.push(callback);
    return scheduledCallbacks.length;
  };

  try {
    loadScript(dom, stompSource);
    loadScript(dom, roomListSource);

    scheduledCallbacks[0]();
    const currentModal = modalInstances[0];
    currentModal.finishShowTransition();
    dom.window.document.querySelector('#patchNotesModal').classList.add('show');
    dom.window.document.querySelector('#patchNotesDetailButton').click();

    assert.equal(currentModal.hideCount, 1);
    assert.equal(modalInstances.length, 2);
    assert.equal(modalInstances[1].showCount, 1);
  } finally {
    dom.window.close();
  }
});

test('patch notes hide preference includes the complete version archive', () => {
  const dom = createDom(patchNotesMarkup('최신 패치노트', '0.3.0-alpha 0.2.0-alpha 0.1.1-alpha 0.1.0-alpha'));
  installPatchNotesModalStub(dom);

  try {
    loadScript(dom, stompSource);
    loadScript(dom, roomListSource);

    dom.window.document.querySelector('#patchNotesHideToday').checked = true;
    dom.window.document
      .querySelector('#patchNotesModal')
      .dispatchEvent(new dom.window.Event('hidden.bs.modal'));

    const preference = JSON.parse(
      dom.window.localStorage.getItem(PATCH_NOTES_STORAGE_KEY)
    );
    assert.equal(
      preference.content,
      '최신 패치노트 | 0.3.0-alpha 0.2.0-alpha 0.1.1-alpha 0.1.0-alpha'
    );
  } finally {
    dom.window.close();
  }
});

test('patch notes content changes invalidate today\'s hide preference', () => {
  const originalContent = '기존 패치노트';
  const originalDom = createDom(patchNotesMarkup(originalContent));
  installPatchNotesModalStub(originalDom);

  let preference;
  try {
    loadScript(originalDom, stompSource);
    loadScript(originalDom, roomListSource);

    const hideToday = originalDom.window.document.querySelector('#patchNotesHideToday');
    hideToday.checked = true;
    originalDom.window.document
      .querySelector('#patchNotesModal')
      .dispatchEvent(new originalDom.window.Event('hidden.bs.modal'));
    preference = JSON.parse(
      originalDom.window.localStorage.getItem(PATCH_NOTES_STORAGE_KEY)
    );
  } finally {
    originalDom.window.close();
  }

  const updatedDom = createDom(patchNotesMarkup('업데이트된 패치노트'));
  const updatedModalInstances = installPatchNotesModalStub(updatedDom);
  const scheduledCallbacks = [];
  updatedDom.window.setTimeout = callback => {
    scheduledCallbacks.push(callback);
    return scheduledCallbacks.length;
  };

  try {
    updatedDom.window.localStorage.setItem(
      PATCH_NOTES_STORAGE_KEY,
      JSON.stringify(preference)
    );
    loadScript(updatedDom, stompSource);
    loadScript(updatedDom, roomListSource);

    assert.equal(updatedModalInstances.length, 1);
    assert.equal(scheduledCallbacks.length, 1);
    assert.equal(
      updatedDom.window.document.querySelector('#patchNotesHideToday').checked,
      false
    );
    scheduledCallbacks[0]();
    assert.equal(updatedModalInstances[0].showCount, 1);

    updatedDom.window.document
      .querySelector('#patchNotesModal')
      .dispatchEvent(new updatedDom.window.Event('hidden.bs.modal'));
    assert.equal(updatedDom.window.localStorage.getItem(PATCH_NOTES_STORAGE_KEY), null);
  } finally {
    updatedDom.window.close();
  }
});

test('patch notes close requested during the opening transition is retried after shown', () => {
  const dom = createDom(patchNotesMarkup('transition-safe patch notes'));
  const modalInstances = installPatchNotesModalStub(dom);
  const scheduledCallbacks = [];
  dom.window.setTimeout = callback => {
    scheduledCallbacks.push(callback);
    return scheduledCallbacks.length;
  };

  try {
    loadScript(dom, stompSource);
    loadScript(dom, roomListSource);

    scheduledCallbacks[0]();
    const modal = modalInstances[0];
    assert.equal(modal.showCount, 1);
    dom.window.document.querySelector('[data-bs-dismiss="modal"]').click();
    assert.equal(modal.hideCount || 0, 0);

    modal.finishShowTransition();
    assert.equal(modal.hideCount, 1);
  } finally {
    dom.window.close();
  }
});
