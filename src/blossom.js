/* ============================================================================
 *  blossom.js — butterfly pea flowers, baked once and strewn by the hundred.
 *
 *  The opening and the ending are the same image: a screen packed with them.
 *  You push through it to begin, and it closes over again at the end.
 * ==========================================================================*/

import { rng, clamp, lerp, mix, rgba, makeCanvas, fillPoly, fillEllipse, px } from './core.js';
import { W, H } from './vista.js';

const BLUE = {
  edge: '#8270ee', mid: '#5f49d6', deep: '#4231b0', deepest: '#2a1d80',
  vein: '#1c1258', cream: '#f4efdc', gold: '#f2d868', pale: '#c8bcf6',
  leaf: '#3f7a48', leafLo: '#2c5c36', leafHi: '#5f9c58',
};

function petalPoly(len, wid, notch = 0) {
  const pts = [];
  const N = 22;
  for (let s = 0; s < 2; s++) {
    for (let i = 0; i <= N; i++) {
      const k = s === 0 ? i : N - i;
      const t = k / N;
      let hw = wid * Math.pow(Math.sin(Math.pow(t, 0.62) * Math.PI), 0.78);
      if (notch) {
        const d = (t - 1) / 0.14;
        hw *= 1 - notch * Math.exp(-d * d);
      }
      pts.push([t * len, s === 0 ? -hw : hw]);
    }
  }
  return pts;
}
const place = (pts, bx, by, ang) => {
  const c = Math.cos(ang), s = Math.sin(ang);
  return pts.map(([x, y]) => [bx + x * c - y * s, by + x * s + y * c]);
};

/** One blossom, baked into its own little canvas. */
export function bakeBlossom(D, seed, opts = {}) {
  const S = Math.ceil(D * 1.25);
  const { canvas, ctx } = makeCanvas(S, S);
  const r = rng(seed);
  const cx = S / 2, cy = S / 2;
  const rot = opts.rot === undefined ? r.f(0, 6.28) : opts.rot;
  const tint = opts.tint || 0;
  const C = (c) => (tint ? mix(c, opts.tintTo || '#ffffff', tint) : c);

  // the two wing petals behind
  for (const side of [-1, 1]) {
    const a = rot + side * 0.85 + Math.PI;
    const p = place(petalPoly(D * 0.42, D * 0.2), cx, cy, a);
    fillPoly(ctx, p, C(BLUE.deepest));
    const p2 = place(petalPoly(D * 0.38, D * 0.15), cx, cy, a);
    fillPoly(ctx, p2, C(BLUE.deep));
  }
  // the keel, tucked under
  {
    const a = rot + Math.PI;
    fillPoly(ctx, place(petalPoly(D * 0.3, D * 0.13), cx, cy, a), C(BLUE.deepest));
  }
  // the standard petal — the big fan everyone recognises
  const shades = [BLUE.edge, BLUE.mid, BLUE.deep, BLUE.deepest];
  for (let i = 0; i < shades.length; i++) {
    const k = i / (shades.length - 1);
    const p = place(petalPoly(D * (0.5 - k * 0.04), D * (0.34 - k * 0.17), 0.18), cx, cy, rot);
    fillPoly(ctx, p, C(shades[i]));
  }
  // veins
  for (let i = 0; i < 9; i++) {
    const t = (i / 8) * 2 - 1;
    const a = rot + t * 0.45;
    const len = D * r.f(0.28, 0.46);
    ctx.fillStyle = rgba(C(BLUE.vein), 0.28);
    for (let s = D * 0.08; s < len; s++) {
      ctx.fillRect(Math.round(cx + Math.cos(a) * s), Math.round(cy + Math.sin(a) * s), 1, 1);
    }
  }
  // throat
  const tx = cx + Math.cos(rot) * D * 0.2;
  const ty = cy + Math.sin(rot) * D * 0.2;
  const tr = Math.max(1.4, D * 0.075);
  fillEllipse(ctx, tx, ty, tr * 1.7, tr * 1.6, rgba(C(BLUE.deepest), 0.5));
  fillEllipse(ctx, tx, ty, tr * 1.15, tr * 1.05, C(BLUE.pale));
  fillEllipse(ctx, tx, ty, tr * 0.8, tr * 0.72, C(BLUE.cream));
  fillEllipse(ctx, tx - tr * 0.1, ty, tr * 0.46, tr * 0.42, C(BLUE.gold));
  for (let i = 0; i < 8; i++) {
    const a = r.f(0, 6.28), d = Math.sqrt(r.f()) * tr * 0.8;
    px(ctx, tx + Math.cos(a) * d, ty + Math.sin(a) * d, r.chance(0.5) ? '#c8a83c' : '#fff6c8');
  }
  // a leaf or two, only on some
  if (r.chance(0.45)) {
    const a = rot + Math.PI + r.f(-0.5, 0.5);
    const lx = cx + Math.cos(a) * D * 0.3, ly = cy + Math.sin(a) * D * 0.3;
    fillEllipse(ctx, lx, ly, D * 0.14, D * 0.09, C(BLUE.leafLo));
    fillEllipse(ctx, lx - D * 0.02, ly - D * 0.015, D * 0.11, D * 0.06, C(BLUE.leaf));
    fillEllipse(ctx, lx - D * 0.04, ly - D * 0.03, D * 0.05, D * 0.025, C(BLUE.leafHi));
  }
  return { canvas, S, D };
}

/**
 * A screenful of blossoms you can push through.
 *  onCleared() fires once enough of them are gone.
 */
export class BlossomField {
  constructor(opts = {}) {
    const r = rng(opts.seed || 8191);
    this.r = r;
    this.t = 0;
    this.variants = [];
    for (let i = 0; i < 14; i++) {
      const D = [30, 40, 50, 62, 76, 44, 56][i % 7];
      this.variants.push(bakeBlossom(D, 900 + i * 37, { rot: (i / 14) * 6.28 + r.f(-0.4, 0.4) }));
    }
    this.items = [];
    const cols = opts.cols || 10;
    const rows = opts.rows || 8;
    // two passes: a dense mat, then a sparser layer in front to close the gaps
    for (let layer = 0; layer < 2; layer++) {
      const off = layer * 0.5;
      for (let gy = -1; gy <= rows; gy++) {
        for (let gx = -1; gx <= cols; gx++) {
          if (layer === 1 && r.chance(0.42)) continue;
          const jitterX = r.f(-0.34, 0.34), jitterY = r.f(-0.34, 0.34);
          const v = this.variants[r.i(0, this.variants.length - 1)];
          const depth = layer === 1 ? r.f(0.5, 1) : r.f(0, 0.6);
          this.items.push({
            x: ((gx + 0.5 + off + jitterX) / cols) * W,
            y: ((gy + 0.5 + off + jitterY) / rows) * H,
            v, depth,
            sc: lerp(0.95, 1.5, depth) * (opts.scale || 1),
            vx: 0, vy: 0, rot: 0, spin: 0, gone: false, fade: 1,
            sway: r.f(0, 6.28), swaySp: r.f(0.5, 1.2),
          });
        }
      }
    }
    // paint the far ones first
    this.items.sort((a, b) => a.depth - b.depth);
    // only the ones you can actually reach count toward clearing the screen
    for (const it of this.items) {
      it.inView = it.x > -6 && it.x < W + 6 && it.y > -6 && it.y < H + 6;
    }
    this.total = this.items.filter((i) => i.inView).length;
    this.pushed = 0;
    this.onCleared = opts.onCleared || null;
    this.cleared = false;
    this.hintT = 0;
    this.lastPush = 0;
  }

  /** Shove everything near a point in the direction of the drag. */
  push(x, y, dx, dy, radius = 74) {
    const n = Math.hypot(dx, dy) || 1;
    const ux = dx / n, uy = dy / n;
    const power = clamp(n * 12, 90, 460);
    for (const it of this.items) {
      if (it.gone) continue;
      // the brush catches a flower if it touches its petals, not just its heart
      const d = Math.hypot(it.x - x, it.y - y) - it.v.S * it.sc * 0.3;
      const rr = radius * lerp(0.8, 1.3, it.depth);
      if (d > rr) continue;
      const falloff = 1 - d / rr;
      it.vx += (ux * power + (it.x - x) * 2.2) * falloff;
      it.vy += (uy * power + (it.y - y) * 2.2) * falloff - 20 * falloff;
      it.spin = (this.r.f(-1, 1) + ux * 1.4) * falloff * 3;
      it.gone = true;
      if (it.inView) this.pushed++;
      this.lastPush = this.t;
    }
  }

  update(dt) {
    this.t += dt;
    this.hintT += dt;
    for (const it of this.items) {
      if (!it.gone) continue;
      it.vy += 210 * dt;
      it.x += it.vx * dt;
      it.y += it.vy * dt;
      it.rot += it.spin * dt;
      it.vx *= Math.pow(0.4, dt);
      it.fade -= dt * 0.42;
    }
    if (!this.cleared && this.pushed / this.total > 0.84) {
      this.cleared = true;
      // sweep the stragglers away with it
      for (const it of this.items) {
        if (it.gone) continue;
        it.gone = true;
        const a = Math.atan2(it.y - H / 2, it.x - W / 2);
        it.vx = Math.cos(a) * 220 + this.r.f(-40, 40);
        it.vy = Math.sin(a) * 180 - 60;
        it.spin = this.r.f(-3, 3);
      }
      if (this.onCleared) this.onCleared();
    }
  }

  get progress() { return clamp(this.pushed / this.total, 0, 1); }

  draw(ctx, o = {}) {
    const alpha = o.alpha === undefined ? 1 : o.alpha;
    for (const it of this.items) {
      if (it.fade <= 0) continue;
      const a = alpha * clamp(it.fade, 0, 1);
      if (a <= 0.01) continue;
      ctx.globalAlpha = a;
      const s = it.sc;
      const sw = it.v.S * s;
      if (!it.gone) {
        const sx = Math.sin(this.t * it.swaySp + it.sway) * 1.2;
        const sy = Math.cos(this.t * it.swaySp * 0.8 + it.sway) * 0.8;
        ctx.drawImage(it.v.canvas, Math.round(it.x - sw / 2 + sx), Math.round(it.y - sw / 2 + sy),
                      Math.round(sw), Math.round(sw));
      } else {
        ctx.save();
        ctx.translate(Math.round(it.x), Math.round(it.y));
        ctx.rotate(it.rot);
        ctx.drawImage(it.v.canvas, Math.round(-sw / 2), Math.round(-sw / 2), Math.round(sw), Math.round(sw));
        ctx.restore();
      }
    }
    ctx.globalAlpha = 1;
  }

  /** Pollen drifting one way, so you know which way to sweep. */
  drawHint(ctx) {
    const idle = clamp((this.t - this.lastPush) / 1.4, 0, 1);
    if (idle <= 0.02 || this.cleared) return;
    const sweep = (this.hintT * 0.36) % 1;
    for (let i = 0; i < 30; i++) {
      const t = (sweep + i / 30) % 1;
      const y = H * 0.5 + Math.sin(i * 1.7) * H * 0.34 + Math.sin(this.hintT * 1.3 + i) * 4;
      const x = lerp(-30, W + 30, t);
      const fade = Math.sin(t * Math.PI) * idle;
      ctx.globalAlpha = fade * 0.8;
      ctx.fillStyle = i % 3 === 0 ? '#fff4c0' : '#e4dcff';
      ctx.fillRect(Math.round(x), Math.round(y), i % 4 === 0 ? 2 : 1, i % 4 === 0 ? 2 : 1);
      ctx.globalAlpha = fade * 0.24;
      ctx.fillRect(Math.round(x - 5), Math.round(y), 4, 1);
    }
    ctx.globalAlpha = 1;
  }
}
