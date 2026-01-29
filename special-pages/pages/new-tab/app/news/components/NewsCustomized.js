import { h } from 'preact';
import { useContext } from 'preact/hooks';
import { useVisibility, WidgetConfigContext } from '../../widget-list/widget-config.provider.js';
import { NewsProvider } from './NewsProvider.js';
import { NewsConsumer } from './NewsConsumer.js';
import { NewsEmptyState } from './NewsEmptyState.js';

/**
 * Render the news widget, with integration into the page customizer
 * @param {object} props
 * @param {string} [props.instanceId]
 */
export function NewsCustomized({ instanceId }) {
    const { visibility } = useVisibility();
    const { getConfigForInstance } = useContext(WidgetConfigContext);

    if (visibility.value === 'hidden') {
        return null;
    }

    // Check if this instance has a configured query
    const config = instanceId ? getConfigForInstance(instanceId) : null;
    const hasQuery = config && 'query' in config && config.query !== null && config.query !== '';

    if (!hasQuery) {
        return (
            <NewsProvider instanceId={instanceId}>
                <NewsEmptyState />
            </NewsProvider>
        );
    }

    return (
        <NewsProvider instanceId={instanceId}>
            <NewsConsumer />
        </NewsProvider>
    );
}
