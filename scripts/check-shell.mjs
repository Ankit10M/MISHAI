// Run against Vite with a disposable Chrome profile listening on localhost:9222.
import assert from 'node:assert/strict';
import { browserSession } from './browser-session.mjs';
import { sections } from '../src/app/sections.ts';

const origin = process.argv[2] ?? 'http://127.0.0.1:5173';
const fixtureOrigin = process.argv[3] ?? origin;
const { send, evaluate, messages, close } = await browserSession();

async function waitFor(expression) {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (await evaluate(expression)) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert.fail(
    `Timed out: ${expression}\n${JSON.stringify(await evaluate(`({hash:location.hash,scrollY,height:innerHeight,current:document.querySelector('nav a[aria-current]')?.hash,bounds:[...document.querySelectorAll('main section')].map(el=>({id:el.id,top:el.getBoundingClientRect().top,bottom:el.getBoundingClientRect().bottom})),fixture:window.experienceTest?.read()})`))}`,
  );
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

async function navigate(hash = '') {
  await send('Page.navigate', { url: origin + hash });
  await waitFor('Boolean(document.querySelector("#contact"))');
}

const ids = sections.map(({ id }) => id);
const activeLinks = 'document.querySelectorAll("nav a[aria-current]")';
async function active(id) {
  await waitFor(
    id === null
      ? `${activeLinks}.length === 0`
      : `${activeLinks}.length === 1 && ${activeLinks}[0].getAttribute('href') === '#${id}' && ${activeLinks}[0].getAttribute('aria-current') === 'location'`,
  );
}

async function scrollToSection(id) {
  await evaluate(
    `window.scrollTo({top: document.getElementById('${id}').getBoundingClientRect().top + scrollY - innerHeight * 0.28 + 30, behavior: 'instant'})`,
  );
  await active(id);
}

async function checkObservedLocation() {
  await evaluate('window.scrollTo({top:0,behavior:"instant"})');
  await active(null);
  const before = await evaluate(
    `({hash:location.hash, focus:document.activeElement.id, history:history.length})`,
  );
  for (const id of ids.slice(0, -1)) await scrollToSection(id);
  await evaluate('window.scrollTo({top:document.documentElement.scrollHeight,behavior:"instant"})');
  await active('contact');
  assert.deepEqual(
    await evaluate(
      `({hash:location.hash, focus:document.activeElement.id, history:history.length})`,
    ),
    before,
    'observation must not change hash, focus or history',
  );
}
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
    await waitFor(`${activeLinks}.length === 1`);
    await checkObservedLocation();
    console.log(
      `PASS ${width}x${height}: anchors, native wheel scrolling, no overflow, one canvas, all five observed sections, top clears current, no focus/hash/history writes`,
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
  await active('contact');
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

  await send('Page.navigate', { url: 'about:blank' });
  await waitFor('location.href === "about:blank"');
  await navigate('#projects');
  await active('projects');
  await send('Page.reload');
  await waitFor('Boolean(document.querySelector("#projects"))');
  await active('projects');
  await evaluate(`document.querySelector('nav a[href="#contact"]').click()`);
  await active('contact');
  await evaluate('history.back()');
  await waitFor('location.hash === "#projects"');
  await active('projects');
  await evaluate('history.forward()');
  await waitFor('location.hash === "#contact"');
  await active('contact');
  await navigate('#unknown');
  await evaluate('window.scrollTo({top:0,behavior:"instant"})');
  await active(null);
  await scrollToSection('projects');
  assert.equal(await evaluate('location.hash'), '#unknown');
  const restoredY = await evaluate('scrollY');
  await send('Page.reload');
  await waitFor(
    `Boolean(document.querySelector('#projects')) && Math.abs(scrollY - ${restoredY}) < 2`,
  );
  await active('projects');
  console.log('PASS deep link, reload, unknown hash, restored position, browser back/forward');

  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await scrollToSection('projects');
  await evaluate(
    `window.scrollTo({top: document.getElementById('skills').getBoundingClientRect().top + scrollY - innerHeight * .28 - 40, behavior:'instant'})`,
  );
  await active('projects');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 1200,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await active('skills');
  await evaluate(
    `document.documentElement.style.overflowAnchor = 'none'; const intro = document.querySelector('.introduction'); intro.style.paddingBottom = (parseFloat(getComputedStyle(intro).paddingBottom) + 120) + 'px'`,
  );
  await active('projects');
  await evaluate(`document.querySelector('.introduction').style.paddingBottom = ''`);
  await active('skills');
  await evaluate(`document.documentElement.style.overflowAnchor = ''`);
  await evaluate(
    `document.querySelector('.site-footer').style.minHeight = '1800px'; window.scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'})`,
  );
  await active(null);
  await evaluate(`document.querySelector('.site-footer').style.minHeight = ''`);
  console.log(
    'PASS resize and layout changes recompute selection; footer-only viewport clears current',
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

  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: false,
  });
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
    await checkObservedLocation();
    console.log(`PASS WebGL ${failure}: visible status, all five sections and navigation usable`);
    assert.deepEqual(await evaluate('window.unhandledTestRejections'), []);
    await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: injection.identifier });
  }

  await send('Page.navigate', { url: `${fixtureOrigin}/scripts/experience-fixture.html` });
  await waitFor('Boolean(window.experienceTest?.read().snapshot)');
  await evaluate('window.scrollTo({top:0,behavior:"instant"})');
  await active(null);
  const lifecycle = await evaluate('experienceTest.read()');
  assert.equal(lifecycle.observers, 1);
  assert.deepEqual(lifecycle.subscriptions, { scroll: 1, resize: 1, pageshow: 1, hashchange: 1 });
  assert.equal(lifecycle.snapshot.lastNavigation, null);
  await send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }],
  });
  // Dispatch an activation before the browser's next animation frame.
  const requested = await evaluate(`(() => {
    document.querySelector('nav a[href="#contact"]').click();
    return new Promise(resolve => queueMicrotask(() => resolve(experienceTest.read().snapshot)));
  })()`);
  assert.equal(requested.activeSection, null);
  assert.deepEqual(requested.lastNavigation, { section: 'contact', sequence: 1 });
  await waitFor('scrollY > 10');
  await evaluate('window.scrollTo({top:0,behavior:"instant"})');
  await active(null);
  assert.deepEqual(
    await evaluate('experienceTest.read().snapshot'),
    requested,
    'interruption leaves a historical activation, never a pending destination',
  );
  await scrollToSection('projects');
  assert.deepEqual(
    await evaluate('experienceTest.read().snapshot.lastNavigation'),
    requested.lastNavigation,
  );
  // Modified/cancelled activations cannot issue a command to this tab.
  await evaluate(`(() => {
    const link = document.querySelector('nav a[href="#creator"]');
    document.addEventListener('click', event => event.preventDefault(), {once:true});
    link.dispatchEvent(new MouseEvent('click', {bubbles:true,cancelable:true,ctrlKey:true}));
    link.addEventListener('click', event => event.preventDefault(), {once:true});
    link.click();
  })()`);
  assert.deepEqual(
    await evaluate('experienceTest.read().snapshot.lastNavigation'),
    requested.lastNavigation,
  );
  await send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
  });
  await evaluate(`document.querySelector('nav a[href="#creator"]').focus()`);
  await active(null);
  await key('Enter', 'Enter', 13);
  await active('creator');
  assert.deepEqual(
    await evaluate(`(() => {
      const link = document.querySelector('nav a[aria-current]');
      link.focus({preventScroll:true});
      const before = link.getBoundingClientRect().toJSON();
      const style = getComputedStyle(link);
      const decoration = style.textDecorationLine;
      const thickness = style.textDecorationThickness;
      const outline = style.outlineStyle;
      link.removeAttribute('aria-current');
      const after = link.getBoundingClientRect().toJSON();
      link.setAttribute('aria-current','location');
      return {decoration,thickness,outline,sameGeometry:JSON.stringify(before)===JSON.stringify(after)};
    })()`),
    { decoration: 'underline', thickness: '3px', outline: 'solid', sameGeometry: true },
    'current underline does not move layout or replace keyboard focus',
  );
  assert.deepEqual(await evaluate('experienceTest.read().snapshot.lastNavigation'), {
    section: 'creator',
    sequence: 2,
  });
  const settledRenders = await evaluate('experienceTest.read().renders');
  await evaluate(
    `window.dispatchEvent(new Event('scroll')); window.dispatchEvent(new Event('resize'))`,
  );
  await new Promise((resolve) => setTimeout(resolve, 100));
  assert.equal(
    await evaluate('experienceTest.read().renders'),
    settledRenders,
    'unchanged measurements do not render',
  );
  await evaluate(`window.dispatchEvent(new Event('scroll')); experienceTest.unmount()`);
  const unmounted = await evaluate('experienceTest.read()');
  assert.equal(unmounted.observers, 0);
  assert.deepEqual(unmounted.subscriptions, { scroll: 0, resize: 0, pageshow: 0, hashchange: 0 });
  await evaluate(
    `window.dispatchEvent(new Event('scroll')); window.dispatchEvent(new Event('resize'))`,
  );
  await new Promise((resolve) => setTimeout(resolve, 100));
  assert.equal(await evaluate('experienceTest.read().renders'), unmounted.renders);
  await evaluate('experienceTest.mount()');
  await waitFor('Boolean(document.querySelector("#contact"))');
  assert.equal(await evaluate('experienceTest.read().observers'), 1);
  assert.deepEqual(await evaluate('experienceTest.read().subscriptions'), {
    scroll: 1,
    resize: 1,
    pageshow: 1,
    hashchange: 1,
  });
  await checkObservedLocation();
  console.log(
    'PASS StrictMode subscriptions, cleanup, queued-frame cancellation, remount, unchanged-selection render bailout, native keyboard intent, interrupted smooth navigation and modified/cancelled intent filtering',
  );
  console.log(
    'All Phase 4.2 and 4.3 browser assertions passed. Failure injection intentionally produces renderer/React error diagnostics.',
  );
} finally {
  await close();
}
