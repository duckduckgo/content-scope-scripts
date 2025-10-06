# YouTube Detection Modules

Modular, lightweight YouTube detection system with shared utilities to avoid code duplication.

## Structure

```
youtube-detection/
├── shared/
│   ├── player-utils.js      # Player element finding, visibility checks
│   ├── detector-base.js      # Base class with observer/polling logic
│   └── video-events.js       # Video event tracking (loadstart, playing, waiting)
├── ad-detector.js            # Ad detection implementation
├── buffer-detector.js        # Buffer detection implementation
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
- `VideoEventTracker` - Tracks video lifecycle events
  - Load start timing
  - Playing event with load duration
  - Buffering detection

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

## Example: Buffer Detector

```javascript
const detector = new BufferDetector()
detector.start()

// Later...
detector.stop()
```

## Benefits

1. **No duplication** - Common logic (observer, polling, re-rooting) is shared
2. **Lightweight** - Each detector is ~50 lines focused on detection logic
3. **Consistent** - All detectors behave the same way
4. **Easy to add** - New detectors are simple to implement
5. **Maintainable** - Shared code fixes/improvements benefit all detectors
