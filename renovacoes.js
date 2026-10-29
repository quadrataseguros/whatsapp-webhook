// Organizador de renovações — confronta o relatório de cada seguradora com a
// lista de renovações do SICS Web.
//
// Fluxo: o corretor importa (1) a lista do SICS e (2) o relatório de cada
// seguradora em /renovacoes.html. O navegador lê a planilha e manda linhas já
// mapeadas; aqui o servidor normaliza, grava e, a cada consulta, CRUZA as duas
// listas e diz o que está conferido, divergente ou só de um lado.
//
// O acompanhamento (contatado, cotando, renovada, perdida…) fica numa tabela à
// parte, ligada pela chave da apólice — reimportar uma lista nunca apaga o que
// o time já anotou.
const express = require("express");
const db = require("./db");

// As 12 seguradoras da carteira. A chave é o nome exibido; os apelidos servem
// para reconhecer como cada sistema escreve ("Porto Seguro", "Yelum"…).
const SEGURADORAS = {
  PORTO: ["porto"],
  AZUL: ["azul"],
  ITAU: ["itau"],
  MITSUI: ["mitsui", "sumitomo"],
  "TOKIO MARINE": ["tokio"],
  YELLUM: ["yellum", "yelum", "yelun"],
  ALLIRO: ["alliro", "aliro"],
  HDI: ["hdi"],
  BRADESCO: ["bradesco"],
  SUHAI: ["suhai"],
  ALLIANZ: ["allianz"],
  ZURICH: ["zurich"],
};

// Azul e Itaú são marcas do grupo Porto e saem no mesmo relatório (SUSEP 054J0J):
// o cruzamento olha o GRUPO, mas a tela segue mostrando a marca que o SICS tem.
const GRUPO = { PORTO: "PORTO", AZUL: "PORTO", ITAU: "PORTO" };
const grupoDe = (seg) => GRUPO[seg] || seg;

const STATUS = ["pendente", "em_contato", "cotando", "renovada", "perdida", "cancelada"];
const FONTES = ["sics", "seguradora"];
const TOLERANCIA_VIGENCIA_DIAS = 3;
const JANELA_FALLBACK_DIAS = 31;
const RETENCAO_PADRAO = 85;

db.exec(`
  CREATE TABLE IF NOT EXISTS ren_registros (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    fonte        TEXT NOT NULL CHECK(fonte IN ('sics','seguradora')),
    seguradora   TEXT NOT NULL,
    apolice      TEXT,
    apolice_norm TEXT,
    segurado     TEXT,
    documento    TEXT,
    ramo         TEXT,
    item         TEXT,
    vigencia_fim TEXT,
    premio       REAL,
    vendedor     TEXT,
    situacao_seg TEXT,
    importado_em TEXT DEFAULT (datetime('now', 'localtime'))
  );
  CREATE INDEX IF NOT EXISTS idx_ren_reg ON ren_registros(fonte, seguradora);

  CREATE TABLE IF NOT EXISTS ren_acompanhamento (
    chave          TEXT PRIMARY KEY,
    status         TEXT NOT NULL DEFAULT 'pendente',
    responsavel_id INTEGER REFERENCES salespeople(id),
    obs            TEXT,
    updated_at     TEXT DEFAULT (datetime('now', 'localtime'))
  );
`);
// confirmado = alguém olhou o caso incerto e deu o aval (some do destaque).
try { db.exec("ALTER TABLE ren_acompanhamento ADD COLUMN confirmado INTEGER DEFAULT 0"); } catch (_) {}

// ─── Normalização ───────────────────────────────────────────────────────────
const semAcento = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function seguradoraCanonica(texto) {
  const t = semAcento(texto);
  if (!t.trim()) return null;
  for (const [nome, apelidos] of Object.entries(SEGURADORAS))
    if (apelidos.some((a) => t.includes(a))) return nome;
  return null;
}

// Só dígitos e letras, sem zeros à esquerda: "0531.2024-001" e "53120240001"
// são a mesma apólice para quem compara.
const normApolice = (s) => String(s || "").toUpperCase().replace(/[^0-9A-Z]/g, "").replace(/^0+/, "");
const normDoc = (s) => String(s || "").replace(/\D/g, "");
// "0" é como alguns relatórios dizem "sem item".
const normItem = (s) => { const v = String(s || "").toUpperCase().replace(/[^0-9A-Z]/g, ""); return v === "0" ? "" : v; };

function parseData(v) {
  if (v == null || v === "") return null;
  if (typeof v === "number" && v > 20000 && v < 80000) {
    // Serial do Excel (dias desde 1899-12-30)
    return new Date(Math.round((v - 25569) * 86400000)).toISOString().slice(0, 10);
  }
  const s = String(v).trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})/);
  if (m) {
    const ano = m[3].length === 2 ? "20" + m[3] : m[3];
    return `${ano}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  }
  return null;
}

function parseDinheiro(v) {
  if (typeof v === "number") return v;
  let s = String(v ?? "").replace(/[^\d.,-]/g, "");
  if (!s) return null;
  const ponto = s.lastIndexOf("."), virgula = s.lastIndexOf(",");
  if (ponto >= 0 && virgula >= 0) {
    s = ponto > virgula ? s.replace(/,/g, "") : s.replace(/\./g, "").replace(",", ".");
  } else if (virgula >= 0) {
    s = s.replace(",", ".");
  } else if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) {
    s = s.replace(/\./g, "");
  }
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

const diasEntre = (a, b) => Math.abs(Date.parse(a) - Date.parse(b)) / 86400000;

// ─── Cruzamento ─────────────────────────────────────────────────────────────
// 1ª passada: mesma seguradora + mesmo número de apólice.
// 2ª passada (só o que sobrou): mesmo documento do segurado, ramo compatível,
//   mesmo item (placa) quando houver, e vencimento a no máximo 31 dias — pega o
//   caso de a seguradora listar o número da apólice nova e o SICS o da velha.
function cruzar() {
  // Relatórios repetem a mesma apólice em mais de uma linha (endosso, vários itens):
  // vale a primeira de cada grupo+apólice, senão a repetição vira falsa divergência.
  const vistos = new Set();
  const regs = db.prepare("SELECT * FROM ren_registros ORDER BY id").all().filter((r) => {
    if (!r.apolice_norm) return true;
    const k = r.fonte + "|" + grupoDe(r.seguradora) + "|" + r.apolice_norm;
    return !vistos.has(k) && vistos.add(k);
  });
  const sics = regs.filter((r) => r.fonte === "sics");
  const segs = regs.filter((r) => r.fonte === "seguradora");
  const usados = new Set();
  const pares = [];

  const porApolice = new Map();
  for (const s of segs) {
    if (!s.apolice_norm) continue;
    const k = grupoDe(s.seguradora) + "|" + s.apolice_norm;
    if (!porApolice.has(k)) porApolice.set(k, []);
    porApolice.get(k).push(s);
  }
  const restoSics = [];
  for (const a of sics) {
    const cand = a.apolice_norm && (porApolice.get(grupoDe(a.seguradora) + "|" + a.apolice_norm) || []).find((s) => !usados.has(s.id));
    if (cand) { usados.add(cand.id); pares.push({ sics: a, seg: cand, via: "apolice" }); }
    else restoSics.push(a);
  }

  const livres = segs.filter((s) => !usados.has(s.id));
  for (const a of restoSics) {
    let cand = null;
    if (a.documento) {
      cand = livres.find((s) =>
        !usados.has(s.id) && grupoDe(s.seguradora) === grupoDe(a.seguradora) && s.documento === a.documento &&
        (!a.item || !s.item || a.item === s.item) &&
        (!a.ramo || !s.ramo || semAcento(a.ramo).slice(0, 4) === semAcento(s.ramo).slice(0, 4)) &&
        (!a.vigencia_fim || !s.vigencia_fim || diasEntre(a.vigencia_fim, s.vigencia_fim) <= JANELA_FALLBACK_DIAS));
    }
    if (cand) { usados.add(cand.id); pares.push({ sics: a, seg: cand, via: "documento" }); }
    else pares.push({ sics: a, seg: null });
  }
  for (const s of livres) if (!usados.has(s.id)) pares.push({ sics: null, seg: s });

  const acomp = new Map(db.prepare("SELECT * FROM ren_acompanhamento").all().map((a) => [a.chave, a]));
  // Quem não tem relatório da seguradora importado não pode ser "conferido" nem "ausente".
  const comRelatorio = new Set(segs.map((x) => grupoDe(x.seguradora)));
  return pares.map((p) => montarLinha(p, acomp, comRelatorio));
}

function montarLinha({ sics, seg, via }, acomp, comRelatorio) {
  const base = sics || seg;
  let situacao;
  if (sics && seg) {
    const dif = sics.vigencia_fim && seg.vigencia_fim ? diasEntre(sics.vigencia_fim, seg.vigencia_fim) : 0;
    situacao = dif > TOLERANCIA_VIGENCIA_DIAS ? "divergente" : "conferido";
  } else if (sics) situacao = comRelatorio.has(grupoDe(sics.seguradora)) ? "so_sics" : "sem_relatorio";
  else situacao = "so_seguradora";

  const chave = grupoDe(base.seguradora) + "|" + (base.apolice_norm || "id" + base.id);
  const ac = acomp.get(chave);
  const confirmado = !!ac?.confirmado;
  const MOTIVOS = {
    divergente: "O fim de vigência é diferente no SICS e na seguradora — confirmar a data certa.",
    so_sics: "Não consta no relatório da seguradora — confirmar se já foi renovada, cancelada ou se o relatório veio incompleto.",
    so_seguradora: "Não consta na lista do SICS — confirmar se falta cadastro no sistema.",
    sem_relatorio: "Ainda sem relatório desta seguradora — vencimento vem só do SICS, não foi conferido.",
  };
  const premio = sics?.premio ?? seg?.premio ?? null;
  const premioSeg = seg?.premio ?? null;
  return {
    chave,
    seguradora: base.seguradora,
    segurado: sics?.segurado || seg?.segurado || "",
    documento: sics?.documento || seg?.documento || "",
    ramo: sics?.ramo || seg?.ramo || "",
    item: sics?.item || seg?.item || "",
    apolice_sics: sics?.apolice || null,
    apolice_seg: seg?.apolice || null,
    vigencia_sics: sics?.vigencia_fim || null,
    vigencia_seg: seg?.vigencia_fim || null,
    vigencia: sics?.vigencia_fim || seg?.vigencia_fim || null,
    premio,
    premio_sics: sics?.premio ?? null,
    premio_seg: premioSeg,
    variacao_premio_pct: sics?.premio && premioSeg ? +(((premioSeg - sics.premio) / sics.premio) * 100).toFixed(1) : null,
    vendedor_sics: sics?.vendedor || null,
    situacao_seg: seg?.situacao_seg || null,
    situacao,
    confirmar: situacao !== "conferido" && !confirmado,
    confirmado,
    motivo: situacao === "conferido" ? "" : MOTIVOS[situacao],
    via_cruzamento: via || null,
    status: ac?.status || "pendente",
    responsavel_id: ac?.responsavel_id ?? null,
    obs: ac?.obs || "",
  };
}

// ─── Previsão (alimenta o dashboard) ───────────────────────────────────────
// Premissa: o prêmio das listas é o BRUTO (com IOF), o mesmo que o vendedor
// digita numa venda; a comissão sai da mesma regra de calcularVenda().
function createRouter({ requireAdmin, calcularVenda, iofDoRamo }) {
  const router = express.Router();

  const retencao = () => {
    const r = db.prepare("SELECT value FROM settings WHERE key='ren_retencao'").get();
    const n = r ? parseFloat(r.value) : RETENCAO_PADRAO;
    return Number.isFinite(n) ? n : RETENCAO_PADRAO;
  };

  function comissaoDe(l) {
    if (!l.premio || l.premio <= 0) return 0;
    return calcularVenda(l.premio, l.ramo, l.seguradora).commission_value;
  }

  router.get("/api/renovacoes/config", (_req, res) =>
    res.json({ seguradoras: Object.keys(SEGURADORAS), status: STATUS, retencao: retencao() }));

  // Pública de propósito: só traz totais, sem nome nem documento de cliente.
  router.get("/api/renovacoes/previsao", (req, res) => {
    const meses = Math.min(12, Math.max(1, parseInt(req.query.meses, 10) || 3));
    const ret = req.query.retencao != null ? parseFloat(req.query.retencao) : retencao();
    const hoje = new Date();
    const mk = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const buckets = new Map();
    for (let i = 0; i < meses; i++) buckets.set(mk(new Date(hoje.getFullYear(), hoje.getMonth() + i, 1)), null);
    for (const k of buckets.keys())
      buckets.set(k, { mes: k, apolices: 0, premio: 0, comissao: 0, renovadas: 0, premio_renovado: 0, comissao_renovada: 0, perdidas: 0, em_aberto: 0, divergencias: 0 });

    for (const l of cruzar()) {
      const b = l.vigencia && buckets.get(l.vigencia.slice(0, 7));
      if (!b || l.status === "cancelada") continue;
      const com = comissaoDe(l);
      b.apolices++; b.premio += l.premio || 0; b.comissao += com;
      if (l.status === "renovada") { b.renovadas++; b.premio_renovado += l.premio || 0; b.comissao_renovada += com; }
      else if (l.status === "perdida") b.perdidas++;
      else b.em_aberto++;
      if (l.situacao === "divergente" || l.situacao === "so_seguradora") b.divergencias++;
    }
    const lista = [...buckets.values()].map((b) => {
      // Previsto = o que já renovou + retenção histórica sobre o que ainda está em aberto.
      const abertoPremio = b.premio - b.premio_renovado;
      const abertoCom = b.comissao - b.comissao_renovada;
      const perdidoFrac = b.apolices ? b.perdidas / b.apolices : 0;
      const fator = Math.max(0, 1 - perdidoFrac);
      return {
        ...b,
        premio: +b.premio.toFixed(2), comissao: +b.comissao.toFixed(2),
        premio_renovado: +b.premio_renovado.toFixed(2), comissao_renovada: +b.comissao_renovada.toFixed(2),
        premio_previsto: +(b.premio_renovado + abertoPremio * fator * (ret / 100)).toFixed(2),
        comissao_prevista: +(b.comissao_renovada + abertoCom * fator * (ret / 100)).toFixed(2),
      };
    });
    res.json({ retencao: ret, meses: lista });
  });

  router.get("/api/renovacoes", requireAdmin, (req, res) => {
    const { mes, seguradora, situacao, status, confirmar } = req.query;
    let linhas = cruzar();
    if (mes) linhas = linhas.filter((l) => (l.vigencia || "").startsWith(mes));
    if (seguradora) linhas = linhas.filter((l) => l.seguradora === seguradora);
    if (situacao) linhas = linhas.filter((l) => l.situacao === situacao);
    if (status) linhas = linhas.filter((l) => l.status === status);
    if (confirmar) linhas = linhas.filter((l) => l.confirmar);
    linhas.sort((a, b) => (a.vigencia || "9999").localeCompare(b.vigencia || "9999"));
    const resumo = { total: linhas.length, conferido: 0, divergente: 0, so_sics: 0, so_seguradora: 0, sem_relatorio: 0, a_confirmar: 0 };
    linhas.forEach((l) => { resumo[l.situacao]++; if (l.confirmar) resumo.a_confirmar++; });
    res.json({ resumo, linhas });
  });

  // Resumo do que foi importado: quantas linhas por fonte e seguradora.
  router.get("/api/renovacoes/importacoes", requireAdmin, (_req, res) => {
    res.json(db.prepare(`SELECT fonte, seguradora, COUNT(*) n, MAX(importado_em) em
      FROM ren_registros GROUP BY fonte, seguradora ORDER BY seguradora, fonte`).all());
  });

  // body: { fonte: 'sics'|'seguradora', seguradora?: 'PORTO', linhas: [{apolice, segurado,
  //   documento, ramo, item, vigencia_fim, premio, vendedor, situacao, seguradora}] }
  // Para o relatório de UMA seguradora, `seguradora` vem no corpo. A lista do SICS
  // traz todas juntas, então cada linha diz a sua (coluna "seguradora").
  // A importação SUBSTITUI o que já havia daquela fonte+seguradora.
  router.post("/api/renovacoes/importar", requireAdmin, (req, res) => {
    const { fonte, seguradora, linhas } = req.body || {};
    if (!FONTES.includes(fonte)) return res.status(400).json({ error: "fonte deve ser 'sics' ou 'seguradora'" });
    if (!Array.isArray(linhas) || !linhas.length) return res.status(400).json({ error: "Nenhuma linha para importar" });
    const fixa = seguradora ? seguradoraCanonica(seguradora) : null;
    if (seguradora && !fixa) return res.status(400).json({ error: "Seguradora desconhecida: " + seguradora });
    if (fonte === "seguradora" && !fixa) return res.status(400).json({ error: "Informe a seguradora do relatório" });

    // Alguns relatórios (Allianz) trazem o prêmio LÍQUIDO; o SICS guarda o bruto.
    const premioBrutoDoLiquido = (liq, ramo) => (liq == null ? null : +(liq * (1 + iofDoRamo(ramo) / 100)).toFixed(2));
    const aceitas = [], ignoradas = [];
    linhas.forEach((l, i) => {
      const seg = fixa || seguradoraCanonica(l.seguradora);
      const apolice = String(l.apolice ?? "").trim();
      const documento = normDoc(l.documento);
      const vigencia = parseData(l.vigencia_fim);
      if (!seg) return ignoradas.push({ linha: i + 1, motivo: "seguradora não reconhecida: " + (l.seguradora || "(vazia)") });
      if (!apolice && !documento) return ignoradas.push({ linha: i + 1, motivo: "sem apólice nem documento" });
      if (!vigencia) return ignoradas.push({ linha: i + 1, motivo: "fim de vigência inválido: " + (l.vigencia_fim || "(vazio)") });
      aceitas.push({
        seguradora: seg, apolice, apolice_norm: normApolice(apolice), segurado: String(l.segurado || "").trim(),
        documento, ramo: String(l.ramo || "").trim(), item: normItem(l.item), vigencia_fim: vigencia,
        premio: parseDinheiro(l.premio) ?? premioBrutoDoLiquido(parseDinheiro(l.premio_liquido), l.ramo),
        vendedor: String(l.vendedor || "").trim() || null,
        situacao_seg: String(l.situacao || "").trim() || null,
      });
    });
    if (!aceitas.length) return res.status(400).json({ error: "Nenhuma linha válida", ignoradas: ignoradas.slice(0, 20) });

    const apaga = db.prepare("DELETE FROM ren_registros WHERE fonte = ? AND seguradora = ?");
    const insere = db.prepare(`INSERT INTO ren_registros
      (fonte, seguradora, apolice, apolice_norm, segurado, documento, ramo, item, vigencia_fim, premio, vendedor, situacao_seg)
      VALUES (@fonte, @seguradora, @apolice, @apolice_norm, @segurado, @documento, @ramo, @item, @vigencia_fim, @premio, @vendedor, @situacao_seg)`);
    const porSeg = {};
    db.transaction(() => {
      for (const s of new Set(aceitas.map((a) => a.seguradora))) apaga.run(fonte, s);
      for (const a of aceitas) { insere.run({ fonte, ...a }); porSeg[a.seguradora] = (porSeg[a.seguradora] || 0) + 1; }
    })();
    res.json({ importadas: aceitas.length, por_seguradora: porSeg, ignoradas: ignoradas.length, detalhe_ignoradas: ignoradas.slice(0, 20) });
  });

  router.delete("/api/renovacoes/importacoes", requireAdmin, (req, res) => {
    const { fonte, seguradora } = req.query;
    if (!FONTES.includes(fonte)) return res.status(400).json({ error: "fonte inválida" });
    const seg = seguradoraCanonica(seguradora);
    if (!seg) return res.status(400).json({ error: "seguradora inválida" });
    const r = db.prepare("DELETE FROM ren_registros WHERE fonte = ? AND seguradora = ?").run(fonte, seg);
    res.json({ removidas: r.changes });
  });

  router.post("/api/renovacoes/acompanhamento", requireAdmin, (req, res) => {
    const { chave, status, responsavel_id, obs, confirmado } = req.body || {};
    if (!chave) return res.status(400).json({ error: "chave obrigatória" });
    if (status && !STATUS.includes(status)) return res.status(400).json({ error: "status inválido" });
    const atual = db.prepare("SELECT * FROM ren_acompanhamento WHERE chave = ?").get(chave) || {};
    db.prepare(`INSERT INTO ren_acompanhamento (chave, status, responsavel_id, obs, confirmado, updated_at)
      VALUES (?, ?, ?, ?, ?, datetime('now','localtime'))
      ON CONFLICT(chave) DO UPDATE SET status=excluded.status, responsavel_id=excluded.responsavel_id,
        obs=excluded.obs, confirmado=excluded.confirmado, updated_at=excluded.updated_at`)
      .run(chave, status || atual.status || "pendente",
        responsavel_id !== undefined ? responsavel_id || null : atual.responsavel_id ?? null,
        obs !== undefined ? String(obs) : atual.obs ?? null,
        confirmado !== undefined ? (confirmado ? 1 : 0) : atual.confirmado ?? 0);
    res.json({ ok: true });
  });

  router.post("/api/renovacoes/retencao", requireAdmin, (req, res) => {
    const n = parseFloat(req.body?.retencao);
    if (!(n >= 0 && n <= 100)) return res.status(400).json({ error: "retenção deve ficar entre 0 e 100" });
    db.prepare("INSERT INTO settings (key, value) VALUES ('ren_retencao', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(String(n));
    res.json({ retencao: n });
  });

  return router;
}

module.exports = { createRouter, seguradoraCanonica, parseData, parseDinheiro, cruzar, SEGURADORAS };
