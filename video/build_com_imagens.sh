#!/bin/bash
# Monta o vídeo 9:16 (60s) a partir de imagens reais em imagens/01.jpg ... 10.jpg
# (uma por cena, mesma ordem dos textos do build.sh). Efeito suave de zoom (Ken Burns),
# escurecimento leve para legibilidade, texto com fade e trilha em musica.mp3 (se existir).
set -e
F=/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf
mkdir -p parts; rm -f parts/list.txt
i=0
while IFS= read -r text; do
  i=$((i+1)); n=$(printf '%02d' $i)
  img=$(ls imagens/$n.* 2>/dev/null | head -1) || true
  [ -z "$img" ] && { echo "Falta imagens/$n.jpg"; exit 1; }
  printf '%b' "$text" > parts/t$i.txt
  ffmpeg -nostdin -y -loglevel error -i "$img" -frames:v 180 -vf \
   "scale=1296:2304:force_original_aspect_ratio=increase,crop=1296:2304,zoompan=z='1+0.0008*on':d=180:s=1080x1920:fps=30,eq=brightness=0.04:saturation=0.95,drawtext=fontfile=$F:textfile=parts/t$i.txt:fontcolor=white:fontsize=52:line_spacing=22:x=(w-text_w)/2:y=h-420:alpha='if(lt(t,1),t,if(gt(t,5),6-t,1))':shadowcolor=black@0.7:shadowx=2:shadowy=2" \
   -c:v libx264 -pix_fmt yuv420p parts/p$i.mp4
  echo "file 'p$i.mp4'" >> parts/list.txt
done <<'SCENES'
O futuro é uma astronave\nque tentamos pilotar…
ninguém sabe ao certo\nonde vai dar.
Mas existe uma coisa\nque a gente pode escolher:
Deixar o caminho preparado\npara quem a gente ama.
Um primeiro sorriso.\nUm primeiro passo.
Uma vida inteira\npela frente.
O seguro de vida\nnão é sobre o fim.
É sobre garantir que a vida deles\ncontinue: estudo, casa, sonho,\ntranquilidade.
Porque quem ama,\nprotege.
Proteja quem você ama.\n\nFale com a Quadrata Seguros.
SCENES
ffmpeg -nostdin -y -loglevel error -f concat -safe 0 -i parts/list.txt -c copy parts/video.mp4
if [ -f musica.mp3 ]; then
  ffmpeg -nostdin -y -loglevel error -i parts/video.mp4 -i musica.mp3 -filter_complex "[1:a]afade=t=in:d=3,afade=t=out:st=56:d=4[a]" -map 0:v -map "[a]" -c:v copy -c:a aac -shortest quadrata_seguro_vida.mp4
else
  cp parts/video.mp4 quadrata_seguro_vida.mp4
fi
echo "OK: quadrata_seguro_vida.mp4"
