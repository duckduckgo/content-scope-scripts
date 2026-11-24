import { bundle } from './utils/build.js';
import { parseArgs, write } from '../../scripts/script-utils.js';
import { builds } from './bundles.js';

async function init() {
    // verify the input
    const requiredFields = [];
    const args = parseArgs(process.argv.slice(2), requiredFields);

    // Enable inline source maps via C_S_S_SOURCEMAPS=1 env var
    const sourcemap = process.env.C_S_S_SOURCEMAPS === '1';

    if (sourcemap) {
        console.log('🗺️  Inline source maps enabled');
    }

    // if a platform was given as an argument, just build that platform
    if (args.platform) {
        const build = builds[args.platform];
        if (!build) {
            throw new Error('unsupported platform: ' + args.platform);
        }
        const output = await bundle({ scriptPath: build.input, platform: args.platform, featureNames: build.features, sourcemap });

        // bundle and write the output
        write([build.output], output);

        return;
    }

    // otherwise, just build them all
    for (const [injectName, build] of Object.entries(builds)) {
        const output = await bundle({ scriptPath: build.input, platform: injectName, featureNames: build.features, sourcemap });
        write(build.output, output);
        console.log('✅', injectName, build.output[0]);
    }
}

init();
