import pw from 'file:///opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
import { writeFileSync, mkdirSync } from 'fs';
mkdirSync('/tmp/claude-0/shots', { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
page.on('pageerror', (e) => console.log('ERR', e.message));
await page.goto('http://127.0.0.1:8123/index.html');
await page.waitForFunction(() => window.__game !== undefined);
await page.waitForTimeout(1500);
const data = await page.evaluate(async () => {
  const m = await import('./src/vista.js');
  const s = await import('./src/stage.js');
  return {
    vista: m.renderVista(0).toDataURL(),
    ground: s.renderGround(0).toDataURL(),
    fg: m.renderForeground(0).toDataURL(),
  };
});
for (const [k, v] of Object.entries(data)) {
  writeFileSync(`/tmp/claude-0/shots/layer-${k}.png`, Buffer.from(v.split(',')[1], 'base64'));
}
console.log('layers written');
await browser.close();
