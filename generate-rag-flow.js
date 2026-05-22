/**
 * generate-rag-flow.js
 *
 * Lê o flow original da MarIAna e gera uma versão com RAG completo:
 *   File → SplitText → AstraDB ← Google Embeddings   (indexação)
 *   ChatInput → AstraDB → Parser → Prompt Template    (consulta)
 *
 * Uso:
 *   node generate-rag-flow.js
 * Saída:
 *   MariAna_RAG.json  ← importe no Langflow
 */

const fs = require("fs");
const path = require("path");

const INPUT  = path.join(__dirname, "MariAna_original.json");
const OUTPUT = path.join(__dirname, "MariAna_RAG.json");

const flow = JSON.parse(fs.readFileSync(INPUT, "utf8"));

// ── IDs dos nós existentes ────────────────────────────────────────────────────
const ID = {
  chatInput:   "ChatInput-gaat9",
  prompt:      "Prompt Template-fgCJI",
  agent:       "Agent-2YQ4h",
  chatOutput:  "ChatOutput-YCSYI",
  file:        "File-RWL6E",
  parser:      "ParserComponent-n06SI",
  textInput:   "TextInput-3zk8r",
  splitText:   "SplitText-9VU9F",
  embeddings:  "Google Generative AI Embeddings-gF81W",
  astraDB:     "AstraDB-QUADRATA",
};

// ── 1. Atualiza o SplitText (chunk_size e overlap) ────────────────────────────
const splitNode = flow.data.nodes.find(n => n.id === ID.splitText);
if (splitNode) {
  splitNode.data.node.template.chunk_size.value    = 700;
  splitNode.data.node.template.chunk_overlap.value = 120;
  console.log("✅ SplitText atualizado: chunk=700, overlap=120");
}

// ── 2. Atualiza o Parser para modo Stringify ──────────────────────────────────
const parserNode = flow.data.nodes.find(n => n.id === ID.parser);
if (parserNode) {
  parserNode.data.node.template.mode.value = "Stringify";
  console.log("✅ Parser atualizado: modo Stringify");
}

// ── 3. Atualiza o Prompt Template (adiciona variável {context}) ───────────────
const promptNode = flow.data.nodes.find(n => n.id === ID.prompt);
if (promptNode) {
  const tmpl = promptNode.data.node.template;

  // Adiciona campo 'context' ao template se não existir
  if (!tmpl.context) {
    tmpl.context = {
      _input_type: "MessageTextInput",
      advanced: false,
      display_name: "Contexto RAG",
      dynamic: false,
      info: "Trechos recuperados da base de documentos via RAG.",
      input_types: ["Message"],
      list: false,
      load_from_db: false,
      multiline: true,
      name: "context",
      placeholder: "",
      required: false,
      show: true,
      title_case: false,
      tool_mode: false,
      trace_as_input: true,
      trace_as_metadata: true,
      type: "str",
      value: "",
    };
  }

  // Atualiza o texto do prompt com a variável {context}
  const NOVO_PROMPT = `# MarIAna – Consultora Digital da Quadrata Seguros

Você é MarIAna, consultora digital inteligente da Quadrata Corretora.
Seu objetivo é atender com clareza, agilidade e precisão.

## Documentação de Produtos (use apenas o que for relevante):
{context}

## Mensagem do cliente:
{input}

## Diretrizes:
- Baseie suas respostas nas informações do contexto acima quando disponível
- Se o contexto não contiver a informação solicitada, informe que vai verificar
- Nunca invente coberturas, valores ou condições que não estejam no contexto
- Seja objetiva, cordial e profissional
- Para cotações específicas, peça os dados necessários (nome, CPF, dados do bem)`;

  // Encontra o campo 'template' dentro do Prompt Template (texto do prompt)
  if (tmpl.template) {
    tmpl.template.value = NOVO_PROMPT;
  }

  console.log("✅ Prompt Template atualizado com {context}");
}

// ── 4. Adiciona o nó AstraDB ──────────────────────────────────────────────────
const astraDBNode = {
  data: {
    id: ID.astraDB,
    node: {
      base_classes: ["Data", "Table"],
      beta: false,
      conditional_paths: [],
      custom_fields: {},
      description: "Implementação do AstraDB como vector store para RAG.",
      display_name: "Astra DB",
      documentation: "https://docs.langflow.org/integrations/astradb",
      edited: false,
      field_order: [
        "token", "api_endpoint", "collection_name",
        "embedding", "ingest_data", "search_input",
        "number_of_results", "search_type", "search_score_threshold",
        "namespace",
      ],
      frozen: false,
      icon: "AstraDB",
      legacy: false,
      minimized: false,
      output_types: [],
      outputs: [
        {
          allows_loop: false,
          cache: true,
          display_name: "Search Results",
          group_outputs: false,
          hidden: null,
          loop_types: null,
          method: "search_documents",
          name: "search_results",
          options: null,
          required_inputs: null,
          selected: "Data",
          tool_mode: true,
          types: ["Data", "Table"],
          value: "__UNDEFINED__",
        },
      ],
      pinned: false,
      template: {
        _type: "Component",
        token: {
          _input_type: "SecretStrInput",
          advanced: false,
          display_name: "Astra DB Application Token",
          dynamic: false,
          info: "Token de autenticação do AstraDB (começa com AstraCS:...)",
          input_types: [],
          load_from_db: false,
          name: "token",
          password: true,
          placeholder: "AstraCS:...",
          required: true,
          show: true,
          title_case: false,
          type: "str",
          value: "",
        },
        api_endpoint: {
          _input_type: "StrInput",
          advanced: false,
          display_name: "API Endpoint",
          dynamic: false,
          info: "URL do endpoint AstraDB (ex: https://xxxx-region.apps.astra.datastax.com)",
          list: false,
          load_from_db: false,
          name: "api_endpoint",
          placeholder: "https://xxxx.apps.astra.datastax.com",
          required: true,
          show: true,
          title_case: false,
          type: "str",
          value: "",
        },
        collection_name: {
          _input_type: "StrInput",
          advanced: false,
          display_name: "Collection Name",
          dynamic: false,
          info: "Nome da coleção no AstraDB. Use letras minúsculas e underscore.",
          list: false,
          load_from_db: false,
          name: "collection_name",
          placeholder: "quadrata_docs",
          required: true,
          show: true,
          title_case: false,
          type: "str",
          value: "quadrata_docs",
        },
        embedding: {
          _input_type: "HandleInput",
          advanced: false,
          display_name: "Embedding Model",
          dynamic: false,
          info: "Modelo de embeddings para indexação e busca.",
          input_types: ["Embeddings"],
          list: false,
          name: "embedding",
          required: false,
          show: true,
          title_case: false,
          type: "other",
          value: "",
        },
        ingest_data: {
          _input_type: "HandleInput",
          advanced: false,
          display_name: "Ingest Data",
          dynamic: false,
          info: "Dados a serem indexados (chunks do SplitText).",
          input_types: ["Data", "Table", "DataFrame"],
          list: true,
          name: "ingest_data",
          required: false,
          show: true,
          title_case: false,
          type: "other",
          value: "",
        },
        search_input: {
          _input_type: "MessageTextInput",
          advanced: false,
          display_name: "Search Input",
          dynamic: false,
          info: "Texto da busca semântica (pergunta do usuário).",
          input_types: ["Message"],
          list: false,
          load_from_db: false,
          name: "search_input",
          placeholder: "",
          required: false,
          show: true,
          title_case: false,
          type: "str",
          value: "",
        },
        number_of_results: {
          _input_type: "IntInput",
          advanced: false,
          display_name: "Number of Results",
          dynamic: false,
          info: "Quantidade de trechos retornados por consulta. Recomendado: 4.",
          list: false,
          name: "number_of_results",
          required: false,
          show: true,
          title_case: false,
          type: "int",
          value: 4,
        },
        search_type: {
          _input_type: "DropdownInput",
          advanced: true,
          combobox: false,
          display_name: "Search Type",
          dynamic: false,
          info: "Tipo de busca: Similarity (padrão) ou MMR (diversidade).",
          name: "search_type",
          options: ["Similarity", "MMR"],
          override_skip: false,
          placeholder: "",
          required: false,
          show: true,
          title_case: false,
          type: "str",
          value: "Similarity",
        },
        search_score_threshold: {
          _input_type: "FloatInput",
          advanced: true,
          display_name: "Search Score Threshold",
          dynamic: false,
          info: "Score mínimo de similaridade (0 = retorna tudo, 0.7 = só muito relevante).",
          name: "search_score_threshold",
          required: false,
          show: true,
          title_case: false,
          type: "float",
          value: 0,
        },
        namespace: {
          _input_type: "StrInput",
          advanced: true,
          display_name: "Namespace",
          dynamic: false,
          info: "Namespace opcional para separar coleções por produto.",
          list: false,
          load_from_db: false,
          name: "namespace",
          placeholder: "",
          required: false,
          show: true,
          title_case: false,
          type: "str",
          value: "",
        },
      },
      tool_mode: true,
    },
    showNode: true,
    type: "AstraDB",
  },
  dragging: false,
  id: ID.astraDB,
  measured: { height: 600, width: 320 },
  position: { x: 2100, y: 300 },
  selected: false,
  type: "genericNode",
};

flow.data.nodes.push(astraDBNode);
console.log("✅ Nó AstraDB adicionado");

// ── 5. Remove a aresta TextInput → SplitText ──────────────────────────────────
flow.data.edges = flow.data.edges.filter(e => {
  const remove = e.source === ID.textInput && e.target === ID.splitText;
  if (remove) console.log("🗑️  Aresta removida: TextInput → SplitText");
  return !remove;
});

// ── 6. Remove a aresta File → Agent (tool) ────────────────────────────────────
flow.data.edges = flow.data.edges.filter(e => {
  const remove = e.source === ID.file && e.target === ID.agent;
  if (remove) console.log("🗑️  Aresta removida: File → Agent (tool direto)");
  return !remove;
});

// ── Função auxiliar para criar arestas ────────────────────────────────────────
function makeEdge(sourceId, sourceName, sourceType, targetId, targetField, targetTypes) {
  const sh = `{œdataTypeœ:œ${sourceType}œ,œidœ:œ${sourceId}œ,œnameœ:œ${sourceName}œ,œoutput_typesœ:[œ${targetTypes[0]}œ]}`;
  const th = `{œfieldNameœ:œ${targetField}œ,œidœ:œ${targetId}œ,œinputTypesœ:[${targetTypes.map(t => `œ${t}œ`).join(",")}],œtypeœ:œotherœ}`;
  return {
    animated: false,
    className: "",
    data: {
      sourceHandle: { dataType: sourceType, id: sourceId, name: sourceName, output_types: targetTypes },
      targetHandle: { fieldName: targetField, id: targetId, inputTypes: targetTypes, type: "other" },
    },
    id: `reactflow__edge-${sourceId}${sh}-${targetId}${th}`,
    selected: false,
    source: sourceId,
    sourceHandle: sh,
    target: targetId,
    targetHandle: th,
  };
}

// ── 7. Adiciona novas arestas ─────────────────────────────────────────────────

// File (markdown) → SplitText
flow.data.edges.push(makeEdge(
  ID.file, "advanced_markdown", "File",
  ID.splitText, "data_inputs", ["Message", "Data", "Table"]
));
console.log("✅ Aresta adicionada: File → SplitText");

// SplitText → AstraDB (ingest_data)
flow.data.edges.push(makeEdge(
  ID.splitText, "dataframe", "SplitText",
  ID.astraDB, "ingest_data", ["Data", "Table", "DataFrame"]
));
console.log("✅ Aresta adicionada: SplitText → AstraDB (ingest)");

// Google Embeddings → AstraDB (embedding)
flow.data.edges.push(makeEdge(
  ID.embeddings, "embeddings", "Google Generative AI Embeddings",
  ID.astraDB, "embedding", ["Embeddings"]
));
console.log("✅ Aresta adicionada: Google Embeddings → AstraDB");

// ChatInput → AstraDB (search_input)
flow.data.edges.push(makeEdge(
  ID.chatInput, "message", "ChatInput",
  ID.astraDB, "search_input", ["Message"]
));
console.log("✅ Aresta adicionada: ChatInput → AstraDB (search)");

// AstraDB (search_results) → Parser (input_data)
flow.data.edges.push(makeEdge(
  ID.astraDB, "search_results", "AstraDB",
  ID.parser, "input_data", ["Data", "Table", "DataFrame"]
));
console.log("✅ Aresta adicionada: AstraDB → Parser");

// Parser → Prompt Template (context)
flow.data.edges.push(makeEdge(
  ID.parser, "parsed_text", "ParserComponent",
  ID.prompt, "context", ["Message"]
));
console.log("✅ Aresta adicionada: Parser → Prompt Template (context)");

// ── 8. Move TextInput para área de notas (desconectado, mantém o texto) ───────
const textNode = flow.data.nodes.find(n => n.id === ID.textInput);
if (textNode) {
  textNode.position = { x: 2600, y: 900 };
  console.log("📦 TextInput movido para área de notas (referência)");
}

// ── 9. Atualiza metadados do flow ─────────────────────────────────────────────
flow.name = "MariAna RAG";
flow.description = "MarIAna com RAG via AstraDB — indexação de PDFs de produtos Quadrata Seguros";

// ── 10. Salva o JSON ──────────────────────────────────────────────────────────
fs.writeFileSync(OUTPUT, JSON.stringify(flow, null, 2), "utf8");

const sizeKB = (fs.statSync(OUTPUT).size / 1024).toFixed(1);
console.log(`\n🎉 Flow RAG gerado: ${OUTPUT} (${sizeKB} KB)`);
console.log("\nPróximos passos:");
console.log("  1. Importe MariAna_RAG.json no Langflow");
console.log("  2. Configure AstraDB: token + api_endpoint");
console.log("  3. Execute o flow uma vez com os PDFs para indexar");
console.log("  4. Teste fazendo perguntas sobre os produtos\n");
