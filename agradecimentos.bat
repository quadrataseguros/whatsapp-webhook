@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================================
echo  Quadrata Seguros - Agradecimentos via WhatsApp
echo ============================================================
echo.

echo [1/5] Parando servidor antigo (se estiver rodando)...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 1 /nobreak >nul

echo [2/5] Baixando o codigo dos agradecimentos...
git fetch origin claude/charming-brown-6mtrgh
if errorlevel 1 (
  echo.
  echo ERRO: nao consegui baixar do GitHub. Verifique sua conexao.
  pause
  exit /b 1
)
git reset --hard origin/claude/charming-brown-6mtrgh
if errorlevel 1 (
  echo.
  echo ERRO: nao consegui aplicar o codigo. Verifique se esta na pasta certa.
  pause
  exit /b 1
)

echo [3/5] Instalando dependencias...
call npm install --silent

echo [4/5] Conferindo configuracao...
if exist .env (
  echo      Arquivo .env ja existe, mantendo o que esta la.
) else (
  echo.
  echo      Primeira vez aqui. Escolha uma senha para abrir o painel.
  echo      Ela protege nome, telefone e e-mail dos participantes.
  echo.
  set /p SENHA="      Senha do painel: "
  >  .env echo SUPABASE_URL=https://tqenmuittslwlaeurqgt.supabase.co
  >> .env echo SUPABASE_KEY=sb_publishable_IqFn5uOBeHm8bEDHwK3HUg_44xA_Pyl
  >> .env echo AGRADECIMENTO_MODO=link
  >> .env echo ADMIN_PASSWORD=!SENHA!
  >> .env echo PORT=3000
  echo.
  echo      Pronto, .env criado.
)

echo [5/5] Iniciando o servidor...
start "Servidor Quadrata - NAO FECHE" cmd /k npm start
echo      Esperando o servidor subir...
timeout /t 6 /nobreak >nul
start "" http://localhost:3000/agradecimentos

echo.
echo ============================================================
echo  Tudo pronto.
echo ============================================================
echo.
echo  O painel abriu no navegador. Digite a senha que voce
echo  escolheu para ver a lista.
echo.
echo  ANTES DE DISPARAR: abra o web.whatsapp.com e confirme que
echo  a conta conectada e a do WhatsApp Business (11) 4782-0888,
echo  e nao o seu WhatsApp pessoal.
echo.
echo  Para parar: feche a janela "Servidor Quadrata".
echo.
pause
