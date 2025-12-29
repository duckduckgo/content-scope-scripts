# Platform-Specific Build & Troubleshooting Tips

This document provides platform-specific build instructions, troubleshooting steps, and local development tips for integrating and working with Content Scope Scripts (C-S-S) across iOS, macOS, Android, Windows, and browser extensions.

---

## Debugging with Source Maps

Enable inline source maps to see original file names and line numbers in browser DevTools instead of the bundled output (e.g., `tracker-stats.js:304` instead of `contentScope.js:10484`).

### Enabling Source Maps

**Via environment variable:**
```bash
CSS_SOURCEMAPS=1 npm run build
```

**Via CLI flag:**
```bash
npm run bundle-entry-points -- --sourcemap
# Or for a specific platform:
npm run bundle-entry-points -- --platform apple --sourcemap
```

### How It Works

- Inline source maps embed mapping data as a base64 data URL at the end of the JS file
- Browser DevTools automatically detect and use them when open
- No performance impact in production (only parsed when DevTools are open)
- File size increases ~30-50%, acceptable for debugging builds

---

## iOS/macOS

- **Check Xcode Version:**
    - [.xcode-version](https://github.com/duckduckgo/apple-browsers/tree/main/.xcode-version)
- **Set up C-S-S as a Local Dependency:**
    - Run `npm link` in your C-S-S check out.
    - Run `npm link @duckduckgo/content-scope-scripts` in your `apple-browsers` project.
    - Whenever files change run: `npm run build-content-scope-scripts`
- **Set up Autofill as a Local Dependency:**
    - Drag the folder from Finder into the directory panel in Xcode.
- **Privacy Config Files:**
    - Both apps bundle a privacy config file: [macos-config.json](https://github.com/duckduckgo/apple-browsers/blob/main/macOS/DuckDuckGo/ContentBlocker/macos-config.json) & [ios-config.json](https://github.com/duckduckgo/apple-browsers/blob/main/iOS/Core/ios-config.json).
    - To test privacy config changes, update this file as well as the config endpoint for remote updates ([macOS](https://github.com/duckduckgo/apple-browsers/blob/main/macOS/DuckDuckGo/Application/AppConfigurationURLProvider.swift#L60) & [iOS](https://github.com/duckduckgo/apple-browsers/blob/main/iOS/Core/AppURLs.swift#L49)).
- **If you receive errors related to packages:**
    - File > Packages > Reset Package Caches
    - Clean Project with `cmd+K`
    - Delete all files inside `~/Library/Developer/Xcode/DerivedData`
    - If none of that works, ask for help in the [Apple Devs Mattermost channel](https://chat.duckduckgo.com/ddg/channels/devs).

## Android

- [Override the Privacy Remote Config](https://app.asana.com/1/137249556945/project/1202561462274611/task/1203855276415003?focus=true)
    - Ensure the config version is higher than the current version (the app may refuse to update otherwise).
- **Clean Project:**
    - Build → 'Clean Project' (clears cache of potentially stale C-S-S file).
    - Uninstall the app from the emulator as well.
- **Linking Local Dependencies:**
    - Use `npm link @duckduckgo/content-scope-scripts` or `npm link @duckduckgo/autofill` to link to your local checkout.
    - In that directory, also run `npm link` in the dependency folder.
    - This symlinks to your local dir and acts as if you're pointing to your PR.
    - Run `npm build` in C-S-S (not run automatically like in the extension).
- **Alternative Android Setup (more reliable):**
    - Alter the path of the resources in the appropriate module's `build.gradle` to an absolute path on your machine.
        - Example: [build.gradle gist](https://gist.github.com/shakyShane/0b133a0782bdb37c876c4a4204667bb2)
    - After making this change, click 'sync now' when Gradle prompts.
    - All changes in C-S-S will be picked up every time you restart the app.
    - This works for all JS dependencies (Autofill, Dashboard, C-S-S, etc).

## Windows

- [Work with content-scope-scripts repo on Windows](./development-utilities.md#windows-development)
- [Debugging `autofill.js` (or other submodules) on Windows](https://app.asana.com/1/137249556945/project/1198964220583541/task/1208938714611510)

## Extensions

- Use npm link as per Android.
- See the [other development steps](https://github.com/duckduckgo/duckduckgo-privacy-extension/blob/main/CONTRIBUTING.md#building-the-extension).
