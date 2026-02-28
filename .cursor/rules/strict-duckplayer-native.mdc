---
description: "Subagent task: Fix strict TypeScript errors in duckplayer-native files and add to CORE_FILES"
globs:
  - "scripts/check-strict-core.js"
  - "injected/src/features/duck-player-native.js"
  - "injected/src/features/duckplayer-native/custom-error/custom-error.js"
  - "injected/src/features/duckplayer-native/messages.js"
  - "injected/src/features/duckplayer-native/overlays/thumbnail-overlay.js"
  - "injected/src/features/duckplayer-native/sub-features/duck-player-native-no-cookie.js"
  - "injected/src/features/duckplayer-native/sub-features/duck-player-native-youtube.js"
  - "injected/src/features/duckplayer-native/youtube-errors.js"
---

# Strict TypeScript: DuckPlayer Native

## Task

Fix all strict-mode TypeScript errors in 7 duckplayer-native files and add them to `CORE_FILES`.

## Branch

```
git checkout main && git pull origin main && git checkout -b cursor/strict/duckplayer-native
```

## Files (20 errors total)

### `injected/src/features/duck-player-native.js` (4 errors)
```
(28,5): error TS2564: Property 'currentPage' has no initializer.
(30,5): error TS2564: Property 't' has no initializer.
(32,16): error TS7006: Parameter 'args' implicitly has an 'any' type.
(53,27): error TS2322: Type 'string | undefined' is not assignable to type 'string'.
```

### `injected/src/features/duckplayer-native/custom-error/custom-error.js` (2 errors)
```
(26,5): error TS2564: Property 'logger' has no initializer.
(30,5): error TS2564: Property 'error' has no initializer.
```

### `injected/src/features/duckplayer-native/messages.js` (3 errors)
```
(67,75): error TS2345: Argument of type '(mediaControlSettings: MediaControlSettings) => void' is not assignable to parameter of type '(value: unknown) => void'.
(75,72): error TS2345: Argument of type '(muteSettings: MuteSettings) => void' is not assignable to parameter of type '(value: unknown) => void'.
(83,72): error TS2345: Argument of type '(urlSettings: UrlChangeSettings) => void' is not assignable to parameter of type '(value: unknown) => void'.
```

### `injected/src/features/duckplayer-native/overlays/thumbnail-overlay.js` (3 errors)
```
(16,5): error TS2564: Property 'logger' has no initializer.
(20,5): error TS2564: Property 'container' has no initializer.
(22,5): error TS2564: Property 'href' has no initializer.
```

### `injected/src/features/duckplayer-native/sub-features/duck-player-native-no-cookie.js` (1 error)
```
(43,30): error TS7006: Parameter 'timestamp' implicitly has an 'any' type.
```

### `injected/src/features/duckplayer-native/sub-features/duck-player-native-youtube.js` (1 error)
```
(56,30): error TS7006: Parameter 'timestamp' implicitly has an 'any' type.
```

### `injected/src/features/duckplayer-native/youtube-errors.js` (6 errors)
```
(50,9): error TS2322: Type 'YouTubeError | undefined' is not assignable to type 'YouTubeError'.
(62,57): error TS2339: Property 'get' does not exist on type 'object'.
(80,17): error TS2322: Type 'YouTubeError | undefined' is not assignable to type 'YouTubeError'.
(85,13): error TS2322: Type 'YouTubeError | undefined' is not assignable to type 'YouTubeError'.
(93,13): error TS2322: Type 'YouTubeError | undefined' is not assignable to type 'YouTubeError'.
(101,5): error TS2322: Type 'YouTubeError | undefined' is not assignable to type 'YouTubeError'.
```

## Fix Patterns

- **TS2564** (No initializer): Use `/** @type {X} */ (prop!)` or initialize. For class properties assigned in `init()` rather than constructor, use definite assignment assertion.
- **TS7006** (Parameter implicitly any): Add `@param {Type}` JSDoc.
- **TS2345** (Subscribe callback): The messaging `subscribe` expects `(value: unknown) => void`. Cast or add type guard inside the callback.
- **TS2322** (YouTubeError | undefined → YouTubeError): Add undefined checks or use non-null assertion where the value is guaranteed.
- **TS2339** (Property 'get' on object): Cast to `Map` or the actual type that has `.get()`.

## Workflow

1. `npm ci`
2. Add all 7 files to CORE_FILES in `scripts/check-strict-core.js`
3. Fix each file's errors
4. `npm run tsc-strict-core` — must pass
5. `npm run test-unit` — must pass
6. `npm run lint` — must pass (run `npm run lint-fix` first if needed)
7. Commit: `fix(types): add strict checking for duckplayer-native files`
8. `git push -u origin cursor/strict/duckplayer-native`

## Constraints

- Do NOT use `any` — use `unknown`, specific types, or proper interfaces
- Do NOT use `@ts-ignore` or `@ts-expect-error`
- Do NOT modify files outside the assigned list (except `scripts/check-strict-core.js`)
- Do NOT remove existing CORE_FILES entries
- Preserve existing behavior — type fixes only, no logic changes
