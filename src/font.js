/* ============================================================================
 *  font.js — a 5x8 pixel typeface, drawn by hand and packed.
 *
 *  Each glyph is eight rows; each row is one base-32 digit whose five bits are
 *  the five columns, low bit on the left.  Caps sit on rows 0..6, lowercase on
 *  rows 2..6, and descenders drop into row 7.
 * ==========================================================================*/

import { RES } from './vista.js';

const B32 = '0123456789abcdefghijklmnopqrstuv';
const GLYPHS = {
  "A":"ehhvhhh0", "B":"fhhfhhf0", "C":"u11111u0", "D":"fhhhhhf0",
  "E":"v11f11v0", "F":"v11f1110", "G":"u11phhe0", "H":"hhhvhhh0",
  "I":"e44444e0", "J":"s8888960", "K":"h95359h0", "L":"111111v0",
  "M":"hrllhhh0", "N":"hjllphh0", "O":"ehhhhhe0", "P":"fhhf1110",
  "Q":"ehhhl9m0", "R":"fhhf59h0", "S":"u11eggf0", "T":"v4444440",
  "U":"hhhhhhe0", "V":"hhhhha40", "W":"hhhllrh0", "X":"hha4ahh0",
  "Y":"hha44440", "Z":"vg8421v0", "a":"00eguhu0", "b":"11fhhhf0",
  "c":"00u111u0", "d":"gguhhhu0", "e":"00ehv1e0", "f":"c22f2220",
  "g":"00uhhuge", "h":"11fhhhh0", "i":"406444e0", "j":"80c88886",
  "k":"11953590", "l":"644444e0", "m":"00bllll0", "n":"00fhhhh0",
  "o":"00ehhhe0", "p":"00fhhf11", "q":"00uhhugg", "r":"00d31110",
  "s":"00u1egf0", "t":"22f22ic0", "u":"00hhhhu0", "v":"00hhha40",
  "w":"00lllla0", "x":"00ha4ah0", "y":"00hhhuge", "z":"00v842v0",
  "0":"ehpljhe0", "1":"464444e0", "2":"ehg842v0", "3":"fggeggf0",
  "4":"8ca9v880", "5":"v1fgghe0", "6":"c21fhhe0", "7":"vg844220",
  "8":"ehhehhe0", "9":"ehhug860", " ":"00000000", ".":"00000660",
  ",":"00000662", "!":"44444040", "?":"ehgc4040", "'":"44000000",
  "\"":"aa000000", "-":"000v0000", ":":"04404400", ";":"04404420",
  "(":"84222480", ")":"24888420", "/":"gg842110", "~":"00m90000",
  "*":"0level00", "+":"044v4400", "&":"6953p9m0", "%":"jb42pq10",
  ">":"02484200", "<":"08424800", "=":"00v0v000", "[":"c44444c0", "]":"64444460",
};

export const GLYPH_W = 5;
export const GLYPH_H = 8;

/** Columns actually used by a glyph, so letters are not all five wide. */
const TRIM = {};
function trim(ch) {
  if (TRIM[ch] !== undefined) return TRIM[ch];
  const g = GLYPHS[ch];
  if (!g) return (TRIM[ch] = [0, 4]);
  let lo = 5, hi = -1;
  for (let y = 0; y < 8; y++) {
    const bits = B32.indexOf(g[y]);
    for (let x = 0; x < 5; x++) {
      if (bits & (1 << x)) { if (x < lo) lo = x; if (x > hi) hi = x; }
    }
  }
  if (hi < 0) { lo = 0; hi = 1; }                 // a space
  return (TRIM[ch] = [lo, hi]);
}

/* ---------------------------------------------------------------- Thai --*/
/*  Thai cannot be drawn with a five-wide cell: it stacks vowels above and
    below the line and puts tone marks above those.  So for Thai the text is
    rasterised once with a real typeface and then hard-thresholded, which
    throws away the anti-aliasing and leaves clean one-bit pixels that sit on
    the same grid as everything else.                                        */

export const FONT_STACK = "'Noto Sans Thai', 'Noto Sans Thai UI', 'Leelawadee UI', 'Thonburi', 'Tahoma', sans-serif";
let LANG = 'th';
export function setLang(l) { LANG = l === 'en' ? 'en' : 'th'; }
export function lang() { return LANG; }
/** Pick the right string out of {th, en}; plain strings pass through. */
export function T(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v;
  return (LANG === 'en' ? (v.en || v.th) : (v.th || v.en)) || '';
}

const THAI_SIZE = 13;          // the pixel height Thai is rasterised at
const THAI_LINE = 15;
/* Anything measured before the webfont arrives was measured against a
   fallback, so throw it all away once it lands.                            */
if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => { rasterCache.clear(); widthCache.clear(); measure = null; });
}
let measure = null;
const rasterCache = new Map();
const widthCache = new Map();

function measureCtx() {
  if (measure) return measure;
  const c = document.createElement('canvas');
  c.width = 8; c.height = 8;
  measure = c.getContext('2d');
  measure.font = `${THAI_SIZE}px ${FONT_STACK}`;
  return measure;
}

export function isThai(s) { return /[\u0E00-\u0E7F]/.test(s); }

function thaiWidth(s) {
  if (widthCache.has(s)) return widthCache.get(s);
  const m = measureCtx();
  m.font = `${THAI_SIZE}px ${FONT_STACK}`;
  const w = Math.ceil(m.measureText(s).width);
  widthCache.set(s, w);
  return w;
}

/** A one-bit bitmap of one string, kept so it is only ever rasterised once. */
function thaiRaster(s, color) {
  const key = s + '|' + color;
  const hit = rasterCache.get(key);
  if (hit) return hit;
  // rasterised at the buffer's real resolution, so it is as sharp as it can be
  const w = Math.max(1, (thaiWidth(s) + 2) * RES);
  const h = (THAI_LINE + 8) * RES;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.font = `${THAI_SIZE * RES}px ${FONT_STACK}`;
  g.textBaseline = 'alphabetic';
  g.fillStyle = '#ffffff';
  g.fillText(s, RES, THAI_LINE * RES);
  const img = g.getImageData(0, 0, w, h);
  const d = img.data;
  const rgb = [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16));
  for (let i = 0; i < d.length; i += 4) {
    const on = d[i + 3] > 110;                   // the threshold that makes it pixels
    d[i] = rgb[0]; d[i + 1] = rgb[1]; d[i + 2] = rgb[2];
    d[i + 3] = on ? 255 : 0;
  }
  g.putImageData(img, 0, 0);
  if (rasterCache.size > 600) rasterCache.clear();
  rasterCache.set(key, c);
  return c;
}

export function charWidth(ch) {
  const [lo, hi] = trim(ch);
  return hi - lo + 1;
}

export function textWidth(s, tracking = 1) {
  if (isThai(s)) return thaiWidth(s);
  let w = 0;
  for (const ch of s) w += charWidth(ch) + tracking;
  return Math.max(0, w - tracking);
}

/** How tall one line of text is, which differs between the two scripts. */
export function lineHeight(s) { return isThai(s) ? THAI_LINE - 2 : GLYPH_H; }
export const THAI_TOP = 4;       // Thai sits a little lower in its box

/** Draw a string with its left edge at x and its cap line at y. */
export function drawText(ctx, s, x, y, color = '#ffffff', tracking = 1) {
  if (isThai(s)) {
    const c = thaiRaster(s, color);
    ctx.drawImage(c, Math.round(x) - 1, Math.round(y) - THAI_LINE + 7, c.width / RES, c.height / RES);
    return Math.round(x) + c.width / RES;
  }
  let cx = Math.round(x);
  const cy = Math.round(y);
  ctx.fillStyle = color;
  for (const ch of s) {
    const g = GLYPHS[ch] || GLYPHS['?'];
    const [lo, hi] = trim(ch);
    for (let row = 0; row < 8; row++) {
      const bits = B32.indexOf(g[row]);
      if (!bits) continue;
      for (let col = lo; col <= hi; col++) {
        if (bits & (1 << col)) ctx.fillRect(cx + col - lo, cy + row, 1, 1);
      }
    }
    cx += hi - lo + 1 + tracking;
  }
  return cx;
}

/** Break a string into lines that fit a width, on spaces. */
export function wrapText(s, maxW, tracking = 1) {
  if (isThai(s)) return wrapThai(s, maxW);
  const words = s.split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (textWidth(test, tracking) > maxW && line) { lines.push(line); line = w; }
    else line = test;
  }
  if (line) lines.push(line);
  return lines;
}


/* Thai does not put spaces between words, so break on the spaces the writer
   did use and, failing that, on whatever fits — never in the middle of a
   character's stack of vowels and tone marks.                               */
const COMBINING = /[\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]/;
function wrapThai(s, maxW) {
  const chunks = s.split(' ').filter((c) => c.length);
  const lines = [];
  let line = '';
  const push = () => { if (line) lines.push(line); line = ''; };
  for (const ch of chunks) {
    const test = line ? line + ' ' + ch : ch;
    if (thaiWidth(test) <= maxW) { line = test; continue; }
    if (!line && thaiWidth(ch) > maxW) {
      // one long run: cut it where it fits, never before a combining mark
      let cur = '';
      for (const c of ch) {
        if (thaiWidth(cur + c) > maxW && cur && !COMBINING.test(c)) { lines.push(cur); cur = c; }
        else cur += c;
      }
      line = cur;
    } else { push(); line = ch; }
  }
  push();
  return lines.length ? lines : [''];
}
