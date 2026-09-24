/* ============================================================================
 *  classroom.js — Room 4/2, Anchan Wittaya School.
 *
 *  An old wooden classroom: board walls and a board ceiling gone dark red with
 *  age, a green blackboard with a red rail under it, the King's portrait and a
 *  television on a bracket above it, the flag in the corner, posters taped up
 *  wherever they fit, animals painted along the white lower wall by some year
 *  long gone, and high wooden louvres all down one side that let the sun in in
 *  stripes.  The camera is at the back of the room, so the class is seen from
 *  behind, on wooden chairs, at wooden desks, facing the board.
 * ==========================================================================*/

import { shade, rng } from './core.js';
import { W, H } from './vista.js';
import { makeLayer, box, texture, planksV, planksH, plaster, block, blob, ell, hash, mul } from './pixart.js';
import { drawText } from './font.js';

export const CLASS_W = 1000;
export const FLOOR_Y = 228;
const WOOD = '#c9925a';          // the desks and chairs
const WALL = '#7a4029';

/* ------------------------------------------------------------------ seats */

export function classSeats() {
  const rows = [];
  for (let r = 0; r < 3; r++) {
    const y = [246, 270, 296][r];
    const seats = [];
    for (let i = 0; i < 12; i++) seats.push({ x: 112 + i * 72 + (r === 1 ? 30 : 0), y, row: r });
    rows.push(seats);
  }
  return rows;
}

/* --------------------------------------------------------------- the room */

let bg = null;
let rowLayers = null;

function bakeRoom() {
  const L = makeLayer(CLASS_W, H);
  const g = L.g;
  // ceiling boards and the beam under them
  planksH(g, 0, 0, CLASS_W, 26, '#5a3122', { height: 4, seed: 11, fade: 0.7 });
  block(g, 0, 26, CLASS_W, 5, '#3f2417', { flat: false });
  // the wall: vertical boards, darkening toward the floor
  planksV(g, 0, 31, CLASS_W, 168, WALL, { width: 7, seed: 5, fade: 0.9 });
  box(g, 0, 31, CLASS_W, 2, '#4a2618');

  /* ---- the board end of the room ---- */
  // the flag, hung on a stick in the corner
  box(g, 6, 38, 1, 30, '#3a2a1a');
  for (let i = 0; i < 26; i++) {
    const sag = Math.round(Math.sin(i / 26 * Math.PI) * 2);
    const x = 7 + i;
    box(g, x, 40 + sag, 1, 3, '#a51931');
    box(g, x, 43 + sag, 1, 3, '#f2f0ea');
    box(g, x, 46 + sag, 1, 6, '#2d2a5a');
    box(g, x, 52 + sag, 1, 3, '#f2f0ea');
    box(g, x, 55 + sag, 1, 3, '#a51931');
  }
  // multiplication table, left of the board
  block(g, 18, 100, 36, 52, '#f6f2e6');
  const cols = ['#e84a8a', '#f2b23c', '#46b0d8', '#8ac84a', '#b070d8', '#f07a3a'];
  for (let r2 = 0; r2 < 4; r2++) {
    for (let c2 = 0; c2 < 3; c2++) {
      box(g, 20 + c2 * 11, 104 + r2 * 12, 10, 11, cols[(r2 * 3 + c2) % 6]);
      for (let k = 0; k < 4; k++) box(g, 22 + c2 * 11, 106 + r2 * 12 + k * 2, 6, 1, shade(cols[(r2 * 3 + c2) % 6], -0.35));
    }
  }
  // the television on its bracket, and its cable
  box(g, 146, 50, 1, 38, '#2a2a30'); box(g, 196, 50, 1, 38, '#2a2a30');
  box(g, 146, 50, 51, 1, '#2a2a30'); box(g, 146, 87, 51, 1, '#2a2a30');
  block(g, 152, 56, 40, 28, '#b9bcc2');
  block(g, 156, 59, 30, 22, '#2b3139', { flat: true });
  box(g, 158, 61, 8, 6, '#46505c');
  box(g, 187, 70, 2, 2, '#6ab86a');
  for (let i = 0; i < 40; i++) box(g, 190 + Math.sin(i * 0.3) * 3, 88 + i, 1, 1, '#1e1e24');
  // the King's portrait, in a gold frame
  block(g, 262, 50, 22, 30, '#c8a040');
  box(g, 265, 53, 16, 24, '#e8e0cc');
  box(g, 268, 64, 10, 13, '#3a3a4a');
  box(g, 270, 57, 6, 8, '#d8b890');
  box(g, 270, 56, 6, 2, '#2a2a30');
  box(g, 271, 66, 4, 1, '#c8a040');
  // a clock
  ell(g, 350, 68, 9, 9, '#3a2a1a'); ell(g, 350, 68, 8, 8, '#f4f0e4'); ell(g, 350, 68, 7, 7, '#fbf8ee');
  for (let i = 0; i < 12; i++) box(g, 350 + Math.cos(i / 6 * Math.PI) * 6, 68 + Math.sin(i / 6 * Math.PI) * 6, 1, 1, '#5a5048');
  // the blackboard, in its frame, with a red rail under it
  block(g, 58, 100, 334, 78, '#5e3a24');
  const bc = [63, 110, 102];
  texture(g, 61, 103, 328, 72, (px, py) => {
    let k = 0.94 + hash(Math.floor(px / 5), Math.floor(py / 3), 21) * 0.1;
    if (hash(Math.floor(px / 14), Math.floor(py / 9), 22) > 0.8) k *= 1.1;      // old chalk smudges
    return mul(bc, k);
  });
  box(g, 20, 178, 540, 6, '#b83a32'); box(g, 20, 178, 540, 1, '#d85a4a'); box(g, 20, 183, 540, 1, '#7a2420');
  box(g, 58, 176, 334, 3, '#4a2e1c');
  box(g, 80, 175, 8, 2, '#f4f0e4'); box(g, 92, 175, 5, 2, '#f0d0d0'); box(g, 140, 174, 10, 3, '#8a7a6a');
  // chalk: the date along the top, sums, a box to fill in
  const chalk = '#e8efe8';
  drawText(g, 'วันพุธที่ 18 กันยายน', 80, 110, chalk);
  drawText(g, '15 - 3 = ', 90, 132, chalk); block(g, 130, 131, 8, 8, '#3f6e66', { edge: chalk, flat: true });
  drawText(g, '17 - 7 = ', 90, 148, chalk); block(g, 130, 147, 8, 8, '#3f6e66', { edge: chalk, flat: true });
  drawText(g, 'ปิง + น่าน = เจ้าพระยา', 196, 132, '#f4e8a0');
  for (let i = 0; i < 5; i++) box(g, 196, 150 + i * 5, 60 + (i % 3) * 30, 1, 'rgba(232,239,232,0.5)');
  box(g, 350, 120, 20, 1, chalk); box(g, 350, 120, 1, 26, chalk); box(g, 369, 120, 1, 26, chalk);
  // posters to the right of the board: the Thai alphabet, a cat, a list, little houses
  block(g, 400, 100, 38, 52, '#f8f4ea');
  box(g, 400, 100, 38, 8, '#e05a8a');
  for (let r2 = 0; r2 < 6; r2++) for (let c2 = 0; c2 < 6; c2++) box(g, 403 + c2 * 6, 111 + r2 * 6, 4, 4, ['#2a2a3a', '#c83a3a', '#2a5aa8'][(r2 + c2) % 3]);
  block(g, 446, 98, 36, 40, '#f4ecd0');
  blob(g, 464, 120, 11, 10, '#fbfaf4', '#2a2a2a');
  ell(g, 455, 110, 4, 5, '#2a2a2a'); ell(g, 473, 110, 4, 5, '#2a2a2a');
  box(g, 459, 118, 2, 3, '#2a2a2a'); box(g, 467, 118, 2, 3, '#2a2a2a'); box(g, 463, 123, 3, 2, '#e05a5a');
  block(g, 446, 140, 36, 36, '#3a6aa8');
  box(g, 450, 146, 28, 22, '#f2ecd8');
  block(g, 490, 108, 26, 44, '#fbf8f0');
  for (let i = 0; i < 9; i++) box(g, 493, 112 + i * 4, 14 + (i % 3) * 4, 1, '#5a5048');
  box(g, 490, 104, 26, 4, '#e8e0cc');
  block(g, 524, 96, 20, 80, '#f6f2e6');
  for (let i = 0; i < 5; i++) {
    const hx = 527 + (i % 2) * 5, hy = 100 + i * 15;
    box(g, hx, hy + 5, 10, 8, ['#f2b23c', '#46b0d8', '#e84a8a', '#8ac84a', '#b070d8'][i]);
    for (let k = 0; k < 5; k++) box(g, hx + 5 - k, hy + k, k * 2 + 1, 1, '#c8402c');
  }

  /* ---- the window side: louvres over, shuttered windows under ---- */
  for (let wx = 600; wx < CLASS_W; wx += 100) {
    // louvres
    block(g, wx, 36, 90, 60, '#4a2819');
    for (let yy = 38; yy < 94; yy += 6) {
      box(g, wx + 2, yy, 86, 2, '#fff4d8');                    // the light between the slats
      box(g, wx + 2, yy + 2, 86, 1, '#9a6038');
      box(g, wx + 2, yy + 3, 86, 3, '#7a4428');
    }
    for (let k = 1; k < 3; k++) box(g, wx + k * 30, 36, 2, 60, '#4a2819');
    // the window under them, open onto a bright morning
    const ox = wx + 8, oy = 102, ow = 74, oh = 86;
    block(g, ox - 3, oy - 3, ow + 6, oh + 6, '#4a2819');
    texture(g, ox, oy, ow, oh, (px, py) => {
      const u = (py - oy) / oh;
      let c = [236, 242, 238];
      const roof = 36 + Math.round(Math.sin((px + wx) * 0.05) * 6);
      if (py - oy > roof) c = [216, 196, 170];                 // a neighbour's wall
      if (py - oy > roof - 5 && py - oy <= roof) c = [190, 120, 90];     // its tin roof
      if (py - oy < 30 && hash(Math.floor(px / 6), Math.floor(py / 5), wx) > 0.55) c = [184, 206, 162];  // trees
      const k = 0.97 + hash(px, py, 7) * 0.05 + (1 - u) * 0.03;
      return mul(c, k);
    });
    for (let bx = ox + 6; bx < ox + ow; bx += 9) box(g, bx, oy, 1, oh, '#5a4030');    // window bars
    box(g, ox, oy + 40, ow, 1, '#5a4030');
    // the shutters, folded back flat against the wall on either side
    for (const sx of [wx - 12, wx + 88]) {
      block(g, sx, 104, 12, 80, '#8a4e30');
      for (let yy = 108; yy < 180; yy += 5) box(g, sx + 2, yy, 8, 1, '#6a3822');
    }
    block(g, wx - 2, 190, 94, 5, '#5a3020');                      // the sill
  }
  // a sign over one window, and the round flag badge the photo has
  block(g, 736, 96, 60, 8, '#f4ecb0'); for (let i = 0; i < 8; i++) box(g, 740 + i * 7, 99, 4, 2, '#3a4a2a');
  ell(g, 820, 110, 7, 7, '#2a2a34'); ell(g, 820, 110, 6, 6, '#f4f2ee'); box(g, 814, 109, 12, 3, '#2d2a5a'); box(g, 814, 108, 12, 1, '#a51931'); box(g, 814, 112, 12, 1, '#a51931');

  /* ---- the painted lower wall, the skirting, the floor ---- */
  plaster(g, 0, 198, 560, 28, '#ece4d4', { grime: 1, seed: 8 });
  box(g, 0, 196, 560, 2, '#b83a32');
  planksV(g, 560, 196, CLASS_W - 560, 30, '#6a3622', { width: 7, seed: 9 });
  box(g, 0, 224, CLASS_W, 4, '#3f2417');
  const animals = [
    [34, 'elephant'], [96, 'horse'], [156, 'dino'], [214, 'octopus'], [270, 'fish'],
    [322, 'bird'], [380, 'rabbit'], [440, 'elephant'], [500, 'fish'],
  ];
  for (const [ax, kind] of animals) drawAnimal(g, ax, 214, kind);
  planksH(g, 0, FLOOR_Y, CLASS_W, H - FLOOR_Y, '#9c6c44', { height: 5, seed: 13, fade: 0.72 });

  /* ---- the teacher's desk, and the broom in the corner ---- */
  const tx = 470, ty = 238;
  block(g, tx - 30, ty - 20, 60, 4, shade(WOOD, -0.1));
  block(g, tx - 28, ty - 16, 56, 16, shade(WOOD, -0.25));
  box(g, tx - 24, ty - 12, 20, 10, shade(WOOD, -0.45));
  block(g, tx - 18, ty - 27, 16, 7, '#f2ecdc');
  box(g, tx - 18, ty - 24, 16, 1, '#c25a4a');
  block(g, tx + 8, ty - 26, 5, 6, '#e8e4dc');
  block(g, tx + 18, ty - 25, 7, 5, '#b06a4a');
  box(g, tx + 20, ty - 32, 2, 7, '#4e8a3c'); box(g, tx + 17, ty - 31, 3, 2, '#5aa047'); box(g, tx + 22, ty - 30, 3, 2, '#3f7a34');
  box(g, 572, 180, 2, 44, '#a8804a'); block(g, 566, 214, 14, 10, '#d8b060');
  block(g, 584, 210, 14, 14, '#4a7aa8');
  return L;
}

/** The painted animals along the lower wall, the way a class once did them. */
function drawAnimal(g, x, y, kind) {
  if (kind === 'elephant') {
    blob(g, x, y, 10, 7, '#8ab0c8'); blob(g, x - 9, y - 4, 5, 5, '#8ab0c8'); blob(g, x - 6, y - 4, 4, 5, '#a8c8dc');
    box(g, x - 15, y - 3, 2, 9, '#6a90a8'); box(g, x - 6, y + 5, 3, 5, '#6a90a8'); box(g, x + 5, y + 5, 3, 5, '#6a90a8');
    box(g, x - 11, y - 6, 1, 1, '#1a1a1a');
  } else if (kind === 'horse') {
    blob(g, x, y, 9, 5, '#f4f2ee', '#2a2a2a'); blob(g, x + 8, y - 6, 3, 5, '#f4f2ee', '#2a2a2a');
    for (const lx of [-6, -2, 3, 6]) box(g, x + lx, y + 4, 2, 6, '#2a2a2a');
    box(g, x + 6, y - 11, 4, 3, '#2a2a2a'); box(g, x - 10, y - 2, 3, 6, '#2a2a2a');
  } else if (kind === 'dino') {
    blob(g, x, y, 9, 6, '#e05aa8'); blob(g, x + 9, y - 7, 4, 4, '#e05aa8');
    box(g, x - 14, y + 1, 6, 3, '#c04890'); box(g, x - 4, y + 5, 3, 5, '#c04890'); box(g, x + 3, y + 5, 3, 5, '#c04890');
    for (let i = 0; i < 4; i++) box(g, x - 6 + i * 4, y - 8, 2, 2, '#f2b23c');
  } else if (kind === 'octopus') {
    blob(g, x, y - 3, 7, 6, '#f08aa0');
    for (let i = 0; i < 5; i++) box(g, x - 7 + i * 3, y + 2, 2, 7 - (i % 2) * 2, '#d86a84');
    box(g, x - 3, y - 4, 1, 1, '#1a1a1a'); box(g, x + 2, y - 4, 1, 1, '#1a1a1a');
  } else if (kind === 'fish') {
    blob(g, x, y, 8, 5, '#f2923c'); for (let i = 0; i < 5; i++) box(g, x + 8 + i, y - i, 1, i * 2 + 1, '#d8742c');
    box(g, x - 5, y - 1, 1, 1, '#1a1a1a'); box(g, x - 1, y - 4, 1, 9, '#f8c070');
  } else if (kind === 'bird') {
    blob(g, x, y, 7, 5, '#5a9ae0'); blob(g, x + 6, y - 5, 3, 3, '#5a9ae0'); box(g, x + 9, y - 5, 3, 1, '#f2b23c');
    box(g, x - 3, y - 3, 6, 2, '#3a7ac0');
  } else {
    blob(g, x, y, 7, 6, '#f8f6f2', '#8a8a8a'); blob(g, x + 5, y - 6, 3, 3, '#f8f6f2', '#8a8a8a');
    box(g, x + 4, y - 14, 2, 6, '#f0b8c8'); box(g, x + 7, y - 13, 2, 5, '#f0b8c8');
  }
}

/* Desks and chairs, one layer per row, so people can sit between them. */
function bakeRows() {
  const rows = classSeats();
  const out = { desks: [], chairs: [] };
  const r = rng(424);
  for (const row of rows) {
    const D = makeLayer(CLASS_W, H), Ch = makeLayer(CLASS_W, H);
    for (const s of row) {
      drawDesk(D.g, s.x, s.y - 9, r);
      drawChair(Ch.g, s.x, s.y, r);
    }
    out.desks.push(D.c); out.chairs.push(Ch.c);
  }
  return out;
}

/** A pale wooden school desk, seen from behind and a little above. */
function drawDesk(g, x, base, r) {
  const w = 30, top = base - 20;
  const dk = shade(WOOD, -0.5);
  box(g, x - w / 2 - 1, top - 1, w + 2, 6, dk);
  box(g, x - w / 2, top, w, 4, shade(WOOD, 0.1));                   // the top, catching the light
  box(g, x - w / 2, top, w, 1, shade(WOOD, 0.22));
  box(g, x - w / 2, top + 3, w, 1, shade(WOOD, -0.1));
  // things left on it
  if (r.chance(0.7)) block(g, x - 8 + r.i(0, 6), top - 1, 9, 2, ['#f2ecdc', '#e8f0f4', '#f6e0d0'][r.i(0, 2)]);
  if (r.chance(0.3)) block(g, x + 6, top - 5, 3, 5, '#9fd8e8');
  if (r.chance(0.25)) block(g, x - 12, top - 1, 6, 2, ['#d8a03c', '#c25a4a', '#6ea04a'][r.i(0, 2)]);
  // the shelf under it, dark, with somebody's books in it
  box(g, x - w / 2, top + 4, w, 7, shade(WOOD, -0.42));
  box(g, x - w / 2 + 2, top + 5, w - 4, 5, shade(WOOD, -0.6));
  if (r.chance(0.6)) box(g, x - 8, top + 6, 12, 3, ['#3a6aa8', '#c25a4a', '#f2ecdc'][r.i(0, 2)]);
  // legs
  for (const lx of [x - w / 2, x + w / 2 - 2]) { box(g, lx - 1, top + 11, 4, base - top - 11, dk); box(g, lx, top + 11, 2, base - top - 11, shade(WOOD, -0.15)); }
}

/** A wooden chair from behind: a two-slat back, a seat, four legs. */
function drawChair(g, x, y, r) {
  const dk = shade(WOOD, -0.5);
  const seat = y - 12;
  // legs
  for (const lx of [x - 8, x + 6]) { box(g, lx - 1, seat, 4, y - seat, dk); box(g, lx, seat, 2, y - seat, shade(WOOD, -0.1)); }
  // seat edge
  box(g, x - 9, seat - 1, 19, 4, dk); box(g, x - 8, seat, 17, 2, WOOD);
  // back posts and the two slats
  for (const lx of [x - 8, x + 6]) { box(g, lx - 1, seat - 16, 4, 16, dk); box(g, lx, seat - 15, 2, 15, WOOD); box(g, lx, seat - 15, 1, 15, shade(WOOD, 0.14)); }
  for (const sy of [seat - 15, seat - 8]) {
    box(g, x - 9, sy - 1, 19, 5, dk);
    box(g, x - 8, sy, 17, 3, WOOD);
    box(g, x - 8, sy, 17, 1, shade(WOOD, 0.18));
  }
  // a backpack hung over it, some of the time
  if (r.chance(0.35)) {
    const col = ['#2a3a6a', '#d85a8a', '#2a2a30', '#3a8ac8'][r.i(0, 3)];
    const bx = x + (r.chance(0.5) ? 5 : -12);
    block(g, bx, seat - 14, 8, 11, col);
    box(g, bx + 1, seat - 9, 6, 1, shade(col, -0.3));
    box(g, bx + 2, seat - 15, 1, 2, shade(col, -0.3)); box(g, bx + 5, seat - 15, 1, 2, shade(col, -0.3));
  }
}

/* ------------------------------------------------------------------- draw */

export function drawClassroom(ctx, cam, t, o = {}) {
  if (!bg) bg = bakeRoom();
  ctx.drawImage(bg.c, -Math.round(cam), 0);
  // ceiling fans, turning
  for (const fx of [220, 460, 700, 940]) {
    const x = fx - cam;
    if (x < -30 || x > W + 30) continue;
    box(ctx, x - 1, 26, 2, 12, '#2a2a2a');
    box(ctx, x - 3, 38, 6, 4, '#8a8478');
    const a = t * 7 * (o.fanSpeed === undefined ? 1 : o.fanSpeed);
    for (let i = 0; i < 3; i++) {
      const aa = a + (i * Math.PI * 2) / 3;
      ctx.fillStyle = 'rgba(90,84,74,0.9)';
      for (let k = 3; k < 20; k++) ctx.fillRect(Math.round(x + Math.cos(aa) * k), Math.round(40 + Math.sin(aa) * k * 0.25), 1, 2);
    }
  }
  // tube lights on the ceiling
  for (const lx of [120, 340, 580, 820]) {
    const x = lx - cam;
    if (x < -40 || x > W + 40) continue;
    box(ctx, x - 22, 16, 44, 5, '#d8d4c8'); box(ctx, x - 20, 20, 40, 2, '#fffef6');
  }
  // the clock's hands
  const cx = 350 - cam;
  if (cx > -20 && cx < W + 20) {
    const a = (o.clock === undefined ? 0.2 : o.clock) * Math.PI * 2;
    ctx.fillStyle = '#2a2420';
    for (let i = 0; i < 5; i++) ctx.fillRect(Math.round(cx + Math.cos(a - 1.57) * i), Math.round(68 + Math.sin(a - 1.57) * i), 1, 1);
    for (let i = 0; i < 6; i++) ctx.fillRect(Math.round(cx + Math.cos(a * 12 - 1.57) * i), Math.round(68 + Math.sin(a * 12 - 1.57) * i), 1, 1);
  }
}

/** Row layers: desks go behind the people in a row, chairs in front of them. */
export function classRow(ctx, cam, r, part) {
  if (!rowLayers) rowLayers = bakeRows();
  const c = part === 'desks' ? rowLayers.desks[r] : rowLayers.chairs[r];
  if (c) ctx.drawImage(c, -Math.round(cam), 0);
}
