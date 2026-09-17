/* Render the game headlessly and save screenshots of each beat. */
import pw from 'file:///opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
import { mkdirSync } from 'fs';

const OUT = process.env.OUT || '/tmp/claude-0/shots';
mkdirSync(OUT, { recursive: true });
const PORT = process.env.PORT || 8123;

const shots = process.argv.slice(2);
const plan = shots.length ? shots : ['intro', 'wake', 'care', 'grown', 'tree', 'pod', 'family'];

const browser = await chromium.launch({ args: ['--force-device-scale-factor=1'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message + '\n' + (e.stack || '')));

await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__game !== undefined, { timeout: 15000 });
await page.waitForTimeout(900);

for (const beat of plan) {
  if (beat !== 'intro') {
    await page.evaluate((b) => window.__game.skipTo(b), beat);
    await page.waitForTimeout(700);
    // let transitions settle
    await page.evaluate(() => { window.__game.G.eraBlend = 1; window.__game.G.flash = 0; window.__game.G.sweep = -1; });
    await page.waitForTimeout(500);
  } else {
    await page.waitForTimeout(600);
  }
  await page.screenshot({ path: `${OUT}/${beat}.png` });
  console.log('shot', beat);
}
if (errors.length) console.log('--- ERRORS ---\n' + errors.join('\n'));
else console.log('no console errors');
await browser.close();
