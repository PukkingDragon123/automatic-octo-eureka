/* ============================================================================
 *  human.js — the people.
 *
 *  Flat blocks of colour, no ink outline, faces kept almost bare: the look of
 *  a sprite sheet rather than a sticker.  Underneath it is still a skeleton —
 *  hands and feet are placed by the pose, elbows and knees fall out of a
 *  two-bone solve — so everything animates rather than flipping between
 *  drawings.  Poses are blended, not switched, which is most of what makes a
 *  small figure look fluid.
 * ==========================================================================*/

import { clamp, lerp, shade, rgba, rng, mix } from './core.js';

/* ------------------------------------------------------------- wardrobes --*/
/* sleeve: how far the top covers the arm.  skirt: hem length, 0 = trousers.  */

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
};

/* ----------------------------------------------------------------- poses --*/
/* Targets are fractions of height, measured from the hip (feet) or shoulder
   (hands).  +x is the way they are facing.  Everything here is a number, so
   one pose can be blended into the next.                                     */

const BASE = {
  crouch: 0, lean: 0, bob: 0, headTilt: 0, headTurn: 0.35, sink: 0,
  f0x: -0.02, f0y: 0, f0t: 0, f1x: 0.02, f1y: 0, f1t: 0,
  h0x: -0.085, h0y: 0.30, h1x: 0.085, h1y: 0.30,
  bend0: 1, bend1: 1, legBend0: 1, legBend1: 1,
};

export function poseOf(pose, ph) {
  const s = Math.sin(ph), c = Math.cos(ph);
  switch (pose) {
    case 'walk':
      // the foot lifts while it swings forward and stays down while it pushes
      return { ...BASE, bob: Math.abs(c) * 1.2, lean: 0.022,
        f0x: -s * 0.13, f0y: Math.max(0, -c) * 0.05, f0t: -s * 0.5,
        f1x: s * 0.13, f1y: Math.max(0, c) * 0.05, f1t: s * 0.5,
        h0x: -0.08 + s * 0.085, h0y: 0.29 - Math.abs(s) * 0.03,
        h1x: 0.08 - s * 0.085, h1y: 0.29 - Math.abs(s) * 0.03 };
    case 'run':
      return { ...BASE, bob: Math.abs(c) * 1.8, lean: 0.06,
        f0x: -s * 0.15, f0y: Math.max(0, -c) * 0.12, f0t: -s * 0.5,
        f1x: s * 0.15, f1y: Math.max(0, c) * 0.12, f1t: s * 0.5,
        h0x: -0.05 + s * 0.12, h0y: 0.2 - s * 0.1,
        h1x: 0.05 - s * 0.12, h1y: 0.2 + s * 0.1 };
    case 'sit_ground':
      return { ...BASE, crouch: 0.335,
        f0x: 0.055, f0y: 0.02, f0t: 0.5, f1x: -0.02, f1y: 0.01, f1t: -0.4, legBend1: -1,
        h0x: 0.02, h0y: 0.19, h1x: 0.1, h1y: 0.19, headTilt: 0.35, headTurn: 0.25 };
    case 'sit_log':
    case 'sit_chair':
      return { ...BASE, crouch: 0.245,
        f0x: 0.1, f0y: 0, f0t: 0.3, f1x: 0.13, f1y: 0, f1t: 0.3,
        h0x: -0.05, h0y: 0.26, h1x: 0.08, h1y: 0.24 };
    case 'sit_desk':            // forearms on the desktop, back fairly straight
      return { ...BASE, crouch: 0.25, lean: 0.03,
        f0x: 0.09, f0y: 0, f0t: 0.3, f1x: 0.12, f1y: 0, f1t: 0.3,
        h0x: 0.1, h0y: 0.2, h1x: 0.16, h1y: 0.2, bend0: -1, bend1: -1, headTilt: 0.1 };
    case 'write':
      return { ...BASE, crouch: 0.25, lean: 0.06,
        f0x: 0.09, f0y: 0, f0t: 0.3, f1x: 0.12, f1y: 0, f1t: 0.3,
        h0x: 0.08, h0y: 0.22, h1x: 0.19 + s * 0.012, h1y: 0.23,
        bend0: -1, bend1: -1, headTilt: 0.34 };
    case 'sleep_desk':          // head down on folded arms
      return { ...BASE, crouch: 0.28, lean: 0.12, sink: 0.055,
        f0x: 0.08, f0y: 0, f0t: 0.3, f1x: 0.12, f1y: 0, f1t: 0.3,
        h0x: 0.12, h0y: 0.17, h1x: 0.2, h1y: 0.17, bend0: -1, bend1: -1, headTilt: 0.85 };
    case 'sit_knees':
      return { ...BASE, crouch: 0.3,
        f0x: -0.06, f0y: 0.015, f0t: -0.5, f1x: -0.03, f1y: 0.015, f1t: -0.5,
        h0x: 0, h0y: 0.22, h1x: 0.06, h1y: 0.22, headTilt: 0.2 };
    case 'crouch':
      return { ...BASE, crouch: 0.245, lean: 0.03,
        f0x: -0.04, f0y: 0, f0t: -0.2, f1x: 0.075, f1y: 0, f1t: 0.35,
        h0x: -0.02, h0y: 0.185, h1x: 0.15, h1y: 0.21, headTilt: 0.32, headTurn: 0.5 };
    case 'reach':
      return { ...BASE, crouch: 0.245, lean: 0.045,
        f0x: -0.04, f0y: 0, f0t: -0.2, f1x: 0.075, f1y: 0, f1t: 0.35,
        h0x: -0.04, h0y: 0.18, h1x: 0.235, h1y: 0.225, headTilt: 0.38, headTurn: 0.55 };
    case 'wave':
      return { ...BASE, h0x: -0.08, h0y: 0.3, h1x: 0.1 + s * 0.02, h1y: -0.14,
        bend1: -1, headTurn: 0.4 };
    case 'raise_hand':          // straight up, the way you are told to
      return { ...BASE, h0x: -0.08, h0y: 0.3, h1x: 0.05, h1y: -0.26, bend1: -1, lean: -0.01 };
    case 'wai':                 // palms together at the chest, a small bow
      return { ...BASE, lean: 0.03, headTilt: 0.3,
        h0x: 0.05, h0y: 0.1, h1x: 0.07, h1y: 0.1, bend0: -1, bend1: -1 };
    case 'hold':
      return { ...BASE, h0x: -0.07, h0y: 0.3, h1x: 0.13, h1y: 0.31, headTurn: 0.25, headTilt: 0.06 };
    case 'hug':
      return { ...BASE, h0x: 0.12, h0y: 0.17, h1x: 0.17, h1y: 0.2,
        bend0: -1, bend1: -1, headTilt: 0.1, headTurn: 0.2 };
    case 'arms_crossed':
      return { ...BASE, h0x: 0.07, h0y: 0.15, h1x: -0.07, h1y: 0.15,
        bend0: -1, bend1: -1, headTurn: 0.1 };
    case 'pockets':
      return { ...BASE, h0x: -0.07, h0y: 0.26, h1x: 0.07, h1y: 0.26 };
    case 'umbrella':
      return { ...BASE, h0x: -0.07, h0y: 0.3, h1x: 0.06, h1y: -0.06, bend1: -1 };
    case 'point':
      return { ...BASE, h0x: -0.07, h0y: 0.3, h1x: 0.2, h1y: 0.12, bend1: -1, headTurn: 0.5 };
    case 'read':
      return { ...BASE, h0x: 0.03, h0y: 0.14, h1x: 0.11, h1y: 0.15,
        bend0: -1, bend1: -1, headTilt: 0.3 };
    case 'tray':                // both hands out in front, carrying lunch
      return { ...BASE, h0x: 0.1, h0y: 0.21, h1x: 0.15, h1y: 0.21, bend0: -1, bend1: -1 };
    case 'eat':
      return { ...BASE, crouch: 0.25, lean: 0.04,
        f0x: 0.09, f0y: 0, f0t: 0.3, f1x: 0.12, f1y: 0, f1t: 0.3,
        h0x: 0.1, h0y: 0.21, h1x: 0.1, h1y: 0.06 + s * 0.02,
        bend0: -1, bend1: -1, headTilt: 0.2 };
    case 'stretch':
      return { ...BASE, h0x: -0.1, h0y: -0.2, h1x: 0.12, h1y: -0.22,
        bend1: -1, headTilt: -0.15, lean: -0.02 };
    case 'lookout':
      return { ...BASE, h0x: -0.07, h0y: 0.3, h1x: 0.1, h1y: -0.02,
        bend1: -1, headTurn: 0.5, headTilt: -0.05 };
    case 'think':
      return { ...BASE, h0x: -0.06, h0y: 0.26, h1x: 0.06, h1y: 0.06,
        bend1: -1, headTilt: 0.18, headTurn: 0.2 };
    case 'stargaze':
      return { ...BASE, h0x: -0.09, h0y: 0.28, h1x: 0.09, h1y: 0.28,
        headTilt: -0.28, headTurn: 0.15 };
    case 'shock':
      return { ...BASE, h0x: -0.13, h0y: 0.16, h1x: 0.13, h1y: 0.16,
        bend0: -1, bend1: -1, lean: -0.03 };
    default:
      return { ...BASE };
  }
}

/** Blend two pose tables. */
export function blendPose(a, b, k) {
  if (k >= 1) return b;
  const out = {};
  for (const key in BASE) out[key] = lerp(a[key], b[key], k);
  return out;
}

/* Poses a person may drift between of their own accord. */
const IDLE_POSES = ['stand', 'pockets', 'arms_crossed', 'lookout', 'think', 'stretch'];

/* ------------------------------------------------------------- primitives */

/** A chunky limb: a run of flat squares with one shaded edge, no outline. */
function limb(ctx, x0, y0, x1, y1, w, col, sh, f) {
  const n = Math.max(2, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 1.4));
  const wide = Math.max(1, Math.round(w));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = Math.round(lerp(x0, x1, t)), y = Math.round(lerp(y0, y1, t));
    const left = x - Math.floor(wide / 2);
    ctx.fillStyle = col;
    ctx.fillRect(left, y, wide, 1);
    if (wide > 1) {
      ctx.fillStyle = sh;
      ctx.fillRect(f > 0 ? left + wide - 1 : left, y, 1, 1);
    }
  }
}

/** Two-bone solve: where the elbow or knee ends up. */
function ik(ax, ay, bx, by, l1, l2, bend) {
  const dx = bx - ax, dy = by - ay;
  const d = Math.min(Math.hypot(dx, dy), (l1 + l2) * 0.98) || 0.001;
  const a = Math.atan2(dy, dx);
  const cosA = clamp((d * d + l1 * l1 - l2 * l2) / (2 * d * l1), -1, 1);
  const ang = a + bend * Math.acos(cosA);
  return [ax + Math.cos(ang) * l1, ay + Math.sin(ang) * l1];
}

const box = (ctx, x, y, w, h, c) => {
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
};

/**
 * Draw one person.
 *  x, y     — where their feet meet the ground
 *  o.char, o.outfit, o.pose (or o.P, a blended pose table), o.face, o.flip
 */
export function drawHuman(ctx, x, y, o = {}) {
  const C = CHARS[o.char] || CHARS.A;
  const F = OUTFITS[o.outfit] || OUTFITS.thaiGirl;
  const H = (o.height || C.h) * (o.scale || 1);
  const f = o.flip ? -1 : 1;
  const t = o.t || 0;
  const alpha = o.alpha === undefined ? 1 : o.alpha;
  const age = o.age || 0;
  const build = C.build * (1 + age * 0.03);
  const P = o.P || poseOf(o.pose || 'stand', o.phase === undefined ? t * 6 : o.phase);
  ctx.globalAlpha = alpha;

  /* --- secondary motion ----------------------------------------------- */
  const ph2 = o.char === 'B' ? 1.7 : o.char === 'C' ? 3.1 : o.char === 'D' ? 4.4 : o.char === 'E' ? 2.2 : 0;
  const still = !o.moving && P.bob === 0;
  const breath = Math.sin(t * 1.45 + ph2) * H * (still ? 0.005 : 0.003);
  const sway = still ? Math.sin(t * 0.52 + ph2) * H * 0.005 : 0;
  const settle = o.bounce || 0;
  const squash = clamp(settle * 0.05, -0.08, 0.08);
  const blink = ((t * 0.31 + ph2) % 1) > 0.972;
  const headSway = Math.sin(t * 0.61 + ph2 * 1.3) * H * 0.004;

  /* --- landmarks ------------------------------------------------------ */
  const bob = P.bob * H * 0.006;
  const hipY = y - H * (0.455 - P.crouch) + bob + settle * 0.6 + P.sink * H;
  const shoY = hipY - H * 0.285 * (1 - squash) - breath;
  const neckY = shoY - H * 0.02;
  const headR = H * 0.107;                       // half the head width
  const headY = neckY - headR * 1.15 - breath * 0.4;
  const lean = P.lean * f * H;
  const hipX = x + lean * 0.3 + sway;
  const shoX = hipX + lean - sway * 0.4;
  const headX = shoX + lean * 0.5 + P.headTurn * f * H * 0.01 + headSway;

  const thigh = H * 0.235, shin = H * 0.245;
  const upper = H * 0.17, fore = H * 0.16;
  const legW = H * 0.062 * build, armW = H * 0.05 * build;
  const shoW = H * 0.115 * build;

  /* --- feet and hands, then solve the joints -------------------------- */
  const feet = [[P.f0x, P.f0y, P.f0t], [P.f1x, P.f1y, P.f1t]];
  const hands = [[P.h0x, P.h0y], [P.h1x, P.h1y]];
  const bendLeg = [P.legBend0, P.legBend1];
  const bendArm = [P.bend0, P.bend1];
  const legs = [0, 1].map((i) => {
    const near = i === 1;
    const fx = hipX + f * (feet[i][0] * H) + (near ? f : -f) * H * 0.028;
    const fy = y - feet[i][1] * H;
    const hip = [hipX + (near ? f : -f) * H * 0.026, hipY];
    const knee = ik(hip[0], hip[1], fx, fy, thigh, shin, (bendLeg[i] || 1) * f);
    return { hip, knee, foot: [fx, fy], toe: feet[i][2] || 0, near };
  });
  const arms = [0, 1].map((i) => {
    const sx = shoX + (i ? f * shoW * 0.86 : -f * shoW * 0.96);
    const sy = shoY + H * 0.016;
    const drag = (o.hlag || 0) * H * 0.22;
    const hx = shoX + f * (hands[i][0] * H) - (i ? 0 : f * H * 0.03) - f * drag;
    const hy = shoY + hands[i][1] * H + settle * 0.35;
    const elbow = ik(sx, sy, hx, hy, upper, fore, (bendArm[i] || 1) * -f);
    return { sh: [sx, sy], elbow, hand: [hx, hy], near: i === 1 };
  });

  /* --- shadow --------------------------------------------------------- */
  if (o.shadow !== false) {
    ctx.globalAlpha = 0.16 * alpha;
    box(ctx, x - H * 0.1, y, H * 0.2, 2, '#1b2a16');
    ctx.globalAlpha = alpha;
  }

  const skirtLen = F.skirt || 0;
  const hemY = hipY + skirtLen * H;
  const topLen = F.long ? hipY + F.long * H : hipY + H * 0.035;

  const drawLeg = (L) => {
    const dim = L.near ? 0 : -0.1;
    const trouser = skirtLen === 0 && !F.shorts;
    const covered = F.shorts ? clamp((hipY + F.shorts * H - L.knee[1]) / (thigh * 0.5), 0, 1)
      : trouser ? 1 : clamp((hemY - L.knee[1]) / (thigh * 0.6), 0, 1);
    const cl = shade(F.bottom, dim), clSh = shade(F.bottomSh || shade(F.bottom, -0.2), dim);
    const sk = shade(L.near ? C.skin : C.skinSh, dim), skSh = shade(C.skinSh, dim - 0.1);
    limb(ctx, L.hip[0], L.hip[1], L.knee[0], L.knee[1], legW,
         covered > 0.5 ? cl : sk, covered > 0.5 ? clSh : skSh, f);
    limb(ctx, L.knee[0], L.knee[1], L.foot[0], L.foot[1], legW * 0.82,
         trouser ? cl : sk, trouser ? clSh : skSh, f);
    if (F.sock) {
      const k = 1 - F.sockH * 3.4;
      limb(ctx, lerp(L.knee[0], L.foot[0], k), lerp(L.knee[1], L.foot[1], k),
           L.foot[0], L.foot[1], legW * 0.84, shade(F.sock, dim), shade(F.sock, dim - 0.14), f);
    }
    // shoe: a flat block that sticks out the front
    const sw = legW * 1.9, sh2 = Math.max(2, H * 0.036);
    const sx2 = L.foot[0] + f * (L.toe * legW * 0.5);
    box(ctx, sx2 - sw * 0.5 + f * sw * 0.18, L.foot[1] - sh2 + 1, sw, sh2, shade(F.shoe, dim));
    box(ctx, sx2 - sw * 0.5 + f * sw * 0.18, L.foot[1], sw, 1, shade(F.shoe, dim - 0.3));
  };
  const drawArm = (Ar) => {
    const dim = Ar.near ? 0 : -0.1;
    const sleeveEnd = F.sleeve === undefined ? 1 : F.sleeve;
    const cl = shade(F.top, dim), clSh = shade(F.topSh || shade(F.top, -0.18), dim);
    const sk = shade(Ar.near ? C.skin : C.skinSh, dim), skSh = shade(C.skinSh, dim - 0.1);
    if (sleeveEnd >= 0.99) {
      limb(ctx, Ar.sh[0], Ar.sh[1], Ar.elbow[0], Ar.elbow[1], armW, cl, clSh, f);
      limb(ctx, Ar.elbow[0], Ar.elbow[1], Ar.hand[0], Ar.hand[1], armW * 0.88, cl, clSh, f);
    } else {
      const cut = clamp(sleeveEnd, 0.1, 1);
      const cx2 = lerp(Ar.sh[0], Ar.elbow[0], cut), cy2 = lerp(Ar.sh[1], Ar.elbow[1], cut);
      limb(ctx, Ar.sh[0], Ar.sh[1], cx2, cy2, armW * 1.15, cl, clSh, f);
      limb(ctx, cx2, cy2, Ar.elbow[0], Ar.elbow[1], armW * 0.8, sk, skSh, f);
      limb(ctx, Ar.elbow[0], Ar.elbow[1], Ar.hand[0], Ar.hand[1], armW * 0.8, sk, skSh, f);
    }
    box(ctx, Ar.hand[0] - armW * 0.6, Ar.hand[1] - 1, armW * 1.2, armW * 1.3, sk);
  };

  /* --- far side, torso, near side ------------------------------------- */
  drawArm(arms[0]);
  drawLeg(legs[0]);
  drawLeg(legs[1]);
  drawTorso(ctx, { hipX, hipY, shoX, shoY, neckY, shoW, H, f, F, C, topLen, hemY, skirtLen, build });
  drawArm(arms[1]);

  /* --- head ----------------------------------------------------------- */
  drawHead(ctx, headX, headY, headR, f, C, o, H, t, P, blink);

  /* --- what they carry ------------------------------------------------ */
  const hand = arms[1].hand;
  const hand0 = arms[0].hand;
  if (o.prop === 'book') drawBook(ctx, hand[0] + f * H * 0.03, hand[1] - H * 0.02, H);
  if (o.prop === 'bag') drawBag(ctx, hipX - f * H * 0.12, hipY + H * 0.02, H, f, shoX, shoY);
  if (o.prop === 'tray') drawTray(ctx, (hand[0] + hand0[0]) / 2, (hand[1] + hand0[1]) / 2 - 2, H);
  if (o.prop === 'phone') box(ctx, hand[0] - 1, hand[1] - 2, 2, 4, '#2a2a34');
  if (o.prop === 'umbrella') drawUmbrella(ctx, hand[0], hand[1], H, o);
  if (o.prop === 'flower') drawHeldFlower(ctx, hand[0], hand[1], H);
  ctx.globalAlpha = 1;
  return { headX, headY, headR, shoX, shoY, hipY, handX: hand[0], handY: hand[1] };
}

/** The torso: a straight block with a slight waist, flat colour, one shade. */
function drawTorso(ctx, s) {
  const { hipX, hipY, shoX, shoY, neckY, shoW, H, f, F, C, topLen, hemY, skirtLen, build } = s;
  const prof = (k) => {
    if (k < 0.2) return lerp(shoW, shoW * 0.92, k / 0.2);
    if (k < 0.62) return lerp(shoW * 0.92, shoW * 0.78, (k - 0.2) / 0.42);
    return lerp(shoW * 0.78, shoW * 0.88, (k - 0.62) / 0.38);
  };
  const bottom = Math.max(topLen, hipY);
  const rows = Math.max(2, Math.round(bottom - shoY));
  const base = F.top, sh = F.topSh || shade(F.top, -0.18);
  for (let i = 0; i <= rows; i++) {
    const k = i / rows;
    const yy = lerp(shoY, bottom, k);
    const w = prof(k);
    const cx = lerp(shoX, hipX, k);
    box(ctx, cx - w, yy, w * 2, 1, base);
    box(ctx, cx + f * w * 0.56, yy, w * 0.44 + 1, 1, sh);        // the away side
  }
  if (F.apron) {
    for (let i = Math.round(rows * 0.35); i <= rows; i++) {
      const k = i / rows;
      box(ctx, lerp(shoX, hipX, k) - prof(k) * 0.7, lerp(shoY, bottom, k), prof(k) * 1.4, 1, F.apron);
    }
  }
  if (F.open) {
    for (let i = 0; i <= rows * 0.85; i++) {
      const k = i / rows;
      box(ctx, lerp(shoX, hipX, k) - prof(k) * 0.32, lerp(shoY, bottom, k), prof(k) * 0.64, 1, '#f4f2ec');
    }
  }
  // collar: a small V of a paler colour
  const cw = shoW * 0.58;
  box(ctx, shoX - cw, shoY, cw * 2, 2, F.collar || '#ffffff');
  box(ctx, shoX - cw * 0.3, shoY + 1, cw * 0.6, 2, shade(C.skin, -0.14));
  if (F.accent) {
    box(ctx, shoX - cw * 0.26, shoY + 2, cw * 0.52, Math.max(1, H * 0.012), F.accent);
    box(ctx, shoX - cw * 0.14, shoY + 2, cw * 0.28, Math.max(2, H * 0.05), shade(F.accent, -0.16));
  }
  if (F.badge) box(ctx, shoX - f * shoW * 0.5, shoY + H * 0.075, 2, 2, F.badge);
  // belt / waistband
  if (!F.open) box(ctx, hipX - prof(1) * 0.98, hipY - 1, prof(1) * 1.96, 1, shade(F.bottom, -0.18));
  // neck
  box(ctx, shoX - H * 0.032, neckY - H * 0.045, H * 0.064, H * 0.055, shade(C.skin, -0.12));

  // skirt or shorts
  if (skirtLen > 0) {
    const top = hipY - H * 0.03;
    const n = Math.max(2, Math.round(hemY - top));
    for (let i = 0; i <= n; i++) {
      const k = i / n;
      const yy = top + (hemY - top) * k;
      const w = lerp(shoW * 0.86, shoW * 1.2, Math.pow(k, 0.7)) * build;
      box(ctx, hipX - w, yy, w * 2, 1, F.bottom);
      box(ctx, hipX + f * w * 0.56, yy, w * 0.44 + 1, 1, F.bottomSh || shade(F.bottom, -0.2));
      if (F.pleat && i > n * 0.25) {
        for (let p = -1; p <= 1; p += 2) box(ctx, hipX + p * w * 0.45, yy, 1, 1, shade(F.bottom, -0.3));
      }
    }
    box(ctx, hipX - shoW * 1.2 * build, hemY, shoW * 2.4 * build, 1, shade(F.bottom, -0.34));
  } else if (F.shorts) {
    // only the seat of them: the thighs below are drawn with the legs, so you
    // get two navy columns rather than one block that reads as a skirt
    const hem2 = hipY + F.shorts * H * 0.5;
    const n = Math.max(2, Math.round(hem2 - hipY));
    for (let i = 0; i <= n; i++) {
      const k = i / n;
      const yy = hipY - 1 + (hem2 - hipY) * k;
      const w = lerp(shoW * 0.9, shoW * 1.02, k) * build;
      box(ctx, hipX - w, yy, w * 2, 1, F.bottom);
      box(ctx, hipX + f * w * 0.56, yy, w * 0.44 + 1, 1, F.bottomSh || shade(F.bottom, -0.2));
      if (i > n * 0.25) box(ctx, hipX - 1, yy, 2, 1, shade(F.bottom, -0.28));   // the gap
    }
  }
}

/* -------------------------------------------------------------- the head */

function drawHead(ctx, hx, hy, r, f, C, o, H, t, P, blink) {
  const tilt = P.headTilt * f;
  const cx = hx + tilt * r * 0.5;
  const w = r, top = hy - r * 0.92, bot = hy + r * 0.98;
  const rows = Math.max(4, Math.round(bot - top));
  // a plain block with the corners knocked off
  for (let i = 0; i <= rows; i++) {
    const k = i / rows;
    const inset = k < 0.1 ? 1 : k > 0.88 ? lerp(0, 2, (k - 0.88) / 0.12) : 0;
    const yy = top + (bot - top) * k;
    const ccx = cx + tilt * r * 0.3 * (1 - k);
    box(ctx, ccx - w + inset, yy, (w - inset) * 2, 1, C.skin);
    if (k > 0.2) box(ctx, ccx + f * (w - inset) * 0.58, yy, (w - inset) * 0.42 + 1, 1, C.skinSh);
  }
  box(ctx, cx - f * r * 1.05, hy + r * 0.1, 1, 2, C.skinSh);        // ear

  hair(ctx, cx, hy, r, f, C, t, o, top);
  if (o.hideFace) return;
  drawFace(ctx, cx, hy, r, f, C, o, P.headTurn, tilt, t, blink);
}

/* The face is kept nearly bare: two marks for eyes, a mouth only when the
   feeling needs one.  At this size anything more turns to mud.             */
function drawFace(ctx, cx, hy, r, f, C, o, turn, tilt, t, blink) {
  const face = o.face || 'calm';
  const dark = C.eye || '#2e2630';
  const eyeY = hy + r * 0.12 + tilt * r * 0.4;
  const off = turn * f * r * 0.26;
  const e1 = cx - r * 0.52 + off, e2 = cx + r * 0.52 + off;
  const closed = face === 'closed' || face === 'laugh' || face === 'smile2' || face === 'sleep' || blink;
  const ew = r > 8 ? 2 : 1;
  for (const ex of [e1, e2]) {
    const x0 = Math.round(ex - ew / 2);
    if (closed) {
      box(ctx, x0, eyeY + 1, ew + 1, 1, dark);
    } else {
      const h = face === 'surprise' ? 3 : face === 'tired' ? 1 : 2;
      box(ctx, x0, eyeY, ew, h, dark);
      if (h > 1 && ew > 1) box(ctx, x0, eyeY, 1, 1, mix(dark, '#ffffff', 0.55));
    }
    if (face === 'angry' || face === 'sad') box(ctx, x0, eyeY - 2, ew + 1, 1, shade(C.hair, 0.1));
  }
  const my = hy + r * 0.62 + tilt * r * 0.4;
  const mx = cx + off;
  if (face === 'laugh' || face === 'surprise') box(ctx, mx - 1, my, 3, 2, '#8a4a50');
  else if (face === 'smile' || face === 'smile2') {
    box(ctx, mx - 1, my, 2, 1, '#9c5a5e');
    box(ctx, mx - 2, my - 1, 1, 1, '#9c5a5e'); box(ctx, mx + 1, my - 1, 1, 1, '#9c5a5e');
  } else if (face === 'sad' || face === 'cry') {
    box(ctx, mx - 1, my + 1, 2, 1, '#9c5a5e');
    box(ctx, mx - 2, my, 1, 1, '#9c5a5e'); box(ctx, mx + 1, my, 1, 1, '#9c5a5e');
  } else if (face !== 'calm') box(ctx, mx - 1, my, 2, 1, '#9c5a5e');
  if (face === 'cry') box(ctx, e2, eyeY + 2 + ((t * 9) % (r * 1.2)), 1, 2, rgba('#9fd8f0', 0.9));
  if (o.blush || face === 'laugh') {
    ctx.globalAlpha *= 0.5;
    box(ctx, e1 - r * 0.24, eyeY + r * 0.42, Math.max(2, r * 0.36), 1, '#ef8a92');
    box(ctx, e2 - r * 0.12, eyeY + r * 0.42, Math.max(2, r * 0.36), 1, '#ef8a92');
    ctx.globalAlpha /= 0.5;
  }
}

function hair(ctx, cx, hy, r, f, C, t, o, top) {
  const H1 = C.hair, HI = C.hairHi, HS = shade(C.hair, -0.25);
  const style = o.hairOverride || C.style;
  void HS;
  const sway = Math.sin(t * 1.1) * r * 0.05 - f * (o.hlag || 0) * r * 1.6;
  // the cap: over the crown and down past the ears, stopping above the brow
  const capBot = hy - r * 0.16;
  const rows = Math.max(3, Math.round(capBot - top) + 2);
  for (let i = 0; i <= rows; i++) {
    const k = i / rows;
    const yy = top - 2 + i;
    const inset = k < 0.18 ? 2 : k < 0.32 ? 1 : 0;
    const wide = r + (k > 0.55 ? 1 : 0) - inset;
    box(ctx, cx - wide, yy, wide * 2, 1, k < 0.4 ? HI : H1);
  }
  // a small quiff, on the styles that have one
  if (style === 'short' || style === 'crop') {
    box(ctx, cx + f * r * 0.25, top - 4, 2, 2, H1);
    box(ctx, cx - f * r * 0.1, top - 3, 2, 1, HI);
  }

  if (style === 'ponytail') {
    for (let i = 0; i < 7; i++) {
      const k = i / 6;
      const px2 = cx - f * (r * 1.2 + k * r * 0.25) + sway * (1 + k * 2.2);
      const py2 = hy - r * 0.3 + k * r * 1.5;
      box(ctx, px2 - r * 0.28, py2, r * 0.56, r * 0.32 + 1, i % 3 ? H1 : HS);
    }
    box(ctx, cx + f * r * 0.9, hy - r * 0.2, 2, r * 0.9, H1);       // the lock by the cheek
  } else if (style === 'short' || style === 'crop') {
    box(ctx, cx - r, capBot - 1, r * 2, 2, H1);
    box(ctx, cx + f * r * 0.86, hy - r * 0.3, 2, r * 0.5, H1);
    box(ctx, cx - f * r * 0.96, hy - r * 0.3, 2, r * 0.42, HS);
    if (style === 'short') box(ctx, cx - f * r * 0.2, top - 5, 3, 2, HI);
  } else if (style === 'bob') {
    box(ctx, cx - r - 1, hy - r * 0.4, 2, r * 1.5, H1);
    box(ctx, cx + r - 1, hy - r * 0.4, 2, r * 1.5, HS);
    box(ctx, cx - r, capBot - 1, r * 2, 2, H1);
  } else if (style === 'bun') {
    box(ctx, cx - f * r * 1.1 - 2, hy - r * 1.25, 5, 4, H1);
    box(ctx, cx - f * r * 1.1 - 1, hy - r * 1.3, 3, 2, HI);
    box(ctx, cx + f * r * 0.9, hy - r * 0.2, 2, r * 0.5, H1);
  }
}

/* -------------------------------------------------------------- the props */

function drawBook(ctx, x, y, H) {
  const w = H * 0.16, h = H * 0.1;
  box(ctx, x - w / 2, y - h / 2, w, h, '#f4efe0');
  box(ctx, x - w / 2, y - h / 2, w, 1, '#d8d0bc');
  box(ctx, x, y - h / 2, 1, h, '#b8ae98');
  box(ctx, x - w / 2, y + h / 2 - 1, w, 1, '#c25a4a');
}

function drawBag(ctx, x, y, H, f, shoX, shoY) {
  const w = H * 0.17, h = H * 0.15;
  const sx = shoX - f * H * 0.03;
  const n = Math.max(2, Math.round(Math.hypot(x - sx, y - shoY)));
  for (let i = 0; i <= n; i++) {
    const k = i / n;
    box(ctx, lerp(sx, x, k), lerp(shoY, y - h * 0.5, k), 1, 1, '#4a3a2c');
  }
  box(ctx, x - w / 2, y, w, h, '#6d4c39');
  box(ctx, x - w / 2, y, w, 1, '#8b6549');
  box(ctx, x - 1, y + h * 0.45, 2, 1, '#d8c06a');
}

function drawTray(ctx, x, y, H) {
  const w = H * 0.3, h = H * 0.05;
  box(ctx, x - w / 2, y, w, h, '#b9b2a4');
  box(ctx, x - w / 2, y, w, 1, '#d8d2c4');
  box(ctx, x - w * 0.3, y - 2, w * 0.3, 2, '#f2eadc');   // rice
  box(ctx, x + w * 0.04, y - 2, w * 0.26, 2, '#a8562e'); // something with chilli
  box(ctx, x + w * 0.3, y - 1, 2, 1, '#6ea04a');
}

function drawHeldFlower(ctx, x, y, H) {
  box(ctx, x, y - H * 0.06, 1, H * 0.06, '#4d7c3a');
  box(ctx, x - 1, y - H * 0.09, 3, 2, '#5f49d6');
  box(ctx, x, y - H * 0.085, 1, 1, '#f4e08c');
}

function drawUmbrella(ctx, x, y, H, o) {
  const r = H * 0.32;
  const col = o.umbrella || '#5a7a9a';
  const top = y - r * 1.15;
  box(ctx, x, top, 1, r * 1.2, '#4a4038');
  for (let i = -10; i <= 10; i++) {
    const k = i / 10;
    box(ctx, x + k * r, top + (1 - Math.cos(k * 1.35)) * r * 0.62, 2, 2,
        Math.abs(i) % 4 < 2 ? col : shade(col, 0.18));
  }
}

/* ------------------------------------------------------------ the walkers */

export class Person {
  constructor(charKey, x, y) {
    this.char = charKey;
    this.x = x; this.y = y;
    this.outfit = charKey === 'A' ? 'thaiGirl' : charKey === 'T' ? 'thaiTeach' : 'thaiBoy';
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
    /* secondary motion */
    this.vx = 0; this.hlag = 0; this.hlagV = 0;
    this.bounce = 0; this.bounceV = 0; this.step = 0;
    /* pose blending */
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
    if (o.pose && o.pose !== this.pose) { this.startBlend(); this.bounceV += 14; }
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
    const px = this.x;
    this.stepWalk(dt);
    const inst = (this.x - px) / Math.max(dt, 1e-4);
    const accel = (inst - this.vx) / Math.max(dt, 1e-4);
    this.vx = lerp(this.vx, inst, 1 - Math.pow(0.002, dt));
    this.hlagV += (-this.hlag * 150 - accel * 0.0022) * dt;
    this.hlagV *= Math.pow(0.05, dt);
    this.hlag = clamp(this.hlag + this.hlagV * dt, -0.35, 0.35);
    this.bounceV += -this.bounce * 190 * dt;
    this.bounceV *= Math.pow(0.02, dt);
    this.bounce = clamp(this.bounce + this.bounceV * dt, -2.2, 2.2);
    if (this.autoIdle) this.idleLife(dt);
    // ease from whatever they were doing into whatever they are doing now
    const target = poseOf(this.pose, this.phase || this.t * 6);
    this.blend = Math.min(1, this.blend + dt * 4.5);
    const k = this.blend * this.blend * (3 - 2 * this.blend);
    this.P = this.blend >= 1 ? target : blendPose(this.prevP, target, k);
  }
  stepWalk(dt) {
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
        this.phase += dt * (this.speed > 42 ? 10 : 5.6);
        const half = Math.floor(this.phase / Math.PI);
        if (half !== this.step) { this.step = half; this.bounceV += this.speed > 42 ? 22 : 11; }
      }
    }
  }
  idleLife(dt) {
    const free = this.target === null && IDLE_POSES.includes(this.pose);
    if (!free) { this.idleT = 3 + this.rr.f(0, 5); return; }
    this.idleT -= dt;
    if (this.idleT > 0) return;
    this.idleT = this.rr.f(4.5, 11);
    const r = this.rr.f();
    this.setPoseNow(r < 0.3 ? 'stand' : r < 0.5 ? 'pockets' : r < 0.66 ? 'arms_crossed'
      : r < 0.78 ? 'lookout' : r < 0.88 ? 'think' : 'stretch');
    this.bounceV += 9;
    if (this.rr.chance(0.35)) this.face = this.rr.chance(0.5) ? 'smile' : 'calm';
  }
  draw(ctx, cam, extra = {}) {
    if (!this.visible) return null;
    const lift = this.pose === 'sit_log' ? 7 : 0;
    return drawHuman(ctx, this.x - cam, this.y - lift, {
      char: this.char, outfit: this.outfit, P: this.P, face: this.face,
      flip: this.flip, t: this.t, phase: this.phase, prop: this.prop,
      age: this.age, alpha: this.alpha, blush: this.blush,
      bounce: this.bounce, hlag: this.hlag, moving: this.target !== null, ...extra,
    });
  }
}
