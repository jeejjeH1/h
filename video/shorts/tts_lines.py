"""ساخت صدای گوینده برای یک شورت از lines.json ← <dir>/voice/NN.wav و <dir>/voice.js"""
import json, re, subprocess, sys
from pathlib import Path

D = Path(sys.argv[1])
ROOT = Path(__file__).parent.parent
MODEL = ROOT / "out" / "models" / "fa_IR-ganji-medium.onnx"
PRON = json.loads((ROOT / "pronounce.json").read_text())
fa = "؀-ۿ‌"
pat = re.compile(f"(?<![{fa}])(" + "|".join(sorted(map(re.escape, PRON), key=len, reverse=True)) + f")(?![{fa}])")
lines = json.loads((D / "lines.json").read_text())
(D / "voice").mkdir(exist_ok=True)
dur = []
for i, t in enumerate(lines):
    t = pat.sub(lambda m: PRON[m.group(1)], t)
    raw, wav = D / "voice" / f"{i:02d}.raw.wav", D / "voice" / f"{i:02d}.wav"
    subprocess.run([sys.executable, "-m", "piper", "-m", str(MODEL), "-f", str(raw), "--length-scale", "0.92",
                    "--sentence-silence", "0.25"], input=t.encode(), check=True, capture_output=True)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(raw), "-af",
                    "silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse",
                    "-ar", "48000", "-ac", "1", str(wav)], check=True)
    raw.unlink()
    dur.append(round(float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(wav)])), 3))
(D / "voice.js").write_text(f"window.VOICE = {json.dumps(dur)};\n")
print(dur, round(sum(dur), 1))
