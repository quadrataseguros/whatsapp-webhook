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
const MAKE_WEBHOOK_URL = process.env.MAKE_WEBHOOK_URL || "";
const POST_CREATOR_SECRET = process.env.POST_CREATOR_SECRET || "";

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

// ─── Life Insurance Post Creator API ─────────────────────────────────────────

let postGenerator = null;
function getGenerator() {
  if (!postGenerator && process.env.ANTHROPIC_API_KEY) {
    postGenerator = require("./life-insurance/generator");
  }
  return postGenerator;
}

// POST /posts/generate — gera um post de seguro de vida
app.post("/posts/generate", async (req, res) => {
  if (POST_CREATOR_SECRET && req.headers["x-secret"] !== POST_CREATOR_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const gen = getGenerator();
  if (!gen) {
    return res.status(503).json({ error: "ANTHROPIC_API_KEY não configurada" });
  }
  try {
    const { tipo = "carrossel", persona = "provedor", pilar = "educacao", tema, contexto } = req.body;
    const result = await gen.generatePost({ tipo, persona_id: persona, pilar, tema, contexto_adicional: contexto || "" });
    res.json(result);
  } catch (err) {
    console.error("Erro ao gerar post:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /posts/calendar — gera calendário mensal completo
app.post("/posts/calendar", async (req, res) => {
  if (POST_CREATOR_SECRET && req.headers["x-secret"] !== POST_CREATOR_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const gen = getGenerator();
  if (!gen) {
    return res.status(503).json({ error: "ANTHROPIC_API_KEY não configurada" });
  }
  try {
    const { mes, ano } = req.body;
    const result = await gen.generateMonthlyCalendar({ mes, ano });
    res.json(result);
  } catch (err) {
    console.error("Erro ao gerar calendário:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /posts/options — lista tipos, personas e pilares disponíveis
app.get("/posts/options", (req, res) => {
  const gen = getGenerator();
  if (!gen) return res.status(503).json({ error: "ANTHROPIC_API_KEY não configurada" });
  res.json({
    tipos: Object.keys(gen.POST_TYPES),
    personas: Object.keys(gen.PERSONA_IDS),
    pilares: ["educacao", "emocao", "autoridade", "conversao"],
  });
});

// ─── Main webhook handler ─────────────────────────────────────────────────────

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

app.listen(PORT, () =>
  console.log(`Servidor MarIAna rodando na porta ${PORT}`)
);
