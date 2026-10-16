import { useContext, useEffect, useRef } from 'preact/hooks';
import { useMessaging } from '../../types.js';
import { ProtectionsContext, useBlockedCount, useCookiePopUpsBlockedCount } from './ProtectionsProvider.js';
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

    return (
        <Protections
            blockedCountSignal={blockedCountSignal}
            expansion={config.expansion}
            toggle={toggle}
            feed={config.feed}
            setFeed={setFeed}
            totalCookiePopUpsBlockedSignal={totalCookiePopUpsBlockedSignal}
            showProtectionsReportNewLabel={config.showProtectionsReportNewLabel}
        >
            {config.feed === 'activity' && (
                <ActivityProvider>
                    <ActivityConsumer
                        showBurnAnimation={config.showBurnAnimation ?? true}
                        shouldDisplayLegacyActivity={totalCookiePopUpsBlockedSignal.value === undefined}
                    />
                </ActivityProvider>
            )}
            {config.feed === 'privacy-stats' && (
                <PrivacyStatsProvider>
                    <BodyExpanderProvider>
                        <PrivacyStatsConsumer />
                    </BodyExpanderProvider>
                </PrivacyStatsProvider>
            )}
        </Protections>
    );
}

/**
 * Waits for the weekly company stats, which the headline and the first two
 * views are built from. The by-site view reuses the activity feed.
 *
 * @param {object} props
 * @param {ProtectionsConfig} props.config
 * @param {() => void} props.toggle
 * @param {(feed: ProtectionsConfig['feed']) => void} props.setFeed
 * @param {number} props.blockedCount
 * @param {number | null} props.cookiePopUpsBlocked
 */
function ProtectionsReportReadyState({ config, toggle, setFeed, blockedCount, cookiePopUpsBlocked }) {
    const { state } = useContext(PrivacyStatsContext);
    const ntp = useMessaging();
    const rootRef = useRef(/** @type {HTMLElement|null} */ (null));

    // native can ask for the report to be scrolled into view
    useEffect(() => {
        return ntp.messaging.subscribe('protections_scroll', () => {
            rootRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }, [ntp]);

    if (state.status !== 'ready') return null;
    return (
        <ProtectionsReport
            rootRef={rootRef}
            expansion={config.expansion}
            toggle={toggle}
            feed={config.feed}
            setFeed={setFeed}
            blockedCount={blockedCount}
            cookiePopUpsBlocked={cookiePopUpsBlocked}
            stats={state.data}
            sites={
                <ActivityProvider>
                    <ActivityConsumer showBurnAnimation={config.showBurnAnimation ?? true} shouldDisplayLegacyActivity={false} />
                </ActivityProvider>
            }
        />
    );
}
