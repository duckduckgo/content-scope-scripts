# Types PRs Review — 2026-02-28

## Summary

20 `fix(types)` PRs were created to eliminate `any` type annotations across the codebase.
- **14 merged** into main (Feb 27–28)
- **6 still open** and awaiting merge

All PRs pass lint, tsc, tsc-strict-core, and CI. No merge conflicts between any open PRs.

---

## Open PRs — All LGTM ✅

### #2346 — ErrorBoundary `didCatch` info: `unknown` → `import("preact").ErrorInfo`
- **File:** `special-pages/shared/components/ErrorBoundary.js`
- **Verdict:** ✅ Correct. Preact exports `ErrorInfo` as `{ componentStack?: string }`, matching `componentDidCatch`'s second parameter. Two-step refinement building on #2335 (`any` → `unknown` → `ErrorInfo`).

### #2345 — Drawer.js deps: `any[]` → `ReadonlyArray<unknown>`
- **File:** `special-pages/pages/new-tab/app/components/Drawer.js`
- **Verdict:** ✅ Correct. Matches Preact's `Inputs` type definition for hook dependency arrays. `ReadonlyArray` is better than `unknown[]` since deps shouldn't be mutated.

### #2334 — broker-protection `nonEmptyString` input: `any` → `unknown`
- **File:** `injected/src/features/broker-protection/utils/utils.js`
- **Verdict:** ✅ Correct. Type guard function narrows via `typeof input !== 'string'`, making `unknown` the right input type.
- **Note:** Same file still has 3 more `any` annotations (`matchingStringPair` params `a`, `b`, and `addresses`).

### #2337 — is-same-name.js `noneEmptyString` input: `any` → `unknown`
- **File:** `injected/src/features/broker-protection/comparisons/is-same-name.js`
- **Verdict:** ✅ Correct. Same pattern as #2334 — type guard with `@return {input is string}`.

### #2333 — autofill-import `createOverlayElement` style: `any` → `ButtonAnimationStyle`
- **File:** `injected/src/features/autofill-import.js`
- **Verdict:** ✅ Correct. `ButtonAnimationStyle` is already defined in the same file and used by all callers (`settingsButtonAnimationStyle`, `exportButtonAnimationStyle`, `signInButtonAnimationStyle`).
- **Note:** Same file still has `@returns {Array<Record<string, any>>}` on another method.

### #2332 — autofill-import `observeElementRemoval` callback: `any` → `() => void`
- **File:** `injected/src/features/autofill-import.js`
- **Verdict:** ✅ Correct. The only call site passes `() => { this.removeOverlayIfNeeded(); }` — a void callback.
- **Note:** #2332 and #2333 both touch `autofill-import.js` but on different lines. Verified no merge conflict when merging both sequentially.

---

## Merged PRs — Review

### #2352 — web-compat.js: `Promise<any>` → `Promise<{failure?: {name: string, message: string}}>`
- ✅ Good — specific structural type matching messaging response shape.

### #2350 — telemetry eventStore: `any[]` → `Record<string, unknown>[]`
- ✅ Good — events are key-value objects, `Record<string, unknown>` is appropriate.

### #2349 — overlay-messages assertCustomEvent: `data: any` → `data: unknown` + inline UserValues cast
- ✅ Good — two changes: tightened the assertion return type and added a targeted cast at the call site. The cast to `UserValues` at `evt.detail.data` is acceptable since `assertCustomEvent` validates event structure.
- **Observation:** The cast has no runtime validation of the data shape itself — `assertCustomEvent` only checks `detail.kind` is a string. Acceptable for this codebase pattern.

### #2348 — message-bridge ClassType.create: `any` → `unknown`
- ✅ Good — factory `create` method accepting parsed message data. `unknown` forces callers to narrow.

### #2347 — harmful-apis GetInstalledRelatedAppsConfigMixin: `any` → `string[]`
- ✅ Good — `returnValue` is an array of related app identifiers.

### #2344 — content-feature ExposeMethods: `ExposeMethods<any>` → `ExposeMethods<string>`
- ✅ Good — `ExposeMethods<K>` is branded as `K[]`. The field stores method name strings, so `string` is correct.

### #2343 — config-feature matchConditionalFeatureSetting: `any[]` → `ConditionalSettingEntry[]`
- ✅ Good — most complex change. Introduced `ConditionalSettingEntry` typedef with `& Record<string, unknown>` intersection to allow feature-specific properties. Updated `element-hiding.js` to cast `item.rules` appropriately.
- **Observation:** The intersection type `{condition?, domain?, patchSettings?} & Record<string, unknown>` is the right pattern for an extensible config entry.

### #2342 — PerformanceMetricsResponse: `any` → `ExpandedPerformanceMetrics`
- ✅ Good — fully typed with 17 metric fields matching the actual `expandPerformanceMetrics` return shape.

### #2341 — WidgetList WidgetLoader return: `any` → `import("preact").ComponentChild`
- ✅ Good — standard Preact return type for render functions.

### #2340 — Timeout.js Delay return: `any` → `import("preact").ComponentChild`
- ✅ Good — same pattern as #2341.

### #2339, #2338, #2336 — invariant condition parameter: `any` → `unknown`
- ✅ Good — three duplicate `invariant` function copies in history utils, SearchForm, and PersistentOmnibarValuesProvider. All use `@return {asserts condition}` making `unknown` the correct param type.
- **Observation:** These are three identical `invariant` implementations that could be deduplicated into a shared utility.

### #2335 — ErrorBoundary didCatch info: `any` → `unknown`
- ✅ Good — intermediate step, further refined by open PR #2346.

### #2326 — overlay-messages assertCustomEvent event param: `any` → `Event`
- ✅ Good — assertion function receives DOM events, `Event` is the correct base type.

---

## Observations & Follow-ups

1. **Duplicate `invariant` functions** — PRs #2336, #2338, #2339 each fix identical `invariant` implementations. Consider extracting to `special-pages/shared/utils/invariant.js`.

2. **Remaining `any` in touched files:**
   - `autofill-import.js`: `@returns {Array<Record<string, any>>}` still present
   - `broker-protection/utils/utils.js`: 3 more `any` params on `matchingStringPair` and `addresses`

3. **PR ordering for ErrorBoundary** — #2335 (merged: `any` → `unknown`) then #2346 (open: `unknown` → `ErrorInfo`). Could have been a single PR `any` → `ErrorInfo`.

4. **No runtime validation on casts** — #2349's `UserValues` cast and #2343's `ElementHidingRule[]` cast rely on structural assumptions without runtime checks. Acceptable for JSDoc annotations but worth noting.

5. **All PRs are 1-line changes** except #2343 (new typedef + element-hiding adjustments) and #2342 (new 17-field typedef). The granularity is fine for atomic review/revert but creates merge queue overhead.
