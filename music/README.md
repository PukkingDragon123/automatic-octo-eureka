# Music

Drop the track here and the game will find it.

```
music/track.mp3        the song (mp3, ogg or wav — see below)
music/timeline.json    where things happen in it
```

The game loads both on the player's first touch (browsers will not start audio
before that). If either file is missing, nothing breaks: the game keeps its own
pacing and stays silent apart from its small procedural sounds.

## track

Any format the browser decodes. `track.mp3` is tried first, then `track.ogg`,
then `track.wav`. Nothing else needs changing.

## timeline.json

This is the part that has to match the real recording, so it is **not** filled
in with guesses. Once the track exists, its section boundaries get measured from
the audio itself and written here.

```jsonc
{
  "markers": {            // seconds into the track
    "opening": 0,         // the blossoms
    "reveal": 0,          // the valley appears
    "puppy": 0,           // he scrambles out
    "together": 0,        // the two of them, first time
    "apart": 0,           // the argument
    "reunion": 0,
    "lastday": 0,         // he lies down
    "burial": 0,
    "bloom": 0,           // the one flower opens
    "confess": 0          // the words begin
  },
  "chapters": {           // optional: hold each visit to a window of the song
    "firstvisit": { "from": 0, "to": 0 }
  }
}
```

Anything absent is simply not used — a chapter with no window runs on the
game's own clock, and a marker that is not there never gates anything.
