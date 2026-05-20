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
import { mergePropertyDescriptors, wrapToString } from '../wrapper-utils.js';

const DescriptorTarget = /** @type {const} */ ({
    OWN: 'own',
    EXISTING: 'existing',
    MISSING: 'missing',
});

const ServiceAreaState = /** @type {const} */ ({
    ENABLED: 'enabled',
});

/**
 * Reviewed, higher-level API manipulation bundles. Prefer these over raw
 * descriptor definitions when a service area exists for the mitigation.
 *
 * @type {Record<string, Record<string, APIChange>>}
 */
const serviceAreaApiChanges = {
    mediaDevicesDeviceChangeEvents: {
        'MediaDevices.prototype.addEventListener': {
            type: 'descriptor',
            target: DescriptorTarget.EXISTING,
            value: { type: 'function', functionName: 'noop' },
        },
        'MediaDevices.prototype.removeEventListener': {
            type: 'descriptor',
            target: DescriptorTarget.EXISTING,
            value: { type: 'function', functionName: 'noop' },
        },
        'MediaDevices.prototype.ondevicechange': {
            type: 'descriptor',
            getterValue: { type: 'undefined' },
            setterValue: { type: 'function', functionName: 'noop' },
        },
    },
};

/**
 * @internal
 */
export default class ApiManipulation extends ContentFeature {
    listenForUrlChanges = true;

    init() {
        this.applyApiChanges(this.getServiceAreaApiChanges(this.getFeatureSetting('serviceAreas')));
        const apiChanges = this.getFeatureSetting('apiChanges');
        if (apiChanges) {
            this.applyApiChanges(apiChanges);
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
            if ('target' in change && !this.isValidDescriptorTarget(change.target)) {
                return false;
            }
            if ('target' in change && 'define' in change) {
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
     * @property {'own'|'existing'|'missing'} [target] - Where to apply the descriptor change. Defaults to `own`: only mutate own descriptors. `existing` also permits shadow-defining compatible inherited descriptors. `missing` only defines absent properties.
     * @property {boolean} [define] - Deprecated compatibility alias for `target: "missing"`. Do not use in new config.
     */

    /**
     * @param {Record<string, APIChange> | undefined} apiChanges
     * @returns {void}
     */
    applyApiChanges(apiChanges) {
        if (!apiChanges) {
            return;
        }
        for (const scope in apiChanges) {
            const change = apiChanges[scope];
            if (!this.checkIsValidAPIChange(change)) {
                continue;
            }
            this.applyApiChange(scope, change);
        }
    }

    /**
     * @param {Record<string, import('../utils.js').FeatureState | { state?: import('../utils.js').FeatureState }> | undefined} serviceAreas
     * @returns {Record<string, APIChange>}
     */
    getServiceAreaApiChanges(serviceAreas) {
        /** @type {Record<string, APIChange>} */
        const apiChanges = {};
        if (!serviceAreas || typeof serviceAreas !== 'object') {
            return apiChanges;
        }
        for (const serviceAreaName in serviceAreas) {
            const serviceAreaConfig = serviceAreas[serviceAreaName];
            const state = typeof serviceAreaConfig === 'object' ? serviceAreaConfig?.state : serviceAreaConfig;
            if (state !== ServiceAreaState.ENABLED || !serviceAreaApiChanges[serviceAreaName]) {
                continue;
            }
            Object.assign(apiChanges, serviceAreaApiChanges[serviceAreaName]);
        }
        return apiChanges;
    }

    /**
     * @param {any} target
     * @returns {target is 'own'|'existing'|'missing'}
     */
    isValidDescriptorTarget(target) {
        return target === DescriptorTarget.OWN || target === DescriptorTarget.EXISTING || target === DescriptorTarget.MISSING;
    }

    /**
     * @param {APIChange} change
     * @returns {'own'|'existing'|'missing'}
     */
    getDescriptorTarget(change) {
        if (change.type === 'descriptor' && this.isValidDescriptorTarget(change.target)) {
            return change.target;
        }
        return change.define === true ? DescriptorTarget.MISSING : DescriptorTarget.OWN;
    }

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
        const target = this.getDescriptorTarget(change);
        const ownDescriptor = getOwnPropertyDescriptor(api, key);
        const existingDescriptor = ownDescriptor || this.findPropertyDescriptor(api, key);

        if (target === DescriptorTarget.MISSING) {
            if (existingDescriptor) {
                return;
            }
            this.maskDescriptorFunctions(descriptor, descriptorKind, undefined, key);
            this.defineProperty(api, key, this.createDefineDescriptor(descriptor, descriptorKind));
            return;
        }

        if (ownDescriptor) {
            this.maskDescriptorFunctions(descriptor, descriptorKind, ownDescriptor, key);
            this.wrapProperty(api, key, descriptor);
            return;
        }

        if (target === DescriptorTarget.EXISTING && existingDescriptor) {
            // API exists via the prototype chain (e.g. MediaDevices.prototype.addEventListener
            // on EventTarget.prototype). Shadow-defining an own property requires explicit
            // `target: "existing"` so raw config does not change inherited APIs by default.
            this.maskDescriptorFunctions(descriptor, descriptorKind, existingDescriptor, key);
            const merged = mergePropertyDescriptors(existingDescriptor, descriptor);
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
            current = Object.getPrototypeOf(current);
        }
        return undefined;
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
        return this.maskFunctionReplacement(replacementFn, {
            originalFn: origFn,
            name: origFn.name,
            length: origFn.length,
        });
    }

    /**
     * Wraps a config-supplied function so descriptor inspection sees either an original
     * function's identity or a synthetic native-like DOM signature.
     *
     * @param {Function} replacementFn
     * @param {{ originalFn?: Function, name: string, length: number, mockValue?: string }} mask
     * @returns {Function}
     */
    maskFunctionReplacement(replacementFn, mask) {
        // Use captured `ReflectApply` and `objectDefineProperty` so a hostile page
        // cannot intercept the call into the configured replacement, nor tamper with
        // the `name`/`length` masking, by reassigning `globalThis.Reflect.apply` or
        // `globalThis.Object.defineProperty` after content scope has initialised.
        const wrapper = function () {
            return ReflectApply(replacementFn, this, arguments);
        };
        objectDefineProperty(wrapper, 'name', { value: mask.name, configurable: true });
        objectDefineProperty(wrapper, 'length', { value: mask.length, configurable: true });
        return wrapToString(wrapper, mask.originalFn || wrapper, mask.mockValue);
    }

    /**
     * Mask function-valued descriptor members before defining them in the page.
     *
     * @param {Partial<import('../wrapper-utils.js').StrictPropertyDescriptor>} descriptor
     * @param {'getter' | 'value'} descriptorKind
     * @param {PropertyDescriptor | undefined} origDescriptor
     * @param {string} key
     */
    maskDescriptorFunctions(descriptor, descriptorKind, origDescriptor, key) {
        if (descriptorKind === 'value') {
            const valueDescriptor = /** @type {{ value?: any }} */ (descriptor);
            if (typeof valueDescriptor.value === 'function') {
                valueDescriptor.value =
                    typeof origDescriptor?.value === 'function'
                        ? this.maskMethodReplacement(valueDescriptor.value, origDescriptor.value)
                        : this.maskFunctionReplacement(valueDescriptor.value, {
                              name: key,
                              length: valueDescriptor.value.length,
                              mockValue: this.createNativeFunctionString(key),
                          });
            }
            return;
        }

        const accessorDescriptor = /** @type {{ get?: () => any, set?: (v: any) => void }} */ (descriptor);
        if (typeof accessorDescriptor.get === 'function') {
            accessorDescriptor.get =
                typeof origDescriptor?.get === 'function'
                    ? /** @type {() => any} */ (this.maskMethodReplacement(accessorDescriptor.get, origDescriptor.get))
                    : /** @type {() => any} */ (
                          this.maskFunctionReplacement(accessorDescriptor.get, {
                              name: `get ${key}`,
                              length: 0,
                              mockValue: this.createNativeFunctionString(`get ${key}`),
                          })
                      );
        }
        if (typeof accessorDescriptor.set === 'function') {
            accessorDescriptor.set =
                typeof origDescriptor?.set === 'function'
                    ? /** @type {(v: any) => void} */ (this.maskMethodReplacement(accessorDescriptor.set, origDescriptor.set))
                    : /** @type {(v: any) => void} */ (
                          this.maskFunctionReplacement(accessorDescriptor.set, {
                              name: `set ${key}`,
                              length: 1,
                              mockValue: this.createNativeFunctionString(`set ${key}`),
                          })
                      );
        }
    }

    /**
     * @param {string} name
     * @returns {string}
     */
    createNativeFunctionString(name) {
        return `function ${name}() { [native code] }`;
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
            if (change.setterValue !== undefined) {
                const setterSetting = /** @type {import('../utils.js').ConfigSetting} */ (change.setterValue);
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
