/* ============================================================================
 *  pixart.js — the tools the backgrounds are painted with.
 *
 *  Everything static in a room is painted once into its own canvas at the
 *  logical resolution, so it can afford to be worked at pixel by pixel:
 *  planks with grain running down them and a knot here and there, plaster
 *  with a speckle, concrete with stains, and objects drawn the way pixel art
 *  draws them — a soft dark edge, three tones, light from the upper left.
 * ==========================================================================*/

import { rng, hex2rgb, shade, clamp, lerp } from './core.js';

export function makeLayer(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  return { c, g, w, h };
}

export const box = (g, x, y, w, h, c) => {
  if (w <= 0 || h <= 0) return;
  g.fillStyle = c;
  g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
};

/** Paint a region pixel by pixel: fn(x, y) returns [r, g, b] or null. */
export function texture(g, x, y, w, h, fn) {
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
  if (w <= 0 || h <= 0) return;
  const img = g.getImageData(x, y, w, h);
  const d = img.data;
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      const c = fn(x + i, y + j, i, j);
      if (!c) continue;
      const k = (j * w + i) * 4;
      d[k] = c[0]; d[k + 1] = c[1]; d[k + 2] = c[2]; d[k + 3] = 255;
    }
  }
  g.putImageData(img, x, y);
}

const mul = (c, k) => [clamp(c[0] * k, 0, 255) | 0, clamp(c[1] * k, 0, 255) | 0, clamp(c[2] * k, 0, 255) | 0];
function hash(x, y, s = 0) {
  let h = (x * 374761393 + y * 668265263 + s * 982451653) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

/** Vertical boards: each its own shade, grain running down, a dark seam. */
export function planksV(g, x, y, w, h, base, o = {}) {
  const b = hex2rgb(base);
  const pw = o.width || 8;
  const seed = o.seed || 1;
  const knots = [];
  const r = rng(seed);
  for (let i = 0; i < (w * h) / 900; i++) knots.push([x + r.f(0, w), y + r.f(0, h), r.f(1.2, 2.4)]);
  texture(g, x, y, w, h, (px, py) => {
    const plank = Math.floor((px - x) / pw);
    const inP = (px - x) % pw;
    const tint = 0.86 + hash(plank, 0, seed) * 0.26;
    if (inP === 0) return mul(b, 0.52 * tint);                 // the seam
    let k = tint;
    if (inP === 1) k *= 1.12;                                  // light catching the edge
    if (inP === pw - 1) k *= 0.86;
    // grain: long streaks that wander a little
    const streak = hash(plank * 31 + Math.floor((px - x) % pw), Math.floor(py / (7 + hash(plank, 3) * 9)), seed);
    k *= 0.93 + streak * 0.12;
    k *= 0.97 + hash(px, py, seed) * 0.06;
    for (const [kx, ky, kr] of knots) {
      const dd = Math.hypot((px - kx) * 1.6, py - ky);
      if (dd < kr) k *= 0.7;
      else if (dd < kr + 1.2) k *= 0.85;
    }
    if (o.fade) k *= lerp(1, o.fade, (py - y) / h);
    return mul(b, k);
  });
}

/** Horizontal boards, for floors and ceilings. */
export function planksH(g, x, y, w, h, base, o = {}) {
  const b = hex2rgb(base);
  const ph = o.height || 5;
  const seed = o.seed || 2;
  texture(g, x, y, w, h, (px, py) => {
    const row = Math.floor((py - y) / ph);
    const inR = (py - y) % ph;
    // boards stagger their joints from row to row
    const len = 38 + Math.floor(hash(row, 1, seed) * 30);
    const off = Math.floor(hash(row, 2, seed) * len);
    const board = Math.floor((px - x + off) / len);
    const joint = (px - x + off) % len === 0;
    const tint = 0.86 + hash(board, row, seed) * 0.24;
    if (inR === 0 || joint) return mul(b, 0.55 * tint);
    let k = tint;
    if (inR === 1) k *= 1.1;
    if (inR === ph - 1) k *= 0.88;
    k *= 0.94 + hash(Math.floor((px + off) / 5), py, seed) * 0.1;
    k *= 0.97 + hash(px, py, seed + 7) * 0.05;
    if (o.fade) k *= lerp(o.fade, 1, (py - y) / h);
    return mul(b, k);
  });
}

/** A painted or plastered wall: flat colour with a fine speckle and wear. */
export function plaster(g, x, y, w, h, base, o = {}) {
  const b = hex2rgb(base);
  const seed = o.seed || 3;
  texture(g, x, y, w, h, (px, py) => {
    let k = 0.97 + hash(px, py, seed) * 0.05;
    if (hash(Math.floor(px / 3), Math.floor(py / 3), seed + 1) > 0.985) k *= 0.9;
    if (o.grime) k *= lerp(1, 0.86, Math.pow(clamp((py - y) / h, 0, 1), 2) * o.grime);
    return mul(b, k);
  });
}

/** Concrete or terrazzo: mottled, with the odd chip. */
export function concrete(g, x, y, w, h, base, o = {}) {
  const b = hex2rgb(base);
  const seed = o.seed || 4;
  texture(g, x, y, w, h, (px, py) => {
    let k = 0.94 + hash(Math.floor(px / 4), Math.floor(py / 2), seed) * 0.08;
    k *= 0.97 + hash(px, py, seed) * 0.06;
    if (hash(px, py, seed + 9) > 0.992) k *= 1.18;
    if (o.lines && (px - x) % o.lines === 0) k *= 0.82;
    return mul(b, k);
  });
}

/** An outlined, three-tone block: the building brick of every object. */
export function block(g, x, y, w, h, base, o = {}) {
  const hi = shade(base, 0.14), sh = shade(base, -0.18), dk = o.edge || shade(base, -0.46);
  box(g, x - 1, y - 1, w + 2, h + 2, dk);
  box(g, x, y, w, h, base);
  if (o.flat) return;
  box(g, x, y, w, 1, hi);
  box(g, x, y, 1, h, hi);
  box(g, x + w - 1, y + 1, 1, h - 1, sh);
  box(g, x + 1, y + h - 1, w - 1, 1, sh);
}

/** An outlined pixel ellipse, for animals and round things. */
export function blob(g, cx, cy, rx, ry, base, edge) {
  const dk = edge || shade(base, -0.46);
  ell(g, cx, cy, rx + 1, ry + 1, dk);
  ell(g, cx, cy, rx, ry, base);
  ell(g, cx - rx * 0.3, cy - ry * 0.35, rx * 0.35, ry * 0.3, shade(base, 0.15));
}
export function ell(g, cx, cy, rx, ry, c) {
  g.fillStyle = c;
  const y0 = Math.ceil(cy - ry), y1 = Math.floor(cy + ry);
  for (let yy = y0; yy <= y1; yy++) {
    const dy = (yy + 0.5 - cy) / ry;
    const s = 1 - dy * dy;
    if (s <= 0) continue;
    const hw = Math.sqrt(s) * rx;
    const xa = Math.round(cx - hw), xb = Math.round(cx + hw);
    if (xb > xa) g.fillRect(xa, yy, xb - xa, 1);
  }
}

export { hash, mul };
