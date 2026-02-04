/**
 * Checks if a console message is an expected error that should be filtered out.
 * These are typically errors for custom protocols like duck:// that browsers
 * don't understand in the test environment, but native apps handle correctly.
 *
 * @param {string} text - The console message text
 * @returns {boolean} - True if the message should be filtered out
 */
export function isExpectedTestError(text) {
    // Filter out expected errors for duck:// protocol URLs
    // These occur when tests navigate to custom protocol URLs that
    // browsers can't handle, but native apps process correctly
    if (text.includes('duck://')) {
        return true;
    }
    return false;
}

/**
 * Sets up a console handler on a Playwright page that filters out expected errors.
 *
 * @param {import('@playwright/test').Page} page - The Playwright page
 * @param {object} [options]
 * @param {string} [options.prefix] - Optional prefix for log output (e.g., '->')
 */
export function forwardConsole(page, options = {}) {
    const { prefix } = options;
    page.on('console', (msg) => {
        const text = msg.text();
        if (isExpectedTestError(text)) {
            return;
        }
        if (prefix) {
            console.log(prefix, msg.type(), text);
        } else {
            console.log(msg.type(), text);
        }
    });
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
