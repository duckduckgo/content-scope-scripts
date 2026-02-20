import ContentFeature from '../content-feature.js';

/**
 * Overrides window.print() to notify the native app, allowing it to handle
 * printing with platform-appropriate UI and controls.
 *
 * This feature is only needed on iOS where the native window.print() API
 * doesn't work in WKWebView. On macOS, the native API works correctly so
 * we skip the override.
 */
export class Print extends ContentFeature {
    init() {
        // macOS native window.print() works fine, no override needed
        if (this.platform?.name === 'macos') {
            return;
        }

        const notify = this.notify.bind(this);

        this.defineProperty(window, 'print', {
            configurable: true,
            enumerable: true,
            writable: true,
            value: function print() {
                notify('print', {});
                // Don't call originalPrint - native handles the actual print dialog
            },
        });
    }
}

export default Print;
