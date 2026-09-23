# Publicações — a fila do Instagram

Cada pasta aqui é **um post**. O servidor publica sozinho quando chega o
horário. É o `publicador.js` que faz isso, e o acompanhamento fica em
`/admin/publicacoes`.

**A aprovação é o merge.** Um post só existe para o servidor depois que o
PR dele entra no `main`. É nesse PR que alguém da Quadrata vê a arte e a
legenda antes de irem ao ar.

## Uma pasta por post

```
publicacoes/
  2026-10-01-porto-vida-carrossel/
    post.json
    1.jpg
    2.jpg
    3.jpg
```

O nome da pasta começa pela data, o que deixa a fila em ordem cronológica. Pasta
que começa com `_` é rascunho, e o servidor não a enxerga.

## post.json

```json
{
  "persona": "fabricio",
  "tipo": "carrossel",
  "quando": "2026-10-01T09:00:00-03:00",
  "legenda": "Texto do post, com as quebras de linha e as hashtags.",
  "imagens": ["1.jpg", "2.jpg", "3.jpg"]
}
```

| Campo | Regra |
|---|---|
| `persona` | `fabricio` ou `mariana`. Decide por qual conta sai |
| `tipo` | `imagem` (1 foto), `carrossel` (2 a 10) ou `story` (1, sem legenda) |
| `quando` | Data e hora **com fuso** (`-03:00`). Sem fuso, o servidor, que roda em UTC, publicaria 3 horas antes |
| `legenda` | Até 2.200 caracteres e 30 hashtags |
| `imagens` | **JPEG**, porque a Meta não aceita PNG. Feed de 4:5 (1080×1350) a 1.91:1; story em 9:16 (1080×1920) |

## As travas

- **Nada sai sozinho** enquanto `PUBLICACAO_AUTOMATICA=1` não estiver no
  ambiente. Até lá, cada post pode ser publicado à mão pelo painel.
- **Post atrasado não sai sozinho.** Se o servidor ficou fora do ar e o
  horário passou há mais de 12h, o post fica marcado como atrasado e espera
  alguém decidir. Um "bom dia" publicado às 23h é pior que nenhum post.
- **Nada sai duas vezes.** O que já foi publicado fica registrado no banco.
- **Três recusas da Meta e o post para**, com o motivo no painel.

Antes de abrir o PR de um post: `npm run validar-posts`. Ele aplica as mesmas
regras que o servidor, e o erro aparece na hora em vez de no log às 9h.
