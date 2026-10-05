const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DB_PATH || path.join(__dirname, 'sales.db');
if (process.env.DB_PATH) {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS salespeople (
    id   INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT    NOT NULL UNIQUE,
    active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS sales (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    salesperson_id INTEGER NOT NULL REFERENCES salespeople(id),
    value          REAL    NOT NULL,
    ramo           TEXT    NOT NULL,
    seguradora     TEXT    NOT NULL,
    sale_date      TEXT    NOT NULL,
    notes          TEXT,
    created_at     TEXT DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS goals (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    salesperson_id INTEGER NOT NULL REFERENCES salespeople(id),
    period_type    TEXT    NOT NULL CHECK(period_type IN ('weekly','monthly')),
    goal_value     REAL    NOT NULL,
    updated_at     TEXT DEFAULT (datetime('now', 'localtime')),
    UNIQUE(salesperson_id, period_type)
  );

  CREATE TABLE IF NOT EXISTS ro_goals (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    salesperson_id INTEGER NOT NULL REFERENCES salespeople(id),
    period_type    TEXT    NOT NULL CHECK(period_type IN ('weekly','monthly')),
    min_sales      INTEGER NOT NULL DEFAULT 0,
    min_commission REAL    NOT NULL DEFAULT 2.0,
    bonus_value    REAL    NOT NULL DEFAULT 0,
    updated_at     TEXT DEFAULT (datetime('now', 'localtime')),
    UNIQUE(salesperson_id, period_type)
  );

  CREATE TABLE IF NOT EXISTS seguradora_goals (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    seguradora      TEXT    NOT NULL,
    month           INTEGER NOT NULL CHECK(month BETWEEN 1 AND 12),
    year            INTEGER NOT NULL,
    prev_year_value REAL    NOT NULL DEFAULT 0,
    bonus_value     REAL    NOT NULL DEFAULT 0,
    updated_at      TEXT DEFAULT (datetime('now', 'localtime')),
    UNIQUE(seguradora, month, year)
  );

  CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  -- Qual persona atende cada contato (MarIAna ou FabrícIO). O WhatsApp é um
  -- número só: a porta de entrada (Instagram de cada um) decide quem responde
  -- na primeira mensagem e a escolha fica valendo daqui para a frente, para o
  -- cliente não ver o atendente trocar de nome no meio da conversa.
  -- A chave é "<plataforma>:<id do contato>", ex.: "whatsapp:5511999999999".
  CREATE TABLE IF NOT EXISTS contact_persona (
    chave      TEXT PRIMARY KEY,
    persona    TEXT NOT NULL,
    updated_at TEXT DEFAULT (datetime('now', 'localtime'))
  );

  -- Token do Instagram de cada persona, renovado pelo próprio servidor.
  -- O token do ambiente (IG_ACCESS_TOKEN*) vale 60 dias e não se renova
  -- sozinho: vencido, a persona para de responder direct sem erro visível
  -- para o cliente. Aqui fica a versão VIVA — a última renovação — e o
  -- ambiente passa a ser só a semente da cadeia. Ver instagram-token.js.
  --
  -- origem_env é o token de ambiente que originou esta cadeia. Trocar a
  -- variável no Railway (reautenticação, conta nova) muda esse valor e a
  -- cadeia recomeça dali: mão humana sempre ganha da renovação automática.
  CREATE TABLE IF NOT EXISTS ig_token (
    persona    TEXT PRIMARY KEY,
    token      TEXT NOT NULL,
    origem_env TEXT NOT NULL,
    expira_em  TEXT,
    updated_at TEXT DEFAULT (datetime('now', 'localtime'))
  );
`);

// Migrations
try { db.exec('ALTER TABLE sales ADD COLUMN commission_pct REAL DEFAULT 0'); } catch (_) {}
try { db.exec('ALTER TABLE salespeople ADD COLUMN pin TEXT'); } catch (_) {}
// gross_value = prêmio bruto digitado (com IOF); value = prêmio líquido, base da comissão
try { db.exec('ALTER TABLE sales ADD COLUMN gross_value REAL'); } catch (_) {}
try { db.exec('ALTER TABLE sales ADD COLUMN iof_pct REAL DEFAULT 0'); } catch (_) {}
// De onde o contato chegou e quando — atribuição de PRIMEIRO toque: gravadas
// uma vez, na primeira mensagem, e nunca sobrescritas. É o que responde "qual
// canal trouxe essa pessoa"; ver ORIGENS em personas.js.
try { db.exec('ALTER TABLE contact_persona ADD COLUMN origem TEXT'); } catch (_) {}
try { db.exec("ALTER TABLE contact_persona ADD COLUMN created_at TEXT"); } catch (_) {}
// Conta do Instagram ligada pelo próprio navegador (rota /admin/instagram): o
// id vem junto do token, e com ele no banco o servidor atende a persona sem
// depender de ninguém copiar variável de ambiente nenhuma.
try { db.exec('ALTER TABLE ig_token ADD COLUMN ig_id TEXT'); } catch (_) {}
try { db.exec('ALTER TABLE ig_token ADD COLUMN username TEXT'); } catch (_) {}

// Equipe da operação Quadrata × Piscinão Veículos
const EQUIPE = ['Abraão', 'Marcelo', 'Léo', 'André', 'Fernanda', 'Wallace'];
const insertPerson = db.prepare('INSERT OR IGNORE INTO salespeople (name) VALUES (?)');
EQUIPE.forEach((nome) => insertPerson.run(nome));

module.exports = db;
