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

    // The unit-test run installs a document (see install-dom-globals.js); the Playwright runner does
    // not, yet its helpers call into src/utils.js, which reads `document.referrer` and
    // `document.location`.
    const hasDocument = Boolean(globalThis.document);

    if (hasDocument) {
        // The DOM query methods in captured-globals.js are bound to this document, so it must be
        // adjusted in place rather than replaced.
        Object.defineProperty(globalThis.document, 'referrer', { value: defaultLocation, configurable: true });
    } else {
        globalThis.document = /** @type {Document} */ (
            /** @type {unknown} */ ({
                referrer: defaultLocation,
                location: createLocationObject(defaultLocation, frameAncestorsList),
            })
        );
    }

    globalThis.location = createLocationObject(defaultLocation, frameAncestorsList);

    globalThis.top = Object.assign({}, originalTop, {
        location: createLocationObject(defaultLocation, frameAncestorsList),
    });
    if (topisNull) {
        globalThis.top = null;
    }

    // Return a cleanup function
    return function cleanup() {
        if (hasDocument) {
            // Removing the own property restores the document's own `referrer` accessor
            Reflect.deleteProperty(globalThis.document, 'referrer');
        } else {
            Reflect.deleteProperty(globalThis, 'document');
        }
        globalThis.location = originalLocation;
        globalThis.top = originalTop;
    };
}
