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
        if (!activityService || !protectionsService) {
            console.log('[BurnToProtectionsDataBridge] Missing service:', {
                hasActivityService: !!activityService,
                hasProtectionsService: !!protectionsService,
            });
            return;
        }

        // WORKAROUND: Native does not update protections data after burn (confirmed via polling).
        // Instead, listen for activity data updates (which ARE correct) and sync protections data to match.
        console.log('[BurnToProtectionsDataBridge] Setting up activity data listener to sync protections');

        let burnInProgress = false;

        const handleBurnStart = () => {
            burnInProgress = true;
            console.log('[BurnToProtectionsDataBridge] Burn started, waiting for activity data update...');
        };

        const unsubscribeActivityData = activityService.onData((evt) => {
            if (!burnInProgress) return;

            // Activity data has been updated after burn
            const activityTotalTrackers = evt.data.totalTrackers;
            const protectionsTotalCount = protectionsService.dataService?.data?.totalCount;

            console.log('[BurnToProtectionsDataBridge] Activity data updated after burn:', {
                activityTotalTrackers,
                protectionsTotalCount,
                needsSync: activityTotalTrackers !== protectionsTotalCount,
            });

            if (activityTotalTrackers !== protectionsTotalCount) {
                // Sync protections data to match activity data
                console.log('[BurnToProtectionsDataBridge] Syncing protections data from activity data');
                protectionsService.dataService.update((old) => ({
                    ...old,
                    totalCount: activityTotalTrackers,
                }));
            }

            burnInProgress = false;
        });

        if (activityService.burns) {
            activityService.burns.addEventListener('activity_onBurnComplete', handleBurnStart);
        }

        console.log('[BurnToProtectionsDataBridge] Bridge initialized');

        return () => {
            unsubscribeActivityData();
            if (activityService.burns) {
                activityService.burns.removeEventListener('activity_onBurnComplete', handleBurnStart);
            }
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
