// ---------------------------------------------------------------------------
// publicador.js — publica no Instagram os posts da pasta publicacoes/.
//
// Cada post é uma pasta: um post.json (persona, horário, tipo, legenda,
// imagens) e as imagens em JPEG. O servidor serve as imagens num endereço
// público (/midia/...) — a Meta não aceita arquivo, só URL — e publica cada
// post quando chega o horário.
//
// A aprovação é o merge. O servidor só enxerga o que está no código publicado,
// e o código só chega lá pelo main: um post entra na fila por PR, e alguém da
// Quadrata olha a arte e a legenda antes de ele existir para o servidor. Post
// público de corretora não sai sem que uma pessoa tenha visto.
//
// Duas travas a mais, porque publicar não se desfaz:
//   - nada sai sozinho enquanto PUBLICACAO_AUTOMATICA não for "1" no
//     ambiente. Com ela desligada, a fila aparece em /admin/publicacoes e
//     cada post pode ser publicado à mão;
//   - post que perdeu o horário por mais de PUBLICACAO_JANELA_HORAS (12h
//     por padrão) não sai atrasado: fica marcado e espera alguém decidir.
//     Um "bom dia" publicado às 23h é pior que nenhum post.
//
// E a tabela publicacao, no SQLite, garante que nada seja publicado duas
// vezes, mesmo com o servidor reiniciando no meio.
// ---------------------------------------------------------------------------

const fs = require("fs");
const path = require("path");
const db = require("./db");
const personas = require("./personas");
const igToken = require("./instagram-token");

// PUBLICACOES_DIR existe para o teste apontar para uma pasta temporária.
const PASTA = process.env.PUBLICACOES_DIR || path.join(__dirname, "publicacoes");
const API = "https://graph.instagram.com/v21.0";
const URL_PUBLICA = (process.env.URL_PUBLICA || "https://webhook.quadratadigital.com.br").replace(/\/+$/, "");
const JANELA_MS = Number(process.env.PUBLICACAO_JANELA_HORAS || 12) * 3600 * 1000;
const INTERVALO_MS = 5 * 60 * 1000;

const TIPOS = ["imagem", "carrossel", "story"];

// --- leitura e validação --------------------------------------------------

// Largura e altura de um JPEG, lidas do cabeçalho (marcador SOF). Sem
// dependência: é só achar o marcador certo no começo do arquivo.
function dimensoesJpeg(buffer) {
  if (buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;
  let i = 2;
  while (i < buffer.length) {
    if (buffer[i] !== 0xff) return null;
    const marcador = buffer[i + 1];
    const tamanho = buffer.readUInt16BE(i + 2);
    const ehSof =
      marcador >= 0xc0 && marcador <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marcador);
    if (ehSof) {
      return { altura: buffer.readUInt16BE(i + 5), largura: buffer.readUInt16BE(i + 7) };
    }
    i += 2 + tamanho;
  }
  return null;
}

// As regras da Meta, conferidas ANTES de mandar: um erro aqui aparece no PR,
// na frente de quem aprova, em vez de aparecer no log às 9h da manhã.
function validar(slug, dados, dir) {
  const erros = [];
  if (!personas.porId(dados.persona)) erros.push(`persona desconhecida: ${dados.persona}`);
  if (!TIPOS.includes(dados.tipo)) erros.push(`tipo deve ser ${TIPOS.join(", ")}`);

  const quando = Date.parse(dados.quando || "");
  if (Number.isNaN(quando)) erros.push("quando: data inválida");
  // Sem fuso, "09:00" vira 09:00 no relógio do servidor — que no Render é
  // UTC, ou seja, 06:00 em São Paulo. Exigir o fuso evita a dúvida.
  else if (!/([+-]\d{2}:\d{2}|Z)$/.test(dados.quando)) {
    erros.push('quando: inclua o fuso, ex. "2026-10-01T09:00:00-03:00"');
  }

  const imagens = Array.isArray(dados.imagens) ? dados.imagens : [];
  if (dados.tipo === "carrossel" && (imagens.length < 2 || imagens.length > 10)) {
    erros.push(`carrossel tem de ter de 2 a 10 imagens (tem ${imagens.length})`);
  }
  if (dados.tipo !== "carrossel" && imagens.length !== 1) {
    erros.push(`${dados.tipo} tem de ter exatamente 1 imagem (tem ${imagens.length})`);
  }

  for (const nome of imagens) {
    if (nome.includes("/") || nome.includes("\\")) {
      erros.push(`${nome}: só o nome do arquivo, sem pasta`);
      continue;
    }
    // A Meta só aceita JPEG para imagem. PNG é recusado na criação do
    // container, com um erro que não diz que o problema é o formato.
    if (!/\.jpe?g$/i.test(nome)) {
      erros.push(`${nome}: tem de ser JPEG (.jpg)`);
      continue;
    }
    let buffer;
    try {
      buffer = fs.readFileSync(path.join(dir, nome));
    } catch {
      erros.push(`${nome}: arquivo não encontrado na pasta`);
      continue;
    }
    if (buffer.length > 8 * 1024 * 1024) erros.push(`${nome}: maior que 8 MB`);
    const d = dimensoesJpeg(buffer);
    if (!d) {
      erros.push(`${nome}: não consegui ler como JPEG`);
      continue;
    }
    const proporcao = d.largura / d.altura;
    if (dados.tipo === "story") {
      if (Math.abs(proporcao - 9 / 16) > 0.02) erros.push(`${nome}: story tem de ser 9:16 (1080×1920)`);
    } else if (proporcao < 0.8 - 0.005 || proporcao > 1.91 + 0.005) {
      erros.push(`${nome}: proporção ${d.largura}×${d.altura} fora do aceito (de 4:5 a 1.91:1)`);
    }
  }

  const legenda = dados.legenda || "";
  if (dados.tipo !== "story" && !legenda.trim()) erros.push("legenda vazia");
  if (legenda.length > 2200) erros.push(`legenda com ${legenda.length} caracteres (máx. 2200)`);
  const hashtags = (legenda.match(/#[\p{L}\p{N}_]+/gu) || []).length;
  if (hashtags > 30) erros.push(`${hashtags} hashtags (máx. 30)`);

  return erros;
}

// Pastas começando com _ ou . são rascunho, exemplo ou arquivo morto: ficam
// no repositório e o servidor não as vê.
function lerFila() {
  let pastas = [];
  try {
    pastas = fs.readdirSync(PASTA, { withFileTypes: true });
  } catch {
    return [];
  }
  return pastas
    .filter((d) => d.isDirectory() && !/^[_.]/.test(d.name))
    .map((d) => {
      const dir = path.join(PASTA, d.name);
      let dados = {};
      let erros = [];
      try {
        dados = JSON.parse(fs.readFileSync(path.join(dir, "post.json"), "utf8"));
        erros = validar(d.name, dados, dir);
      } catch (err) {
        erros = [`post.json ilegível: ${err.message}`];
      }
      return { slug: d.name, dir, dados, erros, quando: Date.parse(dados.quando || "") };
    })
    .sort((a, b) => (a.quando || 0) - (b.quando || 0));
}

const urlMidia = (slug, arquivo) =>
  `${URL_PUBLICA}/midia/${encodeURIComponent(slug)}/${encodeURIComponent(arquivo)}`;

// --- estado no banco ------------------------------------------------------

const lerRegistro = db.prepare("SELECT * FROM publicacao WHERE slug = ?");
const gravarRegistro = db.prepare(
  `INSERT INTO publicacao (slug, persona, status, tentativas, media_id, permalink, erro, publicado_em, updated_at)
        VALUES (@slug, @persona, @status, @tentativas, @media_id, @permalink, @erro, @publicado_em, datetime('now','localtime'))
   ON CONFLICT(slug) DO UPDATE SET
        status = excluded.status, tentativas = excluded.tentativas,
        media_id = excluded.media_id, permalink = excluded.permalink,
        erro = excluded.erro, publicado_em = excluded.publicado_em,
        updated_at = excluded.updated_at`
);

function registrar(slug, persona, campos) {
  const atual = lerRegistro.get(slug) || {};
  gravarRegistro.run({
    slug,
    persona,
    status: campos.status ?? atual.status ?? "pendente",
    tentativas: campos.tentativas ?? atual.tentativas ?? 0,
    media_id: campos.media_id ?? atual.media_id ?? null,
    permalink: campos.permalink ?? atual.permalink ?? null,
    erro: campos.erro === undefined ? atual.erro ?? null : campos.erro,
    publicado_em: campos.publicado_em ?? atual.publicado_em ?? null,
  });
}

// --- conversa com a Meta --------------------------------------------------

// Token no cabeçalho, que é como o resto do servidor fala com esta API. Se a
// Meta pedir o token como parâmetro — a troca de token pede —, repete assim.
async function graph(metodo, caminho, params, token) {
  const tentar = async (noCorpo) => {
    const p = new URLSearchParams(params || {});
    if (noCorpo) p.set("access_token", token);
    const url = `${API}/${caminho}`;
    const r = await fetch(metodo === "GET" ? `${url}?${p}` : url, {
      method: metodo,
      headers: {
        ...(noCorpo ? {} : { Authorization: `Bearer ${token}` }),
        ...(metodo === "POST" ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
      },
      body: metodo === "POST" ? p : undefined,
    });
    const texto = await r.text();
    let corpo;
    try {
      corpo = JSON.parse(texto);
    } catch {
      throw new Error(`${r.status}: resposta não-JSON — ${texto.slice(0, 160)}`);
    }
    if (!r.ok || corpo.error) {
      const e = corpo.error || {};
      throw new Error(`${e.message || texto.slice(0, 160)} (código ${e.code ?? r.status})`);
    }
    return corpo;
  };
  try {
    return await tentar(false);
  } catch (err) {
    if (!/access_token is required/i.test(err.message)) throw err;
    return tentar(true);
  }
}

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

// A Meta processa o container de forma assíncrona. Publicar antes do
// FINISHED dá erro, então espera — até um minuto, que para imagem sobra.
async function aguardarContainer(id, token) {
  for (let i = 0; i < 20; i++) {
    const { status_code: status } = await graph("GET", id, { fields: "status_code" }, token);
    if (status === "FINISHED") return;
    if (status === "ERROR" || status === "EXPIRED") {
      throw new Error(`a Meta recusou a mídia (status ${status})`);
    }
    await esperar(3000);
  }
  throw new Error("a Meta não terminou de processar a mídia em 1 minuto");
}

async function publicar(post) {
  const { slug, dados } = post;
  const p = personas.porId(dados.persona);
  const token = igToken.tokenDe(p);
  if (!token) throw new Error(`${p.nome} não tem Instagram ligado`);

  // "me" em vez do id numérico: a mesma conta tem dois ids e a dúvida sobre
  // qual cada rota aceita já custou caro. "me" é sempre a dona do token.
  let criacao;
  if (dados.tipo === "carrossel") {
    const filhos = [];
    for (const img of dados.imagens) {
      const { id } = await graph(
        "POST",
        "me/media",
        { image_url: urlMidia(slug, img), is_carousel_item: "true" },
        token
      );
      filhos.push(id);
    }
    for (const id of filhos) await aguardarContainer(id, token);
    ({ id: criacao } = await graph(
      "POST",
      "me/media",
      { media_type: "CAROUSEL", children: filhos.join(","), caption: dados.legenda },
      token
    ));
  } else if (dados.tipo === "story") {
    ({ id: criacao } = await graph(
      "POST",
      "me/media",
      { media_type: "STORIES", image_url: urlMidia(slug, dados.imagens[0]) },
      token
    ));
  } else {
    ({ id: criacao } = await graph(
      "POST",
      "me/media",
      { image_url: urlMidia(slug, dados.imagens[0]), caption: dados.legenda },
      token
    ));
  }

  await aguardarContainer(criacao, token);
  const { id: mediaId } = await graph("POST", "me/media_publish", { creation_id: criacao }, token);

  let permalink = null;
  try {
    ({ permalink } = await graph("GET", mediaId, { fields: "permalink" }, token));
  } catch (_) {
    // Publicado está; sem o link, o painel só não mostra o atalho.
  }
  return { mediaId, permalink };
}

// --- a fila em movimento --------------------------------------------------

let ocupado = false;

async function processarUm(post, { manual = false } = {}) {
  const { slug, dados } = post;
  const reg = lerRegistro.get(slug);
  if (reg && reg.status === "publicado") return { slug, status: "publicado", jaEstava: true };
  if (post.erros.length) {
    registrar(slug, dados.persona || "?", { status: "invalido", erro: post.erros.join("; ") });
    return { slug, status: "invalido", erro: post.erros.join("; ") };
  }

  const tentativas = (reg?.tentativas || 0) + 1;
  registrar(slug, dados.persona, { status: "publicando", tentativas, erro: null });
  try {
    const { mediaId, permalink } = await publicar(post);
    registrar(slug, dados.persona, {
      status: "publicado",
      media_id: mediaId,
      permalink,
      erro: null,
      publicado_em: new Date().toISOString(),
    });
    console.log(`[POST] ${slug} publicado${manual ? " (à mão)" : ""} — ${permalink || mediaId}`);
    return { slug, status: "publicado", permalink };
  } catch (err) {
    // Três tentativas e para: se a Meta recusou três vezes, a quarta não vai
    // ser diferente, e insistir só enche o log.
    const status = tentativas >= 3 ? "falhou" : "pendente";
    registrar(slug, dados.persona, { status, erro: err.message });
    console.error(`[POST] ${slug} não publicou (tentativa ${tentativas}): ${err.message}`);
    return { slug, status, erro: err.message };
  }
}

async function verificar() {
  if (ocupado || process.env.PUBLICACAO_AUTOMATICA !== "1") return [];
  ocupado = true;
  const resultados = [];
  try {
    const agora = Date.now();
    for (const post of lerFila()) {
      if (!post.quando || post.quando > agora) continue;
      const reg = lerRegistro.get(post.slug);
      if (reg && ["publicado", "falhou", "atrasado", "invalido"].includes(reg.status)) continue;
      if (agora - post.quando > JANELA_MS) {
        registrar(post.slug, post.dados.persona || "?", {
          status: "atrasado",
          erro: "perdeu o horário — publique à mão em /admin/publicacoes, se ainda fizer sentido",
        });
        console.log(`[POST] ${post.slug} perdeu o horário, não sai sozinho`);
        continue;
      }
      resultados.push(await processarUm(post));
    }
  } finally {
    ocupado = false;
  }
  return resultados;
}

async function publicarAgora(slug) {
  const post = lerFila().find((p) => p.slug === slug);
  if (!post) throw new Error(`post ${slug} não está na fila`);
  if (ocupado) throw new Error("o publicador está no meio de outra publicação — tente em 1 minuto");
  ocupado = true;
  try {
    return await processarUm(post, { manual: true });
  } finally {
    ocupado = false;
  }
}

function estadoFila() {
  return lerFila().map((post) => {
    const reg = lerRegistro.get(post.slug) || {};
    return {
      slug: post.slug,
      persona: post.dados.persona,
      tipo: post.dados.tipo,
      quando: post.dados.quando,
      legenda: post.dados.legenda || "",
      imagens: (post.dados.imagens || []).map((i) => urlMidia(post.slug, i)),
      erros: post.erros,
      status: post.erros.length ? "invalido" : reg.status || "agendado",
      tentativas: reg.tentativas || 0,
      permalink: reg.permalink || null,
      erro: reg.erro || null,
    };
  });
}

function iniciar() {
  const ligado = process.env.PUBLICACAO_AUTOMATICA === "1";
  const fila = lerFila();
  console.log(
    `Publicador: ${fila.length} post(s) na fila — automático ${ligado ? "LIGADO" : "desligado (PUBLICACAO_AUTOMATICA)"}`
  );
  for (const p of fila.filter((p) => p.erros.length)) {
    console.error(`[POST] ${p.slug} inválido: ${p.erros.join("; ")}`);
  }
  const rodar = () => verificar().catch((e) => console.error("[POST] Falha no publicador:", e.message));
  setTimeout(rodar, 90 * 1000).unref?.();
  setInterval(rodar, INTERVALO_MS).unref?.();
}

module.exports = {
  PASTA,
  lerFila,
  validar,
  dimensoesJpeg,
  estadoFila,
  publicarAgora,
  verificar,
  iniciar,
};
