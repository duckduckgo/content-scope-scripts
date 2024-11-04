import { readdirSync, readFileSync } from 'fs'
import { join } from 'node:path'
import { toSafeString } from 'json-schema-to-typescript/dist/src/utils.js'
import { generateSchema } from './json-schema.mjs'

/**
 * From a directory, produce a list of valid json-schema files that can be used.
 * @param {string} rootDir
 * @param {string} featureDirName
 */
export function createFileList(rootDir, featureDirName) {
    const files = readdirSync(join(rootDir, featureDirName), { withFileTypes: true })
    return files.map((x) => {
        const valid = isValidFileName(x)
        if (valid.result) {
            const abs = join(rootDir, featureDirName, x.name)
            const content = readFileSync(abs, 'utf8')
            return {
                relative: join(featureDirName, x.name),
                valid: true,
                filename: x.name,
                method: valid.method,
                kind: valid.kind,
                json: JSON.parse(content),
            }
        }
        return {
            valid: false,
            errors: [`invalid filename ${x.name}, expected \`request\`, \`notify\` or \`subscribe\``],
        }
    })
}

/**
 * @param {string} rootDir
 * @return {Promise<{
 *   schema: import("json-schema-to-typescript").JSONSchema;
 *   featureName: string;
 *   dirname: string;
 *   topLevelType: string;
 * }[]>}
 */
export async function createSchemasFromFiles(rootDir) {
    const dirList = readdirSync(rootDir, { withFileTypes: true })
    const dirs = dirList.filter((x) => x.isDirectory())

    const outputs = []

    for (let dir of dirs) {
        const fileList = createFileList(rootDir, dir.name)
        const valid = fileList.filter((x) => x.valid)
        if (valid.length === 0) continue

        const featureName = toSafeString(dir.name)
        const schema = generateSchema(featureName, valid)
        if (!schema.title) throw new Error('invariant: expected string')
        const topLevelType = toSafeString(schema.title)

        outputs.push({
            featureName,
            topLevelType,
            dirname: dir.name,
            schema,
        })
    }

    return outputs
}
/**
 * @param {import("node:fs").Dirent} file
 */
export function isValidFileName(file) {
    if (!file.isFile()) return { result: false }
    if (!file.name.endsWith('json')) return { result: false }
    const [method, kind, ext] = file.name.split('.')
    if (kind === 'request' || kind === 'response' || kind === 'notify' || kind === 'subscribe') {
        return { result: true, method, kind }
    }
    return { result: false }
}
