import { DDGPromise, isBeingFramed } from '../utils';
import ContentFeature from '../content-feature';
import { createPageWorldBridge, noopMessagingInterface } from './message-bridge/create-page-world-bridge.js';

export default class NavigatorInterface extends ContentFeature {
    load(args) {
        // @ts-expect-error: Accessing private method
        if (this.matchDomainFeatureSetting('privilegedDomains').length) {
            this.injectNavigatorInterface(args);
        }
    }

    init(args) {
        this.injectNavigatorInterface(args);
    }

    injectNavigatorInterface(args) {
        try {
            // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
            if (navigator.duckduckgo) {
                return;
            }
            if (!args.platform || !args.platform.name) {
                return;
            }
            this.defineProperty(Navigator.prototype, 'duckduckgo', {
                value: {
                    platform: args.platform.name,
                    isDuckDuckGo() {
                        return DDGPromise.resolve(true);
                    },
                    /**
                     * @import { MessagingInterface } from "./message-bridge/schema.js"
                     * @param {string} featureName
                     * @return {MessagingInterface}
                     */
                    createMessageBridge(featureName) {
                        /**
                         * This feature never operates in a frame
                         */
                        if (isBeingFramed()) return noopMessagingInterface();
                        /**
                         * This feature never operates in insecure contexts
                         */
                        if (!isSecureContext) return noopMessagingInterface();
                        /**
                         * This feature never operates without messageSecret
                         */
                        if (!args.messageSecret) noopMessagingInterface();

                        return createPageWorldBridge(featureName, args.messageSecret);
                    },
                },
                enumerable: true,
                configurable: false,
                writable: false,
            });
        } catch {
            // todo: Just ignore this exception?
        }
    }
}
