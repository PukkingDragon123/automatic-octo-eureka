/* ============================================================================
 *  core.js — seeded randomness, colour maths and crisp pixel drawing helpers.
 *
 *  Everything in this project is drawn procedurally, pixel by pixel, onto a
 *  small low-resolution buffer which is then blown up with nearest-neighbour
 *  scaling.  These helpers keep every shape on the pixel grid: no canvas
 *  anti-aliasing is ever allowed to soften an edge.
 * ==========================================================================*/

/* ---------------------------------------------------------------- randomness */

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function rng(seed) {
  const n = mulberry32(seed);
  const api = {
    f: (a = 1, b) => (b === undefined ? n() * a : a + n() * (b - a)),
    i: (a, b) => Math.floor(b === undefined ? n() * a : a + n() * (b - a + 1)),
    pick: (arr) => arr[Math.floor(n() * arr.length)],
    chance: (p) => n() < p,
    // roughly gaussian, cheap
    g: (mean = 0, dev = 1) => mean + (n() + n() + n() - 1.5) * 0.8165 * dev * 2,
    raw: n,
  };
  return api;
}

/** 1-D value noise, smoothly interpolated, seeded. */
export function noise1d(seed, len, octaves = 4, persistence = 0.5) {
  const out = new Float32Array(len);
  let amp = 1;
  let total = 0;
  for (let o = 0; o < octaves; o++) {
    const r = rng(seed + o * 7919);
    const step = Math.max(2, len / (2 << o));
    const pts = Math.ceil(len / step) + 2;
    const ctrl = new Float32Array(pts);
    for (let i = 0; i < pts; i++) ctrl[i] = r.f() * 2 - 1;
    for (let x = 0; x < len; x++) {
      const t = x / step;
      const i = Math.floor(t);
      const f = t - i;
      const s = f * f * (3 - 2 * f); // smoothstep
      out[x] += (ctrl[i] * (1 - s) + ctrl[i + 1] * s) * amp;
    }
    total += amp;
    amp *= persistence;
  }
  for (let x = 0; x < len; x++) out[x] /= total;
  return out;
}

export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (t) => t * t * (3 - 2 * t);
export const ease = {
  out: (t) => 1 - Math.pow(1 - t, 3),
  in: (t) => t * t * t,
  inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  back: (t) => 1 + 2.7 * Math.pow(t - 1, 3) + 1.7 * Math.pow(t - 1, 2),
  elastic: (t) =>
    t === 0 || t === 1 ? t : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * 2.094) + 1,
};

/* ------------------------------------------------------------------- colour */

export function hex2rgb(h) {
  const v = parseInt(h[0] === '#' ? h.slice(1) : h, 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}
export function rgb2hex(r, g, b) {
  return (
    '#' +
    ((1 << 24) | (clamp(r | 0, 0, 255) << 16) | (clamp(g | 0, 0, 255) << 8) | clamp(b | 0, 0, 255))
      .toString(16)
      .slice(1)
  );
}
export function mix(c1, c2, t) {
  const a = hex2rgb(c1);
  const b = hex2rgb(c2);
  return rgb2hex(lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t));
}
export function shade(c, amt) {
  const [r, g, b] = hex2rgb(c);
  return amt >= 0 ? rgb2hex(lerp(r, 255, amt), lerp(g, 255, amt), lerp(b, 255, amt))
                  : rgb2hex(r * (1 + amt), g * (1 + amt), b * (1 + amt));
}
/** Push a colour toward the atmospheric haze colour — distance fog. */
export function haze(c, hazeColor, amount) {
  return mix(c, hazeColor, clamp(amount, 0, 1));
}
export function desat(c, amt) {
  const [r, g, b] = hex2rgb(c);
  const l = r * 0.299 + g * 0.587 + b * 0.114;
  return rgb2hex(lerp(r, l, amt), lerp(g, l, amt), lerp(b, l, amt));
}
export function rgba(c, a) {
  const [r, g, b] = hex2rgb(c);
  return `rgba(${r},${g},${b},${a})`;
}

/* ------------------------------------------------------------------ canvases */

export function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: false });
  ctx.imageSmoothingEnabled = false;
  return { canvas: c, ctx, w, h };
}

/* --------------------------------------------------------- pixel primitives */

export const BAYER8 = [
  [0, 32, 8, 40, 2, 34, 10, 42],
  [48, 16, 56, 24, 50, 18, 58, 26],
  [12, 44, 4, 36, 14, 46, 6, 38],
  [60, 28, 52, 20, 62, 30, 54, 22],
  [3, 35, 11, 43, 1, 33, 9, 41],
  [51, 19, 59, 27, 49, 17, 57, 25],
  [15, 47, 7, 39, 13, 45, 5, 37],
  [63, 31, 55, 23, 61, 29, 53, 21],
];
export const BAYER4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

export function px(ctx, x, y, c) {
  if (c) ctx.fillStyle = c;
  ctx.fillRect(x | 0, y | 0, 1, 1);
}
export function rect(ctx, x, y, w, h, c) {
  if (c) ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}
export function hline(ctx, x0, x1, y, c) {
  if (c) ctx.fillStyle = c;
  const a = Math.min(x0, x1) | 0;
  const b = Math.max(x0, x1) | 0;
  ctx.fillRect(a, y | 0, b - a + 1, 1);
}
export function vline(ctx, x, y0, y1, c) {
  if (c) ctx.fillStyle = c;
  const a = Math.min(y0, y1) | 0;
  const b = Math.max(y0, y1) | 0;
  ctx.fillRect(x | 0, a, 1, b - a + 1);
}
export function line(ctx, x0, y0, x1, y1, c) {
  if (c) ctx.fillStyle = c;
  x0 |= 0; y0 |= 0; x1 |= 0; y1 |= 0;
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    ctx.fillRect(x0, y0, 1, 1);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}

/** Crisp filled ellipse drawn as integer row spans (no AA). */
export function fillEllipse(ctx, cx, cy, rx, ry, c) {
  if (c) ctx.fillStyle = c;
  if (rx <= 0 || ry <= 0) return;
  const y0 = Math.ceil(cy - ry), y1 = Math.floor(cy + ry);
  for (let y = y0; y <= y1; y++) {
    const dy = (y + 0.5 - cy) / ry;
    const s = 1 - dy * dy;
    if (s <= 0) continue;
    const hw = Math.sqrt(s) * rx;
    const xa = Math.round(cx - hw), xb = Math.round(cx + hw);
    if (xb > xa) ctx.fillRect(xa, y, xb - xa, 1);
  }
}
export function strokeEllipse(ctx, cx, cy, rx, ry, c, thick = 1) {
  if (c) ctx.fillStyle = c;
  const steps = Math.max(12, Math.round((rx + ry) * 3));
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    ctx.fillRect(Math.round(cx + Math.cos(a) * rx), Math.round(cy + Math.sin(a) * ry), thick, thick);
  }
}
export function fillCircle(ctx, cx, cy, r, c) {
  fillEllipse(ctx, cx, cy, r, r, c);
}

/** Scanline polygon fill. pts = [[x,y],...] */
export function fillPoly(ctx, pts, c) {
  if (c) ctx.fillStyle = c;
  let minY = Infinity, maxY = -Infinity;
  for (const p of pts) { if (p[1] < minY) minY = p[1]; if (p[1] > maxY) maxY = p[1]; }
  minY = Math.ceil(minY); maxY = Math.floor(maxY);
  const xs = [];
  for (let y = minY; y <= maxY; y++) {
    xs.length = 0;
    const yc = y + 0.5;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i], [xj, yj] = pts[j];
      if ((yi > yc) !== (yj > yc)) xs.push(xi + ((yc - yi) / (yj - yi)) * (xj - xi));
    }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const xa = Math.round(xs[k]), xb = Math.round(xs[k + 1]);
      if (xb > xa) ctx.fillRect(xa, y, xb - xa, 1);
    }
  }
}

/**
 * Vertical gradient with ordered dithering — the signature look of hand made
 * pixel art skies.  `stops` is [[t, colour], ...] with t in 0..1.
 */
export function ditherGradient(ctx, x, y, w, h, stops, bias = 0) {
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
  for (let row = 0; row < h; row++) {
    const t = clamp(h === 1 ? 0 : row / (h - 1), 0, 1);
    let i = 0;
    while (i < stops.length - 2 && t > stops[i + 1][0]) i++;
    const t0 = stops[i][0], t1 = stops[i + 1][0];
    const local = t1 === t0 ? 0 : clamp((t - t0) / (t1 - t0), 0, 1);
    const cA = stops[i][1], cB = stops[i + 1][1];
    const yy = y + row;
    // Hard band with a dithered seam: pixels flip to cB based on threshold.
    for (let col = 0; col < w; col++) {
      const xx = x + col;
      const th = (BAYER8[yy & 7][xx & 7] + 0.5) / 64;
      ctx.fillStyle = local + bias > th ? cB : cA;
      ctx.fillRect(xx, yy, 1, 1);
    }
  }
}

/** Fast flat fill + dithered overlay of a second colour at density d (0..1). */
export function ditherOverlay(ctx, x, y, w, h, color, d, matrix = BAYER8) {
  if (d <= 0) return;
  ctx.fillStyle = color;
  const n = matrix.length;
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) {
      const th = (matrix[yy & (n - 1)][xx & (n - 1)] + 0.5) / (n * n);
      if (d > th) ctx.fillRect(xx, yy, 1, 1);
    }
  }
}

/* ------------------------------------------------------- silhouette "spans"
 *  A span-set stores, for every row, the horizontal runs the shape covers.
 *  Shapes are unioned, dilated (to make outlines) and filled with total
 *  control over every pixel — this is how the pea-dog gets his thick,
 *  sticker-perfect black outline.
 * --------------------------------------------------------------------------*/

export function spansNew(h) {
  const s = new Array(h);
  for (let i = 0; i < h; i++) s[i] = null; // null | [x0,x1] inclusive
  return s;
}
export function spansAddEllipse(spans, cx, cy, rx, ry) {
  const h = spans.length;
  const y0 = Math.max(0, Math.ceil(cy - ry)), y1 = Math.min(h - 1, Math.floor(cy + ry));
  for (let y = y0; y <= y1; y++) {
    const dy = (y + 0.5 - cy) / ry;
    const s = 1 - dy * dy;
    if (s <= 0) continue;
    const hw = Math.sqrt(s) * rx;
    const a = Math.round(cx - hw), b = Math.round(cx + hw) - 1;
    if (b < a) continue;
    const cur = spans[y];
    spans[y] = cur ? [Math.min(cur[0], a), Math.max(cur[1], b)] : [a, b];
  }
  return spans;
}
export function spansUnion(a, b) {
  const out = spansNew(a.length);
  for (let y = 0; y < a.length; y++) {
    const p = a[y], q = b[y];
    if (p && q) out[y] = [Math.min(p[0], q[0]), Math.max(p[1], q[1])];
    else out[y] = p ? [p[0], p[1]] : q ? [q[0], q[1]] : null;
  }
  return out;
}
export function spansDilate(spans, r) {
  const h = spans.length;
  const out = spansNew(h);
  for (let y = 0; y < h; y++) {
    let a = Infinity, b = -Infinity;
    for (let k = -r; k <= r; k++) {
      const yy = y + k;
      if (yy < 0 || yy >= h) continue;
      const s = spans[yy];
      if (!s) continue;
      // circular structuring element keeps corners round
      const w = Math.round(Math.sqrt(Math.max(0, r * r - k * k)));
      a = Math.min(a, s[0] - w);
      b = Math.max(b, s[1] + w);
    }
    if (a <= b) out[y] = [a, b];
  }
  return out;
}
export function spansFill(ctx, spans, ox, oy, color, clipTo = null) {
  ctx.fillStyle = color;
  for (let y = 0; y < spans.length; y++) {
    const s = spans[y];
    if (!s) continue;
    let a = s[0], b = s[1];
    if (clipTo) {
      const c = clipTo[y];
      if (!c) continue;
      a = Math.max(a, c[0]); b = Math.min(b, c[1]);
      if (b < a) continue;
    }
    ctx.fillRect(ox + a, oy + y, b - a + 1, 1);
  }
}
/** Fill only rows y0..y1 of a span set — used for belly shading. */
export function spansFillRows(ctx, spans, ox, oy, color, y0, y1, inset = 0) {
  ctx.fillStyle = color;
  for (let y = Math.max(0, y0); y <= Math.min(spans.length - 1, y1); y++) {
    const s = spans[y];
    if (!s) continue;
    const a = s[0] + inset, b = s[1] - inset;
    if (b < a) continue;
    ctx.fillRect(ox + a, oy + y, b - a + 1, 1);
  }
}
export function spansBBox(spans) {
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (let y = 0; y < spans.length; y++) {
    const s = spans[y];
    if (!s) continue;
    if (s[0] < x0) x0 = s[0];
    if (s[1] > x1) x1 = s[1];
    if (y < y0) y0 = y;
    if (y > y1) y1 = y;
  }
  return { x0, x1, y0, y1 };
}
