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
    const extracted = {
      platform: "whatsapp",
      from: message.from,
      messageId: message.id,
      type: message.type,
      text: message.text?.body || "",
      name: value.contacts?.[0]?.profile?.name || message.from,
    };
    if (message.type === "image") {
      extracted.mediaId = message.image.id;
      extracted.caption = message.image.caption || "";
      extracted.mimeType = message.image.mime_type || "image/jpeg";
    } else if (message.type === "document") {
      extracted.mediaId = message.document.id;
      extracted.caption = message.document.caption || message.document.filename || "";
      extracted.mimeType = message.document.mime_type || "application/octet-stream";
      extracted.filename = message.document.filename || "documento";
    }
    return extracted;
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

async function downloadWhatsAppMedia(mediaId) {
  const { data: info } = await axios.get(
    `https://graph.facebook.com/v19.0/${mediaId}`,
    { headers: { Authorization: `Bearer ${WA_ACCESS_TOKEN}` } }
  );
  const { data: fileData, headers: fileHeaders } = await axios.get(info.url, {
    headers: { Authorization: `Bearer ${WA_ACCESS_TOKEN}` },
    responseType: "arraybuffer",
  });
  return {
    buffer: Buffer.from(fileData),
    mimeType: fileHeaders["content-type"] || "image/jpeg",
  };
}

async function uploadFileToLangflow(buffer, filename, mimeType) {
  const formData = new FormData();
  formData.append("file", new Blob([buffer], { type: mimeType }), filename);
  const headers = {};
  if (LANGFLOW_API_KEY) headers["x-api-key"] = LANGFLOW_API_KEY;
  const res = await fetch(
    `${LANGFLOW_URL}/api/v1/files/upload/${LANGFLOW_FLOW_ID}`,
    { method: "POST", headers, body: formData }
  );
  if (!res.ok) throw new Error(`Langflow upload HTTP ${res.status}`);
  const json = await res.json();
  return json.file_path;
}

async function runLangflow(inputText, sessionId, files = []) {
  const headers = { "Content-Type": "application/json" };
  if (LANGFLOW_API_KEY) headers["x-api-key"] = LANGFLOW_API_KEY;

  const body = {
    input_value: inputText,
    input_type: "chat",
    output_type: "chat",
    session_id: sessionId,
    tweaks: {},
  };
  if (files.length > 0) body.files = files;

  let response;
  try {
    response = await axios.post(
      `${LANGFLOW_URL}/api/v1/run/${LANGFLOW_FLOW_ID}`,
      body,
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

  const isText = msg?.type === "text" && msg.text;
  const isMedia = msg?.platform === "whatsapp" && (msg.type === "image" || msg.type === "document") && msg.mediaId;

  if (!msg || (!isText && !isMedia)) {
    console.log("Evento ignorado (tipo não suportado)");
    return;
  }

  console.log(`[${msg.platform}] Mensagem de ${msg.name} (${msg.from}): tipo=${msg.type}`);

  try {
    if (LANGFLOW_FLOW_ID) {
      let reply;
      if (isMedia) {
        console.log(`[WA] Baixando mídia ${msg.mediaId} (${msg.mimeType})`);
        const { buffer, mimeType } = await downloadWhatsAppMedia(msg.mediaId);
        const ext = mimeType.split("/")[1]?.split(";")[0] || "bin";
        const filename = msg.filename || `midia_${msg.mediaId}.${ext}`;
        const filePath = await uploadFileToLangflow(buffer, filename, mimeType);
        console.log(`[WA] Arquivo enviado ao Langflow: ${filePath}`);
        const inputText = msg.caption || (msg.type === "document" ? "Analisar documento" : "Analisar imagem");
        reply = await runLangflow(inputText, msg.from, [filePath]);
      } else {
        reply = await runLangflow(msg.text, msg.from);
      }
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
