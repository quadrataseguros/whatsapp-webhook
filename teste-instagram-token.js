// ---------------------------------------------------------------------------
// teste-instagram-token.js — a política de renovação do token do Instagram,
// executando. `npm test`.
//
// O que se testa aqui não é a Meta: é a decisão de QUANDO renovar e QUAL token
// vale agora. Errar isso não quebra nada de imediato — só faz o FabrícIO
// emudecer no direct dali a alguns dias, sem erro visível para o cliente. Por
// isso os casos chatos (token trocado à mão, renovado há pouco, rede fora do
// ar) estão todos aqui.
//
// Roda em banco temporário e com a rede fingida: não fala com a Meta nem toca
// no sales.db.
// ---------------------------------------------------------------------------

const fs = require("fs");
const os = require("os");
const path = require("path");

const tmp = path.join(os.tmpdir(), `quadrata-teste-${process.pid}.db`);
for (const f of [tmp, tmp + "-wal", tmp + "-shm"]) fs.existsSync(f) && fs.unlinkSync(f);
process.on("exit", () => {
  for (const f of [tmp, tmp + "-wal", tmp + "-shm"]) {
    try { fs.unlinkSync(f); } catch (_) {}
  }
});

process.env.DB_PATH = tmp;
process.env.IG_USER_ID_FABRICIO = "1789";
process.env.IG_ACCESS_TOKEN_FABRICIO = "ENV_TOKEN_ORIGINAL";

const db = require("./db");
const personas = require("./personas");
const ig = require("./instagram-token");

const F = personas.porId("fabricio");
const M = personas.porId("mariana");
let falhas = 0;
const ok = (cond, msg) => { console.log(`${cond ? "  ok  " : "FALHOU"}  ${msg}`); if (!cond) falhas++; };

const gravar = (dados) => db.prepare(
  `INSERT INTO ig_token (persona, token, origem_env, expira_em, updated_at)
   VALUES (@persona, @token, @origem_env, @expira_em, @updated_at)
   ON CONFLICT(persona) DO UPDATE SET token=excluded.token, origem_env=excluded.origem_env,
     expira_em=excluded.expira_em, updated_at=excluded.updated_at`).run(dados);
const daquiA = (dias) => new Date(Date.now() + dias * 86400000).toISOString();
const horasAtras = (h) => {
  const d = new Date(Date.now() - h * 3600000);
  return d.toISOString().slice(0, 19).replace("T", " ");
};

console.log("\n1. Persona sem Instagram configurado");
ok(ig.tokenDe(M) === "", "MarIAna sem token → string vazia");
ok(ig.estado(M).configurado === false, "estado diz não configurado");
ok(ig.precisaRenovar(M).renovar === false, "não tenta renovar quem não tem conta");

console.log("\n2. Token só no ambiente (recém-colado no Railway)");
ok(ig.tokenDe(F) === "ENV_TOKEN_ORIGINAL", "usa o token do ambiente");
ok(ig.estado(F).renovadoAutomaticamente === false, "estado não mente sobre renovação");
ok(ig.estado(F).token === "ENV_TOKE…INAL", "estado mascara o token");
ok(ig.precisaRenovar(F).renovar === true, "vai renovar: validade desconhecida");

console.log("\n3. Depois de uma renovação (2 dias atrás, vence em 60)");
gravar({ persona: "fabricio", token: "TOKEN_RENOVADO_1", origem_env: "ENV_TOKEN_ORIGINAL",
         expira_em: daquiA(60), updated_at: horasAtras(48) });
ok(ig.tokenDe(F) === "TOKEN_RENOVADO_1", "usa o token do banco, não o do ambiente");
ok(ig.precisaRenovar(F).renovar === false, "não renova à toa");
ok(ig.estado(F).diasRestantes === 60, "estado informa 60 dias");
ok(ig.estado(F).renovadoAutomaticamente === true, "estado marca como renovado");

console.log("\n4. Renovado há menos de 24h (a Meta recusaria)");
gravar({ persona: "fabricio", token: "TOKEN_RENOVADO_2", origem_env: "ENV_TOKEN_ORIGINAL",
         expira_em: daquiA(60), updated_at: horasAtras(3) });
ok(ig.precisaRenovar(F).renovar === false, "espera completar 24h");

console.log("\n5. Faltando 10 dias para vencer");
gravar({ persona: "fabricio", token: "TOKEN_RENOVADO_3", origem_env: "ENV_TOKEN_ORIGINAL",
         expira_em: daquiA(10), updated_at: horasAtras(48) });
const r5 = ig.precisaRenovar(F);
ok(r5.renovar === true && /faltam 10 dias/.test(r5.motivo), `renova a tempo (${r5.motivo})`);

console.log("\n6. Alguém trocou a variável no Railway (reautenticação)");
F.igAccessToken = "ENV_TOKEN_NOVO";
ok(ig.tokenDe(F) === "ENV_TOKEN_NOVO", "mão humana ganha da cadeia antiga");
ok(ig.estado(F).renovadoAutomaticamente === false, "estado volta a dizer que veio do ambiente");
ok(ig.precisaRenovar(F).renovar === true, "recomeça a cadeia do token novo");

console.log("\n7. Token vencido, sem ninguém ter mexido");
F.igAccessToken = "ENV_TOKEN_ORIGINAL";
gravar({ persona: "fabricio", token: "TOKEN_VENCIDO", origem_env: "ENV_TOKEN_ORIGINAL",
         expira_em: daquiA(-3), updated_at: horasAtras(80 * 24) });
ok(ig.precisaRenovar(F).renovar === true, "ainda tenta (e o erro da Meta vira log claro)");
ok(ig.estado(F).diasRestantes === -3, "estado mostra o prazo negativo");

// --- a partir daqui, com a rede fingida --------------------------------------
const responder = (status, corpo) => {
  global.fetch = async () => ({
    ok: status < 400,
    status,
    text: async () => JSON.stringify(corpo),
  });
};

(async () => {
  console.log("\n8. A Meta renova (resposta de sucesso)");
  F.igAccessToken = "ENV_TOKEN_ORIGINAL";
  gravar({ persona: "fabricio", token: "TOKEN_ANTIGO", origem_env: "ENV_TOKEN_ORIGINAL",
           expira_em: daquiA(5), updated_at: horasAtras(48) });
  responder(200, { access_token: "TOKEN_FRESQUINHO", token_type: "bearer", expires_in: 5184000 });
  const r8 = await ig.renovarPersona(F);
  ok(r8.renovado === true, "reporta renovação");
  ok(ig.tokenDe(F) === "TOKEN_FRESQUINHO", "passa a usar o token novo na hora");
  ok(ig.estado(F).diasRestantes === 60, "validade volta para 60 dias");
  ok(ig.precisaRenovar(F).renovar === false, "e para de tentar");

  console.log("\n9. A Meta recusa: token com menos de 24h");
  gravar({ persona: "fabricio", token: "TOKEN_NOVINHO", origem_env: "ENV_TOKEN_ORIGINAL",
           expira_em: null, updated_at: horasAtras(48) });
  responder(400, { error: { message: "Token has not been refreshed in over 24 hours", code: 190 } });
  const r9 = await ig.renovarPersona(F);
  ok(r9.renovado === false && r9.erro !== true, "não é tratado como erro — passa sozinho");
  ok(ig.tokenDe(F) === "TOKEN_NOVINHO", "mantém o token que estava valendo");

  console.log("\n10. A Meta recusa: token inválido");
  responder(400, { error: { message: "Invalid OAuth access token", code: 190, type: "OAuthException" } });
  const r10 = await ig.renovarPersona(F);
  ok(r10.renovado === false && r10.erro === true, "esse sim vira erro, com instrução no log");

  console.log("\n11. Rede no meio do caminho (proxy devolvendo HTML)");
  global.fetch = async () => ({ ok: false, status: 403, text: async () => "<html>bloqueado</html>" });
  const r11 = await ig.renovarPersona(F);
  ok(r11.renovado === false && r11.erro !== true, "não culpa o token quando o problema é a rede");

  console.log("\n12. fetch estourando (DNS fora)");
  global.fetch = async () => { throw new Error("getaddrinfo ENOTFOUND"); };
  const r12 = await ig.renovarPersona(F);
  ok(r12.renovado === false && r12.erro !== true, "sobrevive e tenta de novo depois");

  console.log("\n13. A Meta recusa GET e aceita POST");
  gravar({ persona: "fabricio", token: "TOKEN_PRA_RENOVAR", origem_env: "ENV_TOKEN_ORIGINAL",
           expira_em: daquiA(5), updated_at: horasAtras(48) });
  const metodos = [];
  global.fetch = async (url, opcoes) => {
    metodos.push(opcoes?.method || "GET");
    if (!opcoes || opcoes.method !== "POST") {
      return { ok: false, status: 400, text: async () => JSON.stringify({
        error: { message: "Unsupported request - method type: get", code: 100 } }) };
    }
    return { ok: true, status: 200, text: async () => JSON.stringify({
      access_token: "TOKEN_VIA_POST", token_type: "bearer", expires_in: 5184000 }) };
  };
  const r13 = await ig.renovarPersona(F);
  ok(r13.renovado === true, "renova mesmo assim, caindo para POST");
  ok(metodos.join(">") === "GET>POST", `tenta GET e depois POST (${metodos.join(">")})`);
  ok(ig.tokenDe(F) === "TOKEN_VIA_POST", "guarda o token que veio do POST");

  console.log("\n14. Recusa que não é de método não vira POST");
  // O 13 acabou de renovar: sem voltar o relógio, o 14 nem chegaria a chamar.
  gravar({ persona: "fabricio", token: "TOKEN_PRA_RENOVAR", origem_env: "ENV_TOKEN_ORIGINAL",
           expira_em: daquiA(5), updated_at: horasAtras(48) });
  global.fetch = async (url, opcoes) => ({
    ok: false, status: 400,
    text: async () => JSON.stringify({ error: { message: "Invalid OAuth access token", code: 190 } }),
  });
  const chamadas = [];
  const originalFetch = global.fetch;
  global.fetch = async (u, o) => { chamadas.push(o?.method || "GET"); return originalFetch(u, o); };
  const r14 = await ig.renovarPersona(F);
  ok(r14.renovado === false && chamadas.length === 1, "tenta uma vez só e reporta o erro de verdade");

  console.log("\n15. O token vai no cabeçalho, não na query");
  gravar({ persona: "fabricio", token: "TOKEN_PRA_RENOVAR", origem_env: "ENV_TOKEN_ORIGINAL",
           expira_em: daquiA(5), updated_at: horasAtras(48) });
  let primeira = null;
  global.fetch = async (url, opcoes) => {
    primeira = primeira || { url: String(url), headers: opcoes?.headers || {} };
    return { ok: true, status: 200, text: async () => JSON.stringify({
      access_token: "TOKEN_OK", token_type: "bearer", expires_in: 5184000 }) };
  };
  await ig.renovarPersona(F);
  ok(primeira.headers.Authorization === "Bearer TOKEN_PRA_RENOVAR",
     "primeira tentativa manda Authorization: Bearer");
  ok(!primeira.url.includes("access_token="),
     "e não repete o token na query na mesma tentativa");

  console.log(falhas ? `\n${falhas} falha(s)\n` : "\nTudo passou\n");
  process.exit(falhas ? 1 : 0);
})();
