/** @type {number} Count of active withExpectedFailure calls */
let expectingFailureCount = 0;

/**
 * Sets up a console handler on a Playwright page.
 * Preserves log levels by routing to the appropriate console method (error, warn, log, etc.)
 * Filters "Failed to load resource" errors when withExpectedFailure is active.
 *
 * @param {import('@playwright/test').Page} page - The Playwright page
 */
export function forwardConsole(page) {
    page.on('console', (msg) => {
        const type = msg.type();
        const text = msg.text();

        // Filter "Failed to load resource" errors when we're expecting a failure
        // These are duplicated by browser native output, so we skip them here
        if (text.includes('Failed to load resource') && expectingFailureCount > 0) {
            return;
        }

        // Handle 'assert' specially - console.assert only logs when first arg is falsy,
        // so we use console.error instead to ensure assertion failures are visible
        if (type === 'assert') {
            console.error('assert', text);
            return;
        }
        // Use the appropriate console method to preserve log levels
        // Fall back to console.log for unknown types
        const logFn = console[type] ?? console.log;
        logFn.call(console, type, text);
    });
}

/**
 * Executes an action that triggers an expected request failure (e.g., navigation to a
 * custom protocol like duck://). Captures the URL of the failed request.
 * While active, forwardConsole will filter "Failed to load resource" errors.
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
        const url = f.url();
        if (url.startsWith(urlPrefix)) {
            resolveFailure(url);
        }
    };

    // Set up filtering BEFORE the action
    expectingFailureCount++;
    page.context().on('requestfailed', handler);

    try {
        await action();
        const url = await failure;
        // Brief delay to allow console messages to be filtered before we decrement
        await new Promise((resolve) => setTimeout(resolve, 10));
        return url;
    } finally {
        page.context().off('requestfailed', handler);
        expectingFailureCount--;
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
