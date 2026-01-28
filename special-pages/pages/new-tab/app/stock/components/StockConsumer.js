import { h } from 'preact';
import { useContext } from 'preact/hooks';
import { StockContext } from './StockProvider.js';
import { Stock } from './Stock.js';

/**
 * Component that consumes StockContext for displaying stock data.
 */
export function StockConsumer() {
    const { state } = useContext(StockContext);

    if (state.status === 'ready') {
        return <Stock data={state.data} />;
    }

    return null;
}
