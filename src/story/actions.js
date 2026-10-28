// Reusable choreography shared by several scenes.
import * as THREE from 'three';
import { ease, lerp } from '../engine/tween.js';
import { OFFICE, QUAY_Y, UK } from './places.js';
import { CAM } from './cameras.js';
import { FORM, VOYAGE } from './script.js';

const C_H = 2.6, SAFE = 10.5;

export async function craneTo(ctx, crane, { z, y }, duration) {
  const z0 = crane.state.z, y0 = crane.state.y;
  await ctx.play({ duration, easing: ease.inOutCubic, onUpdate: t => crane.set(lerp(z0, z ?? z0, t), lerp(y0, y ?? y0, t)) });
}

// Lift the container from wherever it is and drop it onto `dest` (an Object3D).
// The crane works in its own local frame, so the pick-up and drop points are measured there.
export async function craneTransfer(ctx, crane, dest) {
  const c = ctx.world.container.root;
  const local = o => crane.root.worldToLocal(o.getWorldPosition(new THREE.Vector3()));
  const pick = local(c), drop = local(dest);
  await craneTo(ctx, crane, { z: pick.z }, 900);
  await craneTo(ctx, crane, { y: pick.y + C_H }, 900);
  crane.spreader.attach(c);
  await ctx.wait(200);
  await craneTo(ctx, crane, { y: SAFE }, 1000);
  await craneTo(ctx, crane, { z: drop.z }, 1600);
  await craneTo(ctx, crane, { y: drop.y + C_H }, 1000);
  dest.attach(c);
  const p0 = c.position.clone(), r0 = c.rotation.clone();
  await ctx.play({ duration: 200, onUpdate: t => { c.position.lerpVectors(p0, new THREE.Vector3(), t); c.rotation.set(r0.x * (1 - t), r0.y * (1 - t), r0.z * (1 - t)); } });
  await craneTo(ctx, crane, { y: SAFE }, 800);
}

export function sail(ctx, from, to, duration, easing = ease.inOutSine) {
  const ship = ctx.world.ship;
  return ctx.tween({ duration, easing, onUpdate: t => ship.setProgress(lerp(from, to, t)) });
}

export function drive(ctx, from, to, duration, easing = ease.inOutCubic) {
  const truck = ctx.world.truck;
  return ctx.tween({ duration, easing, onUpdate: t => truck.setProgress(lerp(from, to, t)) });
}

export function hornPuff(ctx) {
  const p = ctx.world.ship.funnelTop.getWorldPosition(new THREE.Vector3());
  ctx.world.fx.puff(p, { count: 5, size: 1.1, rise: 6 });
}

// The state at the moment the branch happens: form complete, code still wrong, ship mid-ocean.
export function setBranchState(ctx) {
  const { world: w, form, stage } = ctx;
  w.reset();
  w.crates.forEach(c => { c.root.visible = false; });
  w.containerTo('ship');
  w.ship.setProgress(.5);
  w.sitAtDesk();
  w.her.pose('type', { duration: 0 });
  w.office.setLid(1);
  w.office.setScreen('form');
  w.office.setTime(14);
  form.reset();
  form.fill(FORM.at(-1).id);
  form.show();
  stage.jumpCamera(CAM.shoulder);
}

// The crossing as a map shot: pull out over the Atlantic, sail the ship from `from` to `to`
// (0–1 of the route) while the route line grows behind it and the day counter ticks.
// The line and counter fade away as the next shot starts.
export async function crossing(ctx, from, to, duration) {
  const { world: w, ui } = ctx;
  const day = p => 1 + Math.round(p * (VOYAGE.days - 1));
  const show = p => ui.sea(true, { day: day(p), progress: p, from: VOYAGE.from, to: VOYAGE.to });
  w.route.reveal(from);
  ctx.tween({ duration: 900, onUpdate: t => w.route.setOpacity(t) });
  show(from);
  await ctx.camera(CAM.atlantic, { duration: 2400 });
  await ctx.play({ duration, easing: ease.inOutSine, onUpdate: t => { const p = lerp(from, to, t); w.ship.setProgress(p); w.route.reveal(p); show(p); } });
  await ctx.wait(700);
  ui.sea(false);
  ctx.tween({ duration: 1200, onUpdate: t => w.route.setOpacity(1 - t) });
}

export async function sitDown(ctx) {
  const her = ctx.world.her, seat = ctx.world.officePoint(OFFICE.seat[0], OFFICE.seat[1]);
  await ctx.do(her.walkTo(seat.x, seat.z + .55, { face: Math.PI }));
  const z0 = her.root.position.z;
  her.pose('sit', { duration: 520 });
  await ctx.play({ duration: 520, easing: ease.inOutCubic, onUpdate: t => { her.root.position.z = lerp(z0, seat.z, t); } });
}

export async function standUp(ctx) {
  const her = ctx.world.her, z0 = her.root.position.z;
  her.pose('stand', { duration: 450 });
  await ctx.play({ duration: 450, easing: ease.inOutCubic, onUpdate: t => { her.root.position.z = z0 + t * .5; } });
}

// One night passes: dim to dusk, run the office clock, come back to `day`.
export async function nightPasses(ctx, { day, light, onMidnight }) {
  const { stage, world } = ctx;
  ctx.tween({ duration: 2300, onUpdate: t => world.office.setTime(9 + t * 24) });
  await ctx.do(stage.tweenMood({ bg: '#2b3346', light: .32 }, { duration: 1100 }));
  onMidnight?.();
  await ctx.do(stage.tweenMood({ bg: day, light }, { duration: 1100 }));
}

export async function deliver(ctx, { fresh }) {
  const { world: w, stage } = ctx;
  const door = w.officePoint(OFFICE.door[0], OFFICE.door[1]);
  w.her.placeAt(door.x, 0, door.z, -1.6);
  w.her.pose('stand', { duration: 0 });
  w.office.setLid(1);
  await ctx.camera(CAM.delivery, { duration: 1800 });
  const doors = w.container;
  await ctx.play({ duration: 700, easing: ease.outCubic, onUpdate: t => doors.setDoors(t) });

  const crate = w.delivered;
  crate.setFreshness(fresh);
  const inside = w.container.root.localToWorld(new THREE.Vector3(-2.2, 0, 0));
  const out = new THREE.Vector3(UK.crateOut[0], QUAY_Y, UK.crateOut[1]);
  crate.root.position.copy(inside);
  crate.root.rotation.set(0, Math.PI / 2, 0);
  crate.root.visible = true;
  await ctx.play({
    duration: 900, easing: ease.inOutCubic,
    onUpdate: t => { crate.root.position.lerpVectors(inside, out, t); crate.root.position.y = lerp(inside.y, out.y, t) + Math.sin(Math.PI * t) * .8; },
  });
  await ctx.do(w.her.walkTo(UK.meet[0], UK.meet[1], { face: -1.75 }));
}

// How deliver() leaves things, posed instantly (the storyboard's picture of a delivery scene).
export function delivered(ctx, { fresh, orange, pose, expression }) {
  const { world: w, stage } = ctx;
  w.office.setLid(1);
  w.container.setDoors(1);
  w.delivered.setFreshness(fresh);
  w.delivered.root.position.set(UK.crateOut[0], QUAY_Y, UK.crateOut[1]);
  w.delivered.root.rotation.set(0, Math.PI / 2, 0);
  w.delivered.root.visible = true;
  w.her.placeAt(UK.meet[0], 0, UK.meet[1], -1.75);
  w.her.pose(pose, { duration: 0 });
  w.her.setExpression(expression, 0);
  w.orange.userData.mat.color.set(orange);
  w.orange.visible = true;
  stage.jumpCamera({ ...CAM.delivery, span: 7, target: [UK.meet[0] - .6, 1.4, UK.meet[1]] });
}
