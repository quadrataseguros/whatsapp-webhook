// ---------------------------------------------------------------------------
// teste-publicador.js — a fila de publicação do Instagram, executando.
//
// Publicar não se desfaz. O que se testa aqui é justamente o que não pode
// falhar calado: nada sai com o automático desligado, nada sai duas vezes,
// post atrasado não sai sozinho, e o que a Meta recusaria é barrado antes.
// Banco e pasta temporários, rede fingida — nada chega perto da Meta.
// ---------------------------------------------------------------------------

const fs = require("fs");
const os = require("os");
const path = require("path");

const base = fs.mkdtempSync(path.join(os.tmpdir(), "quadrata-pub-"));
const pasta = path.join(base, "publicacoes");
fs.mkdirSync(pasta);
process.on("exit", () => fs.rmSync(base, { recursive: true, force: true }));

process.env.DB_PATH = path.join(base, "teste.db");
process.env.PUBLICACOES_DIR = pasta;
process.env.IG_USER_ID_FABRICIO = "28683425431282566,17841448141505697";
process.env.IG_ACCESS_TOKEN_FABRICIO = "TOKEN_FABRICIO";
delete process.env.PUBLICACAO_AUTOMATICA;

const pub = require("./publicador");

let falhas = 0;
const ok = (cond, msg) => { console.log(`${cond ? "  ok  " : "FALHOU"}  ${msg}`); if (!cond) falhas++; };

// JPEG mínimo: só o bastante para o cabeçalho dizer largura e altura.
function jpeg(largura, altura) {
  const b = Buffer.alloc(40, 0);
  b.set([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10], 0); // SOI + APP0 (16 bytes)
  b.set([0xff, 0xc0, 0x00, 0x11, 0x08], 20);      // SOF0
  b.writeUInt16BE(altura, 25);
  b.writeUInt16BE(largura, 27);
  return b;
}

function post(slug, dados, imagens = {}) {
  const dir = path.join(pasta, slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "post.json"), JSON.stringify(dados));
  for (const [nome, buf] of Object.entries(imagens)) fs.writeFileSync(path.join(dir, nome), buf);
}

const horas = (h) => new Date(Date.now() + h * 3600 * 1000).toISOString().replace("Z", "+00:00");
const imagemOk = { persona: "fabricio", tipo: "imagem", legenda: "Seguro de vida sem enrolação.", imagens: ["1.jpg"] };

// Meta fingida: registra cada chamada e devolve ids em sequência.
let chamadas = [];
let proximoId = 100;
let falharTudo = false;
global.fetch = async (url, op = {}) => {
  const u = String(url);
  const corpo = op.body ? Object.fromEntries(new URLSearchParams(op.body)) : {};
  chamadas.push({ url: u, metodo: op.method || "GET", corpo, auth: op.headers?.Authorization });
  const responder = (obj, status = 200) => ({ ok: status < 400, status, text: async () => JSON.stringify(obj) });
  if (falharTudo) return responder({ error: { message: "Invalid parameter", code: 100 } }, 400);
  if (u.includes("fields=status_code")) return responder({ status_code: "FINISHED" });
  if (u.includes("fields=permalink")) return responder({ permalink: "https://www.instagram.com/p/XYZ/" });
  return responder({ id: String(proximoId++) });
};

(async () => {
  console.log("\n1. Leitura do JPEG");
  const d = pub.dimensoesJpeg(jpeg(1080, 1350));
  ok(d && d.largura === 1080 && d.altura === 1350, "lê 1080×1350 do cabeçalho");
  ok(pub.dimensoesJpeg(Buffer.from("PNG")) === null, "recusa o que não é JPEG");

  console.log("\n2. Validação barra o que a Meta recusaria");
  post("v-png", { ...imagemOk, quando: horas(1), imagens: ["1.png"] }, { "1.png": Buffer.from("x") });
  post("v-fuso", { ...imagemOk, quando: "2026-10-01T09:00:00" }, { "1.jpg": jpeg(1080, 1350) });
  post("v-carrossel", { ...imagemOk, tipo: "carrossel", quando: horas(1) }, { "1.jpg": jpeg(1080, 1350) });
  post("v-story", { ...imagemOk, tipo: "story", quando: horas(1) }, { "1.jpg": jpeg(1080, 1350) });
  post("v-vazia", { ...imagemOk, legenda: " ", quando: horas(1) }, { "1.jpg": jpeg(1080, 1350) });
  post("v-proporcao", { ...imagemOk, quando: horas(1) }, { "1.jpg": jpeg(1080, 1920) });
  post("_rascunho", { ...imagemOk, quando: horas(-1) }, { "1.jpg": jpeg(1080, 1350) });
  const fila = Object.fromEntries(pub.lerFila().map((p) => [p.slug, p.erros.join(" | ")]));
  ok(/JPEG/.test(fila["v-png"]), "PNG recusado — a Meta só aceita JPEG");
  ok(/fuso/.test(fila["v-fuso"]), "horário sem fuso recusado");
  ok(/2 a 10/.test(fila["v-carrossel"]), "carrossel de 1 imagem recusado");
  ok(/9:16/.test(fila["v-story"]), "story fora de 9:16 recusado");
  ok(/legenda vazia/.test(fila["v-vazia"]), "legenda vazia recusada");
  ok(/proporção/.test(fila["v-proporcao"]), "imagem 9:16 em post de feed recusada");
  ok(!("_rascunho" in fila), "pasta com _ é rascunho e fica fora da fila");
  for (const s of ["v-png", "v-fuso", "v-carrossel", "v-story", "v-vazia", "v-proporcao"]) {
    fs.rmSync(path.join(pasta, s), { recursive: true });
  }

  console.log("\n3. Automático desligado: nada sai");
  post("p-vencido", { ...imagemOk, quando: horas(-0.1) }, { "1.jpg": jpeg(1080, 1350) });
  chamadas = [];
  await pub.verificar();
  ok(chamadas.length === 0, "sem PUBLICACAO_AUTOMATICA=1, nenhuma chamada à Meta");

  console.log("\n4. Automático ligado: publica o que venceu, uma vez só");
  process.env.PUBLICACAO_AUTOMATICA = "1";
  post("p-futuro", { ...imagemOk, quando: horas(5) }, { "1.jpg": jpeg(1080, 1350) });
  chamadas = [];
  const r1 = await pub.verificar();
  ok(r1.length === 1 && r1[0].slug === "p-vencido" && r1[0].status === "publicado", "publica o vencido");
  ok(!r1.some((r) => r.slug === "p-futuro"), "não mexe no que ainda não chegou a hora");
  const criar = chamadas.find((c) => c.url.endsWith("/me/media"));
  ok(criar && criar.corpo.image_url.endsWith("/midia/p-vencido/1.jpg"), "manda a URL pública da imagem");
  ok(criar && criar.auth === "Bearer TOKEN_FABRICIO", "com o token do FabrícIO no cabeçalho");
  ok(chamadas.some((c) => c.url.endsWith("/me/media_publish")), "e confirma a publicação");
  chamadas = [];
  await pub.verificar();
  ok(chamadas.length === 0, "na volta seguinte não publica de novo");
  const estado = pub.estadoFila().find((p) => p.slug === "p-vencido");
  ok(estado.status === "publicado" && estado.permalink, "painel mostra publicado e o link");

  console.log("\n5. Atrasado não sai sozinho");
  post("p-atrasado", { ...imagemOk, quando: horas(-20) }, { "1.jpg": jpeg(1080, 1350) });
  chamadas = [];
  await pub.verificar();
  ok(chamadas.length === 0, "perdeu o horário por mais de 12h: nenhuma chamada");
  ok(pub.estadoFila().find((p) => p.slug === "p-atrasado").status === "atrasado", "fica marcado como atrasado");
  const manual = await pub.publicarAgora("p-atrasado");
  ok(manual.status === "publicado", "mas sai quando alguém manda publicar à mão");

  console.log("\n6. Carrossel");
  post("p-carrossel", { ...imagemOk, tipo: "carrossel", quando: horas(-0.1), imagens: ["1.jpg", "2.jpg", "3.jpg"] },
       { "1.jpg": jpeg(1080, 1350), "2.jpg": jpeg(1080, 1350), "3.jpg": jpeg(1080, 1350) });
  chamadas = [];
  await pub.verificar();
  const itens = chamadas.filter((c) => c.corpo.is_carousel_item === "true");
  const pai = chamadas.find((c) => c.corpo.media_type === "CAROUSEL");
  ok(itens.length === 3, "cria um item por imagem");
  ok(pai && pai.corpo.children.split(",").length === 3 && pai.corpo.caption, "e o carrossel com os 3 e a legenda");

  console.log("\n7. A Meta recusando: três tentativas e para");
  post("p-recusado", { ...imagemOk, quando: horas(-0.1) }, { "1.jpg": jpeg(1080, 1350) });
  falharTudo = true;
  for (let i = 0; i < 4; i++) await pub.verificar();
  const rec = pub.estadoFila().find((p) => p.slug === "p-recusado");
  ok(rec.status === "falhou" && rec.tentativas === 3, `para em 3 tentativas (${rec.tentativas})`);
  ok(/Invalid parameter/.test(rec.erro), "e guarda o motivo que a Meta deu");
  falharTudo = false;

  console.log(falhas ? `\n${falhas} falha(s)\n` : "\nTudo passou\n");
  process.exit(falhas ? 1 : 0);
})();
