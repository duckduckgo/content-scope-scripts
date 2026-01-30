import { Fragment, h } from 'preact';
import styles from './Weather.module.css';
import { WidgetSettingsMenu } from '../../components/WidgetSettingsMenu.js';

/**
 * @typedef {import('../../../types/new-tab.js').WeatherData} WeatherData
 * @typedef {import('../../../types/new-tab.js').WidgetConfigs[number]} WidgetConfigItem
 * @typedef {'expanded' | 'collapsed'} Expansion
 */

/**
 * Map WeatherKit condition codes to display-friendly labels
 * @param {string} code
 * @returns {string}
 */
function formatCondition(code) {
    const conditions = {
        Clear: 'Clear',
        MostlyClear: 'Mostly Clear',
        PartlyCloudy: 'Partly Cloudy',
        MostlyCloudy: 'Mostly Cloudy',
        Cloudy: 'Cloudy',
        Rain: 'Rain',
        Drizzle: 'Drizzle',
        Thunderstorms: 'Thunderstorms',
        Windy: 'Windy',
        // Legacy codes from mocks
        sunny: 'Sunny',
        cloudy: 'Cloudy',
        partlyCloudy: 'Partly Cloudy',
        rainy: 'Rain',
        snowy: 'Snow',
    };
    return conditions[code] || code;
}

/**
 * Weather widget - displays current conditions and forecast
 *
 * @param {Object} props
 * @param {WeatherData} props.data
 * @param {string} [props.instanceId]
 * @param {WidgetConfigItem | null} [props.config]
 * @param {(updates: Partial<WidgetConfigItem>) => void} [props.onUpdateConfig]
 */
export function Weather({ data, instanceId, config, onUpdateConfig }) {
    const expansion = config && 'expansion' in config ? config.expansion : 'expanded';
    const temperatureUnit = config && 'temperatureUnit' in config ? config.temperatureUnit : 'fahrenheit';
    const isExpanded = expansion === 'expanded';

    // Temperature display (native provides values in user's preferred unit)
    const temp = Math.round(data.temperature);
    const highTemp = data.high !== undefined ? Math.round(data.high) : null;
    const lowTemp = data.low !== undefined ? Math.round(data.low) : null;

    return (
        <article
            className={styles.widget}
            data-expansion={expansion}
            data-testid="weather-widget"
            aria-label={`Weather in ${data.location}: ${temp}° ${formatCondition(data.conditionCode)}`}
        >
            {isExpanded ? (
                <WeatherWide
                    data={data}
                    temp={temp}
                    highTemp={highTemp}
                    lowTemp={lowTemp}
                    temperatureUnit={temperatureUnit}
                    instanceId={instanceId}
                    config={config}
                    onUpdateConfig={onUpdateConfig}
                />
            ) : (
                <WeatherSmall
                    data={data}
                    temp={temp}
                    highTemp={highTemp}
                    lowTemp={lowTemp}
                    temperatureUnit={temperatureUnit}
                    instanceId={instanceId}
                    config={config}
                    onUpdateConfig={onUpdateConfig}
                />
            )}
        </article>
    );
}

/**
 * Small/collapsed weather widget layout
 * @param {Object} props
 * @param {WeatherData} props.data
 * @param {number} props.temp
 * @param {number | null} props.highTemp
 * @param {number | null} props.lowTemp
 * @param {'celsius' | 'fahrenheit' | undefined} props.temperatureUnit
 * @param {string} [props.instanceId]
 * @param {WidgetConfigItem | null} [props.config]
 * @param {(updates: Partial<WidgetConfigItem>) => void} [props.onUpdateConfig]
 */
function WeatherSmall({ data, temp, highTemp, lowTemp, temperatureUnit, instanceId, config, onUpdateConfig }) {
    return (
        <>
            <header className={styles.header}>
                <div className={styles.titleGroup}>
                    <h2 className={styles.condition}>{formatCondition(data.conditionCode)}</h2>
                    <p className={styles.location}>{data.location}</p>
                </div>
                {instanceId && onUpdateConfig ? (
                    <WidgetSettingsMenu widgetType="weather" config={config || null} onUpdateConfig={onUpdateConfig} />
                ) : null}
            </header>

            <div className={styles.body}>
                <div className={styles.currentTemp}>
                    <WeatherIcon conditionCode={data.conditionCode} size="large" />
                    <div className={styles.tempDisplay}>
                        <span className={styles.tempValue}>{temp}</span>
                        <span className={styles.tempDegree}>°</span>
                    </div>
                    <TempUnitToggle unit={temperatureUnit} onUpdateConfig={onUpdateConfig} />
                </div>

                {highTemp !== null || lowTemp !== null ? <HighLow high={highTemp} low={lowTemp} /> : null}
            </div>
        </>
    );
}

/**
 * Wide/expanded weather widget layout
 * @param {Object} props
 * @param {WeatherData} props.data
 * @param {number} props.temp
 * @param {number | null} props.highTemp
 * @param {number | null} props.lowTemp
 * @param {'celsius' | 'fahrenheit' | undefined} props.temperatureUnit
 * @param {string} [props.instanceId]
 * @param {WidgetConfigItem | null} [props.config]
 * @param {(updates: Partial<WidgetConfigItem>) => void} [props.onUpdateConfig]
 */
function WeatherWide({ data, temp, highTemp, lowTemp, temperatureUnit, instanceId, config, onUpdateConfig }) {
    return (
        <>
            <header className={styles.headerWide}>
                <div className={styles.currentTempWide}>
                    <WeatherIcon conditionCode={data.conditionCode} size="large" />
                    <div className={styles.tempDisplay}>
                        <span className={styles.tempValueWide}>{temp}</span>
                        <span className={styles.tempDegreeWide}>°</span>
                    </div>
                    <TempUnitToggle unit={temperatureUnit} onUpdateConfig={onUpdateConfig} />
                </div>

                <div className={styles.detailsWide}>
                    <h2 className={styles.conditionWide}>{formatCondition(data.conditionCode)}</h2>
                    <p className={styles.locationWide}>{data.location}</p>
                    {highTemp !== null || lowTemp !== null ? <HighLow high={highTemp} low={lowTemp} /> : null}
                </div>

                {instanceId && onUpdateConfig ? (
                    <WidgetSettingsMenu widgetType="weather" config={config || null} onUpdateConfig={onUpdateConfig} />
                ) : null}
            </header>

            {data.forecast && data.forecast.length > 0 ? (
                <>
                    <div className={styles.separator} role="presentation" />
                    <div className={styles.forecast}>
                        {data.forecast.slice(0, 7).map((day) => (
                            <div key={day.day} className={styles.forecastDay}>
                                <span className={styles.forecastDayName}>{day.day}</span>
                                <WeatherIcon conditionCode={day.conditionCode} size="small" />
                                <span className={styles.forecastTemp}>
                                    {Math.round(day.high)}
                                    <span className={styles.forecastDegree}>°</span>
                                </span>
                            </div>
                        ))}
                    </div>
                </>
            ) : null}
        </>
    );
}

/**
 * High/Low temperature display
 * @param {Object} props
 * @param {number | null} props.high
 * @param {number | null} props.low
 */
function HighLow({ high, low }) {
    return (
        <div className={styles.highLow}>
            {high !== null && (
                <span className={styles.highLowItem}>
                    <span className={styles.highLowLabel}>High</span>
                    <span className={styles.highLowValue}>
                        {high}
                        <span className={styles.highLowDegree}>°</span>
                    </span>
                </span>
            )}
            {high !== null && low !== null && <span className={styles.highLowDivider} aria-hidden="true" />}
            {low !== null && (
                <span className={styles.highLowItem}>
                    <span className={styles.highLowLabel}>Low</span>
                    <span className={styles.highLowValue}>
                        {low}
                        <span className={styles.highLowDegree}>°</span>
                    </span>
                </span>
            )}
        </div>
    );
}

/**
 * Temperature unit toggle (F/C) - clickable to switch units
 * @param {Object} props
 * @param {'celsius' | 'fahrenheit' | undefined} props.unit
 * @param {((updates: Partial<WidgetConfigItem>) => void) | undefined} [props.onUpdateConfig]
 */
function TempUnitToggle({ unit, onUpdateConfig }) {
    const isCelsius = unit === 'celsius';

    const handleClick = (newUnit) => {
        if (onUpdateConfig && newUnit !== unit) {
            onUpdateConfig({ temperatureUnit: newUnit });
        }
    };

    return (
        <div className={styles.unitToggle} role="group" aria-label="Temperature unit">
            <button
                type="button"
                className={`${styles.unitOption} ${!isCelsius ? styles.unitSelected : ''}`}
                onClick={() => handleClick('fahrenheit')}
                aria-pressed={!isCelsius}
                aria-label="Fahrenheit"
            >
                <FahrenheitIcon />
            </button>
            <span className={styles.unitDivider} aria-hidden="true" />
            <button
                type="button"
                className={`${styles.unitOption} ${isCelsius ? styles.unitSelected : ''}`}
                onClick={() => handleClick('celsius')}
                aria-pressed={isCelsius}
                aria-label="Celsius"
            >
                <CelsiusIcon />
            </button>
        </div>
    );
}

/**
 * Weather icon component
 * @param {Object} props
 * @param {string} props.conditionCode
 * @param {'small' | 'large'} props.size
 */
function WeatherIcon({ conditionCode, size }) {
    // Map condition codes to icon types
    const iconType = getIconType(conditionCode);
    const sizeClass = size === 'large' ? styles.iconLarge : styles.iconSmall;

    return (
        <div className={`${styles.icon} ${sizeClass}`} aria-hidden="true" data-condition={iconType}>
            {iconType === 'sun' && <SunIcon />}
            {iconType === 'cloud' && <CloudIcon />}
            {iconType === 'partlyCloudy' && <PartlyCloudyIcon />}
            {iconType === 'rain' && <RainIcon />}
            {iconType === 'snow' && <SnowIcon />}
            {iconType === 'storm' && <StormIcon />}
        </div>
    );
}

/**
 * @param {string} code
 * @returns {'sun' | 'cloud' | 'partlyCloudy' | 'rain' | 'snow' | 'storm'}
 */
function getIconType(code) {
    const iconMap = {
        Clear: 'sun',
        MostlyClear: 'sun',
        sunny: 'sun',
        Cloudy: 'cloud',
        MostlyCloudy: 'cloud',
        cloudy: 'cloud',
        PartlyCloudy: 'partlyCloudy',
        partlyCloudy: 'partlyCloudy',
        Rain: 'rain',
        Drizzle: 'rain',
        rainy: 'rain',
        Thunderstorms: 'storm',
        snowy: 'snow',
        Windy: 'cloud',
    };
    return /** @type {'sun' | 'cloud' | 'partlyCloudy' | 'rain' | 'snow' | 'storm'} */ (iconMap[code] || 'sun');
}

// Weather condition icons
function SunIcon() {
    return (
        <svg viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15.75 5.25C15.75 4.83579 15.4142 4.5 15 4.5C14.5858 4.5 14.25 4.83579 14.25 5.25V6.75C14.25 7.16421 14.5858 7.5 15 7.5C15.4142 7.5 15.75 7.16421 15.75 6.75V5.25Z" fill="#F9BE1A"/>
            <path d="M20.2499 5.90671C20.6086 6.11381 20.7315 6.57251 20.5244 6.93123L19.7744 8.23027C19.5673 8.58898 19.1086 8.71189 18.7499 8.50478C18.3911 8.29768 18.2682 7.83898 18.4753 7.48026L19.2253 6.18123C19.4324 5.82251 19.8911 5.6996 20.2499 5.90671Z" fill="#F9BE1A"/>
            <path d="M24.093 9.74995C24.3001 10.1087 24.1772 10.5674 23.8185 10.7745L22.5195 11.5245C22.1607 11.7316 21.702 11.6087 21.4949 11.25C21.2878 10.8912 21.4107 10.4325 21.7695 10.2254L23.0685 9.47543C23.4272 9.26833 23.8859 9.39123 24.093 9.74995Z" fill="#F9BE1A"/>
            <path d="M11.5244 22.5197C11.7315 22.161 11.6086 21.7023 11.2499 21.4952C10.8911 21.2881 10.4324 21.411 10.2253 21.7697L9.47534 23.0688C9.26824 23.4275 9.39114 23.8862 9.74986 24.0933C10.1086 24.3004 10.5673 24.1775 10.7744 23.8188L11.5244 22.5197Z" fill="#F9BE1A"/>
            <path d="M24.093 20.25C23.8859 20.6087 23.4272 20.7316 23.0685 20.5245L21.7695 19.7745C21.4107 19.5674 21.2878 19.1087 21.4949 18.75C21.702 18.3913 22.1607 18.2684 22.5195 18.4755L23.8185 19.2255C24.1772 19.4326 24.3001 19.8913 24.093 20.25Z" fill="#F9BE1A"/>
            <path d="M7.48 11.5245C7.83872 11.7316 8.29741 11.6087 8.50452 11.25C8.71162 10.8913 8.58872 10.4326 8.23 10.2255L6.93096 9.47548C6.57224 9.26837 6.11355 9.39128 5.90644 9.75C5.69933 10.1087 5.82224 10.5674 6.18096 10.7745L7.48 11.5245Z" fill="#F9BE1A"/>
            <path d="M8.50452 18.75C8.71162 19.1087 8.58872 19.5674 8.23 19.7745L6.93096 20.5245C6.57224 20.7316 6.11355 20.6087 5.90644 20.25C5.69933 19.8912 5.82224 19.4325 6.18096 19.2254L7.48 18.4754C7.83872 18.2683 8.29741 18.3912 8.50452 18.75Z" fill="#F9BE1A"/>
            <path d="M19.2253 23.8187C19.4324 24.1774 19.8911 24.3004 20.2498 24.0932C20.6085 23.8861 20.7314 23.4274 20.5243 23.0687L19.7743 21.7697C19.5672 21.411 19.1085 21.2881 18.7498 21.4952C18.3911 21.7023 18.2681 22.161 18.4753 22.5197L19.2253 23.8187Z" fill="#F9BE1A"/>
            <path d="M11.2498 8.50484C10.8911 8.71194 10.4324 8.58904 10.2253 8.23032L9.47525 6.93128C9.26815 6.57256 9.39105 6.11387 9.74977 5.90676C10.1085 5.69965 10.5672 5.82256 10.7743 6.18128L11.5243 7.48032C11.7314 7.83904 11.6085 8.29773 11.2498 8.50484Z" fill="#F9BE1A"/>
            <path d="M15 22.5C15.4142 22.5 15.75 22.8358 15.75 23.25V24.75C15.75 25.1642 15.4142 25.5 15 25.5C14.5858 25.5 14.25 25.1642 14.25 24.75V23.25C14.25 22.8358 14.5858 22.5 15 22.5Z" fill="#F9BE1A"/>
            <path d="M24.75 15.75C25.1642 15.75 25.5 15.4142 25.5 15C25.5 14.5858 25.1642 14.25 24.75 14.25H23.25C22.8358 14.25 22.5 14.5858 22.5 15C22.5 15.4142 22.8358 15.75 23.25 15.75H24.75Z" fill="#F9BE1A"/>
            <path d="M7.5 15C7.5 15.4142 7.16421 15.75 6.75 15.75H5.25C4.83579 15.75 4.5 15.4142 4.5 15C4.5 14.5858 4.83579 14.25 5.25 14.25H6.75C7.16421 14.25 7.5 14.5858 7.5 15Z" fill="#F9BE1A"/>
            <path d="M14.9996 21C18.3133 21 20.9996 18.3137 20.9996 15C20.9996 11.6863 18.3133 9 14.9996 9C11.6859 9 8.99963 11.6863 8.99963 15C8.99963 18.3137 11.6859 21 14.9996 21Z" fill="#F9BE1A"/>
        </svg>
    );
}

function CloudIcon() {
    return (
        <svg viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6.75C18 6.33579 17.6642 6 17.25 6C16.8358 6 16.5 6.33579 16.5 6.75V7.5C16.5 7.91421 16.8358 8.25 17.25 8.25C17.6642 8.25 18 7.91421 18 7.5V6.75Z" fill="#F9BE1A"/>
            <path d="M14.2501 9.05386C13.8914 9.26096 13.4327 9.13806 13.2256 8.77934L12.8506 8.12982C12.6435 7.7711 12.7664 7.31241 13.1251 7.1053C13.4839 6.89819 13.9426 7.0211 14.1497 7.37982L14.5247 8.02934C14.7318 8.38806 14.6089 8.84675 14.2501 9.05386Z" fill="#F9BE1A"/>
            <path d="M21.3749 7.10534C21.7336 7.31245 21.8565 7.77114 21.6494 8.12986L21.2744 8.77938C21.0673 9.1381 20.6086 9.261 20.2499 9.0539C19.8911 8.84679 19.7682 8.3881 19.9753 8.02938L20.3503 7.37986C20.5574 7.02114 21.0161 6.89823 21.3749 7.10534Z" fill="#F9BE1A"/>
            <path d="M14.2499 19.4462C14.6086 19.6533 14.7315 20.112 14.5244 20.4707L14.1494 21.1202C13.9423 21.4789 13.4836 21.6019 13.1249 21.3947C12.7661 21.1876 12.6432 20.7289 12.8503 20.3702L13.2253 19.7207C13.4324 19.362 13.8911 19.2391 14.2499 19.4462Z" fill="#F9BE1A"/>
            <path d="M23.3703 18.6495C23.729 18.8566 24.1877 18.7337 24.3948 18.375C24.6019 18.0163 24.479 17.5576 24.1203 17.3505L23.4707 16.9755C23.112 16.7684 22.6533 16.8913 22.4462 17.25C22.2391 17.6087 22.362 18.0674 22.7207 18.2745L23.3703 18.6495Z" fill="#F9BE1A"/>
            <path d="M12.0538 11.25C11.8467 11.6087 11.388 11.7316 11.0293 11.5245L10.3798 11.1495C10.0211 10.9424 9.89817 10.4837 10.1053 10.125C10.3124 9.7663 10.7711 9.6434 11.1298 9.8505L11.7793 10.2255C12.138 10.4326 12.2609 10.8913 12.0538 11.25Z" fill="#F9BE1A"/>
            <path d="M24.1203 11.1495C24.479 10.9424 24.6019 10.4837 24.3948 10.125C24.1877 9.7663 23.729 9.64339 23.3703 9.8505L22.7207 10.2255C22.362 10.4326 22.2391 10.8913 22.4462 11.25C22.6533 11.6087 23.112 11.7316 23.4707 11.5245L24.1203 11.1495Z" fill="#F9BE1A"/>
            <path d="M12.0538 17.25C12.2609 17.6087 12.138 18.0674 11.7793 18.2745L11.1298 18.6495C10.7711 18.8566 10.3124 18.7337 10.1053 18.375C9.89817 18.0163 10.0211 17.5576 10.3798 17.3505L11.0293 16.9755C11.388 16.7684 11.8467 16.8913 12.0538 17.25Z" fill="#F9BE1A"/>
            <path d="M20.3506 21.1202C20.5577 21.4789 21.0164 21.6018 21.3751 21.3947C21.7339 21.1876 21.8568 20.7289 21.6497 20.3702L21.2747 19.7207C21.0676 19.3619 20.6089 19.239 20.2501 19.4461C19.8914 19.6533 19.7685 20.1119 19.9756 20.4707L20.3506 21.1202Z" fill="#F9BE1A"/>
            <path d="M17.25 20.25C17.6642 20.25 18 20.5858 18 21V21.75C18 22.1642 17.6642 22.5 17.25 22.5C16.8358 22.5 16.5 22.1642 16.5 21.75V21C16.5 20.5858 16.8358 20.25 17.25 20.25Z" fill="#F9BE1A"/>
            <path d="M24.75 15C25.1642 15 25.5 14.6642 25.5 14.25C25.5 13.8358 25.1642 13.5 24.75 13.5H24C23.5858 13.5 23.25 13.8358 23.25 14.25C23.25 14.6642 23.5858 15 24 15H24.75Z" fill="#F9BE1A"/>
            <path d="M11.25 14.25C11.25 14.6642 10.9142 15 10.5 15H9.75C9.33579 15 9 14.6642 9 14.25C9 13.8358 9.33579 13.5 9.75 13.5H10.5C10.9142 13.5 11.25 13.8358 11.25 14.25Z" fill="#F9BE1A"/>
            <path d="M17.25 19.5001C20.1495 19.5001 22.5 17.1496 22.5 14.25C22.5 11.3505 20.1495 9.00002 17.25 9.00002C14.3505 9.00002 12 11.3505 12 14.25C12 17.1496 14.3505 19.5001 17.25 19.5001Z" fill="#F9BE1A"/>
            <path d="M6.94205 16.7344C6.81702 16.3029 6.75 15.8468 6.75 15.375C6.75 12.6826 8.93261 10.5 11.625 10.5C13.8434 10.5 15.7157 11.9818 16.3062 14.0095C16.8502 13.2471 17.742 12.75 18.75 12.75C20.4069 12.75 21.75 14.0931 21.75 15.75C21.75 16.009 21.7172 16.2603 21.6555 16.5H21.75C23.8211 16.5 25.5 18.1789 25.5 20.25C25.5 22.3211 23.8211 24 21.75 24H8.25C6.17893 24 4.5 22.3211 4.5 20.25C4.5 18.639 5.51591 17.2652 6.94205 16.7344Z" fill="#DDDDDD"/>
        </svg>
    );
}

function PartlyCloudyIcon() {
    return (
        <svg viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13.5 6C13.9142 6 14.25 6.33579 14.25 6.75V7.5C14.25 7.91421 13.9142 8.25 13.5 8.25C13.0858 8.25 12.75 7.91421 12.75 7.5V6.75C12.75 6.33579 13.0858 6 13.5 6Z" fill="#F9BE1A"/>
            <path d="M13.5 20.25C13.9142 20.25 14.25 20.5858 14.25 21V21.75C14.25 22.1642 13.9142 22.5 13.5 22.5C13.0858 22.5 12.75 22.1642 12.75 21.75V21C12.75 20.5858 13.0858 20.25 13.5 20.25Z" fill="#F9BE1A"/>
            <path d="M21 15C21.4142 15 21.75 14.6642 21.75 14.25C21.75 13.8358 21.4142 13.5 21 13.5H20.25C19.8358 13.5 19.5 13.8358 19.5 14.25C19.5 14.6642 19.8358 15 20.25 15H21Z" fill="#F9BE1A"/>
            <path d="M7.5 14.25C7.5 14.6642 7.16421 15 6.75 15H6C5.58579 15 5.25 14.6642 5.25 14.25C5.25 13.8358 5.58579 13.5 6 13.5H6.75C7.16421 13.5 7.5 13.8358 7.5 14.25Z" fill="#F9BE1A"/>
            <path d="M17.8994 8.12986C18.1065 7.77114 17.9836 7.31245 17.6249 7.10534C17.2661 6.89823 16.8074 7.02114 16.6003 7.37986L16.2253 8.02938C16.0182 8.3881 16.1411 8.84679 16.4999 9.0539C16.8586 9.261 17.3173 9.1381 17.5244 8.77938L17.8994 8.12986Z" fill="#F9BE1A"/>
            <path d="M10.4999 19.4462C10.8586 19.6533 10.9815 20.112 10.7744 20.4707L10.3994 21.1202C10.1923 21.4789 9.73358 21.6018 9.37486 21.3947C9.01614 21.1876 8.89324 20.7289 9.10034 20.3702L9.47534 19.7207C9.68245 19.362 10.1411 19.2391 10.4999 19.4462Z" fill="#F9BE1A"/>
            <path d="M19.6203 18.6495C19.979 18.8566 20.4377 18.7337 20.6448 18.375C20.8519 18.0163 20.729 17.5576 20.3703 17.3505L19.7207 16.9755C19.362 16.7684 18.9033 16.8913 18.6962 17.25C18.4891 17.6087 18.612 18.0674 18.9707 18.2745L19.6203 18.6495Z" fill="#F9BE1A"/>
            <path d="M8.30383 11.25C8.09673 11.6087 7.63803 11.7316 7.27931 11.5245L6.62979 11.1495C6.27108 10.9424 6.14817 10.4837 6.35528 10.125C6.56238 9.7663 7.02108 9.6434 7.37979 9.8505L8.02931 10.2255C8.38803 10.4326 8.51094 10.8913 8.30383 11.25Z" fill="#F9BE1A"/>
            <path d="M20.3703 11.1495C20.729 10.9424 20.8519 10.4837 20.6448 10.125C20.4377 9.7663 19.979 9.64339 19.6203 9.8505L18.9707 10.2255C18.612 10.4326 18.4891 10.8913 18.6962 11.25C18.9033 11.6087 19.362 11.7316 19.7207 11.5245L20.3703 11.1495Z" fill="#F9BE1A"/>
            <path d="M8.30383 17.25C8.51094 17.6087 8.38803 18.0674 8.02931 18.2745L7.37979 18.6495C7.02108 18.8566 6.56238 18.7337 6.35528 18.375C6.14817 18.0163 6.27108 17.5576 6.62979 17.3505L7.27931 16.9755C7.63803 16.7684 8.09673 16.8913 8.30383 17.25Z" fill="#F9BE1A"/>
            <path d="M16.6006 21.1202C16.8077 21.4789 17.2664 21.6018 17.6251 21.3947C17.9839 21.1876 18.1068 20.7289 17.8997 20.3702L17.5247 19.7207C17.3176 19.3619 16.8589 19.239 16.5001 19.4461C16.1414 19.6533 16.0185 20.1119 16.2256 20.4707L16.6006 21.1202Z" fill="#F9BE1A"/>
            <path d="M10.5001 9.05386C10.1414 9.26096 9.68273 9.13806 9.47562 8.77934L9.10062 8.12982C8.89351 7.7711 9.01642 7.31241 9.37514 7.1053C9.73386 6.89819 10.1926 7.0211 10.3997 7.37982L10.7747 8.02934C10.9818 8.38806 10.8589 8.84675 10.5001 9.05386Z" fill="#F9BE1A"/>
            <path d="M13.5 19.5001C16.3995 19.5001 18.75 17.1496 18.75 14.25C18.75 11.3505 16.3995 9.00002 13.5 9.00002C10.6005 9.00002 8.25 11.3505 8.25 14.25C8.25 17.1496 10.6005 19.5001 13.5 19.5001Z" fill="#F9BE1A"/>
            <path d="M19.875 15C21.739 15 23.25 16.511 23.25 18.375C23.25 18.5811 23.2297 18.7826 23.1943 18.9785C24.1108 19.3881 24.75 20.3063 24.75 21.375C24.75 22.8247 23.5747 24 22.125 24H13.125C11.6753 24 10.5 22.8247 10.5 21.375C10.5 20.0378 11.5001 18.9358 12.793 18.7725C12.7653 18.6443 12.75 18.5114 12.75 18.375C12.75 17.3395 13.5895 16.5 14.625 16.5C15.6605 16.5 16.5 17.3395 16.5 18.375C16.5 18.5035 16.4865 18.6288 16.4619 18.75H16.5215C16.5079 18.6268 16.5 18.5018 16.5 18.375C16.5 16.511 18.011 15 19.875 15Z" fill="#DDDDDD"/>
        </svg>
    );
}

function RainIcon() {
    return (
        <svg viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6.94205 10.7344C6.81702 10.3029 6.75 9.84679 6.75 9.375C6.75 6.68261 8.93261 4.5 11.625 4.5C13.8434 4.5 15.7157 5.98176 16.3062 8.00955C16.8502 7.24711 17.742 6.75 18.75 6.75C20.4069 6.75 21.75 8.09315 21.75 9.75C21.75 10.009 21.7172 10.2603 21.6555 10.5H21.75C23.8211 10.5 25.5 12.1789 25.5 14.25C25.5 16.3211 23.8211 18 21.75 18H8.25C6.17893 18 4.5 16.3211 4.5 14.25C4.5 12.639 5.51591 11.2652 6.94205 10.7344Z" fill="#DDDDDD"/>
            <circle cx="10" cy="21" r="1.5" fill="#7295F6"/>
            <circle cx="15" cy="23" r="1.5" fill="#7295F6"/>
            <circle cx="20" cy="21" r="1.5" fill="#7295F6"/>
            <circle cx="12.5" cy="25" r="1.5" fill="#7295F6"/>
            <circle cx="17.5" cy="25" r="1.5" fill="#7295F6"/>
        </svg>
    );
}

function SnowIcon() {
    return (
        <svg viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6.94205 10.7344C6.81702 10.3029 6.75 9.84679 6.75 9.375C6.75 6.68261 8.93261 4.5 11.625 4.5C13.8434 4.5 15.7157 5.98176 16.3062 8.00955C16.8502 7.24711 17.742 6.75 18.75 6.75C20.4069 6.75 21.75 8.09315 21.75 9.75C21.75 10.009 21.7172 10.2603 21.6555 10.5H21.75C23.8211 10.5 25.5 12.1789 25.5 14.25C25.5 16.3211 23.8211 18 21.75 18H8.25C6.17893 18 4.5 16.3211 4.5 14.25C4.5 12.639 5.51591 11.2652 6.94205 10.7344Z" fill="#DDDDDD"/>
            <circle cx="10" cy="21" r="1.5" fill="#7295F6"/>
            <circle cx="15" cy="23" r="1.5" fill="#7295F6"/>
            <circle cx="20" cy="21" r="1.5" fill="#7295F6"/>
        </svg>
    );
}

function StormIcon() {
    return (
        <svg viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6.94205 10.7344C6.81702 10.3029 6.75 9.84679 6.75 9.375C6.75 6.68261 8.93261 4.5 11.625 4.5C13.8434 4.5 15.7157 5.98176 16.3062 8.00955C16.8502 7.24711 17.742 6.75 18.75 6.75C20.4069 6.75 21.75 8.09315 21.75 9.75C21.75 10.009 21.7172 10.2603 21.6555 10.5H21.75C23.8211 10.5 25.5 12.1789 25.5 14.25C25.5 16.3211 23.8211 18 21.75 18H8.25C6.17893 18 4.5 16.3211 4.5 14.25C4.5 12.639 5.51591 11.2652 6.94205 10.7344Z" fill="#DDDDDD"/>
            <path d="M17.7262 12.121C17.9112 11.8806 18.3084 12.0248 18.2814 12.3226L17.8682 16.8875C17.8525 17.0605 17.9946 17.2093 18.1754 17.2093L20.6911 17.2093C20.9442 17.2093 21.0895 17.486 20.9391 17.6815L16.4251 23.5467C16.2401 23.7871 15.843 23.6428 15.8699 23.345L16.2833 18.7801C16.2989 18.6071 16.1569 18.4583 15.976 18.4583H13.4604C13.2073 18.4583 13.062 18.1816 13.2124 17.9861L17.7262 12.121Z" fill="#7295F6"/>
            <path d="M11.1505 16.7718C11.243 16.6516 11.4416 16.7237 11.4281 16.8726L11.1619 19.8132C11.1541 19.8997 11.2251 19.9741 11.3155 19.9741L12.9576 19.9741C13.0842 19.9741 13.1568 20.1125 13.0816 20.2102L10.2115 23.9395C10.119 24.0597 9.92039 23.9876 9.93387 23.8387L10.2001 20.8981C10.2079 20.8116 10.1369 20.7372 10.0465 20.7372H8.40446C8.2779 20.7372 8.20525 20.5988 8.28047 20.5011L11.1505 16.7718Z" fill="#7295F6"/>
        </svg>
    );
}

function FahrenheitIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M14.5 2.9873C14.845 2.98744 15.1249 3.26732 15.125 3.6123C15.125 3.9574 14.8451 4.23717 14.5 4.2373H9.61035C9.40333 4.2373 9.23548 4.40531 9.23535 4.6123V7.98535H13C13.3452 7.98535 13.625 8.26517 13.625 8.61035C13.6249 8.95542 13.3451 9.23535 13 9.23535H9.23535V14C9.23522 14.345 8.95534 14.6249 8.61035 14.625C8.26525 14.625 7.98548 14.3451 7.98535 14V4.6123C7.98548 3.71495 8.71297 2.9873 9.61035 2.9873H14.5Z"
                fill="currentColor"
            />
            <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M3.5 1C4.88071 1 6 2.11929 6 3.5C6 4.88071 4.88071 6 3.5 6C2.11929 6 1 4.88071 1 3.5C1 2.11929 2.11929 1 3.5 1ZM3.5 2C2.67157 2 2 2.67157 2 3.5C2 4.32843 2.67157 5 3.5 5C4.32843 5 5 4.32843 5 3.5C5 2.67157 4.32843 2 3.5 2Z"
                fill="currentColor"
            />
        </svg>
    );
}

function CelsiusIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M9.54492 3.44531C10.4374 2.99173 11.4302 2.86936 12.3896 3.10352C13.3464 3.33704 14.204 3.90864 14.8643 4.71875C15.0823 4.9863 15.0419 5.37958 14.7744 5.59766C14.5068 5.81558 14.1135 5.77534 13.8955 5.50781C13.3877 4.88486 12.757 4.48038 12.0938 4.31836C11.4329 4.15707 10.7452 4.23744 10.1113 4.55957C9.47436 4.88335 8.90899 5.44301 8.50293 6.18848C8.09678 6.93433 7.87503 7.82209 7.875 8.7373C7.875 9.65252 8.09681 10.5403 8.50293 11.2861C8.90898 12.0316 9.47435 12.5912 10.1113 12.915C10.7452 13.2372 11.4329 13.3176 12.0938 13.1562C12.757 12.9942 13.3877 12.5898 13.8955 11.9668C14.1135 11.6994 14.5069 11.6591 14.7744 11.877C15.042 12.095 15.0822 12.4883 14.8643 12.7559C14.204 13.566 13.3464 14.1376 12.3896 14.3711C11.4302 14.6053 10.4374 14.4829 9.54492 14.0293C8.65595 13.5774 7.91698 12.8234 7.40527 11.8838C6.89362 10.9441 6.625 9.84923 6.625 8.7373C6.62503 7.62538 6.8936 6.53047 7.40527 5.59082C7.917 4.65129 8.65596 3.89719 9.54492 3.44531Z"
                fill="currentColor"
            />
            <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M3.5 1C4.88071 1 6 2.11929 6 3.5C6 4.88071 4.88071 6 3.5 6C2.11929 6 1 4.88071 1 3.5C1 2.11929 2.11929 1 3.5 1ZM3.5 2C2.67157 2 2 2.67157 2 3.5C2 4.32843 2.67157 5 3.5 5C4.32843 5 5 4.32843 5 3.5C5 2.67157 4.32843 2 3.5 2Z"
                fill="currentColor"
            />
        </svg>
    );
}
