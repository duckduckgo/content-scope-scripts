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
    const { getConfigForInstance, updateInstanceConfig } = useContext(WidgetConfigContext);

    if (visibility.value === 'hidden') {
        return null;
    }

    // Check if this instance has a configured query
    const config = instanceId ? getConfigForInstance(instanceId) : null;
    const hasQuery = config && 'query' in config && config.query !== null && config.query !== '';

    // Don't wrap empty state in provider - no fetch needed when unconfigured
    if (!hasQuery) {
        return <NewsEmptyState instanceId={instanceId} />;
    }

    return (
        <NewsProvider query={/** @type {string} */ (config.query)}>
            <NewsConsumer
                instanceId={instanceId}
                config={config}
                onUpdateConfig={(updates) => instanceId && updateInstanceConfig(instanceId, updates)}
            />
        </NewsProvider>
    );
}
