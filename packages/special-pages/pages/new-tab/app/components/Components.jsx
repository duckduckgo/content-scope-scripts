import { Fragment, h } from "preact";
import styles from "./Components.module.css";
import { Body, Heading, PrivacyStatsConsumer } from "../privacy-stats/PrivacyStats.js";

import { PrivacyStatsMockProvider } from "../privacy-stats/mocks/PrivacyStatsMockProvider.js";
import { stats } from "../privacy-stats/mocks/stats.js";
import { MockFavoritesProvider } from "../favorites/mocks/MockFavoritesProvider.js";
import { favorites } from "../favorites/mocks/favorites.data.js";
import { FavoritesConsumer } from "../favorites/Favorites.js";

/** @type {Record<string, {factory: () => import("preact").ComponentChild}>} */
const examples = {
    'stats.few': {
        factory: () => <PrivacyStatsMockProvider ticker={true}><PrivacyStatsConsumer /></PrivacyStatsMockProvider>
    },
    'stats.few.collapsed': {
        factory: () => <PrivacyStatsMockProvider config={{expansion: "collapsed"}}><PrivacyStatsConsumer /></PrivacyStatsMockProvider>
    },
    'stats.single': {
        factory: () => <PrivacyStatsMockProvider data={stats.single}><PrivacyStatsConsumer /></PrivacyStatsMockProvider>
    },
    'stats.none': {
        factory: () => <PrivacyStatsMockProvider data={stats.none}><PrivacyStatsConsumer /></PrivacyStatsMockProvider>
    },
    'stats.norecent': {
        factory: () => <PrivacyStatsMockProvider data={stats.norecent}><PrivacyStatsConsumer /></PrivacyStatsMockProvider>
    },
    'stats.list': {
        factory: () => <Body trackerCompanies={stats.few.trackerCompanies} />
    },
    'stats.heading': {
        factory: () => <Heading trackerCompanies={stats.few.trackerCompanies} totalCount={stats.few.totalCount} />
    },
    'stats.heading.none': {
        factory: () => <Heading trackerCompanies={stats.none.trackerCompanies} totalCount={stats.none.totalCount} />
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
    'favorites.few.6': {
        factory: () => (
            <MockFavoritesProvider data={{favorites: favorites.many.favorites.slice(0, 6)}}><FavoritesConsumer /></MockFavoritesProvider>
        )
    },
    'favorites.few.5': {
        factory: () => (
            <MockFavoritesProvider data={{favorites: favorites.many.favorites.slice(0, 5)}}><FavoritesConsumer /></MockFavoritesProvider>
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
    },
}

const url = new URL(window.location.href);

export function Components() {
    const ids = url.searchParams.getAll("id");
    const isolated = url.searchParams.has("isolate");
    const e2e = url.searchParams.has("e2e");
    const entries = Object.entries(examples);

    const validIds = ids.filter(id => (id || '') in examples)
    const filtered = validIds.length
        ? validIds.map((id) => /** @type {const} */([id, examples[id]]))
        : entries

    if (isolated) {
        return <Isolated entries={filtered} e2e={e2e} />
    }

    return (
        <div>
            <DebugBar id={ids[0]} entries={entries}/>
            <Stage entries={/** @type {any} */(filtered)} />
        </div>
    )
}

/**
 * Represents a stage in a software application.
 *
 * @param {Object} options - The stage options.
 * @param {Array<[string, {factory: () => any}]>} options.entries - An array of entries in the stage.
 */
function Stage({ entries }) {
    return (
        <div class={styles.componentList} data-testid="stage">
            {entries.map(([id, item]) => {
                const next = new URL(url)
                next.searchParams.set('isolate', 'true');
                next.searchParams.set('id', id);

                const e2e = new URL(url)
                e2e.searchParams.set('isolate', 'true');
                e2e.searchParams.set('id', id);
                e2e.searchParams.set('e2e', 'true');
                return (
                    <Fragment>
                        <div class={styles.itemInfo}>
                            <code>{id}</code>{" "}
                            <div>
                                <a href={next.toString()}
                                   target="_blank"
                                   class={styles.itemLink}
                                   title="isolate this component">isolate</a>{" "}
                                <a href={e2e.toString()}
                                   target="_blank"
                                   class={styles.itemLink}
                                   title="isolate this component">edge-to-edge</a>
                            </div>
                        </div>
                        <div className={styles.item} key={id}>
                            {item.factory()}
                        </div>
                    </Fragment>
                )
            })}
        </div>
    )
}

function Isolated({ entries, e2e }) {
    console.log(entries.length);
    if (e2e) {
        return (
            <div>
                {entries.map(([id, item]) => {
                    return (
                        <Fragment key={id}>
                            {item.factory()}
                        </Fragment>
                    )
                })}
            </div>
        )
    }
    return (
        <div class={styles.componentList} data-testid="stage">
            {entries.map(([id, item], index) => {
                return (
                    <div key={id + index}>
                        {item.factory()}
                    </div>
                )
            })}
        </div>
    )
}

function TextLength() {
    function onClick() {
        url.searchParams.set('textLength', '1.5')
        window.location.href = url.toString();
    }
    function onReset() {
        url.searchParams.delete('textLength')
        window.location.href = url.toString();
    }
    return (
        <div class={styles.buttonRow}>
            <button onClick={onReset} type="button">Text Length 1x</button>
            <button onClick={onClick} type="button">Text Length 1.5x</button>
        </div>
    )
}

function Isolate() {
    const next = new URL(url)
    next.searchParams.set('isolate', 'true');
    return (
        <div class={styles.buttonRow}>
            <a href={next.toString()} target={"_blank"}>Isolate</a>
        </div>
    )
}

function DebugBar({ entries, id }) {
    return (
        <div class={styles.debugBar} data-testid="selector">
            <ExampleSelector entries={entries} id={id} />
            <TextLength />
            <Isolate />
        </div>
    )
}

function ExampleSelector({ entries, id }) {

    function onReset() {
        const url = new URL(window.location.href);
        url.searchParams.delete("id");
        window.location.href = url.toString();
    }

    function onChange(event) {
        if (!event.target) return;
        if (!(event.target instanceof HTMLSelectElement)) return;
        const selectedId = event.target.value;
        if (selectedId) {
            if (selectedId==="none") return onReset();
            const url = new URL(window.location.href);
            url.searchParams.set("id", selectedId);
            window.location.href = url.toString();
        }
    }
    return (
        <div class={styles.buttonRow}>
            <label>
                Example:{" "}
                <select value={id || 'none'} onChange={onChange}>
                    <option value='none'>Select an example</option>
                    {entries.map(([id]) => (
                        <option key={id} value={id}>{id}</option>
                    ))}
                </select>
            </label>
            <button hidden={!id} onClick={onReset}>Reset</button>
        </div>
    )
}
