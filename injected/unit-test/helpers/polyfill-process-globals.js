export function polyfillProcessGlobals() {
    // Store original values to restore later
    const originalDocument = globalThis.document;
    const originalLocation = globalThis.location;
    const originalTop = globalThis.top;

    // Apply the patch
    globalThis.document = {
        referrer: 'http://localhost:8080',
        location: {
            href: 'http://localhost:8080',
            // @ts-expect-error - ancestorOrigins is not defined in the type definition
            ancestorOrigins: {
                length: 0,
            },
        },
    };

    globalThis.location = globalThis.document.location;

    globalThis.top = Object.assign({}, originalTop, {
        location: globalThis.location,
    });

    // Return a cleanup function
    return function cleanup() {
        globalThis.document = originalDocument;
        globalThis.location = originalLocation;
        globalThis.top = originalTop;
    };
}
