# -*- coding: utf-8 -*-
# Gera as 3 pecas .dc.html a partir de um template comum.
import io, os

TPL = r'''<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800;900&display=swap">
  <style>
    body { margin: 0; font-family: 'Archivo', 'Helvetica Neue', Helvetica, Arial, sans-serif; }
    a { color: #7fb3ff; text-decoration: none; }
    a:hover { color: #a9ceff; }
  </style>
</helmet>

<div style="position: relative; width: 1080px; height: 1350px; overflow: hidden; background-color: #050b1a; background-image: linear-gradient(160deg, #060d20 0%, #0a1730 46%, #071026 100%); font-family: 'Archivo', 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #ffffff;">

  <div style="position: absolute; inset: 0; background-image: radial-gradient(118% 66% at 50% 26%, {{brilho}} 0%, rgba(5, 11, 26, 0) 62%); opacity: 0.46;"></div>
  <div style="position: absolute; inset: 0; background-image: radial-gradient(70% 46% at 92% 78%, #3b2f8f 0%, rgba(5, 11, 26, 0) 68%); opacity: 0.5;"></div>
  <div style="position: absolute; inset: 0; background-image: radial-gradient(52% 34% at 6% 88%, #0d4f7a 0%, rgba(5, 11, 26, 0) 70%); opacity: 0.4;"></div>

  <div style="position: relative; z-index: 1; display: flex; flex-direction: column; justify-content: space-between; height: 100%; box-sizing: border-box; padding: 74px 80px 62px;">

    <div style="display: flex; align-items: center; justify-content: space-between; gap: 24px;">
      <div style="display: flex; align-items: center; gap: 14px;">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#7fb3ff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M3 12h4l2-5 3 10 2.5-6 1.5 3h5"></path>
        </svg>
        <span style="font-size: 25px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: #ffffff;">Quadrata Seguros</span>
      </div>
      <span style="font-size: 22px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; color: #8fa8cc;">Consórcio Porto Seguro</span>
    </div>

    <div style="display: flex; flex-direction: column; gap: 62px;">

      <div style="box-sizing: border-box; width: 100%; padding: 34px 48px; border-radius: 26px; background-color: rgba(4, 10, 24, 0.55); border: 1px solid rgba(255, 255, 255, 0.09); text-align: center;">
        <div style="font-size: 68px; font-weight: 800; letter-spacing: -0.025em; line-height: 1.04; color: #ffffff;">Parcelas 20% menores</div>
        <div style="margin-top: 6px; font-size: 42px; font-weight: 400; letter-spacing: -0.005em; line-height: 1.28; color: #c1d3ec;">até a contemplação</div>
      </div>

      <div style="display: flex; flex-direction: column; align-items: center; gap: 14px; text-align: center;">
        <div style="font-size: 42px; font-weight: 500; letter-spacing: 0.015em; color: #8fa8cc;">Crédito de</div>
        <div style="font-size: 168px; font-weight: 800; letter-spacing: -0.042em; line-height: 0.92; color: #ffffff; white-space: nowrap;">__CREDITO__</div>
        <div style="margin-top: 6px; font-size: 36px; font-weight: 500; letter-spacing: 0.01em; color: #8fa8cc;">__PLANO__</div>
      </div>

    </div>

    <div style="display: flex; flex-direction: column; gap: 34px;">

      <div style="display: flex; align-items: center; gap: 44px; box-sizing: border-box; width: 100%; padding: 42px 48px; border-radius: 28px; background-color: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.09);">
        <div style="display: flex; flex-direction: column; gap: 10px; flex-grow: 1;">
          <div style="font-size: 29px; line-height: 1.2; letter-spacing: 0.005em; color: #8fa8cc;"><span style="font-weight: 700; color: #b6c9e4;">Parcelas</span> que custavam</div>
          <div style="font-size: 58px; font-weight: 700; letter-spacing: -0.03em; color: #7d93b5; text-decoration: line-through; text-decoration-thickness: 5px;">__ANTES__</div>
        </div>
        <div style="width: 1px; align-self: stretch; background-color: rgba(255, 255, 255, 0.15);"></div>
        <div style="display: flex; flex-direction: column; gap: 6px; flex-grow: 1;">
          <div style="font-size: 40px; font-weight: 500; letter-spacing: 0.005em; color: #c1d3ec;">Agora por</div>
          <div style="font-size: 112px; font-weight: 800; letter-spacing: -0.038em; line-height: 1; color: #ffffff; white-space: nowrap;">__AGORA__</div>
        </div>
      </div>

      <div style="display: flex; align-items: center; justify-content: center; gap: 16px; box-sizing: border-box; padding: 24px 40px; border-radius: 999px; background-color: #ffffff;">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#0a1730" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-3.4-.7L3 21l1.9-5.1A8.2 8.2 0 0 1 4 11.5a8.4 8.4 0 0 1 9-8.4 8.4 8.4 0 0 1 8 8.4z"></path>
        </svg>
        <span style="font-size: 34px; font-weight: 700; letter-spacing: -0.01em; color: #0a1730;">Simule no WhatsApp · [SEU WHATSAPP]</span>
      </div>

      <div style="font-size: 20px; font-weight: 400; line-height: 1.45; letter-spacing: 0.005em; color: #6b82a6; text-wrap: pretty;">Grupo em formação. A parcela é reduzida em 20% até a contemplação; após a contemplação, volta ao valor integral de __ANTES__. Taxa de administração __TAXA__ + fundo de reserva 2%. Contemplação por sorteio ou lance — consórcio não é financiamento e não há prazo garantido para a contemplação. Valores da tabela Porto Seguro de 24/04/2025 para pessoa física, sujeitos a alteração.</div>

    </div>
  </div>
</div>
</x-dc>

<script data-dc-script data-props='{"$preview":{"width":1080,"height":1350},"brilho":{"editor":"color","default":"__BRILHO__","options":["#1e5fd0","#0e7490","#7c3aed","#b45309"]}}'>
class Component extends DCLogic {
  renderVals() {
    return { brilho: this.props.brilho ?? '__BRILHO__' };
  }
}
</script>
</body>
</html>
'''

PECAS = [
    dict(arquivo='Main.dc.html',          credito='R$ 25.000',  plano='Automóvel Flex · 50 meses',            antes='R$ 600',   agora='R$ 480',   taxa='18%', brilho='#1e5fd0'),
    dict(arquivo='CreditoMedio.dc.html',  credito='R$ 60.000',  plano='Crédito Médio · 72 meses',             antes='R$ 1.000', agora='R$ 800',   taxa='18%', brilho='#0e7490'),
    dict(arquivo='CreditoAlto.dc.html',   credito='R$ 200.000', plano='Crédito Alto Premium · 90 meses',      antes='R$ 2.600', agora='R$ 2.080', taxa='15%', brilho='#7c3aed'),
]

base = os.path.dirname(os.path.abspath(__file__))
for p in PECAS:
    out = (TPL
           .replace('__CREDITO__', p['credito'])
           .replace('__PLANO__', p['plano'])
           .replace('__ANTES__', p['antes'])
           .replace('__AGORA__', p['agora'])
           .replace('__TAXA__', p['taxa'])
           .replace('__BRILHO__', p['brilho']))
    assert '__' not in out.replace('__', '', 0) or True
    for tok in ('__CREDITO__', '__PLANO__', '__ANTES__', '__AGORA__', '__TAXA__', '__BRILHO__'):
        assert tok not in out, tok
    with io.open(os.path.join(base, p['arquivo']), 'w', encoding='utf-8') as f:
        f.write(out)
    print('escrito:', p['arquivo'], '|', p['credito'], '|', p['antes'], '->', p['agora'])
