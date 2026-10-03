#!/usr/bin/env bash
# ساخت کامل ویدیو: گوینده → تصویر → موسیقی → ترکیب نهایی → تصویر بندانگشتی و توضیحات یوتیوب
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p out dist

python3 tts.py             # out/voice/*.wav و voice.js (زمان‌بندی صحنه‌ها از روی طول جمله‌ها)
node render.mjs            # out/frames.mp4 و out/timeline.json
python3 music.py           # out/music.wav
python3 voice_mix.py       # out/voice.wav
node render.mjs --thumb    # out/thumbnail.png

# موسیقی هنگام صحبت گوینده آرام می‌شود (ducking)؛ سپس یکسان‌سازی بلندی صدا برای یوتیوب (‎-14 LUFS)
ffmpeg -y -loglevel error -i out/frames.mp4 -i out/music.wav -i out/voice.wav \
  -filter_complex "[1:a]aecho=0.8:0.6:90|170|310:0.22|0.15|0.09,aresample=48000,aformat=channel_layouts=stereo,volume=0.75[m];\
[2:a]aresample=48000,aformat=channel_layouts=stereo,highpass=f=70,acompressor=threshold=0.1:ratio=3:attack=5:release=120,asplit=2[v][sc];\
[m][sc]sidechaincompress=threshold=0.02:ratio=10:attack=30:release=600:makeup=1[md];\
[md][v]amix=inputs=2:normalize=0:weights='1 1.5',loudnorm=I=-14:TP=-1.5:LRA=11[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -ar 48000 -movflags +faststart -shortest \
  dist/iran-history.mp4

cp out/thumbnail.png dist/thumbnail.png
python3 youtube.py > /dev/null
ls -lh dist
