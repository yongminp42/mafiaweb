(() => {
  const patchNotesModalElement = document.querySelector('#patchNotesModal');
  const patchNotesHideToday = document.querySelector('#patchNotesHideToday');
  const patchNotesContent = [
    ...document.querySelectorAll(
      '#patchNotesModal .patch-notes-content, #patchNotesDetailModal .patch-notes-detail-content'
    )
  ];
  const PatchNotesModal = window.bootstrap?.Modal;
  const patchNotesStorageKey = 'mafiagame.patch-notes.preference';

  function getTodayKey() {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const date = String(today.getDate()).padStart(2, '0');
    return `${today.getFullYear()}-${month}-${date}`;
  }

  function getPatchNotesFingerprint() {
    return patchNotesContent
      .map(element => element.textContent.replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .join(' | ');
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

  let patchNotesModal = null;
  if (patchNotesModalElement && PatchNotesModal && !isHiddenToday()) {
    patchNotesModal = PatchNotesModal.getOrCreateInstance(patchNotesModalElement);
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

  const patchNotesDetailButton = document.querySelector('#patchNotesDetailButton');
  const patchNotesDetailModalElement = document.querySelector('#patchNotesDetailModal');
  if (patchNotesDetailButton && patchNotesDetailModalElement && PatchNotesModal) {
    let patchNotesDetailModal = null;
    patchNotesDetailButton.addEventListener('click', () => {
      patchNotesDetailModal ??= PatchNotesModal.getOrCreateInstance(patchNotesDetailModalElement);
      const showDetailModal = () => patchNotesDetailModal.show();

      if (patchNotesModal && patchNotesModalElement.classList.contains('show')) {
        patchNotesModalElement.addEventListener('hidden.bs.modal', showDetailModal, { once: true });
        patchNotesModal.hide();
      } else {
        showDetailModal();
      }
    });
  }

  const cards = new Map(
    [...document.querySelectorAll('.room-card')]
      .map(card => [Number(card.dataset.roomId), card])
  );
  const roomList = document.querySelector('#roomList');
  const roomSearch = document.querySelector('#roomSearch');
  const roomFilter = document.querySelector('#roomFilter');
  const emptyRoomState = document.querySelector('#emptyState');
  const roomCount = document.querySelector('#roomCount');
  const pendingRoomCards = new Set();
  let applyingRoomCountSnapshot = false;
  let roomListRefreshQueued = false;

  function refreshRoomList() {
    const query = roomSearch?.value.trim().toLowerCase() || '';
    let visibleCount = 0;
    cards.forEach(card => {
      const show = (!roomFilter || roomFilter.value === 'all' || card.dataset.status === roomFilter.value)
        && (card.dataset.title || '').toLowerCase().includes(query);
      card.hidden = !show;
      if (show) visibleCount += 1;
    });
    if (emptyRoomState) {
      emptyRoomState.hidden = visibleCount !== 0;
    }
    if (roomCount) {
      roomCount.textContent = String(cards.size);
    }
    [...(roomList?.querySelectorAll('.room-card') || [])].forEach((card, index) => {
      const number = card.querySelector('.room-number');
      if (number) number.textContent = String(index + 1).padStart(2, '0');
    });
  }

  roomSearch?.addEventListener('input', refreshRoomList);
  roomFilter?.addEventListener('change', refreshRoomList);
  refreshRoomList();

  async function loadRoomCard(roomId) {
    if (!roomList || cards.has(roomId) || pendingRoomCards.has(roomId)
        || navigatingAway || !shouldReconnect) {
      return;
    }
    pendingRoomCards.add(roomId);
    try {
      const response = await fetch(`/rooms/${encodeURIComponent(roomId)}/card`, {
        cache: 'no-store',
        credentials: 'same-origin',
        headers: { Accept: 'text/html' }
      });
      if (!response.ok) return;
      const markup = await response.text();
      const documentFragment = new DOMParser().parseFromString(markup, 'text/html');
      const card = documentFragment.querySelector('.room-card');
      const currentCount = liveCounts.get(roomId) || 0;
      if (!card || currentCount <= 0 || cards.has(roomId) || navigatingAway || !shouldReconnect) {
        return;
      }
      const countElement = card.querySelector('[data-room-player-count]');
      if (countElement) countElement.textContent = String(currentCount);
      const firstPlayingCard = card.dataset.status === 'WAITING'
        ? [...cards.values()].find(existingCard => existingCard.dataset.status === 'PLAYING')
        : null;
      roomList.insertBefore(card, firstPlayingCard || null);
      cards.set(roomId, card);
      refreshRoomList();
    } catch (error) {
      console.error('새 게임방 정보를 불러오지 못했습니다.', error);
    } finally {
      pendingRoomCards.delete(roomId);
    }
  }

  document.addEventListener('room:removed', () => {
    if (applyingRoomCountSnapshot) {
      roomListRefreshQueued = true;
      return;
    }
    refreshRoomList();
  });

  const socketUrl = (location.protocol === 'https:' ? 'wss' : 'ws') + '://' + location.host + '/ws';
  const lobbyDestination = '/topic/rooms/presence';
  const onlinePlayerCount = document.querySelector('#onlinePlayerCount');
  const { createFrame, createFrameParser, startHeartbeat, createReconnectController } = window.MafiaStomp;
  const liveCounts = new Map();
  let socket;
  let onlinePlayerTotal = 0;
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

  // 로비에서 다른 화면으로 이동하기 시작하면 예약된 목록 갱신이
  // 현재 이동과 경쟁하지 않도록 즉시 중단한다.
  function stopLobbyUpdates() {
    navigatingAway = true;
    shouldReconnect = false;
    reconnectController.cancel();
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
      loadRoomCard(roomId);
      if (refreshTotal) {
        updateOnlinePlayerCount();
      }
      return;
    }

    countElement.textContent = String(Math.max(0, count));
    // 인원수만 바뀌면 검색·필터·정렬·카드 번호는 그대로라 목록 전체를 다시 훑지 않는다.
    if (refreshTotal) {
      updateOnlinePlayerCount();
    }
  }

  function updateRoomCounts(message) {
    if (Array.isArray(message)) {
      liveCounts.clear();
      onlinePlayerTotal = 0;
      applyingRoomCountSnapshot = true;
      try {
        message.forEach(update => updateRoomCount(update, false));
      } finally {
        applyingRoomCountSnapshot = false;
        if (roomListRefreshQueued) {
          roomListRefreshQueued = false;
          refreshRoomList();
        }
        updateOnlinePlayerCount();
      }
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
  const toast = document.querySelector('#toast');
  document.addEventListener('click', event => {
    if (!toast || !event.target?.closest?.('.join')) {
      return;
    }
    toast.textContent = '게임 입장을 준비하고 있어요.';
    toast.classList.add('show');
    window.setTimeout(() => toast.classList.remove('show'), 2200);
  });
  document.addEventListener('submit', () => stopLobbyUpdates(), true);
  window.addEventListener('beforeunload', stopLobbyUpdates);

  connect();
})();
