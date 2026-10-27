// Small modelling helpers shared by every prop.
import * as THREE from 'three';

const materials = new Map();
export function M(color, o = {}) {
  const { unique, ...rest } = o;
  const key = color + JSON.stringify(rest);
  if (!unique && materials.has(key)) return materials.get(key);
  const m = new THREE.MeshStandardMaterial({ color, roughness: .75, metalness: 0, ...rest });
  if (!unique) materials.set(key, m);
  return m;
}

export function mesh(geo, mat, parent, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  parent?.add(m);
  return m;
}
// box and cyl take the y of their bottom face; sph and capsule are centred.
export const box = (w, h, d, mat, x, y, z, parent) => mesh(new THREE.BoxGeometry(w, h, d), mat, parent, x, y + h / 2, z);
export const cyl = (r, h, mat, x, y, z, parent, seg = 20, rTop = r) => mesh(new THREE.CylinderGeometry(rTop, r, h, seg), mat, parent, x, y + h / 2, z);
export const sph = (r, mat, x, y, z, parent, ws = 20, hs = 14) => mesh(new THREE.SphereGeometry(r, ws, hs), mat, parent, x, y, z);
export const capsule = (r, len, mat, x, y, z, parent) => mesh(new THREE.CapsuleGeometry(r, len, 6, 14), mat, parent, x, y, z);

export function group(parent, x = 0, y = 0, z = 0) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  parent?.add(g);
  return g;
}

export function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  draw(ctx, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.userData = { canvas: c, ctx };
  return t;
}
// Soft round glow for additive sprites (a sprite without a map renders as a square).
let glow;
export function glowTexture() {
  glow ??= canvasTex(128, 128, (g, w) => {
    const grd = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(.35, 'rgba(255,255,255,.45)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd; g.fillRect(0, 0, w, w);
  });
  return glow;
}

export function redraw(tex, draw) {
  const { canvas, ctx } = tex.userData;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  draw(ctx, canvas.width, canvas.height);
  tex.needsUpdate = true;
}

// A prop is an outer root (moved by the story) holding a body (lifted on hover).
export function prop(parent) {
  const root = new THREE.Group(), body = new THREE.Group();
  root.add(body);
  root.userData.body = body;
  parent?.add(root);
  return { root, body };
}

export function castShadows(o, on = true) {
  o.traverse(c => { if (c.isMesh) c.castShadow = on; });
  return o;
}
// Layer 1 is drawn but gets no ink outline and can't be picked.
export function noOutline(o) {
  o.traverse(c => c.layers.set(1));
  return o;
}

export const font = (weight, px, family = '"Barlow Semi Condensed", "Arial Narrow", sans-serif') => `${weight} ${px}px ${family}`;

// Deterministic random so props look the same on every load.
export function seeded(seed = 1) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

export function yawFromDir(dx, dz) { return Math.atan2(-dz, dx); }  // for props whose forward is local +x
export function shortestAngle(from, to) { return from + Math.atan2(Math.sin(to - from), Math.cos(to - from)); }
