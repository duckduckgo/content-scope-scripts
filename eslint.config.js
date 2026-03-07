import tseslint from 'typescript-eslint';
import ddgConfig from '@duckduckgo/eslint-config';
import globals from 'globals';

// @ts-check
export default tseslint.config(
    ...ddgConfig,
    ...tseslint.configs.recommended,
    {
        ignores: [
            '**/build/',
            '**/docs/',
            'injected/lib',
            'injected/playwright-report/',
            'injected/integration-test/extension/contentScope.js',
            'injected/integration-test/test-pages/duckplayer/scripts/dist',
            'Sources/ContentScopeScripts/dist',
            'special-pages/pages/**/public',
            'special-pages/pages/**/types',
            'special-pages/pages/**/messages',
            'special-pages/playwright-report/',
            'special-pages/test-results/',
            'playwright-report',
            'test-results',
            'injected/src/types',
            '.idea',
            'Sources/',
        ],
    },
    {
        languageOptions: {
            globals: {
                $USER_PREFERENCES$: 'readonly',
                $USER_UNPROTECTED_DOMAINS$: 'readonly',
                $CONTENT_SCOPE$: 'readonly',
                $BUNDLED_CONFIG$: 'readonly',
            },

            ecmaVersion: 'latest',
            sourceType: 'script',
        },

        rules: {
            'no-restricted-syntax': [
                'error',
                {
                    selector: "MethodDefinition[key.type='PrivateIdentifier']",
                    message: 'Private methods are currently unsupported in older WebKit and ESR Firefox',
                },
            ],

            'require-await': ['error'],
            'promise/prefer-await-to-then': ['error'],
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    args: 'none',
                    caughtErrors: 'none',
                    ignoreRestSiblings: true,
                    vars: 'all',
                },
            ],
        },
    },
    {
        ignores: ['injected/integration-test/test-pages/**', 'injected/integration-test/extension/**'],
        languageOptions: {
            parserOptions: {
                projectService: {
                    allowDefaultProject: [
                        'eslint.config.js',
                        'build-output.eslint.config.js',
                        'scripts/terminal-colors.js',
                        'scripts/check-node-version.js',
                        'scripts/preinstall.js',
                    ],
                },
            },
        },
        rules: {
            '@typescript-eslint/await-thenable': 'error',
        },
    },
    {
        files: ['**/scripts/*.js', '**/*.mjs', '**/unit-test/**/*.js', '**/integration-test/**/*.spec.js'],
        languageOptions: {
            globals: {
                ...globals.node,
            },
        },
    },
    {
        files: ['injected/**/*.js'],
        languageOptions: {
            globals: {
                windowsInteropPostMessage: 'readonly',
                windowsInteropAddEventListener: 'readonly',
                windowsInteropRemoveEventListener: 'readonly',
            },
        },
    },
    {
        files: ['**/unit-test/*.js'],
        languageOptions: {
            globals: {
                ...globals.jasmine,
            },
        },
    },
    {
        ignores: ['**/scripts/*.js'],
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.webextensions,
            },
        },
    },
);
