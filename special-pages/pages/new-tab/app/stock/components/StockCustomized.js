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
    const { getConfigForInstance } = useContext(WidgetConfigContext);

    if (visibility.value === 'hidden') {
        return null;
    }

    // Check if this instance has a configured symbol
    const config = instanceId ? getConfigForInstance(instanceId) : null;
    const hasSymbol = config && 'symbol' in config && config.symbol !== null && config.symbol !== '';

    if (!hasSymbol) {
        return (
            <StockProvider instanceId={instanceId}>
                <StockEmptyState />
            </StockProvider>
        );
    }

    return (
        <StockProvider instanceId={instanceId}>
            <StockConsumer />
        </StockProvider>
    );
}
