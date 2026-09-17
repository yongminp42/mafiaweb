(() => {
  const roomId = document.body.dataset.roomId;
  const nickname = document.body.dataset.nickname || '';
  const userId = document.body.dataset.userId ? Number(document.body.dataset.userId) : null;
  const capacity = Number(document.body.dataset.capacity || 0);
  const socketUrl = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`;
  const {
    createFrame,
    createFrameParser,
    startHeartbeat,
    createReconnectController
  } = window.MafiaStomp;
  const form = document.querySelector('#chatForm');
  const input = form?.querySelector('input[name="content"]');
  const readyButton = document.querySelector('#ready');
  const memberGrid = document.querySelector('#memberGrid');
  const roomPlayerCount = document.querySelector('#roomPlayerCount');
  const roomMemberCount = document.querySelector('#roomMemberCount');
  const messages = document.querySelector('#messages');
  const notice = document.querySelector('#chatNotice');
  const connectionStatus = document.querySelector('#chatConnectionStatus');
  const statusDot = document.querySelector('#chatStatusDot');
  const submitButton = form?.querySelector('button[type="submit"]');
  const topicDestination = `/topic/rooms/${roomId}/chat`;
  const presenceDestination = `/topic/rooms/${roomId}/presence`;
  const errorDestination = '/user/queue/errors';
  const joinedDestination = '/user/queue/room-joined';
  const MAX_RENDERED_MESSAGES = 200;

  if (!roomId || !form || !input || !messages) {
    return;
  }

  let socket;
  let connected = false;
  let shouldReconnect = true;
  let currentReady = false;
  let presenceReady = false;
  let joinedRoom = false;
  let forcedLeave = false;
  let roomTopicsSubscribed = false;
  let stopHeartbeat = () => {};
  let renderedMessageCount = 0;
  const senderColorCache = new Map();
  const reconnectController = createReconnectController(connect);

  if (readyButton) {
    readyButton.disabled = true;
  }

  function showToast(message) {
    const toast = document.querySelector('#toast');
    if (!toast) {
      return;
    }
    toast.textContent = message;
    toast.classList.add('show');
    window.setTimeout(() => toast.classList.remove('show'), 2200);
  }

  function setConnectionStatus(label, isOnline) {
    if (connectionStatus) {
      connectionStatus.textContent = label;
    }
    if (statusDot) {
      statusDot.classList.toggle('offline', !isOnline);
    }
    updateChatAvailability(isOnline);
    if (!isOnline) {
      presenceReady = false;
    }
    updateReadyAvailability(isOnline);
  }

  function setNotice(message) {
    if (notice) {
      notice.textContent = message;
    }
  }

  function forceLeaveRoom() {
    if (forcedLeave) {
      return;
    }

    forcedLeave = true;
    shouldReconnect = false;
    connected = false;
    joinedRoom = false;
    presenceReady = false;
    reconnectController.cancel();
    stopHeartbeat();
    setConnectionStatus('퇴장됨', false);
    setNotice('다른 게임방에 입장하여 이 방에서 퇴장했습니다.');
    showToast('다른 게임방에 입장하여 이 방에서 퇴장했습니다.');

    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.close();
    }
    window.setTimeout(() => window.location.replace('/rooms'), 700);
  }

  function rejectRoomEntry(message) {
    if (forcedLeave) {
      return;
    }

    forcedLeave = true;
    shouldReconnect = false;
    connected = false;
    joinedRoom = false;
    presenceReady = false;
    reconnectController.cancel();
    stopHeartbeat();
    setConnectionStatus('입장 불가', false);
    setNotice(message);

    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.close();
    }
    window.setTimeout(() => window.location.replace('/rooms'), 1200);
  }

  function subscribeRoomTopics(connection) {
    if (roomTopicsSubscribed) {
      return;
    }
    roomTopicsSubscribed = true;
    connection.send(createFrame('SUBSCRIBE', {
      id: 'room-presence',
      destination: presenceDestination,
      ack: 'auto'
    }));
    connection.send(createFrame('SUBSCRIBE', {
      id: 'room-chat',
      destination: topicDestination,
      ack: 'auto'
    }));
  }

  function handleFrame(frame, connection) {
    if (!frame) {
      return;
    }

    if (frame.command === 'CONNECTED') {
      reconnectController.reset();
      connected = true;
      stopHeartbeat();
      stopHeartbeat = startHeartbeat(connection, frame);
      setConnectionStatus('실시간', true);
      setNotice('실시간 채팅에 연결되었습니다.');
      connection.send(createFrame('SUBSCRIBE', { id: 'chat-errors', destination: errorDestination, ack: 'auto' }));
      connection.send(createFrame('SUBSCRIBE', { id: 'room-joined', destination: joinedDestination, ack: 'auto' }));
      connection.send(createFrame('SEND', {
        destination: `/app/rooms/${roomId}/join`,
        'content-type': 'application/json'
      }, '{}'));
      return;
    }

    if (frame.command === 'MESSAGE') {
      try {
        const message = JSON.parse(frame.body);
        if (!message || typeof message !== 'object') {
          return;
        }
        const isErrorMessage = message.type === 'ERROR'
          || frame.headers.destination === errorDestination
          || frame.headers.subscription === 'chat-errors';
        if (isErrorMessage) {
          const errorMessage = message.message || '요청을 처리하지 못했습니다.';
          showToast(errorMessage);
          if (!joinedRoom) {
            rejectRoomEntry(errorMessage);
          }
          return;
        }
        const isJoinedMessage = frame.headers.destination === joinedDestination
          || frame.headers.subscription === 'room-joined';
        if (isJoinedMessage) {
          renderParticipants(message.participants);
          if (joinedRoom) {
            subscribeRoomTopics(connection);
          } else {
            rejectRoomEntry('게임방 입장 정보를 확인하지 못했습니다.');
          }
          return;
        }
        if (frame.headers.destination === presenceDestination || Array.isArray(message.participants)) {
          renderParticipants(message.participants);
          return;
        }
        if (message.type === 'CHAT') {
          appendMessage(message);
        }
      } catch (error) {
        console.error('Invalid chat message', error);
      }
      return;
    }

    if (frame.command === 'ERROR') {
      rejectRoomEntry(frame.body || '채팅 연결에 문제가 있습니다.');
    }
  }

  function appendMessage(message) {
    const senderName = String(message.sender || '알 수 없음').trim() || '알 수 없음';
    const isOwnMessage = senderName === nickname;
    const item = document.createElement('article');
    item.className = `chat-message ${isOwnMessage ? 'own' : 'other'}`;
    item.dataset.sender = senderName;

    const avatar = document.createElement('div');
    avatar.className = `chat-avatar chat-avatar-${getSenderColor(senderName)}`;
    avatar.setAttribute('aria-hidden', 'true');
    avatar.textContent = getSenderInitial(senderName);

    const messageBody = document.createElement('div');
    messageBody.className = 'chat-message-body';

    const meta = document.createElement('div');
    meta.className = 'chat-message-meta';

    const sender = document.createElement('strong');
    sender.className = 'chat-message-sender';
    sender.textContent = isOwnMessage ? `나 · ${senderName}` : senderName;

    const time = document.createElement('time');
    time.textContent = message.sentAt
      ? new Date(message.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '';

    const content = document.createElement('div');
    content.className = 'chat-message-bubble';
    content.textContent = message.content || '';

    meta.append(sender, time);
    messageBody.append(meta, content);
    item.append(avatar, messageBody);
    messages.append(item);
    renderedMessageCount += 1;
    if (renderedMessageCount > MAX_RENDERED_MESSAGES) {
      messages.querySelector('.chat-message')?.remove();
      renderedMessageCount -= 1;
    }
    messages.scrollTop = messages.scrollHeight;
  }

  function getSenderInitial(senderName) {
    return Array.from(senderName)[0] || '?';
  }

  function getSenderColor(senderName) {
    const cachedColor = senderColorCache.get(senderName);
    if (cachedColor !== undefined) {
      return cachedColor;
    }

    const color = Array.from(senderName).reduce(
      (hash, character) => (hash * 31 + character.codePointAt(0)) % 6,
      0
    );
    senderColorCache.set(senderName, color);
    return color;
  }

  function renderReadyButton(isReady) {
    currentReady = Boolean(isReady);
    if (!readyButton) {
      return;
    }
    readyButton.classList.toggle('is-ready', currentReady);
    readyButton.textContent = currentReady ? '준비 취소' : '준비 완료';
  }

  function updateReadyAvailability(isOnline = connected) {
    if (readyButton) {
      readyButton.disabled = !isOnline || !presenceReady;
    }
  }

  function updateChatAvailability(isOnline = connected) {
    if (submitButton) {
      submitButton.disabled = !isOnline || !joinedRoom;
    }
  }

  function renderParticipants(participants) {
    if (forcedLeave || !memberGrid || !Array.isArray(participants)) {
      return;
    }

    const fragment = document.createDocumentFragment();
    let currentParticipant = null;
    const wasJoined = joinedRoom;

    participants.forEach(participant => {
      const article = document.createElement('article');
      article.className = `col member${participant.host ? ' host' : ''}${participant.ready ? ' participant-ready' : ''}`;

      const avatar = document.createElement('div');
      avatar.className = `avatar${participant.host ? ' a1' : ''}`;
      avatar.textContent = getSenderInitial(participant.nickname || '?');

      const name = document.createElement('b');
      name.textContent = participant.nickname || '알 수 없음';

      const status = document.createElement('small');
      const labels = [];
      if (participant.host) {
        labels.push('방장');
      }
      labels.push(participant.ready ? '준비 완료' : '대기 중');
      status.textContent = labels.join(' · ');

      article.append(avatar, name, status);
      fragment.append(article);

      const isCurrentUser = userId !== null
        ? Number(participant.userId) === userId
        : participant.nickname === nickname;
      if (isCurrentUser) {
        currentParticipant = participant;
      }
    });

    const emptySeats = Math.max(capacity - participants.length, 0);
    for (let index = 0; index < emptySeats; index += 1) {
      const emptySeat = document.createElement('article');
      emptySeat.className = 'col member empty-seat';
      emptySeat.innerHTML = '<div class="avatar">+</div><b>빈 자리</b>';
      fragment.append(emptySeat);
    }

    memberGrid.replaceChildren(fragment);
    if (roomPlayerCount) {
      roomPlayerCount.textContent = participants.length;
    }
    if (roomMemberCount) {
      roomMemberCount.textContent = participants.length;
    }
    joinedRoom = currentParticipant !== null;
    presenceReady = currentParticipant !== null;
    renderReadyButton(currentParticipant?.ready || false);
    updateReadyAvailability();
    updateChatAvailability();

    if (wasJoined && currentParticipant === null) {
      forceLeaveRoom();
    }
  }

  function connect() {
    if (!shouldReconnect || (socket && socket.readyState <= WebSocket.OPEN)) {
      return;
    }

    joinedRoom = false;
    presenceReady = false;
    currentReady = false;
    renderReadyButton(false);
    updateChatAvailability(false);
    setConnectionStatus('연결 중', false);
    const connection = new WebSocket(socketUrl);
    const frameParser = createFrameParser(frame => handleFrame(frame, connection));
    socket = connection;
    roomTopicsSubscribed = false;

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
    connection.addEventListener('error', () => {
      if (socket !== connection) {
        return;
      }
      setConnectionStatus('오류', false);
      setNotice('채팅 연결에 문제가 있습니다.');
    });
    connection.addEventListener('close', () => {
      if (socket !== connection) {
        return;
      }
      connected = false;
      stopHeartbeat();
      stopHeartbeat = () => {};
      if (forcedLeave) {
        return;
      }
      setConnectionStatus('재연결 중', false);
      setNotice('채팅 연결이 끊겼습니다. 다시 연결하는 중입니다.');
      if (shouldReconnect) {
        reconnectController.schedule();
      }
    });
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    const content = input.value.trim();
    if (!content) {
      return;
    }
    if (!connected || !joinedRoom || !presenceReady || socket.readyState !== WebSocket.OPEN) {
      showToast('채팅 서버에 연결 중입니다.');
      return;
    }

    socket.send(createFrame('SEND', {
      destination: `/app/rooms/${roomId}/chat`,
      'content-type': 'application/json'
    }, JSON.stringify({ content })));
    input.value = '';
    input.focus();
  });

  readyButton?.addEventListener('click', () => {
    if (!connected || !joinedRoom || !presenceReady || socket.readyState !== WebSocket.OPEN) {
      showToast('게임방 연결 중입니다.');
      return;
    }

    socket.send(createFrame('SEND', {
      destination: `/app/rooms/${roomId}/ready`,
      'content-type': 'application/json'
    }, JSON.stringify({ ready: !currentReady })));
  });

  window.addEventListener('beforeunload', () => {
    shouldReconnect = false;
    reconnectController.cancel();
    stopHeartbeat();
    if (connected && socket && socket.readyState === WebSocket.OPEN) {
      socket.send(createFrame('DISCONNECT'));
    }
  });

  connect();
})();
