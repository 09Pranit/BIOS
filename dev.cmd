@echo off
setlocal
cd /d "%~dp0"
if exist ".tools\node\node.exe" (
  ".tools\node\node.exe" "scripts\run-local.cjs" ".tools\node\node_modules\npm\bin\npm-cli.js" run dev
) else (
  npm run dev
)
