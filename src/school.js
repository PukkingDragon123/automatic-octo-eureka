/* ============================================================================
 *  school.js — Anchan Wittaya School.
 *
 *  Three rooms, drawn for a camera that sits close: everything worth looking
 *  at lives between y=100 and y=290, because that is the band the zoom keeps.
 *  The rooms are meant to feel occupied — three rows of desks, a back row you
 *  only half see, five shops in the canteen with five cooks in them, and more
 *  going on than you can read in one pass.
 * ==========================================================================*/

import { rng, lerp, shade, rgba, fillEllipse } from './core.js';
import { W, H } from './vista.js';
import { drawText, textWidth } from './font.js';

const box = (ctx, x, y, w, h, c) => {
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
};
function lerp2(a, b, t) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const r = Math.round(lerp((pa >> 16) & 255, (pb >> 16) & 255, t));
  const g = Math.round(lerp((pa >> 8) & 255, (pb >> 8) & 255, t));
  const bl = Math.round(lerp(pa & 255, pb & 255, t));
  return '#' + ((r << 16) | (g << 8) | bl).toString(16).padStart(6, '0');
}
const vgrad = (ctx, x, y, w, h, a, b) => {
  for (let i = 0; i < h; i++) box(ctx, x, y + i, w, 1, lerp2(a, b, i / Math.max(1, h - 1)));
};

export const GROUND = 248;

/* The school's name, in whichever language the game is in. */
let bannerText = 'โรงอาหาร  โรงเรียนอัญชันวิทยา';
export function setBanner(text) { bannerText = text; }

/* --------------------------------------------------------------- the badge */

/** The school badge: a butterfly pea flower on a shield. */
export function drawLogo(ctx, x, y, s = 1, flat = false) {
  const w = 11 * s, h = 13 * s;
  // shield
  for (let i = 0; i < h; i++) {
    const k = i / h;
    const ww = k < 0.72 ? w : w * (1 - (k - 0.72) / 0.28) * 1.0;
    box(ctx, x - ww, y + i, ww * 2, 1, flat ? '#2f3a63' : (k < 0.2 ? '#3d4c80' : '#2f3a63'));
  }
  box(ctx, x - w, y, w * 2, 1, '#8090c0');
  // the flower
  const fx = x, fy = y + h * 0.42;
  box(ctx, fx - 3 * s, fy - 2 * s, 6 * s, 4 * s, '#6a55d8');
  box(ctx, fx - 2 * s, fy - 3 * s, 4 * s, 2 * s, '#8270ee');
  box(ctx, fx - 1 * s, fy + 1 * s, 2 * s, 1 * s, '#f4e08c');
  box(ctx, fx - 4 * s, fy + 1 * s, 2 * s, 1 * s, '#4231b0');
  box(ctx, fx + 2 * s, fy + 1 * s, 2 * s, 1 * s, '#4231b0');
  // two leaves under it
  box(ctx, x - 5 * s, y + h * 0.74, 3 * s, 1 * s, '#c8a44a');
  box(ctx, x + 2 * s, y + h * 0.74, 3 * s, 1 * s, '#c8a44a');
}

/* ------------------------------------------------------------- the posters */

const POSTERS = {
  periodic: (ctx, x, y) => {
    box(ctx, x, y, 54, 38, '#f2ece0');
    box(ctx, x, y, 54, 5, '#3f6ea8');
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 9; c++) {
        const on = !(r > 2 && c > 5);
        if (on) box(ctx, x + 3 + c * 5.4, y + 8 + r * 5.6, 4, 4, ['#c25a4a', '#3f7ea8', '#d8a03c', '#6ea04a'][(r + c) % 4]);
      }
    }
  },
  alphabet: (ctx, x, y) => {
    box(ctx, x, y, 60, 30, '#fbf6e8');
    box(ctx, x, y, 60, 4, '#d8a03c');
    for (let i = 0; i < 13; i++) box(ctx, x + 3 + i * 4.4, y + 8, 3, 5, '#5a5248');
    for (let i = 0; i < 13; i++) box(ctx, x + 3 + i * 4.4, y + 18, 3, 5, '#8a8274');
  },
  king: (ctx, x, y) => {
    box(ctx, x, y, 34, 42, '#c8a44a');
    box(ctx, x + 3, y + 3, 28, 36, '#e8dcc0');
    box(ctx, x + 10, y + 12, 14, 20, '#9a8a6a');
    box(ctx, x + 12, y + 9, 10, 8, '#c2ab86');
    box(ctx, x + 6, y + 44, 22, 4, '#c8a44a');
  },
  sports: (ctx, x, y) => {
    box(ctx, x, y, 44, 34, '#e8f0e4');
    box(ctx, x, y, 44, 6, '#c25a4a');
    fillEllipse(ctx, x + 14, y + 18, 7, 7, '#d8a03c');
    box(ctx, x + 26, y + 12, 14, 3, '#5a5248');
    box(ctx, x + 26, y + 18, 11, 3, '#8a8274');
    box(ctx, x + 26, y + 24, 13, 3, '#8a8274');
  },
  chart: (ctx, x, y) => {
    box(ctx, x, y, 46, 36, '#f6f2e6');
    box(ctx, x + 3, y + 3, 40, 2, '#3f7ea8');
    for (let i = 0; i < 5; i++) box(ctx, x + 5 + i * 8, y + 30 - i * 4, 6, 4 + i * 4, ['#c25a4a', '#3f7ea8', '#6ea04a', '#d8a03c', '#8a6ad8'][i]);
  },
  roster: (ctx, x, y) => {
    box(ctx, x, y, 40, 34, '#e8dfc8');
    box(ctx, x + 1, y + 1, 38, 32, '#f6f0e0');
    for (let i = 0; i < 7; i++) box(ctx, x + 4, y + 5 + i * 4, 18 + (i % 3) * 8, 2, '#8a8274');
    box(ctx, x + 30, y + 4, 7, 7, '#c25a4a');
  },
  map: (ctx, x, y) => {
    box(ctx, x, y, 44, 50, '#8a7250');
    box(ctx, x + 2, y + 2, 40, 46, '#dfe8ea');
    box(ctx, x + 16, y + 6, 11, 18, '#a8c48a');
    box(ctx, x + 13, y + 20, 15, 16, '#c4cf8a');
    box(ctx, x + 18, y + 32, 8, 12, '#a8c48a');
    box(ctx, x + 21, y + 41, 5, 5, '#a8c48a');
  },
};

export function drawPoster(ctx, kind, x, y) { (POSTERS[kind] || POSTERS.chart)(ctx, x, y); }

/* ------------------------------------------------------------- classroom --*/

const CR = {
  wallTop: '#f4efdd', wallBot: '#e2dbc4', dado: '#9fb397', floor: '#cdb995',
  floorSh: '#ab977a', board: '#2b4535', boardEdge: '#8a7048', desk: '#d0a768',
  deskSh: '#a67f4c', frame: '#7b868c',
};

/** Seats, back row to front.  Row 0 is furthest away and drawn smallest. */
export function classSeats() {
  const rows = [];
  for (let r = 0; r < 3; r++) {
    const y = [230, 252, 282][r];
    const sc = [0.82, 1, 1.18][r];
    const gap = [68, 68, 82][r];
    const x0 = [372, 360, 344][r];
    const seats = [];
    for (let i = 0; i < 14; i++) seats.push({ x: x0 + i * gap, y, sc, row: r });
    rows.push(seats);
  }
  return rows;
}

export function drawClassroom(ctx, cam, t, o = {}) {
  const gy = GROUND;
  const dusk = o.dusk || 0;
  const v = (wx) => wx - cam;
  vgrad(ctx, 0, 30, W, 194, CR.wallTop, CR.wallBot);
  box(ctx, 0, 0, W, 30, '#cfc8b4');
  box(ctx, 0, 216, W, 8, CR.dado);
  box(ctx, 0, 223, W, 2, shade(CR.dado, -0.3));
  // floor, receding
  box(ctx, 0, 224, W, H - 224, CR.floor);
  for (let i = 0; i < 10; i++) box(ctx, 0, 225 + i * 8, W, 1, shade(CR.floor, -0.06 - i * 0.016));
  for (let x = -Math.round(cam * 0.92) % 46; x < W; x += 46) box(ctx, x, 224, 1, H - 224, CR.floorSh);

  /* the ceiling: tube lights on it, and a trim where it meets the wall */
  box(ctx, 0, 28, W, 3, '#b9b19a');
  for (let wx = 180; wx < 1500; wx += 240) {
    const x = v(wx);
    if (x < -40 || x > W + 40) continue;
    box(ctx, x - 26, 14, 52, 5, '#d8d4c8');
    box(ctx, x - 24, 19, 48, 3, '#fbfaf2');
    box(ctx, x - 26, 12, 2, 3, '#a8a494');
    box(ctx, x + 24, 12, 2, 3, '#a8a494');
  }
  /* high louvre windows all along the back wall, the way Thai classrooms
     have them, so the sun comes in over everybody's heads */
  for (let wx = 340; wx < 1480; wx += 112) {
    const x = v(wx);
    if (x < -100 || x > W + 10) continue;
    box(ctx, x, 36, 86, 46, '#7b868c');
    box(ctx, x + 2, 38, 82, 42, '#a9d2e2');
    box(ctx, x + 2, 60, 82, 20, '#bfe0ea');
    box(ctx, x + 6, 62, 26, 18, '#6f9a5a');       // the top of the mango tree outside
    box(ctx, x + 54, 66, 28, 14, '#7faa64');
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = rgba('#ffffff', i % 2 ? 0.22 : 0.08);
      ctx.fillRect(Math.round(x + 2), 40 + i * 7, 82, 3);
      ctx.fillStyle = rgba('#5a6a74', 0.35);
      ctx.fillRect(Math.round(x + 2), 43 + i * 7, 82, 1);
    }
    box(ctx, x + 42, 36, 2, 46, '#7b868c');
    box(ctx, x - 2, 82, 90, 3, '#d8d2c0');
  }

  /* the board wall */
  const bx = v(70);
  if (bx > -300 && bx < W + 40) {
    box(ctx, bx - 10, 106, 250, 80, CR.boardEdge);
    box(ctx, bx - 7, 109, 244, 74, CR.board);
    box(ctx, bx - 7, 109, 244, 2, shade(CR.board, 0.16));
    ctx.fillStyle = 'rgba(240,240,228,0.8)';
    for (let i = 0; i < 7; i++) ctx.fillRect(Math.round(bx + 6 + i * 13), 117, 9, 1);
    for (let i = 0; i < 6; i++) ctx.fillRect(Math.round(bx + 6), 128 + i * 9, 54 + (i % 3) * 40, 1);
    for (let i = 0; i < 4; i++) ctx.fillRect(Math.round(bx + 6), 128 + i * 9, 2, 1);
    ctx.fillStyle = 'rgba(232,200,120,0.75)';
    for (let i = 0; i < 3; i++) ctx.fillRect(Math.round(bx + 200 + i * 9), 120 + i * 10, 26 - i * 6, 1);
    ctx.fillStyle = 'rgba(240,240,228,0.8)';
    ctx.fillRect(Math.round(bx + 140), 128, 44, 1);
    ctx.fillRect(Math.round(bx + 140), 128, 1, 30);
    ctx.fillRect(Math.round(bx + 183), 128, 1, 30);
    ctx.fillRect(Math.round(bx + 140), 158, 44, 1);
    ctx.fillRect(Math.round(bx + 146), 138, 32, 1);
    ctx.fillRect(Math.round(bx + 146), 146, 22, 1);
    box(ctx, bx - 10, 186, 250, 4, shade(CR.boardEdge, -0.2));
    box(ctx, bx + 24, 182, 10, 4, '#d8cfc0');
    box(ctx, bx + 42, 183, 6, 3, '#f4f0e4');
    // the badge and the banner over it
    drawLogo(ctx, bx + 108, 74, 1.3);
    box(ctx, bx + 4, 84, 84, 14, '#a51931');
    box(ctx, bx + 4, 84, 84, 2, '#c2394f');
    for (let i = 0; i < 6; i++) box(ctx, bx + 10 + i * 12, 89, 8, 4, '#f4e8c0');
    box(ctx, bx + 146, 84, 84, 14, '#2d2a4a');
    for (let i = 0; i < 6; i++) box(ctx, bx + 152 + i * 12, 89, 8, 4, '#e8dcb0');
  }

  /* the teacher's desk, at the end of the board */
  const td = v(300);
  if (td > -60 && td < W + 40) {
    box(ctx, td - 30, 214, 60, 5, '#b48a52');
    box(ctx, td - 30, 219, 60, 3, '#8f6a3c');
    box(ctx, td - 28, 222, 56, 22, '#a87f4a');
    box(ctx, td - 26, 226, 24, 16, '#8f6a3c');
    box(ctx, td + 4, 226, 22, 16, '#8f6a3c');
    box(ctx, td - 18, 206, 18, 8, '#f2ece0');     // a stack of papers
    box(ctx, td - 18, 206, 18, 1, '#d8d0bc');
    box(ctx, td + 8, 208, 6, 6, '#c25a4a');       // a mug
    box(ctx, td + 13, 210, 2, 3, '#c25a4a');
    box(ctx, td - 2, 205, 3, 9, '#6ea04a');       // a little plant
    box(ctx, td - 4, 200, 7, 6, '#4e8a3c');
  }

  /* posters, all the way along the wall */
  const wall = [
    [430, 'periodic', 130], [500, 'alphabet', 136], [576, 'chart', 130],
    [640, 'roster', 132], [700, 'map', 122], [762, 'sports', 132],
    [822, 'chart', 130], [890, 'alphabet', 136], [952, 'periodic', 130],
    [1024, 'sports', 132], [1092, 'roster', 132],
  ];
  for (const [wx, kind, y] of wall) {
    const x = v(wx);
    if (x < -70 || x > W + 20) continue;
    drawPoster(ctx, kind, x, y);
  }
  // a rail of pinned-up work, all the way along under the posters
  box(ctx, 0, 186, W, 2, '#b9ad90');
  {
    const r = rng(77);
    for (let wx = 400; wx < 1500; wx += 26) {
      const x = v(wx);
      if (x < -20 || x > W + 20) { r.f(); r.f(); continue; }
      const h2 = 14 + r.f(0, 8), w2 = 18 + r.f(0, 4);
      box(ctx, x, 188, w2, h2, ['#f6f0e0', '#eae2ce', '#f2ead6', '#e6eef0'][Math.floor(r.f(0, 4))]);
      box(ctx, x + 2, 191, w2 - 6, 1, '#a49a86');
      box(ctx, x + 2, 194, w2 - 9, 1, '#a49a86');
      if (r.chance(0.35)) box(ctx, x + w2 - 7, 197, 5, 5, ['#c25a4a', '#3f7ea8', '#6ea04a'][Math.floor(r.f(0, 3))]);
      box(ctx, x + w2 / 2 - 1, 186, 2, 2, '#b8484a');
    }
  }

  // the clock, and the wai-greeting sign under it
  const ck = v(348);
  if (ck > -30 && ck < W + 30) {
    box(ctx, ck - 10, 104, 20, 20, '#efe9da');
    box(ctx, ck - 8, 106, 16, 16, '#fbf7ec');
    const a = (o.clock === undefined ? t * 0.02 : o.clock) * Math.PI * 2;
    ctx.fillStyle = '#3a3440';
    for (let i = 0; i < 5; i++) ctx.fillRect(Math.round(ck + Math.cos(a - 1.57) * i), Math.round(114 + Math.sin(a - 1.57) * i), 1, 1);
    for (let i = 0; i < 7; i++) ctx.fillRect(Math.round(ck + Math.cos(a * 12 - 1.57) * i * 0.8), Math.round(114 + Math.sin(a * 12 - 1.57) * i * 0.8), 1, 1);
  }

  /* windows down the far end */
  for (const wx of [1160, 1250, 1340]) {
    const x = v(wx);
    if (x < -70 || x > W + 10) continue;
    box(ctx, x, 112, 64, 98, CR.frame);
    box(ctx, x + 2, 114, 60, 94, lerp2('#bfe0ea', '#8fc4d6', 0.2));
    box(ctx, x + 2, 168, 60, 40, '#8fae62');
    box(ctx, x + 6, 146, 24, 26, '#4e7c3c');
    box(ctx, x + 10, 156, 16, 22, '#3f6a32');
    box(ctx, x + 38, 152, 22, 20, '#5c8a44');
    for (let i = 0; i < 10; i++) {
      ctx.fillStyle = rgba('#ffffff', i % 2 ? 0.14 : 0.05);
      ctx.fillRect(Math.round(x + 2), 116 + i * 8, 60, 3);
    }
    box(ctx, x + 31, 112, 2, 98, CR.frame);
    box(ctx, x - 2, 210, 68, 4, '#d8d2c0');
  }
  // light off the windows onto the floor
  ctx.globalAlpha = 0.14 * (1 - dusk);
  for (const wx of [1160, 1250, 1340]) {
    const x = v(wx);
    ctx.fillStyle = '#fff8d8';
    ctx.beginPath();
    ctx.moveTo(x + 4, 210); ctx.lineTo(x + 60, 210);
    ctx.lineTo(x + 6, H); ctx.lineTo(x - 60, H);
    ctx.closePath(); ctx.fill();
  }
  ctx.globalAlpha = 1;

  /* fans, hanging in from the top of the frame */
  for (const fx of [200, 440, 680, 920, 1160]) {
    const x = v(fx);
    if (x < -30 || x > W + 30) continue;
    drawFan(ctx, x, 96, t * (o.fanSpeed === undefined ? 1 : o.fanSpeed));
  }
  /* the cupboard, the bin, the broom */
  const cb = v(1120);
  if (cb > -70 && cb < W + 20) {
    box(ctx, cb, gy - 64, 58, 64, '#b49a6a');
    box(ctx, cb, gy - 64, 58, 3, '#c9b285');
    box(ctx, cb + 2, gy - 60, 26, 28, '#a08856');
    box(ctx, cb + 30, gy - 60, 26, 28, '#a08856');
    box(ctx, cb + 2, gy - 30, 54, 26, '#a08856');
    box(ctx, cb + 26, gy - 46, 3, 3, '#6a5a3a');
    box(ctx, cb + 30, gy - 46, 3, 3, '#6a5a3a');
    box(ctx, cb + 8, gy - 70, 16, 6, '#6f8f58');
    box(ctx, cb + 12, gy - 78, 3, 9, '#4e8a3c');
    box(ctx, cb + 16, gy - 75, 3, 6, '#3f7030');
    for (let i = 0; i < 3; i++) box(ctx, cb + 32 + i * 8, gy - 70, 5, 6, ['#d8a03c', '#c25a4a', '#c8a44a'][i]);
  }
  const br = v(1420);
  if (br < W + 20 && br > -30) {
    box(ctx, br, gy - 44, 2, 44, '#a8804a');
    box(ctx, br - 5, gy - 10, 12, 10, '#d8b060');
    box(ctx, br + 16, gy - 16, 16, 16, '#5d7f9a');
    box(ctx, br + 16, gy - 17, 16, 2, '#4a6a82');
  }
}

export function drawFan(ctx, x, y, t) {
  box(ctx, x - 1, y - 30, 2, 30, '#8c8878');
  box(ctx, x - 3, y, 6, 4, '#b4ae9c');
  const a = t * 7;
  for (let i = 0; i < 3; i++) {
    const aa = a + (i * Math.PI * 2) / 3;
    const dx = Math.cos(aa), dz = Math.sin(aa) * 0.28;
    ctx.fillStyle = rgba('#9a9486', 0.85);
    for (let k = 3; k < 22; k++) ctx.fillRect(Math.round(x + dx * k), Math.round(y + 2 + dz * k), 1, 2);
  }
}

/* Desks come in two halves so people can sit at them. */
export function drawDeskBack(ctx, x, y, sc = 1) {
  const s = sc;
  box(ctx, x - 24 * s, y - 13 * s, 13 * s, 2 * s, CR.desk);
  box(ctx, x - 23 * s, y - 11 * s, 2 * s, 11 * s, CR.frame);
  box(ctx, x - 13 * s, y - 11 * s, 2 * s, 11 * s, CR.frame);
  box(ctx, x - 24 * s, y - 25 * s, 2 * s, 13 * s, CR.frame);
  box(ctx, x - 24 * s, y - 25 * s, 13 * s, 2 * s, CR.desk);
  box(ctx, x + 11 * s, y - 18 * s, 2 * s, 18 * s, CR.frame);
}

export function drawDeskFront(ctx, x, y, o = {}, sc = 1) {
  const s = sc, w = 30 * s;
  if (o.bag) { box(ctx, x - 4 * s, y - 9 * s, 10 * s, 9 * s, o.bagCol || '#5d4a6a'); box(ctx, x - 4 * s, y - 9 * s, 10 * s, 2 * s, '#42334c'); }
  box(ctx, x - w / 2, y - 24 * s, w, 3 * s, CR.desk);
  box(ctx, x - w / 2, y - 21 * s, w, 2 * s, CR.deskSh);
  box(ctx, x - w / 2 + 1, y - 19 * s, w - 2, 15 * s, shade(CR.desk, -0.3));
  box(ctx, x - w / 2 + 2, y - 12 * s, 2 * s, 12 * s, CR.frame);
  box(ctx, x + w / 2 - 4 * s, y - 12 * s, 2 * s, 12 * s, CR.frame);
  // what is on top of it
  if (o.book) {
    box(ctx, x - 8 * s, y - 27 * s, 13 * s, 3 * s, '#f2ecdc');
    box(ctx, x - 8 * s, y - 25 * s, 13 * s, 1 * s, '#c8c0aa');
    box(ctx, x + 4 * s, y - 27 * s, 1 * s, 3 * s, o.bookCol || '#c25a4a');
  }
  if (o.bottle) { box(ctx, x + 9 * s, y - 33 * s, 3 * s, 9 * s, '#9fd8e8'); box(ctx, x + 9 * s, y - 34 * s, 3 * s, 1 * s, '#d84f4f'); }
  if (o.case) {
    box(ctx, x - 13 * s, y - 27 * s, 11 * s, 3 * s, o.caseCol || '#d8a03c');
    box(ctx, x - 13 * s, y - 27 * s, 11 * s, 1 * s, shade(o.caseCol || '#d8a03c', 0.2));
  }
  if (o.pencil) { box(ctx, x + 1 * s, y - 25 * s, 7 * s, 1 * s, '#d8b060'); box(ctx, x + 8 * s, y - 25 * s, 1 * s, 1 * s, '#3a3440'); }
  if (o.ruler) box(ctx, x - 6 * s, y - 25 * s, 12 * s, 1 * s, '#9fd8e8');
  if (o.phone) box(ctx, x + 2 * s, y - 26 * s, 3 * s, 5 * s, '#2a2a34');
}

/** A row of desk backs right under the camera. */
export function drawFrontRow(ctx, cam) {
  for (let wx = 60; wx < 1300; wx += 112) {
    const x = wx - cam * 1.14 + 30;
    if (x < -60 || x > W + 60) continue;
    box(ctx, x - 26, H - 22, 52, 5, CR.desk);
    box(ctx, x - 26, H - 17, 52, 4, CR.deskSh);
    box(ctx, x - 25, H - 13, 50, 13, shade(CR.desk, -0.34));
    box(ctx, x - 12, H - 26, 16, 4, '#f2ecdc');
  }
}

/* --------------------------------------------------------------- hallway --*/

export function drawHallway(ctx, cam, t) {
  const gy = GROUND;
  const v = (wx) => wx - cam;
  box(ctx, 0, 0, W, 224, '#e6ddc6');
  box(ctx, 0, 30, W, 5, '#c9c0a4');
  box(ctx, 0, 216, W, 8, '#c9c0a4');
  for (let wx = 40; wx < 1600; wx += 150) {
    const x = v(wx);
    if (x < -130 || x > W + 20) continue;
    box(ctx, x, 92, 38, 124, '#a8916a');                 // a classroom door
    box(ctx, x + 2, 94, 34, 120, '#c2a878');
    box(ctx, x + 4, 98, 30, 42, '#8fa8b4');
    for (let i = 0; i < 5; i++) { ctx.fillStyle = rgba('#ffffff', i % 2 ? 0.2 : 0.07); ctx.fillRect(Math.round(x + 4), 100 + i * 8, 30, 3); }
    box(ctx, x + 31, 156, 3, 7, '#6a5a3a');
    box(ctx, x + 7, 74, 24, 14, '#f2ecdc');              // the room number
    for (let i = 0; i < 3; i++) box(ctx, x + 11 + i * 5, 78, 3, 6, '#5a5248');
    box(ctx, x + 48, 100, 72, 80, '#9aa8ae');            // and its window
    box(ctx, x + 50, 102, 68, 76, '#bcd4dc');
    box(ctx, x + 82, 100, 3, 80, '#9aa8ae');
    for (let i = 0; i < 9; i++) { ctx.fillStyle = rgba('#ffffff', i % 2 ? 0.16 : 0.05); ctx.fillRect(Math.round(x + 50), 104 + i * 8, 68, 3); }
    box(ctx, x + 48, 180, 74, 4, '#c8bfa4');
    // a poster taped beside each door
    if ((wx / 150) % 2 === 0) drawPoster(ctx, ['sports', 'roster', 'chart'][(wx / 150) % 3], x + 128, 110);
  }
  // the floor
  box(ctx, 0, 224, W, H - 224, '#b0a894');
  box(ctx, 0, 224, W, 3, '#978f7c');
  for (let i = 0; i < 11; i++) box(ctx, 0, 228 + i * 8, W, 1, shade('#b0a894', -0.04 - i * 0.013));
  for (let x = -Math.round(cam) % 52; x < W; x += 52) box(ctx, x, 224, 1, H - 224, '#9d957f');
  ctx.globalAlpha = 0.16;
  box(ctx, 0, 224, W, 10, '#3a3630');
  ctx.globalAlpha = 1;

  const stuff = [
    [128, 'plant'], [300, 'notice'], [470, 'cooler'], [560, 'plant'], [720, 'shoes'],
    [880, 'notice'], [1000, 'plant'], [1150, 'cooler'], [1300, 'shoes'], [1420, 'plant'],
  ];
  for (const [wx, kind] of stuff) {
    const x = v(wx);
    if (x < -90 || x > W + 30) continue;
    if (kind === 'plant') {
      box(ctx, x - 7, gy - 12, 14, 12, '#b06a4a');
      box(ctx, x - 8, gy - 14, 16, 3, '#c07a58');
      for (let i = 0; i < 7; i++) {
        const a2 = (i / 7) * Math.PI * 2 + t * 0.2;
        box(ctx, x + Math.cos(a2) * 7, gy - 18 - Math.abs(Math.sin(a2)) * 10, 3, 8, i % 2 ? '#4e8a3c' : '#3f7030');
      }
    } else if (kind === 'notice') {
      box(ctx, x, 104, 76, 56, '#8a7250');
      box(ctx, x + 2, 106, 72, 52, '#d8cfb8');
      for (let i = 0; i < 8; i++) {
        box(ctx, x + 5 + (i % 4) * 18, 110 + Math.floor(i / 4) * 24, 15, 20, ['#f2ece0', '#e8dcc0', '#dfe8f0', '#f6e8d8'][i % 4]);
        box(ctx, x + 6 + (i % 4) * 18, 113 + Math.floor(i / 4) * 24, 11, 1, '#9a9280');
      }
    } else if (kind === 'cooler') {
      box(ctx, x - 9, gy - 34, 18, 34, '#dfe4e8');
      box(ctx, x - 9, gy - 34, 18, 4, '#b8c0c8');
      box(ctx, x - 6, gy - 46, 12, 12, '#a8d8e8');
      box(ctx, x - 2, gy - 24, 4, 3, '#8a9098');
    } else {
      box(ctx, x, gy - 16, 46, 16, '#a89060');
      box(ctx, x, gy - 16, 46, 2, '#c2a878');
      for (let i = 0; i < 6; i++) box(ctx, x + 3 + i * 7, gy - 13, 5, 3, ['#2a2730', '#c25a4a', '#2a2730', '#3f6ea8', '#2a2730', '#2a2730'][i]);
    }
  }
}

export function drawHallwayFg(ctx, cam) {
  const v = (wx) => wx - cam;
  box(ctx, 0, 0, W, 30, '#cfc8b4');
  box(ctx, 0, 30, W, 3, '#a89f8a');
  // the pillars run the whole height, the way they do in a real walkway
  for (let wx = -40; wx < 1700; wx += 150) {
    const x = v(wx);
    if (x < -20 || x > W + 20) continue;
    box(ctx, x, 0, 14, H, '#e2dcc8');
    box(ctx, x, 0, 4, H, '#f2ece0');
    box(ctx, x + 11, 0, 3, H, '#c6bda6');
    box(ctx, x - 3, 30, 20, 5, '#d8d0bc');
  }
  const top = 278;
  box(ctx, 0, top, W, H - top, '#c9c1ab');
  box(ctx, 0, top, W, 3, '#ded7c2');
  box(ctx, 0, top - 15, W, 3, '#cfc8b4');
  for (let wx = -40; wx < 1700; wx += 26) {
    const x = v(wx);
    if (x > -6 && x < W + 6) box(ctx, x, top - 12, 3, 12, '#bdb49c');
  }
}

/* --------------------------------------------------------------- canteen --*/

/** Five shops, five cooks, five entirely different smells. */
export const SHOPS = [
  {
    id: 'daeng', x: 150, col: '#c2503f', sign: '#f4e8c0', cook: 'wok',
    name: { th: 'ป้าแดง ข้าวราดแกง', en: "Pa Daeng — Rice & Curry" },
    menu: [
      { key: 'kaprao', th: 'ผัดกะเพราไก่ไข่ดาว', en: 'Basil chicken, fried egg', price: 40 },
      { key: 'curry', th: 'แกงเขียวหวานไก่', en: 'Green curry', price: 40 },
      { key: 'omelette', th: 'ข้าวไข่เจียว', en: 'Omelette on rice', price: 30 },
      { key: 'prik', th: 'ผัดพริกแกงหมู', en: 'Red curry pork', price: 40 },
    ],
  },
  {
    id: 'nuat', x: 400, col: '#3f7ea8', sign: '#e8f0f4', cook: 'noodle',
    name: { th: 'ลุงหนวด ก๋วยเตี๋ยว', en: "Uncle Moustache — Noodles" },
    menu: [
      { key: 'yentafo', th: 'เย็นตาโฟ', en: 'Pink seafood noodles', price: 40 },
      { key: 'tomyum', th: 'บะหมี่ต้มยำหมู', en: 'Tom yum pork noodles', price: 40 },
      { key: 'wonton', th: 'บะหมี่เกี๊ยว', en: 'Wonton egg noodles', price: 40 },
      { key: 'ruea', th: 'ก๋วยเตี๋ยวเรือ', en: 'Boat noodles', price: 35 },
    ],
  },
  {
    id: 'saep', x: 650, col: '#6ea04a', sign: '#f0f6e0', cook: 'pound',
    name: { th: 'ครัวส้มตำแซ่บเว่อร์', en: 'Saep Ver Som Tam' },
    menu: [
      { key: 'somtam', th: 'ส้มตำไทย', en: 'Som tam Thai', price: 35 },
      { key: 'tampu', th: 'ตำปูปลาร้า', en: 'Som tam with crab', price: 40 },
      { key: 'gaiyang', th: 'ไก่ย่าง', en: 'Grilled chicken', price: 45 },
      { key: 'sticky', th: 'ข้าวเหนียว', en: 'Sticky rice', price: 10 },
    ],
  },
  {
    id: 'boy', x: 900, col: '#d8912c', sign: '#fbf0d4', cook: 'grill',
    name: { th: 'พี่บอย หมูปิ้ง-ไก่ทอด', en: "P'Boy — Grilled Pork & Fried Chicken" },
    menu: [
      { key: 'mooping', th: 'หมูปิ้ง 3 ไม้', en: 'Three pork skewers', price: 30 },
      { key: 'gaitod', th: 'ไก่ทอดหาดใหญ่', en: 'Hat Yai fried chicken', price: 40 },
      { key: 'nuggets', th: 'ไส้กรอกทอด', en: 'Fried sausage', price: 25 },
      { key: 'sticky2', th: 'ข้าวเหนียวหมูทอด', en: 'Sticky rice & fried pork', price: 35 },
    ],
  },
  {
    id: 'muay', x: 1150, col: '#8a6ad8', sign: '#efeaff', cook: 'drinks',
    name: { th: 'เจ๊หมวย น้ำแข็งใส', en: 'Jae Muay — Iced Drinks' },
    menu: [
      { key: 'chayen', th: 'ชาเย็น', en: 'Thai iced tea', price: 25 },
      { key: 'nomyen', th: 'นมเย็น', en: 'Pink milk', price: 25 },
      { key: 'oliang', th: 'โอเลี้ยง', en: 'Black iced coffee', price: 20 },
      { key: 'anchan', th: 'น้ำอัญชันมะนาว', en: 'Butterfly pea with lime', price: 25 },
    ],
  },
];

/** Every dish, at about a centimetre across. */
export function drawFood(ctx, x, y, key, s = 1) {
  const b = (dx, dy, w, h, c) => box(ctx, x + dx * s, y + dy * s, w * s, h * s, c);
  switch (key) {
    case 'kaprao':
      b(-6, 0, 12, 4, '#f2ece0'); b(-5, -2, 10, 3, '#f6f2e8');
      b(-4, -4, 8, 3, '#6b4a2c'); b(-2, -3, 3, 1, '#6ea04a');
      b(0, -7, 6, 4, '#f6eecc'); b(2, -6, 2, 2, '#f2b23c'); break;
    case 'curry':
      b(-6, -1, 12, 5, '#e8e0cc'); b(-5, -4, 10, 4, '#9ec48a');
      b(-3, -5, 3, 2, '#6ea04a'); b(1, -5, 2, 2, '#c25a4a'); break;
    case 'omelette':
      b(-6, 0, 12, 4, '#f2ece0'); b(-5, -4, 10, 5, '#f2b23c');
      b(-4, -5, 7, 2, '#f6c55c'); break;
    case 'prik':
      b(-6, 0, 12, 4, '#f2ece0'); b(-5, -4, 10, 4, '#b8452c');
      b(-2, -5, 3, 2, '#6ea04a'); break;
    case 'yentafo':
      b(-7, -2, 14, 7, '#dfe4e8'); b(-6, -1, 12, 5, '#e88aa8');
      b(-3, -2, 4, 2, '#f2ece0'); b(2, -2, 3, 2, '#c25a4a'); break;
    case 'tomyum':
      b(-7, -2, 14, 7, '#dfe4e8'); b(-6, -1, 12, 5, '#d8763c');
      b(-2, -2, 4, 2, '#f6e8b0'); b(3, -2, 2, 2, '#c25a4a'); break;
    case 'wonton':
      b(-7, -2, 14, 7, '#dfe4e8'); b(-6, -1, 12, 5, '#d8c48a');
      b(-4, -3, 4, 3, '#f2e8d0'); b(1, -3, 4, 3, '#f2e8d0'); break;
    case 'ruea':
      b(-6, -2, 12, 6, '#c8cdd2'); b(-5, -1, 10, 4, '#6a3a30');
      b(-2, -2, 4, 2, '#e8dcc0'); break;
    case 'somtam':
      b(-7, -1, 14, 5, '#e8e0cc'); b(-6, -3, 12, 3, '#8fb84a');
      b(-4, -4, 3, 2, '#d84f4f'); b(2, -4, 3, 2, '#e8a83c'); break;
    case 'tampu':
      b(-7, -1, 14, 5, '#e8e0cc'); b(-6, -3, 12, 3, '#7a9a3c');
      b(-2, -4, 4, 3, '#b8452c'); break;
    case 'gaiyang':
      b(-7, 1, 14, 3, '#e8e0cc'); b(-6, -3, 12, 5, '#c2843c');
      b(-4, -4, 7, 2, '#d89a4c'); b(4, -2, 3, 2, '#8a5a2c'); break;
    case 'sticky': case 'sticky2':
      b(-5, -2, 10, 6, '#c9b48a'); b(-4, -3, 8, 2, '#dfd0aa');
      if (key === 'sticky2') { b(2, -6, 6, 4, '#c2843c'); }
      break;
    case 'mooping':
      for (let i = 0; i < 3; i++) { b(-6 + i * 5, -6, 1, 10, '#c9b48a'); b(-7 + i * 5, -5, 4, 4, '#a85c2c'); b(-7 + i * 5, -5, 4, 1, '#c27a3c'); }
      break;
    case 'gaitod':
      b(-6, -1, 12, 5, '#e8c07c'); b(-5, -4, 10, 4, '#d8a24c'); b(-4, -5, 7, 2, '#e8b45c'); break;
    case 'nuggets':
      b(-6, -2, 12, 5, '#c26a4a'); b(-5, -3, 10, 2, '#d8825c'); break;
    case 'chayen':
      b(-4, -10, 8, 13, '#dfe8ee'); b(-3, -8, 6, 10, '#d88a3c');
      b(-3, -8, 6, 3, '#f2e2c4'); b(2, -13, 1, 5, '#e85a7a'); break;
    case 'nomyen':
      b(-4, -10, 8, 13, '#dfe8ee'); b(-3, -8, 6, 10, '#e88aa8');
      b(-3, -8, 6, 2, '#f4c8d8'); b(2, -13, 1, 5, '#7abce8'); break;
    case 'oliang':
      b(-4, -10, 8, 13, '#dfe8ee'); b(-3, -8, 6, 10, '#3a2a22');
      b(2, -13, 1, 5, '#e8c84a'); break;
    case 'anchan':
      b(-4, -10, 8, 13, '#dfe8ee'); b(-3, -8, 6, 10, '#6a55d8');
      b(-3, -4, 6, 4, '#8a6ad8'); b(-3, -8, 6, 2, '#a898ee');
      b(2, -13, 1, 5, '#8fd86a'); break;
    default:
      b(-5, -3, 10, 6, '#c9b48a');
  }
}

/* The cooks.  Each shop has one and each one is busy with something else. */
function drawCook(ctx, x, gy, kind, t, seed) {
  const r = rng(seed);
  const skin = ['#eec49a', '#e0b184', '#f2cca4'][seed % 3];
  const shirt = ['#e8e4d8', '#d8e4ea', '#efe0c8'][seed % 3];
  const apron = '#f4f0e4';
  const bob = Math.sin(t * (kind === 'pound' ? 9 : 3) + seed) * 1.2;
  // body
  box(ctx, x - 6, gy - 30 + bob, 12, 20, shirt);
  box(ctx, x - 6, gy - 20 + bob, 12, 10, apron);
  box(ctx, x - 5, gy - 41 + bob, 10, 11, skin);
  box(ctx, x - 6, gy - 43 + bob, 12, 4, '#f2ece0');          // the cap
  box(ctx, x - 3, gy - 37 + bob, 1, 1, '#2e2620');
  box(ctx, x + 2, gy - 37 + bob, 1, 1, '#2e2620');
  box(ctx, x - 6, gy - 10, 5, 10, '#3a3a44');
  box(ctx, x + 1, gy - 10, 5, 10, '#3a3a44');
  const swing = Math.sin(t * (kind === 'pound' ? 9 : 5) + seed);
  if (kind === 'wok') {
    // a wok, tipped and thrown, with flame under it
    const tip = swing * 0.5;
    const wx = x + 12, wy = gy - 26 + swing * 3;
    box(ctx, x + 4, gy - 30 + bob, 8, 3, skin);
    for (let i = -7; i <= 7; i++) {
      const k = Math.abs(i) / 7;
      box(ctx, wx + i, wy + (1 - k * k) * 4 + tip * i * 0.3, 1, 3, '#4a4a52');
    }
    box(ctx, wx - 5, wy + 1 + tip * -1.5, 10, 2, '#8a5a2c');
    if (swing > 0.3) for (let i = 0; i < 5; i++) box(ctx, wx - 4 + i * 2, wy - 4 - i, 1, 1, '#c2843c');
    for (let i = 0; i < 7; i++) {
      const fh = 3 + Math.abs(Math.sin(t * 9 + i)) * 5;
      box(ctx, wx - 6 + i * 2, gy - 18 - fh, 2, fh, i % 2 ? '#e8742c' : '#f2b23c');
    }
  } else if (kind === 'noodle') {
    // blanching a basket of noodles in a stockpot
    box(ctx, x + 6, gy - 22, 20, 14, '#9aa2a8');
    box(ctx, x + 6, gy - 23, 20, 2, '#c2cad0');
    const dip = Math.max(0, swing) * 5;
    box(ctx, x + 13, gy - 34 + dip, 7, 8, '#a8804a');
    box(ctx, x + 16, gy - 40 + dip, 2, 8, '#8a6a3a');
    box(ctx, x + 4, gy - 32 + bob, 10, 3, skin);
    if ((t * 2) % 2 < 1.2) {
      ctx.globalAlpha = 0.28;
      for (let i = 0; i < 4; i++) box(ctx, x + 10 + i * 4, gy - 28 - ((t * 10 + i * 5) % 14), 2, 3, '#ffffff');
      ctx.globalAlpha = 1;
    }
  } else if (kind === 'pound') {
    // a mortar, and a pestle that does not stop
    box(ctx, x + 8, gy - 16, 14, 16, '#6f8f58');
    box(ctx, x + 8, gy - 17, 14, 2, '#83a76a');
    const lift = Math.max(0, swing) * 7;
    box(ctx, x + 13, gy - 30 - lift, 3, 14, '#a8804a');
    box(ctx, x + 4, gy - 34 - lift + bob, 10, 3, skin);
    if (swing < -0.8) for (let i = 0; i < 4; i++) box(ctx, x + 9 + i * 3, gy - 20 - i, 1, 1, '#8fb84a');
  } else if (kind === 'grill') {
    // skewers over coals, turned one at a time
    box(ctx, x + 6, gy - 14, 26, 10, '#4a4a50');
    for (let i = 0; i < 6; i++) box(ctx, x + 8 + i * 4, gy - 6, 3, 2, ((t * 3 + i) % 4) < 2 ? '#e8742c' : '#c2402c');
    for (let i = 0; i < 5; i++) {
      const turn = Math.sin(t * 3 + i * 1.3) * 1;
      box(ctx, x + 8 + i * 5, gy - 17 + turn, 4, 4, '#a85c2c');
      box(ctx, x + 8 + i * 5, gy - 17 + turn, 4, 1, '#c27a3c');
    }
    box(ctx, x + 4, gy - 28 + bob, 10, 3, skin);
    ctx.globalAlpha = 0.24;
    for (let i = 0; i < 6; i++) box(ctx, x + 8 + i * 4 + Math.sin(t * 2 + i) * 2, gy - 22 - ((t * 12 + i * 6) % 20), 2, 3, '#ffffff');
    ctx.globalAlpha = 1;
  } else {
    // shaving ice and pouring it into a bag
    box(ctx, x + 8, gy - 26, 16, 22, '#c2cad0');
    box(ctx, x + 8, gy - 27, 16, 2, '#dfe4e8');
    box(ctx, x + 12, gy - 32, 8, 6, '#9aa2a8');
    const spin = (t * 12) % 4;
    box(ctx, x + 13 + spin, gy - 12, 2, 2, '#ffffff');
    box(ctx, x + 4, gy - 30 + bob, 10, 3, skin);
    for (let i = 0; i < 4; i++) box(ctx, x + 26 + i * 4, gy - 22, 3, 12, ['#d88a3c', '#e88aa8', '#3a2a22', '#6a55d8'][i]);
  }
  void r;
}

/** One shop: the awning, the board, the counter, and the cook behind it. */
export function drawShop(ctx, x, t, shop, gy, i) {
  const col = shop.col;
  box(ctx, x - 64, 102, 128, 26, col);                       // awning
  for (let k = 0; k < 13; k++) box(ctx, x - 64 + k * 10, 102, 5, 26, shade(col, 0.16));
  box(ctx, x - 66, 126, 132, 4, shade(col, -0.3));
  box(ctx, x - 60, 131, 120, 19, shade(col, -0.16));         // the name board
  box(ctx, x - 60, 131, 120, 2, shade(col, 0.12));
  drawText(ctx, shop.nameShort || '', x - textWidth(shop.nameShort || '') / 2, 136, shop.sign);
  // the price list
  box(ctx, x - 58, 153, 54, 52, '#f2ece0');
  box(ctx, x - 58, 153, 54, 3, shade(col, 0.1));
  for (let k = 0; k < shop.menu.length; k++) {
    box(ctx, x - 54, 160 + k * 12, 26, 2, '#6a6254');
    box(ctx, x - 25, 160 + k * 12, 10, 2, '#a8564a');
    drawFood(ctx, x - 45, 168 + k * 12, shop.menu[k].key, 0.42);
  }
  // photographs of it all, on the other side
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 2; c++) {
      const px2 = x + 2 + c * 29, py2 = 153 + r * 27;
      box(ctx, px2, py2, 26, 25, '#dfd8c4');
      box(ctx, px2 + 1, py2 + 1, 24, 19, ['#a8562e', '#e8d8a8', '#6ea04a', '#c28a3a'][(r * 2 + c) % 4]);
      drawFood(ctx, px2 + 13, py2 + 14, shop.menu[(r * 2 + c) % shop.menu.length].key, 0.8);
    }
  }
  // the cook, then the counter in front of them
  drawCook(ctx, x + 34, gy - 34, shop.cook, t, i * 7 + 3);
  box(ctx, x - 64, gy - 32, 128, 32, '#9aa2a8');
  box(ctx, x - 64, gy - 32, 128, 4, '#c2cad0');
  box(ctx, x - 64, gy - 14, 128, 2, '#7f878c');
  for (let k = 0; k < 4; k++) {
    const tx = x - 54 + k * 28;
    box(ctx, tx, gy - 40, 22, 9, '#b8bec2');
    box(ctx, tx + 1, gy - 39, 20, 7, ['#a8562e', '#e8d8a8', '#6ea04a', '#c28a3a'][k]);
    drawFood(ctx, tx + 11, gy - 35, shop.menu[k % shop.menu.length].key, 0.5);
    if (((t * 1.4 + k) % 3) < 1.6) {
      ctx.globalAlpha = 0.2;
      box(ctx, tx + 8 + Math.sin(t * 2 + k) * 2, gy - 48 - ((t * 9 + k * 7) % 12), 3, 4, '#ffffff');
      ctx.globalAlpha = 1;
    }
  }
  box(ctx, x - 64, gy - 48, 128, 2, '#d8dee2');
  box(ctx, x - 64, gy - 48, 2, 16, '#d8dee2');
  box(ctx, x + 62, gy - 48, 2, 16, '#d8dee2');
}

export function drawCanteen(ctx, cam, t, o = {}) {
  const gy = GROUND;
  const v = (wx) => wx - cam;
  vgrad(ctx, 0, 0, W, 80, '#bdb59d', '#ded6bb');
  box(ctx, 0, 0, W, 26, '#a49c84');
  for (let x = -Math.round(cam * 0.6) % 60; x < W; x += 60) box(ctx, x, 0, 3, 26, '#8e8670');
  box(ctx, 0, 26, W, 3, '#7f7764');
  box(ctx, 0, 29, W, 191, '#e0d8bd');
  box(ctx, 0, 216, W, 8, '#c5bda1');
  box(ctx, 0, 224, W, H - 224, '#bcb49c');
  for (let x = -Math.round(cam) % 34; x < W; x += 34) box(ctx, x, 224, 1, H - 224, '#a9a18a');
  for (let i = 0; i < 11; i++) box(ctx, 0, 225 + i * 8, W, 1, shade('#bcb49c', -0.04 - i * 0.014));

  // tube lights under the roof
  for (const wx of [270, 520, 770, 1020, 1270]) {
    const x = v(wx);
    if (x < -40 || x > W + 40) continue;
    box(ctx, x - 28, 30, 56, 5, '#d8d4c8');
    box(ctx, x - 26, 35, 52, 3, '#fbfaf2');
  }
  // a band of breeze blocks — the patterned vent bricks every Thai canteen
  // has — with the day showing through them
  box(ctx, 0, 44, W, 42, '#e8e0c6');
  for (let wx = Math.floor(cam / 14) * 14 - 14; wx < cam + W + 14; wx += 14) {
    const x = v(wx);
    for (let row = 0; row < 3; row++) {
      const y = 46 + row * 13;
      box(ctx, x + 1, y + 1, 12, 11, '#cfc5a8');
      box(ctx, x + 3, y + 3, 8, 7, '#a9cfe0');
      box(ctx, x + 6, y + 3, 2, 7, '#cfc5a8');
      box(ctx, x + 3, y + 6, 8, 1, '#cfc5a8');
      box(ctx, x + 3, y + 3, 3, 1, '#ffffff');
    }
  }
  box(ctx, 0, 86, W, 4, '#c5bda1');
  // and a banner with the school's name on it, every so often
  for (let wx = 150; wx < 1500; wx += 500) {
    const x = v(wx);
    const bw = textWidth(bannerText) + 44;
    if (x < -bw || x > W + 20) continue;
    box(ctx, x, 60, bw, 22, '#2f3a63');
    box(ctx, x, 60, bw, 2, '#4a5890');
    drawLogo(ctx, x + 14, 63, 1.1);
    drawText(ctx, bannerText, x + 30, 66, '#f4ecd0');
  }

  for (let i = 0; i < SHOPS.length; i++) {
    const s = SHOPS[i];
    const x = v(s.x);
    if (x < -140 || x > W + 60) continue;
    drawShop(ctx, x, t, s, gy, i);
  }
  // fans, hanging lines of bags, a clock
  for (const fx of [270, 520, 770, 1020, 1270]) {
    const x = v(fx);
    if (x > -30 && x < W + 30) drawFan(ctx, x, 104, t * 0.9);
  }
  for (const wx of [280, 530, 780, 1030]) {
    const x = v(wx);
    if (x < -20 || x > W + 20) continue;
    box(ctx, x - 16, 128, 32, 3, '#9a9280');
    for (let i = 0; i < 6; i++) box(ctx, x - 14 + i * 6, 131, 4, 9, ['#e8e4d8', '#d8e4ea', '#e8e4d8', '#efe0c8', '#dfe8ea', '#f0e0d0'][i]);
  }
  // the coupon window at the end
  const cw = v(1330);
  if (cw > -70 && cw < W + 20) {
    box(ctx, cw - 34, 140, 68, 50, '#b8b098');
    box(ctx, cw - 30, 144, 60, 42, '#6f7a80');
    box(ctx, cw - 30, 174, 60, 12, '#d8d0b8');
    box(ctx, cw - 14, 158, 28, 12, '#e8e0cc');
    box(ctx, cw - 38, gy - 42, 76, 42, '#a49c86');
    box(ctx, cw - 38, gy - 42, 76, 4, '#c2baa2');
  }
  const bn = v(1420);
  box(ctx, bn, gy - 20, 18, 20, '#4e7a5c');
  box(ctx, bn - 1, gy - 22, 20, 3, '#3c6048');
  void o;
}

/** Tables and stools, in front of everyone eating at them. */
export function drawCanteenFg(ctx, cam) {
  for (let wx = 140; wx < 1500; wx += 150) {
    const x = wx - cam;
    if (x < -100 || x > W + 100) continue;
    for (let i = 0; i < 4; i++) {
      const sx = x - 46 + i * 31;
      box(ctx, sx - 8, 276, 16, 4, '#c25a4a');
      box(ctx, sx - 1, 280, 3, 18, '#8a8f94');
    }
    box(ctx, x - 72, 260, 144, 6, '#d8c088');
    box(ctx, x - 72, 266, 144, 4, '#b89c64');
    box(ctx, x - 66, 270, 5, 30, '#8a8f94');
    box(ctx, x + 61, 270, 5, 30, '#8a8f94');
    // whatever people left on it
    const r = rng(wx);
    for (let i = 0; i < 4; i++) {
      const tx = x - 48 + i * 30;
      if (r.chance(0.6)) {
        box(ctx, tx - 10, 256, 20, 6, '#b9b2a4');
        box(ctx, tx - 10, 256, 20, 1, '#d8d2c4');
        drawFood(ctx, tx, 258, ['kaprao', 'somtam', 'tomyum', 'gaitod'][i % 4], 0.6);
      } else if (r.chance(0.5)) drawFood(ctx, tx, 262, ['chayen', 'nomyen', 'anchan'][i % 3], 0.7);
    }
  }
}
