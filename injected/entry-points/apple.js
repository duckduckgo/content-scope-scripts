/**
 * @module Apple integration
 */
import { load, init } from '../src/content-scope-features.js'
import { processConfig, isGloballyDisabled } from './../src/utils'
import { isTrackerOrigin } from '../src/trackers'
import { WebkitMessagingConfig, TestTransportConfig } from '../../messaging/index.js'

function initCode () {
    // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
    const processedConfig = processConfig($CONTENT_SCOPE$, $USER_UNPROTECTED_DOMAINS$, $USER_PREFERENCES$)
    if (isGloballyDisabled(processedConfig)) {
        return
    }

    if (import.meta.injectName === 'apple-isolated') {
        processedConfig.messagingConfig = new WebkitMessagingConfig({
            webkitMessageHandlerNames: ['contentScopeScriptsIsolated'],
            secret: '',
            hasModernWebkitAPI: true
        })
    } else {
        processedConfig.messagingConfig = new TestTransportConfig({
            notify () {
                // noop
            },
            request: async () => {
                // noop
            },
            subscribe () {
                return () => {
                    // noop
                }
            }
        })
    }

    load({
        platform: processedConfig.platform,
        trackerLookup: processedConfig.trackerLookup,
        documentOriginIsTracker: isTrackerOrigin(processedConfig.trackerLookup),
        site: processedConfig.site,
        bundledConfig: processedConfig.bundledConfig,
        messagingConfig: processedConfig.messagingConfig
    })

    init(processedConfig)

    // Not supported:
    // update(message)
}

initCode()
