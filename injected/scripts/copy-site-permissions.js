import { readFileSync } from 'fs';
import { join } from 'path';
import { cwd, write } from '../../scripts/script-utils.js';

const ROOT = join(cwd(import.meta.url), '..');

/**
 * Site permission scripts are self-contained and loaded by native code, which
 * replaces their `${...}` placeholders. They are copied verbatim, not bundled,
 * so native tests can assert on their exact source.
 */
const scripts = {
    'src/site-permissions/geolocation.js': '../Sources/ContentScopeScripts/dist/sitePermissionsGeolocation.js',
    'src/site-permissions/geolocation-policy.js': '../Sources/ContentScopeScripts/dist/sitePermissionsGeolocationPolicy.js',
    'src/site-permissions/media-capture.js': '../Sources/ContentScopeScripts/dist/sitePermissionsMediaCapture.js',
};

for (const [input, output] of Object.entries(scripts)) {
    write([join(ROOT, output)], readFileSync(join(ROOT, input), 'utf8'));
    console.log('✅', input, output);
}
