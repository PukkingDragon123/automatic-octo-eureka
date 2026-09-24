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
  turn: 0, back: 0, sit: 0, ground: 0, crouch: 0, bob: 0,
  hLx: 1, hLy: 16, hRx: 1, hRy: 16, fL: 0, fR: 0, sL: 0, sR: 0,
  headDy: 0, look: 0, desk: 0,
};

export function poseOf(pose, ph) {
  const s = Math.sin(ph), c = Math.cos(ph);
  switch (pose) {
    case 'walk':
      return { ...BASE, turn: 1, bob: Math.abs(c) > 0.7 ? 1 : 0,
        sL: s * 3, sR: -s * 3, fL: s > 0.35 ? 1 : 0, fR: s < -0.35 ? 1 : 0,
        hLx: -s * 4, hLy: 15, hRx: s * 4, hRy: 15 };
    case 'run':
      return { ...BASE, turn: 1, bob: Math.abs(c) > 0.5 ? 2 : 0,
        sL: s * 5, sR: -s * 5, fL: s > 0.2 ? 3 : 0, fR: s < -0.2 ? 3 : 0,
        hLx: -s * 6, hLy: 11, hRx: s * 6, hRy: 11 };
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
  return out;
}

const IDLE_POSES = ['stand', 'pockets', 'arms_crossed', 'lookout', 'think', 'stretch'];

/* -------------------------------------------------------------- body plan --*/

function metrics(C) {
  const h = C.h;
  const small = h < 44;
  return {
    leg: Math.round(h * (small ? 0.33 : 0.36)),
    torso: Math.round(h * (small ? 0.29 : 0.3)),
    face: small ? 10 : 11,
    hw: 4,                                        // face is 9 wide
    sho: small ? 4 : (C.build > 1.03 ? 7 : 6),     // half-width of the shoulders
    legW: small ? 3 : 4,
    armW: small ? 2 : 3,
    gap: small ? 1 : 2,
  };
}

/** An arm or leg segment: a 3-wide stroke with its own dark edge. */
function stroke(ctx, x0, y0, x1, y1, w, col, edge, hi) {
  const dx = x1 - x0, dy = y1 - y0;
  const n = Math.max(1, Math.round(Math.max(Math.abs(dx), Math.abs(dy))));
  const vertical = Math.abs(dy) >= Math.abs(dx);
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i <= n; i++) {
      const x = Math.round(x0 + (dx * i) / n), y = Math.round(y0 + (dy * i) / n);
      if (vertical) {
        const l = x - Math.floor(w / 2);
        if (pass === 0) P(ctx, l - 1, y, w + 2, 1, edge);
        else { P(ctx, l, y, w, 1, col); if (hi && w > 2) P(ctx, l, y, 1, 1, hi); }
      } else {
        const t = y - Math.floor(w / 2);
        if (pass === 0) P(ctx, x, t - 1, 1, w + 2, edge);
        else { P(ctx, x, t, 1, w, col); if (hi && w > 2) P(ctx, x, t, 1, 1, hi); }
      }
    }
  }
}

function ik(ax, ay, bx, by, l1, l2, bend) {
  const dx = bx - ax, dy = by - ay;
  const d = Math.min(Math.hypot(dx, dy), (l1 + l2) * 0.999) || 0.001;
  const a = Math.atan2(dy, dx);
  const cosA = clamp((d * d + l1 * l1 - l2 * l2) / (2 * d * l1), -1, 1);
  const ang = a + bend * Math.acos(cosA);
  return [ax + Math.cos(ang) * l1, ay + Math.sin(ang) * l1];
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
  const f = o.flip ? -1 : 1;
  const back = o.back !== undefined ? o.back : Pz.back > 0.5;
  const side = Pz.turn > 0.5 && !back;
  const alpha = o.alpha === undefined ? 1 : o.alpha;
  const breathe = Math.sin(t * 1.6 + C.h) > 0.6 ? 1 : 0;
  ctx.save();
  ctx.globalAlpha = alpha;

  const cx = Math.round(x);
  const fy = Math.round(y);
  // how far down the hips are
  const seatH = Math.round(M.leg * 0.62);
  const hipDrop = Math.round(Pz.sit * (M.leg - seatH + 2) + Pz.ground * (M.leg - 3) + Pz.crouch * M.leg * 0.5);
  const hipY = fy - 2 - M.leg + hipDrop + Math.round(Pz.bob);
  const shoY = hipY - M.torso + breathe * (Pz.sit > 0.5 ? 0 : 0);
  const neckY = shoY - 2;
  const faceTop = neckY - M.face + Math.round(Pz.headDy);
  const hair = tone(o.age > 0.6 ? mix(C.hair, '#9a9aa4', clamp((o.age - 0.6) * 1.5, 0, 0.7)) : C.hair);
  const skin = tone(C.skin);
  const top = tone(F.top);
  const bottom = tone(F.bottom);
  const shoe = tone(F.shoe);
  const sock = F.sock ? tone(F.sock) : null;
  const sho = side ? M.sho - 2 : M.sho;

  // shadow
  if (o.shadow !== false) {
    ctx.globalAlpha = alpha * 0.22;
    P(ctx, cx - sho - 2, fy - 1, sho * 2 + 5, 2, '#1b2014');
    P(ctx, cx - sho, fy + 1, sho * 2 + 1, 1, '#1b2014');
    ctx.globalAlpha = alpha;
  }

  /* ---------------------------------------------------------- the hair
     that hangs behind everything else                                  */
  const style = o.hairOverride || C.style;
  if ((style === 'ponytail' || style === 'long') && !back) {
    const px0 = side ? cx - f * 5 : cx + 4;
    P(ctx, px0 - 2, faceTop + 3, 5, 11, hair.dk);
    P(ctx, px0 - 1, faceTop + 3, 3, 10, hair.base);
    P(ctx, px0 - 1, faceTop + 3, 1, 8, hair.hi);
  }

  /* ---------------------------------------------------------- legs */
  const legsVisible = !(back && Pz.sit > 0.5);
  if (legsVisible) drawLegs(ctx, cx, fy, hipY, M, Pz, F, bottom, skin, sock, shoe, side, f, back);

  /* ---------------------------------------------------------- arms behind */
  const shL = [cx - sho - 1, shoY + 2], shR = [cx + sho + 1, shoY + 2];
  const U = Math.round(M.torso * 0.47), Fo = Math.round(M.torso * 0.47);
  let armFar = null, armNear = null, armA = null, armB = null;
  if (side) {
    // near arm is the one on the camera side; the far one is behind the body
    const shN = [cx + f * 1, shoY + 2], shF = [cx - f * 1, shoY + 2];
    armFar = { sh: shF, h: [shF[0] + f * Pz.hLx, shF[1] + Pz.hLy], dim: true };
    armNear = { sh: shN, h: [shN[0] + f * Pz.hRx, shN[1] + Pz.hRy], dim: false };
  } else {
    // front: the 'R' hand is the busy one (waving, pointing, writing), and it
    // is on whichever side they are facing
    const busy = o.flip ? -1 : 1;
    const L = [shL[0] - (busy > 0 ? Pz.hLx : Pz.hRx), shL[1] + (busy > 0 ? Pz.hLy : Pz.hRy)];
    const Rr = [shR[0] + (busy > 0 ? Pz.hRx : Pz.hLx), shR[1] + (busy > 0 ? Pz.hRy : Pz.hLy)];
    armA = { sh: shL, h: L, side: -1 };
    armB = { sh: shR, h: Rr, side: 1 };
  }
  const drawArm = (A, dim, clipAt) => {
    const col = dim ? tone(F.top).sh : top.base;
    const sk = dim ? skin.sh : skin.base;
    const sleeve = F.sleeve === undefined ? 1 : F.sleeve;
    const bend = A.side ? A.side : f;
    const el = ik(A.sh[0], A.sh[1], A.h[0], A.h[1], U, Fo, (A.h[1] < A.sh[1] ? -1 : 1) * bend * 0.6);
    const cut = clamp(sleeve, 0.2, 1);
    const sx = lerp(A.sh[0], el[0], cut), sy = lerp(A.sh[1], el[1], cut);
    const lim = clipAt === undefined ? Infinity : clipAt;
    const seg = (x0, y0, x1, y1, c, e) => {
      if (Math.min(y0, y1) > lim) return;
      if (Math.max(y0, y1) > lim) { const k = (lim - y0) / (y1 - y0); x1 = x0 + (x1 - x0) * k; y1 = lim; }
      stroke(ctx, x0, y0, x1, y1, M.armW, c, e, dim ? null : tone(c).hi);
    };
    if (sleeve >= 0.99) {
      seg(A.sh[0], A.sh[1], el[0], el[1], col, top.dk);
      seg(el[0], el[1], A.h[0], A.h[1], col, top.dk);
    } else {
      seg(A.sh[0], A.sh[1], sx, sy, col, top.dk);
      seg(sx, sy, el[0], el[1], sk, skin.dk);
      seg(el[0], el[1], A.h[0], A.h[1], sk, skin.dk);
    }
    if (A.h[1] <= lim) {
      P(ctx, A.h[0] - 2, A.h[1] - 1, 4, 4, skin.dk);
      P(ctx, A.h[0] - 1, A.h[1] - 1, 3, 3, sk);
    }
  };
  const armsOnDesk = back && Pz.desk > 0.5;
  if (side) drawArm(armFar, true);
  if (armsOnDesk) {
    // from behind, forearms go forward onto the desk and out of sight
    drawArm(armA, false, shoY + 9);
    drawArm(armB, false, shoY + 9);
  }

  /* ---------------------------------------------------------- torso */
  drawTorso(ctx, cx, shoY, hipY, sho, M, F, C, top, bottom, skin, side, f, back, Pz);

  /* ---------------------------------------------------------- arms in front */
  if (side) drawArm(armNear, false);
  else if (!armsOnDesk) { drawArm(armA, false); drawArm(armB, false); }

  /* ---------------------------------------------------------- neck and head */
  P(ctx, cx - 2, neckY - 1, 5, 4, skin.dk);
  P(ctx, cx - 1, neckY - 1, 3, 3, skin.sh);
  drawHead(ctx, cx, faceTop, M, C, skin, hair, style, side, f, back, Pz, o);

  /* ---------------------------------------------------------- props */
  const handN = side ? armNear.h : armB.h;
  const handF = side ? armFar.h : armA.h;
  if (o.prop === 'bag') drawBag(ctx, cx, shoY, hipY, side, f, back);
  if (o.prop === 'book') drawBook(ctx, handN[0], handN[1] - 3);
  if (o.prop === 'tray') drawTray(ctx, (handN[0] + handF[0]) / 2, Math.min(handN[1], handF[1]) - 3);
  if (o.prop === 'phone') { P(ctx, handN[0] - 1, handN[1] - 4, 3, 5, '#1e1e26'); P(ctx, handN[0], handN[1] - 3, 1, 3, '#6a8ab0'); }
  if (o.prop === 'umbrella') drawUmbrella(ctx, handN[0], handN[1], o);
  if (o.prop === 'flower') { P(ctx, handN[0], handN[1] - 6, 1, 5, '#4d7c3a'); P(ctx, handN[0] - 1, handN[1] - 9, 3, 3, '#4a36cc'); P(ctx, handN[0], handN[1] - 8, 1, 1, '#f4e08c'); }
  ctx.restore();
  return { headX: cx, headY: faceTop + M.face / 2, headR: 5, shoX: cx, shoY, hipY, handX: handN[0], handY: handN[1] };
}

function drawLegs(ctx, cx, fy, hipY, M, Pz, F, bottom, skin, sock, shoe, side, f, back) {
  const trousers = !F.skirt && !F.shorts;
  const shortEnd = F.shorts ? hipY + Math.round(M.leg * 0.34) : 0;
  const leg = (lx, lift, isNear) => {
    const top = hipY;
    const footY = fy - 2 - lift;
    const dim = side && !isNear;
    const tr = dim ? bottom.sh : bottom.base, sk = dim ? skin.sh : skin.base;
    for (let yy = top; yy < footY; yy++) {
      let c = sk, e = skin.dk;
      if (trousers || (F.shorts && yy < shortEnd)) { c = tr; e = bottom.dk; }
      if (sock && yy >= footY - Math.round(M.leg * (F.sockH || 0.15) * 2.2)) { c = sock.base; e = sock.dk; }
      P(ctx, lx - 1, yy, M.legW + 2, 1, e);
      P(ctx, lx, yy, M.legW, 1, c);
      P(ctx, lx + M.legW - 1, yy, 1, 1, tone(c).sh);
      if (!dim) P(ctx, lx, yy, 1, 1, tone(c).hi);
    }
    // the shoe, pointing the way they face
    const toe = side ? f : (lx < cx ? -1 : 1) * 0;
    const sx = lx + (side ? (f > 0 ? 0 : -1) : (lx < cx ? -1 : 0));
    P(ctx, sx - 1 + toe, footY - 1, M.legW + 3, 4, shoe.dk);
    P(ctx, sx + toe, footY, M.legW + 1, 2, dim ? shoe.sh : shoe.base);
    P(ctx, sx + toe, footY, M.legW, 1, shoe.hi);
    P(ctx, sx + toe, footY + 1, M.legW + 1, 1, shoe.sh);
  };
  if (Pz.ground > 0.5) {
    // cross-legged: two shins folded across in front, knees out wide
    const w = M.sho * 2 + 8, x0 = cx - Math.floor(w / 2), y0 = fy - 6;
    const c = F.skirt ? bottom.base : (F.shorts || !F.skirt ? (F.shorts ? skin.base : bottom.base) : skin.base);
    P(ctx, x0 - 1, y0 - 1, w + 2, 7, bottom.dk);
    P(ctx, x0, y0, w, 5, F.skirt ? skin.base : c);
    P(ctx, x0, y0 + 3, w, 2, F.skirt ? skin.sh : tone(c).sh);
    P(ctx, x0 + 2, y0 + 1, Math.round(w * 0.4), 1, tone(F.skirt ? skin.base : c).hi);
    P(ctx, x0 - 1, y0 + 2, 4, 3, shoe.base);
    P(ctx, x0 + w - 3, y0 + 2, 4, 3, shoe.base);
    return;
  }
  if (Pz.crouch > 0.5) {
    // squatting: knees splayed, shins short and straight down
    const kneeY = hipY + 2;
    for (const d of [-1, 1]) {
      const kx = cx + d * (M.sho + 1);
      stroke(ctx, cx + d * 2, hipY, kx, kneeY, M.legW, trousers ? bottom.base : skin.base, trousers ? bottom.dk : skin.dk);
      stroke(ctx, kx, kneeY, kx, fy - 2, M.legW, trousers ? bottom.base : skin.base, trousers ? bottom.dk : skin.dk);
      P(ctx, kx - 3, fy - 3, M.legW + 3, 4, shoe.dk);
      P(ctx, kx - 2, fy - 2, M.legW + 1, 2, shoe.base);
    }
    return;
  }
  if (Pz.sit > 0.5 && !back) {
    // sitting, seen from the front: thighs come toward you, shins go down
    const kneeY = hipY + 1;
    for (const d of [-1, 1]) {
      const lx = d < 0 ? cx - M.gap / 2 - M.legW : cx + Math.ceil(M.gap / 2);
      const c = trousers ? bottom.base : F.skirt ? skin.base : (F.shorts ? bottom.base : skin.base);
      P(ctx, lx - 1, hipY - 1, M.legW + 2, 4, trousers ? bottom.dk : skin.dk);
      P(ctx, lx, hipY, M.legW, 2, c);
      P(ctx, lx, hipY, M.legW, 1, tone(c).hi);
      leg2(lx, kneeY + 2);
    }
    function leg2(lx, from) {
      for (let yy = from; yy < fy - 2; yy++) {
        let c = trousers ? bottom.base : skin.base, e = trousers ? bottom.dk : skin.dk;
        if (sock && yy >= fy - 2 - Math.round(M.leg * 0.3)) { c = sock.base; e = sock.dk; }
        P(ctx, lx - 1, yy, M.legW + 2, 1, e);
        P(ctx, lx, yy, M.legW, 1, c);
        P(ctx, lx + M.legW - 1, yy, 1, 1, tone(c).sh);
      }
      const sx = lx < cx ? lx - 1 : lx;
      P(ctx, sx - 1, fy - 3, M.legW + 3, 4, shoe.dk);
      P(ctx, sx, fy - 2, M.legW + 1, 2, shoe.base);
      P(ctx, sx, fy - 2, M.legW, 1, shoe.hi);
    }
    return;
  }
  if (side) {
    const lx = cx - Math.floor(M.legW / 2);
    // far leg first, then near
    leg(Math.round(lx - f * Pz.sL * 0 + f * Pz.sR), Math.round(Pz.fR), false);
    leg(Math.round(lx + f * Pz.sL), Math.round(Pz.fL), true);
    return;
  }
  const lxL = cx - Math.floor(M.gap / 2) - M.legW;
  const lxR = cx + Math.ceil(M.gap / 2);
  leg(lxL, Math.round(Pz.fL), true);
  leg(lxR, Math.round(Pz.fR), true);
}

function drawTorso(ctx, cx, shoY, hipY, sho, M, F, C, top, bottom, skin, side, f, back, Pz) {
  const rows = hipY - shoY;
  const girl = !!F.skirt;
  const halfW = (k) => {
    let w = sho;
    if (k < 0.08) w -= 1;
    if (girl && k > 0.55 && k < 0.9) w -= 1;
    return w;
  };
  const tl = F.long ? Math.round(F.long * 30) : 0;
  const end = hipY + tl;
  // the dark edge, then the cloth, then its shading
  for (let yy = shoY - 1; yy <= end; yy++) {
    const k = clamp((yy - shoY) / Math.max(1, rows), 0, 1);
    const w = halfW(k);
    P(ctx, cx - w - 1, yy, w * 2 + 3, 1, top.dk);
  }
  for (let yy = shoY; yy < end; yy++) {
    const k = (yy - shoY) / Math.max(1, rows);
    const w = halfW(k);
    P(ctx, cx - w, yy, w * 2 + 1, 1, top.base);
    P(ctx, cx - w, yy, 1, 1, top.hi);
    P(ctx, cx + w - 1, yy, 2, 1, top.sh);
    if (k > 0.82) P(ctx, cx - w, yy, w * 2 + 1, 1, k > 0.92 ? top.sh : mix(top.base, top.sh, 0.5));
  }
  if (F.apron) P(ctx, cx - sho + 2, shoY + Math.round(rows * 0.35), sho * 2 - 3, rows - Math.round(rows * 0.35), F.apron);
  if (F.open) {
    P(ctx, cx - 2, shoY + 1, 5, rows - 1, '#f4f2ec');
    P(ctx, cx - 3, shoY + 1, 1, rows - 1, top.dk);
    P(ctx, cx + 3, shoY + 1, 1, rows - 1, top.dk);
  }
  if (!back) {
    // the collar, the V of skin under it, a button line, the badge and the name tag
    P(ctx, cx - 3, shoY, 7, 1, F.collar || '#ffffff');
    P(ctx, cx - 1, shoY, 3, 2, skin.sh);
    P(ctx, cx, shoY + 2, 1, 1, skin.sh);
    if (!side) {
      P(ctx, cx - 3, shoY + 1, 2, 1, top.sh);
      P(ctx, cx + 2, shoY + 1, 2, 1, top.sh);
      for (let yy = shoY + 4; yy < hipY - 1; yy += 4) P(ctx, cx, yy, 1, 1, top.sh);
      if (F.accent) { P(ctx, cx - 1, shoY + 2, 3, 1, F.accent); P(ctx, cx, shoY + 3, 1, 4, tone(F.accent).sh); }
      if (F.badge) { P(ctx, cx - sho + 2, shoY + 4, 3, 3, '#2f3a63'); P(ctx, cx - sho + 3, shoY + 5, 1, 1, F.badge); }
      if (F.badge) { P(ctx, cx + sho - 5, shoY + 4, 4, 2, '#e4e0d4'); P(ctx, cx + sho - 5, shoY + 5, 4, 1, '#3f6ea8'); }
    } else if (F.badge) {
      P(ctx, cx + f * 1, shoY + 4, 2, 2, '#2f3a63');
    }
  } else {
    // a collar band across the back, and the crease down the middle
    P(ctx, cx - 3, shoY, 7, 1, top.hi);
    for (let yy = shoY + 3; yy < hipY - 2; yy++) if (yy % 3) P(ctx, cx, yy, 1, 1, top.sh);
  }
  // what is below the shirt
  const bw = sho;
  if (F.skirt) {
    const len = Math.round(F.skirt * 60);
    for (let i = -1; i <= len; i++) {
      const w = bw + Math.round((i / len) * 3);
      const yy = hipY - 1 + i;
      if (Pz.sit > 0.5 && !back && i > 3) break;
      P(ctx, cx - w - 1, yy, w * 2 + 3, 1, bottom.dk);
      if (i >= 0 && i < len) {
        P(ctx, cx - w, yy, w * 2 + 1, 1, bottom.base);
        P(ctx, cx - w, yy, 1, 1, bottom.hi);
        P(ctx, cx + w - 1, yy, 2, 1, bottom.sh);
        if (F.pleat && i > 1) for (let px = cx - w + 3; px < cx + w - 1; px += 3) P(ctx, px, yy, 1, 1, bottom.sh);
      }
    }
    P(ctx, cx - bw, hipY - 1, bw * 2 + 1, 1, bottom.sh);
  } else if (F.shorts) {
    const len = Math.round(M.leg * 0.34);
    P(ctx, cx - bw - 1, hipY - 1, bw * 2 + 3, 3, bottom.dk);
    P(ctx, cx - bw, hipY - 1, bw * 2 + 1, 2, bottom.base);
    P(ctx, cx - bw, hipY - 1, bw * 2 + 1, 1, shade(F.bottom, -0.3));   // the belt
    P(ctx, cx - 1, hipY - 1, 2, 1, '#c8b070');                          // its buckle
    void len;
  } else {
    P(ctx, cx - bw, hipY - 1, bw * 2 + 1, 1, shade(F.bottom, -0.3));
  }
}

function drawHead(ctx, cx, faceTop, M, C, skin, hair, style, side, f, back, Pz, o) {
  const hw = M.hw, fh = M.face;
  const x0 = cx - hw, x1 = cx + hw;
  // the face: a square with its corners knocked off, and a dark edge
  P(ctx, x0 - 1, faceTop, hw * 2 + 3, fh + 1, skin.dk);
  P(ctx, x0, faceTop + 1, hw * 2 + 1, fh - 1, skin.base);
  P(ctx, x0 + 1, faceTop + fh - 1, hw * 2 - 1, 1, skin.base);
  P(ctx, x0 - 1, faceTop + fh, 1, 1, 'rgba(0,0,0,0)');
  // shade on the away side, and under the chin
  if (!side) P(ctx, x1 - 1, faceTop + 3, 2, fh - 4, skin.sh);
  else P(ctx, cx - f * hw, faceTop + 3, 2, fh - 4, skin.sh);
  P(ctx, x0 + 1, faceTop + fh - 1, hw * 2 - 1, 1, skin.sh);
  // ears
  if (!side) {
    P(ctx, x0 - 2, faceTop + 5, 2, 3, skin.dk); P(ctx, x0 - 1, faceTop + 5, 1, 2, skin.sh);
    P(ctx, x1 + 1, faceTop + 5, 2, 3, skin.dk); P(ctx, x1 + 1, faceTop + 5, 1, 2, skin.sh);
  } else {
    P(ctx, cx - f * 1, faceTop + 5, 2, 3, skin.sh);
  }
  if (o.blush && !back && !side) {
    ctx.globalAlpha *= 0.55;
    P(ctx, x0 + 1, faceTop + 7, 2, 1, '#ef8a92');
    P(ctx, x1 - 2, faceTop + 7, 2, 1, '#ef8a92');
    ctx.globalAlpha /= 0.55;
  }
  drawHair(ctx, cx, faceTop, M, hair, style, side, f, back, Pz);
}

function drawHair(ctx, cx, faceTop, M, H, style, side, f, back, Pz) {
  const hw = M.hw;
  const x0 = cx - hw - 1, W = hw * 2 + 3;
  const cap = (yTop, rows, sides) => {
    // the helmet: a rounded top over the head, coming down the sides
    P(ctx, x0 + 1, yTop - 1, W - 2, 1, H.dk);
    P(ctx, x0, yTop, W, rows + 1, H.dk);
    P(ctx, x0 + 1, yTop, W - 2, rows, H.base);
    P(ctx, x0 + 2, yTop, W - 5, 1, H.hi);
    P(ctx, x0 + 1, yTop + 1, 2, 1, H.hi);
    if (sides > 0) {
      P(ctx, x0 - 1, yTop + 1, 2, sides + 1, H.dk);
      P(ctx, x0, yTop + 1, 1, sides, H.base);
      P(ctx, x0 + W - 1, yTop + 1, 2, sides + 1, H.dk);
      P(ctx, x0 + W - 1, yTop + 1, 1, sides, H.sh);
    }
  };
  const top = faceTop - 2;
  if (back) {
    // from behind: a rounded head of hair with strands, ears poking out, the nape
    const down = style === 'bob' || style === 'long' ? M.face + 1 : style === 'ponytail' || style === 'bun' ? M.face - 1 : M.face - 3;
    const skinT = tone('#e8c09a');
    if (down < M.face) {
      // the neck and ears show under short hair
      P(ctx, cx - 3, top + down, 7, M.face - down + 2, skinT.dk);
      P(ctx, cx - 2, top + down, 5, M.face - down + 1, skinT.sh);
      P(ctx, x0 - 1, top + 6, 2, 3, skinT.dk); P(ctx, x0, top + 6, 1, 2, skinT.base);
      P(ctx, x0 + W - 1, top + 6, 2, 3, skinT.dk); P(ctx, x0 + W - 1, top + 6, 1, 2, skinT.sh);
    }
    P(ctx, x0 + 1, top - 2, W - 2, 1, H.dk);
    P(ctx, x0, top - 1, W, down + 2, H.dk);
    P(ctx, x0 - 1, top + 1, W + 2, down - 1, H.dk);
    P(ctx, x0 + 1, top - 1, W - 2, down + 1, H.base);
    P(ctx, x0, top + 1, W, down - 2, H.base);
    // light across the crown, and strands running down
    P(ctx, x0 + 2, top - 1, W - 5, 1, H.hi);
    P(ctx, x0 + 1, top, 3, 1, H.hi);
    P(ctx, cx + 1, top, 2, 1, H.hi);
    for (let i = 0; i < W - 2; i += 2) P(ctx, x0 + 1 + i, top + 2 + (i % 4 ? 1 : 0), 1, down - 3 - (i % 3), H.sh);
    P(ctx, x0 + W - 2, top + 1, 2, down - 2, H.sh);
    // the ragged bottom edge
    for (let i = 0; i < W; i += 2) P(ctx, x0 + i, top + down, 1, 1, H.dk);
    if (style === 'ponytail' || style === 'long') {
      P(ctx, cx - 2, top + down - 1, 5, 13, H.dk);
      P(ctx, cx - 1, top + down - 1, 3, 12, H.base);
      P(ctx, cx - 1, top + down, 1, 9, H.hi);
      P(ctx, cx + 1, top + down + 2, 1, 8, H.sh);
      P(ctx, cx - 2, top + down - 1, 5, 1, '#c8384c');          // the hair tie
    }
    if (style === 'bun') { P(ctx, cx - 3, top - 5, 7, 5, H.dk); P(ctx, cx - 2, top - 4, 5, 3, H.base); P(ctx, cx - 1, top - 4, 2, 1, H.hi); }
    return;
  }
  if (side) {
    // from the side the hair covers the back of the head and the crown
    const bx = f > 0 ? x0 : x0 + 3;
    P(ctx, x0 + 1, top - 1, W - 2, 1, H.dk);
    P(ctx, x0, top, W, 4, H.dk);
    P(ctx, x0 + 1, top, W - 2, 3, H.base);
    P(ctx, x0 + 2, top, W - 5, 1, H.hi);
    const backX = f > 0 ? x0 - 1 : x0 + W - 5;
    const down = style === 'bob' ? 9 : 7;
    P(ctx, backX, top + 2, 6, down, H.dk);
    P(ctx, backX + 1, top + 2, 4, down - 1, H.base);
    void bx;
    if (style === 'short' || style === 'crop') P(ctx, cx + f * 2, top - 2, 3, 2, H.base);
    if (style === 'bun') { P(ctx, cx - f * 4 - 2, top - 3, 6, 5, H.dk); P(ctx, cx - f * 4 - 1, top - 2, 4, 3, H.base); }
    return;
  }
  // from the front
  if (style === 'short') {
    cap(top, 3, 3);
    P(ctx, cx - 1, top - 3, 4, 2, H.dk); P(ctx, cx, top - 3, 2, 2, H.base); P(ctx, cx, top - 3, 1, 1, H.hi);
    P(ctx, cx - hw + 1, top + 3, 4, 1, H.base);                      // the fringe swept to one side
  } else if (style === 'crop') {
    cap(top, 3, 2);
    P(ctx, x0 + 1, top - 2, W - 2, 2, H.dk); P(ctx, x0 + 2, top - 2, W - 4, 1, H.base);
  } else if (style === 'bob') {
    cap(top, 3, M.face - 1);
    P(ctx, x0 - 1, top + M.face - 1, 3, 2, H.dk); P(ctx, x0 + W - 2, top + M.face - 1, 3, 2, H.dk);
    P(ctx, cx - hw, top + 3, hw * 2 + 1, 1, H.base);                  // a straight fringe
  } else if (style === 'bun') {
    cap(top, 3, 3);
    P(ctx, cx - 3, top - 5, 7, 5, H.dk); P(ctx, cx - 2, top - 4, 5, 3, H.base); P(ctx, cx - 1, top - 4, 2, 1, H.hi);
  } else {
    // ponytail: pulled back, a side parting, the tail showing behind one ear
    cap(top, 3, 4);
    P(ctx, cx - hw, top + 3, 3, 1, H.base);
    P(ctx, cx + 1, top + 3, hw, 1, H.base);
  }
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
        this.phase += dt * (this.speed > 42 ? 11 : 7);
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
