import { DDGPromise } from '../utils'
import ContentFeature from '../content-feature'

export default class NavigatorInterface extends ContentFeature {
    load(args) {
        if (this.matchDomainFeatureSetting('privilegedDomains').length) {
            this.injectNavigatorInterface(args)
        }
    }

    init(args) {
        this.injectNavigatorInterface(args)
    }

    injectNavigatorInterface(args) {
        try {
            // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
            if (navigator.duckduckgo) {
                return
            }
            if (!args.platform || !args.platform.name) {
                return
            }
            this.defineProperty(Navigator.prototype, 'duckduckgo', {
                value: {
                    platform: args.platform.name,
                    isDuckDuckGo() {
                        return DDGPromise.resolve(true)
                    },
                },
                enumerable: true,
                configurable: false,
                writable: false,
            })
        } catch {
            // todo: Just ignore this exception?
        }
    }
}
