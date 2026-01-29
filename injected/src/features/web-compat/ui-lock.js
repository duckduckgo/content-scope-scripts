import { isBeingFramed, isStateEnabled } from '../../utils.js';

/**
 * @typedef {Object} StyleValues
 * @property {string | null} value
 * @property {string | null} valueY
 */

/**
 * @typedef {Object} SignalValues
 * @property {StyleValues | null} html
 * @property {StyleValues | null} body
 * @property {boolean} matches
 */

/**
 * @typedef {Object} UiLockSignals
 * @property {SignalValues} overscrollBehavior
 * @property {SignalValues} overflow
 */

const OVERSCROLL_LOCK_VALUES = new Set(['none', 'contain']);
const OVERFLOW_LOCK_VALUES = new Set(['hidden', 'clip']);
const OVERFLOW_LOCK_VALUES_NO_CLIP = new Set(['hidden']);

/**
 * @param {CSSStyleDeclaration | null} style
 * @param {string} prop
 * @param {string} propY
 * @returns {StyleValues | null}
 */
export function readStyleValues(style, prop, propY) {
    if (!style) {
        return null;
    }
    return {
        value: style[prop] || null,
        valueY: style[propY] || null,
    };
}

/**
 * @param {StyleValues | null} values
 * @param {Set<string>} lockValues
 * @returns {boolean}
 */
function matchesLockValues(values, lockValues) {
    if (!values) {
        return false;
    }
    const valueMatches = values.value ? lockValues.has(values.value) : false;
    const valueYMatches = values.valueY ? lockValues.has(values.valueY) : false;
    return valueMatches || valueYMatches;
}

/**
 * @param {object} params
 * @param {CSSStyleDeclaration} params.htmlStyle
 * @param {CSSStyleDeclaration | null} params.bodyStyle
 * @param {boolean} params.useOverscroll
 * @param {boolean} params.useOverflow
 * @param {boolean} params.includeOverflowClip
 * @returns {{ locked: boolean, signals: UiLockSignals }}
 */
export function computeUiLockState({ htmlStyle, bodyStyle, useOverscroll, useOverflow, includeOverflowClip }) {
    const overscrollHtml = readStyleValues(htmlStyle, 'overscrollBehavior', 'overscrollBehaviorY');
    const overscrollBody = readStyleValues(bodyStyle, 'overscrollBehavior', 'overscrollBehaviorY');
    const overflowHtml = readStyleValues(htmlStyle, 'overflow', 'overflowY');
    const overflowBody = readStyleValues(bodyStyle, 'overflow', 'overflowY');

    const overflowLockValues = includeOverflowClip ? OVERFLOW_LOCK_VALUES : OVERFLOW_LOCK_VALUES_NO_CLIP;

    const overscrollMatches =
        useOverscroll &&
        (matchesLockValues(overscrollHtml, OVERSCROLL_LOCK_VALUES) || matchesLockValues(overscrollBody, OVERSCROLL_LOCK_VALUES));
    const overflowMatches =
        useOverflow && (matchesLockValues(overflowHtml, overflowLockValues) || matchesLockValues(overflowBody, overflowLockValues));

    return {
        locked: overscrollMatches || overflowMatches,
        signals: {
            overscrollBehavior: {
                html: overscrollHtml,
                body: overscrollBody,
                matches: overscrollMatches,
            },
            overflow: {
                html: overflowHtml,
                body: overflowBody,
                matches: overflowMatches,
            },
        },
    };
}

/**
 * @param {object | undefined} settings
 * @param {string} key
 * @param {import('../../utils.js').FeatureState} defaultState
 * @param {import('../../utils.js').Platform | undefined} platform
 * @returns {boolean}
 */
function getSettingEnabled(settings, key, defaultState, platform) {
    if (!settings) {
        return isStateEnabled(defaultState, platform);
    }
    const value = settings[key] ?? defaultState;
    if (typeof value === 'object') {
        return isStateEnabled(value.state, platform);
    }
    return isStateEnabled(value, platform);
}

/**
 * @param {object | undefined} settings
 * @param {string} key
 * @param {number} defaultValue
 * @returns {number}
 */
function getSettingNumber(settings, key, defaultValue) {
    if (!settings) {
        return defaultValue;
    }
    const value = settings[key];
    return typeof value === 'number' ? value : defaultValue;
}

export class BrowserUiLockController {
    /**
     * @param {object} params
     * @param {object | undefined} params.settings
     * @param {import('../../utils.js').Platform | undefined} params.platform
     * @param {(payload: { locked: boolean, signals: UiLockSignals | null }) => void} params.notify
     * @param {() => void} params.addDebugFlag
     */
    constructor({ settings, platform, notify, addDebugFlag }) {
        this.settings = settings;
        this.platform = platform;
        this.notify = notify;
        this.addDebugFlag = addDebugFlag;
    }

    /** @type {object | undefined} */
    settings;
    /** @type {import('../../utils.js').Platform | undefined} */
    platform;
    /** @type {(payload: { locked: boolean, signals: UiLockSignals | null }) => void} */
    notify;
    /** @type {() => void} */
    addDebugFlag;
    /** @type {boolean} */
    pendingEvaluation = false;
    /** @type {number | null} */
    evaluationFrameId = null;
    /** @type {ReturnType<typeof setTimeout> | null} */
    delayedEvaluationTimer = null;
    /** @type {MutationObserver[]} */
    mutationObservers = [];
    /** @type {boolean | null} */
    lastLocked = null;

    init() {
        if (isBeingFramed()) {
            return;
        }

        this.setupObservers();
        this.runOnDomReady(() => {
            this.scheduleEvaluation();
            this.scheduleDelayedEvaluation();
            this.observeBodyIfNeeded();
        });
    }

    urlChanged() {
        this.scheduleEvaluation();
        this.scheduleDelayedEvaluation();
    }

    runOnDomReady(callback) {
        if (document.readyState === 'loading') {
            window.addEventListener(
                'DOMContentLoaded',
                () => {
                    callback();
                },
                { once: true },
            );
        } else {
            callback();
        }
    }

    setupObservers() {
        if (!getSettingEnabled(this.settings, 'observeMutations', 'enabled', this.platform)) {
            return;
        }

        this.observeElementAttributes(document.documentElement);
        this.observeHead();
        this.observeBodyIfNeeded();
    }

    observeBodyIfNeeded() {
        if (document.body) {
            this.observeElementAttributes(document.body);
            return;
        }

        this.runOnDomReady(() => {
            if (document.body) {
                this.observeElementAttributes(document.body);
            }
        });
    }

    /**
     * @param {HTMLElement} element
     */
    observeElementAttributes(element) {
        const observer = new MutationObserver(() => {
            this.scheduleEvaluation();
        });
        observer.observe(element, {
            attributes: true,
            attributeFilter: ['class', 'style'],
        });
        this.mutationObservers.push(observer);
    }

    observeHead() {
        if (!document.head) {
            this.runOnDomReady(() => {
                this.observeHead();
            });
            return;
        }

        const observer = new MutationObserver((mutations) => {
            const hasRelevantMutation = mutations.some((mutation) => {
                if (mutation.type === 'attributes') {
                    return this.isStyleOrLink(mutation.target);
                }
                if (mutation.type === 'childList') {
                    return Array.from(mutation.addedNodes).some((node) => this.isStyleOrLink(node));
                }
                return false;
            });
            if (hasRelevantMutation) {
                this.scheduleEvaluation();
            }
        });
        observer.observe(document.head, {
            attributes: true,
            childList: true,
            subtree: true,
        });
        this.mutationObservers.push(observer);
    }

    /**
     * @param {Node} node
     * @returns {boolean}
     */
    isStyleOrLink(node) {
        return node.nodeType === Node.ELEMENT_NODE && (node.nodeName === 'STYLE' || node.nodeName === 'LINK');
    }

    scheduleEvaluation() {
        if (this.pendingEvaluation) {
            return;
        }
        this.pendingEvaluation = true;

        const runEvaluation = () => {
            this.pendingEvaluation = false;
            this.evaluateLockState();
        };

        if (typeof globalThis.requestAnimationFrame === 'function') {
            this.evaluationFrameId = globalThis.requestAnimationFrame(runEvaluation);
        } else {
            this.evaluationFrameId = window.setTimeout(runEvaluation, 16);
        }
    }

    scheduleDelayedEvaluation() {
        if (this.delayedEvaluationTimer) {
            clearTimeout(this.delayedEvaluationTimer);
        }
        const delayMs = getSettingNumber(this.settings, 'postLoadDelayMs', 300);
        this.delayedEvaluationTimer = setTimeout(() => {
            this.scheduleEvaluation();
        }, delayMs);
    }

    evaluateLockState() {
        if (!document.documentElement) {
            return;
        }

        try {
            const htmlStyle = window.getComputedStyle(document.documentElement);
            const bodyStyle = document.body ? window.getComputedStyle(document.body) : null;
            const useOverscroll = getSettingEnabled(this.settings, 'overscrollBehavior', 'enabled', this.platform);
            const useOverflow = getSettingEnabled(this.settings, 'overflow', 'enabled', this.platform);
            const includeOverflowClip = getSettingEnabled(this.settings, 'overflowClip', 'disabled', this.platform);
            const { locked, signals } = computeUiLockState({
                htmlStyle,
                bodyStyle,
                useOverscroll,
                useOverflow,
                includeOverflowClip,
            });
            this.updateLockState(locked, signals);
        } catch (_e) {
            this.updateLockState(false, null);
        }
    }

    /**
     * @param {boolean} locked
     * @param {UiLockSignals | null} signals
     */
    updateLockState(locked, signals) {
        if (this.lastLocked === null && !locked) {
            this.lastLocked = locked;
            return;
        }
        if (this.lastLocked === locked) {
            return;
        }
        this.lastLocked = locked;
        if (locked) {
            this.addDebugFlag();
        }
        try {
            this.notify({ locked, signals });
        } catch (_e) {
            // Fail open: avoid throwing and leave native in default (unlocked) state.
        }
    }
}
