---
description: "Subagent task: Fix strict TypeScript errors in duckplayer files and add to CORE_FILES"
globs:
  - "scripts/check-strict-core.js"
  - "injected/src/features/duck-player.js"
  - "injected/src/features/duckplayer/components/ddg-video-drawer-mobile.js"
  - "injected/src/features/duckplayer/components/ddg-video-overlay.js"
  - "injected/src/features/duckplayer/environment.js"
  - "injected/src/features/duckplayer/icon-overlay.js"
  - "injected/src/features/duckplayer/overlay-messages.js"
  - "injected/src/features/duckplayer/thumbnails.js"
  - "injected/src/features/duckplayer/util.js"
  - "injected/src/features/duckplayer/video-overlay.js"
---

# Strict TypeScript: DuckPlayer

## Task

Fix all strict-mode TypeScript errors in 9 DuckPlayer files and add them to `CORE_FILES`.

## Branch

```
git checkout main && git pull origin main && git checkout -b cursor/strict/duckplayer
```

## Files (41 errors total)

### `injected/src/features/duck-player.js` (1 error)
```
(63,10): error TS7006: Parameter 'args' implicitly has an 'any' type.
```

### `injected/src/features/duckplayer/components/ddg-video-drawer-mobile.js` (3 errors)
```
(31,5): error TS2564: Property 'container' has no initializer.
(33,5): error TS2564: Property 'drawer' has no initializer.
(35,5): error TS2564: Property 'overlay' has no initializer.
```

### `injected/src/features/duckplayer/components/ddg-video-overlay.js` (2 errors)
```
(121,32): error TS7006: Parameter 'e' implicitly has an 'any' type.
(128,39): error TS7006: Parameter 'e' implicitly has an 'any' type.
```

### `injected/src/features/duckplayer/environment.js` (2 errors)
```
(53,26): error TS7006: Parameter 'videoId' implicitly has an 'any' type.
(58,13): error TS7006: Parameter 'href' implicitly has an 'any' type.
```

### `injected/src/features/duckplayer/icon-overlay.js` (10 errors)
```
(76,47): error TS2339: Property 'top' does not exist on type 'Object'.
(76,91): error TS2339: Property 'left' does not exist on type 'Object'.
(135,22): error TS7006: Parameter 'event' implicitly has an 'any' type.
(135,29): error TS7006: Parameter 'force' implicitly has an 'any' type.
(227,22): error TS7006: Parameter 'videoElement' implicitly has an 'any' type.
(231,13): error TS7053: Element implicitly has an 'any' type (number index on {}).
(236,30): error TS7006: Parameter 'width' implicitly has an 'any' type.
(236,37): error TS7006: Parameter 'height' implicitly has an 'any' type.
(247,28): error TS7053: Element implicitly has an 'any' type (number index on {}).
(247,68): error TS7053: Element implicitly has an 'any' type (number index on {}).
```

### `injected/src/features/duckplayer/overlay-messages.js` (4 errors)
```
(89,64): error TS2345: Argument of type '(userValues: UserValues) => void' is not assignable to parameter of type '(value: unknown) => void'.
(97,62): error TS2345: Argument of type '(userValues: UISettings) => void' is not assignable to parameter of type '(value: unknown) => void'.
(104,26): error TS7006: Parameter 'kind' implicitly has an 'any' type.
(104,32): error TS7006: Parameter 'data' implicitly has an 'any' type.
```

### `injected/src/features/duckplayer/thumbnails.js` (5 errors)
```
(105,35): error TS7006: Parameter 'e' implicitly has an 'any' type.
(129,36): error TS7006: Parameter 'element' implicitly has an 'any' type.
(136,39): error TS7006: Parameter 'e' implicitly has an 'any' type.
(203,35): error TS7006: Parameter 'e' implicitly has an 'any' type.
(207,32): error TS7006: Parameter 'href' implicitly has an 'any' type.
```

### `injected/src/features/duckplayer/util.js` (10 errors)
```
(210,25): error TS7006: Parameter 'pathname' implicitly has an 'any' type.
(227,21): error TS7006: Parameter 'href' implicitly has an 'any' type.
(268,5): error TS7008: Member 'loadedCallbacks' implicitly has an 'any[]' type.
(276,14): error TS7006: Parameter 'loadedCallback' implicitly has an 'any' type.
(301,11): error TS7019: Rest parameter 'args' implicitly has an 'any[]' type.
(305,10): error TS7019: Rest parameter 'args' implicitly has an 'any[]' type.
(309,9): error TS7019: Rest parameter 'args' implicitly has an 'any[]' type.
(313,10): error TS7019: Rest parameter 'args' implicitly has an 'any[]' type.
(317,12): error TS7006: Parameter 'handler' implicitly has an 'any' type.
(317,21): error TS7006: Parameter 'args' implicitly has an 'any' type.
```

### `injected/src/features/duckplayer/video-overlay.js` (4 errors)
```
(256,18): error TS2769: No overload matches this call.
(259,18): error TS2769: No overload matches this call.
(291,24): error TS2769: No overload matches this call.
(300,24): error TS2769: No overload matches this call.
```

## Fix Patterns

- **TS7006/TS7019** (Parameter/rest implicitly any): Add `@param` JSDoc. For rest params: `@param {...unknown[]} args`.
- **TS2564** (No initializer): Add definite assignment assertion `!` or initialize in declaration.
- **TS2339** (Property on Object): Cast param to proper shape or define `@typedef`.
- **TS7053** (Index signature): Cast objects to `Record<number, X>` or use proper array types.
- **TS2345** (subscribe callback type): The subscribe API expects `(value: unknown) => void`. Either cast the callback or add a type guard inside.
- **TS2769** (No overload matches): Check addEventListener/removeEventListener calls — likely need to narrow the event type string or cast.
- **TS7008** (Member implicitly any): Add `@type` annotation to class member.

## Workflow

1. `npm ci`
2. Add all 9 files to CORE_FILES in `scripts/check-strict-core.js`
3. Fix each file's errors
4. `npm run tsc-strict-core` — must pass
5. `npm run test-unit` — must pass
6. `npm run lint` — must pass (run `npm run lint-fix` first if needed)
7. Commit: `fix(types): add strict checking for duckplayer files`
8. `git push -u origin cursor/strict/duckplayer`

## Constraints

- Do NOT use `any` — use `unknown`, specific types, or proper interfaces
- Do NOT use `@ts-ignore` or `@ts-expect-error`
- Do NOT modify files outside the assigned list (except `scripts/check-strict-core.js`)
- Do NOT remove existing CORE_FILES entries
- Preserve existing behavior — type fixes only, no logic changes
