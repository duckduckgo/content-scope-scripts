import * as rollup from 'rollup'
import commonjs from '@rollup/plugin-commonjs'
import replace from '@rollup/plugin-replace'
import resolve from '@rollup/plugin-node-resolve'
import dynamicImportVariables from 'rollup-plugin-dynamic-import-variables'
import { promises as fs } from 'fs'

/**
 * This is a helper function to require all files in a directory
 */
async function getAllFiles (pathName) {
    const dirContents = await fs.readdir(pathName, { encoding: 'utf8', withFileTypes: true })
    const fileContents = {}
    for (const file of dirContents) {
        const fileName = file.name
        if (!file.isFile()) { continue }
        const fullPath = `${pathName}/${fileName}`
        const code = await rollupScript(fullPath, 'runtimeChecks', false)
        const featureName = fileName.replace(/[.]js$/, '').replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase())
        fileContents[featureName] = code
    }
    return fileContents
}

/**
 * Allows importing of all features into a custom runtimeInjects export
 * @returns {Record<String, String>}
 */
function runtimeInjections () {
    const customId = 'custom:runtimeInjects'
    return {
        name: customId,
        resolveId (id) {
            if (id === customId) {
                return id
            }
        },
        async load (id) {
            if (id === customId) {
                const code = await getAllFiles('src/features')
                return `export default ${JSON.stringify(code, undefined, 4)}`
            }
        }
    }
}

export async function rollupScript (scriptPath, name, supportsMozProxies = true) {
    let mozProxies = false
    // The code is using a global, that we define here which means once tree shaken we get a browser specific output.
    if (process.argv[2] === 'firefox' && supportsMozProxies) {
        mozProxies = true
    }
    const inputOptions = {
        input: scriptPath,
        plugins: [
            runtimeInjections(),
            resolve(),
            dynamicImportVariables({}),
            commonjs(),
            replace({
                preventAssignment: true,
                values: {
                    // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
                    mozProxies
                }
            })
        ]
    }
    const outputOptions = {
        dir: 'build',
        format: 'iife',
        inlineDynamicImports: true,
        name,
        // This if for seedrandom causing build issues
        globals: { crypto: 'undefined' }
    }

    const bundle = await rollup.rollup(inputOptions)
    // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
    const generated = await bundle.generate(outputOptions)
    return generated.output[0].code
}
