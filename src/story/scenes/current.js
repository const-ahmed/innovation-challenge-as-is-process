// Scenario A — Current system: the outdated code goes through, gets rejected, and the
// container waits at the border.
import * as THREE from 'three';
import { ease, lerp } from '../../engine/tween.js';
import { CAM } from '../cameras.js';
import { LINES, REJECTION, OUTCOMES } from '../script.js';
import { setBranchState, sail, craneTransfer, drive, nightPasses, standUp, deliver, crossing } from '../actions.js';
import { OFFICE } from '../places.js';

const L = LINES.a;
const LABEL = 'A · Current system';
const GREY = '#e2e0dc', GREYER = '#d9d8d6';

export default {
  id: 'a',

  init(ctx) { setBranchState(ctx); },

  async run(ctx) {
    const { world: w, ui, form, stage, director } = ctx;
    const her = w.her;

    ui.caption(L.submit, { label: LABEL });
    stage.tweenMood({ bg: GREY, light: .94 }, { duration: 1800 });
    w.terrain.setCloudTone('#d6d8dc');
    await ctx.wait(700);
    await form.clickSubmit(ctx.wait);
    form.status('Submitted', 'pending');
    form.stamp('Submitted', 'ink');
    her.setExpression('happy');
    her.pose('sitNod', { duration: 400 });
    await ctx.wait(1800);
    form.hide();

    // days later, the ship nears the UK
    ui.caption(L.nearing);
    await crossing(ctx, .5, .84, 5000);

    // the rejection lands
    ui.caption(L.rejected);
    stage.tweenMood({ bg: GREYER, light: .88 }, { duration: 1500 });
    await ctx.camera(CAM.shoulder, { duration: 2400, arc: .6 });
    w.office.setScreen('error');
    form.show();
    form.status('Rejected', 'bad');
    form.banner('bad', REJECTION.title, REJECTION.body);
    her.setExpression('surprised');
    ui.sticker(her.headTop, '!', { tone: 'red', life: 1400 });
    her.pose('type', { duration: 300, extra: { 'head.x': .3, 'spine.x': .2 } });
    await ctx.wait(1500);
    her.setExpression('confused');
    her.pose('sitThink', { duration: 500 });
    for (let i = 0; i < 3; i++) { ui.sticker(her.headTop, '?', { tone: 'ink', life: 1500, dx: (i - 1) * 26 }); await ctx.wait(380); }
    await ctx.wait(600);

    // she hunts for an answer while the ship keeps coming
    ui.caption(L.search);
    const arriving = sail(ctx, .84, 1, 9000, ease.inOutSine);
    her.pose('type', { duration: 300 });
    her.flags.typing = true;
    await form.search(REJECTION.searches, ctx.wait);
    her.flags.typing = false;
    her.setExpression('worried');
    her.pose('sitFacepalm', { duration: 500 });
    await ctx.wait(1400);
    form.hide();
    await ctx.do(arriving.done);

    // arrival: unloaded onto a truck, which then stops at the barrier
    ui.caption(L.arrive);
    await ctx.camera(CAM.ukPort, { duration: 2400, arc: .4 });
    await craneTransfer(ctx, w.ukCrane, w.truck.mount);
    ui.caption(L.hold);
    w.checkpoint.setLamp('red');
    ctx.camera(CAM.checkpoint, { duration: 2600 });
    await ctx.do(drive(ctx, 0, w.truckStop, 3600).done);
    const held = ui.tag(w.container.root, '<b>Held at the border</b><span>Declaration rejected</span>', { tone: 'red', offset: [0, 3.4, 0] });
    w.sample.root.visible = true;
    w.sample.root.scale.setScalar(.001);
    await ctx.play({ duration: 500, easing: ease.outBack, onUpdate: t => w.sample.root.scale.setScalar(Math.max(.001, t)) });
    ui.hold(true, { day: 1, fresh: 1 });
    await ctx.wait(1200);

    // time passes: three nights, one of them back at the office
    ui.caption(L.days);
    let day = 1, fresh = 1;
    const nextDay = () => {
      day += 1;
      const f0 = fresh; fresh = Math.max(.3, fresh - .22);
      ctx.tween({ duration: 900, onUpdate: t => { const f = lerp(f0, fresh, t); w.sample.setFreshness(f); ui.hold(true, { day, fresh: f }); } });
      w.office.setDay(day);
    };
    await nightPasses(ctx, { day: GREYER, light: .88, onMidnight: nextDay });

    held.close();
    await ctx.camera(CAM.officePace, { duration: 2000, arc: .5 });
    await standUp(ctx);
    her.setExpression('angry');
    w.phone.visible = true;
    her.pose('phone', { duration: 400 });
    her.flags.talking = true;
    const rant = ui.bubble(her.headTop, 'It’s still held? What exactly is wrong with it?', { speaker: 'Importer', tone: 'red' });
    const desk = w.officePoint(OFFICE.seat[0], OFFICE.seat[1] + .55);
    const pacing = (async () => {
      await ctx.do(her.walkTo(desk.x - 2.2, desk.z + 1.4, { speed: 1.2 }));
      her.pose('phone', { duration: 250 });
      await ctx.do(her.walkTo(desk.x + 1.6, desk.z + 1.2, { speed: 1.2 }));
      her.pose('phone', { duration: 250 });
    })().catch(() => {});   // a skipped scene is caught by the ctx.do below
    ui.sticker(her.headTop, scribble(), { tone: 'red', life: 2200 });
    await nightPasses(ctx, { day: GREYER, light: .88, onMidnight: nextDay });
    await ctx.do(pacing);
    rant.close();
    her.flags.talking = false;
    w.phone.visible = false;
    her.faceTo(-.4);
    her.setExpression('angry');
    her.pose('handsOnHead', { duration: 450 });
    her.flags.stomping = true;
    ui.sticker(her.headTop, scribble(), { tone: 'red', life: 2000 });
    await ctx.wait(1600);
    her.flags.stomping = false;
    her.pose('slump', { duration: 600 });
    her.setExpression('sad');
    await ctx.wait(900);

    const held2 = ui.tag(w.container.root, '<b>Still held</b><span>Storage charges adding up</span>', { tone: 'red', offset: [0, 3.4, 0] });
    await ctx.camera(CAM.checkpoint, { duration: 2000, arc: .5 });
    await nightPasses(ctx, { day: GREYER, light: .88, onMidnight: nextDay });

    // finally released, late
    ui.caption(L.release);
    held2.close();
    ui.hold(true, { day: 4, fresh, label: 'Released · Day 4' });
    w.checkpoint.setLamp('amber');
    await ctx.wait(600);
    w.checkpoint.setLamp('green');
    await ctx.play({ duration: 1400, easing: ease.inOutCubic, onUpdate: t => w.checkpoint.setBarrier(t) });
    ui.tag(w.container.root, '<b>Released</b><span>3 days late</span>', { tone: 'amber', offset: [0, 3.4, 0] });
    stage.tweenMood({ bg: GREY, light: .94 }, { duration: 1500 });
    await ctx.camera({ span: 34, azimuth: -.55, elevation: .55, follow: w.truck.root, offset: [0, 2, 0] }, { duration: 1200 });
    await ctx.do(drive(ctx, w.truckStop, 1, 5200).done);
    ui.clearPins();
    ui.hold(false);

    // a crate of tired oranges
    ui.caption(L.late);
    await deliver(ctx, { fresh });
    w.orange.userData.mat.color.set('#9b8247');
    w.orange.visible = true;
    her.setExpression('sad');
    her.pose('holdLow', { duration: 600 });
    await ctx.wait(1400);
    ui.sticker(her.headTop, '…', { tone: 'ink', life: 1800 });
    await ctx.wait(1600);

    ui.endCard('a', OUTCOMES.a, {
      other: OUTCOMES.b,
      onNext: () => director.play('b', { from: 'a' }),
      onReplay: () => director.play('prepare'),
    });
    return null;
  },
};

function scribble() {
  return `<svg viewBox="0 0 40 30" width="40" height="30" aria-hidden="true"><path d="M4 18c4-10 10 6 14-4s8 8 12-2 6 6 6 2M6 24c6-6 8 2 12-2s8 4 14-2" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>`;
}
