export class Cookie {
    constructor(cookieString) {
        this.parts = cookieString.split(';');
        this.parse();
    }

    parse() {
        const EXTRACT_ATTRIBUTES = new Set(['max-age', 'expires', 'domain']);
        this.attrIdx = {};
        this.parts.forEach((part, index) => {
            const kv = part.split('=', 1);
            const attribute = kv[0].trim();
            const value = part.slice(kv[0].length + 1);
            if (index === 0) {
                this.name = attribute;
                this.value = value;
            } else if (EXTRACT_ATTRIBUTES.has(attribute.toLowerCase())) {
                this[attribute.toLowerCase()] = value;
                // @ts-expect-error - Object is possibly 'undefined'.
                this.attrIdx[attribute.toLowerCase()] = index;
            }
        });
    }

    getExpiry() {
        // @ts-expect-error expires is not defined in the type definition
        if (!this.maxAge && !this.expires) {
            return NaN;
        }
        
        if (this.maxAge) {
            const parsedMaxAge = parseInt(this.maxAge);
            // Return NaN if maxAge is not a valid number
            return isNaN(parsedMaxAge) ? NaN : parsedMaxAge;
        }
        
        // @ts-expect-error expires is not defined in the type definition
        const expiryDate = new Date(this.expires);
        // Check if the date is valid before calculating expiry
        if (isNaN(expiryDate.getTime())) {
            return NaN;
        }
        
        return (expiryDate.getTime() - new Date().getTime()) / 1000;
    }

    get maxAge() {
        return this['max-age'];
    }

    set maxAge(value) {
        // @ts-expect-error - Object is possibly 'undefined'.
        if (this.attrIdx['max-age'] > 0) {
            // @ts-expect-error - Object is possibly 'undefined'.
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
