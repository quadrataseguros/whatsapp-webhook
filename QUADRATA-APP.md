# Quadrata App — Guia de Operação

Sistema completo: painel admin (você cadastra) + app do cliente (ele consulta).

```
┌─────────────────┐         ┌──────────────┐        ┌──────────────────┐
│  Painel Admin   │ ──────▶ │   SQLite     │ ◀───── │  Quadrata App    │
│  /admin         │  grava  │ quadrata.db  │   lê   │  /quadrata       │
│  (você)         │         │              │        │  (cliente)       │
└─────────────────┘         └──────────────┘        └──────────────────┘
```

## Endereços

| O quê | URL |
|---|---|
| Painel admin | `https://SEU-APP.up.railway.app/admin` |
| App do cliente | `https://SEU-APP.up.railway.app/quadrata/login` |

## Como usar no dia a dia

1. Acesse `/admin` e faça login.
2. **Clientes → + Novo Cliente**: cadastre CPF, nome e uma senha. É com esse CPF e senha que o cliente entra no app.
3. **Apólices → + Nova Apólice**: escolha o cliente, preencha tipo, número, seguradora, vigência, prêmio e as coberturas.
4. **Boletos → + Novo Boleto**: vincule à apólice, informe vencimento, valor, linha digitável e PIX. O cliente copia direto no app.
5. Envie ao cliente o link `/quadrata/login` e diga para ele "Adicionar à tela de início".

Sinistros abertos pelo cliente no app aparecem no banco e podem ser acompanhados por lá.

## Como o cliente instala no celular

Não precisa de loja de aplicativos — é um PWA.

**Android (Chrome):** abrir o link → menu ⋮ → "Instalar app" / "Adicionar à tela inicial".
**iPhone (Safari):** abrir o link → botão Compartilhar → "Adicionar à Tela de Início".

O ícone azul com "Q" aparece junto dos outros apps e abre em tela cheia, sem barra do navegador.

## Deploy no Railway

### Variáveis de ambiente (obrigatórias em produção)

| Variável | Para quê |
|---|---|
| `ADMIN_PASSWORD` | Senha do painel admin. **Defina antes do primeiro deploy.** |
| `JWT_SECRET` | Chave que assina os tokens. Use um valor longo e aleatório. |
| `DB_PATH` | Caminho do banco. Aponte para dentro do volume: `/data/quadrata.db` |

Gerar um `JWT_SECRET`:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### Volume persistente — passo obrigatório

O disco do Railway é apagado a cada deploy. Sem volume, **todos os clientes e apólices somem** na próxima publicação.

1. No projeto Railway → **Variables** → adicione as três variáveis acima.
2. → **Volumes** → **New Volume** → mount path `/data`.
3. Confirme que `DB_PATH=/data/quadrata.db`.

### Publicando

O `postinstall` do `package.json` já compila o app web no deploy. Basta:

```bash
git push origin main
```

## Rodando localmente

```bash
npm install
npm start                      # http://localhost:3000
```

Para recompilar o app depois de mexer em `quadrata-app/`:

```bash
cd quadrata-app && npx expo export --platform web
```

## Gerando o APK (opcional)

O PWA já resolve para a maioria dos casos. Se quiser um APK instalável:

```bash
npm install -g eas-cli
cd quadrata-app
eas login
eas build -p android --profile preview
```

Ao final o EAS devolve um link `.apk` que você envia por WhatsApp. Antes disso, defina a URL da API para o app apontar ao servidor em produção:

```bash
EXPO_PUBLIC_API_URL=https://SEU-APP.up.railway.app
```

## Estrutura

| Arquivo | Responsabilidade |
|---|---|
| `quadrata-db.js` | Schema SQLite e criação do admin |
| `quadrata-api.js` | Rotas `/api/cliente/*` e `/api/admin/*` |
| `quadrata-admin.js` | Painel admin (HTML/CSS/JS inline) |
| `quadrata-app/` | App React Native / Expo |
| `index.js` | Servidor Express que monta tudo |

## Segurança

- Senhas são gravadas com hash bcrypt — nunca em texto puro.
- Cada rota `/api/cliente/*` filtra pelo CPF do token, então um cliente nunca enxerga dados de outro.
- Token do cliente dura 30 dias; o do admin, 12 horas.
- O service worker não cacheia `/api/`, então os dados exibidos são sempre os atuais.
