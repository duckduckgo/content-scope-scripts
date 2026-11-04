# Native implementation: Protections Report + Favorites trackers

What native needs to add beyond `main`. Everything new is **optional**: if a field is missing, the report hides the view that needs it. Schemas live in `special-pages/pages/new-tab/messages/`.

## 1. `privacy-stats` data (`getData` / `onDataUpdate`)

Add these fields for the past 7 days:

| Field | Where | Used for |
|---|---|---|
| `sitesCount` | each company | "Who": how many sites the company was on |
| `categories` (Tracker Radar) | each company | "Why we blocked them" |
| `fingerprinting` (0–3) | each company | "Why we blocked them" |
| `totalCompanies` | top level | Headline count, including `__other__` |
| `totalSitesVisited` | top level | "on 4 of 5 sites"-style ratios |
| `topSites[]` (up to 5): `etldPlusOne`, `url?`, `favicon?`, `trackerCompanies[]` | top level | "Where" (the ring) and "How Chrome compares" |

"When" uses the existing activity data. "What they use to identify you" needs nothing new: it comes from Tracker Radar data bundled in the page.

## 2. `protections` config

`feed` gains `purposes`, `companies`, `top-sites`, `recognition` and `compare`. Persist it through the existing `setConfig`. A view that has no data falls back to the first view that does.

## 3. `protections` data: default browser

- **New field:** `isDefaultBrowser?: boolean`. When it's `false`, the report shows a "1 issue" pill. Omit it if unknown.
- **New notification `protections_makeDefaultBrowser`:** show the system prompt. When the setting changes, push `onDataUpdate` with `isDefaultBrowser: true`.
- **New notification `protections_dismissDefaultBrowserPrompt`:** remember the dismissal, and omit the field (don't send `false`) for as long as the prompt should stay hidden.

## 4. `favorites` data: tracker pill

- **New field:** `Favorite.trackers?: { companies: string[], blocked: number }`, covering the past 7 days.
- **`companies`:** display names, most-blocked first. They must match the `TrackerCompany.displayName` values sent in privacy-stats.
- **`blocked`:** the total number of tracking attempts blocked on the site.
- **When to omit:** leave the field out when nothing was blocked. Never send an empty list or `blocked: 0`.

## 5. Sharing

"Share as image" uses the Web Share API with a PNG file and falls back to a download. Check that each platform's web view supports one of these.

The picture embeds site favicons by fetching them, or else by copying the loaded image through a canvas. If favicons show as a generic globe in the picture, the favicon URL scheme blocks both: have its handler send `Access-Control-Allow-Origin` for the New Tab page's origin.

## Open questions

- **Licence:** `app/protections/data/tracker-purposes.js` is derived from Tracker Radar (CC BY-NC-SA 4.0). It needs a licence check before shipping.
- **Default-browser prompt:** decide whether it should be gated behind a native setting or remote config.
- **Rollout:** the new report has no flag of its own; it follows `totalCookiePopUpsBlocked` (see above). If it needs a staged rollout, add a config flag first.

## Turning it on in a native build

There's no flag: both features switch on from the data native sends.

1. **Load this branch's C-S-S in the app,** either through `npm link` or the PR's `pr-releases/<branch>` build (see `CONTRIBUTING.md`).
2. **Protections Report:** send `totalCookiePopUpsBlocked` in `protections_getData`. Its presence is what picks the new UI over the legacy one (`ProtectionsConsumer.js`), so platforms that already send it get the new report straight away. Each view then appears once its data from section 1 arrives. The headline, "Who", "When" and "What" work with today's data.
3. **Favorites tracker pill:** add `trackers` to the favorites that had trackers blocked. Tiles without it look as they do today.

## Trying it in a browser (mock data)

For the page served on its own (`npm run serve-special-pages`), these URL parameters switch on the mock data:

| Parameter | What it shows |
|---|---|
| `?protections=report&stats=report` | The full report |
| `&protections_feed=<view>` | Opens on that view |
| `&protections.default=false` | The "1 issue" default-browser pill |
| `&stats=sparse` / `&stats=error` | Sparse data / a data error |
| `?favorites=many&favorites.trackers` | The favorites tracker pills |
