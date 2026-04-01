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
