# Campanha — Quadrata Corretora de Seguros × Consórcio Porto Bank

## Conceito

**"O bem que você quer, com a parcela que faz sentido."**

Linha aspiracional, não panfleto de tabela. Visual editorial e realista (fotografia
de arquitetura/automotiva, não ilustração cartoon), mantendo a identidade Quadrata.
Tom de voz natural e vendedor — sem clichês de IA ("aproveite essa oportunidade
imperdível", "não perca tempo", etc.).

## Identidade visual

| Elemento | Especificação |
|---|---|
| Formato | 1080 × 1350 px (feed, 4:5) / 1080 × 1920 px (stories, 9:16) |
| Fundo | Azul-marinho `#0A192F` (ou foto com overlay escuro) |
| Texto | Branco `#FFFFFF` |
| Destaques / valores | Azul claro `#38BDF8` |
| Headline | Serifada elegante (Playfair Display ou Cinzel) |
| Corpo / tabelas | Sans-serif limpa (Inter, Montserrat ou Helvetica) |

## Dados de base — Consórcio de Imóvel (Porto Bank)

Tabela oficial, valores para Pessoa Física, grupo em formação com prazo de 200 meses,
lance embutido de 30% do crédito.

- **Grupo até R$ 280.000** → Taxa Adm 21,85% (taxa antecipada diluída no plano)
- **Grupo de R$ 280.000 a R$ 560.000** → Taxa Adm 19,95%
- **Acima de R$ 560.000** (faixa que só aparece na campanha "Acelera Agosto") →
  taxa a confirmar
- Fundo de Reserva: 2%
- Seguro Prestamista: 0,038% (pessoas físicas)
- Parcela reduzida em 50% até a contemplação; depois o valor é compensado nas
  parcelas seguintes
- Parcelas reajustadas no aniversário do grupo
- Campanha vigente **"Acelera Agosto"** (até 18/08): +5% de desconto na taxa
  administrativa (+10% para cliente Porto)
- Tabela completa em [`dados-tabela-imovel.md`](./dados-tabela-imovel.md)

## Dados de base — Consórcio de Automóvel e Pesados (Porto Bank)

Recebida a tabela real da campanha **"Acelera Agosto"** (válida até 18/08):
créditos de R$ 40 mil a R$ 200 mil, parcela reduzida em 50%, mesmo esquema de
desconto na taxa (5% geral / 10% cliente Porto) do imóvel. **Falta apenas o
rodapé legal** (taxa adm base, fundo de reserva, seguro prestamista) — não
apareceu na captura enviada. Ver [`dados-tabela-automovel.md`](./dados-tabela-automovel.md)
e aviso no topo de [`02-post-automovel.md`](./02-post-automovel.md).

## Aviso legal obrigatório (rodapé de toda arte com valores)

Toda peça que exibir parcela/crédito precisa trazer, em texto legível:

1. Taxa de administração total do grupo (por faixa, quando houver mais de uma)
2. Fundo de Reserva (2%)
3. Que a parcela reduzida vale só até a contemplação, com compensação posterior
4. Chamada para o Regulamento ("Para demais condições, consulte o Regulamento")

Sem isso a peça configura publicidade incompleta perante o consumidor (CDC).

## Índice de entregas

| # | Peça | Status |
|---|---|---|
| 1 | Post feed — Imóvel (Acelera Agosto) | ✅ pronto (falta confirmar taxa acima de R$560 mil) |
| 2 | Post feed — Automóvel (Acelera Agosto) | ⚠️ falta rodapé legal (taxa adm/fundo/seguro) |
| 3 | Stories — Imóvel (5 slides) | ✅ pronto |
| 4 | Stories — Automóvel (5 slides) | ⚠️ falta rodapé legal |
| 5 | Post — Prova social | ⚠️ template pronto, falta depoimento/números reais |
| 6 | Post — Como funciona o consórcio | ✅ pronto |
| 7 | Post — Consórcio x Financiamento | ✅ pronto |

## Pendências

- [ ] Confirmar taxa administrativa do consórcio de imóvel para créditos acima
      de R$ 560 mil (faixa nova, só aparece na campanha "Acelera Agosto")
- [ ] Obter o rodapé legal completo do consórcio de automóvel (taxa adm base,
      fundo de reserva, seguro prestamista) e atualizar `02-post-automovel.md`
      e `04-stories-automovel.md`
- [ ] Reunir insumo real para a prova social (depoimento de cliente ou
      números da Quadrata) — ver `05-post-prova-social.md`
- [ ] Validar textos de rodapé/legal com compliance antes de publicar
- [ ] Gerar as artes finais (Canva/Photoshop) usando os prompts de imagem
      indicados em cada post
- [ ] Acompanhar a validade da campanha "Acelera Agosto" (18/08) — depois
      dessa data, revisar selos/CTAs de desconto antes de continuar publicando
