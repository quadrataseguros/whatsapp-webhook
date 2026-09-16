// Agradecimentos via WhatsApp aos participantes do sorteio.
//
// Busca os participantes no Supabase e dispara uma mensagem personalizada para
// cada um. Como esses contatos não puxaram conversa com a gente, o envio sai
// por TEMPLATE aprovado na Meta: a Cloud API só aceita texto livre dentro da
// janela de 24h depois que o cliente escreveu (fora dela a API devolve o erro
// 131047). O modo texto fica disponível em AGRADECIMENTO_MODO=texto para quando
// a lista for só de gente que respondeu há pouco.

const axios = require("axios");

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_KEY || "";

const WA_PHONE_NUMBER_ID = process.env.WA_PHONE_NUMBER_ID || "";
const WA_ACCESS_TOKEN = process.env.WA_ACCESS_TOKEN || "";
const GRAPH_VERSION = process.env.GRAPH_VERSION || "v21.0";

// Nome do template cadastrado em Meta Business > WhatsApp > Modelos de mensagem.
// O corpo precisa ter um único parâmetro {{1}}, que recebe o primeiro nome.
const TEMPLATE_NOME = process.env.AGRADECIMENTO_TEMPLATE || "agradecimento_evento";
const TEMPLATE_IDIOMA = process.env.AGRADECIMENTO_TEMPLATE_LANG || "pt_BR";
// link     → o painel monta um wa.me por pessoa e quem dispara é você, pelo
//             WhatsApp Web logado no número da corretora. É o padrão: não
//             depende de token, de template aprovado nem de migrar o número.
// template → Cloud API com template aprovado (para quem já tem o número na API).
// texto    → Cloud API em texto livre, só vale dentro da janela de 24h.
const MODOS = ["link", "template", "texto"];
const MODO = MODOS.includes(process.env.AGRADECIMENTO_MODO)
  ? process.env.AGRADECIMENTO_MODO
  : "link";

// Intervalo entre envios, para não estourar o limite da Cloud API.
const INTERVALO_MS = Number(process.env.AGRADECIMENTO_INTERVALO_MS) || 1000;

const TEXTO_AGRADECIMENTO =
  "sou Fabricio da Quadrata Seguros e estou passando para te agradecer. O " +
  "encontro dessa semana foi sensacional. Minha equipe e eu estamos a inteira " +
  "disposição e em breve vamos agendar uma nova conversa com aprofundamento " +
  "nas garantias de aluguéis, seguros de responsabilidade e consórcio. " +
  "Estamos ansiosos para um novo encontro, esperamos você lá!";

const espera = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Busca todos os participantes do sorteio no Supabase.
 */
async function buscarParticipantes() {
  if (!SUPABASE_URL || !SUPABASE_KEY)
    throw new Error("Supabase não configurado (SUPABASE_URL ou SUPABASE_KEY faltando)");

  const response = await axios.get(`${SUPABASE_URL}/rest/v1/participantes`, {
    params: { select: "id,nome,email,telefone,empresa", order: "created_at.asc" },
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  return response.data || [];
}

/**
 * Normaliza um telefone brasileiro para o formato que a Cloud API espera
 * (DDI + DDD + número, só dígitos). Devolve null se não der para aproveitar.
 *
 * Aceita o número com ou sem DDI, com ou sem máscara, e com o zero do DDD.
 * Não mexe no nono dígito: acrescentar ou tirar o 9 por conta própria erra em
 * boa parte dos DDDs, então o número vai como foi cadastrado.
 */
function normalizarTelefone(telefone) {
  if (!telefone) return null;

  let digitos = String(telefone).replace(/\D/g, "");

  // Zeros de operadora/DDD na frente ("011 9..." ou "0 11 9...").
  digitos = digitos.replace(/^0+/, "");

  // Já veio com o DDI do Brasil: 55 + DDD (2) + assinante (8 ou 9).
  if (digitos.length >= 12 && digitos.length <= 13 && digitos.startsWith("55"))
    digitos = digitos.slice(2);

  // Sobrou DDD (2) + assinante (8 ou 9).
  if (digitos.length < 10 || digitos.length > 11) return null;

  const ddd = Number(digitos.slice(0, 2));
  if (ddd < 11 || ddd > 99) return null;

  return `55${digitos}`;
}

/**
 * Primeiro nome, para a mensagem não ficar com o nome completo do cadastro.
 */
function primeiroNome(nome) {
  const limpo = String(nome || "").trim().replace(/\s+/g, " ");
  return limpo ? limpo.split(" ")[0] : "";
}

/**
 * Texto da mensagem de agradecimento (usado no modo texto e na prévia).
 */
function criarMensagem(nome) {
  const tratamento = primeiroNome(nome);
  return tratamento
    ? `Olá ${tratamento}, ${TEXTO_AGRADECIMENTO}`
    : `Olá, ${TEXTO_AGRADECIMENTO}`;
}

/**
 * Link que abre a conversa com a mensagem já escrita. Quem envia é o WhatsApp
 * em que o operador estiver logado, então a mensagem sai do número da corretora
 * sem passar pela Cloud API.
 */
function linkWhatsApp(telefone, nome) {
  const numero = normalizarTelefone(telefone);
  if (!numero) return null;
  return `https://wa.me/${numero}?text=${encodeURIComponent(criarMensagem(nome))}`;
}

/**
 * Monta o corpo da chamada à Cloud API conforme o modo configurado.
 */
function montarPayload(numero, nome) {
  if (MODO === "texto")
    return {
      messaging_product: "whatsapp",
      to: numero,
      type: "text",
      text: { body: criarMensagem(nome) },
    };

  return {
    messaging_product: "whatsapp",
    to: numero,
    type: "template",
    template: {
      name: TEMPLATE_NOME,
      language: { code: TEMPLATE_IDIOMA },
      components: [
        {
          type: "body",
          parameters: [{ type: "text", text: primeiroNome(nome) || "tudo bem" }],
        },
      ],
    },
  };
}

/**
 * Envia o agradecimento para um participante.
 */
async function enviarAgradecimento(telefone, nome) {
  if (!WA_PHONE_NUMBER_ID || !WA_ACCESS_TOKEN)
    throw new Error("WhatsApp não configurado (WA_PHONE_NUMBER_ID ou WA_ACCESS_TOKEN faltando)");

  const numero = normalizarTelefone(telefone);
  if (!numero) throw new Error(`Telefone inválido: ${telefone}`);

  try {
    const { data } = await axios.post(
      `https://graph.facebook.com/${GRAPH_VERSION}/${WA_PHONE_NUMBER_ID}/messages`,
      montarPayload(numero, nome),
      {
        headers: {
          Authorization: `Bearer ${WA_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
    return { sucesso: true, numero, nome, id: data?.messages?.[0]?.id || null };
  } catch (error) {
    const meta = error.response?.data?.error;
    console.error(`Erro ao enviar para ${numero}:`, meta || error.message);
    throw new Error(meta?.message || error.message);
  }
}

/**
 * Envia o agradecimento para todos os participantes, um a um.
 *
 * Números repetidos no cadastro recebem uma mensagem só — a pessoa que se
 * inscreveu duas vezes não precisa ser agradecida duas vezes.
 */
async function enviarAgradecimentosTodos() {
  if (MODO === "link")
    throw new Error(
      "No modo link quem dispara é você, pelo WhatsApp Web: use os botões da lista."
    );

  const participantes = await buscarParticipantes();
  if (!participantes.length)
    return { enviados: 0, erros: 0, ignorados: 0, detalhes: [], modo: MODO };

  const resultados = { enviados: 0, erros: 0, ignorados: 0, detalhes: [], modo: MODO };
  const jaEnviados = new Set();

  for (const p of participantes) {
    const numero = normalizarTelefone(p.telefone);

    if (numero && jaEnviados.has(numero)) {
      resultados.ignorados++;
      resultados.detalhes.push({
        nome: p.nome,
        status: "ignorado",
        motivo: "número repetido no cadastro",
      });
      continue;
    }

    try {
      await enviarAgradecimento(p.telefone, p.nome);
      if (numero) jaEnviados.add(numero);
      resultados.enviados++;
      resultados.detalhes.push({ nome: p.nome, status: "enviado" });
    } catch (error) {
      resultados.erros++;
      resultados.detalhes.push({ nome: p.nome, status: "erro", motivo: error.message });
    }

    await espera(INTERVALO_MS);
  }

  return resultados;
}

/**
 * Pergunta à Meta de qual número o WA_PHONE_NUMBER_ID configurado realmente
 * dispara. O número de origem não se escolhe no código: ele é o que estiver
 * amarrado a esse id na conta comercial. Conferir antes de um envio em massa
 * evita agradecer a lista inteira pelo número errado.
 */
async function conferirRemetente() {
  if (MODO === "link")
    return { ok: true, link: true, numero: null, nome: null };

  if (!WA_PHONE_NUMBER_ID || !WA_ACCESS_TOKEN)
    return { ok: false, erro: "WA_PHONE_NUMBER_ID ou WA_ACCESS_TOKEN faltando" };

  try {
    const { data } = await axios.get(
      `https://graph.facebook.com/${GRAPH_VERSION}/${WA_PHONE_NUMBER_ID}`,
      {
        params: { fields: "display_phone_number,verified_name,quality_rating,platform_type" },
        headers: { Authorization: `Bearer ${WA_ACCESS_TOKEN}` },
      }
    );
    return {
      ok: true,
      numero: data.display_phone_number || null,
      nome: data.verified_name || null,
      qualidade: data.quality_rating || null,
      plataforma: data.platform_type || null,
    };
  } catch (error) {
    const meta = error.response?.data?.error;
    return { ok: false, erro: meta?.message || error.message };
  }
}

/**
 * Participantes com o telefone já normalizado, para a tabela do painel.
 */
async function listarParaPainel() {
  const [participantes, remetente] = await Promise.all([
    buscarParticipantes(),
    conferirRemetente(),
  ]);
  const vistos = new Set();

  const lista = participantes.map((p) => {
    const numero = normalizarTelefone(p.telefone);
    const repetido = Boolean(numero) && vistos.has(numero);
    if (numero) vistos.add(numero);

    return {
      nome: p.nome || "",
      telefone: p.telefone || "",
      numero,
      email: p.email || "",
      empresa: p.empresa || "",
      repetido,
      link: repetido ? null : linkWhatsApp(p.telefone, p.nome),
    };
  });

  return {
    total: lista.length,
    enviaveis: lista.filter((p) => p.numero && !p.repetido).length,
    modo: MODO,
    remetente,
    template: MODO === "template" ? TEMPLATE_NOME : null,
    exemplo: criarMensagem("João Silva"),
    participantes: lista,
  };
}

/**
 * Página do painel. Não traz dado nenhum embutido: a tabela só é carregada
 * depois que a senha do painel é aceita, como nas outras telas administrativas.
 */
function gerarPaginaPreview() {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Agradecimentos — WhatsApp</title>
<style>
:root{--azul:#0052A3}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;background:#f5f5f5;padding:20px;color:#1f2937}
.wrap{max-width:1100px;margin:0 auto;background:#fff;border-radius:8px;padding:30px}
h1{color:var(--azul);margin-bottom:6px;font-size:24px}
h2{font-size:17px;margin:26px 0 10px}
.sub{color:#666;margin-bottom:22px}
label{display:block;font-size:14px;margin-bottom:6px}
input{width:100%;max-width:280px;padding:10px;border:1px solid #d1d5db;border-radius:6px;font-family:inherit;font-size:14px}
.card{border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin-bottom:20px}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:16px;margin-bottom:10px}
.stat{background:#E6F0FF;padding:18px;border-radius:8px;text-align:center}
.stat-n{font-size:30px;font-weight:700;color:var(--azul)}
.stat-l{color:#666;font-size:13px}
.msg{background:#f0f0f0;padding:18px;border-radius:8px;border-left:4px solid var(--azul);white-space:pre-wrap;font-size:14px;line-height:1.5}
.aviso{background:#FEF3C7;border-left:4px solid #D97706;padding:14px 18px;border-radius:8px;font-size:14px;line-height:1.5;margin-bottom:20px}
.aviso.ok{background:#DCFCE7;border-left-color:#16A34A}
.btn-abrir{background:#0052A3;color:#fff;padding:7px 14px;font-size:13px;text-decoration:none;border-radius:6px;display:inline-block}
.btn-abrir:hover{background:#003d7a}
tr.feito td{opacity:.45}
tr.feito .btn-abrir{background:#9ca3af}
.progresso{font-weight:600;color:var(--azul)}
.marcar{width:18px;height:18px;cursor:pointer}
table{width:100%;border-collapse:collapse;margin-bottom:16px;font-size:14px}
th{background:var(--azul);color:#fff;padding:11px;text-align:left;font-weight:600}
td{padding:11px;border-bottom:1px solid #eee}
tr:hover td{background:#f9f9f9}
.tag{font-size:12px;padding:2px 8px;border-radius:99px;background:#e5e7eb}
.tag.ruim{background:#FEE2E2;color:#991B1B}
.tag.rep{background:#FEF3C7;color:#92400E}
.botoes{display:flex;gap:10px;margin-top:18px;flex-wrap:wrap}
button{padding:12px 22px;border:0;border-radius:6px;cursor:pointer;font-weight:600;font-size:14px;font-family:inherit}
button:disabled{opacity:.6;cursor:default}
.btn-ok{background:#22C55E;color:#fff}
.btn-ok:hover:enabled{background:#16a34a}
.btn-sec{background:#e5e7eb;color:#1f2937}
.erro{color:#b91c1c;font-size:14px;margin-top:12px}
</style>
</head>
<body>
<div class="wrap">
  <h1>Agradecimentos via WhatsApp</h1>
  <div class="sub">Mensagem personalizada para os participantes do sorteio</div>

  <div class="card" id="login">
    <label for="s">Senha do painel</label>
    <input id="s" type="password" autocomplete="current-password">
    <div class="botoes"><button class="btn-ok" id="btn-entrar">Ver participantes</button></div>
    <div class="erro" id="erro" hidden></div>
  </div>

  <div id="painel" hidden></div>
</div>

<script>
const $ = (id) => document.getElementById(id);
let senha = "";

function erro(texto){ const e = $('erro'); e.textContent = texto; e.hidden = false; }

async function chamar(rota, metodo){
  const r = await fetch(rota, { method: metodo || 'GET', headers: { 'x-admin-password': senha } });
  const d = await r.json();
  if (!r.ok) throw new Error(d.erro || d.error || 'Não foi possível carregar.');
  return d;
}

async function entrar(){
  senha = $('s').value;
  $('erro').hidden = true;
  let d;
  try { d = await chamar('/api/agradecimentos/participantes'); }
  catch (e) { erro(e.message); return; }
  $('login').hidden = true;
  $('painel').hidden = false;
  desenhar(d);
}

function celula(texto, classe){
  const td = document.createElement('td');
  if (classe) { const s = document.createElement('span'); s.className = classe.c; s.textContent = texto; td.appendChild(s); }
  else td.textContent = texto;
  return td;
}

// O que já foi disparado fica neste navegador, para dar para parar no meio da
// lista e voltar depois sem perder o lugar. Se o navegador bloquear o
// armazenamento, a tela continua funcionando — só não lembra entre recargas.
const CHAVE = 'agradecimentos-feitos';
let feitos = new Set();

function carregarFeitos(){
  try { feitos = new Set(JSON.parse(localStorage.getItem(CHAVE) || '[]')); }
  catch (e) { feitos = new Set(); }
}

function gravarFeitos(){
  try { localStorage.setItem(CHAVE, JSON.stringify([...feitos])); } catch (e) {}
}

function marcar(numero, feito, tr, propagar){
  if (!numero) return;
  if (feito) feitos.add(numero); else feitos.delete(numero);
  gravarFeitos();
  tr.className = feito ? 'feito' : '';
  if (propagar) { const c = tr.querySelector('.marcar'); if (c) c.checked = feito; }
  atualizarProgresso();
}

function atualizarProgresso(){
  const alvo = $('progresso');
  if (alvo) alvo.textContent = feitos.size + ' de ' + alvo.dataset.total + ' já enviados';
}

function desenhar(d){
  carregarFeitos();
  const painel = $('painel');
  painel.textContent = '';

  const stats = document.createElement('div');
  stats.className = 'stats';
  [[d.total, 'Participantes'],
   [d.enviaveis, d.modo === 'link' ? 'Com link pronto' : 'Vão receber'],
   [d.total - d.enviaveis, 'Fora do envio']]
    .forEach(([n, rotulo]) => {
      const box = document.createElement('div');
      box.className = 'stat';
      const num = document.createElement('div'); num.className = 'stat-n'; num.textContent = n;
      const lab = document.createElement('div'); lab.className = 'stat-l'; lab.textContent = rotulo;
      box.appendChild(num); box.appendChild(lab); stats.appendChild(box);
    });
  painel.appendChild(stats);

  const remetente = document.createElement('div');
  remetente.className = d.remetente.ok ? 'aviso ok' : 'aviso';
  if (d.remetente.link)
    remetente.textContent = 'As mensagens saem do WhatsApp em que você estiver logado no WhatsApp Web. Abra o web.whatsapp.com com o número da corretora antes de começar.';
  else if (d.remetente.ok)
    remetente.textContent = 'As mensagens saem de ' + (d.remetente.numero || 'número não informado')
      + (d.remetente.nome ? ' (' + d.remetente.nome + ')' : '')
      + '. Confira se é o número certo antes de disparar.';
  else
    remetente.textContent = 'Não deu para confirmar de qual número as mensagens sairão: ' + d.remetente.erro;
  painel.appendChild(remetente);

  const aviso = document.createElement('div');
  aviso.className = 'aviso';
  if (d.modo === 'link')
    aviso.textContent = 'Clique em Abrir para cada pessoa: o WhatsApp abre a conversa com a mensagem já escrita e você confere antes de dar Enter. A linha é marcada sozinha, e o que você já fez fica salvo neste navegador se precisar parar no meio.';
  else if (d.modo === 'template')
    aviso.textContent = 'Envio por template aprovado ("' + d.template + '"). É o que a Meta exige para iniciar conversa com quem não escreveu para a gente nas últimas 24 horas.';
  else
    aviso.textContent = 'Envio em texto livre. A Meta só entrega para quem mandou mensagem nas últimas 24 horas; para os demais a API recusa com o erro 131047.';
  painel.appendChild(aviso);

  const h2msg = document.createElement('h2'); h2msg.textContent = 'Prévia da mensagem';
  const msg = document.createElement('div'); msg.className = 'msg'; msg.textContent = d.exemplo;
  painel.appendChild(h2msg); painel.appendChild(msg);

  const h2lista = document.createElement('h2'); h2lista.textContent = 'Participantes';
  painel.appendChild(h2lista);

  const tabela = document.createElement('table');
  const thead = document.createElement('thead');
  const trh = document.createElement('tr');
  const colunas = d.modo === 'link'
    ? ['', '#', 'Nome', 'Telefone', 'Empresa', 'Situação', 'Ação']
    : ['#', 'Nome', 'Telefone', 'E-mail', 'Empresa', 'Situação'];
  colunas.forEach((t) => {
    const th = document.createElement('th'); th.textContent = t; trh.appendChild(th);
  });
  thead.appendChild(trh); tabela.appendChild(thead);

  const tbody = document.createElement('tbody');
  if (!d.participantes.length) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = colunas.length; td.style.textAlign = 'center'; td.style.color = '#999';
    td.textContent = 'Nenhum participante cadastrado.';
    tr.appendChild(td); tbody.appendChild(tr);
  }
  d.participantes.forEach((p, i) => {
    const tr = document.createElement('tr');

    if (d.modo === 'link') {
      const tdMarca = document.createElement('td');
      const marca = document.createElement('input');
      marca.type = 'checkbox';
      marca.className = 'marcar';
      marca.disabled = !p.link;
      marca.checked = Boolean(p.link) && feitos.has(p.numero);
      marca.addEventListener('change', () => marcar(p.numero, marca.checked, tr));
      tdMarca.appendChild(marca);
      tr.appendChild(tdMarca);
      if (marca.checked) tr.className = 'feito';
    }

    tr.appendChild(celula(String(i + 1)));
    tr.appendChild(celula(p.nome));
    tr.appendChild(celula(p.telefone));
    if (d.modo !== 'link') tr.appendChild(celula(p.email));
    tr.appendChild(celula(p.empresa || '—'));

    if (!p.numero) tr.appendChild(celula('telefone inválido', { c: 'tag ruim' }));
    else if (p.repetido) tr.appendChild(celula('número repetido', { c: 'tag rep' }));
    else tr.appendChild(celula(d.modo === 'link' ? 'pronto' : 'vai receber', { c: 'tag' }));

    if (d.modo === 'link') {
      const tdAcao = document.createElement('td');
      if (p.link) {
        const a = document.createElement('a');
        a.className = 'btn-abrir';
        a.href = p.link;
        a.target = '_blank';
        a.rel = 'noopener';
        a.textContent = 'Abrir';
        // Abrir a conversa já conta como feito: a pessoa confere e dá Enter lá.
        a.addEventListener('click', () => marcar(p.numero, true, tr, true));
        tdAcao.appendChild(a);
      } else tdAcao.textContent = '—';
      tr.appendChild(tdAcao);
    }

    tbody.appendChild(tr);
  });
  tabela.appendChild(tbody);
  painel.appendChild(tabela);

  const botoes = document.createElement('div');
  botoes.className = 'botoes';

  if (d.modo === 'link') {
    const prog = document.createElement('div');
    prog.id = 'progresso';
    prog.className = 'progresso';
    prog.dataset.total = d.enviaveis;
    botoes.appendChild(prog);

    const limpar = document.createElement('button');
    limpar.className = 'btn-sec';
    limpar.textContent = 'Recomeçar a contagem';
    limpar.addEventListener('click', () => {
      if (!confirm('Desmarcar todo mundo e recomeçar a contagem?')) return;
      feitos = new Set(); gravarFeitos(); desenhar(d);
    });
    botoes.appendChild(limpar);
  } else {
    const enviar = document.createElement('button');
    enviar.className = 'btn-ok';
    enviar.textContent = 'Enviar ' + d.enviaveis + ' agradecimentos';
    enviar.disabled = d.enviaveis === 0;
    enviar.addEventListener('click', () => confirmarEnvio(enviar, d.enviaveis));
    botoes.appendChild(enviar);
  }

  painel.appendChild(botoes);
  atualizarProgresso();

  const saida = document.createElement('div');
  saida.id = 'saida';
  painel.appendChild(saida);
}

async function confirmarEnvio(botao, quantos){
  const pergunta = 'Enviar agradecimento para ' + quantos + ' participantes? Isso pode levar alguns minutos.';
  if (!confirm(pergunta)) return;

  botao.disabled = true;
  const original = botao.textContent;
  botao.textContent = 'Enviando...';

  try {
    const d = await chamar('/api/agradecimentos/enviar', 'POST');
    mostrarResultado(d);
  } catch (e) {
    botao.disabled = false;
    botao.textContent = original;
    alert('Erro: ' + e.message);
  }
}

function mostrarResultado(d){
  const saida = $('saida');
  saida.textContent = '';

  const h2 = document.createElement('h2'); h2.textContent = 'Resultado';
  saida.appendChild(h2);

  const resumo = document.createElement('div');
  resumo.className = 'msg';
  resumo.textContent = 'Enviados: ' + d.enviados + ' | Erros: ' + d.erros + ' | Ignorados: ' + d.ignorados;
  saida.appendChild(resumo);

  const tabela = document.createElement('table');
  const thead = document.createElement('thead');
  const trh = document.createElement('tr');
  ['Nome', 'Situação', 'Motivo'].forEach((t) => {
    const th = document.createElement('th'); th.textContent = t; trh.appendChild(th);
  });
  thead.appendChild(trh); tabela.appendChild(thead);

  const tbody = document.createElement('tbody');
  d.detalhes.forEach((r) => {
    const tr = document.createElement('tr');
    tr.appendChild(celula(r.nome));
    tr.appendChild(celula(r.status));
    tr.appendChild(celula(r.motivo || '—'));
    tbody.appendChild(tr);
  });
  tabela.appendChild(tbody);
  saida.appendChild(tabela);
}

$('btn-entrar').addEventListener('click', entrar);
$('s').addEventListener('keydown', (e) => { if (e.key === 'Enter') entrar(); });
</script>
</body>
</html>`;
}

module.exports = {
  buscarParticipantes,
  linkWhatsApp,
  conferirRemetente,
  criarMensagem,
  enviarAgradecimento,
  enviarAgradecimentosTodos,
  gerarPaginaPreview,
  listarParaPainel,
  normalizarTelefone,
  primeiroNome,
};
