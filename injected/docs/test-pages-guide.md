# Test Pages Guide

## Overview

The test-pages system is a comprehensive testing framework for Content Scope Scripts that validates feature functionality across different platforms (Android, Apple, Windows, and browser extensions). These test pages are shared by clients and can be run both in browsers and in CI environments.

## Architecture

### Directory Structure

```
injected/integration-test/test-pages/
├── index.html                    # Main entry point
├── blank.html                    # Minimal page for extension testing
├── shared/                       # Shared utilities and styles
│   ├── utils.js                  # Test framework utilities
│   ├── style.css                 # Common styling
│   └── ...
├── {feature-name}/               # Feature-specific test directories
│   ├── index.html               # Feature test index
│   ├── pages/                   # Individual test pages
│   │   └── {test-name}.html     # Test page implementations
│   ├── config/                  # Feature configurations
│   │   └── {config-name}.json   # JSON configuration files
│   └── scripts/                 # Additional test scripts (optional)
└── ...
```

### Key Components

#### 1. Test Pages (`pages/*.html`)
Individual HTML pages that implement specific test scenarios. Each page:
- Loads the Content Scope Scripts
- Defines test cases using the `test()` function
- Validates expected outcomes against actual results
- Renders results in a standardized format

#### 2. Configuration Files (`config/*.json`)
JSON files that define feature configurations for testing:
- Feature states (enabled/disabled)
- Settings and parameters
- Conditional logic and exceptions
- Platform-specific configurations

#### 3. Shared Utilities (`shared/utils.js`)
Provides the testing framework:
- `test(name, testFunction)` - Define test cases
- `renderResults()` - Execute tests and display results
- Result collection and validation
- Automation support for CI environments

## How It Works

### Test Execution Flow

1. **Page Loading**: Test pages are loaded with Content Scope Scripts injected
2. **Configuration Application**: Feature configurations are applied based on the test scenario
3. **Test Execution**: Individual test cases run and validate expected outcomes
4. **Result Collection**: Results are collected and displayed in a standardized format
5. **Validation**: CI systems validate that all tests pass across different platforms

### Example Test Page

```html
<!DOCTYPE html>
<html>
<head>
    <title>Conditional Matching Test</title>
    <link rel="stylesheet" href="../../shared/style.css">
</head>
<body>
    <script src="../../shared/utils.js"></script>
    
    <script>
        test('Conditional matching', async () => {
            const results = [
                {
                    name: "APIs changing, expecting to always match",
                    result: navigator.hardwareConcurrency,
                    expected: 222
                }
            ];
            
            // Test logic here...
            
            return results;
        });

        renderResults();
    </script>
</body>
</html>
```

### Example Configuration

```json
{
    "readme": "This config tests conditional matching of experiments",
    "version": 1,
    "features": {
        "apiManipulation": {
            "state": "enabled",
            "settings": {
                "apiChanges": {
                    "Navigator.prototype.hardwareConcurrency": {
                        "type": "descriptor",
                        "getterValue": {
                            "type": "number",
                            "value": 222
                        }
                    }
                },
                "conditionalChanges": [
                    {
                        "condition": {
                            "urlPattern": "/test/*"
                        },
                        "patchSettings": [
                            {
                                "op": "replace",
                                "path": "/apiChanges/Navigator.prototype.hardwareConcurrency/getterValue/value",
                                "value": 333
                            }
                        ]
                    }
                ]
            }
        }
    }
}
```

## Platform Integration

### Cross-Platform Testing

The test pages are designed to work across multiple platforms:

- **Browser Extensions**: Tests run in extension context with injected content scripts
- **Android**: Tests run in WebView with platform-specific messaging
- **Apple**: Tests run in WKWebView with WebKit-specific implementations
- **Windows**: Tests run with Windows-specific global polyfills

### Platform-Specific Handling

The `ResultsCollector` class handles platform differences:

```javascript
// Platform-specific setup
await this.build.switch({
    windows: async () => {
        await this.page.addInitScript(windowsGlobalPolyfills);
    },
    apple: async () => {
        // WebKit-specific setup
    },
    android: async () => {
        // Android-specific setup
    }
});
```

## Available Test Categories

### 1. Infrastructure Tests (`infra/`)
- **Conditional Matching**: Tests URL-based conditional feature activation
- **Version Support**: Tests minimum supported version logic
- **API Manipulation**: Tests browser API modifications

### 2. Duck Player Tests (`duckplayer/`)
- **Overlays**: Tests video player overlay functionality
- **Player Integration**: Tests player component behavior
- **Thumbnail Handling**: Tests video thumbnail modifications

### 3. Broker Protection Tests (`broker-protection/`)
- **Form Filling**: Tests automated form interaction
- **Profile Extraction**: Tests user profile data collection
- **Action Execution**: Tests broker protection actions

### 4. API Manipulation Tests (`api-manipulation/`)
- **Browser APIs**: Tests modification of browser APIs
- **Message Handlers**: Tests communication between components

### 5. Web Compatibility Tests (`webcompat/`)
- **Shims**: Tests compatibility shims
- **Storage**: Tests localStorage and cookie modifications
- **HTTPS Upgrades**: Tests secure connection enforcement

### 6. Message Bridge Tests (`message-bridge/`)
- **Communication**: Tests message passing between components
- **Feature Toggles**: Tests feature enable/disable functionality

### 7. Autofill Tests (`autofill-password-import/`)
- **Password Import**: Tests password manager integration
- **Form Detection**: Tests automatic form detection and filling

### 8. Breakage Reporting Tests (`breakage-reporting/`)
- **Error Detection**: Tests detection and reporting of site breakages
- **User Feedback**: Tests user reporting mechanisms

## Running Tests

### Local Development

1. **Start the test server**:
   ```bash
   npm run serve
   ```

2. **Access test pages**:
   - Navigate to `http://localhost:3220/` for the main index
   - Browse to specific test categories and pages

### CI Integration

Tests are automatically run in CI environments:

```javascript
// Example CI test
test('Test infra', async ({ page }, testInfo) => {
    await testPage(
        page,
        testInfo,
        '/infra/pages/conditional-matching.html',
        './integration-test/test-pages/infra/config/conditional-matching.json',
    );
});
```

### Automation Mode

Test pages support automation mode for CI:

- Add `?automation=true` to URL
- Tests wait for Content Scope Scripts initialization
- Results are collected programmatically
- Standardized result format for validation

## Interactive and Automation Modes

### Manual (Interactive) Mode
- When the test page is loaded **without** `?automation=true` in the URL, a **"Run Tests" button** appears at the top of the page.
- This allows a human tester or a platform test harness to decide when to start the tests, rather than running them immediately on page load.
- Clicking the button will execute all defined tests and display the results.

### Automation Mode
- When the test page is loaded **with** `?automation=true` in the URL, tests will run automatically as soon as the Content Scope Scripts are initialized.
- This is used for CI and automated testing environments.

## Result Reporting and Visual Validation

- After the tests finish, the results are assigned to `window.results` as a standardized object.
- The results are also rendered as an HTML table on the page, with pass/fail indicators for each test case.
- This visual output can be used by visual testing tools (such as Maestro) to validate that the test run is complete and that all tests have passed.
- The test suite status is also displayed at the top of the page, showing "pass" or "fail" for the overall run.

## Result Format

Tests return results in a standardized format:

```javascript
{
    "Test Name": [
        {
            "name": "Specific test case",
            "result": "actual value",
            "expected": "expected value"
        }
    ]
}
```

Results are displayed in HTML tables with pass/fail indicators and can be collected programmatically for CI validation.

## Best Practices

### Writing Test Pages

1. **Use descriptive test names** that clearly indicate what is being tested
2. **Include multiple test cases** to cover different scenarios
3. **Test both positive and negative cases** where applicable
4. **Use realistic test data** that mimics real-world usage
5. **Include proper cleanup** for tests that modify state

### Writing Configurations

1. **Document the purpose** in the `readme` field
2. **Use semantic feature names** that match the codebase
3. **Include platform-specific configurations** when needed
4. **Test edge cases** and error conditions
5. **Keep configurations focused** on specific test scenarios

### Platform Compatibility

1. **Test across all platforms** to ensure consistency
2. **Handle platform-specific APIs** appropriately
3. **Use platform-agnostic test logic** when possible
4. **Validate messaging interfaces** work correctly
5. **Test fallback behaviors** for unsupported features

## Integration with Privacy Test Pages

The test pages are hosted at [https://privacy-test-pages.site/](https://privacy-test-pages.site/) and are used by:

- **DuckDuckGo clients** for validation
- **Platform teams** for cross-platform testing
- **CI systems** for automated validation
- **External developers** for integration testing

This ensures that Content Scope Scripts work consistently across all platforms and environments. 