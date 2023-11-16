import { test } from '@playwright/test'
import { readFileSync } from 'fs'
import { BrokerProtectionPage } from './page-objects/brocker-protection.js'

test.describe('dbp E2E testing', () => {
    test('from JSON files', async ({ page }, workerInfo) => {
        const dbp = BrokerProtectionPage.create(page, workerInfo)
        await dbp.enabled()

        const env = /** @type {any} */(workerInfo.project.use).env

        if (typeof env.DBP_BROKER !== 'string') throw new Error('missing DBP_BROKER')
        if (typeof env.DBP_DATA !== 'string') throw new Error('missing DBP_DATA')

        // parse the JSON, let these throw if anything fails
        const broker = JSON.parse(readFileSync(env.DBP_BROKER, 'utf8'))
        const data = JSON.parse(readFileSync(env.DBP_DATA, 'utf8'))

        for (const step of broker.steps) {
            // only 'scan' is currently working
            // todo: what else can we verify this way?
            if (step.stepType !== 'scan') {
                console.log('stepType not supported: ', step.stepType)
                continue
            }
            for (const action of step.actions) {
                if (action.actionType === 'navigate') {
                    const url = await dbp.extractUrl(action, data)
                    await page.goto(url)
                } else {
                    await dbp.simulateSubscriptionMessage('onActionReceived', { state: { action, data } })
                    const response = await dbp.waitForMessage('actionCompleted')
                    console.log(JSON.stringify(response[0].payload.params, null, 2))
                }
            }
        }
    })
})
