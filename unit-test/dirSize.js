import fastFolderSizeSync from 'fast-folder-size/sync.js'

const buildDirs = ['android', 'chrome', 'chrome-mv3', 'firefox', 'integration', 'windows']
const quotas = [512000, 680960, 512000, 512000, 512000, 512000]
const rootDir = 'build'

describe('Expect build size of', () => {
    for (const build in buildDirs) {
        const dir = `${rootDir}/${buildDirs[build]}`
        const sizeLimit = quotas[build]

        it(`${dir} to be less than ${sizeLimit}`, () => {
            expect(fastFolderSizeSync(dir)).toBeLessThan(sizeLimit)
        })
    }
})
