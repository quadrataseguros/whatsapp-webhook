const express = require("express");
const axios = require("axios");
const app = express();
app.use(express.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "quadrata123";
const LANGFLOW_URL = process.env.LANGFLOW_URL || "http://localhost:7860";
const LANGFLOW_FLOW_ID = process.env.LANGFLOW_FLOW_ID || "";
const LANGFLOW_API_KEY = process.env.LANGFLOW_API_KEY || "";
const WA_PHONE_NUMBER_ID = process.env.WA_PHONE_NUMBER_ID || "";
const WA_ACCESS_TOKEN = process.env.WA_ACCESS_TOKEN || "";

// Instagram
const IG_ACCESS_TOKEN = process.env.IG_ACCESS_TOKEN || "";
const IG_PAGE_ID = process.env.IG_PAGE_ID || "";
const MAKE_WEBHOOK_URL = process.env.MAKE_WEBHOOK_URL || "";

// Roteamento de intenções — flows alternativos (opcionais)
const LANGFLOW_FLOW_VENDEDOR = process.env.LANGFLOW_FLOW_VENDEDOR || "";
const LANGFLOW_ROUTE_VENDEDOR = process.env.LANGFLOW_ROUTE_VENDEDOR || "comprar,cotação,preço,proposta,seguro,plano,contratar,valor,orçamento";
const LANGFLOW_FLOW_SECRETARIA = process.env.LANGFLOW_FLOW_SECRETARIA || "";
const LANGFLOW_ROUTE_SECRETARIA = process.env.LANGFLOW_ROUTE_SECRETARIA || "agendar,horário,reunião,agenda,marcar,visita,data,disponível";

// Rate limiting
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX || "10");
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000");

const PORT = process.env.PORT || 3000;

// ── 1. Deduplicação ────────────────────────────────────────────────────────────
// Evita responder duas vezes a mesma mensagem (Meta pode reenviar o webhook)
const processedMessages = new Map();
setInterval(() => {
  const cutoff = Date.now() - 5 * 60 * 1000;
  for (const [id, ts] of processedMessages) {
    if (ts < cutoff) processedMessages.delete(id);
  }
}, 5 * 60 * 1000);

// ── 2. Rate limiting ───────────────────────────────────────────────────────────
const userRateLimits = new Map();
setInterval(() => {
  const cutoff = Date.now() - RATE_LIMIT_WINDOW_MS * 2;
  for (const [from, entry] of userRateLimits) {
    if (entry.windowStart < cutoff) userRateLimits.delete(from);
  }
}, RATE_LIMIT_WINDOW_MS);

function isRateLimited(from) {
  const now = Date.now();
  const entry = userRateLimits.get(from) || { count: 0, windowStart: now };
  if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    userRateLimits.set(from, { count: 1, windowStart: now });
    return false;
  }
  if (entry.count >= RATE_LIMIT_MAX) return true;
  userRateLimits.set(from, { ...entry, count: entry.count + 1 });
  return false;
}

// ── 3. Retry com backoff exponencial ──────────────────────────────────────────
async function withRetry(fn, retries = 3, baseDelayMs = 1000) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, baseDelayMs * Math.pow(2, attempt)));
    }
  }
}

// ── Meta webhook verification ──────────────────────────────────────────────────
app.get("/webhook", (req, res) => {
  if (req.query["hub.verify_token"] === VERIFY_TOKEN) {
    res.send(req.query["hub.challenge"]);
  } else {
    res.sendStatus(403);
  }
});

// ── Health check ───────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    langflow: LANGFLOW_URL,
    mode: LANGFLOW_FLOW_ID ? "langflow" : "make",
    agents: {
      atendente: LANGFLOW_FLOW_ID ? "configured" : "not set",
      vendedor: LANGFLOW_FLOW_VENDEDOR ? "configured" : "not set",
      secretaria: LANGFLOW_FLOW_SECRETARIA ? "configured" : "not set",
    },
  });
});

// ── Extract WhatsApp message ───────────────────────────────────────────────────
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
      channel: "whatsapp",
    };
  } catch {
    return null;
  }
}

// ── Extract Instagram message ──────────────────────────────────────────────────
function extractInstagramMessage(body) {
  try {
    const entry = body.entry?.[0];
    const messaging = entry?.messaging?.[0];
    if (!messaging || !messaging.message) return null;

    const message = messaging.message;
    // Ignora mensagens eco (enviadas pelo próprio bot)
    if (message.is_echo) return null;

    return {
      from: messaging.sender.id,
      messageId: message.mid,
      type: message.attachments ? message.attachments[0]?.type : "text",
      text: message.text || "",
      name: messaging.sender.id,
      channel: "instagram",
    };
  } catch {
    return null;
  }
}

// ── 4. Mark as Read ────────────────────────────────────────────────────────────
async function markAsRead(messageId) {
  if (!WA_PHONE_NUMBER_ID || !WA_ACCESS_TOKEN) return;
  try {
    await axios.post(
      `https://graph.facebook.com/v19.0/${WA_PHONE_NUMBER_ID}/messages`,
      { messaging_product: "whatsapp", status: "read", message_id: messageId },
      {
        headers: {
          Authorization: `Bearer ${WA_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
  } catch {
    // Não crítico — ignora falha silenciosamente
  }
}

// ── Send WhatsApp reply ────────────────────────────────────────────────────────
async function sendWhatsAppReply(to, text) {
  if (!WA_PHONE_NUMBER_ID || !WA_ACCESS_TOKEN) return;
  await axios.post(
    `https://graph.facebook.com/v19.0/${WA_PHONE_NUMBER_ID}/messages`,
    { messaging_product: "whatsapp", to, type: "text", text: { body: text } },
    {
      headers: {
        Authorization: `Bearer ${WA_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  );
}

// ── Send Instagram reply ───────────────────────────────────────────────────────
async function sendInstagramReply(recipientId, text) {
  if (!IG_ACCESS_TOKEN) {
    console.warn("[INSTA] IG_ACCESS_TOKEN não configurado");
    return;
  }
  await axios.post(
    `https://graph.facebook.com/v19.0/me/messages`,
    {
      recipient: { id: recipientId },
      message: { text },
      messaging_type: "RESPONSE",
    },
    {
      headers: {
        Authorization: `Bearer ${IG_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  );
}

// ── 5. Roteamento por intenção ─────────────────────────────────────────────────
// Simula o padrão de múltiplos agentes: Atendente / Vendedor / Secretária
function resolveFlowId(text) {
  const lower = text.toLowerCase();

  if (LANGFLOW_FLOW_VENDEDOR) {
    const keywords = LANGFLOW_ROUTE_VENDEDOR.split(",").map((k) => k.trim());
    if (keywords.some((k) => lower.includes(k))) {
      console.log(`[ROTA] → Vendedor`);
      return LANGFLOW_FLOW_VENDEDOR;
    }
  }

  if (LANGFLOW_FLOW_SECRETARIA) {
    const keywords = LANGFLOW_ROUTE_SECRETARIA.split(",").map((k) => k.trim());
    if (keywords.some((k) => lower.includes(k))) {
      console.log(`[ROTA] → Secretária`);
      return LANGFLOW_FLOW_SECRETARIA;
    }
  }

  console.log(`[ROTA] → Atendente (default)`);
  return LANGFLOW_FLOW_ID;
}

// ── Run Langflow ───────────────────────────────────────────────────────────────
async function runLangflow(inputText, sessionId) {
  const flowId = resolveFlowId(inputText);
  const headers = { "Content-Type": "application/json" };
  if (LANGFLOW_API_KEY) headers["x-api-key"] = LANGFLOW_API_KEY;

  const response = await axios.post(
    `${LANGFLOW_URL}/api/v1/run/${flowId}`,
    {
      input_value: inputText,
      input_type: "chat",
      output_type: "chat",
      session_id: sessionId,
    },
    { headers }
  );

  const outputs = response.data?.outputs;
  return (
    outputs?.[0]?.outputs?.[0]?.results?.message?.text ||
    outputs?.[0]?.outputs?.[0]?.results?.message?.data?.text ||
    outputs?.[0]?.outputs?.[0]?.messages?.[0]?.message ||
    ""
  );
}

// ── Função unificada de envio de resposta ──────────────────────────────────────
async function sendReply(msg, text) {
  if (msg.channel === "instagram") {
    await sendInstagramReply(msg.from, text);
  } else {
    await sendWhatsAppReply(msg.from, text);
  }
}

// ── Main webhook handler ───────────────────────────────────────────────────────
app.post("/webhook", async (req, res) => {
  res.sendStatus(200); // Acknowledge immediately per Meta requirements

  const object = req.body?.object;

  // Detecta canal: WhatsApp ou Instagram
  let msg = null;
  if (object === "instagram") {
    msg = extractInstagramMessage(req.body);
    if (msg) console.log(`[CANAL] Instagram`);
  } else {
    msg = extractMessage(req.body);
    if (msg) console.log(`[CANAL] WhatsApp`);
  }

  if (!msg) return;

  // Deduplicação — ignora reenvios do Meta
  if (processedMessages.has(msg.messageId)) {
    console.log(`[DEDUP] Mensagem já processada: ${msg.messageId}`);
    return;
  }
  processedMessages.set(msg.messageId, Date.now());

  // Mark as read — só para WhatsApp (Instagram não tem essa API)
  if (msg.channel === "whatsapp") await markAsRead(msg.messageId);

  // Tratamento de mensagens de áudio e outros tipos não-texto
  if (msg.type !== "text") {
    if (["audio", "voice"].includes(msg.type)) {
      await sendReply(msg, "Olá! No momento só consigo responder mensagens de texto. Por favor, escreva sua dúvida que te ajudo 😊");
      console.log(`[ÁUDIO] ${msg.name} (${msg.from}) — respondido com aviso`);
    } else {
      console.log(`[IGNORADO] Tipo '${msg.type}' de ${msg.from}`);
    }
    return;
  }

  if (!msg.text) return;

  // Rate limiting — protege contra flood
  if (isRateLimited(msg.from)) {
    console.log(`[RATE LIMIT] ${msg.from} excedeu o limite`);
    await sendReply(msg, "Muitas mensagens em pouco tempo. Aguarde um momento e tente novamente 🙏");
    return;
  }

  console.log(`[MSG][${msg.channel?.toUpperCase()}] ${msg.name} (${msg.from}): ${msg.text}`);

  try {
    if (LANGFLOW_FLOW_ID) {
      const reply = await withRetry(() => runLangflow(msg.text, msg.from));
      if (reply) {
        console.log(`[REPLY] ${reply}`);
        await sendReply(msg, reply);
      }
    } else if (MAKE_WEBHOOK_URL) {
      await axios.post(MAKE_WEBHOOK_URL, req.body);
      console.log("[MAKE] Payload encaminhado");
    } else {
      console.log("[WARN] Nenhum destino configurado (LANGFLOW_FLOW_ID ou MAKE_WEBHOOK_URL)");
    }
  } catch (err) {
    console.error("[ERRO]", err.message);
    await sendReply(msg, "Desculpe, tive um problema técnico. Por favor, tente novamente em instantes 🙏");
  }
});

app.listen(PORT, () => console.log(`Servidor MarIAna rodando na porta ${PORT}`));
