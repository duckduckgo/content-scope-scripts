import { readdirSync, readFileSync } from 'fs';
import { basename, join } from 'node:path';
import { toSafeString } from 'json-schema-to-typescript/dist/src/utils.js';
import { generateSchema } from './json-schema.mjs';

/**
 * From a directory, produce a list of valid json-schema files that can be used.
 * @param {string} rootDir
 * @param {string} [featureDirName] - optional feature dir name
 */
export function createFileList(rootDir, featureDirName = '') {
    const files = readdirSync(join(rootDir, featureDirName), { withFileTypes: true });
    return files.map((x) => {
        const valid = isValidFileName(x);
        if (valid.result) {
            const abs = join(rootDir, featureDirName, x.name);
            const content = readFileSync(abs, 'utf8');
            return {
                relative: join(featureDirName, x.name),
                valid: true,
                filename: x.name,
                method: valid.method,
                kind: valid.kind,
                json: JSON.parse(content),
            };
        }
        return {
            valid: false,
            errors: [`invalid filename ${x.name}, expected \`request\`, \`notify\` or \`subscribe\``],
        };
    });
}

/**
 * @param {string} rootDir
 * @return {{
 *   schema: import("json-schema-to-typescript").JSONSchema;
 *   featureName: string;
 *   dirname: string;
 *   topLevelType: string;
 * }[]}
 */
export function createSchemasFromSubDirectories(rootDir) {
    const dirList = readdirSync(rootDir, { withFileTypes: true });
    const dirs = dirList.filter((x) => x.isDirectory());

    const outputs = [];

    for (const dir of dirs) {
        outputs.push(processOneDirectory(rootDir, dir.name));
    }

    return outputs.filter((x) => x !== null);
}

/**
 * @param {string} rootDir - the full path to the directory in question
 * @param {string} [subDir] - optional subdirectory
 * @return {{schema: import('json-schema-to-typescript').JSONSchema, featureName: *, topLevelType: *, dirname}|null}
 */
export function processOneDirectory(rootDir, subDir = '') {
    const fileList = createFileList(rootDir, subDir);
    const valid = fileList.filter((x) => x.valid);
    if (valid.length === 0) return null;

    const featureName = toSafeString(subDir);
    const schema = generateSchema(featureName, valid);
    if (!schema.title) throw new Error('invariant: expected string');
    const topLevelType = toSafeString(schema.title);

    return {
        featureName,
        topLevelType,
        dirname: subDir || basename(rootDir),
        schema,
    };
}

/**
 * @param {import("node:fs").Dirent} file
 */
export function isValidFileName(file) {
    if (!file.isFile()) return { result: false };
    if (!file.name.endsWith('json')) return { result: false };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [method, kind, ext] = file.name.split('.');
    if (kind === 'request' || kind === 'response' || kind === 'notify' || kind === 'subscribe') {
        return { result: true, method, kind };
    }
    return { result: false };
}
