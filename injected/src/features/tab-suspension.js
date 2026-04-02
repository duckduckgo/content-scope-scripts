import ContentFeature from '../content-feature.js';

/**
 * Detects conditions that should prevent tab suspension.
 * Sub-features are individually gated via feature settings.
 *
 * Sends a `canBeSuspended` notification whenever the aggregate state changes.
 */
export class TabSuspension extends ContentFeature {
    /** @type {boolean} */
    #canBeSuspended = true;

    init() {
        if (this.getFeatureSettingEnabled('inputFieldFocusDetection')) {
            this.initInputFieldFocusDetection();
        }
    }

    initInputFieldFocusDetection() {
        document.addEventListener(
            'focusin',
            (e) => {
                if (!this.#canBeSuspended) return;
                if (isFormElement(/** @type {Element | null} */ (e.target))) {
                    this.#canBeSuspended = false;
                    this.notify('canBeSuspended', { canBeSuspended: false });
                }
            },
            true,
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
