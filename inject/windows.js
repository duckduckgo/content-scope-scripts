/* global contentScopeFeatures */

import { processConfig } from './../src/apple-utils'
import { initPermissionsInUseDetection } from './../src/windows-utils'

function init () {
    // permissions in use detection cannot be turned off
    initPermissionsInUseDetection()

    const processedConfig = processConfig($CONTENT_SCOPE$, $USER_UNPROTECTED_DOMAINS$, $USER_PREFERENCES$)
    if (processedConfig.site.allowlisted) {
        return
    }

    contentScopeFeatures.load()

    contentScopeFeatures.init(processedConfig)

    // Not supported:
    // contentScopeFeatures.update(message)
}

init()
