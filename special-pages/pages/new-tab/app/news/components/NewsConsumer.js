import { h } from 'preact';
import { useContext } from 'preact/hooks';
import { NewsContext } from './NewsProvider.js';
import { News } from './News.js';
import { WidgetConfigContext } from '../../widget-list/widget-config.provider.js';

/**
 * Component that consumes NewsContext for displaying news data.
 */
export function NewsConsumer() {
    const { state, instanceId, openSetQueryDialog } = useContext(NewsContext);
    const { getConfigForInstance, updateInstanceConfig } = useContext(WidgetConfigContext);

    if (state.status === 'ready') {
        const config = instanceId ? getConfigForInstance(instanceId) : null;

        return (
            <News
                data={state.data}
                instanceId={instanceId}
                config={config}
                onSetQuery={openSetQueryDialog}
                onUpdateConfig={(updates) => instanceId && updateInstanceConfig(instanceId, updates)}
            />
        );
    }

    return null;
}
