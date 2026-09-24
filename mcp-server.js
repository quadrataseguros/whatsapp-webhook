#!/usr/bin/env node
// Servidor MCP da Quadrata — deixa um agente de IA (Claude Code, Claude
// Desktop, Cursor, Codex…) cuidar do WhatsApp Business da MarIAna e do
// FabrícIO conversando, sem abrir o Business Manager.
//
// Complementa o WhatsApp Business Tools MCP oficial da Meta: aquele cuida da
// configuração da conta (criar WABA, verificar número, termos); este cuida do
// dia a dia DESTE servidor — saúde do número, templates, envio e captação.
//
// Roda por stdio, na máquina de quem usa o agente: `node mcp-server.js`.
// Lê as mesmas variáveis do .env do webhook. Ver README, seção "Servidor MCP".
//
// Nada aqui escreve em stdout além do protocolo: log vai para stderr.
require("dotenv").config({ path: require("path").join(__dirname, ".env"), quiet: true });
const axios = require("axios");
const { z } = require("zod");
const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");

const GRAPH_VERSION = process.env.GRAPH_VERSION || "v21.0";
const WA_PHONE_NUMBER_ID = process.env.WA_PHONE_NUMBER_ID;
const WA_ACCESS_TOKEN = process.env.WA_ACCESS_TOKEN;
const WA_BUSINESS_ACCOUNT_ID = process.env.WA_BUSINESS_ACCOUNT_ID;
// Onde o webhook roda de verdade (Render). Usado para saúde e captação.
const SERVER_URL = (process.env.SERVER_URL || "https://whatsapp-webhook.onrender.com").replace(/\/+$/, "");
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

const graph = (caminho) => `https://graph.facebook.com/${GRAPH_VERSION}/${caminho}`;
const auth = () => ({ Authorization: `Bearer ${WA_ACCESS_TOKEN}` });

function erroMeta(e) {
  const d = e.response?.data?.error;
  return d ? `${d.message} (código ${d.code}${d.error_subcode ? "/" + d.error_subcode : ""})` : e.message;
}

function exigir(...nomes) {
  const falta = nomes.filter((n) => !process.env[n]);
  if (falta.length) throw new Error(`Faltam variáveis no .env: ${falta.join(", ")}`);
}

// Toda ferramenta devolve JSON legível; erro vira isError, não exceção — o
// agente lê a mensagem da Meta e consegue corrigir sozinho.
function ferramenta(fn) {
  return async (args) => {
    try {
      const r = await fn(args || {});
      return { content: [{ type: "text", text: typeof r === "string" ? r : JSON.stringify(r, null, 2) }] };
    } catch (e) {
      return { isError: true, content: [{ type: "text", text: erroMeta(e) }] };
    }
  };
}

// Mesmo formato de número que o webhook usa: só dígitos, com DDI 55.
function normalizarNumero(valor) {
  let d = String(valor || "").replace(/\D/g, "");
  if (d.length === 10 || d.length === 11) d = "55" + d;
  if (d.length < 12) throw new Error(`Número inválido: "${valor}". Use DDD + número, ex.: 11986780000.`);
  return d;
}

const server = new McpServer({ name: "quadrata-whatsapp", version: "1.0.0" });

server.registerTool(
  "whatsapp_status",
  {
    title: "Situação do número",
    description:
      "Mostra como o número do WhatsApp Business está na Meta: nome verificado, qualidade, " +
      "limite de mensagens, status do nome e da verificação. Use para achar o que falha em silêncio.",
    inputSchema: {},
    annotations: { readOnlyHint: true },
  },
  ferramenta(async () => {
    exigir("WA_PHONE_NUMBER_ID", "WA_ACCESS_TOKEN");
    const numero = await axios.get(graph(WA_PHONE_NUMBER_ID), {
      params: {
        fields:
          "display_phone_number,verified_name,quality_rating,name_status,code_verification_status," +
          "messaging_limit_tier,platform_type,throughput,account_mode,is_official_business_account",
      },
      headers: auth(),
    });
    const r = { numero: numero.data };
    if (WA_BUSINESS_ACCOUNT_ID) {
      const [conta, apps] = await Promise.all([
        axios.get(graph(WA_BUSINESS_ACCOUNT_ID), {
          params: { fields: "name,account_review_status,business_verification_status,currency,timezone_id" },
          headers: auth(),
        }),
        axios.get(graph(`${WA_BUSINESS_ACCOUNT_ID}/subscribed_apps`), { headers: auth() }),
      ]);
      r.conta = conta.data;
      // Sem app inscrito, a Meta não entrega mensagem nenhuma ao webhook.
      r.apps_inscritos_no_webhook = apps.data?.data || [];
    } else {
      r.aviso = "Defina WA_BUSINESS_ACCOUNT_ID para ver também a conta, a verificação e a inscrição do webhook.";
    }
    return r;
  })
);

server.registerTool(
  "listar_templates",
  {
    title: "Listar templates",
    description: "Lista os templates de mensagem da conta, com status de aprovação, categoria e conteúdo.",
    inputSchema: {
      nome: z.string().optional().describe("Filtra pelo nome (contém)"),
      status: z
        .enum(["APPROVED", "PENDING", "REJECTED", "PAUSED", "DISABLED"])
        .optional()
        .describe("Filtra pelo status"),
    },
    annotations: { readOnlyHint: true },
  },
  ferramenta(async ({ nome, status }) => {
    exigir("WA_BUSINESS_ACCOUNT_ID", "WA_ACCESS_TOKEN");
    const r = await axios.get(graph(`${WA_BUSINESS_ACCOUNT_ID}/message_templates`), {
      params: {
        fields: "name,status,category,language,components,rejected_reason,quality_score",
        limit: 100,
        ...(nome && { name: nome }),
        ...(status && { status }),
      },
      headers: auth(),
    });
    return r.data?.data || [];
  })
);

const componente = z
  .object({
    type: z.enum(["HEADER", "BODY", "FOOTER", "BUTTONS"]),
    format: z.string().optional(),
    text: z.string().optional(),
    buttons: z.array(z.record(z.any())).optional(),
    example: z.record(z.any()).optional(),
  })
  .passthrough();

server.registerTool(
  "criar_template",
  {
    title: "Criar template",
    description:
      "Envia um template de mensagem para aprovação da Meta. Nome em minúsculas com _ . " +
      "Variáveis no texto como {{1}}, {{2}} — e mande um exemplo delas em example.body_text. " +
      "MARKETING para ofertas; UTILITY para avisos de apólice, boleto, renovação.",
    inputSchema: {
      nome: z.string().regex(/^[a-z0-9_]+$/, "só minúsculas, números e _"),
      categoria: z.enum(["MARKETING", "UTILITY", "AUTHENTICATION"]),
      idioma: z.string().default("pt_BR"),
      componentes: z.array(componente).min(1).describe("Pelo menos um BODY"),
    },
  },
  ferramenta(async ({ nome, categoria, idioma, componentes }) => {
    exigir("WA_BUSINESS_ACCOUNT_ID", "WA_ACCESS_TOKEN");
    const r = await axios.post(
      graph(`${WA_BUSINESS_ACCOUNT_ID}/message_templates`),
      { name: nome, category: categoria, language: idioma, components: componentes },
      { headers: auth() }
    );
    return r.data;
  })
);

server.registerTool(
  "apagar_template",
  {
    title: "Apagar template",
    description: "Apaga um template pelo nome (todas as línguas). Não dá para desfazer.",
    inputSchema: { nome: z.string() },
    annotations: { destructiveHint: true },
  },
  ferramenta(async ({ nome }) => {
    exigir("WA_BUSINESS_ACCOUNT_ID", "WA_ACCESS_TOKEN");
    const r = await axios.delete(graph(`${WA_BUSINESS_ACCOUNT_ID}/message_templates`), {
      params: { name: nome },
      headers: auth(),
    });
    return r.data;
  })
);

server.registerTool(
  "enviar_template",
  {
    title: "Enviar template",
    description:
      "Manda um template aprovado para um cliente. É o único jeito de puxar conversa " +
      "com quem não escreveu nas últimas 24 horas.",
    inputSchema: {
      para: z.string().describe("Número do cliente, com DDD"),
      template: z.string(),
      idioma: z.string().default("pt_BR"),
      variaveis: z.array(z.string()).default([]).describe("Valores de {{1}}, {{2}}… do corpo, em ordem"),
    },
    annotations: { openWorldHint: true },
  },
  ferramenta(async ({ para, template, idioma, variaveis }) => {
    exigir("WA_PHONE_NUMBER_ID", "WA_ACCESS_TOKEN");
    const components = variaveis.length
      ? [{ type: "body", parameters: variaveis.map((text) => ({ type: "text", text })) }]
      : undefined;
    const r = await axios.post(
      graph(`${WA_PHONE_NUMBER_ID}/messages`),
      {
        messaging_product: "whatsapp",
        to: normalizarNumero(para),
        type: "template",
        template: { name: template, language: { code: idioma }, ...(components && { components }) },
      },
      { headers: auth() }
    );
    return r.data;
  })
);

server.registerTool(
  "enviar_texto",
  {
    title: "Enviar texto",
    description:
      "Manda texto livre. Só funciona se o cliente escreveu nas últimas 24 horas; " +
      "fora disso a Meta recusa (erro 131047) e é preciso usar enviar_template.",
    inputSchema: { para: z.string().describe("Número do cliente, com DDD"), texto: z.string().min(1) },
    annotations: { openWorldHint: true },
  },
  ferramenta(async ({ para, texto }) => {
    exigir("WA_PHONE_NUMBER_ID", "WA_ACCESS_TOKEN");
    const r = await axios.post(
      graph(`${WA_PHONE_NUMBER_ID}/messages`),
      { messaging_product: "whatsapp", to: normalizarNumero(para), type: "text", text: { body: texto } },
      { headers: auth() }
    );
    return r.data;
  })
);

server.registerTool(
  "servidor_saude",
  {
    title: "Saúde do webhook",
    description: "Consulta o webhook no ar (Render): /health e /ia-status — se a IA das personas está respondendo.",
    inputSchema: {},
    annotations: { readOnlyHint: true },
  },
  ferramenta(async () => {
    const [health, ia] = await Promise.allSettled([
      axios.get(`${SERVER_URL}/health`, { timeout: 60000 }),
      axios.get(`${SERVER_URL}/ia-status`, { timeout: 60000 }),
    ]);
    const ler = (p) => (p.status === "fulfilled" ? p.value.data : { erro: p.reason.message });
    return { servidor: SERVER_URL, health: ler(health), ia: ler(ia) };
  })
);

server.registerTool(
  "captacao",
  {
    title: "Captação por origem",
    description: "Quantos contatos chegaram por canal (Instagram de cada persona, site…) e por semana.",
    inputSchema: {},
    annotations: { readOnlyHint: true },
  },
  ferramenta(async () => {
    exigir("ADMIN_PASSWORD");
    const r = await axios.get(`${SERVER_URL}/api/captacao`, {
      headers: { "x-admin-password": ADMIN_PASSWORD },
      timeout: 60000,
    });
    return r.data;
  })
);

async function main() {
  await server.connect(new StdioServerTransport());
  console.error(`MCP quadrata-whatsapp no ar (Graph ${GRAPH_VERSION}, servidor ${SERVER_URL})`);
}

main().catch((e) => {
  console.error("Falha ao iniciar o MCP:", e);
  process.exit(1);
});
