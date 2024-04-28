import { assert } from 'chai'
import { ddgShimMark } from '../src/wrapper-utils'

/**
 * assert that two descriptors are similar, allowing different values
 * @param {import('../src/wrapper-utils').StrictPropertyDescriptor} origDesc
 * @param {import('../src/wrapper-utils').StrictPropertyDescriptor} newDesc
 */
export function compareDescriptorShape (origDesc, newDesc) {
    const origKeys = Object.keys(origDesc)
    const newKeys = Object.keys(newDesc)
    assert.sameMembers(newKeys, origKeys, 'property keys do not match')
    for (const key of origKeys) {
        if (key === 'get' || key === 'set' || key === 'value') {
            assert.strictEqual(typeof newDesc[key], typeof origDesc[key], `property ${key} does not match`)
        } else {
            assert.strictEqual(newDesc[key], origDesc[key], `property ${key} does not match`)
        }
    }
}

/**
 * Use this function to test the interfaces shimmed in the web-compat feature
 * @param {Function} shimFunction - the function that shims the interface
 * @param {string} interfaceName - the name of the interface to test. It should be available in the global scope
 * @param {import('../src/wrapper-utils').StrictPropertyDescriptor} origInterfaceDescriptor - the descriptor of the original interface
 */
export function testInterfaceShimCorrectness (shimFunction, interfaceName, origInterfaceDescriptor) {
    if (!interfaceName) {
        assert.fail('Nothing to test.')
    }

    shimFunction()

    assert.isDefined(globalThis[interfaceName], 'native class is not found after shimming')
    assert.strictEqual(globalThis[interfaceName][ddgShimMark], true, 'class should be marked as shimmed')

    /** @type {import('../src/wrapper-utils').StrictDataDescriptor} */
    // @ts-expect-error we know it's defined in Chrome
    const newInterfaceDescriptor = Object.getOwnPropertyDescriptor(globalThis, interfaceName)

    compareDescriptorShape(origInterfaceDescriptor, newInterfaceDescriptor)
}

/**
 * Use this function to test the global properties shimmed in the web-compat feature
 * @param {Function} shimFunction - the function that shims the interface
 * @param {any} instanceHost - object under which the global instance is defined
 * @param {string} instanceProp - the name of the instance property
 * @param {import('../src/wrapper-utils').StrictPropertyDescriptor} origInstanceDescriptor - the descriptor of the original instance property
 */
export function testInstanceShimCorrectness (shimFunction, instanceHost, instanceProp, origInstanceDescriptor) {
    if (!instanceHost || !instanceProp) {
        assert.fail('Nothing to test.')
    }

    shimFunction()

    assert.isDefined(instanceHost[instanceProp], 'global instance is not found after shimming')

    /** @type {import('../src/wrapper-utils').StrictPropertyDescriptor} */
    // @ts-expect-error we know it's defined in Chrome
    const newInstanceDescriptor = Object.getOwnPropertyDescriptor(instanceHost, instanceProp)

    compareDescriptorShape(origInstanceDescriptor, newInstanceDescriptor)
}
