/* ============================================================================
 *  intro.js — a butterfly pea blossom, big enough to cover the whole world.
 *  Swipe it away petal by petal to begin.
 * ==========================================================================*/

import {
  rng, clamp, lerp, mix, shade, rgba, makeCanvas,
  fillPoly, fillEllipse, px, line, ditherOverlay, BAYER8,
} from './core.js';
import { W, H } from './vista.js';

const BLUE = {
  deepest: '#170f4e',
  deep: '#241873',
  mid: '#33249c',
  lift: '#4331bc',
  hi: '#5a45d4',
  pale: '#7a63e4',
  wash: '#b9a8f4',
  cream: '#f4efdc',
  gold: '#f2d868',
  vein: '#140c44',
};

/** Outline of one petal in local space: base at (0,0) pointing +x. */
function petalPoly(len, wid, o = {}) {
  const notch = o.notch || 0;
  const skew = o.skew || 0;
  const pts = [];
  const N = 46;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    let hw = wid * Math.pow(Math.sin(Math.pow(t, 0.62) * Math.PI), 0.78);
    if (notch) {
      const d = (t - 1) / 0.13;
      hw *= 1 - notch * Math.exp(-d * d);
    }
    hw *= 1 + skew * (t - 0.5);
    pts.push([t * len, -hw + (o.curve || 0) * Math.sin(t * Math.PI) * wid * 0.3]);
  }
  for (let i = N; i >= 0; i--) {
    const t = i / N;
    let hw = wid * Math.pow(Math.sin(Math.pow(t, 0.62) * Math.PI), 0.78);
    if (notch) {
      const d = (t - 1) / 0.13;
      hw *= 1 - notch * Math.exp(-d * d);
    }
    hw *= 1 - skew * (t - 0.5);
    pts.push([t * len, hw + (o.curve || 0) * Math.sin(t * Math.PI) * wid * 0.3]);
  }
  return pts;
}

function place(pts, bx, by, ang) {
  const c = Math.cos(ang), s = Math.sin(ang);
  return pts.map(([x, y]) => [bx + x * c - y * s, by + x * s + y * c]);
}

/** Bake one petal into its own canvas so it can be flicked away alone. */
function bakePetal(spec, seed) {
  const { canvas, ctx } = makeCanvas(W, H);
  const r = rng(seed);
  const base = petalPoly(spec.len, spec.wid, spec);
  const poly = place(base, spec.x, spec.y, spec.ang);

  // A real butterfly pea petal is pale at the margin and deepens toward the
  // throat, with dark veins fanning out of the base.
  const shades = spec.dark
    ? ['#5342cc', '#4b3ac0', '#4231b2', '#3a2aa2', '#332493']
    : ['#8270ee', '#7261e6', '#6252dc', '#5544cc', '#4a39bd', '#4231b0', '#3b2ba4'];
  for (let i = 0; i < shades.length; i++) {
    const k = i / (shades.length - 1);
    const p = place(
      petalPoly(spec.len * (1 - k * 0.09), spec.wid * (1 - k * 0.5), spec),
      spec.x, spec.y, spec.ang
    );
    fillPoly(ctx, p, shades[i]);
  }
  // dithered seams so the bands read as pixel art rather than vector
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i];
    if (i === 0) ctx.moveTo(p[0], p[1]); else ctx.lineTo(p[0], p[1]);
  }
  ctx.closePath();
  ctx.clip();
  for (let i = 1; i < shades.length; i++) {
    const k = i / (shades.length - 1);
    const p = place(
      petalPoly(spec.len * (1 - k * 0.09) * 1.02, spec.wid * (1 - k * 0.5) * 1.12, spec),
      spec.x, spec.y, spec.ang
    );
    ctx.save();
    ctx.beginPath();
    for (let j = 0; j < p.length; j++) {
      if (j === 0) ctx.moveTo(p[j][0], p[j][1]); else ctx.lineTo(p[j][0], p[j][1]);
    }
    ctx.closePath();
    ctx.clip();
    ditherOverlay(ctx, 0, 0, W, H, shades[i], 0.42);
    ctx.restore();
  }

  // veins radiating from the base
  const veins = spec.veins === undefined ? 15 : spec.veins;
  for (let i = 0; i < veins; i++) {
    const t = (i / (veins - 1)) * 2 - 1;
    const a = spec.ang + t * 0.54 + r.f(-0.02, 0.02);
    const len = spec.len * r.f(0.7, 1.0);
    let vx = spec.x, vy = spec.y;
    for (let sN = 0; sN < len; sN++) {
      const f = sN / len;
      const wob = Math.sin(sN * 0.045 + i) * 2.4 * f;
      vx = spec.x + Math.cos(a) * sN - Math.sin(a) * wob;
      vy = spec.y + Math.sin(a) * sN + Math.cos(a) * wob;
      ctx.fillStyle = rgba(BLUE.vein, 0.1 + 0.2 * Math.sin(f * Math.PI));
      ctx.fillRect(vx | 0, vy | 0, 1, 1);
      if (sN % 11 === 0 && f > 0.25) {
        ctx.fillStyle = rgba('#8f7ce8', 0.12);
        ctx.fillRect((vx | 0) + 1, vy | 0, 1, 1);
      }
    }
  }
  // fine silk texture
  for (let i = 0; i < 900; i++) {
    const t = r.f();
    const a = spec.ang + r.f(-0.62, 0.62);
    const d = spec.len * t;
    ctx.fillStyle = rgba(r.chance(0.5) ? '#8f7ce8' : '#1a1050', 0.09);
    ctx.fillRect(Math.round(spec.x + Math.cos(a) * d), Math.round(spec.y + Math.sin(a) * d), 1, 1);
  }
  // lit rim along the outer edge
  ctx.fillStyle = rgba('#a493f0', 0.34);
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i];
    ctx.fillRect(Math.round(p[0]), Math.round(p[1]), 1, 1);
  }
  ctx.restore();

  if (spec.throat) {
    // the unmistakable cream-and-gold throat of a butterfly pea
    const tx = spec.x + Math.cos(spec.ang) * spec.len * 0.46;
    const ty = spec.y + Math.sin(spec.ang) * spec.len * 0.46;
    const ca = Math.abs(Math.cos(spec.ang)), sa = Math.abs(Math.sin(spec.ang));
    const along = spec.len * 0.05, across = spec.len * 0.07;
    const ax = (v) => ca * v.l + sa * v.a;
    const ay = (v) => sa * v.l + ca * v.a;
    // pale rays fanning out of the throat across the whole petal
    for (let i = 0; i < 44; i++) {
      const a = r.f(0, 6.28);
      const l = spec.len * r.f(0.06, 0.3);
      ctx.fillStyle = rgba('#d8ccff', r.f(0.12, 0.34));
      for (let sN = across * 1.4; sN < l; sN++) {
        ctx.fillRect(Math.round(tx + Math.cos(a) * sN), Math.round(ty + Math.sin(a) * sN), 1, 1);
      }
    }
    // a dark halo ringing the throat, the way the real flower does it
    fillEllipse(ctx, tx, ty,
      ax({ l: along * 2.6, a: across * 2.2 }), ay({ l: along * 2.6, a: across * 2.2 }),
      rgba(BLUE.deepest, 0.42));
    for (let i = 0; i < 22; i++) {
      const a = spec.ang + r.f(-0.8, 0.8);
      const l = spec.len * r.f(0.08, 0.26);
      ctx.fillStyle = rgba(BLUE.wash, 0.34);
      for (let s = 0; s < l; s++) {
        ctx.fillRect(Math.round(tx + Math.cos(a) * s), Math.round(ty + Math.sin(a) * s), 1, 1);
      }
    }
    const rx = ax({ l: along, a: across }), ry = ay({ l: along, a: across });
    fillEllipse(ctx, tx, ty, rx * 1.45, ry * 1.45, rgba(BLUE.wash, 0.55));
    fillEllipse(ctx, tx, ty, rx, ry, BLUE.cream);
    fillEllipse(ctx, tx, ty, ax({ l: along * 0.72, a: across * 0.42 }),
      ay({ l: along * 0.72, a: across * 0.42 }), BLUE.gold);
    fillEllipse(ctx, tx - rx * 0.22, ty - ry * 0.22,
      ax({ l: along * 0.3, a: across * 0.18 }), ay({ l: along * 0.3, a: across * 0.18 }), '#fff8cc');
    // pollen freckles
    for (let i = 0; i < 30; i++) {
      const a = r.f(0, 6.28), d = Math.sqrt(r.f());
      ctx.fillStyle = r.chance(0.5) ? '#c8a83c' : '#fff0b0';
      ctx.fillRect(Math.round(tx + Math.cos(a) * rx * d * 0.9), Math.round(ty + Math.sin(a) * ry * d * 0.9), 1, 1);
    }
  }
  return { canvas, ctx, spec };
}

export class FlowerIntro {
  constructor() {
    const cx = W / 2;
    // Petal specs, back to front.
    this.specs = [
      { key: 'keelL', x: cx - 6, y: 176, ang: 2.72, len: 330, wid: 132, dark: true, curve: 0.18, veins: 11 },
      { key: 'keelR', x: cx + 6, y: 176, ang: 0.42, len: 330, wid: 132, dark: true, curve: -0.18, veins: 11 },
      { key: 'wingL', x: cx - 10, y: 232, ang: -2.36, len: 340, wid: 150, dark: true, notch: 0.1, veins: 13 },
      { key: 'wingR', x: cx + 10, y: 232, ang: -0.78, len: 340, wid: 150, dark: true, notch: 0.1, veins: 13 },
      { key: 'standard', x: cx, y: 330, ang: -Math.PI / 2, len: 352, wid: 214, notch: 0.2, throat: true, veins: 23 },
    ];
    this.petals = this.specs.map((s, i) => {
      const b = bakePetal(s, 900 + i * 31);
      return {
        ...b, x: 0, y: 0, vx: 0, vy: 0, shear: 0, alpha: 1, flying: false, dead: false,
        cx: s.x + Math.cos(s.ang) * s.len * 0.5, cy: s.y + Math.sin(s.ang) * s.len * 0.5,
      };
    });
    this.order = [4, 3, 2, 1, 0]; // front to back
    this.detached = 0;
    this.swipe = 0;
    this.t = 0;
    this.done = false;
    this.pointer = null;
    this.lastMove = 0;
    this.shards = [];
    this.hint = 0;
    this.veil = 1;
    this.r = rng(4711);
  }

  get progress() { return this.detached / this.petals.length; }

  /* --------------------------------------------------------------- input */
  down(x, y) { this.pointer = { x, y, px: x, py: y }; }
  move(x, y) {
    if (!this.pointer) return;
    const dx = x - this.pointer.px;
    const dy = y - this.pointer.py;
    const d = Math.hypot(dx, dy);
    this.pointer.px = x; this.pointer.py = y;
    this.swipe += d;
    this.lastDir = { x: dx, y: dy, d };
    this.lastMove = this.t;
    if (this.swipe > 62) {
      this.swipe = 0;
      this.detach(dx, dy, d);
    }
  }
  up() {
    // a decisive flick counts even if it was short
    if (this.pointer && this.lastDir && this.lastDir.d > 2 && this.swipe > 22) {
      this.swipe = 0;
      this.detach(this.lastDir.x, this.lastDir.y, this.lastDir.d);
    } else if (this.pointer && this.swipe < 6) {
      // a plain tap still nudges one loose, so nobody gets stuck
      this.tapCredit = (this.tapCredit || 0) + 1;
      if (this.tapCredit >= 2) { this.tapCredit = 0; this.detach(this.r.f(-1, 1), -1, 6); }
    }
    this.pointer = null;
  }

  detach(dx, dy, d) {
    const idx = this.order[this.detached];
    if (idx === undefined) return;
    const p = this.petals[idx];
    p.flying = true;
    const n = Math.max(1, Math.hypot(dx, dy));
    const speed = clamp(d * 8, 120, 430);
    p.vx = (dx / n) * speed + this.r.f(-20, 20);
    p.vy = (dy / n) * speed * 0.8 - 40 + this.r.f(-20, 20);
    p.spin = (dx > 0 ? 1 : -1) * this.r.f(0.6, 1.4);
    this.detached++;
    this.shatter(p, dx / n, dy / n);
    this.onDetach && this.onDetach(this.detached, this.petals.length);
    if (this.detached >= this.petals.length) this.closing = 0.001;
  }

  /** Sample the petal into flying pixel chunks — the dissolve. */
  shatter(p, nx, ny) {
    const step = 6;
    const img = p.ctx.getImageData(0, 0, W, H).data;
    for (let y = 0; y < H; y += step) {
      for (let x = 0; x < W; x += step) {
        const i = (y * W + x) * 4;
        if (img[i + 3] < 40) continue;
        if (this.r.chance(0.45)) continue;
        this.shards.push({
          x, y,
          vx: nx * this.r.f(60, 260) + this.r.f(-30, 30),
          vy: ny * this.r.f(60, 220) + this.r.f(-60, 10),
          g: this.r.f(40, 150),
          life: this.r.f(0.7, 1.6), age: 0,
          c: `rgb(${img[i]},${img[i + 1]},${img[i + 2]})`,
          s: this.r.chance(0.3) ? 4 : this.r.chance(0.5) ? 3 : 2,
        });
      }
    }
    if (this.shards.length > 2600) this.shards.splice(0, this.shards.length - 2600);
  }

  /* -------------------------------------------------------------- update */
  update(dt) {
    this.t += dt;
    this.hint += dt;
    for (const p of this.petals) {
      if (!p.flying || p.dead) continue;
      p.vy += 210 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.shear += p.spin * dt * 0.5;
      p.alpha -= dt * 0.75;
      if (p.alpha <= 0) p.dead = true;
    }
    for (let i = this.shards.length - 1; i >= 0; i--) {
      const s = this.shards[i];
      s.age += dt;
      if (s.age > s.life) { this.shards.splice(i, 1); continue; }
      s.vy += s.g * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
    }
    this.veil = lerp(this.veil, 1 - this.progress, dt * 5);
    if (this.closing !== undefined) {
      this.closing += dt;
      if (this.closing > 0.9 && this.shards.length === 0) this.done = true;
      if (this.closing > 2.2) this.done = true;
    }
  }

  /* ---------------------------------------------------------------- draw */
  draw(ctx) {
    // everything still attached sits perfectly still; flown petals tumble
    for (const p of this.petals) {
      if (p.dead) continue;
      if (!p.flying) {
        const breathe = Math.sin(this.t * 0.8) * 0.6;
        ctx.drawImage(p.canvas, 0, Math.round(breathe));
      } else {
        ctx.globalAlpha = clamp(p.alpha, 0, 1);
        ctx.save();
        ctx.transform(1, 0, p.shear, 1, Math.round(p.x), Math.round(p.y));
        ctx.drawImage(p.canvas, 0, 0);
        ctx.restore();
        ctx.globalAlpha = 1;
      }
    }
    // dissolving chunks
    for (const s of this.shards) {
      const k = s.age / s.life;
      ctx.globalAlpha = clamp(1.5 - k * 1.6, 0, 1);
      ctx.fillStyle = s.c;
      ctx.fillRect(Math.round(s.x), Math.round(s.y), s.s, s.s);
    }
    ctx.globalAlpha = 1;

    // the invitation: pollen drifting across in one clear direction
    if (this.detached < this.petals.length) {
      const sweep = (this.hint * 0.42) % 1;
      const idle = clamp((this.t - this.lastMove) / 1.2, 0, 1);
      for (let i = 0; i < 26; i++) {
        const t = (sweep + i / 26) % 1;
        const y = H * 0.52 + Math.sin(i * 1.7) * 60 + Math.sin(this.t * 1.3 + i) * 5;
        const x = lerp(-30, W + 30, t);
        const fade = Math.sin(t * Math.PI);
        ctx.globalAlpha = fade * 0.75 * idle;
        ctx.fillStyle = i % 3 === 0 ? '#fff4c0' : '#e0d8ff';
        const s = i % 4 === 0 ? 2 : 1;
        ctx.fillRect(Math.round(x), Math.round(y), s, s);
        ctx.globalAlpha = fade * 0.22 * idle;
        ctx.fillRect(Math.round(x - 4), Math.round(y), 3, 1);
        ctx.globalAlpha = 1;
      }
    }
  }
}
