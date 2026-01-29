import { h } from 'preact';
import { useContext, useState } from 'preact/hooks';
import styles from './Weather.module.css';
import { WidgetConfigContext } from '../../widget-list/widget-config.provider.js';

/**
 * Empty state component for weather widget when no location is configured
 * @param {object} props
 * @param {string} [props.instanceId]
 */
export function WeatherEmptyState({ instanceId }) {
    const [value, setValue] = useState('');
    const { updateInstanceConfig } = useContext(WidgetConfigContext);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (value.trim() && instanceId) {
            updateInstanceConfig(instanceId, { location: value.trim() });
        }
    };

    return (
        <div className={styles.weather} data-testid="weather-widget-empty">
            <div className={styles.emptyStateTitle}>Weather</div>
            <form className={styles.emptyStateForm} onSubmit={handleSubmit}>
                <input
                    type="text"
                    className={styles.emptyStateInput}
                    placeholder="Enter city name"
                    value={value}
                    onInput={(e) => setValue(/** @type {HTMLInputElement} */ (e.target).value)}
                />
                <button type="submit" className={styles.emptyStateButton} disabled={!value.trim()}>
                    Set location
                </button>
            </form>
        </div>
    );
}
