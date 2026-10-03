#!/usr/bin/env bash
# ساخت کامل ویدیو: تصویر → موسیقی → ترکیب نهایی → تصویر بندانگشتی و توضیحات یوتیوب
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p out dist

node render.mjs            # out/frames.mp4 و out/timeline.json
python3 music.py           # out/music.wav
node render.mjs --thumb    # out/thumbnail.png

# ترکیب صدا و تصویر؛ کمی پژواک و یکسان‌سازی بلندی صدا برای یوتیوب (‎-14 LUFS)
ffmpeg -y -loglevel error -i out/frames.mp4 -i out/music.wav \
  -filter_complex "[1:a]aecho=0.8:0.6:90|170|310:0.22|0.15|0.09,loudnorm=I=-14:TP=-1.5:LRA=11[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -ar 48000 -movflags +faststart -shortest \
  dist/iran-history.mp4

cp out/thumbnail.png dist/thumbnail.png
python3 youtube.py > /dev/null
ls -lh dist
