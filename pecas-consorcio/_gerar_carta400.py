# -*- coding: utf-8 -*-
"""Gera a peça da carta de R$ 400 mil como SVG autocontido.

Posicionamento à prova de troca de fonte: valores que andam juntos ficam num
único <text> com <tspan dx>, e blocos centrados usam text-anchor em vez de x
calculado. Assim, se o Canva substituir a Archivo, nada se sobrepõe.
"""
import base64, io, os

BASE = os.path.dirname(os.path.abspath(__file__))
b64 = lambda p: base64.b64encode(open(os.path.join(BASE, p), 'rb').read()).decode()
FONTE, LOGO = b64('archivo-latin.woff2'), b64('quadrata-logo.png')

CREDITO, CHEIA, REDUZIDA, ECONOMIA = 'R$ 400 MIL', 'R$ 2.420,00', 'R$ 1.219', 'R$ 1.201'

FUNDO = '''  <g id="fundo">
    <rect x="0" y="0" width="1080" height="1350" fill="url(#gradFundo)"/>
    <rect x="0" y="0" width="1080" height="1350" fill="url(#brilho)"/>
    <g stroke="#4FE3F0" fill="none" opacity="0.17">
      <circle cx="990" cy="205" r="172" stroke-width="3"/>
      <circle cx="990" cy="205" r="132" stroke-width="1.5"/>
    </g>
    <text x="990" y="252" text-anchor="middle" font-size="140" font-weight="800" fill="#4FE3F0" opacity="0.15">%</text>
  </g>
'''


def montar(com_fundo):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     width="1080" height="1350" viewBox="0 0 1080 1350" font-family="Archivo, 'Helvetica Neue', Helvetica, Arial, sans-serif">
  <title>Consórcio — carta de crédito de {CREDITO}</title>
  <defs>
    <style type="text/css">
      @font-face {{
        font-family: 'Archivo';
        font-style: normal;
        font-weight: 100 900;
        src: url(data:font/woff2;base64,{FONTE}) format('woff2');
      }}
    </style>
    <linearGradient id="gradFundo" x1="0" y1="0" x2="0.55" y2="1">
      <stop offset="0%" stop-color="#0D46A0"/>
      <stop offset="46%" stop-color="#0A2E6B"/>
      <stop offset="100%" stop-color="#061A38"/>
    </linearGradient>
    <radialGradient id="brilho" cx="0.5" cy="0.18" r="0.62">
      <stop offset="0%" stop-color="#1A6FE0" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#061A38" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="gradPainel" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#04101F" stop-opacity="0"/>
      <stop offset="20%" stop-color="#04101F" stop-opacity="0.72"/>
      <stop offset="32%" stop-color="#04101F" stop-opacity="0.90"/>
      <stop offset="100%" stop-color="#04101F" stop-opacity="0.95"/>
    </linearGradient>
  </defs>

{FUNDO if com_fundo else '  <!-- sem fundo: coloque a foto atrás desta camada -->'}

  <rect id="degrade-inferior" x="0" y="400" width="1080" height="950" fill="url(#gradPainel)"/>

  <g id="logotipo">
    <rect x="72" y="64" width="168" height="225" rx="18" fill="#FFFFFF"/>
    <image x="86" y="78" width="140" height="196" xlink:href="data:image/png;base64,{LOGO}"/>
  </g>

  <g id="tarja-prazo">
    <rect x="660" y="78" width="348" height="52" rx="26" fill="#4FE3F0"/>
    <text x="834" y="113" text-anchor="middle" font-size="26" font-weight="800" letter-spacing="2.3" fill="#06284A">VÁLIDO ATÉ 28/08</text>
  </g>

  <g id="titulo" font-size="72" font-weight="800" letter-spacing="-2.2" fill="#FFFFFF">
    <text x="72" y="690">CARTA DE</text>
    <text x="72" y="768">CRÉDITO</text>
    <text x="72" y="846">{CREDITO}</text>
  </g>

  <g id="parcela">
    <rect x="638" y="640" width="370" height="42" rx="21" fill="#FFFFFF"/>
    <text x="823" y="668" text-anchor="middle" font-size="20" font-weight="700" letter-spacing="1.1" fill="#092649">PARCELA COM 50% DE REDUTOR</text>
    <rect x="596" y="700" width="412" height="104" rx="6" fill="#071426" stroke="#FFFFFF" stroke-width="2"/>
    <text x="802" y="770" text-anchor="middle" font-size="60" font-weight="800" letter-spacing="-1.8" fill="#FFFFFF">{REDUZIDA}<tspan dx="12" font-size="26" font-weight="600" letter-spacing="0" fill="#A9C6EE">/mês</tspan></text>
    <text x="1008" y="854" text-anchor="end" font-size="24" font-weight="500" fill="#A9C6EE">em vez de {CHEIA} por mês</text>
  </g>

  <g id="atributos">
    <rect x="72" y="900" width="936" height="104" rx="16" fill="#FFFFFF" fill-opacity="0.07" stroke="#FFFFFF" stroke-opacity="0.18" stroke-width="1"/>
    <line x1="384" y1="928" x2="384" y2="976" stroke="#FFFFFF" stroke-opacity="0.18" stroke-width="1"/>
    <line x1="696" y1="928" x2="696" y2="976" stroke="#FFFFFF" stroke-opacity="0.18" stroke-width="1"/>
    <g text-anchor="middle" font-size="20" font-weight="600" letter-spacing="2" fill="#8FB2DC">
      <text x="228" y="946">ENTRADA</text>
      <text x="540" y="946">JUROS</text>
      <text x="852" y="946">ECONOMIA POR MÊS</text>
    </g>
    <g text-anchor="middle" font-size="34" font-weight="800" letter-spacing="-0.8" fill="#FFFFFF">
      <text x="228" y="986">Não tem</text>
      <text x="540" y="986">Zero</text>
      <text x="852" y="986">{ECONOMIA}</text>
    </g>
  </g>

  <g id="contato">
    <rect x="72" y="1044" width="348" height="84" rx="42" fill="#FFFFFF"/>
    <text x="246" y="1098" text-anchor="middle" font-size="32" font-weight="800" letter-spacing="0.5" fill="#092649">QUERO SIMULAR</text>
    <rect x="448" y="1044" width="560" height="84" rx="42" fill="none" stroke="#FFFFFF" stroke-opacity="0.38" stroke-width="2"/>
    <g transform="translate(486,1062) scale(1.25)" fill="none" stroke="#FFFFFF" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-3.4-.7L3 21l1.9-5.1A8.2 8.2 0 0 1 4 11.5a8.4 8.4 0 0 1 9-8.4 8.4 8.4 0 0 1 8 8.4z"/>
    </g>
    <text x="536" y="1098" font-size="24" font-weight="600" fill="#A9C6EE">WhatsApp<tspan dx="14" font-size="34" font-weight="800" letter-spacing="-0.6" fill="#FFFFFF">(11) 98678-0000</tspan></text>
  </g>

  <g id="letra-miuda" font-size="18" font-weight="400" fill="#8FAAC9">
    <text x="72" y="1190">Consórcio não é financiamento: não há juros, apenas taxa de administração e fundo de reserva.</text>
    <text x="72" y="1217">Parcela reduzida em 50% até a contemplação; depois disso volta ao valor cheio de {CHEIA}.</text>
    <text x="72" y="1244">Contemplação por sorteio ou lance. Valores sujeitos a alteração. Consulte condições.</text>
  </g>
</svg>
'''


for nome, com_fundo in (('carta-400mil.svg', True), ('carta-400mil-sem-fundo.svg', False)):
    svg = montar(com_fundo)
    io.open(os.path.join(BASE, nome), 'w', encoding='utf-8').write(svg)
    print('%-30s %.0f KB' % (nome, len(svg.encode('utf-8')) / 1024))
    html = ('<!doctype html><html><head><meta charset="utf-8"><style>'
            '@page { size: 1080px 1350px; margin: 0; }'
            'html,body { margin:0; padding:0; width:1080px; height:1350px; }'
            'svg { display:block; }</style></head><body>' + svg + '</body></html>')
    io.open(os.path.join(BASE, '_render_' + nome.replace('.svg', '.html')), 'w', encoding='utf-8').write(html)
