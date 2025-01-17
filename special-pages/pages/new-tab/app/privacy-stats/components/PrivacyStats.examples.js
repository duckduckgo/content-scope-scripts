import { h } from 'preact';
import { PrivacyStatsMockProvider } from '../mocks/PrivacyStatsMockProvider.js';
import { PrivacyStatsConsumer, PrivacyStatsBody } from './PrivacyStats.js';
import { stats } from '../mocks/stats.js';

/** @type {Record<string, {factory: () => import("preact").ComponentChild}>} */

export const privacyStatsExamples = {
    'stats.few': {
        factory: () => (
            <PrivacyStatsMockProvider ticker={true}>
                <PrivacyStatsConsumer />
            </PrivacyStatsMockProvider>
        ),
    },
    'stats.few.collapsed': {
        factory: () => (
            <PrivacyStatsMockProvider config={{ expansion: 'collapsed' }}>
                <PrivacyStatsConsumer />
            </PrivacyStatsMockProvider>
        ),
    },
    'stats.single': {
        factory: () => (
            <PrivacyStatsMockProvider data={stats.single}>
                <PrivacyStatsConsumer />
            </PrivacyStatsMockProvider>
        ),
    },
    'stats.none': {
        factory: () => (
            <PrivacyStatsMockProvider data={stats.none}>
                <PrivacyStatsConsumer />
            </PrivacyStatsMockProvider>
        ),
    },
    'stats.norecent': {
        factory: () => (
            <PrivacyStatsMockProvider data={stats.norecent}>
                <PrivacyStatsConsumer />
            </PrivacyStatsMockProvider>
        ),
    },
    'stats.list': {
        factory: () => <PrivacyStatsBody trackerCompanies={stats.few.trackerCompanies} listAttrs={{ id: 'example-stats.list' }} />,
    },
};

export const otherPrivacyStatsExamples = {
    'stats.without-animation': {
        factory: () => (
            <PrivacyStatsMockProvider
                ticker={true}
                config={{
                    expansion: 'expanded',
                    animation: { kind: 'none' },
                }}
            >
                <PrivacyStatsConsumer />
            </PrivacyStatsMockProvider>
        ),
    },
    'stats.with-view-transitions': {
        factory: () => (
            <PrivacyStatsMockProvider
                ticker={true}
                config={{
                    expansion: 'expanded',
                    animation: { kind: 'view-transitions' },
                }}
            >
                <PrivacyStatsConsumer />
            </PrivacyStatsMockProvider>
        ),
    },
};
