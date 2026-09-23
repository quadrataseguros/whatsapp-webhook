// Confere a fila de publicacoes/ com as mesmas regras que o servidor usa.
// Rodar antes de abrir o PR de um post: `npm run validar-posts`.
const { lerFila } = require("./publicador");

const fila = lerFila();
let erros = 0;
for (const p of fila) {
  const quando = p.dados.quando || "?";
  if (p.erros.length) {
    erros++;
    console.log(`✗ ${p.slug}  (${quando})`);
    for (const e of p.erros) console.log(`    ${e}`);
  } else {
    console.log(`✓ ${p.slug}  ${p.dados.persona} · ${p.dados.tipo} · ${quando}`);
  }
}
console.log(fila.length ? `\n${fila.length} post(s), ${erros} com problema` : "Fila vazia.");
process.exit(erros ? 1 : 0);
