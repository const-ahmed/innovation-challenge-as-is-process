// Scenario B — With pre-submission checks: the assistant taps her shoulder, the code is
// fixed before submission, and the container clears on arrival.
import * as THREE from 'three';
import { ease } from '../../engine/tween.js';
import { SEAT } from '../../props/character.js';
import { CAM } from '../cameras.js';
import { LINES, ASSISTANT, CODES, OUTCOMES } from '../script.js';
import { setBranchState, sail, craneTransfer, drive, deliver, crossing } from '../actions.js';

const L = LINES.b;
const LABEL = 'B · With pre-submission checks';
const WARM = '#f7ecd6';

export default {
  id: 'b',

  init(ctx) { setBranchState(ctx); },

  async run(ctx) {
    const { world: w, ui, form, stage, director, fx } = { ...ctx, fx: ctx.world.fx };
    const her = w.her, bot = w.bot;

    if (ctx.from === 'a') {
      ui.caption(L.rewind, { label: LABEL });
      await ui.rewind(ctx.wait, L.rewind);
    }
    ui.caption(L.tap, { label: LABEL });
    stage.tweenMood({ bg: WARM, light: 1.05 }, { duration: 1600 });
    await ctx.wait(700);
    await form.hoverSubmit(ctx.wait);

    // the checker pops out of the laptop screen
    const screen = w.office.screen.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, .05, .12));
    bot.root.position.copy(screen);
    bot.root.rotation.y = 0;
    fx.sparkle(screen);
    await ctx.do(bot.appear());
    form.hideCursor();

    // ...flies round and taps her on the shoulder nearest the camera
    ctx.camera(CAM.shoulderWide, { duration: 1400 });
    await ctx.do(bot.flyTo(w.officePoint(-.78, -1.62, 1.42).toArray(), { duration: 1300, lift: .55, yaw: 1.05 }));
    await ctx.do(bot.tap(2));
    her.setExpression('surprised');
    ui.sticker(her.headTop, '!', { tone: 'teal', life: 1300 });
    await ctx.do(her.pose('sitTurn', { duration: 600 }));
    const hello = ui.bubble(bot.anchor, ASSISTANT.hello, { tone: 'teal', speaker: 'Checker' });
    await ctx.wait(2600);
    her.setExpression('confused');
    hello.close();

    // points at the problem
    ui.caption(L.explain);
    her.pose('sitNod', { duration: 600 });
    ctx.camera(CAM.shoulder, { duration: 1300 });
    await ctx.do(bot.flyTo(w.officePoint(.42, -3.2, 1.58).toArray(), { duration: 1100, lift: .25, yaw: -.35 }));
    await ctx.do(bot.point(true));
    form.mark('code', 'flag');
    w.office.setScreen('warn');
    const point = ui.bubble(bot.anchor, ASSISTANT.point, { tone: 'teal', speaker: 'Checker' });
    await ctx.wait(900);
    await ctx.do(form.callout(ASSISTANT.callout, ctx.wait, { auto: 15000 }));
    point.close();

    // fixed
    her.setExpression('happy');
    her.pose('type', { duration: 300 });
    her.flags.typing = true;
    await form.backspace('code', 2, ctx.wait);
    await form.type('code', CODES.right.slice(-2), ctx.wait, { cps: 5 });
    her.flags.typing = false;
    form.mark('code', 'ok');
    form.closeCallout();
    form.focus(null);
    fx.sparkle(screen, { color: '#52d68a' });
    bot.point(false);
    bot.setHappy(true);
    bot.spin();
    her.pose('sitNod', { duration: 400 });
    const ok = ui.bubble(bot.anchor, ASSISTANT.done, { tone: 'teal', speaker: 'Checker' });
    ui.caption(L.fix);
    await ctx.wait(1500);
    ok.close();
    await form.clickSubmit(ctx.wait);
    form.status('Accepted', 'ok');
    form.stamp('Accepted', 'ok');
    w.office.setScreen('ok');
    ui.caption(L.accepted);
    her.pose('cheer', { duration: 450, extra: SEAT });
    ui.sticker(her.headTop, '✓', { tone: 'green', life: 1500 });
    await ctx.do(bot.wave(1000));
    await ctx.do(bot.flyTo(screen.toArray(), { duration: 700, lift: .3, yaw: 0 }));
    await ctx.do(bot.vanish());
    fx.sparkle(screen);
    her.pose('sit', { duration: 500 });
    await ctx.wait(900);
    form.hide();

    // arrival: straight through
    ui.caption(L.arrive);
    stage.tweenMood({ bg: '#f8eedb', light: 1.08 }, { duration: 1600 });
    await crossing(ctx, .5, .96, 5500);
    sail(ctx, .96, 1, 4200, ease.outQuad);
    await ctx.camera({ ...CAM.ship, follow: w.ship.root, offset: [4, 3, 0] }, { duration: 2400 });
    await ctx.wait(1800);
    await ctx.camera(CAM.ukPort, { duration: 1600 });
    await craneTransfer(ctx, w.ukCrane, w.truck.mount);

    ui.caption(L.clear);
    w.checkpoint.setLamp('green');
    const cleared = ui.tag(w.container.root, '<b>Cleared</b><span>Declaration accepted</span>', { tone: 'green', offset: [0, 3.4, 0] });
    ctx.tween({ delay: 1200, duration: 1100, easing: ease.inOutCubic, onUpdate: t => w.checkpoint.setBarrier(t) });
    await ctx.camera({ span: 32, azimuth: -.6, elevation: .52, follow: w.truck.root, offset: [0, 2, 0] }, { duration: 1400 });
    await ctx.do(drive(ctx, 0, 1, 8200, ease.inOutSine).done);
    cleared.close();

    // fresh oranges, on time
    ui.caption(L.home);
    await deliver(ctx, { fresh: 1 });
    w.orange.userData.mat.color.set('#f39a2b');
    w.orange.visible = true;
    her.setExpression('happy');
    await ctx.do(her.pose('holdUp', { duration: 500 }));
    await ctx.do(her.faceTo(-.45, 400));
    her.pose('cheer', { duration: 400 });
    w.orange.visible = false;
    fx.confetti(her.headTop.getWorldPosition(new THREE.Vector3()));
    ui.sticker(her.headTop, '♥', { tone: 'orange', life: 1800 });
    await ctx.wait(2200);

    ui.endCard('b', OUTCOMES.b, {
      other: OUTCOMES.a,
      onNext: () => director.play('a', { from: 'b' }),
      onReplay: () => director.play('prepare'),
    });
    return null;
  },
};
