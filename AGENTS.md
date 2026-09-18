# Content Scope Scripts (C-S-S)

Shared JavaScript projects powering privacy features and special pages in DuckDuckGo's native apps (macOS, Windows, iOS, Android).

## Workspaces

This is an npm workspace monorepo with four sub-projects:

### `injected/` - Browser Privacy Features

JavaScript features injected into web pages for privacy protections. Features extend `ContentFeature` (which extends `ConfigFeature`) and integrate with remote configuration for per-site enable/disable.

**Features** (in `injected/src/features/`):
- `api-manipulation` - API behavior modifications
- `autofill-import` - Credential import support
- `autofill-passkeys` - Routes `navigator.credentials.get()` passkey requests to native autofill
- `breakage-reporting` - Site breakage reports
- `broker-protection` - Data broker removal automation
- `browser-ui-lock` - Detects pages with no scrollbar so native can lock browser UI gestures
- `chrome-webstore-patching` - Patches the Chrome Web Store UI for curated extensions
- `click-to-load` - Social embed blocking
- `context-menu` - Reports context-menu events to native (Apple)
- `cookie` - Cookie management
- `detector-perf` - Performance measurement for detectors
- `duck-ai-chat-history` / `duck-ai-data-clearing` - Read and clear Duck.ai chat data (own bundles)
- `duck-player` / `duck-player-native` - YouTube privacy player
- `element-hiding` - Hide page elements
- `exception-handler` - Reports uncaught page exceptions to the debugger
- `favicon` - Reports page favicons to native
- `fingerprinting-*` - Audio, battery, canvas, hardware, screen, storage fingerprint protection
- `google-rejected` - Removes the Topics API and Protected Audience (FLEDGE) APIs
- `gpc` - Global Privacy Control
- `harmful-apis` - Dangerous API restrictions
- `hover` - Forwards hovered link URLs to native for the status bar
- `message-bridge` - Page↔content script messaging
- `navigator-interface` - Navigator API modifications
- `page-context` - Extracts page content and sends it to native on request
- `page-observer` - Notifies native when the DOM has loaded
- `performance-metrics` - Performance tracking
- `print` - Overrides `window.print()` so native handles printing (iOS)
- `referrer` - Referrer protection
- `tab-suspension` - Reports whether the tab can be suspended
- `text-selection` - Reports text selection state to native
- `tracker-protection` - In-page tracker blocking and surrogate injection
- `ua-ch-brands` - Aligns `navigator.userAgentData.brands` with the Sec-CH-UA header
- `web-compat` - Site compatibility fixes
- `web-detection` - Config-driven detector framework (adwalls, video unavailability)
- `web-events` - Forwards events from other features to native
- `web-interference-detection` / `web-telemetry` - Monitoring
- `windows-permission-usage` - Reports geolocation, camera and microphone usage (Windows)

**Docs:** `injected/docs/README.md` (index to all docs)

### `special-pages/` - Embedded Browser Pages

Preact-based HTML/CSS/JS applications embedded in browsers. Each page lives in `special-pages/pages/<name>/`.

**Pages:**
- `duckplayer` - YouTube privacy player UI
- `errorpage` - Browser error pages
- `example` - Template for new pages
- `history` - Browsing history viewer
- `new-tab` - New Tab Page
- `onboarding` - First-run experience
- `release-notes` - Browser release notes
- `special-error` - SSL/certificate error pages

**Docs:** `special-pages/README.md`, plus `readme.md` in each page directory

### `messaging/` - Web-Native Communication

Abstraction layer for web↔native messaging: `notify` (fire-and-forget), `request` (async response), `subscribe` (push updates).

**Docs:** `messaging/docs/messaging.md`

### `types-generator/` - Schema to TypeScript

Generates TypeScript types from JSON Schema files. Used by other workspaces.

## Commands

Run from root. Use `nvm use` to set the correct Node version.

| Command | Purpose |
|---------|---------|
| `npm run build` | Build all workspaces |
| `npm run test-unit` | Unit tests (all workspaces) |
| `npm run test-int` | Integration tests (Playwright) |
| `npm run lint` | ESLint + TypeScript + Prettier (run `npm run build` first; it also lints the built output) |
| `npm run lint-fix` | Auto-fix lint issues |
| `npm run serve` | Serve injected test pages (port 3220) |
| `npm run serve-special-pages` | Serve built special pages (port 3210) |

## Coding Standards

Follow the error handling guidelines in [`guides/error-handling.md`](guides/error-handling.md). Key rules:
- Errors are for **exceptional conditions** (invariant violations, unreachable code), not control flow
- Never leave promises unhandled — use `.catch()` or `try/catch` with `await`
- Return `null`/sentinel values for expected missing data instead of throwing

### Strict TypeScript

All **new** source files under `injected/src/` must be added to the `CORE_FILES` set in `scripts/check-strict-core.js`. This enforces TypeScript strict mode (`strict: true`, `noUncheckedIndexedAccess`). Run `npm run tsc-strict-core` to verify. Do not remove existing entries from the set.

## Debugging

See [`guides/debugging.md`](guides/debugging.md) for debugging resources including script integrity validation, feature triage checklist, and platform-specific troubleshooting.

## Notes

- When running Playwright commands, use `--reporter list` to prevent the Shell tool from hanging
- Use `.github/pull_request_template.md` when creating a pull request.

## Local dev quick wins (common pain points)

- **Special Pages CSS local dev**: use `npm run serve-special-pages` (repo root) + `npm run watch -- --page=<page>` (inside `special-pages/`) for hot CSS reload (usually `http://localhost:8000/`). The `build/` output does **not** auto-update in watch mode.
- **Release workflow**: releases are created from GitHub Actions (see `CONTRIBUTING.md` → “Release Process”). For most iteration, prefer the PR build branch (`pr-releases/<branch>`, preview links are posted on the PR by `build-branch.yml`) or `npm link` into native apps; only cut a release when you need native consumption via the `releases` branch artifacts.

## Cursor Cloud specific instructions

- Node 24 (see `.nvmrc`) and npm are required; if the pre-installed Node differs, run `nvm install` to match `.nvmrc`. Playwright browsers + system deps are pre-installed. Just run `npm ci` to refresh dependencies.
- `npm run serve-special-pages` serves `build/integration/pages` on port 3210, so run `npm run build` first. The injected test pages serve on port 3220.
- Integration tests for injected workspace may show 2 flaky iOS mobile drawer timeouts (`duckplayer-mobile-drawer.spec.js`); these are pre-existing timing issues, not environment problems.
- No Docker, databases, or external services are needed. All tests are self-contained with local HTTP servers and mocked native messaging.
- On headless Linux, `xvfb` is pre-installed. The injected workspace provides `npm run test-int-x` which wraps Playwright with `xvfb-run`, but standard `npm run test-int` also works in this environment.
