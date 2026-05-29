#!/usr/bin/env bash
# Package the extension into a load-unpacked-ready zip for distribution.
# Output: dist/anw-curator-v<version>.zip  (dist/ is gitignored)
set -euo pipefail

cd "$(dirname "$0")"

VERSION=$(python3 -c "import json; print(json.load(open('manifest.json'))['version'])")
OUT="dist/anw-curator-v${VERSION}.zip"

mkdir -p dist
rm -f "$OUT"

# Ship only what the extension needs at runtime. Exclude tooling/docs/dotfiles.
zip -r "$OUT" . \
  -x "build.sh" \
  -x "README.md" \
  -x "dist/*" \
  -x ".*" \
  -x "*/.*"

echo "Built $OUT"
