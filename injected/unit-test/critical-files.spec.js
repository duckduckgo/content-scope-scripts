import { existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { cwd } from '../../scripts/script-utils.js';

/**
 * A growing list of files that *must* exist for native/platform integrations.
 *
 * Rationale: missing assets will fail builds anyway, but this provides a fast,
 * targeted, easy-to-understand failure mode (and avoids confusing build errors).
 */
describe('Critical file presence', () => {
    // `cwd(import.meta.url)` resolves to `.../injected/unit-test/`
    // Keep paths rooted to the injected workspace to avoid ambiguity.
    const INJECTED_ROOT = join(cwd(import.meta.url), '..');

    /** @type {Record<string, string[]>} */
    const requiredFilesByPlatform = {
        // Native DuckPlayer integrations depend on these CSS assets being present.
        apple: [
            'src/features/duckplayer-native/overlays/thumbnail-overlay.css',
            'src/features/duckplayer-native/custom-error/custom-error.css',
        ],
        windows: [
            'src/features/duckplayer-native/overlays/thumbnail-overlay.css',
            'src/features/duckplayer-native/custom-error/custom-error.css',
        ],
        android: [
            'src/features/duckplayer-native/overlays/thumbnail-overlay.css',
            'src/features/duckplayer-native/custom-error/custom-error.css',
        ],
    };

    for (const [platformName, relFiles] of Object.entries(requiredFilesByPlatform)) {
        for (const relFile of relFiles) {
            const absFile = join(INJECTED_ROOT, relFile);
            const shownPath = relative(INJECTED_ROOT, absFile);

            it(`${platformName}: '${shownPath}' exists`, () => {
                expect(existsSync(absFile)).withContext(`Missing critical file for ${platformName}: ${shownPath}`).toBeTrue();
            });
        }
    }
});
