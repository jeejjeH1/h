"""موسیقی سینمایی (طبل تایکو، درون و ملودی پنتاتونیک ژاپنی) و افکت‌ها + گوینده"""
import json, re, wave
import numpy as np

SR = 48000
V = json.loads(re.search(r"\[.*\]", open("voice.js").read()).group(0))
S, t0 = [], 0.0
for i, d in enumerate(V):
    vs = t0 + (0.35 if i == 0 else 0.1)
    dur = (vs - t0) + d + (1.6 if i == len(V) - 1 else 0.3)
    S.append((t0, dur, vs)); t0 += dur
TOTAL = t0
N = int(TOTAL * SR) + SR
rng = np.random.default_rng(1974)
mus = np.zeros((N, 2)); voc = np.zeros(N)


def add(buf, x, t, pan=0.0, g=1.0):
    i = int(t * SR)
    if i >= len(buf) or i < 0: return
    x = x[: len(buf) - i]
    if buf.ndim == 2:
        buf[i:i + len(x), 0] += x * g * np.sqrt(0.5 * (1 - pan)); buf[i:i + len(x), 1] += x * g * np.sqrt(0.5 * (1 + pan))
    else:
        buf[i:i + len(x)] += x * g


def tt(d): return np.arange(int(d * SR)) / SR
def lp(x, k): return np.convolve(x, np.ones(k) / k, "same")
def hz(m): return 440 * 2 ** ((m - 69) / 12)


def taiko(g=1.0):
    t = tt(1.0); f = 55 + 70 * np.exp(-t * 18)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 4)
    s += lp(rng.standard_normal(len(t)), 30) * np.exp(-t * 25) * 1.5
    return s * 0.6 * g


def rim():
    t = tt(0.08); n = rng.standard_normal(len(t)); return (n - lp(n, 3)) * np.exp(-t * 60) * 0.25


def koto(f, d=1.6, v=1.0):  # زهی ژاپنی
    t = tt(d)
    s = sum(np.sin(2 * np.pi * f * k * (1 + 0.0006 * k * k) * t) * np.exp(-t * (2.5 + 2 * k)) / k for k in range(1, 7))
    return s * np.minimum(1, t / 0.003) * v * 0.22


def pad(fs, d):
    t = tt(d); env = np.minimum(1, t / 1.5) * np.minimum(1, (d - t) / 1.5)
    return sum(np.sin(2 * np.pi * f * t + np.sin(2 * np.pi * 0.2 * t)) + 0.3 * np.sin(4 * np.pi * f * t) for f in fs) * env * 0.04


def boom():
    t = tt(2.0); f = 32 + 40 * np.exp(-t * 4)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.8) + lp(rng.standard_normal(len(t)), 50) * np.exp(-t * 4) * 2) * 0.8


def whoosh(d=0.6):
    t = tt(d); n = rng.standard_normal(len(t)); return lp(n, 25) * np.sin(np.pi * t / d) ** 2 * 1.4


def rustle(d=2.5):
    t = tt(d); n = rng.standard_normal(len(t)); hp = n - lp(n, 6)
    am = (np.abs(np.sin(2 * np.pi * 3.1 * t)) * np.abs(np.sin(2 * np.pi * 1.3 * t))) ** 2
    return hp * am * np.sin(np.pi * t / d) * 0.25


def crackle(d):
    out = np.zeros(int(d * SR))
    for k in range(int(d * 18)):
        i = rng.integers(0, len(out) - 400); out[i:i + 300] += (rng.standard_normal(300) * np.exp(-np.arange(300) / 40)) * rng.uniform(0.05, 0.3)
    return out


def stamp():
    t = tt(0.4); f = 70 + 80 * np.exp(-t * 30)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 12) + rng.standard_normal(len(t)) * np.exp(-t * 50) * 0.5) * 0.7


# پایه: درون در ر مینور با پنتاتونیک «این» ژاپنی (ر، می‌بمل، سل، لا، سی‌بمل)
for k in range(int(TOTAL / 8) + 1):
    chord = [[38, 45], [34, 41], [36, 43], [38, 45]][k % 4]
    add(mus, pad([hz(m) for m in chord] + [hz(chord[0] + 12)], 9.5), k * 8 - 0.75)
IN = [62, 63, 67, 69, 70, 74, 75, 79]
BEAT = 0.6
t = 1.0; k = 0
while t < TOTAL - 2:
    if k % 4 == 0: add(mus, taiko(0.9 if k % 8 == 0 else 0.6), t, pan=-0.1)
    if k % 4 == 3: add(mus, taiko(0.4), t + BEAT / 2, pan=0.1)
    add(mus, rim(), t + BEAT / 2, pan=0.3, g=0.6)
    if rng.random() < 0.45:
        add(mus, koto(hz(IN[int(rng.integers(0, len(IN)))]), 1.8, rng.uniform(0.6, 1)), t, pan=float(rng.uniform(-0.4, 0.4)))
    t += BEAT; k += 1

st = [s[0] for s in S]
for i, (a, du, vs) in enumerate(S):
    if i: add(mus, whoosh(), a - 0.35, g=0.5)
    with wave.open(f"voice/{i:02d}.wav") as w:
        x = np.frombuffer(w.readframes(w.getnframes()), np.int16) / 32768
    add(voc, x, vs)
add(mus, boom(), st[0] + 0.1); add(mus, boom(), st[0] + 6.0, g=1.1)
add(mus, stamp(), st[2] + 3.8)
add(mus, rustle(4.0), st[3] + 0.2); add(mus, boom(), st[3] + 5.4, g=0.7)
for k in range(3): add(mus, stamp(), st[4] + 1.4 + k * 1.4, g=0.6)
add(mus, stamp(), st[5] + 0.3)
add(mus, crackle(S[6][1]), st[6], g=0.8)
add(mus, boom(), st[8] + 5.4, g=1.2)
add(mus, koto(hz(74), 3, 1), st[9] + 0.8)

mus = mus[: int(TOTAL * SR)]; voc = voc[: int(TOTAL * SR)]
fo = int(1.5 * SR); mus[-fo:] *= np.linspace(1, 0, fo)[:, None]
mus = np.tanh(mus * 1.2); mus /= np.abs(mus).max() * 1.1
voc /= np.abs(voc).max() * 1.1
for name, x in (("out/music.wav", mus), ("out/voice.wav", voc[:, None])):
    with wave.open(name, "wb") as w:
        w.setnchannels(x.shape[1]); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 32767).astype(np.int16).tobytes())
print("audio", round(TOTAL, 2))
