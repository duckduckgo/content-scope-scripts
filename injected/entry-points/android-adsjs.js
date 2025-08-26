/**
 * @module Android AdsJS integration
 */
import { load, init } from '../src/content-scope-features.js';
import { processConfig, isBeingFramed } from './../src/utils';
import { AndroidAdsjsMessagingConfig, MessagingContext, Messaging } from '../../messaging/index.js';

/**
 * Send initial ping once per frame to establish communication with the platform.
 * This replaces the per-feature ping that was previously sent in AndroidAdsjsMessagingTransport.
 * Listens for response to update all content feature configurations.
 *
 * @param {AndroidAdsjsMessagingConfig} messagingConfig
 * @param {object} processedConfig - The processed configuration that may be updated by the response
 */
async function sendInitialPing(messagingConfig, processedConfig) {
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

        // Use the request method - it handles subscription/unsubscription automatically
        const response = await messaging.request('initialPing', {});

        // Update processedConfig with response data if available
        if (response && typeof response === 'object') {
            Object.assign(processedConfig, response);
        }
    } catch (error) {
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
    const objectName = configConstruct.objectName || 'contentScopeAdsjs';

    processedConfig.messagingConfig = new AndroidAdsjsMessagingConfig({
        objectName,
        target: globalThis,
        debug: processedConfig.debug,
    });

    // Send initial ping once per frame to establish communication and get config updates
    // Fire-and-forget - don't block initialization
    sendInitialPing(processedConfig.messagingConfig, processedConfig).catch((error) => {
        if (processedConfig.debug) {
            console.error('AndroidAdsjs: Initial ping failed:', error);
        }
    });

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
