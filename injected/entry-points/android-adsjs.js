/**
 * @module Android AdsJS integration
 */
import { load, init } from '../src/content-scope-features.js';
import { processConfig } from './../src/utils';
import { AndroidAdsjsMessagingConfig } from '../../messaging/index.js';

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
