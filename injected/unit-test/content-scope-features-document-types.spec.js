import { build } from 'esbuild';
import { JSDOM } from 'jsdom';

const permissions = ['sitePermissionsGeolocation', 'sitePermissionsMediaCapture', 'sitePermissionsGeolocationPolicy'];
const observedFeatures = [...permissions, 'gpc', 'favicon', 'cookie'];
const svg = '<svg xmlns="http://www.w3.org/2000/svg"/>';
const xhtml = '<html xmlns="http://www.w3.org/1999/xhtml"><body/></html>';

/** @type {Record<string, string>} */
const bundles = {};

async function buildLoader(injectName) {
    const result = await build({
        entryPoints: [new URL('../src/content-scope-features.js', import.meta.url).pathname],
        bundle: true,
        write: false,
        format: 'iife',
        globalName: 'loader',
        define: { 'import.meta.injectName': JSON.stringify(injectName), 'import.meta.trackerLookup': 'null' },
        plugins: [
            {
                name: 'observable-features',
                setup(esbuild) {
                    esbuild.onResolve({ filter: /^ddg:platformFeatures$/ }, () => ({ path: 'features', namespace: 'test-features' }));
                    esbuild.onLoad({ filter: /.*/, namespace: 'test-features' }, () => ({
                        contents: `
                            class Feature {
                                constructor(name, importConfig, features, args) {
                                    this.name = name;
                                    this.args = args;
                                    this.listenForUpdateChanges = true;
                                    this.listenForConfigUpdates = true;
                                    this.record('construct');
                                }
                                record(method, args) { window.featureCalls.push([method, this.name, args?.stage ?? null]); }
                                getFeatureSettingEnabled() { return !this.args.featureSettings?.skipAdditionalCheck?.includes(this.name); }
                                callLoad() {
                                    this.record('load');
                                    return !this.args.featureSettings?.failedLoads?.includes(this.name);
                                }
                                async callInit(args) { this.record('init', args); }
                                markFeatureAsSkipped() { this.record('skip'); }
                                update(args) { this.record('update', args); }
                                setArgs(args) { this.record('args', args); }
                                onUserPreferencesMerged(args) { this.record('preferences', args); }
                            }
                            export default Object.fromEntries(${JSON.stringify(observedFeatures)}.map(name => ['ddg_feature_' + name, Feature]));
                        `,
                    }));
                },
            },
        ],
    });
    return result.outputFiles[0].text;
}

function createDocument(contentType = 'image/svg+xml', markup = svg, path = '/permissions.svg', injectName = 'integration') {
    const dom = new JSDOM(markup, { contentType, url: `https://example.com${path}`, runScripts: 'outside-only' });
    const window = /** @type {any} */ (dom.window);
    if (contentType !== 'text/html') {
        // JSDOM aliases HTMLDocument to Document even for XML; restore browser constructor identity.
        window.XMLDocument = window.Document;
        window.HTMLDocument = class HTMLDocument {};
    }
    window.performance.mark = () => {};
    window.featureCalls = [];
    window.eval(`${bundles[injectName]}; globalThis.loader = loader;`);
    /** @type {any} */
    const args = {
        site: { domain: 'example.com', url: window.location.href, enabledFeatures: [...observedFeatures] },
        platform: { name: 'ios' },
        messagingContextName: 'contentScopeScripts',
        messageSecret: 'test-secret',
        stage: 'initial',
    };
    return { dom, window, loader: window.loader, args };
}

function calledFeatures(window, method) {
    return window.featureCalls
        .filter(([called]) => called === method)
        .map(([, name]) => name)
        .sort();
}

describe('content-scope loader document types', () => {
    beforeAll(async () => {
        for (const injectName of ['integration', 'apple', 'apple-isolated']) bundles[injectName] = await buildLoader(injectName);
    });

    for (const path of ['/permissions.svg', '/permissions']) {
        it(`runs only permission features through every lifecycle for SVG at ${path}`, async () => {
            const { dom, window, loader, args } = createDocument('image/svg+xml', svg, path);
            try {
                loader.load(args);
                loader.update({ ...args, stage: 'queued' });
                await loader.init(args);
                loader.update({ ...args, stage: 'later' });
                await loader.updateFeatureArgs({ stage: 'preferences' });

                for (const method of ['construct', 'load', 'init', 'args', 'preferences']) {
                    expect(calledFeatures(window, method))
                        .withContext(method)
                        .toEqual([...permissions].sort());
                }
                for (const stage of ['queued', 'later']) {
                    const updated = window.featureCalls.filter(([method, , value]) => method === 'update' && value === stage);
                    expect(updated.map(([, name]) => name).sort())
                        .withContext(stage)
                        .toEqual([...permissions].sort());
                }
            } finally {
                dom.window.close();
            }
        });
    }

    for (const [injectName, expected] of Object.entries({
        apple: ['sitePermissionsGeolocation', 'sitePermissionsMediaCapture'],
        'apple-isolated': ['sitePermissionsGeolocationPolicy'],
    })) {
        it(`preserves the SVG feature split for ${injectName}`, async () => {
            const { dom, window, loader, args } = createDocument('image/svg+xml', svg, '/permissions.svg', injectName);
            try {
                loader.load(args);
                await loader.init(args);
                expect(calledFeatures(window, 'construct')).toEqual([...expected].sort());
                expect(calledFeatures(window, 'init')).toEqual([...expected].sort());
            } finally {
                dom.window.close();
            }
        });
    }

    for (const [contentType, markup, path] of [
        ['text/html', '<html><body/></html>', '/permissions'],
        ['application/xhtml+xml', xhtml, '/permissions'],
        ['text/html', `<html><body>${svg}</body></html>`, '/permissions'],
        ['text/html', '<html><body/></html>', '/permissions.svg'],
    ]) {
        it(`retains ordinary features for ${contentType} at ${path} with ${markup}`, async () => {
            const { dom, window, loader, args } = createDocument(contentType, markup, path);
            try {
                loader.load(args);
                await loader.init(args);
                expect(calledFeatures(window, 'construct')).toEqual([...observedFeatures].sort());
                expect(calledFeatures(window, 'init')).toEqual([...observedFeatures].sort());
            } finally {
                dom.window.close();
            }
        });
    }

    for (const [contentType, markup] of [
        ['application/xml', '<document/>'],
        ['application/xml', svg],
        ['text/xml', svg],
        ['image/svg+xml', '<document/>'],
        ['image/svg+xml', `<document>${svg}</document>`],
        ['image/svg+xml', '<svg/>'],
        ['image/svg+xml', '<document xmlns="http://www.w3.org/2000/svg"/>'],
    ]) {
        it(`excludes every feature for ${contentType} with ${markup}`, async () => {
            const { dom, window, loader, args } = createDocument(contentType, markup);
            try {
                loader.load(args);
                loader.update(args);
                await loader.init(args);
                await loader.updateFeatureArgs({ stage: 'preferences' });
                expect(window.featureCalls).toEqual([]);
            } finally {
                dom.window.close();
            }
        });
    }

    it('excludes unrelated platform-specific features even when protections are disabled', async () => {
        const { dom, window, loader, args } = createDocument();
        try {
            args.site.allowlisted = true;
            loader.load(args);
            await loader.init(args);
            await loader.updateFeatureArgs({ stage: 'preferences' });
            expect(calledFeatures(window, 'construct')).toEqual([...permissions].sort());
            expect(calledFeatures(window, 'init')).toEqual([...permissions].sort());
            expect(calledFeatures(window, 'preferences')).toEqual([...permissions].sort());
        } finally {
            dom.window.close();
        }
    });

    it('preserves feature enablement and failed-load gates on SVG', async () => {
        const { dom, window, loader, args } = createDocument();
        try {
            args.site.enabledFeatures = observedFeatures.filter((name) => name !== 'sitePermissionsGeolocation');
            args.featureSettings = {
                skipAdditionalCheck: ['sitePermissionsMediaCapture'],
                failedLoads: ['sitePermissionsGeolocationPolicy'],
            };
            loader.load(args);
            await loader.init(args);
            await loader.updateFeatureArgs({ stage: 'preferences' });
            expect(calledFeatures(window, 'construct')).toEqual(['sitePermissionsGeolocationPolicy', 'sitePermissionsMediaCapture']);
            expect(calledFeatures(window, 'load')).toEqual(['sitePermissionsGeolocationPolicy']);
            expect(calledFeatures(window, 'init')).toEqual([]);
            expect(calledFeatures(window, 'preferences')).toEqual([]);
        } finally {
            dom.window.close();
        }
    });

    it('captures SVG eligibility before page code can change document properties', async () => {
        const { dom, window, loader, args } = createDocument();
        try {
            Object.defineProperty(window.document, 'contentType', { value: 'text/html' });
            loader.load(args);
            await loader.init(args);
            expect(calledFeatures(window, 'construct')).toEqual([...permissions].sort());
        } finally {
            dom.window.close();
        }
    });
});
