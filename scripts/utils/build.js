import { runtimeInjected, platformSupport } from '../../src/features.js'
import { readFileSync } from 'fs'
import { cwd } from '../script-utils.js'
import { join } from 'path'
import * as esbuild from 'esbuild'
const ROOT = join(cwd(import.meta.url), '..', '..')
const contentScopePath = 'src/content-scope-features.js'
const contentScopeName = 'contentScopeFeatures'
const DEBUG = false

/**
 * This is a helper function to require all files in a directory
 * @param {string} pathName
 * @param {string} platform
 */
async function getAllFeatureCode (pathName, platform) {
    const fileContents = {}
    for (const featureName of runtimeInjected) {
        const fileName = getFileName(featureName)
        const fullPath = `${pathName}/${fileName}.js`
        const code = await bundle({
            scriptPath: fullPath,
            name: featureName,
            supportsMozProxies: false,
            platform
        })
        fileContents[featureName] = code
    }
    return fileContents
}

/**
 * Allows importing of all features into a custom runtimeInjects export
 * @param {string} platform
 * @returns {import('esbuild').Plugin}
 */
function runtimeInjections (platform) {
    const customId = 'ddg:runtimeInjects'
    return {
        name: customId,
        setup (build) {
            build.onResolve({ filter: new RegExp(customId) }, async (args) => {
                return {
                    path: args.path,
                    namespace: customId
                }
            })
            build.onLoad({ filter: /.*/, namespace: customId }, async () => {
                if (platform === 'firefox') {
                    const code = await getAllFeatureCode('src/features', platform)
                    return {
                        loader: 'js',
                        contents: `export default ${JSON.stringify(code, undefined, 4)}`
                    }
                }
                // do nothing on other platforms
                return {
                    loader: 'js',
                    contents: 'export default {}'
                }
            })
        }
    }
}

const prefixMessage = '/*! © DuckDuckGo ContentScopeScripts protections https://github.com/duckduckgo/content-scope-scripts/ */'

/**
 * @param {object} params
 * @param {string} params.scriptPath
 * @param {string} params.platform
 * @param {string[]} [params.featureNames]
 * @param {string} [params.name]
 * @param {boolean} [params.supportsMozProxies]
 * @return {Promise<string>}
 */
export async function bundle (params) {
    const {
        scriptPath,
        platform,
        name,
        featureNames,
        supportsMozProxies = false
    } = params

    const extensions = ['firefox', 'chrome', 'chrome-mv3']
    const isExtension = extensions.includes(platform)
    let trackerLookup = '$TRACKER_LOOKUP$'
    if (!isExtension) {
        const trackerLookupData = readFileSync('./build/tracker-lookup.json', 'utf8')
        trackerLookup = trackerLookupData
    }
    const suffixMessage = platform === 'firefox' ? `/*# sourceURL=duckduckgo-privacy-protection.js?scope=${name} */` : ''
    const loadFeaturesPlugin = loadFeatures(platform, featureNames)
    const runtimeInjectionsPlugin = runtimeInjections(platform)
    // The code is using a global, that we define here which means once tree shaken we get a browser specific output.
    const mozProxies = supportsMozProxies

    /** @type {import("esbuild").BuildOptions} */
    const buildOptions = {
        entryPoints: [scriptPath],
        write: false,
        outdir: 'build',
        bundle: true,
        metafile: true,
        globalName: name,
        loader: {
            '.css': 'text',
            '.svg': 'text'
        },
        define: {
            mozProxies: String(mozProxies),
            'import.meta.env': 'development',
            'import.meta.injectName': JSON.stringify(platform),
            'import.meta.trackerLookup': trackerLookup
        },
        plugins: [loadFeaturesPlugin, runtimeInjectionsPlugin, contentFeaturesAsString(platform)],
        footer: {
            js: suffixMessage
        },
        banner: {
            js: prefixMessage
        }
    }

    const result = await esbuild.build(buildOptions)

    if (result.metafile && DEBUG) {
        console.log(await esbuild.analyzeMetafile(result.metafile))
    }

    if (result.errors.length === 0 && result.outputFiles) {
        return result.outputFiles[0].text || ''
    } else {
        console.log(result.errors)
        console.log(result.warnings)
        throw new Error('could not continue')
    }
}

/**
 * Include the features required on each platform
 *
 * @param {string} platform
 * @param {string[]} featureNames
 * @returns {import("esbuild").Plugin}
 */
function loadFeatures (platform, featureNames = platformSupport[platform]) {
    const pluginId = 'ddg:platformFeatures'
    return {
        /**
         * Load all platform features based on current
         */
        name: 'ddg:platformFeatures',
        setup (build) {
            build.onResolve({ filter: new RegExp(pluginId) }, async (args) => {
                return {
                    path: args.path,
                    namespace: pluginId
                }
            })
            build.onLoad({ filter: /.*/, namespace: pluginId }, async () => {
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

                return {
                    loader: 'js',
                    resolveDir: ROOT,
                    contents: [importString, exportString].join('\n')
                }
            })
        }
    }
}

/**
 * @param {string} platform
 * @return {import("esbuild").Plugin}
 */
function contentFeaturesAsString (platform) {
    const pluginId = 'ddg:contentScopeFeatures'
    return {
        /**
         * Load all platform features based on current
         */
        name: pluginId,
        setup (build) {
            build.onResolve({ filter: new RegExp(pluginId) }, async (args) => {
                return {
                    path: args.path,
                    namespace: pluginId
                }
            })
            build.onLoad({ filter: /.*/, namespace: pluginId }, async () => {
                const result = await bundle({
                    scriptPath: contentScopePath,
                    name: contentScopeName,
                    platform
                })

                const encodedString = result.replace(/\r\n/g, '\n')

                return {
                    loader: 'text',
                    resolveDir: ROOT,
                    contents: encodedString
                }
            })
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
