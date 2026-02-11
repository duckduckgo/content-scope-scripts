/**
 * @module Android integration
 */
import { load, init, updateFeatureArgs } from '../src/content-scope-features.js';
import { processConfig, isBeingFramed } from '../src/utils.js';
import { AndroidMessagingConfig, MessagingContext, Messaging } from '@duckduckgo/messaging';

/**
 * Send initial ping once per frame to establish communication with the platform.
 * This replaces the per-feature ping that was previously sent in AndroidAdsjsMessagingTransport.
 * When response is received, updates all loaded feature configurations.
 *
 * @param {AndroidMessagingConfig} messagingConfig
 * @param {object} processedConfig - The base configuration
 */
async function sendInitialPingAndUpdate(messagingConfig, processedConfig) {
    // Only send ping in top context, not in frames
    if (isBeingFramed()) {
        return;
    }

    try {
        // Create messaging context for the initial ping
        const messagingContext = new MessagingContext({
            context: 'contentScopeScripts',
            env: processedConfig.debug ? 'development' : 'production',
            featureName: 'messaging',
        });

        // Create messaging instance - handles all the subscription/error boilerplate
        const messaging = new Messaging(messagingContext, messagingConfig);

        if (processedConfig.debug) {
            console.log('AndroidAdsjs: Sending initial ping...');
        }

        // Send the ping request
        const response = await messaging.request('initialPing', {});

        // Update all loaded features with merged configuration
        if (response && typeof response === 'object') {
            const updatedConfig = { ...processedConfig, ...response };

            await updateFeatureArgs(updatedConfig);
        }
    } catch (error) {
        if (processedConfig.debug) {
            console.error('AndroidAdsjs: Initial ping failed:', error);
        }
    }
}

function initCode() {
    // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
    const config = $CONTENT_SCOPE$;
    // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
    const userUnprotectedDomains = $USER_UNPROTECTED_DOMAINS$;
    // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
    const userPreferences = $USER_PREFERENCES$;

    const processedConfig = processConfig(config, userUnprotectedDomains, userPreferences);

    const configConstruct = processedConfig;
    const messageCallback = configConstruct.messageCallback;
    const messageSecret = configConstruct.messageSecret;
    const javascriptInterface = configConstruct.javascriptInterface;
    processedConfig.messagingConfig = new AndroidMessagingConfig({
        messageSecret,
        messageCallback,
        javascriptInterface,
        target: globalThis,
        debug: processedConfig.debug,
    });

    // Send initial ping asynchronously to update feature configurations when response arrives
    sendInitialPingAndUpdate(processedConfig.messagingConfig, processedConfig);

    load({
        platform: processedConfig.platform,
        site: processedConfig.site,
        bundledConfig: processedConfig.bundledConfig,
        messagingConfig: processedConfig.messagingConfig,
        messageSecret: processedConfig.messageSecret,
    });

    init(processedConfig);
}

initCode();
