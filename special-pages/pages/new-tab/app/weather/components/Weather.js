import { h } from 'preact';
import styles from './Weather.module.css';
import { WidgetSettingsMenu } from '../../components/WidgetSettingsMenu.js';

/**
 * @typedef {import('../../../types/new-tab.js').WeatherData} WeatherData
 * @typedef {import('../../../types/new-tab.js').WidgetConfigs[number]} WidgetConfigItem
 */

/**
 * Minimal throwaway UI for weather widget - displays temperature and condition
 *
 * @param {Object} props
 * @param {WeatherData} props.data
 * @param {string} [props.instanceId]
 * @param {WidgetConfigItem | null} [props.config]
 * @param {() => void} [props.onSetLocation]
 * @param {(updates: Partial<WidgetConfigItem>) => void} [props.onUpdateConfig]
 */
export function Weather({ data, instanceId, config, onSetLocation, onUpdateConfig }) {
    return (
        <div className={styles.weather} data-testid="weather-widget">
            {instanceId && onSetLocation && onUpdateConfig && (
                <WidgetSettingsMenu
                    widgetType="weather"
                    config={config || null}
                    onSetConfig={onSetLocation}
                    onUpdateConfig={onUpdateConfig}
                />
            )}
            <div className={styles.location}>{data.location}</div>
            <div className={styles.temperature}>{data.temperature}°</div>
            <div className={styles.condition}>{data.conditionCode}</div>
            {data.apparentTemperature !== undefined && <div className={styles.feelsLike}>Feels like {data.apparentTemperature}°</div>}
        </div>
    );
}
