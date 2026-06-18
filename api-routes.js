const express = require("express");
const router = express.Router();

// ============================================================
// Dados mock — substituir por banco de dados em producao
// ============================================================

const corretores = [
  {
    id: "1",
    nome: "Quadrata Seguros",
    email: "pfmseguros@gmail.com",
    senha: "123456",
    telefone: "11999887766",
    corretora: "Quadrata Seguros",
    susep: "15.000.000-0",
  },
];

const apolices = [
  {
    id: "1",
    numero: "APL-2024-001",
    clienteNome: "Maria Silva",
    clienteTelefone: "5511999887766",
    tipo: "auto",
    seguradora: "Porto Seguro",
    premio: 2800.0,
    vigenciaInicio: "2024-01-15",
    vigenciaFim: "2025-01-15",
    status: "ativa",
    comissao: 560.0,
  },
  {
    id: "2",
    numero: "APL-2024-002",
    clienteNome: "Joao Santos",
    clienteTelefone: "5511988776655",
    tipo: "residencial",
    seguradora: "SulAmerica",
    premio: 1200.0,
    vigenciaInicio: "2024-03-01",
    vigenciaFim: "2025-03-01",
    status: "ativa",
    comissao: 240.0,
  },
  {
    id: "3",
    numero: "APL-2024-003",
    clienteNome: "Ana Costa",
    clienteTelefone: "5511977665544",
    tipo: "vida",
    seguradora: "Bradesco Seguros",
    premio: 450.0,
    vigenciaInicio: "2024-02-10",
    vigenciaFim: "2025-02-10",
    status: "ativa",
    comissao: 135.0,
  },
  {
    id: "4",
    numero: "APL-2023-045",
    clienteNome: "Carlos Oliveira",
    clienteTelefone: "5511966554433",
    tipo: "auto",
    seguradora: "Tokio Marine",
    premio: 3200.0,
    vigenciaInicio: "2023-06-20",
    vigenciaFim: "2024-06-20",
    status: "vencida",
    comissao: 640.0,
  },
  {
    id: "5",
    numero: "APL-2024-010",
    clienteNome: "Fernanda Lima",
    clienteTelefone: "5511955443322",
    tipo: "empresarial",
    seguradora: "Allianz",
    premio: 8500.0,
    vigenciaInicio: "2024-04-01",
    vigenciaFim: "2025-04-01",
    status: "ativa",
    comissao: 1700.0,
  },
  {
    id: "6",
    numero: "APL-2024-015",
    clienteNome: "Roberto Mendes",
    clienteTelefone: "5511944332211",
    tipo: "saude",
    seguradora: "Amil",
    premio: 1800.0,
    vigenciaInicio: "2024-05-15",
    vigenciaFim: "2025-05-15",
    status: "pendente",
    comissao: 360.0,
  },
];

const cotacoes = [
  {
    id: "1",
    clienteNome: "Pedro Almeida",
    clienteTelefone: "11999001122",
    tipo: "auto",
    descricao: "Honda Civic 2023 - Cobertura completa",
    valorEstimado: 3200.0,
    status: "pendente",
    criadaEm: "2024-06-18",
  },
  {
    id: "2",
    clienteNome: "Lucia Ferreira",
    clienteTelefone: "11988112233",
    tipo: "residencial",
    descricao: "Apartamento 80m2 - Vila Mariana",
    valorEstimado: 980.0,
    status: "enviada",
    criadaEm: "2024-06-17",
  },
  {
    id: "3",
    clienteNome: "Ricardo Souza",
    clienteTelefone: "11977223344",
    tipo: "vida",
    descricao: "Seguro vida individual - Capital R$ 500k",
    valorEstimado: 120.0,
    status: "aceita",
    criadaEm: "2024-06-15",
  },
];

// ============================================================
// Auth
// ============================================================

router.post("/auth/login", (req, res) => {
  const { email, senha } = req.body;
  const corretor = corretores.find(
    (c) => c.email === email && c.senha === senha
  );
  if (!corretor) {
    return res.status(401).json({ message: "Email ou senha invalidos" });
  }
  const { senha: _, ...perfil } = corretor;
  res.json({
    token: `myseg-token-${Date.now()}`,
    perfil: {
      nome: perfil.nome,
      email: perfil.email,
      telefone: perfil.telefone,
      corretora: perfil.corretora,
      susep: perfil.susep,
    },
  });
});

// ============================================================
// Dashboard
// ============================================================

router.get("/dashboard", (_req, res) => {
  const ativas = apolices.filter((a) => a.status === "ativa");
  const hoje = new Date();
  const em30dias = new Date(hoje.getTime() + 30 * 24 * 60 * 60 * 1000);

  const vencendo = ativas.filter((a) => {
    const fim = new Date(a.vigenciaFim);
    return fim >= hoje && fim <= em30dias;
  });

  const clientes = new Set(apolices.map((a) => a.clienteNome));
  const comissoesDoMes = ativas.reduce((sum, a) => sum + a.comissao / 12, 0);
  const pendentes = cotacoes.filter((c) => c.status === "pendente");

  res.json({
    totalClientes: clientes.size,
    apolicesAtivas: ativas.length,
    cotacoesPendentes: pendentes.length,
    comissoesDoMes: Math.round(comissoesDoMes * 100) / 100,
    apolicesVencendo: vencendo.length,
    sinistrosAbertos: 3,
    ultimasAtividades: [
      {
        id: "1",
        tipo: "nova_apolice",
        descricao: "Nova apolice auto emitida",
        data: "Hoje",
        clienteNome: "Maria Silva",
      },
      {
        id: "2",
        tipo: "cotacao",
        descricao: "Cotacao residencial solicitada",
        data: "Hoje",
        clienteNome: "Joao Santos",
      },
      {
        id: "3",
        tipo: "vencimento",
        descricao: "Apolice vence em 5 dias",
        data: "18/06",
        clienteNome: "Ana Costa",
      },
      {
        id: "4",
        tipo: "sinistro",
        descricao: "Sinistro auto aberto",
        data: "17/06",
        clienteNome: "Carlos Oliveira",
      },
      {
        id: "5",
        tipo: "pagamento",
        descricao: "Comissao recebida",
        data: "16/06",
        clienteNome: "Porto Seguro",
      },
    ],
  });
});

// ============================================================
// Apolices
// ============================================================

router.get("/apolices", (_req, res) => {
  res.json(apolices);
});

router.get("/apolices/:id", (req, res) => {
  const apolice = apolices.find((a) => a.id === req.params.id);
  if (!apolice) {
    return res.status(404).json({ message: "Apolice nao encontrada" });
  }
  res.json(apolice);
});

// ============================================================
// Cotacoes
// ============================================================

router.get("/cotacoes", (_req, res) => {
  res.json(cotacoes);
});

router.post("/cotacoes", (req, res) => {
  const { clienteNome, clienteTelefone, tipo, descricao } = req.body;
  if (!clienteNome || !clienteTelefone || !tipo || !descricao) {
    return res.status(400).json({ message: "Preencha todos os campos" });
  }

  const novaCotacao = {
    id: String(cotacoes.length + 1),
    clienteNome,
    clienteTelefone,
    tipo,
    descricao,
    valorEstimado: 0,
    status: "pendente",
    criadaEm: new Date().toISOString().split("T")[0],
  };
  cotacoes.push(novaCotacao);
  res.status(201).json(novaCotacao);
});

// ============================================================
// Chat (integrado com Langflow/MarIAna)
// ============================================================

router.post("/chat", async (req, res) => {
  const { text, sessionId } = req.body;
  if (!text) {
    return res.status(400).json({ message: "Texto obrigatorio" });
  }

  const LANGFLOW_URL = process.env.LANGFLOW_URL || "http://localhost:7860";
  const LANGFLOW_FLOW_ID = process.env.LANGFLOW_FLOW_ID || "";
  const LANGFLOW_API_KEY = process.env.LANGFLOW_API_KEY || "";

  if (!LANGFLOW_FLOW_ID) {
    return res.json({
      reply:
        "MarIAna nao esta configurada no momento. Configure o LANGFLOW_FLOW_ID no servidor.",
    });
  }

  try {
    const axios = require("axios");
    const headers = { "Content-Type": "application/json" };
    if (LANGFLOW_API_KEY) headers["x-api-key"] = LANGFLOW_API_KEY;

    const response = await axios.post(
      `${LANGFLOW_URL}/api/v1/run/${LANGFLOW_FLOW_ID}`,
      {
        input_value: text,
        input_type: "chat",
        output_type: "chat",
        session_id: sessionId || `app-${Date.now()}`,
        tweaks: {},
      },
      { headers, timeout: 60000 }
    );

    const outputs = response.data?.outputs;
    const reply =
      outputs?.[0]?.outputs?.[0]?.results?.message?.text ||
      outputs?.[0]?.outputs?.[0]?.results?.message?.data?.text ||
      outputs?.[0]?.outputs?.[0]?.messages?.[0]?.message ||
      "Desculpe, nao consegui processar sua mensagem.";

    res.json({ reply });
  } catch (err) {
    console.error("Chat API erro:", err.message);
    res.json({
      reply:
        "Desculpe, estou com dificuldade tecnica no momento. Tente novamente em alguns instantes.",
    });
  }
});

// ============================================================
// Perfil
// ============================================================

router.get("/perfil", (_req, res) => {
  res.json({
    nome: "Quadrata Seguros",
    email: "pfmseguros@gmail.com",
    telefone: "11999887766",
    corretora: "Quadrata Seguros",
    susep: "15.000.000-0",
  });
});

module.exports = router;
