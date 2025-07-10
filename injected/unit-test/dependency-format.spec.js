import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

describe('Dependency format check', () => {
    it('should use a 13-digit numeric tag (not a commit hash or short hash) for @duckduckgo/privacy-configuration', () => {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf-8'));
        const dep = pkg.dependencies['@duckduckgo/privacy-configuration'];
        // Only allow 13-digit numeric tags and not a commit hash or short hash
        expect(dep).toMatch(/^github:duckduckgo\/privacy-configuration#\d{13}$/);
    });
});
