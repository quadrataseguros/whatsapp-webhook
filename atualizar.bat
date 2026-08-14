@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================================
echo  Atualizando Quadrata Seguros - Painel de Metas
echo ============================================================
echo.

echo [1/4] Parando processo node antigo (se estiver rodando)...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 1 /nobreak >nul

echo [2/4] Baixando codigo mais recente do GitHub...
git fetch origin claude/sales-goals-dashboard-yagpc
if errorlevel 1 (
  echo.
  echo ERRO: Falha ao baixar do GitHub. Verifique sua conexao.
  pause
  exit /b 1
)

echo [3/4] Aplicando codigo novo (descartando alteracoes locais)...
git reset --hard origin/claude/sales-goals-dashboard-yagpc
if errorlevel 1 (
  echo.
  echo ERRO: Falha ao aplicar codigo. Verifique se esta na pasta certa.
  pause
  exit /b 1
)

echo [4/4] Instalando dependencias (se necessario)...
call npm install --silent

echo.
echo ============================================================
echo  Atualizacao concluida!
echo ============================================================
echo.
echo Conteudo de public/ (deve ter apenas dashboard.html):
dir /b public
echo.
echo ============================================================
echo Pressione qualquer tecla para INICIAR O SERVIDOR...
pause >nul

call npm start
