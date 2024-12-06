import { h } from 'preact';
import { PrivacyProMockProvider } from '../mocks/PrivacyProMockProvider.js';
import { data } from '../mocks/stats.js';
import { PrivacyProConsumer } from './PrivacyPro.js';

/** @type {Record<string, {factory: () => import("preact").ComponentChild}>} */

export const privacyProExamples = {
    'privacyPro.locationString': {
        factory: () => (
            <PrivacyProMockProvider ticker={true} data={data.locationString}>
                <PrivacyProConsumer />
            </PrivacyProMockProvider>
        ),
    },
    'privacyPro.empty': {
        factory: () => (
            <PrivacyProMockProvider config={{ expansion: 'collapsed' }} data={data.unsubscribed}>
                <PrivacyProConsumer />
            </PrivacyProMockProvider>
        ),
    },
    'privacyPro.single': {
        factory: () => (
            <PrivacyProMockProvider data={data.basic} config={{ expansion: 'collapsed' }}>
                <PrivacyProConsumer />
            </PrivacyProMockProvider>
        ),
    },
};
