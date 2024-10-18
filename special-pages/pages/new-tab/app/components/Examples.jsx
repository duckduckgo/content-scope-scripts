import { h } from "preact";
import { PrivacyStatsMockProvider } from "../privacy-stats/mocks/PrivacyStatsMockProvider.js";
import { Body, Heading, PrivacyStatsConsumer } from "../privacy-stats/PrivacyStats.js";
import { stats } from "../privacy-stats/mocks/stats.js";
import { RemoteMessagingFramework } from "../remote-messaging-framework/RemoteMessagingFramework.js";

/** @type {Record<string, {factory: () => import("preact").ComponentChild}>} */
export const mainExamples = {
    'stats.few': {
        factory: () => <PrivacyStatsMockProvider ticker={true}><PrivacyStatsConsumer/></PrivacyStatsMockProvider>
    },
    'stats.few.collapsed': {
        factory: () => <PrivacyStatsMockProvider config={{expansion: "collapsed"}}><PrivacyStatsConsumer/></PrivacyStatsMockProvider>
    },
    'stats.single': {
        factory: () => <PrivacyStatsMockProvider data={stats.single}><PrivacyStatsConsumer/></PrivacyStatsMockProvider>
    },
    'stats.none': {
        factory: () => <PrivacyStatsMockProvider data={stats.none}><PrivacyStatsConsumer/></PrivacyStatsMockProvider>
    },
    'stats.norecent': {
        factory: () => <PrivacyStatsMockProvider
            data={stats.norecent}><PrivacyStatsConsumer/></PrivacyStatsMockProvider>
    },
    'stats.list': {
        factory: () => <Body trackerCompanies={stats.few.trackerCompanies} id='example-stats.list'/>
    },
    'stats.heading': {
        factory: () => <Heading trackerCompanies={stats.few.trackerCompanies} totalCount={stats.few.totalCount}/>
    },
    'stats.heading.none': {
        factory: () => <Heading trackerCompanies={stats.none.trackerCompanies} totalCount={stats.none.totalCount}/>
    },
    'rmf-small': {
        factory: () => (
            <RemoteMessagingFramework
                messageType="small"
                titleText="Small title"
                descriptionText="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam eget elit vel ex dapibus."
            />)
    },
    'rmf-medium': {
        factory: () => (
            <RemoteMessagingFramework
                messageType="medium"
                icon="Announce"
                titleText="Medium title"
                descriptionText="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam eget elit vel ex dapibus."
            />)
    },
    'rmf-big-single-action': {
        factory: () => (
            <RemoteMessagingFramework
                messageType="big_single_action"
                icon="AppUpdate"
                titleText="Big one button title"
                descriptionText="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam eget elit vel ex dapibus."
                primaryActionText="Take Survey"
                primaryAction={() => { }}
            />)
    },
    'rmf-big-two-action': {
        factory: () => (
            <RemoteMessagingFramework
                messageType="big_two_action"
                icon="CriticalUpdate"
                titleText="Big 2 buttons title"
                descriptionText="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam eget elit vel ex dapibus."
                primaryActionText="Take Survey"
                primaryAction={() => { }}
                secondaryActionText="Remind Me Later"
                secondaryAction={() => { }}
            />)
    },
    'rmf-big-two-action-overflow': {
        factory: () => (
            <RemoteMessagingFramework
                messageType="big_two_action"
                icon="DDGAnnounce"
                titleText="Big 2 buttons with long titles"
                descriptionText="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam eget elit vel ex dapibus. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam eget elit vel ex dapibus."
                primaryActionText="How to update Windows with every step fully explained"
                primaryAction={() => { }}
                secondaryActionText="Remind me later, but only if I’m actually going to update soon"
                secondaryAction={() => { }}
            />)
    }
}

export const otherExamples = {
    'stats.without-animation': {
        factory: () => <PrivacyStatsMockProvider
            ticker={true}
            config={{
                expansion: "expanded",
                animation: { kind: "none" }
            }}
        ><PrivacyStatsConsumer/></PrivacyStatsMockProvider>
    },
    'stats.with-view-transitions': {
        factory: () => <PrivacyStatsMockProvider
            ticker={true}
            config={{
                expansion: "expanded",
                animation: { kind: "view-transitions" }
            }}
        ><PrivacyStatsConsumer/></PrivacyStatsMockProvider>
    },
}
