import pw from 'file:///opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
const errs = [];
page.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message + ' | ' + (e.stack || '').split('\n')[1]));
page.on('console', (m) => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
await page.goto('http://127.0.0.1:8123/index.html');
await page.waitForFunction(() => window.__game !== undefined);
await page.waitForTimeout(1500);
const S = (bx, by) => page.evaluate(([x, y]) => window.__game.toScreen(x, y), [bx, by]);
const st = () => page.evaluate(() => {
  const g = window.__game;
  return { phase: g.G.phase, cleared: +g.opening.progress.toFixed(2), chapter: g.director.chapter.id,
           dog: g.dog.alive ? g.dog.age : 'x', cam: Math.round(g.cam.x) };
});

// sweep the blossoms away
for (let pass = 0; pass < 16; pass++) {
  const y = 40 + (pass % 8) * 34;
  const a = await S(20, y), b = await S(460, y + 20);
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  for (let i = 1; i <= 12; i++) {
    await page.mouse.move(a.x + (b.x - a.x) * i / 12, a.y + (b.y - a.y) * i / 12);
    await page.waitForTimeout(10);
  }
  await page.mouse.up();
  const s = await st();
  if (s.phase !== 'opening') break;
}
// the school act comes next; this test is about the hill, so jump past it
await page.waitForTimeout(600);
await page.evaluate(() => window.__game.skipAct());
console.log('after sweeping ', JSON.stringify(await st()));
await page.screenshot({ path: '/tmp/claude-0/shots/flow1.png' });
await page.waitForTimeout(4200);
console.log('after reveal   ', JSON.stringify(await st()));
await page.screenshot({ path: '/tmp/claude-0/shots/flow2.png' });

// find the sprout and poke it
const sp = await page.evaluate(() => window.__game.G.sproutX);
const p = await S(sp - (await page.evaluate(() => window.__game.cam.x)), 232);
await page.mouse.move(p.x, p.y); await page.mouse.down(); await page.waitForTimeout(60); await page.mouse.up();
await page.waitForTimeout(1600);
console.log('after poking   ', JSON.stringify(await st()));
await page.screenshot({ path: '/tmp/claude-0/shots/flow3.png' });
await page.waitForTimeout(4000);
console.log('story begins   ', JSON.stringify(await st()));

// pet the dog, drag the camera, pick up the can
await page.evaluate(() => { window.__game.speed = 8; });
await page.waitForTimeout(6000);
await page.evaluate(() => { window.__game.speed = 1; });
const d = await page.evaluate(() => ({ x: window.__game.dog.x - window.__game.cam.x, y: window.__game.dog.y }));
const dp = await S(d.x, d.y - 8);
await page.mouse.move(dp.x, dp.y); await page.mouse.down(); await page.waitForTimeout(60); await page.mouse.up();
await page.waitForTimeout(600);
console.log('after petting  ', JSON.stringify(await st()));
await page.screenshot({ path: '/tmp/claude-0/shots/flow4.png' });

// drag the world to look around
const c1 = await S(360, 150), c2 = await S(120, 150);
await page.mouse.move(c1.x, c1.y); await page.mouse.down();
for (let i = 1; i <= 16; i++) { await page.mouse.move(c1.x + (c2.x - c1.x) * i / 16, c1.y); await page.waitForTimeout(14); }
await page.mouse.up();
await page.waitForTimeout(1200);
console.log('after panning  ', JSON.stringify(await st()));
await page.screenshot({ path: '/tmp/claude-0/shots/flow5.png' });

// let a chapter finish naturally
await page.evaluate(() => { window.__game.speed = 14; });
await page.waitForTimeout(12000);
await page.evaluate(() => { window.__game.speed = 1; });
console.log('later          ', JSON.stringify(await st()));
await page.screenshot({ path: '/tmp/claude-0/shots/flow6.png' });
console.log(errs.length ? '--- ERRORS ---\n' + errs.slice(0, 8).join('\n') : 'no errors');
await browser.close();
