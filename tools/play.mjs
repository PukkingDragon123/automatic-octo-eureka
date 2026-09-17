/* A full scripted play-through, driven with real pointer events. */
import pw from 'file:///opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const SHOT = '/tmp/claude-0/shots';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
const errs = [];
page.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')));
page.on('console', (m) => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
await page.goto('http://127.0.0.1:8123/index.html');
await page.waitForFunction(() => window.__game !== undefined);
await page.waitForTimeout(1200);

const S = (bx, by) => page.evaluate(([x, y]) => window.__game.toScreen(x, y), [bx, by]);
const state = () => page.evaluate(() => {
  const g = window.__game;
  return { phase: g.G.phase, era: g.G.era, stage: g.dog.stage, water: +g.dog.water.toFixed(2),
           fill: +g.can.fill.toFixed(2), carried: g.can.carried, tree: +g.G.treeGrowth.toFixed(2),
           pods: g.G.pods.map((p) => +p.ripe.toFixed(2)), pups: g.G.pups.length,
           mound: +g.G.mound.toFixed(2), buried: +g.dog.buried.toFixed(2) };
});
const log = async (tag) => console.log(tag.padEnd(22), JSON.stringify(await state()));

async function swipe(x0, y0, x1, y1, steps = 14) {
  const a = await S(x0, y0), b = await S(x1, y1);
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  for (let i = 1; i <= steps; i++) {
    await page.mouse.move(a.x + ((b.x - a.x) * i) / steps, a.y + ((b.y - a.y) * i) / steps);
    await page.waitForTimeout(12);
  }
  await page.mouse.up();
}
async function tap(bx, by) {
  const p = await S(bx, by);
  await page.mouse.move(p.x, p.y);
  await page.mouse.down();
  await page.waitForTimeout(40);
  await page.mouse.up();
}
/** pick up the can and hold it over a target for `ms` */
async function carryTo(bx, by, ms) {
  const c = await page.evaluate(() => ({ x: window.__game.can.x, y: window.__game.can.y }));
  const from = await S(c.x, c.y - 12);
  const to = await S(bx, by);
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.waitForTimeout(60);
  for (let i = 1; i <= 16; i++) {
    await page.mouse.move(from.x + ((to.x - from.x) * i) / 16, from.y + ((to.y - from.y) * i) / 16);
    await page.waitForTimeout(16);
  }
  await page.waitForTimeout(ms);
  await page.mouse.up();
  await page.waitForTimeout(120);
}

/* 1. swipe the blossom away */
for (let i = 0; i < 7; i++) {
  await swipe(120, 150, 400, 210);
  await page.waitForTimeout(160);
}
await page.waitForTimeout(1800);
await log('after swipes');
await page.screenshot({ path: `${SHOT}/play-1-wake.png` });

/* 2. poke him awake */
for (let i = 0; i < 4; i++) {
  const d = await page.evaluate(() => ({ x: window.__game.dog.x, y: window.__game.dog.y, s: window.__game.dog.size }));
  await tap(d.x, d.y - d.s * 0.35);
  await page.waitForTimeout(420);
}
await log('after pokes');
await page.screenshot({ path: `${SHOT}/play-2-awake.png` });

/* 3. four full cans, four seasons */
for (let round = 0; round < 4; round++) {
  await carryTo(166, 262, 2600);                     // dip in the pond
  const d = await page.evaluate(() => ({ x: window.__game.dog.x, y: window.__game.dog.y }));
  await carryTo(d.x + 18, d.y - 34, 5200);           // tip it over him
  await log(`round ${round + 1}`);
  await page.screenshot({ path: `${SHOT}/play-3-grow${round + 1}.png` });
}

/* 4. he goes to ground */
await page.waitForTimeout(12000);
await log('after digging');
await page.screenshot({ path: `${SHOT}/play-4-dig.png` });

/* 5. water the sprout until it is a tree */
for (let i = 0; i < 4; i++) {
  const st = await state();
  if (st.phase !== 'tree') { await page.waitForTimeout(3000); }
  await carryTo(166, 262, 2400);
  await carryTo(358, 236, 5200);
  await log(`tree ${i + 1}`);
  if ((await state()).phase === 'pod') break;
}
await page.screenshot({ path: `${SHOT}/play-5-tree.png` });

/* 6. ripen the pod */
for (let i = 0; i < 4; i++) {
  const pod = await page.evaluate(() => {
    const g = window.__game;
    const p = g.G.pods[0];
    return p ? { x: 358 + p.wx, y: 281 + p.wy } : null;
  });
  if (!pod) break;
  await carryTo(166, 262, 2400);
  await carryTo(pod.x, pod.y - 20, 5200);
  await log(`pod ${i + 1}`);
}
await page.waitForTimeout(2500);
await log('final');
await page.screenshot({ path: `${SHOT}/play-6-family.png` });

console.log(errs.length ? '--- ERRORS ---\n' + errs.join('\n') : 'no console errors');
await browser.close();
