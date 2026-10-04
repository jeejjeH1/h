"""صدای گوینده، کاملاً فارسی: هر جمله یکجا با Piper (ganji) ساخته می‌شود.
واژه‌های لاتین پیش از ساخت صدا به املای فارسی برگردانده می‌شوند.
خروجی: voice/<key>.wav و voice.js"""
import json, re, subprocess, sys, wave
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import numpy as np

D = Path(__file__).parent
MODEL = D.parent / "out" / "models" / "fa_IR-ganji-medium.onnx"
PRON = json.loads((D.parent / "pronounce.json").read_text())
fa_ch = "؀-ۿ‌"
pron_re = re.compile(f"(?<![{fa_ch}])(" + "|".join(sorted(map(re.escape, PRON), key=len, reverse=True)) + f")(?![{fa_ch}])")
# املای فارسی واژه‌های انگلیسی (برای گوینده)
FA = [("ChatGPT", "چَت جی‌پی‌تی"), ("GPT-3", "جی‌پی‌تی سه"), ("GPT", "جی‌پی‌تی"), ("Deep Blue", "دیپ بُلو"), ("IBM", "آی‌بی‌اِم"),
      ("MIT", "اِم‌آی‌تی"), ("Watson", "واتسون"), ("Jeopardy", "جِپِردی"), ("Siri", "سیری"), ("AlexNet", "اَلِکس‌نِت"),
      ("ImageNet", "ایمیج‌نِت"), ("AlphaGo", "آلفاگو"), ("DeepMind", "دیپ‌مایند"), ("Transformer", "تِرَنسفورمِر"),
      ("OpenAI", "اوپِن اِی‌آی"), ("Claude", "کِلود"), ("Gemini", "جِمِنای"), ("AlphaFold", "آلفافولد"), ("حرفِ T", "حرفِ تی")]
SR = 22050
VO = D / "voice"; VO.mkdir(exist_ok=True)

scenes = json.loads(subprocess.check_output(["node", "-e", "require('./content.js');process.stdout.write(JSON.stringify(AI.scenes))"], cwd=D))
lines = {}
for i, s in enumerate(scenes):
    say = s["say"]
    if isinstance(say, str): lines[f"s{i}_0"] = say
    elif isinstance(say, list):
        for k, t in enumerate(say): lines[f"s{i}_{k}"] = t
    else:
        lines[f"s{i}_i"] = say["intro"]
        for k, t in enumerate(say["bullets"]): lines[f"s{i}_b{k}"] = t


def prep(t):
    for a, b in FA: t = t.replace(a, b)
    t = re.sub(r"\s*\bT\b\s*", " تی ", t)
    assert not re.search(r"[A-Za-z]", t), t
    return pron_re.sub(lambda m: PRON[m.group(1)], t)


def synth(key):
    wav, sig = VO / f"{key}.wav", VO / f"{key}.txt"
    text = "FA1|" + prep(lines[key])
    if wav.exists() and sig.exists() and sig.read_text() == text: return
    raw = subprocess.run([sys.executable, "-m", "piper", "-m", str(MODEL), "--output-raw", "--length-scale", "1.04",
                          "--noise-scale", "0.6", "--noise-w-scale", "0.7", "--sentence-silence", "0.3"],
                         input=text[4:].encode(), capture_output=True, check=True).stdout
    x = np.frombuffer(raw, np.int16).astype(np.float32) / 32768
    nz = np.where(np.abs(x) > 0.008)[0]
    x = x[max(0, nz[0] - 300): nz[-1] + 1500]
    f = int(0.01 * SR); x[:f] *= np.linspace(0, 1, f); x[-f:] *= np.linspace(1, 0, f)
    x = x / np.abs(x).max() * 0.9
    with wave.open(str(wav), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x * 32767).astype(np.int16).tobytes())
    sig.write_text(text)


with ThreadPoolExecutor(4) as ex: list(ex.map(synth, lines))
dur = {}
for k in lines:
    with wave.open(str(VO / f"{k}.wav")) as w: dur[k] = round(w.getnframes() / w.getframerate(), 3)
(D / "voice.js").write_text(f"window.VOICE = {json.dumps(dur, ensure_ascii=False)};\n")
print(len(lines), "جمله", round(sum(dur.values()) / 60, 1), "دقیقه")
