#!/bin/bash
# Monta o vídeo 9:16 a partir de imagens em imagens/NN.jpg (cada cena = 6 s).
# Cada linha de SCENES é "NN|texto" (NN = imagem usada). Trilha opcional: musica.mp3.
set -e
F=/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf
mkdir -p parts; rm -f parts/list.txt
i=0
while IFS='|' read -r n text; do
  i=$((i+1))
  img=$(ls imagens/$n.* 2>/dev/null | head -1) || true
  [ -z "$img" ] && { echo "Falta imagens/$n.jpg"; exit 1; }
  printf '%b' "$text" > parts/t$i.txt
  ffmpeg -nostdin -y -loglevel error -i "$img" -frames:v 180 -vf \
   "scale=1296:2304:force_original_aspect_ratio=increase,crop=1296:2304,zoompan=z='1+0.0008*on':d=180:s=1080x1920:fps=30,eq=brightness=0.05:contrast=1.1:saturation=1.9,colorbalance=rs=.08:gs=.02:bs=-.10:rm=.06:bm=-.06:rh=.08:bh=-.08,drawtext=fontfile=$F:textfile=parts/t$i.txt:fontcolor=white:fontsize=52:line_spacing=22:x=(w-text_w)/2:y=h-420:alpha='if(lt(t,1),t,if(gt(t,5),6-t,1))':shadowcolor=black@0.7:shadowx=2:shadowy=2" \
   -c:v libx264 -pix_fmt yuv420p parts/p$i.mp4
  echo "file 'p$i.mp4'" >> parts/list.txt
done <<'SCENES'
01|O futuro é uma astronave\nque tentamos pilotar…
02|ninguém sabe ao certo\nonde vai dar.
03|Mas existe uma coisa\nque a gente pode escolher:
04|Deixar o caminho preparado\npara quem a gente ama.
05|Um primeiro sorriso.\nUm primeiro passo.
06|Uma vida inteira\npela frente.
07|O seguro de vida\nnão é sobre o fim.
08|É sobre garantir que a vida deles\ncontinue: estudo, casa, sonho,\ntranquilidade.
09|Porque quem ama,\nprotege.
10|Por que fazer seu\nseguro de vida\ncom a Quadrata?
03|Atendimento próximo,\nde pessoa para pessoa.
08|Orientação sob medida\npara a sua família\ne o seu orçamento.
05|Ao seu lado desde a contratação\naté o momento\nem que você mais precisar.
10|Proteja quem você ama.\n\nFale com a Quadrata Seguros.
SCENES
ffmpeg -nostdin -y -loglevel error -f concat -safe 0 -i parts/list.txt -c copy parts/video.mp4
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 parts/video.mp4)
if [ -f musica.mp3 ]; then
  ffmpeg -nostdin -y -loglevel error -i parts/video.mp4 -i musica.mp3 -filter_complex "[1:a]afade=t=in:d=3,afade=t=out:st=$(echo "$DUR-4" | bc):d=4[a]" -map 0:v -map "[a]" -c:v copy -c:a aac -shortest quadrata_seguro_vida.mp4
else
  cp parts/video.mp4 quadrata_seguro_vida.mp4
fi
echo "OK: quadrata_seguro_vida.mp4 ($DUR s)"
