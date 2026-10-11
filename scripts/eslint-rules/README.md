# Local ESLint rules

Repo-specific ESLint rules, exposed to [`eslint.config.js`](../../eslint.config.js) as the `ddg-local` plugin. They live here rather than in [`@duckduckgo/eslint-config`](https://github.com/duckduckgo/eslint-config) because they encode C-S-S architecture — the feature lifecycle, the messaging layer — that other repos don't share.

## Rules

### `no-blocking-init-request`

Applies to `injected/src/**/*.js`.

Rejects a feature whose `load()` or `init()` waits on a request/response round trip to the client — `await this.request(...)`, `await this.messaging.request(...)`, or returning that promise from the method. Each phase gets its own message, because they break differently:

- **`init()`** — `callInit()` awaits `init()`, and the shared init chain in `injected/src/content-scope-features.js` awaits every feature's `callInit()`. So an awaited request delays the feature's own setup, delays the queued-`update()` drain for all features, and leaves the feature's `ready` state unresolved forever on a platform that has no handler for the message.
- **`load()`** — `callLoad()` does *not* await `load()`, so an `await` doesn't stall the load loop; it splits the method in two. The code after it runs in a later task, after the page may already have used the API the feature meant to wrap, and any rejection is unhandled. `load()` also runs before remote-config exceptions apply, so the message goes out on sites where the feature never inits.

Gating a feature this way also puts a message on every page load, on every platform, even when the feature does nothing. Enablement belongs in Privacy Remote Configuration (`getFeatureSettingEnabled`) or `userPreferences`, both of which arrive with the injected args. See [Red flags in `load`](../../injected/docs/features-guide.md#red-flags-in-load) and [Red flags in `init`](../../injected/docs/features-guide.md#red-flags-in-init) for the alternatives.

When a feature really does need a client response before it can do anything, the repo idiom is `void this.someAsyncSetup()` — the lifecycle method returns, a separate `async` method awaits and handles its own errors. (`.then()` chains are rejected by `promise/prefer-await-to-then`, and a bare un-awaited promise by `@typescript-eslint/no-floating-promises`.)

Two shapes are matched:

- a `methodNames` call reached from `this` — `this.request(...)`, `this.messaging.request(...)`;
- any method call on a **messaging wrapper**, i.e. an object built from `this.messaging`, as features do with their `*Messages` classes — `await messages.initialSetup()` is the same round trip one layer down. Both a local (`const messages = new DuckPlayerNativeMessages(this.messaging, env)`) and a class member (`get messages() { return new FeatureMessages(this.messaging) }`, or the equivalent field) are recognised: the local is resolved through scope and the member through the surrounding class body, rather than matched by name — so an unrelated `await someClient.request(...)` or `await this.helper.load()` is left alone.

Only the lifecycle method's own scope is examined — a request inside an event listener or other callback registered there is fine, because nothing waits on it. Extra method names can be flagged per config block:

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
