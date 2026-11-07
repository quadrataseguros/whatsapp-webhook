# Quadrata Seguros Digital — logotipo

Redesenho da arte trazida pelo cliente. O conceito dela estava certo — a marca
dissolvendo em pixels diz "digital" sem escrever a palavra — mas a execução
tinha quatro problemas, corrigidos aqui:

| Problema | Correção |
|---|---|
| O Q vazado mostrava a foto de um teclado atrás: ilegível | Fundo sólido navy; o Q lê de imediato |
| Foto de teclado e mouse gamer: diz e-sports, não seguros | Sem foto |
| Roxo, fora da paleta | Azul `#2f89f5` / `#4da3ff` e navy `#0b1c38`, como o resto da marca |
| Três tipografias brigando | Outfit em dois pesos |

## Arquivos

| Arquivo | Uso |
|---|---|
| `qsd-principal.png` (1080×1080) | Post, perfil, apresentação |
| `qsd-avatar.png` (1080×1080) | Foto de perfil do WhatsApp e do Instagram — só a marca, sem texto |
| `qsd-horizontal.png` (1600×460) | Cabeçalho de site, assinatura de e-mail |

Os `.html` ao lado geram cada PNG; `furos.svg` e `cacos.svg` são a dissolução,
produzida por script (grade com densidade e tamanho caindo para a direita).

## Como a dissolução funciona

É um movimento só atravessando a borda da marca: **furos** na máscara dentro do
branco e **cacos** soltos fora, com a mesma grade e a mesma curva de densidade.
Separar os dois (confete ao lado de uma borda reta) foi a primeira tentativa e
não lê como dissolução.

Ela sai pelo **canto superior direito** porque o rabo de balão da marca aponta
para o meio-direita: no mesmo espaço, os dois se estragam.

## O bico da marca oficial

O `path` oficial da Quadrata (no `index.html` do painel) tem um bico que, em
tamanho grande e com o Q vazado, lê como uma seta grudada na letra. Aqui a forma
é o quadrado arredondado limpo. O bico segue valendo na marca institucional, que
é usada pequena e com o Q sobre disco branco.

## Renderizar de novo

```bash
cd marca/quadrata/digital
CH=$(ls -d /opt/pw-browsers/chromium-*/chrome-linux*/chrome | head -1)
"$CH" --headless=new --no-sandbox --disable-gpu --hide-scrollbars \
  --window-size=1080,1080 --virtual-time-budget=8000 \
  --screenshot=qsd-avatar.png "file://$PWD/avatar.html"
```
