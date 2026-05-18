/**
 * This feature allows remote configuration of APIs that exist within the DOM.
 * We support removal of APIs, returning different values from getters, and
 * replacing value-based properties such as methods.
 *
 * @module API manipulation
 */
import ContentFeature from '../content-feature.js';
// eslint-disable-next-line no-redeclare
import { hasOwnProperty } from '../captured-globals.js';
import { processAttr } from '../utils.js';

/**
 * @internal
 */
export default class ApiManipulation extends ContentFeature {
    listenForUrlChanges = true;

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

    urlChanged() {
        this.init();
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
            if ('enumerable' in change && typeof change.enumerable !== 'boolean') {
                return false;
            }
            if ('configurable' in change && typeof change.configurable !== 'boolean') {
                return false;
            }
            if ('define' in change && typeof change.define !== 'boolean') {
                return false;
            }
            const hasGetterValue = typeof change.getterValue !== 'undefined';
            const hasValue = typeof change.value !== 'undefined';
            return hasGetterValue !== hasValue;
        }
        return false;
    }

    // TODO move this to schema definition imported from the privacy-config
    // Additionally remove checkIsValidAPIChange when this change happens.
    // See: https://app.asana.com/0/1201614831475344/1208715421518231/f
    /**
     * @typedef {Object} APIChange
     * @property {"remove"|"descriptor"} type
     * @property {import('../utils.js').ConfigSetting} [getterValue] - The value returned from a getter.
     * @property {import('../utils.js').ConfigSetting} [value] - The value assigned to a value descriptor, including methods.
     * @property {boolean} [enumerable] - Whether the property is enumerable.
     * @property {boolean} [configurable] - Whether the property is configurable.
     * @property {boolean} [define] - Whether to define the property if it does not exist.
     */

    /**
     * Applies a change to DOM APIs.
     * @param {string} scope
     * @param {APIChange} change
     * @returns {void}
     */
    applyApiChange(scope, change) {
        const response = this.getGlobalObject(scope);
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
            if (hasOwnProperty.call(api, key)) {
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
        const value = change.value;
        const descriptorKind = getterValue !== undefined ? 'getter' : value !== undefined ? 'value' : undefined;
        const configSetting = descriptorKind === 'getter' ? getterValue : value;
        if (!descriptorKind || configSetting === undefined) {
            return;
        }
        const descriptor = this.createApiDescriptor(descriptorKind, configSetting, change);
        // If 'define' is true and property does not exist, define it directly
        if (change.define === true && !(key in api)) {
            this.defineProperty(api, key, this.createDefineDescriptor(descriptor, descriptorKind));
            return;
        }
        this.wrapProperty(api, key, descriptor);
    }

    /**
     * @param {'getter' | 'value'} descriptorKind
     * @param {import('../utils.js').ConfigSetting | import('../utils.js').ConfigSetting[]} configSetting
     * @param {APIChange} change
     * @returns {Partial<import('../wrapper-utils.js').StrictPropertyDescriptor>}
     */
    createApiDescriptor(descriptorKind, configSetting, change) {
        const descriptor =
            descriptorKind === 'getter'
                ? {
                      get: () => processAttr(configSetting, undefined),
                  }
                : {
                      value: processAttr(configSetting, undefined),
                  };
        if ('enumerable' in change) {
            descriptor.enumerable = change.enumerable;
        }
        if ('configurable' in change) {
            descriptor.configurable = change.configurable;
        }
        return descriptor;
    }

    /**
     * @param {Partial<import('../wrapper-utils.js').StrictPropertyDescriptor>} descriptor
     * @param {'getter' | 'value'} descriptorKind
     * @returns {import('../wrapper-utils.js').StrictPropertyDescriptor}
     */
    createDefineDescriptor(descriptor, descriptorKind) {
        if (descriptorKind === 'value') {
            const valueDescriptor = /** @type {{ value: any, enumerable?: boolean, configurable?: boolean }} */ (descriptor);
            return {
                value: valueDescriptor.value,
                writable: true,
                enumerable: typeof valueDescriptor.enumerable !== 'boolean' ? true : valueDescriptor.enumerable,
                configurable: typeof valueDescriptor.configurable !== 'boolean' ? true : valueDescriptor.configurable,
            };
        }
        const getterDescriptor = /** @type {{ get: () => any, enumerable?: boolean, configurable?: boolean }} */ (descriptor);
        return {
            get: getterDescriptor.get,
            enumerable: typeof getterDescriptor.enumerable !== 'boolean' ? true : getterDescriptor.enumerable,
            configurable: typeof getterDescriptor.configurable !== 'boolean' ? true : getterDescriptor.configurable,
        };
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
