@echo off
echo Arret de PodiaStream (ports 3000 et 8000)...

for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%p >nul 2>&1
)
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":8000" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%p >nul 2>&1
)

echo Termine.
ping -n 3 127.0.0.1 >nul
