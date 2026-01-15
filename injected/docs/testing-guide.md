# Testing Guide

## Overview

Depending on what you are changing, you may need to run the build processes locally, or individual tests. The following all run within GitHub Actions when you create a pull request, but you can run them locally as well.

## Quick Test Command

If you want to get a good feeling for whether a PR or CI run will pass/fail, you can run the `test` command which chains most of the following together:

```shell
# run this if you want some confidence that your PR will pass
npm test
```

## Individual Test Commands

### ESLint

See root-level package for lint commands

### TypeScript

See root-level package for TypeScript commands

### Unit Tests (Jasmine)

Everything for unit-testing is located in the `unit-test` folder. Jasmine configuration is in `unit-test/jasmine.json`.

```shell
npm run test-unit
```

### Feature Integration Tests (Playwright)

Everything within `integration-test` is integration tests controlled by Playwright.

```shell
npm run test-int
```

**Important**: When writing integration tests, follow the [testing best practices](../docs/test-pages-guide.md#testing-best-practices) outlined in the Test Pages Guide. These guidelines cover avoiding custom state in spec files, using platform configuration, and preferring config-driven testing approaches.

**Preferred Testing Approach**: The [Test Pages Guide](../docs/test-pages-guide.md) describes the most preferred type of testing for the `/injected` directory. Test pages are the preferred approach where possible because they are **sharable with platforms** - the same test pages can be used by Android, Apple, Windows, and browser extension teams, ensuring consistent functionality validation across all platforms.

### Feature Build Process

To produce all artefacts that are used by platforms, just run the `npm run build` command. This will create platform specific code within the `build` folder (that is not checked in).

```shell
npm run build
```

## Test Builds for Ship Review

Test builds are created with a GitHub workflow. The assets for Content Scope Scripts will be created on demand if they are absent (which they will be, if you're pointing to a branch of C-S-S).

1. Commit any changes to C-S-S and push a branch to the remote
2. Make sure you commit the submodule reference update in the Windows PR
3. Continue with "Build an installer for ship review / test"

## Debugging

### Adding Breakpoints

If you drop a `debugger;` line in the scripts and open DevTools window, the DevTools will breakpoint and navigate to that exact line in code when the debug point has been hit.

### Verifying C-S-S is Loaded

Open DevTools, go to the Console tab and enter `navigator.duckduckgo`. If it's defined, then Content Scope Scripts is running.

## Testing Best Practices

### Test Independence

Playwright tests must be independent for safe parallel execution:

```javascript
// ✅ Each test is self-contained
test('overlay displays correctly', async ({ page }) => {
    const overlays = OverlaysPage.create(page);
    await overlays.openPage(url);
    await expect(overlays.element).toBeVisible();
});

// ❌ Avoid shared state between tests
let sharedPage; // Don't do this
```

Use Playwright's [test fixtures](https://playwright.dev/docs/test-fixtures) for complex setup.

### Async/Await

Always `await` async operations—missing `await` causes flaky tests:

```javascript
// ✅ Correct
await overlays.opensShort(url);

// ❌ Test passes incorrectly (promise not awaited)
overlays.opensShort(url);
```

### Glob Patterns

Use specific patterns to avoid including non-test files:

```javascript
// ✅ Correct - only .spec.js files
'integration-test/**/*.spec.js';

// ❌ Incorrect - includes config, fixtures, etc.
'integration-test/**';
```

### Feature Flag Testing

Match test setup to the feature state being tested:

```javascript
// Testing disabled state
test('feature disabled shows fallback', async ({ page }) => {
    await page.addInitScript(() => {
        window.__ddg_config__ = { features: { myFeature: { state: 'disabled' } } };
    });
    // ...
});
```

### Security-Sensitive Code

Extract DOM manipulation and HTML generation to separate files for focused unit testing. This prevents XSS vulnerabilities from slipping through integration-only testing.

## Integration Test Structure

### Test Page Directory Layout

```
integration-test/
├── test-pages/
│   └── <feature-name>/
│       ├── config/
│       │   └── config.json       # Feature config fixtures
│       ├── pages/
│       │   └── test-page.html    # Test HTML pages
│       └── <feature-name>.spec.js # Playwright tests
```

### Config Fixture Pattern

Create config fixtures that match privacy-configuration schema:

```json
{
    "features": {
        "featureName": {
            "state": "enabled",
            "settings": {
                "settingName": "value",
                "conditionalChanges": [
                    {
                        "condition": { "domain": "localhost" },
                        "patchSettings": [{ "op": "replace", "path": "/settingName", "value": "testValue" }]
                    }
                ]
            }
        }
    }
}
```

### Playwright Test Pattern

```javascript
test('feature behavior', async ({ page }) => {
    await page.goto('/test-pages/feature/pages/test.html');

    // Wait for feature initialization
    await page.waitForFunction(() => window.__ddg_feature_ready__);

    // Test feature behavior
    const result = await page.evaluate(() => someAPI());
    expect(result).toBe(expectedValue);
});
```

For conditional changes and config schema details, see the [injected cursor rules](../AGENTS.md).
