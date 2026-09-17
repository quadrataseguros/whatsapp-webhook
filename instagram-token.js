// ---------------------------------------------------------------------------
// instagram-token.js — mantém vivo o token do Instagram de cada persona.
//
// O token da "Instagram API with Instagram Login" vale 60 dias. Vencido, o
// endpoint de mensagens passa a recusar tudo e a persona para de responder
// direct — sem erro visível para o cliente, que só acha que ninguém atendeu.
// Não dá para deixar isso dependendo de alguém lembrar a cada dois meses.
//
// A Meta renova o token em uma chamada (refresh_access_token), com duas
// regras: só depois de 24h de vida, e só antes de vencer. O servidor faz essa
// chamada sozinho e guarda o resultado no SQLite, porque a variável de
// ambiente ele não consegue reescrever.
//
// Quem manda:
//   1. a variável de ambiente, SE ela mudou desde a última vez — mão humana
//      (reautenticou, trocou de conta) sempre ganha, e a cadeia recomeça dali;
//   2. senão, o token do banco, que é o mais novo da cadeia.
//
// Uma renovação bem-sucedida vale 60 dias contados do dia em que aconteceu,
// então renovar cedo não encurta nada — só antecipa a próxima folga.
// ---------------------------------------------------------------------------

const db = require("./db");
const personas = require("./personas");

const API = "https://graph.instagram.com";

// Renova quando faltam menos de 20 dias. Sobra margem para o servidor ficar
// fora do ar semanas seguidas (Railway dormindo, deploy parado) e ainda
// encontrar a janela antes do vencimento.
const RENOVAR_FALTANDO_DIAS = 20;
// De quanto em quanto tempo olhar. Com a margem acima, uma vez por dia basta
// e ainda sobram 20 chances antes de vencer.
const INTERVALO_MS = 12 * 60 * 60 * 1000;
// A Meta recusa renovar token com menos de 24h. Depois de uma troca manual é
// normal esperar — não é erro, é só cedo.
const IDADE_MINIMA_MS = 25 * 60 * 60 * 1000;

const ler = db.prepare("SELECT * FROM ig_token WHERE persona = ?");
const gravar = db.prepare(
  `INSERT INTO ig_token (persona, token, origem_env, expira_em, updated_at)
        VALUES (@persona, @token, @origem_env, @expira_em, datetime('now','localtime'))
   ON CONFLICT(persona) DO UPDATE SET
        token      = excluded.token,
        origem_env = excluded.origem_env,
        expira_em  = excluded.expira_em,
        updated_at = excluded.updated_at`
);

const mascarar = (t) => {
  if (!t) return "—";
  return t.length > 14 ? `${t.slice(0, 8)}…${t.slice(-4)}` : `${t.slice(0, 4)}…`;
};
const emDias = (iso) =>
  iso ? Math.round((new Date(iso) - Date.now()) / 86400000) : null;

// Token que vale agora para esta persona. É o que o envio de mensagem usa —
// nunca `p.igAccessToken` direto, que é só a semente.
function tokenDe(persona) {
  const p = typeof persona === "string" ? personas.porId(persona) : persona;
  if (!p) return "";
  const env = p.igAccessToken || "";
  const linha = ler.get(p.id);
  // A variável mudou: é reautenticação, e ela manda.
  if (!linha || linha.origem_env !== env) return env;
  return linha.token || env;
}

// Estado legível para o /health e para o painel. Sem token no meio.
function estado(persona) {
  const p = typeof persona === "string" ? personas.porId(persona) : persona;
  if (!p) return null;
  const env = p.igAccessToken || "";
  if (!p.igUserId || !env) return { configurado: false };
  const linha = ler.get(p.id);
  const renovado = linha && linha.origem_env === env;
  return {
    configurado: true,
    token: mascarar(tokenDe(p)),
    renovadoAutomaticamente: Boolean(renovado),
    expiraEm: renovado ? linha.expira_em : null,
    diasRestantes: renovado ? emDias(linha.expira_em) : null,
    ultimaRenovacao: renovado ? linha.updated_at : null,
  };
}

async function chamarRenovacao(token) {
  let r;
  try {
    r = await fetch(
      `${API}/refresh_access_token?grant_type=ig_refresh_token` +
        `&access_token=${encodeURIComponent(token)}`
    );
  } catch (err) {
    // DNS, socket, Meta fora do ar — não chegou a haver resposta.
    throw new Error(`rede: não cheguei em ${API} (${err.message})`);
  }
  const texto = await r.text();
  let corpo;
  try {
    corpo = JSON.parse(texto);
  } catch {
    throw new Error(`resposta não-JSON (${r.status}) — algo no caminho, não a Meta`);
  }
  if (!r.ok || corpo.error) {
    const e = corpo.error || {};
    throw new Error(`${e.message || texto} (código ${e.code ?? r.status})`);
  }
  return corpo; // { access_token, token_type, expires_in }
}

// Precisa renovar? Sim quando não sabemos a validade (token novo, vindo do
// ambiente) ou quando falta pouco. E não antes de 24h de vida, que a Meta
// recusa.
function precisaRenovar(p) {
  const env = p.igAccessToken || "";
  if (!p.igUserId || !env) return { renovar: false, motivo: "sem Instagram" };

  const linha = ler.get(p.id);
  if (!linha || linha.origem_env !== env) {
    return { renovar: true, motivo: "token novo no ambiente — validade desconhecida" };
  }
  const idade = Date.now() - new Date(linha.updated_at).getTime();
  if (idade < IDADE_MINIMA_MS) {
    return { renovar: false, motivo: "renovado há menos de 24h" };
  }
  const dias = emDias(linha.expira_em);
  if (dias === null) return { renovar: true, motivo: "validade desconhecida" };
  if (dias <= RENOVAR_FALTANDO_DIAS) {
    return { renovar: true, motivo: `faltam ${dias} dias` };
  }
  return { renovar: false, motivo: `ainda faltam ${dias} dias` };
}

async function renovarPersona(p) {
  const { renovar, motivo } = precisaRenovar(p);
  if (!renovar) return { persona: p.id, renovado: false, motivo };

  const atual = tokenDe(p);
  try {
    const r = await chamarRenovacao(atual);
    const expira = new Date(Date.now() + (r.expires_in || 0) * 1000).toISOString();
    gravar.run({
      persona: p.id,
      token: r.access_token,
      origem_env: p.igAccessToken || "",
      expira_em: expira,
    });
    console.log(
      `[IG] Token do ${p.nome} renovado (${motivo}) — vale por ${Math.round(
        (r.expires_in || 0) / 86400
      )} dias`
    );
    return { persona: p.id, renovado: true, motivo };
  } catch (err) {
    // Três falhas diferentes, três reações diferentes. Tratar as três como
    // "erro" faria a única que pede ação humana se perder no meio das outras.
    //
    //   cedo — token com menos de 24h, o normal logo depois de uma troca
    //          manual. Passa sozinho no próximo ciclo.
    //   rede — não chegou na Meta (proxy, DNS, Meta fora do ar). Nada a
    //          fazer: a próxima tentativa é daqui a 12 horas.
    //   auth — a Meta recusou o token. Essa não se resolve sozinha.
    const cedo = /24 hours|too soon|not.*old enough/i.test(err.message);
    const rede = /^rede:|não-JSON/i.test(err.message);
    const log = cedo || rede ? console.log : console.error;
    log(`[IG] Não renovei o token do ${p.nome}: ${err.message}`);
    if (!cedo && !rede) {
      log(
        `[IG] A Meta recusou. Gere outro token pelo login e troque ${
          p.id === personas.padrao().id ? "IG_ACCESS_TOKEN" : "IG_ACCESS_TOKEN_FABRICIO"
        } — ver README, "Ligar o Instagram de uma persona".`
      );
    }
    return { persona: p.id, renovado: false, motivo: err.message, erro: !cedo && !rede };
  }
}

async function verificarTodas() {
  const resultados = [];
  for (const p of Object.values(personas.PERSONAS)) {
    resultados.push(await renovarPersona(p));
  }
  return resultados;
}

// Chamado uma vez no boot. A primeira verificação sai com um minuto de atraso
// para não disputar a subida do servidor com o health check do Railway.
function iniciar() {
  const agenda = () => {
    verificarTodas().catch((err) => console.error("[IG] Verificação falhou:", err.message));
  };
  setTimeout(agenda, 60 * 1000).unref?.();
  setInterval(agenda, INTERVALO_MS).unref?.();
}

module.exports = { tokenDe, estado, precisaRenovar, iniciar, verificarTodas, renovarPersona };
