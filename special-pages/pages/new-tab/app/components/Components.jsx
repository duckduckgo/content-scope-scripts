import { Fragment, h } from "preact";
import styles from "./Components.module.css";
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
    const id = url.searchParams.get("id");
    const isolated = url.searchParams.has("isolate");
    const valid = (id || '') in examples;
    const entries = Object.entries(examples);
    const filtered = id && valid
        ? entries.filter(([_id]) => _id === id)
        : entries

    if (isolated) {
        return <Isolated entries={filtered} />
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
                return (
                    <div className={styles.item} key={id}>
                        {item.factory()}
                    </div>
                )
            })}
        </div>
    )
}

function Isolated({ entries }) {
    return (
        <div>
            {entries.map(([id, item]) => {
                return <Fragment key={id}>
                    {item.factory()}
                </Fragment>
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
            if (selectedId === "none") return onReset();
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
