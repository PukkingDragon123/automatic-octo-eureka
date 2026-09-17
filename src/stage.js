/* ============================================================================
 *  stage.js — the hilltop you actually play on.
 *  Grass, the little pond, tilled soil, the watering can, and the butterfly
 *  pea tree that grows out of the story's second half.
 * ==========================================================================*/

import {
  rng, noise1d, clamp, lerp, mix, shade, rgba, makeCanvas,
  rect, hline, vline, line, px, fillEllipse, fillCircle, fillPoly,
  ditherGradient, ditherOverlay, BAYER4,
} from './core.js';
import { W, H, ERAS, GROUND_Y } from './vista.js';

export const POND = { x: 166, y: 276, rx: 43, ry: 14 };
export const SOIL = { x: 358, y: 281, rx: 37, ry: 12 };
export const CAN_HOME = { x: 104, y: 266 };

/** Height of the hilltop grass surface at a given x. */
export function groundY(x) {
  return GROUND_Y + 4 + Math.sin(x * 0.011 + 1.2) * 3 + Math.sin(x * 0.037) * 1.4;
}

/* --------------------------------------------------------------- the grass */

export function renderGround(eraIndex) {
  const P = ERAS[eraIndex];
  const { canvas, ctx } = makeCanvas(W, H);
  const r = rng(4242 + eraIndex * 17);
  const n = noise1d(88 + eraIndex, W, 4, 0.5);

  // body of the hill: darker toward the bottom (closer = more shadowed by grass)
  for (let x = 0; x < W; x++) {
    const gy = Math.round(groundY(x));
    for (let y = gy; y < H; y++) {
      const t = (y - gy) / (H - gy);
      let c = mix(P.grassHi, P.grass, clamp(t * 1.6, 0, 1));
      if (t > 0.55) c = mix(c, P.grassDark, (t - 0.55) / 0.45 * 0.8);
      ctx.fillStyle = c;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  // sunlit crest band
  for (let x = 0; x < W; x++) {
    const gy = Math.round(groundY(x));
    ditherOverlay(ctx, x, gy, 1, 4, mix(P.grassHi, '#ffffff', 0.25), 0.55);
    ditherOverlay(ctx, x, gy + 3, 1, 5, P.grassHi, 0.4);
  }
  // clumpy mottling
  for (let i = 0; i < 2600; i++) {
    const x = r.i(0, W - 1);
    const y = r.f(groundY(x), H);
    const t = (y - groundY(x)) / (H - groundY(x));
    const c = r.chance(0.5) ? shade(P.grassDark, -0.1) : P.grassHi;
    ctx.globalAlpha = 0.35 + r.f() * 0.3;
    ctx.fillRect(x, y | 0, 1, r.chance(0.3) ? 2 : 1);
    ctx.fillStyle = c;
    ctx.fillRect(x, y | 0, 1, 1);
    ctx.globalAlpha = 1;
  }
  // individual blades, denser at the bottom
  for (let i = 0; i < 1500; i++) {
    const x = r.f(0, W);
    const gy = groundY(x);
    const y = lerp(gy, H, Math.pow(r.f(), 0.6));
    const depth = (y - gy) / (H - gy);
    const len = lerp(2, 6, depth) * r.f(0.6, 1.4);
    const bend = r.f(-1.2, 1.2);
    const c = r.chance(0.45) ? P.grassDark : r.chance(0.5) ? P.grass : P.grassHi;
    ctx.fillStyle = c;
    for (let k = 0; k < len; k++) {
      ctx.fillRect(Math.round(x + bend * (k / len) * (k / len) * 3), Math.round(y - k), 1, 1);
    }
  }
  // seed heads / wildflowers of the era
  for (let i = 0; i < 150; i++) {
    const x = r.f(0, W);
    const gy = groundY(x);
    const y = lerp(gy + 2, H, Math.pow(r.f(), 0.7));
    ctx.fillStyle = P.grassSeed;
    ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
    if (r.chance(0.4)) ctx.fillRect(Math.round(x) + 1, Math.round(y) - 1, 1, 1);
  }

  /* stone steps and retaining wall, bottom-left, straight from the photo */
  drawSteps(ctx, P, r);

  // the last rows are flat, so a tall screen can extend the turf downwards
  // without a seam showing
  rect(ctx, 0, H - 2, W, 2, P.grassDark);
  return canvas;
}

function drawSteps(ctx, P, r) {
  const stone = P.key === 'dusk' ? '#5a5a62' : '#9a968c';
  const stoneLo = shade(stone, -0.3);
  const stoneHi = shade(stone, 0.22);
  // retaining wall of stacked rubble
  let y = 268;
  for (let row = 0; row < 5; row++) {
    let x = -6 + (row % 2) * 4;
    while (x < 96 - row * 3) {
      const w = r.f(6, 13);
      const h = 5;
      const c = mix(stone, r.chance(0.5) ? stoneLo : stoneHi, r.f(0, 0.5));
      rect(ctx, x, y, w - 1, h - 1, c);
      hline(ctx, x, x + w - 2, y, shade(c, 0.18));
      hline(ctx, x, x + w - 2, y + h - 2, shade(c, -0.25));
      x += w;
    }
    y += 5;
    if (y > H) break;
  }
  // the stair treads climbing out of frame
  for (let i = 0; i < 5; i++) {
    const sy = 272 + i * 6;
    const sx = 22 + i * 5;
    const sw = 40 - i * 3;
    rect(ctx, sx, sy, sw, 4, mix(stone, '#ffffff', 0.12));
    hline(ctx, sx, sx + sw, sy, stoneHi);
    hline(ctx, sx, sx + sw, sy + 3, stoneLo);
    // grass creeping over the edges
    for (let k = 0; k < 8; k++) {
      ctx.fillStyle = P.grassDark;
      const gx = sx + r.f(0, sw);
      ctx.fillRect(gx | 0, sy - 1, 1, 2);
    }
  }
}

/* --------------------------------------------- animated grass on top of it */

export function makeTufts(seed = 9) {
  const r = rng(seed);
  const tufts = [];
  for (let i = 0; i < 130; i++) {
    const x = r.f(-4, W + 4);
    const gy = groundY(x);
    const y = lerp(gy, H + 4, Math.pow(r.f(), 0.55));
    tufts.push({
      x, y, blades: r.i(3, 6), h: lerp(3, 9, (y - gy) / (H - gy)) * r.f(0.7, 1.5),
      phase: r.f(0, 6.28), sway: r.f(0.7, 1.5), tone: r.f(),
    });
  }
  return tufts;
}

export function drawTufts(ctx, tufts, P, t, wind) {
  for (const tu of tufts) {
    const s = Math.sin(t * 1.7 + tu.phase + tu.x * 0.02) * wind * tu.sway;
    const c = tu.tone < 0.4 ? P.grassDark : tu.tone < 0.75 ? P.grass : P.grassHi;
    ctx.fillStyle = c;
    for (let b = 0; b < tu.blades; b++) {
      const bx = tu.x + (b - tu.blades / 2) * 1.4;
      const bh = tu.h * (0.6 + ((b * 37) % 10) / 14);
      for (let k = 0; k < bh; k++) {
        const f = k / bh;
        ctx.fillRect(Math.round(bx + s * f * f * 2.4), Math.round(tu.y - k), 1, 1);
      }
    }
  }
}

/* ---------------------------------------------------------------- the pond */

export function drawPond(ctx, P, t, opts = {}) {
  const { x, y, rx, ry } = POND;
  const dusk = P.key === 'dusk';
  const deep = dusk ? '#2b3560' : mix('#2f6f8c', P.hazeCol, 0.05);
  const mid = dusk ? '#47548c' : '#4d94a8';
  const shallow = dusk ? '#7a7ab0' : '#84c2c4';
  const sky = dusk ? '#e8a06a' : mix(P.sky[1][1], '#ffffff', 0.25);

  // muddy bank
  fillEllipse(ctx, x, y, rx + 5, ry + 4, dusk ? '#3a3a34' : '#6b5c3e');
  fillEllipse(ctx, x, y, rx + 3, ry + 2.5, dusk ? '#4a4a40' : '#7d6c48');
  // pebbles
  const pr = rng(77);
  for (let i = 0; i < 34; i++) {
    const a = pr.f(0, 6.28);
    const d = pr.f(0.92, 1.12);
    const px_ = x + Math.cos(a) * rx * d, py_ = y + Math.sin(a) * ry * d;
    fillEllipse(ctx, px_, py_, pr.f(1, 2.4), pr.f(0.8, 1.6), pr.chance(0.5) ? '#8a8276' : '#a49a8a');
  }
  // water body
  fillEllipse(ctx, x, y, rx, ry, deep);
  fillEllipse(ctx, x, y + ry * 0.12, rx * 0.94, ry * 0.8, mid);
  // sky reflection band across the top of the water
  ctx.globalAlpha = 0.55;
  fillEllipse(ctx, x + 2, y - ry * 0.42, rx * 0.72, ry * 0.3, sky);
  ctx.globalAlpha = 1;
  // shallow rim
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * Math.PI * 2;
    px(ctx, x + Math.cos(a) * rx * 0.97, y + Math.sin(a) * ry * 0.97, shallow);
  }
  // shimmer — horizontal dashes that drift and breathe
  for (let i = 0; i < 16; i++) {
    const ph = i * 1.37;
    const yy = y - ry * 0.7 + ((i * 2.1 + Math.sin(t * 0.6 + ph) * 1.5) % (ry * 1.7));
    const dy = (yy - y) / ry;
    const hw = Math.sqrt(Math.max(0, 1 - dy * dy)) * rx * 0.9;
    const w = 3 + Math.sin(t * 2.2 + ph) * 3;
    const xx = x + Math.sin(t * 0.8 + ph * 2.2) * hw * 0.6;
    if (w < 1) continue;
    ctx.fillStyle = rgba(dusk ? '#ffca8a' : '#d8f4f4', 0.28 + 0.22 * Math.sin(t * 3 + ph));
    ctx.fillRect(Math.round(xx - w / 2), Math.round(yy), Math.round(w), 1);
  }
  // reeds on the left bank
  const rr = rng(21);
  for (let i = 0; i < 12; i++) {
    const bx = x - rx * rr.f(0.55, 1.15);
    const by = y + rr.f(-ry * 0.5, ry * 0.7);
    const h = rr.f(7, 18);
    const s = Math.sin(t * 1.3 + i) * 1.6;
    const c = P.canopy === 'bare' ? '#8d8256' : dusk ? '#2c4a42' : '#3f7a44';
    for (let k = 0; k < h; k++) {
      const f = k / h;
      ctx.fillStyle = k > h - 4 ? mix(c, '#b8a04a', 0.6) : c;
      ctx.fillRect(Math.round(bx + s * f * f), Math.round(by - k), 1, 1);
    }
  }
  // lily pad with a bloom
  const lx = x + rx * 0.42, ly = y + ry * 0.16 + Math.sin(t * 0.9) * 0.6;
  fillEllipse(ctx, lx, ly, 7, 4, dusk ? '#2e4a3c' : '#3f8a4a');
  fillEllipse(ctx, lx - 1, ly - 0.6, 5, 2.6, dusk ? '#3e5a4a' : '#5aa85c');
  ctx.fillStyle = dusk ? '#1e3830' : '#2f6a3c';
  ctx.fillRect(Math.round(lx + 3), Math.round(ly), 4, 1);
  if (P.key === 'pea' || P.key === 'dusk' || P.key === 'flourish') {
    fillEllipse(ctx, lx - 2, ly - 3, 2.4, 2, '#f0e4f8');
    px(ctx, lx - 2, ly - 3, '#f2d46a');
  }

  // ripples (from a dipped can, a poke, a drop)
  if (opts.ripples) {
    for (const rp of opts.ripples) {
      const k = rp.t / rp.life;
      if (k > 1) continue;
      ctx.globalAlpha = (1 - k) * 0.7;
      const rr2 = lerp(2, rp.max, k);
      ctx.fillStyle = '#e4ffff';
      for (let i = 0; i < 26; i++) {
        const a = (i / 26) * Math.PI * 2;
        const px_ = rp.x + Math.cos(a) * rr2;
        const py_ = rp.y + Math.sin(a) * rr2 * 0.32;
        const dx = (px_ - x) / rx, dy = (py_ - y) / ry;
        if (dx * dx + dy * dy > 1) continue;
        ctx.fillRect(Math.round(px_), Math.round(py_), 1, 1);
      }
      ctx.globalAlpha = 1;
    }
  }
}

/* ---------------------------------------------------------------- the soil */

export function drawSoil(ctx, P, t, opts = {}) {
  const { x, y, rx, ry } = SOIL;
  const wet = clamp(opts.wet || 0, 0, 1);
  const dusk = P.key === 'dusk';
  const base = mix(dusk ? '#3a2e26' : '#6b4a32', dusk ? '#241c18' : '#3e2a1c', wet * 0.8);
  const lo = shade(base, -0.28);
  const hi = shade(base, 0.2);
  // rim of turned earth
  fillEllipse(ctx, x, y, rx + 3, ry + 2.5, shade(base, -0.18));
  fillEllipse(ctx, x, y, rx, ry, base);
  fillEllipse(ctx, x, y - ry * 0.16, rx * 0.9, ry * 0.7, hi);
  // furrows raked across the bed
  const rr = rng(303);
  for (let i = 0; i < 9; i++) {
    const fy = y - ry * 0.8 + (i / 9) * ry * 1.7;
    const dy = (fy - y) / ry;
    const hw = Math.sqrt(Math.max(0, 1 - dy * dy)) * rx;
    ctx.fillStyle = rgba(lo, 0.7);
    ctx.fillRect(Math.round(x - hw), Math.round(fy), Math.round(hw * 2), 1);
  }
  // clods
  for (let i = 0; i < 70; i++) {
    const a = rr.f(0, 6.28), d = Math.sqrt(rr.f()) * 0.95;
    const cx = x + Math.cos(a) * rx * d, cy = y + Math.sin(a) * ry * d;
    fillEllipse(ctx, cx, cy, rr.f(0.8, 2.2), rr.f(0.6, 1.4), rr.chance(0.5) ? lo : hi);
  }
  if (wet > 0.05) {
    ctx.globalAlpha = wet * 0.35;
    fillEllipse(ctx, x, y, rx * 0.92, ry * 0.85, dusk ? '#2a2a4a' : '#2e2418');
    ctx.globalAlpha = 1;
    // glisten
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * 6.28 + t;
      ctx.fillStyle = rgba('#ffffff', 0.12 * wet);
      ctx.fillRect(Math.round(x + Math.cos(a) * rx * 0.6), Math.round(y + Math.sin(a) * ry * 0.5), 1, 1);
    }
  }
  // the mound left after he burrows in
  if (opts.mound > 0) {
    const m = clamp(opts.mound, 0, 1);
    const mh = 11 * m;
    const mw = 21 * m;
    fillEllipse(ctx, x, y + 2, mw + 2, mh * 0.8 + 1, shade(base, -0.3));
    fillEllipse(ctx, x, y, mw, mh, shade(base, -0.05));
    fillEllipse(ctx, x, y - mh * 0.42, mw * 0.82, mh * 0.72, hi);
    fillEllipse(ctx, x - mw * 0.24, y - mh * 0.66, mw * 0.36, mh * 0.34, shade(hi, 0.16));
    for (let i = 0; i < 44 * m; i++) {
      const a = rr.f(0, 6.28), d = Math.sqrt(rr.f());
      fillEllipse(ctx, x + Math.cos(a) * mw * d, y + Math.sin(a) * mh * 0.8 * d - mh * 0.2,
        rr.f(0.9, 2.2), rr.f(0.7, 1.5), rr.chance(0.45) ? lo : rr.chance(0.5) ? base : hi);
    }
  }
}

/* -------------------------------------------------------- the watering can */

export function drawCan(ctx, x, y, o = {}) {
  const s = o.scale || 1;
  const tilt = clamp(o.tilt || 0, 0, 1);
  const fill = clamp(o.fill === undefined ? 0 : o.fill, 0, 1);
  const sx = o.flip ? 1 : -1;            // which way the spout points
  const phi = tilt * 1.15;               // how far it is tipped over
  const bw = 19 * s, bh = 18 * s;

  const tin = '#93a8b6', tinHi = '#cfdee6', tinHi2 = '#f0f8fb';
  const tinLo = '#5e7381', tinDk = '#36464f', ink = '#212d34';
  const band = '#3f7f8c', bandHi = '#6fb4ba';

  // local frame: v points up the can, u across it
  const vx = sx * Math.sin(phi), vy = -Math.cos(phi);
  const ux = -vy, uy = vx;
  const pivot = bh * 1.62;                 // it hangs from the handle
  const px0 = x, py0 = y - pivot;
  const P = (lx, ly) => [px0 + ux * lx + vx * (ly - pivot), py0 + uy * lx + vy * (ly - pivot)];
  const halfW = (t) => bw * 0.5 * lerp(0.86, 1.02, Math.pow(t, 0.8));
  const flat = 0.27 + 0.25 * Math.abs(Math.sin(phi));  // how open the rim looks

  if (o.shadow !== false) {
    ctx.globalAlpha = 0.22;
    fillEllipse(ctx, x + 1, y + 1, bw * 0.6, 2.6 * s, '#1b2a16');
    ctx.globalAlpha = 1;
  }

  /* --- spout: a tapering tube curving out of the belly ------------------ */
  const sp = [
    [sx * bw * 0.34, bh * 0.16],
    [sx * bw * 0.92, bh * 0.36],
    [sx * bw * 1.38, bh * 0.74],
  ];
  const bez = (t) => {
    const mt = 1 - t;
    return [
      mt * mt * sp[0][0] + 2 * mt * t * sp[1][0] + t * t * sp[2][0],
      mt * mt * sp[0][1] + 2 * mt * t * sp[1][1] + t * t * sp[2][1],
    ];
  };
  const SEG = 16;
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i <= SEG; i++) {
      const t = i / SEG;
      const [lx, ly] = bez(t);
      const [wx, wy] = P(lx, ly);
      const r = lerp(3.1, 1.9, t) * s;
      if (pass === 0) fillEllipse(ctx, wx, wy, r + 1, r + 1, ink);
      else {
        fillEllipse(ctx, wx, wy, r, r, tin);
        fillEllipse(ctx, wx - r * 0.3, wy - r * 0.35, r * 0.45, r * 0.4, tinHi);
      }
    }
  }
  // the rose on the end
  const [rlx, rly] = bez(1);
  const [rx_, ry_] = P(rlx, rly);
  const rr = 4.6 * s;
  const rax = ux * 0.35 + vx * 0.94, ray = uy * 0.35 + vy * 0.94;
  fillEllipse(ctx, rx_ + rax, ry_ + ray, rr + 1, rr * 0.78 + 1, ink);
  fillEllipse(ctx, rx_ + rax, ry_ + ray, rr, rr * 0.72, tinLo);
  fillEllipse(ctx, rx_ + rax - rr * 0.3, ry_ + ray - rr * 0.28, rr * 0.55, rr * 0.36, tin);
  ctx.fillStyle = tinDk;
  for (let i = 0; i < 6; i++) {
    ctx.fillRect(Math.round(rx_ + rax - rr * 0.55 + (i % 3) * 1.8 * s),
                 Math.round(ry_ + ray - rr * 0.3 + Math.floor(i / 3) * 1.8 * s), 1, 1);
  }

  /* --- body: a stack of discs, so tipping it reads as a real cylinder ---- */
  const N = Math.round(bh);
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const [wx, wy] = P(0, i);
    const r = halfW(t);
    fillEllipse(ctx, wx, wy, r + 1, r * flat + 1.2, ink);
  }
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const [wx, wy] = P(0, i);
    const r = halfW(t);
    const ry2 = Math.max(0.9, r * flat);
    fillEllipse(ctx, wx, wy, r, ry2, tin);
    // sun side / shade side
    fillEllipse(ctx, wx - r * 0.42, wy - ry2 * 0.1, r * 0.26, ry2 * 0.72, tinHi);
    fillEllipse(ctx, wx + r * 0.58, wy, r * 0.2, ry2 * 0.66, tinLo);
    // painted band around the middle
    if (t > 0.38 && t < 0.56) {
      fillEllipse(ctx, wx, wy, r * 0.99, ry2 * 0.95, band);
      fillEllipse(ctx, wx - r * 0.42, wy, r * 0.22, ry2 * 0.6, bandHi);
    }
    if (t > 0.9) {
      fillEllipse(ctx, wx - r * 0.3, wy - ry2 * 0.3, r * 0.3, ry2 * 0.4, tinHi2);
    }
  }

  /* --- mouth of the can, and the water lying inside it ------------------ */
  const [tx, ty] = P(0, bh);
  const tr = halfW(1);
  fillEllipse(ctx, tx, ty, tr + 1, tr * flat + 1, ink);
  fillEllipse(ctx, tx, ty, tr, tr * flat, tinDk);
  if (fill > 0.02) {
    const slosh = Math.sin((o.t || 0) * 4.5) * fill * 1.1;
    const wr = tr * (0.42 + 0.56 * fill);
    fillEllipse(ctx, tx + slosh, ty + tr * flat * (1 - fill) * 0.5, wr, wr * flat * 0.92, '#3fa6d8');
    fillEllipse(ctx, tx + slosh - wr * 0.3, ty + tr * flat * (1 - fill) * 0.5 - 0.4, wr * 0.5, wr * flat * 0.4, '#8fdcf2');
  }
  ctx.fillStyle = tinHi;
  for (let i = 0; i < 30; i++) {
    const a = (i / 30) * Math.PI * 2;
    ctx.fillRect(Math.round(tx + Math.cos(a) * tr), Math.round(ty + Math.sin(a) * tr * flat), 1, 1);
  }

  /* --- the carry handle arching over the top ---------------------------- */
  const h0 = [-sx * bw * 0.34, bh * 0.94];
  const h1 = [-sx * bw * 0.1, bh * 1.72];
  const h2 = [sx * bw * 0.36, bh * 0.92];
  const hbez = (t) => {
    const mt = 1 - t;
    return [
      mt * mt * h0[0] + 2 * mt * t * h1[0] + t * t * h2[0],
      mt * mt * h0[1] + 2 * mt * t * h1[1] + t * t * h2[1],
    ];
  };
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i <= 22; i++) {
      const [lx, ly] = hbez(i / 22);
      const [wx, wy] = P(lx, ly);
      if (pass === 0) fillEllipse(ctx, wx, wy, 1.9 * s, 1.9 * s, ink);
      else {
        fillEllipse(ctx, wx, wy, 1 * s, 1 * s, i < 11 ? tinHi : tin);
      }
    }
  }
  /* --- a side grip on the back, the way real cans have ------------------ */
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i <= 12; i++) {
      const a = -0.9 + (i / 12) * 1.8;
      const lx = -sx * (bw * 0.46 + Math.cos(a) * bw * 0.2);
      const ly = bh * 0.62 + Math.sin(a) * bh * 0.26;
      const [wx, wy] = P(lx, ly);
      if (pass === 0) fillEllipse(ctx, wx, wy, 1.8 * s, 1.8 * s, ink);
      else fillEllipse(ctx, wx, wy, 0.9 * s, 0.9 * s, tin);
    }
  }

  return { spout: { x: rx_ + rax * 2, y: ry_ + ray * 2 } };
}

/* ------------------------------------------------- the butterfly pea plant */

/** Deterministic branch skeleton; `order` lets the tree grow limb by limb. */
export function buildTree(seed = 5150) {
  const r = rng(seed);
  const segs = [];
  const leaves = [];
  const flowers = [];
  const grow = (x, y, ang, len, thick, depth, order) => {
    const steps = Math.max(3, Math.round(len / 2));
    let px_ = x, py_ = y;
    const curve = r.f(-0.25, 0.25);
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const a = ang + curve * t;
      const nx = px_ + Math.cos(a) * (len / steps);
      const ny = py_ + Math.sin(a) * (len / steps);
      segs.push({
        x0: px_, y0: py_, x1: nx, y1: ny,
        th: lerp(thick, thick * 0.55, t), depth,
        order: order + (t * 0.85) / (depth + 1),
      });
      px_ = nx; py_ = ny;
    }
    const endOrder = order + 0.85 / (depth + 1);
    if (depth >= 2) {
      const n = r.i(3, 7);
      for (let i = 0; i < n; i++) {
        const a2 = r.f(0, 6.28);
        const d = r.f(0, 6);
        leaves.push({
          x: px_ + Math.cos(a2) * d, y: py_ + Math.sin(a2) * d * 0.8,
          r: r.f(2.4, 4.6), tone: r.f(), order: endOrder + r.f(0.01, 0.08), ph: r.f(0, 6.28),
        });
      }
    }
    if (depth < 4 && len > 5) {
      const n = depth === 0 ? 3 : r.i(2, 3);
      for (let i = 0; i < n; i++) {
        const spread = lerp(0.85, 0.42, depth / 4);
        const a2 = ang + r.f(-spread, spread) + (i - (n - 1) / 2) * 0.42;
        grow(px_, py_, a2 - Math.abs(a2) * 0.05, len * r.f(0.56, 0.76), thick * 0.62, depth + 1, endOrder);
      }
    } else {
      // a full spray at the twig ends, plus the blossoms
      const n = r.i(5, 10);
      for (let i = 0; i < n; i++) {
        const a2 = r.f(0, 6.28);
        const d = r.f(0, 8);
        leaves.push({
          x: px_ + Math.cos(a2) * d, y: py_ + Math.sin(a2) * d * 0.8,
          r: r.f(2.2, 4.4), tone: r.f(), order: endOrder + r.f(0.02, 0.12), ph: r.f(0, 6.28),
        });
      }
      const fn = r.i(1, 3);
      for (let i = 0; i < fn; i++) {
        flowers.push({
          x: px_ + r.f(-8, 8), y: py_ + r.f(-4, 9),
          order: endOrder + r.f(0.14, 0.34), ph: r.f(0, 6.28), s: r.f(0.85, 1.35),
        });
      }
    }
  };
  grow(0, 0, -Math.PI / 2 + 0.06, 30, 6, 0, 0);
  const maxOrder = Math.max(
    ...segs.map((s) => s.order),
    ...leaves.map((l) => l.order),
    ...flowers.map((f) => f.order)
  );
  segs.sort((a, b) => a.depth - b.depth);
  return { segs, leaves, flowers, maxOrder };
}

/**
 * Draw the plant at any point in its life.
 *  growth 0 .. 1 maps to sprout -> full flowering tree.
 */
export function drawTree(ctx, x, y, tree, growth, t, P, opts = {}) {
  const g = clamp(growth, 0, 1);
  const scale = lerp(0.18, 1, Math.pow(g, 0.55)) * (opts.scale || 1);
  const reach = g * tree.maxOrder * 1.18;
  const dusk = P.key === 'dusk';
  const bark = dusk ? '#2e2620' : '#5a4632';
  const barkHi = dusk ? '#463a2e' : '#7a6144';
  const barkLo = dusk ? '#1c1814' : '#3c2e20';
  const leafC = dusk ? ['#24503e', '#2e6a4c', '#3f8a5c'] : ['#2f6b3a', '#43884a', '#63a85a'];
  const sway = Math.sin(t * 0.9) * 0.8 + Math.sin(t * 1.7) * 0.3;

  const put = (px_, py_) => {
    const h = (y - (y + py_ * scale)) / 40;
    return [x + px_ * scale + sway * h * h * 1.4, y + py_ * scale];
  };

  // trunk + branches
  for (const s of tree.segs) {
    if (s.order > reach) continue;
    const [X0, Y0] = put(s.x0, s.y0);
    const [X1, Y1] = put(s.x1, s.y1);
    const th = Math.max(1, s.th * scale);
    const steps = Math.max(1, Math.round(Math.hypot(X1 - X0, Y1 - Y0)));
    for (let i = 0; i <= steps; i++) {
      const tt = i / steps;
      const px_ = lerp(X0, X1, tt), py_ = lerp(Y0, Y1, tt);
      if (th <= 1.2) {
        px(ctx, px_, py_, bark);
      } else {
        fillEllipse(ctx, px_, py_, th / 2 + 0.5, th / 2 + 0.5, bark);
        fillEllipse(ctx, px_ - th * 0.18, py_, th * 0.22, th * 0.4, barkHi);
        fillEllipse(ctx, px_ + th * 0.3, py_, th * 0.16, th * 0.36, barkLo);
      }
    }
  }
  // leaves
  for (const l of tree.leaves) {
    if (l.order > reach) continue;
    const pop = clamp((reach - l.order) * 6, 0, 1);
    const [X, Y] = put(l.x + Math.sin(t * 1.4 + l.ph) * 0.6, l.y);
    const r = l.r * scale * pop;
    if (r < 0.6) continue;
    const c = leafC[l.tone < 0.35 ? 0 : l.tone < 0.75 ? 1 : 2];
    fillEllipse(ctx, X, Y, r * 1.15, r * 0.8, c);
    if (r > 1.6) fillEllipse(ctx, X - r * 0.3, Y - r * 0.25, r * 0.45, r * 0.3, shade(c, 0.2));
  }
  // butterfly pea blooms
  for (const f of tree.flowers) {
    if (f.order > reach) continue;
    const pop = clamp((reach - f.order) * 4, 0, 1);
    if (pop < 0.05) continue;
    const [X, Y] = put(f.x + Math.sin(t * 1.1 + f.ph) * 0.8, f.y);
    drawPeaFlower(ctx, X, Y, f.s * scale * 2.6 * pop, t + f.ph);
  }
  // seed pods dangling once mature
  if (opts.pods) {
    for (const p of opts.pods) {
      const [X, Y] = put(p.x, p.y);
      drawPod(ctx, X, Y, p.ripe, scale, t, p.burst);
    }
  }
}

/** A single butterfly pea blossom — deep blue with a white-gold throat. */
export function drawPeaFlower(ctx, x, y, r, t = 0, o = {}) {
  if (r < 0.8) { px(ctx, x, y, '#6f5ae0'); return; }
  const deep = o.deep || '#4536b0';
  const mid = o.mid || '#6a55d8';
  const hi = o.hi || '#9d8bee';
  const pale = o.pale || '#d8cffa';
  // the big standard petal (fan shaped) with a pale throat
  fillEllipse(ctx, x, y, r * 1.25, r * 1.05, deep);
  fillEllipse(ctx, x, y - r * 0.12, r * 1.05, r * 0.85, mid);
  fillEllipse(ctx, x - r * 0.3, y - r * 0.35, r * 0.5, r * 0.4, hi);
  // throat
  fillEllipse(ctx, x + r * 0.12, y + r * 0.18, r * 0.42, r * 0.34, pale);
  fillEllipse(ctx, x + r * 0.12, y + r * 0.22, r * 0.22, r * 0.18, '#f4e08c');
  // keel petals below
  fillEllipse(ctx, x + r * 0.55, y + r * 0.5, r * 0.4, r * 0.3, deep);
  if (r > 2) {
    ctx.fillStyle = rgba('#2a1f6e', 0.6);
    ctx.fillRect(Math.round(x - r * 0.9), Math.round(y + r * 0.55), Math.max(1, Math.round(r * 1.2)), 1);
  }
}

/** A pea pod: swells, ripens, then splits. */
export function drawPod(ctx, x, y, ripe, scale, t, burst = 0) {
  const s = Math.max(0.4, scale);
  const L = lerp(8, 17, ripe) * s;
  const Wd = lerp(2.6, 5.2, ripe) * s;
  const green = mix('#5aa83f', '#b8c246', ripe * 0.5);
  const greenHi = shade(green, 0.24);
  const greenLo = shade(green, -0.26);
  const bend = Math.sin(t * 1.2) * 0.6;
  if (burst > 0) {
    // two halves peeling apart
    for (const side of [-1, 1]) {
      const off = burst * 6 * side * s;
      ctx.globalAlpha = clamp(1 - burst * 0.6, 0, 1);
      for (let i = 0; i < L; i++) {
        const tt = i / L;
        const w = Math.sin(tt * Math.PI) * Wd;
        fillEllipse(ctx, x + off + bend * tt, y + i, w * 0.5, 0.9, side < 0 ? green : greenLo);
      }
      ctx.globalAlpha = 1;
    }
    return;
  }
  // body
  for (let i = 0; i < L; i++) {
    const tt = i / L;
    const w = Math.sin(tt * Math.PI) * Wd + Math.sin(tt * Math.PI * 3) * Wd * 0.22 * ripe;
    fillEllipse(ctx, x + bend * tt, y + i, w + 0.8, 1.1, '#2a3a1e');
  }
  for (let i = 0; i < L; i++) {
    const tt = i / L;
    const w = Math.sin(tt * Math.PI) * Wd + Math.sin(tt * Math.PI * 3) * Wd * 0.22 * ripe;
    fillEllipse(ctx, x + bend * tt, y + i, w, 1, green);
    ctx.fillStyle = greenHi;
    ctx.fillRect(Math.round(x + bend * tt - w * 0.5), Math.round(y + i), 1, 1);
    ctx.fillStyle = greenLo;
    ctx.fillRect(Math.round(x + bend * tt + w * 0.4), Math.round(y + i), 1, 1);
  }
  // stem
  ctx.fillStyle = '#3f6a2a';
  ctx.fillRect(Math.round(x), Math.round(y - 2 * s), 1, Math.max(1, Math.round(2 * s)));
  if (ripe > 0.7) {
    // just a halo at the edge, so the pod still reads as a pod
    ctx.globalAlpha = (ripe - 0.7) / 0.3 * (0.16 + 0.12 * Math.sin(t * 5));
    for (let i = 0; i < L; i++) {
      const tt = i / L;
      const w = Math.sin(tt * Math.PI) * Wd;
      ctx.fillStyle = '#fff4b0';
      ctx.fillRect(Math.round(x + bend * tt - w - 1.6), Math.round(y + i), 2, 1);
      ctx.fillRect(Math.round(x + bend * tt + w - 0.4), Math.round(y + i), 2, 1);
    }
    ctx.globalAlpha = 1;
  }
}
