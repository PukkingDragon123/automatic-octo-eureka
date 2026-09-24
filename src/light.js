/* ============================================================================
 *  light.js — the light in a scene, laid over it at full resolution.
 *
 *  A rig is a short description of where the light is coming from: an ambient
 *  colour that the whole scene is multiplied down into, shafts that come in
 *  through windows and gaps, glows around anything that shines, soft shadow
 *  pools, a colour grade, and a fine grain.  The art underneath stays flat
 *  and crisp; the light is what makes it feel like a place at a time of day.
 * ==========================================================================*/

import { clamp, rng } from './core.js';
import { W, H, RES } from './vista.js';

let grain = null;
function grainPattern(ctx) {
  if (grain) return grain;
  const c = document.createElement('canvas');
  c.width = 192; c.height = 192;
  const g = c.getContext('2d');
  const img = g.createImageData(192, 192);
  const r = rng(7373);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 128 + (r.f() - 0.5) * 120;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  grain = ctx.createPattern(c, 'repeat');
  return grain;
}

function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${clamp(a, 0, 1)})`;
}

/** A soft round light, with a wider, fainter bloom round it. */
function glow(ctx, L, t) {
  const fl = L.flicker ? 1 + Math.sin(t * (L.flickerRate || 11) + (L.ph || 0)) * L.flicker
    + Math.sin(t * 23 + (L.ph || 0) * 2) * L.flicker * 0.5 : 1;
  const a = (L.a === undefined ? 0.5 : L.a) * fl;
  const r = L.r * (L.flicker ? 0.96 + (fl - 1) * 0.5 : 1);
  ctx.save();
  ctx.translate(L.x, L.y);
  if (L.sy && L.sy !== 1) ctx.scale(1, L.sy);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
  g.addColorStop(0, hexA(L.color, a));
  g.addColorStop(0.35, hexA(L.color, a * 0.45));
  g.addColorStop(1, hexA(L.color, 0));
  ctx.fillStyle = g;
  ctx.fillRect(-r, -r, r * 2, r * 2);
  if (L.core) {
    const c2 = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 0.18);
    c2.addColorStop(0, hexA(L.core, Math.min(1, a * 1.6)));
    c2.addColorStop(1, hexA(L.core, 0));
    ctx.fillStyle = c2;
    ctx.fillRect(-r * 0.2, -r * 0.2, r * 0.4, r * 0.4);
  }
  ctx.restore();
}

/** A shaft of light: a quad that fades along its length. */
function beam(ctx, B, t) {
  const sway = B.sway ? Math.sin(t * 0.4 + (B.ph || 0)) * B.sway : 0;
  const a = (B.a === undefined ? 0.25 : B.a) * (1 + (B.pulse ? Math.sin(t * 0.7 + (B.ph || 0)) * B.pulse : 0));
  const g = ctx.createLinearGradient(B.x0, B.y0, B.x1 + sway, B.y1);
  g.addColorStop(0, hexA(B.color, a));
  g.addColorStop(0.6, hexA(B.color, a * 0.55));
  g.addColorStop(1, hexA(B.color, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(B.x0 - B.w0 / 2, B.y0);
  ctx.lineTo(B.x0 + B.w0 / 2, B.y0);
  ctx.lineTo(B.x1 + sway + B.w1 / 2, B.y1);
  ctx.lineTo(B.x1 + sway - B.w1 / 2, B.y1);
  ctx.closePath();
  ctx.fill();
}

/** Motes turning slowly inside a beam. */
function motes(ctx, B, t, n) {
  const r = rng(B.seed || 99);
  ctx.fillStyle = hexA(B.moteColor || '#fff6d8', 0.7);
  for (let i = 0; i < n; i++) {
    const k = (r.f() + t * 0.012 * (0.5 + r.f())) % 1;
    const side = r.f() - 0.5;
    const x = B.x0 + (B.x1 - B.x0) * k + side * (B.w0 + (B.w1 - B.w0) * k) * 0.8 + Math.sin(t * 0.6 + i) * 2;
    const y = B.y0 + (B.y1 - B.y0) * k + Math.cos(t * 0.5 + i * 1.7) * 2;
    const tw = 0.4 + 0.6 * Math.abs(Math.sin(t * 1.3 + i));
    ctx.globalAlpha = tw * 0.8;
    ctx.fillRect(x, y, 0.5, 0.5);
  }
  ctx.globalAlpha = 1;
}

/**
 * Lay a rig over whatever is already in ctx.  Coordinates are logical and
 * already in screen space (the caller subtracts its camera).
 */
export function lightPass(ctx, rig, t, stage = 'all') {
  if (!rig) return;
  const under = stage === 'all' || stage === 'under';
  const over = stage === 'all' || stage === 'over';
  ctx.save();
  // soft shadow pools first, so the light can cut into them
  if (under && rig.shadows) {
    ctx.globalCompositeOperation = 'multiply';
    for (const S of rig.shadows) {
      ctx.save();
      ctx.translate(S.x, S.y);
      ctx.scale(1, S.sy || 0.35);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, S.r);
      g.addColorStop(0, hexA(S.color || '#40384a', S.a || 0.5));
      g.addColorStop(1, hexA(S.color || '#40384a', 0));
      ctx.fillStyle = g;
      ctx.fillRect(-S.r, -S.r, S.r * 2, S.r * 2);
      ctx.restore();
    }
  }
  if (under && rig.darks) {
    ctx.globalCompositeOperation = 'multiply';
    for (const B of rig.darks) beam(ctx, B, t);
  }
  // the ambient colour of the hour, multiplied through everything
  if (over && rig.ambient && rig.ambient.amount > 0) {
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = rig.ambient.amount;
    if (rig.ambient.top) {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, rig.ambient.top);
      g.addColorStop(1, rig.ambient.color);
      ctx.fillStyle = g;
    } else ctx.fillStyle = rig.ambient.color;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
  }
  // shafts, then everything that glows
  if (over && rig.beams) {
    ctx.globalCompositeOperation = 'screen';
    for (const B of rig.beams) beam(ctx, B, t);
    ctx.globalCompositeOperation = 'lighter';
    for (const B of rig.beams) if (B.motes) motes(ctx, B, t, B.motes);
  }
  if (over && rig.lights) {
    ctx.globalCompositeOperation = 'lighter';
    for (const L of rig.lights) {
      if (L.x < -L.r || L.x > W + L.r) continue;
      glow(ctx, L, t);
    }
  }
  if (over && rig.soft) {
    ctx.globalCompositeOperation = 'screen';
    for (const L of rig.soft) {
      if (L.x < -L.r || L.x > W + L.r) continue;
      glow(ctx, L, t);
    }
  }
  // the grade, and a little grain so flat colour reads as a surface
  if (over && rig.grade) {
    ctx.globalCompositeOperation = rig.grade.mode || 'soft-light';
    ctx.globalAlpha = rig.grade.amount;
    if (rig.grade.top) {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, rig.grade.top);
      g.addColorStop(1, rig.grade.color);
      ctx.fillStyle = g;
    } else ctx.fillStyle = rig.grade.color;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
  if (over && rig.grain !== 0) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = rig.grain === undefined ? 0.07 : rig.grain;
    ctx.fillStyle = grainPattern(ctx);
    const ox = Math.floor((t * 60) % 3) * 64;
    ctx.translate(-ox, 0);
    ctx.fillRect(ox, 0, W * RES, H * RES);
    ctx.restore();
  }
}
