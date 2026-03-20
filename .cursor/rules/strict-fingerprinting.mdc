---
description: "Subagent task: Fix strict TypeScript errors in fingerprinting files and add to CORE_FILES"
globs:
  - "scripts/check-strict-core.js"
  - "injected/src/features/fingerprinting-audio.js"
  - "injected/src/features/fingerprinting-battery.js"
  - "injected/src/features/fingerprinting-canvas.js"
  - "injected/src/features/fingerprinting-screen-size.js"
  - "injected/src/features/fingerprinting-temporary-storage.js"
---

# Strict TypeScript: Fingerprinting

## Task

Fix all strict-mode TypeScript errors in 5 fingerprinting files and add them to `CORE_FILES`.

## Branch

```
git checkout main && git pull origin main && git checkout -b cursor/strict/fingerprinting
```

## Files (26 errors total)

### `injected/src/features/fingerprinting-audio.js` (10 errors)
```
(6,10): error TS7006: Parameter 'args' implicitly has an 'any' type.
(11,37): error TS7006: Parameter 'channelData' implicitly has an 'any' type.
(11,50): error TS7006: Parameter 'domainKey' implicitly has an 'any' type.
(11,61): error TS7006: Parameter 'sessionKey' implicitly has an 'any' type.
(11,73): error TS7006: Parameter 'thisArg' implicitly has an 'any' type.
(69,36): error TS7006: Parameter 'thisArg' implicitly has an 'any' type.
(69,45): error TS7006: Parameter 'args' implicitly has an 'any' type.
(80,27): error TS7006: Parameter 'thisArg' implicitly has an 'any' type.
(80,36): error TS7006: Parameter 'args' implicitly has an 'any' type.
(80,42): error TS7006: Parameter 'audioKey' implicitly has an 'any' type.
```

### `injected/src/features/fingerprinting-battery.js` (1 error)
```
(12,47): error TS7017: Element implicitly has an 'any' type because type 'typeof globalThis' has no index signature.
```

### `injected/src/features/fingerprinting-canvas.js` (1 error)
```
(6,10): error TS7006: Parameter 'args' implicitly has an 'any' type.
```

### `injected/src/features/fingerprinting-screen-size.js` (10 errors)
```
(19,33): error TS2339: Property 'availWidth' does not exist on type '{}'.
(25,33): error TS2339: Property 'availHeight' does not exist on type '{}'.
(31,33): error TS2339: Property 'colorDepth' does not exist on type '{}'.
(36,33): error TS2339: Property 'pixelDepth' does not exist on type '{}'.
(53,30): error TS7006: Parameter 'value' implicitly has an 'any' type.
(53,37): error TS7006: Parameter 'targetDimension' implicitly has an 'any' type.
(63,28): error TS7006: Parameter 'property' implicitly has an 'any' type.
(63,38): error TS7006: Parameter 'value' implicitly has an 'any' type.
(89,56): error TS2339: Property 'availTop' does not exist on type '{}'.
(110,56): error TS2339: Property 'availLeft' does not exist on type '{}'.
```

### `injected/src/features/fingerprinting-temporary-storage.js` (4 errors)
```
(20,75): error TS7006: Parameter 'callback' implicitly has an 'any' type.
(20,85): error TS7006: Parameter 'err' implicitly has an 'any' type.
(21,56): error TS7006: Parameter 'usedBytes' implicitly has an 'any' type.
(21,67): error TS7006: Parameter 'grantedBytes' implicitly has an 'any' type.
```

## Fix Patterns

- **TS7006** (Parameter implicitly any): Most are `args` params for `init()` or wrapper functions. Add `@param` JSDoc. For `args`, look at how `ContentFeature.init(args)` is called — likely `Record<string, unknown>` or a specific config type.
- **TS7017** (globalThis index): Use `/** @type {Record<string, unknown>} */ (globalThis)` or access through a typed helper.
- **TS2339** (Property on `{}`): The config object is typed as `{}` but has screen properties. Define a `@typedef` for the screen config shape with `availWidth`, `availHeight`, `colorDepth`, `pixelDepth`, `availTop`, `availLeft`.

## Workflow

1. `npm ci`
2. Add all 5 files to CORE_FILES in `scripts/check-strict-core.js`
3. Fix each file's errors
4. `npm run tsc-strict-core` — must pass
5. `npm run test-unit` — must pass
6. `npm run lint` — must pass (run `npm run lint-fix` first if needed)
7. Commit: `fix(types): add strict checking for fingerprinting files`
8. `git push -u origin cursor/strict/fingerprinting`

## Constraints

- Do NOT use `any` — use `unknown`, specific types, or proper interfaces
- Do NOT use `@ts-ignore` or `@ts-expect-error`
- Do NOT modify files outside the assigned list (except `scripts/check-strict-core.js`)
- Do NOT remove existing CORE_FILES entries
- Preserve existing behavior — type fixes only, no logic changes
