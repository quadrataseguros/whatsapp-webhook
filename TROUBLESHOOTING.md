# Guia de recuperação — webhook fora do ar

Este guia trata do erro que apareceu ao abrir `webhook.quadratadigital.com.br`:

> **Error 1033 — Cloudflare Tunnel error**
> "The host (webhook.quadratadigital.com.br) is configured as a Cloudflare
> Tunnel, and Cloudflare is currently unable to resolve it."

Quando isso acontece, **a MarIAna para de responder no WhatsApp e no Instagram**,
porque a Meta não consegue mais entregar as mensagens no nosso servidor.

---

## O que o erro 1033 significa

O domínio `webhook.quadratadigital.com.br` está publicado através de um
**Cloudflare Tunnel** (o programa `cloudflared`, rodando na máquina/servidor
onde está o webhook). O erro 1033 quer dizer:

> A Cloudflare recebeu a visita, mas **não achou nenhum túnel ativo** para
> entregar. Ou seja: o `cloudflared` **não está rodando** ou **perdeu a conexão**
> com a Cloudflare.

Não é um problema do código deste projeto — é o **caminho** entre a internet e o
servidor que caiu. Causas típicas:

- A máquina/servidor foi **desligada ou reiniciada** e o `cloudflared` não subiu junto.
- O processo `cloudflared` **caiu** (erro, falta de memória, atualização).
- **Sem internet** na máquina onde o túnel roda.
- O **token/credencial do túnel** expirou ou foi revogado.
- O **app Node (porta 3000)** caiu, então o túnel sobe mas não acha para onde entregar.

---

## Recuperação rápida (na máquina que roda o túnel)

> Faça na ordem. Depois de cada passo, recarregue `https://webhook.quadratadigital.com.br/health`.

### 1. O app está no ar localmente?

```bash
curl http://localhost:3000/health
```

- **Respondeu `{"status":"ok",...}`** → o app está bom, o problema é só o túnel (vá ao passo 2).
- **Não respondeu** → suba o app primeiro:

```bash
cd /caminho/do/whatsapp-webhook
npm install
npm start           # ou: pm2 start index.js --name mariana
```

### 2. O `cloudflared` está rodando?

```bash
# Se estiver como serviço (recomendado):
sudo systemctl status cloudflared
sudo systemctl restart cloudflared

# Ver o que está acontecendo:
sudo journalctl -u cloudflared -n 50 --no-pager
```

Se não estiver instalado como serviço, rode manualmente para ver o erro:

```bash
cloudflared tunnel run <NOME_OU_ID_DO_TUNEL>
```

### 3. Ainda 1033?

- Confirme que a máquina tem **internet** (`ping 1.1.1.1`).
- Confirme no painel da Cloudflare (**Zero Trust → Networks → Tunnels**) que o
  túnel aparece como **HEALTHY** e que a rota `webhook.quadratadigital.com.br`
  aponta para `http://localhost:3000`.
- Se o túnel estiver **DOWN/INACTIVE**, recrie a credencial e rode de novo.

### 4. Confirmar que voltou

```bash
curl https://webhook.quadratadigital.com.br/health
```

Deve responder o JSON com `"status":"ok"`. A MarIAna volta a responder sozinha.

---

## Deixar de cair (prevenção)

1. **Rodar o `cloudflared` como serviço** (sobe sozinho ao ligar a máquina):
   ```bash
   sudo cloudflared service install
   sudo systemctl enable --now cloudflared
   ```

2. **Manter o app Node sempre no ar** com um gerenciador de processos:
   ```bash
   npm install -g pm2
   pm2 start index.js --name mariana
   pm2 startup      # gera o comando para subir no boot
   pm2 save
   ```

3. **Monitorar a URL**: cadastre `https://webhook.quadratadigital.com.br/health`
   em um monitor gratuito (ex.: UptimeRobot, Better Stack) para receber um aviso
   por e-mail/WhatsApp assim que cair — antes de os clientes perceberem.

4. **Alternativa mais estável — hospedar no Render** (sem depender da máquina
   local e do túnel). Veja o passo a passo no `README.md`. Nesse modelo o
   endereço do webhook passa a ser o do Render (ex.:
   `https://whatsapp-webhook.onrender.com/webhook`) e não há mais Cloudflare
   Tunnel para cair. Atenção: no plano gratuito o Render "dorme" após
   inatividade — use o monitor do item 3 apontando para `/health` para mantê-lo
   acordado.

---

## Referência rápida

| Sintoma | Causa provável | Ação |
|--------|-----------------|------|
| Erro 1033 na página | `cloudflared` parado/sem conexão | `systemctl restart cloudflared` |
| `/health` local falha | App Node caiu | `npm start` / `pm2 restart mariana` |
| Túnel HEALTHY mas erro 502 | App não está na porta 3000 | Conferir `PORT` e a rota do túnel |
| Voltou mas cai de novo | Não está como serviço | Instalar `cloudflared` + `pm2` no boot |
