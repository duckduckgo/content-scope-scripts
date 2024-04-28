import WebCompat from '../src/features/web-compat'
import { testInstanceShimCorrectness, testInterfaceShimCorrectness } from './shim-test-utils'

class MyTestFeature extends WebCompat {
    addDebugFlag () {}
}

describe('WebCompat feature', () => {
    /** @type {MyTestFeature} */
    const cf = new MyTestFeature()

    // interface name, shim function
    /** @type {Array<[string, Function]>} **/
    const interfaceShims = [
        ['MediaSession', cf.mediaSessionFix.bind(cf)],
        ['MediaMetadata', cf.mediaSessionFix.bind(cf)],

        ['Presentation', cf.presentationFix.bind(cf)],
        ['PresentationAvailability', cf.presentationFix.bind(cf)],
        ['PresentationRequest', cf.presentationFix.bind(cf)]
    ]

    // host object, property name, shim function
    /** @type {Array<[object, string, Function]>} **/
    const propertyShims = [
        [Navigator.prototype, 'mediaSession', cf.mediaSessionFix.bind(cf)],
        [Navigator.prototype, 'presentation', cf.presentationFix.bind(cf)]
    ]

    /** @type { { [key: string]: import('../src/wrapper-utils').StrictDataDescriptor } } */
    let origInterfaceDescriptors = {}
    /** @type { Array<[object, string, import('../src/wrapper-utils').StrictPropertyDescriptor]> } */
    let origPropDescriptors = []

    beforeEach(() => {
        origInterfaceDescriptors = {}
        origPropDescriptors = []
        // save original interface descriptors
        for (const [interfaceName] of interfaceShims) {
            /** @type {import('../src/wrapper-utils').StrictDataDescriptor} */
            // @ts-expect-error we know it's defined in Chrome
            const descriptor = Object.getOwnPropertyDescriptor(globalThis, interfaceName)
            origInterfaceDescriptors[interfaceName] = descriptor

            // pretend the API is missing
            delete globalThis[interfaceName]
        }
        // save original instance property descriptors
        for (const [instanceHost, instanceProp] of propertyShims) {
            /** @type {import('../src/wrapper-utils').StrictPropertyDescriptor} */
            // @ts-expect-error we know it's defined in Chrome
            const descriptor = Object.getOwnPropertyDescriptor(instanceHost, instanceProp)
            origPropDescriptors.push([instanceHost, instanceProp, descriptor])

            // pretend the API is missing
            delete instanceHost[instanceProp]
        }
    })

    afterEach(() => {
        // restore the original interfaces
        for (const [interfaceName] of interfaceShims) {
            Object.defineProperty(globalThis, interfaceName, origInterfaceDescriptors[interfaceName])
        }
        // restore the original instance properties
        for (const [instanceHost, instanceProp, descriptor] of origPropDescriptors) {
            Object.defineProperty(instanceHost, instanceProp, descriptor)
        }
    })

    describe('shims for missing APIs', () => {
        for (const [interfaceName, shimFn] of interfaceShims) {
            it(`should shim ${interfaceName}`, () => {
                testInterfaceShimCorrectness(shimFn, interfaceName, origInterfaceDescriptors[interfaceName])
            })
        }
        for (const [instanceHost, instanceProp, shimFn] of propertyShims) {
            it(`should shim ${instanceHost}.${instanceProp}`, () => {
                // @ts-expect-error we know it's defined
                const origPropDescriptor = origPropDescriptors.find(([host, prop]) => host === instanceHost && prop === instanceProp)[2]
                testInstanceShimCorrectness(shimFn, instanceHost, instanceProp, origPropDescriptor)
            })
        }
    })
})
