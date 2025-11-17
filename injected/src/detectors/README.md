# Web Interference Detection

This directory contains web interference detection functionality for content-scope-scripts. Detectors identify CAPTCHAs, fraud warnings, and other interference patterns to support breakage reporting and PIR automation.

## Architecture

The system uses a **ContentFeature** wrapper with simple detection utilities:

- **`WebInterferenceDetection`** - ContentFeature that auto-runs detectors on page load
- **Detection utilities** - Pure functions (`runBotDetection`, `runFraudDetection`) with module-level caching
- **Direct imports** - Other features (breakage reporting, PIR) import detection functions directly


## Directory Layout

```
detectors/
├── detections/
│   ├── bot-detection.js           # CAPTCHA/bot detection utility
│   └── fraud-detection.js         # fraud/phishing warning utility
├── utils/
│   └── detection-utils.js         # DOM helpers (selectors, text matching, visibility)
└── default-config.js              # fallback detector settings
```

## How It Works

### 1. Initialization

The `WebInterferenceDetection` ContentFeature runs detectors automatically:

1. Feature loads via standard content-scope-features lifecycle
2. `init()` method schedules detectors to run after `autoRunDelayMs` (default: 100ms)
3. Each detector runs once and caches results in module scope
4. Other features can import and call detection functions to get cached results

### 2. Configuration

Detectors are configured via `privacy-configuration/features/web-interference-detection.json`:

```json
{
  "state": "enabled",
  "settings": {
    "autoRunDelayMs": 100,
    "interferenceTypes": {
      "botDetection": {
        "hcaptcha": {
          "state": "enabled",
          "vendor": "hcaptcha",
          "selectors": [".h-captcha"],
          "windowProperties": ["hcaptcha"]
        }
      },
      "fraudDetection": {
        "phishingWarning": {
          "state": "enabled",
          "type": "phishing",
          "selectors": [".warning-banner"]
        }
      }
    }
  }
}
```

**Domain-specific configuration** using `conditionalChanges`:

```json
{
  "settings": {
    "conditionalChanges": [
      {
        "condition": {
          "urlPattern": "https://*.example.com/*"
        },
        "patchSettings": [
          {
            "op": "add",
            "path": "/interferenceTypes/customDetector",
            "value": { "state": "enabled", "selectors": [".custom"] }
          }
        ]
      }
    ]
  }
}
```

The framework automatically applies conditional changes based on the current URL before passing settings to the feature.

### 3. Using Detection Results

**Internal features** (same content script context):

```javascript
import { runBotDetection, runFraudDetection } from '../detectors/detections/bot-detection.js';

// Get cached results from auto-run
const botData = runBotDetection();
const fraudData = runFraudDetection();
```

**External:**

```javascript
// Via messaging
this.messaging.request('detectInterference', {
  types: ['botDetection', 'fraudDetection']
});
```

## Adding New Detectors

1. **Create detection utility** in `detections/`:

```javascript
// detections/my-detector.js
let cachedResult = null;

export function runMyDetection(config = {}, options = {}) {
    if (cachedResult && !options.refresh) return cachedResult;

    // Run detection logic
    const detected = checkSelectors(config.selectors);

    cachedResult = {
        detected,
        type: 'myDetector',
        timestamp: Date.now(),
    };

    return cachedResult;
}
```

2. **Add to WebInterferenceDetection feature**:

```javascript
// features/web-interference-detection.js
import { runMyDetection } from '../detectors/detections/my-detector.js';

init(args) {
    const settings = this.getFeatureSetting('interferenceTypes');

    setTimeout(() => {
        if (settings?.myDetector) {
            runMyDetection(settings.myDetector);
        }
    }, autoRunDelayMs);
}
```

3. **Add config** to `web-interference-detection.json`:

```json
{
  "settings": {
    "interferenceTypes": {
      "myDetector": {
        "state": "enabled",
        "selectors": [".my-selector"]
      }
    }
  }
}
```

## Caching Strategy

- **Module-level cache**: Each detector uses a simple variable (`let cachedResult = null`)
- **Automatic**: First call runs detection and caches, subsequent calls return cached result
- **Per-tab**: Each browser tab has its own cache (separate content script instance)
- **Lifetime**: Cache persists for page lifetime, cleared on navigation
- **Refresh option**: Callers can force fresh detection with `{ refresh: true }`

**Examples:**
```javascript
// Get cached result (fast)
const data = runBotDetection(config);

// Force fresh scan (slower, bypasses cache)
const freshData = runBotDetection(config, { refresh: true });

// Via messaging (native layer)
messaging.request('detectInterference', {
  types: ['botDetection'],
  refresh: true  // Optional: force rescan
});
```
