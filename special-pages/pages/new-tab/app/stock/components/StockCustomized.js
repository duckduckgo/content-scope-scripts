import { h } from 'preact';
import { useContext } from 'preact/hooks';
import { useVisibility, WidgetConfigContext } from '../../widget-list/widget-config.provider.js';
import { StockProvider } from './StockProvider.js';
import { StockConsumer } from './StockConsumer.js';
import { StockEmptyState } from './StockEmptyState.js';

/**
 * Render the stock widget, with integration into the page customizer
 * @param {object} props
 * @param {string} [props.instanceId]
 */
export function StockCustomized({ instanceId }) {
    const { visibility } = useVisibility();
    const { getConfigForInstance, updateInstanceConfig } = useContext(WidgetConfigContext);

    if (visibility.value === 'hidden') {
        return null;
    }

    // Check if this instance has a configured symbol
    const config = instanceId ? getConfigForInstance(instanceId) : null;
    const hasSymbol = config && 'symbol' in config && config.symbol !== null && config.symbol !== '';

    // Don't wrap empty state in provider - no fetch needed when unconfigured
    if (!hasSymbol) {
        return <StockEmptyState instanceId={instanceId} />;
    }

    return (
        <StockProvider symbol={/** @type {string} */ (config.symbol)}>
            <StockConsumer
                instanceId={instanceId}
                config={config}
                onUpdateConfig={(updates) => instanceId && updateInstanceConfig(instanceId, updates)}
            />
        </StockProvider>
    );
}
