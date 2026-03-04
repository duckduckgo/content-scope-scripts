import { h } from 'preact';
import styles from './AddressBarPreview.module.css';

const ICON_TRANSITION = { transition: 'opacity 250ms ease-in-out' };

/**
 * @param {object} props
 * @param {boolean} props.isReduced - Whether the address bar is in reduced (search-only) mode
 * @param {boolean} [props.isDarkMode=false] - Whether to render dark mode colors
 */
export function AddressBarPreview({ isReduced, isDarkMode = false }) {
    // Theme-dependent colors
    const colors = isDarkMode
        ? {
              // Dark mode
              outerBg: '#123269',
              browserChrome: '#1C1C1C',
              browserBorder: '#3D3D3D',
              topBar: '#050505',
              tabsArea: '#282828',
              addressBarBg: '#3D3D3D',
              addressBarBorder: '#3377AD',
              addressBarShadow: 'none',
              iconPillOuterBg: 'rgba(67, 151, 224, 0.25)',
              iconPillBg: '#4397E0',
              iconPillIcons: '#000',
              iconPillIconsOpacity: '0.84',
              searchIcon: '#4397E0',
              navArrows: '#fff',
              navArrowsOpacity: '0.24',
              dotOpacity: '0.16',
              tabDetailOpacity: '0.09',
              waveOpacity: '0.12',
          }
        : {
              // Light mode (matches Figma export)
              outerBg: '#4D9DFF',
              browserChrome: '#FAFAFA',
              browserBorder: '#ffffff',
              topBar: '#E0E0E0',
              tabsArea: '#F2F2F2',
              addressBarBg: '#fff',
              addressBarBorder: '#1074CC',
              addressBarShadow: '0 2px 12px rgba(0, 0, 0, 0.12)',
              iconPillOuterBg: '#C9E3FF',
              iconPillBg: '#1074CC',
              iconPillIcons: '#fff',
              iconPillIconsOpacity: '1',
              searchIcon: '#1074CC',
              navArrows: '#000',
              navArrowsOpacity: '0.36',
              dotOpacity: '0.09',
              tabDetailOpacity: '0.09',
              waveOpacity: '0.03',
          };

    return (
        <div className={styles.wrapper}>
            <svg fill="none" viewBox="0 0 432 208" xmlns="http://www.w3.org/2000/svg" className={styles.image}>
                <defs>
                    <clipPath id="clip-main">
                        <rect width="432" height="208" fill="#fff" rx="20" />
                    </clipPath>
                </defs>
                <g clipPath="url(#clip-main)">
                    {/* Outer background */}
                    <rect width="432" height="208" fill={colors.outerBg} rx="20" />

                    {/* Browser chrome */}
                    <path
                        fill={colors.browserChrome}
                        stroke={colors.browserBorder}
                        strokeWidth="2"
                        d="M392 23C401.389 23 409 30.611 409 40V209H23V40C23 30.611 30.611 23 40 23H392Z"
                    />

                    {/* Top bar */}
                    <path fill={colors.topBar} d="M24 40C24 31.163 31.163 24 40 24H392C400.837 24 408 31.163 408 40V83H24V40Z" />

                    {/* Background tab */}
                    <g opacity="0.6">
                        <path
                            fill={colors.tabsArea}
                            d="M237 47C232.582 47 229 43.418 229 39V34C229 29.582 225.418 26 221 26H147C142.582 26 139 29.582 139 34V39C139 43.418 135.418 47 131 47H128V52H312V47H237Z"
                        />
                        <rect
                            x="172"
                            y="34"
                            width="45"
                            height="4"
                            rx="2"
                            fill={colors.navArrows}
                            style={{ fillOpacity: colors.tabDetailOpacity }}
                        />
                        <rect
                            x="160"
                            y="33"
                            width="6"
                            height="6"
                            rx="3"
                            fill={colors.navArrows}
                            style={{ fillOpacity: colors.tabDetailOpacity }}
                        />
                    </g>

                    {/* Active tab */}
                    <path
                        fill={colors.tabsArea}
                        d="M159 47C154.582 47 151 43.418 151 39V34C151 29.582 147.418 26 143 26H79C74.582 26 71 29.582 71 34V39C71 43.418 67.418 47 63 47H60V52H234V47H159Z"
                    />
                    <rect
                        x="91"
                        y="34"
                        width="45"
                        height="4"
                        rx="2"
                        fill={colors.navArrows}
                        style={{ fillOpacity: colors.tabDetailOpacity }}
                    />
                    <rect
                        x="79"
                        y="33"
                        width="6"
                        height="6"
                        rx="3"
                        fill={colors.navArrows}
                        style={{ fillOpacity: colors.tabDetailOpacity }}
                    />

                    {/* Toolbar */}
                    <path fill={colors.tabsArea} d="M24 55C24 50.582 27.582 47 32 47H400C404.418 47 408 50.582 408 55V83H24V55Z" />

                    {/* Navigation arrows */}
                    <path
                        fill={colors.navArrows}
                        style={{ fillOpacity: colors.navArrowsOpacity }}
                        d="M41.859 60.267C42.042 60.084 42.042 59.787 41.859 59.604C41.676 59.421 41.379 59.421 41.196 59.604L37.213 63.591C36.591 64.213 36.591 65.221 37.213 65.844L41.196 69.83C41.379 70.013 41.676 70.013 41.859 69.83C42.042 69.647 42.042 69.351 41.859 69.167L37.881 65.186H47.531C47.79 65.186 48 64.976 48 64.717C48 64.458 47.79 64.248 47.531 64.248H37.881L41.859 60.267ZM384.75 60.969C384.75 60.71 384.96 60.5 385.219 60.5H394.781C395.04 60.5 395.25 60.71 395.25 60.969C395.25 61.228 395.04 61.438 394.781 61.438H385.219C384.96 61.438 384.75 61.228 384.75 60.969ZM384.75 64.719C384.75 64.46 384.96 64.25 385.219 64.25H394.781C395.04 64.25 395.25 64.46 395.25 64.719C395.25 64.978 395.04 65.188 394.781 65.188H385.219C384.96 65.188 384.75 64.978 384.75 64.719ZM385.219 68C384.96 68 384.75 68.21 384.75 68.469C384.75 68.728 384.96 68.938 385.219 68.938H394.781C395.04 68.938 395.25 68.728 395.25 68.469C395.25 68.21 395.04 68 394.781 68H385.219Z"
                    />

                    {/* Window control dots */}
                    <circle cx="36" cy="36" r="3" fill={colors.navArrows} style={{ fillOpacity: colors.dotOpacity }} />
                    <circle cx="46" cy="36" r="3" fill={colors.navArrows} style={{ fillOpacity: colors.dotOpacity }} />
                    <circle cx="56" cy="36" r="3" fill={colors.navArrows} style={{ fillOpacity: colors.dotOpacity }} />

                    {/* Bottom decorative wave */}
                    <path
                        fill={colors.navArrows}
                        style={{ fillOpacity: colors.waveOpacity, mixBlendMode: 'multiply' }}
                        d="M81.31 194.544C41.586 186.057 17.379 187.055 0 189.552V224H432V145.302C374.276 141.807 334.399 169.389 262.523 189.552C192.186 209.283 121.828 203.201 81.31 194.544Z"
                    />
                </g>
            </svg>

            {/* CSS Background overlay - animates smoothly with CSS */}
            <div
                className={`${styles.bgOverlay} ${isReduced ? styles.bgReduced : ''}`}
                style={{ backgroundColor: colors.addressBarBg, boxShadow: colors.addressBarShadow }}
            />
            {/* CSS Border overlay - animates smoothly with CSS */}
            <div
                className={`${styles.borderOverlay} ${isReduced ? styles.borderReduced : ''}`}
                style={{ borderColor: colors.addressBarBorder }}
            />

            {/* Regular search icon - shown when in search-only mode */}
            <svg
                className={styles.regularIcon}
                style={{ opacity: isReduced ? 1 : 0, ...ICON_TRANSITION }}
                viewBox="0 0 12 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    fill={colors.searchIcon}
                    d="M5.25 0a5.25 5.25 0 0 1 4.049 8.592l2.555 2.555.064.078a.502.502 0 0 1-.693.693l-.079-.065-2.554-2.554A5.25 5.25 0 1 1 5.25 0m0 1a4.25 4.25 0 1 0 0 8.5 4.25 4.25 0 0 0 0-8.5"
                />
            </svg>

            {/* Extended icon (AI chat pill) - shown when in search-and-duckai mode */}
            <svg
                className={styles.extendedIcon}
                style={{ opacity: isReduced ? 0 : 1, ...ICON_TRANSITION }}
                viewBox="0 0 56 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* Outer pill background */}
                <rect width="56" height="20" rx="10" fill={colors.iconPillOuterBg} />
                {/* Inner circle (search section) */}
                <path
                    fill={colors.iconPillBg}
                    d="M2 10C2 5.582 5.582 2 10 2H20C24.418 2 28 5.582 28 10C28 14.418 24.418 18 20 18H10C5.582 18 2 14.418 2 10Z"
                />
                {/* Search icon (on inner circle) */}
                <path
                    fill={colors.iconPillIcons}
                    style={{ fillOpacity: colors.iconPillIconsOpacity }}
                    d="M14.25 4C17.149 4 19.5 6.351 19.5 9.25C19.5 10.52 19.049 11.684 18.299 12.592L20.854 15.147L20.918 15.225C21.046 15.419 21.024 15.683 20.854 15.854C20.683 16.024 20.419 16.046 20.225 15.918L20.146 15.854L17.592 13.299C16.684 14.049 15.52 14.5 14.25 14.5C11.351 14.5 9 12.149 9 9.25C9 6.351 11.351 4 14.25 4ZM14.25 5C11.903 5 10 6.903 10 9.25C10 11.597 11.903 13.5 14.25 13.5C16.597 13.5 18.5 11.597 18.5 9.25C18.5 6.903 16.597 5 14.25 5Z"
                />
                {/* Sparkle icon */}
                <path
                    fill={colors.iconPillBg}
                    d="M41.785 6.453C41.711 6.157 41.289 6.157 41.215 6.453L41.05 7.111C40.831 7.989 40.145 8.675 39.267 8.894L38.609 9.059C38.312 9.133 38.312 9.555 38.609 9.629L39.267 9.794C40.145 10.013 40.831 10.698 41.05 11.576L41.215 12.234C41.289 12.531 41.711 12.531 41.785 12.234L41.949 11.576C42.169 10.698 42.854 10.013 43.732 9.794L44.39 9.629C44.687 9.555 44.687 9.133 44.39 9.059L43.732 8.894C42.854 8.675 42.169 7.989 41.949 7.111L41.785 6.453Z"
                />
                {/* Chat bubble icon */}
                <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    fill={colors.iconPillBg}
                    d="M36.861 15.95C38.853 15.607 42.343 14.946 43.761 14.295C45.954 13.5 47.5 11.583 47.5 9.344C47.5 6.393 44.814 4 41.5 4C38.186 4 35.5 6.393 35.5 9.344C35.5 10.824 36.176 12.164 37.268 13.132C37.508 13.344 37.553 13.712 37.343 13.954L36.373 15.073C36.042 15.455 36.363 16.035 36.861 15.95ZM43.344 13.386L43.381 13.369L43.42 13.355C45.288 12.678 46.5 11.092 46.5 9.344C46.5 7.051 44.373 5 41.5 5C38.627 5 36.5 7.051 36.5 9.344C36.5 10.507 37.029 11.584 37.932 12.384C38.531 12.915 38.71 13.905 38.099 14.609L37.993 14.731C38.727 14.595 39.532 14.435 40.308 14.262C41.614 13.971 42.743 13.662 43.344 13.386Z"
                />
            </svg>
        </div>
    );
}
