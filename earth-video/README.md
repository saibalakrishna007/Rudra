# Earth video

A ~47 second 1080p explainer about Earth, built entirely in code with [Remotion](https://www.remotion.dev/).
No AI models or API keys: the globe, stars, auroras and sound are all generated.

## Scenes and transitions

| # | Scene | Effects | Transition out |
|---|---|---|---|
| 1 | Intro | warp-speed stars, white flash, letter-drop title with moving shine, lens flare, typewriter subtitle | custom zoom-through (blur + scale) |
| 2 | Pale blue dot | 3D-projected spinning globe with clouds, night side and city lights; spring rise; masked text reveals; light sweep | iris |
| 3 | 4.54 billion years | counter, molten-to-blue colour shift, shock rings, self-drawing timeline | diagonal wipe |
| 4 | 71% water | rising water with layered waves and bubbles, counter | push-cut with flash |
| 5 | 1,670 km/h | gauge with overshoot needle, speed lines, camera shake | clock wipe |
| 6 | Orbit | rotating solar corona, self-drawing orbit, Earth with comet trail and moon, depth sorting | 3D flip |
| 7 | Aurora | blurred aurora curtains over the planet's limb | crossfade |
| 8 | Outro | pull-back until Earth is a single glowing dot, fade to black | — |

Film grain and a vignette sit over everything. Audio (`public/`) is synthesized with ffmpeg: an ambient
pad, a riser into the title flash, a boom on the flash and a whoosh on each transition.

## Run

```bash
npm install
npm run studio     # live preview
npm run render     # writes out/earth.mp4
```

Code: `src/Earth.tsx` (timeline and transitions), `src/scenes.tsx`, `src/components/Globe.tsx`,
`src/components/effects.tsx`, `src/transitions.tsx`.
