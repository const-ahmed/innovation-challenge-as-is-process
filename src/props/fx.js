// Short-lived particles: wake foam, smoke puffs, sparkles and orange confetti.
// They run on the UI clock so they finish even if the story jumps.
import * as THREE from 'three';
import { ease, lerp } from '../engine/tween.js';

export class Fx {
  constructor(stage) {
    this.stage = stage;
    this.sphere = new THREE.SphereGeometry(1, 12, 9);
    this.disc = new THREE.CircleGeometry(1, 18).rotateX(-Math.PI / 2);
  }

  spawn(geo, color, { outline = false, opacity = 1, emissive } = {}) {
    const mat = new THREE.MeshStandardMaterial({ color, transparent: true, opacity, roughness: .9, depthWrite: !emissive, emissive: emissive ?? '#000000' });
    const m = new THREE.Mesh(geo, mat);
    if (!outline) m.layers.set(1);
    this.stage.scene.add(m);
    return m;
  }
  done(m) { this.stage.scene.remove(m); m.material.dispose(); }

  // One wake streak: stretched along the ship's heading, drifting outward as it fades.
  foam(pos, { yaw = 0, side = 0 } = {}) {
    const m = this.spawn(this.disc, '#f4fbfd', { opacity: .8 });
    m.position.copy(pos);
    m.rotation.y = yaw;
    const out = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw)).multiplyScalar(side * 2.2);  // local +z → world
    const p0 = pos.clone(), s0 = .35 + Math.random() * .2;
    this.stage.tweens.add({
      duration: 2200, easing: ease.outCubic,
      onUpdate: t => { m.position.copy(p0).addScaledVector(out, t); m.scale.set(s0 * (2.4 + t * 2), 1, s0 * (1 + t * .6)); m.material.opacity = .8 * (1 - t) ** 1.5; },
      onComplete: () => this.done(m),
    });
  }

  puff(pos, { count = 5, color = '#f6f3ee', size = 1, rise = 4, spread = 1 } = {}) {
    for (let i = 0; i < count; i++) {
      const m = this.spawn(this.sphere, color, { outline: true });
      m.castShadow = false;
      const dir = new THREE.Vector3((Math.random() - .5) * spread, 1, (Math.random() - .5) * spread);
      const p0 = pos.clone();
      this.stage.uiTweens.add({
        delay: i * 140, duration: 1600, easing: ease.outCubic,
        onUpdate: t => {
          m.position.copy(p0).addScaledVector(dir, t * rise);
          m.scale.setScalar(size * (.3 + t * .9) * (1 - Math.max(0, t - .7) / .3 * .9));
          m.material.opacity = 1 - Math.max(0, t - .5) * 2;
        },
        onComplete: () => this.done(m),
      });
    }
  }

  confetti(pos, { count = 26, colors = ['#f39a2b', '#ffd166', '#4f8a3c', '#f39a2b'] } = {}) {
    for (let i = 0; i < count; i++) {
      const m = this.spawn(this.sphere, colors[i % colors.length], { outline: true });
      const v = new THREE.Vector3((Math.random() - .5) * 2.4, 2.6 + Math.random() * 2, (Math.random() - .5) * 2.4);
      const p0 = pos.clone(), s = .06 + Math.random() * .06;
      m.scale.setScalar(s);
      this.stage.uiTweens.add({
        duration: 1600 + Math.random() * 500,
        onUpdate: (t, raw) => {
          const time = raw * 1.6;
          m.position.set(p0.x + v.x * time, p0.y + v.y * time - 4.2 * time * time, p0.z + v.z * time);
          m.material.opacity = 1 - Math.max(0, raw - .75) * 4;
        },
        onComplete: () => this.done(m),
      });
    }
  }

  sparkle(pos, { count = 10, color = '#6fe3df', radius = .7 } = {}) {
    for (let i = 0; i < count; i++) {
      const m = this.spawn(this.sphere, color, { emissive: color });
      const a = (i / count) * Math.PI * 2, p0 = pos.clone();
      this.stage.uiTweens.add({
        duration: 700, easing: ease.outCubic,
        onUpdate: t => {
          m.position.set(p0.x + Math.cos(a) * radius * t, p0.y + Math.sin(a * 2) * .2 * t + t * .2, p0.z + Math.sin(a) * radius * t);
          m.scale.setScalar(lerp(.05, .01, t));
          m.material.opacity = 1 - t;
        },
        onComplete: () => this.done(m),
      });
    }
  }
}
