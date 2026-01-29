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

    return new TestTransportConfig({
        notify(_msg) {
            console.warn('unhandled weather notification', _msg);
        },
        subscribe(_msg, _cb) {
            console.warn('unhandled weather subscription', _msg);
            return () => {};
        },
        request(_msg) {
            /** @type {import('../../../types/new-tab.ts').NewTabMessages['requests']} */
            const msg = /** @type {any} */ (_msg);
            switch (msg.method) {
                case 'weather_getData': {
                    // Use location from request params, or override from dataset
                    const location = msg.params?.location || dataset.location;
                    return Promise.resolve({ ...dataset, location });
                }
                default: {
                    return Promise.reject(new Error('unhandled weather request: ' + msg.method));
                }
            }
        },
    });
}
