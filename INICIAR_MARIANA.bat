@echo off
title MarIAna - Quadrata Seguros
color 0A

echo.
echo  ============================================
echo    INICIANDO MARIANA - QUADRATA SEGUROS
echo  ============================================
echo.

echo  [1/4] Iniciando Langflow...
start "Langflow" "C:\Users\pfmse\AppData\Local\Programs\Python\Python311\Scripts\langflow.exe" run --host 0.0.0.0 --port 7860

echo  Aguardando Langflow iniciar (25 segundos)...
timeout /t 25 /nobreak > nul

echo  [2/4] Iniciando Tunnel Mariana (webhook)...
start "Tunnel Mariana" cloudflared tunnel run Mariana

echo  [3/4] Iniciando Tunnel Langflow...
start "Tunnel Langflow" cloudflared tunnel run langflow

echo  Aguardando tunnels (5 segundos)...
timeout /t 5 /nobreak > nul

echo  [4/4] Iniciando Webhook MarIAna...
start "Webhook MarIAna" cmd /k "cd /d C:\Users\pfmse\whatsapp-webhook\whatsapp-webhook-main && npm start"

echo.
echo  ============================================
echo    MARIANA ATIVA!
echo.
echo    Langflow:  http://localhost:7860
echo    Webhook:   http://localhost:3000
echo    Admin:     http://localhost:3000/admin.html
echo  ============================================
echo.
echo  Pode fechar esta janela.
timeout /t 5 /nobreak > nul
