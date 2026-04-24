/**
 * Sets up a console handler on a Playwright page.
 * Preserves log levels by routing to the appropriate console method (error, warn, log, etc.)
 *
 * @param {import('@playwright/test').Page} page - The Playwright page
 * @param {object} [options]
 * @param {boolean} [options.filterResourceErrors=false] - Filter "Failed to load resource" errors
 *   (useful when these are expected and already shown by browser's native stderr)
 */
export function forwardConsole(page, options = {}) {
    const { filterResourceErrors = false } = options;

    page.on('console', (msg) => {
        const type = msg.type();
        const text = msg.text();

        // Optionally skip "Failed to load resource" errors - these are already shown by
        // browser's native stderr output, so logging them here creates duplicates
        if (filterResourceErrors && text.includes('Failed to load resource')) {
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

    page.context().on('requestfailed', handler);

    try {
        await action();
        return await failure;
    } finally {
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
