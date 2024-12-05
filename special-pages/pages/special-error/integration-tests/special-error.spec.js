import { test } from '@playwright/test';
import { SpecialErrorPage } from './special-error';
import { phishingMalwareHelpPageURL, reportSiteAsSafeFormURL } from '../app/constants';

test.describe('special-error', () => {
    test('initial handshake', async ({ page }, workerInfo) => {
        const releaseNotes = SpecialErrorPage.create(page, workerInfo);
        await releaseNotes.reducedMotion();
        await releaseNotes.darkMode();
        await releaseNotes.openPage();
        await releaseNotes.didSendInitialHandshake();
    });

    test('exception handling', async ({ page }, workerInfo) => {
        const releaseNotes = SpecialErrorPage.create(page, workerInfo);
        await releaseNotes.reducedMotion();
        await releaseNotes.openPage({ env: 'app', willThrow: true });
        await releaseNotes.handlesFatalException();
    });

    test('shows SSL expired cert error', async ({ page }, workerInfo) => {
        const special = SpecialErrorPage.create(page, workerInfo);
        await special.openPage({ errorId: 'ssl.expired' });
        await special.showsExpiredPage();
    });

    test('shows SSL expired cert error in polish', async ({ page }, workerInfo) => {
        const special = SpecialErrorPage.create(page, workerInfo);
        await special.openPage({ errorId: 'ssl.expired', locale: 'pl' });
        await special.showsExpiredPageInPolish();
    });

    test('shows SSL invalid cert error', async ({ page }, workerInfo) => {
        const special = SpecialErrorPage.create(page, workerInfo);
        await special.openPage({ errorId: 'ssl.invalid' });
        await special.showsInvalidPage();
    });

    test('shows SSL self signed cert error', async ({ page }, workerInfo) => {
        const special = SpecialErrorPage.create(page, workerInfo);
        await special.openPage({ errorId: 'ssl.selfSigned' });
        await special.showsSelfSignedPage();
    });

    test('shows SSL wrong host error', async ({ page }, workerInfo) => {
        const special = SpecialErrorPage.create(page, workerInfo);
        await special.openPage({ errorId: 'ssl.wrongHost' });
        await special.showsWrongHostPage();
    });

    test('shows phishing warning', async ({ page }, workerInfo) => {
        const special = SpecialErrorPage.create(page, workerInfo);
        await special.openPage({ errorId: 'phishing' });
        await special.showsPhishingPage();
    });

    test('shows malware warning', async ({ page }, workerInfo) => {
        const special = SpecialErrorPage.create(page, workerInfo);
        await special.openPage({ errorId: 'malware' });
        await special.showsMalwarePage();
    });

    test('leaves site', async ({ page }, workerInfo) => {
        const special = SpecialErrorPage.create(page, workerInfo);
        await special.openPage({ errorId: 'ssl.expired' });
        await special.leavesSite();
    });

    test('visits site', async ({ page }, workerInfo) => {
        const special = SpecialErrorPage.create(page, workerInfo);
        await special.openPage({ errorId: 'ssl.expired' });
        await special.visitsSite();
    });

    test('opens phishing help page in a new window', async ({ page }, workerInfo) => {
        const special = SpecialErrorPage.create(page, workerInfo);
        await special.overrideTestLinks();

        const expectedURL = `${phishingMalwareHelpPageURL}`;

        await special.openPage({ errorId: 'phishing' });
        await special.opensNewPage('Learn more', expectedURL);
        await special.showsAdvancedInfo();
        await special.opensNewPage('Phishing and Malware Protection help page', expectedURL);
    });

    test('opens malware help page in a new window', async ({ page }, workerInfo) => {
        const special = SpecialErrorPage.create(page, workerInfo);
        await special.overrideTestLinks();

        const expectedURL = `${phishingMalwareHelpPageURL}`;

        await special.openPage({ errorId: 'malware' });
        await special.opensNewPage('Learn more', expectedURL);
    });

    test('opens report form in a new window', async ({ page, browser }, workerInfo) => {
        const special = SpecialErrorPage.create(page, workerInfo);
        await special.overrideTestLinks();

        const url = new URL(reportSiteAsSafeFormURL);
        url.searchParams.set('url', 'https://privacy-test-pages.site/security/badware/malware.html');

        await special.openPage({ errorId: 'malware' });
        await special.showsAdvancedInfo();
        await special.opensNewPage('report an error', url.toString());
    });
});
