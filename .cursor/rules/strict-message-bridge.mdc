---
description: "Subagent task: Fix strict TypeScript errors in message-bridge files and add to CORE_FILES"
globs:
  - "scripts/check-strict-core.js"
  - "injected/src/features/message-bridge.js"
  - "injected/src/features/message-bridge/create-page-world-bridge.js"
  - "injected/src/features/message-bridge/schema.js"
---

# Strict TypeScript: Message Bridge

## Task

Fix all strict-mode TypeScript errors in 3 message-bridge files and add them to `CORE_FILES`.

## Branch

```
git checkout main && git pull origin main && git checkout -b cursor/strict/message-bridge
```

## Files (62 errors total)

### `injected/src/features/message-bridge.js` (5 errors)
```
(48,10): error TS7006: Parameter 'args' implicitly has an 'any' type.
(84,22): error TS2769: No overload matches this call.
(157,35): error TS18046: 'e' is of type 'unknown'.
(181,63): error TS2345: Argument of type '(data: Record<string, any>) => void' is not assignable to parameter of type '(value: unknown) => void'.
(215,10): error TS7006: Parameter '_args' implicitly has an 'any' type.
```

### `injected/src/features/message-bridge/create-page-world-bridge.js` (6 errors)
```
(86,18): error TS2769: No overload matches this call.
(89,14): error TS2769: No overload matches this call.
(161,34): error TS2769: No overload matches this call.
(164,26): error TS2769: No overload matches this call.
(197,22): error TS2769: No overload matches this call.
(200,26): error TS2769: No overload matches this call.
```

### `injected/src/features/message-bridge/schema.js` (51 errors)
All TS2339 — Property does not exist on type 'Object'. The schema validation functions receive `Object` typed params but access specific properties:
```
Properties accessed: featureName, id, method, params, result, error, subscriptionName
Lines: 32-34, 56-57, 84-92, 122-132, 161-167, 193-199, 227-235, 257-259
```

## Fix Patterns

### schema.js Strategy (51 errors)
The schema.js file validates message shapes. Each validation function receives an `Object` parameter but needs to access typed properties. **Define `@typedef` types for each message shape:**

```js
/**
 * @typedef {Object} NotifyMessage
 * @property {string} featureName
 * @property {string} id
 */

/**
 * @typedef {Object} RequestMessage
 * @property {string} featureName
 * @property {string} method
 * @property {string} id
 * @property {unknown} [params]
 */

/**
 * @typedef {Object} ResponseMessage
 * @property {string} featureName
 * @property {string} method
 * @property {string} id
 * @property {unknown} [result]
 * @property {unknown} [error]
 */

/**
 * @typedef {Object} SubscriptionMessage
 * @property {string} featureName
 * @property {string} subscriptionName
 * @property {string} id
 * @property {unknown} [params]
 */
```

Then cast each validation function's input parameter.

### create-page-world-bridge.js (6 errors)
All TS2769 "No overload matches" — likely addEventListener/postMessage calls with custom event types. Check the actual event type strings and cast or use proper event map overloads.

### message-bridge.js (5 errors)
- TS7006: Add `@param` annotations.
- TS2769: Same overload pattern as above.
- TS18046: `instanceof Error` check or `String(e)`.
- TS2345: Cast callback or widen type.

## Workflow

1. `npm ci`
2. Add all 3 files to CORE_FILES in `scripts/check-strict-core.js`
3. Fix schema.js first (bulk errors), then the other two
4. `npm run tsc-strict-core` — must pass
5. `npm run test-unit` — must pass
6. `npm run lint` — must pass (run `npm run lint-fix` first if needed)
7. Commit: `fix(types): add strict checking for message-bridge files`
8. `git push -u origin cursor/strict/message-bridge`

## Constraints

- Do NOT use `any` — use `unknown`, specific types, or proper interfaces
- Do NOT use `@ts-ignore` or `@ts-expect-error`
- Do NOT modify files outside the assigned list (except `scripts/check-strict-core.js`)
- Do NOT remove existing CORE_FILES entries
- Preserve existing behavior — type fixes only, no logic changes
