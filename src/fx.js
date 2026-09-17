/* ============================================================================
 *  fx.js — every particle, sparkle, petal, bird and firefly in the world.
 * ==========================================================================*/

import {
  rng, clamp, lerp, mix, shade, rgba,
  px, rect, line, fillEllipse, fillCircle, fillPoly,
} from './core.js';
import { W, H } from './vista.js';

const R = rng(31337);

export class FX {
  constructor() {
    this.p = [];
    this.back = [];
    this.t = 0;
  }
  clear() { this.p.length = 0; }

  spawn(type, o = {}) {
    const q = o.back ? this.back : this.p;
    q.push({
      type, x: 0, y: 0, vx: 0, vy: 0, life: 1, age: 0, size: 1,
      grav: 0, color: '#fff', ph: R.f(0, 6.28), spin: R.f(-3, 3), ...o,
    });
    if (q.length > 1400) q.splice(0, q.length - 1400);
    return q[q.length - 1];
  }

  /* ------------------------------------------------------------ emitters */
  drop(x, y, vx = 0, vy = 20) {
    this.spawn('drop', { x, y, vx: vx + R.f(-6, 6), vy: vy + R.f(0, 14), grav: 260, life: 3, size: R.f(0.8, 1.6) });
  }
  splash(x, y, n = 6, color = '#bfe8f4') {
    for (let i = 0; i < n; i++) {
      this.spawn('splash', {
        x, y, vx: R.f(-26, 26), vy: -R.f(10, 40), grav: 200,
        life: R.f(0.3, 0.7), color, size: R.f(0.8, 1.5),
      });
    }
  }
  heart(x, y) {
    this.spawn('heart', { x, y, vx: R.f(-6, 6), vy: -R.f(9, 18), life: R.f(1.1, 1.8), size: R.f(0.8, 1.35) });
  }
  sparkle(x, y, color = '#fff6c8', life = 0.7) {
    this.spawn('sparkle', { x, y, vx: R.f(-6, 6), vy: -R.f(2, 12), life, color, size: R.f(0.7, 1.5) });
  }
  dirt(x, y, n = 10, color = '#6b4a32') {
    for (let i = 0; i < n; i++) {
      this.spawn('dirt', {
        x, y, vx: R.f(-40, 40), vy: -R.f(20, 70), grav: 260,
        life: R.f(0.5, 1.1), color: R.chance(0.5) ? color : shade(color, -0.25), size: R.f(0.8, 1.8),
      });
    }
  }
  petal(kind, x, y, vy = 8) {
    this.spawn('petal', {
      x, y, vx: R.f(-6, 6), vy: vy * R.f(0.6, 1.4), life: 14, kind,
      size: R.f(0.8, 1.5), sway: R.f(6, 16), swaySpeed: R.f(0.7, 1.7), back: R.chance(0.35),
    });
  }
  zzz(x, y) {
    this.spawn('zzz', { x, y, vx: R.f(2, 7), vy: -R.f(5, 9), life: 2.6, size: R.f(0.9, 1.5) });
  }
  burst(x, y, n, color, speed = 60) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + R.f(-0.2, 0.2);
      this.spawn('spark', {
        x, y, vx: Math.cos(a) * speed * R.f(0.4, 1.3), vy: Math.sin(a) * speed * R.f(0.4, 1.3) * 0.7,
        grav: 40, life: R.f(0.5, 1.2), color, size: R.f(0.8, 1.8),
      });
    }
  }
  ring(x, y, color = '#ffffff') {
    this.spawn('ring', { x, y, life: 0.9, color, size: 1 });
  }
  butterfly(x, y, color) {
    this.spawn('butterfly', {
      x, y, vx: R.f(-14, 14), vy: R.f(-5, 5), life: 999, color: color || '#6f5ae0',
      size: R.f(0.8, 1.3), tx: x, ty: y, timer: 0, back: R.chance(0.4),
    });
  }
  firefly(x, y) {
    this.spawn('firefly', { x, y, vx: R.f(-6, 6), vy: R.f(-4, 4), life: 999, size: R.f(0.8, 1.4) });
  }
  bird(y) {
    const dir = R.chance(0.5) ? 1 : -1;
    this.spawn('bird', {
      x: dir > 0 ? -12 : W + 12, y, vx: dir * R.f(16, 30), vy: R.f(-2, 2),
      life: 40, size: R.f(0.7, 1.3), back: true, color: '#3e4a58',
    });
  }
  mote(x, y) {
    this.spawn('mote', { x, y, vx: R.f(-4, 4), vy: -R.f(1, 5), life: R.f(3, 7), size: R.f(0.7, 1.2), back: R.chance(0.5) });
  }

  /* -------------------------------------------------------------- update */
  update(dt, env = {}) {
    this.t += dt;
    for (const q of [this.p, this.back]) {
      for (let i = q.length - 1; i >= 0; i--) {
        const a = q[i];
        a.age += dt;
        if (a.age >= a.life) { q.splice(i, 1); continue; }
        switch (a.type) {
          case 'petal':
            a.x += a.vx * dt + Math.sin(this.t * a.swaySpeed + a.ph) * a.sway * dt;
            a.y += a.vy * dt;
            a.ph += dt * 2.4;
            if (a.y > H + 6) { q.splice(i, 1); continue; }
            break;
          case 'butterfly': {
            a.timer -= dt;
            if (a.timer <= 0) {
              a.timer = R.f(0.7, 2.2);
              a.tx = clamp(a.x + R.f(-60, 60), 10, W - 10);
              a.ty = clamp(a.y + R.f(-30, 30), 120, H - 8);
            }
            a.vx = lerp(a.vx, (a.tx - a.x) * 0.9, dt * 2);
            a.vy = lerp(a.vy, (a.ty - a.y) * 0.9, dt * 2);
            a.x += a.vx * dt; a.y += a.vy * dt;
            a.ph += dt * 18;
            break;
          }
          case 'firefly':
            a.vx += R.f(-24, 24) * dt;
            a.vy += R.f(-18, 18) * dt;
            a.vx = clamp(a.vx, -12, 12); a.vy = clamp(a.vy, -9, 9);
            a.x += a.vx * dt; a.y += a.vy * dt;
            if (a.x < 0 || a.x > W) a.vx *= -1;
            if (a.y < 200 || a.y > H - 4) a.vy *= -1;
            a.ph += dt * 3;
            break;
          case 'bird':
            a.x += a.vx * dt;
            a.y += Math.sin(this.t * 1.3 + a.ph) * 4 * dt;
            a.ph += dt * 9;
            if (a.x < -20 || a.x > W + 20) { q.splice(i, 1); continue; }
            break;
          default:
            a.vy += (a.grav || 0) * dt;
            a.x += a.vx * dt;
            a.y += a.vy * dt;
            if (a.type === 'drop' && env.onDrop && a.y >= (env.groundAt ? env.groundAt(a.x) : H)) {
              env.onDrop(a);
              q.splice(i, 1);
              continue;
            }
            break;
        }
      }
    }
  }

  /* ---------------------------------------------------------------- draw */
  draw(ctx, layer = 'front', P = null) {
    const q = layer === 'back' ? this.back : this.p;
    for (const a of q) {
      const k = a.age / a.life;
      switch (a.type) {
        case 'drop': {
          ctx.fillStyle = '#9fdcf0';
          const len = clamp(a.vy * 0.03, 1, 4);
          ctx.fillRect(Math.round(a.x), Math.round(a.y), 1, Math.round(len));
          ctx.fillStyle = rgba('#ffffff', 0.7);
          ctx.fillRect(Math.round(a.x), Math.round(a.y), 1, 1);
          break;
        }
        case 'splash':
          ctx.fillStyle = rgba(a.color, clamp(1 - k, 0, 1));
          ctx.fillRect(Math.round(a.x), Math.round(a.y), Math.max(1, a.size | 0), 1);
          break;
        case 'dirt':
          ctx.fillStyle = a.color;
          ctx.globalAlpha = clamp(1.4 - k * 1.4, 0, 1);
          ctx.fillRect(Math.round(a.x), Math.round(a.y), Math.max(1, Math.round(a.size)), Math.max(1, Math.round(a.size)));
          ctx.globalAlpha = 1;
          break;
        case 'heart': {
          const s = a.size * (1 + Math.sin(k * 6.28) * 0.12);
          ctx.globalAlpha = clamp(1.6 - k * 1.8, 0, 1);
          drawHeart(ctx, a.x, a.y, s, '#ff7a9c');
          ctx.globalAlpha = 1;
          break;
        }
        case 'sparkle': {
          const s = (1 - k) * 2.4 * a.size;
          ctx.globalAlpha = clamp(1.4 - k * 1.4, 0, 1);
          ctx.fillStyle = a.color;
          ctx.fillRect(Math.round(a.x - s), Math.round(a.y), Math.max(1, Math.round(s * 2)), 1);
          ctx.fillRect(Math.round(a.x), Math.round(a.y - s), 1, Math.max(1, Math.round(s * 2)));
          ctx.globalAlpha = 1;
          break;
        }
        case 'spark':
          ctx.globalAlpha = clamp(1.3 - k * 1.3, 0, 1);
          ctx.fillStyle = a.color;
          ctx.fillRect(Math.round(a.x), Math.round(a.y), Math.max(1, Math.round(a.size)), Math.max(1, Math.round(a.size)));
          ctx.globalAlpha = 1;
          break;
        case 'ring': {
          const r = lerp(2, 26, k);
          ctx.globalAlpha = clamp(1 - k, 0, 1) * 0.6;
          ctx.fillStyle = a.color;
          for (let i = 0; i < 34; i++) {
            const ang = (i / 34) * Math.PI * 2;
            ctx.fillRect(Math.round(a.x + Math.cos(ang) * r), Math.round(a.y + Math.sin(ang) * r * 0.42), 1, 1);
          }
          ctx.globalAlpha = 1;
          break;
        }
        case 'zzz': {
          ctx.globalAlpha = clamp(1.3 - k * 1.5, 0, 1);
          drawZ(ctx, a.x, a.y, a.size, '#f4fbff');
          ctx.globalAlpha = 1;
          break;
        }
        case 'petal':
          drawPetal(ctx, a, P);
          break;
        case 'mote':
          ctx.globalAlpha = Math.sin(k * Math.PI) * 0.5;
          ctx.fillStyle = '#fff8d8';
          ctx.fillRect(Math.round(a.x), Math.round(a.y), 1, 1);
          ctx.globalAlpha = 1;
          break;
        case 'butterfly': {
          const flap = Math.sin(a.ph) * 0.8;
          const s = a.size;
          const c = a.color, c2 = shade(a.color, 0.28);
          ctx.fillStyle = '#20203a';
          ctx.fillRect(Math.round(a.x), Math.round(a.y), 1, Math.max(1, Math.round(2 * s)));
          for (const side of [-1, 1]) {
            const wing = Math.abs(flap) * 3 * s + 1;
            fillEllipse(ctx, a.x + side * (1 + wing * 0.4), a.y, wing * 0.8, 2.2 * s, side < 0 ? c : c2);
          }
          break;
        }
        case 'firefly': {
          const glow = 0.4 + 0.6 * Math.abs(Math.sin(a.ph));
          ctx.globalAlpha = glow * 0.25;
          fillCircle(ctx, a.x, a.y, 3 * a.size, '#eaff9a');
          ctx.globalAlpha = glow;
          ctx.fillStyle = '#f6ffb0';
          ctx.fillRect(Math.round(a.x), Math.round(a.y), 1, 1);
          ctx.globalAlpha = 1;
          break;
        }
        case 'bird': {
          const f = Math.sin(a.ph);
          const s = a.size;
          ctx.fillStyle = a.color;
          const dir = Math.sign(a.vx);
          for (let i = 1; i <= Math.round(2.6 * s); i++) {
            ctx.fillRect(Math.round(a.x - i * dir), Math.round(a.y - f * i * 0.9), 1, 1);
            ctx.fillRect(Math.round(a.x + i * dir), Math.round(a.y - f * i * 0.9), 1, 1);
          }
          break;
        }
      }
    }
  }
}

export function drawHeart(ctx, x, y, s, color) {
  ctx.fillStyle = color;
  const w = Math.max(3, Math.round(3 * s));
  const rows = [
    [0, 1, 0, 1, 0],
    [1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1],
    [0, 1, 1, 1, 0],
    [0, 0, 1, 0, 0],
  ];
  const sc = Math.max(1, Math.round(s));
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      if (!rows[r][c]) continue;
      ctx.fillRect(Math.round(x + (c - 2.5) * sc), Math.round(y + (r - 2.5) * sc), sc, sc);
    }
  }
  ctx.fillStyle = rgba('#ffffff', 0.7);
  ctx.fillRect(Math.round(x - 1 * sc), Math.round(y - 1.5 * sc), sc, sc);
}

export function drawZ(ctx, x, y, s, color) {
  const sc = Math.max(1, Math.round(s));
  ctx.fillStyle = color;
  const n = 4 * sc;
  ctx.fillRect(Math.round(x), Math.round(y), n, sc);
  ctx.fillRect(Math.round(x), Math.round(y + 3 * sc), n, sc);
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(Math.round(x + (2 - i) * sc), Math.round(y + (i + 0.5) * sc), sc, sc);
  }
}

function drawPetal(ctx, a, P) {
  const k = a.age / a.life;
  const spin = Math.sin(a.ph);
  const w = Math.max(1, Math.round((1.4 + Math.abs(spin) * 1.6) * a.size));
  const h = Math.max(1, Math.round(1.6 * a.size));
  let c1 = '#ffc2da', c2 = '#ff9dc0';
  if (a.kind === 'leaf') { c1 = '#c89a4a'; c2 = '#a4702c'; }
  if (a.kind === 'pea') { c1 = '#8f7ce8'; c2 = '#5b4bc4'; }
  ctx.fillStyle = spin > 0 ? c1 : c2;
  ctx.fillRect(Math.round(a.x), Math.round(a.y), w, h);
  if (w > 2) {
    ctx.fillStyle = rgba('#ffffff', 0.35);
    ctx.fillRect(Math.round(a.x), Math.round(a.y), 1, 1);
  }
}

/** A soft radial glow — used for glints on things you can touch. */
export function glow(ctx, x, y, r, color, alpha = 0.25, steps = 4) {
  for (let i = steps; i >= 1; i--) {
    ctx.globalAlpha = alpha / i;
    fillCircle(ctx, x, y, (r * i) / steps, color);
  }
  ctx.globalAlpha = 1;
}

/** A slow travelling glint that says "this is yours to pick up". */
export function glint(ctx, x, y, t, color = '#fffbe0', scale = 1) {
  const p = (t % 2.6) / 2.6;
  if (p > 0.42) return;
  const k = p / 0.42;
  const s = Math.sin(k * Math.PI) * 3.4 * scale;
  ctx.globalAlpha = Math.sin(k * Math.PI);
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x - s), Math.round(y), Math.max(1, Math.round(s * 2)), 1);
  ctx.fillRect(Math.round(x), Math.round(y - s), 1, Math.max(1, Math.round(s * 2)));
  ctx.globalAlpha = 0.5 * Math.sin(k * Math.PI);
  ctx.fillRect(Math.round(x - s * 0.5), Math.round(y - s * 0.5), 1, 1);
  ctx.fillRect(Math.round(x + s * 0.5), Math.round(y + s * 0.5), 1, 1);
  ctx.globalAlpha = 1;
}

/** God rays raking down through the valley haze. */
export function drawRays(ctx, t, sunX, sunY, P, strength = 1) {
  if (strength <= 0) return;
  const rays = 6;
  const col = mix(P.sun.glow, '#ffffff', 0.45);
  for (let i = 0; i < rays; i++) {
    const a = 0.72 + i * 0.13 + Math.sin(t * 0.11 + i) * 0.02;
    const len = 330;
    const wdt = 7 + Math.sin(t * 0.3 + i * 2) * 3.5;
    const base = (0.028 + 0.018 * Math.sin(t * 0.37 + i * 1.7)) * strength;
    const dx = Math.cos(a), dy = Math.sin(a);
    ctx.fillStyle = col;
    for (let s = 12; s < len; s += 2) {
      const x = sunX - dx * s;
      const y = sunY + dy * s;
      if (y > 246 || x < -20) break;
      const k = s / len;
      ctx.globalAlpha = base * Math.sin(Math.min(1, k * 1.25) * Math.PI) * 1.3;
      const w = wdt * (0.35 + k);
      ctx.fillRect(Math.round(x - w / 2), Math.round(y), Math.round(w), 2);
    }
    ctx.globalAlpha = 1;
  }
}

/** Drifting mist ribbons in the valley. */
export function drawMist(ctx, t, P, amount = 1) {
  if (amount <= 0) return;
  const rr = rng(808);
  for (let i = 0; i < 9; i++) {
    const y = 150 + i * 7 + Math.sin(t * 0.2 + i) * 2;
    const speed = 3 + (i % 3) * 2;
    const x = ((t * speed + i * 120) % (W + 220)) - 110;
    const w = 90 + (i % 4) * 40;
    ctx.globalAlpha = (0.05 + 0.04 * Math.sin(t * 0.3 + i)) * amount;
    ctx.fillStyle = P.hazeCol;
    for (let k = 0; k < 3; k++) {
      ctx.fillRect(Math.round(x + k * 6), Math.round(y + k), Math.round(w - k * 12), 1);
    }
    ctx.globalAlpha = 1;
  }
}
