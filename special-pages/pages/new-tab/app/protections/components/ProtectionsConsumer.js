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
            console.log('[BurnToProtectionsDataBridge] Burn complete event received, starting polling for updated protections data');

            // Get the current protections count before polling
            const initialCount = protectionsService?.dataService?.data?.totalCount;
            console.log('[BurnToProtectionsDataBridge] Initial protections count:', initialCount);

            let retryCount = 0;
            const maxRetries = 10; // Try for up to 1 second (10 * 100ms)

            const pollForUpdate = () => {
                retryCount++;
                console.log(`[BurnToProtectionsDataBridge] Polling attempt ${retryCount}/${maxRetries}`);

                // Fetch fresh data from native
                protectionsService?.dataService?.triggerFetch?.().then(() => {
                    const newCount = protectionsService?.dataService?.data?.totalCount;
                    console.log('[BurnToProtectionsDataBridge] After fetch, protections count:', newCount);

                    // Check if the data has actually changed
                    if (newCount !== initialCount) {
                        console.log('[BurnToProtectionsDataBridge] ✅ Protections data updated successfully!', {
                            oldCount: initialCount,
                            newCount: newCount,
                            retriesNeeded: retryCount,
                        });
                        return; // Success! Stop polling
                    }

                    // Data hasn't changed yet
                    if (retryCount < maxRetries) {
                        console.log('[BurnToProtectionsDataBridge] Data still stale, retrying in 100ms...');
                        setTimeout(pollForUpdate, 100);
                    } else {
                        console.warn('[BurnToProtectionsDataBridge] ❌ Max retries reached, protections data did not update', {
                            expectedChange: true,
                            actualCount: newCount,
                            retriesAttempted: retryCount,
                        });
                    }
                });
            };

            // Start polling after initial delay
            setTimeout(pollForUpdate, 100);
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
