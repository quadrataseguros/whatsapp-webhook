const express = require("express");
const axios = require("axios");
const app = express();
app.use(express.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "quadrata123";
const LANGFLOW_URL = process.env.LANGFLOW_URL || "http://localhost:7860";
const LANGFLOW_FLOW_ID = process.env.LANGFLOW_FLOW_ID || "";
const LANGFLOW_API_KEY = process.env.LANGFLOW_API_KEY || "";

// WhatsApp
const WA_PHONE_NUMBER_ID = process.env.WA_PHONE_NUMBER_ID || "";
const WA_ACCESS_TOKEN = process.env.WA_ACCESS_TOKEN || "";

// Instagram
const IG_ACCESS_TOKEN = process.env.IG_ACCESS_TOKEN || "";

const MAKE_WEBHOOK_URL = process.env.MAKE_WEBHOOK_URL || "";
const PORT = process.env.PORT || 3000;

// Meta webhook verification (shared for WhatsApp and Instagram)
app.get("/webhook", (req, res) => {
  if (req.query["hub.verify_token"] === VERIFY_TOKEN) {
    res.send(req.query["hub.challenge"]);
  } else {
    res.sendStatus(403);
  }
});

// Health check
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    langflow: LANGFLOW_URL,
    mode: LANGFLOW_FLOW_ID ? "langflow" : "make",
    channels: {
      whatsapp: !!(WA_PHONE_NUMBER_ID && WA_ACCESS_TOKEN),
      instagram: !!IG_ACCESS_TOKEN,
    },
  });
});

// Extract first text message from a WhatsApp webhook payload
function extractWhatsAppMessage(body) {
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

// Extract first text message from an Instagram webhook payload
function extractInstagramMessage(body) {
  try {
    const entry = body.entry?.[0];
    const messaging = entry?.messaging?.[0];
    if (!messaging) return null;

    const message = messaging.message;
    // Ignore echo messages sent by the page itself
    if (!message || message.is_echo) return null;

    return {
      from: messaging.sender?.id,
      messageId: message.mid,
      type: message.text ? "text" : "other",
      text: message.text || "",
      name: messaging.sender?.id,
      channel: "instagram",
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

// Send a text reply via Instagram Messaging API
async function sendInstagramReply(recipientId, text) {
  if (!IG_ACCESS_TOKEN) return;
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

  const outputs = response.data?.outputs;
  const result =
    outputs?.[0]?.outputs?.[0]?.results?.message?.text ||
    outputs?.[0]?.outputs?.[0]?.results?.message?.data?.text ||
    outputs?.[0]?.outputs?.[0]?.messages?.[0]?.message ||
    "";
  return result;
}

// Process an incoming message (WhatsApp or Instagram)
async function processMessage(msg, rawBody) {
  if (!msg || msg.type !== "text" || !msg.text) {
    console.log("Evento ignorado (não é mensagem de texto)");
    return;
  }

  console.log(`[${msg.channel}] Mensagem de ${msg.name} (${msg.from}): ${msg.text}`);

  if (LANGFLOW_FLOW_ID) {
    const reply = await runLangflow(msg.text, msg.from);
    if (reply) {
      console.log(`[${msg.channel}] Resposta Langflow: ${reply}`);
      if (msg.channel === "instagram") {
        await sendInstagramReply(msg.from, reply);
      } else {
        await sendWhatsAppReply(msg.from, reply);
      }
    }
  } else if (MAKE_WEBHOOK_URL) {
    await axios.post(MAKE_WEBHOOK_URL, rawBody);
    console.log(`[${msg.channel}] Payload encaminhado para Make`);
  } else {
    console.log("Nenhum destino configurado (LANGFLOW_FLOW_ID ou MAKE_WEBHOOK_URL)");
  }
}

// Main webhook handler — handles both WhatsApp and Instagram
app.post("/webhook", async (req, res) => {
  res.sendStatus(200); // Acknowledge immediately per Meta requirements

  const object = req.body?.object;

  try {
    if (object === "instagram") {
      const msg = extractInstagramMessage(req.body);
      await processMessage(msg, req.body);
    } else if (object === "whatsapp_business_account") {
      const msg = extractWhatsAppMessage(req.body);
      await processMessage(msg, req.body);
    } else {
      console.log(`Objeto desconhecido ignorado: ${object}`);
    }
  } catch (err) {
    console.error("Erro ao processar mensagem:", err.message);
  }
});

app.listen(PORT, () =>
  console.log(`Servidor MarIAna rodando na porta ${PORT}`)
);
