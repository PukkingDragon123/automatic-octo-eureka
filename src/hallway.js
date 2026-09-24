/* ============================================================================
 *  hallway.js — the open walkway along the front of the classrooms.
 *
 *  The outside of the same old wooden building: board walls gone dark red,
 *  a band of louvres under the eaves, panelled double doors with the room
 *  number over each, windows with their shutters folded back and iron bars,
 *  the dim classroom inside.  Under every window a rack of shoes, because
 *  nobody wears shoes into the room.  The floor is polished concrete that
 *  holds a faint reflection.  On the courtyard side, square concrete pillars
 *  and a low breeze-block wall with pots on it, and the sun coming in between.
 * ==========================================================================*/

import { shade, rng } from './core.js';
import { W, H } from './vista.js';
import { makeLayer, box, texture, planksV, planksH, plaster, concrete, block, blob, ell, hash, mul } from './pixart.js';
import { drawText, textWidth } from './font.js';

export const HALL_W = 1560;
const MOD = 195;                // one classroom's worth of wall
const BASE = 216;               // where the wall meets the floor
const WALL = '#7a4029';
const TRIM = '#a8683a';
/** The pillars on the courtyard side, for the light rig. */
export const HALL_PILLARS = [];
for (let x = MOD - 22; x < HALL_W + MOD; x += MOD) HALL_PILLARS.push(x);

let bg = null, fg = null;

function bake() {
  const L = makeLayer(HALL_W, H);
  const g = L.g;
  const r = rng(515);
  // the ceiling and its beam
  planksH(g, 0, 0, HALL_W, 28, '#5a3122', { height: 4, seed: 41, fade: 0.65 });
  block(g, 0, 28, HALL_W, 4, '#3f2417');
  // the wall
  planksV(g, 0, 32, HALL_W, 150, WALL, { width: 7, seed: 43, fade: 0.92 });
  // a louvre band under the eaves, all the way along
  for (let y = 36; y < 54; y += 3) {
    box(g, 0, y, HALL_W, 1, '#2a150c');
    box(g, 0, y + 1, HALL_W, 1, shade(TRIM, 0.08));
    box(g, 0, y + 2, HALL_W, 1, TRIM);
  }
  block(g, 0, 34, HALL_W, 2, shade(TRIM, -0.2));
  block(g, 0, 54, HALL_W, 3, shade(TRIM, -0.1));
  for (let x = 0; x < HALL_W; x += 39) box(g, x, 36, 2, 18, shade(TRIM, -0.3));
  // the lower wall is painted, the way the school always paints it
  plaster(g, 0, 176, HALL_W, BASE - 176, '#e6dcc2', { grime: 1.6, seed: 44 });
  block(g, 0, 174, HALL_W, 3, shade(TRIM, -0.05));
  block(g, 0, BASE - 4, HALL_W, 4, '#5a3a2a');

  for (let m = 0; m * MOD < HALL_W; m++) {
    const x = 26 + m * MOD;
    door(g, x, m, r);
    window_(g, x + 58, m, r);
    shoeRack(g, x + 60, r);
    const kind = ['notice', 'cooler', 'plant', 'bins', 'notice', 'extinguisher', 'plant', 'cooler'][m % 8];
    prop(g, x + 150, kind, m, r);
  }

  // the floor: polished concrete squares, with the room reflected in it
  const top = BASE;
  texture(g, 0, top, HALL_W, H - top, (px, py) => {
    const d = py - top;
    const row = Math.floor(Math.sqrt(d * 7));          // rows open up toward you
    const rowEdge = Math.floor(Math.sqrt((d + 1) * 7)) !== row;
    const colW = 30;
    const slant = Math.round((px - HALL_W / 2) * d * 0.0009);
    const colEdge = (px + slant) % colW === 0;
    let k = 0.93 + hash(Math.floor(px / 3), Math.floor(py / 2), 45) * 0.07;
    k *= 0.97 + hash(px, py, 46) * 0.05;
    if (hash(px, py, 47) > 0.994) k *= 1.2;
    if (rowEdge || colEdge) k *= 0.84;
    k *= 0.9 + Math.min(1, d / 60) * 0.12;
    return mul([184, 172, 156], k);
  });
  // the reflection: the lower wall, flipped, faint
  const copy = makeLayer(HALL_W, 60);
  copy.g.drawImage(L.c, 0, BASE - 60, HALL_W, 60, 0, 0, HALL_W, 60);
  g.save();
  g.globalAlpha = 0.13;
  g.translate(0, BASE * 2);
  g.scale(1, -1);
  g.drawImage(copy.c, 0, BASE - 60);
  g.restore();
  g.globalAlpha = 0.18;
  box(g, 0, BASE, HALL_W, 5, '#2a1a10');         // the wall's own shadow at its foot
  g.globalAlpha = 1;
  // shoes left outside the doors, not all of them in pairs
  for (let m = 0; m * MOD < HALL_W; m++) {
    const x = 26 + m * MOD;
    for (let k = 0; k < 4; k++) {
      if (!r.chance(0.6)) continue;
      shoe(g, x + 4 + k * 9 + r.i(-2, 2), BASE + 6 + r.i(0, 5), r.chance(0.7) ? '#23202a' : '#f2f0ea', r);
    }
  }
  bg = L;
}

function door(g, x, m, r) {
  const w = 38, top = 138;
  // the frame and transom louvre
  block(g, x - 3, top - 14, w + 6, BASE - top + 14, shade(TRIM, -0.08));
  for (let y = top - 12; y < top - 2; y += 3) { box(g, x, y, w, 1, '#24120a'); box(g, x, y + 1, w, 2, TRIM); }
  box(g, x, top - 2, w, 2, shade(TRIM, -0.3));
  // the room number on a white plate
  block(g, x + 4, top - 30, w - 8, 12, '#f6f2e6');
  drawText(g, 'ม.4/' + ((m % 8) + 1), x + 7, top - 28, '#2a3a6a');
  const open = m % 4 === 2;
  if (open) {
    // one door open: the classroom beyond, dim, with a desk or two
    box(g, x, top, w, BASE - top, '#2a1810');
    texture(g, x, top, w, BASE - top, (px, py) => mul([58, 36, 24], 0.8 + (py - top) / (BASE - top) * 0.4 + hash(px, py, 48) * 0.05));
    block(g, x + 22, top + 20, 12, 26, '#e8d8b0');           // the far window, bright
    box(g, x + 27, top + 20, 1, 26, '#c8b890');
    for (const dx of [3, 20]) { block(g, x + dx, top + 50, 14, 3, '#9a6a3a'); box(g, x + dx + 1, top + 53, 2, 16, '#5a3a22'); box(g, x + dx + 11, top + 53, 2, 16, '#5a3a22'); }
    // the leaf folded back against the wall
    planksV(g, x + w + 3, top, 10, BASE - top, '#9a5a34', { width: 5, seed: 49 + m });
    box(g, x + w + 12, top, 1, BASE - top, '#3a1e10');
  } else {
    for (const lx of [x, x + w / 2]) {
      planksV(g, lx, top, w / 2, BASE - top, '#9a5a34', { width: 5, seed: 50 + m * 2 + (lx > x ? 1 : 0) });
      // raised panels
      for (const [py, ph] of [[top + 6, 30], [top + 42, 30]]) {
        box(g, lx + 3, py, w / 2 - 6, ph, shade('#9a5a34', -0.25));
        box(g, lx + 4, py + 1, w / 2 - 8, ph - 2, shade('#9a5a34', 0.06));
        box(g, lx + 4, py + 1, w / 2 - 8, 1, shade('#9a5a34', 0.2));
      }
    }
    box(g, x + w / 2, top, 1, BASE - top, '#2a150c');
    block(g, x + w / 2 - 4, top + 40, 2, 5, '#d8b050');
    block(g, x + w / 2 + 3, top + 40, 2, 5, '#d8b050');
  }
  // a kick-worn threshold
  block(g, x - 3, BASE - 3, w + 6, 3, '#6a4428');
}

function window_(g, x, m, r) {
  const w = 72, top = 116, bot = 172;
  // the shutters folded back on either side
  for (const sx of [x - 15, x + w + 1]) {
    planksV(g, sx, top, 14, bot - top, '#9a5a34', { width: 7, seed: 60 + m + sx });
    box(g, sx, top, 14, 1, shade('#9a5a34', 0.2));
    box(g, sx + 1, top + 4, 12, 1, shade('#9a5a34', -0.3));
    box(g, sx + 1, bot - 5, 12, 1, shade('#9a5a34', -0.3));
  }
  block(g, x - 2, top - 2, w + 4, bot - top + 4, TRIM);
  // inside: the dim room, a far window, heads at desks
  texture(g, x, top, w, bot - top, (px, py) => {
    const k = 0.75 + (py - top) / (bot - top) * 0.35 + hash(px >> 1, py >> 1, 61) * 0.06;
    return mul([62, 40, 28], k);
  });
  const fx = x + 12 + (m * 17) % 30;
  block(g, fx, top + 8, 22, 20, '#e6d4a8');
  for (let k = 0; k < 4; k++) box(g, fx, top + 12 + k * 5, 22, 1, '#bca878');
  const rr = rng(700 + m);
  for (let k = 0; k < 4; k++) {
    const hx = x + 8 + k * 17 + rr.i(-3, 3);
    if (!rr.chance(0.75)) continue;
    ell(g, hx, top + 36, 5, 5, '#1e1618');
    ell(g, hx - 1, top + 34, 2, 2, '#3a2e30');
    box(g, hx - 6, top + 41, 12, 6, '#d8d4c8');               // white shirts
    box(g, hx - 6, top + 41, 12, 1, '#efece4');
  }
  block(g, x + 2, top + 46, w - 4, 3, '#8a5a34');            // a desk line
  // iron bars
  for (let bx = x + 3; bx < x + w; bx += 5) { box(g, bx, top, 1, bot - top, '#1e1e24'); box(g, bx + 1, top, 1, bot - top, 'rgba(160,160,170,0.35)'); }
  box(g, x, top + 22, w, 2, '#1e1e24');
  box(g, x + w / 2 - 1, top, 3, bot - top, TRIM);
  block(g, x - 5, bot + 2, w + 10, 3, shade(TRIM, 0.08));    // the sill
}

function shoeRack(g, x, r) {
  const w = 66, top = 188, h = BASE - top;
  block(g, x, top, w, h - 1, '#8a5a34');
  box(g, x + 1, top + 1, w - 2, 1, shade('#8a5a34', 0.2));
  for (let s = 0; s < 2; s++) {
    const sy = top + 3 + s * 12;
    box(g, x + 2, sy, w - 4, 9, '#3a2014');
    box(g, x + 2, sy + 9, w - 4, 2, shade('#8a5a34', 0.1));
    for (let k = 0; k < 6; k++) {
      if (!r.chance(0.8)) continue;
      const c = r.chance(0.75) ? '#23202a' : r.chance(0.5) ? '#f2f0ea' : '#3f5f9a';
      shoe(g, x + 5 + k * 10, sy + 8, c, r);
    }
  }
  for (let k = 1; k < 3; k++) box(g, x + (w / 3) * k, top + 2, 1, h - 3, '#5a3a22');
}

function shoe(g, x, y, c, r) {
  const hi = shade(c, c === '#23202a' ? 0.5 : 0.12);
  for (const dx of [0, 4]) {
    box(g, x + dx - 1, y - 4, 5, 4, shade(c, -0.4));
    box(g, x + dx, y - 3, 4, 3, c);
    box(g, x + dx, y - 3, 2, 1, hi);
    box(g, x + dx - 1, y - 1, 6, 1, c === '#23202a' ? '#5a5660' : '#d8d4cc');
  }
  void r;
}

function prop(g, x, kind, m, r) {
  if (kind === 'notice') {
    block(g, x - 20, 92, 42, 58, '#6a4428');
    texture(g, x - 18, 94, 38, 54, (px, py) => mul([196, 150, 100], 0.9 + hash(px, py, 62) * 0.14));
    const head = 'ประกาศ';
    const hw = textWidth(head) + 6;
    block(g, x + 1 - hw / 2, 95, hw, 11, '#c83a3a');
    drawText(g, head, x + 1 - textWidth(head) / 2, 97, '#fbf4e0');
    const cols = ['#f8f4ea', '#e8f0f8', '#fdf0c8', '#f8e0e8'];
    for (let k = 0; k < 5; k++) {
      const px = x - 16 + (k % 3) * 12 + r.i(-1, 1), py = 108 + Math.floor(k / 3) * 20 + r.i(-1, 2);
      block(g, px, py, 10, 15, cols[k % 4]);
      for (let l = 0; l < 4; l++) box(g, px + 1, py + 3 + l * 3, 7 - (l % 2) * 2, 1, '#8a8274');
      box(g, px + 4, py - 1, 2, 2, ['#e84a4a', '#3a8ae8', '#f2c23c'][k % 3]);
    }
  } else if (kind === 'cooler') {
    // a stainless drinking-water tank with its taps, and a stack of cups
    const y = BASE + 4;
    block(g, x - 12, y - 48, 24, 42, '#c8ced4');
    texture(g, x - 11, y - 47, 22, 40, (px, py) => {
      const k = 0.86 + Math.pow(Math.sin(((px - x + 11) / 22) * Math.PI), 0.5) * 0.24 + hash(px, py, 63) * 0.04;
      return mul([196, 204, 212], k);
    });
    block(g, x - 13, y - 52, 26, 4, '#aab2ba');
    block(g, x - 10, y - 30, 20, 8, '#e8f0f4');
    drawText(g, 'น้ำดื่ม', x - 9, y - 30, '#2a5a9a');
    for (const tx of [x - 7, x + 5]) { block(g, tx, y - 19, 3, 3, '#3a3a40'); box(g, tx + 1, y - 16, 1, 2, '#3a3a40'); }
    block(g, x - 11, y - 6, 22, 3, '#8a9098');
    for (let k = 0; k < 3; k++) block(g, x + 15 + k * 5, y - 10 - k * 0, 3, 5, ['#e84a8a', '#3a8ae8', '#f2c23c'][k]);
  } else if (kind === 'plant') {
    const y = BASE + 5;
    block(g, x - 10, y - 16, 20, 15, '#b8603c');
    box(g, x - 9, y - 15, 5, 13, shade('#b8603c', 0.15));
    block(g, x - 12, y - 19, 24, 3, '#c8704a');
    // big split leaves
    const lv = [[-12, -34, 9, 6], [10, -36, 9, 6], [-3, -46, 7, 8], [-16, -24, 7, 4], [14, -26, 7, 4], [4, -30, 7, 5], [-6, -30, 6, 5]];
    for (const [dx, dy, rx, ry] of lv) {
      blob(g, x + dx, y + dy, rx, ry, (dx + dy) % 2 ? '#3f7a34' : '#4e8a3c', '#1e3a1a');
      box(g, x + dx - rx + 2, y + dy, rx * 2 - 4, 1, '#2e5a28');
    }
    for (let k = 0; k < 5; k++) box(g, x - 4 + k * 2, y - 26, 1, 8, '#2e5a28');
  } else if (kind === 'bins') {
    const y = BASE + 5;
    const cols = [['#3a8a4a', 'เปียก'], ['#e8b83c', 'รีไซเคิล'], ['#3a6ac8', 'ทั่วไป']];
    cols.forEach(([c], k) => {
      const bx = x - 22 + k * 15;
      block(g, bx, y - 22, 13, 21, c);
      box(g, bx + 1, y - 21, 3, 19, shade(c, 0.18));
      block(g, bx - 1, y - 25, 15, 3, shade(c, -0.15));
      block(g, bx + 3, y - 15, 7, 5, '#f4f0e4');
    });
  } else {
    // a fire extinguisher on its bracket, and the fire-bell box
    block(g, x - 16, 120, 20, 16, '#c8302a');
    ell(g, x - 6, 128, 5, 5, '#f2d23c');
    const y = BASE + 3;
    block(g, x + 4, y - 30, 10, 26, '#d83a30');
    box(g, x + 5, y - 29, 3, 24, '#f06a5a');
    block(g, x + 6, y - 35, 6, 4, '#2a2a30');
    box(g, x + 12, y - 33, 5, 2, '#2a2a30');
    block(g, x + 5, y - 20, 8, 6, '#f4f0e4');
  }
}

function bakeFg() {
  const L = makeLayer(HALL_W + MOD, H);
  const g = L.g;
  // the eave on the courtyard side
  plaster(g, 0, 0, HALL_W + MOD, 22, '#e2d8c2', { seed: 70 });
  box(g, 0, 0, HALL_W + MOD, 2, '#f4ecdc');
  box(g, 0, 20, HALL_W + MOD, 2, '#a89e88');
  box(g, 0, 22, HALL_W + MOD, 2, '#6a6254');
  for (const px of HALL_PILLARS) {
    const x = px - 9;
    // the pillar: square concrete, painted, lit from the left
    box(g, x - 1, 0, 20, H, '#6a6254');
    plaster(g, x, 0, 18, H, '#e6dcc6', { seed: px, grime: 0.6 });
    box(g, x, 0, 4, H, '#f6f0e2');
    box(g, x + 4, 0, 1, H, '#ece4d2');
    box(g, x + 14, 0, 4, H, '#c4b8a0');
    box(g, x + 17, 0, 1, H, '#a89c84');
    block(g, x - 3, 22, 24, 5, '#d8ceb8');
    block(g, x - 3, 256, 24, 6, '#d0c6ae');
    // a hanging orchid in a wire basket on every other pillar
    if ((px / MOD | 0) % 2 === 0) {
      box(g, x + 26, 24, 1, 20, '#3a3a3a');
      block(g, x + 20, 44, 13, 6, '#6a4a2a');
      for (let k = 0; k < 5; k++) box(g, x + 18 + k * 4, 50 + (k % 2) * 3, 2, 10 + (k % 3) * 3, '#4e8a3c');
      for (let k = 0; k < 4; k++) blob(g, x + 16 + k * 5, 64 + (k % 2) * 4, 2, 2, ['#c04ab0', '#e070d0', '#a83a98', '#f090e0'][k], '#5a1a50');
    }
  }
  // the low breeze-block wall, with the courtyard showing through
  const top = 272;
  block(g, 0, top, HALL_W + MOD, 5, '#d8ceb8');
  box(g, 0, top, HALL_W + MOD, 1, '#f2eadc');
  for (let x = 0; x < HALL_W + MOD; x += 14) {
    for (let y = top + 6; y < H; y += 12) {
      box(g, x, y, 14, 12, '#d0c6ae');
      box(g, x + 1, y + 1, 12, 10, '#e2d8c2');
      // the pattern: a circle in a square, the day behind it
      ell(g, x + 7, y + 6, 4, 4, '#9cc47a');
      ell(g, x + 7, y + 5, 3, 2, '#c8e0a0');
      box(g, x + 6, y + 2, 2, 8, '#e2d8c2');
      box(g, x + 3, y + 5, 8, 2, '#e2d8c2');
      box(g, x + 1, y + 10, 12, 1, '#b8ae96');
    }
  }
  // pots along the top of the wall
  for (let x = 60; x < HALL_W + MOD; x += 130) {
    const k = (x / 130) | 0;
    block(g, x - 6, top - 9, 12, 8, '#b8603c');
    box(g, x - 5, top - 8, 3, 6, '#d07a54');
    if (k % 3 === 0) for (let l = 0; l < 6; l++) box(g, x - 5 + l * 2, top - 20 + (l % 2) * 4, 2, 11, l % 2 ? '#4e8a3c' : '#3f7a34');
    else if (k % 3 === 1) { blob(g, x, top - 15, 7, 6, '#4e8a3c', '#1e3a1a'); for (let l = 0; l < 3; l++) blob(g, x - 4 + l * 4, top - 19 + (l % 2) * 3, 1.5, 1.5, '#f2c23c', '#8a5a10'); }
    else { for (let l = 0; l < 3; l++) blob(g, x - 4 + l * 4, top - 13 - l % 2 * 4, 3, 5, '#5a9a4a', '#1e3a1a'); }
  }
  fg = L;
}

/* --------------------------------------------------------------- dynamic */

const leaves = [];
for (let i = 0; i < 7; i++) leaves.push({ ph: i * 1.7, x0: i * 230, y0: 20 + (i * 37) % 120, sp: 18 + (i % 3) * 7, c: ['#c8a040', '#8aa848', '#d8783c'][i % 3] });

export function drawHallway(ctx, cam, t) {
  if (!bg) bake();
  ctx.drawImage(bg.c, -Math.round(cam), 0);
}

export function drawHallwayFg(ctx, cam, t = 0) {
  if (!fg) bakeFg();
  ctx.drawImage(fg.c, -Math.round(cam), 0);
  // leaves off the courtyard trees, drifting in
  for (const L of leaves) {
    const k = ((t * L.sp + L.x0) % (W + 120));
    const x = W + 40 - k;
    const y = L.y0 + k * 0.45 + Math.sin(t * 2 + L.ph) * 6;
    if (y > H) continue;
    const flipK = Math.sin(t * 5 + L.ph);
    box(ctx, x, y, flipK > 0 ? 3 : 2, 2, L.c);
    box(ctx, x, y, 1, 1, shade(L.c, 0.25));
  }
}
