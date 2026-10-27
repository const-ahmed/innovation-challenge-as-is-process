// The pre-submission checker: a small floating robot in the accent teal.
import * as THREE from 'three';
import { M, mesh, sph, capsule, cyl, group, prop, castShadows, canvasTex, glowTexture } from '../engine/kit.js';
import { ease, lerp } from '../engine/tween.js';

export class Assistant {
  constructor(stage) {
    this.stage = stage;
    const { root, body } = prop();
    this.root = root; this.body = body;
    const teal = M('#1aa3a1', { roughness: .45 }), deep = M('#13807e'), white = M('#fbf7f0', { roughness: .4 }), ink = M('#17181d');
    const float = this.float = group(body, 0, 0, 0);

    const shell = capsule(.2, .1, teal, 0, 0, 0, float);
    shell.scale.set(1, 1, .9);
    const face = mesh(new THREE.SphereGeometry(.15, 24, 16), white, float, 0, .05, .12);
    face.scale.set(1.15, .85, .45);
    this.eyes = [-1, 1].map(s => { const e = capsule(.022, .03, ink, s * .06, .06, .19, float); return e; });
    this.mouth = mesh(new THREE.TorusGeometry(.035, .01, 6, 14, Math.PI), ink, float, 0, .015, .19);
    this.mouth.rotation.z = Math.PI;

    // a white tick on its belly: what it does
    const badge = canvasTex(128, 128, (g, w, h) => {
      g.fillStyle = '#fbf7f0'; g.beginPath(); g.arc(64, 64, 60, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#13807e'; g.lineWidth = 16; g.lineCap = 'round'; g.lineJoin = 'round';
      g.beginPath(); g.moveTo(34, 66); g.lineTo(56, 88); g.lineTo(96, 42); g.stroke();
    });
    const b = mesh(new THREE.CircleGeometry(.065, 24), new THREE.MeshStandardMaterial({ map: badge, transparent: true, roughness: .5 }), float, 0, -.13, .165);
    b.rotation.x = -.35;

    cyl(.012, .14, deep, 0, .24, 0, float, 8);
    this.bulb = sph(.04, new THREE.MeshStandardMaterial({ color: '#ffd166', emissive: '#ffb703', emissiveIntensity: .9 }), 0, .4, 0, float, 12, 10);
    const ring = mesh(new THREE.TorusGeometry(.13, .025, 8, 24), deep, float, 0, -.24, 0);
    ring.rotation.x = Math.PI / 2;

    const arm = s => {
      const sh = group(float, s * .215, .0, 0);
      capsule(.03, .1, teal, 0, -.08, 0, sh);
      sph(.04, white, 0, -.17, 0, sh, 10, 8);
      sh.rotation.z = s * .25;
      return sh;
    };
    this.armL = arm(1); this.armR = arm(-1);

    // jet glow under it
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: '#6fe3df', transparent: true, opacity: .55, depthWrite: false, blending: THREE.AdditiveBlending }));
    glow.scale.set(.3, .12, 1); glow.position.y = -.3; glow.layers.set(1);
    float.add(glow);
    this.glow = glow;

    this.anchor = group(float, 0, .55, 0);
    castShadows(root);
    root.visible = false;
    this.flags = { bob: true, spin: false };
    stage.onTick((t, dt) => this.tick(t, dt));
  }

  tick(t) {
    if (this.flags.bob) { this.float.position.y = Math.sin(t * 2.6) * .04; this.float.rotation.z = Math.sin(t * 1.7) * .05; }
    this.glow.material.opacity = .4 + Math.sin(t * 14) * .15;
    this.bulb.material.emissiveIntensity = .7 + Math.sin(t * 4) * .3;
    const blink = (t % 3.3) < .1 ? .15 : 1;
    this.eyes.forEach(e => { e.scale.y = blink * this.eyeScale; });
  }
  get eyeScale() { return this._eyeScale ?? 1; }
  set eyeScale(v) { this._eyeScale = v; }

  setHappy(on) {
    this.eyeScale = on ? .45 : 1;
    this.mouth.scale.set(on ? 1.25 : 1, on ? 1.2 : 1, 1);
  }

  appear({ duration = 520 } = {}) {
    this.root.visible = true;
    this.root.scale.setScalar(.001);
    return this.stage.tweens.add({ duration, easing: ease.outBack, tag: 'story', onUpdate: t => this.root.scale.setScalar(Math.max(.001, t)) }).done;
  }
  vanish({ duration = 380 } = {}) {
    return this.stage.tweens.add({ duration, easing: ease.inBack, tag: 'story', onUpdate: t => this.root.scale.setScalar(Math.max(.001, 1 - t)), onComplete: () => { this.root.visible = false; } }).done;
  }

  // Fly along a gentle arc, banking into the turn and ending facing `yaw`.
  flyTo(to, { duration = 1100, lift = .5, yaw } = {}) {
    const p = this.root.position, from = p.clone(), goal = new THREE.Vector3(...to);
    const y0 = this.root.rotation.y, y1 = yaw ?? y0;
    return this.stage.tweens.add({
      duration, easing: ease.inOutCubic, tag: 'story',
      onUpdate: (t, raw) => {
        p.lerpVectors(from, goal, t);
        p.y += Math.sin(Math.PI * t) * lift;
        this.root.rotation.y = lerp(y0, y1, t);
        this.body.rotation.z = Math.sin(Math.PI * raw) * -.25;
      },
    }).done;
  }

  async tap(times = 2) {
    for (let i = 0; i < times; i++) {
      await this.stage.tweens.add({ duration: 160, easing: ease.outCubic, tag: 'story', onUpdate: t => { this.armR.rotation.x = -1.6 * t; } }).done;
      await this.stage.tweens.add({ duration: 160, easing: ease.inCubic, tag: 'story', onUpdate: t => { this.armR.rotation.x = -1.6 * (1 - t) - .3 * (1 - t); } }).done;
    }
    this.armR.rotation.x = 0;
  }

  point(on = true, duration = 300) {
    const a = this.armR.rotation.x, b = on ? -1.5 : 0;
    return this.stage.tweens.add({ duration, easing: ease.outCubic, tag: 'story', onUpdate: t => { this.armR.rotation.x = lerp(a, b, t); } }).done;
  }

  spin(duration = 700) {
    const a = this.body.rotation.y;
    return this.stage.tweens.add({ duration, easing: ease.inOutCubic, tag: 'story', onUpdate: t => { this.body.rotation.y = a + t * Math.PI * 2; } }).done;
  }

  wave(duration = 1200) {
    return this.stage.tweens.add({ duration, tag: 'story', onUpdate: (t, raw) => { this.armL.rotation.z = 2.4 + Math.sin(raw * 20) * .3; }, onComplete: () => { this.armL.rotation.z = .25; } }).done;
  }
}
