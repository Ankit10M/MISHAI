import assert from 'node:assert/strict';

export async function browserSession(onEvent = () => {}) {
  const page = await (
    await fetch('http://127.0.0.1:9222/json/new?about:blank', { method: 'PUT' })
  ).json();
  const socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve) => socket.addEventListener('open', resolve, { once: true }));
  const pending = new Map();
  const messages = [];
  let nextId = 0;
  socket.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data);
    if (message.id) {
      const request = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) request.reject(new Error(JSON.stringify(message.error)));
      else request.resolve(message.result);
    } else {
      messages.push(message);
      onEvent(message);
    }
  });
  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++nextId;
      pending.set(id, { resolve, reject });
      socket.send(JSON.stringify({ id, method, params }));
    });
  }
  async function evaluate(expression) {
    const result = await send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    assert.equal(result.exceptionDetails, undefined, JSON.stringify(result.exceptionDetails));
    return result.result.value;
  }
  return {
    send,
    evaluate,
    messages,
    async close() {
      if (socket.readyState === WebSocket.CLOSED) return;
      const closed = new Promise((resolve) =>
        socket.addEventListener('close', resolve, { once: true }),
      );
      await Promise.race([send('Page.close'), closed]);
      socket.close();
    },
  };
}
