const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");
const path = require("path");

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "quadrata.db");
const db = new Database(DB_PATH);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS clientes (
    cpf        TEXT PRIMARY KEY,
    nome       TEXT NOT NULL,
    email      TEXT,
    telefone   TEXT,
    senha_hash TEXT NOT NULL,
    ativo      INTEGER DEFAULT 1,
    criado_em  TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS apolices (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_cpf     TEXT NOT NULL,
    tipo            TEXT NOT NULL,
    numero          TEXT NOT NULL,
    seguradora      TEXT,
    descricao       TEXT,
    vigencia_inicio TEXT,
    vigencia_fim    TEXT,
    premio_mensal   TEXT,
    franquia        TEXT,
    coberturas      TEXT DEFAULT '[]',
    status          TEXT DEFAULT 'Vigente',
    criado_em       TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (cliente_cpf) REFERENCES clientes(cpf)
  );

  CREATE TABLE IF NOT EXISTS boletos (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    apolice_id     INTEGER NOT NULL,
    cliente_cpf    TEXT NOT NULL,
    vencimento     TEXT NOT NULL,
    valor          TEXT NOT NULL,
    status         TEXT DEFAULT 'Em aberto',
    linha_digitavel TEXT,
    pix_copia_cola TEXT,
    criado_em      TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (apolice_id) REFERENCES apolices(id)
  );

  CREATE TABLE IF NOT EXISTS sinistros (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_cpf  TEXT NOT NULL,
    apolice_id   INTEGER,
    protocolo    TEXT NOT NULL,
    tipo         TEXT,
    data_ocorrido TEXT,
    local        TEXT,
    descricao    TEXT,
    status       TEXT DEFAULT 'Em análise',
    criado_em    TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS admins (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario    TEXT UNIQUE NOT NULL,
    senha_hash TEXT NOT NULL
  );
`);

// Seed admin default
const adminUser = process.env.ADMIN_USER || "admin";
const adminPass = process.env.ADMIN_PASSWORD || "quadrata2025";
const adminExist = db.prepare("SELECT id FROM admins WHERE usuario = ?").get(adminUser);
if (!adminExist) {
  db.prepare("INSERT INTO admins (usuario, senha_hash) VALUES (?, ?)").run(adminUser, bcrypt.hashSync(adminPass, 10));
  console.log(`[DB] Admin criado — usuário: ${adminUser}`);
  if (!process.env.ADMIN_PASSWORD) console.warn("[DB] ATENÇÃO: usando senha padrão. Defina ADMIN_PASSWORD no ambiente.");
} else if (process.env.ADMIN_PASSWORD) {
  db.prepare("UPDATE admins SET senha_hash = ? WHERE usuario = ?").run(bcrypt.hashSync(adminPass, 10), adminUser);
}

module.exports = db;
