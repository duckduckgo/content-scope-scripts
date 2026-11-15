/**
 * @module Apple integration
 */
import { load, init } from '../src/content-scope-features.js';
import { processConfig, platformSpecificFeatures, getLoadArgs } from './../src/utils';
import { WebkitMessagingConfig } from '../../messaging/index.js';

// eslint-disable-next-line no-undef
const processedConfig = processConfig(__config, __userUnprotectedDomains, __userPreferences, platformSpecificFeatures);

processedConfig.messagingConfig = new WebkitMessagingConfig({
    webkitMessageHandlerNames: [processedConfig.messagingContextName],
});

load(getLoadArgs(processedConfig));

init(processedConfig);
