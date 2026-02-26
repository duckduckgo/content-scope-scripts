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
              outerBg: '#051E3D',
              browserChrome: '#1C1C1C',
              browserBorder: '#3D3D3D',
              topBar: '#050505',
              tabsArea: '#282828',
              addressBarBg: '#3D3D3D',
              addressBarBorder: '#3377AD',
              iconPillOuterBg: 'rgba(67, 151, 224, 0.25)',
              iconPillBg: '#4397E0',
              iconPillIcons: '#282828',
              searchIcon: '#4397E0',
              navArrows: '#fff',
              navArrowsOpacity: '0.24',
          }
        : {
              // Light mode (matches Figma export)
              outerBg: '#4D9DFF',
              browserChrome: '#FAFAFA',
              browserBorder: '#ffffff',
              topBar: '#e0e0e0',
              tabsArea: '#F2F2F2',
              addressBarBg: '#fff',
              addressBarBorder: '#77B6E8',
              iconPillOuterBg: '#C9E3FF',
              iconPillBg: '#1074CC',
              iconPillIcons: '#fff',
              searchIcon: '#1074CC',
              navArrows: '#000',
              navArrowsOpacity: '0.36',
          };

    return (
        <div className={styles.wrapper}>
            <svg fill="none" viewBox="0 0 432 208" xmlns="http://www.w3.org/2000/svg" className={styles.image}>
                <defs>
                    <clipPath id="clip-main">
                        <rect width="432" height="208" fill="#fff" rx="8" />
                    </clipPath>
                </defs>
                <g clipPath="url(#clip-main)">
                    {/* Outer background */}
                    <rect width="432" height="208" fill={colors.outerBg} rx="8" />

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
