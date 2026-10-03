import tseslint from 'typescript-eslint';
import ddgConfig from '@duckduckgo/eslint-config';
import reactHooks from 'eslint-plugin-react-hooks';
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
                    allowDefaultProject: ['eslint.config.js', 'build-output.eslint.config.js'],
                },
            },
        },
        rules: {
            '@typescript-eslint/await-thenable': 'error',
        },
    },
    {
        files: ['messaging/**/*.js', 'injected/src/**/*.js'],
        rules: {
            '@typescript-eslint/no-floating-promises': 'error',
            'no-void': ['error', { allowAsStatement: true }],
        },
    },
    {
        // web-detection runs detector selectors, XPath expressions and text patterns from remote
        // config against hostile pages. Every DOM and intrinsic slot it touches must come from
        // injected/src/captured-globals.js, or a page that replaces the slot reads the config.
        files: ['injected/src/features/web-detection/**/*.js'],
        rules: {
            'no-restricted-globals': [
                'error',
                ...['document', 'DOMParser', 'Element', 'getComputedStyle', 'Math', 'Node', 'RegExp', 'XPathResult', 'parseFloat'].map(
                    (name) => ({
                        name,
                        message: `Import ${name} from captured-globals.js: the page can replace this global.`,
                    }),
                ),
            ],
            'no-restricted-syntax': [
                'error',
                {
                    selector: "MethodDefinition[key.type='PrivateIdentifier']",
                    message: 'Private methods are currently unsupported in older WebKit and ESR Firefox',
                },
                {
                    selector:
                        'CallExpression[callee.type="MemberExpression"][callee.property.name=/^(test|exec|querySelector|querySelectorAll|createExpression|evaluate|snapshotItem|parseFromString|getBoundingClientRect|getPropertyValue|hasOwnProperty|remove|item|join|some|every|filter|map|forEach|includes|push|slice|trim|charCodeAt|call|apply|bind)$/]',
                    message: 'Call the captured-globals.js equivalent: the page can replace this prototype method.',
                },
                {
                    selector: 'ForOfStatement, ArrayExpression > SpreadElement, CallExpression > SpreadElement, ArrayPattern',
                    message: 'Iteration routes through a page-replaceable Symbol.iterator; use an index loop.',
                },
            ],
        },
    },
    {
        files: ['special-pages/**/*.{js,jsx,ts,tsx}'],
        plugins: { 'react-hooks': reactHooks },
        rules: {
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'error',
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
