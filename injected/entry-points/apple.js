/**
 * @module Apple integration
 */
import { load, init } from '../src/content-scope-features.js';
import { processConfig, platformSpecificFeatures, getLoadArgs, pruneConfigFeatures } from './../src/utils';
import { platformSupport, featureConfigDependencies } from '../src/features.js';
import { WebkitMessagingConfig } from '../../messaging/index.js';

function initCode() {
    // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
    const config = $CONTENT_SCOPE$;
    // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
    const userUnprotectedDomains = $USER_UNPROTECTED_DOMAINS$;
    // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
    const userPreferences = $USER_PREFERENCES$;

    // The config holds every feature, but this bundle only reads its own, so drop the rest from memory
    const injectName = import.meta.injectName;
    if (typeof injectName === 'string' && platformSupport[injectName]) {
        pruneConfigFeatures(config, platformSupport[injectName], featureConfigDependencies);
    }

    const processedConfig = processConfig(config, userUnprotectedDomains, userPreferences, platformSpecificFeatures);

    processedConfig.messagingConfig = new WebkitMessagingConfig({
        webkitMessageHandlerNames: [processedConfig.messagingContextName],
    });

    load(getLoadArgs(processedConfig));

    init(processedConfig);

    // Not supported:
    // update(message)
}

initCode();
