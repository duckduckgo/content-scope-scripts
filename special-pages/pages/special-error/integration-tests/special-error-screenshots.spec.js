/* global process */
import { expect, test } from '@playwright/test';
import { SpecialErrorPage } from './special-error';

const maxDiffPixels = 20;

test.describe('screenshots @screenshots', () => {
    test.skip(process.env.CI === 'true');

    test('SSL expired cert error', async ({ page }, workerInfo) => {
        const special = SpecialErrorPage.create(page, workerInfo);
        await special.openPage({ errorId: 'ssl.expired' });
        await expect(page).toHaveScreenshot('ssl-expired-cert.png', { maxDiffPixels });
    });

    test('SSL expired cert error with advanced info', async ({ page }, workerInfo) => {
        const special = SpecialErrorPage.create(page, workerInfo);
        await special.openPage({ errorId: 'ssl.expired' });
        await special.showsAdvancedInfo();
        await expect(page).toHaveScreenshot('ssl-expired-cert-advanced.png', { maxDiffPixels });
    });

    test('SSL expired cert error in Polish', async ({ page }, workerInfo) => {
        const special = SpecialErrorPage.create(page, workerInfo);
        await special.openPage({ errorId: 'ssl.expired', locale: 'pl' });
        await expect(page).toHaveScreenshot('ssl-expired-cert-pl.png', { maxDiffPixels });
    });

    test('SSL expired cert error with reduced motion', async ({ page }, workerInfo) => {
        const special = SpecialErrorPage.create(page, workerInfo);
        await special.reducedMotion();
        await special.openPage({ errorId: 'ssl.expired' });
        await special.showsAdvancedInfo();
        await expect(page).toHaveScreenshot('ssl-expired-cert-reduced-motion.png', { maxDiffPixels });
    });

    test('SSL invalid cert error', async ({ page }, workerInfo) => {
        const special = SpecialErrorPage.create(page, workerInfo);
        await special.openPage({ errorId: 'ssl.invalid' });
        await expect(page).toHaveScreenshot('ssl-invalid-cert.png', { maxDiffPixels });
    });

    test('SSL invalid cert error in Dutch', async ({ page }, workerInfo) => {
        const special = SpecialErrorPage.create(page, workerInfo);
        await special.openPage({ errorId: 'ssl.invalid', locale: 'nl' });
        await expect(page).toHaveScreenshot('ssl-invalid-cert-nl.png', { maxDiffPixels });
    });

    test('SSL self signed cert error', async ({ page }, workerInfo) => {
        const special = SpecialErrorPage.create(page, workerInfo);
        await special.openPage({ errorId: 'ssl.selfSigned' });
        await expect(page).toHaveScreenshot('ssl-self-signed-cert.png', { maxDiffPixels });
    });

    test('SSL self signed cert error in Spanish', async ({ page }, workerInfo) => {
        const special = SpecialErrorPage.create(page, workerInfo);
        await special.openPage({ errorId: 'ssl.selfSigned', locale: 'es' });
        await expect(page).toHaveScreenshot('ssl-self-signed-cert-es.png', { maxDiffPixels });
    });

    test('SSL wrong host error', async ({ page }, workerInfo) => {
        const special = SpecialErrorPage.create(page, workerInfo);
        await special.openPage({ errorId: 'ssl.wrongHost' });
        await expect(page).toHaveScreenshot('ssl-wrong-host.png', { maxDiffPixels });
    });

    test('SSL wrong host error in Romanian', async ({ page }, workerInfo) => {
        const special = SpecialErrorPage.create(page, workerInfo);
        await special.openPage({ errorId: 'ssl.wrongHost', locale: 'ro' });
        await expect(page).toHaveScreenshot('ssl-wrong-host-ro.png', { maxDiffPixels });
    });

    test('Phishing warning', async ({ page }, workerInfo) => {
        const special = SpecialErrorPage.create(page, workerInfo);
        await special.openPage({ errorId: 'phishing' });
        await expect(page).toHaveScreenshot('phishing-warning.png', { maxDiffPixels });
    });

    test('Phishing warning with advanced info', async ({ page }, workerInfo) => {
        const special = SpecialErrorPage.create(page, workerInfo);
        await special.openPage({ errorId: 'phishing' });
        await special.showsAdvancedInfo();
        await expect(page).toHaveScreenshot('phishing-warning-advanced.png', { maxDiffPixels });
    });

    test('Phishing warning with reduced motion', async ({ page }, workerInfo) => {
        const special = SpecialErrorPage.create(page, workerInfo);
        await special.reducedMotion();
        await special.openPage({ errorId: 'phishing' });
        await special.showsAdvancedInfo();
        await expect(page).toHaveScreenshot('phishing-warning-advanced.png', { maxDiffPixels });
    });

    test('Phishing warning in Portuguese', async ({ page }, workerInfo) => {
        const special = SpecialErrorPage.create(page, workerInfo);
        await special.openPage({ errorId: 'phishing', locale: 'pt' });
        await expect(page).toHaveScreenshot('phishing-warning-pt.png', { maxDiffPixels });
    });

    test('Phishing warning with advanced info in Bulgarian', async ({ page }, workerInfo) => {
        const special = SpecialErrorPage.create(page, workerInfo);
        await special.openPage({ errorId: 'phishing', locale: 'bg' });
        await special.showsAdvancedInfo('Разширени');
        await expect(page).toHaveScreenshot('phishing-warning-advanced-bg.png', { maxDiffPixels });
    });

    test('Malware warning', async ({ page }, workerInfo) => {
        const special = SpecialErrorPage.create(page, workerInfo);
        await special.openPage({ errorId: 'malware' });
        await expect(page).toHaveScreenshot('malware-warning.png', { maxDiffPixels });
    });

    test('Malware warning with advanced info', async ({ page }, workerInfo) => {
        const special = SpecialErrorPage.create(page, workerInfo);
        await special.openPage({ errorId: 'malware' });
        await special.showsAdvancedInfo();
        await expect(page).toHaveScreenshot('malware-warning-advanced.png', { maxDiffPixels });
    });

    test('Malware warning in Russian', async ({ page }, workerInfo) => {
        const special = SpecialErrorPage.create(page, workerInfo);
        await special.openPage({ errorId: 'malware', locale: 'ru' });
        await expect(page).toHaveScreenshot('malware-warning-ru.png', { maxDiffPixels });
    });

    test('Malware warning with advanced info in German', async ({ page }, workerInfo) => {
        const special = SpecialErrorPage.create(page, workerInfo);
        await special.openPage({ errorId: 'malware', locale: 'de' });
        await special.showsAdvancedInfo('Erweitert');
        await expect(page).toHaveScreenshot('malware-warning-advanced-de.png', { maxDiffPixels });
    });
});
