// Rose's juice stall: a counter under a striped awning, a juice dispenser and a chalkboard
// whose message the story changes (running low, sold out, fresh today). Local front is +x.
import * as THREE from 'three';
import { M, box, cyl, sph, group, prop, castShadows, canvasTex, redraw, font } from '../engine/kit.js';

const BOARD = {
  open: ['Fresh today', '#fbf7f0'],
  low: ['Running low!', '#ffc24a'],
  soldout: ['Sold out', '#ff8a7a'],
};

export function createStall(name) {
  const { root, body } = prop();
  const wood = M('#b98a5b'), dark = M('#6e4d33'), white = M('#fbf7f0');

  // counter
  box(.9, 1, 2.2, wood, 0, 0, 0, body);
  box(1.05, .07, 2.35, M('#e8d9bf'), 0, 1, 0, body);
  const front = canvasTex(512, 220, (g, w, h) => {
    g.fillStyle = '#e8863a'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#fbf7f0'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = font(700, 88); g.fillText(name.toUpperCase(), w / 2, h / 2 - 16);
    g.font = font(600, 36); g.fillText('FRESH ORANGE JUICE', w / 2, h / 2 + 56);
  });
  box(.02, .62, 2, [new THREE.MeshStandardMaterial({ map: front }), wood, wood, wood, wood, wood], .46, .22, 0, body);

  // juice dispenser and a row of cups on the counter
  const jar = new THREE.MeshStandardMaterial({ color: '#f39a2b', roughness: .25, transparent: true, opacity: .85 });
  cyl(.2, .5, jar, -.15, 1.07, -.6, body, 16);
  cyl(.22, .06, white, -.15, 1.57, -.6, body, 16);
  for (let i = 0; i < 3; i++) createCup(body).position.set(.2, 1.07, -.15 + i * .2);

  // awning on two posts
  for (const z of [-1.05, 1.05]) box(.08, 2.4, .08, dark, -.4, 0, z, body);
  const stripes = canvasTex(256, 64, (g, w, h) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#fbf7f0' : '#e8863a'; g.fillRect(i * w / 8, 0, w / 8 + 1, h); } });
  const awning = box(1.6, .06, 2.5, new THREE.MeshStandardMaterial({ map: stripes, roughness: .8 }), .1, 2.35, 0, body);
  awning.rotation.z = -.22;

  // chalkboard standing on the counter, facing front
  const boardTex = canvasTex(320, 180, () => {});
  const board = box(.05, .42, .75, [new THREE.MeshStandardMaterial({ map: boardTex }), dark, dark, dark, dark, dark], .3, 1.07, .68, body);
  board.rotation.z = .12;
  castShadows(root);

  function setBoard(state) {
    const [text, color] = BOARD[state] ?? BOARD.open;
    redraw(boardTex, (g, w, h) => {
      g.fillStyle = '#2d3446'; g.fillRect(0, 0, w, h);
      g.strokeStyle = '#b98a5b'; g.lineWidth = 10; g.strokeRect(5, 5, w - 10, h - 10);
      g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = font(700, 58); g.fillText(text, w / 2, h / 2);
    });
  }
  setBoard('open');
  return { root, body, setBoard };
}

// A takeaway cup of orange juice, base at its origin.
export function createCup(parent) {
  const cup = group(parent);
  cyl(.06, .16, M('#fbf7f0'), 0, 0, 0, cup, 12, .075);
  cyl(.068, .03, M('#f39a2b'), 0, .15, 0, cup, 12);
  sph(.012, M('#c8463d'), .03, .2, 0, cup, 6, 4);
  box(.012, .12, .012, M('#c8463d'), .03, .15, 0, cup);
  return cup;
}
