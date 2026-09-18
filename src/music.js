/* ============================================================================
 *  music.js — plays the supplied tracks, and hands scenes the real marks in
 *  them.
 *
 *  Nothing here is guessed.  Every cue time comes out of music/timeline.json,
 *  which is written from measurements of the actual audio (see
 *  tools/analyse-music.mjs).  If a track or its timeline is missing, every
 *  lookup returns null and the game falls back to its own pacing.
 * ==========================================================================*/

let audioCtx = null;
let out = null;

export const Music = {
  timeline: null,
  tracks: {},          // name -> { buffer, src, gain, startedAt, offset, playing }
  loaded: false,

  /** Share the game's audio context so one gesture unlocks everything. */
  attach(ctx, masterGain) {
    audioCtx = ctx;
    out = masterGain;
  },

  async load(dir = 'music') {
    if (this.loaded) return this.loaded;
    this.timeline = await fetch(`${dir}/timeline.json`)
      .then((r) => (r.ok ? r.json() : null)).catch(() => null);
    if (!audioCtx) return false;
    let any = false;
    for (const name of ['opening', 'ending']) {
      const spec = this.timeline && this.timeline[name];
      const file = (spec && spec.file) || `${name}.mp3`;
      const buf = await fetch(`${dir}/${file}`)
        .then((r) => (r.ok ? r.arrayBuffer() : null)).catch(() => null);
      if (!buf || buf.byteLength < 1024) continue;
      try {
        this.tracks[name] = { buffer: await audioCtx.decodeAudioData(buf), playing: false };
        any = true;
      } catch { /* a file the browser will not decode is simply skipped */ }
    }
    this.loaded = any;
    return any;
  },

  play(name, { at = 0, fadeIn = 0.8, volume = 0.75, loop = false } = {}) {
    const tr = this.tracks[name];
    if (!tr || !audioCtx) return false;
    this.stop(name);
    const src = audioCtx.createBufferSource();
    src.buffer = tr.buffer;
    src.loop = loop;
    const g = audioCtx.createGain();
    g.gain.value = 0.0001;
    g.gain.exponentialRampToValueAtTime(volume, audioCtx.currentTime + Math.max(0.05, fadeIn));
    src.connect(g).connect(out || audioCtx.destination);
    src.start(0, at);
    tr.src = src; tr.gain = g; tr.startedAt = audioCtx.currentTime; tr.offset = at; tr.playing = true;
    return true;
  },

  stop(name, fade = 0) {
    const tr = this.tracks[name];
    if (!tr || !tr.src) return;
    const { src, gain } = tr;
    tr.src = null; tr.playing = false;
    if (fade > 0 && gain && audioCtx) {
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + fade);
      setTimeout(() => { try { src.stop(); } catch { /* already stopped */ } }, fade * 1000 + 150);
    } else {
      try { src.stop(); } catch { /* already stopped */ }
    }
  },

  /** Seconds into a track, or null when it is not playing. */
  time(name) {
    const tr = this.tracks[name];
    if (!tr || !tr.playing || !audioCtx) return null;
    const t = tr.offset + (audioCtx.currentTime - tr.startedAt);
    if (!tr.src || (!tr.src.loop && t > tr.buffer.duration)) return null;
    return t;
  },
  has(name) { return !!this.tracks[name]; }, 

  /** A measured mark, in seconds, or null when there is no timeline for it. */
  mark(track, name) {
    const t = this.timeline && this.timeline[track] && this.timeline[track].markers;
    const v = t && t[name];
    return typeof v === 'number' ? v : null;
  },
  spec(track) { return (this.timeline && this.timeline[track]) || null; },
};
