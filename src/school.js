/* ============================================================================
 *  school.js — what the school's rooms share: the badge, the fans, the canteen
 *  banner, and the five canteen stalls with every dish they sell.  The rooms
 *  themselves live in classroom.js, hallway.js and canteen.js.
 * ==========================================================================*/

import { rgba } from './core.js';

const box = (ctx, x, y, w, h, c) => {
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
};

export const GROUND = 248;

/* The school's name, in whichever language the game is in. */
let bannerText = 'โรงอาหาร  โรงเรียนอัญชันวิทยา';
export function setBanner(text) { bannerText = text; }
export function bannerLabel() { return bannerText; }

/* --------------------------------------------------------------- the badge */

/** The school badge: a butterfly pea flower on a shield. */
export function drawLogo(ctx, x, y, s = 1, flat = false) {
  const w = 11 * s, h = 13 * s;
  // shield
  for (let i = 0; i < h; i++) {
    const k = i / h;
    const ww = k < 0.72 ? w : w * (1 - (k - 0.72) / 0.28) * 1.0;
    box(ctx, x - ww, y + i, ww * 2, 1, flat ? '#2f3a63' : (k < 0.2 ? '#3d4c80' : '#2f3a63'));
  }
  box(ctx, x - w, y, w * 2, 1, '#8090c0');
  // the flower
  const fx = x, fy = y + h * 0.42;
  box(ctx, fx - 3 * s, fy - 2 * s, 6 * s, 4 * s, '#6a55d8');
  box(ctx, fx - 2 * s, fy - 3 * s, 4 * s, 2 * s, '#8270ee');
  box(ctx, fx - 1 * s, fy + 1 * s, 2 * s, 1 * s, '#f4e08c');
  box(ctx, fx - 4 * s, fy + 1 * s, 2 * s, 1 * s, '#4231b0');
  box(ctx, fx + 2 * s, fy + 1 * s, 2 * s, 1 * s, '#4231b0');
  // two leaves under it
  box(ctx, x - 5 * s, y + h * 0.74, 3 * s, 1 * s, '#c8a44a');
  box(ctx, x + 2 * s, y + h * 0.74, 3 * s, 1 * s, '#c8a44a');
}

/* ------------------------------------------------------------------ fans */

export function drawFan(ctx, x, y, t) {
  box(ctx, x - 1, y - 30, 2, 30, '#8c8878');
  box(ctx, x - 3, y, 6, 4, '#b4ae9c');
  const a = t * 7;
  for (let i = 0; i < 3; i++) {
    const aa = a + (i * Math.PI * 2) / 3;
    const dx = Math.cos(aa), dz = Math.sin(aa) * 0.28;
    ctx.fillStyle = rgba('#9a9486', 0.85);
    for (let k = 3; k < 22; k++) ctx.fillRect(Math.round(x + dx * k), Math.round(y + 2 + dz * k), 1, 2);
  }
}

/* --------------------------------------------------------------- canteen --*/

/** Five shops, five cooks, five entirely different smells. */
export const SHOPS = [
  {
    id: 'daeng', x: 150, col: '#c2503f', sign: '#f4e8c0', cook: 'wok',
    name: { th: 'ป้าแดง ข้าวราดแกง', en: "Pa Daeng — Rice & Curry" },
    menu: [
      { key: 'kaprao', th: 'ผัดกะเพราไก่ไข่ดาว', en: 'Basil chicken, fried egg', price: 40 },
      { key: 'curry', th: 'แกงเขียวหวานไก่', en: 'Green curry', price: 40 },
      { key: 'omelette', th: 'ข้าวไข่เจียว', en: 'Omelette on rice', price: 30 },
      { key: 'prik', th: 'ผัดพริกแกงหมู', en: 'Red curry pork', price: 40 },
    ],
  },
  {
    id: 'nuat', x: 400, col: '#3f7ea8', sign: '#e8f0f4', cook: 'noodle',
    name: { th: 'ลุงหนวด ก๋วยเตี๋ยว', en: "Uncle Moustache — Noodles" },
    menu: [
      { key: 'yentafo', th: 'เย็นตาโฟ', en: 'Pink seafood noodles', price: 40 },
      { key: 'tomyum', th: 'บะหมี่ต้มยำหมู', en: 'Tom yum pork noodles', price: 40 },
      { key: 'wonton', th: 'บะหมี่เกี๊ยว', en: 'Wonton egg noodles', price: 40 },
      { key: 'ruea', th: 'ก๋วยเตี๋ยวเรือ', en: 'Boat noodles', price: 35 },
    ],
  },
  {
    id: 'saep', x: 650, col: '#6ea04a', sign: '#f0f6e0', cook: 'pound',
    name: { th: 'ครัวส้มตำแซ่บเว่อร์', en: 'Saep Ver Som Tam' },
    menu: [
      { key: 'somtam', th: 'ส้มตำไทย', en: 'Som tam Thai', price: 35 },
      { key: 'tampu', th: 'ตำปูปลาร้า', en: 'Som tam with crab', price: 40 },
      { key: 'gaiyang', th: 'ไก่ย่าง', en: 'Grilled chicken', price: 45 },
      { key: 'sticky', th: 'ข้าวเหนียว', en: 'Sticky rice', price: 10 },
    ],
  },
  {
    id: 'boy', x: 900, col: '#d8912c', sign: '#fbf0d4', cook: 'grill',
    name: { th: 'พี่บอย หมูปิ้ง-ไก่ทอด', en: "P'Boy — Grilled Pork & Fried Chicken" },
    menu: [
      { key: 'mooping', th: 'หมูปิ้ง 3 ไม้', en: 'Three pork skewers', price: 30 },
      { key: 'gaitod', th: 'ไก่ทอดหาดใหญ่', en: 'Hat Yai fried chicken', price: 40 },
      { key: 'nuggets', th: 'ไส้กรอกทอด', en: 'Fried sausage', price: 25 },
      { key: 'sticky2', th: 'ข้าวเหนียวหมูทอด', en: 'Sticky rice & fried pork', price: 35 },
    ],
  },
  {
    id: 'muay', x: 1150, col: '#8a6ad8', sign: '#efeaff', cook: 'drinks',
    name: { th: 'เจ๊หมวย น้ำแข็งใส', en: 'Jae Muay — Iced Drinks' },
    menu: [
      { key: 'chayen', th: 'ชาเย็น', en: 'Thai iced tea', price: 25 },
      { key: 'nomyen', th: 'นมเย็น', en: 'Pink milk', price: 25 },
      { key: 'oliang', th: 'โอเลี้ยง', en: 'Black iced coffee', price: 20 },
      { key: 'anchan', th: 'น้ำอัญชันมะนาว', en: 'Butterfly pea with lime', price: 25 },
    ],
  },
];

/** Every dish, at about a centimetre across. */
export function drawFood(ctx, x, y, key, s = 1) {
  const b = (dx, dy, w, h, c) => box(ctx, x + dx * s, y + dy * s, w * s, h * s, c);
  switch (key) {
    case 'kaprao':
      b(-6, 0, 12, 4, '#f2ece0'); b(-5, -2, 10, 3, '#f6f2e8');
      b(-4, -4, 8, 3, '#6b4a2c'); b(-2, -3, 3, 1, '#6ea04a');
      b(0, -7, 6, 4, '#f6eecc'); b(2, -6, 2, 2, '#f2b23c'); break;
    case 'curry':
      b(-6, -1, 12, 5, '#e8e0cc'); b(-5, -4, 10, 4, '#9ec48a');
      b(-3, -5, 3, 2, '#6ea04a'); b(1, -5, 2, 2, '#c25a4a'); break;
    case 'omelette':
      b(-6, 0, 12, 4, '#f2ece0'); b(-5, -4, 10, 5, '#f2b23c');
      b(-4, -5, 7, 2, '#f6c55c'); break;
    case 'prik':
      b(-6, 0, 12, 4, '#f2ece0'); b(-5, -4, 10, 4, '#b8452c');
      b(-2, -5, 3, 2, '#6ea04a'); break;
    case 'yentafo':
      b(-7, -2, 14, 7, '#dfe4e8'); b(-6, -1, 12, 5, '#e88aa8');
      b(-3, -2, 4, 2, '#f2ece0'); b(2, -2, 3, 2, '#c25a4a'); break;
    case 'tomyum':
      b(-7, -2, 14, 7, '#dfe4e8'); b(-6, -1, 12, 5, '#d8763c');
      b(-2, -2, 4, 2, '#f6e8b0'); b(3, -2, 2, 2, '#c25a4a'); break;
    case 'wonton':
      b(-7, -2, 14, 7, '#dfe4e8'); b(-6, -1, 12, 5, '#d8c48a');
      b(-4, -3, 4, 3, '#f2e8d0'); b(1, -3, 4, 3, '#f2e8d0'); break;
    case 'ruea':
      b(-6, -2, 12, 6, '#c8cdd2'); b(-5, -1, 10, 4, '#6a3a30');
      b(-2, -2, 4, 2, '#e8dcc0'); break;
    case 'somtam':
      b(-7, -1, 14, 5, '#e8e0cc'); b(-6, -3, 12, 3, '#8fb84a');
      b(-4, -4, 3, 2, '#d84f4f'); b(2, -4, 3, 2, '#e8a83c'); break;
    case 'tampu':
      b(-7, -1, 14, 5, '#e8e0cc'); b(-6, -3, 12, 3, '#7a9a3c');
      b(-2, -4, 4, 3, '#b8452c'); break;
    case 'gaiyang':
      b(-7, 1, 14, 3, '#e8e0cc'); b(-6, -3, 12, 5, '#c2843c');
      b(-4, -4, 7, 2, '#d89a4c'); b(4, -2, 3, 2, '#8a5a2c'); break;
    case 'sticky': case 'sticky2':
      b(-5, -2, 10, 6, '#c9b48a'); b(-4, -3, 8, 2, '#dfd0aa');
      if (key === 'sticky2') { b(2, -6, 6, 4, '#c2843c'); }
      break;
    case 'mooping':
      for (let i = 0; i < 3; i++) { b(-6 + i * 5, -6, 1, 10, '#c9b48a'); b(-7 + i * 5, -5, 4, 4, '#a85c2c'); b(-7 + i * 5, -5, 4, 1, '#c27a3c'); }
      break;
    case 'gaitod':
      b(-6, -1, 12, 5, '#e8c07c'); b(-5, -4, 10, 4, '#d8a24c'); b(-4, -5, 7, 2, '#e8b45c'); break;
    case 'nuggets':
      b(-6, -2, 12, 5, '#c26a4a'); b(-5, -3, 10, 2, '#d8825c'); break;
    case 'chayen':
      b(-4, -10, 8, 13, '#dfe8ee'); b(-3, -8, 6, 10, '#d88a3c');
      b(-3, -8, 6, 3, '#f2e2c4'); b(2, -13, 1, 5, '#e85a7a'); break;
    case 'nomyen':
      b(-4, -10, 8, 13, '#dfe8ee'); b(-3, -8, 6, 10, '#e88aa8');
      b(-3, -8, 6, 2, '#f4c8d8'); b(2, -13, 1, 5, '#7abce8'); break;
    case 'oliang':
      b(-4, -10, 8, 13, '#dfe8ee'); b(-3, -8, 6, 10, '#3a2a22');
      b(2, -13, 1, 5, '#e8c84a'); break;
    case 'anchan':
      b(-4, -10, 8, 13, '#dfe8ee'); b(-3, -8, 6, 10, '#6a55d8');
      b(-3, -4, 6, 4, '#8a6ad8'); b(-3, -8, 6, 2, '#a898ee');
      b(2, -13, 1, 5, '#8fd86a'); break;
    default:
      b(-5, -3, 10, 6, '#c9b48a');
  }
}
