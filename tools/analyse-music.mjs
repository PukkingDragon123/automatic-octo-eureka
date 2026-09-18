/* Decode the uploaded tracks in a real browser and measure them.
   Nothing here guesses: every number comes out of the audio. */
import pw from 'file:///opt/node22/lib/node_modules/playwright/index.js';
const { chromium } = pw;
import { writeFileSync } from 'fs';

const files = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage();
page.on('pageerror', (e) => console.log('ERR', e.message));
await page.goto('http://127.0.0.1:8123/index.html');
await page.waitForTimeout(400);

for (const f of files) {
  const data = await page.evaluate(async (name) => {
    const buf = await fetch('/' + name).then((r) => r.arrayBuffer());
    const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    const probe = new OAC(1, 1024, 44100);
    const audio = await probe.decodeAudioData(buf.slice(0));
    const sr = audio.sampleRate;
    const n = audio.length;
    const ch = audio.numberOfChannels;
    const mono = new Float32Array(n);
    for (let c = 0; c < ch; c++) {
      const d = audio.getChannelData(c);
      for (let i = 0; i < n; i++) mono[i] += d[i] / ch;
    }
    // 46ms frames, 50% hop
    const win = Math.round(sr * 0.046);
    const hop = Math.round(win / 2);
    const frames = Math.floor((n - win) / hop);
    const rms = new Float32Array(frames);
    const zcr = new Float32Array(frames);
    const cent = new Float32Array(frames);
    const flux = new Float32Array(frames);
    // cheap spectral proxy: 8 band-limited energies via simple filtering
    const bands = 8;
    let prevBand = new Float32Array(bands);
    for (let f2 = 0; f2 < frames; f2++) {
      const off = f2 * hop;
      let s = 0, z = 0, w = 0, wsum = 0;
      const band = new Float32Array(bands);
      for (let i = 0; i < win; i++) {
        const v = mono[off + i];
        s += v * v;
        if (i > 0 && (v >= 0) !== (mono[off + i - 1] >= 0)) z++;
        // crude octave split by difference order
        const d1 = i > 0 ? v - mono[off + i - 1] : 0;
        const b = Math.min(bands - 1, Math.floor(Math.abs(d1) * 40 * bands));
        band[b] += v * v;
        w += Math.abs(d1);
        wsum += Math.abs(v) + 1e-9;
      }
      rms[f2] = Math.sqrt(s / win);
      zcr[f2] = z / win;
      cent[f2] = w / wsum;
      let fl = 0;
      for (let b = 0; b < bands; b++) {
        const d = Math.sqrt(band[b] / win) - prevBand[b];
        if (d > 0) fl += d;
        prevBand[b] = Math.sqrt(band[b] / win);
      }
      flux[f2] = fl;
    }
    return {
      name, sr, duration: n / sr, hopSec: hop / sr,
      rms: Array.from(rms, (v) => +v.toFixed(5)),
      zcr: Array.from(zcr, (v) => +v.toFixed(5)),
      flux: Array.from(flux, (v) => +v.toFixed(5)),
      cent: Array.from(cent, (v) => +v.toFixed(5)),
    };
  }, f);
  writeFileSync(`/tmp/claude-0/audio/${f.replace(/\W+/g, '_')}.json`, JSON.stringify(data));
  console.log(f, 'sr', data.sr, 'duration', data.duration.toFixed(2) + 's', 'frames', data.rms.length);
}
await browser.close();
