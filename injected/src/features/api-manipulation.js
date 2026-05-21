/**
 * This feature allows remote configuration of APIs that exist within the DOM.
 * We support removal of APIs, returning different values from getters, and
 * replacing value-based properties such as methods.
 *
 * @module API manipulation
 */
import ContentFeature from '../content-feature.js';
// eslint-disable-next-line no-redeclare
import { Proxy, ReflectApply, getOwnPropertyDescriptor, getPrototypeOf, hasOwnProperty } from '../captured-globals.js';
import { processAttr } from '../utils.js';
import { mergePropertyDescriptors, wrapToString } from '../wrapper-utils.js';

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
            // Read all optional fields via `hasOwnProperty` so a hostile page that pollutes
            // `Object.prototype` (e.g. `Object.prototype.value = ...`) cannot make a valid
            // config look invalid or vice versa.
            if (hasOwnProperty.call(change, 'enumerable') && typeof change.enumerable !== 'boolean') {
                return false;
            }
            if (hasOwnProperty.call(change, 'configurable') && typeof change.configurable !== 'boolean') {
                return false;
            }
            if (hasOwnProperty.call(change, 'define') && typeof change.define !== 'boolean') {
                return false;
            }
            const hasGetterValue = hasOwnProperty.call(change, 'getterValue') && typeof change.getterValue !== 'undefined';
            const hasSetterValue = hasOwnProperty.call(change, 'setterValue') && typeof change.setterValue !== 'undefined';
            const hasValue = hasOwnProperty.call(change, 'value') && typeof change.value !== 'undefined';
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
     * @property {boolean} [define] - When true, define a new own property if the key is absent from `api` and its entire prototype chain. When false (default), skip changes for properties that do not exist at all; override own properties via `wrapProperty`; override inherited properties by shadow-defining an own property on `api`.
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
        // Read config fields via `hasOwnProperty` so prototype pollution on the page can't
        // smuggle synthetic getter/setter/value entries onto an otherwise plain change object.
        const getterValue = hasOwnProperty.call(change, 'getterValue') ? change.getterValue : undefined;
        const setterValue = hasOwnProperty.call(change, 'setterValue') ? change.setterValue : undefined;
        const value = hasOwnProperty.call(change, 'value') ? change.value : undefined;
        const define = hasOwnProperty.call(change, 'define') && change.define === true;
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
        const origDescriptor = this.findPropertyDescriptor(api, key);
        if (!origDescriptor) {
            if (define) {
                this.defineProperty(api, key, this.createDefineDescriptor(descriptor, descriptorKind));
            }
            return;
        }
        // When replacing an existing method-valued descriptor, mask the replacement
        // against the original method so `toString()`, `toString.toString()`, `.name`
        // and `.length` continue to resemble the native method. Without this, sites can
        // trivially detect the override via `fn.toString()` / `fn.name`.
        if (descriptorKind === 'value') {
            const valueDescriptor = /** @type {{ value?: any }} */ (descriptor);
            if (typeof valueDescriptor.value === 'function' && typeof origDescriptor.value === 'function') {
                valueDescriptor.value = this.maskMethodReplacement(valueDescriptor.value, origDescriptor.value);
            }
        } else if (descriptorKind === 'getter') {
            // Mask the new setter against the original native setter (if any) so that
            // descriptor inspection (`getOwnPropertyDescriptor(...).set.toString()` /
            // `.set.name`) still resembles the original accessor. Event-handler IDL
            // attributes such as `Element.prototype.onclick` and
            // `MediaDevices.prototype.ondevicechange` expose a native setter; without
            // masking, descriptor probes would see our JS `setter(v) {...}` shape.
            const accessorDescriptor = /** @type {{ get?: () => any, set?: (v: any) => void }} */ (descriptor);
            if (typeof accessorDescriptor.set === 'function' && typeof origDescriptor.set === 'function') {
                accessorDescriptor.set = /** @type {(v: any) => void} */ (
                    this.maskMethodReplacement(accessorDescriptor.set, origDescriptor.set)
                );
            }
        }
        if (hasOwnProperty.call(api, key)) {
            this.wrapProperty(api, key, descriptor);
        } else {
            // API exists via the prototype chain (e.g. MediaDevices.prototype.addEventListener
            // on EventTarget.prototype). Shadow-define an own property without requiring `define`.
            const merged = mergePropertyDescriptors(origDescriptor, descriptor);
            if (merged) {
                this.defineProperty(api, key, merged);
            }
        }
    }

    /**
     * Returns the property descriptor for `key` on `obj` or an ancestor in its prototype chain.
     * @param {object} obj
     * @param {string} key
     * @returns {PropertyDescriptor | undefined}
     */
    findPropertyDescriptor(obj, key) {
        let current = obj;
        while (current) {
            const descriptor = getOwnPropertyDescriptor(current, key);
            if (descriptor) {
                return descriptor;
            }
            current = getPrototypeOf(current);
        }
        return undefined;
    }

    /**
     * Wraps a config-supplied function so its observable identity mirrors the
     * original DOM method it is replacing while the call itself executes the
     * configured replacement. Two layers:
     *  - inner: a Proxy whose target is `origFn` with an `apply` trap routing to
     *    `replacementFn`. Inheriting `origFn` as the target preserves `.name`,
     *    `.length`, and crucially the absence/presence of own `prototype`, so
     *    non-constructable DOM methods stay non-constructable and
     *    `Object.prototype.hasOwnProperty.call(fn, 'prototype')` / `new fn()` do
     *    not leak the override;
     *  - outer: `wrapToString(innerProxy, origFn)` masks `toString()` /
     *    `toString.toString()` even against `Function.prototype.toString.call(fn)`
     *    probes, which bypass any `.toString` get-trap because they read
     *    `[[SourceText]]` from `this`. Proxies don't expose `[[SourceText]]`, so
     *    without this layer such probes would print `function () { [native code] }`
     *    instead of the original method's source.
     *
     * Uses captured `Proxy` and `ReflectApply` so a hostile page cannot intercept
     * the call into the configured replacement by reassigning `globalThis.Proxy`
     * or `globalThis.Reflect.apply` after content scope has initialised.
     *
     * @param {Function} replacementFn - configured replacement to invoke
     * @param {Function} origFn - original DOM method we are masking against
     * @returns {Function}
     */
    maskMethodReplacement(replacementFn, origFn) {
        const callProxy = new Proxy(origFn, {
            apply(_target, thisArg, args) {
                return ReflectApply(replacementFn, thisArg, args);
            },
        });
        return wrapToString(callProxy, origFn);
    }

    /**
     * @param {'getter' | 'value'} descriptorKind
     * @param {import('../utils.js').ConfigSetting | import('../utils.js').ConfigSetting[] | undefined} configSetting
     * @param {APIChange} change
     * @returns {Partial<import('../wrapper-utils.js').StrictPropertyDescriptor>}
     */
    createApiDescriptor(descriptorKind, configSetting, change) {
        // `Partial<StrictPropertyDescriptor>` is a union (data | accessor | get-only | set-only),
        // so direct property access narrows poorly. Build with a permissive intermediate shape
        // then return as the public type.
        /** @type {{ value?: any, get?: () => any, set?: (v: any) => void, enumerable?: boolean, configurable?: boolean }} */
        let descriptor;
        if (descriptorKind === 'value') {
            // `wrapApiDescriptor` guarantees `configSetting` is defined for the value kind.
            const valueSetting = /** @type {import('../utils.js').ConfigSetting | import('../utils.js').ConfigSetting[]} */ (configSetting);
            descriptor = { value: processAttr(valueSetting, undefined) };
        } else {
            descriptor = {};
            // `configSetting` is the getterValue (may be undefined if only setterValue is set).
            if (configSetting !== undefined) {
                const getterSetting = configSetting;
                descriptor.get = () => processAttr(getterSetting, undefined);
            }
            // `setterValue` is intentionally invoked through processAttr on every assignment so
            // configurations using `functionMap.debug` log per-assignment. When omitted, we leave
            // `set` unset on the new descriptor so wrapProperty's spread merge preserves the
            // original setter (existing behaviour).
            if (hasOwnProperty.call(change, 'setterValue') && change.setterValue !== undefined) {
                const setterSetting = /** @type {import('../utils.js').ConfigSetting} */ (change.setterValue);
                descriptor.set = function setter(v) {
                    const fn = processAttr(setterSetting, undefined);
                    if (typeof fn === 'function') {
                        ReflectApply(fn, this, [v]);
                    }
                };
            }
        }
        if (hasOwnProperty.call(change, 'enumerable')) {
            descriptor.enumerable = change.enumerable;
        }
        if (hasOwnProperty.call(change, 'configurable')) {
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
