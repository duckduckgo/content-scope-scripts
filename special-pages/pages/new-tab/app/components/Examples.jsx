import { Fragment, h } from 'preact';
import { PrivacyStatsMockProvider } from '../privacy-stats/mocks/PrivacyStatsMockProvider.js';
import { Body, Heading, PrivacyStatsConsumer } from '../privacy-stats/PrivacyStats.js';
import { RemoteMessagingFramework } from '../remote-messaging-framework/RemoteMessagingFramework.js';
import { NextStepsCard } from '../next-steps/NextStepsCard.js';
import { NextStepsCardGroup, NextStepsBubbleHeader } from '../next-steps/NextStepsGroup.js';
import { stats } from '../privacy-stats/mocks/stats.js';
import { noop } from '../utils.js';
import { VisibilityMenu } from '../customizer/VisibilityMenu.js';
import { CustomizerButton } from '../customizer/Customizer.js';
import { rmfDataExamples } from '../remote-messaging-framework/mocks/rmf.data.js';
import { favoritesExamples } from '../favorites/components/FavoritesExamples.js';

/** @type {Record<string, {factory: () => import("preact").ComponentChild}>} */
export const mainExamples = {
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
        factory: () => <Body trackerCompanies={stats.few.trackerCompanies} listAttrs={{ id: 'example-stats.list' }} />,
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
    'rmf.small': {
        factory: () => <RemoteMessagingFramework message={rmfDataExamples.small.content} dismiss={() => {}} />,
    },
    'rmf.medium': {
        factory: () => <RemoteMessagingFramework message={rmfDataExamples.medium.content} dismiss={() => {}} />,
    },
    'rmf.big-single-action': {
        factory: () => (
            <RemoteMessagingFramework message={rmfDataExamples.big_single_action.content} primaryAction={() => {}} dismiss={() => {}} />
        ),
    },
    'rmf.big-two-action': {
        factory: () => (
            <RemoteMessagingFramework
                message={rmfDataExamples.big_two_action.content}
                primaryAction={() => {}}
                secondaryAction={() => {}}
                dismiss={() => {}}
            />
        ),
    },
    ...favoritesExamples,
    'next-steps.bringStuff': {
        factory: () => <NextStepsCard type="bringStuff" dismiss={noop('dismiss')} action={noop('action')} />,
    },
    'next-steps.duckplayer': {
        factory: () => <NextStepsCard type="duckplayer" dismiss={noop('dismiss')} action={noop('action')} />,
    },
    'next-steps.defaultApp': {
        factory: () => <NextStepsCard type="defaultApp" dismiss={noop('dismiss')} action={noop('action')} />,
    },
    'next-steps.emailProtection': {
        factory: () => <NextStepsCard type="emailProtection" dismiss={noop('dismiss')} action={noop('action')} />,
    },
    'next-steps.blockCookies': {
        factory: () => <NextStepsCard type="blockCookies" dismiss={noop('dismiss')} action={noop('action')} />,
    },
    'next-steps.addAppDockMac': {
        factory: () => <NextStepsCard type="addAppDockMac" dismiss={noop('dismiss')} action={noop('action')} />,
    },
    'next-steps.pinToTaskbarWindows': {
        factory: () => <NextStepsCard type="pinAppToTaskbarWindows" dismiss={noop('dismiss')} action={noop('action')} />,
    },
    'next-steps.bubble': {
        factory: () => <NextStepsBubbleHeader />,
    },
    'next-steps.cardGroup.all': {
        factory: () => (
            <NextStepsCardGroup
                types={[
                    'bringStuff',
                    'defaultApp',
                    'blockCookies',
                    'emailProtection',
                    'duckplayer',
                    'addAppDockMac',
                    'pinAppToTaskbarWindows',
                ]}
                expansion="collapsed"
                toggle={noop('toggle')}
                dismiss={noop('dismiss')}
                action={noop('action')}
                animation="None"
            />
        ),
    },
    'next-steps.cardGroup.all-expanded': {
        factory: () => (
            <NextStepsCardGroup
                types={[
                    'bringStuff',
                    'defaultApp',
                    'blockCookies',
                    'emailProtection',
                    'duckplayer',
                    'addAppDockMac',
                    'pinAppToTaskbarWindows',
                ]}
                expansion="expanded"
                toggle={noop('toggle')}
                dismiss={noop('dismiss')}
                action={noop('action')}
                animation="None"
            />
        ),
    },
    'next-steps.cardGroup.two': {
        factory: () => (
            <NextStepsCardGroup
                types={['bringStuff', 'defaultApp']}
                expansion="collapsed"
                toggle={noop('toggle')}
                dismiss={noop('dismiss')}
                action={noop('action')}
                animation="None"
            />
        ),
    },
    'next-steps.cardGroup.one': {
        factory: () => (
            <NextStepsCardGroup
                types={['bringStuff']}
                expansion="collapsed"
                toggle={noop('toggle')}
                dismiss={noop('dismiss')}
                action={noop('action')}
                animation="None"
            />
        ),
    },
};

export const otherExamples = {
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
    'rmf.big-two-action-overflow': {
        factory: () => (
            <RemoteMessagingFramework
                message={rmfDataExamples.big_two_action_overflow.content}
                primaryAction={() => {}}
                secondaryAction={() => {}}
                dismiss={() => {}}
            />
        ),
    },
    'customizer-menu': {
        factory: () => (
            <Fragment>
                <div>
                    <CustomizerButton isOpen={true} />
                </div>
                <br />
                <MaxContent>
                    <VisibilityMenu
                        rows={[
                            {
                                id: 'favorites',
                                title: 'Favorites',
                                icon: 'star',
                                toggle: noop('toggle favorites'),
                                visibility: 'hidden',
                                index: 0,
                            },
                            {
                                id: 'privacyStats',
                                title: 'Privacy Stats',
                                icon: 'shield',
                                toggle: noop('toggle favorites'),
                                visibility: 'visible',
                                index: 1,
                            },
                        ]}
                    />
                </MaxContent>
            </Fragment>
        ),
    },
};

function MaxContent({ children }) {
    return <div style={{ display: 'grid', gridTemplateColumns: 'max-content' }}>{children}</div>;
}
