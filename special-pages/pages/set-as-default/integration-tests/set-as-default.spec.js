import { test } from '@playwright/test';
import { SetAsDefaultPage } from './set-as-default.js';

test.describe('set-as-default', () => {
    test('initial handshake', async ({ page }, workerInfo) => {
        const sad = SetAsDefaultPage.create(page, workerInfo);
        await sad.openPage();
        await sad.didSendInitialHandshake();
        await sad.didShowInstructions();
    });

    test('renders in dark mode', async ({ page }, workerInfo) => {
        const sad = SetAsDefaultPage.create(page, workerInfo);
        await sad.darkMode();
        await sad.openPage();
        await sad.didShowInstructions();
    });

    test('positions the arrow from query params', async ({ page }, workerInfo) => {
        const sad = SetAsDefaultPage.create(page, workerInfo);
        await sad.openPage({ query: { arrow_x: '300', arrow_y: '120' } });
        await sad.arrowHasPosition({ left: '300px', top: '120px' });
    });

    test('exception handling', async ({ page }, workerInfo) => {
        const sad = SetAsDefaultPage.create(page, workerInfo);
        await sad.openPage({ willThrow: true });
        await sad.handlesFatalException();
    });
});
