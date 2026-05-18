@echo off
setlocal
set "ROOT=%~dp0"
if "%ROOT:~-1%"=="\" set "ROOT=%ROOT:~0,-1%"

echo Demarrage du backend Django (port 8000)...
cscript //nologo "%ROOT%\run_hidden.vbs" "%ROOT%\backend\venv\Scripts\python.exe manage.py runserver 8000" "%ROOT%\backend"

echo Demarrage du frontend Next.js (port 3000)...
cscript //nologo "%ROOT%\run_hidden.vbs" "cmd /c npm run dev" "%ROOT%\frontend"

echo.
echo PodiaStream demarre en arriere-plan (aucune fenetre ne restera ouverte).
echo   Backend  : http://localhost:8000
echo   Frontend : http://localhost:3000
echo.
echo Pour arreter les deux serveurs, executez stop.bat
ping -n 4 127.0.0.1 >nul
