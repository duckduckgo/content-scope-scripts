import { defineProperty, DDGPromise } from '../utils'

export function init (args) {
    return false
    try {
        if (navigator.duckduckgo) {
            return
        }
        if (!args.platform || !args.platform.name) {
            return
        }
        defineProperty(Navigator.prototype, 'duckduckgo', {
            value: {
                platform: args.platform.name,
                isDuckDuckGo () {
                    return DDGPromise.resolve(true)
                }
            },
            enumerable: true,
            configurable: false,
            writable: false
        })
    } catch {
        // todo: Just ignore this exception?
    }
}
