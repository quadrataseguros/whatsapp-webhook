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
const TYPEBOT_API_URL = process.env.TYPEBOT_API_URL || "https://typebot.io";
const TYPEBOT_ID = process.env.TYPEBOT_ID || "";

const PORT = process.env.PORT || 3000;

// phone → Typebot sessionId (resets when process restarts)
const typebotSessions = new Map();

// Meta webhook verification
app.get("/webhook", (req, res) => {
  if (req.query["hub.verify_token"] === VERIFY_TOKEN) {
    res.send(req.query["hub.challenge"]);
  } else {
    res.sendStatus(403);
  }
});

// Health check
app.get("/health", (_req, res) => {
  const mode = TYPEBOT_ID ? "typebot" : LANGFLOW_FLOW_ID ? "langflow" : "make";
  res.json({ status: "ok", mode, langflow: LANGFLOW_URL, typebot: TYPEBOT_API_URL });
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

// Pull plain text out of Typebot's messages array
function extractTypebotText(messages) {
  return messages
    .filter((m) => m.type === "text")
    .map((m) => m.content?.plainText || "")
    .filter(Boolean)
    .join("\n");
}

// Start a new Typebot conversation and return { sessionId, text }
async function startTypebotChat(userText) {
  const response = await axios.post(
    `${TYPEBOT_API_URL}/api/v1/typebots/${TYPEBOT_ID}/startChat`,
    {},
    { headers: { "Content-Type": "application/json" } }
  );
  const { sessionId, messages } = response.data;
  // After starting, immediately continue with the user's first message
  const continued = await continueTypebotChat(sessionId, userText);
  return { sessionId, text: continued.text };
}

// Continue an existing Typebot session and return { text }
async function continueTypebotChat(sessionId, userText) {
  const response = await axios.post(
    `${TYPEBOT_API_URL}/api/v1/sessions/${sessionId}/continueChat`,
    { message: userText },
    { headers: { "Content-Type": "application/json" } }
  );
  const { messages } = response.data;
  return { text: extractTypebotText(messages) };
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

// Main webhook handler
app.post("/webhook", async (req, res) => {
  res.sendStatus(200); // Acknowledge immediately per Meta requirements

  const msg = extractMessage(req.body);

  if (!msg || msg.type !== "text" || !msg.text) {
    console.log("Evento ignorado (não é mensagem de texto)");
    return;
  }

  console.log(`Mensagem de ${msg.name} (${msg.from}): ${msg.text}`);

  try {
    if (TYPEBOT_ID) {
      // Typebot mode: manage sessions per phone number
      let reply = "";
      const existingSession = typebotSessions.get(msg.from);

      if (existingSession) {
        const result = await continueTypebotChat(existingSession, msg.text);
        reply = result.text;
      } else {
        const result = await startTypebotChat(msg.text);
        typebotSessions.set(msg.from, result.sessionId);
        reply = result.text;
      }

      if (reply) {
        console.log(`Resposta Typebot: ${reply}`);
        await sendWhatsAppReply(msg.from, reply);
      }
    } else if (LANGFLOW_FLOW_ID) {
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
      console.log("Nenhum destino configurado (TYPEBOT_ID, LANGFLOW_FLOW_ID ou MAKE_WEBHOOK_URL)");
    }
  } catch (err) {
    console.error("Erro ao processar mensagem:", err.message);
  }
});

app.listen(PORT, () =>
  console.log(`Servidor MarIAna rodando na porta ${PORT}`)
);
