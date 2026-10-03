"""ساخت صدای گوینده از متن narration.js با صدای عصبی فارسی.

استفاده:
    python3 tts.py                 # صدای پیش‌فرض: fa-IR-FaridNeural (مرد)
    VOICE=fa-IR-DilaraNeural python3 tts.py   # صدای زن

خروجی: out/voice/*.wav و فایل voice.js (طول هر جمله) که scenes.js از آن برای زمان‌بندی استفاده می‌کند.
نیازمند دسترسی شبکه به speech.platform.bing.com
"""
import asyncio
import json
import os
import ssl
import subprocess
from pathlib import Path

import edge_tts
import edge_tts.communicate as comm

DIR = Path(__file__).parent
OUT = DIR / "out" / "voice"
OUT.mkdir(parents=True, exist_ok=True)
VOICE = os.environ.get("VOICE", "fa-IR-FaridNeural")
RATE = os.environ.get("RATE", "-4%")

# استفاده از گواهی پراکسی در صورت وجود
ca = os.environ.get("SSL_CERT_FILE") or "/root/.ccr/ca-bundle.crt"
if Path(ca).exists():
    comm._SSL_CTX = ssl.create_default_context(cafile=ca)

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

keys = list(lines)
fname = {k: f"{n:03d}" for n, k in enumerate(keys)}


async def synth(k, sem):
    wav = OUT / f"{fname[k]}.wav"
    if wav.exists() and (OUT / f"{fname[k]}.txt").read_text() == VOICE + RATE + lines[k]:
        return
    mp3 = OUT / f"{fname[k]}.mp3"
    async with sem:
        for attempt in range(4):
            try:
                await edge_tts.Communicate(lines[k], VOICE, rate=RATE).save(str(mp3))
                break
            except Exception as e:  # تلاش دوباره در خطای شبکه
                if attempt == 3:
                    raise
                await asyncio.sleep(2 ** attempt)
    # حذف سکوت ابتدا و انتها، تبدیل به wav
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(mp3), "-af",
                    "silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse",
                    "-ar", "48000", "-ac", "1", str(wav)], check=True)
    (OUT / f"{fname[k]}.txt").write_text(VOICE + RATE + lines[k])
    mp3.unlink()


async def main():
    sem = asyncio.Semaphore(4)
    await asyncio.gather(*(synth(k, sem) for k in keys))


asyncio.run(main())

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
