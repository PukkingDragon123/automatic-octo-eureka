/* ============================================================================
 *  world.js — the hill itself: how wide it is, what is where on it, and the
 *  camera you look at it through.
 *
 *  Everything in the game lives in world coordinates (0 .. WORLD_W).  The
 *  window you see is W wide and slides along.  The valley behind parallaxes.
 * ==========================================================================*/

import { clamp, lerp } from './core.js';
import { W, H, LAND_W } from './vista.js';

export const WORLD_W = 1200;
export const CAM_MAX = WORLD_W - W;

/** Parallax factors for each depth. */
export const PARALLAX = { sky: 0.12, land: 0.3, ground: 1 };

/** Height of the turf at a world x. One gentle rolling crest. */
export const LAND_DY = -40;   // the valley is drawn this much higher up, so the
                              // hill you stand on gets most of the frame
export function groundY(x) {
  return (
    211 +
    Math.sin(x * 0.0042 + 1.2) * 5 +
    Math.sin(x * 0.011 + 0.4) * 2.4 +
    Math.sin(x * 0.031) * 1.1
  );
}

/* --------------------------------------------------------------- places --*/

export const PLACES = {
  steps:     { x: 95,   name: 'the steps' },
  sign:      { x: 168,  name: 'the signpost' },
  pond:      { x: 268,  rx: 47, ry: 15, name: 'the pond' },
  bigTree:   { x: 462,  name: 'the old tree' },
  log:       { x: 512,  name: 'the fallen log' },
  view:      { x: 690,  name: 'the lookout' },
  bed:       { x: 884,  rx: 40, ry: 13, name: 'the flowerbed' },
  bowl:      { x: 812,  name: 'the bowl' },
  can:       { x: 828,  name: 'the watering can' },
  rocks:     { x: 1040, name: 'the rocks' },
  grave:     { x: 1112, name: 'the resting place' },
};
// everything sits on the turf, so their heights come from the ground itself
PLACES.pond.y = groundY(PLACES.pond.x) + 30;
PLACES.bed.y = groundY(PLACES.bed.x) + 28;
PLACES.grave.y = groundY(PLACES.grave.x) + 24;

/** Where a character's feet meet the ground at a world x. */
export function standY(x) { return groundY(x) + 22; }

/** Where people arrive from and leave to — the path in, and the far end. */
export const ARRIVE_X = 30;
export const EXIT_X = WORLD_W - 30;

/* --------------------------------------------------------------- camera --*/

export class Camera {
  constructor() {
    this.x = PLACES.pond.x - W / 2;
    this.target = this.x;
    this.vx = 0;
    this.free = true;        // false while a scene is steering
    this.lookAt = null;      // world x the camera is drawn toward
    this.follow = 0;         // 0..1 how strongly it follows lookAt
    this.shake = 0;
    this.drift = 0;
  }
  clampX(v) { return clamp(v, 0, CAM_MAX); }

  /** Pull the view toward a world point over the next few seconds. */
  pan(worldX, strength = 1) {
    this.lookAt = worldX;
    this.follow = strength;
  }
  snap(worldX) {
    this.x = this.target = this.clampX(worldX - W / 2);
    this.lookAt = null;
  }
  nudge(dx) {              // dragging the background
    this.target = this.clampX(this.target - dx);
    this.lookAt = null;
    this.vx = -dx;
  }
  release() {
    // let the flick carry a little, then settle
    this.target = this.clampX(this.target + this.vx * 6);
  }

  update(dt) {
    if (this.lookAt !== null) {
      const want = this.clampX(this.lookAt - W / 2);
      this.target = lerp(this.target, want, 1 - Math.pow(0.12, dt * this.follow));
    }
    this.drift += dt;
    this.x = lerp(this.x, this.target, 1 - Math.pow(0.0015, dt));
    this.vx *= Math.pow(0.02, dt);
    this.shake = Math.max(0, this.shake - dt * 2.2);
  }

  /** Where a world x lands in the window. */
  toView(worldX) { return worldX - this.x; }
  get landOffset() { return -this.x * PARALLAX.land; }
  get skyOffset() { return -this.x * PARALLAX.sky; }
  get centre() { return this.x + W / 2; }
}

/* -------------------------------------------------------- interactables --*/

/**
 * Anything you can touch registers a hit area in world space each frame.
 * Registration order is back-to-front; the topmost match wins.
 */
export class Touchables {
  constructor() { this.list = []; }
  clear() { this.list.length = 0; }
  add(id, x, y, w, h, onTouch, opts = {}) {
    this.list.push({ id, x: x - w / 2, y: y - h, w, h, onTouch, ...opts });
  }
  hit(wx, wy) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const t = this.list[i];
      if (wx >= t.x && wx <= t.x + t.w && wy >= t.y && wy <= t.y + t.h) return t;
    }
    return null;
  }
}

/** Keep a value inside the world with a little margin. */
export const inWorld = (x, margin = 12) => clamp(x, margin, WORLD_W - margin);

export { W, H, LAND_W };
