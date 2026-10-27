// Runs one scene at a time. Starting a scene cancels the one before: its tweens stop,
// and its next `await` throws Cancelled so stale code never touches the new state.
export class Cancelled extends Error {}

export class Director {
  constructor({ stage, world, ui, form, scenes }) {
    Object.assign(this, { stage, world, ui, form, scenes });
    this.token = 0;
    this.current = null;
  }

  ctx(token, from) {
    const { stage, world, ui, form } = this;
    const live = () => { if (token !== this.token) throw new Cancelled(); };
    const step = async p => { const r = await p; live(); return r; };
    return {
      stage, world, ui, form, director: this, from, live,
      do: step,
      wait: ms => step(stage.tweens.wait(ms, 'story')),
      tween: o => stage.tweens.add({ tag: 'story', ...o }),
      play: o => step(stage.tweens.add({ tag: 'story', ...o }).done),
      camera: (to, opts) => step(stage.moveCamera(to, opts)),
      all: ps => step(Promise.all(ps)),
    };
  }

  async play(id, { from = this.current } = {}) {
    const token = ++this.token;
    const scene = this.scenes[id];
    this.stage.tweens.clear('story');
    this.ui.resetTransient();
    this.current = id;
    this.ui.setChapter(id);
    const ctx = this.ctx(token, from);
    scene.init(ctx);
    try {
      const next = await scene.run(ctx);
      if (token === this.token && next) this.play(next, { from: id });
    } catch (e) {
      if (!(e instanceof Cancelled)) console.error(e);
    }
  }
}
