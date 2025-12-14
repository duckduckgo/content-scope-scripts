# Web Interference Detection

This directory contains web interference detection functionality for content-scope-scripts. Detectors identify CAPTCHAs, fraud warnings, and other interference patterns to support breakage reporting and PIR automation.

## Architecture

The system provides simple detection utilities that can be called on-demand:

- **Detection utilities** - Pure functions (`runBotDetection`, `runFraudDetection`) that scan DOM when called
- **Direct imports** - Features (breakage reporting, PIR) import detection functions directly
- **`WebInterferenceDetection`** - Optional ContentFeature wrapper for messaging (PIR use, not currently bundled)


## Directory Layout

```
detectors/
├── detections/
│   ├── bot-detection.js           # CAPTCHA/bot detection utility
│   └── fraud-detection.js         # fraud/phishing warning utility
├── utils/
│   └── detection-utils.js         # DOM helpers (selectors, text matching, visibility)
```

## How It Works

### 1. On-Demand Detection

Detectors are simple functions that scan the DOM when called:

1. Feature imports detector function (e.g., `runBotDetection`)
2. Feature calls detector with config when needed (e.g., user submits breakage report)
3. Detector scans DOM and returns results immediately (~few ms)
4. No caching - each call is fresh

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

**Breakage reporting** (internal feature):

```javascript
import { runBotDetection, runFraudDetection } from '../detectors/detections/bot-detection.js';

// Get detector config from privacy-configuration
const detectorSettings = this.getFeatureSetting('webInterferenceDetection', 'interferenceTypes');

if (detectorSettings) {
    const result = {
        botDetection: runBotDetection(detectorSettings.botDetection),
        fraudDetection: runFraudDetection(detectorSettings.fraudDetection),
    };
}
```

**PIR/native** (via messaging, when `WebInterferenceDetection` is bundled):

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
export function runMyDetection(config = {}) {
    // Run detection logic
    const detected = checkSelectors(config.selectors);

    return {
        detected,
        type: 'myDetector',
        results: [...],
    };
}
```

2. **Use in breakage reporting or other feature**:

```javascript
// features/breakage-reporting.js
import { runMyDetection } from '../detectors/detections/my-detector.js';

const detectorSettings = this.getFeatureSetting('webInterferenceDetection', 'interferenceTypes');
if (detectorSettings?.myDetector) {
    result.myDetectorData = runMyDetection(detectorSettings.myDetector);
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

## Performance

- Detectors are simple DOM queries - typically < 5ms
- No caching overhead or stale results
- Only run when explicitly needed (e.g., breakage report submitted)
- Future: If frequent polling is needed, add a shared caching wrapper
