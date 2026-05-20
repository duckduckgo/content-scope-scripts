/**
 * This feature allows remote configuration of APIs that exist within the DOM.
 * We support removal of APIs, returning different values from getters, and
 * replacing value-based properties such as methods.
 *
 * @module API manipulation
 */
import ContentFeature from '../content-feature.js';
// eslint-disable-next-line no-redeclare
import { ReflectApply, getOwnPropertyDescriptor, hasOwnProperty, objectDefineProperty } from '../captured-globals.js';
import { processAttr } from '../utils.js';
import { wrapToString } from '../wrapper-utils.js';

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
            const hasSetterValue = typeof change.setterValue !== 'undefined';
            const hasValue = typeof change.value !== 'undefined';
            // Either a value descriptor (with `value`) or an accessor descriptor (with `getterValue`
            // and/or `setterValue`) - the two shapes are mutually exclusive.
            const isAccessorShape = hasGetterValue || hasSetterValue;
            const isValueShape = hasValue;
            return isAccessorShape !== isValueShape;
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
     * @property {import('../utils.js').ConfigSetting} [setterValue] - The function invoked when the property is assigned. Used alongside (or instead of) getterValue to override accessor-style properties such as event handlers (e.g., `MediaDevices.prototype.ondevicechange`).
     * @property {import('../utils.js').ConfigSetting} [value] - The value assigned to a value descriptor, including methods.
     * @property {boolean} [enumerable] - Whether the property is enumerable.
     * @property {boolean} [configurable] - Whether the property is configurable.
     * @property {boolean} [define] - Whether to define the property if it is not already an own property of `api`. When true and the property is missing or only inherited via the prototype chain, a new own property is defined (shadowing any inherited one). When false (default), the change is merged with any existing own descriptor; properties that exist only via the prototype chain are skipped.
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
        const setterValue = change.setterValue;
        const value = change.value;
        const descriptorKind =
            getterValue !== undefined || setterValue !== undefined ? 'getter' : value !== undefined ? 'value' : undefined;
        const configSetting = descriptorKind === 'getter' ? getterValue : value;
        // `setterValue` may be supplied on its own (override only the setter, keep the original
        // getter); in that case configSetting (getterValue) is undefined and createApiDescriptor
        // skips the `get` half.
        if (!descriptorKind || (descriptorKind === 'value' && configSetting === undefined)) {
            return;
        }
        const descriptor = this.createApiDescriptor(descriptorKind, configSetting, change);
        // If `define` is true and the property is not already an OWN property of `api`, define it
        // directly. This covers both the "property does not exist at all" case and the
        // "property is inherited via the prototype chain" case (e.g. shadow-defining
        // MediaDevices.prototype.addEventListener which is inherited from EventTarget.prototype).
        if (change.define === true && !hasOwnProperty.call(api, key)) {
            this.defineProperty(api, key, this.createDefineDescriptor(descriptor, descriptorKind));
            return;
        }
        // When replacing an existing method-valued descriptor, mask the replacement
        // against the original method so `toString()`, `toString.toString()`, `.name`
        // and `.length` continue to resemble the native method. Without this, sites can
        // trivially detect the override via `fn.toString()` / `fn.name`.
        if (descriptorKind === 'value') {
            const valueDescriptor = /** @type {{ value: any, enumerable?: boolean, configurable?: boolean }} */ (descriptor);
            if (typeof valueDescriptor.value === 'function') {
                const origDescriptor = getOwnPropertyDescriptor(api, key);
                if (origDescriptor && typeof origDescriptor.value === 'function') {
                    valueDescriptor.value = this.maskMethodReplacement(valueDescriptor.value, origDescriptor.value);
                }
            }
        }
        this.wrapProperty(api, key, descriptor);
    }

    /**
     * Wraps a config-supplied function so its observable identity (`toString`,
     * `toString.toString`, `name`, `length`) mirrors the original DOM method it is
     * replacing. The call itself still executes the configured replacement.
     *
     * Note: `processAttr` may return a shared function (e.g. `functionMap.noop`),
     * so we always create a fresh wrapper before redefining `name`/`length` to
     * avoid mutating module-level singletons.
     *
     * @param {Function} replacementFn - configured replacement to invoke
     * @param {Function} origFn - original DOM method we are masking against
     * @returns {Function}
     */
    maskMethodReplacement(replacementFn, origFn) {
        // Use captured `ReflectApply` and `objectDefineProperty` so a hostile page
        // cannot intercept the call into the configured replacement, nor tamper with
        // the `name`/`length` masking, by reassigning `globalThis.Reflect.apply` or
        // `globalThis.Object.defineProperty` after content scope has initialised.
        const wrapper = function () {
            return ReflectApply(replacementFn, this, arguments);
        };
        objectDefineProperty(wrapper, 'name', { value: origFn.name, configurable: true });
        objectDefineProperty(wrapper, 'length', { value: origFn.length, configurable: true });
        return wrapToString(wrapper, origFn);
    }

    /**
     * @param {'getter' | 'value'} descriptorKind
     * @param {import('../utils.js').ConfigSetting | import('../utils.js').ConfigSetting[] | undefined} configSetting
     * @param {APIChange} change
     * @returns {Partial<import('../wrapper-utils.js').StrictPropertyDescriptor>}
     */
    createApiDescriptor(descriptorKind, configSetting, change) {
        /** @type {{ value?: any, get?: () => any, set?: (v: any) => void, enumerable?: boolean, configurable?: boolean }} */
        const descriptor = {};
        if (descriptorKind === 'value') {
            // The caller (wrapApiDescriptor) guarantees configSetting is defined when
            // descriptorKind === 'value'; narrow for the type checker.
            const valueSetting = /** @type {import('../utils.js').ConfigSetting | import('../utils.js').ConfigSetting[]} */ (configSetting);
            descriptor.value = processAttr(valueSetting, undefined);
        } else {
            // `configSetting` is the getterValue (may be undefined if only setterValue is set).
            if (configSetting !== undefined) {
                descriptor.get = () => processAttr(configSetting, undefined);
            }
            // `setterValue` is intentionally invoked through processAttr on every assignment so
            // configurations using `functionMap.debug` log per-assignment. When omitted, we leave
            // `set` unset on the new descriptor so wrapProperty's spread merge preserves the
            // original setter (existing behaviour).
            if (change.setterValue !== undefined) {
                const setterSetting = change.setterValue;
                descriptor.set = function setter(v) {
                    const fn = processAttr(setterSetting, undefined);
                    if (typeof fn === 'function') {
                        ReflectApply(fn, this, [v]);
                    }
                };
            }
        }
        if ('enumerable' in change) {
            descriptor.enumerable = change.enumerable;
        }
        if ('configurable' in change) {
            descriptor.configurable = change.configurable;
        }
        return /** @type {Partial<import('../wrapper-utils.js').StrictPropertyDescriptor>} */ (descriptor);
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
        const getterDescriptor = /** @type {{ get?: () => any, set?: (v: any) => void, enumerable?: boolean, configurable?: boolean }} */ (
            descriptor
        );
        /** @type {any} */
        const result = {
            enumerable: typeof getterDescriptor.enumerable !== 'boolean' ? true : getterDescriptor.enumerable,
            configurable: typeof getterDescriptor.configurable !== 'boolean' ? true : getterDescriptor.configurable,
        };
        if (typeof getterDescriptor.get === 'function') {
            result.get = getterDescriptor.get;
        }
        if (typeof getterDescriptor.set === 'function') {
            result.set = getterDescriptor.set;
        }
        return result;
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
