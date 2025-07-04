# Features Development Guide

## Overview

Features are files stored in the `features/` directory that must include an `init` function and optionally `update` and `load` methods as explained in the [Features Lifecycle](#features-lifecycle).

## ConfigFeature Class

The [ConfigFeature](https://github.com/duckduckgo/content-scope-scripts/blob/main/injected/src/config-feature.js) class is extended by each feature to implement remote config handling. It provides the following methods:

### `getFeatureSettingEnabled()`
For simple boolean settings, returns `true` if the setting is 'enabled'

### `getFeatureSetting()`
Returns a specific setting from the feature settings

### `recomputeSiteObject()`
Recomputes the site object for the feature, e.g. when the URL has changed

The `ConfigFeature` class is also exportable and can be used by other scripts to build C-S-S like features that can handle remote configuration - currently used in [autofill.js](https://github.com/duckduckgo/duckduckgo-autofill/blob/main/src/site-specific-feature.js) to handle site specific autofill rules.

## Features Lifecycle

There are three stages that the content scope code is hooked into the platform:

### `load`
- This should be reserved for work that could cause a delay in loading the feature
- Given the current limitations of how we inject our code, we don't have the Privacy Remote Configuration exceptions, so authors should be wary of actually loading anything that would modify the page (and potentially breaking it)
- This limitation may be re-addressed in manifest v3
- One exception here is the first party cookie protections that are triggered on init to prevent race conditions

### `init`
- This is the main place that features are actually loaded into the extension

### `update`
- This allows the feature to be sent updates from the browser
- If this is triggered before init, these updates will be queued and triggered straight after 