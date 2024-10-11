import { cwd, isLaunchFile, write } from './script-utils.js'
import { dirname, join, relative } from 'node:path'
import { createRequire } from 'node:module'
import { compile, compileFromFile } from 'json-schema-to-typescript'
import { createMessagingTypes } from "./utils/json-schema.mjs";
import { createSchemasFromFiles } from "./utils/json-schema-fs.mjs";

const ROOT = join(cwd(import.meta.url), '..')
const require = createRequire(import.meta.url);
const configBuilderRoot = dirname(require.resolve("config-builder"));

const defaultMapping = {
    /**
     * Add more mappings here
     *  - `schema` should be an absolute path to a valid JSON Schema document
     *  - `types` should be an absolute path to the output file
     */
    "Webcompat Settings": {
        schema: join(configBuilderRoot, "tests/schemas/webcompat-settings.json"),
        types: join(ROOT, "src/types/webcompat-settings.d.ts"),
        kind: 'settings',
    },
    "Duckplayer Settings": {
        schema: join(configBuilderRoot, "tests/schemas/duckplayer-settings.json"),
        types: join(ROOT, "src/types/duckplayer-settings.d.ts"),
        kind: 'settings',
    },
    "Schema Messages": {
        schemaDir: join(ROOT, "src/messages"),
        typesDir: join(ROOT, "src/types"),
        // todo: fix this on windows.
        exclude: process.platform === 'win32',
        kind: 'messages',
        resolve: (dirname) => '../features/' + dirname + '.js',
        className: (topLevelType) => topLevelType.replace('Messages', ''),
    },
    "Page Messages": {
        schemaDir: join(ROOT, "special-pages/messages"),
        typesDir: join(ROOT, "special-pages/types"),
        // todo: fix this on windows.
        exclude: process.platform === 'win32',
        kind: 'messages',
        resolve: (dirname) => '../pages/' + dirname + '/src/js/index.js',
        className: (topLevelType) => topLevelType.replace('Messages', 'Page')
    }
}

/**
 * Read JSON schemas from the privacy-configuration repo and generate TypeScript types
 *
 * **note** we are NOT adding try/catch around each operation here since we want the script to fail fast
 * and the errors given from node are sufficient to debug any issues
 */
export async function buildTypes(mapping = defaultMapping) {
    for (let [featureName, manifest] of Object.entries(mapping)) {
        if (manifest.exclude) continue;
        if (manifest.kind === 'settings') {
            const typescript = await createTypesForSchemaFile(featureName, manifest.schema);
            let content = typescript.replace(/\r\n/g, '\n')
            write([manifest.types], content)
            console.log('✅ %s schema written to `%s` from schema `%s`', featureName, relative(ROOT, manifest.types), manifest.schema)
        }
        if (manifest.kind === 'messages') {
            // create a job for each sub-folder that contains schemas
            const schemas = await createSchemasFromFiles(manifest.schemaDir)

            // for each folder
            for (let schema of schemas) {
                const typescript = await createTypesForSchemaMessages(schema.featureName, schema.schema, manifest.schemaDir)
                let featurePath = manifest.resolve(schema.dirname)
                let className = manifest.className(schema.topLevelType)
                const messageTypes = createMessagingTypes(schema, { featurePath, className })
                const content = [typescript.replace(/\r\n/g, '\n'), messageTypes].join('')
                const filename = schema.dirname + '.ts'
                const outputFile = join(manifest.typesDir, filename);
                write([outputFile], content)
                console.log('✅ %s schema written to', schema.featureName, outputFile)
            }
        }
    }
}

/**
 * Create Typescript types for any schema file
 * @param {string} featureName
 * @param {string} schemaFilePath
 */
async function createTypesForSchemaFile(featureName, schemaFilePath) {
    return await compileFromFile(schemaFilePath, {
        additionalProperties: false,
        bannerComment: `
                /**
                 * @module ${featureName} Schema
                 * @description 
                 * These types are auto-generated from schema files.
                 * scripts/build-types.mjs is responsible for type generation.
                 * See the privacy-configuration repo for the schema files:
                 * https://github.com/duckduckgo/privacy-configuration
                 * **DO NOT** edit this file directly as your changes will be lost.
                 */
                `
    })
}

/**
 * Create Typescript that work well with @duckduckgo/messaging
 *
 * @param {string} featureName
 * @param {import("json-schema-to-typescript").JSONSchema} schema
 * @param {string} rootDir
 * @return {Promise<string>}
 */
export async function createTypesForSchemaMessages(featureName, schema, rootDir) {
    const typescript = await compile(/** @type {any} */(schema), featureName, {
        cwd: rootDir,
        additionalProperties: false,
        bannerComment: `
            /**
             * @module ${featureName} Messages
             * @description 
             *
             * These types are auto-generated from schema files.
             * scripts/build-types.mjs is responsible for type generation.
             * **DO NOT** edit this file directly as your changes will be lost.
             */
            `,
    });
    return typescript
}


if (isLaunchFile(import.meta.url)) {
    buildTypes()
        .catch((error) => {
            console.error(error)
            process.exit(1)
        })
}
