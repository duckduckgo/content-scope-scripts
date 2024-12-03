import { write } from '../scripts/script-utils.js';
import { join } from 'node:path';
import { compile } from 'json-schema-to-typescript';
import { createMessagingTypes } from './json-schema.mjs';
import { createSchemasFromSubDirectories, processOneDirectory } from './json-schema-fs.mjs';

/**
 * @typedef {object} MultiKind
 * @property {string} typesDir Directory for the generated types
 * @property {string} schemaDir Directory containing the schemas
 * @property {boolean} exclude Whether to exclude this mapping
 * @property {function} resolve Function to resolve the path
 * @property {function} className Function to generate the class name
 * @property {string} filename the single output file
 * @property {'single'} kind
 *
 * @typedef {object} MessagesKind
 * @property {string} typesDir Directory for the generated types
 * @property {string} schemaDir Directory containing the schemas
 * @property {boolean} exclude Whether to exclude this mapping
 * @property {function} resolve Function to resolve the path
 * @property {function} className Function to generate the class name
 * @property {'messages'} kind
 *
 * @typedef {MultiKind | MessagesKind} Mapping
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
        if (manifest.kind === 'single') {
            // create a job for each sub-folder that contains schemas
            const schema = processOneDirectory({ rootDir: manifest.schemaDir, featureNameTitle: featureName });
            if (!schema) {
                console.warn('could not find schema for', featureName, 'in', manifest.schemaDir);
                continue;
            }

            const typescript = await createTypesForSchemaMessages(schema.featureName, schema.schema, manifest.schemaDir);
            const featurePath = manifest.resolve(schema.dirname);
            const className = manifest.className(schema.topLevelType);
            const messageTypes = createMessagingTypes(schema, { featurePath, className });
            const content = [typescript.replace(/\r\n/g, '\n'), messageTypes].join('');
            const outputFile = join(manifest.typesDir, manifest.filename);
            write([outputFile], content);
            console.log('✅ %s schema written to', schema.featureName, outputFile);
        }
        if (manifest.kind === 'messages') {
            // create a job for each sub-folder that contains schemas
            const schemas = createSchemasFromSubDirectories(manifest.schemaDir);

            // for each folder
            for (const schema of schemas) {
                const typescript = await createTypesForSchemaMessages(schema.featureName, schema.schema, manifest.schemaDir);
                const featurePath = manifest.resolve(schema.dirname);
                const className = manifest.className(schema.topLevelType);
                const messageTypes = createMessagingTypes(schema, { featurePath, className });
                const content = [typescript.replace(/\r\n/g, '\n'), messageTypes].join('');
                const filename = schema.dirname + '.ts';
                const outputFile = join(manifest.typesDir, filename);
                write([outputFile], content);
                console.log('✅ %s schema written to', schema.featureName, outputFile);
            }
        }
    }
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
    const typescript = await compile(/** @type {any} */ (schema), featureName, {
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
    return typescript;
}
