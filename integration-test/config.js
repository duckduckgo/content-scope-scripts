export default {
    spec_dir: 'integration-test',
    jsLoader: 'import',
    spec_files: [
        '**/*.js',
        '!test-pages/**/*.js',
        '!pages/**/*.js',
        '!playwright/**/*.js',
        '!extension/**/*.js'
    ],
    random: false
}
