/* ============================================================================
 *  human.js — the two students.
 *
 *  Tall, slim figures built on a little skeleton: every pose is a set of joint
 *  angles, solved forward and drawn as tapered, ink-outlined limbs.  That way
 *  they can walk, sit cross-legged over a textbook, crouch to the dog, hold an
 *  umbrella, hold hands, turn away from each other, and grow up.
 * ==========================================================================*/

import { lerp, shade, rgba, rng, fillEllipse } from './core.js';

/* ------------------------------------------------------------- wardrobes --*/

export const OUTFITS = {
  uniformA: { top: '#f2f0ea', topSh: '#d6d2c6', bottom: '#2f3a5e', bottomSh: '#212a46',
              accent: '#b4384a', shoe: '#3a3a42', sock: '#f2f0ea', skirt: true, blazer: null },
  uniformB: { top: '#f2f0ea', topSh: '#d6d2c6', bottom: '#2f3a5e', bottomSh: '#212a46',
              accent: '#3f5f8c', shoe: '#3a3a42', sock: null, skirt: false, blazer: null },
  blazerA:  { top: '#f2f0ea', topSh: '#d6d2c6', bottom: '#2f3a5e', bottomSh: '#212a46',
              accent: '#b4384a', shoe: '#3a3a42', sock: '#f2f0ea', skirt: true, blazer: '#38415e' },
  blazerB:  { top: '#f2f0ea', topSh: '#d6d2c6', bottom: '#2f3a5e', bottomSh: '#212a46',
              accent: '#3f5f8c', shoe: '#3a3a42', sock: null, skirt: false, blazer: '#38415e' },
  cardigan: { top: '#e8d8c0', topSh: '#cbb99e', bottom: '#4a4a6a', bottomSh: '#363652',
              accent: '#c47a6a', shoe: '#5a4a3a', sock: null, skirt: true, blazer: null },
  hoodie:   { top: '#5e7a8c', topSh: '#46606f', bottom: '#3a4250', bottomSh: '#2a303c',
              accent: '#8aa8b8', shoe: '#42424a', sock: null, skirt: false, blazer: null },
  summerA:  { top: '#f4e8d8', topSh: '#d8c8b2', bottom: '#7a9ab4', bottomSh: '#5e7a92',
              accent: '#e0a0a8', shoe: '#c8b49a', sock: null, skirt: true, blazer: null },
  summerB:  { top: '#dce8ee', topSh: '#bccdd6', bottom: '#6a7484', bottomSh: '#505a68',
              accent: '#8ab0c4', shoe: '#b0a086', sock: null, skirt: false, blazer: null },
  coatA:    { top: '#b06a5e', topSh: '#8e5248', bottom: '#3a3a4e', bottomSh: '#2a2a3a',
              accent: '#f0e0d0', shoe: '#4a3a32', sock: null, skirt: false, blazer: null },
  coatB:    { top: '#4a5a52', topSh: '#36443e', bottom: '#33384a', bottomSh: '#252838',
              accent: '#c8b8a0', shoe: '#3a3238', sock: null, skirt: false, blazer: null },
  adultA:   { top: '#e6dcd0', topSh: '#c8bcae', bottom: '#5a5060', bottomSh: '#443c4a',
              accent: '#a8768a', shoe: '#4a3c3a', sock: null, skirt: true, blazer: null },
  adultB:   { top: '#cfd8dc', topSh: '#b0bcc2', bottom: '#454a5c', bottomSh: '#333846',
              accent: '#7a8a9a', shoe: '#3a3436', sock: null, skirt: false, blazer: null },
  child:    { top: '#f4e0a8', topSh: '#d8c084', bottom: '#7a8ac0', bottomSh: '#5e6ea0',
              accent: '#e88a8a', shoe: '#d06a5a', sock: '#ffffff', skirt: false, blazer: null },
};

/* ---------------------------------------------------------------- people --*/

export const CHARS = {
  A: {
    name: 'A', h: 58, skin: '#f0cfae', skinSh: '#d4a884',
    hair: '#2e2430', hairHi: '#4a3a4a', hairLo: '#1c161e',
    style: 'ponytail', build: 0.92,
  },
  B: {
    name: 'B', h: 62, skin: '#eec8a2', skinSh: '#cf9f77',
    hair: '#5a3c2c', hairHi: '#7e5a40', hairLo: '#3a2618',
    style: 'short', build: 1.0,
  },
  C: {   // the child, much later
    name: 'C', h: 34, skin: '#f4d4b4', skinSh: '#d8ac8a',
    hair: '#3a2c30', hairHi: '#5a4448', hairLo: '#241a1e',
    style: 'bob', build: 0.9,
  },
};

/* ----------------------------------------------------------------- poses --*/
/* angles are radians from straight down, positive swings forward (+x) */

function poseAngles(pose, ph, o) {
  const s = Math.sin(ph), c = Math.cos(ph);
  switch (pose) {
    case 'walk':
      return { hipF: s * 0.5, hipB: -s * 0.5, kneeF: Math.max(0, -s) * 0.6, kneeB: Math.max(0, s) * 0.5,
               shF: -s * 0.42, shB: s * 0.42, elF: 0.25, elB: 0.25, lean: 0.03, bob: Math.abs(c) * 0.9 };
    case 'run':
      return { hipF: s * 0.9, hipB: -s * 0.9, kneeF: Math.max(0, -s) * 1.1, kneeB: Math.max(0, s) * 0.9,
               shF: -s * 0.8, shB: s * 0.8, elF: 0.9, elB: 0.9, lean: 0.16, bob: Math.abs(c) * 1.8 };
    case 'sit_ground':     // cross-legged, the studying pose
      return { sit: 'ground', hipF: 1.5, hipB: 1.35, kneeF: 1.6, kneeB: 1.5,
               shF: 0.55, shB: 0.45, elF: 1.05, elB: 0.95, lean: 0.24, bob: 0 };
    case 'sit_log':
      return { sit: 'log', hipF: 1.45, hipB: 1.45, kneeF: 1.5, kneeB: 1.5,
               shF: 0.1, shB: -0.05, elF: 0.4, elB: 0.35, lean: 0.06, bob: 0 };
    case 'sit_knees':
      return { sit: 'knees', hipF: 1.6, hipB: 1.6, kneeF: 1.9, kneeB: 1.9,
               shF: 0.2, shB: 0.15, elF: 0.5, elB: 0.5, lean: 0.1, bob: 0 };
    case 'crouch':         // down at the dog's level
      return { sit: 'crouch', hipF: 1.35, hipB: 1.25, kneeF: 1.9, kneeB: 1.8,
               shF: 0.85, shB: 0.2, elF: 0.8, elB: 0.4, lean: 0.3, bob: 0 };
    case 'reach':          // crouched, hand out to the dog
      return { sit: 'crouch', hipF: 1.35, hipB: 1.25, kneeF: 1.9, kneeB: 1.8,
               shF: 1.25, shB: 0.1, elF: 0.25, elB: 0.4, lean: 0.34, bob: 0 };
    case 'wave':
      return { hipF: 0.06, hipB: -0.06, kneeF: 0.04, kneeB: 0.04,
               shF: -2.5 + s * 0.22, shB: 0.12, elF: 0.5, elB: 0.2, lean: 0.02, bob: 0 };
    case 'hold':           // hands held, inner arms down and linked
      return { hipF: 0.05, hipB: -0.05, kneeF: 0.03, kneeB: 0.03,
               shF: 0.34, shB: -0.12, elF: 0.16, elB: 0.2, lean: 0, bob: 0, hold: true };
    case 'hug':
      return { hipF: 0.04, hipB: -0.04, kneeF: 0.02, kneeB: 0.02,
               shF: 1.5, shB: 1.3, elF: 1.2, elB: 1.1, lean: 0.1, bob: 0 };
    case 'arms_crossed':
      return { hipF: 0.05, hipB: -0.05, kneeF: 0.02, kneeB: 0.02,
               shF: 1.1, shB: 1.05, elF: 1.5, elB: 1.45, lean: -0.04, bob: 0 };
    case 'pockets':
      return { hipF: 0.04, hipB: -0.04, kneeF: 0.02, kneeB: 0.02,
               shF: 0.5, shB: 0.45, elF: 0.75, elB: 0.7, lean: 0.02, bob: 0 };
    case 'umbrella':
      return { hipF: 0.05, hipB: -0.05, kneeF: 0.03, kneeB: 0.03,
               shF: -2.2, shB: 0.2, elF: 0.4, elB: 0.2, lean: 0, bob: 0 };
    case 'point':
      return { hipF: 0.05, hipB: -0.05, kneeF: 0.02, kneeB: 0.02,
               shF: -1.5, shB: 0.1, elF: 0.1, elB: 0.25, lean: 0.02, bob: 0 };
    case 'read':           // standing, book held up
      return { hipF: 0.04, hipB: -0.04, kneeF: 0.02, kneeB: 0.02,
               shF: 1.0, shB: 0.95, elF: 1.3, elB: 1.25, lean: 0.08, bob: 0 };
    default:               // stand
      return { hipF: 0.05, hipB: -0.05, kneeF: 0.02, kneeB: 0.02,
               shF: 0.16, shB: -0.1, elF: 0.2, elB: 0.18, lean: 0.01, bob: 0 };
  }
}

/* ---------------------------------------------------------------- drawing */

function limb(ctx, x0, y0, x1, y1, w0, w1, col, ink) {
  const n = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0)));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = lerp(x0, x1, t), y = lerp(y0, y1, t), w = lerp(w0, w1, t);
    fillEllipse(ctx, x, y, w / 2 + 0.7, w / 2 + 0.7, ink);
  }
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = lerp(x0, x1, t), y = lerp(y0, y1, t), w = lerp(w0, w1, t);
    fillEllipse(ctx, x, y, w / 2, w / 2, col);
  }
}

/**
 * Draw one person.
 *  x, y  — where their feet meet the ground
 *  o.char    — key of CHARS
 *  o.outfit  — key of OUTFITS
 *  o.pose    — key of the pose table
 *  o.face    — 'calm' | 'smile' | 'laugh' | 'sad' | 'cry' | 'surprise' | 'closed' | 'tired'
 *  o.flip    — face left
 *  o.age     — 0 teen, 1 twenties, 2 thirties+ (small proportion shifts)
 */
export function drawHuman(ctx, x, y, o = {}) {
  const C = CHARS[o.char] || CHARS.A;
  const F = OUTFITS[o.outfit] || OUTFITS.uniformA;
  const HGT = (o.height || C.h) * (o.scale || 1);
  const f = o.flip ? -1 : 1;
  const t = o.t || 0;
  const alpha = o.alpha === undefined ? 1 : o.alpha;
  const age = o.age || 0;
  const build = C.build * (1 + age * 0.04);
  const ink = '#20202c';
  const P = poseAngles(o.pose || 'stand', (o.phase || t * 5), o);

  ctx.globalAlpha = alpha;

  /* --- skeleton ------------------------------------------------------- */
  const sitDrop = P.sit === 'ground' ? 0.30 : P.sit === 'log' ? 0.26 : P.sit === 'knees' ? 0.30
                : P.sit === 'crouch' ? 0.22 : 0;
  const bob = (P.bob || 0) * HGT * 0.006;
  const footY = y;
  const hipY = footY - HGT * (0.49 - sitDrop) + bob;
  const lean = P.lean * f;
  const shoY = hipY - HGT * 0.325;
  const hipX = x + lean * HGT * 0.1;
  const shoX = hipX + lean * HGT * 0.26;
  const neckY = shoY - HGT * 0.025;
  const headR = HGT * 0.079;
  const headY = neckY - headR * 1.02 - HGT * 0.012;
  const headX = shoX + lean * HGT * 0.1 + (o.headTilt || 0) * HGT * 0.02;

  const thigh = HGT * 0.245;
  const shin = HGT * 0.275;
  const upper = HGT * 0.175;
  const fore = HGT * 0.165;
  const legW = HGT * 0.062 * build;
  const armW = HGT * 0.05 * build;

  /* --- far leg, far arm ---------------------------------------------- */
  const legs = [];
  for (const [ang, knee, near] of [[P.hipB, P.kneeB, false], [P.hipF, P.kneeF, true]]) {
    const kx = hipX + Math.sin(ang) * thigh * f;
    const ky = hipY + Math.cos(ang) * thigh;
    let ex, ey;
    if (P.sit) {
      ex = kx + Math.sin(ang - knee) * shin * f;
      ey = ky + Math.cos(ang - knee) * shin;
      if (P.sit === 'ground' || P.sit === 'knees') { ey = Math.min(ey, footY); }
    } else {
      ex = kx + Math.sin(ang - knee) * shin * f;
      ey = ky + Math.cos(ang - knee) * shin;
      ey = Math.max(ey, footY - HGT * 0.02);
    }
    legs.push({ kx, ky, ex, ey, near });
  }
  const drawLeg = (L) => {
    const c = L.near ? F.bottom : F.bottomSh;
    if (F.skirt && !P.sit) {
      limb(ctx, hipX, hipY + HGT * 0.04, L.kx, L.ky, legW, legW * 0.86, L.near ? C.skin : C.skinSh, ink);
    } else {
      limb(ctx, hipX, hipY, L.kx, L.ky, legW * 1.06, legW * 0.92, c, ink);
    }
    if (F.skirt) limb(ctx, L.kx, L.ky, L.ex, L.ey, legW * 0.82, legW * 0.66, L.near ? C.skin : C.skinSh, ink);
    else limb(ctx, L.kx, L.ky, L.ex, L.ey, legW * 0.9, legW * 0.7, c, ink);
    if (F.sock) limb(ctx, lerp(L.kx, L.ex, 0.55), lerp(L.ky, L.ey, 0.55), L.ex, L.ey, legW * 0.8, legW * 0.68, F.sock, ink);
    // shoe
    fillEllipse(ctx, L.ex + f * legW * 0.24, L.ey + 0.6, legW * 0.72, legW * 0.42, ink);
    fillEllipse(ctx, L.ex + f * legW * 0.24, L.ey + 0.4, legW * 0.62, legW * 0.32, L.near ? F.shoe : shade(F.shoe, -0.2));
  };
  drawLeg(legs[0]);

  /* --- torso ----------------------------------------------------------- */
  {
    const w = HGT * 0.13 * build;
    const hipW = HGT * (F.skirt ? 0.15 : 0.115) * build;
    limb(ctx, hipX, hipY, shoX, shoY, hipW, w, F.top, ink);
    // shading down the far side
    limb(ctx, hipX + f * hipW * 0.28, hipY, shoX + f * w * 0.3, shoY, hipW * 0.36, w * 0.34, F.topSh, ink === null ? ink : F.topSh);
    if (F.blazer) {
      limb(ctx, hipX - f * w * 0.1, hipY - HGT * 0.02, shoX - f * w * 0.05, shoY, hipW * 0.62, w * 1.02, F.blazer, ink);
      limb(ctx, shoX - f * w * 0.42, shoY + HGT * 0.01, hipX - f * w * 0.42, hipY - HGT * 0.04, w * 0.3, hipW * 0.24, shade(F.blazer, 0.16), F.blazer);
    }
    if (F.skirt && !P.sit) {
      // pleated skirt as a trapezoid of slats
      const sy = hipY - HGT * 0.02;
      const sh = HGT * 0.16;
      for (let i = -2; i <= 2; i++) {
        ctx.fillStyle = i % 2 ? F.bottomSh : F.bottom;
        for (let k = 0; k < sh; k++) {
          const spread = 1 + (k / sh) * 0.42;
          ctx.fillRect(Math.round(hipX + i * hipW * 0.36 * spread - hipW * 0.18),
                       Math.round(sy + k), Math.max(1, Math.round(hipW * 0.38)), 1);
        }
      }
      ctx.fillStyle = ink;
      for (let k = 0; k < sh; k++) {
        const spread = 1 + (k / sh) * 0.42;
        ctx.fillRect(Math.round(hipX - hipW * 0.92 * spread), Math.round(sy + k), 1, 1);
        ctx.fillRect(Math.round(hipX + hipW * 0.92 * spread), Math.round(sy + k), 1, 1);
      }
      ctx.fillRect(Math.round(hipX - hipW * 1.2), Math.round(sy + sh - 1), Math.round(hipW * 2.4), 1);
    }
    // collar + ribbon or tie
    const cw = HGT * 0.055;
    fillEllipse(ctx, shoX, shoY + HGT * 0.012, cw, HGT * 0.02, F.topSh);
    if (F.accent) {
      ctx.fillStyle = F.accent;
      const ry = shoY + HGT * 0.03;
      ctx.fillRect(Math.round(shoX - cw * 0.45), Math.round(ry), Math.max(2, Math.round(cw * 0.9)), Math.max(1, Math.round(HGT * 0.016)));
      ctx.fillRect(Math.round(shoX - cw * 0.16), Math.round(ry), Math.max(1, Math.round(cw * 0.34)), Math.max(2, Math.round(HGT * 0.05)));
    }
  }

  /* --- arms ------------------------------------------------------------ */
  const arms = [];
  for (const [ang, el, near] of [[P.shB, P.elB, false], [P.shF, P.elF, true]]) {
    const sx2 = shoX + (near ? f : -f) * HGT * 0.035;
    const sy2 = shoY + HGT * 0.025;
    const kx = sx2 + Math.sin(ang) * upper * f;
    const ky = sy2 + Math.cos(ang) * upper;
    const ex = kx + Math.sin(ang - el) * fore * f;
    const ey = ky + Math.cos(ang - el) * fore;
    arms.push({ sx2, sy2, kx, ky, ex, ey, near });
  }
  const drawArm = (Ar) => {
    const sleeve = Ar.near ? (F.blazer || F.top) : shade(F.blazer || F.topSh, -0.05);
    limb(ctx, Ar.sx2, Ar.sy2, Ar.kx, Ar.ky, armW * 1.1, armW * 0.9, sleeve, ink);
    limb(ctx, Ar.kx, Ar.ky, Ar.ex, Ar.ey, armW * 0.85, armW * 0.62, Ar.near ? C.skin : C.skinSh, ink);
    fillEllipse(ctx, Ar.ex, Ar.ey, armW * 0.46 + 0.6, armW * 0.46 + 0.6, ink);
    fillEllipse(ctx, Ar.ex, Ar.ey, armW * 0.46, armW * 0.46, Ar.near ? C.skin : C.skinSh);
  };
  drawArm(arms[0]);

  /* --- head ------------------------------------------------------------ */
  drawHead(ctx, headX, headY, headR, f, C, o, ink, HGT, t);

  /* --- the near leg and arm sit in front ------------------------------- */
  drawLeg(legs[1]);
  drawArm(arms[1]);

  /* --- things they carry ---------------------------------------------- */
  const hand = arms[1];
  if (o.prop === 'book') drawBook(ctx, hand.ex + f * 2, hand.ey - 1, HGT, f, o);
  if (o.prop === 'bag') drawBag(ctx, hipX - f * HGT * 0.16, hipY + HGT * 0.02, HGT, f);
  if (o.prop === 'umbrella') drawUmbrella(ctx, hand.ex, hand.ey, HGT, f, o);
  if (o.prop === 'bowl') drawHeldBowl(ctx, hand.ex + f * 2, hand.ey, HGT, f);
  ctx.globalAlpha = 1;
  return { headX, headY, headR, shoX, shoY, hipY, handX: hand.ex, handY: hand.ey };
}

function drawHead(ctx, hx, hy, r, f, C, o, ink, HGT, t) {
  const turn = o.turn === undefined ? 0 : o.turn;    // -1 away .. 1 toward
  const tilt = (o.headTilt || 0);
  // neck
  limb(ctx, hx - f * r * 0.1, hy + r * 0.92, hx, hy + r * 1.5, r * 0.5, r * 0.6, C.skinSh, ink);
  // skull with a soft anime chin
  fillEllipse(ctx, hx, hy, r + 0.8, r * 1.06 + 0.8, ink);
  fillEllipse(ctx, hx + f * r * 0.1, hy + r * 0.55, r * 0.72 + 0.8, r * 0.6 + 0.8, ink);
  fillEllipse(ctx, hx, hy, r, r * 1.06, C.skin);
  fillEllipse(ctx, hx + f * r * 0.1, hy + r * 0.55, r * 0.72, r * 0.6, C.skin);
  fillEllipse(ctx, hx - f * r * 0.62, hy + r * 0.1, r * 0.34, r * 0.5, C.skinSh);

  hair(ctx, hx, hy, r, f, C, ink, t, o);

  if (o.hideFace) return;
  /* face — two or three pixels of it, so every one counts */
  const face = o.face || 'calm';
  const ey = hy + r * 0.12 + tilt * r * 0.2;
  const e1 = hx + f * (r * 0.16 + turn * r * 0.1);
  const e2 = hx + f * (r * 0.62 + turn * r * 0.1);
  const dark = '#2a2630';
  const closed = face === 'closed' || face === 'laugh' || face === 'smile2' || face === 'sleep';
  for (const ex of [e1, e2]) {
    if (turn < -0.6 && ex === e1) continue;
    if (closed) {
      ctx.fillStyle = dark;
      ctx.fillRect(Math.round(ex - 1), Math.round(ey), 2, 1);
      if (face === 'laugh') ctx.fillRect(Math.round(ex), Math.round(ey - 1), 1, 1);
    } else {
      ctx.fillStyle = dark;
      ctx.fillRect(Math.round(ex), Math.round(ey - (face === 'surprise' ? 1 : 0)), 1, face === 'surprise' ? 3 : 2);
      ctx.fillStyle = rgba('#ffffff', 0.8);
      ctx.fillRect(Math.round(ex), Math.round(ey - (face === 'surprise' ? 1 : 0)), 1, 1);
    }
    // brow
    if (face === 'sad' || face === 'cry' || face === 'angry') {
      ctx.fillStyle = C.hairLo;
      const dy = face === 'angry' ? (ex === e1 ? 0 : 0) : -1;
      ctx.fillRect(Math.round(ex - 1), Math.round(ey - 2 + (face === 'angry' ? 0 : dy + 1)), 2, 1);
    }
  }
  // mouth
  const my = hy + r * 0.62 + tilt * r * 0.2;
  const mx = hx + f * (r * 0.4 + turn * r * 0.1);
  ctx.fillStyle = '#9a5a5a';
  if (face === 'laugh') {
    fillEllipse(ctx, mx, my, r * 0.2, r * 0.16, '#8a4a4a');
  } else if (face === 'smile' || face === 'smile2') {
    ctx.fillRect(Math.round(mx - 1), Math.round(my), 2, 1);
    ctx.fillRect(Math.round(mx - 2), Math.round(my - 1), 1, 1);
    ctx.fillRect(Math.round(mx + 1), Math.round(my - 1), 1, 1);
  } else if (face === 'sad' || face === 'cry') {
    ctx.fillRect(Math.round(mx - 1), Math.round(my), 2, 1);
    ctx.fillRect(Math.round(mx - 2), Math.round(my + 1), 1, 1);
    ctx.fillRect(Math.round(mx + 1), Math.round(my + 1), 1, 1);
  } else {
    ctx.fillRect(Math.round(mx - 1), Math.round(my), 2, 1);
  }
  if (face === 'cry') {
    ctx.fillStyle = rgba('#9fd8f0', 0.9);
    ctx.fillRect(Math.round(e2), Math.round(ey + 2 + (Math.sin(t * 3) * 2 + 2)), 1, 2);
  }
  if (o.blush) {
    ctx.globalAlpha = 0.4;
    fillEllipse(ctx, e1 - f * r * 0.1, ey + r * 0.3, r * 0.2, r * 0.12, '#f08a90');
    fillEllipse(ctx, e2 + f * r * 0.2, ey + r * 0.3, r * 0.2, r * 0.12, '#f08a90');
    ctx.globalAlpha = 1;
  }
}

function hair(ctx, hx, hy, r, f, C, ink, t, o) {
  const H = C.hair, HI = C.hairHi, LO = C.hairLo;
  const sway = Math.sin(t * 1.1) * r * 0.06;
  const cap = () => {
    // the crown only: everything below the brow line stays face
    fillEllipse(ctx, hx - f * r * 0.06, hy - r * 0.54, r * 1.06, r * 0.64, LO);
    fillEllipse(ctx, hx - f * r * 0.06, hy - r * 0.62, r * 1.0, r * 0.56, H);
    fillEllipse(ctx, hx - f * r * 0.4, hy - r * 0.76, r * 0.36, r * 0.22, HI);
  };
  const style = o.hairOverride || C.style;
  if (style === 'ponytail') {
    // back mass first
    fillEllipse(ctx, hx - f * r * 0.5 + sway, hy + r * 0.5, r * 0.55, r * 1.25, LO);
    for (let i = 0; i < 12; i++) {
      const k = i / 11;
      fillEllipse(ctx, hx - f * (r * 0.8 + k * r * 0.5) + sway * (1 + k * 2),
                  hy + r * 0.2 + k * r * 1.9, r * (0.34 - k * 0.2), r * (0.4 - k * 0.16), i % 3 ? H : LO);
    }
    cap();
    // a swept fringe that just clears the eyes
    fillEllipse(ctx, hx + f * r * 0.6, hy - r * 0.56, r * 0.44, r * 0.34, H);
    fillEllipse(ctx, hx + f * r * 0.88, hy - r * 0.3, r * 0.2, r * 0.26, H);
    fillEllipse(ctx, hx + f * r * 0.2, hy - r * 0.62, r * 0.32, r * 0.24, HI);
    // side locks down past the jaw
    fillEllipse(ctx, hx + f * r * 0.98, hy + r * 0.3, r * 0.16, r * 0.6, H);
    fillEllipse(ctx, hx - f * r * 0.96, hy + r * 0.24, r * 0.18, r * 0.56, LO);
  } else if (style === 'short') {
    cap();
    for (let i = -3; i <= 3; i++) {
      const sx = hx + f * i * r * 0.26;
      const hgt = r * (0.36 + ((i + 3) % 3) * 0.12);
      fillEllipse(ctx, sx, hy - r * 0.86 - hgt * 0.2, r * 0.2, hgt * 0.5, i % 2 ? H : LO);
    }
    fillEllipse(ctx, hx + f * r * 0.66, hy - r * 0.48, r * 0.38, r * 0.34, H);
    fillEllipse(ctx, hx + f * r * 0.92, hy - r * 0.22, r * 0.16, r * 0.24, H);
    fillEllipse(ctx, hx - f * r * 0.86, hy - r * 0.22, r * 0.2, r * 0.38, LO);
    fillEllipse(ctx, hx - f * r * 0.12, hy - r * 0.72, r * 0.28, r * 0.18, HI);
  } else if (style === 'bob') {
    fillEllipse(ctx, hx - f * r * 0.1, hy + r * 0.1, r * 1.12, r * 0.98, LO);
    cap();
    fillEllipse(ctx, hx + f * r * 0.78, hy - r * 0.1, r * 0.26, r * 0.66, H);
    fillEllipse(ctx, hx - f * r * 0.86, hy + r * 0.05, r * 0.28, r * 0.7, H);
    fillEllipse(ctx, hx + f * r * 0.5, hy - r * 0.56, r * 0.4, r * 0.28, H);
    fillEllipse(ctx, hx + f * r * 0.1, hy - r * 0.6, r * 0.28, r * 0.2, HI);
  } else if (style === 'bun') {
    fillEllipse(ctx, hx - f * r * 0.92, hy - r * 0.62, r * 0.4, r * 0.38, LO);
    fillEllipse(ctx, hx - f * r * 0.9, hy - r * 0.66, r * 0.32, r * 0.3, H);
    cap();
    fillEllipse(ctx, hx + f * r * 0.56, hy - r * 0.46, r * 0.42, r * 0.36, H);
    fillEllipse(ctx, hx + f * r * 0.94, hy + r * 0.18, r * 0.14, r * 0.42, H);
  }
}

/* -------------------------------------------------------------- the props */

function drawBook(ctx, x, y, HGT, f, o) {
  const w = HGT * 0.15, h = HGT * 0.1;
  const open = o.bookOpen !== false;
  ctx.fillStyle = '#2a2630';
  ctx.fillRect(Math.round(x - w / 2 - 1), Math.round(y - h / 2 - 1), Math.round(w) + 2, Math.round(h) + 2);
  ctx.fillStyle = open ? '#f2ecdc' : '#8a5a4a';
  ctx.fillRect(Math.round(x - w / 2), Math.round(y - h / 2), Math.round(w), Math.round(h));
  if (open) {
    ctx.fillStyle = '#c8c0ae';
    ctx.fillRect(Math.round(x), Math.round(y - h / 2), 1, Math.round(h));
    ctx.fillStyle = '#9a9486';
    for (let i = 1; i < h - 1; i += 2) {
      ctx.fillRect(Math.round(x - w / 2 + 1), Math.round(y - h / 2 + i), Math.round(w / 2 - 2), 1);
      ctx.fillRect(Math.round(x + 2), Math.round(y - h / 2 + i), Math.round(w / 2 - 2), 1);
    }
  }
}

function drawBag(ctx, x, y, HGT, f) {
  const w = HGT * 0.17, h = HGT * 0.13;
  ctx.fillStyle = '#2a2630';
  ctx.fillRect(Math.round(x - w / 2 - 1), Math.round(y - 1), Math.round(w) + 2, Math.round(h) + 2);
  ctx.fillStyle = '#6a4a38';
  ctx.fillRect(Math.round(x - w / 2), Math.round(y), Math.round(w), Math.round(h));
  ctx.fillStyle = '#8a6448';
  ctx.fillRect(Math.round(x - w / 2), Math.round(y), Math.round(w), 1);
  ctx.fillStyle = '#d8c06a';
  ctx.fillRect(Math.round(x - 1), Math.round(y + h * 0.5), 2, 1);
}

function drawUmbrella(ctx, x, y, HGT, f, o) {
  const r = HGT * 0.34;
  const col = o.umbrella || '#5a7a9a';
  ctx.fillStyle = '#2a2630';
  ctx.fillRect(Math.round(x), Math.round(y - r * 1.1), 1, Math.round(r * 1.2));
  const top = y - r * 1.15;
  for (let pass = 0; pass < 2; pass++) {
    for (let i = -10; i <= 10; i++) {
      const t = i / 10;
      const cx = x + t * r;
      const cy = top + (1 - Math.cos(t * 1.35)) * r * 0.62;
      const rr = r * 0.13;
      if (pass === 0) fillEllipse(ctx, cx, cy, rr + 1, rr + 1, '#2a2630');
      else fillEllipse(ctx, cx, cy, rr, rr, Math.abs(i) % 4 < 2 ? col : shade(col, 0.18));
    }
  }
  ctx.fillStyle = '#2a2630';
  ctx.fillRect(Math.round(x), Math.round(top - 2), 1, 3);
}

function drawHeldBowl(ctx, x, y, HGT, f) {
  const w = HGT * 0.12;
  fillEllipse(ctx, x, y, w * 0.6 + 1, w * 0.34 + 1, '#2a2630');
  fillEllipse(ctx, x, y, w * 0.6, w * 0.32, '#b0a898');
  fillEllipse(ctx, x, y - 0.6, w * 0.44, w * 0.2, '#8a8478');
}

/* ------------------------------------------------------------ the walkers */

export class Person {
  constructor(charKey, x, y) {
    this.char = charKey;
    this.x = x; this.y = y;
    this.outfit = charKey === 'A' ? 'uniformA' : 'uniformB';
    this.pose = 'stand';
    this.face = 'calm';
    this.flip = false;
    this.t = rng(charKey.charCodeAt(0) * 7).f(0, 10);
    this.phase = 0;
    this.target = null;
    this.speed = 26;
    this.prop = null;
    this.age = 0;
    this.turn = 1;
    this.visible = true;
    this.alpha = 1;
    this.sitting = false;
    this.onArrive = null;
  }
  walkTo(wx, opts = {}) {
    this.target = wx;
    this.speed = opts.speed || 30;
    this.onArrive = opts.then || null;
    this.sitting = false;
  }
  /** Settle into a pose — but finish walking there first. */
  setPose(o) {
    if (this.target !== null) { this.queued = Object.assign(this.queued || {}, o); return; }
    this.applyPose(o);
  }
  applyPose(o) {
    if (o.at !== undefined) this.x = o.at;
    if (o.pose) this.pose = o.pose;
    if (o.face) this.face = o.face;
    if (o.prop !== undefined) this.prop = o.prop;
    if (o.flip !== undefined) this.flip = o.flip;
    if (o.turn !== undefined) this.turn = o.turn;
    if (o.blush !== undefined) this.blush = o.blush;
  }
  update(dt) {
    this.t += dt;
    if (this.target !== null) {
      const d = this.target - this.x;
      if (Math.abs(d) < 1.5) {
        this.x = this.target;
        this.target = null;
        this.pose = 'stand';
        const cb = this.onArrive; this.onArrive = null;
        if (this.queued) { const q = this.queued; this.queued = null; this.applyPose(q); }
        if (cb) cb();
      } else {
        const v = Math.sign(d) * this.speed;
        this.x += v * dt;
        this.flip = v < 0;
        this.pose = this.speed > 40 ? 'run' : 'walk';
        this.phase += dt * (this.speed > 40 ? 11 : 6.5);
      }
    }
  }
  draw(ctx, cam, extra = {}) {
    if (!this.visible) return null;
    // sitting on the log means sitting on top of it
    const lift = this.pose === 'sit_log' ? 7 : 0;
    return drawHuman(ctx, this.x - cam, this.y - lift, {
      char: this.char, outfit: this.outfit, pose: this.pose, face: this.face,
      flip: this.flip, t: this.t, phase: this.phase, prop: this.prop,
      age: this.age, turn: this.turn, alpha: this.alpha, ...extra,
    });
  }
}
