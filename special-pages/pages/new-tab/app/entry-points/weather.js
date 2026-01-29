import { h } from 'preact';
import { Centered } from '../components/Layout.js';
import { WeatherCustomized } from '../weather/components/WeatherCustomized.js';

/**
 * @param {string} [instanceId]
 */
export function factory(instanceId) {
    return (
        <Centered data-entry-point="weather" data-instance-id={instanceId}>
            <WeatherCustomized instanceId={instanceId} />
        </Centered>
    );
}
