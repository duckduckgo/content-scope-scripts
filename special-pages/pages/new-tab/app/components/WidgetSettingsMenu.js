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
            stock: { symbols: null },
        }[widgetType];
        onUpdateConfig(clearValue);
    };

    /**
     * @param {'collapsed' | 'expanded'} expansion
     */
    const handleSetExpansion = (expansion) => {
        onUpdateConfig({ expansion });
    };

    /**
     * @param {'celsius' | 'fahrenheit'} unit
     */
    const handleSetTemperatureUnit = (unit) => {
        onUpdateConfig({ temperatureUnit: unit });
    };

    const expansion = config && 'expansion' in config ? config.expansion : 'expanded';
    const isSmall = expansion === 'collapsed';
    const isWide = expansion === 'expanded';
    const temperatureUnit = /** @type {'celsius' | 'fahrenheit' | undefined} */ (
        config && 'temperatureUnit' in config ? config.temperatureUnit : undefined
    );

    const trigger = (
        <button className={styles.menuButton} aria-haspopup="true" aria-label="Widget settings" type="button">
            &#x22EF;
        </button>
    );

    // News widget doesn't support expand/collapse or temperature
    const showExpansionToggle = widgetType !== 'news';
    const showTemperatureToggle = widgetType === 'weather';

    // Get widget-specific config icon and label
    const configIcon = {
        weather: <LocationIcon />,
        news: <NewsTopicIcon />,
        stock: <EditSymbolsIcon />,
    }[widgetType];

    const configLabel = {
        weather: 'Change Location',
        news: 'Change News Topic',
        stock: 'Edit Symbols',
    }[widgetType];

    return (
        <Dropdown trigger={trigger} className={styles.container}>
            <DropdownItem onClick={handleSetConfig} icon={configIcon}>
                {configLabel}
            </DropdownItem>

            {showTemperatureToggle && (
                <>
                    <DropdownSeparator />

                    <DropdownItem
                        onClick={() => handleSetTemperatureUnit('fahrenheit')}
                        checked={temperatureUnit === 'fahrenheit'}
                        role="menuitemradio"
                        icon={<FahrenheitIcon />}
                    >
                        Fahrenheit
                    </DropdownItem>
                    <DropdownItem
                        onClick={() => handleSetTemperatureUnit('celsius')}
                        checked={temperatureUnit === 'celsius'}
                        role="menuitemradio"
                        icon={<CelsiusIcon />}
                    >
                        Celsius
                    </DropdownItem>
                </>
            )}

            {showExpansionToggle && (
                <>
                    <DropdownSeparator />

                    <DropdownItem
                        onClick={() => handleSetExpansion('collapsed')}
                        checked={isSmall}
                        role="menuitemradio"
                        icon={<SmallIcon />}
                    >
                        Small
                    </DropdownItem>
                    <DropdownItem onClick={() => handleSetExpansion('expanded')} checked={isWide} role="menuitemradio" icon={<WideIcon />}>
                        Wide
                    </DropdownItem>
                </>
            )}
        </Dropdown>
    );
}

// === MENU ICONS ===

function LocationIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <g clipPath="url(#clip-location)">
                <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M14.6495 1.86167C14.8343 1.53148 14.4693 1.16644 14.1391 1.35128L1.31886 8.52787C1.27871 8.55034 1.26831 8.5709 1.26366 8.58295C1.25682 8.60069 1.25339 8.62864 1.26196 8.66147C1.27052 8.69429 1.28716 8.71701 1.30179 8.72914C1.31174 8.73739 1.33086 8.75024 1.37686 8.75024H4.92559C6.20965 8.75024 7.25059 9.79118 7.25059 11.0752V14.624C7.25059 14.67 7.26344 14.6891 7.27169 14.699C7.28382 14.7137 7.30654 14.7303 7.33936 14.7389C7.37219 14.7474 7.40014 14.744 7.41787 14.7372C7.42993 14.7325 7.45048 14.7221 7.47296 14.682L14.6495 1.86167ZM13.5285 0.26055C14.9594 -0.540427 16.5412 1.04136 15.7402 2.47224L8.56369 15.2925C7.87496 16.5229 6.00059 16.034 6.00059 14.624V11.0752C6.00059 10.4815 5.51929 10.0002 4.92559 10.0002H1.37686C-0.0331622 10.0002 -0.522076 8.12588 0.708282 7.43714L13.5285 0.26055Z"
                    fill="currentColor"
                />
            </g>
            <defs>
                <clipPath id="clip-location">
                    <rect width="16" height="16" fill="white" />
                </clipPath>
            </defs>
        </svg>
    );
}

function FahrenheitIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
                d="M14.5 2.9873C14.845 2.98744 15.1249 3.26732 15.125 3.6123C15.125 3.9574 14.8451 4.23717 14.5 4.2373H9.61035C9.40333 4.2373 9.23548 4.40531 9.23535 4.6123V7.98535H13C13.3452 7.98535 13.625 8.26517 13.625 8.61035C13.6249 8.95542 13.3451 9.23535 13 9.23535H9.23535V14C9.23522 14.345 8.95534 14.6249 8.61035 14.625C8.26525 14.625 7.98548 14.3451 7.98535 14V4.6123C7.98548 3.71495 8.71297 2.9873 9.61035 2.9873H14.5Z"
                fill="currentColor"
            />
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M3.5 1C4.88071 1 6 2.11929 6 3.5C6 4.88071 4.88071 6 3.5 6C2.11929 6 1 4.88071 1 3.5C1 2.11929 2.11929 1 3.5 1ZM3.5 2C2.67157 2 2 2.67157 2 3.5C2 4.32843 2.67157 5 3.5 5C4.32843 5 5 4.32843 5 3.5C5 2.67157 4.32843 2 3.5 2Z"
                fill="currentColor"
            />
        </svg>
    );
}

function CelsiusIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
                d="M9.54492 3.44531C10.4374 2.99173 11.4302 2.86936 12.3896 3.10352C13.3464 3.33704 14.204 3.90864 14.8643 4.71875C15.0823 4.9863 15.0419 5.37958 14.7744 5.59766C14.5068 5.81558 14.1135 5.77534 13.8955 5.50781C13.3877 4.88486 12.757 4.48038 12.0938 4.31836C11.4329 4.15707 10.7452 4.23744 10.1113 4.55957C9.47436 4.88335 8.90899 5.44301 8.50293 6.18848C8.09678 6.93433 7.87503 7.82209 7.875 8.7373C7.875 9.65252 8.09681 10.5403 8.50293 11.2861C8.90898 12.0316 9.47435 12.5912 10.1113 12.915C10.7452 13.2372 11.4329 13.3176 12.0938 13.1562C12.757 12.9942 13.3877 12.5898 13.8955 11.9668C14.1135 11.6994 14.5069 11.6591 14.7744 11.877C15.042 12.095 15.0822 12.4883 14.8643 12.7559C14.204 13.566 13.3464 14.1376 12.3896 14.3711C11.4302 14.6053 10.4374 14.4829 9.54492 14.0293C8.65595 13.5774 7.91698 12.8234 7.40527 11.8838C6.89362 10.9441 6.625 9.84923 6.625 8.7373C6.62503 7.62538 6.8936 6.53047 7.40527 5.59082C7.917 4.65129 8.65596 3.89719 9.54492 3.44531Z"
                fill="currentColor"
            />
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M3.5 1C4.88071 1 6 2.11929 6 3.5C6 4.88071 4.88071 6 3.5 6C2.11929 6 1 4.88071 1 3.5C1 2.11929 2.11929 1 3.5 1ZM3.5 2C2.67157 2 2 2.67157 2 3.5C2 4.32843 2.67157 5 3.5 5C4.32843 5 5 4.32843 5 3.5C5 2.67157 4.32843 2 3.5 2Z"
                fill="currentColor"
            />
        </svg>
    );
}

function SmallIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
                d="M6.75 4C7.44036 4 8 4.55964 8 5.25V7.75C8 8.44036 7.44036 9 6.75 9H4.25C3.55964 9 3 8.44036 3 7.75V5.25C3 4.55964 3.55964 4 4.25 4H6.75Z"
                fill="currentColor"
            />
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 1C14.2091 1 16 2.79086 16 5V11C16 13.2091 14.2091 15 12 15H4C1.79086 15 0 13.2091 0 11V5C1.28853e-07 2.79086 1.79086 1 4 1H12ZM4 2.25C2.48122 2.25 1.25 3.48122 1.25 5V11C1.25 12.5188 2.48122 13.75 4 13.75H12C13.5188 13.75 14.75 12.5188 14.75 11V5C14.75 3.48122 13.5188 2.25 12 2.25H4Z"
                fill="currentColor"
            />
        </svg>
    );
}

function WideIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
                d="M11.75 4C12.4404 4 13 4.55964 13 5.25V7.75C13 8.44036 12.4404 9 11.75 9H4.25C3.55964 9 3 8.44036 3 7.75V5.25C3 4.55964 3.55964 4 4.25 4H11.75Z"
                fill="currentColor"
            />
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 1C14.2091 1 16 2.79086 16 5V11C16 13.2091 14.2091 15 12 15H4C1.79086 15 0 13.2091 0 11V5C1.28853e-07 2.79086 1.79086 1 4 1H12ZM4 2.25C2.48122 2.25 1.25 3.48122 1.25 5V11C1.25 12.5188 2.48122 13.75 4 13.75H12C13.5188 13.75 14.75 12.5188 14.75 11V5C14.75 3.48122 13.5188 2.25 12 2.25H4Z"
                fill="currentColor"
            />
        </svg>
    );
}

function EditSymbolsIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
                d="M13.875 1C15.0486 1 16 1.95139 16 3.125V5.375C16 5.72018 15.7202 6 15.375 6C15.0298 6 14.75 5.72018 14.75 5.375V3.13477L10.9424 6.94238C10.729 7.15557 10.3987 7.18219 10.1562 7.02246L10.0576 6.94238L8.75 5.63477L5.19238 9.19238C5.0752 9.30944 4.91564 9.375 4.75 9.375C4.58436 9.375 4.4248 9.30944 4.30762 9.19238L3 7.88477L1.25 9.63477V11C1.25026 12.5186 2.48138 13.75 4 13.75H12C13.5186 13.75 14.7497 12.5186 14.75 11V9.375C14.75 9.02982 15.0298 8.75 15.375 8.75C15.7202 8.75 16 9.02982 16 9.375V11C15.9997 13.2089 14.209 15 12 15H4C1.79102 15 0.000263864 13.2089 0 11V9.375C0 9.20254 0.0696586 9.0457 0.182617 8.93262L2.55762 6.55762L2.65332 6.48047C2.75528 6.41243 2.87561 6.375 3 6.375C3.16576 6.375 3.32517 6.44041 3.44238 6.55762L4.75 7.86523L8.30762 4.30762L8.40332 4.23047C8.50528 4.16243 8.62561 4.125 8.75 4.125C8.91576 4.125 9.07517 4.19041 9.19238 4.30762L10.5 5.61523L13.8652 2.25H11.375C11.0298 2.25 10.75 1.97018 10.75 1.625C10.75 1.27982 11.0298 1 11.375 1H13.875Z"
                fill="currentColor"
            />
        </svg>
    );
}

function NewsTopicIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
                d="M8.375 10.75C8.72018 10.75 9 11.0298 9 11.375C9 11.7202 8.72018 12 8.375 12H3.625C3.27982 12 3 11.7202 3 11.375C3 11.0298 3.27982 10.75 3.625 10.75H8.375Z"
                fill="currentColor"
            />
            <path
                d="M8.375 7.75C8.72018 7.75 9 8.02982 9 8.375C9 8.72018 8.72018 9 8.375 9H3.625C3.27982 9 3 8.72018 3 8.375C3 8.02982 3.27982 7.75 3.625 7.75H8.375Z"
                fill="currentColor"
            />
            <path
                d="M5.25 4C5.66421 4 6 4.33579 6 4.75V5.25C6 5.66421 5.66421 6 5.25 6H3.75C3.33579 6 3 5.66421 3 5.25V4.75C3 4.33579 3.33579 4 3.75 4H5.25Z"
                fill="currentColor"
            />
            <path
                d="M8.25 4C8.66421 4 9 4.33579 9 4.75V5.25C9 5.66421 8.66421 6 8.25 6H7.75C7.33579 6 7 5.66421 7 5.25V4.75C7 4.33579 7.33579 4 7.75 4H8.25Z"
                fill="currentColor"
            />
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M10.125 1C11.1605 1 12 1.83947 12 2.875V3H14.125C15.1605 3 16 3.83947 16 4.875V12.25C16 13.7688 14.7688 15 13.25 15H4C1.79086 15 9.66391e-08 13.2091 0 11V2.875C1.10739e-08 1.83947 0.839466 1 1.875 1H10.125ZM1.875 2.25C1.52982 2.25 1.25 2.52982 1.25 2.875V11C1.25 12.5188 2.48122 13.75 4 13.75H11.085C10.8722 13.3823 10.75 12.9554 10.75 12.5V2.875C10.75 2.52982 10.4702 2.25 10.125 2.25H1.875ZM12 12.5C12 13.1904 12.5596 13.75 13.25 13.75C14.0784 13.75 14.75 13.0784 14.75 12.25V4.875C14.75 4.52982 14.4702 4.25 14.125 4.25H12V12.5Z"
                fill="currentColor"
            />
        </svg>
    );
}
