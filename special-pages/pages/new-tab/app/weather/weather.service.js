/**
 * @typedef {import("../../types/new-tab.js").WeatherData} WeatherData
 */
import { Service } from '../service.js';

export class WeatherService {
    /**
     * @param {import("../../src/index.js").NewTabPage} ntp - The internal data feed, expected to have a `subscribe` method.
     * @internal
     */
    constructor(ntp) {
        /** @type {Service<WeatherData>} */
        this.dataService = new Service({
            initial: () => ntp.messaging.request('weather_getData'),
            subscribe: (cb) => ntp.messaging.subscribe('weather_onDataUpdate', cb),
        });
    }

    name() {
        return 'WeatherService';
    }

    /**
     * @returns {Promise<{data: WeatherData}>}
     * @internal
     */
    async getInitial() {
        const data = await this.dataService.fetchInitial();
        return { data };
    }

    /**
     * @internal
     */
    destroy() {
        this.dataService.destroy();
    }

    /**
     * @param {(evt: {data: WeatherData, source: 'manual' | 'subscription'}) => void} cb
     * @internal
     */
    onData(cb) {
        return this.dataService.onData(cb);
    }
}
