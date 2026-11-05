"""Build the cinematic edit plan: speed-ramp time map, cut points, and music sync.

usage: python scripts/plan.py MUSIC_FILE [--credit "Song - Film"] [--start SECONDS]

Writes src/cinematic/plan.json. The music's biggest energy jump (the drop) is lined up with
the hero slow-motion spin unless --start forces where the track begins.
"""
import argparse, json, subprocess, sys
from pathlib import Path
import numpy as np

FPS = 30
INTRO = 75                   # cold-open title frames before the footage
END = 150                    # end-credit frames after the footage
SRC_END = 17.35              # seconds of usable source footage
# (source start, source end, speed): slow-mo on the dupatta swirl, the spin and the co-star entry
SEGS = [(0, 3.0, 1.0), (3.0, 4.5, 0.4), (4.5, 9.3, 1.0), (9.3, 11.3, 0.33), (11.3, 15.5, 1.0), (15.5, SRC_END, 0.5)]
HERO_SRC = 9.3

ap = argparse.ArgumentParser()
ap.add_argument("music")
ap.add_argument("--credit", default=None)
ap.add_argument("--start", type=float, default=None)
ap.add_argument("--public-name", default=None, help="file name of the music inside public/")
a = ap.parse_args()

# 1. speed-ramped time map: speed eases toward each segment's target, so ramps are smooth
times, seg_of = [], []
st, v = 0.0, 1.0
while st < SRC_END:
    idx = next(i for i, s in enumerate(SEGS) if s[0] <= st < s[1]) if st < SEGS[-1][1] else len(SEGS) - 1
    v += (SEGS[idx][2] - v) * 0.2
    times.append(round(st, 4)); seg_of.append(idx)
    st += v / FPS
cuts = [INTRO + i for i in range(1, len(seg_of)) if seg_of[i] != seg_of[i - 1]]
hero = INTRO + next(i for i, t in enumerate(times) if t >= HERO_SRC)
total = INTRO + len(times) + END

# 2. music analysis
sr = 22050
raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", a.music, "-ac", "1", "-ar", str(sr), "-f", "f32le", "-"], capture_output=True, check=True).stdout
y = np.frombuffer(raw, dtype=np.float32)
hop = 512
n = len(y) // hop
frames = y[: n * hop].reshape(n, hop)
spec = np.abs(np.fft.rfft(frames * np.hanning(hop), axis=1))
flux = np.maximum(0, np.diff(np.log1p(spec), axis=0)).sum(axis=1)
flux = np.concatenate([[0], flux]); flux = (flux - flux.mean()) / (flux.std() + 1e-9)
ft = np.arange(n) * hop / sr
# tempo by autocorrelation (70-180 bpm), then beat phase by comb alignment
lags = np.arange(int(60 / 180 * sr / hop), int(60 / 70 * sr / hop))
ac = [np.dot(flux[:-l], flux[l:]) for l in lags]
period = lags[int(np.argmax(ac))]
phase = max(range(period), key=lambda p: flux[p::period].sum())
beats = ft[phase::period]
bpm = 60 / (period * hop / sr)
# drop: biggest rise of 1 s energy over the previous 2 s
rms = np.sqrt((frames ** 2).mean(axis=1))
w1, w2 = int(1 * sr / hop), int(2 * sr / hop)
c = np.cumsum(np.concatenate([[0], rms]))
score = np.full(n, -np.inf)
for i in range(w2, n - w1):
    score[i] = (c[i + w1] - c[i]) / w1 - (c[i] - c[i - w2]) / w2
drop = float(ft[int(np.argmax(score))])
drop = float(beats[np.argmin(np.abs(beats - drop))])  # snap to a beat
hero_t = hero / FPS
start = a.start if a.start is not None else max(0.0, drop - hero_t)
dur = len(y) / sr
if start + total / FPS > dur:
    start = max(0.0, dur - total / FPS)

out_beats = [round(b - start, 3) for b in beats if 0 <= b - start <= total / FPS]
# snap each cut's effect onto the nearest beat (within 0.3 s)
def snap(f):
    if not out_beats: return f
    b = min(out_beats, key=lambda x: abs(x * FPS - f))
    return int(round(b * FPS)) if abs(b * FPS - f) <= 0.3 * FPS else f
fx = [snap(f) for f in cuts]

plan = {
    "fps": FPS, "intro": INTRO, "end": END, "total": total, "times": times, "segOf": seg_of,
    "cuts": cuts, "cutFx": fx, "hero": snap(hero), "beats": out_beats, "bpm": round(float(bpm), 1),
    "music": {"file": a.public_name or Path(a.music).name, "startFrom": round(start, 3), "credit": a.credit},
}
Path(__file__).resolve().parent.parent.joinpath("src/cinematic/plan.json").write_text(json.dumps(plan))
print(json.dumps({k: plan[k] for k in ("total", "cuts", "cutFx", "hero", "bpm", "music")}, indent=1), f"drop at {drop:.2f}s, {len(out_beats)} beats in range", sep="\n")
