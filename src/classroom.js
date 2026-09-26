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
import { drawCeilingFan, drawTube } from './school.js';

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
  // posters to the right of the board: the Thai alphabet, a cat, the timetable,
  // the class's own drawings pinned to a board, little houses
  posterAlphabet(g, 398, 98);
  posterCat(g, 446, 96);
  posterKidsArt(g, 444, 140);
  posterTimetable(g, 488, 102);
  block(g, 524, 96, 20, 80, '#f6f2e6');
  for (let i = 0; i < 5; i++) {
    const hx = 527 + (i % 2) * 5, hy = 100 + i * 15;
    // a little house: walls, a door, a pointed roof
    box(g, hx, hy + 6, 10, 7, ['#f2b23c', '#46b0d8', '#e84a8a', '#8ac84a', '#b070d8'][i]);
    box(g, hx + 9, hy + 7, 1, 6, shade(['#f2b23c', '#46b0d8', '#e84a8a', '#8ac84a', '#b070d8'][i], -0.25));
    box(g, hx + 4, hy + 9, 2, 4, '#6a4428');
    box(g, hx + 1, hy + 8, 2, 2, '#e8f4fc');
    for (let k = 0; k < 5; k++) box(g, hx + 5 - k, hy + k + 1, k * 2 + 1, 1, k === 4 ? '#8a2a1c' : '#c8402c');
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


/* ------------------------------------------------------------- posters */

/*  The Thai alphabet, the way it hangs in every primary classroom: each
    letter in its box with the little picture that goes with it.  At this
    size the letters are marks of three by four pixels, but the marks are the
    right shapes: loops at the head, the tails and the notches.            */
const GLYPHS = [
  ['111', '001', '101', '101'], ['101', '101', '101', '111'], ['111', '101', '011', '101'],
  ['011', '001', '101', '111'], ['111', '001', '011', '111'], ['101', '111', '101', '101'],
  ['111', '101', '111', '101'], ['110', '101', '101', '101'], ['101', '101', '111', '011'],
  ['111', '100', '111', '001'], ['011', '101', '101', '110'], ['101', '101', '011', '001'],
];
function posterAlphabet(g, x, y) {
  block(g, x, y, 40, 54, '#fbf8ee');
  box(g, x, y, 40, 8, '#e05a8a');
  box(g, x, y + 8, 40, 1, '#a83a62');
  for (let i = 0; i < 4; i++) box(g, x + 4 + i * 9, y + 3, 6, 2, '#fbe8f0');
  const pics = ['#e84a4a', '#f2b23c', '#46b0d8', '#8ac84a', '#b070d8', '#f07a3a'];
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 6; c++) {
      const cx = x + 2 + c * 6, cy = y + 11 + r * 6;
      const gl = GLYPHS[(r * 7 + c * 5 + r * c * 3) % GLYPHS.length];
      for (let j = 0; j < 4; j++) for (let i = 0; i < 3; i++) if (gl[j][i] === '1') box(g, cx + i, cy + j, 1, 1, (r + c) % 4 === 0 ? '#c83a3a' : '#2a2a3a');
      box(g, cx + 4, cy + 3, 1, 1, pics[(r * 3 + c) % 6]);
    }
  }
}
function posterCat(g, x, y) {
  block(g, x, y, 36, 42, '#f4ecd0');
  box(g, x, y + 34, 36, 8, '#f2b23c');
  for (let i = 0; i < 5; i++) box(g, x + 4 + i * 6, y + 37, 4, 2, '#8a5010');
  // a round cartoon cat, black ears, pink nose, whiskers
  blob(g, x + 18, y + 20, 11, 10, '#fbfaf4', '#2a2a2a');
  for (const d of [-1, 1]) {
    for (let k = 0; k < 5; k++) box(g, x + 18 + d * (6 + k * 0.4) - (d < 0 ? 3 : 0), y + 7 + k, 4 - Math.floor(k * 0.6), 1, '#2a2a2a');
    ell(g, x + 18 + d * 5, y + 18, 2, 2.4, '#2a2a2a');
    box(g, x + 18 + d * 5 - (d < 0 ? 0 : 1), y + 17, 1, 1, '#ffffff');
    for (let k = 0; k < 2; k++) box(g, x + 18 + d * 9 - (d < 0 ? 4 : 0), y + 21 + k * 2, 5, 1, '#8a8a8a');
    ell(g, x + 18 + d * 7, y + 23, 2, 1.2, '#f4b8c8');
  }
  box(g, x + 17, y + 21, 3, 2, '#e05a7a');
  box(g, x + 16, y + 24, 2, 1, '#2a2a2a'); box(g, x + 19, y + 24, 2, 1, '#2a2a2a');
}
function posterKidsArt(g, x, y) {
  // a cork board of the class's own drawings
  block(g, x, y, 40, 36, '#3a6aa8');
  texture(g, x + 2, y + 2, 36, 32, (px, py) => mul([196, 150, 100], 0.9 + hash(px, py, 71) * 0.16));
  // a house under a sun
  block(g, x + 4, y + 4, 15, 13, '#fbf8f0');
  ell(g, x + 15, y + 7, 2, 2, '#f2b23c');
  box(g, x + 6, y + 11, 6, 4, '#e84a4a'); for (let k = 0; k < 3; k++) box(g, x + 9 - k, y + 8 + k, k * 2 + 1, 1, '#6a4428');
  box(g, x + 4, y + 15, 15, 2, '#8ac84a');
  // a flower
  block(g, x + 22, y + 3, 14, 14, '#fdf4d8');
  box(g, x + 28, y + 9, 1, 6, '#4e8a3c');
  for (const [dx, dy] of [[-2, 0], [2, 0], [0, -2], [0, 2]]) box(g, x + 28 + dx - 1, y + 7 + dy - 1, 2, 2, '#b070d8');
  box(g, x + 28, y + 7, 1, 1, '#f2d23c');
  // the family, holding hands
  block(g, x + 4, y + 20, 15, 12, '#e8f4fc');
  for (let k = 0; k < 3; k++) { box(g, x + 7 + k * 4, y + 23, 2, 2, '#e8b890'); box(g, x + 7 + k * 4, y + 25, 2, 4, ['#e84a4a', '#3a8ae8', '#f2b23c'][k]); }
  box(g, x + 7, y + 26, 10, 1, '#e8b890');
  // a fish
  block(g, x + 22, y + 20, 14, 12, '#fbf8f0');
  ell(g, x + 28, y + 26, 4, 2.5, '#f07a3a'); for (let k = 0; k < 3; k++) box(g, x + 32 + k, y + 25 - k, 1, k * 2 + 1, '#f07a3a');
  box(g, x + 26, y + 25, 1, 1, '#2a2a2a');
  // the pins
  for (const [dx, dy] of [[11, 4], [29, 3], [11, 20], [29, 20]]) box(g, x + dx, y + dy - 1, 2, 2, ['#e84a4a', '#3a8ae8', '#f2c23c', '#6ec84a'][(dx + dy) % 4]);
}
function posterTimetable(g, x, y) {
  // the week's timetable, each day in its own colour, the way Thai days have colours
  block(g, x, y, 30, 48, '#fbf8f0');
  box(g, x, y, 30, 6, '#3f6ea8');
  for (let i = 0; i < 5; i++) box(g, x + 3 + i * 5, y + 2, 3, 1, '#e8f0f8');
  const days = ['#f2d23c', '#f08ab0', '#6ec84a', '#f2923c', '#5a9ae0'];
  for (let d = 0; d < 5; d++) {
    const yy = y + 9 + d * 7;
    box(g, x + 2, yy, 5, 6, days[d]);
    for (let p2 = 0; p2 < 4; p2++) {
      box(g, x + 9 + p2 * 5, yy, 4, 6, '#f4f0e6');
      box(g, x + 9 + p2 * 5, yy + 2, 3 - ((d + p2) % 2), 1, '#6a6254');
      box(g, x + 9 + p2 * 5, yy + 4, 2 + ((d * p2) % 2), 1, '#a89e8c');
    }
  }
  box(g, x + 2, y + 45, 26, 1, '#c8c0b0');
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

/** A pale wooden school desk, seen from behind and a little above: you see
 *  its top, the shelf under it where the books live, and four square legs. */
function drawDesk(g, x, base, r) {
  const w = 32, depth = 6, top = base - 22;
  const L = x - w / 2;
  const hi = shade(WOOD, 0.16), mid = WOOD, sh = shade(WOOD, -0.18), dk = shade(WOOD, -0.52), dd = shade(WOOD, -0.66);
  // far legs, then the shelf box, then the top, then the near legs
  for (const lx of [L + 2, L + w - 4]) { box(g, lx - 1, top + 2, 4, base - top - 6, dk); box(g, lx, top + 2, 2, base - top - 6, sh); }
  // the shelf under the top: dark inside, books and a lunch box in it
  box(g, L - 1, top + depth, w + 2, 9, dk);
  box(g, L + 1, top + depth + 1, w - 2, 6, dd);
  let bx = L + 3;
  while (bx < L + w - 6) {
    if (r.chance(0.7)) {
      const bw = r.i(2, 4), bh = r.i(3, 5);
      box(g, bx, top + depth + 7 - bh, bw, bh, ['#3a6aa8', '#c25a4a', '#f2ecdc', '#6ea04a', '#e8b83c', '#8a5ad8'][r.i(0, 5)]);
      box(g, bx, top + depth + 7 - bh, 1, bh, 'rgba(255,255,255,0.25)');
      bx += bw;
    } else bx += 3;
  }
  box(g, L, top + depth + 7, w, 2, sh);                   // the shelf's front rail
  box(g, L, top + depth + 7, w, 1, mid);
  // the top: a slab in perspective, grain running across it
  box(g, L - 1, top - 1, w + 2, depth + 2, dk);
  texture(g, L, top, w, depth, (px, py) => {
    const k = 0.94 + Math.sin((px - L) * 0.7 + (py - top) * 2.3 + x) * 0.03 + hash(px, py, x) * 0.05 + (py - top) * 0.012;
    const c = (py - top) === 0 ? hi : mid;
    const n = parseInt(c.slice(1), 16);
    return mul([(n >> 16) & 255, (n >> 8) & 255, n & 255], k);
  });
  box(g, L, top + depth - 1, w, 1, sh);
  box(g, L, top + depth, w, 1, dk);
  // somebody's initials cut into it, a long time ago
  if (r.chance(0.3)) { box(g, L + 5 + r.i(0, 16), top + 2, 3, 1, sh); box(g, L + 6 + r.i(0, 16), top + 3, 2, 1, sh); }
  // what is on the desk: an open exercise book, a pencil case, a bottle
  if (r.chance(0.75)) {
    const ox = L + 4 + r.i(0, 10);
    box(g, ox - 1, top + 1, 14, 4, '#b8b0a0');
    box(g, ox, top + 1, 6, 3, '#fbf8f0'); box(g, ox + 7, top + 1, 6, 3, '#f4f0e6');
    box(g, ox + 6, top + 1, 1, 3, '#d8d0c0');
    for (let k = 0; k < 2; k++) { box(g, ox + 1, top + 2 + k, 4, 1, 'rgba(90,110,160,0.5)'); box(g, ox + 8, top + 2 + k, 4, 1, 'rgba(90,110,160,0.5)'); }
  }
  if (r.chance(0.5)) {
    const c = ['#e85a8a', '#3a8ae8', '#f2c23c', '#6ec84a', '#2a2a30'][r.i(0, 4)];
    box(g, L + w - 10, top, 7, 3, shade(c, -0.4)); box(g, L + w - 9, top, 5, 2, c); box(g, L + w - 9, top, 5, 1, shade(c, 0.25));
  }
  if (r.chance(0.3)) { box(g, L + 2, top - 6, 4, 7, '#5a7a8a'); box(g, L + 3, top - 5, 2, 5, '#b8e0f0'); box(g, L + 3, top - 7, 2, 1, '#3a8ae8'); }
  // near legs, with a crossbar low between them
  for (const lx of [L, L + w - 3]) { box(g, lx - 1, top + depth, 4, base - top - depth, dk); box(g, lx, top + depth, 2, base - top - depth, mid); box(g, lx, top + depth, 1, base - top - depth, hi); }
  box(g, L, base - 6, w, 2, dk); box(g, L + 1, base - 6, w - 2, 1, sh);
}

/** A wooden chair from behind: a low two-slat back you can see the sitter's
 *  shirt through, a seat, four legs and a stretcher.  Drawn in front of them. */
function drawChair(g, x, y, r) {
  const hi = shade(WOOD, 0.18), mid = WOOD, sh = shade(WOOD, -0.16), dk = shade(WOOD, -0.52);
  const seat = y - 12;
  // back legs run from the floor right up to the top of the back
  for (const lx of [x - 8, x + 6]) {
    box(g, lx - 1, seat - 12, 4, y - seat + 12, dk);
    box(g, lx, seat - 11, 2, y - seat + 11, mid);
    box(g, lx, seat - 11, 1, y - seat + 11, hi);
  }
  // the seat's edge
  box(g, x - 10, seat - 1, 21, 4, dk);
  box(g, x - 9, seat, 19, 2, mid);
  box(g, x - 9, seat, 19, 1, hi);
  // two slats, with a gap between them
  for (const [sy, sh2] of [[seat - 11, 3], [seat - 5, 2]]) {
    box(g, x - 9, sy - 1, 19, sh2 + 2, dk);
    box(g, x - 8, sy, 17, sh2, mid);
    box(g, x - 8, sy, 17, 1, hi);
    if (sh2 > 2) box(g, x - 8, sy + sh2 - 1, 17, 1, sh);
  }
  // a stretcher between the legs
  box(g, x - 8, y - 5, 17, 2, dk); box(g, x - 7, y - 5, 15, 1, sh);
  // a bag hung on the back, some of the time
  if (r.chance(0.35)) {
    const col = ['#2a3a6a', '#d85a8a', '#2a2a30', '#3a8ac8', '#6a4a8a'][r.i(0, 4)];
    const bx = x + (r.chance(0.5) ? 7 : -15);
    block(g, bx, seat - 9, 8, 12, col);
    box(g, bx + 1, seat - 3, 6, 4, shade(col, -0.2));
    box(g, bx + 1, seat - 3, 6, 1, shade(col, 0.2));
    box(g, bx + 2, seat - 11, 1, 3, shade(col, -0.35)); box(g, bx + 5, seat - 11, 1, 3, shade(col, -0.35));
    box(g, bx + 3, seat - 6, 2, 1, '#d8c06a');
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
    drawCeilingFan(ctx, x, 26, 40, t, o.fanSpeed === undefined ? 1 : o.fanSpeed);
  }
  // tube lights on the ceiling
  for (const lx of [120, 340, 580, 820]) {
    const x = lx - cam;
    if (x < -40 || x > W + 40) continue;
    drawTube(ctx, x, 16);
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
