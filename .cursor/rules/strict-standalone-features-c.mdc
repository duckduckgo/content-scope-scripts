---
description: "Subagent task: Fix strict TypeScript errors in standalone feature files (batch C) and add to CORE_FILES"
globs:
  - "scripts/check-strict-core.js"
  - "injected/src/features/exception-handler.js"
  - "injected/src/features/favicon.js"
  - "injected/src/features/gpc.js"
  - "injected/src/features/navigator-interface.js"
  - "injected/src/features/performance-metrics.js"
---

# Strict TypeScript: Standalone Features C

## Task

Fix all strict-mode TypeScript errors in 5 standalone feature files and add them to `CORE_FILES`.

## Branch

```
git checkout main && git pull origin main && git checkout -b cursor/strict/standalone-features-c
```

## Files (13 errors total)

### `injected/src/features/exception-handler.js` (1 error)
```
(7,42): error TS7006: Parameter 'e' implicitly has an 'any' type.
```

### `injected/src/features/favicon.js` (3 errors)
```
(25,13): error TS7034: Variable 'trailing' implicitly has type 'any'.
(30,26): error TS7005: Variable 'trailing' implicitly has an 'any' type.
(109,37): error TS2345: Argument of type '(link: HTMLLinkElement) => ...' is not assignable to parameter of type '(value: Element, ...) => ...'.
```

### `injected/src/features/gpc.js` (1 error)
```
(5,10): error TS7006: Parameter 'args' implicitly has an 'any' type.
```

### `injected/src/features/navigator-interface.js` (6 errors)
```
(13,10): error TS7006: Parameter 'args' implicitly has an 'any' type.
(19,10): error TS7006: Parameter 'args' implicitly has an 'any' type.
(23,30): error TS7006: Parameter 'args' implicitly has an 'any' type.
(34,17): error TS2322: Type '(object: object, propertyName: string | symbol, descriptor: StrictPropertyDescriptor) => void' is not assignable to type '<T>(o: T, p: PropertyKey, attributes: PropertyDescriptor & ThisType<any>) => T'.
(59,40): error TS7053: Element implicitly has an 'any' type (string index on {}).
(64,17): error TS7053: Element implicitly has an 'any' type (string index on {}).
```

### `injected/src/features/performance-metrics.js` (2 errors)
```
(50,21): error TS7006: Parameter 'callback' implicitly has an 'any' type.
(54,26): error TS7006: Parameter 'callback' implicitly has an 'any' type.
```

## Fix Patterns

- **TS7006** (Parameter implicitly any): Add `@param {Type}` JSDoc. For `args`, check parent class.
- **TS7034/TS7005** (Variable implicitly any): Add explicit `/** @type {X} */` at declaration.
- **TS2345** (Argument not assignable): In favicon.js, the `Array.from(elements).map(link => ...)` callback expects `Element` but the function types it as `HTMLLinkElement`. Cast inside the callback or use proper generic: `/** @type {HTMLLinkElement[]} */ (Array.from(elements))`.
- **TS2322** (Type not assignable): In navigator-interface.js, `Object.defineProperty` return type mismatch. May need to cast the wrapped function or adjust the type assertion.
- **TS7053** (No index signature): Cast config objects to `Record<string, unknown>` or define proper `@typedef`.

## Workflow

1. `npm ci`
2. Add all 5 files to CORE_FILES in `scripts/check-strict-core.js`
3. Fix each file's errors
4. `npm run tsc-strict-core` — must pass
5. `npm run test-unit` — must pass
6. `npm run lint` — must pass (run `npm run lint-fix` first if needed)
7. Commit: `fix(types): add strict checking for standalone feature files (batch C)`
8. `git push -u origin cursor/strict/standalone-features-c`

## Constraints

- Do NOT use `any` — use `unknown`, specific types, or proper interfaces
- Do NOT use `@ts-ignore` or `@ts-expect-error`
- Do NOT modify files outside the assigned list (except `scripts/check-strict-core.js`)
- Do NOT remove existing CORE_FILES entries
- Preserve existing behavior — type fixes only, no logic changes
