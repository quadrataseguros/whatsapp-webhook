// Painel admin Quadrata — HTML inline servido pelo Express
const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Quadrata Admin</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',system-ui,sans-serif;background:#F3F6FC;color:#222;min-height:100vh}
:root{--blue:#0D2B6E;--blue2:#1a3d8f;--green:#16A34A;--red:#DC2626;--orange:#EA580C}

/* ── Layout ── */
#app{display:flex;min-height:100vh}
#sidebar{width:230px;background:var(--blue);display:flex;flex-direction:column;position:fixed;top:0;bottom:0;z-index:100}
#main{margin-left:230px;flex:1;display:flex;flex-direction:column;min-height:100vh}
#topbar{background:#fff;padding:14px 24px;border-bottom:1px solid #E0E8F5;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:50}
#content{padding:24px;flex:1}

/* ── Sidebar ── */
.logo-wrap{padding:20px 20px 14px;border-bottom:1px solid rgba(255,255,255,.12)}
.logo-q{width:44px;height:44px;border-radius:22px;background:#fff;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:900;color:var(--blue);margin-bottom:8px}
.logo-name{color:#fff;font-weight:700;font-size:15px}
.logo-sub{color:rgba(255,255,255,.5);font-size:11px;margin-top:2px}
nav{flex:1;padding:12px 0}
nav a{display:flex;align-items:center;gap:10px;padding:10px 20px;color:rgba(255,255,255,.75);text-decoration:none;font-size:14px;cursor:pointer;transition:.15s}
nav a:hover,nav a.active{background:rgba(255,255,255,.12);color:#fff}
nav a .ic{font-size:18px;width:24px;text-align:center}
.sidebar-footer{padding:14px 20px;border-top:1px solid rgba(255,255,255,.12)}
.sidebar-footer small{color:rgba(255,255,255,.4);font-size:11px}

/* ── Cards de stats ── */
.stats{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:16px;margin-bottom:24px}
.stat-card{background:#fff;border-radius:14px;padding:18px;box-shadow:0 2px 8px rgba(0,0,0,.06)}
.stat-num{font-size:32px;font-weight:800;color:var(--blue)}
.stat-label{font-size:12px;color:#888;margin-top:2px}
.stat-icon{font-size:28px;margin-bottom:6px}

/* ── Tabela ── */
.table-wrap{background:#fff;border-radius:14px;box-shadow:0 2px 8px rgba(0,0,0,.06);overflow:hidden}
table{width:100%;border-collapse:collapse}
th{background:#F8FAFF;padding:12px 16px;text-align:left;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:.5px;border-bottom:1px solid #E0E8F5}
td{padding:12px 16px;border-bottom:1px solid #F3F6FC;font-size:13px;vertical-align:middle}
tr:last-child td{border:none}
tr:hover td{background:#FAFBFF}

/* ── Badges ── */
.badge{display:inline-block;padding:3px 10px;border-radius:6px;font-size:11px;font-weight:700}
.badge-green{background:#DCFCE7;color:var(--green)}
.badge-red{background:#FEE2E2;color:var(--red)}
.badge-yellow{background:#FEF3C7;color:#B45309}
.badge-gray{background:#F3F4F6;color:#6B7280}

/* ── Botões ── */
.btn{display:inline-flex;align-items:center;gap:6px;padding:9px 18px;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;border:none;transition:.15s}
.btn-primary{background:var(--blue);color:#fff}
.btn-primary:hover{background:var(--blue2)}
.btn-danger{background:var(--red);color:#fff}
.btn-sm{padding:5px 12px;font-size:12px;border-radius:8px}
.btn-outline{background:#fff;border:1.5px solid #E0E8F5;color:#555}
.btn-outline:hover{border-color:var(--blue);color:var(--blue)}
.btn-success{background:var(--green);color:#fff}

/* ── Toolbar ── */
.toolbar{display:flex;align-items:center;gap:10px;margin-bottom:16px;flex-wrap:wrap}
.toolbar h2{flex:1;font-size:18px;font-weight:700;color:var(--blue)}
.search-input{padding:9px 14px;border:1.5px solid #E0E8F5;border-radius:10px;font-size:13px;min-width:200px}
.search-input:focus{outline:none;border-color:var(--blue)}

/* ── Modal ── */
.modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:200;display:flex;align-items:center;justify-content:center;padding:16px}
.modal{background:#fff;border-radius:16px;width:100%;max-width:540px;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.2)}
.modal-header{padding:20px 24px 16px;border-bottom:1px solid #E0E8F5;display:flex;align-items:center;justify-content:space-between}
.modal-header h3{font-size:17px;font-weight:700;color:var(--blue)}
.modal-close{background:none;border:none;font-size:22px;cursor:pointer;color:#aaa;line-height:1}
.modal-body{padding:20px 24px}
.modal-footer{padding:16px 24px 20px;display:flex;gap:10px;justify-content:flex-end}

/* ── Formulário ── */
.field{margin-bottom:14px}
.field label{display:block;font-size:12px;font-weight:700;color:#555;margin-bottom:5px;text-transform:uppercase;letter-spacing:.4px}
.field input,.field select,.field textarea{width:100%;padding:11px 14px;border:1.5px solid #E0E8F5;border-radius:10px;font-size:14px;color:#222;background:#F8FAFF}
.field input:focus,.field select:focus,.field textarea:focus{outline:none;border-color:var(--blue);background:#fff}
.field textarea{resize:vertical;min-height:80px}
.field-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}

/* ── Login ── */
#login-screen{min-height:100vh;background:var(--blue);display:flex;align-items:center;justify-content:center}
.login-card{background:#fff;border-radius:20px;padding:36px;width:100%;max-width:380px;box-shadow:0 20px 60px rgba(0,0,0,.3)}
.login-logo{text-align:center;margin-bottom:24px}
.login-q{width:72px;height:72px;border-radius:36px;background:var(--blue);display:flex;align-items:center;justify-content:center;font-size:36px;font-weight:900;color:#fff;margin:0 auto 10px}
.login-title{font-size:20px;font-weight:800;color:var(--blue)}
.login-sub{color:#888;font-size:13px;margin-top:2px}
.login-err{color:var(--red);font-size:13px;text-align:center;margin-bottom:10px}

/* ── Misc ── */
.empty{text-align:center;padding:48px;color:#aaa}
.empty-icon{font-size:48px;margin-bottom:8px}
.actions-col{display:flex;gap:6px}
.page-title{font-size:22px;font-weight:800;color:var(--blue);margin-bottom:4px}
.page-sub{color:#888;font-size:13px;margin-bottom:20px}
.hidden{display:none !important}
.chip-list{display:flex;flex-wrap:wrap;gap:6px;margin-top:4px}
.chip{padding:4px 10px;border-radius:8px;font-size:12px;background:#EBF0FB;color:var(--blue);font-weight:600}
.chip-del{cursor:pointer;opacity:.6}
.chip-del:hover{opacity:1}
.coberturas-input{display:flex;gap:8px;margin-bottom:6px}
.coberturas-input input{flex:1}
</style>
</head>
<body>

<!-- LOGIN -->
<div id="login-screen">
  <div class="login-card">
    <div class="login-logo">
      <div class="login-q">Q</div>
      <div class="login-title">Quadrata Admin</div>
      <div class="login-sub">Painel de Gestão</div>
    </div>
    <div id="login-err" class="login-err hidden"></div>
    <div class="field"><label>Usuário</label><input id="login-user" value="admin" /></div>
    <div class="field"><label>Senha</label><input id="login-pass" type="password" value="" placeholder="Sua senha" /></div>
    <button class="btn btn-primary" style="width:100%;justify-content:center;padding:12px" onclick="doLogin()">ENTRAR</button>
  </div>
</div>

<!-- APP -->
<div id="app" class="hidden">
  <!-- Sidebar -->
  <div id="sidebar">
    <div class="logo-wrap">
      <div class="logo-q">Q</div>
      <div class="logo-name">Quadrata Admin</div>
      <div class="logo-sub">Painel de Gestão</div>
    </div>
    <nav>
      <a class="active" onclick="goTo('dashboard')"><span class="ic">📊</span> Dashboard</a>
      <a onclick="goTo('clientes')"><span class="ic">👥</span> Clientes</a>
      <a onclick="goTo('apolices')"><span class="ic">📋</span> Apólices</a>
      <a onclick="goTo('boletos')"><span class="ic">📄</span> Boletos</a>
      <a onclick="doLogout()"><span class="ic">🚪</span> Sair</a>
    </nav>
    <div class="sidebar-footer"><small>Quadrata Seguros v1.0</small></div>
  </div>

  <!-- Main -->
  <div id="main">
    <div id="topbar">
      <span id="topbar-title" style="font-weight:700;font-size:16px;color:var(--blue)">Dashboard</span>
      <span id="topbar-user" style="font-size:13px;color:#888"></span>
    </div>
    <div id="content">

      <!-- DASHBOARD -->
      <div id="page-dashboard" class="page">
        <div class="page-title">Dashboard</div>
        <div class="page-sub">Resumo geral do sistema</div>
        <div class="stats" id="stats-grid"></div>
        <div class="table-wrap">
          <table><thead><tr><th>Cliente</th><th>Tipo</th><th>Nº Apólice</th><th>Cadastrado em</th></tr></thead>
          <tbody id="recent-tbody"></tbody></table>
        </div>
      </div>

      <!-- CLIENTES -->
      <div id="page-clientes" class="page hidden">
        <div class="toolbar">
          <h2>Clientes</h2>
          <input class="search-input" id="search-clientes" placeholder="Buscar por nome ou CPF..." oninput="filterTable('clientes-tbody','search-clientes')" />
          <button class="btn btn-primary" onclick="openModalCliente()">+ Novo Cliente</button>
        </div>
        <div class="table-wrap">
          <table><thead><tr><th>Nome</th><th>CPF</th><th>Telefone</th><th>E-mail</th><th>Apólices</th><th>Status</th><th>Ações</th></tr></thead>
          <tbody id="clientes-tbody"></tbody></table>
        </div>
      </div>

      <!-- APÓLICES -->
      <div id="page-apolices" class="page hidden">
        <div class="toolbar">
          <h2>Apólices</h2>
          <input class="search-input" id="search-apolices" placeholder="Buscar..." oninput="filterTable('apolices-tbody','search-apolices')" />
          <button class="btn btn-primary" onclick="openModalApolice()">+ Nova Apólice</button>
        </div>
        <div class="table-wrap">
          <table><thead><tr><th>Cliente</th><th>Tipo</th><th>Nº Apólice</th><th>Seguradora</th><th>Vigência</th><th>Prêmio</th><th>Status</th><th>Ações</th></tr></thead>
          <tbody id="apolices-tbody"></tbody></table>
        </div>
      </div>

      <!-- BOLETOS -->
      <div id="page-boletos" class="page hidden">
        <div class="toolbar">
          <h2>Boletos</h2>
          <input class="search-input" id="search-boletos" placeholder="Buscar..." oninput="filterTable('boletos-tbody','search-boletos')" />
          <button class="btn btn-primary" onclick="openModalBoleto()">+ Novo Boleto</button>
        </div>
        <div class="table-wrap">
          <table><thead><tr><th>Cliente</th><th>Apólice</th><th>Vencimento</th><th>Valor</th><th>Status</th><th>Ações</th></tr></thead>
          <tbody id="boletos-tbody"></tbody></table>
        </div>
      </div>

    </div>
  </div>
</div>

<!-- MODAL CLIENTE -->
<div id="modal-cliente" class="modal-bg hidden">
  <div class="modal">
    <div class="modal-header"><h3 id="modal-cliente-title">Novo Cliente</h3><button class="modal-close" onclick="closeModal('modal-cliente')">✕</button></div>
    <div class="modal-body">
      <input type="hidden" id="cli-editing-cpf" />
      <div class="field-row">
        <div class="field"><label>CPF *</label><input id="cli-cpf" placeholder="000.000.000-00" /></div>
        <div class="field"><label>Nome completo *</label><input id="cli-nome" placeholder="Nome do segurado" /></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Telefone</label><input id="cli-tel" placeholder="(11) 99999-9999" /></div>
        <div class="field"><label>E-mail</label><input id="cli-email" type="email" placeholder="email@exemplo.com" /></div>
      </div>
      <div class="field"><label id="cli-senha-label">Senha (acesso no app) *</label><input id="cli-senha" type="password" placeholder="Mínimo 6 caracteres" /></div>
      <div class="field hidden" id="cli-status-field">
        <label>Status</label>
        <select id="cli-ativo"><option value="1">Ativo</option><option value="0">Inativo</option></select>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-outline" onclick="closeModal('modal-cliente')">Cancelar</button>
      <button class="btn btn-primary" onclick="saveCliente()">Salvar</button>
    </div>
  </div>
</div>

<!-- MODAL APÓLICE -->
<div id="modal-apolice" class="modal-bg hidden">
  <div class="modal">
    <div class="modal-header"><h3 id="modal-apolice-title">Nova Apólice</h3><button class="modal-close" onclick="closeModal('modal-apolice')">✕</button></div>
    <div class="modal-body">
      <input type="hidden" id="ap-editing-id" />
      <div class="field"><label>Cliente *</label><select id="ap-cliente"><option value="">Selecione...</option></select></div>
      <div class="field-row">
        <div class="field"><label>Tipo *</label>
          <select id="ap-tipo">
            <option>Automóvel</option><option>Residência</option><option>Vida</option>
            <option>Saúde</option><option>Empresarial</option><option>Previdência</option>
            <option>Embarcações</option><option>Responsabilidade Civil</option><option>Outro</option>
          </select>
        </div>
        <div class="field"><label>Nº Apólice *</label><input id="ap-numero" placeholder="Ex: APL-2025-0001" /></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Seguradora</label><input id="ap-seguradora" placeholder="Porto Seguro, Allianz..." /></div>
        <div class="field"><label>Status</label>
          <select id="ap-status"><option>Vigente</option><option>Vencida</option><option>Cancelada</option><option>Em análise</option></select>
        </div>
      </div>
      <div class="field"><label>Descrição / Bem segurado</label><input id="ap-desc" placeholder="Ex: Honda Civic 2022, placa ABC-1234" /></div>
      <div class="field-row">
        <div class="field"><label>Início da vigência</label><input id="ap-inicio" type="date" /></div>
        <div class="field"><label>Fim da vigência</label><input id="ap-fim" type="date" /></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Prêmio mensal</label><input id="ap-premio" placeholder="R$ 189,00" /></div>
        <div class="field"><label>Franquia</label><input id="ap-franquia" placeholder="R$ 2.300,00" /></div>
      </div>
      <div class="field">
        <label>Coberturas incluídas</label>
        <div class="coberturas-input">
          <input id="cob-input" placeholder="Ex: Colisão, Roubo, Vidros..." />
          <button class="btn btn-outline btn-sm" onclick="addCobertura()">+ Add</button>
        </div>
        <div id="cob-list" class="chip-list"></div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-outline" onclick="closeModal('modal-apolice')">Cancelar</button>
      <button class="btn btn-primary" onclick="saveApolice()">Salvar</button>
    </div>
  </div>
</div>

<!-- MODAL BOLETO -->
<div id="modal-boleto" class="modal-bg hidden">
  <div class="modal">
    <div class="modal-header"><h3 id="modal-boleto-title">Novo Boleto</h3><button class="modal-close" onclick="closeModal('modal-boleto')">✕</button></div>
    <div class="modal-body">
      <input type="hidden" id="bol-editing-id" />
      <div class="field"><label>Cliente *</label><select id="bol-cliente" onchange="loadApolicesForBoleto()"><option value="">Selecione...</option></select></div>
      <div class="field"><label>Apólice *</label><select id="bol-apolice"><option value="">Selecione o cliente primeiro</option></select></div>
      <div class="field-row">
        <div class="field"><label>Vencimento *</label><input id="bol-venc" type="date" /></div>
        <div class="field"><label>Valor *</label><input id="bol-valor" placeholder="R$ 189,00" /></div>
      </div>
      <div class="field"><label>Status</label><select id="bol-status"><option>Em aberto</option><option>Pago</option><option>Vencido</option></select></div>
      <div class="field"><label>Linha digitável (código de barras)</label><input id="bol-linha" placeholder="00000.00000 00000.000000 00000.000000 0 00000000000000" /></div>
      <div class="field"><label>PIX Copia e Cola</label><input id="bol-pix" placeholder="Chave ou payload PIX" /></div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-outline" onclick="closeModal('modal-boleto')">Cancelar</button>
      <button class="btn btn-primary" onclick="saveBoleto()">Salvar</button>
    </div>
  </div>
</div>

<script>
let TOKEN = localStorage.getItem('qa_token') || '';
let currentPage = 'dashboard';
let coberturas = [];
let clientesCache = [];

// ── Helpers ──
const $ = id => document.getElementById(id);
const api = async (method, path, body) => {
  const r = await fetch('/api' + path, {
    method, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + TOKEN },
    body: body ? JSON.stringify(body) : undefined
  });
  if (r.status === 401) { doLogout(); return null; }
  return r.json();
};
const fmtDate = s => s ? s.split('-').reverse().join('/') : '-';
const fmtCPF = s => s ? s.replace(/(\\d{3})(\\d{3})(\\d{3})(\\d{2})/, '$1.$2.$3-$4') : s;

function filterTable(tbodyId, inputId) {
  const q = $(inputId).value.toLowerCase();
  const rows = $(tbodyId).querySelectorAll('tr');
  rows.forEach(r => r.style.display = r.textContent.toLowerCase().includes(q) ? '' : 'none');
}

// ── Auth ──
async function doLogin() {
  const usuario = $('login-user').value;
  const senha = $('login-pass').value;
  $('login-err').classList.add('hidden');
  const r = await fetch('/api/admin/login', {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({usuario, senha})
  });
  const data = await r.json();
  if (!r.ok) { $('login-err').textContent = data.erro || 'Erro ao fazer login'; $('login-err').classList.remove('hidden'); return; }
  TOKEN = data.token;
  localStorage.setItem('qa_token', TOKEN);
  $('topbar-user').textContent = 'Admin: ' + usuario;
  $('login-screen').classList.add('hidden');
  $('app').classList.remove('hidden');
  goTo('dashboard');
}

function doLogout() {
  TOKEN = ''; localStorage.removeItem('qa_token');
  $('app').classList.add('hidden'); $('login-screen').classList.remove('hidden');
}

// Auto-login se tiver token
if (TOKEN) {
  $('topbar-user').textContent = 'Admin';
  $('login-screen').classList.add('hidden');
  $('app').classList.remove('hidden');
  setTimeout(() => goTo('dashboard'), 100);
}

// ── Navegação ──
function goTo(page) {
  currentPage = page;
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
  $('page-' + page).classList.remove('hidden');
  const titles = {dashboard:'Dashboard', clientes:'Clientes', apolices:'Apólices', boletos:'Boletos'};
  $('topbar-title').textContent = titles[page];
  document.querySelectorAll('nav a').forEach(a => { if (a.textContent.trim().toLowerCase().includes(page)) a.classList.add('active'); });
  if (page === 'dashboard') loadDashboard();
  if (page === 'clientes') loadClientes();
  if (page === 'apolices') loadApolices();
  if (page === 'boletos') loadBoletos();
}

function closeModal(id) { $(id).classList.add('hidden'); }
function openModal(id) { $(id).classList.remove('hidden'); }

// ── Dashboard ──
async function loadDashboard() {
  const data = await api('GET', '/admin/stats');
  if (!data) return;
  $('stats-grid').innerHTML = [
    {n: data.totalClientes, label: 'Clientes Ativos', icon: '👥'},
    {n: data.totalApolices, label: 'Apólices Vigentes', icon: '📋'},
    {n: data.boletosAbertos, label: 'Boletos em Aberto', icon: '📄'},
    {n: data.totalSinistros, label: 'Sinistros em Análise', icon: '🚨'},
  ].map(s => \`<div class="stat-card"><div class="stat-icon">\${s.icon}</div><div class="stat-num">\${s.n}</div><div class="stat-label">\${s.label}</div></div>\`).join('');
  $('recent-tbody').innerHTML = (data.recentes || []).map(r =>
    \`<tr><td>\${r.nome}</td><td>\${r.tipo}</td><td>\${r.numero}</td><td>\${fmtDate(r.criado_em ? r.criado_em.slice(0,10) : '')}</td></tr>\`
  ).join('') || '<tr><td colspan="4" class="empty">Nenhuma apólice cadastrada</td></tr>';
}

// ── Clientes ──
async function loadClientes() {
  const rows = await api('GET', '/admin/clientes');
  if (!rows) return;
  clientesCache = rows;
  $('clientes-tbody').innerHTML = rows.length ? rows.map(c => \`
    <tr>
      <td><strong>\${c.nome}</strong></td>
      <td>\${fmtCPF(c.cpf)}</td>
      <td>\${c.telefone||'-'}</td>
      <td>\${c.email||'-'}</td>
      <td><span class="badge badge-gray">\${c.total_apolices}</span></td>
      <td><span class="badge \${c.ativo ? 'badge-green' : 'badge-red'}">\${c.ativo ? 'Ativo' : 'Inativo'}</span></td>
      <td class="actions-col">
        <button class="btn btn-outline btn-sm" onclick="editCliente('\${c.cpf}')">✏️ Editar</button>
        <button class="btn btn-danger btn-sm" onclick="delCliente('\${c.cpf}','\${c.nome}')">🗑</button>
      </td>
    </tr>\`).join('') : '<tr><td colspan="7" class="empty"><div class="empty-icon">👥</div>Nenhum cliente cadastrado</td></tr>';
}

function openModalCliente(cpf) {
  $('cli-editing-cpf').value = '';
  $('cli-cpf').value = ''; $('cli-nome').value = ''; $('cli-tel').value = '';
  $('cli-email').value = ''; $('cli-senha').value = ''; $('cli-ativo').value = '1';
  $('modal-cliente-title').textContent = 'Novo Cliente';
  $('cli-senha-label').textContent = 'Senha (acesso no app) *';
  $('cli-status-field').classList.add('hidden');
  $('cli-cpf').disabled = false;
  openModal('modal-cliente');
}

function editCliente(cpf) {
  const c = clientesCache.find(x => x.cpf === cpf);
  if (!c) return;
  $('cli-editing-cpf').value = cpf;
  $('cli-cpf').value = fmtCPF(cpf); $('cli-cpf').disabled = true;
  $('cli-nome').value = c.nome; $('cli-tel').value = c.telefone||'';
  $('cli-email').value = c.email||''; $('cli-senha').value = '';
  $('cli-ativo').value = c.ativo;
  $('modal-cliente-title').textContent = 'Editar Cliente';
  $('cli-senha-label').textContent = 'Nova senha (deixe em branco para não alterar)';
  $('cli-status-field').classList.remove('hidden');
  openModal('modal-cliente');
}

async function saveCliente() {
  const editingCpf = $('cli-editing-cpf').value;
  const body = {
    cpf: $('cli-cpf').value, nome: $('cli-nome').value,
    email: $('cli-email').value, telefone: $('cli-tel').value,
    senha: $('cli-senha').value, ativo: parseInt($('cli-ativo').value)
  };
  let r;
  if (editingCpf) { r = await api('PUT', '/admin/clientes/' + editingCpf, body); }
  else { r = await api('POST', '/admin/clientes', body); }
  if (r && (r.ok || r.cpf)) { closeModal('modal-cliente'); loadClientes(); }
  else if (r) alert(r.erro || 'Erro ao salvar');
}

async function delCliente(cpf, nome) {
  if (!confirm('Excluir cliente "' + nome + '"? Isso removerá também as apólices vinculadas.')) return;
  await api('DELETE', '/admin/clientes/' + cpf);
  loadClientes();
}

// ── Apólices ──
let apolicesCache = [];
async function loadApolices() {
  const rows = await api('GET', '/admin/apolices');
  if (!rows) return;
  apolicesCache = rows;
  $('apolices-tbody').innerHTML = rows.length ? rows.map(a => \`
    <tr>
      <td>\${a.cliente_nome||'-'}</td>
      <td>\${a.tipo}</td>
      <td><strong>\${a.numero}</strong></td>
      <td>\${a.seguradora||'-'}</td>
      <td>\${fmtDate(a.vigencia_inicio)} – \${fmtDate(a.vigencia_fim)}</td>
      <td>\${a.premio_mensal||'-'}</td>
      <td><span class="badge \${a.status==='Vigente'?'badge-green':a.status==='Vencida'?'badge-red':'badge-yellow'}">\${a.status}</span></td>
      <td class="actions-col">
        <button class="btn btn-outline btn-sm" onclick="editApolice(\${a.id})">✏️</button>
        <button class="btn btn-danger btn-sm" onclick="delApolice(\${a.id})">🗑</button>
      </td>
    </tr>\`).join('') : '<tr><td colspan="8" class="empty"><div class="empty-icon">📋</div>Nenhuma apólice cadastrada</td></tr>';
}

async function openModalApolice() {
  coberturas = [];
  $('ap-editing-id').value = ''; $('ap-numero').value = ''; $('ap-seguradora').value = '';
  $('ap-desc').value = ''; $('ap-inicio').value = ''; $('ap-fim').value = '';
  $('ap-premio').value = ''; $('ap-franquia').value = '';
  $('ap-tipo').value = 'Automóvel'; $('ap-status').value = 'Vigente';
  $('modal-apolice-title').textContent = 'Nova Apólice';
  renderCoberturas();
  const clientes = await api('GET', '/admin/clientes');
  $('ap-cliente').innerHTML = '<option value="">Selecione...</option>' + (clientes||[]).map(c => \`<option value="\${c.cpf}">\${c.nome} (\${fmtCPF(c.cpf)})</option>\`).join('');
  openModal('modal-apolice');
}

async function editApolice(id) {
  const a = apolicesCache.find(x => x.id === id);
  if (!a) return;
  coberturas = Array.isArray(a.coberturas) ? [...a.coberturas] : [];
  $('ap-editing-id').value = id;
  $('ap-numero').value = a.numero; $('ap-seguradora').value = a.seguradora||'';
  $('ap-desc').value = a.descricao||''; $('ap-inicio').value = a.vigencia_inicio||'';
  $('ap-fim').value = a.vigencia_fim||''; $('ap-premio').value = a.premio_mensal||'';
  $('ap-franquia').value = a.franquia||''; $('ap-tipo').value = a.tipo; $('ap-status').value = a.status;
  $('modal-apolice-title').textContent = 'Editar Apólice';
  renderCoberturas();
  const clientes = await api('GET', '/admin/clientes');
  $('ap-cliente').innerHTML = '<option value="">Selecione...</option>' + (clientes||[]).map(c => \`<option value="\${c.cpf}" \${c.cpf===a.cliente_cpf?'selected':''}>\${c.nome} (\${fmtCPF(c.cpf)})</option>\`).join('');
  openModal('modal-apolice');
}

function addCobertura() {
  const v = $('cob-input').value.trim();
  if (!v) return;
  coberturas.push(v); $('cob-input').value = ''; renderCoberturas();
}
$('cob-input') && document.getElementById('cob-input').addEventListener('keydown', e => e.key==='Enter' && addCobertura());

function renderCoberturas() {
  $('cob-list').innerHTML = coberturas.map((c,i) =>
    \`<span class="chip">\${c} <span class="chip-del" onclick="delCob(\${i})">✕</span></span>\`).join('');
}
function delCob(i) { coberturas.splice(i,1); renderCoberturas(); }

async function saveApolice() {
  const id = $('ap-editing-id').value;
  const body = {
    cliente_cpf: $('ap-cliente').value,
    tipo: $('ap-tipo').value, numero: $('ap-numero').value,
    seguradora: $('ap-seguradora').value, descricao: $('ap-desc').value,
    vigencia_inicio: $('ap-inicio').value, vigencia_fim: $('ap-fim').value,
    premio_mensal: $('ap-premio').value, franquia: $('ap-franquia').value,
    coberturas, status: $('ap-status').value
  };
  const r = id ? await api('PUT', '/admin/apolices/' + id, body) : await api('POST', '/admin/apolices', body);
  if (r && (r.ok || r.id)) { closeModal('modal-apolice'); loadApolices(); }
  else if (r) alert(r.erro || 'Erro ao salvar');
}

async function delApolice(id) {
  if (!confirm('Excluir apólice?')) return;
  await api('DELETE', '/admin/apolices/' + id); loadApolices();
}

// ── Boletos ──
let boletosCache = [];
async function loadBoletos() {
  const rows = await api('GET', '/admin/boletos');
  if (!rows) return;
  boletosCache = rows;
  $('boletos-tbody').innerHTML = rows.length ? rows.map(b => \`
    <tr>
      <td>\${b.cliente_nome||'-'}</td>
      <td>\${b.tipo} — \${b.numero}</td>
      <td>\${fmtDate(b.vencimento)}</td>
      <td><strong>\${b.valor}</strong></td>
      <td><span class="badge \${b.status==='Pago'?'badge-green':b.status==='Em aberto'?'badge-yellow':'badge-red'}">\${b.status}</span></td>
      <td class="actions-col">
        <button class="btn btn-outline btn-sm" onclick="editBoleto(\${b.id})">✏️</button>
        \${b.status!=='Pago'?\`<button class="btn btn-success btn-sm" onclick="markPago(\${b.id})">✓ Pago</button>\`:''}
        <button class="btn btn-danger btn-sm" onclick="delBoleto(\${b.id})">🗑</button>
      </td>
    </tr>\`).join('') : '<tr><td colspan="6" class="empty"><div class="empty-icon">📄</div>Nenhum boleto cadastrado</td></tr>';
}

async function openModalBoleto() {
  $('bol-editing-id').value = ''; $('bol-venc').value = ''; $('bol-valor').value = '';
  $('bol-linha').value = ''; $('bol-pix').value = ''; $('bol-status').value = 'Em aberto';
  $('modal-boleto-title').textContent = 'Novo Boleto';
  const clientes = await api('GET', '/admin/clientes');
  $('bol-cliente').innerHTML = '<option value="">Selecione...</option>' + (clientes||[]).map(c => \`<option value="\${c.cpf}">\${c.nome}</option>\`).join('');
  $('bol-apolice').innerHTML = '<option value="">Selecione o cliente primeiro</option>';
  openModal('modal-boleto');
}

async function loadApolicesForBoleto() {
  const cpf = $('bol-cliente').value;
  if (!cpf) return;
  const rows = await api('GET', '/admin/apolices?cpf=' + cpf);
  $('bol-apolice').innerHTML = '<option value="">Selecione...</option>' + (rows||[]).map(a => \`<option value="\${a.id}">\${a.tipo} — \${a.numero}</option>\`).join('');
}

async function editBoleto(id) {
  const b = boletosCache.find(x => x.id === id);
  if (!b) return;
  $('bol-editing-id').value = id; $('bol-venc').value = b.vencimento;
  $('bol-valor').value = b.valor; $('bol-linha').value = b.linha_digitavel||'';
  $('bol-pix').value = b.pix_copia_cola||''; $('bol-status').value = b.status;
  $('modal-boleto-title').textContent = 'Editar Boleto';
  const clientes = await api('GET', '/admin/clientes');
  $('bol-cliente').innerHTML = (clientes||[]).map(c => \`<option value="\${c.cpf}" \${c.cpf===b.cliente_cpf?'selected':''}>\${c.nome}</option>\`).join('');
  $('bol-apolice').innerHTML = \`<option value="\${b.apolice_id}" selected>\${b.tipo} — \${b.numero}</option>\`;
  openModal('modal-boleto');
}

async function saveBoleto() {
  const id = $('bol-editing-id').value;
  const body = {
    apolice_id: parseInt($('bol-apolice').value),
    cliente_cpf: $('bol-cliente').value,
    vencimento: $('bol-venc').value, valor: $('bol-valor').value,
    status: $('bol-status').value,
    linha_digitavel: $('bol-linha').value, pix_copia_cola: $('bol-pix').value
  };
  const r = id ? await api('PUT', '/admin/boletos/' + id, body) : await api('POST', '/admin/boletos', body);
  if (r && (r.ok || r.id)) { closeModal('modal-boleto'); loadBoletos(); }
  else if (r) alert(r.erro || 'Erro ao salvar');
}

async function markPago(id) {
  const b = boletosCache.find(x => x.id === id);
  if (!b || !confirm('Marcar boleto como PAGO?')) return;
  await api('PUT', '/admin/boletos/' + id, {...b, status:'Pago'});
  loadBoletos();
}

async function delBoleto(id) {
  if (!confirm('Excluir boleto?')) return;
  await api('DELETE', '/admin/boletos/' + id); loadBoletos();
}
</script>
</body>
</html>`;

module.exports = html;
