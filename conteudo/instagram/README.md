# Instagram da MarIAna — biblioteca de conteúdo

Os posts do `@marianaquadrata`, a consultora digital da Quadrata Seguros.
Cada post é um carrossel: o texto mora no `slides.html`, a legenda no
`legenda.md`, e as imagens prontas ficam em `imagens/`.

```
conteudo/instagram/
├── README.md            ← você está aqui
├── estilo.css           ← a identidade visual de TODOS os posts
├── gerar-slides.js      ← transforma os slides.html em imagens 1080×1350
├── marca/               ← o logo da Quadrata em SVG (versão normal e invertida)
├── fontes/              ← a Inter, embutida (renderiza igual em qualquer PC)
└── posts/
    └── NN-nome-do-post/
        ├── slides.html  ← o carrossel (um <section class="slide"> por tela)
        ├── legenda.md   ← legenda, hashtags, link do CTA e checklist
        └── imagens/     ← 01.jpg, 02.jpg… prontas para subir
```

---

## Os 11 posts prontos

| # | Post | Produto | Objetivo | Validade |
|---|------|---------|----------|----------|
| 01 | [Consórcio — reta final](posts/01-consorcio-reta-final/legenda.md) | Consórcio | Conversão | ⚠️ **31/08/2026** |
| 02 | [Consórcio x financiamento](posts/02-consorcio-x-financiamento/legenda.md) | Consórcio | Educação | Sem validade |
| 03 | [Como funciona o lance](posts/03-consorcio-como-dar-lance/legenda.md) | Consórcio | Autoridade | Sem validade |
| 04 | [Seguro auto — além da batida](posts/04-seguro-auto-alem-da-batida/legenda.md) | Auto | Topo de funil | Sem validade |
| 05 | [Seguro residencial](posts/05-seguro-residencial/legenda.md) | Residencial | Topo de funil | Sem validade |
| 06 | [Seguro de vida](posts/06-seguro-de-vida/legenda.md) | Vida | Quebra de tabu | Sem validade |
| 07 | [Plano de saúde](posts/07-plano-de-saude/legenda.md) | Saúde | Autoridade | Sem validade |
| 08 | [Cartão Porto Bank](posts/08-cartao-porto-bank/legenda.md) | Cartão | Conversão na base | Enquanto a campanha valer |
| 09 | [Bateu o carro — o que fazer](posts/09-sinistro-primeiros-passos/legenda.md) | Sinistro | Utilidade / salvamento | Sem validade |
| 10 | [App MySeg — código 1133](posts/10-app-myseg-1133/legenda.md) | Pós-venda | Retenção | Sem validade |
| 11 | [Quem é a MarIAna](posts/11-quem-e-a-mariana/legenda.md) | Institucional | Confiança | Sem validade |

**Fixe no topo do perfil:** o 11 (quem é a MarIAna) e o 10 (app MySeg).

---

## Calendário sugerido — 4 semanas, 3 posts por semana

| Semana | Terça | Quinta | Sábado |
|---|---|---|---|
| 1 | 11 · Quem é a MarIAna | 01 · Consórcio reta final | 09 · Bateu o carro |
| 2 | 04 · Seguro auto | 02 · Consórcio x financiamento | 10 · App MySeg |
| 3 | 06 · Seguro de vida | 08 · Cartão Porto Bank | 05 · Seguro residencial |
| 4 | 07 · Plano de saúde | 03 · Como dar lance | *repost* do 09 |

Alterna produto a cada post e nunca repete o mesmo assunto em dias seguidos.
O 09 (sinistro) e o 10 (app) podem voltar a cada trimestre — são os que mais
geram salvamento e os que mais aliviam o atendimento.

---

## Como publicar

**1. Na mão (mais simples).** Abra a pasta `imagens/` do post, envie os
arquivos na ordem (01, 02, 03…) e cole a legenda do `legenda.md`.

**2. Pela skill `setup-instagram`.** Se as credenciais da Meta API já estiverem
configuradas:

```bash
python publish_instagram.py \
  --images conteudo/instagram/posts/01-consorcio-reta-final/imagens/*.jpg \
  --caption "cole aqui a legenda"
```

Em qualquer um dos dois caminhos, confira antes o **checklist** que está no
final de cada `legenda.md`.

---

## Como mexer nos posts

**Trocar um texto:** edite o `slides.html` do post e rode

```bash
node conteudo/instagram/gerar-slides.js 01-consorcio   # só esse post
node conteudo/instagram/gerar-slides.js                # todos
```

Requer o Playwright (`npm install -D playwright && npx playwright install chromium`).
Ele fica **fora** do `package.json` de propósito: só serve para produzir
conteúdo aqui, e o servidor que vai para o Railway não precisa carregar esse peso.

**Mudar a cara de todos os posts de uma vez:** mexa no `estilo.css`.

**Trocar o logo:** substitua `marca/logo.svg` (o selo colorido, usado nos fundos
claro e azul-marinho) e `marca/logo-branco.svg` (a versão invertida, usada só
nos slides de fundo azul) e rode o gerador de novo. O CSS aponta para os
arquivos, então não precisa mexer em mais nada. Se tiver o logo original em
SVG, é só salvar por cima — fica idêntico à marca.

**Criar um post novo:** copie a pasta de um parecido, ajuste os
`<section class="slide">` e gere. A numeração "2/6" do rodapé é preenchida
sozinha — pode inserir ou remover slide sem renumerar nada.

### As classes do `slides.html`

| Classe | O que faz |
|---|---|
| `slide` | Uma tela do carrossel (1080×1350). Fundo claro por padrão |
| `slide escuro` | Fundo azul-marinho — use na capa e nos slides de virada |
| `slide azul` | Fundo azul da marca — reserve para o slide de CTA |
| `kicker` / `kicker urgente` | A etiqueta pequena acima do título (urgente = laranja) |
| `h1` / `h1.menor` / `h2` / `h2.menor` | Títulos |
| `realce` | Pinta um trecho do título com a cor de destaque |
| `sub` | Parágrafo de apoio |
| `lista` + `bolinha` | Lista com badge. Variantes: `ok` (verde), `nao` (vermelho), `ouro`, `emoji` |
| `cartao` + `rotulo` / `valor` / `valor riscado` / `nota` | Cartão de preço |
| `confronto` + `bom` / `ruim` | Comparação lado a lado |
| `numerao` | Número gigante |
| `aviso` | A letra miúda, com a barrinha azul |
| `botao` | O "Link na bio →" |

---

## Regras de conteúdo — não são opcionais

O que vale para a MarIAna na conversa vale para o post. A fonte da verdade é o
`MARIANA_SYSTEM` no `index.js`:

- **Não invente preço, cobertura ou condição.** A única exceção são os valores
  da campanha de consórcio, que vêm da tabela oficial em `CONSORCIO_PLANOS` —
  copiados exatamente como estão, sem arredondar nem interpolar faixas.
- **Consórcio:** toda vez que a parcela reduzida aparecer, diga junto que a
  redução vale **até a contemplação** e que depois a diferença é compensada nas
  parcelas seguintes.
- **Cartão:** nunca prometa aprovação. A análise é da Porto Bank.
- **Seguros:** cobertura e assistência variam por seguradora e plano — sempre
  que listar coberturas, deixe isso escrito em algum slide.
- **Sinistro:** **nunca** coloque telefone de seguradora na arte. Os números
  mudam, e um telefone errado no post atrasa o guincho de alguém. A MarIAna
  passa o número certo na conversa.
- **Consórcio não é financiamento.** Não tem juros: tem taxa de administração,
  e o bem sai por sorteio ou lance.

---

## O link da bio

A bio aponta para `https://webhook.quadratadigital.com.br/fale`, que redireciona
para o WhatsApp da MarIAna com a mensagem já digitada. Dá para mandar o cliente
direto para o assunto do post:

| Post | Link do CTA |
|---|---|
| 01, 02, 03 | `/fale?assunto=consorcio` |
| 04 | `/fale?assunto=auto` |
| 05 | `/fale?assunto=residencia` |
| 06 | `/fale?assunto=vida` |
| 07 | `/fale?assunto=saude` |
| 08 | `/fale?assunto=cartao` |
| 09 | `/fale?assunto=sinistro` |
| 10, 11 | `/fale` |

Como o Instagram só aceita **um** link na bio, o jeito de usar isso é trocar o
link da bio conforme o post do dia, ou colocar os links nos Stories/destaques.
A rota está documentada no [README principal](../../README.md#link-da-bio-do-instagram-fale).

---

## Próximas ideias (ainda não produzidas)

- Financiamento de imóvel e de veículo (`/fale?assunto=financiamento`)
- Plano odontológico (`/fale?assunto=odonto`)
- Seguro empresarial, viagem e pet
- Série "mitos do seguro" — franquia, bônus, perda total
- Depoimento de cliente atendido pela MarIAna (com autorização)
- Reels curto lendo o slide 1 de cada carrossel
