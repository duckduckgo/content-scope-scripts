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
import inliner from 'web-resource-inliner'
import { buildSync } from 'esbuild'
import { cwd } from '../../scripts/script-utils.js'

const CWD = cwd(import.meta.url);
const ROOT = join(CWD, '../../')
const BUILD = join(ROOT, 'build')
const APPLE_BUILD = join(ROOT, 'Sources/ContentScopeScripts/dist')
const NODE_ENV = JSON.stringify(process.env.NODE_ENV || 'production')

export const support = {
    duckplayer: {
        'integration': ['copy', 'build-js'],
        'apple': ['copy', 'build-js', 'inline'],
        'windows': ['copy', 'build-js']
    },
}

/** @type {{src: string, dest: string}[]} */
const copyJobs = []
/** @type {{src: string, kind: "html" | "css"}[]} */
const inlineJobs = []
/** @type {{src: string, dest: string, platform: string}[]} */
const buildJobs = []
const errors = []
const DRY_RUN = false

for (const [pageName, platforms] of Object.entries(support)) {
    const pageSrc = join(CWD, 'pages', pageName, 'src')
    if (!existsSync(pageSrc)) {
        errors.push(`${pageSrc} does not exist. Each page must have a 'src' directory`)
        continue
    }
    for (const [platform, jobs] of Object.entries(platforms)) {

        // output main dir
        const buildDir = platform === 'apple'
            ? APPLE_BUILD
            : join(BUILD, platform)

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
                const jsDest = join(pageOutputDirectory, 'js', 'index.js')
                buildJobs.push({
                    src: jsSrc,
                    dest: jsDest,
                    platform
                })
            }
            if (job === 'inline') {
                const builtHtmlSrc = join(pageOutputDirectory, 'index.html')
                inlineJobs.push({
                    src: builtHtmlSrc,
                    kind: 'html'
                })
            }
        }
    }
}

if (copyJobs.length === 0) {
    console.log('⚠️ nothing to copy. This probably means that there isn\'t any pages to release yet.')
}

if (errors.length > 0) {
    for (const error of errors) {
        console.log(error)
    }
    process.exit(1)
}

if (errors.length === 0) {
    for (const copyJob of copyJobs) {
        console.log('COPY:', relative(ROOT, copyJob.src), relative(ROOT, copyJob.dest))
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
        console.log('BUILD:', relative(ROOT, buildJob.src), relative(ROOT, buildJob.dest))
        console.log('\t- import.meta.env: ', NODE_ENV)
        console.log('\t- import.meta.platform: ', buildJob.platform)
        if (!DRY_RUN) {
            buildSync({
                entryPoints: [buildJob.src],
                outfile: buildJob.dest,
                bundle: true,
                format: 'iife',
                define: {
                    'import.meta.env': NODE_ENV,
                    'import.meta.platform': JSON.stringify(buildJob.platform),
                }
            })
        }
    }
    for (const inlineJob of inlineJobs) {
        console.log('INLINE:', relative(ROOT, inlineJob.src))
        if (!DRY_RUN) {
            // implement build step
            if (inlineJob.kind === 'html') {
                const src = readFileSync(inlineJob.src, 'utf8')
                inliner.html({
                    fileContent: src,
                    relativeTo: join(inlineJob.src, '..'),
                    images: true
                },
            function (err, result) {
                    writeFileSync(inlineJob.src, result)
                })
            }
        }
    }
}
