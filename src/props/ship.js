// The cargo ship. Local forward is +x; root sits at the waterline.
import * as THREE from 'three';
import { M, box, cyl, mesh, group, prop, castShadows, canvasTex, font, yawFromDir } from '../engine/kit.js';
import { SHIP, WATER_Y } from '../story/places.js';
import { CONTAINER } from './cargo.js';

const STACK_COLORS = ['#3c6e9f', '#4e8f6a', '#b8483e', '#8c8f96', '#d4a23c', '#5b5f9e', '#2f8a8a'];

export function createShip(stage) {
  const { root, body } = prop();
  const bob = group(body);

  const outline = [[-18, -3.6], [-17.4, -4], [11, -4], [15.5, -2.4], [18.2, 0], [15.5, 2.4], [11, 4], [-17.4, 4], [-18, 3.6]];
  const hullShape = s => new THREE.Shape(outline.map(([x, z]) => new THREE.Vector2(x * s, z * s)));
  const extrude = (shape, depth, y) => { const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false }); g.rotateX(-Math.PI / 2); g.translate(0, y, 0); return g; };
  mesh(extrude(hullShape(1), 4.2, -1.6), M('#2b3a5c'), bob);
  mesh(extrude(hullShape(1.012), .55, -.25), M('#c8463d'), bob);
  mesh(extrude(hullShape(1.006), .25, 2.45), M('#f1efe9'), bob);
  mesh(extrude(hullShape(.965), .06, 2.6), M('#8f9aa6'), bob);

  const name = canvasTex(512, 96, (g, w, h) => {
    g.fillStyle = '#2b3a5c'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#f1efe9'; g.font = font(700, 58); g.textAlign = 'center'; g.textBaseline = 'middle';
    g.letterSpacing = '10px';
    g.fillText('ATLANTIC STAR', w / 2, h / 2 + 3);
  });
  const nm = mesh(new THREE.PlaneGeometry(9, 1.7), new THREE.MeshStandardMaterial({ map: name }), bob, 2, 1.1, 4.01);
  nm.renderOrder = 1;

  // bridge, funnel, mast
  const white = M('#f1efe9'), dark = M('#2d3446');
  box(4.6, 6.2, 7, white, -15.2, 2.6, 0, bob);
  box(4.7, .8, 7.1, dark, -15.2, 7.1, 0, bob);
  box(5.4, .3, 9, white, -14.9, 8.8, 0, bob);
  box(3, 1.6, 4.4, white, -15.5, 9.1, 0, bob);
  cyl(.95, 2.8, M('#c8463d'), -17, 9, 0, bob, 18);
  cyl(.97, .5, dark, -17, 11.5, 0, bob, 18);
  cyl(.1, 7, M('#d8d6d0'), 15, 2.6, 0, bob, 8);
  box(.25, .25, 4, M('#d8d6d0'), 15, 8, 0, bob);
  const funnelTop = group(bob, -17, 12.2, 0);

  // deck stacks; bay -2.5, middle row, top tier is left free for her container
  const bays = [-9, -2.5, 4, 10.5], rows = [-2.6, 0, 2.6];
  let k = 0;
  const ribs = color => {
    const tex = canvasTex(256, 120, (g, w, h) => {
      g.fillStyle = color; g.fillRect(0, 0, w, h);
      for (let x = 4; x < w; x += 10) { g.fillStyle = 'rgba(0,0,0,.14)'; g.fillRect(x, 4, 4, h - 8); }
    });
    return new THREE.MeshStandardMaterial({ map: tex, roughness: .7 });
  };
  const mats = STACK_COLORS.map(c => [M(c), ribs(c)]);
  const put = (x, z, tier) => {
    const [plain, side] = mats[k++ % mats.length];
    box(CONTAINER.L, CONTAINER.H, CONTAINER.W - .1, [plain, plain, plain, plain, side, side], x, 2.65 + tier * CONTAINER.H, z, bob);
  };
  for (const x of bays) for (const z of rows) put(x, z, 0);
  for (const z of rows) put(-9, z, 1);
  put(4, -2.6, 1); put(4, 0, 1); put(10.5, 2.6, 1); put(-2.5, -2.6, 1);

  const slot = group(bob, ...SHIP.slotLocal);
  castShadows(root);

  const curve = new THREE.CatmullRomCurve3(SHIP.route.map(([x, z]) => new THREE.Vector3(x, WATER_Y, z)), false, 'centripetal');
  const state = { progress: 0, speed: 0, last: 0 };
  const tan = new THREE.Vector3();

  function setProgress(t) {
    state.progress = Math.max(0, Math.min(1, t));
    curve.getPointAt(state.progress, root.position);
    curve.getTangentAt(Math.min(.999, Math.max(.001, state.progress)), tan);
    root.rotation.y = yawFromDir(tan.x, tan.z);
  }
  setProgress(0);

  const stern = new THREE.Vector3();
  let foamT = 0;
  stage.onTick((t, dt) => {
    bob.rotation.x = Math.sin(t * .9) * .018;
    bob.rotation.z = Math.sin(t * .63) * .008;
    bob.position.y = Math.sin(t * 1.1) * .07;
    const moved = Math.abs(state.progress - state.last);
    state.last = state.progress;
    state.speed = dt > 0 ? moved / dt : 0;
    foamT -= dt;
    if (state.speed > .002 && foamT <= 0 && stage.fx) {
      // two trails from the stern quarters make a V behind the ship
      foamT = .14;
      for (const side of [-1, 1]) {
        stern.set(-17.6, 0, side * 3.3).applyMatrix4(root.matrixWorld);
        stern.y = WATER_Y + .05;
        stage.fx.foam(stern, { yaw: root.rotation.y, side });
      }
    }
  });

  return { root, body, slot, funnelTop, curve, setProgress, get progress() { return state.progress; } };
}
