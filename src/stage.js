/* ============================================================================
 *  stage.js — the hilltop you actually live on.
 *
 *  Turf, the pond, the old tree and its log, the lookout wall, the flowerbed,
 *  the bowl, the rocks, and — much later — a small stone with a tree growing
 *  over it.  All of it in world coordinates.
 * ==========================================================================*/

import {
  rng, clamp, lerp, mix, shade, rgba, makeCanvas,
  rect, hline, px, fillEllipse, ditherOverlay,
} from './core.js';
import { H, ERAS } from './vista.js';
import { WORLD_W, PLACES, groundY } from './world.js';

/* ------------------------------------------------------------- the turf --*/

export function renderGround(eraIndex) {
  const P = ERAS[eraIndex];
  const { canvas, ctx } = makeCanvas(WORLD_W, H);
  const r = rng(4242 + eraIndex * 17);

  for (let x = 0; x < WORLD_W; x++) {
    const gy = Math.round(groundY(x));
    for (let y = gy; y < H; y++) {
      const t = (y - gy) / (H - gy);
      let c = mix(P.grassHi, P.grass, clamp(t * 1.6, 0, 1));
      if (t > 0.55) c = mix(c, P.grassDark, ((t - 0.55) / 0.45) * 0.8);
      ctx.fillStyle = c;
      ctx.fillRect(x, y, 1, 1);
    }
    ditherOverlay(ctx, x, gy, 1, 4, mix(P.grassHi, '#ffffff', 0.25), 0.55);
    ditherOverlay(ctx, x, gy + 3, 1, 5, P.grassHi, 0.4);
  }
  // mottling, denser and darker toward the bottom of the slope
  for (let i = 0; i < 6500; i++) {
    const x = r.i(0, WORLD_W - 1);
    const y = r.f(groundY(x), H);
    const t = (y - groundY(x)) / (H - groundY(x));
    ctx.fillStyle = r.f() < 0.35 + t * 0.35 ? shade(P.grassDark, -0.1) : P.grassHi;
    ctx.globalAlpha = 0.35 + r.f() * 0.3;
    ctx.fillRect(x, y | 0, 1, r.chance(0.3) ? 2 : 1);
    ctx.globalAlpha = 1;
  }
  // blades
  for (let i = 0; i < 3800; i++) {
    const x = r.f(0, WORLD_W);
    const gy = groundY(x);
    const y = lerp(gy, H, Math.pow(r.f(), 0.6));
    const depth = (y - gy) / (H - gy);
    const len = lerp(2, 6, depth) * r.f(0.6, 1.4);
    const bend = r.f(-1.2, 1.2);
    ctx.fillStyle = r.chance(0.45) ? P.grassDark : r.chance(0.5) ? P.grass : P.grassHi;
    for (let k = 0; k < len; k++) {
      ctx.fillRect(Math.round(x + bend * (k / len) * (k / len) * 3), Math.round(y - k), 1, 1);
    }
  }
  // wildflowers, thicker in the meadow between the tree and the lookout
  for (let i = 0; i < 620; i++) {
    const x = r.f(0, WORLD_W);
    const meadow = Math.exp(-Math.pow((x - 620) / 220, 2));
    if (r.f() > 0.25 + meadow * 0.75) continue;
    const gy = groundY(x);
    const y = lerp(gy + 2, H, Math.pow(r.f(), 0.7));
    const c = r.chance(0.5) ? P.grassSeed : r.chance(0.5) ? '#f4f0dc' : '#f8d8e4';
    ctx.fillStyle = c;
    ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
    if (r.chance(0.5)) ctx.fillRect(Math.round(x) + 1, Math.round(y) - 1, 1, 1);
  }
  // the worn footpath people take from the steps across to the tree
  for (let x = 60; x < 560; x++) {
    const gy = groundY(x) + 16 + Math.sin(x * 0.02) * 3;
    const wear = Math.min(1, Math.min(x - 60, 560 - x) / 90);
    for (let k = 0; k < 5 * wear; k++) {
      if (r.chance(0.55)) continue;
      ctx.fillStyle = r.chance(0.5) ? mix(P.grass, '#a8926c', 0.5) : mix(P.grassDark, '#8a7a58', 0.5);
      ctx.fillRect(x, Math.round(gy + k), 1, 1);
    }
  }

  drawSteps(ctx, P, r);
  rect(ctx, 0, H - 2, WORLD_W, 2, P.grassDark);
  return canvas;
}

function drawSteps(ctx, P, r) {
  const stone = P.key === 'dusk' ? '#5a5a62' : '#9a968c';
  const stoneLo = shade(stone, -0.3);
  const stoneHi = shade(stone, 0.22);
  const bx = PLACES.steps.x;
  let y = 246;
  for (let row = 0; row < 5; row++) {
    let x = bx - 100 + (row % 2) * 4;
    while (x < bx + 4 - row * 3) {
      const w = r.f(6, 13);
      const c = mix(stone, r.chance(0.5) ? stoneLo : stoneHi, r.f(0, 0.5));
      rect(ctx, x, y, w - 1, 4, c);
      hline(ctx, x, x + w - 2, y, shade(c, 0.18));
      hline(ctx, x, x + w - 2, y + 3, shade(c, -0.25));
      x += w;
    }
    y += 5;
    if (y > H) break;
  }
  for (let i = 0; i < 5; i++) {
    const sy = 250 + i * 6;
    const sx = bx - 74 + i * 5;
    const sw = 40 - i * 3;
    rect(ctx, sx, sy, sw, 4, mix(stone, '#ffffff', 0.12));
    hline(ctx, sx, sx + sw, sy, stoneHi);
    hline(ctx, sx, sx + sw, sy + 3, stoneLo);
    for (let k = 0; k < 8; k++) {
      ctx.fillStyle = P.grassDark;
      ctx.fillRect((sx + r.f(0, sw)) | 0, sy - 1, 1, 2);
    }
  }
}

/* --------------------------------------------- foliage in front and behind */

export function renderCanopy(eraIndex) {
  const P = ERAS[eraIndex];
  const { canvas, ctx } = makeCanvas(WORLD_W, H);
  const r = rng(7700 + eraIndex);
  const isBare = P.canopy === 'bare';
  const blossom = P.canopy === 'blossom';
  const dusk = P.key === 'dusk';
  const deep = isBare ? '#4a4128' : dusk ? '#14212c' : shade(P.forestDark, -0.34);
  const midC = isBare ? '#5e5334' : dusk ? '#1c2c3a' : shade(P.forestDark, -0.12);
  const hi = isBare ? '#7a6a42' : dusk ? '#284050' : P.forest;
  const hi2 = isBare ? '#8e7c4c' : dusk ? '#33505e' : shade(P.forest, 0.18);
  const tones = blossom ? [P.forestDark, P.forest, P.forestHi] : [midC, hi, hi2];
  const bark = isBare ? '#59492c' : dusk ? '#11191f' : '#38291c';

  const bush = (x, y, s) => {
    const n = r.i(5, 9);
    for (let k = 0; k < n; k++) {
      const a = r.f(0, 6.28), d = Math.sqrt(r.f());
      const cx = x + Math.cos(a) * 9 * d * s;
      const cy = y + Math.sin(a) * 5 * d * s - 3 * s;
      const rad = r.f(3, 7) * s;
      fillEllipse(ctx, cx, cy, rad * 1.1, rad * 0.86, deep);
      if (r.chance(0.6)) fillEllipse(ctx, cx - rad * 0.2, cy - rad * 0.28, rad * 0.8, rad * 0.62, tones[0]);
      if (r.chance(0.4)) fillEllipse(ctx, cx - rad * 0.35, cy - rad * 0.45, rad * 0.5, rad * 0.38, tones[1]);
    }
  };

  // clumps of scrub scattered along the whole ridge, thicker at the ends
  for (let i = 0; i < 120; i++) {
    const x = r.f(-30, WORLD_W + 30);
    const edge = Math.max(0, 1 - Math.min(x, WORLD_W - x) / 150);
    if (r.f() > 0.04 + edge * 0.95) continue;
    bush(x, r.f(groundY(x) + 30, H + 6), r.f(0.7, 1.4));
  }
  // a low fringe along the very bottom of the frame, all the way across
  for (let i = 0; i < 150; i++) {
    const x = r.f(-20, WORLD_W + 20);
    bush(x, r.f(H - 6, H + 14), r.f(0.5, 1.0));
  }
  // banana clumps by the steps, where it is damp
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
      for (let k = 0; k < 18; k++) {
        const t2 = k / 18;
        const wdt = Math.sin(Math.pow(t2, 0.7) * Math.PI) * 2.9 * s;
        const X = lerp(bx, ex, t2), Y = lerp(by - 11 * s, ey, t2) + Math.pow(t2, 2) * 4 * s;
        fillEllipse(ctx, X, Y, wdt, wdt * 0.8, c);
        if (k % 4 === 0 && wdt > 1.4) {
          ctx.fillStyle = shade(c, 0.22);
          ctx.fillRect(Math.round(X), Math.round(Y - wdt * 0.6), 1, 1);
        }
      }
    }
  };
  const bTint = isBare ? '#8a7a48' : dusk ? '#1e3c32' : '#3f7a35';
  banana(PLACES.steps.x - 70, 300, 1.3, bTint);
  banana(PLACES.steps.x - 30, 292, 0.9, shade(bTint, -0.1));
  banana(WORLD_W - 30, 300, 1.1, shade(bTint, -0.05));
  banana(WORLD_W - 6, 292, 0.9, bTint);

  // a couple of small trees along the ridge for depth
  for (const [tx, ts] of [[PLACES.steps.x - 46, 1.1], [PLACES.rocks.x + 74, 1.0]]) {
    const ty = groundY(tx) + 30;
    const trunk = r.f(12, 18) * ts;
    for (let i = 0; i < trunk; i++) {
      ctx.fillStyle = i % 4 === 0 ? shade(bark, 0.2) : bark;
      ctx.fillRect(Math.round(tx - 1), Math.round(ty - i), 3, 1);
    }
    if (isBare) {
      for (let b = 0; b < 6; b++) {
        const a = -Math.PI / 2 + r.f(-1.1, 1.1);
        const len = r.f(8, 18) * ts;
        ctx.fillStyle = bark;
        for (let i = 0; i < len; i++) {
          ctx.fillRect(Math.round(tx + Math.cos(a) * i), Math.round(ty - trunk + Math.sin(a) * i), 1, 1);
        }
      }
    } else {
      for (let k = 0; k < 14; k++) {
        const a = r.f(0, 6.28), d = Math.sqrt(r.f());
        const cx = tx + Math.cos(a) * 13 * d * ts;
        const cy = ty - trunk - 4 * ts + Math.sin(a) * 8 * d * ts;
        const rad = r.f(4, 8) * ts;
        fillEllipse(ctx, cx, cy, rad * 1.1, rad * 0.9, deep);
        if (r.chance(0.7)) fillEllipse(ctx, cx - rad * 0.2, cy - rad * 0.3, rad * 0.8, rad * 0.6, tones[0]);
        if (r.chance(0.45)) fillEllipse(ctx, cx - rad * 0.35, cy - rad * 0.45, rad * 0.5, rad * 0.35, tones[2]);
      }
    }
  }
  return canvas;
}

/* ------------------------------------------------ grass that moves in wind */

export function makeTufts(seed = 9) {
  const r = rng(seed);
  const tufts = [];
  for (let i = 0; i < 340; i++) {
    const x = r.f(-4, WORLD_W + 4);
    const gy = groundY(x);
    const y = lerp(gy, H + 4, Math.pow(r.f(), 0.55));
    tufts.push({
      x, y, blades: r.i(3, 6), h: lerp(3, 9, (y - gy) / (H - gy)) * r.f(0.7, 1.5),
      phase: r.f(0, 6.28), sway: r.f(0.7, 1.5), tone: r.f(),
    });
  }
  return tufts;
}

export function drawTufts(ctx, tufts, P, t, wind, cam, near) {
  for (const tu of tufts) {
    if (near !== undefined && (tu.y >= 272) !== near) continue;
    const vx = tu.x - cam;
    if (vx < -12 || vx > 492) continue;
    const s = Math.sin(t * 1.7 + tu.phase + tu.x * 0.02) * wind * tu.sway;
    ctx.fillStyle = tu.tone < 0.4 ? P.grassDark : tu.tone < 0.75 ? P.grass : P.grassHi;
    for (let b = 0; b < tu.blades; b++) {
      const bx = vx + (b - tu.blades / 2) * 1.4;
      const bh = tu.h * (0.6 + ((b * 37) % 10) / 14);
      for (let k = 0; k < bh; k++) {
        const f = k / bh;
        ctx.fillRect(Math.round(bx + s * f * f * 2.4), Math.round(tu.y - k), 1, 1);
      }
    }
  }
}

/* ---------------------------------------------------------------- the pond */

export function drawPond(ctx, vx, P, t, opts = {}) {
  const { y, rx, ry } = PLACES.pond;
  const x = vx;
  const dusk = opts.night;
  const deep = dusk ? '#2b3560' : mix('#2f6f8c', P.hazeCol, 0.05);
  const midC = dusk ? '#47548c' : '#4d94a8';
  const shallow = dusk ? '#7a7ab0' : '#84c2c4';
  const sky = dusk ? '#9a6a72' : mix(P.sky[1][1], '#ffffff', 0.25);

  fillEllipse(ctx, x, y, rx + 5, ry + 4, dusk ? '#3a3a34' : '#6b5c3e');
  fillEllipse(ctx, x, y, rx + 3, ry + 2.5, dusk ? '#4a4a40' : '#7d6c48');
  const pr = rng(77);
  for (let i = 0; i < 40; i++) {
    const a = pr.f(0, 6.28), d = pr.f(0.92, 1.12);
    fillEllipse(ctx, x + Math.cos(a) * rx * d, y + Math.sin(a) * ry * d,
      pr.f(1, 2.4), pr.f(0.8, 1.6), pr.chance(0.5) ? '#8a8276' : '#a49a8a');
  }
  fillEllipse(ctx, x, y, rx, ry, deep);
  fillEllipse(ctx, x, y + ry * 0.12, rx * 0.94, ry * 0.8, midC);
  ctx.globalAlpha = dusk ? 0.4 : 0.55;
  fillEllipse(ctx, x + 2, y - ry * 0.42, rx * 0.72, ry * 0.3, sky);
  ctx.globalAlpha = 1;
  if (dusk) {
    for (let i = 0; i < 5; i++) {
      const yy = y - ry * 0.3 + i * 2.2;
      const w = (5 - Math.abs(i - 2)) * 2 + Math.sin(t * 2 + i) * 2;
      ctx.fillStyle = rgba('#ffe6b4', 0.3 - i * 0.03);
      ctx.fillRect(Math.round(x + rx * 0.3 - w / 2), Math.round(yy), Math.round(w), 1);
    }
  }
  for (let i = 0; i < 44; i++) {
    const a = (i / 44) * Math.PI * 2;
    px(ctx, x + Math.cos(a) * rx * 0.97, y + Math.sin(a) * ry * 0.97, shallow);
  }
  for (let i = 0; i < 18; i++) {
    const ph = i * 1.37;
    const yy = y - ry * 0.7 + ((i * 2.1 + Math.sin(t * 0.6 + ph) * 1.5) % (ry * 1.7));
    const dy = (yy - y) / ry;
    const hw = Math.sqrt(Math.max(0, 1 - dy * dy)) * rx * 0.9;
    const w = 3 + Math.sin(t * 2.2 + ph) * 3;
    if (w < 1) continue;
    ctx.fillStyle = rgba(dusk ? '#ffca8a' : '#d8f4f4', 0.26 + 0.2 * Math.sin(t * 3 + ph));
    ctx.fillRect(Math.round(x + Math.sin(t * 0.8 + ph * 2.2) * hw * 0.6 - w / 2), Math.round(yy), Math.round(w), 1);
  }
  // reeds
  const rr = rng(21);
  for (let i = 0; i < 16; i++) {
    const bx = x + rx * rr.f(-1.15, -0.5);
    const by = y + rr.f(-ry * 0.5, ry * 0.7);
    const hgt = rr.f(7, 19);
    const sw = Math.sin(t * 1.3 + i) * 1.6;
    const c = P.canopy === 'bare' ? '#8d8256' : dusk ? '#2c4a42' : '#3f7a44';
    for (let k = 0; k < hgt; k++) {
      const f = k / hgt;
      ctx.fillStyle = k > hgt - 4 ? mix(c, '#b8a04a', 0.6) : c;
      ctx.fillRect(Math.round(bx + sw * f * f), Math.round(by - k), 1, 1);
    }
  }
  const lx = x + rx * 0.42, ly = y + ry * 0.16 + Math.sin(t * 0.9) * 0.6;
  fillEllipse(ctx, lx, ly, 7, 4, dusk ? '#2e4a3c' : '#3f8a4a');
  fillEllipse(ctx, lx - 1, ly - 0.6, 5, 2.6, dusk ? '#3e5a4a' : '#5aa85c');
  ctx.fillStyle = dusk ? '#1e3830' : '#2f6a3c';
  ctx.fillRect(Math.round(lx + 3), Math.round(ly), 4, 1);
  fillEllipse(ctx, lx - 2, ly - 3, 2.4, 2, '#f0e4f8');
  px(ctx, lx - 2, ly - 3, '#f2d46a');

  if (opts.ripples) {
    for (const rp of opts.ripples) {
      const k = rp.t / rp.life;
      if (k > 1) continue;
      ctx.globalAlpha = (1 - k) * 0.7;
      const rr2 = lerp(2, rp.max, k);
      ctx.fillStyle = '#e4ffff';
      for (let i = 0; i < 28; i++) {
        const a = (i / 28) * Math.PI * 2;
        const px_ = rp.x + Math.cos(a) * rr2;
        const py_ = rp.y + Math.sin(a) * rr2 * 0.32;
        const dx = (px_ - PLACES.pond.x) / rx, dy = (py_ - y) / ry;
        if (dx * dx + dy * dy > 1) continue;
        ctx.fillRect(Math.round(px_ - PLACES.pond.x + x), Math.round(py_), 1, 1);
      }
      ctx.globalAlpha = 1;
    }
  }
}

/* ----------------------------------------------------------- the flowerbed */

export function drawBed(ctx, vx, P, t, opts = {}) {
  const { y, rx, ry } = PLACES.bed;
  const x = vx;
  const wet = clamp(opts.wet || 0, 0, 1);
  const grown = clamp(opts.grown || 0, 0, 1);
  const night = opts.night;
  const base = mix(night ? '#3a2e26' : '#6b4a32', night ? '#241c18' : '#3e2a1c', wet * 0.8);
  const lo = shade(base, -0.28), hi = shade(base, 0.2);
  fillEllipse(ctx, x, y, rx + 3, ry + 2.5, shade(base, -0.18));
  fillEllipse(ctx, x, y, rx, ry, base);
  fillEllipse(ctx, x, y - ry * 0.16, rx * 0.9, ry * 0.7, hi);
  const rr = rng(303);
  for (let i = 0; i < 9; i++) {
    const fy = y - ry * 0.8 + (i / 9) * ry * 1.7;
    const dy = (fy - y) / ry;
    const hw = Math.sqrt(Math.max(0, 1 - dy * dy)) * rx;
    ctx.fillStyle = rgba(lo, 0.7);
    ctx.fillRect(Math.round(x - hw), Math.round(fy), Math.round(hw * 2), 1);
  }
  for (let i = 0; i < 80; i++) {
    const a = rr.f(0, 6.28), d = Math.sqrt(rr.f()) * 0.95;
    fillEllipse(ctx, x + Math.cos(a) * rx * d, y + Math.sin(a) * ry * d,
      rr.f(0.8, 2.2), rr.f(0.6, 1.4), rr.chance(0.5) ? lo : hi);
  }
  if (wet > 0.05) {
    ctx.globalAlpha = wet * 0.35;
    fillEllipse(ctx, x, y, rx * 0.92, ry * 0.85, night ? '#2a2a4a' : '#2e2418');
    ctx.globalAlpha = 1;
  }
  // whatever is planted there, rising with how well it has been watered
  const stalks = 16;
  for (let i = 0; i < stalks; i++) {
    const g = clamp(grown * 1.4 - (i % 5) * 0.06, 0, 1);
    if (g <= 0.02) continue;
    const sx = x - rx * 0.86 + (i / (stalks - 1)) * rx * 1.72 + rr.f(-2, 2);
    const sy = y + Math.sin((i / stalks) * Math.PI) * ry * 0.3 - ry * 0.1;
    const hgt = 3 + g * 14;
    const sway = Math.sin(t * 1.4 + i) * (1 + g);
    const stem = night ? '#2c4a34' : '#3f7a3a';
    for (let k = 0; k < hgt; k++) {
      const f = k / hgt;
      ctx.fillStyle = k > hgt - 3 ? shade(stem, 0.2) : stem;
      ctx.fillRect(Math.round(sx + sway * f * f), Math.round(sy - k), 1, 1);
      if (k === Math.floor(hgt * 0.5) && g > 0.4) {
        fillEllipse(ctx, sx + sway * 0.25 + (i % 2 ? 2 : -2), sy - k, 2, 1.3, shade(stem, 0.1));
      }
    }
    if (g > 0.6) {
      const fx = sx + sway, fy = sy - hgt;
      const c = i % 3 === 0 ? '#f0e4f8' : i % 3 === 1 ? '#f8d8e4' : '#fff0b4';
      fillEllipse(ctx, fx, fy, 2.4, 2, night ? shade(c, -0.45) : c);
      px(ctx, fx, fy, '#e0b048');
    }
  }
}

/* --------------------------------------------------------- the small props */

export function drawSignpost(ctx, vx, P, t, night) {
  const gy = groundY(PLACES.sign.x) + 14;
  const wood = night ? '#4a3a2e' : '#8a6a44';
  const woodHi = shade(wood, 0.25), woodLo = shade(wood, -0.3);
  for (let i = 0; i < 26; i++) {
    ctx.fillStyle = i % 5 === 0 ? woodHi : wood;
    ctx.fillRect(Math.round(vx - 1), Math.round(gy - i), 3, 1);
  }
  ctx.fillStyle = woodLo;
  ctx.fillRect(Math.round(vx + 1), Math.round(gy - 26), 1, 26);
  // the board, weathered
  rect(ctx, vx - 11, gy - 30, 22, 7, wood);
  hline(ctx, vx - 11, vx + 10, gy - 30, woodHi);
  hline(ctx, vx - 11, vx + 10, gy - 24, woodLo);
  ctx.fillStyle = rgba(night ? '#8a8a9a' : '#4a3828', 0.7);
  for (let i = 0; i < 5; i++) ctx.fillRect(Math.round(vx - 7 + i * 3), Math.round(gy - 28), 2, 1);
  for (let i = 0; i < 4; i++) ctx.fillRect(Math.round(vx - 6 + i * 3), Math.round(gy - 26), 2, 1);
}

export function drawLog(ctx, vx, P, t, night) {
  const gy = groundY(PLACES.log.x) + 12;
  const bark = night ? '#3a2e26' : '#6a513a';
  const barkHi = shade(bark, 0.22), barkLo = shade(bark, -0.3);
  const L = 44, R = 5.5;
  ctx.globalAlpha = 0.2;
  fillEllipse(ctx, vx, gy + 2, L * 0.55, 3, '#1b2a16');
  ctx.globalAlpha = 1;
  for (let i = -L / 2; i <= L / 2; i++) {
    const t2 = Math.abs(i) / (L / 2);
    const rr = R * (1 - t2 * t2 * 0.18);
    fillEllipse(ctx, vx + i, gy - rr, rr * 0.55 + 1, rr + 1, barkLo);
  }
  for (let i = -L / 2; i <= L / 2; i++) {
    const t2 = Math.abs(i) / (L / 2);
    const rr = R * (1 - t2 * t2 * 0.18);
    fillEllipse(ctx, vx + i, gy - rr, rr * 0.5, rr, bark);
    if (i % 7 === 0) fillEllipse(ctx, vx + i, gy - rr * 1.4, rr * 0.3, rr * 0.4, barkHi);
  }
  // cut end with rings
  fillEllipse(ctx, vx + L / 2, gy - R, R * 0.66 + 1, R + 1, barkLo);
  fillEllipse(ctx, vx + L / 2, gy - R, R * 0.6, R * 0.92, night ? '#5a4a3a' : '#c0a072');
  for (let k = 1; k < 4; k++) {
    ctx.fillStyle = rgba(night ? '#3a3026' : '#8a6a44', 0.6);
    for (let a = 0; a < 20; a++) {
      const ang = (a / 20) * Math.PI * 2;
      px(ctx, vx + L / 2 + Math.cos(ang) * R * 0.15 * k, gy - R + Math.sin(ang) * R * 0.22 * k);
    }
  }
  // moss on the shaded side
  if (!night) {
    for (let i = 0; i < 40; i++) {
      const rx2 = vx + rng(9 + i).f(-L / 2, L / 2);
      px(ctx, rx2, gy - 1 - rng(i * 3).f(0, 2), '#5a8a46');
    }
  }
}

export function drawViewWall(ctx, vx, P, t, night) {
  const gy = groundY(PLACES.view.x) + 10;
  const stone = night ? '#54545e' : '#a09a8c';
  const r = rng(515);
  for (let row = 0; row < 3; row++) {
    let x = vx - 46 + (row % 2) * 5;
    const y = gy - row * 5;
    while (x < vx + 46) {
      const w = r.f(7, 14);
      const c = mix(stone, r.chance(0.5) ? shade(stone, -0.3) : shade(stone, 0.22), r.f(0, 0.5));
      rect(ctx, x, y - 5, w - 1, 5, c);
      hline(ctx, x, x + w - 2, y - 5, shade(c, 0.2));
      hline(ctx, x, x + w - 2, y - 1, shade(c, -0.25));
      x += w;
    }
  }
  // grass and a small shrine jar at one end
  for (let i = 0; i < 26; i++) {
    ctx.fillStyle = night ? '#24422e' : '#4e7a34';
    ctx.fillRect(Math.round(vx - 46 + r.f(0, 92)), Math.round(gy - 1), 1, 2);
  }
}

export function drawBowl(ctx, vx, P, t, opts = {}) {
  const gy = groundY(PLACES.bowl.x) + 12;
  const night = opts.night;
  const tin = night ? '#5a6068' : '#b0a898';
  ctx.globalAlpha = 0.2;
  fillEllipse(ctx, vx, gy + 1, 7, 2, '#1b2a16');
  ctx.globalAlpha = 1;
  fillEllipse(ctx, vx, gy - 2, 7, 3.4, shade(tin, -0.35));
  fillEllipse(ctx, vx, gy - 3, 6.4, 2.8, tin);
  fillEllipse(ctx, vx, gy - 3, 5, 2, shade(tin, -0.45));
  if (opts.food > 0) {
    const f = clamp(opts.food, 0, 1);
    fillEllipse(ctx, vx, gy - 3.4, 4.6 * f, 1.8 * f, night ? '#6a5236' : '#b98a4e');
    const rr = rng(88);
    for (let i = 0; i < 9 * f; i++) {
      px(ctx, vx + rr.f(-4, 4) * f, gy - 4 + rr.f(-0.6, 0.6), night ? '#7a6244' : '#d8a868');
    }
  }
}

export function drawRocks(ctx, vx, P, t, night) {
  const gy = groundY(PLACES.rocks.x) + 12;
  const stone = night ? '#4e4e58' : '#9a9488';
  const r = rng(616);
  for (const [dx, sc] of [[-16, 1.1], [0, 1.5], [14, 0.9], [24, 0.6]]) {
    const w = 9 * sc, h = 6 * sc;
    const c = mix(stone, r.chance(0.5) ? shade(stone, -0.28) : shade(stone, 0.2), r.f(0, 0.5));
    fillEllipse(ctx, vx + dx, gy - h * 0.4, w + 1, h + 1, shade(c, -0.4));
    fillEllipse(ctx, vx + dx, gy - h * 0.5, w, h, c);
    fillEllipse(ctx, vx + dx - w * 0.3, gy - h * 0.9, w * 0.45, h * 0.35, shade(c, 0.22));
    if (!night) {
      for (let i = 0; i < 6; i++) px(ctx, vx + dx + r.f(-w, w), gy - h * 0.2 + r.f(-1, 1), '#6a8a4a');
    }
  }
}

/** A small stone, and later the mound settling under the grass. */
export function drawGrave(ctx, vx, P, t, opts = {}) {
  const gy = groundY(PLACES.grave.x) + 12;
  const night = opts.night;
  const age = clamp(opts.age || 0, 0, 1);      // 0 fresh earth, 1 long grassed over
  const soil = mix('#5a4030', P.grassDark, age);
  const stone = night ? '#5c5c66' : '#b4aea0';
  // the mound
  fillEllipse(ctx, vx, gy, 15, 5.5, shade(soil, -0.25));
  fillEllipse(ctx, vx, gy - 1.4, 14, 4.6, soil);
  if (age > 0.2) {
    const rr = rng(404);
    for (let i = 0; i < 40 * age; i++) {
      const a = rr.f(0, 6.28), d = Math.sqrt(rr.f());
      ctx.fillStyle = rr.chance(0.5) ? P.grass : P.grassHi;
      ctx.fillRect(Math.round(vx + Math.cos(a) * 14 * d), Math.round(gy - 2 + Math.sin(a) * 4 * d), 1, 2);
    }
  }
  // the stone, set upright at the head of it
  const sx = vx - 9;
  fillEllipse(ctx, sx, gy - 1, 5.5, 2.4, shade(stone, -0.4));
  rect(ctx, sx - 4, gy - 11, 8, 10, stone);
  fillEllipse(ctx, sx, gy - 11, 4, 3.2, stone);
  rect(ctx, sx - 4, gy - 11, 2, 10, shade(stone, 0.2));
  rect(ctx, sx + 2, gy - 11, 2, 10, shade(stone, -0.22));
  ctx.fillStyle = rgba(night ? '#8a8a9a' : '#6a6458', 0.8);
  ctx.fillRect(Math.round(sx - 2), Math.round(gy - 7), 4, 1);
  ctx.fillRect(Math.round(sx - 1), Math.round(gy - 5), 2, 1);
  // whatever anyone left there
  if (opts.offering > 0) {
    const n = Math.round(opts.offering);
    const rr = rng(77 + n);
    for (let i = 0; i < n; i++) {
      const ox = vx + rr.f(-11, 11), oy = gy - 1 + rr.f(-2, 1);
      const c = i % 3 === 0 ? '#f8d8e4' : i % 3 === 1 ? '#fff0b4' : '#c8b4ff';
      fillEllipse(ctx, ox, oy, 2.2, 1.6, night ? shade(c, -0.5) : c);
      px(ctx, ox, oy, '#e0b048');
    }
  }
}

/* -------------------------------------------------- the watering can (kept) */

export function drawCan(ctx, x, y, o = {}) {
  const s = o.scale || 1;
  const tilt = clamp(o.tilt || 0, 0, 1);
  const fill = clamp(o.fill === undefined ? 0 : o.fill, 0, 1);
  const sx = o.flip ? 1 : -1;
  const phi = tilt * 1.15;
  const bw = 17 * s, bh = 16 * s;
  const night = o.night;
  const tin = night ? '#5c6a74' : '#93a8b6';
  const tinHi = night ? '#8494a0' : '#cfdee6';
  const tinHi2 = night ? '#a8b8c0' : '#f0f8fb';
  const tinLo = night ? '#3c4a54' : '#5e7381';
  const tinDk = night ? '#242e36' : '#36464f';
  const ink = '#212d34';
  const band = night ? '#2a5560' : '#3f7f8c';
  const bandHi = night ? '#4a7a82' : '#6fb4ba';

  const vx = sx * Math.sin(phi), vy = -Math.cos(phi);
  const ux = -vy, uy = vx;
  const pivot = bh * 1.62;
  const px0 = x, py0 = y - pivot;
  const P2 = (lx, ly) => [px0 + ux * lx + vx * (ly - pivot), py0 + uy * lx + vy * (ly - pivot)];
  const halfW = (t) => bw * 0.5 * lerp(0.86, 1.02, Math.pow(t, 0.8));
  const flat = 0.27 + 0.25 * Math.abs(Math.sin(phi));

  if (o.shadow !== false) {
    ctx.globalAlpha = 0.22;
    fillEllipse(ctx, x + 1, y + 1, bw * 0.6, 2.4 * s, '#1b2a16');
    ctx.globalAlpha = 1;
  }
  const sp = [[sx * bw * 0.34, bh * 0.16], [sx * bw * 0.92, bh * 0.36], [sx * bw * 1.38, bh * 0.74]];
  const bez = (t) => {
    const mt = 1 - t;
    return [
      mt * mt * sp[0][0] + 2 * mt * t * sp[1][0] + t * t * sp[2][0],
      mt * mt * sp[0][1] + 2 * mt * t * sp[1][1] + t * t * sp[2][1],
    ];
  };
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i <= 16; i++) {
      const t = i / 16;
      const [lx, ly] = bez(t);
      const [wx, wy] = P2(lx, ly);
      const rr = lerp(2.9, 1.8, t) * s;
      if (pass === 0) fillEllipse(ctx, wx, wy, rr + 1, rr + 1, ink);
      else {
        fillEllipse(ctx, wx, wy, rr, rr, tin);
        fillEllipse(ctx, wx - rr * 0.3, wy - rr * 0.35, rr * 0.45, rr * 0.4, tinHi);
      }
    }
  }
  const [rlx, rly] = bez(1);
  const [rx_, ry_] = P2(rlx, rly);
  const rr2 = 4.3 * s;
  const rax = ux * 0.35 + vx * 0.94, ray = uy * 0.35 + vy * 0.94;
  fillEllipse(ctx, rx_ + rax, ry_ + ray, rr2 + 1, rr2 * 0.78 + 1, ink);
  fillEllipse(ctx, rx_ + rax, ry_ + ray, rr2, rr2 * 0.72, tinLo);
  fillEllipse(ctx, rx_ + rax - rr2 * 0.3, ry_ + ray - rr2 * 0.28, rr2 * 0.55, rr2 * 0.36, tin);
  ctx.fillStyle = tinDk;
  for (let i = 0; i < 6; i++) {
    ctx.fillRect(Math.round(rx_ + rax - rr2 * 0.55 + (i % 3) * 1.8 * s),
                 Math.round(ry_ + ray - rr2 * 0.3 + Math.floor(i / 3) * 1.8 * s), 1, 1);
  }
  const N = Math.round(bh);
  for (let i = 0; i <= N; i++) {
    const [wx, wy] = P2(0, i);
    const rr3 = halfW(i / N);
    fillEllipse(ctx, wx, wy, rr3 + 1, rr3 * flat + 1.2, ink);
  }
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const [wx, wy] = P2(0, i);
    const rr3 = halfW(t);
    const ry2 = Math.max(0.9, rr3 * flat);
    fillEllipse(ctx, wx, wy, rr3, ry2, tin);
    fillEllipse(ctx, wx - rr3 * 0.42, wy - ry2 * 0.1, rr3 * 0.26, ry2 * 0.72, tinHi);
    fillEllipse(ctx, wx + rr3 * 0.58, wy, rr3 * 0.2, ry2 * 0.66, tinLo);
    if (t > 0.38 && t < 0.56) {
      fillEllipse(ctx, wx, wy, rr3 * 0.99, ry2 * 0.95, band);
      fillEllipse(ctx, wx - rr3 * 0.42, wy, rr3 * 0.22, ry2 * 0.6, bandHi);
    }
    if (t > 0.9) fillEllipse(ctx, wx - rr3 * 0.3, wy - ry2 * 0.3, rr3 * 0.3, ry2 * 0.4, tinHi2);
  }
  const [tx, ty] = P2(0, bh);
  const tr = halfW(1);
  fillEllipse(ctx, tx, ty, tr + 1, tr * flat + 1, ink);
  fillEllipse(ctx, tx, ty, tr, tr * flat, tinDk);
  if (fill > 0.02) {
    const slosh = Math.sin((o.t || 0) * 4.5) * fill * 1.1;
    const wr = tr * (0.42 + 0.56 * fill);
    fillEllipse(ctx, tx + slosh, ty + tr * flat * (1 - fill) * 0.5, wr, wr * flat * 0.92, night ? '#2a6a90' : '#3fa6d8');
    fillEllipse(ctx, tx + slosh - wr * 0.3, ty + tr * flat * (1 - fill) * 0.5 - 0.4, wr * 0.5, wr * flat * 0.4, night ? '#6aa8c0' : '#8fdcf2');
  }
  ctx.fillStyle = tinHi;
  for (let i = 0; i < 30; i++) {
    const a = (i / 30) * Math.PI * 2;
    ctx.fillRect(Math.round(tx + Math.cos(a) * tr), Math.round(ty + Math.sin(a) * tr * flat), 1, 1);
  }
  const h0 = [-sx * bw * 0.34, bh * 0.94], h1 = [-sx * bw * 0.1, bh * 1.72], h2 = [sx * bw * 0.36, bh * 0.92];
  const hbez = (t) => {
    const mt = 1 - t;
    return [
      mt * mt * h0[0] + 2 * mt * t * h1[0] + t * t * h2[0],
      mt * mt * h0[1] + 2 * mt * t * h1[1] + t * t * h2[1],
    ];
  };
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i <= 22; i++) {
      const [lx, ly] = hbez(i / 22);
      const [wx, wy] = P2(lx, ly);
      if (pass === 0) fillEllipse(ctx, wx, wy, 1.9 * s, 1.9 * s, ink);
      else fillEllipse(ctx, wx, wy, 1 * s, 1 * s, i < 11 ? tinHi : tin);
    }
  }
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i <= 12; i++) {
      const a = -0.9 + (i / 12) * 1.8;
      const [wx, wy] = P2(-sx * (bw * 0.46 + Math.cos(a) * bw * 0.2), bh * 0.62 + Math.sin(a) * bh * 0.26);
      if (pass === 0) fillEllipse(ctx, wx, wy, 1.8 * s, 1.8 * s, ink);
      else fillEllipse(ctx, wx, wy, 0.9 * s, 0.9 * s, tin);
    }
  }
  return { spout: { x: rx_ + rax * 2, y: ry_ + ray * 2 } };
}

/* ------------------------------------------------------------------ trees */

export function buildTree(seed = 5150, opts = {}) {
  const r = rng(seed);
  const segs = [], leaves = [], flowers = [];
  const spread = opts.spread || 1;
  const grow = (x, y, ang, len, thick, depth, order) => {
    const steps = Math.max(3, Math.round(len / 2));
    let px_ = x, py_ = y;
    const curve = r.f(-0.25, 0.25);
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const a = ang + curve * t;
      const nx = px_ + Math.cos(a) * (len / steps);
      const ny = py_ + Math.sin(a) * (len / steps);
      segs.push({ x0: px_, y0: py_, x1: nx, y1: ny, th: lerp(thick, thick * 0.55, t), depth,
                  order: order + (t * 0.85) / (depth + 1) });
      px_ = nx; py_ = ny;
    }
    const endOrder = order + 0.85 / (depth + 1);
    if (depth >= 2) {
      const n = r.i(3, 7);
      for (let i = 0; i < n; i++) {
        const a2 = r.f(0, 6.28), d = r.f(0, 6);
        leaves.push({ x: px_ + Math.cos(a2) * d, y: py_ + Math.sin(a2) * d * 0.8,
                      r: r.f(2.4, 4.6), tone: r.f(), order: endOrder + r.f(0.01, 0.08), ph: r.f(0, 6.28) });
      }
    }
    if (depth < 4 && len > 5) {
      const n = depth === 0 ? 3 : r.i(2, 3);
      for (let i = 0; i < n; i++) {
        const sp = lerp(0.85, 0.42, depth / 4) * spread;
        const a2 = ang + r.f(-sp, sp) + (i - (n - 1) / 2) * 0.42;
        grow(px_, py_, a2 - Math.abs(a2) * 0.05, len * r.f(0.56, 0.76), thick * 0.62, depth + 1, endOrder);
      }
    } else {
      const n = r.i(5, 10);
      for (let i = 0; i < n; i++) {
        const a2 = r.f(0, 6.28), d = r.f(0, 8);
        leaves.push({ x: px_ + Math.cos(a2) * d, y: py_ + Math.sin(a2) * d * 0.8,
                      r: r.f(2.2, 4.4), tone: r.f(), order: endOrder + r.f(0.02, 0.12), ph: r.f(0, 6.28) });
      }
      const fn = r.i(1, 3);
      for (let i = 0; i < fn; i++) {
        flowers.push({ x: px_ + r.f(-8, 8), y: py_ + r.f(-4, 9),
                       order: endOrder + r.f(0.14, 0.34), ph: r.f(0, 6.28), s: r.f(0.85, 1.35) });
      }
    }
  };
  grow(0, 0, -Math.PI / 2 + 0.06, opts.trunk || 30, opts.thick || 6, 0, 0);
  const maxOrder = Math.max(
    ...segs.map((s) => s.order), ...leaves.map((l) => l.order), ...flowers.map((f) => f.order));
  segs.sort((a, b) => a.depth - b.depth);
  return { segs, leaves, flowers, maxOrder };
}

export function drawTree(ctx, x, y, tree, growth, t, P, opts = {}) {
  const g = clamp(growth, 0, 1);
  const scale = lerp(0.18, 1, Math.pow(g, 0.55)) * (opts.scale || 1);
  const reach = g * tree.maxOrder * 1.18;
  const night = opts.night;
  const season = opts.season || 'green';   // green | autumn | bare | blossom | pea
  const bark = night ? '#2e2620' : '#5a4632';
  const barkHi = night ? '#463a2e' : '#7a6144';
  const barkLo = night ? '#1c1814' : '#3c2e20';
  const LEAF = {
    green: ['#2f6b3a', '#43884a', '#63a85a'],
    autumn: ['#8a5a22', '#c08a2e', '#d8b44a'],
    blossom: ['#e08ab0', '#f4a8c8', '#ffd0e0'],
    pea: ['#2f6b4a', '#43885a', '#63a86a'],
    night: ['#24503e', '#2e6a4c', '#3f8a5c'],
  };
  const leafC = night ? LEAF.night : (LEAF[season] || LEAF.green);
  const sway = Math.sin(t * 0.9) * 0.8 + Math.sin(t * 1.7) * 0.3;
  const put = (px_, py_) => {
    const h = -py_ * scale / 40;
    return [x + px_ * scale + sway * h * h * 1.4, y + py_ * scale];
  };
  for (const s of tree.segs) {
    if (s.order > reach) continue;
    const [X0, Y0] = put(s.x0, s.y0);
    const [X1, Y1] = put(s.x1, s.y1);
    const th = Math.max(1, s.th * scale);
    const steps = Math.max(1, Math.round(Math.hypot(X1 - X0, Y1 - Y0)));
    for (let i = 0; i <= steps; i++) {
      const tt = i / steps;
      const px_ = lerp(X0, X1, tt), py_ = lerp(Y0, Y1, tt);
      if (th <= 1.2) px(ctx, px_, py_, bark);
      else {
        fillEllipse(ctx, px_, py_, th / 2 + 0.5, th / 2 + 0.5, bark);
        fillEllipse(ctx, px_ - th * 0.18, py_, th * 0.22, th * 0.4, barkHi);
        fillEllipse(ctx, px_ + th * 0.3, py_, th * 0.16, th * 0.36, barkLo);
      }
    }
  }
  if (season !== 'bare') {
    for (const l of tree.leaves) {
      if (l.order > reach) continue;
      const pop = clamp((reach - l.order) * 6, 0, 1);
      const [X, Y] = put(l.x + Math.sin(t * 1.4 + l.ph) * 0.6, l.y);
      const rr = l.r * scale * pop;
      if (rr < 0.6) continue;
      const c = leafC[l.tone < 0.35 ? 0 : l.tone < 0.75 ? 1 : 2];
      fillEllipse(ctx, X, Y, rr * 1.15, rr * 0.8, c);
      if (rr > 1.6) fillEllipse(ctx, X - rr * 0.3, Y - rr * 0.25, rr * 0.45, rr * 0.3, shade(c, 0.2));
    }
  }
  if (opts.blossoms) {
    for (const f of tree.flowers) {
      if (f.order > reach) continue;
      const pop = clamp((reach - f.order) * 4, 0, 1) * clamp(opts.blossoms, 0, 1);
      if (pop < 0.05) continue;
      const [X, Y] = put(f.x + Math.sin(t * 1.1 + f.ph) * 0.8, f.y);
      drawPeaFlower(ctx, X, Y, f.s * scale * 2.6 * pop, t + f.ph, night ? { deep: '#2a2070', mid: '#3e2f9a', hi: '#6a58c8', pale: '#a898d8' } : {});
    }
  }
  return { top: y - 40 * scale };
}

export function drawPeaFlower(ctx, x, y, r, t = 0, o = {}) {
  if (r < 0.8) { px(ctx, x, y, o.mid || '#6f5ae0'); return; }
  const deep = o.deep || '#4536b0';
  const midC = o.mid || '#6a55d8';
  const hi = o.hi || '#9d8bee';
  const pale = o.pale || '#d8cffa';
  fillEllipse(ctx, x, y, r * 1.25, r * 1.05, deep);
  fillEllipse(ctx, x, y - r * 0.12, r * 1.05, r * 0.85, midC);
  fillEllipse(ctx, x - r * 0.3, y - r * 0.35, r * 0.5, r * 0.4, hi);
  fillEllipse(ctx, x + r * 0.12, y + r * 0.18, r * 0.42, r * 0.34, pale);
  fillEllipse(ctx, x + r * 0.12, y + r * 0.22, r * 0.22, r * 0.18, o.core || '#f4e08c');
  fillEllipse(ctx, x + r * 0.55, y + r * 0.5, r * 0.4, r * 0.3, deep);
  if (r > 2) {
    ctx.fillStyle = rgba('#2a1f6e', 0.6);
    ctx.fillRect(Math.round(x - r * 0.9), Math.round(y + r * 0.55), Math.max(1, Math.round(r * 1.2)), 1);
  }
}
