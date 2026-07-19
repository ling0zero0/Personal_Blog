@echo off
setlocal
cd /d "%~dp0"

if not exist "node_modules\astro\bin\astro.mjs" (
  echo Dependencies are missing. The server cannot be managed.
  pause
  exit /b 1
)

echo Stopping Personal Blog...
node "node_modules\astro\bin\astro.mjs" dev stop
if errorlevel 1 (
  echo.
  echo Shutdown failed. Review the message above.
  pause
  exit /b 1
)

endlocal
