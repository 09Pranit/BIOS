#!/usr/bin/env sh
set -eu
cd -P "$(dirname "$0")"
command -v node >/dev/null 2>&1 || { echo 'Install Node.js 24 or later first.'; exit 1; }
command -v npm >/dev/null 2>&1 || { echo 'Install the standard Node.js distribution, including npm.'; exit 1; }
node -e 'if (Number(process.versions.node.split(".")[0]) < 24) { console.error("Install Node.js 24 or later first."); process.exit(1); }'
if [ ! -d node_modules ]; then npm ci; fi
if [ ! -f dist/index.html ]; then npm run build; fi
if [ "${1:-}" = '--lan' ]; then exec npm run start:lan; else exec npm start; fi
