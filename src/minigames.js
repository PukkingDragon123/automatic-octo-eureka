/* ============================================================================
 *  minigames.js — the things you actually play.
 *
 *  A test you can fail, a matching game you play with whoever you picked for
 *  your group, a menu you order from and a cook who makes it, and an afternoon
 *  that is trying to close your eyes.  They all draw at full resolution over
 *  the zoomed world, and they all report back one result.
 * ==========================================================================*/

import { clamp, lerp, rgba, rng } from './core.js';
import { W, H } from './vista.js';
import { drawText, textWidth, T } from './font.js';
import { drawFood } from './school.js';

const R = rng(5150);
const box = (ctx, x, y, w, h, c) => {
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
};

/** A panel with a title bar, which all of these sit in. */
function panel(ctx, x, y, w, h, title, col, ink) {
  ctx.globalAlpha = 0.45;
  box(ctx, 0, 0, W, H, '#0a0c12');
  ctx.globalAlpha = 1;
  box(ctx, x + 1, y, w - 2, h, '#f6f0e0');
  box(ctx, x, y + 1, w, h - 2, '#f6f0e0');
  box(ctx, x + 1, y - 1, w - 2, 1, '#bfb49a');
  box(ctx, x + 1, y + h, w - 2, 1, '#bfb49a');
  box(ctx, x - 1, y + 1, 1, h - 2, '#bfb49a');
  box(ctx, x + w, y + 1, 1, h - 2, '#bfb49a');
  box(ctx, x + 1, y + 1, w - 2, 16, col);
  if (title) drawText(ctx, title, x + 7, y + 5, ink || '#f6f0e0');
}

/* ------------------------------------------------------------------ test --*/

export class Quiz {
  constructor(questions, opts = {}) {
    this.qs = questions;
    this.i = 0;
    this.score = 0;
    this.t = 0;
    this.per = opts.per || 11;
    this.left = this.per;
    this.flash = 0;
    this.picked = -1;
    this.hover = -1;
    this.done = false;
    this.title = opts.title || '';
    this.col = opts.col || '#3f6ea8';
    this.help = opts.help || null;     // a friend who sometimes points at the answer
    this.hint = -1;
  }
  get q() { return this.qs[this.i]; }
  update(dt) {
    this.t += dt;
    if (this.done || this.flash > 0) { this.flash = Math.max(0, this.flash - dt); if (this.flash <= 0 && this.picked >= 0) this.next(); return; }
    this.left -= dt;
    if (this.help && this.hint < 0 && this.left < this.per * 0.45 && R.chance(dt * 0.9)) this.hint = this.q.a;
    if (this.left <= 0) { this.picked = -1; this.flash = 0.9; this.wrong = true; }
  }
  next() {
    this.picked = -1; this.wrong = false; this.hint = -1;
    this.i++;
    this.left = this.per;
    if (this.i >= this.qs.length) this.done = true;
  }
  rows() {
    const w = 236, h = 132;
    const x = Math.round((W - w) / 2), y = 70;
    return { x, y, w, h, top: y + 52, rh: 22 };
  }
  press(px, py) {
    if (this.done || this.flash > 0) return true;
    const { x, w, top, rh } = this.rows();
    for (let i = 0; i < this.q.c.length; i++) {
      const ry = top + i * rh;
      if (px >= x + 4 && px <= x + w - 4 && py >= ry - 3 && py <= ry + rh - 5) {
        this.picked = i;
        this.wrong = i !== this.q.a;
        if (!this.wrong) this.score++;
        this.flash = 0.85;
        return true;
      }
    }
    return true;
  }
  move(px, py) {
    const { x, w, top, rh } = this.rows();
    this.hover = -1;
    for (let i = 0; i < this.q.c.length; i++) {
      const ry = top + i * rh;
      if (px >= x + 4 && px <= x + w - 4 && py >= ry - 3 && py <= ry + rh - 5) this.hover = i;
    }
  }
  draw(ctx) {
    if (this.done) return;
    const { x, y, w, h, top, rh } = this.rows();
    panel(ctx, x, y, w, h, this.title, this.col);
    // the timer, and how many you have left
    const k = clamp(this.left / this.per, 0, 1);
    box(ctx, x + w - 78, y + 5, 70, 7, '#e2dac4');
    box(ctx, x + w - 78, y + 5, 70 * k, 7, k < 0.3 ? '#c2402c' : '#f6f0e0');
    const n = `${this.i + 1}/${this.qs.length}`;
    drawText(ctx, n, x + w - 78 - textWidth(n) - 6, y + 5, '#f6f0e0');
    // the question
    drawText(ctx, this.q.q, x + 8, y + 26, '#2c2732');
    for (let i = 0; i < this.q.c.length; i++) {
      const ry = top + i * rh;
      const right = i === this.q.a;
      let bg = null;
      if (this.flash > 0 && right) bg = '#8fc48a';
      else if (this.flash > 0 && i === this.picked) bg = '#e09a92';
      else if (i === this.hover) bg = rgba(this.col, 0.14);
      else if (i === this.hint) bg = rgba('#f2b23c', 0.3);
      if (bg) box(ctx, x + 4, ry - 3, w - 8, rh - 2, bg);
      drawText(ctx, this.q.c[i], x + 16, ry + 1, '#2c2732');
      box(ctx, x + 8, ry + 2, 4, 4, this.col);
    }
    if (this.flash > 0) {
      const msg = this.wrong ? T({ th: 'ยังไม่ใช่', en: 'not that one' }) : T({ th: 'ถูกต้อง', en: 'correct' });
      drawText(ctx, msg, x + w - textWidth(msg) - 8, y + h - 14, this.wrong ? '#a8402c' : '#3f7a3c');
    }
  }
}

/* ------------------------------------------------------------ group work --*/

const PAIR_ICONS = ['kaprao', 'somtam', 'chayen', 'anchan', 'gaitod', 'tomyum'];

/** Six cards, three pairs, and a friend who keeps telling you where they are. */
export class Match {
  constructor(opts = {}) {
    this.n = opts.pairs || 4;
    const keys = PAIR_ICONS.slice(0, this.n);
    const deck = keys.concat(keys);
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(R.f() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    this.cards = deck.map((k) => ({ k, up: false, gone: false, flip: 0 }));
    this.cols = 4;
    this.first = -1;
    this.lock = 0;
    this.t = 0;
    this.tries = 0;
    this.done = false;
    this.title = opts.title || '';
    this.col = opts.col || '#8a6ad8';
    this.helper = opts.helper || null;
    this.peek = -1;
    this.peekT = 0;
  }
  rect() {
    const cw = 40, ch = 34, gap = 5;
    const rows = Math.ceil(this.cards.length / this.cols);
    const w = this.cols * cw + (this.cols - 1) * gap + 20;
    const h = rows * ch + (rows - 1) * gap + 44;
    return { x: Math.round((W - w) / 2), y: 72, w, h, cw, ch, gap, rows };
  }
  cardAt(i, r) {
    const col = i % this.cols, row = Math.floor(i / this.cols);
    return { x: r.x + 10 + col * (r.cw + r.gap), y: r.y + 30 + row * (r.ch + r.gap) };
  }
  update(dt) {
    this.t += dt;
    this.peekT = Math.max(0, this.peekT - dt);
    if (this.peekT <= 0) this.peek = -1;
    for (const c of this.cards) c.flip = lerp(c.flip, c.up || c.gone ? 1 : 0, 1 - Math.pow(0.001, dt));
    if (this.lock > 0) {
      this.lock -= dt;
      if (this.lock <= 0) {
        const up = this.cards.filter((c) => c.up && !c.gone);
        if (up.length === 2) {
          if (up[0].k === up[1].k) up.forEach((c) => { c.gone = true; c.up = false; });
          else up.forEach((c) => { c.up = false; });
        }
        this.first = -1;
      }
    }
    if (!this.done && this.cards.every((c) => c.gone)) this.done = true;
    // a friend spots one for you now and then
    if (this.helper && this.peek < 0 && this.lock <= 0 && R.chance(dt * this.helper)) {
      const hidden = this.cards.map((c, i) => [c, i]).filter(([c]) => !c.gone && !c.up);
      if (hidden.length) { this.peek = hidden[Math.floor(R.f() * hidden.length)][1]; this.peekT = 1.4; }
    }
  }
  press(px, py) {
    if (this.lock > 0 || this.done) return true;
    const r = this.rect();
    for (let i = 0; i < this.cards.length; i++) {
      const c = this.cards[i];
      if (c.gone || c.up) continue;
      const p = this.cardAt(i, r);
      if (px >= p.x && px <= p.x + r.cw && py >= p.y && py <= p.y + r.ch) {
        c.up = true;
        if (this.first < 0) this.first = i;
        else { this.tries++; this.lock = 0.75; }
        return true;
      }
    }
    return true;
  }
  move() {}
  draw(ctx) {
    if (this.done) return;
    const r = this.rect();
    panel(ctx, r.x, r.y, r.w, r.h, this.title, this.col);
    for (let i = 0; i < this.cards.length; i++) {
      const c = this.cards[i];
      const p = this.cardAt(i, r);
      if (c.gone && c.flip > 0.98) { box(ctx, p.x, p.y, r.cw, r.ch, rgba('#8fc48a', 0.35)); continue; }
      const k = c.flip;
      const ww = Math.max(2, r.cw * Math.abs(Math.cos(k * Math.PI)));
      const x = p.x + (r.cw - ww) / 2;
      const showFace = k > 0.5 || i === this.peek;
      box(ctx, x, p.y, ww, r.ch, showFace ? '#fbf6e8' : this.col);
      box(ctx, x, p.y, ww, 2, showFace ? '#e2dac4' : rgba('#ffffff', 0.35));
      if (i === this.peek && k <= 0.5) box(ctx, x, p.y, ww, r.ch, rgba('#f2b23c', 0.35));
      if (showFace && ww > 12) drawFood(ctx, p.x + r.cw / 2, p.y + r.ch / 2 + 5, c.k, 1.1);
      else if (ww > 12) {
        for (let q = 0; q < 3; q++) box(ctx, x + 6 + q * 9, p.y + 14, 5, 5, rgba('#ffffff', 0.2));
      }
    }
  }
}

/* ----------------------------------------------------------- the ordering */

export class Order {
  constructor(shop) {
    this.shop = shop;
    this.sel = 0;
    this.phase = 'menu';        // menu | cook | done
    this.k = 0;
    this.t = 0;
    this.item = null;
    this.done = false;
  }
  update(dt) {
    this.t += dt;
    if (this.phase === 'cook') {
      this.k += dt / 2.6;
      if (this.k >= 1) { this.phase = 'done'; this.done = true; }
    }
  }
  rows() {
    const w = 214, h = 130;
    const x = Math.round((W - w) / 2), y = 66;
    return { x, y, w, h, top: y + 24, rh: 25 };
  }
  press(px, py) {
    if (this.phase !== 'menu') return true;
    const { x, w, top, rh } = this.rows();
    for (let i = 0; i < this.shop.menu.length; i++) {
      const ry = top + i * rh;
      if (px >= x + 4 && px <= x + w - 4 && py >= ry - 3 && py <= ry + rh - 4) {
        this.sel = i;
        this.item = this.shop.menu[i];
        this.phase = 'cook';
        this.k = 0;
        return true;
      }
    }
    return true;
  }
  move(px, py) {
    if (this.phase !== 'menu') return;
    const { x, w, top, rh } = this.rows();
    for (let i = 0; i < this.shop.menu.length; i++) {
      const ry = top + i * rh;
      if (px >= x + 4 && px <= x + w - 4 && py >= ry - 3 && py <= ry + rh - 4) this.sel = i;
    }
  }
  draw(ctx) {
    const S = this.shop;
    if (this.phase === 'menu') {
      const { x, y, w, h, top, rh } = this.rows();
      panel(ctx, x, y, w, h, S.nameFull, S.col, S.sign);
      for (let i = 0; i < S.menu.length; i++) {
        const it = S.menu[i];
        const ry = top + i * rh;
        if (i === this.sel) box(ctx, x + 4, ry - 3, w - 8, rh - 3, rgba(S.col, 0.16));
        box(ctx, x + 8, ry - 1, 20, 18, '#e2dac4');
        drawFood(ctx, x + 18, ry + 11, it.key, 0.85);
        drawText(ctx, it.label, x + 34, ry + 2, '#2c2732');
        const pr = it.priceLabel;
        drawText(ctx, pr, x + w - 12 - textWidth(pr), ry + 2, '#a8564a');
      }
    } else {
      const w = 160, h = 66;
      const x = Math.round((W - w) / 2), y = 96;
      panel(ctx, x, y, w, h, S.cookingLabel, S.col, S.sign);
      drawFood(ctx, x + 26, y + 46, this.item.key, 1.6);
      box(ctx, x + 50, y + 28, 98, 7, '#e2dac4');
      box(ctx, x + 50, y + 28, 98 * clamp(this.k, 0, 1), 7, S.col);
      drawText(ctx, this.item.label, x + 50, y + 42, '#2c2732');
      for (let i = 0; i < 5; i++) {
        ctx.globalAlpha = 0.45;
        box(ctx, x + 20 + i * 5, y + 34 - ((this.t * 16 + i * 6) % 22), 2, 3, '#ffffff');
        ctx.globalAlpha = 1;
      }
    }
  }
}

/* ------------------------------------------------------- staying awake --*/

/** The afternoon, as a bar you have to keep pushing back. */
export class StayAwake {
  constructor(opts = {}) {
    this.k = 0;
    this.rate = opts.rate || 0.075;
    this.t = 0;
    this.need = opts.need || 16;      // how long you must last to win
    this.held = 0;
    this.done = false;
    this.slept = false;
    this.pips = [];
    this.pipT = 1.4;
  }
  update(dt) {
    this.t += dt;
    this.held += dt;
    this.k = clamp(this.k + dt * this.rate, 0, 1);
    this.pipT -= dt;
    if (this.pipT <= 0) {
      this.pipT = 1.1 + R.f(0, 1.4);
      this.pips.push({ x: R.f(60, W - 60), y: R.f(120, 200), life: 2.4, age: 0 });
    }
    for (let i = this.pips.length - 1; i >= 0; i--) {
      const p = this.pips[i];
      p.age += dt;
      p.y -= dt * 7;
      if (p.age > p.life) { this.pips.splice(i, 1); this.k = clamp(this.k + 0.08, 0, 1); }
    }
    if (this.k >= 1) { this.done = true; this.slept = true; }
    else if (this.held > this.need) { this.done = true; this.slept = false; }
  }
  press(px, py) {
    for (let i = this.pips.length - 1; i >= 0; i--) {
      const p = this.pips[i];
      if (Math.abs(p.x - px) < 14 && Math.abs(p.y - py) < 14) {
        this.pips.splice(i, 1);
        this.k = clamp(this.k - 0.12, 0, 1);
        return true;
      }
    }
    this.k = clamp(this.k - 0.045, 0, 1);
    return true;
  }
  move() {}
  draw(ctx) {
    // eyelids, coming down
    const lid = Math.round(H * 0.42 * this.k);
    ctx.globalAlpha = 0.9;
    box(ctx, 0, 0, W, lid, '#0a0a12');
    box(ctx, 0, H - lid, W, lid, '#0a0a12');
    ctx.globalAlpha = 1;
    for (const p of this.pips) {
      const a = clamp(1 - p.age / p.life, 0, 1);
      ctx.globalAlpha = a;
      drawText(ctx, 'z', p.x, p.y, '#dfe4f4');
      drawText(ctx, 'z', p.x + 5, p.y - 5, '#c8d0e8');
      ctx.globalAlpha = 1;
    }
  }
}
