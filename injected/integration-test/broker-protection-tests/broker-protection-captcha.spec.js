import { test as base } from '@playwright/test';
import { createConfiguredDbpTest } from './fixtures';
import { createGetRecaptchaInfoAction, createSolveRecaptchaAction } from '../mocks/broker-protection/captcha.js';
import { BROKER_PROTECTION_FEATURE_CONFIG_VARIATIONS } from './tests-config.js';

const test = createConfiguredDbpTest(base);

BROKER_PROTECTION_FEATURE_CONFIG_VARIATIONS.forEach((config) => {
    test.describe(`Broker Protection Captcha with settings: ${JSON.stringify(config.features.brokerProtection.settings)}`, () => {
        test.describe('getCaptchaInfo', () => {
            [
                {
                    captchaType: 'recaptcha2',
                    targetPage: 're-captcha.html',
                    action: createGetRecaptchaInfoAction(),
                },
                // TODO hCaptcha is not supported yet
                // {
                //     captchaType: 'hcaptcha',
                //     targetPage: 'h-captcha.html',
                //     action: createGetHCaptchaInfoAction(),
                // },
            ].forEach(({ captchaType, action, targetPage }) => {
                test(`validates ${captchaType}`, async ({ createConfiguredDbp }, workerInfo) => {
                    const dbp = await createConfiguredDbp(config);
                    await dbp.navigatesTo(targetPage);
                    await dbp.receivesInlineAction(action);
                    const sucessResponse = await dbp.getSuccessResponse();

                    dbp.isCaptchaMatch(sucessResponse, { captchaType, targetPage });
                });
            });
        });

        test.describe('solveCaptchaInfo', () => {
            [
                {
                    captchaType: 'recaptcha2',
                    targetPage: 're-captcha.html',
                    action: createSolveRecaptchaAction(),
                    responseElementSelector: '#g-recaptcha-response',
                },
                // TODO hCaptcha is not supported yet
                // {
                //     captchaType: 'hcaptcha',
                //     targetPage: 'h-captcha.html',
                //     action: createSolveHCaptchaAction(),
                //     responseElementSelector: '#h-captcha-response',
                // },
            ].forEach(({ captchaType, action, targetPage, responseElementSelector }) => {
                test(`validates ${captchaType}`, async ({ createConfiguredDbp }) => {
                    const dbp = await createConfiguredDbp(config);
                    await dbp.navigatesTo(targetPage);
                    await dbp.receivesInlineAction(action);
                    dbp.getSuccessResponse();

                    await dbp.isCaptchaTokenFilled(responseElementSelector);
                });
            });
        });

        test('remove query params from captcha url', async ({ createConfiguredDbp }) => {
            const dbp = await createConfiguredDbp(config);
            await dbp.navigatesTo('re-captcha.html?fname=john&lname=smith');
            await dbp.receivesInlineAction(createGetRecaptchaInfoAction());
            const sucessResponse = await dbp.getSuccessResponse();

            dbp.isQueryParamRemoved(sucessResponse);
        });
    });
});
