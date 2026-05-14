module.exports = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Admin — Quadrata Seguros</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#f1f5f9;--card:#ffffff;--card-h:#f8fafc;--border:#e2e8f0;
  --t1:#1e293b;--t2:#475569;--t3:#94a3b8;
  --blue:#3b82f6;--green:#22c55e;--red:#ef4444;--gold:#d97706;--rad:11px;
}
body{background:var(--bg);color:var(--t1);font-family:'Inter',sans-serif;min-height:100vh}

/* login */
.login-page{display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px}
.login-box{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:40px 36px;width:100%;max-width:370px;text-align:center}
.login-ico{font-size:46px;margin-bottom:14px}
.login-box h2{font-size:21px;font-weight:700;margin-bottom:5px}
.login-box p{color:var(--t3);font-size:13px;margin-bottom:26px}
.login-err{background:rgba(239,68,68,.13);border:1px solid var(--red);color:var(--red);font-size:13px;margin-bottom:12px;padding:9px 12px;border-radius:7px;display:none;text-align:left;font-weight:600}
.login-box input{width:100%;background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:12px;color:var(--t1);font-size:15px;font-family:inherit;outline:none;margin-bottom:12px;text-align:center;letter-spacing:.1em;transition:.15s}
.login-box input:focus{border-color:var(--blue)}
.btn-entrar{width:100%;background:var(--blue);color:#fff;border:none;padding:12px;border-radius:8px;font-weight:700;font-size:15px;cursor:pointer;transition:.15s}
.btn-entrar:hover{background:#2563eb}
.btn-entrar:disabled{opacity:.5;cursor:not-allowed}

/* app */
#appShell{display:none}
.appheader{background:var(--card);border-bottom:1px solid var(--border);padding:14px 24px;display:flex;align-items:center;gap:14px;flex-wrap:wrap}
.app-logo{font-size:15px;font-weight:700;flex:1;display:flex;align-items:center;gap:8px}
.btn-back{color:var(--t2);text-decoration:none;font-size:13px;padding:7px 13px;border:1px solid var(--border);border-radius:7px;transition:.15s}
.btn-back:hover{color:var(--t1);background:var(--card-h)}
.btn-sair{background:none;border:1px solid var(--border);color:var(--t3);padding:7px 13px;border-radius:7px;font-size:13px;cursor:pointer;transition:.15s}
.btn-sair:hover{border-color:var(--red);color:var(--red)}

.tabbar{background:var(--card);border-bottom:1px solid var(--border);padding:0 24px;display:flex}
.tab{padding:13px 18px;font-size:14px;font-weight:600;color:var(--t3);border:none;background:none;cursor:pointer;border-bottom:3px solid transparent;transition:.15s;white-space:nowrap}
.tab:hover{color:var(--t2)}
.tab.on{color:var(--blue);border-bottom-color:var(--blue)}

.appmain{max-width:1180px;margin:0 auto;padding:26px 22px}

.panel{display:none}
.panel.on{display:block}
.panel-h{font-size:17px;font-weight:700;margin-bottom:18px;display:flex;align-items:center;gap:8px}
.panel-h::before{content:'';width:3px;height:17px;background:var(--blue);border-radius:2px;display:block}

/* goals */
.ggrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(310px,1fr));gap:14px;margin-bottom:20px}
.gcard{background:var(--card);border:1px solid var(--border);border-radius:var(--rad);padding:18px}
.gcard-name{font-size:14px;font-weight:700;margin-bottom:12px}
.ginputs{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.gl{font-size:10px;color:var(--t3);text-transform:uppercase;letter-spacing:.05em;font-weight:600;margin-bottom:4px}
.gtag{display:inline-block;font-size:10px;font-weight:700;padding:2px 7px;border-radius:99px;margin-bottom:5px}
.gtag-w{background:rgba(59,130,246,.15);color:var(--blue)}
.gtag-m{background:rgba(168,85,247,.15);color:#a855f7}
.ginp-wrap{position:relative}
.ginp-wrap em{position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--t3);font-size:12px;font-style:normal;pointer-events:none}
.ginp-wrap input{width:100%;background:var(--bg);border:1px solid var(--border);border-radius:7px;padding:8px 8px 8px 26px;color:var(--t1);font-size:13px;font-family:inherit;outline:none;transition:.15s}
.ginp-wrap input:focus{border-color:var(--blue)}
.btn-save{background:var(--blue);color:#fff;border:none;padding:10px 24px;border-radius:8px;font-weight:700;font-size:13px;cursor:pointer;transition:.15s;display:inline-flex;align-items:center;gap:6px}
.btn-save:hover{background:#2563eb}
.btn-save:disabled{opacity:.5;cursor:not-allowed}
.save-ok{font-size:12px;color:var(--green);margin-left:10px;opacity:0;transition:.3s}
.save-ok.show{opacity:1}

/* people */
.addrow{display:flex;gap:8px;max-width:460px;margin-bottom:20px}
.addrow input{flex:1;background:var(--card);border:1px solid var(--border);border-radius:8px;padding:10px 13px;color:var(--t1);font-size:13px;font-family:inherit;outline:none;transition:.15s}
.addrow input:focus{border-color:var(--blue)}
.btn-add{background:var(--green);color:#fff;border:none;padding:10px 20px;border-radius:8px;font-weight:700;font-size:13px;cursor:pointer;transition:.15s}
.btn-add:hover{background:#16a34a}
.pgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:10px}
.pitem{background:var(--card);border:1px solid var(--border);border-radius:var(--rad);padding:13px 15px;display:flex;align-items:center;justify-content:space-between}
.pname{font-weight:600;font-size:14px}
.btn-rem{background:none;border:1px solid transparent;color:var(--t3);width:30px;height:30px;border-radius:6px;cursor:pointer;font-size:15px;transition:.15s;display:flex;align-items:center;justify-content:center}
.btn-rem:hover{border-color:var(--red);color:var(--red)}

/* sales */
.filters{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;align-items:flex-end}
.fgrp{display:flex;flex-direction:column;gap:3px}
.fgrp label{font-size:11px;color:var(--t3);text-transform:uppercase;font-weight:600;letter-spacing:.04em}
.fgrp input,.fgrp select{background:var(--card);border:1px solid var(--border);border-radius:7px;padding:8px 11px;color:var(--t1);font-size:13px;font-family:inherit;outline:none;transition:.15s}
.fgrp input:focus,.fgrp select:focus{border-color:var(--blue)}
.btn-flt{background:var(--card-h);border:1px solid var(--border);color:var(--t1);padding:8px 16px;border-radius:7px;font-size:13px;cursor:pointer;align-self:flex-end;transition:.15s}
.btn-flt:hover{background:var(--card)}

.twrap{overflow-x:auto;border-radius:var(--rad);border:1px solid var(--border)}
table{width:100%;border-collapse:collapse;font-size:13px}
thead th{background:var(--card);padding:11px 13px;text-align:left;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:var(--t3);border-bottom:1px solid var(--border);white-space:nowrap}
tbody tr{border-bottom:1px solid var(--border);transition:.15s}
tbody tr:last-child{border-bottom:none}
tbody tr:hover{background:var(--card-h)}
tbody td{padding:10px 13px;color:var(--t2)}
.tdval{font-weight:700;color:var(--t1)}
.tdcomm{color:var(--gold);font-weight:700}
.tdpct{font-size:10px;color:var(--t3)}
.empty td{text-align:center;padding:28px;color:var(--t3)}
.btn-del{background:none;border:none;color:var(--t3);cursor:pointer;font-size:14px;padding:3px 6px;border-radius:5px;transition:.15s}
.btn-del:hover{color:var(--red)}

/* toasts */
.toasts{position:fixed;bottom:20px;right:20px;z-index:999;display:flex;flex-direction:column;gap:6px;pointer-events:none}
.toast{background:var(--card);border:1px solid var(--border);border-radius:9px;padding:10px 15px;font-size:13px;font-weight:500;transform:translateX(110%);transition:.3s;max-width:270px}
.toast.show{transform:none}
.toast.ok{border-left:4px solid var(--green);color:var(--green)}
.toast.err{border-left:4px solid var(--red);color:var(--red)}

.spin{display:inline-block;width:22px;height:22px;border:3px solid #e2e8f0;border-top-color:var(--blue);border-radius:50%;animation:sp .7s linear infinite}
@keyframes sp{to{transform:rotate(360deg)}}
.loading{text-align:center;padding:36px;color:var(--t3);font-size:13px}

@media(max-width:580px){
  .tabbar{overflow-x:auto}
  .appmain{padding:14px 12px}
  .ggrid{grid-template-columns:1fr}
}
</style>
</head>
<body>

<div style="position:fixed;top:6px;right:8px;background:#3b82f6;color:#fff;padding:3px 8px;border-radius:5px;font-size:11px;font-weight:700;z-index:9999">v5</div>

<div class="login-page" id="loginPage">
  <div class="login-box">
    <div class="login-ico">🔐</div>
    <h2>Painel Administrativo</h2>
    <p>Quadrata Seguros — acesso restrito</p>
    <div class="login-err" id="loginErr" style="display:none"></div>
    <input type="password" id="passInput" placeholder="••••••••" autocomplete="current-password">
    <button class="btn-entrar" id="btnEntrar" onclick="doLogin()">Entrar</button>
  </div>
</div>

<div id="appShell">
  <div class="appheader">
    <div class="app-logo">
      <svg width="28" height="28" viewBox="0 0 40 40" style="flex-shrink:0">
        <rect width="40" height="40" rx="10" fill="#3b82f6"/>
        <text x="20" y="28" font-size="22" font-weight="900" fill="white" text-anchor="middle" font-family="Inter,sans-serif">Q</text>
      </svg>
      Admin — Quadrata Seguros
    </div>
    <a class="btn-back" href="/dashboard.html">← Painel de Metas</a>
    <button class="btn-sair" id="btnSair">Sair</button>
  </div>
  <div class="tabbar">
    <button class="tab on" data-tab="goals">🎯 Metas</button>
    <button class="tab" data-tab="ro">🏆 RO</button>
    <button class="tab" data-tab="seg">🏢 Seguradoras</button>
    <button class="tab" data-tab="people">👥 Vendedores</button>
    <button class="tab" data-tab="sales">📋 Vendas</button>
    <button class="tab" data-tab="config">⚙️ Config</button>
  </div>
  <div class="appmain">
    <div class="panel on" id="panelGoals">
      <div class="panel-h">Configurar Metas</div>
      <div class="ggrid" id="goalsGrid"><div class="loading"><div class="spin"></div></div></div>
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
        <button class="btn-save" id="btnSaveGoals">💾 Salvar Todas as Metas</button>
        <span class="save-ok" id="saveOk">✓ Salvo!</span>
      </div>
    </div>
    <div class="panel" id="panelRo">
      <div class="panel-h">Configurar Metas de RO</div>
      <p style="font-size:13px;color:var(--t2);margin-bottom:6px">A <strong>comissão ponderada</strong> é calculada como: <em>total de comissão recebida ÷ total vendido × 100</em>.</p>
      <p style="font-size:12px;color:var(--t3);margin-bottom:20px">Isso evita distorção: vender R$4.000 @ 10% + R$100 @ 35% resulta em média simples de 22,5%, mas comissão ponderada real de 10,7%.</p>
      <div class="ggrid" id="roGrid"></div>
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
        <button class="btn-save" id="btnSaveRO">💾 Salvar Configurações RO</button>
        <span class="save-ok" id="roSaveOk">✓ Salvo!</span>
      </div>
    </div>

    <div class="panel" id="panelSeg">
      <div class="panel-h">Metas por Seguradora (Grupo)</div>
      <p style="font-size:13px;color:var(--t2);margin-bottom:8px">Meta de cada seguradora = <strong>valor vendido no mesmo mês ano anterior × 1,10</strong> (crescimento de 10%). Soma todas as vendas do grupo.</p>
      <p style="font-size:12px;color:var(--t3);margin-bottom:18px">Configure por mês: o valor vendido no ano passado e o prêmio em dinheiro se a meta for atingida.</p>

      <div style="display:flex;gap:8px;margin-bottom:18px;flex-wrap:wrap;align-items:end">
        <div><div class="gl">Mês</div>
          <select id="segMonth" style="background:var(--card);border:1px solid var(--border);color:var(--t1);padding:8px 11px;border-radius:7px;font-family:inherit">
            <option value="1">Janeiro</option><option value="2">Fevereiro</option>
            <option value="3">Março</option><option value="4">Abril</option>
            <option value="5">Maio</option><option value="6">Junho</option>
            <option value="7">Julho</option><option value="8">Agosto</option>
            <option value="9">Setembro</option><option value="10">Outubro</option>
            <option value="11">Novembro</option><option value="12">Dezembro</option>
          </select>
        </div>
        <div><div class="gl">Ano</div>
          <input type="number" id="segYear" min="2020" max="2099" style="background:var(--card);border:1px solid var(--border);color:var(--t1);padding:8px 11px;border-radius:7px;font-family:inherit;width:100px">
        </div>
        <button class="btn-flt" id="btnSegLoad">Carregar</button>
      </div>

      <div class="ggrid" id="segGrid"></div>
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
        <button class="btn-save" id="btnSaveSeg">💾 Salvar Metas Seguradoras</button>
        <span class="save-ok" id="segSaveOk">✓ Salvo!</span>
      </div>
    </div>

    <div class="panel" id="panelPeople">
      <div class="panel-h">Gerenciar Vendedores</div>
      <div class="addrow">
        <input type="text" id="newName" placeholder="Nome do vendedor">
        <button class="btn-add" id="btnAddPerson">+ Adicionar</button>
      </div>
      <div class="pgrid" id="peopleGrid"><div class="loading"><div class="spin"></div></div></div>
    </div>
    <div class="panel" id="panelConfig">
      <div class="panel-h">Configurações</div>
      <div class="gcard" style="max-width:420px;margin-bottom:24px">
        <div class="gcard-name">🔑 Alterar Senha Admin</div>
        <div class="gl">Nova senha (mínimo 4 caracteres)</div>
        <div class="ginp-wrap" style="margin-bottom:8px">
          <input type="password" id="cfgNewPass" placeholder="Nova senha" autocomplete="new-password" style="padding-left:10px">
        </div>
        <div class="gl">Confirmar nova senha</div>
        <div class="ginp-wrap" style="margin-bottom:12px">
          <input type="password" id="cfgConfPass" placeholder="Confirmar senha" autocomplete="new-password" style="padding-left:10px">
        </div>
        <div id="cfgPassErr" style="color:var(--red);font-size:12px;margin-bottom:8px;min-height:16px"></div>
        <button class="btn-save" id="btnSavePass">🔑 Alterar Senha</button>
        <span class="save-ok" id="passSaveOk" style="margin-left:10px">✓ Senha alterada!</span>
      </div>
    </div>

    <div class="panel" id="panelSales">
      <div class="panel-h">Todas as Vendas</div>
      <div class="filters">
        <div class="fgrp"><label>Vendedor</label><select id="fltPerson"><option value="">Todos</option></select></div>
        <div class="fgrp"><label>De</label><input type="date" id="fltDe"></div>
        <div class="fgrp"><label>Até</label><input type="date" id="fltAte"></div>
        <button class="btn-flt" id="btnFiltrar">Filtrar</button>
        <button class="btn-flt" id="btnExportCSV" style="background:var(--green);color:#fff;border-color:var(--green)">📥 Exportar CSV</button>
      </div>
      <div class="twrap">
        <table>
          <thead>
            <tr><th>Data</th><th>Vendedor</th><th>Valor</th><th>Comissão</th><th>Ramo</th><th>Seguradora</th><th>Obs.</th><th></th></tr>
          </thead>
          <tbody id="salesBody"><tr class="empty"><td colspan="8">Carregando…</td></tr></tbody>
        </table>
      </div>
    </div>
  </div>
</div>

<div class="toasts" id="toasts"></div>

<script>
var adminPass = '';
var allPeople = [];
var existingGoals = {};

// ── utilities ──────────────────────────────────────────────────────────────
var fmtR = function(v) { return v.toLocaleString('pt-BR', {style:'currency', currency:'BRL', minimumFractionDigits:2}); };
var fmtD = function(s) { var p = s.split('-'); return p[2]+'/'+p[1]+'/'+p[0]; };

function toast(msg, tipo) {
  tipo = tipo || 'ok';
  var w = document.getElementById('toasts');
  var el = document.createElement('div');
  el.className = 'toast ' + tipo;
  el.textContent = msg;
  w.appendChild(el);
  setTimeout(function() { el.classList.add('show'); }, 10);
  setTimeout(function() {
    el.classList.remove('show');
    setTimeout(function() { el.remove(); }, 350);
  }, 3500);
}

function adminHdr() {
  return { 'Content-Type': 'application/json', 'x-admin-password': adminPass };
}

function mostrarErroLogin(msg) {
  var el = document.getElementById('loginErr');
  el.textContent = msg;
  el.style.display = 'block';
}

function ocultarErroLogin() {
  var el = document.getElementById('loginErr');
  el.textContent = '';
  el.style.display = 'none';
}

// ── login ──────────────────────────────────────────────────────────────────
function doLogin() {
  var pass = document.getElementById('passInput').value;
  console.log('[Admin] doLogin chamado');
  if (!pass) { mostrarErroLogin('Digite a senha'); return; }
  var btn = document.getElementById('btnEntrar');
  btn.disabled = true;
  btn.textContent = 'Verificando...';
  ocultarErroLogin();

  var xhr = new XMLHttpRequest();
  xhr.open('POST', '/api/admin/verify', true);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.onreadystatechange = function() {
    if (xhr.readyState !== 4) return;
    console.log('[Admin] Resposta HTTP:', xhr.status);
    if (xhr.status === 200) {
      adminPass = pass;
      try { sessionStorage.setItem('ap', pass); } catch(ex) {}
      mostrarApp();
    } else {
      mostrarErroLogin('Senha incorreta (status ' + xhr.status + ')');
      document.getElementById('passInput').value = '';
      document.getElementById('passInput').focus();
      btn.disabled = false;
      btn.textContent = 'Entrar';
    }
  };
  xhr.onerror = function() {
    console.error('[Admin] Erro de rede');
    mostrarErroLogin('Erro de conexao com o servidor');
    btn.disabled = false;
    btn.textContent = 'Entrar';
  };
  xhr.send(JSON.stringify({ password: pass }));
}
window.doLogin = doLogin;

document.getElementById('passInput').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') doLogin();
});

// ── app ────────────────────────────────────────────────────────────────────
function mostrarApp() {
  console.log('[Admin] mostrarApp chamado');
  document.getElementById('loginPage').style.display = 'none';
  document.getElementById('appShell').style.display = 'block';
  try { carregarMetas(); } catch(ex) { console.error('[Admin] carregarMetas erro:', ex); }
  try { carregarPessoas(); } catch(ex) { console.error('[Admin] carregarPessoas erro:', ex); }
  try { carregarRO(); } catch(ex) { console.error('[Admin] carregarRO erro:', ex); }
  try { initSegSelectors(); carregarSeguradoras(); } catch(ex) { console.error('[Admin] carregarSeguradoras erro:', ex); }
}

document.getElementById('btnSair').addEventListener('click', function() {
  sessionStorage.removeItem('ap');
  adminPass = '';
  document.getElementById('appShell').style.display = 'none';
  document.getElementById('loginPage').style.display = 'flex';
  document.getElementById('passInput').value = '';
});

// ── tabs ───────────────────────────────────────────────────────────────────
var tabs = document.querySelectorAll('.tab');
for (var ti = 0; ti < tabs.length; ti++) {
  tabs[ti].addEventListener('click', function() {
    var t = this.dataset.tab;
    for (var i = 0; i < tabs.length; i++) tabs[i].classList.remove('on');
    this.classList.add('on');
    document.querySelectorAll('.panel').forEach(function(p) { p.classList.remove('on'); });
    var panelId = 'panel' + t.charAt(0).toUpperCase() + t.slice(1);
    document.getElementById(panelId).classList.add('on');
    if (t === 'sales') carregarVendas();
    if (t === 'ro') carregarRO();
    if (t === 'seg') carregarSeguradoras();
  });
}

// ── metas ──────────────────────────────────────────────────────────────────
function carregarMetas() {
  Promise.all([
    fetch('/api/salespeople').then(function(r) { return r.json(); }),
    fetch('/api/goals').then(function(r) { return r.json(); })
  ]).then(function(res) {
    allPeople = res[0];
    existingGoals = {};
    res[1].forEach(function(g) {
      existingGoals[g.salesperson_id + '_' + g.period_type] = g.goal_value;
    });
    renderMetas(allPeople);
    popularFiltro(allPeople);
  }).catch(function() { toast('Erro ao carregar metas', 'err'); });
}

function renderMetas(people) {
  var grid = document.getElementById('goalsGrid');
  if (!people.length) {
    grid.innerHTML = '<p style="color:var(--t3)">Adicione vendedores primeiro.</p>';
    return;
  }
  var html = '';
  for (var i = 0; i < people.length; i++) {
    var p = people[i];
    var vw = existingGoals[p.id + '_weekly'] || '';
    var vm = existingGoals[p.id + '_monthly'] || '';
    html += '<div class="gcard">'
      + '<div class="gcard-name">👤 ' + p.name + '</div>'
      + '<div class="ginputs">'
      + '<div><span class="gtag gtag-w">SEMANAL</span>'
      + '<div class="gl">Meta da Semana</div>'
      + '<div class="ginp-wrap"><em>R$</em>'
      + '<input type="number" step="0.01" min="0" placeholder="0,00" value="' + vw + '"'
      + ' data-pid="' + p.id + '" data-tipo="weekly"></div></div>'
      + '<div><span class="gtag gtag-m">MENSAL</span>'
      + '<div class="gl">Meta do Mês</div>'
      + '<div class="ginp-wrap"><em>R$</em>'
      + '<input type="number" step="0.01" min="0" placeholder="0,00" value="' + vm + '"'
      + ' data-pid="' + p.id + '" data-tipo="monthly"></div></div>'
      + '</div></div>';
  }
  grid.innerHTML = html;
}

document.getElementById('btnSaveGoals').addEventListener('click', function() {
  var btn = this;
  btn.disabled = true;
  btn.textContent = 'Salvando…';
  var inputs = document.querySelectorAll('#goalsGrid input[data-pid]');
  var promises = [];
  for (var i = 0; i < inputs.length; i++) {
    var inp = inputs[i];
    var val = parseFloat(inp.value);
    if (!inp.value || isNaN(val) || val < 0) continue;
    promises.push(fetch('/api/goals', {
      method: 'POST',
      headers: adminHdr(),
      body: JSON.stringify({ salesperson_id: parseInt(inp.dataset.pid), period_type: inp.dataset.tipo, goal_value: val })
    }));
  }
  if (!promises.length) {
    btn.disabled = false;
    btn.textContent = '💾 Salvar Todas as Metas';
    toast('Nenhum valor preenchido', 'err');
    return;
  }
  Promise.all(promises).then(function() {
    toast('Metas salvas com sucesso!');
    var ok = document.getElementById('saveOk');
    ok.classList.add('show');
    setTimeout(function() { ok.classList.remove('show'); }, 3000);
    carregarMetas();
    btn.disabled = false;
    btn.textContent = '💾 Salvar Todas as Metas';
  }).catch(function() {
    toast('Erro ao salvar algumas metas', 'err');
    btn.disabled = false;
    btn.textContent = '💾 Salvar Todas as Metas';
  });
});

// ── RO ─────────────────────────────────────────────────────────────────────
var existingRO = {};

function carregarRO() {
  Promise.all([
    fetch('/api/salespeople').then(function(r) { return r.json(); }),
    fetch('/api/ro-goals').then(function(r) { return r.json(); })
  ]).then(function(res) {
    if (!allPeople.length) allPeople = res[0];
    existingRO = {};
    res[1].forEach(function(g) {
      existingRO[g.salesperson_id + '_' + g.period_type] = g;
    });
    renderROGrid(res[0]);
  }).catch(function() { toast('Erro ao carregar RO', 'err'); });
}

function renderROGrid(people) {
  var grid = document.getElementById('roGrid');
  if (!people.length) {
    grid.innerHTML = '<p style="color:var(--t3)">Adicione vendedores primeiro.</p>';
    return;
  }
  var html = '';
  for (var i = 0; i < people.length; i++) {
    var p = people[i];
    var gw = existingRO[p.id + '_weekly']  || {};
    var gm = existingRO[p.id + '_monthly'] || {};
    html += '<div class="gcard">'
      + '<div class="gcard-name">👤 ' + p.name + '</div>'
      + '<div class="ginputs">'
      // --- Weekly ---
      + '<div>'
        + '<span class="gtag gtag-w">SEMANAL</span>'
        + '<div class="gl">Min. Vendas</div>'
        + '<div class="ginp-wrap" style="margin-bottom:6px"><em style="left:8px;font-size:10px">#</em>'
          + '<input type="number" min="0" step="1" placeholder="0" value="' + (gw.min_sales || '') + '"'
          + ' data-pid="' + p.id + '" data-tipo="weekly" data-field="min_sales" style="padding-left:22px"></div>'
        + '<div class="gl">Comissão mínima %</div>'
        + '<div class="ginp-wrap" style="margin-bottom:6px"><em>%</em>'
          + '<input type="number" min="0" max="100" step="0.1" placeholder="16.0" value="' + (gw.min_commission != null ? gw.min_commission : '') + '"'
          + ' data-pid="' + p.id + '" data-tipo="weekly" data-field="min_commission"></div>'
        + '<div class="gl">Prêmio (R$)</div>'
        + '<div class="ginp-wrap"><em>R$</em>'
          + '<input type="number" min="0" step="0.01" placeholder="0,00" value="' + (gw.bonus_value || '') + '"'
          + ' data-pid="' + p.id + '" data-tipo="weekly" data-field="bonus_value"></div>'
      + '</div>'
      // --- Monthly ---
      + '<div>'
        + '<span class="gtag gtag-m">MENSAL</span>'
        + '<div class="gl">Min. Vendas</div>'
        + '<div class="ginp-wrap" style="margin-bottom:6px"><em style="left:8px;font-size:10px">#</em>'
          + '<input type="number" min="0" step="1" placeholder="0" value="' + (gm.min_sales || '') + '"'
          + ' data-pid="' + p.id + '" data-tipo="monthly" data-field="min_sales" style="padding-left:22px"></div>'
        + '<div class="gl">Comissão mínima %</div>'
        + '<div class="ginp-wrap" style="margin-bottom:6px"><em>%</em>'
          + '<input type="number" min="0" max="100" step="0.1" placeholder="16.0" value="' + (gm.min_commission != null ? gm.min_commission : '') + '"'
          + ' data-pid="' + p.id + '" data-tipo="monthly" data-field="min_commission"></div>'
        + '<div class="gl">Prêmio (R$)</div>'
        + '<div class="ginp-wrap"><em>R$</em>'
          + '<input type="number" min="0" step="0.01" placeholder="0,00" value="' + (gm.bonus_value || '') + '"'
          + ' data-pid="' + p.id + '" data-tipo="monthly" data-field="bonus_value"></div>'
      + '</div>'
      + '</div></div>';
  }
  grid.innerHTML = html;
}

document.getElementById('btnSaveRO').addEventListener('click', function() {
  var btn = this;
  btn.disabled = true;
  btn.textContent = 'Salvando...';

  var inputs = document.querySelectorAll('#roGrid input[data-pid]');
  var grouped = {};
  for (var i = 0; i < inputs.length; i++) {
    var inp = inputs[i];
    var key = inp.dataset.pid + '_' + inp.dataset.tipo;
    if (!grouped[key]) grouped[key] = { salesperson_id: parseInt(inp.dataset.pid), period_type: inp.dataset.tipo };
    var v = inp.value !== '' ? parseFloat(inp.value) : null;
    grouped[key][inp.dataset.field] = v;
  }

  var promises = [];
  var keys = Object.keys(grouped);
  for (var k = 0; k < keys.length; k++) {
    var g = grouped[keys[k]];
    if (g.min_sales == null && g.min_commission == null && g.bonus_value == null) continue;
    promises.push(fetch('/api/ro-goals', {
      method: 'POST',
      headers: adminHdr(),
      body: JSON.stringify({
        salesperson_id: g.salesperson_id,
        period_type: g.period_type,
        min_sales: g.min_sales != null ? g.min_sales : 0,
        min_commission: g.min_commission != null ? g.min_commission : 16.0,
        bonus_value: g.bonus_value != null ? g.bonus_value : 0
      })
    }));
  }

  if (!promises.length) {
    btn.disabled = false;
    btn.textContent = '💾 Salvar Configurações RO';
    toast('Preencha ao menos um campo', 'err');
    return;
  }

  Promise.all(promises).then(function() {
    toast('RO salvo com sucesso!');
    var ok = document.getElementById('roSaveOk');
    ok.classList.add('show');
    setTimeout(function() { ok.classList.remove('show'); }, 3000);
    carregarRO();
    btn.disabled = false;
    btn.textContent = '💾 Salvar Configurações RO';
  }).catch(function() {
    toast('Erro ao salvar RO', 'err');
    btn.disabled = false;
    btn.textContent = '💾 Salvar Configurações RO';
  });
});

// ── Seguradoras ────────────────────────────────────────────────────────────
var SEGURADORAS_LIST = ['PORTO','ALLIANZ','TOKIO MARINE','BRADESCO','YELLUM','HDI','SUHAI','ZURICH'];
var existingSeg = {};

function initSegSelectors() {
  var now = new Date();
  document.getElementById('segMonth').value = now.getMonth() + 1;
  document.getElementById('segYear').value  = now.getFullYear();
}

function carregarSeguradoras() {
  var month = document.getElementById('segMonth').value;
  var year  = document.getElementById('segYear').value;
  if (!month || !year) { initSegSelectors(); month = document.getElementById('segMonth').value; year = document.getElementById('segYear').value; }
  fetch('/api/seguradora-goals?month=' + month + '&year=' + year)
    .then(function(r) { return r.json(); })
    .then(function(goals) {
      existingSeg = {};
      goals.forEach(function(g) { existingSeg[g.seguradora] = g; });
      renderSegGrid();
    })
    .catch(function() { toast('Erro ao carregar metas de seguradora', 'err'); });
}

function renderSegGrid() {
  var grid = document.getElementById('segGrid');
  var html = '';
  for (var i = 0; i < SEGURADORAS_LIST.length; i++) {
    var name = SEGURADORAS_LIST[i];
    var g    = existingSeg[name] || {};
    var prev = g.prev_year_value || '';
    var bonus = g.bonus_value || '';
    var meta = prev ? (prev * 1.10).toLocaleString('pt-BR', {style:'currency', currency:'BRL'}) : '—';

    html += '<div class="gcard">'
      + '<div class="gcard-name">🏢 ' + name + '</div>'
      + '<div class="gl">Valor mesmo mês ano anterior (R$)</div>'
      + '<div class="ginp-wrap" style="margin-bottom:8px"><em>R$</em>'
        + '<input type="number" min="0" step="0.01" placeholder="0,00" value="' + prev + '"'
        + ' data-seg="' + name + '" data-field="prev_year_value"></div>'
      + '<div style="font-size:11px;color:var(--blue);margin-bottom:8px;font-weight:600">Meta (+10%): ' + meta + '</div>'
      + '<div class="gl">Valor do prêmio (R$)</div>'
      + '<div class="ginp-wrap"><em>R$</em>'
        + '<input type="number" min="0" step="0.01" placeholder="0,00" value="' + bonus + '"'
        + ' data-seg="' + name + '" data-field="bonus_value"></div>'
      + '</div>';
  }
  grid.innerHTML = html;

  // Atualiza meta em tempo real ao digitar
  var inputs = grid.querySelectorAll('input[data-field="prev_year_value"]');
  for (var j = 0; j < inputs.length; j++) {
    inputs[j].addEventListener('input', function() {
      var v = parseFloat(this.value) || 0;
      var info = this.parentNode.nextElementSibling;
      if (info) info.textContent = 'Meta (+10%): ' + (v * 1.10).toLocaleString('pt-BR', {style:'currency', currency:'BRL'});
    });
  }
}

document.getElementById('btnSegLoad').addEventListener('click', carregarSeguradoras);

document.getElementById('btnSaveSeg').addEventListener('click', function() {
  var btn = this;
  var month = parseInt(document.getElementById('segMonth').value);
  var year  = parseInt(document.getElementById('segYear').value);
  if (!month || !year) { toast('Selecione mês e ano', 'err'); return; }

  btn.disabled = true;
  btn.textContent = 'Salvando...';

  var inputs = document.querySelectorAll('#segGrid input[data-seg]');
  var grouped = {};
  for (var i = 0; i < inputs.length; i++) {
    var inp = inputs[i];
    if (!grouped[inp.dataset.seg]) grouped[inp.dataset.seg] = { seguradora: inp.dataset.seg, month: month, year: year };
    var v = inp.value !== '' ? parseFloat(inp.value) : null;
    grouped[inp.dataset.seg][inp.dataset.field] = v;
  }

  var promises = [];
  var keys = Object.keys(grouped);
  for (var k = 0; k < keys.length; k++) {
    var g = grouped[keys[k]];
    if (!g.prev_year_value && !g.bonus_value) continue;
    promises.push(fetch('/api/seguradora-goals', {
      method: 'POST',
      headers: adminHdr(),
      body: JSON.stringify({
        seguradora: g.seguradora,
        month: g.month,
        year: g.year,
        prev_year_value: g.prev_year_value || 0,
        bonus_value: g.bonus_value || 0
      })
    }));
  }

  if (!promises.length) {
    btn.disabled = false;
    btn.textContent = '💾 Salvar Metas Seguradoras';
    toast('Preencha ao menos uma seguradora', 'err');
    return;
  }

  Promise.all(promises).then(function() {
    toast('Metas seguradoras salvas!');
    var ok = document.getElementById('segSaveOk');
    ok.classList.add('show');
    setTimeout(function() { ok.classList.remove('show'); }, 3000);
    carregarSeguradoras();
    btn.disabled = false;
    btn.textContent = '💾 Salvar Metas Seguradoras';
  }).catch(function() {
    toast('Erro ao salvar', 'err');
    btn.disabled = false;
    btn.textContent = '💾 Salvar Metas Seguradoras';
  });
});

// ── pessoas ────────────────────────────────────────────────────────────────
function carregarPessoas() {
  fetch('/api/salespeople').then(function(r) { return r.json(); }).then(function(people) {
    allPeople = people;
    renderPessoas(people);
    popularFiltro(people);
  }).catch(function() { toast('Erro ao carregar vendedores', 'err'); });
}

function renderPessoas(people) {
  var grid = document.getElementById('peopleGrid');
  if (!people.length) {
    grid.innerHTML = '<p style="color:var(--t3)">Nenhum vendedor cadastrado.</p>';
    return;
  }
  var html = '';
  for (var i = 0; i < people.length; i++) {
    var p = people[i];
    html += '<div class="pitem">'
      + '<span class="pname">👤 ' + p.name + '</span>'
      + '<div style="display:flex;align-items:center;gap:6px">'
        + '<input type="text" class="pin-inp" maxlength="6" placeholder="PIN" data-id="' + p.id + '"'
          + ' style="width:62px;background:var(--bg);border:1px solid var(--border);border-radius:6px;padding:5px 8px;color:var(--t1);font-size:13px;font-family:inherit;outline:none;text-align:center;letter-spacing:.1em"'
          + ' title="PIN de acesso deste vendedor (deixe vazio para remover)">'
        + '<button class="btn-pin btn-flt" data-id="' + p.id + '" style="padding:5px 10px;font-size:12px" title="Salvar PIN">🔑</button>'
        + '<button class="btn-rem" data-id="' + p.id + '" data-nome="' + p.name + '">✕</button>'
      + '</div>'
      + '</div>';
  }
  grid.innerHTML = html;
  var btns = grid.querySelectorAll('.btn-rem');
  for (var j = 0; j < btns.length; j++) {
    btns[j].addEventListener('click', function() {
      var id = this.dataset.id;
      var nome = this.dataset.nome;
      if (!confirm('Remover "' + nome + '"?\\nAs vendas já registradas serão mantidas.')) return;
      fetch('/api/salespeople/' + id, { method: 'DELETE', headers: adminHdr() })
        .then(function() { toast('"' + nome + '" removido.'); carregarPessoas(); carregarMetas(); })
        .catch(function() { toast('Erro ao remover', 'err'); });
    });
  }
  var pinBtns = grid.querySelectorAll('.btn-pin');
  for (var k = 0; k < pinBtns.length; k++) {
    pinBtns[k].addEventListener('click', function() {
      var id  = this.dataset.id;
      var inp = grid.querySelector('.pin-inp[data-id="' + id + '"]');
      var pin = inp ? inp.value.trim() : '';
      fetch('/api/salespeople/' + id + '/pin', {
        method: 'POST', headers: adminHdr(),
        body: JSON.stringify({ pin: pin || null })
      }).then(function(r) {
        if (!r.ok) throw new Error();
        toast(pin ? 'PIN salvo!' : 'PIN removido.');
      }).catch(function() { toast('Erro ao salvar PIN', 'err'); });
    });
  }
}

function popularFiltro(people) {
  var sel = document.getElementById('fltPerson');
  var cur = sel.value;
  var html = '<option value="">Todos</option>';
  for (var i = 0; i < people.length; i++) {
    html += '<option value="' + people[i].id + '">' + people[i].name + '</option>';
  }
  sel.innerHTML = html;
  sel.value = cur;
}

document.getElementById('btnAddPerson').addEventListener('click', adicionarPessoa);
document.getElementById('newName').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') adicionarPessoa();
});

function adicionarPessoa() {
  var nome = document.getElementById('newName').value.trim();
  if (!nome) { toast('Digite o nome do vendedor', 'err'); return; }
  fetch('/api/salespeople', {
    method: 'POST', headers: adminHdr(), body: JSON.stringify({ name: nome })
  }).then(function(r) {
    if (!r.ok) return r.json().then(function(e) { throw new Error(e.error); });
    return r.json();
  }).then(function() {
    toast('Vendedor "' + nome + '" adicionado!');
    document.getElementById('newName').value = '';
    carregarPessoas();
    carregarMetas();
  }).catch(function(e) { toast(e.message || 'Erro ao adicionar', 'err'); });
}

// ── vendas ─────────────────────────────────────────────────────────────────
document.getElementById('btnFiltrar').addEventListener('click', carregarVendas);

function carregarVendas() {
  var body = document.getElementById('salesBody');
  body.innerHTML = '<tr class="empty"><td colspan="8"><div class="spin" style="display:inline-block"></div></td></tr>';
  var p = new URLSearchParams();
  var de = document.getElementById('fltDe').value;
  var ate = document.getElementById('fltAte').value;
  var pid = document.getElementById('fltPerson').value;
  if (de)  p.set('from', de);
  if (ate) p.set('to', ate);
  if (pid) p.set('salesperson_id', pid);
  fetch('/api/sales/all?' + p.toString(), { headers: adminHdr() })
    .then(function(r) { return r.json(); })
    .then(renderVendas)
    .catch(function() {
      body.innerHTML = '<tr class="empty"><td colspan="8" style="color:var(--red)">Erro ao carregar</td></tr>';
    });
}

function renderVendas(sales) {
  lastSalesData = sales;
  var body = document.getElementById('salesBody');
  if (!sales.length) {
    body.innerHTML = '<tr class="empty"><td colspan="8">Nenhuma venda encontrada</td></tr>';
    return;
  }
  var html = '';
  for (var i = 0; i < sales.length; i++) {
    var s = sales[i];
    var comm = s.commission_pct > 0
      ? '<span class="tdcomm">' + fmtR(s.value * s.commission_pct / 100) + '</span>'
        + '<div class="tdpct">' + s.commission_pct + '%</div>'
      : '<span style="color:var(--t3)">—</span>';
    html += '<tr id="sr' + s.id + '">'
      + '<td>' + fmtD(s.sale_date) + '</td>'
      + '<td>' + s.salesperson_name + '</td>'
      + '<td class="tdval">' + fmtR(s.value) + '</td>'
      + '<td>' + comm + '</td>'
      + '<td>' + s.ramo + '</td>'
      + '<td>' + s.seguradora + '</td>'
      + '<td style="font-size:11px;color:var(--t3)">' + (s.notes || '—') + '</td>'
      + '<td><button class="btn-del" data-id="' + s.id + '">🗑</button></td>'
      + '</tr>';
  }
  body.innerHTML = html;
  var btns = body.querySelectorAll('.btn-del');
  for (var j = 0; j < btns.length; j++) {
    btns[j].addEventListener('click', function() {
      var id = this.dataset.id;
      if (!confirm('Excluir esta venda?')) return;
      fetch('/api/sales/' + id, { method: 'DELETE', headers: adminHdr() })
        .then(function() {
          var row = document.getElementById('sr' + id);
          if (row) row.remove();
          toast('Venda excluída.');
        })
        .catch(function() { toast('Erro ao excluir', 'err'); });
    });
  }
}

// ── alterar senha ──────────────────────────────────────────────────────────
document.getElementById('btnSavePass').addEventListener('click', function() {
  var np = document.getElementById('cfgNewPass').value;
  var cp = document.getElementById('cfgConfPass').value;
  var errEl = document.getElementById('cfgPassErr');
  errEl.textContent = '';
  if (!np) { errEl.textContent = 'Digite a nova senha'; return; }
  if (np.length < 4) { errEl.textContent = 'Mínimo 4 caracteres'; return; }
  if (np !== cp) { errEl.textContent = 'As senhas não coincidem'; return; }
  var btn = this; btn.disabled = true; btn.textContent = 'Salvando...';
  fetch('/api/admin/password', {
    method: 'PUT', headers: adminHdr(),
    body: JSON.stringify({ newPassword: np })
  }).then(function(r) { return r.json().then(function(d) { return { ok: r.ok, data: d }; }); })
  .then(function(res) {
    if (res.ok) {
      adminPass = np;
      try { sessionStorage.setItem('ap', np); } catch(ex) {}
      document.getElementById('cfgNewPass').value = '';
      document.getElementById('cfgConfPass').value = '';
      var ok = document.getElementById('passSaveOk');
      ok.classList.add('show');
      setTimeout(function() { ok.classList.remove('show'); }, 3000);
      toast('Senha alterada com sucesso!');
    } else {
      errEl.textContent = res.data.error || 'Erro ao salvar';
    }
    btn.disabled = false; btn.textContent = '🔑 Alterar Senha';
  }).catch(function() {
    errEl.textContent = 'Erro de conexão';
    btn.disabled = false; btn.textContent = '🔑 Alterar Senha';
  });
});

// ── exportar CSV ───────────────────────────────────────────────────────────
var lastSalesData = [];

document.getElementById('btnExportCSV').addEventListener('click', function() {
  if (!lastSalesData.length) { toast('Nenhuma venda para exportar', 'err'); return; }
  var header = 'Data,Vendedor,Valor (R$),Comissao %,Comissao R$,Ramo,Seguradora,Obs.\n';
  var rows = lastSalesData.map(function(s) {
    var commR = s.commission_pct > 0 ? (s.value * s.commission_pct / 100).toFixed(2) : '0.00';
    return [
      fmtD(s.sale_date),
      '"' + s.salesperson_name.replace(/"/g, '""') + '"',
      s.value.toFixed(2),
      s.commission_pct || 0,
      commR,
      '"' + s.ramo.replace(/"/g, '""') + '"',
      '"' + s.seguradora.replace(/"/g, '""') + '"',
      '"' + (s.notes || '').replace(/"/g, '""') + '"'
    ].join(',');
  }).join('\n');
  var csv = header + rows;
  var blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'vendas_quadrata_' + new Date().toISOString().split('T')[0] + '.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast('CSV exportado!');
});

// ── init ───────────────────────────────────────────────────────────────────
(function() {
  var saved;
  try { saved = sessionStorage.getItem('ap'); } catch(ex) { saved = null; }
  if (!saved) return;
  var xhr = new XMLHttpRequest();
  xhr.open('POST', '/api/admin/verify', true);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.onreadystatechange = function() {
    if (xhr.readyState !== 4) return;
    if (xhr.status === 200) { adminPass = saved; mostrarApp(); }
    else { try { sessionStorage.removeItem('ap'); } catch(ex) {} }
  };
  xhr.onerror = function() {};
  xhr.send(JSON.stringify({ password: saved }));
})();
</script>
</body>
</html>
`;
