#!/usr/bin/env bash
# Dumps all source files into a single file for review.
# Safe to re-run — always overwrites the output.

OUT="code-dump.txt"
ROOT="$(cd "$(dirname "$0")" && pwd)"

> "$ROOT/$OUT"

dump_file() {
  local file="$1"
  local rel="${file#$ROOT/}"
  echo "// ============================================================" >> "$ROOT/$OUT"
  echo "// FILE: $rel" >> "$ROOT/$OUT"
  echo "// ============================================================" >> "$ROOT/$OUT"
  cat "$file" >> "$ROOT/$OUT"
  echo -e "\n" >> "$ROOT/$OUT"
}

# TypeScript source and tests
find "$ROOT/src" "$ROOT/test" -name "*.ts" | sort | while read -r file; do
  dump_file "$file"
done

# Config and infrastructure files
for file in \
  "$ROOT/nest-cli.json" \
  "$ROOT/docker-compose.yml" \
  "$ROOT/.env.example" \
  "$ROOT/README.md"; do
  [ -f "$file" ] && dump_file "$file"
done

echo "Written to $ROOT/$OUT"
