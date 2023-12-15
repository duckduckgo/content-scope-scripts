import { test } from '@playwright/test'
import { readdirSync, readFileSync } from 'fs'
import { BrokerProtectionPage } from './page-objects/broker-protection.js'
import { join } from 'node:path'

/**
 * @typedef {Record<string, any>} BrokerJSON - todo: update this!
 */

test.describe('dbp E2E testing', () => {
    test('selecting a JSON file', async ({ page, context }, workerInfo) => {
        // read from environment
        const { brokers, inputData } = fromEnv(workerInfo)

        // present the selection UI
        const { broker, data, results, pause } = await inputSelection(brokers, inputData, context)

        // execute actions
        const outputs = await execActions(broker, data, page, workerInfo)

        // PAUSE HERE to debug the page

        // show results page
        await results(JSON.stringify(outputs, null, 2))

        // pause on the results page.
        await pause()
    })
})

/**
 * @param {BrokerJSON} broker
 * @param {any} data
 * @param {import("playwright-core").Page} page
 * @param {import("@playwright/test").TestInfo} workerInfo
 */
async function execActions (broker, data, page, workerInfo) {
    await page.bringToFront()

    const dbp = BrokerProtectionPage.create(page, workerInfo)
    await dbp.enabled()
    const outputs = []

    for (const step of broker.steps) {
        // only 'scan' is currently working
        // todo: what else can we verify this way?
        if (step.stepType !== 'scan') {
            console.log('stepType not supported: ', step.stepType)
            continue
        }
        for (const action of step.actions) {
            const id = `${step.stepType} -> ${step.scanType} -> ${action.actionType}`
            if (action.actionType === 'navigate') {
                const response = await dbp.extractUrl(action, data)

                // const url = 'https://veripages.com/inner/profile/search?fname=John&lname=Cole&fage=41-50&state=fl&city=Miami'
                await page.goto(response, { waitUntil: 'networkidle' })
                const body = { action, data, response }
                outputs.push({ id, body })
                await workerInfo.attach(id, { body: JSON.stringify(body, null, 2), contentType: 'application/json' })
            } else {
                await dbp.simulateSubscriptionMessage('onActionReceived', { state: { action, data } })
                const response = await dbp.waitForMessage('actionCompleted')
                const body = { action, response: response[0]?.payload.params.result.success }
                outputs.push({ id, body })
                await workerInfo.attach(id, { body: JSON.stringify(body), contentType: 'application/json' })
            }
        }
    }
    return outputs
}

/**
 * @param {Map<string, { json: BrokerJSON, raw: string }>} brokers
 * @param {any} inputData
 * @param {import("playwright-core").BrowserContext} context
 */
async function inputSelection (brokers, inputData, context) {
    const p2 = await context.newPage()
    await p2.route('/dbp', (route) => {
        return route.fulfill({
            path: 'integration-test/playwright/dbp-selector.html'
        })
    })

    // the page will post to this
    await p2.route('/dbp-brokers', (route) => {
        return route.fulfill({
            json: {
                brokers: Object.fromEntries(brokers),
                data: inputData
            }
        })
    })

    // the page will call this to retrieve it's JSON
    await p2.route('/dbp-selector', (route) => {
        return route.fulfill({
            status: 301,
            headers: {
                location: '/dbp'
            }
        })
    })

    await p2.goto('/dbp')

    /**
     * Wait for the form submission
     */
    const formSubmission = await p2.waitForRequest(req => {
        const url = new URL(req.url())
        if (url.pathname === '/dbp-selector') {
            return true
        }
        return false
    }, { timeout: 0 })

    // convert to json
    const response = await formSubmission.postDataJSON()
    if (!('broker' in response)) throw new Error('expected broker in response')

    // match the selection to the correct broker
    const matched = brokers.get(response.broker)
    if (!matched) throw new Error(response.broker + ' not found')

    return {
        /** @type {BrokerJSON} */
        broker: matched.json,
        data: inputData,
        p2,
        async close () {
            await p2.close()
        },
        /**
         * @param {string|Buffer} anything
         */
        async results (anything) {
            await p2.route('/dbp-results', (route) => {
                return route.fulfill({
                    body: anything
                })
            })
            await p2.bringToFront()
            await p2.goto('/dbp-results')
        },
        async pause () {
            await p2.pause()
        }
    }
}

/**
 * TODO: think about how this can be both interactive + automatic.
 * @param {import("@playwright/test").WorkerInfo} workerInfo
 * @return {{ brokers: Map<string, { json: BrokerJSON, raw: string }>, inputData: any }}
 */
function fromEnv (workerInfo) {
    const env = /** @type {any} */(workerInfo.project.use).env

    if (typeof env.DBP_BROKER !== 'string') throw new Error('missing DBP_BROKER')
    if (typeof env.DBP_DATA !== 'string') throw new Error('missing DBP_DATA')

    const files = readdirSync(env.DBP_BROKER, { withFileTypes: true })
    const brokers = new Map()

    for (const file of files) {
        if (!file.isFile()) continue
        const full = join(env.DBP_BROKER, file.name)
        const content = readFileSync(full, 'utf8')
        const json = JSON.parse(content)
        brokers.set(file.name, { json, raw: content })
    }

    // parse the JSON, let these throw if anything fails
    const data = JSON.parse(readFileSync(env.DBP_DATA, 'utf8'))

    return { brokers, inputData: data }
}
