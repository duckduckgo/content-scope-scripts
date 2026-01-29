import { h } from 'preact';
import { useContext } from 'preact/hooks';
import { StockContext } from './StockProvider.js';
import { Stock } from './Stock.js';

/**
 * @typedef {import('../../../types/new-tab.js').WidgetConfigs[number]} WidgetConfigItem
 */

/**
 * Component that consumes StockContext for displaying stock data.
 * @param {object} props
 * @param {string} [props.instanceId]
 * @param {WidgetConfigItem | null} [props.config]
 * @param {(updates: Partial<WidgetConfigItem>) => void} [props.onUpdateConfig]
 */
export function StockConsumer({ instanceId, config, onUpdateConfig }) {
    const { state } = useContext(StockContext);

    if (state.status === 'ready') {
        return <Stock data={state.data} instanceId={instanceId} config={config} onUpdateConfig={onUpdateConfig} />;
    }

    return null;
}
