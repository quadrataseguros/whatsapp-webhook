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
// Versão da Graph API da Meta. Versões antigas são descontinuadas ~2 anos
// após o lançamento e passam a retornar 404; mantenha em uma versão vigente.
const GRAPH_VERSION = process.env.GRAPH_VERSION || "v21.0";

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
      // Presente quando o cliente chega por um anúncio "Click to WhatsApp"
      // do Instagram/Facebook (contém headline, body, source_url…).
      referral: message.referral || null,
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
    `https://graph.facebook.com/${GRAPH_VERSION}/${WA_PHONE_NUMBER_ID}/messages`,
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
    `https://graph.facebook.com/${GRAPH_VERSION}/${WA_PHONE_NUMBER_ID}/messages`,
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

// Verifica se estamos dentro do horário de atendimento (fuso de São Paulo).
function estaAberto(d = new Date()) {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Sao_Paulo",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(d);
    const get = (t) => parts.find((p) => p.type === t)?.value;
    const isWeekday = ["Mon", "Tue", "Wed", "Thu", "Fri"].includes(get("weekday"));
    const mins = Number(get("hour")) * 60 + Number(get("minute"));
    return isWeekday && mins >= 8 * 60 + 30 && mins < 17 * 60 + 30;
  } catch {
    return true; // em caso de erro, assume aberto (não menciona horário)
  }
}

// Fecho das respostas que dependem de um corretor (humano). Só menciona o
// horário quando estamos FECHADOS — dentro do expediente o cliente não
// precisa saber que existe um horário.
function fechoCorretor(inf = "te retornar com as melhores opções") {
  return estaAberto()
    ? `\n\nUm corretor da *Quadrata Seguros* já vai ${inf}. 🙏`
    : `\n\nAssim que abrirmos (${HORARIO}), um corretor da *Quadrata Seguros* vai ${inf}. 🙏`;
}

// Ids de cotação que recebem o fecho de corretor ao serem enviados.
const COTACAO_IDS = new Set([
  "cot_auto",
  "cot_residencia",
  "cot_vida",
  "cot_saude",
  "cot_consorcio",
  "cot_financiamento",
  "cot_outros",
]);

async function sendMainMenu(to, name) {
  await sendWhatsAppInteractiveList(to, {
    header: "Quadrata Seguros",
    body:
      `Olá${name ? ", " + name : ""}! 👋 Aqui é da *Quadrata Seguros*.\n\n` +
      `Posso te ajudar por aqui mesmo. Toque em *"Ver opções"* e escolha o que você precisa:`,
    footer: "Atendimento automático",
    button: "Ver opções",
    rows: [
      { id: "cotacao", title: "Cotação de seguro", description: "Auto, vida, saúde, residência e mais" },
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

// Submenu de cotação — pergunta qual tipo de seguro o cliente quer contratar.
async function sendCotacaoMenu(to) {
  await sendWhatsAppInteractiveList(to, {
    header: "Cotação de seguro",
    body: "Perfeito! Qual seguro você gostaria de contratar? Toque em *\"Tipos de seguro\"* e escolha:",
    footer: "Quadrata Seguros",
    button: "Tipos de seguro",
    rows: [
      { id: "cot_auto", title: "Automóvel", description: "Carro, moto ou caminhão" },
      { id: "cot_residencia", title: "Residência", description: "Casa ou apartamento" },
      { id: "cot_vida", title: "Vida", description: "Proteção para você e sua família" },
      { id: "cot_saude", title: "Plano de saúde", description: "Individual, familiar ou empresarial" },
      { id: "cot_consorcio", title: "Consórcio", description: "Imóvel, auto ou serviços" },
      { id: "cot_financiamento", title: "Financiamento", description: "Imóvel ou veículo" },
      { id: "cot_outros", title: "Outros", description: "Empresarial, viagem, pet e mais" },
    ],
  });
}

const DICA =
  "\n\n💡 Tenha em mãos o *CPF do titular* ou a *placa*. Se precisar, registramos aqui e um corretor dá sequência.";

const RESPOSTAS = {
  cot_auto:
    "🚗 *Seguro Automóvel*\n\n" +
    "Para agilizar sua cotação, me envie:\n" +
    "1️⃣ Seu *CPF*\n2️⃣ Seu *CEP*\n3️⃣ A *placa* do veículo\n\n" +
    "Se preferir adiantar, cote aqui:\n" +
    "http://gestao.segfy.com/Publico/Segurados/Orcamentos/SolicitarCotacao?e=N4%2BhsohRMBQkt3Y5rAUWTQ%3D%3D",
  cot_residencia:
    "🏠 *Seguro Residencial*\n\n" +
    "Para cotar, me envie:\n" +
    "1️⃣ Seu *CPF*\n2️⃣ O *CEP* do imóvel\n3️⃣ Tipo (*casa* ou *apartamento*) e se é *próprio* ou *alugado*",
  cot_vida:
    "❤️ *Seguro de Vida*\n\n" +
    "Para cotar, me envie:\n" +
    "1️⃣ Seu *nome completo*\n2️⃣ Sua *data de nascimento*\n3️⃣ Se possível, o *valor de cobertura* que deseja",
  cot_saude:
    "🩺 *Plano de Saúde*\n\n" +
    "Para cotar, me envie:\n" +
    "1️⃣ *Quantas pessoas* (vidas) e as *idades*\n2️⃣ Sua *cidade*\n3️⃣ Se é *individual/familiar* ou *empresarial* (com CNPJ)",
  cot_consorcio:
    "🎯 *Consórcio*\n\n" +
    "Para cotar, me envie:\n" +
    "1️⃣ O *bem* desejado (imóvel, automóvel, serviços…)\n2️⃣ O *valor de crédito* aproximado\n3️⃣ Seu *nome completo*",
  cot_financiamento:
    "🏦 *Financiamento*\n\n" +
    "Para simular, me envie:\n" +
    "1️⃣ O *bem* (imóvel ou veículo)\n2️⃣ O *valor* aproximado do bem\n3️⃣ O *valor de entrada* que pretende dar",
  cot_outros:
    "📋 *Outros seguros*\n\n" +
    "Trabalhamos também com seguro *empresarial, viagem, pet, equipamentos* e muito mais. " +
    "Me conte qual seguro você procura e seu *nome completo*, que um corretor prepara a melhor proposta.",
  app:
    "📲 Baixe o app *MySeg* para acompanhar suas apólices, 2ª via de boleto e mais:\n" +
    "https://myseg.iconeseg.com.br?a=1\n\n" +
    "No cadastro, informe o *código da corretora: 1133* (Quadrata Seguros) para vincular sua conta a nós.",
  corretor:
    "Perfeito! Sua mensagem já ficou registrada com prioridade.",
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

// Identifica o assunto a partir do texto livre (ou do anúncio do Instagram),
// para responder direto sem passar pelo menu. Retorna um id de RESPOSTAS,
// "sinistro", ou null se não reconhecer.
function detectAssunto(text) {
  if (!text) return null;
  const t = text.toLowerCase();
  if (/(sinistro|guincho|bat[ei]|acidente|colid|roubo|furto|pane|assist[êe]ncia)/.test(t)) return "sinistro";
  if (/(auto|autom[óo]vel|carro|ve[íi]culo|moto|caminh[ãa]o)/.test(t)) return "cot_auto";
  if (/(sa[úu]de|plano de sa)/.test(t)) return "cot_saude";
  if (/(cons[óo]rcio)/.test(t)) return "cot_consorcio";
  if (/(financ)/.test(t)) return "cot_financiamento";
  if (/\bvida\b/.test(t)) return "cot_vida";
  if (/(resid|casa|apartamento|im[óo]vel|aluguel)/.test(t)) return "cot_residencia";
  if (/(viag|pet|empresarial|equipamento|celular|n[áa]utico|barco|drone|fian[çc]a)/.test(t)) return "cot_outros";
  return null;
}

// Retorna true se o menu tratou a mensagem (e a IA não deve ser acionada).
async function handleWhatsAppMenu(msg) {
  // 1. Cliente selecionou um item de lista/botão
  if (msg.interactiveId) {
    if (msg.interactiveId === "cotacao") {
      await sendCotacaoMenu(msg.from);
      return true;
    }
    if (msg.interactiveId === "sinistro") {
      await sendSeguradorasMenu(msg.from);
      return true;
    }
    if (msg.interactiveId === "corretor") {
      await sendWhatsAppReply(msg.from, RESPOSTAS.corretor + fechoCorretor("te atender"));
      return true;
    }
    const resposta = RESPOSTAS[msg.interactiveId];
    if (resposta) {
      const extra = COTACAO_IDS.has(msg.interactiveId) ? fechoCorretor() : "";
      await sendWhatsAppReply(msg.from, resposta + extra);
      return true;
    }
    return false;
  }

  // 1b. Cliente veio de um anúncio/link do Instagram ou Facebook (referral):
  // pula todo o menu e vai direto ao assunto desejado.
  if (msg.referral) {
    const assuntoAd = detectAssunto(
      [msg.text, msg.referral.headline, msg.referral.body, msg.referral.source_url]
        .filter(Boolean)
        .join(" ")
    );
    const ola = "Olá! 👋 Que bom falar com você. Aqui é da *Quadrata Seguros*.\n\n";
    if (assuntoAd === "sinistro") {
      await sendSeguradorasMenu(msg.from);
      return true;
    }
    if (assuntoAd) {
      await sendWhatsAppReply(msg.from, ola + RESPOSTAS[assuntoAd] + fechoCorretor());
      return true;
    }
    await sendCotacaoMenu(msg.from);
    return true;
  }

  // 2. Saudação / palavra-chave → mostra o menu principal
  if (isMenuTrigger(msg.text)) {
    await sendMainMenu(msg.from, msg.name);
    return true;
  }

  // 3. Texto livre → tenta identificar o assunto e responder direto (sem
  // repetir o menu, evitando o efeito de "looping").
  const assunto = detectAssunto(msg.text);
  if (assunto === "sinistro") {
    await sendSeguradorasMenu(msg.from);
    return true;
  }
  if (assunto) {
    await sendWhatsAppReply(msg.from, RESPOSTAS[assunto] + fechoCorretor());
    return true;
  }

  // 4. Não identificado → deixa a MarIAna (IA) tentar; se ela cair, o
  // fallback conclusivo no handler principal cuida da resposta.
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
      let reply = "";
      try {
        reply = await runLangflow(msg.text, msg.from);
      } catch (aiErr) {
        // IA fora do ar: não repassamos o erro — abaixo montamos uma
        // resposta conclusiva (direta ao assunto quando possível).
        console.error("  IA (Langflow) indisponível — usando resposta direta");
      }
      if (reply) {
        console.log(`Resposta MarIAna: ${reply}`);
        if (msg.platform === "whatsapp") {
          await sendWhatsAppReply(msg.from, reply);
        } else {
          await sendInstagramReply(msg.from, reply);
        }
      } else {
        // Sem resposta da IA. Se conseguirmos identificar o assunto,
        // respondemos direto; senão, uma mensagem conclusiva (sem repetir
        // o menu, evitando o "looping").
        const assunto = detectAssunto(msg.text);
        let texto;
        if (assunto && assunto !== "sinistro" && RESPOSTAS[assunto]) {
          texto = RESPOSTAS[assunto] + fechoCorretor();
        } else {
          texto =
            "✅ Recebi sua mensagem e já registrei sua solicitação." +
            fechoCorretor() +
            (msg.platform === "whatsapp"
              ? "\n\nSe quiser ver todas as opções, é só digitar *menu*. 🙂"
              : "");
        }
        if (msg.platform === "whatsapp") {
          await sendWhatsAppReply(msg.from, texto);
        } else {
          await sendInstagramReply(msg.from, texto);
        }
      }
    } else if (MAKE_WEBHOOK_URL) {
      await axios.post(MAKE_WEBHOOK_URL, req.body);
      console.log("Payload encaminhado para Make");
    } else {
      console.log("Nenhum destino configurado (LANGFLOW_FLOW_ID ou MAKE_WEBHOOK_URL)");
    }
  } catch (err) {
    console.error("Erro ao processar mensagem:", err.message);
    console.error("  URL que falhou:", err.config?.url || "(desconhecida)");
    console.error(
      "  Status:",
      err.response?.status ?? "(sem resposta)",
      "| Resposta:",
      JSON.stringify(err.response?.data ?? "")
    );
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
