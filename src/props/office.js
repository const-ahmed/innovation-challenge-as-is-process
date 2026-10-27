// Her office: a cut-away room on the UK side, open to the south and west.
import * as THREE from 'three';
import { M, box, cyl, sph, mesh, group, prop, castShadows, canvasTex, redraw, font } from '../engine/kit.js';

export function createOffice(origin) {
  const { root, body } = prop();
  root.position.set(...origin);
  const wall = M('#efe5d3'), trim = M('#d6c7ad'), wood = M('#a8754a'), floor = M('#d8b88c');

  box(8.4, .23, 7.4, floor, 0, -.2, 0, body);
  box(5, .02, 3.4, M('#e2c08f'), 0, .03, -.6, body);                       // rug
  box(8.4, 3.4, .22, wall, 0, 0, -3.6, body);
  box(.22, 3.4, 7.4, wall, 4.1, 0, 0, body);
  box(8.4, .18, .26, trim, 0, 0, -3.47, body);
  box(.26, .18, 7.4, trim, 3.97, 0, 0, body);
  // window on the east wall
  box(.06, 1.4, 2, M('#bfe0ea', { roughness: .2 }), 3.97, 1.2, .6, body);
  box(.1, .1, 2.1, trim, 3.95, 1.95, .6, body);
  box(.1, 1.5, .1, trim, 3.95, 1.15, .6, body);

  // desk against the back wall
  const desk = group(body, 0, 0, -2.9);
  box(1.9, .06, .85, wood, 0, .72, 0, desk);
  for (const x of [-.88, .88]) for (const z of [-.36, .36]) box(.06, .72, .06, M('#6e4d33'), x, 0, z, desk);
  box(.9, .45, .8, M('#b98a5b'), .45, .27, 0, desk);                     // drawers
  // chair
  const chair = group(body, 0, 0, -1.97);
  box(.52, .07, .5, M('#2f3a52'), 0, .45, 0, chair);
  box(.5, .42, .07, M('#2f3a52'), 0, .52, .24, chair);
  cyl(.04, .42, M('#7b7f88'), 0, .03, 0, chair, 8);
  cyl(.25, .04, M('#7b7f88'), 0, 0, 0, chair, 16);

  // laptop; the lid hinges at its back edge and its screen faces +z
  const laptop = group(body, 0, .78, -3.0);
  box(.56, .025, .38, M('#c3c7cf', { roughness: .35 }), 0, 0, 0, laptop);
  box(.5, .005, .2, M('#8e939c'), 0, .025, .04, laptop);
  const lid = group(laptop, 0, .025, -.19);
  box(.56, .36, .02, M('#c3c7cf', { roughness: .35 }), 0, 0, -.01, lid);
  const screenTex = canvasTex(512, 320, drawScreen('off'));
  const screen = mesh(new THREE.PlaneGeometry(.52, .32), new THREE.MeshBasicMaterial({ map: screenTex }), lid, 0, .18, .002);
  lid.rotation.x = -.22;

  // desk dressing
  cyl(.06, .12, M('#f39a2b'), .7, .78, -2.75, body, 14);
  const lamp = group(body, -.75, .78, -3.1);
  cyl(.1, .03, M('#2d3446'), 0, 0, 0, lamp, 12);
  cyl(.02, .45, M('#2d3446'), 0, 0, 0, lamp, 6);
  const shade = mesh(new THREE.ConeGeometry(.11, .14, 14), M('#e0694e'), lamp, .05, .48, .06);
  shade.rotation.x = .35;
  // papers on the desk
  box(.3, .02, .4, M('#fbf7f0'), -.45, .78, -2.75, body).rotation.y = .2;
  // plant
  cyl(.22, .4, M('#c8643f'), 3.4, 0, -3.1, body, 14, .26);
  for (let i = 0; i < 6; i++) { const l = sph(.2, M('#4f8a3c'), 3.4 + Math.cos(i) * .18, .7 + (i % 3) * .18, -3.1 + Math.sin(i) * .18, body, 10, 8); l.scale.set(.8, 1.3, .8); }
  // shelf with binders
  box(1.6, .06, .35, wood, -2.6, 1.7, -3.3, body);
  ['#2f5597', '#4e8f6a', '#c8463d', '#d4a23c'].forEach((c, i) => box(.12, .38, .3, M(c), -3.2 + i * .16, 1.76, -3.3, body));

  // wall calendar
  const calTex = canvasTex(240, 300, drawCalendar(1));
  mesh(new THREE.PlaneGeometry(.6, .75), new THREE.MeshStandardMaterial({ map: calTex, roughness: .8 }), body, -.9, 2.05, -3.48);
  // wall clock
  const clock = group(body, 1.7, 2.35, -3.47);
  const face = cyl(.32, .05, M('#fbf7f0'), 0, 0, 0, clock, 28);
  face.rotation.x = Math.PI / 2; face.position.set(0, 0, .02);
  const rim = mesh(new THREE.TorusGeometry(.32, .03, 6, 28), M('#2d3446'), clock, 0, 0, .05);
  const hand = (len, w) => { const p = group(clock, 0, 0, .08); box(w, len, .015, M('#17181d'), 0, 0, 0, p).position.y = len / 2; return p; };
  const hourHand = hand(.17, .04), minuteHand = hand(.26, .025);
  rim.castShadow = false;
  castShadows(root);

  return {
    root, body, laptop, lid, screen, screenTex, chair,
    setScreen(state) { redraw(screenTex, drawScreen(state)); },
    setLid(open) { lid.rotation.x = 1.55 + (-.22 - 1.55) * open; },
    setDay(day) { redraw(calTex, drawCalendar(day)); },
    setTime(hours) { hourHand.rotation.z = -hours / 12 * Math.PI * 2; minuteHand.rotation.z = -hours * Math.PI * 2; },
  };
}

function drawCalendar(day) {
  return (g, w, h) => {
    g.fillStyle = '#fbf7f0'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#c8463d'; g.fillRect(0, 0, w, 70);
    g.fillStyle = '#fbf7f0'; g.font = font(700, 40); g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('DAY', w / 2, 37);
    g.fillStyle = '#1c2236'; g.font = font(700, 170);
    g.fillText(String(day), w / 2, 190);
  };
}

const SCREEN = { off: '#1c2236', form: '#fbf7f0', error: '#fbe3df', ok: '#e1f4ea', warn: '#e0f3f2' };
function drawScreen(state) {
  return (g, w, h) => {
    g.fillStyle = SCREEN[state] ?? SCREEN.form; g.fillRect(0, 0, w, h);
    if (state === 'off') return;
    g.fillStyle = '#24335a'; g.fillRect(0, 0, w, 42);
    g.fillStyle = '#fbf7f0'; g.font = font(700, 24); g.textBaseline = 'middle'; g.fillText('Import declaration', 18, 22);
    for (let i = 0; i < 6; i++) {
      g.fillStyle = '#c9c0b0'; g.fillRect(24, 70 + i * 36, 120, 8);
      g.fillStyle = i === 3 && state !== 'form' ? (state === 'error' ? '#c8463d' : state === 'warn' ? '#1aa3a1' : '#2f9e62') : '#e2dbcf';
      g.fillRect(170, 62 + i * 36, 300, 22);
    }
    if (state === 'error') { g.fillStyle = '#c8463d'; g.fillRect(0, h - 40, w, 40); g.fillStyle = '#fff'; g.font = font(700, 22); g.fillText('REJECTED', 18, h - 20); }
    if (state === 'ok') { g.fillStyle = '#2f9e62'; g.fillRect(0, h - 40, w, 40); g.fillStyle = '#fff'; g.font = font(700, 22); g.fillText('ACCEPTED', 18, h - 20); }
  };
}
