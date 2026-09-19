/* ============================================================================
 *  flora.js — the other flowers on the hill.
 *
 *  The bed by the path is the one you are told about.  These are the ones you
 *  find: a few clumps scattered along the ridge, each its own species, each
 *  quietly thicker every time you come back with the can.
 * ==========================================================================*/

import { rng, clamp, lerp, shade, rgba, fillEllipse } from './core.js';

/* Every species is a head shape plus a short palette.  `tall` scales the stem,
   `n` how many stand in a clump, `spread` how far they wander from the middle. */
export const SPECIES = {
  daisy:    { petals: 8, pr: 1.5, col: '#fbf6ee', col2: '#d9d2c6', core2: '#f2b23c', tall: 1.0, stem: '#4d7c3a' },
  poppy:    { petals: 5, pr: 2.0, col: '#e0463c', col2: '#a92a27', core2: '#2c2230', tall: 1.15, stem: '#537f3c' },
  cosmos:   { petals: 7, pr: 1.8, col: '#f2a3c4', col2: '#cf7aa2', core2: '#f4d766', tall: 1.25, stem: '#4e7b41' },
  marigold: { petals: 9, pr: 1.5, col: '#f6a233', col2: '#d2731e', core2: '#8a4a12', tall: 0.85, stem: '#46702f' },
  bluebell: { bell: true, col: '#7f7be0', col2: '#4f49a8', tall: 1.1, stem: '#3f6a34' },
  iris:     { bell: true, col: '#9268c8', col2: '#5e3d8e', tall: 1.35, stem: '#3d7040' },
  clover:   { puff: true, col: '#f0dff0', col2: '#c9a8c4', tall: 0.6, stem: '#4a7a36' },
};
/** Where the clumps are, and what grows in each. */
export const PATCHES = [
  { x: 214, kind: 'iris',     n: 7,  spread: 20, seed: 11 },
  { x: 372, kind: 'daisy',    n: 13, spread: 30, seed: 22 },
  { x: 606, kind: 'poppy',    n: 9,  spread: 24, seed: 33 },
  { x: 748, kind: 'cosmos',   n: 11, spread: 27, seed: 44 },
  { x: 966, kind: 'marigold', n: 10, spread: 23, seed: 55 },
  { x: 1062, kind: 'clover',  n: 12, spread: 26, seed: 66 },
];

/** A clump's layout never changes; only how far along it is does. */
export function bakePatch(p) {
  const r = rng(p.seed * 977 + 13);
  const S = SPECIES[p.kind];
  const flowers = [];
  for (let i = 0; i < p.n; i++) {
    flowers.push({
      dx: r.f(-p.spread, p.spread),
      dy: r.f(-4.5, 3.5),
      h: r.f(6, 13) * S.tall,
      sc: r.f(0.85, 1.35),
      ph: r.f(0, 6.28),
      turn: r.f(-0.5, 0.5),
      open: r.f(0.1, 0.95),      // the order they come out in
    });
  }
  flowers.sort((a, b) => a.dy - b.dy);
  return { ...p, S, flowers };
}

function head(ctx, x, y, s, S, night, t, ph) {
  const col = night ? shade(S.col, -0.42) : S.col;
  const col2 = night ? shade(S.col2, -0.42) : S.col2;
  if (S.bell) {
    // three bells hanging off one side of the stem
    for (let i = 0; i < 3; i++) {
      const by = y + i * s * 1.9;
      const bx = x + (i % 2 ? s * 0.7 : -s * 0.55) + Math.sin(t * 1.4 + ph + i) * 0.5;
      fillEllipse(ctx, bx, by, s * 0.95, s * 1.15, col2);
      fillEllipse(ctx, bx, by - s * 0.2, s * 0.72, s * 0.85, col);
      fillEllipse(ctx, bx - s * 0.25, by - s * 0.35, s * 0.3, s * 0.32, shade(col, 0.25));
    }
    return;
  }
  if (S.puff) {
    fillEllipse(ctx, x, y, s * 1.3, s * 1.15, col2);
    fillEllipse(ctx, x, y - s * 0.25, s * 1.05, s * 0.85, col);
    for (let i = 0; i < 5; i++) {
      fillEllipse(ctx, x + Math.cos(i * 1.3) * s * 0.7, y + Math.sin(i * 1.3) * s * 0.55, s * 0.3, s * 0.26, shade(col, 0.2));
    }
    return;
  }
  const n = S.petals;
  const wob = Math.sin(t * 1.6 + ph) * 0.12;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + wob;
    const px2 = x + Math.cos(a) * s * S.pr * 0.62;
    const py2 = y + Math.sin(a) * s * S.pr * 0.46;
    fillEllipse(ctx, px2, py2, s * 0.78, s * 0.62, Math.sin(a) > 0 ? col2 : col);
  }
  fillEllipse(ctx, x, y, s * 0.62, s * 0.5, night ? shade(S.core2, -0.4) : S.core2);
  if (s > 1.6) fillEllipse(ctx, x - s * 0.2, y - s * 0.2, s * 0.24, s * 0.2, '#fff4cc');
}

/**
 * Draw one clump.
 *  st.grown 0..1  how much of it is up
 *  st.wet   0..1  dark earth under it
 *  st.perk  0..1  a shiver just after it is watered
 */
export function drawPatch(ctx, vx, gy, P, t, wind, st = {}, night = false) {
  const grown = clamp(st.grown === undefined ? 0.35 : st.grown, 0, 1);
  const perk = st.perk || 0;
  const S = P.S;
  if (st.wet > 0.02) {
    ctx.globalAlpha = clamp(st.wet, 0, 1) * 0.35;
    fillEllipse(ctx, vx, gy + 1, P.spread + 8, 4.5, '#3a2a1c');
    ctx.globalAlpha = 1;
  }
  // a little low foliage so the clump is rooted in the grass
  const leafCol = night ? shade(S.stem, -0.45) : S.stem;
  const lr = rng(P.seed * 31 + 7);
  for (let i = 0; i < 18 * (0.4 + grown * 0.6); i++) {
    const lx = vx + lr.f(-P.spread - 4, P.spread + 4);
    const ly = gy + lr.f(-2.5, 2);
    ctx.fillStyle = lr.chance(0.5) ? leafCol : shade(leafCol, 0.18);
    ctx.fillRect(Math.round(lx), Math.round(ly - 2), 1, 3);
  }
  for (const fl of P.flowers) {
    const k = clamp((grown - fl.open * 0.85) / 0.25, 0, 1);
    if (k <= 0) continue;
    const x = vx + fl.dx;
    const base = gy + fl.dy;
    const h = fl.h * k * (1 + perk * 0.12);
    const sway = Math.sin(t * 1.1 + fl.ph) * wind * 0.9 + fl.turn;
    const topX = x + sway;
    const topY = base - h;
    // stem
    const stem = night ? shade(S.stem, -0.45) : S.stem;
    const steps = Math.max(2, Math.round(h));
    for (let i = 0; i <= steps; i++) {
      const u = i / steps;
      ctx.fillStyle = i > steps * 0.6 ? shade(stem, 0.14) : stem;
      ctx.fillRect(Math.round(lerp(x, topX, u * u)), Math.round(lerp(base, topY, u)), 1, 1);
    }
    // a leaf or two
    if (h > 6) {
      const ly = base - h * 0.4;
      fillEllipse(ctx, x - 2 + sway * 0.2, ly, 2.4, 1.1, stem);
      fillEllipse(ctx, x + 2.4 + sway * 0.3, ly - 2, 2.2, 1, shade(stem, 0.16));
    }
    head(ctx, topX, topY, fl.sc * (0.5 + k * 0.5) * 1.75, S, night, t, fl.ph);
  }
}

/** Halo when a clump is watered or fussed with. */
export function patchGlow(ctx, vx, gy, P, a) {
  if (a <= 0) return;
  ctx.globalAlpha = a * 0.22;
  fillEllipse(ctx, vx, gy - 7, P.spread + 12, 12, rgba('#ffffff', 1));
  ctx.globalAlpha = 1;
}
