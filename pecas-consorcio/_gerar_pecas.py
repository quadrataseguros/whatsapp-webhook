# -*- coding: utf-8 -*-
"""Gera as peças de consórcio como SVG autocontido (fonte e logo embutidos).

Todas as peças saem dos mesmos componentes — logotipo, tarja de prazo, barra de
atributos, barra de contato e letra miúda —, então o padrão visual é garantido
pela estrutura e não à mão. O que muda entre elas é só o bloco de destaque.

Posicionamento à prova de troca de fonte: o que anda junto fica num único <text>
com <tspan dx>, e blocos centrados usam text-anchor em vez de x calculado. Se o
Canva substituir a Archivo por uma fonte mais larga, nada se sobrepõe.
"""
import base64, io, os

BASE = os.path.dirname(os.path.abspath(__file__))
b64 = lambda p: base64.b64encode(open(os.path.join(BASE, p), 'rb').read()).decode()
FONTE, LOGO = b64('archivo-latin.woff2'), b64('quadrata-logo.png')

WHATSAPP = '(11) 98678-0000'
PRAZO = 'VÁLIDO ATÉ 28/08'

# ---------------------------------------------------------------- componentes

CABECALHO = f'''  <g id="logotipo">
    <rect x="72" y="64" width="168" height="225" rx="18" fill="#FFFFFF"/>
    <image x="86" y="78" width="140" height="196" xlink:href="data:image/png;base64,{LOGO}"/>
  </g>

  <g id="tarja-prazo">
    <rect x="660" y="78" width="348" height="52" rx="26" fill="#4FE3F0"/>
    <text x="834" y="113" text-anchor="middle" font-size="26" font-weight="800" letter-spacing="2.3" fill="#06284A">{PRAZO}</text>
  </g>
'''

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


def atributos(pares, y):
    """Barra de três células: (rótulo, valor)."""
    rot = '\n'.join(
        f'      <text x="{x}" y="{y + 46}">{r}</text>'
        for x, (r, _) in zip((228, 540, 852), pares))
    val = '\n'.join(
        f'      <text x="{x}" y="{y + 86}">{v}</text>'
        for x, (_, v) in zip((228, 540, 852), pares))
    return f'''  <g id="atributos">
    <rect x="72" y="{y}" width="936" height="104" rx="16" fill="#FFFFFF" fill-opacity="0.07" stroke="#FFFFFF" stroke-opacity="0.18" stroke-width="1"/>
    <line x1="384" y1="{y + 28}" x2="384" y2="{y + 76}" stroke="#FFFFFF" stroke-opacity="0.18" stroke-width="1"/>
    <line x1="696" y1="{y + 28}" x2="696" y2="{y + 76}" stroke="#FFFFFF" stroke-opacity="0.18" stroke-width="1"/>
    <g text-anchor="middle" font-size="20" font-weight="600" letter-spacing="2" fill="#8FB2DC">
{rot}
    </g>
    <g text-anchor="middle" font-size="34" font-weight="800" letter-spacing="-0.8" fill="#FFFFFF">
{val}
    </g>
  </g>
'''


def contato(y):
    return f'''  <g id="contato">
    <rect x="72" y="{y}" width="348" height="84" rx="42" fill="#FFFFFF"/>
    <text x="246" y="{y + 54}" text-anchor="middle" font-size="32" font-weight="800" letter-spacing="0.5" fill="#092649">QUERO SIMULAR</text>
    <rect x="448" y="{y}" width="560" height="84" rx="42" fill="none" stroke="#FFFFFF" stroke-opacity="0.38" stroke-width="2"/>
    <g transform="translate(486,{y + 18}) scale(1.25)" fill="none" stroke="#FFFFFF" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-3.4-.7L3 21l1.9-5.1A8.2 8.2 0 0 1 4 11.5a8.4 8.4 0 0 1 9-8.4 8.4 8.4 0 0 1 8 8.4z"/>
    </g>
    <text x="536" y="{y + 54}" font-size="24" font-weight="600" fill="#A9C6EE">WhatsApp<tspan dx="14" font-size="34" font-weight="800" letter-spacing="-0.6" fill="#FFFFFF">{WHATSAPP}</tspan></text>
  </g>
'''


def letra_miuda(cheia, redutor, y):
    return f'''  <g id="letra-miuda" font-size="18" font-weight="400" fill="#8FAAC9">
    <text x="72" y="{y}">Consórcio não é financiamento: não há juros, apenas taxa de administração e fundo de reserva.</text>
    <text x="72" y="{y + 27}">Parcela reduzida em {redutor} até a contemplação; depois disso volta ao valor cheio de {cheia}.</text>
    <text x="72" y="{y + 54}">Contemplação por sorteio ou lance. Valores sujeitos a alteração. Consulte condições.</text>
  </g>
'''

# ------------------------------------------------------------- blocos de topo


def destaque_credito(credito, reduzida, cheia, selo):
    """Crédito como título à esquerda, parcela em caixa à direita."""
    l1, l2, l3 = credito
    return f'''  <g id="titulo" font-size="72" font-weight="800" letter-spacing="-2.2" fill="#FFFFFF">
    <text x="72" y="690">{l1}</text>
    <text x="72" y="768">{l2}</text>
    <text x="72" y="846">{l3}</text>
  </g>

  <g id="parcela">
    <rect x="638" y="640" width="370" height="42" rx="21" fill="#FFFFFF"/>
    <text x="823" y="668" text-anchor="middle" font-size="20" font-weight="700" letter-spacing="1.1" fill="#092649">{selo}</text>
    <rect x="596" y="700" width="412" height="104" rx="6" fill="#071426" stroke="#FFFFFF" stroke-width="2"/>
    <text x="802" y="770" text-anchor="middle" font-size="60" font-weight="800" letter-spacing="-1.8" fill="#FFFFFF">{reduzida}<tspan dx="12" font-size="26" font-weight="600" letter-spacing="0" fill="#A9C6EE">/mês</tspan></text>
    <text x="1008" y="854" text-anchor="end" font-size="24" font-weight="500" fill="#A9C6EE">em vez de {cheia} por mês</text>
  </g>
'''


def destaque_parcela(inteiro, centavos, cheia, credito=None):
    """Parcela centrada como herói. `credito` é opcional, entra como sobretítulo."""
    linha_credito = (
        f'    <text x="540" y="632" text-anchor="middle" font-size="30" font-weight="700" '
        f'letter-spacing="3" fill="#4FE3F0">CARTA DE CRÉDITO DE {credito}</text>\n'
        if credito else '')
    return f'''  <g id="destaque">
{linha_credito}    <text x="540" y="686" text-anchor="middle" font-size="40" font-weight="700" letter-spacing="6" fill="#A9C6EE">PARCELA DE</text>
    <text x="540" y="836" text-anchor="middle" font-size="140" font-weight="800" letter-spacing="-4" fill="#FFFFFF">{inteiro}<tspan dy="-42" font-size="56" letter-spacing="-1">{centavos}</tspan><tspan dy="42" dx="16" font-size="34" font-weight="600" letter-spacing="0" fill="#A9C6EE">ao mês</tspan></text>
    <text x="540" y="890" text-anchor="middle" font-size="28" font-weight="500" fill="#A9C6EE">em vez de {cheia} por mês</text>
  </g>
'''

# --------------------------------------------------------------------- montagem

CABECA = '''<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     width="1080" height="1350" viewBox="0 0 1080 1350" font-family="Archivo, 'Helvetica Neue', Helvetica, Arial, sans-serif">
  <title>%s</title>
  <defs>
    <style type="text/css">
      @font-face {
        font-family: 'Archivo';
        font-style: normal;
        font-weight: 100 900;
        src: url(data:font/woff2;base64,%s) format('woff2');
      }
    </style>
    <linearGradient id="gradFundo" x1="0" y1="0" x2="0.55" y2="1">
      <stop offset="0%%" stop-color="#0D46A0"/>
      <stop offset="46%%" stop-color="#0A2E6B"/>
      <stop offset="100%%" stop-color="#061A38"/>
    </linearGradient>
    <radialGradient id="brilho" cx="0.5" cy="0.18" r="0.62">
      <stop offset="0%%" stop-color="#1A6FE0" stop-opacity="0.55"/>
      <stop offset="100%%" stop-color="#061A38" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="gradPainel" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%%" stop-color="#04101F" stop-opacity="0"/>
      <stop offset="20%%" stop-color="#04101F" stop-opacity="0.72"/>
      <stop offset="32%%" stop-color="#04101F" stop-opacity="0.90"/>
      <stop offset="100%%" stop-color="#04101F" stop-opacity="0.95"/>
    </linearGradient>
  </defs>
'''


def montar(titulo, destaque, pares, y_atrib, y_contato, y_miuda, cheia, redutor, com_fundo):
    cabeca = CABECA % (titulo, FONTE)
    corpo = (FUNDO if com_fundo else '  <!-- sem fundo: coloque a foto atrás desta camada -->\n')
    return (cabeca + '\n' + corpo +
            '\n  <rect id="degrade-inferior" x="0" y="400" width="1080" height="950" fill="url(#gradPainel)"/>\n\n' +
            CABECALHO + '\n' + destaque + '\n' +
            atributos(pares, y_atrib) + '\n' + contato(y_contato) + '\n' +
            letra_miuda(cheia, redutor, y_miuda) + '</svg>\n')


PECAS = [
    dict(
        nome='carta-400mil',
        titulo='Consórcio — carta de crédito de R$ 400 MIL',
        destaque=destaque_credito(('CARTA DE', 'CRÉDITO', 'R$ 400 MIL'),
                                  'R$ 1.219', 'R$ 2.420,00', 'PARCELA COM 50% DE REDUTOR'),
        pares=[('ENTRADA', 'Não tem'), ('JUROS', 'Zero'), ('ECONOMIA POR MÊS', 'R$ 1.201')],
        y_atrib=900, y_contato=1044, y_miuda=1190,
        cheia='R$ 2.420,00', redutor='50%',
    ),
    dict(
        nome='parcela-1025',
        titulo='Consórcio — parcela de R$ 1.025,00 ao mês',
        # credito=None: a tabela não traz a linha de R$ 2.050,00, então o crédito
        # fica de fora em vez de ser inventado. Basta preencher para ele aparecer.
        destaque=destaque_parcela('R$ 1.025', ',00', 'R$ 2.050,00', credito=None),
        pares=[('ENTRADA', 'Sem'), ('JUROS', 'Zero'), ('REDUTOR', '50%')],
        y_atrib=930, y_contato=1064, y_miuda=1206,
        cheia='R$ 2.050,00', redutor='50%',
    ),
]

for p in PECAS:
    for sufixo, com_fundo in (('', True), ('-sem-fundo', False)):
        svg = montar(p['titulo'], p['destaque'], p['pares'], p['y_atrib'],
                     p['y_contato'], p['y_miuda'], p['cheia'], p['redutor'], com_fundo)
        nome = p['nome'] + sufixo + '.svg'
        io.open(os.path.join(BASE, nome), 'w', encoding='utf-8').write(svg)
        html = ('<!doctype html><html><head><meta charset="utf-8"><style>'
                '@page { size: 1080px 1350px; margin: 0; }'
                'html,body { margin:0; padding:0; width:1080px; height:1350px; }'
                'svg { display:block; }</style></head><body>' + svg + '</body></html>')
        io.open(os.path.join(BASE, '_render_' + p['nome'] + sufixo + '.html'), 'w', encoding='utf-8').write(html)
        print('%-32s %.0f KB' % (nome, len(svg.encode('utf-8')) / 1024))

# ------------------------------------------------- peça quadrada de duas faixas

DEFS_QUADRADO = """    <linearGradient id="grad50" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0%" stop-color="#CBDCFF"/>
      <stop offset="100%" stop-color="#5E9BF2"/>
    </linearGradient>
    <linearGradient id="gradFoto" x1="0" y1="0" x2="0.6" y2="1">
      <stop offset="0%" stop-color="#12489E"/>
      <stop offset="100%" stop-color="#071C3C"/>
    </linearGradient>
    <clipPath id="cortaFoto"><rect x="596" y="64" width="420" height="330" rx="20"/></clipPath>
"""


def faixa(y, credito_val, de, por):
    """Um par crédito / De / Por dentro do cartão de preços."""
    return f'''    <text x="806" y="{y}" text-anchor="middle" font-size="30" font-weight="500" fill="#A9C6EE">Crédito de</text>
    <text x="806" y="{y + 72}" text-anchor="middle" font-size="84" font-weight="800" letter-spacing="-3" fill="#FFFFFF"><tspan font-size="34" font-weight="700">R$ </tspan>{credito_val}<tspan font-size="40" font-weight="700" dx="4">mil</tspan></text>
    <text x="624" y="{y + 124}" font-size="22" font-weight="600" fill="#7E9BC4">De:</text>
    <text x="624" y="{y + 162}" font-size="34" font-weight="700" letter-spacing="-1" fill="#7E9BC4" text-decoration="line-through">{de}</text>
    <text x="988" y="{y + 124}" text-anchor="end" font-size="22" font-weight="600" fill="#A9C6EE">Por:</text>
    <text x="988" y="{y + 164}" text-anchor="end" font-size="46" font-weight="800" letter-spacing="-1.6" fill="#FFFFFF">{por}</text>
'''


def montar_quadrado(titulo, faixas, com_fundo):
    cabeca = (CABECA % (titulo, FONTE)).replace(
        'width="1080" height="1350" viewBox="0 0 1080 1350"',
        'width="1080" height="1080" viewBox="0 0 1080 1080"').replace(
        '  </defs>', DEFS_QUADRADO + '  </defs>')
    fundo = '''  <g id="fundo">
    <rect x="0" y="0" width="1080" height="1080" fill="url(#gradFundo)"/>
    <rect x="0" y="0" width="1080" height="1080" fill="url(#brilho)"/>
  </g>
''' if com_fundo else '  <!-- sem fundo: coloque a foto atrás desta camada -->\n'

    (c1, d1, p1), (c2, d2, p2) = faixas
    return cabeca + '\n' + fundo + f'''
  <g id="chamada">
    <text x="64" y="128" font-size="56" font-weight="800" letter-spacing="-1.6" fill="#FFFFFF">Consórcio Auto</text>
    <text x="64" y="182" font-size="44" font-weight="400" letter-spacing="-0.8" fill="#C6D8F2">pagando</text>
  </g>

  <g id="cinquenta" font-size="190" font-weight="800" letter-spacing="-6">
    <text x="72" y="404" fill="#123A7E">50<tspan font-size="92" dx="4">%</tspan></text>
    <text x="64" y="396" fill="url(#grad50)">50<tspan font-size="92" dx="4">%</tspan></text>
  </g>

  <g id="condicoes">
    <text x="64" y="448" font-size="30" font-weight="400" fill="#C6D8F2">da <tspan font-weight="700" fill="#FFFFFF">parcela</tspan> até a contemplação.</text>
    <rect x="64" y="484" width="470" height="68" rx="34" fill="#FFFFFF" fill-opacity="0.08" stroke="#4FE3F0" stroke-opacity="0.7" stroke-width="2"/>
    <text x="299" y="528" text-anchor="middle" font-size="32" font-weight="600" fill="#FFFFFF">Sem Entrada e Sem Juros</text>
    <text x="64" y="610" font-size="30" font-weight="400" fill="#C6D8F2">Use até <tspan font-weight="700" fill="#FFFFFF">30% do crédito</tspan> para</text>
    <text x="64" y="648" font-size="30" font-weight="700" fill="#FFFFFF">potencializar o seu lance.</text>
  </g>

  <g id="contato">
    <text x="64" y="712" font-size="34" font-weight="800" letter-spacing="-0.6" fill="#4FE3F0">Fale comigo!</text>
    <rect x="64" y="738" width="420" height="68" rx="34" fill="#FFFFFF"/>
    <g transform="translate(96,754) scale(1.15)" fill="none" stroke="#092649" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-3.4-.7L3 21l1.9-5.1A8.2 8.2 0 0 1 4 11.5a8.4 8.4 0 0 1 9-8.4 8.4 8.4 0 0 1 8 8.4z"/>
    </g>
    <text x="140" y="784" font-size="32" font-weight="800" letter-spacing="-0.6" fill="#092649">{WHATSAPP}</text>
  </g>

  <g id="logotipo">
    <rect x="64" y="830" width="158" height="190" rx="16" fill="#FFFFFF"/>
    <image x="84" y="847" width="118" height="165" xlink:href="data:image/png;base64,{LOGO}"/>
  </g>

  <g id="foto-slot">
    <rect x="596" y="64" width="420" height="330" rx="20" fill="url(#gradFoto)"/>
    <g clip-path="url(#cortaFoto)" stroke="#4FE3F0" fill="none" opacity="0.20">
      <circle cx="900" cy="230" r="150" stroke-width="3"/>
      <circle cx="900" cy="230" r="112" stroke-width="1.5"/>
    </g>
  </g>

  <g id="precos">
    <rect x="596" y="422" width="420" height="530" rx="24" fill="#050E1F" stroke="#FFFFFF" stroke-opacity="0.12" stroke-width="1"/>
{faixa(488, c1, d1, p1)}    <line x1="624" y1="700" x2="988" y2="700" stroke="#FFFFFF" stroke-opacity="0.16" stroke-width="1"/>
{faixa(766, c2, d2, p2)}  </g>

  <g id="letra-miuda" font-size="17" font-weight="400" fill="#8FAAC9">
    <text x="596" y="984">Consórcio não é financiamento.</text>
    <text x="596" y="1006">Contemplação por sorteio ou lance.</text>
    <text x="596" y="1028">Consulte o regulamento. Válido até 28/08.</text>
  </g>
</svg>
'''


for sufixo, com_fundo in (('', True), ('-sem-fundo', False)):
    svg = montar_quadrado('Consórcio Auto — 50% da parcela até a contemplação',
                          [('102', 'R$ 1.554', 'R$ 798'), ('125', 'R$ 1.895', 'R$ 973')],
                          com_fundo)
    nome = 'auto-50-duplo' + sufixo + '.svg'
    io.open(os.path.join(BASE, nome), 'w', encoding='utf-8').write(svg)
    html = ('<!doctype html><html><head><meta charset="utf-8"><style>'
            '@page { size: 1080px 1080px; margin: 0; }'
            'html,body { margin:0; padding:0; width:1080px; height:1080px; }'
            'svg { display:block; }</style></head><body>' + svg + '</body></html>')
    io.open(os.path.join(BASE, '_render_auto-50-duplo' + sufixo + '.html'), 'w', encoding='utf-8').write(html)
    print('%-32s %.0f KB' % (nome, len(svg.encode('utf-8')) / 1024))
