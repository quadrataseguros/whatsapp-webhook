# WhatsApp Webhook — MarIAna · Quadrata Seguros

Webhook Node.js que recebe mensagens do WhatsApp Business API, processa via **Langflow** e envia respostas automáticas de volta ao cliente.

---

## Arquitetura

```
WhatsApp  →  Meta Webhook  →  Este servidor  →  Langflow (MarIAna IA)
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
| `LANGFLOW_URL` | URL do servidor Langflow |
| `LANGFLOW_FLOW_ID` | ID do flow da MarIAna no Langflow |
| `LANGFLOW_API_KEY` | API Key do Langflow (se habilitada) |
| `MAKE_WEBHOOK_URL` | URL do Make — usado como fallback se não houver `LANGFLOW_FLOW_ID` |

---

## Gerar API Key no Langflow

1. Acesse `https://langflow.quadratadigital.com.br`
2. Menu lateral esquerdo → **Settings** (ícone de engrenagem)
3. Clique em **API Keys**
4. Clique em **+ Add New** (ou **Create API Key**)
5. Dê um nome (ex.: `whatsapp-webhook`) e copie a chave gerada
6. Cole como valor de `LANGFLOW_API_KEY`

> A chave só aparece uma vez — guarde em local seguro.

---

## Deploy no Cloudflare

Se o servidor roda atrás do **Cloudflare Tunnel** (ou num VPS com Cloudflare como proxy):

1. No servidor, crie o arquivo `.env` com todas as variáveis
2. Execute: `npm install && npm start`
3. No Cloudflare Tunnel, aponte o domínio para `localhost:3000`
4. No painel da Meta, configure:
   - **Callback URL:** `https://seu-dominio.com/webhook`
   - **Verify Token:** valor de `VERIFY_TOKEN`

### Variáveis obrigatórias para produção

```env
VERIFY_TOKEN=quadrata123
WA_PHONE_NUMBER_ID=<ID do número Meta>
WA_ACCESS_TOKEN=<Token permanente Meta>
LANGFLOW_URL=https://langflow.quadratadigital.com.br
LANGFLOW_FLOW_ID=aa5f37a2-f5f2-4ea6-8480-564f322036bf
LANGFLOW_API_KEY=<chave gerada no Langflow>
```

---

## Deploy no Render (alternativa)

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

## Encontrar o Flow ID no Langflow

1. Acesse `https://langflow.quadratadigital.com.br`
2. Clique no flow da MarIAna
3. A URL mostrará: `/flow/aa5f37a2-f5f2-4ea6-8480-564f322036bf/...`
4. O UUID entre `/flow/` e `/folder/` é o `LANGFLOW_FLOW_ID`

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
