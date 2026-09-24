/* ============================================================================
 *  places.js — the rooms and the road up the mountain.
 *
 *  Side-on, flat, and specific: a Bangkok school block with its louvre
 *  windows and ceiling fans, the canteen at the back, the gate and the soi
 *  outside it, then the trail, the spirit house, the termite mound people
 *  leave cloth on, and the butterfly pea field at the top.
 * ==========================================================================*/

import { rng, lerp, shade, rgba, fillEllipse } from './core.js';
import { W, H } from './vista.js';

const R = rng(4242);
const box = (ctx, x, y, w, h, c) => {
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
};
const vgrad = (ctx, x, y, w, h, a, b) => {
  for (let i = 0; i < h; i++) box(ctx, x, y + i, w, 1, lerp2(a, b, i / Math.max(1, h - 1)));
};
function lerp2(a, b, t) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const r = Math.round(lerp((pa >> 16) & 255, (pb >> 16) & 255, t));
  const g = Math.round(lerp((pa >> 8) & 255, (pb >> 8) & 255, t));
  const bl = Math.round(lerp(pa & 255, pb & 255, t));
  return '#' + ((r << 16) | (g << 8) | bl).toString(16).padStart(6, '0');
}

/* ----------------------------------------------------------- gate and soi --*/

export function drawGate(ctx, cam, t, G = {}) {
  const gy = 252;
  const v = (wx) => wx - cam;
  const dusk = G.dusk === undefined ? 0.45 : G.dusk;
  vgrad(ctx, 0, 0, W, 170, lerp2('#8fc0dc', '#e8a266', dusk), lerp2('#dfe8ee', '#f8dcb0', dusk));
  // a few flat clouds, and the sun low over the rooftops
  for (let i = 0; i < 7; i++) {
    const x = ((i * 97) - cam * 0.06) % (W + 120) - 60;
    const y = 18 + (i % 3) * 16;
    ctx.globalAlpha = 0.5;
    box(ctx, x, y, 34 + (i % 2) * 14, 5, lerp2('#ffffff', '#ffd9a8', dusk));
    box(ctx, x + 8, y - 4, 20, 4, lerp2('#ffffff', '#ffe4bc', dusk));
    ctx.globalAlpha = 1;
  }
  if (dusk > 0.2) {
    ctx.globalAlpha = 0.5;
    box(ctx, v(560), 120, 26, 12, '#ffcf8a');
    ctx.globalAlpha = 1;
  }
  // the shophouse row
  for (let i = 0; i < 11; i++) {
    const x = Math.round(-((cam * 0.55) % 80) + i * 80 - 80);
    const h2 = 86 + (i % 3) * 18;
    box(ctx, x, 170 - h2, 76, h2, ['#d8cbb4', '#c4b8a4', '#cfc0ae'][i % 3]);
    box(ctx, x, 170 - h2, 76, 3, '#a89c88');
    box(ctx, x + 74, 170 - h2, 2, h2, '#a89c88');
    for (let r2 = 0; r2 < 2; r2++) {
      for (let c = 0; c < 3; c++) {
        box(ctx, x + 8 + c * 22, 170 - h2 + 14 + r2 * 26, 15, 18, dusk > 0.35 ? '#ffe2a0' : '#8fa8b4');
        box(ctx, x + 8 + c * 22, 170 - h2 + 14 + r2 * 26, 15, 2, '#8a8070');
      }
    }
    box(ctx, x + 2, 150, 72, 9, ['#c25a4a', '#3f7ea8', '#d8a03c'][i % 3]);   // awnings
    box(ctx, x, 159, 76, 11, '#9a9078');
    if (i % 2) { box(ctx, x + 18, 138, 4, 14, '#c8a44a'); box(ctx, x + 16, 132, 8, 8, '#c8302e'); }  // a sign hanging out
  }
  // power poles and lines
  for (let i = 0; i < 6; i++) {
    const x = Math.round(-((cam * 0.75) % 140) + i * 140 - 70);
    box(ctx, x, 44, 3, 126, '#a8a49c');
    box(ctx, x - 9, 54, 21, 2, '#8a867e');
    for (let k = 0; k < 4; k++) {
      ctx.fillStyle = '#4a4a50';
      for (let d = 0; d < 140; d++) {
        ctx.fillRect(x + d, Math.round(58 + k * 3 + Math.sin((d / 140) * Math.PI) * 5), 1, 1);
      }
    }
    box(ctx, x - 5, 62, 4, 6, '#6a6a70');
  }
  // the road, the kerb, the pavement
  box(ctx, 0, 170, W, 26, '#b4ac96');
  box(ctx, 0, 196, W, 28, '#6a6a70');
  box(ctx, 0, 196, W, 1, '#7f7f86');
  for (let x = -Math.round(cam) % 40; x < W; x += 40) box(ctx, x, 209, 18, 2, '#d8d4c8');
  box(ctx, 0, 224, W, 5, '#cfc8b4');
  box(ctx, 0, 229, W, H - 229, '#bfb8a2');
  for (let x = -Math.round(cam) % 46; x < W; x += 46) box(ctx, x, 229, 1, H - 229, '#a89f8a');
  for (let i = 0; i < 5; i++) box(ctx, 0, 229 + i * 14, W, 1, shade('#bfb8a2', -0.04 - i * 0.012));
  // a drain cover and a few paving stains
  box(ctx, v(420), gy + 14, 22, 8, '#8f8877');
  for (let i = 0; i < 4; i++) box(ctx, v(424) + i * 5, gy + 16, 2, 4, '#75705f');

  /* the school wall and gate at the left */
  const gx = v(90);
  if (gx > -180 && gx < W + 60) {
    box(ctx, gx - 160, 108, 148, 116, '#e0d8c0');
    box(ctx, gx - 160, 108, 148, 5, '#c8bfa4');
    for (let i = 0; i < 10; i++) box(ctx, gx - 158 + i * 15, 122, 3, 96, '#8a9aa4');
    box(ctx, gx - 160, 118, 148, 4, '#8a9aa4');
    box(ctx, gx - 12, 78, 14, 146, '#d8cfb4');
    box(ctx, gx - 12, 78, 14, 6, '#b8ab8a');
    box(ctx, gx - 10, 94, 10, 34, '#a51931');           // the school sign
    for (let i = 0; i < 4; i++) box(ctx, gx - 8, 98 + i * 8, 6, 2, '#f4e8c0');
    box(ctx, gx - 30, 100, 16, 20, '#4e7a3c');          // the tree inside the wall
    box(ctx, gx - 34, 88, 26, 16, '#3f6a32');
    box(ctx, gx - 24, 118, 3, 16, '#6a4a32');
  }
  // a songthaew waiting, a motorbike, a cart, the shop
  const sw = v(330);
  if (sw > -70 && sw < W + 70) songthaew(ctx, sw, 224, t);
  const mb = v(470);
  if (mb > -40 && mb < W + 40) motorbike(ctx, mb, 224);
  const cart = v(640);
  if (cart > -70 && cart < W + 70) foodCart(ctx, cart, gy - 2, t);
  const sh = v(800);
  if (sh > -110 && sh < W + 50) {
    box(ctx, sh - 62, 78, 124, 92, '#e8e4d8');
    box(ctx, sh - 62, 78, 124, 12, '#2e7a48');
    box(ctx, sh - 62, 90, 124, 5, '#d8641e');
    box(ctx, sh - 54, 100, 106, 46, dusk > 0.3 ? '#fff0c0' : '#bfd8e0');
    box(ctx, sh - 54, 100, 106, 2, '#8fa8b4');
    box(ctx, sh - 12, 100, 24, 70, '#cfe2e8');
    box(ctx, sh - 12, 100, 2, 70, '#9ab4bc');
    box(ctx, sh + 10, 100, 2, 70, '#9ab4bc');
    for (let i = 0; i < 4; i++) box(ctx, sh - 48 + i * 26, 106, 20, 30, '#dfe8ec');
  }
  // a couple of potted plants and a bin on the pavement
  for (const wx of [200, 560, 860]) {
    const x = v(wx);
    if (x < -20 || x > W + 20) continue;
    box(ctx, x - 6, gy - 11, 12, 11, '#a8674a');
    for (let i = 0; i < 6; i++) box(ctx, x - 6 + i * 2, gy - 18 - (i % 3) * 5, 2, 8, i % 2 ? '#4e8a3c' : '#3f7030');
  }
  const bin = v(720);
  box(ctx, bin, gy - 17, 15, 17, '#5d6a72');
  box(ctx, bin - 1, gy - 19, 17, 3, '#49545a');
}

function songthaew(ctx, x, y, t) {
  box(ctx, x - 34, y - 34, 68, 26, '#b23a30');        // the back
  box(ctx, x - 34, y - 36, 68, 3, '#8f2b24');
  for (let i = 0; i < 5; i++) box(ctx, x - 30 + i * 14, y - 32, 2, 22, '#d8564a');
  box(ctx, x + 22, y - 44, 22, 36, '#b23a30');        // the cab
  box(ctx, x + 26, y - 40, 14, 12, '#9fc4d8');
  box(ctx, x - 36, y - 10, 80, 4, '#5a4a48');
  wheel(ctx, x - 22, y - 2, t);
  wheel(ctx, x + 28, y - 2, t);
  box(ctx, x - 34, y - 46, 66, 4, '#d8d0b8');         // the roof rack
}
function motorbike(ctx, x, y) {
  box(ctx, x - 10, y - 12, 22, 5, '#3a3a44');
  box(ctx, x - 2, y - 20, 4, 9, '#c25a4a');
  box(ctx, x + 8, y - 22, 3, 10, '#5a5a64');
  wheel(ctx, x - 11, y - 3, 0, 5);
  wheel(ctx, x + 11, y - 3, 0, 5);
}
function wheel(ctx, x, y, t, r = 7) {
  fillEllipse(ctx, x, y, r, r, '#2c2c32');
  fillEllipse(ctx, x, y, r * 0.45, r * 0.45, '#8a8a92');
  void t;
}
function foodCart(ctx, x, y, t) {
  box(ctx, x - 24, y - 26, 48, 18, '#c4b48c');
  box(ctx, x - 24, y - 28, 48, 3, '#a89870');
  box(ctx, x - 26, y - 46, 52, 4, '#d8a03c');         // the parasol
  box(ctx, x - 1, y - 44, 2, 18, '#8a8072');
  wheel(ctx, x - 16, y - 5, 0, 5);
  wheel(ctx, x + 16, y - 5, 0, 5);
  box(ctx, x - 18, y - 34, 12, 8, '#6f8f58');         // som tam mortar and a grill
  box(ctx, x + 4, y - 33, 16, 7, '#4a4a50');
  if ((t * 2) % 2 < 1.2) { ctx.globalAlpha = 0.25; box(ctx, x + 10, y - 42 - ((t * 8) % 10), 3, 4, '#ffffff'); ctx.globalAlpha = 1; }
}

/* ------------------------------------------------ the mound and the shrine */

/** The termite mound people leave cloth and offerings on. */
export function drawAntMound(ctx, x, gy, t, G = {}) {
  const h = 40, w = 26;
  for (let i = 0; i <= h; i++) {
    const k = i / h;
    const ww = w * Math.pow(1 - k, 0.62);
    box(ctx, x - ww, gy - i, ww * 2, 1, lerp2('#8a5a3a', '#b4855a', k));
    if (k > 0.2 && k < 0.9) box(ctx, x + ww * 0.3, gy - i, ww * 0.7, 1, '#75462c');
  }
  // knobbly turrets
  box(ctx, x - 10, gy - h - 6, 4, 8, '#9a6642');
  box(ctx, x + 4, gy - h - 3, 4, 6, '#9a6642');
  // the cloth wrapped round it, and a garland
  for (const [c, yy] of [['#d84f4f', 14], ['#e8c84a', 19], ['#4f74d8', 24]]) {
    box(ctx, x - w * 0.62, gy - yy, w * 1.24, 3, c);
    box(ctx, x - w * 0.62, gy - yy + 2, w * 1.24, 1, shade(c, -0.3));
  }
  box(ctx, x - 14, gy - 4, 28, 4, '#8a5a3a');
  // offerings at the foot: a glass of water, marigolds, three sticks of incense
  box(ctx, x - 16, gy - 6, 4, 6, '#bfe0ea');
  for (let i = 0; i < 3; i++) box(ctx, x + 8 + i * 4, gy - 5, 3, 3, '#e8a83c');
  for (let i = 0; i < 3; i++) {
    const ix = x + 2 + i * 2;
    box(ctx, ix, gy - 20, 1, 16, '#8a4a3a');
    box(ctx, ix, gy - 21, 1, 1, '#ff7a3a');
    if (G.smoke !== false) {
      ctx.globalAlpha = 0.3;
      for (let k = 0; k < 5; k++) {
        box(ctx, ix + Math.sin(t * 1.3 + k * 0.9 + i) * 2, gy - 24 - k * 4 - ((t * 5) % 4), 1, 1, '#ffffff');
      }
      ctx.globalAlpha = 1;
    }
  }
  // ants, going up and coming down
  for (let i = 0; i < 12; i++) {
    const k = ((t * 0.07 + i * 0.083) % 1);
    const up = i % 2 === 0;
    const yy = gy - k * h;
    const ww = w * Math.pow(1 - k, 0.62);
    box(ctx, x + (up ? -ww * 0.5 : ww * 0.5), yy, 1, 1, '#3a2a22');
  }
}

/** A spirit house on its post, with everything people have left on it. */
export function drawShrine(ctx, x, gy, t) {
  const top = gy - 54;
  box(ctx, x - 4, gy - 34, 8, 34, '#d8cfb4');            // the post
  box(ctx, x - 4, gy - 34, 2, 34, '#f0e8cc');
  box(ctx, x - 16, top + 18, 32, 4, '#c8a44a');          // the platform
  box(ctx, x - 14, top + 6, 28, 12, '#e8dcc0');          // the house
  box(ctx, x - 14, top + 6, 28, 2, '#f6eed8');
  box(ctx, x - 4, top + 10, 8, 8, '#8a6a3a');            // the door
  // a tiered roof with the finials Thai shrines have
  for (let i = 0; i < 3; i++) {
    const ww = 20 - i * 5;
    box(ctx, x - ww, top + i * 4 - 4, ww * 2, 4, '#c8452e');
    box(ctx, x - ww, top + i * 4 - 4, ww * 2, 1, '#e86a4a');
  }
  box(ctx, x - 1, top - 12, 2, 8, '#e8c84a');
  box(ctx, x - 12, top - 6, 2, 5, '#e8c84a');
  box(ctx, x + 10, top - 6, 2, 5, '#e8c84a');
  // garlands, a red fanta with a straw, two small elephants
  for (let i = 0; i < 4; i++) box(ctx, x - 12 + i * 8, top + 20, 5, 4, i % 2 ? '#e8b84a' : '#f4e8a0');
  box(ctx, x + 8, top + 14, 4, 8, '#c8302e');
  box(ctx, x + 9, top + 10, 1, 5, '#e8e8f0');
  box(ctx, x - 13, top + 14, 6, 5, '#d8c8a8');
  box(ctx, x - 14, top + 16, 2, 3, '#d8c8a8');
  // incense in a pot, smoking
  box(ctx, x - 22, gy - 10, 8, 10, '#a8906a');
  for (let i = 0; i < 3; i++) {
    const ix = x - 20 + i * 2;
    box(ctx, ix, gy - 24, 1, 14, '#8a4a3a');
    ctx.globalAlpha = 0.28;
    for (let k = 0; k < 6; k++) box(ctx, ix + Math.sin(t * 1.1 + k + i) * 2.5, gy - 28 - k * 4 - ((t * 6) % 4), 1, 1, '#ffffff');
    ctx.globalAlpha = 1;
  }
  // the ribbons round the tree beside it
  box(ctx, x + 24, gy - 40, 7, 40, '#6a4a32');
  for (const [c, yy] of [['#e8c84a', 18], ['#d84f4f', 24], ['#f0f0f0', 30]]) box(ctx, x + 22, gy - yy, 11, 3, c);
}

/** Butterfly pea on bamboo trellises, as far along the ridge as you can see. */
/* ---------------------------------------------------------------- extras --*/

/** The cicada-and-dust shimmer that sells a hot afternoon. */
export function heatShimmer(ctx, t, amount = 1) {
  if (amount <= 0) return;
  ctx.globalAlpha = 0.05 * amount;
  for (let i = 0; i < 26; i++) {
    const y = 150 + ((i * 37 + t * 9) % (H - 150));
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(Math.round(Math.sin(t * 0.7 + i) * 6 + i * 19) % W, Math.round(y), 22, 1);
  }
  ctx.globalAlpha = 1;
}


/** The kerb, a tree and a parked bike, all of it in front of the pavement. */
export function drawGateFg(ctx, cam) {
  const v = (wx) => wx - cam;
  for (const wx of [150, 640]) {
    const x = v(wx);
    if (x > -40 && x < W + 40) {
      box(ctx, x - 5, 250, 11, H - 250, '#6a4a32');
      box(ctx, x - 5, 250, 3, H - 250, '#82603f');
      box(ctx, x - 26, 244, 54, 16, '#3f6a32');
      box(ctx, x - 20, 236, 42, 12, '#4e7c3c');
      box(ctx, x - 12, 230, 26, 8, '#5c8a44');
    }
  }
  const b = v(420);
  if (b > -60 && b < W + 60) {
    box(ctx, b - 16, 282, 34, 6, '#3a3a44');
    box(ctx, b - 2, 270, 5, 13, '#c25a4a');
    box(ctx, b + 12, 266, 4, 16, '#5a5a64');
    fillEllipse(ctx, b - 17, 291, 8, 8, '#2c2c32');
    fillEllipse(ctx, b + 17, 291, 8, 8, '#2c2c32');
    fillEllipse(ctx, b - 17, 291, 3, 3, '#8a8a92');
    fillEllipse(ctx, b + 17, 291, 3, 3, '#8a8a92');
  }
  box(ctx, 0, H - 4, W, 4, '#a89f8a');
}

/* ----------------------------------------------------------------- dream --*/

/** Where she goes when the afternoon wins: too bright, too soft, no edges. */
export function drawDream(ctx, cam, t) {
  vgrad(ctx, 0, 0, W, 190, '#eaf2fb', '#dff0e4');
  // a bloom of light where the sun should be
  for (let i = 10; i > 0; i--) {
    ctx.globalAlpha = 0.05;
    fillEllipse(ctx, W * 0.62, 70, i * 11, i * 9, '#ffffff');
  }
  ctx.globalAlpha = 1;
  // soft hills
  const hill = (yBase, amp, col, off) => {
    ctx.fillStyle = col;
    for (let x = 0; x < W; x++) {
      const y = yBase + Math.sin((x + cam * off + t * 2) * 0.008) * amp;
      ctx.fillRect(x, Math.round(y), 1, H - Math.round(y));
    }
  };
  hill(150, 10, '#cfe4d2', 0.1);
  hill(176, 8, '#b2d8b6', 0.2);
  hill(198, 6, '#96c894', 0.3);
  ctx.fillStyle = '#8bc088';
  ctx.fillRect(0, 214, W, H - 214);
  // grass, and butterfly pea through it, all of it swaying together
  const r2 = rng(2323);
  for (let i = 0; i < 420; i++) {
    const x = r2.f(0, W);
    const y = 206 + r2.f(0, H - 210);
    const sway = Math.sin(t * 0.9 + x * 0.05) * 1.6;
    const k = (y - 206) / (H - 210);
    if (r2.chance(0.24)) {
      box(ctx, x + sway, y - 4, 1, 5, '#5f9a5c');
      box(ctx, x + sway - 1, y - 7, 3, 3, '#7a68e8');
      box(ctx, x + sway, y - 7, 1, 1, '#b0a2f4');
    } else {
      box(ctx, x + sway * k, y - 3, 1, 4, r2.chance(0.5) ? '#77b271' : '#63a05f');
    }
  }
  // motes drifting up
  ctx.globalAlpha = 0.5;
  for (let i = 0; i < 40; i++) {
    const x = (i * 37 + Math.sin(t * 0.3 + i) * 20) % W;
    const y = (H - ((t * 9 + i * 31) % (H + 40)));
    box(ctx, x, y, 1, 1, '#ffffff');
  }
  ctx.globalAlpha = 1;
  // a soft white edge all round, so it never feels solid
  for (let i = 0; i < 26; i++) {
    ctx.globalAlpha = 0.045 * (1 - i / 26);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, i, W, 1);
    ctx.fillRect(0, H - 1 - i, W, 1);
    ctx.fillRect(i, 0, 1, H);
    ctx.fillRect(W - 1 - i, 0, 1, H);
  }
  ctx.globalAlpha = 1;
}
