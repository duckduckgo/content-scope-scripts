/**
 * Creates a mock location object for testing purposes.
 * @returns {Location} A mock location object.
 */
export function createLocationObject(href, frameAncestorsList = []) {
    return {
        href,
        // @ts-expect-error - ancestorOrigins is not defined in the type definition
        ancestorOrigins: createDomStringList(frameAncestorsList),
    };
}

export function createDomStringList(list) {
    const domStringList = {
        length: list.length,
        item(index) {
            if (index < 0 || index >= list.length) {
                return null;
            }
            return list[index];
        },
        contains(item) {
            return list.includes(item);
        },
    };

    // Add index access support
    for (let i = 0; i < list.length; i++) {
        Object.defineProperty(domStringList, i, {
            get() {
                return list[i];
            },
            enumerable: true,
        });
    }

    return domStringList;
}

export function polyfillProcessGlobals(defaultLocation = 'http://localhost:8080', frameAncestorsList = [], topisNull = false) {
    // Store original values to restore later
    const originalLocation = globalThis.location;
    const originalTop = globalThis.top;

    // Adjust the shared document rather than replacing it. The DOM query methods in
    // captured-globals.js are bound to that document at module evaluation, so swapping the global
    // out breaks every DOM-based spec - and several callers here run at module scope, which would
    // break them for the whole run.
    Object.defineProperty(globalThis.document, 'referrer', { value: defaultLocation, configurable: true });

    globalThis.location = createLocationObject(defaultLocation, frameAncestorsList);

    globalThis.top = Object.assign({}, originalTop, {
        location: createLocationObject(defaultLocation, frameAncestorsList),
    });
    if (topisNull) {
        globalThis.top = null;
    }

    // Return a cleanup function
    return function cleanup() {
        // Removing the own property reveals the document's real accessor again
        Reflect.deleteProperty(globalThis.document, 'referrer');
        globalThis.location = originalLocation;
        globalThis.top = originalTop;
    };
}
