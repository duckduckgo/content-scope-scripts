import { overrideProperty, getFeatureAttr } from '../utils'
import ContentFeature from '../content-feature'
const featureName = 'fingerprinting-hardware'

export default class FingerprintingHardware extends ContentFeature {
    init (args) {
        const Navigator = globalThis.Navigator
        const navigator = globalThis.navigator

        overrideProperty('keyboard', {
            object: Navigator.prototype,
            // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
            origValue: navigator.keyboard,
            targetValue: getFeatureAttr(featureName, args, 'keyboard')
        })
        overrideProperty('hardwareConcurrency', {
            object: Navigator.prototype,
            origValue: navigator.hardwareConcurrency,
            targetValue: getFeatureAttr(featureName, args, 'hardwareConcurrency', 2)
        })
        overrideProperty('deviceMemory', {
            object: Navigator.prototype,
            // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
            origValue: navigator.deviceMemory,
            targetValue: getFeatureAttr(featureName, args, 'deviceMemory', 8)
        })
    }
}
