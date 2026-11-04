/**
 * @module Apple integration
 */
import { load, init } from '../src/content-scope-features.js';
import { processConfig, platformSpecificFeatures, getLoadArgs } from './../src/utils';
import { WebkitMessagingConfig } from '../../messaging/index.js';

function initCode() {
    // Native passes the config as a JSON string literal. Every frame compiles its own copy of this script, and one string
    // constant costs far less to compile and keep than the equivalent object literal.
    // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
    const config = JSON.parse($CONTENT_SCOPE_JSON$);
    // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
    const userUnprotectedDomains = $USER_UNPROTECTED_DOMAINS$;
    // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
    const userPreferences = $USER_PREFERENCES$;

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
