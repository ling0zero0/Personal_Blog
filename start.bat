@echo off
setlocal
cd /d "%~dp0"

set "PORT=4321"

if not exist "node_modules\astro\bin\astro.mjs" (
  echo Dependencies are missing. Run npm install first.
  pause
  exit /b 1
)

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found in PATH.
  pause
  exit /b 1
)

echo Starting Personal Blog at http://127.0.0.1:%PORT%/zh/
node "node_modules\astro\bin\astro.mjs" dev --background --host 127.0.0.1 --port %PORT%
if errorlevel 1 (
  echo.
  echo Startup failed. Review the message above.
  pause
  exit /b 1
)

echo Opening the site in your browser.
if /I not "%NO_BROWSER%"=="1" start "" "http://127.0.0.1:%PORT%/zh/"
endlocal
