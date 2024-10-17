import { Fragment, h } from "preact";
import styles from "./Components.module.css";
import { mainExamples, otherExamples } from "./Examples.jsx";
import { Body, Heading, PrivacyStatsConsumer } from "../privacy-stats/PrivacyStats.js";

import { PrivacyStatsMockProvider } from "../privacy-stats/mocks/PrivacyStatsMockProvider.js";
import { stats } from "../privacy-stats/mocks/stats.js";
import { RemoteMessagingFramework } from "../remote-messaging-framework/RemoteMessagingFramework";

/** @type {Record<string, {factory: () => import("preact").ComponentChild}>} */
const examples = {
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

const url = new URL(window.location.href);

export function Components() {
    const ids = url.searchParams.getAll("id");
    const isolated = url.searchParams.has("isolate");
    const valid = (id || '') in examples;
    const entries = Object.entries(examples);
    const filtered = id && valid
        ? entries.filter(([_id]) => _id === id)
    const e2e = url.searchParams.has("e2e");
    const entries = Object.entries(mainExamples).concat(Object.entries(otherExamples));
    const entryIds = entries.map(([id]) => id);

    const validIds = ids.filter(id => entryIds.includes(id));

    const filtered = validIds.length
        ? validIds.map((id) => /** @type {const} */([id, mainExamples[id] || otherExamples[id]]))
        : entries

    if (isolated) {
        return <Isolated entries={filtered} e2e={e2e} />
    }

    return (
        <div>
            <DebugBar id={id} entries={entries} />
            <Stage entries={filtered} />
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

                const selected = new URL(url)
                selected.searchParams.set('id', id);

                const e2e = new URL(url)
                e2e.searchParams.set('isolate', 'true');
                e2e.searchParams.set('id', id);
                e2e.searchParams.set('e2e', 'true');

                const without = new URL(url);
                const current = without.searchParams.getAll('id');
                const others = current.filter(x => x !== id);
                const matching = current.filter(x => x === id);
                const matchingMinus1 = matching.length === 1
                    ? []
                    : matching.slice(0, -1)

                without.searchParams.delete('id');
                for (let string of [...others, ...matchingMinus1]) {
                    without.searchParams.append('id', string)
                }

                return (
                    <Fragment>
                        <div class={styles.itemInfo}>
                            <code>{id}</code>{" "}
                            <a href={without.toString()} hidden={current.length === 0}>Remove</a>
                            <div>
                                <a href={selected.toString()}
                                    class={styles.itemLink}
                                    title="show this component only">select</a>{" "}
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

function DebugBar({ entries, id, ids }) {
    return (
        <div class={styles.debugBar} data-testid="selector">
            <ExampleSelector entries={entries} id={id} />
            {ids.length > 0 && (
                <Append entries={entries} id={id} />
            )}
            <TextLength />
            <Isolate />
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
            <a href={next.toString()} target={"_blank"}>Isolate (open in a new tab)</a>
        </div>
    )
}

/**
 * Allows users to select an example from a list and update the URL accordingly.
 *
 * @param {Object} options - The options object.
 * @param {Array} options.entries - The list of examples to choose from, each represented as an array with an id.
 * @param {string} options.id - The current selected example id.
 */
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
            if (selectedId === "none") return onReset();
            const url = new URL(window.location.href);
            url.searchParams.set("id", selectedId);
            window.location.href = url.toString();
        }
    }
    return (
        <Fragment>
            <div class={styles.buttonRow}>
                <label>
                    Single:{" "}
                    <select value={id || 'none'} onChange={onChange}>
                        <option value='none'>Select an example</option>
                        {entries.map(([id]) => (
                            <option key={id} value={id}>{id}</option>
                        ))}
                    </select>
                </label>
                <button onClick={onReset}>RESET 🔁</button>
            </div>
        </Fragment>
    )
}

/**
 * Allows users to select an example from a list and update the URL accordingly.
 *
 * @param {Object} options - The options object.
 * @param {Array} options.entries - The list of examples to choose from, each represented as an array with an id.
 * @param {string} options.id - The current selected example id.
 */
function Append({ entries, id }) {
    function onReset() {
        const url = new URL(window.location.href);
        url.searchParams.delete("id");
        window.location.href = url.toString();
    }

    function onSubmit(event) {
        if (!event.target) return;
        event.preventDefault();
        const form = event.target;
        const data = new FormData(form);
        const value = data.get('add-id');
        if (typeof value !== "string") return;
        const url = new URL(window.location.href);
        url.searchParams.append("id", value);
        window.location.href = url.toString();
    }

    return (
        <Fragment>
            <form class={styles.buttonRow} onSubmit={onSubmit}>
                <label>
                    Append:{" "}
                    <select value='none' name="add-id">
                        <option value='none'>Select an example</option>
                        {entries.map(([id]) => (
                            <option key={id} value={id}>{id}</option>
                        ))}
                    </select>
                </label>
                <button>Confirm</button>
            </form>
        </Fragment>
    )
}
