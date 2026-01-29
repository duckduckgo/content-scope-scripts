import { h } from 'preact';
import { useContext } from 'preact/hooks';
import { useVisibility, WidgetConfigContext } from '../../widget-list/widget-config.provider.js';
import { WeatherProvider } from './WeatherProvider.js';
import { WeatherConsumer } from './WeatherConsumer.js';
import { WeatherEmptyState } from './WeatherEmptyState.js';

/**
 * Render the weather widget, with integration into the page customizer
 * @param {object} props
 * @param {string} [props.instanceId]
 */
export function WeatherCustomized({ instanceId }) {
    const { visibility } = useVisibility();
    const { getConfigForInstance } = useContext(WidgetConfigContext);

    if (visibility.value === 'hidden') {
        return null;
    }

    // Check if this instance has a configured location
    const config = instanceId ? getConfigForInstance(instanceId) : null;
    const hasLocation = config && 'location' in config && config.location !== null && config.location !== '';

    if (!hasLocation) {
        return (
            <WeatherProvider instanceId={instanceId}>
                <WeatherEmptyState />
            </WeatherProvider>
        );
    }

    return (
        <WeatherProvider instanceId={instanceId}>
            <WeatherConsumer />
        </WeatherProvider>
    );
}
