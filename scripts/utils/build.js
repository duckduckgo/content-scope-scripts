import * as rollup from 'rollup'
import commonjs from '@rollup/plugin-commonjs'
import replace from '@rollup/plugin-replace'
import resolve from '@rollup/plugin-node-resolve'
import { runtimeInjected, platformSupport } from '../../src/features.js'

/**
 * This is a helper function to require all files in a directory
 */
async function getAllFeatureCode (pathName) {
    const fileContents = {}
    for (const featureName of runtimeInjected) {
        const fileName = getFileName(featureName)
        const fullPath = `${pathName}/${fileName}.js`
        const code = await rollupScript({
            scriptPath: fullPath,
            name: featureName,
            supportsMozProxies: false
        })
        fileContents[featureName] = code
    }
    return fileContents
}

/**
 * Allows importing of all features into a custom runtimeInjects export
 * @returns {import('rollup').Plugin}
 */
function runtimeInjections () {
    const customId = 'ddg:runtimeInjects'
    return {
        name: customId,
        resolveId (id) {
            if (id === customId) {
                return id
            }
            return null
        },
        async load (id) {
            if (id === customId) {
                const code = await getAllFeatureCode('src/features')
                return `export default ${JSON.stringify(code, undefined, 4)}`
            }
            return null
        }
    }
}

function prefixPlugin (prefixMessage) {
    return {
        name: 'prefix-plugin',
        renderChunk (code) {
            return `${prefixMessage}\n${code}`
        }
    }
}

const prefixMessage = '/*! © DuckDuckGo ContentScopeScripts protections https://github.com/duckduckgo/content-scope-scripts/ */'

/**
 * @param {object} params
 * @param {string} params.scriptPath
 * @param {string} [params.platform]
 * @param {string[]} [params.featureNames]
 * @param {string} [params.name]
 * @param {boolean} [params.supportsMozProxies]
 * @return {Promise<string>}
 */
export async function rollupScript (params) {
    const {
        scriptPath,
        platform,
        name,
        featureNames,
        supportsMozProxies = false
    } = params

    // The code is using a global, that we define here which means once tree shaken we get a browser specific output.
    const mozProxies = supportsMozProxies

    const plugins = [
        runtimeInjections(),
        resolve(),
        commonjs(),
        replace({
            preventAssignment: true,
            values: {
                // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
                mozProxies,
                'import.meta.injectName': JSON.stringify(platform)
            }
        }),
        prefixPlugin(prefixMessage)
    ]

    // if 'platform' was provided, ensure we include the dyn
    if (platform) {
        plugins.unshift(loadFeatures(platform, featureNames))
    }

    const bundle = await rollup.rollup({
        input: scriptPath,
        plugins
    })

    const generated = await bundle.generate({
        dir: 'build',
        format: 'iife',
        inlineDynamicImports: true,
        name,
        // This if for seedrandom causing build issues
        globals: { crypto: 'undefined' }
    })

    return generated.output[0].code
}

/**
 * Include the features required on each platform
 *
 * @param {string} platform
 * @param {string[]} featureNames
 */
function loadFeatures (platform, featureNames = platformSupport[platform]) {
    const pluginId = 'ddg:platformFeatures'
    return {
        name: pluginId,
        resolveId (id) {
            if (id === pluginId) return id
            return null
        },
        load (id) {
            if (id !== pluginId) return null

            // convert a list of feature names to
            const imports = featureNames.map((featureName) => {
                const fileName = getFileName(featureName)
                const path = `./src/features/${fileName}.js`
                const ident = `ddg_feature_${featureName}`
                return {
                    ident,
                    importPath: path
                }
            })

            const importString = imports.map(imp => `import ${imp.ident} from ${JSON.stringify(imp.importPath)}`)
                .join(';\n')

            const exportsString = imports.map(imp => `${imp.ident}`)
                .join(',\n    ')

            const exportString = `export default {\n    ${exportsString}\n}`

            return [importString, exportString].join('\n')
        }
    }
}

/**
 * Convert `featureName` to `feature-name`
 *
 * @param {string} featureName
 * @return {string}
 */
function getFileName (featureName) {
    return featureName.replace(/([a-zA-Z])(?=[A-Z0-9])/g, '$1-').toLowerCase()
}
