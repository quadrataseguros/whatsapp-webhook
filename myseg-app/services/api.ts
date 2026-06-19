const API_BASE = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || `Erro ${res.status}`);
  }
  return res.json();
}

export interface DashboardData {
  totalClientes: number;
  apolicesAtivas: number;
  cotacoesPendentes: number;
  comissoesDoMes: number;
  apolicesVencendo: number;
  sinistrosAbertos: number;
  ultimasAtividades: Atividade[];
}

export interface Atividade {
  id: string;
  tipo: "nova_apolice" | "sinistro" | "cotacao" | "pagamento" | "vencimento";
  descricao: string;
  data: string;
  clienteNome: string;
}

export interface Apolice {
  id: string;
  numero: string;
  clienteNome: string;
  clienteTelefone: string;
  tipo: "auto" | "vida" | "residencial" | "empresarial" | "saude";
  seguradora: string;
  premio: number;
  vigenciaInicio: string;
  vigenciaFim: string;
  status: "ativa" | "vencida" | "cancelada" | "pendente";
  comissao: number;
}

export interface Cotacao {
  id: string;
  clienteNome: string;
  clienteTelefone: string;
  tipo: "auto" | "vida" | "residencial" | "empresarial" | "saude";
  descricao: string;
  valorEstimado: number;
  status: "pendente" | "enviada" | "aceita" | "recusada";
  criadaEm: string;
}

export interface CotacaoForm {
  clienteNome: string;
  clienteTelefone: string;
  tipo: string;
  descricao: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: string;
}

export interface Perfil {
  nome: string;
  email: string;
  telefone: string;
  corretora: string;
  susep: string;
  foto?: string;
}

export const api = {
  login: (email: string, senha: string) =>
    request<{ token: string; perfil: Perfil }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, senha }),
    }),

  getDashboard: () => request<DashboardData>("/api/dashboard"),

  getApolices: () => request<Apolice[]>("/api/apolices"),
  getApolice: (id: string) => request<Apolice>(`/api/apolices/${id}`),

  getCotacoes: () => request<Cotacao[]>("/api/cotacoes"),
  criarCotacao: (data: CotacaoForm) =>
    request<Cotacao>("/api/cotacoes", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  enviarMensagemChat: (text: string, sessionId: string) =>
    request<{ reply: string }>("/api/chat", {
      method: "POST",
      body: JSON.stringify({ text, sessionId }),
    }),

  getPerfil: () => request<Perfil>("/api/perfil"),
};
