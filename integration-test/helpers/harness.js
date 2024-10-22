import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import * as http from 'http'
import puppeteer from 'puppeteer'
import { spawnSync } from 'child_process'

jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000
if (process.env.KEEP_OPEN) {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000 * 1000
}

const DATA_DIR_PREFIX = 'ddg-temp-'

export async function setup (ops = {}) {
    const { withExtension = false } = ops
    const tmpDirPrefix = path.join(os.tmpdir(), DATA_DIR_PREFIX)
    const dataDir = fs.mkdtempSync(tmpDirPrefix)
    const args = [
        `--user-data-dir=${dataDir}`
    ]
    if (withExtension) {
        args.push('--disable-extensions-except=integration-test/extension')
        args.push('--load-extension=integration-test/extension')
    }

    // github actions
    if (process.env.CI) {
        args.push('--no-sandbox')
    }

    const puppeteerOps = {
        args,
        headless: false
    }

    const browser = await puppeteer.launch(puppeteerOps)
    const servers = []

    async function teardown () {
        if (process.env.KEEP_OPEN) {
            return new Promise((resolve) => {
                browser.on('disconnected', async () => {
                    await teardownInternal()
                    // @ts-expect-error - error TS2810: Expected 1 argument, but got 0. 'new Promise()'
                    resolve()
                })
            })
        } else {
            await teardownInternal()
        }
    }

    async function teardownInternal () {
        await Promise.all(servers.map(server => server.close()))
        await browser.close()

        // necessary so e.g. local storage
        // doesn't carry over between test runs
        spawnSync('rm', ['-rf', dataDir])
    }

    /**
     * @param {number|string} [port]
     * @returns {http.Server}
     */
    function setupServer (port) {
        return _startupServerInternal('../pages', port)
    }

    /**
     * @param {number|string} [port]
     * @returns {http.Server}
     */
    function setupIntegrationPagesServer (port) {
        return _startupServerInternal('../test-pages', port)
    }

    /**
     * @param {string} pathName
     * @param {number|string} [port]
     * @returns {http.Server}
     */
    function _startupServerInternal (pathName, port) {
        const server = http.createServer(function (req, res) {
            // @ts-expect-error - error TS2345: Argument of type 'string | undefined' is not assignable to parameter of type 'string | URL'.
            const url = new URL(req.url, `http://${req.headers.host}`)
            const importUrl = new URL(import.meta.url)
            const dirname = importUrl.pathname.replace(/\/[^/]*$/, '')
            const pathname = path.join(dirname, pathName, url.pathname)

            fs.readFile(pathname, (err, data) => {
                if (err) {
                    res.writeHead(404)
                    res.end(JSON.stringify(err))
                    return
                }
                res.writeHead(200)
                res.end(data)
            })
        }).listen(port)
        servers.push(server)
        return server
    }

    /**
     * A wrapper around page.goto() that supports sending additional
     * arguments to content-scope's init methods + waits for a known
     * indicators to avoid race conditions
     *
     * @param {import("puppeteer").Page} page
     * @param {string} urlString
     * @param {Record<string, any>} [args]
     * @returns {Promise<void>}
     */
    async function gotoAndWait (page, urlString, args = {}, evalBeforeInit = null) {
        const url = new URL(urlString)

        // Append the flag so that the script knows to wait for incoming args.
        url.searchParams.append('wait-for-init-args', 'true')

        await page.goto(url.href)

        // wait until contentScopeFeatures.load() has completed
        await page.waitForFunction(() => {
            // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
            return window.__content_scope_status === 'loaded'
        })

        if (evalBeforeInit) {
            await page.evaluate(evalBeforeInit)
        }

        const evalString = `
            const detail = ${JSON.stringify(args)}
            const evt = new CustomEvent('content-scope-init-args', { detail })
            document.dispatchEvent(evt)
        `
        await page.evaluate(evalString)

        // wait until contentScopeFeatures.init(args) has completed
        await page.waitForFunction(() => {
            window.dispatchEvent(new Event('content-scope-init-complete'))
            // @ts-expect-error https://app.asana.com/0/1201614831475344/1203979574128023/f
            return window.__content_scope_status === 'initialized'
        })
    }

    return { browser, teardown, setupServer, setupIntegrationPagesServer, gotoAndWait }
}
