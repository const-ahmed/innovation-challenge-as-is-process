// The tabletop world map: continents standing up out of an animated sea, port terminals
// on the Florida and English coasts, the UK roads, flags, map lettering and a few clouds.
import * as THREE from 'three';
import { M, box, mesh, group, canvasTex, castShadows, noOutline, font, seeded, sph, cyl } from '../engine/kit.js';
import { COASTS, LABELS, TABLE, project, lonToX, latToZ } from '../story/geo.js';
import { US, UK } from '../story/places.js';

const LAND_TOP = 0, SEA_Y = -.98;

export function buildTerrain(stage) {
  const root = group(stage.scene);
  const W = TABLE.x1 - TABLE.x0, D = TABLE.z1 - TABLE.z0;
  const cx = (TABLE.x0 + TABLE.x1) / 2, cz = (TABLE.z0 + TABLE.z1) / 2;

  // the sea: a slab the size of the table
  box(W, 3, D, [M('#5d97ab'), M('#5d97ab'), M('#7fb4c6'), M('#5d97ab'), M('#5d97ab'), M('#5d97ab')], cx, -4, cz, root);

  // continents
  const soil = M('#b9a27d');
  const shapeOf = ring => new THREE.Shape(ring.map(p => { const [x, z] = project(p); return new THREE.Vector2(x, -z); }));
  for (const [, color, ring] of COASTS) {
    const geo = new THREE.ExtrudeGeometry(shapeOf(ring), { depth: 3, bevelEnabled: false });
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, LAND_TOP - 3, 0);
    mesh(geo, [M(color), soil], root);
  }

  // concrete port terminals where the ship berths
  const quay = M('#cfc8bb');
  for (const p of [US.pad, UK.pad]) box(p.x1 - p.x0, 3.05, p.z1 - p.z0, [soil, soil, quay, soil, soil, soil], (p.x0 + p.x1) / 2, -3, (p.z0 + p.z1) / 2, root);

  // UK roads from the port to the office
  const road = M('#7a7d86'), paint = M('#f4eadb');
  for (const r of UK.roads) box(r.w, .08, r.d, road, r.x, LAND_TOP, r.z, root);
  const north = UK.roads[1];
  for (let z = north.z + north.d / 2 - 2; z > north.z - north.d / 2 + 1; z -= 3) box(.18, .1, 1.3, paint, north.x, LAND_TOP, z, root);

  // the sea surface, with shoreline foam driven by a blurred land mask
  const mask = landMask(W, D);
  const waterMat = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 }, level: { value: 1 }, detail: { value: 1 }, mask: { value: mask }, rect: { value: new THREE.Vector4(TABLE.x0, TABLE.z0, W, D) },
      deep: { value: new THREE.Color('#7db6c8') }, shallow: { value: new THREE.Color('#a6d3dc') }, foam: { value: new THREE.Color('#eef8f9') },
    },
    vertexShader: `varying vec2 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.); vW = w.xz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform float time, level, detail; uniform sampler2D mask; uniform vec4 rect; uniform vec3 deep, shallow, foam; varying vec2 vW;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
        return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }
      void main(){
        float n = noise(vW * .05 + vec2(time * .04, time * .025)) * .6 + noise(vW * .13 - vec2(time * .05, 0.)) * .4;
        // blurred land coverage is .5 on the coast and falls to 0 about ten units out
        float m = texture2D(mask, (vW - rect.xy) / rect.zw).r;
        float d = (.5 - m) * 20. + (n - .5) * .9;
        vec3 col = mix(shallow, deep, smoothstep(1., 9., d));
        col *= .97 + n * .06;

        // foam: a lip on the shore plus two soft bands rolling in
        // close up: a crisp lip and rolling bands; zoomed out these would only be speckle
        float f = (1. - smoothstep(.25, .75, d)) * detail;
        for (int i = 0; i < 2; i++) {
          float ph = fract(time * .16 + float(i) * .5);
          float r = mix(3.6, .5, ph);
          f += (1. - smoothstep(.08, .38, abs(d - r))) * sin(3.1416 * ph) * .6 * detail;
        }

        // flecks: one short dash per cell, each fading in and out on its own beat
        vec2 cell = floor(vW / vec2(7., 5.));
        float h = hash(cell), h2 = hash(cell + 17.);
        vec2 c = (cell + vec2(.2 + .6 * h, .25 + .5 * h2)) * vec2(7., 5.);
        vec2 q = vW - c; q.x += sin(time * .7 + h * 6.) * .4;
        float dash = 1. - smoothstep(.05, .16, length(vec2(max(abs(q.x) - .75, 0.), q.y)));
        float beat = smoothstep(.55, .9, sin(time * .55 + h * 31.));
        f += dash * beat * .55 * smoothstep(3., 6., d) * detail;

        col = mix(col, foam, clamp(f, 0., 1.));
        gl_FragColor = vec4(col * (.45 + .55 * level), 1.); }`,
  });
  const surface = mesh(new THREE.PlaneGeometry(W, D), waterMat, root, cx, SEA_Y, cz);
  surface.rotation.x = -Math.PI / 2;
  noOutline(surface);
  stage.onTick(t => {
    const u = waterMat.uniforms, viewW = stage.size.w / stage.ppm();
    u.time.value = t;
    u.level.value = stage.mood.light;
    u.detail.value = 1 - Math.min(1, Math.max(0, (viewW - 160) / 240));
  });

  // map lettering
  for (const [text, lon, lat, w, sea] of LABELS) {
    const tex = canvasTex(1024, 256, (g, cw, ch) => {
      g.fillStyle = sea ? 'rgba(255,255,255,.6)' : 'rgba(70,80,60,.32)';
      g.font = font(700, text.length > 10 ? 104 : 140); g.textAlign = 'center'; g.textBaseline = 'middle';
      g.letterSpacing = sea ? '22px' : '16px';
      g.fillText(text, cw / 2, ch / 2);
    });
    const p = mesh(new THREE.PlaneGeometry(w, w / 4), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }), root, lonToX(lon), sea ? SEA_Y + .06 : LAND_TOP + .06, latToZ(lat));
    p.rotation.x = -Math.PI / 2;
    noOutline(p);
  }

  // flags at each port
  const flags = [flag(root, ...US.flag, usFlag), flag(root, ...UK.flag, ukFlag)];
  stage.onTick(t => flags.forEach((f, i) => f.wave(t + i)));

  // clouds drifting over the far side of the world, away from the story's shots
  const clouds = [];
  const rnd = seeded(7);
  for (const [lon, lat] of [[-150, 32], [-128, 2], [15, 16], [92, 38], [122, -6], [-22, -28], [72, -32], [150, 45]]) {
    const c = group(root, lonToX(lon), 36 + rnd() * 10, latToZ(lat));
    const cm = M('#fbf7f0', { unique: true, roughness: .95 });
    for (let k = 0; k < 4; k++) sph(10 + rnd() * 7, cm, (k - 1.5) * 12, rnd() * 4, rnd() * 6, c, 14, 10);
    c.userData = { mat: cm, x: c.position.x, phase: rnd() * 6 };
    clouds.push(c);
  }
  stage.onTick(t => clouds.forEach(c => { c.position.x = c.userData.x + Math.sin(t * .05 + c.userData.phase) * 40; }));

  castShadows(root);
  surface.castShadow = false;
  return {
    root, clouds,
    setCloudTone(color) { clouds.forEach(c => c.userData.mat.color.set(color)); },
  };
}

// Land coverage as a soft single-channel texture: 1 on land, .5 on the coast, 0 out at sea.
function landMask(W, D) {
  const mw = 3072, mh = Math.round(mw * D / W);
  const c = document.createElement('canvas');
  c.width = mw; c.height = mh;
  const g = c.getContext('2d');
  const px = x => (x - TABLE.x0) / W * mw, pz = z => (z - TABLE.z0) / D * mh;
  g.fillStyle = '#000'; g.fillRect(0, 0, mw, mh);
  g.fillStyle = '#fff';
  for (const [, , ring] of COASTS) {
    g.beginPath();
    ring.forEach((p, i) => { const [x, z] = project(p); i ? g.lineTo(px(x), pz(z)) : g.moveTo(px(x), pz(z)); });
    g.closePath(); g.fill();
  }
  for (const p of [US.pad, UK.pad]) g.fillRect(px(p.x0), pz(p.z0), px(p.x1) - px(p.x0), pz(p.z1) - pz(p.z0));
  const rgba = g.getImageData(0, 0, mw, mh).data;
  let a = new Float32Array(mw * mh), b = new Float32Array(mw * mh);
  for (let i = 0; i < a.length; i++) a[i] = rgba[i * 4] / 255;
  // three box-blur passes each way approximate a Gaussian
  const r = 3;
  const pass = (src, dst, n, stride, lines, lineStride) => {
    for (let l = 0; l < lines; l++) {
      const o = l * lineStride;
      let sum = 0;
      for (let k = -r; k <= r; k++) sum += src[o + Math.min(n - 1, Math.max(0, k)) * stride];
      for (let i = 0; i < n; i++) {
        dst[o + i * stride] = sum / (2 * r + 1);
        sum += src[o + Math.min(n - 1, i + r + 1) * stride] - src[o + Math.max(0, i - r) * stride];
      }
    }
  };
  for (let k = 0; k < 3; k++) {
    pass(a, b, mw, 1, mh, mw); [a, b] = [b, a];
    pass(a, b, mh, mw, mw, 1); [a, b] = [b, a];
  }
  const data = new Uint8Array(mw * mh);
  for (let i = 0; i < data.length; i++) data[i] = Math.round(a[i] * 255);
  const tex = new THREE.DataTexture(data, mw, mh, THREE.RedFormat, THREE.UnsignedByteType);
  tex.magFilter = tex.minFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

function flag(parent, x, z, draw) {
  const g = group(parent, x, 0, z);
  cyl(.12, 9, M('#d8d6d0', { roughness: .4 }), 0, 0, 0, g, 10);
  sph(.22, M('#d9b65c'), 0, 9.1, 0, g, 10, 8);
  const tex = canvasTex(380, 200, draw);
  const geo = new THREE.PlaneGeometry(3.8, 2, 16, 4);
  mesh(geo, new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide, roughness: .8 }), g, 1.95, 7.6, 0);
  const base = geo.attributes.position.array.slice();
  return {
    wave(t) {
      const a = geo.attributes.position.array;
      for (let i = 0; i < a.length; i += 3) {
        const u = (base[i] + 1.9) / 3.8;
        a[i + 2] = Math.sin(base[i] * 1.6 - t * 4) * .18 * u;
      }
      geo.attributes.position.needsUpdate = true;
      geo.computeVertexNormals();
    },
  };
}

function usFlag(g, w, h) {
  for (let i = 0; i < 13; i++) { g.fillStyle = i % 2 ? '#ffffff' : '#b22234'; g.fillRect(0, i * h / 13, w, h / 13 + 1); }
  g.fillStyle = '#3c3b6e'; g.fillRect(0, 0, w * .4, h * 7 / 13);
  g.fillStyle = '#ffffff';
  for (let r = 0; r < 5; r++) for (let c = 0; c < 6; c++) { g.beginPath(); g.arc(12 + c * 23, 11 + r * 20, 3.6, 0, Math.PI * 2); g.fill(); }
}

function ukFlag(g, w, h) {
  g.fillStyle = '#012169'; g.fillRect(0, 0, w, h);
  g.lineCap = 'butt';
  g.strokeStyle = '#ffffff'; g.lineWidth = h * .2;
  g.beginPath(); g.moveTo(0, 0); g.lineTo(w, h); g.moveTo(w, 0); g.lineTo(0, h); g.stroke();
  g.strokeStyle = '#c8102e'; g.lineWidth = h * .066;
  g.beginPath(); g.moveTo(0, 0); g.lineTo(w, h); g.moveTo(w, 0); g.lineTo(0, h); g.stroke();
  g.fillStyle = '#ffffff'; g.fillRect(w / 2 - h * .17, 0, h * .34, h); g.fillRect(0, h / 2 - h * .17, w, h * .34);
  g.fillStyle = '#c8102e'; g.fillRect(w / 2 - h * .1, 0, h * .2, h); g.fillRect(0, h / 2 - h * .1, w, h * .2);
}
