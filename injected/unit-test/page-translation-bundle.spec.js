import { builds } from '../scripts/bundles.js';

describe('page translation bundles', () => {
    it('ships pageTranslation only in its own Apple and Android bundles', () => {
        expect(builds['apple-page-translation'].features).toEqual(['pageTranslation']);
        expect(builds['android-page-translation'].features).toEqual(['pageTranslation']);
        for (const [bundle, { features }] of Object.entries(builds)) {
            if (bundle === 'integration' || bundle.endsWith('-page-translation')) continue;
            expect(features).withContext(bundle).not.toContain('pageTranslation');
        }
    });
});
