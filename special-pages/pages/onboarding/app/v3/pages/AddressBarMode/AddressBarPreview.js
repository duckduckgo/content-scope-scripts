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
              outerBg: '#06092d',
              starsOpacity: '0.1',
              browserChrome: '#282828',
              browserBorder: '#3c3c3c',
              topBar: '#050505',
              tabsArea: '#333',
              addressBarBg: '#3d3d3d',
              addressBarBorder: '#adc2fc',
              iconPillBg: '#8fabf9',
              iconPillIcons: '#3d3d3d',
              searchIcon: '#8fabf9',
              navArrows: '#fff',
              navArrowsOpacity: '0.24',
          }
        : {
              // Light mode
              outerBg: 'transparent', // Gradient applied via CSS on wrapper
              starsOpacity: '0.2',
              browserChrome: '#f2f2f2',
              browserBorder: '#e6edff',
              topBar: '#e0e0e0',
              tabsArea: '#fafafa',
              addressBarBg: '#fff',
              addressBarBorder: '#adc2fc',
              iconPillBg: '#3969ef',
              iconPillIcons: '#fff',
              searchIcon: '#3969ef',
              navArrows: '#000',
              navArrowsOpacity: '0.36',
          };

    const wrapperStyle = isDarkMode
        ? {}
        : { background: 'linear-gradient(180deg, #b8d2fc 0%, #9ab8f8 50%, #7295f6 100%)', borderRadius: '8px' };

    return (
        <div className={styles.wrapper} style={wrapperStyle}>
            <svg fill="none" viewBox="0 0 432 208" xmlns="http://www.w3.org/2000/svg" className={styles.image}>
                <defs>
                    <clipPath id="clip-main">
                        <rect width="432" height="208" fill="#fff" rx="8" />
                    </clipPath>
                </defs>
                <g clipPath="url(#clip-main)">
                    {/* Outer background */}
                    <rect width="432" height="208" fill={colors.outerBg} rx="8" />

                    {/* Stars/decorations */}
                    <path
                        fill="#fff"
                        d="M25.235 142c.824 0 1.53.588 1.648 1.294l.823 3.177c.118.588.706 1.176 1.294 1.294l3.177.823c.823.235 1.294.942 1.294 1.647 0 .824-.588 1.53-1.294 1.648l-3.177.823c-.588.118-1.176.706-1.294 1.294l-.823 3.177c-.235.823-.942 1.294-1.648 1.294-.823 0-1.53-.588-1.647-1.294L22.765 154c-.118-.588-.706-1.176-1.294-1.294l-3.177-.823c-.824-.235-1.294-.942-1.294-1.648 0-.823.588-1.529 1.294-1.647l3.177-.823c.588-.118 1.176-.706 1.294-1.294l.823-3.177c.235-.823.941-1.294 1.647-1.294m392-4c.824 0 1.53.588 1.648 1.294l.823 3.177c.118.588.706 1.176 1.294 1.294l3.177.823c.823.235 1.294.942 1.294 1.647 0 .824-.588 1.53-1.294 1.648l-3.177.823c-.588.118-1.176.706-1.294 1.294l-.823 3.177c-.235.823-.942 1.294-1.648 1.294-.823 0-1.529-.588-1.647-1.294l-.823-3.177c-.118-.588-.706-1.176-1.294-1.294l-3.177-.823c-.824-.235-1.294-.942-1.294-1.648 0-.823.588-1.529 1.294-1.647l3.177-.823c.588-.118 1.176-.706 1.294-1.294l.823-3.177c.235-.823.942-1.294 1.647-1.294m-10.147-15a3.1 3.1 0 0 1 3.089 3.088 3.1 3.1 0 0 1-3.089 3.089 3.1 3.1 0 0 1-3.088-3.089 3.1 3.1 0 0 1 3.088-3.088M7.5 122c1.375 0 2.5 1.125 2.5 2.5S8.875 127 7.5 127a2.507 2.507 0 0 1-2.5-2.5c0-1.375 1.125-2.5 2.5-2.5M20 106.25c.5 0 .928.357 1 .785l.5 1.929c.071.357.429.715.786.786l1.928.5c.5.143.786.571.786 1 0 .5-.358.929-.786 1l-1.928.5c-.357.071-.714.428-.786.785l-.5 1.929c-.143.5-.571.786-1 .786-.5 0-.929-.358-1-.786l-.5-1.929c-.072-.357-.43-.714-.786-.785l-1.928-.5a1.05 1.05 0 0 1-.786-1c0-.5.358-.929.786-1l1.928-.5c.357-.071.715-.429.786-.786l.5-1.929a1.05 1.05 0 0 1 1-.785M426.875 98a1.88 1.88 0 0 1 1.875 1.875 1.88 1.88 0 0 1-1.875 1.875A1.88 1.88 0 0 1 425 99.875 1.88 1.88 0 0 1 426.875 98M405.5 82c.75 0 1.393.536 1.5 1.179l.75 2.892c.107.536.643 1.072 1.179 1.179l2.892.75c.75.214 1.179.857 1.179 1.5 0 .75-.536 1.393-1.179 1.5l-2.892.75c-.536.107-1.072.643-1.179 1.179L407 95.82c-.214.75-.857 1.179-1.5 1.179-.75 0-1.393-.536-1.5-1.179l-.75-2.892c-.107-.536-.643-1.072-1.179-1.179l-2.892-.75c-.75-.214-1.179-.857-1.179-1.5 0-.75.536-1.393 1.179-1.5l2.892-.75c.536-.107 1.072-.643 1.179-1.179l.75-2.892c.214-.75.857-1.179 1.5-1.179m-393-14c1.375 0 2.5 1.125 2.5 2.5S13.875 73 12.5 73a2.507 2.507 0 0 1-2.5-2.5c0-1.375 1.125-2.5 2.5-2.5M417 61c.5 0 .929.358 1 .786l.5 1.928c.071.357.429.715.786.786l1.928.5c.5.143.786.571.786 1 0 .5-.358.929-.786 1l-1.928.5c-.357.071-.715.429-.786.786l-.5 1.928c-.143.5-.571.786-1 .786-.5 0-.929-.358-1-.786l-.5-1.928c-.071-.357-.429-.715-.786-.786l-1.928-.5a1.05 1.05 0 0 1-.786-1c0-.5.358-.929.786-1l1.928-.5c.357-.071.715-.429.786-.786l.5-1.928c.143-.5.571-.786 1-.786M27.5 45c.75 0 1.393.536 1.5 1.179l.75 2.892c.107.536.643 1.072 1.179 1.179l2.892.75c.75.214 1.179.857 1.179 1.5 0 .75-.536 1.393-1.179 1.5l-2.892.75c-.536.107-1.072.643-1.179 1.179L29 58.82c-.214.75-.857 1.179-1.5 1.179-.75 0-1.393-.536-1.5-1.179l-.75-2.892c-.107-.536-.643-1.072-1.179-1.179L21.18 54c-.75-.214-1.179-.857-1.179-1.5 0-.75.536-1.393 1.179-1.5l2.892-.75c.536-.107 1.072-.643 1.179-1.179L26 46.18c.214-.75.857-1.179 1.5-1.179"
                        opacity={colors.starsOpacity}
                    />

                    {/* Browser chrome */}
                    <path fill={colors.browserChrome} d="M32 30a8 8 0 0 1 8-8h352a8 8 0 0 1 8 8v178H32z" />
                    <path
                        fill={colors.browserBorder}
                        d="M400 30a8 8 0 0 0-8-8v-2c5.523 0 10 4.477 10 10v180H30V30c0-5.523 4.477-10 10-10v2a8 8 0 0 0-8 8v178h368zm-8-10v2H40v-2z"
                    />
                    <path fill={colors.topBar} d="M32 30a8 8 0 0 1 8-8h352a8 8 0 0 1 8 8v50H32z" />
                    <path
                        fill={colors.tabsArea}
                        d="M166 37a8 8 0 0 0 8 8h75a8 8 0 0 1 8 8v3a8 8 0 0 1-8 8H55a8 8 0 0 1-8-8v-3a8 8 0 0 1 8-8h3a8 8 0 0 0 8-8v-5a8 8 0 0 1 8-8h84a8 8 0 0 1 8 8z"
                    />
                    <path fill={colors.tabsArea} d="M32 53a8 8 0 0 1 8-8h352a8 8 0 0 1 8 8v28H32z" />

                    {/* Navigation arrows */}
                    <path
                        fill={colors.navArrows}
                        fillOpacity={colors.navArrowsOpacity}
                        d="M49.86 58.267a.469.469 0 0 0-.664-.663l-3.983 3.987a1.594 1.594 0 0 0 0 2.253l3.983 3.986a.469.469 0 0 0 .663-.663l-3.979-3.981h9.65a.469.469 0 0 0 0-.938h-9.65zm326.89.702c0-.26.21-.469.469-.469h9.562a.469.469 0 1 1 0 .938h-9.562a.47.47 0 0 1-.469-.47m0 3.751c0-.26.21-.469.469-.469h9.562a.469.469 0 1 1 0 .938h-9.562a.47.47 0 0 1-.469-.47m.469 3.282a.469.469 0 1 0 0 .938h9.562a.469.469 0 1 0 0-.938z"
                    />
                </g>
            </svg>

            {/* CSS Background overlay - animates smoothly with CSS */}
            <div className={`${styles.bgOverlay} ${isReduced ? styles.bgReduced : ''}`} style={{ backgroundColor: colors.addressBarBg }} />
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
                <path
                    fill={colors.iconPillBg}
                    d="M0 10c0-5.523 4.477-10 10-10h36c5.523 0 10 4.477 10 10s-4.477 10-10 10H10C4.477 20 0 15.523 0 10"
                />
                <path
                    fill={colors.iconPillIcons}
                    d="M46 2a8 8 0 0 1 0 16H36a8 8 0 0 1 0-16zm-31.75 2a5.25 5.25 0 0 1 4.049 8.592l2.555 2.555.064.078a.502.502 0 0 1-.693.693l-.079-.065-2.554-2.554A5.25 5.25 0 1 1 14.25 4M42 4c-3.314 0-6 2.392-6 5.344 0 1.48.676 2.82 1.769 3.788.239.212.284.58.075.822l-.971 1.118a.531.531 0 0 0 .488.877c1.992-.342 5.481-1.003 6.9-1.654 2.193-.795 3.739-2.712 3.739-4.951C48 6.392 45.314 4 42 4m0 1c2.873 0 5 2.05 5 4.344 0 1.748-1.213 3.333-3.08 4.01l-.038.015-.038.017c-.601.275-1.73.585-3.035.876-.777.173-1.582.333-2.316.47l.106-.123c.611-.704.432-1.694-.167-2.225-.903-.8-1.432-1.877-1.432-3.04C37 7.05 39.127 5 42 5m-27.75 0a4.25 4.25 0 1 0 0 8.5 4.25 4.25 0 0 0 0-8.5m28.035 1.453c-.074-.297-.496-.296-.57 0l-.165.658a2.45 2.45 0 0 1-1.782 1.784l-.659.164c-.296.074-.296.496 0 .57l.659.165c.877.22 1.562.905 1.782 1.782l.165.658c.074.297.496.297.57 0l.164-.658a2.45 2.45 0 0 1 1.783-1.782l.659-.165c.296-.075.296-.496 0-.57l-.659-.164a2.45 2.45 0 0 1-1.783-1.784z"
                />
            </svg>
        </div>
    );
}
