import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';
import { rmfDataExamples } from '../pages/new-tab/app/remote-messaging-framework/mocks/rmf.data.js';

const schemaUrl = new URL('../pages/new-tab/messages/types/rmf-message.json', import.meta.url);
const typesUrl = new URL('../pages/new-tab/types/new-tab.ts', import.meta.url);
const iconsUrl = new URL('../pages/new-tab/public/icons/', import.meta.url);

async function schemaIcons() {
    const schema = JSON.parse(await readFile(schemaUrl, 'utf8'));
    const icons = schema.definitions?.['rmf-icon']?.enum;

    assert.ok(Array.isArray(icons), 'Expected RMF schema to define an rmf-icon enum');
    return [...icons].sort();
}

async function generatedTypeIcons() {
    const source = await readFile(typesUrl, 'utf8');
    const match = /export type RMFIcon =(?<body>[\s\S]*?);/.exec(source);

    assert.ok(match?.groups?.body, 'Expected generated new-tab types to include RMFIcon');
    return [...match.groups.body.matchAll(/"([^"]+)"/g)].map(([, icon]) => icon).sort();
}

function fixtureIcons() {
    return [
        ...new Set(
            Object.values(rmfDataExamples)
                .map(({ content }) => ('icon' in content ? content.icon : null))
                .filter(Boolean),
        ),
    ].sort();
}

describe('RMF icon contract', () => {
    it('keeps the generated RMFIcon type in sync with the message schema', async () => {
        assert.deepEqual(await generatedTypeIcons(), await schemaIcons());
    });

    it('has a bundled SVG asset for every schema icon value', async () => {
        const files = new Set(await readdir(iconsUrl));

        for (const icon of await schemaIcons()) {
            assert.ok(files.has(`${icon}-96.svg`), `Expected public/icons/${icon}-96.svg for RMF schema icon "${icon}"`);
        }
    });

    it('keeps RMF fixtures covering exactly the schema-backed icon values', async () => {
        assert.deepEqual(fixtureIcons(), await schemaIcons());
    });
});
