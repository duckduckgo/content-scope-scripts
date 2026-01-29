/**
 * @typedef {import("../../types/new-tab.js").WeatherData} WeatherData
 */
import { Service } from '../service.js';

export class WeatherService {
    /**
     * @param {import("../../src/index.js").NewTabPage} ntp - The internal data feed, expected to have a `subscribe` method.
     * @param {string} location - Location for weather data
     * @internal
     */
    constructor(ntp, location) {
        this.ntp = ntp;
        this.location = location;
        /** @type {Service<WeatherData>} */
        this.dataService = new Service({
            initial: () => ntp.messaging.request('weather_getData', { location }),
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
}
