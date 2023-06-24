import { join } from 'node:path'
import { bundle } from '../scripts/utils/build.js'
import { cwd } from '../scripts/script-utils.js'

const CWD = join(cwd(import.meta.url), '..')

describe('Code generation test', () => {
    it('Given a list of features, only bundle the provided ones', async () => {
        // Uses the snapshots generated in `npm run generate-snapshots` to ensure we don't break the output.
        const actual = await bundle({
            scriptPath: join(CWD, 'unit-test/fixtures/feature-includes.js'),
            name: 'lol',
            platform: 'apple',
            featureNames: ['navigatorInterface', 'gpc']
        })
        const expected = `
    var platformFeatures = {
        ddg_feature_navigatorInterface: NavigatorInterface,
        ddg_feature_gpc: GlobalPrivacyControl
    };`

        expect(actual.includes(expected)).toBeTruthy()
    })
})
