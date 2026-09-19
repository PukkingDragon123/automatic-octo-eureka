/* ============================================================================
 *  act.js — the school day.
 *
 *  A side-scrolling act you actually play: you walk where you touch, you touch
 *  what is there, you answer when you are spoken to, and twice the day hands
 *  you over to somebody else's eyes for a while.  It ends where the rest of
 *  the game begins — at the top of the mountain, in the butterfly pea.
 * ==========================================================================*/

import { clamp, lerp, rng, ease } from './core.js';
import { W, H } from './vista.js';
import { Person } from './human.js';
import { drawText, textWidth } from './font.js';
import { Dialogue } from './dialogue.js';
import {
  drawClassroom, classroomDesks, drawDeskBack, drawDeskFront, drawFrontRow,
  drawCorridor, drawCorridorFg, drawCanteen, drawCanteenFg, drawGate, drawGateFg,
  drawTrail, drawTrailFg, trailGroundY, drawAntMound, drawShrine, drawPeaField, drawPeaHillside, drawFieldFloor,
  heatShimmer, drawDream,
} from './places.js';

const R = rng(9081);

/* ------------------------------------------------------------------ scenes */

export const SCENES = {
  class_am: {
    w: 960, gy: () => 248, walk: [120, 920], indoor: true,
    draw: (ctx, cam, t, S) => drawClassroom(ctx, cam, t, { clock: 0.19, dusk: 0, fanSpeed: 1, ...S }),
    music: 'school',
  },
  corridor: {
    w: 900, gy: () => 248, walk: [30, 880], indoor: true,
    draw: (ctx, cam, t) => drawCorridor(ctx, cam, t),
    fg: (ctx, cam, t) => drawCorridorFg(ctx, cam, t),
  },
  canteen: {
    w: 900, gy: () => 248, walk: [30, 880], indoor: true,
    draw: (ctx, cam, t) => drawCanteen(ctx, cam, t),
    fg: (ctx, cam) => drawCanteenFg(ctx, cam),
  },
  class_pm: {
    w: 960, gy: () => 248, walk: [120, 920], indoor: true,
    draw: (ctx, cam, t, S) => drawClassroom(ctx, cam, t, { clock: 0.62, dusk: 0.25, fanSpeed: 0.7, ...S }),
  },
  gate: {
    w: 960, gy: () => 252, walk: [30, 930],
    draw: (ctx, cam, t, S) => drawGate(ctx, cam, t, S),
    fg: (ctx, cam) => drawGateFg(ctx, cam),
  },
  dream: {
    w: 480, gy: () => 232, walk: [40, 440],
    draw: (ctx, cam, t) => drawDream(ctx, cam, t),
  },
  trail: {
    w: 2400, gy: (x) => trailGroundY(x), walk: [20, 2380],
    draw: (ctx, cam, t, S) => {
      drawTrail(ctx, cam, t, S);
      if (cam > 1100) drawPeaHillside(ctx, cam, t, 1400, 2400);
      drawPeaField(ctx, cam, t, 1500, 2400, trailGroundY, 1);
      drawFieldFloor(ctx, cam, t, 1480, 2400, trailGroundY);
    },
    fg: (ctx, cam, t) => drawTrailFg(ctx, cam, t),
  },
};

/* --------------------------------------------------------------- the cast */

const CAST = {
  A: { name: 'Nim', outfit: 'thaiGirl' },
  B: { name: 'Beam', outfit: 'thaiBoy' },
  D: { name: 'Fon', outfit: 'thaiGirl' },
  E: { name: 'Gap', outfit: 'thaiBoy' },
  T: { name: 'Kru Malee', outfit: 'thaiTeach' },
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

export class Act {
  constructor(deps = {}) {
    this.fx = deps.fx;
    this.sfx = deps.sfx || {};
    this.dog = deps.dog;
    this.onFinish = deps.onFinish || (() => {});
    this.dlg = new Dialogue();
    this.dlg.onChoice = (v) => this.answer(v);
    this.people = {};
    for (const k in CAST) {
      const p = new Person(k, -200, 236);
      p.outfit = CAST[k].outfit;
      p.visible = false;
      p.autoIdle = false;
      this.people[k] = p;
    }
    this.extras = [];
    for (let i = 0; i < 6; i++) {
      const p = new Person(i % 2 ? 'E' : 'D', -400, 236);
      p.outfit = i % 2 ? 'thaiBoy' : 'thaiGirl';
      p.visible = false;
      p.autoIdle = false;
      p.rr = rng(500 + i * 13);
      this.extras.push(p);
    }
    this.pov = 'A';
    this.scene = 'class_am';
    this.cam = 0;
    this.camTarget = 0;
    this.t = 0;
    this.flags = new Set();
    this.lunch = null;
    this.answered = null;
    this.steps = [];
    this.i = 0;
    this.step = null;
    this.stepT = 0;
    this.hint = null;
    this.hintT = 0;
    this.fade = 1;
    this.fadeCol = '#0b0d14';
    this.dreamK = 0;
    this.shimmer = 0;
    this.spots = [];
    this.sleep = 0;
    this.done = false;
  }

  get player() { return this.people[this.pov]; }
  get S() { return SCENES[this.scene]; }

  /* ------------------------------------------------------------- start up */
  begin() {
    this.steps = this.buildScript();
    this.i = 0;
    this.enterScene('class_am', 300);
    this.seatClass();
  }

  seatClass() {
    const desks = classroomDesks();
    const P = this.people;
    const seat = (d) => d.x - 17;
    P.A.visible = true; P.A.x = seat(desks[3]); P.A.setPoseNow('sit_desk'); P.A.flip = false;
    P.D.visible = true; P.D.x = seat(desks[5]); P.D.setPoseNow('sit_desk'); P.D.flip = false;
    P.E.visible = true; P.E.x = seat(desks[1]); P.E.setPoseNow('sit_desk'); P.E.flip = false;
    P.T.visible = true; P.T.x = 130; P.T.setPoseNow('stand'); P.T.flip = false;
    P.B.visible = false;
    this.extras.forEach((p, i) => {
      p.visible = true;
      p.x = seat(desks[[0, 2, 4, 6, 7][i % 5]]) + (i > 4 ? 44 : 0);
      p.setPoseNow('sit_desk');
      p.y = 248;
    });
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
    this.fade = 1;
    this.buildSpots();
  }

  clampCam(v) { return clamp(v, 0, Math.max(0, this.S.w - W)); }

  /* ----------------------------------------------------------- the script */
  buildScript() {
    const P = this.people;
    const s = [];
    /* ---------- morning class ---------- */
    s.push(narrate('WEDNESDAY. SECOND PERIOD.', 2.4));
    s.push(narrate('The fan is losing.', 2.2));
    s.push(think('A', 'Forty more minutes. I can feel every one of them.'));
    s.push(doo(() => { this.hintOn('Touch things. Touch people. Drag to look around.'); }));
    s.push(say('D', 'Psst. Nim. Nim!'));
    s.push(say('D', 'Did you do question four? The one about the river?'));
    s.push(ask('A', '', [
      { text: 'I did it twice. It was wrong twice.', value: 'honest' },
      { text: 'What question four.', value: 'blank' },
      { text: 'Copy mine. Quickly.', value: 'copy' },
    ], (v) => {
      this.flags.add('fon');
      if (v === 'honest') this.dlg.say('Then we are both wrong. Good. Safety in numbers.', { who: 'D', anchor: this.anchor('D') });
      else if (v === 'blank') this.dlg.say('The one you were awake for. Allegedly.', { who: 'D', anchor: this.anchor('D') });
      else this.dlg.say('Nim. I love you. Truly.', { who: 'D', anchor: this.anchor('D') });
    }));
    s.push(say('E', 'Some of us are trying to sleep back here.'));
    s.push(doo(() => { this.flags.add('gap'); }));
    s.push(say('T', 'Nim. Since you are having such a good conversation.'));
    s.push(say('T', 'The Chao Phraya. Which two rivers meet to make it?'));
    s.push(doo(() => { P.A.setPoseNow('stand'); P.T.setPoseNow('point'); this.sfx.pop && this.sfx.pop(0.8); }));
    s.push(ask('A', '', [
      { text: 'The Ping and the Nan, teacher.', value: 'right' },
      { text: 'The... big one and the other one?', value: 'wrong' },
      { text: '(say nothing and hope)', value: 'silent' },
    ], (v) => {
      this.answered = v;
      const an = this.anchor('T');
      if (v === 'right') {
        this.dlg.say('Correct. Sit down before I faint.', { who: 'T', anchor: an });
        this.flags.add('gold');
      } else if (v === 'wrong') {
        this.dlg.say('The big one. Write that on the exam. I dare you.', { who: 'T', anchor: an });
      } else {
        this.dlg.say('Ping and Nan. Say it with me at lunch. Twice.', { who: 'T', anchor: an });
      }
    }));
    s.push(doo(() => { P.A.setPoseNow('sit_desk'); P.T.setPoseNow('stand'); }));
    s.push(wait(0.6));
    s.push(narrate('THE BELL', 1.6));
    s.push(doo(() => { this.sfx.bell && this.sfx.bell(); this.standEveryone(); }));
    s.push(say('D', 'Canteen. Come on, before the kaprao runs out.'));
    s.push(doo(() => this.hintOn('Touch the floor to walk. Head right.')));
    s.push(goto('corridor', 60));

    /* ---------- the walkway ---------- */
    s.push(narrate('THE WALKWAY', 1.6));
    s.push(think('A', 'Ping and Nan. Ping and Nan. Ping and Nan.'));
    s.push(doo(() => this.hintOn('Walk right to the canteen.')));
    s.push(until(() => this.player.x > 830, 'the canteen is at the far end'));
    s.push(goto('canteen', 60));

    /* ---------- lunch ---------- */
    s.push(narrate('LUNCH', 1.6));
    s.push(doo(() => this.hintOn('Pick a stall. Touch one.')));
    s.push(until(() => this.lunch !== null, 'choose what to eat'));
    s.push(doo(() => {
      this.dlg.say(this.lunchLine(), { who: 'D', anchor: this.anchor('D') });
    }));
    s.push(walk('A', 640, 34));
    s.push(doo(() => {
      P.A.setPose({ pose: 'eat', prop: null });
      P.D.x = 610; P.D.visible = true; P.D.setPoseNow('eat');
      P.E.x = 700; P.E.visible = true; P.E.setPoseNow('eat');
      P.B.visible = true; P.B.x = 330; P.B.setPoseNow('sit_chair'); P.B.flip = true;
    }));
    s.push(say('E', 'Gap fact. If you eat under a fan the food gets cold in one minute.'));
    s.push(say('D', 'Gap fact. Nobody asked.'));
    s.push(say('D', 'Nim. That boy by the window has looked over here four times.'));
    s.push(ask('A', '', [
      { text: 'He has not.', value: 'deny' },
      { text: 'Five. But who counts.', value: 'counted' },
      { text: 'Eat your rice, Fon.', value: 'deflect' },
    ], (v) => {
      this.flags.add('beam_seen');
      const an = this.anchor('D');
      if (v === 'counted') this.dlg.say('NIM.', { who: 'D', anchor: an });
      else if (v === 'deny') this.dlg.say('Five, now. Five.', { who: 'D', anchor: an });
      else this.dlg.say('I am eating it. Loudly. About this.', { who: 'D', anchor: an });
    }));
    /* ---------- the same lunch, from the other side of the room ---------- */
    s.push(narrate('MEANWHILE, BY THE WINDOW', 2.2));
    s.push(pov('B'));
    s.push(think('B', 'She is the one who argued with Kru Malee about the rivers and won.'));
    s.push(doo(() => this.hintOn('You are Beam now. Walk. Touch things.')));
    s.push(ask('B', '', [
      { text: 'Go and say something. Anything.', value: 'go' },
      { text: 'Buy a milk. Think about it.', value: 'milk' },
      { text: 'Absolutely not. Look at the wall.', value: 'wall' },
    ], (v) => {
      this.flags.add('beam_choice_' + v);
      if (v === 'go') this.dlg.think("Right. Standing up. Standing up now. Any moment.", { who: 'B', anchor: this.anchor('B') });
      else if (v === 'milk') this.dlg.think('A milk is a plan. A milk is basically a plan.', { who: 'B', anchor: this.anchor('B') });
      else this.dlg.think('The wall is a very good wall.', { who: 'B', anchor: this.anchor('B') });
    }));
    s.push(wait(0.4));
    s.push(doo(() => { this.sfx.bell && this.sfx.bell(); }));
    s.push(say('B', '...that is the bell.', { kind: 'think' }));
    s.push(pov('A'));
    s.push(goto('class_pm', 300));

    /* ---------- afternoon ---------- */
    s.push(doo(() => { this.seatClass(); this.people.B.visible = false; this.shimmer = 1; }));
    s.push(narrate('AFTERNOON. THE HOT ONE.', 2.2));
    s.push(say('T', 'Open your books. Chapter nine. The rivers, again.'));
    s.push(think('A', 'Ping. And. Nan.'));
    s.push(doo(() => { this.sleep = 0.001; this.hintOn('Touch yourself to stay awake. Or do not.'); }));
    s.push(until(() => this.sleep >= 1, 'your eyes are closing'));
    s.push(doo(() => { this.dreamK = 0.001; this.people.A.setPoseNow('sleep_desk'); }));
    s.push(wait(2.6));

    /* ---------- the dream ---------- */
    s.push(narrate('...', 1.6));
    s.push(doo(() => { this.startDream(); }));
    s.push(narrate('Grass. And something small and green, asleep in it.', 3));
    s.push(doo(() => this.hintOn('Touch it.')));
    s.push(until(() => this.flags.has('dogpet'), 'touch the little green thing'));
    s.push(think('A', 'Oh. Oh, you are the best thing I have ever seen.'));
    s.push(say('T', 'NIM.'));
    s.push(doo(() => { this.endDream(); this.people.A.setPoseNow('shock'); this.people.A.face = 'surprise'; }));
    s.push(say('T', 'Would you care to share it with the class?'));
    s.push(ask('A', '', [
      { text: 'There was a dog. He was a bean.', value: 'bean' },
      { text: 'I was resting my eyes, teacher.', value: 'eyes' },
      { text: 'The Ping and the Nan!', value: 'rivers' },
    ], (v) => {
      const an = this.anchor('T');
      this.flags.add('woke_' + v);
      if (v === 'bean') this.dlg.say('A bean.', { who: 'T', anchor: an })
        .say('Class, Nim has been dreaming of legumes. Again.', { who: 'T', anchor: an });
      else if (v === 'eyes') this.dlg.say('You were resting them very loudly.', { who: 'T', anchor: an });
      else this.dlg.say('...correct. Infuriating. Correct.', { who: 'T', anchor: an });
    }));
    s.push(doo(() => { this.people.A.face = 'smile'; }));
    s.push(say('E', '(Gap is on the floor)'));
    s.push(say('T', 'Since you are so full of energy. The flower beds. After school. All of them.'));
    s.push(say('T', 'Take the watering can from the store room.'));
    s.push(doo(() => { this.flags.add('can'); this.people.A.prop = null; }));
    s.push(wait(0.5));
    s.push(narrate('THE LAST BELL', 1.8));
    s.push(doo(() => { this.sfx.bell && this.sfx.bell(); this.standEveryone(); }));
    s.push(goto('gate', 120));

    /* ---------- the gate ---------- */
    s.push(doo(() => {
      this.people.D.visible = true; this.people.D.x = 210; this.people.D.flip = true;
      this.people.B.visible = true; this.people.B.x = 540;
      this.people.E.visible = false;
      this.people.T.visible = false;
    }));
    s.push(narrate('AFTER SCHOOL', 1.8));
    s.push(say('D', 'I have to go and get my brother. Water your beds, gardener.'));
    s.push(doo(() => { this.people.D.walkTo(-30, { speed: 34 }); }));
    s.push(doo(() => this.hintOn('Somebody is waiting by the gate.')));
    s.push(until(() => this.flags.has('met_beam'), 'the boy from the canteen'));
    s.push(say('B', 'You are the rivers person.'));
    s.push(say('A', 'You are the window person.'));
    s.push(say('B', 'Beam.'));
    s.push(say('A', 'Nim.'));
    s.push(wait(0.4));
    s.push(say('B', 'There is a flower field up the mountain. Butterfly pea. It is stupidly blue.'));
    s.push(ask('A', '', [
      { text: 'Show me.', value: 'yes' },
      { text: 'I have flower beds to water.', value: 'duty' },
      { text: 'Is it far?', value: 'far' },
    ], (v) => {
      this.flags.add('gate_' + v);
      const an = this.anchor('B');
      if (v === 'yes') this.dlg.say('Right. Now? Now.', { who: 'B', anchor: an });
      else if (v === 'duty') this.dlg.say('The beds will keep. The light will not.', { who: 'B', anchor: an });
      else this.dlg.say('Forty minutes. Songthaew to the foot, walk the rest.', { who: 'B', anchor: an });
    }));
    s.push(doo(() => this.hintOn('Walk right, to the songthaew.')));
    s.push(until(() => this.player.x > 860, 'the red truck at the end of the road'));
    s.push(goto('trail', 60));

    /* ---------- the mountain ---------- */
    s.push(doo(() => {
      this.people.B.visible = true; this.people.B.x = 110;
      this.people.D.visible = false;
      this.shimmer = 0.4;
    }));
    s.push(narrate('THE MOUNTAIN', 2.2));
    s.push(narrate('Cicadas. A path. Forty minutes of both.', 2.6));
    s.push(doo(() => this.hintOn('Walk up. Touch whatever you pass.')));
    s.push(until(() => this.player.x > 560, 'keep going up'));
    s.push(say('B', 'Careful round this one.'));
    s.push(until(() => this.flags.has('mound'), 'the mound by the path'));
    s.push(say('B', "My grandmother says there's a spirit in it. That's why the cloth."));
    s.push(say('B', 'Also there are about a million ants in it.'));
    s.push(until(() => this.player.x > 1080, 'onward'));
    s.push(until(() => this.flags.has('shrine'), 'the spirit house'));
    s.push(say('B', 'You put the straw in so the spirit can drink it. Obviously.'));
    s.push(ask('A', '', [
      { text: '(wai, properly)', value: 'wai' },
      { text: '(leave a flower)', value: 'flower' },
      { text: '(ask for something small)', value: 'wish' },
    ], (v) => {
      this.flags.add('shrine_' + v);
      const p = this.people.A;
      if (v === 'wai') { p.setPoseNow('wai'); this.dlg.say('Good. She likes that.', { who: 'B', anchor: this.anchor('B') }); }
      else if (v === 'flower') { p.prop = 'flower'; this.dlg.say('She likes that more.', { who: 'B', anchor: this.anchor('B') }); }
      else this.dlg.think('Nothing big. Just — more days like this one.', { who: 'A', anchor: this.anchor('A') });
    }));
    s.push(doo(() => { this.people.A.setPoseNow('stand'); this.people.A.prop = null; }));
    s.push(doo(() => this.hintOn('Nearly at the top.')));
    s.push(until(() => this.player.x > 1560, 'over the last rise'));
    s.push(narrate('AND THEN THE TOP.', 2.6));
    s.push(doo(() => { this.people.B.walkTo(this.player.x + 40, { speed: 30 }); }));
    s.push(say('B', 'Told you. Stupidly blue.'));
    s.push(think('A', 'It goes all the way over the ridge.'));
    s.push(until(() => this.player.x > 2180, 'walk out into it'));
    s.push(say('B', 'People pick it for tea. Turns the water this colour, then you put lime in and it goes pink.'));
    s.push(say('A', 'You are making that up.'));
    s.push(say('B', 'I am extremely not.'));
    s.push(wait(0.8));
    s.push(narrate('You sit down in it, because there is nothing else to do with a field like this.', 4));
    s.push(doo(() => { this.people.A.setPoseNow('sit_ground'); this.people.B.setPoseNow('sit_ground'); }));
    s.push(wait(2.2));
    s.push(think('A', 'I dreamed about something today. Something small and green.'));
    s.push(narrate('Somewhere in the grass, about nine steps away, something small and green is asleep.', 4.5));
    s.push(doo(() => { this.finish(); }));
    return s;
  }

  lunchLine() {
    if (this.lunch === 'kaprao') return 'Kaprao. Every single day. You have a problem.';
    if (this.lunch === 'noodle') return 'Noodles in this heat. You are unwell.';
    return 'Som tam. Brave. You will be crying in ten minutes.';
  }

  standEveryone() {
    for (const k of ['A', 'D', 'E']) this.people[k].setPoseNow('stand');
    this.extras.forEach((p) => p.setPoseNow('stand'));
  }

  anchor(who) {
    const p = this.people[who];
    if (!p) return null;
    return () => ({ x: p.x - this.cam, y: p.y - (p.pose === 'sit_desk' || p.pose === 'sit_ground' || p.pose === 'eat' ? 26 : 46) });
  }

  hintOn(text) { this.hint = text; this.hintT = 5.5; }

  answer(v) {
    const st = this.step;
    if (st && st.t === 'ask' && st.then) st.then(v);
    this.stepDone = true;
  }

  /* ----------------------------------------------------------- the dream */
  startDream() {
    this.dreamPrev = this.scene;
    this.dream = true;
    this.dreamK = 0.001;
    this.fadeCol = '#f4f8ff';
    this.fade = 1;
    this.enterScene('dream', 190);
    this.fadeCol = '#f4f8ff';
    this.extras.forEach((p) => { p.visible = false; });
    for (const k of ['B', 'D', 'E', 'T']) this.people[k].visible = false;
    const a = this.people.A;
    a.visible = true; a.x = 170; a.setPoseNow('stand'); a.face = 'calm'; a.flip = false;
    if (this.dog) {
      this.dog.alive = true;
      this.dog.age = 0;
      this.dog.x = 300;
      this.dog.y = 232;
      this.dog.state = 'sleep';
      this.dog.pose = 'sleep';
      this.dog.alpha = 1;
    }
  }
  endDream() {
    if (!this.dream) return;
    this.dream = false;
    if (this.dog) this.dog.alive = false;
    this.fadeCol = '#f4f8ff';
    this.enterScene(this.dreamPrev || 'class_pm', 300);
    this.seatClass();
    this.sleep = 0;
    this.people.A.setPoseNow('shock');
  }

  /* ------------------------------------------------------------- touching */
  buildSpots() {
    const s = [];
    const add = (id, x, y, w, h, fn, label) => s.push({ id, x, y, w, h, fn, label });
    if (this.scene === 'class_am' || this.scene === 'class_pm') {
      add('fan', 180, 24, 44, 24, () => this.flick('The fan turns. It has turned for eleven years.'), 'fan');
      add('board', 140, 130, 200, 80, () => this.flick("Chapter nine. Somebody has drawn a very small cat in the corner."), 'board');
      add('cupboard', 586, 200, 60, 70, () => this.flick('Trophies, a globe with the Pacific worn off, and a box of chalk.'), 'cupboard');
      add('clock', 320, 78, 24, 24, () => this.flick('Nineteen minutes. That cannot be right.'), 'clock');
      add('window', 670, 128, 70, 90, () => this.flick('Hot white light, a mango tree, and the flag not moving at all.'), 'window');
      add('flag', 76, 74, 34, 24, () => this.flick(''), 'flag');
      add('buddha', 218, 66, 40, 22, () => this.flick('Marigolds, a little gold, and dust nobody is allowed to touch.'), 'shelf');
      add('broom', 900, 220, 30, 44, () => this.flick('The cleaning roster. Your name is on Friday.'), 'broom');
      for (const k of ['D', 'E', 'T']) {
        const p = this.people[k];
        if (p.visible) add('p' + k, p.x, p.y - 24, 24, 50, () => this.pokePerson(k), CAST[k].name);
      }
    }
    if (this.scene === 'corridor') {
      add('notice', 294, 96, 66, 46, () => this.flick('Sports day. Choir. A lost water bottle, blue, please return.'), 'board');
      add('cooler', 470, 226, 22, 46, () => this.flick('Cold water. The good tap, not the other one.'), 'water');
      add('plant', 368, 232, 22, 30, () => this.flick('Somebody waters these. Somebody who is not on the roster.'), 'plant');
      add('shoes', 722, 238, 46, 22, () => this.flick('Four pairs of shoes, all the same, all somehow different.'), 'shoes');
      add('rail', 180, 226, 90, 30, () => this.flick('Out there: the yard, the flagpole, a heat you can see.'), 'rail');
    }
    if (this.scene === 'canteen') {
      add('stall1', 120, 210, 100, 80, () => this.pickLunch('kaprao'), 'kaprao');
      add('stall2', 330, 210, 100, 80, () => this.pickLunch('noodle'), 'noodles');
      add('stall3', 540, 210, 100, 80, () => this.pickLunch('somtam'), 'som tam');
      add('coupon', 730, 120, 60, 44, () => this.flick('Coupons. Twenty baht. The aunty never has change.'), 'coupons');
      for (const k of ['D', 'E', 'B']) {
        const p = this.people[k];
        if (p.visible) add('p' + k, p.x, p.y - 20, 24, 44, () => this.pokePerson(k), CAST[k].name);
      }
    }
    if (this.scene === 'gate') {
      add('sign', 78, 130, 24, 60, () => this.flick('The school name, in gold, with one letter going green.'), 'sign');
      add('cart', 640, 236, 54, 46, () => this.flick('Grilled pork and sticky rice. Ten baht. The smoke gets in your shirt.'), 'cart');
      add('truck', 330, 214, 84, 60, () => this.flick('The red truck. It leaves when it is full and not before.'), 'songthaew');
      add('shop', 800, 200, 124, 90, () => this.flick('Cold air for four seconds when the door opens. Worth it.'), 'shop');
      const p = this.people.B;
      if (p.visible) add('pB', p.x, p.y - 24, 26, 50, () => { this.flags.add('met_beam'); this.pokePerson('B'); }, 'Beam');
    }
    if (this.scene === 'trail') {
      add('mound', 640, trailGroundY(640) - 30, 44, 60,
        () => { this.flags.add('mound'); this.flick('Somebody has tied cloth round it, and left water, and marigolds.'); }, 'mound');
      add('shrine', 1180, trailGroundY(1180) - 40, 44, 70,
        () => { this.flags.add('shrine'); this.flick('A red drink with a straw in it, so the spirit does not have to bend down.'); }, 'shrine');
      add('bamboo', 900, trailGroundY(900) - 30, 40, 50, () => this.flick('The bamboo knocks together when the wind comes up the valley.'), 'bamboo');
      add('field1', 1700, trailGroundY(1700) - 20, 80, 50, () => this.pickFlower(1700), 'flowers');
      add('field2', 2000, trailGroundY(2000) - 20, 80, 50, () => this.pickFlower(2000), 'flowers');
      add('field3', 2260, trailGroundY(2260) - 20, 80, 50, () => this.pickFlower(2260), 'flowers');
      const p = this.people.B;
      if (p.visible) add('pB', p.x, p.y - 24, 26, 50, () => this.pokePerson('B'), 'Beam');
    }
    if (this.dream && this.dog && this.dog.alive) {
      add('dog', this.dog.x, this.dog.y - 10, 40, 34, () => {
        this.flags.add('dogpet');
        this.dog.react('pet');
        this.dog.bounce(1.1);
        if (this.fx) for (let i = 0; i < 2; i++) this.fx.heart(this.dog.x - this.cam, this.dog.y - 16);
        this.sfx.pop && this.sfx.pop(1.2);
      }, 'him');
    }
    this.spots = s;
  }

  flick(text) {
    if (text) this.dlg.narrate(text, { hold: 3.4 });
    if (this.fx) this.fx.sparkle(this.lastTapX, this.lastTapY, '#fff4c8', 0.6);
    this.sfx.plip && this.sfx.plip(1.4);
  }

  pokePerson(k) {
    const p = this.people[k];
    p.face = p.face === 'smile' ? 'laugh' : 'smile';
    if (this.fx) this.fx.heart(p.x - this.cam, p.y - 46);
    this.sfx.pop && this.sfx.pop(1.4);
    const lines = {
      D: ['Stop poking me.', 'What. WHAT.', 'You are the worst. Come here.'],
      E: ['Gap fact: I am asleep.', 'Five more minutes.', 'Did you know a fan uses less power than a fridge'],
      T: ['Eyes forward, Nim.', 'I can see you.', 'Chapter nine.'],
      B: ['Hi.', '...hi.', 'You walk fast.'],
      A: ['...', 'Hm?'],
    };
    const l = lines[k] || ['...'];
    this.dlg.say(l[Math.floor(Math.random() * l.length)], { who: k, anchor: this.anchor(k), hold: 2.6 });
  }

  pickLunch(which) {
    if (this.lunch) { this.flick('You already have food. Go and sit down.'); return; }
    this.lunch = which;
    this.people.A.prop = 'tray';
    this.sfx.sparkleUp && this.sfx.sparkleUp();
    const names = { kaprao: 'Pad kaprao, fried egg on top, chilli in the eyes.',
      noodle: 'Noodles, soup, and a fan pointed straight at it.',
      somtam: 'Som tam, two chillies, which is one too many.' };
    this.dlg.narrate(names[which], { hold: 3.4 });
  }

  pickFlower(x) {
    this.flags.add('picked');
    if (this.fx) {
      for (let i = 0; i < 8; i++) this.fx.petal('pea', x - this.cam + R.f(-20, 20), trailGroundY(x) - R.f(4, 30), 6);
      this.fx.sparkle(x - this.cam, trailGroundY(x) - 14, '#d8ccff', 0.8);
    }
    this.sfx.plip && this.sfx.plip(1.2);
    this.dlg.narrate('You take one. It stains your fingers blue, the way they said it would.', { hold: 3.6 });
  }

  /* ---------------------------------------------------------------- input */
  tap(bx, by) {
    if (this.dlg.press(bx + 0, by + 0)) return true;
    const wx = bx + this.cam;
    // the topmost spot wins
    for (let i = this.spots.length - 1; i >= 0; i--) {
      const sp = this.spots[i];
      if (wx >= sp.x - sp.w / 2 && wx <= sp.x + sp.w / 2 && by >= sp.y - sp.h && by <= sp.y + sp.h * 0.45) {
        this.lastTapX = bx; this.lastTapY = by;
        const p = this.player;
        const near = Math.abs(p.x - sp.x) < 70;
        if (near || this.dream) sp.fn();
        else p.walkTo(clamp(sp.x - 26, this.S.walk[0], this.S.walk[1]), { speed: 40, then: () => sp.fn() });
        return true;
      }
    }
    // otherwise: walk there
    if (by > 150) {
      const p = this.player;
      p.walkTo(clamp(wx, this.S.walk[0], this.S.walk[1]), { speed: 36 });
      if (this.sleep > 0 && this.sleep < 1) this.sleep = Math.max(0.001, this.sleep - 0.26);
      return true;
    }
    return false;
  }
  move(bx, by) { this.dlg.move(bx, by); }
  /** Dragging the background looks around without moving anybody. */
  nudge(dx) { this.look = clamp((this.look || 0) - dx, -160, 160); }

  /* --------------------------------------------------------------- update */
  update(dt) {
    this.t += dt;
    this.fade = Math.max(0, this.fade - dt * 0.9);
    this.hintT = Math.max(0, this.hintT - dt);
    this.dlg.update(dt);
    if (this.dreamK > 0 && this.dream) this.dreamK = Math.min(1, this.dreamK + dt * 0.5);
    if (!this.dream && this.dreamK > 0) this.dreamK = Math.max(0, this.dreamK - dt * 1.2);

    const S = this.S;
    for (const k in this.people) {
      const p = this.people[k];
      if (!p.visible) continue;
      p.update(dt);
      p.x = clamp(p.x, S.walk[0] - 60, S.walk[1] + 60);
      p.y = S.gy(p.x);
    }
    for (const p of this.extras) { if (p.visible) { p.update(dt); p.y = S.gy(p.x); } }
    if (this.dream && this.dog && this.dog.alive) {
      this.dog.y = 232;
      this.dog.update(dt);
      this.dog.x = clamp(this.dog.x, this.cam + 60, this.cam + W - 60);
    }
    // the afternoon pulling your eyes shut
    if (this.sleep > 0 && this.sleep < 1) {
      this.sleep = Math.min(1, this.sleep + dt * 0.085);
      this.people.A.face = this.sleep > 0.5 ? 'tired' : 'calm';
      if (this.sleep > 0.6) this.people.A.setPoseNow('sit_desk');
    }

    // camera follows whoever you are
    const p = this.player;
    this.camTarget = this.clampCam(p.x - W / 2 + (p.flip ? -20 : 20));
    this.look = (this.look || 0) * Math.pow(0.22, dt);
    this.cam = this.clampCam(lerp(this.cam, this.camTarget, 1 - Math.pow(0.0012, dt)) + this.look * 0.12);
    this.buildSpots();
    this.runScript(dt);
  }

  runScript(dt) {
    if (this.done) return;
    if (!this.step) {
      if (this.i >= this.steps.length) return;
      this.step = this.steps[this.i++];
      this.stepT = 0;
      this.stepDone = false;
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
      this.dlg.ask(st.text || '...', st.choices, { who: st.who, anchor: anch });
    } else if (st.t === 'do') {
      st.fn();
    } else if (st.t === 'walk') {
      const p = this.people[st.who];
      p.walkTo(st.x, { speed: st.speed || 34 });
    } else if (st.t === 'goto') {
      this.transition(st.scene, st.x);
    } else if (st.t === 'pov') {
      this.pov = st.who;
      const p = this.player;
      p.visible = true;
      this.hintOn('You are ' + CAST[st.who].name + ' now.');
      this.cam = this.clampCam(p.x - W / 2);
    }
  }

  stepComplete(st) {
    switch (st.t) {
      case 'say': return !this.dlg.busy;
      case 'ask': return !this.dlg.busy;
      case 'do': return true;
      case 'wait': return this.stepT >= st.s;
      case 'until': {
        if (st.fn()) return true;
        if (this.hintT <= 0 && st.hint && this.stepT > 6) this.hintOn(st.hint);
        return false;
      }
      case 'walk': return this.people[st.who].target === null;
      case 'goto': return this.stepT > 1.1;
      case 'pov': return true;
      default: return true;
    }
  }

  transition(scene, x) {
    this.fadeCol = '#0b0d14';
    this.fade = 0;
    const fade = setInterval(() => { this.fade = Math.min(1, this.fade + 0.09); }, 24);
    setTimeout(() => {
      clearInterval(fade);
      const keep = {};
      for (const k in this.people) keep[k] = this.people[k].visible;
      this.enterScene(scene, x);
      if (this.sfx.cicada) this.sfx.cicada(scene === 'trail' || scene === 'gate');
      for (const k in this.people) this.people[k].visible = keep[k] && (k === this.pov);
      this.people[this.pov].visible = true;
      this.extras.forEach((p) => { p.visible = scene === 'class_am' || scene === 'class_pm'; });
      if (scene === 'canteen') { this.people.D.visible = true; this.people.E.visible = true; this.people.D.x = 760; this.people.E.x = 800; }
      if (scene === 'corridor') { this.people.D.visible = true; this.people.D.x = 300; this.people.D.walkTo(820, { speed: 26 }); }
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
    const cam = Math.round(this.cam);
    S.draw(ctx, cam, this.t, { dusk: this.scene === 'gate' ? 0.55 : 0 });

    const inClass = this.scene === 'class_am' || this.scene === 'class_pm';
    if (inClass) for (const d of classroomDesks()) drawDeskBack(ctx, d.x - cam, d.y);

    const actors = [];
    for (const p of this.extras) if (p.visible) actors.push({ y: p.y - 1, d: () => p.draw(ctx, cam, { alpha: 0.9 }) });
    for (const k in this.people) {
      const p = this.people[k];
      if (p.visible) actors.push({ y: p.y, d: () => p.draw(ctx, cam) });
    }
    if (this.scene === 'trail') {
      actors.push({ y: trailGroundY(640) - 1, d: () => drawAntMound(ctx, 640 - cam, trailGroundY(640), this.t) });
      actors.push({ y: trailGroundY(1180) - 1, d: () => drawShrine(ctx, 1180 - cam, trailGroundY(1180), this.t) });
    }
    if (this.dream && this.dog && this.dog.alive) {
      actors.push({ y: this.dog.y, d: () => this.dog.draw(ctx, cam, {}) });
    }
    actors.sort((a, b) => a.y - b.y);
    for (const a of actors) a.d();
    if (inClass) {
      for (const d of classroomDesks()) {
        drawDeskFront(ctx, d.x - cam, d.y, { book: true, bottle: (d.x | 0) % 3 === 0, bag: (d.x | 0) % 2 === 0 });
      }
      drawFrontRow(ctx, cam);
    }

    if (S.fg) S.fg(ctx, cam, this.t);
    if (this.scene === 'trail') drawPeaField(ctx, cam, this.t, 1480, 2400, trailGroundY, 1.3);
    if (this.shimmer > 0) heatShimmer(ctx, this.t, this.shimmer);

    // what you can touch, marked only faintly
    for (const sp of this.spots) {
      const x = sp.x - cam;
      if (x < -20 || x > W + 20) continue;
      const a = 0.16 + 0.1 * Math.sin(this.t * 2.4 + sp.x);
      ctx.globalAlpha = a;
      ctx.fillStyle = '#fff6d0';
      ctx.fillRect(Math.round(x - 1), Math.round(sp.y - sp.h * 0.5), 2, 2);
      ctx.globalAlpha = 1;
    }

    // the afternoon closing in
    if (this.sleep > 0 && this.sleep < 1) {
      const k = ease.inOut(clamp(this.sleep, 0, 1));
      ctx.globalAlpha = k * 0.85;
      ctx.fillStyle = '#0a0a12';
      const lid = Math.round(H * 0.5 * k);
      ctx.fillRect(0, 0, W, lid);
      ctx.fillRect(0, H - lid, W, lid);
      ctx.globalAlpha = 1;
    }

    this.dlg.draw(ctx);
    if (this.hintT > 0 && this.hint && !this.dlg.busy) this.drawHint(ctx);
    if (this.fade > 0) {
      ctx.globalAlpha = this.fade;
      ctx.fillStyle = this.fadeCol;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }
  }

  /** A line of quiet help along the bottom, which fades on its own. */
  drawHint(ctx) {
    const a = clamp(this.hintT / 1.2, 0, 1);
    const w = textWidth(this.hint);
    const x = Math.round((W - w) / 2), y = H - 16;
    ctx.globalAlpha = a * 0.34;
    ctx.fillStyle = '#0a0c12';
    ctx.fillRect(x - 5, y - 3, w + 10, 14);
    ctx.globalAlpha = a * 0.85;
    drawText(ctx, this.hint, x, y, '#e8e2d0');
    ctx.globalAlpha = 1;
  }
}
