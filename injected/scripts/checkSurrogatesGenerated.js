import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const generatedPath = join(scriptDir, '../src/features/tracker-protection/surrogates-generated.js');

if (!existsSync(generatedPath)) {
    console.error('FATAL: surrogates-generated.js not found at', generatedPath);
    console.error('Run `npm run build-surrogates` to generate it.');
    process.exit(1);
}

const content = readFileSync(generatedPath, 'utf-8');
if (!content.trim()) {
    console.error('FATAL: surrogates-generated.js is empty.');
    process.exit(1);
}

try {
    const mod = await import(generatedPath);
    const keys = Object.keys(mod.surrogates || {});
    if (keys.length === 0) {
        console.error('FATAL: surrogates-generated.js exports zero surrogates.');
        process.exit(1);
    }
    console.log(`check-surrogates: OK (${keys.length} surrogates)`);
} catch (e) {
    console.error('FATAL: surrogates-generated.js failed to import:', e.message);
    process.exit(1);
}
