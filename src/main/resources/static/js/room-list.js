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
  let socket;
  let frameBuffer = '';
  let reconnectTimer;
  let shouldReconnect = true;

  function escapeHeader(value) {
    return String(value)
      .replaceAll('\\', '\\\\')
      .replaceAll(':', '\\c')
      .replaceAll('\n', '\\n')
      .replaceAll('\r', '\\r');
  }

  function unescapeHeader(value) {
    return value
      .replaceAll('\\r', '\r')
      .replaceAll('\\n', '\n')
      .replaceAll('\\c', ':')
      .replaceAll('\\\\', '\\');
  }

  function createFrame(command, headers = {}, body = '') {
    const headerLines = Object.entries(headers)
      .map(([key, value]) => escapeHeader(key) + ':' + escapeHeader(value))
      .join('\n');
    const headerBlock = headerLines ? headerLines + '\n' : '';
    return command + '\n' + headerBlock + '\n' + body + '\0';
  }

  function parseFrame(rawFrame) {
    const frame = rawFrame.replace(/^\n+/, '');
    if (!frame.trim()) {
      return null;
    }

    const separator = frame.indexOf('\n\n');
    const headerPart = separator < 0 ? frame : frame.slice(0, separator);
    const body = separator < 0 ? '' : frame.slice(separator + 2);
    const lines = headerPart.split('\n');
    const command = lines.shift()?.trim();
    const headers = {};

    lines.forEach(line => {
      const index = line.indexOf(':');
      if (index > 0) {
        headers[unescapeHeader(line.slice(0, index))] = unescapeHeader(line.slice(index + 1));
      }
    });

    return { command, headers, body };
  }

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

  function consumeFrames(chunk) {
    frameBuffer += chunk;
    let endIndex = frameBuffer.indexOf('\0');
    while (endIndex >= 0) {
      const rawFrame = frameBuffer.slice(0, endIndex);
      frameBuffer = frameBuffer.slice(endIndex + 1);
      handleFrame(parseFrame(rawFrame));
      endIndex = frameBuffer.indexOf('\0');
    }
  }

  function connect() {
    if (!shouldReconnect || (socket && socket.readyState <= WebSocket.OPEN)) {
      return;
    }

    frameBuffer = '';
    socket = new WebSocket(socketUrl);
    socket.addEventListener('open', () => {
      socket.send(createFrame('CONNECT', {
        'accept-version': '1.2',
        host: location.host,
        'heart-beat': '0,0'
      }));
    });
    socket.addEventListener('message', event => consumeFrames(event.data));
    socket.addEventListener('close', () => {
      if (shouldReconnect) {
        window.clearTimeout(reconnectTimer);
        reconnectTimer = window.setTimeout(connect, 3000);
      }
    });
  }

  window.addEventListener('beforeunload', () => {
    shouldReconnect = false;
    window.clearTimeout(reconnectTimer);
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(createFrame('DISCONNECT'));
    }
  });

  connect();
})();
