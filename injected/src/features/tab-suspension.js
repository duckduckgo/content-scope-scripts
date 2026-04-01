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
        if (this.getFeatureSettingEnabled('webLockDetection')) {
            this.initWebLockDetection();
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

        // Guard against environments where IndexedDB APIs are absent or blocked
        if (typeof IDBFactory !== 'function' || typeof IDBDatabase !== 'function' || !globalThis.indexedDB) return;

        let openCount = 0;
        /** @type {WeakSet<IDBDatabase>} */
        const trackedDatabases = new WeakSet();

        const notifyState = () => {
            this.notify('indexedDBStateChanged', { isActive: openCount > 0 });
        };

        const trackDatabase = (/** @type {IDBDatabase} */ db) => {
            trackedDatabases.add(db);
            openCount++;
            notifyState();
            db.addEventListener('close', () => {
                if (!trackedDatabases.has(db)) return;
                trackedDatabases.delete(db);
                openCount = Math.max(0, openCount - 1);
                notifyState();
            });
        };

        // Wrap close(): call native first, only update state on success.
        // Gate on tracked instances to prevent spoofing via illegal receiver.
        this.wrapMethod(IDBDatabase.prototype, 'close', function (originalClose) {
            const result = originalClose.call(this);
            if (trackedDatabases.has(this)) {
                trackedDatabases.delete(this);
                openCount = Math.max(0, openCount - 1);
                notifyState();
            }
            return result;
        });

        // Preserve native receiver semantics with originalOpen.call(this, ...)
        this.wrapMethod(IDBFactory.prototype, 'open', function (originalOpen, ...args) {
            const request = originalOpen.call(this, ...args);
            request.addEventListener('success', () => {
                trackDatabase(/** @type {IDBDatabase} */ (request.result));
            });
            return request;
        });
    }

    initWebLockDetection() {
        const settings = this.getFeatureSetting('webLockDetection') || {};
        const nativeEnabled = settings.nativeEnabled !== false;
        if (!nativeEnabled) return;

        this.subscribe('getWebLockState', async () => {
            try {
                const { held, pending } = await navigator.locks.query();
                const isActive = (held?.length ?? 0) > 0 || (pending?.length ?? 0) > 0;
                this.notify('webLockStateResult', { isActive });
            } catch {
                // Web Locks API unavailable (e.g. insecure context)
                this.notify('webLockStateResult', { isActive: false });
            }
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
