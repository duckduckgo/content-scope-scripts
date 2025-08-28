import { test } from '@playwright/test';
import { NewtabPage } from '../../../integration-tests/new-tab.page.js';
import { OmnibarPage } from './omnibar.page.js';
import { CustomizerPage } from '../../customizer/integration-tests/customizer.page.js';

test.describe('omnibar widget persistence', () => {
    test('remembers input across tabs', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const omnibar = new OmnibarPage(ntp);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { omnibar: true, tabs: true, 'tabs.debug': true } });
        await omnibar.ready();

        // first fill
        await omnibar.types({ mode: 'search', value: 'shoes' });

        // switch
        await omnibar.didSwitchToTab('02', ['01', '02']);
        await omnibar.expectInputValue('');

        // second fill
        await omnibar.types({ mode: 'search', value: 'dresses' });

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
        await omnibar.types({ mode: 'search', value: 'shoes' });
        await page.getByRole('tab', { name: 'Duck.ai' }).click();

        // new tab, should be opened with duck.ai input still visible
        await omnibar.didSwitchToTab('02', ['01', '02']);
        await omnibar.expectChatValue('');

        // switch back
        await omnibar.didSwitchToTab('01', ['01', '02']);
        await omnibar.expectChatValue('shoes');
    });
    test('adjusts mode of other tabs when duck.ai is disabled', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const omnibar = new OmnibarPage(ntp);
        const customizer = new CustomizerPage(ntp);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { omnibar: true, tabs: true, 'tabs.debug': true } });
        await omnibar.ready();

        // first tab, switch to ai mode
        await omnibar.switchMode({ mode: 'ai' });

        // switch to second tab, should be empty but still on duck.ai
        await omnibar.didSwitchToTab('02', ['01', '02']);
        await omnibar.expectValue({ value: '', mode: 'ai' });
        await omnibar.types({ value: 'shoes', mode: 'ai' });

        // now turn duck.ai off, 'shoes' should remain, but on search mode
        await customizer.opensCustomizer();
        await omnibar.toggleDuckAiButton().uncheck();
        await omnibar.expectValue({ value: 'shoes', mode: 'search' });

        // back to first tab, should be empty + search
        await omnibar.didSwitchToTab('01', ['01', '02']);
        await omnibar.expectValue({ value: '', mode: 'search' });
    });
    test('adjusts mode of other tabs when duck.ai is globally disabled', async ({ page }, workerInfo) => {
        const ntp = NewtabPage.create(page, workerInfo);
        const omnibar = new OmnibarPage(ntp);
        await ntp.reducedMotion();
        await ntp.openPage({ additional: { omnibar: true, tabs: true, 'tabs.debug': true } });
        await omnibar.ready();

        // first tab, switch to ai mode
        await omnibar.switchMode({ mode: 'ai' });

        // switch to second tab, should be empty but still on duck.ai
        await omnibar.didSwitchToTab('02', ['01', '02']);
        await omnibar.expectValue({ value: '', mode: 'ai' });

        // disable globally
        await omnibar.didDisableGlobally();
        await omnibar.expectValue({ value: '', mode: 'search' });

        // back to first tab, should now also be search
        await omnibar.didSwitchToTab('01', ['01', '02']);
        await omnibar.expectValue({ value: '', mode: 'search' });
    });
});
