import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { format } from './terminal-colors.js';

function getNvmrcNodeVersion() {
    const nvmrcPath = resolve(process.cwd(), '.nvmrc');
    return readFileSync(nvmrcPath, 'utf8').trim();
}

function getMajorVersion(version) {
    return version.split('.')[0];
}

export function checkNodeVersion() {
    try {
        const requiredNodeVersion = getNvmrcNodeVersion();
        const currentNodeVersion = process.versions.node;
        if (getMajorVersion(currentNodeVersion) === getMajorVersion(requiredNodeVersion)) {
            return;
        }

        const lines = [
            format.error(`Error: This project requires Node.js version ${requiredNodeVersion}`),
            format.error(`You are currently using Node.js ${currentNodeVersion}`),
            format.warning('\nPlease run:'),
            format.command('  nvm use'),
            format.warning('to switch to the correct version defined in `.nvmrc`.\n'),
            format.warning('If the required version is not installed, please install it first by running:'),
            format.command(`  nvm install v${requiredNodeVersion}`),
            format.warning('then run the command above to switch to it.'),
        ];

        console.error(lines.join('\n'));
        process.exit(1);
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.error(format.error('Error: .nvmrc file not found'));
        } else {
            console.error(format.error(`Error: ${error.message}`));
        }
        process.exit(1);
    }
}
