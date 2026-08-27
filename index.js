require("dotenv").config();
const express = require("express");
const axios = require("axios");
const Anthropic = require("@anthropic-ai/sdk");
const path = require("path");
const db = require("./db");
const ADMIN_HTML = require("./admin-page");

const app = express();
app.use(express.json());

// Versão do servidor (para confirmar que o código novo está rodando)
const SERVER_VERSION = "v5-full-features-2026-05-14";
app.get("/api/version", (_req, res) => res.json({ version: SERVER_VERSION }));

// Admin panel servido direto da memória (sem cache, sempre atualizado)
app.get(["/admin", "/admin.html", "/gestor", "/gestor.html"], (_req, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.type("html").send(ADMIN_HTML);
});

app.use(express.static(path.join(__dirname, "public")));

const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "quadrata123";
// IA da MarIAna — agora direto pela API da Anthropic (Claude), sem Langflow.
// A chave é lida automaticamente de ANTHROPIC_API_KEY pelo SDK.
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";
const MARIANA_MODEL = process.env.MARIANA_MODEL || "claude-haiku-4-5";
const anthropic = ANTHROPIC_API_KEY ? new Anthropic() : null;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const WA_PHONE_NUMBER_ID = process.env.WA_PHONE_NUMBER_ID || "";
const WA_ACCESS_TOKEN = process.env.WA_ACCESS_TOKEN || "";
const IG_ACCESS_TOKEN = process.env.IG_ACCESS_TOKEN || "";
const IG_USER_ID = process.env.IG_USER_ID || "";
const MAKE_WEBHOOK_URL = process.env.MAKE_WEBHOOK_URL || "";
// Espelho das conversas no Telegram. O token do bot e o id do chat/grupo são
// lidos do ambiente (Render) — nunca ficam no código. Se ambos estiverem
// vazios, o espelho simplesmente não é enviado.
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || "";
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
    mode: anthropic ? "mariana" : MAKE_WEBHOOK_URL ? "make" : "menu",
    modelo: anthropic ? MARIANA_MODEL : null,
    // Diagnóstico do espelho de conversas (sem expor tokens/URLs). Se vier
    // "NAO configurado", falta definir as variáveis no ambiente (Render).
    espelhoTelegram:
      TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID
        ? "configurado"
        : TELEGRAM_BOT_TOKEN
        ? "falta TELEGRAM_CHAT_ID"
        : TELEGRAM_CHAT_ID
        ? "falta TELEGRAM_BOT_TOKEN"
        : "NAO configurado",
    espelhoMake: MAKE_WEBHOOK_URL ? "configurado" : "NAO configurado",
  });
});

// Diagnóstico da IA — abre no browser para checar se a MarIAna (Claude) responde
app.get("/mariana-status", async (_req, res) => {
  if (!anthropic) {
    return res
      .status(503)
      .json({ ia: "desativada", motivo: "ANTHROPIC_API_KEY não configurada" });
  }
  try {
    const r = await anthropic.messages.create({
      model: MARIANA_MODEL,
      max_tokens: 16,
      messages: [{ role: "user", content: "Responda apenas: ok" }],
    });
    const texto = r.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
    res.json({ ia: "ok", modelo: MARIANA_MODEL, resposta: texto });
  } catch (err) {
    res.status(502).json({ ia: "erro", erro: err.message, status: err.status });
  }
});

// ─── Página pública "Fale com a MarIAna" ─────────────────────────────────────
// É o link da bio do Instagram (/fale). Leva o cliente direto para a conversa
// no WhatsApp, onde a MarIAna atende. O número é o (11) 98678-0000; para
// trocar sem mexer no código, basta definir WHATSAPP_NUMERO no ambiente.
const NUMERO_PADRAO = "5511986780000";

// Aceita o número escrito de qualquer jeito — (11) 98678-0000, 11986780000,
// +55 11 98678-0000 — e devolve só os dígitos com o DDI 55 na frente.
function normalizarNumero(valor) {
  const d = String(valor || "").replace(/\D/g, "");
  if (!d) return "";
  if (d.length <= 11) return `55${d}`;
  return d;
}

const WHATSAPP_NUMERO = normalizarNumero(process.env.WHATSAPP_NUMERO) || NUMERO_PADRAO;

// Mensagem já digitada ao abrir o WhatsApp. "Oi" (padrão) abre o menu
// principal; com ?assunto=auto etc. a MarIAna já responde sobre o tema.
const FALE_ASSUNTOS = {
  auto: "Oi! Vim pelo Instagram e quero cotar um seguro de automóvel.",
  saude: "Oi! Vim pelo Instagram e quero cotar um plano de saúde.",
  odonto: "Oi! Vim pelo Instagram e quero saber do plano odontológico.",
  vida: "Oi! Vim pelo Instagram e quero cotar um seguro de vida.",
  residencia: "Oi! Vim pelo Instagram e quero cotar um seguro residencial.",
  consorcio: "Oi! Vim pelo Instagram e quero saber sobre consórcio.",
  financiamento: "Oi! Vim pelo Instagram e quero saber sobre financiamento.",
  cartao: "Oi! Vim pelo Instagram e quero saber do Cartão Porto Bank.",
  sinistro: "Oi! Preciso de ajuda com um sinistro/guincho.",
};

// GET /fale → abre a conversa no WhatsApp com a MarIAna
app.get(["/fale", "/fale.html", "/contato"], (req, res) => {
  const assunto = String(req.query.assunto || "").toLowerCase();
  const texto = FALE_ASSUNTOS[assunto] || "Oi";
  res.setHeader("Cache-Control", "no-store");
  res.redirect(302, `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(texto)}`);
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
  // Espelha no Telegram o que a MarIAna respondeu.
  espelharTelegram(`🤖 MarIAna → ${to}\n${text}`);
}

// Envia uma cópia da conversa para o Telegram (monitoramento pelo time).
// "Fire-and-forget": trata o próprio erro e nunca derruba o atendimento. Se o
// token ou o chat não estiverem configurados, não faz nada.
async function espelharTelegram(text) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return;
  try {
    // Sem parse_mode: enviamos texto puro para não quebrar quando a mensagem
    // tiver caracteres especiais (*, _, etc.), comuns nas conversas reais.
    await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        chat_id: TELEGRAM_CHAT_ID,
        text,
        disable_web_page_preview: true,
      }
    );
  } catch (e) {
    console.error(
      "Falha ao espelhar no Telegram:",
      e.response?.data?.description || e.message
    );
  }
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
// precisa saber que existe um horário. Varia um pouco a frase (aberto) para
// não soar repetitivo quando o cliente recebe vários fechos seguidos.
const FECHOS_ABERTO = [
  "Já passo para um corretor da *Quadrata Seguros* {inf}. 😉",
  "Um corretor da *Quadrata Seguros* assume daqui e vai {inf}. 🙌",
  "Deixo tudo encaminhado para um corretor da *Quadrata Seguros* {inf}. 🙏",
];
let _fechoIdx = 0;

function fechoCorretor(inf = "te retornar com as melhores opções") {
  if (!estaAberto()) {
    return `\n\nAssim que abrirmos (${HORARIO}), um corretor da *Quadrata Seguros* vai ${inf}. 🙏`;
  }
  const frase = FECHOS_ABERTO[_fechoIdx % FECHOS_ABERTO.length].replace("{inf}", inf);
  _fechoIdx++;
  return `\n\n${frase}`;
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
      `Olá${name ? ", " + name : ""}! 👋 Eu sou a *MarIAna*, assistente virtual da *Quadrata Seguros*.\n\n` +
      `Resolvo bastante coisa por aqui na hora e, quando precisar, chamo um corretor pra te atender. Toque em *"Ver opções"* e me diz o que você precisa:`,
    footer: "MarIAna • Atendimento digital",
    button: "Ver opções",
    rows: [
      { id: "cotacao", title: "Cotação de seguro", description: "Auto, vida, saúde, residência e mais" },
      { id: "cartao", title: "Cartão Porto Bank", description: "Pré-aprovado • 12 meses sem anuidade" },
      { id: "sinistro", title: "Sinistro / Guincho", description: "Assistência 24h" },
      { id: "app", title: "Baixar o app", description: "MySeg • código 1133" },
      { id: "corretor", title: "Falar com corretor", description: "Deixe o seu recado" },
    ],
  });
}

async function sendSeguradorasMenu(to) {
  await sendWhatsAppInteractiveList(to, {
    header: "Sinistro / Assistência 24h",
    body:
      "Sinto muito pelo ocorrido. 🙏 Fica tranquilo(a), vou te ajudar a resolver o mais rápido possível.\n\n" +
      "Para eu te passar o contato certo, qual é a sua seguradora?",
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
    body: "Perfeito, vamos cuidar disso! 🙂 Qual seguro você tem em mente? Toque em *\"Tipos de seguro\"* e escolha:",
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
      { id: "cartao", title: "Cartão Porto Bank", description: "Sem anuidade • pré-aprovado" },
    ],
  });
}

const DICA =
  "\n\n💡 Tenha em mãos o *CPF do titular* ou a *placa*. Se precisar, registramos aqui e um corretor dá sequência.";

const RESPOSTAS = {
  cot_auto:
    "🚗 *Seguro Automóvel* — ótima escolha!\n\n" +
    "Para eu já adiantar sua cotação, me manda os dados abaixo (pode ser tudo junto, do jeito que for mais fácil):\n" +
    "• Seu *CPF*\n• Seu *CEP*\n• A *placa* do veículo\n\n" +
    "Se preferir, dá pra cotar você mesmo por aqui:\n" +
    "http://gestao.segfy.com/Publico/Segurados/Orcamentos/SolicitarCotacao?e=N4%2BhsohRMBQkt3Y5rAUWTQ%3D%3D",
  cot_residencia:
    "🏠 *Seguro Residencial* — vamos proteger o seu lar!\n\n" +
    "Para começar, me manda:\n" +
    "• Seu *CPF*\n• O *CEP* do imóvel\n• Se é *casa* ou *apartamento*, e *próprio* ou *alugado*",
  cot_vida:
    "❤️ *Seguro de Vida* — cuidar de quem você ama é um grande gesto.\n\n" +
    "Para começar, me diz:\n" +
    "• Seu *nome completo*\n• Sua *data de nascimento*\n\n" +
    "Com isso já consigo dar o primeiro passo. 🙂",
  cot_saude:
    "🩺 *Plano de Saúde*\n\n" +
    "Para eu encontrar as melhores opções, me conta:\n" +
    "• *Quantas pessoas* vão usar e as *idades*\n• Sua *cidade*\n• Se é *individual/familiar* ou *empresarial* (com CNPJ)",
  cot_consorcio:
    "🎯 *Consórcio* — um jeito planejado de conquistar o que você quer.\n\n" +
    "Me conta pra eu começar:\n" +
    "• O *bem* desejado (imóvel, automóvel, serviços…)\n• O *valor* aproximado que você tem em mente",
  cot_financiamento:
    "🏦 *Financiamento*\n\n" +
    "Para eu preparar sua simulação, me diz:\n" +
    "• O *bem* (imóvel ou veículo)\n• O *valor* aproximado do bem\n• Quanto pretende dar de *entrada*",
  cot_outros:
    "📋 *Outros seguros*\n\n" +
    "Trabalhamos também com *empresarial, viagem, pet, equipamentos* e muito mais. 🙂\n" +
    "Me conta qual seguro você procura e seu *nome completo*, que já preparo a melhor proposta pra você.",
  cartao:
    "💳 *Cartão Porto Bank — Pré-aprovado!*\n\n" +
    "Um cartão com benefícios de verdade:\n" +
    "• *12 meses de anuidade grátis*\n" +
    "• Descontos nos seus seguros Porto: Auto até *15%*, Residencial *10% + 5% cashback*, Vida até *10%*\n" +
    "• *IOF Zero* em compras internacionais (o IOF volta como cashback)\n" +
    "• *Shell Box*, *ConectCar* com tags grátis, *salas VIP* e mais\n\n" +
    "Quer garantir o seu? Me envie o seu *CPF* que eu preparo sua proposta e um corretor te manda o *link personalizado* para você assinar. 🚀\n\n" +
    "_Oferta sujeita a análise e condições do Porto Bank._",
  app:
    "📲 Baixe o app *MySeg* para acompanhar suas apólices, 2ª via de boleto e mais:\n" +
    "https://myseg.iconeseg.com.br?a=1\n\n" +
    "No cadastro, informe o *código da corretora: 1133* (Quadrata Seguros) para vincular sua conta a nós.",
  corretor:
    "Combinado! Já registrei seu recado com prioridade. 😊 Pode adiantar aqui o que você precisa, que assim o corretor já chega com a solução na mão.",
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
  if (/(cart[ãa]o|porto bank)/.test(t)) return "cartao";
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
      lembrarTroca(msg.from, msg.text || "Cotação de seguro",
        "Perfeito! Te mostrei os tipos de seguro para você escolher qual quer cotar.");
      return true;
    }
    if (msg.interactiveId === "sinistro") {
      await sendSeguradorasMenu(msg.from);
      marcarSinistroTratado(msg.from);
      lembrarTroca(msg.from, msg.text || "Sinistro / Guincho",
        "Sinto muito pelo ocorrido. Te mostrei a lista de seguradoras para você me dizer qual é a sua.");
      return true;
    }
    if (msg.interactiveId === "corretor") {
      const t = RESPOSTAS.corretor + fechoCorretor("te atender");
      await sendWhatsAppReply(msg.from, t);
      lembrarTroca(msg.from, msg.text || "Falar com corretor", t);
      return true;
    }
    const resposta = RESPOSTAS[msg.interactiveId];
    if (resposta) {
      const extra = COTACAO_IDS.has(msg.interactiveId) ? fechoCorretor() : "";
      const t = resposta + extra;
      await sendWhatsAppReply(msg.from, t);
      // Ao escolher a seguradora, marcamos o sinistro como tratado (já demos os
      // telefones), para o fluxo não repetir a pergunta depois.
      if (msg.interactiveId.startsWith("seg_")) marcarSinistroTratado(msg.from);
      lembrarTroca(msg.from, msg.text || msg.interactiveId, t);
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
    const ola = "Olá! 👋 Eu sou a *MarIAna*, assistente virtual da *Quadrata Seguros*. Que bom falar com você!\n\n";
    if (assuntoAd === "sinistro") {
      await sendSeguradorasMenu(msg.from);
      marcarSinistroTratado(msg.from);
      lembrarTroca(msg.from, msg.text || "(veio de um anúncio sobre sinistro)",
        "Sinto muito pelo ocorrido. Te mostrei a lista de seguradoras para você me dizer qual é a sua.");
      return true;
    }
    if (assuntoAd) {
      const t = ola + RESPOSTAS[assuntoAd] + fechoCorretor();
      await sendWhatsAppReply(msg.from, t);
      lembrarTroca(msg.from, msg.text || "(veio de um anúncio)", t);
      return true;
    }
    await sendCotacaoMenu(msg.from);
    lembrarTroca(msg.from, msg.text || "(veio de um anúncio)",
      "Te dei as boas-vindas e mostrei os tipos de seguro para você escolher qual quer cotar.");
    return true;
  }

  // 2. Saudação / palavra-chave → mostra o menu principal
  if (isMenuTrigger(msg.text)) {
    await sendMainMenu(msg.from, msg.name);
    lembrarTroca(msg.from, msg.text,
      "Oi! Sou a MarIAna, da Quadrata Seguros. Te mostrei o menu com as opções: cotação, sinistro/guincho, baixar o app e falar com corretor.");
    return true;
  }

  // 3. Sinistro/emergência (por texto livre): na PRIMEIRA vez, mandamos o menu
  // de seguradoras — ali estão os telefones da assistência 24h (urgentes e que
  // a IA não tem na memória). Se o sinistro já foi tratado nesta conversa, NÃO
  // repetimos a pergunta: deixamos a MarIAna conduzir com o contexto que já tem.
  const assunto = detectAssunto(msg.text);
  if (assunto === "sinistro" && !sinistroJaTratado(msg.from)) {
    await sendSeguradorasMenu(msg.from);
    marcarSinistroTratado(msg.from);
    lembrarTroca(msg.from, msg.text,
      "Sinto muito pelo ocorrido. Te mostrei a lista de seguradoras para você me dizer qual é a sua.");
    return true;
  }

  // 4. Demais textos livres → deixamos a MarIAna (IA) conduzir a conversa: ela
  // entende pedidos com nuance (ex.: "consórcio de automóvel de 100 mil") que o
  // atalho por palavra-chave interpretaria errado. O atalho vira PLANO B, usado
  // só quando a IA está desativada, para ainda assim dar uma resposta útil.
  if (!anthropic && assunto) {
    const t = RESPOSTAS[assunto] + fechoCorretor();
    await sendWhatsAppReply(msg.from, t);
    lembrarTroca(msg.from, msg.text, t);
    return true;
  }

  // 5. Sem IA e sem assunto reconhecido → o fallback conclusivo no handler
  // principal cuida da resposta.
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
  // Espelha no Telegram o que a MarIAna respondeu (Instagram).
  espelharTelegram(`🤖 MarIAna → ${to} (Instagram)\n${text}`);
}

// ---------------------------------------------------------------------------
// MarIAna — IA de atendimento via API da Anthropic (Claude).
// Substitui o antigo servidor Langflow: sem servidor pesado ligado 24h, paga-se
// só por mensagem processada. O menu interativo continua como primeira camada.
// ---------------------------------------------------------------------------

const MARIANA_SYSTEM = `Você é a MarIAna, atendente virtual da *Quadrata Seguros*, uma corretora de seguros brasileira. Você atende clientes pelo WhatsApp.

Quem você é:
- Seu nome é MarIAna. Use-o para dar um toque pessoal: no início de uma conversa nova, apresente-se brevemente ("Oi, aqui é a MarIAna, da Quadrata Seguros 🙂"). Deixe natural que você é uma assistente virtual (digital), sem esconder e sem repetir isso o tempo todo.
- Simpática, atenciosa e prestativa, como uma boa atendente que gosta de ajudar. Fale como uma pessoa de verdade, não como um robô ou um formulário.
- Você conhece de seguros e transmite segurança, mas sem enrolação.

Tom e estilo:
- Escreva em português do Brasil, de forma calorosa, educada e objetiva.
- Respostas CURTAS (é WhatsApp): normalmente de 2 a 4 linhas. Evite textos longos e listas grandes.
- Use no máximo 1 emoji por mensagem, e nem sempre — só quando somar algo.
- Chame o cliente pelo primeiro nome quando souber, mas sem exagerar (não em toda frase).
- Para negrito, use *asteriscos simples* (padrão do WhatsApp), nunca **duplos**.

Como conduzir a conversa:
- Uma pergunta de cada vez. Ao iniciar uma cotação, não despeje todos os dados de uma vez: peça primeiro o principal e vá conduzindo o cliente, passo a passo.
- Sempre deixe claro qual é o próximo passo. Termine, quando fizer sentido, com uma pergunta ou um convite para o cliente continuar.
- Reconheça o que o cliente disse antes de pedir algo novo (ex.: "Ótimo, seguro de carro então!").
- Não repita a mesma frase pronta em toda resposta. Só mencione que "um corretor vai retornar" quando o assunto realmente depende de um humano (valores, fechamento) — e diga isso de formas variadas, não sempre igual.

O que você faz:
- Ajuda com cotação de seguros (auto, residência, vida, saúde), consórcio, financiamento e outros; orientações sobre sinistro/assistência 24h; e dúvidas gerais.
- Preste atenção ao que o cliente realmente quer. Consórcio e financiamento NÃO são seguros — são formas de conquistar um bem (imóvel, carro). Se o cliente disser "consórcio de automóvel", é consórcio, não seguro de carro. Na dúvida, pergunte com gentileza para confirmar.
- Dados essenciais por tipo (peça aos poucos): auto: CPF, CEP e placa; residência: CPF e CEP do imóvel; vida: nome completo e data de nascimento; consórcio: qual bem e valor aproximado; financiamento: qual bem, valor do bem e entrada.

Regras importantes:
- NUNCA invente preços, valores de apólice, coberturas específicas ou números de protocolo. Você não fecha vendas nem informa valores — quem faz isso é um corretor humano.
- Quando o cliente pedir algo que dependa de um corretor (valores, contratação, negociação), colete as informações e avise, de forma natural, que um corretor da Quadrata Seguros dá sequência.
- Sinistro/emergência (batida, roubo, pane): acolha primeiro ("Sinto muito pelo ocorrido"). Se o histórico da conversa já mostra que passamos o telefone da assistência 24h da seguradora, NÃO pergunte a seguradora de novo — oriente os próximos passos: acionar a seguradora por aquele telefone, ter em mãos o CPF do titular ou a placa, e registrar aqui para um corretor acompanhar. NUNCA invente números de telefone: use somente os que já apareceram na conversa.
- Se perguntarem sobre assunto fora de seguros, redirecione gentilmente para como você pode ajudar com seguros.
- Se o cliente quiser ver todas as opções, diga que ele pode digitar *menu*.

Informações úteis:
- Horário de atendimento humano: segunda a sexta, das 8h30 às 17h30.
- App do cliente: *MySeg* (2ª via de boleto, apólices). No cadastro, informar o código da corretora *1133* (Quadrata Seguros).
- Link de cotação online (ofereça quando fizer sentido): http://gestao.segfy.com/Publico/Segurados/Orcamentos/SolicitarCotacao?e=N4%2BhsohRMBQkt3Y5rAUWTQ%3D%3D

Cartão de Crédito Porto Bank (campanha atual — muitos clientes estão PRÉ-APROVADOS):
- Benefícios: 12 meses de anuidade grátis (depois, isenção 100% por gastos: Gold/Platinum a partir de R$3.500/mês, Ultra a partir de R$10.000/mês); até 4 cartões adicionais sem anuidade; até 3,5 pontos/dólar com acesso a salas VIP; IOF Zero em compras internacionais (o IOF volta como cashback); descontos nos seguros Porto com o cartão ativo (Auto até 15%, Residencial 10% + 5% de cashback, Vida até 10%); Shell Box com até R$0,15/litro na rede Shell; ConectCar com até 4 tags grátis, sem mensalidade; controle total pelo super app.
- Como funciona a adesão: o cliente aceita a oferta enviando o CPF. Com os dados, a Quadrata monta um LINK PERSONALIZADO para o cliente assinar a proposta, que segue para análise da Porto Bank. Você (MarIAna) NÃO gera nem envia o link — quem prepara e envia é um corretor da Quadrata.
- Fluxo quando o cliente quiser o cartão: explique os principais benefícios de forma breve e peça o CPF (confirme o nome, se ainda não souber). Quando ele enviar o CPF, agradeça, confirme os dados e avise que um corretor vai preparar o link personalizado e enviar em seguida para ele assinar, seguindo depois para análise da Porto Bank.
- Se o cliente enviar SÓ um CPF, sem outro contexto, provavelmente está aceitando esta oferta do cartão — confirme gentilmente ("É para garantir seu Cartão Porto Bank, certo?") antes de seguir.
- NUNCA prometa aprovação (a análise é da Porto Bank) nem invente taxas/limites além dos listados; detalhes finais são confirmados na proposta.`;

// Memória de conversa por cliente (em memória do processo). Mantém o contexto
// das últimas trocas, como fazia a "session" do Langflow. Some após um período
// de inatividade — atendimento novo recomeça do zero.
const conversas = new Map();
const CONVERSA_TTL_MS = 30 * 60 * 1000; // 30 min de inatividade
const MAX_MENSAGENS = 12; // ~6 trocas (user + assistant)

function getHistorico(from) {
  const c = conversas.get(from);
  if (!c) return [];
  if (Date.now() - c.updated > CONVERSA_TTL_MS) {
    conversas.delete(from);
    return [];
  }
  return c.msgs;
}

function pushHistorico(from, role, content) {
  const c = conversas.get(from) || { msgs: [] };
  c.msgs.push({ role, content });
  if (c.msgs.length > MAX_MENSAGENS) c.msgs = c.msgs.slice(-MAX_MENSAGENS);
  c.updated = Date.now();
  conversas.set(from, c);
}

// Registra no histórico da IA uma troca que foi tratada pelo MENU (seleção,
// sinistro, cotação…). Assim a MarIAna "enxerga" o que o menu respondeu e
// mantém o fio da conversa, em vez de responder como se nada tivesse ocorrido.
// Sempre grava o par (cliente + resposta) para o histórico continuar alternando.
function lembrarTroca(from, userText, assistantText) {
  pushHistorico(from, "user", userText || "(seleção no menu)");
  pushHistorico(from, "assistant", assistantText || "(enviei uma resposta pelo menu)");
}

// Marca / consulta se o fluxo de sinistro (menu de seguradoras) já foi mostrado
// nesta conversa, para não repetir a pergunta da seguradora a cada mensagem.
function marcarSinistroTratado(from) {
  const c = conversas.get(from) || { msgs: [] };
  c.sinistroTratado = true;
  c.updated = Date.now();
  conversas.set(from, c);
}
function sinistroJaTratado(from) {
  const c = conversas.get(from);
  if (!c || Date.now() - c.updated > CONVERSA_TTL_MS) return false;
  return !!c.sinistroTratado;
}

// Limpeza periódica das conversas antigas (evita crescer a memória).
setInterval(() => {
  const agora = Date.now();
  for (const [from, c] of conversas) {
    if (agora - c.updated > CONVERSA_TTL_MS) conversas.delete(from);
  }
}, 10 * 60 * 1000).unref();

async function runMarIAna(inputText, from, name) {
  const historico = getHistorico(from);
  const messages = [...historico, { role: "user", content: inputText }];

  let system = MARIANA_SYSTEM;
  if (name && name !== from) system += `\n\nO nome do cliente é ${name}.`;
  if (!estaAberto()) {
    system += `\n\nATENÇÃO: no momento estamos FORA do horário de atendimento (${HORARIO}). Ao mencionar o retorno de um corretor, deixe claro que será assim que reabrirmos.`;
  }

  const response = await anthropic.messages.create({
    model: MARIANA_MODEL,
    max_tokens: 1024,
    system,
    messages,
  });

  const result = response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();

  if (result) {
    pushHistorico(from, "user", inputText);
    pushHistorico(from, "assistant", result);
  } else {
    console.warn("MarIAna retornou resposta vazia. stop_reason:", response.stop_reason);
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

  // Espelho das conversas → Telegram (monitoramento pelo time). Roda SEMPRE,
  // com a IA ligada ou não. Aqui espelhamos a mensagem que CHEGOU do cliente;
  // as respostas da MarIAna são espelhadas dentro das funções de envio.
  espelharTelegram(
    `📩 ${msg.name} (${msg.from}) · ${msg.platform}\n` +
      `${msg.interactiveId ? "🔘 [menu] " : ""}${msg.text}`
  );

  // Espelho legado via Make (mantido para compatibilidade). Só envia se a
  // MAKE_WEBHOOK_URL estiver configurada; caso contrário, não faz nada.
  if (MAKE_WEBHOOK_URL) {
    axios
      .post(MAKE_WEBHOOK_URL, req.body)
      .then(() => console.log("Espelho enviado ao Make"))
      .catch((e) => console.error("Falha ao espelhar no Make:", e.message));
  }

  try {
    // Camada de menu interativo (apenas WhatsApp). A MarIAna/IA continua
    // como fallback para mensagens de texto livre.
    if (msg.platform === "whatsapp") {
      const handled = await handleWhatsAppMenu(msg);
      if (handled) return;
    }

    if (anthropic) {
      let reply = "";
      try {
        reply = await runMarIAna(msg.text, msg.from, msg.name);
      } catch (aiErr) {
        // IA fora do ar: não repassamos o erro — abaixo montamos uma
        // resposta conclusiva (direta ao assunto quando possível).
        console.error("  IA (MarIAna) indisponível:", aiErr.message);
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
      // Sem IA: o próprio Make cuida da resposta. A cópia (espelho) já foi
      // enviada lá em cima, então aqui não repassamos de novo.
      console.log("IA desativada — resposta a cargo do Make");
    } else {
      console.log("Nenhum destino configurado (ANTHROPIC_API_KEY ou MAKE_WEBHOOK_URL)");
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
    const aviso = "Ops, tive uma instabilidade técnica rapidinha por aqui. 🙏 Pode me mandar sua mensagem de novo em alguns instantes? Se preferir, também pode falar com a gente por telefone.";
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

// ─── Regras da operação Quadrata × Piscinão Veículos ──────────────────────────
// O vendedor digita o prêmio bruto (o que o cliente paga). O IOF é abatido
// automaticamente para chegar ao prêmio líquido (PL), que é a base da comissão.

// Alíquotas de IOF sobre seguros, por ramo (legislação federal).
const IOF_POR_RAMO = {
  "Vida": 0.38,
  "Acidentes Pessoais": 0.38,
  "Saúde": 2.38,
};
const IOF_PADRAO = 7.38; // demais ramos (auto, residencial, empresarial…)

// Seguradoras com comissão diferenciada nesta parceria.
const COMISSAO_MAJORADA = ["porto", "azul", "itau", "itaú"];
const COMISSAO_MAJORADA_PCT = 4.0;
const COMISSAO_PADRAO_PCT = 2.0;

function iofDoRamo(ramo) {
  return IOF_POR_RAMO[ramo] !== undefined ? IOF_POR_RAMO[ramo] : IOF_PADRAO;
}

function comissaoDaSeguradora(seguradora) {
  const s = (seguradora || "").toLowerCase();
  return COMISSAO_MAJORADA.some((p) => s.includes(p))
    ? COMISSAO_MAJORADA_PCT
    : COMISSAO_PADRAO_PCT;
}

// Prêmio bruto → líquido: o IOF incide sobre o líquido, então bruto = líquido × (1 + iof).
function calcularVenda(grossValue, ramo, seguradora) {
  const iof_pct = iofDoRamo(ramo);
  const net = grossValue / (1 + iof_pct / 100);
  const commission_pct = comissaoDaSeguradora(seguradora);
  return {
    gross_value: parseFloat(grossValue.toFixed(2)),
    net_value: parseFloat(net.toFixed(2)),
    iof_pct,
    commission_pct,
    commission_value: parseFloat((net * commission_pct / 100).toFixed(2)),
  };
}

app.get("/api/config", (_req, res) => {
  res.json({
    iofPorRamo: IOF_POR_RAMO,
    iofPadrao: IOF_PADRAO,
    comissaoPadrao: COMISSAO_PADRAO_PCT,
    comissaoMajorada: COMISSAO_MAJORADA_PCT,
    seguradorasMajoradas: ["PORTO", "AZUL", "ITAÚ"],
  });
});

app.get("/api/simular-venda", (req, res) => {
  const gross = parseFloat(req.query.value);
  if (!gross || gross <= 0) return res.status(400).json({ error: "Valor inválido" });
  res.json(calcularVenda(gross, req.query.ramo || "", req.query.seguradora || ""));
});

// ─── Dashboard API ────────────────────────────────────────────────────────────

function getAdminPassword() {
  try {
    const row = db.prepare("SELECT value FROM settings WHERE key='admin_password'").get();
    return row ? row.value : ADMIN_PASSWORD;
  } catch { return ADMIN_PASSWORD; }
}

function requireAdmin(req, res, next) {
  if (req.headers["x-admin-password"] !== getAdminPassword())
    return res.status(401).json({ error: "Não autorizado" });
  next();
}

function getPeriodRange(period) {
  const now = new Date();
  if (period === "monthly") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0],
      label: start.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
    };
  }
  // Weekly: Monday → Sunday
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - day + (day === 0 ? -6 : 1));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    start: monday.toISOString().split("T")[0],
    end: sunday.toISOString().split("T")[0],
    label: `${monday.toLocaleDateString("pt-BR")} – ${sunday.toLocaleDateString("pt-BR")}`,
  };
}

function getPrevPeriodRange(period) {
  const now = new Date();
  if (period === "monthly") {
    const m = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    const y = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    const start = new Date(y, m, 1);
    const end   = new Date(y, m + 1, 0);
    return { start: start.toISOString().split("T")[0], end: end.toISOString().split("T")[0] };
  }
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - day + (day === 0 ? -6 : 1) - 7);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { start: monday.toISOString().split("T")[0], end: sunday.toISOString().split("T")[0] };
}

app.post("/api/admin/verify", (req, res) => {
  req.body.password === getAdminPassword()
    ? res.json({ ok: true })
    : res.status(401).json({ error: "Senha incorreta" });
});

app.get("/api/salespeople", (_req, res) => {
  res.json(db.prepare("SELECT * FROM salespeople WHERE active=1 ORDER BY name").all());
});

app.post("/api/salespeople", requireAdmin, (req, res) => {
  const name = req.body.name?.trim();
  if (!name) return res.status(400).json({ error: "Nome obrigatório" });
  try {
    const r = db.prepare("INSERT INTO salespeople (name) VALUES (?)").run(name);
    res.json({ id: r.lastInsertRowid, name, active: 1 });
  } catch (e) {
    if (e.message.includes("UNIQUE")) return res.status(409).json({ error: "Vendedor já existe" });
    throw e;
  }
});

app.delete("/api/salespeople/:id", requireAdmin, (req, res) => {
  db.prepare("UPDATE salespeople SET active=0 WHERE id=?").run(req.params.id);
  res.json({ ok: true });
});

app.get("/api/stats", (req, res) => {
  const period = req.query.period === "monthly" ? "monthly" : "weekly";
  const range = getPeriodRange(period);

  const rows = db.prepare(`
    SELECT sp.id, sp.name,
           COALESCE(SUM(s.value), 0)                              AS total_sold,
           COALESCE(SUM(s.value * COALESCE(s.commission_pct,0) / 100), 0) AS total_commission,
           COUNT(s.id)                                            AS sales_count,
           COALESCE(g.goal_value, 0)                             AS goal
    FROM salespeople sp
    LEFT JOIN sales s  ON s.salesperson_id = sp.id
                      AND s.sale_date >= ? AND s.sale_date <= ?
    LEFT JOIN goals g  ON g.salesperson_id = sp.id AND g.period_type = ?
    WHERE sp.active = 1
    GROUP BY sp.id, sp.name, g.goal_value
    ORDER BY sp.name
  `).all(range.start, range.end, period);

  const breakdown = db.prepare(`
    SELECT s.salesperson_id, s.ramo, SUM(s.value) AS value
    FROM sales s JOIN salespeople sp ON sp.id = s.salesperson_id
    WHERE s.sale_date >= ? AND s.sale_date <= ? AND sp.active = 1
    GROUP BY s.salesperson_id, s.ramo ORDER BY value DESC
  `).all(range.start, range.end);

  const bmap = {};
  breakdown.forEach((r) => {
    (bmap[r.salesperson_id] = bmap[r.salesperson_id] || []).push({ ramo: r.ramo, value: r.value });
  });

  const prevRange = getPrevPeriodRange(period);
  const prevRows = db.prepare(`
    SELECT sp.id, COALESCE(SUM(s.value), 0) AS prev_sold
    FROM salespeople sp
    LEFT JOIN sales s ON s.salesperson_id = sp.id
                     AND s.sale_date >= ? AND s.sale_date <= ?
    WHERE sp.active = 1
    GROUP BY sp.id
  `).all(prevRange.start, prevRange.end);
  const prevMap = {};
  prevRows.forEach((r) => (prevMap[r.id] = r.prev_sold));

  const salespeople = rows.map((r) => ({
    ...r,
    percentage: r.goal > 0 ? Math.round((r.total_sold / r.goal) * 100) : 0,
    breakdown: bmap[r.id] || [],
    prev_sold: prevMap[r.id] || 0,
  }));

  const totalSold       = salespeople.reduce((s, p) => s + p.total_sold, 0);
  const totalGoal       = salespeople.reduce((s, p) => s + p.goal, 0);
  const totalCommission = salespeople.reduce((s, p) => s + p.total_commission, 0);

  res.json({
    period,
    startDate: range.start,
    endDate: range.end,
    label: range.label,
    salespeople,
    totals: {
      totalSold,
      totalGoal,
      totalCommission,
      percentage: totalGoal > 0 ? Math.round((totalSold / totalGoal) * 100) : 0,
      salesCount: salespeople.reduce((s, p) => s + p.sales_count, 0),
    },
  });
});

app.get("/api/sales", (req, res) => {
  const period = req.query.period === "monthly" ? "monthly" : "weekly";
  const range = getPeriodRange(period);
  const params = [range.start, range.end];
  let q = `
    SELECT s.*, sp.name AS salesperson_name
    FROM sales s JOIN salespeople sp ON sp.id = s.salesperson_id
    WHERE s.sale_date >= ? AND s.sale_date <= ?
  `;
  if (req.query.salesperson_id) { q += " AND s.salesperson_id = ?"; params.push(req.query.salesperson_id); }
  q += " ORDER BY s.sale_date DESC, s.created_at DESC LIMIT 200";
  res.json({ sales: db.prepare(q).all(...params), startDate: range.start, endDate: range.end });
});

app.get("/api/sales/all", requireAdmin, (req, res) => {
  const params = [];
  let q = `
    SELECT s.*, sp.name AS salesperson_name
    FROM sales s JOIN salespeople sp ON sp.id = s.salesperson_id WHERE 1=1
  `;
  if (req.query.from) { q += " AND s.sale_date >= ?"; params.push(req.query.from); }
  if (req.query.to)   { q += " AND s.sale_date <= ?"; params.push(req.query.to); }
  if (req.query.salesperson_id) { q += " AND s.salesperson_id = ?"; params.push(req.query.salesperson_id); }
  q += " ORDER BY s.sale_date DESC, s.created_at DESC LIMIT 500";
  res.json(db.prepare(q).all(...params));
});

app.post("/api/sales", (req, res) => {
  const { salesperson_id, value, ramo, seguradora, sale_date, notes } = req.body;
  if (!salesperson_id || !value || !ramo || !seguradora || !sale_date)
    return res.status(400).json({ error: "Campos obrigatórios faltando" });

  // `value` chega como prêmio bruto; o IOF e a comissão são calculados aqui.
  const calc = calcularVenda(parseFloat(value), ramo, seguradora);
  const r = db.prepare(
    "INSERT INTO sales (salesperson_id,value,gross_value,iof_pct,ramo,seguradora,sale_date,notes,commission_pct) VALUES (?,?,?,?,?,?,?,?,?)"
  ).run(
    salesperson_id, calc.net_value, calc.gross_value, calc.iof_pct,
    ramo, seguradora, sale_date, notes || null, calc.commission_pct
  );
  res.json({ id: r.lastInsertRowid, ok: true, ...calc });
});

app.delete("/api/sales/:id", requireAdmin, (req, res) => {
  db.prepare("DELETE FROM sales WHERE id=?").run(req.params.id);
  res.json({ ok: true });
});

app.get("/api/goals", (_req, res) => {
  res.json(
    db.prepare(`
      SELECT g.*, sp.name AS salesperson_name
      FROM goals g JOIN salespeople sp ON sp.id = g.salesperson_id
      WHERE sp.active = 1
    `).all()
  );
});

app.post("/api/goals", requireAdmin, (req, res) => {
  const { salesperson_id, period_type, goal_value } = req.body;
  if (!salesperson_id || !period_type || goal_value === undefined)
    return res.status(400).json({ error: "Campos obrigatórios faltando" });
  db.prepare(`
    INSERT INTO goals (salesperson_id, period_type, goal_value) VALUES (?,?,?)
    ON CONFLICT(salesperson_id, period_type)
    DO UPDATE SET goal_value=excluded.goal_value, updated_at=datetime('now','localtime')
  `).run(salesperson_id, period_type, goal_value);
  res.json({ ok: true });
});

// ─── RO (Resultado Operacional) ───────────────────────────────────────────────

app.get("/api/ro-goals", (_req, res) => {
  res.json(
    db.prepare(`
      SELECT rg.*, sp.name AS salesperson_name
      FROM ro_goals rg JOIN salespeople sp ON sp.id = rg.salesperson_id
      WHERE sp.active = 1
    `).all()
  );
});

app.post("/api/ro-goals", requireAdmin, (req, res) => {
  const { salesperson_id, period_type, min_sales, min_commission, bonus_value } = req.body;
  if (!salesperson_id || !period_type)
    return res.status(400).json({ error: "Campos obrigatórios faltando" });
  db.prepare(`
    INSERT INTO ro_goals (salesperson_id, period_type, min_sales, min_commission, bonus_value)
    VALUES (?,?,?,?,?)
    ON CONFLICT(salesperson_id, period_type)
    DO UPDATE SET min_sales=excluded.min_sales, min_commission=excluded.min_commission,
                  bonus_value=excluded.bonus_value, updated_at=datetime('now','localtime')
  `).run(
    salesperson_id, period_type,
    min_sales ?? 0,
    min_commission ?? COMISSAO_PADRAO_PCT,
    bonus_value ?? 0
  );
  res.json({ ok: true });
});

app.get("/api/ro-stats", (req, res) => {
  const period = req.query.period === "monthly" ? "monthly" : "weekly";
  const range = getPeriodRange(period);

  const rows = db.prepare(`
    SELECT sp.id, sp.name,
           COUNT(s.id)                                                         AS sales_count,
           COALESCE(SUM(s.value), 0)                                           AS total_value,
           COALESCE(SUM(s.value * COALESCE(s.commission_pct,0) / 100), 0)     AS total_commission,
           COALESCE(rg.min_sales,      0)    AS min_sales,
           COALESCE(rg.min_commission, 2.0) AS min_commission,
           COALESCE(rg.bonus_value,    0)    AS bonus_value
    FROM salespeople sp
    LEFT JOIN sales s
           ON s.salesperson_id = sp.id
          AND s.sale_date >= ? AND s.sale_date <= ?
    LEFT JOIN ro_goals rg
           ON rg.salesperson_id = sp.id AND rg.period_type = ?
    WHERE sp.active = 1
    GROUP BY sp.id, sp.name, rg.min_sales, rg.min_commission, rg.bonus_value
    ORDER BY sp.name
  `).all(range.start, range.end, period);

  const salespeople = rows.map((r) => {
    // Weighted average: total commission earned / total value × 100
    const weighted_commission = r.total_value > 0
      ? parseFloat(((r.total_commission / r.total_value) * 100).toFixed(2))
      : 0;
    const ok_sales      = r.min_sales === 0 || r.sales_count >= r.min_sales;
    const ok_commission = r.min_commission === 0 || weighted_commission >= r.min_commission;
    const achieved      = ok_sales && ok_commission;
    const configured    = r.min_sales > 0 || r.min_commission > 0 || r.bonus_value > 0;
    return { ...r, weighted_commission, ok_sales, ok_commission, achieved, configured };
  });

  res.json({
    period,
    startDate: range.start,
    endDate: range.end,
    label: range.label,
    salespeople,
    achieved_count: salespeople.filter((p) => p.achieved).length,
    total_bonus:    salespeople.filter((p) => p.achieved).reduce((s, p) => s + p.bonus_value, 0),
  });
});

// ─── Metas por Seguradora (Grupo) ─────────────────────────────────────────────

const SEGURADORAS = [
  { name: "PORTO",        patterns: ["porto"] },
  { name: "AZUL",         patterns: ["azul"] },
  { name: "ITAÚ",         patterns: ["itau", "itaú"] },
  { name: "ALLIANZ",      patterns: ["allianz"] },
  { name: "TOKIO MARINE", patterns: ["tokio"] },
  { name: "BRADESCO",     patterns: ["bradesco"] },
  { name: "YELLUM",       patterns: ["yellum"] },
  { name: "HDI",          patterns: ["hdi"] },
  { name: "SUHAI",        patterns: ["suhai"] },
  { name: "ZURICH",       patterns: ["zurich"] },
];

function matchesSeg(saleSeg, seg) {
  const s = (saleSeg || "").toLowerCase();
  return seg.patterns.some((p) => s.includes(p));
}

app.get("/api/seguradoras", (_req, res) => {
  res.json(SEGURADORAS.map((s) => s.name));
});

app.get("/api/seguradora-goals", (req, res) => {
  const year  = parseInt(req.query.year)  || new Date().getFullYear();
  const month = parseInt(req.query.month) || (new Date().getMonth() + 1);
  res.json(db.prepare("SELECT * FROM seguradora_goals WHERE year=? AND month=?").all(year, month));
});

app.post("/api/seguradora-goals", requireAdmin, (req, res) => {
  const { seguradora, month, year, prev_year_value, bonus_value } = req.body;
  if (!seguradora || !month || !year)
    return res.status(400).json({ error: "Campos obrigatórios faltando" });
  db.prepare(`
    INSERT INTO seguradora_goals (seguradora, month, year, prev_year_value, bonus_value)
    VALUES (?,?,?,?,?)
    ON CONFLICT(seguradora, month, year)
    DO UPDATE SET prev_year_value=excluded.prev_year_value,
                  bonus_value=excluded.bonus_value,
                  updated_at=datetime('now','localtime')
  `).run(seguradora, month, year, prev_year_value || 0, bonus_value || 0);
  res.json({ ok: true });
});

app.get("/api/seguradora-stats", (req, res) => {
  const year  = parseInt(req.query.year)  || new Date().getFullYear();
  const month = parseInt(req.query.month) || (new Date().getMonth() + 1);

  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay   = new Date(year, month, 0).getDate();
  const endDate   = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const sales = db.prepare(
    "SELECT seguradora, value FROM sales WHERE sale_date BETWEEN ? AND ?"
  ).all(startDate, endDate);

  const goals = db.prepare(
    "SELECT * FROM seguradora_goals WHERE year=? AND month=?"
  ).all(year, month);
  const goalMap = {};
  goals.forEach((g) => (goalMap[g.seguradora] = g));

  const seguradoras = SEGURADORAS.map((seg) => {
    const currentValue = sales
      .filter((s) => matchesSeg(s.seguradora, seg))
      .reduce((sum, s) => sum + s.value, 0);
    const g           = goalMap[seg.name] || {};
    const prevValue   = g.prev_year_value || 0;
    const targetValue = prevValue * 1.10;
    const bonusValue  = g.bonus_value || 0;
    const achieved    = prevValue > 0 && currentValue >= targetValue;
    const percentage  = targetValue > 0
      ? parseFloat(((currentValue / targetValue) * 100).toFixed(2))
      : 0;
    const growthPct = prevValue > 0
      ? parseFloat((((currentValue - prevValue) / prevValue) * 100).toFixed(2))
      : 0;
    return {
      seguradora: seg.name,
      currentValue,
      prevValue,
      targetValue,
      percentage,
      growthPct,
      bonusValue,
      achieved,
      configured: prevValue > 0 || bonusValue > 0,
    };
  });

  res.json({
    year, month,
    startDate, endDate,
    seguradoras,
    totalBonus:    seguradoras.filter((s) => s.achieved).reduce((sum, s) => sum + s.bonusValue, 0),
    achievedCount: seguradoras.filter((s) => s.achieved).length,
  });
});

// ─── PIN Authentication ───────────────────────────────────────────────────────

app.post("/api/salespeople/:id/verify-pin", (req, res) => {
  const person = db.prepare("SELECT id, name, pin FROM salespeople WHERE id=? AND active=1").get(req.params.id);
  if (!person) return res.status(404).json({ error: "Vendedor não encontrado" });
  if (!person.pin) return res.json({ ok: true, name: person.name });
  if (String(req.body.pin || "") === String(person.pin)) return res.json({ ok: true, name: person.name });
  res.status(401).json({ error: "PIN incorreto" });
});

app.post("/api/salespeople/:id/pin", requireAdmin, (req, res) => {
  const pinVal = req.body.pin ? String(req.body.pin).slice(0, 6) : null;
  db.prepare("UPDATE salespeople SET pin=? WHERE id=?").run(pinVal, req.params.id);
  res.json({ ok: true });
});

// ─── Admin Password Change ────────────────────────────────────────────────────

app.put("/api/admin/password", requireAdmin, (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || String(newPassword).length < 4)
    return res.status(400).json({ error: "Senha deve ter pelo menos 4 caracteres" });
  db.prepare("INSERT OR REPLACE INTO settings(key,value) VALUES('admin_password',?)").run(String(newPassword));
  res.json({ ok: true });
});

// ─── Daily Stats ──────────────────────────────────────────────────────────────

app.get("/api/daily-stats", (req, res) => {
  const period = req.query.period === "monthly" ? "monthly" : "weekly";
  const range  = getPeriodRange(period);
  const today  = new Date().toISOString().split("T")[0];
  const endD   = range.end < today ? range.end : today;

  const salesRows = db.prepare(`
    SELECT s.salesperson_id, sp.name, s.sale_date, SUM(s.value) AS day_total
    FROM sales s JOIN salespeople sp ON sp.id = s.salesperson_id
    WHERE s.sale_date BETWEEN ? AND ? AND sp.active = 1
    GROUP BY s.salesperson_id, s.sale_date
    ORDER BY s.sale_date
  `).all(range.start, endD);

  const dates = [];
  let d = new Date(range.start);
  const eD = new Date(endD);
  while (d <= eD) {
    dates.push(d.toISOString().split("T")[0]);
    d.setDate(d.getDate() + 1);
  }

  const people = db.prepare("SELECT id, name FROM salespeople WHERE active=1 ORDER BY name").all();

  const datasets = people.map((p) => {
    let cum = 0;
    const data = dates.map((date) => {
      const row = salesRows.find((r) => r.salesperson_id === p.id && r.sale_date === date);
      cum += row ? row.day_total : 0;
      return parseFloat(cum.toFixed(2));
    });
    return { id: p.id, name: p.name, data };
  }).filter((ds) => ds.data.some((v) => v > 0));

  res.json({ dates, datasets, period });
});

// ─────────────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`Servidor MarIAna rodando na porta ${PORT}`);
  console.log(`IA (Anthropic): ${anthropic ? "ativa" : "(ANTHROPIC_API_KEY não configurada)"}`);
  console.log(`Modelo: ${MARIANA_MODEL}`);
  console.log(`Modo: ${anthropic ? "mariana" : MAKE_WEBHOOK_URL ? "make" : "só menu"}`);
  console.log(`>>> VERSAO: ${SERVER_VERSION} <<<`);
  console.log(`>>> Admin: http://localhost:${PORT}/admin.html`);
  console.log(`>>> Senha admin: ${ADMIN_PASSWORD === "admin123" ? "admin123 (padrao)" : "(custom via .env)"}`);
});
