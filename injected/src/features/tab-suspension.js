import ContentFeature from '../content-feature.js';

/**
 * Detects conditions that should prevent tab suspension.
 * Sub-features are individually gated via feature settings.
 */
export class TabSuspension extends ContentFeature {
    init() {
        if (this.getFeatureSettingEnabled('inputFieldFocusDetection')) {
            this.initInputFieldFocusDetection();
        }
        if (this.getFeatureSettingEnabled('indexedDBDetection')) {
            this.initIndexedDBDetection();
        }
    }

    initInputFieldFocusDetection() {
        const settings = this.getFeatureSetting('inputFieldFocusDetection') || {};
        const nativeEnabled = settings.nativeEnabled !== false;
        if (!nativeEnabled) return;

        document.addEventListener(
            'focusin',
            (e) => {
                if (isFormElement(/** @type {Element | null} */ (e.target))) {
                    this.notify('formFocusChanged', { isFocused: true });
                }
            },
            true,
        );
    }
    initIndexedDBDetection() {
        const settings = this.getFeatureSetting('indexedDBDetection') || {};
        const nativeEnabled = settings.nativeEnabled !== false;
        if (!nativeEnabled) return;

        let openCount = 0;
        const notifyState = () => {
            this.notify('indexedDBStateChanged', { isActive: openCount > 0 });
        };

        const trackDatabase = (/** @type {IDBDatabase} */ db) => {
            openCount++;
            notifyState();
            db.addEventListener('close', () => {
                openCount = Math.max(0, openCount - 1);
                notifyState();
            });
        };

        // Wrap close() to catch explicit closes before the event fires
        this.wrapMethod(IDBDatabase.prototype, 'close', function (originalClose) {
            openCount = Math.max(0, openCount - 1);
            notifyState();
            return originalClose.call(this);
        });

        this.wrapMethod(IDBFactory.prototype, 'open', (originalOpen, ...args) => {
            const request = originalOpen.call(globalThis.indexedDB, ...args);
            request.addEventListener('success', () => {
                trackDatabase(/** @type {IDBDatabase} */ (request.result));
            });
            return request;
        });
    }
}

/**
 * @param {Element | null} el
 * @returns {boolean}
 */
function isFormElement(el) {
    if (!el) return false;
    const tag = el.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
    if (tag === 'IFRAME') return true;
    if (/** @type {HTMLElement} */ (el).isContentEditable) return true;
    return false;
}

export default TabSuspension;
