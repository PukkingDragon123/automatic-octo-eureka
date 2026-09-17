/* ============================================================================
 *  main.js — the game.
 *
 *  One pea dog, one watering can, one valley town, and a whole life cycle.
 *  There is no interface: every single thing you can do, you do by touching
 *  something that exists in the world.
 * ==========================================================================*/

import { rng, clamp, lerp, rgba, makeCanvas, ease, fillEllipse } from './core.js';
import { W, H, ERAS, buildModel, renderVista, renderForeground } from './vista.js';
import {
  renderGround, makeTufts, drawTufts, drawPond, drawSoil, drawCan,
  buildTree, drawTree, groundY, POND, SOIL, CAN_HOME,
} from './stage.js';
import { drawPea, drawSprout, Pup } from './dog.js';
import { FX, glint, drawRays, drawMist } from './fx.js';
import { FlowerIntro } from './intro.js';
import * as SFX from './audio.js';

const R = rng(20260917);

/* ------------------------------------------------------------ boot canvas */

const view = document.getElementById('game');
const vctx = view.getContext('2d', { alpha: false });
vctx.imageSmoothingEnabled = false;
const buf = makeCanvas(W, H);
const ctx = buf.ctx;

/* ------------------------------------------------------------ world cache */

buildModel();
const cache = { vista: [], ground: [], fg: [] };

function bakeEra(i) {
  if (cache.vista[i]) return;
  cache.vista[i] = renderVista(i);
  cache.ground[i] = renderGround(i);
  cache.fg[i] = renderForeground(i);
}
bakeEra(0);
// the rest are baked while the flower is still covering the screen
let bakeQueue = [1, 2, 3, 4, 5];
function bakeNext() {
  const i = bakeQueue.shift();
  if (i === undefined) return;
  bakeEra(i);
  setTimeout(bakeNext, 30);
}
setTimeout(bakeNext, 60);

const tufts = makeTufts(9);
const tuftsBack = tufts.filter((t) => t.y < 272);
const tuftsFront = tufts.filter((t) => t.y >= 272);
const TREE = buildTree(5150);

/* ------------------------------------------------------------- the state */

const G = {
  phase: 'intro',            // intro → wake → care → dig → tree → pod → family
  t: 0,
  era: 0,
  eraFrom: 0,
  eraBlend: 1,
  flash: 0,
  sweep: -1,
  wind: 1,
  camZoom: 1,
  camZoomTarget: 1,
  camY: 0,
  camYTarget: 0,
  shake: 0,
  vignette: 0.35,
  hint: 0,
  fx: new FX(),
  intro: new FlowerIntro(),
  pokes: 0,
  idle: 0,
  storyTimer: 0,
  ripples: [],
  pups: [],
  pods: [],
  soilWet: 0,
  mound: 0,
  treeGrowth: 0,
  sproutShown: false,
  podRipe: 0,
  podBurst: 0,
  ambientTimer: 0,
  birdTimer: 2,
  firstFill: false,
  firstPour: false,
};

const dog = {
  x: 250, y: 274, stage: 0, size: 34, face: 'sleep', squash: 0, lean: 0,
  look: [0, 0], water: 0, t: 0, blink: 0, vx: 0, target: null, walk: false,
  buried: 0, alpha: 1, mood: 0, awake: false, mouthOpen: 0, drinking: 0, celebrate: 0,
  bounce: 0, flip: false,
};

const can = {
  x: CAN_HOME.x, y: CAN_HOME.y, carried: false, fill: 0, tilt: 0,
  vy: 0, grabDX: 0, grabDY: 0, flip: false, t: 0, pouring: false, dipped: 0,
};

/* ------------------------------------------------------------ pointer I/O */

const ptr = { x: W / 2, y: H / 2, down: false, moved: 0, downAt: 0 };

/**
 * How the little buffer is laid over the window.  On a wide screen the whole
 * picture fits; on a tall phone it fills the width and crops some sky, so the
 * hilltop you play on always stays on screen.  Input uses the same numbers.
 */
const viewT = { scale: 1, ox: 0, oy: 0, dpr: 1 };

function layout(vw, vh) {
  const fit = Math.min(vw / W, vh / H);
  const fillW = vw / W;
  let scale = fit;
  // On a tall screen fill the width (and a little more), then let the sky and
  // the turf run on above and below.
  if (vh / vw > H / W) scale = Math.min(fillW * 1.14, fit * 2.1);
  else scale = Math.min(fillW, fit * 1.22);   // wide screen: fill it, crop a little sky
  scale *= G.camZoom;
  const dw = W * scale, dh = H * scale;
  viewT.scale = scale;
  viewT.ox = (vw - dw) / 2;
  viewT.oy = dh > vh ? vh - dh + (dh - vh) * 0.16 : (vh - dh) / 2;
  viewT.oy -= G.camY * scale;
  // never let a camera move expose a band the picture does not fill
  viewT.oy = dh >= vh ? clamp(viewT.oy, vh - dh, 0) : clamp(viewT.oy, 0, vh - dh);
  viewT.ox = dw >= vw ? clamp(viewT.ox, vw - dw, 0) : clamp(viewT.ox, 0, vw - dw);
}

function toBuffer(e) {
  const r = view.getBoundingClientRect();
  // client px -> backing-store px -> buffer px
  const bx = ((e.clientX - r.left) * (view.width / r.width) - viewT.ox) / viewT.scale;
  const by = ((e.clientY - r.top) * (view.height / r.height) - viewT.oy) / viewT.scale;
  return { x: bx, y: by };
}

function hitDog(p) {
  const w = dog.size, h = dog.size * 0.76;
  return p.x > dog.x - w * 0.62 && p.x < dog.x + w * 0.62 &&
         p.y > dog.y - h * 1.25 && p.y < dog.y + 6;
}
function hitCan(p) {
  return Math.abs(p.x - can.x) < 18 && p.y > can.y - 30 && p.y < can.y + 8;
}
function inEllipse(p, e, pad = 0) {
  const dx = (p.x - e.x) / (e.rx + pad), dy = (p.y - e.y) / (e.ry + pad);
  return dx * dx + dy * dy <= 1;
}

view.addEventListener('pointerdown', (e) => {
  view.setPointerCapture(e.pointerId);
  const p = toBuffer(e);
  ptr.x = p.x; ptr.y = p.y; ptr.down = true; ptr.moved = 0; ptr.downAt = G.t;
  SFX.unlock();
  if (G.phase === 'intro') { G.intro.down(p.x, p.y); return; }
  onPress(p);
});
view.addEventListener('pointermove', (e) => {
  const p = toBuffer(e);
  ptr.moved += Math.hypot(p.x - ptr.x, p.y - ptr.y);
  ptr.x = p.x; ptr.y = p.y;
  if (G.phase === 'intro' && ptr.down) { G.intro.move(p.x, p.y); return; }
  G.idle = 0;
});
function release() {
  ptr.down = false;
  if (G.phase === 'intro') { G.intro.up(); return; }
  if (can.carried) {
    can.carried = false;
    can.vy = 0;
    SFX.pour(false);
    can.pouring = false;
  }
}
view.addEventListener('pointerup', release);
view.addEventListener('pointercancel', release);
view.addEventListener('contextmenu', (e) => e.preventDefault());
window.addEventListener('blur', release);

function onPress(p) {
  G.idle = 0;
  if (hitCan(p) && G.phase !== 'wake') {
    can.carried = true;
    can.grabDX = clamp(can.x - p.x, -8, 8);
    can.grabDY = clamp(can.y - p.y, -6, 14);
    SFX.pop(1.3);
    return;
  }
  if (hitDog(p) && dog.alpha > 0.2 && dog.buried < 0.5) {
    poke();
    return;
  }
  for (const pup of G.pups) {
    if (Math.abs(p.x - pup.x) < pup.size * 0.7 && Math.abs(p.y - pup.y + pup.size * 0.3) < pup.size * 0.6) {
      pup.vy = -70; pup.grounded = false; pup.face = 'happy';
      G.fx.heart(pup.x, pup.y - pup.size * 0.8);
      SFX.pop(1.6);
      return;
    }
  }
  if (inEllipse(p, POND, 4)) {
    G.ripples.push({ x: p.x, y: p.y, t: 0, life: 1.1, max: 16 });
    SFX.plip(1.1);
    return;
  }
  if (inEllipse(p, SOIL, 4)) {
    G.fx.dirt(p.x, p.y, 5, '#6b4a32');
    SFX.rustle();
  }
}

function poke() {
  G.pokes++;
  dog.squash = 0.45;
  dog.mood = 1;
  SFX.pop(0.9 + G.pokes * 0.08);
  G.fx.ring(dog.x, dog.y - dog.size * 0.3, '#ffffff');
  if (G.phase === 'wake') {
    if (G.pokes === 1) {
      dog.face = 'sleep';
      G.fx.sparkle(dog.x + dog.size * 0.4, dog.y - dog.size * 0.7, '#fff6c8');
    } else if (G.pokes === 2) {
      dog.face = 'squint';
      G.fx.sparkle(dog.x, dog.y - dog.size * 0.8);
    } else if (G.pokes >= 3) {
      wake();
    }
  } else {
    dog.face = 'happy';
    dog.bounce = 1;
    for (let i = 0; i < 2; i++) G.fx.heart(dog.x + R.f(-6, 6), dog.y - dog.size * 0.8);
  }
}

function wake() {
  dog.awake = true;
  dog.face = 'wow';
  dog.bounce = 1.4;
  G.phase = 'care';
  G.storyTimer = 0;
  G.camYTarget = 0;
  SFX.sparkleUp();
  G.fx.burst(dog.x, dog.y - dog.size * 0.4, 26, '#fff2a0', 70);
  for (let i = 0; i < 6; i++) G.fx.heart(dog.x + R.f(-10, 10), dog.y - dog.size * 0.7);
  G.camZoomTarget = 1;
}

/* ------------------------------------------------------------ era changes */

function setEra(n) {
  if (n === G.era) return;
  bakeEra(n);
  G.eraFrom = G.era;
  G.era = n;
  G.eraBlend = 0;
  G.sweep = 0;
  G.flash = 0.55;
  SFX.bloom();
}

/* --------------------------------------------------------- growth & story */

function grow() {
  dog.stage = Math.min(4, dog.stage + 1);
  dog.water = 0;
  dog.bounce = 1.6;
  dog.face = 'happy';
  dog.celebrate = 2.6;
  dog.target = clamp(dog.x + (dog.x < 264 ? 34 : -34), 212, 316);
  can.tilt = 0;
  can.pouring = false;
  SFX.pour(false);
  G.fx.burst(dog.x, dog.y - dog.size * 0.5, 34, '#eaffb0', 80);
  for (let i = 0; i < 10; i++) G.fx.heart(dog.x + R.f(-14, 14), dog.y - dog.size * 0.8);
  SFX.sparkleUp();
  // a ring of flowers opens around him
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    G.fx.spawn('spark', {
      x: dog.x + Math.cos(a) * 26, y: dog.y + Math.sin(a) * 9,
      vx: 0, vy: -6, life: 1.4, color: '#ffe8a0', size: 2,
    });
  }
  setEra(Math.min(4, dog.stage));
  if (dog.stage >= 4) {
    G.phase = 'grown';
    G.storyTimer = 0;
  }
}

function startDig() {
  G.phase = 'dig';
  G.storyTimer = 0;
  dog.target = SOIL.x;
  dog.walk = true;
  G.camZoomTarget = 1.22;
  G.camYTarget = 18;
}

/* ----------------------------------------------------------------- update */

function update(dt) {
  G.t += dt;
  dog.t += dt;
  can.t += dt;
  G.idle += dt;
  G.wind = 1 + Math.sin(G.t * 0.23) * 0.5 + Math.sin(G.t * 0.7) * 0.2 + (G.gust || 0) * 2.6;
  G.gustTimer = (G.gustTimer || 6) - dt;
  if (G.gustTimer <= 0) {
    G.gustTimer = R.f(9, 20);
    G.gustLen = R.f(1.4, 2.6);
    G.gustAge = 0;
    SFX.rustle();
  }
  if (G.gustLen) {
    G.gustAge += dt;
    const k = clamp(G.gustAge / G.gustLen, 0, 1);
    G.gust = Math.sin(k * Math.PI) * (0.6 + 0.4 * Math.sin(G.t * 9));
    if (k >= 1) { G.gustLen = 0; G.gust = 0; }
    const P = ERAS[G.era];
    if (P.petal && R.chance(dt * 34 * G.gust)) {
      G.fx.petal(P.petal, R.f(-20, W * 0.4), R.f(150, H - 10), R.f(-4, 10));
    }
    if (R.chance(dt * 12 * G.gust)) G.fx.mote(R.f(-10, W * 0.3), R.f(200, H));
  }

  if (G.phase === 'intro') {
    G.intro.update(dt);
    if (G.intro.done) {
      G.phase = 'wake';
      G.storyTimer = 0;
      G.camZoomTarget = 1.34;   // lean in close while he is still asleep
      G.camYTarget = 28;
    }
    G.vignette = lerp(G.vignette, 0.5, dt);
    ambient(dt);
    G.fx.update(dt, {});
    return;
  }

  /* camera */
  G.camZoom = lerp(G.camZoom, G.camZoomTarget, dt * 1.6);
  G.camY = lerp(G.camY, G.camYTarget, dt * 1.6);
  G.shake = Math.max(0, G.shake - dt * 2.4);
  G.flash = Math.max(0, G.flash - dt * 1.1);
  if (G.eraBlend < 1) {
    G.eraBlend = Math.min(1, G.eraBlend + dt * 0.42);
    G.sweep = G.eraBlend;
  }
  G.vignette = lerp(G.vignette, G.phase === 'family' ? 0.3 : 0.26, dt * 0.6);

  /* ripples */
  for (let i = G.ripples.length - 1; i >= 0; i--) {
    G.ripples[i].t += dt;
    if (G.ripples[i].t > G.ripples[i].life) G.ripples.splice(i, 1);
  }

  updateCan(dt);
  updateDog(dt);
  ambient(dt);
  story(dt);

  for (const p of G.pups) p.update(dt, [150, 430], can.carried ? can : dog);

  for (let i = G.pods.length - 1; i >= 0; i--) {
    const pod = G.pods[i];
    if (!pod.bursting) continue;
    pod.burst = Math.min(1.35, pod.burst + dt * 1.1);
    if (pod.burst >= 1.35) G.pods.splice(i, 1);
  }

  G.soilWet = Math.max(0, G.soilWet - dt * 0.035);
  G.fx.update(dt, {
    groundAt: (x) => {
      if (Math.abs(x - POND.x) < POND.rx) return POND.y;
      return groundY(x) + 26;
    },
    onDrop: (a) => {
      const onPond = Math.abs(a.x - POND.x) < POND.rx && Math.abs(a.y - POND.y) < POND.ry + 8;
      G.fx.splash(a.x, a.y, 3, onPond ? '#cdf0f8' : '#dff4ff');
      if (onPond && R.chance(0.25)) G.ripples.push({ x: a.x, y: a.y, t: 0, life: 0.9, max: 10 });
      if (R.chance(0.1)) SFX.plip(R.f(0.8, 1.5));
    },
  });
}

/* ---------------------------------------------------------------- the can */

function waterTarget() {
  // what is under the spout right now?
  const sx = can.spoutX === undefined ? can.x - (can.flip ? -16 : 16) : can.spoutX;
  const sy = can.spoutY === undefined ? can.y - 8 : can.spoutY;
  const near = (tx, ty, rx, ry) =>
    Math.abs(sx - tx) < rx && sy > ty - ry && sy < ty + 22;

  if ((G.phase === 'care' || G.phase === 'grown') && dog.celebrate <= 0) {
    if (near(dog.x, dog.y - dog.size * 0.4, dog.size * 0.85, dog.size * 0.9)) return { kind: 'dog' };
  }
  if (G.phase === 'tree' && G.sproutShown) {
    if (near(SOIL.x, SOIL.y - 20 - G.treeGrowth * 40, 34, 40 + G.treeGrowth * 40)) return { kind: 'tree' };
  }
  if (G.phase === 'pod' || G.phase === 'family') {
    for (const pod of G.pods) {
      if (pod.bursting) continue;
      if (near(SOIL.x + pod.wx, SOIL.y + pod.wy, 26, 30)) return { kind: 'pod', pod };
    }
    if (near(SOIL.x, SOIL.y - 40, 40, 60)) return { kind: 'tree' };
  }
  if (near(SOIL.x, SOIL.y, SOIL.rx, SOIL.ry + 14)) return { kind: 'soil' };
  return null;
}

function overPond() {
  return Math.abs(can.x - POND.x) < POND.rx + 10 && can.y > POND.y - 34 && can.y < POND.y + 22;
}

function updateCan(dt) {
  if (can.carried) {
    // gentle inertia so it feels carried, not glued to the cursor
    can.x = lerp(can.x, clamp(ptr.x + can.grabDX, 14, W - 14), 1 - Math.pow(0.002, dt));
    can.y = lerp(can.y, clamp(ptr.y + can.grabDY, 150, H - 6), 1 - Math.pow(0.002, dt));

    if (overPond() && can.fill < 1) {
      can.fill = Math.min(1, can.fill + dt * 0.55);
      can.dipped = 1;
      can.tilt = lerp(can.tilt, 0.12, dt * 6);
      if (R.chance(dt * 9)) {
        G.ripples.push({ x: can.x + R.f(-6, 6), y: POND.y + R.f(-3, 3), t: 0, life: 1, max: 13 });
        SFX.plip(R.f(0.7, 1.2));
      }
      G.fx.splash(can.x, POND.y - 2, 1, '#cdf0f8');
      if (can.fill >= 1 && !G.firstFill) {
        G.firstFill = true;
        SFX.sparkleUp();
      }
      can.pouring = false;
      SFX.pour(false);
    } else {
      const tgt = waterTarget();
      if (tgt && can.fill > 0.01) {
        can.flip = (tgt.kind === 'dog' ? dog.x : SOIL.x) > can.x;
        can.tilt = lerp(can.tilt, 1, dt * 5);
        if (can.tilt > 0.45) {
          can.fill = Math.max(0, can.fill - dt * 0.3);
          pourOnto(tgt, dt);
          if (!can.pouring) { can.pouring = true; SFX.pour(true); }
        }
      } else {
        can.tilt = lerp(can.tilt, 0, dt * 6);
        if (can.pouring) { can.pouring = false; SFX.pour(false); }
      }
    }
  } else {
    // fall back to the grass and settle
    can.tilt = lerp(can.tilt, 0, dt * 6);
    const rest = groundY(can.x) + 12;
    if (can.y < rest) {
      can.vy += 420 * dt;
      can.y += can.vy * dt;
      if (can.y >= rest) {
        can.y = rest;
        if (can.vy > 60) { SFX.thud(); G.fx.dirt(can.x, can.y, 4, '#6f8f42'); }
        can.vy = 0;
      }
    }
    if (can.pouring) { can.pouring = false; SFX.pour(false); }
  }
  can.dipped = Math.max(0, can.dipped - dt);
}

function pourOnto(tgt, dt) {
  const sx = can.spoutX === undefined ? can.x - (can.flip ? -15 : 15) : can.spoutX;
  const sy = can.spoutY === undefined ? can.y - 7 : can.spoutY;
  // a proper stream: a few fat drops a frame, plus a short spill at the rose
  const n = 1 + (R.chance(dt * 90) ? 1 : 0);
  for (let i = 0; i < n; i++) {
    if (R.chance(dt * 60)) G.fx.drop(sx + R.f(-2.5, 2.5), sy + R.f(0, 3), can.flip ? 14 : -14, 30 + R.f(0, 30));
  }
  ctx.fillStyle = rgba('#9fdcf0', 0.75);
  for (let i = 0; i < 5; i++) {
    ctx.fillRect(Math.round(sx + (can.flip ? 1 : -1) * i * 0.6), Math.round(sy + i * 1.3), 1, 2);
  }
  G.firstPour = true;

  if (tgt.kind === 'dog') {
    dog.drinking = 0.35;
    dog.water += dt * 0.42;
    dog.face = 'happy';
    if (R.chance(dt * 6)) G.fx.heart(dog.x + R.f(-8, 8), dog.y - dog.size * 0.9);
    if (R.chance(dt * 10)) G.fx.sparkle(dog.x + R.f(-14, 14), dog.y - R.f(0, dog.size * 0.8), '#c8ffb0');
    if (dog.water >= 1 && dog.stage < 4) grow();
    else if (dog.water >= 1) dog.water = 1;
  } else if (tgt.kind === 'soil') {
    G.soilWet = Math.min(1, G.soilWet + dt * 0.5);
    if (G.phase === 'dig' && G.mound > 0.5) G.storyTimer += dt * 2.2;
  } else if (tgt.kind === 'tree') {
    G.soilWet = Math.min(1, G.soilWet + dt * 0.3);
    G.treeGrowth = Math.min(1, G.treeGrowth + dt * 0.145);
    if (R.chance(dt * 8)) {
      G.fx.sparkle(SOIL.x + R.f(-26, 26), SOIL.y - R.f(4, 30 + G.treeGrowth * 60), '#d8ffc0');
    }
    if (G.treeGrowth >= 1 && G.phase === 'tree') {
      G.phase = 'pod';
      G.storyTimer = 0;
      spawnPod();
      SFX.bloom();
      setEra(5);
    }
  } else if (tgt.kind === 'pod') {
    tgt.pod.ripe = Math.min(1, tgt.pod.ripe + dt * 0.3);
    if (R.chance(dt * 10)) G.fx.sparkle(SOIL.x + tgt.pod.wx + R.f(-6, 6), SOIL.y + tgt.pod.wy + R.f(-4, 10), '#fff2a0');
    if (tgt.pod.ripe >= 1 && !tgt.pod.bursting) burstPod(tgt.pod);
  }
}

/* ---------------------------------------------------------------- the dog */

function updateDog(dt) {
  dog.size = lerp(dog.size, [34, 46, 60, 74, 90][dog.stage], dt * 2.6);
  dog.squash = lerp(dog.squash, 0, dt * 7);
  dog.bounce = Math.max(0, dog.bounce - dt * 2.2);
  dog.mood = Math.max(0, dog.mood - dt * 0.6);
  dog.drinking = Math.max(0, dog.drinking - dt);
  dog.celebrate = Math.max(0, dog.celebrate - dt);
  dog.blink -= dt;

  if (G.phase === 'wake') {
    dog.face = G.pokes === 0 ? 'sleep' : G.pokes === 1 ? 'sleep' : 'squint';
    if (R.chance(dt * 0.85)) G.fx.zzz(dog.x + dog.size * 0.45, dog.y - dog.size * 0.65);
    dog.squash = Math.sin(G.t * 1.5) * 0.045;  // breathing
    return;
  }

  if (G.phase === 'dig') {
    if (dog.walk) {
      const d = dog.target - dog.x;
      dog.vx = clamp(d, -1, 1) * 26;
      dog.x += dog.vx * dt;
      dog.flip = dog.vx < 0;
      dog.face = 'idle';
      dog.look = [clamp(d / 40, -1, 1), 0];
      if (Math.abs(d) < 3) {
        dog.walk = false;
        dog.vx = 0;
        G.storyTimer = 0;
      }
    }
    return;
  }

  if (dog.buried > 0) return;

  /* idle life: look around, blink, waddle a little, watch the can */
  const focus = can.carried ? can : { x: ptr.x, y: ptr.y };
  dog.look = [
    clamp((focus.x - dog.x) / 50, -1, 1),
    clamp((focus.y - (dog.y - dog.size * 0.5)) / 40, -1, 1),
  ];
  if (dog.blink < 0) {
    dog.blink = R.f(1.6, 5);
    dog.blinking = 0.12;
  }
  dog.blinking = Math.max(0, (dog.blinking || 0) - dt);

  if (dog.drinking > 0) {
    dog.face = 'happy';
    dog.squash = Math.sin(G.t * 12) * 0.06;
  } else if (dog.mood > 0.4 || dog.celebrate > 0.6) {
    dog.face = 'happy';
  } else if (dog.blinking > 0) {
    dog.face = 'closed';
  } else {
    dog.face = 'idle';
  }

  // a slow wander so he never feels like a sticker on a wall
  if (G.phase === 'care' || G.phase === 'grown' || G.phase === 'family' || G.phase === 'tree' || G.phase === 'pod') {
    if (dog.target === null && R.chance(dt * 0.22)) dog.target = clamp(dog.x + R.f(-60, 60), 212, 316);
    if (dog.target !== null) {
      const d = dog.target - dog.x;
      if (Math.abs(d) < 2) { dog.target = null; dog.vx = 0; }
      else {
        dog.vx = clamp(d, -1, 1) * 15;
        dog.x += dog.vx * dt;
        dog.flip = dog.vx < 0;
      }
    } else dog.vx = lerp(dog.vx, 0, dt * 6);
  }
  dog.lean = clamp(dog.vx * 0.012, -0.25, 0.25);
}

/* ------------------------------------------------------------- story beat */

function story(dt) {
  G.storyTimer += dt;
  switch (G.phase) {
    case 'wake':
      // he keeps sleeping until you poke him three times
      break;
    case 'grown':
      // a beat to admire him, then he goes to the soil
      if (G.storyTimer > 3.4) startDig();
      break;
    case 'dig': {
      if (!dog.walk) {
        if (G.storyTimer > 1.1 && dog.buried === 0) {
          // one last look back at you
          dog.face = 'happy';
          dog.look = [-0.6, -0.4];
        }
        if (G.storyTimer > 2.3) {
          dog.buried = Math.min(1, dog.buried + dt * 0.42);
          dog.y = lerp(dog.y, SOIL.y, dt * 0.6);
          dog.squash = 0.25 + Math.sin(G.t * 16) * 0.12;
          if (R.chance(dt * 26)) {
            G.fx.dirt(dog.x + R.f(-10, 10), SOIL.y, 2, '#6b4a32');
            if (R.chance(0.2)) SFX.rustle();
          }
          G.mound = Math.min(1, G.mound + dt * 0.5);
          G.shake = 0.35;
        }
        if (dog.buried >= 1 && G.phase === 'dig') {
          G.phase = 'gone';
          G.storyTimer = 0;
          G.camZoomTarget = 1.16;
          G.camYTarget = 14;
          SFX.thud();
        }
      }
      break;
    }
    case 'gone':
      // the hill is quiet.  then something pushes up through the earth.
      if (G.storyTimer > 3.6 && !G.sproutShown) {
        G.sproutShown = true;
        G.phase = 'tree';
        G.storyTimer = 0;
        G.treeGrowth = 0.02;
        G.camZoomTarget = 1.08;
        G.camYTarget = 10;
        SFX.sparkleUp();
        G.fx.burst(SOIL.x, SOIL.y - 4, 18, '#c8ff9a', 42);
      }
      break;
    case 'tree':
      break;
    case 'pod':
      break;
    case 'family':
      // life goes on: a new pod ripens every so often
      if (G.pods.length < 3 && G.storyTimer > 20) {
        G.storyTimer = 0;
        spawnPod();
      }
      break;
  }
}

function spawnPod() {
  G.pods.push({
    wx: R.f(-30, 30), wy: -R.f(46, 78), ripe: 0.06, burst: 0, bursting: false,
  });
}

function burstPod(pod) {
  pod.bursting = true;
  SFX.bloom();
  G.shake = 0.6;
  G.flash = 0.4;
  const px_ = SOIL.x + pod.wx, py_ = SOIL.y + pod.wy;
  G.fx.burst(px_, py_, 36, '#eaff9a', 90);
  const n = R.i(3, 5);
  for (let i = 0; i < n; i++) {
    const pup = new Pup(px_ + R.f(-8, 8), py_ + 6, 1000 + G.pups.length * 17 + i, SOIL.y - 4);
    pup.vx = R.f(-34, 34);
    G.pups.push(pup);
  }
  if (G.phase !== 'family') {
    G.phase = 'family';
    G.storyTimer = 0;
    G.camZoomTarget = 1;
    G.camYTarget = 0;
  }
}

/* --------------------------------------------------------------- ambience */

function ambient(dt) {
  const P = ERAS[G.era];
  G.ambientTimer -= dt;
  G.birdTimer -= dt;
  if (G.birdTimer < 0 && G.era !== 5) {
    G.birdTimer = R.f(6, 16);
    const n = R.i(1, 4);
    for (let i = 0; i < n; i++) {
      setTimeout(() => G.fx.bird(R.f(40, 110)), i * 180);
    }
  }
  if (G.ambientTimer < 0) {
    G.ambientTimer = 0.1;
    if (P.petal === 'sakura') for (let i = 0; i < 2; i++) G.fx.petal('sakura', R.f(-20, W), R.f(-20, 120), 12);
    if (P.petal === 'leaf') G.fx.petal('leaf', R.f(-20, W), R.f(-20, 140), 16);
    if (P.petal === 'pea' && R.chance(0.5)) G.fx.petal('pea', R.f(-20, W), R.f(-20, 140), 10);
    if (R.chance(0.4)) G.fx.mote(R.f(0, W), R.f(150, H));
  }
  // butterflies and fireflies keep a steady population per era
  const wantB = Math.round(P.butterflies * 7);
  const haveB = G.fx.p.filter((a) => a.type === 'butterfly').length +
                G.fx.back.filter((a) => a.type === 'butterfly').length;
  if (haveB < wantB && R.chance(dt * 2)) {
    G.fx.butterfly(R.f(20, W - 20), R.f(190, H - 20), P.key === 'cherry' ? '#ffb0d0' : '#6f5ae0');
  }
  const wantF = G.era === 5 ? 26 : 0;
  const haveF = G.fx.p.filter((a) => a.type === 'firefly').length;
  if (haveF < wantF && R.chance(dt * 12)) G.fx.firefly(R.f(10, W - 10), R.f(215, H - 10));
}

/* ----------------------------------------------------------------- render */

function drawWorld() {
  const P = ERAS[G.era];
  ctx.fillStyle = P.sky[P.sky.length - 1][1];
  ctx.fillRect(0, 0, W, H);

  /* vista, cross-fading between two eras */
  ctx.drawImage(cache.vista[G.eraFrom] || cache.vista[0], 0, 0);
  if (G.eraBlend < 1 && cache.vista[G.era]) {
    ctx.globalAlpha = ease.inOut(G.eraBlend);
    ctx.drawImage(cache.vista[G.era], 0, 0);
    ctx.globalAlpha = 1;
  } else if (cache.vista[G.era]) {
    ctx.drawImage(cache.vista[G.era], 0, 0);
  }

  drawMist(ctx, G.t, P, G.era === 2 ? 1.6 : 1);
  drawRays(ctx, G.t, P.sun.x, P.sun.y, P, G.era === 5 ? 0.5 : 1);
  G.fx.draw(ctx, 'back', P);

  /* the ground we stand on */
  const g0 = cache.ground[G.eraFrom] || cache.ground[0];
  ctx.drawImage(g0, 0, 0);
  if (G.eraBlend < 1 && cache.ground[G.era]) {
    ctx.globalAlpha = ease.inOut(G.eraBlend);
    ctx.drawImage(cache.ground[G.era], 0, 0);
    ctx.globalAlpha = 1;
  } else if (cache.ground[G.era]) {
    ctx.drawImage(cache.ground[G.era], 0, 0);
  }

  drawPond(ctx, P, G.t, { ripples: G.ripples });
  drawSoil(ctx, P, G.t, { wet: G.soilWet, mound: G.mound });

  /* the plant */
  if (G.sproutShown) {
    if (G.treeGrowth < 0.16) {
      drawSprout(ctx, SOIL.x, SOIL.y - 3 - G.mound * 3, 30 + G.treeGrowth * 200, 2, G.t, 1);
    } else {
      drawTree(ctx, SOIL.x, SOIL.y - 2 - G.mound * 2, TREE, G.treeGrowth, G.t, P, {
        pods: G.pods.map((p) => ({ x: p.wx / 1, y: p.wy / 1, ripe: p.ripe, burst: p.burst })),
      });
    }
  }

  drawTufts(ctx, tuftsBack, P, G.t, G.wind);

  /* actors, sorted back to front */
  const actors = [];
  if (dog.alpha > 0.02 && dog.buried < 1) {
    actors.push({ y: dog.y, draw: drawTheDog });
  }
  for (const pup of G.pups) actors.push({ y: pup.y, draw: () => pup.draw(ctx) });
  actors.push({ y: can.y + (can.carried ? 200 : 0), draw: drawTheCan });
  actors.sort((a, b) => a.y - b.y);
  for (const a of actors) a.draw();

  /* foreground foliage frames the shot */
  const f0 = cache.fg[G.eraFrom] || cache.fg[0];
  ctx.drawImage(f0, 0, 0);
  if (G.eraBlend < 1 && cache.fg[G.era]) {
    ctx.globalAlpha = ease.inOut(G.eraBlend);
    ctx.drawImage(cache.fg[G.era], 0, 0);
    ctx.globalAlpha = 1;
  } else if (cache.fg[G.era]) {
    ctx.drawImage(cache.fg[G.era], 0, 0);
  }

  G.fx.draw(ctx, 'front', P);
  drawTufts(ctx, tuftsFront, P, G.t, G.wind * 1.25);

  /* hints, all of them diegetic */
  drawHints(P);

  /* era sweep: a band of light crossing the valley as time turns */
  if (G.sweep >= 0 && G.sweep < 1) {
    const x = lerp(-80, W + 80, ease.inOut(G.sweep));
    for (let i = 0; i < 56; i++) {
      const a = (1 - Math.abs(i - 28) / 28) * 0.5 * (1 - G.sweep);
      ctx.globalAlpha = a * 0.5;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(Math.round(x - 28 + i), 0, 1, H);
      ctx.globalAlpha = 1;
    }
  }

  /* grade + flash + vignette */
  if (P.grade && P.gradeAmt > 0) {
    ctx.globalAlpha = P.gradeAmt * (G.eraBlend);
    ctx.fillStyle = P.grade;
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }
  if (G.flash > 0) {
    ctx.globalAlpha = G.flash * 0.5;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
  }
  vignette(G.vignette);
}

function drawTheDog() {
  drawPea(ctx, dog.x, dog.y, {
    size: dog.size,
    face: dog.face,
    squash: dog.squash + (G.phase === 'wake' ? 0 : Math.sin(dog.t * 2.2) * 0.02) - dog.bounce * 0.12,
    offY: -Math.abs(Math.sin(dog.bounce * 7)) * dog.bounce * 9,
    lean: dog.lean,
    look: dog.look,
    stage: dog.stage,
    t: dog.t,
    alpha: dog.alpha,
    buried: dog.buried,
    feet: Math.abs(dog.vx) > 3,
    tail: dog.stage > 0,
    mouthOpen: dog.drinking > 0 ? 1 : 0,
    blush: dog.mood > 0.3,
    flip: dog.flip,
  });
}

function drawTheCan() {
  const bob = can.carried ? Math.sin(can.t * 6) * 0.8 : 0;
  const info = drawCan(ctx, can.x, can.y + bob, {
    tilt: can.tilt, fill: can.fill, flip: can.flip, t: can.t,
    shadow: !can.carried,
  });
  can.spoutX = info.spout.x;
  can.spoutY = info.spout.y;
  if (can.carried) {
    // a soft shadow on the ground beneath it tells you how high you are
    const gy = groundY(can.x) + 14;
    ctx.globalAlpha = clamp(0.25 - (gy - can.y) / 400, 0.04, 0.25);
    fillEllipse(ctx, can.x, gy, 12, 3, '#1b2a16');
    ctx.globalAlpha = 1;
  }
}

function drawHints(P) {
  const idleEnough = G.idle > 3.4;
  if (G.phase === 'wake') {
    // a ring of light breathing over the sleeping dog
    const pulse = 0.5 + 0.5 * Math.sin(G.t * 2);
    ctx.globalAlpha = 0.12 + pulse * 0.1;
    fillEllipse(ctx, dog.x, dog.y - dog.size * 0.3, dog.size * 0.9, dog.size * 0.6, '#fff8c8');
    ctx.globalAlpha = 1;
    if (R.chance(0.04)) G.fx.sparkle(dog.x + R.f(-18, 18), dog.y - R.f(0, 22), '#fff6c8');
    return;
  }
  if (can.carried) {
    // where can I pour?  the things that want water shimmer faintly
    if (can.fill < 0.02) {
      glint(ctx, POND.x, POND.y - 2, G.t * 1.6, '#d8f6ff', 1.4);
    } else {
      if (G.phase === 'care' || G.phase === 'grown') glint(ctx, dog.x, dog.y - dog.size * 0.5, G.t * 1.6, '#eaffb0');
      if (G.phase === 'tree') glint(ctx, SOIL.x, SOIL.y - 14 - G.treeGrowth * 40, G.t * 1.6, '#eaffb0');
      if (G.phase === 'pod' || G.phase === 'family') {
        for (const pod of G.pods) {
        if (!pod.bursting) glint(ctx, SOIL.x + pod.wx, SOIL.y + pod.wy + 6, G.t * 1.6, '#fff2a0');
      }
      }
    }
    return;
  }
  if (idleEnough && G.phase !== 'intro') {
    glint(ctx, can.x, can.y - 12, G.t * 1.2, '#fffbe0', 1.2);
    if (G.phase === 'gone' && G.mound > 0.4) glint(ctx, SOIL.x, SOIL.y - 6, G.t * 1.4, '#c8ff9a');
  }
}

function vignette(amount) {
  if (amount <= 0) return;
  const steps = 30;
  for (let i = 0; i < steps; i++) {
    const a = Math.pow(1 - i / steps, 2.4) * amount * 0.55;
    ctx.globalAlpha = a;
    ctx.fillStyle = '#1a1424';
    ctx.fillRect(0, i, W, 1);
    ctx.fillRect(0, H - 1 - i, W, 1);
    ctx.fillRect(i, 0, 1, H);
    ctx.fillRect(W - 1 - i, 0, 1, H);
  }
  ctx.globalAlpha = 1;
}

/* ------------------------------------------------------------ present it */

function present() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const vw = Math.max(2, Math.floor(view.clientWidth * dpr));
  const vh = Math.max(2, Math.floor(view.clientHeight * dpr));
  if (view.width !== vw || view.height !== vh) {
    view.width = vw; view.height = vh;
    vctx.imageSmoothingEnabled = false;
  }
  viewT.dpr = dpr;
  layout(vw, vh);
  vctx.fillStyle = '#0d0f14';
  vctx.fillRect(0, 0, vw, vh);
  const k = viewT.scale;
  // carry the world into the letterbox: sky above, hillside below
  const P = ERAS[G.era];
  const top = Math.round(viewT.oy);
  const bot = Math.round(viewT.oy + H * k);
  const ox = Math.round(viewT.ox);
  const dw = Math.round(W * k);
  if (top > 0) {
    vctx.fillStyle = P.sky[0][1];
    vctx.fillRect(0, 0, vw, top + 1);
  }
  if (bot < vh) {
    // stretch the last few rows of turf downward: the blades draw out into
    // long grass, as if you were looking over a bank of it
    vctx.fillStyle = P.grassDark;
    vctx.fillRect(0, bot - 1, vw, vh - bot + 1);
    const src = 7;
    vctx.drawImage(buf.canvas, 0, H - src, W, src, ox, bot - Math.round(src * k), dw, vh - bot + Math.round(src * k));
    const gap = vh - bot;
    for (let i = 0; i < 6; i++) {
      vctx.fillStyle = rgba('#12200e', 0.13);
      const band = Math.round(gap * (0.72 - i * 0.11));
      if (band > 0) vctx.fillRect(0, vh - band, vw, band);
    }
  }
  const shakeX = G.shake ? (Math.random() - 0.5) * G.shake * 6 * k : 0;
  const shakeY = G.shake ? (Math.random() - 0.5) * G.shake * 6 * k : 0;
  vctx.imageSmoothingEnabled = false;
  vctx.drawImage(
    buf.canvas,
    Math.round(viewT.ox + shakeX), Math.round(viewT.oy + shakeY),
    Math.round(W * k), Math.round(H * k)
  );
}

/* ------------------------------------------------------------- game loop */

let last = performance.now();
function frame(now) {
  let dt = (now - last) / 1000;
  last = now;
  dt = Math.min(dt, 1 / 20);

  update(dt);

  if (G.phase === 'intro') {
    // the world is already alive behind the blossom
    ctx.fillStyle = ERAS[0].sky[4][1];
    ctx.fillRect(0, 0, W, H);
    ctx.drawImage(cache.vista[0], 0, 0);
    ctx.drawImage(cache.ground[0], 0, 0);
    drawPond(ctx, ERAS[0], G.t, { ripples: G.ripples });
    drawSoil(ctx, ERAS[0], G.t, { wet: 0, mound: 0 });
    drawTufts(ctx, tuftsBack, ERAS[0], G.t, G.wind);
    drawPea(ctx, dog.x, dog.y, {
      size: 34, face: 'sleep', squash: Math.sin(G.t * 1.5) * 0.045, stage: 0, t: G.t,
    });
    drawCan(ctx, can.x, can.y, { tilt: 0, fill: 0, t: G.t });
    ctx.drawImage(cache.fg[0], 0, 0);
    drawTufts(ctx, tuftsFront, ERAS[0], G.t, G.wind * 1.2);
    // the blossom, over a field of its own colour: nothing else shows yet
    const veil = clamp(G.intro.veil, 0, 1);
    ctx.globalAlpha = veil;
    ctx.fillStyle = '#1b1152';
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = veil * 0.85;
    for (let i = 7; i >= 1; i--) {
      ctx.globalAlpha = veil * 0.1;
      fillEllipse(ctx, W / 2, H * 0.52, 60 + i * 34, 44 + i * 26, '#3b2ba0');
    }
    ctx.globalAlpha = 1;
    G.intro.draw(ctx);
    vignette(0.4);
  } else {
    drawWorld();
  }

  present();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

/* ----------------------------------------------------- development hooks */

window.__game = {
  G, dog, can,
  setEra,
  /** buffer coords -> page coords, for scripted play-throughs */
  toScreen(bx, by) {
    const r = view.getBoundingClientRect();
    return {
      x: r.left + (viewT.ox + bx * viewT.scale) * (r.width / view.width),
      y: r.top + (viewT.oy + by * viewT.scale) * (r.height / view.height),
    };
  },
  skipTo(phase) {
    if (phase === 'wake') {
      G.phase = 'wake'; G.intro.done = true;
      for (const p of G.intro.petals) p.dead = true;
    }
    if (phase === 'care') { this.skipTo('wake'); G.pokes = 3; wake(); }
    if (phase === 'grown') {
      this.skipTo('care');
      dog.stage = 4; dog.size = 90; setEra(4); G.eraBlend = 1; G.phase = 'grown'; G.storyTimer = 0;
    }
    if (phase === 'tree') {
      this.skipTo('grown');
      dog.buried = 1; dog.alpha = 0; G.mound = 1; G.sproutShown = true;
      G.phase = 'tree'; G.treeGrowth = 0.5; G.storyTimer = 0;
      G.camZoomTarget = 1.08; G.camYTarget = 10;
    }
    if (phase === 'pod') {
      this.skipTo('tree');
      G.treeGrowth = 1; setEra(5); G.eraBlend = 1; G.phase = 'pod'; spawnPod();
    }
    if (phase === 'family') {
      this.skipTo('pod');
      for (const p of G.pods) { p.ripe = 1; burstPod(p); }
    }
  },
  grow, setStage(n) { dog.stage = n; dog.size = [34, 46, 60, 74, 90][n]; },
  fillCan() { can.fill = 1; },
};
