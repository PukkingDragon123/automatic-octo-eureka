/* ============================================================================
 *  main.js — one hill, a small dog, two people, and about twenty-five years.
 *
 *  There is no interface.  You drag the world to look around, and you touch
 *  what is there.  Everything else happens whether you are watching or not.
 * ==========================================================================*/

import { rng, clamp, lerp, rgba, makeCanvas, ease, fillEllipse } from './core.js';
import {
  W, H, LAND_W, ERAS, TIMES, SKY_H, buildModel, renderSky, renderLand, renderLights,
} from './vista.js';
import { PLACES, groundY, standY, Camera, Touchables, inWorld, LAND_DY } from './world.js';
import {
  renderGround, renderCanopy, makeTufts, drawTufts, drawPond, drawBed, drawCan,
  drawSignpost, drawLog, drawViewWall, drawBowl, drawRocks, drawGrave,
  buildTree, drawTree, drawPeaFlower, drawPeaVines, FOODS,
} from './stage.js';
import { PATCHES, bakePatch, drawPatch } from './flora.js';
import { Critters } from './critters.js';
import { Dog, AGES } from './dog.js';
import { Person } from './human.js';
import { FX, glint, drawRays, drawMist } from './fx.js';
import { BlossomField } from './blossom.js';
import { CHAPTERS, Director } from './chapters.js';
import { Ending } from './ending.js';
import { Act } from './act.js';
import { Music } from './music.js';
import * as SFX from './audio.js';

const R = rng(20260918);

/* ------------------------------------------------------------ boot canvas */

const view = document.getElementById('game');
const vctx = view.getContext('2d', { alpha: false });
vctx.imageSmoothingEnabled = false;
const buf = makeCanvas(W, H);
const ctx = buf.ctx;

/* ----------------------------------------------------------- baked layers */

buildModel();
const cache = { sky: [], land: [], lights: [], ground: [], canopy: [] };
const ensureSky = (i) => (cache.sky[i] ||= renderSky(i));
const ensureEra = (e) => {
  if (!cache.land[e]) {
    cache.land[e] = renderLand(e);
    cache.ground[e] = renderGround(e);
    cache.canopy[e] = renderCanopy(e);
    cache.lights[e] ||= renderLights(e);
  }
};
ensureSky(1); ensureEra(0);
let bakeQueue = [['sky', 3], ['sky', 4], ['era', 1], ['sky', 2], ['era', 2], ['sky', 0],
                 ['era', 3], ['sky', 5], ['era', 5], ['era', 4]];
(function bakeNext() {
  const job = bakeQueue.shift();
  if (!job) return;
  if (job[0] === 'sky') ensureSky(job[1]); else ensureEra(job[1]);
  setTimeout(bakeNext, 24);
})();

const tufts = makeTufts(9);
const PATCH = PATCHES.map(bakePatch);
/* More stone on the hill, and butterfly pea growing up canes along it. */
const HILL_ROCKS = [
  [126, 0.8, 311], [352, 1, 616], [488, 0.7, 907], [612, 0.9, 1213],
  [760, 0.75, 1511], [1040, 1.1, 616], [1166, 0.85, 1817],
];
const PEA_ROWS = [[52, 176], [300, 424], [560, 690], [946, 1078], [1128, 1200]];
const BIG_TREE = buildTree(991, { trunk: 38, thick: 7, spread: 1.2 });
const MEM_TREE = buildTree(5150, { trunk: 34, thick: 7, spread: 1 });

/* ------------------------------------------------------------- the world --*/

const cam = new Camera();
const touch = new Touchables();
const fx = new FX();
const critters = new Critters();

const G = {
  phase: 'opening',        // opening | reveal | sprout | play | ending
  t: 0,
  era: 0, eraFrom: 0, eraBlend: 1,
  tod: 1, todFrom: 1, todBlend: 1,
  weather: 'clear',
  wind: 1, gust: 0, gustT: 8,
  fade: 1,                 // 1 = fully black/white over the scene
  fadeCol: '#000000',
  flash: 0,
  vignette: 0.3,
  idle: 0,
  bedWet: 0, bedGrown: 0,
  bowlFood: 0,
  bowlKind: 0,
  patches: PATCHES.map(() => ({ grown: 0.28, wet: 0, perk: 0, glow: 0 })),
  puddles: [],
  ripples: [],
  grave: -1,               // <0 = no grave yet
  sapling: 0,
  offering: 0,
  bloom: 0,
  lanterns: 0,
  chapterFade: 0,
  petCount: 0,
  discovered: new Set(),
};

const dog = new Dog(PLACES.pond.x + 30, standY(PLACES.pond.x + 30));
dog.alive = false;         // not yet out of his hollow
const people = { A: new Person('A', -60, 0), B: new Person('B', 1260, 0), C: new Person('C', -90, 0) };
for (const k in people) people[k].visible = false;

const can = { x: PLACES.can.x, y: standY(PLACES.can.x) + 6, carried: false, fill: 0, tilt: 0,
              vy: 0, grabDX: 0, grabDY: 0, flip: false, t: 0, pouring: false,
              spoutX: undefined, spoutY: undefined };

const opening = new BlossomField({ seed: 8191, cols: 10, rows: 8 });
const LANG = new URLSearchParams(location.search).get('lang') === 'en' ? 'en' : 'th';
const act = new Act({
  fx, dog, sfx: SFX, lang: LANG,
  onFinish: () => {
    // the school day is over; the hill takes it from here
    G.fade = 1; G.fadeCol = '#0b0d14';
    G.phase = 'reveal';
    G.t = 0;
    dog.alive = false;
    cam.snap(G.sproutX - 30);
    SFX.cicada(false);
    SFX.sparkleUp();
  },
});
const ending = new Ending();
const director = new Director({ onChapterStart, applyStep });

/* ------------------------------------------------------------------ input */

const ptr = { x: 0, y: 0, wx: 0, wy: 0, down: false, moved: 0, lastX: 0, lastY: 0,
              dragging: false, sx: 0, sy: 0 };

function toBuffer(e) {
  const r = view.getBoundingClientRect();
  const bx = ((e.clientX - r.left) * (view.width / r.width) - viewT.ox) / viewT.scale;
  const by = ((e.clientY - r.top) * (view.height / r.height) - viewT.oy) / viewT.scale;
  return { x: bx, y: by };
}
function toDisplay(e) {
  const r = view.getBoundingClientRect();
  return { x: (e.clientX - r.left) * (view.width / r.width), y: (e.clientY - r.top) * (view.height / r.height) };
}

view.addEventListener('pointerdown', (e) => {
  view.setPointerCapture(e.pointerId);
  const p = toBuffer(e);
  ptr.down = true; ptr.moved = 0;
  ptr.x = p.x; ptr.y = p.y; ptr.sx = p.x; ptr.sy = p.y;
  ptr.lastX = p.x; ptr.lastY = p.y;
  ptr.dragging = false;
  G.idle = 0;
  SFX.unlock();
  Music.attach(SFX.context(), SFX.masterGain());
  if (!G.musicTried) {
    G.musicTried = true;
    // the first touch is a sweep through the blossoms, so the opening cue
    // starts exactly there
    Music.load().then((ok) => {
      if (ok && G.phase === 'opening') Music.play('opening', { at: 0, fadeIn: 0.4, volume: 0.7 });
    });
  }
  if (G.phase === 'ending' && ending.phase === 'choice') {
    const d = toDisplay(e);
    const ans = ending.press(d.x, d.y);
    if (ans) onAnswer(ans);
    return;
  }
  if (G.phase === 'opening') return;
  if (G.phase === 'act') { act.tap(p.x, p.y); ptr.dragging = 'object'; return; }
  const hit = touch.hit(p.x + cam.x, p.y);
  if (hit) { hit.onTouch(p.x + cam.x, p.y); ptr.dragging = 'object'; }
});

view.addEventListener('pointermove', (e) => {
  const p = toBuffer(e);
  const dx = p.x - ptr.lastX, dy = p.y - ptr.lastY;
  ptr.moved += Math.hypot(dx, dy);
  ptr.lastX = p.x; ptr.lastY = p.y;
  ptr.x = p.x; ptr.y = p.y;
  ptr.wx = p.x + cam.x; ptr.wy = p.y;
  if (G.phase === 'ending') { const d = toDisplay(e); ending.move(d.x, d.y); return; }
  if (G.phase === 'act') { act.move(p.x, p.y); if (ptr.down && ptr.moved > 6) act.nudge(dx, dy); return; }
  if (!ptr.down) return;
  G.idle = 0;
  if (G.phase === 'opening') {
    opening.push(p.x, p.y, dx, dy, 78);
    return;
  }
  if (can.carried) return;
  if (ptr.dragging !== 'object' && ptr.moved > 4) {
    ptr.dragging = 'camera';
    cam.nudge(dx);
  }
});

function release() {
  if (ptr.down && G.phase !== 'opening' && ptr.dragging === false && ptr.moved < 5) {
    // a tap on nothing in particular: the world still answers
    tapGround(ptr.sx + cam.x, ptr.sy);
  }
  ptr.down = false;
  if (ptr.dragging === 'camera') cam.release();
  ptr.dragging = false;
  if (can.carried) { can.carried = false; can.vy = 0; SFX.pour(false); can.pouring = false; }
}
view.addEventListener('pointerup', release);
view.addEventListener('pointercancel', release);
view.addEventListener('contextmenu', (e) => e.preventDefault());
window.addEventListener('blur', release);
window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') cam.target = cam.clampX(cam.target - 60);
  if (e.key === 'ArrowRight') cam.target = cam.clampX(cam.target + 60);
});

function tapGround(wx, wy) {
  // grass rustles, insects lift, water rings
  const gy = groundY(wx);
  if (wy > gy - 4) {
    fx.spawn('spark', { x: wx - cam.x, y: wy, vx: 0, vy: -8, life: 0.5, color: '#d8f0a0', size: 1 });
    for (let i = 0; i < 2; i++) fx.sparkle(wx - cam.x + R.f(-4, 4), wy + R.f(-3, 3), '#e8f8c0', 0.5);
    if (R.chance(0.35)) {
      fx.butterfly(wx - cam.x, wy - 6, R.chance(0.5) ? '#f0d878' : '#e8e4f8');
      SFX.plip(1.6);
    }
  }
}

/* ------------------------------------------------- touchable registration */

function registerTouchables() {
  touch.clear();
  if (G.phase === 'sprout') {
    touch.add('sprout', G.sproutX, standY(G.sproutX) + 14, 44, 50, () => wakePuppy());
    return;
  }
  if (G.phase !== 'play') return;

  touch.add('pond', PLACES.pond.x, PLACES.pond.y + 10, PLACES.pond.rx * 2, 34, (wx) => {
    G.ripples.push({ x: wx, y: PLACES.pond.y + R.f(-4, 4), t: 0, life: 1.2, max: 18 });
    SFX.plip(R.f(0.9, 1.3));
    fx.splash(wx - cam.x, PLACES.pond.y, 4, '#cdf0f8');
    if (!G.frog && R.chance(0.3)) { G.frog = 1.1; SFX.tone(160, 0.22, 'sawtooth', 0.09); }
    discover('pond');
  });
  touch.add('bed', PLACES.bed.x, PLACES.bed.y + 8, PLACES.bed.rx * 2, 30, (wx) => {
    fx.dirt(wx - cam.x, PLACES.bed.y, 4, '#6b4a32');
    SFX.rustle();
    discover('bed');
  });
  touch.add('can', can.x, can.y + 4, 30, 40, () => {
    can.carried = true;
    can.grabDX = clamp(can.x - (ptr.x + cam.x), -8, 8);
    can.grabDY = clamp(can.y - ptr.y, -6, 14);
    SFX.pop(1.3);
  });
  touch.add('bowl', PLACES.bowl.x, standY(PLACES.bowl.x) + 8, 28, 24, () => {
    // tapping it again puts something else out; he has opinions
    if (G.bowlFood > 0.15) G.bowlKind = (G.bowlKind + 1) % FOODS.length;
    G.bowlFood = 1;
    SFX.pop(0.8 + G.bowlKind * 0.06);
    const F = FOODS[G.bowlKind];
    fx.sparkle(PLACES.bowl.x - cam.x, standY(PLACES.bowl.x), F.drink ? '#a8d8ee' : '#ffd08a');
    if (dog.alive) dog.callTo(PLACES.bowl.x, 'eat');
    discover('bowl');
  });
  // the clumps along the ridge
  for (let i = 0; i < PATCH.length; i++) {
    const P0 = PATCH[i];
    touch.add('patch' + i, P0.x, standY(P0.x) + 6, P0.spread * 2 + 16, 30, (wx) => {
      const st = G.patches[i];
      st.perk = 1;
      st.glow = 0.7;
      SFX.rustle();
      for (let k = 0; k < 3; k++) fx.sparkle(wx - cam.x + R.f(-14, 14), standY(P0.x) - R.f(2, 14), '#fff4d0', 0.7);
      if (R.chance(0.55)) fx.butterfly(wx - cam.x, standY(P0.x) - 12, P0.S.col);
      if (dog.alive && R.chance(0.4)) dog.callTo(P0.x + R.f(-20, 20), 'come');
      discover('flowers');
    });
  }
  // puddles you leave behind with the can
  for (const pd of G.puddles) {
    touch.add('puddle', pd.x, standY(pd.x) + 6, 26, 18, (wx) => {
      SFX.plip(R.f(1.1, 1.6));
      fx.splash(wx - cam.x, standY(pd.x), 5, '#cdf0f8');
      pd.ring = 1;
      if (dog.alive) dog.callTo(pd.x, 'come');
      discover('puddle');
    });
  }
  touch.add('log', PLACES.log.x, standY(PLACES.log.x) + 4, 52, 20, () => {
    // a place to sit a while; the afternoon moves on a little
    G.watching = 6;
    cam.pan(PLACES.log.x + 20, 0.5);
    SFX.tone(180, 0.6, 'sine', 0.1);
    fx.sparkle(PLACES.log.x - cam.x + R.f(-18, 18), standY(PLACES.log.x), '#e8dcc0');
    discover('log');
  });
  touch.add('view', PLACES.view.x, standY(PLACES.view.x) + 4, 96, 22, () => {
    // sit and watch: the camera settles, and the afternoon moves along
    G.watching = 8;
    cam.pan(PLACES.view.x + 40, 0.5);
    SFX.tone(392, 1.2, 'sine', 0.08);
    discover('view');
  });
  touch.add('sign', PLACES.sign.x, standY(PLACES.sign.x) + 4, 30, 48, () => {
    SFX.tone(240, 0.2, 'triangle', 0.1);
    for (let i = 0; i < 3; i++) fx.spawn('bird', { x: PLACES.sign.x - cam.x, y: standY(PLACES.sign.x) - 30, vx: R.f(-40, 40), vy: -30, life: 4, size: 0.8, color: '#4a4a54' });
    discover('sign');
  });
  touch.add('rocks', PLACES.rocks.x, standY(PLACES.rocks.x) + 4, 60, 22, () => {
    SFX.rustle();
    fx.spawn('spark', { x: PLACES.rocks.x - cam.x + R.f(-20, 20), y: standY(PLACES.rocks.x), vx: R.f(-20, 20), vy: 0, life: 1.4, color: '#6a5a3a', size: 1 });
    discover('rocks');
  });
  if (G.grave >= 0) {
    touch.add('grave', PLACES.grave.x, PLACES.grave.y, 40, 30, () => {
      G.offering = Math.min(6, G.offering + 1);
      fx.sparkle(PLACES.grave.x - cam.x, PLACES.grave.y - 8, '#ffe8c0', 1.2);
      SFX.tone(523, 1.4, 'sine', 0.08);
    });
  }
  if (dog.alive) {
    touch.add('dog', dog.x, dog.y, Math.max(30, AGES[dog.age].w * 1.8), 34 + dog.z, () => petDog());
  }
  for (const b of critters.birds) {
    if (b.state === 'leaving') continue;
    touch.add('crow', b.x, b.y + 2, 26, 26, (wx, wy) => shooAt(wx, wy));
  }
  for (const g of critters.bugs) {
    if (g.leaving > 0) continue;
    touch.add('beetle', g.x, g.y + 6, 18, 18, (wx, wy) => shooAt(wx, wy));
  }
  for (const k of ['A', 'B', 'C']) {
    const p = people[k];
    if (!p.visible) continue;
    touch.add('person' + k, p.x, p.y, 20, 46, () => {
      p.face = p.face === 'smile' ? 'laugh' : 'smile';
      fx.heart(p.x - cam.x, p.y - 44);
      SFX.pop(1.5);
    });
  }
}

function discover(id) {
  if (G.discovered.has(id)) return;
  G.discovered.add(id);
  fx.sparkle(ptr.x, ptr.y, '#fff4c8', 1);
}

/** Flick a beetle off the flowers, or see a crow off. */
function shooAt(wx, wy) {
  const got = critters.shoo(wx, wy);
  if (!got) return;
  const vx = got.x - cam.x;
  if (got.kind === 'bird') {
    SFX.tone(R.f(300, 380), 0.18, 'sawtooth', 0.12);
    setTimeout(() => SFX.tone(R.f(240, 300), 0.14, 'sawtooth', 0.09), 120);
    fx.burst(vx, got.y - 8, 10, '#2b2d38', 46);
    for (let i = 0; i < 3; i++) fx.petal('leaf', vx + R.f(-6, 6), got.y - 10, 6);
    if (dog.alive && Math.abs(dog.x - got.x) < 140) {
      dog.react('play');
      fx.heart(dog.x - cam.x, dog.y - 16);
    }
    discover('crow');
  } else {
    SFX.plip(1.8);
    fx.sparkle(vx, got.y, '#d8ffc0', 0.6);
    const st = G.patches[got.patch];
    if (st) { st.perk = 1; st.glow = 0.5; }
    discover('beetle');
  }
}

function petDog() {
  if (!dog.alive) return;
  G.petCount++;
  // a young dog that is already delighted bounds off in a circle
  if (dog.mood > 0.75 && AGES[dog.age].energy > 0.6) {
    dog.state = 'moving';
    dog.why = 'come';
    dog.target = inWorld(dog.x + (R.chance(0.5) ? -90 : 90), 120);
    dog.timer = 8;
    dog.bounce(1.3);
  } else {
    dog.bounce(0.8);
  }
  dog.react('pet');
  const n = dog.age >= 4 ? 1 : 2;
  for (let i = 0; i < n; i++) fx.heart(dog.x - cam.x + R.f(-5, 5), dog.y - 16);
  SFX.pop(1.1 + Math.random() * 0.2);
  if (G.petCount % 5 === 0) SFX.sparkleUp();
}

/* ------------------------------------------------------- opening sequence */

G.sproutX = PLACES.pond.x + 96;   // a scrape of bare earth on open turf

function onOpeningCleared() {
  G.phase = 'act';
  G.t = 0;
  act.begin();
  SFX.sparkleUp();
  const spec = Music.spec('opening');
  Music.stop('opening', (spec && spec.markers && spec.markers.fadeOutOver) || 2.2);
}
opening.onCleared = onOpeningCleared;

function wakePuppy() {
  if (G.phase !== 'sprout') return;
  G.phase = 'play';
  dog.alive = true;
  dog.x = G.sproutX;
  dog.y = standY(G.sproutX);
  dog.age = 0;
  dog.state = 'idle';
  dog.pose = 'sit';
  dog.mood = 1;
  G.popT = 0;
  fx.dirt(G.sproutX - cam.x, standY(G.sproutX), 16, '#6b4a32');
  fx.burst(G.sproutX - cam.x, standY(G.sproutX) - 8, 22, '#eaffb0', 60);
  for (let i = 0; i < 5; i++) fx.heart(G.sproutX - cam.x + R.f(-8, 8), standY(G.sproutX) - 14);
  SFX.sparkleUp();
  SFX.pop(1.6);
  cam.pan(G.sproutX, 1.2);
  // and now the story begins
  setTimeout(() => { if (G.phase === 'play') director.begin(1); }, 4200);
}

/* ---------------------------------------------------------- chapter hooks */

function onChapterStart(c) {
  G.eraFrom = G.era; G.era = c.era; G.eraBlend = 0;
  G.todFrom = G.tod; G.tod = c.tod; G.todBlend = 0;
  ensureEra(c.era); ensureSky(c.tod);
  G.weather = c.weather || 'clear';
  G.lanterns = c.lanterns ? 1 : 0;
  if (c.plantBed !== undefined) G.bedGrown = Math.max(G.bedGrown, c.plantBed);
  if (c.grave !== undefined) G.grave = c.grave;
  if (c.sapling !== undefined) G.sapling = c.sapling;
  if (c.offering !== undefined) G.offering = c.offering;
  dog.age = clamp(c.dogAge || 0, 0, 4);
  dog.alive = !c.noDog;
  if (c.dogAt !== undefined && dog.alive) { dog.x = c.dogAt; dog.y = standY(c.dogAt); }
  dog.alpha = 1;
  for (const k of ['A', 'B', 'C']) { people[k].visible = false; people[k].target = null; }
  for (const m of (c.cast || [])) {
    const p = people[m.who];
    p.visible = true;
    p.outfit = m.outfit;
    p.age = m.age || 0;
    p.x = m.from;
    p.y = standY(m.from);
    p.pose = 'stand';
    p.face = 'calm';
    p.prop = m.prop || null;
    p.flip = false;
    p.hairOverride = m.hair || null;
    p.alpha = 1;
  }
  // look where the visit is going to happen
  const firstWalk = (c.script || []).find((s) => s.walk !== undefined);
  cam.pan((firstWalk ? firstWalk.walk : (c.dogAt || PLACES.log.x)) + 26, 0.5);
  G.chapterFade = 1;
}

function applyStep(step, c) {
  if (step.who) {
    const p = people[step.who];
    if (!p) return;
    if (step.walk !== undefined) {
      p.visible = true;
      p.leaving = step.walk <= 40 || step.walk >= 1160;
      p.walkTo(step.walk, { speed: step.speed || 30 });
      if (step.prop !== undefined) p.prop = step.prop;
      if (step.face) p.face = step.face;
    } else {
      p.setPose(step);
    }
    if (step.feed) {
      G.bowlFood = 1;
      if (dog.alive) dog.callTo(p.x + (p.flip ? -16 : 16), 'eat');
      fx.sparkle(p.x - cam.x, p.y - 20, '#ffd08a');
    }
  }
  if (step.dogTo !== undefined && dog.alive) dog.callTo(step.dogTo, step.why || 'come');
  if (step.dogPose) {
    dog.state = step.dogPose === 'sleep' ? 'sleep' : 'idle';
    dog.timer = 40;
    dog.hold(step.dogPose, step.dogPose === 'sleep' ? 999 : 40);
  }
  if (step.dogLook === 'between') dog.attention = { x: dog.x + 20, y: dog.y - 30 };
  if (step.dogLook === 'away') dog.attention = { x: -200, y: dog.y - 20 };
  if (step.dogLap) dog.pose = 'lie';
  if (step.splash) {
    for (let i = 0; i < 14; i++) fx.splash(PLACES.pond.x - cam.x + R.f(-20, 20), PLACES.pond.y, 3, '#cdf0f8');
    G.ripples.push({ x: PLACES.pond.x, y: PLACES.pond.y, t: 0, life: 1.4, max: 26 });
    SFX.plip(0.7);
  }
  if (step.cam !== undefined) cam.pan(step.cam, step.hold ? 1.4 : 0.7);
  if (step.dogFade) {
    dog.dying = true;
    SFX.tone(196, 3.4, 'sine', 0.08);
  }
  if (step.bloomNow) {
    G.bloom = 0.001;
    SFX.bloom();
    cam.pan(PLACES.grave.x, 1.6);
  }
}

function onAnswer(key) {
  if (key === 'YES') {
    for (let i = 0; i < 40; i++) {
      setTimeout(() => fx.heart(R.f(0, W), R.f(60, H)), i * 60);
    }
    SFX.bloom();
  } else {
    SFX.tone(392, 2.2, 'sine', 0.08);
  }
}

/* ----------------------------------------------------------------- update */

function update(dt) {
  G.t += dt;
  G.idle += dt;
  can.t += dt;
  can.streaming = Math.max(0, (can.streaming || 0) - dt);
  cam.update(dt);

  // wind, with occasional gusts
  G.gustT -= dt;
  if (G.gustT <= 0) { G.gustT = R.f(10, 24); G.gustLen = R.f(1.6, 3); G.gustAge = 0; SFX.rustle(); }
  if (G.gustLen) {
    G.gustAge += dt;
    const k = clamp(G.gustAge / G.gustLen, 0, 1);
    G.gust = Math.sin(k * Math.PI) * 0.8;
    if (k >= 1) { G.gustLen = 0; G.gust = 0; }
  }
  const windBase = G.weather === 'wind' ? 2 : G.weather === 'still' ? 0.35 : 1;
  G.wind = windBase * (1 + Math.sin(G.t * 0.23) * 0.4) + G.gust * 2.4;

  G.eraBlend = Math.min(1, G.eraBlend + dt * 0.4);
  G.todBlend = Math.min(1, G.todBlend + dt * 0.4);
  G.chapterFade = Math.max(0, G.chapterFade - dt * 0.7);
  G.flash = Math.max(0, G.flash - dt * 1.1);
  G.fade = Math.max(0, G.fade - dt * 0.6);

  for (let i = G.ripples.length - 1; i >= 0; i--) {
    G.ripples[i].t += dt;
    if (G.ripples[i].t > G.ripples[i].life) G.ripples.splice(i, 1);
  }
  G.bedWet = Math.max(0, G.bedWet - dt * 0.03);
  G.bedPerk = Math.max(0, (G.bedPerk || 0) - dt * 1.4);
  for (const st of G.patches) {
    st.wet = Math.max(0, st.wet - dt * 0.03);
    st.perk = Math.max(0, st.perk - dt * 1.2);
    st.glow = Math.max(0, st.glow - dt * 0.9);
  }
  if (G.frog > 0) { G.frog -= dt; if (G.frog <= 0) { G.frog = 0; G.ripples.push({ x: PLACES.pond.x - 5, y: PLACES.pond.y - 2, t: 0, life: 1, max: 12 }); } }
  if (G.watching > 0) G.watching -= dt;

  if (G.phase === 'opening') {
    opening.update(dt);
    return;
  }
  if (G.phase === 'act') {
    act.update(dt);
    fx.update(dt, {});
    return;
  }
  if (G.phase === 'reveal') {
    if (G.t > 3.2) { G.phase = 'sprout'; G.t = 0; }
  }

  updateCan(dt);
  if (dog.alive) {
    dog.y = standY(dog.x);
    dog.x = inWorld(dog.x, 60);
    dog.update(dt);
    if (dog.shedding && R.chance(dt * 30)) {
      fx.splash(dog.x - cam.x + R.f(-8, 8), dog.y - R.f(4, 12), 2, '#cdf0f8');
    }
    if (dog.dying) {
      dog.pose = 'sleep';
      dog.state = 'sleep';
      dog.alpha = Math.max(0, (dog.alpha === undefined ? 1 : dog.alpha) - dt * 0.14);
      if (dog.alpha <= 0.02) { dog.alive = false; dog.dying = false; }
    }
    // he watches whoever is closest
    let best = null, bd = 1e9;
    for (const k of ['A', 'B', 'C']) {
      const p = people[k];
      if (!p.visible) continue;
      const d = Math.abs(p.x - dog.x);
      if (d < bd) { bd = d; best = p; }
    }
    dog.attention = bd < 90 ? { x: best.x, y: best.y - 30 } : (ptr.down ? { x: ptr.wx, y: ptr.wy } : null);
  }
  for (const k of ['A', 'B', 'C']) {
    const p = people[k];
    if (!p.visible) continue;
    p.update(dt);
    p.y = standY(p.x);
    if (p.leaving && p.target === null) { p.visible = false; p.leaving = false; }
  }

  if (G.phase === 'play') {
    director.update(dt * (G.watching > 0 ? 2.4 : 1));
    // a longer score could hold a visit open; the supplied clips do not
    const win = Music.chapterWindow(director.chapter.id);
    const mt = win ? Music.time(win.track) : null;
    const musicSaysGo = win && mt !== null ? mt >= win.to : true;
    if (director.finished && musicSaysGo && director.index < CHAPTERS.length - 1) nextChapter();
    else if (director.finished && G.bloom > 0.9 && G.phase === 'play') startEnding();
  }
  if (G.bloom > 0 && G.bloom < 1) G.bloom = Math.min(1, G.bloom + dt * 0.12);
  if (G.phase === 'ending') ending.update(dt);

  if (G.phase === 'play') {
    updatePuddles(dt);
    critters.update(dt, {
      patches: G.patches,
      patchAt: (i) => ({ x: PATCH[i].x, y: standY(PATCH[i].x), spread: PATCH[i].spread }),
      dog,
      standY,
      bowlX: PLACES.bowl.x,
      quiet: G.weather === 'rain' || G.tod === 5 || G.watching > 0,
      onBugBite: (i, b) => {
        const st = G.patches[i];
        st.grown = Math.max(0.05, st.grown - 0.012);
        st.perk = 0.5;
        fx.spawn('spark', { x: b.x - cam.x, y: b.y, vx: R.f(-6, 6), vy: 6, life: 0.6, color: '#7a9a4a', size: 1 });
      },
      onPeck: (b) => {
        if (Math.abs(b.x - PLACES.bowl.x) < 18 && G.bowlFood > 0) {
          G.bowlFood = Math.max(0, G.bowlFood - 0.14);          // it is stealing his dinner
          fx.spawn('spark', { x: b.x - cam.x, y: standY(b.x) - 4, vx: R.f(-10, 10), vy: -12, life: 0.5, color: '#d8a868', size: 1 });
        }
        if (dog.alive && Math.abs(b.x - dog.x) < 26) {
          dog.react('scare');
          if (R.chance(0.4)) SFX.pop(0.6);
        }
      },
    });
  }

  ambient(dt);
  fx.update(dt, {
    groundAt: (x) => {
      const wx = x + cam.x;
      if (Math.abs(wx - PLACES.pond.x) < PLACES.pond.rx) return PLACES.pond.y;
      return standY(wx) + 4;
    },
    onDrop: (a) => {
      const wx = a.x + cam.x;
      const onPond = Math.abs(wx - PLACES.pond.x) < PLACES.pond.rx && Math.abs(a.y - PLACES.pond.y) < PLACES.pond.ry + 8;
      fx.splash(a.x, a.y, 3, onPond ? '#cdf0f8' : '#dff4ff');
      if (onPond && R.chance(0.25)) G.ripples.push({ x: wx, y: a.y, t: 0, life: 0.9, max: 10 });
      if (R.chance(0.08)) SFX.plip(R.f(0.8, 1.5));
    },
  });
  registerTouchables();
}

let chapterPending = false;
function nextChapter() {
  if (chapterPending) return;
  chapterPending = true;
  G.fadeCol = '#0b0d14';
  G.fade = 0.0;
  const fadeOut = setInterval(() => { G.fade = Math.min(1, G.fade + 0.05); }, 24);
  setTimeout(() => {
    clearInterval(fadeOut);
    director.begin(director.index + 1);
    chapterPending = false;
  }, 1500);
}

function startEnding() {
  G.phase = 'ending';
  ending.close();
  SFX.bloom();
}

/* ------------------------------------------------------------ watering can */

function waterTarget() {
  const sx = (can.spoutX === undefined ? can.x - 15 : can.spoutX) + cam.x;
  const sy = can.spoutY === undefined ? can.y - 7 : can.spoutY;
  const near = (tx, ty, rx, ry) => Math.abs(sx - tx) < rx && sy > ty - ry && sy < ty + 24;
  if (near(PLACES.bed.x, PLACES.bed.y, PLACES.bed.rx, 26)) return 'bed';
  if (G.sapling > 0 && G.sapling < 1 && near(PLACES.grave.x, PLACES.grave.y - 20, 34, 46)) return 'sapling';
  if (dog.alive && near(dog.x, dog.y - 8, 20, 22)) return 'dog';
  if (near(PLACES.bowl.x, standY(PLACES.bowl.x), 14, 20)) return 'bowl';
  for (let i = 0; i < PATCH.length; i++) {
    if (near(PATCH[i].x, standY(PATCH[i].x), PATCH[i].spread + 10, 26)) return 'patch' + i;
  }
  // anywhere else, held low: it just soaks into the grass and puddles
  if (sy > groundY(sx) - 22 && sy < groundY(sx) + 30) return 'ground';
  return null;
}
function overPond() {
  return Math.abs(can.x - PLACES.pond.x) < PLACES.pond.rx + 10 &&
         can.y > PLACES.pond.y - 34 && can.y < PLACES.pond.y + 24;
}

function updateCan(dt) {
  if (can.carried) {
    can.x = lerp(can.x, inWorld(ptr.x + cam.x + can.grabDX, 20), 1 - Math.pow(0.002, dt));
    can.y = lerp(can.y, clamp(ptr.y + can.grabDY, 150, H - 6), 1 - Math.pow(0.002, dt));
    if (overPond() && can.fill < 1) {
      can.fill = Math.min(1, can.fill + dt * 0.5);
      can.tilt = lerp(can.tilt, 0.12, dt * 6);
      if (R.chance(dt * 8)) {
        G.ripples.push({ x: can.x + R.f(-6, 6), y: PLACES.pond.y + R.f(-3, 3), t: 0, life: 1, max: 13 });
        SFX.plip(R.f(0.7, 1.2));
      }
      if (can.pouring) { can.pouring = false; SFX.pour(false); }
    } else {
      const tgt = waterTarget();
      if (tgt && can.fill > 0.01) {
        const aim = tgt === 'bed' ? PLACES.bed.x : tgt === 'sapling' ? PLACES.grave.x
          : tgt === 'bowl' ? PLACES.bowl.x : tgt.startsWith('patch') ? PATCH[+tgt.slice(5)].x
          : tgt === 'ground' ? can.x + 1 : dog.x;
        can.flip = aim > can.x;
        can.tilt = lerp(can.tilt, 1, dt * 5);
        if (can.tilt > 0.45) {
          can.fill = Math.max(0, can.fill - dt * 0.26);
          pourOnto(tgt, dt);
          if (!can.pouring) { can.pouring = true; SFX.pour(true); }
        }
      } else {
        can.tilt = lerp(can.tilt, 0, dt * 6);
        if (can.pouring) { can.pouring = false; SFX.pour(false); }
      }
    }
  } else {
    can.tilt = lerp(can.tilt, 0, dt * 6);
    const rest = standY(can.x) + 6;
    if (can.y < rest) {
      can.vy += 420 * dt;
      can.y += can.vy * dt;
      if (can.y >= rest) {
        can.y = rest;
        if (can.vy > 60) { SFX.thud(); fx.dirt(can.x - cam.x, can.y, 4, '#6f8f42'); }
        can.vy = 0;
      }
    }
  }
}

function pourOnto(tgt, dt) {
  const sx = can.spoutX === undefined ? can.x - 15 : can.spoutX;
  const sy = can.spoutY === undefined ? can.y - 7 : can.spoutY;
  for (let i = 0; i < 2; i++) {
    if (R.chance(dt * 44)) fx.drop(sx + R.f(-2.5, 2.5), sy + R.f(0, 3), can.flip ? 14 : -14, 30 + R.f(0, 30));
  }
  can.streaming = 0.12;
  if (tgt === 'bed') {
    const was = G.bedGrown;
    G.bedWet = Math.min(1, G.bedWet + dt * 0.5);
    G.bedGrown = Math.min(1, G.bedGrown + dt * 0.035);
    G.bedPerk = 1;
    if (R.chance(dt * 14)) fx.sparkle(PLACES.bed.x - cam.x + R.f(-32, 32), PLACES.bed.y - R.f(0, 20), '#d8ffc0');
    if (R.chance(dt * 6)) fx.splash(PLACES.bed.x - cam.x + R.f(-30, 30), PLACES.bed.y - 2, 2, '#cfeee0');
    // each new bloom announces itself
    if (Math.floor(was * 6) !== Math.floor(G.bedGrown * 6)) {
      fx.burst(PLACES.bed.x - cam.x, PLACES.bed.y - 14, 12, '#fff0b4', 34);
      SFX.tone(523 + Math.floor(G.bedGrown * 6) * 60, 0.5, 'sine', 0.1);
    }
  } else if (tgt === 'sapling') {
    G.sapling = Math.min(1, G.sapling + dt * 0.02);
    if (R.chance(dt * 8)) fx.sparkle(PLACES.grave.x - cam.x + R.f(-20, 20), PLACES.grave.y - R.f(4, 40), '#d8ffc0');
  } else if (tgt === 'dog') {
    dog.mood = 1;
    dog.react('play');
    dog.wet = Math.min(1, (dog.wet || 0) + dt * 0.8);
    if (R.chance(dt * 6)) fx.heart(dog.x - cam.x + R.f(-6, 6), dog.y - 18);
  } else if (tgt === 'bowl') {
    const wi = FOODS.findIndex((F) => F.drink);
    G.bowlKind = wi < 0 ? G.bowlKind : wi;
    G.bowlFood = Math.min(1, G.bowlFood + dt * 1.2);
    if (R.chance(dt * 5)) fx.splash(PLACES.bowl.x - cam.x, standY(PLACES.bowl.x) + 8, 2, '#cdf0f8');
    if (dog.alive && R.chance(dt * 0.7)) dog.callTo(PLACES.bowl.x, 'eat');
  } else if (tgt.startsWith('patch')) {
    const i = +tgt.slice(5);
    const st = G.patches[i];
    const was = st.grown;
    st.wet = Math.min(1, st.wet + dt * 0.6);
    st.grown = Math.min(1, st.grown + dt * 0.055);
    st.perk = 1;
    st.glow = Math.min(1, st.glow + dt * 1.4);
    if (R.chance(dt * 12)) fx.sparkle(PATCH[i].x - cam.x + R.f(-26, 26), standY(PATCH[i].x) - R.f(0, 16), '#d8ffc0');
    if (Math.floor(was * 5) !== Math.floor(st.grown * 5)) {
      fx.burst(PATCH[i].x - cam.x, standY(PATCH[i].x) - 12, 10, PATCH[i].S.col, 30);
      SFX.tone(440 + Math.floor(st.grown * 5) * 70, 0.4, 'sine', 0.08);
      if (R.chance(0.6)) fx.butterfly(PATCH[i].x - cam.x, standY(PATCH[i].x) - 14, PATCH[i].S.col);
    }
  } else if (tgt === 'ground') {
    // it pools where you stand, and stays a while
    const gx = sx + cam.x;
    let pd = G.puddles.find((q) => Math.abs(q.x - gx) < 16);
    if (!pd && G.puddles.length < 6) { pd = { x: gx, size: 0, life: 40, ring: 0 }; G.puddles.push(pd); }
    if (pd) { pd.size = Math.min(1, pd.size + dt * 0.7); pd.life = 44; }
    if (R.chance(dt * 8)) fx.splash(sx + R.f(-5, 5), groundY(gx) + 2, 2, '#cfeee0');
    if (R.chance(dt * 4)) fx.sparkle(sx + R.f(-8, 8), groundY(gx), '#d8f4ff', 0.5);
  }
}

/* --------------------------------------------------------------- puddles */

function updatePuddles(dt) {
  for (let i = G.puddles.length - 1; i >= 0; i--) {
    const pd = G.puddles[i];
    pd.life -= dt;
    pd.ring = Math.max(0, (pd.ring || 0) - dt);
    if (pd.life < 6) pd.size = Math.max(0, pd.size - dt * 0.14);
    if (pd.size <= 0.01) { G.puddles.splice(i, 1); continue; }
    // he cannot walk past one without standing in it
    if (dog.alive && Math.abs(dog.x - pd.x) < 10 && dog.z < 2 && R.chance(dt * 1.4)) {
      fx.splash(pd.x - cam.x + R.f(-4, 4), standY(pd.x) + 2, 3, '#cdf0f8');
      pd.ring = 0.8;
      dog.wet = Math.min(1, (dog.wet || 0) + 0.25);
      if (R.chance(0.3)) SFX.plip(R.f(1.2, 1.7));
    }
  }
  if (dog.alive) dog.wet = Math.max(0, (dog.wet || 0) - dt * 0.05);
}

function drawPuddle(ctx2, pd, night) {
  const x = pd.x - cam.x;
  const y = standY(pd.x) + 2;
  const w = 4 + pd.size * 11, h = 1.4 + pd.size * 3;
  fillEllipse(ctx2, x, y, w + 1, h + 0.8, rgba('#2c3a2a', 0.4));
  fillEllipse(ctx2, x, y, w, h, night ? '#2e4356' : '#6ea6c0');
  fillEllipse(ctx2, x - w * 0.25, y - h * 0.25, w * 0.4, h * 0.4, night ? '#41607a' : '#a8d8ee');
  ctx2.globalAlpha = 0.5 + 0.3 * Math.sin(G.t * 2 + pd.x);
  ctx2.fillStyle = '#ffffff';
  ctx2.fillRect(Math.round(x + w * 0.2), Math.round(y - h * 0.2), 1, 1);
  ctx2.globalAlpha = 1;
  if (pd.ring > 0) {
    ctx2.globalAlpha = pd.ring * 0.7;
    ctx2.strokeStyle = '#d8f4ff';
    ctx2.beginPath();
    ctx2.ellipse(Math.round(x), Math.round(y), w * (1.4 - pd.ring), h * (1.4 - pd.ring), 0, 0, 6.3);
    ctx2.stroke();
    ctx2.globalAlpha = 1;
  }
}

/* --------------------------------------------------------------- ambience */

function ambient(dt) {
  const P = ERAS[G.era];
  const T = TIMES[G.tod];
  G.ambT = (G.ambT || 0) - dt;
  if (G.ambT <= 0) {
    G.ambT = 0.12;
    if (G.weather === 'rain') {
      for (let i = 0; i < 14; i++) {
        fx.spawn('drop', { x: R.f(-20, W + 20), y: R.f(-40, 40), vx: -20, vy: 210, grav: 30, life: 4, size: 1 });
      }
    }
    if (G.weather === 'petals' || P.petal === 'sakura') fx.petal('sakura', R.f(-20, W), R.f(-20, 120), 11);
    if (P.petal === 'leaf') fx.petal('leaf', R.f(-20, W), R.f(-20, 140), 15);
    if (P.petal === 'pea' && R.chance(0.5)) fx.petal('pea', R.f(-20, W), R.f(-20, 140), 9);
    if (R.chance(0.35)) fx.mote(R.f(0, W), R.f(150, H));
    if (G.gust > 0.3 && R.chance(0.6)) fx.petal(P.petal || 'leaf', R.f(-20, W * 0.3), R.f(150, H - 10), R.f(-4, 8));
  }
  G.birdT = (G.birdT || 3) - dt;
  if (G.birdT < 0 && G.tod !== 5) {
    G.birdT = R.f(9, 22);
    const n = R.i(1, 4);
    for (let i = 0; i < n; i++) setTimeout(() => fx.bird(R.f(40, 110)), i * 180);
  }
  const wantB = Math.round((P.butterflies || 0.2) * 6 * (G.tod === 5 ? 0 : 1));
  const haveB = fx.p.filter((a) => a.type === 'butterfly').length + fx.back.filter((a) => a.type === 'butterfly').length;
  if (haveB < wantB && R.chance(dt * 1.6)) {
    fx.butterfly(R.f(20, W - 20), R.f(190, H - 20), P.key === 'cherry' ? '#ffb0d0' : '#6f5ae0');
  }
  const wantF = T.key === 'night' || T.key === 'dusk' ? 20 : 0;
  const haveF = fx.p.filter((a) => a.type === 'firefly').length;
  if (haveF < wantF && R.chance(dt * 10)) fx.firefly(R.f(10, W - 10), R.f(215, H - 10));
}

/* ----------------------------------------------------------------- render */

function drawActScene() {
  act.draw(ctx);
  fx.draw(ctx, 'front', ERAS[0]);
  vignette(act.S.indoorLight === false ? 0.24 : 0.14);
}

function drawScene() {
  const P = ERAS[G.era];
  const T = TIMES[G.tod];
  const night = T.key === 'night' || T.key === 'dusk';

  /* sky, land, town lights */
  const skyX = Math.round(cam.skyOffset);
  const sky = cache.sky[G.tod] || cache.sky[1];
  const skyOld = cache.sky[G.todFrom] || sky;
  ctx.drawImage(skyOld, skyX, LAND_DY);
  if (G.todBlend < 1) {
    ctx.globalAlpha = ease.inOut(G.todBlend);
    ctx.drawImage(sky, skyX, LAND_DY);
    ctx.globalAlpha = 1;
  } else ctx.drawImage(sky, skyX, LAND_DY);
  ctx.fillStyle = T.sky[T.sky.length - 1][1];
  ctx.fillRect(0, SKY_H - 1 + LAND_DY, W, H - SKY_H + 1 - LAND_DY);

  const landX = Math.round(cam.landOffset);
  const land = cache.land[G.era] || cache.land[0];
  const landOld = cache.land[G.eraFrom] || land;
  ctx.drawImage(landOld, landX, LAND_DY);
  if (G.eraBlend < 1) {
    ctx.globalAlpha = ease.inOut(G.eraBlend);
    ctx.drawImage(land, landX, LAND_DY);
    ctx.globalAlpha = 1;
  } else ctx.drawImage(land, landX, LAND_DY);

  // the hour lies over the land
  if (T.wash && T.washAmt > 0) {
    ctx.globalAlpha = T.washAmt;
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = T.wash;
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }
  if (T.lights > 0 && cache.lights[G.era]) {
    ctx.globalAlpha = T.lights * (0.7 + 0.3 * Math.sin(G.t * 0.7));
    ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(cache.lights[G.era], landX, LAND_DY);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }

  drawMist(ctx, G.t, P, G.weather === 'mist' ? 2.2 : G.era === 2 ? 1.2 : 0.7);
  if (!night && G.weather !== 'rain' && G.weather !== 'overcast') {
    drawRays(ctx, G.t, T.sun.x * LAND_W + landX, T.sun.y * SKY_H + LAND_DY, { sun: { glow: T.sun.glow } }, 0.9);
  }
  fx.draw(ctx, 'back', P);

  /* the hill */
  const gnd = cache.ground[G.era] || cache.ground[0];
  const gndOld = cache.ground[G.eraFrom] || gnd;
  ctx.drawImage(gndOld, -Math.round(cam.x), 0);
  if (G.eraBlend < 1) {
    ctx.globalAlpha = ease.inOut(G.eraBlend);
    ctx.drawImage(gnd, -Math.round(cam.x), 0);
    ctx.globalAlpha = 1;
  } else ctx.drawImage(gnd, -Math.round(cam.x), 0);

  const cx = cam.x;
  const V = (wx) => wx - cx;

  drawPond(ctx, V(PLACES.pond.x), P, G.t, { ripples: G.ripples, night, frog: G.frog > 0 ? G.frog : 0 });
  drawBed(ctx, V(PLACES.bed.x), P, G.t, { wet: G.bedWet, grown: G.bedGrown, perk: G.bedPerk, night });
  for (const pd of G.puddles) drawPuddle(ctx, pd, night);
  for (let i = 0; i < PATCH.length; i++) {
    const st = G.patches[i];
    if (st.glow > 0) {
      ctx.globalAlpha = st.glow * 0.16;
      fillEllipse(ctx, V(PATCH[i].x), standY(PATCH[i].x) - 8, PATCH[i].spread + 14, 13, '#ffffff');
      ctx.globalAlpha = 1;
    }
    drawPatch(ctx, V(PATCH[i].x), standY(PATCH[i].x) + 2, PATCH[i], G.t, G.wind, st, night);
  }
  drawViewWall(ctx, V(PLACES.view.x), P, G.t, night);
  drawSignpost(ctx, V(PLACES.sign.x), P, G.t, night);
  for (const [wx, sc, seed] of HILL_ROCKS) {
    const x = V(wx);
    if (x < -60 || x > W + 60) continue;
    ctx.save();
    if (sc !== 1) { ctx.translate(x, standY(wx)); ctx.scale(sc, sc); ctx.translate(-x, -standY(wx)); }
    drawRocks(ctx, x, P, G.t, night, wx, seed);
    ctx.restore();
  }
  drawBowl(ctx, V(PLACES.bowl.x), P, G.t, { food: G.bowlFood, kind: G.bowlKind, night });

  // the old tree the two of them sit under
  drawTree(ctx, V(PLACES.bigTree.x), standY(PLACES.bigTree.x) + 8, BIG_TREE, 1, G.t, P, {
    scale: 1.15, night, season: seasonOf(P),
  });
  drawLog(ctx, V(PLACES.log.x), P, G.t, night);

  // the resting place: the tree goes in behind, the stone stands in front
  if (G.grave >= 0) {
    if (G.sapling > 0) {
      drawTree(ctx, V(PLACES.grave.x) + 30, PLACES.grave.y - 2, MEM_TREE, G.sapling, G.t, P, {
        scale: lerp(0.5, 1.7, G.sapling), night, season: seasonOf(P),
      });
      if (G.bloom > 0) {
        // one flower, and it takes its time opening
        const bx = V(PLACES.grave.x) + 42;
        const by = PLACES.grave.y - 2 - 60 * lerp(0.5, 1.7, G.sapling) * 0.6;
        const r = 2.5 + ease.out(clamp(G.bloom, 0, 1)) * 8.5;
        ctx.globalAlpha = 0.16 * G.bloom;
        fillEllipse(ctx, bx, by, r * 2, r * 2, '#9d8bee');
        ctx.globalAlpha = 1;
        drawPeaFlower(ctx, bx, by, r, G.t);
        if (R.chance(0.08 * G.bloom)) fx.sparkle(bx + R.f(-8, 8), by + R.f(-8, 8), '#e8dcff', 1.2);
      }
    }
    drawGrave(ctx, V(PLACES.grave.x), P, G.t, { age: G.grave, offering: G.offering, night });
  }

  // butterfly pea, on canes, as tall as it actually grows
  {
    const era = ERAS[G.era];
    const tall = era.canopy === 'pea' ? 1.25 : era.key === 'wither' || era.canopy === 'bare' ? 0.55 : 0.9;
    const rows = era.canopy === 'pea' ? PEA_ROWS.concat([[176, 300], [690, 820]]) : PEA_ROWS;
    for (const [a, b] of rows) {
      if (b - cx < -40 || a - cx > W + 40) continue;
      drawPeaVines(ctx, cx, G.t, a, b, { wind: G.wind, night, tall, seed: a * 7 + 13, step: era.canopy === 'pea' ? 12 : 15 });
    }
  }

  drawTufts(ctx, tufts, P, G.t, G.wind, cx, false);

  /* actors, sorted back to front */
  const actors = [];
  if (G.phase === 'sprout') actors.push({ y: standY(G.sproutX), d: () => drawSprout() });
  if (dog.alive) actors.push({ y: dog.y, d: () => dog.draw(ctx, cx, { alpha: dog.alpha }) });
  for (const k of ['A', 'B', 'C']) {
    const p = people[k];
    if (p.visible) actors.push({ y: p.y, d: () => p.draw(ctx, cx, { hairOverride: p.hairOverride, blush: p.blush }) });
  }
  actors.push({ y: can.carried ? 1e4 : can.y, d: () => drawTheCan() });
  for (const b of critters.birds) actors.push({ y: b.y, d: () => critters.drawBird(ctx, cx, night, b) });
  for (const g of critters.bugs) actors.push({ y: g.y + 20, d: () => critters.drawBug(ctx, cx, night, g) });
  actors.sort((a, b) => a.y - b.y);
  for (const a of actors) a.d();

  /* in front of everything */
  const can2 = cache.canopy[G.era] || cache.canopy[0];
  ctx.drawImage(can2, -Math.round(cam.x), 0);
  fx.draw(ctx, 'front', P);
  drawTufts(ctx, tufts, P, G.t, G.wind * 1.2, cx, true);

  drawWeather(P, T);
  drawHints();

  /* grade */
  if (P.grade && P.gradeAmt > 0) {
    ctx.globalAlpha = P.gradeAmt * G.eraBlend;
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = P.grade;
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
  vignette(G.vignette + (night ? 0.1 : 0));
}

const seasonOf = (P) => (P.canopy === 'bare' ? 'bare' : P.canopy === 'blossom' ? 'blossom'
  : P.key === 'wither' ? 'autumn' : P.canopy === 'pea' ? 'pea' : 'green');

function drawSprout() {
  const x = G.sproutX - cam.x;
  const y = standY(G.sproutX);
  const pulse = 0.5 + 0.5 * Math.sin(G.t * 2);
  ctx.globalAlpha = 0.1 + pulse * 0.12;
  fillEllipse(ctx, x, y - 3, 16, 9, '#fff8c8');
  ctx.globalAlpha = 1;
  // a scrape of bare earth with two small leaves in it
  fillEllipse(ctx, x, y, 9, 3.4, '#5c4530');
  fillEllipse(ctx, x, y - 0.6, 7, 2.4, '#6f5238');
  ctx.fillStyle = '#4f8a3a';
  for (let i = 0; i < 5; i++) ctx.fillRect(Math.round(x), Math.round(y - 2 - i), 1, 1);
  fillEllipse(ctx, x - 3, y - 6, 3.2, 1.8, '#3f7a34');
  fillEllipse(ctx, x + 3, y - 7, 3.4, 1.9, '#5aa347');
  glint(ctx, x, y - 8, G.t * 1.4, '#fff8d0', 1.2);
  if (R.chance(0.04)) fx.sparkle(x + R.f(-8, 8), y - R.f(0, 10), '#fff6c8');
}

function drawTheCan() {
  const bob = can.carried ? Math.sin(can.t * 6) * 0.8 : 0;
  const info = drawCan(ctx, can.x - cam.x, can.y + bob, {
    tilt: can.tilt, fill: can.fill, flip: can.flip, t: can.t,
    shadow: !can.carried, night: TIMES[G.tod].key === 'night',
  });
  can.spoutX = info.spout.x;
  can.spoutY = info.spout.y;
  if (can.streaming > 0) {
    ctx.fillStyle = rgba('#9fdcf0', 0.8);
    for (let i = 0; i < 6; i++) {
      ctx.fillRect(Math.round(info.spout.x + (can.flip ? 1 : -1) * i * 0.6),
                   Math.round(info.spout.y + i * 1.4), 1, 2);
    }
  }
  if (can.carried) {
    const gy = standY(can.x) + 8;
    ctx.globalAlpha = clamp(0.25 - (gy - can.y) / 400, 0.04, 0.25);
    fillEllipse(ctx, can.x - cam.x, gy, 12, 3, '#1b2a16');
    ctx.globalAlpha = 1;
  }
}

function drawWeather(P, T) {
  if (G.weather === 'rain') {
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = '#5a6a80';
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
  }
  if (G.weather === 'overcast') {
    ctx.globalAlpha = 0.09;
    ctx.fillStyle = '#6a7080';
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
  }
  if (G.lanterns) {
    // paper lanterns strung over the lookout on festival evenings
    const y0 = standY(PLACES.view.x) - 40;
    for (let i = -4; i <= 4; i++) {
      const x = PLACES.view.x + i * 16 - cam.x;
      const y = y0 + Math.abs(i) * 1.4 + Math.sin(G.t * 1.2 + i) * 1.2;
      ctx.globalAlpha = 0.3;
      fillEllipse(ctx, x, y, 5, 5, '#ffb45a');
      ctx.globalAlpha = 1;
      fillEllipse(ctx, x, y, 2.6, 3.2, '#ffd88a');
      fillEllipse(ctx, x, y - 1, 1.6, 1.6, '#fff2c0');
    }
  }
}

function drawHints() {
  if (G.phase !== 'play') return;
  if (G.idle > 6 && !can.carried) {
    glint(ctx, can.x - cam.x, can.y - 12, G.t * 1.1, '#fffbe0', 1);
    if (dog.alive) glint(ctx, dog.x - cam.x, dog.y - 18, G.t * 1.3, '#eaffb0', 0.9);
  }
  if (can.carried) {
    if (can.fill < 0.02) glint(ctx, PLACES.pond.x - cam.x, PLACES.pond.y - 2, G.t * 1.6, '#d8f6ff', 1.3);
    else {
      glint(ctx, PLACES.bed.x - cam.x, PLACES.bed.y - 10, G.t * 1.6, '#eaffb0');
      if (G.sapling > 0 && G.sapling < 1) glint(ctx, PLACES.grave.x - cam.x + 6, PLACES.grave.y - 24, G.t * 1.6, '#eaffb0');
    }
  }
}

function vignette(amount) {
  if (amount <= 0) return;
  const steps = 30;
  for (let i = 0; i < steps; i++) {
    ctx.globalAlpha = Math.pow(1 - i / steps, 2.4) * amount * 0.55;
    ctx.fillStyle = '#12101c';
    ctx.fillRect(0, i, W, 1);
    ctx.fillRect(0, H - 1 - i, W, 1);
    ctx.fillRect(i, 0, 1, H);
    ctx.fillRect(W - 1 - i, 0, 1, H);
  }
  ctx.globalAlpha = 1;
}

/* ------------------------------------------------------------- present it */

const viewT = { scale: 1, ox: 0, oy: 0, dpr: 1 };
function layout(vw, vh) {
  const fit = Math.min(vw / W, vh / H);
  const fillW = vw / W;
  let scale = fit;
  if (vh / vw > H / W) scale = Math.min(fillW * 1.14, fit * 2.1);
  else scale = Math.min(fillW, fit * 1.22);
  const dw = W * scale, dh = H * scale;
  viewT.scale = scale;
  viewT.ox = (vw - dw) / 2;
  viewT.oy = dh > vh ? vh - dh + (dh - vh) * 0.16 : (vh - dh) / 2;
  viewT.ox = dw >= vw ? clamp(viewT.ox, vw - dw, 0) : clamp(viewT.ox, 0, vw - dw);
  viewT.oy = dh >= vh ? clamp(viewT.oy, vh - dh, 0) : clamp(viewT.oy, 0, vh - dh);
}

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
  vctx.fillStyle = '#0b0d14';
  vctx.fillRect(0, 0, vw, vh);
  const k = viewT.scale;
  const top = Math.round(viewT.oy), bot = Math.round(viewT.oy + H * k);
  const T = TIMES[G.tod];
  const P = ERAS[G.era];
  if (top > 0) { vctx.fillStyle = T.sky[0][1]; vctx.fillRect(0, 0, vw, top + 1); }
  if (bot < vh) {
    vctx.fillStyle = P.grassDark;
    vctx.fillRect(0, bot - 1, vw, vh - bot + 1);
    vctx.drawImage(buf.canvas, 0, H - 7, W, 7, Math.round(viewT.ox), bot - Math.round(7 * k),
                   Math.round(W * k), vh - bot + Math.round(7 * k));
    const gap = vh - bot;
    for (let i = 0; i < 6; i++) {
      vctx.fillStyle = rgba('#12200e', 0.13);
      const band = Math.round(gap * (0.72 - i * 0.11));
      if (band > 0) vctx.fillRect(0, vh - band, vw, band);
    }
  }
  vctx.drawImage(buf.canvas, Math.round(viewT.ox), Math.round(viewT.oy), Math.round(W * k), Math.round(H * k));

  if (G.phase === 'ending') ending.drawOverlay(vctx, vw, vh, dpr);
}

/* ------------------------------------------------------------- game loop --*/

let last = performance.now();
function frame(now) {
  let dt = (now - last) / 1000;
  last = now;
  dt = Math.min(dt, 1 / 20) * (window.__game ? window.__game.speed : 1);
  update(dt);

  if (G.phase === 'opening') {
    // the hill is already there, waiting behind the flowers
    ctx.fillStyle = TIMES[1].sky[4][1];
    ctx.fillRect(0, 0, W, H);
    drawScene();
    ctx.globalAlpha = clamp(1 - opening.progress * 1.3, 0, 1) * 0.86;
    ctx.fillStyle = '#160e46';
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
    opening.draw(ctx);
    opening.drawHint(ctx);
  } else if (G.phase === 'act') {
    drawActScene();
  } else {
    drawScene();
    if (G.phase === 'ending' && ending.field) {
      if (ending.veil > 0) {
        ctx.globalAlpha = ending.veil;
        ctx.fillStyle = '#160e46';
        ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 1;
      }
      ending.field.draw(ctx, { alpha: 1 });
    }
  }
  if (G.fade > 0.004) {
    ctx.globalAlpha = clamp(G.fade, 0, 1);
    ctx.fillStyle = G.fadeCol;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
  }
  present();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

/* --------------------------------------------------------------- dev hooks */

import { SHOPS as __SHOPS } from './school.js';
window.__SHOPS = __SHOPS;
window.__game = {
  speed: 1,
  G, dog, people, cam, can, director, ending, opening, Music, CHAPTERS, critters, fx, PATCH, act,
  toScreen(bx, by) {
    const r = view.getBoundingClientRect();
    return {
      x: r.left + (viewT.ox + bx * viewT.scale) * (r.width / view.width),
      y: r.top + (viewT.oy + by * viewT.scale) * (r.height / view.height),
    };
  },
  skipOpening() {
    for (const it of opening.items) { it.gone = true; it.fade = 0; }
    opening.pushed = opening.total;
    if (!opening.cleared) { opening.cleared = true; onOpeningCleared(); }
    G.t = 99;
  },
  skipAct() {
    if (G.phase !== 'act') return;
    act.done = true;
    act.dlg.clear();
    if (act.dog) act.dog.alive = false;
    SFX.cicada(false);
    G.phase = 'reveal';
    G.t = 0;
    G.fade = 0;
    cam.snap(G.sproutX - 30);
  },
  chapter(n) {
    this.skipOpening();
    this.skipAct();
    G.phase = 'play';
    dog.alive = true;
    director.begin(clamp(n, 0, CHAPTERS.length - 1));
    G.fade = 0;
  },
  endNow() { this.chapter(CHAPTERS.length - 1); G.bloom = 1; G.sapling = 1; G.grave = 1; startEnding(); },
  setChapterTime(t) { director.t = t; },
};
