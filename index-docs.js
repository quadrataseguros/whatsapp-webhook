/**
 * index-docs.js
 *
 * Indexa os PDFs de condições gerais no Langflow (vector store RAG).
 * Envia cada arquivo via upload API e aciona o flow de indexação.
 *
 * Uso:
 *   node index-docs.js              → indexa toda a pasta ./docs
 *   node index-docs.js ./docs/auto  → indexa só a pasta de auto
 *
 * Pré-requisito: .env com LANGFLOW_URL, LANGFLOW_FLOW_ID_RAG, LANGFLOW_API_KEY
 */

const axios = require("axios");
const fs = require("fs");
const path = require("path");

// ── Carrega .env manualmente ───────────────────────────────────────────────────
const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, "utf8")
    .split("\n")
    .forEach((line) => {
      const [k, ...v] = line.split("=");
      if (k && v.length && !k.startsWith("#")) {
        process.env[k.trim()] = v.join("=").trim();
      }
    });
}

const LANGFLOW_URL = process.env.LANGFLOW_URL || "http://localhost:7860";
const LANGFLOW_FLOW_ID_RAG = process.env.LANGFLOW_FLOW_ID_RAG || "";
const LANGFLOW_API_KEY = process.env.LANGFLOW_API_KEY || "";
const DOCS_DIR = process.argv[2] || "./docs";

if (!LANGFLOW_FLOW_ID_RAG) {
  console.error("❌ LANGFLOW_FLOW_ID_RAG não configurado no .env");
  console.error("   Configure o ID do flow de indexação no Langflow.");
  process.exit(1);
}

const authHeader = LANGFLOW_API_KEY ? { "x-api-key": LANGFLOW_API_KEY } : {};

// ── Detecta categoria do produto pelo caminho do arquivo ──────────────────────
// Usar subpastas deixa explícito: docs/auto/condicoes.pdf → "seguro-auto"
const PRODUCT_MAP = {
  auto: "seguro-auto",
  residencial: "seguro-residencial",
  saude: "plano-saude",
  emprestimo: "emprestimo",
  consorcio: "consorcio",
};

function detectProduct(filePath) {
  const parts = filePath.replace(/\\/g, "/").split("/");
  for (const part of parts) {
    if (PRODUCT_MAP[part]) return PRODUCT_MAP[part];
  }
  const lower = path.basename(filePath).toLowerCase();
  if (lower.includes("auto") || lower.includes("veiculo")) return "seguro-auto";
  if (lower.includes("residencial") || lower.includes("imovel")) return "seguro-residencial";
  if (lower.includes("saude") || lower.includes("plano")) return "plano-saude";
  if (lower.includes("emprestimo") || lower.includes("credito")) return "emprestimo";
  if (lower.includes("consorcio")) return "consorcio";
  return "geral";
}

// ── Upload de arquivo via multipart/form-data (sem dependências extras) ────────
async function uploadFile(filePath, flowId) {
  const filename = path.basename(filePath);
  const fileBuffer = fs.readFileSync(filePath);
  const boundary = `----FormBoundary${Date.now().toString(36)}`;
  const CRLF = "\r\n";

  const head = Buffer.from(
    `--${boundary}${CRLF}` +
      `Content-Disposition: form-data; name="file"; filename="${filename}"${CRLF}` +
      `Content-Type: application/pdf${CRLF}${CRLF}`
  );
  const foot = Buffer.from(`${CRLF}--${boundary}--${CRLF}`);
  const body = Buffer.concat([head, fileBuffer, foot]);

  const res = await axios.post(
    `${LANGFLOW_URL}/api/v1/files/upload/${flowId}`,
    body,
    {
      headers: {
        ...authHeader,
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
        "Content-Length": body.length,
      },
      maxBodyLength: 50 * 1024 * 1024, // 50 MB
    }
  );

  return res.data.file_path;
}

// ── Aciona o flow de indexação com o arquivo e seus metadados ─────────────────
async function indexFile(uploadedPath, product) {
  await axios.post(
    `${LANGFLOW_URL}/api/v1/run/${LANGFLOW_FLOW_ID_RAG}`,
    {
      input_value: uploadedPath,
      input_type: "chat",
      output_type: "chat",
      tweaks: {
        // Passa metadados de produto para o nó de split/embed do Langflow
        // (ajuste o nome do nó conforme o seu flow)
        "RecursiveCharacterTextSplitter-0": {
          chunk_size: 700,
          chunk_overlap: 120,
          metadata: { product },
        },
      },
    },
    { headers: { ...authHeader, "Content-Type": "application/json" } }
  );
}

// ── Coleta todos os PDFs recursivamente ───────────────────────────────────────
function collectPdfs(dir) {
  if (!fs.existsSync(dir)) return [];
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectPdfs(full));
    } else if (entry.name.toLowerCase().endsWith(".pdf")) {
      results.push(full);
    }
  }
  return results;
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  console.log("📚 Indexador RAG — Quadrata Seguros\n");
  console.log(`📡 Langflow : ${LANGFLOW_URL}`);
  console.log(`🔗 Flow RAG : ${LANGFLOW_FLOW_ID_RAG}`);
  console.log(`📁 Diretório: ${DOCS_DIR}\n`);

  const files = collectPdfs(DOCS_DIR);

  if (files.length === 0) {
    console.warn(`⚠️  Nenhum PDF encontrado em "${DOCS_DIR}"`);
    console.warn("   Coloque os PDFs nas subpastas:");
    console.warn("   docs/auto/        → condições de seguro auto");
    console.warn("   docs/residencial/ → condições de seguro residencial");
    console.warn("   docs/saude/       → planos de saúde");
    console.warn("   docs/emprestimo/  → tabelas e condições de empréstimo");
    console.warn("   docs/consorcio/   → regulamento de consórcio");
    process.exit(0);
  }

  console.log(`📄 ${files.length} arquivo(s) encontrado(s):\n`);

  let success = 0;
  let errors = 0;

  for (const file of files) {
    const product = detectProduct(file);
    const label = `${path.relative(DOCS_DIR, file)} [${product}]`;
    process.stdout.write(`  📄 ${label}... `);

    try {
      const uploadedPath = await uploadFile(file, LANGFLOW_FLOW_ID_RAG);
      await indexFile(uploadedPath, product);
      console.log("✅ indexado");
      success++;
    } catch (err) {
      const detail = err.response?.data?.detail || err.message;
      console.log(`❌ ${detail}`);
      errors++;
    }
  }

  console.log(`\n📊 ${success} indexado(s) • ${errors} erro(s)`);

  if (success > 0) {
    console.log("\n✅ Pronto! A MarIAna agora consulta esses documentos via RAG.");
    console.log("   Respostas rápidas: só os trechos relevantes chegam ao LLM.\n");
  }
}

main();
