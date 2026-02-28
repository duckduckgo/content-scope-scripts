---
description: "Subagent task: Fix strict TypeScript errors in web-compat and web-telemetry files and add to CORE_FILES"
globs:
  - "scripts/check-strict-core.js"
  - "injected/src/features/web-compat.js"
  - "injected/src/features/web-telemetry.js"
---

# Strict TypeScript: Web Compat & Telemetry

## Task

Fix all strict-mode TypeScript errors in 2 files and add them to `CORE_FILES`.

## Branch

```
git checkout main && git pull origin main && git checkout -b cursor/strict/web-compat-and-telemetry
```

## Files (69 errors total)

### `injected/src/features/web-compat.js` (58 errors)

**Error breakdown by category:**

1. **TS7006 — Parameter implicitly any** (~25 errors):
   Lines: 28, 63(x2), 74(x3), 84, 218, 328(x2), 329(x2), 330(x2), 454, 505, 622, 656, 665, 726, 842(x4)

2. **TS2339 — Property not on type** (~10 errors):
   `name`, `supportedPermissions` on Object (lines 551-557); `title`, `artist`, `album`, `artwork` on `{}` (lines 886-889)

3. **TS7053 — No index signature** (~5 errors):
   String index on `ShareRequestData` (line 90), `{}` (lines 459, 461), viewport config (line 1146)

4. **TS7017 — globalThis no index signature** (4 errors):
   Lines 1010, 1015, 1042, 1043

5. **TS18046/TS18048 — Unknown/undefined** (3 errors):
   `err` unknown (lines 233, 748), `key` possibly undefined (line 1152)

6. **TS2345 — Argument not assignable** (4 errors):
   `string | undefined` → `string` (lines 528, 1137); `HTMLMetaElement | null | undefined` → `HTMLMetaElement | null` (lines 1097, 1100, 1156)

7. **TS7034/TS7005 — Variable implicitly any** (2 errors):
   `newContent` (lines 1144, 1156)

8. **TS7008 — Member implicitly any** (1 error):
   `onchange` (line 67)

9. **TS2314 — Generic requires type args** (2 errors):
   `Promise` without type arg (lines 1226, 1228)

10. **TS2322 — Type not assignable** (2 errors):
    viewport array type (line 1089); wrapMethod proxy type (line 1250)

11. **TS2532 — Possibly undefined** (1 error): line 1153

### `injected/src/features/web-telemetry.js` (11 errors)
```
(13,17): error TS7006: Parameter 'featureName' implicitly has an 'any' type.
(13,30): error TS7006: Parameter 'importConfig' implicitly has an 'any' type.
(13,44): error TS7006: Parameter 'features' implicitly has an 'any' type.
(13,54): error TS7006: Parameter 'args' implicitly has an 'any' type.
(34,17): error TS7006: Parameter 'video' implicitly has an 'any' type.
(60,27): error TS7006: Parameter 'video' implicitly has an 'any' type.
(76,21): error TS7006: Parameter 'video' implicitly has an 'any' type.
(84,29): error TS7006: Parameter 'node' implicitly has an 'any' type.
(89,25): error TS7006: Parameter 'video' implicitly has an 'any' type.
(121,35): error TS7006: Parameter 'mutationsList' implicitly has an 'any' type.
(124,50): error TS7006: Parameter 'node' implicitly has an 'any' type.
```

## Fix Patterns

- **TS7006**: Add `@param {Type}` JSDoc. For constructor params (`featureName`, `importConfig`, `features`, `args`), look at the parent class signature.
- **TS2339 on Object**: Define `@typedef` for the config shapes (permissions, media metadata).
- **TS7017 (globalThis)**: Use `/** @type {Record<string, unknown>} */ (globalThis)` access pattern.
- **TS7053**: Use `Record<string, X>` cast or narrow the key type.
- **TS18046**: `instanceof Error` check or `String(err)`.
- **TS18048**: Null/undefined guard.
- **TS2345**: Add undefined guards or non-null assertions where value is guaranteed.
- **TS2314**: Add type parameter: `Promise<void>`.
- **TS7008**: Add `/** @type {Function|null} */` or appropriate type to class member.

## Workflow

1. `npm ci`
2. Add both files to CORE_FILES in `scripts/check-strict-core.js`
3. Fix each file's errors
4. `npm run tsc-strict-core` — must pass
5. `npm run test-unit` — must pass
6. `npm run lint` — must pass (run `npm run lint-fix` first if needed)
7. Commit: `fix(types): add strict checking for web-compat and web-telemetry files`
8. `git push -u origin cursor/strict/web-compat-and-telemetry`

## Constraints

- Do NOT use `any` — use `unknown`, specific types, or proper interfaces
- Do NOT use `@ts-ignore` or `@ts-expect-error`
- Do NOT modify files outside the assigned list (except `scripts/check-strict-core.js`)
- Do NOT remove existing CORE_FILES entries
- Preserve existing behavior — type fixes only, no logic changes
