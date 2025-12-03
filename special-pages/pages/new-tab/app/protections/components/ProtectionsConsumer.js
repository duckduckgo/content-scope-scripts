import { useContext, useEffect } from 'preact/hooks';
import { ProtectionsContext, useBlockedCount, useCookiePopUpsBlockedCount, ProtectionsServiceContext } from './ProtectionsProvider.js';
import { h } from 'preact';
import { Protections } from './Protections.js';
import { ActivityProvider, ActivityServiceContext } from '../../activity/ActivityProvider.js';
import { ActivityConsumer } from '../../activity/components/Activity.js';
import { PrivacyStatsProvider } from '../../privacy-stats/components/PrivacyStatsProvider.js';
import { BodyExpanderProvider } from '../../privacy-stats/components/BodyExpansionProvider.js';
import { PrivacyStatsConsumer } from '../../privacy-stats/components/PrivacyStatsConsumer.js';

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
 * Bridge component that connects burn complete events to protections data refresh.
 * This must be inside ActivityProvider to have access to ActivityServiceContext.
 */
function BurnToProtectionsDataBridge() {
    const activityService = useContext(ActivityServiceContext);
    const protectionsService = useContext(ProtectionsServiceContext);

    useEffect(() => {
        if (!activityService?.burns || !protectionsService) {
            console.log('[BurnToProtectionsDataBridge] Missing service:', {
                hasActivityService: !!activityService,
                hasBurns: !!activityService?.burns,
                hasProtectionsService: !!protectionsService,
            });
            return;
        }

        const handleBurnComplete = () => {
            console.log('[BurnToProtectionsDataBridge] Burn complete event received, scheduling protections data refresh');
            // Add a small delay to allow native to finish updating protections data
            // Native updates activity data first, then protections data, so we need to wait
            setTimeout(() => {
                console.log('[BurnToProtectionsDataBridge] Triggering protections data refresh (after delay)');
                protectionsService?.dataService?.triggerFetch?.();
            }, 100); // 100ms should be enough for native to update
        };

        const burns = activityService.burns;
        burns.addEventListener('activity_onBurnComplete', handleBurnComplete);
        console.log('[BurnToProtectionsDataBridge] Burn complete listener registered');

        return () => {
            burns?.removeEventListener('activity_onBurnComplete', handleBurnComplete);
        };
    }, [activityService, protectionsService]);

    return null; // This component doesn't render anything
}

/**
 * @param {object} props
 * @param {ProtectionsData} props.data
 * @param {ProtectionsConfig} props.config
 */
function ProtectionsReadyState({ data, config }) {
    const { toggle, setFeed } = useContext(ProtectionsContext);
    const { signal: blockedCountSignal, skipAnimation: skipAnimationSignal } = useBlockedCount(data.totalCount);
    const totalCookiePopUpsBlockedSignal = useCookiePopUpsBlockedCount(data.totalCookiePopUpsBlocked);

    return (
        <Protections
            blockedCountSignal={blockedCountSignal}
            skipAnimationSignal={skipAnimationSignal}
            expansion={config.expansion}
            toggle={toggle}
            feed={config.feed}
            setFeed={setFeed}
            totalCookiePopUpsBlockedSignal={totalCookiePopUpsBlockedSignal}
        >
            {config.feed === 'activity' && (
                <ActivityProvider>
                    <BurnToProtectionsDataBridge />
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
