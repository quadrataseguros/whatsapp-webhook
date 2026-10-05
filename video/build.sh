#!/bin/bash
# Versão rascunho: vídeo tipográfico 1080x1920, 60s, com trilha ambiente provisória.
set -e
F=/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf
mkdir -p parts
i=0
while IFS='|' read -r c0 c1 text; do
  i=$((i+1))
  printf '%b' "$text" > parts/t$i.txt
  ffmpeg -nostdin -y -loglevel error -f lavfi -i "gradients=s=1080x1920:d=6:c0=$c0:c1=$c1:speed=0.03:rate=30" \
    -vf "vignette=PI/4,drawtext=fontfile=$F:textfile=parts/t$i.txt:fontcolor=white:fontsize=52:line_spacing=22:x=(w-text_w)/2:y=(h-text_h)/2:alpha='if(lt(t,1),t,if(gt(t,5),6-t,1))':shadowcolor=black@0.5:shadowx=2:shadowy=2" \
    -c:v libx264 -pix_fmt yuv420p parts/p$i.mp4
  echo "file 'p$i.mp4'" >> parts/list.txt.tmp
done <<'SCENES'
0x1b2a3a|0x6b4f3a|O futuro é uma astronave\nque tentamos pilotar…
0x2c3e50|0xb08968|ninguém sabe ao certo\nonde vai dar.
0x7a5c45|0xe0b97a|Mas existe uma coisa\nque a gente pode escolher:
0x3b4a5a|0xd9a566|Deixar o caminho preparado\npara quem a gente ama.
0x5a4636|0xf2cf9a|Um primeiro sorriso.\nUm primeiro passo.
0x264653|0xe9c46a|Uma vida inteira\npela frente.
0x1f3b4d|0xc9a27a|O seguro de vida\nnão é sobre o fim.
0x6a4e3a|0xf4d9a8|É sobre garantir que a vida deles\ncontinue: estudo, casa, sonho,\ntranquilidade.
0x2b3a4a|0xe6b980|Porque quem ama,\nprotege.
0x1b2a3a|0x8a6a4a|Proteja quem você ama.\n\nFale com a Quadrata Seguros.
SCENES
mv parts/list.txt.tmp parts/list.txt
ffmpeg -y -loglevel error -f concat -safe 0 -i parts/list.txt -c copy parts/video.mp4
# trilha ambiente provisória (acorde suave) — substituir por "Aquarela" licenciada
ffmpeg -y -loglevel error -f lavfi -i "sine=f=220:d=60" -f lavfi -i "sine=f=277.18:d=60" -f lavfi -i "sine=f=329.63:d=60" \
  -filter_complex "[0][1][2]amix=inputs=3,volume=0.35,tremolo=f=0.15:d=0.4,afade=t=in:d=4,afade=t=out:st=55:d=5,lowpass=f=900" parts/pad.m4a
ffmpeg -y -loglevel error -i parts/video.mp4 -i parts/pad.m4a -c:v copy -c:a aac -shortest quadrata_seguro_vida_rascunho.mp4
