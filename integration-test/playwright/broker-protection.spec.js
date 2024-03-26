import { test } from '@playwright/test'
import { BrokerProtectionPage } from './page-objects/broker-protection.js'

test.describe('Broker Protection communications', () => {
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

    test.describe('Profile extraction', () => {
        test('extract', async ({ page, baseURL }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo)
            await dbp.enabled()
            await dbp.navigatesTo('results.html')
            await dbp.receivesAction('extract.json')
            const response = await dbp.waitForMessage('actionCompleted')
            dbp.isSuccessMessage(response)
            dbp.isExtractMatch(response[0].payload.params.result.success.response, [{
                name: 'John Smith',
                alternativeNames: [],
                age: '38',
                addresses: [
                    { city: 'Chicago', state: 'IL' },
                    { city: 'Ypsilanti', state: 'MI' },
                    { city: 'Cadillac', state: 'MI' }
                ],
                phoneNumbers: [],
                relatives: [
                    'Cheryl Lamar'
                ],
                profileUrl: baseURL + 'view/John-Smith-CyFdD.F',
                identifier: baseURL + 'view/John-Smith-CyFdD.F'
            }])
            dbp.responseContainsMetadata(response[0].payload.params.result.success.meta)
        })
        test('extract with retry', async ({ page, baseURL }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo)
            await dbp.enabled()
            await dbp.navigatesTo('results.html?delay=2000')
            await dbp.receivesAction('extract.json')
            const response = await dbp.waitForMessage('actionCompleted')
            dbp.isSuccessMessage(response)
            dbp.isExtractMatch(response[0].payload.params.result.success.response, [{
                name: 'John Smith',
                alternativeNames: [],
                age: '38',
                addresses: [
                    { city: 'Chicago', state: 'IL' },
                    { city: 'Ypsilanti', state: 'MI' },
                    { city: 'Cadillac', state: 'MI' }
                ],
                phoneNumbers: [],
                relatives: [
                    'Cheryl Lamar'
                ],
                profileUrl: baseURL + 'view/John-Smith-CyFdD.F',
                identifier: baseURL + 'view/John-Smith-CyFdD.F'
            }])
            dbp.responseContainsMetadata(response[0].payload.params.result.success.meta)
        })

        test('extract multiple profiles', async ({ page, baseURL }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo)
            await dbp.enabled()
            await dbp.navigatesTo('results-multiple.html')
            await dbp.receivesAction('extract2.json')
            const response = await dbp.waitForMessage('actionCompleted')
            dbp.isSuccessMessage(response)
            dbp.isExtractMatch(response[0].payload.params.result.success.response, [
                {
                    name: 'Ben Smith',
                    alternativeNames: [
                        'Ben S Smith'
                    ],
                    age: '40',
                    addresses: [
                        { city: 'Miami', state: 'FL' },
                        { city: 'Miami Gardens', state: 'FL' },
                        { city: 'Opa Locka', state: 'FL' }
                    ],
                    phoneNumbers: [],
                    relatives: [],
                    profileUrl: baseURL + 'view/Ben-Smith-CQEmF3CB',
                    identifier: baseURL + 'view/Ben-Smith-CQEmF3CB'
                },
                {
                    name: 'Ben Smith',
                    alternativeNames: [],
                    age: '40',
                    addresses: [
                        { city: 'Miami', state: 'FL' }
                    ],
                    phoneNumbers: [],
                    relatives: [],
                    profileUrl: baseURL + 'view/Ben-Smith-DSAJBtFB',
                    identifier: baseURL + 'view/Ben-Smith-DSAJBtFB'
                },
                {
                    name: 'Benjamin H Smith',
                    alternativeNames: [
                        'Benjamin Smith',
                        'Ben Smith',
                        'Bejamin Smith'
                    ],
                    age: '39',
                    addresses: [
                        {
                            city: 'Fort Lauderdale',
                            state: 'FL'
                        },
                        {
                            city: 'Miami',
                            state: 'FL'
                        },
                        {
                            city: 'Indianapolis',
                            state: 'IN'
                        }
                    ],
                    phoneNumbers: [],
                    relatives: [],
                    profileUrl: baseURL + 'view/Benjamin-Smith-GpC.DQCB',
                    identifier: baseURL + 'view/Benjamin-Smith-GpC.DQCB'
                }
            ])
        })

        test('extract profiles test 3', async ({ page, baseURL }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo)
            await dbp.enabled()
            await dbp.navigatesTo('results-alt.html')
            await dbp.receivesAction('extract3.json')
            const response = await dbp.waitForMessage('actionCompleted')
            dbp.isSuccessMessage(response)
            dbp.isExtractMatch(response[0].payload.params.result.success.response, [{
                name: 'John A Smith',
                age: '63',
                alternativeNames: [
                    'Jonathan Smith',
                    'John Smithe'
                ],
                addresses: [
                    { city: 'Orlando', state: 'FL' },
                    { city: 'Plantation', state: 'FL' },
                    { city: 'Miami', state: 'FL' }
                ],
                profileUrl: baseURL + 'products/name?firstName=john&middleName=a&lastName=smith&ln=smith&city=orlando&state=fl&id=G421681744450237260',
                identifier: baseURL + 'products/name?firstName=john&middleName=a&lastName=smith&ln=smith&city=orlando&state=fl&id=G421681744450237260',
                phoneNumbers: [],
                relatives: []
            }])
        })

        test('extract profiles test 4', async ({ page, baseURL }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo)
            await dbp.enabled()
            await dbp.navigatesTo('results-4.html')
            await dbp.receivesAction('extract4.json')
            const response = await dbp.waitForMessage('actionCompleted')
            dbp.isSuccessMessage(response)
            dbp.isExtractMatch(response[0].payload.params.result.success.response, [{
                name: 'Ben Smith',
                age: '55',
                alternativeNames: [],
                addresses: [
                    { city: 'Tampa', state: 'FL' }
                ],
                profileUrl: baseURL + 'products/name?firstName=ben&lastName=smith&ln=smith&city=tampa&state=fl&id=G-3492284932683347509',
                identifier: baseURL + 'products/name?firstName=ben&lastName=smith&ln=smith&city=tampa&state=fl&id=G-3492284932683347509',
                phoneNumbers: [],
                relatives: []
            }])
        })

        test('extract profiles test 5', async ({ page, baseURL }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo)
            await dbp.enabled()
            await dbp.navigatesTo('results-5.html')
            await dbp.receivesAction('extract5.json')
            const response = await dbp.waitForMessage('actionCompleted')
            dbp.isSuccessMessage(response)
            dbp.isExtractMatch(response[0].payload.params.result.success.response, [{
                name: 'Jonathan Smith',
                age: '50',
                alternativeNames: [],
                phoneNumbers: [
                    '97021405106'
                ],
                profileUrl: baseURL + 'person/Smith-41043103849',
                identifier: baseURL + 'person/Smith-41043103849',
                addresses: [
                    {
                        city: 'Orlando',
                        state: 'FL'
                    }
                ],
                relatives: []
            }])
        })

        test('extract profile from irregular HTML 1', async ({ page, baseURL }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo)
            await dbp.enabled()
            await dbp.navigatesTo('results-irregular1.html')
            await dbp.receivesAction('extract-irregular1.json')
            const response = await dbp.waitForMessage('actionCompleted')
            dbp.isSuccessMessage(response)
            dbp.isExtractMatch(response[0].payload.params.result.success.response, [{
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
                profileUrl: baseURL + 'pp/John-Smith-HdDWHRBD',
                identifier: baseURL + 'pp/John-Smith-HdDWHRBD',
                relatives: [
                    'Margaret Kelly',
                    'Mary Kelly',
                    'Michael Kelly'
                ],
                phoneNumbers: []
            }])
        })

        test('extract profile from irregular HTML 2', async ({ page, baseURL }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo)
            await dbp.enabled()
            await dbp.navigatesTo('results-irregular2.html')
            await dbp.receivesAction('extract-irregular2.json')
            const response = await dbp.waitForMessage('actionCompleted')
            dbp.isSuccessMessage(response)
            dbp.isExtractMatch(response[0].payload.params.result.success.response, [{
                name: 'John Smith',
                age: '71',
                addresses: [
                    { city: 'Crown Point', state: 'IN' },
                    { city: 'South Holland', state: 'IL' },
                    { city: 'Chicago', state: 'IL' }
                ],
                alternativeNames: [],
                relatives: [
                    'Joyce E Doyle',
                    'Brittany J Hoard',
                    'Jame...'
                ],
                profileUrl: baseURL + 'find/person/p286nuu00u98lu9n0n96',
                identifier: baseURL + 'find/person/p286nuu00u98lu9n0n96',
                phoneNumbers: []
            }])
        })

        test('extract profile from irregular HTML 3', async ({ page, baseURL }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo)
            await dbp.enabled()
            await dbp.navigatesTo('results-irregular3.html')
            await dbp.receivesAction('extract-irregular3.json')
            const response = await dbp.waitForMessage('actionCompleted')
            dbp.isSuccessMessage(response)
            dbp.isExtractMatch(response[0].payload.params.result.success.response, [{
                name: 'John I Smith',
                age: '59',
                addresses: [
                    { city: 'Chicago', state: 'IL' },
                    { city: 'River Forest', state: 'IL' },
                    { city: 'Forest Park', state: 'IL' },
                    { city: 'Oak Park', state: 'IL' }
                ],
                alternativeNames: [
                    'John Smith',
                    'Johni Smith',
                    'John Farmersmith'
                ],
                phoneNumbers: [],
                relatives: [
                    'Ethel Makely',
                    'Alexander Makely',
                    'Veronica Berrios'
                ],
                profileUrl: baseURL + 'people/John-Smith-AIGwGOFD',
                identifier: baseURL + 'people/John-Smith-AIGwGOFD'
            }])
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

        test('clicking with parent selector (considering matching weight/score)', async ({ page }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo)
            await dbp.enabled()
            await dbp.navigatesTo('results-weighted.html')
            await dbp.receivesAction('click-weighted.json')
            const response = await dbp.waitForMessage('actionCompleted')

            dbp.isSuccessMessage(response)
            await page.waitForURL(url => url.hash === '#2', { timeout: 2000 })
        })

        test('clicking with parent selector (clicking the actual parent)', async ({ page }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo)
            await dbp.enabled()
            await dbp.navigatesTo('results-parent.html')
            await dbp.receivesAction('click-parent.json')
            const response = await dbp.waitForMessage('actionCompleted')

            dbp.isSuccessMessage(response)
            await page.waitForURL(url => url.hash === '#2', { timeout: 2000 })
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

        test('getCaptchaInfo (hcaptcha)', async ({ page }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo)
            await dbp.enabled()
            await dbp.navigatesTo('captcha2.html')
            await dbp.receivesAction('get-captcha.json')
            const response = await dbp.waitForMessage('actionCompleted')
            dbp.isSuccessMessage(response)
            dbp.isHCaptchaMatch(response[0].payload?.params.result.success.response)
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

        test('expectation: element exists', async ({ page }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo)
            await dbp.enabled()
            await dbp.navigatesTo('form.html')

            // control: ensure the element is absent
            await dbp.elementIsAbsent('.slow-element')

            // now send in the action
            await dbp.receivesInlineAction({
                state: {
                    action: {
                        actionType: 'expectation',
                        id: 'test-expectation',
                        expectations: [
                            {
                                type: 'element-exists',
                                selector: '.slow-element',
                                parent: 'body.delay-complete'
                            }
                        ]
                    }
                }
            })

            const response = await dbp.waitForMessage('actionCompleted')
            dbp.isSuccessMessage(response)
        })
    })

    test.describe('retrying', () => {
        test('retrying a click', async ({ page }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo)
            await dbp.enabled()
            await dbp.navigatesTo('retry.html')

            await dbp.simulateSubscriptionMessage('onActionReceived', {
                state: {
                    action: {
                        actionType: 'click',
                        id: '5',
                        retry: {
                            environment: 'web',
                            maxAttempts: 10,
                            interval: { ms: 1000 }
                        },
                        elements: [
                            {
                                type: 'button',
                                selector: 'button'
                            }
                        ]
                    }
                }
            })

            await page.getByRole('heading', { name: 'Retry' }).waitFor({ timeout: 5000 })

            const response = await dbp.waitForMessage('actionCompleted')
            dbp.isSuccessMessage(response)
        })
        test('ensuring retry doesnt apply everywhere', async ({ page }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo)
            await dbp.enabled()
            await dbp.navigatesTo('retry.html')

            await dbp.simulateSubscriptionMessage('onActionReceived', {
                state: {
                    action: {
                        actionType: 'click',
                        id: '5',
                        elements: [
                            {
                                type: 'button',
                                selector: 'button'
                            }
                        ]
                    }
                }
            })

            const response = await dbp.waitForMessage('actionCompleted')
            dbp.isErrorMessage(response)
        })
    })
})
