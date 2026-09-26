/* ============================================================================
 *  human.js — the people, as pixel sprites.
 *
 *  The anatomy is the reference sheet's: a big square head with a helmet of
 *  hair and no face, a short neck, square shoulders, arms that hang straight
 *  to the hip, two straight legs with a gap between them, and shoes that
 *  stick out.  Every part is drawn in whole logical pixels with a soft dark
 *  edge and three tones of its own colour, lit from the upper left.
 *
 *  There are three views — from the front, from the side when walking, and
 *  from behind for anyone sitting at a desk facing the board — and the pose
 *  is a set of numbers (where the hands are, how far down the hips are, how
 *  turned the body is) so one pose eases into the next.
 * ==========================================================================*/

import { clamp, lerp, shade, rng, mix } from './core.js';

export const OUTFITS = {
  /* Thai school: white short sleeves, navy below, a name badge on the chest */
  thaiGirl: { top: '#f4f4ef', topSh: '#d6d7d0', sleeve: 0.34,
              bottom: '#2f3a63', bottomSh: '#222a4a', skirt: 0.2, sock: '#fbfbf6', sockH: 0.17,
              shoe: '#2a2730', accent: null, collar: '#ffffff', badge: '#d84f4f', pleat: true },
  thaiBoy:  { top: '#f4f4ef', topSh: '#d6d7d0', sleeve: 0.34,
              bottom: '#2f3a63', bottomSh: '#222a4a', skirt: 0, sock: '#fbfbf6', sockH: 0.2,
              shoe: '#2a2730', accent: null, collar: '#ffffff', badge: '#3f6ea8', shorts: 0.16 },
  thaiTeach:{ top: '#e8e2d4', topSh: '#c9c3b4', sleeve: 0.6,
              bottom: '#4a4256', bottomSh: '#372f42', skirt: 0.3, sock: null,
              shoe: '#3b3038', accent: '#b8973c', collar: '#f4f0e4' },
  thaiTeach2:{ top: '#dfe6ea', topSh: '#bfc8cd', sleeve: 0.75,
              bottom: '#3a4048', bottomSh: '#2b3038', skirt: 0, sock: null,
              shoe: '#33303a', accent: '#5a6a8a', collar: '#f0f4f6' },
  thaiTeach3:{ top: '#f2e2e6', topSh: '#d4c2c8', sleeve: 0.5,
              bottom: '#6a4a5c', bottomSh: '#513747', skirt: 0.26, sock: null,
              shoe: '#4a3a42', accent: '#b8973c', collar: '#faf0f2' },
  pe:       { top: '#e9eef2', topSh: '#c8d0d6', sleeve: 0.3,
              bottom: '#a8342f', bottomSh: '#7f2622', skirt: 0, sock: '#ffffff', sockH: 0.16,
              shoe: '#33323a', accent: null, collar: '#e9eef2', shorts: 0.22 },
  /* the older story, kept */
  uniformA: { top: '#f4f2ec', topSh: '#d5d2c7', sleeve: 0.5,
              bottom: '#333e66', bottomSh: '#232c4c', skirt: 0.18, sock: '#f4f2ec', sockH: 0.16,
              shoe: '#3a3742', accent: '#b8384c', collar: '#ffffff', pleat: true },
  uniformB: { top: '#f4f2ec', topSh: '#d5d2c7', sleeve: 0.5,
              bottom: '#333e66', bottomSh: '#232c4c', skirt: 0, sock: null,
              shoe: '#3a3742', accent: '#3f5f8c', collar: '#ffffff' },
  blazerA:  { top: '#3b4568', topSh: '#2a3250', sleeve: 1,
              bottom: '#333e66', bottomSh: '#232c4c', skirt: 0.18, sock: '#f4f2ec', sockH: 0.16,
              shoe: '#3a3742', accent: '#b8384c', collar: '#f4f2ec', open: true },
  blazerB:  { top: '#3b4568', topSh: '#2a3250', sleeve: 1,
              bottom: '#333e66', bottomSh: '#232c4c', skirt: 0, sock: null,
              shoe: '#3a3742', accent: '#3f5f8c', collar: '#f4f2ec', open: true },
  cardigan: { top: '#e2cfae', topSh: '#c2ad8c', sleeve: 1,
              bottom: '#4c4a6e', bottomSh: '#383654', skirt: 0.2, sock: null,
              shoe: '#5b483a', accent: '#c4786a', collar: '#f2ece0' },
  hoodie:   { top: '#5f7d90', topSh: '#476373', sleeve: 1,
              bottom: '#3b4350', bottomSh: '#2b313c', skirt: 0, sock: null,
              shoe: '#43424c', accent: null, collar: '#7f9dad' },
  summerA:  { top: '#f6ecd9', topSh: '#dccdb4', sleeve: 0.25,
              bottom: '#7fa0bc', bottomSh: '#62819b', skirt: 0.22, sock: null,
              shoe: '#cbb79c', accent: '#e4a2ab', collar: '#fbf4e6' },
  summerB:  { top: '#dfeaf0', topSh: '#bfcfd8', sleeve: 0.25,
              bottom: '#6d7787', bottomSh: '#525b6a', skirt: 0, sock: null,
              shoe: '#b3a389', accent: null, collar: '#eef5f8' },
  coatA:    { top: '#b06a5e', topSh: '#8d5348', sleeve: 1, long: 0.1,
              bottom: '#3c3c50', bottomSh: '#2c2c3c', skirt: 0, sock: null,
              shoe: '#4d3d34', accent: '#f0e0d0', collar: '#c98a7c' },
  coatB:    { top: '#4d5d54', topSh: '#394740', sleeve: 1, long: 0.12,
              bottom: '#353a4c', bottomSh: '#272a38', skirt: 0, sock: null,
              shoe: '#3c3538', accent: '#c8b8a0', collar: '#5f7166' },
  adultA:   { top: '#ece2d5', topSh: '#cec2b2', sleeve: 0.7,
              bottom: '#5d5366', bottomSh: '#473f52', skirt: 0.24, sock: null,
              shoe: '#4d3f3d', accent: '#a8768a', collar: '#f4ece0' },
  adultB:   { top: '#d3dce0', topSh: '#b3bfc5', sleeve: 0.8,
              bottom: '#484d60', bottomSh: '#363a49', skirt: 0, sock: null,
              shoe: '#3c3639', accent: null, collar: '#e2e9ec' },
  child:    { top: '#f6e2ac', topSh: '#dcc488', sleeve: 0.4,
              bottom: '#7f8fc4', bottomSh: '#6371a4', skirt: 0, sock: '#ffffff', sockH: 0.1,
              shoe: '#d4705f', accent: '#e88a8a', collar: '#f6e2ac' },
  vendor:   { top: '#cf7b4a', topSh: '#a95f36', sleeve: 0.4,
              bottom: '#4a4a52', bottomSh: '#36363e', skirt: 0, sock: null,
              shoe: '#6a5a4a', accent: null, collar: '#e29a68', apron: '#e8e0cc' },
};

/* ---------------------------------------------------------------- people --*/

export const CHARS = {
  A: { h: 56, skin: '#f6d2ab', skinSh: '#dcb086', hair: '#2f2836', hairHi: '#4e4258',
       style: 'ponytail', build: 0.94, eye: '#332b38' },                       // Nim
  B: { h: 60, skin: '#eec49a', skinSh: '#cfa377', hair: '#3a2a20', hairHi: '#5b4231',
       style: 'short', build: 1.05, eye: '#2e2620' },                          // Beam
  C: { h: 32, skin: '#f8d8b8', skinSh: '#dcb18c', hair: '#3b2c30', hairHi: '#5c464c',
       style: 'bob', build: 0.9, eye: '#332b30' },                             // the child
  D: { h: 54, skin: '#f2cca4', skinSh: '#d6a97e', hair: '#241d28', hairHi: '#443a4c',
       style: 'bob', build: 0.98, eye: '#2e2632' },                            // Fon
  E: { h: 57, skin: '#e8bb8c', skinSh: '#c9996c', hair: '#221a18', hairHi: '#3f2f2a',
       style: 'crop', build: 1.08, eye: '#28201e' },                           // Gap
  T: { h: 55, skin: '#eec9a2', skinSh: '#d0a77c', hair: '#2a2228', hairHi: '#494049',
       style: 'bun', build: 1.02, eye: '#2b2328' },                            // Kru Malee
  S: { h: 61, skin: '#e2b98e', skinSh: '#c39a6e', hair: '#1f1a1c', hairHi: '#3b3234',
       style: 'crop', build: 1.12, eye: '#241e20' },                           // Kru Somchai
  O: { h: 53, skin: '#f4d0ac', skinSh: '#d8ad84', hair: '#4a2e22', hairHi: '#75503a',
       style: 'ponytail', build: 0.96, eye: '#2f2420' },                       // Kru Oi
  F: { h: 55, skin: '#eec9a0', skinSh: '#d0a678', hair: '#2b2130', hairHi: '#4c4056',
       style: 'ponytail', build: 0.96, eye: '#2d2432' },                       // Muk
  G: { h: 58, skin: '#dcae80', skinSh: '#bd8f62', hair: '#241c18', hairHi: '#42332a',
       style: 'short', build: 1.04, eye: '#261e1a' },                          // Ton
  // the canteen cooks
  K1: { h: 55, skin: '#dcae80', skinSh: '#bd8f62', hair: '#2a2228', hairHi: '#494049', style: 'bun', build: 1.16, eye: '#261e1a' },
  K2: { h: 60, skin: '#d8a878', skinSh: '#b8885a', hair: '#1f1a1c', hairHi: '#3b3234', style: 'crop', build: 1.1, eye: '#241e20' },
  K3: { h: 54, skin: '#e8bb8c', skinSh: '#c9996c', hair: '#3a2a20', hairHi: '#5b4231', style: 'bob', build: 1.08, eye: '#2e2620' },
  K4: { h: 59, skin: '#e2b98e', skinSh: '#c39a6e', hair: '#241c18', hairHi: '#42332a', style: 'short', build: 1.06, eye: '#261e1a' },
  K5: { h: 54, skin: '#f2cca4', skinSh: '#d6a97e', hair: '#5a3a2a', hairHi: '#86604a', style: 'bun', build: 1.12, eye: '#2e2632' },
  // everybody else in the school
  X1: { h: 55, skin: '#eec49a', skinSh: '#cfa377', hair: '#2a2024', hairHi: '#4a3e44', style: 'long', build: 0.95, eye: '#2e2620' },
  X2: { h: 59, skin: '#e0b184', skinSh: '#c1915f', hair: '#1e1a1a', hairHi: '#3a3030', style: 'crop', build: 1.0, eye: '#241e20' },
  X3: { h: 53, skin: '#f6d2ab', skinSh: '#dcb086', hair: '#3a2a26', hairHi: '#5c4640', style: 'bob', build: 0.97, eye: '#332b38' },
  X4: { h: 61, skin: '#d8a878', skinSh: '#b8885a', hair: '#221a18', hairHi: '#3f2f2a', style: 'short', build: 1.1, eye: '#28201e' },
  X5: { h: 54, skin: '#f2cca4', skinSh: '#d6a97e', hair: '#2f2230', hairHi: '#50405a', style: 'ponytail', build: 0.92, eye: '#2d2432' },
  X6: { h: 57, skin: '#e8bb8c', skinSh: '#c9996c', hair: '#2a2222', hairHi: '#4a3c3c', style: 'short', build: 0.98, eye: '#261e1a' },
  X7: { h: 52, skin: '#eec9a0', skinSh: '#d0a678', hair: '#4a3024', hairHi: '#6e4c3a', style: 'long', build: 0.93, eye: '#2f2420' },
  X8: { h: 58, skin: '#dcae80', skinSh: '#bd8f62', hair: '#18141a', hairHi: '#342c36', style: 'crop', build: 1.05, eye: '#241e20' },
};

/* ------------------------------------------------------------------ tones --*/

const toneCache = new Map();
function tone(c) {
  let t = toneCache.get(c);
  if (!t) {
    t = { hi: shade(c, 0.13), base: c, sh: shade(c, -0.16), dk: shade(c, -0.42) };
    toneCache.set(c, t);
  }
  return t;
}
const P = (ctx, x, y, w, h, c) => {
  if (w <= 0 || h <= 0) return;
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
};

/* ------------------------------------------------------------------ poses --*/
/*  hands are offsets from the shoulder joint, in pixels: x is outward from
    the body in the front and back views, forward in the side view.  sit,
    ground and crouch say how far the hips have come down and how.          */

const BASE = {
  turn: 0, back: 0, sit: 0, ground: 0, crouch: 0, bob: 0, walk: 0, run: 0, gait: 0,
  hLx: 1, hLy: 16, hRx: 1, hRy: 16, fL: 0, fR: 0, sL: 0, sR: 0,
  headDy: 0, look: 0, desk: 0,
};

export function poseOf(pose, ph) {
  const s = Math.sin(ph), c = Math.cos(ph);
  switch (pose) {
    case 'walk':
      return { ...BASE, turn: 1, walk: 1, gait: ph, hLx: 0, hLy: 15, hRx: 0, hRy: 15 };
    case 'run':
      return { ...BASE, turn: 1, walk: 1, run: 1, gait: ph, hLx: 0, hLy: 11, hRx: 0, hRy: 11 };
    case 'sit_desk':        // from behind, arms forward onto the desk
      return { ...BASE, back: 1, sit: 1, desk: 1, hLx: -3, hLy: 9, hRx: -3, hRy: 9 };
    case 'write':
      return { ...BASE, back: 1, sit: 1, desk: 1, hLx: -3, hLy: 9, hRx: -2 + s * 1.2, hRy: 8, headDy: 1 };
    case 'sleep_desk':
      return { ...BASE, back: 1, sit: 1, desk: 1, hLx: -4, hLy: 7, hRx: -4, hRy: 7, headDy: 4 };
    case 'raise_hand':
      return { ...BASE, hLx: 1, hLy: 16, hRx: 1, hRy: -15 };
    case 'raise_desk':
      return { ...BASE, back: 1, sit: 1, desk: 1, hLx: -3, hLy: 9, hRx: 1, hRy: -15 };
    case 'board':           // from behind, writing on the board with the right hand
      return { ...BASE, back: 1, hLx: 1, hLy: 15, hRx: 3 + s * 1.6, hRy: -16 + Math.cos(ph * 2.7) * 1.2 };
    case 'sit_turn':        // turned round in the chair to talk to somebody
      return { ...BASE, sit: 1, turn: 1, hLx: 2, hLy: 12, hRx: 5, hRy: 9 + s * 1.5 };
    case 'sit_chair':
    case 'sit_log':
      return { ...BASE, sit: 1, hLx: 0, hLy: 13, hRx: 0, hRy: 13 };
    case 'eat':
      return { ...BASE, sit: 1, desk: 1, hLx: -3, hLy: 11, hRx: -3, hRy: 4 + (s > 0 ? -2 : 0) };
    case 'sit_ground':
      return { ...BASE, ground: 1, hLx: 2, hLy: 12, hRx: 2, hRy: 12 };
    case 'sit_knees':
      return { ...BASE, ground: 1, hLx: -1, hLy: 12, hRx: -1, hRy: 12 };
    case 'crouch':
      return { ...BASE, crouch: 1, hLx: 2, hLy: 10, hRx: 2, hRy: 10 };
    case 'reach':
      return { ...BASE, crouch: 1, turn: 1, hLx: 2, hLy: 11, hRx: 9, hRy: 9 };
    case 'wave':
      return { ...BASE, hLx: 1, hLy: 16, hRx: 5 + s * 2, hRy: -11 };
    case 'wai':
      return { ...BASE, hLx: -5, hLy: 6, hRx: -5, hRy: 6, headDy: 1 };
    case 'hold':
      return { ...BASE, hLx: 1, hLy: 16, hRx: 3, hRy: 15 };
    case 'hug':
      return { ...BASE, hLx: -4, hLy: 8, hRx: -4, hRy: 8 };
    case 'arms_crossed':
      return { ...BASE, hLx: -6, hLy: 8, hRx: -6, hRy: 9 };
    case 'pockets':
      return { ...BASE, hLx: 0, hLy: 13, hRx: 0, hRy: 13 };
    case 'umbrella':
      return { ...BASE, hLx: 1, hLy: 16, hRx: -2, hRy: 2 };
    case 'point':
      return { ...BASE, hLx: 1, hLy: 16, hRx: 11, hRy: 3 };
    case 'read':
      return { ...BASE, hLx: -4, hLy: 8, hRx: -4, hRy: 8, headDy: 1 };
    case 'tray':
      return { ...BASE, hLx: -3, hLy: 10, hRx: -3, hRy: 10 };
    case 'stretch':
      return { ...BASE, hLx: 3, hLy: -15, hRx: 3, hRy: -15, look: -1 };
    case 'lookout':
      return { ...BASE, hLx: 1, hLy: 16, hRx: -3, hRy: -3, look: -1 };
    case 'think':
      return { ...BASE, hLx: -3, hLy: 11, hRx: -4, hRy: 3 };
    case 'stargaze':
      return { ...BASE, hLx: 1, hLy: 16, hRx: 1, hRy: 16, look: -1 };
    case 'shock':
      return { ...BASE, hLx: 5, hLy: 6, hRx: 5, hRy: 6 };
    default:
      return { ...BASE };
  }
}

export function blendPose(a, b, k) {
  if (k >= 1) return b;
  const out = {};
  for (const key in BASE) out[key] = lerp(a[key], b[key], k);
  out.back = k < 0.5 ? a.back : b.back;
  out.gait = b.walk > 0.5 ? b.gait : a.gait;
  out.run = b.walk > 0.5 ? b.run : a.run;
  return out;
}

const IDLE_POSES = ['stand', 'pockets', 'arms_crossed', 'lookout', 'think', 'stretch'];

/* -------------------------------------------------------------- body plan --*/
/*
 *  A person is painted into a small buffer of material + tone per pixel,
 *  part by part from the back to the front, the way you would paint one by
 *  hand: the far arm, the far leg, the near leg, the skirt, the shirt, the
 *  head, the hair, the near arm.  Heads and hair are drawn pixel by pixel
 *  (the grids below); limbs are tapered — wide at the shoulder and thigh,
 *  thin at the wrist and ankle — and bend at the elbow and knee.  Once every
 *  part is down, three passes finish it: each part is lit from the upper
 *  left, a part that is behind another gets a thin shadow line where they
 *  meet, and the whole figure gets an outline in the darkest shade of
 *  whatever it is next to.
 */

const MAT = { SKIN: 1, HAIR: 2, TOP: 3, BOT: 4, SOCK: 5, SHOE: 6, COLLAR: 7, ACC: 8, BADGE: 9,
  BELT: 10, APRON: 11, TAG: 12, GOLD: 13, TIE: 14, SOLE: 15, NAVY: 16 };
const BW = 64, BH = 104, OX = 32, OY = 94;          // the buffer, and where the feet go in it
const bMat = new Uint8Array(BW * BH), bTone = new Uint8Array(BW * BH), bPart = new Uint8Array(BW * BH);
const tMat = new Uint8Array(BW * BH), tTone = new Uint8Array(BW * BH), tPart = new Uint8Array(BW * BH);
const partFlags = [];
let curPart = 0, curDim = 0, flipX = false;
let scratch = null, scratchCtx = null, scratchImg = null;
const spriteCache = new Map();

const rgbCache = new Map();
function rgbOf(hex) {
  let v = rgbCache.get(hex);
  if (!v) {
    const n = parseInt(hex.slice(1), 16);
    v = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    rgbCache.set(hex, v);
  }
  return v;
}
const palCache = new Map();
/** Four tones of one colour: light, base, shade, and the deep line colour. */
function tones4(hex, shHex) {
  const key = hex + (shHex || '');
  let t = palCache.get(key);
  if (!t) {
    const sh = shHex || shade(hex, -0.16);
    t = [rgbOf(shade(hex, 0.12)), rgbOf(hex), rgbOf(sh), rgbOf(mix(shade(sh, -0.34), '#1a1420', 0.28))];
    palCache.set(key, t);
  }
  return t;
}

function newPart(flags = {}) {
  curPart++;
  partFlags[curPart] = flags;
  return curPart;
}
function put(x, y, mat, tone = 1) {
  x = Math.round(x) + OX; y = Math.round(y) + OY;
  if (x < 0 || y < 0 || x >= BW || y >= BH) return;
  const i = y * BW + x;
  bMat[i] = mat; bTone[i] = Math.min(3, tone + curDim); bPart[i] = curPart;
}
function span(y, x0, x1, mat, tone = 1) {
  for (let x = Math.round(x0); x <= Math.round(x1); x++) put(x, y, mat, tone);
}
/** A tapered limb: every pixel within r0..r1 of the segment. */
function limb(x0, y0, x1, y1, r0, r1, matFn) {
  const minX = Math.floor(Math.min(x0, x1) - Math.max(r0, r1) - 1), maxX = Math.ceil(Math.max(x0, x1) + Math.max(r0, r1) + 1);
  const minY = Math.floor(Math.min(y0, y1) - Math.max(r0, r1) - 1), maxY = Math.ceil(Math.max(y0, y1) + Math.max(r0, r1) + 1);
  const dx = x1 - x0, dy = y1 - y0, L2 = dx * dx + dy * dy || 1;
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const px = x + 0.5 - 0.5, py = y + 0.5 - 0.5;
      let t = ((px - x0) * dx + (py - y0) * dy) / L2;
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      const qx = x0 + dx * t - px, qy = y0 + dy * t - py;
      const r = r0 + (r1 - r0) * t;
      if (qx * qx + qy * qy <= r * r + 0.15) {
        const m = matFn(t, x, y);
        if (m) put(x, y, m[0], m[1] === undefined ? 1 : m[1]);
      }
    }
  }
}
/** Stamp a hand-drawn grid.  Each character maps to [material, tone]. */
function grid(rows, x, y, key, mirror = false) {
  const w = rows[0].length;
  for (let j = 0; j < rows.length; j++) {
    const row = rows[j];
    for (let i = 0; i < w; i++) {
      const m = key[row[mirror ? w - 1 - i : i]];
      if (m) put(x + i, y + j, m[0], m[1]);
    }
  }
}

/* --------------------------------------------------------------- heads --*/
/*  15 wide.  The face is columns 3..11 (9 wide) and rows 3..12 (10 tall);
    the neck starts under row 12.  S skin, s skin shade, e ear, n ear shadow. */

const FACE = {
  front: [
    '...............',
    '...............',
    '...............',
    '.....SSSSS.....',
    '....SSSSSSS....',
    '...SSSSSSSSS...',
    '...SSSSSSSSS...',
    '..eSSSSSSSSSe..',
    '..nSSSSSSSSsn..',
    '...SSSSSSSSs...',
    '...SSSSSSSSs...',
    '....SSSSSSs....',
    '.....ssSss.....',
  ],
  side: [
    '...............',
    '...............',
    '...............',
    '.....SSSSSS....',
    '....SSSSSSSS...',
    '...SSSSSSSSSS..',
    '...SSSSSSSSSS..',
    '...SSSSSSSSSS..',
    '...SSeSSSSSSSS.',
    '...SSnSSSSSSS..',
    '...sSSSSSSSSS..',
    '....ssSSSSSSs..',
    '......ssSSss...',
  ],
  back: [
    '...............',
    '...............',
    '...............',
    '.....SSSSS.....',
    '....SSSSSSS....',
    '...SSSSSSSSS...',
    '...SSSSSSSSS...',
    '..eSSSSSSSSSe..',
    '..nSSSSSSSSsn..',
    '...SSSSSSSSs...',
    '...ssSSSSSss...',
    '....ssssssS....',
    '.....sssss.....',
  ],
};

/*  Hair, same frame as the face.  H hair, h light, d shade, D deep, r tie.
    Each style has a front, a side (facing right) and a back.              */
const HAIR = {
  short: {
    front: [
      '...............',
      '.....HHHHHd....',
      '...HhhhHHHHd...',
      '..HhhHHHHHHHd..',
      '..HhHHHHHHHHd..',
      '..HHHHHHHHHdd..',
      '..HHHHdHHddHd..',
      '..HHH.....dHd..',
      '...H.......d...',
    ],
    side: [
      '...............',
      '....HHHHHH.....',
      '...HhhhhHHHd...',
      '..HhhHHHHHHHd..',
      '..HHHHHHHHHHHd.',
      '..HHHHHHHHddd..',
      '..HHHHHdd......',
      '..HHHd.........',
      '..HHd..........',
      '..Hd...........',
    ],
    back: [
      '...............',
      '.....HHHHH.....',
      '...HhhhHHHHd...',
      '..HhhHHHHHHHd..',
      '..HhHHHHHHHHd..',
      '..HHHHHHHHHHd..',
      '..HHHHHHHHHHd..',
      '..dHHHHHHHHdd..',
      '...dHHHHHHdd...',
      '....ddHHdd.....',
    ],
  },
  crop: {
    front: [
      '...............',
      '...............',
      '....HHHHHHH....',
      '...HhhhHHHHd...',
      '..HhHHHHHHHHd..',
      '..HHHHHHHHHHd..',
      '..HdddddddddD..',
      '..H.........d..',
    ],
    side: [
      '...............',
      '...............',
      '....HHHHHHH....',
      '...HhhhhHHHd...',
      '..HhHHHHHHHHd..',
      '..HHHHHHHHddd..',
      '..HHHHdd.......',
      '..HHHd.........',
      '..HHd..........',
      '..dd...........',
    ],
    back: [
      '...............',
      '...............',
      '....HHHHHHH....',
      '...HhhhHHHHd...',
      '..HhHHHHHHHHd..',
      '..HHHHHHHHHHd..',
      '..HHHHHHHHHHd..',
      '..dHHHHHHHHHd..',
      '...ddHHHHHdd...',
      '.....ddddd.....',
    ],
  },
  bob: {
    front: [
      '...............',
      '.....HHHHH.....',
      '...HHhhhHHHd...',
      '..HhhHHHHHHHd..',
      '.HhHHHHHHHHHHd.',
      '.HHHHHHHHHHHHd.',
      '.HHddddddddHHd.',
      '.HH.........Hd.',
      '.HH.........Hd.',
      '.HH.........Hd.',
      '.HHd.......dHd.',
      '.dHd.......ddD.',
      '..d.........d..',
    ],
    side: [
      '...............',
      '....HHHHHH.....',
      '...HhhhhHHHd...',
      '..HhhHHHHHHHd..',
      '.HhHHHHHHHHHHd.',
      '.HHHHHHHHHdddd.',
      '.HHHHHHHd......',
      '.HHHHHHd.......',
      '.HHHHHHd.......',
      '.HHHHHd........',
      '.HHHHHd........',
      '.dHHHdd........',
      '..dddd.........',
    ],
    back: [
      '...............',
      '.....HHHHH.....',
      '...HhhhHHHHd...',
      '..HhhHHHHHHHd..',
      '.HhHHHHHHHHHHd.',
      '.HhHHHHHHHHHHd.',
      '.HHHHHHHHHHHHd.',
      '.HHHHHdHHHHHHd.',
      '.HHHHHdHHHHHdd.',
      '.HHHHdHHHdHHHd.',
      '.HHHHdHHHdHHHd.',
      '.dHHdHHHHHdHdd.',
      '..ddddddddddd..',
    ],
  },
  ponytail: {
    front: [
      '...............',
      '.....HHHHH.....',
      '...HHhhhHHHd...',
      '..HhhHHHHHHHd..',
      '..HhHHHHHHHHd..',
      '..HHHHHHHHHHd..',
      '..HHddd.ddHHd..',
      '..HH.......Hd..',
      '..Hd.......d...',
      '...d...........',
    ],
    side: [
      '...............',
      '....HHHHHH.....',
      '...HhhhhHHHd...',
      '..HhhHHHHHHHd..',
      '..HhHHHHHHHHHd.',
      '..HHHHHHHHdddd.',
      '..HHHHHHd......',
      '..HHHHHd.......',
      '..rHHHd........',
      '..HHHd.........',
    ],
    back: [
      '...............',
      '.....HHHHH.....',
      '...HhhhHHHHd...',
      '..HhhHHHHHHHd..',
      '..HhHHdHHHHHd..',
      '..HHHHdHHHHHd..',
      '..HHHHHdHHHHd..',
      '..dHHHHdHHHdd..',
      '...ddHHrHHdd...',
      '.....drrrd.....',
    ],
  },
  bun: {
    front: [
      '......HHH......',
      '.....HhHHd.....',
      '....HHHHHHd....',
      '...HhhhHHHHd...',
      '..HhHHHHHHHHd..',
      '..HHHHHHHHHHd..',
      '..HHHddddHHHd..',
      '..HH.......Hd..',
      '..Hd.......d...',
    ],
    side: [
      '...............',
      '.HHH.HHHHH.....',
      'HhHHHhhhHHHd...',
      'HHHHhHHHHHHHd..',
      '.dHHHHHHHHHHHd.',
      '..HHHHHHHHdddd.',
      '..HHHHHdd......',
      '..HHHHd........',
      '..HHHd.........',
      '..dd...........',
    ],
    back: [
      '.....HHHH......',
      '....HhhHHd.....',
      '....HHHHHd.....',
      '...HdddddHd....',
      '..HhhHHHHHHd...',
      '..HhHHHHHHHHd..',
      '..HHHHHHHHHHd..',
      '..HHHHHHHHHHd..',
      '..dHHHHHHHHdd..',
      '...ddHHHHdd....',
      '.....dddd......',
    ],
  },
  long: {
    front: [
      '...............',
      '.....HHHHH.....',
      '...HHhhhHHHd...',
      '..HhhHHHHHHHd..',
      '.HhHHHHHHHHHHd.',
      '.HHHHHdddHHHHd.',
      '.HHHd.....dHHd.',
      '.HH.........Hd.',
      '.HH.........Hd.',
      '.HH.........Hd.',
      '.HH.........Hd.',
      '.HHd.......dHd.',
      '.HHd.......dHd.',
      '.HHd.......dHd.',
      '.HHd.......dHd.',
      '.dHd.......ddd.',
    ],
    side: [
      '...............',
      '....HHHHHH.....',
      '...HhhhhHHHd...',
      '..HhhHHHHHHHd..',
      '.HhHHHHHHHHHHd.',
      '.HHHHHHHHHdddd.',
      '.HHHHHHHd......',
      '.HHHHHHd.......',
      '.HHHHHHd.......',
      '.HHHHHd........',
      '.HHHHHd........',
      '.HHHHHd........',
      '.HHHHd.........',
      '.HHHHd.........',
      '.HHHHd.........',
      '.dHHd..........',
      '..dd...........',
    ],
    back: [
      '...............',
      '.....HHHHH.....',
      '...HhhhHHHHd...',
      '..HhhHHHHHHHd..',
      '.HhHHHHHHHHHHd.',
      '.HhHHHHHHHHHHd.',
      '.HHHHHdHHHHHHd.',
      '.HHHHHdHHHHHHd.',
      '.HHHHHdHHHHHdd.',
      '.HHHHdHHHdHHHd.',
      '.HHHHdHHHdHHHd.',
      '.HHHHdHHHdHHHd.',
      '.HHHHdHHHdHHHd.',
      '.HHHdHHHHHdHHd.',
      '.HHHdHHHHHdHHd.',
      '.dHHdHHHHHdHdd.',
      '..ddddddddddd..',
    ],
  },
};

const FACE_KEY = {
  S: [MAT.SKIN, 1], s: [MAT.SKIN, 2], k: [MAT.SKIN, 0], e: [MAT.SKIN, 2], n: [MAT.SKIN, 3],
};
const HAIR_KEY = {
  H: [MAT.HAIR, 1], h: [MAT.HAIR, 0], d: [MAT.HAIR, 2], D: [MAT.HAIR, 3], r: [MAT.TIE, 1],
};

/* ---------------------------------------------------------------- gait --*/
/*  One leg through a stride, in eight keys: heel strike, loading, passing,
    push-off, toe-off, lift, swing, reach.  Hip is the thigh's angle forward
    of straight down; knee is how far the shin folds back from the thigh.  */

const GAIT = {
  walk: { hip: [24, 16, 4, -10, -22, -14, 6, 20], knee: [4, 16, 6, 2, 12, 44, 52, 18] },
  run: { hip: [38, 24, 2, -24, -36, -12, 28, 46], knee: [22, 42, 22, 10, 36, 92, 108, 50] },
};
function catmull(arr, p) {
  const n = arr.length;
  const x = ((p % 1) + 1) % 1 * n;
  const i = Math.floor(x), t = x - i;
  const a = arr[(i - 1 + n) % n], b = arr[i], c = arr[(i + 1) % n], d = arr[(i + 2) % n];
  return 0.5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t);
}
const RAD = Math.PI / 180;

function metrics(C) {
  const h = C.h;
  const small = h < 44;
  const b = C.build || 1;
  return {
    small,
    leg: Math.round(h * (small ? 0.36 : 0.43)),     // hip joint to the sole
    torso: Math.round(h * (small ? 0.25 : 0.27)),   // shoulder line to hip joint
    neck: small ? 1 : 2,
    sho: small ? 4 : Math.round(5.5 * b + 0.4),      // half the shoulders
    waist: small ? 3.5 : 3.6 * b + (b > 1.02 ? 0.8 : 0),
    thigh: small ? 1.6 : 2.2,
    calf: small ? 1.2 : 1.6,
    arm: small ? 1.0 : 1.35,
    wrist: small ? 0.8 : 1.0,
  };
}

function ik(ax, ay, bx, by, l1, l2, bend) {
  const dx = bx - ax, dy = by - ay;
  const d = Math.min(Math.hypot(dx, dy), (l1 + l2) * 0.999) || 0.001;
  const a = Math.atan2(dy, dx);
  const cosA = clamp((d * d + l1 * l1 - l2 * l2) / (2 * d * l1), -1, 1);
  const ang = a + bend * Math.acos(cosA);
  return [ax + Math.cos(ang) * l1, ay + Math.sin(ang) * l1];
}

/** Where a leg goes, side view facing right, from its two angles. */
function legPoints(hx, hy, hipDeg, kneeDeg, thighL, shinL) {
  const a1 = hipDeg * RAD;
  const kx = hx + Math.sin(a1) * thighL, ky = hy + Math.cos(a1) * thighL;
  const a2 = (hipDeg - kneeDeg) * RAD;
  const ax = kx + Math.sin(a2) * shinL, ay = ky + Math.cos(a2) * shinL;
  return { kx, ky, ax, ay, shin: a2 };
}

/**
 * Draw one person.  x is their middle, y is where their feet meet the floor.
 *  o.char, o.outfit, o.pose or o.P (a blended pose), o.flip (facing left),
 *  o.back (seen from behind), o.prop, o.alpha, o.age, o.blush
 */
export function drawHuman(ctx, x, y, o = {}) {
  const C = CHARS[o.char] || CHARS.A;
  const F = OUTFITS[o.outfit] || OUTFITS.thaiGirl;
  const M = metrics(C);
  const Pz = o.P || poseOf(o.pose || 'stand', o.phase === undefined ? (o.t || 0) * 6 : o.phase);
  const t = o.t || 0;
  const back = o.back !== undefined ? o.back : Pz.back > 0.5;
  const side = Pz.turn > 0.5 && !back;
  const view = back ? 'back' : side ? 'side' : 'front';
  const alpha = o.alpha === undefined ? 1 : o.alpha;
  const seed = (C.h * 13 + (o.char || 'A').charCodeAt(0)) % 17;
  const style = o.hairOverride || C.style;
  const trousers = !F.skirt && !F.shorts;
  const still = Pz.walk < 0.1 && Pz.sit < 0.5 && Pz.ground < 0.5 && Pz.crouch < 0.5;
  const breathe = still && Math.sin(t * 1.7 + seed) > 0.72 ? 1 : 0;


  /* ----------------------------------------------------------- skeleton */
  const thighL = M.leg * 0.5, shinL = M.leg * 0.5 - 2;
  const g = GAIT[Pz.run > 0.5 ? 'run' : 'walk'];
  // sixteen frames to a stride: smooth enough, and every frame is kept once drawn
  const p = Math.round((((Pz.gait || 0) / (Math.PI * 2)) % 1 + 1) % 1 * 16) / 16;
  const wk = clamp(Pz.walk || 0, 0, 1);
  // leg angles: near and far, blending walking with sitting, crouching, the floor
  const legAng = (ph) => {
    let hip = catmull(g.hip, ph) * wk, knee = catmull(g.knee, ph) * wk;
    hip += Pz.sit * 84 + Pz.crouch * 100 + Pz.ground * 86;
    knee += Pz.sit * 86 + Pz.crouch * 158 + Pz.ground * 166;
    return [hip, knee];
  };
  const [hN, kN] = legAng(p), [hF, kF] = legAng(p + 0.5);
  // hip height: in a stride, the lower foot is on the floor, so the body rides up and down
  let hipY;
  if (Pz.sit > 0.5 || Pz.ground > 0.5 || Pz.crouch > 0.5) {
    const seatH = Math.round(M.leg * 0.52);
    const drop = Pz.sit * (M.leg - seatH) + Pz.ground * (M.leg - 4) + Pz.crouch * (M.leg * 0.52);
    hipY = -M.leg + drop;
  } else {
    const reach = (hh, kk) => legPoints(0, 0, hh, kk, thighL, shinL).ay;
    const r = Math.max(reach(hN, kN), reach(hF, kF));
    hipY = -Math.round(lerp(M.leg - 2, r, wk)) - 2;
  }
  hipY = Math.round(hipY + (Pz.bob && wk < 0.5 ? Pz.bob : 0));
  const lean = side ? Math.round(wk * (Pz.run > 0.5 ? 2 : 1)) : 0;
  const shoY = hipY - M.torso - breathe;
  const neckTop = shoY - M.neck;
  const faceTop = neckTop - 10 + Math.round(Pz.headDy || 0) - (Pz.look < -0.5 ? 1 : 0);
  const sway = still && !back ? Math.round(Math.sin(t * 0.45 + seed) * 0.7) : 0;

  /* ----------------------------------------------------------- palette */
  const hairHex = o.age > 0.6 ? mix(C.hair, '#a4a4ac', clamp((o.age - 0.6) * 1.6, 0, 0.75)) : C.hair;
  const PAL = [];
  PAL[MAT.SKIN] = tones4(C.skin, C.skinSh);
  PAL[MAT.HAIR] = tones4(hairHex, shade(hairHex, -0.22));
  PAL[MAT.TOP] = tones4(F.top, F.topSh);
  PAL[MAT.BOT] = tones4(F.bottom, F.bottomSh);
  PAL[MAT.SOCK] = tones4(F.sock || C.skin);
  PAL[MAT.SHOE] = tones4(F.shoe);
  PAL[MAT.COLLAR] = tones4(F.collar || F.top);
  PAL[MAT.ACC] = tones4(F.accent || F.bottom);
  PAL[MAT.BADGE] = tones4('#2f3a63');
  PAL[MAT.BELT] = tones4(shade(F.bottom, -0.35));
  PAL[MAT.APRON] = tones4(F.apron || '#e8e0cc');
  PAL[MAT.TAG] = tones4('#3f6ea8');
  PAL[MAT.GOLD] = tones4('#d8b85a');
  PAL[MAT.TIE] = tones4('#c8384c');
  PAL[MAT.SOLE] = tones4(shade(F.shoe, 0.35));
  PAL[MAT.NAVY] = tones4(F.badge || '#2f3a63');

  const cx = sway;           // the buffer is drawn around the feet

  /* ----------------------------------------------------------- the parts */
  const sleeve = F.sleeve === undefined ? 1 : F.sleeve;
  const armU = Math.round(M.torso * 0.56), armF = Math.round(M.torso * 0.5);
  const armK = (armU + armF) / 16;         // the poses are written for an arm 16 long

  const drawArm = (sx, sy, hx, hy, bendSign, dimmed, clipY, forceStraight) => {
    newPart({ auto: true, round: true });
    curDim = dimmed ? 1 : 0;
    // an arm hanging down or reaching toward you is foreshortened, not bowed
    // out sideways; only a raised arm or one folded across the body shows its elbow
    const outward = (hx - sx) * Math.sign(sx - cx || 1) >= -1;
    const straight = forceStraight || (!side && hy > sy + 5 && outward);
    const el = straight ? [lerp(sx, hx, 0.52) + Math.sign(sx - cx || 1) * 0.4, lerp(sy, hy, 0.52)] : ik(sx, sy, hx, hy, armU, armF, bendSign);
    const cutT = clamp(sleeve, 0.15, 1);
    const clip = clipY === undefined ? 999 : clipY;
    limb(sx, sy, el[0], el[1], M.arm + 0.35, M.arm, (tt, px, py) => (py > clip ? null : tt < cutT || sleeve >= 0.99 ? [MAT.TOP, 1] : [MAT.SKIN, 1]));
    if (sleeve < 0.99 && cutT < 1) {
      // the sleeve's hem, a line of shade
      const hx0 = lerp(sx, el[0], cutT), hy0 = lerp(sy, el[1], cutT);
      if (hy0 <= clip) { put(hx0, hy0, MAT.TOP, 2); }
    }
    limb(el[0], el[1], hx, hy, M.arm, M.wrist, (tt, px, py) => (py > clip ? null : sleeve >= 0.99 && tt < 0.85 ? [MAT.TOP, 1] : [MAT.SKIN, 1]));
    // the hand: a little mitten, with a thumb
    if (hy <= clip) {
      const ang = Math.atan2(hy - el[1], hx - el[0]);
      const hcx = hx + Math.cos(ang) * 1.2, hcy = hy + Math.sin(ang) * 1.2;
      limb(hx, hy, hcx, hcy, 1.2, 1.25, () => [MAT.SKIN, 1]);
      put(hcx + Math.cos(ang + 1.6) * 1.6, hcy + Math.sin(ang + 1.6) * 1.6, MAT.SKIN, 2);
    }
    curDim = 0;
    return el;
  };

  const drawLegSide = (hx, hy, hip, knee, dimmed) => {
    newPart({ auto: true, round: true });
    curDim = dimmed ? 1 : 0;
    const L = legPoints(hx, hy, hip, knee, thighL, shinL);
    const sockTop = F.sock ? 1 - (F.sockH || 0.15) * 2.4 : 2;
    const shortsEnd = F.shorts ? 0.55 + F.shorts : 0;
    limb(hx, hy, L.kx, L.ky, M.thigh, M.calf + 0.3, (tt) => [trousers || (F.shorts && tt < shortsEnd * 1.6) ? MAT.BOT : MAT.SKIN, 1]);
    limb(L.kx, L.ky, L.ax, L.ay, M.calf + 0.2, M.calf - 0.3, (tt) => {
      if (trousers) return [MAT.BOT, 1];
      if (tt > sockTop) return [MAT.SOCK, 1];
      return [MAT.SKIN, 1];
    });
    // the shoe: flat on the floor if it is carrying weight, tipped with the shin if not
    const onFloor = L.ay >= -2.5 - hipY + hy - 0.5;
    const tip = onFloor ? 0 : clamp((L.shin + 0.2) * 0.8, -0.9, 0.6);
    const toeX = L.ax + Math.cos(tip) * 4.2, toeY = L.ay + Math.sin(tip) * 4.2;
    limb(L.ax - 1.2, L.ay + 0.4, toeX, toeY + 0.2, 1.4, 1.2, () => [MAT.SHOE, 1]);
    put(L.ax - 1, L.ay + 1.6, MAT.SOLE, 1);
    for (let k = 0; k <= 4; k++) put(L.ax - 1 + (toeX - L.ax + 1) * k / 4, L.ay + 1.6 + (toeY - L.ay) * k / 4, MAT.SOLE, 2);
    curDim = 0;
    return L;
  };

  /* shared: the torso's outline, row by row, for front and back */
  const torsoFront = (isBack) => {
    newPart({ auto: true });
    const rows = hipY - shoY;
    const girl = !!F.skirt;
    const waistY = hipY - 2;
    const tl = F.long ? Math.round(F.long * 30) : 0;
    const bottomY = (F.skirt || F.shorts || trousers) ? waistY : hipY;
    for (let yy = shoY; yy <= bottomY + tl; yy++) {
      const k = (yy - shoY) / Math.max(1, rows);
      // shoulders slope in at the top; a girl's shirt comes in at the waist
      let w = M.sho;
      if (yy === shoY) w -= 2; else if (yy === shoY + 1) w -= 0.6;
      if (k > 0.45) w = lerp(M.sho, girl ? M.waist : M.waist + 0.8, clamp((k - 0.45) / 0.4, 0, 1));
      span(yy, cx - w, cx + w, MAT.TOP, 1);
    }
    if (F.apron) for (let yy = shoY + Math.round(rows * 0.3); yy <= hipY + 4; yy++) span(yy, cx - M.waist + 1, cx + M.waist - 1, MAT.APRON, 1);
    if (!isBack) {
      // collar points, a V of skin, a button line, the badge, the name tag
      span(shoY, cx - 3, cx + 3, MAT.COLLAR, 0);
      put(cx - 3, shoY + 1, MAT.COLLAR, 2); put(cx - 2, shoY + 1, MAT.COLLAR, 1); put(cx + 2, shoY + 1, MAT.COLLAR, 1); put(cx + 3, shoY + 1, MAT.COLLAR, 2);
      put(cx - 1, shoY, MAT.SKIN, 2); put(cx, shoY, MAT.SKIN, 1); put(cx + 1, shoY, MAT.SKIN, 2); put(cx, shoY + 1, MAT.SKIN, 2);
      if (F.open) {
        for (let yy = shoY + 1; yy < hipY - 1; yy++) { span(yy, cx - 1, cx + 1, MAT.COLLAR, 1); put(cx - 2, yy, MAT.TOP, 3); put(cx + 2, yy, MAT.TOP, 3); }
      } else {
        for (let yy = shoY + 3; yy < bottomY - 1; yy += 3) put(cx, yy, MAT.TOP, 2);
      }
      if (F.accent && F.skirt && !F.open) {
        // the bow at the collar of the girls' blouse
        put(cx - 1, shoY + 2, MAT.ACC, 1); put(cx + 1, shoY + 2, MAT.ACC, 1); put(cx, shoY + 2, MAT.ACC, 2);
        put(cx - 1, shoY + 3, MAT.ACC, 2); put(cx + 1, shoY + 3, MAT.ACC, 2);
      } else if (F.accent && !F.open) {
        for (let yy = shoY + 1; yy < shoY + 7; yy++) put(cx, yy, MAT.ACC, yy === shoY + 1 ? 1 : 2);
      }
      if (F.badge) {
        // school badge over the heart, the name in blue on the other side
        put(cx - M.sho + 2, shoY + 4, MAT.BADGE, 1); put(cx - M.sho + 3, shoY + 4, MAT.BADGE, 1);
        put(cx - M.sho + 2, shoY + 5, MAT.BADGE, 1); put(cx - M.sho + 3, shoY + 5, MAT.NAVY, 1);
        span(shoY + 5, cx + M.sho - 4, cx + M.sho - 2, MAT.TAG, 1);
      }
      if (!girl && !F.apron && !F.open) { span(shoY + 3, cx + M.sho - 4, cx + M.sho - 2, MAT.TOP, 2); }   // a pocket
      // a crease where the shirt tucks in
      if (F.skirt || F.shorts || trousers) { put(cx - 2, bottomY - 1, MAT.TOP, 2); put(cx + 3, bottomY - 1, MAT.TOP, 2); }
    } else {
      span(shoY, cx - 3, cx + 3, MAT.COLLAR, 1);
      span(shoY + 1, cx - 2, cx + 2, MAT.COLLAR, 2);
      for (let yy = shoY + 3; yy < hipY - 3; yy++) if (yy % 4) put(cx + (yy % 8 < 4 ? 0 : 1), yy, MAT.TOP, 2);
      span(shoY + 2, cx - M.sho + 1, cx - M.sho + 2, MAT.TOP, 2);
      span(shoY + 2, cx + M.sho - 2, cx + M.sho - 1, MAT.TOP, 2);
    }
  };

  const bottomFront = (isBack, sitting) => {
    const waistY = hipY - 2;
    if (F.skirt) {
      newPart({ auto: true });
      // an A-line pleated skirt to just below the knee
      const len = sitting ? 5 : Math.round(M.leg * (F.skirt * 2.3 + 0.1));
      for (let i = 0; i < len; i++) {
        const w = M.waist + 0.6 + i * 0.26;
        const yy = waistY + i;
        span(yy, cx - w, cx + w, MAT.BOT, 1);
        if (F.pleat && i > 1) for (let px = Math.round(cx - w) + 2; px < cx + w - 1; px += 3) put(px, yy, MAT.BOT, 2);
      }
      span(waistY, cx - M.waist - 0.4, cx + M.waist + 0.4, MAT.BOT, 2);
      if (!sitting) span(waistY + len - 1, cx - M.waist - 0.6 - (len - 1) * 0.26, cx + M.waist + 0.6 + (len - 1) * 0.26, MAT.BOT, 2);
    } else if (F.shorts || trousers) {
      newPart({ auto: true });
      span(waistY, cx - M.waist - 0.8, cx + M.waist + 0.8, MAT.BELT, 1);
      if (!isBack) put(cx, waistY, MAT.GOLD, 1);
      span(waistY + 1, cx - M.waist - 0.8, cx + M.waist + 0.8, MAT.BOT, 1);
      span(waistY + 2, cx - M.waist - 1, cx + M.waist + 1, MAT.BOT, 1);
      if (!isBack) put(cx, waistY + 2, MAT.BOT, 2);
    }
  };

  const legsFront = (isBack) => {
    const gap = M.small ? 1 : 1.5;
    const lw = M.thigh;
    const sockTop = F.sock ? Math.round(M.leg * (F.sockH || 0.15) * 1.4) : 0;
    if (Pz.sit > 0.5 && !isBack) {
      // sitting, facing you: the thighs come toward you, the shins go down
      for (const d of [-1, 1]) {
        newPart({ auto: true, round: true });
        const lx = cx + d * (gap + lw - 0.5);
        const kneeY = hipY + 2;
        span(hipY, lx - lw, lx + lw, trousers || F.shorts ? MAT.BOT : MAT.SKIN, 0);
        span(hipY + 1, lx - lw, lx + lw, trousers || F.shorts ? MAT.BOT : MAT.SKIN, 1);
        limb(lx, kneeY, lx + d * 0.3, -2.5, M.calf + 0.2, M.calf - 0.2, (tt, px, py) => [trousers ? MAT.BOT : py > -2.5 - sockTop ? MAT.SOCK : MAT.SKIN, 1]);
        shoeFront(lx + d * 0.3, d);
      }
      return;
    }
    if (Pz.ground > 0.5) {
      // on the floor, legs folded: two shins across each other, knees out
      newPart({ auto: true, round: true });
      limb(cx - 7, -3, cx + 4, -2, 1.8, 1.6, () => [trousers ? MAT.BOT : MAT.SKIN, 1]);
      newPart({ auto: true, round: true });
      limb(cx + 7, -3, cx - 4, -1.5, 1.8, 1.6, () => [trousers ? MAT.BOT : MAT.SKIN, 1]);
      put(cx + 5, -1, MAT.SHOE, 1); put(cx + 6, -1, MAT.SHOE, 1); put(cx - 5, -1, MAT.SHOE, 1); put(cx - 6, -1, MAT.SHOE, 1);
      return;
    }
    const crouch = Pz.crouch;
    for (const d of [-1, 1]) {
      newPart({ auto: true, round: true });
      const lx = cx + d * (gap + lw - 0.8) + (isBack ? 0 : 0);
      if (crouch > 0.5) {
        const kx = lx + d * 3, ky = hipY - 3;
        limb(lx, hipY, kx, ky, lw, M.calf + 0.3, () => [trousers ? MAT.BOT : MAT.SKIN, 1]);
        limb(kx, ky, lx + d * 1, -2.5, M.calf + 0.3, M.calf - 0.2, (tt, px, py) => [trousers ? MAT.BOT : py > -2.5 - sockTop ? MAT.SOCK : MAT.SKIN, 1]);
        shoeFront(lx + d, d);
        continue;
      }
      const ky = lerp(hipY, -2.5, 0.5);
      limb(lx, hipY, lx + d * 0.15, ky, lw, M.calf + 0.3, (tt) => [trousers || (F.shorts && tt < F.shorts * 3.2) ? MAT.BOT : MAT.SKIN, 1]);
      limb(lx + d * 0.15, ky, lx + d * 0.3, -2.5, M.calf + 0.3, M.calf - 0.25, (tt, px, py) => [trousers ? MAT.BOT : py > -2.5 - sockTop ? MAT.SOCK : MAT.SKIN, 1]);
      if (!isBack) shoeFront(lx + d * 0.3, d); else shoeBack(lx + d * 0.3);
    }
  };
  function shoeFront(x0, d) {
    const x = Math.round(x0);
    span(-2, x - 2, x + 1, MAT.SHOE, 1);
    span(-1, x - 2 + (d > 0 ? 0 : -1), x + 1 + (d > 0 ? 1 : 0), MAT.SHOE, 1);
    span(0, x - 2 + (d > 0 ? 0 : -1), x + 1 + (d > 0 ? 1 : 0), MAT.SOLE, 2);
    put(x - 1, -2, MAT.SHOE, 0);
  }
  function shoeBack(x0) {
    const x = Math.round(x0);
    span(-2, x - 2, x + 1, MAT.SHOE, 1);
    span(-1, x - 2, x + 1, MAT.SHOE, 2);
    span(0, x - 2, x + 1, MAT.SOLE, 2);
  }

  /* ---- hand targets, from the pose (relative to the shoulder) ---- */
  const shLx = cx - M.sho + 0.5, shRx = cx + M.sho - 0.5, shYy = shoY + 1.5;
  let hands;
  if (side) {
    // walking arms swing against the legs; any other pose places the hands
    const armSwing = (legHip) => {
      const a = -legHip * (Pz.run > 0.5 ? 1.1 : 0.85) * RAD;
      const bend = (Pz.run > 0.5 ? 70 : 12) + Math.max(0, -legHip) * 0.2;
      const ex = Math.sin(a) * armU, ey = Math.cos(a) * armU;
      const a2 = a + bend * RAD;
      return [ex + Math.sin(a2) * armF, ey + Math.cos(a2) * armF];
    };
    const wN = armSwing(catmull(g.hip, p) * wk), wF = armSwing(catmull(g.hip, p + 0.5) * wk);
    const near = [lerp(Pz.hRx * armK, wN[0], wk), lerp(Pz.hRy * armK, wN[1], wk)];
    const far = [lerp(Pz.hLx * armK, wF[0], wk), lerp(Pz.hLy * armK, wF[1], wk)];
    hands = { far, near };
  }

  const style2 = style in HAIR ? style : 'short';
  const hairG = HAIR[style2];
  const headX = cx - 7 + (side ? lean : 0);
  const headY = faceTop - 3;

  /* ---- ponytail and long hair hang behind everything in the front view */
  const tailSwing = Math.round(Math.sin(t * 2 + seed) * 0.4 + (side ? -wk * 1.2 + Math.sin((Pz.gait || 0) * 2) * wk * 0.8 : 0));
  const drawTail = (mode) => {
    if (style2 !== 'ponytail') return;
    newPart({ auto: true, round: true });
    if (mode === 'side') {
      const bx = headX + 2, by = faceTop + 4;
      limb(bx, by, bx - 3 + tailSwing, by + 10, 1.8, 1.0, () => [MAT.HAIR, 1]);
      put(bx, by, MAT.TIE, 1); put(bx, by + 1, MAT.TIE, 2);
    } else if (mode === 'back') {
      const bx = cx, by = faceTop + 7;
      limb(bx, by, bx + tailSwing * 0.5, by + 11, 1.9, 1.0, () => [MAT.HAIR, 1]);
    } else {
      // from the front just the end of it shows past one shoulder
      const bx = cx + 5, by = faceTop + 7;
      limb(bx, by, bx + 1 + tailSwing * 0.3, by + 8, 1.4, 0.8, () => [MAT.HAIR, 2]);
    }
  };

  /* ================================================ paint, back to front */
  const r2 = (v) => Math.round((v || 0) * 2);
  const key = [o.char, o.outfit, view, o.flip ? 1 : 0, breathe, sway, r2(Pz.hLx), r2(Pz.hLy), r2(Pz.hRx), r2(Pz.hRy),
    r2(Pz.sit), r2(Pz.ground), r2(Pz.crouch), Math.round(wk * 8), Pz.run > 0.5 ? 1 : 0, Math.round(p * 16),
    r2(Pz.headDy), Pz.look < -0.5 ? 1 : 0, Pz.desk > 0.5 ? 1 : 0, hipY, o.age > 0.6 ? Math.round(o.age * 10) : 0, o.hairOverride || ''].join('|');
  let sprite = spriteCache.get(key);
  if (!sprite) {
  bMat.fill(0); bPart.fill(0); curPart = 0; curDim = 0;
  if (view === 'side') {
    const hy = hipY;
    const hipX = cx + lean * 0.5;
    const farArmSh = [cx - 0.5 + lean, shoY + 2];
    const nearArmSh = [cx + 0.5 + lean, shoY + 2];
    drawTail('side');
    // far arm
    drawArm(farArmSh[0], farArmSh[1], farArmSh[0] + hands.far[0], farArmSh[1] + hands.far[1], hands.far[1] < 0 ? -1 : 1, true);
    // far leg, near leg
    if (!(Pz.sit > 0.5 && F.skirt && false)) {
      drawLegSide(hipX - 0.5, hy, hF, kF, true);
      drawLegSide(hipX + 0.5, hy, hN, kN, false);
    }
    // what is worn below the waist, seen from the side
    newPart({ auto: true });
    const waistY = hy - 2;
    if (F.skirt) {
      const len = Math.round(M.leg * (F.skirt * 2.3 + 0.1));
      const kneeN = legPoints(hipX, hy, hN, kN, thighL, shinL), kneeF = legPoints(hipX, hy, hF, kF, thighL, shinL);
      for (let i = 0; i < len; i++) {
        const k = i / len;
        const yy = waistY + i;
        // the hem spreads to cover both knees, and lags a little behind the stride
        const front = Math.max(kneeN.kx, kneeF.kx) * Math.min(1, k * 1.4) + (hipX + 3.4) * (1 - Math.min(1, k * 1.4));
        const backx = Math.min(kneeN.kx, kneeF.kx) * Math.min(1, k * 1.4) + (hipX - 3.8) * (1 - Math.min(1, k * 1.4));
        const w0 = backx - 1.2 - k * 1.2 - wk * 0.6, w1 = Math.max(front + 1.2 + k * 0.6, hipX + 3.4);
        if (Pz.sit > 0.5 && i > 4) break;
        span(yy, w0, w1, MAT.BOT, 1);
        if (F.pleat && i > 1) for (let px = Math.round(w0) + 2; px < w1 - 1; px += 3) put(px, yy, MAT.BOT, 2);
      }
    } else {
      span(waistY, hipX - 3.6, hipX + 3.6, MAT.BELT, 1);
      for (let i = 1; i < 4; i++) span(waistY + i, hipX - 3.8, hipX + 3.4, MAT.BOT, 1);
    }
    // the torso from the side: a chest in front, shoulder blades behind
    newPart({ auto: true });
    for (let yy = shoY; yy <= waistY; yy++) {
      const k = (yy - shoY) / Math.max(1, waistY - shoY);
      const l = lerp(hipX + lean, hipX, k);
      const fr = (yy === shoY ? 2 : 3.5) + (k < 0.5 && F.skirt ? 0.6 : 0) - (k > 0.7 ? 0.4 : 0);
      const bk = (yy === shoY ? 2 : 3.2) - (k > 0.6 ? 0.4 : 0);
      span(yy, l - bk, l + fr, F.apron && k > 0.3 ? MAT.APRON : MAT.TOP, 1);
    }
    put(hipX + lean + 2, shoY, MAT.COLLAR, 0); put(hipX + lean + 1, shoY, MAT.COLLAR, 1);
    if (F.badge) { put(hipX + lean + 2, shoY + 4, MAT.BADGE, 1); }
    // neck
    newPart({});
    span(neckTop, cx + lean - 1, cx + lean + 1, MAT.SKIN, 2);
    span(neckTop + 1, cx + lean - 1, cx + lean + 1, MAT.SKIN, 2);
    // head
    newPart({});
    grid(FACE.side, headX, headY, FACE_KEY);
    grid(hairG.side, headX, headY, HAIR_KEY);
    // near arm, in front of everything
    drawArm(nearArmSh[0], nearArmSh[1], nearArmSh[0] + hands.near[0], nearArmSh[1] + hands.near[1], hands.near[1] < 0 ? -1 : 1, false);
  } else {
    const isBack = view === 'back';
    const deskArms = isBack && Pz.desk > 0.5;
    // hands, from the pose: 'R' is the busy hand
    const hL = [shLx - Pz.hLx * armK, shYy + Pz.hLy * armK], hR = [shRx + Pz.hRx * armK, shYy + Pz.hRy * armK];
    if (!isBack) drawTail('front');
    const legsShow = !(isBack && Pz.sit > 0.5);
    if (legsShow) legsFront(isBack);
    if (deskArms) {
      // from behind, sitting at a desk: forearms go forward, out of sight
      drawArm(shLx, shYy, hL[0] + 1, hL[1], 1, false, shoY + 9, true);
      drawArm(shRx, shYy, hR[0] - 1, hR[1], -1, false, shoY + 9, true);
    }
    if (legsShow || Pz.sit > 0.5) bottomFront(isBack, Pz.sit > 0.5 && !isBack);
    torsoFront(isBack);
    // neck
    newPart({});
    span(neckTop, cx - 1, cx + 1, MAT.SKIN, 2);
    span(neckTop + 1, cx - 1, cx + 1, MAT.SKIN, isBack ? 2 : 3);
    // head
    newPart({});
    grid(isBack ? FACE.back : FACE.front, headX, headY, FACE_KEY);
    grid(isBack ? hairG.back : hairG.front, headX, headY, HAIR_KEY);
    if (isBack) drawTail('back');
    if (!deskArms) {
      const crossing = Pz.hLx < -2 || Pz.hRx < -2;
      drawArm(shLx, shYy, hL[0], hL[1], hL[1] < shYy ? -1 : 1, false);
      drawArm(shRx, shYy, hR[0], hR[1], hR[1] < shYy ? 1 : -1, false);
      void crossing;
    }
  }

  /* ================================================ finish: mirror, light, line, blit */
  const W2 = BW, N = BW * BH;
  if (o.flip) {
    for (let yy = 0; yy < BH; yy++) {
      const r = yy * W2;
      for (let xx = 0; xx < W2; xx++) {
        const src = r + (2 * OX - xx);
        const ok = 2 * OX - xx >= 0 && 2 * OX - xx < W2;
        tMat[r + xx] = ok ? bMat[src] : 0; tTone[r + xx] = ok ? bTone[src] : 0; tPart[r + xx] = ok ? bPart[src] : 0;
      }
    }
    bMat.set(tMat); bTone.set(tTone); bPart.set(tPart);
  }
  // light from the upper left: the right edge of every rounded part falls into shade
  tTone.set(bTone);
  for (let i = 0; i < N; i++) {
    const pt = bPart[i];
    if (!pt) continue;
    const fl = partFlags[pt];
    if (!fl || !fl.auto) continue;
    const xx = i % W2;
    const tn = bTone[i];
    if (xx + 1 < W2 && bPart[i + 1] !== pt && tn < 2) tTone[i] = 2;
    else if (fl.round && xx > 0 && bPart[i - 1] !== pt && tn === 1) tTone[i] = 0;
  }
  // where one part passes in front of another, the one behind gets a line of shadow
  for (let i = W2; i < N - W2; i++) {
    const pt = bPart[i];
    if (!pt) continue;
    const xx = i % W2;
    let cover = 0;
    const nb = [xx > 0 ? i - 1 : -1, xx < W2 - 1 ? i + 1 : -1, i - W2, i + W2];
    for (const j of nb) {
      if (j < 0) continue;
      const q = bPart[j];
      if (q > pt && bMat[j]) { cover = bMat[j] === bMat[i] ? 3 : 2; break; }
    }
    if (cover && tTone[i] < cover) tTone[i] = cover;
  }
  if (!scratch) {
    scratch = document.createElement('canvas');
    scratch.width = BW; scratch.height = BH;
    scratchCtx = scratch.getContext('2d');
    scratchImg = scratchCtx.createImageData(BW, BH);
  }
  const d = scratchImg.data;
  d.fill(0);
  for (let i = 0; i < N; i++) {
    const m = bMat[i];
    if (m) {
      const c = PAL[m][tTone[i]];
      const k = i * 4;
      d[k] = c[0]; d[k + 1] = c[1]; d[k + 2] = c[2]; d[k + 3] = 255;
      continue;
    }
    // the outline: an empty pixel touching the figure takes the darkest tone of what it touches
    const xx = i % W2;
    let src = 0;
    if (xx > 0 && bMat[i - 1]) src = i - 1;
    else if (xx < W2 - 1 && bMat[i + 1]) src = i + 1;
    else if (i >= W2 && bMat[i - W2]) src = i - W2;
    else if (i < N - W2 && bMat[i + W2]) src = i + W2;
    if (src) {
      const c = PAL[bMat[src]][3];
      const k = i * 4;
      d[k] = c[0]; d[k + 1] = c[1]; d[k + 2] = c[2]; d[k + 3] = 235;
    }
  }
  scratchCtx.putImageData(scratchImg, 0, 0);
  sprite = document.createElement('canvas');
  sprite.width = BW; sprite.height = BH;
  sprite.getContext('2d').drawImage(scratch, 0, 0);
  spriteCache.set(key, sprite);
  if (spriteCache.size > 900) spriteCache.delete(spriteCache.keys().next().value);
  }

  const X = Math.round(x), Y = Math.round(y);
  ctx.save();
  // a soft shadow on the floor
  if (o.shadow !== false) {
    ctx.globalAlpha = alpha * 0.2;
    ctx.fillStyle = '#1b2014';
    const sw = side ? 7 + Math.round(wk * 2) : M.sho + 2;
    ctx.fillRect(X - sw, Y - 1, sw * 2 + 1, 2);
    ctx.fillRect(X - sw + 2, Y + 1, sw * 2 - 3, 1);
  }
  ctx.globalAlpha = alpha;
  ctx.drawImage(sprite, X - OX, Y - OY);
  // a blush, when there is reason for one
  if (o.blush && view === 'front') {
    ctx.globalAlpha = alpha * 0.5 * (typeof o.blush === 'number' ? clamp(o.blush, 0, 1) : 1);
    ctx.fillStyle = '#ef8a92';
    ctx.fillRect(X + cx - 4, Y + faceTop + 7, 2, 1);
    ctx.fillRect(X + cx + 3, Y + faceTop + 7, 2, 1);
  }
  ctx.globalAlpha = alpha;

  /* ---- props, in whichever hand is doing things ---- */
  const fsg = o.flip ? -1 : 1;
  const mapX = (lx) => X + (o.flip ? -lx : lx);
  let handN, handF;
  if (side) {
    handN = [mapX(cx + 0.5 + lean + hands.near[0]), Y + shoY + 2 + hands.near[1]];
    handF = [mapX(cx - 0.5 + lean + hands.far[0]), Y + shoY + 2 + hands.far[1]];
  } else {
    handN = [mapX(shRx + Pz.hRx * armK), Y + shYy + Pz.hRy * armK];
    handF = [mapX(shLx - Pz.hLx * armK), Y + shYy + Pz.hLy * armK];
  }
  if (o.prop === 'bag') drawBag(ctx, X, Y + shoY, Y + hipY, side, fsg, back);
  if (o.prop === 'book') drawBook(ctx, handN[0], handN[1] - 3);
  if (o.prop === 'tray') drawTray(ctx, (handN[0] + handF[0]) / 2, Math.min(handN[1], handF[1]) - 3);
  if (o.prop === 'phone') { P(ctx, handN[0] - 1, handN[1] - 4, 3, 5, '#1e1e26'); P(ctx, handN[0], handN[1] - 3, 1, 3, '#6a8ab0'); }
  if (o.prop === 'umbrella') drawUmbrella(ctx, handN[0], handN[1], o);
  if (o.prop === 'flower') { P(ctx, handN[0], handN[1] - 6, 1, 5, '#4d7c3a'); P(ctx, handN[0] - 1, handN[1] - 9, 3, 3, '#4a36cc'); P(ctx, handN[0], handN[1] - 8, 1, 1, '#f4e08c'); }
  ctx.restore();
  return { headX: X + (o.flip ? -cx : cx), headY: Y + faceTop + 5, headR: 5, shoX: X, shoY: Y + shoY, hipY: Y + hipY, handX: handN[0], handY: handN[1] };
}

/* ------------------------------------------------------------------ props */

function drawBag(ctx, cx, shoY, hipY, side, f, back) {
  const bx = back ? cx - 5 : side ? cx - f * 7 - 4 : cx + 5;
  const by = back ? shoY + 2 : hipY - 5;
  const w = back ? 11 : 8, h = back ? 12 : 8;
  P(ctx, bx - 1, by - 1, w + 2, h + 2, '#2a1e18');
  P(ctx, bx, by, w, h, back ? '#3f4e7a' : '#6d4c39');
  P(ctx, bx, by, w, 1, back ? '#5a6a9a' : '#8b6549');
  P(ctx, bx + Math.floor(w / 2) - 1, by + Math.floor(h / 2), 2, 1, '#d8c06a');
  if (!back) for (let i = 0; i < 6; i++) P(ctx, cx - 4 + i * (side ? 0 : 1.6), shoY + i * 2, 1, 1, '#4a3a2c');
}
function drawBook(ctx, x, y) {
  P(ctx, x - 5, y - 3, 10, 7, '#3a2a22');
  P(ctx, x - 4, y - 2, 8, 5, '#f4efe0');
  P(ctx, x, y - 2, 1, 5, '#b8ae98');
  P(ctx, x - 4, y + 2, 8, 1, '#c25a4a');
}
function drawTray(ctx, x, y) {
  P(ctx, x - 9, y - 1, 18, 4, '#6a6458');
  P(ctx, x - 8, y, 16, 2, '#c8c2b4');
  P(ctx, x - 6, y - 3, 5, 3, '#f2eadc');
  P(ctx, x, y - 3, 5, 3, '#a8562e');
  P(ctx, x + 1, y - 4, 2, 1, '#6ea04a');
}
function drawUmbrella(ctx, x, y, o) {
  const col = o.umbrella || '#5a7a9a';
  P(ctx, x, y - 22, 1, 22, '#4a4038');
  for (let i = -10; i <= 10; i++) {
    const hh = Math.round((1 - Math.cos((i / 10) * 1.3)) * 5);
    P(ctx, x + i, y - 28 + hh, 1, 3, Math.abs(i) % 5 < 3 ? col : shade(col, 0.16));
    P(ctx, x + i, y - 29 + hh, 1, 1, shade(col, -0.4));
  }
}

/* ------------------------------------------------------------ the walkers */

export class Person {
  constructor(charKey, x, y) {
    this.char = charKey;
    this.x = x; this.y = y;
    this.outfit = 'ADFO'.includes(charKey) ? 'thaiGirl'
      : charKey === 'T' ? 'thaiTeach' : charKey === 'S' ? 'thaiTeach2'
        : charKey === 'O' ? 'thaiTeach3' : 'thaiBoy';
    this.pose = 'stand';
    this.face = 'calm';
    this.flip = false;
    this.rr = rng(charKey.charCodeAt(0) * 7 + 3);
    this.t = this.rr.f(0, 10);
    this.idleT = this.rr.f(2, 7);
    this.phase = 0;
    this.target = null;
    this.speed = 30;
    this.prop = null;
    this.age = 0;
    this.visible = true;
    this.alpha = 1;
    this.onArrive = null;
    this.autoIdle = true;
    this.P = poseOf('stand', 0);
    this.prevP = this.P;
    this.blend = 1;
  }
  walkTo(wx, opts = {}) {
    this.target = wx;
    this.speed = opts.speed || 30;
    this.onArrive = opts.then || null;
  }
  stop() { this.target = null; this.onArrive = null; }
  setPose(o) {
    if (this.target !== null) { this.queued = Object.assign(this.queued || {}, o); return; }
    this.applyPose(o);
  }
  applyPose(o) {
    if (o.at !== undefined) this.x = o.at;
    if (o.pose && o.pose !== this.pose) this.startBlend();
    if (o.pose) this.pose = o.pose;
    if (o.face) this.face = o.face;
    if (o.prop !== undefined) this.prop = o.prop;
    if (o.flip !== undefined) this.flip = o.flip;
    if (o.blush !== undefined) this.blush = o.blush;
  }
  startBlend() { this.prevP = this.P; this.blend = 0; }
  setPoseNow(pose) { if (pose !== this.pose) { this.startBlend(); this.pose = pose; } }
  update(dt) {
    this.t += dt;
    if (this.target !== null) {
      const d = this.target - this.x;
      if (Math.abs(d) < 1.5) {
        this.x = this.target;
        this.target = null;
        this.setPoseNow('stand');
        if (this.queued) { const q = this.queued; this.queued = null; this.applyPose(q); }
        const cb = this.onArrive; this.onArrive = null;
        if (cb) cb();
      } else {
        const v = Math.sign(d) * this.speed;
        this.x += v * dt;
        this.flip = v < 0;
        this.setPoseNow(this.speed > 42 ? 'run' : 'walk');
        // one stride cycle covers about one and a half leg lengths walking, more running
        const legL = (CHARS[this.char] || CHARS.A).h * 0.43;
        this.phase += (this.speed * dt) / (legL * (this.speed > 42 ? 2.6 : 1.7)) * Math.PI * 2;
      }
    }
    if (this.autoIdle) this.idleLife(dt);
    const target = poseOf(this.pose, this.phase || this.t * 6);
    this.blend = Math.min(1, this.blend + dt * 5);
    const k = this.blend * this.blend * (3 - 2 * this.blend);
    this.P = this.blend >= 1 ? target : blendPose(this.prevP, target, k);
  }
  idleLife(dt) {
    const free = this.target === null && IDLE_POSES.includes(this.pose);
    if (!free) { this.idleT = 3 + this.rr.f(0, 5); return; }
    this.idleT -= dt;
    if (this.idleT > 0) return;
    this.idleT = this.rr.f(4.5, 11);
    const r = this.rr.f();
    this.setPoseNow(r < 0.35 ? 'stand' : r < 0.55 ? 'pockets' : r < 0.7 ? 'arms_crossed'
      : r < 0.8 ? 'lookout' : r < 0.9 ? 'think' : 'stretch');
  }
  draw(ctx, cam, extra = {}) {
    if (!this.visible) return null;
    const lift = this.pose === 'sit_log' ? 6 : 0;
    return drawHuman(ctx, this.x - cam, this.y - lift, {
      char: this.char, outfit: this.outfit, P: this.P, face: this.face,
      flip: this.flip, t: this.t, phase: this.phase, prop: this.prop,
      age: this.age, alpha: this.alpha, blush: this.blush, back: this.back, ...extra,
    });
  }
}
