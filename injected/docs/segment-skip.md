---
title: SegmentSkip
---

# SegmentSkip

Skips sponsored segments in YouTube videos using [SponsorBlock](https://sponsor.ajay.app/) data that native fetches. The feature owns everything that needs the DOM or player state; native owns trust, network, hashing, caching, user settings and remote config. The page sends an 11-character video ID and gets back that video's segments; how native produces them is invisible to the page by design.

Shipped in the Apple **isolated-world** bundle (`contentScopeIsolated.js`) and in the Android and Windows bundles, which run in the page's main world. The MVP is internal-only.

## What the feature does

- **Video detection:** reads the video ID from watch, shorts, live and embed URLs on load, on SPA navigation and whenever a video element starts loading. Responses that arrive after the user moved to another video are discarded.
- **Config:** on init it subscribes to `onConfigChanged`, then calls `getConfig`. Nothing is requested or drawn until native says `enabled`. A rejected `getConfig` (no handler on this build) leaves the feature disabled.
- **Rendering:** draws the segments on the player's progress bar in `#FAB341`. The skip button is mounted in a closed shadow root over the player, so YouTube's scripts cannot query or restyle it.
- **Skip:** in `manual` mode a button appears while playback is inside a segment and seeks to its end on click. On m.youtube.com and the mobile Duck Player embed it shows only while YouTube's controls layer is hidden (matched by `controlsVisibleSelectors`), paused or not, so it never covers it. On desktop youtube.com and its embed (macOS, iPad) it stays up whether the controls show or not. It hides after 8 seconds of playback with the button on screen and stays hidden until playback leaves that segment. In `auto` mode playback seeks past a segment as soon as it enters it naturally; a segment the user seeks into gets the button instead, so seeking back never re-skips.
- **Duck Player icon:** while playback is inside a segment, or the skip or undo button is up, `<html>` gets `data-ddg-segmentskip-busy`, and Duck Player's in-player "Watch in Duck Player" icon (`.ddg-overlay[data-size^="video-player"]`) is hidden so the two don't overlap.
- **Duration check:** a segment whose `videoDuration` differs from the player's duration by more than 2 s is ignored, since the video was re-cut after submission.
- **Ads:** while an ad plays (matched by `adShowingSelectors`) no markers are drawn, no button is shown and nothing is seeked.
- **Selector miss:** no UI and no errors.

## Frame rules

The feature activates in:

- the top frame of `youtube.com` and `m.youtube.com`;
- the top frame of `youtube-nocookie.com`, which is how iOS Duck Player loads the video;
- a `youtube-nocookie.com` frame whose ancestors are all nocookie pages, which is macOS Duck Player's embed.

Embeds on any other site never activate it.

## Messaging

Schemas live in `injected/src/messages/segment-skip/`; `npm run build-types -w injected` generates the typed contract. The contract is versioned through `getConfig`'s `version`, currently `1`.

- **Context:** `contentScopeScriptsIsolated` on Apple, `contentScopeScripts` on Windows
- **Feature name:** `segmentSkip`

| Method            | Kind         | Parameters              | Result / payload                                                                                                                              |
| ----------------- | ------------ | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `getConfig`       | request      | `{}`                    | `{ enabled: boolean, skipMode: "manual" \| "auto", version: number }`. `enabled` is true only when the user opted in and the setting is on    |
| `getSegments`     | request      | `{ videoID: string }`   | `{ segments: Segment[] }` sorted by start; empty when the video has none or the feature is disabled. Native never rejects for lookup failures |
| `onConfigChanged` | subscription | `{ enabled, skipMode }` | pushed to every YouTube tab when the user changes a setting                                                                                   |

`Segment` is `{ start, end, category, actionType, uuid, videoDuration? }`, times in seconds. Native chooses the categories and action types from remote config and user settings; the page does not ask for them.

## Remote config

```json
"segmentSkip": {
  "state": "internal",
  "exceptions": [],
  "settings": {
    "progressBarSelectors": [".ytp-progress-bar", "..."],
    "skipButtonHostSelectors": ["#player-container-id", "#player-controls", "#movie_player", ".html5-video-player"],
    "adShowingSelectors": [".ad-showing"],
    "controlsVisibleSelectors": ["#player-control-overlay.fadein"]
  }
}
```

Each selector list is ordered: the first selector with a visible match wins. The feature falls back to in-code defaults when a key is absent, drops malformed entries, and treats an empty list as "no UI for this piece".

`controlsVisibleSelectors` fails open: an empty list, or no visible match, counts as "controls hidden", so a selector that breaks after a YouTube change leaves the button showing as it did before the check existed. The default covers m.youtube.com and the mobile Duck Player embed, which add `fadein` to their controls layer while it shows. Desktop youtube.com and its embed (macOS, and iPad, which gets the desktop site) have no such layer, so the button ignores their controls on purpose. While the button is mounted, a `MutationObserver` on its host's `class` attributes re-checks it, since toggling the controls fires no media event. `categories` and `actionTypes` are read by native only.

The feature loads only when the remote config names `segmentSkip` with a state that resolves to enabled for the platform; without an entry, or with `disabled`, its `init` never runs and no message is sent. To test before the entry ships, point the app at a custom privacy config that includes it.

## Testing

- Unit: `injected/unit-test/segment-skip.js` covers URL parsing, the frame rule, segment geometry, the duration check, selector settings and the config flow.
- Integration: `injected/integration-test/segment-skip.spec.js` (projects `apple-isolated`, `android` and `windows`) runs a fake player served under youtube.com URLs with mocked native responses, covering rendering, manual and auto skip, `onConfigChanged`, ads, navigation, selector miss and the frame rules.
