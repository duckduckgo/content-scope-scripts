# Development Utilities

## Overview

To handle the difference in scope injection we expose multiple utilities which behave differently per browser in `src/utils.js` and `ContentFeature` base class. For Firefox the code exposed handles [xrays correctly](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Sharing_objects_with_page_scripts) without needing the features to be authored differently.

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

Calls into `wrappedJSObject.Reflect` for Firefox but otherwise exactly the same as [window.Reflect](Sources/ContentScopeScripts/ContentScopeScripts.swift)
