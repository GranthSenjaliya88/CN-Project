@echo off
setlocal
cd /d "%~dp0netvista-arq"
echo NetVista ARQ - React and Python lab
echo Open http://127.0.0.1:5000 after the server starts.
echo Keep this window open. Press Ctrl+C to stop.
python backend/app.py
pause
