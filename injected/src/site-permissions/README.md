# Site permissions (Apple)

Standalone scripts the iOS `SitePermissions` package injects to route geolocation and camera/microphone requests through the app's per-site permission flow:

| Source | Apple resource | Swift user script |
|--------|----------------|-------------------|
| `geolocation.js` | `sitePermissionsGeolocation.js` | `GeolocationUserScript` (page world) |
| `geolocation-policy.js` | `sitePermissionsGeolocationPolicy.js` | `GeolocationPolicyUserScript` (isolated world) |
| `media-capture.js` | `sitePermissionsMediaCapture.js` | `MediaCaptureUserScript` (page world) |

They are not content-scope features. `npm run copy-site-permissions` copies them verbatim into `Sources/ContentScopeScripts/dist/`, and native code fills the `${...}` placeholders when loading them. The tests in apple-browsers (`iOS/LocalPackages/SitePermissions/Tests`) assert on their exact source, so this folder is excluded from Prettier and TypeScript checking. Keep message names and fields in sync with the Swift user scripts.
