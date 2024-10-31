import { cwd, write } from '../scripts/script-utils.js'
import { join, relative } from 'node:path'
import { compile, compileFromFile } from 'json-schema-to-typescript'
import { createMessagingTypes } from "./json-schema.mjs";
import { createSchemasFromFiles } from "./json-schema-fs.mjs";

const ROOT = join(cwd(import.meta.url), '..')

/**
 * @typedef {object} SettingsKind
 * @property {string} schema Absolute path to a valid JSON Schema document
 * @property {string} types Absolute path to the output file
 * @property {boolean} exclude Whether to exclude this mapping
 * @property {'settings'} kind
 *
 * @typedef {object} MessagesKind
 * @property {string} typesDir Directory for the generated types
 * @property {string} schemaDir Directory containing the schemas
 * @property {boolean} exclude Whether to exclude this mapping
 * @property {function} resolve Function to resolve the path
 * @property {function} className Function to generate the class name
 * @property {'messages'} kind
 *
 * @typedef {SettingsKind | MessagesKind} Mapping
 */

/**
 * Read JSON schemas from the privacy-configuration repo and generate TypeScript types
 *
 * **note** we are NOT adding try/catch around each operation here since we want the script to fail fast
 * and the errors given from node are sufficient to debug any issues
 * @param {Record<string, Mapping>} mapping
 */
export async function buildTypes(mapping) {
    for (const [featureName, manifest] of Object.entries(mapping)) {
        if (manifest.exclude) continue;
        if (manifest.kind === 'settings') {
            const typescript = await createTypesForSchemaFile(featureName, manifest.schema);
            const content = typescript.replace(/\r\n/g, '\n')
            write([manifest.types], content)
            console.log('✅ %s schema written to `%s` from schema `%s`', featureName, relative(ROOT, manifest.types), manifest.schema)
        }
        if (manifest.kind === 'messages') {
            // create a job for each sub-folder that contains schemas
            const schemas = await createSchemasFromFiles(manifest.schemaDir)

            // for each folder
            for (const schema of schemas) {
                const typescript = await createTypesForSchemaMessages(schema.featureName, schema.schema, manifest.schemaDir)
                const featurePath = manifest.resolve(schema.dirname)
                const className = manifest.className(schema.topLevelType)
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
                 *
                 * These types are auto-generated from schema files.
                 * scripts/build-types.mjs is responsible for type generation.
                 * See the privacy-configuration repo for the schema files:
                 * https://github.com/duckduckgo/privacy-configuration
                 * **DO NOT** edit this file directly as your changes will be lost.
                 *
                 * @module ${featureName} Schema
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
             * These types are auto-generated from schema files.
             * scripts/build-types.mjs is responsible for type generation.
             * **DO NOT** edit this file directly as your changes will be lost.
             *
             * @module ${featureName} Messages
             */
            `,
    });
    return typescript
}

