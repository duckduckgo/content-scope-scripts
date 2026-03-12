# Global Error Listener Audit Report

## Background

Global `window.addEventListener('error')` and `window.addEventListener('unhandledrejection')` listeners were added to three special pages — **onboarding**, **new-tab**, and **history** — to catch uncaught JavaScript errors that fall outside Preact's ErrorBoundary (event handlers, async callbacks, timers, observers, etc.). Caught errors are reported to native via `reportInitException`.

This audit verifies that the listeners actually catch errors across all relevant code-path categories, produce no false positives during normal operation, and do not double-report errors already handled by ErrorBoundary.

---

## Code Under Test

Each page registers two listeners immediately after the messaging instance is created, before `init()` is called:

```js
// Example: history/src/index.js (onboarding and new-tab are identical in shape)
const historyPage = new HistoryPage(messaging);

window.addEventListener('error', (event) => {
    const message = event.error?.message || event.message || 'unknown error';
    historyPage.reportInitException({ message: `[uncaught] ${message}` });
});

window.addEventListener('unhandledrejection', (event) => {
    const message = event.reason?.message || String(event.reason) || 'unknown rejection';
    historyPage.reportInitException({ message: `[unhandledrejection] ${message}` });
});
```

Note: New Tab's `reportInitException` takes a bare string rather than `{ message }`, matching its existing API.

---

## Methodology

### Test infrastructure

Tests were run with Playwright against the built integration artifacts, using the same `Mocks` class the project's existing integration tests use. The mock messaging transport intercepts all outgoing `notify`/`request` calls and stores them for later assertion.

### Scenario injection

Each scenario is a function passed to `page.evaluate()`, which serializes it and executes it inside the browser page. The test runner:

1. Opens the page and waits for it to fully initialize
2. Records the baseline `reportInitException` call count
3. Calls `page.evaluate(scenario.inject)` to trigger the error inside the page
4. Waits (via polling) for the call count to increment
5. Asserts the new message contains the expected prefix and error text

```js
async function runScenario(page, mocks, scenario) {
    const before = await mocks.outgoing({ names: ['reportInitException'] });
    const countBefore = before.length;

    await page.evaluate(scenario.inject);

    const calls = await mocks.waitForCallCount({
        method: 'reportInitException',
        count: countBefore + 1,
        timeout: 3000,
    });

    const newCalls = calls.slice(countBefore);
    expect(newCalls.length).toBeGreaterThanOrEqual(1);
    expect(newCalls[0].payload.params.message).toContain(scenario.expected);
}
```

### Category 1 — Uncaught synchronous errors (`window` `error` event)

These simulate errors thrown from various asynchronous browser APIs that cannot be wrapped in try/catch by application code:

```js
// 1. setTimeout callback
() => setTimeout(() => { throw new Error('AUDIT:setTimeout'); }, 0)

// 2. setInterval callback
() => {
    const id = setInterval(() => {
        clearInterval(id);
        throw new Error('AUDIT:setInterval');
    }, 0);
}

// 3. requestAnimationFrame callback
() => requestAnimationFrame(() => { throw new Error('AUDIT:rAF'); })

// 4. DOM click event handler
() => {
    const btn = document.createElement('button');
    document.body.appendChild(btn);
    btn.addEventListener('click', () => { throw new Error('AUDIT:click'); });
    btn.click();
}

// 5. Custom DOM event handler
() => {
    window.addEventListener('__audit_evt', () => {
        throw new Error('AUDIT:customEvt');
    }, { once: true });
    window.dispatchEvent(new CustomEvent('__audit_evt'));
}

// 6. MutationObserver callback
() => {
    const t = document.createElement('div');
    document.body.appendChild(t);
    const o = new MutationObserver(() => {
        o.disconnect();
        throw new Error('AUDIT:MO');
    });
    o.observe(t, { childList: true });
    t.appendChild(document.createElement('span'));
}

// 7. MessageChannel port handler
() => {
    const ch = new MessageChannel();
    ch.port1.onmessage = () => { throw new Error('AUDIT:msgCh'); };
    ch.port2.postMessage('x');
}
```

### Category 2 — Unhandled promise rejections (`window` `unhandledrejection` event)

These simulate the various ways a promise can reject without a `.catch()`:

```js
// 1. Promise.reject with Error object
() => {
    Promise.reject(new Error('AUDIT:pReject'));
};

// 2. async function throw (becomes a rejected promise)
() => {
    (async () => {
        throw new Error('AUDIT:asyncThrow');
    })();
};

// 3. Throw inside .then() (no .catch() on the chain)
() => {
    Promise.resolve().then(() => {
        throw new Error('AUDIT:thenThrow');
    });
};

// 4. Promise.reject with a plain string (tests non-Error reason handling)
() => {
    Promise.reject('AUDIT:strReject');
};

// 5. new Promise with reject callback
() => {
    new Promise((_, rej) => rej(new Error('AUDIT:newPReject')));
};
```

### Category 3 — False positive check

Verifies that normal page operation (load, render cycles, resize events) produces zero `reportInitException` calls:

```js
async function assertCleanPageLoad(page, mocks) {
    await page.waitForTimeout(200);
    await page.evaluate(() => window.dispatchEvent(new Event('resize')));
    await page.waitForTimeout(200);

    const initCalls = await mocks.outgoing({ names: ['reportInitException'] });
    expect(initCalls).toHaveLength(0);
}
```

### ErrorBoundary isolation (architectural verification)

Errors during Preact component rendering are caught by `ErrorBoundary.componentDidCatch`, which calls `reportPageException` — a separate channel from `reportInitException`. Preact's error boundary mechanism prevents these errors from propagating to `window.onerror`, so there is no double-reporting path. This was verified by code inspection of:

- `shared/components/ErrorBoundary.js` — catches render errors, calls `props.didCatch()`
- `shared/components/InlineErrorBoundary.js` — wraps ErrorBoundary, routes to `reportPageException`
- None of the ErrorBoundary code paths call `reportInitException`

### Platform coverage

| Page       | Playwright project | Browser |
| ---------- | ------------------ | ------- |
| History    | `integration`      | Chrome  |
| New Tab    | `integration`      | Chrome  |
| Onboarding | `windows`          | Edge    |

---

## Results

**39 / 39 tests passed.**

### Category 1 — Uncaught errors → `[uncaught]` prefix

| Scenario                               | History | New Tab | Onboarding |
| -------------------------------------- | ------- | ------- | ---------- |
| `setTimeout` callback throw            | PASS    | PASS    | PASS       |
| `setInterval` callback throw           | PASS    | PASS    | PASS       |
| `requestAnimationFrame` callback throw | PASS    | PASS    | PASS       |
| DOM click event handler throw          | PASS    | PASS    | PASS       |
| Custom DOM event handler throw         | PASS    | PASS    | PASS       |
| `MutationObserver` callback throw      | PASS    | PASS    | PASS       |
| `MessageChannel` port handler throw    | PASS    | PASS    | PASS       |

### Category 2 — Unhandled rejections → `[unhandledrejection]` prefix

| Scenario                         | History | New Tab | Onboarding |
| -------------------------------- | ------- | ------- | ---------- |
| `Promise.reject(new Error(...))` | PASS    | PASS    | PASS       |
| `async` function throw           | PASS    | PASS    | PASS       |
| `.then()` throw                  | PASS    | PASS    | PASS       |
| `Promise.reject(string)`         | PASS    | PASS    | PASS       |
| `new Promise` reject             | PASS    | PASS    | PASS       |

### Category 3 — False positive check

| Scenario                              | History | New Tab | Onboarding |
| ------------------------------------- | ------- | ------- | ---------- |
| Clean page load + resize — zero calls | PASS    | PASS    | PASS       |

---

## Conclusion

The global error listeners correctly catch and report all tested categories of uncaught errors and unhandled rejections across all three pages, with correct `[uncaught]` / `[unhandledrejection]` prefixes. No false positives were observed during normal page operation. ErrorBoundary-caught render errors are routed exclusively through `reportPageException` with no double-reporting.
