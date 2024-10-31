import tseslint from 'typescript-eslint';
import ddgConfig from "@duckduckgo/eslint-config";
import globals from "globals";

// @ts-check
export default tseslint.config(
    ...ddgConfig,
    ...tseslint.configs.recommended,
    {
        ignores: [
            "**/build/",
            "**/docs/",
            "injected/lib",
            "Sources/ContentScopeScripts/dist/",
            "injected/integration-test/extension/contentScope.js",
            "injected/integration-test/test-pages/duckplayer/scripts/dist",
            "special-pages/pages/**/public",
            "special-pages/playwright-report/",
            "special-pages/test-results/",
            "special-pages/types/",
            "special-pages/messages/",
            "playwright-report",
            "test-results",
            "injected/src/types",
        ],
    },
    {
        languageOptions: {
            globals: {
                ...globals.webextensions,
                ...globals.browser,
                ...globals.jasmine,
                $USER_PREFERENCES$: "readonly",
                $USER_UNPROTECTED_DOMAINS$: "readonly",
                $CONTENT_SCOPE$: "readonly",
                $BUNDLED_CONFIG$: "readonly",
                windowsInteropPostMessage: "readonly",
                windowsInteropAddEventListener: "readonly",
                windowsInteropRemoveEventListener: "readonly",
            },

            ecmaVersion: "latest",
            sourceType: "script",

            parserOptions: {
                projectService: {
                    allowDefaultProject: ['eslint.config.mjs'],
                },
            },
        },

        rules: {
            "no-restricted-syntax": ["error", {
                selector: "MethodDefinition[key.type='PrivateIdentifier']",
                message: "Private methods are currently unsupported in older WebKit and ESR Firefox",
            }],

            "require-await": ["error"],
            "promise/prefer-await-to-then": ["error"],
            "@typescript-eslint/await-thenable": "error",
            "@typescript-eslint/no-unused-vars": ["error", {
                args: "none",
                caughtErrors: "none",
                ignoreRestSiblings: true,
                vars: "all"
            }],
        },
    }
);
