/* ============================================================================
 *  font.js — a 5x8 pixel typeface, drawn by hand and packed.
 *
 *  Each glyph is eight rows; each row is one base-32 digit whose five bits are
 *  the five columns, low bit on the left.  Caps sit on rows 0..6, lowercase on
 *  rows 2..6, and descenders drop into row 7.
 * ==========================================================================*/

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

export function charWidth(ch) {
  const [lo, hi] = trim(ch);
  return hi - lo + 1;
}

export function textWidth(s, tracking = 1) {
  let w = 0;
  for (const ch of s) w += charWidth(ch) + tracking;
  return Math.max(0, w - tracking);
}

/** Draw a string with its left edge at x and its cap line at y. */
export function drawText(ctx, s, x, y, color = '#ffffff', tracking = 1) {
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
