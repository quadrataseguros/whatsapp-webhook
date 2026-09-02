# Marca — FabrícIO

Identidade do FabrícIO, o consultor digital (IA) da Quadrata no WhatsApp
(11) 93803-5700 e no Instagram.

O conceito: o **Q** da Quadrata já é um círculo com um traço. Abrindo uma
fresta no topo do bojo e enfiando a barra ali, o mesmo desenho lê como **Q**
e como **botão de ligar** — o **IO** que está dentro do nome, o mesmo truque
que a MarIAna faz com o **IA**.

O azul `#2f89f5` é o da corretora; o ciano (`#06b6d4` no claro, `#22d3ee` no
escuro) é a chave ligada. Assinatura: *Seu consultor de seguros digital ·
ON 24h*.

| Arquivo | O que é |
|---|---|
| `Main.dc.html` | Logotipo principal |
| `Escuro.dc.html` | Sobre fundo escuro |
| `Mono.dc.html` | Monocromático, positivo e negativo |
| `Avatar.dc.html` | Avatar 1080×1080 (perfil do WhatsApp e do Instagram) |
| `Familia.dc.html` | O vínculo: a marca da Quadrata ao lado da do FabrícIO |
| `Perfil.dc.html` | Os dois monogramas em 132, 56 e 40 px — o teste que decide |
| `Selo.dc.html` | Selo com a frase curvada — só para formato grande |
| `MonogramaFQ.dc.html` | F+Q ao lado de Q, a escolha em aberto |
| `canvas.json` | Posição de cada peça na tela |

Tipografia: Space Grotesk no nome, Inter no descritor (a mesma do painel).

O arquivo montado (`logotipo-fabricio.html`, ~2,4 MB) não é versionado: é
saída de build, remontada a partir destes arquivos.

## Instagram — @fabricioquadrata

| Arquivo | O que é |
|---|---|
| `perfil-instagram.html` | Nome, @, bio, link, categoria, destaques e a legenda do post fixado |
| `lancamento/Main..Post5.dc.html` | Carrossel do post fixado (1080×1350) |
| `lancamento/Dest1..Dest5.dc.html` | Capas dos destaques (1080×1920, recortadas em círculo) |

Os campos do perfil (nome, bio, link, foto, categoria) são preenchidos **à mão
no app**: a API oficial da Meta expõe esses campos só para leitura. O que a API
faz é publicar posts e responder direct — as duas coisas que o servidor já cobre.

**O botão nativo de WhatsApp fica desligado no perfil do FabrícIO.** Ele abre a
conversa sem texto, e como o número é o mesmo da MarIAna o servidor não teria
como saber de onde o cliente veio — ela atenderia no perfil dele. O caminho do
WhatsApp é só o link da bio, `/fale/fabricio`.

### Selo e avatar são peças diferentes

O selo (anel, frase curvada, monograma no centro) só é legível acima de uns
200px: serve para post, assinatura de e-mail, carimbo e banner. O avatar do
WhatsApp e do Instagram aparece a 40px na maior parte do tempo — ali vai a marca
sozinha, sem texto nenhum em volta. Uma peça não substitui a outra.

A frase é "ON 24h", não "24hs", e aparece **uma vez** por peça.
