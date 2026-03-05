import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { compileFunction } from 'vm';
import { transform } from 'esbuild';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const surrogatesDir = join(scriptDir, '../../node_modules/@duckduckgo/tracker-surrogates/surrogates');
const outputPath = join(scriptDir, '../src/features/tracker-protection/surrogates-generated.js');

const files = readdirSync(surrogatesDir)
    .filter((f) => f.endsWith('.js'))
    .sort();

if (files.length === 0) {
    console.error('FATAL: No surrogate .js files found in', surrogatesDir);
    process.exit(1);
}

let output = '/* eslint-disable */\n';
output += '// @ts-nocheck\n';
output += '/**\n';
output += ' * Auto-generated surrogate function map.\n';
output += ' * Built from @duckduckgo/tracker-surrogates.\n';
output += ' * Do not edit manually — run `npm run build-surrogates` to regenerate.\n';
output += ' */\n\n';

output += '/** @type {Record<string, () => void>} */\n';
output += 'export const surrogates = {\n';

for (const file of files) {
    const code = readFileSync(join(surrogatesDir, file), 'utf-8').replace(/^\s*[\r\n]/gm, '');
    try {
        compileFunction(code);
    } catch (e) {
        console.error(`FATAL: Surrogate "${file}" is not a valid function body (possible scope escape):`);
        console.error(e.message);
        process.exit(1);
    }
    const indented = code
        .split('\n')
        .map((line) => (line ? '        ' + line : ''))
        .join('\n');
    const safeFile = file.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    output += `    '${safeFile}': function() {\n${indented}\n    },\n`;
}

output += '};\n';

// Integrity: validate output is parseable JS
try {
    await transform(output, { loader: 'js' });
} catch (e) {
    console.error('FATAL: Generated surrogates file is not valid JavaScript:');
    console.error(e.message);
    process.exit(1);
}

writeFileSync(outputPath, output);
console.log(`Generated surrogates map with ${files.length} entries at ${outputPath}`);
