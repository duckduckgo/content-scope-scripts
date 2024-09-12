import { DDGPromise } from '../utils'
import ContentFeature from '../content-feature'

export default class NavigatorInterface extends ContentFeature {
    load (args) {
        if (this.matchDomainFeatureSetting('privilegedDomains').length) {
            this.injectNavigatorInterface(args)
            this.appendPrivilegedData(args.privileged)
        }
    }

    init (args) {
        this.injectNavigatorInterface(args)
    }

    /**
     * @param {import('../content-scope-features').LoadArgs} args
     */
    injectNavigatorInterface (args) {
        try {
            if (navigator.duckduckgo) {
                return
            }
            if (!args.platform || !args.platform.name) {
                return
            }
            this.defineProperty(Navigator.prototype, 'duckduckgo', {
                /** @type {DDGNavigatorInterface} */
                value: {
                    platform: args.platform.name,
                    isDuckDuckGo () {
                        return DDGPromise.resolve(true)
                    },
                    taints: new Set(),
                    taintedOrigins: new Set()
                },
                enumerable: true,
                configurable: false,
                writable: false
            })
        } catch {
            // todo: Just ignore this exception?
        }
    }

    /**
     * Append more, privileged information that should only be accessilble
     * to a known set of domains
     *
     * @param {import('../content-scope-features').LoadArgs["privileged"]} privileged
     */
    appendPrivilegedData (privileged) {
        if (!Navigator.prototype.duckduckgo) return
        this.defineProperty(Navigator.prototype.duckduckgo, 'privileged', {
            value: privileged,
            enumerable: true,
            configurable: false,
            writable: false
        })
    }
}
