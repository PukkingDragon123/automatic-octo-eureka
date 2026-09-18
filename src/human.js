/* ============================================================================
 *  human.js — the two students.
 *
 *  Drawn three-quarters on rather than in profile, so you get a face and a
 *  shoulder line instead of a silhouette.  Poses say where the hands and feet
 *  go; a two-bone solve puts the elbows and knees somewhere sensible.  Limbs
 *  are tapered and shaded rather than uniform tubes, which is most of the
 *  difference between a person and a pipe cleaner.
 * ==========================================================================*/

import { clamp, lerp, shade, rgba, rng, fillEllipse } from './core.js';

const INK = '#23202e';

/* ------------------------------------------------------------- wardrobes --*/
/* sleeve: how far the top covers the arm.  skirt: hem length, 0 = trousers.  */

export const OUTFITS = {
  uniformA: { top: '#f4f2ec', topSh: '#d5d2c7', topHi: '#ffffff', sleeve: 0.55,
              bottom: '#333e66', bottomSh: '#232c4c', skirt: 0.17, sock: '#f4f2ec', sockH: 0.16,
              shoe: '#3a3742', accent: '#b8384c', collar: '#e8e5da' },
  uniformB: { top: '#f4f2ec', topSh: '#d5d2c7', topHi: '#ffffff', sleeve: 0.55,
              bottom: '#333e66', bottomSh: '#232c4c', skirt: 0, sock: null,
              shoe: '#3a3742', accent: '#3f5f8c', collar: '#e8e5da' },
  blazerA:  { top: '#3b4568', topSh: '#2a3250', topHi: '#586severe', sleeve: 1,
              bottom: '#333e66', bottomSh: '#232c4c', skirt: 0.17, sock: '#f4f2ec', sockH: 0.16,
              shoe: '#3a3742', accent: '#b8384c', collar: '#f4f2ec', open: true },
  blazerB:  { top: '#3b4568', topSh: '#2a3250', sleeve: 1,
              bottom: '#333e66', bottomSh: '#232c4c', skirt: 0, sock: null,
              shoe: '#3a3742', accent: '#3f5f8c', collar: '#f4f2ec', open: true },
  cardigan: { top: '#e5d3b4', topSh: '#c6b193', topHi: '#f6ead2', sleeve: 1,
              bottom: '#4c4a6e', bottomSh: '#383654', skirt: 0.2, sock: null,
              shoe: '#5b483a', accent: '#c4786a', collar: '#f2ece0' },
  hoodie:   { top: '#5f7d90', topSh: '#476373', topHi: '#7f9dad', sleeve: 1,
              bottom: '#3b4350', bottomSh: '#2b313c', skirt: 0, sock: null,
              shoe: '#43424c', accent: null, collar: '#7f9dad', hood: true },
  summerA:  { top: '#f6ecd9', topSh: '#dccdb4', topHi: '#fffaf0', sleeve: 0.25,
              bottom: '#7fa0bc', bottomSh: '#62819b', skirt: 0.22, sock: null,
              shoe: '#cbb79c', accent: '#e4a2ab', collar: '#f6ecd9' },
  summerB:  { top: '#dfeaf0', topSh: '#bfcfd8', sleeve: 0.25,
              bottom: '#6d7787', bottomSh: '#525b6a', skirt: 0, sock: null,
              shoe: '#b3a389', accent: null, collar: '#dfeaf0' },
  coatA:    { top: '#b06a5e', topSh: '#8d5348', topHi: '#c98a7c', sleeve: 1, long: 0.1,
              bottom: '#3c3c50', bottomSh: '#2c2c3c', skirt: 0, sock: null,
              shoe: '#4d3d34', accent: '#f0e0d0', collar: '#c98a7c' },
  coatB:    { top: '#4d5d54', topSh: '#394740', sleeve: 1, long: 0.12,
              bottom: '#353a4c', bottomSh: '#272a38', skirt: 0, sock: null,
              shoe: '#3c3538', accent: '#c8b8a0', collar: '#5f7166' },
  adultA:   { top: '#ece2d5', topSh: '#cec2b2', topHi: '#fbf5ea', sleeve: 0.75,
              bottom: '#5d5366', bottomSh: '#473f52', skirt: 0.24, sock: null,
              shoe: '#4d3f3d', accent: '#a8768a', collar: '#f4ece0' },
  adultB:   { top: '#d3dce0', topSh: '#b3bfc5', sleeve: 0.8,
              bottom: '#484d60', bottomSh: '#363a49', skirt: 0, sock: null,
              shoe: '#3c3639', accent: null, collar: '#e2e9ec' },
  child:    { top: '#f6e2ac', topSh: '#dcc488', topHi: '#fff4cc', sleeve: 0.4,
              bottom: '#7f8fc4', bottomSh: '#6371a4', skirt: 0, sock: '#ffffff', sockH: 0.1,
              shoe: '#d4705f', accent: '#e88a8a', collar: '#f6e2ac' },
};
OUTFITS.blazerA.topHi = '#586088';

/* ---------------------------------------------------------------- people --*/

export const CHARS = {
  A: { h: 58, skin: '#f8d8b4', skinSh: '#dcb086', skinLn: '#bc8763',
       hair: '#3c3145', hairSh: '#241c2c', hairHi: '#6b5a78', style: 'ponytail', build: 0.94 },
  B: { h: 62, skin: '#f4d0a8', skinSh: '#d7a97e', skinLn: '#b4825a',
       hair: '#63452f', hairSh: '#402a1a', hairHi: '#8d6848', style: 'short', build: 1.06 },
  C: { h: 34, skin: '#f8d8b8', skinSh: '#dcb18c', skinLn: '#bb8a66',
       hair: '#3b2c30', hairSh: '#241a1e', hairHi: '#5c464c', style: 'bob', build: 0.9 },
};

/* ----------------------------------------------------------------- poses --*/
/* Targets are fractions of height, measured from the hip (feet) or shoulder
   (hands).  +x is the way they are facing.                                   */

function poseOf(pose, ph) {
  const s = Math.sin(ph), c = Math.cos(ph);
  const base = {
    crouch: 0, lean: 0, bob: 0, headTilt: 0, headTurn: 0.35, spread: 0.055,
    feet: [[-0.02, 0, 0], [0.02, 0, 0]],            // [dx, lift, toe]
    hands: [[-0.085, 0.30], [0.085, 0.30]],          // [dx, drop] from shoulder
    bendArm: [1, 1], bendLeg: [1, 1],
  };
  switch (pose) {
    case 'walk':
      return { ...base, bob: Math.abs(c) * 1.2, lean: 0.025,
        feet: [[-s * 0.13, Math.max(0, -s) * 0.055, -s * 0.5], [s * 0.13, Math.max(0, s) * 0.055, s * 0.5]],
        hands: [[-0.08 + s * 0.085, 0.29 - Math.abs(s) * 0.03], [0.08 - s * 0.085, 0.29 - Math.abs(s) * 0.03]] };
    case 'run':
      return { ...base, bob: Math.abs(c) * 1.8, lean: 0.06,
        feet: [[-s * 0.15, Math.max(0, -s) * 0.13, -s * 0.5], [s * 0.15, Math.max(0, s) * 0.13, s * 0.5]],
        hands: [[-0.05 + s * 0.12, 0.2 - s * 0.1], [0.05 - s * 0.12, 0.2 + s * 0.1]] };
    case 'sit_ground':        // cross-legged over a book
      return { ...base, crouch: 0.335, spread: 0.1,
        feet: [[0.055, 0.02, 0.5], [-0.02, 0.01, -0.4]], bendLeg: [1, -1],
        hands: [[0.02, 0.19], [0.1, 0.19]], headTilt: 0.35, headTurn: 0.25 };
    case 'sit_log':
      return { ...base, crouch: 0.245, spread: 0.07,
        feet: [[0.1, 0, 0.3], [0.13, 0, 0.3]], bendLeg: [1, 1],
        hands: [[-0.05, 0.26], [0.08, 0.24]] };
    case 'sit_knees':         // kneeling back on the heels
      return { ...base, crouch: 0.3, spread: 0.06,
        feet: [[-0.06, 0.015, -0.5], [-0.03, 0.015, -0.5]], bendLeg: [1, 1],
        hands: [[0.0, 0.22], [0.06, 0.22]], headTilt: 0.2 };
    case 'crouch':            // down at the dog's level
      return { ...base, crouch: 0.245, spread: 0.075, lean: 0.03,
        feet: [[-0.04, 0, -0.2], [0.075, 0, 0.35]], bendLeg: [1, 1],
        hands: [[-0.02, 0.185], [0.15, 0.21]], headTilt: 0.32, headTurn: 0.5 };
    case 'reach':             // crouched, hand out to him
      return { ...base, crouch: 0.245, spread: 0.075, lean: 0.045,
        feet: [[-0.04, 0, -0.2], [0.075, 0, 0.35]], bendLeg: [1, 1],
        hands: [[-0.04, 0.18], [0.235, 0.225]], headTilt: 0.38, headTurn: 0.55 };
    case 'wave':
      return { ...base, hands: [[-0.08, 0.3], [0.1 + s * 0.02, -0.14]], bendArm: [1, -1], headTurn: 0.4 };
    case 'hold':              // hands held with whoever is beside them
      return { ...base, hands: [[-0.07, 0.3], [0.13, 0.31]], headTurn: 0.25, headTilt: 0.06 };
    case 'hug':
      return { ...base, hands: [[0.12, 0.17], [0.17, 0.2]], bendArm: [-1, -1], headTilt: 0.1, headTurn: 0.2 };
    case 'arms_crossed':
      return { ...base, hands: [[0.07, 0.15], [-0.07, 0.15]], bendArm: [-1, -1], headTurn: 0.1 };
    case 'pockets':
      return { ...base, hands: [[-0.07, 0.26], [0.07, 0.26]], bendArm: [1, 1] };
    case 'umbrella':
      return { ...base, hands: [[-0.07, 0.3], [0.06, -0.06]], bendArm: [1, -1] };
    case 'point':
      return { ...base, hands: [[-0.07, 0.3], [0.2, 0.12]], bendArm: [1, -1], headTurn: 0.5 };
    case 'read':
      return { ...base, hands: [[0.03, 0.14], [0.11, 0.15]], bendArm: [-1, -1], headTilt: 0.3 };
    default:
      return base;
  }
}

/* ------------------------------------------------------------- primitives */

/** A tapered, ink-outlined limb with a shade down one side. */
function limb(ctx, x0, y0, x1, y1, w0, w1, col, sh, f) {
  const n = Math.max(2, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
  for (let pass = 0; pass < 3; pass++) {
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const x = lerp(x0, x1, t), y = lerp(y0, y1, t), w = lerp(w0, w1, t);
      if (pass === 0) fillEllipse(ctx, x, y, w + 0.8, w + 0.8, INK);
      else if (pass === 1) fillEllipse(ctx, x, y, w, w, col);
      else if (w > 1.3) fillEllipse(ctx, x + f * w * 0.42, y, w * 0.4, w * 0.82, sh);
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

/**
 * Draw one person.
 *  x, y     — where their feet meet the ground
 *  o.char   — 'A' | 'B' | 'C'
 *  o.outfit — key of OUTFITS
 *  o.pose   — key of the pose table
 *  o.face   — 'calm'|'smile'|'smile2'|'laugh'|'sad'|'cry'|'angry'|'surprise'|'closed'|'tired'
 *  o.flip   — face left
 */
export function drawHuman(ctx, x, y, o = {}) {
  const C = CHARS[o.char] || CHARS.A;
  const F = OUTFITS[o.outfit] || OUTFITS.uniformA;
  const H = (o.height || C.h) * (o.scale || 1);
  const f = o.flip ? -1 : 1;
  const t = o.t || 0;
  const alpha = o.alpha === undefined ? 1 : o.alpha;
  const age = o.age || 0;
  const build = C.build * (1 + age * 0.03);
  const P = poseOf(o.pose || 'stand', o.phase === undefined ? t * 6 : o.phase);
  ctx.globalAlpha = alpha;

  /* --- landmarks ------------------------------------------------------ */
  const bob = P.bob * H * 0.006;
  const hipY = y - H * (0.455 - P.crouch) + bob;
  const shoY = hipY - H * 0.285;
  const neckY = shoY - H * 0.022;
  const headR = H * 0.093;                       // half the head width
  const headY = neckY - headR * 1.2;
  const lean = P.lean * f * H;
  const hipX = x + lean * 0.3;
  const shoX = hipX + lean;
  const headX = shoX + lean * 0.5 + P.headTurn * f * H * 0.012;

  const thigh = H * 0.235, shin = H * 0.245;
  const upper = H * 0.17, fore = H * 0.16;
  const legW = H * 0.036 * build, armW = H * 0.027 * build;
  const shoW = H * 0.108 * build;

  /* --- feet and hands, then solve the joints -------------------------- */
  const legs = [0, 1].map((i) => {
    const near = i === 1;                       // 0 = far leg, 1 = near leg
    const fx = hipX + f * (P.feet[i][0] * H) + (near ? f : -f) * H * 0.025;
    const fy = y - P.feet[i][1] * H;
    const hip = [hipX + (near ? f : -f) * H * 0.022, hipY];
    const knee = ik(hip[0], hip[1], fx, fy, thigh, shin, (P.bendLeg[i] || 1) * f);
    return { hip, knee, foot: [fx, fy], toe: P.feet[i][2] || 0, near };
  });
  const arms = [0, 1].map((i) => {
    const sx = shoX + (i ? f * shoW * 0.92 : -f * shoW * 1.02);
    const sy = shoY + H * 0.012;
    // the far arm swings a little wider so it clears the body
    const hx = shoX + f * (P.hands[i][0] * H) - (i ? 0 : f * H * 0.03);
    const hy = shoY + P.hands[i][1] * H;
    const elbow = ik(sx, sy, hx, hy, upper, fore, (P.bendArm[i] || 1) * -f);
    return { sh: [sx, sy], elbow, hand: [hx, hy], near: i === 1 };
  });

  /* --- shadow --------------------------------------------------------- */
  if (o.shadow !== false) {
    ctx.globalAlpha = 0.18 * alpha;
    fillEllipse(ctx, x, y + 1, H * 0.11, H * 0.022, '#1b2a16');
    ctx.globalAlpha = alpha;
  }

  const skirtLen = F.skirt || 0;
  const hemY = hipY + skirtLen * H;
  const topLen = F.long ? hipY + F.long * H : hipY + H * 0.03;

  const drawLeg = (L) => {
    const nearF = L.near ? 1 : 0.82;
    const trouser = skirtLen === 0;
    const covered = trouser ? 1 : clamp((hemY - L.knee[1]) / (thigh * 0.6), 0, 1);
    const cl = L.near ? F.bottom : F.bottomSh;
    const clSh = shade(cl, -0.16);
    const sk = L.near ? C.skin : C.skinSh;
    const skSh = L.near ? C.skinSh : C.skinLn;
    // thigh
    limb(ctx, L.hip[0], L.hip[1], L.knee[0], L.knee[1], legW * 1.05 * nearF, legW * 0.86 * nearF,
         covered > 0.5 ? cl : sk, covered > 0.5 ? clSh : skSh, f);
    // shin
    limb(ctx, L.knee[0], L.knee[1], L.foot[0], L.foot[1], legW * 0.84 * nearF, legW * 0.5 * nearF,
         trouser ? cl : sk, trouser ? clSh : skSh, f);
    if (F.sock) {
      limb(ctx, lerp(L.knee[0], L.foot[0], 1 - F.sockH * 4), lerp(L.knee[1], L.foot[1], 1 - F.sockH * 4),
           L.foot[0], L.foot[1], legW * 0.62 * nearF, legW * 0.52 * nearF, F.sock, shade(F.sock, -0.14), f);
    }
    // shoe
    const sx2 = L.foot[0] + f * legW * (0.5 + L.toe * 0.5);
    fillEllipse(ctx, sx2, L.foot[1] - legW * 0.3, legW * 1.05, legW * 0.62, INK);
    fillEllipse(ctx, sx2, L.foot[1] - legW * 0.42, legW * 0.92, legW * 0.46, L.near ? F.shoe : shade(F.shoe, -0.2));
    fillEllipse(ctx, sx2 - f * legW * 0.3, L.foot[1] - legW * 0.62, legW * 0.36, legW * 0.22, shade(F.shoe, 0.25));
  };
  const drawArm = (Ar) => {
    const nearF = Ar.near ? 1 : 0.84;
    const sleeveEnd = F.sleeve === undefined ? 1 : F.sleeve;
    const cl = Ar.near ? F.top : (F.topSh || shade(F.top, -0.2));
    const sk = Ar.near ? C.skin : C.skinSh;
    const skSh = Ar.near ? C.skinSh : C.skinLn;
    if (sleeveEnd >= 0.99) {
      limb(ctx, Ar.sh[0], Ar.sh[1], Ar.elbow[0], Ar.elbow[1], armW * 1.15 * nearF, armW * 0.95 * nearF, cl, shade(cl, -0.18), f);
      limb(ctx, Ar.elbow[0], Ar.elbow[1], Ar.hand[0], Ar.hand[1], armW * 0.92 * nearF, armW * 0.72 * nearF, cl, shade(cl, -0.18), f);
    } else {
      const cut = clamp(sleeveEnd, 0.1, 1);
      const cx = lerp(Ar.sh[0], Ar.elbow[0], cut), cy = lerp(Ar.sh[1], Ar.elbow[1], cut);
      limb(ctx, Ar.sh[0], Ar.sh[1], cx, cy, armW * 1.18 * nearF, armW * 1.0 * nearF, cl, shade(cl, -0.18), f);
      limb(ctx, cx, cy, Ar.elbow[0], Ar.elbow[1], armW * 0.82 * nearF, armW * 0.74 * nearF, sk, skSh, f);
      limb(ctx, Ar.elbow[0], Ar.elbow[1], Ar.hand[0], Ar.hand[1], armW * 0.74 * nearF, armW * 0.6 * nearF, sk, skSh, f);
    }
    // hand
    fillEllipse(ctx, Ar.hand[0], Ar.hand[1], armW * 0.82 + 0.8, armW * 0.86 + 0.8, INK);
    fillEllipse(ctx, Ar.hand[0], Ar.hand[1], armW * 0.82, armW * 0.86, sk);
  };

  /* --- far side, torso, near side ------------------------------------- */
  drawArm(arms[0]);
  drawLeg(legs[0]);
  drawLeg(legs[1]);
  drawTorso(ctx, { hipX, hipY, shoX, shoY, neckY, shoW, H, f, F, C, topLen, hemY, skirtLen, build, o });
  drawArm(arms[1]);

  /* --- head ----------------------------------------------------------- */
  drawHead(ctx, headX, headY, headR, f, C, F, o, H, t, P);

  /* --- what they carry ------------------------------------------------ */
  const hand = arms[1].hand;
  if (o.prop === 'book') drawBook(ctx, hand[0] + f * H * 0.03, hand[1] - H * 0.02, H, f);
  if (o.prop === 'bag') drawBag(ctx, hipX - f * H * 0.105, hipY + H * 0.03, H, f);
  if (o.prop === 'umbrella') drawUmbrella(ctx, hand[0], hand[1], H, o);
  ctx.globalAlpha = 1;
  return { headX, headY, headR, shoX, shoY, hipY, handX: hand[0], handY: hand[1] };
}

/** The torso as a shaped silhouette: shoulders, a waist, and hips. */
function drawTorso(ctx, s) {
  const { hipX, hipY, shoX, shoY, neckY, shoW, H, f, F, C, topLen, hemY, skirtLen, build } = s;
  const prof = (k) => {                                  // k: 0 shoulders .. 1 hip
    const shoulder = shoW;
    const chest = shoW * 0.88;
    const waist = shoW * 0.68;
    const hip = shoW * 0.84;
    if (k < 0.22) return lerp(shoulder, chest, k / 0.22);
    if (k < 0.62) return lerp(chest, waist, (k - 0.22) / 0.4);
    return lerp(waist, hip, (k - 0.62) / 0.38);
  };
  const bottom = Math.max(topLen, hipY);
  const rows = Math.max(2, Math.round(bottom - shoY));
  // ink
  for (let i = 0; i <= rows; i++) {
    const k = i / rows;
    const yy = lerp(shoY, bottom, k);
    const w = prof(k) * (1 + (k > 1 ? 0 : 0));
    ctx.fillStyle = INK;
    ctx.fillRect(Math.round(lerp(shoX, hipX, k) - w - 1), Math.round(yy), Math.round(w * 2) + 2, 1);
  }
  const base = F.top, sh = F.topSh || shade(F.top, -0.18), hi = F.topHi || shade(F.top, 0.16);
  for (let i = 0; i <= rows; i++) {
    const k = i / rows;
    const yy = lerp(shoY, bottom, k);
    const w = prof(k);
    const cx = lerp(shoX, hipX, k);
    ctx.fillStyle = base;
    ctx.fillRect(Math.round(cx - w), Math.round(yy), Math.round(w * 2), 1);
    ctx.fillStyle = sh;                                   // the away side
    ctx.fillRect(Math.round(cx + f * w * 0.42), Math.round(yy), Math.round(w * 0.58) + 1, 1);
    if (k > 0.06 && k < 0.5) {                            // a little light on the chest
      ctx.fillStyle = hi;
      ctx.fillRect(Math.round(cx - f * w * 0.72), Math.round(yy), Math.max(1, Math.round(w * 0.3)), 1);
    }
  }
  // an open blazer shows the shirt down the middle
  if (F.open) {
    for (let i = 0; i <= rows * 0.8; i++) {
      const k = i / rows;
      const yy = lerp(shoY, bottom, k);
      const cx = lerp(shoX, hipX, k);
      ctx.fillStyle = '#f4f2ec';
      ctx.fillRect(Math.round(cx - prof(k) * 0.3), Math.round(yy), Math.max(2, Math.round(prof(k) * 0.6)), 1);
    }
  }
  // collar and the ribbon or tie
  const cw = shoW * 0.5;
  ctx.fillStyle = F.collar || '#f4f2ec';
  ctx.fillRect(Math.round(shoX - cw), Math.round(shoY - 1), Math.round(cw * 2), 2);
  ctx.fillStyle = INK;
  ctx.fillRect(Math.round(shoX - cw), Math.round(shoY - 2), Math.round(cw * 2), 1);
  if (F.accent) {
    ctx.fillStyle = F.accent;
    const ry = shoY + H * 0.016;
    ctx.fillRect(Math.round(shoX - cw * 0.42), Math.round(ry), Math.max(2, Math.round(cw * 0.84)), Math.max(1, Math.round(H * 0.013)));
    ctx.fillStyle = shade(F.accent, -0.2);
    ctx.fillRect(Math.round(shoX - cw * 0.14), Math.round(ry), Math.max(1, Math.round(cw * 0.3)), Math.max(2, Math.round(H * 0.04)));
  }
  // neck
  ctx.fillStyle = INK;
  ctx.fillRect(Math.round(shoX - H * 0.024), Math.round(neckY - H * 0.05), Math.round(H * 0.048), Math.round(H * 0.06));
  ctx.fillStyle = C.skin;
  ctx.fillRect(Math.round(shoX - H * 0.019), Math.round(neckY - H * 0.05), Math.round(H * 0.038), Math.round(H * 0.056));
  ctx.fillStyle = C.skinLn;
  ctx.fillRect(Math.round(shoX - H * 0.019), Math.round(neckY - H * 0.014), Math.round(H * 0.038), 1);

  // skirt: an A-line with a proper hem
  if (skirtLen > 0) {
    const top = hipY - H * 0.035;
    const n = Math.max(2, Math.round(hemY - top));
    for (let i = 0; i <= n; i++) {
      const k = i / n;
      const yy = top + (hemY - top) * k;
      const w = lerp(shoW * 0.8, shoW * 1.22, Math.pow(k, 0.8)) * build;
      const cx = hipX;
      ctx.fillStyle = INK;
      ctx.fillRect(Math.round(cx - w - 1), Math.round(yy), Math.round(w * 2) + 2, 1);
      ctx.fillStyle = F.bottom;
      ctx.fillRect(Math.round(cx - w), Math.round(yy), Math.round(w * 2), 1);
      // pleats
      for (let p = -2; p <= 2; p++) {
        if (p === 0) continue;
        ctx.fillStyle = F.bottomSh;
        ctx.fillRect(Math.round(cx + p * w * 0.42), Math.round(yy), 1, 1);
      }
      ctx.fillStyle = shade(F.bottom, 0.16);
      ctx.fillRect(Math.round(cx - f * w * 0.78), Math.round(yy), Math.max(1, Math.round(w * 0.24)), 1);
    }
    ctx.fillStyle = shade(F.bottom, -0.3);
    ctx.fillRect(Math.round(hipX - shoW * 1.22 * build), Math.round(hemY), Math.round(shoW * 2.44 * build), 1);
  }
}

/* -------------------------------------------------------------- the head */

function drawHead(ctx, hx, hy, r, f, C, F, o, H, t, P) {
  const tilt = P.headTilt * f;
  const cx = hx + tilt * r * 0.5;
  const turn = P.headTurn;

  // skull: a rounded top and a tapered jaw
  const top = hy - r * 1.02, chin = hy + r * 1.14;
  const rows = Math.max(4, Math.round(chin - top));
  const prof = (k) => {
    if (k < 0.16) return r * lerp(0.62, 0.97, k / 0.16);
    if (k < 0.58) return r * lerp(0.97, 1.0, (k - 0.16) / 0.42);
    return r * lerp(1.0, 0.36, Math.pow((k - 0.58) / 0.42, 1.5));
  };
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i <= rows; i++) {
      const k = i / rows;
      const yy = top + (chin - top) * k;
      const w = prof(k) + (pass === 0 ? 0.9 : 0);
      const ccx = cx + tilt * r * 0.3 * (1 - k);
      ctx.fillStyle = pass === 0 ? INK : C.skin;
      ctx.fillRect(Math.round(ccx - w), Math.round(yy), Math.round(w * 2), 1);
    }
  }
  // the cheek away from the light
  for (let i = 0; i <= rows; i++) {
    const k = i / rows;
    if (k < 0.2) continue;
    const yy = top + (chin - top) * k;
    const w = prof(k);
    ctx.fillStyle = C.skinSh;
    ctx.fillRect(Math.round(cx + f * w * 0.52), Math.round(yy), Math.max(1, Math.round(w * 0.48)), 1);
  }
  // ear
  fillEllipse(ctx, cx - f * r * 0.92, hy + r * 0.18, r * 0.2, r * 0.3, C.skinSh);

  hair(ctx, cx, hy, r, f, C, t, o, top);

  if (o.hideFace) return;
  drawFace(ctx, cx, hy, r, f, C, o, turn, tilt, t);
}

function drawFace(ctx, cx, hy, r, f, C, o, turn, tilt, t) {
  const face = o.face || 'calm';
  const dark = '#2b2430';
  const eyeY = hy + r * 0.2 + tilt * r * 0.4;
  const off = turn * f * r * 0.3;
  const e1 = cx - r * 0.44 + off;                 // away eye
  const e2 = cx + r * 0.44 + off;                 // near eye
  const ew = Math.max(2, r * 0.34);
  const eh = Math.max(3, r * 0.46);
  const closed = face === 'closed' || face === 'laugh' || face === 'smile2' || face === 'sleep';

  for (const [ex, near] of [[e1, false], [e2, true]]) {
    const w = ew * (near ? 1 : 0.86);
    if (closed) {
      ctx.fillStyle = dark;
      ctx.fillRect(Math.round(ex - w / 2), Math.round(eyeY + eh * 0.2), Math.round(w), 1);
      ctx.fillRect(Math.round(ex - w / 2 - 1), Math.round(eyeY + eh * 0.2 - 1), 1, 1);
      ctx.fillRect(Math.round(ex + w / 2), Math.round(eyeY + eh * 0.2 - 1), 1, 1);
    } else {
      const open = face === 'surprise' ? 1.2 : face === 'tired' ? 0.7 : 1;
      // lash line, iris, then a highlight
      ctx.fillStyle = dark;
      ctx.fillRect(Math.round(ex - w / 2), Math.round(eyeY - eh * 0.5), Math.round(w), Math.max(1, Math.round(eh * open)));
      ctx.fillStyle = C.hairHi;
      ctx.fillRect(Math.round(ex - w / 2), Math.round(eyeY - eh * 0.5), Math.round(w), 1);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(Math.round(ex - w / 2), Math.round(eyeY - eh * 0.2), 1, 1);
    }
    // brow
    const browY = eyeY - eh * (face === 'surprise' ? 1.5 : 1.15);
    const sad = face === 'sad' || face === 'cry';
    const angry = face === 'angry';
    ctx.fillStyle = C.hairSh;
    const bx = Math.round(ex - w / 2 - (near ? 0 : 0));
    const dy = sad ? (near ? 0 : -1) : angry ? (near ? -1 : 0) : 0;
    ctx.fillRect(bx, Math.round(browY + dy), Math.round(w) + 1, 1);
  }
  // nose: one pixel of shadow
  ctx.fillStyle = C.skinLn;
  ctx.fillRect(Math.round(cx + off + f * r * 0.16), Math.round(eyeY + r * 0.4), 1, 1);
  // mouth
  const my = hy + r * 0.68 + tilt * r * 0.4;
  const mx = cx + off + f * r * 0.06;
  ctx.fillStyle = '#9c5a5e';
  if (face === 'laugh') {
    ctx.fillRect(Math.round(mx - 1), Math.round(my), 3, 2);
    ctx.fillStyle = '#7a4046';
    ctx.fillRect(Math.round(mx - 1), Math.round(my), 3, 1);
  } else if (face === 'smile' || face === 'smile2') {
    ctx.fillRect(Math.round(mx - 1), Math.round(my), 2, 1);
    ctx.fillRect(Math.round(mx - 2), Math.round(my - 1), 1, 1);
    ctx.fillRect(Math.round(mx + 1), Math.round(my - 1), 1, 1);
  } else if (face === 'sad' || face === 'cry') {
    ctx.fillRect(Math.round(mx - 1), Math.round(my + 1), 2, 1);
    ctx.fillRect(Math.round(mx - 2), Math.round(my), 1, 1);
    ctx.fillRect(Math.round(mx + 1), Math.round(my), 1, 1);
  } else {
    ctx.fillRect(Math.round(mx - 1), Math.round(my), 2, 1);
  }
  if (face === 'cry') {
    ctx.fillStyle = rgba('#9fd8f0', 0.9);
    ctx.fillRect(Math.round(e2), Math.round(eyeY + r * 0.4 + ((t * 9) % (r * 1.2))), 1, 2);
  }
  if (o.blush || face === 'laugh') {
    ctx.globalAlpha *= 0.55;
    ctx.fillStyle = '#ef8a92';
    ctx.fillRect(Math.round(e1 - r * 0.2), Math.round(eyeY + r * 0.36), Math.max(2, Math.round(r * 0.34)), 1);
    ctx.fillRect(Math.round(e2 - r * 0.1), Math.round(eyeY + r * 0.36), Math.max(2, Math.round(r * 0.34)), 1);
    ctx.globalAlpha /= 0.55;
  }
}

function hair(ctx, cx, hy, r, f, C, t, o, top) {
  const H1 = C.hair, HS = C.hairSh, HI = C.hairHi;
  const style = o.hairOverride || C.style;
  const sway = Math.sin(t * 1.1) * r * 0.05;
  const blob = (bx, by, bw, bh, col) => {
    fillEllipse(ctx, bx, by, bw + 0.8, bh + 0.8, INK);
    fillEllipse(ctx, bx, by, bw, bh, col);
  };
  // the crown, sitting on the skull and stopping above the brow
  const capY = hy - r * 0.5;
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i <= Math.round(capY - top) + 4; i++) {
      const yy = top - 1 + i;
      const k = clamp((yy - (top - 1)) / Math.max(1, capY - top + 4), 0, 1);
      const w = r * lerp(0.48, 0.99, Math.pow(k, 0.66)) + (pass === 0 ? 0.9 : 0);
      ctx.fillStyle = pass === 0 ? INK : (k < 0.35 ? HI : H1);
      ctx.fillRect(Math.round(cx - w), Math.round(yy), Math.round(w * 2), 1);
    }
  }
  // a fringe that parts over one eye
  blob(cx + f * r * 0.7, hy - r * 0.44, r * 0.32, r * 0.24, H1);
  blob(cx - f * r * 0.5, hy - r * 0.46, r * 0.42, r * 0.24, H1);
  ctx.fillStyle = HS;                                     // the shadow the fringe casts
  ctx.fillRect(Math.round(cx - r * 0.86), Math.round(hy - r * 0.2), Math.round(r * 1.72), 1);
  ctx.fillStyle = HI;                                     // and the light along the crown
  ctx.fillRect(Math.round(cx - r * 0.56), Math.round(hy - r * 0.86), Math.round(r * 1.0), 1);

  if (style === 'ponytail') {
    blob(cx - f * r * 0.96 + sway, hy + r * 0.5, r * 0.3, r * 0.82, HS);
    for (let i = 0; i < 8; i++) {
      const k = i / 7;
      const px2 = cx - f * (r * 1.04 + k * r * 0.3) + sway * (1 + k * 2.2);
      const py2 = hy + r * 0.24 + k * r * 1.35;
      fillEllipse(ctx, px2, py2, r * (0.26 - k * 0.15), r * (0.3 - k * 0.12), i % 3 ? H1 : HS);
      if (i < 5) fillEllipse(ctx, px2 + f * r * 0.06, py2 - r * 0.06, r * 0.08, r * 0.1, HI);
    }
    blob(cx + f * r * 1.02, hy + r * 0.24, r * 0.13, r * 0.5, H1);   // the lock by the cheek
    blob(cx - f * r * 1.04, hy + r * 0.2, r * 0.12, r * 0.42, HS);
  } else if (style === 'short') {
    for (let i = -3; i <= 3; i++) {
      const sx = cx + i * r * 0.28;
      fillEllipse(ctx, sx, top - 0.5 + Math.abs(i) * 0.4, r * 0.2, r * (0.3 + (i % 2 ? 0.1 : 0)), i % 2 ? H1 : HS);
    }
    blob(cx + f * r * 1.0, hy - r * 0.24, r * 0.14, r * 0.3, H1);
    blob(cx - f * r * 1.02, hy - r * 0.2, r * 0.13, r * 0.26, HS);
  } else if (style === 'bob') {
    blob(cx, hy + r * 0.34, r * 1.06, r * 0.86, HS);
    blob(cx + f * r * 0.86, hy + r * 0.2, r * 0.3, r * 0.72, H1);
    blob(cx - f * r * 0.88, hy + r * 0.2, r * 0.28, r * 0.68, HS);
    ctx.fillStyle = HI;
    ctx.fillRect(Math.round(cx - r * 0.5), Math.round(hy - r * 0.64), Math.round(r), 1);
  } else if (style === 'bun') {
    blob(cx - f * r * 1.0, hy - r * 0.86, r * 0.42, r * 0.38, HS);
    blob(cx - f * r * 0.98, hy - r * 0.9, r * 0.32, r * 0.28, H1);
    blob(cx + f * r * 0.98, hy + r * 0.1, r * 0.14, r * 0.4, H1);
  }
}

/* -------------------------------------------------------------- the props */

function drawBook(ctx, x, y, H, f) {
  const w = H * 0.15, h = H * 0.1;
  ctx.fillStyle = INK;
  ctx.fillRect(Math.round(x - w / 2 - 1), Math.round(y - h / 2 - 1), Math.round(w) + 2, Math.round(h) + 2);
  ctx.fillStyle = '#f4efe0';
  ctx.fillRect(Math.round(x - w / 2), Math.round(y - h / 2), Math.round(w), Math.round(h));
  ctx.fillStyle = '#c9c1af';
  ctx.fillRect(Math.round(x), Math.round(y - h / 2), 1, Math.round(h));
  ctx.fillStyle = '#a49c8a';
  for (let i = 1; i < h - 1; i += 2) {
    ctx.fillRect(Math.round(x - w / 2 + 1), Math.round(y - h / 2 + i), Math.round(w / 2 - 2), 1);
    ctx.fillRect(Math.round(x + 2), Math.round(y - h / 2 + i), Math.round(w / 2 - 2), 1);
  }
  void f;
}

function drawBag(ctx, x, y, H) {
  const w = H * 0.16, h = H * 0.12;
  ctx.fillStyle = INK;
  ctx.fillRect(Math.round(x - w / 2 - 1), Math.round(y - 1), Math.round(w) + 2, Math.round(h) + 2);
  ctx.fillStyle = '#6d4c39';
  ctx.fillRect(Math.round(x - w / 2), Math.round(y), Math.round(w), Math.round(h));
  ctx.fillStyle = '#8b6549';
  ctx.fillRect(Math.round(x - w / 2), Math.round(y), Math.round(w), 1);
  ctx.fillStyle = '#d8c06a';
  ctx.fillRect(Math.round(x - 1), Math.round(y + h * 0.5), 2, 1);
}

function drawUmbrella(ctx, x, y, H, o) {
  const r = H * 0.32;
  const col = o.umbrella || '#5a7a9a';
  const top = y - r * 1.15;
  ctx.fillStyle = INK;
  ctx.fillRect(Math.round(x), Math.round(top), 1, Math.round(r * 1.2));
  for (let pass = 0; pass < 2; pass++) {
    for (let i = -10; i <= 10; i++) {
      const k = i / 10;
      const ccx = x + k * r;
      const ccy = top + (1 - Math.cos(k * 1.35)) * r * 0.62;
      const rr = r * 0.13;
      if (pass === 0) fillEllipse(ctx, ccx, ccy, rr + 1, rr + 1, INK);
      else fillEllipse(ctx, ccx, ccy, rr, rr, Math.abs(i) % 4 < 2 ? col : shade(col, 0.18));
    }
  }
  ctx.fillStyle = INK;
  ctx.fillRect(Math.round(x), Math.round(top - 2), 1, 3);
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
    this.speed = 30;
    this.prop = null;
    this.age = 0;
    this.visible = true;
    this.alpha = 1;
    this.onArrive = null;
  }
  walkTo(wx, opts = {}) {
    this.target = wx;
    this.speed = opts.speed || 30;
    this.onArrive = opts.then || null;
  }
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
        if (this.queued) { const q = this.queued; this.queued = null; this.applyPose(q); }
        const cb = this.onArrive; this.onArrive = null;
        if (cb) cb();
      } else {
        const v = Math.sign(d) * this.speed;
        this.x += v * dt;
        this.flip = v < 0;
        this.pose = this.speed > 42 ? 'run' : 'walk';
        this.phase += dt * (this.speed > 42 ? 10 : 5.6);
      }
    }
  }
  draw(ctx, cam, extra = {}) {
    if (!this.visible) return null;
    const lift = this.pose === 'sit_log' ? 7 : 0;
    return drawHuman(ctx, this.x - cam, this.y - lift, {
      char: this.char, outfit: this.outfit, pose: this.pose, face: this.face,
      flip: this.flip, t: this.t, phase: this.phase, prop: this.prop,
      age: this.age, alpha: this.alpha, ...extra,
    });
  }
}
