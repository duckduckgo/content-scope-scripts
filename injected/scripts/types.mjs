import { cwd, isLaunchFile } from '../../scripts/script-utils.js';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import { buildTypes } from '../../types-generator/build-types.mjs';

const injectRoot = join(cwd(import.meta.url), '..');

// eslint-disable-next-line no-redeclare
const require = createRequire(import.meta.url);
const configBuilderRoot = dirname(require.resolve('config-builder'));

/** @type {Record<string, import('../../types-generator/build-types.mjs').Mapping>} */
const injectSchemaMapping = {
    /**
     * Add more mappings here
     *  - `schema` should be an absolute path to a valid JSON Schema document
     *  - `types` should be an absolute path to the output file
     */
    'Webcompat Settings': {
        schema: join(configBuilderRoot, 'tests/schemas/webcompat-settings.json'),
        types: join(injectRoot, 'src/types/webcompat-settings.d.ts'),
        // todo: fix this on windows.
        exclude: process.platform === 'win32',
        kind: 'settings',
    },
    'Duckplayer Settings': {
        schema: join(configBuilderRoot, 'tests/schemas/duckplayer-settings.json'),
        types: join(injectRoot, 'src/types/duckplayer-settings.d.ts'),
        // todo: fix this on windows.
        exclude: process.platform === 'win32',
        kind: 'settings',
    },
    'Schema Messages': {
        schemaDir: join(injectRoot, 'src/messages'),
        typesDir: join(injectRoot, 'src/types'),
        // todo: fix this on windows.
        exclude: process.platform === 'win32',
        kind: 'messages',
        resolve: (dirname) => '../features/' + dirname + '.js',
        className: (topLevelType) => topLevelType.replace('Messages', ''),
    },
};

if (isLaunchFile(import.meta.url)) {
    buildTypes(injectSchemaMapping)
        // eslint-disable-next-line promise/prefer-await-to-then
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}
