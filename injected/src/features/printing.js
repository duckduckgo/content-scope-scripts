import ContentFeature from '../content-feature.js';

/**
 * Apple WebKit printing support.
 *
 * Some sites rely on `window.print()` being present. On Apple WebKit we support
 * printing by sending a message to the native layer via `printHandler`.
 *
 * Native must register `webkit.messageHandlers.printHandler`.
 */
export class Printing extends ContentFeature {
    init() {
        const handler = globalThis.webkit?.messageHandlers?.printHandler;
        if (!handler || typeof handler.postMessage !== 'function') return;

        try {
            // Mirror the legacy Apple user script behavior.
            this.defineProperty(globalThis, 'print', {
                configurable: true,
                enumerable: true,
                writable: true,
                value: function () {
                    // Intentionally no payload.
                    handler.postMessage({});
                },
            });
        } catch {
            // Ignore exceptions that could be caused by conflicting with other scripts/extensions.
        }
    }
}

export default Printing;
