# When to Use C-S-S

Decision guide for when to use C-S-S injected scripts vs native code.

## C-S-S Injected Scripts

Best for:

- In-page changes or DOM manipulations
- Anything modifying a DOM API or manipulating page content
- Code that benefits from config, breakage tooling, and DOM wrappers
- Testing/linting/bundling makes code more robust than native-only

## Native Code

Best for:

- Listening to bridge/handler messages
- When WebView APIs do the job better
- Avoid injecting scripts when native can handle it—harder to debug, no tooling

## SERP/Static Pages

Can expose/call bridge messages, cleaner than scraping page content.

## Decision Checklist

| Question                                | Recommendation                                        |
| --------------------------------------- | ----------------------------------------------------- |
| Modifying DOM API or manipulating page? | **Must** be in C-S-S                                  |
| Need config handling, testing?          | Prefer C-S-S (free tooling)                           |
| Code relies on page structure?          | Use config to alter behavior; avoid if possible       |
| Internal page involved?                 | Consider having the page expose an API/fire a message |
| Writing conditionals for iframe/domain? | Use `conditionalChanges` in config                    |
| Exposing new APIs?                      | Check if `apiManipulation` feature handles it         |
| Need isolated context?                  | Prefer isolated entry point if possible               |

## Message Handlers vs Bridge

- **Message handlers**: Limit to pages that need them; use script evaluation over messaging unless payload size is problematic
- **Bridge**: Config-enabled messages that pass through C-S-S; use subscriptions for exposing custom behavior to native
- If our site is involved, push messages to native rather than scraping
