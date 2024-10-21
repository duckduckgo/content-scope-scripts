import { h } from "preact";
import { PrivacyStatsMockProvider } from "../privacy-stats/mocks/PrivacyStatsMockProvider.js";
import { Body, Heading, PrivacyStatsConsumer } from "../privacy-stats/PrivacyStats.js";
import { stats } from "../privacy-stats/mocks/stats.js";
import { noop } from "../utils.js";
import { CustomizerMenu, CustomizerMenuPositioned } from "../customizer/Customizer.js";

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
        factory: () => <Body trackerCompanies={stats.few.trackerCompanies} listAttrs={{id: 'example-stats.list'}}/>
    },
    'stats.heading': {
        factory: () => <Heading
            trackerCompanies={stats.few.trackerCompanies}
            totalCount={stats.few.totalCount}
            expansion={"expanded"}
            onToggle={noop("stats.heading onToggle")}
        />
    },
    'stats.heading.none': {
        factory: () => (
            <Heading
                trackerCompanies={stats.none.trackerCompanies}
                totalCount={stats.none.totalCount}
                expansion={"expanded"}
                onToggle={noop("stats.heading.none")}
            />
        )
    },
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
    'customizer-menu': {
        factory: () => (
            <div style={{minHeight: '300px', position: 'relative'}}>
                <CustomizerMenuPositioned>
                    <CustomizerMenu
                        toggle={noop('toggle')}
                        widgets={[{id: "favorites"}, {id: "privacy-stats"}]}
                        widgetConfigItems={[
                            {id: "favorites", visibility: "visible"},
                            {id: "privacy-stats", visibility: "visible"},
                        ]}
                        metaData={{
                            "favorites": {
                                icon: "star",
                                title: "Favorites"
                            },
                            "privacy-stats": {
                                icon: "shield",
                                title: "Privacy Stats"
                            }
                        }}
                    />
                </CustomizerMenuPositioned>
            </div>
        )
    },
}
