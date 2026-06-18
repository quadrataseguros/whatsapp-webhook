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
const IG_ACCESS_TOKEN = process.env.IG_ACCESS_TOKEN || "";
const IG_USER_ID = process.env.IG_USER_ID || "";
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

// Health check
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    langflow: LANGFLOW_URL,
    mode: LANGFLOW_FLOW_ID ? "langflow" : "make",
  });
});

// Diagnóstico do Langflow — abre no browser para ver a causa real do 500
app.get("/langflow-status", async (_req, res) => {
  const result = { url: LANGFLOW_URL, flow_id: LANGFLOW_FLOW_ID || "(não configurado)" };

  // Testa se o servidor Langflow responde
  try {
    const health = await axios.get(`${LANGFLOW_URL}/health`, { timeout: 10000 });
    result.server = "ok";
    result.server_response = health.data;
  } catch (err) {
    result.server = "erro";
    result.server_error = err.message;
    result.server_status = err.response?.status;
    result.server_body = err.response?.data;
    return res.status(502).json(result);
  }

  // Testa se o flow específico existe
  if (LANGFLOW_FLOW_ID) {
    const headers = { "Content-Type": "application/json" };
    if (LANGFLOW_API_KEY) headers["x-api-key"] = LANGFLOW_API_KEY;
    try {
      const test = await axios.post(
        `${LANGFLOW_URL}/api/v1/run/${LANGFLOW_FLOW_ID}`,
        { input_value: "teste", input_type: "chat", output_type: "chat", tweaks: {} },
        { headers, timeout: 30000 }
      );
      result.flow = "ok";
      result.flow_status = test.status;
    } catch (err) {
      result.flow = "erro";
      result.flow_status = err.response?.status;
      result.flow_error = err.response?.data ?? err.message;
    }
  }

  res.json(result);
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
  if (!IG_ACCESS_TOKEN || !IG_USER_ID) {
    console.log("Instagram: IG_ACCESS_TOKEN ou IG_USER_ID não configurado");
    return;
  }
  console.log('[IG] Enviando para', to, 'com user_id', IG_USER_ID, 'token inicio:', IG_ACCESS_TOKEN.substring(0,20));
  try { await axios.post(
    `https://graph.instagram.com/v21.0/${IG_USER_ID}/messages`,
    {
      recipient: { id: to },
      message: { text },
      messaging_type: "RESPONSE",
    },
    {
      headers: {
        Authorization: `Bearer ${IG_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  ); } catch(igErr) { console.error('[IG] Erro detalhado:', igErr.response?.status, JSON.stringify(igErr.response?.data)); throw igErr; }
}

async function runLangflow(inputText, sessionId) {
  const headers = { "Content-Type": "application/json" };
  if (LANGFLOW_API_KEY) headers["x-api-key"] = LANGFLOW_API_KEY;

  let response;
  try {
    response = await axios.post(
      `${LANGFLOW_URL}/api/v1/run/${LANGFLOW_FLOW_ID}`,
      {
        input_value: inputText,
        input_type: "chat",
        output_type: "chat",
        session_id: sessionId,
        tweaks: {},
      },
      { headers, timeout: 60000 }
    );
  } catch (err) {
    const status = err.response?.status;
    const data = err.response?.data;
    console.error(
      `Langflow erro HTTP ${status || "sem resposta"}:`,
      JSON.stringify(data ?? err.message)
    );
    throw err;
  }

  const outputs = response.data?.outputs;
  const result =
    outputs?.[0]?.outputs?.[0]?.results?.message?.text ||
    outputs?.[0]?.outputs?.[0]?.results?.message?.data?.text ||
    outputs?.[0]?.outputs?.[0]?.messages?.[0]?.message ||
    "";

  if (!result) {
    console.warn("Langflow retornou resposta vazia. outputs:", JSON.stringify(outputs));
  }

  return result;
}

app.post("/webhook", async (req, res) => {
  res.sendStatus(200);

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
      }
    } else if (MAKE_WEBHOOK_URL) {
      await axios.post(MAKE_WEBHOOK_URL, req.body);
      console.log("Payload encaminhado para Make");
    } else {
      console.log("Nenhum destino configurado (LANGFLOW_FLOW_ID ou MAKE_WEBHOOK_URL)");
    }
  } catch (err) {
    console.error("Erro ao processar mensagem:", err.message, err.response?.data ?? "");
    // Avisa o usuário que o sistema está com problema temporário
    const aviso = "Desculpe, estou com uma instabilidade técnica no momento. Tente novamente em alguns instantes ou entre em contato pelo telefone. 🙏";
    try {
      if (msg.platform === "whatsapp") {
        await sendWhatsAppReply(msg.from, aviso);
      } else {
        await sendInstagramReply(msg.from, aviso);
      }
    } catch {
      // ignora erro ao enviar aviso
    }
  }
});

app.listen(PORT, () => {
  console.log(`Servidor MarIAna rodando na porta ${PORT}`);
  console.log(`Langflow URL: ${LANGFLOW_URL}`);
  console.log(`Langflow Flow ID: ${LANGFLOW_FLOW_ID || "(não configurado)"}`);
  console.log(`Langflow API Key: ${LANGFLOW_API_KEY ? "configurada" : "(não configurada)"}`);
  console.log(`Modo: ${LANGFLOW_FLOW_ID ? "langflow" : MAKE_WEBHOOK_URL ? "make" : "nenhum destino"}`);
});
