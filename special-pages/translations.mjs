import { isLaunchFile } from '../scripts/script-utils.js';
import { readdir } from 'fs/promises';
import { join, basename } from 'node:path';
import { readFileSync, writeFileSync } from 'node:fs';

const paths = ['pages/new-tab'];
const base = {
    smartling: {
        string_format: 'icu',
        translate_paths: [
            {
                path: '*/title',
                key: '{*}/title',
                instruction: '*/note',
            },
        ],
    },
};

if (isLaunchFile(import.meta.url)) {
    for (let path of paths) {
        await processPage(path);
    }
}

/**
 * @param {string} path
 */
async function processPage(path) {
    const targetName = basename(path);
    const outputFile = `${path}/src/locales/en/${targetName}.json`;
    const dirents = await readdir(path, { withFileTypes: true, recursive: true });
    const rawEntries = dirents
        .filter((entry) => entry.isFile() && entry.name === 'strings.json')
        .map((entry) => {
            const path = join(entry.parentPath, entry.name);
            const raw = readFileSync(path, 'utf8');
            const json = JSON.parse(raw);
            return {
                path,
                raw,
                json,
            };
        });

    for (let rawEntry of rawEntries) {
        console.log(`✅ adding ${rawEntry.path} to ${targetName}.json`);
    }

    const entries = rawEntries.map((entry) => Object.entries(entry.json)).flat();
    const object = Object.fromEntries(entries);
    const withBase = { ...base, ...object };
    const string = JSON.stringify(withBase, null, 2);
    writeFileSync(outputFile, string);
}
