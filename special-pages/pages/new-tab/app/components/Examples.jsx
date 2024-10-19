import { Fragment, h } from "preact";
import { PrivacyStatsMockProvider } from "../privacy-stats/mocks/PrivacyStatsMockProvider.js";
import { Body, Heading, PrivacyStatsConsumer } from "../privacy-stats/PrivacyStats.js";
import { RemoteMessagingFramework } from "../remote-messaging-framework/RemoteMessagingFramework.js";
import { stats } from "../privacy-stats/mocks/stats.js";
import { noop } from "../utils.js";
import { VisibilityMenu } from "../customizer/VisibilityMenu.js";
import { CustomizerButton } from "../customizer/Customizer.js";

/** @type {Record<string, {factory: () => import("preact").ComponentChild}>} */
export const mainExamples = {
    'stats.few': {
        factory: () => <PrivacyStatsMockProvider ticker={true}><PrivacyStatsConsumer /></PrivacyStatsMockProvider>
    },
    'stats.few.collapsed': {
        factory: () => <PrivacyStatsMockProvider config={{ expansion: "collapsed" }}><PrivacyStatsConsumer /></PrivacyStatsMockProvider>
    },
    'stats.single': {
        factory: () => <PrivacyStatsMockProvider data={stats.single}><PrivacyStatsConsumer /></PrivacyStatsMockProvider>
    },
    'stats.none': {
        factory: () => <PrivacyStatsMockProvider data={stats.none}><PrivacyStatsConsumer /></PrivacyStatsMockProvider>
    },
    'stats.norecent': {
        factory: () => <PrivacyStatsMockProvider
            data={stats.norecent}><PrivacyStatsConsumer /></PrivacyStatsMockProvider>
    },
    'stats.list': {
        factory: () => <Body trackerCompanies={stats.few.trackerCompanies} id='example-stats.list' />
    },
    'stats.heading': {
        factory: () => <Heading trackerCompanies={stats.few.trackerCompanies} totalCount={stats.few.totalCount} />
    },
    'stats.heading.none': {
        factory: () => <Heading trackerCompanies={stats.none.trackerCompanies} totalCount={stats.none.totalCount} />
    },
    'rmf-small': {
        factory: () => (
            <RemoteMessagingFramework
                messageType="small"
                title="Update Available"
                descriptionText="A new version of DuckDuckGo Browser is available. Update now to enjoy improved privacy features and enhanced performance."
            />
        )
    },
    'rmf-medium': {
        factory: () => (
            <RemoteMessagingFramework
                messageType="medium"
                icon="Announce"
                title="Tell Us Your Thoughts on Privacy Pro"
                descriptionText="A new version of DuckDuckGo Browser is available. Update now to enjoy improved privacy features and enhanced performance."
            />
        )
    },
    'rmf-big-single-action': {
        factory: () => (
            <RemoteMessagingFramework
                messageType="big-single-action"
                icon="DDGAnnounce"
                title="New Search Feature!"
                descriptionText="DuckDuckGo now offers Instant Answers for quicker access to the information you need."
                primaryAction={() => { }}
                primaryActionText="Learn More"
            />
        )
    }
}

export const otherExamples = {
    'stats.without-animation': {
        factory: () => <PrivacyStatsMockProvider
            ticker={true}
            config={{
                expansion: "expanded",
                animation: {kind: "none"}
            }}
        ><PrivacyStatsConsumer /></PrivacyStatsMockProvider>
    },
    'stats.with-view-transitions': {
        factory: () => <PrivacyStatsMockProvider
            ticker={true}
            config={{
                expansion: "expanded",
                animation: {kind: "view-transitions"}
            }}
        ><PrivacyStatsConsumer /></PrivacyStatsMockProvider>
    },
    'customizer-menu': {
        factory: () => (
            <Fragment>
                <div>
                    <CustomizerButton isOpen={true}/>
                </div>
                <br/>
                <MaxContent>
                    <VisibilityMenu
                        toggle={noop('toggle!')}
                        rows={[
                            {
                                id: 'favorites',
                                title: 'Favorites',
                                icon: 'star'
                            },
                            {
                                id: 'privacyStats',
                                title: 'Privacy Stats',
                                icon: 'shield'
                            }
                        ]}
                        state={[
                            {checked: true},
                            {checked: false},
                        ]}
                    />
                </MaxContent>
            </Fragment>
        )
    },
}

function MaxContent({children}) {
    return (
        <div style={{display: 'grid', gridTemplateColumns: 'max-content'}}>
            {children}
        </div>
    )
}
