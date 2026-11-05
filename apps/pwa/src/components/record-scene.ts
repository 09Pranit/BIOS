import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export type RecordScene = {
  setConnected(value: boolean): void;
  setPaused(value: boolean): void;
  setVisible(value: boolean): void;
  dispose(): void;
};

export function createRecordScene(host: HTMLElement, onContextLost: () => void): RecordScene {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setClearColor(0x000000, 0);
  host.append(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 40);
  camera.position.set(6, 7, 9);
  camera.lookAt(0, 0.2, 0);
  scene.add(new THREE.HemisphereLight(0xfff7e4, 0x5f8776, 3));
  const sun = new THREE.DirectionalLight(0xfff9eb, 4);
  sun.position.set(-3, 7, 4);
  scene.add(sun);
  const world = new THREE.Group();
  scene.add(world);
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const material = (color: number, roughness = 0.7) => {
    const result = new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.08 });
    materials.add(result);
    return result;
  };
  const paper = material(0xfff9ea);
  const green = material(0x254e41);
  const pale = material(0xb9cbb4);
  const ink = material(0x567668);
  const gold = material(0xd6a666, 0.4);
  const mesh = (geometry: THREE.BufferGeometry, surface: THREE.Material, parent: THREE.Object3D = world) => {
    geometries.add(geometry);
    const object = new THREE.Mesh(geometry, surface);
    parent.add(object);
    return object;
  };
  const box = (w: number, h: number, d: number, radius = 0.04) => new RoundedBoxGeometry(w, h, d, 2, radius);
  const base = mesh(new THREE.CylinderGeometry(2.9, 2.9, 0.12, 80), material(0xdce4d5));
  base.position.y = -0.22;
  const ringMaterial = new THREE.LineBasicMaterial({ color: 0xa7baaa, transparent: true, opacity: 0.55 });
  materials.add(ringMaterial);
  for (const radius of [1.05, 1.8, 2.6]) {
    const points = new THREE.EllipseCurve(0, 0, radius, radius, 0, Math.PI * 2).getPoints(96);
    const geometry = new THREE.BufferGeometry().setFromPoints(
      points.map((p) => new THREE.Vector3(p.x, -0.149, p.y)),
    );
    geometries.add(geometry);
    world.add(new THREE.LineLoop(geometry, ringMaterial));
  }

  const register = new THREE.Group();
  register.position.set(-1.25, 0.3, 0.6);
  register.rotation.y = -0.25;
  world.add(register);
  mesh(box(1.65, 0.18, 2.1, 0.08), green, register);
  for (let page = 0; page < 3; page++) {
    const sheet = mesh(box(1.48, 0.045, 1.9), paper, register);
    sheet.position.set(0.015 * page, 0.12 + page * 0.045, 0);
  }
  const heading = mesh(box(0.9, 0.025, 0.12), ink, register);
  heading.position.set(0.12, 0.24, -0.58);
  for (let row = 0; row < 4; row++) {
    const line = mesh(box(0.68, 0.02, 0.04, 0.01), pale, register);
    line.position.set(0.05, 0.24, -0.21 + row * 0.28);
    const mark = mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.025, 16), row === 3 ? gold : ink, register);
    mark.position.set(0.56, 0.24, -0.21 + row * 0.28);
  }
  for (const z of [-0.65, 0, 0.65]) {
    const binding = mesh(new THREE.TorusGeometry(0.12, 0.025, 8, 20), gold, register);
    binding.position.set(-0.73, 0.18, z);
    binding.rotation.y = Math.PI / 2;
  }

  const hub = new THREE.Group();
  hub.position.set(1.25, 0, -0.65);
  world.add(hub);
  for (let level = 0; level < 3; level++) {
    const layer = mesh(new THREE.CylinderGeometry(0.62, 0.67, 0.2, 48), level === 2 ? green : pale, hub);
    layer.position.y = level * 0.24;
  }
  const hubCore = mesh(new THREE.SphereGeometry(0.15, 24, 16), gold, hub);
  hubCore.position.y = 0.88;
  const halo = mesh(new THREE.TorusGeometry(0.35, 0.018, 8, 60), gold, hub);
  halo.position.y = 0.88;
  halo.rotation.x = Math.PI / 2;
  const device = new THREE.Group();
  device.position.set(1.3, 0.13, 1.45);
  device.rotation.y = -0.4;
  world.add(device);
  mesh(box(0.63, 0.13, 1.08, 0.07), green, device);
  const screen = mesh(box(0.51, 0.02, 0.82), paper, device);
  screen.position.y = 0.08;
  for (let row = 0; row < 3; row++) {
    const line = mesh(box(0.29, 0.02, 0.04, 0.01), pale, device);
    line.position.set(0, 0.1, -0.2 + row * 0.19);
  }

  const pathMaterial = new THREE.MeshStandardMaterial({ color: 0x9aaa99, roughness: 0.7 });
  materials.add(pathMaterial);
  const routes = [
    new THREE.CubicBezierCurve3(
      new THREE.Vector3(-0.45, 0.3, 0.4),
      new THREE.Vector3(0, 1.5, 0.3),
      new THREE.Vector3(0.45, 1.5, -0.6),
      new THREE.Vector3(1.25, 0.75, -0.65),
    ),
    new THREE.CubicBezierCurve3(
      new THREE.Vector3(1.3, 0.25, 1.45),
      new THREE.Vector3(2, 1, 1),
      new THREE.Vector3(2, 1, -0.25),
      new THREE.Vector3(1.25, 0.75, -0.65),
    ),
  ];
  const packets = routes.map((route) => {
    mesh(new THREE.TubeGeometry(route, 40, 0.012, 6, false), pathMaterial);
    return mesh(new THREE.SphereGeometry(0.065, 12, 8), gold);
  });

  let connected = false;
  let paused = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let visible = true;
  let lost = false;
  let disposed = false;
  let frame = 0;
  let previous = 0;
  let time = 0;
  const pointer = new THREE.Vector2();
  const draw = () => {
    packets.forEach((packet, index) => {
      packet.visible = connected;
      packet.position.copy(routes[index].getPoint((time * 0.22 + index * 0.4) % 1));
    });
    renderer.render(scene, camera);
  };
  const tick = (now: number) => {
    frame = requestAnimationFrame(tick);
    if (now - previous < 33) return;
    time += Math.min((now - (previous || now)) / 1000, 0.05);
    previous = now;
    register.position.y = 0.3 + Math.sin(time * 0.9) * 0.045;
    world.rotation.y += (pointer.x * 0.1 - world.rotation.y) * 0.05;
    world.rotation.x += (pointer.y * 0.04 - world.rotation.x) * 0.05;
    draw();
  };
  const updatePlayback = () => {
    cancelAnimationFrame(frame);
    previous = 0;
    if (!disposed && !lost && visible && !document.hidden) {
      draw();
      if (!paused) frame = requestAnimationFrame(tick);
    }
  };
  const resize = () => {
    const { width, height } = host.getBoundingClientRect();
    if (!width || !height || lost) return;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    draw();
  };
  const move = (event: PointerEvent) => {
    if (paused || event.pointerType !== 'mouse') return;
    const bounds = host.getBoundingClientRect();
    pointer.set(
      (event.clientX - bounds.left) / bounds.width - 0.5,
      (event.clientY - bounds.top) / bounds.height - 0.5,
    );
  };
  const leave = () => pointer.set(0, 0);
  const contextLost = () => {
    lost = true;
    cancelAnimationFrame(frame);
    onContextLost();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  host.addEventListener('pointermove', move);
  host.addEventListener('pointerleave', leave);
  renderer.domElement.addEventListener('webglcontextlost', contextLost);
  document.addEventListener('visibilitychange', updatePlayback);
  resize();
  updatePlayback();

  return {
    setConnected(value) {
      connected = value;
      pathMaterial.color.set(value ? 0xbf955b : 0x9aaa99);
      updatePlayback();
    },
    setPaused(value) {
      paused = value;
      updatePlayback();
    },
    setVisible(value) {
      visible = value;
      updatePlayback();
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      host.removeEventListener('pointermove', move);
      host.removeEventListener('pointerleave', leave);
      document.removeEventListener('visibilitychange', updatePlayback);
      renderer.domElement.removeEventListener('webglcontextlost', contextLost);
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((surface) => surface.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
