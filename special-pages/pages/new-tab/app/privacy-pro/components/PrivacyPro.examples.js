import { h } from 'preact';
import { PrivacyProMockProvider } from '../mocks/PrivacyProMockProvider.js';
import { data } from '../mocks/stats.js';
import { PrivacyProConsumer } from './PrivacyPro.js';

/** @type {Record<string, {factory: () => import("preact").ComponentChild}>} */

export const privacyProExamples = {
    'privacyPro.loggedInVPNOff': {
        factory: () => (
            <PrivacyProMockProvider ticker={true} data={data.locationString}>
                <PrivacyProConsumer />
            </PrivacyProMockProvider>
        ),
    },
    'privacyPro.nonsubscriber': {
        factory: () => (
            <PrivacyProMockProvider config={{ expansion: 'collapsed' }} data={data.unsubscribed}>
                <PrivacyProConsumer />
            </PrivacyProMockProvider>
        ),
    },
    'privacyPro.loggedIn': {
        factory: () => (
            <PrivacyProMockProvider data={data.basic} config={{ expansion: 'collapsed' }}>
                <PrivacyProConsumer />
            </PrivacyProMockProvider>
        ),
    },
};
