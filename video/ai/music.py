"""موسیقی مستند و آرام: پیانو، زهی‌های نرم و ویولنسل، هماهنگ با فصل‌ها + خط صدای گوینده
خروجی: out/music.wav و out/voice.wav"""
import json, wave
import numpy as np

SR = 44100
tl = json.loads(open("out/timeline.json").read())
SC = tl["scenes"]; TOTAL = tl["total"]
N = int(TOTAL * SR) + 2 * SR
rng = np.random.default_rng(7)
mus = np.zeros((N, 2))


def add(x, t, pan=0.0, g=1.0):
    i = int(t * SR)
    if i >= N: return
    if i < 0: x, i = x[-i:], 0
    x = x[: N - i]
    mus[i:i + len(x), 0] += x * g * np.sqrt(0.5 * (1 - pan)); mus[i:i + len(x), 1] += x * g * np.sqrt(0.5 * (1 + pan))


def tt(d): return np.arange(int(d * SR)) / SR
def hz(m): return 440 * 2 ** ((m - 69) / 12)
def lp(x, k): return np.convolve(x, np.ones(k) / k, "same")


def piano(f, d=3.5, v=1.0):
    t = tt(d)
    s = np.zeros_like(t)
    for k in range(1, 9):
        fk = f * k * np.sqrt(1 + 0.0004 * k * k)
        s += np.sin(2 * np.pi * fk * t) * np.exp(-t * (0.9 + 0.55 * k) * (f / 260) ** 0.3) / k ** 1.1
    s += np.sin(2 * np.pi * f * 1.002 * t) * np.exp(-t * 1.2) * 0.4  # سیم دوم کمی ناکوک
    att = np.minimum(1, t / 0.004)
    rel = np.minimum(1, (d - t) / 0.3)
    return s * att * rel * v * 0.09


def strings(fs, d, v=1.0):
    t = tt(d)
    env = np.minimum(1, t / 2.5) * np.minimum(1, (d - t) / 2.5)
    s = np.zeros_like(t)
    for f in fs:
        for det in (-0.003, 0.0, 0.0035):
            vib = 1 + 0.003 * np.sin(2 * np.pi * (5 + det * 300) * t)
            ph = 2 * np.pi * np.cumsum(f * (1 + det) * vib) / SR
            s += sum(np.sin(k * ph) * (0.6 ** k) for k in range(1, 6))
    return s * env * v * 0.012


def cello(f, d):
    t = tt(d); env = np.minimum(1, t / 1.5) * np.minimum(1, (d - t) / 2)
    ph = 2 * np.pi * np.cumsum(f * (1 + 0.004 * np.sin(2 * np.pi * 4.5 * t))) / SR
    return sum(np.sin(k * ph) * (0.55 ** k) for k in range(1, 7)) * env * 0.035


def timpani(g=1.0):
    t = tt(3); f = 65 * (1 + 0.15 * np.exp(-t * 8))
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.3) + lp(rng.standard_normal(len(t)), 40) * np.exp(-t * 10) * 0.8
    return s * 0.35 * g


def pulse(g):  # ضرب نرم برای دوره‌های پرهیجان
    t = tt(0.5); f = 50 + 40 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9) * 0.25 * g


def chime(f):
    t = tt(2.5); return (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * f * 2.01 * t)) * np.exp(-t * 2) * 0.03


def wind(d):
    t = tt(d); n = rng.standard_normal(len(t)); w = lp(n, 200) * 8
    return w * (0.6 + 0.4 * np.sin(2 * np.pi * 0.1 * t)) * np.minimum(1, t / 2) * np.minimum(1, (d - t) / 2) * 0.12


def info(t):
    for s in SC:
        if s["start"] <= t < s["start"] + s["dur"]: return s
    return SC[-1]


# دو مینور — ر مینور، سی‌بمل، فا، دو  (i–VI–III–VII)
CH = [(50, [62, 65, 69]), (46, [62, 65, 70]), (41, [60, 65, 69]), (48, [60, 64, 67])]
BEAT = 60 / 72
BAR = BEAT * 4
for k in range(int(TOTAL / BAR) + 2):
    t0 = k * BAR
    s = info(t0)
    hype = s.get("hype", 0.4) if s["type"] == "era" else 0.35
    snow = s.get("snow") or 0
    root, ch = CH[k % 4]
    add(strings([hz(m - 12) for m in ch], BAR + 2.5, 0.9 if not snow else 0.5), t0 - 1.2, pan=0.0)
    add(cello(hz(root - 12), BAR + 1.5), t0 - 0.5, pan=-0.15)
    # آرپژ پیانو: در زمستان پراکنده، در اوج پرتر
    pat = [0, 1, 2, 1, 0, 2, 1, 2]
    for j, p in enumerate(pat):
        if snow and j % 2: continue
        if hype < 0.35 and j in (3, 7): continue
        m = ch[p] + (12 if j >= 4 and hype > 0.6 else 0)
        add(piano(hz(m), 3.0, 0.75 + 0.25 * (j == 0)), t0 + j * BEAT / 2, pan=0.25 * np.sin(j + k))
    add(piano(hz(root), 4.0, 0.7), t0, pan=-0.2)
    if hype >= 0.75 and not snow:
        for b in range(4): add(pulse(hype - 0.5), t0 + b * BEAT)

for s in SC:
    st = s["start"]
    if s["type"] in ("chapter", "intro"): add(timpani(1.0), st + 0.3)
    if s["type"] == "era":
        add(timpani(0.35), st + 0.3)
        for b in s["bt"]: add(chime(hz(81)), st + b, pan=0.3)
        if s.get("snow"): add(wind(s["dur"]), st, g=1.0 if s["snow"] in (True, 1) else 0.5)

mus = mus[: int(TOTAL * SR)]
# پژواک ملایم سالن (چند تأخیر)
rev = mus.copy()
for d, g in ((0.031, 0.35), (0.067, 0.28), (0.113, 0.22), (0.171, 0.16), (0.243, 0.11)):
    n = int(d * SR); rev[n:] += mus[:-n] * g
mus = rev
fi, fo = int(1.5 * SR), int(4 * SR)
mus[:fi] *= np.linspace(0, 1, fi)[:, None]; mus[-fo:] *= np.linspace(1, 0, fo)[:, None] ** 2
mus /= np.abs(mus).max() * 1.12
with wave.open("out/music.wav", "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mus * 32767).astype(np.int16).tobytes())

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
