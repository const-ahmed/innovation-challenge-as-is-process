// The importer: a jointed toy figure with poses, a walk cycle, blinking and expressions.
// Local forward is +z. Her right side is local -x.
import * as THREE from 'three';
import { M, mesh, box, sph, capsule, group, prop, castShadows, shortestAngle } from '../engine/kit.js';
import { ease, lerp } from '../engine/tween.js';

const NEUTRAL = {
  pelvis: .8,
  'hipL.x': 0, 'hipR.x': 0, 'kneeL.x': 0, 'kneeR.x': 0,
  'shoulderL.x': 0, 'shoulderL.z': .1, 'shoulderR.x': 0, 'shoulderR.z': -.1,
  'elbowL.x': -.12, 'elbowR.x': -.12,
  'spine.x': 0, 'spine.y': 0, 'head.x': 0, 'head.y': 0, 'head.z': 0,
};

// Seated hips sit a little higher than the old chair so hands clear the desk top (.78).
export const SEAT = { pelvis: .55, 'hipL.x': -1.35, 'hipR.x': -1.35, 'kneeL.x': 1.35, 'kneeR.x': 1.35 };

// Each pose only lists what differs from NEUTRAL.
export const POSES = {
  stand: {},
  sit: { ...SEAT, 'shoulderL.x': -.25, 'shoulderR.x': -.25, 'elbowL.x': -.9, 'elbowR.x': -.9 },
  type: { ...SEAT, 'spine.x': .1, 'shoulderL.x': -1.2, 'shoulderR.x': -1.2, 'shoulderL.z': .05, 'shoulderR.z': -.05, 'elbowL.x': -.5, 'elbowR.x': -.5, 'head.x': .12 },
  sitTurn: { ...SEAT, 'spine.y': 1.0, 'head.y': .6, 'head.x': -.08, 'shoulderL.x': -.2, 'shoulderR.x': -.35, 'elbowL.x': -.5, 'elbowR.x': -.8 },
  sitThink: { ...SEAT, 'shoulderR.x': -.7, 'shoulderR.z': -.05, 'elbowR.x': -2.35, 'shoulderL.x': -1.1, 'elbowL.x': -.55, 'head.x': .08, 'head.z': .14 },
  sitFacepalm: { ...SEAT, 'spine.x': .2, 'shoulderR.x': -1.5, 'elbowR.x': -2.1, 'shoulderL.x': -1.1, 'elbowL.x': -.55, 'head.x': .32 },
  sitHandsOnHead: { ...SEAT, 'shoulderL.x': -2.75, 'shoulderR.x': -2.75, 'shoulderL.z': .55, 'shoulderR.z': -.55, 'elbowL.x': -2.05, 'elbowR.x': -2.05, 'head.x': .2 },
  sitNod: { ...SEAT, 'shoulderL.x': -1.1, 'shoulderR.x': -1.1, 'elbowL.x': -.55, 'elbowR.x': -.55, 'head.x': .18 },
  phone: { 'shoulderR.x': -.75, 'shoulderR.z': -.5, 'elbowR.x': -2.3, 'head.z': -.14 },
  wave: { 'shoulderR.z': -2.6, 'elbowR.x': -.35 },
  cheer: { 'shoulderL.z': 2.6, 'shoulderR.z': -2.6, 'elbowL.x': -.25, 'elbowR.x': -.25, 'head.x': -.15 },
  holdUp: { 'shoulderR.x': -2.5, 'shoulderR.z': -.15, 'elbowR.x': -.2, 'head.x': -.12 },
  point: { 'shoulderR.x': -1.45, 'shoulderR.z': -.05, 'elbowR.x': 0 },
  shrug: { 'shoulderL.z': .55, 'shoulderR.z': -.55, 'elbowL.x': -1.4, 'elbowR.x': -1.4, 'head.z': .18 },
  handsOnHead: { 'shoulderL.x': -2.75, 'shoulderR.x': -2.75, 'shoulderL.z': .55, 'shoulderR.z': -.55, 'elbowL.x': -2.05, 'elbowR.x': -2.05, 'head.x': .22, 'spine.x': .08 },
  slump: { 'spine.x': .22, 'head.x': .35, 'shoulderL.z': .04, 'shoulderR.z': -.04, 'elbowL.x': -.05, 'elbowR.x': -.05 },
  holdLow: { 'shoulderR.x': -.9, 'elbowR.x': -.9, 'head.x': .3, 'spine.x': .1 },
};

// Brow tilt (left, right), brow lift, mouth shape.
const FACES = {
  neutral: { brow: [0, 0], lift: 0, mouth: 'flat' },
  happy: { brow: [-.1, .1], lift: .01, mouth: 'smile' },
  worried: { brow: [.38, -.38], lift: .01, mouth: 'frown' },
  angry: { brow: [-.45, .45], lift: -.012, mouth: 'frown' },
  surprised: { brow: [0, 0], lift: .03, mouth: 'o' },
  confused: { brow: [.35, -.1], lift: .02, mouth: 'flat' },
  sad: { brow: [.45, -.45], lift: 0, mouth: 'frown' },
};

export class Character {
  constructor(stage, { top = '#e0694e', bottom = '#2c3550', hair = '#3b2a22', skin = '#c98d6a', shoes = '#25262c' } = {}) {
    this.stage = stage;
    const { root, body } = prop();
    this.root = root; this.body = body;
    const m = {
      skin: M(skin), top: M(top), bottom: M(bottom), hair: M(hair, { roughness: .9 }), shoes: M(shoes),
      eye: M('#17181d', { roughness: .3 }), white: M('#fbf7f0'),
    };
    const pelvis = this.pelvis = group(body, 0, .8, 0);
    const hips = mesh(new THREE.SphereGeometry(.15, 18, 12), m.bottom, pelvis);
    hips.scale.set(1.05, .7, .8);

    // legs: s = +1 is her left (+x)
    const leg = s => {
      const hip = group(pelvis, s * .08, -.02, 0);
      capsule(.065, .28, m.bottom, 0, -.2, 0, hip);
      const knee = group(hip, 0, -.39, 0);
      capsule(.058, .27, m.bottom, 0, -.18, 0, knee);
      box(.11, .07, .2, m.shoes, 0, -.39, .035, knee);
      return { hip, knee };
    };
    const L = leg(1), R = leg(-1);

    const spine = this.spine = group(pelvis, 0, .02, 0);
    const torso = capsule(.16, .26, m.top, 0, .24, 0, spine);
    torso.scale.z = .78;
    box(.13, .2, .02, m.white, 0, .2, .118, spine);           // shirt under the blazer
    mesh(new THREE.CylinderGeometry(.05, .055, .08, 12), m.skin, spine, 0, .45, 0);

    const head = this.head = group(spine, 0, .48, 0);
    sph(.2, m.skin, 0, .2, 0, head, 28, 20);
    sph(.022, m.skin, 0, .17, .2, head, 10, 8);              // nose
    for (const s of [-1, 1]) sph(.035, m.skin, s * .2, .19, 0, head, 10, 8);  // ears
    const cap = mesh(new THREE.SphereGeometry(.216, 28, 16, 0, Math.PI * 2, 0, Math.PI * .34), m.hair, head, 0, .2, 0);
    cap.rotation.x = -.18;
    mesh(new THREE.SphereGeometry(.219, 28, 16, Math.PI, Math.PI, 0, Math.PI * .72), m.hair, head, 0, .2, 0);
    sph(.1, m.hair, 0, .36, -.16, head, 16, 12);              // bun

    this.eyes = [-1, 1].map(s => { const e = sph(.027, m.eye, s * .073, .215, .178, head, 12, 10); e.scale.y = 1.3; return e; });
    this.brows = [1, -1].map(s => box(.08, .016, .02, m.hair, s * .075, .27, .182, head));
    const mouth = this.mouth = group(head, 0, .115, .186);
    this.mouthArc = mesh(new THREE.TorusGeometry(.045, .011, 6, 18, Math.PI), m.eye, mouth);
    this.mouthO = mesh(new THREE.TorusGeometry(.026, .01, 6, 16), m.eye, mouth);
    this.mouthO.visible = false;
    this.headTop = group(head, 0, .62, 0);                    // anchor for stickers and bubbles

    const arm = s => {
      const shoulder = group(spine, s * .205, .37, 0);
      capsule(.052, .16, m.top, 0, -.12, 0, shoulder);
      const elbow = group(shoulder, 0, -.25, 0);
      capsule(.046, .15, m.top, 0, -.1, 0, elbow);
      const hand = group(elbow, 0, -.25, 0);
      sph(.055, m.skin, 0, 0, 0, hand, 12, 10);
      return { shoulder, elbow, hand };
    };
    const AL = arm(1), AR = arm(-1);
    this.handR = AR.hand; this.handL = AL.hand;

    this.j = {
      hipL: L.hip, hipR: R.hip, kneeL: L.knee, kneeR: R.knee,
      shoulderL: AL.shoulder, shoulderR: AR.shoulder, elbowL: AL.elbow, elbowR: AR.elbow,
      spine, head,
    };
    castShadows(root);

    this.face = { ...FACES.neutral };
    this.blinkT = 2; this.blinkOn = 0;
    this.flags = { walking: false, typing: false, waving: false, talking: false, pacing: false, stomping: false };
    this.phase = 0;
    this.current = { ...NEUTRAL };
    this.applyChannels(this.current);
    this.setExpression('neutral', 0);
    stage.onTick((t, dt) => this.tick(t, dt));
  }

  /* ---------- joints ---------- */
  channel(key, value) {
    if (key === 'pelvis') { this.pelvis.position.y = value; return; }
    const [j, axis] = key.split('.');
    this.j[j].rotation[axis] = value;
  }
  applyChannels(values) { for (const k in values) this.channel(k, values[k]); }

  pose(name, { duration = 450, easing = ease.inOutCubic, extra = {}, tag = 'story' } = {}) {
    const goal = { ...NEUTRAL, ...POSES[name], ...extra };
    const from = { ...this.current };
    this.poseName = name;
    this.poseAnim?.cancel();
    if (!duration) { this.current = goal; this.applyChannels(goal); return Promise.resolve(true); }
    this.poseAnim = this.stage.tweens.add({
      duration, easing, tag,
      onUpdate: t => { for (const k in goal) this.current[k] = lerp(from[k], goal[k], t); this.applyChannels(this.current); },
    });
    return this.poseAnim.done;
  }

  /* ---------- face ---------- */
  setExpression(name, duration = 220) {
    const f = FACES[name] ?? FACES.neutral, from = this.face;
    this.expression = name;
    const shape = () => {
      this.mouthO.visible = f.mouth === 'o';
      this.mouthArc.visible = f.mouth !== 'o';
      if (f.mouth === 'smile') { this.mouthArc.rotation.z = Math.PI; this.mouthArc.scale.set(1, .9, 1); this.mouthArc.position.y = .03; }
      else if (f.mouth === 'frown') { this.mouthArc.rotation.z = 0; this.mouthArc.scale.set(.8, .55, 1); this.mouthArc.position.y = -.015; }
      else { this.mouthArc.rotation.z = Math.PI; this.mouthArc.scale.set(.8, .18, 1); this.mouthArc.position.y = .005; }
    };
    shape();
    const set = t => {
      this.brows[0].rotation.z = lerp(from.brow[0], f.brow[0], t);
      this.brows[1].rotation.z = lerp(from.brow[1], f.brow[1], t);
      const lift = lerp(from.lift, f.lift, t);
      this.brows.forEach(b => { b.position.y = .27 + lift; });
      this.face = { brow: [this.brows[0].rotation.z, this.brows[1].rotation.z], lift, mouth: f.mouth };
    };
    if (!duration) { set(1); return; }
    this.stage.uiTweens.add({ duration, easing: ease.outCubic, onUpdate: set });
  }

  /* ---------- locomotion ---------- */
  faceTo(yaw, duration = 300) {
    const a = this.root.rotation.y, b = shortestAngle(a, yaw);
    return this.stage.tweens.add({ duration, easing: ease.inOutCubic, tag: 'story', onUpdate: t => { this.root.rotation.y = lerp(a, b, t); } }).done;
  }

  async walkTo(x, z, { speed = 1.5, face } = {}) {
    const p = this.root.position, dx = x - p.x, dz = z - p.z, dist = Math.hypot(dx, dz);
    if (dist < .01) return;
    await this.faceTo(Math.atan2(dx, dz), 260);
    this.pose('stand', { duration: 150 });
    this.flags.walking = true;
    const x0 = p.x, z0 = p.z;
    const ok = await this.stage.tweens.add({ duration: dist / speed * 1000, easing: ease.inOutSine, tag: 'story', onUpdate: t => { p.x = lerp(x0, x, t); p.z = lerp(z0, z, t); } }).done;
    this.flags.walking = false;
    if (!ok) return;
    await this.pose('stand', { duration: 200 });
    if (face != null) await this.faceTo(face);
  }

  placeAt(x, y, z, yaw = 0) { this.root.position.set(x, y, z); this.root.rotation.y = yaw; }

  /* ---------- per-frame life ---------- */
  tick(t, dt) {
    this.spine.scale.y = 1 + Math.sin(t * 2.2) * .012;

    this.blinkT -= dt;
    if (this.blinkT < 0) { this.blinkT = 2.4 + Math.random() * 2.6; this.blinkOn = .12; }
    if (this.blinkOn > 0) this.blinkOn -= dt;
    const ey = this.blinkOn > 0 ? .12 : 1.3;
    this.eyes.forEach(e => { e.scale.y = ey; });

    if (this.flags.talking) {
      this.mouthO.visible = true; this.mouthArc.visible = false;
      this.mouthO.scale.y = .35 + Math.abs(Math.sin(t * 13)) * .75;
    }

    const j = this.j;
    if (this.flags.walking) {
      this.phase += dt * 8.5;
      const s = Math.sin(this.phase), c = Math.cos(this.phase);
      j.hipL.rotation.x = s * .5; j.hipR.rotation.x = -s * .5;
      j.kneeL.rotation.x = Math.max(0, -c) * .75; j.kneeR.rotation.x = Math.max(0, c) * .75;
      j.shoulderL.rotation.x = -s * .4; j.shoulderR.rotation.x = s * .4;
      this.pelvis.position.y = .8 + Math.abs(c) * .025;
    }
    if (this.flags.typing) {
      // tap around the pose's own arm angles so typing never dips into the desk
      const c = this.current;
      j.elbowL.rotation.x = c['elbowL.x'] + Math.sin(t * 21) * .06;
      j.elbowR.rotation.x = c['elbowR.x'] + Math.sin(t * 21 + 1.9) * .06;
      j.head.rotation.x = c['head.x'] + Math.sin(t * 1.3) * .03;
    }
    if (this.flags.waving) j.shoulderR.rotation.z = -2.6 + Math.sin(t * 10) * .28;
    if (this.flags.stomping) {
      const k = Math.max(0, Math.sin(t * 9));
      j.hipR.rotation.x = -k * .45; j.kneeR.rotation.x = k * .6;
    }
  }
}
