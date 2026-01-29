import { h } from 'preact';
import { useContext } from 'preact/hooks';
import { NewsContext } from './NewsProvider.js';
import { News } from './News.js';

/**
 * @typedef {import('../../../types/new-tab.js').WidgetConfigs[number]} WidgetConfigItem
 */

/**
 * Component that consumes NewsContext for displaying news data.
 * @param {object} props
 * @param {string} [props.instanceId]
 * @param {WidgetConfigItem | null} [props.config]
 * @param {(updates: Partial<WidgetConfigItem>) => void} [props.onUpdateConfig]
 */
export function NewsConsumer({ instanceId, config, onUpdateConfig }) {
    const { state } = useContext(NewsContext);

    if (state.status === 'ready') {
        return <News data={state.data} instanceId={instanceId} config={config} onUpdateConfig={onUpdateConfig} />;
    }

    return null;
}
