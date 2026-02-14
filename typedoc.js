import { OptionDefaults } from 'typedoc';

/** @type {Partial<import('typedoc').TypeDocOptionMap>} */
const config = {
    // prettier-ignore
    projectDocuments: [
        'guides/*.md',
        'special-pages/pages/new-tab/app/new-tab.md',
        'special-pages/pages/history/app/history.md',
        'special-pages/pages/special-error/app/special-error.md',
        'special-pages/pages/errorpage/app/errorpage.md',
        'injected/docs/*.md',
        'messaging/docs/messaging.md',

    ],
    entryPoints: [
        'injected/entry-points/android.js',
        'injected/entry-points/apple.js',
        'injected/entry-points/extension-mv3.js',
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
        'special-pages/pages/example/src/index.js',
        'special-pages/pages/duckplayer/src/index.js',
        'special-pages/pages/onboarding/src/index.js',
        'special-pages/pages/onboarding/app/types.js',
        'special-pages/pages/release-notes/src/index.js',
        'special-pages/pages/release-notes/app/types.js',
        'special-pages/pages/special-error/src/index.js',
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
    highlightLanguages: [...OptionDefaults.highlightLanguages, 'mermaid', 'java', 'swift'],
};

export default config;
