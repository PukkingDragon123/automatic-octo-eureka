/* ============================================================================
 *  vista.js — the valley town, rebuilt from the reference photograph.
 *
 *  A single deterministic "town model" is generated once (buildings, temples,
 *  tree clumps, rice terraces, ridgelines).  Every era then re-renders THAT
 *  SAME TOWN with a different palette and different foliage, so the player is
 *  always looking at one place changing through time.
 * ==========================================================================*/

import {
  rng, noise1d, clamp, lerp, mix, shade, rgba, makeCanvas,
  rect, hline, vline, line, px, fillEllipse, fillCircle, fillPoly,
  ditherGradient, BAYER8,
} from './core.js';

export const W = 480;
export const H = 300;

/* Horizon bands (buffer pixels) */
export const SKY_BOT = 74;
export const TOWN_TOP = 140;
export const TOWN_BOT = 214;
export const FIELD_TOP = 208;
export const FIELD_BOT = 250;
export const GROUND_Y = 246; // where the near hilltop starts

/* ------------------------------------------------------------------ eras --*/

export const ERAS = [
  {
    key: 'morning',
    valleyBase: '#93a878', cloudTint: 0.12,
    sky: [[0, '#4d8ac6'], [0.35, '#79b0da'], [0.62, '#a8cfe6'], [0.85, '#cfe3ee'], [1, '#e6eff1']],
    sun: { x: 404, y: 34, r: 9, c: '#fff8dd', glow: '#ffeec0' },
    hazeCol: '#dfeaf0', hazeFar: 0.56, hazeNear: 0.26,
    mtnFar: '#7d99b8', mtnMid: '#5b8192', mtnNear: '#41705a',
    hill: '#33613c', hillDark: '#234a2e', hillHi: '#4d8046',
    forest: '#356b3a', forestDark: '#24492a', forestHi: '#5e9448',
    canopy: 'leaf',
    field: '#d3c78d', fieldAlt: '#93a85c', fieldLine: '#6e6a44', fieldWater: '#bed4da',
    grass: '#5e8f3c', grassDark: '#41682c', grassHi: '#86b455', grassSeed: '#d8e07a',
    roofs: ['#b4573f', '#9c4a36', '#7d5a4a', '#6e808c', '#4d5f6b', '#a96a45'],
    walls: ['#e9e4d6', '#dcd7c8', '#cfd6d8', '#e4dfd0', '#c8c2b2'],
    gold: '#e5b636', goldHi: '#ffe89e', goldSh: '#9c7020',
    windowLit: null, smoke: '#e8eef2', smokeAmt: 0.5,
    petal: null, butterflies: 0.15,
    grade: null, gradeAmt: 0,
  },
  {
    key: 'flourish',
    valleyBase: '#7fab5f', cloudTint: 0.1,
    sky: [[0, '#3f82c8'], [0.34, '#6aaadd'], [0.6, '#9bcbe8'], [0.85, '#c9e6ee'], [1, '#e1f2ee']],
    sun: { x: 398, y: 30, r: 11, c: '#fffbe8', glow: '#fff2c6' },
    hazeCol: '#e3f1ee', hazeFar: 0.48, hazeNear: 0.18,
    mtnFar: '#6f95b6', mtnMid: '#4f7c80', mtnNear: '#337048',
    hill: '#286636', hillDark: '#174a26', hillHi: '#469443',
    forest: '#2b7237', forestDark: '#1b4c26', forestHi: '#63a845',
    canopy: 'leaf',
    field: '#8fbc55', fieldAlt: '#6fa844', fieldLine: '#4f7d33', fieldWater: '#9fd0cc',
    grass: '#54963a', grassDark: '#376e2a', grassHi: '#8ac457', grassSeed: '#e8f08a',
    roofs: ['#bc5b40', '#a04c36', '#82604e', '#6e8490', '#50646f', '#b2704a'],
    walls: ['#f0ece0', '#e2ddce', '#d4dcdd', '#eae5d6', '#cdc8b8'],
    gold: '#eec13c', goldHi: '#fff0ac', goldSh: '#a5761f',
    windowLit: null, smoke: '#eef6f6', smokeAmt: 0.35,
    petal: null, butterflies: 0.5,
    grade: '#a8ff9e', gradeAmt: 0.05,
  },
  {
    key: 'wither',
    valleyBase: '#b0a078', cloudTint: 0.38,
    sky: [[0, '#93a7b2'], [0.35, '#b0bcbd'], [0.62, '#cbc9b9'], [0.85, '#dcd2ba'], [1, '#e6dcc2']],
    sun: { x: 392, y: 44, r: 12, c: '#f4e7c4', glow: '#e8d6a8' },
    hazeCol: '#ded3ba', hazeFar: 0.68, hazeNear: 0.36,
    mtnFar: '#8e9190', mtnMid: '#7b7a6c', mtnNear: '#6a6344',
    hill: '#6b6340', hillDark: '#4e4830', hillHi: '#877a4c',
    forest: '#6d6240', forestDark: '#4a4229', forestHi: '#8c7c4e',
    canopy: 'bare',
    field: '#b2a077', fieldAlt: '#9c8a63', fieldLine: '#7d6f4e', fieldWater: '#b9b298',
    grass: '#8f8a56', grassDark: '#6b6640', grassHi: '#a9a069', grassSeed: '#c8bd72',
    roofs: ['#9c5442', '#87473a', '#6f594c', '#6b7178', '#4f565c', '#93654a'],
    walls: ['#d8d2c2', '#cbc4b4', '#c2c4c0', '#d2ccbc', '#b8b2a2'],
    gold: '#c9a64a', goldHi: '#eed99a', goldSh: '#8a6c2c',
    windowLit: null, smoke: '#d8cdb4', smokeAmt: 1.0,
    petal: 'leaf', butterflies: 0,
    grade: '#d8c79a', gradeAmt: 0.16,
  },
  {
    key: 'cherry',
    valleyBase: '#9cb87a', cloudTint: 0.2,
    sky: [[0, '#5e97d2'], [0.32, '#8fbde4'], [0.58, '#bcd8ea'], [0.8, '#e2d8e6'], [1, '#f2dfe6']],
    sun: { x: 400, y: 36, r: 10, c: '#fff6ea', glow: '#ffdfe8' },
    hazeCol: '#f2e2e8', hazeFar: 0.56, hazeNear: 0.26,
    mtnFar: '#8299bb', mtnMid: '#6e819c', mtnNear: '#5c7c70',
    hill: '#5a7a58', hillDark: '#415f44', hillHi: '#77996a',
    forest: '#e68fb4', forestDark: '#c46d95', forestHi: '#ffc2da',
    canopy: 'blossom',
    field: '#a8c273', fieldAlt: '#87ab5c', fieldLine: '#6a8a48', fieldWater: '#c2d8dc',
    grass: '#6e9c48', grassDark: '#4e7634', grassHi: '#95c45f', grassSeed: '#ffd0e2',
    roofs: ['#b4573f', '#9c4a36', '#7d5a4a', '#6e808c', '#4d5f6b', '#a96a45'],
    walls: ['#f4ece8', '#e6ded8', '#d8dce0', '#ece4dc', '#d0c8c0'],
    gold: '#e8bb44', goldHi: '#ffeeae', goldSh: '#a2761f',
    windowLit: null, smoke: '#f4e8ee', smokeAmt: 0.4,
    petal: 'sakura', butterflies: 0.4,
    grade: '#ffd6e8', gradeAmt: 0.1,
  },
  {
    key: 'pea',
    valleyBase: '#6d76a8', cloudTint: 0.22,
    sky: [[0, '#4a6fd0'], [0.3, '#7d93e0'], [0.55, '#aab6ea'], [0.78, '#dcd0ee'], [1, '#f0dcd4']],
    sun: { x: 396, y: 40, r: 12, c: '#fff2d2', glow: '#ffd9b4' },
    hazeCol: '#e4ddf2', hazeFar: 0.54, hazeNear: 0.22,
    mtnFar: '#7a84ba', mtnMid: '#5e6fa0', mtnNear: '#456e78',
    hill: '#3f6e63', hillDark: '#2c5049', hillHi: '#5f9078',
    forest: '#39705a', forestDark: '#264c3c', forestHi: '#5f9c72',
    canopy: 'pea',
    field: '#5b4fc0', fieldAlt: '#7a68dc', fieldLine: '#3f3592', fieldWater: '#9aa8e4',
    grass: '#4f8a52', grassDark: '#376a3c', grassHi: '#78b06a', grassSeed: '#8f7ce8',
    roofs: ['#a85a48', '#8f4a3c', '#745a52', '#64788c', '#465a6c', '#9c6a50'],
    walls: ['#eae2ec', '#dcd4e0', '#cdd2e0', '#e2dae4', '#c4bcc8'],
    gold: '#eec04a', goldHi: '#fff0b4', goldSh: '#a2781f',
    windowLit: null, smoke: '#e8e2f2', smokeAmt: 0.3,
    petal: 'pea', butterflies: 1.0,
    grade: '#b4a8ff', gradeAmt: 0.1,
  },
  {
    key: 'dusk',
    valleyBase: '#2b3054', cloudTint: 0.5, cloudBase: '#7a6a92', stars: 1,
    sky: [[0, '#1b2352'], [0.26, '#3a3a76'], [0.48, '#6e4b86'], [0.68, '#c06a78'], [0.85, '#f0a06a'], [1, '#ffcf92']],
    sun: { x: 402, y: 68, r: 14, c: '#ffe6b4', glow: '#ff9e5e' },
    hazeCol: '#e8a878', hazeFar: 0.62, hazeNear: 0.22,
    mtnFar: '#6a6a9c', mtnMid: '#4f4f7e', mtnNear: '#39405e',
    hill: '#2a3a4a', hillDark: '#1c2a38', hillHi: '#3e5462',
    forest: '#25384a', forestDark: '#182634', forestHi: '#3a5466',
    canopy: 'pea',
    field: '#3f3a86', fieldAlt: '#544ea4', fieldLine: '#2a2560', fieldWater: '#7a86c8',
    grass: '#2f5a44', grassDark: '#20422f', grassHi: '#487a56', grassSeed: '#8f7ce8',
    roofs: ['#6e4038', '#5e3630', '#4e3e3a', '#3e4c5c', '#2e3a48', '#64483a'],
    walls: ['#9a92a4', '#8a8294', '#7e8494', '#928a9c', '#7a7484'],
    gold: '#d8a83c', goldHi: '#ffdc92', goldSh: '#8a6420',
    windowLit: '#ffcf7a', smoke: '#7a6a8a', smokeAmt: 0.4,
    petal: 'pea', butterflies: 0.3,
    grade: '#4a4a9a', gradeAmt: 0.2,
  },
];

/* ------------------------------------------------------------ town model --*/

let MODEL = null;

export function buildModel(seed = 20240917) {
  const r = rng(seed);

  /* --- ridgelines: fractal-ish silhouettes for four depth layers --------- */
  const ridge = (baseY, amp, seedOff, peaks) => {
    const n = noise1d(seed + seedOff, W, 4, 0.55);
    const ys = new Float32Array(W);
    for (let x = 0; x < W; x++) {
      let y = baseY + n[x] * amp;
      for (const p of peaks) {
        const d = Math.abs(x - p.x) / p.w;
        if (d < 1) y -= p.h * Math.pow(Math.cos((d * Math.PI) / 2), p.k || 1.6);
      }
      ys[x] = y;
    }
    return ys;
  };

  const far = ridge(110, 6, 11, [
    { x: 34, w: 80, h: 30, k: 1.15 }, { x: 150, w: 62, h: 20 },
    { x: 296, w: 96, h: 40, k: 1.1 }, { x: 436, w: 74, h: 28 },
  ]);
  const mid = ridge(130, 7, 37, [
    { x: 86, w: 86, h: 34, k: 1.25 }, { x: 236, w: 70, h: 22 },
    { x: 350, w: 104, h: 46, k: 1.15 }, { x: 468, w: 64, h: 26 },
  ]);
  const near = ridge(154, 6, 71, [
    { x: 16, w: 108, h: 38, k: 1.35 }, { x: 198, w: 82, h: 16 },
    { x: 330, w: 70, h: 20, k: 1.2 }, { x: 424, w: 126, h: 40 },
  ]);
  // The forested spur the golden temple sits on (photo: left of frame).
  const spur = new Float32Array(W);
  const spurHump = new Float32Array(W);
  {
    const sn = noise1d(seed + 5, W, 4, 0.5);
    for (let x = 0; x < W; x++) {
      const d = (x - 92) / 104;
      const hump = Math.exp(-d * d * 1.5) * 84;
      const d2 = (x - 478) / 84;
      const hump2 = Math.exp(-d2 * d2 * 1.5) * 54;
      const d3 = (x - 212) / 52;
      const hump3 = Math.exp(-d3 * d3 * 2.4) * 24;
      spurHump[x] = hump + hump2 + hump3;
      spur[x] = 198 - spurHump[x] + sn[x] * 4;
    }
  }

  const valleyTop = new Float32Array(W);
  {
    const n = noise1d(seed + 909, W, 5, 0.55);
    for (let x = 0; x < W; x++) valleyTop[x] = TOWN_TOP - 11 + n[x] * 5;
  }

  /* --- the town: dense ranks of buildings packed into the valley --------- */
  const buildings = [];
  const trees = [];
  const roadPts = [
    [222, TOWN_BOT + 4], [232, 202], [243, 186], [251, 172], [256, 160], [259, 148],
  ];
  const roadAt = (y) => {
    for (let i = 0; i < roadPts.length - 1; i++) {
      const a = roadPts[i], b = roadPts[i + 1];
      if (y <= a[1] && y >= b[1]) {
        const t = (a[1] - y) / (a[1] - b[1]);
        return lerp(a[0], b[0], t);
      }
    }
    return y > roadPts[0][1] ? roadPts[0][0] : roadPts[roadPts.length - 1][0];
  };

  let ry = TOWN_TOP - 13;
  while (ry < TOWN_BOT + 8) {
    const depth = clamp((ry - TOWN_TOP) / (TOWN_BOT - TOWN_TOP), 0, 1);
    const sc = lerp(0.5, 1.55, depth);
    let x = r.f(-14, -4);
    while (x < W + 12) {
      const yy = ry + r.f(-1.6, 1.6);
      const xi = clamp(Math.round(x), 0, W - 1);
      const onSpur = spurHump[xi] > 21 && yy < spur[xi] + 4;
      const inRoad = Math.abs(x - roadAt(yy)) < 2.4 * sc;
      if (onSpur || inRoad) { x += r.f(3, 8) * sc; continue; }
      if (r.chance(0.17)) {
        // a mango or rain tree standing between the houses
        trees.push({
          x: Math.round(x + r.f(0, 5)), y: Math.round(yy + r.f(0, 2)),
          r: lerp(1.8, 5.6, depth) * r.f(0.75, 1.35),
          kind: r.chance(0.16) ? 'palm' : 'round', depth, seed: r.i(0, 9999),
        });
        x += r.f(5, 13) * sc;
        continue;
      }
      const tall = r.chance(depth > 0.45 ? 0.16 : 0.07);
      const w = Math.max(3, Math.round(r.f(5, 12) * sc));
      const h = Math.max(3, Math.round((tall ? r.f(10, 19) : r.f(3.5, 8)) * sc));
      buildings.push({
        x: Math.round(x), y: Math.round(yy), w, h, depth, tall,
        roof: r.i(0, 5), wall: r.i(0, 4),
        gable: r.chance(0.6), flat: tall && r.chance(0.62),
        winCols: Math.max(1, Math.floor(w / 3)),
        winRows: Math.max(1, Math.floor(h / 3)),
        lit: r.f(),
      });
      x += w + r.f(0.4, 2.6) * sc;
    }
    ry += lerp(3.0, 6.4, depth);
  }
  buildings.sort((a, b) => a.y - b.y);

  // forest covering the temple spur + right hillside
  const spurTrees = [];
  for (let i = 0; i < 5200; i++) {
    const x = Math.round(r.f(-8, W + 8));
    const xi = clamp(x, 0, W - 1);
    const top = Math.min(spur[xi], valleyTop[xi] + 2);
    if (spurHump[xi] < 9) continue;
    const y = Math.round(r.f(top - 2.5, Math.min(TOWN_BOT + 6, top + 84)));
    const dep = clamp((y - top) / 66, 0, 1);
    spurTrees.push({ x, y, r: lerp(1.5, 4.4, dep) * r.f(0.7, 1.4), s: r.f(), seed: r.i(0, 9999), dep });
  }
  spurTrees.sort((a, b) => a.y - b.y);

  /* --- rice terraces: contoured paddies sweeping in from the right ------- */
  const terraces = [];
  {
    let y = FIELD_TOP;
    while (y < FIELD_BOT + 4) {
      const t = clamp((y - FIELD_TOP) / (FIELD_BOT - FIELD_TOP), 0, 1);
      const hgt = lerp(2.8, 7.5, t) * r.f(0.85, 1.25);
      const xL = lerp(186, 96, Math.pow(t, 0.8)) + r.f(-8, 8);
      const tilt = lerp(-7, -17, t);
      const cells = [];
      let cx = xL;
      while (cx < W + 26) {
        const cw = r.f(11, 34) * lerp(0.8, 1.5, t);
        cells.push({ x: cx, w: cw, kind: r.f(), wet: r.f() });
        cx += cw;
      }
      terraces.push({ y, h: hgt, xL, tilt, cells });
      y += hgt + 0.7;
    }
  }

  /* --- foreground framing foliage (left tree mass, right bushes) --------- */
  const fgLeft = [];
  for (let i = 0; i < 13; i++) {
    const x = r.f(-24, 82);
    const spread = 1 - clamp(x / 92, 0, 1);
    const y = r.f(204 + (1 - spread) * 54, 282);
    const scale = lerp(0.75, 1.5, (y - 204) / 78) * r.f(0.8, 1.25);
    const crown = [];
    const n = r.i(9, 16);
    for (let k = 0; k < n; k++) {
      const a = r.f(0, 6.28), d = Math.sqrt(r.f());
      crown.push({
        dx: Math.cos(a) * 17 * d * scale,
        dy: Math.sin(a) * 11 * d * scale - 8 * scale,
        r: r.f(5, 11) * scale, tone: r.f(),
      });
    }
    fgLeft.push({ x, y, scale, crown, trunk: r.f(9, 20) * scale, lean: r.f(-0.3, 0.3), seed: r.i(0, 9999) });
  }
  fgLeft.sort((a, b) => a.y - b.y);
  const fgRight = [];
  for (let i = 0; i < 5; i++) {
    const x = r.f(426, W + 24);
    const y = r.f(232, 276);
    const scale = lerp(0.7, 1.3, (y - 232) / 44) * r.f(0.85, 1.2);
    const crown = [];
    const n = r.i(7, 12);
    for (let k = 0; k < n; k++) {
      const a = r.f(0, 6.28), d = Math.sqrt(r.f());
      crown.push({
        dx: Math.cos(a) * 14 * d * scale,
        dy: Math.sin(a) * 9 * d * scale - 6 * scale,
        r: r.f(4, 9) * scale, tone: r.f(),
      });
    }
    fgRight.push({ x, y, scale, crown, trunk: r.f(6, 13) * scale, lean: r.f(-0.3, 0.3), seed: r.i(0, 9999) });
  }
  fgRight.sort((a, b) => a.y - b.y);

  MODEL = {
    seed, far, mid, near, spur, spurHump, valleyTop, buildings, trees, spurTrees, terraces,
    fgLeft, fgRight, roadAt, roadPts,
    clouds: buildClouds(seed),
    birdsSeed: seed + 991,
  };
  return MODEL;
}

function buildClouds(seed) {
  const r = rng(seed + 313);
  const list = [];
  for (let i = 0; i < 26; i++) {
    const puffs = [];
    const n = r.i(3, 7);
    const bw = r.f(18, 52);
    for (let p = 0; p < n; p++) {
      puffs.push({
        dx: r.f(-bw / 2, bw / 2),
        dy: r.f(-3, 3),
        r: r.f(3, 9) * r.f(0.8, 1.3),
      });
    }
    list.push({
      x: r.f(0, 960), y: r.f(6, 62), puffs,
      flat: r.chance(0.35), a: r.f(0.5, 1), speed: r.f(0.35, 1),
    });
  }
  return list;
}

export function getModel() {
  return MODEL || buildModel();
}

/* ------------------------------------------------------------- rendering --*/

/** A stupa / chedi — the golden landmark of the town. */
export function drawChedi(ctx, cx, baseY, height, width, P, lit = 1) {
  const gold = lit >= 1 ? P.gold : mix(P.gold, P.hazeCol, 1 - lit);
  const hi = P.goldHi, sh = P.goldSh;
  const w = width;
  // square terraced base
  let y = baseY;
  let bw = w;
  for (let i = 0; i < 3; i++) {
    const bh = Math.max(1, Math.round(height * 0.08));
    rect(ctx, cx - bw / 2, y - bh, bw, bh, gold);
    rect(ctx, cx - bw / 2, y - bh, Math.max(1, bw * 0.34), bh, hi);
    rect(ctx, cx + bw / 2 - Math.max(1, bw * 0.2), y - bh, Math.max(1, bw * 0.2), bh, sh);
    y -= bh;
    bw *= 0.82;
  }
  // bell
  const bellH = Math.round(height * 0.3);
  for (let i = 0; i < bellH; i++) {
    const t = i / bellH;
    const ww = bw * (1 - Math.pow(t, 1.7) * 0.42);
    rect(ctx, cx - ww / 2, y - i - 1, ww, 1, gold);
    rect(ctx, cx - ww / 2, y - i - 1, Math.max(1, ww * 0.28), 1, hi);
    rect(ctx, cx + ww / 2 - Math.max(1, ww * 0.18), y - i - 1, Math.max(1, ww * 0.18), 1, sh);
  }
  y -= bellH;
  // spire rings tapering to a point
  const spH = Math.round(height * 0.36);
  for (let i = 0; i < spH; i++) {
    const t = i / spH;
    const ww = Math.max(1, bw * 0.5 * (1 - t) + (i % 3 === 0 ? 1.4 : 0));
    rect(ctx, cx - ww / 2, y - i - 1, Math.max(1, ww), 1, i % 3 === 0 ? hi : gold);
  }
  y -= spH;
  rect(ctx, cx - 0.5, y - 2, 1, 2, hi);
}

/** A viharn / temple hall with tiered roofs and gold finials. */
export function drawViharn(ctx, x, baseY, w, h, P, r) {
  const wall = '#f0ece2';
  const roof = P.roofs[0];
  const roofDk = shade(roof, -0.28);
  rect(ctx, x, baseY - h, w, h, wall);
  rect(ctx, x, baseY - h, 1, h, shade(wall, -0.16));
  rect(ctx, x + w - 1, baseY - h, 1, h, shade(wall, -0.24));
  // doors
  for (let i = 0; i < Math.max(1, Math.floor(w / 5)); i++) {
    rect(ctx, x + 2 + i * 5, baseY - Math.min(h - 1, 3), 2, 3, P.goldSh);
  }
  // tiered roof
  let ry = baseY - h;
  let rw = w + 3;
  const tiers = 3;
  for (let t = 0; t < tiers; t++) {
    const th = Math.max(2, Math.round(h * 0.42) - t);
    const cx = x + w / 2;
    fillPoly(ctx, [
      [cx - rw / 2, ry], [cx + rw / 2, ry], [cx + rw / 2 - rw * 0.3, ry - th], [cx - rw / 2 + rw * 0.3, ry - th],
    ], roof);
    hline(ctx, cx - rw / 2, cx + rw / 2, ry, roofDk);
    hline(ctx, cx - rw / 2 + rw * 0.3, cx + rw / 2 - rw * 0.3, ry - th, P.gold);
    // chofa finials
    px(ctx, cx - rw / 2 + rw * 0.3 - 1, ry - th - 1, P.gold);
    px(ctx, cx + rw / 2 - rw * 0.3, ry - th - 1, P.gold);
    ry -= th;
    rw *= 0.72;
  }
}

function drawBuilding(ctx, b, P, era) {
  const wall = P.walls[b.wall];
  const roof = P.roofs[b.roof];
  const x = b.x, y = b.y, w = b.w, h = b.h;
  const top = y - h;
  // body
  rect(ctx, x, top, w, h, wall);
  // sun side / shade side
  rect(ctx, x, top, 1, h, shade(wall, 0.14));
  rect(ctx, x + w - 1, top, 1, h, shade(wall, -0.2));
  // roof
  if (b.flat) {
    rect(ctx, x - 1, top - 1, w + 2, 2, shade(roof, -0.1));
    rect(ctx, x - 1, top - 1, w + 2, 1, shade(roof, 0.18));
  } else if (b.gable) {
    const rh = Math.max(2, Math.round(w * 0.36));
    fillPoly(ctx, [[x - 1.5, top + 1], [x + w / 2, top - rh], [x + w + 1.5, top + 1]], roof);
    line(ctx, x - 1, top + 1, x + w / 2, top - rh, shade(roof, 0.24));
    hline(ctx, x - 1.5, x + w + 1.5, top + 1, shade(roof, -0.3));
  } else {
    const rh = Math.max(1, Math.round(w * 0.22));
    fillPoly(ctx, [[x - 1, top + 1], [x + 1.5, top - rh], [x + w - 1.5, top - rh], [x + w + 1, top + 1]], roof);
    hline(ctx, x + 1.5, x + w - 1.5, top - rh, shade(roof, 0.22));
    hline(ctx, x - 1, x + w + 1, top + 1, shade(roof, -0.3));
  }
  // windows
  if (w >= 5 && h >= 5) {
    const lit = P.windowLit;
    for (let cx = 0; cx < b.winCols; cx++) {
      for (let cy = 0; cy < b.winRows; cy++) {
        const wx = x + 1 + cx * 3;
        const wy = top + 2 + cy * 3;
        if (wx >= x + w - 1 || wy >= y - 1) continue;
        const on = lit && ((b.lit * 977 + cx * 31 + cy * 17) % 1 > 0.45 || (cx + cy) % 3 === 0);
        ctx.fillStyle = on ? lit : shade(wall, -0.42);
        ctx.fillRect(wx, wy, 1, 1);
      }
    }
  } else if (P.windowLit && b.lit > 0.4) {
    px(ctx, x + (w >> 1), y - 2, P.windowLit);
  }
  // ground shadow
  ctx.fillStyle = rgba('#20303a', 0.22);
  ctx.fillRect(x + 1, y, w, 1);
}

function drawRoundTree(ctx, t, P, era, r) {
  const { canopy } = P;
  const x = t.x, y = t.y, rad = t.r;
  const trunk = era === 2 ? '#6a5a3c' : '#4a3a2a';
  if (canopy === 'bare') {
    // dead tree: bare branching silhouette
    vline(ctx, x, y - rad * 1.7, y, trunk);
    const rr = rng(t.seed);
    for (let i = 0; i < 4; i++) {
      const a = -Math.PI / 2 + rr.f(-1.1, 1.1);
      const len = rad * rr.f(0.8, 1.5);
      const bx = x, by = y - rad * rr.f(0.7, 1.6);
      line(ctx, bx, by, bx + Math.cos(a) * len, by + Math.sin(a) * len, trunk);
    }
    return;
  }
  let c = P.forest, ch = P.forestHi, cd = P.forestDark;
  if (canopy === 'blossom') { c = P.forest; ch = P.forestHi; cd = P.forestDark; }
  vline(ctx, x, y - rad, y, trunk);
  fillEllipse(ctx, x, y - rad * 1.15, rad, rad * 0.92, c);
  fillEllipse(ctx, x - rad * 0.35, y - rad * 1.5, rad * 0.6, rad * 0.5, ch);
  fillEllipse(ctx, x + rad * 0.45, y - rad * 0.85, rad * 0.5, rad * 0.4, cd);
  if (canopy === 'pea' && rad > 2.5) {
    const rr = rng(t.seed + 3);
    for (let i = 0; i < 3; i++) {
      px(ctx, x + rr.f(-rad, rad), y - rad * 1.3 + rr.f(-rad * 0.6, rad * 0.6), '#6f5ae0');
    }
  }
}

function drawPalm(ctx, t, P, era) {
  const trunk = era === 2 ? '#7a6a48' : '#5a4632';
  const frond = P.canopy === 'bare' ? '#8a7a4e' : P.canopy === 'blossom' ? '#4f7a48' : P.forestHi;
  const h = t.r * 2.6;
  for (let i = 0; i < h; i++) px(ctx, t.x + Math.sin(i * 0.2) * 0.8, t.y - i, trunk);
  const top = t.y - h;
  for (let a = 0; a < 6; a++) {
    const ang = (a / 6) * Math.PI * 2;
    const len = t.r * 1.5;
    line(ctx, t.x, top, t.x + Math.cos(ang) * len, top + Math.sin(ang) * len * 0.55 + 1, frond);
  }
}

/** Subdivide gradient stops so each dithered seam stays short and subtle. */
function refineStops(stops, times = 3) {
  let out = stops;
  for (let k = 0; k < times; k++) {
    const next = [];
    for (let i = 0; i < out.length - 1; i++) {
      next.push(out[i]);
      next.push([(out[i][0] + out[i + 1][0]) / 2, mix(out[i][1], out[i + 1][1], 0.5)]);
    }
    next.push(out[out.length - 1]);
    out = next;
  }
  return out;
}

/* ---- aerial perspective: a quantised colour ramp with dithered seams ---- */
function slab(ctx, x, yTop, yBot, base, hazeCol, h0, h1, levels = 9) {
  if (yBot <= yTop) return;
  const ramp = [];
  for (let i = 0; i < levels; i++) {
    ramp.push(mix(base, hazeCol, lerp(h0, h1, levels === 1 ? 0 : i / (levels - 1))));
  }
  const span = yBot - yTop;
  for (let i = 0; i < levels; i++) {
    const a = Math.round(yTop + (i / levels) * span);
    const b = Math.round(yTop + ((i + 1) / levels) * span);
    if (b <= a) continue;
    ctx.fillStyle = ramp[i];
    ctx.fillRect(x, a, 1, b - a);
    // soften the step with two dithered rows
    if (i < levels - 1) {
      ctx.fillStyle = ramp[i + 1];
      for (let k = 0; k < 2; k++) {
        const yy = b - 2 + k;
        if (yy < a) continue;
        const th = (BAYER8[yy & 7][x & 7] + 0.5) / 64;
        if ((k + 1) / 3 > th) ctx.fillRect(x, yy, 1, 1);
      }
    }
  }
}

function drawSkyStuff(ctx, M, P, r) {
  const s = P.sun;
  // stars, for the evening the tree flowers under
  if (P.stars) {
    for (let i = 0; i < 260; i++) {
      const x = r.i(0, W - 1);
      const y = r.f(0, 120);
      const fade = clamp(1 - y / 110, 0, 1);
      if (r.f() > fade * 0.95) continue;
      const b = r.f();
      ctx.globalAlpha = fade * (0.35 + b * 0.65);
      ctx.fillStyle = b > 0.8 ? '#ffffff' : b > 0.5 ? '#d8dcff' : '#a8b0e8';
      ctx.fillRect(x, Math.round(y), 1, 1);
      if (b > 0.95) {
        ctx.globalAlpha = fade * 0.35;
        ctx.fillRect(x - 1, Math.round(y), 1, 1);
        ctx.fillRect(x + 1, Math.round(y), 1, 1);
        ctx.fillRect(x, Math.round(y) - 1, 1, 1);
        ctx.fillRect(x, Math.round(y) + 1, 1, 1);
      }
      ctx.globalAlpha = 1;
    }
  }
  // bloom around the sun
  for (let i = 7; i >= 1; i--) {
    ctx.globalAlpha = 0.055;
    fillCircle(ctx, s.x, s.y, s.r + i * 9, s.glow);
  }
  ctx.globalAlpha = 1;
  fillCircle(ctx, s.x, s.y, s.r + 1, mix(s.c, s.glow, 0.5));
  fillCircle(ctx, s.x, s.y, s.r, s.c);

  // high cirrus streaks
  for (let i = 0; i < 14; i++) {
    const y = r.f(6, 46);
    const x = r.f(-20, W);
    const len = r.f(30, 130);
    ctx.globalAlpha = r.f(0.1, 0.26);
    ctx.fillStyle = mix('#ffffff', P.hazeCol, 0.2);
    for (let k = 0; k < len; k++) {
      const yy = y + Math.sin(k * 0.05 + i) * 1.6;
      ctx.fillRect(Math.round(x + k), Math.round(yy), 1, 1);
      if (r.chance(0.3)) ctx.fillRect(Math.round(x + k), Math.round(yy) + 1, 1, 1);
    }
    ctx.globalAlpha = 1;
  }

  // cumulus
  const base = mix(P.cloudBase || '#ffffff', P.hazeCol, P.cloudTint === undefined ? 0.12 : P.cloudTint);
  const lit = mix(base, P.sun.glow, P.stars ? 0.5 : 0.25);
  const under = mix(base, P.sky[1][1], 0.6);
  const under2 = mix(base, P.sky[0][1], 0.55);
  for (const cl of M.clouds) {
    const cxRaw = ((cl.x % 960) + 960) % 960;
    for (const dx of [0, -960]) {
      const X = cxRaw + dx;
      if (X < -80 || X > W + 80) continue;
      ctx.globalAlpha = cl.a;
      // shadowed base first, then the sunlit crown on top
      for (const p of cl.puffs) {
        fillEllipse(ctx, X + p.dx, cl.y + p.dy + p.r * 0.35, p.r * 1.02, p.r * (cl.flat ? 0.4 : 0.6), under2);
      }
      for (const p of cl.puffs) {
        fillEllipse(ctx, X + p.dx, cl.y + p.dy + p.r * 0.15, p.r * 0.98, p.r * (cl.flat ? 0.42 : 0.66), under);
      }
      for (const p of cl.puffs) {
        fillEllipse(ctx, X + p.dx, cl.y + p.dy - p.r * 0.14, p.r * 0.9, p.r * (cl.flat ? 0.34 : 0.56), base);
      }
      for (const p of cl.puffs) {
        fillEllipse(ctx, X + p.dx - p.r * 0.2, cl.y + p.dy - p.r * 0.4, p.r * 0.56, p.r * 0.3, lit);
      }
      // flat bottom
      ctx.fillStyle = under2;
      let minX = Infinity, maxX = -Infinity, baseY = -Infinity;
      for (const p of cl.puffs) {
        minX = Math.min(minX, X + p.dx - p.r * 0.8);
        maxX = Math.max(maxX, X + p.dx + p.r * 0.8);
        baseY = Math.max(baseY, cl.y + p.dy + p.r * (cl.flat ? 0.4 : 0.55));
      }
      ctx.fillRect(Math.round(minX), Math.round(baseY), Math.round(maxX - minX), 1);
      ctx.globalAlpha = 1;
    }
  }
}

/** Full vista for one era, baked into a canvas. */
export function renderVista(eraIndex) {
  const P = ERAS[eraIndex];
  const M = getModel();
  const { canvas, ctx } = makeCanvas(W, H);
  const r = rng(M.seed + eraIndex * 101);

  /* sky ------------------------------------------------------------------ */
  ditherGradient(ctx, 0, 0, W, TOWN_TOP + 30, refineStops(P.sky, 4));
  drawSkyStuff(ctx, M, P, r);

  /* mountain ranges, each further one paler ------------------------------ */
  const ranges = [
    { ys: M.far, c: P.mtnFar, h0: P.hazeFar * 0.62, h1: P.hazeFar, tex: 0.15, bot: TOWN_TOP + 26 },
    { ys: M.mid, c: P.mtnMid, h0: P.hazeFar * 0.42, h1: P.hazeFar * 0.94, tex: 0.4, bot: TOWN_TOP + 26 },
    { ys: M.near, c: P.mtnNear, h0: P.hazeFar * 0.16, h1: P.hazeFar * 0.86, tex: 0.75, bot: TOWN_TOP + 26 },
  ];
  for (const R of ranges) {
    for (let x = 0; x < W; x++) {
      slab(ctx, x, Math.round(R.ys[x]), R.bot, R.c, P.hazeCol, R.h0, R.h1, 10);
    }
    // sunlit crest and shaded flanks
    for (let x = 1; x < W; x++) {
      const y = Math.round(R.ys[x]);
      const slope = R.ys[x] - R.ys[x - 1];
      const c = mix(R.c, P.hazeCol, R.h0);
      ctx.fillStyle = slope > 0.12 ? shade(c, 0.2) : slope < -0.12 ? shade(c, -0.14) : shade(c, 0.08);
      ctx.fillRect(x, y, 1, 1 + Math.min(3, Math.abs(slope) * 2.2));
    }
    // ridges and ravines raking down the flanks
    if (R.tex > 0.2) {
      const n = noise1d(M.seed + Math.round(R.tex * 100), W, 5, 0.6);
      for (let x = 0; x < W; x++) {
        const y = Math.round(R.ys[x]);
        const depthMax = R.bot - y;
        if (n[x] > 0.3) {
          const len = Math.min(depthMax, 5 + n[x] * 26 * R.tex);
          for (let k = 2; k < len; k++) {
            const f = k / depthMax;
            ctx.fillStyle = rgba(shade(mix(R.c, P.hazeCol, lerp(R.h0, R.h1, f)), -0.26), 0.5 * (1 - f));
            ctx.fillRect(x, y + k, 1, 1);
          }
        } else if (n[x] < -0.4) {
          const len = Math.min(depthMax, 4 + R.tex * 12);
          for (let k = 1; k < len; k++) {
            const f = k / depthMax;
            ctx.fillStyle = rgba(shade(mix(R.c, P.hazeCol, lerp(R.h0, R.h1, f)), 0.2), 0.45 * (1 - f));
            ctx.fillRect(x, y + k, 1, 1);
          }
        }
      }
    }
    // forest speckle on the nearest range only
    if (R.tex > 0.6) {
      for (let i = 0; i < 2600; i++) {
        const x = r.i(0, W - 1);
        const top = R.ys[x];
        const y = top + r.f(1, 50);
        if (y > TOWN_TOP + 8) continue;
        const f = (y - top) / (R.bot - top);
        const c = mix(R.c, P.hazeCol, lerp(R.h0, R.h1, f));
        ctx.fillStyle = rgba(r.chance(0.5) ? shade(c, -0.26) : shade(c, 0.2), 0.55);
        ctx.fillRect(x, y, 1, r.chance(0.3) ? 2 : 1);
      }
    }
  }

  /* the valley floor, its far edge lost in a ragged treeline ------------- */
  for (let x = 0; x < W; x++) {
    slab(ctx, x, Math.round(M.valleyTop[x]), H,
      P.valleyBase, P.hazeCol, P.hazeNear * 1.25, 0.04, 8);
  }
  // the town carrying on into the mist, far beyond the part you can make out
  {
    const pale = mix(P.walls[0], P.hazeCol, 0.78);
    const paleRoof = mix(P.roofs[0], P.hazeCol, 0.76);
    const paleDk = mix(P.walls[4], P.hazeCol, 0.7);
    for (let i = 0; i < 520; i++) {
      const x = r.f(-4, W + 4);
      const top = M.valleyTop[clamp(Math.round(x), 0, W - 1)];
      const y = top + r.f(-1, 4);
      const w = r.f(2, 5), h = r.f(1.5, 4);
      rect(ctx, x, y - h, w, h, r.chance(0.25) ? paleDk : pale);
      if (r.chance(0.5)) rect(ctx, x - 0.5, y - h - 1, w + 1, 1, paleRoof);
    }
  }
  {
    const far0 = mix(P.hillDark, P.hazeCol, P.hazeNear * 1.15);
    const far1 = mix(P.forest, P.hazeCol, P.hazeNear * 0.95);
    const lit = mix(P.forestHi, P.hazeCol, P.hazeNear * 1.05);
    const bump = noise1d(M.seed + 4242, W, 5, 0.6);
    for (let x = 0; x < W; x++) {
      const top = M.valleyTop[x] + bump[x] * 2.2;
      const depth = 9 + bump[x] * 4;
      ctx.fillStyle = far0;
      ctx.fillRect(x, Math.round(top), 1, Math.round(depth));
      ctx.fillStyle = far1;
      ctx.fillRect(x, Math.round(top + depth * 0.45), 1, Math.round(depth * 0.6));
      if (bump[x] > 0.15) { ctx.fillStyle = lit; ctx.fillRect(x, Math.round(top), 1, 1); }
    }
    // crowns breaking the skyline
    for (let i = 0; i < 620; i++) {
      const x = r.f(-6, W + 6);
      const top = M.valleyTop[clamp(Math.round(x), 0, W - 1)] + bump[clamp(Math.round(x), 0, W - 1)] * 2.2;
      const y = top + r.f(-2.5, 3);
      fillEllipse(ctx, x, y, r.f(1.3, 3.4), r.f(1, 2.4), r.chance(0.4) ? lit : far0);
    }
  }

  /* the forested spur holding the hill temple ---------------------------- */
  for (let x = 0; x < W; x++) {
    if (M.spurHump[x] < 9) continue;
    const y = Math.round(Math.min(M.spur[x], M.valleyTop[x] + 2));
    slab(ctx, x, y, TOWN_BOT + 10, P.hill, P.hazeCol, P.hazeNear * 0.6, 0, 8);
  }
  for (const t of M.spurTrees) {
    const f = t.dep === undefined ? clamp((t.y - 150) / 60, 0, 1) : t.dep;
    const c0 = t.s < 0.33 ? P.hillDark : t.s < 0.72 ? P.hill : P.hillHi;
    const c = mix(c0, P.hazeCol, lerp(P.hazeNear * 0.5, 0, f));
    fillEllipse(ctx, t.x, t.y, t.r, t.r * 0.8, c);
    if (t.s > 0.8) px(ctx, t.x - t.r * 0.4, t.y - t.r * 0.5, shade(c, 0.18));
  }
  if (P.canopy === 'blossom') {
    for (let i = 0; i < 300; i++) {
      const x = r.i(0, W - 1);
      const top = M.spur[x];
      if (top > 192) continue;
      const y = r.f(top - 2, top + 32);
      fillEllipse(ctx, x, y, r.f(1.5, 3.4), r.f(1.2, 2.6), r.chance(0.5) ? P.forest : P.forestHi);
    }
  }

  /* town ------------------------------------------------------------------ */
  for (let y = TOWN_BOT + 6; y > 146; y--) {
    const x = M.roadAt(y);
    const w = lerp(1, 5, (y - 146) / 74);
    rect(ctx, x - w / 2, y, w, 1, mix('#cfc8b8', P.hazeCol, 0.25 + (1 - (y - 146) / 74) * 0.5));
  }
  const items = [
    ...M.buildings.map((b) => ({ y: b.y, kind: 'b', o: b })),
    ...M.trees.map((t) => ({ y: t.y, kind: 't', o: t })),
  ].sort((a, b) => a.y - b.y);
  for (const it of items) {
    if (it.kind === 'b') drawBuilding(ctx, it.o, P, eraIndex);
    else if (it.o.kind === 'palm') drawPalm(ctx, it.o, P, eraIndex);
    else drawRoundTree(ctx, it.o, P, eraIndex, r);
  }
  // distance haze settling over the far half of town
  ctx.fillStyle = P.hazeCol;
  for (let y = TOWN_TOP - 20; y < TOWN_TOP + 30; y++) {
    const f = clamp(1 - (y - (TOWN_TOP - 20)) / 50, 0, 1);
    ctx.globalAlpha = f * f * P.hazeNear * 1.5;
    ctx.fillRect(0, y, W, 1);
  }
  ctx.globalAlpha = 1;

  /* hill temple (the golden wat standing above the rooftops) ------------- */
  {
    const bx = 112, by = 132;
    // a shoulder of cleared ground for it to stand on
    fillEllipse(ctx, bx, by + 2, 34, 6, mix(P.hillHi, P.hazeCol, P.hazeNear * 0.5));
    rect(ctx, bx - 26, by - 2, 54, 4, mix('#e6e0d0', P.hazeCol, 0.2));
    rect(ctx, bx - 26, by + 2, 54, 2, mix('#b8b2a0', P.hazeCol, 0.2));
    drawViharn(ctx, bx - 23, by, 16, 7, P, r);
    drawChedi(ctx, bx + 10, by - 1, 26, 9, P);
    drawChedi(ctx, bx + 21, by, 14, 5, P);
    drawChedi(ctx, bx - 1, by, 12, 4, P);
    // a stairway of white naga balustrade dropping into the trees
    for (let i = 0; i < 26; i++) {
      const yy = by + 4 + i;
      const xx = bx + 6 + i * 0.5;
      ctx.fillStyle = rgba(mix('#e8e2d4', P.hazeCol, 0.3), 0.8 - i * 0.02);
      ctx.fillRect(Math.round(xx), Math.round(yy), 2, 1);
    }
    drawChedi(ctx, 356, 170, 16, 6, { ...P, gold: '#efeae0', goldHi: '#ffffff', goldSh: '#b8b2a4' });
  }

  /* the great golden temple in the middle of town ------------------------ */
  {
    const bx = 300, by = 198;
    rect(ctx, bx - 34, by, 76, 3, '#ded8c8');
    drawViharn(ctx, bx - 32, by, 26, 11, P, r);
    drawChedi(ctx, bx + 12, by, 35, 12, P);
    drawChedi(ctx, bx + 28, by, 18, 6, P);
    drawChedi(ctx, bx - 2, by - 1, 15, 5, P);
    drawViharn(ctx, 414, 204, 22, 9, P, r);
    drawChedi(ctx, 444, 204, 21, 7, P);
  }

  /* smoke drifting up off the valley ------------------------------------- */
  if (P.smokeAmt > 0) {
    for (let i = 0; i < 300 * P.smokeAmt; i++) {
      const t = r.f();
      const y = lerp(196, 112, t);
      const spread = lerp(2, 28, t);
      const x = 372 + r.g(0, 1) * spread + t * 20;
      ctx.fillStyle = rgba(P.smoke, 0.09 + (1 - t) * 0.15);
      ctx.fillRect(x | 0, y | 0, 1, 1);
    }
  }

  /* rice terraces -------------------------------------------------------- */
  for (const band of M.terraces) {
    const yAt = (x) => band.y + band.tilt * clamp((x - band.xL) / (W + 26 - band.xL), 0, 1);
    for (const cell of band.cells) {
      const isPea = P.key === 'pea' || P.key === 'dusk';
      let c;
      if (isPea) {
        c = cell.kind < 0.5 ? P.field : cell.kind < 0.82 ? P.fieldAlt : mix(P.field, P.fieldAlt, 0.5);
      } else {
        c = cell.kind < 0.3 ? P.field
          : cell.kind < 0.5 ? P.fieldAlt
          : cell.kind < 0.66 ? mix(P.field, P.fieldAlt, 0.5)
          : cell.kind < 0.78 ? P.fieldWater
          : cell.kind < 0.9 ? shade(P.field, -0.22)
          : shade(P.fieldAlt, 0.18);
      }
      c = shade(c, (cell.wet - 0.5) * 0.12);
      const x0 = cell.x, x1 = cell.x + cell.w;
      const y0 = yAt(x0), y1 = yAt(x1);
      fillPoly(ctx, [[x0, y0], [x1, y1], [x1, y1 + band.h], [x0, y0 + band.h]], c);
      // furrows following the contour
      if (band.h > 3.4) {
        ctx.fillStyle = rgba(P.fieldLine, 0.22);
        for (let fy = 2; fy < band.h - 1; fy += 3) {
          for (let xx = Math.round(x0); xx < x1 && xx < W; xx++) {
            if (xx < 0) continue;
            ctx.fillRect(xx, Math.round(yAt(xx) + fy), 1, 1);
          }
        }
      }
      // the sunlit bund at the lip of the paddy, and the divider between plots
      for (let xx = Math.round(x0); xx < x1 && xx < W; xx++) {
        if (xx < 0) continue;
        px(ctx, xx, Math.round(yAt(xx)), mix(P.fieldLine, '#ffffff', 0.45));
        px(ctx, xx, Math.round(yAt(xx) + band.h - 1), shade(P.fieldLine, -0.2));
      }
      if (x0 > 0 && x0 < W) {
        ctx.fillStyle = shade(P.fieldLine, 0.22);
        ctx.fillRect(Math.round(x0), Math.round(y0), 1, Math.max(1, Math.round(band.h) + 1));
        ctx.fillStyle = rgba(mix(P.fieldLine, '#ffffff', 0.5), 0.8);
        ctx.fillRect(Math.round(x0) - 1, Math.round(y0), 1, Math.max(1, Math.round(band.h)));
      }
      // blossoms in the fields
      if (isPea) {
        for (let i = 0; i < cell.w / 5; i++) {
          const fx = cell.x + r.f(0, cell.w);
          px(ctx, fx, yAt(fx) + r.f(0, band.h), r.chance(0.6) ? '#8f7ce8' : '#c8b4ff');
        }
      } else if (P.key === 'flourish') {
        for (let i = 0; i < cell.w / 12; i++) {
          const fx = cell.x + r.f(0, cell.w);
          px(ctx, fx, yAt(fx) + r.f(0, band.h), '#e8f2a0');
        }
      }
    }
  }
  // the wooded slope below the town on the near left, left of the paddies
  for (let i = 0; i < 620; i++) {
    const x = r.f(-8, 210);
    const edge = lerp(198, 104, clamp((r.f(FIELD_TOP, H) - FIELD_TOP) / (H - FIELD_TOP), 0, 1));
    const y = r.f(FIELD_TOP - 4, H);
    if (x > edge + r.f(-18, 34)) continue;
    const rad = lerp(2.4, 7, (y - FIELD_TOP) / (H - FIELD_TOP)) * r.f(0.7, 1.35);
    const tone = r.f();
    const c = tone < 0.4 ? P.forestDark : tone < 0.78 ? P.forest : P.forestHi;
    fillEllipse(ctx, x, y, rad, rad * 0.84, P.canopy === 'bare' ? mix(c, '#6a5c38', 0.75) : c);
  }
  // a hedgerow where the last houses meet the first paddies
  for (let i = 0; i < 150; i++) {
    const x = r.f(120, W + 6);
    const y = FIELD_TOP + r.f(-4, 4);
    const rad = r.f(1.4, 3.6);
    fillEllipse(ctx, x, y, rad, rad * 0.8, r.chance(0.5) ? P.forestDark : P.forest);
  }
  // lone trees and hedgerows along the paddy bunds
  for (let i = 0; i < 46; i++) {
    const x = r.f(150, W + 8);
    const y = r.f(FIELD_TOP + 6, FIELD_BOT + 2);
    const rad = lerp(2, 5.5, (y - FIELD_TOP) / (FIELD_BOT - FIELD_TOP)) * r.f(0.7, 1.3);
    drawRoundTree(ctx, { x, y, r: rad, seed: r.i(0, 9999) }, P, eraIndex, r);
  }
  // a couple of farm huts out among the fields
  for (let i = 0; i < 5; i++) {
    const x = r.f(190, W - 10);
    const y = r.f(FIELD_TOP + 8, FIELD_BOT);
    drawBuilding(ctx, {
      x, y, w: r.f(6, 11), h: r.f(4, 7), roof: r.i(0, 5), wall: r.i(0, 4),
      gable: true, flat: false, winCols: 1, winRows: 1, lit: r.f(),
    }, P, eraIndex);
  }

  return canvas;
}

/* --------------------------------------------- foreground framing foliage */

export function renderForeground(eraIndex) {
  const P = ERAS[eraIndex];
  const M = getModel();
  const { canvas, ctx } = makeCanvas(W, H);
  const r = rng(M.seed + 700 + eraIndex);

  const isBare = P.canopy === 'bare';
  const dusk = P.key === 'dusk';
  const blossom = P.canopy === 'blossom';
  const deep = isBare ? '#4a4128' : dusk ? '#14212c' : shade(P.forestDark, -0.34);
  const midC = isBare ? '#5e5334' : dusk ? '#1c2c3a' : shade(P.forestDark, -0.12);
  const hi = isBare ? '#7a6a42' : dusk ? '#284050' : P.forest;
  const hi2 = isBare ? '#8e7c4c' : dusk ? '#33505e' : shade(P.forest, 0.18);
  const bark = isBare ? '#59492c' : dusk ? '#11191f' : '#38291c';
  const barkHi = isBare ? '#6e5c39' : dusk ? '#1c2830' : '#4e3a28';

  const tree = (t, tones) => {
    // trunk first, forking near the crown
    const tx = t.x, ty = t.y;
    for (let i = 0; i < t.trunk; i++) {
      const f = i / t.trunk;
      const w = Math.max(1, (3.4 - f * 1.8) * t.scale);
      const X = tx + t.lean * i * 0.6;
      ctx.fillStyle = bark;
      ctx.fillRect(Math.round(X - w / 2), Math.round(ty - i), Math.round(w) + 1, 1);
      ctx.fillStyle = barkHi;
      ctx.fillRect(Math.round(X - w / 2), Math.round(ty - i), 1, 1);
    }
    const bx = tx + t.lean * t.trunk * 0.6, by = ty - t.trunk;
    for (let b = 0; b < 4; b++) {
      const a = -Math.PI / 2 + (b - 1.5) * 0.55 + r.f(-0.15, 0.15);
      const len = t.trunk * r.f(0.4, 0.8);
      ctx.fillStyle = bark;
      for (let i = 0; i < len; i++) {
        ctx.fillRect(Math.round(bx + Math.cos(a) * i), Math.round(by + Math.sin(a) * i), 2, 1);
      }
    }
    if (isBare) {
      for (const c of t.crown) {
        if (r.chance(0.55)) continue;
        const a = Math.atan2(c.dy, c.dx);
        ctx.fillStyle = deep;
        for (let i = 0; i < c.r * 1.6; i++) {
          ctx.fillRect(Math.round(bx + c.dx * 0.4 + Math.cos(a) * i), Math.round(by + c.dy * 0.4 + Math.sin(a) * i), 1, 1);
        }
      }
      return;
    }
    // crown: dark mass, then lit clumps on the sun side
    for (const c of t.crown) {
      fillEllipse(ctx, bx + c.dx, by + c.dy, c.r * 1.1, c.r * 0.92, deep);
    }
    for (const c of t.crown) {
      if (c.tone < 0.3) continue;
      fillEllipse(ctx, bx + c.dx - c.r * 0.12, by + c.dy - c.r * 0.22, c.r * 0.88, c.r * 0.72, tones[0]);
    }
    for (const c of t.crown) {
      if (c.tone < 0.62) continue;
      fillEllipse(ctx, bx + c.dx - c.r * 0.3, by + c.dy - c.r * 0.42, c.r * 0.6, c.r * 0.46, tones[1]);
    }
    for (const c of t.crown) {
      if (c.tone < 0.86) continue;
      fillEllipse(ctx, bx + c.dx - c.r * 0.4, by + c.dy - c.r * 0.5, c.r * 0.3, c.r * 0.24, tones[2]);
    }
    // leaf fringe so the silhouette never looks like smooth plastic
    for (let i = 0; i < 40 * t.scale; i++) {
      const c = t.crown[r.i(0, t.crown.length - 1)];
      const a = r.f(0, 6.28);
      const d = c.r * r.f(0.85, 1.25);
      ctx.fillStyle = r.chance(0.5) ? deep : tones[0];
      ctx.fillRect(Math.round(bx + c.dx + Math.cos(a) * d), Math.round(by + c.dy + Math.sin(a) * d * 0.85), 1, 1);
    }
  };

  const tones = blossom ? [P.forestDark, P.forest, P.forestHi] : [midC, hi, hi2];
  for (const t of M.fgLeft) tree(t, tones);

  // banana plants — big paddle leaves, unmistakably tropical
  const banana = (bx, by, s, tint) => {
    const stem = isBare ? '#6a5c38' : dusk ? '#1c2e28' : '#3c6b34';
    for (let i = 0; i < 12 * s; i++) {
      ctx.fillStyle = i % 3 === 0 ? shade(stem, 0.2) : stem;
      ctx.fillRect(Math.round(bx - 1), Math.round(by - i), 3, 1);
    }
    for (let i = 0; i < 8; i++) {
      const a = -Math.PI / 2 + ((i - 3.5) / 3.5) * 1.45 + r.f(-0.12, 0.12);
      const len = 15 * s * r.f(0.7, 1.25);
      const ex = bx + Math.cos(a) * len, ey = by - 11 * s + Math.sin(a) * len * 0.8;
      const c = i % 2 ? tint : shade(tint, -0.16);
      const droop = 4 * s;
      for (let k = 0; k < 18; k++) {
        const t2 = k / 18;
        const wdt = Math.sin(Math.pow(t2, 0.7) * Math.PI) * 2.9 * s;
        const X = lerp(bx, ex, t2), Y = lerp(by - 11 * s, ey, t2) + Math.pow(t2, 2) * droop;
        fillEllipse(ctx, X, Y, wdt, wdt * 0.8, c);
        if (k % 4 === 0 && wdt > 1.4) {
          ctx.fillStyle = shade(c, 0.22);
          ctx.fillRect(Math.round(X), Math.round(Y - wdt * 0.6), 1, 1);
        }
      }
      // midrib
      ctx.fillStyle = shade(c, 0.3);
      for (let k = 0; k < 18; k += 2) {
        const t2 = k / 18;
        ctx.fillRect(Math.round(lerp(bx, ex, t2)), Math.round(lerp(by - 11 * s, ey, t2) + Math.pow(t2, 2) * droop), 1, 1);
      }
    }
  };
  const bTint = isBare ? '#8a7a48' : dusk ? '#1e3c32' : '#3f7a35';
  banana(26, 268, 1.35, bTint);
  banana(66, 258, 0.9, shade(bTint, -0.1));
  banana(4, 250, 1.0, shade(bTint, 0.08));
  banana(458, 268, 1.1, shade(bTint, -0.05));

  for (const t of M.fgRight) tree(t, tones);

  return canvas;
}
