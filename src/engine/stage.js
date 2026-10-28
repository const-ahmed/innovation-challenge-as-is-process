// The rendering core lifted from the Arduino bench: orthographic camera, soft VSM ground
// shadow, fading grid, ink-outline post pass, hover-lift and click-to-select.
// Adds a camera rig (pan / zoom / orbit / follow), a pausable story clock and day-night mood.
import * as THREE from 'three';
import { ease, lerp, clamp, Clock, Tweens } from './tween.js';

const LIGHT_DIR = new THREE.Vector3(64, 104, -34).normalize();
const FAR = 6000, CAM_DIST = 3000;   // room for the whole world map in view
const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3();

const isShown = o => { for (; o; o = o.parent) if (!o.visible) return false; return true; };

export class Stage {
  constructor(canvas, { background = '#f4eadb', line = '#141a2c', groundY = 0 } = {}) {
    this.canvas = canvas;
    this.clock = new Clock();          // story time: pausable
    this.uiClock = new Clock();        // hover, ring, free-look: always live
    this.tweens = new Tweens(this.clock);
    this.uiTweens = new Tweens(this.uiClock);
    this.ticks = new Set();
    this.hooks = {};

    const r = this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.VSMShadowMap;
    r.shadowMap.autoUpdate = false;

    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, FAR);
    this.view = { target: new THREE.Vector3(), span: 60, azimuth: -.5, elevation: .62, sx: .5, sy: .52 };
    this.user = { az: 0, zoom: 1 };
    this.follow = null;
    this.size = { w: 1, h: 1, dpr: 1 };
    this.mood = { bg: new THREE.Color(background), light: 1 };

    this.setupLights();
    this.setupGround(groundY);
    this.setupPost(line);
    this.setupPicking();
    addEventListener('resize', () => this.resize());
    this.resize();
    this.last = performance.now();
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  /* ---------- lights + ground ---------- */
  setupLights() {
    this.hemi = new THREE.HemisphereLight('#fffaf3', '#c2ae90', 1.7);
    this.ambient = new THREE.AmbientLight('#ffffff', .35);
    this.key = new THREE.DirectionalLight('#fff6ea', 1.7);
    this.key.position.set(-55, 100, 62);
    this.dayColor = new THREE.Color('#fff6ea');
    this.nightColor = new THREE.Color('#9fb3ff');
    // A near-zero light whose only job is throwing the soft shadow onto the ground.
    const s = this.shade = new THREE.DirectionalLight('#ffffff', .001);
    s.castShadow = true;
    s.shadow.mapSize.set(2048, 2048);
    s.shadow.radius = 11;
    s.shadow.blurSamples = 20;
    s.shadow.bias = -4e-4;
    this.scene.add(this.hemi, this.ambient, this.key, s, s.target);
  }

  setupGround(y) {
    const g = new THREE.Mesh(new THREE.PlaneGeometry(16000, 16000), new THREE.ShadowMaterial({ color: '#7a5532', opacity: .3, depthWrite: false }));
    g.rotation.x = -Math.PI / 2; g.position.y = y; g.receiveShadow = true; g.layers.set(1); g.renderOrder = -1;
    this.gridMat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      uniforms: { color: { value: new THREE.Color('#d9c7ae') }, cell: { value: 9 }, fine: { value: 0 }, center: { value: new THREE.Vector2() }, inner: { value: 60 }, outer: { value: 140 } },
      vertexShader: `varying vec2 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.); vW = w.xz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: `uniform vec3 color; uniform float cell, fine, inner, outer; uniform vec2 center; varying vec2 vW;
        float gridLine(float c){ vec2 p = vW / c; vec2 g = abs(fract(p - .5) - .5) / fwidth(p); return 1. - min(min(g.x, g.y), 1.); }
        void main(){
          float line = max(gridLine(cell * 3.), gridLine(cell) * (1. - fine));
          float fade = 1. - smoothstep(inner, outer, length(vW - center));
          gl_FragColor = vec4(color, line * fade * .9); }`,
    });
    const grid = new THREE.Mesh(new THREE.PlaneGeometry(16000, 16000), this.gridMat);
    grid.rotation.x = -Math.PI / 2; grid.position.y = y - .02; grid.layers.set(1); grid.renderOrder = -2;
    this.scene.add(g, grid);
  }

  /* ---------- ink-outline post pass ---------- */
  setupPost(line) {
    this.rtColor = new THREE.WebGLRenderTarget(1, 1, { samples: 4, type: THREE.HalfFloatType });
    this.rtNormal = new THREE.WebGLRenderTarget(1, 1);
    this.rtNormal.depthTexture = new THREE.DepthTexture(1, 1);
    this.normalMat = new THREE.MeshNormalMaterial();
    this.post = new THREE.ShaderMaterial({
      uniforms: {
        tColor: { value: this.rtColor.texture }, tNormal: { value: this.rtNormal.texture }, tDepth: { value: this.rtNormal.depthTexture },
        texel: { value: new THREE.Vector2() }, thick: { value: 1.3 }, dthr: { value: .001 }, lineColor: { value: new THREE.Color(line) },
      },
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }`,
      fragmentShader: `uniform sampler2D tColor, tNormal, tDepth; uniform vec2 texel; uniform float thick, dthr; uniform vec3 lineColor; varying vec2 vUv;
        void main(){
          vec2 ox = vec2(texel.x * thick, 0.), oy = vec2(0., texel.y * thick);
          vec4 c = texture2D(tColor, vUv);
          vec4 nl = texture2D(tNormal, vUv - ox), nr = texture2D(tNormal, vUv + ox), nu = texture2D(tNormal, vUv + oy), nd = texture2D(tNormal, vUv - oy);
          float dc = texture2D(tDepth, vUv).x, dl = texture2D(tDepth, vUv - ox).x, dr = texture2D(tDepth, vUv + ox).x, du = texture2D(tDepth, vUv + oy).x, dd = texture2D(tDepth, vUv - oy).x;
          float nE = max(length(nl - nr), length(nu - nd));
          float dE = max(abs(dl + dr - 2. * dc), abs(du + dd - 2. * dc));
          float e = max(smoothstep(.3, .65, nE), smoothstep(dthr, dthr * 2.2, dE));
          gl_FragColor = vec4(mix(c.rgb, lineColor, e * .94), 1.);
          #include <colorspace_fragment>
        }`,
      depthTest: false, depthWrite: false,
    });
    this.postScene = new THREE.Scene();
    this.postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.post));
  }

  /* ---------- hover, select, free-look ---------- */
  setupPicking() {
    this.interactives = [];
    this.raycaster = new THREE.Raycaster();
    this.ndc = new THREE.Vector2();
    this.hovered = this.selected = this.pointer = null;
    this.pointerDirty = false;

    const ring = this.ring = new THREE.Group();
    const m1 = new THREE.MeshBasicMaterial({ color: '#1aa3a1', transparent: true, opacity: .85, depthWrite: false });
    const m2 = m1.clone(); m2.opacity = .45;
    for (const [geo, m] of [[new THREE.RingGeometry(.93, 1, 72), m1], [new THREE.RingGeometry(.8, .84, 72), m2]]) {
      const mesh = new THREE.Mesh(geo, m);
      mesh.rotation.x = -Math.PI / 2; mesh.layers.set(1); ring.add(mesh);
    }
    ring.visible = false; ring.renderOrder = 5;
    this.scene.add(ring);

    const c = this.canvas;
    let down = null;
    c.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY, az: this.user.az, moved: false, id: e.pointerId }; });
    addEventListener('pointermove', e => {
      if (e.target === c) { this.pointer = { x: e.clientX, y: e.clientY }; this.pointerDirty = true; this.hooks.pointer?.(e.clientX, e.clientY); }
      if (!down || down.id !== e.pointerId) return;
      const dx = e.clientX - down.x;
      if (!down.moved && Math.hypot(dx, e.clientY - down.y) > 6) { down.moved = true; c.classList.add('is-dragging'); this.setHovered(null); }
      if (down.moved) this.user.az = clamp(down.az - dx * .005, -.75, .75);
    });
    addEventListener('pointerup', e => {
      if (!down) return;
      const d = down; down = null;
      c.classList.remove('is-dragging');
      if (d.moved || e.target !== c) return;
      const hit = this.pick(e.clientX, e.clientY);
      this.select(hit && hit === this.selected ? null : hit);
      if (e.pointerType !== 'mouse') this.setHovered(hit);
    });
    c.addEventListener('pointerleave', () => { this.pointer = null; if (!down) this.setHovered(null); });
    c.addEventListener('wheel', e => {
      e.preventDefault();
      this.user.zoom = clamp(this.user.zoom * Math.exp(-e.deltaY * .0012), .6, 2.6);
    }, { passive: false });
    c.addEventListener('dblclick', () => this.resetUserView());
  }

  resetUserView(duration = 700) {
    const a = this.user.az, z = this.user.zoom;
    return this.uiTweens.add({ duration, easing: ease.inOutCubic, onUpdate: t => { this.user.az = lerp(a, 0, t); this.user.zoom = lerp(z, 1, t); } }).done;
  }

  register(root, info, { body = root.userData.body ?? root, lift = .3, ringY = null } = {}) {
    const item = { root, body, info, lift, ringY, hoverY: 0 };
    root.userData.interactive = item;
    this.interactives.push(item);
    return item;
  }

  pick(x, y) {
    const r = this.canvas.getBoundingClientRect();
    this.ndc.set((x - r.left) / r.width * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
    this.raycaster.setFromCamera(this.ndc, this.camera);
    const roots = this.interactives.filter(i => isShown(i.root)).map(i => i.root);
    for (const h of this.raycaster.intersectObjects(roots, true)) {
      if (!isShown(h.object)) continue;
      for (let o = h.object; o; o = o.parent) if (o.userData.interactive) return o.userData.interactive;
    }
    return null;
  }

  setHovered(item) {
    if (this.hovered === item) return;
    const lift = (it, to) => {
      if (!it || !it.lift) return;
      const from = it.hoverY;
      it.anim?.cancel();
      it.anim = this.uiTweens.add({ duration: 220, easing: ease.outCubic, onUpdate: t => { it.hoverY = lerp(from, to, t); it.body.position.y = it.hoverY; } });
    };
    lift(this.hovered, 0);
    this.hovered = item;
    lift(item, item?.lift ?? 0);
    this.canvas.classList.toggle('is-pointing', !!item);
    this.hooks.hover?.(item?.info ?? null);
  }

  select(item) {
    this.selected = item;
    this.ringAnim?.cancel();
    if (!item) { this.ring.visible = false; this.hooks.select?.(null); return; }
    const root = item.root;
    root.updateWorldMatrix(true, true);
    const b = new THREE.Box3().setFromObject(root, true);
    const p = root.getWorldPosition(new THREE.Vector3());
    const c = b.getCenter(new THREE.Vector3()), s = b.getSize(new THREE.Vector3());
    item.ringOffset = c.sub(p);
    item.ringSeat = b.min.y - p.y - item.hoverY;
    const radius = Math.max(.55, Math.hypot(s.x, s.z) / 2 * 1.06 + Math.min(2.5, .15 + s.y * .08));
    this.ring.visible = true;
    this.ringAnim = this.uiTweens.add({ duration: 420, easing: ease.outBack, onUpdate: t => this.ring.scale.setScalar(radius * (.6 + .4 * t)) });
    this.hooks.select?.(item.info);
  }

  updateRing() {
    const it = this.selected;
    if (!it) return;
    if (!isShown(it.root)) { this.select(null); return; }
    const p = it.root.getWorldPosition(tmp);
    this.ring.position.set(p.x + it.ringOffset.x, it.ringY ?? p.y + it.ringSeat + .06, p.z + it.ringOffset.z);
  }

  toScreen(v, out = {}) {
    tmp2.copy(v).project(this.camera);
    out.x = (tmp2.x * .5 + .5) * this.size.w;
    out.y = (-tmp2.y * .5 + .5) * this.size.h;
    out.on = tmp2.z > -1 && tmp2.z < 1;
    return out;
  }

  /* ---------- camera rig ---------- */
  ppm() {
    const { w, h } = this.size, s = this.view.span;
    return Math.min(w / s, h / (s * .62)) * this.user.zoom;
  }

  jumpCamera(to) {
    const v = this.view;
    for (const k of ['span', 'azimuth', 'elevation', 'sx', 'sy']) if (to[k] != null) v[k] = to[k];
    this.follow = null;
    if (to.follow) { this.followObject(to.follow, to.offset, to.k); to.follow.updateWorldMatrix(true, false); v.target.copy(to.follow.getWorldPosition(tmp).add(this.follow.offset)); }
    else if (to.target) v.target.set(...to.target);
  }

  // Ease to a framing. `follow` locks onto a moving object; `arc` pulls out mid-move.
  moveCamera(to, { duration = 1600, easing = ease.inOutCubic, tag = 'story', arc = 0 } = {}) {
    const v = this.view;
    const from = { target: v.target.clone(), span: v.span, azimuth: v.azimuth, elevation: v.elevation, sx: v.sx, sy: v.sy };
    const follow = to.follow ? { obj: to.follow, offset: new THREE.Vector3(...(to.offset ?? [0, 0, 0])), k: to.k ?? 4 } : null;
    const fixed = to.target ? new THREE.Vector3(...to.target) : null;
    const goal = new THREE.Vector3();
    const s0 = Math.log(from.span), s1 = Math.log(to.span ?? from.span);
    const az1 = to.azimuth != null ? from.azimuth + Math.atan2(Math.sin(to.azimuth - from.azimuth), Math.cos(to.azimuth - from.azimuth)) : null;
    this.follow = null;
    return this.tweens.add({
      duration, easing, tag,
      onUpdate: k => {
        if (follow) follow.obj.getWorldPosition(goal).add(follow.offset);
        else goal.copy(fixed ?? from.target);
        v.target.lerpVectors(from.target, goal, k);
        v.span = Math.exp(lerp(s0, s1, k)) * (1 + arc * Math.sin(Math.PI * k));
        if (az1 != null) v.azimuth = lerp(from.azimuth, az1, k);
        for (const key of ['elevation', 'sx', 'sy']) if (to[key] != null) v[key] = lerp(from[key], to[key], k);
      },
      onComplete: () => { if (follow) this.follow = follow; },
    }).done;
  }

  followObject(obj, offset = [0, 0, 0], k = 4) { this.follow = { obj, offset: new THREE.Vector3(...offset), k }; }

  placeCamera(dt) {
    const v = this.view;
    if (this.follow) {
      this.follow.obj.getWorldPosition(tmp).add(this.follow.offset);
      v.target.lerp(tmp, 1 - Math.exp(-dt * this.follow.k));
    }
    const { w, h } = this.size, ppm = this.ppm(), az = v.azimuth + this.user.az, el = v.elevation;
    // On narrow screens the form docks at the bottom, so frame the action in the top half instead.
    const narrow = w < 760, formUp = narrow && document.body.classList.contains('has-form');
    const cx = w * (narrow ? .5 : v.sx), cy = h * (formUp ? .3 : v.sy), c = this.camera, T = v.target;
    c.left = -cx / ppm; c.right = (w - cx) / ppm; c.top = cy / ppm; c.bottom = -(h - cy) / ppm;
    c.updateProjectionMatrix();
    c.position.set(T.x + Math.sin(az) * Math.cos(el) * CAM_DIST, T.y + Math.sin(el) * CAM_DIST, T.z + Math.cos(az) * Math.cos(el) * CAM_DIST);
    c.lookAt(T);
    c.updateMatrixWorld();

    const viewW = w / ppm;
    this.post.uniforms.dthr.value = Math.max(.12, viewW * .0028) / FAR;

    const half = Math.min(260, viewW * .75 + 6), sc = this.shade.shadow.camera;
    this.shade.target.position.copy(T);
    this.shade.position.copy(T).addScaledVector(LIGHT_DIR, 300);
    sc.left = -half; sc.right = half; sc.top = half; sc.bottom = -half; sc.near = 50; sc.far = 600;
    sc.updateProjectionMatrix();

    const u = this.gridMat.uniforms, lv = Math.log(viewW / 60) / Math.log(3), l = Math.floor(lv);
    u.cell.value = 9 * 3 ** l; u.fine.value = lv - l;
    u.center.value.set(T.x, T.z);
    u.inner.value = viewW * .32; u.outer.value = viewW * .7;
  }

  /* ---------- mood (background + light level) ---------- */
  setMood({ bg, light } = {}) {
    if (bg) this.mood.bg.set(bg);
    if (light != null) this.mood.light = light;
    this.applyMood();
  }
  tweenMood({ bg, light }, { duration = 1200, tag = 'story', easing = ease.inOutSine } = {}) {
    const b0 = this.mood.bg.clone(), b1 = bg ? new THREE.Color(bg) : b0.clone(), l0 = this.mood.light, l1 = light ?? l0;
    return this.tweens.add({ duration, easing, tag, onUpdate: t => { this.mood.bg.lerpColors(b0, b1, t); this.mood.light = lerp(l0, l1, t); this.applyMood(); } }).done;
  }
  applyMood() {
    const l = this.mood.light;
    this.hemi.intensity = 1.7 * l;
    this.key.intensity = 1.7 * l;
    this.ambient.intensity = .35 * (.6 + .4 * l);
    this.key.color.lerpColors(this.nightColor, this.dayColor, clamp(l, 0, 1));
    this.gridMat.uniforms.color.value.copy(this.mood.bg).multiplyScalar(.86);
    this.hooks.mood?.(this.mood);
  }

  /* ---------- frame loop ---------- */
  onTick(fn) { this.ticks.add(fn); return () => this.ticks.delete(fn); }

  resize() {
    const w = innerWidth, h = innerHeight, dpr = Math.min(2, devicePixelRatio || 1);
    this.size = { w, h, dpr };
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h, false);
    this.rtColor.setSize(w * dpr, h * dpr);
    this.rtNormal.setSize(w * dpr, h * dpr);
    this.post.uniforms.texel.value.set(1 / (w * dpr), 1 / (h * dpr));
    this.post.uniforms.thick.value = 1.3 * dpr;
    this.hooks.resize?.(w, h);
  }

  loop(now) {
    requestAnimationFrame(this.loop);
    const real = Math.max(0, Math.min(64, now - this.last));
    this.last = now;
    this.uiClock.step(real);
    this.clock.step(real);
    const dt = this.clock.paused ? 0 : real / 1000 * this.clock.rate;
    this.tweens.update();
    this.uiTweens.update();
    const t = this.clock.now / 1000;
    for (const f of this.ticks) f(t, dt);
    if (this.pointer && this.pointerDirty) { this.pointerDirty = false; this.setHovered(this.pick(this.pointer.x, this.pointer.y)); }
    this.placeCamera(real / 1000);
    this.updateRing();
    this.hooks.frame?.();
    this.render();
  }

  // A still of the current view, w pixels wide, as a canvas. Runs story time forward
  // first (without waiting for frames) so snapped poses and fades finish.
  snapshot(w, settle = 800) {
    const user = this.user;
    this.user = { az: 0, zoom: 1 };   // the scripted framing, not wherever the viewer has dragged
    for (let t = 0; t < settle; t += 50) {
      this.clock.now += 50;
      this.tweens.update();
      for (const f of this.ticks) f(this.clock.now / 1000, .05);
    }
    this.placeCamera(1);
    this.render();
    this.user = user;
    const src = this.canvas, out = document.createElement('canvas');
    out.width = w;
    out.height = Math.round(w * src.height / src.width);
    out.getContext('2d').drawImage(src, 0, 0, out.width, out.height);
    return out;
  }

  render() {
    const r = this.renderer;
    r.shadowMap.needsUpdate = true;
    this.camera.layers.enableAll();
    r.setClearColor(this.mood.bg, 1);
    r.setRenderTarget(this.rtColor);
    r.render(this.scene, this.camera);

    this.camera.layers.set(0);
    this.scene.overrideMaterial = this.normalMat;
    r.setClearColor(0x000000, 0);
    r.setRenderTarget(this.rtNormal);
    r.render(this.scene, this.camera);
    this.scene.overrideMaterial = null;

    r.setRenderTarget(null);
    r.render(this.postScene, this.postCam);
  }
}
