require("dotenv").config();
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
const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN || process.env.IG_ACCESS_TOKEN || WA_ACCESS_TOKEN;
const MAKE_WEBHOOK_URL = process.env.MAKE_WEBHOOK_URL || "";
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_CHAT_IDS = (process.env.TELEGRAM_CHAT_IDS || "").split(",").map(s => s.trim()).filter(Boolean);

const PORT = process.env.PORT || 3000;

// Palavras que indicam que a MarIAna acionou transbordo humano
const TRANSBORDO_TRIGGERS = [
  "vou te conectar agora com um dos nossos consultores",
  "já estou enviando seu perfil",
  "tempo estimado: menos de 5 minutos",
];

function detectaTransbordo(texto) {
  const lower = texto.toLowerCase();
  return TRANSBORDO_TRIGGERS.some(t => lower.includes(t.toLowerCase()));
}

async function notificarTelegram(msg, replyMariana) {
  if (!TELEGRAM_BOT_TOKEN || TELEGRAM_CHAT_IDS.length === 0) return;

  const numero = msg.from;
  const linkWA = `https://wa.me/${numero}`;
  const plataforma = msg.platform === "whatsapp" ? "WhatsApp 📱" : "Instagram 📸";

  const texto =
    `🔔 *CLIENTE AGUARDANDO ATENDIMENTO*\n\n` +
    `👤 *Nome:* ${msg.name}\n` +
    `📲 *Plataforma:* ${plataforma}\n` +
    `📞 *Contato:* +${numero}\n\n` +
    `💬 *Última mensagem:*\n_${msg.text}_\n\n` +
    `👉 [Abrir conversa no WhatsApp](${linkWA})`;

  for (const chatId of TELEGRAM_CHAT_IDS) {
    await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      { chat_id: chatId, text: texto, parse_mode: "Markdown", disable_web_page_preview: true }
    ).catch(err => console.error("Erro Telegram:", err.message));
  }
}

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

function extractWhatsAppMessage(body) {
  try {
    const value = body.entry?.[0]?.changes?.[0]?.value;
    const message = value?.messages?.[0];
    if (!message) return null;
    return {
      platform: "whatsapp",
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

function extractInstagramMessage(body) {
  try {
    const messaging = body.entry?.[0]?.messaging?.[0];
    if (!messaging?.message?.text) return null;
    return {
      platform: "instagram",
      from: messaging.sender.id,
      messageId: messaging.message.mid,
      type: "text",
      text: messaging.message.text,
      name: messaging.sender.id,
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

async function sendInstagramReply(to, text) {
  if (!INSTAGRAM_ACCESS_TOKEN) return;
  await axios.post(
    `https://graph.facebook.com/v19.0/me/messages`,
    {
      recipient: { id: to },
      message: { text },
      messaging_type: "RESPONSE",
    },
    {
      headers: {
        Authorization: `Bearer ${INSTAGRAM_ACCESS_TOKEN}`,
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

  const msg = extractWhatsAppMessage(req.body) || extractInstagramMessage(req.body);

  if (!msg || msg.type !== "text" || !msg.text) {
    console.log("Evento ignorado (não é mensagem de texto)");
    return;
  }

  console.log(`[${msg.platform}] Mensagem de ${msg.name} (${msg.from}): ${msg.text}`);

  try {
    if (LANGFLOW_FLOW_ID) {
      const reply = await runLangflow(msg.text, msg.from);
      if (reply) {
        console.log(`Resposta MarIAna: ${reply}`);
        if (msg.platform === "whatsapp") {
          await sendWhatsAppReply(msg.from, reply);
        } else {
          await sendInstagramReply(msg.from, reply);
        }
        if (detectaTransbordo(reply)) {
          console.log("Transbordo detectado — notificando Telegram");
          await notificarTelegram(msg, reply);
        }
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
