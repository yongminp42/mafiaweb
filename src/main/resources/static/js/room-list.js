(() => {
  const cards = new Map(
    [...document.querySelectorAll('.room-card')]
      .map(card => [Number(card.dataset.roomId), card])
  );

  if (cards.size === 0) {
    return;
  }

  const socketUrl = (location.protocol === 'https:' ? 'wss' : 'ws') + '://' + location.host + '/ws';
  const lobbyDestination = '/topic/rooms/presence';
  const { createFrame, createFrameParser } = window.MafiaStomp;
  let socket;
  let reconnectTimer;
  let shouldReconnect = true;

  function updateRoomCount(update) {
    if (!update || !Number.isFinite(Number(update.roomId))) {
      return;
    }

    const roomId = Number(update.roomId);
    const count = Number(update.currentPlayers);
    if (!Number.isFinite(count)) {
      return;
    }

    const card = cards.get(roomId);
    if (count <= 0) {
      if (card) {
        card.remove();
        cards.delete(roomId);
        document.dispatchEvent(new CustomEvent('room:removed', {
          detail: { roomId }
        }));
      }
      return;
    }

    const countElement = card?.querySelector('[data-room-player-count]');
    if (!countElement) {
      return;
    }

    countElement.textContent = String(Math.max(0, count));
  }

  function updateRoomCounts(message) {
    if (Array.isArray(message)) {
      message.forEach(updateRoomCount);
      return;
    }
    updateRoomCount(message);
  }

  function handleFrame(frame) {
    if (!frame) {
      return;
    }

    if (frame.command === 'CONNECTED') {
      socket.send(createFrame('SUBSCRIBE', {
        id: 'lobby-presence',
        destination: lobbyDestination,
        ack: 'auto'
      }));
      socket.send(createFrame('SEND', {
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

    socket = new WebSocket(socketUrl);
    socket.addEventListener('open', () => {
      socket.send(createFrame('CONNECT', {
        'accept-version': '1.2',
        host: location.host,
        'heart-beat': '0,0'
      }));
    });
    socket.addEventListener('message', event => frameParser(event.data));
    socket.addEventListener('close', () => {
      if (shouldReconnect) {
        window.clearTimeout(reconnectTimer);
        reconnectTimer = window.setTimeout(connect, 3000);
      }
    });
  }

  const frameParser = createFrameParser(handleFrame);

  window.addEventListener('beforeunload', () => {
    shouldReconnect = false;
    window.clearTimeout(reconnectTimer);
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(createFrame('DISCONNECT'));
    }
  });

  connect();
})();
