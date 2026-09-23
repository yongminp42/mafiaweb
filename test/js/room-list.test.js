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
      <article class="room-card" data-room-id="1">
        <span data-room-player-count>5</span>
      </article>
      <article class="room-card" data-room-id="2">
        <span data-room-player-count>4</span>
      </article>
    </body></html>`;
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

test('room list cancels a pending refresh when the page starts navigating away', () => {
  const dom = createDom(roomListMarkup());
  const scheduledCallbacks = [];
  const clearedTimers = [];
  dom.window.setTimeout = callback => {
    scheduledCallbacks.push(callback);
    return scheduledCallbacks.length;
  };
  dom.window.clearTimeout = timerId => clearedTimers.push(timerId);
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

    assert.deepEqual(clearedTimers.filter(timerId => timerId !== undefined), [1]);
    assert.equal(scheduledCallbacks.length, 1);
  } finally {
    dom.window.close();
  }
});

test('room list cancels a pending refresh when an internal link starts navigation', () => {
  const dom = createDom(roomListMarkup());
  const scheduledCallbacks = [];
  const clearedTimers = [];
  dom.window.setTimeout = callback => {
    scheduledCallbacks.push(callback);
    return scheduledCallbacks.length;
  };
  dom.window.clearTimeout = timerId => clearedTimers.push(timerId);
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

    assert.deepEqual(clearedTimers.filter(timerId => timerId !== undefined), [1]);
    assert.equal(scheduledCallbacks.length, 1);
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
