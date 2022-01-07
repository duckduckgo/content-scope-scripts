import { defineProperty } from '../utils'

export function init (args) {
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
                async isDuckDuckGo () {
                    return true
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
