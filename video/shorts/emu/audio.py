"""موسیقی و افکت‌های شورت جنگ اِموها + گوینده ← out/mix_*.wav"""
import json, re, wave
import numpy as np

SR = 48000
V = json.loads(re.search(r"\[.*\]", open("voice.js").read()).group(0))
GAP, LEAD = 0.25, 0.35
S, t0 = [], 0.0
for i, d in enumerate(V):
    vs = t0 + (LEAD if i == 0 else 0.1)
    dur = (vs - t0) + d + (1.6 if i == len(V) - 1 else GAP)
    S.append((t0, dur, vs)); t0 += dur
TOTAL = t0
N = int(TOTAL * SR) + SR
rng = np.random.default_rng(7)
mus = np.zeros((N, 2)); voc = np.zeros(N)


def add(buf, x, t, pan=0.0, g=1.0):
    i = int(t * SR); x = x[: len(buf) - i]
    if buf.ndim == 2:
        buf[i:i + len(x), 0] += x * g * np.sqrt(0.5 * (1 - pan)); buf[i:i + len(x), 1] += x * g * np.sqrt(0.5 * (1 + pan))
    else:
        buf[i:i + len(x)] += x * g


def tt(d): return np.arange(int(d * SR)) / SR
def lp(x, k): return np.convolve(x, np.ones(k) / k, "same")
def hz(m): return 440 * 2 ** ((m - 69) / 12)


def pluck(f, d=0.35, v=1.0):  # پیتزیکاتو
    t = tt(d); s = sum(np.sin(2 * np.pi * f * k * t) * np.exp(-t * (9 + 5 * k)) / k for k in range(1, 6))
    return s * np.minimum(1, t / 0.003) * v * 0.3


def bass(f, d=0.3):
    t = tt(d); return (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(4 * np.pi * f * t)) * np.exp(-t * 7) * 0.45


def kick():
    t = tt(0.35); f = 50 + 90 * np.exp(-t * 30); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9) * 0.7


def snare():
    t = tt(0.2); n = rng.standard_normal(len(t)); return (n - lp(n, 4)) * np.exp(-t * 22) * 0.35


def hat():
    t = tt(0.05); n = rng.standard_normal(len(t)); return (n - lp(n, 2)) * np.exp(-t * 80) * 0.15


def whoosh(d=0.6):
    t = tt(d); n = rng.standard_normal(len(t)); return lp(n, 25) * np.sin(np.pi * t / d) ** 2 * 1.6


def boom():
    t = tt(1.6); f = 35 + 40 * np.exp(-t * 5)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.2) + lp(rng.standard_normal(len(t)), 40) * np.exp(-t * 6) * 2) * 0.8


def gunburst(n=10):
    out = np.zeros(int((n * 0.07 + 0.3) * SR))
    for k in range(n):
        t = tt(0.12); x = rng.standard_normal(len(t)) * np.exp(-t * 40) + np.sin(2 * np.pi * 90 * t) * np.exp(-t * 30)
        i = int(k * 0.07 * SR); out[i:i + len(x)] += x * 0.5
    return out


def click():
    t = tt(0.06); return np.sin(2 * np.pi * 1800 * t) * np.exp(-t * 90) * 0.5


def ding():
    t = tt(1.2); return (np.sin(2 * np.pi * 1318 * t) + 0.5 * np.sin(2 * np.pi * 1976 * t)) * np.exp(-t * 4) * 0.25


def fanfare(t0):
    for k, (m, d) in enumerate([(67, .15), (67, .15), (67, .15), (72, .6)]):
        tt_ = tt(d + 0.3); f = hz(m)
        x = sum(np.sign(np.sin(2 * np.pi * f * j * tt_)) / j ** 1.5 for j in (1, 2, 3)) * np.exp(-tt_ * 2.5) * 0.12
        add(mus, x, t0 + [0, .17, .34, .51][k])


# موسیقی بامزه: الگوی پیتزیکاتو در ر مینور، ۱۲۰ ضرب در دقیقه
BEAT = 0.5
mel = [62, 65, 69, 65, 62, 65, 69, 72, 70, 69, 67, 65, 64, 65, 67, 69]
roots = [38, 38, 34, 36]
t = 0.0; k = 0
while t < TOTAL - 1.5:
    bar = int(t / (BEAT * 4))
    add(mus, pluck(hz(mel[k % 16])), t, pan=0.3 * np.sin(k), g=0.9)
    if k % 2 == 0:
        add(mus, bass(hz(roots[bar % 4])), t, g=0.9)
        add(mus, kick() if (k // 2) % 2 == 0 else snare(), t, g=0.7)
    add(mus, hat(), t + BEAT / 4, pan=0.2)
    t += BEAT / 2; k += 1

for i, (st, du, vs) in enumerate(S):
    if i: add(mus, whoosh(), st - 0.35, g=0.6)
    with wave.open(f"voice/{i:02d}.wav") as w:
        x = np.frombuffer(w.readframes(w.getnframes()), np.int16) / 32768
    add(voc, x, vs)
# افکت‌های هماهنگ با تصویر
s0 = S[0][0]; add(mus, boom(), s0 + 4.2)
s3 = S[3][0]; add(mus, gunburst(9), s3 + 2.3, g=0.7); add(mus, click(), s3 + 2.95); add(mus, click(), s3 + 3.15)
s4 = S[4][0]; add(mus, ding(), s4 + 4.3)
s6 = S[6][0]; fanfare(s6 + 3.6)
s7 = S[7][0]; add(mus, ding(), s7 + 0.8)

mus = mus[: int(TOTAL * SR)]; voc = voc[: int(TOTAL * SR)]
fo = int(1.2 * SR); mus[-fo:] *= np.linspace(1, 0, fo)[:, None]
mus = np.tanh(mus * 1.2); mus /= np.abs(mus).max() * 1.1
voc /= np.abs(voc).max() * 1.1
for name, x in (("out/music.wav", mus), ("out/voice.wav", voc[:, None])):
    with wave.open(name, "wb") as w:
        w.setnchannels(x.shape[1]); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 32767).astype(np.int16).tobytes())
print("audio", round(TOTAL, 2))
