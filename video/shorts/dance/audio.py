"""موسیقی کارتونی (رقص محلی قرون وسطایی ۶/۸) و افکت‌ها + گوینده ← out/music.wav و out/voice.wav"""
import json, re, wave
import numpy as np

SR = 48000
V = json.loads(re.search(r"\[.*\]", open("voice.js").read()).group(0))
S, t0 = [], 0.0
for i, d in enumerate(V):
    vs = t0 + (0.35 if i == 0 else 0.12)
    dur = (vs - t0) + d + (1.8 if i == len(V) - 1 else 0.3)
    S.append((t0, dur, vs)); t0 += dur
TOTAL = t0
N = int(TOTAL * SR) + SR
rng = np.random.default_rng(1518)
mus = np.zeros((N, 2)); voc = np.zeros(N)


def add(buf, x, t, pan=0.0, g=1.0):
    i = int(t * SR)
    if i >= len(buf): return
    x = x[: len(buf) - i]
    if buf.ndim == 2:
        buf[i:i + len(x), 0] += x * g * np.sqrt(0.5 * (1 - pan)); buf[i:i + len(x), 1] += x * g * np.sqrt(0.5 * (1 + pan))
    else:
        buf[i:i + len(x)] += x * g


def tt(d): return np.arange(int(d * SR)) / SR
def lp(x, k): return np.convolve(x, np.ones(k) / k, "same")
def hz(m): return 440 * 2 ** ((m - 69) / 12)


def fiddle(f, d):  # سازِ زهی آرشه‌ای ساده
    t = tt(d + 0.08)
    vib = 1 + 0.006 * np.sin(2 * np.pi * 5.5 * t) * np.minimum(1, t / 0.15)
    ph = 2 * np.pi * np.cumsum(f * vib) / SR
    s = sum(np.sin(k * ph) / k ** 1.3 for k in range(1, 9))
    env = np.minimum(1, t / 0.02) * np.minimum(1, np.maximum(0, (d + 0.08 - t)) / 0.06)
    return s * env * 0.16


def drone(f, d):
    t = tt(d); ph = 2 * np.pi * f * t
    return (np.sin(ph) + 0.5 * np.sin(2 * ph) + 0.25 * np.sin(3 * ph)) * 0.05


def tabor(acc):
    t = tt(0.25); f = 110 + 60 * np.exp(-t * 40)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 14)
    n = rng.standard_normal(len(t)); s += (n - lp(n, 3)) * np.exp(-t * 30) * 0.4  # سیم‌های تابور
    return s * (0.5 if acc else 0.28)


def boing():
    t = tt(0.6); f = 180 + 260 * np.exp(-t * 6) * (1 + 0.3 * np.sin(2 * np.pi * 18 * t))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 4) * 0.5


def popfx():
    t = tt(0.12); f = 500 + 900 * t / 0.12
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 30) * 0.35


def swoosh(d=0.45):
    t = tt(d); n = rng.standard_normal(len(t)); return lp(n, 18) * np.sin(np.pi * t / d) ** 2 * 1.3


def thud():
    t = tt(0.4); f = 60 + 60 * np.exp(-t * 25); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 10) * 0.6


def chime():
    t = tt(1.5); return sum(np.sin(2 * np.pi * hz(m) * t) for m in (84, 88, 91)) * np.exp(-t * 3) * 0.08


# جیگ در ر دورین، ۶/۸، هر هشتم ۰٫۱۸ ثانیه
E8 = 0.18
A = [62, 64, 65, 67, 69, 67, 65, 64, 62, 64, 65, 62, 60, 62, 64, 60, 57, 60, 62, 64, 65, 67, 69, 72, 71, 69, 67, 65, 64, 62, 64, 65, 62, 62, 62, 62]
B = [69, 72, 74, 72, 69, 67, 65, 67, 69, 67, 65, 64, 62, 64, 65, 67, 69, 67, 65, 64, 62, 60, 62, 64, 65, 64, 62, 60, 57, 60, 62, 62, 62, 62, 62, 62]
tune = A + A + B + A
t = 0.0; k = 0
while t < TOTAL - 1.8:
    m = tune[k % len(tune)]
    soft = 0.55 if any(st + 0.0 <= t <= st + du for st, du, vs in S if False) else 1
    add(mus, fiddle(hz(m), E8 * 0.95), t, pan=0.2)
    if k % 3 == 0:
        add(mus, tabor(k % 6 == 0), t, pan=-0.1)
    if k % 6 == 0:
        add(mus, drone(hz(38), E8 * 6), t, pan=-0.2)
        add(mus, drone(hz(45), E8 * 6), t, pan=0.2, g=0.6)
    t += E8; k += 1

for i, (st, du, vs) in enumerate(S):
    if i: add(mus, swoosh(), st - 0.15, g=0.5)
    with wave.open(f"voice/{i:02d}.wav") as w:
        x = np.frombuffer(w.readframes(w.getnframes()), np.int16) / 32768
    add(voc, x, vs)
# افکت‌ها هماهنگ با انیمیشن
st = [s[0] for s in S]
add(mus, boing(), st[0] + 3.6); add(mus, popfx(), st[0] + 4.4)
add(mus, popfx(), st[1] + 3.0); add(mus, popfx(), st[1] + 3.6)
add(mus, popfx(), st[3] + 0.2)
add(mus, popfx(), st[4] + 0.8)
for k in range(4): add(mus, thud(), st[5] + 2.2 + k * 0.35 * 3)
add(mus, chime(), st[6] + 3.5)
for k, a in enumerate((3.2, 4.4, 5.6)): add(mus, popfx(), st[7] + a)
add(mus, boing(), st[8] + 0.8)

mus = mus[: int(TOTAL * SR)]; voc = voc[: int(TOTAL * SR)]
fo = int(1.5 * SR); mus[-fo:] *= np.linspace(1, 0, fo)[:, None]
mus = np.tanh(mus * 1.3); mus /= np.abs(mus).max() * 1.1
voc /= np.abs(voc).max() * 1.1
for name, x in (("out/music.wav", mus), ("out/voice.wav", voc[:, None])):
    with wave.open(name, "wb") as w:
        w.setnchannels(x.shape[1]); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 32767).astype(np.int16).tobytes())
print("audio", round(TOTAL, 2))
