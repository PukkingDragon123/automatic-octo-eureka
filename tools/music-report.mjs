import { readFileSync, readdirSync } from 'fs';
const dir = '/tmp/claude-0/audio';
for (const f of readdirSync(dir).filter((x) => x.endsWith('.json'))) {
  const d = JSON.parse(readFileSync(`${dir}/${f}`));
  const hop = d.hopSec;
  const N = d.rms.length;
  const sm = (a, k) => a.map((_, i) => {
    let s = 0, n = 0;
    for (let j = Math.max(0, i - k); j <= Math.min(a.length - 1, i + k); j++) { s += a[j]; n++; }
    return s / n;
  });
  const rms = sm(d.rms, 3);
  const peak = Math.max(...rms);
  // --- tempo: autocorrelate the onset envelope over plausible lags
  const flux = sm(d.flux, 1);
  const mean = flux.reduce((a, b) => a + b, 0) / N;
  const fl = flux.map((v) => Math.max(0, v - mean));
  let best = { bpm: 0, score: 0 };
  for (let bpm = 60; bpm <= 180; bpm += 0.25) {
    const lag = 60 / bpm / hop;
    let s = 0, n = 0;
    for (let i = 0; i + lag < N; i++) {
      const a = fl[i], b = fl[Math.round(i + lag)];
      s += a * b; n++;
    }
    const sc = s / n;
    if (sc > best.score) best = { bpm, score: sc };
  }
  // --- where the music actually starts and stops
  const thr = peak * 0.08;
  let start = 0, end = N - 1;
  while (start < N && rms[start] < thr) start++;
  while (end > 0 && rms[end] < thr) end--;
  // --- section boundaries: biggest jumps in a smoothed loudness contour
  const coarse = sm(d.rms, 12);
  const nov = coarse.map((v, i) => (i > 0 ? Math.abs(v - coarse[i - 1]) : 0));
  const cand = nov.map((v, i) => ({ v, t: i * hop })).sort((a, b) => b.v - a.v);
  const picks = [];
  for (const c of cand) {
    if (c.t < 0.8 || c.t > d.duration - 0.8) continue;
    if (picks.some((p) => Math.abs(p - c.t) < 2.2)) continue;
    picks.push(c.t);
    if (picks.length >= 5) break;
  }
  picks.sort((a, b) => a - b);
  // --- loudest moment, and the quietest gap after the halfway point
  let loudT = 0, loudV = 0;
  for (let i = 0; i < N; i++) if (rms[i] > loudV) { loudV = rms[i]; loudT = i * hop; }
  let quietT = 0, quietV = 1e9;
  for (let i = Math.floor(N * 0.3); i < N * 0.95; i++) if (rms[i] < quietV) { quietV = rms[i]; quietT = i * hop; }
  // --- the first strong onset (the downbeat you can anchor to)
  const fthr = Math.max(...fl) * 0.45;
  let first = 0;
  for (let i = 0; i < N; i++) if (fl[i] > fthr) { first = i * hop; break; }

  console.log('\n' + d.name);
  console.log('  duration      ', d.duration.toFixed(2) + 's');
  console.log('  audible from  ', (start * hop).toFixed(2) + 's to ' + (end * hop).toFixed(2) + 's');
  console.log('  first onset   ', first.toFixed(2) + 's');
  console.log('  tempo (est)   ', best.bpm.toFixed(1) + ' bpm  -> beat ' + (60 / best.bpm).toFixed(3) + 's, bar ' + (240 / best.bpm).toFixed(2) + 's');
  console.log('  loudest at    ', loudT.toFixed(2) + 's');
  console.log('  quietest dip  ', quietT.toFixed(2) + 's');
  console.log('  section edges ', picks.map((p) => p.toFixed(2) + 's').join(', '));
  // a coarse loudness picture, one char per ~1.1s
  const cols = 28;
  let bar = '  shape         ';
  for (let c = 0; c < cols; c++) {
    const i = Math.floor((c / cols) * N);
    const v = rms[i] / peak;
    bar += ' .:-=+*#@'[Math.min(8, Math.floor(v * 9))];
  }
  console.log(bar + '   (0 -> ' + d.duration.toFixed(0) + 's)');
}
