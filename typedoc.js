import { OptionDefaults } from 'typedoc';

/** @type {Partial<import('typedoc').TypeDocOptions>} */
const config = {
    // prettier-ignore
    projectDocuments: [
        'special-pages/pages/new-tab/app/new-tab.md',
        'injected/docs/*.md',
    ],
    entryPoints: [
        'injected/entry-points/android.js',
        'injected/entry-points/apple.js',
        'injected/entry-points/chrome.js',
        'injected/entry-points/chrome-mv3.js',
        'injected/entry-points/mozilla.js',
        'injected/entry-points/windows.js',
        'injected/src/types/*.ts',
        'injected/src/features/api-manipulation.js',
        'injected/src/features/duck-player.js',
        'injected/src/features/duckplayer/thumbnails.js',
        'injected/src/features/duckplayer/video-overlay.js',
        'injected/src/features/harmful-apis.js',
        'messaging',
        'messaging/schema.js',
        'messaging/native.js',
        'special-pages',
        'special-pages/pages/example/src/js/index.js',
        'special-pages/pages/duckplayer/src/js/index.js',
        'special-pages/pages/onboarding/src/js/index.js',
        'special-pages/pages/onboarding/app/types.js',
        'special-pages/pages/release-notes/src/js/index.js',
        'special-pages/pages/release-notes/app/types.js',
        'special-pages/pages/special-error/src/js/index.js',
        'special-pages/pages/special-error/app/types.js',
        'special-pages/pages/new-tab/app/favorites/constants.js',
        'special-pages/pages/**/types/*.ts',
    ],
    categoryOrder: ['Special Pages', 'Content Scope Scripts Integrations', 'Other'],
    out: 'docs',
    excludeExternals: true,
    excludeInternal: true,
    readme: 'none',
    treatWarningsAsErrors: true,
    searchInComments: true,
    modifierTags: [...OptionDefaults.modifierTags, '@implements'],
    highlightLanguages: [...OptionDefaults.highlightLanguages, 'mermaid'],
};

export default config;
