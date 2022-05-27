import fetch from 'node-fetch'
import fs from 'fs'

const bundlePath = './shared/'
const etags = {}

async function getConfig (name, url) {
    const response = await fetch(url)
    if (!response.ok) {
        throw new Error(`Failed to load tds list ${name}: ${url}`)
    }
    etags[`${name}-etag`] = response.headers.get('etag')
    const fileText = await response.text()
    // Will throw if invalid JSON
    const data = JSON.parse(fileText)
    const code = `
/* eslint-disable quote-props */
/* eslint-disable quotes */
/* eslint-disable indent */
/* eslint-disable eol-last */
/* eslint-disable no-trailing-spaces */
/* eslint-disable no-multiple-empty-lines */
    export const exceptions = ${JSON.stringify(data.features.cookie.exceptions, undefined, 2)}
    export const excludedCookieDomains = ${JSON.stringify(data.features.cookie.settings.excludedCookieDomains, undefined, 2)}
    `
    fs.writeFileSync(`${bundlePath}/cookieExceptions.js`, code)
}

async function fetchConfigs () {
    await getConfig('config', 'https://staticcdn.duckduckgo.com/trackerblocking/config/v2/extension-config.json')
    console.log('Config imported successfully')
}

fetchConfigs()
