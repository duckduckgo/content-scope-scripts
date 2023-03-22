/**
 * @module Apple integration
 */
/* global contentScopeFeatures */

import { processConfig, isGloballyDisabled } from './../src/utils'

function init () {
    // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
    const processedConfig = processConfig($CONTENT_SCOPE$, $USER_UNPROTECTED_DOMAINS$, $USER_PREFERENCES$)
    if (isGloballyDisabled(processedConfig)) {
        return
    }

    contentScopeFeatures.load({
        platform: processedConfig.platform
    })

    contentScopeFeatures.init(processedConfig)

    // Not supported:
    // contentScopeFeatures.update(message)
}

init()
