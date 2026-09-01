require("dotenv").config();
const express = require("express");
const axios = require("axios");
const Anthropic = require("@anthropic-ai/sdk");
const path = require("path");
const db = require("./db");
const ADMIN_HTML = require("./admin-page");
const personas = require("./personas");

const app = express();
app.use(express.json());

// Versão do servidor (para confirmar que o código novo está rodando)
const SERVER_VERSION = "v6-personas-2026-09-01";
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
// IA das personas (MarIAna e FabrícIO) — direto pela API da Anthropic
// (Claude), sem Langflow. Quem responde cada mensagem sai de personas.js.
// A chave é lida automaticamente de ANTHROPIC_API_KEY pelo SDK.
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";
const MARIANA_MODEL = process.env.MARIANA_MODEL || "claude-haiku-4-5";
const anthropic = ANTHROPIC_API_KEY ? new Anthropic() : null;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const WA_PHONE_NUMBER_ID = process.env.WA_PHONE_NUMBER_ID || "";
const WA_ACCESS_TOKEN = process.env.WA_ACCESS_TOKEN || "";
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
    mode: anthropic ? "ia" : MAKE_WEBHOOK_URL ? "make" : "menu",
    modelo: anthropic ? MARIANA_MODEL : null,
    // Quem atende e por qual Instagram. "NAO configurado" = a persona só
    // responde no WhatsApp; faltam IG_USER_ID/IG_ACCESS_TOKEN dela.
    personas: Object.values(personas.PERSONAS).map((p) => ({
      id: p.id,
      nome: p.nome,
      padrao: p.id === personas.padrao().id,
      instagram: p.igUserId && p.igAccessToken ? "configurado" : "NAO configurado",
      link: p.id === personas.padrao().id ? "/fale" : `/fale/${p.id}`,
    })),
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

// Diagnóstico da IA — abre no browser para checar se o Claude responde.
// O caminho antigo (/mariana-status) continua valendo.
app.get(["/ia-status", "/mariana-status"], async (_req, res) => {
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

// ─── Página pública "Fale com a gente" ──────────────────────────────────────
// É o link da bio do Instagram. Leva o cliente direto para a conversa no
// WhatsApp — um número só, (11) 98678-0000, para as duas personas; para trocar
// sem mexer no código, basta definir WHATSAPP_NUMERO no ambiente.
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

// Mensagem já digitada ao abrir o WhatsApp. Os textos vivem em personas.js:
// cada persona tem os seus, e é o trecho de origem ("pelo Instagram do
// Fabricio") que, lá no webhook, diz quem deve atender o cliente.
//
// GET /fale            → atende a MarIAna (padrão; é o link já publicado)
// GET /fale/fabricio   → mesmo número, mas quem atende é o FabrícIO
// Os dois aceitam ?assunto=auto etc., como antes.
app.get(["/fale", "/fale.html", "/contato", "/fale/:persona"], (req, res) => {
  const persona =
    personas.porId(req.params.persona || req.query.de) || personas.padrao();
  const textos = personas.textosFale(persona);
  const assunto = String(req.query.assunto || "").toLowerCase();
  const texto = textos[assunto] || textos.padrao;
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
      // Chave da conversa e da persona. Separa por plataforma para um id do
      // Instagram nunca colidir com um telefone do WhatsApp.
      chave: `whatsapp:${message.from}`,
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
    const entry = body.entry?.[0];
    const messaging = entry?.messaging?.[0];
    if (!messaging?.message?.text) return null;
    return {
      platform: "instagram",
      // Conta que RECEBEU a mensagem — é o que diz se o direct caiu no perfil
      // da MarIAna ou no do FabrícIO.
      igAccountId: entry?.id ? String(entry.id) : "",
      from: messaging.sender.id,
      chave: `instagram:${messaging.sender.id}`,
      messageId: messaging.message.mid,
      type: "text",
      text: messaging.message.text,
      name: messaging.sender.id,
    };
  } catch {
    return null;
  }
}

// ─── Quem atende esta mensagem ───────────────────────────────────────────────
// O WhatsApp é um número só, então a persona vem da PORTA DE ENTRADA:
//   1. Instagram → a conta em que o direct caiu (o sinal mais confiável, não
//      depende do que o cliente digitou).
//   2. WhatsApp  → o anúncio (referral) ou o texto do link /fale da bio.
//   3. Sem pista → quem já vinha atendendo este contato (fica gravado).
//   4. Contato novo e sem pista → a persona padrão (MarIAna).
//
// Um sinal EXPLÍCITO (1 ou 2) vale mais que o histórico: quem falava com a
// MarIAna e chega pelo link do Fabricio passa a ser atendido por ele. Nesse
// caso a conversa recomeça do zero, para o novo atendente não responder em
// cima das falas do outro.
const lerPersona = db.prepare("SELECT persona FROM contact_persona WHERE chave = ?");
const gravarPersona = db.prepare(
  `INSERT INTO contact_persona (chave, persona, updated_at)
   VALUES (?, ?, datetime('now', 'localtime'))
   ON CONFLICT(chave) DO UPDATE SET
     persona = excluded.persona, updated_at = excluded.updated_at`
);

function resolverPersona(msg) {
  const explicita =
    msg.platform === "instagram"
      ? personas.porInstagram(msg.igAccountId)
      : personas.porReferral(msg.referral) || personas.porTexto(msg.text);

  let salva = null;
  try {
    salva = personas.porId(lerPersona.get(msg.chave)?.persona);
  } catch (e) {
    console.error("Falha ao ler a persona do contato:", e.message);
  }

  const escolhida = explicita || salva || personas.padrao();
  if (!salva || salva.id !== escolhida.id) {
    try {
      gravarPersona.run(msg.chave, escolhida.id);
    } catch (e) {
      console.error("Falha ao gravar a persona do contato:", e.message);
    }
    // Trocou de atendente no meio do caminho: zera o histórico.
    if (salva) {
      console.log(`  Troca de atendente: ${salva.nome} → ${escolhida.nome} (conversa zerada)`);
      esquecerConversa(msg.chave);
    }
  }
  return escolhida;
}

async function sendWhatsAppReply(to, text, persona) {
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
  // Espelha no Telegram o que a persona respondeu.
  espelharTelegram(`🤖 ${persona?.nome || "IA"} → ${to}\n${text}`);
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
// Digisac, enviado direto pelo webhook. A IA segue como fallback
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

// Resposta pronta do menu, já com a campanha de consórcio quando ela estiver
// valendo. Passa por aqui todo lugar que responde a partir de um id — assim a
// oferta aparece igual, venha o cliente do menu, de um anúncio ou do texto.
function respostaDe(id) {
  const base = RESPOSTAS[id];
  if (!base) return base;
  return id === "cot_consorcio" ? base + consorcioResumo() : base;
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

async function sendMainMenu(to, name, persona) {
  const p = persona || personas.padrao();
  await sendWhatsAppInteractiveList(to, {
    header: "Quadrata Seguros",
    body:
      `Olá${name ? ", " + name : ""}! 👋 ${p.apresentacao}\n\n` +
      `Resolvo bastante coisa por aqui na hora e, quando precisar, chamo um corretor pra te atender. Toque em *"Ver opções"* e me diz o que você precisa:`,
    footer: p.footer,
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
  // A continuação vem de consorcioResumo(): a campanha, enquanto ela valer, ou
  // o pedido de bem/valor depois que ela acabar.
  cot_consorcio:
    "🎯 *Consórcio* — um jeito planejado de conquistar o que você quer, sem juros: " +
    "você paga taxa de administração e recebe o bem por sorteio ou lance.",
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
  // O cliente quase sempre escreve "Oi," ou "Olá!" com pontuação colada. Para
  // o menu abrir do mesmo jeito, trocamos essa pontuação por um espaço antes
  // de comparar: "oi, quero informações" vira "oi quero informações".
  const limpo = t.replace(/^([^\s,!.?;:]+)\s*[,!.?;:]+\s*/, "$1 ").trim();
  const casa = (x) => MENU_TRIGGERS.some((w) => x === w || x.startsWith(w + " "));
  if (casa(t) || casa(limpo)) return true;
  return /^(bom dia|boa tarde|boa noite)\b/.test(limpo);
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
async function handleWhatsAppMenu(msg, persona) {
  // 1. Cliente selecionou um item de lista/botão
  if (msg.interactiveId) {
    if (msg.interactiveId === "cotacao") {
      await sendCotacaoMenu(msg.from);
      lembrarTroca(msg.chave, msg.text || "Cotação de seguro",
        "Perfeito! Te mostrei os tipos de seguro para você escolher qual quer cotar.");
      return true;
    }
    if (msg.interactiveId === "sinistro") {
      await sendSeguradorasMenu(msg.from);
      marcarSinistroTratado(msg.chave);
      lembrarTroca(msg.chave, msg.text || "Sinistro / Guincho",
        "Sinto muito pelo ocorrido. Te mostrei a lista de seguradoras para você me dizer qual é a sua.");
      return true;
    }
    if (msg.interactiveId === "corretor") {
      const t = RESPOSTAS.corretor + fechoCorretor("te atender");
      await sendWhatsAppReply(msg.from, t, persona);
      lembrarTroca(msg.chave, msg.text || "Falar com corretor", t);
      return true;
    }
    const resposta = respostaDe(msg.interactiveId);
    if (resposta) {
      const extra = COTACAO_IDS.has(msg.interactiveId) ? fechoCorretor() : "";
      const t = resposta + extra;
      await sendWhatsAppReply(msg.from, t, persona);
      // Ao escolher a seguradora, marcamos o sinistro como tratado (já demos os
      // telefones), para o fluxo não repetir a pergunta depois.
      if (msg.interactiveId.startsWith("seg_")) marcarSinistroTratado(msg.chave);
      lembrarTroca(msg.chave, msg.text || msg.interactiveId, t);
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
    const ola = `Olá! 👋 ${persona.apresentacao} Que bom falar com você!\n\n`;
    if (assuntoAd === "sinistro") {
      await sendSeguradorasMenu(msg.from);
      marcarSinistroTratado(msg.chave);
      lembrarTroca(msg.chave, msg.text || "(veio de um anúncio sobre sinistro)",
        "Sinto muito pelo ocorrido. Te mostrei a lista de seguradoras para você me dizer qual é a sua.");
      return true;
    }
    if (assuntoAd) {
      const t = ola + respostaDe(assuntoAd) + fechoCorretor();
      await sendWhatsAppReply(msg.from, t, persona);
      lembrarTroca(msg.chave, msg.text || "(veio de um anúncio)", t);
      return true;
    }
    await sendCotacaoMenu(msg.from);
    lembrarTroca(msg.chave, msg.text || "(veio de um anúncio)",
      "Te dei as boas-vindas e mostrei os tipos de seguro para você escolher qual quer cotar.");
    return true;
  }

  // 2. Sinistro/emergência (por texto livre) vem ANTES da saudação: quem
  // escreve "Oi, bati o carro" precisa do telefone da assistência 24h, não do
  // menu geral. Na PRIMEIRA vez mandamos o menu de seguradoras — ali estão os
  // telefones urgentes, que a IA não tem na memória. Se o sinistro já foi
  // tratado nesta conversa, NÃO repetimos a pergunta: deixamos a persona
  // conduzir com o contexto que já tem.
  const assunto = detectAssunto(msg.text);
  if (assunto === "sinistro" && !sinistroJaTratado(msg.chave)) {
    await sendSeguradorasMenu(msg.from);
    marcarSinistroTratado(msg.chave);
    lembrarTroca(msg.chave, msg.text,
      "Sinto muito pelo ocorrido. Te mostrei a lista de seguradoras para você me dizer qual é a sua.");
    return true;
  }

  // 3. Saudação / palavra-chave → mostra o menu principal
  if (isMenuTrigger(msg.text)) {
    await sendMainMenu(msg.from, msg.name, persona);
    lembrarTroca(msg.chave, msg.text, persona.resumoMenu);
    return true;
  }

  // 4. Demais textos livres → deixamos a persona (IA) conduzir a conversa: ela
  // entende pedidos com nuance (ex.: "consórcio de automóvel de 100 mil") que o
  // atalho por palavra-chave interpretaria errado. O atalho vira PLANO B, usado
  // só quando a IA está desativada, para ainda assim dar uma resposta útil.
  if (!anthropic && assunto) {
    const t = respostaDe(assunto) + fechoCorretor();
    await sendWhatsAppReply(msg.from, t, persona);
    lembrarTroca(msg.chave, msg.text, t);
    return true;
  }

  // 5. Sem IA e sem assunto reconhecido → o fallback conclusivo no handler
  // principal cuida da resposta.
  return false;
}

async function sendInstagramReply(to, text, persona) {
  const p = persona || personas.padrao();
  if (!p.igAccessToken || !p.igUserId) {
    console.log(`Instagram: ${p.nome} sem IG_USER_ID/IG_ACCESS_TOKEN configurado`);
    return;
  }
  console.log('[IG] Enviando para', to, 'como', p.nome, 'com user_id', p.igUserId);
  try { await axios.post(
    `https://graph.instagram.com/v21.0/${p.igUserId}/messages`,
    {
      recipient: { id: to },
      message: { text },
      messaging_type: "RESPONSE",
    },
    {
      headers: {
        Authorization: `Bearer ${p.igAccessToken}`,
        "Content-Type": "application/json",
      },
    }
  ); } catch(igErr) { console.error('[IG] Erro detalhado:', igErr.response?.status, JSON.stringify(igErr.response?.data)); throw igErr; }
  // Espelha no Telegram o que a persona respondeu (Instagram).
  espelharTelegram(`🤖 ${p.nome} → ${to} (Instagram)\n${text}`);
}

// ---------------------------------------------------------------------------
// IA de atendimento via API da Anthropic (Claude).
// Substitui o antigo servidor Langflow: sem servidor pesado ligado 24h, paga-se
// só por mensagem processada. O menu interativo continua como primeira camada.
// ---------------------------------------------------------------------------

// ─── Campanha Consórcio Porto Bank ──────────────────────────────────────────
// "50% de desconto na taxa" — parcela reduzida em 50% até a contemplação.
// Valores da tabela oficial para PESSOA FÍSICA. Depois da validade a campanha
// para de ser oferecida sozinha: nada de prometer preço vencido ao cliente.
const CONSORCIO_VALIDADE = "2026-08-31"; // último dia da oferta

function consorcioNaValidade(d = new Date()) {
  try {
    // Compara pelo dia corrente em São Paulo, não em UTC.
    const hoje = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
    return hoje <= CONSORCIO_VALIDADE;
  } catch {
    return false; // na dúvida, não oferece
  }
}

// [crédito, parcela sem oferta, parcela com redução]
const CONSORCIO_PLANOS = [
  {
    bem: "Automóvel",
    prazo: "100 meses",
    condicoes:
      "Taxa adm 0,08% ao mês (7,5% no total), Fundo de Reserva 2%, Seguro Prestamista 0,038%. Grupo em formação. Lance embutido de até 30% do crédito (modalidade de pagamento), conforme disponibilidade do grupo.",
    faixas: [
      [150000, 1704, 883], [160000, 1818, 942], [170000, 1932, 1001],
      [180000, 2045, 1060], [190000, 2159, 1119], [200000, 2273, 1178],
      [210000, 2386, 1237], [220000, 2500, 1296], [230000, 2614, 1354],
      [240000, 2727, 1413], [250000, 2841, 1472],
    ],
  },
  {
    bem: "Automóvel",
    prazo: "90 meses",
    condicoes:
      "Taxa adm 0,09% ao mês (8% no total), Fundo de Reserva 2%, Seguro Prestamista 0,038%. Grupo em formação. Lance embutido de até 30% do crédito (modalidade de pagamento), conforme disponibilidade do grupo.",
    faixas: [
      [80000, 1011, 522], [85000, 1074, 554], [90000, 1137, 587],
      [95000, 1200, 620], [100000, 1264, 652], [105000, 1327, 685],
      [110000, 1390, 718], [115000, 1453, 750], [120000, 1516, 783],
      [125000, 1580, 816], [130000, 1643, 848], [135000, 1706, 881],
      [140000, 1769, 914],
    ],
  },
  {
    bem: "Imóvel",
    prazo: "200 meses",
    condicoes:
      "Taxa adm 11,5% (antecipada, diluída no plano) — 0,06% ao mês, Fundo de Reserva 2%, Seguro Prestamista 0,038%. Grupo em formação. Lance embutido de 30% do crédito (modalidade de pagamento) e lance fixo de 40% (tipo de lance deste grupo).",
    // Aqui a 3ª coluna é a parcela reduzida JÁ COM a entrada diluída no prazo.
    reduzidaLabel: "parcela reduzida + entrada diluída no prazo do grupo",
    faixas: [
      [140000, 941, 457], [150000, 1008, 490], [160000, 1076, 523],
      [170000, 1143, 555], [180000, 1210, 588], [190000, 1277, 621],
      [200000, 1345, 653], [210000, 1412, 686], [220000, 1479, 719],
      [230000, 1546, 751], [240000, 1614, 784], [250000, 1681, 817],
      [260000, 1748, 849], [270000, 1815, 882], [280000, 1883, 915],
    ],
  },
];

const brl = (n) => n.toLocaleString("pt-BR");

// Menor parcela reduzida de cada plano — serve de chamada ("a partir de").
function consorcioEntradas() {
  return CONSORCIO_PLANOS.map((p) => {
    const [credito, , reduzida] = p.faixas[0];
    return { bem: p.bem, prazo: p.prazo, credito, reduzida };
  });
}

// Resumo curto para o WhatsApp (menu). Tabela cheia fica só para a IA.
function consorcioResumo() {
  if (!consorcioNaValidade()) {
    return (
      "\n\nMe conta pra eu começar:\n" +
      "• O *bem* desejado (imóvel, automóvel, serviços…)\n" +
      "• O *valor* aproximado que você tem em mente"
    );
  }
  const [auto90] = consorcioEntradas().filter((e) => e.prazo === "90 meses");
  const imovel = consorcioEntradas().find((e) => e.bem === "Imóvel");
  return (
    "\n\n🔥 *Reta final da campanha Porto Bank* (até 31/08): *50% de desconto na taxa* — você paga *metade da parcela* até ser contemplado.\n\n" +
    `• *Automóvel*: crédito de R$ ${brl(auto90.credito)} por R$ ${brl(auto90.reduzida)}/mês\n` +
    `• *Imóvel*: crédito de R$ ${brl(imovel.credito)} por R$ ${brl(imovel.reduzida)}/mês\n\n` +
    "Me diga o *bem* (imóvel ou automóvel) e o *valor do crédito* que você quer, " +
    "que eu te mostro a parcela exata. 😉"
  );
}

// Bloco injetado no prompt da IA só quando a conversa é sobre consórcio.
// Regras de lance. Valem sempre, com ou sem campanha: a tabela promocional cita
// só o lance embutido, e ler aquilo sozinho dá a impressão errada de que o lance
// máximo é 30% do crédito. São coisas diferentes — o TIPO de lance (quanto se
// oferece) e a FORMA de pagar (de onde sai o dinheiro).
const CONSORCIO_LANCES = `

LANCES NO CONSÓRCIO (regra geral da Porto — vale mesmo fora da campanha):

Tipos de lance — quanto o cliente oferece:
- Lance livre: o cliente escolhe o percentual, do valor de uma parcela até a quitação total (100% do crédito). Na assembleia, leva quem ofertar o maior percentual.
- Lance fixo: o grupo define um percentual único e pré-estabelecido (25%, 30%, 40% — varia conforme o grupo). Se mais de um cliente ofertar esse valor, a Porto aplica um critério de desempate (Loteria Federal ou proximidade com a pedra-chave).

Formas de pagar o lance — de onde sai o dinheiro:
- Lance embutido: o cliente usa até 30% da PRÓPRIA carta de crédito para pagar o lance, sem tirar do bolso. Se for contemplado, esse valor é descontado do crédito que ele recebe. A disponibilidade varia por bem e por grupo (imóvel e pesados, por exemplo).
- Recursos próprios: dinheiro do cliente ou, no caso de imóvel, o saldo do FGTS.

CUIDADO AO EXPLICAR: os 30% do lance embutido são o limite do que dá para tirar da própria carta — NÃO são o teto do lance. Com recursos próprios o cliente pode ofertar mais, inclusive quitar 100% no lance livre. Nunca dê a entender que só existe lance de 30%, nem que o embutido é a única opção.

Percentuais e disponibilidade mudam de grupo para grupo: informe o que estiver na tabela do plano e, para o resto, diga que um corretor confirma as regras do grupo específico. A contemplação sai por sorteio ou por lance.`;

function consorcioParaIA() {
  if (!consorcioNaValidade()) {
    return (
      CONSORCIO_LANCES +
      "\n\nCONSÓRCIO: a campanha de 50% de desconto na taxa (parcela reduzida) ENCERROU. " +
      "Não ofereça nem cite aqueles valores. Colete o bem desejado e o valor do crédito e diga que um corretor confirma as condições vigentes."
    );
  }
  const tabelas = CONSORCIO_PLANOS.map((p) => {
    const linhas = p.faixas
      .map(([c, sem, red]) => `  crédito R$ ${brl(c)} — sem oferta R$ ${brl(sem)} — com redução R$ ${brl(red)}`)
      .join("\n");
    const obs = p.reduzidaLabel ? ` (a coluna com redução é a ${p.reduzidaLabel})` : "";
    return `${p.bem} — grupo de ${p.prazo}${obs}\n  ${p.condicoes}\n${linhas}`;
  }).join("\n\n");

  return `${CONSORCIO_LANCES}

CAMPANHA CONSÓRCIO PORTO BANK — válida até 31/08/2026 (estamos na reta final):
"50% de desconto na taxa": a parcela fica reduzida em 50% até a contemplação.

EXCEÇÃO à regra de não informar valores: estes números são de tabela oficial
publicada e VOCÊ PODE informá-los ao cliente, desde que copiados exatamente
como estão abaixo. Valores para PESSOA FÍSICA.

${tabelas}

Ao falar desta campanha:
- SEMPRE explique, junto do valor reduzido, que a redução vale ATÉ A CONTEMPLAÇÃO e que depois a diferença é compensada nas parcelas seguintes. Nunca cite a parcela reduzida sozinha, como se fosse o valor definitivo do plano.
- NUNCA invente, calcule, interpole ou arredonde faixas: se o cliente pedir um crédito que não está na tabela, mostre as faixas vizinhas que existem e diga que um corretor monta o valor exato.
- Diga que as parcelas são reajustadas no aniversário do grupo e que as demais condições estão no Regulamento.
- Consórcio NÃO é financiamento: não tem juros, tem taxa de administração, e o bem sai por sorteio ou lance.
- A oferta acaba em 31/08/2026 — pode usar isso como um convite gentil para não deixar passar, sem pressionar.
- Para seguir, peça o valor do crédito desejado e avise que um corretor da Quadrata finaliza a simulação e a adesão.`;
}

// O prompt de sistema mora em personas.js: cada persona tem a sua identidade
// (nome, gênero, jeito de falar) e todas compartilham o mesmo corpo — produtos,
// tom, regras e limites. Ver personas.systemPrompt().

// Memória de conversa por cliente (em memória do processo). Mantém o contexto
// das últimas trocas, como fazia a "session" do Langflow. Some após um período
// de inatividade — atendimento novo recomeça do zero. A chave é a de msg.chave
// ("whatsapp:5511..." / "instagram:123..."), a mesma da persona do contato.
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
// sinistro, cotação…). Assim a IA "enxerga" o que o menu respondeu e
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

// Zera a conversa — usado quando o contato troca de persona, para o novo
// atendente não continuar de onde o outro parou.
function esquecerConversa(chave) {
  conversas.delete(chave);
}

// Limpeza periódica das conversas antigas (evita crescer a memória).
setInterval(() => {
  const agora = Date.now();
  for (const [from, c] of conversas) {
    if (agora - c.updated > CONVERSA_TTL_MS) conversas.delete(from);
  }
}, 10 * 60 * 1000).unref();

async function runIA(inputText, chave, name, persona) {
  const historico = getHistorico(chave);
  const messages = [...historico, { role: "user", content: inputText }];

  let system = personas.systemPrompt(persona || personas.padrao());
  // A tabela do consórcio só entra quando o assunto aparece na conversa (na
  // mensagem atual ou no que já foi dito). Evita carregar dezenas de faixas de
  // preço em todo atendimento — e diminui a chance de a IA citar valor fora
  // de contexto.
  const conversaToda = [...historico.map((m) => m.content), inputText].join(" ");
  if (/cons[óo]rcio/i.test(conversaToda)) system += consorcioParaIA();
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
    pushHistorico(chave, "user", inputText);
    pushHistorico(chave, "assistant", result);
  } else {
    console.warn("IA retornou resposta vazia. stop_reason:", response.stop_reason);
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

  // Quem atende: definido pela porta de entrada e gravado por contato.
  const persona = resolverPersona(msg);
  console.log(`  Atende: ${persona.nome}`);

  // Espelho das conversas → Telegram (monitoramento pelo time). Roda SEMPRE,
  // com a IA ligada ou não. Aqui espelhamos a mensagem que CHEGOU do cliente;
  // as respostas da persona são espelhadas dentro das funções de envio.
  espelharTelegram(
    `📩 ${msg.name} (${msg.from}) · ${msg.platform} · ${persona.nome}\n` +
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
    // Camada de menu interativo (apenas WhatsApp). A IA continua como
    // fallback para mensagens de texto livre.
    if (msg.platform === "whatsapp") {
      const handled = await handleWhatsAppMenu(msg, persona);
      if (handled) return;
    }

    if (anthropic) {
      let reply = "";
      try {
        reply = await runIA(msg.text, msg.chave, msg.name, persona);
      } catch (aiErr) {
        // IA fora do ar: não repassamos o erro — abaixo montamos uma
        // resposta conclusiva (direta ao assunto quando possível).
        console.error(`  IA (${persona.nome}) indisponível:`, aiErr.message);
      }
      if (reply) {
        console.log(`Resposta ${persona.nome}: ${reply}`);
        if (msg.platform === "whatsapp") {
          await sendWhatsAppReply(msg.from, reply, persona);
        } else {
          await sendInstagramReply(msg.from, reply, persona);
        }
      } else {
        // Sem resposta da IA. Se conseguirmos identificar o assunto,
        // respondemos direto; senão, uma mensagem conclusiva (sem repetir
        // o menu, evitando o "looping").
        const assunto = detectAssunto(msg.text);
        let texto;
        if (assunto && assunto !== "sinistro" && RESPOSTAS[assunto]) {
          texto = respostaDe(assunto) + fechoCorretor();
        } else {
          texto =
            "✅ Recebi sua mensagem e já registrei sua solicitação." +
            fechoCorretor() +
            (msg.platform === "whatsapp"
              ? "\n\nSe quiser ver todas as opções, é só digitar *menu*. 🙂"
              : "");
        }
        if (msg.platform === "whatsapp") {
          await sendWhatsAppReply(msg.from, texto, persona);
        } else {
          await sendInstagramReply(msg.from, texto, persona);
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
        await sendWhatsAppReply(msg.from, aviso, persona);
      } else {
        await sendInstagramReply(msg.from, aviso, persona);
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
  console.log(`Servidor Quadrata rodando na porta ${PORT}`);
  console.log(`IA (Anthropic): ${anthropic ? "ativa" : "(ANTHROPIC_API_KEY não configurada)"}`);
  console.log(`Modelo: ${MARIANA_MODEL}`);
  console.log(`Modo: ${anthropic ? "ia" : MAKE_WEBHOOK_URL ? "make" : "só menu"}`);
  for (const p of Object.values(personas.PERSONAS)) {
    const ig = p.igUserId && p.igAccessToken ? "Instagram ok" : "sem Instagram";
    const link = p.id === personas.padrao().id ? "/fale" : `/fale/${p.id}`;
    console.log(`Persona: ${p.nome} — ${link} — ${ig}`);
  }
  console.log(`>>> VERSAO: ${SERVER_VERSION} <<<`);
  console.log(`>>> Admin: http://localhost:${PORT}/admin.html`);
  console.log(`>>> Senha admin: ${ADMIN_PASSWORD === "admin123" ? "admin123 (padrao)" : "(custom via .env)"}`);
});
