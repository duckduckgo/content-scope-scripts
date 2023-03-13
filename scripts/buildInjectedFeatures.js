import { rollupScript } from './utils/build.js'
import fs from 'fs/promises'

const injectedFeatures = [
    'runtimeChecks'
]

async function init () {
    for (const featureName of injectedFeatures) {
        const filename = featureName.replace(/([a-zA-Z])(?=[A-Z0-9])/g, '$1-').toLowerCase()
        const out = await rollupScript(`src/features/${filename}.js`, featureName)
        await fs.writeFile(`build/injected-features/${filename}.js`, out)
    }
}

init()
