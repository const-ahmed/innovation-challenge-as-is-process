// Builds every prop, registers what can be inspected, and can put the whole world
// back into a known state so any scene can start cold.
import * as THREE from 'three';
import { group } from '../engine/kit.js';
import { buildTerrain } from '../props/terrain.js';
import { createShip } from '../props/ship.js';
import { createContainer, createCrate, createTree, createPackhouse, createPallet, createOrange } from '../props/cargo.js';
import { createCrane, createTruck, createCheckpoint, createVan } from '../props/port.js';
import { createOffice } from '../props/office.js';
import { createDocument, DOCS } from '../props/documents.js';
import { Character } from '../props/character.js';
import { Assistant } from '../props/assistant.js';
import { Fx } from '../props/fx.js';
import { createRoute } from '../props/route.js';
import { createStall, createCup } from '../props/stall.js';
import { US, UK, OFFICE, QUAY_Y } from './places.js';
import { INFO, PEOPLE, BUSINESS } from './script.js';

export function buildWorld(stage) {
  const scene = stage.scene;
  stage.fx = new Fx(stage);
  const w = { stage, fx: stage.fx };

  w.terrain = buildTerrain(stage);

  // USA: grove, packhouse, pallet of crates, crane
  const grove = group(scene);
  const G = US.grove;
  let seed = 3;
  for (let c = 0; c < G.cols; c++) for (let r = 0; r < G.rows; r++) {
    const t = createTree(seed++);
    t.root.position.set(G.x0 + c * G.gap + (r % 2) * 2.5, 0, G.z0 + r * G.gap);
    grove.add(t.root);
  }
  stage.register(grove, INFO.grove, { body: grove, lift: 0 });
  w.packhouse = createPackhouse();
  w.packhouse.root.position.set(US.packhouse[0], 0, US.packhouse[1]);
  scene.add(w.packhouse.root);
  stage.register(w.packhouse.root, INFO.packhouse, { lift: .4 });

  const pallet = createPallet();
  pallet.position.set(US.pallet[0], QUAY_Y, US.pallet[1]);
  scene.add(pallet);
  w.crates = [];
  for (let i = 0; i < 6; i++) {
    const c = createCrate(i + 1);
    c.home = new THREE.Vector3(US.pallet[0] + (i % 3 - 1) * .95, QUAY_Y + .2 + Math.floor(i / 3) * .72, US.pallet[1]);
    scene.add(c.root);
    stage.register(c.root, INFO.crate, { lift: .25 });
    w.crates.push(c);
  }

  const van = createVan({ color: '#3d7fa6', lines: ['SUNRISE CITRUS CO.', 'Exporters · Florida'] });
  van.root.position.set(US.van[0], QUAY_Y, US.van[1]);
  van.root.rotation.y = 0;
  scene.add(van.root);
  stage.register(van.root, INFO.exporter, { lift: .3 });

  w.usCrane = createCrane('#e0a43a');
  w.usCrane.root.position.set(US.crane[0], QUAY_Y, US.crane[1]);
  scene.add(w.usCrane.root);
  stage.register(w.usCrane.root, INFO.crane, { lift: .6 });

  // the ship and her container
  w.ship = createShip(stage);
  scene.add(w.ship.root);
  stage.register(w.ship.root, INFO.ship, { lift: .8, ringY: -.9 });
  w.route = createRoute(w.ship.curve);
  scene.add(w.route.root);

  w.container = createContainer({ color: '#e8863a', label: ['ORANGES', 'FRESH · KEEP COOL'] });
  scene.add(w.container.root);
  stage.register(w.container.root, INFO.container, { lift: .4 });

  // UK: crane, truck, checkpoint, office
  w.ukCrane = createCrane('#c8463d');
  w.ukCrane.root.position.set(UK.crane[0], QUAY_Y, UK.crane[1]);
  scene.add(w.ukCrane.root);
  stage.register(w.ukCrane.root, INFO.crane, { lift: .6 });

  w.truck = createTruck(stage, UK.truckRoute);
  scene.add(w.truck.root);
  stage.register(w.truck.root, INFO.truck, { lift: .4 });
  w.truckStop = w.truck.progressAtZ(UK.truckStopZ);

  w.checkpoint = createCheckpoint(UK.checkpoint);
  scene.add(w.checkpoint.root);
  stage.register(w.checkpoint.root, INFO.checkpoint, { lift: .3 });

  w.office = createOffice(OFFICE.origin);
  scene.add(w.office.root);
  stage.register(w.office.laptop, INFO.laptop, { body: w.office.laptop, lift: 0 });

  // sample crate the border officers pull out during the hold
  w.sample = createCrate(11);
  w.sample.root.position.set(UK.sample[0], QUAY_Y, UK.sample[1]);
  w.sample.root.rotation.y = .4;
  scene.add(w.sample.root);
  stage.register(w.sample.root, INFO.sample, { lift: .2 });

  // delivered crate at the office
  w.delivered = createCrate(21);
  scene.add(w.delivered.root);
  stage.register(w.delivered.root, INFO.crate, { lift: .2 });

  w.docs = DOCS.map(d => {
    const doc = createDocument(d);
    scene.add(doc.root);
    stage.register(doc.root, INFO[d.id], { lift: .15 });
    return doc;
  });

  // characters
  w.her = new Character(stage);
  scene.add(w.her.root);
  stage.register(w.her.root, INFO.her, { lift: .12 });
  w.phone = new THREE.Mesh(new THREE.BoxGeometry(.05, .1, .015), new THREE.MeshStandardMaterial({ color: '#1c2236' }));
  w.phone.position.set(0, -.04, .05);
  w.phone.castShadow = true;
  w.her.handR.add(w.phone);
  w.orange = createOrange();
  w.her.handR.add(w.orange);
  w.orange.position.set(0, -.06, .08);

  w.bot = new Assistant(stage);
  scene.add(w.bot.root);
  stage.register(w.bot.root, INFO.assistant, { lift: .1 });

  // the other people: the exporter and shipping agent in Florida, Rose's customers in the UK
  const person = (look, info) => {
    const p = new Character(stage, look);
    scene.add(p.root);
    stage.register(p.root, info, { lift: .12 });
    return p;
  };
  // a document held up in the right hand, shown when they hand it over
  const holding = (p, doc) => {
    const d = createDocument(doc);
    p.handR.add(d.root);
    d.root.scale.setScalar(.42);
    d.root.position.set(0, .2, .07);
    return d;
  };
  w.exporter = person({ top: '#3d7fa6', bottom: '#c9b48c', hair: '#2a1d16', skin: '#9a6440', hairStyle: 'short', hat: '#f3f1ea' }, INFO.exporter);
  w.exporterDoc = holding(w.exporter, DOCS.find(d => d.id === 'phyto'));
  w.agent = person({ top: '#e8d23a', bottom: '#2c3550', hair: '#d9b27c', skin: '#f0c8a8', hairStyle: 'long', hat: '#fbf7f0' }, INFO.agent);
  w.agentDoc = holding(w.agent, DOCS.find(d => d.id === 'lading'));
  w.customers = [
    { top: '#4e8f6a', bottom: '#3b3f4a', hair: '#1d1a17', skin: '#8d5a3b', hairStyle: 'short' },
    { top: '#d4a23c', bottom: '#2c3550', hair: '#a8754a', skin: '#f0c8a8', hairStyle: 'long' },
    { top: '#7d5ba6', bottom: '#25262c', hair: '#5a4334', skin: '#c98d6a', hairStyle: 'short', hat: '#c8463d' },
  ].map(look => {
    const c = person(look, INFO.customers);
    c.cup = createCup(c.handR);
    c.cup.position.set(0, -.04, .07);
    return c;
  });
  w.stall = createStall(BUSINESS);
  scene.add(w.stall.root);
  stage.register(w.stall.root, INFO.stall, { lift: .2 });

  /* ---------- helpers ---------- */
  const officePoint = (lx, lz, y = 0) => new THREE.Vector3(OFFICE.origin[0] + lx, y, OFFICE.origin[2] + lz);
  w.officePoint = officePoint;
  w.stall.root.position.copy(officePoint(...OFFICE.stall));

  w.containerTo = where => {
    const c = w.container;
    c.root.rotation.set(0, 0, 0);
    if (where === 'usQuay') { scene.add(c.root); c.root.position.set(US.containerOnQuay[0], QUAY_Y, US.containerOnQuay[1]); }
    if (where === 'ship') { w.ship.slot.add(c.root); c.root.position.set(0, 0, 0); }
    if (where === 'truck') { w.truck.mount.add(c.root); c.root.position.set(0, 0, 0); }
  };

  w.sitAtDesk = () => {
    const p = officePoint(OFFICE.seat[0], OFFICE.seat[1]);
    w.her.placeAt(p.x, 0, p.z, Math.PI);
    w.her.pose('sit', { duration: 0 });
  };
  w.serveAtStall = () => {
    const p = officePoint(...OFFICE.server);
    w.her.placeAt(p.x, 0, p.z, Math.PI / 2 - .35);
    w.her.pose('stand', { duration: 0 });
  };
  // The customers queue at the stall; `mood` sets how they look (waiting, happy, let down).
  w.setCustomers = mood => {
    w.customers.forEach((c, i) => {
      const [x, z, yaw] = OFFICE.customers[i], p = officePoint(x, z);
      c.placeAt(p.x, 0, p.z, yaw);
      c.cup.visible = mood === 'happy';
      c.pose(mood === 'happy' ? (i === 1 ? 'cheer' : 'holdUp') : mood === 'sad' ? 'slump' : 'stand', { duration: 0 });
      c.setExpression(mood === 'happy' ? 'happy' : mood === 'sad' ? 'sad' : 'neutral', 0);
    });
    w.stall.setBoard({ waiting: 'low', happy: 'open', sad: 'soldout' }[mood] ?? 'open');
  };
  w.standInOffice = () => {
    const p = officePoint(OFFICE.stand[0], OFFICE.stand[1]);
    w.her.placeAt(p.x, 0, p.z, -.45);
    w.her.pose('stand', { duration: 0 });
  };

  // Everything back to the opening state.
  w.reset = () => {
    stage.setMood({ bg: '#f4eadb', light: 1 });
    w.terrain.setCloudTone('#fbf7f0');
    w.ship.setProgress(0);
    w.route.reveal(0);
    w.route.setOpacity(0);
    w.containerTo('usQuay');
    w.container.setDoors(0);
    w.container.body.position.y = 0;
    w.usCrane.set(-.25, 10.5);
    w.ukCrane.set(-.25, 10.5);
    w.crates.forEach(c => { c.root.visible = true; c.root.position.copy(c.home); c.root.scale.setScalar(1); c.root.rotation.set(0, 0, 0); });
    w.truck.setProgress(0);
    w.checkpoint.setBarrier(0);
    w.checkpoint.setLamp('off');
    w.sample.root.visible = false;
    w.sample.setFreshness(1);
    w.delivered.root.visible = false;
    w.delivered.setFreshness(1);
    w.docs.forEach(d => { d.root.visible = false; d.root.scale.setScalar(1); d.root.rotation.set(0, 0, 0); });
    w.office.setScreen('off');
    w.office.setLid(0);
    w.office.setDay(1);
    w.office.setTime(9);
    w.bot.root.visible = false;
    w.bot.setHappy(false);
    w.bot.armR.rotation.x = 0;
    w.bot.body.rotation.set(0, 0, 0);
    w.phone.visible = false;
    w.orange.visible = false;
    w.orange.userData.mat.color.set('#f39a2b');
    Object.keys(w.her.flags).forEach(k => { w.her.flags[k] = false; });
    w.her.setExpression('neutral', 0);
    w.standInOffice();
    w.exporter.placeAt(US.exporter[0], QUAY_Y, US.exporter[1], 2.8);
    w.agent.placeAt(US.agent[0], QUAY_Y, US.agent[1], 2.75);
    for (const p of [w.exporter, w.agent]) { p.pose('stand', { duration: 0 }); p.setExpression('happy', 0); }
    w.exporterDoc.root.visible = false;
    w.agentDoc.root.visible = false;
    w.setCustomers('waiting');
    stage.select(null);
  };

  return w;
}

// Name labels that stay on screen (the overlay is built after the world).
export function labelWorld(w, ui) {
  const people = { minZoom: 14 };
  ui.label(w.her.root, PEOPLE.rose, people);
  ui.label(w.exporter.root, PEOPLE.exporter, people);
  ui.label(w.agent.root, PEOPLE.agent, people);
  ui.label(w.customers[1].root, PEOPLE.customers, people);
  ui.label(w.bot.root, PEOPLE.checker, { ...people, offset: [0, -.3, 0] });
  const cab = new THREE.Object3D();
  cab.position.set(4.15, 3.5, 0);
  w.truck.body.add(cab);
  ui.label(cab, PEOPLE.truck, { above: true, minZoom: 10 });
  ui.label(w.checkpoint.booth, PEOPLE.border, { above: true, offset: [0, 4.8, 0], minZoom: 10 });
}
