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
import { createProfileMatchParent, createUserProfile } from '../mocks/broker-protection/profile.js';

const test = createConfiguredDbpTest(base);

test.describe('Broker Protection Captcha', () => {
    test.describe('recaptcha2', () => {
        const recaptchaTargetPage = 're-captcha.html';
        const recaptchaResponseSelector = '#g-recaptcha-response';
        const recaptchaWidgetSelector = '.g-recaptcha';

        test.describe('getCaptchaInfo', () => {
            test('returns the expected response for the correct action data', async ({ dbp }) => {
                await dbp.navigatesTo(recaptchaTargetPage);
                await dbp.receivesInlineAction(createGetRecaptchaInfoAction());
                const sucessResponse = await dbp.getSuccessResponse();

                dbp.isCaptchaMatch(sucessResponse, { captchaType: 'recaptcha2', targetPage: recaptchaTargetPage });
            });

            test('returns the expected response for the correct action data without the "captchaType" field', async ({ dbp }) => {
                await dbp.navigatesTo(recaptchaTargetPage);
                await dbp.receivesInlineAction(createGetRecaptchaInfoAction({ captchaType: undefined }));
                const sucessResponse = await dbp.getSuccessResponse();

                dbp.isCaptchaMatch(sucessResponse, { captchaType: 'recaptcha2', targetPage: recaptchaTargetPage });
            });

            test('returns the expected type when the "captchaType" field does not match the detected captcha type', async ({ dbp }) => {
                await dbp.navigatesTo(recaptchaTargetPage);
                await dbp.receivesInlineAction(createGetRecaptchaInfoAction({ captchaType: 'recaptchaEnterprise' }));
                const sucessResponse = await dbp.getSuccessResponse();

                dbp.isCaptchaMatch(sucessResponse, { captchaType: 'recaptcha2', targetPage: recaptchaTargetPage });
            });

            test('returns an error response for an action data with an invalid "captchaType" field', async ({ dbp }) => {
                await dbp.navigatesTo(recaptchaTargetPage);
                await dbp.receivesInlineAction(createGetRecaptchaInfoAction({ captchaType: 'invalid' }));

                await dbp.isCaptchaError();
            });
        });

        test.describe('solveCaptchaInfo', () => {
            test('solves the captcha for the correct action data', async ({ dbp }) => {
                await dbp.navigatesTo(recaptchaTargetPage);
                await dbp.receivesInlineAction(createSolveRecaptchaAction());
                dbp.getSuccessResponse();

                await dbp.isCaptchaTokenFilled(recaptchaResponseSelector);
            });

            test('without parent keeps first captcha behavior', async ({ dbp }) => {
                await dbp.navigatesTo(recaptchaTargetPage);
                await dbp.receivesInlineAction(createSolveRecaptchaAction({ captchaType: undefined }));
                const successResponse = await dbp.getSuccessResponse();

                await dbp.isCaptchaTokenFilled(recaptchaResponseSelector);
                await dbp.runsCaptchaCallback(successResponse);
                await dbp.isWidgetNotified(recaptchaWidgetSelector, 'data-callback-token');
            });

            test('notifies nothing when the matching widget has no callable client', async ({ dbp }) => {
                await dbp.navigatesTo(recaptchaTargetPage);
                await dbp.rendersRecaptchaClients({ widgetId: 9, clients: { 0: 'data-client-0-token', 9: null } });
                await dbp.receivesInlineAction(createSolveRecaptchaAction());
                const successResponse = await dbp.getSuccessResponse();

                await dbp.runsCaptchaCallback(successResponse);

                await dbp.isWidgetNotNotified(recaptchaWidgetSelector, 'data-client-0-token');
            });

            test('solves the captcha for an action data when the "captchaType" field does not match the detected captcha type', async ({
                dbp,
            }) => {
                await dbp.navigatesTo(recaptchaTargetPage);
                await dbp.receivesInlineAction(createSolveRecaptchaAction({ captchaType: 'recaptchaEnterprise' }));
                dbp.getSuccessResponse();

                await dbp.isCaptchaTokenFilled(recaptchaResponseSelector);
            });

            test('returns an error response for an action data with an invalid "captchaType" field', async ({ dbp }) => {
                await dbp.navigatesTo(recaptchaTargetPage);
                await dbp.receivesInlineAction(createSolveRecaptchaAction({ captchaType: 'invalid' }));

                await dbp.isCaptchaError();
            });
        });

        test.describe('with parent profileMatch', () => {
            const parentTargetPage = 're-captcha-parent.html';
            const userProfile = createUserProfile();
            const nonMatchingUserProfile = createUserProfile({
                firstName: 'Jane',
                middleName: undefined,
                lastName: 'Doe',
                age: '55',
                addresses: [{ addressLine1: '1 Other Rd', city: 'Chicago', state: 'IL' }],
            });

            test('gets the captcha belonging to the record that matches the user profile', async ({ dbp }) => {
                await dbp.navigatesTo(parentTargetPage);
                await dbp.receivesInlineAction(createGetRecaptchaInfoAction({ parent: createProfileMatchParent() }, { userProfile }));
                const successResponse = await dbp.getSuccessResponse();

                dbp.isCaptchaMatch(successResponse, {
                    captchaType: 'recaptcha2',
                    targetPage: parentTargetPage,
                    siteKey: 'test-site-key-2',
                });
            });

            test('gets the first captcha on the page when no parent is specified', async ({ dbp }) => {
                await dbp.navigatesTo(parentTargetPage);
                await dbp.receivesInlineAction(createGetRecaptchaInfoAction({}, { userProfile }));
                const successResponse = await dbp.getSuccessResponse();

                dbp.isCaptchaMatch(successResponse, {
                    captchaType: 'recaptcha2',
                    targetPage: parentTargetPage,
                    siteKey: 'test-site-key-0',
                });
            });

            test('returns an error response when no record matches the user profile', async ({ dbp }) => {
                await dbp.navigatesTo(parentTargetPage);
                await dbp.receivesInlineAction(
                    createGetRecaptchaInfoAction({ parent: createProfileMatchParent() }, { userProfile: nonMatchingUserProfile }),
                );

                await dbp.isCaptchaError();
            });

            test('solves only the captcha belonging to the supplied profile', async ({ dbp }) => {
                await dbp.navigatesTo(parentTargetPage);
                await dbp.receivesInlineAction(createSolveRecaptchaAction({ parent: createProfileMatchParent() }, { userProfile }));
                const successResponse = await dbp.getSuccessResponse();

                await dbp.isCaptchaTokenFilled('#g-recaptcha-response-2');
                await dbp.doesInputValueEqual('#g-recaptcha-response', '');
                await dbp.doesInputValueEqual('#g-recaptcha-response-1', '');

                await dbp.runsCaptchaCallback(successResponse);
                await dbp.isWidgetNotified('[data-sitekey="test-site-key-2"]', 'data-callback-token');
                await dbp.isWidgetNotNotified('[data-sitekey="test-site-key-0"]', 'data-callback-token');
                await dbp.isWidgetNotNotified('[data-sitekey="test-site-key-1"]', 'data-callback-token');
            });

            test('returns an error response when solving and the client sent no profile', async ({ dbp }) => {
                await dbp.navigatesTo(parentTargetPage);
                await dbp.receivesInlineAction(createSolveRecaptchaAction({ parent: createProfileMatchParent() }));

                await dbp.isCaptchaError();
                await dbp.doesInputValueEqual('#g-recaptcha-response', '');
                await dbp.doesInputValueEqual('#g-recaptcha-response-1', '');
                await dbp.doesInputValueEqual('#g-recaptcha-response-2', '');
            });

            test('returns an error response when solving and no record matches the user profile', async ({ dbp }) => {
                await dbp.navigatesTo(parentTargetPage);
                await dbp.receivesInlineAction(
                    createSolveRecaptchaAction({ parent: createProfileMatchParent() }, { userProfile: nonMatchingUserProfile }),
                );

                await dbp.isCaptchaError();
            });

            test('returns an error when the matched record has no resolvable widget id', async ({ dbp }) => {
                await dbp.navigatesTo(parentTargetPage);
                await dbp.removesRecaptchaWidgetId(2);

                await dbp.receivesInlineAction(createSolveRecaptchaAction({ parent: createProfileMatchParent() }, { userProfile }));

                await dbp.isCaptchaError();
                await dbp.doesInputValueEqual('#captcha-response-without-widget-id', '');
            });
        });

        test('remove query params from captcha url', async ({ dbp }) => {
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
            test('returns the expected response for the correct action data', async ({ dbp }) => {
                await dbp.navigatesTo(imageCaptchaTargetPage);
                await dbp.receivesInlineAction(createGetImageCaptchaInfoAction({ selector: '#svg-captcha-rendering svg' }));
                const sucessResponse = await dbp.getSuccessResponse();
                dbp.isCaptchaMatch(sucessResponse, { captchaType: 'image', targetPage: imageCaptchaTargetPage });
            });

            test('returns an error response when the selector is not an svg or image tag', async ({ dbp }) => {
                await dbp.navigatesTo(imageCaptchaTargetPage);
                await dbp.receivesInlineAction(createGetImageCaptchaInfoAction({ selector: '#svg-captcha-rendering' }));

                await dbp.isCaptchaError();
            });

            test('preserves the original format/header for a gif captcha already inlined as a data URL', async ({ dbp }) => {
                await dbp.navigatesTo(imageCaptchaTargetPage);
                await dbp.receivesInlineAction(createGetImageCaptchaInfoAction({ selector: '#gifCaptchaImage' }));
                const successResponse = await dbp.getSuccessResponse();

                // The src is already a base64 data URL, so it is returned as-is (not re-encoded), keeping
                // its 'image/gif' header instead of being flattened to a single-frame jpeg.
                expect(successResponse.siteKey).toMatch(/^data:image\/gif;base64,/);
            });

            test('preserves the original format/header for a url-hosted gif captcha', async ({ dbp }) => {
                await dbp.navigatesTo(imageCaptchaTargetPage);
                await dbp.receivesInlineAction(createGetImageCaptchaInfoAction({ selector: '#hostedGifCaptchaImage' }));
                const successResponse = await dbp.getSuccessResponse();

                // The src is a hosted URL, so the bytes are fetched and encoded — still preserving the
                // 'image/gif' header rather than flattening to a single-frame jpeg.
                expect(successResponse.siteKey).toMatch(/^data:image\/gif;base64,/);
            });

            test('returns an error response when a url-hosted captcha image cannot be fetched', async ({ dbp }) => {
                await dbp.navigatesTo(imageCaptchaTargetPage);
                await dbp.receivesInlineAction(createGetImageCaptchaInfoAction({ selector: '#missingHostedCaptchaImage' }));

                // A non-ok fetch (404 here) must fail rather than base64-encoding the error body and
                // sending non-image bytes to dbp-api as the siteKey.
                await dbp.isCaptchaError();
            });

            test('reports the requested alias type to the backend for an aliased image captcha', async ({ dbp }) => {
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
            test('solves the captcha for the correct action data', async ({ dbp }) => {
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
            test('returns the expected response for the correct action data', async ({ dbp }) => {
                await dbp.navigatesTo(cloudFlareCaptchaTargetPage);
                await dbp.receivesInlineAction(createGetCloudFlareCaptchaInfoAction({ selector: '#captcha-widget' }));
                const sucessResponse = await dbp.getSuccessResponse();

                dbp.isCaptchaMatch(sucessResponse, {
                    captchaType: 'cloudFlareTurnstile',
                    targetPage: cloudFlareCaptchaTargetPage,
                    siteKey: '0x4AAAAAAA34NY6rivjWMWoq',
                });
            });

            test('returns an error if the sitekey attribute is missing', async ({ dbp }) => {
                await dbp.navigatesTo(cloudFlareCaptchaTargetPage);
                await dbp.receivesInlineAction(createGetCloudFlareCaptchaInfoAction({ selector: '#missing-sitekey' }));

                await dbp.isCaptchaError();
            });
        });

        test.describe('solveCaptchaInfo', () => {
            test('returns an error if the callback attribute is missing', async ({ dbp }) => {
                await dbp.navigatesTo(cloudFlareCaptchaTargetPage);
                await dbp.receivesInlineAction(createSolveCloudFlareCaptchaAction({ selector: '#missing-callback' }));

                await dbp.isCaptchaError();
            });

            test('solves the captcha for the correct action data', async ({ dbp }) => {
                await dbp.navigatesTo(cloudFlareCaptchaTargetPage);
                await dbp.receivesInlineAction(createSolveCloudFlareCaptchaAction({ selector: '#captcha-widget' }));
                dbp.getSuccessResponse();

                await dbp.isCaptchaTokenFilled("//input[@name='cf-turnstile-response']");
            });
        });
    });
});
