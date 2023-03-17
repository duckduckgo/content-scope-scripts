import { join } from 'node:path'
import { existsSync, cpSync, rmSync } from 'node:fs'
const CWD = new URL('.', import.meta.url).pathname
const ROOT = new URL('../../', import.meta.url).pathname
const BUILD = join(ROOT, 'build')

export const support = {
    example: ['windows']
}

/** @type {{src: string, dest: string}[]} */
const copyJobs = []
const errors = []

for (const [pageName, platforms] of Object.entries(support)) {
    const src = join(CWD, 'pages', pageName)
    if (!existsSync(src)) {
        errors.push(`${src} does not exist`)
        continue
    }
    for (const platform of platforms) {
        copyJobs.push({ src, dest: join(BUILD, platform, 'pages', pageName) })
    }
}

if (errors.length > 0) {
    for (const error of errors) {
        console.log(error)
    }
    process.exit(1)
}

if (errors.length === 0) {
    for (const copyJob of copyJobs) {
        console.log('DRY RUN COPY: ', copyJob)
        rmSync(copyJob.dest, { force: true, recursive: true })
        cpSync(copyJob.src, copyJob.dest, { force: true, recursive: true })
    }
}
