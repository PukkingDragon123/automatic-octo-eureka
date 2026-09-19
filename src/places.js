/* ============================================================================
 *  places.js — the rooms and the road up the mountain.
 *
 *  Side-on, flat, and specific: a Bangkok school block with its louvre
 *  windows and ceiling fans, the canteen at the back, the gate and the soi
 *  outside it, then the trail, the spirit house, the termite mound people
 *  leave cloth on, and the butterfly pea field at the top.
 * ==========================================================================*/

import { rng, clamp, lerp, shade, rgba, fillEllipse, px } from './core.js';
import { W, H } from './vista.js';

const R = rng(4242);
const box = (ctx, x, y, w, h, c) => {
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
};
const vgrad = (ctx, x, y, w, h, a, b) => {
  for (let i = 0; i < h; i++) box(ctx, x, y + i, w, 1, lerp2(a, b, i / Math.max(1, h - 1)));
};
function lerp2(a, b, t) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const r = Math.round(lerp((pa >> 16) & 255, (pb >> 16) & 255, t));
  const g = Math.round(lerp((pa >> 8) & 255, (pb >> 8) & 255, t));
  const bl = Math.round(lerp(pa & 255, pb & 255, t));
  return '#' + ((r << 16) | (g << 8) | bl).toString(16).padStart(6, '0');
}

/* ------------------------------------------------------------- classroom --*/

const CR = {
  wallTop: '#e7e2d2', wallBot: '#cfc9b6', dado: '#8a9a86', floor: '#b8a482',
  floorSh: '#9c8a6c', board: '#2c4436', boardEdge: '#7a6244', desk: '#c39a5e',
  deskSh: '#9a7544', frame: '#6f7a80', light: '#fff8d8',
};

export function drawClassroom(ctx, cam, t, G = {}) {
  const gy = 248;
  const dusk = G.dusk || 0;
  // back wall
  vgrad(ctx, 0, 0, W, gy - 26, CR.wallTop, CR.wallBot);
  box(ctx, 0, gy - 28, W, 6, CR.dado);
  box(ctx, 0, gy - 23, W, 1, shade(CR.dado, -0.25));
  // floor, in receding bands
  box(ctx, 0, gy - 22, W, H - gy + 22, CR.floor);
  for (let i = 0; i < 9; i++) {
    box(ctx, 0, gy - 22 + i * 7, W, 1, shade(CR.floor, -0.1 - i * 0.012));
  }
  for (let x = -Math.round(cam * 0.9) % 44; x < W; x += 44) box(ctx, x, gy - 22, 1, H - gy + 22, CR.floorSh);

  const v = (wx) => wx - cam;

  /* the board wall, at the left end of the room */
  const bx = v(70);
  if (bx > -260 && bx < W + 40) {
    box(ctx, bx - 8, 96, 232, 78, CR.boardEdge);
    box(ctx, bx - 5, 99, 226, 72, CR.board);
    box(ctx, bx - 5, 99, 226, 2, shade(CR.board, 0.16));
    // chalk: a date, a diagram, the day's homework
    ctx.fillStyle = 'rgba(240,240,228,0.82)';
    for (let i = 0; i < 6; i++) ctx.fillRect(Math.round(bx + 6 + i * 13), 108, 8, 1);
    for (let i = 0; i < 4; i++) ctx.fillRect(Math.round(bx + 6), 118 + i * 9, 60 + (i % 2) * 40, 1);
    ctx.fillRect(Math.round(bx + 130), 120, 40, 1);
    ctx.fillRect(Math.round(bx + 130), 120, 1, 26);
    ctx.fillRect(Math.round(bx + 169), 120, 1, 26);
    ctx.fillRect(Math.round(bx + 130), 146, 40, 1);
    ctx.fillRect(Math.round(bx + 136), 128, 28, 1);
    // chalk tray, a duster, two sticks of chalk
    box(ctx, bx - 8, 174, 232, 3, shade(CR.boardEdge, -0.2));
    box(ctx, bx + 24, 171, 9, 3, '#d8cfc0');
    box(ctx, bx + 40, 172, 5, 2, '#f4f0e4');
    // over the board: the flag, a portrait, and a small shelf for the Buddha
    thaiFlag(ctx, bx + 6, 66);
    box(ctx, bx + 76, 60, 34, 30, '#b8973c');
    box(ctx, bx + 79, 63, 28, 24, '#dfd2b4');
    box(ctx, bx + 86, 70, 14, 14, '#9a8a6a');
    box(ctx, bx + 88, 68, 10, 8, '#c2ab86');
    box(ctx, bx + 128, 74, 40, 4, '#a8905e');          // the shelf
    buddha(ctx, bx + 148, 74);
    box(ctx, bx + 134, 70, 5, 4, '#e8b84a');           // marigold garland
    box(ctx, bx + 160, 70, 5, 4, '#e8b84a');
  }

  /* the wall clock and a duty roster */
  const cx2 = v(320);
  if (cx2 > -30 && cx2 < W + 30) {
    box(ctx, cx2 - 9, 70, 18, 18, '#efe9da');
    box(ctx, cx2 - 7, 72, 14, 14, '#fbf7ec');
    const a = (G.clock === undefined ? t * 0.2 : G.clock) * Math.PI * 2;
    ctx.fillStyle = '#3a3440';
    for (let i = 0; i < 5; i++) ctx.fillRect(Math.round(cx2 + Math.cos(a - 1.57) * i), Math.round(79 + Math.sin(a - 1.57) * i), 1, 1);
    for (let i = 0; i < 4; i++) ctx.fillRect(Math.round(cx2 + Math.cos(a * 12 - 1.57) * i), Math.round(79 + Math.sin(a * 12 - 1.57) * i), 1, 1);
  }
  const rx = v(370);
  if (rx > -40 && rx < W + 40) {
    box(ctx, rx, 92, 40, 30, '#e8dfc8');
    box(ctx, rx + 1, 93, 38, 28, '#f6f0e0');
    for (let i = 0; i < 6; i++) box(ctx, rx + 4, 97 + i * 4, 20 + (i % 3) * 8, 1, '#8a8274');
    box(ctx, rx + 30, 96, 7, 7, '#c25a4a');
  }

  /* a map of the country, and the cupboard nobody is allowed in */
  const mx = v(340);
  if (mx > -60 && mx < W + 20) {
    box(ctx, mx, 96, 52, 56, '#8a7250');
    box(ctx, mx + 2, 98, 48, 52, '#dfe8ea');
    box(ctx, mx + 18, 102, 12, 20, '#a8c48a');
    box(ctx, mx + 15, 118, 16, 18, '#c4cf8a');
    box(ctx, mx + 20, 132, 9, 14, '#a8c48a');
    box(ctx, mx + 24, 142, 5, 6, '#a8c48a');
    box(ctx, mx + 2, 98, 48, 3, '#bcc8ca');
  }
  const cbx = v(560);
  if (cbx > -60 && cbx < W + 20) {
    box(ctx, cbx, gy - 62, 54, 62, '#b49a6a');
    box(ctx, cbx, gy - 62, 54, 3, '#c9b285');
    box(ctx, cbx + 2, gy - 58, 24, 26, '#a08856');
    box(ctx, cbx + 28, gy - 58, 24, 26, '#a08856');
    box(ctx, cbx + 2, gy - 30, 50, 26, '#a08856');
    box(ctx, cbx + 24, gy - 46, 3, 3, '#6a5a3a');
    box(ctx, cbx + 28, gy - 46, 3, 3, '#6a5a3a');
    box(ctx, cbx + 6, gy - 66, 14, 4, '#6f8f58');       // a plant on top
    box(ctx, cbx + 9, gy - 72, 3, 7, '#4e8a3c');
    box(ctx, cbx + 13, gy - 70, 3, 5, '#3f7030');
  }

  /* louvre windows down the right-hand wall, with the yard outside */
  for (const wx of [640, 730, 820]) {
    const x = v(wx);
    if (x < -70 || x > W + 10) continue;
    box(ctx, x, 84, 62, 82, CR.frame);
    box(ctx, x + 2, 86, 58, 78, lerp2('#bfe0ea', '#8fc4d6', 0.2));
    // what you can see through it
    box(ctx, x + 2, 136, 58, 28, '#8fae62');
    box(ctx, x + 6, 118, 22, 22, '#4e7c3c');
    box(ctx, x + 10, 126, 14, 20, '#3f6a32');
    box(ctx, x + 36, 124, 20, 16, '#5c8a44');
    box(ctx, x + 2, 154, 58, 10, '#a89a74');
    // glass louvres, and the frame over them
    for (let i = 0; i < 9; i++) {
      ctx.fillStyle = rgba('#ffffff', i % 2 ? 0.14 : 0.06);
      ctx.fillRect(Math.round(x + 2), 88 + i * 8, 58, 3);
    }
    box(ctx, x + 30, 84, 2, 82, CR.frame);
    box(ctx, x, 84, 62, 3, shade(CR.frame, 0.2));
    box(ctx, x - 2, 166, 66, 4, '#d8d2c0');
  }
  // the light those windows throw across the floor
  ctx.globalAlpha = 0.16 * (1 - dusk);
  for (const wx of [640, 730, 820]) {
    const x = v(wx);
    ctx.fillStyle = CR.light;
    ctx.beginPath();
    ctx.moveTo(x + 4, 166); ctx.lineTo(x + 58, 166);
    ctx.lineTo(x + 6, gy + 30); ctx.lineTo(x - 54, gy + 30);
    ctx.closePath(); ctx.fill();
  }
  ctx.globalAlpha = 1;

  /* ceiling fans */
  for (const fx of [180, 400, 620, 840]) {
    const x = v(fx);
    if (x < -30 || x > W + 30) continue;
    fan(ctx, x, 20, t * (G.fanSpeed === undefined ? 1 : G.fanSpeed));
  }
  // a strip light between them
  for (const lx of [290, 510, 730]) {
    const x = v(lx);
    box(ctx, x - 22, 16, 44, 4, '#d6d2c4');
    box(ctx, x - 20, 20, 40, 2, dusk > 0.4 ? '#fff4cc' : '#e8e4d4');
  }

  /* the broom and bin in the corner, from the cleaning roster */
  const brx = v(900);
  if (brx < W + 20) {
    box(ctx, brx, gy - 40, 2, 40, '#a8804a');
    box(ctx, brx - 4, gy - 8, 10, 8, '#d8b060');
    box(ctx, brx + 14, gy - 14, 14, 14, '#5d7f9a');
    box(ctx, brx + 14, gy - 15, 14, 2, '#4a6a82');
  }
}

export function classroomDesks() {
  // where the desks are, so people and the script can line up with them
  const out = [];
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 2; col++) out.push({ x: 176 + row * 98 + col * 44, y: 248 });
  }
  return out;
}

/** A row of desk backs right under the camera, for depth. */
export function drawFrontRow(ctx, cam) {
  for (let wx = 120; wx < 760; wx += 98) {
    const x = wx - cam * 1.16 + 30;
    if (x < -40 || x > W + 40) continue;
    box(ctx, x - 22, H - 16, 44, 4, CR.desk);
    box(ctx, x - 22, H - 12, 44, 3, CR.deskSh);
    box(ctx, x - 21, H - 9, 42, 9, shade(CR.desk, -0.34));
  }
}

/* A desk comes in two halves: the chair and back legs go in behind whoever is
   sitting, the top and the front panel go in front of them, which is what
   makes them read as sitting at it rather than standing behind it.          */
export function drawDeskBack(ctx, x, y) {
  box(ctx, x - 24, y - 13, 13, 2, CR.desk);               // the chair seat
  box(ctx, x - 23, y - 11, 2, 11, CR.frame);
  box(ctx, x - 13, y - 11, 2, 11, CR.frame);
  box(ctx, x - 24, y - 25, 2, 13, CR.frame);              // its back
  box(ctx, x - 24, y - 25, 13, 2, CR.desk);
  box(ctx, x + 11, y - 18, 2, 18, CR.frame);              // the far desk leg
}

export function drawDeskFront(ctx, x, y, o = {}) {
  const w = 30;
  if (o.bag) { box(ctx, x - 4, y - 9, 10, 9, '#5d4a6a'); box(ctx, x - 4, y - 9, 10, 2, '#42334c'); }
  box(ctx, x - w / 2, y - 24, w, 3, CR.desk);             // the top
  box(ctx, x - w / 2, y - 21, w, 2, CR.deskSh);
  box(ctx, x - w / 2 + 1, y - 19, w - 2, 15, shade(CR.desk, -0.3));  // the front panel, down to the floor
  box(ctx, x - w / 2 + 2, y - 12, 2, 12, CR.frame);       // near leg
  box(ctx, x + w / 2 - 4, y - 12, 2, 12, CR.frame);
  if (o.book) {
    box(ctx, x - 7, y - 27, 12, 3, '#f2ecdc');
    box(ctx, x - 7, y - 25, 12, 1, '#c8c0aa');
    box(ctx, x + 4, y - 27, 1, 3, '#c25a4a');
  }
  if (o.bottle) { box(ctx, x + 8, y - 32, 3, 8, '#9fd8e8'); box(ctx, x + 8, y - 33, 3, 1, '#d84f4f'); }
}

export function drawDesk(ctx, x, y, o = {}) { drawDeskBack(ctx, x, y); drawDeskFront(ctx, x, y, o); }

function fan(ctx, x, y, t) {
  box(ctx, x - 1, y - 20, 2, 20, '#8c8878');
  box(ctx, x - 3, y, 6, 4, '#b4ae9c');
  const a = t * 7;
  for (let i = 0; i < 3; i++) {
    const aa = a + (i * Math.PI * 2) / 3;
    const len = 20;
    const dx = Math.cos(aa), dz = Math.sin(aa) * 0.28;
    ctx.fillStyle = rgba('#9a9486', 0.85);
    for (let k = 3; k < len; k++) ctx.fillRect(Math.round(x + dx * k), Math.round(y + 2 + dz * k), 1, 2);
  }
}

function thaiFlag(ctx, x, y) {
  const w = 30, h = 20;
  box(ctx, x, y, w, h, '#f4f4f0');
  box(ctx, x, y, w, 3, '#a51931');
  box(ctx, x, y + h - 3, w, 3, '#a51931');
  box(ctx, x, y + 7, w, 6, '#2d2a4a');
  box(ctx, x - 1, y - 1, 1, h + 2, '#8a7a5a');
}

function buddha(ctx, x, y) {
  box(ctx, x - 5, y - 4, 10, 4, '#c8a44a');       // the base
  box(ctx, x - 4, y - 10, 8, 6, '#d8b45a');       // the body
  box(ctx, x - 2, y - 14, 4, 4, '#d8b45a');       // the head
  box(ctx, x - 1, y - 16, 2, 2, '#e8c86a');       // the flame
}

/* -------------------------------------------------------------- corridor --*/

export function drawCorridor(ctx, cam, t) {
  const gy = 248;
  const v = (wx) => wx - cam;
  /* the classroom wall you walk along */
  box(ctx, 0, 0, W, 200, '#ded6c0');
  box(ctx, 0, 26, W, 5, '#c2b99e');
  box(ctx, 0, 192, W, 8, '#c2b99e');
  for (let wx = 40; wx < 960; wx += 150) {
    const x = v(wx);
    if (x < -120 || x > W + 20) continue;
    box(ctx, x, 62, 36, 130, '#a8916a');          // a classroom door
    box(ctx, x + 2, 64, 32, 126, '#c2a878');
    box(ctx, x + 4, 68, 28, 44, '#8fa8b4');
    for (let i = 0; i < 5; i++) { ctx.fillStyle = rgba('#ffffff', i % 2 ? 0.2 : 0.07); ctx.fillRect(Math.round(x + 4), 70 + i * 8, 28, 3); }
    box(ctx, x + 29, 130, 3, 7, '#6a5a3a');
    box(ctx, x + 7, 44, 22, 13, '#f2ecdc');       // the room number
    for (let i = 0; i < 3; i++) box(ctx, x + 11 + i * 5, 48, 3, 5, '#5a5248');
    box(ctx, x + 46, 72, 70, 76, '#9aa8ae');      // and its window
    box(ctx, x + 48, 74, 66, 72, '#bcd4dc');
    box(ctx, x + 79, 72, 3, 76, '#9aa8ae');
    for (let i = 0; i < 9; i++) { ctx.fillStyle = rgba('#ffffff', i % 2 ? 0.16 : 0.05); ctx.fillRect(Math.round(x + 48), 76 + i * 8, 66, 3); }
    box(ctx, x + 46, 148, 72, 4, '#c8bfa4');
  }
  /* the walkway floor */
  box(ctx, 0, 200, W, H - 200, '#a8a08c');
  box(ctx, 0, 200, W, 3, '#8f8774');
  for (let i = 0; i < 12; i++) box(ctx, 0, 204 + i * 8, W, 1, shade('#a8a08c', -0.04 - i * 0.012));
  for (let x = -Math.round(cam) % 52; x < W; x += 52) box(ctx, x, 200, 1, H - 200, '#958d7a');
  ctx.globalAlpha = 0.18;
  box(ctx, 0, 200, W, 10, '#3a3630');            // the wall's shadow on the floor
  ctx.globalAlpha = 1;

  /* things standing against the wall */
  for (const wx of [128, 368, 608, 830]) {
    const x = v(wx);
    if (x < -20 || x > W + 20) continue;
    box(ctx, x - 7, gy - 12, 14, 12, '#b06a4a');
    box(ctx, x - 8, gy - 14, 16, 3, '#c07a58');
    for (let i = 0; i < 7; i++) {
      const a2 = (i / 7) * Math.PI * 2 + t * 0.2;
      box(ctx, x + Math.cos(a2) * 7, gy - 18 - Math.abs(Math.sin(a2)) * 10, 3, 8, i % 2 ? '#4e8a3c' : '#3f7030');
    }
  }
  const nb = v(294);
  if (nb > -80 && nb < W + 20) {
    box(ctx, nb, 74, 70, 50, '#8a7250');
    box(ctx, nb + 2, 76, 66, 46, '#d8cfb8');
    for (let i = 0; i < 6; i++) {
      box(ctx, nb + 6 + (i % 3) * 21, 80 + Math.floor(i / 3) * 21, 18, 18, ['#f2ece0', '#e8dcc0', '#dfe8f0'][i % 3]);
    }
  }
  const wc = v(470);
  if (wc > -20 && wc < W + 20) {
    box(ctx, wc - 9, gy - 34, 18, 34, '#dfe4e8');
    box(ctx, wc - 9, gy - 34, 18, 4, '#b8c0c8');
    box(ctx, wc - 6, gy - 46, 12, 12, '#a8d8e8');
    box(ctx, wc - 2, gy - 24, 4, 3, '#8a9098');
  }
  const sr = v(722);
  if (sr > -50 && sr < W + 20) {
    box(ctx, sr, gy - 16, 46, 16, '#a89060');
    box(ctx, sr, gy - 16, 46, 2, '#c2a878');
    for (let i = 0; i < 6; i++) box(ctx, sr + 3 + i * 7, gy - 13, 5, 3, ['#2a2730', '#c25a4a', '#2a2730', '#3f6ea8', '#2a2730', '#2a2730'][i]);
  }
}

/** The roof over it, and the open side at the bottom of the frame. */
export function drawCorridorFg(ctx, cam, t) {
  const v = (wx) => wx - cam;
  // roof
  box(ctx, 0, 0, W, 26, '#cfc8b4');
  box(ctx, 0, 26, W, 3, '#a89f8a');
  for (let wx = -40; wx < 1000; wx += 150) {
    const x = v(wx);
    if (x > -20 && x < W + 20) { box(ctx, x, 0, 12, 29, '#e2dcc8'); box(ctx, x, 0, 3, 29, '#f2ece0'); }
  }
  // the open side: a low wall, the rail above it, and the yard beyond
  const top = 268;
  ctx.globalAlpha = 1;
  box(ctx, 0, top, W, H - top, '#c9c1ab');
  box(ctx, 0, top, W, 3, '#ded7c2');
  box(ctx, 0, top - 14, W, 3, '#cfc8b4');
  for (let wx = -40; wx < 1000; wx += 26) {
    const x = v(wx);
    if (x > -6 && x < W + 6) box(ctx, x, top - 11, 3, 11, '#bdb49c');
  }
  for (let wx = -40; wx < 1000; wx += 150) {
    const x = v(wx);
    if (x > -20 && x < W + 20) box(ctx, x, top - 30, 12, H - top + 30, '#e2dcc8');
  }
  void t;
}

/* --------------------------------------------------------------- canteen --*/

export function drawCanteen(ctx, cam, t) {
  const gy = 248;
  const v = (wx) => wx - cam;
  vgrad(ctx, 0, 0, W, 60, '#b8b098', '#d8d0b8');
  box(ctx, 0, 0, W, 20, '#a49c84');                   // the roof underside
  for (let x = -Math.round(cam * 0.6) % 60; x < W; x += 60) box(ctx, x, 0, 3, 20, '#8e8670');
  box(ctx, 0, 20, W, 3, '#7f7764');
  box(ctx, 0, 23, W, 172, '#d8d0b6');                 // the back wall
  box(ctx, 0, 190, W, 5, '#bcb49a');
  box(ctx, 0, gy - 54, W, H - gy + 54, '#b4ac96');    // the floor
  for (let x = -Math.round(cam) % 34; x < W; x += 34) box(ctx, x, gy - 54, 1, H - gy + 54, '#a29a84');
  for (let i = 0; i < 9; i++) box(ctx, 0, gy - 54 + i * 8, W, 1, shade('#b4ac96', -0.05 - i * 0.012));

  /* the stalls along the back */
  const stalls = [[120, '#c25a4a'], [330, '#3f7ea8'], [540, '#d8a03c']];
  for (const [wx, col] of stalls) {
    const x = v(wx);
    if (x < -120 || x > W + 40) continue;
    box(ctx, x - 56, 30, 112, 26, col);                        // awning
    for (let i = 0; i < 11; i++) box(ctx, x - 56 + i * 10, 30, 5, 26, shade(col, 0.16));
    box(ctx, x - 58, 54, 116, 4, shade(col, -0.3));
    // the big board: prices at the top, photographs of everything below
    box(ctx, x - 52, 62, 104, 124, '#e8e0cc');
    box(ctx, x - 52, 62, 104, 3, '#cfc5aa');
    for (let i = 0; i < 7; i++) box(ctx, x - 46, 68 + i * 7, 40 + (i % 3) * 16, 2, '#6a6254');
    for (let i = 0; i < 7; i++) box(ctx, x + 32, 68 + i * 7, 13, 2, '#a8564a');
    for (let r2 = 0; r2 < 3; r2++) {
      for (let c2 = 0; c2 < 4; c2++) {
        const px2 = x - 46 + c2 * 24, py2 = 122 + r2 * 21;
        box(ctx, px2, py2, 21, 18, '#cfc6ae');
        box(ctx, px2 + 1, py2 + 1, 19, 16, ['#a8562e', '#e8d8a8', '#6ea04a', '#c28a3a', '#d8c088', '#8a6a3a'][(r2 * 4 + c2) % 6]);
        box(ctx, px2 + 3, py2 + 3, 8, 5, '#f2ece0');
      }
    }
    box(ctx, x - 56, 188, 112, 6, '#9a9280');                  // the shelf and its jars
    for (let i = 0; i < 5; i++) box(ctx, x - 46 + i * 22, 180, 8, 8, ['#c8a44a', '#a8562e', '#e8e0cc', '#6ea04a', '#c8302e'][i]);
    box(ctx, x - 56, gy - 46, 112, 46, '#9aa2a8');             // the counter
    box(ctx, x - 56, gy - 46, 112, 4, '#c2cad0');
    box(ctx, x - 56, gy - 24, 112, 2, '#7f878c');
    for (let i = 0; i < 4; i++) {
      const tx = x - 46 + i * 25;
      box(ctx, tx, gy - 54, 20, 9, '#b8bec2');
      box(ctx, tx + 1, gy - 53, 18, 7, ['#a8562e', '#e8d8a8', '#6ea04a', '#c28a3a'][i]);
      if (((t * 1.4 + i) % 3) < 1.6) {
        ctx.globalAlpha = 0.22;
        box(ctx, tx + 7 + Math.sin(t * 2 + i) * 2, gy - 62 - ((t * 9 + i * 7) % 12), 3, 4, '#ffffff');
        ctx.globalAlpha = 1;
      }
    }
    box(ctx, x - 56, gy - 62, 112, 2, '#d8dee2');              // sneeze guard
    box(ctx, x - 56, gy - 62, 2, 16, '#d8dee2');
    box(ctx, x + 54, gy - 62, 2, 16, '#d8dee2');
  }
  /* the small things that fill a canteen wall */
  const ck = v(440);
  if (ck > -20 && ck < W + 20) {
    box(ctx, ck - 9, 40, 18, 18, '#efe9da');
    box(ctx, ck - 7, 42, 14, 14, '#fbf7ec');
    ctx.fillStyle = '#3a3440';
    for (let i = 0; i < 5; i++) ctx.fillRect(Math.round(ck + Math.cos(t * 0.1 - 1.2) * i), Math.round(49 + Math.sin(t * 0.1 - 1.2) * i), 1, 1);
  }
  for (const wx of [230, 450, 660]) {
    const x = v(wx);
    if (x < -20 || x > W + 20) continue;
    box(ctx, x - 12, 24, 24, 3, '#9a9280');                    // a line, with bags on it
    for (let i = 0; i < 4; i++) box(ctx, x - 10 + i * 6, 27, 4, 7, ['#e8e4d8', '#d8e4ea', '#e8e4d8', '#efe0c8'][i]);
  }

  /* the coupon window and a bin at the far end */
  const cw = v(730);
  if (cw > -60 && cw < W + 20) {
    box(ctx, cw - 30, 78, 60, 44, '#b8b098');
    box(ctx, cw - 26, 82, 52, 36, '#6f7a80');
    box(ctx, cw - 26, 108, 52, 10, '#d8d0b8');
    box(ctx, cw - 12, 96, 24, 10, '#e8e0cc');
    box(ctx, cw - 34, gy - 40, 68, 40, '#a49c86');
    box(ctx, cw - 34, gy - 40, 68, 4, '#c2baa2');
  }
  const bn = v(820);
  box(ctx, bn, gy - 20, 18, 20, '#4e7a5c');
  box(ctx, bn - 1, gy - 22, 20, 3, '#3c6048');
  /* fans hanging from the roof */
  for (const fx of [210, 430, 650]) {
    const x = v(fx);
    if (x < -30 || x > W + 30) continue;
    fan(ctx, x, 24, t * 0.9);
  }
}

/** Tables and stools, in front of everyone eating at them. */
export function drawCanteenFg(ctx, cam) {
  for (let wx = 180; wx < 900; wx += 150) {
    const x = wx - cam;
    if (x < -90 || x > W + 90) continue;
    for (let i = 0; i < 4; i++) {
      const sx = x - 46 + i * 31;
      box(ctx, sx - 7, 250, 14, 3, '#c25a4a');
      box(ctx, sx - 1, 253, 3, 12, '#8a8f94');
    }
    box(ctx, x - 66, 238, 132, 5, '#d8c088');
    box(ctx, x - 66, 243, 132, 3, '#b89c64');
    box(ctx, x - 60, 246, 4, 20, '#8a8f94');
    box(ctx, x + 56, 246, 4, 20, '#8a8f94');
    box(ctx, x - 30, 232, 12, 6, '#e8e0cc');
    box(ctx, x + 12, 233, 9, 5, '#9fd8e8');
  }
}

/* ----------------------------------------------------------- gate and soi --*/

export function drawGate(ctx, cam, t, G = {}) {
  const gy = 252;
  const v = (wx) => wx - cam;
  const dusk = G.dusk === undefined ? 0.45 : G.dusk;
  vgrad(ctx, 0, 0, W, 170, lerp2('#8fc0dc', '#e8a266', dusk), lerp2('#dfe8ee', '#f8dcb0', dusk));
  // a few flat clouds, and the sun low over the rooftops
  for (let i = 0; i < 7; i++) {
    const x = ((i * 97) - cam * 0.06) % (W + 120) - 60;
    const y = 18 + (i % 3) * 16;
    ctx.globalAlpha = 0.5;
    box(ctx, x, y, 34 + (i % 2) * 14, 5, lerp2('#ffffff', '#ffd9a8', dusk));
    box(ctx, x + 8, y - 4, 20, 4, lerp2('#ffffff', '#ffe4bc', dusk));
    ctx.globalAlpha = 1;
  }
  if (dusk > 0.2) {
    ctx.globalAlpha = 0.5;
    box(ctx, v(560), 120, 26, 12, '#ffcf8a');
    ctx.globalAlpha = 1;
  }
  // the shophouse row
  for (let i = 0; i < 11; i++) {
    const x = Math.round(-((cam * 0.55) % 80) + i * 80 - 80);
    const h2 = 86 + (i % 3) * 18;
    box(ctx, x, 170 - h2, 76, h2, ['#d8cbb4', '#c4b8a4', '#cfc0ae'][i % 3]);
    box(ctx, x, 170 - h2, 76, 3, '#a89c88');
    box(ctx, x + 74, 170 - h2, 2, h2, '#a89c88');
    for (let r2 = 0; r2 < 2; r2++) {
      for (let c = 0; c < 3; c++) {
        box(ctx, x + 8 + c * 22, 170 - h2 + 14 + r2 * 26, 15, 18, dusk > 0.35 ? '#ffe2a0' : '#8fa8b4');
        box(ctx, x + 8 + c * 22, 170 - h2 + 14 + r2 * 26, 15, 2, '#8a8070');
      }
    }
    box(ctx, x + 2, 150, 72, 9, ['#c25a4a', '#3f7ea8', '#d8a03c'][i % 3]);   // awnings
    box(ctx, x, 159, 76, 11, '#9a9078');
    if (i % 2) { box(ctx, x + 18, 138, 4, 14, '#c8a44a'); box(ctx, x + 16, 132, 8, 8, '#c8302e'); }  // a sign hanging out
  }
  // power poles and lines
  for (let i = 0; i < 6; i++) {
    const x = Math.round(-((cam * 0.75) % 140) + i * 140 - 70);
    box(ctx, x, 44, 3, 126, '#a8a49c');
    box(ctx, x - 9, 54, 21, 2, '#8a867e');
    for (let k = 0; k < 4; k++) {
      ctx.fillStyle = '#4a4a50';
      for (let d = 0; d < 140; d++) {
        ctx.fillRect(x + d, Math.round(58 + k * 3 + Math.sin((d / 140) * Math.PI) * 5), 1, 1);
      }
    }
    box(ctx, x - 5, 62, 4, 6, '#6a6a70');
  }
  // the road, the kerb, the pavement
  box(ctx, 0, 170, W, 26, '#b4ac96');
  box(ctx, 0, 196, W, 28, '#6a6a70');
  box(ctx, 0, 196, W, 1, '#7f7f86');
  for (let x = -Math.round(cam) % 40; x < W; x += 40) box(ctx, x, 209, 18, 2, '#d8d4c8');
  box(ctx, 0, 224, W, 5, '#cfc8b4');
  box(ctx, 0, 229, W, H - 229, '#bfb8a2');
  for (let x = -Math.round(cam) % 46; x < W; x += 46) box(ctx, x, 229, 1, H - 229, '#a89f8a');
  for (let i = 0; i < 5; i++) box(ctx, 0, 229 + i * 14, W, 1, shade('#bfb8a2', -0.04 - i * 0.012));
  // a drain cover and a few paving stains
  box(ctx, v(420), gy + 14, 22, 8, '#8f8877');
  for (let i = 0; i < 4; i++) box(ctx, v(424) + i * 5, gy + 16, 2, 4, '#75705f');

  /* the school wall and gate at the left */
  const gx = v(90);
  if (gx > -180 && gx < W + 60) {
    box(ctx, gx - 160, 108, 148, 116, '#e0d8c0');
    box(ctx, gx - 160, 108, 148, 5, '#c8bfa4');
    for (let i = 0; i < 10; i++) box(ctx, gx - 158 + i * 15, 122, 3, 96, '#8a9aa4');
    box(ctx, gx - 160, 118, 148, 4, '#8a9aa4');
    box(ctx, gx - 12, 78, 14, 146, '#d8cfb4');
    box(ctx, gx - 12, 78, 14, 6, '#b8ab8a');
    box(ctx, gx - 10, 94, 10, 34, '#a51931');           // the school sign
    for (let i = 0; i < 4; i++) box(ctx, gx - 8, 98 + i * 8, 6, 2, '#f4e8c0');
    box(ctx, gx - 30, 100, 16, 20, '#4e7a3c');          // the tree inside the wall
    box(ctx, gx - 34, 88, 26, 16, '#3f6a32');
    box(ctx, gx - 24, 118, 3, 16, '#6a4a32');
  }
  // a songthaew waiting, a motorbike, a cart, the shop
  const sw = v(330);
  if (sw > -70 && sw < W + 70) songthaew(ctx, sw, 224, t);
  const mb = v(470);
  if (mb > -40 && mb < W + 40) motorbike(ctx, mb, 224);
  const cart = v(640);
  if (cart > -70 && cart < W + 70) foodCart(ctx, cart, gy - 2, t);
  const sh = v(800);
  if (sh > -110 && sh < W + 50) {
    box(ctx, sh - 62, 78, 124, 92, '#e8e4d8');
    box(ctx, sh - 62, 78, 124, 12, '#2e7a48');
    box(ctx, sh - 62, 90, 124, 5, '#d8641e');
    box(ctx, sh - 54, 100, 106, 46, dusk > 0.3 ? '#fff0c0' : '#bfd8e0');
    box(ctx, sh - 54, 100, 106, 2, '#8fa8b4');
    box(ctx, sh - 12, 100, 24, 70, '#cfe2e8');
    box(ctx, sh - 12, 100, 2, 70, '#9ab4bc');
    box(ctx, sh + 10, 100, 2, 70, '#9ab4bc');
    for (let i = 0; i < 4; i++) box(ctx, sh - 48 + i * 26, 106, 20, 30, '#dfe8ec');
  }
  // a couple of potted plants and a bin on the pavement
  for (const wx of [200, 560, 860]) {
    const x = v(wx);
    if (x < -20 || x > W + 20) continue;
    box(ctx, x - 6, gy - 11, 12, 11, '#a8674a');
    for (let i = 0; i < 6; i++) box(ctx, x - 6 + i * 2, gy - 18 - (i % 3) * 5, 2, 8, i % 2 ? '#4e8a3c' : '#3f7030');
  }
  const bin = v(720);
  box(ctx, bin, gy - 17, 15, 17, '#5d6a72');
  box(ctx, bin - 1, gy - 19, 17, 3, '#49545a');
}

function songthaew(ctx, x, y, t) {
  box(ctx, x - 34, y - 34, 68, 26, '#b23a30');        // the back
  box(ctx, x - 34, y - 36, 68, 3, '#8f2b24');
  for (let i = 0; i < 5; i++) box(ctx, x - 30 + i * 14, y - 32, 2, 22, '#d8564a');
  box(ctx, x + 22, y - 44, 22, 36, '#b23a30');        // the cab
  box(ctx, x + 26, y - 40, 14, 12, '#9fc4d8');
  box(ctx, x - 36, y - 10, 80, 4, '#5a4a48');
  wheel(ctx, x - 22, y - 2, t);
  wheel(ctx, x + 28, y - 2, t);
  box(ctx, x - 34, y - 46, 66, 4, '#d8d0b8');         // the roof rack
}
function motorbike(ctx, x, y) {
  box(ctx, x - 10, y - 12, 22, 5, '#3a3a44');
  box(ctx, x - 2, y - 20, 4, 9, '#c25a4a');
  box(ctx, x + 8, y - 22, 3, 10, '#5a5a64');
  wheel(ctx, x - 11, y - 3, 0, 5);
  wheel(ctx, x + 11, y - 3, 0, 5);
}
function wheel(ctx, x, y, t, r = 7) {
  fillEllipse(ctx, x, y, r, r, '#2c2c32');
  fillEllipse(ctx, x, y, r * 0.45, r * 0.45, '#8a8a92');
  void t;
}
function foodCart(ctx, x, y, t) {
  box(ctx, x - 24, y - 26, 48, 18, '#c4b48c');
  box(ctx, x - 24, y - 28, 48, 3, '#a89870');
  box(ctx, x - 26, y - 46, 52, 4, '#d8a03c');         // the parasol
  box(ctx, x - 1, y - 44, 2, 18, '#8a8072');
  wheel(ctx, x - 16, y - 5, 0, 5);
  wheel(ctx, x + 16, y - 5, 0, 5);
  box(ctx, x - 18, y - 34, 12, 8, '#6f8f58');         // som tam mortar and a grill
  box(ctx, x + 4, y - 33, 16, 7, '#4a4a50');
  if ((t * 2) % 2 < 1.2) { ctx.globalAlpha = 0.25; box(ctx, x + 10, y - 42 - ((t * 8) % 10), 3, 4, '#ffffff'); ctx.globalAlpha = 1; }
}

/* --------------------------------------------------------- up the mountain */

export function drawTrail(ctx, cam, t, G = {}) {
  const mist = G.mist === undefined ? 0.5 : G.mist;
  vgrad(ctx, 0, 0, W, 120, '#a8cce0', '#dce9e6');
  /* ridges, one behind the other, each a little greener */
  const ridge = (off, yBase, col, amp, seed) => {
    ctx.fillStyle = col;
    for (let x = 0; x < W; x++) {
      const wx = x + cam * off + seed;
      const y = yBase + Math.sin(wx * 0.0055) * amp + Math.sin(wx * 0.017 + 2) * amp * 0.45;
      ctx.fillRect(x, Math.round(y), 1, H - Math.round(y));
    }
  };
  ridge(0.1, 74, '#97b3c6', 18, 0);
  ridge(0.16, 100, '#7fa196', 16, 400);
  ridge(0.26, 124, '#5f8a66', 14, 900);
  ctx.globalAlpha = mist * 0.45;
  box(ctx, 0, 104, W, 34, '#eaf2f0');
  ctx.globalAlpha = 1;
  ridge(0.4, 150, '#3f6a3a', 12, 1500);

  const gy = (wx) => 214 + Math.sin(wx * 0.004) * 6;

  /* the wall of jungle on the uphill side of the path */
  const r3 = rng(1212);
  for (let i = 0; i < 160; i++) {
    const wx = i * 17 + (i % 3) * 6;
    const x = wx - cam * 0.82;
    if (x < -40 || x > W + 40) { r3.f(); r3.f(); r3.f(); continue; }
    const base = gy(wx * 1.2) + 26;
    const hh = 26 + r3.f(0, 34);
    const ww = 12 + r3.f(0, 14);
    const dark = r3.chance(0.5);
    box(ctx, x - ww / 2, base - hh, ww, hh, dark ? '#2f5a2c' : '#3c6d33');
    box(ctx, x - ww / 2, base - hh, ww, 3, dark ? '#42763a' : '#4f8a41');
    if (r3.chance(0.3)) {                              // a banana leaf catching light
      for (let k = 0; k < 3; k++) {
        box(ctx, x - 8 + k * 7, base - hh - 6 + (k % 2) * 4, 7, 12, '#57944a');
      }
    }
  }
  ctx.globalAlpha = 0.16;
  box(ctx, 0, 140, W, 60, '#dbe8e0');
  ctx.globalAlpha = 1;

  /* the slope you walk on */
  ctx.fillStyle = '#42702f';
  for (let x = 0; x < W; x++) ctx.fillRect(x, Math.round(gy(x + cam)) + 22, 1, H);
  ctx.fillStyle = '#548a3c';
  for (let x = 0; x < W; x++) ctx.fillRect(x, Math.round(gy(x + cam)) + 22, 1, 7);
  // the dirt path
  ctx.fillStyle = '#9a7b52';
  for (let x = 0; x < W; x++) {
    const yy = Math.round(gy(x + cam)) + 24;
    ctx.fillRect(x, yy, 1, 9 + Math.round(Math.sin((x + cam) * 0.06) * 2));
  }
  ctx.fillStyle = '#b3936a';
  for (let x = 0; x < W; x++) ctx.fillRect(x, Math.round(gy(x + cam)) + 24, 1, 2);
  ctx.fillStyle = '#7d6142';
  for (let x = 0; x < W; x++) ctx.fillRect(x, Math.round(gy(x + cam)) + 33, 1, 1);
  // stones, roots across the path, leaf litter
  const r4 = rng(505);
  for (let i = 0; i < 200; i++) {
    const wx = i * 13 + r4.f(0, 9);
    const x = wx - cam;
    if (x < -8 || x > W + 8) { r4.f(); r4.f(); continue; }
    const base = gy(wx) + 26;
    const k = r4.f();
    if (k < 0.3) box(ctx, x, base + r4.f(0, 6), 2 + r4.f(0, 2), 2, '#8d8274');
    else if (k < 0.45) box(ctx, x, base + r4.f(2, 7), 9, 1, '#6f5537');
    else if (k < 0.62) box(ctx, x, base + r4.f(0, 7), 2, 1, '#c2a061');
  }
  // grass tufts along both edges of the path
  const r5 = rng(818);
  for (let i = 0; i < 220; i++) {
    const wx = i * 11 + r5.f(0, 8);
    const x = wx - cam;
    if (x < -6 || x > W + 6) { r5.f(); r5.f(); continue; }
    const up = r5.chance(0.5);
    const base = gy(wx) + (up ? 23 : 35);
    const sway = Math.sin(t * 1.1 + wx * 0.07) * 1.2;
    for (let k = 0; k < 3; k++) {
      box(ctx, x + k - 1 + sway * (k / 2), base - 4 + k, 1, 5 - k, r5.chance(0.5) ? '#4e8a3c' : '#3f7030');
    }
  }
}

/** Ferns and a banana leaf hanging into frame, in front of everything. */
export function drawTrailFg(ctx, cam, t) {
  const r6 = rng(3131);
  for (let i = 0; i < 70; i++) {
    const wx = i * 41;
    const x = wx - cam * 1.25;
    if (x < -60 || x > W + 60) { r6.f(); r6.f(); continue; }
    const kind = r6.f();
    const sway = Math.sin(t * 0.6 + i) * 2;
    if (kind < 0.45) {
      // a fern, fanning up from the bottom edge
      for (let k = 0; k < 7; k++) {
        const a = -2.2 + k * 0.32;
        const len = 26 + r6.f(0, 12);
        for (let d = 0; d < len; d += 2) {
          box(ctx, x + Math.cos(a) * d + sway * (d / len), H - 6 + Math.sin(a) * d * 0.8, 3, 3,
              k % 2 ? '#24491f' : '#2e5a26');
        }
      }
    } else if (kind < 0.7) {
      // a banana leaf, big and blunt
      for (let k = 0; k < 16; k++) {
        const w2 = 16 - Math.abs(k - 8);
        box(ctx, x - w2 + sway, H - 34 + k * 2, w2 * 2, 2, k % 3 ? '#2a5424' : '#34652c');
      }
    } else {
      box(ctx, x - 10, H - 14, 20, 14, '#23481e');
      box(ctx, x - 6, H - 20, 12, 8, '#2c5626');
    }
  }
}

export const trailGroundY = (wx) => 214 + Math.sin(wx * 0.004) * 6 + 22;

/** The termite mound people leave cloth and offerings on. */
export function drawAntMound(ctx, x, gy, t, G = {}) {
  const h = 40, w = 26;
  for (let i = 0; i <= h; i++) {
    const k = i / h;
    const ww = w * Math.pow(1 - k, 0.62);
    box(ctx, x - ww, gy - i, ww * 2, 1, lerp2('#8a5a3a', '#b4855a', k));
    if (k > 0.2 && k < 0.9) box(ctx, x + ww * 0.3, gy - i, ww * 0.7, 1, '#75462c');
  }
  // knobbly turrets
  box(ctx, x - 10, gy - h - 6, 4, 8, '#9a6642');
  box(ctx, x + 4, gy - h - 3, 4, 6, '#9a6642');
  // the cloth wrapped round it, and a garland
  for (const [c, yy] of [['#d84f4f', 14], ['#e8c84a', 19], ['#4f74d8', 24]]) {
    box(ctx, x - w * 0.62, gy - yy, w * 1.24, 3, c);
    box(ctx, x - w * 0.62, gy - yy + 2, w * 1.24, 1, shade(c, -0.3));
  }
  box(ctx, x - 14, gy - 4, 28, 4, '#8a5a3a');
  // offerings at the foot: a glass of water, marigolds, three sticks of incense
  box(ctx, x - 16, gy - 6, 4, 6, '#bfe0ea');
  for (let i = 0; i < 3; i++) box(ctx, x + 8 + i * 4, gy - 5, 3, 3, '#e8a83c');
  for (let i = 0; i < 3; i++) {
    const ix = x + 2 + i * 2;
    box(ctx, ix, gy - 20, 1, 16, '#8a4a3a');
    box(ctx, ix, gy - 21, 1, 1, '#ff7a3a');
    if (G.smoke !== false) {
      ctx.globalAlpha = 0.3;
      for (let k = 0; k < 5; k++) {
        box(ctx, ix + Math.sin(t * 1.3 + k * 0.9 + i) * 2, gy - 24 - k * 4 - ((t * 5) % 4), 1, 1, '#ffffff');
      }
      ctx.globalAlpha = 1;
    }
  }
  // ants, going up and coming down
  for (let i = 0; i < 12; i++) {
    const k = ((t * 0.07 + i * 0.083) % 1);
    const up = i % 2 === 0;
    const yy = gy - k * h;
    const ww = w * Math.pow(1 - k, 0.62);
    box(ctx, x + (up ? -ww * 0.5 : ww * 0.5), yy, 1, 1, '#3a2a22');
  }
}

/** A spirit house on its post, with everything people have left on it. */
export function drawShrine(ctx, x, gy, t) {
  const top = gy - 54;
  box(ctx, x - 4, gy - 34, 8, 34, '#d8cfb4');            // the post
  box(ctx, x - 4, gy - 34, 2, 34, '#f0e8cc');
  box(ctx, x - 16, top + 18, 32, 4, '#c8a44a');          // the platform
  box(ctx, x - 14, top + 6, 28, 12, '#e8dcc0');          // the house
  box(ctx, x - 14, top + 6, 28, 2, '#f6eed8');
  box(ctx, x - 4, top + 10, 8, 8, '#8a6a3a');            // the door
  // a tiered roof with the finials Thai shrines have
  for (let i = 0; i < 3; i++) {
    const ww = 20 - i * 5;
    box(ctx, x - ww, top + i * 4 - 4, ww * 2, 4, '#c8452e');
    box(ctx, x - ww, top + i * 4 - 4, ww * 2, 1, '#e86a4a');
  }
  box(ctx, x - 1, top - 12, 2, 8, '#e8c84a');
  box(ctx, x - 12, top - 6, 2, 5, '#e8c84a');
  box(ctx, x + 10, top - 6, 2, 5, '#e8c84a');
  // garlands, a red fanta with a straw, two small elephants
  for (let i = 0; i < 4; i++) box(ctx, x - 12 + i * 8, top + 20, 5, 4, i % 2 ? '#e8b84a' : '#f4e8a0');
  box(ctx, x + 8, top + 14, 4, 8, '#c8302e');
  box(ctx, x + 9, top + 10, 1, 5, '#e8e8f0');
  box(ctx, x - 13, top + 14, 6, 5, '#d8c8a8');
  box(ctx, x - 14, top + 16, 2, 3, '#d8c8a8');
  // incense in a pot, smoking
  box(ctx, x - 22, gy - 10, 8, 10, '#a8906a');
  for (let i = 0; i < 3; i++) {
    const ix = x - 20 + i * 2;
    box(ctx, ix, gy - 24, 1, 14, '#8a4a3a');
    ctx.globalAlpha = 0.28;
    for (let k = 0; k < 6; k++) box(ctx, ix + Math.sin(t * 1.1 + k + i) * 2.5, gy - 28 - k * 4 - ((t * 6) % 4), 1, 1, '#ffffff');
    ctx.globalAlpha = 1;
  }
  // the ribbons round the tree beside it
  box(ctx, x + 24, gy - 40, 7, 40, '#6a4a32');
  for (const [c, yy] of [['#e8c84a', 18], ['#d84f4f', 24], ['#f0f0f0', 30]]) box(ctx, x + 22, gy - yy, 11, 3, c);
}

/** Butterfly pea on bamboo trellises, as far along the ridge as you can see. */
/** A whole hillside of it, far off: just mass and colour. */
export function drawPeaHillside(ctx, cam, t, x0, x1) {
  const r2 = rng(6161);
  for (let i = 0; i < 1400; i++) {
    const wx = x0 + r2.f(0, x1 - x0);
    const x = (wx - cam * 0.55) % (W + 200) - 100;
    const y = 150 + r2.f(0, 54);
    if (x < -4 || x > W + 4) continue;
    const k = (y - 150) / 54;
    box(ctx, x, y, 1 + (k > 0.5 ? 1 : 0), 1, r2.chance(0.55) ? '#4a3ab4' : '#6250d2');
    if (r2.chance(0.2)) box(ctx, x, y - 1, 1, 1, '#8270ee');
  }
  void t;
}

export function drawPeaField(ctx, cam, t, x0, x1, groundY, wind = 1) {
  const r2 = rng(313);
  for (let wx = x0; wx < x1; wx += 9) {
    const x = wx - cam;
    if (x < -14 || x > W + 14) { r2.f(); r2.f(); continue; }
    const gy = groundY(wx);
    const h = 26 + r2.f(0, 16);
    const sway = Math.sin(t * 0.9 + wx * 0.05) * wind * 1.6;
    // the cane
    for (let i = 0; i < h; i++) {
      const k = i / h;
      box(ctx, x + sway * k * k, gy - i, 1, 1, i % 7 === 0 ? '#8a7a4a' : '#a89a64');
    }
    // the vine, leaves and the flowers on it
    for (let i = 4; i < h; i += 5) {
      const k = i / h;
      const lx = x + sway * k * k;
      const side = (i / 5) % 2 ? 1 : -1;
      box(ctx, lx + side * 2, gy - i, 3, 2, '#3f7a34');
      box(ctx, lx - side * 3, gy - i - 2, 3, 2, '#4e8a3c');
      if (r2.chance(0.5)) {
        const fx = lx + side * 4, fy = gy - i - 1;
        box(ctx, fx - 1, fy - 2, 4, 4, '#4231b0');
        box(ctx, fx - 1, fy - 1, 3, 2, '#5f49d6');
        box(ctx, fx, fy - 2, 2, 1, '#8270ee');
        box(ctx, fx, fy, 1, 1, '#f4e08c');
      }
    }
  }
}

/** Loose flowers scattered through the grass, for the field floor. */
export function drawFieldFloor(ctx, cam, t, x0, x1, groundY) {
  const r2 = rng(818);
  for (let i = 0; i < 260; i++) {
    const wx = x0 + r2.f(0, x1 - x0);
    const x = wx - cam;
    const gy = groundY(wx) + r2.f(-2, 8);
    if (x < -4 || x > W + 4) continue;
    const s = r2.f();
    if (s < 0.55) box(ctx, x, gy, 1, 2, r2.chance(0.5) ? '#5f8f48' : '#4e7a3e');
    else {
      box(ctx, x, gy - 3, 1, 3, '#3f7a34');
      box(ctx, x - 1, gy - 5, 3, 2, '#5f49d6');
      box(ctx, x, gy - 5, 1, 1, '#8270ee');
    }
  }
  // and a nearer band, below the path, where the flowers are bigger
  const r3 = rng(929);
  for (let i = 0; i < 300; i++) {
    const wx = x0 + r3.f(0, x1 - x0);
    const x = (wx - cam * 1.12) % (x1 - x0) ;
    const sx = x - 0;
    const gy = groundY(wx) + 16 + r3.f(0, 52);
    if (sx < -6 || sx > W + 6) continue;
    if (r3.chance(0.45)) {
      for (let k = 0; k < 4; k++) box(ctx, sx, gy - k, 1, 1, '#3f7a34');
      box(ctx, sx - 2, gy - 7, 5, 4, '#4231b0');
      box(ctx, sx - 1, gy - 6, 3, 2, '#5f49d6');
      box(ctx, sx, gy - 7, 2, 1, '#8270ee');
      box(ctx, sx, gy - 5, 1, 1, '#f4e08c');
    } else {
      box(ctx, sx, gy - 3, 1, 4, r3.chance(0.5) ? '#4e8a3c' : '#3f7030');
    }
  }
  void t;
}

/* ---------------------------------------------------------------- extras --*/

/** The cicada-and-dust shimmer that sells a hot afternoon. */
export function heatShimmer(ctx, t, amount = 1) {
  if (amount <= 0) return;
  ctx.globalAlpha = 0.05 * amount;
  for (let i = 0; i < 26; i++) {
    const y = 150 + ((i * 37 + t * 9) % (H - 150));
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(Math.round(Math.sin(t * 0.7 + i) * 6 + i * 19) % W, Math.round(y), 22, 1);
  }
  ctx.globalAlpha = 1;
}

export function drawSunbeam(ctx, x, y, w, h, a = 0.1) {
  ctx.globalAlpha = a;
  ctx.fillStyle = '#fff6d0';
  ctx.beginPath();
  ctx.moveTo(x, y); ctx.lineTo(x + w, y);
  ctx.lineTo(x + w * 1.6, y + h); ctx.lineTo(x - w * 0.6, y + h);
  ctx.closePath(); ctx.fill();
  ctx.globalAlpha = 1;
}

export { px, clamp, R };

/** The kerb, a tree and a parked bike, all of it in front of the pavement. */
export function drawGateFg(ctx, cam) {
  const v = (wx) => wx - cam;
  for (const wx of [150, 640]) {
    const x = v(wx);
    if (x > -40 && x < W + 40) {
      box(ctx, x - 5, 250, 11, H - 250, '#6a4a32');
      box(ctx, x - 5, 250, 3, H - 250, '#82603f');
      box(ctx, x - 26, 244, 54, 16, '#3f6a32');
      box(ctx, x - 20, 236, 42, 12, '#4e7c3c');
      box(ctx, x - 12, 230, 26, 8, '#5c8a44');
    }
  }
  const b = v(420);
  if (b > -60 && b < W + 60) {
    box(ctx, b - 16, 282, 34, 6, '#3a3a44');
    box(ctx, b - 2, 270, 5, 13, '#c25a4a');
    box(ctx, b + 12, 266, 4, 16, '#5a5a64');
    fillEllipse(ctx, b - 17, 291, 8, 8, '#2c2c32');
    fillEllipse(ctx, b + 17, 291, 8, 8, '#2c2c32');
    fillEllipse(ctx, b - 17, 291, 3, 3, '#8a8a92');
    fillEllipse(ctx, b + 17, 291, 3, 3, '#8a8a92');
  }
  box(ctx, 0, H - 4, W, 4, '#a89f8a');
}

/* ----------------------------------------------------------------- dream --*/

/** Where she goes when the afternoon wins: too bright, too soft, no edges. */
export function drawDream(ctx, cam, t) {
  vgrad(ctx, 0, 0, W, 190, '#eaf2fb', '#dff0e4');
  // a bloom of light where the sun should be
  for (let i = 10; i > 0; i--) {
    ctx.globalAlpha = 0.05;
    fillEllipse(ctx, W * 0.62, 70, i * 11, i * 9, '#ffffff');
  }
  ctx.globalAlpha = 1;
  // soft hills
  const hill = (yBase, amp, col, off) => {
    ctx.fillStyle = col;
    for (let x = 0; x < W; x++) {
      const y = yBase + Math.sin((x + cam * off + t * 2) * 0.008) * amp;
      ctx.fillRect(x, Math.round(y), 1, H - Math.round(y));
    }
  };
  hill(150, 10, '#cfe4d2', 0.1);
  hill(176, 8, '#b2d8b6', 0.2);
  hill(198, 6, '#96c894', 0.3);
  ctx.fillStyle = '#8bc088';
  ctx.fillRect(0, 214, W, H - 214);
  // grass, and butterfly pea through it, all of it swaying together
  const r2 = rng(2323);
  for (let i = 0; i < 420; i++) {
    const x = r2.f(0, W);
    const y = 206 + r2.f(0, H - 210);
    const sway = Math.sin(t * 0.9 + x * 0.05) * 1.6;
    const k = (y - 206) / (H - 210);
    if (r2.chance(0.24)) {
      box(ctx, x + sway, y - 4, 1, 5, '#5f9a5c');
      box(ctx, x + sway - 1, y - 7, 3, 3, '#7a68e8');
      box(ctx, x + sway, y - 7, 1, 1, '#b0a2f4');
    } else {
      box(ctx, x + sway * k, y - 3, 1, 4, r2.chance(0.5) ? '#77b271' : '#63a05f');
    }
  }
  // motes drifting up
  ctx.globalAlpha = 0.5;
  for (let i = 0; i < 40; i++) {
    const x = (i * 37 + Math.sin(t * 0.3 + i) * 20) % W;
    const y = (H - ((t * 9 + i * 31) % (H + 40)));
    box(ctx, x, y, 1, 1, '#ffffff');
  }
  ctx.globalAlpha = 1;
  // a soft white edge all round, so it never feels solid
  for (let i = 0; i < 26; i++) {
    ctx.globalAlpha = 0.045 * (1 - i / 26);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, i, W, 1);
    ctx.fillRect(0, H - 1 - i, W, 1);
    ctx.fillRect(i, 0, 1, H);
    ctx.fillRect(W - 1 - i, 0, 1, H);
  }
  ctx.globalAlpha = 1;
}
