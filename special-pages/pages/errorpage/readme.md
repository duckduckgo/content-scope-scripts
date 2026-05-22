This is an Error Page template page used as a placeholder to display a browser loading failure page.

### Integration

Serve the entire folder found under `build/<PLATFORM>/pages/errorpage`

### Platform Integration

So far, the following platforms are supported

- macOS

### Theming

The error page supports theming through two mechanisms:

#### Template Variable: `$THEME_VARIANT$`

Native performs string interpolation to replace `$THEME_VARIANT$` in the HTML with a theme variant name.

If string interpolation is not performed (i.e., `$THEME_VARIANT$` is left as-is), the page falls back to the default styling.

**Supported variants:** `default`, `coolGray`, `slateBlue`, `green`, `violet`, `rose`, `orange`, `desert`

#### Callback: `window.onChangeTheme`

Native can call `window.onChangeTheme(payload)` to update the theme at runtime.

**Payload:**
```json
{
  "themeVariant": "coolGray"
}
```

**Example native usage:**
```javascript
window.onChangeTheme({ themeVariant: 'coolGray' });
```

---

## Contributing

### HTML
The main HTML file is located at `src/index.html`. You can edit this file directly

### CSS
The main stylesheet is located at `src/style.css`. You can edit this file directly

The build process will create a bundle and place it under `build/<PLATFORM>/pages/errorpage`

Don't edit the generated files directly - any changes you make will not be reflected in the final build output. 

Instead, make your changes in `src/` and then run `npm run build` from the root folder
  - or to build the special pages only (faster), run `npm run postbuild` instead
