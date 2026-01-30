import { h } from 'preact';
import { createPortal } from 'preact/compat';
import { useContext, useState, useRef, useEffect } from 'preact/hooks';
import styles from './Weather.module.css';
import { WidgetConfigContext } from '../../widget-list/widget-config.provider.js';

/**
 * @typedef {Object} CityData
 * @property {string} city
 * @property {string} region
 * @property {string} country
 */

/** @type {CityData[]} */
const POPULAR_CITIES = [
    // United States
    { city: 'New York', region: 'NY', country: 'United States' },
    { city: 'Los Angeles', region: 'CA', country: 'United States' },
    { city: 'Chicago', region: 'IL', country: 'United States' },
    { city: 'Houston', region: 'TX', country: 'United States' },
    { city: 'Phoenix', region: 'AZ', country: 'United States' },
    { city: 'Philadelphia', region: 'PA', country: 'United States' },
    { city: 'San Antonio', region: 'TX', country: 'United States' },
    { city: 'San Diego', region: 'CA', country: 'United States' },
    { city: 'Dallas', region: 'TX', country: 'United States' },
    { city: 'San Jose', region: 'CA', country: 'United States' },
    { city: 'Austin', region: 'TX', country: 'United States' },
    { city: 'Jacksonville', region: 'FL', country: 'United States' },
    { city: 'San Francisco', region: 'CA', country: 'United States' },
    { city: 'Seattle', region: 'WA', country: 'United States' },
    { city: 'Denver', region: 'CO', country: 'United States' },
    { city: 'Boston', region: 'MA', country: 'United States' },
    { city: 'Nashville', region: 'TN', country: 'United States' },
    { city: 'Portland', region: 'OR', country: 'United States' },
    { city: 'Miami', region: 'FL', country: 'United States' },
    { city: 'Atlanta', region: 'GA', country: 'United States' },
    { city: 'Las Vegas', region: 'NV', country: 'United States' },
    { city: 'Minneapolis', region: 'MN', country: 'United States' },
    { city: 'Detroit', region: 'MI', country: 'United States' },
    { city: 'Baltimore', region: 'MD', country: 'United States' },
    { city: 'Charlotte', region: 'NC', country: 'United States' },
    { city: 'Orlando', region: 'FL', country: 'United States' },
    { city: 'Tampa', region: 'FL', country: 'United States' },
    { city: 'Pittsburgh', region: 'PA', country: 'United States' },
    { city: 'Cleveland', region: 'OH', country: 'United States' },
    { city: 'Cincinnati', region: 'OH', country: 'United States' },
    { city: 'Indianapolis', region: 'IN', country: 'United States' },
    { city: 'Kansas City', region: 'MO', country: 'United States' },
    { city: 'St. Louis', region: 'MO', country: 'United States' },
    { city: 'New Orleans', region: 'LA', country: 'United States' },
    { city: 'Salt Lake City', region: 'UT', country: 'United States' },
    { city: 'Honolulu', region: 'HI', country: 'United States' },
    { city: 'Anchorage', region: 'AK', country: 'United States' },
    // Canada
    { city: 'Toronto', region: 'ON', country: 'Canada' },
    { city: 'Vancouver', region: 'BC', country: 'Canada' },
    { city: 'Montreal', region: 'QC', country: 'Canada' },
    { city: 'Calgary', region: 'AB', country: 'Canada' },
    { city: 'Ottawa', region: 'ON', country: 'Canada' },
    { city: 'Edmonton', region: 'AB', country: 'Canada' },
    { city: 'Winnipeg', region: 'MB', country: 'Canada' },
    { city: 'Quebec City', region: 'QC', country: 'Canada' },
    // United Kingdom
    { city: 'London', region: '', country: 'United Kingdom' },
    { city: 'Manchester', region: '', country: 'United Kingdom' },
    { city: 'Birmingham', region: '', country: 'United Kingdom' },
    { city: 'Edinburgh', region: '', country: 'United Kingdom' },
    { city: 'Glasgow', region: '', country: 'United Kingdom' },
    { city: 'Liverpool', region: '', country: 'United Kingdom' },
    { city: 'Bristol', region: '', country: 'United Kingdom' },
    // Europe
    { city: 'Paris', region: '', country: 'France' },
    { city: 'Lyon', region: '', country: 'France' },
    { city: 'Marseille', region: '', country: 'France' },
    { city: 'Berlin', region: '', country: 'Germany' },
    { city: 'Munich', region: '', country: 'Germany' },
    { city: 'Frankfurt', region: '', country: 'Germany' },
    { city: 'Hamburg', region: '', country: 'Germany' },
    { city: 'Madrid', region: '', country: 'Spain' },
    { city: 'Barcelona', region: '', country: 'Spain' },
    { city: 'Rome', region: '', country: 'Italy' },
    { city: 'Milan', region: '', country: 'Italy' },
    { city: 'Naples', region: '', country: 'Italy' },
    { city: 'Amsterdam', region: '', country: 'Netherlands' },
    { city: 'Brussels', region: '', country: 'Belgium' },
    { city: 'Vienna', region: '', country: 'Austria' },
    { city: 'Zurich', region: '', country: 'Switzerland' },
    { city: 'Geneva', region: '', country: 'Switzerland' },
    { city: 'Dublin', region: '', country: 'Ireland' },
    { city: 'Lisbon', region: '', country: 'Portugal' },
    { city: 'Stockholm', region: '', country: 'Sweden' },
    { city: 'Copenhagen', region: '', country: 'Denmark' },
    { city: 'Oslo', region: '', country: 'Norway' },
    { city: 'Helsinki', region: '', country: 'Finland' },
    { city: 'Warsaw', region: '', country: 'Poland' },
    { city: 'Prague', region: '', country: 'Czech Republic' },
    { city: 'Budapest', region: '', country: 'Hungary' },
    { city: 'Athens', region: '', country: 'Greece' },
    { city: 'Moscow', region: '', country: 'Russia' },
    { city: 'St. Petersburg', region: '', country: 'Russia' },
    // Asia
    { city: 'Tokyo', region: '', country: 'Japan' },
    { city: 'Osaka', region: '', country: 'Japan' },
    { city: 'Kyoto', region: '', country: 'Japan' },
    { city: 'Seoul', region: '', country: 'South Korea' },
    { city: 'Beijing', region: '', country: 'China' },
    { city: 'Shanghai', region: '', country: 'China' },
    { city: 'Hong Kong', region: '', country: 'China' },
    { city: 'Shenzhen', region: '', country: 'China' },
    { city: 'Taipei', region: '', country: 'Taiwan' },
    { city: 'Singapore', region: '', country: 'Singapore' },
    { city: 'Bangkok', region: '', country: 'Thailand' },
    { city: 'Kuala Lumpur', region: '', country: 'Malaysia' },
    { city: 'Jakarta', region: '', country: 'Indonesia' },
    { city: 'Manila', region: '', country: 'Philippines' },
    { city: 'Ho Chi Minh City', region: '', country: 'Vietnam' },
    { city: 'Hanoi', region: '', country: 'Vietnam' },
    { city: 'Mumbai', region: 'MH', country: 'India' },
    { city: 'Delhi', region: 'DL', country: 'India' },
    { city: 'Bangalore', region: 'KA', country: 'India' },
    { city: 'Chennai', region: 'TN', country: 'India' },
    { city: 'Kolkata', region: 'WB', country: 'India' },
    // Middle East
    { city: 'Dubai', region: '', country: 'United Arab Emirates' },
    { city: 'Abu Dhabi', region: '', country: 'United Arab Emirates' },
    { city: 'Tel Aviv', region: '', country: 'Israel' },
    { city: 'Jerusalem', region: '', country: 'Israel' },
    { city: 'Istanbul', region: '', country: 'Turkey' },
    { city: 'Riyadh', region: '', country: 'Saudi Arabia' },
    { city: 'Doha', region: '', country: 'Qatar' },
    // Oceania
    { city: 'Sydney', region: 'NSW', country: 'Australia' },
    { city: 'Melbourne', region: 'VIC', country: 'Australia' },
    { city: 'Brisbane', region: 'QLD', country: 'Australia' },
    { city: 'Perth', region: 'WA', country: 'Australia' },
    { city: 'Auckland', region: '', country: 'New Zealand' },
    { city: 'Wellington', region: '', country: 'New Zealand' },
    // South America
    { city: 'São Paulo', region: 'SP', country: 'Brazil' },
    { city: 'Rio de Janeiro', region: 'RJ', country: 'Brazil' },
    { city: 'Buenos Aires', region: '', country: 'Argentina' },
    { city: 'Santiago', region: '', country: 'Chile' },
    { city: 'Lima', region: '', country: 'Peru' },
    { city: 'Bogotá', region: '', country: 'Colombia' },
    { city: 'Medellín', region: '', country: 'Colombia' },
    // Central America & Caribbean
    { city: 'Mexico City', region: '', country: 'Mexico' },
    { city: 'Guadalajara', region: '', country: 'Mexico' },
    { city: 'Cancún', region: '', country: 'Mexico' },
    { city: 'Havana', region: '', country: 'Cuba' },
    { city: 'San Juan', region: 'PR', country: 'Puerto Rico' },
    // Africa
    { city: 'Cairo', region: '', country: 'Egypt' },
    { city: 'Cape Town', region: '', country: 'South Africa' },
    { city: 'Johannesburg', region: '', country: 'South Africa' },
    { city: 'Lagos', region: '', country: 'Nigeria' },
    { city: 'Nairobi', region: '', country: 'Kenya' },
    { city: 'Casablanca', region: '', country: 'Morocco' },
];

/**
 * @param {CityData} city
 * @returns {string}
 */
function formatCityDisplay(city) {
    if (city.region) {
        return `${city.city}, ${city.region}`;
    }
    return city.city;
}

/**
 * @param {CityData} city
 * @returns {string}
 */
function formatCityCountry(city) {
    return city.country;
}

/**
 * Search icon for the input
 */
function SearchIcon() {
    return (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M5.25 9.5C7.59721 9.5 9.5 7.59721 9.5 5.25C9.5 2.90279 7.59721 1 5.25 1C2.90279 1 1 2.90279 1 5.25C1 7.59721 2.90279 9.5 5.25 9.5Z"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
            />
            <path d="M11 11L8.25 8.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
    );
}

/**
 * Close icon for the button
 */
function CloseIcon() {
    return (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
    );
}

/**
 * Empty state component for weather widget when no location is configured
 * @param {object} props
 * @param {string} [props.instanceId]
 */
export function WeatherEmptyState({ instanceId }) {
    const [searchValue, setSearchValue] = useState('');
    const [selectedCity, setSelectedCity] = useState(/** @type {CityData | null} */ (null));
    const [panelPosition, setPanelPosition] = useState(/** @type {{top: number, left: number, width: number} | null} */ (null));
    const inputRef = useRef(/** @type {HTMLInputElement | null} */ (null));
    const anchorRef = useRef(/** @type {HTMLDivElement | null} */ (null));
    const { updateInstanceConfig, removeInstance, getConfigForInstance } = useContext(WidgetConfigContext);

    // Get expansion state from config (default to 'expanded')
    const config = instanceId ? getConfigForInstance(instanceId) : null;
    const expansion = config && 'expansion' in config ? config.expansion : 'expanded';

    // Calculate panel position based on anchor element
    useEffect(() => {
        const updatePosition = () => {
            if (anchorRef.current) {
                const rect = anchorRef.current.getBoundingClientRect();
                setPanelPosition({
                    top: rect.top + window.scrollY - 11, // 11px above
                    left: rect.left + window.scrollX - 10, // 10px to the left
                    width: rect.width + 20, // 20px wider (10px each side)
                });
            }
        };

        updatePosition();
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);

        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, []);

    // Focus input once panel is positioned
    useEffect(() => {
        if (panelPosition) {
            inputRef.current?.focus();
        }
    }, [panelPosition]);

    const handleSelectCity = (/** @type {CityData} */ city) => {
        setSelectedCity(city);
        if (instanceId) {
            updateInstanceConfig(instanceId, { location: formatCityDisplay(city) });
        }
    };

    const handleClose = () => {
        if (instanceId) {
            removeInstance(instanceId);
        }
    };

    // Filter cities based on search value
    const filteredCities = searchValue.trim()
        ? POPULAR_CITIES.filter((city) => {
              const search = searchValue.toLowerCase();
              return (
                  city.city.toLowerCase().includes(search) ||
                  city.region.toLowerCase().includes(search) ||
                  city.country.toLowerCase().includes(search)
              );
          }).slice(0, 5)
        : POPULAR_CITIES.slice(0, 5);

    const sectionLabel = searchValue.trim() ? 'Suggestions' : 'Popular Locations';

    return (
        <div className={styles.emptyStateAnchor} ref={anchorRef} data-expansion={expansion === 'collapsed' ? 'collapsed' : 'expanded'}>
            {createPortal(
                <div className={styles.emptyStateOverlay}>
                    <div className={styles.emptyStateBackdrop} />
                    {panelPosition && (
                        <div
                            className={styles.emptyStatePanel}
                            data-testid="weather-widget-empty"
                            style={{
                                top: `${panelPosition.top}px`,
                                left: `${panelPosition.left}px`,
                                width: `${panelPosition.width}px`,
                            }}
                        >
                <div className={styles.emptyStateHeader}>
                    <div className={styles.emptyStateSearchContainer}>
                        <div className={styles.emptyStateSearchIcon}>
                            <SearchIcon />
                        </div>
                        <input
                            ref={inputRef}
                            type="text"
                            className={styles.emptyStateSearchInput}
                            placeholder="Search for Location"
                            value={searchValue}
                            onInput={(e) => setSearchValue(/** @type {HTMLInputElement} */ (e.target).value)}
                        />
                    </div>
                    <button type="button" className={styles.emptyStateCloseButton} onClick={handleClose} aria-label="Close">
                        <CloseIcon />
                    </button>
                </div>
                <div className={styles.emptyStateList}>
                    <div className={styles.emptyStateSectionLabel}>{sectionLabel}</div>
                    {filteredCities.map((city) => (
                        <button
                            key={`${city.city}-${city.region}-${city.country}`}
                            type="button"
                            className={styles.emptyStateLocationItem}
                            onClick={() => handleSelectCity(city)}
                            data-selected={selectedCity === city}
                        >
                            <div className={styles.emptyStateLocationInfo}>
                                <div className={styles.emptyStateLocationCity}>{formatCityDisplay(city)}</div>
                                <div className={styles.emptyStateLocationCountry}>{formatCityCountry(city)}</div>
                            </div>
                        </button>
                    ))}
                    {filteredCities.length === 0 && <div className={styles.emptyStateNoResults}>No matching locations found</div>}
                </div>
                        </div>
                    )}
                </div>,
                document.body,
            )}
        </div>
    );
}
