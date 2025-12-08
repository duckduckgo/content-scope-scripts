# Coding Guidelines

> Guidelines for injected features development.

## Code Style

### Constants

Avoid constants in the code and prefer using `this.getFeatureSetting('constantName') ?? defaultValue` to allow for remote configuration to modify the value.

When using `getFeatureSettingEnabled()`, use its built-in default parameter rather than `|| true`:

```js
// ✅ Correct - uses second parameter for default
includeIframes: this.getFeatureSettingEnabled('includeIframes', 'enabled')

// ❌ Wrong - || true ignores explicit false from config
includeIframes: this.getFeatureSettingEnabled('includeIframes') || true
```

### Event Listener Management

Use stored references or the class-based `handleEvent` pattern to ensure proper removal:

#### Stored reference pattern:

```js
this.scrollListener = () => {...};
document.addEventListener('scroll', this.scrollListener);
document.removeEventListener('scroll', this.scrollListener);
```

#### Class-based handleEvent pattern:

```js
class MyFeature extends ContentFeature {
    init() {
        document.addEventListener('scroll', this);
    }
    destroy() {
        document.removeEventListener('scroll', this);
    }
    handleEvent(e) {
        if (e.type === 'scroll') {
            requestAnimationFrame(() => this.updatePosition());
        }
    }
}
```

**Avoid** using `.bind(this)` directly in addEventListener—it creates a new reference each time, preventing removal.

### Module Structure

- Extract reusable logic into separate files for focused unit testing
- Security-sensitive operations (e.g., markdown to HTML conversion) should be isolated with extensive tests

### Error Handling and Debugging

- Avoid hardcoding debug flags; ensure they are configurable and environment-dependent
- Remove `console.log` statements from production code and prefer `this.log.info` instead as this will be disabled in release.

## Architecture & Design

### Action Execution Flow

- Execute secondary actions from the top level to avoid context handling issues
- Avoid re-calling execution functions within an action

### Navigation Event Handling

- Use `navigatesuccess` event for URL change detection (ensures navigation is committed):

```js
globalThis.navigation.addEventListener('navigatesuccess', handleURLChange);
```

### URL Change Lifecycle

Enable URL tracking for features that need to respond to SPA navigation:

```js
export default class MyFeature extends ContentFeature {
    listenForUrlChanges = true; // Enable URL change tracking

    init() {
        this.applyFeature();
    }

    urlChanged(navigationType) {
        // Called automatically on URL changes
        this.recomputeSiteObject(); // Update config for new path
        this.applyFeature();
    }
}
```

Navigation types: `'push'`, `'replace'`, `'traverse'`, `'reload'`.

### Re-entrancy Pattern

- Check `document.readyState` to avoid missing DOM elements:

```js
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => this.applyFix());
} else {
    this.applyFix();
}
```

### DDGProxy Pattern

Use `DDGProxy` for wrapping browser APIs safely. It automatically adds debug flags, checks exemptions, and preserves `toString()` behavior:

```js
import { DDGProxy, DDGReflect } from '../utils';

// Wrap a method
const proxy = new DDGProxy(this, Navigator.prototype, 'getBattery', {
    apply(target, thisArg, args) {
        return Promise.reject(new DOMException('Not allowed', 'NotAllowedError'));
    },
});
proxy.overload();

// Wrap a property getter
const propProxy = new DDGProxy(this, Screen.prototype, 'width', {
    get(target, prop, receiver) {
        return 1920;
    },
});
propProxy.overloadProperty();
```

### Retry Utilities

Use built-in retry utilities for operations that may need multiple attempts:

```js
import { retry, withRetry } from '../timer-utils';

// Simple retry with config (returns { result, exceptions } for debugging)
const { result, exceptions } = await retry(() => findElement(selector), { interval: { ms: 1000 }, maxAttempts: 30 });

// Retry with automatic error handling
const element = await withRetry(
    () => document.querySelector(selector),
    4, // maxAttempts
    500, // delay ms
    'exponential', // strategy: 'linear' | 'exponential'
);
```

## Security & Privacy

### Element Validation

- Validate elements and their types before operations:

```js
if (!element) {
    return; // or throw appropriate error
}
if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    element.value = value;
}
```

### Caching and State Management

- Avoid global or static caching mechanisms that could lead to race conditions
- Use instance-scoped storage or include all relevant identifiers in cache keys

### Permissions Handling

- Ensure custom permission handling does not bypass native permission models
- Handle permissions with custom behaviors or name overrides correctly

### API Usage in Iframes

- Be cautious enabling APIs like Web Share within iframes, understand that you're exposing message overhead and potential side effects to a third party.

### Captured Globals Pattern

Use captured globals to avoid page-tampered native APIs:

```js
import * as capturedGlobals from '../captured-globals.js';

// Use captured versions instead of global
const myMap = new capturedGlobals.Map();
const mySet = new capturedGlobals.Set();

// Dispatch events safely
capturedGlobals.dispatchEvent(new capturedGlobals.CustomEvent('name', { detail }));
```

### Frame and Context Guards

Validate execution context at feature initialization:

```js
import { isBeingFramed } from '../utils';

init(args) {
    if (isBeingFramed()) return;      // Skip if in a frame
    if (!isSecureContext) return;      // Skip if not HTTPS
    if (!args.messageSecret) return;   // Skip if missing required args
}
```

### Message Secret Pattern

For cross-world communication, use message secrets to prevent spoofing:

```js
function appendToken(eventName) {
    return `${eventName}-${args.messageSecret}`;
}

// Listen with token
captured.addEventListener(appendToken('MessageType'), handler);

// Dispatch with token
const event = new captured.CustomEvent(appendToken('Response'), { detail: payload });
captured.dispatchEvent(event);
```

## Performance

### Memory Management with WeakCollections

Use `WeakSet`/`WeakMap` for DOM element references to allow garbage collection:

```js
const elementCache = new WeakMap();

function getOrCompute(element) {
    if (elementCache.has(element)) {
        return elementCache.get(element);
    }
    const result = expensiveComputation(element);
    elementCache.set(element, result);
    return result;
}

// Delete entries from regular collections after use
navigations.delete(event.target);
```

### Timed Execution Strategy

For dynamic content, use multiple passes at staggered intervals:

```js
const hideTimeouts = [0, 100, 300, 500, 1000, 2000, 3000];
const unhideTimeouts = [1250, 2250, 3000];

hideTimeouts.forEach((timeout) => {
    setTimeout(() => hideAdNodes(rules), timeout);
});

// Clear caches after all operations complete
const clearCacheTimer = Math.max(...hideTimeouts, ...unhideTimeouts) + 100;
setTimeout(() => {
    appliedRules = new Set();
    hiddenElements = new WeakMap();
}, clearCacheTimer);
```

Note: Timers are a useful heuristic to save resources but should be remotely configurable and often other techniques such as carefully engineered MutationObservers would be preferred.

### Batch DOM Operations

Use semaphores to batch frequent DOM updates:

```js
let updatePending = false;

function scheduleUpdate() {
    if (!updatePending) {
        updatePending = true;
        setTimeout(() => {
            performDOMUpdate();
            updatePending = false;
        }, 10);
    }
}
```

### Message Bridge Caching

- Avoid global or static caches for message bridges
- Include all relevant parameters (`featureName`, `messageSecret`) in cache keys

## Error Handling

### Async/Await Usage

- Use `await` to ensure errors are caught and flow is maintained:

```js
await someAsyncFunction();
```

### Error Handling in Promises

- Ensure promises have both resolve and reject paths:

```js
new Promise((resolve, reject) => {
    if (condition) {
        resolve(result);
    } else {
        reject(new Error('specific error message'));
    }
});
```

### Null Checks

- Perform null checks before using objects:

```js
if (object != null) {
    // Use the object
}
```

### Structured Error Responses

Use typed error classes for action-based features:

```js
import { ErrorResponse } from './broker-protection/types.js';

const response = new ErrorResponse({
    actionID: action.id,
    message: 'Descriptive error message',
});
this.messaging.notify('actionError', { error: response });
```

### Silent Feature Initialization Failures

Catch errors without breaking other features:

```js
try {
    customElements.define('ddg-element', DDGElement);
} catch (e) {
    // May fail on extension reload or conflicts
    console.error('Custom element definition failed:', e);
}
```

## Testing

See [Testing Guide](./testing-guide.md) for comprehensive testing documentation.
