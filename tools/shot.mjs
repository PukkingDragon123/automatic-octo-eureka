import pw from 'file:///opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
import { mkdirSync } from 'fs';
const OUT = process.env.OUT || '/tmp/claude-0/shots';
mkdirSync(OUT, { recursive: true });
const args = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
const errs = [];
page.on('console', (m) => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
page.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message + '\n' + (e.stack || '').split('\n').slice(0,5).join('\n')));
await page.goto('http://127.0.0.1:8123/index.html', { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__game !== undefined, { timeout: 20000 });
await page.waitForTimeout(1500);
for (const a of args) {
  const [name, cmd, arg] = a.split(':');
  if (cmd === 'chapter') { await page.evaluate((n) => window.__game.chapter(+n), arg); await page.waitForTimeout(600); }
  if (cmd === 'time') {
    await page.evaluate(() => { window.__game.speed = 12; });
    const target = +arg;
    for (let i = 0; i < 200; i++) {
      const t = await page.evaluate(() => window.__game.director.t);
      if (t >= target) break;
      await page.waitForTimeout(120);
    }
    await page.evaluate(() => { window.__game.speed = 1; });
    await page.waitForTimeout(500);
  }
  if (cmd === 'cam') { await page.evaluate((n) => window.__game.cam.snap(+n), arg); await page.waitForTimeout(400); }
  if (cmd === 'skip') { await page.evaluate(() => window.__game.skipOpening()); await page.waitForTimeout(900); }
  if (cmd === 'end') { await page.evaluate(() => window.__game.endNow()); await page.waitForTimeout(+(arg||8)*1000); }
  await page.evaluate(() => { window.__game.G.fade = 0; });
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log('shot', name);
}
console.log(errs.length ? '--- ERRORS ---\n' + errs.join('\n') : 'no console errors');
await browser.close();
