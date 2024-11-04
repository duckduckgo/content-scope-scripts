// this belongs to the injected/ package, but eslint has issues with linting files outside of the base directory:
// https://github.com/eslint/eslint/discussions/18806#discussioncomment-10848750

export default [
    {
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'script',
        },
        rules: {
            'no-implicit-globals': 'error',
        },
    },
]
