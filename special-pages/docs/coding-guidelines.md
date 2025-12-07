# Special Pages Coding Guidelines

> Guidelines for Preact-based special pages development.

## Code Style

### Naming Conventions
- Use descriptive names for variables, functions, and classes
- Follow existing naming patterns in the codebase

### Component and Hook Usage

#### Preact Attributes
- Use `class` instead of `className` in Preact components

#### Key Placement
- Avoid unnecessary re-renders by correctly placing keys:

```jsx
// Incorrect - key on wrapper div
<div key={resetKey}>
    {/* Component content */}
</div>

// Correct - key on component
<Component key={resetKey} />
```

#### Dependency Management in Hooks
- Include all used values in the dependency array of `useCallback` to prevent stale closures:

```js
const setter = useCallback(() => {
    // Function body using dep1 and dep2
}, [dep1, dep2]); // Include all dependencies
```

### Error Handling and Debugging
- Avoid hardcoding debug flags; ensure they are configurable and environment-dependent
- Remove `console.log` statements from production code

## Architecture & Design

### Internationalization
- Use translation functions via `useTypedTranslations()`:

```js
const { t } = useTypedTranslations();
const message = t('key_name');
```

- Store translations in `public/locales/<lang>.json`

### Type Consistency
- Use JSDoc types imported via `@typedef`:

```js
/** @typedef {import('./types.js').MyType} MyType */
```

- Import types from generated files in `types/` directory

### Platform-Specific Styling
- Use `data-platform-name` attribute for platform detection
- Use `data-theme` for dark/light mode instead of media queries

### Component Design
- Avoid rendering children multiple times within components
- Ensure props (especially `style`) are handled correctly
- Do not couple functionality to UI visibility—control functionality independently from whether UI elements are shown

### AI Functionality and UI Coupling
- Decouple AI functionality from its setting UI visibility
- Ensure functionality is controlled independently from UI elements

### Feature State Management
- Maintain parameter order in method signatures to prevent breaking changes
- Avoid overriding falsy values incorrectly

### Documentation Updates
- Update documentation to reflect critical changes, such as method parameter reordering

## Security & Privacy

### XSS Vulnerabilities
- Isolate and unit test any logic that manipulates HTML or sets content dynamically
- Markdown to HTML conversion should be in a separate file with extensive testing:

```javascript
// In a separate utility file with unit tests
export function convertMarkdownToHTML(markdown) {
    const regex = /\*\*(.*?)\*\*/g;
    return markdown.replace(regex, '<strong>$1</strong>');
}
```

### Controlled Component State
- Avoid directly manipulating properties like `value` on controlled components
- Let Preact manage input state through props and event handlers

## Performance

### Memory Management
- Clean up subscriptions and event listeners in component unmount

### Console Log Statements
- Remove `console.log` statements from production code

## Error Handling

### Error Messages
- Ensure error messages are accurate and specific
- Replace generic 'unknown error' with specific error messages

### Async/Await Usage
- Use `await` with asynchronous operations to ensure errors are caught:

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

### Element Visibility and Accessibility
- Avoid changing element visibility in a way that prevents focus:

```css
/* Ensure focusable elements remain accessible */
[aria-expanded="true"] {
    visibility: visible; /* Not hidden */
}
```

## Testing

### Test Independence in Playwright
- Ensure tests are independent to allow safe parallel execution
- Avoid shared setup outside of each test block
- Use Playwright's test fixtures for complex setup

### Async/Await in Tests
- Always use `await` with asynchronous operations:

```javascript
// Correct
await page.click('button');

// Incorrect - may not wait for completion
page.click('button');
```

### Mocking and Test Data
- Include comprehensive scenarios in mocks to cover edge cases

