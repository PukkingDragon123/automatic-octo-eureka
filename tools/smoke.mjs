import pw from 'file:///opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
const errs = [];
page.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message + ' | ' + (e.stack || '').split('\n')[1]));
page.on('console', (m) => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
await page.goto('http://127.0.0.1:8123/index.html');
await page.waitForFunction(() => window.__game !== undefined, { timeout: 20000 });
await page.waitForTimeout(1500);
const n = await page.evaluate(() => window.__game.CHAPTERS.length);
console.log('chapters:', n);
await page.evaluate(() => { window.__game.speed = 14; });
for (let i = 0; i < n; i++) {
  await page.evaluate((k) => window.__game.chapter(k), i);
  await page.waitForTimeout(1400);
  const st = await page.evaluate(() => {
    const g = window.__game;
    return { id: g.director.chapter.id, t: +g.director.t.toFixed(0), era: g.G.era, tod: g.G.tod,
             dog: g.dog.alive ? g.dog.age : 'x', vis: ['A','B','C'].filter(k => g.people[k].visible).join('') };
  });
  console.log(String(i).padStart(2), st.id.padEnd(12), 't=' + String(st.t).padStart(3), 'era' + st.era, 'tod' + st.tod, 'dog:' + st.dog, st.vis);
}
await page.evaluate(() => { window.__game.speed = 1; });
// let the last chapter run into the ending
await page.evaluate(() => window.__game.endNow());
await page.waitForTimeout(3000);
const fps = await page.evaluate(() => new Promise((res) => {
  let k = 0; const t0 = performance.now();
  const tick = () => { k++; if (performance.now() - t0 < 2000) requestAnimationFrame(tick); else res(Math.round(k * 1000 / (performance.now() - t0))); };
  requestAnimationFrame(tick);
}));
console.log('ending fps', fps);
console.log(errs.length ? '--- ERRORS ---\n' + errs.slice(0, 12).join('\n') : 'no errors');
await browser.close();
