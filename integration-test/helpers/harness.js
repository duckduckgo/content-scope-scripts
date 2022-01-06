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
     * @param [port]
     * @returns {http.Server}
     */
    function setupServer (port) {
        const server = http.createServer(function (req, res) {
            const url = new URL(req.url, `http://${req.headers.host}`)
            const importUrl = new URL(import.meta.url)
            const dirname = importUrl.pathname.replace(/\/[^/]*$/, '')
            fs.readFile(path.join(dirname, '../pages', url.pathname), (err, data) => {
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

    return { browser, teardown, setupServer }
}
