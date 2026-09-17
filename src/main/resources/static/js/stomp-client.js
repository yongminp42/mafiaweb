(() => {
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

  function createFrameParser(onFrame) {
    let frameBuffer = '';

    return chunk => {
      frameBuffer += chunk;
      let endIndex = frameBuffer.indexOf('\0');
      while (endIndex >= 0) {
        const rawFrame = frameBuffer.slice(0, endIndex);
        frameBuffer = frameBuffer.slice(endIndex + 1);
        onFrame(parseFrame(rawFrame));
        endIndex = frameBuffer.indexOf('\0');
      }
    };
  }

  function getReconnectDelay(attempt) {
    const normalizedAttempt = Number.isFinite(Number(attempt))
      ? Math.max(0, Number(attempt))
      : 0;
    const exponentialDelay = Math.min(30000, 1000 * (2 ** Math.min(normalizedAttempt, 5)));
    return exponentialDelay + Math.floor(Math.random() * 250);
  }

  function startHeartbeat(connection, connectedFrame) {
    const heartbeat = String(connectedFrame.headers['heart-beat'] || '0,0')
      .split(',')
      .map(value => Number(value));
    const serverRequestedInterval = Number.isFinite(heartbeat[1]) ? heartbeat[1] : 0;
    const interval = serverRequestedInterval > 0
      ? Math.max(10000, serverRequestedInterval)
      : 0;
    if (interval <= 0) {
      return () => {};
    }

    const heartbeatTimer = window.setInterval(() => {
      if (connection.readyState === WebSocket.OPEN) {
        connection.send('\n');
      }
    }, interval);
    return () => window.clearInterval(heartbeatTimer);
  }

  function createReconnectController(connect) {
    let reconnectTimer;
    let reconnectAttempts = 0;

    return {
      schedule() {
        window.clearTimeout(reconnectTimer);
        reconnectTimer = window.setTimeout(() => {
          reconnectTimer = undefined;
          connect();
        }, getReconnectDelay(reconnectAttempts++));
      },
      reset() {
        reconnectAttempts = 0;
      },
      cancel() {
        window.clearTimeout(reconnectTimer);
        reconnectTimer = undefined;
      }
    };
  }

  window.MafiaStomp = Object.freeze({
    createFrame,
    createFrameParser,
    getReconnectDelay,
    startHeartbeat,
    createReconnectController
  });
})();
