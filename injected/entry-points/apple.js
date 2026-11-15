/**
 * @module Apple integration
 */
import { load, init } from '../src/content-scope-features.js';
import { processConfig, platformSpecificFeatures, getLoadArgs } from './../src/utils';
import { WebkitMessagingConfig } from '../../messaging/index.js';

function initCode() {
    const config = {
        unprotectedTemporary: [],
        features: {},
        version: 1794593240031,
    };
    const userUnprotectedDomains = [];
    const userPreferences = {
        language: 'en',
        debug: false,
        messageSecret: '54426F33-387F-405D-A30D-E923BCDC5415',
        features: {
            autofill: {
                settings: {
                    featureToggles: {
                        inlineIcon_credentials: true,
                        partial_form_saves: true,
                        inputType_identities: false,
                        emailProtection_incontext_signup: false,
                        credentials_saving: true,
                        inputType_credentials: true,
                        unknown_username_categorization: true,
                        emailProtection: true,
                        input_focus_api: true,
                        inputType_creditCards: true,
                        password_variant_categorization: true,
                        autocomplete_attribute_support: true,
                        third_party_credentials_provider: false,
                        password_generation: true,
                    },
                },
            },
        },
        platform: { name: 'ios', internal: true, version: '7.246.0' },
        messagingContextName: 'contentScopeScriptsIsolated',
        currentCohorts: [],
        globalPrivacyControlValue: true,
        sessionKey: '99FEE5E0-19DD-4CF2-8938-5C0723116921',
    };

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
