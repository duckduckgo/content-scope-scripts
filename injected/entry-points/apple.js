/**
 * @module Apple integration
 */
import { load, init } from '../src/content-scope-features.js';
import { processConfig, platformSpecificFeatures, getLoadArgs } from './../src/utils';
import { WebkitMessagingConfig } from '../../messaging/index.js';

function initCode() {
    // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
    const config = $CONTENT_SCOPE$;
    // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
    const userUnprotectedDomains = $USER_UNPROTECTED_DOMAINS$;
    // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
    const userPreferences = $USER_PREFERENCES$;
    // @ts-expect-error - Replaced by Swift with surrogate functions object
    const surrogates = $SURROGATES$;

    const processedConfig = processConfig(config, userUnprotectedDomains, userPreferences, platformSpecificFeatures);

    processedConfig.messagingConfig = new WebkitMessagingConfig({
        webkitMessageHandlerNames: [processedConfig.messagingContextName],
        secret: '',
        hasModernWebkitAPI: true,
    });

    // Pass surrogates to features (can't go through JSON config since functions aren't serializable)
    processedConfig.surrogates = surrogates;

    load(getLoadArgs(processedConfig));

    init(processedConfig);

    // Not supported:
    // update(message)
}

initCode();
