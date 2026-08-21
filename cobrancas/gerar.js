#!/usr/bin/env node
// Gera as tabelas de cobrança (parcelas do mês) da Quadrata Seguros.
// Uso: node cobrancas/gerar.js
// Edite cobrancas/dados.json para acrescentar/alterar meses e parcelas.

const fs = require('fs');
const path = require('path');

const DIR = __dirname;
const dados = JSON.parse(fs.readFileSync(path.join(DIR, 'dados.json'), 'utf8'));

const brl = (n) =>
  'R$ ' + n.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const CSS = `
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: #f2f2f2;
    font-family: Calibri, Carlito, "Segoe UI", Arial, sans-serif;
    color: #333;
  }
  .card {
    width: 680px;
    background: #fff;
    padding: 20px;
  }
  .titulo {
    background: #2f5496;
    color: #fff;
    font-size: 17px;
    font-weight: 700;
    text-align: center;
    padding: 16px 12px;
    border-radius: 4px;
    letter-spacing: .2px;
  }
  table { width: 100%; border-collapse: collapse; margin-top: 14px; }
  th {
    background: #d9e2f3;
    color: #2f5496;
    font-size: 14px;
    font-weight: 700;
    padding: 12px 0;
  }
  th.veiculo, td.veiculo { text-align: left; padding-left: 18px; width: 45%; }
  th.parcela, td.parcela { text-align: center; width: 25%; }
  th.valor, td.valor { text-align: left; padding-left: 45px; width: 30%; }
  td { font-size: 14px; padding: 14px 0; }
  tbody tr:nth-child(odd) { background: #eff3fa; }
  tbody tr:nth-child(even) { background: #fff; }
  tr.total { background: #2f5496 !important; color: #fff; }
  tr.total td { font-size: 15px; font-weight: 700; padding: 15px 0; }
  tr.total td.rotulo { text-align: left; padding-left: 18px; }
  tr.total td.soma { text-align: center; }
  .rodape {
    margin-top: 14px;
    background: #e7f0e4;
    color: #2f5496;
    font-size: 12.5px;
    font-weight: 700;
    text-align: center;
    padding: 12px;
    border-radius: 3px;
  }
`;

function card(m) {
  const total = m.itens.reduce((s, i) => s + i.valor, 0);
  const linhas = m.itens
    .map(
      (i) => `        <tr>
          <td class="veiculo">${esc(i.veiculo)}</td>
          <td class="parcela">${esc(i.parcela)}</td>
          <td class="valor">${brl(i.valor)}</td>
        </tr>`
    )
    .join('\n');

  return `    <div class="card">
      <div class="titulo">QUADRATA SEGUROS — Parcelas ${esc(m.mes)}</div>
      <table>
        <thead>
          <tr>
            <th class="veiculo">Veículo</th>
            <th class="parcela">Parcela</th>
            <th class="valor">Valor</th>
          </tr>
        </thead>
        <tbody>
${linhas}
          <tr class="total">
            <td class="rotulo">TOTAL</td>
            <td class="soma" colspan="2">${brl(total)}</td>
          </tr>
        </tbody>
      </table>
      <div class="rodape">PIX&nbsp; CNPJ: ${esc(dados.pixCnpj)}&nbsp; |&nbsp; Vencimento: ${esc(m.vencimento)}</div>
    </div>`;
}

function pagina(titulo, corpo, bodyStyle = '') {
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>${esc(titulo)}</title>
<style>${CSS}${bodyStyle}</style>
</head>
<body>
${corpo}
</body>
</html>
`;
}

// Uma página por mês (usada para gerar o PNG de envio no WhatsApp).
for (const m of dados.meses) {
  const arquivo = path.join(DIR, `${m.arquivo}.html`);
  fs.writeFileSync(arquivo, pagina(`Parcelas ${m.mes}`, card(m)));
  const total = m.itens.reduce((s, i) => s + i.valor, 0);
  console.log(`${m.mes.padEnd(14)} ${m.itens.length} parcela(s)   total ${brl(total)}   -> ${path.basename(arquivo)}`);
}

// Página única com todos os meses.
const todos = pagina(
  'Cobranças — Quadrata Seguros',
  dados.meses.map(card).join('\n'),
  '\n  body { padding: 24px 0; display: flex; flex-direction: column; align-items: center; gap: 24px; }\n  .card { box-shadow: 0 1px 4px rgba(0,0,0,.12); }\n'
);
fs.writeFileSync(path.join(DIR, 'index.html'), todos);
console.log('index.html    (todos os meses)');
