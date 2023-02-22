/* global contentScopeFeatures */

import { processConfig, isGloballyDisabled, windowsSpecificFeatures } from './../src/utils'

function init () {
    // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
    const processedConfig = processConfig($CONTENT_SCOPE$, $USER_UNPROTECTED_DOMAINS$, $USER_PREFERENCES$, windowsSpecificFeatures)
    if (isGloballyDisabled(processedConfig)) {
        return
    }
    // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
    contentScopeFeatures.load({
        platform: processedConfig.platform
    })

    // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
    contentScopeFeatures.init(processedConfig)

    // Not supported:
    // contentScopeFeatures.update(message)
}

init()
