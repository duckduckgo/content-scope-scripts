import { h } from 'preact';
import { Centered } from '../components/Layout.js';
import { WeatherCustomized } from '../weather/components/WeatherCustomized.js';

export function factory() {
    return (
        <Centered data-entry-point="weather">
            <WeatherCustomized />
        </Centered>
    );
}
