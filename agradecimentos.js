// Módulo para gerenciar agradecimentos via WhatsApp aos participantes do sorteio
// Busca participantes do Supabase e envia mensagens personalizadas

const axios = require("axios");

// Credenciais do Supabase (mesmo do sorteio-fianca)
const SUPABASE_URL = process.env.SUPABASE_URL || "https://tqenmuittslwlaeurqgt.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_KEY || "sb_publishable_IqFn5uOBeHm8bEDHwK3HUg_44xA_Pyl";

// Config WhatsApp
const WA_PHONE_NUMBER_ID = process.env.WA_PHONE_NUMBER_ID || "";
const WA_ACCESS_TOKEN = process.env.WA_ACCESS_TOKEN || "";
const GRAPH_VERSION = process.env.GRAPH_VERSION || "v21.0";

/**
 * Busca todos os participantes do sorteio no Supabase
 */
async function buscarParticipantes() {
  try {
    const response = await axios.get(
      `${SUPABASE_URL}/rest/v1/participantes`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      }
    );
    return response.data || [];
  } catch (error) {
    console.error("Erro ao buscar participantes:", error.message);
    return [];
  }
}

/**
 * Valida número de telefone (remove caracteres especiais)
 */
function validarTelefone(telefone) {
  if (!telefone) return null;
  // Remove tudo que não é número
  const numeros = telefone.replace(/\D/g, "");
  // Se começar com 0, remove (Brasil)
  const telefoneProcessado = numeros.startsWith("0") ? numeros.slice(1) : numeros;
  // Valida se tem tamanho mínimo (11 dígitos para Brasil)
  return telefoneProcessado.length >= 10 ? telefoneProcessado : null;
}

/**
 * Cria mensagem personalizada de agradecimento
 */
function criarMensagem(nome, incluirTempo = false) {
  return `Olá ${nome}, sou Fabricio da Quadrata Seguros e estou passando para te agradecer. O evento de ontem foi sensacional. Minha equipe e eu estamos a inteira disposição e em breve vamos agendar uma nova conversa com aprofundamento nas garantias de aluguéis, seguros de responsabilidade civil e operacional e consórcio. Conto com sua presença`;
}

/**
 * Envia mensagem de agradecimento via WhatsApp
 */
async function enviarAgradecimento(telefone, nome) {
  if (!WA_PHONE_NUMBER_ID || !WA_ACCESS_TOKEN) {
    throw new Error("WhatsApp não configurado (WA_PHONE_NUMBER_ID ou WA_ACCESS_TOKEN faltando)");
  }

  const telefoneValido = validarTelefone(telefone);
  if (!telefoneValido) {
    throw new Error(`Telefone inválido: ${telefone}`);
  }

  const mensagem = criarMensagem(nome);
  const numeroWhatsApp = `55${telefoneValido}`; // Adiciona código de país Brasil

  try {
    await axios.post(
      `https://graph.facebook.com/${GRAPH_VERSION}/${WA_PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: numeroWhatsApp,
        type: "text",
        text: { body: mensagem },
      },
      {
        headers: {
          Authorization: `Bearer ${WA_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
    return { sucesso: true, numero: numeroWhatsApp, nome };
  } catch (error) {
    console.error(`Erro ao enviar para ${numeroWhatsApp}:`, error.response?.data || error.message);
    throw error;
  }
}

/**
 * Envia agradecimentos para todos os participantes
 */
async function enviarAgradecimentosTodos(filtro = {}) {
  const participantes = await buscarParticipantes();

  if (!participantes.length) {
    return { sucesso: false, mensagem: "Nenhum participante encontrado" };
  }

  const resultados = {
    enviados: 0,
    erros: 0,
    detalhes: [],
  };

  // Processa com limite de taxa (delay entre envios)
  for (const p of participantes) {
    try {
      await enviarAgradecimento(p.telefone, p.nome);
      resultados.enviados++;
      resultados.detalhes.push({ nome: p.nome, status: "✅ Enviado" });
      // Delay de 1s entre mensagens para não sobrecarregar a API
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      resultados.erros++;
      resultados.detalhes.push({
        nome: p.nome,
        status: `❌ Erro: ${error.message}`,
      });
    }
  }

  return resultados;
}

/**
 * Cria HTML de visualização dos participantes
 */
async function gerarPaginaPreview() {
  const participantes = await buscarParticipantes();

  const linhasParticipantes = participantes
    .map(
      (p, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${p.nome}</td>
      <td>${p.telefone}</td>
      <td>${p.email}</td>
      <td>${p.empresa || "—"}</td>
    </tr>
  `
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Enviar Agradecimentos - WhatsApp</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      background: #f5f5f5;
      padding: 20px;
    }
    .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; padding: 30px; }
    h1 { color: #0052A3; margin-bottom: 10px; }
    p { color: #666; margin-bottom: 20px; }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .stat-box {
      background: #E6F0FF;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
    }
    .stat-number { font-size: 32px; font-weight: bold; color: #0052A3; }
    .stat-label { color: #666; font-size: 14px; }
    .preview-message {
      background: #f0f0f0;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
      border-left: 4px solid #0052A3;
      white-space: pre-wrap;
      font-family: monospace;
      font-size: 14px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th {
      background: #0052A3;
      color: white;
      padding: 12px;
      text-align: left;
      font-weight: 600;
    }
    td { padding: 12px; border-bottom: 1px solid #eee; }
    tr:hover { background: #f9f9f9; }
    .buttons {
      display: flex;
      gap: 10px;
      margin-top: 20px;
    }
    button {
      padding: 12px 24px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      font-size: 14px;
    }
    .btn-enviar {
      background: #22C55E;
      color: white;
    }
    .btn-enviar:hover { background: #16a34a; }
    .btn-cancelar {
      background: #e5e7eb;
      color: #1f2937;
    }
    .btn-cancelar:hover { background: #d1d5db; }
  </style>
</head>
<body>
  <div class="container">
    <h1>📱 Enviar Agradecimentos via WhatsApp</h1>
    <p>Envie mensagens personalizadas de agradecimento para todos os participantes do sorteio</p>

    <div class="stats">
      <div class="stat-box">
        <div class="stat-number">${participantes.length}</div>
        <div class="stat-label">Participantes</div>
      </div>
    </div>

    <h2>Pré-visualização da Mensagem</h2>
    <div class="preview-message">${criarMensagem("João Silva")}</div>

    <h2>Participantes</h2>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Nome</th>
          <th>Telefone</th>
          <th>Email</th>
          <th>Empresa</th>
        </tr>
      </thead>
      <tbody>
        ${linhasParticipantes || '<tr><td colspan="5" style="text-align: center; color: #999;">Nenhum participante encontrado</td></tr>'}
      </tbody>
    </table>

    <div class="buttons">
      <button class="btn-enviar" onclick="confirmarEnvio()">✅ Enviar ${participantes.length} Agradecimentos</button>
      <button class="btn-cancelar" onclick="window.history.back()">Cancelar</button>
    </div>
  </div>

  <script>
    function confirmarEnvio() {
      if (confirm('Tem certeza que deseja enviar agradecimentos para ${participantes.length} participantes?\n\nIsso pode levar alguns minutos.')) {
        const btn = event.target;
        btn.disabled = true;
        btn.textContent = '⏳ Enviando...';

        fetch('/api/agradecimentos/enviar', { method: 'POST' })
          .then(r => r.json())
          .then(data => {
            alert(\`✅ Conclusão!\n\nEnviados: \${data.enviados}\nErros: \${data.erros}\n\nVeja os detalhes na página anterior.\`);
            location.reload();
          })
          .catch(err => alert('❌ Erro: ' + err.message));
      }
    }
  </script>
</body>
</html>
  `;
}

module.exports = {
  buscarParticipantes,
  criarMensagem,
  enviarAgradecimento,
  enviarAgradecimentosTodos,
  gerarPaginaPreview,
  validarTelefone,
};
