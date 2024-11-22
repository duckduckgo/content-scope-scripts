/**
 * A collection of HTML/CSS/JS pages that can be loaded into privileged environments, like `about: pages`
 *
 * @module Special Pages
 */
import { join, relative } from 'node:path';
import { existsSync, cpSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { buildSync } from 'esbuild';
import { cwd, parseArgs } from '../scripts/script-utils.js';
import inliner from 'web-resource-inliner';

const CWD = cwd(import.meta.url);
const ROOT = join(CWD, '../');
const BUILD = join(ROOT, 'build');
const APPLE_BUILD = join(ROOT, 'Sources/ContentScopeScripts/dist');
const args = parseArgs(process.argv.slice(2), []);
const NODE_ENV = args.env || 'production';
const DEBUG = Boolean(args.debug);

export const support = {
    /** @type {Partial<Record<ImportMeta['injectName'], string[]>>} */
    duckplayer: {
        integration: ['copy', 'build-js'],
        windows: ['copy', 'build-js'],
        apple: ['copy', 'build-js', 'inline-html'],
        android: ['copy', 'build-js'],
    },
    /** @type {Partial<Record<ImportMeta['injectName'], string[]>>} */
    errorpage: {
        integration: ['copy'],
        apple: ['copy', 'inline-html'],
    },
    /** @type {Partial<Record<ImportMeta['injectName'], string[]>>} */
    onboarding: {
        integration: ['copy', 'build-js'],
        windows: ['copy', 'build-js'],
        apple: ['copy', 'build-js'],
    },
    /** @type {Partial<Record<ImportMeta['injectName'], string[]>>} */
    example: {
        integration: ['copy', 'build-js'],
    },
    /** @type {Partial<Record<ImportMeta['injectName'], string[]>>} */
    'release-notes': {
        integration: ['copy', 'build-js'],
        apple: ['copy', 'build-js'],
    },
    /** @type {Partial<Record<ImportMeta['injectName'], string[]>>} */
    'special-error': {
        integration: ['copy', 'build-js'],
        apple: ['copy', 'build-js', 'inline-html'],
    },
    /** @type {Partial<Record<ImportMeta['injectName'], string[]>>} */
    'new-tab': {
        integration: ['copy', 'build-js'],
        windows: ['copy', 'build-js'],
        apple: ['copy', 'build-js'],
    },
};

/** @type {{src: string, dest: string, injectName: string}[]} */
const copyJobs = [];
/** @type {{entryPoints: string[], outputDir: string, injectName: string, pageName: string}[]} */
const buildJobs = [];
/** @type {{src: string}[]} */
const inlineJobs = [];
const errors = [];
const DRY_RUN = false;

for (const [pageName, injectNames] of Object.entries(support)) {
    const pageSrc = join(CWD, 'pages', pageName, 'src');
    if (!existsSync(pageSrc)) {
        errors.push(`${pageSrc} does not exist. Each page must have a 'src' directory`);
        continue;
    }
    for (const [injectName, jobs] of Object.entries(injectNames)) {
        // output main dir
        const buildDir = injectName === 'apple' ? APPLE_BUILD : join(BUILD, injectName);

        const pageOutputDirectory = join(buildDir, 'pages', pageName);

        for (const job of jobs) {
            if (job === 'copy') {
                copyJobs.push({
                    src: pageSrc,
                    dest: pageOutputDirectory,
                    injectName,
                });
            }
            if (job === 'build-js') {
                const entryPoints = [join(pageSrc, 'js', 'index.js'), join(pageSrc, 'js', 'inline.js')].filter((pathname) =>
                    existsSync(pathname),
                );
                const outputDir = join(pageOutputDirectory, 'js');
                buildJobs.push({
                    entryPoints,
                    outputDir,
                    injectName,
                    pageName,
                });
            }
            if (job === 'inline-html') {
                const htmlSrc = join(pageOutputDirectory, 'index.html');
                inlineJobs.push({ src: htmlSrc });
            }
        }
    }
}

if (copyJobs.length === 0) {
    console.log("⚠️ nothing to copy. This probably means that there isn't any pages to release yet.");
}

if (errors.length > 0) {
    exitWithErrors(errors);
}

for (const copyJob of copyJobs) {
    if (DEBUG) console.log('COPY:', relative(ROOT, copyJob.src), relative(ROOT, copyJob.dest));
    if (!DRY_RUN) {
        rmSync(copyJob.dest, {
            force: true,
            recursive: true,
        });
        cpSync(copyJob.src, copyJob.dest, {
            force: true,
            recursive: true,
        });
    }
}
for (const buildJob of buildJobs) {
    if (DEBUG) console.log('BUILD:', buildJob.entryPoints, relative(ROOT, buildJob.outputDir));
    if (DEBUG) console.log('\t- import.meta.env: ', NODE_ENV);
    if (DEBUG) console.log('\t- import.meta.injectName: ', buildJob.injectName);
    if (!DRY_RUN) {
        const output = buildSync({
            entryPoints: buildJob.entryPoints,
            outdir: buildJob.outputDir,
            bundle: true,
            // metafile: true,
            // minify: true,
            // splitting: true,
            // external: ['../assets/img/*'],
            format: 'esm',
            sourcemap: NODE_ENV === 'development',
            loader: {
                '.js': 'jsx',
                '.module.css': 'local-css',
                '.svg': 'file',
                '.data.svg': 'dataurl',
                '.jpg': 'file',
                '.png': 'file',
                '.riv': 'file',
            },
            define: {
                'import.meta.env': JSON.stringify(NODE_ENV),
                'import.meta.injectName': JSON.stringify(buildJob.injectName),
                'import.meta.pageName': JSON.stringify(buildJob.pageName),
            },
            dropLabels: buildJob.injectName === 'integration' ? [] : ['$INTEGRATION'],
        });
        if (output.metafile) {
            const meta = JSON.stringify(output.metafile, null, 2);
            writeFileSync(join(buildJob.outputDir, 'metafile.json'), meta);
        }
    }
}
for (const inlineJob of inlineJobs) {
    if (DEBUG) console.log('INLINE:', relative(ROOT, inlineJob.src));
    if (!DRY_RUN) {
        inliner.html(
            {
                fileContent: readFileSync(inlineJob.src, 'utf8'),
                relativeTo: join(inlineJob.src, '..'),
                images: true,
            },
            (error, result) => {
                if (error) {
                    return exitWithErrors([error]);
                }
                writeFileSync(inlineJob.src, result);
            },
        );
    }
}

/**
 * @param {string[]} errors
 */
function exitWithErrors(errors) {
    for (const error of errors) {
        console.log(error);
    }
    process.exit(1);
}
