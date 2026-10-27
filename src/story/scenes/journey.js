// Scene 2 — The journey. Ends at the branch point with the outdated code entered.
import { ease } from '../../engine/tween.js';
import { CAM } from '../cameras.js';
import { LINES, FORM } from '../script.js';
import { sail, hornPuff, sitDown, crossing } from '../actions.js';

const L = LINES.journey;
const LABEL = '2 · The journey';

export default {
  id: 'journey',

  init({ world: w, stage, form }) {
    w.reset();
    w.crates.forEach(c => { c.root.visible = false; });
    w.containerTo('ship');
    w.usCrane.set(10.55, 10.5);
    form.hide();
    form.reset();
    stage.jumpCamera({ ...CAM.ship, follow: w.ship.root, offset: [4, 3, 0] });
  },

  async run(ctx) {
    const { world: w, ui, form } = ctx;
    const her = w.her;

    ui.caption(L.sail, { label: LABEL });
    hornPuff(ctx);
    sail(ctx, 0, .04, 3600, ease.inQuad);
    ctx.tween({ duration: 1800, easing: ease.inOutCubic, onUpdate: t => w.usCrane.set(10.55 - t * 10.8, 10.5) });
    await ctx.wait(3600);

    // out across the map, as far as mid-Atlantic
    ui.caption(L.map);
    await crossing(ctx, .04, .5, 6500);

    // meanwhile, at her desk
    ui.caption(L.desk);
    await ctx.camera(CAM.office, { duration: 2800, arc: .8 });
    her.setExpression('neutral');
    await sitDown(ctx);
    await ctx.play({ duration: 700, easing: ease.outBack, onUpdate: t => w.office.setLid(t) });
    w.office.setScreen('form');
    her.pose('type', { duration: 400 });
    await ctx.camera(CAM.shoulder, { duration: 1700 });

    form.reset();
    form.show();
    her.flags.typing = true;
    for (const f of FORM) {
      if (f.code) {
        ui.caption(L.code);
        await ctx.wait(500);
        await form.type(f.id, f.value, ctx.wait, { cps: 5 });
        await ctx.wait(1300);
      } else {
        await form.type(f.id, f.value, ctx.wait, { cps: 28 });
        await ctx.wait(160);
      }
    }
    form.focus(null);
    her.flags.typing = false;
    her.pose('sit', { duration: 400 });
    await ctx.wait(400);

    ui.caption(L.branch);
    return ctx.do(ui.choose());
  },
};
