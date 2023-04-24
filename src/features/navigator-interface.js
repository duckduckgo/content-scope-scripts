import { defineProperty, DDGPromise } from '../utils.js'
import ContentFeature from '../content-feature.js'

export default class NavigatorInterface extends ContentFeature {
    init (args) {
        try {
            // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
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
}
