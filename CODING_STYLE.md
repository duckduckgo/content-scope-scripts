# Coding Style Guide

## Overview

This document outlines the coding style and conventions used in the Content Scope Scripts project.

## Code Formatting

### Prettier

We use [Prettier](https://prettier.io/) for automatic code formatting. This ensures consistent code style across the entire codebase.

- **Configuration**: See [`.prettierrc`](.prettierrc) for current formatting settings
- **IDE Integration**: Enable Prettier in your IDE/editor for automatic formatting on save
- **CI/CD**: Code formatting is checked in our continuous integration pipeline

### Running Prettier

```bash
# Format all files
npm run lint-fix

# Check formatting (without making changes)
npm run lint
```

## TypeScript via JSDoc

We use JSDoc comments to provide TypeScript-like type safety without requiring a TypeScript compilation step.

### JSDoc Resources

- https://devhints.io/jsdoc
- https://docs.joshuatz.com/cheatsheets/js/jsdoc/

### Basic JSDoc Usage

```javascript
/**
 * @param {string} videoId - The video identifier
 * @param {() => void} handler - Callback function to invoke
 * @returns {boolean} Whether the operation was successful
 */
function processVideo(videoId, handler) {
    // implementation
}
```

### Type Annotations

```javascript
// Variable type annotation
/** @type {HTMLElement|null} */
const element = document.getElementById('my-element');

// Function parameter and return types
/**
 * @param {HTMLIFrameElement} iframe
 * @returns {(() => void)|null}
 */
function setupIframe(iframe) {
    // implementation
}
```

### Interface Definitions

```javascript
/**
 * @typedef {Object} VideoParams
 * @property {string} id - Video ID
 * @property {string} title - Video title
 * @property {number} duration - Duration in seconds
 */

/**
 * @typedef {import("./iframe").IframeFeature} IframeFeature
 */
```

## Safety and Defensive Programming

### Type Guards Over Type Casting

When working with DOM elements or external environments (like iframes), prefer runtime type checks over type casting:

```javascript
// ❌ Avoid type casting when safety is uncertain
/** @type {Element} */
const element = someUnknownValue;

// ✅ Use instanceof checks for runtime safety
if (!(target instanceof Element)) return;
const element = target; // TypeScript now knows this is an Element
```

### Null/Undefined Checks

Always check for null/undefined when accessing properties that might not exist:

```javascript
// ❌ Unsafe
const doc = iframe.contentDocument;
doc.addEventListener('click', handler);

// ✅ Safe
const doc = iframe.contentDocument;
if (!doc) {
    console.log('could not access contentDocument');
    return;
}
doc.addEventListener('click', handler);
```

## Best Practices

1. **Use meaningful variable names** that describe their purpose
2. **Add JSDoc comments** for all public functions and complex logic
3. **Prefer explicit type checks** over type assertions in uncertain environments
4. **Handle edge cases** gracefully with proper error handling
5. **Keep functions small and focused** on a single responsibility
6. **Design richer return types** to avoid using exceptions as control flow
7. **Favor implements over extends** to avoid class inheritance (see Interface Implementation section)
8. **Remove 'index' files** if they only serve to enable re-exports - prefer explicit imports/exports
9. **Prefer function declarations** over arrow functions for module-level functions

### Return Types and Error Handling

Instead of using exceptions for control flow, design richer return types:

```javascript
// ❌ Using exceptions for control flow
function parseVideoId(url) {
    if (!url) throw new Error('URL is required');
    if (!isValidUrl(url)) throw new Error('Invalid URL');
    return extractId(url);
}

// ✅ Using richer return types
/**
 * @typedef {Object} ParseResult
 * @property {boolean} success
 * @property {string} [videoId] - Present when success is true
 * @property {string} [error] - Present when success is false
 */

/**
 * @param {string} url
 * @returns {ParseResult}
 */
function parseVideoId(url) {
    if (!url) return { success: false, error: 'URL is required' };
    if (!isValidUrl(url)) return { success: false, error: 'Invalid URL' };
    return { success: true, videoId: extractId(url) };
}
```

### Interface Implementation

Favor `implements` over `extends` to avoid class inheritance. While this is awkward in JSDoc, it promotes composition over inheritance:

```javascript
/**
 * @typedef {Object} IframeFeature
 * @property {function(HTMLIFrameElement): void} iframeDidLoad
 */

/**
 * @implements {IframeFeature}
 */
export class ReplaceWatchLinks {
    /**
     * @param {HTMLIFrameElement} iframe
     */
    iframeDidLoad(iframe) {
        // implementation
    }
}
```

### Import/Export Patterns

Avoid index files that only serve re-exports. Be explicit about imports:

```javascript
// ❌ Avoid index.js files with only re-exports
// index.js
export { FeatureA } from './feature-a.js';
export { FeatureB } from './feature-b.js';

// ✅ Import directly from source files
import { FeatureA } from './features/feature-a.js';
import { FeatureB } from './features/feature-b.js';
```

### Function Declarations

Prefer function declarations over arrow functions for module-level functions:

```javascript
// ❌ Arrow functions at module level
const processVideo = (videoId) => {
    // implementation
};

const validateUrl = (url) => {
    // implementation
};

// ✅ Function declarations at module level
function processVideo(videoId) {
    // implementation
}

function validateUrl(url) {
    // implementation
}
```

**Why function declarations are preferred:**
- Hoisted, so order doesn't matter
- Cleaner syntax for longer functions
- Better stack traces in debugging
- More conventional for module-level exports

## IDE Configuration

### VS Code

Recommended extensions:
- Prettier - Code formatter
- TypeScript and JavaScript Language Features (built-in)
- ESLint


## Linting

We use ESLint for code quality checks. See [`eslint.config.js`](eslint.config.js) for the current linting configuration.

Run linting with:

```bash
npm run lint
```

Follow the linting rules and fix any issues before committing code. 