(() => {
  const roomId = document.body.dataset.roomId;
  const nickname = document.body.dataset.nickname || '';
  const socketUrl = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`;
  const form = document.querySelector('#chatForm');
  const input = form?.querySelector('input[name="content"]');
  const messages = document.querySelector('#messages');
  const notice = document.querySelector('#chatNotice');
  const connectionStatus = document.querySelector('#chatConnectionStatus');
  const statusDot = document.querySelector('#chatStatusDot');
  const submitButton = form?.querySelector('button[type="submit"]');
  const topicDestination = `/topic/rooms/${roomId}/chat`;
  const errorDestination = '/user/queue/errors';

  if (!roomId || !form || !input || !messages) {
    return;
  }

  let socket;
  let frameBuffer = '';
  let reconnectTimer;
  let connected = false;
  let shouldReconnect = true;

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
    connectionStatus.textContent = label;
    statusDot.classList.toggle('offline', !isOnline);
    submitButton.disabled = !isOnline;
  }

  function setNotice(message) {
    notice.textContent = message;
  }

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
      .map(([key, value]) => `${escapeHeader(key)}:${escapeHeader(value)}`)
      .join('\n');
    const headerBlock = headerLines ? `${headerLines}\n` : '';
    return `${command}\n${headerBlock}\n${body}\0`;
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

  function handleFrame(frame) {
    if (!frame) {
      return;
    }

    if (frame.command === 'CONNECTED') {
      connected = true;
      setConnectionStatus('실시간', true);
      setNotice('실시간 채팅에 연결되었습니다.');
      socket.send(createFrame('SUBSCRIBE', { id: 'room-chat', destination: topicDestination, ack: 'auto' }));
      socket.send(createFrame('SUBSCRIBE', { id: 'chat-errors', destination: errorDestination, ack: 'auto' }));
      return;
    }

    if (frame.command === 'MESSAGE') {
      try {
        const message = JSON.parse(frame.body);
        if (message.type === 'ERROR' || frame.headers.destination === errorDestination) {
          showToast(message.message || '채팅 메시지를 처리하지 못했습니다.');
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
      setNotice('채팅 연결에 문제가 있습니다.');
      showToast(frame.body || '채팅 연결에 문제가 있습니다.');
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

  function appendMessage(message) {
    const item = document.createElement('p');
    item.className = `chat-message${message.sender === nickname ? ' own' : ''}`;

    const sender = document.createElement('b');
    sender.textContent = message.sender || '알 수 없음';
    const content = document.createElement('span');
    content.textContent = message.content || '';
    const time = document.createElement('time');
    time.textContent = message.sentAt
      ? new Date(message.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '';

    item.append(sender, content, time);
    messages.append(item);
    messages.scrollTop = messages.scrollHeight;
  }

  function connect() {
    if (!shouldReconnect || (socket && socket.readyState <= WebSocket.OPEN)) {
      return;
    }

    frameBuffer = '';
    setConnectionStatus('연결 중', false);
    socket = new WebSocket(socketUrl);

    socket.addEventListener('open', () => {
      socket.send(createFrame('CONNECT', {
        'accept-version': '1.2',
        host: location.host,
        'heart-beat': '0,0'
      }));
    });

    socket.addEventListener('message', event => consumeFrames(event.data));
    socket.addEventListener('error', () => {
      setConnectionStatus('오류', false);
      setNotice('채팅 연결에 문제가 있습니다.');
    });
    socket.addEventListener('close', () => {
      connected = false;
      setConnectionStatus('재연결 중', false);
      setNotice('채팅 연결이 끊겼습니다. 다시 연결하는 중입니다.');
      if (shouldReconnect) {
        window.clearTimeout(reconnectTimer);
        reconnectTimer = window.setTimeout(connect, 3000);
      }
    });
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    const content = input.value.trim();
    if (!content) {
      return;
    }
    if (!connected || socket.readyState !== WebSocket.OPEN) {
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

  window.addEventListener('beforeunload', () => {
    shouldReconnect = false;
    window.clearTimeout(reconnectTimer);
    if (connected && socket.readyState === WebSocket.OPEN) {
      socket.send(createFrame('DISCONNECT'));
    }
  });

  connect();
})();
