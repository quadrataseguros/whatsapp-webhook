# Conteúdo — @fabricioquadrata

Os sete prompts que circulam no Instagram (@gurudoprompt) são um framework de
crescimento genérico: auditar → planejar → gerar ideias → mapear funil →
revisar → executar → medir. O esqueleto serve. O que não serve é o alvo: eles
otimizam para **seguidor e view**, e o canal do FabrícIO existe para outra
coisa — **conversa iniciada no WhatsApp ou no direct**, que é onde a IA atende
e onde o corretor humano fecha.

Este diretório é a versão traduzida. Os prompts daqui já vêm preenchidos com o
perfil real: bio, pilares, produtos e os limites que um perfil de seguro tem e
um perfil de "growth" não tem.

| Arquivo | O que é |
|---|---|
| `README.md` | Os quatro prompts adaptados, o bloco de contexto e as regras de conformidade |
| `pauta-inicial.md` | A saída do Prompt A já rodada: 20 conteúdos mapeados por etapa + 3 séries + o primeiro mês |

## O que sobrou dos sete

| # | Original | Veredicto |
|---|---|---|
| 1 | Raio-X do Perfil | **Parado.** Pede views e seguidores que ainda não existem — e a bio, os destaques e a categoria já estão decididos em `../perfil-instagram.html`, com motivo escrito. Não deixe um prompt genérico reescrever isso. |
| 2 | Sala de Guerra | **Descartado.** É o 3 e o 4 juntos, com mais barulho. A "grade de 7 dias" que ele produz ninguém sustenta. |
| 3 | Laboratório de Views | **Vira o Prompt B.** O gerador de 20 ângulos é a melhor parte do pacote: seguro é um nicho onde todo mundo escreve o mesmo post. |
| 4 | Engenharia Reversa | **Vira o Prompt A** — o mais valioso dos sete aqui, porque o funil do FabrícIO já é conhecido. Trocando "SEGUIR" por "chamar no direct", ele entrega exatamente o que falta em cada degrau. |
| 5 | Crítico de conteúdo | **Vira o Prompt C**, com uma quarta rodada: conformidade. |
| 6 | Sistema Diário | **Vira o Prompt D**, na faixa de 20 minutos. Perfil de corretora não vive de volume, vive de constância. |
| 7 | CEO do Instagram | **Parado até haver 60–90 dias de post.** E quando destravar, a métrica que importa não está no Instagram: está em `/admin/captacao`. |

## As três traduções obrigatórias

Qualquer um dos sete prompts originais que você for rodar, mude estas três
coisas antes — sem elas a IA devolve conteúdo viral genérico que traz seguidor
de fora da praça, que nunca vai cotar nada.

**1. O objetivo não é seguidor, é conversa.** Onde o prompt pedir
`OBJETIVO PRINCIPAL: [VIEWS / SEGUIDORES / LEADS / VENDAS]`, responda sempre
*conversa iniciada no direct ou no WhatsApp pelo link da bio*. Seguidor é
consequência, não meta.

**2. O CTA do feed não é "link na bio".** Post de feed não tem link clicável.
O CTA barato e que funciona aqui é **"chama no direct"** — o direct do
FabrícIO é respondido pela IA sozinha, e o roteamento por conta que recebeu a
mensagem é o sinal mais confiável que existe (não depende do que o cliente
digitou). O link com `?assunto=` é para o **sticker de link do story** e para a
bio. Ver a tabela no fim deste arquivo.

**3. Seguro é setor regulado.** Os prompts originais empurram para "tensão",
"contradição" e "opinião forte". Em seguro isso vira promessa de cobertura e
comparação de preço — coisas que nem o FabrícIO nem a Quadrata podem fazer em
post. O bloco de restrições abaixo entra em **todo** prompt, colado no fim.

---

## Bloco de contexto (cole no começo de qualquer prompt)

```
CONTEXTO DO PERFIL

Perfil: @fabricioquadrata — Instagram.
Quem é: FabrícIO, consultor de seguros DIGITAL (uma IA, e isso é dito na cara)
da Quadrata Seguros, corretora brasileira. Ele é o irmão do @marianaquadrata:
mesmo número de WhatsApp, personas diferentes conforme a porta de entrada.
Nome no perfil: "FabrícIO | Seguros e Consórcio". Categoria: Seguros.
Bio: Consultor digital da Quadrata Seguros ⏻ ON 24h / Auto · Vida · Saúde ·
Consórcio · Cartão Porto Bank / Tira a dúvida na hora. Corretor humano fecha.

PÚBLICO: adulto de 28 a 55 anos, Brasil urbano, que já tem ou vai ter carro,
casa, plano ou consórcio. Não é entusiasta de seguro — é alguém que só pensa
no assunto quando renova, quando bate o carro ou quando o boleto sobe. Odeia
formulário, odeia esperar o comercial abrir, e desconfia de corretor que some
depois da venda.

OFERTA: atendimento de seguros que responde na hora, a qualquer hora. Auto,
vida, saúde, odonto, residencial, consórcio, financiamento, Cartão Porto Bank,
e orientação de sinistro/assistência 24h. Cotação e dúvida são resolvidas com
a IA; VALOR, CONTRATAÇÃO E FECHAMENTO são sempre de um corretor humano da
Quadrata (humano: seg–sex, 8h30–17h30).

DIFERENCIAL REAL (não invente outro): às 2h da manhã de domingo o cliente
manda "bati o carro" e alguém responde. Concorrente nenhum na praça responde
fora do horário comercial.

PILARES DE CONTEÚDO (já definidos, use estes):
1. Dúvida de cliente — uma pergunta real que chegou no WhatsApp, respondida em
   três linhas. O formato mais barato de produzir e o que mais gera direct.
2. Consórcio sem lenda — consórcio não é financiamento: não tem juros, tem
   taxa. Desfazer a confusão antes de o cliente chamar.
3. Os primeiros 10 minutos — o que fazer quando bateu o carro, antes de ligar
   para qualquer um.
4. Cartão Porto Bank — 12 meses sem anuidade, salas VIP, desconto nos seguros
   Porto. Post de conversão direta.

FUNIL (é este, e o fim dele não é "seguir"):
conteúdo → curiosidade → visita ao perfil → confiança → DIRECT ou link da bio
→ conversa com a IA → dados coletados → corretor humano fecha.

OBJETIVO PRINCIPAL: conversa iniciada (direct ou WhatsApp). Seguidor é
consequência. View sem conversa não vale nada aqui.
```

## Bloco de restrições (cole no fim de qualquer prompt)

```
RESTRIÇÕES INEGOCIÁVEIS

- Não prometa cobertura, valor de prêmio, desconto, prazo de indenização nem
  resultado de sinistro. Cobertura depende da apólice — quando o assunto for
  cobertura, o conteúdo manda o cliente CONFERIR A APÓLICE DELE, não afirma.
- Não trate o FabrícIO como corretor. Ele é consultor digital. Corretor é
  profissão regulada pela SUSEP e quem fecha é um humano da Quadrata. Todo
  conteúdo de fundo de funil deixa isso visível.
- Não cite seguradora por nome de forma negativa e não faça comparação de
  preço entre seguradoras.
- Nada de "seguro X é melhor que Y", "aqui é mais barato", "eu resolvo seu
  sinistro". A IA orienta e coleta; ela não resolve sinistro nem aprova nada.
- Do Cartão Porto Bank só se fala o que está na campanha oficial, e nunca se
  promete aprovação — a análise é da Porto Bank.
- Nada de número inventado: estatística sem fonte, "90% das pessoas não sabem",
  telefone de assistência. Se não veio do material da Quadrata, não entra.
- Tom: direto, confiante, sem enrolação e sem jargão de seguro. Frase curta.
  No máximo um emoji. Nada de "você sabia que...".
```

---

## Prompt A — Engenharia reversa do lead

*Roda uma vez por trimestre, ou quando o mix de produto mudar. A saída da
primeira rodada já está em `pauta-inicial.md`.*

```
[BLOCO DE CONTEXTO]

Quero que você trabalhe de trás para frente.

Imagine uma pessoa desse público que ACABOU DE MANDAR UMA MENSAGEM no direct
do FabrícIO — não que apertou "seguir". Seguir é grátis e não prova nada;
mandar mensagem custa vergonha.

Pergunte: "o que ela precisou acreditar imediatamente antes de mandar?"
Depois: "o que ela precisou ver para acreditar nisso?"
Continue voltando até chegar ao primeiro contato com o conteúdo.

Construa a sequência:
CONTEÚDO → CURIOSIDADE → VISITA AO PERFIL → CONFIANÇA → MENSAGEM

Determine qual conteúdo é necessário em cada etapa. Depois crie:
- 5 conteúdos de DESCOBERTA: alcançam quem nunca ouviu falar da Quadrata e não
  está pensando em seguro hoje;
- 5 conteúdos que PROVOCAM VISITA AO PERFIL: fazem a pessoa querer saber quem
  está falando;
- 5 conteúdos de AUTORIDADE E CONFIANÇA: fazem pensar "esse aí sabe do que
  fala e não está me empurrando nada";
- 5 conteúdos de CONVERSA: dão um motivo concreto para mandar mensagem HOJE.

Para cada um entregue: pilar (dos 4 acima), gancho, formato (Reels ou
carrossel), o que retém até o fim, CTA e para onde manda (direct, story com
link, ou nada).

Por fim crie 3 séries recorrentes, publicáveis toda semana, que construam
crescimento acumulado sem depender de inspiração.

[BLOCO DE RESTRIÇÕES]
```

## Prompt B — Laboratório de ângulos

*Roda toda vez que você tiver um tema e não souber por onde entrar.*

```
[BLOCO DE CONTEXTO]

TEMA: [COLE O TEMA]

Não escreva o conteúdo ainda.

Primeiro gere 20 ângulos diferentes para abordar esse mesmo assunto. Cada um
deve explorar pelo menos um destes gatilhos: curiosidade, erro comum, quebra
de crença, medo de perder, comparação, prova, transformação, oportunidade.
(Fora: "opinião forte" e "segredo" — em seguro isso vira promessa.)

Dê nota de 0 a 10 para cada ângulo em:
- CURIOSIDADE
- RELEVÂNCIA PARA QUEM TEM CARRO, CASA OU PLANO
- POTENCIAL DE COMPARTILHAMENTO
- POTENCIAL DE RETENÇÃO
- PROBABILIDADE DE GERAR UMA MENSAGEM NO DIRECT  ← peso dobrado

Elimine qualquer um abaixo de 38/50 e qualquer um que só interesse a quem já é
cliente. Pegue os 3 vencedores.

Para cada vencedor crie: 3 hooks de até 8 palavras, 1 roteiro de Reels de até
30 segundos (fala e o que aparece na tela), 1 estrutura de carrossel de 6
cards, 1 CTA para comentar e 1 CTA para chamar no direct.

Depois diga qual você publicaria primeiro se a meta fosse conversa iniciada —
e qual publicaria se a meta fosse alcance. Se forem diferentes, explique por
quê.

[BLOCO DE RESTRIÇÕES]
```

## Prompt C — O crítico

*Roda antes de publicar. É o prompt que mais economiza post ruim.*

```
[BLOCO DE CONTEXTO]

Vou te enviar um conteúdo. Sua função não é elogiar. Sua função é impedir que
eu publique algo medíocre — ou algo que a Quadrata não pode publicar.

CONTEÚDO:
[COLE]

Faça 4 rodadas.

RODADA 1 — DESTRUA
Aponte: onde perde atenção; o que está previsível; o que está genérico; quais
trechos podem ser cortados sem perda; onde falta prova; onde a promessa
enfraquece; por que alguém não compartilharia.

RODADA 2 — RECONSTRUA
Reescreva mantendo a ideia original, aumentando curiosidade, velocidade,
clareza, contraste e valor percebido. Corte pela metade o que der.

RODADA 3 — TESTE
Simule três pessoas:
A: nunca ouviu falar da Quadrata e não está pensando em seguro.
B: já me acompanha.
C: tem uma renovação chegando e podia fechar comigo.
Para cada uma: "em qual trecho eu perderia essa pessoa?" e "o que ela faria
depois de ver isso?".

RODADA 4 — CONFORMIDADE
Releia procurando, uma a uma:
- promessa de cobertura, valor, desconto ou prazo de indenização;
- qualquer frase que faça o FabrícIO parecer um corretor licenciado;
- comparação de preço ou crítica a seguradora nomeada;
- número, estatística ou telefone sem fonte;
- promessa de aprovação do Cartão Porto Bank.
Se achar qualquer uma, reescreva o trecho. Se não achar, diga "limpo" — não
invente problema para parecer útil.

Só depois disso entregue a VERSÃO FINAL PRONTA PARA POSTAR, com legenda e o
CTA já escrito.

[BLOCO DE RESTRIÇÕES]
```

## Prompt D — A rotina que sobrevive

*Roda uma vez. Depois é só seguir.*

```
[BLOCO DE CONTEXTO]

Monte a rotina de Instagram do FabrícIO sabendo que quem publica é um corretor
que já tem uma corretora para tocar — não um social media. O tempo real
disponível é 20 minutos por dia, e alguns dias vai ser zero.

Quero uma rotina sustentável, não uma rotina perfeita que vou abandonar.

Distribua o tempo entre: captar dúvida real do WhatsApp, criar, publicar,
stories, responder comentário e direct, e olhar número.

Crie três versões: 20 minutos, 45 minutos, e o protocolo de 5 minutos para o
dia em que não deu. Depois monte o calendário da semana, de segunda a domingo,
com objetivo + ação por dia, sabendo que a frequência alvo é 3 posts por
semana e stories em 4 dias.

No final defina:
- 3 coisas que devo fazer todos os dias;
- 3 coisas que parecem importantes e posso parar de fazer;
- 1 hábito que produz o maior efeito composto em 90 dias.

Regra: se um item não cabe em 20 minutos, ele não entra.

[BLOCO DE RESTRIÇÕES]
```

---

## Para onde mandar o cliente

Post de feed **não tem link clicável**. O CTA do feed é comentário ou direct.
Os links abaixo servem para o sticker de link no story e para trocar o link da
bio quando houver campanha.

| Assunto | Link |
|---|---|
| Geral (o da bio) | `https://webhook.quadratadigital.com.br/fale/fabricio` |
| Auto | `…/fale/fabricio?assunto=auto` |
| Vida | `…/fale/fabricio?assunto=vida` |
| Saúde | `…/fale/fabricio?assunto=saude` |
| Odonto | `…/fale/fabricio?assunto=odonto` |
| Residencial | `…/fale/fabricio?assunto=residencia` |
| Consórcio | `…/fale/fabricio?assunto=consorcio` |
| Financiamento | `…/fale/fabricio?assunto=financiamento` |
| Cartão Porto Bank | `…/fale/fabricio?assunto=cartao` |
| Sinistro / guincho | `…/fale/fabricio?assunto=sinistro` |

Cada link abre o WhatsApp com a frase já digitada — é ela que diz ao servidor
que o cliente veio do FabrícIO e que o assunto já é aquele. **Nunca** use
`/fale` sem o `/fabricio`, nem um `wa.me` direto: sem a rota, quem atende é a
MarIAna, no perfil dele.

## A métrica que importa não está no Instagram

O Prompt 7 original pede alcance, views e visitas ao perfil. Esses números são
de vaidade aqui. O número que decide está em **`/admin/captacao`**: contatos
por origem e por semana, com a origem gravada no primeiro toque.

| Origem no painel | O que ela prova |
|---|---|
| **Direct do Instagram** | O conteúdo está gerando conversa sem intermediário |
| **Link da bio** | O perfil está convertendo visita em conversa |
| **Anúncio** | O tráfego pago se paga (ou não) |
| **Direto no WhatsApp** | Veio da carteira, não do canal digital |

Enquanto essas duas primeiras linhas estiverem em zero, nenhum ajuste de
gancho importa — o problema é distribuição, não copy. Quando elas somarem umas
30 conversas, aí sim vale rodar o Prompt 1 e o Prompt 7 originais, com dados
de verdade em vez de chute.
