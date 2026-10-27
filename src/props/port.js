// Ship-to-shore cranes, the haulage truck and the UK border checkpoint.
import * as THREE from 'three';
import { M, box, cyl, sph, mesh, group, prop, castShadows, canvasTex, font, yawFromDir, glowTexture } from '../engine/kit.js';

/* ---------- crane ---------- */
// Root sits on the quay; the boom runs along +z out over the water.
export function createCrane(color = '#e0a43a') {
  const { root, body } = prop();
  const steel = M(color), dark = M('#3a3d46'), cab = M('#f1efe9');
  for (const x of [-4.5, 4.5]) for (const z of [-3.25, 3.25]) {
    box(.7, 15.6, .7, steel, x, 0, z, body);
    box(1, .5, 1.4, dark, x, 0, z, body);
  }
  for (const x of [-4.5, 4.5]) { box(.5, .5, 7, steel, x, 10, 0, body); box(.4, .4, 7, steel, x, 4.2, 0, body); }
  box(9.6, .6, .6, steel, 0, 15.6, -3.25, body);
  box(9.6, .6, .6, steel, 0, 15.6, 3.25, body);
  for (const x of [-1.2, 1.2]) box(.6, 1, 26, steel, x, 15.6, 6.5, body);   // boom rails, z -6.5..19.5
  box(4, 2.2, 3.4, cab, 0, 16.6, -5.2, body);
  box(4.05, .5, 3.45, dark, 0, 18, -5.2, body);
  // stays from a top mast to the boom tip
  cyl(.25, 5, steel, 0, 16.6, 1.5, body, 8);
  const stay = mesh(new THREE.CylinderGeometry(.07, .07, 1, 6), dark, body);
  const a = new THREE.Vector3(0, 21.6, 1.5), b = new THREE.Vector3(0, 16.6, 19.4);
  stay.position.copy(a).add(b).multiplyScalar(.5);
  stay.scale.y = a.distanceTo(b);
  stay.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());

  const trolley = group(body, 0, 15.6, 0);
  box(2.8, .7, 2, dark, 0, -.7, 0, trolley);
  const cable = mesh(new THREE.CylinderGeometry(.06, .06, 1, 6), dark, trolley);
  const spreader = group(body, 0, 10, 0);
  box(6.1, .3, 2.4, M('#c8463d'), 0, 0, 0, spreader);
  box(1, .5, .6, dark, 0, .3, 0, spreader);
  castShadows(root);

  const state = { z: 0, y: 10 };
  function set(z = state.z, y = state.y) {
    state.z = z; state.y = y;
    trolley.position.z = z;
    spreader.position.set(0, y, z);
    const len = Math.max(.1, 15.6 - .7 - (y + .8));
    cable.scale.y = len;
    cable.position.y = -.7 - len / 2;
  }
  set(0, 10);
  return { root, body, spreader, set, state };
}

/* ---------- truck ---------- */
export function createTruck(stage, route) {
  const { root, body } = prop();
  const red = M('#2f5597'), dark = M('#25262c'), glass = M('#9cc6d4', { roughness: .2 });
  box(2.1, 2.5, 2.5, red, 4.15, .7, 0, body);
  box(.06, 1, 2.2, glass, 5.21, 1.9, 0, body);
  for (const s of [-1, 1]) box(1.2, .9, .06, glass, 4.3, 1.9, s * 1.26, body);
  box(9.2, .35, 2.2, dark, .2, .75, 0, body);
  box(.5, .5, 2.4, M('#d8d6d0'), 5.25, .45, 0, body);
  const wheels = [];
  for (const x of [-3.4, -2.3, 1.2, 4.3]) for (const s of [-1, 1]) {
    const w = cyl(.5, .4, dark, x, 0, 0, body, 16);
    w.rotation.x = Math.PI / 2; w.position.set(x, .5, s * 1.05);
    wheels.push(w);
  }
  const mount = group(body, -.8, 1.1, 0);
  castShadows(root);

  const curve = new THREE.CatmullRomCurve3(route.map(([x, z]) => new THREE.Vector3(x, .05, z)), false, 'centripetal');
  const tan = new THREE.Vector3();
  const state = { progress: 0 };
  function setProgress(t) {
    const prev = state.progress;
    state.progress = Math.max(0, Math.min(1, t));
    curve.getPointAt(state.progress, root.position);
    curve.getTangentAt(Math.min(.999, Math.max(.001, state.progress)), tan);
    root.rotation.y = yawFromDir(tan.x, tan.z);
    const spin = (state.progress - prev) * curve.getLength() / .5;
    wheels.forEach(w => { w.rotation.y -= spin; });
  }
  // progress at which the truck's root reaches a given z (sampled once)
  function progressAtZ(z) {
    let best = 0, bd = Infinity;
    // skip the first stretch along the quay so only the northbound road is matched
    for (let i = 100; i <= 400; i++) { const p = curve.getPointAt(i / 400); const d = Math.abs(p.z - z); if (d < bd) { bd = d; best = i / 400; } }
    return best;
  }
  setProgress(0);
  return { root, body, mount, setProgress, progressAtZ, get progress() { return state.progress; } };
}

/* ---------- border checkpoint ---------- */
export function createCheckpoint({ roadX = 100, barrierZ = -27, boothX = 105.5, gantryZ = -31 }) {
  const { root, body } = prop();
  const white = M('#f3f1ea'), navy = M('#24335a'), dark = M('#2d3446');

  // booth
  const booth = group(body, boothX, 0, barrierZ - .5);
  box(2.8, 2.7, 2.8, white, 0, 0, 0, booth);
  box(3.6, .3, 3.6, navy, 0, 2.7, 0, booth);
  box(.06, 1, 1.8, M('#9cc6d4', { roughness: .2 }), -1.42, 1.2, 0, booth);
  box(2.2, .5, .06, navy, 0, 1.95, 1.42, booth);
  cyl(.06, .9, dark, 0, 3, 0, booth, 8);
  const lampMat = new THREE.MeshStandardMaterial({ color: '#555a66', emissive: '#000000', emissiveIntensity: 1.6, roughness: .3 });
  const lamp = sph(.36, lampMat, 0, 4.1, 0, booth, 16, 12);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: '#ff4a3a', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  halo.scale.setScalar(3.2); halo.position.y = 4.1; halo.layers.set(1);
  booth.add(halo);

  // barrier: post on the east verge, arm across the road towards -x
  const post = group(body, roadX + 3.4, 0, barrierZ);
  box(.5, 1.2, .5, M('#c8463d'), 0, 0, 0, post);
  const pivot = group(post, 0, 1.05, 0);
  const stripes = canvasTex(512, 32, (g, w, h) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#ffffff' : '#d23c32'; g.fillRect(i * w / 8, 0, w / 8 + 1, h); } });
  const armMat = new THREE.MeshStandardMaterial({ map: stripes, roughness: .5 });
  box(7, .22, .22, armMat, -3.6, -.11, 0, pivot);

  // overhead sign
  const sign = canvasTex(1024, 180, (g, w, h) => {
    g.fillStyle = '#24335a'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#f3f1ea'; g.lineWidth = 6; g.strokeRect(10, 10, w - 20, h - 20);
    g.fillStyle = '#f3f1ea'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = font(700, 78); g.letterSpacing = '8px';
    g.fillText('UK BORDER · CUSTOMS', w / 2, h / 2 + 4);
  });
  for (const x of [roadX - 4.6, roadX + 4.6]) box(.4, 6.8, .4, M('#c9ccd2'), x, 0, gantryZ, body);
  box(9.6, .4, .5, M('#c9ccd2'), roadX, 6.6, gantryZ, body);
  const board = box(8.6, 1.6, .2, [navy, navy, navy, navy, new THREE.MeshStandardMaterial({ map: sign }), navy], roadX, 4.9, gantryZ, body);
  board.renderOrder = 1;
  castShadows(root);

  const colors = { red: ['#ff4a3a', '#ff2a1a'], green: ['#52d68a', '#20c070'], amber: ['#ffc24a', '#ffaa00'], off: ['#555a66', '#000000'] };
  return {
    root, body, booth, pivot, lamp,
    setBarrier(open) { pivot.rotation.z = -open * 1.4; },
    setLamp(name) {
      const [c, e] = colors[name] ?? colors.off;
      lampMat.color.set(c); lampMat.emissive.set(e);
      halo.material.color.set(c); halo.material.opacity = name === 'off' ? 0 : .55;
    },
  };
}
