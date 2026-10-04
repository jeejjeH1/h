"""صدای گوینده (زن) با مدل VITS فارسی ← voice/NN.wav و voice.js
اجرا با محیط مجازی coqui: /root/ttsenv/bin/python tts_female.py"""
import json, subprocess, warnings
from pathlib import Path
warnings.filterwarnings("ignore")
from TTS.utils.synthesizer import Synthesizer

D = Path(__file__).parent
M = D.parent.parent / "out" / "models" / "female1"
syn = Synthesizer(tts_checkpoint=str(M / "best_model_111741.pth"), tts_config_path=str(M / "config.json"))
lines = json.loads((D / "lines.json").read_text())
(D / "voice").mkdir(exist_ok=True)
dur = []
for i, t in enumerate(lines):
    t = t.replace("…", "،")
    raw, wav = D / "voice" / f"{i:02d}.raw.wav", D / "voice" / f"{i:02d}.wav"
    syn.save_wav(syn.tts(t), str(raw))
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(raw), "-af",
                    "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,atempo=1.04",
                    "-ar", "48000", "-ac", "1", str(wav)], check=True)
    raw.unlink()
    dur.append(round(float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(wav)])), 3))
(D / "voice.js").write_text(f"window.VOICE = {json.dumps(dur)};\n")
print(dur, round(sum(dur), 1))
