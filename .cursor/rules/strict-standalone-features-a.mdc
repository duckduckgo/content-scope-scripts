---
description: "Subagent task: Fix strict TypeScript errors in standalone feature files (batch A) and add to CORE_FILES"
globs:
  - "scripts/check-strict-core.js"
  - "injected/src/features/api-manipulation.js"
  - "injected/src/features/autofill-import.js"
  - "injected/src/features/breakage-reporting.js"
  - "injected/src/features/breakage-reporting/utils.js"
  - "injected/src/features/cookie.js"
  - "injected/src/features/harmful-apis.js"
  - "injected/src/features/windows-permission-usage.js"
---

# Strict TypeScript: Standalone Features A

## Task

Fix all strict-mode TypeScript errors in 7 standalone feature files and add them to `CORE_FILES`.

## Branch

```
git checkout main && git pull origin main && git checkout -b cursor/strict/standalone-features-a
```

## Files (108 errors total)

### `injected/src/features/api-manipulation.js` (8 errors)
```
(101,24): error TS7053: Element implicitly has an 'any' type (string index on {}).
(119,28): error TS2339: Property 'enumerable' does not exist on type '{ get: () => any; }'.
(122,28): error TS2339: Property 'configurable' does not exist on type '{ get: () => any; }'.
(129,51): error TS2339: Property 'enumerable' does not exist on type '{ get: () => any; }'.
(129,96): error TS2339: Property 'enumerable' does not exist on type '{ get: () => any; }'.
(130,53): error TS2339: Property 'configurable' does not exist on type '{ get: () => any; }'.
(130,100): error TS2339: Property 'configurable' does not exist on type '{ get: () => any; }'.
(153,23): error TS7015: Element implicitly has an 'any' type because index expression is not of type 'number'.
```

### `injected/src/features/autofill-import.js` (23 errors)
```
(39,5): TS7008: Member '#exportButtonSettings' implicitly has an 'any' type.
(41,5): TS7008: Member '#settingsButtonSettings' implicitly has an 'any' type.
(43,5): TS7008: Member '#signInButtonSettings' implicitly has an 'any' type.
(45,5): TS7008: Member '#exportConfirmButtonSettings' implicitly has an 'any' type.
(48,5): TS2564: Property '#elementToCenterOn' has no initializer.
(51,5): TS2564: Property '#currentOverlay' has no initializer.
(54,5): TS2564: Property '#currentElementConfig' has no initializer.
(56,5): TS7008: Member '#domLoaded' implicitly has an 'any' type.
(58,5): TS7008: Member '#processingBookmark' implicitly has an 'any' type.
(144,24): TS7006: Parameter 'fn' implicitly has an 'any' type.
(387,20): TS7006: Parameter 'element' implicitly has an 'any' type.
(469,37): TS7006: Parameter 'pathname' implicitly has an 'any' type.
(561,60): TS7006: Parameter 'text' implicitly has an 'any' type.
(568,60): TS7006: Parameter 'text' implicitly has an 'any' type.
(582,62): TS7006: Parameter 'text' implicitly has an 'any' type.
(636,20): TS7006: Parameter '_' implicitly has an 'any' type.
(644,31): TS7006: Parameter 'name' implicitly has an 'any' type.
(644,37): TS7006: Parameter 'data' implicitly has an 'any' type.
(645,20): TS7017: Element implicitly has an 'any' type (globalThis).
(653,36): TS7006: Parameter 'action' implicitly has an 'any' type.
(660,36): TS7006: Parameter 'pathname' implicitly has an 'any' type.
(685,50): TS2769: No overload matches this call.
(688,16): TS18048: 'exportPanel' is possibly 'undefined'.
```

### `injected/src/features/breakage-reporting.js` (8 errors)
```
(26,24): TS2339: Property 'opener' does not exist on type '{ jsPerformance: number[]; referrer: string; }'.
(30,24): TS2339: Property 'pageReloaded' does not exist on type.
(46,24): TS2339: Property 'detectorData' does not exist on type.
(57,28): TS2339: Property 'expandedPerformanceMetrics' does not exist on type.
(61,24): TS2339: Property 'detectorData' does not exist on type.
(62,59): TS2339: Property 'detectorData' does not exist on type.
(66,28): TS2339: Property 'breakageData' does not exist on type.
(69,28): TS2339: Property 'breakageData' does not exist on type.
```

### `injected/src/features/breakage-reporting/utils.js` (5 errors)
```
(48,13): TS7034: Variable 'timeoutId' implicitly has type 'any'.
(50,13): TS7034: Variable 'observer' implicitly has type 'any'.
(53,17): TS7005: Variable 'observer' implicitly has an 'any' type.
(54,17): TS7005: Variable 'timeoutId' implicitly has an 'any' type.
(147,61): TS18046: 'e' is of type 'unknown'.
```

### `injected/src/features/cookie.js` (8 errors)
```
(48,5): TS7034: Variable 'loadedPolicyResolve' implicitly has type 'any'.
(125,72): TS7006: Parameter 'exception' implicitly has an 'any' type.
(217,95): TS2532: Object is possibly 'undefined'.
(244,10): TS7006: Parameter 'args' implicitly has an 'any' type.
(263,21): TS7053: Element implicitly has an 'any' type (string index on config type).
(264,21): TS7053: Element implicitly has an 'any' type.
(264,41): TS7053: Element implicitly has an 'any' type.
(269,9): TS7005: Variable 'loadedPolicyResolve' implicitly has an 'any' type.
```

### `injected/src/features/harmful-apis.js` (29 errors)

**Error categories:**
- TS7017 (globalThis no index signature): 16 errors — lines 23, 107, 109, 126, 230, 233, 236, 272, 282, 288, 299, 311, 324, 348, 361, 364, 367
- TS2683 ('this' implicitly any): 8 errors — lines 55, 88, 92, 114, 127, 272, 275, 385
- TS7006 (param implicitly any): 2 errors — lines 136, 161
- TS7053 (string index on {}): 1 error — line 191
- TS2532 (possibly undefined): 1 error — line 388

### `injected/src/features/windows-permission-usage.js` (27 errors)

**Error categories:**
- TS7006 (param implicitly any): 19 errors — various parameter types needed
- TS7034/TS7005 (variable implicitly any): 4 errors — timer variables
- TS7017 (globalThis): 4 errors — lines 386-389

## Fix Patterns

- **TS7006/TS7008**: Add `@param` or `@type` JSDoc annotations.
- **TS2339**: Extend the type definition to include missing properties, or define proper `@typedef`.
- **TS7017 (globalThis)**: Use `/** @type {Record<string, unknown>} */ (globalThis)` or assign to typed variable.
- **TS2683 ('this' implicitly any)**: Use arrow functions or add `@this {Type}` annotation.
- **TS2564**: Definite assignment assertion or initialize.
- **TS7034/TS7005**: Add explicit type at declaration.
- **TS18046/TS18048**: Type guards for unknown/undefined.
- **TS2769**: Check overload signatures, narrow types.

## Workflow

1. `npm ci`
2. Add all 7 files to CORE_FILES in `scripts/check-strict-core.js`
3. Fix each file's errors
4. `npm run tsc-strict-core` — must pass
5. `npm run test-unit` — must pass
6. `npm run lint` — must pass (run `npm run lint-fix` first if needed)
7. Commit: `fix(types): add strict checking for standalone feature files (batch A)`
8. `git push -u origin cursor/strict/standalone-features-a`

## Constraints

- Do NOT use `any` — use `unknown`, specific types, or proper interfaces
- Do NOT use `@ts-ignore` or `@ts-expect-error`
- Do NOT modify files outside the assigned list (except `scripts/check-strict-core.js`)
- Do NOT remove existing CORE_FILES entries
- Preserve existing behavior — type fixes only, no logic changes
