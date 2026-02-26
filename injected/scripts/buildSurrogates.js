import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const surrogatesDir = join(scriptDir, '../../node_modules/@duckduckgo/tracker-surrogates/surrogates');
const outputPath = join(scriptDir, '../src/features/tracker-protection/surrogates.js');

const files = readdirSync(surrogatesDir)
    .filter((f) => f.endsWith('.js'))
    .sort();

let output = '// @ts-nocheck\n';
output += '/**\n';
output += ' * Auto-generated surrogate function map.\n';
output += ' * Built from @duckduckgo/tracker-surrogates.\n';
output += ' * Do not edit manually — run `npm run build-surrogates` to regenerate.\n';
output += ' */\n\n';

output += '/** @type {Record<string, () => void>} */\n';
output += 'export const surrogates = {\n';

for (const file of files) {
    const code = readFileSync(join(surrogatesDir, file), 'utf-8').replace(/^\s*[\r\n]/gm, '');
    output += `    '${file}': function() {\n${code}\n    },\n`;
}

output += '};\n';

writeFileSync(outputPath, output);

execSync(`npx prettier --write "${outputPath}"`, { stdio: 'inherit' });

console.log(`Generated surrogates map with ${files.length} entries at ${outputPath}`);
