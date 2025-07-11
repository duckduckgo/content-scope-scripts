# Development Utilities

## Overview

To handle the difference in scope injection we expose multiple utilities which behave differently per browser in `src/utils.js` and `ContentFeature` base class. For Firefox the code exposed handles [xrays correctly](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Sharing_objects_with_page_scripts) without needing the features to be authored differently.

## Development Setup

### Repository Access

1. **Clone the repository**: `https://github.com/duckduckgo/content-scope-scripts`
2. **Request write-access** (for contributors): Submit a request via [Internal Support README](https://app.asana.com/1/137249556945/project/908478224964033/task/1209367367171662?focus=true) asking for `https://github.com/orgs/duckduckgo/teams/core` group access

### Local Development Setup

**Important**: Before cloning the repo on Windows, to avoid major headaches, make sure you clone it with unix-style line endings:

```shell
git clone --config core.autocrlf=false https://github.com/duckduckgo/content-scope-scripts
```

The Content Scope Scripts repo includes the build artifacts, which need to be generated as part of your commit.

### Initial Setup

Inside the repo, run:

```shell
npm ci  # Preferred over 'npm install' for accurate lockfile updates
```

Ensure you have a version of node that matches what's in the `.nvmrc` file.

Now, to ensure everything's setup, try a full build:

```shell
npm run build
```

This will place built files into the top-level `build` folder. If this command ran successfully, you can continue with development.

### Windows Development

The tools should work on Windows, but if you have problems you _may_ wish to try using WSL.

**Optional:**: Use Windows Subsystem for Linux - [WSL Installation Guide](https://learn.microsoft.com/en-us/windows/wsl/install)

Once you have WSL running, make sure you have node and make installed:

```shell
sudo apt update
sudo apt install make
```

For Node.js installation: [How to Install Node.js on Ubuntu/Debian](https://computingforgeeks.com/how-to-install-node-js-on-ubuntu-debian/)

Once node is installed, navigate to the repo path (e.g., `/mnt/c/dev/git/content-scope-scripts`) and:

```shell
npm install    # Install packages
npm run build  # Build JS artifacts
```

After this, you can commit the generated files from your Windows environment through the usual git tools.

### Docker Alternative

If you don't want to install npm on your machine, you can use Docker instead:

```shell
docker run -it --rm -v "<repo root>/submodules/content-scope-scripts:/content-scope-scripts" node:latest /bin/bash

root@<id>:/# cd /content-scope-scripts
root@<id>:/content-scope-scripts# npm install
root@<id>:/content-scope-scripts# npm run build
```

## ContentFeature Utilities

### `ContentFeature.defineProperty(object, propertyName, descriptor)`

Behaves the same as `Object.defineProperty(object, propertyName, descriptor)`. The difference is for Firefox we export the relevant functions so it can go across the xray. Use this method if `Object.getOwnPropertyDescriptors(object).propertyName` should exist in the supporting browser.

### `ContentFeature.wrapProperty(object, propertyName, descriptor)`

A simple wrapper around `defineProperty()` that ignores non-existing properties and retains unspecified descriptor keys.

**Example usage:**

```javascript
this.wrapProperty('Navigator.prototype.userAgent', { get: () => 'fakeUA' });
```

### `ContentFeature.wrapMethod(object, propertyName, wrapperFn)`

Overrides a native method. `wrapperFn()` will be called in place of the original method. The original method will be passed as the first argument.

**Example usage:**

```javascript
this.wrapMethod(Permissions.prototype, 'query', async function (originalFn, queryObject) {
    if (queryObject.name === 'blocked-permission') {
        return {
            name: queryObject.name,
            state: 'denied',
            status: 'denied',
        };
    }
    return await nativeImpl.call(this, queryObject);
});
```

### `ContentFeature.shimInterface(interfaceName, ImplClass, options)`

API for shimming standard constructors. See the WebCompat feature and JSDoc for more details.

**Example usage:**

```javascript
this.shimInterface('MediaSession', MyMediaSessionClass, {
    disallowConstructor: true,
    allowConstructorCall: false,
    wrapToString: true,
});
```

### `ContentFeature.shimProperty(instanceHost, instanceProp, implInstance, readOnly = false)`

API for shimming standard global objects. Usually you want to call `shimInterface()` first, and pass an object instance as `implInstance`. See the WebCompat feature and JSDoc for more details.

**Example usage:**

```javascript
this.shimProperty(Navigator.prototype, 'mediaSession', myMediaSessionInstance, true);
```

## DDG Utilities

### `DDGProxy`

Behaves a lot like `new window.Proxy` with a few differences:

- Has an `overload` method to actually apply the function to the native property
- Stores the native original property in `_native` such that it can be called elsewhere if needed without going through the proxy
- Triggers `addDebugFlag` if get/apply is called
- Sends debugging messaging if debug is enabled
- Allows for remotely disabling the override based on script URL via `shouldExemptMethod`
- Fixes `value.toString()` to appear like it was defined natively

**Example usage:**

```javascript
const historyMethodProxy = new DDGProxy(this, History.prototype, 'pushState', {
    apply(target, thisArg, args) {
        applyRules(activeRules);
        return DDGReflect.apply(target, thisArg, args);
    },
});
historyMethodProxy.overload();
```

### `DDGReflect`

Calls into `wrappedJSObject.Reflect` for Firefox but otherwise exactly the same as [window.Reflect](../../Sources/ContentScopeScripts/ContentScopeScripts.swift)

## Fake Extension Testing

The `npm run fake-extension` command now supports flexible feature and config testing for development and debugging.

### Usage

```sh
npm run fake-extension [options]
```

**Options:**
- `-c, --config <path>`: Path to a config JSON file (relative to `integration-test/test-pages/`)
- `-f, --features <list>`: Comma-separated list of features to enable (e.g. `telemetry,duckPlayer`)
- `-u, --start-url <url>`: Start URL for the extension (default: `http://localhost:3220/index.html`)
- `-h, --help`: Show help information

### Examples

**Test telemetry feature:**
```sh
npm run fake-extension --features telemetry --start-url http://localhost:3220/telemetry/pages/telemetry-test.html
```

**Test with specific config file:**
```sh
npm run fake-extension --config telemetry/config/telemetry.json --start-url http://localhost:3220/telemetry/pages/telemetry-test.html
```

**Test multiple features:**
```sh
npm run fake-extension --features telemetry,duckPlayer,webCompat
```

**Test with custom start URL:**
```sh
npm run fake-extension --start-url http://localhost:3220/duckplayer/pages/player.html
```

### How it works

1. The script builds the content scope scripts
2. Starts the test server on `localhost:3220`
3. Generates a background script with embedded configuration
4. Launches a Chromium extension using `web-ext`
5. The background script sets configuration in `chrome.storage`
6. Content scripts request configuration from the background script
7. Features are initialized with the specified configuration
8. Falls back to URL parameters if no background config is available

### Configuration

The extension supports two configuration modes:

**Feature-only mode:**
```sh
npm run fake-extension --features telemetry
```
Creates a minimal config with the specified features enabled.

**Full config mode:**
```sh
npm run fake-extension --config telemetry/config/telemetry.json
```
Uses the complete configuration from the specified JSON file.

### Testing Specific Features

**Telemetry Testing:**
- Use the simple test page: `http://localhost:3220/telemetry/pages/telemetry-test.html`
- Features: video playback detection, user interaction tracking
- Console logs: "video playback" messages with userInteraction status

**DuckPlayer Testing:**
- Use: `http://localhost:3220/duckplayer/pages/player.html`
- Configs available in: `integration-test/test-pages/duckplayer/config/`

**WebCompat Testing:**
- Use: `http://localhost:3220/webcompat/index.html`
- Features: various web compatibility fixes

### Debugging

- Enable debug mode by adding `debug: true` to your config
- Check browser console for feature initialization messages
- Use browser dev tools to inspect the extension's content scripts
- Monitor network requests to see config loading

### Troubleshooting

**Extension not loading:**
- Ensure the test server is running (`npm run serve`)
- Check that the build completed successfully
- Verify the start URL is accessible

**Features not enabled:**
- Check the config file format matches the expected schema
- Verify feature names are correct (see `src/features.js`)
- Ensure the config path is relative to `integration-test/test-pages/`

**Configuration not loading:**
- Check browser console for fetch errors
- Verify the config file exists and is valid JSON
- Ensure the extension has permission to access the test server
