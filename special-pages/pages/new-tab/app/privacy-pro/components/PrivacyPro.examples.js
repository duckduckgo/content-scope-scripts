import { h } from 'preact';
import { PrivacyProMockProvider } from '../mocks/PrivacyProMockProvider.js';
import { stats } from '../mocks/stats.js';
import { PrivacyProConsumer } from './PrivacyPro.js';

/** @type {Record<string, {factory: () => import("preact").ComponentChild}>} */

export const privacyProExamples = {
    'privacyPro.few': {
        factory: () => (
            <PrivacyProMockProvider ticker={true}>
                <PrivacyProConsumer />
            </PrivacyProMockProvider>
        ),
    },
    'privacyPro.few.collapsed': {
        factory: () => (
            <PrivacyProMockProvider config={{ expansion: 'collapsed' }}>
                <PrivacyProConsumer />
            </PrivacyProMockProvider>
        ),
    },
    'privacyPro.single': {
        factory: () => (
            <PrivacyProMockProvider data={stats.single}>
                <PrivacyProConsumer />
            </PrivacyProMockProvider>
        ),
    },
};
