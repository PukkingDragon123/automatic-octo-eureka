/* Play the climb onto the hill, from the end of the school act to the dog. */
import pw from 'file:///opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
const errs = [];
p.on('pageerror', (e) => errs.push('ERR ' + e.message + ' ' + (e.stack || '').split('\n')[1]));
await p.goto('http://127.0.0.1:8123/index.html', { waitUntil: 'networkidle' });
await p.waitForFunction(() => window.__game !== undefined);
await p.waitForTimeout(900);
await p.evaluate(() => { window.__game.skipOpening(); });
await p.waitForTimeout(500);
await p.evaluate(() => { const a = window.__game.act; a.dlg.clear(); a.finish(); });
await p.waitForTimeout(400);
const shots = process.argv.includes('--shots');
let lastI = -1, n = 0;
for (let k = 0; k < 900; k++) {
  const st = await p.evaluate(() => {
    const g = window.__game, c = g.climb, d = g.climbDlg;
    if (g.G.phase !== 'climb') return { phase: g.G.phase };
    if (d.cur && d.cur.choices && d.cur.done) { d.onChoice(d.cur.choices[0].value); d.cur = null; }
    else if (d.cur) { d.cur.skip(); d.advance(); }
    else if (c.step && c.step.t === 'until') {
      const A = g.people.A;
      A.x = Math.min(1180, A.x + 40); A.target = null;
      if (A.x > 100) c.flags.add('shrine');
      if (A.x > 420) c.flags.add('mound');
    }
    return { phase: g.G.phase, i: c.i, x: Math.round(g.people.A.x) };
  });
  if (st.phase !== 'climb') { console.log('left climb ->', st.phase); break; }
  if (st.i !== lastI) {
    lastI = st.i;
    if (shots && [2, 6, 12, 20, 27, 33].includes(st.i)) {
      await p.evaluate(() => { window.__game.G.fade = 0; });
      await p.waitForTimeout(700);
      await p.screenshot({ path: `/tmp/claude-0/shots/climb_${String(n++).padStart(2, '0')}.png` });
    }
  }
  await p.waitForTimeout(60);
}
await p.waitForTimeout(1500);
await p.evaluate(() => { window.__game.G.fade = 0; });
if (shots) await p.screenshot({ path: `/tmp/claude-0/shots/climb_sprout.png` });
// poke the sprout
const r = await p.evaluate(() => {
  const g = window.__game; const x = g.G.sproutX;
  return g.toScreen(x - g.cam.x, 232);
});
await p.mouse.click(r.x, r.y);
await p.waitForTimeout(1500);
const fin = await p.evaluate(() => ({ phase: window.__game.G.phase, dog: window.__game.dog.alive }));
console.log('after poke', JSON.stringify(fin));
if (shots) { await p.evaluate(() => { window.__game.G.fade = 0; }); await p.screenshot({ path: `/tmp/claude-0/shots/climb_dog.png` }); }
console.log(errs.length ? errs.slice(0, 6).join('\n') : 'no errors');
await b.close();
