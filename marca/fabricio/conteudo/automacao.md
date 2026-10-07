# Como a publicação automática funciona — @fabricioquadrata

Quem executa isto é o Claude, acordado por um agendamento (não um script
rodando no servidor — ver o motivo em "Por que não roda no Render", no fim).
Este arquivo é o procedimento que ele segue toda vez que acorda pra publicar.

## Quando roda

Segunda, terça e quinta, por volta das 9h (horário de São Paulo) — a cadência
de 3 posts/semana já documentada em `pauta-inicial.md`. Sábado e domingo não
têm post automático (ver a seção de séries recorrentes, que define quando
`S1`/`S2`/`S3` entram).

## O procedimento, passo a passo

1. **Ler `historico.md`** — qual foi o último item publicado, pra saber o
   próximo da tabela do primeiro mês (ou, depois do primeiro mês, qual série
   recorrente cai nesse dia da semana).
2. **Ler o item em `pauta-inicial.md`**: pilar, gancho, formato original e
   CTA.
3. **Se o formato original for Reels**: adaptar para carrossel (ver seção
   abaixo). A mensagem do gancho se mantém; o que muda é como ela é
   mostrada.
4. **Escrever a legenda e o texto da arte**, seguindo:
   - O bloco de contexto e o bloco de restrições de `README.md` (colar os
     dois, não reescrever de memória — eles mudam com o tempo).
   - O CTA certo pro formato: feed não tem link clicável, CTA é comentário
     ou direct; story pode usar o link com `?assunto=`.
5. **Rodar o Prompt C (`README.md`) nela mesma** — as 4 rodadas (destrua,
   reconstrua, teste, conformidade) antes de considerar pronta.
6. **Montar a arte**: usar um template em `templates/` (ver seção), preencher
   o texto, renderizar em JPEG (Playwright, 1080×1350).
7. **Enviar pro Metricool como revisão** — nunca publicar direto. Usa
   `createScheduledPostForReview`, revisor `quadrataseguros@gmail.com`.
8. **Mostrar a arte pro usuário na conversa antes de mandar pro Metricool**,
   do jeito que foi feito com o item #7 — é mais rápido corrigir aqui do que
   depois de estar no ar.
9. **Atualizar `historico.md`** só depois da confirmação de que foi enviado
   pro Metricool (não antes — se o passo 7 falhar, a posição não deve
   avançar).

## Adaptando Reels para carrossel

Automação aqui não produz vídeo. Quando o item original é Reels:

- Pega a MESMA mensagem central (o gancho), não troca o tema.
- Reels de fala vira um carrossel de 2-3 cards: capa com o gancho, card(s)
  de desenvolvimento, card final com o CTA — é a mesma estrutura dos posts
  já existentes em `../lancamento/`.
- Anota no `historico.md`, na linha do item, que foi "adaptado de Reels" —
  se um dia o time quiser gravar o Reels de verdade, o roteiro original
  continua em `pauta-inicial.md`, intacto.

## Templates

Em `templates/` (a criar conforme a necessidade — comece só com o que o
próximo item da pauta precisar, não construa os 5 formatos de uma vez).
Seguem a mesma convenção visual de `../lancamento/*.dc.html`: fundo
`radial-gradient(circle at 30% 22%, #16386b 0%, #0b1c38 58%)`, título em
Space Grotesk 700, corpo em Inter, acento ciano `#22d3ee`, 1080×1350 para
feed e 1080×1920 para story.

Renderização: Playwright (`playwright-core` + Chromium), screenshot do
elemento com o conteúdo, não da página inteira — evita cortar a arte.

## Por que não roda no servidor (Render)

Decisão registrada em conversa anterior: colocar Playwright/Chromium no
servidor de produção (que também atende o WhatsApp) é peso e risco
desnecessários num plano pequeno. A publicação roda por fora, pelo Claude.
Se um dia a equipe tiver a documentação da API pública do Metricool (o
acesso daqui é bloqueado por proxy de rede), migrar a parte de publicação
pro servidor passa a fazer sentido — o resto (geração de legenda, critério
de conformidade) pode continuar igual.

## Métrica — toda segunda-feira

Depois do post de segunda, antes de gerar o conteúdo do dia, confira
`/admin/captacao`: contatos novos por origem (Direct do Instagram, Link da
bio) na semana anterior. Se as duas origens ligadas ao Instagram estiverem
em zero com post publicado, o problema é distribuição, não copy — ver
"Como saber se está funcionando" em `pauta-inicial.md`.
