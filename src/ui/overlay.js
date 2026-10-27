// HTML that rides on top of the 3D stage: bubbles and stickers pinned to objects,
// captions, chapter strip, the branch choice, end cards, the hold board and inspect cards.
import * as THREE from 'three';

const $ = s => document.querySelector(s);
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const v = new THREE.Vector3();

export class Overlay {
  constructor(stage) {
    this.stage = stage;
    this.layer = $('#anchors');
    this.anchors = new Set();
    this.screen = {};
    const prev = stage.hooks.frame;
    stage.hooks.frame = () => { prev?.(); this.update(); };
    this.wireInspect();
  }

  /* ---------- pinned to 3D ---------- */
  pin(obj, node, offset = [0, 0, 0]) {
    const a = { obj, el: node, offset: new THREE.Vector3(...offset) };
    node.classList.add('pin');
    this.layer.append(node);
    this.anchors.add(a);
    this.place(a);
    return a;
  }
  unpin(a, { fade = true } = {}) {
    if (!a || !this.anchors.has(a)) return;
    this.anchors.delete(a);
    if (!fade) { a.el.remove(); return; }
    a.el.classList.add('is-leaving');
    setTimeout(() => a.el.remove(), 260);
  }
  place(a) {
    a.obj.getWorldPosition(v).add(a.offset);
    const s = this.stage.toScreen(v, this.screen);
    if (a.el.classList.contains('bubble')) {
      // keep speech bubbles fully on screen
      const half = (a.el.firstElementChild?.offsetWidth ?? 0) / 2, W = this.stage.size.w;
      s.x = Math.min(Math.max(s.x, half + 10), W - half - 10);
    }
    a.el.style.transform = `translate(${s.x.toFixed(1)}px, ${s.y.toFixed(1)}px)`;
    a.el.hidden = !s.on;
  }
  update() { for (const a of this.anchors) this.place(a); }
  clearPins() { for (const a of [...this.anchors]) this.unpin(a, { fade: false }); }

  bubble(obj, text, { tone = 'ink', offset = [0, .1, 0], speaker } = {}) {
    const node = el('div', `bubble bubble--${tone}`);
    node.innerHTML = `<div class="bubble__box">${speaker ? `<span class="bubble__who">${speaker}</span>` : ''}<span class="bubble__text"></span></div>`;
    const span = node.querySelector('.bubble__text');
    span.textContent = text;
    const a = this.pin(obj, node, offset);
    return { el: node, close: () => this.unpin(a) };
  }

  sticker(obj, glyph, { tone = 'ink', offset = [0, .15, 0], life = 1500, dx = 0 } = {}) {
    const node = el('div', `sticker sticker--${tone}`);
    node.innerHTML = `<span style="--dx:${dx}px">${glyph}</span>`;
    const a = this.pin(obj, node, offset);
    if (life) setTimeout(() => this.unpin(a), life);
    return { close: () => this.unpin(a) };
  }

  tag(obj, html, { tone = 'red', offset = [0, 0, 0] } = {}) {
    const node = el('div', `tag tag--${tone}`, `<div class="tag__box">${html}</div>`);
    const a = this.pin(obj, node, offset);
    return { el: node, set: h => { node.querySelector('.tag__box').innerHTML = h; }, tone: t => { node.className = `tag tag--${t} pin`; }, close: () => this.unpin(a) };
  }

  /* ---------- caption + chapters ---------- */
  caption(text, { label } = {}) {
    const c = $('#caption');
    c.classList.remove('is-in');
    void c.offsetWidth;
    if (label != null) $('#captionLabel').textContent = label;
    $('#captionText').textContent = text;
    c.hidden = !text;
    c.classList.add('is-in');
  }

  chapters(list, onPick) {
    const nav = $('#chapters');
    nav.innerHTML = '';
    this.chapterButtons = new Map();
    list.forEach(ch => {
      const b = el('button', 'chip', `<b>${ch.mark}</b><span>${ch.label}</span>`);
      b.type = 'button';
      b.dataset.id = ch.id;
      b.addEventListener('click', () => onPick(ch.id));
      nav.append(b);
      this.chapterButtons.set(ch.id, b);
    });
  }
  setChapter(id) {
    for (const [k, b] of this.chapterButtons) { b.classList.toggle('is-on', k === id); b.setAttribute('aria-current', k === id ? 'step' : 'false'); }
    document.body.dataset.chapter = id;
  }

  /* ---------- branch ---------- */
  choose() {
    const box = $('#branch');
    box.hidden = false;
    requestAnimationFrame(() => box.classList.add('is-in'));
    return new Promise(resolve => {
      const pick = id => { box.classList.remove('is-in'); setTimeout(() => { box.hidden = true; }, 250); cleanup(); resolve(id); };
      const handlers = [...box.querySelectorAll('[data-pick]')].map(b => { const h = () => pick(b.dataset.pick); b.addEventListener('click', h); return [b, h]; });
      const cleanup = () => handlers.forEach(([b, h]) => b.removeEventListener('click', h));
      this.cancelChoice = () => { cleanup(); box.classList.remove('is-in'); box.hidden = true; resolve(null); };
    });
  }

  /* ---------- end card ---------- */
  endCard(variant, outcome, { onNext, onReplay, other }) {
    const card = $('#end');
    card.dataset.variant = variant;
    card.innerHTML = `
      <div class="end__eyebrow">${outcome.eyebrow}</div>
      <h2>${outcome.title}</h2>
      <ul>${outcome.points.map(p => `<li>${p}</li>`).join('')}</ul>
      <div class="end__compare">
        <div><span>${outcome.stat.label}</span><b>${outcome.stat.value}</b></div>
        ${other ? `<div class="is-other"><span>${other.eyebrow.split(' · ')[1]}</span><b>${other.stat.value}</b></div>` : ''}
      </div>
      <p class="end__note">Illustrative scenario.</p>
      <div class="end__actions">
        <button class="btn btn--primary" type="button" data-act="next">${outcome.next.label}</button>
        <button class="btn btn--ghost" type="button" data-act="replay">Replay from the start</button>
      </div>`;
    card.querySelector('[data-act="next"]').onclick = onNext;
    card.querySelector('[data-act="replay"]').onclick = onReplay;
    card.hidden = false;
    requestAnimationFrame(() => card.classList.add('is-in'));
  }
  hideEnd() { const c = $('#end'); c.classList.remove('is-in'); c.hidden = true; }

  /* ---------- hold board (scenario A) ---------- */
  hold(show, { day = 1, fresh = 1, label = 'Held at the border' } = {}) {
    const h = $('#hold');
    h.hidden = !show;
    if (!show) return;
    $('#holdLabel').textContent = label;
    $('#holdDay').textContent = `Day ${day}`;
    $('#holdFresh').style.setProperty('--f', fresh);
    $('#holdFreshText').textContent = `${Math.round(fresh * 100)}%`;
    h.dataset.tone = label.startsWith('Released') ? 'ok' : 'bad';
  }

  /* ---------- at-sea counter ---------- */
  sea(show, { day = 1, progress = 0, from = '', to = '' } = {}) {
    const s = $('#sea');
    s.hidden = !show;
    if (!show) return;
    $('#seaDay').textContent = `Day ${day}`;
    $('#seaBar').style.setProperty('--p', progress);
    if (from) { $('#seaFrom').textContent = from; $('#seaTo').textContent = to; }
  }

  /* ---------- rewind flourish ---------- */
  async rewind(wait, text) {
    const r = $('#rewind');
    $('#rewindText').textContent = text;
    r.hidden = false;
    r.classList.add('is-in');
    await wait(1500);
    r.classList.remove('is-in');
    setTimeout(() => { r.hidden = true; }, 300);
  }

  /* ---------- inspect: tooltip + card ---------- */
  wireInspect() {
    const tip = $('#tip'), card = $('#card');
    const stage = this.stage;
    stage.hooks.pointer = (x, y) => { tip.style.transform = `translate(${x + 14}px, ${y + 16}px)`; };
    stage.hooks.hover = info => {
      tip.classList.toggle('is-on', !!info);
      if (info) tip.innerHTML = `${info.name}<small>${info.kind}</small>`;
    };
    stage.hooks.select = info => {
      card.classList.toggle('is-hidden', !info);
      if (!info) return;
      $('#cardKind').textContent = info.kind;
      $('#cardName').textContent = info.name;
      $('#cardDesc').textContent = info.desc;
      $('#cardSpec').textContent = info.spec;
    };
    $('#cardClose').addEventListener('click', () => stage.select(null));
    addEventListener('keydown', e => { if (e.key === 'Escape') stage.select(null); });
  }

  resetTransient() {
    this.clearPins();
    this.cancelChoice?.();
    this.cancelChoice = null;
    this.hideEnd();
    this.hold(false);
    this.sea(false);
    $('#rewind').hidden = true;
  }
}
