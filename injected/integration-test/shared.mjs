/** @type {boolean} */
let suppressingExpectedFailures = false;

/**
 * Sets up a console handler on a Playwright page that filters out expected errors.
 * Preserves log levels by routing to the appropriate console method (error, warn, log, etc.)
 *
 * @param {import('@playwright/test').Page} page - The Playwright page
 */
export function forwardConsole(page) {
    page.on('console', (msg) => {
        if (suppressingExpectedFailures) {
            return;
        }
        const type = msg.type();
        const text = msg.text();
        // Use the appropriate console method to preserve log levels
        // Fall back to console.log for unknown types
        const logFn = console[type] ?? console.log;
        logFn.call(console, type, text);
    });
}

/**
 * Executes an action that triggers an expected request failure (e.g., navigation to a
 * custom protocol like duck://). Sets up the listener and suppression BEFORE executing
 * the action, and guarantees cleanup in a finally block.
 *
 * @param {import('@playwright/test').Page} page - The Playwright page
 * @param {() => Promise<void>} action - The action that triggers the failure
 * @param {string} [urlPrefix='duck'] - URL prefix to match for the expected failure
 * @returns {Promise<string>} - The URL of the failed request
 *
 * @example
 * const url = await withExpectedFailure(page, () => page.click('a[href^="duck://"]'));
 * expect(url).toEqual('duck://player/123');
 */
export async function withExpectedFailure(page, action, urlPrefix = 'duck') {
    /** @type {(url: string) => void} */
    let resolveFailure;
    const failure = new Promise((resolve) => {
        resolveFailure = resolve;
    });

    const handler = (/** @type {{ url: () => string }} */ f) => {
        if (f.url().startsWith(urlPrefix)) {
            resolveFailure(f.url());
        }
    };

    // Setup listener and suppression BEFORE action
    page.context().on('requestfailed', handler);
    suppressingExpectedFailures = true;

    try {
        await action();
        return await failure;
    } finally {
        // Cleanup ALWAYS happens, even if action throws
        suppressingExpectedFailures = false;
        page.context().off('requestfailed', handler);
    }
}

export function windowsGlobalPolyfills() {
    // @ts-expect-error - testing
    if (typeof Bluetooth === 'undefined') {
        globalThis.Bluetooth = {};
        globalThis.Bluetooth.prototype = {
            requestDevice: async () => {
                /* noop */
            },
        };
    }
    // @ts-expect-error - testing
    if (typeof USB === 'undefined') {
        globalThis.USB = {};
        globalThis.USB.prototype = {
            requestDevice: async () => {
                /* noop */
            },
        };
    }

    // @ts-expect-error - testing
    if (typeof Serial === 'undefined') {
        globalThis.Serial = {};
        globalThis.Serial.prototype = {
            requestPort: async () => {
                /* noop */
            },
        };
    }
    // @ts-expect-error - testing
    if (typeof HID === 'undefined') {
        globalThis.HID = {};
        globalThis.HID.prototype = {
            requestDevice: async () => {
                /* noop */
            },
        };
    }
}
