/**
 * Quadrata Seguros — Gerador de Posts: Seguro de Vida
 * Usa Claude API com prompt caching para eficiência e consistência.
 */

const Anthropic = require("@anthropic-ai/sdk");
const personas = require("./personas.json");
const strategy = require("./content-strategy.json");

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Tipos de post disponíveis ────────────────────────────────────────────────

const POST_TYPES = {
  carrossel: {
    label: "Carrossel Instagram/LinkedIn",
    instrucao: `Crie um carrossel com 7-9 slides. Responda no formato JSON:
{
  "titulo_capa": "...",
  "slides": [
    { "numero": 1, "titulo": "...", "texto": "...", "visual_sugerido": "..." }
  ],
  "cta_final": "...",
  "legenda_instagram": "...",
  "hashtags": "..."
}
Cada slide deve ter no máximo 50 palavras no texto. O slide 1 é a capa (só título impactante). O último slide sempre tem CTA para WhatsApp da Quadrata.`,
  },
  reels: {
    label: "Roteiro de Reels (60-90 segundos)",
    instrucao: `Crie um roteiro completo para Reels. Responda no formato JSON:
{
  "hook_primeiros_3s": "...",
  "roteiro_completo": "...",
  "legenda": "...",
  "cta_final_falado": "...",
  "sugestao_visual": "...",
  "hashtags": "...",
  "duracao_estimada": "..."
}
O hook dos primeiros 3 segundos é crítico — deve parar o scroll imediatamente.`,
  },
  post_texto: {
    label: "Post de Texto (LinkedIn/Facebook)",
    instrucao: `Crie um post de texto longo e reflexivo. Responda no formato JSON:
{
  "hook_primeira_linha": "...",
  "corpo_do_post": "...",
  "cta": "...",
  "versao_linkedin": "...",
  "versao_facebook": "...",
  "hashtags_linkedin": "..."
}
A primeira linha deve ser poderosa o suficiente para que o leitor clique em "ver mais".`,
  },
  stories: {
    label: "Sequência de Stories",
    instrucao: `Crie uma sequência de 5 stories conectados. Responda no formato JSON:
{
  "tema_geral": "...",
  "stories": [
    {
      "numero": 1,
      "tipo": "pergunta|afirmacao|dado|cta",
      "texto_principal": "...",
      "texto_secundario": "...",
      "elemento_interativo": "enquete|caixa_perguntas|link|nenhum",
      "opcoes_enquete": ["...", "..."],
      "visual_sugerido": "..."
    }
  ],
  "cta_ultimo_story": "..."
}`,
  },
  whatsapp_broadcast: {
    label: "Mensagem de Broadcast WhatsApp",
    instrucao: `Crie uma mensagem de broadcast para WhatsApp. Responda no formato JSON:
{
  "mensagem_principal": "...",
  "variante_a": "...",
  "variante_b": "...",
  "cta": "...",
  "nota_personalizacao": "..."
}
Máximo 1000 caracteres por variante. Tom conversacional e pessoal. NUNCA soar como spam.`,
  },
};

// ─── Personas mapeadas ────────────────────────────────────────────────────────

const PERSONA_IDS = {
  provedor: personas.publico_primario,
  autonomo: personas.publico_secundario_1,
  patrimonial: personas.publico_secundario_2,
};

// ─── System prompt com cache — caro de computar, vale cachear ─────────────────

function buildSystemPrompt() {
  return `Você é o head de marketing da Quadrata Seguros, uma corretora brasileira de seguros especializada em seguro de vida.

PARCEIROS COMERCIAIS: ${personas.seguradoras_parceiras.join(", ")}.

MISSÃO: Criar conteúdo que EDUCA o público sobre a importância do seguro de vida e gera leads qualificados de forma orgânica, sem ser invasivo ou criar ansiedade excessiva.

PRINCÍPIOS DE COMUNICAÇÃO:
1. Fale de PROTEÇÃO, não de morte. De TRANQUILIDADE, não de tragédia.
2. Use dados reais do mercado brasileiro quando possível.
3. Sempre mencione que Porto Seguro, SulAmérica e Bradesco são parceiras — transmite credibilidade.
4. CTA sempre direciona para WhatsApp da Quadrata Seguros.
5. Nunca prometa valores ou coberturas sem ressalvar que variam por perfil.
6. Tom empático, próximo, sem ser alarmista.
7. Use linguagem simples — seu público não é especialista em seguros.
8. Quebre objeções de forma sutil dentro do conteúdo educativo.

OBJEÇÕES MAIS COMUNS A QUEBRAR (insira subtilmente no conteúdo):
${personas.publico_primario.objecoes_comuns.map((o) => `- ${o}`).join("\n")}

GATILHOS DE COMPRA QUE FUNCIONAM:
${personas.publico_primario.gatilhos_de_compra.map((g) => `- ${g}`).join("\n")}

DIFERENCIAL DAS SEGURADORAS PARCEIRAS:
- Porto Seguro: Reconhecimento de marca, confiança, rapidez no pagamento
- SulAmérica: 131 anos de história, sólida financeiramente, boa cobertura
- Bradesco Seguros: Maior rede, integração bancária, facilidade de contratação

IMPORTANTE: Todo conteúdo deve terminar com incentivo a falar com a Quadrata Seguros no WhatsApp para uma consultoria gratuita e personalizada.`;
}

// ─── Função principal de geração ──────────────────────────────────────────────

async function generatePost({
  tipo = "carrossel",
  persona_id = "provedor",
  tema = null,
  pilar = "educacao",
  contexto_adicional = "",
}) {
  const postType = POST_TYPES[tipo];
  if (!postType) {
    throw new Error(`Tipo inválido: ${tipo}. Opções: ${Object.keys(POST_TYPES).join(", ")}`);
  }

  const persona = PERSONA_IDS[persona_id];
  if (!persona) {
    throw new Error(`Persona inválida: ${persona_id}. Opções: ${Object.keys(PERSONA_IDS).join(", ")}`);
  }

  const pilarInfo = strategy.pilares_de_conteudo.find((p) => p.id === pilar) || strategy.pilares_de_conteudo[0];

  const temaFinal =
    tema ||
    pilarInfo.exemplos_de_temas[Math.floor(Math.random() * pilarInfo.exemplos_de_temas.length)];

  const userPrompt = `Crie um ${postType.label} para a Quadrata Seguros.

PÚBLICO-ALVO: ${persona.nome}
- Faixa etária: ${persona.perfil?.idade || "32-50 anos"}
- Dores principais: ${(persona.dores_principais || []).slice(0, 3).join("; ")}
- Tom de comunicação: ${persona.tom_de_comunicacao || "Empático e direto"}

PILAR DE CONTEÚDO: ${pilarInfo.nome} — ${pilarInfo.objetivo}

TEMA DO POST: ${temaFinal}

${contexto_adicional ? `CONTEXTO ADICIONAL: ${contexto_adicional}` : ""}

${postType.instrucao}

Responda APENAS com o JSON válido, sem texto adicional antes ou depois.`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2000,
    system: [
      {
        type: "text",
        text: buildSystemPrompt(),
        cache_control: { type: "ephemeral" }, // cache do system prompt
      },
    ],
    messages: [{ role: "user", content: userPrompt }],
  });

  const rawText = response.content[0].text.trim();

  let parsed;
  try {
    // Remove possível markdown code block se o modelo errar
    const clean = rawText.replace(/^```json?\n?/, "").replace(/\n?```$/, "");
    parsed = JSON.parse(clean);
  } catch {
    parsed = { raw: rawText, parse_error: true };
  }

  return {
    meta: {
      tipo,
      persona: persona.nome,
      pilar: pilarInfo.nome,
      tema: temaFinal,
      gerado_em: new Date().toISOString(),
      tokens_usados: response.usage,
    },
    conteudo: parsed,
  };
}

// ─── Gerador de calendário mensal ─────────────────────────────────────────────

async function generateMonthlyCalendar({ mes = null, ano = null } = {}) {
  const agora = new Date();
  const mesAlvo = mes || agora.getMonth() + 2; // próximo mês
  const anoAlvo = ano || agora.getFullYear();

  const prompt = `Crie um calendário completo de posts de seguro de vida para ${mesAlvo}/${anoAlvo} para a Quadrata Seguros (corretora que vende Porto Seguro, SulAmérica e Bradesco).

Siga a distribuição de pilares:
- 40% Educação e Desmistificação
- 25% Histórias e Emoção
- 20% Autoridade e Prova Social
- 15% Conversão e CTA

Para cada post inclua: data, dia da semana, pilar, tipo de formato, rede social, tema específico, horário de postagem.

Responda em JSON no formato:
{
  "mes": "${mesAlvo}/${anoAlvo}",
  "total_posts": 24,
  "resumo_pilares": {...},
  "calendario": [
    {
      "data": "01/${mesAlvo}/${anoAlvo}",
      "dia_semana": "...",
      "pilar": "...",
      "formato": "...",
      "rede_social": "...",
      "tema": "...",
      "horario": "...",
      "observacao": "..."
    }
  ]
}`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 3000,
    system: [
      {
        type: "text",
        text: buildSystemPrompt(),
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: prompt }],
  });

  const rawText = response.content[0].text.trim();
  const clean = rawText.replace(/^```json?\n?/, "").replace(/\n?```$/, "");

  try {
    return JSON.parse(clean);
  } catch {
    return { raw: rawText, parse_error: true };
  }
}

// ─── Gerador de variações A/B ─────────────────────────────────────────────────

async function generateABVariants({ tipo = "reels", tema, persona_id = "provedor" }) {
  const [variantA, variantB] = await Promise.all([
    generatePost({ tipo, tema, persona_id, pilar: "emocao" }),
    generatePost({ tipo, tema, persona_id, pilar: "educacao" }),
  ]);

  return {
    tema,
    variante_a: { abordagem: "Emocional/Histórias", ...variantA },
    variante_b: { abordagem: "Educacional/Desmistificação", ...variantB },
    instrucao_teste: "Publique ambas as versões em dias alternados e compare engajamento após 7 dias.",
  };
}

module.exports = { generatePost, generateMonthlyCalendar, generateABVariants, POST_TYPES, PERSONA_IDS };
