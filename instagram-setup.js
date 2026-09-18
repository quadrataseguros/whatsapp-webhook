#!/usr/bin/env node
// ---------------------------------------------------------------------------
// instagram-setup.js — liga (e mantém ligada) a conta de Instagram de uma
// persona.
//
// O servidor fala com o Instagram por `graph.instagram.com` (ver
// sendInstagramReply em index.js): é a "Instagram API with Instagram Login",
// em que o token pertence à CONTA do Instagram, não a uma Página do Facebook.
// Por isso o caminho do Graph API Explorer — token de Página em
// graph.facebook.com — não serve aqui: gera um token que o endpoint de
// mensagens não aceita.
//
// O token que sai do login vale UMA HORA. Um servidor que atende 24h precisa
// do token longo (60 dias), e precisa renovar antes de vencer. É isso que os
// três comandos abaixo fazem.
//
//   node instagram-setup.js diagnostico <token>
//   node instagram-setup.js trocar      <token-curto> <app-secret>
//   node instagram-setup.js renovar     <token-longo>
//
// Todos aceitam --persona=fabricio|mariana (padrão: fabricio) para imprimir o
// nome certo das variáveis no fim.
//
// ATENÇÃO: a saída de `trocar` e `renovar` contém um token — é segredo. Vai
// para as variáveis do Railway, nunca para dentro do repositório.
// ---------------------------------------------------------------------------

const API = "https://graph.instagram.com";
const VERSAO = "v21.0";

const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const flags = Object.fromEntries(
  process.argv
    .slice(2)
    .filter((a) => a.startsWith("--"))
    .map((a) => a.replace(/^--/, "").split("="))
);

const PERSONA = (flags.persona || "fabricio").toLowerCase();
const VARS =
  PERSONA === "mariana"
    ? { id: "IG_USER_ID", token: "IG_ACCESS_TOKEN" }
    : { id: "IG_USER_ID_FABRICIO", token: "IG_ACCESS_TOKEN_FABRICIO" };

const mascarar = (t) => (t.length > 14 ? `${t.slice(0, 8)}…${t.slice(-4)}` : "…");
const dias = (segundos) => Math.round(segundos / 86400);

async function pegar(url) {
  let r;
  try {
    r = await fetch(url);
  } catch (err) {
    throw new Error(`rede: não consegui falar com ${API} (${err.message})`);
  }

  const texto = await r.text();
  let corpo;
  try {
    corpo = JSON.parse(texto);
  } catch {
    // Resposta que não é JSON quase sempre é intermediário — proxy corporativo,
    // firewall, captive portal. A Meta sempre responde JSON, inclusive no erro.
    throw new Error(
      `${r.status}: a resposta não veio da Meta (não é JSON). ` +
        `Rode este comando numa rede sem proxy.`
    );
  }

  if (!r.ok || corpo.error) {
    const e = corpo.error || {};
    const detalhe = e.message || (texto.trim() && texto) || "sem corpo";
    throw new Error(`${r.status} ${e.type || "erro"} (código ${e.code ?? "?"}): ${detalhe}`);
  }
  return corpo;
}

// --- diagnóstico ----------------------------------------------------------
// Responde as três perguntas que importam antes de salvar qualquer coisa:
// o token é válido, é da conta certa, e dá para publicar com ele.
async function diagnostico(token) {
  console.log("\nConsultando a conta…\n");

  const eu = await pegar(
    `${API}/${VERSAO}/me?fields=id,user_id,username,name,account_type&access_token=${token}`
  );

  console.log(`  Conta      @${eu.username}`);
  if (eu.name) console.log(`  Nome       ${eu.name}`);
  console.log(`  Tipo       ${eu.account_type || "(não informado)"}`);
  console.log(`  Token      ${mascarar(token)}`);

  // A mesma conta tem dois IDs e eles NÃO são intercambiáveis: `user_id` é a
  // conta profissional (o 17841… que o painel mostra na tabela de contas) e
  // `id` é o app-scoped, específico da relação conta↔app. Pôr o errado na
  // variável não dá erro nenhum: o webhook chega, porInstagram() não
  // reconhece a conta e o direct fica sem resposta, calado.
  console.log(`  ID da conta      ${eu.user_id || "(não veio)"}   ← o do painel`);
  console.log(`  ID app-scoped    ${eu.id}`);

  // O escopo de publicação não aparece no /me. O jeito honesto de saber é
  // tentar ler a lista de mídia: se o token não tem o escopo de conteúdo, a
  // Meta responde com erro de permissão em vez de lista vazia.
  let publicar = "não testado";
  try {
    await pegar(`${API}/${VERSAO}/${eu.id}/media?limit=1&access_token=${token}`);
    publicar = "ok — o token enxerga a mídia da conta";
  } catch (err) {
    publicar = `NÃO — ${err.message}`;
  }
  console.log(`  Publicar   ${publicar}`);

  if (eu.account_type && !/BUSINESS|MEDIA_CREATOR|CREATOR/i.test(eu.account_type)) {
    console.log(
      "\n  ⚠  A conta não parece ser profissional. Converta em Configurações →\n" +
        "     Tipo de conta, senão nem direct nem publicação funcionam."
    );
  }

  console.log("\nSe é essa a conta, as variáveis são:\n");
  console.log(`  ${VARS.id}=${eu.user_id || eu.id}`);
  console.log(`  ${VARS.token}=<o token longo, saído de "trocar">\n`);
  console.log(
    "Confira o ID contra o que já funciona: o valor de IG_USER_ID da MarIAna,\n" +
      "no Railway, diz qual das duas formas este servidor espera. Se lá estiver\n" +
      "um 17841…, use o ID da conta; se for o outro formato, use o app-scoped.\n"
  );
  console.log(
    "Este token ainda é o curto (1 hora). Rode `trocar` antes de colocar no\n" +
      "Railway — senão o FabrícIO para de responder direct em uma hora.\n"
  );
}

// --- troca pelo token de 60 dias ------------------------------------------
async function trocar(curto, segredo) {
  if (!segredo) {
    console.error(
      "Falta o app secret. Ele está em developers.facebook.com → seu app →\n" +
        "Configurações → Básico → Chave Secreta do App (Instagram App Secret).\n"
    );
    process.exitCode = 1;
    return;
  }
  console.log("\nTrocando pelo token de 60 dias…\n");
  const r = await pegar(
    `${API}/access_token?grant_type=ig_exchange_token` +
      `&client_secret=${encodeURIComponent(segredo)}` +
      `&access_token=${encodeURIComponent(curto)}`
  );
  const eu = await pegar(
    `${API}/${VERSAO}/me?fields=id,user_id,username&access_token=${r.access_token}`
  );

  console.log(`  Conta      @${eu.username}`);
  console.log(`  Validade   ${dias(r.expires_in)} dias\n`);
  console.log("Cole estas duas no Railway (Variables) e faça o redeploy:\n");
  console.log(`  ${VARS.id}=${eu.user_id || eu.id}`);
  console.log(`  ${VARS.token}=${r.access_token}\n`);
  console.log(
    `Marque no calendário: renove até ${new Date(
      Date.now() + r.expires_in * 1000
    ).toLocaleDateString("pt-BR")} com\n  node instagram-setup.js renovar <este token> --persona=${PERSONA}\n`
  );
}

// --- renovação ------------------------------------------------------------
// Vale para token com mais de 24h de vida e que ainda não venceu. Renovado,
// volta a valer 60 dias contados de hoje.
async function renovar(longo) {
  console.log("\nRenovando…\n");
  const r = await pegar(
    `${API}/refresh_access_token?grant_type=ig_refresh_token` +
      `&access_token=${encodeURIComponent(longo)}`
  );
  console.log(`  Validade   ${dias(r.expires_in)} dias\n`);
  console.log("Atualize no Railway:\n");
  console.log(`  ${VARS.token}=${r.access_token}\n`);
}

// --- login pela URL de autorização ------------------------------------------
// Quando o botão "Adicionar conta" do painel não coopera, o caminho de baixo é
// o mesmo que ele usaria: abrir a URL de autorização, autorizar com o @ certo e
// trocar o código que volta na barra de endereços.
//
// A URL de retorno precisa estar cadastrada no app (bloco "Configurar o login
// da empresa no Instagram"). Ela NÃO precisa existir de verdade: o navegador
// para nela com ?code=... na barra, e é só isso que a gente quer.
const ESCOPOS = [
  "instagram_business_basic",
  "instagram_business_manage_messages",
  "instagram_business_content_publish",
].join(",");

function autorizar(appId, retorno) {
  if (!appId || !retorno) {
    console.error(
      "\nFaltou o ID do app do Instagram e/ou a URL de retorno.\n\n" +
        "  node instagram-setup.js autorizar <ig-app-id> <url-de-retorno>\n\n" +
        "O ID do app do Instagram está em Configuração da API com login do\n" +
        "Instagram, no campo 'ID do app do Instagram'. NÃO é o ID do app da Meta.\n"
    );
    process.exitCode = 1;
    return;
  }
  const url =
    "https://www.instagram.com/oauth/authorize" +
    // force_reauth pede a senha de novo em vez de aproveitar a sessão aberta.
    // Sem isso o Instagram autoriza a conta que já está logada no navegador,
    // sem perguntar — e sai um token válido, da conta errada, que só se
    // descobre quando o direct da outra persona não é respondido.
    "?force_reauth=true" +
    `&client_id=${encodeURIComponent(appId)}` +
    `&redirect_uri=${encodeURIComponent(retorno)}` +
    `&scope=${encodeURIComponent(ESCOPOS)}` +
    "&response_type=code";

  console.log("\nAbra esta URL em uma JANELA ANÔNIMA e entre com a conta certa:\n");
  console.log(url + "\n");
  console.log(
    "Autorizando, o navegador para na URL de retorno. A página pode dar erro\n" +
      "ou 404 — não importa. O que importa é a barra de endereços:\n\n" +
      "  ...?code=AQB...#_\n\n" +
      "Copie o code (sem o #_ do final) e rode:\n\n" +
      `  node instagram-setup.js codigo <code> ${appId} <app-secret> ${retorno}\n`
  );
}

// Troca o código pelo token curto e já emenda na troca pelo de 60 dias: o
// código vale uma vez só e expira rápido, então não há motivo para parar no
// meio.
async function codigo(code, appId, segredo, retorno) {
  if (!code || !appId || !segredo || !retorno) {
    console.error(
      "\n  node instagram-setup.js codigo <code> <ig-app-id> <app-secret> <url-de-retorno>\n\n" +
        "A URL de retorno tem que ser IDÊNTICA à usada em `autorizar` — a Meta\n" +
        "compara caractere a caractere, barra final inclusive.\n"
    );
    process.exitCode = 1;
    return;
  }
  // O Instagram devolve o código com "#_" grudado no fim. Some sozinho aqui
  // para ninguém perder tempo com um "código inválido" que é só lixo colado.
  const limpo = String(code).replace(/#_$/, "").trim();

  // Os quatro argumentos são fáceis de trocar de lugar, e a Meta responde a
  // todos os enganos com o mesmo "Invalid authorization code", que não diz
  // nada. Estes dois erros têm cara própria e dá para reconhecer antes de
  // mandar — inclusive o pior deles, que é o secret ir no lugar do código e
  // acabar em histórico de terminal, print ou conversa.
  if (/^[0-9a-f]{32}$/i.test(limpo)) {
    console.error(
      "\nIsso não é um código de autorização — são 32 caracteres hexadecimais,\n" +
        "a cara de um app secret. Confira a ordem:\n\n" +
        "  codigo <CÓDIGO> <APP-ID> <APP-SECRET> <URL>\n\n" +
        "O código é longo e começa com AQ. Se o secret foi digitado aqui por\n" +
        "engano, troque a chave no painel: ela ficou no histórico do terminal.\n"
    );
    process.exitCode = 1;
    return;
  }
  if (/^(SEGREDO|SEU_APP_SECRET|APP_SECRET|<app-secret>)$/i.test(String(segredo).trim())) {
    console.error(
      "\nO app secret ainda está com o texto de exemplo. Troque pela chave de\n" +
        "verdade — em Configuração da API com login do Instagram, no campo\n" +
        "'Chave secreta do app do Instagram', botão Mostrar.\n"
    );
    process.exitCode = 1;
    return;
  }

  console.log("\nTrocando o código pelo token…\n");
  const corpo = new URLSearchParams({
    client_id: appId,
    client_secret: segredo,
    grant_type: "authorization_code",
    redirect_uri: retorno,
    code: limpo,
  });

  let r;
  try {
    r = await fetch("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: corpo,
    });
  } catch (err) {
    throw new Error(`rede: não cheguei em api.instagram.com (${err.message})`);
  }

  const texto = await r.text();
  let dados;
  try {
    dados = JSON.parse(texto);
  } catch {
    throw new Error(`${r.status}: resposta não-JSON — ${texto.slice(0, 200)}`);
  }
  if (!r.ok || dados.error_type || dados.error) {
    throw new Error(
      dados.error_message || dados.error?.message || `${r.status}: ${texto.slice(0, 200)}`
    );
  }

  console.log(`  Token curto obtido — conta ${dados.user_id}\n`);
  console.log("Emendando na troca pelo token de 60 dias…");
  await trocar(dados.access_token, segredo);
}

const ajuda = `
instagram-setup.js — token do Instagram das personas

  node instagram-setup.js diagnostico <token>                  de quem é esse token
  node instagram-setup.js trocar <token-curto> <app-secret>    1 hora → 60 dias
  node instagram-setup.js renovar <token-longo>                mais 60 dias

  Quando o "Adicionar conta" do painel não coopera:
  node instagram-setup.js autorizar <ig-app-id> <url-de-retorno>
  node instagram-setup.js codigo <code> <ig-app-id> <app-secret> <url-de-retorno>

  --persona=fabricio | mariana   (padrão: fabricio)
`;

(async () => {
  const [comando, a, b, c, d] = args;
  try {
    if (comando === "diagnostico" && a) await diagnostico(a);
    else if (comando === "trocar" && a) await trocar(a, b);
    else if (comando === "renovar" && a) await renovar(a);
    else if (comando === "autorizar") autorizar(a, b);
    else if (comando === "codigo") await codigo(a, b, c, d);
    else console.log(ajuda);
  } catch (err) {
    console.error(`\nFalhou: ${err.message}\n`);
    // A dica só vale para token; num código inválido ela manda a pessoa
    // refazer o login que ela acabou de fazer.
    if (comando !== "codigo" && /OAuth|190|inválid|invalid/i.test(err.message)) {
      console.error(
        "Token vencido ou de outro tipo. Os tokens que o Graph API Explorer\n" +
          "gera são de Página (graph.facebook.com) e NÃO servem aqui — refaça\n" +
          "pelo Business Login for Instagram, como está no README.\n"
      );
    }
    if (comando === "codigo") {
      console.error(
        "O código vale UMA vez e expira em minutos. Pegue outro abrindo a URL\n" +
          "de autorização de novo — não adianta repetir com o mesmo.\n"
      );
    }
    // process.exit() no meio de uma conexão que ainda está fechando derruba o
    // libuv no Windows ("Assertion failed... UV_HANDLE_CLOSING"). Marcar o
    // código de saída deixa o Node terminar sozinho, sem susto no fim.
    process.exitCode = 1;
  }
})();
