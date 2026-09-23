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
// Mesma versão que o envio de mensagem usa em index.js.
const VERSAO = "v21.0";

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
const gravarLigacao = db.prepare(
  `INSERT INTO ig_token (persona, token, origem_env, expira_em, ig_id, username, updated_at)
        VALUES (@persona, @token, @origem_env, @expira_em, @ig_id, @username, datetime('now','localtime'))
   ON CONFLICT(persona) DO UPDATE SET
        token      = excluded.token,
        origem_env = excluded.origem_env,
        expira_em  = excluded.expira_em,
        ig_id      = excluded.ig_id,
        username   = excluded.username,
        updated_at = excluded.updated_at`
);
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
  if (!linha) return env;
  // Ligado pelo navegador e sem variável no ambiente: é o que vale.
  if (linha.origem_env === LIGADO_PELO_NAVEGADOR) return env || linha.token;
  // A variável mudou: é reautenticação, e ela manda.
  if (linha.origem_env !== env) return env;
  return linha.token || env;
}

// Id da conta que vale agora. Mesma regra do token: o que foi ligado pelo
// navegador manda, e o ambiente é a semente de quem ainda não ligou.
function idDe(persona) {
  const p = typeof persona === "string" ? personas.porId(persona) : persona;
  if (!p) return "";
  const linha = ler.get(p.id);
  if (linha && linha.ig_id && linha.origem_env === LIGADO_PELO_NAVEGADOR) {
    return linha.ig_id;
  }
  return p.igUserId || "";
}

// Marca a cadeia que nasceu do login pelo navegador, em vez de uma variável de
// ambiente. Como não há token de ambiente para comparar, este valor faz o
// papel dele: enquanto ninguém mexer nas variáveis, o que o navegador ligou é
// o que vale.
const LIGADO_PELO_NAVEGADOR = "(ligado pelo navegador)";

// Guarda o que veio do login: token, validade, id e @ da conta.
function ligar({ persona, token, expiraEm, igId, username }) {
  gravarLigacao.run({
    persona,
    token,
    origem_env: LIGADO_PELO_NAVEGADOR,
    expira_em: expiraEm || null,
    ig_id: igId || null,
    username: username || null,
  });
  console.log(`[IG] Conta @${username || igId} ligada à persona ${persona}`);
}

// Estado legível para o /health e para o painel. Sem token no meio.
function estado(persona) {
  const p = typeof persona === "string" ? personas.porId(persona) : persona;
  if (!p) return null;
  const env = p.igAccessToken || "";
  const linha = ler.get(p.id);
  const peloNavegador = Boolean(linha && linha.origem_env === LIGADO_PELO_NAVEGADOR);
  if (!tokenDe(p) || !idDe(p)) return { configurado: false };
  const renovado = Boolean(linha && (linha.origem_env === env || peloNavegador));
  return {
    configurado: true,
    conta: linha && linha.username ? `@${linha.username}` : undefined,
    ligadoPeloNavegador: peloNavegador || undefined,
    token: mascarar(tokenDe(p)),
    renovadoAutomaticamente: Boolean(renovado),
    expiraEm: renovado ? linha.expira_em : null,
    diasRestantes: renovado ? emDias(linha.expira_em) : null,
    ultimaRenovacao: renovado ? linha.updated_at : null,
  };
}

// Como o token viaja importa mais do que o método. A documentação mostra
// ?access_token= na query; com a query, a Meta responde "Unsupported request",
// que soa como rota errada e é ela não reconhecendo a autenticação. O que
// funciona nesta API, e é o que sendInstagramReply já faz, é o cabeçalho
// Authorization: Bearer. Tenta-se o que se sabe que funciona e, se não for
// aceito, as outras formas — se a Meta mudar de ideia, a renovação segue de pé
// em vez de o token vencer em silêncio.
async function chamarRenovacao(token) {
  const formas = [];
  for (const base of [API, `${API}/${VERSAO}`]) {
    for (const auth of ["header", "query"]) {
      for (const metodo of ["GET", "POST"]) formas.push({ base, auth, metodo });
    }
  }

  const erros = [];
  for (const { base, auth, metodo } of formas) {
    const params = new URLSearchParams({ grant_type: "ig_refresh_token" });
    const headers = {};
    if (auth === "header") headers.Authorization = `Bearer ${token}`;
    else params.set("access_token", token);

    const url = `${base}/refresh_access_token`;
    const opcoes = { method: metodo, headers };
    if (metodo === "POST") {
      headers["Content-Type"] = "application/x-www-form-urlencoded";
      opcoes.body = params;
    }

    let r;
    try {
      r = await fetch(metodo === "GET" ? `${url}?${params.toString()}` : url, opcoes);
    } catch (err) {
      // Sem resposta: é rede, e nenhuma outra forma vai adiantar.
      throw new Error(`rede: não cheguei em ${API} (${err.message})`);
    }
    const texto = await r.text();
    let corpo;
    try {
      corpo = JSON.parse(texto);
    } catch {
      throw new Error(`resposta não-JSON (${r.status}) — algo no caminho, não a Meta`);
    }
    if (r.ok && !corpo.error) {
      if (erros.length) console.log(`[IG] Renovação aceita em ${metodo} ${url} (token no ${auth})`);
      return corpo; // { access_token, token_type, expires_in }
    }
    const e = corpo.error || {};
    const msg = e.message || texto;
    // Só forma não reconhecida autoriza tentar a próxima. Credencial recusada
    // sobe na hora: insistir esconderia o motivo e gastaria chamada à toa.
    if (!/Unsupported request|method type|Unknown path|does not exist|access_token is required/i.test(msg)) {
      throw new Error(`${msg} (código ${e.code ?? r.status})`);
    }
    erros.push(`${metodo} ${url} (${auth}): ${msg}`);
  }
  throw new Error(`nenhuma forma conhecida foi aceita — ${erros[0]}`);
}

// Precisa renovar? Sim quando não sabemos a validade (token novo, vindo do
// ambiente) ou quando falta pouco. E não antes de 24h de vida, que a Meta
// recusa.
function precisaRenovar(p) {
  const env = p.igAccessToken || "";
  if (!tokenDe(p) || !idDe(p)) return { renovar: false, motivo: "sem Instagram" };

  const linha = ler.get(p.id);
  if (!linha) return { renovar: true, motivo: "token novo no ambiente — validade desconhecida" };
  if (linha.origem_env !== env && linha.origem_env !== LIGADO_PELO_NAVEGADOR) {
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

// Fluxo completo a partir do código que o Instagram devolveu no navegador:
// troca por token curto, emenda no de 60 dias, confirma de quem é a conta e
// grava. É o que a rota /instagram/callback chama.
async function ligarPeloCodigo({ code, appId, appSecret, redirectUri, persona }) {
  if (!appId || !appSecret) throw new Error("IG_APP_ID/IG_APP_SECRET não configurados");

  const corpo = new URLSearchParams({
    client_id: appId,
    client_secret: appSecret,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
    code,
  });

  const curto = await responder(
    await fetch("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: corpo,
    })
  );

  // O token de uma hora não serve para um servidor que atende 24h.
  // Aqui o token vai na query: com ele só no cabeçalho a Meta responde "The
  // parameter access_token is required" — visto na primeira troca de verdade.
  const longo = await responder(
    await fetch(
      `${API}/access_token?grant_type=ig_exchange_token` +
        `&client_secret=${encodeURIComponent(appSecret)}` +
        `&access_token=${encodeURIComponent(curto.access_token)}`
    )
  );

  const token = longo.access_token || curto.access_token;
  const expiraEm = longo.expires_in
    ? new Date(Date.now() + longo.expires_in * 1000).toISOString()
    : null;

  // Confirmar a conta antes de gravar: ligar a persona errada não daria erro
  // nenhum, só silêncio no direct de quem devia responder.
  let eu = {};
  try {
    eu = await responder(
      await fetch(`${API}/${VERSAO}/me?fields=id,user_id,username`, {
        headers: { Authorization: `Bearer ${token}` },
      })
    );
  } catch (err) {
    console.error(`[IG] Liguei a conta mas não confirmei o @: ${err.message}`);
  }

  ligar({
    persona,
    token,
    expiraEm,
    // O id que casa com o entry[0].id do webhook é o app-scoped.
    // Nunca curto.user_id: ele chega como número JSON maior que 2^53 e o
    // parse arredonda os últimos dígitos — um id errado que não dá erro,
    // só faz o webhook não reconhecer a conta. O /me devolve o id como texto.
    igId: eu.id,
    username: eu.username,
  });

  if (!eu.id) throw new Error("token obtido, mas não consegui confirmar a conta pelo /me");
  return {
    username: eu.username,
    id: eu.id,
    dias: Math.round((longo.expires_in || 0) / 86400) || 1,
  };
}

// Lê a resposta da Meta, que é sempre JSON — inclusive no erro.
async function responder(r) {
  const texto = await r.text();
  let corpo;
  try {
    corpo = JSON.parse(texto);
  } catch {
    throw new Error(`${r.status}: resposta não-JSON — ${texto.slice(0, 160)}`);
  }
  if (!r.ok || corpo.error || corpo.error_message) {
    const e = corpo.error || {};
    throw new Error(e.message || corpo.error_message || `${r.status}: ${texto.slice(0, 160)}`);
  }
  return corpo;
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

module.exports = { tokenDe, idDe, ligar, ligarPeloCodigo, estado, precisaRenovar, iniciar, verificarTodas, renovarPersona };
