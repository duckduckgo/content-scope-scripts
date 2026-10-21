import { getOwnPropertyDescriptor, getOwnPropertyNames, getPrototypeOf, ReflectApply, ReflectGet } from '../../../captured-globals.js';
import { Failure } from '../model/core.js';

/**
 * @typedef {import('../model/types.js').Reader} Reader
 */

/**
 * Reads properties and calls methods, preferring the getters and methods captured when the reader is
 * created, so one a page replaces afterwards is not called.
 *
 * Holders are the global object, each namespace object such as `CSS`, and every global constructor and
 * its prototype, so static methods such as `Number.isFinite` are captured too. For each name config uses, the reader records the own accessor, method or
 * value with that name on each holder. A read walks the object and its prototype chain for a holder
 * with a record. With none, it reads the property as it stands on the object or its chain, whoever
 * defined it.
 *
 * @implements {Reader}
 */
export class NativeReader {
    /** @type {Map<object, Map<PropertyKey, PropertyDescriptor>>} */
    #holders = new Map();
    /** @type {object | undefined} */
    #nodePrototype;
    /**
     * Per key, the record found walking up from a prototype, or `null` for none. A page can change a
     * prototype's chain between runs, so it is kept for one run.
     *
     * @type {Map<PropertyKey, Map<object, PropertyDescriptor | null>>}
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
                if (typeof prototype === 'object' && prototype !== null) holders.push(prototype);
            } else if (typeof value === 'object' && value !== null && value !== global) {
                holders.push(value);
            }
        }
        for (const holder of holders) {
            /** @type {Map<PropertyKey, PropertyDescriptor> | undefined} */
            let records;
            try {
                for (const key of keys) {
                    const descriptor = getOwnPropertyDescriptor(holder, key);
                    if (!descriptor) continue;
                    records ??= new Map();
                    records.set(key, descriptor);
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
     * @returns {PropertyDescriptor | undefined}
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
     * The captured record for a key on the target's chain, else the property as it stands.
     *
     * @param {unknown} target - any value but `null` and `undefined`
     * @param {PropertyKey} key
     * @returns {PropertyDescriptor | undefined}
     */
    _find(target, key) {
        const record = this._captured(target, key);
        if (record) return record;
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
     * Read one property, as JS reads it: a name present nowhere, or an accessor with no getter, reads
     * `undefined`. A getter that throws fails, and so does a page's Proxy trap that throws.
     *
     * @param {unknown} target - any value but `null` and `undefined`
     * @param {string} name
     * @returns {unknown} the value, or a `Failure`
     */
    read(target, name) {
        const record = this._captured(target, name);
        try {
            if (!record) {
                // A primitive is read from its prototype, with itself as the getter's receiver
                const start = typeof target === 'object' || typeof target === 'function' ? target : getPrototypeOf(target);
                return ReflectGet(/** @type {object} */ (start), name, target);
            }
            if ('value' in record) return record.value;
            if (!record.get) return undefined;
            return ReflectApply(record.get, target, []);
        } catch (e) {
            return new Failure(errorName(e));
        }
    }

    /**
     * Call a method. A name whose value is not a function fails with `TypeError`, as the call throws in
     * JS, and so does a method that throws.
     *
     * @param {unknown} target - any value but `null` and `undefined`
     * @param {string} name
     * @param {readonly unknown[]} args
     * @returns {unknown} the result, or a `Failure`
     */
    call(target, name, args) {
        const record = this._find(target, name);
        const method = record && 'value' in record ? record.value : undefined;
        if (typeof method !== 'function') return new Failure('TypeError');
        try {
            return ReflectApply(method, target, args);
        } catch (e) {
            return new Failure(errorName(e));
        }
    }

    /**
     * Whether a value is a DOM node: the global's `Node.prototype` is on its prototype chain.
     *
     * @param {unknown} target
     * @returns {boolean}
     */
    isNode(target) {
        return hasPrototype(target, this.#nodePrototype ? [this.#nodePrototype] : []);
    }

    /**
     * The iterator method of a value, when it has one.
     *
     * @param {unknown} target
     * @returns {Function | undefined}
     */
    iteratorMethod(target) {
        if (target === null || target === undefined || typeof target === 'string') return undefined;
        const record = this._find(target, Symbol.iterator);
        const method = record && 'value' in record ? record.value : undefined;
        return typeof method === 'function' ? method : undefined;
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
 * The name of a thrown value's constructor, read from own data properties through captured globals so
 * no page getter is called.
 *
 * @param {unknown} thrown
 * @returns {string | undefined}
 */
function errorName(thrown) {
    try {
        for (let current = getPrototypeOf(thrown); current !== null; current = getPrototypeOf(current)) {
            const constructor = getOwnPropertyDescriptor(current, 'constructor')?.value;
            const name = typeof constructor === 'function' ? getOwnPropertyDescriptor(constructor, 'name')?.value : undefined;
            if (typeof name === 'string') return name;
        }
    } catch {
        // A proxy's traps may throw, and `null` or `undefined` has no prototype
    }
    return undefined;
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
