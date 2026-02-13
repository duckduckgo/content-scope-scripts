export class Cookie {
    /**
     * @param {string} cookieString
     */
    constructor(cookieString) {
        /** @type {string[]} */
        this.parts = cookieString.split(';');
        /** @type {string | undefined} */
        this.name = undefined;
        /** @type {string | undefined} */
        this.value = undefined;
        /** @type {string | undefined} */
        this['max-age'] = undefined;
        /** @type {string | undefined} */
        this.expires = undefined;
        /** @type {string | undefined} */
        this.domain = undefined;
        /** @type {Record<string, number>} */
        this.attrIdx = {};
        this.parse();
    }

    parse() {
        const EXTRACT_ATTRIBUTES = new Set(['max-age', 'expires', 'domain']);
        this.attrIdx = {};
        this.parts.forEach((/** @type {string} */ part, /** @type {number} */ index) => {
            const kv = part.split('=', 1);
            const attribute = kv[0].trim();
            const value = part.slice(kv[0].length + 1);
            if (index === 0) {
                this.name = attribute;
                this.value = value;
            } else if (EXTRACT_ATTRIBUTES.has(attribute.toLowerCase())) {
                /** @type {Record<string, string | undefined>} */ (/** @type {unknown} */ (this))[attribute.toLowerCase()] = value;
                this.attrIdx[attribute.toLowerCase()] = index;
            }
        });
    }

    getExpiry() {
        if (!this.maxAge && !this.expires) {
            return NaN;
        }
        const expiry = this.maxAge
            ? parseInt(this.maxAge)
            : (new Date(/** @type {string} */ (this.expires)).getTime() - new Date().getTime()) / 1000;
        return expiry;
    }

    get maxAge() {
        return this['max-age'];
    }

    set maxAge(value) {
        if (this.attrIdx['max-age'] > 0) {
            this.parts.splice(this.attrIdx['max-age'], 1, `max-age=${value}`);
        } else {
            this.parts.push(`max-age=${value}`);
        }
        this.parse();
    }

    toString() {
        return this.parts.join(';');
    }
}
