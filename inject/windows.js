/**
 * @module Windows integration
 * @category Content Scope Scripts Integrations
 */
import { load, init } from '../src/content-scope-features.js'
import { processConfig, isGloballyDisabled, windowsSpecificFeatures } from './../src/utils'
import { isTrackerOrigin } from '../src/trackers'

function initCode () {
    // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
    const processedConfig = processConfig($CONTENT_SCOPE$, $USER_UNPROTECTED_DOMAINS$, $USER_PREFERENCES$, windowsSpecificFeatures)
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
