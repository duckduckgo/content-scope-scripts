# Coding Guidelines

> Guidelines for injected features development.

## Code Style

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

### Re-entrancy Pattern

- Check `document.readyState` to avoid missing DOM elements:

```js
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => this.applyFix());
} else {
    this.applyFix();
}
```

## Security & Privacy

### Element Validation

- Validate elements and their types before operations:

```javascript
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

## Performance

### Memory Management

- Use `WeakSet`/`WeakMap` for DOM element references to allow garbage collection
- Delete entries from collections after use:

```js
navigations.delete(event.target);
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

## Testing

See [Testing Guide](./testing-guide.md) for comprehensive testing documentation.
