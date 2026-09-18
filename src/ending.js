/* ============================================================================
 *  ending.js — the last minute.
 *
 *  The tree opens one flower, the screen fills with butterfly pea again, and
 *  then somebody says the thing they came here to say.
 * ==========================================================================*/

import { clamp, lerp, rgba } from './core.js';
import { BlossomField } from './blossom.js';

export const LINES = [
  'Hey, I made this game for you.',
  "It's pretty fun, right?",
  '',
  'Ummmm…',
  'I also have something I want to confess…',
];

export class Ending {
  constructor() {
    this.phase = 'idle';     // idle -> closing -> text -> choice -> answered
    this.t = 0;
    this.field = null;
    this.lineT = 0;
    this.answer = null;
    this.noDodges = 0;
    this.noOffset = { x: 0, y: 0 };
    this.hover = null;
    this.glow = 0;
    this.veil = 0;
    this.part = 0;
  }

  /** The blossoms sweep back in and cover everything. */
  close() {
    if (this.phase !== 'idle') return;
    this.phase = 'closing';
    this.t = 0;
    this.field = new BlossomField({ seed: 5150, cols: 8, rows: 6 });
    // start them all off-screen and let them settle in
    for (const it of this.field.items) {
      it.homeX = it.x; it.homeY = it.y;
      const a = Math.atan2(it.y - 150, it.x - 240);
      it.x += Math.cos(a) * 520;
      it.y += Math.sin(a) * 420;
      it.settle = 0.15 + Math.random() * 0.7;
    }
  }

  update(dt) {
    this.t += dt;
    if (this.phase === 'closing') {
      const k = clamp((this.t - 0.4) / 4.2, 0, 1);
      const e = 1 - Math.pow(1 - k, 3);
      for (const it of this.field.items) {
        const kk = clamp((e - it.settle * 0.35) / 0.8, 0, 1);
        it.x = lerp(it.x, it.homeX, 1 - Math.pow(0.02, dt * (0.5 + kk * 2.2)));
        it.y = lerp(it.y, it.homeY, 1 - Math.pow(0.02, dt * (0.5 + kk * 2.2)));
      }
      this.field.t += dt;
      this.veil = Math.min(0.78, this.veil + dt * 0.2);
      if (this.t > 6.5) { this.phase = 'text'; this.t = 0; }
    } else if (this.phase === 'text') {
      this.lineT += dt;
      if (this.t > 15.5) { this.phase = 'choice'; this.t = 0; }
    } else if (this.phase === 'choice') {
      this.glow = Math.min(1, this.glow + dt * 0.5);
    } else if (this.phase === 'answered') {
      this.glow = Math.min(1, this.glow + dt * 0.4);
      // the flowers ease apart again, so the tree they planted shows through
      this.part = Math.min(1, this.part + dt * 0.11);
      this.veil = Math.max(this.answer === 'YES' ? 0.12 : 0.34, this.veil - dt * 0.12);
      for (const it of this.field.items) {
        const dx = it.homeX - 240, dy = it.homeY - 150;
        const n = Math.hypot(dx, dy) || 1;
        it.x = it.homeX + (dx / n) * this.part * 300;
        it.y = it.homeY + (dy / n) * this.part * 260;
      }
      this.field.t += dt;
    }
  }

  get visibleLines() {
    // one line at a time, with a long pause before the last
    const gaps = [0, 3.2, 5.2, 7.6, 11.2];
    return gaps.map((g) => clamp((this.lineT - g) / 1.8, 0, 1));
  }

  /* --------------- the overlay draws at display resolution, not in pixels */

  drawOverlay(ctx, vw, vh, dpr) {
    if (this.phase === 'idle') return;
    const base = Math.min(vw, vh * 1.6);
    const fs = Math.max(13 * dpr, base * 0.0235);
    const cx = vw / 2;
    ctx.save();
    // a soft scrim so the words can be read against all those petals
    if (this.phase !== 'closing') {
      const g = ctx.createRadialGradient(cx, vh * 0.48, vh * 0.04, cx, vh * 0.48, vh * 0.62);
      const a = clamp(this.phase === 'answered' ? 0.62 - this.part * 0.4 : 0.62, 0, 1);
      g.addColorStop(0, rgba('#0d0828', a));
      g.addColorStop(0.55, rgba('#0d0828', a * 0.78));
      g.addColorStop(1, rgba('#0d0828', 0));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, vw, vh);
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (this.phase === 'text' || this.phase === 'choice' || this.phase === 'answered') {
      const alphas = this.visibleLines;
      const lineH = fs * 1.9;
      const top = vh * 0.3;
      LINES.forEach((line, i) => {
        if (!line) return;
        const a = alphas[i];
        if (a <= 0) return;
        const y = top + i * lineH + (1 - a) * fs * 0.5;
        ctx.font = `${i >= 3 ? 'italic ' : ''}${Math.round(fs)}px Georgia, 'Iowan Old Style', 'Times New Roman', serif`;
        ctx.fillStyle = rgba('#0f0a2a', 0.55 * a);
        ctx.fillText(line, cx + dpr, y + dpr * 1.5);
        ctx.fillStyle = rgba('#fdfbff', a);
        ctx.fillText(line, cx, y);
      });
    }

    if (this.phase === 'choice' || this.phase === 'answered') {
      const y = vh * 0.3 + 5 * fs * 1.9 + fs * 2.1;
      const gap = fs * 3.4;
      this.buttons = [
        { key: 'YES', x: cx - gap, y, w: fs * 3.6, h: fs * 2.2 },
        { key: 'NO', x: cx + gap + this.noOffset.x, y: y + this.noOffset.y, w: fs * 3.2, h: fs * 2.2 },
      ];
      for (const b of this.buttons) {
        const picked = this.answer === b.key;
        const on = this.hover === b.key || picked;
        const a = this.phase === 'answered' ? (picked ? 1 : 0.18) : 1;
        ctx.globalAlpha = a * clamp(this.t / 1.2, 0, 1);
        // a soft plate, drawn only as light
        ctx.fillStyle = rgba(picked ? '#ffd9ec' : '#ffffff', on ? 0.16 : 0.07);
        roundRect(ctx, b.x - b.w / 2, b.y - b.h / 2, b.w, b.h, fs * 0.5);
        ctx.fill();
        ctx.strokeStyle = rgba('#ffffff', on ? 0.75 : 0.34);
        ctx.lineWidth = Math.max(1, dpr);
        roundRect(ctx, b.x - b.w / 2, b.y - b.h / 2, b.w, b.h, fs * 0.5);
        ctx.stroke();
        ctx.font = `${Math.round(fs * 0.92)}px Georgia, 'Iowan Old Style', 'Times New Roman', serif`;
        ctx.fillStyle = rgba('#0f0a2a', 0.5);
        ctx.fillText(b.key, b.x + dpr, b.y + dpr * 1.5);
        ctx.fillStyle = rgba('#ffffff', on ? 1 : 0.88);
        ctx.fillText(b.key, b.x, b.y);
        ctx.globalAlpha = 1;
      }
    }
    ctx.restore();
  }

  /** Pointer in display pixels. */
  move(px, py) {
    if (!this.buttons || this.phase !== 'choice') return;
    this.hover = null;
    for (const b of this.buttons) {
      if (Math.abs(px - b.x) < b.w / 2 && Math.abs(py - b.y) < b.h / 2) this.hover = b.key;
    }
    // the NO shies away a couple of times, then settles and lets itself be pressed
    if (this.hover === 'NO' && this.noDodges < 3) {
      this.noDodges++;
      const a = Math.random() * Math.PI * 2;
      this.noOffset.x = Math.cos(a) * b_dist(this.buttons[1]);
      this.noOffset.y = Math.sin(a) * b_dist(this.buttons[1]) * 0.5;
      this.hover = null;
    }
  }
  press(px, py) {
    if (!this.buttons || this.phase !== 'choice') return null;
    for (const b of this.buttons) {
      if (Math.abs(px - b.x) < b.w / 2 && Math.abs(py - b.y) < b.h / 2) {
        this.answer = b.key;
        this.phase = 'answered';
        this.t = 0;
        this.glow = 0;
        return b.key;
      }
    }
    return null;
  }
}

function b_dist(b) { return b.w * 1.3; }

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
