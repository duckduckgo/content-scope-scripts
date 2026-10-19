/**
 * The toolbar's own glyphs as 16×16 stroked path data. Action icons come from native with the actions.
 * These are stand-ins until the design-system glyphs are vendored.
 */
export const ICONS = {
    defaultAction: 'M8 2l1.4 4.6L14 8l-4.6 1.4L8 14l-1.4-4.6L2 8l4.6-1.4z',
    more: 'M3.5 8h.01M8 8h.01M12.5 8h.01',
    hide: 'M2 8s2.2-4.5 6-4.5S14 8 14 8s-2.2 4.5-6 4.5S2 8 2 8zM2.5 2.5l11 11',
    settings: 'M2 4.5h7M12 4.5h2M2 11.5h2M7 11.5h7M10.5 3v3M5.5 10v3',
    chevronDown: 'M4 6l4 4 4-4',
    chevronRight: 'M6 4l4 4-4 4',
    check: 'M3 8.5l3 3 7-7',
};

const SPARKLE =
    'M7.632 2.787c.096-.383.64-.383.736 0l.438 1.753c.203.815.84 1.45 1.654 1.654l1.753.438c.383.096.383.64 0 .736l-1.753.438c-.815.203-1.45.84-1.654 1.654l-.438 1.753c-.096.383-.64.383-.736 0L7.194 9.46A2.273 2.273 0 0 0 5.54 7.806l-1.753-.438c-.383-.096-.383-.64 0-.736l1.753-.438A2.273 2.273 0 0 0 7.194 4.54l.438-1.753Z';

/**
 * @typedef {'body' | 'outline' | 'ring'} LogoGradient
 * @typedef {'base' | 'sparkle'} LogoColor
 * @typedef {Record<LogoGradient, [string, string]> & Record<LogoColor, string>} LogoColors
 */

/**
 * The Duck.ai logo, Ai-Chat-Gradient-Color-16 and Ai-Chat-OnDark-Color-16 from the design-system Icons repo (also in
 * special-pages/pages/new-tab/app/components/Icons.js), as data so the toolbar can build it with createElementNS.
 * The two variants share their shapes and differ only in colour. Their full-viewBox clip path is left out: it clips
 * nothing.
 */
export const DUCK_AI_LOGO = {
    /** @type {{ name: LogoGradient, y1: number, y2: number }[]} vertical, x1 = x2 = 8 */
    gradients: [
        { name: 'body', y1: 0, y2: 15.944 },
        { name: 'outline', y1: 15.944, y2: 0 },
        { name: 'ring', y1: 2.5, y2: 11.5 },
    ],
    /** @type {{ fill: LogoGradient | LogoColor, d: string }[]} */
    paths: [
        {
            fill: 'body',
            d: 'M1.164 14.763c-.441.51-.014 1.284.65 1.17 2.655-.457 7.306-1.338 9.199-2.206C13.938 12.667 16 10.111 16 7.125 16 3.19 12.418 0 8 0S0 3.19 0 7.125c0 1.974.902 3.76 2.358 5.051.32.283.38.773.1 1.095l-1.294 1.492Z',
        },
        {
            fill: 'outline',
            d: 'M15 7.125c0 2.495-1.729 4.72-4.328 5.662l-.039.014-.037.017c-.838.384-2.376.803-4.114 1.19a98.74 98.74 0 0 1-4.03.797l.762-.878c.68-.785.487-1.898-.193-2.5-1.227-1.087-1.973-2.55-2.019-4.147L1 7.125C1 3.848 4.022 1 8 1V0l-.207.003C3.54.099.11 3.153.003 6.94L0 7.125c0 1.913.846 3.649 2.223 4.929l.135.122c.32.283.38.773.1 1.096l-1.293 1.491c-.442.51-.015 1.284.65 1.17 2.654-.456 7.305-1.338 9.198-2.206C13.938 12.667 16 10.111 16 7.125l-.002-.184C15.888 3.091 12.349.001 8 .001v1c3.916 0 6.905 2.759 6.998 5.97l.002.154Z',
        },
        { fill: 'base', d: SPARKLE },
        {
            fill: 'ring',
            d: 'M6.662 2.544C7 1.195 8.867 1.154 9.3 2.418l.038.126.438 1.753c.114.457.47.813.927.927l1.753.438c1.392.348 1.392 2.328 0 2.676l-1.753.438c-.457.114-.813.47-.927.927l-.438 1.753c-.348 1.392-2.328 1.392-2.676 0l-.438-1.753a1.274 1.274 0 0 0-.927-.927l-1.753-.438c-1.392-.348-1.392-2.328 0-2.676l1.753-.438c.457-.114.813-.47.927-.927l.438-1.753ZM8 5.271A3.273 3.273 0 0 1 6.27 7 3.273 3.273 0 0 1 8 8.729 3.274 3.274 0 0 1 9.729 7 3.273 3.273 0 0 1 8 5.27Z',
        },
        { fill: 'sparkle', d: SPARKLE },
    ],
    /** @type {{ light: LogoColors, dark: LogoColors }} */
    colors: {
        light: {
            body: ['#A7B7FD', '#3969EF'],
            outline: ['#2B55CA', '#557FF3'],
            ring: ['#839DF9', '#3969EF'],
            base: '#FFFFFF',
            sparkle: '#FFFFFF',
        },
        dark: {
            body: ['#CCDAFF', '#8FABF9'],
            outline: ['#557FF3', '#ADC2FC'],
            ring: ['#CCDAFF', '#ADC2FC'],
            base: '#FFFFFF',
            sparkle: '#2B55CA',
        },
    },
};
