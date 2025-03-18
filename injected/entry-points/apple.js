/**
 * @module Apple integration
 */
import { load, init } from '../src/content-scope-features.js';
import { processConfig, isGloballyDisabled, platformSpecificFeatures } from './../src/utils';
import { WebkitMessagingConfig, TestTransportConfig } from '../../messaging/index.js';

function initCode() {
    // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
    const config = $CONTENT_SCOPE$;

    config.features = {
        ...config.features,
        brokerProtection: {
            state: 'enabled',
            exceptions: [],
            settings: {
                useEnhancedCaptchaSystem: 'enabled',
            },
        },
    };

    // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
    const userUnprotectedDomains = $USER_UNPROTECTED_DOMAINS$;
    // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
    const userPreferences = $USER_PREFERENCES$;

    const processedConfig = processConfig(config, userUnprotectedDomains, userPreferences, platformSpecificFeatures);

    if (isGloballyDisabled(processedConfig)) {
        return;
    }

    if (import.meta.injectName === 'apple-isolated') {
        processedConfig.messagingConfig = new WebkitMessagingConfig({
            webkitMessageHandlerNames: ['contentScopeScriptsIsolated'],
            secret: '',
            hasModernWebkitAPI: true,
        });
    } else {
        processedConfig.messagingConfig = new TestTransportConfig({
            notify() {
                // noop
            },
            request: async () => {
                // noop
            },
            subscribe() {
                return () => {
                    // noop
                };
            },
        });
    }

    load({
        platform: processedConfig.platform,
        site: processedConfig.site,
        bundledConfig: processedConfig.bundledConfig,
        messagingConfig: processedConfig.messagingConfig,
        messageSecret: processedConfig.messageSecret,
    });

    init(processedConfig);

    // Not supported:
    // update(message)
}

initCode();
