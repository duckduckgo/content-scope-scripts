import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

describe('Dependency format check', () => {
    it('should use a tag for @duckduckgo/privacy-configuration', () => {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf-8'));
        const dep = pkg.dependencies['@duckduckgo/privacy-configuration'];
        // Accepts only a tag (e.g., #1752154773643), not a commit hash (40 hex chars)
        expect(dep).toMatch(/^github:duckduckgo\/privacy-configuration#\d+$/);
    });
});
