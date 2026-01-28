export class StockPage {
    /**
     * @param {import("../../../integration-tests/new-tab.page.js").NewtabPage} ntp
     */
    constructor(ntp) {
        this.ntp = ntp;
        this.page = this.ntp.page;
    }

    /**
     * Get the stock widget element
     */
    stockWidget() {
        return this.page.getByTestId('stock-widget');
    }

    /**
     * Wait for stock widget to be visible
     */
    async waitForStockWidget() {
        await this.stockWidget().waitFor({ state: 'visible' });
    }
}
