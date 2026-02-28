---
description: "Subagent task: Fix strict TypeScript errors in standalone feature files (batch B) and add to CORE_FILES"
globs:
  - "scripts/check-strict-core.js"
  - "injected/src/features/duck-ai-chat-history.js"
  - "injected/src/features/duck-ai-data-clearing.js"
  - "injected/src/features/element-hiding.js"
  - "injected/src/features/page-context.js"
  - "injected/src/features/ua-ch-brands.js"
---

# Strict TypeScript: Standalone Features B

## Task

Fix all strict-mode TypeScript errors in 5 standalone feature files and add them to `CORE_FILES`.

## Branch

```
git checkout main && git pull origin main && git checkout -b cursor/strict/standalone-features-b
```

## Files (53 errors total)

### `injected/src/features/duck-ai-chat-history.js` (11 errors)
```
(25,13): error TS2322: Type 'Promise<void>' is not assignable to type 'void'.
(51,31): error TS2339: Property 'message' does not exist on type '{}'.
(227,22): error TS2339: Property 'pinned' does not exist on type 'object'.
(244,30): error TS2339: Property 'lastEdit' does not exist on type 'object'.
(250,27): error TS2339: Property 'chatId' does not exist on type 'object'.
(251,26): error TS2339: Property 'title' does not exist on type 'object'.
(252,26): error TS2339: Property 'model' does not exist on type 'object'.
(254,27): error TS2339: Property 'pinned' does not exist on type 'object'.
(265,35): error TS2339: Property 'title' does not exist on type 'object'.
(265,61): error TS2339: Property 'title' does not exist on type 'object'.
(277,31): error TS2339: Property 'lastEdit' does not exist on type 'object'.
```

### `injected/src/features/duck-ai-data-clearing.js` (5 errors)
```
(14,110): error TS2322: Type 'Promise<void>' is not assignable to type 'void'.
(92,29): error TS2345: Argument of type 'unknown' is not assignable to parameter of type 'Error'.
(111,29): error TS2345: Argument of type 'unknown' is not assignable to parameter of type 'Error'.
(153,41): error TS7006: Parameter 'chat' implicitly has an 'any' type.
(163,23): error TS7006: Parameter 'localStorageKey' implicitly has an 'any' type.
```

### `injected/src/features/element-hiding.js` (11 errors)
```
(56,5): TS7034: Variable 'adLabelStrings' implicitly has type 'any[]'.
(227,32): TS7005: Variable 'adLabelStrings' implicitly has an 'any[]' type.
(270,11): TS7034: Variable 'strictHideRules' implicitly has type 'any[]'.
(271,11): TS7034: Variable 'timeoutRules' implicitly has type 'any[]'.
(281,20): TS7005: Variable 'strictHideRules' implicitly has an 'any[]' type.
(282,12): TS7005: Variable 'timeoutRules' implicitly has an 'any[]' type.
(348,28): TS7006: Parameter 'selector' implicitly has an 'any' type.
(361,13): TS7034: Variable 'activeRules' implicitly has type 'any'.
(406,31): TS2345: Argument of type callback not assignable.
(407,27): TS7005: Variable 'activeRules' implicitly has an 'any' type.
(417,28): TS7005: Variable 'activeRules' implicitly has an 'any' type.
```

### `injected/src/features/page-context.js` (19 errors)
```
(10,36): TS7006: Parameter 'node' implicitly has an 'any' type.
(24,29): TS7006: Parameter 'str' implicitly has an 'any' type.
(196,26): TS7006: Parameter 'str' implicitly has an 'any' type.
(205,22): TS7006: Parameter 'node' implicitly has an 'any' type.
(205,28): TS7006: Parameter 'children' implicitly has an 'any' type.
(205,38): TS7006: Parameter 'settings' implicitly has an 'any' type.
(484,21): TS2339: Property 'metaDescription' does not exist on type.
(487,21): TS2339: Property 'headings' does not exist on type.
(490,21): TS2339: Property 'links' does not exist on type.
(493,21): TS2339: Property 'images' does not exist on type.
(553,33): TS7006: Parameter 'root' implicitly has an 'any' type.
(592,15): TS7034: Variable 'headings' implicitly has type 'any[]'.
(604,16): TS7005: Variable 'headings' implicitly has an 'any[]' type.
(608,15): TS7034: Variable 'links' implicitly has type 'any[]'.
(620,16): TS7005: Variable 'links' implicitly has an 'any[]' type.
(624,15): TS7034: Variable 'images' implicitly has type 'any[]'.
(636,16): TS7005: Variable 'images' implicitly has an 'any[]' type.
(639,25): TS7006: Parameter 'content' implicitly has an 'any' type.
(652,23): TS7006: Parameter 'error' implicitly has an 'any' type.
```

### `injected/src/features/ua-ch-brands.js` (7 errors)
```
(5,17): TS7006: Parameter 'featureName' implicitly has an 'any' type.
(5,30): TS7006: Parameter 'importConfig' implicitly has an 'any' type.
(5,44): TS7006: Parameter 'features' implicitly has an 'any' type.
(5,54): TS7006: Parameter 'args' implicitly has an 'any' type.
(96,37): TS2532: Object is possibly 'undefined'.
(133,75): TS2683: 'this' implicitly has type 'any'.
(147,21): TS7053: Element implicitly has an 'any' type (string index on {}).
```

## Fix Patterns

- **TS2339 on `object`/`{}`**: Define proper `@typedef` for chat history entries, page context data shapes.
- **TS2322 (Promise<void> → void)**: The function signature expects `void` return but the method is `async`. Either mark the return type as `void | Promise<void>` or handle the promise.
- **TS7034/TS7005** (implicit any arrays): Add `/** @type {string[]} */` or appropriate typed array annotation.
- **TS7006**: Add `@param` JSDoc annotations.
- **TS2345**: Type guards or casts for argument mismatches.
- **TS2683**: Arrow function or `@this {Type}` annotation.
- **TS2532**: Null/undefined guards.

## Workflow

1. `npm ci`
2. Add all 5 files to CORE_FILES in `scripts/check-strict-core.js`
3. Fix each file's errors
4. `npm run tsc-strict-core` — must pass
5. `npm run test-unit` — must pass
6. `npm run lint` — must pass (run `npm run lint-fix` first if needed)
7. Commit: `fix(types): add strict checking for standalone feature files (batch B)`
8. `git push -u origin cursor/strict/standalone-features-b`

## Constraints

- Do NOT use `any` — use `unknown`, specific types, or proper interfaces
- Do NOT use `@ts-ignore` or `@ts-expect-error`
- Do NOT modify files outside the assigned list (except `scripts/check-strict-core.js`)
- Do NOT remove existing CORE_FILES entries
- Preserve existing behavior — type fixes only, no logic changes
