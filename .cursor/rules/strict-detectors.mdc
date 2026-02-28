---
description: "Subagent task: Fix strict TypeScript errors in detector files and add to CORE_FILES"
globs:
  - "scripts/check-strict-core.js"
  - "injected/src/detectors/detections/adwall-detection.js"
  - "injected/src/detectors/detections/bot-detection.js"
  - "injected/src/detectors/detections/youtube-ad-detection.js"
  - "injected/src/detectors/utils/detection-utils.js"
---

# Strict TypeScript: Detectors

## Task

Fix all strict-mode TypeScript errors in 4 detector files and add them to `CORE_FILES`.

## Branch

```
git checkout main && git pull origin main && git checkout -b cursor/strict/detectors
```

## Files (17 errors total)

### `injected/src/detectors/detections/adwall-detection.js` (2 errors)
```
(55,13): error TS2339: Property 'textPatterns' does not exist on type '{}'.
(55,27): error TS2339: Property 'textSources' does not exist on type '{}'.
```

### `injected/src/detectors/detections/bot-detection.js` (1 error)
```
(33,21): error TS7006: Parameter 'statusSelectors' implicitly has an 'any' type.
```

### `injected/src/detectors/detections/youtube-ad-detection.js` (12 errors)
```
(57,9): error TS7022: 'trackedVideoElement' implicitly has type 'any' because it does not have a type annotation and is referenced directly or indirectly in its own initializer.
(58,9): error TS7022: 'lastLoggedVideoId' implicitly has type 'any' because it does not have a type annotation and is referenced directly or indirectly in its own initializer.
(64,9): error TS7022: 'playerRoot' implicitly has type 'any' because it does not have a type annotation and is referenced directly or indirectly in its own initializer.
(116,26): error TS2339: Property 'message' does not exist on type 'Object'.
(116,47): error TS2339: Property 'lastMessage' does not exist on type union.
(116,71): error TS2339: Property 'message' does not exist on type 'Object'.
(121,53): error TS2339: Property 'message' does not exist on type 'Object'.
(125,21): error TS2339: Property 'message' does not exist on type 'Object'.
(126,45): error TS2339: Property 'message' does not exist on type 'Object'.
(333,32): error TS2339: Property 'maxLength' does not exist on type 'Object'.
(334,48): error TS2339: Property 'checkAttributedStrings' does not exist on type 'Object'.
(335,45): error TS2339: Property 'checkDialogFallback' does not exist on type 'Object'.
```

### `injected/src/detectors/utils/detection-utils.js` (2 errors)
```
(34,54): error TS7015: Element implicitly has an 'any' type because index expression is not of type 'number'.
(62,36): error TS7053: Element implicitly has an 'any' type because expression of type 'string' can't be used to index type 'Element'.
```

## Fix Patterns

- **TS2339** (Property doesn't exist on type): Add JSDoc `@typedef` or `@type` cast before accessing properties. For `Object` typed params, define an interface via `@typedef` or cast with `/** @type {{prop: type}} */`.
- **TS7006** (Parameter implicitly any): Add `@param {Type}` JSDoc annotations.
- **TS7022** (Variable implicitly any due to circular ref): Add explicit `/** @type {Type} */` annotation at declaration.
- **TS7015/TS7053** (No index signature): Use `/** @type {Record<string, X>} */` cast or narrow the index type.

## Workflow

1. `npm ci`
2. Add all 4 files to CORE_FILES in `scripts/check-strict-core.js`
3. Fix each file's errors using JSDoc type annotations (no `any`, no `@ts-ignore`)
4. `npm run tsc-strict-core` — must pass
5. `npm run test-unit` — must pass
6. `npm run lint` — must pass (run `npm run lint-fix` first if needed)
7. Commit: `fix(types): add strict checking for detector files`
8. `git push -u origin cursor/strict/detectors`

## Constraints

- Do NOT use `any` — use `unknown`, specific types, or proper interfaces
- Do NOT use `@ts-ignore` or `@ts-expect-error`
- Do NOT modify files outside the assigned list (except `scripts/check-strict-core.js`)
- Do NOT remove existing CORE_FILES entries
- Preserve existing behavior — type fixes only, no logic changes
