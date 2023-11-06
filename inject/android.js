/**
 * @module Android integration
 * @category Content Scope Scripts Integrations
 */
import { load, init } from '../src/content-scope-features.js'
import { processConfig, isGloballyDisabled } from './../src/utils'
import { isTrackerOrigin } from '../src/trackers'
import { AndroidMessagingConfig } from '../packages/messaging/index.js'

function initCode () {
    // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
    const processedConfig = processConfig($CONTENT_SCOPE$, $USER_UNPROTECTED_DOMAINS$, $USER_PREFERENCES$)
    if (isGloballyDisabled(processedConfig)) {
        return
    }

    const configConstruct = processedConfig
    const messageCallback = configConstruct.messageCallback
    const secret = configConstruct.messageSecret
    const javascriptInterface = configConstruct.messageInterface
    const messagingConfig = new AndroidMessagingConfig({
        secret,
        messageCallback,
        javascriptInterface,
        target: globalThis,
        debug: processedConfig.debug
    })

    load({
        platform: processedConfig.platform,
        trackerLookup: processedConfig.trackerLookup,
        documentOriginIsTracker: isTrackerOrigin(processedConfig.trackerLookup),
        site: processedConfig.site,
        bundledConfig: processedConfig.bundledConfig,
        messagingConfig
    })

    init(processedConfig)
}

initCode()
