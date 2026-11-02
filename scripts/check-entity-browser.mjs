import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { format } from 'prettier';
import { browserSession } from './browser-session.mjs';
import { installWorldProbe } from './world-probe.mjs';
import { ENTITY, ENTITY_REGIONS } from '../src/world/entity/config.ts';

const origin = process.argv[2] ?? 'http://127.0.0.1:5173';
const evidence = new URL(
  process.env.MISHAI_ENTITY_EVIDENCE_DIR ?? '../docs/implementation/evidence/phase-4.5/',
  import.meta.url,
);
const { send, evaluate, messages, close } = await browserSession();
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function waitFor(expression) {
  for (let i = 0; i < 100; i++) {
    if (await evaluate(expression)) return;
    await delay(100);
  }
  assert.fail(`Timed out: ${expression}`);
}
async function viewport(width, height) {
  await send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: false,
  });
}
async function select(region) {
  await evaluate(
    `(() => {const select=document.querySelector('select'); select.value='${region}'; select.dispatchEvent(new Event('change',{bubbles:true}));})()`,
  );
  await delay(150);
}
async function view(index) {
  await evaluate(`document.querySelectorAll('[aria-pressed]')[${index}].click()`);
  await delay(150);
}
async function attach() {
  await waitFor('Boolean(document.querySelector("canvas"))');
  await delay(300);
  await evaluate(`(${installWorldProbe.toString()})('entity-particles')`);
  await view(1);
  await waitFor('worldProbe.scene !== null');
  await view(0);
}
async function capture(name) {
  const image = await send('Page.captureScreenshot', { format: 'png' });
  await writeFile(new URL(name, evidence), Buffer.from(image.data, 'base64'));
}
async function inspect() {
  return evaluate(`(() => {
    const points=worldProbe.scene.getObjectByName('entity-particles');
    const camera=worldProbe.camera;
    points.updateMatrixWorld(); camera.updateMatrixWorld();
    const vector=points.position.clone();
    const bounds={minX:1,minY:1,maxX:-1,maxY:-1};
    for(let i=0;i<points.geometry.attributes.position.count;i++) {
      vector.fromBufferAttribute(points.geometry.attributes.position,i).applyMatrix4(points.matrixWorld).project(camera);
      bounds.minX=Math.min(bounds.minX,vector.x); bounds.maxX=Math.max(bounds.maxX,vector.x);
      bounds.minY=Math.min(bounds.minY,vector.y); bounds.maxY=Math.max(bounds.maxY,vector.y);
    }
    return {...worldProbe.read(),scale:points.scale.toArray(),rotation:points.rotation.y,drawCount:points.geometry.drawRange.count,bounds,canvasRect:document.querySelector('canvas').getBoundingClientRect().toJSON()};
  })()`);
}
const results = { browser: await send('Browser.getVersion'), samples: [] };
try {
  await mkdir(evidence, { recursive: true });
  for (const domain of ['Page', 'Runtime', 'Network', 'Log']) await send(`${domain}.enable`);
  await viewport(1440, 1000);
  await send('Page.navigate', { url: origin + '/dev/entity.html' });
  await send('Page.bringToFront');
  await attach();
  const first = await inspect();
  assert.equal(await evaluate('document.querySelectorAll("canvas").length'), 1);
  assert.equal(first.count, ENTITY.count);
  assert.equal(first.points, ENTITY.count);
  assert.equal(first.calls, 1);
  assert.deepEqual(first.memory, { geometries: 1, textures: 0 });
  assert.equal(await evaluate('worldProbe.scene.children.length'), 1);
  results.samples.push({ scenario: 'wide front', ...first });
  await capture('wide-front.png');
  await view(1);
  results.samples.push({ scenario: 'wide three-quarter', ...(await inspect()) });
  await capture('wide-three-quarter.png');
  await viewport(390, 844);
  await delay(500);
  results.samples.push({ scenario: 'narrow three-quarter', ...(await inspect()) });
  await capture('narrow-full.png');
  assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true);
  await viewport(1440, 1000);
  await delay(300);
  await view(0);
  for (const region of ENTITY_REGIONS) {
    await select(region.id);
    const sample = await inspect();
    assert.ok(sample.points > 20 && sample.points < ENTITY.count);
    assert.equal(sample.geometry, first.geometry);
    assert.equal(sample.material, first.material);
    results.samples.push({ scenario: region.id + ' isolation', ...sample });
    if (region.id === 'arms') await capture('arms-isolation.png');
  }
  for (const sample of results.samples) {
    assert.equal(sample.geometry, first.geometry);
    assert.equal(sample.material, first.material);
    assert.deepEqual(sample.scale, [1, 1, 1]);
    assert.ok(Math.max(...Object.values(sample.bounds).map(Math.abs)) < 1 / ENTITY.framingMargin);
    assert.equal(sample.calls, 1);
  }
  await evaluate(`document.querySelectorAll('button')[2].click()`);
  await waitFor('worldProbe.read().points === ' + ENTITY.count);
  assert.equal(await evaluate(`document.querySelector('select').value`), 'all');
  assert.equal((await inspect()).rotation, 0);
  const staticFrames = await evaluate('worldProbe.frames');
  await delay(600);
  assert.equal(await evaluate('worldProbe.frames'), staticFrames);

  // Real keyboard events: focus first button, Tab to the next view, Enter, then select/reset.
  await evaluate(`document.querySelector('button').focus()`);
  async function key(key, code, keyCode, text) {
    for (const type of ['keyDown', 'keyUp'])
      await send('Input.dispatchKeyEvent', {
        type,
        key,
        code,
        windowsVirtualKeyCode: keyCode,
        ...(type === 'keyDown' && text ? { text } : {}),
      });
  }
  await key('Tab', 'Tab', 9);
  assert.equal(await evaluate('document.activeElement.textContent'), 'Three-quarter');
  assert.equal(await evaluate('getComputedStyle(document.activeElement).outlineStyle'), 'solid');
  await key('Enter', 'Enter', 13, '\r');
  await waitFor(
    `document.querySelectorAll('[aria-pressed]')[1].getAttribute('aria-pressed') === 'true'`,
  );
  await key('Tab', 'Tab', 9);
  assert.equal(await evaluate('document.activeElement.tagName'), 'SELECT');
  await key('ArrowDown', 'ArrowDown', 40);
  await waitFor(`document.querySelector('select').value === 'head'`);
  await key('Tab', 'Tab', 9);
  assert.equal(await evaluate('document.activeElement.textContent'), 'Reset full entity');
  await key('Enter', 'Enter', 13, '\r');
  await waitFor('worldProbe.read().points === ' + ENTITY.count);

  const normalErrors = messages.filter(
    (m) =>
      m.method === 'Runtime.exceptionThrown' ||
      m.method === 'Network.loadingFailed' ||
      (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error'),
  );
  assert.deepEqual(normalErrors, []);
  for (const failure of ['null', 'throw']) {
    const injection = await send('Page.addScriptToEvaluateOnNewDocument', {
      source: `
      const original=HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext=function(type,...args) {
        if(type.includes('webgl')) {${failure === 'null' ? 'return null;' : 'throw new Error("Injected entity WebGL failure");'}}
        return original.call(this,type,...args);
      };
    `,
    });
    await send('Page.navigate', { url: origin + '/dev/entity.html' });
    await waitFor(
      `document.querySelector('.world-fallback')?.textContent.includes('entity preview is unavailable')`,
    );
    await view(1);
    await select('head');
    assert.equal(await evaluate(`document.querySelector('select').value`), 'head');
    await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: injection.identifier });
  }
  await send('Page.navigate', { url: origin + '/scripts/entity-fixture.html' });
  await attach();
  for (let cycle = 0; cycle < 2; cycle++) {
    assert.deepEqual(await evaluate('worldProbe.read().memory'), { geometries: 1, textures: 0 });
    await evaluate('entityFixture.unmount()');
    await waitFor('worldProbe.disposed.geometry===1 && worldProbe.disposed.material===1');
    await waitFor('worldProbe.read().contextLost');
    assert.equal(await evaluate('worldProbe.read().memory.geometries'), 0);
    results.samples.push({
      scenario: 'teardown ' + cycle,
      ...(await evaluate('worldProbe.read()')),
    });
    if (cycle === 0) {
      await evaluate('entityFixture.mount()');
      await attach();
    }
  }
  messages.length = 0;
  await send('Page.navigate', { url: origin });
  await waitFor('Boolean(document.querySelector("#projects"))');
  await delay(300);
  assert.ok(
    !messages.some(
      (m) =>
        m.method === 'Network.requestWillBeSent' &&
        /\/src\/dev\/|\/scripts\/|\/world\/entity\/EntityPoints\./.test(m.params.request.url),
    ),
    'normal app never requests preview or fixture modules',
  );
  await writeFile(
    new URL('metrics.json', evidence),
    await format(JSON.stringify(results), { parser: 'json', printWidth: 100 }),
  );
  console.log(
    'PASS entity view/region identity, bounds/proportions, one draw, static settling, keyboard, fallback, two resource cleanup cycles and normal-app isolation',
  );
} finally {
  await close();
}
