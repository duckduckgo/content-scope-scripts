import { createContext, h } from 'preact';
import { useEffect, useReducer, useRef } from 'preact/hooks';
import { useMessaging } from '../../types.js';
import { WeatherService } from '../weather.service.js';

/**
 * @typedef {import('../../../types/new-tab.js').WeatherData} WeatherData
 */

/**
 * @typedef {{ kind: 'initial-data'; data: WeatherData }
 *         | { kind: 'data'; data: WeatherData }
 *         | { kind: 'load-initial'; }
 *         | { kind: 'error'; error: string }
 * } WeatherEvents
 */

/**
 * @typedef {{status: 'idle'; data: null}
 *         | {status: 'pending-initial'; data: null}
 *         | {status: 'ready'; data: WeatherData}
 * } WeatherState
 */

/**
 * @param {WeatherState} state
 * @param {WeatherEvents} event
 * @returns {WeatherState}
 */
function weatherReducer(state, event) {
    switch (state.status) {
        case 'idle': {
            switch (event.kind) {
                case 'load-initial': {
                    return { ...state, status: /** @type {const} */ ('pending-initial') };
                }
                default:
                    return state;
            }
        }
        case 'pending-initial': {
            switch (event.kind) {
                case 'initial-data': {
                    return {
                        ...state,
                        status: /** @type {const} */ ('ready'),
                        data: event.data,
                    };
                }
                case 'error': {
                    console.error('error with initial weather data', event.error);
                    return state;
                }
                default:
                    return state;
            }
        }
        case 'ready': {
            switch (event.kind) {
                case 'data': {
                    return { ...state, data: event.data };
                }
                default:
                    return state;
            }
        }
        default:
            return state;
    }
}

/**
 * These are the values exposed to consumers.
 */
export const WeatherContext = createContext({
    /** @type {WeatherState} */
    state: { status: 'idle', data: null },
});

/**
 * A data provider that will use `WeatherService` to fetch initial data
 *
 * @param {Object} props
 * @param {import("preact").ComponentChild} props.children
 */
export function WeatherProvider(props) {
    const initial = /** @type {WeatherState} */ ({
        status: /** @type {const} */ ('idle'),
        data: null,
    });

    const [state, dispatch] = useReducer(weatherReducer, initial);

    // create an instance of `WeatherService` for the lifespan of this component.
    const service = useService();

    // get initial data
    useInitialWeatherData({ dispatch, service });

    // subscribe to data updates
    useWeatherDataSubscription({ dispatch, service });

    return <WeatherContext.Provider value={{ state }}>{props.children}</WeatherContext.Provider>;
}

/**
 * @return {import("preact").RefObject<WeatherService>}
 */
export function useService() {
    const service = useRef(/** @type {WeatherService|null} */ (null));
    const ntp = useMessaging();
    useEffect(() => {
        const weatherService = new WeatherService(ntp);
        service.current = weatherService;
        return () => {
            weatherService.destroy();
        };
    }, [ntp]);
    return service;
}

/**
 * @param {object} params
 * @param {import("preact/hooks").Dispatch<WeatherEvents>} params.dispatch
 * @param {import("preact").RefObject<WeatherService>} params.service
 */
function useInitialWeatherData({ dispatch, service }) {
    const messaging = useMessaging();
    useEffect(() => {
        if (!service.current) return console.warn('missing weather service');
        const currentService = service.current;
        async function init() {
            const { data } = await currentService.getInitial();
            if (data) {
                dispatch({ kind: 'initial-data', data });
            } else {
                dispatch({ kind: 'error', error: 'missing data from getInitial' });
            }
        }

        dispatch({ kind: 'load-initial' });

        // eslint-disable-next-line promise/prefer-await-to-then
        init().catch((e) => {
            console.error('uncaught error', e);
            dispatch({ kind: 'error', error: e });
            messaging.reportPageException({ message: `${currentService.name()}: failed to fetch initial data: ` + e.message });
        });

        return () => {
            currentService.destroy();
        };
    }, [messaging]);
}

/**
 * Subscribe to weather data updates
 * @param {object} params
 * @param {import("preact/hooks").Dispatch<WeatherEvents>} params.dispatch
 * @param {import("preact").RefObject<WeatherService>} params.service
 */
function useWeatherDataSubscription({ dispatch, service }) {
    useEffect(() => {
        if (!service.current) return console.warn('could not access weather service');

        const unsub = service.current.onData((evt) => {
            dispatch({ kind: 'data', data: evt.data });
        });
        return () => {
            unsub();
        };
    }, [service, dispatch]);
}
