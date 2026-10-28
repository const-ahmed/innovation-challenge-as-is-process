// The feedback panel: testers pick a scene, write what they think, and post it as a
// pre-filled GitHub issue (or copy the text to send another way). Opening it pauses the story.
import { FEEDBACK } from '../story/script.js';

const $ = s => document.querySelector(s);

export class Feedback {
  constructor({ director, chapters, pause }) {
    this.director = director;
    this.pause = pause;            // { get(): boolean, set(on) }
    this.names = Object.fromEntries(chapters.map(c => [c.id, `${c.mark} · ${c.label}`]));
    this.panel = $('#feedback');
    this.select = $('#fbPart');
    this.text = $('#fbText');
    this.name = $('#fbName');
    this.send = $('#fbSend');

    for (const b of document.querySelectorAll('[data-feedback]')) b.addEventListener('click', () => this.open());
    $('#fbClose').addEventListener('click', () => this.close());
    $('#fbCopy').addEventListener('click', () => this.copy());
    for (const el of [this.select, this.text, this.name]) el.addEventListener('input', () => this.refresh());
    this.panel.addEventListener('keydown', e => { if (e.key === 'Escape') { e.stopPropagation(); this.close(); } });
    this.send.addEventListener('click', e => { if (!this.text.value.trim()) e.preventDefault(); });
  }

  get isOpen() { return !this.panel.hidden; }

  // part: "chapter.beat" to preselect (defaults to the scene playing now)
  open(part = `${this.director.current}.${this.director.beat}`) {
    const parts = this.director.parts();
    const chapters = [...new Set(parts.map(p => p.chapter))];
    this.select.innerHTML = `<option value="general">The whole experience</option>` + chapters.map(ch =>
      `<optgroup label="${this.names[ch]}">${parts.filter(p => p.chapter === ch).map(p => `<option value="${ch}.${p.beat}">Scene ${p.beat + 1}: ${p.label}</option>`).join('')}</optgroup>`).join('');
    this.select.value = part;
    this.wasPaused = this.pause.get();
    this.pause.set(true);
    this.panel.hidden = false;
    requestAnimationFrame(() => { this.panel.classList.add('is-in'); this.text.focus(); });
    this.refresh();
  }

  close() {
    this.panel.classList.remove('is-in');
    setTimeout(() => { if (!this.panel.classList.contains('is-in')) this.panel.hidden = true; }, 260);
    $('#fbStatus').textContent = '';
    if (!this.wasPaused) this.pause.set(false);
  }

  partLabel() {
    const v = this.select.value;
    if (v === 'general') return 'The whole experience';
    const [ch, beat] = v.split('.');
    const p = this.director.parts().find(x => x.chapter === ch && x.beat === +beat);
    return `${this.names[ch]}, scene ${p.beat + 1} of ${p.count}: ${p.label}`;
  }

  message() {
    const part = this.partLabel(), name = this.name.value.trim();
    const title = `Feedback: ${part}`.slice(0, 120);
    const body = [
      `**Part:** ${part}`,
      name ? `**From:** ${name}` : null,
      '',
      this.text.value.trim(),
      '',
      '---',
      `_Sent from the ${FEEDBACK.product} demo · ${this.link()}_`,
    ].filter(l => l !== null).join('\n');
    return { title, body };
  }

  // a link that reopens the story at the chosen scene (#a.3 = scenario A, scene 3)
  link() {
    const base = location.href.split('#')[0], v = this.select.value;
    if (v === 'general') return base;
    const [ch, beat] = v.split('.');
    return `${base}#${ch}.${+beat + 1}`;
  }

  refresh() {
    const ready = !!this.text.value.trim();
    const { title, body } = this.message();
    this.send.href = `https://github.com/${FEEDBACK.repo}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
    this.send.setAttribute('aria-disabled', String(!ready));
    $('#fbCopy').disabled = !ready;
  }

  async copy() {
    const { title, body } = this.message();
    const status = $('#fbStatus');
    try {
      await navigator.clipboard.writeText(`${title}\n\n${body}`);
      status.textContent = 'Copied. Paste it into an email or message to the team.';
    } catch {
      this.text.select();
      status.textContent = 'Copy didn’t work here. Select your text and copy it manually.';
    }
  }
}
