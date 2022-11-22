/* global contentScopeFeatures */

import { appFeatureNames } from '../src/features'
import { processConfig, isGloballyDisabled, windowsSpecificFeatures } from './../src/utils'

function init () {
    const processedConfig = processConfig($CONTENT_SCOPE$, $USER_UNPROTECTED_DOMAINS$, $USER_PREFERENCES$, windowsSpecificFeatures)
    if (isGloballyDisabled(processedConfig)) {
        return
    }

    contentScopeFeatures.load({
        platform: processedConfig.platform
    }, appFeatureNames)

    contentScopeFeatures.init(processedConfig)

    // Not supported:
    // contentScopeFeatures.update(message)
}

init()
