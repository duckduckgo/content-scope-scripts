import { test as base, expect } from '@playwright/test';
import { BrokerProtectionPage } from '../page-objects/broker-protection.js';
import { BROKER_PROTECTION_CONFIGS } from './tests-config.js';
import { createConfiguredDbpTest } from './fixtures.js';

const test = createConfiguredDbpTest(base);

test.describe('Broker Protection communications', () => {
    test('sends an error when the action is not found', async ({ page }, workerInfo) => {
        const dbp = BrokerProtectionPage.create(page, workerInfo.project.use);
        await dbp.enabled();
        await dbp.navigatesTo('form.html');
        await dbp.receivesAction('action-not-found.json');
        await dbp.collector.waitForMessage('actionError');
    });

    test.describe('Executes invalid action and sends error message', () => {
        test('click element not on page', async ({ page }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo.project.use);
            await dbp.enabled();
            await dbp.navigatesTo('empty-form.html');
            await dbp.receivesAction('click.json');
            const response = await dbp.collector.waitForMessage('actionCompleted');
            dbp.isErrorMessage(response);
        });
    });

    test.describe('Profile extraction', () => {
        test('extract', async ({ page, baseURL }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo.project.use);
            await dbp.enabled();
            await dbp.navigatesTo('results.html');
            await dbp.receivesAction('extract.json');
            const response = await dbp.collector.waitForMessage('actionCompleted');
            dbp.isSuccessMessage(response);
            dbp.isExtractMatch(response[0].payload.params.result.success.response, [
                {
                    name: 'John Smith',
                    alternativeNames: [],
                    age: '38',
                    addresses: [
                        { city: 'Chicago', state: 'IL' },
                        { city: 'Cadillac', state: 'MI' },
                        { city: 'Ypsilanti', state: 'MI' },
                    ],
                    phoneNumbers: [],
                    relatives: ['Cheryl Lamar'],
                    profileUrl: baseURL + 'view/John-Smith-CyFdD.F',
                    identifier: baseURL + 'view/John-Smith-CyFdD.F',
                },
            ]);
            dbp.responseContainsMetadata(response[0].payload.params.result.success.meta);
        });
        test('extract with retry', async ({ page, baseURL }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo.project.use);
            await dbp.enabled();
            await dbp.navigatesTo('results.html?delay=2000');
            await dbp.receivesAction('extract.json');
            const response = await dbp.collector.waitForMessage('actionCompleted');
            dbp.isSuccessMessage(response);
            dbp.isExtractMatch(response[0].payload.params.result.success.response, [
                {
                    name: 'John Smith',
                    alternativeNames: [],
                    age: '38',
                    addresses: [
                        { city: 'Chicago', state: 'IL' },
                        { city: 'Cadillac', state: 'MI' },
                        { city: 'Ypsilanti', state: 'MI' },
                    ],
                    phoneNumbers: [],
                    relatives: ['Cheryl Lamar'],
                    profileUrl: baseURL + 'view/John-Smith-CyFdD.F',
                    identifier: baseURL + 'view/John-Smith-CyFdD.F',
                },
            ]);
            dbp.responseContainsMetadata(response[0].payload.params.result.success.meta);
        });

        test('extract multiple profiles', async ({ page, baseURL }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo.project.use);
            await dbp.enabled();
            await dbp.navigatesTo('results-multiple.html');
            await dbp.receivesAction('extract2.json');
            const response = await dbp.collector.waitForMessage('actionCompleted');
            dbp.isSuccessMessage(response);
            dbp.isExtractMatch(response[0].payload.params.result.success.response, [
                {
                    name: 'Ben Smith',
                    alternativeNames: ['Ben S Smith'],
                    age: '40',
                    addresses: [
                        { city: 'Miami', state: 'FL' },
                        { city: 'Miami Gardens', state: 'FL' },
                        { city: 'Opa Locka', state: 'FL' },
                    ],
                    phoneNumbers: [],
                    relatives: [],
                    profileUrl: baseURL + 'view/Ben-Smith-CQEmF3CB',
                    identifier: baseURL + 'view/Ben-Smith-CQEmF3CB',
                },
                {
                    name: 'Ben Smith',
                    alternativeNames: [],
                    age: '40',
                    addresses: [{ city: 'Miami', state: 'FL' }],
                    phoneNumbers: [],
                    relatives: [],
                    profileUrl: baseURL + 'view/Ben-Smith-DSAJBtFB',
                    identifier: baseURL + 'view/Ben-Smith-DSAJBtFB',
                },
                {
                    name: 'Benjamin H Smith',
                    alternativeNames: ['Bejamin Smith', 'Ben Smith', 'Benjamin Smith'],
                    age: '39',
                    addresses: [
                        {
                            city: 'Fort Lauderdale',
                            state: 'FL',
                        },
                        {
                            city: 'Miami',
                            state: 'FL',
                        },
                        {
                            city: 'Indianapolis',
                            state: 'IN',
                        },
                    ],
                    phoneNumbers: [],
                    relatives: [],
                    profileUrl: baseURL + 'view/Benjamin-Smith-GpC.DQCB',
                    identifier: baseURL + 'view/Benjamin-Smith-GpC.DQCB',
                },
            ]);
        });

        test('extract profiles test 3', async ({ page, baseURL }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo.project.use);
            await dbp.enabled();
            await dbp.navigatesTo('results-alt.html');
            await dbp.receivesAction('extract3.json');
            const response = await dbp.collector.waitForMessage('actionCompleted');
            dbp.isSuccessMessage(response);
            dbp.isExtractMatch(response[0].payload.params.result.success.response, [
                {
                    name: 'John A Smith',
                    age: '63',
                    alternativeNames: ['John Smithe', 'Jonathan Smith'],
                    addresses: [
                        { city: 'Miami', state: 'FL' },
                        { city: 'Orlando', state: 'FL' },
                        { city: 'Plantation', state: 'FL' },
                    ],
                    profileUrl:
                        baseURL +
                        'products/name?firstName=john&middleName=a&lastName=smith&ln=smith&city=orlando&state=fl&id=G421681744450237260',
                    identifier:
                        baseURL +
                        'products/name?firstName=john&middleName=a&lastName=smith&ln=smith&city=orlando&state=fl&id=G421681744450237260',
                    phoneNumbers: [],
                    relatives: [],
                },
            ]);
        });

        test('extract profiles test 4', async ({ page, baseURL }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo.project.use);
            await dbp.enabled();
            await dbp.navigatesTo('results-4.html');
            await dbp.receivesAction('extract4.json');
            const response = await dbp.collector.waitForMessage('actionCompleted');
            dbp.isSuccessMessage(response);
            dbp.isExtractMatch(response[0].payload.params.result.success.response, [
                {
                    name: 'Ben Smith',
                    age: '55',
                    alternativeNames: [],
                    addresses: [{ city: 'Tampa', state: 'FL' }],
                    profileUrl:
                        baseURL + 'products/name?firstName=ben&lastName=smith&ln=smith&city=tampa&state=fl&id=G-3492284932683347509',
                    identifier:
                        baseURL + 'products/name?firstName=ben&lastName=smith&ln=smith&city=tampa&state=fl&id=G-3492284932683347509',
                    phoneNumbers: [],
                    relatives: [],
                },
            ]);
        });

        test('extract profiles test 5', async ({ page, baseURL }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo.project.use);
            await dbp.enabled();
            await dbp.navigatesTo('results-5.html');
            await dbp.receivesAction('extract5.json');
            const response = await dbp.collector.waitForMessage('actionCompleted');
            dbp.isSuccessMessage(response);
            dbp.isExtractMatch(response[0].payload.params.result.success.response, [
                {
                    name: 'Jonathan Smith',
                    age: '50',
                    alternativeNames: [],
                    phoneNumbers: ['97021405106'],
                    profileUrl: baseURL + 'person/Smith-41043103849',
                    identifier: baseURL + 'person/Smith-41043103849',
                    addresses: [
                        {
                            city: 'Orlando',
                            state: 'FL',
                            extras: { street: '123 Main St', zip: '81010' },
                        },
                    ],
                    relatives: [],
                },
            ]);
        });

        test('extract with regex afterText / beforeText / separator (case-insensitive)', async ({ page, baseURL }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo.project.use);
            await dbp.enabled();
            await dbp.navigatesTo('results-regex.html');
            await dbp.receivesAction('extract-regex.json');
            const response = await dbp.collector.waitForMessage('actionCompleted');
            dbp.isSuccessMessage(response);
            dbp.isExtractMatch(response[0].payload.params.result.success.response, [
                {
                    name: 'John Smith',
                    age: '38',
                    alternativeNames: ['J Smith', 'John Smith', 'Johnny'],
                    addresses: [
                        { city: 'Chicago', state: 'IL' },
                        { city: 'Evanston', state: 'IL' },
                    ],
                    phoneNumbers: [],
                    relatives: [],
                    profileUrl: baseURL + 'profile/john-smith/8f2a3b',
                    identifier: baseURL + 'profile/john-smith/8f2a3b',
                },
            ]);
        });

        test('extract profile from irregular HTML 1', async ({ page, baseURL }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo.project.use);
            await dbp.enabled();
            await dbp.navigatesTo('results-irregular1.html');
            await dbp.receivesAction('extract-irregular1.json');
            const response = await dbp.collector.waitForMessage('actionCompleted');
            dbp.isSuccessMessage(response);
            dbp.isExtractMatch(response[0].payload.params.result.success.response, [
                {
                    name: 'John M Smith',
                    age: '75',
                    alternativeNames: ['John Ark', 'John Mark', 'John Smith', 'John-Mark Smith', 'Johna Smith', 'Johnmark Smith'],
                    addresses: [
                        { city: 'Chicago', state: 'IL' },
                        { city: 'Evanston', state: 'IL' },
                    ],
                    profileUrl: baseURL + 'pp/John-Smith-HdDWHRBD',
                    identifier: baseURL + 'pp/John-Smith-HdDWHRBD',
                    relatives: ['Margaret Kelly', 'Mary Kelly', 'Michael Kelly'],
                    phoneNumbers: [],
                },
            ]);
        });

        test('extract profile from irregular HTML 2', async ({ page, baseURL }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo.project.use);
            await dbp.enabled();
            await dbp.navigatesTo('results-irregular2.html');
            await dbp.receivesAction('extract-irregular2.json');
            const response = await dbp.collector.waitForMessage('actionCompleted');
            dbp.isSuccessMessage(response);
            dbp.isExtractMatch(response[0].payload.params.result.success.response, [
                {
                    name: 'John Smith',
                    age: '71',
                    addresses: [
                        { city: 'Chicago', state: 'IL' },
                        { city: 'South Holland', state: 'IL' },
                        { city: 'Crown Point', state: 'IN' },
                    ],
                    alternativeNames: [],
                    relatives: ['Brittany J Hoard', 'Jame...', 'Joyce E Doyle'],
                    profileUrl: baseURL + 'find/person/p286nuu00u98lu9n0n96',
                    identifier: baseURL + 'find/person/p286nuu00u98lu9n0n96',
                    phoneNumbers: [],
                },
            ]);
        });

        test('extract profile from irregular HTML 3', async ({ page, baseURL }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo.project.use);
            await dbp.enabled();
            await dbp.navigatesTo('results-irregular3.html');
            await dbp.receivesAction('extract-irregular3.json');
            const response = await dbp.collector.waitForMessage('actionCompleted');
            dbp.isSuccessMessage(response);
            dbp.isExtractMatch(response[0].payload.params.result.success.response, [
                {
                    name: 'John I Smith',
                    age: '59',
                    addresses: [
                        { city: 'Chicago', state: 'IL' },
                        { city: 'Forest Park', state: 'IL' },
                        { city: 'Oak Park', state: 'IL' },
                        { city: 'River Forest', state: 'IL' },
                    ],
                    alternativeNames: ['John Farmersmith', 'John Smith', 'Johni Smith'],
                    phoneNumbers: [],
                    relatives: ['Alexander Makely', 'Ethel Makely', 'Veronica Berrios'],
                    profileUrl: baseURL + 'people/John-Smith-AIGwGOFD',
                    identifier: baseURL + 'people/John-Smith-AIGwGOFD',
                },
            ]);
        });

        test('extracts profile and generates id', async ({ page }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo.project.use);
            await dbp.enabled();
            await dbp.navigatesTo('results.html');
            await dbp.receivesAction('extract-generate-id.json');
            const response = await dbp.collector.waitForMessage('actionCompleted');
            dbp.isSuccessMessage(response);
            dbp.isExtractMatch(response[0].payload.params.result.success.response, [
                {
                    name: 'John Smith',
                    alternativeNames: [],
                    age: '38',
                    addresses: [
                        { city: 'Chicago', state: 'IL' },
                        { city: 'Cadillac', state: 'MI' },
                        { city: 'Ypsilanti', state: 'MI' },
                    ],
                    phoneNumbers: [],
                    relatives: ['Cheryl Lamar'],
                    identifier: 'b3ccf90a0ffaaa5f57fd262ab1b694b3c208d622',
                },
            ]);
            dbp.responseContainsMetadata(response[0].payload.params.result.success.meta);
        });

        test('extracts profileUrl from an element attribute', async ({ page, baseURL }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo.project.use);
            await dbp.enabled();
            await dbp.navigatesTo('results-attribute.html');
            await dbp.receivesAction('extract-attribute.json');
            const response = await dbp.collector.waitForMessage('actionCompleted');
            dbp.isSuccessMessage(response);
            const profileUrl = new URL('/profile/John-Smith/BMFrB9EB', baseURL).href;
            dbp.isExtractMatch(response[0].payload.params.result.success.response, [
                {
                    name: 'John Wesley Smith',
                    alternativeNames: ['John J Smith', 'John W Smith', 'John Walter Smith', 'John Wesle Smith'],
                    age: '61',
                    addresses: [
                        { city: 'Canton', state: 'MI' },
                        { city: 'Detroit', state: 'MI' },
                        { city: 'Ecorse', state: 'MI' },
                        { city: 'Warren', state: 'MI' },
                    ],
                    phoneNumbers: [],
                    relatives: ['Edward L Smith', 'Jeanette Sims Johnson', 'Johnnie Johnson', 'Renee Marie Johnson'],
                    profileUrl,
                    identifier: profileUrl,
                },
            ]);
        });

        test('extracts profileUrl from the current page URL', async ({ page, baseURL }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo.project.use);
            await dbp.enabled();
            await dbp.navigatesTo('results-page-url.html');
            await dbp.receivesAction('extract-page-url.json');
            const response = await dbp.collector.waitForMessage('actionCompleted');
            dbp.isSuccessMessage(response);
            const pageUrl = baseURL + 'broker-protection/pages/results-page-url.html';
            dbp.isExtractMatch(response[0].payload.params.result.success.response, [
                {
                    name: 'John Smith',
                    alternativeNames: [],
                    age: '40',
                    addresses: [{ city: 'Chicago', state: 'IL' }],
                    phoneNumbers: [],
                    relatives: [],
                    profileUrl: pageUrl,
                    identifier: pageUrl,
                },
            ]);
        });

        test('extracts city and state from separate elements', async ({ page, baseURL }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo.project.use);
            await dbp.enabled();
            await dbp.navigatesTo('results-nested-city-state.html');
            await dbp.receivesAction('extract-nested-city-state.json');
            const response = await dbp.collector.waitForMessage('actionCompleted');
            dbp.isSuccessMessage(response);

            const profiles = response[0].payload.params.result.success.response;
            expect(profiles).toHaveLength(1);
            expect(profiles[0]).toMatchObject({
                name: 'Mark West',
                alternativeNames: [],
                age: '46',
                addresses: [{ city: 'Dallas', state: 'TX' }],
                phoneNumbers: [],
                relatives: [],
                profileUrl: baseURL + 'person/mark-west/2',
                identifier: baseURL + 'person/mark-west/2',
            });
        });

        test('returns an empty array when no profile selector matches but the no results selector is present', async ({
            page,
        }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo.project.use);
            await dbp.enabled();
            await dbp.navigatesTo('results-not-found.html');
            await dbp.receivesAction('results-not-found-valid.json');
            const response = await dbp.collector.waitForMessage('actionCompleted');
            dbp.isSuccessMessage(response);
            dbp.isExtractMatch(response[0].payload.params.result.success.response, []);
        });

        test('returns an error when no profile selector matches and the no results selector is not present', async ({
            page,
        }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo.project.use);
            await dbp.enabled();
            await dbp.navigatesTo('results.html');
            await dbp.receivesAction('results-not-found-invalid.json');
            const response = await dbp.collector.waitForMessage('actionCompleted');
            dbp.isErrorMessage(response);
        });

        test('extract recovers a full street address from an href slug, de-slugging only the text parts', async ({ page }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo.project.use);
            await dbp.enabled();
            await dbp.navigatesTo('results-address-href.html');
            await dbp.receivesAction('extract-address-href.json');
            const response = await dbp.collector.waitForMessage('actionCompleted');
            dbp.isSuccessMessage(response);
            dbp.isExtractMatch(response[0].payload.params.result.success.response, [
                {
                    name: 'John B Sample',
                    alternativeNames: [],
                    addresses: [
                        { city: 'Acworth', state: 'GA', extras: { street: '100 Sample Dr', zip: '30102' } },
                        { city: 'Springfield', state: 'IL', extras: { street: '121-123 Main St', zip: '62704' } },
                        { city: 'New York', state: 'NY', extras: { street: '1234 Martin Luther King Jr Blvd', zip: '10003' } },
                        { city: 'Franklin', state: 'TN', extras: { street: '55 Old Mill Rd', zip: '37064' } },
                    ],
                    phoneNumbers: [],
                    relatives: [],
                },
            ]);
        });

        test('extract recovers a full street address from a title attribute, keeping same-city addresses with distinct streets', async ({
            page,
        }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo.project.use);
            await dbp.enabled();
            await dbp.navigatesTo('results-address-title.html');
            await dbp.receivesAction('extract-address-title.json');
            const response = await dbp.collector.waitForMessage('actionCompleted');
            dbp.isSuccessMessage(response);
            dbp.isExtractMatch(response[0].payload.params.result.success.response, [
                {
                    name: 'John Sample',
                    alternativeNames: [],
                    addresses: [
                        { city: 'Winston-Salem', state: 'NC', extras: { street: '500 Old Mill Rd', zip: '27101' } },
                        { city: 'Baytown', state: 'TX', extras: { street: '100 Sample Dr', zip: '77523' } },
                        { city: 'Baytown', state: 'TX', extras: { street: '200 Sample Ct', zip: '77523' } },
                        { city: 'Livingston', state: 'TX', extras: { street: '300 Example Rd', zip: '77351' } },
                        { city: 'Livingston', state: 'TX', extras: { street: '400 Example Ln', zip: '77351' } },
                    ],
                    phoneNumbers: [],
                    relatives: [],
                },
            ]);
        });

        test('extract recovers a full street address from link text', async ({ page }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo.project.use);
            await dbp.enabled();
            await dbp.navigatesTo('results-address-text.html');
            await dbp.receivesAction('extract-address-text.json');
            const response = await dbp.collector.waitForMessage('actionCompleted');
            dbp.isSuccessMessage(response);
            dbp.isExtractMatch(response[0].payload.params.result.success.response, [
                {
                    name: 'John A Sample',
                    age: '40',
                    alternativeNames: [],
                    addresses: [
                        { city: 'Baytown', state: 'TX', extras: { street: '100 Sample Dr', zip: '77523' } },
                        { city: 'Livingston', state: 'TX', extras: { street: '300 Example Rd', zip: '77351' } },
                        { city: 'Livingston', state: 'TX', extras: { street: '400 Example Ln', zip: '77351' } },
                    ],
                    phoneNumbers: [],
                    relatives: [],
                },
            ]);
        });

        test('extract captures an unknown profile field into extras', async ({ page }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo.project.use);
            await dbp.enabled();
            await dbp.navigatesTo('results-profile-extras.html');
            await dbp.receivesAction('extract-profile-extras.json');
            const response = await dbp.collector.waitForMessage('actionCompleted');
            dbp.isSuccessMessage(response);
            dbp.isExtractMatch(response[0].payload.params.result.success.response, [
                {
                    name: 'John Sample',
                    alternativeNames: [],
                    addresses: [{ city: 'Springfield', state: 'IL' }],
                    phoneNumbers: [],
                    relatives: [],
                    extras: { shoeSize: '10.5' },
                },
            ]);
        });
    });
    test.describe('Executes action and sends success message', () => {
        test('buildUrl', async ({ page }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo.project.use);
            await dbp.withFeatureConfig(BROKER_PROTECTION_CONFIGS.default);
            await dbp.navigatesTo('results.html');
            await dbp.receivesAction('navigate.json');
            const response = await dbp.collector.waitForMessage('actionCompleted');
            dbp.isSuccessMessage(response);
            dbp.isUrlMatch(response[0].payload.params.result.success.response);
        });

        test('fillForm', async ({ page }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo.project.use);
            await dbp.enabled();
            await dbp.navigatesTo('form.html');
            await dbp.receivesAction('fill-form.json');
            const response = await dbp.collector.waitForMessage('actionCompleted');
            dbp.isSuccessMessage(response);
            await dbp.isFormFilled();
        });

        test('fillForm with full state', async ({ page }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo.project.use);
            await dbp.enabled();
            await dbp.navigatesTo('form.html');
            await dbp.receivesAction('fill-form-full-state.json');
            const response = await dbp.collector.waitForMessage('actionCompleted');
            dbp.isSuccessMessage(response);
            await dbp.isFormFilled({ fullState: true });
        });

        /**
         * This one's a bit tricky. On our state list we have District of Columbia (note the lowercase o in 'of')
         * but the select has an option with value District Of Columbia (uppercase o in 'of'). This test verifies
         * that even if we're setting the value using different casing, that the correct value is still selected.
         */
        test('fillForm with full state and differing case', async ({ page }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo.project.use);
            await dbp.enabled();
            await dbp.navigatesTo('form.html');
            await dbp.receivesAction('fill-form-full-state-case-insensitive.json');
            const response = await dbp.collector.waitForMessage('actionCompleted');
            dbp.isSuccessMessage(response);
            await dbp.doesInputValueEqual('#full-state', 'District Of Columbia');
        });

        test('fillForm with select containing numbers', async ({ page }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo.project.use);
            await dbp.enabled();
            await dbp.navigatesTo('form.html');
            await dbp.receivesAction('fill-form-numbers.json');
            const response = await dbp.collector.waitForMessage('actionCompleted');
            dbp.isSuccessMessage(response);
            await dbp.doesInputValueEqual('#age', '38');
            await dbp.doesInputValueEqual('#birthYear', '1992');
            await dbp.doesInputValueEqual('#birthYearNoValue', '1992');
        });

        test('fillForm with a textarea', async ({ page }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo.project.use);
            await dbp.enabled();
            await dbp.navigatesTo('form.html');
            await dbp.receivesAction('fill-form-textarea.json');
            const response = await dbp.collector.waitForMessage('actionCompleted');
            dbp.isSuccessMessage(response);
            await dbp.doesInputValueEqual('#profile_url', 'https://www.veripages.com/profile/John-Smith-12345');
        });

        test('fillForm generates a date of birth matching the extracted age', async ({ page }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo.project.use);
            await dbp.enabled();
            await dbp.navigatesTo('form.html');
            await dbp.receivesAction('fill-form-generated-dob.json');
            const response = await dbp.collector.waitForMessage('actionCompleted');
            dbp.isSuccessMessage(response);
            await dbp.isDateOfBirthForAge('#user_dob', 51);
            await dbp.doesInputValueEqual('#user_first_name', 'John');
        });

        test('fillForm errors when a generated date of birth has no age to work from', async ({ page }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo.project.use);
            await dbp.enabled();
            await dbp.navigatesTo('form.html');
            await dbp.receivesAction('fill-form-generated-dob-no-age.json');
            const response = await dbp.collector.waitForMessage('actionCompleted');
            dbp.isErrorMessage(response);
            await dbp.doesInputValueEqual('#user_dob', '');
        });

        test('fillForm spreads one generated date of birth across separately formatted fields', async ({ page }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo.project.use);
            await dbp.enabled();
            await dbp.navigatesTo('form.html');
            await dbp.receivesAction('fill-form-generated-dob-parts.json');
            const response = await dbp.collector.waitForMessage('actionCompleted');
            dbp.isSuccessMessage(response);
            await dbp.isDateOfBirthSplitAcrossFields(
                {
                    date: '#user_dob',
                    year: '#user_dob_year',
                    month: '#user_dob_month',
                    day: '#user_dob_day',
                    us: '#user_dob_us',
                },
                51,
            );
        });

        test('fillForm with optional information', async ({ page }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo.project.use);
            await dbp.enabled();
            await dbp.navigatesTo('form.html');
            await dbp.receivesAction('fill-form-optional.json');
            const response = await dbp.collector.waitForMessage('actionCompleted');
            dbp.isSuccessMessage(response);
            await dbp.isFormFilled();
        });

        test('click', async ({ page }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo.project.use);
            await dbp.enabled();
            await dbp.navigatesTo('form.html');
            await dbp.receivesAction('click.json');
            const response = await dbp.collector.waitForMessage('actionCompleted');
            dbp.isSuccessMessage(response);
        });

        test('clicking with parent selector (considering matching weight/score)', async ({ page }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo.project.use);
            await dbp.enabled();
            await dbp.navigatesTo('results-weighted.html');
            await dbp.receivesAction('click-weighted.json');
            const response = await dbp.collector.waitForMessage('actionCompleted');

            dbp.isSuccessMessage(response);
            await page.waitForURL((url) => url.hash === '#2', { timeout: 2000 });
        });

        test('clicking with parent selector (clicking the actual parent)', async ({ page }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo.project.use);
            await dbp.enabled();
            await dbp.navigatesTo('results-parent.html');
            await dbp.receivesAction('click-parent.json');
            const response = await dbp.collector.waitForMessage('actionCompleted');

            dbp.isSuccessMessage(response);
            await page.waitForURL((url) => url.hash === '#2', { timeout: 2000 });
        });

        test('click multiple targets', async ({ page }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo.project.use);
            await dbp.enabled();
            await dbp.navigatesTo('click-multiple.html');
            await dbp.receivesAction('click-multiple.json');
            const response = await dbp.collector.waitForMessage('actionCompleted');

            dbp.isSuccessMessage(response);
            await page.waitForURL((url) => url.hash === '#1-2', { timeout: 2000 });
        });

        test('click multiple targets when the multiple flag arrives as a number', async ({ page }, workerInfo) => {
            // The native layer should pass booleans (like the click action's multiple: true) along as-is,
            // but we've seen encoding bugs pass turn these into integers instead. This test checks that
            // c-s-s will obey either a boolean (true) or an integer..
            const dbp = BrokerProtectionPage.create(page, workerInfo.project.use);
            await dbp.enabled();
            await dbp.navigatesTo('click-multiple.html');
            await dbp.receivesAction('click-multiple-numeric-flag.json');
            const response = await dbp.collector.waitForMessage('actionCompleted');

            dbp.isSuccessMessage(response);
            await page.waitForURL((url) => url.hash === '#1-2', { timeout: 2000 });
        });

        test('conditional clicks - hard-coded success', async ({ page }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo.project.use);
            await dbp.enabled();
            await dbp.navigatesTo('conditional-clicks.html');
            await dbp.receivesAction('conditional-clicks-hard-coded-success.json');
            const response = await dbp.collector.waitForMessage('actionCompleted');

            dbp.isSuccessMessage(response);
            await page.waitForURL((url) => url.hash === '#yes', { timeout: 2000 });
        });

        test('conditional clicks - hard-coded default', async ({ page }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo.project.use);
            await dbp.enabled();
            await dbp.navigatesTo('conditional-clicks.html');
            await dbp.receivesAction('conditional-clicks-hard-coded-default.json');
            const response = await dbp.collector.waitForMessage('actionCompleted');

            dbp.isSuccessMessage(response);
            await page.waitForURL((url) => url.hash === '#no', { timeout: 2000 });
        });

        test('conditional clicks - do not throw error on defined (but empty) default', async ({ page }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo.project.use);
            await dbp.enabled();
            await dbp.navigatesTo('conditional-clicks.html');
            await dbp.receivesAction('conditional-clicks-hard-coded-null-default.json');
            const response = await dbp.collector.waitForMessage('actionCompleted');

            dbp.isSuccessMessage(response);
        });

        test('conditional clicks - throw error if default is undefined', async ({ page }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo.project.use);
            await dbp.enabled();
            await dbp.navigatesTo('conditional-clicks.html');
            await dbp.receivesAction('conditional-clicks-hard-coded-undefined-default.json');
            const response = await dbp.collector.waitForMessage('actionCompleted');

            dbp.isErrorMessage(response);
        });

        test('conditional clicks - interpolated success', async ({ page }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo.project.use);
            await dbp.enabled();
            await dbp.navigatesTo('conditional-clicks.html');
            await dbp.receivesAction('conditional-clicks-interpolated-success.json');
            const response = await dbp.collector.waitForMessage('actionCompleted');

            dbp.isSuccessMessage(response);
            await page.waitForURL((url) => url.hash === '#yes', { timeout: 2000 });
        });

        test('conditional clicks - interpolated default', async ({ page }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo.project.use);
            await dbp.enabled();
            await dbp.navigatesTo('conditional-clicks.html');
            await dbp.receivesAction('conditional-clicks-interpolated-default.json');
            const response = await dbp.collector.waitForMessage('actionCompleted');

            dbp.isSuccessMessage(response);
            await page.waitForURL((url) => url.hash === '#no', { timeout: 2000 });
        });

        test('clicking selectors that do not exists should fail', async ({ page }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo.project.use);
            await dbp.enabled();
            await dbp.navigatesTo('clicks.html');
            await dbp.receivesAction('click-nonexistent-selector.json');
            const response = await dbp.collector.waitForMessage('actionCompleted');

            dbp.isErrorMessage(response);
        });

        test('clicking buttons that are disabled should fail', async ({ page }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo.project.use);
            await dbp.enabled();
            await dbp.navigatesTo('clicks.html');
            await dbp.receivesAction('click-disabled-button.json');
            const response = await dbp.collector.waitForMessage('actionCompleted');

            dbp.isErrorMessage(response);
        });

        test('clicking selectors that do not exist when failSilently is enabled should not fail', async ({ page }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo.project.use);
            await dbp.enabled();
            await dbp.navigatesTo('clicks.html');
            await dbp.receivesAction('click-nonexistent-selector-failSilently.json');
            const response = await dbp.collector.waitForMessage('actionCompleted');

            dbp.isSuccessMessage(response);
        });

        test('clicking buttons that are disabled when failSilently is enabled should not fail', async ({ page }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo.project.use);
            await dbp.enabled();
            await dbp.navigatesTo('clicks.html');
            await dbp.receivesAction('click-disabled-button-failSilently.json');
            const response = await dbp.collector.waitForMessage('actionCompleted');

            dbp.isSuccessMessage(response);
        });

        test('expectation', async ({ page }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo.project.use);
            await dbp.enabled();
            await dbp.navigatesTo('form.html');
            await dbp.receivesAction('expectation.json');
            const response = await dbp.collector.waitForMessage('actionCompleted');
            dbp.isSuccessMessage(response);
        });

        test('expectation: element exists', async ({ page }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo.project.use);
            await dbp.enabled();
            await dbp.navigatesTo('form.html');

            // control: ensure the element is absent
            await dbp.elementIsAbsent('.slow-element');

            // now send in the action
            await dbp.receivesInlineAction({
                state: {
                    action: {
                        actionType: 'expectation',
                        id: 'test-expectation',
                        expectations: [
                            {
                                type: 'element',
                                selector: '.slow-element',
                                parent: 'body.delay-complete',
                            },
                        ],
                    },
                },
            });

            const response = await dbp.collector.waitForMessage('actionCompleted');
            dbp.isSuccessMessage(response);
        });

        test('fillForm resolves street from extras, city/state from the selected address, and fills a present middleName', async ({
            page,
        }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo.project.use);
            await dbp.enabled();
            await dbp.navigatesTo('opt-out-form.html');
            await dbp.receivesAction('fill-form-extras.json');
            const response = await dbp.collector.waitForMessage('actionCompleted');
            dbp.isSuccessMessage(response);
            await dbp.doesInputValueEqual('#FirstName', 'John');
            await dbp.doesInputValueEqual('#MiddleName', 'Andrew');
            await dbp.doesInputValueEqual('#LastName', 'Sample');
            await dbp.doesInputValueEqual('#StreetAddress', '100 Sample Dr');
            await dbp.doesInputValueEqual('#City', 'Baytown');
            await dbp.doesInputValueEqual('#State', 'TX');
        });

        test('fillForm selects the profile address matching the user profile', async ({ page }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo.project.use);
            await dbp.enabled();
            await dbp.navigatesTo('opt-out-form.html');
            await dbp.receivesAction('fill-form-extras-address-selection.json');
            const response = await dbp.collector.waitForMessage('actionCompleted');
            dbp.isSuccessMessage(response);
            await dbp.doesInputValueEqual('#StreetAddress', '300 Example Rd');
            await dbp.doesInputValueEqual('#City', 'Livingston');
            await dbp.doesInputValueEqual('#State', 'TX');
        });

        test('fillForm falls back to the first address when there is no user profile', async ({ page }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo.project.use);
            await dbp.enabled();
            await dbp.navigatesTo('opt-out-form.html');
            await dbp.receivesAction('fill-form-extras-no-user-profile.json');
            const response = await dbp.collector.waitForMessage('actionCompleted');
            dbp.isSuccessMessage(response);
            await dbp.doesInputValueEqual('#StreetAddress', '100 Sample Dr');
            await dbp.doesInputValueEqual('#City', 'Baytown');
        });

        test('fillForm skips an optional field that is present but empty, without erroring', async ({ page }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo.project.use);
            await dbp.enabled();
            await dbp.navigatesTo('opt-out-form.html');
            await dbp.receivesAction('fill-form-optional-empty.json');
            const response = await dbp.collector.waitForMessage('actionCompleted');
            // A present-but-empty optional field (middleName) is skipped rather than failing the
            // form; firstName confirms the other fields still fill.
            dbp.isSuccessMessage(response);
            await dbp.doesInputValueEqual('#FirstName', 'John');
        });

        test('fillForm errors when an element type is in neither known keys nor extras', async ({ page }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo.project.use);
            await dbp.enabled();
            await dbp.navigatesTo('opt-out-form.html');
            await dbp.receivesAction('fill-form-extras-missing.json');
            const response = await dbp.collector.waitForMessage('actionCompleted');
            dbp.isErrorMessage(response);
        });
    });

    test('expectation with actions', async ({ page }, workerInfo) => {
        const dbp = BrokerProtectionPage.create(page, workerInfo.project.use);
        await dbp.enabled();
        await dbp.navigatesTo('expectation-actions.html');
        await dbp.receivesAction('expectation-actions.json');
        const response = await dbp.collector.waitForMessage('actionCompleted');

        dbp.isSuccessMessage(response);
        await page.waitForURL((url) => url.hash === '#1', { timeout: 2000 });
    });

    test('expectation fails when failSilently is not present', async ({ page }, workerInfo) => {
        const dbp = BrokerProtectionPage.create(page, workerInfo.project.use);
        await dbp.enabled();
        await dbp.navigatesTo('expectation-actions.html');
        await dbp.receivesAction('expectation-actions-fail.json');

        const response = await dbp.collector.waitForMessage('actionCompleted');
        dbp.isErrorMessage(response);

        const currentUrl = page.url();
        expect(currentUrl).not.toContain('#');
    });

    test('expectation succeeds when failSilently is present', async ({ page }, workerInfo) => {
        const dbp = BrokerProtectionPage.create(page, workerInfo.project.use);
        await dbp.enabled();
        await dbp.navigatesTo('expectation-actions.html');
        await dbp.receivesAction('expectation-actions-fail-silently.json');

        const response = await dbp.collector.waitForMessage('actionCompleted');
        dbp.isSuccessMessage(response);

        const currentUrl = page.url();
        expect(currentUrl).not.toContain('#');
    });

    test('expectation succeeds but subaction fails should throw error', async ({ page }, workerInfo) => {
        const dbp = BrokerProtectionPage.create(page, workerInfo.project.use);
        await dbp.enabled();
        await dbp.navigatesTo('expectation-actions.html');
        await dbp.receivesAction('expectation-actions-subaction-fail.json');

        const response = await dbp.collector.waitForMessage('actionCompleted');
        dbp.isErrorMessage(response);

        const currentUrl = page.url();
        expect(currentUrl).not.toContain('#');
    });

    test('expectation with conditional subaction', async ({ page }, workerInfo) => {
        const dbp = BrokerProtectionPage.create(page, workerInfo.project.use);
        await dbp.enabled();
        await dbp.navigatesTo('expectation-actions.html');
        await dbp.receivesAction('expectation-actions-conditional-subaction.json');
        const response = await dbp.collector.waitForMessage('actionCompleted');

        dbp.isSuccessMessage(response);
        await page.waitForURL((url) => url.hash === '#2', { timeout: 2000 });
    });

    test.describe('retrying', () => {
        test('retrying a click', async ({ page }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo.project.use);
            await dbp.enabled();
            await dbp.navigatesTo('retry.html');

            await dbp.simulateSubscriptionMessage('onActionReceived', {
                state: {
                    action: {
                        actionType: 'click',
                        id: '5',
                        retry: {
                            environment: 'web',
                            maxAttempts: 10,
                            interval: { ms: 1000 },
                        },
                        elements: [
                            {
                                type: 'button',
                                selector: 'button',
                            },
                        ],
                    },
                },
            });
            await page.getByRole('heading', { name: 'Retry' }).waitFor({ timeout: 5000 });

            const response = await dbp.collector.waitForMessage('actionCompleted');
            dbp.isSuccessMessage(response);
        });
        test('ensuring retry doesnt apply everywhere', async ({ page }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo.project.use);
            await dbp.enabled();
            await dbp.navigatesTo('retry.html');

            await dbp.simulateSubscriptionMessage('onActionReceived', {
                state: {
                    action: {
                        actionType: 'click',
                        id: '5',
                        elements: [
                            {
                                type: 'button',
                                selector: 'button',
                            },
                        ],
                    },
                },
            });

            const response = await dbp.collector.waitForMessage('actionCompleted');
            dbp.isErrorMessage(response);
        });
    });

    test.describe('condition', () => {
        test('a successful condition returns success with steps in the response', async ({ page }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo.project.use);
            await dbp.enabled();
            await dbp.navigatesTo('form.html');
            await dbp.receivesAction('condition-success.json');
            const response = await dbp.collector.waitForMessage('actionCompleted');
            dbp.isSuccessMessage(response);

            // Check that the response contains an actions array
            const successResponse = await dbp.getSuccessResponse();

            expect(successResponse).toHaveProperty('actions');
            expect(Array.isArray(successResponse.actions)).toBe(true);
            expect(successResponse.actions.length).toBeGreaterThan(0);
        });

        test('a condition with failSilently returns success with empty actions array', async ({ page }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo.project.use);
            await dbp.enabled();
            await dbp.navigatesTo('form.html');
            await dbp.receivesAction('condition-fail-silently.json');
            const response = await dbp.collector.waitForMessage('actionCompleted');
            dbp.isSuccessMessage(response);

            // Check that the response does not contain an actions array
            const successResponse = await dbp.getSuccessResponse();

            expect(successResponse).toHaveProperty('actions');
            expect(Array.isArray(successResponse.actions)).toBe(true);
            expect(successResponse.actions.length).toBe(0);
        });

        test('a failing condition returns error', async ({ page }, workerInfo) => {
            const dbp = BrokerProtectionPage.create(page, workerInfo.project.use);
            await dbp.enabled();
            await dbp.navigatesTo('form.html');
            await dbp.receivesAction('condition-fail.json');
            const response = await dbp.collector.waitForMessage('actionCompleted');
            dbp.isErrorMessage(response);
        });
    });

    test.describe('executeScript', () => {
        const actionID = 'execute-script-test';

        /**
         * @param {unknown} script
         * @param {Record<string, unknown>} [overrides]
         * @param {Record<string, unknown>} [data]
         */
        function scriptAction(script, overrides = {}, data = {}) {
            return { state: { action: { actionType: 'executeScript', id: actionID, script, ...overrides }, data } };
        }

        /** @param {import('../page-objects/broker-protection.js').BrokerProtectionPage} dbp */
        async function completedResult(dbp) {
            const messages = await dbp.getActionCompletedParams();
            expect(messages).toHaveLength(1);
            return messages[0].payload.params.result;
        }

        const success = { success: { actionID, actionType: 'executeScript', response: null } };

        test.beforeEach(async ({ dbp }) => {
            await dbp.navigatesTo('execute-script.html');
        });

        test('injects a profile-based link that a following click navigates with the page as referrer', async ({ dbp, page }) => {
            const sourceUrl = page.url();
            await dbp.receivesAction('execute-script.json');
            expect(await completedResult(dbp)).toEqual({
                success: { actionID: 'execute-script-1', actionType: 'executeScript', response: null },
            });
            await expect(page.locator('#pir-probe-anchor')).toHaveAttribute('href', 'execute-script.html?name=Daniel+Silva');

            await dbp.receivesInlineAction({
                state: {
                    action: {
                        actionType: 'click',
                        id: 'execute-script-click',
                        elements: [{ type: 'button', selector: '#pir-probe-anchor' }],
                    },
                },
            });
            await page.waitForURL((url) => url.searchParams.get('name') === 'Daniel Silva');
            expect(await page.evaluate(() => document.referrer)).toBe(sourceUrl);
        });

        test('passes the profile selected by dataSource', async ({ dbp, page }) => {
            const userProfile = { firstName: 'Daniel', lastName: 'Silva', city: 'Los Angeles', state: 'CA', birthYear: 1988 };
            const extractedProfile = { firstName: 'Other' };
            await dbp.receivesInlineAction(
                scriptAction(
                    'root.body.textContent = JSON.stringify(userProfile);',
                    { dataSource: 'extractedProfile' },
                    { userProfile, extractedProfile },
                ),
            );
            expect(await completedResult(dbp)).toEqual(success);
            await expect(page.locator('body')).toHaveText(JSON.stringify(extractedProfile));
        });

        test('allows DOM-only scripts without input data', async ({ dbp, page }) => {
            const action = scriptAction('root.body.textContent = userProfile === null ? "no profile" : "unexpected profile";');
            await dbp.receivesInlineAction({ state: { action: action.state.action } });
            expect(await completedResult(dbp)).toEqual(success);
            await expect(page.locator('body')).toHaveText('no profile');
        });

        test('waits for a returned promise and discards its resolved value', async ({ dbp, page }) => {
            await dbp.receivesInlineAction(
                scriptAction(`return new Promise((resolve) => {
                    root.addEventListener('finish-script', () => {
                        root.body.dataset.finished = 'true';
                        resolve({ privateData: root.body.innerHTML });
                    }, { once: true });
                    root.body.dataset.started = 'true';
                });`),
            );
            await expect(page.locator('body')).toHaveAttribute('data-started', 'true');
            const brokerMessages = (await dbp.collector.outgoingMessages()).filter(
                (message) => message.payload.featureName === 'brokerProtection',
            );
            expect(brokerMessages).toEqual([]);

            await page.evaluate(() => document.dispatchEvent(new Event('finish-script')));
            expect(await completedResult(dbp)).toEqual(success);
            await expect(page.locator('body')).toHaveAttribute('data-finished', 'true');
        });

        test('discards synchronous results without serializing or executing returned actions', async ({ dbp }) => {
            await dbp.receivesInlineAction(
                scriptAction(`return {
                    privateData: root.body.innerHTML,
                    next: [{ actionType: 'executeScript', script: 'throw new Error("unexpected action");' }],
                    toJSON() { throw new Error('must not serialize'); }
                };`),
            );
            expect(await completedResult(dbp)).toEqual(success);
        });

        for (const { label, script, message } of [
            { label: 'a synchronous throw', script: "throw new TypeError('boom');", message: 'TypeError: boom' },
            { label: 'a rejected promise', script: "return Promise.reject(new RangeError('nope'));", message: 'RangeError: nope' },
            { label: 'an empty script', script: '', message: 'Error: No script provided to executeScript action' },
            { label: 'a whitespace-only script', script: ' \n\t ', message: 'Error: No script provided to executeScript action' },
            { label: 'a missing script', script: undefined, message: 'Error: No script provided to executeScript action' },
            { label: 'a non-string script', script: 42, message: 'Error: No script provided to executeScript action' },
            { label: 'a thrown string', script: 'throw "failed";', message: 'Error: failed' },
            { label: 'a thrown null', script: 'throw null;', message: 'Error: null' },
            {
                label: 'an error-like object',
                script: 'throw { name: "CustomError", message: "failed" };',
                message: 'CustomError: failed',
            },
            { label: 'an error with no name', script: 'throw { message: "failed" };', message: 'Error: failed' },
            { label: 'an error with an empty message', script: 'throw new Error("");', message: 'Error: ' },
            {
                label: 'a DOMException',
                script: 'throw new DOMException("denied", "SecurityError");',
                message: 'SecurityError: denied',
            },
            {
                label: 'an object that cannot be converted to a string',
                script: 'throw Object.create(null);',
                message: 'Error: Unknown error',
            },
            {
                label: 'an error whose message getter throws',
                script: 'throw { name: "CustomError", get message() { throw new Error("private getter failure"); } };',
                message: 'CustomError: Unknown error',
            },
            {
                label: 'an error name exceeding the 500-character limit',
                script: 'throw { name: "n".repeat(600), message: "message" };',
                message: 'n'.repeat(478),
            },
            {
                label: 'an error with controls before printable Unicode',
                script: 'throw new Error("\\n".repeat(1000) + "café 日本語");',
                message: 'Error: café 日本語',
            },
            {
                label: 'an oversized error with controls and an unreadable stack',
                script: `const controls = String.fromCharCode(
                        ...Array.from({ length: 32 }, (_, index) => index),
                        ...Array.from({ length: 33 }, (_, index) => 127 + index),
                        0x2028, 0x2029
                    );
                    const error = new Error('line1' + controls + 'line2' + 'x'.repeat(600));
                    error.name = 'Type' + controls + 'Error';
                    Object.defineProperty(error, 'stack', {
                        get() { throw new Error('must not read the stack'); }
                    });
                    throw error;`,
                message: 'TypeError: line1line2' + 'x'.repeat(500 - 'executeScript failed: TypeError: line1line2'.length),
            },
            {
                label: 'an error from an iframe',
                script: `const frame = root.createElement('iframe');
                    root.body.appendChild(frame);
                    const error = new frame.contentWindow.RangeError('out of range');
                    frame.remove();
                    if (error instanceof Error) throw new Error('expected an error from another realm');
                    throw error;`,
                message: 'RangeError: out of range',
            },
        ]) {
            test(`reports the action error for ${label}`, async ({ dbp }) => {
                await dbp.receivesInlineAction(scriptAction(script));
                expect(await completedResult(dbp)).toEqual({ error: { actionID, message: `executeScript failed: ${message}` } });
            });
        }

        test('reports syntax errors without running any of the script', async ({ dbp, page }) => {
            await dbp.receivesInlineAction(scriptAction('root.body.dataset.started = "true"; const = ;'));
            expect(await completedResult(dbp)).toEqual({
                error: { actionID, message: expect.stringMatching(/^executeScript failed: SyntaxError: /) },
            });
            await expect(page.locator('body')).not.toHaveAttribute('data-started');
        });

        for (const { failureType, script } of [
            { failureType: 'synchronous', script: 'throw new Error("failed");' },
            { failureType: 'asynchronous', script: 'return Promise.reject(new Error("failed"));' },
        ]) {
            test(`does not retry ${failureType} failures when retries are configured`, async ({ dbp, page }) => {
                await dbp.receivesInlineAction(
                    scriptAction(
                        `root.body.dataset.attempts = String(Number(root.body.dataset.attempts || 0) + 1);
                        ${script}`,
                        { retry: { environment: 'web', maxAttempts: 3, interval: { ms: 1 } } },
                    ),
                );
                expect(await completedResult(dbp)).toEqual({ error: { actionID, message: 'executeScript failed: Error: failed' } });
                await expect(page.locator('body')).toHaveAttribute('data-attempts', '1');
            });
        }

        test('reports failures even when failSilently is true', async ({ dbp }) => {
            await dbp.receivesInlineAction(scriptAction('throw new Error("failed");', { failSilently: true }));
            expect(await completedResult(dbp)).toEqual({ error: { actionID, message: 'executeScript failed: Error: failed' } });
        });
    });
});
