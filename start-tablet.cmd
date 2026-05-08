@echo off
setlocal
cd /d "%~dp0"

if not exist node_modules (
  echo Installing dependencies...
  call npm.cmd install
  if errorlevel 1 (
    echo Dependency installation failed. Please check your network and npm setup.
    pause
    exit /b 1
  )
)

echo Building NeuroNotes for tablet...
call npm.cmd run build
if errorlevel 1 (
  echo Build failed. Please check the error above.
  pause
  exit /b 1
)

echo.
echo Starting backend API on port 8787...
start "NeuroNotes API" cmd /k "cd /d %~dp0 && set HOST=0.0.0.0&& npm.cmd run dev:api"

echo Starting tablet web app on port 4173...
start "NeuroNotes Tablet Web" cmd /k "cd /d %~dp0 && npm.cmd run preview:tablet -- --port 4173"

echo.
echo Open this app on your tablet with:
echo   http://YOUR_COMPUTER_IP:4173
echo.
echo Your computer IPv4 addresses:
ipconfig | findstr /R /C:"IPv4"
echo.
echo Keep both opened command windows running while using the tablet.
pause
