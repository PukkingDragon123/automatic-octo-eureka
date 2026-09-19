/* ============================================================================
 *  critters.js — the small nuisances.
 *
 *  Two things turn up uninvited.  Beetles settle on the flowers and chew at
 *  them until somebody flicks them off, and crows come down to bully the dog
 *  away from his bowl.  Neither is a quest and neither is announced; they just
 *  happen while you are looking somewhere else, and you can shoo them.
 * ==========================================================================*/

import { rng, clamp, lerp, shade, fillEllipse } from './core.js';

const R = rng(7331);

export class Critters {
  constructor() {
    this.bugs = [];
    this.birds = [];
    this.bugT = 14;
    this.birdT = 40;
  }
  clear() { this.bugs.length = 0; this.birds.length = 0; }

  /* ------------------------------------------------------------- beetles */
  addBug(patchIndex, wx, wy) {
    this.bugs.push({
      patch: patchIndex, x: wx, y: wy, hx: wx, t: R.f(0, 6),
      chew: 0, leaving: 0, vy: 0, kind: R.i(0, 2),
    });
  }
  /* --------------------------------------------------------------- crows */
  addBird(wx, targetX) {
    this.birds.push({
      x: wx, y: -20, tx: targetX, t: R.f(0, 6), state: 'diving',
      hop: 0, peck: 0, timer: R.f(6, 11), flee: 0, vx: 0, vy: 0, size: R.f(0.9, 1.15),
    });
  }

  /**
   * env: { t, dt, patches, patchAt(i), dog, standY, bowlX, food, onSteal, onPeck,
   *        onBugBite, fx, cam, quiet }
   */
  update(dt, env) {
    /* beetles find whichever clump is furthest along */
    this.bugT -= dt;
    if (this.bugT <= 0 && !env.quiet) {
      this.bugT = R.f(16, 34);
      const grown = env.patches.map((p, i) => [i, p]).filter(([, p]) => p.grown > 0.3);
      if (grown.length && this.bugs.length < 5) {
        const [i] = grown[R.i(0, grown.length - 1)];
        const at = env.patchAt(i);
        this.addBug(i, at.x + R.f(-at.spread, at.spread), at.y - R.f(3, 11));
      }
    }
    for (let i = this.bugs.length - 1; i >= 0; i--) {
      const b = this.bugs[i];
      b.t += dt;
      if (b.leaving > 0) {
        b.leaving -= dt;
        b.x += Math.cos(b.t * 3) * 26 * dt;
        b.y -= 34 * dt;
        if (b.leaving <= 0) this.bugs.splice(i, 1);
        continue;
      }
      // a slow crawl along the clump, stopping to chew
      b.x = lerp(b.x, b.hx, 1 - Math.pow(0.4, dt));
      if (R.chance(dt * 0.5)) b.hx = b.x + R.f(-12, 12);
      b.chew += dt;
      if (b.chew > 2.4) {
        b.chew = 0;
        if (env.onBugBite) env.onBugBite(b.patch, b);
      }
    }

    /* crows come for the bowl, and shove the dog off it */
    this.birdT -= dt;
    if (this.birdT <= 0 && !env.quiet) {
      this.birdT = R.f(38, 80);
      if (this.birds.length < 2 && env.dog && env.dog.alive) {
        const at = R.chance(0.6) ? env.bowlX : env.dog.x + R.f(-40, 40);
        this.addBird(at + R.f(-90, 90), at + R.f(-14, 14));
      }
    }
    for (let i = this.birds.length - 1; i >= 0; i--) {
      const b = this.birds[i];
      b.t += dt;
      const gy = env.standY(b.x);
      if (b.state === 'diving') {
        b.x = lerp(b.x, b.tx, 1 - Math.pow(0.25, dt));
        b.y = lerp(b.y, gy, 1 - Math.pow(0.1, dt));
        if (Math.abs(b.y - gy) < 2) { b.state = 'ground'; b.y = gy; }
      } else if (b.state === 'ground') {
        b.timer -= dt;
        b.hop = Math.max(0, b.hop - dt * 3);
        // hop about, peck at the bowl, and lunge at the dog if he is close
        if (R.chance(dt * 1.6)) {
          b.hop = 1;
          const want = env.dog && env.dog.alive && Math.abs(env.dog.x - b.x) < 110 ? env.dog.x : env.bowlX;
          b.x += clamp(want - b.x, -9, 9);
        }
        if (R.chance(dt * 1.1)) {
          b.peck = 0.35;
          if (env.onPeck) env.onPeck(b);
        }
        b.peck = Math.max(0, b.peck - dt);
        b.y = gy;
        if (b.timer <= 0) { b.state = 'leaving'; b.vx = R.chance(0.5) ? -60 : 60; b.vy = -34; }
      } else {
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.vy -= 8 * dt;
        b.t += dt;
        if (b.y < -30) this.birds.splice(i, 1);
      }
    }
  }

  /** Something shooed at world (wx, wy).  Returns what was sent away. */
  shoo(wx, wy) {
    for (let i = this.birds.length - 1; i >= 0; i--) {
      const b = this.birds[i];
      if (b.state === 'leaving') continue;
      if (Math.abs(b.x - wx) < 16 && Math.abs(b.y - 8 - wy) < 20) {
        b.state = 'leaving';
        b.vx = Math.sign(b.x - wx || 1) * 90;
        b.vy = -66;
        return { kind: 'bird', x: b.x, y: b.y };
      }
    }
    for (let i = this.bugs.length - 1; i >= 0; i--) {
      const g = this.bugs[i];
      if (Math.abs(g.x - wx) < 11 && Math.abs(g.y - wy) < 12) {
        g.leaving = 0.9;
        return { kind: 'bug', x: g.x, y: g.y, patch: g.patch };
      }
    }
    return null;
  }
  get pressed() { return this.birds.some((b) => b.state === 'ground'); }

  /* ---------------------------------------------------------------- draw */
  draw(ctx, cam, night) {
    for (const g of this.bugs) this.drawBug(ctx, cam, night, g);
    for (const b of this.birds) this.drawBird(ctx, cam, night, b);
  }

  drawBug(ctx, cam, night, g) {
    const x = g.x - cam, y = g.y;
    const wob = Math.sin(g.t * 6) * 0.5;
    const shell = g.kind === 0 ? '#c2453c' : g.kind === 1 ? '#5d7a3a' : '#3f4a6a';
    const c = night ? shade(shell, -0.4) : shell;
    if (g.leaving > 0) {                         // wings out, going
      ctx.globalAlpha = clamp(g.leaving, 0, 1);
      fillEllipse(ctx, x - 2.6, y - 1 + wob, 2.6, 1.2, '#e8ecf4');
      fillEllipse(ctx, x + 2.6, y - 1 - wob, 2.6, 1.2, '#e8ecf4');
    }
    fillEllipse(ctx, x, y, 3.3, 2.6, '#241f29');
    fillEllipse(ctx, x, y, 2.7, 2.05, c);
    fillEllipse(ctx, x - 0.8, y - 0.7, 1.1, 0.8, shade(c, 0.34));
    ctx.fillStyle = shade(c, -0.4);                 // the split down the back
    ctx.fillRect(Math.round(x), Math.round(y - 1.4), 1, 3);
    ctx.fillStyle = '#241f29';
    ctx.fillRect(Math.round(x), Math.round(y - 1.6), 1, 3);
    ctx.fillRect(Math.round(x - 1), Math.round(y - 2.4), 2, 1);
    ctx.globalAlpha = 1;
  }

  drawBird(ctx, cam, night, b) {
    const x = b.x - cam;
    const hop = b.state === 'ground' ? -Math.sin(b.hop * Math.PI) * 4 : 0;
    const y = b.y + hop;
    const s = b.size;
    const flap = b.state === 'ground' ? 0 : Math.sin(b.t * 16);
    const body = night ? '#22242e' : '#31333f';
    const wing = night ? '#181a22' : '#22242c';
    ctx.globalAlpha = 0.2;
    fillEllipse(ctx, x, b.y + 1, 6 * s, 2 * s, '#1b2a16');
    ctx.globalAlpha = 1;
    // body, tail, head, beak
    fillEllipse(ctx, x, y - 6 * s, 5.4 * s, 4 * s, '#14151c');
    fillEllipse(ctx, x, y - 6 * s, 4.6 * s, 3.3 * s, body);
    fillEllipse(ctx, x - 5 * s, y - 7 * s, 3.4 * s, 1.5 * s, wing);       // tail
    const pk = b.peck > 0 ? 3 * s : 0;
    const hxx = x + 3.4 * s, hyy = y - 10 * s + pk;
    fillEllipse(ctx, hxx, hyy, 2.9 * s, 2.6 * s, '#14151c');
    fillEllipse(ctx, hxx, hyy, 2.3 * s, 2.1 * s, body);
    ctx.fillStyle = '#e8c85a';
    ctx.fillRect(Math.round(hxx + 1.6 * s), Math.round(hyy - 0.5), Math.round(3 * s), 1);
    ctx.fillStyle = '#f4f0e0';
    ctx.fillRect(Math.round(hxx + 0.4), Math.round(hyy - 1), 1, 1);
    // wing, folded on the ground and beating in the air
    fillEllipse(ctx, x - 0.6 * s, y - 6.4 * s + flap * 2, 3.6 * s, 1.9 * s + Math.abs(flap) * 1.4, wing);
    if (b.state === 'ground') {
      ctx.fillStyle = '#6a5a3a';
      ctx.fillRect(Math.round(x - 1), Math.round(y - 3), 1, 3);
      ctx.fillRect(Math.round(x + 1), Math.round(y - 3), 1, 3);
    }
  }
}
