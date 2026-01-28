import { h } from 'preact';
import { useContext } from 'preact/hooks';
import { WeatherContext } from './WeatherProvider.js';
import { Weather } from './Weather.js';

/**
 * Component that consumes WeatherContext for displaying weather data.
 */
export function WeatherConsumer() {
    const { state } = useContext(WeatherContext);

    if (state.status === 'ready') {
        return <Weather data={state.data} />;
    }

    return null;
}
