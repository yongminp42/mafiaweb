(() => {
  const patchNotesModalElement = document.querySelector('#patchNotesModal');
  const patchNotesHideToday = document.querySelector('#patchNotesHideToday');
  const patchNotesContent = patchNotesModalElement?.querySelector('.patch-notes-content');
  const PatchNotesModal = window.bootstrap?.Modal;
  const patchNotesStorageKey = 'mafiagame.patch-notes.preference';

  function getTodayKey() {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const date = String(today.getDate()).padStart(2, '0');
    return `${today.getFullYear()}-${month}-${date}`;
  }

  function getPatchNotesFingerprint() {
    return patchNotesContent?.textContent.replace(/\s+/g, ' ').trim() || '';
  }

  function readPatchNotesPreference() {
    try {
      const storedPreference = window.localStorage.getItem(patchNotesStorageKey);
      return storedPreference ? JSON.parse(storedPreference) : null;
    } catch (error) {
      return null;
    }
  }

  function isHiddenToday() {
    const preference = readPatchNotesPreference();
    return preference?.date === getTodayKey()
      && preference?.content === getPatchNotesFingerprint();
  }

  function rememberPatchNotesPreference() {
    try {
      if (patchNotesHideToday?.checked) {
        window.localStorage.setItem(patchNotesStorageKey, JSON.stringify({
          date: getTodayKey(),
          content: getPatchNotesFingerprint()
        }));
      } else {
        window.localStorage.removeItem(patchNotesStorageKey);
      }
    } catch (error) {
      // Private browsing or a blocked storage area should not prevent the modal from closing.
    }
  }

  if (patchNotesModalElement && PatchNotesModal && !isHiddenToday()) {
    const patchNotesModal = PatchNotesModal.getOrCreateInstance(patchNotesModalElement);
    let patchNotesCloseRequested = false;
    const patchNotesCloseButton = patchNotesModalElement.querySelector(
      '[data-bs-dismiss="modal"]'
    );

    // Bootstrap ignores hide() while the opening fade transition is running. Keep a close
    // request and replay it after shown.bs.modal so a fast click cannot leave the dialog open.
    patchNotesModalElement.addEventListener('shown.bs.modal', () => {
      if (patchNotesCloseRequested) {
        patchNotesCloseRequested = false;
        patchNotesModal.hide();
      }
    });
    patchNotesModalElement.addEventListener('hidden.bs.modal', rememberPatchNotesPreference);
    patchNotesModalElement.addEventListener('hidden.bs.modal', () => {
      patchNotesCloseRequested = false;
    });
    patchNotesCloseButton?.addEventListener('click', () => {
      patchNotesCloseRequested = true;
      patchNotesModal.hide();
    });
    window.setTimeout(() => patchNotesModal.show(), 150);
  }

  const cards = new Map(
    [...document.querySelectorAll('.room-card')]
      .map(card => [Number(card.dataset.roomId), card])
  );

  const socketUrl = (location.protocol === 'https:' ? 'wss' : 'ws') + '://' + location.host + '/ws';
  const lobbyDestination = '/topic/rooms/presence';
  const onlinePlayerCount = document.querySelector('#onlinePlayerCount');
  const { createFrame, createFrameParser, startHeartbeat, createReconnectController } = window.MafiaStomp;
  const liveCounts = new Map();
  let socket;
  let onlinePlayerTotal = 0;
  let refreshTimer;
  let navigatingAway = false;
  let shouldReconnect = true;
  let disconnectSent = false;
  let stopHeartbeat = () => {};
  const reconnectController = createReconnectController(connect);

  function updateOnlinePlayerCount() {
    if (onlinePlayerCount) {
      onlinePlayerCount.textContent = String(onlinePlayerTotal);
    }
  }

  function replaceOnlinePlayerCount(count) {
    const normalizedCount = Number(count);
    if (!Number.isFinite(normalizedCount)) {
      return;
    }

    onlinePlayerTotal = Math.max(0, Math.trunc(normalizedCount));
    updateOnlinePlayerCount();
  }

  function scheduleRoomListRefresh() {
    if (refreshTimer !== undefined || navigatingAway || !shouldReconnect) {
      return;
    }
    refreshTimer = window.setTimeout(() => {
      refreshTimer = undefined;
      if (shouldReconnect && !navigatingAway) {
        window.location.reload();
      }
    }, 150);
  }

  // 로비에서 다른 화면으로 이동하기 시작하면 예약된 목록 갱신이
  // 현재 이동과 경쟁하지 않도록 즉시 중단한다.
  function stopLobbyUpdates() {
    navigatingAway = true;
    shouldReconnect = false;
    reconnectController.cancel();
    if (refreshTimer !== undefined) {
      window.clearTimeout(refreshTimer);
      refreshTimer = undefined;
    }
    stopHeartbeat();
    stopHeartbeat = () => {};
    if (!disconnectSent && socket && socket.readyState === WebSocket.OPEN) {
      disconnectSent = true;
      socket.send(createFrame('DISCONNECT'));
    }
  }

  function isPrimaryInternalLink(event) {
    if (!event || event.defaultPrevented || event.button !== 0
        || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return false;
    }

    const anchor = event.target?.closest?.('a[href]');
    if (!anchor) {
      return false;
    }

    try {
      return new URL(anchor.href, window.location.href).origin === window.location.origin;
    } catch {
      return false;
    }
  }

  function replaceLiveCount(roomId, count) {
    const previousCount = liveCounts.get(roomId) || 0;
    if (count <= 0) {
      liveCounts.delete(roomId);
      onlinePlayerTotal = Math.max(0, onlinePlayerTotal - previousCount);
      return;
    }

    liveCounts.set(roomId, count);
    onlinePlayerTotal += count - previousCount;
  }

  function updateRoomCount(update, refreshTotal = true) {
    if (!update || !Number.isFinite(Number(update.roomId))) {
      return;
    }

    const roomId = Number(update.roomId);
    const count = Math.max(0, Number(update.currentPlayers));
    if (!Number.isFinite(count)) {
      return;
    }

    const card = cards.get(roomId);
    if (count <= 0) {
      replaceLiveCount(roomId, count);
      if (card) {
        card.remove();
        cards.delete(roomId);
        document.dispatchEvent(new CustomEvent('room:removed', {
          detail: { roomId }
        }));
      }
      if (refreshTotal) {
        updateOnlinePlayerCount();
      }
      return;
    }

    replaceLiveCount(roomId, count);

    const countElement = card?.querySelector('[data-room-player-count]');
    if (!countElement) {
      scheduleRoomListRefresh();
      if (refreshTotal) {
        updateOnlinePlayerCount();
      }
      return;
    }

    countElement.textContent = String(Math.max(0, count));
    if (refreshTotal) {
      updateOnlinePlayerCount();
    }
  }

  function updateRoomCounts(message) {
    if (Array.isArray(message)) {
      liveCounts.clear();
      onlinePlayerTotal = 0;
      message.forEach(update => updateRoomCount(update, false));
      updateOnlinePlayerCount();
      return;
    }

    if (message && Number.isFinite(Number(message.onlinePlayers))) {
      replaceOnlinePlayerCount(message.onlinePlayers);
      return;
    }

    updateRoomCount(message);
  }

  function handleFrame(frame, connection) {
    if (!frame) {
      return;
    }

    if (frame.command === 'CONNECTED') {
      reconnectController.reset();
      stopHeartbeat();
      stopHeartbeat = startHeartbeat(connection, frame);
      connection.send(createFrame('SUBSCRIBE', {
        id: 'lobby-presence',
        destination: lobbyDestination,
        ack: 'auto'
      }));
      connection.send(createFrame('SEND', {
        destination: '/app/rooms/presence',
        'content-type': 'application/json'
      }, '{}'));
      return;
    }

    if (frame.command === 'MESSAGE'
        && frame.headers.destination === lobbyDestination) {
      try {
        updateRoomCounts(JSON.parse(frame.body));
      } catch (error) {
        console.error('Invalid room presence count', error);
      }
    }
  }

  function connect() {
    if (!shouldReconnect || (socket && socket.readyState <= WebSocket.OPEN)) {
      return;
    }

    const connection = new WebSocket(socketUrl);
    const frameParser = createFrameParser(frame => handleFrame(frame, connection));
    socket = connection;
    connection.addEventListener('open', () => {
      if (socket !== connection) {
        return;
      }
      connection.send(createFrame('CONNECT', {
        'accept-version': '1.2',
        host: location.host,
        'heart-beat': '10000,10000'
      }));
    });
    connection.addEventListener('message', event => {
      if (socket === connection) {
        frameParser(event.data);
      }
    });
    connection.addEventListener('close', () => {
      if (socket !== connection) {
        return;
      }
      stopHeartbeat();
      stopHeartbeat = () => {};
      if (shouldReconnect) {
        reconnectController.schedule();
      }
    });
  }

  // 클릭/제출 시점에 먼저 정리해 beforeunload보다 빠른 타이머 경합도 막는다.
  document.addEventListener('pointerdown', event => {
    if (isPrimaryInternalLink(event)) {
      stopLobbyUpdates();
    }
  }, true);
  document.addEventListener('click', event => {
    if (isPrimaryInternalLink(event)) {
      stopLobbyUpdates();
    }
  }, true);
  document.addEventListener('submit', () => stopLobbyUpdates(), true);
  window.addEventListener('beforeunload', stopLobbyUpdates);

  connect();
})();
