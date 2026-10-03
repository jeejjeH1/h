"""صدای شورت: موسیقی و گوینده از ویدیوی اصلی، با جملهٔ قلاب در آغاز و جملهٔ پایانی."""
import wave
import numpy as np

S, D, END = 120.727, 50.372, 7.5   # آغاز صحنهٔ هخامنشی، طول آن، طول کارت پایانی
TOTAL = D + END


def read(p):
    with wave.open(p) as w:
        sr, ch = w.getframerate(), w.getnchannels()
        x = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768
    return sr, x.reshape(-1, ch)


def write(p, sr, x):
    with wave.open(p, "wb") as w:
        w.setnchannels(x.shape[1]); w.setsampwidth(2); w.setframerate(sr)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())


sr, mus = read("../out/music.wav")
m = mus[int(S * sr): int((S + TOTAL) * sr)].copy()
fo = int(2.5 * sr)
m[-fo:] *= np.linspace(1, 0, fo)[:, None]
fi = int(0.3 * sr)
m[:fi] *= np.linspace(0, 1, fi)[:, None]
write("music_s.wav", sr, m)

sr, voc = read("../out/voice.wav")
v = np.zeros((int(TOTAL * sr), 1), np.float32)
seg = voc[int(S * sr): int((S + D) * sr)]
v[: len(seg)] = seg
v[int(0.6 * sr): int(7.7 * sr)] = 0          # حذف جملهٔ آغازین اصلی
for f, t in (("hook.wav", 0.45), ("end.wav", D + 0.5)):
    _, c = read(f)
    i = int(t * sr)
    v[i: i + len(c)] += c[: len(v) - i] * 0.9
write("voice_s.wav", sr, v)
print("audio ok", round(TOTAL, 2))
