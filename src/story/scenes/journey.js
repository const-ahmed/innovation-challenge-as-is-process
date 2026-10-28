// Chapter 2 — The journey. Ends at the branch point with the outdated code entered.
import { ease } from '../../engine/tween.js';
import { CAM } from '../cameras.js';
import { LINES, FORM } from '../script.js';
import { sail, hornPuff, sitDown, crossing } from '../actions.js';

const L = LINES.journey;
const codeAt = FORM.findIndex(f => f.code);

// Types each field; the commodity code goes slowly so the viewer can read it.
async function typeFields(ctx, fields) {
  const { form } = ctx;
  for (const f of fields) {
    if (f.code) { await form.type(f.id, f.value, ctx.wait, { cps: 5 }); await ctx.wait(1300); }
    else { await form.type(f.id, f.value, ctx.wait, { cps: 28 }); await ctx.wait(160); }
  }
}

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

  beats: [
    {
      label: 'Setting sail',
      caption: L.sail,
      async run(ctx) {
        const { world: w } = ctx;
        hornPuff(ctx);
        sail(ctx, 0, .04, 3600, ease.inQuad);
        ctx.tween({ duration: 1800, easing: ease.inOutCubic, onUpdate: t => w.usCrane.set(10.55 - t * 10.8, 10.5) });
        await ctx.wait(3600);
      },
      end({ world: w, stage }) {
        w.ship.setProgress(.04);
        w.usCrane.set(-.25, 10.5);
        stage.jumpCamera({ ...CAM.ship, follow: w.ship.root, offset: [4, 3, 0] });
      },
    },
    {
      label: 'Crossing the Atlantic',
      caption: L.map,
      async run(ctx) {
        await crossing(ctx, .04, .5, 6500);
      },
      end({ world: w, stage, ui }) {
        w.ship.setProgress(.5);
        w.route.setOpacity(0);
        ui.sea(false);
        stage.jumpCamera(CAM.atlantic);
      },
    },
    {
      label: 'At her desk',
      caption: L.desk,
      async run(ctx) {
        const { world: w } = ctx, her = w.her;
        await ctx.camera(CAM.office, { duration: 2800, arc: .8 });
        her.setExpression('neutral');
        await sitDown(ctx);
        await ctx.play({ duration: 700, easing: ease.outBack, onUpdate: t => w.office.setLid(t) });
        w.office.setScreen('form');
        her.pose('type', { duration: 400 });
        await ctx.camera(CAM.shoulder, { duration: 1700 });
      },
      end({ world: w, stage }) {
        w.sitAtDesk();
        w.her.pose('type', { duration: 0 });
        w.her.setExpression('neutral', 0);
        w.office.setLid(1);
        w.office.setScreen('form');
        stage.jumpCamera(CAM.shoulder);
      },
    },
    {
      label: 'Filling in the declaration',
      caption: L.details,
      async run(ctx) {
        const { form, world: w } = ctx;
        form.reset();
        form.show();
        w.her.flags.typing = true;
        await typeFields(ctx, FORM.slice(0, codeAt));
        w.her.flags.typing = false;
      },
      end({ form, world: w }) {
        form.reset();
        form.fill(FORM[codeAt - 1].id);
        form.show();
        w.her.flags.typing = false;
      },
    },
    {
      label: 'The commodity code',
      caption: L.code,
      async run(ctx) {
        const { form, world: w } = ctx;
        w.her.flags.typing = true;
        await ctx.wait(500);
        await typeFields(ctx, FORM.slice(codeAt));
        this.end(ctx);
        await ctx.wait(400);
      },
      end({ form, world: w }) {
        form.fill(FORM.at(-1).id);
        form.focus(null);
        w.her.flags.typing = false;
        w.her.pose('sit', { duration: 400 });
      },
    },
    {
      label: 'Two possible outcomes',
      caption: L.branch,
      async run(ctx) {
        return ctx.do(ctx.ui.choose());
      },
      end() {},
    },
  ],
};
