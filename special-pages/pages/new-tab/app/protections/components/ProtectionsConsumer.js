import { useContext, useEffect, useRef } from 'preact/hooks';
import { ProtectionsContext, useBlockedCount, useCookiePopUpsBlockedCount } from './ProtectionsProvider.js';
import { h } from 'preact';
import { Protections } from './Protections.js';
import { ActivityProvider } from '../../activity/ActivityProvider.js';
import { ActivityConsumer } from '../../activity/components/Activity.js';
import { PrivacyStatsProvider } from '../../privacy-stats/components/PrivacyStatsProvider.js';
import { BodyExpanderProvider } from '../../privacy-stats/components/BodyExpansionProvider.js';
import { PrivacyStatsConsumer } from '../../privacy-stats/components/PrivacyStatsConsumer.js';
import { useMessaging } from '../../types.js';

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
    const messaging = useMessaging();
    const didNotifyRef = useRef(false);

    // Notify native when protections widget is ready
    useEffect(() => {
        if (state.status === 'ready' && !didNotifyRef.current) {
            didNotifyRef.current = true;
            requestAnimationFrame(() => {
                messaging.widgetDidRender({ id: 'protections' });
            });
        }
    }, [state.status, messaging]);

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
