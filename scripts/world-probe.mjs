// Test-side inspection of the installed React/R3F renderer; no production debug API.
export function installWorldProbe(pointName = 'ambient-particles') {
  const canvas = document.querySelector('canvas');
  let fiber = canvas[Object.keys(canvas).find((key) => key.startsWith('__reactFiber$'))];
  let renderer;
  while (fiber && !renderer) {
    for (let hook = fiber.memoizedState; hook; hook = hook.next) {
      if (hook.memoizedState?.current?.isWebGLRenderer) renderer = hook.memoizedState.current;
    }
    fiber = fiber.return;
  }
  if (!renderer) throw new Error('Installed React renderer ref not found');
  const probe = (window.worldProbe = {
    renderer,
    scene: null,
    frames: 0,
    times: [],
    disposed: { geometry: 0, material: 0 },
    maxStep: 0,
  });
  const original = renderer.render.bind(renderer);
  let lastPositions;
  renderer.render = (scene, camera) => {
    probe.scene = scene;
    probe.camera = camera;
    probe.frames++;
    if (probe.times.length < 2000) probe.times.push(performance.now());
    const points = scene.getObjectByName(pointName);
    if (points) {
      const positions = points.geometry.attributes.position.array;
      if (!lastPositions) {
        lastPositions = positions.slice();
        points.geometry.addEventListener('dispose', () => probe.disposed.geometry++);
        points.material.addEventListener('dispose', () => probe.disposed.material++);
      }
      for (let index = 0; index < positions.length; index++) {
        probe.maxStep = Math.max(probe.maxStep, Math.abs(positions[index] - lastPositions[index]));
        lastPositions[index] = positions[index];
      }
    }
    original(scene, camera);
  };
  probe.read = () => {
    const points = probe.scene?.getObjectByName(pointName);
    const gl = renderer.getContext();
    const debug = gl.getExtension('WEBGL_debug_renderer_info');
    return {
      frames: probe.frames,
      maxStep: probe.maxStep,
      count: points?.geometry.attributes.position.count,
      geometry: points?.geometry.uuid,
      material: points?.material.uuid,
      calls: renderer.info.render.calls,
      points: renderer.info.render.points,
      memory: { ...renderer.info.memory },
      programs: renderer.info.programs?.length,
      renderer: debug
        ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)
        : gl.getParameter(gl.RENDERER),
      dpr: renderer.getPixelRatio(),
      viewport: [innerWidth, innerHeight],
      buffer: [canvas.width, canvas.height],
      camera: probe.camera?.position.toArray(),
      aspect: points?.scale.x,
      hidden: document.hidden,
      disposed: { ...probe.disposed },
      contextLost: gl.isContextLost(),
    };
  };
}
