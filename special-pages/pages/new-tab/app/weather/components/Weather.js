import { h } from 'preact';
import styles from './Weather.module.css';

/**
 * @typedef {import('../../../types/new-tab.js').WeatherData} WeatherData
 */

/**
 * Minimal throwaway UI for weather widget - displays temperature and condition
 *
 * @param {Object} props
 * @param {WeatherData} props.data
 */
export function Weather({ data }) {
    return (
        <div className={styles.weather} data-testid="weather-widget">
            <div className={styles.location}>{data.location}</div>
            <div className={styles.temperature}>{data.temperature}°</div>
            <div className={styles.condition}>{data.conditionCode}</div>
            {data.apparentTemperature !== undefined && <div className={styles.feelsLike}>Feels like {data.apparentTemperature}°</div>}
        </div>
    );
}
