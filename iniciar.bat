@echo off
title Inicializador PC Remoto
color 0A

echo ============================================================
echo   Iniciando todos os servicos...
echo ============================================================
echo.

echo [1/4] Iniciando pc_server (porta 5050)...
start "PC Server" cmd /k "python %USERPROFILE%\Downloads\pc_server.py"
timeout /t 2 >nul

echo [2/4] Iniciando Langflow (porta 7860)...
start "Langflow" cmd /k "langflow run --host 0.0.0.0 --port 7860"
timeout /t 2 >nul

echo [3/4] Iniciando WhatsApp Webhook (porta 3000)...
start "WhatsApp Webhook" cmd /k "cd /d %USERPROFILE%\Downloads && npm start 2>nul || (cd /d C:\Users\pfmse\whatsapp-webhook && npm start)"
timeout /t 2 >nul

echo [4/4] Iniciando Cloudflare Tunnel (porta 5050)...
start "Cloudflare Tunnel" cmd /k "cloudflared tunnel --url http://localhost:5050"

echo.
echo ============================================================
echo   Todos os servicos iniciados!
echo   Painel: http://localhost:5050/painel
echo ============================================================
echo.
pause
