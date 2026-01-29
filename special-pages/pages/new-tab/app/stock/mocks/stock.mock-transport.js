import { TestTransportConfig } from '@duckduckgo/messaging';
import { stockMocks } from './stock.mocks.js';

const url = typeof window !== 'undefined' ? new URL(window.location.href) : new URL('https://example.com');

/**
 * @template T
 * @param {T} value
 * @return {T}
 */
function clone(value) {
    return window.structuredClone?.(value) ?? JSON.parse(JSON.stringify(value));
}

export function stockMockTransport() {
    /** @type {import('../../../types/new-tab.ts').StockData} */
    let dataset = clone(stockMocks.aapl);

    // Check for preset selection via URL param
    if (url.searchParams.has('stock')) {
        const key = url.searchParams.get('stock');
        if (key && key in stockMocks) {
            dataset = clone(stockMocks[key]);
        } else if (key && key !== 'true') {
            console.warn('unknown mock dataset for stock:', key);
        }
    }

    // Add default instanceId if not present
    if (!dataset.instanceId) {
        dataset.instanceId = 'stock-1';
    }

    // Allow URL param overrides for individual fields
    if (url.searchParams.has('stock.symbol')) {
        const symbol = url.searchParams.get('stock.symbol');
        if (symbol) {
            dataset.symbol = symbol;
        }
    }

    if (url.searchParams.has('stock.price')) {
        const price = parseFloat(url.searchParams.get('stock.price') || '0');
        if (!isNaN(price)) {
            dataset.latestPrice = price;
        }
    }

    if (url.searchParams.has('stock.change')) {
        const change = parseFloat(url.searchParams.get('stock.change') || '0');
        if (!isNaN(change)) {
            dataset.change = change;
        }
    }

    if (url.searchParams.has('stock.changePercent')) {
        const changePercent = parseFloat(url.searchParams.get('stock.changePercent') || '0');
        if (!isNaN(changePercent)) {
            dataset.changePercent = changePercent;
        }
    }

    /** @type {Map<string, (d: any) => void>} */
    const subs = new Map();

    return new TestTransportConfig({
        notify(_msg) {
            console.warn('unhandled stock notification', _msg);
        },
        subscribe(_msg, cb) {
            /** @type {import('../../../types/new-tab.ts').NewTabMessages['subscriptions']['subscriptionEvent']} */
            const sub = /** @type {any} */ (_msg.subscriptionName);
            if (sub === 'stock_onDataUpdate') {
                subs.set(sub, cb);
                // Support continuous updates for testing
                if (url.searchParams.get('stock.continuous')) {
                    const int = setInterval(() => {
                        dataset.latestPrice += Math.random() * 2 - 1;
                        dataset.change = dataset.latestPrice - (dataset.previousClose || dataset.latestPrice);
                        dataset.changePercent = dataset.change / (dataset.previousClose || dataset.latestPrice);
                        subs.get(sub)?.(dataset);
                    }, 1000);
                    return () => {
                        clearInterval(int);
                    };
                }
                return () => {};
            }
            console.warn('unhandled stock sub', sub);
            return () => {};
        },
        request(_msg) {
            /** @type {import('../../../types/new-tab.ts').NewTabMessages['requests']} */
            const msg = /** @type {any} */ (_msg);
            switch (msg.method) {
                case 'stock_getData': {
                    // If instanceId provided, include it in response
                    const instanceId = msg.params?.instanceId || 'stock-1';
                    return Promise.resolve({ ...dataset, instanceId });
                }
                default: {
                    return Promise.reject(new Error('unhandled stock request: ' + msg.method));
                }
            }
        },
    });
}
