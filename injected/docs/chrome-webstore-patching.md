---
title: Chrome Webstore Patching
---

# Chrome Webstore Patching

Patches the Chrome Web Store UI (`chromewebstore.google.com`) in the DuckDuckGo Windows browser:

- Hides every extension install button via injected CSS before the page hydrates (**fail closed**)
- On detail pages for **curated** extensions, restyles the button as a DDG-branded pill (accent `#F05F2B`, radius 48px, per Figma) with "Add to DuckDuckGo" / "Remove from DuckDuckGo" copy
- On detail pages for **non-curated** extensions, shows a disabled grey pill (`#E4E4E4`) labelled "Unsupported extension" with an explanatory tooltip
- Hides "Switch to Chrome"-style promo banners (CSS only, no reveal path)

Pill styling values are deliberately literal in the feature (not remote config): they are DDG design tokens, not Google-shaped, so they don't rot with store markup. Hiding and revealing are deliberately asymmetric: the **hide** is a stylesheet rule (one per validated selector) because it has to cover buttons the store has not mounted yet, while the **reveal** is an inline `display: inline-flex !important` applied per button as part of the pill styling. Inline important beats the injected stylesheet, so no root attribute or other page-readable state is written. That is a privacy requirement, not a style preference: a marker on `<html>` would tell any script on the store that this is the DuckDuckGo browser and, per page, whether that extension is in our catalog, and it would let the page reveal buttons we decided to keep hidden. The navigation reset clears the inline `display` so those nodes fall back under the hide rule. The label is **feature-owned** (`span[data-ddg-webstore-label]`, appended to the button; every other child is hidden): live testing showed the store's internal label spans rotate between button states and re-renders, so writing into them is unreliable. A capture-phase click interceptor (registered at document-start, ahead of the store's delegated jsaction handler) blocks activation of the unsupported pill and re-evaluates install state after curated clicks, flipping the pill Add ↔ Remove without a navigation.

Install state comes from the page-world private API `chrome.webstorePrivate.getExtensionStatus()` — no native messaging.

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

Button copy ships in the feature as `DEFAULT_COPY`, not in remote config. Config was the only source at first, which meant a config without `buttonCopy` resolved to no copy and left every button hidden. The setting was removed from the schema and the override: the localization work supersedes it, and the bundled locale strings become the source once that lands.

Curated extension IDs are **not** duplicated here — they are read from the native `extensionManagement` feature's `curatedExtensions.settings.catalog` via `bundledConfig` (sub-feature settings are not copied into `featureSettings`, so `getFeatureSetting` cannot reach them). Any shape mismatch there degrades to an empty catalog → everything hidden.

## Testing

- Unit (Jasmine): `injected/unit-test/chrome-webstore-patching.spec.js` covers only the pure helpers in `src/features/chrome-webstore-patching/helpers.js`: ID parsing, the catalog contract, and the `chrome.*` type guards. The specs deliberately do not import the feature module, which pulls in SVG assets that plain Node cannot load. Copy resolution and the live `webstorePrivate` calls are covered by integration instead. Keep new pure logic in the helpers module so this stays true.
- Integration (Playwright, `windows` project): `injected/integration-test/chrome-webstore-patching.spec.js` against fixtures in `integration-test/test-pages/chrome-webstore-patching/`. `chrome.webstorePrivate` is mocked via `page.addInitScript`; the mock installs a `window.chrome` accessor because the windows messaging test harness later reassigns `window.chrome`. Config fixtures retarget the `domains` patch to `localhost`.
- Fixtures ship the feature at `state: "internal"`, matching the windows override, so `setup()` reports an internal build by default. A new spec that bypasses that helper must pass `platform.internal`, or the feature will silently not load and any "feature inert" assertion will pass for the wrong reason. `setup(page, testInfo, { internal: false })` covers the public-build case on purpose.
- Run: `npx playwright test --project=windows chrome-webstore-patching --reporter=list`

Still requires manual verification on a Windows internal build: real `webstorePrivate` availability/status strings, install/uninstall events, promo markup (only renders on de-Googled Chromium), and real store DOM against the fixture snapshots.
