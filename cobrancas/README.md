# Cobranças — parcelas do mês

Tabelas de cobrança da Quadrata Seguros, no mesmo layout usado para enviar ao
cliente pelo WhatsApp.

## Como atualizar

1. Edite `dados.json` — acrescente um bloco em `meses` com o mês, o vencimento e
   as parcelas de cada veículo.
2. Rode o gerador:

   ```bash
   node cobrancas/gerar.js
   ```

   Ele reescreve um `.html` por mês (mais o `index.html` com todos) e imprime o
   total de cada mês para conferência. O total é somado pelo próprio script — não
   precisa calcular à mão.

3. Para gerar as imagens de envio (`.png`), abra o `.html` do mês no navegador e
   tire um print, ou rode o Chromium headless apontando para o arquivo.

## Convenções

- `parcela`: `"2/12"` para uma parcela intermediária, `"Última"` para a final.
- `valor`: número, com ponto decimal (`625.54`). A formatação em Real fica por
  conta do gerador.
- Um veículo que quitou a última parcela sai da lista no mês seguinte.
