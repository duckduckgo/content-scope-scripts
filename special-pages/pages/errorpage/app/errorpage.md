---
title: Error Page
---

# Error Page

A simple error page template for browser loading failures. Unlike other special pages, this page does not use messaging—native interacts via string interpolation and a global callback.

## String Interpolation

Native performs string replacement on the HTML before loading:

| Variable | Description |
|----------|-------------|
| `$HEADER$` | Error title text |
| `$ERROR_DESCRIPTION$` | Error description text |
| `$THEME_VARIANT$` | Theme variant name (falls back to default if not replaced) |

## Runtime Theme Updates

Native can update the theme by calling:

```javascript
window.onChangeTheme({ themeVariant: 'coolGray' });
```

**Payload:**
```json
{
  "themeVariant": "violet"
}
```

Available theme variants: `default`, `coolGray`, `slateBlue`, `green`, `violet`, `rose`, `orange`, `desert`
