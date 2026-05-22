/**
 * setup-langflow.js
 *
 * Cria automaticamente os 3 flows de agentes no Langflow (via API),
 * baseando-se no flow existente configurado em LANGFLOW_FLOW_ID.
 *
 * Uso:
 *   node setup-langflow.js
 *
 * Pré-requisito: .env com LANGFLOW_URL, LANGFLOW_FLOW_ID e LANGFLOW_API_KEY
 */

const axios = require("axios");
const fs = require("fs");
const path = require("path");

// ── Carrega .env manualmente (sem dependência extra) ──────────────────────────
const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, "utf8")
    .split("\n")
    .forEach((line) => {
      const [key, ...rest] = line.split("=");
      if (key && rest.length && !key.startsWith("#")) {
        process.env[key.trim()] = rest.join("=").trim();
      }
    });
}

const LANGFLOW_URL = process.env.LANGFLOW_URL || "http://localhost:7860";
const LANGFLOW_FLOW_ID = process.env.LANGFLOW_FLOW_ID || "";
const LANGFLOW_API_KEY = process.env.LANGFLOW_API_KEY || "";

if (!LANGFLOW_FLOW_ID) {
  console.error("❌ LANGFLOW_FLOW_ID não configurado no .env");
  process.exit(1);
}

const headers = {
  "Content-Type": "application/json",
  ...(LANGFLOW_API_KEY && { "x-api-key": LANGFLOW_API_KEY }),
};

// ── Prompts especializados para cada agente da Quadrata Seguros ───────────────
const AGENTS = [
  {
    envKey: "LANGFLOW_FLOW_VENDEDOR",
    name: "MarIAna — Vendedora Quadrata",
    description: "Agente especializado em vendas e cotações de seguros",
    systemPrompt: `Você é a MarIAna, consultora de vendas da Quadrata Seguros.

Seu objetivo é converter o interesse do cliente em uma proposta concreta.

Diretrizes:
- Apresente os produtos e planos da Quadrata com entusiasmo e clareza
- Faça perguntas para entender a necessidade exata do cliente (tipo de seguro, veículo, imóvel, vida, etc.)
- Ofereça cotações e explique os benefícios de cada plano
- Faça follow-up de orçamentos pendentes
- Envie propostas e oriente sobre formas de pagamento
- Seja persuasivo, proativo e orientado a resultados
- Se o cliente quiser agendar uma reunião, informe que vai encaminhar para a secretária

Personalidade: Confiante, entusiasta, focada em solucionar e fechar negócio.`,
  },
  {
    envKey: "LANGFLOW_FLOW_SECRETARIA",
    name: "MarIAna — Secretária Quadrata",
    description: "Agente especializado em agendamentos e agenda da Quadrata",
    systemPrompt: `Você é a MarIAna, secretária virtual da Quadrata Seguros.

Seu objetivo é organizar a agenda e facilitar o agendamento de reuniões e visitas.

Diretrizes:
- Gerencie solicitações de agendamento com eficiência
- Pergunte: nome completo, melhor data e horário, modalidade (presencial/online) e assunto da reunião
- Confirme disponibilidade e registre o agendamento
- Envie confirmação com todos os detalhes (data, hora, local/link)
- Lembre o cliente sobre compromissos próximos se solicitado
- Para dúvidas técnicas ou comerciais, informe que vai encaminhar ao atendente ou consultor

Personalidade: Organizada, pontual, cordial e eficiente.`,
  },
];

// ── Funções auxiliares ─────────────────────────────────────────────────────────

async function getFlow(flowId) {
  const res = await axios.get(`${LANGFLOW_URL}/api/v1/flows/${flowId}`, { headers });
  return res.data;
}

// Tenta atualizar o system prompt em diferentes estruturas de flow do Langflow
function injectSystemPrompt(flowData, systemPrompt) {
  const nodes = flowData?.data?.nodes || [];
  let injected = false;

  for (const node of nodes) {
    const tmpl = node?.data?.node?.template;
    if (!tmpl) continue;

    // Estrutura 1: nó OpenAI / LLM com system_message
    if (tmpl.system_message !== undefined) {
      tmpl.system_message.value = systemPrompt;
      injected = true;
    }

    // Estrutura 2: nó OpenAI com system_prompt
    if (tmpl.system_prompt !== undefined) {
      tmpl.system_prompt.value = systemPrompt;
      injected = true;
    }

    // Estrutura 3: nó Prompt com campo "template"
    if (
      node?.data?.type === "Prompt" &&
      tmpl.template !== undefined
    ) {
      const current = tmpl.template.value || "";
      // Injeta no início do prompt se ainda não tiver marcador
      if (!current.includes("{system_prompt}")) {
        tmpl.template.value = systemPrompt + "\n\n" + current;
        injected = true;
      }
    }

    // Estrutura 4: campo "instructions" (alguns modelos Langflow)
    if (tmpl.instructions !== undefined) {
      tmpl.instructions.value = systemPrompt;
      injected = true;
    }
  }

  return injected;
}

async function createFlow(baseFlow, agent) {
  const newFlow = JSON.parse(JSON.stringify(baseFlow)); // deep clone

  newFlow.name = agent.name;
  newFlow.description = agent.description;
  delete newFlow.id; // Langflow cria um novo ID

  const injected = injectSystemPrompt(newFlow, agent.systemPrompt);
  if (!injected) {
    console.warn(
      `  ⚠️  Não foi possível injetar o system prompt automaticamente em "${agent.name}".`
    );
    console.warn(`     Configure o prompt manualmente no painel do Langflow.`);
  }

  const res = await axios.post(`${LANGFLOW_URL}/api/v1/flows/`, newFlow, { headers });
  return res.data.id;
}

function updateEnvFile(updates) {
  if (!fs.existsSync(envPath)) {
    console.warn("  ⚠️  Arquivo .env não encontrado — crie-o copiando o .env.example");
    return;
  }

  let content = fs.readFileSync(envPath, "utf8");

  for (const [key, value] of Object.entries(updates)) {
    const regex = new RegExp(`^${key}=.*$`, "m");
    if (regex.test(content)) {
      content = content.replace(regex, `${key}=${value}`);
    } else {
      content += `\n${key}=${value}`;
    }
  }

  fs.writeFileSync(envPath, content, "utf8");
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🔧 Setup dos agentes Langflow — Quadrata Seguros\n");
  console.log(`📡 Langflow: ${LANGFLOW_URL}`);
  console.log(`📋 Flow base: ${LANGFLOW_FLOW_ID}\n`);

  let baseFlow;
  try {
    baseFlow = await getFlow(LANGFLOW_FLOW_ID);
    console.log(`✅ Flow base carregado: "${baseFlow.name}"\n`);
  } catch (err) {
    console.error(`❌ Erro ao buscar o flow base: ${err.message}`);
    console.error("   Verifique LANGFLOW_URL, LANGFLOW_FLOW_ID e LANGFLOW_API_KEY no .env");
    process.exit(1);
  }

  const envUpdates = {};

  for (const agent of AGENTS) {
    process.stdout.write(`🤖 Criando flow "${agent.name}"... `);
    try {
      const newId = await createFlow(baseFlow, agent);
      console.log(`✅ ID: ${newId}`);
      envUpdates[agent.envKey] = newId;
    } catch (err) {
      console.error(`❌ Erro: ${err.message}`);
    }
  }

  // Atualiza o .env com os novos IDs
  if (Object.keys(envUpdates).length > 0) {
    updateEnvFile(envUpdates);
    console.log("\n📝 .env atualizado com os novos flow IDs:\n");
    for (const [key, value] of Object.entries(envUpdates)) {
      console.log(`   ${key}=${value}`);
    }
  }

  console.log(`
✅ Setup concluído!

Próximos passos:
  1. Abra o Langflow e ajuste os prompts dos novos flows se necessário
  2. Reinicie o servidor: npm start
  3. Teste enviando mensagens com palavras de venda (ex: "quero um seguro")
     e de agenda (ex: "quero agendar uma reunião")
`);
}

main();
