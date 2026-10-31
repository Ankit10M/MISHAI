import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { format } from 'prettier';
import { browserSession } from './browser-session.mjs';
import { installWorldProbe } from './world-probe.mjs';
import { PARTICLE_FIELD as field } from '../src/world/particles/config.ts';

const origin = process.argv[2] ?? 'http://127.0.0.1:5173';
const production = process.argv.includes('--production');
const evidence = new URL('../docs/implementation/evidence/phase-4.4/', import.meta.url);
const { send, evaluate, messages, close } = await browserSession();
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const results = { origin, production, browser: await send('Browser.getVersion'), samples: [] };
async function waitFor(expression) {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (await evaluate(expression)) return;
    await delay(100);
  }
  assert.fail(
    `Timed out: ${expression}\n${JSON.stringify(await evaluate(`({hidden:document.hidden,focus:document.hasFocus(),active:document.activeElement?.outerHTML,button:document.querySelector('.background-motion-control')?.outerHTML,world:window.worldProbe?.read()})`))}`,
  );
}
async function viewport(width, height, dpr = 1) {
  await send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: dpr,
    mobile: false,
  });
}
async function preference(value) {
  await send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value }],
  });
}
async function attach() {
  await waitFor('Boolean(document.querySelector("canvas"))');
  await delay(300);
  await evaluate(`(${installWorldProbe.toString()})()`);
  await evaluate(`window.dispatchEvent(new Event('resize'))`);
  await waitFor('worldProbe.scene !== null');
}
async function settled() {
  await delay(350);
  const frames = await evaluate('worldProbe.frames');
  await delay(450);
  assert.equal(await evaluate('worldProbe.frames'), frames, 'static mode must settle');
}
async function screenshot(name) {
  const capture = await send('Page.captureScreenshot', { format: 'png' });
  await writeFile(new URL(name, evidence), Buffer.from(capture.data, 'base64'));
}
try {
  await mkdir(evidence, { recursive: true });
  for (const domain of ['Page', 'Runtime', 'Log', 'Network']) await send(`${domain}.enable`);
  await viewport(1440, 900);
  await preference('no-preference');
  await send('Page.navigate', { url: origin });
  await send('Page.bringToFront');
  await attach();
  await waitFor('worldProbe.frames > 5');
  const first = await evaluate('worldProbe.read()');
  assert.equal(await evaluate('document.querySelectorAll("canvas").length'), 1);
  assert.equal(first.count, field.count);
  assert.equal(first.calls, 1);
  assert.equal(first.points, field.count);
  assert.deepEqual(first.memory, { geometries: 1, textures: 0 });
  assert.deepEqual(first.camera, [0, 0, 6]);

  await evaluate(`worldProbe.times=[]; worldProbe.maxStep=0`);
  await delay(3000);
  const times = await evaluate('worldProbe.times');
  const intervals = times
    .slice(1)
    .map((value, index) => value - times[index])
    .sort((a, b) => a - b);
  results.timing = {
    durationMs: times.at(-1) - times[0],
    frames: times.length,
    medianMs: intervals[Math.floor(intervals.length * 0.5)],
    p95Ms: intervals[Math.floor(intervals.length * 0.95)],
    maxMs: intervals.at(-1),
  };
  assert.ok(intervals.length > 10, 'modest animated timing sample');
  assert.ok(
    (await evaluate('worldProbe.read().maxStep')) <=
      Math.max(...field.drift.map((value, index) => value * field.speed[index] * field.maxDelta)) +
        1e-6,
  );
  results.samples.push({ scenario: 'wide animated', ...(await evaluate('worldProbe.read()')) });

  await evaluate(`worldProbe.maxStep=0; document.querySelector('nav a[href="#projects"]').click()`);
  await waitFor(`document.querySelector('nav a[aria-current]')?.hash === '#projects'`);
  assert.equal(await evaluate('worldProbe.read().geometry'), first.geometry);
  assert.equal(await evaluate('worldProbe.read().material'), first.material);
  assert.ok(
    (await evaluate('worldProbe.maxStep')) < 0.001,
    'section navigation must not reset motion time',
  );

  await evaluate(`document.querySelector('.background-motion-control button').focus()`);
  for (const type of ['keyDown', 'keyUp'])
    await send('Input.dispatchKeyEvent', {
      type,
      key: 'Enter',
      code: 'Enter',
      windowsVirtualKeyCode: 13,
      ...(type === 'keyDown' ? { text: '\r' } : {}),
    });
  await waitFor(
    `document.querySelector('.background-motion-control button').textContent.includes('Resume')`,
  );
  await settled();
  const paused = await evaluate('worldProbe.read()');
  await evaluate(`document.querySelector('nav a[href="#projects"]').click()`);
  await waitFor(`document.querySelector('nav a[aria-current]')?.hash === '#projects'`);
  await settled();
  assert.equal(await evaluate('worldProbe.read().geometry'), first.geometry);
  assert.equal(await evaluate('worldProbe.read().material'), first.material);
  await preference('reduce');
  await waitFor(`document.querySelector('.background-motion-control button').disabled`);
  await settled();
  await preference('no-preference');
  await waitFor(`!document.querySelector('.background-motion-control button').disabled`);
  assert.ok(
    await evaluate(
      `document.querySelector('.background-motion-control button').textContent.includes('Resume')`,
    ),
  );
  await settled();
  await viewport(390, 844);
  await waitFor('document.querySelector("canvas").height === 844');
  await settled();
  assert.ok((await evaluate('worldProbe.frames')) > paused.frames, 'static resize renders');
  assert.ok(Math.abs((await evaluate('worldProbe.read().aspect')) - 375 / 844) < 0.01);
  results.samples.push({
    scenario: 'narrow paused after resize',
    ...(await evaluate('worldProbe.read()')),
  });
  await evaluate(`document.querySelector('.background-motion-control button').click()`);
  const resumed = await evaluate('worldProbe.frames');
  await waitFor(`worldProbe.frames > ${resumed + 5}`);
  await preference('reduce');
  await settled();
  await preference('no-preference');
  const reenabled = await evaluate('worldProbe.frames');
  await waitFor(`worldProbe.frames > ${reenabled + 5}`);

  // Exercise the real visibility event path; report whether native tab hiding is available.
  const other = await send('Target.createTarget', { url: 'about:blank' });
  await send('Target.activateTarget', { targetId: other.targetId });
  await delay(250);
  const nativeHidden = await evaluate('document.hidden');
  results.nativeTabVisibility = nativeHidden;
  if (!nativeHidden) {
    await evaluate(
      `Object.defineProperty(document,'visibilityState',{configurable:true,value:'hidden'}); document.dispatchEvent(new Event('visibilitychange'))`,
    );
  }
  await settled();
  await evaluate('worldProbe.maxStep=0');
  await delay(1000);
  await send('Target.closeTarget', { targetId: other.targetId });
  await send('Page.bringToFront');
  if (!nativeHidden)
    await evaluate(
      `delete document.visibilityState; document.dispatchEvent(new Event('visibilitychange'))`,
    );
  const afterHidden = await evaluate('worldProbe.frames');
  await waitFor(`worldProbe.frames > ${afterHidden + 5}`);
  assert.ok(
    (await evaluate('worldProbe.maxStep')) < 0.001,
    'hidden duration must not jump the simulation',
  );
  await viewport(1440, 900, 2);
  await waitFor('document.querySelector("canvas").height === 1800');
  results.samples.push({
    scenario: 'wide animated resize DPR 2',
    ...(await evaluate('worldProbe.read()')),
  });
  assert.equal(results.samples.at(-1).dpr, 2);
  await viewport(1439, 900);
  await waitFor('document.querySelector("canvas").height === 900');
  await viewport(1440, 900);

  // Capture reproducible resting views on a fresh mount, plus a short real canvas recording.
  if (production) {
    await preference('reduce');
    await send('Page.navigate', { url: origin });
    await waitFor('Boolean(document.querySelector("canvas"))');
    await delay(700);
    await screenshot('wide.png');
    await viewport(390, 844);
    await delay(500);
    await evaluate(`document.querySelector('nav a[href="#projects"]').click()`);
    await delay(300);
    await screenshot('narrow-projects.png');
    await viewport(1440, 900);
    await evaluate('window.scrollTo({top:0,behavior:"instant"})');
    await preference('no-preference');
    await attach();
    const recording = await evaluate(`new Promise(resolve => {
      const stream = document.querySelector('canvas').captureStream(20);
      const recorder = new MediaRecorder(stream, {mimeType:'video/webm;codecs=vp9',videoBitsPerSecond:500000});
      const chunks=[];
      recorder.ondataavailable=event=>chunks.push(event.data);
      recorder.onstop=()=>{
        stream.getTracks().forEach(track=>track.stop());
        const reader=new FileReader(); reader.onload=()=>resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(new Blob(chunks,{type:'video/webm'}));
      };
      recorder.start(); setTimeout(()=>recorder.stop(),4000);
    })`);
    await writeFile(new URL('motion.webm', evidence), Buffer.from(recording, 'base64'));
    // A sampled contact sheet makes the recording inspectable without a video tool.
    const strip = await evaluate(`new Promise(resolve => {
      const video=document.createElement('video');
      video.src=URL.createObjectURL(new Blob([Uint8Array.from(atob('${recording}'),c=>c.charCodeAt(0))],{type:'video/webm'}));
      video.muted=true;
      const strip=document.createElement('canvas'); strip.width=1440; strip.height=900;
      const context=strip.getContext('2d'); let frame=0;
      video.onloadeddata=()=>{video.currentTime=.1;};
      video.onseeked=()=>{
        context.drawImage(video,(frame%2)*720,Math.floor(frame/2)*450,720,450);
        context.fillStyle='white'; context.font='18px sans-serif'; context.fillText((frame+.1)+' s',(frame%2)*720+16,Math.floor(frame/2)*450+28);
        if (++frame<4) video.currentTime=frame+.1;
        else {URL.revokeObjectURL(video.src); resolve(strip.toDataURL('image/jpeg',.85).split(',')[1]);}
      };
    })`);
    await writeFile(new URL('motion-strip.jpg', evidence), Buffer.from(strip, 'base64'));
  } else {
    await send('Page.navigate', { url: origin + '/scripts/world-fixture.html' });
    await attach();
    for (let cycle = 0; cycle < 2; cycle++) {
      await waitFor('worldProbe.scene !== null');
      assert.deepEqual(await evaluate('worldFixture.read()'), { visibility: 1, preferences: 1 });
      assert.deepEqual(await evaluate('worldProbe.read().memory'), { geometries: 1, textures: 0 });
      await evaluate('worldFixture.unmount()');
      await waitFor('worldProbe.disposed.geometry === 1 && worldProbe.disposed.material === 1');
      await waitFor('worldProbe.read().contextLost');
      assert.deepEqual(await evaluate('worldFixture.read()'), { visibility: 0, preferences: 0 });
      assert.equal(await evaluate('worldProbe.read().memory.geometries'), 0);
      results.samples.push({
        scenario: 'unmounted cycle ' + cycle,
        ...(await evaluate('worldProbe.read()')),
      });
      if (cycle === 0) {
        await evaluate('worldFixture.mount()');
        await attach();
      }
    }
  }
  const errors = messages.filter(
    (message) =>
      message.method === 'Runtime.exceptionThrown' ||
      message.method === 'Network.loadingFailed' ||
      (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error'),
  );
  assert.deepEqual(errors, [], JSON.stringify(errors));
  await writeFile(
    new URL(production ? 'production-metrics.json' : 'development-metrics.json', evidence),
    await format(JSON.stringify(results), { parser: 'json', printWidth: 100 }),
  );
  console.log(
    'PASS particle rendering/resources, geometry identity, pause/keyboard/preference, static settling, visibility/resume and resizing',
    JSON.stringify(results.timing),
  );
  console.log(
    production
      ? 'Captured production visual evidence'
      : 'PASS StrictMode lifecycle: two disposal cycles and no accumulated motion listeners',
  );
} finally {
  await close();
}
