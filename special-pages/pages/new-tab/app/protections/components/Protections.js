import { useId, useMemo } from 'preact/hooks';
import { PrivacyStatsHeading } from '../../privacy-stats/components/PrivacyStatsHeading.js';
import { Fragment, h } from 'preact';
import cn from 'classnames';
import styles from './Protections.module.css';
import { ActivityProvider } from '../../activity/ActivityProvider.js';
import { BodyExpanderProvider } from '../../privacy-stats/components/BodyExpansionProvider.js';
import { PrivacyStatsProvider } from '../../privacy-stats/components/PrivacyStatsProvider.js';
import { useBlockedCount } from './ProtectionsProvider.js';
import { ActivityConsumer } from '../../activity/components/Activity.js';
import { PrivacyStatsConsumer } from '../../privacy-stats/components/PrivacyStatsConsumer.js';

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
    return (
        <div class={styles.root}>
            <ProtectionsHeader expansion={expansion} toggle={toggle} initial={data.totalCount} />
            {expansion === 'expanded' && <ProtectionsBody feed={feed} setFeed={setFeed} />}
        </div>
    );
}

function ProtectionsHeader({ initial, toggle, expansion }) {
    const WIDGET_ID = useId();
    const TOGGLE_ID = useId();

    const attrs = useMemo(() => {
        return {
            'aria-controls': WIDGET_ID,
            id: TOGGLE_ID,
        };
    }, [WIDGET_ID, TOGGLE_ID]);

    return (
        <PrivacyStatsHeading
            blockedCount={useBlockedCount(initial)}
            onToggle={toggle}
            expansion={expansion}
            canExpand={true}
            buttonAttrs={attrs}
        />
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
                    <ActivityConsumer />
                </ActivityProvider>
            )}
            {props.feed === 'privacy-stats' && (
                <PrivacyStatsProvider>
                    <BodyExpanderProvider>
                        <PrivacyStatsConsumer />
                    </BodyExpanderProvider>
                </PrivacyStatsProvider>
            )}
        </Fragment>
    );
}
