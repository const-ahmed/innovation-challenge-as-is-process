// The storyboard: every scene as a card (picture, title, caption), with the shared chapters on
// top and the two scenarios side by side below. Clicking a card plays from that scene.
// Pictures are taken live: the director snaps the world to each scene and the stage photographs
// it, once per visit to the page. Opening it pauses the story; closing it picks up where it was.
const $ = s => document.querySelector(s);
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const THUMB_W = 360;
const SHARED = ['prepare', 'journey'], FORK = ['a', 'b'];
const INK = '#1c2236', MUTED = '#7d705f', PANEL = '#fbf6ee', LINE = '#e0d2bd';
const TONE = { draft: MUTED, pending: '#c98a12', ink: INK, bad: '#c8463d', ok: '#2f9e62' };
const MARK = { error: '#c8463d', flag: '#c8463d', ok: '#2f9e62' };

export class Storyboard {
  constructor({ director, stage, form, chapters, feedback, pause, onPick }) {
    Object.assign(this, { director, stage, form, feedback, pause, onPick });
    this.chapters = Object.fromEntries(chapters.map(c => [c.id, c]));
    this.panel = $('#board');
    this.body = $('#boardBody');
    this.thumbs = new Map();     // "chapter.beat" → data URL
    this.cards = new Map();      // "chapter.beat" → card element
    this.run = 0;                // bumps to stop a capture in progress
    this.snapped = false;        // the world was moved for pictures, so the story must restart

    $('#boardBtn').addEventListener('click', () => this.open());
    $('#boardClose').addEventListener('click', () => this.close());
    this.panel.addEventListener('keydown', e => { if (e.key === 'Escape' && !this.feedback.isOpen) this.close(); });
  }

  get isOpen() { return !this.panel.hidden; }

  open() {
    if (this.isOpen) return;
    if (!this.cards.size) this.build();
    const now = `${this.director.current}.${this.director.beat}`;
    for (const [key, card] of this.cards) card.classList.toggle('is-now', key === now);
    this.wasPaused = this.pause.get();
    this.pause.set(true);
    document.body.classList.add('has-board');
    this.panel.hidden = false;
    requestAnimationFrame(() => {
      this.panel.classList.add('is-in');
      const card = this.cards.get(now);
      card?.scrollIntoView({ block: 'center' });
      card?.querySelector('.scene__play').focus({ preventScroll: true });
    });
    this.capture();
  }

  close({ resume = true } = {}) {
    this.run++;
    this.feedback.isOpen && this.feedback.close();
    this.panel.classList.remove('is-in');
    this.panel.hidden = true;
    document.body.classList.remove('has-board');
    if (!resume) return;
    if (this.snapped) { this.snapped = false; this.director.resume(); }
    if (!this.wasPaused) this.pause.set(false);
    $('#boardBtn').focus();
  }

  pick(chapter, beat) {
    this.close({ resume: false });
    this.snapped = false;
    this.onPick(chapter, beat);
  }

  build() {
    const parts = this.director.parts();
    const lane = id => {
      const c = this.chapters[id];
      const sec = el('section', 'lane', `<h3 class="lane__title"><b>${c.mark}</b>${c.label}</h3>`);
      sec.dataset.chapter = id;
      const list = el('ol', 'lane__cards');
      for (const p of parts.filter(p => p.chapter === id)) list.append(this.card(p));
      sec.append(list);
      return sec;
    };
    for (const id of SHARED) this.body.append(lane(id));
    const fork = el('div', 'fork');
    fork.append(el('p', 'fork__note', 'The story splits here: the same mistake, two outcomes.'));
    for (const id of FORK) fork.append(lane(id));
    this.body.append(fork);
  }

  card(p) {
    const key = `${p.chapter}.${p.beat}`;
    const li = el('li', 'scene');
    li.innerHTML = `
      <button class="scene__play" type="button">
        <span class="scene__thumb"><img alt="" hidden><span class="scene__now">Now playing</span></span>
        <span class="scene__no">Scene ${p.beat + 1}</span>
        <span class="scene__title"></span>
        <span class="scene__cap"></span>
      </button>
      <button class="scene__fb" type="button" aria-label="Feedback on scene ${p.beat + 1}">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 3.5h11v7h-6l-3 2.5v-2.5h-2z"/></svg>Feedback
      </button>`;
    li.querySelector('.scene__title').textContent = p.label;
    li.querySelector('.scene__cap').textContent = p.caption ?? '';
    li.querySelector('.scene__play').setAttribute('aria-label', `Play from ${this.chapters[p.chapter].label}, scene ${p.beat + 1}: ${p.label}`);
    li.querySelector('.scene__play').addEventListener('click', () => this.pick(p.chapter, p.beat));
    li.querySelector('.scene__fb').addEventListener('click', () => this.feedback.open(key));
    this.cards.set(key, li);
    return li;
  }

  // Photograph every scene not yet pictured, one per frame so the board stays responsive.
  async capture() {
    const run = ++this.run;
    for (const p of this.director.parts()) {
      const key = `${p.chapter}.${p.beat}`;
      if (this.thumbs.has(key)) { this.show(key); continue; }
      await new Promise(r => requestAnimationFrame(r));
      if (run !== this.run) return;
      this.director.still(p.chapter, p.beat);
      this.snapped = true;
      const still = this.stage.snapshot(THUMB_W * Math.min(2, devicePixelRatio || 1));
      const form = this.form.summary();
      if (form.shown) drawForm(still, form);
      this.thumbs.set(key, still.toDataURL('image/jpeg', .82));
      this.show(key);
    }
  }

  show(key) {
    const img = this.cards.get(key).querySelector('img');
    if (!img.hidden) return;
    img.src = this.thumbs.get(key);
    img.hidden = false;
  }
}

// A small stand-in for the declaration panel, top right like the real one: the commodity code
// and the form's status, which is what tells the desk scenes apart.
function drawForm(canvas, { code, mark, status, tone }) {
  const g = canvas.getContext('2d'), u = canvas.width / 270;
  const w = 128 * u, h = 70 * u, x = canvas.width - w - 12 * u, y = 12 * u;
  g.save();
  g.fillStyle = PANEL; g.strokeStyle = INK; g.lineWidth = 1.6 * u;
  g.beginPath(); g.roundRect(x, y, w, h, 7 * u); g.fill(); g.stroke();
  g.textBaseline = 'alphabetic';
  g.fillStyle = MUTED;
  g.font = `600 ${7.5 * u}px "Barlow Semi Condensed", sans-serif`;
  g.fillText('COMMODITY CODE', x + 9 * u, y + 15 * u);
  g.fillStyle = MARK[mark] ?? INK;
  g.font = `600 ${16 * u}px "IBM Plex Mono", monospace`;
  g.fillText(code || '— — — —', x + 9 * u, y + 35 * u);
  g.strokeStyle = LINE; g.lineWidth = u;
  g.beginPath(); g.moveTo(x + 9 * u, y + 44 * u); g.lineTo(x + w - 9 * u, y + 44 * u); g.stroke();
  g.fillStyle = TONE[tone] ?? MUTED;
  g.beginPath(); g.arc(x + 13 * u, y + 56 * u, 3.2 * u, 0, Math.PI * 2); g.fill();
  g.font = `600 ${9.5 * u}px "Barlow Semi Condensed", sans-serif`;
  g.fillText(status, x + 21 * u, y + 59.5 * u);
  g.restore();
}
