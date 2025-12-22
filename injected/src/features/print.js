import ContentFeature from '../content-feature.js';

/**
 * Overrides window.print() to notify the native app, allowing it to handle
 * printing with platform-appropriate UI and controls.
 *
 * This feature consolidates PrintInjector (Android) and PrintingUserScript (iOS/macOS)
 * into a shared C-S-S implementation.
 */
export class Print extends ContentFeature {
    init() {
        const originalPrint = window.print;
        const notify = this.notify.bind(this);

        this.defineProperty(window, 'print', {
            configurable: true,
            enumerable: true,
            writable: true,
            value: function print() {
                notify('print');
                // Don't call originalPrint - native handles the actual print dialog
            },
        });

        // Store original for potential restoration
        this._originalPrint = originalPrint;
    }
}

export default Print;
