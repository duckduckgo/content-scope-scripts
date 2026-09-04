/**
 * Relative luminance of a HEX color (WCAG 2.0 formula), 0 (black) to 255 (white).
 * @param {string} backgroundColor - HEX color code (6 or 8 digits)
 * @returns {number}
 */
export function getLuminanceFromHex(backgroundColor) {
    // Remove # if present and handle both 6 and 8 digit hex codes
    const hex = backgroundColor.replace('#', '');

    // Extract RGB values
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);

    // Calculate relative luminance using sRGB coefficients
    // Using the formula from WCAG 2.0
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Determines if a light or dark theme should be used based on background color
 * @param {string} backgroundColor - HEX color code (6 or 8 digits)
 * @returns {'light' | 'dark'} - Returns 'light' or 'dark'
 */
export function detectThemeFromHex(backgroundColor) {
    // Choose theme based on luminance
    // 128 is the middle value (255/2)
    return getLuminanceFromHex(backgroundColor) < 128 ? 'dark' : 'light';
}

/**
 * Flags a HEX background as a near-black or near-white "extreme" wallpaper,
 * or `undefined` for anything in between. See callers for why extremes need
 * special handling. The 40/215 thresholds (out of 255) aren't a precise
 * derivation — just "close enough to black/white to matter", picked by eye
 * against a few sample wallpapers.
 * @param {string} backgroundColor - HEX color code (6 or 8 digits)
 * @returns {'dark' | 'light' | undefined}
 */
export function getWallpaperExtreme(backgroundColor) {
    const luminance = getLuminanceFromHex(backgroundColor);
    if (luminance < 40) return 'dark';
    if (luminance > 215) return 'light';
    return undefined;
}

/**
 * This will apply default background colors as early as possible.
 *
 * @param {import("../../types/new-tab.ts").DefaultStyles | null | undefined} defaultStyles
 */
export function applyDefaultStyles(defaultStyles) {
    if (defaultStyles?.lightBackgroundColor || defaultStyles?.darkBackgroundColor) {
        console.warn('defaultStyles is deprecated. Use themeVariant instead. This will override theme variant colors.', defaultStyles);
    }
    if (defaultStyles?.lightBackgroundColor) {
        document.body.style.setProperty('--default-light-background-color', defaultStyles.lightBackgroundColor);
    }
    if (defaultStyles?.darkBackgroundColor) {
        document.body.style.setProperty('--default-dark-background-color', defaultStyles.darkBackgroundColor);
    }
}
