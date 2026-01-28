export class NewsPage {
    /**
     * @param {import("../../../integration-tests/new-tab.page.js").NewtabPage} ntp
     */
    constructor(ntp) {
        this.ntp = ntp;
        this.page = this.ntp.page;
    }

    /**
     * Get the news widget element
     */
    newsWidget() {
        return this.page.getByTestId('news-widget');
    }

    /**
     * Wait for news widget to be visible
     */
    async waitForNewsWidget() {
        await this.newsWidget().waitFor({ state: 'visible' });
    }
}
