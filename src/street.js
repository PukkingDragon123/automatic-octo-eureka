/* ============================================================================
 *  street.js — the soi outside the school gate.
 *
 *  A provincial town street at the end of the afternoon: a row of two- and
 *  three-storey shophouses, each painted a different tired pastel, roller
 *  shutters half up, canvas awnings, hand-lettered signs, balconies with
 *  plants and washing and an air-conditioner dripping, concrete poles with
 *  more cable on them than anyone can explain, motorbikes nosed in along the
 *  kerb, a samlor, a red songthaew waiting to fill.
 * ==========================================================================*/

import { shade, rng, mix } from './core.js';
import { W, H } from './vista.js';
import { makeLayer, box, texture, plaster, concrete, block, ell, hash, mul } from './pixart.js';
import { drawText } from './font.js';

export const STREET_W = 960;
export const WALK_Y = 252;
const FRONT = 214;          // where the shopfronts meet the pavement
const KERB = 258;

let bg = null;

/** Where things glow, for the light rig. */
export const STREET_LIGHTS = { lamps: [], windows: [], shops: [] };

const PALETTE = ['#e8d8b8', '#d8e4d0', '#ecc8b8', '#f0e0a8', '#d4dce4', '#e4d0c0', '#c8d8c8'];

function bake() {
  const L = makeLayer(STREET_W, H);
  const g = L.g;
  const r = rng(2025);
  // the sky, hazy and warm near the rooftops
  texture(g, 0, 0, STREET_W, 150, (x, y) => {
    const k = y / 150;
    const c = [lerp3(150, 238, k), lerp3(186, 214, k), lerp3(218, 188, k)];
    return mul(c, 0.985 + hash(x >> 1, y >> 1, 3) * 0.03);
  });
  // far buildings, pale with distance
  for (let x = 0; x < STREET_W; x += 34) {
    const h = 30 + Math.floor(hash(x, 1, 9) * 40);
    box(g, x, 150 - h, 32, h, mix('#b8c0c8', '#d8d0c4', hash(x, 2, 9)));
    for (let wy = 150 - h + 6; wy < 146; wy += 8) for (let wx = x + 4; wx < x + 30; wx += 7) box(g, wx, wy, 3, 4, '#a8b0bc');
  }
  // the shophouse row
  let x = -10;
  let i = 0;
  while (x < STREET_W + 10) {
    const w = 64 + (i % 3) * 12;
    shophouse(g, x, w, i, r);
    x += w;
    i++;
  }
  // pavement slabs, the red-and-white kerb, the road
  concrete(g, 0, FRONT, STREET_W, KERB - FRONT, '#b8b0a0', { lines: 22, seed: 5 });
  for (let yy = FRONT + 11; yy < KERB; yy += 11) box(g, 0, yy, STREET_W, 1, '#9a9282');
  for (let kx = 0; kx < STREET_W; kx += 14) {
    box(g, kx, KERB, 7, 4, '#c83a32'); box(g, kx + 7, KERB, 7, 4, '#f0ece4');
    box(g, kx, KERB, 14, 1, 'rgba(255,255,255,0.25)');
  }
  box(g, 0, KERB + 4, STREET_W, 1, '#3a3834');
  texture(g, 0, KERB + 5, STREET_W, H - KERB - 5, (px, py) => {
    const k = 0.9 + hash(px >> 1, py, 7) * 0.12 + ((px * 13 + py * 7) % 29 === 0 ? 0.2 : 0);
    return mul([92, 92, 98], k);
  });
  for (let lx = 10; lx < STREET_W; lx += 48) box(g, lx, 282, 22, 2, '#d8d0b0');
  // the school's wall and gate at the far left
  schoolGate(g, 90);
  // concrete poles with too much on them
  for (let px = 60; px < STREET_W; px += 150) {
    block(g, px - 2, 40, 5, FRONT + 20 - 40, '#b8b4ac');
    block(g, px - 10, 52, 21, 3, '#8a8680');
    block(g, px - 8, 62, 17, 2, '#8a8680');
    block(g, px + 3, 90, 7, 10, '#7a7a80');               // a transformer
    block(g, px - 4, 70, 3, 2, '#5a5a60');
    STREET_LIGHTS.lamps.push({ x: px - 6, y: 70 });
    // the lamp arm
    box(g, px - 8, 68, 8, 1, '#6a6a70'); block(g, px - 10, 69, 5, 2, '#f4ecc8');
  }
  // the cables, sagging from pole to pole in bundles
  for (let px = 60; px < STREET_W - 150; px += 150) {
    for (let k = 0; k < 7; k++) {
      const y0 = 52 + (k % 3) * 5 + Math.floor(k / 3) * 2;
      const sag = 8 + (k % 4) * 3;
      g.fillStyle = k % 2 ? '#2a2a30' : '#3a3a40';
      for (let d = 0; d <= 150; d++) g.fillRect(px + d, Math.round(y0 + Math.sin(d / 150 * Math.PI) * sag), 1, 1);
    }
  }
  bg = L;
}
function lerp3(a, b, k) { return a + (b - a) * k; }

function shophouse(g, x, w, i, r) {
  const storeys = 2 + (i % 4 === 1 ? 1 : 0);
  const top = FRONT - storeys * 50 - 12;
  const col = PALETTE[i % PALETTE.length];
  plaster(g, x, top, w, FRONT - top, col, { grime: 1.2, seed: 30 + i });
  // a stepped parapet along the top, with the year it was built on it
  block(g, x, top - 4, w, 5, shade(col, -0.08));
  box(g, x + w / 2 - 8, top - 8, 16, 5, shade(col, -0.1));
  box(g, x, top, 1, FRONT - top, shade(col, -0.4));
  box(g, x + w - 1, top, 1, FRONT - top, shade(col, -0.25));
  // upper floors: windows with grilles, a balcony, plants, washing, an air-con
  for (let s = 0; s < storeys - 1; s++) {
    const fy = top + 8 + s * 50;
    for (let k = 0; k < 2; k++) {
      const wx = x + 8 + k * Math.floor(w / 2);
      const ww = Math.floor(w / 2) - 16;
      block(g, wx, fy, ww, 26, '#5a6a74');
      box(g, wx + 1, fy + 1, ww - 2, 24, '#8fa8b4');
      box(g, wx + 1, fy + 1, ww - 2, 10, '#a8c0cc');
      STREET_LIGHTS.windows.push({ x: wx + ww / 2, y: fy + 13 });
      for (let gx = wx + 3; gx < wx + ww; gx += 4) box(g, gx, fy, 1, 26, '#4a4a50');
      box(g, wx, fy + 13, ww, 1, '#4a4a50');
    }
    // the balcony rail and whatever is on it
    block(g, x + 4, fy + 30, w - 8, 3, shade(col, -0.2));
    for (let bx = x + 6; bx < x + w - 6; bx += 5) box(g, bx, fy + 33, 1, 8, shade(col, -0.35));
    box(g, x + 4, fy + 41, w - 8, 2, shade(col, -0.3));
    if (r.chance(0.6)) for (let k = 0; k < 3; k++) {
      const px = x + 10 + k * 14;
      block(g, px, fy + 36, 7, 5, '#b06a4a');
      for (let l = 0; l < 4; l++) box(g, px + l * 2, fy + 30 - (l % 2) * 3, 2, 6, l % 2 ? '#4e8a3c' : '#6aa84a');
    }
    if (r.chance(0.45)) {
      box(g, x + 8, fy + 28, w - 16, 1, '#6a6a6a');
      for (let k = 0; k < 4; k++) block(g, x + 12 + k * 11, fy + 29, 6, 7 + (k % 2) * 3, ['#e85a5a', '#f4f0e4', '#5a8ad8', '#f2c23c'][k]);
    }
    if (r.chance(0.5)) {
      block(g, x + w - 22, fy + 18, 14, 9, '#e8e8e4');
      for (let k = 0; k < 4; k++) box(g, x + w - 20 + k * 3, fy + 20, 1, 5, '#a8a8a4');
    }
  }
  // the awning over the shopfront, in faded stripes
  const aw = ['#3f7ea8', '#c25a4a', '#4e9a5c', '#d8a03c', '#8a6ad8'][i % 5];
  const ay = FRONT - 44;
  for (let k = 0; k < 10; k++) {
    const yy = ay + k;
    const inset = Math.floor(k * 0.4);
    for (let sx = x - 2 - inset; sx < x + w + 2 + inset; sx++) {
      const stripe = Math.floor((sx - x) / 6) % 2;
      box(g, sx, yy, 1, 1, stripe ? aw : shade(aw, 0.35));
    }
  }
  box(g, x - 6, ay + 10, w + 12, 2, shade(aw, -0.4));
  for (let sx = x - 6; sx < x + w + 6; sx += 4) box(g, sx, ay + 12, 2, 2, shade(aw, -0.2));
  // the sign above it, hand-lettered
  const names = ['ร้านค้า', 'ซ่อมรถ', 'ก๋วยเตี๋ยว', 'ร้านยา', 'เสริมสวย', 'โชห่วย', 'ข้าวมันไก่', 'ตัดผม'];
  const sc = ['#f4ecd0', '#fbf8f0', '#f2d8a0', '#e8f0e8'][i % 4];
  block(g, x + 6, ay - 14, w - 12, 11, sc);
  drawText(g, names[i % names.length], x + 10, ay - 12, ['#b83a32', '#2a4a8a', '#2a6a3a', '#5a3a1a'][i % 4]);
  // the shopfront: shutter half up, the dim inside, goods out front
  const sy = FRONT - 30;
  box(g, x + 4, sy, w - 8, 30, '#3a3430');
  box(g, x + 6, sy + 12, w - 12, 18, '#5a4a3a');
  STREET_LIGHTS.shops.push({ x: x + w / 2, y: sy + 16 });
  for (let k = 0; k < 5; k++) block(g, x + 8 + k * 11, sy + 20, 8, 10, ['#e8a03c', '#c25a4a', '#f2ecdc', '#6ea04a', '#3f7ea8'][(k + i) % 5]);
  for (let yy = sy; yy < sy + 11; yy += 2) box(g, x + 4, yy, w - 8, 1, '#a8a8ac');   // the shutter, rolled halfway
  box(g, x + 4, sy + 11, w - 8, 1, '#6a6a70');
  // something on the pavement in front of each: crates, pots, a bench
  if (i % 3 === 0) { block(g, x + 8, FRONT + 4, 12, 8, '#3f6ea8'); block(g, x + 10, FRONT - 2, 8, 6, '#3f6ea8'); }
  if (i % 3 === 1) { block(g, x + w - 16, FRONT + 6, 9, 7, '#b06a4a'); for (let l = 0; l < 4; l++) box(g, x + w - 15 + l * 2, FRONT - 2 - l % 2 * 3, 2, 8, '#4e8a3c'); }
  if (i % 3 === 2) { block(g, x + 10, FRONT + 8, 24, 3, '#8a5a3a'); box(g, x + 12, FRONT + 11, 2, 5, '#5a3a22'); box(g, x + 30, FRONT + 11, 2, 5, '#5a3a22'); }
}

function schoolGate(g, x) {
  plaster(g, x - 150, 120, 138, FRONT + 6 - 120, '#e8e0c8', { grime: 1, seed: 77 });
  block(g, x - 150, 118, 138, 4, '#c8bfa4');
  for (let k = 0; k < 10; k++) block(g, x - 146 + k * 14, 130, 2, 80, '#6a7a84');
  box(g, x - 150, 128, 138, 2, '#6a7a84');
  block(g, x - 12, 84, 16, FRONT + 6 - 84, '#ddd4b8');
  block(g, x - 14, 80, 20, 5, '#c0b394');
  block(g, x - 10, 96, 12, 40, '#a51931');
  for (let k = 0; k < 5; k++) box(g, x - 7, 100 + k * 7, 6, 2, '#f4e8c0');
  // a tree inside the school wall
  ell(g, x - 50, 104, 26, 18, '#3f6a32'); ell(g, x - 56, 100, 18, 12, '#4e7c3c'); ell(g, x - 44, 96, 12, 8, '#5c8a44');
  block(g, x - 52, 116, 4, 14, '#6a4a32');
}

/* --------------------------------------------------------------- dynamic */

const riders = [];
for (let i = 0; i < 4; i++) riders.push({ x: i * 280, v: (i % 2 ? -1 : 1) * (40 + i * 9), y: 286 + (i % 2) * 6, c: ['#c25a4a', '#3f6ea8', '#2a2a30', '#e8a03c'][i] });

export function drawStreet(ctx, cam, t) {
  if (!bg) bake();
  ctx.drawImage(bg.c, -Math.round(cam), 0);
}

function motorbike(ctx, x, y, col, rider, t, f = 1) {
  const bx = Math.round(x);
  box(ctx, bx - 12, y - 10, 24, 5, '#1e1e24');
  block(ctx, bx - 8, y - 14, 14, 5, col);
  box(ctx, bx + f * 8, y - 18, 2, 8, '#5a5a64');
  block(ctx, bx + f * 9 - 2, y - 20, 5, 2, '#d8d8d8');
  for (const wx of [bx - 10, bx + 10]) { ell(ctx, wx, y - 3, 5, 5, '#141418'); ell(ctx, wx, y - 3, 2, 2, '#8a8a92'); }
  if (rider) {
    block(ctx, bx - 4, y - 26, 8, 12, rider);
    block(ctx, bx - 3, y - 34, 7, 8, '#e8c09a');
    block(ctx, bx - 4, y - 36, 9, 5, '#2a2a30');              // a helmet
    box(ctx, bx + f * 3, y - 22, f * 6, 2, '#e8c09a');
  }
}

function songthaew(ctx, x, y) {
  block(ctx, x - 36, y - 36, 70, 28, '#b23a30');
  box(ctx, x - 36, y - 36, 70, 3, '#d4564a');
  for (let k = 0; k < 6; k++) box(ctx, x - 32 + k * 12, y - 32, 2, 22, '#8f2b24');
  block(ctx, x + 24, y - 44, 22, 36, '#b23a30');
  block(ctx, x + 28, y - 40, 14, 12, '#9fc4d8');
  box(ctx, x + 28, y - 40, 14, 4, '#c8e0ec');
  block(ctx, x - 36, y - 48, 68, 4, '#d8d0b8');
  box(ctx, x - 38, y - 10, 86, 4, '#3a2a28');
  for (const wx of [x - 22, x + 30]) { ell(ctx, wx, y - 4, 7, 7, '#141418'); ell(ctx, wx, y - 4, 3, 3, '#8a8a92'); }
}

function cart(ctx, x, y, t) {
  block(ctx, x - 24, y - 26, 48, 18, '#c4b48c');
  block(ctx, x - 26, y - 46, 52, 4, '#d8a03c');
  box(ctx, x - 1, y - 42, 2, 16, '#8a8072');
  for (const wx of [x - 16, x + 16]) { ell(ctx, wx, y - 5, 5, 5, '#2a2a2e'); ell(ctx, wx, y - 5, 2, 2, '#8a8a92'); }
  block(ctx, x + 4, y - 32, 16, 6, '#3a3a40');
  for (let k = 0; k < 4; k++) box(ctx, x + 6 + k * 4, y - 34, 3, 2, (t * 3 + k) % 2 < 1 ? '#a85c2c' : '#c27a3c');
  block(ctx, x - 18, y - 33, 12, 7, '#6f8f58');
  ctx.globalAlpha = 0.3;
  for (let k = 0; k < 5; k++) box(ctx, x + 10 + Math.sin(t * 2 + k) * 3, y - 40 - ((t * 10 + k * 5) % 22), 3, 3, '#ffffff');
  ctx.globalAlpha = 1;
}

/** In front of the pavement: the parked bikes, the truck, the passing traffic. */
export function drawStreetFg(ctx, cam, t) {
  const v = (wx) => wx - cam;
  // the cart on the pavement, with its smoke
  const cx = v(640);
  if (cx > -60 && cx < W + 60) cart(ctx, cx, WALK_Y + 2, t);
  // bikes nosed in along the kerb
  for (const [wx, c] of [[200, '#c25a4a'], [228, '#2a2a30'], [470, '#3f6ea8'], [498, '#e8e4dc'], [720, '#6a8a4a']]) {
    const x = v(wx);
    if (x > -30 && x < W + 30) motorbike(ctx, x, KERB + 16, c, null, t);
  }
  // the songthaew, waiting
  const sx = v(330);
  if (sx > -80 && sx < W + 80) songthaew(ctx, sx, 292);
  // and the traffic going past
  for (const rd of riders) {
    const x = ((rd.x + rd.v * t) % (STREET_W + 200) + STREET_W + 200) % (STREET_W + 200) - 100;
    const px = v(x);
    if (px > -40 && px < W + 40) motorbike(ctx, px, rd.y + 10, rd.c, ['#3f6ea8', '#f2ecdc', '#c25a4a', '#4e8a3c'][Math.abs(rd.v) % 4], t, rd.v > 0 ? 1 : -1);
  }
}
