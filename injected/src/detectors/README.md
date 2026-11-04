# Web Interference Detection

This directory holds the YouTube ad detector, which `webInterferenceDetection` runs on YouTube pages and `breakageReporting` runs for breakage reports. Config-driven detectors, including bot and fraud detection, are `webDetection` detectors ([`web-detection.js`](../features/web-detection.js)).

## Directory Layout

```
detectors/
├── detections/
│   └── youtube-ad-detection.js    # YouTube ad and ad-blocker interference detection
├── utils/
│   └── detection-utils.js         # DOM helpers (visibility, pattern compilation)
```

## Configuration

The detector reads `interferenceTypes.youtubeAds` from `privacy-configuration/features/web-interference-detection.json`:

```json
{
  "state": "enabled",
  "settings": {
    "interferenceTypes": {
      "youtubeAds": {
        "state": "enabled"
      }
    }
  }
}
```

The framework applies `conditionalChanges` for the current URL before passing settings to the feature.

## Using Detection Results

**`webInterferenceDetection`** starts the detector on YouTube and reports its events through `webEvents`.

**Breakage reporting** runs it on demand and sends its result as `detectorData.youtubeAds`:

```javascript
import { runYoutubeAdDetection } from '../detectors/detections/youtube-ad-detection.js';

const detectorSettings = this.getFeatureSetting('interferenceTypes', 'webInterferenceDetection');
if (detectorSettings) {
    result.detectorData = {
        youtubeAds: runYoutubeAdDetection(detectorSettings.youtubeAds),
    };
}
```

On Apple both features run in the isolated world, so the detector sees the page's DOM but not its script globals.
