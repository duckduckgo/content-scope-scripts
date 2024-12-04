/**
 * @import { PredefinedColor, PredefinedGradient, BackgroundColorScheme, UserImage } from "../../types/new-tab"
 * @type {{
 *     colors: Record<PredefinedColor, { hex: string; colorScheme: BackgroundColorScheme }>,
 *     gradients: Record<PredefinedGradient, { path: string; colorScheme: BackgroundColorScheme }>
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
        gradient01: { path: 'gradients/gradient01.svg', colorScheme: 'light' },
        gradient02: { path: 'gradients/gradient02.svg', colorScheme: 'light' },
        gradient03: { path: 'gradients/gradient03.svg', colorScheme: 'light' },
        gradient04: { path: 'gradients/gradient04.svg', colorScheme: 'light' },
        gradient05: { path: 'gradients/gradient05.svg', colorScheme: 'dark' },
        gradient06: { path: 'gradients/gradient06.svg', colorScheme: 'dark' },
        gradient07: { path: 'gradients/gradient07.svg', colorScheme: 'dark' },
        gradient08: { path: 'gradients/gradient08.svg', colorScheme: 'dark' },
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

/**
 * Determines if a light or dark theme should be used based on background color
 * @param {string} backgroundColor - HEX color code (6 or 8 digits)
 * @returns {'light' | 'dark'} - Returns 'light' or 'dark'
 */
export function detectTheme(backgroundColor) {
    // Remove # if present and handle both 6 and 8 digit hex codes
    const hex = backgroundColor.replace('#', '');

    // Extract RGB values
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);

    // Calculate relative luminance using sRGB coefficients
    // Using the formula from WCAG 2.0
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

    // Choose theme based on luminance
    // 128 is the middle value (255/2)
    return luminance < 128 ? 'dark' : 'light';
}

// Test cases using Node's built-in assert
// const testCases = [
//     {
//         input: '#FFFFFF',
//         expected: 'light',
//         description: 'Pure white should be light theme',
//     },
//     {
//         input: '#000000',
//         expected: 'dark',
//         description: 'Pure black should be dark theme',
//     },
//     {
//         input: '7B7B7B',
//         expected: 'dark',
//         description: 'Medium gray should be dark theme',
//     },
//     {
//         input: 'FFFFFF00',
//         expected: 'light',
//         description: 'White with alpha should be light theme',
//     },
//     {
//         input: '#1E90FF',
//         expected: 'dark',
//         description: 'Dodger blue should be dark theme',
//     },
//     {
//         input: '#FFD700',
//         expected: 'light',
//         description: 'Gold should be light theme',
//     },
//     {
//         input: '#98FB98',
//         expected: 'light',
//         description: 'Pale green should be light theme',
//     },
//     {
//         input: '#800080',
//         expected: 'dark',
//         description: 'Purple should be dark theme',
//     },
//     {
//         input: '#FFA07A',
//         expected: 'light',
//         description: 'Light salmon should be light theme',
//     },
//     {
//         input: '#2F4F4F',
//         expected: 'dark',
//         description: 'Dark slate gray should be dark theme',
//     },
// ];

// Run tests
// console.log('Running tests...\n');
// testCases.forEach((testCase, index) => {
//     try {
//         const result = detectTheme(testCase.input);
//         assert.strictEqual(result, testCase.expected);
//         console.log(`✓ Test ${index + 1}: ${testCase.description}`);
//     } catch (error) {
//         console.error(`✗ Test ${index + 1}: ${testCase.description}`);
//         console.error(`  Expected: ${testCase.expected}`);
//         // console.error(`  Received: ${result}`);
//         console.error(`  Input: ${testCase.input}\n`);
//     }
// });
