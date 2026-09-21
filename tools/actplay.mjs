/* Drive the school act from beginning to end, answering everything. */
import pw from 'file:///opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errs = [];
page.on('pageerror', (e) => errs.push('ERR ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')));
page.on('console', (m) => { if (m.type() === 'error') errs.push('CON ' + m.text()); });
await page.goto('http://127.0.0.1:8123/index.html', { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__game !== undefined);
await page.waitForTimeout(900);
await page.evaluate(() => { window.__game.speed = 6; window.__game.skipOpening(); });
await page.waitForTimeout(700);
const shots = process.argv.includes('--shots');
let last = '';
for (let i = 0; i < 700; i++) {
  const st = await page.evaluate(() => {
    const a = window.__game.act;
    if (!a || a.done) return { done: true };
    const d = a.dlg;
    if (a.mini) {
      const m = a.mini;
      if (m.qs) { m.picked = m.q.a; m.score++; m.flash = 0; m.next(); }
      else if (m.cards) { m.cards.forEach((c) => { c.gone = true; c.flip = 1; }); }
      else if (m.shop) { m.item = m.shop.menu[0]; m.phase = 'cook'; m.k = 1.1; }
      else if (m.pips) { m.held = 999; }
      return { scene: a.scene, i: a.i, n: a.steps.length, pov: a.pov, mini: true };
    }
    // answer, advance, or unstick
    if (d.cur && d.cur.choices && d.cur.done) {
      const pl = d.cur.place();
      const top = pl.y + 4 + d.cur.lines.length * 10 + 3;
      a.tap(pl.x + 10, top + 2);
    } else if (d.cur) {
      d.cur.skip();
      d.advance();
    } else {
      const s = a.step;
      if (s && s.t === 'until') {
        a.player.x = a.S.walk[1] - 6;
        a.lunch = a.lunch || 'kaprao';
        a.sleep = 1;
        for (const f of ['fon', 'gap', 'dogpet', 'mound', 'shrine', 'met_beam']) a.flags.add(f);
      }
    }
    return { scene: a.scene, i: a.i, n: a.steps.length, pov: a.pov, done: a.done };
  });
  if (st.done) { console.log('act finished at step', st.i); break; }
  const tag = `${st.scene} ${st.i}/${st.n} pov:${st.pov}`;
  if (tag !== last) { console.log(tag); last = tag; }
  if (shots && i % 40 === 0) {
    await page.evaluate(() => { window.__game.act.fade = 0; });
    await page.screenshot({ path: `/tmp/claude-0/shots/ap_${String(i).padStart(3, '0')}.png` });
  }
  await page.waitForTimeout(90);
}
const after = await page.evaluate(() => ({ phase: window.__game.G.phase, done: window.__game.act.done }));
console.log('after:', JSON.stringify(after));
console.log(errs.length ? '--- ERRORS ---\n' + errs.slice(0, 8).join('\n') : 'no errors');
await browser.close();
