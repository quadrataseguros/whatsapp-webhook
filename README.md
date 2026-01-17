# WhatsApp Webhook para Make

Este projeto cria um endpoint público para validar o Webhook da Meta e encaminhar mensagens para o Make.

## Como usar
1. Suba este repositório no GitHub.
2. No Render, crie um novo Web Service e conecte este repositório.
3. Configure:
   - Build Command: `npm install`
   - Start Command: `npm start`
4. Copie a URL pública gerada pelo Render (ex.: `https://whatsapp-webhook.onrender.com/webhook`).
5. Cole essa URL no painel da Meta como Callback URL.
6. Use o token `quadrata123` como Verify Token.
