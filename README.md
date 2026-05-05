# WhatsApp Webhook — MarIAna · Quadrata Seguros

Webhook Node.js que recebe mensagens do WhatsApp Business API e processa via **Typebot**, **Langflow** ou **Make** (nessa ordem de prioridade).

---

## Arquitetura

```
WhatsApp  →  Meta Webhook  →  Este servidor  →  Typebot (fluxo visual)
                                             →  Langflow (MarIAna IA)
                                             →  Make (fallback)
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
| `TYPEBOT_API_URL` | URL base do Typebot (padrão: `https://typebot.io`) |
| `TYPEBOT_ID` | ID do bot no Typebot — **ativa o modo Typebot** |
| `LANGFLOW_URL` | URL do servidor Langflow |
| `LANGFLOW_FLOW_ID` | ID do flow da MarIAna no Langflow |
| `LANGFLOW_API_KEY` | API Key do Langflow (se habilitada) |
| `MAKE_WEBHOOK_URL` | URL do Make — usado como fallback final |

**Prioridade:** `TYPEBOT_ID` > `LANGFLOW_FLOW_ID` > `MAKE_WEBHOOK_URL`

---

## Integração com Typebot

### 1. Criar o bot

1. Acesse [typebot.io](https://typebot.io) e crie uma conta gratuita.
2. Crie um novo Typebot com o fluxo de conversa desejado.
3. Publique o bot (botão **Publish** no canto superior direito).

### 2. Obter o TYPEBOT_ID

Na URL do editor o ID aparece assim:
```
https://app.typebot.io/typebots/xxxxxxxxxxxxxxxx/edit
                                ^^^^^^^^^^^^^^^^
                                esse é o TYPEBOT_ID
```

### 3. Configurar variáveis

```env
TYPEBOT_API_URL=https://typebot.io
TYPEBOT_ID=xxxxxxxxxxxxxxxx
```

### Sessões por usuário

O servidor mantém uma sessão Typebot separada para cada número de telefone.
As sessões são armazenadas em memória — reiniciar o servidor resetará todas as conversas ativas.

### Typebot self-hosted

Se você usa Typebot em servidor próprio, basta trocar a URL:
```env
TYPEBOT_API_URL=https://seu-typebot.com
```

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

## Langflow — acesso pelo tablet

### Opção 1 — Local (mesmo WiFi)

```bash
pip install langflow
langflow run --host 0.0.0.0 --port 7860
```

No tablet, acesse: `http://IP-DO-PC:7860`

Para descobrir o IP do PC:
```bash
# Linux/Mac
ip route get 1 | awk '{print $7}'

# Windows
ipconfig | findstr "IPv4"
```

### Opção 2 — Nuvem gratuita (acesso de qualquer lugar)

**Render.com:**
1. Crie conta em render.com
2. New → Web Service → conecte repositório com Langflow
3. Build: `pip install langflow`
4. Start: `langflow run --host 0.0.0.0 --port 7860`
5. Use a URL gerada como `LANGFLOW_URL`

---

## Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/webhook` | Verificação Meta |
| `POST` | `/webhook` | Recebe mensagens WhatsApp |
| `GET` | `/health` | Status do servidor e modo ativo |

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
