// ---------------------------------------------------------------------------
// Publicação no Instagram (feed) — posts e carrosséis pela Graph API da Meta.
//
// Complementa o atendimento por DM (index.js): aqui a MarIAna também PUBLICA
// conteúdo no feed para divulgar os produtos da Quadrata Seguros.
//
// Fluxo da API (o mesmo para post e carrossel):
//   1. Cria um "container" de mídia          → POST /{ig-id}/media
//   2. (carrossel) agrupa os itens filhos     → POST /{ig-id}/media (CAROUSEL)
//   3. Espera o container ficar FINISHED       → GET  /{container}?fields=status_code
//   4. Publica                                 → POST /{ig-id}/media_publish
//
// A Graph API só aceita imagens por URL pública (não aceita upload de arquivo
// local). Por isso este módulo trabalha com URLs. Para imagens locais, use o
// servidor de mídia embutido em index.js (rota /media + PUBLIC_BASE_URL), que
// transforma um arquivo da pasta ./media numa URL pública.
//
// Uso como CLI:
//   node instagram-publish.js --image https://.../post.jpg --caption "texto"
//   node instagram-publish.js --images https://a.jpg https://b.jpg --caption "texto"
//   node instagram-publish.js --local slide1.png slide2.png --caption "texto"
//   (--local usa arquivos da pasta ./media servidos via PUBLIC_BASE_URL)
//   Acrescente --dry-run para validar sem publicar de verdade.
// ---------------------------------------------------------------------------
require("dotenv").config();
const axios = require("axios");

// Credenciais: usa as variáveis dedicadas de publicação e, se não houver,
// cai para as mesmas do atendimento por DM (que já estão configuradas).
const IG_ID = process.env.IG_PUBLISH_USER_ID || process.env.IG_USER_ID || "";
const IG_TOKEN = process.env.IG_PUBLISH_TOKEN || process.env.IG_ACCESS_TOKEN || "";
// Host da Graph API. O padrão acompanha o que já funciona para os DMs neste
// projeto (Instagram Login → graph.instagram.com). Se sua conta publica via
// Facebook Login, defina IG_GRAPH_HOST=graph.facebook.com.
const GRAPH_HOST = process.env.IG_GRAPH_HOST || "graph.instagram.com";
const GRAPH_VERSION = process.env.GRAPH_VERSION || "v21.0";
// Base pública do servidor (ex.: https://webhook.quadratadigital.com.br) usada
// para transformar arquivos locais de ./media em URLs que a Meta consegue ler.
const PUBLIC_BASE_URL = (process.env.PUBLIC_BASE_URL || "").replace(/\/+$/, "");

const BASE = `https://${GRAPH_HOST}/${GRAPH_VERSION}`;

// Erro de negócio "amigável": mensagens claras em vez de stack trace de axios.
class InstagramPublishError extends Error {}

function assertConfig() {
  if (!IG_ID || !IG_TOKEN) {
    throw new InstagramPublishError(
      "Instagram: defina IG_PUBLISH_USER_ID e IG_PUBLISH_TOKEN " +
        "(ou reutilize IG_USER_ID e IG_ACCESS_TOKEN)."
    );
  }
}

// Extrai a mensagem de erro real que a Meta devolve (fica aninhada em
// response.data.error.message), com fallback para a mensagem do axios.
function metaError(err, contexto) {
  const e = err.response?.data?.error;
  const detalhe = e ? `${e.message}${e.code ? ` (code ${e.code})` : ""}` : err.message;
  return new InstagramPublishError(`${contexto}: ${detalhe}`);
}

// Converte a lista de imagens recebida em URLs públicas absolutas. Aceita:
//  - URLs http(s) completas → usadas como estão;
//  - nomes de arquivo (modo --local) → viram PUBLIC_BASE_URL/media/arquivo.
function resolverUrls(imagens, { local = false } = {}) {
  return imagens.map((img) => {
    if (/^https?:\/\//i.test(img)) return img;
    if (!local) {
      throw new InstagramPublishError(
        `"${img}" não é uma URL. Para arquivos locais use --local (e configure PUBLIC_BASE_URL).`
      );
    }
    if (!PUBLIC_BASE_URL) {
      throw new InstagramPublishError(
        "PUBLIC_BASE_URL não configurada — necessária para publicar arquivos locais da pasta ./media."
      );
    }
    const nome = img.replace(/^.*[\\/]/, ""); // só o nome do arquivo
    return `${PUBLIC_BASE_URL}/media/${encodeURIComponent(nome)}`;
  });
}

// Cria um container de mídia. Para carrossel, marca is_carousel_item.
async function criarContainer({ imageUrl, caption, carouselItem = false }) {
  const body = { image_url: imageUrl, access_token: IG_TOKEN };
  if (caption != null) body.caption = caption;
  if (carouselItem) body.is_carousel_item = true;
  try {
    const r = await axios.post(`${BASE}/${IG_ID}/media`, body);
    return r.data.id;
  } catch (err) {
    throw metaError(err, "Falha ao criar o container de imagem");
  }
}

// Agrupa vários containers em um carrossel.
async function criarCarrossel(childrenIds, caption) {
  try {
    const r = await axios.post(`${BASE}/${IG_ID}/media`, {
      media_type: "CAROUSEL",
      children: childrenIds.join(","),
      caption: caption ?? "",
      access_token: IG_TOKEN,
    });
    return r.data.id;
  } catch (err) {
    throw metaError(err, "Falha ao montar o carrossel");
  }
}

// Aguarda o processamento do container (imagem/carrossel) ficar pronto.
async function aguardarPronto(containerId, { tentativas = 15, intervaloMs = 3000 } = {}) {
  for (let i = 0; i < tentativas; i++) {
    let status;
    try {
      const r = await axios.get(`${BASE}/${containerId}`, {
        params: { fields: "status_code,status", access_token: IG_TOKEN },
      });
      status = r.data.status_code;
    } catch (err) {
      throw metaError(err, "Falha ao consultar o status do container");
    }
    if (status === "FINISHED") return;
    if (status === "ERROR") {
      throw new InstagramPublishError("O Instagram rejeitou a mídia (status ERROR). Verifique o formato/URL da imagem.");
    }
    await new Promise((res) => setTimeout(res, intervaloMs));
  }
  throw new InstagramPublishError("Tempo esgotado aguardando o Instagram processar a mídia.");
}

// Publica o container já pronto e devolve o id do post.
async function publicarContainer(creationId) {
  try {
    const r = await axios.post(`${BASE}/${IG_ID}/media_publish`, {
      creation_id: creationId,
      access_token: IG_TOKEN,
    });
    return r.data.id;
  } catch (err) {
    throw metaError(err, "Falha ao publicar");
  }
}

/**
 * Publica no feed do Instagram.
 * @param {Object} opts
 * @param {string[]} opts.images  URLs (ou nomes de arquivo com local:true). 1 = post; 2..10 = carrossel.
 * @param {string}   opts.caption Legenda do post.
 * @param {boolean}  [opts.local] Trata `images` como arquivos da pasta ./media.
 * @param {boolean}  [opts.dryRun] Valida tudo mas não publica.
 * @returns {Promise<{postId?:string, type:'post'|'carousel', urls:string[], dryRun?:boolean}>}
 */
async function publicarInstagram({ images, caption, local = false, dryRun = false }) {
  assertConfig();
  if (!Array.isArray(images) || images.length === 0) {
    throw new InstagramPublishError("Informe ao menos 1 imagem.");
  }
  if (images.length > 10) {
    throw new InstagramPublishError("O Instagram aceita no máximo 10 imagens por carrossel.");
  }

  const urls = resolverUrls(images, { local });
  const type = urls.length === 1 ? "post" : "carousel";

  if (dryRun) {
    return { type, urls, dryRun: true };
  }

  let creationId;
  if (type === "post") {
    creationId = await criarContainer({ imageUrl: urls[0], caption });
  } else {
    const children = [];
    for (const url of urls) {
      children.push(await criarContainer({ imageUrl: url, carouselItem: true }));
    }
    creationId = await criarCarrossel(children, caption);
  }

  await aguardarPronto(creationId);
  const postId = await publicarContainer(creationId);
  return { postId, type, urls };
}

// --------------------------- CLI ---------------------------
function parseArgs(argv) {
  const args = { images: [], caption: "", local: false, dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--image") {
      args.images.push(argv[++i]);
    } else if (a === "--images" || a === "--local") {
      if (a === "--local") args.local = true;
      while (i + 1 < argv.length && !argv[i + 1].startsWith("--")) {
        args.images.push(argv[++i]);
      }
    } else if (a === "--caption") {
      args.caption = argv[++i];
    } else if (a === "--dry-run") {
      args.dryRun = true;
    }
  }
  return args;
}

if (require.main === module) {
  const args = parseArgs(process.argv.slice(2));
  if (args.images.length === 0) {
    console.error(
      "Uso: node instagram-publish.js --image <url> --caption \"texto\"\n" +
        "     node instagram-publish.js --images <url1> <url2> --caption \"texto\"\n" +
        "     node instagram-publish.js --local <arq1.png> <arq2.png> --caption \"texto\"\n" +
        "     (opcional) --dry-run"
    );
    process.exit(1);
  }
  publicarInstagram(args)
    .then((r) => {
      if (r.dryRun) {
        console.log(`[DRY RUN] OK — ${r.type} com ${r.urls.length} imagem(ns):`);
        r.urls.forEach((u) => console.log("  " + u));
        console.log("Remova --dry-run para publicar de verdade.");
      } else {
        console.log(`Publicado com sucesso! (${r.type})`);
        console.log("Post ID:", r.postId);
      }
    })
    .catch((err) => {
      console.error("Erro:", err.message);
      process.exit(1);
    });
}

module.exports = { publicarInstagram, InstagramPublishError };
