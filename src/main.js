// Boot: stage → world → UI → director. Scenes are plain modules registered here.
import { Stage } from './engine/stage.js';
import { buildWorld } from './story/world.js';
import { Overlay } from './ui/overlay.js';
import { Declaration } from './ui/declaration.js';
import { Director } from './story/director.js';
import { CHAPTERS } from './story/script.js';
import { CAM } from './story/cameras.js';
import prepare from './story/scenes/prepare.js';
import journey from './story/scenes/journey.js';
import current from './story/scenes/current.js';
import assisted from './story/scenes/assisted.js';

const $ = s => document.querySelector(s);
const scenes = { prepare, journey, a: current, b: assisted };

// Canvas-drawn signs need the display face loaded first; don't wait forever for it.
const FACES = ['700 40px "Barlow Semi Condensed"', '600 20px "Barlow Semi Condensed"', '500 16px Barlow'];
await Promise.race([Promise.all(FACES.map(f => document.fonts.load(f))), new Promise(r => setTimeout(r, 2500))]);

const stage = new Stage($('#stage'), { background: '#f4eadb', groundY: -4 });
const world = buildWorld(stage);
world.reset();
const ui = new Overlay(stage);
const form = new Declaration($('#formHost'));
const director = new Director({ stage, world, ui, form, scenes });

ui.chapters(CHAPTERS, id => { setPaused(false); director.play(id); });

const pauseBtn = $('#pause');
function setPaused(on) {
  stage.clock.paused = on;
  document.body.classList.toggle('is-paused', on);
  pauseBtn.setAttribute('aria-pressed', String(on));
  pauseBtn.querySelector('span').textContent = on ? 'Play' : 'Pause';
}
pauseBtn.addEventListener('click', () => setPaused(!stage.clock.paused));
$('#restart').addEventListener('click', () => { setPaused(false); director.play('prepare'); });
addEventListener('keydown', e => {
  if (e.code === 'Space' && !e.target.closest('button, input, textarea')) { e.preventDefault(); setPaused(!stage.clock.paused); }
});

// #a opens a scenario directly; #a~12 also fast-forwards 12 seconds into it (for review).
const [first, skip] = location.hash.slice(1).split('~');
if (skip) {
  window.__story = { stage, director, world, ui, form, CAM };
  stage.clock.rate = 30;
  const stop = stage.onTick(() => { if (stage.clock.now > skip * 1000) { stage.clock.rate = 1; stop(); } });
}
document.body.classList.add('is-ready');
director.play(scenes[first] ? first : 'prepare');
