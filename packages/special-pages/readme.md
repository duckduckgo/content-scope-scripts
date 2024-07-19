## Architecture

Special Pages gives us a single place to implement isolated HTML/CSS/Javascript projects that can be loaded into a web context that has privileged access to API.

- `packages/special-pages/pages/example`
- `packages/special-pages/pages/duckplayer`
- `packages/special-pages/pages/errorpage`

Would translate into the following build output

- `build/apple/pages/example`
- `build/apple/pages/duckplayer`
- `build/windows/pages/example`
- `build/windows/pages/duckplayer`

This allows each respective platform to configure their integrations to use the known page.

## Running Tests
 
To run tests, use the script command `npm run test`. The process is as follows:

```mermaid
graph TD
A[npm run test] --> B[Run 'pretest' script]
B --> C[Execute `npm run build.dev` to build all pages]
C --> E[Run test.unit]
E --> F[Execute unit tests in unit-test/*]
F --> G[Run playwright test]
G --> H[Execute Playwright tests]

%% Adding conditional branches for project-specific tests
G --> I[Check if project is Windows]
G --> J[Check if project is Apple]

I --> K[Execute npm run test.windows]
J --> L[Execute npm run test.apple]

%% Continue with normal flow after conditional branches
K --> H
L --> H

%% Adding branches for additional test scripts
G --> M[Check if --headed flag]
M --> N[Execute npm run test.headed]
N --> H

G --> O[Check if --ui flag]
O --> P[Execute npm run test.ui]
P --> H
```

## Running tests for a single platform

You can run `npm run test.windows` or `npm run test.macos` to run only tests for a single platform. Consult the file `playwright.config.js` to see what's available.
