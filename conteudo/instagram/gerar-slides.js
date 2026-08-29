/**
 * gerar-slides.js — transforma os slides.html de cada post em imagens 1080x1350
 * prontas para subir no Instagram.
 *
 *   node conteudo/instagram/gerar-slides.js              # gera todos os posts
 *   node conteudo/instagram/gerar-slides.js 01-consorcio # gera só quem casar
 *
 * Precisa do Playwright com o Chromium instalado:
 *   npm install -D playwright && npx playwright install chromium
 *
 * O Playwright NÃO entra no package.json de propósito: ele só serve para
 * produzir conteúdo aqui na máquina, e o servidor que vai pro Railway não deve
 * carregar esse peso.
 */
const fs = require("fs");
const path = require("path");

const RAIZ = __dirname;
const PASTA_POSTS = path.join(RAIZ, "posts");
const LARGURA = 1080;
const ALTURA = 1350;
// JPEG em vez de PNG: o Instagram recomprime tudo na subida, então o PNG só
// deixaria o repositório 5x maior sem nenhum ganho visível no feed.
const QUALIDADE = 94;

function carregarPlaywright() {
  try {
    return require("playwright");
  } catch {
    // Fora do projeto, tenta a instalação global (npm root -g).
    try {
      const { execSync } = require("child_process");
      const globalRoot = execSync("npm root -g", { encoding: "utf8" }).trim();
      return require(path.join(globalRoot, "playwright"));
    } catch {
      console.error(
        "\nPlaywright não encontrado. Instale com:\n" +
          "  npm install -D playwright && npx playwright install chromium\n"
      );
      process.exit(1);
    }
  }
}

function listarPosts(filtro) {
  if (!fs.existsSync(PASTA_POSTS)) return [];
  return fs
    .readdirSync(PASTA_POSTS, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((nome) => fs.existsSync(path.join(PASTA_POSTS, nome, "slides.html")))
    .filter((nome) => !filtro || nome.includes(filtro))
    .sort();
}

async function gerarPost(browser, nome) {
  const pasta = path.join(PASTA_POSTS, nome);
  const saida = path.join(pasta, "imagens");
  fs.mkdirSync(saida, { recursive: true });
  // Recomeça do zero: se um post encurtou, as imagens sobrando ficariam para trás.
  for (const antigo of fs.readdirSync(saida)) {
    if (antigo.endsWith(".jpg")) fs.unlinkSync(path.join(saida, antigo));
  }

  const page = await browser.newPage({
    viewport: { width: LARGURA, height: ALTURA },
    deviceScaleFactor: 1,
  });
  await page.goto("file://" + path.join(pasta, "slides.html"));
  await page.evaluate(() => document.fonts.ready);

  // Preenche o contador "2/6" de cada slide — assim dá para inserir ou remover
  // um slide no HTML sem ter que renumerar nada na mão.
  const total = await page.evaluate(() => {
    const slides = [...document.querySelectorAll(".slide")];
    slides.forEach((slide, i) => {
      const c = slide.querySelector(".contador");
      if (c && !c.textContent.trim()) c.textContent = `${i + 1}/${slides.length}`;
    });
    return slides.length;
  });

  const slides = await page.locator(".slide").all();
  for (let i = 0; i < slides.length; i++) {
    const arquivo = path.join(saida, String(i + 1).padStart(2, "0") + ".jpg");
    await slides[i].screenshot({ path: arquivo, type: "jpeg", quality: QUALIDADE });
  }
  await page.close();
  console.log(`  ${nome} — ${total} slides`);
  return total;
}

(async () => {
  const filtro = process.argv[2];
  const posts = listarPosts(filtro);
  if (!posts.length) {
    console.error(filtro ? `Nenhum post casou com "${filtro}".` : "Nenhum post encontrado.");
    process.exit(1);
  }

  const { chromium } = carregarPlaywright();
  const browser = await chromium.launch();
  console.log(`Gerando ${posts.length} post(s):`);
  let imagens = 0;
  for (const nome of posts) imagens += await gerarPost(browser, nome);
  await browser.close();
  console.log(`\nPronto: ${imagens} imagens em conteudo/instagram/posts/*/imagens/`);
})();
