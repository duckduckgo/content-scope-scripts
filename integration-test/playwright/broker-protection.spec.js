import { test } from '@playwright/test'
import { BrokerProtectionPage } from './page-objects/broker-protection.js'

test.describe.only('Broker Protection communications', () => {
    test('sends an error when the action is not found', async ({ page }, workerInfo) => {
        const dbp = BrokerProtectionPage.create(page, workerInfo)
        await dbp.enabled()
        await dbp.navigatesTo('form.html')
        await dbp.receivesAction('action-not-found.json')
        await dbp.waitForMessage('actionError')
    })

    test.describe('Executes invalid action and sends error message', () => {
        test('click element not on page', async ({ page }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo)
            await dbp.enabled()
            await dbp.navigatesTo('empty-form.html')
            await dbp.receivesAction('click.json')
            const response = await dbp.waitForMessage('actionCompleted')
            dbp.isErrorMessage(response)
        })
    })

    test.describe('Executes action and sends success message', () => {
        test('buildUrl', async ({ page }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo)
            await dbp.enabled()
            await dbp.navigatesTo('results.html')
            await dbp.receivesAction('navigate.json')
            const response = await dbp.waitForMessage('actionCompleted')
            dbp.isSuccessMessage(response)
            dbp.isUrlMatch(response[0].payload.params.result.success.response)
        })

        test('extract', async ({ page }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo)
            await dbp.enabled()
            await dbp.navigatesTo('results.html')
            await dbp.receivesAction('extract.json')
            const response = await dbp.waitForMessage('actionCompleted')
            dbp.isSuccessMessage(response)
            dbp.isExtractMatch(response[0].payload.params.result.success.response, {
                age: '38',
                name: 'John Smith',
                relatives: ['Cheryl Lamar'],
                addresses: [{ city: 'Chicago', state: 'IL' }, { city: 'Ypsilanti', state: 'MI' }, {
                    city: 'Cadillac',
                    state: 'MI'
                }],
                profileUrl: '/view/John-Smith-CyFdD.F'
            })
        })

        test('extract multiple profiles', async ({ page }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo)
            await dbp.enabled()
            await dbp.navigatesTo('results-multiple.html')
            await dbp.receivesAction('extract2.json')
            const response = await dbp.waitForMessage('actionCompleted')
            dbp.isSuccessMessage(response)
            dbp.isMultiple(response[0].payload.params.result.success.response)
            dbp.isExtractMatch(response[0].payload.params.result.success.response, {
                age: '40',
                name: 'Ben Smith'
            })
        })

        test('extract profiles test 3', async ({ page }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo)
            await dbp.enabled()
            await dbp.navigatesTo('results-alt.html')
            await dbp.receivesAction('extract3.json')
            const response = await dbp.waitForMessage('actionCompleted')
            dbp.isSuccessMessage(response)
            dbp.isExtractMatch(response[0].payload.params.result.success.response, {
                name: 'John A Smith',
                age: '63',
                alternativeNames: [
                    'Jonathan Smith',
                    'John Smithe'
                ],
                addresses: [
                    { city: 'Orlando', state: 'FL' },
                    { city: 'Plantation', state: 'FL' },
                    { city: 'Miami', state: 'FL' },
                    { city: 'More locations...4 more', state: 'addresses' }
                ],
                profileUrl: '/products/name?firstName=john&middleName=a&lastName=smith&ln=smith&city=orlando&state=fl&id=G421681744450237260'
            })
        })

        test('extract profiles test 4', async ({ page }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo)
            await dbp.enabled()
            await dbp.navigatesTo('results-4.html')
            await dbp.receivesAction('extract4.json')
            const response = await dbp.waitForMessage('actionCompleted')
            dbp.isSuccessMessage(response)
            dbp.isExtractMatch(response[0].payload.params.result.success.response,
                {
                    name: 'Ben Smith',
                    age: '55',
                    alternativeNames: null,
                    addresses: [
                        { city: 'Tampa', state: 'FL' }
                    ],
                    profileUrl: '/products/name?firstName=ben&lastName=smith&ln=smith&city=tampa&state=fl&id=G-3492284932683347509'
                })
        })

        test('extract profiles test 5', async ({ page }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo)
            await dbp.enabled()
            await dbp.navigatesTo('results-5.html')
            await dbp.receivesAction('extract5.json')
            const response = await dbp.waitForMessage('actionCompleted')
            dbp.isSuccessMessage(response)
            dbp.isExtractMatch(response[0].payload.params.result.success.response, {
                name: 'Jonathan Smith',
                age: '50',
                phoneNumbers: [
                    '97021405106'
                ],
                profileUrl: '/person/Smith-41043103849'
            })
        })

        test('extract profile from irregular HTML 1', async ({ page }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo)
            await dbp.enabled()
            await dbp.navigatesTo('results-irregular1.html')
            await dbp.receivesAction('extract-irregular1.json')
            const response = await dbp.waitForMessage('actionCompleted')
            dbp.isSuccessMessage(response)
            dbp.isExtractMatch(response[0].payload.params.result.success.response, {
                name: 'John M Smith',
                age: '75',
                alternativeNames: [
                    'John Smith',
                    'Johnmark Smith',
                    'John-Mark Smith',
                    'Johna Smith',
                    'John Mark',
                    'John Ark'
                ],
                addresses: [
                    { city: 'Chicago', state: 'IL' },
                    { city: 'Evanston', state: 'IL' }
                ],
                profileUrl: '/pp/John-Smith-HdDWHRBD'
            })
        })

        test('extract profile from irregular HTML 2', async ({ page }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo)
            await dbp.enabled()
            await dbp.navigatesTo('results-irregular2.html')
            await dbp.receivesAction('extract-irregular2.json')
            const response = await dbp.waitForMessage('actionCompleted')
            dbp.isSuccessMessage(response)
            dbp.isExtractMatch(response[0].payload.params.result.success.response, {
                name: 'John Smith',
                age: '71',
                addresses: [
                    { city: 'Crown Point', state: 'IN' },
                    { city: 'South Holland', state: 'IL' },
                    { city: 'Chicago', state: 'IL' }
                ],
                alternativeNames: null,
                relatives: [
                    'Joyce E Doyle',
                    'Brittany J Hoard',
                    'Jame...'
                ],
                profileUrl: '/find/person/p286nuu00u98lu9n0n96'
            })
        })

        test('extract profile from irregular HTML 3', async ({ page }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo)
            await dbp.enabled()
            await dbp.navigatesTo('results-irregular3.html')
            await dbp.receivesAction('extract-irregular3.json')
            const response = await dbp.waitForMessage('actionCompleted')
            dbp.isSuccessMessage(response)
            dbp.isExtractMatch(response[0].payload.params.result.success.response, {
                name: 'John I Smith',
                age: '59',
                addresses: [
                    { city: 'Chicago', state: 'IL' },
                    { city: 'River Forest', state: 'IL' },
                    { city: 'Forest Park', state: 'IL' },
                    { city: 'Oak Park', state: 'IL' }
                ],
                alternativeNames: null,
                relatives: [
                    'Ethel Makely',
                    'Alexander Makely, 48',
                    'Veronica Berrios, 47'
                ],
                profileUrl: '/people/John-Smith-AIGwGOFD'
            })
        })

        test('fillForm', async ({ page }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo)
            await dbp.enabled()
            await dbp.navigatesTo('form.html')
            await dbp.receivesAction('fill-form.json')
            const response = await dbp.waitForMessage('actionCompleted')
            dbp.isSuccessMessage(response)
            await dbp.isFormFilled()
        })

        test('click', async ({ page }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo)
            await dbp.enabled()
            await dbp.navigatesTo('form.html')
            await dbp.receivesAction('click.json')
            const response = await dbp.waitForMessage('actionCompleted')
            dbp.isSuccessMessage(response)
        })

        test('getCaptchaInfo', async ({ page }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo)
            await dbp.enabled()
            await dbp.navigatesTo('captcha.html')
            await dbp.receivesAction('get-captcha.json')
            const response = await dbp.waitForMessage('actionCompleted')
            dbp.isSuccessMessage(response)
            dbp.isCaptchaMatch(response[0].payload?.params.result.success.response)
        })

        test('remove query params from captcha url', async ({ page }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo)
            await dbp.enabled()
            await dbp.navigatesTo('captcha.html?fname=john&lname=smith')
            await dbp.receivesAction('get-captcha.json')
            const response = await dbp.waitForMessage('actionCompleted')
            dbp.isSuccessMessage(response)
            dbp.isQueryParamRemoved(response[0].payload?.params.result.success.response)
        })

        test('solveCaptcha', async ({ page }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo)
            await dbp.enabled()
            await dbp.navigatesTo('captcha.html')
            await dbp.receivesAction('solve-captcha.json')
            const response = await dbp.waitForMessage('actionCompleted')
            dbp.isSuccessMessage(response)
            await dbp.isCaptchaTokenFilled()
        })

        test('expectation', async ({ page }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo)
            await dbp.enabled()
            await dbp.navigatesTo('form.html')
            await dbp.receivesAction('expectation.json')
            const response = await dbp.waitForMessage('actionCompleted')
            dbp.isSuccessMessage(response)
        })
    })
})
