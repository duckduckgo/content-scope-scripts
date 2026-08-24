#!/usr/bin/env bash
set -euo pipefail

# Cursor's afterFileEdit bash hook hangs on Windows (leaves dead terminals).
# Keep formatting for macOS/Linux; no-op immediately on Win32/Git Bash.
if [[ "${OS:-}" == "Windows_NT" ]] || [[ "$(uname -s 2>/dev/null || true)" =~ ^(MINGW|MSYS|CYGWIN) ]]; then
    exit 0
fi

payload="$(cat)"

if [[ -z "$payload" ]]; then
    exit 0
fi

file_path="$(jq -r '.file_path // .tool_input.file_path // empty' <<< "$payload" 2>/dev/null || true)"

if [[ -z "$file_path" ]]; then
    exit 0
fi

repo_root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
ignore_path="$repo_root/.prettierignore"

if [[ "$file_path" != /* ]]; then
    file_path="$repo_root/$file_path"
fi

if [[ ! -f "$file_path" ]]; then
    exit 0
fi

prettier_target="$file_path"
if [[ "$file_path" == "$repo_root/"* ]]; then
    prettier_target="${file_path#"$repo_root"/}"
fi

if ! (
    cd "$repo_root"
    npx --no-install prettier --ignore-path "$ignore_path" --ignore-unknown --write "$prettier_target"
) >/dev/null 2>&1; then
    exit 0
fi
