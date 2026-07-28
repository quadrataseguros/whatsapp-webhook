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
    const interactive = message.interactive;
    return {
      platform: "whatsapp",
      from: message.from,
      messageId: message.id,
      type: message.type,
      text:
        message.text?.body ||
        interactive?.list_reply?.title ||
        interactive?.button_reply?.title ||
        "",
      interactiveId:
        interactive?.list_reply?.id || interactive?.button_reply?.id || null,
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

// ---------------------------------------------------------------------------
// Menu interativo (WhatsApp Cloud API) — mesmo recurso de lista/botões do
// Digisac, enviado direto pelo webhook. A MarIAna (IA) segue como fallback
// para mensagens de texto livre.
// ---------------------------------------------------------------------------

async function sendWhatsAppInteractiveList(to, { header, body, footer, button, rows }) {
  if (!WA_PHONE_NUMBER_ID || !WA_ACCESS_TOKEN) return;
  const interactive = {
    type: "list",
    body: { text: body },
    action: {
      button,
      sections: [
        {
          rows: rows.map((r) => ({
            id: r.id,
            title: r.title,
            ...(r.description ? { description: r.description } : {}),
          })),
        },
      ],
    },
  };
  if (header) interactive.header = { type: "text", text: header };
  if (footer) interactive.footer = { text: footer };

  await axios.post(
    `https://graph.facebook.com/v19.0/${WA_PHONE_NUMBER_ID}/messages`,
    { messaging_product: "whatsapp", to, type: "interactive", interactive },
    {
      headers: {
        Authorization: `Bearer ${WA_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  );
}

const HORARIO = "seg a sex, 8h30 às 17h30";

async function sendMainMenu(to, name) {
  await sendWhatsAppInteractiveList(to, {
    header: "Quadrata Seguros",
    body:
      `Olá${name ? ", " + name : ""}! 👋 Aqui é da *Quadrata Seguros*.\n\n` +
      `No momento estamos fora do horário de atendimento (${HORARIO}), ` +
      `mas já consigo te ajudar. Toque em *"Ver opções"* e escolha:`,
    footer: "Atendimento automático",
    button: "Ver opções",
    rows: [
      { id: "cotacao", title: "Cotação de seguro", description: "Simule o seu seguro" },
      { id: "sinistro", title: "Sinistro / Guincho", description: "Assistência 24h" },
      { id: "app", title: "Baixar o app", description: "MySeg • código 1133" },
      { id: "corretor", title: "Falar com corretor", description: "Deixe o seu recado" },
    ],
  });
}

async function sendSeguradorasMenu(to) {
  await sendWhatsAppInteractiveList(to, {
    header: "Sinistro / Assistência 24h",
    body: "Sentimos pelo ocorrido. Para agilizar, qual é a sua seguradora?",
    button: "Ver seguradoras",
    rows: [
      { id: "seg_porto_itau", title: "Porto / Itaú" },
      { id: "seg_azul", title: "Azul Seguros" },
      { id: "seg_bradesco", title: "Bradesco Seguros" },
      { id: "seg_suhai", title: "Suhai Seguradora" },
      { id: "seg_yelum", title: "Yelum Seguros" },
      { id: "seg_allianz", title: "Allianz Seguros" },
      { id: "seg_tokio", title: "Tokio Marine" },
      { id: "seg_aliro", title: "Aliro Seguro" },
      { id: "seg_outra", title: "Não sei / outra" },
    ],
  });
}

const DICA =
  "\n\n💡 Tenha em mãos o *CPF do titular* ou a *placa*. Também registramos aqui e um corretor dá sequência assim que abrirmos.";

const RESPOSTAS = {
  cotacao:
    "Ótimo! Para agilizar sua cotação, me envie 3 informações:\n" +
    "1️⃣ Seu *CPF*\n2️⃣ Seu *CEP*\n3️⃣ A *placa* do veículo (se for seguro auto)\n\n" +
    "Assim que abrirmos, um corretor calcula o valor e te retorna. Se preferir adiantar, cote aqui:\n" +
    "http://gestao.segfy.com/Publico/Segurados/Orcamentos/SolicitarCotacao?e=N4%2BhsohRMBQkt3Y5rAUWTQ%3D%3D",
  app:
    "📲 Baixe o app *MySeg* para acompanhar suas apólices, 2ª via de boleto e mais:\n" +
    "https://myseg.iconeseg.com.br?a=1\n\n" +
    "No cadastro, informe o *código da corretora: 1133* (Quadrata Seguros) para vincular sua conta a nós.",
  corretor:
    "Perfeito! Sua mensagem já ficou registrada com prioridade. Assim que abrirmos " +
    `(${HORARIO}), um corretor da Quadrata Seguros vai te atender. Obrigado pela paciência! 🙏`,
  seg_porto_itau:
    "🚗 *Assistência 24h / Sinistro*\n\n" +
    "*Porto Seguro:*\n• Capitais e RMs: 333 76786 (333 PORTO)\n• Demais regiões: 0800 727 0800\n• WhatsApp: (11) 3003-9303\n\n" +
    "*Itaú Seguro Auto:*\n• Capitais e RMs: 4004-4828" +
    DICA,
  seg_azul:
    "🚗 *Azul Seguros — Assistência 24h / Sinistro*\n• Capitais/Grandes Centros: 4004-3700\n• Demais regiões: 0800 703 0203\n• WhatsApp: (21) 3906-2985" +
    DICA,
  seg_bradesco:
    "🚗 *Bradesco Seguros — Assistência 24h / Sinistro*\n• Capitais e RMs: 4004-2757\n• Demais localidades: 0800 701 2757" +
    DICA,
  seg_suhai:
    "🚗 *Suhai Seguradora — Assistência 24h / Sinistro*\n• Central SP/RJ: 3003-0335\n• WhatsApp: (11) 3003-0335 ou 0800 327 8424" +
    DICA,
  seg_yelum:
    "🚗 *Yelum Seguros — Assistência 24h / Sinistro*\n• Assistência 24h Auto: 0800 701 4120\n• Capitais e RMs: 4004-5423\n• Demais localidades: 0800 709 5423\n• WhatsApp: (11) 3206-1414" +
    DICA,
  seg_allianz:
    "🚗 *Allianz Seguros — Assistência 24h / Sinistro*\n• Assistência 24h: 0800 013 0700\n• Capitais e RMs: 4090-1110\n• Demais localidades: 0800 777 7243\n• WhatsApp: (11) 4090-1444" +
    DICA,
  seg_tokio:
    "🚗 *Tokio Marine — Assistência 24h / Sinistro*\n• Brasil: 0800 31 86546 (0800 31 TOKIO)\n• Mercosul: +55 (11) 3543-5809\n• WhatsApp: (11) 99578-6546" +
    DICA,
  seg_aliro:
    "🚗 *Aliro Seguro — Assistência 24h / Sinistro*\n• Assistência 24h Auto: 0800 770 1318\n• Capitais e RMs: 3003-2127\n• Demais localidades: 0800 220 2127\n• WhatsApp: (11) 3206-1414" +
    DICA,
  seg_outra:
    "Sem problema! Me informe seu *nome completo* e a *placa do veículo* (ou CPF do titular) que localizo sua seguradora e retornamos com urgência assim que abrirmos.",
};

const MENU_TRIGGERS = [
  "menu",
  "oi",
  "ola",
  "olá",
  "opções",
  "opcoes",
  "inicio",
  "início",
  "voltar",
  "começar",
  "comecar",
];

function isMenuTrigger(text) {
  if (!text) return false;
  const t = text.trim().toLowerCase();
  if (MENU_TRIGGERS.some((w) => t === w || t.startsWith(w + " "))) return true;
  return /^(bom dia|boa tarde|boa noite)\b/.test(t);
}

// Retorna true se o menu tratou a mensagem (e a IA não deve ser acionada).
async function handleWhatsAppMenu(msg) {
  // 1. Cliente selecionou um item de lista/botão
  if (msg.interactiveId) {
    if (msg.interactiveId === "sinistro") {
      await sendSeguradorasMenu(msg.from);
      return true;
    }
    const resposta = RESPOSTAS[msg.interactiveId];
    if (resposta) {
      await sendWhatsAppReply(msg.from, resposta);
      return true;
    }
    return false;
  }

  // 2. Saudação / palavra-chave → mostra o menu principal
  if (isMenuTrigger(msg.text)) {
    await sendMainMenu(msg.from, msg.name);
    return true;
  }

  // 3. Texto livre → deixa a MarIAna (IA) responder
  return false;
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

  if (!msg || (!msg.text && !msg.interactiveId)) {
    console.log("Evento ignorado (não é mensagem de texto ou seleção de menu)");
    return;
  }

  console.log(
    `[${msg.platform}] Mensagem de ${msg.name} (${msg.from}): ${
      msg.interactiveId ? "[menu:" + msg.interactiveId + "] " : ""
    }${msg.text}`
  );

  try {
    // Camada de menu interativo (apenas WhatsApp). A MarIAna/IA continua
    // como fallback para mensagens de texto livre.
    if (msg.platform === "whatsapp") {
      const handled = await handleWhatsAppMenu(msg);
      if (handled) return;
    }

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
