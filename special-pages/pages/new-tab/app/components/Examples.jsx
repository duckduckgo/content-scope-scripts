import { h } from "preact";
import { PrivacyStatsMockProvider } from "../privacy-stats/mocks/PrivacyStatsMockProvider.js";
import { Body, Heading, PrivacyStatsConsumer } from "../privacy-stats/PrivacyStats.js";
import { stats } from "../privacy-stats/mocks/stats.js";
import { MockFavoritesProvider } from "../favorites/mocks/MockFavoritesProvider.js";
import { favorites } from "../favorites/mocks/favorites.data.js";
import { FavoritesConsumer } from "../favorites/Favorites.js";
import { noop } from "../utils.js";

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
    'favorites.many': {
        factory: () => (
            <MockFavoritesProvider data={favorites.many}><FavoritesConsumer /></MockFavoritesProvider>
        )
    },
    'favorites.few.7': {
        factory: () => (
            <MockFavoritesProvider data={{favorites: favorites.many.favorites.slice(0, 7)}}><FavoritesConsumer /></MockFavoritesProvider>
        )
    },
    'favorites.few.7.no-animation': {
        factory: () => (
            <MockFavoritesProvider
                data={{favorites: favorites.many.favorites.slice(0, 7)}}
                config={{expansion: "expanded", animation: { kind: "none" }}}
            ><FavoritesConsumer /></MockFavoritesProvider>
        )
    },
    'favorites.few.6': {
        factory: () => (
            <MockFavoritesProvider data={{favorites: favorites.many.favorites.slice(0, 6)}}><FavoritesConsumer /></MockFavoritesProvider>
        )
    },
    'favorites.few.12': {
        factory: () => (
            <MockFavoritesProvider data={{favorites: favorites.many.favorites.slice(0, 12)}}><FavoritesConsumer /></MockFavoritesProvider>
        )
    },
    'favorites.multi': {
        factory: () => (
            <div>
                <MockFavoritesProvider data={favorites.many}><FavoritesConsumer /></MockFavoritesProvider>
                <br/>
                <MockFavoritesProvider data={favorites.two}><FavoritesConsumer /></MockFavoritesProvider>
                <br/>
                <MockFavoritesProvider data={favorites.single}><FavoritesConsumer /></MockFavoritesProvider>
                <br/>
                <MockFavoritesProvider data={favorites.none}><FavoritesConsumer /></MockFavoritesProvider>
            </div>
        )
    },
    'favorites.single': {
        factory: () => (
            <MockFavoritesProvider data={favorites.single}><FavoritesConsumer /></MockFavoritesProvider>
        )
    },
    'favorites.none': {
        factory: () => (
            <MockFavoritesProvider data={favorites.none}><FavoritesConsumer /></MockFavoritesProvider>
        )
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
