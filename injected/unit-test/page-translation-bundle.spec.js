import { platformSupport } from '../src/features.js';

describe('page translation bundles', () => {
    it('ships pageTranslation only in its own Apple and Android bundles', () => {
        expect(platformSupport['apple-page-translation']).toEqual(['pageTranslation']);
        expect(platformSupport['android-page-translation']).toEqual(['pageTranslation']);
        for (const [bundle, features] of Object.entries(platformSupport)) {
            if (bundle === 'integration' || bundle.endsWith('-page-translation')) continue;
            expect(features).withContext(bundle).not.toContain('pageTranslation');
        }
    });
});
