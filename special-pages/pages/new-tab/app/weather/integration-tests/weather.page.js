export class WeatherPage {
    /**
     * @param {import("../../../integration-tests/new-tab.page.js").NewtabPage} ntp
     */
    constructor(ntp) {
        this.ntp = ntp;
        this.page = this.ntp.page;
    }

    /**
     * Get the weather widget element
     */
    weatherWidget() {
        return this.page.getByTestId('weather-widget');
    }

    /**
     * Wait for weather widget to be visible
     */
    async waitForWeatherWidget() {
        await this.weatherWidget().waitFor({ state: 'visible' });
    }
}
