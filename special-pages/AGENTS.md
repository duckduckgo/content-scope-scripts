# Special Pages

Preact-based HTML/CSS/JS applications embedded in DuckDuckGo browsers. Each page is an isolated app with privileged native API access.

## Structure

```
pages/<name>/
├── app/              # Preact components (App.jsx, *.module.css)
├── src/index.js      # Page class with messaging methods  
├── messages/         # JSON schemas → auto-generates types/
├── types/<name>.ts   # Generated types (DO NOT EDIT)
├── public/           # Static assets, index.html, locales/
└── integration-tests/
shared/               # Reusable components (Button, Card, Switch, Text) and functions
```

## Code Style

Pages communicate with native via `@duckduckgo/messaging`. Define schemas in `messages/`:
- `*.request.json` + `*.response.json` → async request/response
- `*.notify.json` → fire-and-forget notification
- `*.subscribe.json` → push-based subscription

Types in `types/` are auto-generated from `messages/` schemas - never edit these manually.

Use JSDoc types in JavaScript files. Import types via a `@typedef` after imports:

```javascript
/** @typedef {import('./types.js').MyType} MyType */
```

Use the Page Object pattern (see `integration-tests/<name>.js` for helpers) when writing integration tests.

Localized strings are compiled from multiple `strings.json` files into a single `public/locales/en/<page>.json` file. This is manually uploaded to Smartling to generate each `public/locales/<locale>/<page>.json` file.

## Testing

Run from `special-pages/` directory:

| Command | Purpose |
|---------|---------|
| `npm run test-unit` | Unit tests |
| `npm run test-int -- --reporter list` | Integration tests (all platforms) |
| `npm run test-int -- --project ios --repoter list` | Single platform |
| `npm run test-int -- --grep "test name" --reporter list` | Run integration tests matching a pattern |
| `npm run test-int -- pages/new-tab/integration-tests/new-tab.spec.js --reporter list` | Run single integration test suite |
| `npm run test-int-x -- --reporter list` | Exclude screenshot tests |
| `npm run test.screenshots -- --reporter list` | Screenshot tests only |

Top-level commands (`npm run build`, `npm run lint`) also work from this directory.

## Notes

- Use `.github/pull_request_template.md` when creating a pull request.
- Use Netlify links (`https://deploy-preview-<pr-number>--content-scope-scripts.netlify.app/build/pages/<name>/`) in the testing steps of a pull request.
- Playwright MCP server (if available) or `npx playwright` can be used to validate UI changes if desired. Use `npm run watch -- --page <name>` if user hasn't already done so and then navigate to `http://localhost:8000`.
