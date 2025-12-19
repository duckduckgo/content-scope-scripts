import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { cwd } from '../../scripts/script-utils.js';

/**
 * Ensure imported assets exist on disk.
 *
 * This catches missing/misnamed CSS files early with a targeted error message,
 * instead of failing later during bundling or native integration.
 */
describe('Imported asset presence', () => {
    // `cwd(import.meta.url)` resolves to `.../injected/unit-test/`
    const INJECTED_ROOT = resolve(cwd(import.meta.url), '..');
    const SRC_ROOT = join(INJECTED_ROOT, 'src');

    /**
     * @param {string} root
     * @returns {string[]}
     */
    function walkFiles(root) {
        /** @type {string[]} */
        const out = [];
        /** @type {string[]} */
        const queue = [root];
        while (queue.length) {
            const next = queue.pop();
            if (!next) continue;
            for (const entry of readdirSync(next)) {
                const full = join(next, entry);
                const st = statSync(full);
                if (st.isDirectory()) {
                    queue.push(full);
                } else if (st.isFile()) {
                    out.push(full);
                }
            }
        }
        return out;
    }

    /**
     * @returns {{ importer: string, specifier: string, resolved: string }[]}
     */
    function collectCssImports() {
        const candidates = walkFiles(SRC_ROOT).filter((p) => /\.(?:[cm]?js|jsx|ts|tsx)$/.test(p));

        /** @type {{ importer: string, specifier: string, resolved: string }[]} */
        const found = [];

        // 1) `import x from './foo.css'` + `import './foo.css'`
        const importFromRe = /import\s+[^'"]*?\sfrom\s*['"]([^'"]+?\.css)['"]/g;
        const importBareRe = /import\s*['"]([^'"]+?\.css)['"]/g;
        // 2) `new URL('./foo.css', import.meta.url)`
        const urlRe = /new\s+URL\s*\(\s*['"]([^'"]+?\.css)['"]\s*,\s*import\.meta\.url\s*\)/g;

        for (const importer of candidates) {
            const text = readFileSync(importer, 'utf8');
            const dir = dirname(importer);

            /** @param {RegExp} re */
            const apply = (re) => {
                re.lastIndex = 0;
                let m;
                while ((m = re.exec(text))) {
                    const specifier = m[1];
                    // Only enforce local/relative specifiers; skip any potential package imports.
                    if (!specifier.startsWith('.')) continue;
                    found.push({
                        importer,
                        specifier,
                        resolved: resolve(dir, specifier),
                    });
                }
            };

            apply(importFromRe);
            apply(importBareRe);
            apply(urlRe);
        }
        return found;
    }

    const cssImports = collectCssImports();

    for (const { importer, specifier, resolved: resolvedPath } of cssImports) {
        const importerShown = relative(INJECTED_ROOT, importer);
        const resolvedShown = relative(INJECTED_ROOT, resolvedPath);
        it(`resolves '${specifier}' imported by '${importerShown}'`, () => {
            expect(existsSync(resolvedPath))
                .withContext(`Missing imported CSS: '${specifier}' from '${importerShown}' -> '${resolvedShown}'`)
                .toBeTrue();
        });
    }

    it('found at least one css import (sanity)', () => {
        expect(cssImports.length).toBeGreaterThan(0);
    });
});
