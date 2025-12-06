---
title: Special Error Page
---

# Special Error Page

Displays SSL certificate errors and malicious site warnings.

## Requests

### `initialSetup`
{@link "SpecialError Messages".InitialSetupRequest}

Configure initial special error page settings.

**Types:**
- Response: {@link "SpecialError Messages".InitialSetupResponse}

Example for a phishing warning:

```json
{
  "locale": "en",
  "env": "production",
  "platform": {
    "name": "macos"
  },
  "errorData": {
    "kind": "phishing",
    "url": "https://malicious-example.com"
  },
  "theme": "light",
  "themeVariant": "default"
}
```

Example for a malware warning:

```json
{
  "locale": "en",
  "env": "production",
  "platform": {
    "name": "windows"
  },
  "errorData": {
    "kind": "malware",
    "url": "https://malware-example.com"
  },
  "theme": "dark",
  "themeVariant": "default"
}
```

Example for an SSL expired certificate error:

```json
{
  "locale": "en",
  "env": "production",
  "platform": {
    "name": "macos"
  },
  "errorData": {
    "kind": "ssl",
    "errorType": "expired",
    "domain": "expired.badssl.com"
  },
  "theme": "light",
  "themeVariant": "default"
}
```

Example for an SSL wrong host error:

```json
{
  "locale": "en",
  "env": "production",
  "platform": {
    "name": "macos"
  },
  "errorData": {
    "kind": "ssl",
    "errorType": "wrongHost",
    "domain": "wrong.host.badssl.com",
    "eTldPlus1": "badssl.com"
  },
  "theme": "light",
  "themeVariant": "default"
}
```

### Error Data Types

**Malicious Site** (`kind`: `phishing` | `malware` | `scam`):
- `kind`: Type of malicious site
- `url`: The URL of the malicious site

**SSL Errors** (`kind`: `ssl`):
- `errorType`: One of `expired`, `invalid`, `selfSigned`, `wrongHost`
- `domain`: The domain with the certificate issue
- `eTldPlus1`: (Only for `wrongHost`) The eTLD+1 of the expected domain

Available theme variants: `default`, `coolGray`, `slateBlue`, `green`, `violet`, `rose`, `orange`, `desert`

## Subscriptions

### `onThemeUpdate`
- {@link "SpecialError Messages".OnThemeUpdateSubscription}
- Sends {@link "SpecialError Messages".OnThemeUpdateSubscribe} whenever the browser theme changes.
- For example:
```json
{
  "theme": "dark",
  "themeVariant": "default"
}
```
- Or, with a different theme variant:
```json
{
  "theme": "light",
  "themeVariant": "violet"
}
```
- Available theme variants: `default`, `coolGray`, `slateBlue`, `green`, `violet`, `rose`, `orange`, `desert`

## Notifications

### `leaveSite`
- {@link "SpecialError Messages".LeaveSiteNotification}
- Sent when the user clicks the "Leave Site" or "Go Back" button to navigate away from the dangerous site.

### `visitSite`
- {@link "SpecialError Messages".VisitSiteNotification}
- Sent when the user chooses to proceed to the site despite the warning.

### `advancedInfo`
- {@link "SpecialError Messages".AdvancedInfoNotification}
- Sent when the user clicks the "Advanced" button to view more details about the error.

### `reportInitException`
- {@link "SpecialError Messages".ReportInitExceptionNotification}
- Reports errors during page initialization.

```json
{
  "message": "Failed to initialize special error page"
}
```

### `reportPageException`
- {@link "SpecialError Messages".ReportPageExceptionNotification}
- Reports errors during page operations.

```json
{
  "message": "Failed to render error details"
}
```
