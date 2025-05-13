import { useId, useMemo } from 'preact/hooks';
import { PrivacyStatsHeading } from '../../privacy-stats/components/PrivacyStatsHeading.js';
import { Fragment, h } from 'preact';
import cn from 'classnames';
import styles from './Protections.module.css';
import { ActivityProvider } from '../../activity/ActivityProvider.js';
import { ActivityAltConsumer } from '../../activity/components/Activity.js';
import { BodyExpanderProvider } from '../../privacy-stats/components/BodyExpansionProvider.js';
import { PrivacyStatsAltConsumer } from '../../privacy-stats/components/PrivacyStatsConsumer.js';
import { PrivacyStatsProvider } from '../../privacy-stats/components/PrivacyStatsProvider.js';

/**
 * @import enStrings from "../../strings.json"
 * @typedef {enStrings} Strings
 * @typedef {import('../../../types/new-tab.js').TrackerCompany} TrackerCompany
 * @typedef {import('../../../types/new-tab.js').Expansion} Expansion
 * @typedef {import('../../../types/new-tab.js').ProtectionsData} ProtectionsData
 * @typedef {import('../../../types/new-tab.js').ProtectionsConfig} ProtectionsConfig
 */

/**
 * @param {object} props
 * @param {Expansion} props.expansion
 * @param {ProtectionsData} props.data
 * @param {ProtectionsConfig['feed']} props.feed
 * @param {(feed: ProtectionsConfig['feed']) => void} props.setFeed
 * @param {()=>void} props.toggle
 */
export function Protections({ expansion = 'expanded', data, feed, toggle, setFeed }) {
    // see: https://www.w3.org/WAI/ARIA/apg/patterns/accordion/examples/accordion/
    const WIDGET_ID = useId();
    const TOGGLE_ID = useId();

    const attrs = useMemo(() => {
        return {
            'aria-controls': WIDGET_ID,
            id: TOGGLE_ID,
        };
    }, [WIDGET_ID, TOGGLE_ID]);

    return (
        <div class={styles.root}>
            <PrivacyStatsHeading recent={data.totalCount} onToggle={toggle} expansion={expansion} canExpand={true} buttonAttrs={attrs} />
            {expansion === 'expanded' && <ProtectionsBody feed={feed} setFeed={setFeed} />}
        </div>
    );
}

/**
 * @param {object} props
 * @param {ProtectionsConfig['feed']} props.feed
 * @param {(feed: ProtectionsConfig['feed']) => void} props.setFeed
 */
function ProtectionsBody(props) {
    return (
        <Fragment>
            <div class={styles.switcher}>
                <button
                    class={cn(styles.button, props.feed === 'privacy-stats' && styles.active)}
                    onClick={() => props.setFeed('privacy-stats')}
                >
                    Stats
                </button>
                <button class={cn(styles.button, props.feed === 'activity' && styles.active)} onClick={() => props.setFeed('activity')}>
                    Details
                </button>
            </div>
            {props.feed === 'activity' && (
                <ActivityProvider>
                    <ActivityAltConsumer />
                </ActivityProvider>
            )}
            {props.feed === 'privacy-stats' && (
                <PrivacyStatsProvider>
                    <BodyExpanderProvider>
                        <PrivacyStatsAltConsumer />
                    </BodyExpanderProvider>
                </PrivacyStatsProvider>
            )}
        </Fragment>
    );
}
