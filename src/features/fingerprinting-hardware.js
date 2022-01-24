import { overrideProperty } from '../utils'

export function init (args, window = globalThis) {
    const Navigator = window.Navigator
    const navigator = window.navigator

    overrideProperty('keyboard', {
        object: Navigator.prototype,
        origValue: navigator.keyboard,
        targetValue: undefined
    })
    overrideProperty('hardwareConcurrency', {
        object: Navigator.prototype,
        origValue: navigator.hardwareConcurrency,
        targetValue: 2
    })
    overrideProperty('deviceMemory', {
        object: Navigator.prototype,
        origValue: navigator.deviceMemory,
        targetValue: 8
    })
}
