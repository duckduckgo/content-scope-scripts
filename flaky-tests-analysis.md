# Flaky Tests Analysis - Content Scope Scripts

## Analysis Summary

Based on my examination of the codebase, test configurations, and test patterns, I've identified several areas where flaky tests may be occurring and need attention.

## Test Configuration Overview

### Playwright Configuration
- **Retry Policy**: Both `injected/` and `special-pages/` have `retries: process.env.CI ? 2 : 0` - tests retry up to 2 times on CI
- **Timeout Settings**: 
  - `injected/`: Global timeout 30s, expect timeout 5s, action timeout 1s
  - `special-pages/`: Action timeout 5s, expect timeout default
- **Parallel Execution**: Disabled on CI (`fullyParallel: !process.env.CI`)
- **Worker Threads**: Limited to 2 on CI
- **Video/Trace**: Captured on first retry only

## Potential Flaky Test Issues Identified

### 1. **Hard-coded Timeouts** (High Priority)
Several tests use `page.waitForTimeout()` which is a red flag for flaky behavior:

**History Tests** (`special-pages/pages/history/integration-tests/`)
- Multiple 100ms timeouts in `history.spec.js` (lines 156, 212, 214, 216)
- 50ms timeout in `history-selections.spec.js` (line 188)

**Activity Tests** (`special-pages/pages/new-tab/app/activity/integration-tests/activity.spec.js`)
- Two 500ms timeouts (lines 151, 153)

**New Tab Tests** (`special-pages/pages/new-tab/integration-tests/new-tab.spec.js`)
- 500ms timeout (line 52)

**Fingerprint Tests** (`injected/integration-test/fingerprint.spec.js`)
- 1000ms timeout (line 132)

**DuckPlayer Tests** (`injected/integration-test/`)
- 2000ms timeouts in e2e tests (lines 32, 42)
- 1000ms timeout in remote-config tests (line 30)

### 2. **Timing-Sensitive Tests** (Medium Priority)

**Broker Protection Tests** (`injected/integration-test/broker-protection-tests/`)
- Contains retry logic tests that may be sensitive to timing
- Tests for click actions that may depend on page load states

**Favicon Tests** (`injected/integration-test/favicon.spec.js`)
- Uses `waitForMessage` patterns that may timeout inconsistently

**Cookie Tests** (`injected/integration-test/cookie.spec.js`)
- Uses `setTimeout` with very short 1ms delays (lines 11, 33, 55)

### 3. **Network-Dependent Tests** (Medium Priority)

**Remote Pages Tests** (`injected/integration-test/remote-pages.spec.js`)
- Tests real websites with `waitUntil: 'networkidle'`
- Could fail due to network issues or site changes

**Favorites Tests** (`special-pages/pages/new-tab/app/favorites/integration-tests/favorites.spec.js`)
- Makes HTTP requests to external URLs
- Has logic waiting for specific request patterns

### 4. **Platform-Specific Tests** (Low-Medium Priority)

**Cross-Platform Coverage**
- Tests run on Windows, macOS, iOS, Android, and various browsers
- Different timing characteristics across platforms
- Mobile tests may be more prone to timing issues

## Recommended Actions

### Immediate (High Priority)
1. **Replace Hard-coded Timeouts**: Replace all `page.waitForTimeout()` calls with proper element/condition waiting
2. **History Tests**: Refactor to use `waitFor` conditions instead of fixed timeouts
3. **Activity Tests**: Use proper state waiting instead of 500ms delays

### Short-term (Medium Priority)
1. **Improve Broker Protection Tests**: Add better error handling and reduce timing dependencies
2. **Network Tests**: Add proper retry logic for network-dependent tests
3. **Cookie Tests**: Review if 1ms delays are actually needed

### Long-term (Low Priority)
1. **Test Stability Monitoring**: Implement test result tracking to identify patterns
2. **Platform-Specific Tuning**: Consider different timeout values for different platforms
3. **Test Parallelization**: Review if more parallel execution would help or hurt stability

## Configuration Recommendations

### Playwright Config Improvements
```javascript
// Consider increasing timeouts for flaky tests
use: {
    actionTimeout: 10000, // Increase from current 1000ms/5000ms
    navigationTimeout: 30000,
    // Add global expect timeout
    expect: {
        timeout: 10000
    }
}

// Consider test-specific retry logic
projects: [
    {
        name: 'flaky-tests',
        testMatch: ['**/history*.spec.js', '**/activity*.spec.js'],
        retries: 3, // More retries for known flaky tests
    }
]
```

## Test Files Requiring Attention

### High Priority (Immediate Action Needed)
1. `special-pages/pages/history/integration-tests/history.spec.js`
2. `special-pages/pages/history/integration-tests/history-selections.spec.js`
3. `special-pages/pages/new-tab/app/activity/integration-tests/activity.spec.js`
4. `injected/integration-test/fingerprint.spec.js`

### Medium Priority (Review Soon)
1. `injected/integration-test/broker-protection-tests/broker-protection.spec.js`
2. `injected/integration-test/remote-pages.spec.js`
3. `special-pages/pages/new-tab/app/favorites/integration-tests/favorites.spec.js`
4. `injected/integration-test/cookie.spec.js`

### Low Priority (Monitor)
1. `injected/integration-test/duckplayer.e2e.spec.js`
2. `injected/integration-test/duckplayer-remote-config.spec.js`
3. Platform-specific mobile tests

## Notes
- No current test failure logs were found in the repository
- The CI configuration already includes reasonable retry policies
- The test suite appears to be actively maintained with recent improvements
- Consider implementing a test failure tracking system to identify patterns over time