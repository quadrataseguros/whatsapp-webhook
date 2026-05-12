const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'sales.db'));
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
`);

// Migration: add commission_pct if table already exists without it
try { db.exec('ALTER TABLE sales ADD COLUMN commission_pct REAL DEFAULT 0'); } catch (_) {}

module.exports = db;
