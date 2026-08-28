const fs = require("fs");
const path = require("path");

const DIR = "/tmp/claude-0/-home-user-whatsapp-webhook/347b8556-5e2e-5d01-b0b7-89ad956d4c0d/scratchpad/galeria";
const OUT = "/tmp/claude-0/-home-user-whatsapp-webhook/347b8556-5e2e-5d01-b0b7-89ad956d4c0d/scratchpad/quadrata-galeria.html";

const b64 = (f) => "data:image/png;base64," + fs.readFileSync(path.join(DIR, f)).toString("base64");

const APP = [
  ["app-login.png", "Entrar", "O cliente acessa com o CPF e a senha que você cadastrou."],
  ["app-inicio.png", "Início", "Saudação pelo nome, resumo dos seguros e os atalhos principais."],
  ["app-seguros.png", "Meus Seguros", "Todas as apólices com vigência, prêmio e situação."],
  ["app-detalhe.png", "Detalhe da apólice", "Dados completos, coberturas e contato do corretor."],
  ["app-boleto.png", "2ª Via de Boleto", "Boletos em aberto e pagos, com código de barras e Pix."],
  ["app-sinistros.png", "Sinistros", "Acompanhamento dos acionamentos por protocolo."],
  ["app-novo-sinistro.png", "Acionar Sinistro", "Registro do ocorrido; o protocolo sai na hora."],
  ["app-cotacao.png", "Solicitar Cotação", "Pedido de cotação por tipo de seguro."],
  ["app-contato.png", "Fale Conosco", "Escritório, MarIAna 24h e e-mail, tudo a um toque."],
  ["app-assistencia.png", "Assistência 24h", "Guincho, chaveiro e demais serviços pelo WhatsApp."],
  ["app-perfil.png", "Perfil", "Dados do cliente e canais da corretora."],
];

const ADMIN = [
  ["admin-login.png", "Acesso ao painel", "Entrada restrita, com a senha definida por você."],
  ["admin-dashboard.png", "Dashboard", "Clientes, apólices, boletos em aberto e sinistros."],
  ["admin-clientes.png", "Clientes", "Cadastro de quem terá acesso ao aplicativo."],
  ["admin-apolices.png", "Apólices", "As apólices que o cliente enxerga no celular."],
  ["admin-boletos.png", "Boletos", "Emissão e baixa, com linha digitável e Pix."],
  ["admin-nova-apolice.png", "Nova apólice", "O formulário de cadastro, com as coberturas."],
];

const phone = ([file, titulo, desc], i) => `
        <figure class="tela" data-src="${b64(file)}" data-titulo="${titulo}" style="--i:${i}">
          <div class="moldura"><img src="${b64(file)}" alt="${titulo}" loading="lazy" /></div>
          <figcaption><h3>${titulo}</h3><p>${desc}</p></figcaption>
        </figure>`;

const janela = ([file, titulo, desc], i) => `
        <figure class="tela larga" data-src="${b64(file)}" data-titulo="${titulo}" style="--i:${i}">
          <div class="janela">
            <div class="barra"><span></span><span></span><span></span></div>
            <img src="${b64(file)}" alt="${titulo}" loading="lazy" />
          </div>
          <figcaption><h3>${titulo}</h3><p>${desc}</p></figcaption>
        </figure>`;

const html = `<title>Quadrata App</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,800&family=Public+Sans:wght@400;500;700&display=swap" />
<style>
  :root {
    --marca: #0D2B6E;
    --marca-clara: #2F52A8;
    --verde: #16A34A;
    --ground: #F4F7FC;
    --surface: #FFFFFF;
    --linha: #E2E9F5;
    --ink: #141F38;
    --ink-suave: #5A6883;
    --sombra: 0 1px 2px rgba(13,43,110,.06), 0 12px 28px rgba(13,43,110,.09);
    --sombra-alta: 0 2px 6px rgba(13,43,110,.10), 0 28px 60px rgba(13,43,110,.16);
    --display: "Bricolage Grotesque", "Trebuchet MS", sans-serif;
    --corpo: "Public Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      --marca: #6E93E8;
      --marca-clara: #9DB8F2;
      --verde: #43C97A;
      --ground: #070D1C;
      --surface: #101A2E;
      --linha: #21304C;
      --ink: #E8EDF8;
      --ink-suave: #93A2BE;
      --sombra: 0 1px 2px rgba(0,0,0,.4), 0 12px 28px rgba(0,0,0,.45);
      --sombra-alta: 0 2px 6px rgba(0,0,0,.5), 0 28px 60px rgba(0,0,0,.6);
    }
  }
  :root[data-theme="dark"] {
    --marca: #6E93E8;
    --marca-clara: #9DB8F2;
    --verde: #43C97A;
    --ground: #070D1C;
    --surface: #101A2E;
    --linha: #21304C;
    --ink: #E8EDF8;
    --ink-suave: #93A2BE;
    --sombra: 0 1px 2px rgba(0,0,0,.4), 0 12px 28px rgba(0,0,0,.45);
    --sombra-alta: 0 2px 6px rgba(0,0,0,.5), 0 28px 60px rgba(0,0,0,.6);
  }

  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: var(--ground);
    color: var(--ink);
    font-family: var(--corpo);
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }
  .wrap { max-width: 1180px; margin: 0 auto; padding: 0 20px; }

  /* ── Cabeçalho ── */
  header {
    background: linear-gradient(165deg, #0D2B6E 0%, #164193 100%);
    color: #fff;
    padding: 44px 0 52px;
  }
  .marca { display: flex; align-items: center; gap: 13px; margin-bottom: 28px; }
  .logo-q {
    width: 46px; height: 46px; border-radius: 50%;
    background: #fff; color: #0D2B6E;
    display: grid; place-items: center;
    font-family: var(--display); font-weight: 800; font-size: 25px;
    flex-shrink: 0;
  }
  .marca-txt { font-size: 12px; letter-spacing: .16em; text-transform: uppercase; color: rgba(255,255,255,.72); font-weight: 500; }
  header h1 {
    font-family: var(--display);
    font-size: clamp(2.1rem, 6vw, 3.4rem);
    font-weight: 800;
    letter-spacing: -.02em;
    line-height: 1.08;
    margin: 0 0 14px;
    text-wrap: balance;
  }
  header p {
    font-size: clamp(1rem, 2.4vw, 1.14rem);
    color: rgba(255,255,255,.82);
    max-width: 60ch;
    margin: 0;
  }
  .numeros { display: flex; flex-wrap: wrap; gap: 32px; margin-top: 34px; }
  .numero b {
    display: block;
    font-family: var(--display); font-weight: 800;
    font-size: 1.9rem; line-height: 1;
    font-variant-numeric: tabular-nums;
  }
  .numero span { font-size: 12.5px; color: rgba(255,255,255,.68); letter-spacing: .05em; }

  /* ── Seções ── */
  section { padding: 56px 0 8px; }
  .titulo-secao { margin-bottom: 34px; }
  .eyebrow {
    font-size: 11.5px; font-weight: 700; letter-spacing: .17em;
    text-transform: uppercase; color: var(--marca);
    display: block; margin-bottom: 9px;
  }
  .titulo-secao h2 {
    font-family: var(--display); font-weight: 800;
    font-size: clamp(1.5rem, 4vw, 2.1rem);
    letter-spacing: -.015em; margin: 0 0 8px; line-height: 1.15;
  }
  .titulo-secao p { color: var(--ink-suave); max-width: 62ch; margin: 0; font-size: 15px; }

  /* ── Grade de telas ── */
  .grade {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
    gap: 34px 26px;
  }
  .grade.admin { grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 38px 28px; }

  .tela { margin: 0; cursor: zoom-in; }
  .moldura, .janela {
    background: var(--surface);
    border: 1px solid var(--linha);
    box-shadow: var(--sombra);
    overflow: hidden;
    transition: transform .22s ease, box-shadow .22s ease;
  }
  .moldura { border-radius: 22px; padding: 6px; }
  .moldura img { display: block; width: 100%; border-radius: 16px; }
  .janela { border-radius: 12px; }
  .janela img { display: block; width: 100%; }
  .barra {
    display: flex; gap: 6px; align-items: center;
    padding: 9px 12px;
    background: var(--ground);
    border-bottom: 1px solid var(--linha);
  }
  .barra span { width: 9px; height: 9px; border-radius: 50%; background: var(--linha); }
  .tela:hover .moldura, .tela:hover .janela,
  .tela:focus-visible .moldura, .tela:focus-visible .janela {
    transform: translateY(-4px);
    box-shadow: var(--sombra-alta);
  }
  .tela:focus-visible { outline: 2px solid var(--marca); outline-offset: 6px; border-radius: 6px; }
  figcaption { padding: 14px 3px 0; }
  figcaption h3 {
    font-family: var(--display); font-weight: 600;
    font-size: 15.5px; margin: 0 0 3px; letter-spacing: -.005em;
  }
  figcaption p { margin: 0; font-size: 13.2px; color: var(--ink-suave); line-height: 1.5; }

  /* ── Publicar ── */
  .publicar {
    background: var(--surface);
    border: 1px solid var(--linha);
    border-radius: 18px;
    padding: 32px;
    margin: 56px 0 0;
    box-shadow: var(--sombra);
  }
  .publicar h2 {
    font-family: var(--display); font-weight: 800;
    font-size: 1.35rem; margin: 0 0 6px; letter-spacing: -.015em;
  }
  .publicar > p { color: var(--ink-suave); margin: 0 0 26px; font-size: 15px; }
  ol.passos { list-style: none; counter-reset: p; padding: 0; margin: 0; display: grid; gap: 20px; }
  ol.passos li {
    counter-increment: p;
    display: grid; grid-template-columns: 32px 1fr; gap: 15px; align-items: start;
  }
  ol.passos li::before {
    content: counter(p);
    width: 32px; height: 32px; border-radius: 9px;
    background: var(--marca); color: var(--surface);
    display: grid; place-items: center;
    font-family: var(--display); font-weight: 700; font-size: 14.5px;
  }
  ol.passos h4 { margin: 5px 0 4px; font-size: 15px; font-weight: 700; font-family: var(--display); }
  ol.passos p { margin: 0; font-size: 14px; color: var(--ink-suave); }
  code {
    font-family: ui-monospace, "SF Mono", Menlo, monospace;
    font-size: .875em;
    background: var(--ground);
    border: 1px solid var(--linha);
    padding: 1px 6px; border-radius: 5px;
    color: var(--marca);
    white-space: nowrap;
  }
  .rolavel { overflow-x: auto; }

  footer {
    text-align: center; color: var(--ink-suave);
    font-size: 13px; padding: 46px 0 56px;
  }

  /* ── Lightbox ── */
  dialog#lb {
    border: none; padding: 0; background: transparent;
    max-width: 100vw; max-height: 100vh; width: 100%; height: 100%;
    overscroll-behavior: contain;
  }
  dialog#lb::backdrop { background: rgba(6,14,32,.9); }
  .lb-inner { height: 100%; display: grid; place-items: center; padding: 22px; gap: 14px; grid-template-rows: 1fr auto; }
  #lb img { max-width: 100%; max-height: 100%; border-radius: 14px; box-shadow: 0 30px 80px rgba(0,0,0,.5); object-fit: contain; }
  #lb figcaption { color: #fff; font-size: 14px; text-align: center; padding: 0; font-weight: 500; }
  #lb-fechar {
    position: fixed; top: 14px; right: 14px;
    width: 42px; height: 42px; border-radius: 50%;
    background: rgba(255,255,255,.14); color: #fff;
    border: none; font-size: 21px; cursor: pointer; line-height: 1;
  }
  #lb-fechar:hover { background: rgba(255,255,255,.26); }
  #lb-fechar:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }

  @media (prefers-reduced-motion: reduce) {
    * { transition: none !important; animation: none !important; }
  }
  @media (max-width: 620px) {
    .grade { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 26px 16px; }
    .grade.admin { grid-template-columns: 1fr; }
    .publicar { padding: 24px 20px; }
    .numeros { gap: 22px; }
  }
</style>

<header>
  <div class="wrap">
    <div class="marca">
      <div class="logo-q">Q</div>
      <div class="marca-txt">Quadrata Seguros</div>
    </div>
    <h1>Quadrata App</h1>
    <p>O aplicativo dos seus segurados e o painel onde você cadastra as apólices. Todas as telas abaixo são capturas do sistema rodando de verdade, com um cliente e uma apólice já cadastrados.</p>
    <div class="numeros">
      <div class="numero"><b>17</b><span>telas prontas</span></div>
      <div class="numero"><b>11</b><span>no app do cliente</span></div>
      <div class="numero"><b>6</b><span>no painel admin</span></div>
    </div>
  </div>
</header>

<section>
  <div class="wrap">
    <div class="titulo-secao">
      <span class="eyebrow">Para o segurado</span>
      <h2>App do cliente</h2>
      <p>Ele instala pelo link, entra com o CPF e vê apenas as próprias apólices. Toque em qualquer tela para ampliar.</p>
    </div>
    <div class="grade">${APP.map(phone).join("")}
    </div>
  </div>
</section>

<section>
  <div class="wrap">
    <div class="titulo-secao">
      <span class="eyebrow">Para a corretora</span>
      <h2>Painel administrativo</h2>
      <p>É aqui que você cadastra clientes, apólices e boletos. O que você salva aparece no celular do cliente.</p>
    </div>
    <div class="grade admin">${ADMIN.map(janela).join("")}
    </div>
  </div>
</section>

<div class="wrap">
  <div class="publicar">
    <h2>Para colocar no ar</h2>
    <p>Faltam dois ajustes no Railway. Depois disso o link já pode ser enviado aos clientes.</p>
    <ol class="passos">
      <li>
        <div>
          <h4>Criar o volume de dados</h4>
          <p>No projeto do Railway: <strong>Volumes → New Volume</strong>, com o caminho <code>/data</code>. Sem isso os cadastros são apagados a cada publicação.</p>
        </div>
      </li>
      <li>
        <div>
          <h4>Definir as variáveis</h4>
          <p class="rolavel"><code>ADMIN_PASSWORD</code>, <code>JWT_SECRET</code> e <code>DB_PATH=/data/quadrata.db</code>.</p>
        </div>
      </li>
      <li>
        <div>
          <h4>Enviar o link ao cliente</h4>
          <p>Ele abre o endereço terminado em <code>/quadrata/login</code> e escolhe “Adicionar à tela de início”. O ícone azul entra junto dos outros apps, sem passar por loja.</p>
        </div>
      </li>
    </ol>
  </div>
</div>

<footer class="wrap">Quadrata App v1.0 · Quadrata Seguros</footer>

<dialog id="lb">
  <div class="lb-inner">
    <img id="lb-img" alt="" />
    <figcaption id="lb-cap"></figcaption>
  </div>
  <button id="lb-fechar" aria-label="Fechar">✕</button>
</dialog>

<script>
  const lb = document.getElementById("lb");
  const lbImg = document.getElementById("lb-img");
  const lbCap = document.getElementById("lb-cap");

  document.querySelectorAll(".tela").forEach((fig) => {
    fig.tabIndex = 0;
    fig.setAttribute("role", "button");
    const abrir = () => {
      lbImg.src = fig.dataset.src;
      lbImg.alt = fig.dataset.titulo;
      lbCap.textContent = fig.dataset.titulo;
      lb.showModal();
    };
    fig.addEventListener("click", abrir);
    fig.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); abrir(); }
    });
  });

  document.getElementById("lb-fechar").addEventListener("click", () => lb.close());
  lb.addEventListener("click", (e) => { if (e.target === lb || e.target.closest(".lb-inner") === e.target) lb.close(); });
  document.querySelector(".lb-inner").addEventListener("click", (e) => { if (e.target.id !== "lb-img") lb.close(); });
</script>
`;

fs.writeFileSync(OUT, html);
const kb = (fs.statSync(OUT).size / 1024 / 1024).toFixed(2);
console.log(`Galeria gerada: ${OUT} (${kb} MB)`);
