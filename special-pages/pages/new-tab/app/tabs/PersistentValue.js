/**
 * @template {string} T - the value to hold.
 */
export class PersistentValue {
    /** @type {Map<string, T>} */
    #values = new Map();

    name() {
        return 'PersistentValue';
    }

    /**
     * Updates the value associated with a given identifier.
     *
     * @param {object} args
     * @param {string} args.id
     * @param {T} args.value
     */
    update({ id, value }) {
        if (string(id)) {
            this.#values.set(id, value);
        }
    }

    /**
     * Updates the value with every entry
     *
     * @param {object} args
     * @param {T} args.value
     */
    updateAll({ value }) {
        for (const [key] of this.#values) {
            this.#values.set(key, value);
        }
    }

    /**
     * @param {object} params
     * @param {string[]} params.preserve
     */
    prune({ preserve }) {
        for (const key of this.#values.keys()) {
            if (!preserve.includes(key)) {
                this.#values.delete(key);
            }
        }
    }

    /**
     * @param {object} args
     * @param {string} args.id
     */
    remove({ id }) {
        if (string(id)) {
            this.#values.delete(id);
        }
    }

    /**
     * @param {string|null|undefined} id
     * @return {T | null}
     */
    byId(id) {
        if (typeof id !== 'string') return null;
        const value = this.#values.get(id);
        if (!value || !string(value)) return null;
        return value;
    }

    print() {
        for (const [key, value] of this.#values) {
            console.log(`key: ${key}, value: ${value}`);
        }
        console.log('--');
    }
}

/**
 * @param {unknown} input
 */
function string(input) {
    if (typeof input !== 'string') return '';
    if (input.trim().length < 1) return '';
    return input;
}
