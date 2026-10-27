// The voyage drawn on the sea: a dashed line for the whole route and a solid orange one
// that grows behind the ship. Both are flat ribbons that follow the ship's own curve.
import * as THREE from 'three';
import { noOutline } from '../engine/kit.js';
import { WATER_Y } from '../story/places.js';

const N = 700, WIDTH = 3.4;

export function createRoute(curve) {
  const pos = new Float32Array(N * 2 * 3);
  const p = new THREE.Vector3(), t = new THREE.Vector3();
  for (let i = 0; i < N; i++) {
    const u = i / (N - 1);
    curve.getPointAt(u, p);
    curve.getTangentAt(Math.min(.999, Math.max(.001, u)), t);
    const sx = -t.z, sz = t.x, l = Math.hypot(sx, sz) || 1;
    for (const [k, s] of [[0, 1], [1, -1]]) {
      const o = (i * 2 + k) * 3;
      pos[o] = p.x + sx / l * WIDTH / 2 * s;
      pos[o + 1] = WATER_Y + .12;
      pos[o + 2] = p.z + sz / l * WIDTH / 2 * s;
    }
  }
  const all = [], dashes = [];
  for (let i = 0; i < N - 1; i++) {
    const a = i * 2, quad = [a, a + 1, a + 2, a + 1, a + 3, a + 2];
    all.push(...quad);
    if (i % 10 < 5) dashes.push(...quad);
  }
  const ribbon = (index, color, opacity) => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setIndex(index);
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false }));
    m.renderOrder = 2;
    m.userData.base = opacity;
    return noOutline(m);
  };
  const root = new THREE.Group();
  const todo = ribbon(dashes, '#1c2236', .45), done = ribbon(all, '#e8863a', 1);
  root.add(todo, done);

  const api = {
    root,
    reveal(progress) { done.geometry.setDrawRange(0, Math.floor(Math.max(0, Math.min(1, progress)) * (N - 1)) * 6); },
    setOpacity(o) {
      root.visible = o > .001;
      for (const m of [todo, done]) m.material.opacity = m.userData.base * o;
    },
  };
  api.reveal(0);
  api.setOpacity(0);
  return api;
}
