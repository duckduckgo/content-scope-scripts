import { TestTransportConfig } from '@duckduckgo/messaging';
import { stockMocks } from './stock.mocks.js';

/**
 * @template T
 * @param {T} value
 * @return {T}
 */
function clone(value) {
    return window.structuredClone?.(value) ?? JSON.parse(JSON.stringify(value));
}

/**
 * Look up mock data for a symbol
 * @param {string} symbol
 * @returns {import('../../../types/new-tab.ts').StockData}
 */
function getMockForSymbol(symbol) {
    const key = symbol.toLowerCase();
    if (key in stockMocks) {
        return clone(stockMocks[key]);
    }
    // Return a generic mock for unknown symbols
    return {
        symbol: symbol.toUpperCase(),
        companyName: `${symbol.toUpperCase()} Inc`,
        latestPrice: 100 + Math.random() * 100,
        change: (Math.random() - 0.5) * 10,
        changePercent: (Math.random() - 0.5) * 0.1,
        currency: 'USD',
        previousClose: 100,
        open: 100,
        high: 110,
        low: 95,
        week52High: 150,
        week52Low: 75,
        latestUpdate: Date.now(),
        primaryExchange: 'NYSE',
        peRatio: 20,
        marketCap: null,
        avgTotalVolume: null,
        assetType: 'stock',
    };
}

export function stockMockTransport() {
    return new TestTransportConfig({
        notify(_msg) {
            console.warn('unhandled stock notification', _msg);
        },
        subscribe(_msg, _cb) {
            console.warn('unhandled stock subscription', _msg);
            return () => {};
        },
        request(_msg) {
            /** @type {import('../../../types/new-tab.ts').NewTabMessages['requests']} */
            const msg = /** @type {any} */ (_msg);
            switch (msg.method) {
                case 'stock_getData': {
                    // Handle array of symbols
                    const symbols = msg.params?.symbols || [];
                    const results = symbols.map((symbol) => getMockForSymbol(symbol));
                    return Promise.resolve(results);
                }
                default: {
                    return Promise.reject(new Error('unhandled stock request: ' + msg.method));
                }
            }
        },
    });
}
