# WhatsApp Webhook — MarIAna · Quadrata Seguros

Webhook Node.js que recebe mensagens do WhatsApp Business API, responde com um
**menu interativo** e, para texto livre, usa a **MarIAna** (IA via API da Anthropic /
Claude) — enviando a resposta automática de volta ao cliente.

> **Nota:** a IA roda direto pela API da Anthropic. Não há mais servidor Langflow
> para manter ligado 24h — paga-se apenas por mensagem processada.

---

## Arquitetura

```
WhatsApp  →  Meta Webhook  →  Este servidor  →  MarIAna (Claude, API Anthropic)
                                                      ↓
WhatsApp  ←  WhatsApp Cloud API  ←─────────── resposta automática
```

---

## Variáveis de ambiente

Copie `.env.example` para `.env` e preencha:

| Variável | Descrição |
|----------|-----------|
| `VERIFY_TOKEN` | Token de verificação da Meta (padrão: `quadrata123`) |
| `WA_PHONE_NUMBER_ID` | ID do número no painel Meta |
| `WA_ACCESS_TOKEN` | Token de acesso da Meta |
| `ANTHROPIC_API_KEY` | Chave da API da Anthropic (crie em console.anthropic.com) — ativa a MarIAna |
| `MARIANA_MODEL` | Modelo do Claude (padrão: `claude-haiku-4-5`) |
| `MAKE_WEBHOOK_URL` | URL do Make — usado como fallback se `ANTHROPIC_API_KEY` não estiver configurada |
| `WHATSAPP_NUMERO` | Opcional. Troca o número para onde o `/fale` manda o cliente. Padrão: `(11) 98678-0000` |

---

## Deploy no Render

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

## Configurar a MarIAna (IA)

A IA roda direto pela API da Anthropic — nada para manter ligado, sem servidor
Langflow. Para ativar:

1. Acesse **console.anthropic.com** e crie uma conta.
2. Adicione um crédito inicial (ex.: US$ 5) em *Billing*.
3. Gere uma **API Key** em *API Keys*.
4. Coloque a chave na variável de ambiente `ANTHROPIC_API_KEY` (no painel do
   Render/Railway, ou no `.env` local).

Personalização:
- O comportamento e as informações da MarIAna ficam na constante
  `MARIANA_SYSTEM`, em `index.js`.
- O modelo padrão é `claude-haiku-4-5` (rápido e econômico). Para trocar, use a
  variável `MARIANA_MODEL`.
- A MarIAna lembra o contexto das últimas mensagens de cada cliente por 30
  minutos de inatividade (memória em `index.js`).

Diagnóstico: acesse `GET /mariana-status` para checar se a IA está respondendo.

---

## Menu interativo (WhatsApp)

Além da MarIAna (IA), o webhook envia **menus interativos** nativos do WhatsApp
(mensagens do tipo `list`), o mesmo recurso visual de plataformas como a Digisac,
porém direto pela Cloud API:

- O cliente envia uma **saudação** (`oi`, `olá`, `bom dia`…) ou digita **`menu`**
  → recebe o menu principal com as opções: Cotação, Sinistro/Guincho, App e Corretor.
- Ao tocar em **Sinistro/Guincho** → abre um submenu com as seguradoras e devolve
  os telefones de assistência 24h.
- **Texto livre** (perguntas abertas) → continua sendo respondido pela **MarIAna (IA)**.

Requisito: a conexão precisa ser **WhatsApp Cloud API oficial** (o número já usado
pela MarIAna atende esse requisito). Menus interativos **não** funcionam em conexões
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
| `GET` | `/mariana-status` | Testa se a IA (Claude) está respondendo |
| `GET` | `/fale` | Link da bio do Instagram — redireciona para a conversa no WhatsApp |

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

## Link da bio do Instagram (`/fale`)

A bio do `@marianaquadrata` aponta para `https://webhook.quadratadigital.com.br/fale`.
Essa rota apenas redireciona o visitante para a conversa no WhatsApp com a
MarIAna, já com a mensagem digitada:

| Link | Mensagem que abre |
|------|-------------------|
| `/fale` | `Oi` (abre o menu principal) |
| `/fale?assunto=auto` | cotação de seguro auto |
| `/fale?assunto=saude` | plano de saúde |
| `/fale?assunto=odonto` | plano odontológico |
| `/fale?assunto=vida` · `residencia` · `consorcio` · `financiamento` · `cartao` · `sinistro` | o tema correspondente |

O número de destino é o **(11) 98678-0000**. Para trocar sem mexer no código,
defina `WHATSAPP_NUMERO` no ambiente (pode escrever com máscara — `(11) 98678-0000`
— que o servidor normaliza e acrescenta o DDI 55).

> **Atenção:** esse link só responde enquanto o servidor estiver no ar e
> acessível pelo domínio. Se o domínio estiver servido por um **Cloudflare
> Tunnel** apontando para um PC local, o link cai (erro **1033**) sempre que o
> PC for desligado ou o `cloudflared` parar. Para o link nunca cair, hospede o
> servidor na nuvem (Railway/Render) ou, se preferir não depender do servidor,
> coloque o `https://wa.me/<numero>` direto na bio.
