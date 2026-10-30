import { equal, ok } from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

// The data module imports .data.svg files and JSX icons, which Node can't load, so read it as text.
const dataFile = new URL('../components/suggested-prompts/suggestedPrompts.data.js', import.meta.url);
const publicDir = new URL('../../../public/', import.meta.url);

test.describe('suggested prompts image paths', () => {
    const source = readFileSync(dataFile, 'utf8');
    const paths = [...source.matchAll(/\b(?:image|hoverImage):\s*'([^']+)'/g)].map((match) => match[1]);

    test('finds an image and hover image for every image prompt', () => {
        equal(paths.length, 6);
    });

    for (const path of paths) {
        test(`${path} exists in public/`, () => {
            ok(existsSync(new URL(path, publicDir)), `missing file in public/: ${path}`);
        });
    }
});
