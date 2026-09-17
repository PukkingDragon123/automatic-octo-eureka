import pw from 'file:///opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const [x, y, w, h, name, beat] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.log('ERR', e.message));
await page.goto('http://127.0.0.1:8123/index.html');
await page.waitForFunction(() => window.__game !== undefined);
await page.waitForTimeout(1200);
if (beat && beat !== 'none') { await page.evaluate((b) => window.__game.skipTo(b), beat); await page.waitForTimeout(1400); }
await page.evaluate(() => { window.__game.G.eraBlend = 1; window.__game.G.flash = 0; window.__game.G.sweep = -1; });
await page.waitForTimeout(300);
await page.screenshot({ path: `/tmp/claude-0/shots/${name}.png`, clip: { x: +x, y: +y, width: +w, height: +h } });
console.log('cropped', name);
await browser.close();
