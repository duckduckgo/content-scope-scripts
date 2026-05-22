/**
 * Page build configuration
 *
 * Defines which build jobs each page requires for each platform.
 * - 'copy': Copy public/ to build output
 * - 'build-js': Build JS/CSS from src/index.js and src/inline.js
 * - 'build-css': Build CSS only from src/index.css
 * - 'inline-html': Inline assets into HTML for single-file distribution
 */
export const pages = {
    /** @type {Partial<Record<ImportMeta['injectName'], string[]>>} */
    duckplayer: {
        integration: ['copy', 'build-js'],
        windows: ['copy', 'build-js'],
        apple: ['copy', 'build-js', 'inline-html'],
        android: ['copy', 'build-js'],
    },
    /** @type {Partial<Record<ImportMeta['injectName'], string[]>>} */
    errorpage: {
        integration: ['copy', 'build-css'],
        apple: ['copy', 'build-css', 'inline-html'],
    },
    /** @type {Partial<Record<ImportMeta['injectName'], string[]>>} */
    onboarding: {
        integration: ['copy', 'build-js'],
        windows: ['copy', 'build-js'],
        apple: ['copy', 'build-js'],
    },
    /** @type {Partial<Record<ImportMeta['injectName'], string[]>>} */
    example: {
        integration: ['copy', 'build-js'],
    },
    /** @type {Partial<Record<ImportMeta['injectName'], string[]>>} */
    'release-notes': {
        integration: ['copy', 'build-js'],
        apple: ['copy', 'build-js'],
        windows: ['copy', 'build-js'],
    },
    /** @type {Partial<Record<ImportMeta['injectName'], string[]>>} */
    'special-error': {
        integration: ['copy', 'build-js'],
        apple: ['copy', 'build-js', 'inline-html'],
        windows: ['copy', 'build-js', 'inline-html'],
    },
    /** @type {Partial<Record<ImportMeta['injectName'], string[]>>} */
    'new-tab': {
        integration: ['copy', 'build-js'],
        windows: ['copy', 'build-js'],
        apple: ['copy', 'build-js'],
    },
    /** @type {Partial<Record<ImportMeta['injectName'], string[]>>} */
    history: {
        integration: ['copy', 'build-js'],
        windows: ['copy', 'build-js'],
        apple: ['copy', 'build-js'],
    },
};
