import { h } from 'preact';
import { useVisibility } from '../../widget-list/widget-config.provider.js';
import { useCustomizer } from '../../customizer/components/CustomizerMenu.js';
import { StockProvider } from './StockProvider.js';
import { StockConsumer } from './StockConsumer.js';

/**
 * Render the stock widget, with integration into the page customizer
 */
export function StockCustomized() {
    const { id, visibility, toggle, index } = useVisibility();

    // register with the visibility menu
    const title = 'Stock';
    useCustomizer({ title, id, icon: null, toggle, visibility: visibility.value, index, enabled: true });

    if (visibility.value === 'hidden') {
        return null;
    }

    return (
        <StockProvider>
            <StockConsumer />
        </StockProvider>
    );
}
