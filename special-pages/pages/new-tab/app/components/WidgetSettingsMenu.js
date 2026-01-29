import { Fragment, h } from 'preact';
import { Dropdown, DropdownItem, DropdownSeparator } from './Dropdown.js';
import styles from './WidgetSettingsMenu.module.css';

/**
 * @typedef {import('../../types/new-tab.js').WidgetConfigs[number]} WidgetConfigItem
 */

/**
 * @typedef {'weather' | 'news' | 'stock'} WidgetType
 */

/**
 * Meatballs menu (⋯) for widget settings
 *
 * @param {Object} props
 * @param {WidgetType} props.widgetType
 * @param {WidgetConfigItem | null} props.config
 * @param {(updates: Partial<WidgetConfigItem>) => void} props.onUpdateConfig
 */
export function WidgetSettingsMenu({ widgetType, config, onUpdateConfig }) {
    const handleSetConfig = () => {
        // Clear the config value to trigger empty state
        const clearValue = {
            weather: { location: null },
            news: { query: null },
            stock: { symbol: null },
        }[widgetType];
        onUpdateConfig(clearValue);
    };

    const handleToggleExpanded = () => {
        const currentExpansion = config && 'expansion' in config ? config.expansion : 'expanded';
        const newExpansion = currentExpansion === 'expanded' ? 'collapsed' : 'expanded';
        onUpdateConfig({ expansion: newExpansion });
    };

    /**
     * @param {'celsius' | 'fahrenheit'} unit
     */
    const handleSetTemperatureUnit = (unit) => {
        onUpdateConfig({ temperatureUnit: unit });
    };

    const isExpanded = config && 'expansion' in config ? config.expansion === 'expanded' : true;
    const temperatureUnit = /** @type {'celsius' | 'fahrenheit' | undefined} */ (
        config && 'temperatureUnit' in config ? config.temperatureUnit : undefined
    );

    const setConfigLabel = {
        weather: 'Set location',
        news: 'Set query',
        stock: 'Set symbol',
    }[widgetType];

    const trigger = (
        <button className={styles.menuButton} aria-haspopup="true" aria-label="Widget settings" type="button">
            &#x22EF;
        </button>
    );

    return (
        <Dropdown trigger={trigger} className={styles.container}>
            <DropdownItem onClick={handleSetConfig}>{setConfigLabel}</DropdownItem>

            <DropdownSeparator />

            <DropdownItem onClick={handleToggleExpanded} checked={isExpanded} role="menuitemcheckbox">
                Expanded
            </DropdownItem>

            {widgetType === 'weather' && (
                <>
                    <DropdownSeparator />

                    <DropdownItem
                        onClick={() => handleSetTemperatureUnit('celsius')}
                        checked={temperatureUnit === 'celsius'}
                        role="menuitemradio"
                    >
                        Celsius (&deg;C)
                    </DropdownItem>
                    <DropdownItem
                        onClick={() => handleSetTemperatureUnit('fahrenheit')}
                        checked={temperatureUnit === 'fahrenheit'}
                        role="menuitemradio"
                    >
                        Fahrenheit (&deg;F)
                    </DropdownItem>
                </>
            )}
        </Dropdown>
    );
}
