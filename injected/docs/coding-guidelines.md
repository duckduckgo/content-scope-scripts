# Coding Guidelines

> Guidelines for injected features development.

## Code Style

### Naming Conventions
- Use descriptive names for variables, functions, and classes
- Follow existing naming patterns in the codebase

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
- Remove `console.log` statements from production code

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

### Documentation Updates
- Update documentation to reflect critical changes
- Document workarounds for bugs clearly for future maintenance

### Regression Handling
- Address regressions promptly, especially those affecting critical functionality
- Ensure changes do not introduce unintended side effects

## Security & Privacy

### XSS Vulnerabilities
- Isolate and unit test any logic that manipulates HTML or sets content dynamically

### Error Handling and Edge Cases
- Validate elements and their types before operations:

```javascript
if (!element) {
    return PirError.create(`could not find element`);
}
if ((isInputElement(element) && ['text', 'hidden'].includes(element.type)) || isTextAreaElement(element)) {
    element.value = token;
} else {
    return PirError.create(`element is neither a text input nor textarea`);
}
```

### Caching and State Management
- Avoid global or static caching mechanisms that could lead to race conditions
- Use instance-scoped storage or include all relevant identifiers in cache keys

### Permissions Handling
- Ensure custom permission handling does not bypass native permission models
- Handle permissions with custom behaviors or name overrides correctly

### API Usage in Iframes
- Be cautious enabling APIs like Web Share within iframes—may cause security issues or runtime errors

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

### Console Log Statements
- Remove `console.log` statements from production code

## Error Handling

### Error Messages
- Ensure error messages are accurate and specific
- Replace generic 'unknown error' with context-specific messages

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

### Captcha Error Handling
- Bubble up errors to avoid silent failures:

```js
if (PirError.isError(captchaProvider)) {
    return createError(captchaProvider.error.message);
}
```

## Testing

### Test Independence in Playwright
- Ensure tests are independent for safe parallel execution
- Use Playwright's test fixtures for complex setup

### Async/Await in Tests
- Always use `await` with asynchronous operations:

```javascript
// Correct
await overlays.opensShort(url);

// Incorrect
overlays.opensShort(url);
```

### Specificity in Test File Selection
- Use specific glob patterns to include only test files:

```javascript
// Correct
'integration-test/**/*.spec.js'

// Incorrect - includes non-test files
'integration-test/**'
```

### Unit Testing Security-sensitive Code
- Extract security-sensitive logic to separate files for focused unit testing
