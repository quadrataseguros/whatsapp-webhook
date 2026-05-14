const express = require("express");
const axios = require("axios");
const path = require("path");
const db = require("./db");
const ADMIN_HTML = require("./admin-page");

const app = express();
app.use(express.json());

// Versão do servidor (para confirmar que o código novo está rodando)
const SERVER_VERSION = "v5-full-features-2026-05-14";
app.get("/api/version", (_req, res) => res.json({ version: SERVER_VERSION }));

// Admin panel servido direto da memória (sem cache, sempre atualizado)
app.get(["/admin", "/admin.html", "/gestor", "/gestor.html"], (_req, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.type("html").send(ADMIN_HTML);
});

app.use(express.static(path.join(__dirname, "public")));

const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "quadrata123";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const LANGFLOW_URL = process.env.LANGFLOW_URL || "http://localhost:7860";
const LANGFLOW_FLOW_ID = process.env.LANGFLOW_FLOW_ID || "";
const LANGFLOW_API_KEY = process.env.LANGFLOW_API_KEY || "";
const WA_PHONE_NUMBER_ID = process.env.WA_PHONE_NUMBER_ID || "";
const WA_ACCESS_TOKEN = process.env.WA_ACCESS_TOKEN || "";
const MAKE_WEBHOOK_URL = process.env.MAKE_WEBHOOK_URL || "";

const PORT = process.env.PORT || 3000;

// Meta webhook verification
app.get("/webhook", (req, res) => {
  if (req.query["hub.verify_token"] === VERIFY_TOKEN) {
    res.send(req.query["hub.challenge"]);
  } else {
    res.sendStatus(403);
  }
});

// Health check — useful when monitoring from tablet
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    langflow: LANGFLOW_URL,
    mode: LANGFLOW_FLOW_ID ? "langflow" : "make",
  });
});

// Extract first text message from a WhatsApp webhook payload
function extractMessage(body) {
  try {
    const entry = body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const message = value?.messages?.[0];
    if (!message) return null;

    return {
      from: message.from,
      messageId: message.id,
      type: message.type,
      text: message.text?.body || "",
      name: value.contacts?.[0]?.profile?.name || message.from,
    };
  } catch {
    return null;
  }
}

// Send a text reply via WhatsApp Cloud API
async function sendWhatsAppReply(to, text) {
  if (!WA_PHONE_NUMBER_ID || !WA_ACCESS_TOKEN) return;
  await axios.post(
    `https://graph.facebook.com/v19.0/${WA_PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text },
    },
    {
      headers: {
        Authorization: `Bearer ${WA_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  );
}

// Run a Langflow flow and return the text output
async function runLangflow(inputText, sessionId) {
  const headers = { "Content-Type": "application/json" };
  if (LANGFLOW_API_KEY) headers["x-api-key"] = LANGFLOW_API_KEY;

  const response = await axios.post(
    `${LANGFLOW_URL}/api/v1/run/${LANGFLOW_FLOW_ID}`,
    {
      input_value: inputText,
      input_type: "chat",
      output_type: "chat",
      session_id: sessionId,
    },
    { headers }
  );

  // Navigate Langflow's nested response structure
  const outputs = response.data?.outputs;
  const result =
    outputs?.[0]?.outputs?.[0]?.results?.message?.text ||
    outputs?.[0]?.outputs?.[0]?.results?.message?.data?.text ||
    outputs?.[0]?.outputs?.[0]?.messages?.[0]?.message ||
    "";
  return result;
}

// Main webhook handler
app.post("/webhook", async (req, res) => {
  res.sendStatus(200); // Acknowledge immediately per Meta requirements

  const msg = extractMessage(req.body);

  // Ignore non-text messages or status updates
  if (!msg || msg.type !== "text" || !msg.text) {
    console.log("Evento ignorado (não é mensagem de texto)");
    return;
  }

  console.log(`Mensagem de ${msg.name} (${msg.from}): ${msg.text}`);

  try {
    if (LANGFLOW_FLOW_ID) {
      // Langflow mode: process and auto-reply
      const reply = await runLangflow(msg.text, msg.from);
      if (reply) {
        console.log(`Resposta Langflow: ${reply}`);
        await sendWhatsAppReply(msg.from, reply);
      }
    } else if (MAKE_WEBHOOK_URL) {
      // Fallback: forward raw payload to Make
      await axios.post(MAKE_WEBHOOK_URL, req.body);
      console.log("Payload encaminhado para Make");
    } else {
      console.log("Nenhum destino configurado (LANGFLOW_FLOW_ID ou MAKE_WEBHOOK_URL)");
    }
  } catch (err) {
    console.error("Erro ao processar mensagem:", err.message);
  }
});

// ─── Dashboard API ────────────────────────────────────────────────────────────

function getAdminPassword() {
  try {
    const row = db.prepare("SELECT value FROM settings WHERE key='admin_password'").get();
    return row ? row.value : ADMIN_PASSWORD;
  } catch { return ADMIN_PASSWORD; }
}

function requireAdmin(req, res, next) {
  if (req.headers["x-admin-password"] !== getAdminPassword())
    return res.status(401).json({ error: "Não autorizado" });
  next();
}

function getPeriodRange(period) {
  const now = new Date();
  if (period === "monthly") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0],
      label: start.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
    };
  }
  // Weekly: Monday → Sunday
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - day + (day === 0 ? -6 : 1));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    start: monday.toISOString().split("T")[0],
    end: sunday.toISOString().split("T")[0],
    label: `${monday.toLocaleDateString("pt-BR")} – ${sunday.toLocaleDateString("pt-BR")}`,
  };
}

function getPrevPeriodRange(period) {
  const now = new Date();
  if (period === "monthly") {
    const m = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    const y = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    const start = new Date(y, m, 1);
    const end   = new Date(y, m + 1, 0);
    return { start: start.toISOString().split("T")[0], end: end.toISOString().split("T")[0] };
  }
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - day + (day === 0 ? -6 : 1) - 7);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { start: monday.toISOString().split("T")[0], end: sunday.toISOString().split("T")[0] };
}

app.post("/api/admin/verify", (req, res) => {
  req.body.password === getAdminPassword()
    ? res.json({ ok: true })
    : res.status(401).json({ error: "Senha incorreta" });
});

app.get("/api/salespeople", (_req, res) => {
  res.json(db.prepare("SELECT * FROM salespeople WHERE active=1 ORDER BY name").all());
});

app.post("/api/salespeople", requireAdmin, (req, res) => {
  const name = req.body.name?.trim();
  if (!name) return res.status(400).json({ error: "Nome obrigatório" });
  try {
    const r = db.prepare("INSERT INTO salespeople (name) VALUES (?)").run(name);
    res.json({ id: r.lastInsertRowid, name, active: 1 });
  } catch (e) {
    if (e.message.includes("UNIQUE")) return res.status(409).json({ error: "Vendedor já existe" });
    throw e;
  }
});

app.delete("/api/salespeople/:id", requireAdmin, (req, res) => {
  db.prepare("UPDATE salespeople SET active=0 WHERE id=?").run(req.params.id);
  res.json({ ok: true });
});

app.get("/api/stats", (req, res) => {
  const period = req.query.period === "monthly" ? "monthly" : "weekly";
  const range = getPeriodRange(period);

  const rows = db.prepare(`
    SELECT sp.id, sp.name,
           COALESCE(SUM(s.value), 0)                              AS total_sold,
           COALESCE(SUM(s.value * COALESCE(s.commission_pct,0) / 100), 0) AS total_commission,
           COUNT(s.id)                                            AS sales_count,
           COALESCE(g.goal_value, 0)                             AS goal
    FROM salespeople sp
    LEFT JOIN sales s  ON s.salesperson_id = sp.id
                      AND s.sale_date >= ? AND s.sale_date <= ?
    LEFT JOIN goals g  ON g.salesperson_id = sp.id AND g.period_type = ?
    WHERE sp.active = 1
    GROUP BY sp.id, sp.name, g.goal_value
    ORDER BY sp.name
  `).all(range.start, range.end, period);

  const breakdown = db.prepare(`
    SELECT s.salesperson_id, s.ramo, SUM(s.value) AS value
    FROM sales s JOIN salespeople sp ON sp.id = s.salesperson_id
    WHERE s.sale_date >= ? AND s.sale_date <= ? AND sp.active = 1
    GROUP BY s.salesperson_id, s.ramo ORDER BY value DESC
  `).all(range.start, range.end);

  const bmap = {};
  breakdown.forEach((r) => {
    (bmap[r.salesperson_id] = bmap[r.salesperson_id] || []).push({ ramo: r.ramo, value: r.value });
  });

  const prevRange = getPrevPeriodRange(period);
  const prevRows = db.prepare(`
    SELECT sp.id, COALESCE(SUM(s.value), 0) AS prev_sold
    FROM salespeople sp
    LEFT JOIN sales s ON s.salesperson_id = sp.id
                     AND s.sale_date >= ? AND s.sale_date <= ?
    WHERE sp.active = 1
    GROUP BY sp.id
  `).all(prevRange.start, prevRange.end);
  const prevMap = {};
  prevRows.forEach((r) => (prevMap[r.id] = r.prev_sold));

  const salespeople = rows.map((r) => ({
    ...r,
    percentage: r.goal > 0 ? Math.round((r.total_sold / r.goal) * 100) : 0,
    breakdown: bmap[r.id] || [],
    prev_sold: prevMap[r.id] || 0,
  }));

  const totalSold       = salespeople.reduce((s, p) => s + p.total_sold, 0);
  const totalGoal       = salespeople.reduce((s, p) => s + p.goal, 0);
  const totalCommission = salespeople.reduce((s, p) => s + p.total_commission, 0);

  res.json({
    period,
    startDate: range.start,
    endDate: range.end,
    label: range.label,
    salespeople,
    totals: {
      totalSold,
      totalGoal,
      totalCommission,
      percentage: totalGoal > 0 ? Math.round((totalSold / totalGoal) * 100) : 0,
      salesCount: salespeople.reduce((s, p) => s + p.sales_count, 0),
    },
  });
});

app.get("/api/sales", (req, res) => {
  const period = req.query.period === "monthly" ? "monthly" : "weekly";
  const range = getPeriodRange(period);
  const params = [range.start, range.end];
  let q = `
    SELECT s.*, sp.name AS salesperson_name
    FROM sales s JOIN salespeople sp ON sp.id = s.salesperson_id
    WHERE s.sale_date >= ? AND s.sale_date <= ?
  `;
  if (req.query.salesperson_id) { q += " AND s.salesperson_id = ?"; params.push(req.query.salesperson_id); }
  q += " ORDER BY s.sale_date DESC, s.created_at DESC LIMIT 200";
  res.json({ sales: db.prepare(q).all(...params), startDate: range.start, endDate: range.end });
});

app.get("/api/sales/all", requireAdmin, (req, res) => {
  const params = [];
  let q = `
    SELECT s.*, sp.name AS salesperson_name
    FROM sales s JOIN salespeople sp ON sp.id = s.salesperson_id WHERE 1=1
  `;
  if (req.query.from) { q += " AND s.sale_date >= ?"; params.push(req.query.from); }
  if (req.query.to)   { q += " AND s.sale_date <= ?"; params.push(req.query.to); }
  if (req.query.salesperson_id) { q += " AND s.salesperson_id = ?"; params.push(req.query.salesperson_id); }
  q += " ORDER BY s.sale_date DESC, s.created_at DESC LIMIT 500";
  res.json(db.prepare(q).all(...params));
});

app.post("/api/sales", (req, res) => {
  const { salesperson_id, value, ramo, seguradora, sale_date, notes, commission_pct } = req.body;
  if (!salesperson_id || !value || !ramo || !seguradora || !sale_date)
    return res.status(400).json({ error: "Campos obrigatórios faltando" });
  const r = db.prepare(
    "INSERT INTO sales (salesperson_id,value,ramo,seguradora,sale_date,notes,commission_pct) VALUES (?,?,?,?,?,?,?)"
  ).run(salesperson_id, value, ramo, seguradora, sale_date, notes || null, commission_pct ?? 0);
  res.json({ id: r.lastInsertRowid, ok: true });
});

app.delete("/api/sales/:id", requireAdmin, (req, res) => {
  db.prepare("DELETE FROM sales WHERE id=?").run(req.params.id);
  res.json({ ok: true });
});

app.get("/api/goals", (_req, res) => {
  res.json(
    db.prepare(`
      SELECT g.*, sp.name AS salesperson_name
      FROM goals g JOIN salespeople sp ON sp.id = g.salesperson_id
      WHERE sp.active = 1
    `).all()
  );
});

app.post("/api/goals", requireAdmin, (req, res) => {
  const { salesperson_id, period_type, goal_value } = req.body;
  if (!salesperson_id || !period_type || goal_value === undefined)
    return res.status(400).json({ error: "Campos obrigatórios faltando" });
  db.prepare(`
    INSERT INTO goals (salesperson_id, period_type, goal_value) VALUES (?,?,?)
    ON CONFLICT(salesperson_id, period_type)
    DO UPDATE SET goal_value=excluded.goal_value, updated_at=datetime('now','localtime')
  `).run(salesperson_id, period_type, goal_value);
  res.json({ ok: true });
});

// ─── RO (Resultado Operacional) ───────────────────────────────────────────────

app.get("/api/ro-goals", (_req, res) => {
  res.json(
    db.prepare(`
      SELECT rg.*, sp.name AS salesperson_name
      FROM ro_goals rg JOIN salespeople sp ON sp.id = rg.salesperson_id
      WHERE sp.active = 1
    `).all()
  );
});

app.post("/api/ro-goals", requireAdmin, (req, res) => {
  const { salesperson_id, period_type, min_sales, min_commission, bonus_value } = req.body;
  if (!salesperson_id || !period_type)
    return res.status(400).json({ error: "Campos obrigatórios faltando" });
  db.prepare(`
    INSERT INTO ro_goals (salesperson_id, period_type, min_sales, min_commission, bonus_value)
    VALUES (?,?,?,?,?)
    ON CONFLICT(salesperson_id, period_type)
    DO UPDATE SET min_sales=excluded.min_sales, min_commission=excluded.min_commission,
                  bonus_value=excluded.bonus_value, updated_at=datetime('now','localtime')
  `).run(
    salesperson_id, period_type,
    min_sales ?? 0,
    min_commission ?? 16.0,
    bonus_value ?? 0
  );
  res.json({ ok: true });
});

app.get("/api/ro-stats", (req, res) => {
  const period = req.query.period === "monthly" ? "monthly" : "weekly";
  const range = getPeriodRange(period);

  const rows = db.prepare(`
    SELECT sp.id, sp.name,
           COUNT(s.id)                                                         AS sales_count,
           COALESCE(SUM(s.value), 0)                                           AS total_value,
           COALESCE(SUM(s.value * COALESCE(s.commission_pct,0) / 100), 0)     AS total_commission,
           COALESCE(rg.min_sales,      0)    AS min_sales,
           COALESCE(rg.min_commission, 16.0) AS min_commission,
           COALESCE(rg.bonus_value,    0)    AS bonus_value
    FROM salespeople sp
    LEFT JOIN sales s
           ON s.salesperson_id = sp.id
          AND s.sale_date >= ? AND s.sale_date <= ?
    LEFT JOIN ro_goals rg
           ON rg.salesperson_id = sp.id AND rg.period_type = ?
    WHERE sp.active = 1
    GROUP BY sp.id, sp.name, rg.min_sales, rg.min_commission, rg.bonus_value
    ORDER BY sp.name
  `).all(range.start, range.end, period);

  const salespeople = rows.map((r) => {
    // Weighted average: total commission earned / total value × 100
    const weighted_commission = r.total_value > 0
      ? parseFloat(((r.total_commission / r.total_value) * 100).toFixed(2))
      : 0;
    const ok_sales      = r.min_sales === 0 || r.sales_count >= r.min_sales;
    const ok_commission = r.min_commission === 0 || weighted_commission >= r.min_commission;
    const achieved      = ok_sales && ok_commission;
    const configured    = r.min_sales > 0 || r.min_commission > 0 || r.bonus_value > 0;
    return { ...r, weighted_commission, ok_sales, ok_commission, achieved, configured };
  });

  res.json({
    period,
    startDate: range.start,
    endDate: range.end,
    label: range.label,
    salespeople,
    achieved_count: salespeople.filter((p) => p.achieved).length,
    total_bonus:    salespeople.filter((p) => p.achieved).reduce((s, p) => s + p.bonus_value, 0),
  });
});

// ─── Metas por Seguradora (Grupo) ─────────────────────────────────────────────

const SEGURADORAS = [
  { name: "PORTO",        patterns: ["porto"] },
  { name: "ALLIANZ",      patterns: ["allianz"] },
  { name: "TOKIO MARINE", patterns: ["tokio"] },
  { name: "BRADESCO",     patterns: ["bradesco"] },
  { name: "YELLUM",       patterns: ["yellum"] },
  { name: "HDI",          patterns: ["hdi"] },
  { name: "SUHAI",        patterns: ["suhai"] },
  { name: "ZURICH",       patterns: ["zurich"] },
];

function matchesSeg(saleSeg, seg) {
  const s = (saleSeg || "").toLowerCase();
  return seg.patterns.some((p) => s.includes(p));
}

app.get("/api/seguradoras", (_req, res) => {
  res.json(SEGURADORAS.map((s) => s.name));
});

app.get("/api/seguradora-goals", (req, res) => {
  const year  = parseInt(req.query.year)  || new Date().getFullYear();
  const month = parseInt(req.query.month) || (new Date().getMonth() + 1);
  res.json(db.prepare("SELECT * FROM seguradora_goals WHERE year=? AND month=?").all(year, month));
});

app.post("/api/seguradora-goals", requireAdmin, (req, res) => {
  const { seguradora, month, year, prev_year_value, bonus_value } = req.body;
  if (!seguradora || !month || !year)
    return res.status(400).json({ error: "Campos obrigatórios faltando" });
  db.prepare(`
    INSERT INTO seguradora_goals (seguradora, month, year, prev_year_value, bonus_value)
    VALUES (?,?,?,?,?)
    ON CONFLICT(seguradora, month, year)
    DO UPDATE SET prev_year_value=excluded.prev_year_value,
                  bonus_value=excluded.bonus_value,
                  updated_at=datetime('now','localtime')
  `).run(seguradora, month, year, prev_year_value || 0, bonus_value || 0);
  res.json({ ok: true });
});

app.get("/api/seguradora-stats", (req, res) => {
  const year  = parseInt(req.query.year)  || new Date().getFullYear();
  const month = parseInt(req.query.month) || (new Date().getMonth() + 1);

  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay   = new Date(year, month, 0).getDate();
  const endDate   = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const sales = db.prepare(
    "SELECT seguradora, value FROM sales WHERE sale_date BETWEEN ? AND ?"
  ).all(startDate, endDate);

  const goals = db.prepare(
    "SELECT * FROM seguradora_goals WHERE year=? AND month=?"
  ).all(year, month);
  const goalMap = {};
  goals.forEach((g) => (goalMap[g.seguradora] = g));

  const seguradoras = SEGURADORAS.map((seg) => {
    const currentValue = sales
      .filter((s) => matchesSeg(s.seguradora, seg))
      .reduce((sum, s) => sum + s.value, 0);
    const g           = goalMap[seg.name] || {};
    const prevValue   = g.prev_year_value || 0;
    const targetValue = prevValue * 1.10;
    const bonusValue  = g.bonus_value || 0;
    const achieved    = prevValue > 0 && currentValue >= targetValue;
    const percentage  = targetValue > 0
      ? parseFloat(((currentValue / targetValue) * 100).toFixed(2))
      : 0;
    const growthPct = prevValue > 0
      ? parseFloat((((currentValue - prevValue) / prevValue) * 100).toFixed(2))
      : 0;
    return {
      seguradora: seg.name,
      currentValue,
      prevValue,
      targetValue,
      percentage,
      growthPct,
      bonusValue,
      achieved,
      configured: prevValue > 0 || bonusValue > 0,
    };
  });

  res.json({
    year, month,
    startDate, endDate,
    seguradoras,
    totalBonus:    seguradoras.filter((s) => s.achieved).reduce((sum, s) => sum + s.bonusValue, 0),
    achievedCount: seguradoras.filter((s) => s.achieved).length,
  });
});

// ─── PIN Authentication ───────────────────────────────────────────────────────

app.post("/api/salespeople/:id/verify-pin", (req, res) => {
  const person = db.prepare("SELECT id, name, pin FROM salespeople WHERE id=? AND active=1").get(req.params.id);
  if (!person) return res.status(404).json({ error: "Vendedor não encontrado" });
  if (!person.pin) return res.json({ ok: true, name: person.name });
  if (String(req.body.pin || "") === String(person.pin)) return res.json({ ok: true, name: person.name });
  res.status(401).json({ error: "PIN incorreto" });
});

app.post("/api/salespeople/:id/pin", requireAdmin, (req, res) => {
  const pinVal = req.body.pin ? String(req.body.pin).slice(0, 6) : null;
  db.prepare("UPDATE salespeople SET pin=? WHERE id=?").run(pinVal, req.params.id);
  res.json({ ok: true });
});

// ─── Admin Password Change ────────────────────────────────────────────────────

app.put("/api/admin/password", requireAdmin, (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || String(newPassword).length < 4)
    return res.status(400).json({ error: "Senha deve ter pelo menos 4 caracteres" });
  db.prepare("INSERT OR REPLACE INTO settings(key,value) VALUES('admin_password',?)").run(String(newPassword));
  res.json({ ok: true });
});

// ─── Daily Stats ──────────────────────────────────────────────────────────────

app.get("/api/daily-stats", (req, res) => {
  const period = req.query.period === "monthly" ? "monthly" : "weekly";
  const range  = getPeriodRange(period);
  const today  = new Date().toISOString().split("T")[0];
  const endD   = range.end < today ? range.end : today;

  const salesRows = db.prepare(`
    SELECT s.salesperson_id, sp.name, s.sale_date, SUM(s.value) AS day_total
    FROM sales s JOIN salespeople sp ON sp.id = s.salesperson_id
    WHERE s.sale_date BETWEEN ? AND ? AND sp.active = 1
    GROUP BY s.salesperson_id, s.sale_date
    ORDER BY s.sale_date
  `).all(range.start, endD);

  const dates = [];
  let d = new Date(range.start);
  const eD = new Date(endD);
  while (d <= eD) {
    dates.push(d.toISOString().split("T")[0]);
    d.setDate(d.getDate() + 1);
  }

  const people = db.prepare("SELECT id, name FROM salespeople WHERE active=1 ORDER BY name").all();

  const datasets = people.map((p) => {
    let cum = 0;
    const data = dates.map((date) => {
      const row = salesRows.find((r) => r.salesperson_id === p.id && r.sale_date === date);
      cum += row ? row.day_total : 0;
      return parseFloat(cum.toFixed(2));
    });
    return { id: p.id, name: p.name, data };
  }).filter((ds) => ds.data.some((v) => v > 0));

  res.json({ dates, datasets, period });
});

// ─────────────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`Servidor MarIAna rodando na porta ${PORT}`);
  console.log(`>>> VERSAO: ${SERVER_VERSION} <<<`);
  console.log(`>>> Admin: http://localhost:${PORT}/admin.html`);
  console.log(`>>> Senha admin: ${ADMIN_PASSWORD === "admin123" ? "admin123 (padrao)" : "(custom via .env)"}`);
});
