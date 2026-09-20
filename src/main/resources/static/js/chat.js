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
  const chatChannel = document.querySelector('#chatChannel');
  const readyButton = document.querySelector('#ready');
  const startButton = document.querySelector('#startGame');
  const startGameNotice = document.querySelector('#startGameNotice');
  const memberGrid = document.querySelector('#memberGrid');
  const roomPlayerCount = document.querySelector('#roomPlayerCount');
  const roomMemberCount = document.querySelector('#roomMemberCount');
  const roomStatus = document.querySelector('#roomStatus');
  const messages = document.querySelector('#messages');
  const notice = document.querySelector('#chatNotice');
  const connectionStatus = document.querySelector('#chatConnectionStatus');
  const statusDot = document.querySelector('#chatStatusDot');
  const submitButton = form?.querySelector('button[type="submit"]');
  const topicDestination = `/topic/rooms/${roomId}/chat`;
  const mafiaChatDestination = '/user/queue/mafia-chat';
  const deadChatDestination = '/user/queue/dead-chat';
  const presenceDestination = `/topic/rooms/${roomId}/presence`;
  const presenceSyncDestination = '/user/queue/presence-synced';
  const gameDestination = `/topic/rooms/${roomId}/game`;
  const gameSyncDestination = `/app/rooms/${roomId}/game/sync`;
  const gameRoleDestination = '/user/queue/game-role';
  const gameResultDestination = '/user/queue/game-result';
  const nightResultDestination = '/user/queue/night-result';
  const gamePanel = document.querySelector('#gamePanel');
  const gameRolePanel = document.querySelector('#gameRolePanel');
  const gameRoleLabel = document.querySelector('#gameRoleLabel');
  const confirmGameRole = document.querySelector('#confirmGameRole');
  const finalDefenseNotice = document.querySelector('#finalDefenseNotice');
  const gameResultPanel = document.querySelector('#gameResultPanel');
  const gameWinnerLabel = document.querySelector('#gameWinnerLabel');
  const gameResultRoleLabel = document.querySelector('#gameResultRoleLabel');
  const gameResultAliveLabel = document.querySelector('#gameResultAliveLabel');
  const gameResultNotice = document.querySelector('#gameResultNotice');
  const gameRoleRevealPanel = document.querySelector('#gameRoleRevealPanel');
  const gameRoleRevealList = document.querySelector('#gameRoleRevealList');
  const gamePhaseTitle = document.querySelector('#gamePhaseTitle');
  const gameTimerElement = document.querySelector('#gameTimer');
  const gameMessage = document.querySelector('#gameMessage');
  const gameActions = document.querySelector('#gameActions');
  const nominationAction = document.querySelector('#nominationAction');
  const nominationTarget = document.querySelector('#nominationTarget');
  const submitNomination = document.querySelector('#submitNomination');
  const executionAction = document.querySelector('#executionAction');
  const executePlayer = document.querySelector('#executePlayer');
  const sparePlayer = document.querySelector('#sparePlayer');
  const nightAction = document.querySelector('#nightAction');
  const nightActionTitle = document.querySelector('#nightActionTitle');
  const nightTarget = document.querySelector('#nightTarget');
  const submitNightAction = document.querySelector('#submitNightAction');
  const nightResultPanel = document.querySelector('#nightResultPanel');
  const nightResultLabel = document.querySelector('#nightResultLabel');
  const gameActionStatus = document.querySelector('#gameActionStatus');
  const errorDestination = '/user/queue/errors';
  const joinedDestination = '/user/queue/room-joined';
  const MAX_RENDERED_MESSAGES = 200;
  const GAME_PHASE_LABELS = {
    ROLE_ASSIGNMENT: '역할 확인',
    DAY_DISCUSSION: '낮',
    NOMINATION_VOTE: '지목 투표',
    FINAL_DEFENSE: '최종 변론',
    EXECUTION_VOTE: '처형 투표',
    NIGHT: '밤',
    FINISHED: '게임 종료'
  };
  const GAME_WINNER_LABELS = {
    MAFIA: '마피아 진영 승리',
    CITIZEN: '시민 진영 승리'
  };
  const INVESTIGATION_FACTION_LABELS = {
    MAFIA: '마피아',
    CITIZEN: '시민'
  };
  const GAME_ROLE_LABELS = {
    MAFIA: '마피아',
    DOCTOR: '의사',
    POLICE: '경찰',
    CITIZEN: '시민'
  };
  const NIGHT_ACTIONS = {
    MAFIA: { action: 'MAFIA_KILL', title: '제거할 참가자' },
    DOCTOR: { action: 'DOCTOR_PROTECT', title: '보호할 참가자' },
    POLICE: { action: 'POLICE_INVESTIGATE', title: '조사할 참가자' }
  };
  const MIN_GAME_PLAYERS = 4;

  if (!roomId || !form || !input || !messages) {
    return;
  }

  let socket;
  let connected = false;
  let shouldReconnect = true;
  let currentReady = false;
  let presenceReady = false;
  let joinedRoom = false;
  let gameStarted = false;
  let currentParticipants = [];
  let currentParticipant = null;
  let currentRole = null;
  let roleConfirmed = false;
  let roleConfirmationPending = false;
  let gameState = null;
  let lastGamePhase = null;
  let gameActionSubmitted = false;
  let gameTimerId = null;
  let forcedLeave = false;
  let roomTopicsSubscribed = false;
  let stopHeartbeat = () => {};
  let renderedMessageCount = 0;
  const senderColorCache = new Map();
  const reconnectController = createReconnectController(connect);

  if (readyButton) {
    readyButton.disabled = true;
  }
  if (startButton) {
    startButton.disabled = true;
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
    updateStartGameAvailability(isOnline);
    updateGameActions(isOnline);
    updateRoleConfirmation();
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
    stopGameTimer();
    gameState = null;
    clearGameRole();
    clearGameResult();
    clearNightResult();
    lastGamePhase = null;
    gameActionSubmitted = false;
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
    stopGameTimer();
    gameState = null;
    clearGameRole();
    clearGameResult();
    clearNightResult();
    lastGamePhase = null;
    gameActionSubmitted = false;
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

    // 입장 확인을 받은 뒤에만 방 토픽을 구독한다. 이후 현재 참가자/게임 상태를
    // 다시 요청하므로 새로고침이나 재접속 후에도 화면을 서버 상태로 복원할 수 있다.
    roomTopicsSubscribed = true;
    connection.send(createFrame('SUBSCRIBE', {
      id: 'room-presence-sync',
      destination: presenceSyncDestination,
      ack: 'auto'
    }));
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
    connection.send(createFrame('SUBSCRIBE', {
      id: 'room-game',
      destination: gameDestination,
      ack: 'auto'
    }));
    connection.send(createFrame('SUBSCRIBE', {
      id: 'game-role',
      destination: gameRoleDestination,
      ack: 'auto'
    }));
    connection.send(createFrame('SUBSCRIBE', {
      id: 'game-result',
      destination: gameResultDestination,
      ack: 'auto'
    }));
    connection.send(createFrame('SUBSCRIBE', {
      id: 'night-result',
      destination: nightResultDestination,
      ack: 'auto'
    }));
    connection.send(createFrame('SUBSCRIBE', {
      id: 'mafia-chat',
      destination: mafiaChatDestination,
      ack: 'auto'
    }));
    connection.send(createFrame('SUBSCRIBE', {
      id: 'dead-chat',
      destination: deadChatDestination,
      ack: 'auto'
    }));
    connection.send(createFrame('SEND', {
      destination: `/app/rooms/${roomId}/presence/sync`,
      'content-type': 'application/json'
    }, '{}'));
    connection.send(createFrame('SEND', {
      destination: gameSyncDestination,
      'content-type': 'application/json'
    }, '{}'));
  }

  function handleFrame(frame, connection) {
    if (!frame) {
      return;
    }

    if (frame.command === 'CONNECTED') {
      // STOMP 연결이 열리면 먼저 에러·입장 확인 큐를 구독하고 방 입장을 요청한다.
      // 입장 성공 응답을 받은 뒤 subscribeRoomTopics가 나머지 방 토픽을 등록한다.
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
          if (joinedRoom) {
            gameActionSubmitted = false;
            roleConfirmationPending = false;
            updateGameActions();
            updateRoleConfirmation();
          }
          if (!joinedRoom) {
            rejectRoomEntry(errorMessage);
          }
          return;
        }
        const isJoinedMessage = frame.headers.destination === joinedDestination
          || frame.headers.subscription === 'room-joined';
        if (isJoinedMessage) {
          // 서버가 참가자 목록을 반환한 시점부터만 채팅·게임 화면을 활성화한다.
          renderParticipants(message.participants, message.status);
          if (joinedRoom) {
            subscribeRoomTopics(connection);
          } else {
            rejectRoomEntry('게임방 입장 정보를 확인하지 못했습니다.');
          }
          return;
        }
        if (frame.headers.destination === presenceSyncDestination) {
          renderParticipants(message.participants, message.status);
          return;
        }
        if (frame.headers.destination === gameDestination) {
          renderGameState(message);
          return;
        }
        if (frame.headers.destination === gameRoleDestination
            || frame.headers.subscription === 'game-role') {
          renderGameRole(message);
          return;
        }
        if (frame.headers.destination === gameResultDestination
            || frame.headers.subscription === 'game-result') {
          renderGameResultDetails(message);
          return;
        }
        if (frame.headers.destination === nightResultDestination
            || frame.headers.subscription === 'night-result') {
          renderNightResult(message);
          return;
        }
        if (frame.headers.destination === presenceDestination || Array.isArray(message.participants)) {
          renderParticipants(message.participants, message.status);
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
    item.dataset.channel = message.channel || 'PUBLIC';

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
      readyButton.disabled = !isOnline || !presenceReady || gameStarted;
    }
  }

  function updateStartGameAvailability(isOnline = connected) {
    if (!startButton) {
      return;
    }

    const isHost = currentParticipant?.host === true;
    const hasMinimumPlayers = currentParticipants.length >= MIN_GAME_PLAYERS;
    const allPlayersReady = currentParticipants.length > 0
      && currentParticipants.every(participant => participant.ready === true);
    const canStart = isOnline
      && joinedRoom
      && presenceReady
      && isHost
      && !gameStarted
      && hasMinimumPlayers
      && allPlayersReady;

    startButton.hidden = !isHost || gameStarted;
    startButton.disabled = !canStart;

    if (!startGameNotice) {
      return;
    }
    startGameNotice.hidden = !isHost || gameStarted;
    if (!isHost || gameStarted) {
      return;
    }
    if (!hasMinimumPlayers) {
      startGameNotice.textContent = `게임 시작에는 최소 ${MIN_GAME_PLAYERS}명이 필요합니다.`;
    } else if (!allPlayersReady) {
      startGameNotice.textContent = '모든 참가자가 준비해야 합니다.';
    } else if (!isOnline || !joinedRoom || !presenceReady) {
      startGameNotice.textContent = '게임방 연결을 확인하고 있습니다.';
    } else {
      startGameNotice.textContent = '모든 참가자가 준비되었습니다. 게임을 시작할 수 있습니다.';
    }
  }

  function updateChatAvailability(isOnline = connected) {
    const currentGamePlayer = Array.isArray(gameState?.players)
      ? gameState.players.find(player => Number(player.userId) === userId)
      : null;
    const isNewWaitingParticipant = gameState?.phase === 'FINISHED' && !currentGamePlayer;
    const alive = !gameState || currentGamePlayer?.alive === true || isNewWaitingParticipant;
    const isNight = gameState?.phase === 'NIGHT';
    const isRoleAssignment = gameState?.phase === 'ROLE_ASSIGNMENT';
    const isFinalDefense = gameState?.phase === 'FINAL_DEFENSE';
    const isDefendant = Number(gameState?.nominatedUserId) === userId;
    const canUseDeadChat = Boolean(gameState) && !alive;
    const canUsePublic = canUseDeadChat || (!isNight && !isRoleAssignment
      && (!isFinalDefense || isDefendant));
    const canUseMafia = currentRole === 'MAFIA' && alive && !isRoleAssignment;
    const canChat = isOnline
      && joinedRoom
      && presenceReady
      && (canUsePublic || canUseMafia);

    const publicOption = chatChannel?.querySelector('option[value="PUBLIC"]');
    const mafiaOption = chatChannel?.querySelector('option[value="MAFIA"]');
    if (publicOption) {
      publicOption.disabled = !canUsePublic;
      publicOption.textContent = canUseDeadChat ? '사망자 채널' : '전체 채널';
    }
    if (mafiaOption) {
      mafiaOption.hidden = !canUseMafia;
      mafiaOption.disabled = !canUseMafia;
    }
    if (chatChannel) {
      if (!canUsePublic && canUseMafia) {
        chatChannel.value = 'MAFIA';
      } else if (chatChannel.value === 'MAFIA' && !canUseMafia) {
        chatChannel.value = 'PUBLIC';
      }
      chatChannel.disabled = !isOnline
        || !joinedRoom
        || !presenceReady
        || (!canUsePublic && !canUseMafia);
    }
    if (submitButton) {
      submitButton.disabled = !canChat;
    }
    if (input) {
      input.disabled = !canChat;
    }
  }

  function stopGameTimer() {
    if (gameTimerId !== null) {
      window.clearInterval(gameTimerId);
      gameTimerId = null;
    }
  }

  function updateGameTimer() {
    if (!gameState || !gameTimerElement) {
      return;
    }

    const phaseEndsAt = Number(gameState.phaseEndsAt);
    const remainingSeconds = Number.isFinite(phaseEndsAt)
      ? Math.max(0, Math.ceil((phaseEndsAt - Date.now()) / 1000))
      : Math.max(0, Number(gameState.remainingSeconds) || 0);
    gameTimerElement.textContent = `${remainingSeconds}초`;
    if (remainingSeconds === 0) {
      stopGameTimer();
    }
  }

  function startGameTimer() {
    stopGameTimer();
    updateGameTimer();
    gameTimerId = window.setInterval(updateGameTimer, 1000);
  }

  function renderGameState(state) {
    if (!gamePanel || !state || typeof state.phase !== 'string') {
      return;
    }

    if (state.phase !== lastGamePhase) {
      gameActionSubmitted = false;
      if (state.phase === 'ROLE_ASSIGNMENT') {
        roleConfirmed = false;
        roleConfirmationPending = false;
      }
      lastGamePhase = state.phase;
      clearNightResult();
    }
    // 역할 정보는 개인 큐로, 페이즈·타이머·생존자 목록은 공개 토픽으로 받는다.
    // 공개 상태가 갱신될 때마다 행동 버튼과 타이머도 함께 다시 계산한다.
    gameState = state;
    gamePanel.hidden = false;
    const currentGamePlayer = Array.isArray(state.players)
      ? state.players.find(player => Number(player.userId) === userId)
      : null;
    if (currentGamePlayer && !currentGamePlayer.alive) {
      // Do not keep a private investigation result visible after the investigator dies.
      clearNightResult();
    }
    if (gamePhaseTitle) {
      gamePhaseTitle.textContent = GAME_PHASE_LABELS[state.phase] || state.phase;
    }
    if (gameMessage) {
      gameMessage.textContent = state.message || '';
    }
    if (finalDefenseNotice) {
      const isDefense = state.phase === 'FINAL_DEFENSE';
      finalDefenseNotice.hidden = !isDefense;
      if (isDefense) {
        finalDefenseNotice.textContent = Number(state.nominatedUserId) === userId
          ? '최종 변론 시간입니다. 전체 채널에서 발언할 수 있습니다.'
          : '지목된 참가자의 최종 변론을 듣고 처형 여부를 결정해 주세요.';
      }
    }
    renderGameResult(state);
    updateChatAvailability();
    updateGameActions();
    updateRoleConfirmation();
    startGameTimer();
  }

  function clearGameRole() {
    currentRole = null;
    roleConfirmed = false;
    roleConfirmationPending = false;
    if (gameRolePanel) {
      gameRolePanel.hidden = true;
    }
    if (gameRoleLabel) {
      gameRoleLabel.textContent = '';
    }
    updateChatAvailability();
    updateRoleConfirmation();
  }

  function renderGameRole(roleAssignment) {
    if (!gameRolePanel || !gameRoleLabel || !roleAssignment
        || Number(roleAssignment.roomId) !== Number(roomId)
        || typeof roleAssignment.roleLabel !== 'string') {
      return;
    }

    gameRoleLabel.textContent = roleAssignment.roleLabel;
    currentRole = roleAssignment.role;
    roleConfirmed = roleAssignment.confirmed === true;
    roleConfirmationPending = false;
    gameRolePanel.hidden = false;
    updateChatAvailability();
    updateGameActions();
    updateRoleConfirmation();
  }

  function updateRoleConfirmation() {
    if (!confirmGameRole) {
      return;
    }
    confirmGameRole.hidden = gameState?.phase !== 'ROLE_ASSIGNMENT';
    confirmGameRole.disabled = !connected || !joinedRoom || !presenceReady
      || !currentRole || roleConfirmed || roleConfirmationPending;
    confirmGameRole.textContent = roleConfirmed ? '확인 완료' : '역할 확인 완료';
  }

  function clearGameResult() {
    if (gameResultPanel) {
      gameResultPanel.hidden = true;
    }
    if (gameWinnerLabel) {
      gameWinnerLabel.textContent = '';
    }
    if (gameResultRoleLabel) {
      gameResultRoleLabel.textContent = '-';
    }
    if (gameResultAliveLabel) {
      gameResultAliveLabel.textContent = '-';
    }
    if (gameResultNotice) {
      gameResultNotice.textContent = '같은 게임방에서 다시 준비할 수 있습니다.';
    }
    if (gameRoleRevealPanel) {
      gameRoleRevealPanel.hidden = true;
    }
    if (gameRoleRevealList) {
      gameRoleRevealList.replaceChildren();
    }
  }

  function renderGameResult(state) {
    if (!gameResultPanel || !gameWinnerLabel) {
      return;
    }

    const winnerLabel = GAME_WINNER_LABELS[state.winningFaction];
    if (!state.gameOver || !winnerLabel) {
      clearGameResult();
      return;
    }

    gameWinnerLabel.textContent = winnerLabel;
    gameResultPanel.hidden = false;
    renderGameRoleReveal(state);
    clearGameRole();
  }

  function renderGameRoleReveal(state) {
    if (!gameRoleRevealPanel || !gameRoleRevealList || state.phase !== 'FINISHED') {
      return;
    }

    const players = Array.isArray(state.players) ? state.players : [];
    const revealedPlayers = players.filter(player => typeof player.role === 'string');
    if (revealedPlayers.length === 0) {
      gameRoleRevealPanel.hidden = true;
      return;
    }

    const fragment = document.createDocumentFragment();
    revealedPlayers.forEach(player => {
      const item = document.createElement('li');
      const roleLabel = GAME_ROLE_LABELS[player.role] || player.role;
      item.textContent = `${player.nickname || '알 수 없음'} · ${roleLabel} · ${player.alive ? '생존' : '탈락'}`;
      fragment.append(item);
    });
    gameRoleRevealList.replaceChildren(fragment);
    gameRoleRevealPanel.hidden = false;
  }

  function renderGameResultDetails(result) {
    if (!result || Number(result.roomId) !== Number(roomId)) {
      return;
    }

    // The public FINISHED state is the authoritative boundary for a result.
    // Ignore delayed private results from the previous game after replay starts.
    if (!gameState || gameState.phase !== 'FINISHED') {
      return;
    }

    const winnerLabel = result.winningFactionLabel
      || GAME_WINNER_LABELS[result.winningFaction];
    if (gameWinnerLabel && winnerLabel) {
      gameWinnerLabel.textContent = winnerLabel;
    }
    if (gameResultRoleLabel && typeof result.roleLabel === 'string') {
      gameResultRoleLabel.textContent = result.roleLabel;
    }
    if (gameResultAliveLabel && typeof result.alive === 'boolean') {
      gameResultAliveLabel.textContent = result.alive ? '생존' : '탈락';
    }
    if (gameResultNotice) {
      gameResultNotice.textContent = '같은 게임방에서 다시 준비할 수 있습니다.';
    }
    if (gameResultPanel) {
      gameResultPanel.hidden = false;
    }
  }

  function clearNightResult() {
    if (nightResultPanel) {
      nightResultPanel.hidden = true;
    }
    if (nightResultLabel) {
      nightResultLabel.textContent = '';
    }
  }

  function renderNightResult(result) {
    if (!result || Number(result.roomId) !== Number(roomId)
        || !nightResultPanel || !nightResultLabel) {
      return;
    }

    const factionLabel = INVESTIGATION_FACTION_LABELS[result.faction]
      || result.factionLabel
      || result.faction;
    nightResultLabel.textContent = ` ${result.targetNickname || '대상'}님은 ${factionLabel}입니다.`;
    nightResultPanel.hidden = false;
  }

  function renderNominationTargets(players) {
    if (!nominationTarget) {
      return;
    }

    const selectedValue = nominationTarget.value;
    nominationTarget.replaceChildren();
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = '참가자를 선택하세요';
    nominationTarget.append(placeholder);

    players
      .filter(player => player.alive && Number(player.userId) !== userId)
      .forEach(player => {
        const option = document.createElement('option');
        option.value = String(player.userId);
        option.textContent = player.nickname || '알 수 없음';
        nominationTarget.append(option);
      });

    if ([...nominationTarget.options].some(option => option.value === selectedValue)) {
      nominationTarget.value = selectedValue;
    }
  }

  function renderNightTargets(players, actionConfig) {
    if (!nightTarget || !actionConfig) {
      return;
    }

    const selectedValue = nightTarget.value;
    nightTarget.replaceChildren();
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = '참가자를 선택하세요';
    nightTarget.append(placeholder);

    players
      .filter(player => player.alive)
      .forEach(player => {
        const option = document.createElement('option');
        option.value = String(player.userId);
        option.textContent = player.nickname || '알 수 없음';
        nightTarget.append(option);
      });

    if ([...nightTarget.options].some(option => option.value === selectedValue)) {
      nightTarget.value = selectedValue;
    }
    if (nightActionTitle) {
      nightActionTitle.textContent = actionConfig.title;
    }
  }

  function updateGameActions(isOnline = connected) {
    if (!gameActions || !gameState) {
      return;
    }

    const players = Array.isArray(gameState.players) ? gameState.players : [];
    const currentGamePlayer = players.find(player => Number(player.userId) === userId);
    const canAct = isOnline
      && joinedRoom
      && presenceReady
      && currentGamePlayer?.alive === true
      && !gameActionSubmitted;
    const isNominationPhase = gameState.phase === 'NOMINATION_VOTE';
    const isExecutionPhase = gameState.phase === 'EXECUTION_VOTE';
    const isNightPhase = gameState.phase === 'NIGHT';
    const nightActionConfig = NIGHT_ACTIONS[currentRole];
    const canUseNightAction = isNightPhase && nightActionConfig !== undefined;
    const isExecutionVoter = !isExecutionPhase
      || Number(gameState.nominatedUserId) !== userId;

    gameActions.hidden = !isNominationPhase && !isExecutionPhase && !canUseNightAction;
    if (nominationAction) {
      nominationAction.hidden = !isNominationPhase;
    }
    if (executionAction) {
      executionAction.hidden = !isExecutionPhase;
    }
    if (nightAction) {
      nightAction.hidden = !canUseNightAction;
    }
    if (isNominationPhase) {
      renderNominationTargets(players);
      if (submitNomination) {
        submitNomination.disabled = !canAct || !nominationTarget?.value;
      }
    }
    if (isExecutionPhase) {
      if (executePlayer) {
        executePlayer.disabled = !canAct || !isExecutionVoter;
      }
      if (sparePlayer) {
        sparePlayer.disabled = !canAct || !isExecutionVoter;
      }
    }
    if (canUseNightAction) {
      renderNightTargets(players, nightActionConfig);
      if (submitNightAction) {
        submitNightAction.disabled = !canAct || !nightTarget?.value;
      }
    }

    if (!gameActionStatus) {
      return;
    }
    if (currentGamePlayer && !currentGamePlayer.alive) {
      gameActionStatus.textContent = '탈락한 참가자는 투표할 수 없습니다.';
    } else if (gameState.phase === 'ROLE_ASSIGNMENT') {
      gameActionStatus.textContent = `역할 확인 ${Number(gameState.submittedVotes) || 0}/${Number(gameState.eligibleVoters) || 0}`;
    } else if (gameState.phase === 'FINAL_DEFENSE') {
      gameActionStatus.textContent = '변론이 끝나면 처형 찬반 투표가 시작됩니다.';
    } else if (isExecutionPhase && !isExecutionVoter) {
      gameActionStatus.textContent = '지목된 참가자는 처형 투표에 참여할 수 없습니다.';
    } else if (gameActionSubmitted) {
      gameActionStatus.textContent = '투표가 제출되었습니다.';
    } else if (isNominationPhase || isExecutionPhase) {
      const submittedVotes = Number(gameState.submittedVotes) || 0;
      const eligibleVoters = Number(gameState.eligibleVoters) || 0;
      gameActionStatus.textContent = `제출된 투표 ${submittedVotes}/${eligibleVoters}`;
    } else if (isNightPhase && !nightActionConfig) {
      gameActionStatus.textContent = '시민은 밤 행동을 할 수 없습니다.';
    } else if (isNightPhase) {
      gameActionStatus.textContent = '밤 행동 대상을 선택해 주세요.';
    } else {
      gameActionStatus.textContent = '';
    }
  }

  function renderParticipants(participants, status) {
    if (forcedLeave || !memberGrid || !Array.isArray(participants)) {
      return;
    }

    // 서버가 보낸 참가자 목록을 기준으로 화면과 현재 사용자 상태를 함께 갱신한다.
    // 현재 사용자가 목록에서 사라지면 다른 방으로 이동한 것으로 보고 방을 나간다.
    currentParticipants = participants;
    if (typeof status === 'string') {
      gameStarted = status === 'PLAYING';
      if (roomStatus) {
        roomStatus.textContent = gameStarted ? '게임 중' : '대기 중';
        roomStatus.classList.toggle('bg-success-subtle', !gameStarted);
        roomStatus.classList.toggle('text-success-emphasis', !gameStarted);
        roomStatus.classList.toggle('bg-secondary-subtle', gameStarted);
        roomStatus.classList.toggle('text-secondary-emphasis', gameStarted);
      }
    }

    const fragment = document.createDocumentFragment();
    const wasJoined = joinedRoom;
    currentParticipant = null;

    participants.forEach(participant => {
      const article = document.createElement('article');
      article.className = [
        'col member',
        participant.host ? 'host' : '',
        participant.ready ? 'participant-ready' : ''
      ].filter(Boolean).join(' ');

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
    updateStartGameAvailability();
    updateChatAvailability();

    if (wasJoined && currentParticipant === null) {
      forceLeaveRoom();
    }
  }

  function connect() {
    if (!shouldReconnect || (socket && socket.readyState <= WebSocket.OPEN)) {
      return;
    }

    // 재접속 시 이전 연결의 구독·게임 상태를 초기화한 뒤 새 STOMP 세션을 만든다.
    // 서버가 입장 확인과 상태 동기화를 다시 보내므로 클라이언트 상태를 직접 추정하지 않는다.
    joinedRoom = false;
    presenceReady = false;
    currentReady = false;
    gameStarted = false;
    currentParticipants = [];
    currentParticipant = null;
    gameState = null;
    clearGameRole();
    clearGameResult();
    clearNightResult();
    lastGamePhase = null;
    gameActionSubmitted = false;
    stopGameTimer();
    renderReadyButton(false);
    updateChatAvailability(false);
    updateStartGameAvailability(false);
    updateGameActions(false);
    updateRoleConfirmation();
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
      updateReadyAvailability(false);
      updateStartGameAvailability(false);
      updateGameActions(false);
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

    const channel = chatChannel?.value === 'MAFIA' ? 'mafia-chat' : 'chat';
    socket.send(createFrame('SEND', {
      destination: `/app/rooms/${roomId}/${channel}`,
      'content-type': 'application/json'
    }, JSON.stringify({ content })));
    input.value = '';
    input.focus();
  });

  chatChannel?.addEventListener('change', () => updateChatAvailability());

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

  startButton?.addEventListener('click', () => {
    if (!connected || !joinedRoom || !presenceReady || !currentParticipant?.host) {
      showToast(startGameNotice?.textContent || '게임방 연결 중입니다.');
      return;
    }
    if (startButton.disabled || socket.readyState !== WebSocket.OPEN) {
      showToast(startGameNotice?.textContent || '모든 참가자가 준비해야 합니다.');
      return;
    }

    socket.send(createFrame('SEND', {
      destination: `/app/rooms/${roomId}/start`,
      'content-type': 'application/json'
    }, '{}'));
  });

  confirmGameRole?.addEventListener('click', () => {
    if (confirmGameRole.disabled || gameState?.phase !== 'ROLE_ASSIGNMENT') {
      return;
    }
    roleConfirmationPending = true;
    updateRoleConfirmation();
    sendGameAction({ action: 'ROLE_CONFIRM' });
  });

  nominationTarget?.addEventListener('change', () => updateGameActions());
  nightTarget?.addEventListener('change', () => updateGameActions());

  submitNomination?.addEventListener('click', () => {
    const targetUserId = Number(nominationTarget?.value);
    if (!Number.isInteger(targetUserId) || targetUserId <= 0) {
      showToast('지목할 참가자를 선택해 주세요.');
      return;
    }
    sendGameAction({ targetUserId });
  });

  executePlayer?.addEventListener('click', () => sendGameAction({ execute: true }));
  sparePlayer?.addEventListener('click', () => sendGameAction({ execute: false }));

  submitNightAction?.addEventListener('click', () => {
    const actionConfig = NIGHT_ACTIONS[currentRole];
    const targetUserId = Number(nightTarget?.value);
    if (!actionConfig) {
      showToast('현재 역할은 밤 행동을 할 수 없습니다.');
      return;
    }
    if (!Number.isInteger(targetUserId) || targetUserId <= 0) {
      showToast('밤 행동 대상을 선택해 주세요.');
      return;
    }
    sendGameAction({ targetUserId, action: actionConfig.action });
  });

  function sendGameAction(payload) {
    if (!connected || !joinedRoom || !presenceReady || socket.readyState !== WebSocket.OPEN) {
      showToast('게임방 연결 중입니다.');
      return;
    }

    // 모든 투표와 밤 행동은 하나의 게임 엔드포인트로 보내며, 제출 직후 버튼을 잠근다.
    // 서버가 오류를 반환하면 handleFrame에서 다시 행동할 수 있도록 상태를 되돌린다.
    socket.send(createFrame('SEND', {
      destination: `/app/rooms/${roomId}/game`,
      'content-type': 'application/json'
    }, JSON.stringify(payload)));
    gameActionSubmitted = true;
    updateGameActions();
  }

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
