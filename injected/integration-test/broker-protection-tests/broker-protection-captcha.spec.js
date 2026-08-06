import { test as base, expect } from '@playwright/test';
import { createConfiguredDbpTest } from './fixtures';
import {
    createGetRecaptchaInfoAction,
    createSolveRecaptchaAction,
    createGetImageCaptchaInfoAction,
    createSolveImageCaptchaAction,
    createGetCloudFlareCaptchaInfoAction,
    createSolveCloudFlareCaptchaAction,
} from '../mocks/broker-protection/captcha.js';
import { BROKER_PROTECTION_CONFIGS } from './tests-config.js';

const test = createConfiguredDbpTest(base);

test.describe('Broker Protection Captcha', () => {
    test.describe('recaptcha2', () => {
        const recaptchaTargetPage = 're-captcha.html';
        const recaptchaResponseSelector = '#g-recaptcha-response';

        test.describe('getCaptchaInfo', () => {
            test('returns the expected response for the correct action data', async ({ createConfiguredDbp }) => {
                const dbp = await createConfiguredDbp(BROKER_PROTECTION_CONFIGS.default);
                await dbp.navigatesTo(recaptchaTargetPage);
                await dbp.receivesInlineAction(createGetRecaptchaInfoAction());
                const sucessResponse = await dbp.getSuccessResponse();

                dbp.isCaptchaMatch(sucessResponse, { captchaType: 'recaptcha2', targetPage: recaptchaTargetPage });
            });

            test('returns the expected response for the correct action data without the "captchaType" field', async ({
                createConfiguredDbp,
            }) => {
                const dbp = await createConfiguredDbp(BROKER_PROTECTION_CONFIGS.default);
                await dbp.navigatesTo(recaptchaTargetPage);
                await dbp.receivesInlineAction(createGetRecaptchaInfoAction({ captchaType: undefined }));
                const sucessResponse = await dbp.getSuccessResponse();

                dbp.isCaptchaMatch(sucessResponse, { captchaType: 'recaptcha2', targetPage: recaptchaTargetPage });
            });

            test('returns the expected type when the "captchaType" field does not match the detected captcha type', async ({
                createConfiguredDbp,
            }) => {
                const dbp = await createConfiguredDbp(BROKER_PROTECTION_CONFIGS.default);
                await dbp.navigatesTo(recaptchaTargetPage);
                await dbp.receivesInlineAction(createGetRecaptchaInfoAction({ captchaType: 'recaptchaEnterprise' }));
                const sucessResponse = await dbp.getSuccessResponse();

                dbp.isCaptchaMatch(sucessResponse, { captchaType: 'recaptcha2', targetPage: recaptchaTargetPage });
            });

            test('returns an error response for an action data with an invalid "captchaType" field', async ({ createConfiguredDbp }) => {
                const dbp = await createConfiguredDbp(BROKER_PROTECTION_CONFIGS.default);
                await dbp.navigatesTo(recaptchaTargetPage);
                await dbp.receivesInlineAction(createGetRecaptchaInfoAction({ captchaType: 'invalid' }));

                await dbp.isCaptchaError();
            });
        });

        test.describe('solveCaptchaInfo', () => {
            test('solves the captcha for the correct action data', async ({ createConfiguredDbp }) => {
                const dbp = await createConfiguredDbp(BROKER_PROTECTION_CONFIGS.default);
                await dbp.navigatesTo(recaptchaTargetPage);
                await dbp.receivesInlineAction(createSolveRecaptchaAction());
                dbp.getSuccessResponse();

                await dbp.isCaptchaTokenFilled(recaptchaResponseSelector);
            });

            test('solves the captcha for the correct action data without the "captchaType" field', async ({ createConfiguredDbp }) => {
                const dbp = await createConfiguredDbp(BROKER_PROTECTION_CONFIGS.default);
                await dbp.navigatesTo(recaptchaTargetPage);
                await dbp.receivesInlineAction(createSolveRecaptchaAction({ captchaType: undefined }));
                dbp.getSuccessResponse();

                await dbp.isCaptchaTokenFilled(recaptchaResponseSelector);
            });

            test('solves the captcha for an action data when the "captchaType" field does not match the detected captcha type', async ({
                createConfiguredDbp,
            }) => {
                const dbp = await createConfiguredDbp(BROKER_PROTECTION_CONFIGS.default);
                await dbp.navigatesTo(recaptchaTargetPage);
                await dbp.receivesInlineAction(createSolveRecaptchaAction({ captchaType: 'recaptchaEnterprise' }));
                dbp.getSuccessResponse();

                await dbp.isCaptchaTokenFilled(recaptchaResponseSelector);
            });

            test('returns an error response for an action data with an invalid "captchaType" field', async ({ createConfiguredDbp }) => {
                const dbp = await createConfiguredDbp(BROKER_PROTECTION_CONFIGS.default);
                await dbp.navigatesTo(recaptchaTargetPage);
                await dbp.receivesInlineAction(createSolveRecaptchaAction({ captchaType: 'invalid' }));

                await dbp.isCaptchaError();
            });
        });

        test.describe('with parent profileMatch', () => {
            const parentTargetPage = 're-captcha-parent.html';

            // one recaptcha per record — matches records by profile just like the click action
            const parent = {
                profileMatch: {
                    selector: '#people-search-results li',
                    profile: {
                        name: { selector: ".//div[@class='!text-black-900 text-lg']" },
                        age: { selector: ".//div[@class='text-lg']" },
                        addressCityStateList: {
                            selector: ".//div[@class='text-xs']/following-sibling::div",
                            findElements: true,
                        },
                    },
                },
            };

            // matches the third record on the page (James W Daly, 52, Gilbert AZ)
            const userProfile = {
                firstName: 'James',
                middleName: 'William',
                lastName: 'Daly',
                age: '52',
                addresses: [{ addressLine1: '123 Fake St', city: 'Gilbert', state: 'AZ' }],
            };

            // matches no records on the page
            const nonMatchingUserProfile = {
                firstName: 'Jane',
                lastName: 'Doe',
                age: '55',
                addresses: [{ addressLine1: '1 Other Rd', city: 'Chicago', state: 'IL' }],
            };

            test('gets the captcha belonging to the record that matches the user profile', async ({ createConfiguredDbp }) => {
                const dbp = await createConfiguredDbp(BROKER_PROTECTION_CONFIGS.default);
                await dbp.navigatesTo(parentTargetPage);
                await dbp.receivesInlineAction(createGetRecaptchaInfoAction({ parent }, { userProfile }));
                const successResponse = await dbp.getSuccessResponse();

                dbp.isCaptchaMatch(successResponse, {
                    captchaType: 'recaptcha2',
                    targetPage: parentTargetPage,
                    siteKey: 'test-site-key-2',
                });
            });

            test('gets the first captcha on the page when no parent is specified', async ({ createConfiguredDbp }) => {
                const dbp = await createConfiguredDbp(BROKER_PROTECTION_CONFIGS.default);
                await dbp.navigatesTo(parentTargetPage);
                await dbp.receivesInlineAction(createGetRecaptchaInfoAction({}, { userProfile }));
                const successResponse = await dbp.getSuccessResponse();

                dbp.isCaptchaMatch(successResponse, {
                    captchaType: 'recaptcha2',
                    targetPage: parentTargetPage,
                    siteKey: 'test-site-key-0',
                });
            });

            test('returns an error response when no record matches the user profile', async ({ createConfiguredDbp }) => {
                const dbp = await createConfiguredDbp(BROKER_PROTECTION_CONFIGS.default);
                await dbp.navigatesTo(parentTargetPage);
                await dbp.receivesInlineAction(createGetRecaptchaInfoAction({ parent }, { userProfile: nonMatchingUserProfile }));

                await dbp.isCaptchaError();
            });

            test('solves only the captcha belonging to the record that matches the user profile', async ({ createConfiguredDbp }) => {
                const dbp = await createConfiguredDbp(BROKER_PROTECTION_CONFIGS.default);
                await dbp.navigatesTo(parentTargetPage);
                await dbp.receivesInlineAction(createSolveRecaptchaAction({ parent }, { userProfile }));
                await dbp.getSuccessResponse();

                await dbp.isCaptchaTokenFilled('#g-recaptcha-response-2');
                await dbp.doesInputValueEqual('#g-recaptcha-response-0', '');
                await dbp.doesInputValueEqual('#g-recaptcha-response-1', '');
            });

            test('returns an error response when solving and no record matches the user profile', async ({ createConfiguredDbp }) => {
                const dbp = await createConfiguredDbp(BROKER_PROTECTION_CONFIGS.default);
                await dbp.navigatesTo(parentTargetPage);
                await dbp.receivesInlineAction(createSolveRecaptchaAction({ parent }, { userProfile: nonMatchingUserProfile }));

                await dbp.isCaptchaError();
            });
        });

        test('remove query params from captcha url', async ({ createConfiguredDbp }) => {
            const dbp = await createConfiguredDbp(BROKER_PROTECTION_CONFIGS.default);
            await dbp.navigatesTo('re-captcha.html?fname=john&lname=smith');
            await dbp.receivesInlineAction(createGetRecaptchaInfoAction());
            const sucessResponse = await dbp.getSuccessResponse();

            dbp.isQueryParamRemoved(sucessResponse);
        });
    });

    test.describe('image captcha', () => {
        const imageCaptchaTargetPage = 'image-captcha.html';
        const imageCaptchaResponseSelector = '#svgCaptchaInputId';

        test.describe('getCaptchaInfo', () => {
            test('returns the expected response for the correct action data', async ({ createConfiguredDbp }) => {
                const dbp = await createConfiguredDbp(BROKER_PROTECTION_CONFIGS.default);
                await dbp.navigatesTo(imageCaptchaTargetPage);
                await dbp.receivesInlineAction(createGetImageCaptchaInfoAction({ selector: '#svg-captcha-rendering svg' }));
                const sucessResponse = await dbp.getSuccessResponse();
                dbp.isCaptchaMatch(sucessResponse, { captchaType: 'image', targetPage: imageCaptchaTargetPage });
            });

            test('returns an error response when the selector is not an svg or image tag', async ({ createConfiguredDbp }) => {
                const dbp = await createConfiguredDbp(BROKER_PROTECTION_CONFIGS.default);
                await dbp.navigatesTo(imageCaptchaTargetPage);
                await dbp.receivesInlineAction(createGetImageCaptchaInfoAction({ selector: '#svg-captcha-rendering' }));

                await dbp.isCaptchaError();
            });

            test('preserves the original format/header for a gif captcha already inlined as a data URL', async ({
                createConfiguredDbp,
            }) => {
                const dbp = await createConfiguredDbp(BROKER_PROTECTION_CONFIGS.default);
                await dbp.navigatesTo(imageCaptchaTargetPage);
                await dbp.receivesInlineAction(createGetImageCaptchaInfoAction({ selector: '#gifCaptchaImage' }));
                const successResponse = await dbp.getSuccessResponse();

                // The src is already a base64 data URL, so it is returned as-is (not re-encoded), keeping
                // its 'image/gif' header instead of being flattened to a single-frame jpeg.
                expect(successResponse.siteKey).toMatch(/^data:image\/gif;base64,/);
            });

            test('preserves the original format/header for a url-hosted gif captcha', async ({ createConfiguredDbp }) => {
                const dbp = await createConfiguredDbp(BROKER_PROTECTION_CONFIGS.default);
                await dbp.navigatesTo(imageCaptchaTargetPage);
                await dbp.receivesInlineAction(createGetImageCaptchaInfoAction({ selector: '#hostedGifCaptchaImage' }));
                const successResponse = await dbp.getSuccessResponse();

                // The src is a hosted URL, so the bytes are fetched and encoded — still preserving the
                // 'image/gif' header rather than flattening to a single-frame jpeg.
                expect(successResponse.siteKey).toMatch(/^data:image\/gif;base64,/);
            });

            test('returns an error response when a url-hosted captcha image cannot be fetched', async ({ createConfiguredDbp }) => {
                const dbp = await createConfiguredDbp(BROKER_PROTECTION_CONFIGS.default);
                await dbp.navigatesTo(imageCaptchaTargetPage);
                await dbp.receivesInlineAction(createGetImageCaptchaInfoAction({ selector: '#missingHostedCaptchaImage' }));

                // A non-ok fetch (404 here) must fail rather than base64-encoding the error body and
                // sending non-image bytes to dbp-api as the siteKey.
                await dbp.isCaptchaError();
            });

            test('reports the requested alias type to the backend for an aliased image captcha', async ({ createConfiguredDbp }) => {
                const dbp = await createConfiguredDbp(BROKER_PROTECTION_CONFIGS.default);
                await dbp.navigatesTo(imageCaptchaTargetPage);
                // 'red-circle' is registered as an alias of the image provider, so it is resolved and
                // extracted via the same DOM mechanisms...
                await dbp.receivesInlineAction(
                    createGetImageCaptchaInfoAction({ captchaType: 'red-circle', selector: '#svg-captcha-rendering svg' }),
                );
                const successResponse = await dbp.getSuccessResponse();

                // ...but the response echoes the alias type that dbp-api expects, not the provider's
                // canonical 'image' type.
                expect(successResponse.type).toBe('red-circle');
                expect(successResponse.siteKey).toMatch(/^data:image\/jpeg;base64,/);
            });
        });

        test.describe('solveCaptchaInfo', () => {
            test('solves the captcha for the correct action data', async ({ createConfiguredDbp }) => {
                const dbp = await createConfiguredDbp(BROKER_PROTECTION_CONFIGS.default);
                await dbp.navigatesTo(imageCaptchaTargetPage);
                await dbp.receivesInlineAction(createSolveImageCaptchaAction({ selector: imageCaptchaResponseSelector }));
                dbp.getSuccessResponse();

                await dbp.isCaptchaTokenFilled(imageCaptchaResponseSelector);
            });
        });
    });

    test.describe('cloudflare turnstile', () => {
        const cloudFlareCaptchaTargetPage = 'cloudflare-captcha.html';

        test.describe('getCaptchaInfo', () => {
            test('returns the expected response for the correct action data', async ({ createConfiguredDbp }) => {
                const dbp = await createConfiguredDbp(BROKER_PROTECTION_CONFIGS.default);
                await dbp.navigatesTo(cloudFlareCaptchaTargetPage);
                await dbp.receivesInlineAction(createGetCloudFlareCaptchaInfoAction({ selector: '#captcha-widget' }));
                const sucessResponse = await dbp.getSuccessResponse();

                dbp.isCaptchaMatch(sucessResponse, {
                    captchaType: 'cloudFlareTurnstile',
                    targetPage: cloudFlareCaptchaTargetPage,
                    siteKey: '0x4AAAAAAA34NY6rivjWMWoq',
                });
            });

            test('returns an error if the sitekey attribute is missing', async ({ createConfiguredDbp }) => {
                const dbp = await createConfiguredDbp(BROKER_PROTECTION_CONFIGS.default);
                await dbp.navigatesTo(cloudFlareCaptchaTargetPage);
                await dbp.receivesInlineAction(createGetCloudFlareCaptchaInfoAction({ selector: '#missing-sitekey' }));

                await dbp.isCaptchaError();
            });
        });

        test.describe('solveCaptchaInfo', () => {
            test('returns an error if the callback attribute is missing', async ({ createConfiguredDbp }) => {
                const dbp = await createConfiguredDbp(BROKER_PROTECTION_CONFIGS.default);
                await dbp.navigatesTo(cloudFlareCaptchaTargetPage);
                await dbp.receivesInlineAction(createSolveCloudFlareCaptchaAction({ selector: '#missing-callback' }));

                await dbp.isCaptchaError();
            });

            test('solves the captcha for the correct action data', async ({ createConfiguredDbp }) => {
                const dbp = await createConfiguredDbp(BROKER_PROTECTION_CONFIGS.default);
                await dbp.navigatesTo(cloudFlareCaptchaTargetPage);
                await dbp.receivesInlineAction(createSolveCloudFlareCaptchaAction({ selector: '#captcha-widget' }));
                dbp.getSuccessResponse();

                await dbp.isCaptchaTokenFilled("//input[@name='cf-turnstile-response']");
            });
        });
    });
});
