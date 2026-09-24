/* ============================================================================
 *  act.js — the school day.
 *
 *  A side-scrolling act you play: you walk where you touch, you touch what is
 *  there, you answer when you are spoken to, you sit a test, you pick who is
 *  in your group, you order lunch from one of five shops and watch it cooked,
 *  and twice the day hands you over to somebody else's eyes.  It ends where
 *  the rest of the game begins — at the top of the mountain, in the butterfly
 *  pea.  The camera sits close, so the rooms are drawn to be looked at.
 * ==========================================================================*/

import { clamp, lerp, rng, makeCanvas, ease } from './core.js';
import { W, H, RES } from './vista.js';
import { Person } from './human.js';
import { drawText, textWidth, T, setLang, lang } from './font.js';
import { Dialogue } from './dialogue.js';
import { Quiz, Match, Order, StayAwake } from './minigames.js';
import { lightPass } from './light.js';
import {
  GROUND, drawClassroom, classSeats, drawDeskBack, drawDeskFront, drawFrontRow,
  drawHallway, drawHallwayFg, drawCanteen, drawCanteenFg, drawLogo, SHOPS, setBanner,
} from './school.js';
import { drawGate, drawGateFg, heatShimmer, drawDream } from './places.js';

const R = rng(9081);

/* Fill in the strings the shop data needs once the language is known. */
function localiseShops() {
  setBanner(T({ th: 'โรงอาหาร  โรงเรียนอัญชันวิทยา', en: 'CANTEEN - ANCHAN WITTAYA SCHOOL' }));
  for (const s of SHOPS) {
    s.nameFull = T(s.name);
    s.nameShort = T(s.name).split(' ')[0];
    s.cookingLabel = T({ th: 'กำลังทำ...', en: 'cooking...' });
    for (const it of s.menu) {
      it.label = T({ th: it.th, en: it.en });
      it.priceLabel = T({ th: it.price + ' บาท', en: it.price + 'B' });
    }
  }
}

/* ------------------------------------------------------------------ scenes */

export const SCENES = {
  class_am: {
    w: 1520, gy: () => GROUND, walk: [180, 1470], cropY: 0, zoom: 1,
    draw: (ctx, cam, t, S) => drawClassroom(ctx, cam, t, { clock: 0.19, fanSpeed: 1, ...S }),
    fg: (ctx, cam) => drawFrontRow(ctx, cam),
  },
  hallway: {
    w: 1560, gy: () => GROUND, walk: [30, 1530], cropY: 0, zoom: 1,
    draw: (ctx, cam, t) => drawHallway(ctx, cam, t),
    fg: (ctx, cam) => drawHallwayFg(ctx, cam),
  },
  canteen: {
    w: 1480, gy: () => GROUND, walk: [30, 1450], cropY: 0, zoom: 1,
    draw: (ctx, cam, t) => drawCanteen(ctx, cam, t),
    fg: (ctx, cam) => drawCanteenFg(ctx, cam),
  },
  class_pm: {
    w: 1520, gy: () => GROUND, walk: [180, 1470], cropY: 0, zoom: 1,
    draw: (ctx, cam, t, S) => drawClassroom(ctx, cam, t, { clock: 0.62, dusk: 0.25, fanSpeed: 0.7, ...S }),
    fg: (ctx, cam) => drawFrontRow(ctx, cam),
  },
  dream: {
    w: 480, gy: () => 232, walk: [40, 440], cropY: 0, zoom: 1,
    draw: (ctx, cam, t) => drawDream(ctx, cam, t),
  },
  gate: {
    w: 960, gy: () => 252, walk: [30, 930], cropY: 0, zoom: 1,
    draw: (ctx, cam, t, S) => drawGate(ctx, cam, t, S),
    fg: (ctx, cam) => drawGateFg(ctx, cam),
  },
};

/* --------------------------------------------------------------- the cast */

const CAST = {
  A: { name: { th: 'นิ่ม', en: 'Nim' }, outfit: 'thaiGirl' },
  B: { name: { th: 'บีม', en: 'Beam' }, outfit: 'thaiBoy' },
  D: { name: { th: 'ฝน', en: 'Fon' }, outfit: 'thaiGirl' },
  E: { name: { th: 'แก๊ป', en: 'Gap' }, outfit: 'thaiBoy' },
  F: { name: { th: 'มุก', en: 'Muk' }, outfit: 'thaiGirl' },
  G: { name: { th: 'ต้น', en: 'Ton' }, outfit: 'thaiBoy' },
  T: { name: { th: 'ครูมาลี', en: 'Kru Malee' }, outfit: 'thaiTeach' },
  S: { name: { th: 'ครูสมชาย', en: 'Kru Somchai' }, outfit: 'thaiTeach2' },
  O: { name: { th: 'ครูอ้อย', en: 'Kru Oi' }, outfit: 'thaiTeach3' },
};

/* The noise a room full of teenagers makes. */
const CHATTER = {
  class: [
    { th: 'ง่วงว่ะ', en: 'so sleepy' }, { th: 'ยืมยางลบหน่อย', en: 'lend me your rubber' },
    { th: 'ข้อสี่ได้เท่าไหร่', en: 'what did you get for four' }, { th: 'ร้อนอ่ะ', en: 'it is so hot' },
    { th: 'พัดลมพังป่ะเนี่ย', en: 'is that fan broken' }, { th: 'หิวแล้ว', en: 'i am hungry' },
    { th: 'เดี๋ยวสอบจริงดิ', en: 'wait there is a test?' }, { th: 'ลอกหน่อยดิ', en: 'let me copy' },
    { th: 'ครูมาแล้ว!', en: 'teacher is coming' }, { th: 'อีกกี่นาที', en: 'how many minutes left' },
  ],
  hall: [
    { th: 'ไปโรงอาหารป่ะ', en: 'canteen?' }, { th: 'รอด้วยสิ', en: 'wait for me' },
    { th: 'กะเพราหมดแน่', en: 'the kaprao will be gone' }, { th: 'วิ่งเลย!', en: 'run' },
    { th: 'เมื่อกี้ครูพูดอะไร', en: 'what did she just say' }, { th: 'ยืมตังหน่อย', en: 'lend me money' },
    { th: 'เย็นนี้ว่างป่ะ', en: 'free this evening?' }, { th: 'อย่าเดินช้าสิ', en: 'walk faster' },
  ],
  canteen: [
    { th: 'พี่ ขอไม่เผ็ดครับ', en: 'not spicy please' }, { th: 'คิวยาวมาก', en: 'the queue is huge' },
    { th: 'ชาเย็นหวานน้อย', en: 'less sugar in the tea' }, { th: 'นั่งตรงนี้ได้ป่ะ', en: 'can we sit here' },
    { th: 'ตำไทยหนึ่งค่ะ', en: 'one som tam' }, { th: 'อร่อยอ่ะ', en: 'this is good' },
    { th: 'จ่ายเท่าไหร่', en: 'how much was it' }, { th: 'ขอชิมหน่อย', en: 'let me try some' },
    { th: 'ร้อนจัง', en: 'so hot today' }, { th: 'กินไม่ทันแล้ว', en: 'no time to finish' },
  ],
};

/* ------------------------------------------------------------- the script */

const say = (who, text, o = {}) => ({ t: 'say', who, text, ...o });
const think = (who, text) => ({ t: 'say', who, text, kind: 'think' });
const narrate = (text, hold = 0) => ({ t: 'say', who: '', text, kind: 'narrate', hold });
const ask = (who, text, choices, then) => ({ t: 'ask', who, text, choices, then });
const doo = (fn) => ({ t: 'do', fn });
const wait = (s) => ({ t: 'wait', s });
const until = (fn, hint) => ({ t: 'until', fn, hint });
const walk = (who, x, speed) => ({ t: 'walk', who, x, speed });
const goto = (scene, x) => ({ t: 'goto', scene, x });
const pov = (who) => ({ t: 'pov', who });
const game = (make, then) => ({ t: 'game', make, then });

export class Act {
  constructor(deps = {}) {
    this.fx = deps.fx;
    this.sfx = deps.sfx || {};
    this.dog = deps.dog;
    this.onFinish = deps.onFinish || (() => {});
    setLang(deps.lang || 'th');
    localiseShops();
    this.dlg = new Dialogue();
    this.dlg.onChoice = (v) => this.answer(v);
    this.off = makeCanvas(W * RES, H * RES);
    this.people = {};
    for (const k in CAST) {
      const p = new Person(k, -300, GROUND);
      p.outfit = CAST[k].outfit;
      p.visible = false;
      p.autoIdle = false;
      this.people[k] = p;
    }
    // the rest of the school
    this.extras = [];
    for (let i = 0; i < 40; i++) {
      const key = ['D', 'E', 'F', 'G', 'A', 'B'][i % 6];
      const p = new Person(key, -900, GROUND);
      p.outfit = 'ADF'.includes(key) ? 'thaiGirl' : 'thaiBoy';
      p.visible = false;
      p.autoIdle = false;
      p.rr = rng(700 + i * 37);
      p.idleT = p.rr.f(0, 6);
      p.tag = i;
      this.extras.push(p);
    }
    this.chatter = [];
    this.pov = 'A';
    this.scene = 'class_am';
    this.cam = 0; this.camTarget = 0; this.look = 0; this.lookY = 0;
    this.t = 0;
    this.flags = new Set();
    this.lunch = null;
    this.group = null;
    this.testScore = 0;
    this.steps = []; this.i = 0; this.step = null; this.stepT = 0;
    this.hint = null; this.hintT = 0;
    this.fade = 1; this.fadeCol = '#0b0d14';
    this.mini = null;
    this.shimmer = 0;
    this.spots = [];
    this.dream = false;
    this.done = false;
  }

  get player() { return this.people[this.pov]; }
  get S() { return SCENES[this.scene]; }
  get zoom() { return this.S.zoom || 1.5; }
  get cropX() { return Math.round((W - Math.round(W / this.zoom)) / 2); }
  get cropY() { return (this.S.cropY === undefined ? 98 : this.S.cropY) + this.lookY; }
  toScreen(wx, wy) {
    const Z = this.zoom;
    return { x: (wx - this.cam - this.cropX) * Z, y: (wy - this.cropY) * Z };
  }
  toWorld(bx, by) {
    const Z = this.zoom;
    return { x: bx / Z + this.cam + this.cropX, y: by / Z + this.cropY };
  }

  /* ------------------------------------------------------------- start up */
  begin() {
    this.steps = this.buildScript();
    this.i = 0;
    this.enterScene('class_am', 600);
    this.seatClass();
  }

  /** Fill the room: three rows of desks, and somebody at nearly all of them. */
  seatClass(withTeacher = 'T') {
    const rows = classSeats();
    const P = this.people;
    const seat = (s) => s.x - 17 * s.sc;
    for (const k in this.people) this.people[k].fixedY = false;
    for (const p of this.extras) p.fixedY = false;
    P.A.visible = true; P.A.x = seat(rows[1][3]); P.A.y = rows[1][3].y; P.A.setPoseNow('sit_desk'); P.A.fixedY = true; P.A.flip = false;
    P.D.visible = true; P.D.x = seat(rows[1][4]); P.D.y = rows[1][4].y; P.D.setPoseNow('sit_desk'); P.D.fixedY = true;
    P.E.visible = true; P.E.x = seat(rows[1][2]); P.E.y = rows[1][2].y; P.E.setPoseNow('sit_desk'); P.E.fixedY = true;
    P.F.visible = true; P.F.x = seat(rows[1][5]); P.F.y = rows[1][5].y; P.F.setPoseNow('sit_desk'); P.F.fixedY = true;
    P.G.visible = true; P.G.x = seat(rows[1][1]); P.G.y = rows[1][1].y; P.G.setPoseNow('sit_desk'); P.G.fixedY = true;
    for (const k of ['T', 'S', 'O']) { P[k].visible = k === withTeacher; P[k].x = 262; P[k].y = GROUND; P[k].setPoseNow('stand'); }
    // everybody else
    let n = 0;
    const taken = new Set(['1-1', '1-2', '1-3', '1-4', '1-5']);
    for (let r = 0; r < rows.length; r++) {
      for (let c = 0; c < rows[r].length; c++) {
        if (r === 2) continue;                       // the front row is off-screen
        if (taken.has(r + '-' + c)) continue;
        const p = this.extras[n++];
        if (!p) break;
        p.visible = true;
        p.x = seat(rows[r][c]);
        p.y = rows[r][c].y;
        p.scale = rows[r][c].sc;
        p.fixedY = true;
        p.setPoseNow('sit_desk');
        p.classIdle = p.rr.f(0, 6);
      }
    }
    for (let i = n; i < this.extras.length; i++) this.extras[i].visible = false;
    this.seatRows = rows;
  }

  /** The hallway and the canteen are full of people going somewhere. */
  fillCrowd(kind) {
    const S = this.S;
    let n = 0;
    for (const p of this.extras) {
      p.visible = false;
      p.scale = 1;
      p.fixedY = false;
      p.roam = false;
      p.queue = false;
    }
    if (kind === 'hall') {
      for (let i = 0; i < 30; i++) {
        const p = this.extras[n++];
        p.visible = true;
        p.x = 60 + i * 50 + p.rr.f(-16, 16);
        p.y = GROUND;
        p.scale = p.rr.chance(0.4) ? 0.9 : 1;
        if (p.rr.chance(0.7)) {
          p.walkTo(p.rr.chance(0.5) ? S.walk[1] : S.walk[0], { speed: p.rr.f(16, 30) });
          p.roam = true;
        } else { p.setPoseNow(p.rr.chance(0.5) ? 'arms_crossed' : 'pockets'); p.flip = p.rr.chance(0.5); }
      }
    } else if (kind === 'canteen') {
      // queues at the counters, and tables full of people eating
      for (let s = 0; s < SHOPS.length; s++) {
        for (let q = 0; q < 2; q++) {
          const p = this.extras[n++];
          if (!p) break;
          p.visible = true;
          p.x = SHOPS[s].x - 58 + q * 30 + p.rr.f(-4, 4);
          p.y = GROUND;
          p.setPoseNow(q === 0 ? 'tray' : p.rr.chance(0.5) ? 'pockets' : 'stand');
          p.flip = false;
          p.queue = true;
        }
      }
      for (let i = 0; i < 11 && n < this.extras.length; i++) {
        const p = this.extras[n++];
        p.visible = true;
        p.x = 180 + i * 128 + p.rr.f(-26, 26);
        p.y = GROUND;
        p.setPoseNow(p.rr.chance(0.6) ? 'eat' : 'sit_chair');
        p.flip = p.rr.chance(0.5);
      }
    }
    for (let i = n; i < this.extras.length; i++) this.extras[i].visible = false;
  }

  enterScene(key, x) {
    this.scene = key;
    const S = SCENES[key];
    const p = this.player;
    p.visible = true;
    p.x = clamp(x, S.walk[0], S.walk[1]);
    p.y = S.gy(p.x);
    p.stop();
    this.cam = this.camTarget = this.clampCam(p.x - W / 2);
    this.lookY = 0;
    this.fade = 1;
    this.chatter.length = 0;
    this.buildSpots();
  }

  clampCam(v) {
    const half = Math.round(W / this.zoom) / 2;
    return clamp(v, -this.cropX, Math.max(-this.cropX, this.S.w - W + this.cropX)) + 0 * half;
  }

  /* ----------------------------------------------------------- the script */
  buildScript() {
    const P = this.people;
    const s = [];
    const A = this.anchor.bind(this);

    /* ---------------- morning ---------------- */
    s.push(narrate({ th: 'วันพุธ คาบสอง', en: 'WEDNESDAY. SECOND PERIOD.' }, 2.4));
    s.push(narrate({ th: 'พัดลมกำลังจะแพ้', en: 'The fan is losing.' }, 2.2));
    s.push(think('A', { th: 'อีกสี่สิบนาที รู้สึกได้ทุกนาทีเลย', en: 'Forty more minutes. I can feel every one of them.' }));
    s.push(doo(() => this.hintOn({ th: 'แตะพื้นเพื่อเดิน แตะสิ่งของและคนเพื่อดู', en: 'Touch the floor to walk. Touch things and people.' })));
    s.push(say('D', { th: 'จิ๊บ ๆ นิ่ม นิ่ม!', en: 'Psst. Nim. Nim!' }));
    s.push(say('D', { th: 'ข้อสี่ทำได้ยัง ข้อที่เกี่ยวกับแม่น้ำอ่ะ', en: 'Did you do question four? The one about the river?' }));
    s.push(ask('A', '', [
      { text: { th: 'ทำแล้วสองรอบ ผิดทั้งสองรอบ', en: 'I did it twice. It was wrong twice.' }, value: 'honest' },
      { text: { th: 'ข้อสี่อะไร', en: 'What question four.' }, value: 'blank' },
      { text: { th: 'ลอกเลย เร็ว ๆ', en: 'Copy mine. Quickly.' }, value: 'copy' },
    ], (v) => {
      this.flags.add('fon');
      const an = A('D');
      if (v === 'honest') this.dlg.say({ th: 'งั้นก็ผิดด้วยกัน ดี ผิดเป็นหมู่คณะ', en: 'Then we are both wrong. Good. Safety in numbers.' }, { who: 'D', anchor: an });
      else if (v === 'blank') this.dlg.say({ th: 'ข้อที่เธอตื่นอยู่ไง มั้ง', en: 'The one you were awake for. Allegedly.' }, { who: 'D', anchor: an });
      else this.dlg.say({ th: 'นิ่ม รักเลย รักจริง ๆ', en: 'Nim. I love you. Truly.' }, { who: 'D', anchor: an });
    }));
    s.push(say('E', { th: 'ข้างหลังนี่เขาจะนอนกันนะครับ', en: 'Some of us are trying to sleep back here.' }));
    s.push(doo(() => { this.flags.add('gap'); }));
    s.push(say('T', { th: 'นิ่ม คุยกันสนุกนักนะ', en: 'Nim. Since you are having such a good conversation.' }));
    s.push(say('T', { th: 'แม่น้ำเจ้าพระยาเกิดจากแม่น้ำสองสายอะไร', en: 'The Chao Phraya. Which two rivers meet to make it?' }));
    s.push(doo(() => { P.A.setPoseNow('stand'); P.T.setPoseNow('point'); if (this.sfx.pop) this.sfx.pop(0.8); }));
    s.push(ask('A', '', [
      { text: { th: 'ปิงกับน่านค่ะ', en: 'The Ping and the Nan, teacher.' }, value: 'right' },
      { text: { th: 'สายใหญ่...กับอีกสายค่ะ', en: 'The... big one and the other one?' }, value: 'wrong' },
      { text: { th: '(เงียบไว้ แล้วภาวนา)', en: '(say nothing and hope)' }, value: 'silent' },
    ], (v) => {
      this.answered = v;
      const an = A('T');
      if (v === 'right') { this.dlg.say({ th: 'ถูกต้อง นั่งลงก่อนครูจะเป็นลม', en: 'Correct. Sit down before I faint.' }, { who: 'T', anchor: an }); this.flags.add('gold'); }
      else if (v === 'wrong') this.dlg.say({ th: 'สายใหญ่ เขียนแบบนี้ในข้อสอบเลยนะ ลองดู', en: 'The big one. Write that on the exam. I dare you.' }, { who: 'T', anchor: an });
      else this.dlg.say({ th: 'ปิงกับน่าน พักเที่ยงมาท่องให้ครูฟังสองรอบ', en: 'Ping and Nan. Say it with me at lunch. Twice.' }, { who: 'T', anchor: an });
    }));
    s.push(doo(() => { P.A.setPoseNow('sit_desk'); P.T.setPoseNow('stand'); }));
    // the joke that happens in every classroom
    s.push(doo(() => { if (this.sfx.plip) this.sfx.plip(1.8); P.G.setPoseNow('reach'); }));
    s.push(say('F', { th: 'กล่องดินสอต้นหล่นอีกแล้ว', en: "Ton's pencil case. Again." }));
    s.push(say('G', { th: 'มันลื่นเอง', en: 'It jumped.' }));
    s.push(say('T', { th: 'ต้น ถ้ากล่องดินสอมันกระโดดอีก ครูจะให้มันมาสอนแทน', en: 'Ton. If it jumps again it can teach the lesson.' }));
    s.push(doo(() => { P.G.setPoseNow('sit_desk'); }));
    s.push(wait(0.5));
    s.push(narrate({ th: 'กริ๊ง', en: 'THE BELL' }, 1.6));
    s.push(doo(() => { if (this.sfx.bell) this.sfx.bell(); this.standEveryone(); }));
    s.push(say('D', { th: 'โรงอาหาร! ไปเร็ว เดี๋ยวกะเพราหมด', en: 'Canteen. Come on, before the kaprao runs out.' }));
    s.push(doo(() => this.hintOn({ th: 'แตะพื้นเพื่อเดิน ไปทางขวา', en: 'Touch the floor to walk. Head right.' })));
    s.push(goto('hallway', 60));

    /* ---------------- the walkway ---------------- */
    s.push(narrate({ th: 'ระเบียง', en: 'THE WALKWAY' }, 1.6));
    s.push(think('A', { th: 'ปิงกับน่าน ปิงกับน่าน ปิงกับน่าน', en: 'Ping and Nan. Ping and Nan. Ping and Nan.' }));
    s.push(doo(() => this.hintOn({ th: 'เดินไปทางขวาจนถึงโรงอาหาร', en: 'Walk right, to the canteen.' })));
    s.push(until(() => this.player.x > 1440, { th: 'โรงอาหารอยู่สุดทาง', en: 'the canteen is at the far end' }));
    s.push(goto('canteen', 60));

    /* ---------------- lunch ---------------- */
    s.push(narrate({ th: 'พักเที่ยง', en: 'LUNCH' }, 1.6));
    s.push(doo(() => this.hintOn({ th: 'มีห้าร้าน แตะร้านที่อยากกิน', en: 'Five shops. Touch the one you want.' })));
    s.push(until(() => this.lunch !== null, { th: 'เลือกร้านสักร้าน', en: 'choose somewhere to eat' }));
    s.push(doo(() => { this.dlg.say(this.lunchLine(), { who: 'D', anchor: A('D') }); }));
    s.push(walk('A', 900, 36));
    s.push(doo(() => {
      P.A.setPose({ pose: 'eat' });
      P.D.x = 866; P.D.y = GROUND; P.D.visible = true; P.D.setPoseNow('eat');
      P.E.x = 946; P.E.y = GROUND; P.E.visible = true; P.E.setPoseNow('eat');
      P.B.visible = true; P.B.x = 560; P.B.y = GROUND; P.B.setPoseNow('sit_chair'); P.B.flip = true;
    }));
    s.push(say('E', { th: 'รู้ป่ะ กินใต้พัดลมข้าวเย็นในหนึ่งนาที', en: 'Gap fact. Under a fan, food goes cold in one minute.' }));
    s.push(say('D', { th: 'รู้ป่ะ ไม่มีใครถาม', en: 'Gap fact. Nobody asked.' }));
    s.push(say('D', { th: 'นิ่ม ผู้ชายโต๊ะริมหน้าต่างมองมาสี่รอบแล้วนะ', en: 'Nim. That boy by the window has looked over here four times.' }));
    s.push(ask('A', '', [
      { text: { th: 'ไม่ได้มองสักหน่อย', en: 'He has not.' }, value: 'deny' },
      { text: { th: 'ห้ารอบ แต่ใครนับล่ะ', en: 'Five. But who counts.' }, value: 'counted' },
      { text: { th: 'กินข้าวเถอะฝน', en: 'Eat your rice, Fon.' }, value: 'deflect' },
    ], (v) => {
      this.flags.add('beam_seen');
      const an = A('D');
      if (v === 'counted') this.dlg.say({ th: 'นิ่ม!!', en: 'NIM.' }, { who: 'D', anchor: an });
      else if (v === 'deny') this.dlg.say({ th: 'ห้าแล้ว ห้า', en: 'Five, now. Five.' }, { who: 'D', anchor: an });
      else this.dlg.say({ th: 'กินอยู่ กินเสียงดังด้วย เพราะเรื่องนี้แหละ', en: 'I am eating it. Loudly. About this.' }, { who: 'D', anchor: an });
    }));
    /* the same lunch, from the other side of the room */
    s.push(narrate({ th: 'อีกฝั่งของโรงอาหาร', en: 'MEANWHILE, BY THE WINDOW' }, 2.2));
    s.push(pov('B'));
    s.push(think('B', { th: 'คนที่เถียงกับครูมาลีเรื่องแม่น้ำแล้วชนะนี่หว่า', en: 'She is the one who argued with Kru Malee about the rivers and won.' }));
    s.push(doo(() => this.hintOn({ th: 'ตอนนี้คุณคือบีม เดินได้ แตะได้', en: 'You are Beam now. Walk. Touch things.' })));
    s.push(ask('B', '', [
      { text: { th: 'ลุกไปทักเลย อะไรก็ได้', en: 'Go and say something. Anything.' }, value: 'go' },
      { text: { th: 'ซื้อนมก่อน แล้วค่อยคิด', en: 'Buy a milk. Think about it.' }, value: 'milk' },
      { text: { th: 'ไม่ ไม่เอา มองกำแพงดีกว่า', en: 'Absolutely not. Look at the wall.' }, value: 'wall' },
    ], (v) => {
      this.flags.add('beam_' + v);
      const an = A('B');
      if (v === 'go') this.dlg.think({ th: 'เอาละ จะลุกแล้ว ลุกแล้วนะ เดี๋ยวนะ', en: 'Right. Standing up. Standing up now. Any moment.' }, { who: 'B', anchor: an });
      else if (v === 'milk') this.dlg.think({ th: 'ซื้อนมก็คือแผน ถือว่าเป็นแผนแล้ว', en: 'A milk is a plan. A milk is basically a plan.' }, { who: 'B', anchor: an });
      else this.dlg.think({ th: 'กำแพงนี้สวยมาก', en: 'The wall is a very good wall.' }, { who: 'B', anchor: an });
    }));
    s.push(wait(0.4));
    s.push(doo(() => { if (this.sfx.bell) this.sfx.bell(); }));
    s.push(think('B', { th: '...กริ๊งแล้ว', en: '...that is the bell.' }));
    s.push(pov('A'));
    s.push(goto('class_pm', 600));

    /* ---------------- the test ---------------- */
    s.push(doo(() => { this.seatClass('S'); this.people.B.visible = false; this.shimmer = 1; }));
    s.push(narrate({ th: 'คาบบ่าย วิทยาศาสตร์', en: 'AFTERNOON. SCIENCE.' }, 2.2));
    s.push(say('S', { th: 'เก็บหนังสือ ทดสอบย่อย ห้าข้อ', en: 'Books away. Five questions. Now.' }));
    s.push(say('E', { th: 'ครับ...อะไรนะครับ', en: 'Sir... what.' }));
    s.push(say('S', { th: 'ห้าข้อ แก๊ป ไม่ใช่ห้านาที', en: 'Five questions, Gap. Not five minutes.' }));
    s.push(doo(() => this.hintOn({ th: 'แตะคำตอบให้ทันเวลา', en: 'Touch an answer before the bar runs out.' })));
    s.push(game(() => new Quiz(this.testQuestions(), {
      title: T({ th: 'ทดสอบย่อย - วิทยาศาสตร์', en: 'Quick test - science' }),
      col: '#3f6ea8', per: 12,
    }), (q) => {
      this.testScore = q.score;
      const an = A('S');
      if (q.score >= 4) this.dlg.say({ th: 'ได้ ' + q.score + ' จาก 5 ครูแทบไม่เชื่อ', en: q.score + ' out of 5. I am almost impressed.' }, { who: 'S', anchor: an });
      else if (q.score >= 2) this.dlg.say({ th: 'ได้ ' + q.score + ' จาก 5 กลาง ๆ มาก', en: q.score + ' out of 5. Aggressively average.' }, { who: 'S', anchor: an });
      else this.dlg.say({ th: 'ได้ ' + q.score + ' จาก 5 ...กลับไปอ่านบทเก้า', en: q.score + ' out of 5. Read chapter nine. Twice.' }, { who: 'S', anchor: an });
    }));
    s.push(say('E', { th: 'ผมได้ศูนย์ แต่เร็วที่สุดในห้อง', en: 'I got zero but I was the fastest.' }));
    s.push(say('S', { th: 'นั่นไม่ใช่วิชานี้', en: 'That is not the subject.' }));

    /* ---------------- group work ---------------- */
    s.push(doo(() => { this.seatClass('O'); }));
    s.push(narrate({ th: 'คาบต่อไป ภาษาอังกฤษ', en: 'NEXT PERIOD. ENGLISH.' }, 2)); 
    s.push(say('O', { th: 'งานกลุ่มค่ะ กลุ่มละสามคน เลือกเพื่อนได้เลย', en: 'Group work. Threes. Pick who you like.' }));
    s.push(ask('A', '', [
      { text: { th: 'ฝน กับ แก๊ป', en: 'Fon and Gap' }, value: 'fon' },
      { text: { th: 'มุก กับ ต้น', en: 'Muk and Ton' }, value: 'muk' },
      { text: { th: 'ฝน กับ มุก', en: 'Fon and Muk' }, value: 'both' },
    ], (v) => {
      this.group = v;
      const line = {
        fon: { th: 'กลุ่มนี้เสียงดังที่สุดในห้อง แต่เสร็จก่อนเพื่อน', en: 'The loudest group in the room. Also the fastest.' },
        muk: { th: 'มุกจำได้หมดทุกอย่าง ต้นทำกล่องดินสอหล่นอีกแล้ว', en: 'Muk remembers everything. Ton drops his pencil case again.' },
        both: { th: 'สองคนนี้ทะเลาะกันเรื่องสีปากกา สิบนาที', en: 'Ten minutes arguing about which colour pen.' },
      }[v];
      this.dlg.say(line, { who: v === 'muk' ? 'F' : 'D', anchor: A(v === 'muk' ? 'F' : 'D') });
    }));
    s.push(doo(() => this.hintOn({ th: 'เปิดการ์ดให้ครบคู่ เพื่อนจะช่วยบอกใบ้', en: 'Turn the cards two at a time. Your group helps.' })));
    s.push(game(() => new Match({
      pairs: 4,
      title: T({ th: 'งานกลุ่ม - จับคู่ให้ครบ', en: 'Group work - match them up' }),
      col: '#8a6ad8',
      helper: this.group === 'muk' ? 0.5 : this.group === 'fon' ? 0.28 : 0.36,
    }), (m) => {
      const an = A('O');
      if (m.tries <= 6) this.dlg.say({ th: 'เก่งมากค่ะกลุ่มนี้ เสร็จก่อนใครเลย', en: 'Very good. First group finished.' }, { who: 'O', anchor: an });
      else this.dlg.say({ th: 'เสร็จแล้วนะคะ ช้าหน่อย แต่เสร็จ', en: 'Finished. Slowly. But finished.' }, { who: 'O', anchor: an });
    }));

    /* ---------------- the afternoon that wins ---------------- */
    s.push(doo(() => { this.seatClass('T'); }));
    s.push(narrate({ th: 'คาบสุดท้าย', en: 'LAST PERIOD' }, 2));
    s.push(say('T', { th: 'เปิดหนังสือ บทเก้า เรื่องแม่น้ำ อีกครั้ง', en: 'Open your books. Chapter nine. The rivers, again.' }));
    s.push(think('A', { th: 'ปิง. กับ. น่าน.', en: 'Ping. And. Nan.' }));
    s.push(doo(() => this.hintOn({ th: 'แตะตัว z ที่ลอยขึ้นมา ก่อนตาจะปิด', en: 'Touch the zs before your eyes close.' })));
    s.push(game(() => new StayAwake({ need: 15 }), (g) => {
      if (!g.slept) { this.flags.add('stayed'); this.dlg.say({ th: 'วันนี้ตาสว่างดีนี่ นิ่ม', en: 'Wide awake today, Nim. How novel.' }, { who: 'T', anchor: A('T') }); }
    }));
    s.push(narrate({ th: 'แล้วสิบนาทีสุดท้ายก็ชนะอยู่ดี', en: 'And then the last ten minutes won anyway.' }, 3));
    s.push(doo(() => { this.people.A.setPoseNow('sleep_desk'); }));
    s.push(wait(1.8));

    /* ---------------- the dream ---------------- */
    s.push(doo(() => { this.startDream(); }));
    s.push(narrate({ th: 'หญ้า และอะไรเล็ก ๆ สีเขียว นอนอยู่ในนั้น', en: 'Grass. And something small and green, asleep in it.' }, 3));
    s.push(doo(() => this.hintOn({ th: 'แตะดูสิ', en: 'Touch it.' })));
    s.push(until(() => this.flags.has('dogpet'), { th: 'แตะเจ้าตัวเขียวเล็ก ๆ นั่น', en: 'touch the little green thing' }));
    s.push(think('A', { th: 'โอ๊ย น่ารักที่สุดในชีวิตเลย', en: 'Oh. Oh, you are the best thing I have ever seen.' }));
    s.push(say('T', { th: 'นิ่ม!!', en: 'NIM.' }));
    s.push(doo(() => { this.endDream(); this.people.A.face = 'surprise'; }));
    s.push(say('T', { th: 'เล่าให้เพื่อนฟังหน่อยไหมว่าฝันถึงอะไร', en: 'Would you care to share it with the class?' }));
    s.push(ask('A', '', [
      { text: { th: 'มีหมาค่ะ...เป็นถั่ว', en: 'There was a dog. He was a bean.' }, value: 'bean' },
      { text: { th: 'หนูแค่พักสายตาค่ะครู', en: 'I was resting my eyes, teacher.' }, value: 'eyes' },
      { text: { th: 'ปิงกับน่านค่ะ!', en: 'The Ping and the Nan!' }, value: 'rivers' },
    ], (v) => {
      const an = A('T');
      this.flags.add('woke_' + v);
      if (v === 'bean') {
        this.dlg.say({ th: 'ถั่ว', en: 'A bean.' }, { who: 'T', anchor: an })
          .say({ th: 'นักเรียนคะ นิ่มฝันถึงพืชตระกูลถั่ว อีกแล้ว', en: 'Class, Nim has been dreaming of legumes. Again.' }, { who: 'T', anchor: an });
      } else if (v === 'eyes') this.dlg.say({ th: 'พักสายตาเสียงดังมากนะ', en: 'You were resting them very loudly.' }, { who: 'T', anchor: an });
      else this.dlg.say({ th: '...ถูก น่าโมโหมาก แต่ถูก', en: '...correct. Infuriating. Correct.' }, { who: 'T', anchor: an });
    }));
    s.push(doo(() => { this.people.A.face = 'smile'; }));
    s.push(say('E', { th: '(แก๊ปหัวเราะจนตกเก้าอี้)', en: '(Gap is on the floor)' }));
    s.push(say('T', { th: 'ไหน ๆ ก็มีแรง แปลงดอกไม้หลังเลิกเรียน ทุกแปลง', en: 'Since you are so full of energy. The flower beds. After school. All of them.' }));
    s.push(say('T', { th: 'เอาบัวรดน้ำในห้องพัสดุไป', en: 'Take the watering can from the store room.' }));
    s.push(doo(() => { this.flags.add('can'); }));
    s.push(wait(0.5));
    s.push(narrate({ th: 'กริ๊ง ครั้งสุดท้าย', en: 'THE LAST BELL' }, 1.8));
    s.push(doo(() => { if (this.sfx.bell) this.sfx.bell(); this.standEveryone(); }));
    s.push(goto('gate', 120));

    /* ---------------- the gate ---------------- */
    s.push(doo(() => {
      this.people.D.visible = true; this.people.D.x = 210; this.people.D.y = 252; this.people.D.flip = true;
      this.people.B.visible = true; this.people.B.x = 540; this.people.B.y = 252;
      for (const k of ['E', 'F', 'G', 'T', 'S', 'O']) this.people[k].visible = false;
      this.fillCrowd('none');
    }));
    s.push(narrate({ th: 'เลิกเรียน', en: 'AFTER SCHOOL' }, 1.8));
    s.push(say('D', { th: 'เราต้องไปรับน้อง ไปรดน้ำต้นไม้ซะนะ คนสวน', en: 'I have to get my brother. Water your beds, gardener.' }));
    s.push(doo(() => { this.people.D.walkTo(-30, { speed: 34 }); }));
    s.push(doo(() => this.hintOn({ th: 'มีคนรออยู่ตรงประตู', en: 'Somebody is waiting by the gate.' })));
    s.push(until(() => this.flags.has('met_beam'), { th: 'ผู้ชายคนนั้นจากโรงอาหาร', en: 'the boy from the canteen' }));
    s.push(say('B', { th: 'เธอคือคนที่ตอบเรื่องแม่น้ำ', en: 'You are the rivers person.' }));
    s.push(say('A', { th: 'เธอคือคนที่นั่งริมหน้าต่าง', en: 'You are the window person.' }));
    s.push(say('B', { th: 'บีม', en: 'Beam.' }));
    s.push(say('A', { th: 'นิ่ม', en: 'Nim.' }));
    s.push(wait(0.4));
    s.push(say('B', { th: 'บนเขามีทุ่งอัญชัน สีน้ำเงินจนโง่เลย', en: 'There is a butterfly pea field up the mountain. It is stupidly blue.' }));
    s.push(ask('A', '', [
      { text: { th: 'พาไปหน่อย', en: 'Show me.' }, value: 'yes' },
      { text: { th: 'ต้องรดน้ำแปลงดอกไม้ก่อน', en: 'I have flower beds to water.' }, value: 'duty' },
      { text: { th: 'ไกลไหม', en: 'Is it far?' }, value: 'far' },
    ], (v) => {
      this.flags.add('gate_' + v);
      const an = A('B');
      if (v === 'yes') this.dlg.say({ th: 'ได้ ไปเลย ตอนนี้เลย', en: 'Right. Now? Now.' }, { who: 'B', anchor: an });
      else if (v === 'duty') this.dlg.say({ th: 'แปลงมันรอได้ แสงไม่รอ', en: 'The beds will keep. The light will not.' }, { who: 'B', anchor: an });
      else this.dlg.say({ th: 'สี่สิบนาที นั่งสองแถวไปตีนเขา ที่เหลือเดิน', en: 'Forty minutes. Songthaew to the foot, walk the rest.' }, { who: 'B', anchor: an });
    }));
    s.push(doo(() => this.hintOn({ th: 'เดินไปทางขวา ไปหาสองแถว', en: 'Walk right, to the songthaew.' })));
    s.push(until(() => this.player.x > 860, { th: 'รถแดงจอดอยู่สุดถนน', en: 'the red truck at the end of the road' }));
    s.push(narrate({ th: 'สองแถวคันแดง ไปตีนเขา', en: 'The red truck, to the foot of the mountain.' }, 2.4));
    s.push(doo(() => { this.finish(); }));
    return s;
  }

  testQuestions() {
    return [
      { q: T({ th: 'น้ำเดือดที่กี่องศาเซลเซียส', en: 'Water boils at what temperature?' }),
        c: [T({ th: '50', en: '50' }), T({ th: '100', en: '100' }), T({ th: '212', en: '212' })], a: 1 },
      { q: T({ th: 'พืชใช้แก๊สอะไรในการสังเคราะห์แสง', en: 'Plants take in which gas to make food?' }),
        c: [T({ th: 'คาร์บอนไดออกไซด์', en: 'Carbon dioxide' }), T({ th: 'ออกซิเจน', en: 'Oxygen' }), T({ th: 'ไนโตรเจน', en: 'Nitrogen' })], a: 0 },
      { q: T({ th: 'ดอกอัญชันให้สีอะไรกับน้ำ', en: 'Butterfly pea turns water what colour?' }),
        c: [T({ th: 'สีน้ำเงิน', en: 'Blue' }), T({ th: 'สีเหลือง', en: 'Yellow' }), T({ th: 'สีเขียว', en: 'Green' })], a: 0 },
      { q: T({ th: 'แรงที่ดึงของทุกอย่างลงพื้นเรียกว่าอะไร', en: 'What pulls everything down?' }),
        c: [T({ th: 'แรงเสียดทาน', en: 'Friction' }), T({ th: 'แรงโน้มถ่วง', en: 'Gravity' }), T({ th: 'แรงลม', en: 'Wind' })], a: 1 },
      { q: T({ th: 'ส่วนไหนของพืชดูดน้ำ', en: 'Which part of a plant drinks?' }),
        c: [T({ th: 'ใบ', en: 'The leaves' }), T({ th: 'ดอก', en: 'The flower' }), T({ th: 'ราก', en: 'The roots' })], a: 2 },
    ];
  }

  lunchLine() {
    const shop = SHOPS.find((s) => s.id === this.lunch);
    const by = { daeng: { th: 'ข้าวราดแกงทุกวัน เธอมีปัญหาแล้ว', en: 'Rice and curry every single day. You have a problem.' },
      nuat: { th: 'กินก๋วยเตี๋ยวตอนร้อนแบบนี้ ไม่ไหวแล้ว', en: 'Noodles in this heat. You are unwell.' },
      saep: { th: 'ตำ กล้ามาก อีกสิบนาทีร้องไห้แน่', en: 'Som tam. Brave. You will be crying in ten minutes.' },
      boy: { th: 'หมูปิ้งเป็นอาหารกลางวันเหรอ...ก็ได้', en: 'Grilled pork for lunch. Fine. Sure.' },
      muay: { th: 'กินแต่น้ำ? นั่นไม่ใช่มื้อเที่ยงนะ', en: 'Just a drink? That is not lunch.' } };
    return by[shop ? shop.id : 'daeng'];
  }

  standEveryone() {
    for (const k of ['A', 'D', 'E', 'F', 'G']) this.people[k].setPoseNow('stand');
    this.extras.forEach((p) => p.setPoseNow('stand'));
  }

  anchor(who) {
    const p = this.people[who];
    if (!p) return null;
    return () => {
      const low = ['sit_desk', 'sit_ground', 'eat', 'write', 'sleep_desk', 'sit_chair'].includes(p.pose);
      return this.toScreen(p.x, p.y - (low ? 24 : 44));
    };
  }

  hintOn(text) { this.hint = T(text); this.hintT = 6; }

  answer(v) {
    const st = this.step;
    if (st && st.t === 'ask' && st.then) st.then(v);
  }

  /* ----------------------------------------------------------- the dream */
  startDream() {
    this.dreamPrev = this.scene;
    this.dream = true;
    this.fadeCol = '#f4f8ff';
    this.enterScene('dream', 190);
    this.fadeCol = '#f4f8ff';
    this.extras.forEach((p) => { p.visible = false; });
    for (const k of ['B', 'D', 'E', 'F', 'G', 'T', 'S', 'O']) this.people[k].visible = false;
    const a = this.people.A;
    a.visible = true; a.x = 170; a.y = 232; a.setPoseNow('stand'); a.face = 'calm'; a.flip = false;
    if (this.dog) {
      this.dog.alive = true; this.dog.age = 0;
      this.dog.x = 300; this.dog.y = 232;
      this.dog.state = 'sleep'; this.dog.pose = 'sleep'; this.dog.alpha = 1;
    }
  }
  endDream() {
    if (!this.dream) return;
    this.dream = false;
    if (this.dog) this.dog.alive = false;
    this.fadeCol = '#f4f8ff';
    this.enterScene(this.dreamPrev || 'class_pm', 600);
    this.seatClass('T');
    this.people.A.setPoseNow('shock');
  }

  /* ------------------------------------------------------------- touching */
  buildSpots() {
    const s = [];
    const add = (id, x, y, w, h, fn, label) => s.push({ id, x, y, w, h, fn, label });
    const inClass = this.scene === 'class_am' || this.scene === 'class_pm';
    if (inClass) {
      add('board', 180, 160, 250, 90, () => this.flick({ th: 'บทเก้า มีคนวาดแมวตัวจิ๋วไว้มุมกระดาน', en: 'Chapter nine. Somebody has drawn a very small cat in the corner.' }));
      add('logo', 178, 84, 40, 30, () => this.flick({ th: 'ตราโรงเรียน ดอกอัญชันบนโล่ สีน้ำเงินทั้งดวง', en: 'The school badge: a butterfly pea on a shield, blue all through.' }));
      add('clock', 348, 122, 26, 26, () => this.flick({ th: 'สิบเก้านาที เป็นไปไม่ได้', en: 'Nineteen minutes. That cannot be right.' }));
      add('teachdesk', 300, 216, 64, 40, () => this.flick({ th: 'กองสมุด แก้วกาแฟ กับต้นไม้เล็ก ๆ ที่รอดมาได้', en: 'A stack of books, a coffee mug, and one small plant that survived.' }));
      add('poster1', 456, 156, 58, 42, () => this.flick({ th: 'ตารางธาตุ มีคนเขียนชื่อตัวเองทับช่องทองคำ', en: 'The periodic table. Somebody has written their name over gold.' }));
      add('poster2', 722, 158, 48, 54, () => this.flick({ th: 'แผนที่ประเทศไทย เชียงใหม่มีรอยนิ้วมือ', en: 'A map of Thailand. There is a fingerprint on Chiang Mai.' }));
      add('roster', 660, 158, 44, 38, () => this.flick({ th: 'ตารางเวรทำความสะอาด ชื่อเธออยู่วันศุกร์', en: 'The cleaning roster. Your name is on Friday.' }));
      add('cupboard', 1148, 214, 62, 70, () => this.flick({ th: 'ถ้วยรางวัล ลูกโลกที่แปซิฟิกลบไปแล้ว กับกล่องชอล์ก', en: 'Trophies, a globe with the Pacific worn off, and a box of chalk.' }));
      add('window', 1190, 176, 70, 96, () => this.flick({ th: 'แดดขาว ต้นมะม่วง ธงไม่ไหวเลยสักนิด', en: 'Hot white light, a mango tree, and the flag not moving at all.' }));
      add('fan', 440, 116, 46, 26, () => this.flick({ th: 'พัดลมหมุนมาสิบเอ็ดปีแล้ว', en: 'The fan turns. It has turned for eleven years.' }));
      add('broom', 1430, 224, 32, 46, () => this.flick({ th: 'ไม้กวาดกับถังขยะ รอวันศุกร์อยู่', en: 'A broom and a bin, waiting for Friday.' }));
      for (const k of ['D', 'E', 'F', 'G', 'T', 'S', 'O']) {
        const p = this.people[k];
        if (p.visible) add('p' + k, p.x, p.y - 24, 26, 50, () => this.pokePerson(k), T(CAST[k].name));
      }
    }
    if (this.scene === 'hallway') {
      add('notice1', 334, 122, 74, 54, () => this.flick({ th: 'กีฬาสี วงดนตรี ขวดน้ำสีฟ้าหาย ใครเจอคืนด้วย', en: 'Sports day. Choir. A lost water bottle, blue, please return.' }));
      add('cooler', 470, 226, 24, 48, () => this.flick({ th: 'น้ำเย็น ก๊อกที่ดี ไม่ใช่ก๊อกอีกอัน', en: 'Cold water. The good tap, not the other one.' }));
      add('plant', 128, 238, 24, 32, () => this.flick({ th: 'มีคนรดน้ำต้นนี้ คนที่ไม่ได้อยู่ในตารางเวร', en: 'Somebody waters these. Somebody who is not on the roster.' }));
      add('shoes', 742, 240, 50, 24, () => this.flick({ th: 'รองเท้าหกคู่ เหมือนกันหมด แต่ไม่เหมือนกันสักคู่', en: 'Six pairs of shoes, all the same, all somehow different.' }));
      add('notice2', 914, 122, 74, 54, () => this.flick({ th: 'ประกาศรับสมัครวงโยธวาทิต ปิดรับพรุ่งนี้', en: 'Marching band auditions. Closes tomorrow.' }));
      add('rail', 600, 264, 120, 24, () => this.flick({ th: 'ข้างนอก: สนาม เสาธง กับความร้อนที่มองเห็นได้', en: 'Out there: the yard, the flagpole, a heat you can see.' }));
    }
    if (this.scene === 'canteen') {
      for (const shop of SHOPS) {
        add('shop_' + shop.id, shop.x, 214, 120, 84, () => this.openShop(shop), shop.nameShort);
      }
      add('coupon', 1330, 164, 70, 50, () => this.flick({ th: 'คูปอง ยี่สิบบาท ป้าไม่เคยมีเงินทอน', en: 'Coupons. Twenty baht. The aunty never has change.' }));
      for (const k of ['D', 'E', 'B']) {
        const p = this.people[k];
        if (p.visible) add('p' + k, p.x, p.y - 20, 26, 46, () => this.pokePerson(k), T(CAST[k].name));
      }
    }
    if (this.scene === 'gate') {
      add('sign', 78, 130, 24, 60, () => this.flick({ th: 'ชื่อโรงเรียนตัวทอง มีอยู่ตัวหนึ่งเขียวแล้ว', en: 'The school name, in gold, with one letter going green.' }));
      add('cart', 640, 236, 54, 46, () => this.flick({ th: 'หมูปิ้งกับข้าวเหนียว สิบบาท ควันติดเสื้อ', en: 'Grilled pork and sticky rice. Ten baht. The smoke gets in your shirt.' }));
      add('truck', 330, 214, 84, 60, () => this.flick({ th: 'รถแดง ออกตอนเต็ม ไม่เต็มไม่ออก', en: 'The red truck. It leaves when it is full and not before.' }));
      add('shop', 800, 200, 124, 90, () => this.flick({ th: 'เปิดประตูแล้วเย็นสี่วินาที คุ้ม', en: 'Cold air for four seconds when the door opens. Worth it.' }));
      const p = this.people.B;
      if (p.visible) add('pB', p.x, p.y - 24, 28, 52, () => { this.flags.add('met_beam'); this.pokePerson('B'); }, T(CAST.B.name));
    }
    if (this.dream && this.dog && this.dog.alive) {
      add('dog', this.dog.x, this.dog.y - 10, 44, 36, () => {
        this.flags.add('dogpet');
        this.dog.react('pet');
        this.dog.bounce(1.1);
        if (this.fx) for (let i = 0; i < 2; i++) this.fx.heart(this.toScreen(this.dog.x, 0).x, this.toScreen(0, this.dog.y - 16).y);
        if (this.sfx.pop) this.sfx.pop(1.2);
      });
    }
    this.spots = s;
  }

  flick(text) {
    this.dlg.narrate(text, { hold: 3.6 });
    if (this.sfx.plip) this.sfx.plip(1.4);
  }

  pokePerson(k) {
    const p = this.people[k];
    p.face = p.face === 'smile' ? 'laugh' : 'smile';
    if (this.fx) { const sp = this.toScreen(p.x, p.y - 46); this.fx.heart(sp.x, sp.y); }
    if (this.sfx.pop) this.sfx.pop(1.4);
    const lines = {
      D: [{ th: 'อย่ามาจิ้ม', en: 'Stop poking me.' }, { th: 'อะไร อะไรเนี่ย', en: 'What. WHAT.' }, { th: 'แย่ที่สุด มานี่เลย', en: 'You are the worst. Come here.' }],
      E: [{ th: 'รู้ป่ะ ตอนนี้เราหลับอยู่', en: 'Gap fact: I am asleep.' }, { th: 'อีกห้านาที', en: 'Five more minutes.' }, { th: 'รู้ป่ะ พัดลมกินไฟน้อยกว่าตู้เย็น', en: 'Did you know a fan uses less power than a fridge' }],
      F: [{ th: 'จดเลขหน้าไว้ให้แล้วนะ', en: 'I wrote the page number down for you.' }, { th: 'เดี๋ยวนะ ๆ', en: 'Wait, wait.' }],
      G: [{ th: 'กล่องดินสอไม่ได้หล่นนะ มันกระโดด', en: 'It did not fall. It jumped.' }, { th: 'หิว', en: 'Hungry.' }],
      T: [{ th: 'มองข้างหน้า นิ่ม', en: 'Eyes forward, Nim.' }, { th: 'ครูเห็นนะ', en: 'I can see you.' }, { th: 'บทเก้า', en: 'Chapter nine.' }],
      S: [{ th: 'สิบวินาที', en: 'Ten seconds.' }, { th: 'ตอบให้ตรงคำถาม', en: 'Answer the question that was asked.' }],
      O: [{ th: 'Very good ค่ะ', en: 'Very good.' }, { th: 'พูดดัง ๆ นะคะ', en: 'Louder, please.' }],
      B: [{ th: 'ไง', en: 'Hi.' }, { th: '...ไง', en: '...hi.' }, { th: 'เดินเร็วจัง', en: 'You walk fast.' }],
      A: [{ th: '...', en: '...' }, { th: 'หือ', en: 'Hm?' }],
    };
    const l = lines[k] || [{ th: '...', en: '...' }];
    this.dlg.say(l[Math.floor(Math.random() * l.length)], { who: k, anchor: this.anchor(k), hold: 2.8 });
  }

  openShop(shop) {
    if (this.lunch) { this.flick({ th: 'ได้ข้าวแล้ว ไปนั่งเถอะ', en: 'You already have food. Go and sit down.' }); return; }
    this.mini = new Order(shop);
    this.miniThen = (o) => {
      this.lunch = shop.id;
      this.orderedName = o.item.label;
      this.people.A.prop = 'tray';
      if (this.sfx.sparkleUp) this.sfx.sparkleUp();
      this.dlg.narrate({ th: o.item.label + ' — ' + o.item.priceLabel, en: o.item.label + ' — ' + o.item.priceLabel }, { hold: 3 });
    };
  }

  /* ---------------------------------------------------------------- input */
  tap(bx, by) {
    if (this.mini) { this.mini.press(bx, by); return true; }
    if (this.dlg.press(bx, by)) return true;
    const w = this.toWorld(bx, by);
    for (let i = this.spots.length - 1; i >= 0; i--) {
      const sp = this.spots[i];
      if (w.x >= sp.x - sp.w / 2 && w.x <= sp.x + sp.w / 2 && w.y >= sp.y - sp.h && w.y <= sp.y + sp.h * 0.45) {
        const p = this.player;
        const near = Math.abs(p.x - sp.x) < 90;
        if (near || this.dream) sp.fn();
        else p.walkTo(clamp(sp.x - 30, this.S.walk[0], this.S.walk[1]), { speed: 44, then: () => sp.fn() });
        return true;
      }
    }
    if (by > H * 0.45) {
      this.player.walkTo(clamp(w.x, this.S.walk[0], this.S.walk[1]), { speed: 38 });
      return true;
    }
    return false;
  }
  move(bx, by) {
    if (this.mini) { if (this.mini.move) this.mini.move(bx, by); return; }
    this.dlg.move(bx, by);
  }
  nudge(dx, dy) {
    if (this.mini) return;
    this.look = clamp((this.look || 0) - dx, -200, 200);
    this.lookY = this.zoom > 1 ? clamp((this.lookY || 0) - (dy || 0) * 0.6, -60, 30) : 0;
  }

  /* --------------------------------------------------------------- update */
  update(dt) {
    this.t += dt;
    this.fade = Math.max(0, this.fade - dt * 0.9);
    this.hintT = Math.max(0, this.hintT - dt);
    if (this.mini) {
      this.mini.update(dt);
      if (this.mini.done) {
        const m = this.mini, then = this.miniThen;
        this.mini = null; this.miniThen = null;
        if (then) then(m);
      }
      return;
    }
    this.dlg.update(dt);

    const S = this.S;
    for (const k in this.people) {
      const p = this.people[k];
      if (!p.visible) continue;
      p.update(dt);
      p.x = clamp(p.x, S.walk[0] - 60, S.walk[1] + 60);
      if (!p.fixedY) p.y = S.gy(p.x);
    }
    this.updateExtras(dt);
    if (this.dream && this.dog && this.dog.alive) {
      this.dog.y = 232;
      this.dog.update(dt);
      this.dog.x = clamp(this.dog.x, this.cam + 80, this.cam + W - 80);
    }

    // camera follows whoever you are
    const p = this.player;
    this.camTarget = this.clampCam(p.x - W / 2 + (p.flip ? -16 : 16));
    this.look = (this.look || 0) * Math.pow(0.22, dt);
    this.lookY = (this.lookY || 0) * Math.pow(0.5, dt);
    this.cam = this.clampCam(lerp(this.cam, this.camTarget, 1 - Math.pow(0.0012, dt)) + this.look * 0.1);
    this.buildSpots();
    this.runScript(dt);
  }

  /** The rest of the school, doing its own thing. */
  updateExtras(dt) {
    const S = this.S;
    const inClass = this.scene === 'class_am' || this.scene === 'class_pm';
    for (const p of this.extras) {
      if (!p.visible) continue;
      p.update(dt);
      if (!p.fixedY) p.y = S.gy(p.x);
      if (p.roam && p.target === null) {
        p.walkTo(p.rr.chance(0.5) ? S.walk[0] : S.walk[1], { speed: p.rr.f(16, 30) });
      }
      if (inClass) {
        p.classIdle -= dt;
        if (p.classIdle <= 0) {
          p.classIdle = p.rr.f(4, 12);
          const r = p.rr.f();
          p.setPoseNow(r < 0.45 ? 'sit_desk' : r < 0.72 ? 'write' : r < 0.86 ? 'think' : 'stretch');
          if (p.rr.chance(0.25)) p.flip = !p.flip;
        }
      }
    }
    // the room talking to itself
    const kind = inClass ? 'class' : this.scene === 'hallway' ? 'hall' : this.scene === 'canteen' ? 'canteen' : null;
    if (kind && !this.dlg.busy) {
      this.chatT = (this.chatT || 0) - dt;
      if (this.chatT <= 0) {
        this.chatT = kind === 'canteen' ? R.f(0.5, 1.4) : R.f(1.2, 3);
        const near = this.extras.filter((q) => q.visible && Math.abs(q.x - this.cam - W / 2) < 190);
        if (near.length) {
          const who = near[Math.floor(R.f() * near.length)];
          const pool = CHATTER[kind];
          this.chatter.push({ p: who, text: T(pool[Math.floor(R.f() * pool.length)]), age: 0, life: R.f(2, 3.2) });
        }
      }
    }
    for (let i = this.chatter.length - 1; i >= 0; i--) {
      this.chatter[i].age += dt;
      if (this.chatter[i].age > this.chatter[i].life) this.chatter.splice(i, 1);
    }
    if (this.chatter.length > 5) this.chatter.splice(0, this.chatter.length - 5);
  }

  runScript(dt) {
    if (this.done || this.mini) return;
    if (!this.step) {
      if (this.i >= this.steps.length) return;
      this.step = this.steps[this.i++];
      this.stepT = 0;
      this.startStep(this.step);
    }
    this.stepT += dt;
    if (this.stepComplete(this.step)) this.step = null;
  }

  startStep(st) {
    const anch = st.who ? this.anchor(st.who) : null;
    if (st.t === 'say') {
      const opts = { who: st.who, anchor: st.kind === 'narrate' ? null : anch, hold: st.hold || 0 };
      if (st.kind === 'think') this.dlg.think(st.text, opts);
      else if (st.kind === 'narrate') this.dlg.narrate(st.text, opts);
      else this.dlg.say(st.text, opts);
    } else if (st.t === 'ask') {
      this.dlg.ask(st.text || '', st.choices, { who: st.who, anchor: anch });
    } else if (st.t === 'do') st.fn();
    else if (st.t === 'walk') this.people[st.who].walkTo(st.x, { speed: st.speed || 34 });
    else if (st.t === 'goto') this.transition(st.scene, st.x);
    else if (st.t === 'pov') {
      this.pov = st.who;
      this.player.visible = true;
      this.hintOn({ th: 'ตอนนี้คุณคือ ' + T(CAST[st.who].name), en: 'You are ' + T(CAST[st.who].name) + ' now.' });
      this.cam = this.clampCam(this.player.x - W / 2);
    } else if (st.t === 'game') {
      this.mini = st.make();
      this.miniThen = st.then;
    }
  }

  stepComplete(st) {
    switch (st.t) {
      case 'say': case 'ask': return !this.dlg.busy;
      case 'do': return true;
      case 'wait': return this.stepT >= st.s;
      case 'until': {
        if (st.fn()) return true;
        if (this.hintT <= 0 && st.hint && this.stepT > 7) this.hintOn(st.hint);
        return false;
      }
      case 'walk': return this.people[st.who].target === null;
      case 'goto': return this.stepT > 1.1;
      case 'game': return !this.mini;
      default: return true;
    }
  }

  transition(scene, x) {
    this.fadeCol = '#0b0d14';
    this.fade = 0;
    const fade = setInterval(() => { this.fade = Math.min(1, this.fade + 0.09); }, 24);
    setTimeout(() => {
      clearInterval(fade);
      this.enterScene(scene, x);
      if (this.sfx.cicada) this.sfx.cicada(scene === 'gate');
      for (const k in this.people) this.people[k].visible = (k === this.pov);
      this.people[this.pov].visible = true;
      if (scene === 'class_am' || scene === 'class_pm') this.seatClass('T');
      else if (scene === 'hallway') {
        this.fillCrowd('hall');
        this.people.D.visible = true; this.people.D.x = 300; this.people.D.walkTo(1500, { speed: 26 });
      } else if (scene === 'canteen') {
        this.fillCrowd('canteen');
        this.people.D.visible = true; this.people.D.x = 1000; this.people.D.y = GROUND;
        this.people.E.visible = true; this.people.E.x = 1040; this.people.E.y = GROUND;
      } else this.fillCrowd('none');
    }, 620);
  }

  finish() {
    this.done = true;
    if (this.sfx.cicada) this.sfx.cicada(false);
    this.onFinish();
  }

  /* --------------------------------------------------------------- render */
  draw(ctx) {
    const S = this.S;
    const g = this.off.ctx;
    const cam = Math.round(this.cam);
    g.setTransform(RES, 0, 0, RES, 0, 0);
    g.imageSmoothingEnabled = false;
    g.globalAlpha = 1;
    S.draw(g, cam, this.t, { dusk: this.scene === 'gate' ? 0.5 : 0 });

    const inClass = this.scene === 'class_am' || this.scene === 'class_pm';
    const deskOpts = (i) => ({ book: true, bottle: i % 3 === 0, bag: i % 2 === 0, case: i % 4 !== 1,
      caseCol: ['#d8a03c', '#c25a4a', '#6ea04a', '#8a6ad8'][i % 4], pencil: i % 2 === 0,
      ruler: i % 5 === 0, phone: i % 7 === 3, bookCol: ['#c25a4a', '#3f7ea8', '#6ea04a'][i % 3] });
    if (inClass && this.seatRows) {
      for (let r = 0; r < 2; r++) for (const d of this.seatRows[r]) drawDeskBack(g, d.x - cam, d.y, d.sc);
    }

    const actors = [];
    for (const p of this.extras) if (p.visible) actors.push({ y: p.y - 0.5, d: () => p.draw(g, cam, { scale: p.scale || 1, alpha: 0.96 }) });
    for (const k in this.people) {
      const p = this.people[k];
      if (p.visible) actors.push({ y: p.y, d: () => p.draw(g, cam) });
    }
    if (this.dream && this.dog && this.dog.alive) actors.push({ y: this.dog.y, d: () => this.dog.draw(g, cam, {}) });
    if (inClass && this.seatRows) {
      for (let r = 0; r < 2; r++) {
        this.seatRows[r].forEach((d, i) => {
          actors.push({ y: d.y + 0.5, d: () => drawDeskFront(g, d.x - cam, d.y, deskOpts(i + r * 3), d.sc) });
        });
      }
    }
    actors.sort((a, b) => a.y - b.y);
    for (const a of actors) a.d();
    const rig = this.rig(cam);
    lightPass(g, rig, this.t, 'under');
    if (S.fg) S.fg(g, cam, this.t);
    if (this.shimmer > 0) heatShimmer(g, this.t, this.shimmer);

    /* what you can touch, marked only faintly */
    for (const sp of this.spots) {
      const x = sp.x - cam;
      if (x < -20 || x > W + 20) continue;
      g.globalAlpha = 0.18 + 0.1 * Math.sin(this.t * 2.4 + sp.x);
      g.fillStyle = '#fff6d0';
      g.fillRect(Math.round(x - 1), Math.round(sp.y - sp.h * 0.5), 2, 2);
      g.globalAlpha = 1;
    }

    /* the world, blown up */
    const Z = this.zoom;
    const cw = Math.round(W / Z), chh = Math.round(H / Z);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.off.canvas, this.cropX * RES, Math.round(this.cropY) * RES, cw * RES, chh * RES, 0, 0, W, H);

    /* the light of the room, laid over the world but under the words */
    lightPass(ctx, rig, this.t, 'over');

    /* everything that is not the world is drawn at full size on top */
    this.drawChatter(ctx);
    this.dlg.draw(ctx);
    if (this.mini) this.mini.draw(ctx);
    if (this.hintT > 0 && this.hint && !this.dlg.busy && !this.mini) this.drawHint(ctx);
    if (this.fade > 0) {
      ctx.globalAlpha = this.fade;
      ctx.fillStyle = this.fadeCol;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }
  }

  /** Where the light is coming from, in each room, in screen space. */
  rig(cam) {
    const v = (wx) => wx - cam;
    const sc = this.scene;
    if (sc === 'class_am' || sc === 'class_pm') {
      const pm = sc === 'class_pm';
      const beams = [], lights = [], shadows = [];
      for (const wx of [1160, 1250, 1340]) {
        const x = v(wx + 32);
        beams.push({ x0: x, y0: 150, x1: x - (pm ? 170 : 96), y1: 300, w0: 58, w1: pm ? 150 : 112,
          color: pm ? '#ffbf6a' : '#fff0c8', a: pm ? 0.32 : 0.22, motes: 16, seed: wx, sway: 3, ph: wx });
        lights.push({ x, y: 160, r: 80, color: pm ? '#ffcf8a' : '#fff4d8', a: pm ? 0.34 : 0.26, sy: 1.3 });
      }
      for (let wx = 340; wx < 1480; wx += 112) {
        const x = v(wx + 43);
        if (x < -220 || x > W + 60) continue;
        // the sun through the high windows, slanting down across the room
        beams.push({ x0: x, y0: 60, x1: x - (pm ? 200 : 130), y1: 300, w0: 80, w1: pm ? 150 : 124,
          color: pm ? '#ffc27a' : '#fff2d0', a: pm ? 0.2 : 0.14, motes: 8, seed: wx * 3, sway: 2, ph: wx });
        lights.push({ x, y: 58, r: 60, color: pm ? '#ffd9a0' : '#fff8e0', a: 0.3, sy: 0.7 });
      }
      for (let wx = 180; wx < 1500; wx += 240) lights.push({ x: v(wx), y: 20, r: 70, color: '#f4f8ff', a: pm ? 0.1 : 0.16, sy: 0.5, core: '#ffffff' });
      lights.push({ x: v(200), y: 146, r: 140, color: '#cfe6d8', a: 0.05 });       // the board, faintly
      if (this.seatRows) for (let r = 0; r < 2; r++) for (const d of this.seatRows[r]) {
        const x = v(d.x);
        if (x > -30 && x < W + 30) shadows.push({ x: x + 2, y: d.y + 1, r: 20 * d.sc, sy: 0.28, a: 0.34 });
      }
      return {
        shadows, beams, lights,
        ambient: { color: pm ? '#e8c6a4' : '#f2e6d4', top: pm ? '#d8c0b0' : '#eae4dc', amount: pm ? 0.3 : 0.2 },
        grade: { color: pm ? '#ff9a4a' : '#ffd8a0', top: pm ? '#ffcfa0' : '#fff0d8', amount: pm ? 0.16 : 0.1 },
        grain: 0.06,
      };
    }
    if (sc === 'hallway') {
      const beams = [], darks = [];
      for (let wx = -40; wx < 1700; wx += 150) {
        const x = v(wx);
        if (x < -200 || x > W + 200) continue;
        // sun between the pillars, and each pillar's shadow thrown back across the floor
        beams.push({ x0: x + 92, y0: 30, x1: x + 30, y1: 300, w0: 112, w1: 128, color: '#fff0c8', a: 0.26, motes: 10, seed: wx });
        darks.push({ x0: x + 24, y0: 60, x1: x - 28, y1: 300, w0: 22, w1: 38, color: '#7f86a4', a: 0.42 });
      }
      return {
        beams, darks,
        ambient: { color: '#e6ecf4', top: '#f0ece2', amount: 0.14 },
        lights: [{ x: W / 2, y: H + 30, r: 320, color: '#dfeaff', a: 0.1, sy: 0.4 }],
        grade: { color: '#ffe0b0', amount: 0.08 },
        grain: 0.06,
      };
    }
    if (sc === 'canteen') {
      const lights = [], shadows = [];
      for (const wx of [270, 520, 770, 1020, 1270]) {
        lights.push({ x: v(wx), y: 34, r: 120, color: '#eef6ff', a: 0.16, sy: 0.55, core: '#ffffff' });
      }
      SHOPS.forEach((shop) => {
        const x = v(shop.x);
        if (x < -120 || x > W + 120) return;
        lights.push({ x, y: 214, r: 78, color: '#ffcf8a', a: 0.2, sy: 0.7 });
        const cx = x + 34;
        if (shop.cook === 'wok') lights.push({ x: cx + 12, y: GROUND - 58, r: 34, color: '#ff8a3a', a: 0.55, flicker: 0.25, core: '#fff0a0' });
        if (shop.cook === 'grill') lights.push({ x: cx + 18, y: GROUND - 44, r: 30, color: '#ff6a2a', a: 0.5, flicker: 0.18, flickerRate: 7 });
        if (shop.cook === 'noodle') lights.push({ x: cx + 16, y: GROUND - 62, r: 28, color: '#ffffff', a: 0.16 });
        if (shop.cook === 'drinks') lights.push({ x: cx + 20, y: GROUND - 50, r: 30, color: '#c8e8ff', a: 0.2 });
      });
      for (let wx = 140; wx < 1500; wx += 150) shadows.push({ x: v(wx), y: 298, r: 76, sy: 0.18, a: 0.3 });
      return {
        lights, shadows,
        ambient: { color: '#e4d8c6', top: '#ece6dc', amount: 0.16 },
        grade: { color: '#ffd4a0', amount: 0.1 },
        grain: 0.06,
      };
    }
    if (sc === 'gate') {
      // blue hour: everything goes down into blue, and whatever is lit glows warm against it
      const lights = [], soft = [], beams = [];
      lights.push({ x: v(572), y: 126, r: 150, color: '#ff8a40', a: 0.4 });            // the sun going down
      for (let i = 0; i < 11; i++) {
        const x0 = Math.round(-((cam * 0.55) % 80) + i * 80 - 80);
        for (let c = 0; c < 3; c++) {
          lights.push({ x: x0 + 15 + c * 22, y: 104 + (i % 3 ? 0 : 20), r: 20, color: '#ffae4a', a: 0.5, sy: 1.1 });
        }
      }
      for (let i = 0; i < 6; i++) {
        const x = Math.round(-((cam * 0.75) % 140) + i * 140 - 70) - 3;
        lights.push({ x, y: 66, r: 30, color: '#ffd07a', a: 0.62, core: '#fff6d0' });
        beams.push({ x0: x, y0: 68, x1: x, y1: 252, w0: 6, w1: 80, color: '#ffc870', a: 0.16 });
      }
      lights.push({ x: v(800), y: 122, r: 70, color: '#d8fff0', a: 0.26, core: '#ffffff' });   // the shop's strip lights
      lights.push({ x: v(800), y: 234, r: 90, color: '#c8ffe8', a: 0.16, sy: 0.3 });
      lights.push({ x: v(652), y: GROUND - 40, r: 34, color: '#ff7a30', a: 0.6, flicker: 0.22, core: '#ffe0a0' });
      return {
        lights, soft, beams,
        ambient: { color: '#2c3886', top: '#8a70b4', amount: 0.74 },
        grade: { color: '#243a96', top: '#ff8a4a', amount: 0.3 },
        grain: 0.08,
      };
    }
    if (sc === 'dream') {
      return {
        soft: [{ x: W * 0.62, y: 70, r: 240, color: '#ffffff', a: 0.45 },
               { x: W * 0.3, y: 210, r: 180, color: '#e8e0ff', a: 0.2 }],
        grade: { color: '#fff0f8', amount: 0.22 },
        grain: 0.04,
      };
    }
    return null;
  }

  /** Small bubbles over the people you are not talking to. */
  drawChatter(ctx) {
    for (const c of this.chatter) {
      const sp = this.toScreen(c.p.x, c.p.y - (c.p.pose === 'sit_desk' || c.p.pose === 'eat' ? 26 : 46));
      if (sp.x < -40 || sp.x > W + 40 || sp.y < -10 || sp.y > H) continue;
      const k = clamp(Math.min(c.age * 5, (c.life - c.age) * 3), 0, 1);
      if (k <= 0.02) continue;
      const w = textWidth(c.text) + 8;
      const x = clamp(Math.round(sp.x - w / 2), 2, W - w - 2);
      const y = Math.round(sp.y - 14);
      ctx.globalAlpha = k * 0.82;
      ctx.fillStyle = '#fbf8f0';
      ctx.fillRect(x + 1, y, w - 2, 12);
      ctx.fillRect(x, y + 1, w, 10);
      ctx.fillStyle = '#cfc7bc';
      ctx.fillRect(x + 1, y - 1, w - 2, 1);
      ctx.fillRect(x + 1, y + 12, w - 2, 1);
      ctx.fillRect(Math.round(sp.x) - 1, y + 12, 2, 2);
      drawText(ctx, c.text, x + 4, y + 2, '#3a3440');
      ctx.globalAlpha = 1;
    }
  }

  /** A line of quiet help along the bottom, which fades on its own. */
  drawHint(ctx) {
    const a = clamp(this.hintT / 1.2, 0, 1);
    const w = textWidth(this.hint);
    const x = Math.round((W - w) / 2), y = H - 18;
    ctx.globalAlpha = a * 0.36;
    ctx.fillStyle = '#0a0c12';
    ctx.fillRect(x - 6, y - 4, w + 12, 16);
    ctx.globalAlpha = a * 0.9;
    drawText(ctx, this.hint, x, y, '#e8e2d0');
    ctx.globalAlpha = 1;
  }
}

export { lang };
