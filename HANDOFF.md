# HANDOFF — Painel de Metas · Operação Quadrata × Piscinão Veículos

**Atualizado em:** 2026-10-05
**Repositório:** `quadrataseguros/whatsapp-webhook`
**Branch de trabalho:** `claude/dashboard-metas-comissoes-xz5aj8` (já mergeado no `main`)

---

## O que é este repositório

Um único serviço Node.js que faz **duas coisas**:

1. **MarIAna** — o webhook do WhatsApp/Instagram com atendimento por IA (API da Anthropic). É o que já roda em produção no **Render**.
2. **Painel de Metas** — o dashboard de metas e comissões da operação Quadrata × Piscinão Veículos. É a parte nova, **ainda não publicada**.

As duas convivem no mesmo `index.js` e sobem juntas. Isso importa: mexer numa pode afetar a outra.

---

## O que foi feito nesta sessão

### 1. Recuperação do painel que estava perdido
O painel tinha sido construído em maio e ficou parado num PR aberto (**#3**) que nunca foi mergeado. Foi recuperado, atualizado contra o `main` atual (que havia evoluído bastante — a MarIAna migrou de Langflow para a API da Anthropic) e os conflitos resolvidos preservando as duas partes. O PR #3 foi fechado, substituído pelo **#24**.

### 2. Configuração para a parceria
A operação é **exclusiva da parceria Quadrata × Piscinão Veículos** (PR **#25**):

- **Equipe:** Abraão, Marcelo, Léo, André, Fernanda, Wallace — cadastrados automaticamente na criação do banco (`db.js`)
- **Comissão automática** — o vendedor não digita mais percentual nenhum
- **IOF abatido sozinho** — o vendedor informa o prêmio bruto, o sistema chega ao líquido
- **Aviso de estorno** proporcional para cancelamentos antes de 8 meses
- **Azul e Itaú** adicionadas às metas por seguradora
- Cabeçalho co-branded "Quadrata Seguros × Piscinão Veículos" (em texto — ver pendências)

### 3. Correções de bugs encontrados no caminho
- **Meta de comissão do RO** estava fixada em 16%, herdada do modelo antigo. Com a nova faixa de 2% a 4%, nenhum vendedor jamais bateria a meta. Ajustada para a faixa real.
- **Node 18 quebraria o deploy** — o `better-sqlite3` 12 exige Node 20+, mas o `package.json` declarava `>=18`. A plataforma poderia escolher a 18 e derrubar a instalação (e junto, a MarIAna). Corrigido para `>=20` + `.nvmrc`.

---

## Regra de comissão (o coração da operação)

Implementada em `index.js`, na seção `calcularVenda()`. **Calculada sempre no servidor** — o cliente não consegue forjar percentual.

```
prêmio líquido = prêmio bruto ÷ (1 + IOF%)
comissão       = prêmio líquido × percentual
```

**Percentual por seguradora:**

| Seguradora | Comissão |
|---|---|
| Porto, Azul, Itaú | **4%** |
| Todas as demais | **2%** |

Casamento por substring, sem acento e sem diferenciar maiúsculas ("Porto Seguro" → Porto).

**Alíquotas de IOF por ramo:**

| Ramo | IOF |
|---|---|
| Vida, Acidentes Pessoais | 0,38% |
| Saúde | 2,38% |
| Demais (auto, residencial, empresarial…) | 7,38% |

**Conferência:** R$ 5.000 em auto → IOF R$ 343,64 → líquido R$ 4.656,36 → **R$ 186,25** na Porto (4%) ou **R$ 93,13** na HDI (2%).

As regras ficam expostas em `GET /api/config`, que é de onde o formulário lê — mudar a regra no servidor atualiza a tela sozinho.

---

## Arquitetura

| Componente | Tecnologia |
|---|---|
| Servidor | Node.js 20+ · Express |
| Banco | SQLite (`better-sqlite3`) |
| Frontend | HTML/CSS/JS puro, sem framework |
| Gráficos | Chart.js 4.4 (via CDN) |

```
index.js          servidor Express: webhook da MarIAna + API do painel
db.js             SQLite, tabelas, migrações e cadastro da equipe
admin-page.js     HTML do painel admin (exportado como string)
public/
  dashboard.html  o painel em si
railway.json      configuração de deploy
.nvmrc            Node 20
```

### Tabelas

| Tabela | O que guarda |
|---|---|
| `salespeople` | vendedores (nome, ativo, PIN) |
| `sales` | vendas — ver observação abaixo |
| `goals` | metas semanais/mensais por vendedor |
| `ro_goals` | metas de Resultado Operacional (mín. vendas, mín. comissão, prêmio) |
| `seguradora_goals` | metas por seguradora (valor ano anterior, prêmio) |
| `settings` | configurações (ex: senha do admin alterada) |

⚠️ **Atenção ao nomear colunas de `sales`:** `gross_value` é o prêmio **bruto** digitado; `value` é o prêmio **líquido** e é a base de tudo (comissão, metas, rankings). `iof_pct` e `commission_pct` ficam gravados na venda para auditoria.

---

## Estado atual

✅ Tudo commitado e mergeado no `main` (PRs #24 e #25)
✅ Boot testado em modo produção (`npm ci --omit=dev` + `DB_PATH` em volume): banco criado, painel e admin respondendo 200, webhook do WhatsApp intacto
❌ **Não está no ar** — falta o deploy

**Prévia visual** (estática, dados de exemplo, não salva nada):
https://claude.ai/code/artifact/b6059110-efaa-4d5c-8ff6-6e35d9a39b11

---

## Pendências

### 1. Deploy no Railway — só o dono da conta consegue fazer

1. **railway.app** → Login com GitHub (`quadrataseguros`)
2. **New Project** → **Deploy from GitHub repo** → `quadrataseguros/whatsapp-webhook`, branch `main`
3. ⚠️ **Adicionar o volume ANTES do primeiro deploy** — sem ele as vendas somem a cada atualização:
   **Variables** → **+ New Volume** → Mount path `/data`
4. **Variables:**
   - `DB_PATH` = `/data/sales.db`
   - `ADMIN_PASSWORD` = uma senha real (**não deixar `admin123`** — o painel fica público na internet)
5. **Settings** → **Networking** → **Generate Domain**
6. Painel em `/dashboard.html`, admin em `/admin.html`

### 2. Verificar a MarIAna no Render
O `main` mudou, então o Render vai redeployar com o painel junto. A correção do Node 20 foi feita justamente para isso não quebrar, **mas ninguém confirmou ainda** se o bot continua respondendo no WhatsApp (o ambiente da sessão não alcança o Render).

### 3. Cuidado com o endereço do Render
Depois do redeploy, o Render **também** vai servir o painel — porém **sem volume, as vendas se perdem a cada reinício**. Divulgar para a equipe **apenas o endereço do Railway**.

### 4. Logos
O cabeçalho usa texto. Para usar as imagens reais, é preciso **os arquivos PNG** das logos Quadrata e Piscinão Veículos no repositório (imagens coladas no chat não viram arquivo automaticamente).

### 5. Ideia descartada por ora
Controle de estorno — marcar apólice cancelada e o sistema descontar a comissão proporcional (X/8 avos). Hoje existe **só o aviso**. Foi conversado e adiado.

---

## Variáveis de ambiente

| Variável | Padrão | Para quê |
|---|---|---|
| `PORT` | `3000` | porta |
| `DB_PATH` | `./sales.db` | **em produção, apontar para o volume** |
| `ADMIN_PASSWORD` | `admin123` | senha do admin (o banco tem prioridade, se alterada pela tela) |
| `ANTHROPIC_API_KEY` | — | IA da MarIAna |
| `MARIANA_MODEL` | `claude-haiku-4-5` | modelo da IA |
| `WA_PHONE_NUMBER_ID` / `WA_ACCESS_TOKEN` | — | WhatsApp |
| `VERIFY_TOKEN` | `quadrata123` | verificação do webhook |
| `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` | — | espelho das conversas |

---

## Rodando localmente

```bash
npm install
DB_PATH=./sales.db npm start
# painel: http://localhost:3000/dashboard.html
# admin:  http://localhost:3000/admin.html  (senha: admin123)
```
