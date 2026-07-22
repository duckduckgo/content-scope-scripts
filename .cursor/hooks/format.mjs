#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Cursor afterFileEdit hook: format the edited file with Prettier.
 * Implemented in Node (not bash) to avoid spawning visible terminals on Windows.
 */

/**
 * @param {string} root
 * @param {string} filePath
 * @returns {boolean}
 */
function isUnderRoot(root, filePath) {
    const rel = relative(resolve(root), resolve(filePath));
    return rel !== '' && !rel.startsWith('..') && !isAbsolute(rel);
}

/**
 * @returns {string}
 */
function getRepoRoot() {
    const result = spawnSync('git', ['rev-parse', '--show-toplevel'], {
        encoding: 'utf8',
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'ignore'],
    });

    if (result.status === 0 && result.stdout?.trim()) {
        return result.stdout.trim();
    }

    return resolve(fileURLToPath(new URL('.', import.meta.url)), '../..');
}

/**
 * @returns {Promise<string>}
 */
async function readStdin() {
    const chunks = [];
    for await (const chunk of process.stdin) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks).toString('utf8');
}

async function main() {
    const payload = (await readStdin()).trim();
    if (!payload) {
        return;
    }

    /** @type {unknown} */
    let data;
    try {
        data = JSON.parse(payload);
    } catch {
        return;
    }

    if (!data || typeof data !== 'object') {
        return;
    }

    const record = /** @type {{ file_path?: string; tool_input?: { file_path?: string } }} */ (data);
    const filePath = record.file_path ?? record.tool_input?.file_path;
    if (!filePath) {
        return;
    }

    const repoRoot = getRepoRoot();
    const absolutePath = isAbsolute(filePath) ? filePath : resolve(repoRoot, filePath);

    if (!existsSync(absolutePath)) {
        return;
    }

    const prettierTarget = isUnderRoot(repoRoot, absolutePath) ? relative(repoRoot, absolutePath) : absolutePath;
    const ignorePath = join(repoRoot, '.prettierignore');
    const require = createRequire(join(repoRoot, 'package.json'));
    const prettierCli = require.resolve('prettier/bin/prettier.cjs');

    spawnSync(process.execPath, [prettierCli, '--ignore-path', ignorePath, '--ignore-unknown', '--write', prettierTarget], {
        cwd: repoRoot,
        stdio: 'ignore',
        windowsHide: true,
    });
}

main().catch(() => {
    // Fail open: formatting must not block edits.
});
