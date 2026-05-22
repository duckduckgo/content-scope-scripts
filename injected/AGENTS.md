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

**Adding a new feature:** Add to `baseFeatures` or `otherFeatures` in `src/features.js`, then add to relevant platform arrays in `platformSupport`. Build the project after adding a new feature in `src/features/` to keep types up-to-date (`npm run build`).

**Strict TypeScript:** All new feature files must be added to the `CORE_FILES` set in `scripts/check-strict-core.js`. This enforces full TypeScript strict mode (`strict: true`, `noUncheckedIndexedAccess`) on the file. Run `npm run tsc-strict-core` from the repo root to verify. Existing files in the set must not regress.

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

Platform-specific features: `navigatorInterface`, `windowsPermissionUsage`, `messageBridge`, `favicon`, `breakageReporting`, `webInterferenceDetection`, `webDetection`, `webEvents` (see `utils.js` `platformSpecificFeatures`).

## Messaging Constraints

- **Never include `nativeData` as a field in any message sent to the client.** The `nativeData` field is reserved for native platform use — native implementations inject a `nativeData` field into incoming messages, and `nativeData` is reserved for that layer. When constructing `notify()` or `request()` params, only pass explicitly defined fields (destructure rather than spread).

## Notes

- When running Playwright commands, use `--reporter list` to prevent hanging
- Features can be enabled/disabled per-site via remote config
- Add debug flags with `this.addDebugFlag()` for breakage reports
