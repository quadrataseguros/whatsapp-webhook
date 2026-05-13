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
  --bg:#0d1117;--card:#1c2230;--card-h:#232c3d;--border:#2d3748;
  --t1:#f0f4ff;--t2:#94a3b8;--t3:#64748b;
  --blue:#3b82f6;--green:#22c55e;--red:#ef4444;--gold:#f59e0b;--rad:11px;
}
body{background:var(--bg);color:var(--t1);font-family:'Inter',sans-serif;min-height:100vh}

/* login */
.login-page{display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px}
.login-box{background:var(--card);border:1px solid var(--border);border-radius:16px;padding:40px 36px;width:100%;max-width:370px;text-align:center}
.login-ico{font-size:46px;margin-bottom:14px}
.login-box h2{font-size:21px;font-weight:700;margin-bottom:5px}
.login-box p{color:var(--t3);font-size:13px;margin-bottom:26px}
.login-err{color:var(--red);font-size:13px;margin-bottom:10px;min-height:18px}
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
tbody tr{border-bottom:1px solid #1e2736;transition:.15s}
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

.spin{display:inline-block;width:22px;height:22px;border:3px solid var(--border);border-top-color:var(--blue);border-radius:50%;animation:sp .7s linear infinite}
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

<div class="login-page" id="loginPage">
  <div class="login-box">
    <div class="login-ico">🔐</div>
    <h2>Painel Administrativo</h2>
    <p>Quadrata Seguros — acesso restrito</p>
    <div class="login-err" id="loginErr"></div>
    <input type="password" id="passInput" placeholder="••••••••">
    <button class="btn-entrar" id="btnEntrar">Entrar</button>
  </div>
</div>

<div id="appShell">
  <div class="appheader">
    <div class="app-logo">⚙️ Admin — Quadrata Seguros</div>
    <a class="btn-back" href="/dashboard.html">← Painel de Metas</a>
    <button class="btn-sair" id="btnSair">Sair</button>
  </div>
  <div class="tabbar">
    <button class="tab on" data-tab="goals">🎯 Metas</button>
    <button class="tab" data-tab="people">👥 Vendedores</button>
    <button class="tab" data-tab="sales">📋 Vendas</button>
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
    <div class="panel" id="panelPeople">
      <div class="panel-h">Gerenciar Vendedores</div>
      <div class="addrow">
        <input type="text" id="newName" placeholder="Nome do vendedor">
        <button class="btn-add" id="btnAddPerson">+ Adicionar</button>
      </div>
      <div class="pgrid" id="peopleGrid"><div class="loading"><div class="spin"></div></div></div>
    </div>
    <div class="panel" id="panelSales">
      <div class="panel-h">Todas as Vendas</div>
      <div class="filters">
        <div class="fgrp"><label>Vendedor</label><select id="fltPerson"><option value="">Todos</option></select></div>
        <div class="fgrp"><label>De</label><input type="date" id="fltDe"></div>
        <div class="fgrp"><label>Até</label><input type="date" id="fltAte"></div>
        <button class="btn-flt" id="btnFiltrar">Filtrar</button>
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
'use strict';

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

// ── login ──────────────────────────────────────────────────────────────────
function doLogin() {
  var pass = document.getElementById('passInput').value;
  if (!pass) { document.getElementById('loginErr').textContent = 'Digite a senha'; return; }
  var btn = document.getElementById('btnEntrar');
  btn.disabled = true;
  btn.textContent = 'Verificando…';
  fetch('/api/admin/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: pass })
  }).then(function(r) {
    if (!r.ok) throw new Error('Senha incorreta');
    return r.json();
  }).then(function() {
    adminPass = pass;
    sessionStorage.setItem('ap', pass);
    mostrarApp();
  }).catch(function(e) {
    document.getElementById('loginErr').textContent = e.message;
    document.getElementById('passInput').value = '';
    document.getElementById('passInput').focus();
    btn.disabled = false;
    btn.textContent = 'Entrar';
  });
}

document.getElementById('btnEntrar').addEventListener('click', doLogin);
document.getElementById('passInput').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') doLogin();
});

// ── app ────────────────────────────────────────────────────────────────────
function mostrarApp() {
  document.getElementById('loginPage').style.display = 'none';
  document.getElementById('appShell').style.display = 'block';
  carregarMetas();
  carregarPessoas();
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
    document.getElementById('panel' + t.charAt(0).toUpperCase() + t.slice(1)).classList.add('on');
    if (t === 'sales') carregarVendas();
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
  }).catch(function() {
    toast('Erro ao salvar algumas metas', 'err');
  }).finally(function() {
    btn.disabled = false;
    btn.textContent = '💾 Salvar Todas as Metas';
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
      + '<button class="btn-rem" data-id="' + p.id + '" data-nome="' + p.name + '">✕</button>'
      + '</div>';
  }
  grid.innerHTML = html;
  var btns = grid.querySelectorAll('.btn-rem');
  for (var j = 0; j < btns.length; j++) {
    btns[j].addEventListener('click', function() {
      var id = this.dataset.id;
      var nome = this.dataset.nome;
      if (!confirm('Remover "' + nome + '"?\nAs vendas já registradas serão mantidas.')) return;
      fetch('/api/salespeople/' + id, { method: 'DELETE', headers: adminHdr() })
        .then(function() { toast('"' + nome + '" removido.'); carregarPessoas(); carregarMetas(); })
        .catch(function() { toast('Erro ao remover', 'err'); });
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

// ── init ───────────────────────────────────────────────────────────────────
var saved = sessionStorage.getItem('ap');
if (saved) {
  fetch('/api/admin/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: saved })
  }).then(function(r) {
    if (r.ok) { adminPass = saved; mostrarApp(); }
    else sessionStorage.removeItem('ap');
  }).catch(function() {});
}
</script>
</body>
</html>
`;
