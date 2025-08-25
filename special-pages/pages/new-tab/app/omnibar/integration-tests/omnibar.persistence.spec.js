import { test } from '@playwright/test';
import { NewtabPage } from '../../../integration-tests/new-tab.page.js';
import { OmnibarPage } from './omnibar.page.js';

test.describe('omnibar widget persistence', () => {
    test('remembers input across tabs', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const omnibar = new OmnibarPage(ntp);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { omnibar: true, tabs: true, 'tabs.debug': true } });
        await omnibar.ready();

        // first fill
        await omnibar.input({ mode: 'search', value: 'shoes' });

        // switch
        await omnibar.didSwitchToTab('02', ['01', '02']);
        await omnibar.expectInputValue('');

        // second fill
        await omnibar.input({ mode: 'search', value: 'dresses' });

        // back to first
        await omnibar.didSwitchToTab('01', ['01', '02']);
        await omnibar.expectInputValue('shoes');

        // back to second again
        await omnibar.didSwitchToTab('02', ['01', '02']);
        await omnibar.expectInputValue('dresses');
    });
    test('remembers `mode` across tabs', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const omnibar = new OmnibarPage(ntp);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { omnibar: true, tabs: true, 'tabs.debug': true } });
        await omnibar.ready();

        // first fill
        await omnibar.input({ mode: 'search', value: 'shoes' });
        await page.getByRole('tab', { name: 'Duck.ai' }).click();

        // new tab, should be opened with duck.ai input still visible
        await omnibar.didSwitchToTab('02', ['01', '02']);
        await omnibar.expectChatValue('');

        // switch back
        await omnibar.didSwitchToTab('01', ['01', '02']);
        await omnibar.expectChatValue('shoes');
    });
});
