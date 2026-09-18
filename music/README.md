# Music

Two tracks were supplied and both are measured, not guessed. Everything the
game does with them comes out of `timeline.json`, which was written from the
audio itself.

```
music/opening.mp3   "Blue Hair (TikTok Meme)"      21.94s, 91.5 bpm
music/ending.mp3    "Here Comes The Sun V2"        30.09s, 85.5 bpm
music/timeline.json the measured marks
```

Both load on the player's first touch — browsers will not start audio before
that — and the first touch is the sweep through the blossoms, so the opening
cue begins exactly on it.

## How each one is used

**opening.mp3** is loud from its first frame (onset at 0.02s, loudest at 2.51s)
and runs out at 21.5s. That shape suits an active moment rather than a quiet
one, so it plays while you are pushing through the flowers and fades out over
2.2s the moment the valley is revealed. The long middle of the game then has no
soundtrack at all — just wind, birds and water — which is what the slow, cozy
stretch wants.

**ending.mp3** is the emotional one and drives the whole confession. Measured:
near silence until 1.04s, a long held quiet through to a section edge at 19.20s,
then a swell — first strong onset at 24.01s, loudest point at 24.81s — releasing
at 26.42s and tailing out by 29.7s. The ending is cut to that:

| track time | measured as | what happens |
| --- | --- | --- |
| 0.00 | start | the blossoms sweep back in over the screen |
| 5.87 | section edge | they have settled; the screen is full |
| 6.66 | bar 3 | *Hey, I made this game for you.* |
| 12.28 | bar 5 | *It's pretty fun, right?* |
| 19.20 | section edge | the swell begins — nothing is said through it |
| 20.71 | bar 8 | *Ummmm…* |
| 23.30 | fade completes at 24.80 | *I also have something I want to confess…* |
| 24.81 | loudest point | the line is fully up |
| 26.42 | section edge | **YES / NO** |

If no track is present the same sequence runs on the game's own clock, a little
tighter.

## Swapping them

They are only named `opening.mp3` and `ending.mp3` — if the two should be the
other way round, swap the files (and the `bpm`/`duration`/marker block in
`timeline.json`, or re-measure with the tools below).

## Re-measuring

```
node tools/analyse-music.mjs music/opening.mp3 music/ending.mp3
node tools/music-report.mjs
```

The first decodes each file in a real browser and writes its loudness, onset
and spectral envelopes; the second reports duration, tempo, the audible range,
the loudest and quietest points, and the section boundaries. Put those numbers
into `timeline.json`. Any marker left out is simply not used.
