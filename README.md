# WhatsApp Webhook — MarIAna e FabrícIO · Quadrata Seguros

Webhook Node.js que recebe mensagens do WhatsApp Business API, responde com um
**menu interativo** e, para texto livre, usa a IA (API da Anthropic / Claude) —
enviando a resposta automática de volta ao cliente.

São **duas personas** atendendo pelo **mesmo número** de WhatsApp: a **MarIAna**
e o **FabrícIO**. Quem responde depende da porta de entrada do cliente — ver
[Personas](#personas-mariana-e-fabrício) abaixo.

> **Nota:** a IA roda direto pela API da Anthropic. Não há mais servidor Langflow
> para manter ligado 24h — paga-se apenas por mensagem processada.

---

## Arquitetura

```
WhatsApp  →  Meta Webhook  →  Este servidor  →  persona (Claude, API Anthropic)
                                  ↑                   ↓
                          quem atende?      resposta automática
                       (porta de entrada)             ↓
                                          WhatsApp Cloud API  →  cliente
```

---

## Variáveis de ambiente

Copie `.env.example` para `.env` e preencha:

| Variável | Descrição |
|----------|-----------|
| `VERIFY_TOKEN` | Token de verificação da Meta (padrão: `quadrata123`) |
| `WA_PHONE_NUMBER_ID` | ID do número no painel Meta |
| `WA_ACCESS_TOKEN` | Token de acesso da Meta |
| `ANTHROPIC_API_KEY` | Chave da API da Anthropic (crie em console.anthropic.com) — ativa a IA |
| `MARIANA_MODEL` | Modelo do Claude (padrão: `claude-haiku-4-5`) |
| `IG_USER_ID` · `IG_ACCESS_TOKEN` | Instagram da **MarIAna** |
| `IG_USER_ID_FABRICIO` · `IG_ACCESS_TOKEN_FABRICIO` | Instagram do **FabrícIO** |
| `MAKE_WEBHOOK_URL` | URL do Make — usado como fallback se `ANTHROPIC_API_KEY` não estiver configurada |
| `WHATSAPP_NUMERO` | Opcional. Troca o número para onde os `/fale` mandam o cliente (é o mesmo para as duas personas). Padrão: `(11) 98678-0000` |

---

## Deploy

Para colocar (ou manter) o servidor na nuvem, siga o
**[DEPLOY-RAILWAY.md](DEPLOY-RAILWAY.md)** — é o caminho recomendado: o volume
do banco, as variáveis obrigatórias (`DB_PATH`, `TZ`) e a troca do DNS na
Cloudflare estão detalhados lá.

### Alternativa: Render

1. Suba este repositório no GitHub.
2. No Render, crie um **Web Service** conectado ao repositório.
3. Configure:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Adicione todas as variáveis de ambiente no painel do Render.
5. Copie a URL pública gerada (ex.: `https://whatsapp-webhook.onrender.com`).
6. No painel da Meta, configure:
   - **Callback URL:** `https://whatsapp-webhook.onrender.com/webhook`
   - **Verify Token:** valor de `VERIFY_TOKEN`

---

## Personas: MarIAna e FabrícIO

O WhatsApp é **um número só** — o (11) 98678-0000. O que muda é **quem atende**,
conforme por onde o cliente chegou:

| Porta de entrada | Quem responde |
|---|---|
| Direct no Instagram da MarIAna | MarIAna |
| Direct no Instagram do FabrícIO | FabrícIO |
| Link `/fale` na bio (ou anúncio) da MarIAna | MarIAna |
| Link `/fale/fabricio` na bio (ou anúncio) do FabrícIO | FabrícIO |
| Qualquer outra origem | MarIAna (padrão) |

Como cada sinal é lido:

- **Instagram:** o webhook diz em qual conta o direct caiu (`entry[0].id`), e o
  servidor compara com o `IG_USER_ID` de cada persona. É o sinal mais confiável,
  porque não depende do que o cliente digitou.
- **WhatsApp:** o link `/fale` já abre a conversa com um texto digitado que
  carrega a origem ("Vim *pelo Instagram do Fabricio* e quero..."). Anúncios
  *Click to WhatsApp* são reconhecidos pelo `referral` quando o anúncio cita o
  Fabricio.
- **Depois da primeira mensagem** a escolha fica **gravada por contato** (tabela
  `contact_persona`), então o cliente não vê o atendente trocar de nome no meio
  da conversa. Se ele voltar pela outra porta, a persona troca e a conversa
  recomeça do zero — o novo atendente não responde em cima das falas do outro.

O que muda entre as duas: **nome, gênero, papel e jeito de falar**. Produtos,
menu, regras, campanha de consórcio e limites são exatamente os mesmos — o corpo
do prompt é compartilhado. Tudo fica em **`personas.js`**; para criar uma
terceira persona, copie um dos objetos e acrescente ao registro.

Diagnóstico: `GET /health` lista as personas, quais têm Instagram configurado e
o link de bio de cada uma.

> **Atenção — a foto e o nome do perfil do WhatsApp são um só.** Quem chega pelo
> Instagram do Fabricio cai num WhatsApp cuja foto e nome de exibição são os da
> conta única. Para não gerar estranheza, deixe o perfil do WhatsApp **neutro,
> com a marca da Quadrata** (não com a cara de uma das personas) — cada uma se
> apresenta pelo nome na conversa.

---

## Configurar a IA

A IA roda direto pela API da Anthropic — nada para manter ligado, sem servidor
Langflow. Para ativar:

1. Acesse **console.anthropic.com** e crie uma conta.
2. Adicione um crédito inicial (ex.: US$ 5) em *Billing*.
3. Gere uma **API Key** em *API Keys*.
4. Coloque a chave na variável de ambiente `ANTHROPIC_API_KEY` (no painel do
   Render/Railway, ou no `.env` local).

Personalização:
- O comportamento e as informações das personas ficam em **`personas.js`**: a
  identidade de cada uma (nome, gênero, jeito de falar) e o corpo comum
  (produtos, tom, regras) que vale para todas.
- O modelo padrão é `claude-haiku-4-5` (rápido e econômico). Para trocar, use a
  variável `MARIANA_MODEL`.
- A IA lembra o contexto das últimas mensagens de cada cliente por 30 minutos
  de inatividade (memória em `index.js`).

Diagnóstico: acesse `GET /ia-status` (ou o antigo `/mariana-status`) para checar
se a IA está respondendo.

---

## Menu interativo (WhatsApp)

Além da IA, o webhook envia **menus interativos** nativos do WhatsApp
(mensagens do tipo `list`), o mesmo recurso visual de plataformas como a Digisac,
porém direto pela Cloud API:

- O cliente envia uma **saudação** (`oi`, `olá`, `bom dia`…) ou digita **`menu`**
  → recebe o menu principal com as opções: Cotação, Sinistro/Guincho, App e Corretor.
- Ao tocar em **Sinistro/Guincho** → abre um submenu com as seguradoras e devolve
  os telefones de assistência 24h.
- **Texto livre** (perguntas abertas) → continua sendo respondido pela **IA**, na voz da persona que estiver atendendo aquele contato.

Requisito: a conexão precisa ser **WhatsApp Cloud API oficial** (o número já usado
pelas personas atende esse requisito). Menus interativos **não** funcionam em conexões
via QR Code.

Os textos, telefones e o fluxo do menu ficam centralizados em `index.js`
(constantes `RESPOSTAS`, `sendMainMenu`, `sendSeguradorasMenu`).

---

## Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/webhook` | Verificação Meta |
| `POST` | `/webhook` | Recebe mensagens WhatsApp |
| `GET` | `/health` | Status do servidor e modo ativo |
| `GET` | `/ia-status` | Testa se a IA (Claude) está respondendo (antigo `/mariana-status`) |
| `GET` | `/fale` | Link da bio do Instagram da MarIAna — redireciona para a conversa no WhatsApp |
| `GET` | `/fale/fabricio` | Link da bio do Instagram do FabrícIO — mesmo número, quem atende é ele |

---

## Teste local

```bash
npm install
cp .env.example .env
# edite .env com seus valores
npm start
```

Verificar saúde:
```bash
curl http://localhost:3000/health
```

---

## Links da bio do Instagram (`/fale`)

Cada perfil tem o seu link, e é ele que diz quem vai atender:

| Perfil | Link da bio |
|---|---|
| `@marianaquadrata` | `https://webhook.quadratadigital.com.br/fale` |
| Instagram do FabrícIO | `https://webhook.quadratadigital.com.br/fale/fabricio` |

A rota redireciona o visitante para a conversa no WhatsApp já com a mensagem
digitada — e é essa mensagem que carrega a origem:

| Link | Mensagem que abre |
|------|-------------------|
| `/fale` | `Oi, vim pelo Instagram e quero mais informações.` (abre o menu principal) |
| `/fale/fabricio` | `Oi, vim pelo Instagram do Fabricio e quero mais informações.` |
| `/fale?assunto=auto` | cotação de seguro auto |
| `/fale/fabricio?assunto=auto` | idem, mas quem atende é o FabrícIO |
| `?assunto=saude` · `odonto` · `vida` · `residencia` · `consorcio` · `financiamento` · `cartao` · `sinistro` | o tema correspondente, nos dois links |

> Não reescreva o trecho "vim pelo Instagram (do Fabricio)" nesses textos: é
> exatamente ele que o webhook lê para saber qual persona deve responder.

O número de destino é o **(11) 98678-0000**. Para trocar sem mexer no código,
defina `WHATSAPP_NUMERO` no ambiente (pode escrever com máscara — `(11) 98678-0000`
— que o servidor normaliza e acrescenta o DDI 55).

> **Atenção:** esse link só responde enquanto o servidor estiver no ar e
> acessível pelo domínio. Se o domínio estiver servido por um **Cloudflare
> Tunnel** apontando para um PC local, o link cai (erro **1033**) sempre que o
> PC for desligado ou o `cloudflared` parar. Para o link nunca cair, hospede o
> servidor na nuvem (Railway/Render) ou, se preferir não depender do servidor,
> coloque o `https://wa.me/<numero>` direto na bio.

---

## Campanha de consórcio (valores e validade)

As duas personas conhecem a tabela da campanha **Consórcio Porto Bank — 50% de desconto
na taxa** (parcela reduzida pela metade até a contemplação). Tudo fica em
`index.js`, em duas constantes:

| Constante | O que é |
|---|---|
| `CONSORCIO_VALIDADE` | Último dia da oferta (`AAAA-MM-DD`). Comparado pelo dia em São Paulo |
| `CONSORCIO_PLANOS` | Os planos e as faixas `[crédito, parcela sem oferta, parcela com redução]` |

Como a campanha aparece para o cliente:

- **No menu** (opção *Consórcio*): uma chamada curta com os valores de entrada
  de auto e imóvel, e o convite para informar o crédito desejado.
- **Na conversa com a IA**: a tabela inteira entra no prompt **apenas quando a
  palavra "consórcio" aparece na conversa** — não em todo atendimento. Junto
  vão as regras: pode citar os valores da tabela, mas nunca interpolar faixas,
  e sempre explicar que a redução vale até a contemplação e depois é
  compensada nas parcelas seguintes.

Junto da campanha vai sempre o bloco `CONSORCIO_LANCES`, com as regras de
lance da Porto: os **tipos** (livre, do valor de uma parcela até 100%; e fixo,
o percentual único do grupo) e as **formas de pagar** (embutido, até 30% da
própria carta; ou recursos próprios/FGTS). Esse bloco existe porque a tabela
promocional cita só o lance embutido — lido sozinho, dá a impressão errada de
que o lance máximo é 30% do crédito. Ele entra com ou sem campanha ativa.

**Quando a campanha vencer**, o código para de oferecê-la sozinho: o menu volta
a pedir bem e valor, e a IA passa a dizer que um corretor confirma as condições
vigentes. Para renovar, atualize `CONSORCIO_VALIDADE` e, se os valores mudarem,
`CONSORCIO_PLANOS`.
