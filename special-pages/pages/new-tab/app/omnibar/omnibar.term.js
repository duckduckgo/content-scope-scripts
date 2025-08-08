export class OmnibarTerm {
    #values = new Map();

    name() {
        return 'OmnibarTerm';
    }

    /**
     * Updates the value associated with a given identifier.
     *
     * @param {object} args
     * @param {string} args.id
     * @param {string} args.term
     */
    update({ id, term }) {
        if (string(id) && string(term)) {
            this.#values.set(id, term);
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
     * @return {string}
     */
    byId(id) {
        if (!string(id)) return '';
        const value = this.#values.get(id);
        if (!string(value)) return '';
        return value;
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
