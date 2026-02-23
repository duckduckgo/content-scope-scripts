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

### `init`

- This is the main place that features are actually loaded into the extension

### `update`

- This allows the feature to be sent updates from the browser
- If this is triggered before init, these updates will be queued and triggered straight after

## Special-case init/load behaviors

When editing core lifecycle code (`src/content-scope-features.js`, `src/utils.js`) or the feature registry (`src/features.js`), preserve these behaviors:

### Always-run platform-specific features (global disable bypass)
- In `load()`, when `isGloballyDisabled(args)` is true (allowlisted or broken sites), we still load `platformSpecificFeatures`.
- Current list (see `src/utils.js`): `navigatorInterface`, `windowsPermissionUsage`, `messageBridge`, `favicon`.
- Rationale: these provide platform integration and must remain available even when protections are disabled.

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
