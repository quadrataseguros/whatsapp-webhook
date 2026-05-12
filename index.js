const express = require("express");
const axios = require("axios");
const app = express();
app.use(express.json());

// ── Configuration ──────────────────────────────────────────────────────────────
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "quadrata123";
const LANGFLOW_URL = process.env.LANGFLOW_URL || "http://localhost:7860";
const LANGFLOW_API_KEY = process.env.LANGFLOW_API_KEY || "";
const WA_PHONE_NUMBER_ID = process.env.WA_PHONE_NUMBER_ID || "";
const WA_ACCESS_TOKEN = process.env.WA_ACCESS_TOKEN || "";
const MAKE_WEBHOOK_URL = process.env.MAKE_WEBHOOK_URL || "";
const PORT = process.env.PORT || 3000;

// ── Domain Index ────────────────────────────────────────────────────────────────
// Each domain points to its own Langflow flow (isolated knowledge base).
// Falls back to LANGFLOW_FLOW_ID if the domain-specific one is not set.
const DOMAIN_INDEX = {
  saude: {
    id: "saude",
    title: "Seguro Saúde",
    description: "Planos individuais, familiar e empresarial",
    flowId: process.env.LANGFLOW_FLOW_ID_SAUDE || process.env.LANGFLOW_FLOW_ID || "",
  },
  odonto: {
    id: "odonto",
    title: "Seguro Odontológico",
    description: "Cobertura dental para você e sua família",
    flowId: process.env.LANGFLOW_FLOW_ID_ODONTO || process.env.LANGFLOW_FLOW_ID || "",
  },
  auto: {
    id: "auto",
    title: "Seguro Auto",
    description: "Proteção completa para seu veículo",
    flowId: process.env.LANGFLOW_FLOW_ID_AUTO || process.env.LANGFLOW_FLOW_ID || "",
  },
  vida: {
    id: "vida",
    title: "Seguro de Vida",
    description: "Proteção financeira para sua família",
    flowId: process.env.LANGFLOW_FLOW_ID_VIDA || process.env.LANGFLOW_FLOW_ID || "",
  },
};

// ── Session State ───────────────────────────────────────────────────────────────
// Tracks the selected domain per user. Resets after SESSION_TTL_MS of inactivity.
const userSessions = new Map();
const SESSION_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours

function getSession(phone) {
  const session = userSessions.get(phone);
  if (!session) return null;
  if (Date.now() - session.lastActivity > SESSION_TTL_MS) {
    userSessions.delete(phone);
    return null;
  }
  session.lastActivity = Date.now();
  return session;
}

function setSession(phone, domainId) {
  const domain = DOMAIN_INDEX[domainId];
  if (!domain) return null;
  const session = { domain: domainId, flowId: domain.flowId, lastActivity: Date.now() };
  userSessions.set(phone, session);
  return session;
}

// Words that reset the conversation and show the domain menu again
const MENU_TRIGGERS = [
  "menu", "inicio", "início", "voltar", "oi", "olá", "ola",
  "opa", "bom dia", "boa tarde", "boa noite", "hi", "hello",
];

function isMenuTrigger(text) {
  const lower = text.toLowerCase().trim();
  return MENU_TRIGGERS.some((t) => lower.startsWith(t));
}

// ── WhatsApp Cloud API ──────────────────────────────────────────────────────────
async function sendWhatsApp(to, payload) {
  if (!WA_PHONE_NUMBER_ID || !WA_ACCESS_TOKEN) return;
  await axios.post(
    `https://graph.facebook.com/v19.0/${WA_PHONE_NUMBER_ID}/messages`,
    { messaging_product: "whatsapp", ...payload },
    {
      headers: {
        Authorization: `Bearer ${WA_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  );
}

async function sendTextReply(to, text) {
  await sendWhatsApp(to, { to, type: "text", text: { body: text } });
}

// Sends the interactive list menu — exactly like Porto Seguro's "Escolha" button
async function sendDomainMenu(to, name) {
  const greeting = name ? `Olá, ${name}! ` : "Olá! ";
  const rows = Object.values(DOMAIN_INDEX).map((d) => ({
    id: d.id,
    title: d.title,
    description: d.description,
  }));

  await sendWhatsApp(to, {
    to,
    type: "interactive",
    interactive: {
      type: "list",
      header: { type: "text", text: "Quadrata Seguros" },
      body: {
        text: `${greeting}Selecione o produto desejado para que eu possa te ajudar melhor:`,
      },
      footer: { text: "Toque para selecionar uma opção" },
      action: {
        button: "Escolha",
        sections: [{ title: "Nossos Produtos", rows }],
      },
    },
  });
}

// ── Langflow ────────────────────────────────────────────────────────────────────
async function runLangflow(inputText, sessionId, flowId) {
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

// ── Message Extraction ──────────────────────────────────────────────────────────
function extractMessage(body) {
  try {
    const entry = body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const message = value?.messages?.[0];
    if (!message) return null;

    let text = "";
    let listReplyId = null;

    if (message.type === "text") {
      text = message.text?.body || "";
    } else if (message.type === "interactive") {
      const ia = message.interactive;
      if (ia?.type === "list_reply") {
        listReplyId = ia.list_reply.id;
        text = ia.list_reply.title;
      } else if (ia?.type === "button_reply") {
        listReplyId = ia.button_reply.id;
        text = ia.button_reply.title;
      }
    }

    return {
      from: message.from,
      messageId: message.id,
      type: message.type,
      text,
      listReplyId,
      name: value.contacts?.[0]?.profile?.name || "",
    };
  } catch {
    return null;
  }
}

// ── Webhook Routes ──────────────────────────────────────────────────────────────
app.get("/webhook", (req, res) => {
  if (req.query["hub.verify_token"] === VERIFY_TOKEN) {
    res.send(req.query["hub.challenge"]);
  } else {
    res.sendStatus(403);
  }
});

app.get("/health", (_req, res) => {
  const domains = Object.values(DOMAIN_INDEX).map((d) => ({
    id: d.id,
    title: d.title,
    configured: !!d.flowId,
  }));
  res.json({
    status: "ok",
    langflow: LANGFLOW_URL,
    activeSessions: userSessions.size,
    domains,
  });
});

app.post("/webhook", async (req, res) => {
  res.sendStatus(200); // Acknowledge Meta immediately

  const msg = extractMessage(req.body);
  if (!msg || (!msg.text && !msg.listReplyId)) {
    console.log("Evento ignorado");
    return;
  }

  console.log(`[${msg.from}] ${msg.name || "—"}: ${msg.text}`);

  try {
    // ── 1. User selected a product from the interactive list ──────────────────
    if (msg.listReplyId && DOMAIN_INDEX[msg.listReplyId]) {
      const domain = DOMAIN_INDEX[msg.listReplyId];
      const session = setSession(msg.from, msg.listReplyId);
      console.log(`[${msg.from}] Domínio selecionado: ${domain.title}`);

      if (session.flowId) {
        // Session ID is scoped per user+domain so each domain has its own memory
        const sessionId = `${msg.from}_${msg.listReplyId}`;
        const reply = await runLangflow(
          `O cliente selecionou ${domain.title}. Apresente-se brevemente como especialista neste produto.`,
          sessionId,
          session.flowId
        );
        if (reply) await sendTextReply(msg.from, reply);
        else await sendTextReply(msg.from, `Ótimo! Você selecionou *${domain.title}*. Como posso te ajudar?`);
      } else {
        await sendTextReply(msg.from, `Ótimo! Você selecionou *${domain.title}*. Como posso te ajudar?`);
      }
      return;
    }

    // ── 2. User typed a greeting/reset word → show the domain menu ───────────
    if (msg.type === "text" && isMenuTrigger(msg.text)) {
      userSessions.delete(msg.from); // clear domain so user picks fresh
      await sendDomainMenu(msg.from, msg.name);
      return;
    }

    // ── 3. User has an active domain session → route to that domain's flow ────
    const session = getSession(msg.from);
    if (session) {
      if (session.flowId) {
        const sessionId = `${msg.from}_${session.domain}`;
        const reply = await runLangflow(msg.text, sessionId, session.flowId);
        if (reply) {
          console.log(`[${msg.from}/${session.domain}] → ${reply.substring(0, 80)}…`);
          await sendTextReply(msg.from, reply);
        }
      } else if (MAKE_WEBHOOK_URL) {
        await axios.post(MAKE_WEBHOOK_URL, { ...req.body, domain: session.domain });
        console.log(`Payload encaminhado para Make (domínio: ${session.domain})`);
      }
      return;
    }

    // ── 4. No session and no trigger → show the domain menu ──────────────────
    await sendDomainMenu(msg.from, msg.name);
  } catch (err) {
    console.error(`[${msg.from}] Erro:`, err.message);
    await sendTextReply(
      msg.from,
      "Desculpe, tive um problema técnico. Por favor, tente novamente em instantes."
    ).catch(() => {});
  }
});

app.listen(PORT, () => {
  const configured = Object.values(DOMAIN_INDEX)
    .filter((d) => d.flowId)
    .map((d) => d.title);
  console.log(`Servidor MarIAna rodando na porta ${PORT}`);
  console.log(
    `Domínios ativos: ${configured.length ? configured.join(", ") : "nenhum — configure LANGFLOW_FLOW_ID_SAUDE etc."}`
  );
});
