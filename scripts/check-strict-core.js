#!/usr/bin/env node
/**
 * Checks that injected core source files pass TypeScript strict mode.
 *
 * Runs tsc with tsconfig.strict-core.json and filters output to only core files.
 * Feature files are checked transitively but their errors are not reported here.
 */
import { execSync } from 'node:child_process';

const CORE_FILES = new Set([
    'injected/entry-points/apple.js',
    'injected/entry-points/windows.js',
    'injected/src/canvas.js',
    'injected/src/captured-globals.js',
    'injected/src/config-feature.js',
    'injected/src/content-feature.js',
    'injected/src/content-scope-features.js',
    'injected/src/cookie.js',
    'injected/src/crypto.js',
    'injected/src/dom-utils.js',
    'injected/src/features.js',
    'injected/src/globals.d.ts',
    'injected/src/performance.js',
    'injected/src/sendmessage-transport.js',
    'injected/src/timer-utils.js',
    'injected/src/trackers.js',
    'injected/src/type-utils.js',
    'injected/src/url-change.js',
    'injected/src/utils.js',
    'injected/src/wrapper-utils.js',
]);

let output;
try {
    output = execSync('npx tsc -p tsconfig.strict-core.json --noEmit', {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
    });
} catch (e) {
    // tsc exits non-zero when there are errors — capture stderr+stdout
    output = (e.stdout || '') + (e.stderr || '');
}

const errors = output.split('\n').filter((line) => {
    const match = line.match(/^([^(]+)\(/);
    return match && CORE_FILES.has(match[1]);
});

if (errors.length > 0) {
    console.error(`\n❌ ${errors.length} strict-mode error(s) in injected core files:\n`);
    errors.forEach((e) => console.error(e));
    process.exit(1);
} else {
    console.log('✅ All injected core files pass strict TypeScript checking.');
}
