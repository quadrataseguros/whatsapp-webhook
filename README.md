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

## Publicar no Instagram (posts e carrosséis)

Além de responder DMs, a MarIAna pode **publicar conteúdo no feed** para
divulgar os produtos. A publicação usa a Graph API da Meta (a conta precisa ser
**Business/Creator** e o token ter a permissão `instagram_content_publish`).

Configure no `.env` (veja `.env.example`):

- `ADMIN_TOKEN` — protege o endpoint de publicação (obrigatório para ativá-lo).
- `PUBLIC_BASE_URL` — URL pública do servidor, p/ servir imagens locais de `./media`.
- `IG_PUBLISH_USER_ID` / `IG_PUBLISH_TOKEN` — se vazios, reutiliza `IG_USER_ID` / `IG_ACCESS_TOKEN`.

**Como a Meta lê as imagens:** ela só aceita **URL pública** (não upload de
arquivo). Coloque as imagens na pasta `./media` e elas ficam acessíveis em
`PUBLIC_BASE_URL/media/<arquivo>`. Ou passe URLs já públicas diretamente.

**Pela linha de comando:**
```bash
# Carrossel a partir de arquivos locais (pasta ./media)
node instagram-publish.js --local slide1.png slide2.png --caption "Sua legenda"

# Post único a partir de uma URL pública
node instagram-publish.js --image https://.../post.jpg --caption "Sua legenda"

# Validar sem publicar
node instagram-publish.js --local slide1.png --caption "teste" --dry-run
```

**Pelo endpoint HTTP** (`POST /instagram/publish`, header `x-admin-token`):
```bash
curl -X POST https://SEU-DOMINIO/instagram/publish \
  -H "x-admin-token: SEU_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"local":["slide1.png","slide2.png"],"caption":"Sua legenda"}'
```

> Ideias de post e legendas prontas: veja **`CONTEUDO-INSTAGRAM.md`**.

---

## Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/` | Sinaliza que o webhook está no ar |
| `GET` | `/webhook` | Verificação Meta |
| `POST` | `/webhook` | Recebe mensagens WhatsApp/Instagram |
| `GET` | `/health` | Status do servidor, uptime e modo ativo |
| `GET` | `/mariana-status` | Testa se a IA (Claude) está respondendo |
| `POST` | `/instagram/publish` | Publica post/carrossel no feed (requer `ADMIN_TOKEN`) |
| `GET` | `/media/<arquivo>` | Serve imagens da pasta `./media` como URL pública |

> **Webhook fora do ar?** Se o domínio mostrar *Cloudflare Tunnel error 1033*
> (ou a MarIAna parar de responder), veja o guia de recuperação em
> **`TROUBLESHOOTING.md`**.

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
