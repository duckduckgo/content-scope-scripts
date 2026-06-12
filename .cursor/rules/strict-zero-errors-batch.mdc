---
description: "Subagent task: Add 16 zero-error files to CORE_FILES for strict TypeScript checking"
globs:
  - "scripts/check-strict-core.js"
  - "injected/src/features/click-to-load/ctl-config.js"
  - "injected/src/features/context-menu.js"
  - "injected/src/features/duckplayer-native/error-detection.js"
  - "injected/src/features/duckplayer-native/sub-feature.js"
  - "injected/src/features/page-observer.js"
  - "injected/src/features/web-detection/matching.js"
  - "injected/src/features/web-detection/parse.js"
  - "injected/src/features/web-interference-detection.js"
  - "injected/src/navigator-global.js"
  - "injected/src/types/context-menu.ts"
  - "injected/src/types/favicon.ts"
  - "injected/src/types/hover.ts"
  - "injected/src/types/page-observer.ts"
  - "injected/src/types/print.ts"
  - "injected/src/types/web-compat.ts"
  - "injected/src/utils/dom-metadata.js"
---

# Strict TypeScript: Zero-Error Batch

## Task

Add 16 files that already have zero strict-mode errors to `CORE_FILES` in `scripts/check-strict-core.js`. These files already pass `tsc --strict` with `noUncheckedIndexedAccess` — they just need to be registered.

## Branch

```
git checkout main && git pull origin main && git checkout -b cursor/strict/zero-errors-batch
```

## Files to Add to CORE_FILES

Add these entries to the `CORE_FILES` Set in `scripts/check-strict-core.js`, maintaining alphabetical order within each directory group:

```
injected/src/features/click-to-load/ctl-config.js
injected/src/features/context-menu.js
injected/src/features/duckplayer-native/error-detection.js
injected/src/features/duckplayer-native/sub-feature.js
injected/src/features/page-observer.js
injected/src/features/web-detection/matching.js
injected/src/features/web-detection/parse.js
injected/src/features/web-interference-detection.js
injected/src/navigator-global.js
injected/src/types/context-menu.ts
injected/src/types/favicon.ts
injected/src/types/hover.ts
injected/src/types/page-observer.ts
injected/src/types/print.ts
injected/src/types/web-compat.ts
injected/src/utils/dom-metadata.js
```

## Expected Errors

**None.** All 16 files already compile clean under strict mode.

## Workflow

1. `npm ci`
2. Add files to CORE_FILES in `scripts/check-strict-core.js`
3. `npm run tsc-strict-core` — must print "✅ All injected core files pass strict TypeScript checking."
4. `npm run test-unit` — must pass
5. `npm run lint` — must pass (run `npm run lint-fix` first if needed)
6. Commit: `fix(types): add 16 zero-error files to strict core checking`
7. `git push -u origin cursor/strict/zero-errors-batch`

## Constraints

- Do NOT modify any source files — only `scripts/check-strict-core.js`
- Do NOT remove existing CORE_FILES entries
- Do NOT add files that are not in the list above
