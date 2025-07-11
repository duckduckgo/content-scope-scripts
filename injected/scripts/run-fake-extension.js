#!/usr/bin/env node
import { spawn } from 'child_process';
import waitOn from 'wait-on';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

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
 * Parse command line arguments
 */
function parseArgs() {
    const args = process.argv.slice(2);
    /** @type {{
        config: string | null,
        features: string[],
        startUrl: string,
        help: boolean
    }} */
    const options = {
        config: null,
        features: [],
        startUrl: 'http://localhost:3220/index.html',
        help: false
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        switch (arg) {
            case '--config':
            case '-c':
                options.config = args[++i];
                break;
            case '--features':
            case '-f':
                options.features = args[++i].split(',').map(f => f.trim());
                break;
            case '--start-url':
            case '-u':
                options.startUrl = args[++i];
                break;
            case '--help':
            case '-h':
                options.help = true;
                break;
        }
    }

    return options;
}

/**
 * Display help information
 */
function showHelp() {
    console.log(`
Usage: npm run fake-extension [options]

Options:
  -c, --config <path>     Path to configuration JSON file (relative to integration-test/test-pages/)
  -f, --features <list>   Comma-separated list of features to enable
  -u, --start-url <url>   Starting URL for the extension (default: http://localhost:3220/index.html)
  -h, --help             Show this help message

Examples:
  # Run with telemetry feature enabled
  npm run fake-extension --features telemetry

  # Run with specific config file
  npm run fake-extension --config telemetry/config/telemetry.json

  # Run with multiple features
  npm run fake-extension --features telemetry,duckPlayer,webCompat

  # Run with custom start URL
  npm run fake-extension --start-url http://localhost:3220/telemetry/index.html
`);
}

async function main() {
    const options = parseArgs();

    if (options.help) {
        showHelp();
        return;
    }

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
    await waitOn({ resources: ['http://localhost:3220/index.html'] });

    // 4. Prepare web-ext arguments and configuration
    const webExtArgs = [
        'web-ext',
        'run',
        '--source-dir=integration-test/extension',
        '--target=chromium',
        '--start-url=' + options.startUrl,
        '--start-url=https://privacy-test-pages.site',
    ];

    // Prepare configuration data for chrome.storage
    let configData = null;
    let featuresData = null;

    if (options.config) {
        try {
            const configPath = path.resolve(dirName, '../integration-test/test-pages', options.config);
            const configContent = fs.readFileSync(configPath, 'utf8');
            configData = JSON.parse(configContent);
        } catch (error) {
            console.error('Failed to load config file:', error);
            process.exit(1);
        }
    }

    if (options.features.length > 0) {
        featuresData = options.features;
    }

    // Create a temporary background script with embedded configuration
    const backgroundScript = `// Background script for integration test extension
// Handles configuration loading and communication with content scripts

let configData = ${configData ? JSON.stringify(configData) : 'null'};
let enabledFeatures = ${featuresData ? JSON.stringify(featuresData) : '[]'};

// Set configuration in storage on startup
chrome.storage.local.set({
    cssConfig: configData,
    cssFeatures: enabledFeatures
}).then(() => {
    console.log('Background: Configuration set in storage', { configData, enabledFeatures });
}).catch((error) => {
    console.error('Background: Failed to set configuration:', error);
});

// Listen for installation to set up initial config
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        loadConfigurationFromStorage();
    }
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'GET_CONFIG') {
        sendResponse({
            config: configData,
            enabledFeatures: enabledFeatures
        });
        return true; // Keep message channel open for async response
    }
});

// Load configuration from chrome.storage (set by command line args)
async function loadConfigurationFromStorage() {
    try {
        const result = await chrome.storage.local.get(['cssConfig', 'cssFeatures']);
        if (result.cssConfig) {
            configData = result.cssConfig;
        }
        if (result.cssFeatures) {
            enabledFeatures = result.cssFeatures;
        }
        console.log('Background: Loaded config from storage', { configData, enabledFeatures });
    } catch (error) {
        console.warn('Background: Failed to load config from storage:', error);
    }
}

// Listen for storage changes (in case config is updated)
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
        if (changes.cssConfig) {
            configData = changes.cssConfig.newValue;
            console.log('Background: Config updated', configData);
        }
        if (changes.cssFeatures) {
            enabledFeatures = changes.cssFeatures.newValue;
            console.log('Background: Features updated', enabledFeatures);
        }
    }
});

// Initialize on startup
loadConfigurationFromStorage();
`;

    const backgroundScriptPath = path.resolve(dirName, '../integration-test/extension/background.js');
    fs.writeFileSync(backgroundScriptPath, backgroundScript);

    // 5. Run web-ext
    try {
        await run(
            'npx',
            webExtArgs,
            { 
                cwd: path.resolve(dirName, '..')
            },
        );
    } finally {
        cleanup();
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
