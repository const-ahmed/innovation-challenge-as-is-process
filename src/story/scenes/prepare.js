// Scene 1 — Preparing the shipment.
import * as THREE from 'three';
import { ease, lerp } from '../../engine/tween.js';
import { CAM } from '../cameras.js';
import { LINES } from '../script.js';
import { craneTransfer, hornPuff } from '../actions.js';
import { QUAY_Y, US } from '../places.js';

const L = LINES.prepare;
const LABEL = '1 · Preparing the shipment';

export default {
  id: 'prepare',

  init({ world: w, stage, form }) {
    w.reset();
    w.crates.forEach(c => { c.root.visible = false; });
    form.hide();
    form.reset();
    stage.jumpCamera(CAM.officeIntro);
  },

  async run(ctx) {
    const { world: w, ui, stage } = ctx;
    const her = w.her;

    ui.caption(L.intro, { label: LABEL });
    her.setExpression('happy');
    await ctx.wait(900);

    // on the phone to the grower
    w.phone.visible = true;
    her.pose('phone', { duration: 500 });
    await ctx.wait(500);
    her.flags.talking = true;
    const call = ui.bubble(her.headTop, 'One container of navel oranges, shipping this week. Perfect!', { speaker: 'Importer' });
    await ctx.camera(CAM.office, { duration: 3000 });
    await ctx.wait(800);
    call.close();
    her.flags.talking = false;
    her.setExpression('happy');
    w.phone.visible = false;
    her.pose('stand', { duration: 400 });

    // paperwork pops up around her
    ui.caption(L.docs);
    const base = her.root.position;
    const spots = [[-1, 2.35, .2], [0, 2.75, .45], [1, 2.35, .2]];
    w.docs.forEach((d, i) => {
      d.root.position.set(base.x + spots[i][0], spots[i][1], base.z + spots[i][2]);
      d.root.rotation.set(0, -.45, (i - 1) * -.12);
      d.root.visible = true;
      d.root.scale.setScalar(.001);
      ctx.tween({ delay: i * 260, duration: 520, easing: ease.outBack, onUpdate: t => d.root.scale.setScalar(Math.max(.001, t)) });
    });
    her.pose('holdUp', { duration: 450 });
    her.setExpression('happy');
    await ctx.wait(1700);
    her.pose('wave', { duration: 300 });
    her.flags.waving = true;

    // the documents fly to the USA while the camera pulls out to the whole map
    const dest = new THREE.Vector3(US.containerDoor[0], 1.7, US.containerDoor[1]);
    const flights = w.docs.map((d, i) => {
      const p0 = d.root.position.clone(), p2 = dest.clone().add(new THREE.Vector3(0, i * .6, (i - 1) * .9));
      const p1 = p0.clone().lerp(p2, .5).setY(220);
      const r0 = d.root.rotation.clone();
      return ctx.play({
        delay: 300 + i * 220, duration: 3600, easing: ease.inOutCubic,
        onUpdate: t => {
          const a = p0.clone().lerp(p1, t), b = p1.clone().lerp(p2, t);
          d.root.position.copy(a.lerp(b, t));
          d.root.scale.setScalar(1 + Math.sin(Math.PI * t) * 14);
          d.root.rotation.set(r0.x + Math.sin(t * 9) * .3, r0.y + t * Math.PI * 2, r0.z + Math.sin(t * 7) * .25);
        },
      });
    });
    const pull = ctx.camera(CAM.world, { duration: 2200 });
    await ctx.wait(500);
    her.flags.waving = false;
    her.pose('stand', { duration: 300 });
    await pull;
    await ctx.camera(CAM.usPort, { duration: 1900 });
    await ctx.all(flights);
    await ctx.all(w.docs.map(d => ctx.play({ duration: 380, easing: ease.inBack, onUpdate: t => d.root.scale.setScalar(Math.max(.001, 1 - t)), onComplete: () => { d.root.visible = false; } })));

    // packed at the packhouse, then into the container
    ui.caption(L.pack);
    w.crates.forEach((c, i) => {
      c.root.visible = true;
      c.root.scale.setScalar(.001);
      const y0 = c.home.y;
      ctx.tween({
        delay: i * 140, duration: 720,
        onUpdate: t => { c.root.position.y = y0 + 6 * (1 - ease.outCubic(t)); c.root.scale.setScalar(Math.max(.001, ease.outBack(Math.min(1, t * 1.15)))); },
      });
    });
    await ctx.wait(6 * 140 + 800);
    await ctx.play({ duration: 650, easing: ease.outCubic, onUpdate: t => w.container.setDoors(t) });
    const door = new THREE.Vector3(US.containerDoor[0] + .4, QUAY_Y + .4, US.containerDoor[1]);
    for (const [i, c] of [...w.crates].reverse().entries()) {
      const from = c.root.position.clone();
      ctx.tween({
        delay: i * 220, duration: 620, easing: ease.inOutQuad,
        onUpdate: t => {
          c.root.position.lerpVectors(from, door, t);
          c.root.position.y += Math.sin(Math.PI * t) * 1.6;
          if (t > .8) c.root.scale.setScalar(Math.max(.001, (1 - t) * 5));
        },
        onComplete: () => { c.root.visible = false; },
      });
    }
    await ctx.wait(6 * 220 + 700);
    await ctx.play({ duration: 550, easing: ease.inOutCubic, onUpdate: t => w.container.setDoors(1 - t) });

    // crane lifts it aboard
    ui.caption(L.load);
    await ctx.camera(CAM.usLoad, { duration: 1500 });
    await craneTransfer(ctx, w.usCrane, w.ship.slot);
    hornPuff(ctx);
    await ctx.wait(400);
    hornPuff(ctx);
    await ctx.wait(1400);
    return 'journey';
  },
};
