import { test as base } from '@playwright/test';
import { createConfiguredDbpTest } from './fixtures';
import { createGetRecaptchaInfoAction, createSolveRecaptchaAction } from '../mocks/broker-protection/captcha.js';
import { BROKER_PROTECTION_CONFIGS } from './tests-config.js';

const test = createConfiguredDbpTest(base);

test.describe('Broker Protection Captcha', () => {
    test.describe('recaptcha2', () => {
        const recaptchaTargetPage = 're-captcha.html';
        const recaptchaResponseSelector = '#g-recaptcha-response';

        test.describe('getCaptchaInfo', () => {
            test.describe('with useEnhancedCaptchaSystem: "enabled"', () => {
                test('returns the expected response for the correct action data', async ({ createConfiguredDbp }) => {
                    const dbp = await createConfiguredDbp(BROKER_PROTECTION_CONFIGS.enhancedCaptchaSystemEnabled);
                    await dbp.navigatesTo(recaptchaTargetPage);
                    await dbp.receivesInlineAction(createGetRecaptchaInfoAction());
                    const sucessResponse = await dbp.getSuccessResponse();

                    dbp.isCaptchaMatch(sucessResponse, { captchaType: 'recaptcha2', targetPage: recaptchaTargetPage });
                });

                test('returns the expected response for the correct action data without the "captchaType" field', async ({
                    createConfiguredDbp,
                }) => {
                    const dbp = await createConfiguredDbp(BROKER_PROTECTION_CONFIGS.enhancedCaptchaSystemEnabled);
                    await dbp.navigatesTo(recaptchaTargetPage);
                    await dbp.receivesInlineAction(createGetRecaptchaInfoAction({ captchaType: undefined }));
                    const sucessResponse = await dbp.getSuccessResponse();

                    dbp.isCaptchaMatch(sucessResponse, { captchaType: 'recaptcha2', targetPage: recaptchaTargetPage });
                });

                test('returns the expected type when the "captchaType" field does not match the detected captcha type', async ({
                    createConfiguredDbp,
                }) => {
                    const dbp = await createConfiguredDbp(BROKER_PROTECTION_CONFIGS.enhancedCaptchaSystemEnabled);
                    await dbp.navigatesTo(recaptchaTargetPage);
                    await dbp.receivesInlineAction(createGetRecaptchaInfoAction({ captchaType: 'recaptchaEnterprise' }));
                    const sucessResponse = await dbp.getSuccessResponse();

                    dbp.isCaptchaMatch(sucessResponse, { captchaType: 'recaptcha2', targetPage: recaptchaTargetPage });
                });

                test('returns an error response for an action data with an invalid "captchaType" field', async ({
                    createConfiguredDbp,
                }) => {
                    const dbp = await createConfiguredDbp(BROKER_PROTECTION_CONFIGS.enhancedCaptchaSystemEnabled);
                    await dbp.navigatesTo(recaptchaTargetPage);
                    await dbp.receivesInlineAction(createGetRecaptchaInfoAction({ captchaType: 'invalid' }));

                    await dbp.isCaptchaError();
                });
            });

            test.describe('with useEnhancedCaptchaSystem: "disabled"', () => {
                test('returns the expected response for the correct action data', async ({ createConfiguredDbp }) => {
                    const dbp = await createConfiguredDbp(BROKER_PROTECTION_CONFIGS.enhancedCaptchaSystemDisabled);
                    await dbp.navigatesTo(recaptchaTargetPage);
                    await dbp.receivesInlineAction(createGetRecaptchaInfoAction());
                    const sucessResponse = await dbp.getSuccessResponse();

                    dbp.isCaptchaMatch(sucessResponse, { captchaType: 'recaptcha2', targetPage: recaptchaTargetPage });
                });

                test('returns the expected response for the correct action data without the "captchaType" field', async ({
                    createConfiguredDbp,
                }) => {
                    const dbp = await createConfiguredDbp(BROKER_PROTECTION_CONFIGS.enhancedCaptchaSystemDisabled);
                    await dbp.navigatesTo(recaptchaTargetPage);
                    await dbp.receivesInlineAction(createGetRecaptchaInfoAction({ captchaType: undefined }));
                    const sucessResponse = await dbp.getSuccessResponse();

                    dbp.isCaptchaMatch(sucessResponse, { captchaType: 'recaptcha2', targetPage: recaptchaTargetPage });
                });

                test('returns the expected type when the "captchaType" field does not match the detected captcha type', async ({
                    createConfiguredDbp,
                }) => {
                    const dbp = await createConfiguredDbp(BROKER_PROTECTION_CONFIGS.enhancedCaptchaSystemDisabled);
                    await dbp.navigatesTo(recaptchaTargetPage);
                    await dbp.receivesInlineAction(createGetRecaptchaInfoAction({ captchaType: 'recaptchaEnterprise' }));
                    const sucessResponse = await dbp.getSuccessResponse();

                    dbp.isCaptchaMatch(sucessResponse, { captchaType: 'recaptcha2', targetPage: recaptchaTargetPage });
                });

                test('returns the expected response for an action data with an invalid "captchaType" field', async ({
                    createConfiguredDbp,
                }) => {
                    const dbp = await createConfiguredDbp(BROKER_PROTECTION_CONFIGS.enhancedCaptchaSystemDisabled);
                    await dbp.navigatesTo(recaptchaTargetPage);
                    await dbp.receivesInlineAction(createGetRecaptchaInfoAction({ captchaType: 'invalid' }));
                    const sucessResponse = await dbp.getSuccessResponse();

                    dbp.isCaptchaMatch(sucessResponse, { captchaType: 'recaptcha2', targetPage: recaptchaTargetPage });
                });
            });
        });

        test.describe('solveCaptchaInfo', () => {
            test.describe('with useEnhancedCaptchaSystem: "enabled"', () => {
                test('solves the captcha for the correct action data', async ({ createConfiguredDbp }) => {
                    const dbp = await createConfiguredDbp(BROKER_PROTECTION_CONFIGS.enhancedCaptchaSystemEnabled);
                    await dbp.navigatesTo(recaptchaTargetPage);
                    await dbp.receivesInlineAction(createSolveRecaptchaAction());
                    dbp.getSuccessResponse();

                    await dbp.isCaptchaTokenFilled(recaptchaResponseSelector);
                });

                test('solves the captcha for the correct action data without the "captchaType" field', async ({ createConfiguredDbp }) => {
                    const dbp = await createConfiguredDbp(BROKER_PROTECTION_CONFIGS.enhancedCaptchaSystemEnabled);
                    await dbp.navigatesTo(recaptchaTargetPage);
                    await dbp.receivesInlineAction(createSolveRecaptchaAction({ captchaType: undefined }));
                    dbp.getSuccessResponse();

                    await dbp.isCaptchaTokenFilled(recaptchaResponseSelector);
                });

                test('solves the captcha for an action data when the "captchaType" field does not match the detected captcha type', async ({
                    createConfiguredDbp,
                }) => {
                    const dbp = await createConfiguredDbp(BROKER_PROTECTION_CONFIGS.enhancedCaptchaSystemEnabled);
                    await dbp.navigatesTo(recaptchaTargetPage);
                    await dbp.receivesInlineAction(createSolveRecaptchaAction({ captchaType: 'recaptchaEnterprise' }));
                    dbp.getSuccessResponse();

                    await dbp.isCaptchaTokenFilled(recaptchaResponseSelector);
                });

                test('returns an error response for an action data with an invalid "captchaType" field', async ({
                    createConfiguredDbp,
                }) => {
                    const dbp = await createConfiguredDbp(BROKER_PROTECTION_CONFIGS.enhancedCaptchaSystemEnabled);
                    await dbp.navigatesTo(recaptchaTargetPage);
                    await dbp.receivesInlineAction(createSolveRecaptchaAction({ captchaType: 'invalid' }));

                    await dbp.isCaptchaError();
                });
            });

            test.describe('with useEnhancedCaptchaSystem: "disabled"', () => {
                test('solves the captcha for the correct action data', async ({ createConfiguredDbp }) => {
                    const dbp = await createConfiguredDbp(BROKER_PROTECTION_CONFIGS.enhancedCaptchaSystemDisabled);
                    await dbp.navigatesTo(recaptchaTargetPage);
                    await dbp.receivesInlineAction(createSolveRecaptchaAction());
                    dbp.getSuccessResponse();

                    await dbp.isCaptchaTokenFilled(recaptchaResponseSelector);
                });

                test('solves the captcha for the correct action data without the "captchaType" field', async ({ createConfiguredDbp }) => {
                    const dbp = await createConfiguredDbp(BROKER_PROTECTION_CONFIGS.enhancedCaptchaSystemDisabled);
                    await dbp.navigatesTo(recaptchaTargetPage);
                    await dbp.receivesInlineAction(createSolveRecaptchaAction({ captchaType: undefined }));
                    dbp.getSuccessResponse();

                    await dbp.isCaptchaTokenFilled(recaptchaResponseSelector);
                });

                test('solves the captcha for an action when the "captchaType" field does not match the detected captcha type', async ({
                    createConfiguredDbp,
                }) => {
                    const dbp = await createConfiguredDbp(BROKER_PROTECTION_CONFIGS.enhancedCaptchaSystemDisabled);
                    await dbp.navigatesTo(recaptchaTargetPage);
                    await dbp.receivesInlineAction(createSolveRecaptchaAction({ captchaType: 'recaptchaEnterprise' }));
                    dbp.getSuccessResponse();

                    await dbp.isCaptchaTokenFilled(recaptchaResponseSelector);
                });

                test('solves the captcha for an action data with an invalid "captchaType" field', async ({ createConfiguredDbp }) => {
                    const dbp = await createConfiguredDbp(BROKER_PROTECTION_CONFIGS.enhancedCaptchaSystemDisabled);
                    await dbp.navigatesTo(recaptchaTargetPage);
                    await dbp.receivesInlineAction(createSolveRecaptchaAction({ captchaType: 'invalid' }));
                    dbp.getSuccessResponse();

                    await dbp.isCaptchaTokenFilled(recaptchaResponseSelector);
                });
            });
        });

        test('remove query params from captcha url', async ({ createConfiguredDbp }) => {
            const dbp = await createConfiguredDbp(BROKER_PROTECTION_CONFIGS.enhancedCaptchaSystemEnabled);
            await dbp.navigatesTo('re-captcha.html?fname=john&lname=smith');
            await dbp.receivesInlineAction(createGetRecaptchaInfoAction());
            const sucessResponse = await dbp.getSuccessResponse();

            dbp.isQueryParamRemoved(sucessResponse);
        });
    });
});
