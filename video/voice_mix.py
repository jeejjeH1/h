"""چیدن جمله‌های گوینده روی خط زمان ← out/voice.wav"""
import json
import subprocess
import wave
from pathlib import Path

import numpy as np

DIR = Path(__file__).parent
tl = json.loads((DIR / "out" / "timeline.json").read_text())
files = json.loads(subprocess.check_output(
    ["node", "-e", "require('./voice.js'); process.stdout.write(JSON.stringify(globalThis.VOICE_FILES))"], cwd=DIR))
SR = 48000
track = np.zeros(int((tl["total"] + 1) * SR), dtype=np.float32)
for s in tl["scenes"]:
    for v in s["voice"]:
        with wave.open(str(DIR / "out" / "voice" / f"{files[v['key']]}.wav")) as w:
            x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
        i = int((s["start"] + v["t"]) * SR)
        track[i:i + len(x)] += x[: len(track) - i]
track = track[: int(tl["total"] * SR)]
track /= max(1e-6, np.abs(track).max()) / 0.9
with wave.open(str(DIR / "out" / "voice.wav"), "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((track * 32767).astype(np.int16).tobytes())
print("voice.wav ok")
