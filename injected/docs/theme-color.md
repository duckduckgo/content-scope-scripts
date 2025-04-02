---
title: Theme Color Monitor
---

# Theme Color Monitor

Reports the presence of the theme-color meta tag on page load.

The theme-color meta tag is used by browsers to customize the UI color to match the website's branding. This feature reports the theme color value when it's found on initial page load.

## Notifications

### `themeColorFound`
- {@link "Theme Color Messages".ThemeColorFoundNotification}
- Sends initial theme color value on page load
- If no theme-color meta tag is found, the themeColor value will be null

**Example**

```json
{
  "themeColor": "#ff0000",
  "documentUrl": "https://example.com"
}
```

## Remote Config

### Enabled (default)
{@includeCode ../integration-test/test-pages/theme-color/config/theme-color-enabled.json}
