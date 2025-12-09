#!/usr/bin/env node
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const fileName = fileURLToPath(import.meta.url);
const dirName = path.dirname(fileName);

/**
 * Run a command as a child process and return a Promise that resolves when it exits.
 * @param {string} cmd
 * @param {string[]} args
 * @param {object} opts
 * @returns {Promise<void>}
 */
function run(cmd, args, opts = {}) {
    return new Promise((resolve, reject) => {
        const proc = spawn(cmd, args, { stdio: 'inherit', shell: true, ...opts });
        proc.on('close', (code) => {
            if (code !== 0) reject(new Error(`${cmd} exited with code ${code}`));
            else resolve();
        });
        proc.on('error', reject);
    });
}

/**
 * Wait for a URL to become available.
 * @param {string} url - The URL to poll
 * @param {number} [timeout=30000] - Timeout in milliseconds
 * @param {number} [interval=500] - Polling interval in milliseconds
 * @returns {Promise<void>}
 */
async function waitForServer(url, timeout = 30000, interval = 500) {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
        try {
            const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
            if (response.ok) return;
        } catch {
            // Server not ready yet
        }
        await new Promise((resolve) => setTimeout(resolve, interval));
    }
    throw new Error(`Timeout waiting for ${url}`);
}

async function main() {
    // 1. Build
    await run('npm', ['run', 'build']);

    // 2. Start server
    const serveProc = spawn('npm', ['run', 'serve'], {
        cwd: path.resolve(dirName, '..'),
        stdio: 'ignore',
        shell: true,
        detached: true,
    });

    // Ensure server is killed on exit
    const cleanup = () => {
        if (serveProc.pid) {
            try {
                if (process.platform === 'win32') {
                    spawn('taskkill', ['/pid', String(serveProc.pid), '/f', '/t']);
                } else {
                    process.kill(-serveProc.pid, 'SIGTERM');
                }
            } catch (e) {}
        }
    };
    process.on('exit', cleanup);
    process.on('SIGINT', () => {
        cleanup();
        process.exit(1);
    });
    process.on('SIGTERM', () => {
        cleanup();
        process.exit(1);
    });

    // 3. Wait for server
    await waitForServer('http://localhost:3220/index.html');

    // 4. Run web-ext
    try {
        await run(
            'npx',
            [
                'web-ext',
                'run',
                '--source-dir=integration-test/extension',
                '--target=chromium',
                '--start-url=http://localhost:3220/index.html',
                '--start-url=https://privacy-test-pages.site',
            ],
            { cwd: path.resolve(dirName, '..') },
        );
    } finally {
        cleanup();
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
