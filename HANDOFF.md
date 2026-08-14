# HANDOFF — Quadrata Seguros · Painel de Metas

**Data:** 2026-06-02  
**Branch:** `claude/sales-goals-dashboard-yagpc`  
**Repositório:** `quadrataseguros/whatsapp-webhook`  
**Versão atual:** `v5-full-features-2026-05-14`

---

## O que é este projeto

Painel de metas de vendas para a Quadrata Seguros. Cada vendedor registra suas vendas (valor, ramo, seguradora, comissão). O admin configura metas semanais/mensais, metas de RO e metas por seguradora.

---

## Arquitetura

| Componente | Tecnologia |
|---|---|
| Servidor | Node.js + Express |
| Banco de dados | SQLite (better-sqlite3) |
| Frontend | HTML/CSS/JS puro (sem framework) |
| Gráficos | Chart.js 4.4 |
| Fontes | Google Fonts — Inter |

### Arquivos principais

```
index.js          — servidor Express + todas as rotas da API
db.js             — banco SQLite + criação de tabelas + migrações
admin-page.js     — HTML do painel admin (exportado como string Node.js)
public/
  dashboard.html  — painel de metas (público)
atualizar.bat     — script Windows: git pull + npm install + npm start
railway.json      — configuração de deploy Railway
package.json      — dependências: express, better-sqlite3, axios
```

---

## Banco de Dados (SQLite — sales.db)

| Tabela | Descrição |
|---|---|
| `salespeople` | Vendedores (id, name, active, pin) |
| `sales` | Vendas (valor, ramo, seguradora, comissão %, data) |
| `goals` | Metas semanais/mensais por vendedor |
| `ro_goals` | Metas RO: min. vendas, % comissão mínima, prêmio |
| `seguradora_goals` | Metas por seguradora: valor ano anterior, prêmio |
| `settings` | Configurações persistidas (ex: senha admin customizada) |

---

## Funcionalidades implementadas

### Dashboard (`/dashboard.html`)
- [x] Cards por vendedor com anel SVG de progresso (vermelho → ouro)
- [x] Toggle Semanal / Mensal
- [x] Ranking competitivo com 🥇🥈🥉
- [x] Gráfico de barras: vendido vs meta (Chart.js)
- [x] Gráfico de evolução diária acumulada (linha)
- [x] Indicador de ritmo projetado no fim do período
- [x] Comparativo ▲/▼ vs período anterior em cada card
- [x] Modal de detalhe ao clicar no card (breakdown + vendas)
- [x] Identificação por PIN — vendedor se identifica, modal pré-seleciona
- [x] Seção RO (Resultado Operacional) com barras de critério
- [x] Seção Metas por Seguradora (8 empresas, meta = ano anterior × 1,10)
- [x] Tabela de vendas do período
- [x] Auto-refresh a cada 60 segundos
- [x] Tema claro + logo Quadrata (Q azul)

### Admin (`/admin.html` ou `/gestor.html`)
- [x] Login com senha (padrão: `admin123`)
- [x] Aba Metas — configura valores semanais/mensais por vendedor
- [x] Aba RO — configura min. vendas, % comissão mínima, prêmio
- [x] Aba Seguradoras — configura valor ano anterior e prêmio por seguradora/mês
- [x] Aba Vendedores — adiciona/remove vendedores + define PIN individual
- [x] Aba Vendas — histórico completo com filtros + excluir venda
- [x] Aba Config — alterar senha do admin (persiste no banco)
- [x] Exportar CSV das vendas filtradas (compatível com Excel)
- [x] Badge de versão no canto (confirmar que código novo está rodando)

---

## API Endpoints

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/stats?period=weekly\|monthly` | Stats de vendedores + totais + prev_sold |
| GET | `/api/daily-stats?period=` | Evolução diária acumulada por vendedor |
| GET | `/api/sales?period=` | Vendas do período |
| POST | `/api/sales` | Registrar venda |
| DELETE | `/api/sales/:id` | Excluir venda (admin) |
| GET | `/api/sales/all` | Todas as vendas com filtros (admin) |
| GET | `/api/salespeople` | Lista vendedores ativos |
| POST | `/api/salespeople` | Adicionar vendedor (admin) |
| DELETE | `/api/salespeople/:id` | Desativar vendedor (admin) |
| POST | `/api/salespeople/:id/verify-pin` | Verificar PIN do vendedor |
| POST | `/api/salespeople/:id/pin` | Definir PIN (admin) |
| GET | `/api/goals` | Metas cadastradas |
| POST | `/api/goals` | Salvar meta (admin) |
| GET | `/api/ro-goals` | Metas RO |
| POST | `/api/ro-goals` | Salvar meta RO (admin) |
| GET | `/api/ro-stats?period=` | Stats RO com comissão ponderada |
| GET | `/api/seguradora-goals` | Metas por seguradora |
| POST | `/api/seguradora-goals` | Salvar meta seguradora (admin) |
| GET | `/api/seguradora-stats` | Stats de seguradoras (mês atual) |
| POST | `/api/admin/verify` | Verificar senha admin |
| PUT | `/api/admin/password` | Alterar senha admin |
| GET | `/api/version` | Versão do servidor |

**Autenticação admin:** header `x-admin-password: <senha>`

---

## Variáveis de Ambiente

| Variável | Padrão | Descrição |
|---|---|---|
| `PORT` | `3000` | Porta do servidor |
| `ADMIN_PASSWORD` | `admin123` | Senha admin (fallback — DB tem prioridade) |
| `DB_PATH` | `./sales.db` | Caminho do banco SQLite |
| `LANGFLOW_URL` | `http://localhost:7860` | URL do Langflow (se usar bot) |
| `LANGFLOW_FLOW_ID` | `""` | ID do flow Langflow |
| `LANGFLOW_API_KEY` | `""` | Chave API Langflow |
| `VERIFY_TOKEN` | `quadrata123` | Token verificação webhook WhatsApp |

---

## Seguradoras configuradas

`PORTO`, `ALLIANZ`, `TOKIO MARINE`, `BRADESCO`, `YELLUM`, `HDI`, `SUHAI`, `ZURICH`

Matching por substring case-insensitive (ex: "Porto Seguro" → PORTO).

---

## Como rodar localmente (Windows)

```cmd
cd C:\Users\quadr\whatsapp-webhook
npm start
```

Ou usar `atualizar.bat` para git pull + restart automático.

Acesso: `http://localhost:3000/dashboard.html`

---

## Deploy na nuvem — Railway (PENDENTE)

O código está pronto para deploy. Falta executar no Railway:

1. Entrar em **railway.app** com GitHub (`quadrataseguros`)
2. **New Project** → Deploy from GitHub repo
3. Selecionar `quadrataseguros/whatsapp-webhook`
4. Branch: `claude/sales-goals-dashboard-yagpc`
5. Aba **Volumes** → Add Volume → Mount path: `/data`
6. Aba **Variables** → adicionar:
   - `DB_PATH` = `/data/sales.db`
   - `ADMIN_PASSWORD` = (senha desejada)
7. Aba **Settings** → Networking → **Generate Domain**
8. URL pública ficará tipo: `https://xxxx.up.railway.app`

Após deploy: dashboard em `/dashboard.html`, admin em `/admin.html`.

---

## Detalhes técnicos importantes

### Template literal em admin-page.js
O arquivo `admin-page.js` exporta o HTML do admin como uma template literal Node.js. **Regra crítica:** dentro desta string, `\n` vira quebra de linha real — sempre usar `\\n` em strings JS internas, e jamais usar caracteres especiais como BOM (U+FEFF) diretamente.

### Comissão ponderada (RO)
Fórmula: `Σ(valor × comissão%) / Σ(valor) × 100`. Evita distorção por vendas pequenas com % alto.

### Período semanal
Segunda a domingo (semana ISO). Período mensal: dia 1 ao último dia do mês.

---

## Histórico de commits relevantes

```
db9d052  Fix: erros de sintaxe \n e BOM no admin
fd39052  v5: ranking, gráfico diário, ritmo, comparativo, PIN, detalhes, CSV, alterar senha
5718420  Preparar Railway deploy (DB_PATH, railway.json)
43e1261  Tema claro + logo Quadrata
e4d2f6a  Metas por seguradora (+10% ano anterior)
50c5330  RO (Resultado Operacional) com premiação
```
