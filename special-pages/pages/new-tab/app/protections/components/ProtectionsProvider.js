import { createContext, h } from 'preact';
import { useCallback, useContext, useEffect, useReducer, useRef } from 'preact/hooks';
import { useMessaging } from '../../types.js';
import { reducer, useConfigSubscription, useInitialDataAndConfig } from '../../service.hooks.js';
import { ProtectionsService } from '../protections.service.js';
import { useSignal, useSignalEffect } from '@preact/signals';
import { ActivityServiceContext } from '../../activity/ActivityProvider.js';

/**
 * @typedef {import('../../../types/new-tab.js').ProtectionsData} ProtectionsData
 * @typedef {import('../../../types/new-tab.js').ProtectionsConfig} ProtectionsConfig
 * @typedef {import('../../service.hooks.js').State<ProtectionsData, ProtectionsConfig>} State
 * @typedef {import('../../service.hooks.js').Events<ProtectionsData, ProtectionsConfig>} Events
 */

/**
 * These are the values exposed to consumers.
 */
export const ProtectionsContext = createContext({
    /** @type {State} */
    state: { status: 'idle', data: null, config: null },
    /** @type {() => void} */
    toggle: () => {
        throw new Error('must implement');
    },
    /** @type {(feed: ProtectionsConfig['feed']) => void} */
    setFeed: (_feed) => {
        throw new Error('must implement');
    },
});

export const ProtectionsServiceContext = createContext(/** @type {ProtectionsService|null} */ ({}));

/**
 * Context for sharing burn complete time across useBlockedCount hooks
 * This allows a single subscription to activity_onBurnComplete at the Provider level
 */
export const BurnCompleteTimeContext = createContext(/** @type {import("preact").RefObject<number | null>} */ ({ current: null }));

/**
 * A data provider that will use `ProtectionsService` to fetch initial data only
 *
 * @param {Object} props
 * @param {import("preact").ComponentChild} props.children
 */
export function ProtectionsProvider(props) {
    const initial = /** @type {State} */ ({
        status: 'idle',
        data: null,
        config: null,
    });

    const [state, dispatch] = useReducer(reducer, initial);

    // create an instance of `ProtectionsService` for the lifespan of this component.
    const service = useService();

    // get initial data
    useInitialDataAndConfig({ dispatch, service });

    // subscribe to config updates
    useConfigSubscription({ dispatch, service });

    // Create a shared ref for burn complete time
    // This will be updated by listening to the custom event from BatchedActivityService
    // instead of creating a duplicate subscription
    const burnCompleteTimeRef = useRef(/** @type {number | null} */ (null));

    // expose a fn for sync toggling
    const toggle = useCallback(() => {
        service.current?.toggleExpansion();
    }, [service]);

    /** @type {(feed: ProtectionsConfig['feed']) => void} */
    const setFeed = useCallback(
        (feed) => {
            service.current?.setFeed(feed);
        },
        [service],
    );

    return (
        <ProtectionsContext.Provider value={{ state, toggle, setFeed }}>
            <ProtectionsServiceContext.Provider value={service.current}>
                <BurnCompleteTimeContext.Provider value={burnCompleteTimeRef}>
                    {props.children}
                </BurnCompleteTimeContext.Provider>
            </ProtectionsServiceContext.Provider>
        </ProtectionsContext.Provider>
    );
}

/**
 * @return {import("preact").RefObject<ProtectionsService>}
 */
export function useService() {
    const service = useRef(/** @type {ProtectionsService|null} */ (null));
    const ntp = useMessaging();
    useEffect(() => {
        const stats = new ProtectionsService(ntp);
        service.current = stats;
        return () => {
            stats.destroy();
        };
    }, [ntp]);
    return service;
}

/**
 * @param {number} initial
 * @return {{signal: import("@preact/signals").Signal<number>, skipAnimation: import("@preact/signals").Signal<boolean>}}
 */
export function useBlockedCount(initial) {
    const service = useContext(ProtectionsServiceContext);
    const burnCompleteTimeRef = useContext(BurnCompleteTimeContext);
    const activityService = useContext(ActivityServiceContext);
    const signal = useSignal(initial);
    const skipAnimationSignal = useSignal(false);
    
    // Listen to the custom event from BatchedActivityService instead of creating a duplicate subscription
    // BatchedActivityService already subscribes to activity_onBurnComplete and dispatches this event
    useEffect(() => {
        if (!activityService?.burns) return;

        const handleBurnComplete = () => {
            // Mark that we should skip animation if next update goes to 0
            console.log('[ProtectionsProvider.useBlockedCount] Burn complete event received, setting burnCompleteTimeRef');
            burnCompleteTimeRef.current = Date.now();
        };

        const burns = activityService.burns;
        burns.addEventListener('activity_onBurnComplete', handleBurnComplete);
        return () => {
            // Use the captured burns reference to ensure we remove from the correct EventTarget
            // even if activityService is destroyed/unmounted
            burns?.removeEventListener('activity_onBurnComplete', handleBurnComplete);
        };
    }, [activityService, burnCompleteTimeRef]);
    
    // @todo jingram possibly refactor to include full object
    useSignalEffect(() => {
        return service?.onData((evt) => {
            const newValue = evt.data.totalCount;
            const previousValue = signal.value;
            console.log('[ProtectionsProvider.useBlockedCount] Protections data update received:', {
                source: evt.source,
                previousValue,
                newValue,
                totalCookiePopUpsBlocked: evt.data.totalCookiePopUpsBlocked,
                burnCompleteTimeSet: burnCompleteTimeRef.current !== null,
            });

            // If transitioning to 0 and we just had a burn complete (within 1 second),
            // this is likely a "burn all" operation - skip animation and go directly to empty state
            if (newValue === 0 && previousValue > 0 && burnCompleteTimeRef.current !== null) {
                const timeSinceBurn = Date.now() - burnCompleteTimeRef.current;
                console.log('[ProtectionsProvider.useBlockedCount] Checking burn all condition:', {
                    timeSinceBurn,
                    willSkipAnimation: timeSinceBurn < 1000,
                });
                if (timeSinceBurn < 1000) {
                    // Set skipAnimation flag before updating the signal value
                    // This ensures useAnimatedCount immediately sets to 0 without animating
                    skipAnimationSignal.value = true;
                    signal.value = newValue;
                    // Reset after animation would have completed to allow normal behavior for future updates
                    setTimeout(() => {
                        skipAnimationSignal.value = false;
                        burnCompleteTimeRef.current = null;
                    }, 500);
                    return;
                }
            }

            // Normal update (including single domain burns) - allow animation for both counts
            // This ensures both tracker count and cookie pop-ups count animate when burning a single domain
            skipAnimationSignal.value = false;
            signal.value = newValue;
        });
    });
    
    return { signal, skipAnimation: skipAnimationSignal };
}

/**
 * @param {number | null | undefined} initial
 * @return {import("@preact/signals").Signal<undefined | number | null>}
 */
export function useCookiePopUpsBlockedCount(initial) {
    const service = useContext(ProtectionsServiceContext);
    const signal = useSignal(initial);

    useSignalEffect(() => {
        return service?.onData((evt) => {
            const previousValue = signal.value;
            const newValue = evt.data.totalCookiePopUpsBlocked;
            console.log('[ProtectionsProvider.useCookiePopUpsBlockedCount] Cookie pop-ups count update:', {
                source: evt.source,
                previousValue,
                newValue,
            });
            signal.value = newValue;
        });
    });

    return signal;
}
