# Butterfly Pea

A 2-D pixel-art game that runs in a browser tab. No menus, no buttons, no HUD —
everything you can do, you do by touching something that exists in the world.

    A butterfly pea blossom fills the screen.  Swipe it away.
    Below is a grassy hilltop above a valley town, and a small green pea dog,
    asleep.  Poke him until he wakes.  Then look after him.

## The arc

| Beat | What happens |
| --- | --- |
| **Blossom** | A butterfly pea flower covers the whole screen. Swipe; petals tear loose, tumble away and dissolve into pixels. |
| **Waking** | The hilltop from the reference photograph — layered mountains, a dense valley town, golden chedis, rice terraces. The pea dog sleeps in the grass. Poke him three times. |
| **Caring** | A watering can, a little pond and a patch of tilled soil. Carry the can into the pond to fill it, hold it over him to pour. He grows. |
| **Seasons** | Every time he grows, the valley turns with him: lush green → the trees die back → cherry blossom → whole hillsides of butterfly pea. |
| **Going to ground** | Full grown, he walks to the soil, looks back at you once, and digs himself in. |
| **The tree** | A sprout pushes out of the mound. Water it and it becomes a flowering butterfly pea tree, under an evening sky. |
| **The pod** | A pod swells on a branch. Water it until it ripens, and it bursts — and the next generation of pea dogs tumbles out onto the hill. |

Nothing ends. The puppies stay, and you can keep looking after them.

## Controls

There are none, in the sense of buttons. There is only the world:

* **Swipe** across the blossom to strip its petals.
* **Tap** the pea dog (or, later, any puppy) to poke him.
* **Press and drag** the watering can to pick it up. Hold it over the pond and
  it fills; hold it over something thirsty and it tips and pours by itself.
* **Tap** the pond to make rings, or the soil to turn it over.

Interactive things glint faintly when you have been still for a while. That is
the whole tutorial.

## Running it

It is a static site with no build step and no dependencies. Any web server will do:

    npx http-server -p 8123 .      # or: python3 -m http.server 8123
    open http://localhost:8123/

It needs to be *served* rather than opened from the filesystem, because the code
is split into ES modules. Deploy by copying the repository to any static host
(GitHub Pages, Netlify, S3 — anything).

## How it is drawn

Every pixel is generated in code — there are no image assets anywhere in the
repository. The game renders into a 480×300 buffer and scales it up with
nearest-neighbour filtering, so the pixel grid stays hard at any size.

    src/core.js     seeded noise, colour maths, and the pixel primitives:
                    crisp ellipses, scanline polygons, ordered dithering, and
                    the "span" system that gives the pea dog his thick outline
    src/vista.js    the valley town.  One deterministic model — ridgelines,
                    buildings, temples, paddies — re-rendered per era so you
                    are always looking at the same place at a different time
    src/stage.js    the hilltop you play on: grass, pond, soil, watering can,
                    and the butterfly pea tree with its growth skeleton
    src/dog.js      the pea dog, built from span-sets and sheared (never
                    rotated) so no anti-aliasing ever softens an edge
    src/intro.js    the opening blossom, baked petal by petal, and the swipe
                    that tears it apart
    src/fx.js       petals, droplets, hearts, dirt, birds, butterflies,
                    fireflies, god rays and valley mist
    src/audio.js    a few small procedural sounds; nothing is loaded
    src/main.js     the state machine, the input, and the frame loop

Six eras are baked once each into offscreen canvases (vista, ground, foreground)
and cross-faded when time turns, so the transition costs nothing at runtime.

## Development

    node tools/shot.mjs intro wake care    # screenshot chosen beats
    node tools/beats.mjs                   # one screenshot per era
    node tools/sprshot.mjs                 # the sprite sheet (tools/sprites.html)
    node tools/play.mjs                    # a full scripted play-through

`window.__game` exposes `skipTo(beat)`, `setEra(n)`, `setStage(n)` and
`fillCan()` for jumping around while working on a scene.
