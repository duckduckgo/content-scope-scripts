import { DDGPromise } from '../utils';
import ContentFeature from '../content-feature';
import { createPageWorldBridge } from './message-bridge/create-page-world-bridge.js';
import { ensureNavigatorDuckDuckGo } from '../navigator-global.js';

/**
 * @import { MessagingInterface } from "./message-bridge/schema.js"
 */

const store = {};

export default class NavigatorInterface extends ContentFeature {
    load(args) {
        if (this.matchConditionalFeatureSetting('privilegedDomains').length) {
            this.injectNavigatorInterface(args);
        }
    }

    init(args) {
        this.injectNavigatorInterface(args);
    }

    injectNavigatorInterface(args) {
        try {
            if (!args.platform || !args.platform.name) {
                return;
            }
            if (navigator.duckduckgo?.platform) {
                // Already fully initialized
                return;
            }

            const target = ensureNavigatorDuckDuckGo({
                defineProperty: this.defineProperty.bind(this),
            });
            // eslint-disable-next-line @typescript-eslint/no-this-alias
            const context = this;

            this.defineProperty(target, 'platform', {
                value: args.platform.name,
                enumerable: true,
                configurable: false,
                writable: false,
            });

            this.defineProperty(target, 'isDuckDuckGo', {
                value: () => DDGPromise.resolve(true),
                enumerable: true,
                configurable: false,
                writable: false,
            });

            /**
             * @param {string} featureName
             * @return {MessagingInterface}
             * @throws {Error}
             */
            const createMessageBridge = (featureName) => {
                const existingBridge = store[featureName];
                if (existingBridge) return existingBridge;

                const bridge = createPageWorldBridge(featureName, args.messageSecret, context);

                store[featureName] = bridge;
                return bridge;
            };

            this.defineProperty(target, 'createMessageBridge', {
                value: createMessageBridge,
                enumerable: true,
                configurable: false,
                writable: false,
            });
        } catch {
            // todo: Just ignore this exception?
        }
    }
}
