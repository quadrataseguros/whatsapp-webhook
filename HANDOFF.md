# HANDOFF — Painel de Metas · Operação Quadrata × Piscinão Veículos

**Atualizado em:** 2026-10-05

Este documento cobre **o painel de metas e comissões**. Para subir o servidor
na nuvem, o guia é o **[DEPLOY-RAILWAY.md](DEPLOY-RAILWAY.md)** — mais completo
e mantido à parte.

---

## O que é este repositório

Um único serviço Node.js que faz **duas coisas que sobem juntas**:

1. **MarIAna / FabrícIO** — webhook do WhatsApp e Instagram com atendimento por IA
2. **Painel de Metas** — o dashboard da operação Quadrata × Piscinão Veículos

Mexer numa parte pode derrubar a outra. O `index.js` é compartilhado.

---

## A operação Quadrata × Piscinão Veículos

Parceria **exclusiva** com a revenda Piscinão Veículos. O painel existe para
essa operação: equipe própria, regra de comissão própria.

**Equipe** (cadastrada automaticamente em `db.js`):
Abraão, Marcelo, Léo, André, Fernanda, Wallace

---

## Regra de comissão — o coração da operação

Implementada em `calcularVenda()`, no `index.js`. **Calculada sempre no
servidor**, nunca no navegador: o vendedor não digita percentual e não tem como
forjar o valor.

```
prêmio líquido = prêmio bruto ÷ (1 + IOF%)
comissão       = prêmio líquido × percentual
```

**Percentual por seguradora:**

| Seguradora | Comissão |
|---|---|
| Porto, Azul, Itaú | **4%** |
| Todas as demais | **2%** |

Casamento por substring, sem acento e sem diferenciar maiúsculas
("Porto Seguro" → Porto).

**IOF por ramo:**

| Ramo | IOF |
|---|---|
| Vida, Acidentes Pessoais | 0,38% |
| Saúde | 2,38% |
| Demais (auto, residencial, empresarial…) | 7,38% |

**Conferência:** R$ 5.000 em auto → IOF R$ 343,64 → líquido R$ 4.656,36 →
**R$ 186,25** na Porto (4%) ou **R$ 93,13** na HDI (2%).

As regras ficam expostas em `GET /api/config`, que é de onde o formulário lê —
mudar a regra no servidor atualiza a tela sozinho. `GET /api/simular-venda`
permite conferir um cálculo sem gravar nada.

**Estorno:** cancelamento antes de 8 meses gera estorno proporcional da
comissão. Hoje o painel **apenas avisa** (no formulário de venda e no resumo de
comissão). Não há controle automático — foi conversado e adiado.

---

## ⚠️ Armadilha ao mexer na tabela `sales`

| Coluna | O que é |
|---|---|
| `gross_value` | prêmio **bruto** — o que o vendedor digitou, com IOF |
| `value` | prêmio **líquido** — **base de comissões, metas e rankings** |
| `iof_pct` | alíquota aplicada, gravada para auditoria |
| `commission_pct` | percentual aplicado, gravado para auditoria |

Usar `gross_value` onde deveria ser `value` infla metas e comissões
silenciosamente. O nome `value` é herdado da versão antiga, quando não havia
distinção.

---

## Arquitetura

| Componente | Tecnologia |
|---|---|
| Servidor | Node.js **20+** · Express |
| Banco | SQLite (`better-sqlite3`) |
| Frontend | HTML/CSS/JS puro, sem framework |
| Gráficos | Chart.js 4.4 (CDN) |

```
index.js          servidor Express: webhooks + API do painel
db.js             SQLite, tabelas, migrações e cadastro da equipe
admin-page.js     HTML do admin (exportado como string)
public/
  dashboard.html  o painel
railway.json      deploy (numReplicas: 1 — ver abaixo)
```

> **Node 20+ é obrigatório.** O `better-sqlite3` 12 não roda em Node 18.
> O `package.json` declara `>=20` justamente para a plataforma não escolher
> uma versão incompatível e quebrar a instalação — junto com a MarIAna.

> **Uma réplica só.** SQLite em arquivo: duas instâncias gravando no mesmo
> banco corrompem os dados. Já fixado em `railway.json`.

### Tabelas

`salespeople` (vendedores, com PIN) · `sales` (vendas) · `goals` (metas
semanais/mensais) · `ro_goals` (Resultado Operacional) · `seguradora_goals`
(metas por seguradora) · `settings` (ex: senha do admin alterada)

### Principais rotas do painel

| Rota | Função |
|---|---|
| `GET /api/config` | regras de IOF e comissão |
| `GET /api/simular-venda` | simula um cálculo sem gravar |
| `GET /api/stats` · `/api/daily-stats` | números do painel |
| `GET POST DELETE /api/sales` | vendas |
| `GET POST /api/goals` · `/api/ro-goals` · `/api/seguradora-goals` | metas |
| `GET /api/ro-stats` · `/api/seguradora-stats` | premiações |
| `POST /api/salespeople/:id/verify-pin` | identificação do vendedor |

Rotas de admin exigem o header `x-admin-password`.

---

## Telas

- **`/dashboard.html`** — cards por vendedor com anel de progresso, ranking,
  gráfico diário, ritmo projetado, comparativo com o período anterior, seção de
  Resultado Operacional e metas por seguradora
- **`/admin.html`** — metas, RO, seguradoras, vendedores (com PIN), histórico de
  vendas, exportação CSV e troca de senha

**Prévia visual** (estática, dados de exemplo, não salva nada):
https://claude.ai/code/artifact/b6059110-efaa-4d5c-8ff6-6e35d9a39b11

---

## Pendências

1. **Deploy** — seguir o [DEPLOY-RAILWAY.md](DEPLOY-RAILWAY.md). Três coisas não
   podem faltar: o **volume em `/data`**, `DB_PATH=/data/sales.db` e
   **`TZ=America/Sao_Paulo`** (sem o fuso, venda registrada depois das 21h cai
   no dia seguinte e a semana do painel vira na hora errada).
2. **Trocar a `ADMIN_PASSWORD`** — o padrão `admin123` não pode ir para um painel
   exposto na internet.
3. **Logos** — o cabeçalho usa texto. Para usar as imagens reais, é preciso os
   arquivos PNG no repositório (imagem colada no chat não vira arquivo).
4. **Controle de estorno** — hoje só existe o aviso. Se um dia for automatizar:
   marcar apólice cancelada e descontar a comissão proporcional (X/8 avos).

---

## Rodando localmente

```bash
npm install
DB_PATH=./sales.db TZ=America/Sao_Paulo npm start
# painel: http://localhost:3000/dashboard.html
# admin:  http://localhost:3000/admin.html   (senha padrão: admin123)
```
