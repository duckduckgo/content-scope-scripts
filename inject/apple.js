/**
 * @module Apple integration
 * @category Content Scope Scripts Integrations
 */
import { load, init } from '../src/content-scope-features.js'
import { processConfig, isGloballyDisabled } from './../src/utils'
import { isTrackerOrigin } from '../src/trackers'

function initCode () {
    // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
    const config = $CONTENT_SCOPE$
    config.features.duckPlayer = {
        state: 'enabled',
        exceptions: [],
        settings: {
            overlays: {
                youtube: {
                    state: 'disabled'
                },
                serpProxy: {
                    state: 'disabled'
                }
            },
            domains: [
                {
                    domain: 'youtube.com',
                    patchSettings: [
                        {
                            op: 'replace',
                            path: '/overlays/youtube/state',
                            value: 'enabled'
                        }
                    ]
                },
                {
                    domain: 'duckduckgo.com',
                    patchSettings: [
                        {
                            op: 'replace',
                            path: '/overlays/serpProxy/state',
                            value: 'enabled'
                        }
                    ]
                }
            ]
        }
    }

    const processedConfig = processConfig(config, $USER_UNPROTECTED_DOMAINS$, $USER_PREFERENCES$)
    if (isGloballyDisabled(processedConfig)) {
        return
    }

    load({
        platform: processedConfig.platform,
        trackerLookup: processedConfig.trackerLookup,
        documentOriginIsTracker: isTrackerOrigin(processedConfig.trackerLookup),
        site: processedConfig.site
    })

    init(processedConfig)

    // Not supported:
    // update(message)
}

initCode()
