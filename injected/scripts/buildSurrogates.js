import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const surrogatesDir = join(__dirname, '../../node_modules/@duckduckgo/tracker-surrogates/surrogates');
const outputPath = join(__dirname, '../src/features/tracker-protection/surrogates.js');

const files = readdirSync(surrogatesDir).filter((f) => f.endsWith('.js'));

let output = '/**\n';
output += ' * Auto-generated surrogate function map.\n';
output += ' * Built from @duckduckgo/tracker-surrogates.\n';
output += ' * Do not edit manually — run `npm run build-surrogates` to regenerate.\n';
output += ' */\n\n';

output += '/** @type {Record<string, () => void>} */\n';
output += 'export const surrogates = {\n';

for (const file of files) {
    const code = readFileSync(join(surrogatesDir, file), 'utf-8').replace(/^\s*[\r\n]/gm, '');
    const escaped = code.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
    output += `    '${file}': function() {\n${code}\n    },\n`;
}

output += '};\n';

writeFileSync(outputPath, output);
console.log(`Generated surrogates map with ${files.length} entries at ${outputPath}`);
