/* ============================================================================
 *  assembly.js — the front of the school at five to eight in the morning.
 *
 *  Every Thai school day starts here.  In through the gate past the guard's
 *  booth, past the little white shrine where somebody has already left a
 *  marigold garland, under the rain tree, onto the concrete court in front of
 *  the long two-storey building with its red tile roof and its louvres.  The
 *  flagpole stands on its white steps in front of the stage; the stage has
 *  the Buddha on one side and the King on the other and the school badge in
 *  the middle.  At eight the anthem plays and the flag goes up and nobody
 *  moves, and then everyone prays, and then a teacher makes an announcement
 *  that ruins somebody's day.
 * ==========================================================================*/

import { shade, rng, mix, clamp } from './core.js';
import { W, H } from './vista.js';
import { makeLayer, box, texture, planksV, plaster, concrete, block, blob, ell, hash, mul } from './pixart.js';
import { drawText, textWidth } from './font.js';
import { drawLogo } from './school.js';

export const ASM_W = 1120;
export const ASM_GY = 250;
export const FLAG_X = 776;
const COURT = 214;          // where the court meets the building
const GATE_X = 84;
const SHRINE_X = 352;
const STAGE_X0 = 690, STAGE_X1 = 866;
/** Where the lines of students stand, back row to front. */
export const ASM_ROWS = [234, 250, 266, 282];
export const NIM_SLOT = 690;

let bg = null, fg = null;
let schoolName = 'โรงเรียนอัญชันวิทยา';
export function setSchoolName(s) { schoolName = s; bg = null; }

/* ------------------------------------------------------------------ bake */

function bake() {
  const L = makeLayer(ASM_W, H);
  const g = L.g;
  const r = rng(808);
  // the morning sky: clear blue overhead, warm haze low down
  texture(g, 0, 0, ASM_W, 150, (x, y) => {
    const k = y / 150;
    const c = [lerp(120, 246, k * k), lerp(178, 232, k), lerp(230, 206, k)];
    return mul(c, 0.985 + hash(x >> 2, y >> 1, 11) * 0.025);
  });
  // two soft clouds
  for (const [cx, cy, s] of [[210, 34, 1], [620, 22, 1.3], [980, 46, 0.9]]) cloud(g, cx, cy, s);
  // far rooftops and trees beyond the fence
  for (let x = -10; x < 420; x += 38) {
    const h = 20 + Math.floor(hash(x, 3, 12) * 22);
    block(g, x, 190 - h, 34, h, mix('#c8c4b8', '#b8c4cc', hash(x, 4, 12)), { flat: true });
    box(g, x - 2, 190 - h - 3, 38, 3, mix('#a86a4a', '#8a8a92', hash(x, 5, 12)));
    for (let wy = 190 - h + 5; wy < 186; wy += 7) for (let wx = x + 4; wx < x + 30; wx += 8) box(g, wx, wy, 4, 4, '#98a4b0');
  }
  canopy(g, 140, 150, 60, 34, 0.7, 13);
  canopy(g, 30, 160, 44, 24, 0.7, 14);

  // the building, long and two storeys, across the back of the court
  building(g, 392, ASM_W + 10);
  // the gate and fence at the left
  fence(g, 0, 400);
  gate(g, GATE_X);
  booth(g, GATE_X + 104);
  // the court
  courtFloor(g);
  // the stage, the flagpole on its steps
  stage(g);
  flagBase(g, FLAG_X);
  // the rain tree over the shrine, and one at the far end
  trunk(g, 296, 60, COURT + 6, 9);
  shrine(g, SHRINE_X);
  canopy(g, 284, 56, 118, 52, 1, 21);
  trunk(g, 1094, 70, COURT + 6, 8);
  canopy(g, 1100, 60, 96, 46, 1, 22);
  // the school's name on a stone by the path
  nameStone(g, 214);
  void r;
  bg = L;
}
function lerp(a, b, k) { return a + (b - a) * k; }

function cloud(g, cx, cy, s) {
  const parts = [[0, 0, 22, 7], [-16, 3, 14, 5], [15, 2, 16, 6], [4, -5, 12, 6]];
  for (const [dx, dy, rx, ry] of parts) ell(g, cx + dx * s, cy + dy * s + 1, rx * s, ry * s, '#dfe8f0');
  for (const [dx, dy, rx, ry] of parts) ell(g, cx + dx * s, cy + dy * s, rx * s - 1, ry * s - 1, '#fbfcfd');
}

/** A rain tree's canopy, painted pixel by pixel: a dome of leaf clumps whose
 *  edge breaks up into single leaves, lit from the upper left, dark beneath. */
function canopy(g, cx, cy, rx, ry, dens, seed) {
  const x0 = Math.floor(cx - rx - 8), y0 = Math.floor(cy - ry - 8);
  const w = Math.ceil(rx * 2 + 16), h = Math.ceil(ry * 2 + 16);
  const n2 = (x, y, s) => {
    // two octaves of value noise
    const f = (xx, yy, sc, sd) => {
      const ix = Math.floor(xx / sc), iy = Math.floor(yy / sc), fx = xx / sc - ix, fy = yy / sc - iy;
      const a = hash(ix, iy, sd), b = hash(ix + 1, iy, sd), c = hash(ix, iy + 1, sd), d = hash(ix + 1, iy + 1, sd);
      const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
      return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
    };
    return f(x, y, 9, s) * 0.62 + f(x, y, 4, s + 1) * 0.28 + f(x, y, 2, s + 2) * 0.1;
  };
  const cols = [[35, 66, 31], [47, 90, 42], [68, 120, 58], [95, 148, 72], [134, 180, 90]];
  texture(g, x0, y0, w, h, (px, py) => {
    const dx = (px - cx) / rx, dy = (py - cy) / ry;
    // a dome, flatter underneath, with a lumpy outline
    const dd = dx * dx + (dy > 0 ? dy * dy * 1.6 : dy * dy);
    const nz = n2(px, py, seed);
    const edge = 1 - dd + (nz - 0.5) * 0.9;
    if (edge < 0) return null;
    // the light: from the upper left, on the tops of the clumps
    const lx = n2(px - 2, py - 2, seed) - nz;
    let k = 1.2 + (-dy * 0.9 - dx * 0.4) * 0.8 + lx * 5 + (nz - 0.5) * 1.6;
    if (edge < 0.08) k -= 0.6;
    const idx = Math.max(0, Math.min(4, Math.round(k)));
    // leaves, not mush: a checker of two tones where the light changes
    const c = cols[(idx > 0 && (px + py) % 2 === 0 && k - Math.floor(k) > 0.7) ? Math.min(4, idx + 1) : idx];
    return c;
  });
  // loose leaves round the rim
  const r = rng(seed * 31);
  for (let i = 0; i < rx * dens * 1.4; i++) {
    const a = r.f(0, Math.PI * 2);
    const d = r.f(0.92, 1.12);
    box(g, cx + Math.cos(a) * rx * d, cy + Math.sin(a) * ry * d * 0.9, 1 + (i % 2), 1, i % 3 ? '#44783a' : '#2f5a2a');
  }
}

function trunk(g, x, top, bot, w) {
  texture(g, x - w / 2, top, w, bot - top, (px, py) => {
    const k = 0.8 + ((px - x + w / 2) / w < 0.35 ? 0.25 : 0) - ((px - x + w / 2) / w > 0.75 ? 0.15 : 0);
    const bark = hash(px, Math.floor(py / 3), 23) > 0.7 ? 0.82 : 1;
    return mul([112, 88, 70], k * bark);
  });
  // two branches reaching up into the canopy
  for (const d of [-1, 1]) for (let i = 0; i < 22; i++) box(g, x + d * i * 1.4 - 1, top + 14 - i, 3, 3, i % 4 ? '#6a5242' : '#806250');
  // roots spreading into the ground
  for (const d of [-1, 1]) for (let i = 0; i < 7; i++) box(g, x + d * (w / 2 + i), bot - 3 + Math.floor(i / 3), 2, 2, '#6a5242');
}

function building(g, x0, x1) {
  const roofTop = 38, eave = 80, floor2 = 144, base = COURT;
  // the roof: rows of red-orange tiles, darker as they go up under the ridge
  texture(g, x0 - 16, roofTop, x1 - x0 + 32, eave - roofTop, (px, py) => {
    const row = Math.floor((py - roofTop) / 4);
    const inR = (py - roofTop) % 4;
    const off = row % 2 ? 3 : 0;
    const col = Math.floor((px + off) / 6);
    const edge = (px + off) % 6 === 0;
    let k = 0.84 + (py - roofTop) / (eave - roofTop) * 0.24;
    k *= 0.95 + hash(col, row, 31) * 0.1;
    if (inR === 3 || edge) k *= 0.7;
    if (inR === 0) k *= 1.1;
    if (hash(col, row, 32) > 0.97) k *= 0.8;             // a patched tile
    return mul([196, 86, 52], k);
  });
  block(g, x0 - 18, roofTop - 3, x1 - x0 + 36, 4, '#8a3a22');      // the ridge
  box(g, x0 - 18, eave, x1 - x0 + 36, 3, '#f2ece0');               // white fascia
  box(g, x0 - 18, eave + 3, x1 - x0 + 36, 3, '#5a3020');           // shadow under the eave
  // upper storey: wooden boards and long runs of louvred windows
  planksV(g, x0, eave + 6, x1 - x0, floor2 - eave - 6, '#8a4a2c', { width: 6, seed: 33, fade: 0.92 });
  for (let x = x0 + 14; x < x1 - 30; x += 44) louvreWindow(g, x, eave + 14, 28, 36);
  // the floor between, painted white, with the name of the building
  block(g, x0, floor2, x1 - x0, 6, '#ece6d6');
  box(g, x0, floor2 + 6, x1 - x0, 2, '#6a4a34');
  // lower storey: white pillars, the dim walkway behind, doors
  box(g, x0, floor2 + 8, x1 - x0, base - floor2 - 8, '#4a3428');
  texture(g, x0, floor2 + 8, x1 - x0, base - floor2 - 8, (px, py) => mul([92, 64, 48], 0.72 + (py - floor2) / (base - floor2) * 0.3 + hash(px >> 1, py >> 1, 34) * 0.05));
  for (let x = x0 + 30; x < x1; x += 70) {
    // a classroom door and window seen across the walkway
    block(g, x + 14, floor2 + 20, 16, base - floor2 - 24, '#9a5a34');
    box(g, x + 21, floor2 + 20, 1, base - floor2 - 24, '#5a3020');
    block(g, x + 36, floor2 + 20, 20, 18, '#c8b890');
    for (let k = 0; k < 4; k++) box(g, x + 37 + k * 5, floor2 + 20, 1, 18, '#3a2a1e');
  }
  for (let x = x0 + 4; x < x1; x += 70) {
    box(g, x - 1, floor2 + 8, 11, base - floor2 - 8, '#8a8474');
    plaster(g, x, floor2 + 8, 9, base - floor2 - 8, '#ece6d6', { seed: x, grime: 1 });
    box(g, x, floor2 + 8, 2, base - floor2 - 8, '#fbf8f0');
    box(g, x + 7, floor2 + 8, 2, base - floor2 - 8, '#cfc8b4');
  }
  // the clock in the middle of the upper floor, and the building's plate
  const mx = (STAGE_X0 + STAGE_X1) / 2;
  block(g, mx - 34, floor2 - 2, 68, 10, '#2f3a63');
  ell(g, mx, eave + 22, 10, 10, '#3a2a1a'); ell(g, mx, eave + 22, 9, 9, '#f4f0e4'); ell(g, mx, eave + 22, 8, 8, '#fbf8ee');
  for (let i = 0; i < 12; i++) box(g, mx + Math.cos(i / 6 * Math.PI) * 6, eave + 22 + Math.sin(i / 6 * Math.PI) * 6, 1, 1, '#5a5048');
  // a banner hung along the upper railing
  block(g, x0 + 40, eave + 56, 120, 12, '#f2d23c');
  box(g, x0 + 40, eave + 56, 120, 2, '#fbe878');
  block(g, x1 - 200, eave + 56, 140, 12, '#3f7ea8');
}

function louvreWindow(g, x, y, w, h) {
  block(g, x - 2, y - 2, w + 4, h + 4, '#6a3a22');
  for (let yy = y; yy < y + h; yy += 3) {
    box(g, x, yy, w, 1, '#3a1e12');
    box(g, x, yy + 1, w, 1, '#c89060');
    box(g, x, yy + 2, w, 1, '#a8703e');
  }
  box(g, x + w / 2 - 1, y, 2, h, '#6a3a22');
  // shutters folded back
  for (const sx of [x - 12, x + w + 2]) {
    planksV(g, sx, y, 10, h, '#9a5a34', { width: 5, seed: sx });
    box(g, sx, y, 10, 1, '#c07a4a');
  }
}

function fence(g, x0, x1) {
  const top = 176, base = COURT + 4;
  for (let x = x0; x < x1; x += 44) {
    block(g, x, top, 8, base - top, '#ece6d6');
    box(g, x, top, 2, base - top, '#fbf8f0');
    block(g, x - 1, top - 3, 10, 3, '#d8d0bc');
  }
  box(g, x0, base - 12, x1 - x0, 12, '#e2dccc');
  box(g, x0, base - 12, x1 - x0, 1, '#f6f2e8');
  for (let x = x0; x < x1; x += 4) box(g, x, top + 4, 1, base - top - 16, '#3a4a58');
  box(g, x0, top + 6, x1 - x0, 1, '#3a4a58'); box(g, x0, top + 20, x1 - x0, 1, '#3a4a58');
}

function gate(g, x) {
  // two tall pillars and an arch over them with the school's name
  for (const px of [x - 60, x + 60]) {
    block(g, px - 7, 96, 14, COURT + 6 - 96, '#ece6d6');
    box(g, px - 7, 96, 3, COURT + 6 - 96, '#fbf8f0');
    box(g, px + 4, 96, 3, COURT + 6 - 96, '#cfc8b4');
    block(g, px - 9, 92, 18, 5, '#2f3a63');
    block(g, px - 5, 86, 10, 6, '#2f3a63');
  }
  block(g, x - 70, 100, 140, 20, '#2f3a63');
  box(g, x - 70, 100, 140, 2, '#4a5890');
  box(g, x - 70, 118, 140, 1, '#1e2644');
  drawLogo(g, x - 60, 103, 0.9, true);
  // the sliding gate, pushed open
  for (let k = 0; k < 9; k++) block(g, x - 96 + k * 3, 150, 1, COURT + 2 - 150, '#4a5a68');
  box(g, x - 98, 150, 32, 2, '#4a5a68'); box(g, x - 98, 180, 32, 2, '#4a5a68'); box(g, x - 98, COURT, 32, 2, '#4a5a68');
}

function booth(g, x) {
  // the guard's booth: white box, blue roof, a window, a chair
  block(g, x - 16, 170, 32, COURT + 4 - 170, '#ece6d6');
  box(g, x - 16, 170, 3, COURT + 4 - 170, '#fbf8f0');
  block(g, x - 20, 164, 40, 6, '#3f6ea8');
  box(g, x - 20, 164, 40, 1, '#6a9ad0');
  block(g, x - 10, 178, 20, 14, '#8ab0c8');
  box(g, x - 10, 178, 20, 5, '#b8d4e4');
  box(g, x - 1, 178, 1, 14, '#6a7a88');
  block(g, x - 12, 198, 24, 3, '#c8c0a8');
}

function courtFloor(g) {
  const top = COURT;
  texture(g, 0, top, ASM_W, H - top, (px, py) => {
    const d = py - top;
    let k = 0.93 + hash(Math.floor(px / 3), Math.floor(py / 2), 41) * 0.08;
    k *= 0.97 + hash(px, py, 42) * 0.05;
    if (hash(px, py, 43) > 0.993) k *= 1.15;
    k *= 0.9 + Math.min(1, d / 50) * 0.12;
    // expansion joints in the concrete
    if (px % 64 === 0 || (d > 0 && Math.floor(Math.sqrt(d * 9)) !== Math.floor(Math.sqrt((d + 1) * 9)))) k *= 0.88;
    return mul([204, 194, 176], k);
  });
  // the court's painted lines, faded
  box(g, 380, top + 30, ASM_W - 380, 1, '#e8e4dc');
  box(g, 380, top + 74, ASM_W - 380, 1, '#e8e4dc');
  box(g, 560, top + 30, 1, 44, '#e8e4dc');
  for (let a = 0; a < 40; a++) box(g, 560 + Math.cos(a / 40 * Math.PI - Math.PI / 2) * 16, top + 52 + Math.sin(a / 40 * Math.PI - Math.PI / 2) * 16, 1, 1, '#e8e4dc');
  // the path in from the gate: paving and a strip of grass either side
  texture(g, 0, top + 2, 380, 8, (px, py) => mul([96, 150, 70], 0.85 + hash(px, py, 44) * 0.3));
  for (let x = 0; x < 380; x += 3) if (hash(x, 1, 45) > 0.4) box(g, x, top, 1, 2 + Math.floor(hash(x, 2, 45) * 3), '#6a9a4a');
  g.globalAlpha = 0.25;
  box(g, 0, top, ASM_W, 4, '#3a3024');
  g.globalAlpha = 1;
}


/* A seated Buddha in meditation, gold, drawn by hand. */
const BUDDHA = [
  '......g......',
  '.....ggd.....',
  '.....GGG.....',
  '....GgGGd....',
  '....gGGGd....',
  '....GGGGd....',
  '.....GGd.....',
  '....GGGGd....',
  '..GgGGGGGGd..',
  '..gGGGGGGGd..',
  '..GGGGGGGGd..',
  '..GGGGGGGdd..',
  '.GGGGgggGGGd.',
  'GgGGGGGGGGGGd',
  'GGGGGGGGGGGdd',
  '.ddddddddddd.',
];
function buddha(g, x, base) {
  const col = { G: '#d8a838', g: '#f8d860', d: '#a87820' };
  const w = BUDDHA[0].length, h = BUDDHA.length;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const ch = BUDDHA[j][i];
    if (col[ch]) box(g, x - Math.floor(w / 2) + i, base - h - 3 + j, 1, 1, col[ch]);
  }
  // the lotus throne under it
  for (let i = 0; i < 7; i++) { box(g, x - 7 + i * 2, base - 3, 2, 2, i % 2 ? '#e88aa8' : '#f4b8c8'); }
  box(g, x - 7, base - 1, 15, 1, '#b8802a');
}

function stage(g) {
  const x0 = STAGE_X0, x1 = STAGE_X1, top = 190, base = COURT;
  // the backdrop: a panel with a gold edge and the school badge
  block(g, x0 + 20, 132, x1 - x0 - 40, top - 132, '#a8342f');
  box(g, x0 + 22, 134, x1 - x0 - 44, 2, '#d8b85a');
  box(g, x0 + 22, top - 4, x1 - x0 - 44, 2, '#d8b85a');
  texture(g, x0 + 24, 137, x1 - x0 - 48, top - 142, (px, py) => mul([168, 52, 47], 0.9 + ((px + py) % 5 === 0 ? 0.12 : 0) + hash(px >> 1, py >> 1, 51) * 0.05));
  drawLogo(g, (x0 + x1) / 2, 146, 1.6, true);
  // the Buddha on a gold-clothed altar at the left, the King's portrait at the right
  const bx = x0 + 42;
  block(g, bx - 12, top - 20, 24, 20, '#d8b85a');
  box(g, bx - 12, top - 20, 24, 3, '#f2d878');
  buddha(g, bx, top - 20);
  for (const fx of [bx - 16, bx + 16]) {                  // vases of flowers either side
    block(g, fx - 2, top - 8, 4, 8, '#f4f0e4');
    blob(g, fx, top - 12, 3, 3, '#f2a830', '#8a5010');
  }
  const kx = x1 - 44;
  block(g, kx - 11, top - 44, 22, 30, '#c8a040');
  box(g, kx - 8, top - 41, 16, 24, '#e8e0cc');
  box(g, kx - 5, top - 30, 10, 13, '#3a3a4a');
  box(g, kx - 3, top - 37, 6, 7, '#d8b890');
  box(g, kx - 3, top - 38, 6, 2, '#2a2a30');
  block(g, kx - 8, top - 14, 16, 14, '#f2d23c');
  for (let k = 0; k < 3; k++) { box(g, kx - 22 + k * 2, top - 30 + k, 1, 30, '#8a6a3a'); block(g, kx - 21 + k * 2, top - 30 + k, 6, 4, '#f2d23c'); }
  // the platform: white face, blue skirting, two steps down to the court
  block(g, x0, top, x1 - x0, base - top, '#ece6d6');
  box(g, x0, top, x1 - x0, 2, '#fbf8f0');
  box(g, x0, base - 6, x1 - x0, 6, '#3f6ea8');
  box(g, x0, base - 6, x1 - x0, 1, '#6a9ad0');
  for (let k = 0; k < 2; k++) block(g, x0 - 16 + k * 6, top + 8 + k * 8, 18 - k * 6, base - top - 8 - k * 8, '#dcd4c0');
  // the microphone stand in the middle
  const mx = (x0 + x1) / 2 + 20;
  box(g, mx, top - 26, 1, 26, '#3a3a40');
  block(g, mx - 1, top - 29, 3, 3, '#2a2a30');
  box(g, mx - 4, top - 1, 9, 1, '#3a3a40');
}

function flagBase(g, x) {
  const base = COURT + 12;
  for (let k = 0; k < 3; k++) {
    const w = 34 - k * 9, h = 5;
    const y = base - (k + 1) * h;
    block(g, x - w / 2, y, w, h, k % 2 ? '#f4f0e4' : '#e8e2d2');
    box(g, x - w / 2, y, w, 1, '#fbf8f0');
    box(g, x - w / 2, y + h - 1, w, 1, '#3f6ea8');
  }
  // the pole, silver, with a gold ball on top
  const topY = 22;
  box(g, x - 2, topY, 4, base - 15 - topY, '#6a6e74');
  box(g, x - 1, topY, 2, base - 15 - topY, '#d8dce0');
  box(g, x - 1, topY, 1, base - 15 - topY, '#ffffff');
  ell(g, x, topY - 2, 3, 3, '#a8802a'); ell(g, x - 0.5, topY - 2.5, 2, 2, '#f2d25a');
  box(g, x + 2, topY + 4, 1, base - 20 - topY, '#e8e8e8');          // the halyard
}

function shrine(g, x) {
  // a little white sala on a plinth, a tiered roof with gold finials
  const base = COURT + 2, top = 150;
  block(g, x - 22, base - 10, 44, 10, '#ece6d6');
  box(g, x - 22, base - 10, 44, 1, '#fbf8f0');
  box(g, x - 22, base - 2, 44, 2, '#c8b890');
  for (const px of [x - 17, x + 14]) { block(g, px, top + 20, 4, base - 10 - top - 20, '#f4f0e4'); box(g, px, top + 20, 1, base - 10 - top - 20, '#ffffff'); }
  // the roof: two tiers, red with a green edge, the curled finials
  for (let k = 0; k < 2; k++) {
    const y = top + 8 - k * 9, w = 28 - k * 7;
    for (let i = 0; i < 9; i++) {
      const ww = w - Math.floor(i * 0.9);
      box(g, x - ww, y + i, ww * 2, 1, i < 2 ? '#2e7a4a' : i % 3 === 0 ? '#9a2a22' : '#c23a2a');
    }
    box(g, x - w - 2, y + 9, 3, 2, '#d8b040'); box(g, x + w - 1, y + 9, 3, 2, '#d8b040');
    box(g, x - w - 3, y + 7, 2, 2, '#d8b040'); box(g, x + w + 1, y + 7, 2, 2, '#d8b040');
  }
  box(g, x - 1, top - 16, 2, 6, '#d8b040'); box(g, x - 2, top - 18, 4, 2, '#f2d25a');
  // the Buddha inside, gold, and the garland and offerings in front
  box(g, x - 13, top + 20, 26, base - 10 - top - 20, '#6a4a3a');
  buddha(g, x, base - 12);
  for (let i = 0; i < 9; i++) box(g, x - 9 + i * 2, base - 11 + Math.abs(i - 4) * 0.5, 2, 2, i % 2 ? '#f2a830' : '#f8c040');
  block(g, x - 16, base - 12, 3, 2, '#e85a5a'); block(g, x + 13, base - 12, 3, 2, '#f4f0e4');
}

function nameStone(g, x) {
  const base = COURT + 6;
  block(g, x - 64, base - 22, 128, 22, '#8a8478');
  texture(g, x - 63, base - 21, 126, 20, (px, py) => mul([150, 144, 132], 0.9 + hash(px >> 1, py >> 1, 61) * 0.14 - (py - base + 21) * 0.004));
  box(g, x - 63, base - 21, 126, 1, '#c8c2b4');
  for (let i = 0; i < 17; i++) blob(g, x - 64 + i * 8, base - 1, 3, 2, i % 2 ? '#4e8a3c' : '#3f7a34', '#1e3a1a');
  for (let i = 0; i < 10; i++) blob(g, x - 60 + i * 13, base - 3, 1.5, 1.5, '#f2a830', '#8a5010');
}

function bakeFg() {
  const L = makeLayer(ASM_W, H);
  const g = L.g;
  // a bed of marigolds along the path, and a low clipped hedge
  for (let x = 170; x < 390; x += 7) {
    blob(g, x, H - 6 + (x % 3), 5, 4, '#3f7a34', '#1e3a1a');
    if ((x / 7) % 2 < 1) blob(g, x + 1, H - 9 + (x % 2), 2, 2, '#f2a830', '#8a5010');
  }
  for (let x = 900; x < ASM_W; x += 9) blob(g, x, H - 4, 7, 5, x % 2 ? '#44783a' : '#3a6a32', '#1e3a1a');
  fg = L;
}

/* --------------------------------------------------------------- dynamic */

const birds = [];
for (let i = 0; i < 5; i++) birds.push({ x: i * 140, y: 30 + i * 9, sp: 22 + i * 4, ph: i * 1.3 });

/** The Thai flag: red, white, a wide blue band, white, red — waving. */
function flag(ctx, x, y, t, raised) {
  const w = 26, h = 17;
  const bands = ['#a51931', '#a51931', '#a51931', '#f4f2ee', '#f4f2ee', '#f4f2ee', '#2d2a5a', '#2d2a5a', '#2d2a5a', '#2d2a5a', '#2d2a5a', '#2d2a5a', '#f4f2ee', '#f4f2ee', '#f4f2ee', '#a51931', '#a51931'];
  for (let i = 0; i < w; i++) {
    const k = i / w;
    const wave = Math.sin(t * 5 - i * 0.35) * (1.2 + k * 2) * (0.4 + raised * 0.6);
    const lit = Math.cos(t * 5 - i * 0.35);
    for (let j = 0; j < h; j++) {
      ctx.fillStyle = lit > 0.4 ? shade(bands[j], 0.1) : lit < -0.5 ? shade(bands[j], -0.16) : bands[j];
      ctx.fillRect(Math.round(x + 2 + i), Math.round(y + j + wave), 1, 1);
    }
  }
}

export function drawAssembly(ctx, cam, t, o = {}) {
  if (!bg) bake();
  ctx.drawImage(bg.c, -Math.round(cam), 0);
  const v = (wx) => wx - cam;
  // birds crossing the sky
  for (const b of birds) {
    const x = ((b.x + t * b.sp) % (ASM_W + 200)) - 100 - cam * 0.3;
    const y = b.y + Math.sin(t * 1.5 + b.ph) * 4;
    const flapUp = Math.sin(t * 9 + b.ph) > 0;
    ctx.fillStyle = '#3a3a44';
    ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
    ctx.fillRect(Math.round(x - 2), Math.round(y + (flapUp ? -1 : 1)), 2, 1);
    ctx.fillRect(Math.round(x + 1), Math.round(y + (flapUp ? -1 : 1)), 2, 1);
  }
  // the flag: at the foot of the pole until the anthem, then up it
  const fx = v(FLAG_X);
  if (fx > -40 && fx < W + 40) {
    const k = clamp(o.flag || 0, 0, 1);
    const y = lerp(COURT - 30, 26, k);
    flag(ctx, fx, y, t, k);
  }
  // the clock's hands: five to eight
  const mx = v((STAGE_X0 + STAGE_X1) / 2);
  if (mx > -20 && mx < W + 20) {
    ctx.fillStyle = '#2a2420';
    // hour hand nearly on the eight, minute hand climbing to the twelve
    const hr = (o.clock === undefined ? 0.66 : o.clock) * Math.PI * 2 - Math.PI / 2;
    const mn = (o.minute === undefined ? 0.92 : o.minute) * Math.PI * 2 - Math.PI / 2;
    for (let i = 0; i < 5; i++) ctx.fillRect(Math.round(mx + Math.cos(hr) * i), Math.round(102 + Math.sin(hr) * i), 1, 1);
    for (let i = 0; i < 7; i++) ctx.fillRect(Math.round(mx + Math.cos(mn) * i), Math.round(102 + Math.sin(mn) * i), 1, 1);
  }
  // the building's plate, written live so the letters stay sharp
  const pl = o.plate || 'อาคาร ๑';
  if (mx > -60 && mx < W + 60) drawText(ctx, pl, mx - textWidth(pl) / 2, 143, '#f4ecd0');
  // what the banners along the railing say
  for (const [wx, txt, c] of o.banners || []) {
    const bx = v(wx);
    const tw = textWidth(txt);
    if (bx > -tw - 20 && bx < W + 20) drawText(ctx, txt, bx - tw / 2, 138, c);
  }
  const gx = v(GATE_X);
  if (gx > -80 && gx < W + 80) {
    const nm = schoolName;
    const tw = textWidth(nm);
    drawText(ctx, nm, gx - tw / 2 + 8, 105, '#f4ecd0');
  }
  const sx = v(214);
  if (sx > -80 && sx < W + 80) { const tw = textWidth(schoolName); drawText(ctx, schoolName, sx - tw / 2, COURT - 11, '#fbf4e0'); }
}

export function drawAssemblyFg(ctx, cam, t, o = {}) {
  if (!fg) bakeFg();
  ctx.drawImage(fg.c, -Math.round(cam), 0);
  // leaves drifting down from the rain trees
  for (let i = 0; i < 6; i++) {
    const base = [290, 1100][i % 2];
    const k = ((t * (9 + i * 2) + i * 37) % 170);
    const x = base - cam - 60 + i * 20 + Math.sin(t * 1.3 + i) * 10;
    const y = 70 + k;
    if (x < -5 || x > W + 5) continue;
    ctx.fillStyle = ['#c8a040', '#8aa848', '#d8783c'][i % 3];
    ctx.fillRect(Math.round(x), Math.round(y), Math.sin(t * 4 + i) > 0 ? 2 : 1, 1);
  }
  // music notes, while the anthem plays
  if (o.anthem > 0) {
    ctx.globalAlpha = Math.min(1, o.anthem) * 0.8;
    for (let i = 0; i < 6; i++) {
      const k = ((t * 12 + i * 23) % 80);
      const x = FLAG_X - cam - 60 + i * 24 + Math.sin(t + i) * 5;
      const y = 150 - k;
      ctx.fillStyle = '#fff6d8';
      ctx.fillRect(Math.round(x), Math.round(y), 2, 2);
      ctx.fillRect(Math.round(x + 1), Math.round(y - 5), 1, 5);
      ctx.fillRect(Math.round(x + 2), Math.round(y - 5), 2, 1);
    }
    ctx.globalAlpha = 1;
  }
}

export const ASM_SHADE = { trees: [[262, 118], [1094, 96]], stage: [STAGE_X0, STAGE_X1] };
