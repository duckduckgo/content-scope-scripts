/**
 * A collection of HTML/CSS/JS pages that can be loaded into privileged environments, like `about: pages`
 *
 * @module Special Pages
 */
import { join, relative } from 'node:path';
import { existsSync, cpSync, rmSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { buildSync } from 'esbuild';
import { cwd, parseArgs } from '../scripts/script-utils.js';
import inliner from 'web-resource-inliner';
import { baseEsbuildOptions } from './opts.mjs';
import { pages } from './pages.mjs';

const CWD = cwd(import.meta.url);
const ROOT = join(CWD, '../');
const BUILD = join(ROOT, 'build');
const APPLE_BUILD = join(ROOT, 'Sources/ContentScopeScripts/dist');
const APPLE_PAGES_DIR = join(APPLE_BUILD, 'pages');
const APPLE_PAGES_GITKEEP = join(APPLE_PAGES_DIR, '.gitkeep');
const args = parseArgs(process.argv.slice(2), []);
const NODE_ENV = args.env || 'production';
const DEBUG = Boolean(args.debug);

/** @type {{src: string, dest: string, dist: string, injectName: string}[]} */
const copyJobs = [];
/** @type {{outputDir: string, injectName: ImportMeta['injectName'], pageName: string, entry?: string[]}[]} */
const buildJobs = [];
/** @type {{src: string}[]} */
const inlineJobs = [];
const errors = [];
const DRY_RUN = false;

for (const [pageName, injectNames] of Object.entries(pages)) {
    const publicDir = join(CWD, 'pages', pageName, 'public');
    if (!existsSync(publicDir)) {
        errors.push(`${publicDir} does not exist. Each page must have a 'src' directory`);
        continue;
    }
    for (const [injectNameKey, jobs] of Object.entries(injectNames)) {
        // output main dir
        const buildDir = injectNameKey === 'apple' ? APPLE_BUILD : join(BUILD, injectNameKey);

        const pageOutputDirectory = join(buildDir, 'pages', pageName);

        for (const job of jobs) {
            if (job === 'copy') {
                copyJobs.push({
                    src: publicDir,
                    dist: join(publicDir, 'dist'),
                    dest: pageOutputDirectory,
                    injectName: injectNameKey,
                });
            }
            if (job === 'build-js') {
                const outputDir = join(pageOutputDirectory, 'dist');
                buildJobs.push({
                    outputDir,
                    injectName: /** @type {ImportMeta['injectName']} */ (injectNameKey),
                    pageName,
                });
            }
            if (job === 'build-css') {
                const outputDir = join(pageOutputDirectory, 'dist');
                buildJobs.push({
                    outputDir,
                    injectName: /** @type {ImportMeta['injectName']} */ (injectNameKey),
                    pageName,
                    entry: ['index.css'],
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
        rmSync(copyJob.dist, {
            force: true,
            recursive: true,
        });
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
if (!DRY_RUN && !existsSync(APPLE_PAGES_GITKEEP)) {
    mkdirSync(APPLE_PAGES_DIR, { recursive: true });
    writeFileSync(APPLE_PAGES_GITKEEP, '');
}
for (const buildJob of buildJobs) {
    if (DEBUG) console.log('BUILD:', buildJob);
    if (DEBUG) console.log('\t- import.meta.env: ', NODE_ENV);
    if (DEBUG) console.log('\t- import.meta.injectName: ', buildJob.injectName);
    if (!DRY_RUN) {
        /** @type {import('./opts.mjs').EsbuildOptionsConfig} */
        const config = { output: buildJob.outputDir };
        if (buildJob.entry) config.entry = buildJob.entry;
        const opts = baseEsbuildOptions(buildJob.pageName, buildJob.injectName, NODE_ENV, config);
        buildSync(opts);
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
