// Easing curves and a clock-driven tween list (same curves as the Arduino bench).
export const ease = {
  linear: t => t,
  inQuad: t => t * t,
  outQuad: t => 1 - (1 - t) * (1 - t),
  inOutQuad: t => (t < .5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2),
  inCubic: t => t * t * t,
  outCubic: t => 1 - (1 - t) ** 3,
  inOutCubic: t => (t < .5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2),
  inOutSine: t => -(Math.cos(Math.PI * t) - 1) / 2,
  outBack: t => 1 + 2.70158 * (t - 1) ** 3 + 1.70158 * (t - 1) ** 2,
  inBack: t => 2.70158 * t * t * t - 1.70158 * t * t,
};
export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// Story time. Pausing the clock freezes every tween and tick that reads it.
export class Clock {
  constructor() { this.now = 0; this.rate = 1; this.paused = false; }
  step(ms) { if (!this.paused) this.now += ms * this.rate; }
}

export class Tweens {
  constructor(clock) { this.clock = clock; this.list = []; }

  add({ delay = 0, duration = 1, easing = ease.linear, onUpdate, onComplete, tag } = {}) {
    const t = { start: this.clock.now + delay, duration: Math.max(1, duration), easing, onUpdate, onComplete, tag, dead: false };
    t.done = new Promise(r => { t.resolve = r; });
    t.cancel = () => { if (!t.dead) { t.dead = true; t.resolve(false); } };
    this.list.push(t);
    return t;
  }

  update() {
    const now = this.clock.now, list = this.list;
    this.list = [];
    const keep = list.filter(t => {
      if (t.dead) return false;
      if (now < t.start) return true;
      const p = Math.min(1, (now - t.start) / t.duration);
      t.onUpdate?.(t.easing(p), p);
      if (p >= 1) { t.dead = true; t.onComplete?.(); t.resolve(true); return false; }
      return true;
    });
    this.list = keep.concat(this.list);
  }

  clear(tag) { for (const t of [...this.list]) if (!tag || t.tag === tag) t.cancel(); }
  wait(ms, tag) { return this.add({ duration: ms, tag }).done; }
}
