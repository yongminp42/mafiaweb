(() => {
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
  let shouldReconnect = true;
  let stopHeartbeat = () => {};
  const reconnectController = createReconnectController(connect);

  function updateOnlinePlayerCount() {
    if (onlinePlayerCount) {
      onlinePlayerCount.textContent = String(onlinePlayerTotal);
    }
  }

  function scheduleRoomListRefresh() {
    if (refreshTimer !== undefined) {
      return;
    }
    refreshTimer = window.setTimeout(() => {
      refreshTimer = undefined;
      if (shouldReconnect) {
        window.location.reload();
      }
    }, 150);
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

  window.addEventListener('beforeunload', () => {
    shouldReconnect = false;
    reconnectController.cancel();
    window.clearTimeout(refreshTimer);
    stopHeartbeat();
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(createFrame('DISCONNECT'));
    }
  });

  connect();
})();
