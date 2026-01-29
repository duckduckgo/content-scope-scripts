import { h } from 'preact';
import { useContext } from 'preact/hooks';
import { WeatherContext } from './WeatherProvider.js';
import { Weather } from './Weather.js';

/**
 * @typedef {import('../../../types/new-tab.js').WidgetConfigs[number]} WidgetConfigItem
 */

/**
 * Component that consumes WeatherContext for displaying weather data.
 * @param {object} props
 * @param {string} [props.instanceId]
 * @param {WidgetConfigItem | null} [props.config]
 * @param {(updates: Partial<WidgetConfigItem>) => void} [props.onUpdateConfig]
 */
export function WeatherConsumer({ instanceId, config, onUpdateConfig }) {
    const { state } = useContext(WeatherContext);

    if (state.status === 'ready') {
        return <Weather data={state.data} instanceId={instanceId} config={config} onUpdateConfig={onUpdateConfig} />;
    }

    return null;
}
