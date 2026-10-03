#!/usr/bin/env bash
# ساخت شورت عمودی یوتیوب از صحنهٔ هخامنشیان (نیازمند dist/iran-history.mp4 و out/music.wav و out/voice.wav)
set -euo pipefail
cd "$(dirname "$0")"
S=120.727; D=50.372; T=57.87
node overlays.mjs
python3 make_audio.py
ffmpeg -loglevel error -y -ss $S -t $D -i ../dist/iran-history.mp4 \
  -loop 1 -t $T -i header.png -loop 1 -t $T -i endcard.png -loop 1 -t $T -i caption.png \
  -i music_s.wav -i voice_s.wav -filter_complex "\
[0:v]tpad=stop_mode=clone:stop_duration=7.5,split=3[a][b][c];\
[a]scale=-2:1920,crop=1080:1920,boxblur=30:3,eq=brightness=-0.18[bg];\
[b]crop=1080:780:90:160,zoompan=z='min(1+on/30/120,1.18)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1080x780:fps=30[map];\
[c]crop=780:560:1100:400,scale=1014:728[panel];\
[bg][map]overlay=0:300[t1];[t1][panel]overlay=33:1100[t2];\
[3:v]format=rgba,fade=in:st=0.3:d=0.4:alpha=1,fade=out:st=7.3:d=0.4:alpha=1[cap];[t2][cap]overlay=0:1100:enable='lt(t,7.8)'[t2c];\
[t2c][1:v]overlay=0:0[t3];\
[t3]drawbox=x=0:y=1080:w=1080:h=3:color=0xe0b354@0.6:t=fill,drawbox=x=0:y=1904:w=1080:h=16:color=black@0.5:t=fill,drawbox=x=0:y=1904:w='1080*t/$T':h=16:color=0xffc93c:t=fill[t4];\
[2:v]format=rgba,fade=in:st=50.4:d=0.5:alpha=1[ec];[t4][ec]overlay=0:0:enable='gte(t,50.4)'[v];\
[4:a]aresample=48000,aformat=channel_layouts=stereo,volume=0.8[m];\
[5:a]aresample=48000,aformat=channel_layouts=stereo,highpass=f=70,acompressor=threshold=0.1:ratio=3:attack=5:release=120,asplit=2[vo][sc];\
[m][sc]sidechaincompress=threshold=0.02:ratio=10:attack=30:release=600[md];\
[md][vo]amix=inputs=2:normalize=0:weights='1 1.5',loudnorm=I=-14:TP=-1.5:LRA=11[aout]" \
  -map "[v]" -map "[aout]" -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -r 30 \
  -c:a aac -b:a 160k -movflags +faststart -t $T ../dist/iran-history-short.mp4
ls -lh ../dist/iran-history-short.mp4
