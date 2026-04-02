import ContentFeature from '../content-feature.js';

/**
 * Detects conditions that should prevent tab suspension.
 * Sub-features are individually gated via feature settings.
 *
 * Native side polls by pushing a `canSuspend` subscription message.
 * JS checks all enabled detectors and responds with `canSuspendResult { canSuspend: bool }`.
 */
export class TabSuspension extends ContentFeature {
    /** @type {boolean} */
    #hasFormInteraction = false;

    /** @type {{ count: number, tracked: WeakSet<IDBDatabase> }} */
    #indexedDBState = { count: 0, tracked: new WeakSet() };

    init() {
        if (this.getFeatureSettingEnabled('inputFieldFocusDetection')) {
            this.initInputFieldFocusDetection();
        }
        if (this.getFeatureSettingEnabled('indexedDBDetection')) {
            this.initIndexedDBDetection();
        }

        this.subscribe('canSuspend', async (/** @type {{ id: string }} */ params) => {
            const canSuspend = await this.evaluateCanSuspend();
            this.notify('canSuspendResult', { id: params.id, canSuspend });
        });
    }

    /**
     * Evaluate whether the page can be suspended based on all enabled detectors.
     * @returns {Promise<boolean>}
     */
    async evaluateCanSuspend() {
        if (this.getFeatureSettingEnabled('inputFieldFocusDetection')) {
            const settings = this.getFeatureSetting('inputFieldFocusDetection') || {};
            if (settings.nativeEnabled !== false && this.#hasFormInteraction) {
                return false;
            }
        }

        if (this.getFeatureSettingEnabled('indexedDBDetection')) {
            const settings = this.getFeatureSetting('indexedDBDetection') || {};
            if (settings.nativeEnabled !== false && this.#indexedDBState.count > 0) {
                return false;
            }
        }

        if (this.getFeatureSettingEnabled('webLockDetection')) {
            const settings = this.getFeatureSetting('webLockDetection') || {};
            if (settings.nativeEnabled !== false) {
                try {
                    const { held, pending } = await navigator.locks.query();
                    if ((held?.length ?? 0) > 0 || (pending?.length ?? 0) > 0) {
                        return false;
                    }
                } catch {
                    // Web Locks API unavailable — not a blocker
                }
            }
        }

        return true;
    }

    initInputFieldFocusDetection() {
        const settings = this.getFeatureSetting('inputFieldFocusDetection') || {};
        const nativeEnabled = settings.nativeEnabled !== false;
        if (!nativeEnabled) return;

        document.addEventListener(
            'focusin',
            (e) => {
                if (isFormElement(/** @type {Element | null} */ (e.target))) {
                    this.#hasFormInteraction = true;
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

        const state = this.#indexedDBState;

        // Wrap close(): call native first, only update state on success.
        // Gate on tracked instances to prevent spoofing via illegal receiver.
        this.wrapMethod(
            IDBDatabase.prototype,
            'close',
            /** @this {IDBDatabase} */ function (originalClose) {
                const result = originalClose.call(this);
                if (state.tracked.has(this)) {
                    state.tracked.delete(this);
                    state.count = Math.max(0, state.count - 1);
                }
                return result;
            },
        );

        // Preserve native receiver semantics with originalOpen.call(this, ...)
        this.wrapMethod(
            IDBFactory.prototype,
            'open',
            /** @this {IDBFactory} */ function (originalOpen, ...args) {
                const request = originalOpen.call(this, ...args);
                request.addEventListener('success', () => {
                    const db = /** @type {IDBDatabase} */ (request.result);
                    state.tracked.add(db);
                    state.count++;
                    db.addEventListener('close', () => {
                        if (!state.tracked.has(db)) return;
                        state.tracked.delete(db);
                        state.count = Math.max(0, state.count - 1);
                    });
                });
                return request;
            },
        );
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
