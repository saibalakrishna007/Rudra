# Dance edit

Two Remotion edits of a phone-shot dance clip. Put the clip at `public/dance.mp4`; it is gitignored,
as are the renders in `out/`.

| Composition | Style |
|---|---|
| `Dance` | Reel style: beat-synced cut transitions, a different look per segment, animated flyers, intro poster, instant replay, outro |
| `Cinematic` | Film style: speed ramps with frame-blended slow motion, teal-and-orange grade, letterbox, halation, grain, gate weave, anamorphic flares, chapter cards, title and end credits |

## Adding a soundtrack to `Cinematic`

1. Copy the audio file you have the rights to use into `public/`, e.g. `public/bindaas.mp3`.
2. Plan the edit against it. This finds the tempo, the beats and the track's biggest drop. It lines the
   drop up with the hero slow-motion spin and moves every cut effect onto the nearest beat:

   ```bash
   uv run --project ../claude-code-video-toolkit python -I scripts/plan.py public/bindaas.mp3 --public-name bindaas.mp3 --credit "Bindaas · Jailer 2"
   ```

   Add `--start 42.5` to start the song at a specific second instead of at the detected drop.
3. Render:

   ```bash
   npx remotion render src/index.ts Cinematic out/dance-cinematic.mp4
   ```

The script writes `src/cinematic/plan.json`. Running it without a music file argument isn't
supported; to go back to the clip's own audio, run it on `public/dance.mp4` with `--public-name dance.mp4`.
