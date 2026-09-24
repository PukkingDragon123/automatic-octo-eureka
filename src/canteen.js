/* ============================================================================
 *  canteen.js — the school canteen at twelve o'clock.
 *
 *  A big open shed: corrugated roof on red-oxide steel trusses, a band of
 *  patterned breeze blocks under it with the noon sky coming through, white
 *  glazed tiles with a blue stripe, a stainless wash trough with a row of taps.
 *  Five stalls along the back, each with its striped awning, its board, its
 *  menu, shelves of jars behind the cook, and a steel counter with the food
 *  under glass.  Long tables and round stools in front, where everyone sits.
 * ==========================================================================*/

import { shade, rng, mix } from './core.js';
import { W, H } from './vista.js';
import { makeLayer, box, texture, plaster, concrete, block, blob, ell, hash, mul } from './pixart.js';
import { drawText, textWidth } from './font.js';
import { SHOPS, drawFood, drawLogo, drawFan, bannerLabel, GROUND } from './school.js';
import { drawHuman, poseOf } from './human.js';

export const CANTEEN_W = 1480;
const WALL_BASE = 216;
const COUNTER = GROUND - 34;     // the top of the counters
export const SEAT_Y = 286;       // where people sit at the long tables
export const TABLES = [];
for (let x = 140; x < CANTEEN_W; x += 150) TABLES.push(x);
/** Every stool behind a table, where someone can sit facing you. */
export const CANTEEN_SEATS = [];
for (const tx of TABLES) for (let i = 0; i < 4; i++) CANTEEN_SEATS.push({ x: tx - 45 + i * 30, y: SEAT_Y });
export const CANTEEN_LAMPS = [270, 520, 770, 1020, 1270];
export const CANTEEN_GAPS = [275, 525, 775, 1025];

let bg = null, counters = null, fg = null;

/* ------------------------------------------------------------------ bake */

function bake() {
  const L = makeLayer(CANTEEN_W, H);
  const g = L.g;
  const r = rng(1212);
  // corrugated roof sheets from underneath: ridges running away from you
  texture(g, 0, 0, CANTEEN_W, 36, (px, py) => {
    const ridge = [1.12, 1.04, 0.94, 0.82, 0.9, 1.02][px % 6];
    let k = ridge * (0.72 + py / 36 * 0.3);
    if (px % 92 === 0) k *= 0.6;
    const rust = hash(Math.floor(px / 3), Math.floor(py / 4), 81);
    const c = rust > 0.94 ? [150, 104, 70] : [160, 158, 150];
    return mul(c, k * (0.97 + hash(px, py, 82) * 0.05));
  });
  // the trusses, in red oxide
  const tr = '#8a3a2a';
  const tline = (x0, y0, x1, y1) => {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let i = 0; i <= n; i++) {
      const x = Math.round(x0 + (x1 - x0) * i / n), y = Math.round(y0 + (y1 - y0) * i / n);
      box(g, x - 1, y - 1, 3, 3, '#3a1a12');
    }
    for (let i = 0; i <= n; i++) {
      const x = Math.round(x0 + (x1 - x0) * i / n), y = Math.round(y0 + (y1 - y0) * i / n);
      box(g, x, y, 1, 1, tr);
    }
  };
  for (let x = 0; x < CANTEEN_W; x += 40) { tline(x, 6, x + 20, 30); tline(x + 20, 30, x + 40, 6); }
  block(g, 0, 29, CANTEEN_W, 3, tr);
  block(g, 0, 4, CANTEEN_W, 2, shade(tr, -0.1));
  // a beam, then the breeze blocks with the sky behind them
  block(g, 0, 34, CANTEEN_W, 5, '#d8d0b8');
  for (let x = 0; x < CANTEEN_W; x += 16) {
    for (let row = 0; row < 3; row++) breeze(g, x, 40 + row * 16);
  }
  block(g, 0, 88, CANTEEN_W, 4, '#d0c6aa');
  // glazed tiles, white with a blue band
  texture(g, 0, 92, CANTEEN_W, WALL_BASE - 92, (px, py) => {
    const tx = Math.floor(px / 9), ty = Math.floor((py - 92) / 9);
    const ix = px % 9, iy = (py - 92) % 9;
    if (ix === 0 || iy === 0) return [196, 192, 180];
    const blue = ty === 7 || ty >= 11;
    let c = blue ? [70, 120, 176] : [238, 236, 228];
    let k = 0.96 + hash(tx, ty, 83) * 0.06;
    if (ix === 1 || iy === 1) k *= 1.05;
    if (ix === 8 || iy === 8) k *= 0.93;
    if (ix === 2 && iy === 2) k *= 1.1;               // the glaze catching the light
    k *= 1 - Math.max(0, (py - 170) / 46) * 0.12;
    return mul(c, k);
  });
  block(g, 0, WALL_BASE - 3, CANTEEN_W, 3, '#3a5a86');
  // the floor
  concrete(g, 0, WALL_BASE, CANTEEN_W, H - WALL_BASE, '#b4ac98', { seed: 84 });
  for (let y = WALL_BASE + 16; y < H; y += 20 + (y - WALL_BASE) / 3) box(g, 0, Math.round(y), CANTEEN_W, 1, '#9a927e');
  for (let x = 0; x < CANTEEN_W; x += 60) box(g, x, WALL_BASE, 1, H - WALL_BASE, '#a29a86');
  // the drain along the counters, a steel grate
  box(g, 0, GROUND + 2, CANTEEN_W, 4, '#6a6660');
  for (let x = 0; x < CANTEEN_W; x += 3) box(g, x, GROUND + 2, 1, 4, '#9a968e');
  g.globalAlpha = 0.2;
  box(g, 0, WALL_BASE, CANTEEN_W, 6, '#2a2620');
  g.globalAlpha = 1;

  // between the stalls: wash troughs, a water tank, the notice wall
  gapThing(g, 275, 'trough', r);
  gapThing(g, 525, 'water', r);
  gapThing(g, 775, 'trough', r);
  gapThing(g, 1025, 'notice', r);
  // the stalls themselves
  SHOPS.forEach((s, i) => stall(g, s, i));
  // the coupon window at the far end, and the bins
  const cw = 1330;
  block(g, cw - 36, 120, 72, 70, '#8a8272');
  block(g, cw - 32, 124, 64, 44, '#4a5460');
  box(g, cw - 32, 124, 64, 10, '#6a7480');
  block(g, cw - 24, 170, 48, 12, '#e8e0cc');
  block(g, cw - 38, COUNTER, 76, GROUND - COUNTER, '#a49c86');
  box(g, cw - 37, COUNTER, 74, 2, '#c8c0a8');
  for (const [bx, c] of [[1400, '#3a8a4a'], [1418, '#e8b83c'], [1436, '#3a6ac8']]) {
    block(g, bx - 7, GROUND - 22, 14, 21, c);
    box(g, bx - 6, GROUND - 21, 3, 19, shade(c, 0.18));
    block(g, bx - 8, GROUND - 25, 16, 3, shade(c, -0.15));
  }
  // round stools behind every table, where people will sit
  for (const s of CANTEEN_SEATS) stool(g, s.x, s.y);
  bg = L;
}

function breeze(g, x, y) {
  box(g, x, y, 16, 16, '#b8ae94');
  box(g, x + 1, y + 1, 14, 14, '#e2d8c0');
  box(g, x + 1, y + 1, 14, 1, '#f2eadc');
  // four petals open to the sky
  const sky = '#b8dcf0', skyHi = '#e4f4fc';
  for (const [dx, dy] of [[3, 3], [9, 3], [3, 9], [9, 9]]) {
    box(g, x + dx, y + dy, 4, 4, sky);
    box(g, x + dx, y + dy, 2, 1, skyHi);
  }
  box(g, x + 7, y + 7, 2, 2, '#cfc4a8');
  box(g, x + 1, y + 15, 15, 1, '#a89e84');
}

function stool(g, x, y) {
  const top = y - 12;
  box(g, x - 1, top + 2, 3, y - top - 2, '#4a4e54');
  box(g, x, top + 2, 1, y - top - 2, '#8a9098');
  block(g, x - 5, y - 2, 11, 2, '#5a5e64');
  // the seat: a red disc seen nearly edge-on
  ell(g, x + 0.5, top + 1, 7, 2.6, '#6a2420');
  ell(g, x + 0.5, top + 0.5, 6, 2, '#c8403a');
  box(g, x - 3, top, 3, 1, '#e8665a');
}

function gapThing(g, x, kind, r) {
  if (kind === 'trough') {
    // a mirror strip, a row of taps, a long steel trough
    block(g, x - 44, 132, 88, 22, '#9ab0bc');
    texture(g, x - 43, 133, 86, 20, (px, py) => mul([176, 200, 212], 0.9 + ((px + py * 2) % 23 < 3 ? 0.2 : 0) + hash(px, py, 85) * 0.05));
    for (let k = 0; k < 5; k++) {
      const tx = x - 36 + k * 18;
      block(g, tx, 164, 3, 6, '#b8c0c8');
      box(g, tx - 2, 164, 7, 2, '#d8e0e8');
      box(g, tx + 1, 170, 1, 3, '#8a9098');
    }
    block(g, x - 46, 176, 92, 12, '#b8c0c8');
    texture(g, x - 45, 177, 90, 10, (px, py) => mul([190, 198, 206], 0.84 + (py - 177) * 0.03 + hash(px, py >> 2, 86) * 0.08));
    box(g, x - 45, 177, 90, 2, '#e8eef2');
    for (const lx of [x - 40, x + 36]) block(g, lx, 189, 3, WALL_BASE - 189, '#8a9098');
    // soap in a net bag, and a sign
    block(g, x + 30, 160, 5, 7, '#f0a8c8');
    block(g, x - 20, 106, 40, 14, '#f8f4ea');
    box(g, x - 18, 109, 12, 2, '#3a8ae8'); box(g, x - 18, 113, 22, 1, '#8a8274'); box(g, x - 18, 116, 18, 1, '#8a8274');
    ell(g, x + 12, 113, 4, 4, '#3a8ae8');
  } else if (kind === 'water') {
    block(g, x - 14, 150, 28, 52, '#c8ced4');
    texture(g, x - 13, 151, 26, 50, (px, py) => mul([196, 204, 212], 0.86 + Math.pow(Math.sin(((px - x + 13) / 26) * Math.PI), 0.5) * 0.24 + hash(px, py, 87) * 0.04));
    block(g, x - 15, 146, 30, 4, '#aab2ba');
    for (const tx of [x - 8, x + 5]) { block(g, tx, 184, 3, 3, '#3a3a40'); box(g, tx + 1, 187, 1, 2, '#3a3a40'); }
    block(g, x - 12, 194, 24, 4, '#8a9098');
    for (let l = 0; l < 3; l++) for (let k = 0; k < 4; k++) block(g, x + 20 + k * 5, 150 + l * 10, 3, 6, ['#e84a8a', '#3a8ae8', '#f2c23c', '#6ec84a'][(k + l) % 4]);
    block(g, x + 18, 180, 22, 2, '#8a5a34');
    // the clock above
    ell(g, x, 116, 11, 11, '#3a2a1a'); ell(g, x, 116, 10, 10, '#f4f0e4'); ell(g, x, 116, 9, 9, '#fbf8ee');
    for (let i = 0; i < 12; i++) box(g, x + Math.cos(i / 6 * Math.PI) * 7, 116 + Math.sin(i / 6 * Math.PI) * 7, 1, 1, '#5a5048');
  } else {
    // a notice wall: the menu of the week, a poster about washing your hands
    block(g, x - 46, 104, 92, 70, '#3a5a86');
    box(g, x - 44, 106, 88, 66, '#2a4a76');
    block(g, x - 40, 110, 38, 56, '#f8f4ea');
    box(g, x - 40, 110, 38, 8, '#e8a03c');
    for (let k = 0; k < 7; k++) { box(g, x - 37, 122 + k * 6, 14, 1, '#5a5048'); box(g, x - 19, 122 + k * 6, 12, 1, '#a89e8c'); }
    block(g, x + 4, 110, 36, 26, '#e8f4fc');
    ell(g, x + 14, 123, 6, 6, '#f2c8a0'); ell(g, x + 28, 121, 5, 4, '#9ad0f0');
    for (let k = 0; k < 4; k++) box(g, x + 22 + k * 3, 126, 2, 1, '#6ab0e0');
    block(g, x + 4, 140, 36, 26, '#fdf0c8');
    drawLogo(g, x + 22, 144, 1, true);
  }
}

function stall(g, s, i) {
  const x = s.x, col = s.col;
  const L = x - 66, R = x + 66;
  // the back of the stall: stainless sheet, brushed
  texture(g, L + 2, 128, R - L - 4, COUNTER - 128, (px, py) => {
    const k = 0.78 + hash(px, Math.floor(py / 7), 90 + i) * 0.1 + hash(px, py, 91) * 0.05 + (py - 128) / (COUNTER - 128) * -0.1;
    return mul([184, 190, 196], k);
  });
  // shelves behind the cook, on the right: jars, bottles, a stack of bowls
  for (const sy of [156, 182]) {
    block(g, x + 2, sy, 60, 2, '#8a9098');
    for (let k = 0; k < 7; k++) {
      const jx = x + 6 + k * 8;
      const kind = (k + i + sy) % 4;
      if (kind === 0) { block(g, jx, sy - 10, 5, 10, '#e8d8a8'); box(g, jx, sy - 11, 5, 2, '#c83a32'); }
      else if (kind === 1) { block(g, jx + 1, sy - 13, 3, 13, '#6a3a1a'); box(g, jx + 1, sy - 8, 3, 4, '#f2e8c8'); box(g, jx + 2, sy - 15, 1, 2, '#e8c84a'); }
      else if (kind === 2) { for (let l = 0; l < 4; l++) block(g, jx - 1, sy - 3 - l * 3, 7, 2, '#f4f2ec'); }
      else { block(g, jx, sy - 8, 6, 8, '#d8743c'); box(g, jx + 1, sy - 6, 4, 2, '#f2d0a0'); }
    }
  }
  // utensils hanging on a rail
  box(g, x + 4, 134, 56, 1, '#6a6e74');
  for (let k = 0; k < 5; k++) {
    const ux = x + 10 + k * 11;
    box(g, ux, 135, 1, 10, '#8a9098');
    if (k % 2) ell(g, ux + 0.5, 146, 3, 2, '#9aa2a8'); else block(g, ux - 2, 145, 5, 3, '#9aa2a8');
  }
  // the menu, on the left, with the dishes painted on it
  block(g, L + 6, 150, 56, 58, '#fbf8ee');
  box(g, L + 6, 150, 56, 7, col);
  box(g, L + 6, 157, 56, 1, shade(col, -0.3));
  s.menu.forEach((m, k) => {
    const my = 166 + k * 11;
    drawFood(g, L + 16, my + 3, m.key, 0.55);
    box(g, L + 25, my, 18, 1, '#5a5048');
    box(g, L + 25, my + 3, 12, 1, '#a89e8c');
    drawText(g, String(m.price), L + 47, my - 2, '#b83a32');
  });
  // posts either side
  for (const px of [L - 2, R - 2]) {
    block(g, px, 96, 4, GROUND - 96, '#d8dee2');
    box(g, px, 96, 1, GROUND - 96, '#f4f8fa');
  }
  // the awning: striped canvas, lit from above, with a scalloped hem
  for (let y = 98; y < 122; y++) {
    const k = (y - 98) / 24;
    for (let sx = L - 4 - Math.floor(k * 3); sx < R + 4 + Math.floor(k * 3); sx++) {
      const stripe = Math.floor((sx - L) / 9) % 2 === 0;
      let c = stripe ? col : '#f6f0e2';
      c = shade(c, 0.1 - k * 0.22);
      box(g, sx, y, 1, 1, c);
    }
  }
  box(g, L - 8, 97, R - L + 16, 1, shade(col, -0.5));
  for (let sx = L - 7; sx < R + 7; sx += 9) {
    const stripe = Math.floor((sx - L + 7) / 9) % 2 === 0;
    const c = stripe ? shade(col, -0.12) : '#e2dcca';
    ell(g, sx + 4.5, 122, 4.6, 4, shade(col, -0.5));
    ell(g, sx + 4.5, 122, 4, 3.4, c);
  }
  // the name board under it (the name itself is drawn live, so it stays sharp)
  block(g, L + 4, 128, R - L - 8, 16, shade(col, -0.22));
  box(g, L + 4, 128, R - L - 8, 1, shade(col, 0));
  box(g, L + 6, 130, R - L - 12, 12, shade(col, -0.3));
}

function bakeCounters() {
  const L = makeLayer(CANTEEN_W, H);
  const g = L.g;
  const r = rng(77);
  SHOPS.forEach((s, i) => {
    const x = s.x;
    const L0 = x - 64, w = 128;
    // the glass case of trays on top
    block(g, L0 + 2, COUNTER - 12, w - 4, 12, '#b8c4c8');
    box(g, L0 + 3, COUNTER - 11, w - 6, 10, '#dce8ec');
    for (let k = 0; k < 4; k++) {
      const tx = L0 + 8 + k * 30;
      block(g, tx, COUNTER - 6, 24, 5, '#9aa2a8');
      box(g, tx + 1, COUNTER - 5, 22, 3, ['#a8562e', '#e8d8a8', '#6ea04a', '#c28a3a'][(k + i) % 4]);
      drawFood(g, tx + 12, COUNTER - 3, s.menu[k % s.menu.length].key, 0.55);
    }
    // the glass itself: a pale sheen and a highlight streak
    g.globalAlpha = 0.35;
    box(g, L0 + 3, COUNTER - 11, w - 6, 10, '#ffffff');
    g.globalAlpha = 1;
    for (let k = 0; k < 10; k++) box(g, L0 + 10 + k * 12, COUNTER - 11, 2, 1, '#ffffff');
    // the steel counter
    block(g, L0, COUNTER, w, GROUND - COUNTER, '#b8c0c6');
    texture(g, L0, COUNTER + 1, w, GROUND - COUNTER - 1, (px, py) => mul([190, 198, 204], 0.82 + hash(px, Math.floor(py / 9), 92 + i) * 0.1 + hash(px, py, 93) * 0.04 - (py - COUNTER) * 0.004));
    box(g, L0, COUNTER, w, 2, '#eef2f4');
    box(g, L0, COUNTER + 9, w, 4, s.col);                 // the stall's colour stripe
    box(g, L0, COUNTER + 9, w, 1, shade(s.col, 0.25));
    box(g, L0, COUNTER + 13, w, 1, shade(s.col, -0.4));
    box(g, L0, GROUND - 4, w, 4, '#6a7076');
    // a tray rack at one end, cutlery in a cup
    block(g, L0 + 4, COUNTER - 20, 7, 8, '#dfe4e8');
    for (let k = 0; k < 3; k++) box(g, L0 + 5 + k * 2, COUNTER - 24, 1, 5, '#b8c0c8');
  });
  void r;
  return L;
}

function bakeFg() {
  const L = makeLayer(CANTEEN_W, H);
  const g = L.g;
  const r = rng(303);
  for (const tx of TABLES) {
    const top = SEAT_Y - 26;
    const x0 = tx - 64, w = 128;
    // legs
    for (const lx of [x0 + 6, x0 + w - 10]) { box(g, lx - 1, top + 7, 5, H - top - 7, '#3a3e44'); box(g, lx, top + 7, 3, H - top - 7, '#8a9098'); box(g, lx, top + 7, 1, H - top - 7, '#b8c0c8'); }
    // the table top: pale laminate with a steel edge
    box(g, x0 - 1, top - 1, w + 2, 9, '#4a4e54');
    texture(g, x0, top, w, 4, (px, py) => mul([232, 222, 196], 0.95 + hash(px >> 2, py, 94) * 0.06 + (py === top ? 0.06 : 0)));
    box(g, x0, top + 4, w, 3, '#c8ced4');
    box(g, x0, top + 4, w, 1, '#eef2f4');
    // the steel skirt under the top, which hides everybody's lap
    box(g, x0 + 2, top + 8, w - 4, 10, '#3a3e44');
    texture(g, x0 + 3, top + 8, w - 6, 9, (px, py) => mul([168, 176, 182], 0.8 + hash(px, Math.floor(py / 5), 95) * 0.1 - (py - top - 8) * 0.02));
    box(g, x0 + 3, top + 8, w - 6, 1, '#5a5e64');
    // whatever is on it
    for (let i = 0; i < 4; i++) {
      const px = tx - 45 + i * 30;
      const k = r.f();
      if (k < 0.45) {
        ell(g, px + 0.5, top + 1, 9, 2.6, '#8a8680');
        ell(g, px + 0.5, top + 0.6, 8, 2, '#f4f2ec');
        drawFood(g, px, top + 1, ['kaprao', 'somtam', 'omelette', 'gaitod', 'curry', 'mooping'][r.i(0, 5)], 0.5);
      } else if (k < 0.7) {
        block(g, px - 2, top - 7, 5, 8, '#dfe8ee');
        box(g, px - 1, top - 5, 3, 5, ['#d88a3c', '#e88aa8', '#6a55d8', '#3a2a22'][r.i(0, 3)]);
      } else if (k < 0.8) {
        block(g, px - 6, top - 1, 12, 2, '#9aa2a8');       // an empty tray
      }
    }
    // a caddy of cutlery and chilli in the middle
    block(g, tx - 4, top - 6, 8, 6, '#c8ced4');
    box(g, tx - 2, top - 9, 1, 3, '#dfe4e8'); box(g, tx + 1, top - 10, 1, 4, '#dfe4e8');
    block(g, tx + 6, top - 4, 3, 4, '#c83a32');
    // round stools on this side too, their seats just showing
    for (let i = 0; i < 4; i++) {
      const sx = tx - 45 + i * 30 + 15 * (i % 2 ? 1 : -1) * 0;
      ell(g, sx + 0.5, H - 3, 8, 3, '#6a2420');
      ell(g, sx + 0.5, H - 3.5, 7, 2.4, '#c8403a');
      box(g, sx - 4, H - 5, 4, 1, '#e8665a');
    }
  }
  return L;
}

/* --------------------------------------------------------------- dynamic */

/** A cook, drawn as a person, doing the thing their stall does. */
function cook(ctx, s, i, x, t) {
  const cx = x + 30;
  const fy = GROUND - 26;
  const sp = s.cook === 'pound' ? 8 : s.cook === 'wok' ? 5 : 3;
  const sw = Math.sin(t * sp + i);
  const P = { ...poseOf('stand', t * 2 + i) };
  if (s.cook === 'wok') { P.hRx = 7; P.hRy = 11 + sw * 2; P.hLx = 3; P.hLy = 12; }
  else if (s.cook === 'noodle') { P.hLx = 7; P.hLy = 8 + Math.max(0, sw) * 5; P.hRx = 2; P.hRy = 13; }
  else if (s.cook === 'pound') { P.hRx = 3; P.hRy = 6 + Math.max(0, sw) * 7; P.hLx = 4; P.hLy = 12; }
  else if (s.cook === 'grill') { P.hLx = 6 + sw * 2; P.hLy = 8; P.hRx = 4; P.hRy = 12; }
  else { P.hRx = 4; P.hRy = -2; P.hLx = 5; P.hLy = 12; }
  const who = drawHuman(ctx, cx, fy, { char: 'K' + (i + 1), outfit: 'vendor', P, t: t + i, shadow: false });
  return { cx, sw, who };
}

/** The pans, pots, mortars and grills, sitting on the counter. */
function tools(ctx, s, i, x, t, c) {
  const { cx, sw, who } = c;
  const y = COUNTER;
  if (s.cook === 'wok') {
    const wx = cx + 16, wy = y - 7 + Math.max(0, sw) * -3;
    // the burner and its flame
    for (let k = 0; k < 7; k++) {
      const fh = 3 + Math.abs(Math.sin(t * 11 + k * 1.7)) * 5 + (sw > 0.6 ? 4 : 0);
      box(ctx, wx - 7 + k * 2, y - fh + 1, 2, fh, k % 2 ? '#e8742c' : '#f2c23c');
      box(ctx, wx - 7 + k * 2, y - 1, 2, 1, '#fff0a0');
    }
    ell(ctx, wx, wy, 11, 5, '#1e1e24');
    ell(ctx, wx, wy - 1, 10, 4, '#3a3a42');
    ell(ctx, wx, wy - 2, 8, 2, '#8a5a2c');
    box(ctx, wx - 6, wy - 3, 4, 1, '#6ea04a');
    box(ctx, who.handX, who.handY - 1, wx - 10 - who.handX, 2, '#2a2a30');
    if (sw > 0.2) for (let k = 0; k < 6; k++) box(ctx, wx - 6 + k * 2, wy - 5 - k % 3 * 2 - sw * 4, 1, 1, k % 2 ? '#c2843c' : '#6ea04a');
  } else if (s.cook === 'noodle') {
    const px = cx - 22;
    block(ctx, px - 11, y - 16, 22, 16, '#9aa2a8');
    box(ctx, px - 10, y - 15, 5, 14, '#c2cad0');
    box(ctx, px - 11, y - 17, 22, 2, '#dfe4e8');
    const dip = Math.max(0, sw) * 5;
    block(ctx, px - 3, y - 24 + dip, 7, 8, '#a8804a');
    box(ctx, px - 2, y - 23 + dip, 5, 1, '#e8d8a8');
    box(ctx, px, y - 30 + dip, 1, 8, '#6a4a2a');
  } else if (s.cook === 'pound') {
    const mx = cx - 14;
    block(ctx, mx - 8, y - 12, 16, 12, '#8a6a4a');
    box(ctx, mx - 7, y - 11, 4, 10, '#a8805a');
    ell(ctx, mx, y - 12, 8, 2, '#5a3a22');
    ell(ctx, mx, y - 12.5, 6, 1.4, '#8fb84a');
    const lift = Math.max(0, sw) * 7;
    block(ctx, who.handX - 1, who.handY - 2, 3, 12, '#c2a070');
    if (sw < -0.85) for (let k = 0; k < 5; k++) box(ctx, mx - 6 + k * 3, y - 16 - k % 2 * 2, 1, 1, k % 2 ? '#d84f4f' : '#8fb84a');
    void lift;
  } else if (s.cook === 'grill') {
    const gx = cx - 22;
    block(ctx, gx - 16, y - 8, 32, 8, '#3a3a40');
    for (let k = 0; k < 8; k++) box(ctx, gx - 14 + k * 4, y - 3, 3, 2, ((t * 3 + k) % 4) < 2 ? '#f28a3c' : '#c2402c');
    for (let k = 0; k < 6; k++) {
      const turn = Math.sin(t * 3 + k * 1.3);
      box(ctx, gx - 14 + k * 5, y - 12, 1, 8, '#d8c090');
      block(ctx, gx - 15 + k * 5, y - 11 + turn * 0.6, 3, 4, '#a85c2c');
      box(ctx, gx - 15 + k * 5, y - 11 + turn * 0.6, 3, 1, '#d88a4c');
    }
    // the hand fan, going
    const fx = who.handX, fyy = who.handY;
    ell(ctx, fx - 2, fyy - 4, 5, 4, '#6a4a2a');
    ell(ctx, fx - 2, fyy - 4, 4, 3, '#d8b070');
  } else {
    // pulling tea: a pitcher up high, a long orange pour into a cup below
    const hx = who.handX, hy = who.handY;
    block(ctx, hx - 3, hy - 4, 6, 7, '#c8ced4');
    box(ctx, hx - 2, hy - 3, 2, 5, '#eef2f4');
    const cupX = cx - 16;
    const pour = (Math.sin(t * 1.3 + i) + 1) / 2;
    if (pour > 0.25) {
      for (let yy = hy + 3; yy < y - 12; yy++) box(ctx, hx - 4 + Math.round((yy - hy) * ((cupX - hx + 4) / (y - 12 - hy))), yy, 1, 1, '#e08a3c');
    }
    block(ctx, cupX - 4, y - 12, 8, 12, '#dfe8ee');
    box(ctx, cupX - 3, y - 8, 6, 7, '#d88a3c');
    box(ctx, cupX - 3, y - 11, 2, 9, '#ffffff');
    // the ice shaver beside, and syrups
    block(ctx, cx + 12, y - 20, 14, 20, '#c2cad0');
    box(ctx, cx + 13, y - 19, 3, 18, '#e8eef2');
    for (let k = 0; k < 4; k++) block(ctx, cx + 30 + k * 5, y - 12, 3, 12, ['#d88a3c', '#e88aa8', '#3a2a22', '#6a55d8'][k]);
  }
  // steam or smoke off everything
  const smoky = s.cook === 'grill' || s.cook === 'wok';
  ctx.globalAlpha = smoky ? 0.3 : 0.22;
  for (let k = 0; k < (smoky ? 7 : 4); k++) {
    const ph = (t * (smoky ? 14 : 9) + k * 7) % 26;
    const sx = (s.cook === 'wok' ? cx + 16 : cx - 20) + Math.sin(t * 1.7 + k) * 3 + ph * 0.3;
    const sz = 2 + Math.floor(ph / 9);
    box(ctx, sx, y - 10 - ph, sz, sz, smoky ? '#d8d4cc' : '#ffffff');
  }
  ctx.globalAlpha = 1;
}

export function drawCanteen(ctx, cam, t) {
  if (!bg) bake();
  if (!counters) counters = bakeCounters();
  const c0 = -Math.round(cam);
  ctx.drawImage(bg.c, c0, 0);
  const v = (wx) => wx - cam;
  // tube lights under the trusses, and the fans turning under them
  for (const wx of CANTEEN_LAMPS) {
    const x = v(wx);
    if (x < -40 || x > W + 40) continue;
    box(ctx, x - 20, 32, 1, 6, '#3a3a3a'); box(ctx, x + 19, 32, 1, 6, '#3a3a3a');
    block(ctx, x - 24, 38, 48, 3, '#d8d4c8');
    box(ctx, x - 22, 41, 44, 2, '#fffef6');
  }
  // the banner, hung across the breeze blocks
  const text = bannerLabel();
  for (let wx = 220; wx < CANTEEN_W; wx += 500) {
    const x = v(wx);
    const bw = textWidth(text) + 44;
    if (x < -bw || x > W + 20) continue;
    box(ctx, x - 1, 55, bw + 2, 26, '#1a2240');
    box(ctx, x, 56, bw, 24, '#2f3a63');
    box(ctx, x, 56, bw, 2, '#4a5890');
    box(ctx, x, 78, bw, 2, '#232c4e');
    drawLogo(ctx, x + 14, 61, 1.1);
    drawText(ctx, text, x + 30, 63, '#f4ecd0');
  }
  // each stall: its name, its cook, then the counter in front, then the pans on it
  const live = [];
  SHOPS.forEach((s, i) => {
    const x = v(s.x);
    if (x < -150 || x > W + 150) return;
    const name = s.nameShort || '';
    drawText(ctx, name, x - textWidth(name) / 2, 132, s.sign);
    live.push([s, i, x, cook(ctx, s, i, x, t)]);
  });
  ctx.drawImage(counters.c, c0, 0);
  for (const [s, i, x, c] of live) tools(ctx, s, i, x, t, c);
  for (const wx of CANTEEN_LAMPS) {
    const x = v(wx);
    if (x > -30 && x < W + 30) drawFan(ctx, x, 104, t * 0.9);
  }
  // the clock's hands
  const clx = v(525);
  if (clx > -20 && clx < W + 20) {
    ctx.fillStyle = '#2a2420';
    for (let k = 0; k < 7; k++) ctx.fillRect(Math.round(clx), 116 - k, 1, 1);
    for (let k = 0; k < 5; k++) ctx.fillRect(Math.round(clx + k * 0.7), Math.round(116 + k * 0.7), 1, 1);
  }
}

/** The long tables, in front of everyone sitting at them. */
export function drawCanteenFg(ctx, cam, t = 0) {
  if (!fg) fg = bakeFg();
  ctx.drawImage(fg.c, -Math.round(cam), 0);
  // a fly that has found the som tam, as flies do
  const fx = 640 - cam + Math.sin(t * 3.1) * 14 + Math.sin(t * 7.3) * 4;
  const fyy = 252 + Math.cos(t * 2.3) * 6 + Math.sin(t * 9) * 2;
  if (fx > -10 && fx < W + 10) { box(ctx, fx, fyy, 1, 1, '#1a1a1a'); if ((t * 30) % 2 < 1) box(ctx, fx - 1, fyy - 1, 3, 1, 'rgba(255,255,255,0.5)'); }
}
