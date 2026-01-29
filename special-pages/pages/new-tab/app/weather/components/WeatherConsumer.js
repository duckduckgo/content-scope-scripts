import { h } from 'preact';
import { useContext } from 'preact/hooks';
import { WeatherContext } from './WeatherProvider.js';
import { Weather } from './Weather.js';
import { WidgetConfigContext } from '../../widget-list/widget-config.provider.js';

/**
 * Component that consumes WeatherContext for displaying weather data.
 */
export function WeatherConsumer() {
    const { state, instanceId, openSetLocationDialog } = useContext(WeatherContext);
    const { getConfigForInstance, updateInstanceConfig } = useContext(WidgetConfigContext);

    if (state.status === 'ready') {
        const config = instanceId ? getConfigForInstance(instanceId) : null;

        return (
            <Weather
                data={state.data}
                instanceId={instanceId}
                config={config}
                onSetLocation={openSetLocationDialog}
                onUpdateConfig={(updates) => instanceId && updateInstanceConfig(instanceId, updates)}
            />
        );
    }

    return null;
}
