import { overrideProperty, getFeatureSetting, isAppleSilicon } from '../utils'
const featureName = 'fingerprinting-hardware'

export function init (args) {
    const Navigator = globalThis.Navigator
    const navigator = globalThis.navigator

    let hardwareConcurrency = getFeatureSetting(featureName, args, 'hardwareConcurrency', 2)
    if (typeof hardwareConcurrency === 'object') {
        hardwareConcurrency = isAppleSilicon() ? hardwareConcurrency.appleSilicon : hardwareConcurrency.intel
    }

    overrideProperty('keyboard', {
        object: Navigator.prototype,
        origValue: navigator.keyboard,
        targetValue: getFeatureSetting(featureName, args, 'keyboard')
    })
    overrideProperty('hardwareConcurrency', {
        object: Navigator.prototype,
        origValue: navigator.hardwareConcurrency,
        targetValue: hardwareConcurrency
    })
    overrideProperty('deviceMemory', {
        object: Navigator.prototype,
        origValue: navigator.deviceMemory,
        targetValue: getFeatureSetting(featureName, args, 'deviceMemory', 8)
    })
}
