---
title: Chrome Webstore Patching
---

# Chrome Webstore Patching

Patches the Chrome Web Store UI (`chromewebstore.google.com`) in the DuckDuckGo Windows browser:

- Hides every extension install button via injected CSS before the page hydrates (**fail closed**)
- On detail pages for **curated** extensions, restyles the button as a DDG-branded pill (accent `#F05F2B`, radius 48px, per Figma) with "Add to DuckDuckGo" / "Remove from DuckDuckGo" copy
- On detail pages for **non-curated** extensions, shows a disabled grey pill (`#E4E4E4`) labelled "Unsupported extension" with an explanatory tooltip
- Hides "Switch to Chrome"-style promo banners (CSS only, no reveal path)

Pill styling values are deliberately literal in the feature (not remote config): they are DDG design tokens, not Google-shaped, so they don't rot with store markup. The reveal CSS is keyed on `html[data-ddg-webstore="curated"|"unsupported"]`, which only the decision path sets.

Install state comes from the page-world private API `chrome.webstorePrivate.getExtensionStatus()` — no native messaging.

## Fail-closed contract

Every failure path degrades to "install button stays hidden", never to a working "Add to Chrome" for an uncurated extension: selector misses, a missing/erroring `webstorePrivate` API, unknown status strings, malformed config, and SPA navigations mid-decision (the verdict is reset before re-deciding, and a stale-response guard re-checks the URL after the status await). The one documented gap: a selector that matches nothing hides nothing, so selector rot on Google's side degrades to unpatched Chrome UI — hot-fix the selectors via remote config.

## Remote config

Feature key `chromeWebstorePatching` (schema: `privacy-configuration/schema/features/chrome-webstore-patching.ts`). All settings are top-level defaults; a single `domains` patch scoped to `chromewebstore.google.com` flips the `patchWebstore` gate:

| Setting                      | Purpose                                                                                                                                                           |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `patchWebstore`              | `{state}` execution gate — disabled everywhere, enabled on the store domain via `domains` patch. `init()` early-returns unless enabled.                           |
| `installButtonSelectors`     | Ordered `{type: 'css'\|'xpath', value}` list targeting the install `<button>`. POC consumes `css` entries only. Primary: `button[jsname="wQO0od"]`.               |
| `installButtonTextSelectors` | Ordered CSS selectors, relative to the button, for the text-label span. Primary: `span.UywwFc-vQzf8d`.                                                            |
| `promoSelectors`             | CSS selectors for Chrome promo banners to hide.                                                                                                                   |
| `buttonCopy`                 | `{install, remove, unavailable, unavailableDescription}` — curated pill labels, unsupported pill label, and its tooltip. A verdict without its copy stays hidden. |
| `apiDetectionTimeoutMs`      | Reserved for a future `webstorePrivate` retry/poll (POC does a single attempt).                                                                                   |

Curated extension IDs are **not** duplicated here — they are read from the native `extensionManagement` feature's `curatedExtensions.settings.catalog` via `bundledConfig` (sub-feature settings are not copied into `featureSettings`, so `getFeatureSetting` cannot reach them). Any shape mismatch there degrades to an empty catalog → everything hidden.

## Testing

- Unit (Jasmine): `injected/unit-test/chrome-webstore-patching.spec.js` — ID parsing, catalog extraction contract, status wrapper failure paths.
- Integration (Playwright, `windows` project): `injected/integration-test/chrome-webstore-patching.spec.js` against fixtures in `integration-test/test-pages/chrome-webstore-patching/`. `chrome.webstorePrivate` is mocked via `page.addInitScript`; the mock installs a `window.chrome` accessor because the windows messaging test harness later reassigns `window.chrome`. Config fixtures retarget the `domains` patch to `localhost`.
- Run: `npx playwright test --project=windows chrome-webstore-patching --reporter=list`

Still requires manual verification on a Windows internal build: real `webstorePrivate` availability/status strings, install/uninstall events, promo markup (only renders on de-Googled Chromium), and real store DOM against the fixture snapshots.
