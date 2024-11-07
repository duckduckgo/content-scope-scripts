/**
 * This feature allows remote configuration of APIs that exist within the DOM.
 * We support removal of APIs and returning different values from getters.
 *
 * @module API manipulation
 */
import ContentFeature from '../content-feature';
import { processAttr, getGlobalObject } from '../utils';

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
            return typeof change.getterValue !== 'undefined';
        }
        return false;
    }

    // TODO move this to schema definition imported from the privacy-config
    /**
     * @typedef {Object} APIChange
     * @property {"remove"|"descriptor"} type
     * @property {import('../utils.js').ConfigSetting} [getterValue] - The value returned from a getter.
     * @property {boolean} [enumerable] - Whether the property is enumerable.
     * @property {boolean} [configurable] - Whether the property is configurable.
     */

    /**
     * Applies a change to DOM APIs.
     * @param {string} scope
     * @param {APIChange} change
     * @returns {void}
     */
    applyApiChange(scope, change) {
        const response = getGlobalObject(scope);
        if (!response) {
            return;
        }
        const [obj, key] = response;
        if (change.type === 'remove') {
            this.removeApiMethod(obj, key);
        } else if (change.type === 'descriptor') {
            this.wrapApiDescriptor(obj, key, change);
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
    wrapApiDescriptor(api, key, change) {
        const getterValue = change.getterValue;
        if (getterValue) {
            this.wrapProperty(api, key, {
                get: () => processAttr(getterValue, undefined),
                // wrapProperty takes care of setting these values to the api[key] default values.
                enumerable: change.enumerable,
                configurable: change.configurable,
            });
        }
    }
}
