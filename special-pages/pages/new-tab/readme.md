## Contributing

### Test URL params

URL parameters can be used to override the default values of the New Tab Page's configuration. Supported parameters are:

- `locale` - Specifies the language to use for translations. Expects a language code (e.g., `en`, `de`, `fr`).
- `textLength` - Adjusts the length of translated strings, for testing layout with different text sizes (e.g., `short`, `long`).
- `display` - Controls which view is rendered. `app` renders the main New Tab Pgae interface, `components` renders the component showcase page.
- `platform` - Overrides the detected platform, for testing platform-specific styling (e.g., `macos`, `windows`).
- `animation` - Controls animation settings. Can be `none` or `view-transitions` to override the stats widget animation config. Also sets a global `data-animation` attribute on the `<body>` tag.
- `skip-read` - If present, prevents the mock transport from reading persisted state (like widget configs) from localStorage on initialization.
- `skip-write` - If present, prevents the mock transport from writing state changes (like widget configs) to localStorage.
- `pir` - Specifies which Freemium PIR banner mock data to use. Expects a key from `freemiumPIRDataExamples` (e.g., `example1`).
- `rmf` - Specifies which Remote Messaging Framework (RMF) mock message to display. Expects a key from `rmfDataExamples` (e.g., `example1`, `example2`).
- `rmf-delay` - If `rmf` is specified, delays sending the RMF message data update by the given number of milliseconds.
- `update-notification` - Specifies which update notification mock message to display. Expects a key from `updateNotificationExamples`.
- `update-notification-delay` - If `update-notification` is specified, delays sending the update notification data by the given number of milliseconds.
- `stats` - Specifies which Privacy Stats mock dataset to use. Expects a key from `privacyStatsMocks` (e.g., `few`, `many`, `willUpdate`, `growing`).
- `stats-update-count` - When `stats` is set to `willUpdate` or `growing`, limits the number of mock data updates sent via the subscription.
- `next-steps` - Specifies which "Next Steps" cards to display. Expects one or more IDs from `nextsteps.data.js`. Can be used multiple times (e.g., `?next-steps=card1&next-steps=card2`).
- `favorites` - Specifies which Favorites mock dataset to use. Expects a key from `favorites.data.js` (e.g., `many`, `none`) or a number to generate that many mock favorites.
- `favorites.config.expansion` - If set to `expanded`, sets the initial state of the Favorites widget to be expanded.
- `feed` - Controls which primary feed widget(s) are included in the initial setup. Can be `stats`, `activity`, or `both`. Defaults to `stats`.
- `customizerDrawer` - If set to `enabled`, enables the Customizer feature flag in the initial setup.
- `autoOpen` - If `customizerDrawer` is `enabled` and this parameter is `true`, sets the `autoOpen` flag for the customizer drawer in the initial setup.
- `defaultStyles` - If set to `visual-refresh`, applies specific background color variables (`--default-light-background-color`, `--default-dark-background-color`) to the body.
- `adBlocking` - If set to `enabled`, configures the Activity and Privacy Stats widgets to indicate that both ads and trackers are blocked.
