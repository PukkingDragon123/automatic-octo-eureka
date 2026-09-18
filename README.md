# Butterfly Pea

A slow, quiet pixel-art game that runs in a browser tab. No menus, no buttons,
no quest log — you drag the hill to look around, and you touch what is there.

    A screenful of butterfly pea flowers. Push through them.
    Underneath is a hilltop above a valley town, and a scrape of bare earth
    with two small leaves in it. Poke it, and a puppy scrambles out.

Then about twenty-five years go by.

## What happens

A student starts coming up here after school to study and to feed him. Another
student starts coming too. Nothing is ever narrated: you watch them sit a
little closer each visit, then hold hands at a festival, then stand apart with
their arms crossed, then come separately for a season, then meet again on the
path. They graduate. They come back less often. They come back as adults, and
later with a child.

The dog grows from a puppy to an old dog across the whole of it, slowing down,
going grey around the muzzle, sleeping more in the sun. One afternoon he lies
down in the long grass by the rocks and doesn't get up. They bury him at the
quiet end of the ridge and plant something over him, and it grows for years,
and eventually it opens one flower.

Then the blossoms close back over the screen, and somebody says the thing they
came here to say.

## Playing it

* **Drag the background** to pan along the ridge.
* **Push through the flowers** at the start — sweep the pointer across them.
* **Tap the dog** to pet him; do it while he's already delighted and he'll bolt
  off in a happy circle.
* **Tap his bowl** to put food in it, and he'll come.
* **Pick up the watering can**, dip it in the pond, and hold it over the
  flowerbed. The stalks lift while the water is falling, and every few blooms
  chime as they open. Later there is a sapling that wants the same.
* **Tap the fallen log or the lookout wall** to sit a while; the afternoon moves
  a little faster while you do.
* **Tap the pond**, the grass, the signpost, the rocks — there's a frog in
  there somewhere, and butterflies come up out of the grass.

You can also just watch. A visit ends when it ends.

## Running it

A static site, no build step, no dependencies:

    npm start                       # or: python3 -m http.server 8123
    open http://localhost:8123/

It must be *served* rather than opened from disk, because the code is ES
modules. Deploy by copying the repository to any static host.

## Music

Two tracks, both measured rather than guessed. `music/opening.mp3` is loud from
its first frame, so it plays while you push through the blossoms and fades out
when the valley appears; the long quiet middle of the game has no soundtrack at
all. `music/ending.mp3` runs the whole confession: it is nearly silent until
19.2s, swells to its loudest at 24.81s and releases at 26.42s, and every line of
the ending is cut to those marks. `music/README.md` has the full table and the
two commands that re-measure a track if you swap one in.

## How it is built

Everything is generated in code — no image assets anywhere. The game renders
into a 480×300 buffer and scales it up with nearest-neighbour filtering, so the
pixel grid stays hard at any window size. The hill itself is 1200px wide and
the valley behind it parallaxes at a third of the speed.

    src/core.js      seeded noise, colour maths, crisp pixel primitives, and
                     the span system that gives sprites their ink outlines
    src/world.js     how wide the hill is, what is where on it, the camera,
                     and the registry of things you can touch
    src/vista.js     the valley town: one deterministic model of ridgelines,
                     ranks of buildings, temples and paddies, re-rendered per
                     season; the sky is baked separately per hour, so any hour
                     can sit over any season, and the town's lit windows are
                     their own layer for after dark
    src/stage.js     the turf you stand on and everything standing on it —
                     pond, old tree, fallen log, lookout, flowerbed, bowl,
                     rocks, the stone at the end, and the watering can
    src/dog.js       a very small dog on a posed skeleton, through five ages
    src/human.js     two tall students on a joint skeleton: walking, sitting
                     cross-legged over a book, crouching, holding an umbrella,
                     holding hands, turning away — with wardrobes that change
                     over the years
    src/chapters.js  twenty-five visits, and the director that plays them
    src/blossom.js   the butterfly pea field that opens and closes the game
    src/ending.js    the last minute
    src/fx.js        petals, rain, droplets, hearts, dirt, birds, butterflies,
                     fireflies, god rays, valley mist
    src/music.js     plays a supplied track and locks scenes to marks in it
    src/audio.js     a few small procedural sounds; nothing is loaded

## Development

    node tools/smoke.mjs                  # step through all 25 chapters
    node tools/playthrough.mjs            # drive the opening with real input
    node tools/shot.mjs "a:chapter:8" "b:time:60"
    node tools/sprshot.mjs                # the sprite sheet
    node tools/analyse-music.mjs music/ending.mp3 && node tools/music-report.mjs

`window.__game` exposes `chapter(n)`, `setChapterTime(t)`, `endNow()`,
`skipOpening()` and `speed` for working on a scene without waiting for it.
