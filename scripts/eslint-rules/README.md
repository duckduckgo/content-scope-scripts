# Local ESLint rules

Repo-specific ESLint rules, exposed to [`eslint.config.js`](../../eslint.config.js) as the `ddg-local` plugin. They live here rather than in [`@duckduckgo/eslint-config`](https://github.com/duckduckgo/eslint-config) because they encode C-S-S architecture — the feature lifecycle, the messaging layer — that other repos don't share.

## Rules

### `no-blocking-init-request`

Applies to `injected/src/**/*.js`.

Rejects a feature that blocks its `init()` on a request/response round trip to the client — `await this.request(...)`, `await this.messaging.request(...)`, or returning that promise from `init()`.

`callInit()` awaits `init()`, and the shared init chain in `injected/src/content-scope-features.js` awaits every feature's `callInit()`. So an awaited request delays the feature's own setup, delays the queued-`update()` drain for all features, and leaves the feature's `ready` state unresolved forever on a platform that has no handler for the message. Gating a feature this way also puts a message on every page load, on every platform, even when the feature does nothing.

Enablement belongs in Privacy Remote Configuration (`getFeatureSettingEnabled`) or `userPreferences`, both of which arrive with the injected args. See [Red flags in `init`](../../injected/docs/features-guide.md#red-flags-in-init) for the alternatives.

Only calls reached from `this` count (`this.request`, `this.messaging.request`), and only in `init()`'s own scope — a request inside an event listener or other callback registered by `init()` is fine, because it doesn't block. Extra method names can be flagged per config block:

```js
'ddg-local/no-blocking-init-request': ['error', { methodNames: ['request', 'initialSetup'] }],
```

## Adding a rule

1. Write the rule in `scripts/eslint-rules/<rule-name>.js` as a named export.
2. Register it in [`index.js`](./index.js).
3. Enable it for the relevant `files` glob in [`eslint.config.js`](../../eslint.config.js).
4. Add `RuleTester` cases in `<rule-name>.test.js` and add the file to the `test-eslint-rules` script in the root `package.json`.

Run the rule tests with:

```sh
npm run test-eslint-rules
```
