import { test, expect } from '@playwright/test';
import { NewtabPage } from '../../../integration-tests/new-tab.page.js';
import { OmnibarPage } from './omnibar.page.js';

test.describe('omnibar widget', () => {
    test('fetches config on load', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        await ntp.reducedMotion();

        await ntp.openPage({ additional: { omnibar: true, 'omnibar.enableAi': true } });
        await ntp.mocks.waitForCallCount({ method: 'initialSetup', count: 1 });
        await ntp.mocks.waitForCallCount({ method: 'omnibar_getConfig', count: 1 });
    });

    test('search form submission', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const omnibar = new OmnibarPage(ntp);
        await ntp.reducedMotion();

        await ntp.openPage({ additional: { omnibar: true } });
        await omnibar.ready();

        await omnibar.searchInput().fill('pizza');
        await omnibar.searchInput().press('Enter');

        await omnibar.expectMethodCalledWith('omnibar_submitSearch', {
            term: 'pizza',
            target: 'same-tab',
        });
    });

    test('AI chat form submission', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const omnibar = new OmnibarPage(ntp);
        await ntp.reducedMotion();

        await ntp.openPage({ additional: { omnibar: true } });
        await omnibar.ready();

        await omnibar.aiTab().click();
        await omnibar.expectMode('ai');

        await omnibar.chatInput().fill('pizza');
        await omnibar.chatInput().press('Enter');

        await omnibar.expectMethodCalledWith('omnibar_submitChat', {
            chat: 'pizza',
            target: 'same-tab',
        });
    });

    test('AI chat button in search form submits chat message', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const omnibar = new OmnibarPage(ntp);
        await ntp.reducedMotion();

        await ntp.openPage({ additional: { omnibar: true } });
        await omnibar.ready();

        await omnibar.searchInput().fill('pizza');
        await omnibar.aiChatButton().click();

        await omnibar.expectMethodCalledWith('omnibar_submitChat', {
            chat: 'pizza',
            target: 'same-tab',
        });
    });

    test('mode switching preserves query state', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const omnibar = new OmnibarPage(ntp);
        await ntp.reducedMotion();

        await ntp.openPage({ additional: { omnibar: true } });
        await omnibar.ready();

        // Start in search mode, type query
        await omnibar.searchInput().fill('pizza');
        await expect(omnibar.searchInput()).toHaveValue('pizza');

        // Switch to AI mode
        await omnibar.aiTab().click();
        await omnibar.expectMode('ai');
        await expect(omnibar.chatInput()).toHaveValue('pizza');

        // Switch back to search mode
        await omnibar.searchTab().click();
        await omnibar.expectMode('search');
        await expect(omnibar.searchInput()).toHaveValue('pizza');
    });

    test('omnibar without AI enabled does not show tab list', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const omnibar = new OmnibarPage(ntp);
        await ntp.reducedMotion();

        await ntp.openPage({ additional: { omnibar: true, 'omnibar.enableAi': false } });
        await omnibar.ready();

        await expect(omnibar.tabList()).toHaveCount(0);
    });
});
