import { getOwnPropertyDescriptor, getPrototypeOf, NodePrototype, ReflectApply, ReflectGet } from '../../../captured-globals.js';
import { Failure, getOrCreate, isFailure, newMap, thrownFailure } from '../model/core.js';

/**
 * @import { Reader } from '../model/types.js'
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
 * Holders are the global object and its prototype chain, and what each path config reads from the
 * global reaches at capture. A path's first name, when it is a data property of the global such as
 * `CSS` or `Number`, adds that value as a holder, and a constructor adds its prototype too, so static
 * methods such as `Number.isFinite` are captured. Each value a path reaches adds its prototype chain,
 * so `document.title` adds `String.prototype`. A path that calls a method is followed to its receiver
 * only, and the method is not called. Following a path calls only getters captured, and at `load`, before
 * any page script, those are the browser's own. For each name config uses, the reader records the own accessor,
 * method or value with that name on each holder. A read walks the object and its prototype chain for
 * the nearest holder with a record. With none, it reads the property as it stands on the object or its
 * chain, whoever defined it, as it does for a value no path reaches, such as an element or an entry a
 * call gives.
 *
 * A captured getter is used whatever the object defines, and so is a captured method in a call. Any
 * other captured value, such as `Error.prototype.message`, is the holder's default: an own data property
 * of the object, or of a prototype below the holder, takes its place. That property is read by descriptor,
 * so no page code runs. A getter found there is not called, and the read fails.
 *
 * The global object and its chain are holders once config names something, so a reader with no names
 * or paths captures nothing. `isNode` tests against `Node.prototype` as captured at injection.
 *
 * @implements {Reader}
 */
export class NativeReader {
    /** @type {object} */
    #global;
    /** @type {Map<object, Map<PropertyKey, CapturedRecord>>} each holder's records */
    #holders = new Map();
    /** @type {Set<PropertyKey>} every key captured */
    #keys = new Set([Symbol.iterator]);
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
     * @param {Iterable<string>} [names] - every name config reads or calls
     * @param {Iterable<string>} [paths] - every path config reads from the global, up to the method it calls
     * @param {object} [nodePrototype] - the global's `Node.prototype`, which `isNode` tests against
     */
    constructor(global, names = [], paths = [], nodePrototype = NodePrototype) {
        this.#global = global;
        this.#nodePrototype = nodePrototype;
        this.capture(names, paths);
    }

    /**
     * Capture more names, and the holders more paths reach. A name already captured keeps its record,
     * and a getter or method a page replaced since construction is captured as it now stands. A path is
     * read through the getters already captured.
     *
     * @param {Iterable<PropertyKey>} keys
     * @param {Iterable<string>} [paths]
     */
    capture(keys, paths = []) {
        /** @type {PropertyKey[]} */
        const added = [];
        for (const key of keys) {
            if (this.#keys.has(key)) continue;
            this.#keys.add(key);
            added.push(key);
        }
        if (added.length > 0) {
            this._addGlobal();
            this.#holders.forEach((records, holder) => captureOn(holder, records, added));
        }
        for (const path of paths) {
            this._addGlobal();
            this._reach(path);
        }
        this.#records.clear();
    }

    /** Add the global object and its prototype chain as holders. */
    _addGlobal() {
        if (this.#holders.has(this.#global)) return;
        this._addHolder(this.#global);
        this._addChain(this.#global);
    }

    /**
     * Add the holders a path reaches, reading it from the global one name at a time through the
     * getters captured so far. A name that reads `null`, `undefined` or a failure ends it.
     *
     * @param {string} path
     */
    _reach(path) {
        const global = this.#global;
        /** @type {unknown} */
        let current = global;
        try {
            for (const [i, name] of path.split('.').entries()) {
                if (i === 0) {
                    const value = tryOwnDescriptor(global, name)?.value;
                    if ((typeof value === 'object' && value !== null && value !== global) || typeof value === 'function') {
                        this._addHolder(value);
                        // `Function.prototype` is itself a function
                        const prototype = typeof value === 'function' ? tryOwnDescriptor(value, 'prototype')?.value : undefined;
                        if ((typeof prototype === 'object' || typeof prototype === 'function') && prototype !== null) {
                            this._addHolder(prototype);
                            this._addChain(prototype);
                        }
                    }
                }
                current = this._peek(current, name);
                if (current === null || current === undefined || isFailure(current)) return;
                this._addChain(current);
            }
        } catch {
            // A page's Proxy can throw on reading its prototype
        }
    }

    /**
     * Read one name of a path at capture: through its captured getter or value as `read` does, else a
     * data property on the target's chain. A getter nothing captured is not called.
     *
     * @param {unknown} target - any value but `null` and `undefined`
     * @param {string} name
     * @returns {unknown} the value, or a `Failure`
     */
    _peek(target, name) {
        if (this._captured(target, name)) return this.read(target, name);
        const found = this._find(target, name);
        return found && !isFailure(found) && 'value' in found ? found.value : undefined;
    }

    /**
     * Add a holder, with the records of every key captured.
     *
     * @param {object} holder
     */
    _addHolder(holder) {
        if (this.#holders.has(holder)) return;
        /** @type {Map<PropertyKey, CapturedRecord>} */
        const records = new Map();
        this.#holders.set(holder, records);
        captureOn(holder, records, this.#keys);
        this.#records.clear();
    }

    /**
     * Add each prototype on a value's chain as a holder. A chain whose prototype is a holder is already
     * added above it.
     *
     * @param {unknown} value - any value but `null` and `undefined`
     */
    _addChain(value) {
        for (let current = getPrototypeOf(value); current !== null && !this.#holders.has(current); current = getPrototypeOf(current)) {
            this._addHolder(current);
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
        const byPrototype = getOrCreate(this.#records, key, newMap);
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
 * Record each key's own descriptor on a holder, keeping those already recorded. A holder whose
 * descriptor read throws, as a page's Proxy can, records none of them.
 *
 * @param {object} holder
 * @param {Map<PropertyKey, CapturedRecord>} records
 * @param {Iterable<PropertyKey>} keys
 */
function captureOn(holder, records, keys) {
    /** @type {Map<PropertyKey, CapturedRecord>} */
    const found = new Map();
    try {
        for (const key of keys) {
            if (records.has(key)) continue;
            const descriptor = getOwnPropertyDescriptor(holder, key);
            if (descriptor) found.set(key, { holder, descriptor });
        }
    } catch {
        return;
    }
    found.forEach((record, key) => records.set(key, record));
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
