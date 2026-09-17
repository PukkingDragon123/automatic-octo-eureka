/* ============================================================================
 *  dog.js — the pea dog.
 *
 *  Drawn from scratch every frame out of span-sets so the thick black outline,
 *  the leaf ears and the round sticker face stay exactly on the pixel grid at
 *  any size.  Shearing (never rotation) is used for lean and squash so no
 *  anti-aliasing ever creeps in.
 * ==========================================================================*/

import {
  clamp, lerp, shade, rgba, rng,
  spansNew, spansAddEllipse, spansUnion, spansDilate,
  px, fillEllipse,
} from './core.js';

/* Palette lifted from the reference sticker */
export const PEA = {
  body: '#b4d33c',
  bodyLo: '#98bb2e',
  bodyLo2: '#87a927',
  bodyHi: '#d2e56e',
  bodyHi2: '#e8f2a8',
  ear: '#8dba2c',
  earLo: '#7aa424',
  ink: '#191a14',
  inkSoft: '#2b2d22',
  halo: '#f2f8dc',
  eye: '#141410',
  shine: '#ffffff',
  sprout: '#6fae3a',
  sproutHi: '#93ca55',
  flower: '#5b4bc4',
  flowerHi: '#8f7ce8',
  flowerCore: '#f2e58c',
};

/** Local-space silhouette pieces for a pea dog of width w. */
function buildParts(w, h, o) {
  const body = spansNew(h);
  spansAddEllipse(body, 0.53 * w, 0.52 * h, 0.45 * w, 0.44 * h);
  spansAddEllipse(body, 0.27 * w, 0.58 * h, 0.27 * w, 0.34 * h);
  spansAddEllipse(body, 0.66 * w, 0.42 * h, 0.33 * w, 0.37 * h);
  spansAddEllipse(body, 0.50 * w, 0.64 * h, 0.35 * w, 0.31 * h);

  // right ear: a plump leaf tucked on the top-right of the head
  const earR = spansNew(h);
  const eScale = o.earPerk || 0;
  const erx = 0.125 * w, ery = 0.165 * h;
  const ecx = 0.80 * w, ecy = lerp(0.36, 0.28, eScale) * h;
  spansAddEllipse(earR, ecx, ecy, erx, ery);
  spansAddEllipse(earR, ecx + erx * 0.5, ecy - ery * 0.62, erx * 0.72, ery * 0.6);
  spansAddEllipse(earR, ecx - erx * 0.34, ecy + ery * 0.5, erx * 0.7, ery * 0.55);

  // left ear: only a sliver shows past the cheek
  const earL = spansNew(h);
  spansAddEllipse(earL, 0.022 * w, lerp(0.46, 0.4, eScale) * h, 0.058 * w, 0.105 * h);

  const all = spansUnion(spansUnion(body, earR), earL);
  return { body, earR, earL, all, ear: { ecx, ecy, erx, ery } };
}

function shearFill(ctx, spans, ox, oy, color, opt) {
  const { shear = 0, pivot = 1, clipBottom = Infinity, alpha = 1 } = opt || {};
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  const h = spans.length;
  for (let y = 0; y < h; y++) {
    const s = spans[y];
    if (!s) continue;
    if (oy + y > clipBottom) break;
    const sx = shear * (pivot * h - y);
    ctx.fillRect(Math.round(ox + s[0] + sx), oy + y, s[1] - s[0] + 1, 1);
  }
  ctx.globalAlpha = 1;
}

function shearFillRows(ctx, spans, ox, oy, color, y0, y1, inset, opt) {
  const { shear = 0, pivot = 1, clipBottom = Infinity, alpha = 1 } = opt || {};
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  const h = spans.length;
  for (let y = Math.max(0, y0 | 0); y <= Math.min(h - 1, y1 | 0); y++) {
    const s = spans[y];
    if (!s) continue;
    if (oy + y > clipBottom) break;
    const sx = shear * (pivot * h - y);
    const a = s[0] + inset, b = s[1] - inset;
    if (b < a) continue;
    ctx.fillRect(Math.round(ox + a + sx), oy + y, b - a + 1, 1);
  }
  ctx.globalAlpha = 1;
}

/**
 * Draw the pea dog.
 *  x, y       — centre-bottom anchor (his feet)
 *  o.size     — body width in pixels
 *  o.face     — 'sleep' | 'idle' | 'happy' | 'wow' | 'squint' | 'closed'
 *  o.squash   — -1..1  (negative = stretched tall, positive = squashed flat)
 *  o.lean     — shear amount
 *  o.look     — [dx, dy] eye offset, -1..1
 *  o.stage    — 0..4 growth stage (adds the head sprout)
 *  o.buried   — 0..1, how far he has sunk into the soil
 */
export function drawPea(ctx, x, y, o = {}) {
  const size = Math.max(10, o.size || 40);
  const squash = o.squash || 0;
  const w = Math.round(size * (1 + squash * 0.22));
  const h = Math.round(size * 0.76 * (1 - squash * 0.3));
  const alpha = o.alpha === undefined ? 1 : o.alpha;
  const parts = buildParts(w, h, o);
  const ox = Math.round(x - w / 2 + (o.offX || 0));
  const oy = Math.round(y - h + (o.offY || 0));
  const lean = (o.lean || 0) * 0.35;
  const opt = { shear: lean, pivot: 1, alpha };
  const outlineR = Math.max(2, Math.round(size / 26));

  const buried = clamp(o.buried || 0, 0, 1);
  const clipBottom = buried > 0 ? oy + h - Math.round(h * buried) : Infinity;
  opt.clipBottom = clipBottom;
  if (buried > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(-2000, -2000, 8000, clipBottom + 2000);
    ctx.clip();
  }

  /* contact shadow */
  if (o.shadow !== false && buried < 0.9) {
    ctx.globalAlpha = 0.22 * alpha * (1 - buried);
    fillEllipse(ctx, x + (o.shadowOff || 0), y + 1, w * 0.46, Math.max(1.5, h * 0.11), '#1b2a16');
    ctx.globalAlpha = 1;
  }

  /* pale die-cut halo, then the heavy ink outline */
  const halo = spansDilate(parts.all, outlineR + 1);
  shearFill(ctx, halo, ox, oy, rgba(PEA.halo, 0.55 * alpha), { ...opt, alpha: 1 });
  const ink = spansDilate(parts.all, outlineR);
  shearFill(ctx, ink, ox, oy, PEA.ink, opt);

  /* body */
  shearFill(ctx, parts.body, ox, oy, PEA.body, opt);

  /* belly shading with a dithered seam */
  shearFillRows(ctx, parts.body, ox, oy, PEA.bodyLo, h * 0.68, h, 0, opt);
  shearFillRows(ctx, parts.body, ox, oy, PEA.bodyLo2, h * 0.86, h, 1, opt);
  // seam dither
  ctx.globalAlpha = alpha;
  for (let yy = Math.floor(h * 0.62); yy < Math.floor(h * 0.7); yy++) {
    const s = parts.body[yy];
    if (!s || oy + yy > clipBottom) continue;
    const sx = lean * (h - yy);
    for (let xx = s[0]; xx <= s[1]; xx++) {
      if (((xx * 3 + yy * 5) & 7) === 0) {
        ctx.fillStyle = PEA.bodyLo;
        ctx.fillRect(Math.round(ox + xx + sx), oy + yy, 1, 1);
      }
    }
  }
  ctx.globalAlpha = 1;

  /* top-left sheen (the sticker's glossy bean) */
  {
    const y0 = Math.floor(h * 0.12), y1 = Math.floor(h * 0.34);
    ctx.globalAlpha = alpha;
    for (let yy = y0; yy <= y1; yy++) {
      const s = parts.body[yy];
      if (!s || oy + yy > clipBottom) continue;
      const t = (yy - y0) / Math.max(1, y1 - y0);
      const sx = lean * (h - yy);
      const a = s[0] + Math.round(lerp(w * 0.18, w * 0.1, t));
      const b = a + Math.round(lerp(w * 0.1, w * 0.22, t));
      ctx.fillStyle = PEA.bodyHi;
      ctx.fillRect(Math.round(ox + a + sx), oy + yy, Math.max(1, b - a), 1);
    }
    // glint
    ctx.fillStyle = rgba(PEA.bodyHi2, 0.9);
    const gy = oy + Math.floor(h * 0.2);
    if (gy < clipBottom) ctx.fillRect(Math.round(ox + w * 0.22 + lean * h * 0.8), gy, Math.max(1, Math.round(w * 0.08)), 1);
    ctx.globalAlpha = 1;
  }

  /* ears — each with its own ink outline, drawn over the body */
  for (const [spansE, col] of [[parts.earR, PEA.ear], [parts.earL, PEA.earLo]]) {
    const inkE = spansDilate(spansE, Math.max(1, outlineR - 1));
    shearFill(ctx, inkE, ox, oy, PEA.ink, opt);
    shearFill(ctx, spansE, ox, oy, col, opt);
    shearFillRows(ctx, spansE, ox, oy, shade(col, -0.12), h * 0.3, h, 1, opt);
  }

  /* head sprout — grows with him */
  if (o.stage > 0 && buried < 0.5) {
    drawSprout(ctx, ox + w * 0.42 + lean * h * 0.95, oy + 1, size, o.stage, o.t || 0, alpha);
  }

  /* face */
  drawFace(ctx, ox, oy, w, h, lean, o, alpha, clipBottom);

  /* stubby feet while walking */
  if (o.feet) {
    const ph = o.t || 0;
    for (let i = 0; i < 2; i++) {
      const fx = ox + w * (i ? 0.63 : 0.31) + lean * h * 0.05;
      const lift = Math.max(0, Math.sin(ph * 9 + i * Math.PI)) * size * 0.07;
      const fy = oy + h - 1 - lift;
      if (fy > clipBottom) continue;
      const fw = Math.max(2.2, size * 0.075);
      fillEllipse(ctx, fx, fy + fw * 0.4, fw + 1.2, fw * 0.72 + 1.2, PEA.ink);
      fillEllipse(ctx, fx, fy + fw * 0.4, fw, fw * 0.62, PEA.ear);
      fillEllipse(ctx, fx - fw * 0.3, fy + fw * 0.2, fw * 0.4, fw * 0.3, PEA.body);
    }
  }

  /* little curl of a tail */
  if (o.tail) {
    const wag = Math.sin((o.t || 0) * 12) * size * 0.06;
    const tx = ox - 1, ty = oy + h * 0.52;
    ctx.fillStyle = PEA.ink;
    ctx.fillRect(Math.round(tx - size * 0.1), Math.round(ty + wag), Math.max(2, Math.round(size * 0.1)), 2);
  }
  if (buried > 0) ctx.restore();
  return { w, h, ox, oy };
}

function drawFace(ctx, ox, oy, w, h, lean, o, alpha, clipBottom) {
  const face = o.face || 'idle';
  const lookX = clamp((o.look && o.look[0]) || 0, -1, 1);
  const lookY = clamp((o.look && o.look[1]) || 0, -1, 1);
  const S = (v) => Math.round(v);
  const shx = (yy) => lean * (h - yy);

  const eyeY = h * (face === 'sleep' ? 0.46 : 0.44) + lookY * h * 0.03;
  const ex1 = w * 0.36 + lookX * w * 0.03;
  const ex2 = w * 0.585 + lookX * w * 0.03;
  const er = Math.max(1, w * 0.042);
  const ery = Math.max(1.2, w * 0.056);
  if (oy + eyeY > clipBottom) return;
  ctx.globalAlpha = alpha;

  const drawEye = (cx) => {
    const X = ox + cx + shx(eyeY), Y = oy + eyeY;
    if (face === 'sleep' || face === 'closed' || face === 'happy' || face === 'squint') {
      // closed, contented arc  ‿
      const rr = Math.max(1.5, er * 1.35);
      ctx.fillStyle = PEA.eye;
      const up = face === 'happy' || face === 'squint' ? -1 : 1;
      for (let i = -rr; i <= rr; i++) {
        const t = i / rr;
        const dy = up * (1 - t * t) * rr * 0.6;
        ctx.fillRect(S(X + i), S(Y + (up > 0 ? -dy + rr * 0.3 : dy - rr * 0.1)), 1, Math.max(1, Math.round(er * 0.6)));
      }
    } else {
      const big = face === 'wow' ? 1.25 : 1;
      fillEllipse(ctx, X, Y, er * big, ery * big, PEA.eye);
      ctx.fillStyle = PEA.shine;
      ctx.fillRect(S(X - er * 0.5), S(Y - ery * 0.55), Math.max(1, Math.round(er * 0.8)), Math.max(1, Math.round(er * 0.8)));
    }
  };
  drawEye(ex1);
  drawEye(ex2);

  // blush on the cheeks when happy
  if (face === 'happy' || o.blush) {
    ctx.globalAlpha = 0.5 * alpha;
    fillEllipse(ctx, ox + w * 0.26 + shx(h * 0.56), oy + h * 0.56, w * 0.055, w * 0.035, '#ff9ab0');
    fillEllipse(ctx, ox + w * 0.68 + shx(h * 0.56), oy + h * 0.56, w * 0.055, w * 0.035, '#ff9ab0');
    ctx.globalAlpha = alpha;
  }

  /* nose + mouth */
  const nx = ox + w * 0.468 + shx(h * 0.6);
  const ny = oy + h * 0.585 + lookY * h * 0.02;
  if (ny + h * 0.14 > clipBottom) { ctx.globalAlpha = 1; return; }
  const nw = Math.max(2, w * 0.075);
  const nh = Math.max(1.5, w * 0.05);
  ctx.fillStyle = PEA.eye;
  fillEllipse(ctx, nx, ny, nw * 0.62, nh * 0.72, PEA.eye);
  ctx.fillRect(S(nx - nw * 0.2), S(ny), Math.max(1, Math.round(nw * 0.4)), Math.max(1, Math.round(nh * 0.9)));

  const my = ny + nh * 0.9;
  const mw = Math.max(2, w * 0.062);
  if (face === 'happy' || face === 'wow' || o.mouthOpen > 0.3) {
    // open, delighted mouth
    const op = clamp(o.mouthOpen === undefined ? 1 : o.mouthOpen, 0.3, 1);
    const mh = Math.max(2, w * 0.075 * op);
    fillEllipse(ctx, nx, my + mh * 0.4, mw * 0.95, mh, PEA.eye);
    fillEllipse(ctx, nx, my + mh * 0.75, mw * 0.5, mh * 0.42, '#e0607a');
  } else {
    // the sticker's soft "w" muzzle
    for (const side of [-1, 1]) {
      for (let i = 0; i <= mw; i++) {
        const t = i / mw;
        const yy = my + Math.sin(t * Math.PI) * mw * 0.45;
        ctx.fillRect(S(nx + side * i), S(yy), 1, 1);
      }
    }
  }
  ctx.globalAlpha = 1;
}

/** The sprig on his head: two leaves, then a bud, then a butterfly-pea flower. */
export function drawSprout(ctx, x, y, size, stage, t, alpha = 1) {
  const sway = Math.sin(t * 2.1) * size * 0.02;
  const len = size * (0.08 + stage * 0.045);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = PEA.ink;
  // stem (with outline by drawing a 3px wide dark line then a 1px bright core)
  for (let i = 0; i <= len; i++) {
    const t2 = i / Math.max(1, len);
    const X = x + sway * t2, Y = y - i;
    ctx.fillRect(Math.round(X - 1), Math.round(Y), 3, 1);
  }
  ctx.fillStyle = PEA.sprout;
  for (let i = 0; i <= len; i++) {
    const t2 = i / Math.max(1, len);
    ctx.fillRect(Math.round(x + sway * t2), Math.round(y - i), 1, 1);
  }
  const lx = x + sway, ly = y - len;
  const lr = size * (0.05 + stage * 0.014);
  // two leaves with ink outlines
  for (const side of [-1, 1]) {
    const cx = lx + side * lr * 0.9, cy = ly + lr * 0.1;
    fillEllipse(ctx, cx, cy, lr * 1.05 + 1, lr * 0.72 + 1, PEA.ink);
    fillEllipse(ctx, cx, cy, lr, lr * 0.66, side < 0 ? PEA.sprout : PEA.sproutHi);
  }
  if (stage >= 4) {
    // a butterfly pea bloom
    fillEllipse(ctx, lx, ly - lr * 0.9, lr * 0.95 + 1, lr * 0.85 + 1, PEA.ink);
    fillEllipse(ctx, lx, ly - lr * 0.9, lr * 0.85, lr * 0.75, PEA.flower);
    fillEllipse(ctx, lx, ly - lr * 1.05, lr * 0.45, lr * 0.35, PEA.flowerHi);
    px(ctx, lx, ly - lr * 0.7, PEA.flowerCore);
  }
  ctx.globalAlpha = 1;
}

/* --------------------------------------------------------------- the pups */

export class Pup {
  constructor(x, y, seed, homeY) {
    this.x = x; this.y = y;
    this.homeY = homeY;
    this.r = rng(seed);
    this.vx = this.r.f(-14, 14);
    this.vy = -this.r.f(30, 70);
    this.size = this.r.f(18, 25);
    this.t = this.r.f(0, 6);
    this.state = 'pop';
    this.timer = this.r.f(0.4, 1.4);
    this.face = 'wow';
    this.squash = 0;
    this.flip = false;
    this.grounded = false;
    this.bounce = 0;
    this.homeY += this.r.f(-5, 6);
  }
  update(dt, bounds, target) {
    this.t += dt;
    if (!this.grounded) {
      this.vy += 190 * dt;
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      if (this.y >= this.homeY) {
        this.y = this.homeY;
        this.vy *= -0.42;
        this.vx *= 0.7;
        this.squash = 0.4;
        if (Math.abs(this.vy) < 22) { this.grounded = true; this.vy = 0; this.face = 'happy'; }
      }
    } else {
      this.timer -= dt;
      if (this.timer <= 0) {
        this.timer = this.r.f(0.8, 2.4);
        const roll = this.r.f();
        this.state = roll < 0.42 ? 'walk' : roll < 0.6 ? 'hop' : 'sit';
        if (this.state === 'walk') this.vx = this.r.chance(0.5) ? -this.r.f(8, 20) : this.r.f(8, 20);
        if (this.state === 'hop') { this.vy = -this.r.f(40, 70); this.grounded = false; }
        if (this.state === 'sit') this.vx = 0;
      }
      if (target && this.r.chance(dt * 1.2)) {
        this.vx = Math.sign(target.x - this.x) * this.r.f(10, 22);
        this.state = 'walk';
      }
      this.x += this.vx * dt;
      if (this.x < bounds[0]) { this.x = bounds[0]; this.vx = Math.abs(this.vx); }
      if (this.x > bounds[1]) { this.x = bounds[1]; this.vx = -Math.abs(this.vx); }
      this.flip = this.vx < 0;
      this.squash = lerp(this.squash, this.state === 'walk' ? Math.sin(this.t * 11) * 0.09 : 0, dt * 8);
      this.face = this.state === 'sit' ? (Math.sin(this.t * 0.9) > 0.9 ? 'closed' : 'idle') : 'happy';
    }
    this.squash = lerp(this.squash, 0, dt * 6);
  }
  draw(ctx) {
    drawPea(ctx, this.x, this.y, {
      size: this.size,
      face: this.face,
      squash: this.squash,
      lean: this.vx * 0.004,
      t: this.t,
      stage: 1,
      feet: this.state === 'walk' && this.grounded,
      tail: true,
      look: [clamp(this.vx / 20, -1, 1), 0],
    });
  }
}
