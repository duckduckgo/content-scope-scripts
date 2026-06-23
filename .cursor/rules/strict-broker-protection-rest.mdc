---
description: "Subagent task: Fix strict TypeScript errors in remaining broker-protection files and add to CORE_FILES"
globs:
  - "scripts/check-strict-core.js"
  - "injected/src/features/broker-protection.js"
  - "injected/src/features/broker-protection/captcha-services/captcha.service.js"
  - "injected/src/features/broker-protection/captcha-services/providers/cloudflare-turnstile.js"
  - "injected/src/features/broker-protection/comparisons/address.js"
  - "injected/src/features/broker-protection/comparisons/is-same-age.js"
  - "injected/src/features/broker-protection/execute.js"
  - "injected/src/features/broker-protection/extractors/address.js"
  - "injected/src/features/broker-protection/utils/utils.js"
---

# Strict TypeScript: Broker Protection (Rest)

## Task

Fix all strict-mode TypeScript errors in 8 remaining broker-protection files and add them to `CORE_FILES`.

## Branch

```
git checkout main && git pull origin main && git checkout -b cursor/strict/broker-protection-rest
```

## Files (22 errors total)

### `injected/src/features/broker-protection.js` (3 errors)
```
(44,66): error TS18046: 'e' is of type 'unknown'.
(80,20): error TS7006: Parameter 'action' implicitly has an 'any' type.
(121,43): error TS7006: Parameter 'x' implicitly has an 'any' type.
```

### `injected/src/features/broker-protection/captcha-services/captcha.service.js` (1 error)
```
(80,26): error TS2345: Argument of type 'string | PirError' is not assignable to parameter of type 'object'.
```

### `injected/src/features/broker-protection/captcha-services/providers/cloudflare-turnstile.js` (4 errors)
```
(74,30): error TS2345: Argument of type 'string | PirError' is not assignable to parameter of type 'object'.
(82,30): error TS2345: Argument of type 'HTMLElement | PirError | null' is not assignable to parameter of type 'object'.
(111,30): error TS2345: Argument of type 'string | PirError' is not assignable to parameter of type 'object'.
(122,24): error TS7015: Element implicitly has an 'any' type because index expression is not of type 'number'.
```

### `injected/src/features/broker-protection/comparisons/address.js` (2 errors)
```
(17,42): error TS7006: Parameter 'stateAbbreviation' implicitly has an 'any' type.
(24,12): error TS7053: Element implicitly has an 'any' type because expression of type 'any' can't be used to index type (US state map).
```

### `injected/src/features/broker-protection/comparisons/is-same-age.js` (2 errors)
```
(6,27): error TS7006: Parameter 'userAge' implicitly has an 'any' type.
(6,36): error TS7006: Parameter 'ageFound' implicitly has an 'any' type.
```

### `injected/src/features/broker-protection/execute.js` (1 error)
```
(43,46): error TS18046: 'e' is of type 'unknown'.
```

### `injected/src/features/broker-protection/extractors/address.js` (1 error)
```
(4,26): error TS7016: Could not find a declaration file for module 'parse-address'.
```

### `injected/src/features/broker-protection/utils/utils.js` (8 errors)
```
(101,40): error TS7006: Parameter 'selector' implicitly has an 'any' type.
(116,37): error TS7006: Parameter 'selector' implicitly has an 'any' type.
(132,42): error TS7006: Parameter 'selector' implicitly has an 'any' type.
(151,45): error TS7006: Parameter 'selector' implicitly has an 'any' type.
(239,13): error TS2314: Generic type 'Array<T>' requires 1 type argument(s).
(242,28): error TS7006: Parameter 'a' implicitly has an 'any' type.
(242,31): error TS7006: Parameter 'b' implicitly has an 'any' type.
(256,34): error TS7006: Parameter 'profile' implicitly has an 'any' type.
```

## Fix Patterns

- **TS7006** (Parameter implicitly any): Add `@param {Type}` JSDoc.
- **TS18046** ('e' is unknown): Use `error instanceof Error ? error.message : String(error)` pattern.
- **TS2345** (Argument not assignable): Narrow types with guards or adjust the function signature upstream.
- **TS7016** (No declaration file for module): Add `// @ts-ignore` only as last resort, or create a minimal `.d.ts` declaration in the project. Better: use `/** @type {import('parse-address')} */` if types exist, or `/** @type {Record<string, Function>} */` for the default import.
- **TS2314** (Generic requires type args): Change `Array` → `Array<string>` or appropriate type.
- **TS7053/TS7015** (No index signature): Cast with `Record<string, X>` or narrow the index.

## Workflow

1. `npm ci`
2. Add all 8 files to CORE_FILES in `scripts/check-strict-core.js`
3. Fix each file's errors
4. `npm run tsc-strict-core` — must pass
5. `npm run test-unit` — must pass
6. `npm run lint` — must pass (run `npm run lint-fix` first if needed)
7. Commit: `fix(types): add strict checking for broker-protection files`
8. `git push -u origin cursor/strict/broker-protection-rest`

## Constraints

- Do NOT use `any` — use `unknown`, specific types, or proper interfaces
- Do NOT use `@ts-ignore` or `@ts-expect-error` (except for the `parse-address` module if no types exist)
- Do NOT modify files outside the assigned list (except `scripts/check-strict-core.js`)
- Do NOT remove existing CORE_FILES entries
- Preserve existing behavior — type fixes only, no logic changes
