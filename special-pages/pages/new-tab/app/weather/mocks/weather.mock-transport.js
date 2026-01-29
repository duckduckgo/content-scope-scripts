import { TestTransportConfig } from '@duckduckgo/messaging';
import { weatherMocks } from './weather.mocks.js';

const url = typeof window !== 'undefined' ? new URL(window.location.href) : new URL('https://example.com');

/**
 * @template T
 * @param {T} value
 * @return {T}
 */
function clone(value) {
    return window.structuredClone?.(value) ?? JSON.parse(JSON.stringify(value));
}

export function weatherMockTransport() {
    /** @type {import('../../../types/new-tab.ts').WeatherData} */
    let dataset = clone(weatherMocks.sydney);

    // Check for preset selection via URL param
    if (url.searchParams.has('weather')) {
        const key = url.searchParams.get('weather');
        if (key && key in weatherMocks) {
            dataset = clone(weatherMocks[key]);
        } else if (key && key !== 'true') {
            console.warn('unknown mock dataset for weather:', key);
        }
    }

    // Add default instanceId if not present
    if (!dataset.instanceId) {
        dataset.instanceId = 'weather-1';
    }

    // Allow URL param overrides for individual fields
    if (url.searchParams.has('weather.temp')) {
        const temp = parseFloat(url.searchParams.get('weather.temp') || '0');
        if (!isNaN(temp)) {
            dataset.temperature = temp;
        }
    }

    if (url.searchParams.has('weather.location')) {
        const location = url.searchParams.get('weather.location');
        if (location) {
            dataset.location = location;
        }
    }

    if (url.searchParams.has('weather.condition')) {
        const condition = url.searchParams.get('weather.condition');
        if (condition) {
            dataset.conditionCode = condition;
        }
    }

    /** @type {Map<string, (d: any) => void>} */
    const subs = new Map();

    return new TestTransportConfig({
        notify(_msg) {
            console.warn('unhandled weather notification', _msg);
        },
        subscribe(_msg, cb) {
            /** @type {import('../../../types/new-tab.ts').NewTabMessages['subscriptions']['subscriptionEvent']} */
            const sub = /** @type {any} */ (_msg.subscriptionName);
            if (sub === 'weather_onDataUpdate') {
                subs.set(sub, cb);
                // Support continuous updates for testing
                if (url.searchParams.get('weather.continuous')) {
                    const int = setInterval(() => {
                        dataset.temperature += 1;
                        subs.get(sub)?.(dataset);
                    }, 1000);
                    return () => {
                        clearInterval(int);
                    };
                }
                return () => {};
            }
            console.warn('unhandled weather sub', sub);
            return () => {};
        },
        request(_msg) {
            /** @type {import('../../../types/new-tab.ts').NewTabMessages['requests']} */
            const msg = /** @type {any} */ (_msg);
            switch (msg.method) {
                case 'weather_getData': {
                    // If instanceId provided, include it in response
                    const instanceId = msg.params?.instanceId || 'weather-1';
                    return Promise.resolve({ ...dataset, instanceId });
                }
                default: {
                    return Promise.reject(new Error('unhandled weather request: ' + msg.method));
                }
            }
        },
    });
}
