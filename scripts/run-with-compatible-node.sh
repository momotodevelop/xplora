#!/usr/bin/env bash

set -euo pipefail

if node -e 'const [major, minor] = process.versions.node.split(".").map(Number); process.exit(major === 22 && minor >= 12 ? 0 : 1)'; then
  exec node "$@"
fi

if command -v fnm >/dev/null 2>&1; then
  exec fnm exec --using=.node-version node "$@"
fi

echo "Este proyecto requiere Node.js 22.12 o posterior dentro de la versión 22." >&2
echo "Instala la versión indicada en .node-version o actívala con tu gestor de versiones." >&2
exit 1
