"""موسیقی الکترونیک فضایی (سینت‌ویو آرام) هماهنگ با «دماسنج هیجان» هر دوره + افکت‌ها و گوینده"""
import json, wave
import numpy as np

SR = 44100
tl = json.loads(open("out/timeline.json").read())
SC = tl["scenes"]; TOTAL = tl["total"]
N = int(TOTAL * SR) + SR
rng = np.random.default_rng(2022)
mus = np.zeros((N, 2))


def add(x, t, pan=0.0, g=1.0):
    i = int(t * SR)
    if i >= N or i < 0: return
    x = x[: N - i]
    mus[i:i + len(x), 0] += x * g * np.sqrt(0.5 * (1 - pan)); mus[i:i + len(x), 1] += x * g * np.sqrt(0.5 * (1 + pan))


def tt(d): return np.arange(int(d * SR)) / SR
def lp(x, k): return np.convolve(x, np.ones(k) / k, "same")
def hz(m): return 440 * 2 ** ((m - 69) / 12)


def hype_at(t):
    v = 0.2
    for s in SC:
        if s["type"] == "era" and t >= s["start"]: v = s["hype"]
    return v


def snow_at(t):
    for s in SC:
        if s["start"] <= t < s["start"] + s["dur"]: return s.get("snow") or 0
    return 0


def pad(fs, d):
    t = tt(d); env = np.minimum(1, t / 2) * np.minimum(1, (d - t) / 2)
    s = 0
    for f in fs:
        for det in (-0.004, 0.004):
            ph = 2 * np.pi * f * (1 + det) * t
            s = s + sum(np.sin(k * ph) / k ** 1.4 for k in range(1, 6))
    return s * env * 0.018


def pluck(f, d=0.5):
    t = tt(d); s = sum(np.sin(2 * np.pi * f * k * t) * np.exp(-t * (6 + 4 * k)) / k for k in range(1, 5))
    return s * np.minimum(1, t / 0.003) * 0.12


def kick():
    t = tt(0.4); f = 45 + 100 * np.exp(-t * 35); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 8) * 0.5


def hat():
    t = tt(0.05); n = rng.standard_normal(len(t)); return (n - lp(n, 2)) * np.exp(-t * 90) * 0.08


def riser(d=1.2):
    t = tt(d); n = rng.standard_normal(len(t)); return (n - lp(n, 3)) * (t / d) ** 2 * 0.25


def impact():
    t = tt(2.5); f = 30 + 50 * np.exp(-t * 4)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.6) + lp(rng.standard_normal(len(t)), 60) * np.exp(-t * 3) * 1.5) * 0.6


def blip(f=1320):
    t = tt(0.25); return np.sin(2 * np.pi * f * t) * np.exp(-t * 18) * 0.12


def wind(d):
    t = tt(d); n = rng.standard_normal(len(t)); w = lp(n, 120) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.15 * t)) * 6
    return w * np.minimum(1, t / 1.5) * np.minimum(1, (d - t) / 1.5) * 0.25


# آکوردها: لا مینور ← فا ← دو ← سل
CH = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]
BAR = 2.4
for k in range(int(TOTAL / BAR) + 1):
    t0 = k * BAR
    c = CH[k % 4]
    add(pad([hz(m - 12) for m in c] + [hz(c[0] - 24)], BAR + 1.2), t0 - 0.6)
    h = hype_at(t0); sn = snow_at(t0)
    # آرپژ: تراکم با هیجان؛ در زمستان کم
    steps = 16
    for j in range(steps):
        tj = t0 + j * BAR / steps
        if rng.random() < (0.25 + 0.65 * h) * (1 - 0.7 * min(1, sn)):
            m = c[j % 3] + 12 * (1 + (j // 6) % 2)
            add(pluck(hz(m)), tj, pan=0.4 * np.sin(j), g=0.9)
    if h >= 0.6 and not sn:
        for b in range(4):
            add(kick(), t0 + b * BAR / 4, g=0.8 * (h - 0.4))
            add(hat(), t0 + b * BAR / 4 + BAR / 8, pan=0.2)

for s in SC:
    st = s["start"]
    if st > 0: add(riser(1.0), st - 1.0, g=0.6)
    if s["type"] == "chapter": add(impact(), st + 0.3, g=0.9)
    if s["type"] == "era":
        add(impact(), st + 0.3, g=0.35)
        for b in s["bt"]: add(blip(), st + b, pan=0.3)
        if s.get("snow"): add(wind(s["dur"]), st, g=1.0 if s["snow"] is True or s["snow"] == 1 else 0.5)
    if s["type"] == "intro": add(impact(), 1.6, g=1.0)

mus = mus[: int(TOTAL * SR)]
fi, fo = int(1 * SR), int(3 * SR)
mus[:fi] *= np.linspace(0, 1, fi)[:, None]; mus[-fo:] *= np.linspace(1, 0, fo)[:, None] ** 2
mus = np.tanh(mus * 1.3) / 1.3; mus /= np.abs(mus).max() * 1.1
with wave.open("out/music.wav", "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mus * 32767).astype(np.int16).tobytes())

# گوینده روی خط زمان
VSR = 22050
voc = np.zeros(int(TOTAL * VSR) + VSR, np.float32)
for s in SC:
    for v in s["voice"]:
        with wave.open(f"voice/{v['key']}.wav") as w:
            x = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768
        i = int((s["start"] + v["t"]) * VSR); voc[i:i + len(x)] += x[: len(voc) - i]
voc = voc[: int(TOTAL * VSR)]; voc /= np.abs(voc).max() / 0.9
with wave.open("out/voice.wav", "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(VSR); w.writeframes((voc * 32767).astype(np.int16).tobytes())
print("audio ok", round(TOTAL, 1))
