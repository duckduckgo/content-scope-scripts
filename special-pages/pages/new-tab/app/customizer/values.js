/**
 * @import { PredefinedColor, PredefinedGradient, BackgroundColorScheme, UserImage } from "../../types/new-tab"
 * @type {{
 *     colors: Record<PredefinedColor, { hex: string; colorScheme: BackgroundColorScheme }>,
 *     gradients: Record<PredefinedGradient, { path: string; colorScheme: BackgroundColorScheme, fallback: string }>
 *     userImages: Record<'01' | '02' | '03', UserImage>
 * }}
 */
export const values = {
    colors: {
        color01: { hex: '#000000', colorScheme: 'dark' },
        color02: { hex: '#342E42', colorScheme: 'dark' },
        color03: { hex: '#4D5F7F', colorScheme: 'dark' },
        color04: { hex: '#E28499', colorScheme: 'light' },
        color05: { hex: '#F7DEE5', colorScheme: 'light' },
        color06: { hex: '#D55154', colorScheme: 'dark' },
        color07: { hex: '#E5724F', colorScheme: 'dark' },
        color08: { hex: '#F3BB44', colorScheme: 'light' },
        color09: { hex: '#E9DCCD', colorScheme: 'light' },
        color10: { hex: '#5BC787', colorScheme: 'light' },
        color11: { hex: '#4594A7', colorScheme: 'dark' },
        color12: { hex: '#B5E2CE', colorScheme: 'light' },
        color13: { hex: '#E4DEF2', colorScheme: 'light' },
        color14: { hex: '#B79ED4', colorScheme: 'light' },
        color15: { hex: '#5552AC', colorScheme: 'dark' },
        color16: { hex: '#75B9F0', colorScheme: 'light' },
        color17: { hex: '#577DE4', colorScheme: 'dark' },
        color18: { hex: '#DBDDDF', colorScheme: 'light' },
        color19: { hex: '#9A979D', colorScheme: 'dark' },
    },
    gradients: {
        gradient01: { path: 'gradients/gradient01.svg', fallback: '#f2e5d4', colorScheme: 'light' },
        gradient02: { path: 'gradients/gradient02.svg', fallback: '#d5bcd1', colorScheme: 'light' },
        gradient03: { path: 'gradients/gradient03.svg', fallback: '#f4ca78', colorScheme: 'light' },
        gradient04: { path: 'gradients/gradient04.svg', fallback: '#e6a356', colorScheme: 'light' },
        gradient05: { path: 'gradients/gradient05.svg', fallback: '#4448ae', colorScheme: 'dark' },
        gradient06: { path: 'gradients/gradient06.svg', fallback: '#a55778', colorScheme: 'dark' },
        gradient07: { path: 'gradients/gradient07.svg', fallback: '#222566', colorScheme: 'dark' },
        gradient08: { path: 'gradients/gradient08.svg', fallback: '#0e0e3d', colorScheme: 'dark' },
    },
    userImages: {
        '01': {
            colorScheme: 'dark',
            id: '01',
            src: 'backgrounds/bg-01.jpg',
            thumb: 'backgrounds/bg-01-thumb.jpg',
        },
        '02': {
            colorScheme: 'light',
            id: '02',
            src: 'backgrounds/bg-02.jpg',
            thumb: 'backgrounds/bg-02-thumb.jpg',
        },
        '03': {
            colorScheme: 'light',
            id: '03',
            src: 'backgrounds/bg-03.jpg',
            thumb: 'backgrounds/bg-03-thumb.jpg',
        },
    },
};
