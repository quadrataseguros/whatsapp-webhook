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

const readline = require("readline");
const fs = require("fs");
const path = require("path");

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

// Como o token viaja: no cabeçalho (Bearer) ou na query (?access_token=).
//
// A documentação mostra a query. Mas o servidor conversa com a mesma API há
// meses pelo cabeçalho — é o que sendInstagramReply faz, e é o que atende a
// MarIAna em produção. Com a query, tanto /me quanto a troca de token
// respondem "Unsupported request - method type: get", que soa como rota
// errada e é, na verdade, a Meta não reconhecendo a autenticação.
//
// Então tenta-se o cabeçalho primeiro, por ser o que se sabe que funciona
// aqui, e a query depois, por ser o que a documentação promete.
async function chamar({ url, params = new URLSearchParams(), token, metodo = "GET", auth = "header" }) {
  const query = new URLSearchParams(params);
  const headers = {};
  if (token) {
    if (auth === "header") headers.Authorization = `Bearer ${token}`;
    else query.set("access_token", token);
  }

  const alvo = metodo === "GET" ? `${url}?${query.toString()}` : url;
  const opcoes = { method: metodo, headers };
  if (metodo === "POST") {
    opcoes.headers["Content-Type"] = "application/x-www-form-urlencoded";
    opcoes.body = query;
  }

  let r;
  try {
    r = await fetch(alvo, opcoes);
  } catch (err) {
    throw new Error(`rede: não consegui falar com ${url} (${err.message})`);
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

// Percorre as formas conhecidas até uma ser aceita. "Unsupported request" é o
// que a Meta responde quando não reconhece a rota OU a autenticação, então é
// o único erro que autoriza tentar a próxima: credencial inválida e token
// vencido sobem na hora, porque insistir ali esconderia o motivo.
async function tentarFormas(caminho, { params, token } = {}) {
  const formas = [];
  for (const base of [API, `${API}/${VERSAO}`]) {
    for (const auth of ["header", "query"]) {
      for (const metodo of ["GET", "POST"]) {
        formas.push({ url: `${base}${caminho}`, auth, metodo });
      }
    }
  }

  const erros = [];
  for (const forma of formas) {
    try {
      const corpo = await chamar({ ...forma, params, token });
      if (erros.length) {
        console.log(`  (aceito em ${forma.metodo} ${forma.url}, token no ${forma.auth})`);
      }
      return corpo;
    } catch (err) {
      if (!/Unsupported request|method type|Unknown path|does not exist/i.test(err.message)) {
        throw err;
      }
      erros.push(`${forma.metodo} ${forma.url} (token no ${forma.auth}): ${err.message}`);
    }
  }
  throw new Error(`nenhuma forma conhecida foi aceita:\n    ${erros.join("\n    ")}`);
}

// Atalho para as leituras simples, que já sabem a forma.
const pegar = (url, token) =>
  token ? chamar({ url, token }) : chamar({ url });

// --- diagnóstico ----------------------------------------------------------
// Responde as três perguntas que importam antes de salvar qualquer coisa:
// o token é válido, é da conta certa, e dá para publicar com ele.
async function diagnostico(token) {
  let id = flags.id || null;
  if (!token) {
    const guardado = lerTokenCurto();
    if (guardado) {
      token = guardado.token;
      id = id || guardado.id;
      console.log(`\n  Token lido de ${ARQUIVO_CURTO}`);
    }
  }
  if (!token) {
    console.error("\nSem token. Passe um, ou rode `codigo` primeiro.\n");
    process.exitCode = 1;
    return;
  }
  console.log("\nConsultando a conta…\n");

  // "me" é atalho, e atalho pode não existir. O servidor sempre usa o caminho
  // numérico — é o que se sabe que esta API aceita, porque é assim que a
  // MarIAna responde direct. Então se /me não for reconhecido, tenta o id.
  const campos = new URLSearchParams({
    fields: "id,user_id,username,name,account_type",
  });
  let eu;
  try {
    eu = await tentarFormas("/me", { params: campos, token });
  } catch (err) {
    if (!id) throw err;
    console.log(`  (/me não foi reconhecido — tentando pelo id ${id})`);
    eu = await tentarFormas(`/${id}`, { params: campos, token });
  }

  console.log(`  Conta      @${eu.username}`);
  if (eu.name) console.log(`  Nome       ${eu.name}`);
  console.log(`  Tipo       ${eu.account_type || "(não informado)"}`);
  console.log(`  Token      ${mascarar(token)}`);

  // A mesma conta tem dois IDs e eles NÃO são intercambiáveis: `user_id` é a
  // conta profissional (o 17841… que o painel mostra na tabela de contas) e
  // `id` é o app-scoped, específico da relação conta↔app. Pôr o errado na
  // variável não dá erro nenhum: o webhook chega, porInstagram() não
  // reconhece a conta e o direct fica sem resposta, calado.
  console.log(`  ID da conta      ${eu.user_id || "(não veio)"}   (o que o painel mostra)`);
  console.log(`  ID app-scoped    ${eu.id}   ← é este que vai na variável`);

  // O escopo de publicação não aparece no /me. O jeito honesto de saber é
  // tentar ler a lista de mídia: se o token não tem o escopo de conteúdo, a
  // Meta responde com erro de permissão em vez de lista vazia.
  let publicar = "não testado";
  try {
    await tentarFormas(`/${eu.id}/media`, {
      params: new URLSearchParams({ limit: "1" }),
      token,
    });
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
  console.log(`  ${VARS.id}=${eu.id}`);
  console.log(`  ${VARS.token}=<o token longo, saído de "trocar">\n`);
  console.log(
    "Este token ainda é o curto (1 hora). Rode `trocar` antes de colocar no\n" +
      "Railway — senão o FabrícIO para de responder direct em uma hora.\n"
  );
}


// --- troca pelo token de 60 dias ------------------------------------------
async function trocar(curto, segredo) {
  if (!curto) {
    const guardado = lerTokenCurto();
    if (guardado) {
      curto = guardado.token;
      console.log(`\n  Token curto lido de ${ARQUIVO_CURTO}`);
    }
  }
  if (!segredo) {
    const ficha = lerFicha();
    segredo = (ficha && ficha.chave) || segredoDoArquivo() || null;
  }
  if (!curto) {
    curto = await perguntar("Token curto: ", { oculto: true });
    if (!segredo) segredo = await perguntar("Chave secreta do app do Instagram: ", { oculto: true });
    fecharPerguntas();
  }
  if (!curto || !segredo) {
    console.error(
      "\nFalta o token ou o app secret. Rode sem argumento nenhum que eu\n" +
        "pergunto, e aí nada disso fica no histórico do terminal:\n\n" +
        "  node instagram-setup.js trocar\n"
    );
    process.exitCode = 1;
    return;
  }
  console.log("\nTrocando pelo token de 60 dias…\n");
  const r = await tentarFormas("/access_token", {
    params: new URLSearchParams({
      grant_type: "ig_exchange_token",
      client_secret: segredo,
    }),
    token: curto,
  });
  const eu = await tentarFormas("/me", {
    params: new URLSearchParams({ fields: "id,user_id,username" }),
    token: r.access_token,
  });

  console.log(`  Conta      @${eu.username}`);
  console.log(`  Validade   ${dias(r.expires_in)} dias\n`);
  console.log("Cole estas duas no Railway (Variables) e faça o redeploy:\n");
  console.log(`  ${VARS.id}=${eu.id}`);
  console.log(`  ${VARS.token}=${r.access_token}\n`);
  console.log(
    `Marque no calendário: renove até ${new Date(
      Date.now() + r.expires_in * 1000
    ).toLocaleDateString("pt-BR")} com\n  node instagram-setup.js renovar <este token> --persona=${PERSONA}\n`
  );
}

// Imprime as variáveis prontas para o Railway a partir de um token já válido.
async function mostrarVariaveis(token) {
  const eu = await tentarFormas("/me", {
    params: new URLSearchParams({ fields: "id,user_id,username" }),
    token,
  });
  console.log("Cole estas duas no Railway (Variables) e faça o redeploy:\n");
  console.log(`  ${VARS.id}=${eu.id}`);
  console.log(`  ${VARS.token}=${token}\n`);
}

// --- renovação ------------------------------------------------------------
// Vale para token com mais de 24h de vida e que ainda não venceu. Renovado,
// volta a valer 60 dias contados de hoje.
async function renovar(longo) {
  if (!longo) {
    longo = await perguntar("Token de 60 dias (não aparece na tela): ", { oculto: true });
    fecharPerguntas();
  }
  if (!longo) {
    console.error("\nSem token não há o que renovar.\n");
    process.exitCode = 1;
    return;
  }
  console.log("\nRenovando…\n");
  const r = await tentarFormas("/refresh_access_token", {
    params: new URLSearchParams({ grant_type: "ig_refresh_token" }),
    token: longo,
  });
  console.log(`  Validade   ${dias(r.expires_in)} dias\n`);
  console.log("Atualize no Railway:\n");
  console.log(`  ${VARS.token}=${r.access_token}\n`);
}

// --- perguntar em vez de receber por argumento -------------------------------
// Segredo em linha de comando fica no histórico do terminal, aparece em print e
// acaba colado em conversa. E quatro argumentos posicionais trocam de lugar
// sozinhos: a Meta responde a qualquer engano com o mesmo "bad request", que
// não diz qual campo está errado. Perguntar um de cada vez resolve os dois.
// Uma interface só para todas as perguntas: uma por pergunta funciona no
// terminal e falha quando a entrada vem de arquivo ou pipe — a primeira
// consome o buffer inteiro e as seguintes não veem nada.
let leitor = null;
function perguntar(rotulo, { oculto = false } = {}) {
  leitor =
    leitor || readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    const escrever = leitor._writeToOutput.bind(leitor);
    // Esconder por completo o que se digita faz a colagem parecer que não
    // funcionou — a tela não muda e a pessoa desiste. Um asterisco por
    // caractere mostra que entrou, sem mostrar o quê.
    if (oculto) {
      leitor._writeToOutput = () => {
        readline.clearLine(process.stdout, 0);
        readline.cursorTo(process.stdout, 0);
        process.stdout.write(rotulo + "*".repeat(leitor.line.length));
      };
    }
    leitor.question(rotulo, (resposta) => {
      if (oculto) {
        leitor._writeToOutput = escrever;
        process.stdout.write("\n");
      }
      resolve(String(resposta).trim());
    });
  });
}
function fecharPerguntas() {
  if (leitor) leitor.close();
  leitor = null;
}

// Colar no terminal do Windows é fonte de tropeço: no campo sem eco parece que
// nada aconteceu, e num campo com eco o segredo fica na tela e no histórico.
// Um arquivo resolve os dois — escrever no Bloco de Notas todo mundo sabe.
const ARQUIVO_SEGREDO = path.join(__dirname, "segredo.txt");
const FICHA = path.join(__dirname, "instagram.txt");
const ARQUIVO_CURTO = path.join(__dirname, "token-curto.txt");

// Ficha preenchida no Bloco de Notas. Existe porque colar no terminal do
// Windows falha de formas variadas — e digitar um código de 200 caracteres à
// mão não é opção. No Bloco de Notas colar sempre funciona.
//
// Formato: uma coisa por linha, "rotulo = valor". Linha começando com # é
// comentário. Uma linha que seja só a URL do callback também é entendida,
// para quem colar e não reparar no rótulo.
// Lê o token curto guardado. Aceita o formato novo (JSON com id) e o antigo
// (só o token), para não invalidar o que já estava no disco.
function lerTokenCurto() {
  let bruto;
  try {
    bruto = fs.readFileSync(ARQUIVO_CURTO, "utf8").trim();
  } catch {
    return null;
  }
  if (!bruto) return null;
  try {
    const j = JSON.parse(bruto);
    return { token: j.token, id: j.id || null };
  } catch {
    return { token: bruto, id: null };
  }
}

function lerFicha() {
  let bruto;
  try {
    bruto = fs.readFileSync(FICHA, "utf8");
  } catch {
    return null;
  }
  const dados = {};
  for (const linha of bruto.split(/\r?\n/)) {
    const t = linha.trim();
    if (!t || t.startsWith("#")) continue;
    const m = t.match(/^([a-zA-ZÀ-ú]+)\s*=\s*(.+)$/);
    if (m) {
      const chave = m[1].toLowerCase();
      const valor = m[2].trim();
      if (!valor || /^<.*>$/.test(valor)) continue; // placeholder não preenchido
      dados[chave] = valor;
    } else if (/[?&]code=/.test(t)) {
      dados.url = t;
    }
  }
  return Object.keys(dados).length ? dados : null;
}

// Escreve a ficha já com o que não muda, para sobrar o mínimo a preencher.
function criarFicha(appId, retorno) {
  if (fs.existsSync(FICHA)) {
    console.log(`\nA ficha já existe: ${FICHA}\nAbra no Bloco de Notas e preencha.\n`);
    return;
  }
  fs.writeFileSync(
    FICHA,
    [
      "# Ficha do instagram-setup.js — preencha no Bloco de Notas e salve.",
      "# Depois rode:  node instagram-setup.js codigo",
      "# Apague este arquivo quando terminar.",
      "",
      "# Cole aqui a URL INTEIRA da barra de endereços (a da página de erro 404):",
      "url = <cole aqui>",
      "",
      "# Cole aqui a chave secreta do app do Instagram:",
      "chave = <cole aqui>",
      "",
      `app = ${appId || "<ID do app do Instagram>"}`,
      `retorno = ${retorno || "<URL de retorno cadastrada no app>"}`,
      "",
    ].join("\r\n"), // CRLF: o Bloco de Notas antigo não quebra linha sem isso
    "utf8"
  );
  console.log(`\nCriei a ficha em:\n\n  ${FICHA}\n`);
  console.log(
    "Abra no Bloco de Notas, cole a URL e a chave nos dois lugares marcados,\n" +
      "salve, e rode:\n\n  node instagram-setup.js codigo\n"
  );
}
function segredoDoArquivo() {
  try {
    const bruto = fs.readFileSync(ARQUIVO_SEGREDO, "utf8").trim();
    if (!bruto) return null;
    console.log(`\n  Chave secreta lida de ${ARQUIVO_SEGREDO}`);
    return bruto;
  } catch {
    return null;
  }
}

// Pede a chave: arquivo primeiro, pergunta depois.
async function pedirSegredo() {
  const doArquivo = segredoDoArquivo();
  if (doArquivo) return doArquivo;
  console.log(
    "\nA chave secreta aparece como *** enquanto você cola.\n" +
      "Se colar no terminal não funcionar: abra o Bloco de Notas, cole a chave,\n" +
      `salve como ${ARQUIVO_SEGREDO} e rode este comando de novo.\n`
  );
  return perguntar("Chave secreta do app do Instagram: ", { oculto: true });
}

// Aceita o código solto OU a URL inteira da barra de endereços — extrair o
// pedaço certo de uma URL é trabalho de máquina, não de gente.
function extrairCodigo(entrada) {
  const t = String(entrada).trim().replace(/#_$/, "");
  const m = t.match(/[?&]code=([^&#\s]+)/);
  return m ? decodeURIComponent(m[1]) : t;
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
  // Sem argumentos, pergunta. É o modo recomendado: o secret não fica no
  // histórico e não há ordem para errar.
  const ficha = lerFicha();
  if (ficha) {
    console.log(`\n  Ficha lida de ${FICHA}`);
    code = code || ficha.url || ficha.codigo;
    appId = appId || ficha.app;
    retorno = retorno || ficha.retorno;
    segredo = segredo || ficha.chave;
  }

  if (!code) {
    console.log(
      "\nCole a URL INTEIRA da barra de endereços (aquela que deu erro 404,\n" +
        "com o code= no fim) — eu tiro o código dela.\n" +
        "Se colar aqui não funcionar, rode `node instagram-setup.js ficha` e\n" +
        "preencha pelo Bloco de Notas.\n"
    );
    code = await perguntar("URL ou código: ");
  }
  if (!appId) appId = await perguntar("ID do app do Instagram: ");
  if (!retorno) retorno = await perguntar("URL de retorno cadastrada no app: ");
  if (!segredo) segredo = await pedirSegredo();
  fecharPerguntas();
  if (!code || !appId || !segredo || !retorno) {
    console.error(
      "\nFaltou alguma coisa. Rode sem argumento nenhum que eu pergunto:\n\n" +
        "  node instagram-setup.js codigo\n"
    );
    process.exitCode = 1;
    return;
  }
  // O Instagram devolve o código com "#_" grudado no fim, e quem cola costuma
  // trazer a URL inteira junto. As duas coisas se resolvem aqui.
  const limpo = extrairCodigo(code);

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

  // A resposta do login traz mais do que o token, e o que vem nela responde a
  // pergunta seguinte: se já vier validade longa, não há troca a fazer.
  const extras = Object.entries(dados)
    .filter(([k]) => k !== "access_token")
    .map(([k, v]) => `${k}=${Array.isArray(v) ? v.join("|") : v}`)
    .join(" · ");
  if (extras) console.log(`  Resposta do login: ${extras}`);

  // O token curto vale uma hora e o código que o gerou já morreu. Guardar
  // aqui é o que permite tentar de novo a etapa seguinte sem outra volta no
  // navegador — e é justamente a etapa que mais deu trabalho.
  try {
    // Guarda o id junto: sem ele não dá para consultar a conta por caminho
    // numérico, que é como o servidor fala com esta API.
    fs.writeFileSync(
      ARQUIVO_CURTO,
      JSON.stringify({ token: dados.access_token, id: dados.user_id || "" }),
      "utf8"
    );
  } catch (_) {}

  // Confirmar de quem é o token ANTES da troca: se a troca falhar, pelo menos
  // já se sabe se a conta é a certa — que é a pergunta que mais importa.
  try {
    const eu = await tentarFormas("/me", {
      params: new URLSearchParams({ fields: "id,user_id,username,account_type" }),
      token: dados.access_token,
    });
    console.log(`  Token curto obtido — @${eu.username} (${eu.account_type || "tipo não informado"})`);
    console.log(`  ID da conta ${eu.user_id || "(não veio)"} · app-scoped ${eu.id}\n`);
  } catch (err) {
    console.log(`  Token curto obtido — conta ${dados.user_id}`);
    console.log(`  (não consegui confirmar o @: ${err.message})\n`);
  }

  // Se o login já devolveu um token de validade longa, trocar não faz sentido
  // — e era a troca que vinha falhando.
  const validade = Number(dados.expires_in || 0);
  if (validade > 7 * 86400) {
    console.log(
      `\nO login já devolveu um token de ${Math.round(validade / 86400)} dias — ` +
        "não há troca a fazer.\n"
    );
    await mostrarVariaveis(dados.access_token);
    return;
  }

  console.log("Emendando na troca pelo token de 60 dias…");
  try {
    await trocar(dados.access_token, segredo);
  } catch (err) {
    console.error(`\nFalhou na troca: ${err.message}\n`);
    console.error(
      "O token curto FOI obtido e está guardado em\n" +
        `  ${ARQUIVO_CURTO}\n\n` +
        "Ele vale uma hora. Para tentar a troca de novo sem passar pelo\n" +
        "navegador outra vez:\n\n  node instagram-setup.js trocar\n"
    );
    process.exitCode = 1;
  }
}

const ajuda = `
instagram-setup.js — token do Instagram das personas

  node instagram-setup.js diagnostico <token>    de quem é esse token
  node instagram-setup.js codigo                 login do Instagram → token de 60 dias
  node instagram-setup.js trocar                 token de 1 hora → 60 dias
  node instagram-setup.js renovar                mais 60 dias

  Os três últimos perguntam o que precisam, um de cada vez, e não mostram a
  chave secreta na tela. Rode sem argumento: assim nada sensível fica no
  histórico do terminal nem aparece em print.

  node instagram-setup.js autorizar <ig-app-id> <url-de-retorno>
        monta a URL de autorização, para quando o botão do painel não coopera

  node instagram-setup.js ficha <ig-app-id> <url-de-retorno>
        cria instagram.txt para preencher no Bloco de Notas — o caminho de
        quem não consegue colar no terminal

  --persona=fabricio | mariana   (padrão: fabricio)
`;

(async () => {
  const [comando, a, b, c, d] = args;
  try {
    if (comando === "diagnostico") await diagnostico(a);
    else if (comando === "trocar") await trocar(a, b);
    else if (comando === "renovar") await renovar(a);
    else if (comando === "autorizar") autorizar(a, b);
    else if (comando === "ficha") criarFicha(a, b);
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
