# YouTube Ad Detection

Technical documentation for the YouTube ad and issue detection system.

## Overview

The YouTube detector runs continuously on YouTube pages to identify ads, playback issues, and other interference that may indicate breakage or degraded experience. Detection data can be included in user breakage reports to provide context for debugging.

## How Detection Runs

1. **Auto-initialization**: Detector starts automatically when hostname includes `youtube.com` (matches `www.youtube.com`, `music.youtube.com`, `m.youtube.com`, etc.)
2. **DOM Polling**: Every 2 seconds, scans the video player DOM for ad indicators and issues
3. **Video Events**: Listens to `<video>` element events (`loadstart`, `playing`, `waiting`, `seeking`) for timing data
4. **SPA Navigation**: Intercepts `history.pushState`/`replaceState` to detect YouTube's client-side page transitions
5. **Player Re-rooting**: Checks every 1 second if the player DOM element was rebuilt. YouTube's SPA sometimes destroys and recreates the entire player subtree during navigation, which orphans our event listeners. When detected, reinitializes with the new player element.

## Detection Cases

### User Login State

Determines if user is logged in, logged out, or has Premium.

**How it works:**
- Looks for sign-in button link: `a[href*="accounts.google.com/ServiceLogin"]` → logged out
- Looks for avatar button: `#avatar-btn` → logged in
- Looks for Premium branding: `ytd-topbar-logo-renderer a[title*="Premium"]` → premium

**Retry logic:** YouTube's SPA may not render auth UI immediately. Retries up to 5 times with increasing delays if initial state is "unknown".

**Output:** `userState: 'logged-in' | 'logged-out' | 'premium' | 'unknown'`

---

### Video Ads

Detects in-video advertisements.

**How it works:**
- Checks for ad-specific CSS classes within the player element (9 classes total including `ad-showing`, `ad-interrupting`, `ytp-ad-text`, `ytp-ad-skip-button`, `ytp-ad-player-overlay`, `video-ads`, etc.)
- Matches text patterns: `\badvertisement\b`, `\bskip ad\b`, `\bskip ads\b`, `^ad\s*[•:·]`
- Only counts elements that are actually visible (checks dimensions > 0.5px, display !== 'none', visibility !== 'hidden', opacity > 0.05)

**State tracking:** Increments count only when transitioning from no-ad → ad state (not on every poll).

**Output:** `adsDetected: number`

---

### Static Overlay Ads

Detects image ads displayed over the player before video starts.

**How it works:**
- Looks for visible `.player-container-background` element
- Checks for image content inside (via `yt-image img` with src) - if visible, counts as static ad
- Alternatively, checks for visible thumbnail elements - if visible AND video not playing (`video.paused && video.currentTime < 1`), counts as static ad

**Why separate:** These appear as static images over a non-playing video, distinct from video ad content.

**Output:** `staticAdsDetected: number`

---

### Playability Errors

Detects when YouTube blocks playback (bot detection, content restrictions).

**How it works:**
- Scans error container selectors: `ytm-player-error-message-renderer`, `yt-player-error-message-renderer`, `.ytp-error`, `.playability-status-message`, `.playability-reason`
- Matches error text patterns (7 patterns including):
  - "content isn't available"
  - "video (is )?unavailable"
  - "confirm you're not a (ro)?bot"
  - "unusual traffic"
  - "sign in to confirm", "playback (is )?disabled", "try again later"

**Output:** `playabilityErrorsDetected: number`

---

### Ad Blocker Detection Modals

Detects YouTube's "Ad blockers are not allowed" enforcement messages.

**How it works:**
- Checks dialog/modal selectors (6 selectors including `ytd-enforcement-message-view-model`, `tp-yt-paper-dialog`, `[role="dialog"]`, `#dialog`)
- Matches text patterns (14 patterns including):
  - "ad blockers are not allowed"
  - "disable.*ad blocker" / "turn off.*ad blocker"
  - "will be blocked after X videos" / "playback is blocked"
  - "violate.*terms of service"
- Falls back to checking any visible `[role="dialog"]` or `[aria-modal="true"]` element if pattern matches body text

**Output:** `adBlockerDetectionCount: number`

---

### Buffering / Slow Loads

Detects excessive buffering that may indicate playback degradation.

**How it works:**

*Initial load buffering:*
- Tracks time from `loadstart` event to `playing` event
- Counts as buffering if: load time > 2 seconds AND not during ad AND tab was visible AND load time < 30 seconds

*Mid-playback buffering:*
- Listens for `waiting` events on the video element
- Counts as buffering if: `currentTime >= 0.5` AND not during ad AND not seeking/recently seeked (within 3s)

**Output:** `bufferingCount: number`, `bufferAvgSec: number` (rounded to whole seconds)

## Output Format

```javascript
{
  detected: true,
  type: 'youtubeAds',
  results: [{
    adsDetected: 3,
    staticAdsDetected: 0,
    playabilityErrorsDetected: 0,
    adBlockerDetectionCount: 1,
    bufferingCount: 2,
    bufferAvgSec: 4,
    userState: 'logged-in'
  }]
}
```

## Debug Helper

Console helper for manual inspection:

```javascript
window.ytAdDetectorDebug()
```

Outputs current detection counts, buffering stats, login state indicators, video element state, and performance metrics (sweep timings).

## Privacy Notes

- No video IDs in output—only aggregate counts
- Buffering times rounded to whole seconds
- Data stays in module-level memory until collected via `runYoutubeAdDetection()`
