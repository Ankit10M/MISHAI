import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { format } from 'prettier';
import { browserSession } from './browser-session.mjs';
import { installWorldProbe } from './world-probe.mjs';
import { sampleHead } from '../src/world/entity/head.ts';

const origin = process.argv[2] ?? 'http://127.0.0.1:5173';
const production = process.argv.includes('--production');
const evidence = new URL('../docs/implementation/evidence/phase-4.8/', import.meta.url);
const { send, evaluate, messages, close } = await browserSession();
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const data = sampleHead();
const results = { origin, production, browser: await send('Browser.getVersion'), samples: [] };
async function waitFor(expression) {
  for (let i = 0; i < 120; i++) {
    if (await evaluate(expression)) return;
    await delay(100);
  }
  assert.fail('Timed out: ' + expression);
}
async function viewport(width, height) {
  await send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await delay(250);
}
async function preference(value) {
  await send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value }],
  });
  await delay(150);
}
async function attach() {
  await waitFor('Boolean(document.querySelector("canvas"))');
  await delay(250);
  await evaluate(`(${installWorldProbe.toString()})('creator-head')`);
  await evaluate('window.dispatchEvent(new Event("resize"))');
  await waitFor('Boolean(worldProbe.scene)');
  await evaluate(`(()=>{
    let fiber=document.querySelector('canvas')[Object.keys(document.querySelector('canvas')).find(k=>k.startsWith('__reactFiber$'))],controller;
    while(fiber&&!controller){for(let hook=fiber.memoizedState;hook;hook=hook.next)if(hook.memoizedState?.getProgress)controller=hook.memoizedState;fiber=fiber.return;}
    if(!controller)throw new Error('Head controller not found');
    const points=worldProbe.scene.getObjectByName('creator-head'),ambient=worldProbe.scene.getObjectByName('ambient-particles');
    const settled=${JSON.stringify(Array.from(data.positions))},dispersed=${JSON.stringify(Array.from(data.dispersed))},colors=${JSON.stringify(Array.from(data.colors))};
    window.headProbe={controller,points,ambient,position:points.geometry.attributes.position,color:points.geometry.attributes.color,last:controller.getProgress('head'),maxStep:0,notices:0,dispose:{geometry:0,material:0}};
    headProbe.unsubscribe=controller.subscribe(()=>headProbe.notices++);
    points.geometry.addEventListener('dispose',()=>headProbe.dispose.geometry++);
    points.material.addEventListener('dispose',()=>headProbe.dispose.material++);
    const render=worldProbe.renderer.render.bind(worldProbe.renderer);
    worldProbe.renderer.render=(scene,camera)=>{const p=controller.getProgress('head');headProbe.maxStep=Math.max(headProbe.maxStep,Math.abs(p-headProbe.last));headProbe.last=p;render(scene,camera);};
    const scissor=worldProbe.renderer.setScissor.bind(worldProbe.renderer);
    worldProbe.renderer.setScissor=(...args)=>{if(args.length===1)headProbe.scissor=args[0].toArray();return scissor(...args);};
    headProbe.read=()=>{
      const p=controller.getProgress('head'),e=p*p*(3-2*p),actual=points.geometry.attributes.position.array;
      let error=0;for(let i=0;i<actual.length;i++){const expected=p===0?dispersed[i]:p===1?settled[i]:Math.fround(dispersed[i]+(settled[i]-dispersed[i])*e);error=Math.max(error,Math.abs(actual[i]-expected));}
      const rect=document.querySelector('.creator-visual').getBoundingClientRect(),canvas=document.querySelector('canvas').getBoundingClientRect(),bounds={left:Infinity,right:-Infinity,top:Infinity,bottom:-Infinity};
      const v=points.position.clone();points.updateMatrixWorld(true);
      for(let i=0;i<actual.length/3;i++){v.fromBufferAttribute(points.geometry.attributes.position,i).applyMatrix4(points.matrixWorld).project(worldProbe.camera);const x=(v.x+1)*canvas.width/2,y=(1-v.y)*canvas.height/2;bounds.left=Math.min(bounds.left,x);bounds.right=Math.max(bounds.right,x);bounds.top=Math.min(bounds.top,y);bounds.bottom=Math.max(bounds.bottom,y);}
      return {...worldProbe.read(),progress:p,snapshot:controller.getSnapshot(),area:rect.toJSON(),bounds,visible:points.parent.visible,scale:points.parent.scale.toArray(),error,
        stable:headProbe.position===points.geometry.attributes.position&&headProbe.color===points.geometry.attributes.color,
        colorsMatch:colors.every((c,i)=>c===points.geometry.attributes.color.array[i]),ambient:{geometry:ambient.geometry.uuid,material:ambient.material.uuid,count:ambient.geometry.attributes.position.count,scale:ambient.scale.toArray()},
        scissor:headProbe.scissor,scissorEnabled:worldProbe.renderer.getScissorTest(),active:document.querySelector('nav [aria-current]')?.hash??null};
    };
  })()`);
}
async function navigate(hash = '') {
  await send('Page.navigate', { url: origin + '/' + hash });
  await send('Page.bringToFront');
  await attach();
}
async function scroll(section) {
  await evaluate(
    `document.querySelector(${JSON.stringify('#' + section)}).scrollIntoView({behavior:'instant',block:'start'})`,
  );
  await waitFor(
    section === 'top'
      ? '!document.querySelector("nav [aria-current]")'
      : `document.querySelector('nav [aria-current]')?.hash==='#${section}'`,
  );
  await delay(120);
}
const toggle = () =>
  evaluate(`document.querySelector('.background-motion-control button').click()`);
const progress = () => evaluate('headProbe.controller.getProgress("head")');
async function idle() {
  await delay(350);
  const frames = await evaluate('worldProbe.frames');
  await delay(450);
  assert.equal(await evaluate('worldProbe.frames'), frames, 'idle canvas settles');
}
async function capture(name) {
  if (production) return;
  assert.equal(await evaluate('visualViewport.scale'), 1);
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  await writeFile(new URL(name, evidence), Buffer.from(shot.data, 'base64'));
}
let first;
async function sample(scenario) {
  const s = await evaluate('headProbe.read()');
  assert.equal(s.error, 0);
  assert.equal(s.stable, true);
  assert.equal(s.colorsMatch, true);
  assert.equal(s.count, 284);
  assert.equal(s.ambient.count, 280);
  assert.deepEqual(s.camera, [0, 0, 6]);
  assert.ok(s.calls <= 2);
  assert.ok(s.points <= 564);
  assert.equal(s.scale[0], s.scale[1]);
  assert.equal(s.scale[1], s.scale[2]);
  assert.equal(s.scissorEnabled, false, 'head clipping never leaks into ambient render');
  assert.equal(await evaluate('document.querySelectorAll("canvas").length'), 1);
  assert.equal(
    await evaluate('Boolean(worldProbe.scene.getObjectByName("entity-particles"))'),
    false,
  );
  if (first)
    for (const key of ['geometry', 'material']) {
      assert.equal(s[key], first[key]);
      assert.equal(s.ambient[key], first.ambient[key]);
    }
  if (s.visible && s.area.top >= 0 && s.area.bottom <= s.viewport[1]) {
    assert.ok(s.bounds.left >= s.area.left && s.bounds.right <= s.area.right);
    assert.ok(s.bounds.top >= s.area.top && s.bounds.bottom <= s.area.bottom);
  }
  if (s.visible && s.scissor) {
    const width = s.buffer[0] / s.dpr,
      height = s.buffer[1] / s.dpr;
    const expected = [
      Math.max(0, s.area.left),
      height - Math.min(height, s.area.bottom),
      Math.min(width, s.area.right) - Math.max(0, s.area.left),
      Math.min(height, s.area.bottom) - Math.max(0, s.area.top),
    ];
    assert.ok(
      s.scissor.every((value, i) => Math.abs(value - expected[i]) < 1),
      'scissor follows the reserved DOM rectangle',
    );
  }
  results.samples.push({ scenario, ...s });
  return s;
}
try {
  await mkdir(evidence, { recursive: true });
  for (const domain of ['Page', 'Runtime', 'Network', 'Log']) await send(domain + '.enable');
  await viewport(1440, 1000);
  await preference('no-preference');
  await navigate();
  first = await sample('initial introduction, dispersed');
  assert.equal(first.progress, 0);
  await capture('introduction.png');
  const history = await evaluate(
    '({length:history.length,hash:location.hash,focus:document.activeElement.tagName})',
  );
  await scroll('creator');
  await waitFor('headProbe.controller.getProgress("head")>.15');
  await evaluate('headProbe.notices=0;headProbe.maxStep=0');
  await evaluate(
    'window.dispatchEvent(new Event("scroll"));window.dispatchEvent(new Event("resize"))',
  );
  await delay(350);
  assert.equal(
    await evaluate('headProbe.notices'),
    0,
    'repeated observations do not restart or notify',
  );
  await toggle();
  const held = await progress();
  await idle();
  await capture('creator-intermediate.png');
  await sample('paused intermediate');
  await scroll('projects');
  assert.equal(await progress(), held);
  await idle();
  assert.equal(await evaluate('headProbe.controller.getRegions()[0].target'), 0);
  assert.equal((await sample('projects while user-paused')).visible, false);
  await capture('projects.png');
  assert.deepEqual(
    await evaluate(
      '({length:history.length,hash:location.hash,focus:document.activeElement.tagName})',
    ),
    history,
  );
  await preference('reduce');
  assert.equal(await progress(), held);
  assert.equal(
    await evaluate('document.querySelector(".background-motion-control button").disabled'),
    false,
  );
  await scroll('creator');
  assert.equal(await progress(), held);
  await scroll('projects');
  await toggle();
  assert.equal(await progress(), 0);
  await idle();
  await scroll('creator');
  assert.equal(await progress(), 1);
  await idle();
  await sample('reduced motion uses observed target');
  await preference('no-preference');
  await evaluate('headProbe.maxStep=0;headProbe.last=headProbe.controller.getProgress("head")');
  await scroll('projects');
  await delay(300);
  const leaving = await progress();
  assert.ok(leaving < 1 && leaving > 0);
  await scroll('creator');
  assert.ok((await progress()) > leaving - 0.05);
  await scroll('projects');
  await scroll('creator');
  await delay(100);
  assert.ok(await evaluate('headProbe.maxStep<=.01000001'));
  await preference('reduce');
  assert.equal(await progress(), 1);
  await toggle();
  await scroll('projects');
  assert.equal(await progress(), 1);
  await preference('no-preference');
  await toggle();
  await waitFor('headProbe.controller.getProgress("head")<.95');

  const other = await send('Target.createTarget', { url: 'about:blank' });
  await send('Target.activateTarget', { targetId: other.targetId });
  await delay(200);
  results.nativeTabVisibility = await evaluate('document.hidden');
  if (!results.nativeTabVisibility)
    await evaluate(
      `Object.defineProperty(document,'visibilityState',{configurable:true,value:'hidden'});document.dispatchEvent(new Event('visibilitychange'))`,
    );
  const hidden = await progress();
  await delay(800);
  assert.equal(await progress(), hidden);
  await evaluate('headProbe.maxStep=0;headProbe.last=headProbe.controller.getProgress("head")');
  await send('Target.closeTarget', { targetId: other.targetId });
  await send('Page.bringToFront');
  if (!results.nativeTabVisibility)
    await evaluate(
      'delete document.visibilityState;document.dispatchEvent(new Event("visibilitychange"))',
    );
  await waitFor(`headProbe.controller.getProgress('head')<${hidden - 0.02}`);
  assert.ok(await evaluate('headProbe.maxStep<=.01000001'));
  await sample('bounded tab return');
  await toggle();
  const paused = await progress();
  await evaluate(
    `Object.defineProperty(document,'visibilityState',{configurable:true,value:'hidden'});document.dispatchEvent(new Event('visibilitychange'))`,
  );
  await scroll('creator');
  await evaluate(
    'delete document.visibilityState;document.dispatchEvent(new Event("visibilitychange"))',
  );
  await delay(200);
  assert.equal(await progress(), paused);
  await idle();

  // Exact before/after anchor and viewport, with reduced motion to hold the observed endpoint.
  await preference('reduce');
  await toggle();
  await navigate('#creator');
  first = undefined;
  await waitFor('headProbe.controller.getProgress("head")===1');
  await idle();
  first = await sample('desktop direct Creator formed');
  await capture('desktop-after.png');
  await viewport(390, 844);
  await scroll('creator');
  await idle();
  await sample('narrow formed');
  await capture('narrow-after.png');
  assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'), true);
  await viewport(800, 900);
  await scroll('creator');
  await sample('medium resized');
  await evaluate('window.scrollBy({top:300,behavior:"instant"})');
  await delay(200);
  await sample('partial viewport clipping');
  await viewport(1440, 1000);
  await send('Page.reload');
  await attach();
  first = undefined;
  await delay(200);
  await sample('reload uses observed geometry');
  assert.equal(
    await progress(),
    await evaluate('document.querySelector("nav [aria-current]")?.hash==="#creator"?1:0'),
  );
  await navigate('#projects');
  await idle();
  assert.equal(await progress(), 0);
  const navHistory = await send('Page.getNavigationHistory');
  const creatorEntry = navHistory.entries
    .slice(0, navHistory.currentIndex)
    .findLast((e) => e.url.endsWith('#creator'));
  assert.ok(creatorEntry);
  await send('Page.navigateToHistoryEntry', { entryId: creatorEntry.id });
  await delay(250);
  await attach();
  assert.equal(
    await progress(),
    await evaluate('document.querySelector("nav [aria-current]")?.hash==="#creator"?1:0'),
  );
  await send('Page.navigateToHistoryEntry', {
    entryId: navHistory.entries[navHistory.currentIndex].id,
  });
  await delay(250);
  await attach();
  assert.equal(await progress(), 0);

  const errors = messages.filter(
    (m) =>
      m.method === 'Runtime.exceptionThrown' ||
      m.method === 'Network.loadingFailed' ||
      (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error'),
  );
  assert.deepEqual(errors, []);
  assert.ok(
    !messages.some(
      (m) =>
        m.method === 'Network.requestWillBeSent' &&
        /\/src\/dev\/|\/scripts\/|\/EntityPoints\./.test(m.params.request.url),
    ),
  );
  if (!production) {
    await navigate();
    const failure = await send('Page.addScriptToEvaluateOnNewDocument', {
      source: `const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type.includes('webgl')?null:original.call(this,type,...args)};`,
    });
    await send('Page.navigate', { url: origin + '/?webgl-failure#creator' });
    await waitFor('Boolean(document.querySelector(".world-fallback"))');
    assert.equal(await evaluate('document.querySelectorAll("main section").length'), 5);
    assert.ok(
      await evaluate(
        'document.querySelector("#creator").textContent.includes("Biography not yet supplied.")',
      ),
    );
    await toggle();
    assert.ok(
      await evaluate(
        'document.querySelector(".background-motion-control button").textContent.includes("Resume")',
      ),
    );
    await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: failure.identifier });

    await preference('no-preference');
    await send('Page.navigate', { url: origin + '/scripts/world-fixture.html#creator' });
    await attach();
    for (let cycle = 0; cycle < 2; cycle++) {
      await scroll('creator');
      assert.deepEqual(await evaluate('worldFixture.read()'), { visibility: 1, preferences: 1 });
      await waitFor('headProbe.controller.getProgress("head")>.02');
      await evaluate('worldFixture.unmount()');
      await waitFor(
        'headProbe.dispose.geometry===1&&headProbe.dispose.material===1&&worldProbe.read().contextLost',
      );
      assert.deepEqual(await evaluate('worldFixture.read()'), { visibility: 0, preferences: 0 });
      const stopped = await progress();
      await delay(300);
      assert.equal(await progress(), stopped);
      assert.equal(await evaluate('worldProbe.read().memory.geometries'), 0);
      const layout = await evaluate('worldFixture.readLayout()');
      assert.equal(layout.observers, 0);
      assert.ok(Object.values(layout.listeners).every((count) => count === 0));
      results.samples.push({
        scenario: 'active cleanup ' + cycle,
        ...(await evaluate('worldProbe.read()')),
      });
      if (cycle === 0) {
        await evaluate('worldFixture.mount()');
        await attach();
      }
    }
  }
  await writeFile(
    new URL(production ? 'production-head-metrics.json' : 'head-metrics.json', evidence),
    await format(JSON.stringify(results), { parser: 'json' }),
  );
  console.log(
    production
      ? 'PASS production head: observed targets, interruption, policy priority, history, clipping, stable resources and one Canvas'
      : 'PASS public head: observed targets, interruption, policy priority, history, clipping, stable resources, one Canvas, fallback and cleanup',
  );
} finally {
  await close();
}
