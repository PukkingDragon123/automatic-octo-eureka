/* ============================================================================
 *  dialogue.js — speech bubbles and the choices you make in them.
 *
 *  A bubble is anchored to whoever is speaking and follows them, so people can
 *  keep walking while they talk.  Lines type themselves out; tapping once
 *  finishes the line, tapping again moves on.  Choices are drawn inside the
 *  bubble and picked by touching one.
 * ==========================================================================*/

import { clamp, lerp, rgba } from './core.js';
import { drawText, textWidth, wrapText, GLYPH_H, isThai, T } from './font.js';
import { W, H } from './vista.js';

const PAD = 4;
const LINE = GLYPH_H + 2;
const THAI_LINE = 13;
const MAXW = 150;

/* Who is speaking tints the bubble very slightly, so a conversation reads
   without name tags.                                                        */
const VOICE = {
  A: { bg: '#fdfbf4', ink: '#2c2732', edge: '#cfc7bc' },   // Nim
  B: { bg: '#eef4fb', ink: '#26303c', edge: '#bcc8d8' },   // Beam
  D: { bg: '#fdf1f3', ink: '#3a2830', edge: '#dcc2c8' },   // Fon
  E: { bg: '#f2f6ec', ink: '#2a3026', edge: '#c6d0ba' },   // Gap
  T: { bg: '#f8f0e2', ink: '#342c22', edge: '#d6c6a8' },   // Kru Malee
  '': { bg: '#fbf8f0', ink: '#2c2732', edge: '#cfc7bc' },
  think: { bg: '#f4f2fb', ink: '#3a3450', edge: '#cac4e0' },
  narrate: { bg: '#20222c', ink: '#e8e4dc', edge: '#3a3d4a' },
};

export class Bubble {
  constructor(text, opts = {}) {
    text = T(text);
    this.thai = isThai(text);
    this.line = this.thai ? THAI_LINE : LINE;
    this.lines = text ? wrapText(text, opts.maxw || MAXW) : [];
    if (opts.choices) {
      opts.choices = opts.choices.map((c) => ({ ...c, text: T(c.text) }));
      if (opts.choices.some((c) => isThai(c.text))) this.line = THAI_LINE;
    }
    this.who = opts.who || '';
    this.kind = opts.kind || 'say';          // say | think | narrate
    this.anchor = opts.anchor || null;       // () => ({x, y}) in screen space
    this.choices = opts.choices || null;     // [{text, value}]
    this.chars = 0;
    this.total = this.lines.join(' ').length;
    this.done = false;
    this.age = 0;
    this.pop = 0;
    this.hold = opts.hold === undefined ? 0 : opts.hold;
    this.picked = null;
    this.hover = -1;
    this.style = VOICE[this.kind === 'narrate' ? 'narrate' : this.kind === 'think' ? 'think' : this.who] || VOICE[''];
  }
  get w() {
    let w = 0;
    for (const l of this.lines) w = Math.max(w, textWidth(l));
    if (this.choices) for (const c of this.choices) w = Math.max(w, textWidth(c.text) + 8);
    return w + PAD * 2;
  }
  get h() {
    const n = this.lines.length + (this.choices ? this.choices.length : 0);
    return n * this.line + PAD * 2 + (this.choices && this.lines.length ? 3 : 0);
  }
  update(dt) {
    this.age += dt;
    this.pop = Math.min(1, this.pop + dt * 7);
    if (this.chars < this.total) this.chars = Math.min(this.total, this.chars + dt * 46);
    else this.done = true;
  }
  /** Finish typing, or report that the line is already finished. */
  skip() {
    if (this.chars < this.total) { this.chars = this.total; this.done = true; return false; }
    return true;
  }
  /** Where the bubble sits this frame. */
  place() {
    const a = this.anchor ? this.anchor() : { x: W / 2, y: H * 0.42 };
    const w = this.w, h = this.h;
    let x = clamp(Math.round(a.x - w / 2), 4, W - w - 4);
    let y = Math.round(a.y - h - 8);
    if (this.kind === 'narrate') { x = Math.round((W - w) / 2); y = Math.round(H * 0.16); }
    y = clamp(y, 4, H - h - 4);
    return { x, y, w, h, ax: a.x };
  }
  hitChoice(px, py) {
    if (!this.choices || !this.done) return -1;
    const { x, y, w } = this.place();
    const top = y + PAD + this.lines.length * this.line + (this.lines.length ? 3 : 0);
    for (let i = 0; i < this.choices.length; i++) {
      const cy = top + i * this.line;
      if (px >= x + 2 && px <= x + w - 2 && py >= cy - 2 && py <= cy + this.line - 2) return i;
    }
    return -1;
  }
  draw(ctx, t) {
    const S = this.style;
    const { x, y, w, h, ax } = this.place();
    const k = this.pop < 1 ? 1 - Math.pow(1 - this.pop, 3) : 1;
    const bw = Math.round(w * lerp(0.7, 1, k));
    const bh = Math.round(h * lerp(0.4, 1, k));
    const bx = Math.round(x + (w - bw) / 2), by = Math.round(y + (h - bh));
    // body, with the corners knocked off so it reads as a bubble not a box
    ctx.fillStyle = S.bg;
    ctx.fillRect(bx + 1, by, bw - 2, bh);
    ctx.fillRect(bx, by + 1, bw, bh - 2);
    ctx.fillStyle = S.edge;
    ctx.fillRect(bx + 1, by - 1, bw - 2, 1);
    ctx.fillRect(bx + 1, by + bh, bw - 2, 1);
    ctx.fillRect(bx - 1, by + 1, 1, bh - 2);
    ctx.fillRect(bx + bw, by + 1, 1, bh - 2);
    if (this.kind === 'say' && this.anchor) {
      // a tail, stepped down toward whoever is talking
      const tx = clamp(Math.round(ax), bx + 4, bx + bw - 7);
      ctx.fillStyle = S.bg;
      for (let i = 0; i < 4; i++) ctx.fillRect(tx + i, by + bh + i, 4 - i, 1);
      ctx.fillStyle = S.edge;
      for (let i = 0; i < 4; i++) ctx.fillRect(tx + 4 - i, by + bh + i, 1, 1);
    }
    if (this.kind === 'think' && this.anchor) {
      const tx = clamp(Math.round(ax), bx + 4, bx + bw - 7);
      ctx.fillStyle = S.bg;
      ctx.fillRect(tx, by + bh + 2, 2, 2);
      ctx.fillRect(tx - 1, by + bh + 5, 1, 1);
    }
    if (k < 0.85) return;
    // the text, revealed a letter at a time
    let budget = Math.floor(this.chars);
    let ty = by + PAD;
    for (const line of this.lines) {
      const show = line.slice(0, Math.max(0, budget));
      drawText(ctx, show, bx + PAD, ty, S.ink);
      budget -= line.length;
      ty += this.line;
      if (budget <= 0) break;
    }
    if (this.choices && this.done) {
      ty = by + PAD + this.lines.length * this.line + (this.lines.length ? 3 : 0);
      if (this.lines.length) {
        ctx.fillStyle = S.edge;
        ctx.fillRect(bx + 2, ty - 3, bw - 4, 1);
      }
      for (let i = 0; i < this.choices.length; i++) {
        const on = i === this.hover;
        if (on) {
          ctx.fillStyle = rgba(S.ink, 0.1);
          ctx.fillRect(bx + 2, ty - 2, bw - 4, this.line - 1);
        }
        const blink = on || (t * 2) % 1 > 0.4;
        if (blink) drawText(ctx, '>', bx + PAD - 1, ty, on ? S.ink : rgba(S.ink, 0.45));
        drawText(ctx, this.choices[i].text, bx + PAD + 5, ty, S.ink);
        ty += this.line;
      }
    } else if (this.done && !this.hold) {
      // the little arrow that means: touch to go on
      const yy = by + bh - 4 + Math.round(Math.sin(t * 5) * 0.6);
      ctx.fillStyle = S.ink;
      ctx.fillRect(bx + bw - 7, yy, 3, 1);
      ctx.fillRect(bx + bw - 6, yy + 1, 1, 1);
    }
  }
}

/**
 * A queue of bubbles.  Push lines, choices and waits; the scene script runs
 * off the same clock and nothing else needs to know about any of it.
 */
export class Dialogue {
  constructor() {
    this.q = [];
    this.cur = null;
    this.onChoice = null;
    this.t = 0;
  }
  get busy() { return !!this.cur || this.q.length > 0; }
  clear() { this.q.length = 0; this.cur = null; }
  say(text, opts = {}) { this.q.push(new Bubble(text, { kind: 'say', ...opts })); return this; }
  think(text, opts = {}) { this.q.push(new Bubble(text, { kind: 'think', ...opts })); return this; }
  narrate(text, opts = {}) { this.q.push(new Bubble(text, { kind: 'narrate', ...opts })); return this; }
  ask(text, choices, opts = {}) {
    this.q.push(new Bubble(text === '...' ? '' : text, { kind: 'say', choices, ...opts }));
    return this;
  }
  update(dt) {
    this.t += dt;
    if (!this.cur && this.q.length) this.cur = this.q.shift();
    if (!this.cur) return;
    this.cur.update(dt);
    // a line with a hold clears itself after a beat
    if (this.cur.hold && this.cur.done && this.cur.age > this.cur.hold) this.advance(true);
  }
  /** A touch inside the bubble.  Returns true if it was consumed. */
  press(px, py) {
    if (!this.cur) return false;
    if (this.cur.choices) {
      const i = this.cur.hitChoice(px, py);
      if (i >= 0) {
        const c = this.cur.choices[i];
        const cb = this.onChoice;
        this.cur = null;
        if (cb) cb(c.value === undefined ? c.text : c.value, c);
        return true;
      }
      this.cur.skip();
      return true;
    }
    if (!this.cur.skip()) return true;      // it was still typing
    this.advance();
    return true;
  }
  move(px, py) {
    if (this.cur && this.cur.choices) this.cur.hover = this.cur.hitChoice(px, py);
  }
  advance() {
    this.cur = this.q.length ? this.q.shift() : null;
  }
  draw(ctx) {
    if (this.cur) this.cur.draw(ctx, this.t);
  }
}
