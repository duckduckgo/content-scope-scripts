/* global contentScopeFeatures */

import { processConfig } from './../src/windows-utils'

function init () {
    const processedConfig = processConfig($CONTENT_SCOPE$, $USER_UNPROTECTED_DOMAINS$, $USER_PREFERENCES$)

    contentScopeFeatures.load()

    contentScopeFeatures.init(processedConfig)

    // Not supported:
    // contentScopeFeatures.update(message)
}

init()
