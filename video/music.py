"""ساخت موسیقی متن ویدیو به صورت الگوریتمی (بدون نیاز به فایل صوتی بیرونی).

- پد آرام در دستگاه شور (با ربع‌پرده)
- ملودی سنتور‌گونه با ضربه‌های دوتایی و ریز
- ضرب دف در صحنه‌های هر دوره
- افکت‌های هماهنگ با تصویر: ووش در گذار صحنه‌ها، ضربهٔ بم هنگام عنوان، زنگ آرام برای هر نکته

خروجی: out/music.wav
"""
import json
import wave
from pathlib import Path

import numpy as np

SR = 44100
OUT = Path(__file__).parent / "out"
tl = json.loads((OUT / "timeline.json").read_text())
TOTAL = tl["total"]
SCENES = tl["scenes"]
N = int(TOTAL * SR) + SR
rng = np.random.default_rng(1404)

L = np.zeros(N)
R = np.zeros(N)

D2 = 73.416
cents = lambda c: D2 * 2 ** (c / 1200)
# دستگاه شور روی ر: ر، می‌کرن، فا، سل، لا، سی‌بمل، دو
SHUR = [0, 150, 300, 500, 700, 800, 1000]


def add(sig, t0, pan=0.0, gain=1.0):
    i = int(t0 * SR)
    if i >= N:
        return
    sig = sig[: N - i]
    gl = np.sqrt(0.5 * (1 - pan)) * gain
    gr = np.sqrt(0.5 * (1 + pan)) * gain
    L[i : i + len(sig)] += sig * gl
    R[i : i + len(sig)] += sig * gr


def lowpass(x, k):
    if k <= 1:
        return x
    ker = np.ones(k) / k
    return np.convolve(x, ker, mode="same")


# ---------- پد ----------
CHORDS = [
    [0, 700, 1200, 1500],      # Dm
    [-400, 300, 800, 1200],    # Bb
    [-700, 0, 500, 800],       # Gm
    [0, 700, 1200, 1500],      # Dm
    [-200, 500, 1000, 1500],   # Csus4
    [-400, 300, 800, 1200],    # Bb
    [-200, 500, 1000, 1700],   # C
    [0, 700, 1200, 1450],      # Dm (با ربع‌پرده)
]
SEG = 8.0
FADE = 2.5


def pad_tone(freq, dur):
    t = np.arange(int(dur * SR)) / SR
    s = np.zeros_like(t)
    for det in (-5, 0, 6):
        f = freq * 2 ** (det / 1200)
        for k in range(1, 9):
            # صدای گرم با هارمونیک‌های رو به کاهش
            s += np.sin(2 * np.pi * f * k * t + k * det) / (k ** 1.6)
    s *= 0.85 + 0.15 * np.sin(2 * np.pi * 0.13 * t + freq)
    return s / 6


nseg = int(TOTAL / SEG) + 2
for j in range(nseg):
    t0 = j * SEG - FADE / 2
    dur = SEG + FADE
    n = int(dur * SR)
    env = np.ones(n)
    f = int(FADE * SR)
    env[:f] = np.sin(np.linspace(0, np.pi / 2, f)) ** 2
    env[-f:] = np.cos(np.linspace(0, np.pi / 2, f)) ** 2
    chord = CHORDS[j % len(CHORDS)]
    for idx, c in enumerate(chord):
        tone = pad_tone(cents(c), dur) * env
        add(tone, max(0, t0), pan=(idx - 1.5) * 0.35, gain=0.055)

# ---------- سنتور ----------
def santur(freq, dur=2.6, vel=1.0):
    t = np.arange(int(dur * SR)) / SR
    s = np.zeros_like(t)
    for det in (-2.5, 2.5):
        f = freq * 2 ** (det / 1200)
        for k in range(1, 8):
            fk = f * k * (1 + 0.0007 * k * k)
            s += np.sin(2 * np.pi * fk * t) * np.exp(-t * (2.2 + 1.7 * k)) / (k ** 1.1)
    att = np.minimum(1, t / 0.002)
    # صدای برخورد مضراب
    click = rng.standard_normal(len(t)) * np.exp(-t * 300) * 0.25
    return (s * att + lowpass(click, 3)) * vel * 0.18


BEAT = 60 / 78  # ۷۸ ضرب در دقیقه
EIGHTH = BEAT / 2


def scale_freq(deg):
    """درجهٔ گام (می‌تواند منفی یا بیشتر از ۷ باشد) → فرکانس، پایه ر۴"""
    octv, d = divmod(deg, 7)
    return cents(SHUR[d] + 1200 * (octv + 2))


def melody(t0, t1, density=0.75, base=0):
    t = t0
    deg = base + int(rng.integers(0, 5))
    while t < t1 - 1:
        # یک جمله
        plen = int(rng.integers(5, 11))
        for _ in range(plen):
            if t >= t1 - 1:
                break
            step = rng.choice([-2, -1, -1, 0, 1, 1, 2], p=[0.08, 0.27, 0.1, 0.05, 0.27, 0.15, 0.08])
            deg = int(np.clip(deg + step, -2, 9))
            f = scale_freq(deg)
            if rng.random() < density:
                pan = float(rng.uniform(-0.45, 0.45))
                vel = float(rng.uniform(0.65, 1.0))
                if rng.random() < 0.12:
                    # ریز (ترمولوی سنتور)
                    n = int(rng.integers(6, 12))
                    for r in range(n):
                        add(santur(f, 1.2, vel * (0.55 + 0.45 * (r % 2))), t + r * 0.07, pan)
                    t += EIGHTH * 2
                    continue
                add(santur(f, 2.6, vel), t, pan)
                if rng.random() < 0.25:  # ضربهٔ دوتایی با اکتاو پایین
                    add(santur(f / 2, 2.6, vel * 0.6), t + 0.012, -pan)
            t += EIGHTH * float(rng.choice([1, 1, 2, 2, 3], p=[0.35, 0.15, 0.3, 0.1, 0.1]))
        # پایان جمله روی درجهٔ پایه یا پنجم
        deg = int(rng.choice([0, 4, 2]))
        add(santur(scale_freq(deg), 3.2, 0.8), t, float(rng.uniform(-0.3, 0.3)))
        t += EIGHTH * float(rng.choice([4, 6, 8]))


# ---------- دف ----------
def daf_dum(vel=1.0):
    t = np.arange(int(0.6 * SR)) / SR
    f = 48 + 40 * np.exp(-t * 18)
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) * np.exp(-t * 7)
    s += lowpass(rng.standard_normal(len(t)), 8) * np.exp(-t * 40) * 0.4
    return s * vel * 0.32


def daf_tak(vel=1.0):
    t = np.arange(int(0.35 * SR)) / SR
    n = rng.standard_normal(len(t))
    hp = n - lowpass(n, 6)
    s = hp * np.exp(-t * 35) * 0.6
    # حلقه‌های دف
    jn = rng.standard_normal(len(t))
    s += (jn - lowpass(jn, 2)) * np.exp(-t * 12) * 0.18
    return s * vel * 0.22


def drums(t0, t1, fade_in=4.0):
    t = t0
    bar = 0
    while t < t1 - BEAT * 4:
        g = min(1.0, (t - t0) / fade_in)
        add(daf_dum(0.9 * g), t)
        add(daf_tak(0.6 * g), t + BEAT * 1.5, 0.15)
        add(daf_dum(0.55 * g), t + BEAT * 2)
        add(daf_tak(0.8 * g), t + BEAT * 3, -0.15)
        if bar % 4 == 3:
            add(daf_tak(0.5 * g), t + BEAT * 3.5, 0.2)
        t += BEAT * 4
        bar += 1


# ---------- افکت‌ها ----------
def whoosh(dur=1.4):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = rng.standard_normal(n)
    env = np.sin(np.pi * t / dur) ** 3
    lo = lowpass(x, 40)
    hi = x - lowpass(x, 4)
    mix = lo * (1 - t / dur) * 6 + lowpass(hi, 3) * (t / dur) * 0.35
    return mix * env * 0.22


def boom():
    t = np.arange(int(3.0 * SR)) / SR
    f = 38 + 30 * np.exp(-t * 6)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.6)
    s += lowpass(rng.standard_normal(len(t)), 60) * np.exp(-t * 4) * 1.5
    return s * 0.38


def chime(freq):
    t = np.arange(int(2.0 * SR)) / SR
    s = (np.sin(2 * np.pi * freq * t) + 0.5 * np.sin(2 * np.pi * freq * 2.76 * t) * np.exp(-t * 3))
    return s * np.exp(-t * 2.5) * np.minimum(1, t / 0.004) * 0.05


def swell(dur):
    t = np.arange(int(dur * SR)) / SR
    x = rng.standard_normal(len(t))
    hi = x - lowpass(x, 3)
    return hi * (t / dur) ** 3 * 0.12


# ---------- چیدمان بر اساس خط زمان ----------
BULLET_T0, BULLET_DT = 3.6, 2.9
for i, s in enumerate(SCENES):
    st, du = s["start"], s["dur"]
    if i > 0:
        add(whoosh(), st - 0.7, pan=float(rng.uniform(-0.3, 0.3)))
    if s["type"] == "intro":
        add(swell(3.4), 0.3)
        add(boom(), 3.6)
        melody(4.5, du, density=0.55, base=0)
    elif s["type"] == "chapter":
        add(boom(), st + 0.5)
        add(santur(scale_freq(0), 3.5, 1.0), st + 0.5)
        add(santur(scale_freq(4), 3.5, 0.8), st + 0.5 + 0.015)
    elif s["type"] == "era":
        add(boom(), st + 0.5, gain=0.6)
        melody(st + 1.2, st + du, density=0.7, base=int(rng.integers(0, 3)))
        drums(st + 1.0, st + du)
        for b in range(s["bullets"]):
            add(chime(scale_freq(7 + (b % 3) * 2) * 2), st + BULLET_T0 + b * BULLET_DT, pan=0.4)
    elif s["type"] == "outro":
        melody(st + 0.5, st + 9, density=0.5, base=0)
        add(boom(), st + 9.2)
        # آکورد پایانی
        for k, c in enumerate([0, 700, 1200, 1500, 1900]):
            add(santur(cents(c + 1200), 6.0, 0.8), st + 9.2 + k * 0.06, (k - 2) * 0.2)

mix = np.stack([L, R], axis=1)[: int(TOTAL * SR)]
# محو ابتدا و انتها
fi, fo = int(1.0 * SR), int(3.0 * SR)
mix[:fi] *= np.linspace(0, 1, fi)[:, None]
mix[-fo:] *= np.linspace(1, 0, fo)[:, None] ** 2
# فشرده‌سازی نرم
mix = np.tanh(mix * 1.4) / 1.4
mix /= np.max(np.abs(mix)) * 1.12
pcm = (mix * 32767).astype(np.int16)
with wave.open(str(OUT / "music.wav"), "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print("music.wav", round(TOTAL, 1), "s")
