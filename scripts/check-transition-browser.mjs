import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { format } from 'prettier';
import { browserSession } from './browser-session.mjs';
import { installWorldProbe } from './world-probe.mjs';
import { ENTITY } from '../src/world/entity/config.ts';
import { TRANSITION } from '../src/world/entity/transition.ts';

const origin = process.argv[2] ?? 'http://127.0.0.1:5173';
const evidence = new URL('../docs/implementation/evidence/phase-4.6/', import.meta.url);
const { send, evaluate, messages, close } = await browserSession();
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function waitFor(expression) {
  for (let i = 0; i < 120; i++) {
    if (await evaluate(expression)) return;
    await delay(100);
  }
  assert.fail('Timed out: ' + expression);
}
const click = (label) =>
  evaluate(
    `Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim()===${JSON.stringify(label)}).click()`,
  );
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
  await delay(120);
}
async function scrub(p) {
  await evaluate(
    `(() => { const input=document.querySelector('input[type=range]'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,${p}); input.dispatchEvent(new Event('input',{bubbles:true})); })()`,
  );
  await waitFor(`entityProbe.controller.getProgress()===${p}`);
  await delay(100);
}
async function attach() {
  await waitFor('Boolean(document.querySelector("canvas"))');
  await delay(300);
  await evaluate(`(${installWorldProbe.toString()})('entity-particles')`);
  await click('Three-quarter');
  await waitFor('worldProbe.scene !== null');
  await click('Front');
  await evaluate(`(async()=>{
    let fiber=document.querySelector('canvas')[Object.keys(document.querySelector('canvas')).find(k=>k.startsWith('__reactFiber$'))];
    let controller;
    while(fiber && !controller) {
      for(let hook=fiber.memoizedState;hook;hook=hook.next) if(hook.memoizedState?.getProgress) controller=hook.memoizedState;
      fiber=fiber.return;
    }
    if(!controller) throw new Error('Installed preview controller not found');
    const {sampleEntity}=await import('/src/world/entity/sampleEntity.ts');
    const {dispersedPositions,evaluatePositions}=await import('/src/world/entity/transition.ts');
    const source=sampleEntity(), dispersed=dispersedPositions(source.ids.length), expected=source.positions.slice();
    const points=worldProbe.scene.getObjectByName('entity-particles');
    window.entityProbe={controller,source,dispersed,expected,position:points.geometry.attributes.position,color:points.geometry.attributes.color,index:points.geometry.index,maxProgressStep:0,lastProgress:controller.getProgress(),watch:false};
    const original=worldProbe.renderer.render.bind(worldProbe.renderer);
    worldProbe.renderer.render=(scene,camera)=>{
      if(entityProbe.watch) entityProbe.maxProgressStep=Math.max(entityProbe.maxProgressStep,Math.abs(controller.getProgress()-entityProbe.lastProgress));
      entityProbe.lastProgress=controller.getProgress();
      original(scene,camera);
    };
    entityProbe.read=()=>{
      const p=controller.getProgress(), actual=points.geometry.attributes.position.array;
      evaluatePositions(source.positions,dispersed,p,expected);
      let error=0;
      const bounds={minX:1,minY:1,maxX:-1,maxY:-1};
      const v=points.position.clone(); points.updateMatrixWorld();
      for(let i=0;i<actual.length;i++) error=Math.max(error,Math.abs(actual[i]-expected[i]));
      for(let i=0;i<actual.length/3;i++) {
        v.fromBufferAttribute(points.geometry.attributes.position,i).applyMatrix4(points.matrixWorld).project(worldProbe.camera);
        bounds.minX=Math.min(bounds.minX,v.x);bounds.maxX=Math.max(bounds.maxX,v.x);
        bounds.minY=Math.min(bounds.minY,v.y);bounds.maxY=Math.max(bounds.maxY,v.y);
      }
      return {...worldProbe.read(),progress:p,snapshot:controller.getSnapshot(),error,bounds,scale:points.scale.toArray(),cameraAspect:worldProbe.camera.aspect,
        stableAttributes:entityProbe.position===points.geometry.attributes.position && entityProbe.color===points.geometry.attributes.color && entityProbe.index===points.geometry.index,
        sourceColorsMatch:source.colors.every((value,i)=>value===points.geometry.attributes.color.array[i])};
    };
  })()`);
}
async function settled() {
  await delay(300);
  const frames = await evaluate('worldProbe.frames');
  await delay(500);
  assert.equal(await evaluate('worldProbe.frames'), frames, 'demand rendering must settle');
}
async function capture(name) {
  const { data } = await send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: true,
  });
  await writeFile(new URL(name, evidence), Buffer.from(data, 'base64'));
}
const results = { browser: await send('Browser.getVersion'), samples: [] };
let first;
async function sample(scenario) {
  const value = await evaluate('entityProbe.read()');
  assert.equal(value.error, 0, 'rendered positions exactly match deterministic progress evaluator');
  assert.equal(value.stableAttributes, true);
  assert.equal(value.sourceColorsMatch, true);
  assert.equal(value.calls, 1);
  assert.equal(value.count, ENTITY.count);
  assert.deepEqual(value.scale, [1, 1, 1]);
  assert.ok(Math.max(...Object.values(value.bounds).map(Math.abs)) < 1 / ENTITY.framingMargin);
  if (first) {
    assert.equal(value.geometry, first.geometry);
    assert.equal(value.material, first.material);
  }
  results.samples.push({ scenario, ...value });
  return value;
}
try {
  await mkdir(evidence, { recursive: true });
  for (const domain of ['Page', 'Runtime', 'Log', 'Network']) await send(`${domain}.enable`);
  await viewport(1440, 1000);
  await preference('no-preference');
  await send('Page.navigate', { url: origin + '/dev/entity.html' });
  await send('Page.bringToFront');
  await attach();
  first = await sample('initial settled');
  assert.equal(first.progress, 1);
  assert.equal(first.snapshot.playing, false);
  await settled();
  await capture('settled.png');
  await scrub(0);
  await capture('dispersed.png');
  await sample('dispersed');
  await scrub(0.5);
  await capture('intermediate.png');
  await sample('intermediate front');
  await click('Three-quarter');
  await viewport(390, 844);
  await sample('narrow intermediate three-quarter');
  await capture('narrow-intermediate.png');
  await evaluate(
    `document.querySelector('select').value='arms';document.querySelector('select').dispatchEvent(new Event('change',{bubbles:true}))`,
  );
  await delay(100);
  assert.equal((await sample('intermediate arms')).points, 609);
  assert.equal(await evaluate('entityProbe.controller.getProgress()'), 0.5);
  await click('Reset full entity');
  await viewport(1440, 1000);
  await waitFor('worldProbe.read().points===2600');
  assert.equal(await evaluate(`document.querySelector('select').value`), 'all');
  assert.equal(
    await evaluate(`worldProbe.scene.getObjectByName('entity-particles').rotation.y`),
    0,
  );

  // Inspect actual controls and renderer; no production debug interface is added.
  await scrub(0.2);
  await evaluate(`entityProbe.watch=true; entityProbe.maxProgressStep=0; entityProbe.lastProgress=.2; worldProbe.times=[];
    window.transitionNotices=0; window.stopNotices=entityProbe.controller.subscribe(()=>transitionNotices++);`);
  await click('Form');
  await waitFor('entityProbe.controller.getProgress()>.3');
  await evaluate('window.activeSnapshot=entityProbe.controller.getSnapshot()');
  await click('Form');
  assert.equal(await evaluate('activeSnapshot===entityProbe.controller.getSnapshot()'), true);
  await delay(800);
  assert.equal(
    await evaluate('transitionNotices'),
    1,
    'React is notified only at meaningful changes',
  );
  const beforeReverse = await evaluate('entityProbe.controller.getProgress()');
  await click('Dissolve');
  const afterReverse = await evaluate('entityProbe.controller.getProgress()');
  assert.ok(Math.abs(afterReverse - beforeReverse) <= 0.011);
  await delay(400);
  await click('Pause');
  const paused = await sample('paused after reversal');
  results.reversalMaxProgressStep = await evaluate('entityProbe.maxProgressStep');
  assert.ok(results.reversalMaxProgressStep <= TRANSITION.maxDelta / TRANSITION.duration + 1e-8);
  assert.ok(paused.progress < beforeReverse);
  await settled();
  assert.equal(await evaluate('entityProbe.controller.getProgress()'), paused.progress);
  await click('Three-quarter');
  await viewport(390, 844);
  assert.equal((await sample('paused resize and view')).progress, paused.progress);
  await viewport(1440, 1000);
  await preference('reduce');
  assert.equal(await evaluate('entityProbe.controller.getProgress()'), paused.progress);
  assert.equal(
    await evaluate(
      `Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Resume').disabled`,
    ),
    true,
  );
  await preference('no-preference');
  assert.equal(await evaluate('entityProbe.controller.getSnapshot().playing'), false);
  await click('Resume');
  await waitFor(`entityProbe.controller.getProgress()<${paused.progress - 0.02}`);
  await preference('reduce');
  await waitFor('entityProbe.controller.getProgress()===0');
  await settled();
  await click('Form');
  await waitFor('entityProbe.controller.getProgress()===1');
  await click('Dissolve');
  await waitFor('entityProbe.controller.getProgress()===0');
  await scrub(0.42);
  await preference('no-preference');
  await settled();
  assert.equal(await evaluate('entityProbe.controller.getProgress()'), 0.42);
  await evaluate('entityProbe.watch=false;stopNotices()');

  await click('Form');
  await delay(250);
  const other = await send('Target.createTarget', { url: 'about:blank' });
  await send('Target.activateTarget', { targetId: other.targetId });
  await delay(200);
  results.nativeTabVisibility = await evaluate('document.hidden');
  if (!results.nativeTabVisibility)
    await evaluate(
      `Object.defineProperty(document,'visibilityState',{configurable:true,value:'hidden'});document.dispatchEvent(new Event('visibilitychange'))`,
    );
  const hidden = await evaluate('entityProbe.controller.getProgress()');
  await delay(1000);
  assert.equal(await evaluate('entityProbe.controller.getProgress()'), hidden);
  await evaluate(
    'entityProbe.watch=true;entityProbe.maxProgressStep=0;entityProbe.lastProgress=entityProbe.controller.getProgress()',
  );
  await send('Target.closeTarget', { targetId: other.targetId });
  await send('Page.bringToFront');
  if (!results.nativeTabVisibility)
    await evaluate(
      `delete document.visibilityState;document.dispatchEvent(new Event('visibilitychange'))`,
    );
  await waitFor(`entityProbe.controller.getProgress()>${hidden + 0.02}`);
  assert.ok(
    await evaluate(
      `entityProbe.maxProgressStep<=${TRANSITION.maxDelta / TRANSITION.duration + 1e-8}`,
    ),
  );
  results.resumeMaxProgressStep = await evaluate('entityProbe.maxProgressStep');
  await click('Pause');
  await settled();
  await evaluate('entityProbe.watch=false');
  await sample('after hidden-tab resume');

  // Playback view/region/resize changes retain time and attributes, including at an exact endpoint.
  await scrub(0.45);
  await click('Form');
  await click('Front');
  await evaluate(
    `document.querySelector('select').value='head';document.querySelector('select').dispatchEvent(new Event('change',{bubbles:true}))`,
  );
  await viewport(800, 900);
  const changed = await sample('playing resize and head isolation');
  assert.ok(changed.progress > 0.45 && changed.progress < 0.8);
  assert.equal(changed.points, 284);
  await waitFor('entityProbe.controller.getProgress()===1');
  await settled();
  await sample('completed formation');
  await click('Dissolve');
  await waitFor('entityProbe.controller.getProgress()===0');
  await settled();
  await sample('completed dissolution');
  await click('Reset full entity');
  await viewport(1440, 1000);

  // Native keyboard activation and range input preserve focus while playback starts/ends.
  await evaluate(
    `Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='Dissolve').focus()`,
  );
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
  await key('Enter', 'Enter', 13, '\r');
  await waitFor('entityProbe.controller.getProgress()<.99');
  assert.equal(await evaluate('document.activeElement.textContent'), 'Dissolve');
  await key('Tab', 'Tab', 9);
  assert.equal(await evaluate('document.activeElement.textContent'), 'Pause');
  await key('Enter', 'Enter', 13, '\r');
  await settled();
  assert.equal(await evaluate('document.activeElement.textContent'), 'Resume');
  await key('Tab', 'Tab', 9);
  assert.equal(await evaluate('document.activeElement.type'), 'range');
  await key('ArrowLeft', 'ArrowLeft', 37);
  assert.equal(await evaluate('entityProbe.controller.getSnapshot().playing'), false);
  assert.equal(await evaluate('document.activeElement.type'), 'range');
  assert.equal(await evaluate('getComputedStyle(document.activeElement).outlineStyle'), 'solid');

  const normalErrors = messages.filter(
    (m) =>
      m.method === 'Runtime.exceptionThrown' ||
      m.method === 'Network.loadingFailed' ||
      (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error'),
  );
  assert.deepEqual(normalErrors, []);

  // Short real-time capture; timer commands are test input, never a rendering loop.
  await click('Reset full entity');
  await scrub(0);
  const recording = await evaluate(`new Promise(resolve=>{
    const canvas=document.querySelector('canvas'),stream=canvas.captureStream(20);
    const recorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp9',videoBitsPerSecond:700000});
    const chunks=[],timeline=[],started=performance.now();
    const act=label=>{Array.from(document.querySelectorAll('button')).find(b=>b.textContent===label).click();timeline.push({action:label,ms:performance.now()-started,progress:entityProbe.controller.getProgress()});};
    recorder.ondataavailable=e=>chunks.push(e.data);
    recorder.onstop=()=>{stream.getTracks().forEach(t=>t.stop());const reader=new FileReader();reader.onload=()=>resolve({data:reader.result.split(',')[1],timeline});reader.readAsDataURL(new Blob(chunks,{type:'video/webm'}));};
    recorder.start();act('Form');
    setTimeout(()=>act('Dissolve'),1800);
    setTimeout(()=>act('Pause'),2500);
    setTimeout(()=>act('Resume'),3200);
    setTimeout(()=>act('Form'),4600);
    setTimeout(()=>act('Dissolve'),10000);
    setTimeout(()=>recorder.stop(),15400);
  })`);
  await writeFile(new URL('motion.webm', evidence), Buffer.from(recording.data, 'base64'));
  results.recording = recording.timeline;
  const strip = await evaluate(`new Promise(resolve=>{
    const video=document.createElement('video');video.src=URL.createObjectURL(new Blob([Uint8Array.from(atob('${recording.data}'),c=>c.charCodeAt(0))],{type:'video/webm'}));video.muted=true;
    const times=[.1,1.6,2.35,2.9,3.8,4.5,6,8,9.9,11,13,15.2];
    const sheet=document.createElement('canvas');sheet.width=1440;const ctx=sheet.getContext('2d');let i=0,height;
    video.onloadeddata=()=>{height=Math.ceil(720*video.videoHeight/video.videoWidth)+32;sheet.height=height*6;video.currentTime=times[0];};
    video.onseeked=()=>{const x=(i%2)*720,y=Math.floor(i/2)*height;ctx.fillStyle='#05060a';ctx.fillRect(x,y,720,height);ctx.drawImage(video,x,y+32,720,720*video.videoHeight/video.videoWidth);ctx.fillStyle='white';ctx.font='18px sans-serif';ctx.fillText(times[i]+' s',x+12,y+24);
      if(++i<times.length)video.currentTime=times[i];else{URL.revokeObjectURL(video.src);resolve(sheet.toDataURL('image/jpeg',.9).split(',')[1]);}};
  })`);
  await writeFile(new URL('motion-strip.jpg', evidence), Buffer.from(strip, 'base64'));

  // Existing suite tests both fallback modes; additionally exercise new controls without WebGL.
  const injection = await send('Page.addScriptToEvaluateOnNewDocument', {
    source: `const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type.includes('webgl')?null:get.call(this,type,...args)};`,
  });
  await send('Page.navigate', { url: origin + '/dev/entity.html' });
  await waitFor(
    `document.querySelector('.world-fallback')?.textContent.includes('entity preview is unavailable')`,
  );
  await click('Dissolve');
  await click('Pause');
  await preference('reduce');
  await click('Form');
  assert.ok(
    await evaluate(`document.querySelector('[role=status]').textContent.includes('Settled')`),
  );
  await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: injection.identifier });
  await preference('no-preference');

  await send('Page.navigate', { url: origin + '/scripts/entity-fixture.html' });
  await attach();
  for (let cycle = 0; cycle < 2; cycle++) {
    assert.deepEqual(await evaluate('entityFixture.read()'), { visibility: 1, preferences: 1 });
    await click('Dissolve');
    await waitFor('entityProbe.controller.getProgress()<.98');
    await evaluate('entityFixture.unmount()');
    await waitFor(
      'worldProbe.disposed.geometry===1 && worldProbe.disposed.material===1 && worldProbe.read().contextLost',
    );
    assert.deepEqual(await evaluate('entityFixture.read()'), { visibility: 0, preferences: 0 });
    const stopped = await evaluate('entityProbe.controller.getProgress()');
    await delay(300);
    assert.equal(
      await evaluate('entityProbe.controller.getProgress()'),
      stopped,
      'frame subscription stops on unmount',
    );
    const cleanup = await evaluate('worldProbe.read()');
    assert.equal(cleanup.memory.geometries, 0);
    assert.equal(cleanup.programs, 0);
    results.samples.push({ scenario: 'active teardown ' + cycle, ...cleanup });
    if (cycle === 0) {
      await evaluate('entityFixture.mount()');
      await attach();
    }
  }
  await writeFile(
    new URL('metrics.json', evidence),
    await format(JSON.stringify(results), { parser: 'json', printWidth: 100 }),
  );
  console.log(
    'PASS transition renderer endpoints/paths, reversal, controls, policy/visibility, stable resources, static settling, keyboard, fallback and active teardown; evidence captured',
  );
} finally {
  await close();
}
