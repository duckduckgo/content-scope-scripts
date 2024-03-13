import {cwd, isLaunchFile, write} from './script-utils.js'
import {basename, dirname, join, relative } from 'node:path'
import { createRequire } from 'node:module'
import { compileFromFile } from 'json-schema-to-typescript'
import {readFileSync} from "fs";

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
    "Webcompat Messages": {
        schema: join(ROOT, "src/messages/web-compat.json"),
        types: join(ROOT, "src/types/web-compat.ts"),
        kind: 'messages',
        // todo: fix this on windows.
        exclude: process.platform === 'win32'
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
        const typescript = await compileFromFile(manifest.schema, {
            bannerComment: `
            // eslint-disable
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
        });
        let content = typescript.replace(/\r\n/g, '\n')

        // for the typed messages, apply a module augmentation
        // TODO: add some tests+docs for this. It's a convention based approach to keep JSON schema files compliant
        if (manifest.kind === 'messages') {
            const json = JSON.parse(readFileSync(manifest.schema, 'utf8'));
            const base = basename(manifest.schema, '.json');
            const relativePath = '../features/' + base + '.js';
            const className = json.title.replace('Messages', '');
            const notifications = json.properties?.notifications?.oneOf?.length ?? 0 > 0;
            const requests = json.properties?.requests?.oneOf?.length ?? 0 > 0;
            const lines = [];
            if (notifications) lines.push(`notify: GlobalMessagingBase<${json.title}>['notify']`)
            if (requests) lines.push(`request: GlobalMessagingBase<${json.title}>['request']`)
            const template = `
declare module ${JSON.stringify(relativePath)} {
  export interface ${className} {
    ${lines.join(',   ')}
  }
}

`
            content = content + template;
        }
        write([manifest.types], content)
        console.log('✅ %s schema written to `%s` from schema `%s`', featureName, relative(ROOT, manifest.types), manifest.schema)
    }
}


if (isLaunchFile(import.meta.url)) {
    buildTypes()
        .catch((error) => {
            console.error(error)
            process.exit(1)
        })
}
