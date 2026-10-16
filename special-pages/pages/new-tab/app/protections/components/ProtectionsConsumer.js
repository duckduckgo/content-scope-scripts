import { useContext, useRef } from 'preact/hooks';
import { ProtectionsContext, useBlockedCount, useCookiePopUpsBlockedCount, useScrollIntoViewOnRequest } from './ProtectionsProvider.js';
import { h } from 'preact';
import { Protections } from './Protections.js';
import { ActivityProvider } from '../../activity/ActivityProvider.js';
import { ActivityConsumer } from '../../activity/components/Activity.js';
import { PrivacyStatsContext, PrivacyStatsProvider } from '../../privacy-stats/components/PrivacyStatsProvider.js';
import { BodyExpanderProvider } from '../../privacy-stats/components/BodyExpansionProvider.js';
import { PrivacyStatsConsumer } from '../../privacy-stats/components/PrivacyStatsConsumer.js';
import { ProtectionsReport } from './ProtectionsReport.js';

/**
 * @import {ProtectionsData, ProtectionsConfig} from '../../../types/new-tab.js';
 */

/**
 * Use this when you want to render the UI from a context where
 * the service is available.
 *
 * for example:
 *
 * ```jsx
 * <ProtectionsProvider>
 *   <ProtectionsConsumer />
 * </ProtectionsProvider>
 * ```
 */
export function ProtectionsConsumer() {
    const { state } = useContext(ProtectionsContext);
    if (state.status === 'ready') {
        return <ProtectionsReadyState data={state.data} config={state.config} />;
    }
    return null;
}

/**
 * @param {object} props
 * @param {ProtectionsData} props.data
 * @param {ProtectionsConfig} props.config
 */
function ProtectionsReadyState({ data, config }) {
    const { toggle, setFeed } = useContext(ProtectionsContext);
    const blockedCountSignal = useBlockedCount(data.totalCount);
    const totalCookiePopUpsBlockedSignal = useCookiePopUpsBlockedCount(data.totalCookiePopUpsBlocked);

    // `undefined` means native hasn't adopted the new schema yet
    // @todo legacyProtections: remove the legacy branch once all platforms support the new UI
    if (totalCookiePopUpsBlockedSignal.value !== undefined) {
        return (
            <PrivacyStatsProvider>
                <ProtectionsReportReadyState
                    config={config}
                    toggle={toggle}
                    setFeed={setFeed}
                    blockedCount={blockedCountSignal.value}
                    cookiePopUpsBlocked={totalCookiePopUpsBlockedSignal.value}
                />
            </PrivacyStatsProvider>
        );
    }

    // the legacy UI only has these two; a view saved by the new UI falls back to the summary
    const legacyFeed = config.feed === 'activity' ? 'activity' : 'privacy-stats';

    return (
        <Protections
            blockedCountSignal={blockedCountSignal}
            expansion={config.expansion}
            toggle={toggle}
            feed={legacyFeed}
            setFeed={setFeed}
            totalCookiePopUpsBlockedSignal={totalCookiePopUpsBlockedSignal}
            showProtectionsReportNewLabel={config.showProtectionsReportNewLabel}
        >
            {legacyFeed === 'activity' && (
                <ActivityProvider>
                    <ActivityConsumer showBurnAnimation={config.showBurnAnimation ?? true} shouldDisplayLegacyActivity />
                </ActivityProvider>
            )}
            {legacyFeed === 'privacy-stats' && (
                <PrivacyStatsProvider>
                    <BodyExpanderProvider>
                        <PrivacyStatsConsumer />
                    </BodyExpanderProvider>
                </PrivacyStatsProvider>
            )}
        </Protections>
    );
}

/** Shown when the weekly stats can't be loaded */
/** @type {import('../../../types/new-tab.js').PrivacyStatsData} */
const NO_STATS = { totalCompanies: 0, trackerCompanies: [] };

/**
 * Waits for the weekly company stats, which the headline and the views are
 * built from. The by-site view reuses the activity feed.
 *
 * @param {object} props
 * @param {ProtectionsConfig} props.config
 * @param {() => void} props.toggle
 * @param {(feed: ProtectionsConfig['feed']) => void} props.setFeed
 * @param {number} props.blockedCount
 * @param {number | null} props.cookiePopUpsBlocked
 */
function ProtectionsReportReadyState({ config, toggle, setFeed, blockedCount, cookiePopUpsBlocked }) {
    const { state, failed } = useContext(PrivacyStatsContext);
    const rootRef = useRef(/** @type {HTMLElement|null} */ (null));
    useScrollIntoViewOnRequest(rootRef);

    // nothing while the stats load (usually a moment); if they can't be
    // loaded, the empty report, so the widget is still there to fill in
    // should stats arrive later
    const stats = state.status === 'ready' ? state.data : failed ? NO_STATS : null;
    if (!stats) return null;
    return (
        <ProtectionsReport
            rootRef={rootRef}
            expansion={config.expansion}
            toggle={toggle}
            feed={config.feed}
            setFeed={setFeed}
            blockedCount={blockedCount}
            cookiePopUpsBlocked={cookiePopUpsBlocked}
            stats={stats}
            sites={
                <ActivityProvider>
                    <ActivityConsumer showBurnAnimation={config.showBurnAnimation ?? true} shouldDisplayLegacyActivity={false} />
                </ActivityProvider>
            }
        />
    );
}
