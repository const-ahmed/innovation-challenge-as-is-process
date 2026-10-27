// Runs the story one chapter at a time. A chapter is a list of scenes ("beats"), each with
//   run(ctx) — plays the scene, awaiting its animation through ctx helpers, and
//   end(ctx) — snaps the world instantly to how that scene leaves it.
// To start partway through a chapter, the director runs init, snaps the earlier scenes'
// ends, then plays from there. Starting anything cancels what was playing: its tweens stop
// and its next ctx await throws Cancelled, so stale code never touches the new state.
export class Cancelled extends Error {}

// Chapter order for back/next. The branch at the end of the journey leads into A or B.
const ORDER = { prepare: { prev: null, next: 'journey' }, journey: { prev: 'prepare', next: null }, a: { prev: 'journey', next: 'b' }, b: { prev: 'journey', next: null } };

export class Director {
  constructor({ stage, world, ui, form, scenes }) {
    Object.assign(this, { stage, world, ui, form, scenes });
    this.token = 0;
    this.current = null;
    this.beat = 0;
    this.listeners = new Set();
  }

  ctx(token, from) {
    const { stage, world, ui, form } = this;
    const live = () => { if (token !== this.token) throw new Cancelled(); };
    // Awaiting a step throws Cancelled once the scene is gone. Steps a scene starts but never
    // awaits (a camera move running alongside) are marked handled so they don't log it.
    const step = p => {
      const s = (async () => { const r = await p; live(); return r; })();
      s.catch(() => {});
      return s;
    };
    return {
      stage, world, ui, form, director: this, from, live,
      state: {},   // shared by the scenes of one chapter run (pins they leave up, counters)
      do: step,
      wait: ms => step(stage.tweens.wait(ms, 'story')),
      tween: o => stage.tweens.add({ tag: 'story', ...o }),
      play: o => step(stage.tweens.add({ tag: 'story', ...o }).done),
      camera: (to, opts) => step(stage.moveCamera(to, opts)),
      all: ps => step(Promise.all(ps)),
    };
  }

  // A chapter's last scene may return the next chapter's id (the branch does), or null to stop.
  async play(id, { beat = 0, from = this.current } = {}) {
    const token = ++this.token;
    const chapter = this.scenes[id];
    this.stage.tweens.clear('story');
    this.ui.resetTransient();
    this.current = id;
    this.ui.setChapter(id);
    const ctx = this.ctx(token, from);
    chapter.init(ctx);
    for (let i = 0; i < beat; i++) chapter.beats[i].end(ctx);
    try {
      let result;
      for (let i = beat; i < chapter.beats.length; i++) {
        this.beat = i;
        this.emit();
        result = await chapter.beats[i].run(ctx);
      }
      const next = result === undefined ? ORDER[id].next : result;
      if (token === this.token && next) this.play(next, { from: id });
    } catch (e) {
      if (!(e instanceof Cancelled)) console.error(e);
    }
  }

  /* ---------- back / next ---------- */
  canPrev() { return this.beat > 0 || !!ORDER[this.current]?.prev; }
  canNext() { return this.beat < this.scenes[this.current].beats.length - 1 || !!ORDER[this.current]?.next; }
  next() {
    if (this.beat < this.scenes[this.current].beats.length - 1) this.play(this.current, { beat: this.beat + 1 });
    else if (ORDER[this.current].next) this.play(ORDER[this.current].next);
  }
  prev() {
    if (this.beat > 0) { this.play(this.current, { beat: this.beat - 1 }); return; }
    const prev = ORDER[this.current].prev;
    if (prev) this.play(prev, { beat: this.scenes[prev].beats.length - 1 });
  }

  /* ---------- where we are ---------- */
  parts() {
    return Object.entries(this.scenes).flatMap(([chapter, ch]) => ch.beats.map((b, i) => ({ chapter, beat: i, count: ch.beats.length, label: b.label })));
  }
  onChange(fn) { this.listeners.add(fn); }
  emit() {
    const ch = this.scenes[this.current];
    for (const fn of this.listeners) fn({ chapter: this.current, beat: this.beat, count: ch.beats.length, label: ch.beats[this.beat].label });
  }
}
