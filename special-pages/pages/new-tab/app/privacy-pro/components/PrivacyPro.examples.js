import { h } from 'preact';
import { PrivacyProMockProvider } from '../mocks/PrivacyProMockProvider.js';
import { data } from '../mocks/stats.js';
import { PrivacyProConsumer } from './PrivacyPro.js';

/** @type {Record<string, {factory: () => import("preact").ComponentChild}>} */

export const privacyProExamples = {
    'privacyPro.few': {
        factory: () => (
            <PrivacyProMockProvider ticker={true} data={data.basic}>
                <PrivacyProConsumer />
            </PrivacyProMockProvider>
        ),
    },
    'privacyPro.few.collapsed': {
        factory: () => (
            <PrivacyProMockProvider config={{ expansion: 'collapsed' }} data={data.basic}>
                <PrivacyProConsumer />
            </PrivacyProMockProvider>
        ),
    },
    'privacyPro.single': {
        factory: () => (
            <PrivacyProMockProvider data={data.basic}>
                <PrivacyProConsumer />
            </PrivacyProMockProvider>
        ),
    },
};
