---
description: "Subagent task: Fix strict TypeScript errors in broker-protection action files and add to CORE_FILES"
globs:
  - "scripts/check-strict-core.js"
  - "injected/src/features/broker-protection/actions/build-url.js"
  - "injected/src/features/broker-protection/actions/build-url-transforms.js"
  - "injected/src/features/broker-protection/actions/captcha-callback.js"
  - "injected/src/features/broker-protection/actions/captcha-deprecated.js"
  - "injected/src/features/broker-protection/actions/click.js"
  - "injected/src/features/broker-protection/actions/extract.js"
  - "injected/src/features/broker-protection/actions/fill-form.js"
---

# Strict TypeScript: Broker Protection Actions

## Task

Fix all strict-mode TypeScript errors in 7 broker-protection action files and add them to `CORE_FILES`.

## Branch

```
git checkout main && git pull origin main && git checkout -b cursor/strict/broker-protection-actions
```

## Files (39 errors total)

### `injected/src/features/broker-protection/actions/build-url.js` (3 errors)
```
(11,26): error TS7006: Parameter 'action' implicitly has an 'any' type.
(27,37): error TS7006: Parameter 'action' implicitly has an 'any' type.
(27,45): error TS7006: Parameter 'userData' implicitly has an 'any' type.
```

### `injected/src/features/broker-protection/actions/build-url-transforms.js` (5 errors)
```
(68,52): error TS7006: Parameter 'range' implicitly has an 'any' type.
(149,41): error TS2345: Argument of type 'string | number | undefined' is not assignable to parameter of type 'string | number'.
(168,50): error TS2345: Argument of type 'string | undefined' is not assignable to parameter of type 'string'.
(177,21): error TS7006: Parameter 's' implicitly has an 'any' type.
(179,41): error TS7006: Parameter 'word' implicitly has an 'any' type.
```

### `injected/src/features/broker-protection/actions/captcha-callback.js` (12 errors)
```
(13,16): error TS2532: Object is possibly 'undefined'.
(13,27): error TS2339: Property 'function' does not exist on type '{ id: string; version: string; }'.
(15,13): error TS2532: Object is possibly 'undefined'.
(15,24): error TS2339: Property 'function' does not exist on type '{ id: string; version: string; }'.
(16,54): error TS2532: Object is possibly 'undefined'.
(16,65): error TS2339: Property 'callback' does not exist on type '{ id: string; version: string; }'.
(50,26): error TS2339: Property 'pageurl' does not exist on type '{ id: string; version: string; }'.
(56,26): error TS2339: Property 'sitekey' does not exist on type '{ id: string; version: string; }'.
(60,30): error TS2339: Property 'callback' does not exist on type '{ id: string; version: string; }'.
(61,30): error TS2339: Property 'function' does not exist on type '{ id: string; version: string; }'.
(63,30): error TS2339: Property 'function' does not exist on type '{ id: string; version: string; }'.
(64,30): error TS2339: Property 'callback' does not exist on type '{ id: string; version: string; }'.
```

### `injected/src/features/broker-protection/actions/captcha-deprecated.js` (1 error)
```
(95,30): error TS7006: Parameter 'action' implicitly has an 'any' type.
```

### `injected/src/features/broker-protection/actions/click.js` (6 errors)
```
(48,102): error TS18046: 'error' is of type 'unknown'.
(69,31): error TS18048: 'elem' is possibly 'undefined'.
(74,28): error TS18048: 'elem' is possibly 'undefined'.
(196,63): error TS18046: 'error' is of type 'unknown'.
(203,79): error TS18046: 'error' is of type 'unknown'.
(211,72): error TS18046: 'error' is of type 'unknown'.
```

### `injected/src/features/broker-protection/actions/extract.js` (9 errors)
```
(94,37): error TS7006: Parameter '_' implicitly has an 'any' type.
(94,40): error TS7006: Parameter 'value' implicitly has an 'any' type.
(141,13): error TS7053: Element implicitly has an 'any' type because expression of type 'string' can't be used to index type '{}'.
(156,13): error TS7053: Element implicitly has an 'any' type because expression of type 'string' can't be used to index type '{}'.
(173,28): error TS7053: Element implicitly has an 'any' type because expression of type 'string' can't be used to index type '{ profileUrl: ... }'.
(177,28): error TS7053: Element implicitly has an 'any' type because expression of type 'string' can't be used to index type '{ profileUrl: ... }'.
(205,11): error TS7034: Variable 'matchedFields' implicitly has type 'any[]'.
(211,18): error TS7005: Variable 'matchedFields' implicitly has an 'any[]' type.
(376,27): error TS7006: Parameter 'link' implicitly has an 'any' type.
```

### `injected/src/features/broker-protection/actions/fill-form.js` (3 errors)
```
(111,31): error TS7053: Element implicitly has an 'any' type because expression of type 'any' can't be used to index type (US state map).
(232,25): error TS7006: Parameter 'element' implicitly has an 'any' type.
(258,40): error TS18046: 'e' is of type 'unknown'.
```

## Fix Patterns

- **TS7006** (Parameter implicitly any): Add `@param {Type}` JSDoc annotations. Look at how the param is used and what calling code passes.
- **TS2339** (Property doesn't exist): The type `{ id: string; version: string; }` in captcha-callback.js is too narrow — find the actual type definition or extend it with the missing properties via `@typedef`.
- **TS2532/TS18048** (Possibly undefined): Add null checks before accessing.
- **TS18046** ('error' is unknown): Cast or check `error instanceof Error` before accessing `.message`.
- **TS7053** (No index signature): Use `Record<string, X>` casts or narrow index types.
- **TS7034/TS7005** (Variable implicitly any): Add explicit type annotations at declaration.
- **TS2345** (Argument not assignable): Add null/undefined guards or narrow types.

## Workflow

1. `npm ci`
2. Add all 7 files to CORE_FILES in `scripts/check-strict-core.js`
3. Fix each file's errors using JSDoc type annotations
4. `npm run tsc-strict-core` — must pass
5. `npm run test-unit` — must pass
6. `npm run lint` — must pass (run `npm run lint-fix` first if needed)
7. Commit: `fix(types): add strict checking for broker-protection action files`
8. `git push -u origin cursor/strict/broker-protection-actions`

## Constraints

- Do NOT use `any` — use `unknown`, specific types, or proper interfaces
- Do NOT use `@ts-ignore` or `@ts-expect-error`
- Do NOT modify files outside the assigned list (except `scripts/check-strict-core.js`)
- Do NOT remove existing CORE_FILES entries
- Preserve existing behavior — type fixes only, no logic changes
