---
description: "Subagent task: Fix strict TypeScript errors in click-to-load files and add to CORE_FILES"
globs:
  - "scripts/check-strict-core.js"
  - "injected/src/features/click-to-load.js"
  - "injected/src/features/click-to-load/components/ctl-login-button.js"
---

# Strict TypeScript: Click-to-Load

## Task

Fix all strict-mode TypeScript errors in 2 click-to-load files and add them to `CORE_FILES`. This is the largest single-file effort (169 errors in click-to-load.js).

## Branch

```
git checkout main && git pull origin main && git checkout -b cursor/strict/click-to-load
```

## Files (170 errors total)

### `injected/src/features/click-to-load.js` (169 errors)

**Key error categories:**

1. **Variables `styles`, `sharedStrings`, `config`, `appID`, `entities`, `readyToDisplayPlaceholdersResolver`, `afterPageLoadResolver` implicitly any (TS7034/TS7005)** — ~100 errors. These module-level variables are initialized as `undefined`/empty and assigned later. Add explicit `/** @type {X} */` at declaration.

2. **Property access on `Object` or `{}` typed params (TS2339/TS7053)** — ~30 errors. Config objects need proper typing. Define `@typedef` for the config shape, element data, etc.

3. **Parameter implicitly any (TS7006)** — ~5 errors. Add `@param` annotations.

4. **Type incompatibility (TS2322)** — `(originalElement: HTMLIFrameElement, ...)` vs `(originalElement: HTMLElement | HTMLIFrameElement, ...)`. Widen the parameter type.

5. **`this` implicitly any (TS2683)** — Arrow functions or explicit `@this` annotations.

6. **Cannot invoke possibly null (TS2721)** — Add null checks before invoking.

7. **No initializer (TS2564)** — `#messagingContext` property. Add `!` definite assignment assertion or initialize.

8. **displayMode index (TS7053)** — Cast the enum/string to the correct key type.

**Strategy for `styles` variable (~80 of the 169 errors):** The `styles` variable is used extensively. Find where it's assigned (likely from config) and type it with a comprehensive `@typedef` capturing all style properties used throughout the file. A single proper type annotation at the declaration eliminates ~80 errors.

**Strategy for `sharedStrings`:** Same approach — find the shape from config and type it.

### `injected/src/features/click-to-load/components/ctl-login-button.js` (1 error)
```
(23,5): error TS2564: Property '#element' has no initializer and is not definitely assigned in the constructor.
```

## Full Error List for click-to-load.js

```
(31,5): TS7034: Variable 'appID' implicitly has type 'any'
(37,5): TS7034: Variable 'config' implicitly has type 'any'
(38,5): TS7034: Variable 'sharedStrings' implicitly has type 'any'
(39,5): TS7034: Variable 'styles' implicitly has type 'any'
(60,7): TS7034: Variable 'entities' implicitly has type 'any[]'
(69,5): TS7034: Variable 'readyToDisplayPlaceholdersResolver' implicitly has type 'any'
(77,5): TS7034: Variable 'afterPageLoadResolver' implicitly has type 'any'
(119,44): TS2339: Property 'clickAction' does not exist on type 'Object'
(120,43): TS2339: Property 'replaceSettings' does not exist on type 'Object'
(122,9): TS7008: Member 'placeholderElement' implicitly has an 'any' type
(195,13): TS7053: Element implicitly has an 'any' type (string index on {})
(238,34): TS7053: Element implicitly has an 'any' type
(240,34): TS7053: Element implicitly has an 'any' type
(268,31): TS2339: Property 'app_id_replace' does not exist on type '{}'
(268,49): TS7005: Variable 'appID' implicitly has an 'any' type
(269,95): TS7005: Variable 'appID' implicitly has an 'any' type
(273,29): TS7053: Element implicitly has an 'any' type
(330,24): TS7006: Parameter 'event' implicitly has an 'any' type
(414,30): TS7006: Parameter 'e' implicitly has an 'any' type
(450,49): TS7005: Variable 'styles' implicitly has an 'any' type
(456,52): TS7053: Element implicitly has an 'any' type (displayMode index)
(458,48): TS7005: Variable 'styles' implicitly has an 'any' type
(520,60): TS7053: Element implicitly has an 'any' type
(521,21): TS7006: Parameter 'e' implicitly has an 'any' type
(644-1964): ~140 more errors, mostly TS7005 for 'styles' and 'sharedStrings' variables
(1788,5): TS2564: Property '#messagingContext' has no initializer
(1792,16): TS7006: Parameter 'args' implicitly has an 'any' type
(1823-1867): TS7053/TS2339 on config entity indexing
(1894-1950): TS7005 for 'afterPageLoadResolver' and 'readyToDisplayPlaceholdersResolver'
(1905,13): TS2721: Cannot invoke possibly null
(1911,13): TS2721: Cannot invoke possibly null
(1921,12): TS7006: Parameter 'message' implicitly has an 'any' type
(1963-1964): TS7005 for 'config'
```

## Fix Patterns

- **Module-level variables**: Add `/** @type {X | undefined} */` where `X` is derived from usage. For `styles`, trace to where it's populated from config.
- **TS2564**: Use `/** @type {X} */ (#prop)` or add definite assignment `!` in declaration.
- **TS2339 on Object**: Define proper `@typedef` for the config/entity shapes.
- **TS2322 (HTMLIFrameElement vs union)**: Widen parameter to `HTMLElement | HTMLIFrameElement`.
- **TS2683 (this)**: Convert to arrow function or add `@this {Type}`.
- **TS2721**: Guard with `if (resolver) resolver()`.

## Workflow

1. `npm ci`
2. Add both files to CORE_FILES in `scripts/check-strict-core.js`
3. Fix errors — start with the `styles` and `sharedStrings` typedefs to eliminate bulk errors
4. `npm run tsc-strict-core` — must pass
5. `npm run test-unit` — must pass
6. `npm run lint` — must pass (run `npm run lint-fix` first if needed)
7. Commit: `fix(types): add strict checking for click-to-load files`
8. `git push -u origin cursor/strict/click-to-load`

## Constraints

- Do NOT use `any` — use `unknown`, specific types, or proper interfaces
- Do NOT use `@ts-ignore` or `@ts-expect-error`
- Do NOT modify files outside the assigned list (except `scripts/check-strict-core.js`)
- Do NOT remove existing CORE_FILES entries
- Preserve existing behavior — type fixes only, no logic changes
