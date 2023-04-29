import { defineProperty, DDGPromise } from '../utils'
import ContentFeature from '../content-feature'

function injectNavigatorInterface (args, privileged) {
    try {
        // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
        if (navigator.duckduckgo) {
            return
        }
        if (!args.platform || !args.platform.name) {
            return
        }
        const interfaceOut = {
            platform: args.platform.name,
            isDuckDuckGo () {
                return DDGPromise.resolve(true)
            }
        }
        if (privileged) {
            interfaceOut.privileged = {
                version: args.platform.version,
                configVersion: args.remoteConfigVersion
            }
        }
        defineProperty(Navigator.prototype, 'duckduckgo', {
            value: interfaceOut,
            enumerable: true,
            configurable: false,
            writable: false
        })
    } catch {
        // todo: Just ignore this exception?
    }
}

export default class NavigatorInterface extends ContentFeature {
    load (args) {
        if (this.matchDomainFeatureSetting('privilegedDomains').length) {
            injectNavigatorInterface(args, true)
        }
    }

    init (args) {
        injectNavigatorInterface(args, false)
    }
}
