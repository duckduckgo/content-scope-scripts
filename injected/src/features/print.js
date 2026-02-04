import ContentFeature from '../content-feature.js';

/**
 * Overrides window.print() to notify the native app, allowing it to handle
 * printing with platform-appropriate UI and controls.
 *
 * This feature consolidates PrintingUserScript (iOS/macOS) into a shared
 * C-S-S implementation that works across Apple platforms.
 */
export class Print extends ContentFeature {
    init() {
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
    }
}

export default Print;
