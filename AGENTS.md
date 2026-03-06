# Content Scope Scripts (C-S-S)

Shared JavaScript projects powering privacy features and special pages in DuckDuckGo's native apps (macOS, Windows, iOS, Android).

## Workspaces

This is an npm workspace monorepo with four sub-projects:

### `injected/` - Browser Privacy Features

JavaScript features injected into web pages for privacy protections. Features extend `ConfigFeature` and integrate with remote configuration for per-site enable/disable.

**Features** (in `injected/src/features/`):
- `api-manipulation` - API behavior modifications
- `autofill-import` - Credential import support
- `breakage-reporting` - Site breakage reports
- `broker-protection` - Data broker removal automation
- `click-to-load` - Social embed blocking
- `cookie` - Cookie management
- `duck-player` / `duck-player-native` - YouTube privacy player
- `element-hiding` - Hide page elements
- `exception-handler` - Error handling
- `favicon` - Favicon privacy
- `fingerprinting-*` - Audio, battery, canvas, hardware, screen, storage fingerprint protection
- `google-rejected` - Google rejection handling
- `gpc` - Global Privacy Control
- `harmful-apis` - Dangerous API restrictions
- `message-bridge` - Page↔content script messaging
- `navigator-interface` - Navigator API modifications
- `performance-metrics` - Performance tracking
- `referrer` - Referrer protection
- `web-compat` - Site compatibility fixes
- `web-detection` - Web detection framework
- `web-interference-detection` / `web-telemetry` - Monitoring
- `duck-ai-chat-history` - Duck AI chat history
- `duck-ai-data-clearing` - Duck AI data clearing
- `page-context` - Page context
- `print` - Print protection
- `ua-ch-brands` - User-Agent Client Hints brands
- `windows-permission-usage` - Windows permission usage

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
| `npm run lint` | ESLint + TypeScript + Prettier |
| `npm run lint-fix` | Auto-fix lint issues |
| `npm run serve` | Serve injected test pages (port 3220) |
| `npm run serve-special-pages` | Serve special pages (port 3221) |

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

## Cursor Cloud specific instructions

- Node 22 and npm are pre-installed. Playwright browsers + system deps are pre-installed. Just run `npm ci` to refresh dependencies.
- `npm run serve-special-pages` actually serves on **port 3210** (not 3221 as the Commands table above states). The injected test pages serve on port 3220 as documented.
- Integration tests for injected workspace may show 2 flaky iOS mobile drawer timeouts (`duckplayer-mobile-drawer.spec.js`); these are pre-existing timing issues, not environment problems.
- No Docker, databases, or external services are needed. All tests are self-contained with local HTTP servers and mocked native messaging.
- On headless Linux, `xvfb` is pre-installed. The injected workspace provides `npm run test-int-x` which wraps Playwright with `xvfb-run`, but standard `npm run test-int` also works in this environment.
