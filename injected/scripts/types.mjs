import { cwd, isLaunchFile } from '../../scripts/script-utils.js';
import { join, basename } from 'node:path';
import { readdirSync, writeFileSync } from 'node:fs';
import { buildTypes } from '../../types-generator/build-types.mjs';

const injectRoot = join(cwd(import.meta.url), '..');

/** @type {Record<string, import('../../types-generator/build-types.mjs').Mapping>} */
const injectSchemaMapping = {
    /**
     * Add more mappings here
     *  - `schema` should be an absolute path to a valid JSON Schema document
     *  - `types` should be an absolute path to the output file
     */
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

// ============================================================================
// Feature Map Generation
// Scans src/features/*.js and generates src/types/feature-map.ts
// ============================================================================

const FEATURES_DIR = join(injectRoot, 'src/features');
const FEATURE_MAP_OUTPUT = join(injectRoot, 'src/types/feature-map.ts');

/**
 * Convert kebab-case filename to camelCase feature name
 * @param {string} filename
 */
function fileNameToFeatureName(filename) {
    const base = basename(filename, '.js');
    return base.replace(/-([a-z0-9])/g, (_, char) => char.toUpperCase());
}

/**
 * Convert camelCase feature name to kebab-case filename
 * @param {string} featureName
 */
function featureNameToFileName(featureName) {
    return featureName.replace(/([a-zA-Z])(?=[A-Z0-9])/g, '$1-').toLowerCase();
}

/**
 * Scan features directory and return sorted list of feature names
 */
function discoverFeatures() {
    const files = readdirSync(FEATURES_DIR);
    return files
        .filter((f) => f.endsWith('.js') && !f.startsWith('_') && !f.startsWith('.'))
        .map(fileNameToFeatureName)
        .sort();
}

/**
 * Generate the TypeScript content for feature-map.ts
 * @param {string[]} featureNames
 */
function generateFeatureMapTypeScript(featureNames) {
    const imports = featureNames.map((name) => {
        const fileName = featureNameToFileName(name);
        const typeName = name.charAt(0).toUpperCase() + name.slice(1);
        return `import type ${typeName} from '../features/${fileName}.js';`;
    });

    const typeEntries = featureNames.map((name) => {
        const typeName = name.charAt(0).toUpperCase() + name.slice(1);
        return `    ${name}: ${typeName};`;
    });

    return `/**
 * These types are auto-generated from feature files.
 * scripts/types.mjs is responsible for type generation.
 * **DO NOT** edit this file directly as your changes will be lost.
 *
 * @module FeatureMap
 */

${imports.join('\n')}

/**
 * Map of feature names to feature class instances.
 * Auto-generated from src/features/*.js
 */
export interface FeatureMap {
${typeEntries.join('\n')}
}

export type FeatureName = keyof FeatureMap;
`;
}

/**
 * Generate the feature map type file
 */
function generateFeatureMap() {
    const featureNames = discoverFeatures();
    const content = generateFeatureMapTypeScript(featureNames);
    writeFileSync(FEATURE_MAP_OUTPUT, content);
    console.log('✅ Feature map written to', FEATURE_MAP_OUTPUT);
}

if (isLaunchFile(import.meta.url)) {
    // Generate feature map first (synchronous)
    generateFeatureMap();

    // Then build schema-based types
    buildTypes(injectSchemaMapping)
        // eslint-disable-next-line promise/prefer-await-to-then
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}
