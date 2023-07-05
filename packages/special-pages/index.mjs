/**
 * @module Special Pages
 * @category Special Pages
 *
 * @description
 *
 * A collection of HTML/CSS/JS pages that can be loaded into privileged environments, like `about: pages`
 *
 * - {@link "Example Page"}
 *
 * [[include:packages/special-pages/readme.md]]
 *
 */
import { join, relative } from 'node:path'
import { existsSync, cpSync, rmSync, readFileSync, writeFileSync } from 'node:fs'
import { buildSync } from 'esbuild'
import { cwd, parseArgs } from '../../scripts/script-utils.js'
import inliner from 'web-resource-inliner'
import { buildMonaco } from './monaco.mjs'

const CWD = cwd(import.meta.url);
const ROOT = join(CWD, '../../')
const BUILD = join(ROOT, 'build')
const APPLE_BUILD = join(ROOT, 'Sources/ContentScopeScripts/dist')
const args = parseArgs(process.argv.slice(2), [])
const NODE_ENV = args.env || 'production';
const DEBUG = Boolean(args.debug);

export const support = {
    /** @type {Partial<Record<ImportMeta['injectName'], string[]>>} */
    duckplayer: {
        'integration': ['copy', 'build-js'],
        'windows': ['copy', 'build-js'],
        'apple': ['copy', 'build-js', 'inline-html'],
    },
    'debug-tools': {
        'integration': ['copy', 'build-js'],
        'windows': ['copy', 'build-js'],
        'apple': ['copy', 'build-js'],
    },
}

/** @type {{src: string, dest: string}[]} */
const copyJobs = []
/** @type {{src: string, dest: string, dir: string; injectName: string}[]} */
const buildJobs = []
/** @type {{src: string}[]} */
const inlineJobs = []
const errors = []
const DRY_RUN = false

for (const [pageName, injectNames] of Object.entries(support)) {
    const pageSrc = join(CWD, 'pages', pageName, 'src')
    if (!existsSync(pageSrc)) {
        errors.push(`${pageSrc} does not exist. Each page must have a 'src' directory`)
        continue
    }
    for (const [injectName, jobs] of Object.entries(injectNames)) {

        // output main dir
        const buildDir = injectName === 'apple'
            ? APPLE_BUILD
            : join(BUILD, injectName)

        const pageOutputDirectory = join(buildDir, 'pages', pageName)

        for (let job of jobs) {
            if (job === 'copy') {
                copyJobs.push({
                    src: pageSrc,
                    dest: pageOutputDirectory
                })
            }
            if (job === 'build-js') {
                const jsSrc = join(pageSrc, 'js', 'index.js')
                if (!existsSync(jsSrc)) {
                    errors.push(`${jsSrc} does not exist`)
                    continue
                }
                const jsDir = join(pageOutputDirectory, 'js')
                const jsDest = join(pageOutputDirectory, 'js', 'index.js')
                buildJobs.push({
                    src: jsSrc,
                    dest: jsDest,
                    dir: jsDir,
                    injectName: injectName
                })
            }
            if (job === 'inline-html') {
                const htmlSrc = join(pageOutputDirectory, 'index.html')
                inlineJobs.push({src: htmlSrc})
            }
        }
    }
}

if (copyJobs.length === 0) {
    console.log('⚠️ nothing to copy. This probably means that there isn\'t any pages to release yet.')
}

if (errors.length > 0) {
    exitWithErrors(errors)
}

for (const copyJob of copyJobs) {
    if (DEBUG) console.log('COPY:', relative(ROOT, copyJob.src), relative(ROOT, copyJob.dest));
    if (!DRY_RUN) {
        rmSync(copyJob.dest, {
            force: true,
            recursive: true
        })
        cpSync(copyJob.src, copyJob.dest, {
            force: true,
            recursive: true
        })
    }
}
for (const buildJob of buildJobs) {
    if (DEBUG) console.log('BUILD:', relative(ROOT, buildJob.src), relative(ROOT, buildJob.dest))
    if (DEBUG) console.log('\t- import.meta.env: ', NODE_ENV)
    if (DEBUG) console.log('\t- import.meta.injectName: ', buildJob.injectName)
    if (!DRY_RUN) {
        buildMonaco(buildJob.dir)
        buildSync({
            entryPoints: [buildJob.src],
            outfile: buildJob.dest,
            bundle: true,
            format: 'iife',
            sourcemap: NODE_ENV === 'development' ? 'inline' : undefined,
            loader: {
                '.js': 'jsx',
                '.ttf': 'file'
            },
            define: {
                'import.meta.env': JSON.stringify(NODE_ENV),
                'import.meta.injectName': JSON.stringify(buildJob.injectName),
            }
        })

    }
}
for (const inlineJob of inlineJobs) {
    if (DEBUG) console.log('INLINE:', relative(ROOT, inlineJob.src))
    if (!DRY_RUN) {
        inliner.html({
            fileContent: readFileSync(inlineJob.src, 'utf8'),
            relativeTo: join(inlineJob.src, '..'),
            images: true,
        }, (error, result) => {
            if (error) {
                return exitWithErrors([error])
            }
            writeFileSync(inlineJob.src, result)
        })
    }
}

/**
 * @param {string[]} errors
 */
function exitWithErrors(errors) {
    for (const error of errors) {
        console.log(error)
    }
    process.exit(1)
}
