declare module 'parse-address' {
    const parseAddress: {
        parseLocation(address: string): Record<string, string>;
    };
    export default parseAddress;
}
