// The import declaration she fills in, as an on-screen panel that types itself.
// Every timed step takes the story's `wait` so it pauses and cancels with the story.
import { FORM } from '../story/script.js';

const $ = (root, s) => root.querySelector(s);

export class Declaration {
  constructor(host) {
    const root = this.root = document.createElement('section');
    root.className = 'decl is-hidden';
    root.setAttribute('aria-label', 'Import declaration');
    root.innerHTML = `
      <header class="decl__head">
        <div><div class="decl__eyebrow">UK import declaration</div><h3>Goods item 1</h3></div>
        <span class="decl__status" data-tone="draft">Draft</span>
      </header>
      <div class="decl__fields">
        ${FORM.map(f => `
          <div class="field${f.code ? ' field--code' : ''}" data-id="${f.id}">
            <label>${f.label}</label>
            <div class="field__value">${f.code ? '<span class="digits">' + '<i></i>'.repeat(8) + '</span>' : '<span class="txt"></span>'}<span class="caret"></span><span class="field__mark"></span></div>
          </div>`).join('')}
      </div>
      <div class="decl__callout" hidden>
        <div class="callout__head"><span class="callout__bot" aria-hidden="true"></span><b class="callout__title"></b></div>
        <p class="callout__body"></p>
        <button type="button" class="btn btn--primary callout__action"></button>
      </div>
      <div class="decl__banner" hidden><b></b><p></p></div>
      <div class="decl__search" hidden><div class="search__box"><span class="search__q"></span><span class="caret"></span></div><div class="search__res"></div></div>
      <footer class="decl__foot"><button type="button" class="btn btn--primary decl__submit" tabindex="-1">Submit declaration</button></footer>
      <div class="decl__stamp" hidden></div>
      <div class="decl__cursor" aria-hidden="true"></div>`;
    host.append(root);
    this.fields = new Map(FORM.map(f => [f.id, $(root, `[data-id="${f.id}"]`)]));
  }

  show() { this.root.classList.remove('is-hidden'); document.body.classList.add('has-form'); }
  hide() { this.root.classList.add('is-hidden'); document.body.classList.remove('has-form'); }

  reset() {
    for (const [id, f] of this.fields) { this.setValue(id, ''); f.classList.remove('is-active', 'is-error', 'is-ok', 'is-flag'); }
    this.status('Draft', 'draft');
    for (const s of ['.decl__callout', '.decl__banner', '.decl__search', '.decl__stamp']) $(this.root, s).hidden = true;
    $(this.root, '.decl__cursor').classList.remove('is-on', 'is-click');
    $(this.root, '.decl__submit').classList.remove('is-pressed');
  }

  setValue(id, text) {
    const f = this.fields.get(id);
    if (f.classList.contains('field--code')) [...f.querySelectorAll('.digits i')].forEach((d, i) => { d.textContent = text[i] ?? ''; d.classList.toggle('is-filled', !!text[i]); });
    else $(f, '.txt').textContent = text;
    f.dataset.value = text;
  }
  value(id) { return this.fields.get(id).dataset.value ?? ''; }

  fill(upTo) {
    for (const f of FORM) { this.setValue(f.id, f.value); if (f.id === upTo) break; }
  }

  focus(id) {
    for (const [k, f] of this.fields) f.classList.toggle('is-active', k === id);
    if (id) this.fields.get(id).scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  async type(id, text, wait, { cps = 22 } = {}) {
    this.focus(id);
    const start = this.value(id);
    for (let i = 1; i <= text.length; i++) {
      this.setValue(id, start + text.slice(0, i));
      await wait(1000 / cps * (text[i - 1] === ' ' ? .6 : 1) * (0.7 + Math.random() * .6));
    }
  }

  async backspace(id, n, wait) {
    this.focus(id);
    for (let i = 0; i < n; i++) { this.setValue(id, this.value(id).slice(0, -1)); await wait(110); }
  }

  mark(id, state) {
    const f = this.fields.get(id);
    f.classList.remove('is-error', 'is-ok', 'is-flag');
    if (state) f.classList.add(`is-${state}`);
  }

  status(text, tone) { const s = $(this.root, '.decl__status'); s.textContent = text; s.dataset.tone = tone; }

  banner(tone, title, body) {
    $(this.root, '.decl__stamp').hidden = true;
    const b = $(this.root, '.decl__banner');
    b.dataset.tone = tone;
    $(b, 'b').textContent = title;
    $(b, 'p').textContent = body;
    b.hidden = false;
    b.classList.remove('is-in'); void b.offsetWidth; b.classList.add('is-in');
  }

  stamp(text, tone) {
    const s = $(this.root, '.decl__stamp');
    s.textContent = text; s.dataset.tone = tone; s.hidden = false;
    s.classList.remove('is-in'); void s.offsetWidth; s.classList.add('is-in');
  }

  // Resolves when the viewer presses the action, or after `auto` ms of story time.
  callout({ title, body, action }, wait, { auto = 15000 } = {}) {
    const c = $(this.root, '.decl__callout');
    $(c, '.callout__title').textContent = title;
    $(c, '.callout__body').textContent = body;
    const btn = $(c, '.callout__action');
    btn.textContent = action;
    btn.disabled = false;
    c.hidden = false;
    c.classList.remove('is-in'); void c.offsetWidth; c.classList.add('is-in');
    this.fields.get('code').after(c);
    return new Promise(resolve => {
      let done = false;
      const finish = how => { if (done) return; done = true; btn.disabled = true; btn.classList.add('is-pressed'); resolve(how); };
      btn.onclick = () => finish('click');
      wait(auto).then(() => finish('auto'), () => finish('cancel'));
      setTimeout(() => btn.focus({ preventScroll: true }), 50);
    });
  }
  closeCallout() { $(this.root, '.decl__callout').hidden = true; }

  async search(queries, wait) {
    const s = $(this.root, '.decl__search');
    const q = $(s, '.search__q'), res = $(s, '.search__res');
    s.hidden = false;
    for (const text of queries) {
      q.textContent = ''; res.innerHTML = '';
      for (let i = 1; i <= text.length; i++) { q.textContent = text.slice(0, i); await wait(38); }
      res.innerHTML = '<span class="spinner"></span> Searching…';
      await wait(700);
      res.innerHTML = '<span class="search__none">No clear answer. Try another search.</span>';
      await wait(900);
    }
  }
  hideSearch() { $(this.root, '.decl__search').hidden = true; }

  async clickSubmit(wait) {
    const cur = $(this.root, '.decl__cursor'), btn = $(this.root, '.decl__submit');
    const r = this.root.getBoundingClientRect(), b = btn.getBoundingClientRect();
    cur.style.setProperty('--x', `${r.width * .25}px`);
    cur.style.setProperty('--y', `${r.height * .55}px`);
    cur.classList.add('is-on');
    await wait(80);
    cur.style.setProperty('--x', `${b.left - r.left + b.width * .55}px`);
    cur.style.setProperty('--y', `${b.top - r.top + b.height * .55}px`);
    await wait(750);
    cur.classList.add('is-click'); btn.classList.add('is-pressed');
    await wait(200);
    cur.classList.remove('is-click'); btn.classList.remove('is-pressed');
    await wait(150);
    cur.classList.remove('is-on');
  }

  // Cursor drifts towards Submit and stops short (for the interruption).
  async hoverSubmit(wait) {
    const cur = $(this.root, '.decl__cursor'), btn = $(this.root, '.decl__submit');
    const r = this.root.getBoundingClientRect(), b = btn.getBoundingClientRect();
    cur.style.setProperty('--x', `${r.width * .3}px`);
    cur.style.setProperty('--y', `${r.height * .5}px`);
    cur.classList.add('is-on');
    await wait(80);
    cur.style.setProperty('--x', `${b.left - r.left + b.width * .35}px`);
    cur.style.setProperty('--y', `${b.top - r.top - 6}px`);
    await wait(700);
  }
  hideCursor() { $(this.root, '.decl__cursor').classList.remove('is-on'); }
}
