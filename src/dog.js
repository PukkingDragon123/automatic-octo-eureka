/* ============================================================================
 *  dog.js — a very small green dog.
 *
 *  He is drawn from span-sets so his ink outline stays on the pixel grid at
 *  any size, and posed from a little table of joint offsets so he can stand,
 *  trot, sit, flop, dig, eat and — eventually — lie down and not get up.
 * ==========================================================================*/

import {
  clamp, lerp, shade, rgba, rng,
  spansNew, spansAddEllipse, spansUnion, spansDilate,
  fillEllipse,
} from './core.js';

export const PEA = {
  body: '#b4d33c', bodyLo: '#98bb2e', bodyLo2: '#87a927',
  bodyHi: '#d2e56e', bodyHi2: '#e8f2a8',
  ear: '#8dba2c', earLo: '#7aa424',
  ink: '#191a14', halo: '#f2f8dc',
  eye: '#141410', shine: '#ffffff',
  muzzleOld: '#e4eec0', browOld: '#dce8b4',
};

/** How he changes over a life. Index 0..4. */
export const AGES = [
  { key: 'puppy',   w: 15, head: 0.72, leg: 0.30, energy: 1.00, wag: 1.3, grey: 0,    stoop: 0.00 },
  { key: 'young',   w: 18, head: 0.64, leg: 0.36, energy: 0.95, wag: 1.2, grey: 0,    stoop: 0.00 },
  { key: 'adult',   w: 22, head: 0.58, leg: 0.38, energy: 0.72, wag: 1.0, grey: 0.05, stoop: 0.02 },
  { key: 'older',   w: 23, head: 0.57, leg: 0.36, energy: 0.44, wag: 0.8, grey: 0.35, stoop: 0.08 },
  { key: 'elderly', w: 23, head: 0.57, leg: 0.33, energy: 0.20, wag: 0.5, grey: 0.75, stoop: 0.16 },
];

/* Poses: every value is a fraction of the body width. */
const POSES = {
  stand:  { bodyY: -0.34, tilt: 0,     headX: 0.42,  headY: -0.52, headTilt: 0,    legs: [0, 0, 0, 0], tail: -0.5, ear: 0 },
  walk:   { bodyY: -0.34, tilt: 0,     headX: 0.42,  headY: -0.52, headTilt: 0,    legs: 'gait',       tail: -0.6, ear: 0 },
  run:    { bodyY: -0.38, tilt: -0.06, headX: 0.48,  headY: -0.58, headTilt: -0.1, legs: 'bound',      tail: -0.9, ear: -0.2 },
  sit:    { bodyY: -0.26, tilt: -0.16, headX: 0.40,  headY: -0.62, headTilt: -0.05, legs: 'sit',       tail: -0.2, ear: 0 },
  lie:    { bodyY: -0.16, tilt: 0,     headX: 0.44,  headY: -0.30, headTilt: 0.04, legs: 'tuck',       tail: -0.1, ear: 0.1 },
  sleep:  { bodyY: -0.14, tilt: 0,     headX: 0.38,  headY: -0.24, headTilt: 0.12, legs: 'tuck',       tail: 0.0,  ear: 0.25 },
  eat:    { bodyY: -0.32, tilt: 0.04,  headX: 0.46,  headY: -0.26, headTilt: 0.3,  legs: [0, 0, 0, 0], tail: -0.7, ear: 0.1 },
  sniff:  { bodyY: -0.32, tilt: 0.03,  headX: 0.46,  headY: -0.32, headTilt: 0.26, legs: [0, 0, 0, 0], tail: -0.5, ear: 0.05 },
  lookup: { bodyY: -0.34, tilt: 0,     headX: 0.40,  headY: -0.62, headTilt: -0.3, legs: [0, 0, 0, 0], tail: -0.7, ear: -0.1 },
  bow:    { bodyY: -0.24, tilt: 0.2,   headX: 0.48,  headY: -0.24, headTilt: 0.16, legs: 'bow',        tail: -1.0, ear: -0.1 },
  dig:    { bodyY: -0.28, tilt: 0.12,  headX: 0.46,  headY: -0.34, headTilt: 0.3,  legs: 'dig',        tail: -0.8, ear: 0.05 },
  shake:  { bodyY: -0.34, tilt: 0,     headX: 0.42,  headY: -0.52, headTilt: 0,    legs: [0, 0, 0, 0], tail: -0.6, ear: -0.3 },
};

function legOffsets(kind, ph, o) {
  // [frontNear, frontFar, backNear, backFar] as [dx, dy] in body-width units
  switch (kind) {
    case 'gait': {
      const a = Math.sin(ph), b = Math.sin(ph + Math.PI * 0.5);
      const c = Math.sin(ph + Math.PI), d = Math.sin(ph + Math.PI * 1.5);
      return [[a * 0.08, -Math.max(0, a) * 0.06], [b * 0.07, -Math.max(0, b) * 0.05],
              [c * 0.08, -Math.max(0, c) * 0.06], [d * 0.07, -Math.max(0, d) * 0.05]];
    }
    case 'bound': {
      const a = Math.sin(ph);
      return [[a * 0.2, -Math.abs(a) * 0.1], [a * 0.16, -Math.abs(a) * 0.08],
              [-a * 0.2, -Math.abs(a) * 0.1], [-a * 0.16, -Math.abs(a) * 0.08]];
    }
    case 'sit':  return [[0.02, 0], [0.0, 0], [-0.14, 0.1], [-0.16, 0.1]];
    case 'tuck': return [[0.06, 0.16], [0.02, 0.16], [-0.1, 0.16], [-0.14, 0.16]];
    case 'bow':  return [[0.1, 0.12], [0.06, 0.12], [-0.1, -0.04], [-0.13, -0.04]];
    case 'dig': {
      const a = Math.sin(ph * 3.2);
      return [[0.08 + a * 0.1, -Math.max(0, a) * 0.12], [0.05 + a * 0.08, -Math.max(0, a) * 0.1],
              [-0.1, 0.02], [-0.13, 0.02]];
    }
    default: return [[0, 0], [0, 0], [0, 0], [0, 0]];
  }
}

/**
 * Draw the dog.
 *  x, y   — where his paws meet the ground
 *  o.age  — 0..4
 *  o.pose — a key of POSES
 *  o.flip — true to face left
 */
export function drawDog(ctx, x, y, o = {}) {
  const A = AGES[clamp(o.age | 0, 0, 4)];
  const S = (o.size || A.w) * (o.scale || 1);
  const pose = POSES[o.pose] || POSES.stand;
  const f = o.flip ? -1 : 1;
  const t = o.t || 0;
  const alpha = o.alpha === undefined ? 1 : o.alpha;
  const grey = o.greyOverride === undefined ? A.grey : o.greyOverride;
  const breathe = Math.sin(t * (o.pose === 'sleep' ? 1.1 : 2.2)) * S * 0.012;
  const stoop = A.stoop * S;

  const bw = S, bh = S * 0.56;
  const legLen = S * A.leg * (1 - A.stoop * 0.6);
  // the belly sits one leg-length off the ground; poses lower it from there
  const stand = y - legLen - bh * 0.5;
  const drop = { stand: 0, walk: 0, run: -S * 0.04, sit: legLen * 0.55, lie: legLen * 0.92,
                 sleep: legLen * 1.0, eat: 0, sniff: 0, lookup: 0, bow: legLen * 0.3,
                 dig: legLen * 0.2, shake: 0 }[o.pose] || 0;
  const bodyY = stand + drop + stoop + breathe + (o.offY || 0);
  const bodyX = x + (o.offX || 0);
  const tilt = (pose.tilt + (o.tilt || 0)) * f;

  const body = mixGrey(PEA.body, grey);
  const bodyLo = mixGrey(PEA.bodyLo, grey);
  const bodyHi = mixGrey(PEA.bodyHi, grey);
  const earC = mixGrey(PEA.ear, grey);

  /* shadow */
  if (o.shadow !== false) {
    ctx.globalAlpha = 0.2 * alpha;
    fillEllipse(ctx, x, y + 0.5, bw * 0.55, Math.max(1.2, S * 0.09), '#1b2a16');
    ctx.globalAlpha = 1;
  }

  /* legs go in first, behind everything */
  const legs = Array.isArray(pose.legs) ? [[0, 0], [0, 0], [0, 0], [0, 0]] : legOffsets(pose.legs, t * 9 * (o.legSpeed || 1), o);
  const legXs = [0.3, 0.2, -0.24, -0.34];
  for (let i = 0; i < 4; i++) {
    const far = i === 1 || i === 3;
    const lx = bodyX + f * (legXs[i] + legs[i][0]) * bw;
    const ly = bodyY + bh * 0.34;
    const foot = y + legs[i][1] * S;
    if (foot < ly + 0.8) continue;
    const c = far ? shade(bodyLo, -0.14) : bodyLo;
    const wdt = Math.max(1.6, S * 0.1);
    ctx.globalAlpha = alpha;
    fillEllipse(ctx, lx, (ly + foot) / 2, wdt * 0.5 + 1, (foot - ly) / 2 + 1, PEA.ink);
    fillEllipse(ctx, lx, (ly + foot) / 2, wdt * 0.5, (foot - ly) / 2, c);
    fillEllipse(ctx, lx, foot - 0.5, wdt * 0.62 + 0.8, wdt * 0.42 + 0.8, PEA.ink);
    fillEllipse(ctx, lx, foot - 0.8, wdt * 0.62, wdt * 0.42, far ? shade(earC, -0.1) : earC);
    ctx.globalAlpha = 1;
  }

  /* tail */
  {
    const tw = Math.sin(t * 10 * (o.wag === undefined ? A.wag : o.wag)) * (o.wag === 0 ? 0 : 1);
    const tx = bodyX - f * bw * 0.46;
    const ty = bodyY - bh * 0.12 + pose.tail * S * 0.1;
    const len = S * 0.26;
    ctx.globalAlpha = alpha;
    for (let i = 0; i <= 6; i++) {
      const k = i / 6;
      const a = (pose.tail * 1.1 + tw * 0.5) - k * 0.5;
      const px_ = tx - f * Math.cos(a) * len * k;
      const py_ = ty + Math.sin(a) * len * k * -1;
      const rr = lerp(S * 0.075, S * 0.045, k);
      fillEllipse(ctx, px_, py_, rr + 1, rr + 1, PEA.ink);
    }
    for (let i = 0; i <= 6; i++) {
      const k = i / 6;
      const a = (pose.tail * 1.1 + tw * 0.5) - k * 0.5;
      const px_ = tx - f * Math.cos(a) * len * k;
      const py_ = ty + Math.sin(a) * len * k * -1;
      const rr = lerp(S * 0.075, S * 0.045, k);
      fillEllipse(ctx, px_, py_, rr, rr, k > 0.6 ? bodyHi : body);
    }
    ctx.globalAlpha = 1;
  }

  /* body and head as one inked silhouette */
  const hw = bw * A.head;
  const hh = hw * 0.92;
  const hx = bodyX + f * (pose.headX + 0.16) * bw + (o.headX || 0);
  const hy = bodyY + pose.headY * S * 0.62 - bh * 0.1 + (o.headY || 0) + Math.sin(t * 1.6) * S * 0.006;
  const htilt = pose.headTilt + (o.headTilt || 0);

  const H0 = Math.ceil(bh * 3 + hh * 2.6 + 12);
  const originX = Math.round(bodyX - bw * 1.2);
  const originY = Math.round(Math.min(bodyY - bh * 1.4, hy - hh * 1.8) - 3);
  const L = (wx) => wx - originX;
  const T = (wy) => wy - originY;

  const bodySp = spansNew(H0);
  spansAddEllipse(bodySp, L(bodyX), T(bodyY + tilt * bw * 0.3), bw * 0.46, bh * 0.5);
  spansAddEllipse(bodySp, L(bodyX + f * bw * 0.2), T(bodyY - bh * 0.1 + tilt * bw * 0.5), bw * 0.3, bh * 0.42);
  spansAddEllipse(bodySp, L(bodyX - f * bw * 0.24), T(bodyY + bh * 0.02), bw * 0.28, bh * 0.44);

  const headSp = spansNew(H0);
  spansAddEllipse(headSp, L(hx), T(hy), hw * 0.5, hh * 0.5);
  spansAddEllipse(headSp, L(hx + f * hw * 0.22), T(hy + hh * 0.16 + htilt * hh * 0.4), hw * 0.34, hh * 0.32);

  const earSp = spansNew(H0);
  const earDroop = pose.ear + (o.ear || 0) + A.stoop * 1.2;
  spansAddEllipse(earSp, L(hx - f * hw * 0.3), T(hy - hh * 0.3 + earDroop * hh * 0.5), hw * 0.2, hh * 0.28);
  spansAddEllipse(earSp, L(hx - f * hw * 0.36), T(hy - hh * 0.12 + earDroop * hh * 0.7), hw * 0.17, hh * 0.22);

  const all = spansUnion(spansUnion(bodySp, headSp), earSp);
  const outlineR = Math.max(1, Math.round(S / 17));
  ctx.globalAlpha = alpha;
  spansPaint(ctx, spansDilate(all, outlineR + 1), originX, originY, rgba(PEA.halo, 0.4));
  spansPaint(ctx, spansDilate(all, outlineR), originX, originY, PEA.ink);
  spansPaint(ctx, bodySp, originX, originY, body);
  spansPaintRows(ctx, bodySp, originX, originY, bodyLo, T(bodyY + bh * 0.1), H0);
  spansPaintRows(ctx, bodySp, originX, originY, bodyHi, T(bodyY - bh * 0.5), T(bodyY - bh * 0.28));
  spansPaint(ctx, headSp, originX, originY, body);
  spansPaintRows(ctx, headSp, originX, originY, bodyHi, T(hy - hh * 0.5), T(hy - hh * 0.2));
  spansPaintRows(ctx, headSp, originX, originY, bodyLo, T(hy + hh * 0.18), H0);
  spansPaint(ctx, spansDilate(earSp, 1), originX, originY, PEA.ink);
  spansPaint(ctx, earSp, originX, originY, earC);
  ctx.globalAlpha = 1;

  /* face */
  drawFace(ctx, hx, hy, hw, hh, f, htilt, o, A, grey, alpha);

  return { headX: hx, headY: hy, bodyY, w: bw, h: bh };
}

function mixGrey(c, g) {
  if (!g) return c;
  const to = '#d4dcc0';
  const [r1, g1, b1] = [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
  const [r2, g2, b2] = [parseInt(to.slice(1, 3), 16), parseInt(to.slice(3, 5), 16), parseInt(to.slice(5, 7), 16)];
  const m = (a, b) => Math.round(lerp(a, b, g * 0.5));
  return '#' + [m(r1, r2), m(g1, g2), m(b1, b2)].map((v) => v.toString(16).padStart(2, '0')).join('');
}

function spansPaint(ctx, spans, ox, oy, color) {
  ctx.fillStyle = color;
  for (let y = 0; y < spans.length; y++) {
    const s = spans[y];
    if (!s) continue;
    ctx.fillRect(ox + s[0], oy + y, s[1] - s[0] + 1, 1);
  }
}
function spansPaintRows(ctx, spans, ox, oy, color, y0, y1) {
  ctx.fillStyle = color;
  for (let y = Math.max(0, Math.round(y0)); y <= Math.min(spans.length - 1, Math.round(y1)); y++) {
    const s = spans[y];
    if (!s) continue;
    ctx.fillRect(ox + s[0], oy + y, s[1] - s[0] + 1, 1);
  }
}

function drawFace(ctx, hx, hy, hw, hh, f, htilt, o, A, grey, alpha) {
  const face = o.face || 'idle';
  const look = o.look || [0, 0];
  ctx.globalAlpha = alpha;

  // an old dog goes pale around the muzzle and brows
  if (grey > 0.25) {
    ctx.globalAlpha = alpha * clamp((grey - 0.2) * 1.4, 0, 1) * 0.75;
    fillEllipse(ctx, hx + f * hw * 0.26, hy + hh * 0.2 + htilt * hh * 0.4, hw * 0.28, hh * 0.22, PEA.muzzleOld);
    ctx.globalAlpha = alpha;
  }

  const eyeY = hy - hh * 0.04 + htilt * hh * 0.3 + look[1] * hh * 0.05;
  const ex1 = hx + f * hw * 0.04 + look[0] * hw * 0.05;
  const ex2 = hx + f * hw * 0.3 + look[0] * hw * 0.05;
  const er = Math.max(0.9, hw * 0.1);

  const closed = face === 'sleep' || face === 'closed' || face === 'happy' || face === 'squint';
  for (const cx of [ex1, ex2]) {
    if (closed) {
      const up = face === 'happy' || face === 'squint' ? -1 : 1;
      ctx.fillStyle = PEA.eye;
      const rr = Math.max(1.2, er * 1.4);
      for (let i = -rr; i <= rr; i++) {
        const tt = i / rr;
        const dy = up * (1 - tt * tt) * rr * 0.55;
        ctx.fillRect(Math.round(cx + i), Math.round(eyeY + (up > 0 ? -dy + rr * 0.3 : dy)), 1, 1);
      }
    } else {
      const big = face === 'wow' ? 1.3 : 1;
      fillEllipse(ctx, cx, eyeY, er * big, er * 1.22 * big, PEA.eye);
      ctx.fillStyle = PEA.shine;
      ctx.fillRect(Math.round(cx - er * 0.45), Math.round(eyeY - er * 0.6), Math.max(1, Math.round(er * 0.7)), Math.max(1, Math.round(er * 0.7)));
      if (grey > 0.6) {
        ctx.fillStyle = rgba('#c8d0e0', 0.35);
        fillEllipse(ctx, cx, eyeY, er * 0.8, er * 0.9, rgba('#c8d0e0', 0.3));
      }
    }
  }
  // brows, which is most of what makes him readable
  if (grey > 0.3 || face === 'sad' || face === 'wow') {
    ctx.fillStyle = grey > 0.3 ? PEA.browOld : PEA.eye;
    const bw2 = Math.max(2, hw * 0.2);
    const tilt = face === 'sad' ? 1 : 0;
    ctx.fillRect(Math.round(ex1 - bw2 * 0.5), Math.round(eyeY - er * 2.2 + tilt), Math.round(bw2), 1);
    ctx.fillRect(Math.round(ex2 - bw2 * 0.5), Math.round(eyeY - er * 2.2 - tilt), Math.round(bw2), 1);
  }

  const nx = hx + f * hw * 0.44;
  const ny = hy + hh * 0.18 + htilt * hh * 0.45;
  fillEllipse(ctx, nx, ny, Math.max(1, hw * 0.1), Math.max(0.9, hw * 0.075), PEA.eye);
  const my = ny + hh * 0.12;
  if (face === 'happy' || face === 'pant' || o.mouthOpen > 0.3) {
    const op = clamp(o.mouthOpen === undefined ? 1 : o.mouthOpen, 0.3, 1);
    fillEllipse(ctx, nx - f * hw * 0.04, my, hw * 0.13, hh * 0.1 * op, PEA.eye);
    fillEllipse(ctx, nx - f * hw * 0.04, my + hh * 0.03, hw * 0.08, hh * 0.05 * op, '#e0607a');
  } else if (!closed || face === 'sleep') {
    ctx.fillStyle = PEA.eye;
    for (const side of [-1, 1]) {
      for (let i = 0; i <= Math.max(1, hw * 0.1); i++) {
        ctx.fillRect(Math.round(nx - f * hw * 0.04 + side * i), Math.round(my + Math.sin((i / (hw * 0.1)) * Math.PI) * hw * 0.06), 1, 1);
      }
    }
  }
  if (o.blush) {
    ctx.globalAlpha = 0.45 * alpha;
    fillEllipse(ctx, hx + f * hw * 0.34, hy + hh * 0.06, hw * 0.1, hh * 0.06, '#ff9ab0');
    ctx.globalAlpha = alpha;
  }
  ctx.globalAlpha = 1;
}

/* ------------------------------------------------------------- the brain --*/

export class Dog {
  constructor(x, y, seed = 4242) {
    this.x = x; this.y = y;
    this.r = rng(seed);
    this.age = 0;
    this.t = this.r.f(0, 10);
    this.pose = 'sit';
    this.face = 'idle';
    this.flip = false;
    this.vx = 0;
    this.target = null;
    this.state = 'idle';
    this.timer = 2;
    this.mood = 0;
    this.look = [0, 0];
    this.attention = null;    // a world point he is watching
    this.alive = true;
    this.restX = x;
    this.legSpeed = 1;
    this.tiredness = 0;
    this.napSpot = x;
  }

  get A() { return AGES[clamp(this.age, 0, 4)]; }

  /** Ask him to come to a place; he may take his time about it. */
  callTo(wx, why = 'come') {
    this.target = wx;
    this.state = 'moving';
    this.why = why;
    this.timer = 12;
    this.mood = Math.max(this.mood, 0.7);
  }
  hold(pose, seconds = 30) { this.forcePose = pose; this.forceT = seconds; }
  react(kind) {
    this.mood = 1;
    if (kind === 'pet') { this.state = 'petted'; this.timer = 2.2; this.pose = 'sit'; this.face = 'happy'; }
    if (kind === 'play') { this.state = 'play'; this.timer = 4; }
    if (kind === 'call') { this.face = 'wow'; }
  }

  update(dt, ctxInfo = {}) {
    this.t += dt;
    this.mood = Math.max(0, this.mood - dt * 0.12);
    const A = this.A;
    const energy = A.energy;
    this.tiredness = clamp(this.tiredness + dt * (0.02 + (1 - energy) * 0.06) - (this.state === 'sleep' ? dt * 0.25 : 0), 0, 1);

    this.timer -= dt;
    if (this.state === 'moving' && this.target !== null) {
      const d = this.target - this.x;
      const speed = lerp(14, 34, energy) * (Math.abs(d) > 60 ? 1.25 : 1);
      if (Math.abs(d) < 3) {
        this.state = this.why === 'eat' ? 'eating' : 'idle';
        this.timer = this.why === 'eat' ? 6 : this.r.f(2, 6);
        this.vx = 0;
      } else {
        this.vx = Math.sign(d) * speed;
        this.x += this.vx * dt;
        this.flip = this.vx < 0;
      }
    } else if (this.timer <= 0) {
      this.pickIdle();
    } else if (this.state === 'wander') {
      const d = this.target - this.x;
      if (Math.abs(d) < 3) { this.state = 'idle'; this.timer = this.r.f(3, 9); this.vx = 0; }
      else { this.vx = Math.sign(d) * lerp(10, 20, energy); this.x += this.vx * dt; this.flip = this.vx < 0; }
    } else {
      this.vx = lerp(this.vx, 0, dt * 6);
    }

    // posture follows state, unless a scene has asked him to hold one
    const moving = Math.abs(this.vx) > 2;
    if (this.forcePose && this.forceT > 0) {
      this.forceT -= dt;
      this.pose = this.forcePose;
      if (this.forceT <= 0) this.forcePose = null;
    } else if (this.state === 'sleep') this.pose = 'sleep';
    else if (this.state === 'rest') this.pose = 'lie';
    else if (this.state === 'lie') this.pose = 'lie';
    else if (this.state === 'eating') this.pose = 'eat';
    else if (this.state === 'digging') this.pose = 'dig';
    else if (this.state === 'petted') this.pose = 'sit';
    else if (this.state === 'play') this.pose = this.t % 1.2 < 0.6 ? 'bow' : 'run';
    else if (this.state === 'sniff') this.pose = 'sniff';
    else if (moving) this.pose = Math.abs(this.vx) > 26 ? 'run' : 'walk';
    else if (this.state === 'sitting') this.pose = 'sit';
    else this.pose = 'stand';

    this.legSpeed = clamp(Math.abs(this.vx) / 18, 0.6, 2.2);

    // what he is looking at
    if (this.attention) {
      const dx = clamp((this.attention.x - this.x) / 40, -1, 1);
      this.look = [this.flip ? -dx : dx, clamp(((this.attention.y || this.y) - (this.y - 10)) / 30, -1, 1)];
      if (!moving && this.state === 'idle' && this.attention.x !== undefined) {
        this.flip = this.attention.x < this.x;
      }
    } else this.look = [0, 0];

    if (this.state === 'sleep') this.face = 'sleep';
    else if (this.mood > 0.55) this.face = 'happy';
    else if (this.state === 'eating') this.face = 'happy';
    else this.face = this.blink > 0 ? 'closed' : 'idle';
    this.blink = (this.blink || 0) - dt;
    if (this.blink < -this.r.f(1.5, 5)) this.blink = 0.12;
  }

  pickIdle() {
    const A = this.A;
    const roll = this.r.f();
    const tired = this.tiredness > 0.55 || A.energy < 0.3;
    if (tired && roll < 0.55) { this.state = 'sleep'; this.timer = this.r.f(14, 40); return; }
    if (roll < 0.18 * A.energy + 0.05) {
      this.state = 'wander';
      this.target = clamp(this.x + this.r.f(-110, 110) * A.energy, 120, 1150);
      this.timer = 14;
    } else if (roll < 0.4) { this.state = 'sitting'; this.timer = this.r.f(4, 12); }
    else if (roll < 0.55) { this.state = 'sniff'; this.timer = this.r.f(2, 5); }
    else if (roll < 0.66 && A.energy > 0.5) { this.state = 'digging'; this.timer = this.r.f(2, 4); }
    else if (roll < 0.82) { this.state = 'rest'; this.timer = this.r.f(6, 20); }
    else { this.state = 'idle'; this.timer = this.r.f(3, 8); }
  }

  draw(ctx, cam, o = {}) {
    return drawDog(ctx, this.x - cam, this.y, {
      age: this.age, pose: this.pose, face: this.face, flip: this.flip,
      t: this.t, look: this.look, legSpeed: this.legSpeed,
      wag: this.mood > 0.4 ? this.A.wag * 1.6 : this.A.wag * (this.state === 'sleep' ? 0 : 0.5),
      blush: this.mood > 0.7,
      ...o,
    });
  }
}
