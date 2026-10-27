// Containers, crates of oranges, orange trees and the packhouse.
import * as THREE from 'three';
import { M, box, cyl, sph, mesh, group, prop, canvasTex, castShadows, font, seeded } from '../engine/kit.js';

export const CONTAINER = { L: 6, H: 2.6, W: 2.5 };

function ribTexture(color, label) {
  return canvasTex(600, 260, (g, w, h) => {
    g.fillStyle = color; g.fillRect(0, 0, w, h);
    for (let x = 6; x < w; x += 14) { g.fillStyle = 'rgba(0,0,0,.13)'; g.fillRect(x, 8, 5, h - 16); g.fillStyle = 'rgba(255,255,255,.1)'; g.fillRect(x + 5, 8, 2, h - 16); }
    g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(0, 0, w, 8); g.fillRect(0, h - 8, w, 8);
    if (label) {
      g.fillStyle = 'rgba(255,255,255,.92)';
      g.font = font(700, 64); g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(label[0], w / 2, h * .42);
      g.font = font(600, 28); g.fillText(label[1], w / 2, h * .7);
    }
  });
}

// A container prop. Origin at the centre of its floor. Doors at the -x end.
export function createContainer({ color = '#e8863a', label = null } = {}) {
  const { root, body } = prop();
  const { L, H, W } = CONTAINER;
  const side = new THREE.MeshStandardMaterial({ map: ribTexture(color, label), roughness: .7 });
  const plain = M(color, { roughness: .7 });
  box(L, H, W, [plain, plain, plain, plain, side, side], 0, 0, 0, body);
  const doorMat = M(new THREE.Color(color).multiplyScalar(.88).getStyle());
  const bar = M('#4a4d55');
  const doors = [1, -1].map(s => {
    const hinge = group(body, -L / 2 - .04, 0, s * W / 2);
    box(.08, H - .1, W / 2 - .02, doorMat, 0, .05, -s * W / 4, hinge);
    for (const k of [.3, .7]) box(.1, H - .4, .06, bar, -.04, .2, -s * W * k / 2, hinge);
    return { hinge, s };
  });
  if (label) box(.3, H - .3, W - .3, M('#e9eaec'), L / 2 + .12, .15, 0, body);   // reefer unit
  castShadows(root);
  return {
    root, body, doors,
    setDoors(open) { doors.forEach(d => { d.hinge.rotation.y = d.s * open * Math.PI * .58; }); },
  };
}

export function createCrate(seed = 1) {
  const { root, body } = prop();
  const wood = canvasTex(256, 160, (g, w, h) => {
    g.fillStyle = '#c99a5b'; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(80,50,20,.35)';
    for (let y = 0; y < h; y += 40) g.fillRect(0, y + 36, w, 4);
    g.fillStyle = 'rgba(255,255,255,.8)'; g.font = font(700, 30); g.textAlign = 'center';
    g.fillText('NAVEL ORANGES', w / 2, h * .62);
  });
  const crateMat = new THREE.MeshStandardMaterial({ map: wood, roughness: .85 });
  const side = M('#b98a4f');
  box(.9, .5, .6, [side, side, M('#a77a44'), side, crateMat, crateMat], 0, 0, 0, body);
  const orangeMat = M('#f39a2b', { unique: true, roughness: .55 });
  const rnd = seeded(seed);
  for (let i = 0; i < 3; i++) for (let k = 0; k < 2; k++) sph(.13, orangeMat, -.27 + i * .27 + (rnd() - .5) * .03, .58, -.13 + k * .26, body, 12, 10);
  castShadows(root);
  const fresh = new THREE.Color('#f39a2b'), spoiled = new THREE.Color('#8a7a45');
  return {
    root, body,
    setFreshness(f) { orangeMat.color.lerpColors(spoiled, fresh, f); },
  };
}

export function createOrange() {
  const g = new THREE.Group();
  const o = sph(.09, M('#f39a2b', { unique: true, roughness: .55 }), 0, 0, 0, g, 14, 10);
  const leaf = sph(.035, M('#4f8a3c'), .02, .09, 0, g, 8, 6);
  leaf.scale.set(1.6, .5, .9);
  castShadows(g);
  g.userData.mat = o.material;
  return g;
}

export function createTree(seed) {
  const { root, body } = prop();
  const rnd = seeded(seed);
  cyl(.35, 2.2, M('#7a5532'), 0, 0, 0, body, 10, .25);
  const canopy = mesh(new THREE.IcosahedronGeometry(1.9 + rnd() * .4, 1), M('#5e8f4e', { flatShading: true }), body, 0, 3.4, 0);
  canopy.scale.y = .85;
  const orange = M('#f39a2b', { roughness: .5 });
  for (let i = 0; i < 9; i++) {
    const a = rnd() * Math.PI * 2, b = rnd() * 1.1;
    const r = 1.95;
    sph(.24, orange, Math.cos(a) * Math.sin(b + .5) * r, 3.4 + Math.cos(b + .5) * r * .85, Math.sin(a) * Math.sin(b + .5) * r, body, 10, 8);
  }
  castShadows(root);
  return { root, body };
}

export function createPackhouse() {
  const { root, body } = prop();
  const wall = M('#e3d6bf'), roof = M('#b4553f');
  box(9, 4, 7, wall, 0, 0, 0, body);
  const shape = new THREE.Shape([new THREE.Vector2(-4.9, 0), new THREE.Vector2(4.9, 0), new THREE.Vector2(0, 2.2)]);
  const rg = new THREE.ExtrudeGeometry(shape, { depth: 7.6, bevelEnabled: false });
  rg.translate(0, 4, -3.8);
  mesh(rg, roof, body);
  box(3, 2.8, .1, M('#6b4a2e'), 1.5, 0, 3.5, body);
  const sign = canvasTex(512, 128, (g, w, h) => {
    g.fillStyle = '#fbf6ee'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#b4553f'; g.font = font(700, 54); g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('CITRUS PACKHOUSE', w / 2, h / 2 + 2);
  });
  mesh(new THREE.PlaneGeometry(5, 1.25), new THREE.MeshStandardMaterial({ map: sign }), body, -1.6, 3.1, 3.52);
  castShadows(root);
  return { root, body };
}

export function createPallet() {
  const g = new THREE.Group();
  const w = M('#b8915c');
  for (const z of [-.6, 0, .6]) box(2.6, .14, .14, w, 0, 0, z, g);
  for (let x = -1.15; x <= 1.2; x += .46) box(.3, .06, 1.5, w, x, .14, 0, g);
  castShadows(g);
  return g;
}
