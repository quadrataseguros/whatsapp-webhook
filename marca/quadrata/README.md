# Marca — Quadrata Seguros Digital

A identidade **neutra** da corretora nos canais digitais: é o que aparece onde
a MarIAna e o FabrícIO dividem o mesmo espaço — o perfil do WhatsApp, que é um
número só para as duas.

| Arquivo | O que é |
|---|---|
| `quadrata-digital.jpg` | A arte completa (990×989): a marca dissolvendo em pixels, "Quadrata Seguros Digital", sobre a foto do teclado. **Formato grande** — post, capa, banner, story. |
| `avatar-whatsapp.png` | Recorte 640×640 só da marca dissolvendo, sem texto. É o que a rota `/admin/whatsapp` sobe como foto do perfil. |
| `avatar-whatsapp.html` | A receita do recorte (Chromium headless). Ajuste as coordenadas aqui e renderize de novo. |

Por que dois arquivos: foto de perfil aparece a 40px na lista de conversas. A
arte inteira, nesse tamanho, vira um borrão roxo com um risco branco. A marca
sozinha, sem texto, ainda lê.

Renderizar de novo:

```bash
cd marca/quadrata
/opt/pw-browsers/chromium-*/chrome-linux/chrome --headless=new --no-sandbox --disable-gpu \
  --hide-scrollbars --window-size=640,640 --screenshot=avatar-whatsapp.png "file://$PWD/avatar-whatsapp.html"
```
