import pw from 'file:///opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 960, height: 600 }, deviceScaleFactor: 1 });
const errs = [];
page.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
await page.goto('http://127.0.0.1:8123/index.html');
await page.waitForFunction(() => window.__game !== undefined);
await page.waitForTimeout(1500);
for (const era of [0,1,2,3,4,5]) {
  await page.evaluate((e) => {
    const g = window.__game;
    g.skipTo('care');
    g.setStage(Math.min(4, e));
    g.setEra(e);
    g.G.eraBlend = 1; g.G.eraFrom = e; g.G.flash = 0; g.G.sweep = -1;
    if (e === 5) { g.skipTo('pod'); g.G.eraBlend = 1; g.G.eraFrom = 5; g.G.flash = 0; g.G.sweep = -1; }
  }, era);
  await page.waitForTimeout(900);
  await page.evaluate(() => { const g = window.__game; g.G.eraBlend = 1; g.G.flash = 0; g.G.sweep = -1; });
  await page.waitForTimeout(250);
  await page.screenshot({ path: `/tmp/claude-0/shots/era-${era}.png` });
}
console.log(errs.length ? errs.join('\n') : 'no errors');
await browser.close();
