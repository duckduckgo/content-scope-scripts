import { h } from 'preact';
import { noop } from '../../utils.js';
import { PrivacyStatsMockProvider } from '../mocks/PrivacyStatsMockProvider.js';
import { PrivacyStatsConsumer, PrivacyStatsBody, Heading } from './PrivacyStats.js';
import { stats } from '../mocks/stats.js';

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
    'stats.heading': {
        factory: () => (
            <Heading
                trackerCompanies={stats.few.trackerCompanies}
                totalCount={stats.few.totalCount}
                expansion={'expanded'}
                onToggle={noop('stats.heading onToggle')}
            />
        ),
    },
    'stats.heading.none': {
        factory: () => (
            <Heading
                trackerCompanies={stats.none.trackerCompanies}
                totalCount={stats.none.totalCount}
                expansion={'expanded'}
                onToggle={noop('stats.heading onToggle')}
            />
        ),
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
