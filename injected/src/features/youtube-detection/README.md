# YouTube Detection Modules

Modular, lightweight YouTube detection system with shared utilities to avoid code duplication.

## Structure

```
youtube-detection/
├── shared/
│   ├── player-utils.js           # Player element finding, visibility checks
│   ├── detector-base.js           # Base class with observer/polling logic
│   └── video-events.js            # Video event tracking (loadstart, playing, waiting)
├── ad-detector.js                 # Ad detection implementation
├── user-type-detector.js          # User type detection (logged in, premium, etc.)
├── bot-detection-detector.js      # Bot detection screen detection
├── breakage-detector.js           # Playback error and breakage detection
└── README.md
```

## Shared Utilities

### `player-utils.js`
- `getPlayerRoot()` - Find YouTube player element
- `isVisible(element)` - Check if element is visible
- `getVideoId()` - Extract video ID from URL
- `getVideoElement(root)` - Find video element within player

### `detector-base.js`
Base class that handles:
- MutationObserver setup
- Periodic polling
- Player re-rooting detection
- Lifecycle management (start/stop)
- Node tracking (WeakSet to avoid duplicates)
- Debounced detection reporting

### `video-events.js`
- `VideoEventTracker` - Tracks video lifecycle events and timing metrics
  - Load start timing
  - Playing event with load duration
  - Buffering events (via video `waiting` event)

## Creating a New Detector

Extend `DetectorBase` and implement:

```javascript
import { DetectorBase } from './shared/detector-base.js'
import { isVisible } from './shared/player-utils.js'

export class MyDetector extends DetectorBase {
    constructor() {
        super({
            pollInterval: 2000,      // How often to sweep
            rerootInterval: 1000,    // How often to check for player changes
            waitForRootDelay: 500,   // Delay before retrying root find
            debounceDelay: 80        // Debounce for mutation events
        })
    }

    // Required: Check if a node matches detection criteria
    checkNode(node) {
        if (!(node instanceof HTMLElement)) return false
        if (!isVisible(node)) return false

        // Your detection logic here
        return node.classList.contains('my-target')
    }

    // Optional: Return nodes to check during sweep
    getNodesForSweep() {
        return Array.from(this.root?.querySelectorAll('.my-target') || [])
    }

    // Optional: Called when detection occurs
    onDetection(node, source) {
        console.log('Detected!', { node, source })
    }

    // Optional: Called during sweep (for cleanup checks)
    onSweep() {
        // Check if state has changed
    }

    // Optional: Called when detector starts
    onStart() {
        // Initialize your detector
    }

    // Optional: Called when detector stops
    onStop() {
        // Cleanup
    }
}
```

## Detectors

### `ad-detector.js`
Detects YouTube ads using DOM inspection. Extends `DetectorBase` for mutation observation and polling.

### `user-type-detector.js`
Detects user account type: not logged in, logged in, or premium. Uses DOM indicators and YouTube's config objects to determine user status.

### `bot-detection-detector.js`
Detects when YouTube flags the user as a bot or shows bot verification screens. Monitors for bot-related error messages and playability issues.

### `breakage-detector.js`
Detects video playback failures and errors such as "Something went wrong", "Video unavailable", and playback errors.

## Example Usage

### Ad Detector (extends DetectorBase)
```javascript
import { AdDetector } from './youtube-detection/ad-detector.js'

const detector = new AdDetector()
detector.start()

// Later...
detector.stop()
```

### User Type Detector
```javascript
import { UserTypeDetector, UserType } from './youtube-detection/user-type-detector.js'

const detector = new UserTypeDetector()
detector.start((userType) => {
    console.log('User type:', userType) // 'not_logged_in', 'logged_in', or 'premium'
})

// Later...
detector.stop()
```

### Bot Detection Detector
```javascript
import { BotDetectionDetector } from './youtube-detection/bot-detection-detector.js'

const detector = new BotDetectionDetector()
detector.start((detection) => {
    console.log('Bot detection:', detection.type, detection.reason)
})

// Later...
detector.stop()
```

### Breakage Detector
```javascript
import { BreakageDetector } from './youtube-detection/breakage-detector.js'

const detector = new BreakageDetector()
detector.start((breakage) => {
    console.log('Breakage detected:', breakage.type, breakage.reason)
})

// Later...
detector.stop()
```

## Benefits

1. **No duplication** - Common logic (observer, polling, re-rooting) is shared
2. **Lightweight** - Each detector focuses only on detection logic
3. **Consistent** - All detectors behave the same way
4. **Easy to add** - New detectors are simple to implement
5. **Maintainable** - Shared code fixes/improvements benefit all detectors

## Future Enhancements

The `VideoEventTracker` logs timing data that can be used for:
- Setting load time thresholds for performance monitoring
- Detecting abnormal buffering patterns
- Reporting metrics back to telemetry systems
