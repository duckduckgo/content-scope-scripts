# Platform-Specific Build & Troubleshooting Tips

This document provides platform-specific build instructions, troubleshooting steps, and local development tips for integrating and working with Content Scope Scripts (C-S-S) across iOS, macOS, Android, Windows, and browser extensions.

---

## Critical Debugging Step: Validate Injected Script Integrity

**Ensure the injected C-S-S script matches what you expect across all three locations.**

### Verification Steps

1. **Check the build directory in the content-scope-scripts repo:**
    - Location: `build/[platform]/contentScope.js` (or `build/[platform]/inject.js` for extensions)
    - **Note:** Apple builds output to `Sources/ContentScopeScripts/dist/contentScope.js` instead of `build/apple/`
    - Verify the file contains your expected changes
    - Check file hash/timestamp to ensure it's been rebuilt

2. **Check where it lives in the native application:**
    - **iOS/macOS**: `apple-browsers/SharedPackages/BrowserServicesKit/Sources/ContentScopeScripts/Resources/contentScope.js`
    - **Android**: `android/node_modules/@duckduckgo/content-scope-scripts/build/android/contentScope.js` (referenced by build.gradle files)
    - **Windows**:
        - Main: `windows-browser/WindowsBrowser/Application/ContentScripts/contentScope.js` (embedded resource from `submodules/content-scope-scripts/build/windows/contentScope.js`)
        - Data Broker Protection: `windows-browser/WindowsBrowser.DataBrokerProtection.Agent/Resources/dbp-contentScopeScripts`
    - **Extension**: `extension/node_modules/@duckduckgo/content-scope-scripts/build/[platform]/inject.js` (where `[platform]` is `chrome-mv3` or `firefox`)

3. **Check in the web inspector:**
    - Open DevTools → Sources → Look for the injected script
    - Compare file contents/hashes across all three locations
    - Use source maps if available (set `C_S_S_SOURCEMAPS=1` when building)

**All three locations must have the same file contents.** If they don't match, your changes aren't being properly built or injected.

---

## Debugging with Source Maps

Enable inline source maps to see original file names and line numbers in browser DevTools instead of the bundled output (e.g., `web-compat.js:142` instead of `contentScope.js:10484`).

```bash
C_S_S_SOURCEMAPS=1 npm run build
```

---

## iOS/macOS

- **Check Xcode Version:**
    - [.xcode-version](https://github.com/duckduckgo/apple-browsers/tree/main/.xcode-version)
- **Set up C-S-S as a Local Dependency (Swift Package Manager):**
  Apple browsers now use Swift Package Manager (SPM) for dependencies. To use your local C-S-S checkout for debugging, you have two options:
  **Option 1: Drag into Xcode**
    - Drag the `content-scope-scripts` folder from Finder into the Xcode project navigator
    - Xcode will automatically detect the `Package.swift` file and set it up as a local package
      **Option 2: Change Swift PM dependency to local path**
    - In `apple-browsers/SharedPackages/BrowserServicesKit/Package.swift`, change the dependency from:
        ```swift
        .package(url: "https://github.com/duckduckgo/content-scope-scripts.git", exact: "12.27.0")
        ```
        to:
        ```swift
        .package(path: "../../../../content-scope-scripts")
        ```
        (Adjust the relative path based on your directory structure)
    - Xcode will automatically resolve the local package
      **Note:** You no longer need to run `npm run build-content-scope-scripts` in the apple-browsers repo. The Swift Package Manager will handle the build process automatically.
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

- Visual Studio in Parallels is extremely usable on an M-series Mac. 
    - Make sure you get Parallels Pro so that you can set it to use ~8 CPUs and ~16 GB RAM.
    - You can purchase this using your Ramp card.
- Set up Visual Studio per the instructions in the [Windows browser README](https://github.com/duckduckgo/windows-browser/blob/develop/README.md).
- To test C-S-S changes, you can create a directory symlink (`mklink /D`) between `submodules/content-scope-scripts` ↔ the `content-scope-scripts` directory in macOS.
    - This lets you make C-S-S changes in macOS and then see them in the Windows app.
    - Remember to configure Parallels to share your macOS disk.
- A nice-to-have is to [set up a WSL environment](https://learn.microsoft.com/en-us/windows/wsl/setup/environment) so that you can use familiar command line tools within Windows (git, vim, Clalude Code, etc.)
- Other guides:
    - [Work with content-scope-scripts repo on Windows](./development-utilities.md#windows-development)
    - [Debugging `autofill.js` (or other submodules) on Windows](https://app.asana.com/1/137249556945/project/1198964220583541/task/1208938714611510)

## Extensions

- Use npm link as per Android.
- See the [other development steps](https://github.com/duckduckgo/duckduckgo-privacy-extension/blob/main/CONTRIBUTING.md#building-the-extension).

---

## Build Branch Hash Validation

**For native engineers using build branches `pr-<version-number>`:**

### Steps

1. After a change commit happens, verify the hash has changed.
2. Check that the build CI has finished successfully.
3. **Only then** reinstall the app to pick up the new hash.

### Why This Matters

Installing before the CI completes or before the hash changes means you're testing old code. The hash change is a build CI indicator - make sure it has finished before running install again.

---

## Config and Platform Parameters Validation

**Always validate that the config loaded from remote config or cache config is in the correct state that is injected into Content Scope Scripts.**

### Using processConfig Breakpoint

1. Open the web inspector (browser DevTools).
2. Set a breakpoint in the `processConfig` function (located in `injected/src/utils.js`).
3. Inspect the loaded configuration object to verify:
    - The config structure matches expectations
    - Feature states (`enabled`, `disabled`, `internal`, `preview`) are correct
    - Domain exceptions are properly applied
    - `unprotectedTemporary` domains are correctly set
    - Feature settings are correctly parsed
    - Site-specific settings: `site.isBroken`, `site.allowlisted`, and `site.enabledFeatures` are correct

### Platform Parameters Validation

**Platform parameters control internal and version state, and thus the enabled state of your features.**

1. Use the same `processConfig` method as a breakpoint.
2. Inspect the `preferences` parameter passed to `processConfig`:
    - `platform.version` - version number
    - `platform.internal` - internal build flag
    - `platform.preview` - preview build flag
3. Verify these parameters match your expected build configuration.

**Why This Matters:** Platform parameters determine feature enablement states. A feature set to `internal` state will only be enabled if `platform.internal === true`. Incorrect platform parameters can silently disable features.

**Note:** For config version validation, see [privacy-configuration/.cursor/rules/debugging.mdc](https://github.com/duckduckgo/privacy-configuration/blob/main/.cursor/rules/debugging.mdc).

---

## Feature Not Working: Triage Checklist

Use this when a feature "is not working" to confirm it is enabled and wired end-to-end.

### 1) Platform sends and parses the feature config

- Confirm the platform injects the feature config into `$CONTENT_SCOPE$`.
- Apple: check any feature denylist filtering in the platform layer.
- Android: ensure the feature config has a parser implemented.

### 2) Feature enabled in config and site object

- Set a breakpoint in `processConfig` (see above) and inspect:
    - `features.<featureName>.state` and `features.<featureName>.settings`
    - `site.enabledFeatures` includes the feature name
    - `site.allowlisted` and `site.isBroken` are false
- If you use `injectName`-based overrides, confirm the correct `injectName` is being applied.

### 3) Feature bundled on the platform

- Check `injected/src/features.js` to confirm the platform bundle includes the feature.
- Confirm the correct entry point is used for the platform (`injected/entry-points/`).
- Verify the built output (`build/<platform>/contentScope.js` or `inject.js`) contains the feature code.

### 4) Sub-feature or setting enabled

- Validate per-setting flags in config (`settings` + `conditionalChanges`).
- In DevTools, inspect the feature instance (`this.settings`) or use
  `getFeatureSettingEnabled()` to confirm the specific behavior is enabled.

### 5) Messaging is wired and listened to

- Confirm the message bridge feature is enabled and `messageSecret` is present.
- Verify `messagingContextName` and `featureName` match what the native layer expects.
- Ensure the native app registers handlers/subscriptions for notify/request/subscribe.

---

## Quick Validation Test

**Use this test page to validate that ContentScopeScripts has been injected correctly:**

https://privacy-test-pages.site/features/navigator-interface.html

This page provides a quick way to verify C-S-S injection is working as expected.
