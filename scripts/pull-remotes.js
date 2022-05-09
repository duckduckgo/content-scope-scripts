import fetch from 'node-fetch'
import { existsSync, readFileSync, writeFileSync } from 'fs'
const path = (p) => new URL(p, import.meta.url).pathname
const jsonPath = (platform) => path(`../unit-test/fixtures/remote/${platform}-config.json`)

const remotes = {
    extension: { url: 'https://staticcdn.duckduckgo.com/trackerblocking/config/v1/extension-config.json' },
    macos: { url: 'https://staticcdn.duckduckgo.com/trackerblocking/config/v1/macos-config.json' },
    ios: { url: 'https://staticcdn.duckduckgo.com/trackerblocking/config/v1/ios-config.json' },
    android: { url: 'https://staticcdn.duckduckgo.com/trackerblocking/config/v1/android-config.json' },
    windows: { url: 'https://staticcdn.duckduckgo.com/trackerblocking/config/v1/windows-config.json' }
}

/**
 * @param {typeof remotes} inputs
 * @returns {Promise<void>}
 */
async function fetchAll (inputs) {
    const results = JSON.parse(JSON.stringify(inputs))
    for (const [platform, value] of Object.entries(inputs)) {
        console.log('🌐 fetching ', value.url)
        results[platform].remote = (await fetch(value.url).then(x => x.json()))
    }
    return results
}

/**
 * @returns {Promise<Record<string, {url: string, remote: Record<string, any>}>>}
 */
export async function readAll () {
    const results = JSON.parse(JSON.stringify(remotes))
    for (const [platform] of Object.entries(remotes)) {
        const path = jsonPath(platform)
        if (!existsSync(path)) {
            throw new Error(`Could not read ${path}\n\tRun 'npm run fetch:remote' and then try again`)
        }
        results[platform].remote = JSON.parse(readFileSync(jsonPath(platform), 'utf8'))
    }
    return results
}

if (process.argv.includes('--css-write-to-disk')) {
    fetchAll(remotes).then(results => {
        for (const [platform, value] of Object.entries(results)) {
            const path = jsonPath(platform)
            writeFileSync(jsonPath(platform), JSON.stringify(value.remote, null, 2))
            console.log('✅️', path)
        }
    })
}
