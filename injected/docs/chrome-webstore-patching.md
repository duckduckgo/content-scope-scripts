---
title: Chrome Webstore Patching
---

# Chrome Webstore Patching

Patches the Chrome Web Store UI (`chromewebstore.google.com`) in the DuckDuckGo Windows and macOS browsers:

- Hides every extension install button via injected CSS before the page hydrates (**fail closed**)
- On detail pages for **curated** extensions, restyles the button as a DDG-branded pill (accent `#F05F2B`, radius 48px, per Figma) with "Add to DuckDuckGo" / "Remove from DuckDuckGo" copy
- On detail pages for **non-curated** extensions, shows a disabled grey pill (`#E4E4E4`) labelled "Unsupported extension" with an explanatory tooltip
- Hides "Switch to Chrome"-style promo banners (CSS only, no reveal path)

Pill styling values are deliberately literal in the feature (not remote config): they are DDG design tokens, not Google-shaped, so they don't rot with store markup. Hiding and revealing are deliberately asymmetric: the **hide** is a stylesheet rule (one per validated selector) because it has to cover buttons the store has not mounted yet, while the **reveal** is an inline `display: inline-flex !important` applied per button as part of the pill styling. Inline important beats the injected stylesheet, so no root attribute or other page-readable state is written. That is a privacy requirement, not a style preference: a marker on `<html>` would tell any script on the store that this is the DuckDuckGo browser and, per page, whether that extension is in our catalog, and it would let the page reveal buttons we decided to keep hidden. The navigation reset clears the inline `display` so those nodes fall back under the hide rule. The label is **feature-owned** (`span[data-ddg-webstore-label]`, appended to the button; every other child is hidden): live testing showed the store's internal label spans rotate between button states and re-renders, so writing into them is unreliable. A capture-phase click interceptor (registered at document-start, ahead of the store's delegated jsaction handler) blocks activation of the unsupported pill and re-evaluates install state after curated clicks, flipping the pill Add ↔ Remove without a navigation.

On Windows, install state comes from the page-world private API `chrome.webstorePrivate.getExtensionStatus()` — no native messaging. The store's existing handlers continue to perform install/removal, with status rechecks after 1.5 and 5 seconds. This path is unchanged by the macOS integration.

## macOS native integration

macOS uses `src/features/chrome-webstore-patching/macos.js` and does not access or create any `chrome.*` APIs. The feature is included in the Apple **page-world** bundle (`contentScope.js`), so the existing URL-change listener can observe the store's History API navigation. iOS explicitly skips the feature. Native must enable `chromeWebstorePatching` and its `patchWebstore` domain gate and supply the existing `extensionManagement.curatedExtensions` catalog, just as Windows does; adding it to the bundle alone does not enable it.

All messages are requests through the existing C-S-S messaging layer:

Machine-readable request/response schemas live in `injected/src/messages/chrome-webstore-patching/`; `npm run build-types -w injected` generates the corresponding typed feature contract.

- **Context:** `contentScopeScripts`
- **Feature name:** `chromeWebstorePatching`

| Method               | Parameters                                                                                   | Response result                                                                                                         |
| -------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `getExtensionStatus` | `{ "extensionId": "<32-character store ID>" }`                                               | `{ "status": "installable" }`, `{ "status": "installed" }`, `{ "status": "unsupported" }`, or `{ "status": "unknown" }` |
| `installExtension`   | `{ "extensionId": "<ID>", "crxUrl": "https://clients2.google.com/service/update2/crx?..." }` | `{ "success": true }` on completion, `{ "success": false }` on failure/cancellation                                     |
| `removeExtension`    | `{ "extensionId": "<ID>" }`                                                                  | `{ "success": true }` on completion, `{ "success": false }` on failure/cancellation                                     |

These are the request `params` and response `result`, inside the standard messaging envelopes. Native must return the final operation response **after** its stored status has been updated, not merely acknowledge that a download started. Native owns confirmation, progress, and error UI. Rejected operation requests are also supported. After any completion, including cancellation or rejection, the script queries status again; the `success` field is informational and does not determine button state. Unrecognized/malformed status responses or status request errors leave the button hidden.

On activation, macOS consumes the event before the store's document handlers, verifies a trusted user event and a current curated ID, and sends the native request. Mouse/touch clicks and Enter/Space are supported. Buttons for an extension stay hidden while its native operation is pending, including across SPA navigation; repeated activation cannot start another operation for that extension. Navigation invalidates older status responses, even when returning to the same ID.

### CRX download URL

The script constructs a Google update-service URL from the validated extension ID, following Chromium's [WebstoreInstaller download URL construction](https://raw.githubusercontent.com/chromium/chromium/main/extensions/browser/webstore_installer.cc). This is a **download URL that redirects to a CRX**, not the final, version-specific blob URL. Native follows the redirect and downloads the file; JavaScript does not fetch the package or depend on cross-origin fetch permissions.

Parameters are `response=redirect`, `acceptformat=crx3`, `prodversion=9999.0.0.0`, and an encoded `x=id=<ID>&installsource=ondemand&uc`. The deliberately high product version requests the latest package rather than claiming a Safari version is a Chrome version or pinning an arbitrary Chrome release. It does **not** assert compatibility with WebKit. Native must check package identity, CRX signature and supported extension APIs/manifest before installation. The URL was checked against the live endpoint with the curated Bitwarden ID and returned a redirect to a `.crx` file; package installation still needs verification in the macOS app.

Native must authorize these messages against the actual frame/origin and its own curated catalog, and validate the supplied URL/extension ID rather than treating page-provided parameters as installation authority.

### Completion and the store's JavaScript

There is no store install callback to invoke on macOS: the script intercepts activation before the store starts its Chromium-only flow. Native completion updates the feature-owned button via the subsequent status request. No fabricated `chrome.webstorePrivate` object, page event, or Google callback is required for this implementation. If the store later overwrites the button, the existing observer reapplies its current state.

The native handlers, macOS remote-config rollout and on-device verification live outside this repository. Test with no Chrome APIs: install and cancel an extension, remove it, navigate while installation is pending, and confirm the real store's button/promo selectors still match its WebKit-rendered DOM.

## Fail-closed contract

Every failure path degrades to "install button stays hidden", never to a working "Add to Chrome" for an uncurated extension: selector misses, a missing/erroring `webstorePrivate` API, unknown status strings, malformed config, and SPA navigations mid-decision (the verdict is reset before re-deciding, and a stale-response guard re-checks the URL after the status await). The one documented gap: a selector that matches nothing hides nothing, so selector rot on Google's side degrades to unpatched Chrome UI — hot-fix the selectors via remote config.

## Remote config

Feature key `chromeWebstorePatching` (schema: `privacy-configuration/schema/features/chrome-webstore-patching.ts`). All settings are top-level defaults; a single `domains` patch scoped to `chromewebstore.google.com` flips the `patchWebstore` gate:

| Setting                  | Purpose                                                                                                                                                                                                                                 |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `patchWebstore`          | `{state}` execution gate — disabled everywhere, enabled on the store domain via `domains` patch. `init()` early-returns unless enabled.                                                                                                 |
| `installButtonSelectors` | `{type: 'css'\|'xpath', value}` list targeting the install `<button>`. Every entry applies together (one hide rule each, matches unioned), not first-match-wins. Only `css` is consumed; see below. Primary: `button[jsname="wQO0od"]`. |
| `promoSelectors`         | Chrome promo banners to hide. Same `{type, value}` shape as above but `css` only, since promo hiding has no JS pass.                                                                                                                    |
| `apiDetectionTimeoutMs`  | Reserved for a future `webstorePrivate` retry/poll (POC does a single attempt).                                                                                                                                                         |

**`xpath` is accepted by the schema but not implemented**: entries of that type are dropped in `init()`, so none are shipped in the override. XPath is the rot-proof way to target the button (it can match on visible text, e.g. "Add to Chrome", which CSS cannot express at all), so it is worth adding eventually. The blocker is that the fail-closed hide has to be a stylesheet rule, since it must cover buttons the store has not rendered yet, and xpath cannot appear in a stylesheet. An xpath-only match would therefore be styled by the JS pass without ever having been hidden, which is worse than not matching. Wiring it up means a second, JS-driven hide path that trades a frame of flash for surviving selector rot. `promoSelectors` is typed `css`-only for the same reason, one step further: promos have no JS pass at all, so there would be nothing for an xpath entry to feed.

Both selector lists take `{type, value}` entries. `promoSelectors` previously took bare strings; that format was dropped rather than kept alongside, since the feature is internal-only and not yet enabled by default, so the worst case of a config update reaching a build before the release does is promo banners showing on internal builds.

Button copy is **not** remote config. `buttonCopy` used to be the only source, which meant a config without it resolved to no copy and left every button hidden; it was removed from the schema and the override once the bundled locale strings took over. See Localization below.

Curated extension IDs are **not** duplicated here — they are read from the native `extensionManagement` feature's `curatedExtensions.settings.catalog` via `bundledConfig` (sub-feature settings are not copied into `featureSettings`, so `getFeatureSetting` cannot reach them). Any shape mismatch there degrades to an empty catalog → everything hidden.

Both `extensionManagement` and `curatedExtensions` are state-gated, and that check is `ConfigFeature#_isStateEnabled`, passed into `readCuratedCatalog` rather than reimplemented. It has to be platform-aware, because `internal` and `preview` are only on when the matching platform flag is set. A bare string comparison gets this wrong in both directions: it misses `preview`, the state shipped during a phased rollout, so the catalog reads as empty and every curated extension shows the "Unsupported extension" pill (this shipped, and was caught on Canary); and it treats `internal` as on for public builds, which would offer a working install button to a browser that cannot install extensions.

Internal builds read `curatedExtensions.settings.catalogInternal` instead of `catalog`, matching the native behaviour, so extensions still being trialled are offered internally while the public catalog stays narrower. It replaces the public list rather than extending it. Older configs have no `catalogInternal`, so its absence falls back to `catalog`; since that is the narrower list, the fallback cannot widen what an internal user is offered.

## Localization

Button copy lives in `injected/src/locales/chrome-webstore-patching/<locale>/chrome-store-strings.json` (`en` is the source of truth; other locales come from the translation pipeline), bundled by `scripts/buildLocales.js` into `build/locales/chrome-webstore-patching-locales.js` as part of `npm run build`. The locale comes from the platform init args (`args.locale || args.language || 'en'`, the duck-player pattern — never from remote config). Resolution order per string: bundled locale → bundled English. Remote config is not consulted, so English lives in `en/chrome-store-strings.json` alone and cannot drift from a second copy. The fail-closed rule is unchanged: a verdict whose copy resolves to nothing keeps the button hidden.

The file is named for the feature rather than a generic `strings.json` because Smartling scopes one project per repo, so every locale file in it must be distinguishable by name (`click-to-load` and `duckplayer` follow the same rule). `buildLocales.js` keys the bundle by filename, so renaming it means updating `STRINGS_FILE` in the feature.

## Testing

- Unit (Jasmine): `injected/unit-test/chrome-webstore-patching.spec.js` covers only the pure helpers in `src/features/chrome-webstore-patching/helpers.js`: ID parsing, the catalog contract, and the `chrome.*` type guards. The specs deliberately do not import the feature module, which pulls in SVG assets that plain Node cannot load. Copy resolution and the live `webstorePrivate` calls are covered by integration instead. Keep new pure logic in the helpers module so this stays true.
- Integration (Playwright, `windows` project): `injected/integration-test/chrome-webstore-patching.spec.js` against fixtures in `integration-test/test-pages/chrome-webstore-patching/`. `chrome.webstorePrivate` is mocked via `page.addInitScript`; the mock installs a `window.chrome` accessor because the windows messaging test harness later reassigns `window.chrome`. Config fixtures retarget the `domains` patch to `localhost`.
- Fixtures ship the feature at `state: "internal"`, matching the windows override, so `setup()` reports an internal build by default. A new spec that bypasses that helper must pass `platform.internal`, or the feature will silently not load and any "feature inert" assertion will pass for the wrong reason. `setup(page, testInfo, { internal: false })` covers the public-build case on purpose.
- Run: `npx playwright test --project=windows chrome-webstore-patching --reporter=list`
- macOS: `injected/integration-test/chrome-webstore-patching-macos.spec.js` uses the Apple bundle and mocked native requests. It covers native status/install/removal, rejected/cancelled operations, keyboard input, synthetic-event rejection, pending operations, stale status responses, DOM re-renders, configuration gates and iOS exclusion. Run from `injected/`: `npx playwright test --project=apple --project=windows chrome-webstore-patching --reporter list`.

Still requires manual verification on a Windows internal build: real `webstorePrivate` availability/status strings, install/uninstall events, promo markup (only renders on de-Googled Chromium), and real store DOM against the fixture snapshots.
