/**
 * Type declarations for the parse-address package.
 * @see node_modules/parse-address/address.js
 */
declare module 'parse-address' {
    /** Parsed location with at least city and optionally state */
    interface ParsedLocation {
        city?: string;
        state?: string;
        [key: string]: string | undefined;
    }

    interface ParseAddressModule {
        parseLocation(address: string): ParsedLocation | null;
    }

    const parseAddress: ParseAddressModule;
    export default parseAddress;
}
