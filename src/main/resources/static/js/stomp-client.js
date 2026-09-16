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

  window.MafiaStomp = Object.freeze({
    createFrame,
    createFrameParser
  });
})();
