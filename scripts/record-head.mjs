import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { browserSession } from './browser-session.mjs';

// Test input and composited browser screenshots, never an application render loop.
const origin = process.argv[2] ?? 'http://127.0.0.1:5173';
const output = resolve('docs/implementation/evidence/phase-4.8');
const framesDir = resolve('node_modules/.cache/phase-4.8-recording');
await mkdir(framesDir, { recursive: true });
const timeline = [],
  frames = [];
let epoch = 0,
  writes = Promise.resolve();
const { send, evaluate, close } = await browserSession((message) => {
  if (message.method !== 'Page.screencastFrame') return;
  const { data, metadata, sessionId } = message.params;
  const path = resolve(framesDir, String(frames.length).padStart(4, '0') + '.jpg');
  frames.push({ ms: Math.max(0, metadata.timestamp * 1000 - epoch), path });
  writes = writes.then(async () => {
    await writeFile(path, Buffer.from(data, 'base64'));
    await send('Page.screencastFrameAck', { sessionId });
  });
});
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
const actions = [
  [1000, 'Enter Creator', `document.querySelector('nav a[href="#creator"]').click()`],
  [7300, 'Leave for Projects', `document.querySelector('nav a[href="#projects"]').click()`],
  [8500, 'Reverse into Creator', `document.querySelector('nav a[href="#creator"]').click()`],
  [
    9300,
    'Pause visual motion',
    `document.querySelector('.background-motion-control button').click()`,
  ],
  [
    10800,
    'Navigate to Projects while paused',
    `document.querySelector('nav a[href="#projects"]').click()`,
  ],
  [
    12600,
    'Return to Creator while paused',
    `document.querySelector('nav a[href="#creator"]').click()`,
  ],
  [
    14500,
    'Resume visual motion',
    `document.querySelector('.background-motion-control button').click()`,
  ],
];
try {
  for (const domain of ['Page', 'Runtime']) await send(domain + '.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }],
  });
  await send('Page.navigate', { url: origin });
  await send('Page.bringToFront');
  await delay(1200);
  assert.equal(await evaluate('visualViewport.scale'), 1);
  await evaluate(
    `(()=>{let f=document.querySelector('canvas')[Object.keys(document.querySelector('canvas')).find(k=>k.startsWith('__reactFiber$'))];while(f){for(let h=f.memoizedState;h;h=h.next)if(h.memoizedState?.getProgress)window.recordHead=h.memoizedState;f=f.return;}})()`,
  );
  const start = performance.now();
  epoch = Date.now();
  await send('Page.startScreencast', {
    format: 'jpeg',
    quality: 90,
    maxWidth: 1440,
    maxHeight: 1000,
    everyNthFrame: 3,
  });
  let action = 0;
  while (performance.now() - start < 18000) {
    const now = performance.now() - start;
    if (action < actions.length && now >= actions[action][0]) {
      await evaluate(actions[action][2]);
      await delay(20);
      timeline.push({
        ms: performance.now() - start,
        action: actions[action][1],
        ...(await evaluate(
          `({progress:recordHead.getProgress('head'),snapshot:recordHead.getSnapshot(),hash:location.hash,observed:document.querySelector('nav [aria-current]')?.hash??null})`,
        )),
      });
      action++;
    }
    await delay(50);
  }
  await send('Page.stopScreencast');
  await writes;
  assert.ok(frames.length > 30, 'record actual composited frames');
  assert.equal(timeline.length, actions.length);
  const paused = timeline.find((e) => e.action === 'Pause visual motion').progress;
  for (const entry of timeline.filter((e) => e.action.includes('while paused')))
    assert.equal(entry.progress, paused);
  const list = frames
    .map(
      (frame, i) =>
        `file '${frame.path.replaceAll('\\', '/')}'\nduration ${Math.max(0.001, ((frames[i + 1]?.ms ?? 18000) - frame.ms) / 1000)}`,
    )
    .join('\n');
  const concat = resolve(framesDir, 'frames.txt');
  await writeFile(concat, list + '\n');
  const encoded = spawnSync(
    'ffmpeg',
    [
      '-hide_banner',
      '-loglevel',
      'error',
      '-y',
      '-f',
      'concat',
      '-safe',
      '0',
      '-i',
      concat,
      '-fps_mode',
      'vfr',
      '-c:v',
      'libvpx-vp9',
      '-crf',
      '28',
      '-b:v',
      '0',
      resolve(output, 'page-motion.webm'),
    ],
    { encoding: 'utf8' },
  );
  assert.equal(encoded.status, 0, encoded.stderr ?? String(encoded.error));
  const strip = spawnSync(
    'ffmpeg',
    [
      '-hide_banner',
      '-loglevel',
      'error',
      '-y',
      '-i',
      resolve(output, 'page-motion.webm'),
      '-vf',
      'fps=1/2,scale=480:-1,tile=3x3',
      '-frames:v',
      '1',
      resolve(output, 'page-motion-strip.png'),
    ],
    { encoding: 'utf8' },
  );
  assert.equal(strip.status, 0, strip.stderr);
  await writeFile(
    resolve(output, 'recording.json'),
    JSON.stringify(
      {
        origin,
        viewport: [1440, 1000],
        zoom: 1,
        frameCount: frames.length,
        durationMs: 18000,
        timeline,
      },
      null,
      2,
    ) + '\n',
  );
  console.log(
    'PASS composited main-page recording: entry, formation, exit, reversal, pause, paused navigation and resume',
  );
} finally {
  await close();
}
