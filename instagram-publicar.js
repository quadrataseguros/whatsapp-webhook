// Publica foto (ou carrossel de até 10) no feed do Instagram de uma persona.
//
// Roda no servidor, e não no MCP, porque o token que vale é o que ESTE
// servidor renova sozinho no banco (instagram-token.js) — o do .env local
// pode estar vencido há semanas.
//
// A Meta não aceita upload direto: ela BAIXA a imagem de uma URL pública.
// Foto que chega em base64 (do computador de quem usa o MCP) fica guardada
// em memória por uma hora e é servida em /midia/<id> só para a Meta buscar.
const crypto = require("crypto");
const axios = require("axios");
const personas = require("./personas");
const igToken = require("./instagram-token");

const IG_GRAPH = "https://graph.instagram.com/v21.0";
const VALIDADE_MIDIA_MS = 60 * 60 * 1000;
const midias = new Map(); // id → { bytes, tipo, expira }

function guardarMidia(base64, tipo) {
  const agora = Date.now();
  for (const [id, m] of midias) if (m.expira < agora) midias.delete(id);
  const id = crypto.randomBytes(16).toString("hex") + ".jpg";
  midias.set(id, { bytes: Buffer.from(base64, "base64"), tipo, expira: agora + VALIDADE_MIDIA_MS });
  return id;
}

function servirMidia(req, res) {
  const m = midias.get(req.params.id);
  if (!m || m.expira < Date.now()) return res.status(404).end();
  res.type(m.tipo).send(m.bytes);
}

// A Meta processa o container em segundo plano; publicar antes de FINISHED
// dá erro "media not ready".
async function esperarPronto(id, token) {
  for (let i = 0; i < 20; i++) {
    const r = await axios.get(`${IG_GRAPH}/${id}`, {
      params: { fields: "status_code,status" },
      headers: { Authorization: `Bearer ${token}` },
    });
    if (r.data.status_code === "FINISHED") return;
    if (r.data.status_code === "ERROR" || r.data.status_code === "EXPIRED")
      throw new Error(`A Meta recusou a imagem: ${r.data.status || r.data.status_code}`);
    await new Promise((ok) => setTimeout(ok, 3000));
  }
  throw new Error("A Meta demorou demais para processar a imagem. Tente de novo.");
}

// imagens: URLs públicas, já resolvidas. Uma → post simples; várias → carrossel.
async function publicar({ persona, legenda, imagens }) {
  const p = personas.porId(persona) || personas.padrao();
  const token = igToken.tokenDe(p);
  const igId = igToken.idDe(p);
  if (!token || !igId) throw new Error(`${p.nome} sem Instagram ligado (veja /admin/instagram)`);
  if (!imagens.length || imagens.length > 10) throw new Error("Mande de 1 a 10 imagens.");

  const auth = { headers: { Authorization: `Bearer ${token}` } };
  const criar = (params) => axios.post(`${IG_GRAPH}/${igId}/media`, null, { params, ...auth }).then((r) => r.data.id);

  let container;
  if (imagens.length === 1) {
    container = await criar({ image_url: imagens[0], caption: legenda || "" });
  } else {
    const filhos = [];
    for (const url of imagens) filhos.push(await criar({ image_url: url, is_carousel_item: true }));
    for (const id of filhos) await esperarPronto(id, token);
    container = await criar({ media_type: "CAROUSEL", children: filhos.join(","), caption: legenda || "" });
  }
  await esperarPronto(container, token);

  const pub = await axios.post(`${IG_GRAPH}/${igId}/media_publish`, null, { params: { creation_id: container }, ...auth });
  const post = await axios.get(`${IG_GRAPH}/${pub.data.id}`, { params: { fields: "permalink,timestamp" }, ...auth });
  return { persona: p.nome, id: pub.data.id, ...post.data };
}

module.exports = { guardarMidia, servirMidia, publicar };
