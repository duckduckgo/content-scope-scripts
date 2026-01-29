import { h } from 'preact';
import { useContext } from 'preact/hooks';
import { StockContext } from './StockProvider.js';
import { Stock } from './Stock.js';
import { WidgetConfigContext } from '../../widget-list/widget-config.provider.js';

/**
 * Component that consumes StockContext for displaying stock data.
 */
export function StockConsumer() {
    const { state, instanceId, openSetSymbolDialog } = useContext(StockContext);
    const { getConfigForInstance, updateInstanceConfig } = useContext(WidgetConfigContext);

    if (state.status === 'ready') {
        const config = instanceId ? getConfigForInstance(instanceId) : null;

        return (
            <Stock
                data={state.data}
                instanceId={instanceId}
                config={config}
                onSetSymbol={openSetSymbolDialog}
                onUpdateConfig={(updates) => instanceId && updateInstanceConfig(instanceId, updates)}
            />
        );
    }

    return null;
}
