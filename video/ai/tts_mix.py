"""ساخت صدای گوینده با دو صدا: فارسی (Piper ganji) و واژه‌های لاتین با صدای انگلیسی (Piper joe)
خروجی: voice/<key>.wav و voice.js (طول هر جمله)"""
import json, re, subprocess, sys, wave
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import numpy as np

D = Path(__file__).parent
M = D.parent / "out" / "models"
FA_MODEL, EN_MODEL = M / "fa_IR-ganji-medium.onnx", M / "en_US-joe-medium.onnx"
PRON = json.loads((D.parent / "pronounce.json").read_text())
fa_ch = "؀-ۿ‌"
pron_re = re.compile(f"(?<![{fa_ch}])(" + "|".join(sorted(map(re.escape, PRON), key=len, reverse=True)) + f")(?![{fa_ch}])")
LAT = re.compile(r"([A-Za-z][A-Za-z0-9\-\.]*(?:\s+[A-Za-z0-9][A-Za-z0-9\-\.]*)*)")
EN_FIX = {"GPT-3": "G P T three", "GPT": "G P T", "ChatGPT": "Chat G P T", "MIT": "M I T", "IBM": "I B M", "T": "T"}
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


def piper(model, text, scale):
    out = subprocess.run([sys.executable, "-m", "piper", "-m", str(model), "--output-raw", "--length-scale", str(scale), "--sentence-silence", "0.2"],
                         input=text.encode(), capture_output=True, check=True).stdout
    x = np.frombuffer(out, np.int16).astype(np.float32) / 32768
    nz = np.where(np.abs(x) > 0.01)[0]  # حذف سکوت دو طرف
    return x[max(0, nz[0] - 200): nz[-1] + 400] if len(nz) else x


def rms_to(x, target=0.08):
    r = np.sqrt(np.mean(x ** 2)) + 1e-9
    return x * (target / r)


def synth(key):
    wav = VO / f"{key}.wav"; sig = VO / f"{key}.txt"
    text = lines[key]
    if wav.exists() and sig.exists() and sig.read_text() == text: return
    parts = [p for p in LAT.split(text) if p.strip()]
    chunks = []
    for p in parts:
        if LAT.fullmatch(p.strip()):
            w = p.strip()
            x = piper(EN_MODEL, EN_FIX.get(w, w), 1.0)
            x = rms_to(x, 0.075)
        else:
            x = piper(FA_MODEL, pron_re.sub(lambda m: PRON[m.group(1)], p.strip()), 1.0)
            x = rms_to(x, 0.08)
        chunks += [x, np.zeros(int(0.07 * SR), np.float32)]
    y = np.concatenate(chunks[:-1])
    y = y / max(1e-6, np.abs(y).max()) * 0.9
    with wave.open(str(wav), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((y * 32767).astype(np.int16).tobytes())
    sig.write_text(text)


with ThreadPoolExecutor(4) as ex: list(ex.map(synth, lines))
dur = {}
for k in lines:
    with wave.open(str(VO / f"{k}.wav")) as w: dur[k] = round(w.getnframes() / w.getframerate(), 3)
(D / "voice.js").write_text(f"window.VOICE = {json.dumps(dur, ensure_ascii=False)};\n")
print(len(lines), "جمله", round(sum(dur.values()) / 60, 1), "دقیقه")
