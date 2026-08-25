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
    a { color: #4FE3F0; text-decoration: none; }
    a:hover { color: #8CEEF6; }
  </style>
</helmet>

<div style="position: relative; width: 1080px; height: 1350px; overflow: hidden; background-color: #071B3A; background-image: linear-gradient(158deg, #0D46A0 0%, #0A2E6B 44%, #061A38 100%); font-family: 'Archivo', 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #ffffff;">

  <div style="position: absolute; inset: 0; background-image: radial-gradient(112% 60% at 50% 16%, {{brilho}} 0%, rgba(6, 26, 56, 0) 64%); opacity: 0.5;"></div>
  <div style="position: absolute; inset: 0; background-image: radial-gradient(64% 42% at 96% 84%, #1668D8 0%, rgba(6, 26, 56, 0) 70%); opacity: 0.55;"></div>

  <svg width="360" height="360" viewBox="0 0 120 120" fill="none" aria-hidden="true" style="position: absolute; top: -104px; right: -96px; opacity: 0.22;">
    <circle cx="60" cy="60" r="52" stroke="#4FE3F0" stroke-width="2"></circle>
    <circle cx="60" cy="60" r="40" stroke="#4FE3F0" stroke-width="1"></circle>
    <text x="60" y="76" text-anchor="middle" font-family="Archivo, Helvetica, Arial, sans-serif" font-size="46" font-weight="800" fill="#4FE3F0">%</text>
  </svg>
  <svg width="300" height="300" viewBox="0 0 120 120" fill="none" aria-hidden="true" style="position: absolute; bottom: -92px; left: -88px; opacity: 0.18;">
    <circle cx="60" cy="60" r="52" stroke="#4FE3F0" stroke-width="2"></circle>
    <circle cx="60" cy="60" r="40" stroke="#4FE3F0" stroke-width="1"></circle>
    <text x="60" y="76" text-anchor="middle" font-family="Archivo, Helvetica, Arial, sans-serif" font-size="46" font-weight="800" fill="#4FE3F0">%</text>
  </svg>

  <div style="position: relative; z-index: 1; display: flex; flex-direction: column; justify-content: space-between; height: 100%; box-sizing: border-box; padding: 52px 80px 44px;">

    <div style="display: flex; flex-direction: column; gap: 8px; text-align: center;">
      <div style="font-size: 56px; font-weight: 800; letter-spacing: 0.005em; line-height: 1.06; text-transform: uppercase; color: #4FE3F0;">Parcelas 50% menores</div>
      <div style="font-size: 38px; font-weight: 400; letter-spacing: -0.005em; line-height: 1.24; color: #ffffff;">até a contemplação</div>
    </div>

    <div style="display: flex; flex-direction: column; gap: 28px;">

      <div style="display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center;">
        <div style="font-size: 32px; font-weight: 500; letter-spacing: 0.02em; color: #A9C6EE;">Crédito de</div>
        <div style="font-size: 130px; font-weight: 800; letter-spacing: -0.042em; line-height: 0.92; color: #ffffff; white-space: nowrap;">__CREDITO__</div>
        <div style="font-size: 32px; font-weight: 600; letter-spacing: 0.01em; color: #4FE3F0;">__PLANO__</div>
      </div>

      <div style="border-radius: 24px; overflow: hidden; background-color: #ffffff;">
        <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); background-color: #E4EBF5;">
          <div style="padding: 16px 20px; text-align: center; font-size: 22px; font-weight: 600; line-height: 1.25; color: #33507A;">Parcela tradicional</div>
          <div style="padding: 16px 20px; text-align: center; font-size: 22px; font-weight: 800; line-height: 1.25; color: #092649;">Parcela com 50% de redutor</div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); align-items: center;">
          <div style="display: flex; align-items: baseline; justify-content: center; gap: 10px; padding: 22px 18px;">
            <span style="font-size: 22px; font-weight: 600; color: #6B84A6;">De:</span>
            <span style="font-size: 40px; font-weight: 700; letter-spacing: -0.025em; color: #6B84A6; text-decoration: line-through; text-decoration-color: #FF4D4D; text-decoration-thickness: 4px; white-space: nowrap;">__ANTES__</span>
          </div>
          <div style="display: flex; align-items: baseline; justify-content: center; gap: 10px; padding: 22px 18px; border-left: 1px solid #D6DFEC;">
            <span style="font-size: 22px; font-weight: 600; color: #33507A;">Por:</span>
            <span style="font-size: 50px; font-weight: 800; letter-spacing: -0.032em; color: #092649; white-space: nowrap;">__AGORA__</span>
          </div>
        </div>
      </div>

      <div style="display: flex; align-items: stretch; gap: 20px;">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-grow: 1; box-sizing: border-box; padding: 12px 20px 12px 28px; border-radius: 999px; border: 2px solid rgba(79, 227, 240, 0.55);">
          <span style="font-size: 28px; font-weight: 700; letter-spacing: 0.015em; color: #ffffff;">SEM ENTRADA</span>
          <span style="position: relative; display: block; width: 64px; height: 34px; border-radius: 999px; background-color: #4FE3F0; flex-shrink: 0;">
            <span style="position: absolute; top: 4px; right: 4px; width: 26px; height: 26px; border-radius: 999px; background-color: #ffffff;"></span>
          </span>
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-grow: 1; box-sizing: border-box; padding: 12px 20px 12px 28px; border-radius: 999px; border: 2px solid rgba(79, 227, 240, 0.55);">
          <span style="font-size: 28px; font-weight: 700; letter-spacing: 0.015em; color: #ffffff;">SEM JUROS</span>
          <span style="position: relative; display: block; width: 64px; height: 34px; border-radius: 999px; background-color: #4FE3F0; flex-shrink: 0;">
            <span style="position: absolute; top: 4px; right: 4px; width: 26px; height: 26px; border-radius: 999px; background-color: #ffffff;"></span>
          </span>
        </div>
      </div>

    </div>

    <div style="display: flex; flex-direction: column; align-items: center; gap: 16px;">

      <div style="box-sizing: border-box; padding: 12px 30px; border-radius: 999px; background-color: #4FE3F0; font-size: 26px; font-weight: 800; letter-spacing: 0.09em; text-transform: uppercase; color: #06284A;">Válido até 28/08</div>

      <div style="display: flex; align-items: center; justify-content: center; gap: 16px; box-sizing: border-box; padding: 20px 40px; border-radius: 999px; background-color: #ffffff;">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#092649" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-3.4-.7L3 21l1.9-5.1A8.2 8.2 0 0 1 4 11.5a8.4 8.4 0 0 1 9-8.4 8.4 8.4 0 0 1 8 8.4z"></path>
        </svg>
        <span style="font-size: 36px; font-weight: 800; letter-spacing: -0.015em; color: #092649;">(11) 98678-0000</span>
      </div>

      <div style="box-sizing: border-box; padding: 16px 24px; border-radius: 20px; background-color: #ffffff;">
        <img src="quadrata-logo.png" alt="Quadrata Seguros" style="display: block; width: 118px; height: auto;">
      </div>

      <div style="font-size: 19px; font-weight: 400; line-height: 1.42; letter-spacing: 0.005em; text-align: center; color: #9DBBE4; text-wrap: pretty;">Parcela reduzida em 50% até a contemplação; depois disso, volta ao valor cheio de __ANTES__. Contemplação por sorteio ou lance — consórcio não é financiamento e não há prazo garantido para receber o crédito. Valores sujeitos a alteração. Consulte condições.</div>

    </div>
  </div>
</div>
</x-dc>

<script data-dc-script data-props='{"$preview":{"width":1080,"height":1350},"brilho":{"editor":"color","default":"#1A6FE0","options":["#1A6FE0","#248AFF","#4FE3F0","#3B2F8F"]}}'>
class Component extends DCLogic {
  renderVals() {
    return { brilho: this.props.brilho ?? '#1A6FE0' };
  }
}
</script>
</body>
</html>
'''

PECAS = [
    dict(arquivo='Main.dc.html',         credito='R$ 300 MIL',  plano='Imóvel ou automóvel', antes='R$ 1.815,00', agora='R$ 914,00'),
    dict(arquivo='CreditoMedio.dc.html', credito='R$ 600 MIL',  plano='Imóvel ou automóvel', antes='R$ 3.585,00', agora='R$ 1.807,00'),
    dict(arquivo='CreditoAlto.dc.html',  credito='R$ 1 MILHÃO', plano='Imóvel ou automóvel', antes='R$ 5.975,00', agora='R$ 3.013,00'),
]

base = os.path.dirname(os.path.abspath(__file__))
for p in PECAS:
    out = (TPL
           .replace('__CREDITO__', p['credito'])
           .replace('__PLANO__', p['plano'])
           .replace('__ANTES__', p['antes'])
           .replace('__AGORA__', p['agora'])
)
    for tok in ('__CREDITO__', '__PLANO__', '__ANTES__', '__AGORA__'):
        assert tok not in out, tok
    with io.open(os.path.join(base, p['arquivo']), 'w', encoding='utf-8') as f:
        f.write(out)
    print('escrito:', p['arquivo'], '|', p['credito'], '|', p['antes'], '->', p['agora'])
