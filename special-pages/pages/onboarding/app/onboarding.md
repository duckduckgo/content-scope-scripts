---
title: Onboarding
---

# Onboarding

The browser's first-run flow. The page asks native for its configuration with `init`, then walks the user through the steps native chose. The page sends each settings change to native as it happens.

## Requests

### `init`
{@link "Onboarding Messages".InitRequest}

Sent once when the page loads. The response picks the steps to show, overrides step content and sets the locale.

**Types:**
- Response: {@link "Onboarding Messages".InitResponse}

```json
{
  "stepDefinitions": {
    "systemSettings": {
      "rows": ["dock", "import", "default-browser"]
    }
  },
  "steps": ["welcome", "getStarted", "makeDefaultSingle", "systemSettings", "customize", "addressBarMode", "searchOrChat"],
  "locale": "en",
  "env": "production",
  "platform": {
    "name": "macos"
  }
}
```

The page shows only the steps listed in `steps`, in its own order, and ignores unknown entries. Without `steps`, it shows the default order (`ORDER_V4`), minus any steps listed in `exclude`. The page ignores `exclude` when `steps` is present. Deprecated: prefer `steps`.

Each entry in `stepDefinitions` is merged over the page's default definition for that step, which is how native picks the rows of a settings step.

Every field is optional. Without `stepDefinitions` the page uses its default step definitions, and without `locale` it stays on English unless the `locale` URL param overrides it.

### `requestDockOptIn`
{@link "Onboarding Messages".RequestDockOptInRequest}

Sent when the user wants to keep the browser in the dock or taskbar. Native responds once the operation is complete. The page ignores the response body.

### `requestImport`
{@link "Onboarding Messages".RequestImportRequest}

Sent when the user wants to import data. The page shows a loading state until native responds.

**Types:**
- Response: {@link "Onboarding Messages".SystemValue}

On macOS the page uses the response as the row's new value. Other platforms only need to respond, and the page marks the row as enabled.

```json
{
  "enabled": true
}
```

### `shouldShowTopSitesPicker`
{@link "Onboarding Messages".ShouldShowTopSitesPickerRequest}

Sent once, when the user leaves the step before the picker. Native lists `picker` in `init.steps` for every user who might see it, and enrolls the user in the experiment only when this request arrives and they're under the favorites threshold. The page waits for the answer, then shows the picker or moves on to the step after it. A failed request, or no answer within 2 seconds, skips the picker, and the page ignores a late answer. Native should answer straight away, because a user it enrolls after the page gave up never sees the picker. The progress counter counts the picker until a no drops it.

When `show` is true, `existingFavorites` lists the user's favorites as URLs. The picker shows any suggested site whose hostname matches one, after dropping a leading `www.`, as picked and locked, and those sites never go out in `addFavorites`.

```json
{
  "show": true,
  "existingFavorites": ["https://youtube.com/feed", "https://example.com"]
}
```

### `requestSetAsDefault`
{@link "Onboarding Messages".RequestSetAsDefaultRequest}

Sent when the user wants to make DuckDuckGo the default browser. The page shows a loading state until native responds, and ignores the response body.

## Subscriptions

### `onConfigUpdate`
{@link "Onboarding Messages".OnConfigUpdateSubscription}

Lets native push new step definitions or exclusions after `init`, for example to change the rows of the customize step.

```json
{
  "stepDefinitions": {
    "customize": {
      "rows": ["bookmarks", "session-restore", "home-shortcut"]
    }
  }
}
```

## Notifications

### `stepCompleted`
{@link "Onboarding Messages".StepCompletedNotification}

Sent when the user moves from one step to the next. It isn't sent after the last step.

```json
{
  "id": "welcome",
  "next": "getStarted"
}
```

### `setBookmarksBar`, `setSessionRestore`, `setShowHomeButton`, `setAdBlocking`, `setDuckAiInAddressBar`
- {@link "Onboarding Messages".SetBookmarksBarNotification}
- {@link "Onboarding Messages".SetSessionRestoreNotification}
- {@link "Onboarding Messages".SetShowHomeButtonNotification}
- {@link "Onboarding Messages".SetAdBlockingNotification}
- {@link "Onboarding Messages".SetDuckAiInAddressBarNotification}

Sent when the user turns a setting on or off. Each one sends a {@link "Onboarding Messages".SystemValue}. For `setDuckAiInAddressBar`, `true` means Search & Duck.ai and `false` means Search only.

```json
{
  "enabled": true
}
```

### `setOnboardingInstallOptions`
{@link "Onboarding Messages".SetOnboardingInstallOptionsNotification}

Sent on Windows with the install options the user picked on the getStarted step.

```json
{
  "sideloadExtensions": true,
  "openAtStartup": false
}
```

### `requestChromeExtensionInstall`
{@link "Onboarding Messages".RequestChromeExtensionInstallNotification}

Sent when the user opts in to installing the Chrome search extension. The page moves on without waiting for the install.

### `telemetryEvent`
{@link "Onboarding Messages".TelemetryEventNotification}

Lets native fire a pixel for a UI interaction. See {@link "Onboarding Messages".TelemetryEvent} for every event.

```json
{
  "attributes": {
    "name": "row_shown",
    "value": "dock"
  }
}
```

### `dismissToAddressBar`
{@link "Onboarding Messages".DismissToAddressBarNotification}

Sent when the user clicks Start Browsing at the end of onboarding.

### `dismissToSettings`
{@link "Onboarding Messages".DismissToSettingsNotification}

Sent when the user finishes onboarding and chooses to go to settings.

### `submitQuery`
{@link "Onboarding Messages".SubmitQueryNotification}

Sent instead of `dismissToAddressBar` when the user submits a search or a Duck.ai prompt on the searchOrChat step. Native ends onboarding and opens the query in the Welcome tab.

```json
{
  "mode": "duckAi",
  "query": "Plan a weekend in Lisbon",
  "source": "suggestion"
}
```

### `addFavorites`
{@link "Onboarding Messages".AddFavoritesNotification}

Sent once when the user clicks Add to favorites on the picker step, before the page moves on. Native creates a favorite for each site and uses its `id` to find the bundled icon. Skip sends nothing beyond `stepCompleted`.

```json
{
  "favorites": [
    { "id": "gmail", "url": "https://mail.google.com" },
    { "id": "youtube", "url": "https://www.youtube.com" }
  ]
}
```

### `reportInitException`
{@link "Onboarding Messages".ReportInitExceptionNotification}

Sent when the page fails to load, or when an uncaught error or unhandled rejection reaches the window.

```json
{
  "message": "[uncaught] Cannot read properties of undefined"
}
```

### `reportPageException`
{@link "Onboarding Messages".ReportPageExceptionNotification}

Sent when the page has loaded but a step hits an error it can't recover from. `id` is the step that was showing.

```json
{
  "message": "Cannot read properties of undefined",
  "id": "systemSettings"
}
```
