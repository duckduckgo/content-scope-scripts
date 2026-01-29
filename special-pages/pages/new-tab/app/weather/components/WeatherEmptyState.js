import { h } from 'preact';
import { useContext } from 'preact/hooks';
import styles from './Weather.module.css';
import { WeatherContext } from './WeatherProvider.js';

/**
 * Empty state component for weather widget when no location is configured
 */
export function WeatherEmptyState() {
    const { openSetLocationDialog } = useContext(WeatherContext);

    return (
        <div className={styles.weather} data-testid="weather-widget-empty">
            <div className={styles.emptyStateTitle}>Weather</div>
            <div className={styles.emptyStateDescription}>Set a location to see local weather</div>
            <button className={styles.emptyStateButton} onClick={openSetLocationDialog} type="button">
                Set location
            </button>
        </div>
    );
}
