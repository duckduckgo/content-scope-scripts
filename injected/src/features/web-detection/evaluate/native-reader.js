import { getOwnPropertyDescriptor, getOwnPropertyNames, getPrototypeOf, ReflectApply, ReflectGet } from '../../../captured-globals.js';
import { Failure, isFailure, thrownFailure } from '../model/core.js';

/**
 * @typedef {import('../model/types.js').Reader} Reader
 */

/**
 * An own descriptor captured from a holder.
 *
 * @typedef {{ holder: object, descriptor: PropertyDescriptor }} CapturedRecord
 */

/**
 * Reads properties and calls methods, preferring the getters and methods captured when the reader is
 * created, so one a page replaces afterwards is not called.
 *
 * Holders are the global object, each namespace object such as `CSS`, and every global constructor and
 * its prototype, so static methods such as `Number.isFinite` are captured too. For each name config uses, the reader records the own accessor, method or
 * value with that name on each holder. A read walks the object and its prototype chain for the nearest
 * holder with a record. With none, it reads the property as it stands on the object or its chain, whoever
 * defined it.
 *
 * A captured getter is used whatever the object defines, and so is a captured method in a call. Any
 * other captured value, such as `Error.prototype.message`, is the holder's default: an own data property
 * of the object, or of a prototype below the holder, takes its place. That property is read by descriptor,
 * so no page code runs. A getter found there is not called, and the read fails.
 *
 * @implements {Reader}
 */
export class NativeReader {
    /** @type {Map<object, Map<PropertyKey, CapturedRecord>>} */
    #holders = new Map();
    /** @type {object | undefined} */
    #nodePrototype;
    /**
     * Per key, the record found walking up from a prototype, or `null` for none. A page can change a
     * prototype's chain between runs, so it is kept for one run.
     *
     * @type {Map<PropertyKey, Map<object, CapturedRecord | null>>}
     */
    #records = new Map();

    /**
     * @param {object} global - the global object to capture from
     * @param {Iterable<string>} names - every name config reads or calls
     */
    constructor(global, names) {
        /** @type {PropertyKey[]} */
        const keys = [...names, Symbol.iterator];
        const nodeConstructor = getOwnPropertyDescriptor(global, 'Node')?.value;
        if (typeof nodeConstructor === 'function') this.#nodePrototype = tryOwnDescriptor(nodeConstructor, 'prototype')?.value;
        /** @type {object[]} */
        const holders = [global];
        // A cross-origin frame's WindowProxy, reached as `window[0]`, and a page's Proxy can throw on
        // any descriptor read. Such a value is not a holder.
        for (const name of getOwnPropertyNames(global)) {
            const descriptor = getOwnPropertyDescriptor(global, name);
            if (!descriptor || !('value' in descriptor)) continue;
            const value = descriptor.value;
            if (typeof value === 'function') {
                holders.push(value);
                const prototype = tryOwnDescriptor(value, 'prototype')?.value;
                // `Function.prototype` is itself a function
                if ((typeof prototype === 'object' || typeof prototype === 'function') && prototype !== null) holders.push(prototype);
            } else if (typeof value === 'object' && value !== null && value !== global) {
                holders.push(value);
            }
        }
        for (const holder of holders) {
            /** @type {Map<PropertyKey, CapturedRecord> | undefined} */
            let records;
            try {
                for (const key of keys) {
                    const descriptor = getOwnPropertyDescriptor(holder, key);
                    if (!descriptor) continue;
                    records ??= new Map();
                    records.set(key, { holder, descriptor });
                }
            } catch {
                continue;
            }
            if (records) this.#holders.set(holder, records);
        }
    }

    /** Start a run: records found from a prototype are looked up again. */
    beginRun() {
        this.#records.clear();
    }

    /**
     * The captured record for a key on the target's chain: on the target itself when it is a holder,
     * else the one found walking up from its prototype.
     *
     * @param {unknown} target - any value but `null` and `undefined`
     * @param {PropertyKey} key
     * @returns {CapturedRecord | undefined}
     */
    _captured(target, key) {
        if (typeof target === 'object' || typeof target === 'function') {
            const own = this.#holders.get(/** @type {object} */ (target))?.get(key);
            if (own) return own;
        }
        const from = getPrototypeOf(target);
        if (from === null) return undefined;
        let byPrototype = this.#records.get(key);
        if (!byPrototype) {
            byPrototype = new Map();
            this.#records.set(key, byPrototype);
        }
        let record = byPrototype.get(from);
        if (record === undefined) {
            record = null;
            for (let current = from; current !== null; current = getPrototypeOf(current)) {
                const found = this.#holders.get(current)?.get(key);
                if (found) {
                    record = found;
                    break;
                }
            }
            byPrototype.set(from, record);
        }
        return record ?? undefined;
    }

    /**
     * The descriptor a captured record gives the target: the record's own for a getter, and for a
     * method when `method` holds. For any other value, the first own property from the target up to the
     * holder takes its place, read by descriptor. A getter there gives a failure, uncalled.
     *
     * @param {unknown} target - any value but `null` and `undefined`
     * @param {PropertyKey} key
     * @param {CapturedRecord} record - the record `_captured` gives for the target
     * @param {boolean} method - whether a captured function value is used whatever the target defines
     * @returns {PropertyDescriptor | Failure}
     */
    _resolve(target, key, record, method) {
        const descriptor = record.descriptor;
        if (!('value' in descriptor) || (method && typeof descriptor.value === 'function')) return descriptor;
        /** @type {unknown} */
        let current = target;
        while (current !== null && current !== record.holder) {
            const own = getOwnPropertyDescriptor(current, key);
            if (own) return 'value' in own ? own : new Failure('PageAccessor');
            current = getPrototypeOf(current);
        }
        return descriptor;
    }

    /**
     * The descriptor a call uses for a key on the target's chain: from the captured record, else the
     * property as it stands.
     *
     * @param {unknown} target - any value but `null` and `undefined`
     * @param {PropertyKey} key
     * @returns {PropertyDescriptor | Failure | undefined}
     */
    _find(target, key) {
        const record = this._captured(target, key);
        if (record) return this._resolve(target, key, record, true);
        /** @type {unknown} */
        let current = typeof target === 'object' || typeof target === 'function' ? target : getPrototypeOf(target);
        while (current !== null && current !== undefined) {
            const descriptor = getOwnPropertyDescriptor(current, key);
            if (descriptor) return descriptor;
            current = getPrototypeOf(current);
        }
        return undefined;
    }

    /**
     * The data value for a key on the target's chain, as `_find` gives it: for a method, the function.
     *
     * @param {unknown} target - any value but `null` and `undefined`
     * @param {PropertyKey} key
     * @returns {unknown}
     */
    _method(target, key) {
        const found = this._find(target, key);
        return found && !isFailure(found) && 'value' in found ? found.value : undefined;
    }

    /**
     * Read one property, as JS reads it: a name present nowhere, or an accessor with no getter, reads
     * `undefined`. A getter that throws fails, and so does a page's Proxy trap that throws. A page getter
     * in place of a captured value fails with `PageAccessor`.
     *
     * @param {unknown} target - any value but `null` and `undefined`
     * @param {string} name
     * @returns {unknown} the value, or a `Failure`
     */
    read(target, name) {
        try {
            const record = this._captured(target, name);
            if (!record) {
                // A primitive is read from its prototype, with itself as the getter's receiver
                const start = typeof target === 'object' || typeof target === 'function' ? target : getPrototypeOf(target);
                return ReflectGet(/** @type {object} */ (start), name, target);
            }
            const descriptor = this._resolve(target, name, record, false);
            if (isFailure(descriptor)) return descriptor;
            if ('value' in descriptor) return descriptor.value;
            if (!descriptor.get) return undefined;
            return ReflectApply(descriptor.get, target, []);
        } catch (e) {
            return thrownFailure(e);
        }
    }

    /**
     * Call a method. A name whose value is not a function fails with `TypeError`, as the call throws in
     * JS. A method that throws fails, and so does a page's Proxy trap that throws.
     *
     * @param {unknown} target - any value but `null` and `undefined`
     * @param {string} name
     * @param {readonly unknown[]} args
     * @returns {unknown} the result, or a `Failure`
     */
    call(target, name, args) {
        try {
            const method = this._method(target, name);
            if (typeof method !== 'function') return new Failure('TypeError');
            return ReflectApply(method, target, args);
        } catch (e) {
            return thrownFailure(e);
        }
    }

    /**
     * Whether a value is a DOM node: the global's `Node.prototype` is on its prototype chain. A page's
     * Proxy trap that throws fails.
     *
     * @param {unknown} target
     * @returns {boolean | Failure}
     */
    isNode(target) {
        try {
            return hasPrototype(target, this.#nodePrototype ? [this.#nodePrototype] : []);
        } catch (e) {
            return thrownFailure(e);
        }
    }

    /**
     * The iterator method of a value, when it has one. A page's Proxy trap that throws fails.
     *
     * @param {unknown} target
     * @returns {Function | undefined | Failure}
     */
    iteratorMethod(target) {
        if (target === null || target === undefined || typeof target === 'string') return undefined;
        try {
            const method = this._method(target, Symbol.iterator);
            return typeof method === 'function' ? method : undefined;
        } catch (e) {
            return thrownFailure(e);
        }
    }
}

/**
 * @param {object} target
 * @param {PropertyKey} key
 * @returns {PropertyDescriptor | undefined} the own descriptor, or `undefined` where reading it throws
 */
function tryOwnDescriptor(target, key) {
    try {
        return getOwnPropertyDescriptor(target, key);
    } catch {
        return undefined;
    }
}

/**
 * Whether one of the prototypes is on a value's prototype chain, read through the captured
 * `getPrototypeOf` so a page override of `Symbol.hasInstance` is not called.
 *
 * @param {unknown} target
 * @param {readonly object[]} prototypes
 * @returns {boolean}
 */
function hasPrototype(target, prototypes) {
    if (prototypes.length === 0 || typeof target !== 'object' || target === null) return false;
    for (let current = getPrototypeOf(target); current !== null; current = getPrototypeOf(current)) {
        if (prototypes.includes(current)) return true;
    }
    return false;
}
