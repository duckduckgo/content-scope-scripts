import { dirname } from 'node:path'
import { mkdirSync, writeFileSync } from 'node:fs'
import minimist from 'minimist'

/**
 * A cross-platform 'mkdirp' + writing to disk
 * @param {string[]} filepaths
 * @param {string} content
 */
export function write (filepaths, content) {
    for (const filepath of filepaths.flat()) {
        try {
            const pathWithoutFile = dirname(filepath)
            mkdirSync(pathWithoutFile, { recursive: true })
        } catch (e) {
            // EEXIST is expected, for anything else re-throw
            if (e.code !== 'EEXIST') {
                throw e
            }
        }
        writeFileSync(filepath, content)
    }
}

export function camelcase (dashCaseText) {
    return dashCaseText.replace(/-(.)/g, (match, letter) => {
        return letter.toUpperCase()
    })
}

/**
 * Simple required args
 * @param {string[]} args - the input
 * @param {string[]} requiredFields - array of required keys
 * @param {string} [help] - optional help text
 */
export function parseArgs (args, requiredFields, help = '') {
    const parsedArgs = minimist(args)

    for (const field of requiredFields) {
        if (!(field in parsedArgs)) {
            console.error(`Missing required argument: --${field}`)
            if (help) console.log(help)
            process.exit(1)
        }
    }

    return parsedArgs
}

/**
 * Cross-platform absolute directory path for modules.
 *
 * On windows, 'pathname' has a leading `/` which needs removing
 */
export function cwd (current) {
    const pathname = new URL('.', current).pathname
    if (process.platform === 'win32') {
        return pathname.slice(1)
    }
    return pathname
}
