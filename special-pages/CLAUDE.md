# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Special Pages is a collection of isolated HTML/CSS/JS applications that run in privileged browser contexts (like about: pages). These pages have access to native APIs through platform-specific messaging interfaces and support multiple platforms (Windows, macOS, iOS, Android).

## Common Development Commands

### Building
- `npm run build` - Build all special pages for production
- `npm run build.dev` - Build for development with additional debugging
- `npm run prebuild` - Generate types and translations (runs automatically before build)

### Development
- `npm run serve` - Serve built pages at http://127.0.0.1:3210
- `npm run watch -- --page=<page-name>` - Watch and rebuild specific page (e.g., `npm run watch -- --page=new-tab`)

### Testing
- `npm run test-unit` - Run all unit tests
- `npm run test-int` - Run integration tests (excluding screenshots)
- `npm run test-int-snapshots` - Run screenshot tests
- `npm run test-int-snapshots-update` - Update screenshot baselines
- Platform-specific tests: `npm run test.windows`, `npm run test.macos`, `npm run test.ios`, `npm run test.android`
- Use `--reporter list` for cleaner test output: `npm run test-int -- --reporter list`

### Linting
- `cd ..; npm run lint` - Run linting from parent directory

#### Speed up test runs by targeting specific files:
- `npm run test-unit -- pages/new-tab/app/omnibar/utils.js`
- `npm run test-int -- pages/new-tab/app/omnibar/integration-tests/omnibar.spec.js --reporter list`
- `npm run test-int-snapshots -- pages/new-tab/integration-tests/new-tab.screenshots.spec.js --reporter list`

### Development Workflow
1. Make changes to a special page (e.g., in `pages/new-tab/app/`)
2. Use `npm run watch -- --page=new-tab` for hot reloading during development
3. Access development server at http://localhost:8000
4. Run `npm run build` before committing changes
5. Use `npm run serve` to test built pages at http://127.0.0.1:3210

## Architecture

### Special Pages Structure
Each special page follows this structure:
```
pages/<page-name>/
├── app/                 # React/Preact application code
├── public/             # Static assets and index.html
├── src/                # Entry point and messaging setup
├── messages/           # Message schema definitions
├── integration-tests/  # Playwright tests
├── types/             # TypeScript type definitions
└── readme.md          # Page-specific documentation
```

### Build System
- Each page supports multiple platform targets: `integration`, `windows`, `apple`, `android`
- Build output goes to `build/<platform>/pages/<page-name>/`
- Platform-specific messaging is handled through `@duckduckgo/messaging`
- Some platforms require HTML inlining for deployment

### Key Pages
- `new-tab` - New tab page with widgets (favorites, privacy stats, etc.)
- `duckplayer` - DuckDuckGo's YouTube player replacement
- `history` - Browser history management interface
- `special-error` - Custom error pages
- `onboarding` - User onboarding flow
- `release-notes` - Release notes display

### Messaging Architecture
Platform communication uses `@duckduckgo/messaging`:
- Windows: Uses `windowsInteropPostMessage` global
- Apple: Uses WebKit message handlers
- Android: Uses JavaScript interface with message callbacks
- Integration: Falls back to mock transport for testing

### Widget System (New Tab Page)
The new tab page uses a modular widget architecture:
- Widget providers manage state and data
- Entry points define individual widget initialization
- Shared components and services across widgets
- Activity tracking and burning (data deletion) functionality

### Styling Approach
- Uses CSS modules for component styling
- Theme support via `data-theme` attribute (not media queries)
- Shared base styles in `shared/styles/`
- Platform-specific CSS variables

### Testing Strategy
- Unit tests using Node.js built-in test runner
- Integration tests with Playwright across multiple platforms
- Screenshot testing for visual regression
- Platform-specific test configurations in `playwright.config.js`
- Integration tests should be split: `.spec.js` contains tests, `.page.js` contains page interaction helpers

## Development Notes

### Hot Reloading
When developing, use `npm run watch -- --page=<page-name>` which provides:
- Live CSS updates
- Automatic rebuilds on file changes
- Development server at localhost:8000

### Message Schema
Each page defines its messaging contract using JSON Schema in the `messages/` directory:
- Request/response pairs (`.request.json`, `.response.json`)
- Notifications (`.notify.json`)
- Subscriptions (`.subscribe.json`)
- Shared types (`.shared.json`)

JSON schemas are automatically compiled into TypeScript types. For example:
- `pages/new-tab/messages/omnibar_submitChat.notify.json` becomes `OmnibarSubmitChatNotification` in `pages/new-tab/types/new-tab.ts`
- The TypeScript types file is auto-generated during the build process

### Platform Differences
- Apple platforms may require HTML inlining
- Windows uses specific interop messaging
- Android has different JavaScript interface requirements
- Integration target provides mock interfaces for testing

### Pull Requests
When creating new pull requests, follow the template in `../.github/pull_request_template.md` to ensure all necessary information is included.
