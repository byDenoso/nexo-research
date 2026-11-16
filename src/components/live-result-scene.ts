import * as THREE from 'three/webgpu';
import {
  baoFootprint, LIVE_RESULT_PROBES, LIVE_RESULT_PLANCK_REFERENCE, LIVE_RESULT_SCENARIOS,
  type PlanePoint, type ProbeId, type ScenarioId
} from '@/lib/live-result';

export type SceneView = {
  scenario: ScenarioId;
  hidden: ReadonlySet<ProbeId>;
  dark: boolean;
  reducedMotion: boolean;
};

const probeColors = {
  cmb: ['#365bb6', '#789cff'], bao: ['#007c81', '#43d0cc'], des: ['#ad512e', '#f39a69'],
  pantheon: ['#78549d', '#bc98e8'], ladder: ['#a3771b', '#ebc05c']
} as const;
type Point = [number, number];

const WIDTH = 7.3, DEPTH = 5.1;
const OM_MIN = 0.262, OM_MAX = 0.382;
const H_MIN = 61, H_MAX = 75.25;
const xOf = (omegaM: number) => WIDTH * ((omegaM - OM_MIN) / (OM_MAX - OM_MIN) - 0.5);
const zOf = (h0: number) => DEPTH * (0.5 - (h0 - H_MIN) / (H_MAX - H_MIN));
const clamp = THREE.MathUtils.clamp;
const rectangle = (x1: number, x2: number, z1: number, z2: number): Point[] => [[x1,z1],[x2,z1],[x2,z2],[x1,z2]];
const baoAnchor = LIVE_RESULT_PROBES.bao.anchor as PlanePoint;
const CAMERA = {azimuth: 0.38, polar: 0.84, zoom: 1};

function strip(id: 'des' | 'pantheon' | 'ladder'): Point[] {
  const anchor = LIVE_RESULT_PROBES[id].anchor;
  if (id === 'ladder') {
    const {h0, sigmaH0} = anchor;
    return rectangle(-WIDTH/2, WIDTH/2, zOf(h0! + sigmaH0!), zOf(h0! - sigmaH0!));
  }
  const {omegaM, sigmaOmegaM} = anchor;
  return rectangle(xOf(omegaM! - sigmaOmegaM!), xOf(omegaM! + sigmaOmegaM!), -DEPTH/2, DEPTH/2);
}

function densityStrip(): Point[] {
  const {omegaMh2, sigmaOmegaMh2} = LIVE_RESULT_PLANCK_REFERENCE;
  const edge = (density: number) => {
    const start = Math.max(H_MIN, 100 * Math.sqrt(density / OM_MAX));
    const end = Math.min(H_MAX, 100 * Math.sqrt(density / OM_MIN));
    return Array.from({length: 45}, (_, i): Point => {
      const h0 = start + (end - start) * i / 44;
      return [xOf(density / (h0 / 100) ** 2), zOf(h0)];
    });
  };
  return [...edge(omegaMh2 - sigmaOmegaMh2), ...edge(omegaMh2 + sigmaOmegaMh2).reverse()];
}

function volume(points: readonly Point[], height: number, order: number) {
  const shape = new THREE.Shape(points.map(([x,z]) => new THREE.Vector2(x,-z)));
  const geometry = new THREE.ExtrudeGeometry(shape, {depth: height, bevelEnabled: false, curveSegments: 1});
  geometry.rotateX(-Math.PI/2);
  const material = new THREE.MeshStandardMaterial({roughness: 0.28, metalness: 0.06, transparent: true, depthWrite: false});
  const body = new THREE.Mesh(geometry, material);
  const outline = new THREE.LineBasicMaterial({transparent: true, depthWrite: false});
  const rim = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([...points, points[0]!].map(([x,z]) => new THREE.Vector3(x,height + 0.002,z))),
    outline
  );
  const group = new THREE.Group();
  body.renderOrder = order;
  rim.renderOrder = order + 1;
  group.add(body, rim);
  return {group, material, outline};
}

function pin(height: number) {
  const group = new THREE.Group();
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.065, 18, 12), new THREE.MeshStandardMaterial({roughness: 0.2}));
  core.position.y = height;
  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.009, 8, 28), new THREE.MeshBasicMaterial());
  halo.rotation.x = -Math.PI/2;
  halo.position.y = height;
  const stem = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0.015,0),new THREE.Vector3(0,height,0)]),
    new THREE.LineBasicMaterial({transparent: true, opacity: 0.8})
  );
  group.add(core, halo, stem);
  return {group, tint(color: string) {
    core.material.color.set(color);
    core.material.emissive.set(color).multiplyScalar(0.18);
    halo.material.color.set(color);
    stem.material.color.set(color);
  }};
}

export async function createLiveResultScene(
  canvas: HTMLCanvasElement, frame: HTMLElement, axes: readonly HTMLElement[], initial: SceneView, onFailure: () => void
) {
  const gpu = (navigator as Navigator & {gpu?: unknown}).gpu;
  const renderer = new THREE.WebGPURenderer({canvas, antialias: true, alpha: true, forceWebGL: !gpu});
  renderer.onDeviceLost = onFailure;
  try {
    await renderer.init();
  } catch (error) {
    renderer.dispose();
    throw error;
  }
  renderer.setClearColor(0,0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
  const probeScene = new THREE.Group();
  scene.add(probeScene, new THREE.HemisphereLight(0xf8fbff,0x9cb2cc,1.2));
  const key = new THREE.DirectionalLight(0xfffcf1,2);
  key.position.set(-3,6,4);
  const rim = new THREE.DirectionalLight(0x86baff,1.1);
  rim.position.set(2,2,-4);
  scene.add(key, rim);

  const floor = new THREE.Mesh(new THREE.BoxGeometry(WIDTH + 0.09, 0.11, DEPTH + 0.09), new THREE.MeshStandardMaterial({roughness: 0.63}));
  floor.position.y = -0.062;
  probeScene.add(floor);
  const grid = new THREE.LineSegments(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({transparent:true,opacity:0.49}));
  const gridVertices: number[] = [];
  for (let i = 0; i <= 10; i++) {
    const x = WIDTH * (i/10 - 0.5), z = DEPTH * (i/10 - 0.5);
    gridVertices.push(x,0,-DEPTH/2, x,0,DEPTH/2, -WIDTH/2,0,z, WIDTH/2,0,z);
  }
  grid.geometry.setAttribute('position',new THREE.Float32BufferAttribute(gridVertices,3));
  probeScene.add(grid);

  const bands = {des: volume(strip('des'), 0.14, 4), pantheon: volume(strip('pantheon'), 0.10, 2),
    ladder: volume(strip('ladder'), 0.15, 6), cmb: volume(densityStrip(), 0.26, 8)};
  const baselinePoints = baoFootprint('baseline')!;
  const base = volume(baselinePoints.slice(0,-1).map(({omegaM,h0}) => [xOf(omegaM)-xOf(baoAnchor.omegaM),zOf(h0)-zOf(baoAnchor.h0)]), 0.37, 10);
  const without = LIVE_RESULT_SCENARIOS.withoutLrg2.bao!;
  const cut = volume(baoFootprint('withoutLrg2')!.slice(0,-1).map(({omegaM,h0}) => [xOf(omegaM)-xOf(without.omegaM),zOf(h0)-zOf(without.h0)]), 0.37, 10);
  const ghost = new THREE.Line(new THREE.BufferGeometry().setFromPoints(baselinePoints.map(({omegaM,h0}) => new THREE.Vector3(xOf(omegaM),0.018,zOf(h0)))),
    new THREE.LineBasicMaterial({transparent:true,opacity:0.66}));
  const bao = new THREE.Group();
  const baoPin = pin(0.44);
  bao.add(base.group, cut.group, baoPin.group);
  const cmbPin = pin(0.33);
  const cmbAnchor = LIVE_RESULT_PROBES.cmb.anchor as PlanePoint;
  cmbPin.group.position.set(xOf(cmbAnchor.omegaM),0,zOf(cmbAnchor.h0));
  const joint = pin(0.6);
  const jointAnchor = LIVE_RESULT_SCENARIOS.masslessNeutrinos.joint!;
  joint.group.position.set(xOf(jointAnchor.omegaM),0,zOf(jointAnchor.h0));
  probeScene.add(...Object.values(bands).map(item => item.group), ghost, bao, cmbPin.group, joint.group);

  const axisPositions = [new THREE.Vector3(WIDTH/2 + 0.23,0.05,0.1),new THREE.Vector3(-WIDTH/2 - 0.18,0.05,-DEPTH/2)];
  const projected = new THREE.Vector3();
  const target = {...CAMERA};
  const orbit = {...CAMERA};
  const pointers = new Map<number, Point>();
  const position = new THREE.Vector2(xOf(baoAnchor.omegaM), zOf(baoAnchor.h0));
  const nextPosition = position.clone();
  let view = initial;
  let frameId = 0, width = 1, height = 1, time = 0, blend = 0, contour = 1;
  let disposed = false, failed = false;

  function invalidate() {
    if (!frameId && !disposed && !failed && !document.hidden) frameId = requestAnimationFrame(render);
  }

  function render(now: number) {
    frameId = 0;
    const dt = time ? clamp(now - time, 8, 40) : 24;
    time = now;
    const ease = view.reducedMotion ? 1 : 1 - Math.exp(-dt / 94);
    let pending = false;
    const smooth = (value: number, goal: number) => {
      if (Math.abs(value - goal) < 0.0008) return goal;
      pending = true;
      return THREE.MathUtils.lerp(value, goal, ease);
    };
    orbit.azimuth = smooth(orbit.azimuth,target.azimuth);
    orbit.polar = smooth(orbit.polar,target.polar);
    orbit.zoom = smooth(orbit.zoom,target.zoom);
    const distance = 11.5 * orbit.zoom / Math.min(1,camera.aspect / 1.32);
    camera.position.setFromSphericalCoords(distance, orbit.polar, orbit.azimuth);
    camera.lookAt(0,-0.23,0);
    camera.updateMatrixWorld();
    position.x = smooth(position.x,nextPosition.x);
    position.y = smooth(position.y,nextPosition.y);
    blend = smooth(blend,view.scenario === 'withoutLrg2' ? 1 : 0);
    contour = smooth(contour,view.scenario === 'shortRuler' ? 0 : 1);
    bao.position.set(position.x,0,position.y);
    const smoothContour = Math.max(0.13,contour);
    for (const [shape, visibility] of [[base,(1 - blend)*contour], [cut,blend*contour]] as const) {
      shape.group.visible = visibility > 0.003;
      shape.group.scale.set(smoothContour,1,smoothContour);
      shape.material.opacity = visibility * 0.79;
      shape.outline.opacity = visibility * 0.91;
    }
    try {
      renderer.render(scene,camera);
    } catch {
      failed = true;
      onFailure();
      return;
    }
    axes.forEach((axis,index) => {
      projected.copy(axisPositions[index]!).project(camera);
      const x = (projected.x + 1) * width/2, y = (1 - projected.y) * height/2;
      axis.style.visibility = x < 19 || x > width - 19 || y < 20 || y > height - 20 ? 'hidden' : '';
      axis.style.transform = `translate(${x}px,${y}px) translate(-50%,-50%)`;
    });
    if (pending) invalidate();
    else time = 0;
  }

  function resize() {
    width = Math.max(1,frame.clientWidth);
    height = Math.max(1,frame.clientHeight);
    camera.aspect = width/height;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(devicePixelRatio, width < 640 ? 1.25 : 1.5, 1500 / Math.max(width,height)));
    renderer.setSize(width,height,false);
    invalidate();
  }

  function setView(next: SceneView) {
    view = next;
    const index = view.dark ? 1 : 0;
    const activeAnchor = LIVE_RESULT_SCENARIOS[view.scenario].bao ?? baoAnchor;
    nextPosition.set(xOf(activeAnchor.omegaM),zOf(activeAnchor.h0));
    floor.material.color.set(view.dark ? '#152440' : '#e0e8f6');
    grid.material.color.set(view.dark ? '#51648a' : '#8b9cbc');
    const dim = view.scenario === 'desOffset';
    for (const id of Object.keys(bands) as (keyof typeof bands)[]) {
      const band = bands[id];
      band.group.visible = !view.hidden.has(id);
      band.material.color.set(probeColors[id][index]);
      band.material.opacity = dim && id !== 'des' ? 0.30 : id === 'cmb' || (dim && id === 'des') ? 0.79 : 0.48;
      band.outline.color.copy(band.material.color);
      band.outline.opacity = dim && id !== 'des' ? 0.41 : 0.84;
    }
    for (const shape of [base,cut]) {
      shape.material.color.set(probeColors.bao[index]);
      shape.outline.color.copy(shape.material.color);
    }
    bao.visible = !view.hidden.has('bao');
    ghost.visible = bao.visible && (view.scenario === 'withoutLrg2' || view.scenario === 'shortRuler');
    ghost.material.color.set(probeColors.bao[index]);
    cmbPin.group.visible = !view.hidden.has('cmb');
    joint.group.visible = view.scenario === 'masslessNeutrinos';
    baoPin.tint(probeColors.bao[index]);
    cmbPin.tint(probeColors.cmb[index]);
    joint.tint(view.dark ? '#eef5ff' : '#13274f');
    invalidate();
  }

  function move(azimuth: number, elevation: number, zoom = 0) {
    target.azimuth = clamp(target.azimuth + azimuth, -0.78, 1.24);
    target.polar = clamp(target.polar + elevation, 0.37, 1.29);
    target.zoom = clamp(target.zoom + zoom, 0.63, 1.46);
    invalidate();
  }

  function pointerDown(event: PointerEvent) {
    if (event.button !== 0) return;
    pointers.set(event.pointerId,[event.clientX,event.clientY]);
    canvas.setPointerCapture(event.pointerId);
  }
  function pointerMove(event: PointerEvent) {
    const previous = pointers.get(event.pointerId);
    if (!previous) return;
    const [x,y] = previous;
    pointers.set(event.pointerId,[event.clientX,event.clientY]);
    if (pointers.size === 2) {
      const other = [...pointers.entries()].find(([id]) => id !== event.pointerId)?.[1];
      if (other) move(0,0,(Math.hypot(x-other[0],y-other[1]) - Math.hypot(event.clientX-other[0],event.clientY-other[1])) * 0.006);
      return;
    }
    move((x-event.clientX)*0.008,(y-event.clientY)*0.006);
  }
  function pointerEnd(event: PointerEvent) {pointers.delete(event.pointerId);}
  function visibility() {
    if (!document.hidden) { invalidate(); return; }
    cancelAnimationFrame(frameId);
    frameId = time = 0;
  }
  function deviceLost(event: Event) {event.preventDefault(); onFailure();}

  const events = {pointerdown: pointerDown, pointermove: pointerMove, pointerup: pointerEnd, pointercancel: pointerEnd, lostpointercapture: pointerEnd, webglcontextlost: deviceLost};
  for (const [event, listener] of Object.entries(events)) canvas.addEventListener(event,listener as EventListener);
  document.addEventListener('visibilitychange',visibility);
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(frame);
  resize();
  setView(initial);
  const backend: 'webgpu' | 'webgl2' = 'isWebGPUBackend' in renderer.backend ? 'webgpu' : 'webgl2';

  return {
    backend,
    setView, move,
    reset() {Object.assign(target,CAMERA);invalidate();},
    dispose() {
      disposed = true;
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      document.removeEventListener('visibilitychange',visibility);
      for (const [event, listener] of Object.entries(events)) canvas.removeEventListener(event,listener as EventListener);
      scene.traverse(object => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach(material => material.dispose());
        }
      });
      renderer.dispose();
    }
  };
}
