# Features Development Guide

## Overview

Features are files stored in the `features/` directory that must include an `init` function and optionally `update` and `load` methods as explained in the [Features Lifecycle](#features-lifecycle).

## ConfigFeature Class

The [ConfigFeature](https://github.com/duckduckgo/content-scope-scripts/blob/main/injected/src/config-feature.js) class is extended by each feature to implement remote config handling. It provides the following methods:

### `getFeatureSettingEnabled(settingKeyName)`

For simple boolean settings, returns `true` if the setting is 'enabled'

For default Enabled use: `this.getFeatureSettingEnabled(settingKeyName, 'enabled')`

### `getFeatureSetting()`

Returns a specific setting from the feature settings

### `recomputeSiteObject()`

Recomputes the site object for the feature, e.g. when the URL has changed

The `ConfigFeature` class is also exportable and can be used by other scripts to build C-S-S like features that can handle remote configuration - currently used in [autofill.js](https://github.com/duckduckgo/duckduckgo-autofill/blob/main/src/site-specific-feature.js) to handle site specific autofill rules.

## Implementing a New Feature

### 1. Create Feature File

Create a new content scope features file in `src/features/` and register it in [features.js](../src/features.js).

### 2. Register the Feature

Add the feature name to the [features.js](../src/features.js) array.

### 3. Add Debug Flags

Add breakage debug flags at appropriate places by calling `ContentFeature.addDebugFlag()`. This will help identify anomalies in breakage reports.

### 4. Write Tests

- **Unit tests**: Should be platform agnostic
- **Integration tests**: Should be platform agnostic and run in the platform also

### 5. Follow Process Guidelines

## Features Lifecycle

There are three stages that the content scope code is hooked into the platform:

### `load`

- This should be reserved for work that could cause a delay in loading the feature
- Given the current limitations of how we inject our code, we don't have the Privacy Remote Configuration exceptions, so authors should be wary of actually loading anything that would modify the page (and potentially breaking it)
- This limitation may be re-addressed in manifest v3
- One exception here is the cookie protection, which installs wrappers in `load()` and completes policy setup in `init()` to avoid race conditions

#### Red flags in load

**🚩 Waiting on anything, especially a request to the client.** `load()` is the phase whose only job is to be early: it installs wrappers before the page has had a chance to use the API. `callLoad()` calls it without awaiting, so an `await` doesn't stall the load loop — it quietly splits the method in two. Everything after the `await` runs in a later task, by which point the page may already have read the property the feature meant to wrap, and any rejection is unhandled because nobody holds the returned promise.

```js
// ❌ Red flag - the wrapper is installed a round trip too late, if at all
async load() {
    const { enabled } = await this.request('isEnabled', {});
    if (enabled) this.wrapProperty('Navigator.prototype.someApi', {});
}

// ✅ Install synchronously; decide with config that's already present
load() {
    this.wrapProperty('Navigator.prototype.someApi', {});
}
```

A request in `load()` is doubly wrong: `load()` runs before Privacy Remote Configuration exceptions are applied, and `platformSpecificFeatures` load even when protections are globally disabled for the site. So the message goes to the client on pages where the feature will never init. Do client work in `init()` instead, and see [Red flags in `init`](#red-flags-in-init) for how to gate it there.

Enforced by the `ddg-local/no-blocking-init-request` ESLint rule.

### `init`

- This is the main place that features are actually loaded into the extension

#### Red flags in init

**🚩 Awaiting a request/response round trip to the client.** `init()` is awaited by `callInit()`, which is awaited by the shared init chain in [`content-scope-features.js`](../src/content-scope-features.js). A `request()` awaited inside `init()` therefore:

- delays the feature's own setup by a full round trip to the client, during which the page is already running,
- delays the queued-`update()` drain that happens after all features have initialised,
- never completes on a platform where no handler replies, leaving the feature's `ready` state unresolved forever,
- adds a message to every page load on every supported platform, even when the feature does nothing.

```js
// ❌ Red flag - init blocks on the client answering
async init() {
    const { enabled } = await this.request('isEnabled', {});
    if (!enabled) return;
    this.installListeners();
}
```

Ask what the round trip is actually for. Almost always the answer is "deciding whether to run", and that decision already has a non-blocking home:

- **Enablement, per platform or per site** → Privacy Remote Configuration. `this.getFeatureSettingEnabled(...)` / `this.getFeatureSetting(...)` read config that arrives with the injected args, so no message is needed and the feature can be changed remotely without a client release. This includes turning a feature on for a new platform - prefer a config change over a platform check in JS.
- **A user-controlled setting** → send it through `userPreferences` in the injected args. It is delivered statically at injection time, so it costs nothing on the page.
- **State the client owns and can change later** → `this.subscribe(...)`, set up synchronously in `init()`, acting when the message arrives.
- **State that only a later user action needs** → make the request at that point, not during init.

If a feature genuinely cannot do anything until the client answers, move the wait into its own method and let `init()` return. `void` marks the promise as deliberately not awaited (`no-floating-promises`), and the method handles its own failure so nothing rejects unhandled — note that `.then()` chains are not the way to do this here, `promise/prefer-await-to-then` rejects them:

```js
// ✅ init returns immediately; the response drives the rest
init() {
    if (!this.getFeatureSettingEnabled('someToggle')) return;
    void this.setupFromClient();
}

async setupFromClient() {
    try {
        this.applyState(await this.request('getState', {}));
    } catch (e) {
        // No handler on this platform, or the client failed to answer
    }
}
```

This is enforced by the `ddg-local/no-blocking-init-request` ESLint rule (see [`scripts/eslint-rules/README.md`](../../scripts/eslint-rules/README.md)), which covers `load()` too, and sees through a `*Messages` wrapper built from `this.messaging`. `click-to-load` and `duck-player-native` carry documented `eslint-disable` comments for pre-existing cases; new features should not add one.

**🚩 Other things worth a second look in `init`:** synchronous work proportional to page size (defer it), and gating behaviour on `platform.name` where remote config could decide instead.

### `update`

- This allows the feature to be sent updates from the browser
- If this is triggered before init, these updates will be queued and triggered straight after

## Special-case init/load behaviors

When editing core lifecycle code (`src/content-scope-features.js`, `src/utils.js`) or the feature registry (`src/features.js`), preserve these behaviors:

### Always-run platform-specific features (global disable bypass)

- In `load()`, when `isGloballyDisabled(args)` is true (allowlisted or broken sites), we still load `platformSpecificFeatures`.
- Current list is defined in `src/utils.js` under `platformSpecificFeatures`.
- Rationale: these provide platform integration and must remain available even when protections are disabled.

### Self-gating features (exception bypass)

- `selfGatingFeatures` in `src/utils.js` (currently `['trackerProtection']`) bypass exception-based disabling in `computeEnabledFeatures`.
- These features are always included in `enabledFeatures` when their `state` is enabled, regardless of domain exceptions.
- The feature handles its own exceptions internally by reading `this.bundledConfig.features.<name>.exceptions` and adjusting behavior (e.g., reporting without blocking on excepted domains).
- Use this for features that need to stay active on excepted/unprotected domains for reporting or other passive behavior.

### Always-init extension features (cookie)

- `alwaysInitFeatures` in `src/content-scope-features.js` (currently `['cookie']`) bypasses `isFeatureBroken` for `platform.name === 'extension'`.
- This ensures `cookie` runs `init()` even on allowlisted/broken sites to complete policy setup.

### Cookie feature early load/init ordering

- `src/features/cookie.js` installs the `Document.cookie` wrapper in `load()` before full config is available.
- `load()` seeds a best-effort policy from `bundledConfig`, then `init()` finalizes policy (including extension-provided `args.cookie`) and resolves `loadedPolicyResolve`.
- Changing load/init ordering or gating can create gaps where cookies are not intercepted or policy resolution never completes.

### Extension load uses bundled feature list

- In `load()`, extensions do not have `site.enabledFeatures` yet, so they fall back to `platformSupport[import.meta.injectName]`.
- Avoid tightening this flow; it is required for early-load features (especially `cookie`) to install hooks on time.

## Debug and Breakage Management

### Debug Implementation

When developing features that modify web pages, add debug flags at appropriate times to help identify anomalies in breakage reports:

```javascript
ContentFeature.addDebugFlag();
```

### Breakage Understanding

**Key principles for feature development:**

- Breakage is unpredictable - expect it rather than hope for the best
- Exposing features to the web platform can have permanent impact
- Removing features that pages depend on is difficult
- Any web page modification impacts performance or security
- Modifications to `window` or other globals should be avoided (pages could define same names)

### Remote Configuration

All features that modify web pages should use Privacy Remote Configuration where feasible. This allows:

- Mitigating breakage remotely
- Adjusting and disabling feature behavior without browser updates
- Monitoring and controlling feature rollout

The `ConfigFeature` class provides the infrastructure for this through `getFeatureSettingEnabled()` and `getFeatureSetting()` methods.
