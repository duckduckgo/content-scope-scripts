# Content Scope Scripts (C-S-S)

Shared JavaScript projects powering privacy features and special pages in DuckDuckGo's native apps (macOS, Windows, iOS, Android).

## Workspaces

This is an npm workspace monorepo with four sub-projects:

### `injected/` — Browser Privacy Features

JavaScript features injected into web pages for privacy protections. Features extend `ContentFeature` / `ConfigFeature` and integrate with remote configuration for per-site enable/disable.

**Features** (in `injected/src/features/`):
- `api-manipulation` — API behavior modifications
- `autofill-import` — Credential import support
- `breakage-reporting` — Site breakage reports
- `broker-protection` — Data broker removal automation
- `click-to-load` — Social embed blocking
- `cookie` — Cookie management
- `duck-player` / `duck-player-native` — YouTube privacy player
- `element-hiding` — Hide page elements
- `exception-handler` — Error handling
- `favicon` — Favicon privacy
- `fingerprinting-*` — Audio, battery, canvas, hardware, screen, storage fingerprint protection
- `google-rejected` — Google rejection handling
- `gpc` — Global Privacy Control
- `harmful-apis` — Dangerous API restrictions
- `message-bridge` — Page↔content script messaging
- `navigator-interface` — Navigator API modifications
- `performance-metrics` — Performance tracking
- `referrer` — Referrer protection
- `web-compat` — Site compatibility fixes
- `web-interference-detection` / `web-telemetry` — Monitoring

### `special-pages/` — Embedded Browser Pages

Preact-based HTML/CSS/JS applications embedded in browsers. Each page lives in `special-pages/pages/<name>/`.

**Pages:** `duckplayer`, `errorpage`, `example`, `history`, `new-tab`, `onboarding`, `release-notes`, `special-error`

### `messaging/` — Web-Native Communication

Abstraction layer for web↔native messaging: `notify` (fire-and-forget), `request` (async response), `subscribe` (push updates).

### `types-generator/` — Schema to TypeScript

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

## Key rules

- **Error handling**: Errors must be exceptional, not control flow. Never leave promises unhandled. See [injected/docs/error-handling.md](injected/docs/error-handling.md).
- **Playwright**: Use `--reporter list` to prevent the Shell tool from hanging.
- **PRs**: Use `.github/pull_request_template.md` when creating a pull request.

## Debugging

When developing or debugging C-S-S, validate script integrity, build outputs, and injection across all platforms. Key resources:

- **Build & troubleshooting**: [injected/docs/build-and-troubleshooting.md](injected/docs/build-and-troubleshooting.md) — script integrity, config validation, platform-specific setup
- **Feature not working?** See the triage checklist in `injected/docs/build-and-troubleshooting.md#feature-not-working-triage-checklist`
- **Messaging issues**: [injected/docs/message-bridge.md](injected/docs/message-bridge.md) — missing messageName, handler registration, bridge init
- **Breaking changes**: [CONTRIBUTING.md](CONTRIBUTING.md) — versioning and release coordination

## Reference documentation

| Topic | File |
|-------|------|
| Error handling guidelines | [injected/docs/error-handling.md](injected/docs/error-handling.md) |
| Injected features docs index | [injected/docs/README.md](injected/docs/README.md) |
| Build & troubleshooting | [injected/docs/build-and-troubleshooting.md](injected/docs/build-and-troubleshooting.md) |
| Coding guidelines | [injected/docs/coding-guidelines.md](injected/docs/coding-guidelines.md) |
| Message bridge | [injected/docs/message-bridge.md](injected/docs/message-bridge.md) |
| CSS decision guide | [injected/docs/css-decision-guide.md](injected/docs/css-decision-guide.md) |
| Special pages | [special-pages/README.md](special-pages/README.md) |
| Messaging library | [messaging/docs/messaging.md](messaging/docs/messaging.md) |
