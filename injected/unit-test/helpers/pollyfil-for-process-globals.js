export default function setup () {
    // Pollyfill for globalThis methods needed in processConfig
    globalThis.document = {
        referrer: 'http://localhost:8080',
        location: {
            href: 'http://localhost:8080',
            // @ts-expect-error - ancestorOrigins is not defined in the type definition
            ancestorOrigins: {
                length: 0
            }
        }
    }
    globalThis.location = {
        href: 'http://localhost:8080',
        // @ts-expect-error - ancestorOrigins is not defined in the type definition
        ancestorOrigins: {
            length: 0
        }
    }
}
