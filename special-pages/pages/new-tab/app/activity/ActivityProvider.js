import { createContext, h } from 'preact';
import { useCallback, useEffect, useReducer, useRef, useContext } from 'preact/hooks';
import { useMessaging } from '../types.js';
import { ActivityService } from './activity.service.js';
import { reducer, useConfigSubscription, useInitialDataAndConfig } from '../service.hooks.js';
import { eventToTarget } from '../utils.js';
import { usePlatformName } from '../settings.provider.js';
import { ACTION_ADD_FAVORITE, ACTION_BURN, ACTION_REMOVE, ACTION_REMOVE_FAVORITE } from './constants.js';
import { batch, signal, useSignal, useSignalEffect } from '@preact/signals';
import { DDG_DEFAULT_ICON_SIZE } from '../favorites/constants.js';

/**
 * @typedef {import('../../types/new-tab.js').ActivityData} ActivityData
 * @typedef {import('../../types/new-tab.js').ActivityConfig} ActivityConfig
 * @typedef {import('../../types/new-tab').TrackingStatus} TrackingStatus
 * @typedef {import('../../types/new-tab').HistoryEntry} HistoryEntry
 * @typedef {import('../service.hooks.js').State<ActivityData, ActivityConfig>} State
 * @typedef {import('../service.hooks.js').Events<ActivityData, ActivityConfig>} Events
 */

/**
 * These are the values exposed to consumers.
 */
export const ActivityContext = createContext({
    /** @type {State} */
    state: { status: 'idle', data: null, config: null },
    /** @type {() => void} */
    toggle: () => {
        throw new Error('must implement');
    },
});

export const ActivityServiceContext = createContext(/** @type {ActivityService|null} */ ({}));
export const ActivityApiContext = createContext({
    /**
     * @type {(evt: MouseEvent) => void} event
     */
    didClick(event) {},
});

/**
 * A data provider that will use `ActivityService` to fetch data, subscribe
 * to updates and modify state.
 *
 * @param {Object} props
 * @param {import("preact").ComponentChild} props.children
 */
export function ActivityProvider(props) {
    const initial = /** @type {State} */ ({
        status: 'idle',
        data: null,
        config: null,
    });

    const [state, dispatch] = useReducer(reducer, initial);
    const platformName = usePlatformName();

    // create an instance of `ActivityService` for the lifespan of this component.
    const service = useService();

    // get initial data
    useInitialDataAndConfig({ dispatch, service });

    // subscribe to toggle + expose a fn for sync toggling
    const { toggle } = useConfigSubscription({ dispatch, service });

    /**
     * @param {MouseEvent} event
     */
    function didClick_(event) {
        const target = /** @type {HTMLElement|null} */ (event.target);
        if (!target) return;
        if (!service.current) return;
        const anchor = /** @type {HTMLAnchorElement|null} */ (target.closest('a[href][data-url]'));
        if (anchor) {
            const url = anchor.dataset.url;
            if (!url) return;
            event.preventDefault();
            event.stopImmediatePropagation();
            const openTarget = eventToTarget(event, platformName);
            service.current.openUrl(url, openTarget);
        } else {
            const button = /** @type {HTMLButtonElement|null} */ (target.closest('button[value][data-action]'));
            if (!button) return;
            event.preventDefault();
            event.stopImmediatePropagation();

            const action = button.dataset.action;
            const value = button.value;

            if (!action) return console.warn('expected clicked button to have data-action="<value>"');
            if (typeof value !== 'string') return console.warn('expected clicked button to have a value');

            if (action === ACTION_ADD_FAVORITE) {
                service.current.addFavorite(button.value);
            } else if (action === ACTION_REMOVE_FAVORITE) {
                service.current.removeFavorite(button.value);
            } else if (action === ACTION_BURN) {
                // burning will be captured elsewhere
            } else if (action === ACTION_REMOVE) {
                service.current.remove(button.value);
            } else {
                console.warn('unhandled action:', action);
            }
        }
    }

    const didClick = useCallback(didClick_, []);

    return (
        <ActivityContext.Provider value={{ state, toggle }}>
            <ActivityServiceContext.Provider value={service.current}>
                <ActivityApiContext.Provider value={{ didClick }}>{props.children}</ActivityApiContext.Provider>
            </ActivityServiceContext.Provider>
        </ActivityContext.Provider>
    );
}

/**
 * @typedef Item
 * @property {string} props.title
 * @property {string} props.url
 * @property {string|null|undefined} props.favoriteSrc
 * @property {number} props.faviconMax
 * @property {string} props.etldPlusOne
 * @property {boolean} props.trackersFound
 */

/**
 * @typedef NormalizedActivity
 * @property {Record<string, Item>} items
 * @property {Record<string, HistoryEntry[]>} history
 * @property {Record<string, TrackingStatus>} trackingStatus
 * @property {Record<string, boolean>} favorites
 */

/**
 * todo: benchmark this, is it too slow with large datasets?
 * @param {NormalizedActivity} prev
 * @param {ActivityData} data
 * @return {NormalizedActivity}
 */
function normalizeItems(prev, data) {
    return {
        favorites: Object.fromEntries(
            data.activity.map((x) => {
                return [x.url, x.favorite];
            }),
        ),
        items: Object.fromEntries(
            data.activity.map((x) => {
                /** @type {Item} */
                const next = {
                    etldPlusOne: x.etldPlusOne,
                    title: x.title,
                    url: x.url,
                    faviconMax: x.favicon?.maxAvailableSize ?? DDG_DEFAULT_ICON_SIZE,
                    favoriteSrc: x.favicon?.src,
                    trackersFound: x.trackersFound,
                };
                const differs = shallowDiffers(next, prev.items[x.url] || {});
                return [x.url, differs ? next : prev.items[x.url] || {}];
            }),
        ),
        history: Object.fromEntries(
            data.activity.map((x) => {
                const differs = shallowDiffers(x.history, prev.history[x.url] || []);
                return [x.url, differs ? [...x.history] : prev.history[x.url] || []];
            }),
        ),
        trackingStatus: Object.fromEntries(
            data.activity.map((x) => {
                const prevItem = prev.trackingStatus[x.url] || {
                    totalCount: 0,
                    trackerCompanies: [],
                };
                const differs = shallowDiffers(x.trackingStatus.trackerCompanies, prevItem.trackerCompanies);
                if (prevItem.totalCount !== x.trackingStatus.totalCount || differs) {
                    const next = {
                        totalCount: x.trackingStatus.totalCount,
                        trackerCompanies: [...x.trackingStatus.trackerCompanies],
                    };
                    return [x.url, next];
                }
                return [x.url, prevItem];
            }),
        ),
    };
}

/**
 * @param {string[]} prev
 * @param {ActivityData} data
 * @return {string[]}
 */
function normalize(prev, data) {
    const keys = data.activity.map((x) => x.url);
    return shallowDiffers(prev, keys) ? keys : prev;
}

/**
 * Check if two objects have a different shape
 * @param {object} a
 * @param {object} b
 * @returns {boolean}
 */
export function shallowDiffers(a, b) {
    for (const i in a) if (i !== '__source' && !(i in b)) return true;
    for (const i in b) if (i !== '__source' && a[i] !== b[i]) return true;
    return false;
}

export const SignalStateContext = createContext({
    activity: signal(/** @type {NormalizedActivity} */ ({})),
    keys: signal(/** @type {string[]} */ ([])),
});

export function SignalStateProvider({ children }) {
    const { state } = useContext(ActivityContext);
    const service = useContext(ActivityServiceContext);
    if (state.status !== 'ready') throw new Error('must have ready status here');
    if (!service) throw new Error('must have service here');

    const keys = useSignal(normalize([], state.data));
    const activity = useSignal(
        normalizeItems(
            {
                items: {},
                history: {},
                trackingStatus: {},
                favorites: {},
            },
            state.data,
        ),
    );

    useSignalEffect(() => {
        if (!service) return console.warn('could not access service');
        const unsub = service.onData((evt) => {
            const next = normalize(keys.value, evt.data);
            batch(() => {
                keys.value = next;
                activity.value = normalizeItems(activity.value, evt.data);
            });
        });
        const handler = () => {
            if (document.visibilityState === 'visible') {
                console.log('will fetch');
                service
                    .triggerDataFetch()
                    // eslint-disable-next-line promise/prefer-await-to-then
                    .catch((e) => console.error('trigger fetch errored', e));
            }
        };

        (() => {
            // export the event in tests
            if (window.__playwright_01) {
                /** @type {any} */ (window).__trigger_document_visibilty__ = handler;
            }
        })();

        document.addEventListener('visibilitychange', handler);
        return () => {
            unsub();
            document.removeEventListener('visibilitychange', handler);
        };
    });

    return <SignalStateContext.Provider value={{ activity, keys }}>{children}</SignalStateContext.Provider>;
}

/**
 * @return {import("preact").RefObject<ActivityService>}
 */
export function useService() {
    const service = useRef(/** @type {ActivityService|null} */ (null));
    const ntp = useMessaging();
    useEffect(() => {
        const stats = new ActivityService(ntp);
        service.current = stats;
        return () => {
            stats.destroy();
        };
    }, [ntp]);
    return service;
}
