# Subir o servidor no Railway

Guia para tirar o servidor do PC da corretora e colocá-lo na nuvem. Depois
disso, `webhook.quadratadigital.com.br` fica no ar **mesmo com o PC desligado**
— acaba o erro 1033 (Cloudflare Tunnel) que derrubava o link da bio, o painel
de metas e o webhook do WhatsApp.

---

## 1. Criar o projeto no Railway

1. Entre em **railway.app** com a conta do GitHub (`quadrataseguros`).
2. **New Project → Deploy from GitHub repo**.
3. Escolha `quadrataseguros/whatsapp-webhook`.
4. Em **Settings → Source**, confirme a branch que vai ser publicada
   (normalmente `main`).

O primeiro build vai falhar ou subir incompleto até você fazer os passos 2 e 3.
É esperado.

---

## 2. Criar o volume (banco de dados)

O painel de metas usa SQLite em arquivo. Sem volume, **o banco é apagado a cada
deploy** — todas as vendas cadastradas somem.

1. Aba **Volumes → Add Volume**.
2. **Mount path:** `/data`

Continue no passo 3 para apontar o banco para esse volume (`DB_PATH`).

> Por causa do SQLite, o serviço deve ter **apenas 1 réplica** — já fixado em
> `railway.json` (`numReplicas: 1`). Não aumente esse número: duas instâncias
> gravando no mesmo arquivo corrompem o banco.

---

## 3. Variáveis de ambiente

Aba **Variables**. As três primeiras são obrigatórias:

| Variável | Valor | Por quê |
|---|---|---|
| `DB_PATH` | `/data/sales.db` | Guarda o banco no volume, não no disco temporário |
| `TZ` | `America/Sao_Paulo` | **Essencial.** O servidor do Railway roda em UTC. Sem isso, uma venda registrada depois das 21h entra no dia seguinte e a semana do painel vira no horário errado |
| `ADMIN_PASSWORD` | (a senha do admin) | Senha do painel `/admin.html` |

Para a MarIAna responder no WhatsApp, copie também do `.env` do PC atual:

| Variável | Observação |
|---|---|
| `VERIFY_TOKEN` | Precisa ser **igual** ao configurado no painel da Meta (padrão `quadrata123`) |
| `WA_PHONE_NUMBER_ID` | ID do número no painel da Meta |
| `WA_ACCESS_TOKEN` | Token de acesso da Meta |
| `ANTHROPIC_API_KEY` | Chave da Anthropic — sem ela a IA fica desligada |
| `MARIANA_MODEL` | Opcional (padrão `claude-haiku-4-5`) |
| `GRAPH_VERSION` | Opcional (padrão `v21.0`) |
| `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` | Opcionais — espelho das conversas |
| `WHATSAPP_NUMERO` | Opcional — só se o WhatsApp deixar de ser o (11) 98678-0000 |

**Não** defina `PORT`: o Railway injeta essa variável sozinho.

---

## 4. Gerar o domínio e conferir

1. Aba **Settings → Networking → Generate Domain**.
2. Vai sair uma URL tipo `https://whatsapp-webhook-production.up.railway.app`.
3. Teste, nessa URL:
   - `/health` → deve responder `{"status":"ok","mode":"mariana",...}`
     (`mode` vem `menu` se faltar a `ANTHROPIC_API_KEY`)
   - `/mariana-status` → `{"ia":"ok",...}` confirma a IA respondendo
   - `/fale` → deve redirecionar para o WhatsApp
   - `/dashboard.html` e `/admin.html` → painel de metas

Só siga para o passo 5 quando essa URL estiver respondendo.

---

## 5. Apontar o domínio para o Railway

### 5.1 No Railway

Em **Settings → Networking → Custom Domain**, adicione
`webhook.quadratadigital.com.br`. O Railway mostra o destino do CNAME (algo
como `xxxx.up.railway.app`) — copie.

### 5.2 Na Cloudflare

1. Painel da zona `quadratadigital.com.br` → **DNS → Registros**.
2. Ache o registro **`webhook`** (hoje é um CNAME para `...cfargotunnel.com`).
3. **Edite** e troque o destino pelo valor que o Railway mostrou.
4. Proxy: deixe **laranja (Proxied)**.
5. Salve. A propagação leva de segundos a alguns minutos.

> Evite mexer no DNS durante a manutenção programada da Cloudflare
> (sábado 29/08, 09h–10h UTC = 6h–7h de Brasília).

### 5.3 Desligar o túnel antigo

Depois que `https://webhook.quadratadigital.com.br/health` responder, o túnel
não é mais necessário. Em **one.dash.cloudflare.com → Networks → Tunnels**,
apague (ou deixe parado) o túnel antigo, e no PC pode desinstalar o serviço:

```cmd
cloudflared service uninstall
```

---

## 6. Conferir a Meta (WhatsApp)

O endereço do webhook **não muda** (continua o mesmo domínio), então em tese
nada a fazer. Mas confirme em *Meta for Developers → WhatsApp → Configuration*:

- **Callback URL:** `https://webhook.quadratadigital.com.br/webhook`
- **Verify token:** o mesmo valor de `VERIFY_TOKEN` no Railway

Clique em **Verify and save** para a Meta revalidar. Depois mande um "oi" pelo
WhatsApp para o (11) 98678-0000 e veja se o menu chega.

---

## 7. Migrar as vendas já cadastradas (se houver)

O banco do PC não vai junto automaticamente. Se já existem vendas registradas
em `C:\Users\quadr\whatsapp-webhook\sales.db` e você quer mantê-las:

1. No painel admin do PC (antes de desligar), aba **Vendas → Exportar CSV**.
2. Depois do deploy, recadastre pelo painel novo, ou me chame que eu faço uma
   rotina de importação do CSV.

Se as vendas do painel ainda são poucas ou de teste, ignore este passo.

---

## Depois do deploy

- Cada `git push` na branch publicada gera um deploy novo automaticamente.
- O `atualizar.bat` e o PC deixam de ser necessários para manter o site no ar.
- Logs em tempo real: aba **Deployments → View Logs** no Railway.
