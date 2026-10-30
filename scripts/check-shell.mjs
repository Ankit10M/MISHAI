// Run against Vite with a disposable Chrome profile listening on localhost:9222.
import assert from 'node:assert/strict';

const origin = process.argv[2] ?? 'http://127.0.0.1:5173';
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
  } else if (
    [
      'Runtime.exceptionThrown',
      'Runtime.consoleAPICalled',
      'Network.loadingFailed',
      'Log.entryAdded',
    ].includes(message.method)
  ) {
    messages.push(message);
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

async function waitFor(expression) {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (await evaluate(expression)) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert.fail(`Timed out: ${expression}`);
}

async function key(key, code, windowsVirtualKeyCode) {
  for (const type of ['keyDown', 'keyUp']) {
    await send('Input.dispatchKeyEvent', { type, key, code, windowsVirtualKeyCode });
  }
}

async function click(selector) {
  const point = await evaluate(`(() => {
    const link = document.querySelector(${JSON.stringify(selector)});
    link.scrollIntoView({behavior:'instant',block:'center'});
    const rect = link.getBoundingClientRect();
    return {x:rect.x+rect.width/2,y:rect.y+rect.height/2};
  })()`);
  for (const type of ['mousePressed', 'mouseReleased']) {
    await send('Input.dispatchMouseEvent', { type, ...point, button: 'left', clickCount: 1 });
  }
}

async function navigate() {
  await send('Page.navigate', { url: origin });
  await waitFor('Boolean(document.querySelector("#contact"))');
}

const ids = ['creator', 'projects', 'skills', 'experience', 'contact'];
try {
  for (const domain of ['Page', 'Runtime', 'Network', 'Log']) await send(`${domain}.enable`);
  await send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
  });
  for (const [width, height] of [
    [1440, 900],
    [390, 844],
    [320, 740],
  ]) {
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: false,
    });
    if (width === 1440) await navigate();
    await waitFor(
      'document.querySelector("canvas")?.width === document.documentElement.clientWidth && document.querySelector("canvas")?.height === innerHeight',
    );
    await new Promise((resolve) => setTimeout(resolve, 800));
    assert.equal(await evaluate('Boolean(document.querySelector(".world-fallback"))'), false);
    assert.equal(await evaluate('document.querySelectorAll("canvas").length'), 1);
    assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true);
    assert.equal(await evaluate('document.documentElement.scrollHeight > innerHeight'), true);
    for (const id of ids) {
      await click(`nav a[href="#${id}"]`);
      await waitFor(
        `location.hash === '#${id}' && document.querySelector('#${id}').getBoundingClientRect().top < innerHeight`,
      );
      assert.equal(
        await evaluate(`document.querySelector('#${id}').getBoundingClientRect().bottom > 0`),
        true,
      );
    }
    await click('.site-footer a');
    await waitFor('scrollY === 0');
    await send('Input.dispatchMouseEvent', {
      type: 'mouseWheel',
      x: width / 2,
      y: height / 2,
      deltaX: 0,
      deltaY: 500,
    });
    await waitFor('scrollY > 0');
    console.log(
      `PASS ${width}x${height}: anchors, native wheel scrolling, no overflow, one canvas`,
    );
  }

  await navigate();
  await key('Tab', 'Tab', 9);
  assert.equal(await evaluate('document.activeElement.className'), 'skip-link');
  assert.equal(
    await evaluate(
      'document.activeElement.getBoundingClientRect().top >= 0 && getComputedStyle(document.activeElement).outlineStyle === "solid"',
    ),
    true,
  );
  await key('Enter', 'Enter', 13);
  await waitFor('document.activeElement.id === "content"');
  await navigate();
  await key('Tab', 'Tab', 9);
  await key('Tab', 'Tab', 9);
  for (const id of ids) {
    await key('Tab', 'Tab', 9);
    assert.equal(await evaluate('document.activeElement.getAttribute("href")'), `#${id}`);
    assert.equal(await evaluate('getComputedStyle(document.activeElement).outlineStyle'), 'solid');
  }
  await key('Enter', 'Enter', 13);
  await waitFor('location.hash === "#contact" && document.activeElement.id === "contact"');
  console.log(
    'PASS keyboard: skip link transfers focus, all navigation links tab in order, Enter reaches Contact',
  );

  for (const value of ['no-preference', 'reduce', 'no-preference']) {
    await send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-motion', value }],
    });
    assert.equal(
      await evaluate('getComputedStyle(document.documentElement).scrollBehavior'),
      value === 'reduce' ? 'auto' : 'smooth',
    );
  }
  await send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
  });
  assert.equal(
    await evaluate(
      'document.querySelector(".world-layer").inert && getComputedStyle(document.querySelector("canvas")).pointerEvents === "none"',
    ),
    true,
  );
  assert.equal(
    await evaluate('Boolean(document.querySelector("#contact a, #contact button, form"))'),
    false,
  );
  console.log(
    'PASS live reduced-motion changes; inert, noninteractive canvas; unavailable email has no fake action',
  );

  const normalErrors = messages.filter(
    (message) =>
      message.method === 'Runtime.exceptionThrown' ||
      message.method === 'Network.loadingFailed' ||
      (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') ||
      (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error'),
  );
  assert.deepEqual(normalErrors, [], JSON.stringify(normalErrors));
  console.log(
    'Normal browser warnings:',
    JSON.stringify(
      messages
        .filter((m) => m.params.type === 'warning')
        .map((m) => m.params.args.map((a) => a.value)),
    ),
  );

  for (const failure of ['unavailable', 'initialization throws']) {
    const injection = await send('Page.addScriptToEvaluateOnNewDocument', {
      source: `
      window.unhandledTestRejections = [];
      window.addEventListener('unhandledrejection', event => window.unhandledTestRejections.push(String(event.reason)));
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function(type, ...args) {
        if (type === 'webgl2' || type === 'webgl' || type === 'experimental-webgl') {
          ${failure === 'unavailable' ? 'return null;' : 'throw new Error("Simulated WebGL initialization failure");'}
        }
        return original.call(this, type, ...args);
      };
    `,
    });
    await navigate();
    await waitFor('Boolean(document.querySelector(".world-fallback"))');
    assert.equal(await evaluate('document.querySelectorAll("main section").length'), 5);
    assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true);
    for (const id of ids) {
      await click(`nav a[href="#${id}"]`);
      await waitFor(
        `location.hash === '#${id}' && document.querySelector('#${id}').getBoundingClientRect().top < innerHeight`,
      );
    }
    console.log(`PASS WebGL ${failure}: visible status, all five sections and navigation usable`);
    assert.deepEqual(await evaluate('window.unhandledTestRejections'), []);
    await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: injection.identifier });
  }
  console.log(
    'All Phase 4.2 browser assertions passed. Failure injection intentionally produces renderer/React error diagnostics.',
  );
} finally {
  await send('Page.close');
  socket.close();
}
