/**
 * @module Android integration
 */
import { load, init } from '../src/content-scope-features.js';
import { processConfig, getLoadArgs, isBeingFramed } from './../src/utils';
import { AndroidMessagingConfig, Messaging, MessagingContext } from '../../messaging/index.js';

/**
 * Send initial ping once per page to signal initialization to native.
 *
 * @param {AndroidMessagingConfig} messagingConfig
 * @param {object} processedConfig
 */
function sendInitialPing(messagingConfig, processedConfig) {
    if (isBeingFramed()) {
        return;
    }

    const messagingContext = new MessagingContext({
        context: processedConfig.messagingContextName,
        env: processedConfig.debug ? 'development' : 'production',
        featureName: 'messaging',
    });

    const messaging = new Messaging(messagingContext, messagingConfig);
    messaging.notify('initialPing');
}

async function initCode() {
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

    load(getLoadArgs(processedConfig));

    try {
        await init(processedConfig);
        sendInitialPing(processedConfig.messagingConfig, processedConfig);
    } catch (error) {
        if (processedConfig.debug) {
            console.error('Android: Initial ping skipped after init failure:', error);
        }
    }
}

initCode();
