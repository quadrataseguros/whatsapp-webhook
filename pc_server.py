#!/usr/bin/env python3
"""
PC Remote Control Server - Controlado via Claude
Execute: python pc_server.py
Requer: pip install flask flask-cors pyautogui psutil
"""

import subprocess
import os
import sys
import json
import threading
import time
import base64
import io
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS

try:
    import pyautogui
    import psutil
    HAS_GUI = True
except ImportError:
    HAS_GUI = False
    print("[AVISO] pyautogui/psutil nao encontrado. Instale com: pip install pyautogui psutil flask flask-cors")

app = Flask(__name__)
CORS(app)

SECRET_TOKEN = "meu-token-secreto-123"  # MUDE ISSO!

PAINEL_HTML = os.path.join(os.path.dirname(os.path.abspath(__file__)), "painel.html")

def verificar_token(req):
    token = req.headers.get("X-Token") or req.args.get("token")
    return token == SECRET_TOKEN

# ── PAINEL ───────────────────────────────────────────────────────────────────
@app.route("/")
@app.route("/painel")
def painel():
    if os.path.exists(PAINEL_HTML):
        return send_file(PAINEL_HTML)
    return "<h2>painel.html nao encontrado na mesma pasta que pc_server.py</h2>", 404

# ── STATUS ──────────────────────────────────────────────────────────────────
@app.route("/status")
def status():
    if not verificar_token(request):
        return jsonify({"erro": "Token invalido"}), 401
    info = {"online": True, "plataforma": sys.platform}
    if HAS_GUI:
        info["cpu"] = psutil.cpu_percent(interval=0.5)
        info["ram_total"] = round(psutil.virtual_memory().total / 1e9, 1)
        info["ram_usado"] = round(psutil.virtual_memory().used / 1e9, 1)
        info["ram_pct"] = psutil.virtual_memory().percent
    return jsonify(info)

# ── EXECUTAR COMANDO ─────────────────────────────────────────────────────────
@app.route("/cmd", methods=["POST"])
def executar_cmd():
    if not verificar_token(request):
        return jsonify({"erro": "Token invalido"}), 401
    dados = request.json or {}
    comando = dados.get("comando", "").strip()
    if not comando:
        return jsonify({"erro": "Comando vazio"}), 400
    try:
        resultado = subprocess.run(
            comando, shell=True, capture_output=True, text=True, timeout=15
        )
        return jsonify({
            "saida": resultado.stdout[-3000:] if resultado.stdout else "",
            "erro_saida": resultado.stderr[-1000:] if resultado.stderr else "",
            "codigo": resultado.returncode
        })
    except subprocess.TimeoutExpired:
        return jsonify({"erro": "Timeout (15s)"}), 408
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

# ── ABRIR APLICATIVO ─────────────────────────────────────────────────────────
@app.route("/abrir", methods=["POST"])
def abrir_app():
    if not verificar_token(request):
        return jsonify({"erro": "Token invalido"}), 401
    dados = request.json or {}
    app_nome = dados.get("app", "").strip()
    apps_conhecidos = {
        "notepad": "notepad.exe",
        "calc": "calc.exe",
        "explorer": "explorer.exe",
        "chrome": "start chrome",
        "firefox": "start firefox",
        "edge": "start msedge",
        "spotify": "start spotify",
        "vscode": "code",
        "code": "code",
        "terminal": "start cmd",
        "powershell": "start powershell",
        "paint": "mspaint.exe",
        "mspaint": "mspaint.exe",
        "word": "start winword",
        "excel": "start excel",
        "whatsapp": "start whatsapp",
    }
    cmd = apps_conhecidos.get(app_nome.lower(), f"start {app_nome}")
    try:
        subprocess.Popen(cmd, shell=True)
        return jsonify({"ok": True, "mensagem": f"Abrindo: {app_nome}"})
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

# ── PROCESSOS ────────────────────────────────────────────────────────────────
@app.route("/processos")
def listar_processos():
    if not verificar_token(request):
        return jsonify({"erro": "Token invalido"}), 401
    if not HAS_GUI:
        return jsonify({"erro": "psutil nao instalado"}), 500
    procs = []
    for p in psutil.process_iter(["pid", "name", "cpu_percent", "memory_percent"]):
        try:
            info = p.info
            if info["cpu_percent"] is not None:
                procs.append(info)
        except Exception:
            pass
    procs.sort(key=lambda x: x.get("cpu_percent", 0), reverse=True)
    return jsonify({"processos": procs[:20]})

# ── MOUSE ────────────────────────────────────────────────────────────────────
@app.route("/mouse", methods=["POST"])
def mover_mouse():
    if not verificar_token(request):
        return jsonify({"erro": "Token invalido"}), 401
    if not HAS_GUI:
        return jsonify({"erro": "pyautogui nao instalado"}), 500
    dados = request.json or {}
    acao = dados.get("acao", "mover")
    try:
        if acao == "mover":
            x = dados.get("x", 0)
            y = dados.get("y", 0)
            pyautogui.moveTo(x, y, duration=0.2)
        elif acao == "mover_relativo":
            dx = dados.get("dx", 0)
            dy = dados.get("dy", 0)
            pyautogui.moveRel(dx, dy, duration=0)
        elif acao == "clicar":
            x = dados.get("x")
            y = dados.get("y")
            if x is not None and y is not None:
                pyautogui.click(x, y)
            else:
                pyautogui.click()
        elif acao == "duplo_clique":
            x = dados.get("x")
            y = dados.get("y")
            if x is not None and y is not None:
                pyautogui.doubleClick(x, y)
            else:
                pyautogui.doubleClick()
        elif acao == "rolar":
            pyautogui.scroll(dados.get("quantidade", 3))
        return jsonify({"ok": True})
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

# ── TECLADO ──────────────────────────────────────────────────────────────────
@app.route("/tecla", methods=["POST"])
def pressionar_tecla():
    if not verificar_token(request):
        return jsonify({"erro": "Token invalido"}), 401
    if not HAS_GUI:
        return jsonify({"erro": "pyautogui nao instalado"}), 500
    dados = request.json or {}
    acao = dados.get("acao", "tecla")
    try:
        if acao == "escrever":
            pyautogui.write(dados.get("texto", ""), interval=0.05)
        elif acao == "tecla":
            pyautogui.press(dados.get("tecla", ""))
        elif acao == "atalho":
            teclas = dados.get("teclas", [])
            pyautogui.hotkey(*teclas)
        return jsonify({"ok": True})
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

# ── VOLUME ───────────────────────────────────────────────────────────────────
@app.route("/volume", methods=["POST"])
def controlar_volume():
    if not verificar_token(request):
        return jsonify({"erro": "Token invalido"}), 401
    dados = request.json or {}
    acao = dados.get("acao", "")
    try:
        if acao == "aumentar":
            for _ in range(dados.get("passos", 5)):
                pyautogui.press("volumeup")
        elif acao == "diminuir":
            for _ in range(dados.get("passos", 5)):
                pyautogui.press("volumedown")
        elif acao == "mudo":
            pyautogui.press("volumemute")
        return jsonify({"ok": True})
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

# ── DESLIGAR / REINICIAR ─────────────────────────────────────────────────────
@app.route("/sistema", methods=["POST"])
def controle_sistema():
    if not verificar_token(request):
        return jsonify({"erro": "Token invalido"}), 401
    dados = request.json or {}
    acao = dados.get("acao", "")
    confirmacao = dados.get("confirmar", False)
    if not confirmacao:
        return jsonify({"erro": "Adicione confirmar:true para executar acao critica"}), 400
    cmds = {
        "desligar": "shutdown /s /t 30",
        "reiniciar": "shutdown /r /t 30",
        "cancelar_shutdown": "shutdown /a",
        "bloquear": "rundll32.exe user32.dll,LockWorkStation",
        "hibernar": "shutdown /h",
    }
    cmd = cmds.get(acao)
    if not cmd:
        return jsonify({"erro": f"Acao desconhecida: {acao}"}), 400
    subprocess.Popen(cmd, shell=True)
    return jsonify({"ok": True, "mensagem": f"Executando: {acao}"})

# ── CLIPBOARD ────────────────────────────────────────────────────────────────
@app.route("/clipboard", methods=["GET", "POST"])
def clipboard():
    if not verificar_token(request):
        return jsonify({"erro": "Token invalido"}), 401
    if request.method == "POST":
        dados = request.json or {}
        texto = dados.get("texto", "")
        subprocess.run(f'echo {texto}|clip', shell=True)
        return jsonify({"ok": True})
    else:
        resultado = subprocess.run("powershell Get-Clipboard", capture_output=True, text=True, shell=True)
        return jsonify({"conteudo": resultado.stdout.strip()})

# ── SCREENSHOT ───────────────────────────────────────────────────────────────
@app.route("/screenshot")
def screenshot():
    if not verificar_token(request):
        return jsonify({"erro": "Token invalido"}), 401
    if not HAS_GUI:
        return jsonify({"erro": "pyautogui nao instalado"}), 500
    try:
        img = pyautogui.screenshot()
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        b64 = base64.b64encode(buf.getvalue()).decode()
        return jsonify({"image": b64})
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

if __name__ == "__main__":
    print("=" * 60)
    print("  PC Remote Control Server")
    print("=" * 60)
    print(f"  Token: {SECRET_TOKEN}")
    print(f"  URL:   http://localhost:5050")
    print(f"  Painel: http://localhost:5050/painel")
    print()
    print("  IMPORTANTE: Mude o SECRET_TOKEN antes de usar!")
    print("  Para acesso externo, use ngrok ou cloudflared.")
    print("=" * 60)
    if not HAS_GUI:
        print()
        print("  Instale dependencias:")
        print("  pip install flask flask-cors pyautogui psutil")
        print()
    app.run(host="0.0.0.0", port=5050, debug=False)
