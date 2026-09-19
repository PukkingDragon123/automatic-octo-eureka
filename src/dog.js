/* ============================================================================
 *  dog.js — the pea dog, back to the shape he started as.
 *
 *  One bean, one leaf ear, a thick ink outline and a face.  No legs: he gets
 *  around by bouncing, squashing when he lands and stretching at the top of
 *  the hop, and the bounce goes out of him as he gets old.
 * ==========================================================================*/

import {
  clamp, lerp, shade, rgba, rng,
  spansNew, spansAddEllipse, spansAddEllipseRot, spansUnion, spansDilate,
  fillEllipse,
} from './core.js';

export const PEA = {
  body: '#b4d33c', bodyLo: '#98bb2e', bodyLo2: '#87a927',
  bodyHi: '#d2e56e', bodyHi2: '#e8f2a8',
  ear: '#8dba2c', earLo: '#7aa424',
  ink: '#191a14', halo: '#f2f8dc',
  eye: '#141410', shine: '#ffffff',
  muzzle: '#e4eec0', brow: '#d8e4ac',
};

/** How he changes over a life: size, spring, and how much grey. */
export const AGES = [
  { key: 'puppy',   w: 17, hop: 1.00, period: 0.40, grey: 0,    droop: 0.00, energy: 1.00, squish: 1.15 },
  { key: 'young',   w: 22, hop: 1.00, period: 0.44, grey: 0,    droop: 0.02, energy: 0.95, squish: 1.05 },
  { key: 'adult',   w: 27, hop: 0.82, period: 0.52, grey: 0.06, droop: 0.08, energy: 0.70, squish: 1.00 },
  { key: 'older',   w: 29, hop: 0.52, period: 0.66, grey: 0.38, droop: 0.24, energy: 0.42, squish: 0.94 },
  { key: 'elderly', w: 29, hop: 0.26, period: 0.86, grey: 0.78, droop: 0.46, energy: 0.18, squish: 0.88 },
];

/* The bean, the leaf, and the sliver of the far ear — turned by `rot`. */
function buildParts(w, h, droop, rot = 0) {
  const pcx = 0.5 * w, pcy = 0.5 * h;
  const cs = Math.cos(rot), sn = Math.sin(rot);
  const put = (spans, fx, fy, rx, ry) => {
    const dx = fx * w - pcx, dy = fy * h - pcy;
    spansAddEllipseRot(spans, pcx + dx * cs - dy * sn, pcy + dx * sn + dy * cs, rx, ry, rot);
  };
  const body = spansNew(h);
  put(body, 0.52, 0.50, 0.46 * w, 0.47 * h);
  put(body, 0.28, 0.56, 0.29 * w, 0.38 * h);
  put(body, 0.68, 0.44, 0.32 * w, 0.42 * h);
  put(body, 0.50, 0.62, 0.36 * w, 0.34 * h);

  const earR = spansNew(h);
  const erx = 0.135 * w, ery = 0.185 * h;
  const ecx = 0.80, ecy = 0.34 + droop * 0.16;
  put(earR, ecx, ecy, erx, ery);
  put(earR, ecx + (erx * 0.5) / w, ecy - (ery * (0.62 - droop)) / h, erx * 0.72, ery * 0.6);
  put(earR, ecx - (erx * 0.34) / w, ecy + (ery * (0.5 + droop)) / h, erx * 0.7, ery * 0.55);

  const earL = spansNew(h);
  put(earL, 0.022, 0.46 + droop * 0.1, 0.058 * w, 0.105 * h);

  return { body, earR, earL, all: spansUnion(spansUnion(body, earR), earL) };
}

function spansFill(ctx, spans, ox, oy, color, opt = {}) {
  const { shear = 0, alpha = 1, clipBottom = Infinity } = opt;
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  const h = spans.length;
  for (let y = 0; y < h; y++) {
    const s = spans[y];
    if (!s) continue;
    if (oy + y > clipBottom) break;
    ctx.fillRect(Math.round(ox + s[0] + shear * (h - y)), oy + y, s[1] - s[0] + 1, 1);
  }
  ctx.globalAlpha = 1;
}
function spansFillRows(ctx, spans, ox, oy, color, y0, y1, inset, opt = {}) {
  const { shear = 0, alpha = 1, clipBottom = Infinity } = opt;
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  const h = spans.length;
  for (let y = Math.max(0, y0 | 0); y <= Math.min(h - 1, y1 | 0); y++) {
    const s = spans[y];
    if (!s) continue;
    if (oy + y > clipBottom) break;
    const a = s[0] + inset, b = s[1] - inset;
    if (b < a) continue;
    ctx.fillRect(Math.round(ox + a + shear * (h - y)), oy + y, b - a + 1, 1);
  }
  ctx.globalAlpha = 1;
}

function greyed(c, g) {
  if (!g) return c;
  const to = [212, 220, 192];
  const from = [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
  return '#' + from.map((v, i) => Math.round(lerp(v, to[i], g * 0.5)).toString(16).padStart(2, '0')).join('');
}

/**
 * Draw him.
 *  x, y      — where he meets the ground
 *  o.age     — 0..4
 *  o.squash  — +squashed flat, -stretched tall
 *  o.z       — height above the ground while bouncing
 *  o.face    — 'idle' | 'happy' | 'sleep' | 'closed' | 'wow' | 'squint' | 'sad'
 */
export function drawDog(ctx, x, y, o = {}) {
  const A = AGES[clamp(o.age | 0, 0, 4)];
  const size = (o.size || A.w) * (o.scale || 1);
  const squash = clamp(o.squash || 0, -0.4, 0.5);
  const z = Math.max(0, o.z || 0);
  const flat = o.pose === 'sleep' || o.pose === 'lie' ? 0.26 : o.pose === 'sit' ? -0.06 : 0;
  const w = Math.round(size * (1 + (squash + flat) * 0.24));
  const h = Math.round(size * 0.76 * A.squish * (1 - (squash + flat) * 0.34));
  const alpha = o.alpha === undefined ? 1 : o.alpha;
  const grey = o.grey === undefined ? A.grey : o.grey;
  const droop = A.droop + (o.pose === 'sleep' ? 0.3 : 0);
  const rot = o.roll || 0;
  const parts = buildParts(w, h, droop, rot);
  const flip = o.flip ? -1 : 1;

  const ox = Math.round(x - w / 2 + (o.offX || 0));
  const oy = Math.round(y - h - z + (o.offY || 0));
  const lean = (o.lean || 0) * 0.3;
  const opt = { shear: lean, alpha };
  const outlineR = Math.max(2, Math.round(size / 26));

  const body = greyed(PEA.body, grey);
  const bodyLo = greyed(PEA.bodyLo, grey);
  const bodyLo2 = greyed(PEA.bodyLo2, grey);
  const bodyHi = greyed(PEA.bodyHi, grey);
  const earC = greyed(PEA.ear, grey);
  const earLo = greyed(PEA.earLo, grey);

  /* the shadow shrinks and sharpens as he rises */
  if (o.shadow !== false) {
    const k = clamp(1 - z / (size * 0.9), 0.35, 1);
    ctx.globalAlpha = 0.22 * alpha * k;
    fillEllipse(ctx, x, y + 1, w * 0.46 * k, Math.max(1.4, h * 0.11 * k), '#1b2a16');
    ctx.globalAlpha = 1;
  }

  /* halo, then the heavy ink outline */
  spansFill(ctx, spansDilate(parts.all, outlineR + 1), ox, oy, rgba(PEA.halo, 0.5 * alpha), { shear: lean });
  spansFill(ctx, spansDilate(parts.all, outlineR), ox, oy, PEA.ink, opt);

  /* body */
  spansFill(ctx, parts.body, ox, oy, body, opt);
  const upright = Math.abs(Math.sin(rot)) < 0.35;
  if (upright) {
    spansFillRows(ctx, parts.body, ox, oy, bodyLo, h * 0.68, h, 0, opt);
    spansFillRows(ctx, parts.body, ox, oy, bodyLo2, h * 0.86, h, 1, opt);
  }
  ctx.globalAlpha = alpha;
  for (let yy = upright ? Math.floor(h * 0.62) : h; yy < Math.floor(h * 0.7); yy++) {
    const s = parts.body[yy];
    if (!s) continue;
    for (let xx = s[0]; xx <= s[1]; xx++) {
      if (((xx * 3 + yy * 5) & 7) === 0) {
        ctx.fillStyle = bodyLo;
        ctx.fillRect(Math.round(ox + xx + lean * (h - yy)), oy + yy, 1, 1);
      }
    }
  }
  ctx.globalAlpha = 1;

  /* the glossy sheen down his top-left */
  if (upright) {
    const y0 = Math.floor(h * 0.12), y1 = Math.floor(h * 0.34);
    ctx.globalAlpha = alpha;
    for (let yy = y0; yy <= y1; yy++) {
      const s = parts.body[yy];
      if (!s) continue;
      const k = (yy - y0) / Math.max(1, y1 - y0);
      const a = s[0] + Math.round(lerp(w * 0.18, w * 0.1, k));
      const b = a + Math.round(lerp(w * 0.1, w * 0.22, k));
      ctx.fillStyle = bodyHi;
      ctx.fillRect(Math.round(ox + a + lean * (h - yy)), oy + yy, Math.max(1, b - a), 1);
    }
    ctx.fillStyle = rgba(PEA.bodyHi2, 0.9);
    ctx.fillRect(Math.round(ox + w * 0.22 + lean * h * 0.8), oy + Math.floor(h * 0.2),
                 Math.max(1, Math.round(w * 0.08)), 1);
    ctx.globalAlpha = 1;
  }

  /* the leaf ear, with its own outline, and the sliver of the far one */
  for (const [sp, col] of [[parts.earL, earLo], [parts.earR, earC]]) {
    spansFill(ctx, spansDilate(sp, Math.max(1, outlineR - 1)), ox, oy, PEA.ink, opt);
    spansFill(ctx, sp, ox, oy, col, opt);
    spansFillRows(ctx, sp, ox, oy, shade(col, -0.12), h * 0.3, h, 1, opt);
  }

  drawFace(ctx, ox, oy, w, h, lean, o, alpha, grey, flip, rot);
  return { w, h, ox, oy };
}

function drawFace(ctx, ox, oy, w, h, lean, o, alpha, grey, flip, rot = 0) {
  // every feature turns with him
  const pcx = 0.5 * w, pcy = 0.5 * h;
  const cs = Math.cos(rot), sn = Math.sin(rot);
  const RX = (fx, fy) => pcx + (fx - pcx) * cs - (fy - pcy) * sn;
  const RY = (fx, fy) => pcy + (fx - pcx) * sn + (fy - pcy) * cs;
  const face = o.face || 'idle';
  const look = o.look || [0, 0];
  const shx = (yy) => lean * (h - yy);
  ctx.globalAlpha = alpha;

  // an old dog goes pale around the muzzle
  if (grey > 0.25) {
    ctx.globalAlpha = alpha * clamp((grey - 0.2) * 1.5, 0, 1) * 0.7;
    fillEllipse(ctx, ox + w * 0.47 + shx(h * 0.6), oy + h * 0.6, w * 0.19, h * 0.15, PEA.muzzle);
    ctx.globalAlpha = alpha;
  }

  const eyeY = h * (face === 'sleep' ? 0.45 : 0.42) + look[1] * h * 0.03;
  const ex1 = w * 0.345 + look[0] * w * 0.035;
  const ex2 = w * 0.59 + look[0] * w * 0.035;
  const er = Math.max(1.2, w * 0.055);
  const ery = Math.max(1.4, w * 0.068);
  const closed = face === 'sleep' || face === 'closed' || face === 'happy' || face === 'squint';

  for (const cx of [ex1, ex2]) {
    const X = ox + cx + shx(eyeY), Y = oy + eyeY;
    if (closed) {
      const up = face === 'happy' || face === 'squint' ? -1 : 1;
      const rr = Math.max(1.6, er * 1.4);
      ctx.fillStyle = PEA.eye;
      for (let i = -rr; i <= rr; i++) {
        const k = i / rr;
        const dy = up * (1 - k * k) * rr * 0.6;
        ctx.fillRect(Math.round(X + i), Math.round(Y + (up > 0 ? -dy + rr * 0.3 : dy - rr * 0.1)),
                     1, Math.max(1, Math.round(er * 0.6)));
      }
    } else {
      const big = face === 'wow' ? 1.28 : 1;
      fillEllipse(ctx, X, Y, er * big, ery * big, PEA.eye);
      ctx.fillStyle = PEA.shine;
      ctx.fillRect(Math.round(X - er * 0.55), Math.round(Y - ery * 0.6),
                   Math.max(1, Math.round(er * 0.9)), Math.max(1, Math.round(er * 0.9)));
      // a second, smaller catchlight low on the other side
      if (er > 1.6) {
        ctx.globalAlpha = alpha * 0.75;
        ctx.fillRect(Math.round(X + er * 0.35), Math.round(Y + ery * 0.3), 1, 1);
        ctx.globalAlpha = alpha;
      }
      if (grey > 0.6) {
        ctx.globalAlpha = alpha * 0.28;
        fillEllipse(ctx, X, Y, er * 0.85, ery * 0.85, '#c8d0e0');
        ctx.globalAlpha = alpha;
      }
    }
    // heavy lids on an old dog
    if (grey > 0.5 && !closed) {
      ctx.fillStyle = PEA.brow;
      ctx.fillRect(Math.round(X - er * 1.3), Math.round(Y - ery * 1.5), Math.max(2, Math.round(er * 2.6)), 1);
    }
  }

  {
    ctx.globalAlpha = (face === 'happy' || o.blush ? 0.5 : 0.22) * alpha;
    fillEllipse(ctx, ox + w * 0.26 + shx(h * 0.56), oy + h * 0.56, w * 0.055, w * 0.035, '#ff9ab0');
    fillEllipse(ctx, ox + w * 0.68 + shx(h * 0.56), oy + h * 0.56, w * 0.055, w * 0.035, '#ff9ab0');
    ctx.globalAlpha = alpha;
  }

  /* nose and the soft "w" muzzle */
  const nx = ox + w * 0.468 + shx(h * 0.6);
  const ny = oy + h * 0.575 + look[1] * h * 0.02;
  const nw = Math.max(2, w * 0.062);
  const nh = Math.max(1.4, w * 0.044);
  fillEllipse(ctx, nx, ny, nw * 0.62, nh * 0.72, PEA.eye);
  ctx.fillStyle = PEA.eye;
  ctx.fillRect(Math.round(nx - nw * 0.2), Math.round(ny), Math.max(1, Math.round(nw * 0.4)),
               Math.max(1, Math.round(nh * 0.9)));
  const my = ny + nh * 0.9;
  const mw = Math.max(2, w * 0.055);
  if (face === 'happy' || face === 'wow' || o.mouthOpen > 0.3) {
    const op = clamp(o.mouthOpen === undefined ? 1 : o.mouthOpen, 0.3, 1);
    const mh = Math.max(2, w * 0.075 * op);
    fillEllipse(ctx, nx, my + mh * 0.4, mw * 0.95, mh, PEA.eye);
    fillEllipse(ctx, nx, my + mh * 0.75, mw * 0.5, mh * 0.42, '#e0607a');
  } else {
    for (const side of [-1, 1]) {
      for (let i = 0; i <= mw; i++) {
        const k = i / mw;
        ctx.fillRect(Math.round(nx + side * i), Math.round(my + Math.sin(k * Math.PI) * mw * 0.45), 1, 1);
      }
    }
  }
  ctx.globalAlpha = 1;
}

/* --------------------------------------------------------------- the brain */

const GRAV = 420;

export class Dog {
  constructor(x, y, seed = 4242) {
    this.x = x; this.y = y;
    this.r = rng(seed);
    this.age = 0;
    this.t = this.r.f(0, 10);
    this.face = 'idle';
    this.pose = 'idle';
    this.flip = false;
    this.vx = 0;
    this.z = 0; this.vz = 0;
    this.squash = 0;
    this.hopT = 0;
    this.target = null;
    this.state = 'idle';
    this.timer = 2;
    this.mood = 0;
    this.look = [0, 0];
    this.attention = null;
    this.alive = true;
    this.tiredness = 0;
    this.alpha = 1;
    this.lean = 0;
    this.roll = 0;          // how far over he has tumbled
    this.rollDir = 1;
    this.zooms = 0;
    this.spook = 0;         // something has upset him
  }
  get A() { return AGES[clamp(this.age, 0, 4)]; }

  callTo(wx, why = 'come') {
    this.target = wx;
    this.state = 'moving';
    this.why = why;
    this.timer = 14;
    this.mood = Math.max(this.mood, 0.7);
  }
  hold(pose, seconds = 30) { this.forcePose = pose; this.forceT = seconds; }
  react(kind) {
    this.mood = 1;
    if (kind === 'pet') {
      // a puppy that gets fussed over usually flops over and squirms
      if (this.A.energy > 0.5 && this.r.chance(0.5)) this.begin('wiggle', this.r.f(1.6, 2.6));
      else { this.state = 'petted'; this.timer = 2.2; }
      this.face = 'happy';
      this.bounce(0.7);
    }
    if (kind === 'play') this.begin(this.A.energy > 0.55 ? 'zoom' : 'wiggle', 4);
    if (kind === 'scare') {
      this.spook = 1;
      this.begin('back', 1.2);
      this.vx = (this.r.chance(0.5) ? -1 : 1) * 40;
      this.bounce(0.9);
    }
  }

  /** Shake the water out of himself. */
  shakeOff() { this.begin('shake', 1.1); }

  /** Start a bit of business and give it a length. */
  begin(state, seconds) {
    this.state = state;
    this.timer = seconds;
    if (state === 'roll') { this.rollDir = this.r.chance(0.5) ? -1 : 1; this.bounce(0.5); }
    if (state === 'zoom') { this.zooms = this.r.i(2, 4); this.target = null; }
    if (state === 'pounce') this.crouchT = 0.45;
  }
  /** Kick him off the ground. */
  bounce(power = 1) {
    if (this.z > 0.5) return;
    this.vz = lerp(30, 86, this.A.hop) * power;
    this.squash = -0.1;
  }

  update(dt) {
    this.t += dt;
    this.mood = Math.max(0, this.mood - dt * 0.12);
    const A = this.A;
    this.tiredness = clamp(
      this.tiredness + dt * (0.02 + (1 - A.energy) * 0.06) - (this.state === 'sleep' ? dt * 0.25 : 0), 0, 1);
    this.timer -= dt;
    this.spook = Math.max(0, this.spook - dt * 0.6);
    this.wet = Math.max(0, (this.wet || 0) - dt * 0.04);
    if (this.wet > 0.45 && this.z <= 0.01 && this.state !== 'shake' && this.r.chance(dt * 1.2)) this.shakeOff();

    /* --- playing ------------------------------------------------------- */
    if (this.state === 'roll') {
      this.roll += this.rollDir * dt * 7.2;
      this.vx = this.rollDir * 34;
      this.x += this.vx * dt;
      if (this.timer <= 0) { this.state = 'idle'; this.timer = this.r.f(1.5, 3); this.mood = 1; }
      this.face = 'happy';
    } else if (this.state === 'spin') {
      this.roll += dt * 9.5;
      this.vx = 0;
      if (this.timer <= 0) { this.state = 'idle'; this.timer = this.r.f(1.5, 3); }
      this.face = 'happy';
    } else if (this.state === 'zoom') {
      if (this.target === null || Math.abs(this.target - this.x) < 8) {
        if (this.zooms-- <= 0) { this.state = 'idle'; this.timer = this.r.f(2, 5); this.vx = 0; }
        else this.target = clamp(this.x + this.r.f(60, 130) * (this.r.chance(0.5) ? -1 : 1), 120, 1150);
      }
      if (this.state === 'zoom') {
        this.vx = Math.sign(this.target - this.x) * 62;
        this.x += this.vx * dt;
        this.face = 'happy';
      }
    } else if (this.state === 'pounce') {
      this.crouchT -= dt;
      if (this.crouchT > 0) { this.vx = 0; this.squash = 0.3; }
      else if (this.z <= 0.01 && !this.pounced) {
        this.pounced = true;
        this.vz = 118 * this.A.hop;
        this.vx = (this.flip ? -1 : 1) * 46;
      } else {
        this.x += this.vx * dt;
        this.vx = lerp(this.vx, 0, dt * 2.2);
      }
      if (this.timer <= 0) { this.state = 'idle'; this.pounced = false; this.timer = this.r.f(1, 3); }
      this.face = 'wow';
    } else if (this.state === 'wiggle') {
      this.vx = 0;
      this.roll = Math.sin(this.t * 13) * 0.5;
      if (this.timer <= 0) { this.state = 'idle'; this.timer = this.r.f(1, 3); }
      this.face = 'happy';
    } else if (this.state === 'shake') {
      // soaked: a whole-body shake, and the water goes everywhere
      this.vx = 0;
      this.roll = Math.sin(this.t * 26) * 0.34;
      this.shedding = true;
      if (this.timer <= 0) {
        this.state = 'idle'; this.timer = this.r.f(1, 2.5); this.shedding = false;
        this.wet = Math.max(0, (this.wet || 0) - 0.8);
        this.bounce(0.8);
      }
      this.face = 'happy';
    } else if (this.state === 'back') {
      this.x += this.vx * dt;
      this.vx = lerp(this.vx, 0, dt * 3);
      if (this.timer <= 0) { this.state = 'idle'; this.timer = this.r.f(1, 2); }
      this.face = 'wow';
    }
    const playing = ['roll', 'spin', 'zoom', 'pounce', 'wiggle', 'back', 'shake'].includes(this.state);
    if (!playing) {
      // settle upright again
      const up = Math.round(this.roll / (Math.PI * 2)) * Math.PI * 2;
      this.roll = lerp(this.roll, up, 1 - Math.pow(0.0006, dt));
      if (Math.abs(this.roll - up) < 0.02) this.roll = 0;
    }

    /* --- where he is going -------------------------------------------- */
    const resting = this.state === 'sleep' || this.state === 'rest' || this.state === 'sitting';
    if (playing) {
      if (this.z > 0 || this.vz > 0) {
        this.vz -= GRAV * dt;
        this.z += this.vz * dt;
        if (this.z <= 0) { this.z = 0; this.vz = 0; this.squash = 0.3; }
      } else if (this.state === 'zoom' && this.r.chance(dt * 6)) this.bounce(1.1);
      this.squash = lerp(this.squash, this.state === 'wiggle' ? 0.12 : 0, 1 - Math.pow(0.02, dt));
      this.lean = clamp(this.vx * 0.004, -0.2, 0.2);
      this.flip = this.vx < -2 ? true : this.vx > 2 ? false : this.flip;
      this.pose = 'idle';
      this.blink = (this.blink || 0) - dt;
      return;
    }
    if (this.state === 'moving' && this.target !== null) {
      const d = this.target - this.x;
      if (Math.abs(d) < 4) {
        this.state = this.why === 'eat' ? 'eating' : 'idle';
        this.timer = this.why === 'eat' ? 6 : this.r.f(2, 6);
        this.vx = 0;
      } else {
        this.vx = Math.sign(d) * lerp(16, 42, A.energy) * (Math.abs(d) > 70 ? 1.2 : 1);
      }
    } else if (this.state === 'wander' && this.target !== null) {
      const d = this.target - this.x;
      if (Math.abs(d) < 4) { this.state = 'idle'; this.timer = this.r.f(3, 9); this.vx = 0; }
      else this.vx = Math.sign(d) * lerp(12, 24, A.energy);
    } else if (this.timer <= 0) {
      this.pickIdle();
    } else {
      this.vx = lerp(this.vx, 0, dt * 8);
    }

    /* --- the bounce ---------------------------------------------------- */
    const moving = Math.abs(this.vx) > 3 && !resting;
    if (moving) {
      this.flip = this.vx < 0;
      this.hopT -= dt;
      if (this.z <= 0.01 && this.hopT <= 0) {
        this.hopT = A.period * this.r.f(0.9, 1.1);
        this.bounce(this.mood > 0.6 ? 1.15 : 1);
      }
      this.x += this.vx * dt;
    } else if (!resting && this.z <= 0.01 && this.r.chance(dt * (0.22 * A.energy + 0.03))) {
      this.bounce(this.r.f(0.4, 0.85));      // a little hop for no reason at all
    }

    if (this.z > 0 || this.vz > 0) {
      this.vz -= GRAV * dt;
      this.z += this.vz * dt;
      if (this.z <= 0) {
        const hit = Math.min(1, -this.vz / 90);
        this.z = 0; this.vz = 0;
        this.squash = 0.16 + hit * 0.3;
      } else {
        // stretched on the way up, rounded at the top, squashing as he falls
        this.squash = lerp(this.squash, clamp(-this.vz * 0.0022, -0.14, 0.05), 1 - Math.pow(0.02, dt));
      }
    } else {
      const rest = resting ? 0.06 : 0;
      this.squash = lerp(this.squash, rest + Math.sin(this.t * (this.state === 'sleep' ? 1.1 : 2.1)) * 0.02,
                         1 - Math.pow(0.0008, dt));
    }
    this.lean = clamp(this.vx * 0.004, -0.2, 0.2);

    /* --- posture and face ---------------------------------------------- */
    if (this.forcePose && this.forceT > 0) {
      this.forceT -= dt;
      this.pose = this.forcePose;
      if (this.forceT <= 0) this.forcePose = null;
    } else if (this.state === 'sleep') this.pose = 'sleep';
    else if (this.state === 'rest' || this.state === 'lie') this.pose = 'lie';
    else if (this.state === 'sitting') this.pose = 'sit';
    else this.pose = 'idle';

    if (this.attention) {
      const dx = clamp((this.attention.x - this.x) / 40, -1, 1);
      this.look = [this.flip ? -dx : dx, clamp(((this.attention.y || this.y) - (this.y - 10)) / 30, -1, 1)];
      if (!moving && this.state === 'idle') this.flip = this.attention.x < this.x;
    } else this.look = [0, 0];

    this.blink = (this.blink || 0) - dt;
    if (this.blink < -this.r.f(1.5, 5)) this.blink = 0.12;
    if (this.state === 'sleep') this.face = 'sleep';
    else if (this.mood > 0.55 || this.state === 'eating') this.face = 'happy';
    else this.face = this.blink > 0 ? 'closed' : 'idle';
  }

  pickIdle() {
    const A = this.A;
    const roll = this.r.f();
    const tired = this.tiredness > 0.55 || A.energy < 0.3;
    if (tired && roll < 0.55) { this.state = 'sleep'; this.timer = this.r.f(14, 40); return; }
    // the younger he is, the more of this he gets up to
    if (roll < 0.3 * A.energy) {
      const play = this.r.f();
      if (play < 0.3) this.begin('roll', this.r.f(0.9, 1.8));
      else if (play < 0.46) this.begin('spin', this.r.f(0.7, 1.2));
      else if (play < 0.7) this.begin('zoom', 9);
      else if (play < 0.86) this.begin('pounce', 2.2);
      else this.begin('wiggle', this.r.f(1.2, 2.2));
      return;
    }
    if (roll < 0.2 * A.energy + 0.05) {
      this.state = 'wander';
      this.target = clamp(this.x + this.r.f(-120, 120) * A.energy, 120, 1150);
      this.timer = 16;
    } else if (roll < 0.42) { this.state = 'sitting'; this.timer = this.r.f(4, 12); }
    else if (roll < 0.62) { this.state = 'rest'; this.timer = this.r.f(6, 20); }
    else { this.state = 'idle'; this.timer = this.r.f(3, 8); }
  }

  draw(ctx, cam, o = {}) {
    return drawDog(ctx, this.x - cam, this.y, {
      age: this.age, pose: this.pose, face: this.face, flip: this.flip,
      t: this.t, look: this.look, squash: this.squash, z: this.z, roll: this.roll,
      lean: this.lean, blush: this.mood > 0.7, alpha: this.alpha, ...o,
    });
  }
}
