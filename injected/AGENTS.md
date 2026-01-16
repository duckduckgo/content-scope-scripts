# Injected Features

JavaScript features injected into web pages or running in DOM environments of DuckDuckGo browsers. Features extend `ContentFeature` and `ConfigFeature` and integrate with remote configuration for per-site enable/disable.

**See also:**
- `docs/coding-guidelines.md` for code style, patterns, and examples
- `docs/css-decision-guide.md` for when to use C-S-S vs native code
- [privacy-configuration experiments guide](https://github.com/duckduckgo/privacy-configuration/blob/main/.cursor/rules/content-scope-experiments.mdc) for A/B testing features

## Structure

```
src/features/<name>.js    # Feature implementation (extends ContentFeature)
src/features.js           # Feature registry (baseFeatures + otherFeatures arrays)
entry-points/<platform>.js # Platform-specific bundles
integration-test/         # Playwright integration tests
unit-test/                # Jasmine unit tests
```

**Adding a new feature:** Add to `baseFeatures` or `otherFeatures` in `src/features.js`, then add to relevant platform arrays in `platformSupport`.

## TypeScript

JSDoc types in JavaScript files. Import types via `@typedef`:

```javascript
/** @typedef {import('../types/feature.js').SettingType} SettingType */
```

## Testing

Run from `injected/` directory:

| Command | Purpose |
|---------|---------|
| `npm run test-unit` | Jasmine unit tests |
| `npm run test-int` | Playwright integration tests |
| `npm run build` | Build all platform bundles |

Integration tests use test pages in `integration-test/test-pages/`.

## Linting

After making code changes, **always run** `npm run lint-fix` (from repo root) and incorporate any auto-fixes before returning results.

## Key Patterns

- **Event listeners**: Use `handleEvent` pattern or stored references (avoid `.bind(this)`)
- **API existence**: Check `typeof API === 'function'` before wrapping
- **DOM timing**: Check `document.readyState` before accessing DOM
- **Error types**: Match native error signatures in API shims

See `docs/coding-guidelines.md` for DDGProxy, captured globals, retry utilities, and other patterns.

## Platform Considerations

Features are bundled per-platform in `entry-points/`:
- `apple.js` - iOS/macOS
- `android.js` - Android  
- `windows.js` - Windows
- `extension-mv3.js` - Browser extension

Platform-specific features: `navigatorInterface`, `windowsPermissionUsage`, `messageBridge`, `favicon` (see `utils.js` `platformSpecificFeatures`).

## Notes

- When running Playwright commands, use `--reporter list` to prevent hanging
- Features can be enabled/disabled per-site via remote config
- Add debug flags with `this.addDebugFlag()` for breakage reports
