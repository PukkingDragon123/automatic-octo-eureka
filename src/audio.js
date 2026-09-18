/* ============================================================================
 *  audio.js — a handful of soft procedural sounds.  No files, no UI, and it
 *  only ever starts after the player's first touch.
 * ==========================================================================*/

let ctx = null;
let master = null;
let ambient = null;
let enabled = true;

function ensure() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) { enabled = false; return null; }
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.32;
  master.connect(ctx.destination);
  return ctx;
}

/** The shared audio context and output gain, so music can join the mix. */
export function context() { return ensure(); }
export function masterGain() { ensure(); return master; }

export function unlock() {
  const c = ensure();
  if (!c) return;
  if (c.state === 'suspended') c.resume();
  if (!ambient) startAmbient();
}

export function setVolume(v) {
  if (master) master.gain.value = v;
}

function noiseBuffer(sec = 2) {
  const n = Math.floor(ctx.sampleRate * sec);
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

function startAmbient() {
  if (!ctx) return;
  // a breath of wind: filtered noise with a slowly wandering cutoff
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(4);
  src.loop = true;
  const f = ctx.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = 420;
  f.Q.value = 0.6;
  const g = ctx.createGain();
  g.gain.value = 0.05;
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.07;
  const lfoG = ctx.createGain();
  lfoG.gain.value = 210;
  lfo.connect(lfoG).connect(f.frequency);
  const lfo2 = ctx.createOscillator();
  lfo2.frequency.value = 0.041;
  const lfo2G = ctx.createGain();
  lfo2G.gain.value = 0.022;
  lfo2.connect(lfo2G).connect(g.gain);
  src.connect(f).connect(g).connect(master);
  src.start(); lfo.start(); lfo2.start();
  ambient = { src, f, g };
}

function env(node, t0, a, d, peak = 1) {
  node.gain.setValueAtTime(0.0001, t0);
  node.gain.exponentialRampToValueAtTime(peak, t0 + a);
  node.gain.exponentialRampToValueAtTime(0.0001, t0 + a + d);
}

export function tone(freq, dur = 0.3, type = 'sine', vol = 0.25, detune = 0) {
  if (!enabled || !ensure()) return;
  const t0 = ctx.currentTime;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  o.detune.value = detune;
  env(g, t0, 0.012, dur, vol);
  o.connect(g).connect(master);
  o.start(t0);
  o.stop(t0 + dur + 0.1);
}

export function plip(pitch = 1) {
  if (!enabled || !ensure()) return;
  const t0 = ctx.currentTime;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(440 * pitch, t0);
  o.frequency.exponentialRampToValueAtTime(900 * pitch, t0 + 0.06);
  env(g, t0, 0.005, 0.1, 0.22);
  o.connect(g).connect(master);
  o.start(t0); o.stop(t0 + 0.2);
}

export function pop(pitch = 1) {
  if (!enabled || !ensure()) return;
  const t0 = ctx.currentTime;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'triangle';
  o.frequency.setValueAtTime(320 * pitch, t0);
  o.frequency.exponentialRampToValueAtTime(760 * pitch, t0 + 0.07);
  env(g, t0, 0.004, 0.13, 0.3);
  o.connect(g).connect(master);
  o.start(t0); o.stop(t0 + 0.24);
}

let pourNode = null;
export function pour(on) {
  if (!enabled || !ensure()) return;
  if (on && !pourNode) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(2);
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 1700;
    f.Q.value = 0.9;
    const g = ctx.createGain();
    g.gain.value = 0.0001;
    g.gain.exponentialRampToValueAtTime(0.1, ctx.currentTime + 0.12);
    src.connect(f).connect(g).connect(master);
    src.start();
    pourNode = { src, g };
  } else if (!on && pourNode) {
    const { src, g } = pourNode;
    pourNode = null;
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
    setTimeout(() => { try { src.stop(); } catch { /* already stopped */ } }, 320);
  }
}

export function chord(freqs, dur = 1.1, vol = 0.14, type = 'triangle') {
  freqs.forEach((f, i) => setTimeout(() => tone(f, dur, type, vol), i * 70));
}

export function sparkleUp() {
  chord([523.25, 659.25, 783.99, 1046.5], 0.8, 0.12);
}
export function bloom() {
  chord([392, 493.88, 587.33, 783.99, 987.77], 1.6, 0.1, 'sine');
}
export function thud() {
  if (!enabled || !ensure()) return;
  const t0 = ctx.currentTime;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(150, t0);
  o.frequency.exponentialRampToValueAtTime(48, t0 + 0.18);
  env(g, t0, 0.005, 0.24, 0.35);
  o.connect(g).connect(master);
  o.start(t0); o.stop(t0 + 0.4);
}
export function rustle() {
  if (!enabled || !ensure()) return;
  const t0 = ctx.currentTime;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(0.5);
  const f = ctx.createBiquadFilter();
  f.type = 'highpass';
  f.frequency.value = 900;
  const g = ctx.createGain();
  env(g, t0, 0.02, 0.28, 0.16);
  src.connect(f).connect(g).connect(master);
  src.start(t0); src.stop(t0 + 0.4);
}
