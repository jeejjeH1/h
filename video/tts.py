"""ساخت صدای گوینده از متن narration.js با موتور متن‌باز Piper (اجرا روی همین سیستم).

استفاده:
    python3 tts.py                              # صدای پیش‌فرض
    PIPER_VOICE=fa_IR-amir-medium python3 tts.py   # صدای دیگر

خروجی: out/voice/*.wav و فایل voice.js (طول هر جمله) که scenes.js از آن برای زمان‌بندی استفاده می‌کند.
نخستین اجرا مدل صدا را از huggingface.co دریافت می‌کند (در out/models نگه داشته می‌شود).
"""
import json
import os
import subprocess
import sys
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

DIR = Path(__file__).parent
OUT = DIR / "out" / "voice"
OUT.mkdir(parents=True, exist_ok=True)
MODELS = DIR / "out" / "models"
MODELS.mkdir(parents=True, exist_ok=True)
VOICE = os.environ.get("PIPER_VOICE", "fa_IR-gyro-medium")
SPEED = float(os.environ.get("LENGTH_SCALE", "1.05"))  # بزرگ‌تر = آهسته‌تر

lang, name, quality = VOICE.split("-")
base = f"https://huggingface.co/rhasspy/piper-voices/resolve/main/{lang.split('_')[0]}/{lang}/{name}/{quality}/{VOICE}"
model = MODELS / f"{VOICE}.onnx"
for suffix in (".onnx", ".onnx.json"):
    dst = MODELS / f"{VOICE}{suffix}"
    if not dst.exists():
        print("دریافت", dst.name)
        urllib.request.urlretrieve(base + suffix, dst)

nar = json.loads(subprocess.check_output(
    ["node", "-e", "require('./narration.js'); process.stdout.write(JSON.stringify(globalThis.NARRATION))"], cwd=DIR))

lines = {}
for i, t in enumerate(nar["intro"]):
    lines[f"intro_{i}"] = t
for title, t in nar["chapters"].items():
    lines[f"chapter_{title}"] = t
for short, e in nar["eras"].items():
    lines[f"era_{short}_intro"] = e["intro"]
    for i, b in enumerate(e["bullets"]):
        lines[f"era_{short}_b{i}"] = b
for i, t in enumerate(nar["outro"]):
    lines[f"outro_{i}"] = t

# فرهنگ تلفظ: افزودن اعراب به واژه‌هایی که موتور صدا اشتباه می‌خواند
PRON = json.loads((DIR / "pronounce.json").read_text())
import re as _re
_pat = _re.compile("|".join(sorted(map(_re.escape, PRON), key=len, reverse=True)))
_fa = "\u0600-\u06FF\u200c"
def fix(text):
    # فقط واژه‌های کامل جایگزین می‌شوند
    return _re.sub(f"(?<![{_fa}])(" + _pat.pattern + f")(?![{_fa}])", lambda m: PRON[m.group(1)], text)
lines = {k: fix(v) for k, v in lines.items()}

keys = list(lines)
fname = {k: f"{n:03d}" for n, k in enumerate(keys)}
SIG = f"{VOICE}|{SPEED}|"


def synth(k):
    wav = OUT / f"{fname[k]}.wav"
    sig = OUT / f"{fname[k]}.txt"
    if wav.exists() and sig.exists() and sig.read_text() == SIG + lines[k]:
        return
    raw = OUT / f"{fname[k]}.raw.wav"
    subprocess.run([sys.executable, "-m", "piper", "-m", str(model), "-f", str(raw),
                    "--length-scale", str(SPEED), "--sentence-silence", "0.3"],
                   input=lines[k].encode(), check=True, capture_output=True)
    # حذف سکوت ابتدا و انتها، تبدیل به ۴۸ کیلوهرتز
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(raw), "-af",
                    "silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse",
                    "-ar", "48000", "-ac", "1", str(wav)], check=True)
    raw.unlink()
    sig.write_text(SIG + lines[k])


with ThreadPoolExecutor(4) as ex:
    list(ex.map(synth, keys))

dur = {}
for k in keys:
    d = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                       "-of", "csv=p=0", str(OUT / f"{fname[k]}.wav")]))
    dur[k] = round(d, 3)
(DIR / "voice.js").write_text(
    "// تولیدشده با tts.py — طول هر جملهٔ گوینده (ثانیه) و نام فایل آن\n"
    f"(function (r) {{ r.VOICE = {json.dumps(dur, ensure_ascii=False)}; r.VOICE_FILES = {json.dumps(fname, ensure_ascii=False)}; }})"
    "(typeof window !== 'undefined' ? window : globalThis);\n")
print(f"{len(keys)} جمله، مجموع {sum(dur.values()) / 60:.1f} دقیقه، صدا: {VOICE}")
