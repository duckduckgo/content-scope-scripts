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
import { join } from 'node:path'
import { existsSync, cpSync, rmSync } from 'node:fs'
const CWD = new URL('.', import.meta.url).pathname
const ROOT = new URL('../../', import.meta.url).pathname
const BUILD = join(ROOT, 'build')

export const support = {
    // example: ['windows']
}

/** @type {{src: string, dest: string}[]} */
const copyJobs = []
const errors = []

for (const [pageName, platforms] of Object.entries(support)) {
    const src = join(CWD, 'pages', pageName, 'public')
    if (!existsSync(src)) {
        errors.push(`${src} does not exist. Each page must have a 'public' directory`)
        continue
    }
    for (const platform of platforms) {
        copyJobs.push({ src, dest: join(BUILD, platform, 'pages', pageName) })
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
        console.log('COPY: ', copyJob)
        rmSync(copyJob.dest, { force: true, recursive: true })
        cpSync(copyJob.src, copyJob.dest, { force: true, recursive: true })
    }
}
