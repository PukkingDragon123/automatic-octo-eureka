/* ============================================================================
 *  music.js — plays the track, and lets scenes wait on real marks in it.
 *
 *  No timing is guessed here.  Until a track and its timeline are supplied the
 *  game runs on its own clock and every marker lookup returns null, which the
 *  director treats as "no cue, use your own pacing".  Drop a file in
 *  music/track.(mp3|ogg|wav) and a matching music/timeline.json and the same
 *  scenes will lock to it instead.
 * ==========================================================================*/

let audioCtx = null;
let gain = null;

export const Music = {
  buffer: null,
  source: null,
  startedAt: 0,
  offset: 0,
  playing: false,
  timeline: null,      // { markers: {name: seconds}, sections: [{name,at,until}] }
  ready: false,
  failed: false,

  /** Share the game's audio context so one gesture unlocks everything. */
  attach(ctx, masterGain) {
    audioCtx = ctx;
    gain = masterGain;
  },

  async load(trackUrl, timelineUrl) {
    try {
      const [tl, buf] = await Promise.all([
        timelineUrl ? fetch(timelineUrl).then((r) => (r.ok ? r.json() : null)).catch(() => null) : null,
        fetch(trackUrl).then((r) => (r.ok ? r.arrayBuffer() : null)).catch(() => null),
      ]);
      this.timeline = tl;
      if (!buf || !audioCtx) { this.failed = true; return false; }
      this.buffer = await audioCtx.decodeAudioData(buf);
      this.ready = true;
      return true;
    } catch {
      this.failed = true;
      return false;
    }
  },

  play(at = 0) {
    if (!this.ready || !audioCtx) return;
    this.stop();
    const src = audioCtx.createBufferSource();
    src.buffer = this.buffer;
    const g = audioCtx.createGain();
    g.gain.value = 0.0001;
    g.gain.exponentialRampToValueAtTime(0.8, audioCtx.currentTime + 2.5);
    src.connect(g).connect(gain || audioCtx.destination);
    src.start(0, at);
    this.source = src;
    this.gainNode = g;
    this.startedAt = audioCtx.currentTime;
    this.offset = at;
    this.playing = true;
  },
  stop(fade = 0) {
    if (!this.source) return;
    const src = this.source, g = this.gainNode;
    this.source = null;
    this.playing = false;
    if (fade > 0 && g && audioCtx) {
      g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + fade);
      setTimeout(() => { try { src.stop(); } catch { /* already gone */ } }, fade * 1000 + 120);
    } else {
      try { src.stop(); } catch { /* already gone */ }
    }
  },
  /** Seconds into the track, or null when nothing is playing. */
  get time() {
    if (!this.playing || !audioCtx) return null;
    return this.offset + (audioCtx.currentTime - this.startedAt);
  },
  /** Seconds at a named mark, or null when the timeline has not been supplied. */
  at(name) {
    if (!this.timeline || !this.timeline.markers) return null;
    const v = this.timeline.markers[name];
    return typeof v === 'number' ? v : null;
  },
  /** True once the track has passed a named mark. Null timeline = never gates. */
  passed(name) {
    const t = this.at(name);
    if (t === null) return null;
    const now = this.time;
    return now === null ? null : now >= t;
  },
  /** How long a chapter should run, if the timeline says so. */
  chapterWindow(id) {
    if (!this.timeline || !this.timeline.chapters) return null;
    const c = this.timeline.chapters[id];
    return c && typeof c.from === 'number' && typeof c.to === 'number' ? c : null;
  },
};
