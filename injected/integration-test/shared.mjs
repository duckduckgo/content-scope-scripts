/** @type {boolean} */
let suppressingExpectedFailures = false;

/**
 * Sets up a console handler on a Playwright page that filters out expected errors.
 *
 * @param {import('@playwright/test').Page} page - The Playwright page
 */
export function forwardConsole(page) {
    page.on('console', (msg) => {
        if (suppressingExpectedFailures) {
            return;
        }
        console.log(msg.type(), msg.text());
    });
}

/**
 * Executes an action that will trigger an expected request failure (e.g., navigation
 * to a custom protocol like duck://). Captures the failed request URL while suppressing
 * console noise from the expected 404 error.
 *
 * @param {import('@playwright/test').Page} page - The Playwright page
 * @param {() => Promise<void>} action - The action that triggers the navigation
 * @param {string} [urlPrefix='duck'] - URL prefix to match for the expected failure
 * @returns {Promise<string>} - The URL of the failed request
 */
export async function captureExpectedRequestFailure(page, action, urlPrefix = 'duck') {
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

    page.context().on('requestfailed', handler);
    suppressingExpectedFailures = true;

    try {
        await action();
        const url = await failure;
        // Brief delay to allow console messages to be suppressed
        await new Promise((resolve) => setTimeout(resolve, 50));
        return url;
    } finally {
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
