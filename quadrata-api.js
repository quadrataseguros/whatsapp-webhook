const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("./quadrata-db");

const router = express.Router();
const SECRET = process.env.JWT_SECRET || "quadrata-app-secret-2025";
if (!process.env.JWT_SECRET) console.warn("[API] ATENÇÃO: JWT_SECRET não definido. Defina no ambiente para produção.");

// ── Middleware ──────────────────────────────────────────────
function authCliente(req, res, next) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith("Bearer ")) return res.status(401).json({ erro: "Não autorizado" });
  try {
    req.cliente = jwt.verify(h.slice(7), SECRET);
    next();
  } catch {
    res.status(401).json({ erro: "Token inválido ou expirado" });
  }
}

function authAdmin(req, res, next) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith("Bearer ")) return res.status(401).json({ erro: "Não autorizado" });
  try {
    const payload = jwt.verify(h.slice(7), SECRET);
    if (!payload.admin) return res.status(403).json({ erro: "Acesso negado" });
    req.admin = payload;
    next();
  } catch {
    res.status(401).json({ erro: "Token inválido ou expirado" });
  }
}

// ── Cliente: Login ──────────────────────────────────────────
router.post("/cliente/login", (req, res) => {
  const cpf = (req.body.cpf || "").replace(/\D/g, "");
  const { senha } = req.body;
  if (!cpf || !senha) return res.status(400).json({ erro: "CPF e senha obrigatórios" });

  const cliente = db.prepare("SELECT * FROM clientes WHERE cpf = ? AND ativo = 1").get(cpf);
  if (!cliente || !bcrypt.compareSync(senha, cliente.senha_hash))
    return res.status(401).json({ erro: "CPF ou senha incorretos" });

  const token = jwt.sign({ cpf: cliente.cpf, nome: cliente.nome }, SECRET, { expiresIn: "30d" });
  const { senha_hash, ...perfil } = cliente;
  res.json({ token, cliente: perfil });
});

// ── Cliente: Perfil ─────────────────────────────────────────
router.get("/cliente/perfil", authCliente, (req, res) => {
  const c = db.prepare("SELECT cpf,nome,email,telefone,criado_em FROM clientes WHERE cpf=?").get(req.cliente.cpf);
  if (!c) return res.status(404).json({ erro: "Cliente não encontrado" });
  res.json(c);
});

// ── Cliente: Apólices ───────────────────────────────────────
router.get("/cliente/apolices", authCliente, (req, res) => {
  const rows = db.prepare("SELECT * FROM apolices WHERE cliente_cpf = ? ORDER BY criado_em DESC").all(req.cliente.cpf);
  const result = rows.map(r => ({ ...r, coberturas: JSON.parse(r.coberturas || "[]") }));
  res.json(result);
});

router.get("/cliente/apolices/:id", authCliente, (req, res) => {
  const row = db.prepare("SELECT * FROM apolices WHERE id = ? AND cliente_cpf = ?").get(req.params.id, req.cliente.cpf);
  if (!row) return res.status(404).json({ erro: "Apólice não encontrada" });
  res.json({ ...row, coberturas: JSON.parse(row.coberturas || "[]") });
});

// ── Cliente: Boletos ────────────────────────────────────────
router.get("/cliente/boletos", authCliente, (req, res) => {
  const rows = db.prepare(
    `SELECT b.*, a.tipo, a.numero, a.seguradora FROM boletos b
     JOIN apolices a ON a.id = b.apolice_id
     WHERE b.cliente_cpf = ? ORDER BY b.vencimento DESC`
  ).all(req.cliente.cpf);
  res.json(rows);
});

// ── Cliente: Sinistros ──────────────────────────────────────
router.get("/cliente/sinistros", authCliente, (req, res) => {
  const rows = db.prepare("SELECT * FROM sinistros WHERE cliente_cpf = ? ORDER BY criado_em DESC").all(req.cliente.cpf);
  res.json(rows);
});

router.post("/cliente/sinistro", authCliente, (req, res) => {
  const { apolice_id, tipo, data_ocorrido, local, descricao } = req.body;
  const protocolo = `SIN-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
  db.prepare(
    "INSERT INTO sinistros (cliente_cpf, apolice_id, protocolo, tipo, data_ocorrido, local, descricao) VALUES (?,?,?,?,?,?,?)"
  ).run(req.cliente.cpf, apolice_id || null, protocolo, tipo, data_ocorrido, local, descricao);
  res.status(201).json({ protocolo, status: "Em análise" });
});

// ── Admin: Login ────────────────────────────────────────────
router.post("/admin/login", (req, res) => {
  const { usuario, senha } = req.body;
  const adm = db.prepare("SELECT * FROM admins WHERE usuario = ?").get(usuario);
  if (!adm || !bcrypt.compareSync(senha, adm.senha_hash))
    return res.status(401).json({ erro: "Credenciais inválidas" });
  const token = jwt.sign({ admin: true, usuario }, SECRET, { expiresIn: "12h" });
  res.json({ token });
});

// ── Admin: Clientes ─────────────────────────────────────────
router.get("/admin/clientes", authAdmin, (_req, res) => {
  const rows = db.prepare(
    `SELECT c.cpf, c.nome, c.email, c.telefone, c.ativo, c.criado_em,
            COUNT(a.id) as total_apolices
     FROM clientes c LEFT JOIN apolices a ON a.cliente_cpf = c.cpf
     GROUP BY c.cpf ORDER BY c.nome`
  ).all();
  res.json(rows);
});

router.post("/admin/clientes", authAdmin, (req, res) => {
  const { cpf, nome, email, telefone, senha } = req.body;
  const cpfNum = (cpf || "").replace(/\D/g, "");
  if (!cpfNum || !nome || !senha) return res.status(400).json({ erro: "CPF, nome e senha obrigatórios" });
  const exists = db.prepare("SELECT cpf FROM clientes WHERE cpf = ?").get(cpfNum);
  if (exists) return res.status(409).json({ erro: "CPF já cadastrado" });
  const hash = bcrypt.hashSync(senha, 10);
  db.prepare("INSERT INTO clientes (cpf, nome, email, telefone, senha_hash) VALUES (?,?,?,?,?)").run(cpfNum, nome, email, telefone, hash);
  res.status(201).json({ cpf: cpfNum, nome });
});

router.put("/admin/clientes/:cpf", authAdmin, (req, res) => {
  const { nome, email, telefone, ativo, senha } = req.body;
  const cpfNum = req.params.cpf.replace(/\D/g, "");
  if (senha) {
    const hash = bcrypt.hashSync(senha, 10);
    db.prepare("UPDATE clientes SET nome=?, email=?, telefone=?, ativo=?, senha_hash=? WHERE cpf=?").run(nome, email, telefone, ativo ?? 1, hash, cpfNum);
  } else {
    db.prepare("UPDATE clientes SET nome=?, email=?, telefone=?, ativo=? WHERE cpf=?").run(nome, email, telefone, ativo ?? 1, cpfNum);
  }
  res.json({ ok: true });
});

router.delete("/admin/clientes/:cpf", authAdmin, (req, res) => {
  db.prepare("DELETE FROM clientes WHERE cpf = ?").run(req.params.cpf);
  res.json({ ok: true });
});

// ── Admin: Apólices ─────────────────────────────────────────
router.get("/admin/apolices", authAdmin, (req, res) => {
  const { cpf } = req.query;
  const rows = cpf
    ? db.prepare("SELECT a.*, c.nome as cliente_nome FROM apolices a JOIN clientes c ON c.cpf=a.cliente_cpf WHERE a.cliente_cpf=? ORDER BY a.criado_em DESC").all(cpf)
    : db.prepare("SELECT a.*, c.nome as cliente_nome FROM apolices a JOIN clientes c ON c.cpf=a.cliente_cpf ORDER BY a.criado_em DESC").all();
  res.json(rows.map(r => ({ ...r, coberturas: JSON.parse(r.coberturas || "[]") })));
});

router.post("/admin/apolices", authAdmin, (req, res) => {
  const { cliente_cpf, tipo, numero, seguradora, descricao, vigencia_inicio, vigencia_fim, premio_mensal, franquia, coberturas, status } = req.body;
  if (!cliente_cpf || !tipo || !numero) return res.status(400).json({ erro: "Cliente, tipo e número obrigatórios" });
  const cpfNum = cliente_cpf.replace(/\D/g, "");
  const cob = JSON.stringify(coberturas || []);
  const r = db.prepare(
    "INSERT INTO apolices (cliente_cpf,tipo,numero,seguradora,descricao,vigencia_inicio,vigencia_fim,premio_mensal,franquia,coberturas,status) VALUES (?,?,?,?,?,?,?,?,?,?,?)"
  ).run(cpfNum, tipo, numero, seguradora, descricao, vigencia_inicio, vigencia_fim, premio_mensal, franquia, cob, status || "Vigente");
  res.status(201).json({ id: r.lastInsertRowid });
});

router.put("/admin/apolices/:id", authAdmin, (req, res) => {
  const { tipo, numero, seguradora, descricao, vigencia_inicio, vigencia_fim, premio_mensal, franquia, coberturas, status } = req.body;
  const cob = JSON.stringify(coberturas || []);
  db.prepare(
    "UPDATE apolices SET tipo=?,numero=?,seguradora=?,descricao=?,vigencia_inicio=?,vigencia_fim=?,premio_mensal=?,franquia=?,coberturas=?,status=? WHERE id=?"
  ).run(tipo, numero, seguradora, descricao, vigencia_inicio, vigencia_fim, premio_mensal, franquia, cob, status, req.params.id);
  res.json({ ok: true });
});

router.delete("/admin/apolices/:id", authAdmin, (req, res) => {
  db.prepare("DELETE FROM apolices WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

// ── Admin: Boletos ──────────────────────────────────────────
router.get("/admin/boletos", authAdmin, (req, res) => {
  const { cpf } = req.query;
  const rows = cpf
    ? db.prepare("SELECT b.*, a.tipo, a.numero, c.nome as cliente_nome FROM boletos b JOIN apolices a ON a.id=b.apolice_id JOIN clientes c ON c.cpf=b.cliente_cpf WHERE b.cliente_cpf=? ORDER BY b.vencimento DESC").all(cpf)
    : db.prepare("SELECT b.*, a.tipo, a.numero, c.nome as cliente_nome FROM boletos b JOIN apolices a ON a.id=b.apolice_id JOIN clientes c ON c.cpf=b.cliente_cpf ORDER BY b.vencimento DESC").all();
  res.json(rows);
});

router.post("/admin/boletos", authAdmin, (req, res) => {
  const { apolice_id, cliente_cpf, vencimento, valor, linha_digitavel, pix_copia_cola } = req.body;
  if (!apolice_id || !cliente_cpf || !vencimento || !valor) return res.status(400).json({ erro: "Campos obrigatórios faltando" });
  const cpfNum = cliente_cpf.replace(/\D/g, "");
  const r = db.prepare(
    "INSERT INTO boletos (apolice_id,cliente_cpf,vencimento,valor,linha_digitavel,pix_copia_cola) VALUES (?,?,?,?,?,?)"
  ).run(apolice_id, cpfNum, vencimento, valor, linha_digitavel, pix_copia_cola);
  res.status(201).json({ id: r.lastInsertRowid });
});

router.put("/admin/boletos/:id", authAdmin, (req, res) => {
  const { status, linha_digitavel, pix_copia_cola, vencimento, valor } = req.body;
  db.prepare("UPDATE boletos SET status=?, linha_digitavel=?, pix_copia_cola=?, vencimento=?, valor=? WHERE id=?")
    .run(status, linha_digitavel, pix_copia_cola, vencimento, valor, req.params.id);
  res.json({ ok: true });
});

router.delete("/admin/boletos/:id", authAdmin, (req, res) => {
  db.prepare("DELETE FROM boletos WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

// ── Admin: Stats ────────────────────────────────────────────
router.get("/admin/stats", authAdmin, (_req, res) => {
  const totalClientes = db.prepare("SELECT COUNT(*) as n FROM clientes WHERE ativo=1").get().n;
  const totalApolices = db.prepare("SELECT COUNT(*) as n FROM apolices WHERE status='Vigente'").get().n;
  const boletosAbertos = db.prepare("SELECT COUNT(*) as n FROM boletos WHERE status='Em aberto'").get().n;
  const totalSinistros = db.prepare("SELECT COUNT(*) as n FROM sinistros WHERE status='Em análise'").get().n;
  const recentes = db.prepare(
    "SELECT c.nome, a.tipo, a.numero, a.criado_em FROM apolices a JOIN clientes c ON c.cpf=a.cliente_cpf ORDER BY a.criado_em DESC LIMIT 5"
  ).all();
  res.json({ totalClientes, totalApolices, boletosAbertos, totalSinistros, recentes });
});

module.exports = router;
