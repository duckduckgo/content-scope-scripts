/**
 * This feature allows remote configuration of APIs that exist within the DOM.
 * We support removal of APIs and returning different values from getters.
 *
 * @module API manipulation
 */
import ContentFeature from '../content-feature';
import { processAttr } from '../utils';

/**
 * @internal
 */
export default class ApiManipulation extends ContentFeature {
    init() {
        const apiChanges = this.getFeatureSetting('apiChanges');
        if (apiChanges) {
            for (const scope in apiChanges) {
                const change = apiChanges[scope];
                if (!this.checkIsValidAPIChange(change)) {
                    continue;
                }
                this.applyApiChange(scope, change);
            }
        }
    }

    /**
     * Checks if the config API change is valid.
     * @param {any} change
     * @returns {change is APIChange}
     */
    checkIsValidAPIChange(change) {
        if (typeof change !== 'object') {
            return false;
        }
        if (change.type === 'remove') {
            return true;
        }
        if (change.type === 'descriptor') {
            if (change.enumerable && typeof change.enumerable !== 'boolean') {
                return false;
            }
            if (change.configurable && typeof change.configurable !== 'boolean') {
                return false;
            }
            if (change.writable && typeof change.writable !== 'boolean') {
                return false;
            }
            // Either getterValues or value must be undefined
            if (change.getterValues && change.value) {
                return false;
            }
            return typeof change.getterValue !== 'undefined' || typeof change.value !== 'undefined';
        }
        return false;
    }

    // TODO move this to schema definition imported from the privacy-config
    /**
     * @typedef {Object} APIChange
     * @property {"remove"|"descriptor"} type
     * @property {import('../utils.js').ConfigSetting} [value] - The value returned by the descriptor.
     * @property {import('../utils.js').ConfigSetting} [getterValue] - The value returned from a getter.
     * @property {boolean} [define=false] - Whether to define the property, defaults to checking presence.
     * @property {boolean} [enumerable] - Whether the property is enumerable.
     * @property {boolean} [configurable] - Whether the property is configurable.
     * @property {boolean} [writable] - Whether the property is writable
     */

    /**
     * Applies a change to DOM APIs.
     * @param {string} scope
     * @param {APIChange} change
     * @returns {void}
     */
    applyApiChange(scope, change) {
        console.log('applyApiChange', scope, change);
        const response = this.getGlobalObject(scope);
        if (!response) {
            return;
        }
        const [obj, key] = response;
        if (change.type === 'remove') {
            this.removeApiMethod(obj, key);
        } else if (change.type === 'descriptor') {
            this.defineApiDescriptor(obj, key, change);
        }
    }

    /**
     * Removes a method from an API.
     * @param {object} api
     * @param {string} key
     */
    removeApiMethod(api, key) {
        try {
            if (key in api) {
                delete api[key];
            }
        } catch (e) {}
    }

    /**
     * Wraps a property with descriptor.
     * @param {object} api
     * @param {string} key
     * @param {APIChange} change
     */
    defineApiDescriptor(api, key, change) {
        console.log('wrapApiDescriptor', api, key, change);
        // It's unclear why TS wants the assignment here to narrow the type (but not for change.value)?!
        const getterValue = change.getterValue;
        const defineMethod = change.define ? this.defineProperty.bind(this) : this.wrapProperty.bind(this);
        if (getterValue) {
            defineMethod(api, key, {
                get: () => processAttr(getterValue, undefined),
                enumerable: change.enumerable ?? true,
                configurable: change.configurable ?? true,
            });
        } else if (change.value) {
            defineMethod(api, key, {
                value: processAttr(change.value, undefined),
                writable: change.writable ?? true,
                enumerable: change.enumerable ?? true,
                configurable: change.configurable ?? true,
            });
        }
    }

    /**
     * Looks up a global object from a scope, e.g. 'Navigator.prototype'.
     * @param {string} scope the scope of the object to get to.
     * @returns {[object, string]|null} the object at the scope.
     */
    getGlobalObject(scope) {
        const parts = scope.split('.');
        // get the last part of the scope
        const lastPart = parts.pop();
        if (!lastPart) {
            return null;
        }
        let obj = window;
        for (const part of parts) {
            obj = obj[part];
            if (!obj) {
                return null;
            }
        }
        return [obj, lastPart];
    }
}
